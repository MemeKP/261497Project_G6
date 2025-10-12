describe("Auth API (Session-based)", () => {
  const user = {
    username: "tester01",
    firstName: "Test",
    lastName: "User",
    phone: "0812345678",
    address: "Bangkok",
    email: "test@example.com",
    password: "123456",
  };

  // Register
  it("POST /auth/register", () => {
    cy.request({
      method: "POST",
      url: "/auth/register",
      body: user,
      failOnStatusCode: false,
    }).then((res) => {
      expect([200, 201, 400, 409]).to.include(res.status);
    });
  });

  // Login (เก็บ session cookie ไว้ใน env)
  it("POST /auth/login", () => {
    cy.sessionLogin(user.email, user.password);
  });

  // Get current logged-in user
  it("GET /auth/me", () => {
    cy.sessionRequest("GET", "/auth/me").then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.have.nested.property("admin.email", user.email);
    });
  });

  //  Logout (ใช้ session เดิม)
  it("POST /auth/logout", () => {
    cy.sessionRequest("POST", "/auth/logout").then((res) => {
      expect([200, 204]).to.include(res.status);
    });
  });
});
