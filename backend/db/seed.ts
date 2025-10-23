import { dbClient, dbConn } from "@db/client.js";
import { eq } from "drizzle-orm";
import QRCode from "qrcode";
import {
  admins,
  tables,
  diningSessions,
  menuItems,
  orders,
  orderItems,
  groups,
  group_members,
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
      number: 2,
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
        tableId: tableList[1].id,
        openedByAdminId: adminList[0].id,
        qrCode: "", // สร้างทีหลัง
        status: "ACTIVE",
      })
      .returning();

    if (!session) throw new Error("Failed to insert dining session");

    // สร้าง QR Code เป็น URL ชี้ไปยังหน้า frontend ของโต๊ะ/กลุ่ม
    const url = process.env.VITE_FRONTEND_URL || "http://10.0.0.51:5173"; // ปรับ portตาม frontend
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

async function updateQRForDiningSession(sessionId: number) {
  try {
    const existingSession = await dbClient.query.diningSessions.findFirst({
      where: eq(diningSessions.id, sessionId),
    });

    if (!existingSession) {
      console.warn(
        `Dining session with ID ${sessionId} not found. Cannot update QR code.`
      );
      dbConn.end();
      return;
    }

    const url = process.env.VITE_FRONTEND_URL || "http://localhost:5173";

    const sessionUrl = `${url}/tables/${sessionId}`;
    const newQrCodeDataUrl = await QRCode.toDataURL(sessionUrl);

    await dbClient
      .update(diningSessions)
      .set({ qrCode: newQrCodeDataUrl })
      .where(eq(diningSessions.id, sessionId));

    console.log(
      `Successfully updated QR Code for dining session ID: ${sessionId}`
    );
  } catch (err) {
    console.error(`Failed to update QR Code for session ${sessionId}:`, err);
  } finally {
    dbConn.end();
  }
}

// 3. Insert Dining Session
// async function insertDiningSession() {
//   const adminList = await dbClient.query.admins.findMany();
//   const tableList = await dbClient.query.tables.findMany();

//   if (adminList.length === 0 || tableList.length === 0) {
//     console.log("Need admin and table first!");
//     dbConn.end();
//     return;
//   }

//   const [session] = await dbClient
//     .insert(diningSessions)
//     .values({
//       tableId: tableList[0].id,
//       openedByAdminId: adminList[0].id,
//       qrCode: "http://example.com/qr/1",
//       status: "ACTIVE",
//     })
//     .returning();

//   console.log("Inserted dining session:", session);
//   dbConn.end();
// }

// 4. Insert Members
/*
async function insertMembers() {
  const sessions = await dbClient.query.diningSessions.findMany();

  if (sessions.length === 0) {
    console.log("Need dining session first!");
    dbConn.end();
    return;
  }

  const [member1] = await dbClient
    .insert(group_members)
    .values({
      diningSessionId: sessions[1].id,
      name: "Alice",
 
    })
    .returning();

  const [member2] = await dbClient
    .insert(group_members)
    .values({
      diningSessionId: sessions[0].id,
      name: "Bob",
    })
    .returning();

  console.log("Inserted members:", [member1]);
  dbConn.end();
}*/

// 5. Insert Menu Items
async function insertMenuItems() {
  const [menu1] = await dbClient
    .insert(menuItems)
    .values({
      name: "Ebi Fry Katsu Curry Rice",
      description:
        "Rich and flavorful Japanese Curry served over soft, fluffy Japanese rice. Topped with large Ebi Fry.",
      price: 289.0,
      isSignature: false,
      category: "Rice",
      imageUrl: 'https://ik.imagekit.io/496kiwiBird/261497project/menu1.png?updatedAt=1759220941089',
    })
    .returning();

  const [menu2] = await dbClient
    .insert(menuItems)
    .values({
      name: "Enso's Secret Beef Ramen",
      description:
        "A luxurious bowl featuring marinated beef, soft-boiled egg, and rich broth.",
      price: 159.0,
      isSignature: true,
      category: "Noodle",
      imageUrl: 'https://ik.imagekit.io/496kiwiBird/261497project/signature.png?updatedAt=1759220936892'

    })
    .returning();

  const [menu3] = await dbClient
    .insert(menuItems)
    .values({
      name: "Kuro Mayu Chashu Ramen",
      description:
        "The ultimate rich ramen experience. A creamy, robust pork broth bowl infused with smoky-sweet black garlic oil.",
      price: 169.0,
      isSignature: false,
      category: "Noodle",
      imageUrl:
        "https://ik.imagekit.io/496kiwiBird/261497project/menu2.png?updatedAt=1759220940713",
    })
    .returning();

  const [menu4] = await dbClient
    .insert(menuItems)
    .values({
      name: "Mushroom & Soba Clarity",
      description:
        "A clear dashi broth paired with soba noodles, featuring an abundance of small, earthy mushrooms and a garnish of microgreens.",
      price: 156.0,
      isSignature: false,
      category: "Noodle",
      imageUrl:
        "https://ik.imagekit.io/496kiwiBird/261497project/Mask%20group%20(4).png?updatedAt=1759384870088",
    })
    .returning();

  const [menu5] = await dbClient
    .insert(menuItems)
    .values({
      name: "Spicy Chicken Soboro Ramen",
      description:
        "A savory and rich broth served with springy ramen noodles, topped with seasoned spicy ground chicke and sweet corn.",
      price: 201.0,
      isSignature: false,
      category: "Noodle",
      imageUrl:
        "https://ik.imagekit.io/496kiwiBird/261497project/menu3.png?updatedAt=1759220940332",
    })
    .returning();

  const [menu6] = await dbClient
    .insert(menuItems)
    .values({
      name: "The Harvest Bowl",
      description:
        "A vibrant and filling noodle dish that balances heat and sweetness. Features fresh corn kernels.",
      price: 149.0,
      isSignature: false,
      category: "Noodle",
      imageUrl:
        "https://ik.imagekit.io/496kiwiBird/261497project/Mask%20group%20(3).png?updatedAt=1759384859238",
    })
    .returning();

  const [menu7] = await dbClient
    .insert(menuItems)
    .values({
      name: "Katsu curry",
      description:
        "A classic, comforting dish featuring tender beef chunks, slow-cooked with carrots and onions.",
      price: 149.0,
      isSignature: false,
      category: "Rice",
      imageUrl:
        "https://ik.imagekit.io/496kiwiBird/261497project/menu6.png?updatedAt=1759410727451",
    })
    .returning();
  const [menu8] = await dbClient
    .insert(menuItems)
    .values({
      name: "Kyoza",
      description:
        "Crispy pork Gyoza.",
      price: 159.0,
      isSignature: false,
      category: "Appetizer",
      imageUrl:
        "https://ik.imagekit.io/496kiwiBird/261497project/kyoza.PNG?updatedAt=1760404585768",
    })
    .returning();
  console.log("Inserted menu items:", [menu1, menu2, menu3, menu4, menu5, menu6, menu7, menu8]);
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
      tableId: 4,
      diningSessionId: sessions[1].id,
      status: "PENDING",
    })
    .returning();

  console.log("Inserted order:", order);
  dbConn.end();
}

// 7. Insert Order Items
/*
async function insertOrderItems() {
  const orderList = await dbClient.query.orders.findMany();
  const menuList = await dbClient.query.menuItems.findMany();
  const memberList = await dbClient.query.group_members.findMany();

  if (orderList.length === 0 || menuList.length < 2 || memberList.length < 2) {
    console.log("Need orders, menu items, and members first!");
    dbConn.end();
    return;
  }

  await dbClient.insert(orderItems).values([
  {
    order_id: orderList[1].id,
    menu_item_id: menuList[0].id,
    member_id: memberList[0].id,
    quantity: 2,
    note: "Extra spicy",
  },
  {
    order_id: orderList[1].id,
    menu_item_id: menuList[2].id,
    member_id: memberList[0].id,
    quantity: 4,
    note: "No beans",
  },
  {
    order_id: orderList[1].id,
    menu_item_id: menuList[1].id,
    member_id: memberList[0].id,
    quantity: 1,
  },
]);


  console.log("Inserted order items!");
  dbConn.end();
}*/

export const insertGroup = async () => {
  try {
    const existingSessions = await dbClient.query.diningSessions.findMany({
      where: eq(diningSessions.tableId, 4),
      orderBy: (diningSessions, { desc }) => [desc(diningSessions.id)],
      limit: 1,
    });

    let sessionId: number;
    let tableId: number;
    let qrCode: string;

    if (existingSessions.length > 0) {
      // ใช้ session ที่มีอยู่
      console.log("Using existing dining session:", existingSessions[0]);
      sessionId = existingSessions[0].id;
      tableId = existingSessions[0].tableId;
      qrCode = existingSessions[0].qrCode;
    } else {
      // สร้าง session ใหม่พร้อม QR Code
      const url = `http://localhost:5173/tables/4`;
      const qrCodeDataUrl = await QRCode.toDataURL(url);

      const newSession = await dbClient
        .insert(diningSessions)
        .values({
          tableId: 4,
          openedByAdminId: 3,
          status: "ACTIVE",
          startedAt: new Date(),
          createdAt: new Date(),
          qrCode: qrCodeDataUrl,
        })
        .returning({
          id: diningSessions.id,
          tableId: diningSessions.tableId,
          qrCode: diningSessions.qrCode,
        });

      sessionId = newSession[0].id;
      tableId = newSession[0].tableId;
      qrCode = newSession[0].qrCode;

      console.log("Dining session created:", newSession[0]);
    }

    // สร้าง group สำหรับ session/โต๊ะนั้น
    const newGroup = await dbClient
      .insert(groups)
      .values({
        tableId: tableId,
        creatorUserId: 3,
        createdAt: new Date(),
      })
      .returning({
        id: groups.id,
        tableId: groups.tableId,
        creatorUserId: groups.creatorUserId,
      });

    console.log("Group created:", newGroup[0]);
    console.log("Seeding completed successfully!");
  } catch (err) {
    console.error("Seeding failed:", err);
  }
};

export const seedTables = async () => {
  try {
    const tablesToCreate = [
      { number: 1, status: "AVAILABLE" },
      { number: 2, status: "AVAILABLE" },
      { number: 3, status: "AVAILABLE" },
      { number: 4, status: "AVAILABLE" },
      { number: 5, status: "AVAILABLE" },
      { number: 6, status: "AVAILABLE" },
      { number: 7, status: "AVAILABLE" },
      { number: 8, status: "AVAILABLE" },
      { number: 9, status: "AVAILABLE" },
    ];
    for (const table of tablesToCreate) {
      await dbClient
        .insert(tables)
        .values(table)
        .onConflictDoUpdate({
          target: tables.number,
          set: { status: "AVAILABLE" },
        });
    }
    console.log("Tables 1-9 seeded successfully!");
  } catch (error) {
    console.error("Error seeding tables:", error);
  }
};

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
  const results = await dbClient.query.group_members.findMany();
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

export const seedDatabase = async () => {
  try {
    console.log("Starting database seed...");
    await insertMenuItems();
    await seedTables();
    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding the database:", error);
    throw error;
  } finally {
    await dbConn.end();
    console.log("Database connection closed");
  }
};

seedDatabase();


// seedTables()
// insertAdmin();
// insertTable();
// insertGroup()
// updateQRForDiningSession(1)
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
