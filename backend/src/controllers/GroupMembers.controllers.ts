import { type Request, type Response, type NextFunction } from "express";
import QRCode from "qrcode";
import express from "express";
import "dotenv/config";
import { eq, and, isNotNull } from "drizzle-orm";
import { dbClient } from "@db/client.js";
import {
  users,
  admins as admin,
  diningSessions as dining_sessions,
  groups,
  group_members,
  menuItems as menu_items,
  orders,
  order_items,
} from "@db/schema.js";

export const addMembers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, groupId, userId, note, diningSessionId } = req.body;

    if (!name || !groupId || !diningSessionId) {
      return res.status(400).json({
        error: "Name, Group ID and Dining Session ID are required",
      });
    }

    const group = await dbClient.query.groups.findFirst({
  where: eq(groups.id, groupId),
});

if (!group) return res.status(400).json({ error: "Group not found" });

    const newMember = await dbClient
      .insert(group_members)
      .values({
        name,
        group_id: groupId,
        user_id: userId || null,
        diningSessionId,
        note: note || null,
      })
      .returning({
        id: group_members.id,
        name: group_members.name,
        group_id: group_members.group_id,
        user_id: group_members.user_id,
        note: group_members.note,
        diningSessionId: group_members.diningSessionId,
      });

    res.status(201).json({
      message: "Member added successfully",
      member: {
        id: newMember[0].id,
        name: newMember[0].name,
        groupId: newMember[0].group_id,
        userId: newMember[0].user_id,
        note: newMember[0].note,
        diningSessionId: group_members.diningSessionId,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const deleteAllMembers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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
};

export const deleteMember = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const memberId = Number(req.params.memberId);

    if (isNaN(memberId)) {
      return res.status(400).json({
        error: "Invalid Member ID",
      });
    }

    const result = await dbClient
      .delete(group_members)
      .where(eq(group_members.id, memberId))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({
        error: `Member with ID ${memberId} not found`,
      });
    }

    res.json({
      message: `Member ${memberId} removed successfully`,
    });
  } catch (err) {
    console.error("Database error during member deletion:", err);
    next(err);
  }
};

export const getGroupMembers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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
};
