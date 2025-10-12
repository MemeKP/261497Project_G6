// describe("Orders API", () => {
//   let orderId = "";
//   let sessionId = "";

//   before(() => {
//     //  Login ด้วย admin จาก seed
//     cy.sessionLoginAdmin();

//     // ใช้ session ที่ seed แล้ว (ไม่ต้อง start ใหม่)
//     cy.sessionRequest("GET", "/dining_session/active").then((res) => {
//       expect(res.status).to.eq(200);
//       expect(res.body.activeSessions.length).to.be.greaterThan(0);
//       sessionId = res.body.activeSessions[0].id;
//       cy.log(` Found active session ID: ${sessionId}`);
//     });
//   });

//   it("POST /orders/new (blank order)", () => {
//     cy.sessionRequest("POST", "/orders/new", {
//       diningSessionId: sessionId,
//       tableId: 1,
//     }).then((res) => {
//       expect([200, 201]).to.include(res.status);
//       orderId = res.body?.id || res.body?.order?.id;
//       expect(orderId).to.exist;
//       cy.log(` Created order ID: ${orderId}`);
//     });
//   });

//   it("PATCH /orders/:id/status", () => {
//     cy.sessionRequest("PATCH", `/orders/${orderId}/status`, { status: "CLOSED" })
//       .then((res) => {
//         expect([200, 204]).to.include(res.status);
//       });
//   });

//   it("GET /orders/session/:sessionId", () => {
//     cy.sessionRequest("GET", `/orders/session/${sessionId}`).then((res) => {
//       expect(res.status).to.eq(200);
//       expect(res.body).to.be.an("array");
//     });
//   });

//   it("GET /orders/:id", () => {
//     cy.sessionRequest("GET", `/orders/${orderId}`).then((res) => {
//       expect(res.status).to.eq(200);
//       expect(res.body).to.have.property("id", orderId);
//     });
//   });

//   it("DELETE /orders/:id", () => {
//     cy.sessionRequest("DELETE", `/orders/${orderId}`).then((res) => {
//       expect([200, 204]).to.include(res.status);
//     });
//   });
// });


//  อันนี้ล่าสุด เเต่ไม่ผ่าน //

// describe("Orders API (Dynamic)", () => {
//   let orderId = "";
//   let sessionId = "";
//   let tableId = "";
//   let groupId = "";

//   before(() => {
//     //  login ด้วย admin seed
//     cy.sessionLoginAdmin();

//     //  ดึง session + group ที่ seed ไว้จริงจาก backend
//     cy.sessionRequest("GET", "/dining_session/active").then((res) => {
//       expect(res.status).to.eq(200);
//       expect(res.body.activeSessions.length).to.be.greaterThan(0);

//       const session = res.body.activeSessions[0];
//       sessionId = session.id;
//       tableId = session.tableId;
//       cy.log(`Using active session ID: ${sessionId} (table ${tableId})`);

//       // ดึง group จาก session ที่ได้
//       cy.sessionRequest("GET", `/group/session/${sessionId}`).then((groupRes) => {
//         expect([200, 201]).to.include(groupRes.status);
//         groupId = groupRes.body.group.id;
//         cy.log(` Found group ID: ${groupId}`);
//       });
//     });
//   });

//   //
//   //  สร้าง order ใหม่
//   //
//   it("POST /orders/new", () => {
//     cy.sessionRequest("POST", "/orders/new", {
//       diningSessionId: sessionId,
//       tableId: tableId,
//       groupId: groupId,
//     }).then((res) => {
//       expect([200, 201]).to.include(res.status);
//       orderId = res.body?.id || res.body?.order?.id;
//       expect(orderId).to.exist;
//       cy.log(` Created new order ID: ${orderId}`);
//     });
//   });

//   //
//   //  เปลี่ยนสถานะ order
//   //
//   it("PATCH /orders/:id/status", () => {
//     cy.sessionRequest("PATCH", `/orders/${orderId}/status`, {
//       status: "CLOSED",
//     }).then((res) => {
//       expect([200, 204]).to.include(res.status);
//       cy.log(`Order ${orderId} marked as CLOSED`);
//     });
//   });

//   //
//   //  ดึง orders ทั้งหมดของ session
//   //
//   it("GET /orders/session/:sessionId", () => {
//     cy.sessionRequest("GET", `/orders/session/${sessionId}`).then((res) => {
//       expect(res.status).to.eq(200);
//       expect(res.body).to.be.an("array");
//       expect(res.body.length).to.be.greaterThan(0);
//       cy.log(` Found ${res.body.length} orders in session ${sessionId}`);
//     });
//   });

//   //
//   //  ดึง order รายตัว
//   //
//   it("GET /orders/:id", () => {
//     cy.sessionRequest("GET", `/orders/${orderId}`).then((res) => {
//       expect(res.status).to.eq(200);
//       expect(res.body).to.have.property("id", orderId);
//       cy.log(` Order ${orderId} fetched successfully`);
//     });
//   });

//   //
//   //  ลบ order ที่สร้างขึ้น
//   //
//   it("DELETE /orders/:id", () => {
//     cy.sessionRequest("DELETE", `/orders/${orderId}`).then((res) => {
//       expect([200, 204]).to.include(res.status);
//       cy.log(` Order ${orderId} deleted successfully`);
//     });
//   });
// });


describe("Orders API ", () => {
  let orderId: number;
  let sessionId: number;
  let tableId: number;
  let groupId: number;

 
  before(() => {
    cy.sessionLoginAdmin();

    //
    //  ลองดึง session ที่ ACTIVE ก่อน
    //
    cy.sessionRequest("GET", "/dining_session/active").then((res) => {
      expect(res.status).to.eq(200);

      if (res.body.activeSessions?.length > 0) {
        //  มี session ที่ ACTIVE แล้ว → ใช้อันนี้เลย
        const active = res.body.activeSessions[0];
        sessionId = active.id;
        tableId = active.tableId;
        cy.log(` Using existing ACTIVE session ID: ${sessionId} (table ${tableId})`);

        expect(active.group, "ACTIVE session ต้องมี group").to.exist;
        groupId = active.group.id;
        cy.log(` Found group ID: ${groupId}`);
      } else {
        //
        //  ไม่มี session ACTIVE → start session ใหม่อัตโนมัติ
        //
        cy.log(" No ACTIVE session found, starting new one...");

        cy.sessionRequest("POST", "/dining_session/start", {
          tableId: 1,
        }).then((startRes) => {
          expect([200, 201]).to.include(startRes.status);
          expect(startRes.body.success).to.be.true;

          const newSession = startRes.body.session;
          sessionId = newSession.id;
          tableId = newSession.tableId;
          cy.log(` Created new ACTIVE session ID: ${sessionId} (table ${tableId})`);

          //  ดึง group ใหม่หลังสร้าง session
          return cy.sessionRequest("GET", "/groups").then((groupRes) => {
            expect(groupRes.status).to.eq(200);
            const foundGroup = (groupRes.body as any[]).find(
              (g: any) => g.table_id === tableId
            );
            expect(foundGroup, "มี group ของโต๊ะนี้").to.exist;
            groupId = foundGroup.id;
            cy.log(`👥 Found group ID: ${groupId}`);
          });
        });
      }
    });
  });

  //
  //  สร้าง order 
  //
  it("POST /orders/new", () => {
    cy.sessionRequest("POST", "/orders/new", {
      diningSessionId: Number(sessionId),
      tableId: Number(tableId),
    }).then((res) => {
      expect([200, 201]).to.include(res.status);
      expect(res.body).to.have.property("id");
      orderId = res.body.id;
      cy.log(` Created new order ID: ${orderId}`);
    });
  });

  //
  //  เปลี่ยนสถานะ order
  //
  it("PATCH /orders/:id/status", () => {
    cy.sessionRequest("PATCH", `/orders/${orderId}/status`, {
      status: "CLOSED",
    }).then((res) => {
      expect([200, 204]).to.include(res.status);
      expect(res.body).to.have.property("status", "CLOSED");
      cy.log(` Order ${orderId} marked as CLOSED`);
    });
  });

  //
  //  ดึง orders ทั้งหมดของ session
  //
  it("GET /orders/session/:sessionId ", () => {
    cy.sessionRequest("GET", `/orders/session/${sessionId}`).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.be.an("array");
      expect(res.body.length).to.be.greaterThan(0);
      cy.log(` Found ${res.body.length} orders in session ${sessionId}`);
    });
  });

  //
  //  ดึง order รายอัน
  //
  it("GET /orders/:id ", () => {
    cy.sessionRequest("GET", `/orders/${orderId}`).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.have.property("id", orderId);
      cy.log(` Order ${orderId} fetched successfully`);
    });
  });

  //
  //  ลบ order
  //
  it("DELETE /orders/:id ", () => {
    cy.sessionRequest("DELETE", `/orders/${orderId}`).then((res) => {
      expect([200, 204]).to.include(res.status);
      expect(res.body?.message).to.include("Order deleted");
      cy.log(` Order ${orderId} deleted successfully`);
    });
  });
});
