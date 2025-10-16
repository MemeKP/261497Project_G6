// import { useEffect, useState, useRef } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import backIcon from "../assets/imgs/back.png";
// import bg1 from "../assets/imgs/bg-1.png";

// interface MemberSplit {
//   memberId: number;
//   name: string;
//   amount: string;
//   paid: boolean;
//   sessionId?: number;
// }

// interface SessionStatus {
//   id: number;
//   status: string;
// }

// const SplitBillPage = () => {
//   const { billId } = useParams<{ billId: string }>();
//   const navigate = useNavigate();

//   const [splits, setSplits] = useState<MemberSplit[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [total, setTotal] = useState(0);
//   const redirected = useRef(false);

//   // ✅ โหลดข้อมูลบิลแยก
//   const fetchSplits = async () => {
//     try {
//       const res = await fetch(`/api/bill-splits/bills/${billId}/splits`, {
//         credentials: "include",
//       });
//       const data = await res.json();
//       if (!res.ok) throw new Error(data.error || "Failed to fetch splits");

//       console.log("📦 Split data from backend:", data);
//       setSplits(data);

//       const sum = data.reduce(
//         (acc: number, s: any) => acc + Number(s.amount || 0),
//         0
//       );
//       setTotal(sum);
//     } catch (err) {
//       console.error("❌ Error fetching splits:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // โหลดครั้งแรก
//   useEffect(() => {
//     fetchSplits();
//   }, [billId]);

//   // 🔁 Poll ทุก 3 วิ เพื่อตรวจการจ่ายเงินและสถานะ session
//   useEffect(() => {
//     const interval = setInterval(async () => {
//       await fetchSplits();

//       // ✅ ถ้าทุกคนจ่ายครบแล้ว → ตรวจสถานะ session
//       if (splits.length > 0) {
//         const allPaid = splits.every((s) => s.paid === true);
//         if (allPaid && !redirected.current) {
//           const sessionId = splits[0]?.sessionId;
//           if (!sessionId) return;

//           console.log("✅ Everyone has paid! Checking session status...");

//           try {
//             // ✅ ใช้ route /public ที่เป็นแบบเปิดให้ลูกค้าเรียกได้
//             const res = await fetch(`/api/dining_session/public/${sessionId}`);
//             const sessionData: SessionStatus = await res.json();

//             console.log("📡 Session status:", sessionData.status);

//             if (sessionData.status === "COMPLETED") {
//               redirected.current = true;
//               alert("✅ This session has been closed!");
//               navigate(`/session/${sessionId}`);
//             }
//           } catch (err) {
//             console.error("❌ Error fetching session status:", err);
//           }
//         }
//       }
//     }, 3000);

//     return () => clearInterval(interval);
//   }, [splits, navigate]);

//   if (loading)
//     return <p className="text-white text-center mt-10">Loading...</p>;
//   if (splits.length === 0)
//     return <p className="text-white text-center mt-10">No bill data.</p>;

//   return (
//     <div className="w-full h-screen relative bg-black overflow-hidden">
//       {/* BG */}
//       <div
//         className="w-full h-full bg-cover bg-center absolute inset-0"
//         style={{ backgroundImage: `url(${bg1})` }}
//       ></div>
//       <div className="absolute inset-0 bg-black opacity-70"></div>

//       {/* CONTENT */}
//       <div className="absolute inset-0 flex flex-col items-center p-6 text-white">
//         {/* Header */}
//         <div className="w-full flex justify-between items-center mb-6">
//           <img
//             src={backIcon}
//             alt="back"
//             className={`w-8 h-8 cursor-pointer rounded-full p-1 transition
//               ${
//                 splits.some((s) => s.paid)
//                   ? "bg-gray-500/40 cursor-not-allowed"
//                   : "bg-white/20 hover:bg-white/40"
//               }`}
//             onClick={async () => {
//               const someonePaid = splits.some((s) => s.paid);
//               if (someonePaid) {
//                 alert("You cannot cancel the split bill because someone has already paid.");
//                 return;
//               }

//               const confirmCancel = confirm("Are you sure you want to cancel the split bill?");
//               if (!confirmCancel) return;

//               try {
//                 await fetch(`/api/bill-splits/bills/${billId}/splits`, {
//                   method: "DELETE",
//                   credentials: "include",
//                 });

//                 alert("The split bill has been successfully cancelled.");

//                 const sessionId = splits[0]?.sessionId;
//                 if (sessionId) {
//                   navigate(`/billpage/${sessionId}`);
//                 } else {
//                   navigate(-1);
//                 }
//               } catch (err) {
//                 console.error("Error cancelling split:", err);
//                 alert("Failed to cancel the split bill. Please try again.");
//               }
//             }}
//           />
//           <h1 className="title1 font-bold text-3xl tracking-wider">ENSO</h1>
//           <div className="w-6" />
//         </div>

//         {/* Title */}
//         <h2 className="text-2xl font-semibold mt-2 mb-1 font-[Gantari]">
//           Split Bill
//         </h2>
//         <p className="text-gray-200 mb-8 text-lg font-[Gantari]">
//           Total: {total.toFixed(2)} ฿
//         </p>

//         {/* List */}
//         <div className="w-full max-w-md flex flex-col gap-4">
//           {splits.map((split) => (
//             <div
//               key={split.memberId}
//               onClick={() => {
//                 if (!split.paid) {
//                   navigate(`/payment/${billId}/${split.memberId}`);
//                 }
//               }}
//               className={`flex justify-between items-center px-6 py-4 rounded-full text-lg font-[Gantari] transition relative
//                 ${
//                   split.paid
//                     ? "bg-white text-black border-2 border-green-600 shadow-[0_0_10px_rgba(74,222,128,0.3)] cursor-not-allowed"
//                     : "bg-black/80 text-white border border-white/30 hover:bg-black/60 cursor-pointer"
//                 }`}
//             >
//               <span className="font-semibold">{split.name}</span>

//               <span className="flex items-center gap-2">
//                 {split.amount} ฿
//                 {split.paid && (
//                   <span className="w-5 h-5 bg-green-600 text-white rounded-full flex items-center justify-center">
//                     <svg
//                       xmlns="http://www.w3.org/2000/svg"
//                       className="w-3 h-3"
//                       fill="none"
//                       viewBox="0 0 24 24"
//                       stroke="currentColor"
//                     >
//                       <path
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                         strokeWidth={3}
//                         d="M5 13l4 4L19 7"
//                       />
//                     </svg>
//                   </span>
//                 )}
//               </span>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default SplitBillPage;

// import { useEffect, useState } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import backIcon from "../assets/imgs/back.png";
// import bg1 from "../assets/imgs/bg-1.png";

// interface MemberSplit {
//   memberId: number;
//   name: string;
//   amount: string;
//   paid: boolean;
//   sessionId?: number;
// }

// const SplitBillPage = () => {
//   const { billId } = useParams<{ billId: string }>();
//   const navigate = useNavigate();
//   const [splits, setSplits] = useState<MemberSplit[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [total, setTotal] = useState(0);

//   // ✅ โหลดข้อมูลบิลแยก
//   const fetchSplits = async () => {
//     try {
//       const res = await fetch(`/api/bill-splits/bills/${billId}/splits`, {
//         credentials: "include",
//       });
//       const data = await res.json();
//       if (!res.ok) throw new Error(data.error || "Failed to fetch splits");

//       console.log("📦 Split data from backend:", data);
//       setSplits(data);

//       const sum = data.reduce(
//         (acc: number, s: any) => acc + Number(s.amount || 0),
//         0
//       );
//       setTotal(sum);
//     } catch (err) {
//       console.error("❌ Error fetching splits:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // โหลดครั้งแรก
//   useEffect(() => {
//     fetchSplits();
//   }, [billId]);

//   // 🔁 Poll ทุก 3 วิ เพื่อตรวจการจ่ายเงิน
//   useEffect(() => {
//     const interval = setInterval(async () => {
//       await fetchSplits();
//     }, 3000);

//     return () => clearInterval(interval);
//   }, [billId]);

//   const allPaid = splits.length > 0 && splits.every((s) => s.paid);
//   const sessionId = splits[0]?.sessionId;

//   if (loading)
//     return <p className="text-white text-center mt-10">Loading...</p>;
//   if (splits.length === 0)
//     return <p className="text-white text-center mt-10">No bill data.</p>;

//   return (
//     <div className="w-full h-screen relative bg-black overflow-hidden">
//       {/* BG */}
//       <div
//         className="w-full h-full bg-cover bg-center absolute inset-0"
//         style={{ backgroundImage: `url(${bg1})` }}
//       ></div>
//       <div className="absolute inset-0 bg-black opacity-70"></div>

//       {/* CONTENT */}
//       <div className="absolute inset-0 flex flex-col items-center p-6 text-white">
//         {/* Header */}
//         <div className="w-full flex justify-between items-center mb-6">
//           <img
//             src={backIcon}
//             alt="back"
//             className={`w-8 h-8 cursor-pointer rounded-full p-1 transition
//               ${
//                 splits.some((s) => s.paid)
//                   ? "bg-gray-500/40 cursor-not-allowed"
//                   : "bg-white/20 hover:bg-white/40"
//               }`}
//             onClick={async () => {
//               const someonePaid = splits.some((s) => s.paid);
//               if (someonePaid) {
//                 alert(
//                   "You cannot cancel the split bill because someone has already paid."
//                 );
//                 return;
//               }

//               const confirmCancel = confirm(
//                 "Are you sure you want to cancel the split bill?"
//               );
//               if (!confirmCancel) return;

//               try {
//                 await fetch(`/api/bill-splits/bills/${billId}/splits`, {
//                   method: "DELETE",
//                   credentials: "include",
//                 });

//                 alert("The split bill has been successfully cancelled.");

//                 if (sessionId) {
//                   navigate(`/billpage/${sessionId}`);
//                 } else {
//                   navigate(-1);
//                 }
//               } catch (err) {
//                 console.error("Error cancelling split:", err);
//                 alert("Failed to cancel the split bill. Please try again.");
//               }
//             }}
//           />
//           <h1 className="title1 font-bold text-3xl tracking-wider">ENSO</h1>
//           <div className="w-6" />
//         </div>

//         {/* Title */}
//         <h2 className="text-2xl font-semibold mt-2 mb-1 font-[Gantari]">
//           Split Bill
//         </h2>
//         <p className="text-gray-200 mb-8 text-lg font-[Gantari]">
//           Total: {total.toFixed(2)} ฿
//         </p>

//         {/* List */}
//         <div className="w-full max-w-md flex flex-col gap-4">
//           {splits.map((split) => (
//             <div
//               key={split.memberId}
//               onClick={() => {
//                 if (!split.paid) {
//                   navigate(`/payment/${billId}/${split.memberId}`);
//                 }
//               }}
//               className={`flex justify-between items-center px-6 py-4 rounded-full text-lg font-[Gantari] transition relative
//                 ${
//                   split.paid
//                     ? "bg-white text-black border-2 border-green-600 shadow-[0_0_10px_rgba(74,222,128,0.3)] cursor-not-allowed"
//                     : "bg-black/80 text-white border border-white/30 hover:bg-black/60 cursor-pointer"
//                 }`}
//             >
//               <span className="font-semibold">{split.name}</span>

//               <span className="flex items-center gap-2">
//                 {split.amount} ฿
//                 {split.paid && (
//                   <span className="w-5 h-5 bg-green-600 text-white rounded-full flex items-center justify-center">
//                     <svg
//                       xmlns="http://www.w3.org/2000/svg"
//                       className="w-3 h-3"
//                       fill="none"
//                       viewBox="0 0 24 24"
//                       stroke="currentColor"
//                     >
//                       <path
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                         strokeWidth={3}
//                         d="M5 13l4 4L19 7"
//                       />
//                     </svg>
//                   </span>
//                 )}
//               </span>
//             </div>
//           ))}
//         </div>

//         {/* ✅ View Summary Button */}
//         {allPaid && (
//         <div className="mt-auto mb-10 flex justify-center w-full">
//           <button
//             onClick={() => navigate(`/session/${sessionId}`)}
//             className="w-[250px] h-12 rounded-full font-semibold text-lg
//                       bg-gradient-to-r from-white to-black text-black
//                       shadow-[0px_4px_18px_0px_rgba(217,217,217,1.00)]
//                       hover:opacity-90 transition"
//           >
//             View Summary
//           </button>
//         </div>
//       )}

//       </div>
//     </div>
//   );
// };

// export default SplitBillPage;
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import backIcon from "../assets/imgs/back.png";
import bg1 from "../assets/imgs/bg-1.png";

interface MemberSplit {
  memberId: number;
  name: string;
  amount: string;
  paid: boolean;
  sessionId?: number;
}

const SplitBillPage = () => {
  const { billId } = useParams<{ billId: string }>();
  const navigate = useNavigate();

  const [splits, setSplits] = useState<MemberSplit[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // ✅ โหลดข้อมูลบิลแยก
  const fetchSplits = async () => {
    try {
      const res = await fetch(`/api/bill-splits/bills/${billId}/splits`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch splits");

      console.log("📦 Split data from backend:", data);
      setSplits(data);

      const sum = data.reduce(
        (acc: number, s: any) => acc + Number(s.amount || 0),
        0
      );
      setTotal(sum);
    } catch (err) {
      console.error("❌ Error fetching splits:", err);
    } finally {
      setLoading(false);
    }
  };

  // โหลดครั้งแรก
  useEffect(() => {
    fetchSplits();
  }, [billId]);

  // 🔁 Poll ทุก 3 วิ เพื่อตรวจการจ่ายเงิน
  useEffect(() => {
    const interval = setInterval(async () => {
      await fetchSplits();
    }, 3000);

    return () => clearInterval(interval);
  }, [billId]);

  const allPaid = splits.length > 0 && splits.every((s) => s.paid);
  const sessionId = splits[0]?.sessionId;

  if (loading)
    return <p className="text-white text-center mt-10">Loading...</p>;
  if (splits.length === 0)
    return <p className="text-white text-center mt-10">No bill data.</p>;

  return (
    <div className="w-full h-screen relative bg-black overflow-hidden">
      {/* BG */}
      <div
        className="w-full h-full bg-cover bg-center absolute inset-0"
        style={{ backgroundImage: `url(${bg1})` }}
      ></div>
      <div className="absolute inset-0 bg-black opacity-70"></div>

      {/* CONTENT */}
      <div className="absolute inset-0 flex flex-col items-center p-6 text-white">
        {/* Header */}
        <div className="w-full flex justify-between items-center mb-6">
          <img
            src={backIcon}
            alt="back"
            className={`w-8 h-8 cursor-pointer rounded-full p-1 transition
              ${
                splits.some((s) => s.paid)
                  ? "bg-gray-500/40 cursor-not-allowed"
                  : "bg-white/20 hover:bg-white/40"
              }`}
            onClick={async () => {
              const someonePaid = splits.some((s) => s.paid);
              if (someonePaid) {
                alert(
                  "You cannot cancel the split bill because someone has already paid."
                );
                return;
              }

              const confirmCancel = confirm(
                "Are you sure you want to cancel the split bill?"
              );
              if (!confirmCancel) return;

              try {
                await fetch(`/api/bill-splits/bills/${billId}/splits`, {
                  method: "DELETE",
                  credentials: "include",
                });

                alert("The split bill has been successfully cancelled.");

                if (sessionId) {
                  navigate(`/billpage/${sessionId}`);
                } else {
                  navigate(-1);
                }
              } catch (err) {
                console.error("Error cancelling split:", err);
                alert("Failed to cancel the split bill. Please try again.");
              }
            }}
          />
          <h1 className="title1 font-bold text-3xl tracking-wider">ENSO</h1>
          <div className="w-6" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-semibold mt-2 mb-1 font-[Gantari]">
          Split Bill
        </h2>
        <p className="text-gray-200 mb-8 text-lg font-[Gantari]">
          Total: {total.toFixed(2)} ฿
        </p>

        {/* List */}
        <div className="w-full max-w-md flex flex-col gap-4">
          {splits.map((split) => (
            <div
              key={split.memberId}
              onClick={() => {
                if (!split.paid) {
                  navigate(`/payment/${billId}/${split.memberId}`);
                }
              }}
              className={`flex justify-between items-center px-6 py-4 rounded-full text-lg font-[Gantari] transition relative
                ${
                  split.paid
                    ? "bg-white text-black border-2 border-green-600 shadow-[0_0_10px_rgba(74,222,128,0.3)] cursor-not-allowed"
                    : "bg-black/80 text-white border border-white/30 hover:bg-black/60 cursor-pointer"
                }`}
            >
              <span className="font-semibold">{split.name}</span>

              <span className="flex items-center gap-2">
                {split.amount} ฿
                {split.paid && (
                  <span className="w-5 h-5 bg-green-600 text-white rounded-full flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-3 h-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>

        {/* ✅ View Summary Button */}
        {allPaid && (
        <div className="mt-auto mb-10 flex justify-center w-full">
          <button
            onClick={() => navigate(`/session/${sessionId}`)}
            className="w-[250px] h-12 rounded-full font-semibold text-lg
                      bg-gradient-to-r from-white to-black text-black
                      shadow-[0px_4px_18px_0px_rgba(217,217,217,1.00)]
                      hover:opacity-90 transition"
          >
            View Summary
          </button>
        </div>
      )}

      </div>
    </div>
  );
};

export default SplitBillPage;