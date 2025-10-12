// describe("Group API", () => {
//   let groupId: number;

//   it("POST /group/create", () => {
//     cy.request({
//       method: "POST",
//       url: "/group/create",
//       body: { sessionId: 29, tableId: 1 },
//       failOnStatusCode: false,
//     }).then((res) => {
//       expect([200, 201, 400]).to.include(res.status);

//       if (res.body.group) {
//         groupId = res.body.group.id;
//         cy.log(` Got groupId: ${groupId}`);
//       } else {
//         cy.log(` No group returned, body: ${JSON.stringify(res.body)}`);
//         groupId = 1; // fallback
//       }
//     });
//   });
// });
describe("Group API", () => {
  let groupId: number;

  it("POST /group/create", () => {
    cy.request({
      method: "POST",
      url: "/group/create",
      body: { sessionId: 3, tableId: 3 }, // ตรงกับฐานข้อมูล ACTIVE session
      failOnStatusCode: false,
    }).then((res) => {
      expect([200, 201, 400]).to.include(res.status);

      if (res.body.group) {
        groupId = res.body.group.id;
        cy.log(` Got groupId: ${groupId}`);
      } else {
        // cy.log(` No group returned, body: ${JSON.stringify(res.body)}`);
        groupId = 1; // fallback
      }
    });
  });
});
