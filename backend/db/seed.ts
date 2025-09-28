import { dbClient } from "db/client.js";
import {
  admins,
  tables,
  diningSessions,
  members,
  menuItems,
  orders,
  orderItems,
} from "db/schema.js";

async function seed() {
  // 1. Admin
  const [admin] = await dbClient
    .insert(admins)
    .values({
      name: "Admin 1",
      email: "admin1@example.com",
      password: "hashedpassword", // จริง ๆ ควร hash
    })
    .returning();

  // 2. Table
  const [table] = await dbClient
    .insert(tables)
    .values({
      number: 1,
      status: "OCCUPIED",
    })
    .returning();

  // 3. Dining session
  const [session] = await dbClient
    .insert(diningSessions)
    .values({
      tableId: table.id,
      openedByAdminId: admin.id,
      qrCode: "http://example.com/qr/1",
      status: "ACTIVE",
    })
    .returning();

  // 4. Members
  const [member1] = await dbClient
    .insert(members)
    .values({
      diningSessionId: session.id,
      name: "Alice",
      isTableAdmin: true,
    })
    .returning();

  const [member2] = await dbClient
    .insert(members)
    .values({
      diningSessionId: session.id,
      name: "Bob",
      isTableAdmin: false,
    })
    .returning();

  // 5. Menu items
  const [menu1] = await dbClient
    .insert(menuItems)
    .values({
      name: "Fried Rice",
      description: "Delicious fried rice",
      price: 100.0,
    })
    .returning();

  const [menu2] = await dbClient
    .insert(menuItems)
    .values({
      name: "Pad Thai",
      description: "Classic pad thai",
      price: 120.0,
    })
    .returning();

  // 6. Orders
  const [order] = await dbClient
    .insert(orders)
    .values({
      table_id: 1,
      dining_session_id: session.id,
      status: "PENDING",
    })
    .returning();

  // 7. Order items
  await dbClient.insert(orderItems).values([
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
