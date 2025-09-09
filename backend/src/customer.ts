import "dotenv/config";
import express from "express";
import { dbClient } from "../db/client.ts";
import { groupsTable, groupMembersTable } from "../db/schema.ts";
import { eq, and } from "drizzle-orm";

const app = express();
app.use(express.json());

// ===================== Join (QR scan) =====================
app.post("/group/:groupId/join", async (req, res) => {
  const { groupId } = req.params;

  try {
    // ตรวจสอบว่ากลุ่มมีอยู่ไหม
    const group = await dbClient.query.groupsTable.findFirst({
      where: eq(groupsTable.id, parseInt(groupId)),
    });
    if (!group) return res.status(404).json({ error: "Group not found" });

    // แค่ตอบกลับว่าโต๊ะนี้มีกลุ่มกำลังจะเพิ่มเพื่อน
    res.status(200).json({
      message: `Customer at Table ${group.tableId}`,
      groupId: group.id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to join group" });
  }
});

// ===================== เพิ่มเพื่อนในกลุ่ม =====================
app.post("/group/:groupId/add", async (req, res) => {
  const { groupId } = req.params;
  const { name, note } = req.body;

  if (!name) return res.status(400).json({ error: "name required" });

  try {
    const group = await dbClient.query.groupsTable.findFirst({
      where: eq(groupsTable.id, parseInt(groupId)),
    });
    if (!group) return res.status(404).json({ error: "Group not found" });

    const existing = await dbClient.query.groupMembersTable.findFirst({
      where: and(
        eq(groupMembersTable.groupId, parseInt(groupId)),
        eq(groupMembersTable.name, name)
      ),
    });
    if (existing) return res.status(400).json({ error: "already in group" });

    const [member] = await dbClient.insert(groupMembersTable).values({
      groupId: parseInt(groupId),
      userId: null, // ไม่มี userId
      name,
      note: note || null,
    }).returning();

    res.status(201).json({ message: "added", member });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add" });
  }
});

// ===================== ดูรายชื่อสมาชิก =====================
app.get("/group/:groupId/members", async (req, res) => {
  const { groupId } = req.params;

  try {
    const members = await dbClient.query.groupMembersTable.findMany({
      where: eq(groupMembersTable.groupId, parseInt(groupId)),
    });

    res.json({
      members: members.map(m => ({
        id: m.id,
        name: m.name,
        note: m.note,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch members" });
  }
});

// ===================== ลบสมาชิก =====================
app.delete("/group/:groupId/member/:memberId", async (req, res) => {
  const { groupId, memberId } = req.params;

  try {
    const deleted = await dbClient
      .delete(groupMembersTable)
      .where(
        and(
          eq(groupMembersTable.groupId, parseInt(groupId)),
          eq(groupMembersTable.id, parseInt(memberId))
        )
      )
      .returning();

    if (!deleted.length) return res.status(404).json({ error: "Member not found" });

    res.json({ message: "Member removed", member: deleted[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to remove member" });
  }
});

// ===================== Start Server =====================
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`Customer API running on http://localhost:${PORT}`));
