// describe("OrderItems API", () => {
//   let orderId = "";
//   let sessionId = "";
//   let itemId = "";
//   let memberId = "";
//   let menuItemId = "";

//   before(() => {
//     //  Login เป็น admin ที่มีใน seed
//     cy.sessionLoginAdmin();

//     //  ดึง session ACTIVE ที่มีใน seed
//     cy.sessionRequest("GET", "/dining_session/active").then((res) => {
//       expect(res.status).to.eq(200);
//       expect(res.body.activeSessions.length).to.be.greaterThan(0);
//       sessionId = res.body.activeSessions[0].id;
//       cy.log(` Active sessionId = ${sessionId}`);
//     });

//     //  เพิ่ม member ใหม่
//     cy.then(() => {
//       cy.sessionRequest("POST", "/group_members/add", {
//         name: "Cypress Member",
//         groupId: 1,
//         diningSessionId: +sessionId,
//         note: "auto-test",
//       }).then((res) => {
//         expect([200, 201]).to.include(res.status);
//         cy.log(" group_members/add response:", JSON.stringify(res.body));
//       });
//     });

//     // ดึง member ล่าสุดจาก groupId=1 เพื่อเอา id มาใช้แน่ๆ
//     cy.then(() => {
//       cy.sessionRequest("GET", "/group_members/1").then((res) => {
//         expect(res.status).to.eq(200);
//         const members = res.body?.members || [];
//         expect(members.length).to.be.greaterThan(0);
//         memberId = members[members.length - 1].id; 
//         cy.log(` memberId = ${memberId}`);
//       });
//     });

//     //  สร้าง order ใหม่ใน session นั้น
//     cy.then(() => {
//       cy.sessionRequest("POST", "/orders/new", {
//         diningSessionId: +sessionId,
//         tableId: 1,
//       }).then((res) => {
//         expect([200, 201]).to.include(res.status);
//         orderId = String(res.body?.id || res.body?.order?.id);
//         cy.log(`orderId = ${orderId}`);
//         expect(orderId).to.exist;
//       });
//     });


//     //  ดึงเมนูจากระบบ
//     cy.then(() => {
//       cy.sessionRequest("GET", "/menu_items").then((res) => {
//         expect(res.status).to.eq(200);

//         cy.log(" menu_items response:", JSON.stringify(res.body)); 

//         const items = res.body?.menuItems || res.body?.data || res.body; 
//         expect(items).to.be.an("array");
//         expect(items.length).to.be.greaterThan(0);

//         menuItemId = items[0].id;
//         cy.log(` menuItemId = ${menuItemId}`);
//       });
//     });

//     cy.sessionRequest("POST", "/order-items", {
//   order_id: +orderId,
//   menu_item_id: +menuItemId,
//   member_id: +memberId,
//   quantity: 2,
//   note: "Less sugar",
// }).then((res) => {
//   cy.log("order-items POST response:", JSON.stringify(res.body));
//   expect([200, 201]).to.include(res.status);

//   itemId = String(res.body?.id || res.body?.item?.id);
//   expect(itemId).to.exist;
//   cy.log(` Created itemId = ${itemId}`);
// });

//   });

//   //
//   // CREATE ORDER ITEM
//   //
//   // it("POST /order-items (create item)", () => {
//   //   cy.sessionRequest("POST", "/order-items", {
//   //     orderId: +orderId,
//   //     menuItemId: +menuItemId,
//   //     memberId: +memberId,
//   //     quantity: 2,
//   //     note: "Less sugar",
//   //   }).then((res) => {
//   //     expect([200, 201]).to.include(res.status);
//   //     itemId = String(res.body?.id || res.body?.item?.id);
//   //     expect(itemId).to.exist;
//   //     cy.log(` Created itemId = ${itemId}`);
//   //   });
//   // });
//   it("POST /order-items (create item)", () => {
//   cy.sessionRequest("POST", "/order-items", {
//     order_id: +orderId,
//     menu_item_id: +menuItemId,
//     member_id: +memberId,
//     quantity: 2,
//     note: "Less sugar",
//   }).then((res) => {
//     cy.log("order-items POST response:", JSON.stringify(res.body));
//     expect([200, 201]).to.include(res.status);

//     itemId = String(res.body?.id || res.body?.item?.id);
//     expect(itemId).to.exist;
//     cy.log(`Created itemId = ${itemId}`);
//   });
// });


//   //
//   // UPDATE ORDER ITEM
//   //
//   it("PATCH /order-items/:id (update qty/note)", () => {
//     cy.sessionRequest("PATCH", `/order-items/${itemId}`, {
//       quantity: 3,
//       note: "No ice",
//     }).then((res) => {
//       expect([200, 204]).to.include(res.status);
//       cy.log(`Updated item ${itemId}`);
//     });
//   });

//   //
//   //  GET ORDER ITEMS BY ORDER
//   //
//   it("GET /order-items/orders/:orderId/items", () => {
//     cy.sessionRequest("GET", `/order-items/orders/${orderId}/items`).then(
//       (res) => {
//         expect(res.status).to.eq(200);
//         expect(res.body).to.be.an("array");
//         cy.log(`Found ${res.body.length} items for order ${orderId}`);
//       }
//     );
//   });

//   //
//   //  GET ORDER ITEMS BY SESSION
//   //
//   it("GET /order-items/sessions/:sessionId/items", () => {
//     cy.sessionRequest("GET", `/order-items/sessions/${sessionId}/items`).then(
//       (res) => {
//         expect(res.status).to.eq(200);
//         expect(res.body).to.be.an("array");
//         cy.log(` Found ${res.body.length} items for session ${sessionId}`);
//       }
//     );
//   });

//   //
//   //  DELETE ORDER ITEM
//   //
//   it("DELETE /order-items/:id", () => {
//     cy.sessionRequest("DELETE", `/order-items/${itemId}`).then((res) => {
//       expect([200, 204]).to.include(res.status);
//       cy.log(` Deleted item ${itemId}`);
//     });
//   });
// });

// // describe("OrderItems API", () => {
// //   let orderId = "";
// //   let sessionId = "";
// //   let itemId = "";
// //   let memberId = "";
// //   let menuItemId = "";

// //   before(() => {
// //     //  Login เป็น admin ที่มีใน seed
// //     cy.sessionLoginAdmin();

// //     //  ดึง session ACTIVE ที่มีใน seed
// //     cy.sessionRequest("GET", "/dining_session/active").then((res) => {
// //       expect(res.status).to.eq(200);
// //       expect(res.body.activeSessions.length).to.be.greaterThan(0);
// //       sessionId = res.body.activeSessions[0].id;
// //       cy.log(` Active sessionId = ${sessionId}`);
// //     });

// //     //  เพิ่ม member ใหม่
// //     cy.then(() => {
// //       cy.sessionRequest("POST", "/group_members/add", {
// //         name: "Cypress Member",
// //         groupId: 1,
// //         diningSessionId: +sessionId,
// //         note: "auto-test",
// //       }).then((res) => {
// //         expect([200, 201]).to.include(res.status);
// //         cy.log(" group_members/add response:", JSON.stringify(res.body));
// //       });
// //     });

// //     //  ดึง member ล่าสุดจาก groupId=1 เพื่อเอา id มาใช้แน่ๆ
// //     cy.then(() => {
// //       cy.sessionRequest("GET", "/group_members/1").then((res) => {
// //         expect(res.status).to.eq(200);
// //         const members = res.body?.members || [];
// //         expect(members.length).to.be.greaterThan(0);
// //         memberId = members[members.length - 1].id; 
// //         cy.log(` memberId = ${memberId}`);
// //       });
// //     });

// //     //  สร้าง order ใหม่ใน session นั้น
// //     cy.then(() => {
// //       cy.sessionRequest("POST", "/orders/new", {
// //         diningSessionId: +sessionId,
// //         tableId: 1,
// //       }).then((res) => {
// //         expect([200, 201]).to.include(res.status);
// //         orderId = String(res.body?.id || res.body?.order?.id);
// //         cy.log(` orderId = ${orderId}`);
// //         expect(orderId).to.exist;
// //       });
// //     });

// //     //  ดึงเมนูจากระบบ
// //     cy.then(() => {
// //       cy.sessionRequest("GET", "/menu_items").then((res) => {
// //         expect(res.status).to.eq(200);
// //         const items = res.body;
// //         expect(items.length).to.be.greaterThan(0);
// //         menuItemId = items[0].id;
// //         cy.log(` menuItemId = ${menuItemId}`);
// //       });
// //     });
// //   });

// //   //
// //   //  CREATE ORDER ITEM
// //   //
// //   it("POST /order-items (create item)", () => {
// //     cy.sessionRequest("POST", "/order-items", {
// //       orderId: +orderId,
// //       menuItemId: +menuItemId,
// //       memberId: +memberId,
// //       quantity: 2,
// //       note: "Less sugar",
// //     }).then((res) => {
// //       expect([200, 201]).to.include(res.status);
// //       itemId = String(res.body?.id || res.body?.item?.id);
// //       expect(itemId).to.exist;
// //       cy.log(` Created itemId = ${itemId}`);
// //     });
// //   });

// //   //
// //   // UPDATE ORDER ITEM
// //   //
// //   it("PATCH /order-items/:id (update qty/note)", () => {
// //     cy.sessionRequest("PATCH", `/order-items/${itemId}`, {
// //       quantity: 3,
// //       note: "No ice",
// //     }).then((res) => {
// //       expect([200, 204]).to.include(res.status);
// //       cy.log(` Updated item ${itemId}`);
// //     });
// //   });

// //   //
// //   //  GET ORDER ITEMS BY ORDER
// //   //
// //   it("GET /order-items/orders/:orderId/items", () => {
// //     cy.sessionRequest("GET", `/order-items/orders/${orderId}/items`).then(
// //       (res) => {
// //         expect(res.status).to.eq(200);
// //         expect(res.body).to.be.an("array");
// //         cy.log(` Found ${res.body.length} items for order ${orderId}`);
// //       }
// //     );
// //   });

// //   //
// //   // GET ORDER ITEMS BY SESSION
// //   //
// //   it("GET /order-items/sessions/:sessionId/items", () => {
// //     cy.sessionRequest("GET", `/order-items/sessions/${sessionId}/items`).then(
// //       (res) => {
// //         expect(res.status).to.eq(200);
// //         expect(res.body).to.be.an("array");
// //         cy.log(` Found ${res.body.length} items for session ${sessionId}`);
// //       }
// //     );
// //   });

// //   //
// //   //  DELETE ORDER ITEM
// //   //
// //   it("DELETE /order-items/:id", () => {
// //     cy.sessionRequest("DELETE", `/order-items/${itemId}`).then((res) => {
// //       expect([200, 204]).to.include(res.status);
// //       cy.log(` Deleted item ${itemId}`);
// //     });
// //   });
// // });

// version ok // 
// describe("OrderItems API", () => {
//   let orderId = "";
//   let sessionId = "";
//   let itemId = "";
//   let memberId = "";
//   let menuItemId = "";

//   before(() => {
//   cy.sessionLoginAdmin();

//   //  เริ่มจากดึง session ก่อน แล้ว chain ต่อทุกอย่างใน .then()
//   cy.sessionRequest("GET", "/dining_session/active").then((res) => {
//     expect(res.status).to.eq(200);
//     expect(res.body.activeSessions.length).to.be.greaterThan(0);

//     sessionId = res.body.activeSessions[0].id;
//     cy.log(` Active sessionId = ${sessionId}`);

//     //  เพิ่ม member หลังจากได้ sessionId แล้ว (ภายใน .then() เดียวกัน)
//     return cy.sessionRequest("POST", "/group_members/add", {
//       name: "Cypress Member",
//       groupId: 2,
//       diningSessionId: Number(sessionId), //  ใช้ sessionId แน่นอน
//       note: "auto-test",
//     });
//   }).then((res) => {
//     expect([200, 201]).to.include(res.status);
//     cy.log(" group_members/add response:", JSON.stringify(res.body));

//     // ดึง member id ล่าสุด
//     return cy.sessionRequest("GET", "/group_members/2");
//   }).then((res) => {
//     expect(res.status).to.eq(200);
//     const members = res.body?.members || [];
//     memberId = members[members.length - 1].id;
//     cy.log(` memberId = ${memberId}`);

//     // สร้าง order (ใช้ sessionId เดียวกัน)
//     return cy.sessionRequest("POST", "/orders/new", {
//       diningSessionId: Number(sessionId),
//       tableId: 1,
//     });
//   }).then((res) => {
//     expect([200, 201]).to.include(res.status);
//     orderId = String(res.body?.id || res.body?.order?.id);
//     cy.log(` orderId = ${orderId}`);

//     //  ดึงเมนู
//     return cy.sessionRequest("GET", "/menu_items");
//   }).then((res) => {
//     expect(res.status).to.eq(200);
//     const items = res.body?.menuItems || res.body?.data || res.body;
//     expect(items.length).to.be.greaterThan(0);
//     menuItemId = items[0].id;
//     cy.log(`menuItemId = ${menuItemId}`);
//   });
// });

//   //
//   //  CREATE ORDER ITEM
//   //
// it("POST /order-items (create item)", () => {
//   cy.log(` Creating item with orderId=${orderId}, menuItemId=${menuItemId}, memberId=${memberId}`);

//   cy.sessionRequest("POST", "/order-items", {
//     orderId: Number(orderId),       
//     menuItemId: Number(menuItemId),
//     memberId: Number(memberId),
//     quantity: 2,
//     note: "Less sugar",
//   }).then((res) => {
//     cy.log(" order-items POST response:", JSON.stringify(res.body));
//     expect([200, 201]).to.include(res.status);

//     itemId = String(res.body?.id || res.body?.item?.id);
//     expect(itemId).to.exist;
//     cy.log(` Created itemId = ${itemId}`);
//   });
// });

//   //
//   //  UPDATE ORDER ITEM
//   //
//   it("PATCH /order-items/:id (update qty/note)", () => {
//     cy.sessionRequest("PATCH", `/order-items/${itemId}`, {
//       quantity: 3,
//       note: "No ice",
//     }).then((res) => {
//       expect([200, 204]).to.include(res.status);
//       cy.log(` Updated item ${itemId}`);
//     });
//   });

//   //
//   //  GET ORDER ITEMS BY ORDER
//   //
//   it("GET /order-items/orders/:orderId/items", () => {
//     cy.sessionRequest("GET", `/order-items/orders/${orderId}/items`).then(
//       (res) => {
//         expect(res.status).to.eq(200);
//         expect(res.body).to.be.an("array");
//         cy.log(` Found ${res.body.length} items for order ${orderId}`);
//       }
//     );
//   });

//   //
//   //  GET ORDER ITEMS BY SESSION
//   //
//   it("GET /order-items/sessions/:sessionId/items", () => {
//     cy.sessionRequest("GET", `/order-items/sessions/${sessionId}/items`).then(
//       (res) => {
//         expect(res.status).to.eq(200);
//         expect(res.body).to.be.an("array");
//         cy.log(` Found ${res.body.length} items for session ${sessionId}`);
//       }
//     );
//   });

//   //
//   // DELETE ORDER ITEM
//   //
//   it("DELETE /order-items/:id", () => {
//     cy.sessionRequest("DELETE", `/order-items/${itemId}`).then((res) => {
//       expect([200, 204]).to.include(res.status);
//       cy.log(` Deleted item ${itemId}`);
//     });
//   });
// });


describe("OrderItems API ", () => {
  let orderId: number;
  let sessionId: number;
  let itemId: number;
  let memberId: number;
  let menuItemId: number;
  let groupId: number;
  let tableId: number;

  
  before(() => {
    cy.sessionLoginAdmin();

    //  หา session ACTIVE หรือสร้างใหม่
    cy.sessionRequest("GET", "/dining_session/active")
      .then((res) => {
        expect(res.status).to.eq(200);

        if (res.body.activeSessions?.length > 0) {
          const active = res.body.activeSessions[0];
          sessionId = active.id;
          tableId = active.tableId;
          cy.log(` Using ACTIVE session ID: ${sessionId} (table ${tableId})`);
          expect(active.group).to.exist;
          groupId = active.group.id;
        } else {
          cy.log(" No ACTIVE session, starting new one...");
          cy.sessionRequest("POST", "/dining_session/start", { tableId: 1 }).then((startRes) => {
            expect([200, 201]).to.include(startRes.status);
            const newSession = startRes.body.session;
            sessionId = newSession.id;
            tableId = newSession.tableId;
            cy.log(`Created new ACTIVE session ID: ${sessionId}`);

            // หา group ของโต๊ะนี้
            return cy.sessionRequest("GET", "/groups").then((groupRes) => {
              expect(groupRes.status).to.eq(200);
              const foundGroup = (groupRes.body as any[]).find(
                (g: any) => g.table_id === tableId
              );
              expect(foundGroup).to.exist;
              groupId = foundGroup.id;
              cy.log(` Found group ID: ${groupId}`);
            });
          });
        }
      })

      //  เพิ่ม member ใหม่เข้า group
      .then(() =>
        cy.sessionRequest("POST", "/group_members/add", {
          name: "Cypress Member",
          groupId,
          diningSessionId: sessionId,
          note: "auto-test",
        })
      )
      .then((res) => {
        expect([200, 201]).to.include(res.status);
        return cy.sessionRequest("GET", `/group_members/${groupId}`);
      })
      .then((res) => {
        expect(res.status).to.eq(200);
        const members = res.body.members || [];
        expect(members.length).to.be.greaterThan(0);
        memberId = members[members.length - 1].id;
        cy.log(` memberId = ${memberId}`);
      })

      //  สร้าง order 
      .then(() =>
        cy.sessionRequest("POST", "/orders/new", {
          diningSessionId: sessionId,
          tableId,
          groupId,
        })
      )
      .then((res) => {
        expect([200, 201]).to.include(res.status);
        orderId = res.body.id;
        cy.log(` orderId = ${orderId}`);
      })

      //  ดึง menu item จริงจากระบบ
      .then(() => cy.sessionRequest("GET", "/menu_items"))
      .then((res) => {
        expect(res.status).to.eq(200);
        const items = res.body?.menuItems || res.body?.data || res.body;
        expect(items.length).to.be.greaterThan(0);
        menuItemId = items[0].id;
        cy.log(` menuItemId = ${menuItemId}`);
      });
  });

  //
  // CREATE ORDER ITEM
  //
  it("POST /order-items ", () => {
    cy.sessionRequest("POST", "/order-items", {
      orderId,
      menuItemId,
      memberId,
      quantity: 2,
      note: "Less sugar",
    }).then((res) => {
      expect([200, 201]).to.include(res.status);
      expect(res.body).to.have.property("id");
      itemId = res.body.id;
      cy.log(` Created order item ID = ${itemId}`);
    });
  });

  //
  // UPDATE ORDER ITEM (แก้ไข qty/note)
  //
  it("PATCH /order-items/:id → อัปเดต quantity และ note ", () => {
    cy.sessionRequest("PATCH", `/order-items/${itemId}`, {
      quantity: 3,
      note: "No ice",
    }).then((res) => {
      expect([200, 204]).to.include(res.status);
      expect(res.body).to.have.property("quantity", 3);
      cy.log(`Updated item ${itemId}`);
    });
  });

  //
  // UPDATE ORDER ITEM STATUS
  //
  it("PATCH /order-items/:id/status → เปลี่ยนstatus", () => {
    cy.sessionRequest("PATCH", `/order-items/${itemId}/status`, {
      status: "PREPARING",
    }).then((res) => {
      expect([200, 204]).to.include(res.status);
      expect(res.body).to.have.property("status");
      cy.log(` Updated item ${itemId} status = ${res.body.status}`);
    });
  });

  //
  //  GET ORDER ITEMS BY ORDER ID
  //
  it("GET /order-items/orders/:orderId/items ", () => {
    cy.sessionRequest("GET", `/order-items/orders/${orderId}/items`).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.be.an("array");
      expect(res.body.length).to.be.greaterThan(0);
      cy.log(` Found ${res.body.length} items for order ${orderId}`);
    });
  });

  //
  //  GET ORDER ITEMS BY SESSION ID
  //
  it("GET /order-items/sessions/:sessionId/items", () => {
    cy.sessionRequest("GET", `/order-items/sessions/${sessionId}/items`).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.be.an("array");
      cy.log(` Found ${res.body.length} items for session ${sessionId}`);
    });
  });

  //
  //  DELETE ORDER ITEM
  //
  it("DELETE /order-items/:id ", () => {
    cy.sessionRequest("DELETE", `/order-items/${itemId}`).then((res) => {
      expect([200, 204]).to.include(res.status);
      expect(res.body?.message || "").to.include("Deleted");
      cy.log(` Deleted item ${itemId}`);
    });
  });
});




