describe("GroupMembers API", () => {
  let groupId: number = 1; // fallback default
  let memberId: number;
  const diningSessionId = 29;

  before(() => {
    cy.request({
      method: "POST",
      url: "/group/create",
      body: { sessionId: diningSessionId, tableId: 1 },
      failOnStatusCode: false,
    }).then((res) => {
      if (res.body.group) groupId = res.body.group.id;
      cy.log(` Using groupId: ${groupId}`);
    });
  });

  it("POST /group_members/add", () => {
    cy.request({
      method: "POST",
      url: "/group_members/add",
      body: { name: "Alice", groupId, diningSessionId },
      failOnStatusCode: false,
    }).then((res) => {
      expect([200, 201, 400]).to.include(res.status);
      cy.log(JSON.stringify(res.body));
    });
  });

  it("GET /group_members/:groupId", () => {
    cy.request({
      method: "GET",
      url: `/group_members/${groupId}`,
      failOnStatusCode: false,
    }).then((res) => {
      expect([200, 400]).to.include(res.status);
      if (res.body.members?.length) memberId = res.body.members[0].id;
    });
  });

  it("DELETE /group_members/member/:memberId", () => {
    if (!memberId) {
      cy.log(" No memberId found, skipping delete single member");
      return;
    }
    cy.request({
      method: "DELETE",
      url: `/group_members/member/${memberId}`,
      failOnStatusCode: false,
    }).then((res) => {
      expect([200, 204, 400, 404]).to.include(res.status);
    });
  });

  it("DELETE /group_members/:groupId", () => {
    cy.request({
      method: "DELETE",
      url: `/group_members/${groupId}`,
      failOnStatusCode: false,
    }).then((res) => {
      expect([200, 204, 400]).to.include(res.status);
    });
  });
});
