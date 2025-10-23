import { type Request, type Response, type NextFunction } from "express";
import QRCode from "qrcode";
import express from "express";
import "dotenv/config";
import { eq, and, isNotNull, asc, desc, sql } from "drizzle-orm";
import { dbClient } from "@db/client.js";
import {
  users,
  admins,
  diningSessions,
  groups,
  group_members,
  menuItems,
  orders,
  orderItems,
  tables,
  bills,
} from "@db/schema.js";

export const startSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tableId } = req.body;
    const adminId = req.session.userId;

    console.log('Starting session for table RECORD ID:', tableId);

    if (!tableId || typeof tableId !== "number") {
      return res.status(400).json({
        error: "Table ID is required and must be a number",
      });
    }

    const tableRecord = await dbClient.query.tables.findFirst({
      where: eq(tables.id, tableId),
    });

    console.log('Table record found:', tableRecord);

    if (!tableRecord) {
      return res.status(400).json({
        error: `Table ID ${tableId} not found.`,
      });
    }

    if (typeof adminId !== 'number') {
      throw new Error('adminId is required and must be a number');
    }

    const existingSession = await dbClient.query.diningSessions?.findFirst({
      where: and(
        eq(diningSessions.tableId, tableRecord.id),
        eq(diningSessions.status, "ACTIVE")
      ),
    });

    if (existingSession) {
      return res.status(400).json({
        error: `Table ${tableRecord.number} already has an active dining session`,
      });
    }

    const startedAt = new Date();

    const newSession = await dbClient
      .insert(diningSessions)
      .values({
        tableId: tableRecord.id, // ใช้ tableRecord.id
        startedAt: startedAt,
        status: "ACTIVE",
        qrCode: "",
        totalCustomers: 0,
        createdAt: new Date(),
        openedByAdminId: adminId,
      })
      .returning({
        id: diningSessions.id,
        tableId: diningSessions.tableId,
        startedAt: diningSessions.startedAt,
        status: diningSessions.status,
        totalCustomers: diningSessions.totalCustomers,
        createdAt: diningSessions.createdAt,
      });

    console.log('✅ Dining session created:', newSession[0]);

    // 2. อัพเดทสถานะโต๊ะ
    await dbClient
      .update(tables)
      .set({ status: "OCCUPIED" })
      .where(eq(tables.id, tableRecord.id));

    // 3. สร้าง group สำหรับ session นี้
    const [newGroup] = await dbClient
      .insert(groups)
      .values({
        tableId: tableId,
        creatorUserId: null,
      })
      .returning();

    console.log('✅ Group created:', newGroup);

    // 4. สร้าง owner member โดยใช้ isTableAdmin = true
    const [ownerMember] = await dbClient
      .insert(group_members)
      .values({
        groupId: newGroup.id,
        diningSessionId: newSession[0].id,
        name: 'Main Customer',
        isTableAdmin: true, // ช้ isTableAdmin แทน role
        joinedAt: new Date(),
        note: 'Auto-created owner member'
      })
      .returning();

    console.log('✅ Owner member created:', ownerMember);

    // 5. QR Data setup
    const qrData = {
      sessionId: newSession[0].id,
      tableNumber: tableRecord.number,
      path: `/tables/${tableRecord.number}`,
    };

    const fullUrlForQR = `http://10.124.2.5:5173/tables/${newSession[0].id}`;
    console.log('🔍 QR Code URL:', fullUrlForQR);

    // Generate QR Code
    const qrCodeDataURL = await QRCode.toDataURL(fullUrlForQR, {
      errorCorrectionLevel: "M",
      margin: 1,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
      width: 256,
    });

    // Update session ด้วย generated QR Code
    await dbClient
      .update(diningSessions)
      .set({ qrCode: qrCodeDataURL })
      .where(eq(diningSessions.id, newSession[0].id));

    // 6. ส่ง response พร้อมข้อมูลทั้งหมด
    res.status(201).json({
      message: `Dining session started successfully for table ${tableRecord.number}`,
      session: {
        id: newSession[0].id,
        tableId: tableRecord.id,
        tableNumber: tableRecord.number,
        startedAt: newSession[0].startedAt,
        status: newSession[0].status,
        totalCustomers: newSession[0].totalCustomers,
        createdAt: newSession[0].createdAt,
        qrCode: qrCodeDataURL,
        qrData: qrData,
        openedByAdminId: adminId,
      },
      group: newGroup,
      ownerMember: {
        id: ownerMember.id,
        name: ownerMember.name,
        isTableAdmin: ownerMember.isTableAdmin
      }
    });

  } catch (err) {
    console.error("Error starting session:", err);
    next(err);
  }
};
// export const startSession = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const { tableId } = req.body; // table record id (เช่น 14ในดาต้าเบส)
//     const adminId = req.session.userId;

//     console.log('Starting session for table RECORD ID:', tableId);

//     if (!tableId || typeof tableId !== "number") {
//       return res.status(400).json({
//         error: "Table ID is required and must be a number",
//       });
//     }

//     const tableRecord = await dbClient.query.tables.findFirst({
//       where: eq(tables.id, tableId), // ใช้ id แทน number
//     });

//     console.log('🔍 Table record found:', tableRecord);

//     if (!tableRecord) {
//       return res.status(400).json({
//         error: `Table ID ${tableId} not found.`,
//       });
//     }

//     const existingSession = await dbClient.query.diningSessions?.findFirst({
//       where: and(
//         eq(diningSessions.tableId, tableRecord.id),
//         eq(diningSessions.status, "ACTIVE")
//       ),
//     });

//     if (existingSession) {
//       return res.status(400).json({
//         error: `Table ${tableRecord.number} already has an active dining session`,
//       });
//     }

//     const startedAt = new Date();

//     const newSession = await dbClient
//       .insert(diningSessions)
//       .values({
//         tableId: tableRecord.id, // ใช้ tableRecord.id
//         startedAt: startedAt,
//         status: "ACTIVE",
//         qrCode: "",
//         totalCustomers: 0,
//         createdAt: new Date(),
//         openedByAdminId: adminId,
//       })
//       .returning({
//         id: diningSessions.id,
//         tableId: diningSessions.tableId,
//         startedAt: diningSessions.startedAt,
//         status: diningSessions.status,
//         totalCustomers: diningSessions.totalCustomers,
//         createdAt: diningSessions.createdAt,
//       });

//     console.log('✅ Dining session created:', newSession[0]);

//     await dbClient
//       .update(tables)
//       .set({ status: "OCCUPIED" })
//       .where(eq(tables.id, tableRecord.id));

//     // QR Data setup
//     const qrData = {
//       sessionId: newSession[0].id,
//       tableNumber: tableRecord.number, // ใช้ table number จาก record
//       path: `/tables/${tableRecord.number}`, // ใช้ table number ใน URL
//     };

//     const fullUrlForQR = `https://0a885cac0563b52cffe9b7f2b8d43d25.serveo.net/tables/${newSession[0].id}`;
//     console.log('🔍 QR Code URL:', fullUrlForQR);

//     // Generate QR Code
//     const qrCodeDataURL = await QRCode.toDataURL(fullUrlForQR, {
//       errorCorrectionLevel: "M",
//       margin: 1,
//       color: {
//         dark: "#000000",
//         light: "#FFFFFF",
//       },
//       width: 256,
//     });

//     // Update session ด้วย generated QR Code
//     await dbClient
//       .update(diningSessions)
//       .set({ qrCode: qrCodeDataURL })
//       .where(eq(diningSessions.id, newSession[0].id));

//     res.status(201).json({
//       message: `Dining session started successfully for table ${tableRecord.number}`,
//       session: {
//         id: newSession[0].id,
//         tableId: tableRecord.id, // table record id
//         tableNumber: tableRecord.number, // table number
//         startedAt: newSession[0].startedAt,
//         status: newSession[0].status,
//         totalCustomers: newSession[0].totalCustomers,
//         createdAt: newSession[0].createdAt,
//         qrCode: qrCodeDataURL,
//         qrData: qrData,
//         openedByAdminId: adminId,
//       },
//     });
//     //เพิ่มให้สร้างgoupใมห่ไปด้วย
//      const [newGroup] = await dbClient
//       .insert(groups)
//       .values({
//         tableId: tableId,
//         creatorUserId: null,
//       })
//       .returning();

//     res.status(201).json({
//       session: newSession,
//       group: newGroup // ส่ง group ใหม่กลับไปด้วย
//     });

//   } catch (err) {
//     console.error("Error starting session:", err);
//     next(err);
//   }
// };

export const getQrForTable = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { tableId } = req.params;
    if (!tableId || isNaN(Number(tableId))) {
      return res.status(400).json({ error: "Invalid table ID" });
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
      return res
        .status(404)
        .json({ error: "No active session found for this table" });
    }

    if (session.qrCode) {
      return res.json({ qrCode: session.qrCode });
    } else {
      return res
        .status(404)
        .json({ error: "QR Code not found for this table" });
    }
  } catch (error) {
    next(error);
  }
};

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
//       where: eq(groups.tableId, activeSession.tableId),
//     });

//     if (group) {
//       const members = await dbClient.query.group_members.findMany({
//         where: eq(group_members.groupId, group.id),
//       });
//       totalCustomers = members?.length || 0;
//     }

//     const endedAt = new Date();
//     const updatedSession = await dbClient
//       .update(diningSessions)
//       .set({
//         endedAt: endedAt,
//         status: "COMPLETED",
//         totalCustomers: totalCustomers,
//       })
//       .where(eq(diningSessions.id, activeSession.id))
//       .returning({
//         id: diningSessions.id,
//         tableId: diningSessions.tableId,
//         startedAt: diningSessions.startedAt,
//         endedAt: diningSessions.endedAt,
//         status: diningSessions.status,
//         totalCustomers: diningSessions.totalCustomers,
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
//         tableId: updatedSession[0].tableId,
//         startedAt: updatedSession[0].startedAt,
//         endedAt: updatedSession[0].endedAt,
//         status: updatedSession[0].status,
//         totalCustomers: updatedSession[0].totalCustomers,
//         createdAt: updatedSession[0].created_at,
//         durationMinutes: durationMinutes,
//       },
//     });
//   } catch (err) {
//     next(err);
//   }
// };
export const endSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { sessionId, tableId } = req.body;

    if (!sessionId && !tableId) {
      return res.status(400).json({
        error: "Either Session ID or Table ID is required",
      });
    }

    // สร้างเงื่อนไขค้นหา
    const whereCondition = sessionId
      ? and(
        eq(diningSessions.id, sessionId),
        eq(diningSessions.status, "ACTIVE")
      )
      : and(
        eq(diningSessions.tableId, tableId),
        eq(diningSessions.status, "ACTIVE")
      );

    const activeSession = await dbClient.query.diningSessions.findFirst({
      where: whereCondition,
    });

    if (!activeSession) {
      return res.status(400).json({
        error: sessionId
          ? `No active session found with ID ${sessionId}`
          : `No active session found for table ${tableId}`,
      });
    }

    // 🧮 รวมยอดจาก bills
    const [sumResult] = await dbClient
      .select({ total: sql<number>`COALESCE(SUM(${bills.total}), 0)` })
      .from(bills)
      .where(eq(bills.diningSessionId, activeSession.id));

    const totalAmount = sumResult?.total ?? 0;

    // 👥 หาจำนวนสมาชิก
    let totalCustomers = 0;
    const group = await dbClient.query.groups.findFirst({
      where: eq(groups.tableId, activeSession.tableId),
    });

    if (group) {
      const members = await dbClient.query.group_members.findMany({
        where: eq(group_members.groupId, group.id),
      });
      totalCustomers = members?.length || 0;
    }

    // 🕒 เวลาปิดโต๊ะ
    const endedAt = new Date();

    // ✅ อัปเดตข้อมูลลง DB
    const [updatedSession] = await dbClient
      .update(diningSessions)
      .set({
        endedAt,
        status: "COMPLETED",
        totalCustomers,
        total: totalAmount, // ✅ รวมยอดเก็บไว้ใน session
      })
      .where(eq(diningSessions.id, activeSession.id))
      .returning({
        id: diningSessions.id,
        tableId: diningSessions.tableId,
        startedAt: diningSessions.startedAt,
        endedAt: diningSessions.endedAt,
        status: diningSessions.status,
        totalCustomers: diningSessions.totalCustomers,
        total: diningSessions.total,
        created_at: diningSessions.createdAt,
      });

    // ⏱ คำนวณเวลาทั้งหมด
    const durationMinutes = Math.round(
      (endedAt.getTime() -
        (activeSession.startedAt?.getTime() || endedAt.getTime())) /
      60000
    );

    res.json({
      message: `Dining session ended successfully for table ${activeSession.tableId}`,
      session: {
        id: updatedSession.id,
        tableId: updatedSession.tableId,
        startedAt: updatedSession.startedAt,
        endedAt: updatedSession.endedAt,
        status: updatedSession.status,
        totalCustomers: updatedSession.totalCustomers,
        total: updatedSession.total,
        createdAt: updatedSession.created_at,
        durationMinutes,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getActiveSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const activeSessions = await dbClient.query.diningSessions.findMany({
      where: eq(diningSessions.status, "ACTIVE"),
      orderBy: [diningSessions.createdAt],
    });

    // const sessionsWithGroups = await Promise.all(
    //   activeSessions.map(async (session) => {
    //     const group = await dbClient.query.groups.findFirst({
    //       where: eq(groups.tableId, session.tableId),
    //     });

    //     let members: Array<{ id: number; name: string; note: string | null }> =
    //       [];
    //     if (group) {
    //       const groupMembers = await dbClient.query.group_members.findMany({
    //         where: eq(group_members.groupId, group.id),
    //       });
    //       members =
    //         groupMembers?.map((member) => ({
    //           id: member.id,
    //           name: member.name,
    //           note: member.note,
    //         })) || [];
    //     }

    //     return {
    //       id: session.id,
    //       tableId: session.tableId,
    //       startedAt: session.startedAt,
    //       status: session.status,
    //       totalCustomers: members.length,
    //       createdAt: session.createdAt,
    //       group: group
    //         ? {
    //           id: group.id,
    //           members: members,
    //         }
    //         : null,
    //     };
    //   })
    // );

    // res.json({
    //   activeSessions: sessionsWithGroups,
    //   totalActiveTables: activeSessions.length,
    // });
    const sessionsWithGroups = await Promise.all(
      activeSessions.map(async (session) => {
        // ดึงสมาชิกทั้งหมดของ session นี้
        const gmRows = await dbClient.query.group_members.findMany({
          where: eq(group_members.diningSessionId, session.id),
          orderBy: [asc(group_members.joinedAt), asc(group_members.id)],
        });

        // รวมจำนวนลูกค้าทั้งหมดใน session
        const totalCustomers = gmRows.length;

        // เลือก "กลุ่มหลัก" ของ session
        // วิธีที่ 1: เลือก groupId ล่าสุด (ตามเวลา joinedAt/id)
        let primaryGroupId: number | null = null;
        if (gmRows.length) {
          primaryGroupId = gmRows[gmRows.length - 1].groupId;
        }

        // ถ้าอยากเลือกกลุ่มที่มีสมาชิกมากสุด ให้ใช้วิธีนี้แทน (คอมเมนต์ด้านบน)
        // const counts = new Map<number, number>();
        // gmRows.forEach(r => counts.set(r.groupId, (counts.get(r.groupId) ?? 0) + 1));
        // primaryGroupId = [...counts.entries()].sort((a,b) => b[1]-a[1])[0]?.[0] ?? null;

        // เตรียม group object (ถ้ามี)
        let groupObj: { id: number; members: Array<{ id: number; name: string; note: string | null }> } | null = null;

        if (primaryGroupId != null) {
          const group = await dbClient.query.groups.findFirst({
            where: eq(groups.id, primaryGroupId),
          });

          const primaryMembers = gmRows
            .filter(r => r.groupId === primaryGroupId)
            .map(m => ({
              id: m.id,
              name: m.name,
              note: m.note ?? null,
            }));

          if (group) {
            groupObj = {
              id: group.id,
              members: primaryMembers,
            };
          }
        }

        return {
          id: session.id,
          tableId: session.tableId,
          startedAt: session.startedAt,
          status: session.status,
          totalCustomers, // สมาชิกทั้งหมดใน session
          createdAt: session.createdAt,
          group: groupObj, // สมาชิกของ "กลุ่มหลัก" (ถ้ามี)
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
};

export const getSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = parseInt(req.params.sessionId);
    if (isNaN(sessionId)) {
      return res.status(400).json({ error: "Invalid Session ID" });
    }

    const session = await dbClient
      .select({
        id: diningSessions.id,
        tableId: diningSessions.tableId,
        startedAt: diningSessions.startedAt,
        endedAt: diningSessions.endedAt,
        status: diningSessions.status,
        totalCustomers: diningSessions.totalCustomers,
        total: diningSessions.total,
        createdAt: diningSessions.createdAt,
        qrCode: diningSessions.qrCode,
      })
      .from(diningSessions)
      .where(eq(diningSessions.id, sessionId))
      .limit(1);

    const sessionData = session[0];
    if (!sessionData) {
      return res.status(404).json({ error: "Session not found" });
    }

    if (!sessionData.qrCode) {
      return res.status(500).json({ error: "Session QR Code data is missing." });
    }

    // หา group ที่สร้างสำหรับ session นี้ (ไม่ใช้ tableId อย่างเดียว)
    const groupMembers = await dbClient.query.group_members.findMany({
      where: eq(group_members.diningSessionId, sessionId),
      limit: 1
    });

    let group = null;
    let members = [];

    if (groupMembers.length > 0) {
      // มี members ใน session นี้ → ใช้ group ของ member ตัวแรก
      group = await dbClient.query.groups.findFirst({
        where: eq(groups.id, groupMembers[0].groupId),
      });
    } else {
      // ยังไม่มี members → หา group ล่าสุดของ table นี้
      const latestGroup = await dbClient.query.groups.findFirst({
        where: eq(groups.tableId, sessionData.tableId),
        orderBy: desc(groups.createdAt), // ใช้ group ล่าสุด
      });
      group = latestGroup;
    }

    // ได้เฉพาะ members ของ session นี้
    members = await dbClient.query.group_members.findMany({
      where: eq(group_members.diningSessionId, sessionId),
    });

    const duration = sessionData.endedAt && sessionData.startedAt
      ? Math.round((sessionData.endedAt.getTime() - sessionData.startedAt.getTime()) / 60000)
      : null;

    res.json({
      session: {
        id: sessionData.id,
        tableId: sessionData.tableId,
        startedAt: sessionData.startedAt,
        endedAt: sessionData.endedAt,
        qrCode: sessionData.qrCode,
        status: sessionData.status,
        totalCustomers: members.length, // ใช้จำนวน members จริง
        total: Number(sessionData.total) ?? 0,
        createdAt: sessionData.createdAt,
        durationMinutes: duration,
      },
      group: group ? {
        id: group.id,
        members: members.map(member => ({
          id: member.id,
          name: member.name,
          note: member.note,
        })),
      } : null,
    });
  } catch (err) {
    next(err);
  }
};
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
//         totalCustomers: diningSessions.totalCustomers,
//         total: diningSessions.total,
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
//       where: eq(groups.tableId, sessionData.tableId),
//     });

//     const members = group
//       ? (
//         await dbClient.query.group_members.findMany({
//           where: eq(group_members.groupId, group.id),
//         })
//       ).map((member) => ({
//         id: member.id,
//         name: member.name,
//         note: member.note,
//       }))
//       : [];
//     const duration =
//       sessionData.endedAt && sessionData.startedAt
//         ? Math.round(
//           (sessionData.endedAt.getTime() - sessionData.startedAt.getTime()) /
//           60000
//         )
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
//         total: Number(sessionData.total) ?? 0,
//         createdAt: sessionData.createdAt,
//         durationMinutes: duration,
//       },
//       group: group
//         ? {
//           id: group.id,
//           members,
//         }
//         : null,
//     });
//   } catch (err) {
//     next(err);
//   }
// };

// ใน getSessionByTableNumber
export const getSessionIdByTableNumber = async (tableNumber: number) => {
  const tableRecord = await dbClient.query.tables.findFirst({
    where: eq(tables.number, tableNumber),
  });

  const session = await dbClient
    .select({ id: diningSessions.id })
    .from(diningSessions)
    .where(
      and(
        eq(diningSessions.tableId, tableRecord!.id),
        eq(diningSessions.status, "ACTIVE")
      )
    )
    .limit(1);

  return session[0]?.id;
};

// // Create a new group when a new session is opened
// export const createGroupForNewSession = async (sessionId: number, tableId: number) => {
//   // Create a new group for the session
//   const group = await dbClient.insert(groups).values({
//     tableId,
//     creatorUserId: null, // Or specify the creator user ID here
//     createdAt: new Date(),
//   }).returning();

//   // Return the created group
//   return group[0];
// };

// export const addMembersToNewGroup = async (groupId: number, members: Array<number>) => {
//   const groupMembers = members.map((memberId) => ({
//     groupId,
//     userId: memberId, // Assuming you have the user ID of the members
//     diningSessionId: groupId, // Associate the group with the dining session
//     isTableAdmin: false, // Specify if admin
//     joinedAt: new Date(),
//   }));

//   // Insert members into the group_members table
//   await dbClient.insert(group_members).values(groupMembers);
// };