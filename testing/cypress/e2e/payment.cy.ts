describe(" Payment API (PromptPay QR Code)", () => {
  let billId = 1; // ใช้บิลที่มีอยู่จาก seed
  let paymentId: number;

  before(() => {
    cy.sessionLoginAdmin();
  });

  //
  //  ทดสอบสร้าง QR สำหรับการจ่ายเงิน
  //
  it("POST /payments → สร้าง PromptPay QR", () => {
    cy.sessionRequest("POST", "/payments", { billId }).then((res) => {
      cy.log(" Response:", JSON.stringify(res.body));

      expect([200, 201]).to.include(res.status);
      expect(res.body).to.have.property("paymentId");
      expect(res.body).to.have.property("qrCode");
      expect(res.body).to.have.property("status", "PENDING");
      expect(res.body.qrCode).to.be.a("string");

      paymentId = res.body.paymentId;
      cy.log(` Payment created with id ${paymentId}`);
    });
  });

  //
  // ยืนยันการชำระเงิน (simulate admin confirm)
  //
  it("PATCH /payments/:paymentId/confirm → ยืนยันการจ่าย", () => {
    cy.sessionRequest("PATCH", `/payments/${paymentId}/confirm`).then((res) => {
      cy.log(" Confirm Response:", JSON.stringify(res.body));

      expect([200, 204]).to.include(res.status);
      expect(res.body).to.have.property("status", "PAID");
      cy.log(` Payment ${paymentId} confirmed`);
    });
  });

  //
  // 3ตรวจสอบว่า Bill ถูกอัปเดตเป็น PAID แล้ว
  //
  it("GET /bill-splits/bills/:billId/splits → ตรวจ bill หลังจ่าย", () => {
    cy.sessionRequest("GET", `/bill-splits/bills/${billId}/splits`).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.be.an("array");
      cy.log(` Bill ${billId} splits after payment: ${res.body.length}`);
    });
  });
});
