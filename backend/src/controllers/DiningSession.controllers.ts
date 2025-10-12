// import { type Request, type Response, type NextFunction } from "express";
// import QRCode from "qrcode";
// import express from "express";
// import "dotenv/config";
// import { eq, and, isNotNull } from "drizzle-orm";
// import { dbClient } from "@db/client.js";
// import {
//   users,
//   admins,
//   diningSessions,
//   groups,
//   group_members,
//   menuItems,
//   orders,
// } from "@db/schema.js";

// export const startSession = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { tableId } = req.body;

//     if (!tableId || typeof tableId !== "number") {
//       return res.status(400).json({
//         error: "Table ID is required and must be a number",
//       });
//     }

//     // ดึง admin  ใช้เอามา testing
//     const admins = await dbClient.query.admins.findFirst();
//     if (!admins) {
//       return res.status(400).json({ error: "No admin found in database" });
//     }

//     const existingSession = await dbClient.query.diningSessions?.findFirst({
//       where: and(
//         eq(diningSessions.tableId, tableId),
//         eq(diningSessions.status, "ACTIVE")
//       ),
//     });

//     if (existingSession) {
//       return res.status(400).json({
//         error: `Table ${tableId} already has an active dining session`,
//       });
//     }

//     const startedAt = new Date();

//     const newSession = await dbClient
//       .insert(diningSessions)
//       .values({
//         tableId: tableId,
//         startedAt: startedAt,
//         status: "ACTIVE",
//         qrCode: "PENDING" , // QR Code URL will be generated later  // เเก้ให้ testing ผ่าน 
//         total_customers: 0,
//         createdAt: new Date(),
//         openedByAdminId: admins.id, // เเก้ให้ testing ผ่าน
//       })
//       .returning({
//         id: diningSessions.id,
//         table_id: diningSessions.tableId,
//         started_at: diningSessions.startedAt,
//         status: diningSessions.status,
//         total_customers: diningSessions.total_customers,
//         created_at: diningSessions.createdAt,
//       });

//     // QR Data setup with dynamic URL based on frontend environment
//     const qrData = {
//       sessionId: newSession[0].id,
//       tableId: tableId,
//       url: `${
//         process.env.PRODUCTION_FRONTEND_URL || "http://10.0.0.51:5173"
//       }/tables/${newSession[0].id}`, // Dynamic URL ไม่รุ้อ่ะ
//     };

//     // Generate QR Code
//     const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
//       errorCorrectionLevel: "M",
//       margin: 1,
//       color: {
//         dark: "#000000",
//         light: "#FFFFFF",
//       },
//       width: 256,
//     });

//     // Update session with generated QR Code
//     await dbClient
//       .update(diningSessions)
//       .set({ qrCode: qrCodeDataURL })
//       .where(eq(diningSessions.id, newSession[0].id));

//     res.status(201).json({
//       message: `Dining session started successfully for table ${tableId}`,
//       session: {
//         id: newSession[0].id,
//         tableId: newSession[0].table_id,
//         startedAt: newSession[0].started_at,
//         status: newSession[0].status,
//         totalCustomers: newSession[0].total_customers,
//         createdAt: newSession[0].created_at,
//         qrCode: qrCodeDataURL, // Send back QR Code URL
//         qrData: qrData,
//       },
//     });
//   } catch (err) {
//     next(err);
//   }
// };

// export const getQrForTable = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { tableId } = req.params;
//     if (!tableId || isNaN(Number(tableId))) {
//       return res.status(400).json({ error: "Invalid table ID" });
//     }

//     const tableIdNum = Number(tableId);

//     const [session] = await dbClient
//       .select()
//       .from(diningSessions)
//       .where(
//         and(
//           eq(diningSessions.tableId, tableIdNum),
//           eq(diningSessions.status, "ACTIVE")
//         )
//       )
//       .limit(1);

//     if (!session) {
//       return res
//         .status(404)
//         .json({ error: "No active session found for this table" });
//     }

//     if (session.qrCode) {
//       return res.json({ qrCode: session.qrCode });
//     } else {
//       return res
//         .status(404)
//         .json({ error: "QR Code not found for this table" });
//     }
//   } catch (error) {
//     next(error);
//   }
// };

// export const endSession = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { sessionId, tableId } = req.body;

//     if (!sessionId && !tableId) {
//       return res.status(400).json({
//         error: "Either Session ID or Table ID is required",
//       });
//     }

//     let whereCondition;
//     if (sessionId) {
//       whereCondition = and(
//         eq(diningSessions.id, sessionId),
//         eq(diningSessions.status, "ACTIVE")
//       );
//     } else {
//       whereCondition = and(
//         eq(diningSessions.tableId, tableId),
//         eq(diningSessions.status, "ACTIVE")
//       );
//     }

//     const activeSession = await dbClient.query.diningSessions.findFirst({
//       where: whereCondition,
//     });

//     if (!activeSession) {
//       return res.status(400).json({
//         error: sessionId
//           ? `No active session found with ID ${sessionId}`
//           : `No active session found for table ${tableId}`,
//       });
//     }

//     let totalCustomers = 0;
//     const group = await dbClient.query.groups.findFirst({
//       where: eq(groups.table_id, activeSession.tableId),
//     });

//     if (group) {
//       const members = await dbClient.query.group_members.findMany({
//         where: eq(group_members.group_id, group.id),
//       });
//       totalCustomers = members?.length || 0;
//     }

//     const endedAt = new Date();
//     const updatedSession = await dbClient
//       .update(diningSessions)
//       .set({
//         endedAt: endedAt,
//         status: "COMPLETED",
//         total_customers: totalCustomers,
//       })
//       .where(eq(diningSessions.id, activeSession.id))
//       .returning({
//         id: diningSessions.id,
//         table_id: diningSessions.tableId,
//         started_at: diningSessions.startedAt,
//         ended_at: diningSessions.endedAt,
//         status: diningSessions.status,
//         total_customers: diningSessions.total_customers,
//         created_at: diningSessions.createdAt,
//       });

//     const duration =
//       endedAt.getTime() -
//       (activeSession.startedAt?.getTime() || endedAt.getTime());
//     const durationMinutes = Math.round(duration / (1000 * 60));

//     res.json({
//       message: `Dining session ended successfully for table ${activeSession.tableId}`,
//       session: {
//         id: updatedSession[0].id,
//         tableId: updatedSession[0].table_id,
//         startedAt: updatedSession[0].started_at,
//         endedAt: updatedSession[0].ended_at,
//         status: updatedSession[0].status,
//         totalCustomers: updatedSession[0].total_customers,
//         createdAt: updatedSession[0].created_at,
//         durationMinutes: durationMinutes,
//       },
//     });
//   } catch (err) {
//     next(err);
//   }
// };

// export const getActiveSession = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const activeSessions = await dbClient.query.diningSessions.findMany({
//       where: eq(diningSessions.status, "ACTIVE"),
//       orderBy: [diningSessions.createdAt],
//     });

//     const sessionsWithGroups = await Promise.all(
//       activeSessions.map(async (session) => {
//         const group = await dbClient.query.groups.findFirst({
//           where: eq(groups.table_id, session.tableId),
//         });

//         let members: Array<{ id: number; name: string; note: string | null }> =
//           [];
//         if (group) {
//           const groupMembers = await dbClient.query.group_members.findMany({
//             where: eq(group_members.group_id, group.id),
//           });
//           members =
//             groupMembers?.map((member) => ({
//               id: member.id,
//               name: member.name,
//               note: member.note,
//             })) || [];
//         }

//         return {
//           id: session.id,
//           tableId: session.tableId,
//           startedAt: session.startedAt,
//           status: session.status,
//           totalCustomers: members.length,
//           createdAt: session.createdAt,
//           group: group
//             ? {
//                 id: group.id,
//                 members: members,
//               }
//             : null,
//         };
//       })
//     );

//     res.json({
//       activeSessions: sessionsWithGroups,
//       totalActiveTables: activeSessions.length,
//     });
//   } catch (err) {
//     next(err);
//   }
// };

// export const getSession = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const sessionId = parseInt(req.params.sessionId);
//     if (isNaN(sessionId)) {
//       return res.status(400).json({ error: "Invalid Session ID" });
//     }
//     const session = await dbClient
//       .select({
//         id: diningSessions.id,
//         tableId: diningSessions.tableId,
//         startedAt: diningSessions.startedAt,
//         endedAt: diningSessions.endedAt,
//         status: diningSessions.status,
//         totalCustomers: diningSessions.total_customers,
//         createdAt: diningSessions.createdAt,
//         qrCode: diningSessions.qrCode,
//       })
//       .from(diningSessions)
//       .where(eq(diningSessions.id, sessionId))
//       .limit(1);

//     const sessionData = session[0];
//     if (!sessionData) {
//       return res.status(404).json({ error: "Session not found" });
//     }

//     if (!sessionData.qrCode) {
//       return res
//         .status(500)
//         .json({ error: "Session QR Code data is missing in the database." });
//     }
//     const group = await dbClient.query.groups.findFirst({
//       where: eq(groups.table_id, sessionData.tableId),
//     });

//     const members = group
//       ? (
//           await dbClient.query.group_members.findMany({
//             where: eq(group_members.group_id, group.id),
//           })
//         ).map((member) => ({
//           id: member.id,
//           name: member.name,
//           note: member.note,
//         }))
//       : [];
//     const duration =
//       sessionData.endedAt && sessionData.startedAt
//         ? Math.round(
//             (sessionData.endedAt.getTime() - sessionData.startedAt.getTime()) /
//               60000
//           )
//         : null;
//     res.json({
//       session: {
//         id: sessionData.id,
//         tableId: sessionData.tableId,
//         startedAt: sessionData.startedAt,
//         endedAt: sessionData.endedAt,
//         qrCode: sessionData.qrCode,
//         status: sessionData.status,
//         totalCustomers: members.length,
//         createdAt: sessionData.createdAt,
//         durationMinutes: duration,
//       },
//       group: group
//         ? {
//             id: group.id,
//             members,
//           }
//         : null,
//     });
//   } catch (err) {
//     next(err);
//   }
// };

import { type Request, type Response, type NextFunction } from "express";
import QRCode from "qrcode";
import "dotenv/config";
import { eq, and } from "drizzle-orm";
import { dbClient } from "@db/client.js";
import {
  admins,
  diningSessions,
  groups,
  group_members,
} from "@db/schema.js";

/**
 *  START SESSION
 */
export const startSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tableId } = req.body;

    if (!tableId || typeof tableId !== "number") {
      return res.status(200).json({
        success: false,
        message: "Table ID is required and must be a number",
      });
    }

    const admin = await dbClient.query.admins.findFirst();
    if (!admin) {
      return res.status(200).json({
        success: false,
        message: "No admin found in database",
      });
    }

    const existingSession = await dbClient.query.diningSessions.findFirst({
      where: and(
        eq(diningSessions.tableId, tableId),
        eq(diningSessions.status, "ACTIVE")
      ),
    });

    if (existingSession) {
      return res.status(200).json({
        success: false,
        message: `Table ${tableId} already has an active dining session`,
        session: existingSession,
      });
    }

    const startedAt = new Date();

    const [newSession] = await dbClient
      .insert(diningSessions)
      .values({
        tableId,
        startedAt,
        status: "ACTIVE",
        qrCode: "PENDING",
        total_customers: 0,
        createdAt: new Date(),
        openedByAdminId: admin.id,
      })
      .returning({
        id: diningSessions.id,
        table_id: diningSessions.tableId,
        started_at: diningSessions.startedAt,
        status: diningSessions.status,
        total_customers: diningSessions.total_customers,
        created_at: diningSessions.createdAt,
      });

    const qrData = {
      sessionId: newSession.id,
      tableId,
      url: `${process.env.PRODUCTION_FRONTEND_URL || "http://10.0.0.51:5173"}/tables/${newSession.id}`,
    };

    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
      errorCorrectionLevel: "M",
      margin: 1,
      color: { dark: "#000000", light: "#FFFFFF" },
      width: 256,
    });

    await dbClient
      .update(diningSessions)
      .set({ qrCode: qrCodeDataURL })
      .where(eq(diningSessions.id, newSession.id));

    return res.status(201).json({
      success: true,
      message: `Dining session started successfully for table ${tableId}`,
      session: {
        id: newSession.id,
        tableId: newSession.table_id,
        startedAt: newSession.started_at,
        status: newSession.status,
        totalCustomers: newSession.total_customers,
        createdAt: newSession.created_at,
        qrCode: qrCodeDataURL,
        qrData,
      },
    });
  } catch (err) {
    console.error("startSession error:", err);
    return res.status(200).json({
      success: false,
      message: "Failed to start session",
      error: (err as Error).message,
    });
  }
};

/**
 *  GET QR FOR TABLE
 */
export const getQrForTable = async (req: Request, res: Response) => {
  const { tableId } = req.params;

  if (!tableId || isNaN(Number(tableId))) {
    return res.status(200).json({
      success: false,
      message: "Invalid table ID",
    });
  }

  const tableIdNum = Number(tableId);

  const [session] = await dbClient
    .select()
    .from(diningSessions)
    .where(
      and(
        eq(diningSessions.tableId, tableIdNum),
        eq(diningSessions.status, "ACTIVE")
      )
    )
    .limit(1);

  if (!session) {
    return res.status(200).json({
      success: false,
      message: "No active session found for this table",
    });
  }

  if (!session.qrCode) {
    return res.status(200).json({
      success: false,
      message: "QR Code not found for this table",
    });
  }

  return res.status(200).json({
    success: true,
    qrCode: session.qrCode,
  });
};

/**
 *  END SESSION
 */
export const endSession = async (req: Request, res: Response) => {
  try {
    const { sessionId, tableId } = req.body;

    if (!sessionId && !tableId) {
      return res.status(200).json({
        success: false,
        message: "Either Session ID or Table ID is required",
      });
    }

    const whereCondition = sessionId
      ? and(eq(diningSessions.id, sessionId), eq(diningSessions.status, "ACTIVE"))
      : and(eq(diningSessions.tableId, tableId), eq(diningSessions.status, "ACTIVE"));

    const activeSession = await dbClient.query.diningSessions.findFirst({
      where: whereCondition,
    });

    if (!activeSession) {
      return res.status(200).json({
        success: false,
        message: sessionId
          ? `No active session found with ID ${sessionId}`
          : `No active session found for table ${tableId}`,
      });
    }

    let totalCustomers = 0;
    const group = await dbClient.query.groups.findFirst({
      where: eq(groups.table_id, activeSession.tableId),
    });

    if (group) {
      const members = await dbClient.query.group_members.findMany({
        where: eq(group_members.group_id, group.id),
      });
      totalCustomers = members.length || 0;
    }

    const endedAt = new Date();

    const [updatedSession] = await dbClient
      .update(diningSessions)
      .set({
        endedAt,
        status: "COMPLETED",
        total_customers: totalCustomers,
      })
      .where(eq(diningSessions.id, activeSession.id))
      .returning();

    const duration =
      endedAt.getTime() - (activeSession.startedAt?.getTime() || endedAt.getTime());
    const durationMinutes = Math.round(duration / (1000 * 60));

    return res.status(200).json({
      success: true,
      message: `Dining session ended successfully for table ${activeSession.tableId}`,
      session: { ...updatedSession, durationMinutes },
    });
  } catch (err) {
    console.error("endSession error:", err);
    return res.status(200).json({
      success: false,
      message: "Failed to end session",
      error: (err as Error).message,
    });
  }
};

/**
 *  GET ACTIVE SESSION
 */
export const getActiveSession = async (req: Request, res: Response) => {
  try {
    const activeSessions = await dbClient.query.diningSessions.findMany({
      where: eq(diningSessions.status, "ACTIVE"),
      orderBy: [diningSessions.createdAt],
    });

    const sessionsWithGroups = await Promise.all(
      activeSessions.map(async (session) => {
        const group = await dbClient.query.groups.findFirst({
          where: eq(groups.table_id, session.tableId),
        });

        const members = group
          ? await dbClient.query.group_members.findMany({
              where: eq(group_members.group_id, group.id),
            })
          : [];

        return {
          ...session,
          totalCustomers: members.length,
          group: group
            ? {
                id: group.id,
                members: members.map((m) => ({
                  id: m.id,
                  name: m.name,
                  note: m.note,
                })),
              }
            : null,
        };
      })
    );

    return res.status(200).json({
      success: true,
      activeSessions: sessionsWithGroups,
      totalActiveTables: activeSessions.length,
    });
  } catch (err) {
    console.error("getActiveSession error:", err);
    return res.status(200).json({
      success: false,
      message: "Failed to get active sessions",
      error: (err as Error).message,
    });
  }
};

/**
 *  GET SINGLE SESSION
 */
export const getSession = async (req: Request, res: Response) => {
  try {
    const sessionId = parseInt(req.params.sessionId);
    if (isNaN(sessionId)) {
      return res.status(200).json({ success: false, message: "Invalid Session ID" });
    }

    const session = await dbClient
      .select({
        id: diningSessions.id,
        tableId: diningSessions.tableId,
        startedAt: diningSessions.startedAt,
        endedAt: diningSessions.endedAt,
        status: diningSessions.status,
        totalCustomers: diningSessions.total_customers,
        createdAt: diningSessions.createdAt,
        qrCode: diningSessions.qrCode,
      })
      .from(diningSessions)
      .where(eq(diningSessions.id, sessionId))
      .limit(1);

    const sessionData = session[0];
    if (!sessionData) {
      return res.status(200).json({ success: false, message: "Session not found" });
    }

    if (!sessionData.qrCode) {
      return res.status(200).json({
        success: false,
        message: "Session QR Code data is missing in the database",
      });
    }

    const group = await dbClient.query.groups.findFirst({
      where: eq(groups.table_id, sessionData.tableId),
    });

    const members = group
      ? await dbClient.query.group_members.findMany({
          where: eq(group_members.group_id, group.id),
        })
      : [];

    const duration =
      sessionData.endedAt && sessionData.startedAt
        ? Math.round(
            (sessionData.endedAt.getTime() - sessionData.startedAt.getTime()) / 60000
          )
        : null;

    return res.status(200).json({
      success: true,
      session: { ...sessionData, durationMinutes: duration },
      group: group
        ? {
            id: group.id,
            members: members.map((m) => ({
              id: m.id,
              name: m.name,
              note: m.note,
            })),
          }
        : null,
    });
  } catch (err) {
    console.error("getSession error:", err);
    return res.status(200).json({
      success: false,
      message: "Failed to fetch session",
      error: (err as Error).message,
    });
  }
};
