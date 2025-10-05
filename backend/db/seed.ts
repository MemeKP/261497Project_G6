import { dbClient, dbConn } from "@db/client.js";
import { eq } from "drizzle-orm";
import QRCode from "qrcode";
import {
  admins,
  tables,
  diningSessions,
  members,
  menuItems,
  orders,
  orderItems,
  groups,
} from "@db/schema.js";
import bcrypt from "bcrypt";

// 🧹 Clear all data before seeding
async function clearDatabase() {
  await dbClient.delete(orderItems);
  await dbClient.delete(orders);
  await dbClient.delete(menuItems);
  await dbClient.delete(members);
  await dbClient.delete(diningSessions);
  await dbClient.delete(tables);
  await dbClient.delete(groups);
  await dbClient.delete(admins);

  console.log("✅ Database cleared!");
}

// 1. Insert Admin
async function insertAdmins() {
  const plainPassword = "1234";
  const passwordHash = await bcrypt.hash(plainPassword, 10);

  const inserted = await dbClient
    .insert(admins)
    .values([
      {
        username: "admin1",
        name: "Admin 1",
        phone: "0811111111",
        address: "Headquarters",
        email: "admin1@example.com",
        password: passwordHash,
      },
      {
        username: "admin2",
        name: "Admin 2",
        phone: "0999999999",
        address: "Branch Office",
        email: "admin2@example.com",
        password: passwordHash,
      },
    ])
    .returning();

  console.log("Inserted admins:", inserted);
}

// 2. Insert Tables
async function insertTables() {
  const inserted = await dbClient
    .insert(tables)
    .values([
      { number: 1, status: "OCCUPIED" },
      { number: 2, status: "AVAILABLE" },
    ])
    .returning();

  console.log("Inserted tables:", inserted);
}

// 3. Insert Dining Session with QR
async function insertDiningSessions() {
  const adminList = await dbClient.query.admins.findMany();
  const tableList = await dbClient.query.tables.findMany();

  if (adminList.length === 0 || tableList.length === 0) return;

  const [session] = await dbClient
    .insert(diningSessions)
    .values({
      tableId: tableList[0].id,
      openedByAdminId: adminList[0].id,
      qrCode: "",
      status: "ACTIVE",
    })
    .returning();

  const url = process.env.VITE_FRONTEND_URL || "http://localhost:5173";
  const qrCodeDataUrl = await QRCode.toDataURL(`${url}/tables/${session.id}`);

  await dbClient
    .update(diningSessions)
    .set({ qrCode: qrCodeDataUrl })
    .where(eq(diningSessions.id, session.id));

  console.log("Inserted dining session:", session.id);
}

// 4. Insert Members
async function insertMembers() {
  const sessions = await dbClient.query.diningSessions.findMany();
  if (sessions.length === 0) return;

  const inserted = await dbClient
    .insert(members)
    .values([
      { diningSessionId: sessions[0].id, name: "Alice", isTableAdmin: true },
      { diningSessionId: sessions[0].id, name: "Bob", isTableAdmin: false },
      { diningSessionId: sessions[0].id, name: "Charlie", isTableAdmin: false },
    ])
    .returning();

  console.log("Inserted members:", inserted);
}

// 5. Insert Menu Items
async function insertMenuItems() {
  const inserted = await dbClient
    .insert(menuItems)
    .values([
      {
        name: "Katsu Curry",
        description: "Japanese curry with breaded pork cutlet",
        price: 149.0,
        category: "rice",
        imageUrl: "https://ik.imagekit.io/496kiwiBird/261497project/menu6.png",
      },
      {
        name: "Beef Ramen",
        description: "Ramen noodles with beef and broth",
        price: 159.0,
        category: "noodle",
        imageUrl: "https://ik.imagekit.io/496kiwiBird/261497project/menu1.png",
      },
      {
        name: "Green Tea",
        description: "Refreshing Japanese green tea",
        price: 39.0,
        category: "drink",
        imageUrl: "https://ik.imagekit.io/496kiwiBird/261497project/menu2.png",
      },
    ])
    .returning();

  console.log("Inserted menu items:", inserted);
}

// 6. Insert Order
async function insertOrder() {
  const sessions = await dbClient.query.diningSessions.findMany();
  if (sessions.length === 0) return;

  const [order] = await dbClient
  .insert(orders)
  .values({
    tableId: 1,
    diningSessionId: sessions[0].id, // ✅ ใช้ camelCase
    status: "PENDING",
  })
  .returning();


  console.log("Inserted order:", order);
}

// 7. Insert Order Items
async function insertOrderItems() {
  const orderList = await dbClient.query.orders.findMany();
  const menuList = await dbClient.query.menuItems.findMany();
  const memberList = await dbClient.query.members.findMany();

  if (orderList.length === 0 || menuList.length === 0 || memberList.length === 0)
    return;

await dbClient.insert(orderItems).values([
  {
    orderId: orderList[0].id,
    menuItemId: menuList[0].id,
    memberId: memberList[0].id,
    quantity: 2,
    note: "Extra spicy",
  },
  {
    orderId: orderList[0].id,
    menuItemId: menuList[1].id,
    memberId: memberList[1].id,
    quantity: 1,
    note: "No onion",
  },
  {
    orderId: orderList[0].id,
    menuItemId: menuList[2].id,
    memberId: memberList[2].id,
    quantity: 3,
    note: "Less sugar",
  },
]);

  console.log("Inserted order items!");
}

// Main runner
async function main() {
  await clearDatabase();
  await insertAdmins();
  await insertTables();
  await insertDiningSessions();
  await insertMembers();
  await insertMenuItems();
  await insertOrder();
  await insertOrderItems();
}

main()
  .then(() => {
    console.log("✅ Seed completed successfully!");
    dbConn.end();
  })
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    dbConn.end();
  });
