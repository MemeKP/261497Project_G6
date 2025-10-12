import AdminNav from "../components/AdminNav";
import PaymentGraph from "../components/PaymentGraph"
import PaymentHistory from "../components/PaymentHistory"

const handlePeriodChange = (period: 'week' | 'month' | 'year') => {
    console.log('Period changed to:', period);
    // สามารถทำอะไรเพิ่มเติมได้ที่นี่
  };

const AdminPayment = () => {
  
  return (
    <div className="bg-[#F4F3F7] min-h-screen w-full font-[Gantari] p-4">
      <AdminNav />

      {/* GRAPH */}
      <PaymentGraph period="month" onPeriodChange={handlePeriodChange}/>
      
      {/* TABLE & PAYMENT HISTORY */}
      <PaymentHistory/>
    </div>
  );
};

export default AdminPayment;