import { db } from "src/db/client.js";
import {
  admins,
  tables,
  diningSessions,
  members,
  menuItems,
  orders,
  orderItems,
} from "src/db/schema.js";

async function seed() {
  // 1. Admin
  const [admin] = await db.insert(admins).values({
    name: "Admin 1",
    email: "admin1@example.com",
    password: "hashedpassword",
  }).returning();

  // 2. Table
  const [table] = await db.insert(tables).values({
    number: 1,
    status: "OCCUPIED",
  }).returning();

  // 3. Dining session
  const [session] = await db.insert(diningSessions).values({
    tableId: table.id,
    openedByAdminId: admin.id,
    qrCode: "http://example.com/qr/1",
    status: "ACTIVE",
  }).returning();

  // 4. Members
  const [member1] = await db.insert(members).values({
    diningSessionId: session.id,
    name: "Alice",
    isTableAdmin: true,
  }).returning();

  const [member2] = await db.insert(members).values({
    diningSessionId: session.id,
    name: "Bob",
    isTableAdmin: false,
  }).returning();

    // 5. Menu items
    const [menu1] = await db.insert(menuItems).values({
      name: "Fried Rice",
      description: "Delicious fried rice",
      price: 100.00,  
    }).returning();

    const [menu2] = await db.insert(menuItems).values({
      name: "Pad Thai",
      description: "Classic pad thai",
      price: 120.00, 
    }).returning();


  // 6. Orders
  const [order] = await db.insert(orders).values({
    diningSessionId: session.id,
    status: "PENDING",
  }).returning();

  // 7. Order items
  await db.insert(orderItems).values([
    {
      orderId: order.id,
      menuItemId: menu1.id,
      memberId: member1.id,
      quantity: 2,
      note: "Extra spicy",
    },
    {
      orderId: order.id,
      menuItemId: menu2.id,
      memberId: member2.id,
      quantity: 1,
    },
  ]);

  console.log("✅ Seed completed!");
}

seed().then(() => process.exit(0));
