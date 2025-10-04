import React from "react";
import AdminNav from "../components/AdminNav";
import PaymentGraph from "../components/PaymentGraph"

const AdminPayment = () => {
  return (
    <div className="bg-[#F4F3F7] min-h-screen w-full font-[Gantari] p-4">
      <AdminNav />

      {/* GRAPH */}
      <PaymentGraph/>
      {/* TABLE & PAYMENT HISTORY */}

    </div>
  );
};

export default AdminPayment;
