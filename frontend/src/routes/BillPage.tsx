// import { useState, useEffect } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import logo from "../assets/imgs/logo.png";
// import backIcon from "../assets/imgs/back.png";

// interface OrderItem {
//   menuName: string;
//   price: number;
//   quantity: number;
// }

// interface BillData {
//   id?: number;
//   billId: number;
//   orderId: number;
//   subtotal: number;
//   serviceCharge: number;
//   total: number;
//   status: string;
//   items: OrderItem[];
// }

// const BillPage = () => {
//   const { sessionId } = useParams<{ sessionId: string }>();
//   const [bill, setBill] = useState<BillData | null>(null);
//   const [loading, setLoading] = useState(true);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const fetchBill = async () => {
//       try {
//         const res = await fetch(`/api/bill-splits/sessions/${sessionId}/bill`, {
//           credentials: "include",
//         });
//         const data = await res.json();

//         if (!data || !data.items) {
//           setBill(null);
//           return;
//         }

//         // ✅ แปลง price เป็น number เพื่อกัน .toFixed error
//         const fixedData = {
//           ...data,
//           items: data.items.map((i: any) => ({
//             ...i,
//             price: Number(i.price),
//           })),
//         };

//         setBill(fixedData);
//       } catch (err) {
//         console.error("Error fetching bill:", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchBill();
//   }, [sessionId]);

//   if (loading) return <p className="text-center text-white">Loading...</p>;
//   if (!bill) return <p className="text-center text-white">No bill found.</p>;

//   return (
//     <div className="w-full min-h-screen relative bg-[#1E1E1E] text-white p-6 flex flex-col">
//       {/* Header */}
//       <div className="flex justify-between items-center mb-6">
//         <button
//           onClick={() => navigate(`/orderstatus/${sessionId}`)}
//           className="p-2 hover:opacity-80 transition"
//         >
//           <img
//             src={backIcon}
//             alt="Back"
//             className="w-5 h-5 md:w-6 md:h-6 object-contain"
//           />
//         </button>
//         <h1 className="title1 text-2xl tracking-wider">ENSO</h1>
//         <div className="w-5 md:w-6" /> {/* Spacer */}
//       </div>

//       <h2 className="text-xl text-center mb-6">Your Bill</h2>

//       {/* Bill Card */}
//       <div className="bg-white text-black rounded-2xl p-6 w-[90%] mx-auto shadow-lg">
//         {/* Table info */}
//         <div className="flex items-center gap-4 mb-4">
//           <img src={logo} alt="ENSO" className="w-10 h-10 rounded-full" />
//           <div>
//             <p className="font-bold">Order ID: {bill.orderId}</p>
//             <p className="text-xs text-gray-600">Status: {bill.status}</p>
//           </div>
//         </div>

//         {/* Items list */}
//         <div className="text-sm mb-4">
//           <div className="grid grid-cols-[1fr_64px_100px] font-semibold border-b border-dashed border-gray-400 pb-1">
//             <span>Item</span>
//             <span className="text-center">Qty</span>
//             <span className="text-right">Price</span>
//           </div>

//           {bill.items.map((item, idx) => (
//             <div
//               key={idx}
//               className="grid grid-cols-[1fr_64px_100px] py-1 items-baseline"
//             >
//               <span className="whitespace-nowrap">{item.menuName}</span>
//               <span className="text-center tabular-nums">{item.quantity}</span>
//               <span className="text-right tabular-nums">
//                 {item.price.toFixed(2)}
//               </span>
//             </div>
//           ))}
//         </div>

//         {/* Summary */}
//         <div className="text-sm border-t border-dashed border-gray-400 pt-2">
//           <div className="flex justify-between">
//             <span>Sub Total</span>
//             <span>{Number(bill.subtotal).toFixed(2)}</span>
//           </div>
//           <div className="flex justify-between">
//             <span>Service Charge</span>
//             <span>{Number(bill.serviceCharge).toFixed(2)}</span>
//           </div>
//         </div>

//         {/* Total */}
//         <div className="flex justify-between font-bold text-lg mt-2">
//           <span>Total</span>
//           <span>{Number(bill.total).toFixed(2)}</span>
//         </div>
//       </div>

//       {/* Buttons */}
//       <div className="mt-auto flex flex-col gap-4 items-center pt-8 pb-4">
//         <button
//           onClick={() => navigate(`/payment/${bill.id}`)}
//           className="w-[280px] h-12 rounded-full text-base font-semibold text-black 
//                     shadow-[0px_4px_18px_rgba(217,217,217,1.00)] 
//                     bg-gradient-to-r from-white to-black hover:opacity-90 transition"
//         >
//           Pay Entire Bill
//         </button>

//         <button
//           onClick={async () => {
//             try {
//               // ✅ ตรวจสอบว่ามี bill สำหรับ session นี้อยู่แล้วหรือไม่
//               const checkBillRes = await fetch(`/api/bill-splits/sessions/${sessionId}/check-bill`, {
//                 credentials: "include",
//               });

//               let billData;

//               if (checkBillRes.ok) {
//                 // ถ้ามี bill อยู่แล้ว → ใช้ bill เดิม
//                 billData = await checkBillRes.json();
//                 console.log("✅ Using existing bill:", billData);
//               } else {
//                 // ถ้าไม่มี → สร้าง bill ใหม่จาก session
//                 const createBillRes = await fetch(`/api/bill-splits/sessions/${sessionId}/bill`, {
//                   method: "POST",
//                   credentials: "include",
//                 });
//                 if (!createBillRes.ok) throw new Error("Failed to create bill");
//                 billData = await createBillRes.json();
//                 console.log("✅ Created new bill:", billData);
//               }

//               navigate(`/splitbill/${billData.id}`);
//             } catch (err) {
//               console.error("Error:", err);
//               alert("Failed to process bill. Please try again.");
//             }
//           }}
//           className="w-[280px] h-12 rounded-full text-base font-semibold text-black 
//             shadow-[0px_4px_18px_rgba(217,217,217,1.00)] 
//             bg-gradient-to-r from-white to-black hover:opacity-90 transition"
//         >
//           Split Bill
//         </button>


//       </div>
//     </div>
//   );
// };

// export default BillPage;

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import logo from "../assets/imgs/logo.png";
import backIcon from "../assets/imgs/back.png";

interface OrderItem {
  menuName: string;
  price: number;
  quantity: number;
}

interface BillData {
  id?: number;
  billId: number;
  orderId: number;
  subtotal: number;
  serviceCharge: number;
  total: number;
  status: string;
  items: OrderItem[];
}

const BillPage = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [bill, setBill] = useState<BillData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
  const fetchBill = async () => {
    try {
      const res = await fetch(`/api/bill-splits/sessions/${sessionId}/bill`, {
        credentials: "include",
      });
      const data = await res.json();

      console.log("📋 [BILL] Raw bill data:", data); // 👈 เพิ่มนี้

      if (!data || !data.items) {
        setBill(null);
        return;
      }

      // ✅ ป้องกัน .toFixed error
      const fixedData = {
        ...data,
        items: data.items.map((i: any) => ({
          ...i,
          price: Number(i.price),
        })),
      };

      console.log("📋 [BILL] Processed bill data:", fixedData); // 👈 เพิ่มนี้
      setBill(fixedData);
    } catch (err) {
      console.error("Error fetching bill:", err);
    } finally {
      setLoading(false);
    }
  };

  fetchBill();
}, [sessionId]);

  if (loading) return <p className="text-center text-white">Loading...</p>;
  if (!bill) return <p className="text-center text-white">No bill found.</p>;

 const confirmPayment = async (type: "full" | "split") => {
  const message =
    "Are you sure you want to proceed with the payment?\nOnce confirmed, you will not be able to go back and add more orders.";

  const confirm = window.confirm(message);
  if (!confirm) return;

  if (type === "full") {
    try {
      console.log("💰 [PAYMENT] Creating session bill...");

      // สร้าง session bill ก่อน
      const res = await fetch(`/api/bill-splits/sessions/${sessionId}/pay-entire`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to create session bill");

      const billData = await res.json();
      console.log("💰 [PAYMENT] Session bill created:", billData);

      // ใช้ bill id จาก response
      const billId = billData.id || billData.billId;
      navigate(`/payment/${billId}`);

    } catch (err) {
      console.error("Error creating full payment:", err);
      alert("Failed to process payment. Please try again.");
    }
  } else {
    try {
      const res = await fetch(`/api/bill-splits/sessions/${sessionId}/split`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to split bill");

      const billData = await res.json();
      console.log("✅ Split bill created:", billData);
      navigate(`/splitbill/${billData.billId}`);
    } catch (err) {
      console.error("Error splitting bill:", err);
      alert("Failed to split bill. Please try again.");
    }
  }
};
  return (
    <div className="w-full min-h-screen relative bg-[#1E1E1E] text-white p-6 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate(`/orderstatus/${sessionId}`)}
          className="p-2 hover:opacity-80 transition"
        >
          <img
            src={backIcon}
            alt="Back"
            className="w-5 h-5 md:w-6 md:h-6 object-contain"
          />
        </button>
        <h1 className="title1 text-2xl tracking-wider">ENSO</h1>
        <div className="w-5 md:w-6" /> {/* Spacer */}
      </div>

      <h2 className="text-xl text-center mb-6">Your Bill</h2>

      {/* Bill Card */}
      <div className="bg-white text-black rounded-2xl p-6 w-[90%] mx-auto shadow-lg">
        {/* Table info */}
        <div className="flex items-center gap-4 mb-4">
          <img src={logo} alt="ENSO" className="w-10 h-10 rounded-full" />
          <div>
            <p className="font-bold">Order ID: {bill.orderId}</p>
            <p className="text-xs text-gray-600">Status: {bill.status}</p>
          </div>
        </div>

        {/* Items list */}
        <div className="text-sm mb-4">
          <div className="grid grid-cols-[1fr_64px_100px] font-semibold border-b border-dashed border-gray-400 pb-1">
            <span>Item</span>
            <span className="text-center">Qty</span>
            <span className="text-right">Price</span>
          </div>

          {bill.items.map((item, idx) => (
            <div
              key={idx}
              className="grid grid-cols-[1fr_64px_100px] py-1 items-baseline"
            >
              <span className="whitespace-nowrap">{item.menuName}</span>
              <span className="text-center tabular-nums">{item.quantity}</span>
              <span className="text-right tabular-nums">
                {item.price.toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="text-sm border-t border-dashed border-gray-400 pt-2">
          <div className="flex justify-between">
            <span>Sub Total</span>
            <span>{Number(bill.subtotal).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Service Charge</span>
            <span>{Number(bill.serviceCharge).toFixed(2)}</span>
          </div>
        </div>

        {/* Total */}
        <div className="flex justify-between font-bold text-lg mt-2">
          <span>Total</span>
          <span>{Number(bill.total).toFixed(2)}</span>
        </div>
      </div>

      {/* Buttons */}
      <div className="mt-auto flex flex-col gap-4 items-center pt-8 pb-4">
        <button
          onClick={() => confirmPayment("full")}
          className="w-[280px] h-12 rounded-full text-base font-semibold text-black 
                    shadow-[0px_4px_18px_rgba(217,217,217,1.00)] 
                    bg-gradient-to-r from-white to-black hover:opacity-90 transition"
        >
          Pay Entire Bill
        </button>

        <button
          onClick={() => confirmPayment("split")}
          className="w-[280px] h-12 rounded-full text-base font-semibold text-black 
                    shadow-[0px_4px_18px_rgba(217,217,217,1.00)] 
                    bg-gradient-to-r from-white to-black hover:opacity-90 transition"
        >
          Split Bill
        </button>
      </div>
    </div>
  );
};

export default BillPage;