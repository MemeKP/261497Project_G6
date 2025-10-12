Cypress.Commands.add("loginAndGetToken", (email?: string, password?: string) => {
  const _email = email || Cypress.env("userEmail");
  const _password = password || Cypress.env("userPassword");
  return cy.request("POST", "/auth/login", { email: _email, password: _password })
    .then(res => {
      expect(res.status).to.be.oneOf([200, 201]);
      expect(res.body).to.have.property("token");
      return res.body.token as string;
    });
});

Cypress.Commands.add("loginAsAdmin", () => {
  return cy
    .request({
      method: "POST",
      url: "/auth/login",
      headers: { "X-Admin": "true" },
      body: {
        email: Cypress.env("adminEmail"),
        password: Cypress.env("adminPassword"),
      },
      failOnStatusCode: false,
    })
    .then((res) => {
      if (res.status === 200 && res.body?.token) {
        //  flatten ค่าทันทีด้วย Promise.resolve
        return Promise.resolve(res.body.token as string);
      }

      // fallback: register admin + login ใหม่
      return cy
        .request("POST", "/auth/register", {
          name: "Admin",
          email: Cypress.env("adminEmail"),
          password: Cypress.env("adminPassword"),
        })
        .then(() =>
          cy
            .request({
              method: "POST",
              url: "/auth/login",
              headers: { "X-Admin": "true" },
              body: {
                email: Cypress.env("adminEmail"),
                password: Cypress.env("adminPassword"),
              },
            })
            .then((r2) => Promise.resolve(r2.body.token as string))
        );
    });
});


Cypress.Commands.add("authGet", (url: string, token: string) =>
  cy.request({ method: "GET", url, headers: { Authorization: `Bearer ${token}` } }));

Cypress.Commands.add("authPost", (url: string, token: string, body?: any) =>
  cy.request({ method: "POST", url, body, headers: { Authorization: `Bearer ${token}` } }));

Cypress.Commands.add("authPatch", (url: string, token: string, body?: any) =>
  cy.request({ method: "PATCH", url, body, headers: { Authorization: `Bearer ${token}` } }));

Cypress.Commands.add("authDelete", (url: string, token: string) =>
  cy.request({ method: "DELETE", url, headers: { Authorization: `Bearer ${token}` } }));


/**
 * Session-based login (ใช้กับ express-session backend)
 * เก็บ cookie "connect.sid" ไว้ใช้ใน request ถัดไป
 */
Cypress.Commands.add("sessionLogin", (email: string, password: string) => {
  cy.request({
    method: "POST",
    url: "/auth/login",
    body: { email, password },
    failOnStatusCode: false,
  }).then((res) => {
    expect(res.status).to.eq(200);
    const cookies = res.headers["set-cookie"];
    if (cookies && cookies.length > 0) {
      // ดึงค่า connect.sid
      const sid = cookies[0].split(";")[0];
      Cypress.env("sessionCookie", sid);
    }
  });
});

/**
 * ใช้แทน cy.request แต่แนบ cookie session อัตโนมัติ
 */
Cypress.Commands.add("sessionRequest", (method: string, url: string, body?: any) => {
  const cookie = Cypress.env("sessionCookie");
  return cy.request({
    method,
    url,
    body,
    headers: {
      Cookie: cookie,
    },
    failOnStatusCode: false,
  });
});

Cypress.Commands.add("sessionLoginAdmin", () => {
  cy.request({
    method: "POST",
    url: "/auth/login",
    body: {
      email: "admin1@example.com", // จาก seed
      password: "1234",            // จาก seed
    },
    failOnStatusCode: false,
  }).then((res) => {
    expect([200, 201]).to.include(res.status);
    const cookies = res.headers["set-cookie"];
    if (cookies && cookies.length > 0) {
      const sid = cookies[0].split(";")[0];
      Cypress.env("sessionCookie", sid);
      cy.log(" Logged in as admin1@example.com");
    } else {
      throw new Error(" No session cookie found during admin login");
    }
  });
});


