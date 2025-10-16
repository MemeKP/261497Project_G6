import { type Request, type Response, type NextFunction } from "express";
import "dotenv/config";
import { eq, and, isNotNull, or, like } from "drizzle-orm";
import { dbClient } from "@db/client.js";
import {
  users,
  admins,
  diningSessions ,
  groups,
  group_members,
  menuItems,
  orders,
  orderItems,
} from "@db/schema.js";

export const addMembers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, groupId, userId, note, diningSessionId } = req.body;
    
    console.log("🔍 [BACKEND] Received data:", {
      name, 
      groupId, 
      diningSessionId,
      receivedSessionId: diningSessionId
    });

    if (!name || !groupId || !diningSessionId) {
      return res.status(400).json({
        error: "Name, Group ID and Dining Session ID are required",
      });
    }

    // ตรวจสอบ group
    const group = await dbClient.query.groups.findFirst({
      where: eq(groups.id, groupId),
    });
    if (!group) {
      return res.status(400).json({ error: "Group not found" });
    }

    // session (ใช้ diningSessionId จาก request)
    const session = await dbClient.query.diningSessions.findFirst({
      where: eq(diningSessions.id, diningSessionId), //ใช้ id จาก request
    });
    
    if (!session) {
      return res.status(400).json({ 
        error: `Dining session ${diningSessionId} not found` 
      });
    }

    // session นี้ match กับ table ของ group
    if (session.tableId !== group.tableId) {
      return res.status(400).json({ 
        error: "Session and Group do not belong to the same table" 
      });
    }

    const newMember = await dbClient
      .insert(group_members)
      .values({
        name,
        groupId: groupId,
        userId: userId || null,
        diningSessionId: diningSessionId, 
        note: note || null,
      })
      .returning({
        id: group_members.id,
        name: group_members.name,
        groupId: group_members.groupId,
        userId: group_members.userId,
        note: group_members.note,
        diningSessionId: group_members.diningSessionId,
      });

    console.log("[BACKEND] Member created:", {
      id: newMember[0].id,
      name: newMember[0].name,
      diningSessionId: newMember[0].diningSessionId
    });

    res.status(201).json({
      message: "Member added successfully",
      member: newMember[0], 
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
      .where(eq(group_members.groupId, groupId));

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
    const diningSessionId = parseInt(req.query.diningSessionId as string); // เอา session มาด้วย

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
      where: and(
        eq(group_members.groupId, groupId),
        eq(group_members.diningSessionId, diningSessionId) // filter mem ตาม session นี้
      ),
    });

    res.json({
      group: {
        id: group.id,
        tableId: group.tableId,
        creatorUserId: group.creatorUserId,
        createdAt: group.createdAt,
      },
      members:
        members?.map((member) => ({
          id: member.id,
          name: member.name,
          userId: member.userId,
          note: member.note,
        })) || [],
    });
  } catch (err) {
    next(err);
  }
};

export const getMembersBySession = async (req: Request, res: Response) => {
  try {
    const sessionId = parseInt(req.params.sessionId);
    
    console.log("🔍 [BACKEND] Getting members for session:", sessionId);
    
    const members = await dbClient.query.group_members.findMany({
      where: eq(group_members.diningSessionId, sessionId),
    });

    console.log("🔍 [BACKEND] Found members:", {
      sessionId: sessionId,
      membersCount: members.length,
      members: members.map(m => ({ id: m.id, name: m.name }))
    });

    res.json({
      members: members.map(member => ({
        id: member.id,
        name: member.name,
        note: member.note,
      }))
    });
  } catch (err) {
    console.error("[BACKEND] Error getting members:", err);
  }
};

// ใน groupMemberController.ts
export const deleteAutoCreatedMembers = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    console.log('🔍 Deleting auto-created members for session:', sessionId);

    // ✅ ลบ members ที่เป็น auto-created
    const result = await dbClient
      .delete(group_members)
      .where(
        and(
          eq(group_members.diningSessionId, parseInt(sessionId)),
          or(
            like(group_members.note, '%auto_created%'),
            like(group_members.note, '%Auto-created%'),
            eq(group_members.name, 'Main Customer'),
            eq(group_members.name, 'Owner')
          )
        )
      )
      .returning();

    console.log(`✅ Deleted ${result.length} auto-created members`);
    
    res.json({
      success: true,
      deletedCount: result.length,
      message: `Deleted ${result.length} auto-created members`
    });

  } catch (error) {
    console.error('❌ Error deleting auto-created members:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete auto-created members'
    });
  }
};

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
//       where: eq(diningSessions.tableId, group.tableId),
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
//         groupId: groupId,
//         userId: userId || null,
//         diningSessionId: session.id,
//         note: note || null,
//       })
//       .returning({
//         id: group_members.id,
//         name: group_members.name,
//         groupId: group_members.groupId,
//         userId: group_members.userId,
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
//       where: eq(group_members.groupId, groupId),
//     });

//     res.json({
//       group: {
//         id: group.id,
//         tableId: group.tableId,
//         creatorUserId: group.creatorUserId,
//         createdAt: group.createdAt,
//       },
//       members:
//         members?.map((member) => ({
//           id: member.id,
//           name: member.name,
//           userId: member.userId,
//           note: member.note,
//         })) || [],
//     });
//   } catch (err) {
//     next(err);
//   }
// };