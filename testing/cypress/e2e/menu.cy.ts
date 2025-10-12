describe("MenuItems API", () => {
  let menuId = "";

  //  GET /menu_items
  it("GET /menu_items", () => {
    cy.request({
      method: "GET",
      url: "/menu_items",
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.have.property("success", true);
      expect(res.body.data).to.be.an("array");
      cy.log(` Total menu items: ${res.body.data.length}`);
    });
  });

  //  POST /menu_items 
  it("POST /menu_items ", () => {
    cy.request({
      method: "POST",
      url: "/menu_items",
      body: {
        name: "Pink Latte",
        price: 89,
        category: "drink",
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect([200, 201]).to.include(res.status);
      expect(res.body).to.have.property("success", true);
      expect(res.body.data).to.have.property("id");
      menuId = res.body?.data?.id || res.body?.id;
      cy.log(` Created menu ID: ${menuId}`);
    });
  });

  //  GET /menu_items/:menuId
it("GET /menu_items/:menuId", () => {
  cy.request({
    method: "GET",
    url: `/menu_items/${menuId}`,
    failOnStatusCode: false,
  }).then((res) => {
    expect([200, 201]).to.include(res.status);
    expect(res.body).to.have.property("id", menuId);
    expect(res.body).to.have.property("name");
    cy.log(`Found menu item ${menuId}`);
  });
});


  //  PUT /menu_items/:menuId (update)
  it("PUT /menu_items/:menuId (update)", () => {
    cy.request({
      method: "PUT",
      url: `/menu_items/${menuId}`,
      body: { price: 95 },
      failOnStatusCode: false,
    }).then((res) => {
      expect([200, 204]).to.include(res.status);
      cy.log(` Updated price for menu ID: ${menuId}`);
    });
  });

  //  GET /menu_items/bestsellers
  it("GET /menu_items/bestsellers", () => {
    cy.request({
      method: "GET",
      url: "/menu_items/bestsellers",
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.be.an("array");
      cy.log(` Got ${res.body.length} bestsellers`);
    });
  });

  //  DELETE /menu_items/:menuId
  it("DELETE /menu_items/:menuId", () => {
    cy.request({
      method: "DELETE",
      url: `/menu_items/${menuId}`,
      failOnStatusCode: false,
    }).then((res) => {
      expect([200, 204]).to.include(res.status);
      cy.log(` Deleted menu ID: ${menuId}`);
    });
  });


  //  เพิ่ม test ใหม่ แยกออกสำหรับ 
it("POST /menu_items (image)", () => {
  cy.fixture("sample-menu.jpg", "base64").then(async (fileContent) => {
    const blob = Cypress.Blob.base64StringToBlob(fileContent, "image/jpeg");
    const file = new File([blob], "sample-menu.jpg", { type: "image/jpeg" });

    const fd = new FormData();
    fd.append("name", "Test Latte");
    fd.append("price", "100");
    fd.append("category", "drink");
    fd.append("image", file);

    const res = await fetch("http://localhost:3000/menu_items", {
      method: "POST",
      body: fd,
    });

    const text = await res.text();
    cy.log(" Raw Response:", text);

    const body = JSON.parse(text);

    expect(res.status).to.be.oneOf([200, 201]);
    expect(body).to.have.property("success", true);
    expect(body.data).to.have.property("id");
    cy.log(`Uploaded menu with image ID: ${body.data.id}`);
  });
});
});
