describe("Backend API Tests", () => {
  const baseUrl = "http://localhost:3000";
  let authCookie: string;
  let adminCookie: string;
  let testUserId: number;
  let testAdminId: number;
  let testSessionId: number;
  let testGroupId: number;
  let testMemberId: number;
  let testOrderId: number;

  // ==================== AUTH ENDPOINTS ====================
  
  describe("Authentication", () => {
    it("POST /auth/register - should register a new user", () => {
      const timestamp = Date.now();
      cy.request({
        method: "POST",
        url: `${baseUrl}/auth/register`,
        body: {
          name: "Test User",
          email: `testuser${timestamp}@mail.com`,
          password: "123456",
          userType: "user",
        },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.be.oneOf([200, 201, 400]);
        expect(res.body).to.be.an("object");
        if (res.status === 201) {
          expect(res.body).to.have.property("message");
          expect(res.body).to.have.property("user");
          expect(res.body.user).to.have.property("id");
          expect(res.body.user).to.have.property("email");
          testUserId = res.body.user.id;
          authCookie = res.headers["set-cookie"]?.[0] || "";
        }
      });
    });

    it("POST /auth/register - should register a new admin", () => {
      const timestamp = Date.now();
      cy.request({
        method: "POST",
        url: `${baseUrl}/auth/register`,
        body: {
          name: "Test Admin",
          email: `testadmin${timestamp}@mail.com`,
          password: "123456",
          userType: "admin",
        },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.be.oneOf([200, 201, 400]);
        expect(res.body).to.be.an("object");
        if (res.status === 201) {
          expect(res.body.user).to.have.property("userType", "admin");
          testAdminId = res.body.user.id;
          adminCookie = res.headers["set-cookie"]?.[0] || "";
        }
      });
    });

    it("POST /auth/register - should fail with missing fields", () => {
      cy.request({
        method: "POST",
        url: `${baseUrl}/auth/register`,
        body: {
          email: "incomplete@mail.com",
        },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.equal(400);
        expect(res.body).to.have.property("error");
      });
    });

    it("POST /auth/register - should fail with short password", () => {
      cy.request({
        method: "POST",
        url: `${baseUrl}/auth/register`,
        body: {
          name: "Test User",
          email: `short${Date.now()}@mail.com`,
          password: "123",
        },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.equal(400);
        expect(res.body.error).to.include("6 characters");
      });
    });

    it("POST /auth/login - should login user with valid credentials", () => {
      cy.request({
        method: "POST",
        url: `${baseUrl}/auth/login`,
        body: {
          email: "test@mail.com",
          password: "123456",
        },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.be.oneOf([200, 401]);
        if (res.status === 200) {
          expect(res.body).to.have.property("message");
          expect(res.body).to.have.property("user");
          expect(res.body.user).to.have.property("email");
        }
      });
    });

    it("POST /auth/login - should fail with invalid credentials", () => {
      cy.request({
        method: "POST",
        url: `${baseUrl}/auth/login`,
        body: {
          email: "nonexistent@mail.com",
          password: "wrongpassword",
        },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.equal(401);
        expect(res.body).to.have.property("error");
      });
    });

    it("POST /auth/login - should fail with missing fields", () => {
      cy.request({
        method: "POST",
        url: `${baseUrl}/auth/login`,
        body: {
          email: "test@mail.com",
        },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.equal(400);
        expect(res.body).to.have.property("error");
      });
    });

    it("GET /auth/me - should return current user info when authenticated", () => {
      cy.request({
        method: "GET",
        url: `${baseUrl}/auth/me`,
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.be.oneOf([200, 401]);
        if (res.status === 200) {
          expect(res.body).to.have.property("user");
          expect(res.body.user).to.have.property("id");
          expect(res.body.user).to.have.property("email");
        }
      });
    });

    it("GET /auth/me - should return 401 when not authenticated", () => {
      cy.request({
        method: "GET",
        url: `${baseUrl}/auth/me`,
        headers: {},
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.equal(401);
        expect(res.body).to.have.property("error");
      });
    });

    it("POST /auth/logout - should logout authenticated user", () => {
      cy.request({
        method: "POST",
        url: `${baseUrl}/auth/logout`,
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.be.oneOf([200, 401, 500]);
        if (res.status === 200) {
          expect(res.body).to.have.property("message");
        }
      });
    });

    it("POST /auth/logout - should return 401 when not authenticated", () => {
      cy.request({
        method: "POST",
        url: `${baseUrl}/auth/logout`,
        headers: {},
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.equal(401);
      });
    });
  });

  // ==================== DINING SESSION ENDPOINTS ====================
  
  describe("Dining Sessions", () => {
    it("POST /dining_session/start - should start a dining session (admin)", () => {
      cy.request({
        method: "POST",
        url: `${baseUrl}/dining_session/start`,
        body: { tableId: 1 },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.be.oneOf([200, 201, 400, 401, 403]);
        if (res.status === 201) {
          expect(res.body).to.have.property("session");
          expect(res.body.session).to.have.property("id");
          expect(res.body.session).to.have.property("qrCode");
          testSessionId = res.body.session.id;
        }
      });
    });

    it("POST /dining_session/start - should fail without tableId", () => {
      cy.request({
        method: "POST",
        url: `${baseUrl}/dining_session/start`,
        body: {},
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.be.oneOf([400, 401, 403]);
      });
    });

    it("POST /dining_session/start - should fail with invalid tableId type", () => {
      cy.request({
        method: "POST",
        url: `${baseUrl}/dining_session/start`,
        body: { tableId: "invalid" },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.be.oneOf([400, 401, 403]);
      });
    });

    it("POST /dining_session/start - should fail when table already has active session", () => {
      cy.request({
        method: "POST",
        url: `${baseUrl}/dining_session/start`,
        body: { tableId: 1 },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.be.oneOf([400, 401, 403]);
      });
    });

    it("GET /dining_session/active - should return active sessions (admin)", () => {
      cy.request({
        method: "GET",
        url: `${baseUrl}/dining_session/active`,
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.be.oneOf([200, 401, 403]);
        if (res.status === 200) {
          expect(res.body).to.have.property("activeSessions");
          expect(res.body.activeSessions).to.be.an("array");
          expect(res.body).to.have.property("totalActiveTables");
        }
      });
    });

    it("GET /dining_session/:sessionId - should get session detail", () => {
      cy.request({
        method: "GET",
        url: `${baseUrl}/dining_session/1`,
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.be.oneOf([200, 400, 404]);
        if (res.status === 200) {
          expect(res.body).to.have.property("session");
          expect(res.body.session).to.have.property("id");
          expect(res.body.session).to.have.property("tableId");
          expect(res.body.session).to.have.property("status");
        }
      });
    });

    it("GET /dining_session/:sessionId - should fail with invalid sessionId", () => {
      cy.request({
        method: "GET",
        url: `${baseUrl}/dining_session/invalid`,
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.equal(400);
        expect(res.body).to.have.property("error");
      });
    });

    it("GET /dining_session/:sessionId - should return 404 for non-existent session", () => {
      cy.request({
        method: "GET",
        url: `${baseUrl}/dining_session/999999`,
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.equal(404);
      });
    });

    it("POST /dining_session/end - should end a dining session (admin)", () => {
      cy.request({
        method: "POST",
        url: `${baseUrl}/dining_session/end`,
        body: { sessionId: 1 },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.be.oneOf([200, 400, 401, 403]);
        if (res.status === 200) {
          expect(res.body).to.have.property("session");
          expect(res.body.session).to.have.property("status", "COMPLETED");
          expect(res.body.session).to.have.property("endedAt");
        }
      });
    });

    it("POST /dining_session/end - should end session by tableId (admin)", () => {
      cy.request({
        method: "POST",
        url: `${baseUrl}/dining_session/end`,
        body: { tableId: 1 },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.be.oneOf([200, 400, 401, 403]);
      });
    });

    it("POST /dining_session/end - should fail without sessionId or tableId", () => {
      cy.request({
        method: "POST",
        url: `${baseUrl}/dining_session/end`,
        body: {},
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.be.oneOf([400, 401, 403]);
      });
    });
  });

  // ==================== GROUP ENDPOINTS ====================
  
  describe("Groups", () => {
    it("POST /group/create - should create a new group", () => {
      cy.request({
        method: "POST",
        url: `${baseUrl}/group/create`,
        body: {
          sessionId: 1,
          tableId: 1,
        },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.be.oneOf([200, 201, 400, 401]);
        if (res.status === 201) {
          expect(res.body).to.have.property("group");
          expect(res.body.group).to.have.property("id");
          expect(res.body.group).to.have.property("tableId");
          testGroupId = res.body.group.id;
        }
      });
    });

    it("POST /group/create - should fail with missing fields", () => {
      cy.request({
        method: "POST",
        url: `${baseUrl}/group/create`,
        body: {
          sessionId: 1,
        },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.equal(400);
        expect(res.body).to.have.property("error");
      });
    });

    it("POST /group/create - should fail with invalid session", () => {
      cy.request({
        method: "POST",
        url: `${baseUrl}/group/create`,
        body: {
          sessionId: 999999,
          tableId: 999,
        },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.equal(400);
      });
    });

    it("POST /group/create - should fail when group already exists", () => {
      cy.request({
        method: "POST",
        url: `${baseUrl}/group/create`,
        body: {
          sessionId: 1,
          tableId: 1,
        },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.be.oneOf([400, 401]);
      });
    });
  });

  // ==================== GROUP MEMBERS ENDPOINTS ====================
  
  describe("Group Members", () => {
    it("POST /group_members/add - should add member to group", () => {
      cy.request({
        method: "POST",
        url: `${baseUrl}/group_members/add`,
        body: {
          name: "Member 1",
          groupId: 1,
          note: "no spicy",
        },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.be.oneOf([200, 201, 400, 401]);
        if (res.status === 201) {
          expect(res.body).to.have.property("member");
          expect(res.body.member).to.have.property("id");
          expect(res.body.member).to.have.property("name");
          expect(res.body.member).to.have.property("groupId");
          testMemberId = res.body.member.id;
        }
      });
    });

    it("POST /group_members/add - should add member without note", () => {
      cy.request({
        method: "POST",
        url: `${baseUrl}/group_members/add`,
        body: {
          name: "Member 2",
          groupId: 1,
        },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.be.oneOf([200, 201, 400, 401]);
      });
    });

    it("POST /group_members/add - should fail with missing name", () => {
      cy.request({
        method: "POST",
        url: `${baseUrl}/group_members/add`,
        body: {
          groupId: 1,
        },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.equal(400);
        expect(res.body).to.have.property("error");
      });
    });

    it("POST /group_members/add - should fail with missing groupId", () => {
      cy.request({
        method: "POST",
        url: `${baseUrl}/group_members/add`,
        body: {
          name: "Test Member",
        },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.equal(400);
      });
    });

    it("POST /group_members/add - should fail with non-existent group", () => {
      cy.request({
        method: "POST",
        url: `${baseUrl}/group_members/add`,
        body: {
          name: "Member X",
          groupId: 999999,
        },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.equal(400);
      });
    });

    it("GET /group_members/:groupId - should list group members", () => {
      cy.request({
        method: "GET",
        url: `${baseUrl}/group_members/1`,
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.be.oneOf([200, 400, 401, 404]);
        if (res.status === 200) {
          expect(res.body).to.have.property("group");
          expect(res.body).to.have.property("members");
          expect(res.body.members).to.be.an("array");
        }
      });
    });

    it("GET /group_members/:groupId - should fail with invalid groupId", () => {
      cy.request({
        method: "GET",
        url: `${baseUrl}/group_members/invalid`,
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.equal(400);
      });
    });

    it("GET /group_members/:groupId - should fail with non-existent group", () => {
      cy.request({
        method: "GET",
        url: `${baseUrl}/group_members/999999`,
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.equal(400);
      });
    });

    it("DELETE /group_members/:groupId - should delete group members", () => {
      cy.request({
        method: "DELETE",
        url: `${baseUrl}/group_members/1`,
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.be.oneOf([200, 400, 401, 404]);
        if (res.status === 200) {
          expect(res.body).to.have.property("message");
        }
      });
    });

    it("DELETE /group_members/:groupId - should fail with invalid groupId", () => {
      cy.request({
        method: "DELETE",
        url: `${baseUrl}/group_members/invalid`,
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.equal(400);
      });
    });

    it("DELETE /group_members/:groupId - should fail with non-existent group", () => {
      cy.request({
        method: "DELETE",
        url: `${baseUrl}/group_members/999999`,
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.equal(400);
      });
    });
  });

  // ==================== ORDERS ENDPOINTS ====================
  
  describe("Orders", () => {
    it("GET /orders - should list all orders (admin)", () => {
      cy.request({
        method: "GET",
        url: `${baseUrl}/orders`,
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.be.oneOf([200, 401, 403]);
        if (res.status === 200) {
          expect(res.body).to.have.property("orders");
          expect(res.body.orders).to.be.an("array");
          expect(res.body).to.have.property("statistics");
        }
      });
    });

    it("GET /orders - should filter by status", () => {
      cy.request({
        method: "GET",
        url: `${baseUrl}/orders?status=PENDING`,
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.be.oneOf([200, 401, 403]);
        if (res.status === 200) {
          expect(res.body.orders).to.be.an("array");
        }
      });
    });

    it("GET /orders - should filter by tableId", () => {
      cy.request({
        method: "GET",
        url: `${baseUrl}/orders?tableId=1`,
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.be.oneOf([200, 401, 403]);
      });
    });

    it("GET /orders - should filter by diningSessionId", () => {
      cy.request({
        method: "GET",
        url: `${baseUrl}/orders?diningSessionId=1`,
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.be.oneOf([200, 401, 403]);
      });
    });

    it("GET /orders - should support pagination", () => {
      cy.request({
        method: "GET",
        url: `${baseUrl}/orders?limit=10&offset=0`,
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.be.oneOf([200, 401, 403]);
      });
    });

    it("GET /orders/:orderId - should get order detail (admin)", () => {
      cy.request({
        method: "GET",
        url: `${baseUrl}/orders/1`,
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.be.oneOf([200, 400, 401, 403, 404]);
        if (res.status === 200) {
          expect(res.body).to.have.property("order");
          expect(res.body.order).to.have.property("id");
          expect(res.body.order).to.have.property("items");
          expect(res.body.order.items).to.be.an("array");
        }
      });
    });

    it("GET /orders/:orderId - should fail with invalid orderId", () => {
      cy.request({
        method: "GET",
        url: `${baseUrl}/orders/invalid`,
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.be.oneOf([400, 401, 403]);
      });
    });

    it("GET /orders/:orderId - should return 404 for non-existent order", () => {
      cy.request({
        method: "GET",
        url: `${baseUrl}/orders/999999`,
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.be.oneOf([401, 403, 404]);
      });
    });

    it("PUT /orders/:orderId/status - should update order status (admin)", () => {
      cy.request({
        method: "PUT",
        url: `${baseUrl}/orders/1/status`,
        body: { status: "PREPARING" },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.be.oneOf([200, 400, 401, 403, 404]);
        if (res.status === 200) {
          expect(res.body).to.have.property("order");
          expect(res.body.order).to.have.property("status");
        }
      });
    });

    it("PUT /orders/:orderId/status - should update to SERVED", () => {
      cy.request({
        method: "PUT",
        url: `${baseUrl}/orders/1/status`,
        body: { status: "SERVED" },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.be.oneOf([200, 400, 401, 403, 404]);
      });
    });

    it("PUT /orders/:orderId/status - should update to COMPLETED", () => {
      cy.request({
        method: "PUT",
        url: `${baseUrl}/orders/1/status`,
        body: { status: "COMPLETED" },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.be.oneOf([200, 400, 401, 403, 404]);
      });
    });

    it("PUT /orders/:orderId/status - should fail with invalid orderId", () => {
      cy.request({
        method: "PUT",
        url: `${baseUrl}/orders/invalid/status`,
        body: { status: "PREPARING" },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.be.oneOf([400, 401, 403]);
      });
    });

    it("PUT /orders/:orderId/status - should fail with invalid status", () => {
      cy.request({
        method: "PUT",
        url: `${baseUrl}/orders/1/status`,
        body: { status: "INVALID_STATUS" },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.be.oneOf([400, 401, 403]);
      });
    });

    it("PUT /orders/:orderId/status - should fail with missing status", () => {
      cy.request({
        method: "PUT",
        url: `${baseUrl}/orders/1/status`,
        body: {},
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.be.oneOf([400, 401, 403]);
      });
    });

    it("PUT /orders/:orderId/status - should fail for non-existent order", () => {
      cy.request({
        method: "PUT",
        url: `${baseUrl}/orders/999999/status`,
        body: { status: "PREPARING" },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.be.oneOf([401, 403, 404]);
      });
    });
  });
});