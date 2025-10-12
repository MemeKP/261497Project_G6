// describe("BillSplits API (with seeded data)", () => {
//   let sessionId = "";
//   let orderId = "";
//   let billId = "";
//   let memberId = "";

//   before(() => {
//     cy.sessionLoginAdmin();

//     //  ดึง session ที่ active
//     cy.sessionRequest("GET", "/dining_session/active").then((res) => {
//       expect(res.status).to.eq(200);
//       const sessions = res.body?.activeSessions || [];
//       expect(sessions.length).to.be.greaterThan(0);
//       sessionId = sessions[0].id;
//       cy.log(` Using sessionId = ${sessionId}`);
//     });

//     //  ดึง order ล่าสุดจาก DB (เพราะ seed แล้วจะมี order id = 2)
//     cy.sessionRequest("GET", "/orders").then((res) => {
//       expect(res.status).to.eq(200);
//       const orders = res.body || [];
//       expect(orders.length).to.be.greaterThan(0);
//       orderId = orders[orders.length - 1].id;
//       cy.log(`🧾 Using orderId = ${orderId}`);
//     });

//     //  ดึง member จาก group_members
//     cy.sessionRequest("GET", "/group_members/2").then((res) => {
//       expect(res.status).to.eq(200);
//       const members = res.body?.members || [];
//       expect(members.length).to.be.greaterThan(0);
//       memberId = members[members.length - 1].id;
//       cy.log(` Using memberId = ${memberId}`);
//     });

//     //  ตรวจว่าเมนูมีอยู่
//     cy.sessionRequest("GET", "/menu_items").then((res) => {
//       expect(res.status).to.eq(200);
//       const items = res.body?.data || res.body?.menuItems || res.body;
//       expect(items).to.be.an("array").and.have.length.greaterThan(0);
//       cy.log(` Menu items available: ${items.length}`);
//     });
//   });

//   //
//   //  สร้าง Bill ใหม่จาก Order ที่มีอยู่จริง
//   //
//   it("POST /bill-splits/orders/:orderId/bill (create bill)", () => {
//     cy.sessionRequest("POST", `/bill-splits/orders/${orderId}/bill`).then((res) => {
//       expect([200, 201]).to.include(res.status);
//       billId = res.body?.id || res.body?.bill?.id;
//       expect(billId).to.exist;
//       cy.log(` Bill created with id ${billId}`);
//     });
//   });

//   //
// // ดึงข้อมูลการ split ของ bill
// //
// it("GET /bill-splits/bills/:billId/splits", () => {
//   cy.sessionRequest("GET", `/bill-splits/bills/${billId}/splits`).then((res) => {
//     expect(res.status).to.eq(200);
//     expect(res.body).to.be.an("array");

//     if (res.body.length === 0) {
//       cy.log(` No splits found for bill ${billId}, skipping PATCH test.`);
//       return; //  ป้องกัน patch ต่อเมื่อไม่มี split
//     }

//     memberId = res.body[0].memberId; //  ดึงค่า member จริงจาก split
//     cy.log(` Found ${res.body.length} splits for bill ${billId}, using memberId=${memberId}`);
//   });
// });

// //
// // mark ว่าสมาชิกจ่ายแล้ว
// //
// it("PATCH /bill-splits/bills/:billId/splits/:memberId/paid", () => {
//   if (!memberId) {
//     cy.log(" Skip PATCH test because memberId not found.");
//     return;
//   }

//   cy.sessionRequest("PATCH", `/bill-splits/bills/${billId}/splits/${memberId}/paid`).then((res) => {
//     expect([200, 204]).to.include(res.status);
//     cy.log(` Marked member ${memberId} as paid for bill ${billId}`);
//   });
// });


//   //
//   // สร้าง bill ของทั้ง session (รวมหลาย order)
//   //
//   it("POST /bill-splits/sessions/:sessionId/bill", () => {
//     cy.sessionRequest("POST", `/bill-splits/sessions/${sessionId}/bill`).then((res) => {
//       expect([200, 201]).to.include(res.status);
//       cy.log(` Created full session bill for session ${sessionId}`);
//     });
//   });

//   //
//   //  ดึง bill ของทั้ง session
//   //
//   it("GET /bill-splits/sessions/:sessionId/bill", () => {
//     cy.sessionRequest("GET", `/bill-splits/sessions/${sessionId}/bill`).then((res) => {
//       expect(res.status).to.eq(200);
//       cy.log(` Retrieved session bill for session ${sessionId}`);
//     });
//   });
// });


// version ok //
// describe("BillSplits API (current DB version)", () => {
//   let sessionId = 3;   //  จาก dining_sessions.id
//   let orderId = 2;    //  จาก orders.id ล่าสุดใน DB
//   let billId: number;
//   let memberId: number;

//   //
//   //  Login ก่อนเริ่มทุกอย่าง
//   //
//   before(() => {
//     cy.sessionLoginAdmin();

//     cy.sessionRequest("GET", "/menu_items").then((res) => {
//       expect(res.status).to.eq(200);
//       const items = res.body?.data || res.body?.menuItems || res.body;
//       expect(items).to.be.an("array").and.have.length.greaterThan(0);
//       cy.log(` Menu items available: ${items.length}`);
//     });
//   });

//   //
//   //  สร้าง Bill ใหม่จาก Order (หรือดึงอันที่มีอยู่แล้ว)
//   //
//   it("POST /bill-splits/orders/:orderId/bill (create or reuse existing bill)", () => {
//     cy.sessionRequest("POST", `/bill-splits/orders/${orderId}/bill`).then((res) => {
//       expect([200, 201]).to.include(res.status);

//       billId = res.body?.id || res.body?.bill?.id;
//       expect(billId).to.exist;
//       cy.log(` Bill created/found with id ${billId}`);
//     });
//   });

//   //
//   // ดึงข้อมูล split ของ bill (ใช้เพื่อหา memberId จริง)
//   //
//   it("GET /bill-splits/bills/:billId/splits", () => {
//     cy.sessionRequest("GET", `/bill-splits/bills/${billId}/splits`).then((res) => {
//       expect(res.status).to.eq(200);
//       expect(res.body).to.be.an("array");

//       if (res.body.length === 0) {
//         cy.log(` Bill ${billId} has no splits, skipping member test`);
//         return;
//       }

//       memberId = res.body[0].memberId;
//       cy.log(` Found ${res.body.length} splits for bill ${billId}, using memberId=${memberId}`);
//     });
//   });

//   //
//   //  Mark member ว่าจ่ายแล้ว
//   //
//   it("PATCH /bill-splits/bills/:billId/splits/:memberId/paid", () => {
//     if (!billId || !memberId) {
//       cy.log("Skip PATCH test because billId or memberId not found");
//       return;
//     }

//     cy.sessionRequest("PATCH", `/bill-splits/bills/${billId}/splits/${memberId}/paid`).then((res) => {
//       expect([200, 204]).to.include(res.status);
//       cy.log(` Marked member ${memberId} as paid for bill ${billId}`);
//     });
//   });

//   //
//   //  สร้าง bill รวมของทั้ง session
//   //
//   it("POST /bill-splits/sessions/:sessionId/bill", () => {
//     cy.sessionRequest("POST", `/bill-splits/sessions/${sessionId}/bill`).then((res) => {
//       expect([200, 201]).to.include(res.status);
//       cy.log(` Created full session bill for session ${sessionId}`);
//     });
//   });

//   //
//   //  ดึง bill ของทั้ง session
//   //
//   it("GET /bill-splits/sessions/:sessionId/bill", () => {
//     cy.sessionRequest("GET", `/bill-splits/sessions/${sessionId}/bill`).then((res) => {
//       expect(res.status).to.eq(200);
//       cy.log(` Retrieved session bill for session ${sessionId}`);
//     });
//   });
// });


describe("BillSplits API ", () => {
  let sessionId: number;
  let orderId: number;
  let billId: number;
  let memberId: number;

  before(() => {
    cy.sessionLoginAdmin();

    //   ดึง active session จาก backend
    cy.sessionRequest("GET", "/dining_session/active").then((res) => {
      expect(res.status).to.eq(200);
      const active = res.body.activeSessions[0];
      sessionId = active.id;
      cy.log(`Active session found: ${sessionId}`);

      //  ดึง orders ของ session นี้
      return cy.sessionRequest("GET", `/orders/session/${sessionId}`);
    }).then((res) => {
      expect(res.status).to.eq(200);
      const orders = res.body;
      expect(orders.length).to.be.greaterThan(0);
      orderId = orders[0].id;
      cy.log(` Using order ID: ${orderId}`);
    });
  });

  //
  //  สร้างหรือ reuse Bill ของ order ที่ได้มา
  //
  it("POST /bill-splits/orders/:orderId/bill", () => {
    cy.sessionRequest("POST", `/bill-splits/orders/${orderId}/bill`).then((res) => {
      expect([200, 201]).to.include(res.status);

      billId = res.body?.id || res.body?.bill?.id;
      expect(billId).to.exist;
      cy.log(` Bill created/found with id ${billId}`);
    });
  });

  //
  //  ดึงข้อมูล split ของ bill เพื่อหา memberId จริง
  //
  it("GET /bill-splits/bills/:billId/splits", () => {
    cy.sessionRequest("GET", `/bill-splits/bills/${billId}/splits`).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.be.an("array");

      if (res.body.length === 0) {
        // cy.log(` Bill ${billId} has no splits, skipping member test`);
        return;
      }

      memberId = res.body[0].memberId;
      cy.log(` Found ${res.body.length} splits for bill ${billId}, using memberId=${memberId}`);
    });
  });

  //
  //  Mark member ว่าจ่ายแล้ว
  //
  it("PATCH /bill-splits/bills/:billId/splits/:memberId/paid", () => {
    if (!billId || !memberId) {
      cy.log(" Skip PATCH test because billId or memberId not found");
      return;
    }

    cy.sessionRequest("PATCH", `/bill-splits/bills/${billId}/splits/${memberId}/paid`).then((res) => {
      expect([200, 204]).to.include(res.status);
      cy.log(`Marked member ${memberId} as paid for bill ${billId}`);
    });
  });

  //
  //  สร้าง bill รวมของทั้ง session
  //
  it("POST /bill-splits/sessions/:sessionId/bill", () => {
    cy.sessionRequest("POST", `/bill-splits/sessions/${sessionId}/bill`).then((res) => {
      expect([200, 201]).to.include(res.status);
      cy.log(` Created full session bill for session ${sessionId}`);
    });
  });

  //
  //  ดึง bill ของทั้ง session
  //
  it("GET /bill-splits/sessions/:sessionId/bill", () => {
    cy.sessionRequest("GET", `/bill-splits/sessions/${sessionId}/bill`).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.have.property("id");
      cy.log(` Retrieved session bill for session ${sessionId}`);
    });
  });
});
