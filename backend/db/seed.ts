import { dbClient, dbConn } from "@db/client.js";
import { eq } from 'drizzle-orm';
import QRCode from "qrcode";
import {
  admins,
  tables,
  diningSessions,
  members,
  menuItems,
  orders,
  orderItems,
} from "@db/schema.js";
import bcrypt from "bcrypt";

// 1. Insert Admin
async function insertAdmin() {
  try {
    const plainPassword = "1234";
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    const [admin] = await dbClient
      .insert(admins)
      .values({
        username: "admin2",              
        name: "Admin 2",
        phone: "9999999999",             
        address: "123 Admin Street",     
        email: "admin2@example.com",
        password: passwordHash,
      })
      .returning({
        id: admins.id,
        username: admins.username,
        name: admins.name,
        phone: admins.phone,
        address: admins.address,
        email: admins.email,
        createdAt: admins.createdAt,
        updatedAt: admins.updatedAt,
      });

    console.log("Inserted admin:", admin);
  } catch (err) {
    console.error("Failed to insert admin:", err);
  } 
}

// 2. Insert Table
async function insertTable() {
  const [table] = await dbClient
    .insert(tables)
    .values({
      number: 1,
      status: "OCCUPIED",
    })
    .returning();
  
  console.log("Inserted table:", table);
  dbConn.end();
}

async function insertDiningSessionWithQR() {
  try {
    // ดึง admin และ table ที่มีอยู่
    const adminList = await dbClient.query.admins.findMany();
    const tableList = await dbClient.query.tables.findMany();

    if (adminList.length === 0 || tableList.length === 0) {
      console.log("Need admin and table first!");
      dbConn.end();
      return;
    }

    // สร้าง dining session
    const [session] = await dbClient
      .insert(diningSessions)
      .values({
        tableId: tableList[0].id,
        openedByAdminId: adminList[0].id,
        qrCode: "", // สร้างทีหลัง
        status: "ACTIVE",
      })
      .returning();

    if (!session) throw new Error("Failed to insert dining session");

    // สร้าง QR Code เป็น URL ชี้ไปยังหน้า frontend ของโต๊ะ/กลุ่ม
    const url = `http://localhost:5173/tables/${session.id}`; // ปรับ portตาม frontend
    const qrCodeDataUrl = await QRCode.toDataURL(url);

    // อัปเดต dining session ด้วย QR Code
    await dbClient
      .update(diningSessions)
      .set({ qrCode: qrCodeDataUrl })
      .where(eq(diningSessions.id, session.id)); 
    console.log("Inserted dining session with QR Code:", session.id);
  } catch (err) {
    console.error("Failed to insert dining session:", err);
  } finally {
    dbConn.end();
  }
}

// 3. Insert Dining Session
async function insertDiningSession() {
  const adminList = await dbClient.query.admins.findMany();
  const tableList = await dbClient.query.tables.findMany();
  
  if (adminList.length === 0 || tableList.length === 0) {
    console.log("Need admin and table first!");
    dbConn.end();
    return;
  }
  
  const [session] = await dbClient
    .insert(diningSessions)
    .values({
      tableId: tableList[0].id,
      openedByAdminId: adminList[0].id,
      qrCode: "http://example.com/qr/1",
      status: "ACTIVE",
    })
    .returning();
  
  console.log("Inserted dining session:", session);
  dbConn.end();
}

// 4. Insert Members
async function insertMembers() {
  const sessions = await dbClient.query.diningSessions.findMany();
  
  if (sessions.length === 0) {
    console.log("Need dining session first!");
    dbConn.end();
    return;
  }
  
  const [member1] = await dbClient
    .insert(members)
    .values({
      diningSessionId: sessions[0].id,
      name: "Alice",
      isTableAdmin: true,
    })
    .returning();

  const [member2] = await dbClient
    .insert(members)
    .values({
      diningSessionId: sessions[0].id,
      name: "Bob",
      isTableAdmin: false,
    })
    .returning();
  
  console.log("Inserted members:", [member1, member2]);
  dbConn.end();
}

// 5. Insert Menu Items
async function insertMenuItems() {
  const [menu1] = await dbClient
    .insert(menuItems)
    .values({
      name: "Truffle Unagi Don",
      description: "Grilled eel glazed with sweet soy, served over premium Japanese rice with truffle aroma.",
      price: 289.0,
    })
    .returning();

  const [menu2] = await dbClient
    .insert(menuItems)
    .values({
      name: "Enso's Secret Beef Ramen",
      description: "A luxurious bowl featuring marinated beef, soft-boiled egg, and rich broth.",
      price: 159.0,
    })
    .returning();
  
  console.log("Inserted menu items:", [menu1, menu2]);
  dbConn.end();
}

// 6. Insert Order
async function insertOrder() {
  const sessions = await dbClient.query.diningSessions.findMany();
  
  if (sessions.length === 0) {
    console.log("Need dining session first!");
    dbConn.end();
    return;
  }
  
  const [order] = await dbClient
    .insert(orders)
    .values({
      table_id: 1,
      dining_session_id: sessions[0].id,
      status: "PENDING",
    })
    .returning();
  
  console.log("Inserted order:", order);
  dbConn.end();
}

// 7. Insert Order Items
async function insertOrderItems() {
  const orderList = await dbClient.query.orders.findMany();
  const menuList = await dbClient.query.menuItems.findMany();
  const memberList = await dbClient.query.members.findMany();
  
  if (orderList.length === 0 || menuList.length < 2 || memberList.length < 2) {
    console.log("Need orders, menu items, and members first!");
    dbConn.end();
    return;
  }
  
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
    },
  ]);
  
  console.log("Inserted order items!");
  dbConn.end();
}

// Query functions
async function queryAdmins() {
  const results = await dbClient.query.admins.findMany();
  console.log("Admins:", results);
  dbConn.end();
}

async function queryTables() {
  const results = await dbClient.query.tables.findMany();
  console.log("Tables:", results);
  dbConn.end();
}

async function queryDiningSessions() {
  const results = await dbClient.query.diningSessions.findMany();
  console.log("Dining Sessions:", results);
  dbConn.end();
}

async function queryMembers() {
  const results = await dbClient.query.members.findMany();
  console.log("Members:", results);
  dbConn.end();
}

async function queryMenuItems() {
  const results = await dbClient.query.menuItems.findMany();
  console.log("Menu Items:", results);
  dbConn.end();
}

async function queryOrders() {
  const results = await dbClient.query.orders.findMany();
  console.log("Orders:", results);
  dbConn.end();
}

async function queryOrderItems() {
  const results = await dbClient.query.orderItems.findMany();
  console.log("Order Items:", results);
  dbConn.end();
}

// insertAdmin();
insertTable();
// insertDiningSession();
// insertDiningSessionWithQR();
// insertMembers();
// insertMenuItems();
// insertOrder();
// insertOrderItems();

// queryAdmins();
// queryTables();
// queryDiningSessions();
// queryMembers();
// queryMenuItems();
// queryOrders();
// queryOrderItems();