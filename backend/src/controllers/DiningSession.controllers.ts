import { type Request, type Response, type NextFunction } from "express";
import QRCode from "qrcode";
import express from "express";
import "dotenv/config";
import { eq, and, isNotNull } from "drizzle-orm";
import { dbClient } from "@db/client.js";
import {
  users,
  admins,
  diningSessions,
  groups,
  group_members,
  menuItems,
  orders,
  order_items,
} from "@db/schema.js";

export const startSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { tableId } = req.body;

    if (!tableId || typeof tableId !== "number") {
      return res.status(400).json({
        error: "Table ID is required and must be a number",
      });
    }

    const existingSession = await dbClient.query.diningSessions?.findFirst({
      where: and(
        eq(diningSessions.tableId, tableId),
        eq(diningSessions.status, "ACTIVE")
      ),
    });

    if (existingSession) {
      return res.status(400).json({
        error: `Table ${tableId} already has an active dining session`,
      });
    }

    const startedAt = new Date();

    const newSession = await dbClient
      .insert(diningSessions)
      .values({
        tableId: tableId,
        startedAt: startedAt,
        status: "ACTIVE",
        qrCode: "http://example.com/qr/1",
        total_customers: 0,
        createdAt: new Date(),
        openedByAdminId: 1,
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
      sessionId: newSession[0].id,
      tableId: tableId,
      url: `${process.env.VITE_FRONTEND_URL || "http://localhost:3000"}/tables/${
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
      where: eq(groups.table_id, activeSession.tableId),
    });

    if (group) {
      const members = await dbClient.query.group_members.findMany({
        where: eq(group_members.group_id, group.id),
      });
      totalCustomers = members?.length || 0;
    }

    const endedAt = new Date();
    const updatedSession = await dbClient
      .update(diningSessions)
      .set({
        endedAt: endedAt,
        status: "COMPLETED",
        total_customers: totalCustomers,
      })
      .where(eq(diningSessions.id, activeSession.id))
      .returning({
        id: diningSessions.id,
        table_id: diningSessions.tableId,
        started_at: diningSessions.startedAt,
        ended_at: diningSessions.endedAt,
        status: diningSessions.status,
        total_customers: diningSessions.total_customers,
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
          where: eq(groups.table_id, session.tableId),
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
        totalCustomers: diningSessions.total_customers,
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
      return res.status(500).json({ error: "Session QR Code data is missing in the database." });
    }
    const group = await dbClient.query.groups.findFirst({
      where: eq(groups.table_id, sessionData.tableId),
    });

    const members = group
      ? (await dbClient.query.group_members.findMany({
          where: eq(group_members.group_id, group.id),
        })).map((member) => ({
          id: member.id,
          name: member.name,
          note: member.note,
        }))
      : [];
    const duration =
      sessionData.endedAt && sessionData.startedAt
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
        totalCustomers: members.length,
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

