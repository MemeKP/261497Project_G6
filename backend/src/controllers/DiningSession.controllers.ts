import { type Request, type Response, type NextFunction } from "express";
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

    const existingSession = await dbClient.query.dining_sessions?.findFirst({
      where: and(
        eq(dining_sessions.table_id, tableId),
        eq(dining_sessions.status, "ACTIVE")
      ),
    });

    if (existingSession) {
      return res
      .status(400)
      .json({
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
};

export const getActiveSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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
};

export const getSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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
};
