import { type Request, type Response, type NextFunction } from "express";
import QRCode from "qrcode";
import express from "express";
import "dotenv/config";
import { eq, and,  sql  } from "drizzle-orm";
import { dbClient } from "@db/client.js";
import {
  diningSessions,
  groups,
  group_members,
  tables,
  bills,
} from "@db/schema.js";

export const startSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { tableId } = req.body; // นี่คือ table number (1-9)
    const adminId = req.session.userId;

    console.log('Starting session for table number:', tableId);

    if (!tableId || typeof tableId !== "number") {
      return res.status(400).json({
        error: "Table number is required and must be a number",
      });
    }

    if (!adminId) {
      return res.status(401).json({
        error: "Authentication required. Please log in.",
      });
    }

    // ✅ หา table โดยใช้ number
    const tableRecord = await dbClient.query.tables.findFirst({
      where: eq(tables.number, tableId),
    });

    if (!tableRecord) {
      return res.status(400).json({
        error: `Table ${tableId} not found. Please contact administrator to seed tables.`,
      });
    }

    // ✅ ตรวจสอบว่ามี session active อยู่แล้วหรือไม่
    const existingSession = await dbClient.query.diningSessions?.findFirst({
      where: and(
        eq(diningSessions.tableId, tableRecord.id), // ใช้ tableRecord.id
        eq(diningSessions.status, "ACTIVE")
      ),
    });

    if (existingSession) {
      return res.status(400).json({
        error: `Table ${tableId} already has an active dining session`,
      });
    }

    const startedAt = new Date();

    // ✅ สร้าง dining session
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

    // ✅ อัพเดท table status เป็น OCCUPIED
    await dbClient
      .update(tables)
      .set({ status: "OCCUPIED" })
      .where(eq(tables.id, tableRecord.id));

    // QR Data setup
    const qrData = {
      sessionId: newSession[0].id,
      tableNumber: tableId, // ใช้ table number ที่ user รู้จัก
      url: `${
        process.env.PRODUCTION_FRONTEND_URL || "http://10.0.0.51:5173"
      }/tables/${newSession[0].id}`,
    };

    // Generate QR Code
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
      errorCorrectionLevel: "M",
      margin: 1,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
      width: 256,
    });

    // Update session with generated QR Code
    await dbClient
      .update(diningSessions)
      .set({ qrCode: qrCodeDataURL })
      .where(eq(diningSessions.id, newSession[0].id));

    res.status(201).json({
      message: `Dining session started successfully for table ${tableId}`,
      session: {
        id: newSession[0].id,
        tableId: tableRecord.id, // table record id
        tableNumber: tableId, // table number ที่ user รู้จัก
        startedAt: newSession[0].startedAt,
        status: newSession[0].status,
        totalCustomers: newSession[0].totalCustomers,
        createdAt: newSession[0].createdAt,
        qrCode: qrCodeDataURL,
        qrData: qrData,
        openedByAdminId: adminId,
      },
    });
  } catch (err) {
    console.error("Error starting session:", err);
    next(err);
  }
};


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

/**
 * ✅ ปิด session (Admin ใช้)
 */
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

    const sessionsWithGroups = await Promise.all(
      activeSessions.map(async (session) => {
        const group = await dbClient.query.groups.findFirst({
          where: eq(groups.tableId, session.tableId),
        });

        let members: Array<{ id: number; name: string; note: string | null }> =
          [];
        if (group) {
          const groupMembers = await dbClient.query.group_members.findMany({
            where: eq(group_members.groupId, group.id),
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
          tableId: session.tableId,
          startedAt: session.startedAt,
          status: session.status,
          totalCustomers: members.length,
          createdAt: session.createdAt,
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
};

export const getSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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
        total: diningSessions.total, //  เพิ่มบรรทัดนี้
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
      return res
        .status(500)
        .json({ error: "Session QR Code data is missing in the database." });
    }
    const group = await dbClient.query.groups.findFirst({
      where: eq(groups.tableId, sessionData.tableId),
    });

    const members = group
      ? (
          await dbClient.query.group_members.findMany({
            where: eq(group_members.groupId, group.id),
          })
        ).map((member) => ({
          id: member.id,
          name: member.name,
          note: member.note,
        }))
      : [];
    const duration =
      sessionData.endedAt && sessionData.startedAt
        ? Math.round(
            (sessionData.endedAt.getTime() - sessionData.startedAt.getTime()) /
              60000
          )
        : null;
    res.json({
      session: {
        id: sessionData.id,
        tableId: sessionData.tableId,
        startedAt: sessionData.startedAt,
        endedAt: sessionData.endedAt,
        qrCode: sessionData.qrCode,
        status: sessionData.status,
        totalCustomers: members.length,
        total: Number(sessionData.total) ?? 0,
        createdAt: sessionData.createdAt,
        durationMinutes: duration,
      },
      group: group
        ? {
            id: group.id,
            members,
          }
        : null,
    });
  } catch (err) {
    next(err);
  }
};

export const getSessionPublic = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = parseInt(req.params.sessionId);
    if (isNaN(sessionId)) {
      return res.status(400).json({ error: "Invalid Session ID" });
    }

    const [session] = await dbClient
      .select()
      .from(diningSessions)
      .where(eq(diningSessions.id, sessionId))
      .limit(1);

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    return res.status(200).json({
      id: session.id,
      tableId: session.tableId,
      status: session.status,
      totalCustomers: session.totalCustomers,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      total: session.total,
      durationMinutes:
        session.endedAt && session.startedAt
          ? Math.round(
              (new Date(session.endedAt).getTime() -
                new Date(session.startedAt).getTime()) /
                60000
            )
          : null,
    });
  } catch (err: unknown) {
    console.error(" getSessionPublic error:", err);

    if (err instanceof Error) {
      return res.status(500).json({
        error: "Internal Server Error",
        details: err.message,
      });
    }
    return res.status(500).json({
      error: "Unknown error occurred",
    });
}
};



// export const getSessionPublic = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const sessionId = parseInt(req.params.sessionId);
//     if (isNaN(sessionId)) return res.status(400).json({ error: "Invalid Session ID" });

//     // ✅ ดึงข้อมูล session เฉพาะที่จบแล้ว (ไม่ ACTIVE)
//     const [session] = await dbClient
//       .select()
//       .from(diningSessions)
//       .where(eq(diningSessions.id, sessionId))
//       .limit(1);

//     if (!session || session.status === "ACTIVE") {
//       return res.status(404).json({ message: "Session not found or still active." });
//     }

//     res.json({
//       id: session.id,
//       tableId: session.tableId,
//       totalCustomers: session.totalCustomers,
//       startedAt: session.startedAt,
//       endedAt: session.endedAt,
//       total: session.total,
//       durationMinutes: session.endedAt && session.startedAt
//         ? Math.round((session.endedAt.getTime() - session.startedAt.getTime()) / 60000)
//         : null,
//     });
//   } catch (err) {
//     next(err);
//   }
// };
