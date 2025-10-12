// import { dbClient, dbConn } from "@db/client.js";
// import { eq } from "drizzle-orm";
// import QRCode from "qrcode";
// import {
//   admins,
//   tables,
//   diningSessions,
//   members,
//   menuItems,
//   orders,
//   orderItems,
//   groups,
//   group_members,
// } from "@db/schema.js";
// import bcrypt from "bcrypt";

// /** 🧹 Clear all data before seeding */
// async function clearDatabase() {
//   await dbClient.delete(orderItems);
//   await dbClient.delete(orders);
//   await dbClient.delete(menuItems);
//   await dbClient.delete(group_members);
//   await dbClient.delete(members);
//   await dbClient.delete(groups);
//   await dbClient.delete(diningSessions);
//   await dbClient.delete(tables);
//   await dbClient.delete(admins);

//   console.log("✅ Database cleared!");
// }

// /** 1. Insert Admins */
// async function insertAdmins() {
//   const hash = await bcrypt.hash("1234", 10);
//   const inserted = await dbClient
//     .insert(admins)
//     .values([
//       {
//         username: "admin1",
//         name: "Admin 1",
//         phone: "0811111111",
//         address: "Headquarters",
//         email: "admin1@example.com",
//         password: hash,
//       },
//       {
//         username: "admin2",
//         name: "Admin 2",
//         phone: "0999999999",
//         address: "Branch Office",
//         email: "admin2@example.com",
//         password: hash,
//       },
//     ])
//     .returning();

//   console.log("Inserted admins:", inserted);
// }

// /** 2. Insert Tables */
// async function insertTables() {
//   const inserted = await dbClient
//     .insert(tables)
//     .values([
//       { number: 1, status: "AVAILABLE" },
//       { number: 2, status: "AVAILABLE" },
//     ])
//     .returning();

//   console.log("Inserted tables:", inserted);
// }

// /** 3. Insert Dining Session + generate QR */
// async function insertDiningSessions() {
//   const [admin] = await dbClient.select().from(admins).limit(1);
//   const [table] = await dbClient.select().from(tables).limit(1);
//   if (!admin || !table) throw new Error("Missing admin or table!");

//   const [session] = await dbClient
//     .insert(diningSessions)
//     .values({
//       tableId: table.id,
//       openedByAdminId: admin.id,
//       qrCode: "",
//       status: "ACTIVE",
//     })
//     .returning();

//   const url = process.env.VITE_FRONTEND_URL || "http://localhost:5173";
//   const qrData = await QRCode.toDataURL(`${url}/tables/${session.id}`);

//   await dbClient
//     .update(diningSessions)
//     .set({ qrCode: qrData })
//     .where(eq(diningSessions.id, session.id));

//   console.log("Inserted dining session:", session.id);
//   return session;
// }

// /** 4. Insert Groups */
// async function insertGroups(sessionId: number, tableId: number) {
//   const inserted = await dbClient
//     .insert(groups)
//     .values([
//       {
//         table_id: tableId,
//         creator_user_id: null,
//       },
//     ])
//     .returning();

//   console.log("Inserted groups:", inserted);
//   return inserted[0];
// }

// /** 5. Insert Members */
// async function insertMembers(sessionId: number) {
//   const inserted = await dbClient
//     .insert(members)
//     .values([
//       { diningSessionId: sessionId, name: "Alice", isTableAdmin: true },
//       { diningSessionId: sessionId, name: "Bob", isTableAdmin: false },
//       { diningSessionId: sessionId, name: "Charlie", isTableAdmin: false },
//     ])
//     .returning();

//   console.log("Inserted members:", inserted);
//   return inserted;
// }

// /** 6. Insert Group Members */
// async function insertGroupMembers(group: any, sessionId: number) {
//   const inserted = await dbClient
//     .insert(group_members)
//     .values([
//       {
//         name: "Alice",
//         group_id: group.id,
//         diningSessionId: sessionId,
//         isTableAdmin: true,
//         note: "Table host",
//       },
//       {
//         name: "Bob",
//         group_id: group.id,
//         diningSessionId: sessionId,
//         isTableAdmin: false,
//       },
//       {
//         name: "Charlie",
//         group_id: group.id,
//         diningSessionId: sessionId,
//         isTableAdmin: false,
//       },
//     ])
//     .returning();

//   console.log("Inserted group members:", inserted);
//   return inserted;
// }

// /** 7. Insert Menu Items */
// async function insertMenuItems() {
//   const inserted = await dbClient
//     .insert(menuItems)
//     .values([
//       {
//         name: "Katsu Curry",
//         description: "Japanese curry with breaded pork cutlet",
//         price: 149,
//         category: "rice",
//         imageUrl: "https://ik.imagekit.io/496kiwiBird/261497project/menu6.png",
//       },
//       {
//         name: "Beef Ramen",
//         description: "Ramen noodles with beef and broth",
//         price: 159,
//         category: "noodle",
//         imageUrl: "https://ik.imagekit.io/496kiwiBird/261497project/menu1.png",
//       },
//       {
//         name: "Green Tea",
//         description: "Refreshing Japanese green tea",
//         price: 39,
//         category: "drink",
//         imageUrl: "https://ik.imagekit.io/496kiwiBird/261497project/menu2.png",
//       },
//     ])
//     .returning();

//   console.log("Inserted menu items:", inserted);
//   return inserted;
// }

// /** 8. Insert Order */
// async function insertOrder(sessionId: number, tableId: number) {
//   const [order] = await dbClient
//     .insert(orders)
//     .values({
//       tableId,
//       diningSessionId: sessionId,
//       status: "PENDING",
//     })
//     .returning();

//   console.log("Inserted order:", order);
//   return order;
// }

// /** 9. Insert Order Items */
// async function insertOrderItems(orderId: number, members: any[], menus: any[]) {
//   await dbClient.insert(orderItems).values([
//   // 🍛 Katsu Curry — Alice + Bob สั่งเมนูเดียวกัน
//   {
//     orderId,
//     menuItemId: menus[0].id,
//     memberId: members[0].id, // Alice
//     quantity: 1,
//     note: "Extra spicy",
//   },
//   {
//     orderId,
//     menuItemId: menus[0].id,
//     memberId: members[1].id, // Bob
//     quantity: 1,
//     note: "Extra spicy",
//   },

//   // 🍜 Beef Ramen — Charlie
//   {
//     orderId,
//     menuItemId: menus[1].id,
//     memberId: members[2].id,
//     quantity: 1,
//     note: "No onion",
//   },

//   // 🍵 Green Tea — Alice + Charlie
//   {
//     orderId,
//     menuItemId: menus[2].id,
//     memberId: members[0].id,
//     quantity: 1,
//     note: "Less sugar",
//   },
//   {
//     orderId,
//     menuItemId: menus[2].id,
//     memberId: members[2].id,
//     quantity: 2,
//     note: "Less sugar",
//   },
// ]);
//   console.log("Inserted order items!");
// }

// /** 🧩 Main Seeder */
// async function main() {
//   await clearDatabase();
//   await insertAdmins();
//   await insertTables();
//   const session = await insertDiningSessions();
//   const group = await insertGroups(session.id, session.tableId);
//   const members = await insertMembers(session.id);
//   await insertGroupMembers(group, session.id);
//   const menus = await insertMenuItems();
//   const order = await insertOrder(session.id, session.tableId);
//   await insertOrderItems(order.id, members, menus);
// }

// main()
//   .then(() => {
//     console.log("✅ Seed completed successfully!");
//     dbConn.end();
//   })
//   .catch((err) => {
//     console.error("❌ Seed failed:", err);
//     dbConn.end();
//   });


// -- ของปุ้ย ----  // 
// import { dbClient, dbConn } from "@db/client.js";
// import { eq } from "drizzle-orm";
// import QRCode from "qrcode";
// import bcrypt from "bcrypt";
// import {
//   admins,
//   tables,
//   diningSessions,
//   menuItems,
//   orders,
//   order_items,
//   groups,
//   bills,
//   billSplits,
//   payments,
//   members,
//   group_members,
//   users,
// } from "@db/schema.js";

// /** 🧹 Clear all data before seeding */
// async function clearDatabase() {
//     await dbClient.delete(order_items);   // ← ลูกของ orders
//   await dbClient.delete(payments);      // ← ลูกของ bills และ bill_splits
//   await dbClient.delete(billSplits);    // ← ลูกของ bills
//   await dbClient.delete(bills);         // ← ลูกของ orders
//   await dbClient.delete(orders);        // ← ลูกของ diningSessions/groups
//   await dbClient.delete(menuItems);     // standalone
//   await dbClient.delete(group_members); // ลูกของ groups
//   await dbClient.delete(groups);        // ลูกของ diningSessions
//   await dbClient.delete(members);       // ลูกของ diningSessions
//   await dbClient.delete(diningSessions);
//   await dbClient.delete(tables);
//   await dbClient.delete(admins);
//   await dbClient.delete(users);   

//   console.log("✅ Database cleared!");
// }

// /** 1. Insert Admins */
// async function insertAdmins() {
//   const hash = await bcrypt.hash("1234", 10);
//   const inserted = await dbClient
//     .insert(admins)
//     .values([
//       {
//         username: "admin1",
//         name: "Admin 1",
//         phone: "0811111111",
//         address: "Headquarters",
//         email: "admin1@example.com",
//         password: hash,
//       },
//     ])
//     .returning();

//   console.log("Inserted admins:", inserted);
//   return inserted[0];
// }

// /** 2. Insert Tables */
// async function insertTables() {
//   const inserted = await dbClient
//     .insert(tables)
//     .values([
//       { number: 1, status: "AVAILABLE" },
//       { number: 2, status: "AVAILABLE" },
//     ])
//     .returning();

//   console.log("Inserted tables:", inserted);
//   return inserted;
// }

// /** 3. Insert Dining Session + generate QR */
// async function insertDiningSessions(admin: any, table: any) {
//   const [session] = await dbClient
//     .insert(diningSessions)
//     .values({
//       tableId: table.id,
//       openedByAdminId: admin.id,
//       qrCode: "",
//       status: "ACTIVE",
//     })
//     .returning();

//   const url = process.env.VITE_FRONTEND_URL || "http://localhost:5173";
//   const qrData = await QRCode.toDataURL(`${url}/tables/${session.id}`);

//   await dbClient
//     .update(diningSessions)
//     .set({ qrCode: qrData })
//     .where(eq(diningSessions.id, session.id));

//   console.log("✅ Inserted dining session:", session.id);
//   return session;
// }

// /** 4. Insert Group (no members) */
// async function insertGroups(session: any, table: any) {
//   const [group] = await dbClient
//     .insert(groups)
//     .values({
//       table_id: table.id,
//       creator_user_id: null, // ไม่มีสมาชิก
//     })
//     .returning();

//   console.log("✅ Inserted group:", group);
//   return group;
// }

// /** 5. Insert Menu Items */
// async function insertMenuItems() {
//   const inserted = await dbClient
//     .insert(menuItems)
//     .values([
//       {
//         name: "Katsu Curry",
//         description: "Japanese curry with breaded pork cutlet",
//         price: 149,
//         category: "rice",
//         imageUrl: "https://ik.imagekit.io/496kiwiBird/261497project/menu6.png",
//       },
//       {
//         name: "Beef Ramen",
//         description: "Ramen noodles with beef and broth",
//         price: 159,
//         category: "noodle",
//         imageUrl: "https://ik.imagekit.io/496kiwiBird/261497project/menu1.png",
//       },
//       {
//         name: "Green Tea",
//         description: "Refreshing Japanese green tea",
//         price: 39,
//         category: "drink",
//         imageUrl: "https://ik.imagekit.io/496kiwiBird/261497project/menu2.png",
//       },
//     ])
//     .returning();

//   console.log("✅ Inserted menu items:", inserted.length);
//   return inserted;
// }


// /** 🧩 Main Seeder */
// async function main() {
//   await clearDatabase();
//   const admin = await insertAdmins();
//   const [table] = await insertTables();
//   const session = await insertDiningSessions(admin, table);
//   // await insertGroups(session, table);
//    const group = await insertGroups(session, table); // <-- เก็บค่ากลับมา
//   await insertMenuItems();

//     // ✅ 6. Insert dummy group member (จำเป็นเพราะ order ต้องมี member)
//   const [member] = await dbClient
//     .insert(group_members)
//     .values({
//       name: "Seed Member",
//       group_id: 1,
//       user_id: null,
//       diningSessionId: session.id,
//       isTableAdmin: false,
//       note: "for seed testing",
//     })
//     .returning();

//   console.log("✅ Inserted group member:", member);

//   // ✅ 7. Insert order (เชื่อมกับ dining session + table)
//   const [order] = await dbClient
//     .insert(orders)
//     .values({
//       table_id: table.id,
//       group_id: 1,
//       user_id: null,
//       dining_session_id: session.id,
//       status: "PENDING",
//     })
//     .returning();

//   console.log("✅ Inserted order:", order);

//   // ✅ 8. Insert order item (เชื่อมกับ menu item + member)
//   const [menu] = await dbClient.select().from(menuItems).limit(1);

//   const [orderItem] = await dbClient
//     .insert(order_items)
//     .values({
//       order_id: order.id,
//       menu_item_id: menu.id,
//       member_id: member.id,
//       quantity: 2,
//       note: "seed test item",
//       status: "PREPARING",
//     })
//     .returning();

//   console.log("✅ Inserted order item:", orderItem);

//   // ✅ 9. Optional: สร้าง bill ทดสอบ (เพื่อให้ bill test ผ่านได้ด้วย)
//   const subtotal = menu.price * 2;
//   const serviceCharge = +(subtotal * 0.07).toFixed(2);
//   const total = +(subtotal + serviceCharge).toFixed(2);

//   const [bill] = await dbClient
//     .insert(bills)
//     .values({
//       orderId: order.id,
//       diningSessionId: session.id,
//       subtotal,
//       serviceCharge,
//       vat: 0,
//       total,
//       status: "UNPAID",
//     })
//     .returning();

//   console.log("✅ Inserted bill:", bill);

//   // ✅ 10. Insert bill split (เชื่อมกับ member)
//   await dbClient.insert(billSplits).values({
//     billId: bill.id,
//     memberId: member.id,
//     amount: total,
//     paid: false,
//   });

//   console.log("✅ Inserted bill split for member:", member.id);


//   console.log("🎉 Done! QR code generated for session:", session.id);
// }

// main()
//   .then(() => {
//     console.log("✅ Seed completed successfully!");
//     dbConn.end();
//   })
//   .catch((err) => {
//     console.error("❌ Seed failed:", err);
//     dbConn.end();
//   });

// version ok //
// import { dbClient, dbConn } from "@db/client.js";
// import { eq } from "drizzle-orm";
// import QRCode from "qrcode";
// import bcrypt from "bcrypt";
// import {
//   admins,
//   tables,
//   diningSessions,
//   menuItems,
//   orders,
//   order_items,
//   groups,
//   bills,
//   billSplits,
//   payments,
//   group_members,
//   users,
// } from "@db/schema.js";

// /** 🧹 Clear all data before seeding */
// async function clearDatabase() {
//   await dbClient.delete(order_items);
//   await dbClient.delete(payments);
//   await dbClient.delete(billSplits);
//   await dbClient.delete(bills);
//   await dbClient.delete(orders);
//   await dbClient.delete(menuItems);
//   await dbClient.delete(group_members);
//   await dbClient.delete(groups);
//   await dbClient.delete(diningSessions);
//   await dbClient.delete(tables);
//   await dbClient.delete(admins);
//   await dbClient.delete(users);
//   console.log("✅ Database cleared!");
// }

// /** 1. Insert Admin */
// async function insertAdmins() {
//   const hash = await bcrypt.hash("1234", 10);
//   const [admin] = await dbClient
//     .insert(admins)
//     .values({
//       username: "admin1",
//       name: "Admin 1",
//       phone: "0811111111",
//       address: "Headquarters",
//       email: "admin1@example.com",
//       password: hash,
//     })
//     .returning();
//   console.log("✅ Inserted admin:", admin);
//   return admin;
// }

// /** 2. Insert Table */
// async function insertTables() {
//   const [table] = await dbClient
//     .insert(tables)
//     .values({ number: 1, status: "AVAILABLE" })
//     .returning();
//   console.log("✅ Inserted table:", table);
//   return table;
// }

// /** 3. Insert Dining Session */
// async function insertDiningSessions(admin: any, table: any) {
//   const [session] = await dbClient
//     .insert(diningSessions)
//     .values({
//       tableId: table.id,
//       openedByAdminId: admin.id,
//       qrCode: "",
//       status: "ACTIVE",
//     })
//     .returning();

//   const url = process.env.VITE_FRONTEND_URL || "http://localhost:5173";
//   const qrData = await QRCode.toDataURL(`${url}/tables/${session.id}`);

//   await dbClient
//     .update(diningSessions)
//     .set({ qrCode: qrData })
//     .where(eq(diningSessions.id, session.id));

//   console.log("✅ Inserted dining session:", session);
//   return session;
// }

// /** 4. Insert Group */
// async function insertGroups(session: any, table: any) {
//   const [group] = await dbClient
//     .insert(groups)
//     .values({
//       table_id: table.id,
//       creator_user_id: null,
//     })
//     .returning();

//   console.log("✅ Inserted group:", group);
//   return group;
// }

// /** 5. Insert Menu Items */
// async function insertMenuItems() {
//   const inserted = await dbClient
//     .insert(menuItems)
//     .values([
//       {
//         name: "Katsu Curry",
//         description: "Japanese curry with breaded pork cutlet",
//         price: 149,
//         category: "rice",
//         imageUrl: "https://ik.imagekit.io/496kiwiBird/261497project/menu6.png",
//       },
//       {
//         name: "Beef Ramen",
//         description: "Ramen noodles with beef and broth",
//         price: 159,
//         category: "noodle",
//         imageUrl: "https://ik.imagekit.io/496kiwiBird/261497project/menu1.png",
//       },
//       {
//         name: "Green Tea",
//         description: "Refreshing Japanese green tea",
//         price: 39,
//         category: "drink",
//         imageUrl: "https://ik.imagekit.io/496kiwiBird/261497project/menu2.png",
//       },
//     ])
//     .returning();

//   console.log("✅ Inserted menu items:", inserted.length);
//   return inserted;
// }

// /** 🧩 Main Seeder */
// async function main() {
//   await clearDatabase();
//   const admin = await insertAdmins();
//   const table = await insertTables();
//   const session = await insertDiningSessions(admin, table);
//   const group = await insertGroups(session, table);
//   const menus = await insertMenuItems();

//   // ✅ Insert member (ใช้ group.id จากที่สร้างจริง)
//   const [member] = await dbClient
//     .insert(group_members)
//     .values({
//       name: "Seed Member",
//       group_id: group.id,
//       user_id: null,
//       diningSessionId: session.id,
//       isTableAdmin: false,
//       note: "for seed testing",
//     })
//     .returning();

//   console.log("✅ Inserted member:", member);

//   // ✅ Insert order
//   const [order] = await dbClient
//     .insert(orders)
//     .values({
//       table_id: table.id,
//       group_id: group.id,
//       user_id: null,
//       dining_session_id: session.id,
//       status: "PENDING",
//     })
//     .returning();

//   console.log("✅ Inserted order:", order);

//   // ✅ Insert order item
//   const menu = menus[0];
//   const [orderItem] = await dbClient
//     .insert(order_items)
//     .values({
//       order_id: order.id,
//       menu_item_id: menu.id,
//       member_id: member.id,
//       quantity: 2,
//       note: "seed test item",
//       status: "PREPARING",
//     })
//     .returning();

//   console.log("✅ Inserted order item:", orderItem);

//   // ✅ Insert bill
//   const subtotal = menu.price * 2;
//   const serviceCharge = +(subtotal * 0.07).toFixed(2);
//   const total = +(subtotal + serviceCharge).toFixed(2);

//   const [bill] = await dbClient
//     .insert(bills)
//     .values({
//       orderId: order.id,
//       diningSessionId: session.id,
//       subtotal,
//       serviceCharge,
//       vat: 0,
//       total,
//       status: "UNPAID",
//     })
//     .returning();

//   console.log("✅ Inserted bill:", bill);

//   await dbClient.insert(billSplits).values({
//     billId: bill.id,
//     memberId: member.id,
//     amount: total,
//     paid: false,
//   });

//   console.log("✅ Inserted bill split");
//   console.log("🎉 Done seeding all tables!");
// }

// main()
//   .then(() => {
//     console.log("✅ Seed completed successfully!");
//     dbConn.end();
//   })
//   .catch((err) => {
//     console.error("❌ Seed failed:", err);
//     dbConn.end();
//   });

import { dbClient, dbConn } from "@db/client.js";
import { eq } from "drizzle-orm";
import QRCode from "qrcode";
import bcrypt from "bcrypt";
import {
  admins,
  tables,
  diningSessions,
  menuItems,
  orders,
  order_items,
  groups,
  bills,
  billSplits,
  payments,
  group_members,
  users,
} from "@db/schema.js";

/** 🧹 Clear all data before seeding */
async function clearDatabase() {
  await dbClient.delete(order_items);
  await dbClient.delete(payments);
  await dbClient.delete(billSplits);
  await dbClient.delete(bills);
  await dbClient.delete(orders);
  await dbClient.delete(menuItems);
  await dbClient.delete(group_members);
  await dbClient.delete(groups);
  await dbClient.delete(diningSessions);
  await dbClient.delete(tables);
  await dbClient.delete(admins);
  await dbClient.delete(users);
  console.log("✅ Database cleared!");
}

/** 1. Insert Admin */
async function insertAdmins() {
  const hash = await bcrypt.hash("1234", 10);
  const [admin] = await dbClient
    .insert(admins)
    .values({
      username: "admin1",
      name: "Admin 1",
      phone: "0811111111",
      address: "Headquarters",
      email: "admin1@example.com",
      password: hash,
    })
    .returning();
  console.log("✅ Inserted admin:", admin);
  return admin;
}

/** 2. Insert Table */
async function insertTables() {
  const [table] = await dbClient
    .insert(tables)
    .values({ number: 1, status: "AVAILABLE" })
    .returning();
  console.log("✅ Inserted table:", table);
  return table;
}

/** 3. Insert Dining Session */
async function insertDiningSessions(admin: any, table: any) {
  const startedAt = new Date();
  const createdAt = new Date();
  const [session] = await dbClient
    .insert(diningSessions)
    .values({
      tableId: table.id,
      openedByAdminId: admin.id,
      qrCode: "",
      status: "ACTIVE",
      startedAt,
      createdAt,
      total_customers: 0,
    })
    .returning();

  const url = process.env.VITE_FRONTEND_URL || "http://localhost:5173";
  const qrData = await QRCode.toDataURL(`${url}/tables/${session.id}`);

  await dbClient
    .update(diningSessions)
    .set({ qrCode: qrData })
    .where(eq(diningSessions.id, session.id));

  console.log("✅ Inserted dining session:", session);
  return session;
}

/** 4. Insert Group */
async function insertGroups(session: any, table: any) {
  const [group] = await dbClient
    .insert(groups)
    .values({
      table_id: table.id,
      creator_user_id: null,
      created_at: new Date(),
    })
    .returning();

  console.log("✅ Inserted group:", group);
  return group;
}

/** 5. Insert Menu Items */
async function insertMenuItems() {
  const inserted = await dbClient
    .insert(menuItems)
    .values([
      {
        name: "Katsu Curry",
        description: "Japanese curry with breaded pork cutlet",
        price: 149,
        category: "rice",
        imageUrl: "https://ik.imagekit.io/496kiwiBird/261497project/menu6.png",
      },
      {
        name: "Beef Ramen",
        description: "Ramen noodles with beef and broth",
        price: 159,
        category: "noodle",
        imageUrl: "https://ik.imagekit.io/496kiwiBird/261497project/menu1.png",
      },
      {
        name: "Green Tea",
        description: "Refreshing Japanese green tea",
        price: 39,
        category: "drink",
        imageUrl: "https://ik.imagekit.io/496kiwiBird/261497project/menu2.png",
      },
    ])
    .returning();

  console.log("✅ Inserted menu items:", inserted.length);
  return inserted;
}

/** 6. Insert Group Member */
async function insertMember(group: any, session: any) {
  const [member] = await dbClient
    .insert(group_members)
    .values({
      name: "Seed Member",
      group_id: group.id,
      user_id: null,
      diningSessionId: session.id,
      isTableAdmin: false,
      joinedAt: new Date(),
      note: "for seed testing",
    })
    .returning();

  console.log("✅ Inserted member:", member);
  return member;
}

/** 7. Insert Order */
async function insertOrder(table: any, group: any, session: any) {
  const [order] = await dbClient
    .insert(orders)
    .values({
      table_id: table.id,
      group_id: group.id,
      user_id: null,
      dining_session_id: session.id,
      status: "PENDING",
      created_at: new Date(),
    })
    .returning();

  console.log("✅ Inserted order:", order);
  return order;
}

/** 8. Insert Order Item */
async function insertOrderItem(order: any, member: any, menu: any) {
  const [orderItem] = await dbClient
    .insert(order_items)
    .values({
      order_id: order.id,
      menu_item_id: menu.id,
      member_id: member.id,
      quantity: 2,
      note: "seed test item",
      status: "PREPARING",
    })
    .returning();

  console.log("✅ Inserted order item:", orderItem);
  return orderItem;
}

/** 9. Insert Bill + BillSplit + Payment */
async function insertBill(order: any, session: any, member: any, menu: any) {
  const subtotal = menu.price * 2;
  const serviceCharge = +(subtotal * 0.07).toFixed(2);
  const total = +(subtotal + serviceCharge).toFixed(2);

  const [bill] = await dbClient
    .insert(bills)
    .values({
      orderId: order.id,
      diningSessionId: session.id,
      subtotal,
      serviceCharge,
      vat: 0,
      total,
      status: "UNPAID",
    })
    .returning();

  console.log("✅ Inserted bill:", bill);

  await dbClient.insert(billSplits).values({
    billId: bill.id,
    memberId: member.id,
    amount: total,
    paid: false,
  });
  console.log("✅ Inserted bill split");

  const [payment] = await dbClient
  .insert(payments)
  .values({
    billId: bill.id,
    amount: total,
    status: "PENDING",
    method: "QR",
    paidAt: null,
    ref1: "seed-payment", 
  })
  .returning();

console.log("✅ Inserted payment:", payment);
return { bill, payment };

}

/** 🧩 Main Seeder */
async function main() {
  await clearDatabase();

  const admin = await insertAdmins();
  const table = await insertTables();
  const session = await insertDiningSessions(admin, table);
  const group = await insertGroups(session, table);
  const menus = await insertMenuItems();
  const member = await insertMember(group, session);
  const order = await insertOrder(table, group, session);
  await insertOrderItem(order, member, menus[0]);
  await insertBill(order, session, member, menus[0]);

  console.log("🎉 Done seeding all tables!");
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


