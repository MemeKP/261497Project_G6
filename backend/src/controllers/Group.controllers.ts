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

    // หา group ตาม table_id ของ session
    const group = await dbClient.query.groups.findFirst({
      where: eq(groups.table_id, session.tableId),
    });

    if (!group) return res.status(404).json({ error: "Group not found for this session" });

    // ดึงสมาชิกของ group
    const members = await dbClient.query.group_members.findMany({
      where: eq(group_members.group_id, group.id),
    });

    res.json({
      group: {
        id: group.id,
        tableId: group.table_id,
        members: members.map((m) => ({ id: m.id, name: m.name, note: m.note })),
      },
    });
  } catch (err) {
    console.error("Error in /group/session/:sessionId", err);
    next(err);
  }
};