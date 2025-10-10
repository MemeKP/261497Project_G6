import { type Request, type Response, type NextFunction } from "express";
import "dotenv/config";
import { eq, and } from "drizzle-orm";
import { dbClient } from "@db/client.js";
import {
  diningSessions as dining_sessions,
  group_members,
  groups,
} from "@db/schema.js";

export const createGroup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
    try {
        const { sessionId, tableId } = req.body;
    
        console.log("Received data:", { sessionId, tableId });
    
        if (!sessionId || !tableId) {
          return res.status(400).json({
            error: "Session ID and Table ID are required",
          });
        }
    
        console.log("Checking dining session...");
        const diningSession = await dbClient.query.diningSessions.findFirst({
          where: and(
            eq(dining_sessions.id, sessionId),
            eq(dining_sessions.tableId, tableId),
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
          where: eq(groups.tableId, tableId),
        });
    
        console.log("Existing group found:", existingGroup);
    
        if (existingGroup) {
          return res.status(400).json({
            error: `Group for table ${tableId} already exists`,
            group: {
              id: existingGroup.id,
              tableId: existingGroup.tableId,
              createdAt: existingGroup.createdAt,
            },
          });
        }
    
        console.log("Creating new group...");
        const newGroup = await dbClient
          .insert(groups)
          .values({
            tableId: tableId,
            creatorUserId: null,
            createdAt: new Date(),
          })
          .returning({
            id: groups.id,
            tableId: groups.tableId,
            creatorUserId: groups.creatorUserId,
            createdAt: groups.createdAt,
          });
    
        console.log("New group created:", newGroup);
    
        res.status(201).json({
          message: `Group created successfully for table ${tableId}`,
          group: {
            id: newGroup[0].id,
            tableId: newGroup[0].tableId,
            creatorUserId: newGroup[0].creatorUserId,
            createdAt: newGroup[0].createdAt,
          },
        });
      } catch (err) {
        console.error("Error in /group/create:", err);
        next(err);
      }
};

export const getGroupBySession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId) {
      return res.status(400).json({ error: "Session ID is required" });
    }

    // หา session
    const session = await dbClient.query.diningSessions.findFirst({
      where: eq(dining_sessions.id, Number(sessionId)),
    });

    if (!session) return res.status(404).json({ error: "Session not found" });

    // หา group ตาม tableId ของ session
    const group = await dbClient.query.groups.findFirst({
      where: eq(groups.tableId, session.tableId),
    });

    if (!group) return res.status(404).json({ error: "Group not found for this session" });

    // ดึงสมาชิกของ group
    const members = await dbClient.query.group_members.findMany({
      where: eq(group_members.groupId, group.id),
    });

    res.json({
      group: {
        id: group.id,
        tableId: group.tableId,
        members: members.map((m) => ({ id: m.id, name: m.name, note: m.note })),
      },
    });
  } catch (err) {
    console.error("Error in /group/session/:sessionId", err);
    next(err);
  }
};