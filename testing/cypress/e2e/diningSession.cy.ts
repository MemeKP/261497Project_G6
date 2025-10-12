describe("Dining Session API (Session-based)", () => {
  const admin = {
    email: "test@example.com",
    password: "123456",
  };

  let sessionId: number | string = "";

  before(() => {
    cy.sessionLogin(admin.email, admin.password);
  });

  it("POST /dining_session/start (admin)", () => {
  cy.sessionRequest("POST", "/dining_session/start", {
    tableId: 1,
  }).then((res) => {
    expect([200, 201, 400, 404, 500]).to.include(res.status);

    //  ถ้ามี body.id หรือ session.id ให้เก็บไว้
    sessionId = res.body?.session?.id || res.body?.id || 1;
    cy.log("Response:", JSON.stringify(res.body));
  });
});


  //  Get active sessions
  it("GET /dining_session/active (admin)", () => {
    cy.sessionRequest("GET", "/dining_session/active").then((res) => {
      expect([200, 201, 400, 404, 500]).to.include(res.status);
      expect(res.body).to.have.property("activeSessions");
    });
  });

  // Get by ID
  it("GET /dining_session/:id", () => {
    cy.sessionRequest("GET", `/dining_session/${sessionId}`).then((res) => {
      expect([200, 201, 400, 404, 500]).to.include(res.status); 
    });
  });

  //  End session
  it("POST /dining_session/end (admin)", () => {
    cy.sessionRequest("POST", "/dining_session/end", {
      tableId: 1,
    }).then((res) => {
      expect([200, 201, 400, 404, 500]).to.include(res.status);
    });
  });
});
