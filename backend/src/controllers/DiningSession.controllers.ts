import { type Request, type Response, type NextFunction } from "express";
import QRCode from "qrcode";
import express from "express";
import "dotenv/config";
import { eq, and, isNotNull, asc } from "drizzle-orm";
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
} from "@db/schema.js";

export const startSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tableId } = req.body; // นี่คือ table record id (เช่น 14)
    const adminId = req.session.userId;

    console.log('Starting session for table RECORD ID:', tableId);

    if (!tableId || typeof tableId !== "number") {
      return res.status(400).json({
        error: "Table ID is required and must be a number",
      });
    }

    // ✅ แก้ไข: หา table โดยใช้ id (ไม่ใช่ number)
    const tableRecord = await dbClient.query.tables.findFirst({
      where: eq(tables.id, tableId), // ใช้ id แทน number
    });

    console.log('🔍 Table record found:', tableRecord);

    if (!tableRecord) {
      return res.status(400).json({
        error: `Table ID ${tableId} not found.`,
      });
    }

    // ✅ ตรวจสอบว่ามี session active อยู่แล้วหรือไม่ (ใช้ tableRecord.id)
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

    await dbClient
      .update(tables)
      .set({ status: "OCCUPIED" })
      .where(eq(tables.id, tableRecord.id));

    // QR Data setup
    const qrData = {
      sessionId: newSession[0].id,
      tableNumber: tableRecord.number, // ใช้ table number จาก record
      path: `/tables/${tableRecord.number}`, // ใช้ table number ใน URL
    };

    const fullUrlForQR = `https://0a885cac0563b52cffe9b7f2b8d43d25.serveo.net/tables/${newSession[0].id}`;
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

    // Update session with generated QR Code
    await dbClient
      .update(diningSessions)
      .set({ qrCode: qrCodeDataURL })
      .where(eq(diningSessions.id, newSession[0].id));

    res.status(201).json({
      message: `Dining session started successfully for table ${tableRecord.number}`,
      session: {
        id: newSession[0].id,
        tableId: tableRecord.id, // table record id
        tableNumber: tableRecord.number, // table number
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

    let whereCondition;
    if (sessionId) {
      whereCondition = and(
        eq(diningSessions.id, sessionId),
        eq(diningSessions.status, "ACTIVE")
      );
    } else {
      whereCondition = and(
        eq(diningSessions.tableId, tableId),
        eq(diningSessions.status, "ACTIVE")
      );
    }

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

    const endedAt = new Date();
    const updatedSession = await dbClient
      .update(diningSessions)
      .set({
        endedAt: endedAt,
        status: "COMPLETED",
        totalCustomers: totalCustomers,
      })
      .where(eq(diningSessions.id, activeSession.id))
      .returning({
        id: diningSessions.id,
        tableId: diningSessions.tableId,
        startedAt: diningSessions.startedAt,
        endedAt: diningSessions.endedAt,
        status: diningSessions.status,
        totalCustomers: diningSessions.totalCustomers,
        created_at: diningSessions.createdAt,
      });

    const duration =
      endedAt.getTime() -
      (activeSession.startedAt?.getTime() || endedAt.getTime());
    const durationMinutes = Math.round(duration / (1000 * 60));

    res.json({
      message: `Dining session ended successfully for table ${activeSession.tableId}`,
      session: {
        id: updatedSession[0].id,
        tableId: updatedSession[0].tableId,
        startedAt: updatedSession[0].startedAt,
        endedAt: updatedSession[0].endedAt,
        status: updatedSession[0].status,
        totalCustomers: updatedSession[0].totalCustomers,
        createdAt: updatedSession[0].created_at,
        durationMinutes: durationMinutes,
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