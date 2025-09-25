import bcrypt from "bcrypt";
import session from "express-session";
import QRCode from "qrcode";
import express from "express";
import "dotenv/config";
import { eq, and, isNotNull } from "drizzle-orm";
import { dbClient } from "@db/client.js";
import {
  users,
  admin,
  dining_sessions,
  groups,
  group_members,
  menu_items,
  orders,
  order_items,
} from "@db/schema.js";

const app = express();

app.use(express.json());

app.use(
  session({
    secret:
      process.env.SESSION_SECRET || "your-secret-key-change-this-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

declare module "express-session" {
  interface SessionData {
    userId?: number;
    userType?: "user" | "admin";
    email?: string;
  }
}

const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

const requireAuth = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
};

// Middleware สำหรับตรวจสอบว่าเป็น admin
const requireAdmin = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (req.session.userType !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }

  next();
};

// POST /auth/register - Register new user
app.post("/auth/register", async (req, res, next) => {
  try {
    const { name, email, password, userType = "user" } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Name, email, and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters long",
      });
    }

    const existingUser = await dbClient.query.users.findFirst({
      where: eq(users.email, email),
    });

    const existingAdmin = await dbClient.query.admin.findFirst({
      where: eq(admin.email, email),
    });

    if (existingUser || existingAdmin) {
      return res.status(400).json({
        error: "User with this email already exists",
      });
    }

    const hashedPassword = await hashPassword(password);

    let newUser;
    if (userType === "admin") {
      newUser = await dbClient
        .insert(admin)
        .values({
          name,
          email,
          password: hashedPassword,
        })
        .returning({
          id: admin.id,
          name: admin.name,
          email: admin.email,
          createdAt: admin.createdAt,
        });
    } else {
      newUser = await dbClient
        .insert(users)
        .values({
          name,
          email,
          password: hashedPassword,
        })
        .returning({
          id: users.id,
          name: users.name,
          email: users.email,
          createdAt: users.createdAt,
        });
    }

    req.session.userId = newUser[0].id;
    req.session.userType = userType === "admin" ? "admin" : "user";
    req.session.email = newUser[0].email;

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser[0].id,
        name: newUser[0].name,
        email: newUser[0].email,
        userType: userType === "admin" ? "admin" : "user",
        createdAt: newUser[0].createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /auth/login - Login user
app.post("/auth/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }
    let user = await dbClient.query.users.findFirst({
      where: eq(users.email, email),
    });
    let userType: "user" | "admin" = "user";
    if (!user) {
      user = await dbClient.query.admin.findFirst({
        where: eq(admin.email, email),
      });
      userType = "admin";
    }

    if (!user) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    req.session.userId = user.id;
    req.session.userType = userType;
    req.session.email = user.email;

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        userType: userType,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /auth/logout - Logout user
app.post("/auth/logout", requireAuth, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Could not log out" });
    }
    res.clearCookie("connect.sid");
    res.json({ message: "Logout successful" });
  });
});

// GET /auth/me - Get current user info
app.get("/auth/me", requireAuth, async (req, res, next) => {
  try {
    const { userId, userType } = req.session;

    const user =
      userType === "admin"
        ? await dbClient.query.admin.findFirst({
            where: eq(admin.id, userId!),
            columns: {
              id: true,
              name: true,
              email: true,
              createdAt: true,
            },
          })
        : await dbClient.query.users.findFirst({
            where: eq(users.id, userId!),
            columns: {
              id: true,
              name: true,
              email: true,
              createdAt: true,
            },
          });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      user: {
        ...user,
        userType,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /dining_session/start - admin only
app.post("/dining_session/start", requireAdmin, async (req, res, next) => {
  try {
    const { tableId } = req.body;

    if (!tableId || typeof tableId !== "number") {
      return res.status(400).json({
        error: "Table ID is required and must be a number",
      });
    }

    const existingSession = await dbClient.query.dining_sessions?.findFirst({
      where: and(
        eq(dining_sessions.table_id, tableId),
        eq(dining_sessions.status, "ACTIVE")
      ),
    });

    if (existingSession) {
      return res.status(400).json({
        error: `Table ${tableId} already has an active dining session`,
      });
    }

    const startedAt = new Date();

    const newSession = await dbClient
      .insert(dining_sessions)
      .values({
        table_id: tableId,
        started_at: startedAt,
        status: "ACTIVE",
        total_customers: 0,
        created_at: new Date(),
      })
      .returning({
        id: dining_sessions.id,
        table_id: dining_sessions.table_id,
        started_at: dining_sessions.started_at,
        status: dining_sessions.status,
        total_customers: dining_sessions.total_customers,
        created_at: dining_sessions.created_at,
      });

    const qrData = {
      sessionId: newSession[0].id,
      tableId: tableId,
      url: `${process.env.CLIENT_URL || "http://localhost:3000"}/table/${
        newSession[0].id
      }`,
    };

    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
      errorCorrectionLevel: "M",
      margin: 1,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
      width: 256,
    });

    res.status(201).json({
      message: `Dining session started successfully for table ${tableId}`,
      session: {
        id: newSession[0].id,
        tableId: newSession[0].table_id,
        startedAt: newSession[0].started_at,
        status: newSession[0].status,
        totalCustomers: newSession[0].total_customers,
        createdAt: newSession[0].created_at,
        qrCode: qrCodeDataURL,
        qrData: qrData,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /dining_session/end - admin only
app.post("/dining_session/end", requireAdmin, async (req, res, next) => {
  try {
    const { sessionId, tableId } = req.body;

    if (!sessionId && !tableId) {
      return res.status(400).json({
        error: "Either Session ID or Table ID is required",
      });
    }

    let whereCondition;
    if (sessionId) {
      whereCondition = and(
        eq(dining_sessions.id, sessionId),
        eq(dining_sessions.status, "ACTIVE")
      );
    } else {
      whereCondition = and(
        eq(dining_sessions.table_id, tableId),
        eq(dining_sessions.status, "ACTIVE")
      );
    }

    const activeSession = await dbClient.query.dining_sessions.findFirst({
      where: whereCondition,
    });

    if (!activeSession) {
      return res.status(400).json({
        error: sessionId
          ? `No active session found with ID ${sessionId}`
          : `No active session found for table ${tableId}`,
      });
    }

    let totalCustomers = 0;
    const group = await dbClient.query.groups.findFirst({
      where: eq(groups.table_id, activeSession.table_id),
    });

    if (group) {
      const members = await dbClient.query.group_members.findMany({
        where: eq(group_members.group_id, group.id),
      });
      totalCustomers = members?.length || 0;
    }

    const endedAt = new Date();
    const updatedSession = await dbClient
      .update(dining_sessions)
      .set({
        ended_at: endedAt,
        status: "COMPLETED",
        total_customers: totalCustomers,
      })
      .where(eq(dining_sessions.id, activeSession.id))
      .returning({
        id: dining_sessions.id,
        table_id: dining_sessions.table_id,
        started_at: dining_sessions.started_at,
        ended_at: dining_sessions.ended_at,
        status: dining_sessions.status,
        total_customers: dining_sessions.total_customers,
        created_at: dining_sessions.created_at,
      });

    const duration =
      endedAt.getTime() -
      (activeSession.started_at?.getTime() || endedAt.getTime());
    const durationMinutes = Math.round(duration / (1000 * 60));

    res.json({
      message: `Dining session ended successfully for table ${activeSession.table_id}`,
      session: {
        id: updatedSession[0].id,
        tableId: updatedSession[0].table_id,
        startedAt: updatedSession[0].started_at,
        endedAt: updatedSession[0].ended_at,
        status: updatedSession[0].status,
        totalCustomers: updatedSession[0].total_customers,
        createdAt: updatedSession[0].created_at,
        durationMinutes: durationMinutes,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /dining_session/active  - admin only
app.get("/dining_session/active", requireAdmin, async (req, res, next) => {
  try {
    const activeSessions = await dbClient.query.dining_sessions.findMany({
      where: eq(dining_sessions.status, "ACTIVE"),
      orderBy: [dining_sessions.created_at],
    });

    const sessionsWithGroups = await Promise.all(
      activeSessions.map(async (session) => {
        const group = await dbClient.query.groups.findFirst({
          where: eq(groups.table_id, session.table_id),
        });

        let members: Array<{ id: number; name: string; note: string | null }> =
          [];
        if (group) {
          const groupMembers = await dbClient.query.group_members.findMany({
            where: eq(group_members.group_id, group.id),
          });
          members =
            groupMembers?.map((member) => ({
              id: member.id,
              name: member.name,
              note: member.note,
            })) || [];
        }

        return {
          id: session.id,
          tableId: session.table_id,
          startedAt: session.started_at,
          status: session.status,
          totalCustomers: members.length,
          createdAt: session.created_at,
          group: group
            ? {
                id: group.id,
                members: members,
              }
            : null,
        };
      })
    );

    res.json({
      activeSessions: sessionsWithGroups,
      totalActiveTables: activeSessions.length,
    });
  } catch (err) {
    next(err);
  }
});

// GET /dining_session/:sessionId
app.get("/dining_session/:sessionId", async (req, res, next) => {
  try {
    const sessionId = parseInt(req.params.sessionId);

    if (isNaN(sessionId)) {
      return res.status(400).json({
        error: "Invalid Session ID",
      });
    }

    const session = await dbClient.query.dining_sessions.findFirst({
      where: eq(dining_sessions.id, sessionId),
    });

    if (!session) {
      return res.status(404).json({
        error: "Session not found",
      });
    }

    const group = await dbClient.query.groups.findFirst({
      where: eq(groups.table_id, session.table_id),
    });

    let members: Array<{ id: number; name: string; note: string | null }> = [];
    if (group) {
      const groupMembers = await dbClient.query.group_members.findMany({
        where: eq(group_members.group_id, group.id),
      });
      members =
        groupMembers?.map((member) => ({
          id: member.id,
          name: member.name,
          note: member.note,
        })) || [];
    }

    let duration: number | null = null;
    if (session.ended_at && session.started_at) {
      const durationMs =
        session.ended_at.getTime() - session.started_at.getTime();
      duration = Math.round(durationMs / (1000 * 60));
    }

    res.json({
      session: {
        id: session.id,
        tableId: session.table_id,
        startedAt: session.started_at,
        endedAt: session.ended_at,
        status: session.status,
        totalCustomers: session.total_customers || members.length,
        createdAt: session.created_at,
        durationMinutes: duration,
      },
      group: group
        ? {
            id: group.id,
            members: members,
          }
        : null,
    });
  } catch (err) {
    next(err);
  }
});

// POST /group/create
app.post("/group/create", async (req, res, next) => {
  try {
    const { sessionId, tableId } = req.body;

    console.log("Received data:", { sessionId, tableId });

    if (!sessionId || !tableId) {
      return res.status(400).json({
        error: "Session ID and Table ID are required",
      });
    }

    console.log("Checking dining session...");
    const diningSession = await dbClient.query.dining_sessions.findFirst({
      where: and(
        eq(dining_sessions.id, sessionId),
        eq(dining_sessions.table_id, tableId),
        eq(dining_sessions.status, "ACTIVE")
      ),
    });

    console.log("Dining session found:", diningSession);

    if (!diningSession) {
      return res.status(400).json({
        error: "Invalid session or table ID, or session is not active",
      });
    }

    console.log("Checking existing group...");
    const existingGroup = await dbClient.query.groups.findFirst({
      where: eq(groups.table_id, tableId),
    });

    console.log("Existing group found:", existingGroup);

    if (existingGroup) {
      return res.status(400).json({
        error: `Group for table ${tableId} already exists`,
        group: {
          id: existingGroup.id,
          tableId: existingGroup.table_id,
          createdAt: existingGroup.created_at,
        },
      });
    }

    console.log("Creating new group...");
    const newGroup = await dbClient
      .insert(groups)
      .values({
        table_id: tableId,
        creator_user_id: null,
        created_at: new Date(),
      })
      .returning({
        id: groups.id,
        table_id: groups.table_id,
        creator_user_id: groups.creator_user_id,
        created_at: groups.created_at,
      });

    console.log("New group created:", newGroup);

    res.status(201).json({
      message: `Group created successfully for table ${tableId}`,
      group: {
        id: newGroup[0].id,
        tableId: newGroup[0].table_id,
        creatorUserId: newGroup[0].creator_user_id,
        createdAt: newGroup[0].created_at,
      },
    });
  } catch (err) {
    console.error("Error in /group/create:", err);
    next(err);
  }
});

// POST /group_members/add
app.post("/group_members/add", async (req, res, next) => {
  try {
    const { name, groupId, userId, note } = req.body;

    if (!name || !groupId) {
      return res.status(400).json({
        error: "Name and Group ID are required",
      });
    }

    const group = await dbClient.query.groups?.findFirst({
      where: eq(groups.id, groupId),
    });

    if (!group) {
      return res.status(400).json({
        error: "Group not found",
      });
    }

    const newMember = await dbClient
      .insert(group_members)
      .values({
        name,
        group_id: groupId,
        user_id: userId || null,
        note: note || null,
      })
      .returning({
        id: group_members.id,
        name: group_members.name,
        group_id: group_members.group_id,
        user_id: group_members.user_id,
        note: group_members.note,
      });

    res.status(201).json({
      message: "Member added successfully",
      member: {
        id: newMember[0].id,
        name: newMember[0].name,
        groupId: newMember[0].group_id,
        userId: newMember[0].user_id,
        note: newMember[0].note,
      },
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /group_members/:groupId
app.delete("/group_members/:groupId", async (req, res, next) => {
  try {
    const groupId = parseInt(req.params.groupId);

    if (isNaN(groupId)) {
      return res.status(400).json({
        error: "Invalid Group ID",
      });
    }

    const group = await dbClient.query.groups?.findFirst({
      where: eq(groups.id, groupId),
    });

    if (!group) {
      return res.status(400).json({
        error: "Group not found",
      });
    }

    await dbClient
      .delete(group_members)
      .where(eq(group_members.group_id, groupId));

    res.json({
      message: `All members removed from group ${groupId} successfully`,
    });
  } catch (err) {
    next(err);
  }
});

// GET /group_members/:groupId
app.get("/group_members/:groupId", async (req, res, next) => {
  try {
    const groupId = parseInt(req.params.groupId);

    if (isNaN(groupId)) {
      return res.status(400).json({
        error: "Invalid Group ID",
      });
    }

    const group = await dbClient.query.groups?.findFirst({
      where: eq(groups.id, groupId),
    });

    if (!group) {
      return res.status(400).json({
        error: "Group not found",
      });
    }

    const members = await dbClient.query.group_members?.findMany({
      where: eq(group_members.group_id, groupId),
    });

    res.json({
      group: {
        id: group.id,
        tableId: group.table_id,
        creatorUserId: group.creator_user_id,
        createdAt: group.created_at,
      },
      members:
        members?.map((member) => ({
          id: member.id,
          name: member.name,
          userId: member.user_id,
          note: member.note,
        })) || [],
    });
  } catch (err) {
    next(err);
  }
});

// GET /orders - ดู orders - admin only
app.get("/orders", requireAdmin, async (req, res, next) => {
  try {
    const {
      status,
      tableId,
      diningSessionId,
      limit = 50,
      offset = 0,
    } = req.query;

    let orderWhereConditions: any[] = [];

    if (status && typeof status === "string") {
      orderWhereConditions.push(eq(orders.status, status as any));
    }

    if (tableId && !isNaN(Number(tableId))) {
      orderWhereConditions.push(eq(orders.table_id, Number(tableId)));
    }

    if (diningSessionId && !isNaN(Number(diningSessionId))) {
      orderWhereConditions.push(
        eq(orders.dining_session_id, Number(diningSessionId))
      );
      orderWhereConditions.push(isNotNull(orders.dining_session_id));
    }

    const allOrders = await dbClient.query.orders.findMany({
      where:
        orderWhereConditions.length > 0
          ? and(...orderWhereConditions)
          : undefined,
      orderBy: [orders.created_at],
      limit: Number(limit),
      offset: Number(offset),
    });

    const ordersWithItems = await Promise.all(
      allOrders.map(async (order) => {
        const items = await dbClient.query.order_items.findMany({
          where: eq(order_items.order_id, order.id),
        });

        let groupInfo = null;
        if (order.group_id) {
          const group = await dbClient.query.groups.findFirst({
            where: eq(groups.id, order.group_id),
          });
          if (group) {
            const members = await dbClient.query.group_members.findMany({
              where: eq(group_members.group_id, group.id),
            });
            groupInfo = {
              id: group.id,
              tableId: group.table_id,
              memberCount: members?.length || 0,
            };
          }
        }

        let diningSession = null;
        if (order.dining_session_id) {
          diningSession = await dbClient.query.dining_sessions.findFirst({
            where: eq(dining_sessions.id, order.dining_session_id),
          });
        }

        return {
          id: order.id,
          tableId: order.table_id,
          groupId: order.group_id,
          userId: order.user_id,
          diningSessionId: order.dining_session_id,
          status: order.status,
          createdAt: order.created_at,
          items:
            items?.map((item) => ({
              id: item.id,
              menuItemId: item.menu_item_id,
              quantity: item.quantity,
              note: item.note,
            })) || [],
          group: groupInfo,
          diningSession: diningSession
            ? {
                id: diningSession.id,
                status: diningSession.status,
                startedAt: diningSession.started_at,
                endedAt: diningSession.ended_at,
              }
            : null,
        };
      })
    );

    const totalOrders = await dbClient.query.orders.findMany({
      where:
        orderWhereConditions.length > 0
          ? and(...orderWhereConditions)
          : undefined,
    });

    const statusCounts: { [key: string]: number } = {
      PENDING: 0,
      PREPARING: 0,
      SERVED: 0,
      COMPLETED: 0,
    };

    ordersWithItems.forEach((order) => {
      const status = order.status;
      if (status && statusCounts.hasOwnProperty(status)) {
        statusCounts[status]++;
      }
    });

    res.json({
      orders: ordersWithItems,
      statistics: {
        totalOrders: ordersWithItems.length,
        statusCounts,
        totalItems: ordersWithItems.reduce(
          (sum, order) =>
            sum +
            order.items.reduce(
              (itemSum, item) => itemSum + (item.quantity || 0),
              0
            ),
          0
        ),
      },
    });
  } catch (err) {
    console.error("Error in /orders:", err);
    next(err);
  }
});

// GET /orders/:orderId - admin only
app.get("/orders/:orderId", requireAdmin, async (req, res, next) => {
  try {
    const orderId = parseInt(req.params.orderId);

    if (isNaN(orderId)) {
      return res.status(400).json({
        error: "Invalid Order ID",
      });
    }

    const order = await dbClient.query.orders.findFirst({
      where: eq(orders.id, orderId),
    });

    if (!order) {
      return res.status(404).json({
        error: "Order not found",
      });
    }

    const items = await dbClient.query.order_items.findMany({
      where: eq(order_items.order_id, orderId),
    });

    let groupInfo = null;
    if (order.group_id) {
      const group = await dbClient.query.groups.findFirst({
        where: eq(groups.id, order.group_id),
      });
      if (group) {
        const members = await dbClient.query.group_members.findMany({
          where: eq(group_members.group_id, group.id),
        });
        groupInfo = {
          id: group.id,
          tableId: group.table_id,
          creatorUserId: group.creator_user_id,
          createdAt: group.created_at,
          members:
            members?.map((member) => ({
              id: member.id,
              name: member.name,
              userId: member.user_id,
              note: member.note,
            })) || [],
        };
      }
    }

    let diningSession = null;
    if (order.dining_session_id) {
      diningSession = await dbClient.query.dining_sessions.findFirst({
        where: eq(dining_sessions.id, order.dining_session_id),
      });
    }

    let userInfo = null;
    if (order.user_id) {
      const user = await dbClient.query.users.findFirst({
        where: eq(users.id, order.user_id),
        columns: {
          id: true,
          name: true,
          email: true,
        },
      });
      userInfo = user;
    }

    res.json({
      order: {
        id: order.id,
        tableId: order.table_id,
        groupId: order.group_id,
        userId: order.user_id,
        diningSessionId: order.dining_session_id,
        status: order.status,
        createdAt: order.created_at,
        items:
          items?.map((item) => ({
            id: item.id,
            menuItemId: item.menu_item_id,
            quantity: item.quantity,
            note: item.note,
          })) || [],
        group: groupInfo,
        user: userInfo,
        diningSession: diningSession
          ? {
              id: diningSession.id,
              tableId: diningSession.table_id,
              status: diningSession.status,
              startedAt: diningSession.started_at,
              endedAt: diningSession.ended_at,
              totalCustomers: diningSession.total_customers,
            }
          : null,
      },
    });
  } catch (err) {
    console.error("Error in /orders/:orderId:", err);
    next(err);
  }
});

// PUT /orders/:orderId/status - admin only
app.put("/orders/:orderId/status", requireAdmin, async (req, res, next) => {
  try {
    const orderId = parseInt(req.params.orderId);
    const { status } = req.body;

    if (isNaN(orderId)) {
      return res.status(400).json({
        error: "Invalid Order ID",
      });
    }

    const validStatuses = ["PENDING", "PREPARING", "SERVED", "COMPLETED"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        error: "Invalid status. Must be one of: " + validStatuses.join(", "),
      });
    }

    const existingOrder = await dbClient.query.orders.findFirst({
      where: eq(orders.id, orderId),
    });

    if (!existingOrder) {
      return res.status(404).json({
        error: "Order not found",
      });
    }

    const updatedOrder = await dbClient
      .update(orders)
      .set({ status })
      .where(eq(orders.id, orderId))
      .returning({
        id: orders.id,
        table_id: orders.table_id,
        group_id: orders.group_id,
        user_id: orders.user_id,
        dining_session_id: orders.dining_session_id,
        status: orders.status,
        created_at: orders.created_at,
      });

    res.json({
      message: `Order ${orderId} status updated to ${status}`,
      order: {
        id: updatedOrder[0].id,
        tableId: updatedOrder[0].table_id,
        groupId: updatedOrder[0].group_id,
        userId: updatedOrder[0].user_id,
        diningSessionId: updatedOrder[0].dining_session_id,
        status: updatedOrder[0].status,
        createdAt: updatedOrder[0].created_at,
      },
    });
  } catch (err) {
    console.error("Error in /orders/:orderId/status:", err);
    next(err);
  }
});

app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).json({ error: "Something went wrong!" });
  }
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Listening on port ${PORT}`);
});
