// import { type Request, type Response, type NextFunction } from "express";
// import "dotenv/config";
// import { eq, and, isNotNull } from "drizzle-orm";
// import { dbClient } from "@db/client.js";
// import {
//   users,
//   admins as admin,
//   diningSessions as dining_sessions,
//   groups,
//   group_members,
//   menuItems as menu_items,
//   orders,
//   diningSessions,
// } from "@db/schema.js";

// export const addMembers = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { name, groupId, userId, note, diningSessionId } = req.body;
//     if (!name || !groupId || !diningSessionId) {
//       return res.status(400).json({
//         error: "Name, Group ID and Dining Session ID are required",
//       });
//     }
//     const group = await dbClient.query.groups.findFirst({
//       where: eq(groups.id, groupId),
//     });
//     if (!group) {
//       return res.status(400).json({ error: "Group not found" });
//     }
//     const session = await dbClient.query.diningSessions.findFirst({
//       where: eq(diningSessions.tableId, group.table_id),
//     });
//     if (!session) {
//       return res
//         .status(400)
//         .json({ error: "Dining session not found for this group" });
//     }
//     const newMember = await dbClient
//       .insert(group_members)
//       .values({
//         name,
//         group_id: groupId,
//         user_id: userId || null,
//         diningSessionId: Number(diningSessionId), // ✅ fixed line
//         note: note || null,
//       })
//       .returning({
//         id: group_members.id,
//         name: group_members.name,
//         group_id: group_members.group_id,
//         user_id: group_members.user_id,
//         note: group_members.note,
//         diningSessionId: group_members.diningSessionId,
//       });

//     res.status(201).json({
//       message: "Member added successfully",
//       member: {
//         name,
//         groupId,
//         userId,
//         note,
//       },
//     });
//   } catch (err) {
//     next(err);
//   }
// };

// export const deleteAllMembers = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const groupId = parseInt(req.params.groupId);

//     if (isNaN(groupId)) {
//       return res.status(400).json({
//         error: "Invalid Group ID",
//       });
//     }

//     const group = await dbClient.query.groups?.findFirst({
//       where: eq(groups.id, groupId),
//     });

//     if (!group) {
//       return res.status(400).json({
//         error: "Group not found",
//       });
//     }

//     await dbClient
//       .delete(group_members)
//       .where(eq(group_members.group_id, groupId));

//     res.json({
//       message: `All members removed from group ${groupId} successfully`,
//     });
//   } catch (err) {
//     next(err);
//   }
// };

// export const deleteMember = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const memberId = Number(req.params.memberId);

//     if (isNaN(memberId)) {
//       return res.status(400).json({
//         error: "Invalid Member ID",
//       });
//     }

//     const result = await dbClient
//       .delete(group_members)
//       .where(eq(group_members.id, memberId))
//       .returning();

//     if (result.length === 0) {
//       return res.status(404).json({
//         error: `Member with ID ${memberId} not found`,
//       });
//     }

//     res.json({
//       message: `Member ${memberId} removed successfully`,
//     });
//   } catch (err) {
//     console.error("Database error during member deletion:", err);
//     next(err);
//   }
// };

// export const getGroupMembers = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const groupId = parseInt(req.params.groupId);

//     if (isNaN(groupId)) {
//       return res.status(400).json({
//         error: "Invalid Group ID",
//       });
//     }

//     const group = await dbClient.query.groups?.findFirst({
//       where: eq(groups.id, groupId),
//     });

//     if (!group) {
//       return res.status(400).json({
//         error: "Group not found",
//       });
//     }

//     const members = await dbClient.query.group_members?.findMany({
//       where: eq(group_members.group_id, groupId),
//     });

//     res.json({
//       group: {
//         id: group.id,
//         tableId: group.table_id,
//         creatorUserId: group.creator_user_id,
//         createdAt: group.created_at,
//       },
//       members:
//         members?.map((member) => ({
//           id: member.id,
//           name: member.name,
//           userId: member.user_id,
//           note: member.note,
//         })) || [],
//     });
//   } catch (err) {
//     next(err);
//   }
// };

import { type Request, type Response, type NextFunction } from "express";
import "dotenv/config";
import { eq } from "drizzle-orm";
import { dbClient } from "@db/client.js";
import {
  groups,
  group_members,
  diningSessions,
} from "@db/schema.js";

/**
 *  ADD MEMBER
 */
export const addMembers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, groupId, userId, note, diningSessionId } = req.body;

    if (!name || !groupId || !diningSessionId) {
      return res.status(200).json({
        success: false,
        message: "Name, Group ID and Dining Session ID are required",
      });
    }

    const group = await dbClient.query.groups.findFirst({
      where: eq(groups.id, groupId),
    });
    if (!group) {
      return res.status(200).json({
        success: false,
        message: "Group not found",
      });
    }

    const session = await dbClient.query.diningSessions.findFirst({
      where: eq(diningSessions.tableId, group.table_id),
    });
    if (!session) {
      return res.status(200).json({
        success: false,
        message: "Dining session not found for this group",
      });
    }

    const [newMember] = await dbClient
      .insert(group_members)
      .values({
        name,
        group_id: groupId,
        user_id: userId || null,
        diningSessionId: Number(diningSessionId),
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

    return res.status(201).json({
      success: true,
      message: "Member added successfully",
      member: newMember,
    });
  } catch (err) {
    console.error("addMembers error:", err);
    return res.status(200).json({
      success: false,
      message: "Failed to add member",
      error: (err as Error).message,
    });
  }
};

/**
 *  DELETE ALL MEMBERS
 */
export const deleteAllMembers = async (req: Request, res: Response) => {
  try {
    const groupId = parseInt(req.params.groupId);

    if (isNaN(groupId)) {
      return res.status(200).json({
        success: false,
        message: "Invalid Group ID",
      });
    }

    const group = await dbClient.query.groups.findFirst({
      where: eq(groups.id, groupId),
    });

    if (!group) {
      return res.status(200).json({
        success: false,
        message: "Group not found",
      });
    }

    await dbClient.delete(group_members).where(eq(group_members.group_id, groupId));

    return res.status(200).json({
      success: true,
      message: `All members removed from group ${groupId} successfully`,
    });
  } catch (err) {
    console.error("deleteAllMembers error:", err);
    return res.status(200).json({
      success: false,
      message: "Failed to delete all members",
      error: (err as Error).message,
    });
  }
};

/**
 *  DELETE SINGLE MEMBER
 */
export const deleteMember = async (req: Request, res: Response) => {
  try {
    const memberId = Number(req.params.memberId);

    if (isNaN(memberId)) {
      return res.status(200).json({
        success: false,
        message: "Invalid Member ID",
      });
    }

    const result = await dbClient
      .delete(group_members)
      .where(eq(group_members.id, memberId))
      .returning();

    if (result.length === 0) {
      return res.status(200).json({
        success: false,
        message: `Member with ID ${memberId} not found`,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Member ${memberId} removed successfully`,
    });
  } catch (err) {
    console.error("deleteMember error:", err);
    return res.status(200).json({
      success: false,
      message: "Failed to delete member",
      error: (err as Error).message,
    });
  }
};

/**
 *  GET GROUP MEMBERS
 */
export const getGroupMembers = async (req: Request, res: Response) => {
  try {
    const groupId = parseInt(req.params.groupId);

    if (isNaN(groupId)) {
      return res.status(200).json({
        success: false,
        message: "Invalid Group ID",
      });
    }

    const group = await dbClient.query.groups.findFirst({
      where: eq(groups.id, groupId),
    });

    if (!group) {
      return res.status(200).json({
        success: false,
        message: "Group not found",
      });
    }

    const members = await dbClient.query.group_members.findMany({
      where: eq(group_members.group_id, groupId),
    });

    return res.status(200).json({
      success: true,
      message: "Members retrieved successfully",
      group: {
        id: group.id,
        tableId: group.table_id,
        creatorUserId: group.creator_user_id,
        createdAt: group.created_at,
      },
      members: members.map((m) => ({
        id: m.id,
        name: m.name,
        userId: m.user_id,
        note: m.note,
      })),
    });
  } catch (err) {
    console.error("getGroupMembers error:", err);
    return res.status(200).json({
      success: false,
      message: "Failed to get group members",
      error: (err as Error).message,
    });
  }
};
