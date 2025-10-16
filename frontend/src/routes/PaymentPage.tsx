import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import backIcon from "../assets/imgs/back.png";
import logo from "../assets/imgs/logo.png";

interface PaymentData {
  paymentId: number;
  billId: number;
  billSplitId?: number | null;
  memberId?: number | null;
  amount: string;
  qrCode: string;
  status?: string;
  billStatus?: string;
  sessionId?: number | null;
}

const PaymentPage = () => {
  const { billId, memberId } = useParams<{ billId: string; memberId?: string }>();
  const navigate = useNavigate();

  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [waitingClose, setWaitingClose] = useState(false);
  const hasCreated = useRef(false);

  /** ✅ โหลดจาก localStorage ก่อน */
  useEffect(() => {
    const saved = localStorage.getItem(`enso_payment_${billId}_${memberId || "full"}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      setPayment(parsed);

      // ถ้าข้อมูลใน localStorage เป็น PAID จริง (ทั้ง payment และ bill)
      if (parsed.status === "PAID" && parsed.billStatus === "PAID") {
        setConfirmed(true);
        setWaitingClose(true);
      }
    }
  }, [billId, memberId]);

  /** ✅ โหลดข้อมูลการจ่าย */
  useEffect(() => {
    if (hasCreated.current) return;
    hasCreated.current = true;

    const initPayment = async () => {
      try {
        const checkRes = await fetch(
          `/api/payments/status/${billId}?memberId=${memberId || ""}`,
          { credentials: "include" }
        );
        const existing = await checkRes.json();
        console.log("💬 existing payment:", existing);

        // 🧹 ถ้ายังไม่จ่าย (เช่น PENDING) ให้เคลียร์ cache เก่าออกก่อน
        if (existing?.status === "PENDING" || existing?.billStatus === "PENDING") {
          localStorage.removeItem(`enso_payment_${billId}_${memberId || "full"}`);
        }

        // 🟢 จ่ายแล้วจริง (ทั้งฝั่ง payment และ bill)
        if (existing?.status === "PAID" && existing?.billStatus === "PAID") {
          const savedData: PaymentData = {
            paymentId: existing.paymentId,
            billId: Number(billId),
            billSplitId: existing.billSplitId || null,
            memberId: memberId ? Number(memberId) : null,
            qrCode: existing.qrCode || "",
            amount: existing.amount || "0",
            status: "PAID",
            billStatus: "PAID",
            sessionId: existing.sessionId || null,
          };
          setPayment(savedData);
          setConfirmed(true);
          setWaitingClose(true);
          localStorage.setItem(
            `enso_payment_${billId}_${memberId || "full"}`,
            JSON.stringify(savedData)
          );
          setLoading(false);
          return;
        }

        // 🟡 ยังไม่จ่าย → ใช้ข้อมูลที่มีอยู่ หรือสร้างใหม่
        if (existing?.paymentId) {
          const pendingData: PaymentData = {
            paymentId: existing.paymentId,
            billId: Number(billId),
            billSplitId: existing.billSplitId || null,
            memberId: memberId ? Number(memberId) : null,
            qrCode: existing.qrCode || "",
            amount: existing.amount || "0",
            status: existing.status || "PENDING",
            billStatus: existing.billStatus || "PENDING",
            sessionId: existing.sessionId || null,
          };
          setPayment(pendingData);
          localStorage.setItem(
            `enso_payment_${billId}_${memberId || "full"}`,
            JSON.stringify(pendingData)
          );

          // 🧩 ถ้า QR ยังว่าง ให้ลอง fetch ซ้ำจาก backend
          if (!pendingData.qrCode || pendingData.qrCode.trim() === "") {
            console.log("🔁 Refetch QR because it's empty...");
            const qrRes = await fetch(
              `/api/payments/status/${billId}?memberId=${memberId || ""}`,
              { credentials: "include" }
            );
            const qrData = await qrRes.json();
            if (qrData?.qrCode) {
              const updated = { ...pendingData, qrCode: qrData.qrCode };
              setPayment(updated);
              localStorage.setItem(
                `enso_payment_${billId}_${memberId || "full"}`,
                JSON.stringify(updated)
              );
            }
          }

          setLoading(false);
          return;
        }

        // 🔵 ถ้าไม่มี payment → สร้างใหม่
        const res = await fetch(`/api/payments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            billId: Number(billId),
            memberId: memberId ? Number(memberId) : null,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create payment");

        console.log("🆕 Created new payment:", data);
        setPayment(data);
        localStorage.setItem(
          `enso_payment_${billId}_${memberId || "full"}`,
          JSON.stringify(data)
        );
      } catch (err) {
        console.error("Error fetching or creating payment:", err);
      } finally {
        setLoading(false);
      }
    };

    initPayment();
  }, [billId, memberId]);

  /** 🔄 Poll สถานะระหว่างรอยืนยัน */
  useEffect(() => {
    if (!payment || confirmed) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/payments/status/${payment.billId}?memberId=${memberId || ""}`,
          { credentials: "include" }
        );
        const data = await res.json();
        console.log("🔁 Polling status:", data.status, data.billStatus);

        // ✅ ต้องจ่ายแล้วจริงทั้งสองฝั่ง
        if (data.status === "PAID" && data.billStatus === "PAID") {
          clearInterval(interval);
          setConfirmed(true);
          setWaitingClose(true);

          const updated = {
            ...payment,
            status: "PAID",
            billStatus: "PAID",
            sessionId: data.sessionId || payment.sessionId || null,
          };
          console.log("✅ Payment confirmed:", updated);
          setPayment(updated);
          localStorage.setItem(
            `enso_payment_${billId}_${memberId || "full"}`,
            JSON.stringify(updated)
          );
        }
      } catch (err) {
        console.error("Polling failed:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [payment, confirmed, billId, memberId]);

  /** 🚫 ป้องกันการย้อนกลับหลังจ่าย */
  useEffect(() => {
    if (!confirmed) return;

    // ดัน state ใหม่เพื่อกัน back
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      alert("You have already completed the payment.");
      window.history.pushState(null, "", window.location.href);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [confirmed]);

  if (loading)
    return <p className="text-center text-white mt-10">Loading...</p>;
  if (!payment)
    return <p className="text-center text-white mt-10">No payment data available.</p>;

  /** ✅ แสดงข้อความสถานะ */
  const renderStatusMessage = () => {
    if (confirmed && payment?.billStatus === "PAID") {
      return (
        <>
          <p className="mt-4 text-green-600 font-semibold">✅ Payment completed!</p>
          <p className="text-gray-400 text-sm mt-2">
            Payment for the entire table has been received.
          </p>
        </>
      );
    } else if (payment?.status === "PENDING" && payment?.billStatus === "PAID") {
      return (
        <p className="mt-4 text-yellow-400 text-sm font-medium">
          Waiting for admin confirmation...
        </p>
      );
    } else {
      return (
        <p className="mt-4 text-gray-500 text-sm">
          Waiting for payment confirmation...
        </p>
      );
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#1E1E1E] text-white p-6 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          disabled={confirmed}
          className={`p-2 transition ${
            confirmed ? "opacity-30 cursor-not-allowed" : "hover:opacity-80"
          }`}
        >
          <img src={backIcon} alt="Back" className="w-5 h-5" />
        </button>
        <h1 className="title1 text-2xl">ENSO</h1>
        <div className="w-5" />
      </div>

      <h2 className="text-xl text-center mb-2">Payment</h2>
      <p className="text-sm text-center text-gray-400 mb-6">
        {memberId ? `For Member #${memberId}` : "Full Bill Payment"}
      </p>

      {/* Card */}
      <div className="bg-white text-black rounded-2xl p-6 w-[90%] mx-auto shadow-lg text-center">
        <img src={logo} alt="ENSO" className="w-12 h-12 rounded-full mx-auto mb-2" />
        <h3 className="font-bold text-lg mb-3">THAI QR PAYMENT</h3>
        <img
          src={payment.qrCode || undefined}
          alt="QR Code"
          className="w-56 h-56 mx-auto border rounded-md shadow-md"
        />
        <p className="mt-4 font-bold text-lg">
          Total: {Number(payment.amount).toFixed(2)} ฿
        </p>

        {renderStatusMessage()}
      </div>

      {/* ✅ ปุ่ม View Summary */}
      {confirmed && waitingClose && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => {
              const latest = localStorage.getItem(`enso_payment_${billId}_${memberId || "full"}`);
              const parsed = latest ? JSON.parse(latest) : payment;
              console.log("➡️ Navigating with sessionId:", parsed.sessionId);
              if (parsed?.sessionId) {
                navigate(`/session/${parsed.sessionId}`);
              } else {
                alert("⚠️ Session ID not found. Please refresh or check backend.");
              }
            }}
            className="w-[250px] h-12 rounded-full font-semibold text-lg
                       bg-gradient-to-r from-white to-black text-black
                       shadow-[0_4px_18px_rgba(217,217,217,1)]
                       hover:opacity-90 transition"
          >
            View Summary
          </button>
        </div>
      )}
    </div>
  );
};

export default PaymentPage;

// import { useEffect, useState, useRef } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import backIcon from "../assets/imgs/back.png";
// import logo from "../assets/imgs/logo.png";

// interface PaymentData {
//   paymentId: number;
//   billId: number;
//   billSplitId?: number | null;
//   memberId?: number | null;
//   amount: string;
//   qrCode: string;
//   status?: string;
//   sessionId?: number | null;
// }

// const PaymentPage = () => {
//   const { billId, memberId } = useParams<{ billId: string; memberId?: string }>();
//   const navigate = useNavigate();

//   const [payment, setPayment] = useState<PaymentData | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [confirmed, setConfirmed] = useState(false);
//   const [waitingClose, setWaitingClose] = useState(false);
//   const hasCreated = useRef(false);

//   /** ✅ โหลดข้อมูลจาก localStorage ก่อน (กันหายหลังรีหน้า) */
//   useEffect(() => {
//     const saved = localStorage.getItem(`enso_payment_${billId}_${memberId || "full"}`);
//     if (saved) {
//       const parsed = JSON.parse(saved);
//       setPayment(parsed);
//       if (parsed.status === "PAID") {
//         setConfirmed(true);
//         setWaitingClose(true);
//       }
//     }
//   }, [billId, memberId]);

//   /** ✅ โหลดข้อมูลการชำระเงิน */
//   useEffect(() => {
//     if (hasCreated.current) return;
//     hasCreated.current = true;

//     const initPayment = async () => {
//       try {
//         const checkRes = await fetch(
//           `/api/payments/status/${billId}?memberId=${memberId || ""}`,
//           { credentials: "include" }
//         );
//         const existing = await checkRes.json();

//         console.log("💬 existing payment:", existing);

//         // 🟢 ถ้ามีอยู่แล้วและจ่ายแล้ว
//         if (existing?.status === "PAID") {
//           const savedData = {
//             paymentId: existing.paymentId,
//             billId: Number(billId),
//             billSplitId: existing.billSplitId || null,
//             memberId: memberId ? Number(memberId) : null,
//             qrCode: existing.qrCode || "",
//             amount: existing.amount || "0",
//             status: "PAID",
//             sessionId: existing.sessionId || null,
//           };
//           console.log("💾 Saved payment (PAID):", savedData);
//           setPayment(savedData);
//           setConfirmed(true);
//           setWaitingClose(true);
//           localStorage.setItem(
//             `enso_payment_${billId}_${memberId || "full"}`,
//             JSON.stringify(savedData)
//           );
//           setLoading(false);
//           return;
//         }

//         // 🟡 ถ้ามี payment แล้วแต่ยังไม่จ่าย
//         if (existing?.status === "PENDING") {
//           // ✅ ถ้าไม่มี qrCode ให้สร้างใหม่
//           if (!existing.qrCode) {
//             console.log("⚠️ No QR found, creating new QR...");
//             const res = await fetch(`/api/payments`, {
//               method: "POST",
//               headers: { "Content-Type": "application/json" },
//               credentials: "include",
//               body: JSON.stringify({
//                 billId: Number(billId),
//                 memberId: memberId ? Number(memberId) : null,
//               }),
//             });
//             const data = await res.json();
//             if (!res.ok) throw new Error(data.error || "Failed to create payment");

//             console.log("🆕 Created new payment:", data);
//             setPayment(data);
//             localStorage.setItem(
//               `enso_payment_${billId}_${memberId || "full"}`,
//               JSON.stringify(data)
//             );
//             setLoading(false);
//             return;
//           }

//           // ✅ ถ้ามี qrCode แล้วก็ใช้ของเดิม
//           const pendingData = {
//             paymentId: existing.paymentId,
//             billId: Number(billId),
//             billSplitId: existing.billSplitId || null,
//             memberId: memberId ? Number(memberId) : null,
//             qrCode: existing.qrCode || "",
//             amount: existing.amount || "0",
//             status: "PENDING",
//             sessionId: existing.sessionId || null,
//           };
//           console.log("🕓 Pending payment loaded:", pendingData);
//           setPayment(pendingData);
//           localStorage.setItem(
//             `enso_payment_${billId}_${memberId || "full"}`,
//             JSON.stringify(pendingData)
//           );
//           setLoading(false);
//           return;
//         }

//         // 🔵 ถ้ายังไม่มีเลย → สร้างใหม่
//         const res = await fetch(`/api/payments`, {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           credentials: "include",
//           body: JSON.stringify({
//             billId: Number(billId),
//             memberId: memberId ? Number(memberId) : null,
//           }),
//         });
//         const data = await res.json();
//         if (!res.ok) throw new Error(data.error || "Failed to create payment");

//         console.log("🆕 Created brand new payment:", data);
//         setPayment(data);
//         localStorage.setItem(
//           `enso_payment_${billId}_${memberId || "full"}`,
//           JSON.stringify(data)
//         );
//       } catch (err) {
//         console.error("Error fetching or creating payment:", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     initPayment();
//   }, [billId, memberId]);

//   /** 🔄 Poll สถานะระหว่างยังไม่จ่าย */
//   useEffect(() => {
//     if (!payment || confirmed) return;

//     const interval = setInterval(async () => {
//       try {
//         const res = await fetch(
//           `/api/payments/status/${payment.billId}?memberId=${memberId || ""}`,
//           { credentials: "include" }
//         );
//         const data = await res.json();
//         console.log("🔁 Polling status:", data.status);

//         if (data.status === "PAID") {
//           clearInterval(interval);
//           setConfirmed(true);
//           setWaitingClose(true);

//           const updated = {
//             ...payment,
//             status: "PAID",
//             sessionId: data.sessionId || payment.sessionId || null, // ✅ ensure sessionId exists
//           };
//           console.log("✅ Payment confirmed:", updated);

//           setPayment(updated);
//           localStorage.setItem(
//             `enso_payment_${billId}_${memberId || "full"}`,
//             JSON.stringify(updated)
//           );
//         }
//       } catch (err) {
//         console.error("Polling failed:", err);
//       }
//     }, 3000);

//     return () => clearInterval(interval);
//   }, [payment, confirmed, billId, memberId]);

//   /** 🚫 ป้องกันย้อนกลับหลังจ่ายแล้ว */
//   useEffect(() => {
//     if (!confirmed) return;
//     const handlePopState = (event: PopStateEvent) => {
//       event.preventDefault();
//       alert("You have already completed the payment.");
//       navigate("/", { replace: true });
//     };
//     window.addEventListener("popstate", handlePopState);
//     return () => window.removeEventListener("popstate", handlePopState);
//   }, [confirmed, navigate]);

//   if (loading)
//     return <p className="text-center text-white mt-10">Loading...</p>;
//   if (!payment)
//     return <p className="text-center text-white mt-10">No payment data available.</p>;

//   return (
//     <div className="w-full min-h-screen bg-[#1E1E1E] text-white p-6 flex flex-col">
//       {/* Header */}
//       <div className="flex justify-between items-center mb-6">
//         <button
//           onClick={() => navigate(-1)}
//           disabled={confirmed}
//           className={`p-2 transition ${
//             confirmed ? "opacity-30 cursor-not-allowed" : "hover:opacity-80"
//           }`}
//         >
//           <img src={backIcon} alt="Back" className="w-5 h-5" />
//         </button>
//         <h1 className="title1 text-2xl">ENSO</h1>
//         <div className="w-5" />
//       </div>

//       <h2 className="text-xl text-center mb-2">Payment</h2>
//       <p className="text-sm text-center text-gray-400 mb-6">
//         {memberId ? `For Member #${memberId}` : "Full Bill Payment"}
//       </p>

//       {/* Card */}
//       <div className="bg-white text-black rounded-2xl p-6 w-[90%] mx-auto shadow-lg text-center">
//         <img src={logo} alt="ENSO" className="w-12 h-12 rounded-full mx-auto mb-2" />
//         <h3 className="font-bold text-lg mb-3">THAI QR PAYMENT</h3>
//         <img
//           src={payment.qrCode}
//           alt="QR Code"
//           className="w-56 h-56 mx-auto border rounded-md shadow-md"
//         />
//         <p className="mt-4 font-bold text-lg">
//           Total: {Number(payment.amount).toFixed(2)} ฿
//         </p>

//         {confirmed ? (
//           <>
//             <p className="mt-4 text-green-600 font-semibold">✅ Payment completed!</p>
//             <p className="text-gray-400 text-sm mt-2">
//               Payment for the entire table has been received.
//             </p>
//           </>
//         ) : (
//           <p className="mt-4 text-gray-500 text-sm">
//             Waiting for payment confirmation...
//           </p>
//         )}
//       </div>

//       {/* ✅ ปุ่ม View Summary */}
// {confirmed && waitingClose && (
//   <div className="mt-8 flex justify-center">
//     <button
//       onClick={() => {
//         // ✅ โหลดข้อมูลล่าสุดจาก localStorage ก่อน navigate
//         const latest = localStorage.getItem(`enso_payment_${billId}_${memberId || "full"}`);
//         const parsed = latest ? JSON.parse(latest) : payment;

//         console.log("➡️ Trying to navigate with sessionId:", parsed.sessionId);

//         if (parsed?.sessionId) {
//           navigate(`/session/${parsed.sessionId}`);
//         } else {
//           alert("⚠️ Session ID not found. Please refresh or check backend.");
//         }
//       }}
//       className="w-[250px] h-12 rounded-full font-semibold text-lg
//                  bg-gradient-to-r from-white to-black text-black
//                  shadow-[0_4px_18px_rgba(217,217,217,1)]
//                  hover:opacity-90 transition"
//     >
//       View Summary
//     </button>
//   </div>
// )}

//     </div>
//   );
// };

// export default PaymentPage;


// import { useEffect, useState, useRef } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import backIcon from "../assets/imgs/back.png";
// import logo from "../assets/imgs/logo.png";

// interface PaymentData {
//   paymentId: number;
//   billId: number;
//   billSplitId?: number | null;
//   memberId?: number | null;
//   amount: string;
//   qrCode: string;
//   status?: string;
//   sessionId?: number | null;
// }

// const PaymentPage = () => {
//   const { billId, memberId } = useParams<{ billId: string; memberId?: string }>();
//   const navigate = useNavigate();

//   const [payment, setPayment] = useState<PaymentData | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [confirmed, setConfirmed] = useState(false);
//   const [waitingClose, setWaitingClose] = useState(false);
//   const hasCreated = useRef(false);

//   /** ✅ โหลดข้อมูลจาก localStorage ก่อน (กันหายหลังรีหน้า) */
//   useEffect(() => {
//     const saved = localStorage.getItem(`enso_payment_${billId}_${memberId || "full"}`);
//     if (saved) {
//       const parsed = JSON.parse(saved);
//       setPayment(parsed);
//       if (parsed.status === "PAID") {
//         setConfirmed(true);
//         setWaitingClose(true);
//       }
//     }
//   }, [billId, memberId]);

//   /** ✅ โหลดข้อมูลการชำระเงิน */
//   useEffect(() => {
//     if (hasCreated.current) return;
//     hasCreated.current = true;

//     const initPayment = async () => {
//       try {
//         const checkRes = await fetch(
//           `/api/payments/status/${billId}?memberId=${memberId || ""}`,
//           { credentials: "include" }
//         );
//         const existing = await checkRes.json();

//         console.log("💬 existing payment:", existing);

//         // 🟢 ถ้ามีอยู่แล้วและจ่ายแล้ว
//         if (existing?.status === "PAID") {
//           const savedData = {
//             paymentId: existing.paymentId,
//             billId: Number(billId),
//             billSplitId: existing.billSplitId || null,
//             memberId: memberId ? Number(memberId) : null,
//             qrCode: existing.qrCode || "",
//             amount: existing.amount || "0",
//             status: "PAID",
//             sessionId: existing.sessionId || null,
//           };
//           setPayment(savedData);
//           setConfirmed(true);
//           setWaitingClose(true);
//           localStorage.setItem(
//             `enso_payment_${billId}_${memberId || "full"}`,
//             JSON.stringify(savedData)
//           );
//           setLoading(false);
//           return;
//         }

//         // 🟡 ถ้ามี payment แล้วแต่ยังไม่จ่าย
//         if (existing?.status === "PENDING") {
//           // ✅ ถ้าไม่มี qrCode ให้สร้างใหม่
//           if (!existing.qrCode) {
//             console.log("⚠️ No QR found, creating new QR...");
//             const res = await fetch(`/api/payments`, {
//               method: "POST",
//               headers: { "Content-Type": "application/json" },
//               credentials: "include",
//               body: JSON.stringify({
//                 billId: Number(billId),
//                 memberId: memberId ? Number(memberId) : null,
//               }),
//             });
//             const data = await res.json();
//             if (!res.ok) throw new Error(data.error || "Failed to create payment");

//             setPayment(data);
//             localStorage.setItem(
//               `enso_payment_${billId}_${memberId || "full"}`,
//               JSON.stringify(data)
//             );
//             setLoading(false);
//             return;
//           }

//           // ✅ ถ้ามี qrCode แล้วก็ใช้ของเดิม
//           const pendingData = {
//             paymentId: existing.paymentId,
//             billId: Number(billId),
//             billSplitId: existing.billSplitId || null,
//             memberId: memberId ? Number(memberId) : null,
//             qrCode: existing.qrCode || "",
//             amount: existing.amount || "0",
//             status: "PENDING",
//             sessionId: existing.sessionId || null,
//           };
//           setPayment(pendingData);
//           localStorage.setItem(
//             `enso_payment_${billId}_${memberId || "full"}`,
//             JSON.stringify(pendingData)
//           );
//           setLoading(false);
//           return;
//         }

//         // 🔵 ถ้ายังไม่มีเลย → สร้างใหม่
//         const res = await fetch(`/api/payments`, {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           credentials: "include",
//           body: JSON.stringify({
//             billId: Number(billId),
//             memberId: memberId ? Number(memberId) : null,
//           }),
//         });
//         const data = await res.json();
//         if (!res.ok) throw new Error(data.error || "Failed to create payment");

//         setPayment(data);
//         localStorage.setItem(
//           `enso_payment_${billId}_${memberId || "full"}`,
//           JSON.stringify(data)
//         );
//       } catch (err) {
//         console.error("Error fetching or creating payment:", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     initPayment();
//   }, [billId, memberId]);

//   /** 🔄 Poll สถานะระหว่างยังไม่จ่าย */
//   useEffect(() => {
//     if (!payment || confirmed) return;
//     const interval = setInterval(async () => {
//       try {
//         const res = await fetch(
//           `/api/payments/status/${payment.billId}?memberId=${memberId || ""}`,
//           { credentials: "include" }
//         );
//         const data = await res.json();
//         console.log("🔁 Polling status:", data.status);

//         if (data.status === "PAID") {
//           clearInterval(interval);
//           setConfirmed(true);
//           setWaitingClose(true);

//           const updated = { ...payment, status: "PAID" };
//           setPayment(updated);
//           localStorage.setItem(
//             `enso_payment_${billId}_${memberId || "full"}`,
//             JSON.stringify(updated)
//           );
//         }
//       } catch (err) {
//         console.error("Polling failed:", err);
//       }
//     }, 3000);

//     return () => clearInterval(interval);
//   }, [payment, confirmed, billId, memberId]);

//   /** 🚫 ป้องกันย้อนกลับหลังจ่ายแล้ว */
//   useEffect(() => {
//     if (!confirmed) return;
//     const handlePopState = (event: PopStateEvent) => {
//       event.preventDefault();
//       alert("You have already completed the payment.");
//       navigate("/", { replace: true });
//     };
//     window.addEventListener("popstate", handlePopState);
//     return () => window.removeEventListener("popstate", handlePopState);
//   }, [confirmed, navigate]);

//   if (loading)
//     return <p className="text-center text-white mt-10">Loading...</p>;
//   if (!payment)
//     return <p className="text-center text-white mt-10">No payment data available.</p>;

//   return (
//     <div className="w-full min-h-screen bg-[#1E1E1E] text-white p-6 flex flex-col">
//       {/* Header */}
//       <div className="flex justify-between items-center mb-6">
//         <button
//           onClick={() => navigate(-1)}
//           disabled={confirmed}
//           className={`p-2 transition ${
//             confirmed ? "opacity-30 cursor-not-allowed" : "hover:opacity-80"
//           }`}
//         >
//           <img src={backIcon} alt="Back" className="w-5 h-5" />
//         </button>
//         <h1 className="title1 text-2xl">ENSO</h1>
//         <div className="w-5" />
//       </div>

//       <h2 className="text-xl text-center mb-2">Payment</h2>
//       <p className="text-sm text-center text-gray-400 mb-6">
//         {memberId ? `For Member #${memberId}` : "Full Bill Payment"}
//       </p>

//       {/* Card */}
//       <div className="bg-white text-black rounded-2xl p-6 w-[90%] mx-auto shadow-lg text-center">
//         <img src={logo} alt="ENSO" className="w-12 h-12 rounded-full mx-auto mb-2" />
//         <h3 className="font-bold text-lg mb-3">THAI QR PAYMENT</h3>
//         <img
//           src={payment.qrCode}
//           alt="QR Code"
//           className="w-56 h-56 mx-auto border rounded-md shadow-md"
//         />
//         <p className="mt-4 font-bold text-lg">
//           Total: {Number(payment.amount).toFixed(2)} ฿
//         </p>

//         {confirmed ? (
//           <>
//             <p className="mt-4 text-green-600 font-semibold">✅ Payment completed!</p>
//             <p className="text-gray-400 text-sm mt-2">
//               Payment for the entire table has been received.
//             </p>
//           </>
//         ) : (
//           <p className="mt-4 text-gray-500 text-sm">
//             Waiting for payment confirmation...
//           </p>
//         )}
//       </div>

//       {/* ✅ ปุ่ม View Summary */}
//       {confirmed && waitingClose && (
//         <div className="mt-8 flex justify-center">
//           <button
//             onClick={() => navigate(`/session/${payment.sessionId}`)}
//             className="w-[250px] h-12 rounded-full font-semibold text-lg
//                        bg-gradient-to-r from-white to-black text-black
//                        shadow-[0_4px_18px_rgba(217,217,217,1)]
//                        hover:opacity-90 transition"
//           >
//             View Summary
//           </button>
//         </div>
//       )}
//     </div>
//   );
// };

// export default PaymentPage;



// import { useEffect, useState, useRef } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import backIcon from "../assets/imgs/back.png";
// import logo from "../assets/imgs/logo.png";

// interface PaymentData {
//   paymentId: number;
//   billId: number;
//   billSplitId?: number | null;
//   memberId?: number | null;
//   amount: string;
//   qrCode: string;
// }

// const PaymentPage = () => {
//   const { billId, memberId } = useParams<{ billId: string; memberId?: string }>();
//   const navigate = useNavigate();

//   const [payment, setPayment] = useState<PaymentData | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [confirmed, setConfirmed] = useState(false);
//   const [waitingClose, setWaitingClose] = useState(false);

//   const hasCreated = useRef(false);

//   // ✅ สร้าง QR ครั้งเดียว
//   useEffect(() => {
//     if (hasCreated.current) return;
//     hasCreated.current = true;

//     const createPayment = async () => {
//       try {
//         const res = await fetch(`/api/payments`, {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           credentials: "include",
//           body: JSON.stringify({
//             billId: Number(billId),
//             memberId: memberId ? Number(memberId) : null,
//           }),
//         });

//         const data = await res.json();
//         if (!res.ok) throw new Error(data.error || "Failed to create payment");

//         setPayment(data);
//       } catch (err) {
//         console.error("Error creating payment:", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     createPayment();
//   }, [billId, memberId]);

//   // 🔄 Poll สถานะการชำระเงิน
//   useEffect(() => {
//     if (!payment) return;

//     const interval = setInterval(async () => {
//       try {
//         const res = await fetch(
//           `/api/payments/status/${payment.billId}?memberId=${memberId || ""}`
//         );
//         const data = await res.json();

//         if (data.status === "PAID") {
//           setConfirmed(true);
//           clearInterval(interval);

//           // 🟩 กรณีเป็น Split Bill
//           if (memberId) {
//             setTimeout(() => {
//               navigate(`/splitbill/${payment.billId}`);
//             }, 1200);
//           }
//           // 🟦 กรณีเป็น Full Bill (ทั้งโต๊ะ)
//           else {
//             setWaitingClose(true);

//             // ✅ เริ่ม poll สถานะ session ว่าถูกปิดหรือยัง
//             const sessionInterval = setInterval(async () => {
//               try {
//                 const res2 = await fetch(`/api/dining_session/by-bill/${payment.billId}`);
//                 const sessionData = await res2.json();

//                 if (sessionData.status === "COMPLETED") {
//                   clearInterval(sessionInterval);
//                   alert("✅ Table has been closed by admin.");
//                   navigate(`/session/${sessionData.id}`);
//                 }
//               } catch (err) {
//                 console.error("Session polling failed:", err);
//               }
//             }, 3000);
//           }
//         }
//       } catch (err) {
//         console.error("Polling payment status failed:", err);
//       }
//     }, 3000);

//     return () => clearInterval(interval);
//   }, [payment]);

//   useEffect(() => {
//     if (!confirmed) return;

//     const handlePopState = (event: PopStateEvent) => {
//       event.preventDefault();
//       alert("You have already completed the payment.");
//       navigate("/", { replace: true });
//     };

//     window.addEventListener("popstate", handlePopState);
//     return () => window.removeEventListener("popstate", handlePopState);
//   }, [confirmed, navigate]);

//   if (loading) return <p className="text-center text-white mt-10">Loading...</p>;
//   if (!payment)
//     return <p className="text-center text-white mt-10">No payment data available.</p>;

//   return (
//     <div className="w-full min-h-screen relative bg-[#1E1E1E] text-white p-6 flex flex-col">
//       {/* Header */}
//       <div className="flex justify-between items-center mb-6">
//         <button
//           onClick={() => navigate(-1)}
//           disabled={confirmed} // ❌ ห้ามกดย้อนกลับหลังจ่ายแล้ว
//           className={`p-2 transition ${confirmed ? "opacity-30 cursor-not-allowed" : "hover:opacity-80"}`}
//         >
//           <img src={backIcon} alt="Back" className="w-5 h-5 md:w-6 md:h-6 object-contain" />
//         </button>
//         <h1 className="title1 text-2xl tracking-wider">ENSO</h1>
//         <div className="w-5 md:w-6" />
//       </div>

//       <h2 className="text-xl text-center mb-2">Payment</h2>
//       <p className="text-sm text-center text-gray-400 mb-6">
//         {memberId ? `For Member #${memberId}` : "Full Bill Payment"}
//       </p>

//       {/* Card */}
//       <div className="bg-white text-black rounded-2xl p-6 w-[90%] mx-auto shadow-lg text-center">
//         <div className="flex flex-col items-center">
//           <img src={logo} alt="ENSO" className="w-12 h-12 rounded-full mb-2" />
//           <h3 className="font-bold text-lg mb-3">THAI QR PAYMENT</h3>
//           <img
//             src={payment.qrCode}
//             alt="QR Code"
//             className="w-56 h-56 border rounded-md shadow-md"
//           />
//           <p className="mt-4 font-bold text-lg">
//             Total: {Number(payment.amount).toFixed(2)} ฿
//           </p>

//           {/* แสดงข้อความสถานะ */}
//           {confirmed ? (
//             waitingClose ? (
//               <>
//                 <p className="mt-4 text-green-600 font-semibold">
//                   ✅ Payment completed!
//                 </p>
//                 <p className="text-gray-400 text-sm mt-2">
//                   Waiting for admin to close the table...
//                 </p>
//               </>
//             ) : (
//               <>
//                 <p className="mt-4 text-green-600 font-semibold">
//                    Payment Received!
//                 </p>
//                 <p className="text-gray-400 text-sm mt-2">
//                   Redirecting to split bill...
//                 </p>
//               </>
//             )
//           ) : (
//             <p className="mt-4 text-gray-500 text-sm">
//               Waiting for payment confirmation...
//             </p>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default PaymentPage;


// import { useEffect, useState, useRef } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import backIcon from "../assets/imgs/back.png";
// import logo from "../assets/imgs/logo.png";

// interface PaymentData {
//   paymentId: number;
//   billId: number;
//   billSplitId?: number | null;
//   memberId?: number | null;
//   amount: string;
//   qrCode: string;
// }

// const PaymentPage = () => {
//   const { billId, memberId } = useParams<{ billId: string; memberId?: string }>();
//   const navigate = useNavigate();

//   const [payment, setPayment] = useState<PaymentData | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [confirmed, setConfirmed] = useState(false);
//   const [waitingClose, setWaitingClose] = useState(false);

//   const hasCreated = useRef(false);

// useEffect(() => {
//   const checkIfPaid = async () => {
//     try {
//       // เรียก endpoint ตรวจสถานะการจ่าย
//       const res = await fetch(`/api/payments/status/${billId}?memberId=${memberId || ""}`, {
//         credentials: "include",
//       });
//       const data = await res.json();

//       // ถ้าบิลนี้จ่ายแล้ว → ไม่ให้เข้าหน้าจ่ายอีก
//       if (data.status === "PAID") {
//         console.log("✅ Payment already completed:", data);

//         if (memberId) {
//           navigate(`/splitbill/${billId}`, { replace: true });
//         } else if (data.sessionId) {
//           navigate(`/session/${data.sessionId}`, { replace: true });
//         } else {
//           console.warn("⚠️ No sessionId in payment status response:", data);
//           alert("Payment completed, but no session linked. Please contact admin.");
//         }
//         return;
//       }
//     } catch (err) {
//       console.error("Error checking payment status:", err);
//     }
//   };

//   checkIfPaid();
// }, [billId, memberId, navigate]);

//   useEffect(() => {
//     if (hasCreated.current) return;
//     hasCreated.current = true;

//     const createPayment = async () => {
//       try {
//         const res = await fetch(`/api/payments`, {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           credentials: "include",
//           body: JSON.stringify({
//             billId: Number(billId),
//             memberId: memberId ? Number(memberId) : null,
//           }),
//         });

//         const data = await res.json();
//         if (!res.ok) throw new Error(data.error || "Failed to create payment");

//         setPayment(data);
//       } catch (err) {
//         console.error("Error creating payment:", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     createPayment();
//   }, [billId, memberId]);

//   // 🔄 Poll สถานะการชำระเงิน
//   useEffect(() => {
//     if (!payment) return;

//     const interval = setInterval(async () => {
//       try {
//         const res = await fetch(
//           `/api/payments/status/${payment.billId}?memberId=${memberId || ""}`
//         );
//         const data = await res.json();

//         if (data.status === "PAID") {
//           setConfirmed(true);
//           clearInterval(interval);

//           // 🟩 กรณีเป็น Split Bill
//           if (memberId) {
//             setTimeout(() => {
//               navigate(`/splitbill/${payment.billId}`);
//             }, 1200);
//           }
//           // 🟦 กรณีเป็น Full Bill (ทั้งโต๊ะ)
//           else {
//             setWaitingClose(true);

//             // ✅ เริ่ม poll สถานะ session ว่าถูกปิดหรือยัง
//             const sessionInterval = setInterval(async () => {
//               try {
//                 const res2 = await fetch(`/api/dining_session/by-bill/${payment.billId}`);
//                 const sessionData = await res2.json();

//                 if (sessionData.status === "COMPLETED") {
//                   clearInterval(sessionInterval);
//                   alert("✅ Table has been closed by admin.");
//                   navigate(`/session/${sessionData.id}`);
//                 }
//               } catch (err) {
//                 console.error("Session polling failed:", err);
//               }
//             }, 3000);
//           }
//         }
//       } catch (err) {
//         console.error("Polling payment status failed:", err);
//       }
//     }, 3000);

//     return () => clearInterval(interval);
//   }, [payment]);

//   useEffect(() => {
//     if (!confirmed) return;

//     const handlePopState = (event: PopStateEvent) => {
//       event.preventDefault();
//       alert("You have already completed the payment.");
//       navigate("/", { replace: true });
//     };

//     window.addEventListener("popstate", handlePopState);
//     return () => window.removeEventListener("popstate", handlePopState);
//   }, [confirmed, navigate]);

//   if (loading) return <p className="text-center text-white mt-10">Loading...</p>;
//   if (!payment)
//     return <p className="text-center text-white mt-10">No payment data available.</p>;

//   return (
//     <div className="w-full min-h-screen relative bg-[#1E1E1E] text-white p-6 flex flex-col">
//       {/* Header */}
//       <div className="flex justify-between items-center mb-6">
//         <button
//           onClick={() => navigate(-1)}
//           disabled={confirmed} // ❌ ห้ามกดย้อนกลับหลังจ่ายแล้ว
//           className={`p-2 transition ${confirmed ? "opacity-30 cursor-not-allowed" : "hover:opacity-80"}`}
//         >
//           <img src={backIcon} alt="Back" className="w-5 h-5 md:w-6 md:h-6 object-contain" />
//         </button>
//         <h1 className="title1 text-2xl tracking-wider">ENSO</h1>
//         <div className="w-5 md:w-6" />
//       </div>

//       <h2 className="text-xl text-center mb-2">Payment</h2>
//       <p className="text-sm text-center text-gray-400 mb-6">
//         {memberId ? `For Member #${memberId}` : "Full Bill Payment"}
//       </p>

//       {/* Card */}
//       <div className="bg-white text-black rounded-2xl p-6 w-[90%] mx-auto shadow-lg text-center">
//         <div className="flex flex-col items-center">
//           <img src={logo} alt="ENSO" className="w-12 h-12 rounded-full mb-2" />
//           <h3 className="font-bold text-lg mb-3">THAI QR PAYMENT</h3>
//           <img
//             src={payment.qrCode}
//             alt="QR Code"
//             className="w-56 h-56 border rounded-md shadow-md"
//           />
//           <p className="mt-4 font-bold text-lg">
//             Total: {Number(payment.amount).toFixed(2)} ฿
//           </p>

//           {/* แสดงข้อความสถานะ */}
//           {confirmed ? (
//             waitingClose ? (
//               <>
//                 <p className="mt-4 text-green-600 font-semibold">
//                   ✅ Payment completed!
//                 </p>
//                 <p className="text-gray-400 text-sm mt-2">
//                   Waiting for admin to close the table...
//                 </p>
//               </>
//             ) : (
//               <>
//                 <p className="mt-4 text-green-600 font-semibold">
//                    Payment Received!
//                 </p>
//                 <p className="text-gray-400 text-sm mt-2">
//                   Redirecting to split bill...
//                 </p>
//               </>
//             )
//           ) : (
//             <p className="mt-4 text-gray-500 text-sm">
//               Waiting for payment confirmation...
//             </p>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default PaymentPage;

// import { useEffect, useState, useRef } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import backIcon from "../assets/imgs/back.png";
// import logo from "../assets/imgs/logo.png";

// interface PaymentData {
//   paymentId: number;
//   billId: number;
//   billSplitId?: number | null;
//   memberId?: number | null;
//   amount: string;
//   qrCode: string;
// }

// const PaymentPage = () => {
//   const { billId, memberId } = useParams<{ billId: string; memberId?: string }>();
//   const navigate = useNavigate();

//   const [payment, setPayment] = useState<PaymentData | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [confirmed, setConfirmed] = useState(false);
//   const [waitingClose, setWaitingClose] = useState(false);

//   const hasCreated = useRef(false);

//   // ✅ สร้าง QR ครั้งเดียว
// useEffect(() => {
//   if (hasCreated.current) return;
//   hasCreated.current = true;

//   const initPayment = async () => {
//     try {
//       // 🔍 1. ตรวจสอบว่ามี payment เดิมหรือยัง
//       const checkRes = await fetch(
//         `/api/payments/status/${billId}?memberId=${memberId || ""}`,
//         { credentials: "include" }
//       );
//       const existing = await checkRes.json();

//       // ถ้ามีอยู่แล้วและจ่ายสำเร็จ → ไม่ต้องสร้างใหม่
//       if (existing?.status === "PAID") {
//         setPayment(existing);
//         setConfirmed(true);
//         setWaitingClose(true);
//         setLoading(false);
//         return;
//       }

//       // 🔧 2. ถ้ายังไม่มีหรือยังไม่จ่าย → สร้าง QR ใหม่
//       const res = await fetch(`/api/payments`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         credentials: "include",
//         body: JSON.stringify({
//           billId: Number(billId),
//           memberId: memberId ? Number(memberId) : null,
//         }),
//       });

//       const data = await res.json();
//       if (!res.ok) throw new Error(data.error || "Failed to create payment");

//       setPayment(data);
//     } catch (err) {
//       console.error("Error creating or fetching payment:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   initPayment();
// }, [billId, memberId]);

//   // 🔄 Poll สถานะการชำระเงิน
//   useEffect(() => {
//     if (!payment) return;

//     const interval = setInterval(async () => {
//       try {
//         const res = await fetch(
//           `/api/payments/status/${payment.billId}?memberId=${memberId || ""}`
//         );
//         const data = await res.json();

//         if (data.status === "PAID") {
//           setConfirmed(true);
//           clearInterval(interval);

//           // 🟩 กรณีเป็น Split Bill
//           if (memberId) {
//             setTimeout(() => {
//               navigate(`/splitbill/${payment.billId}`);
//             }, 1200);
//           }
//           // 🟦 กรณีเป็น Full Bill (ทั้งโต๊ะ)
//           else {
//             // ✅ เปลี่ยนเป็นแค่โชว์ปุ่ม View Summary แทน navigate อัตโนมัติ
//             setWaitingClose(true);
//           }
//         }
//       } catch (err) {
//         console.error("Polling payment status failed:", err);
//       }
//     }, 3000);

//     return () => clearInterval(interval);
//   }, [payment, memberId, navigate]);

//   useEffect(() => {
//     if (!confirmed) return;

//     const handlePopState = (event: PopStateEvent) => {
//       event.preventDefault();
//       alert("You have already completed the payment.");
//       navigate("/", { replace: true });
//     };

//     window.addEventListener("popstate", handlePopState);
//     return () => window.removeEventListener("popstate", handlePopState);
//   }, [confirmed, navigate]);

//   if (loading)
//     return <p className="text-center text-white mt-10">Loading...</p>;
//   if (!payment)
//     return <p className="text-center text-white mt-10">No payment data available.</p>;

//   return (
//     <div className="w-full min-h-screen relative bg-[#1E1E1E] text-white p-6 flex flex-col">
//       {/* Header */}
//       <div className="flex justify-between items-center mb-6">
//         <button
//           onClick={() => navigate(-1)}
//           disabled={confirmed}
//           className={`p-2 transition ${
//             confirmed ? "opacity-30 cursor-not-allowed" : "hover:opacity-80"
//           }`}
//         >
//           <img src={backIcon} alt="Back" className="w-5 h-5 md:w-6 md:h-6 object-contain" />
//         </button>
//         <h1 className="title1 text-2xl tracking-wider">ENSO</h1>
//         <div className="w-5 md:w-6" />
//       </div>

//       <h2 className="text-xl text-center mb-2">Payment</h2>
//       <p className="text-sm text-center text-gray-400 mb-6">
//         {memberId ? `For Member #${memberId}` : "Full Bill Payment"}
//       </p>

//       {/* Card */}
//       <div className="bg-white text-black rounded-2xl p-6 w-[90%] mx-auto shadow-lg text-center">
//         <div className="flex flex-col items-center">
//           <img src={logo} alt="ENSO" className="w-12 h-12 rounded-full mb-2" />
//           <h3 className="font-bold text-lg mb-3">THAI QR PAYMENT</h3>
//           <img
//             src={payment.qrCode}
//             alt="QR Code"
//             className="w-56 h-56 border rounded-md shadow-md"
//           />
//           <p className="mt-4 font-bold text-lg">
//             Total: {Number(payment.amount).toFixed(2)} ฿
//           </p>

//           {/* แสดงข้อความสถานะ */}
//           {confirmed ? (
//             waitingClose ? (
//               <>
//                 <p className="mt-4 text-green-600 font-semibold">
//                   ✅ Payment completed!
//                 </p>
//                 <p className="text-gray-400 text-sm mt-2">
//                   Payment for the entire table has been received.
//                 </p>
//               </>
//             ) : (
//               <>
//                 <p className="mt-4 text-green-600 font-semibold">
//                   Payment Received!
//                 </p>
//                 <p className="text-gray-400 text-sm mt-2">
//                   Redirecting to split bill...
//                 </p>
//               </>
//             )
//           ) : (
//             <p className="mt-4 text-gray-500 text-sm">
//               Waiting for payment confirmation...
//             </p>
//           )}
//         </div>
//       </div>

//       {/* ✅ ปุ่ม View Summary สำหรับ Full Bill */}
//       {confirmed && waitingClose && (
//         <div className="mt-8 flex justify-center">
//           <button
//             onClick={() => {
//               // ไปหน้า session โดยใช้ billId แทน sessionId
//               navigate(`/session/${billId}`);
//             }}
//             className="w-[250px] h-12 rounded-full font-semibold text-lg
//                       bg-gradient-to-r from-white to-black text-black
//                       shadow-[0px_4px_18px_0px_rgba(217,217,217,1.00)]
//                       hover:opacity-90 transition"
//           >
//             View Summary
//           </button>
//         </div>
//       )}
//     </div>
//   );
// };

// export default PaymentPage;


// import { useEffect, useState, useRef } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import backIcon from "../assets/imgs/back.png";
// import logo from "../assets/imgs/logo.png";

// interface PaymentData {
//   paymentId: number;
//   billId: number;
//   billSplitId?: number | null;
//   memberId?: number | null;
//   amount: string;
//   qrCode: string;
//   status?: string;
// }

// const PaymentPage = () => {
//   const { billId, memberId } = useParams<{ billId: string; memberId?: string }>();
//   const navigate = useNavigate();

//   const [payment, setPayment] = useState<PaymentData | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [confirmed, setConfirmed] = useState(false);
//   const [waitingClose, setWaitingClose] = useState(false);
//   const hasCreated = useRef(false);

//   /** ✅ โหลดข้อมูลจาก localStorage ก่อน (กันหายหลังรีหน้า) */
//   useEffect(() => {
//     const saved = localStorage.getItem(`enso_payment_${billId}_${memberId || "full"}`);
//     if (saved) {
//       const parsed = JSON.parse(saved);
//       setPayment(parsed);
//       if (parsed.status === "PAID") {
//         setConfirmed(true);
//         setWaitingClose(true);
//       }
//     }
//   }, [billId, memberId]);

//   /** ✅ โหลดข้อมูลการชำระเงิน */
//   useEffect(() => {
//     if (hasCreated.current) return;
//     hasCreated.current = true;

//     const initPayment = async () => {
//       try {
//         const checkRes = await fetch(
//           `/api/payments/status/${billId}?memberId=${memberId || ""}`,
//           { credentials: "include" }
//         );
//         const existing = await checkRes.json();

//         // 🟢 ถ้ามีอยู่แล้วและจ่ายแล้ว
//         if (existing?.status === "PAID") {
//           const savedData = {
//             paymentId: existing.paymentId,
//             billId: Number(billId),
//             memberId: memberId ? Number(memberId) : null,
//             qrCode: existing.qrCode || "",
//             amount: existing.amount || "0",
//             status: "PAID",
//           };
          
//           setPayment(savedData);
//           setConfirmed(true);
//           setWaitingClose(true);
//           localStorage.setItem(
//             `enso_payment_${billId}_${memberId || "full"}`,
//             JSON.stringify(savedData)
//           );
//           setLoading(false);
//           return;
//         }

//         // 🟡 ถ้ายังไม่จ่ายแต่มี QR เดิม
//         if (existing?.qrCode) {
//           setPayment(existing);
//           localStorage.setItem(
//             `enso_payment_${billId}_${memberId || "full"}`,
//             JSON.stringify(existing)
//           );
//           setLoading(false);
//           return;
//         }

//         // 🔵 ถ้ายังไม่มี → สร้างใหม่
//         const res = await fetch(`/api/payments`, {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           credentials: "include",
//           body: JSON.stringify({
//             billId: Number(billId),
//             memberId: memberId ? Number(memberId) : null,
//           }),
//         });
//         const data = await res.json();
//         if (!res.ok) throw new Error(data.error || "Failed to create payment");

//         setPayment(data);
//         localStorage.setItem(
//           `enso_payment_${billId}_${memberId || "full"}`,
//           JSON.stringify(data)
//         );
//       } catch (err) {
//         console.error("Error fetching or creating payment:", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     initPayment();
//   }, [billId, memberId]);

//   /** 🔄 Poll สถานะระหว่างยังไม่จ่าย */
//   useEffect(() => {
//     if (!payment || confirmed) return;
//     const interval = setInterval(async () => {
//       try {
//         const res = await fetch(
//           `/api/payments/status/${payment.billId}?memberId=${memberId || ""}`
//         );
//         const data = await res.json();

//         if (data.status === "PAID") {
//           clearInterval(interval);
//           setConfirmed(true);
//           setWaitingClose(true);

//           const updated = { ...payment, status: "PAID" };
//           setPayment(updated);
//           localStorage.setItem(
//             `enso_payment_${billId}_${memberId || "full"}`,
//             JSON.stringify(updated)
//           );
//         }
//       } catch (err) {
//         console.error("Polling failed:", err);
//       }
//     }, 3000);
//     return () => clearInterval(interval);
//   }, [payment, confirmed, billId, memberId]);

//   /** 🚫 ป้องกันย้อนกลับหลังจ่ายแล้ว */
//   useEffect(() => {
//     if (!confirmed) return;
//     const handlePopState = (event: PopStateEvent) => {
//       event.preventDefault();
//       alert("You have already completed the payment.");
//       navigate("/", { replace: true });
//     };
//     window.addEventListener("popstate", handlePopState);
//     return () => window.removeEventListener("popstate", handlePopState);
//   }, [confirmed, navigate]);

//   /** 🧹 ลบข้อมูลหลังจากปิด session (option ถ้าต้องการ) */
//   // useEffect(() => {
//   //   return () => {
//   //     if (confirmed) {
//   //       localStorage.removeItem(`enso_payment_${billId}_${memberId || "full"}`);
//   //     }
//   //   };
//   // }, [confirmed]);

//   if (loading)
//     return <p className="text-center text-white mt-10">Loading...</p>;
//   if (!payment)
//     return <p className="text-center text-white mt-10">No payment data available.</p>;

//   return (
//     <div className="w-full min-h-screen bg-[#1E1E1E] text-white p-6 flex flex-col">
//       {/* Header */}
//       <div className="flex justify-between items-center mb-6">
//         <button
//           onClick={() => navigate(-1)}
//           disabled={confirmed}
//           className={`p-2 transition ${
//             confirmed ? "opacity-30 cursor-not-allowed" : "hover:opacity-80"
//           }`}
//         >
//           <img src={backIcon} alt="Back" className="w-5 h-5" />
//         </button>
//         <h1 className="title1 text-2xl">ENSO</h1>
//         <div className="w-5" />
//       </div>

//       <h2 className="text-xl text-center mb-2">Payment</h2>
//       <p className="text-sm text-center text-gray-400 mb-6">
//         {memberId ? `For Member #${memberId}` : "Full Bill Payment"}
//       </p>

//       {/* Card */}
//       <div className="bg-white text-black rounded-2xl p-6 w-[90%] mx-auto shadow-lg text-center">
//         <img src={logo} alt="ENSO" className="w-12 h-12 rounded-full mx-auto mb-2" />
//         <h3 className="font-bold text-lg mb-3">THAI QR PAYMENT</h3>
//         <img
//           src={payment.qrCode}
//           alt="QR Code"
//           className="w-56 h-56 mx-auto border rounded-md shadow-md"
//         />
//         <p className="mt-4 font-bold text-lg">
//           Total: {Number(payment.amount).toFixed(2)} ฿
//         </p>

//         {confirmed ? (
//           <>
//             <p className="mt-4 text-green-600 font-semibold">✅ Payment completed!</p>
//             <p className="text-gray-400 text-sm mt-2">
//               Payment for the entire table has been received.
//             </p>
//           </>
//         ) : (
//           <p className="mt-4 text-gray-500 text-sm">
//             Waiting for payment confirmation...
//           </p>
//         )}
//       </div>

//       {/* ✅ ปุ่ม View Summary */}
//       {confirmed && waitingClose && (
//         <div className="mt-8 flex justify-center">
//           <button
//             onClick={() => navigate(`/session/${billId}`)}
//             className="w-[250px] h-12 rounded-full font-semibold text-lg
//                        bg-gradient-to-r from-white to-black text-black
//                        shadow-[0_4px_18px_rgba(217,217,217,1)]
//                        hover:opacity-90 transition"
//           >
//             View Summary
//           </button>
//         </div>
//       )}
//     </div>
//   );
// };

// export default PaymentPage;


// import { useEffect, useState, useRef } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import backIcon from "../assets/imgs/back.png";
// import logo from "../assets/imgs/logo.png";

// interface PaymentData {
//   paymentId: number;
//   billId: number;
//   billSplitId?: number | null;
//   memberId?: number | null;
//   amount: string;
//   qrCode: string;
//   status?: string;
//   sessionId?: number | null;
// }

// const PaymentPage = () => {
//   const { billId, memberId } = useParams<{ billId: string; memberId?: string }>();
//   const navigate = useNavigate();

//   const [payment, setPayment] = useState<PaymentData | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [confirmed, setConfirmed] = useState(false);
//   const [waitingClose, setWaitingClose] = useState(false);
//   const hasCreated = useRef(false);

//   /** ✅ โหลดข้อมูลจาก localStorage ก่อน (กันหายหลังรีหน้า) */
//   useEffect(() => {
//     const saved = localStorage.getItem(`enso_payment_${billId}_${memberId || "full"}`);
//     if (saved) {
//       const parsed = JSON.parse(saved);
//       setPayment(parsed);
//       if (parsed.status === "PAID") {
//         setConfirmed(true);
//         setWaitingClose(true);
//       }
//     }
//   }, [billId, memberId]);

//   /** ✅ โหลดข้อมูลการชำระเงิน */
//   useEffect(() => {
//     if (hasCreated.current) return;
//     hasCreated.current = true;

//     const initPayment = async () => {
//       try {
//         const checkRes = await fetch(
//           `/api/payments/status/${billId}?memberId=${memberId || ""}`,
//           { credentials: "include" }
//         );
//         const existing = await checkRes.json();

//         // 🟢 ถ้ามีอยู่แล้วและจ่ายแล้ว
//         if (existing?.status === "PAID") {
//           const savedData = {
//             paymentId: existing.paymentId,
//             billId: Number(billId),
//             billSplitId: existing.billSplitId || null,
//             memberId: memberId ? Number(memberId) : null,
//             qrCode: existing.qrCode || "",
//             amount: existing.amount || "0",
//             status: "PAID",
//             sessionId: existing.sessionId || null,
//           };
//           setPayment(savedData);
//           setConfirmed(true);
//           setWaitingClose(true);
//           localStorage.setItem(
//             `enso_payment_${billId}_${memberId || "full"}`,
//             JSON.stringify(savedData)
//           );
//           setLoading(false);
//           return;
//         }

//         // 🟡 ถ้ายังไม่จ่ายแต่มี QR เดิม
//         if (existing?.qrCode) {
//           setPayment(existing);
//           localStorage.setItem(
//             `enso_payment_${billId}_${memberId || "full"}`,
//             JSON.stringify(existing)
//           );
//           setLoading(false);
//           return;
//         }

//         // 🔵 ถ้ายังไม่มี → สร้างใหม่
//         const res = await fetch(`/api/payments`, {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           credentials: "include",
//           body: JSON.stringify({
//             billId: Number(billId),
//             memberId: memberId ? Number(memberId) : null,
//           }),
//         });
//         const data = await res.json();
//         if (!res.ok) throw new Error(data.error || "Failed to create payment");

//         setPayment(data);
//         localStorage.setItem(
//           `enso_payment_${billId}_${memberId || "full"}`,
//           JSON.stringify(data)
//         );
//       } catch (err) {
//         console.error("Error fetching or creating payment:", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     initPayment();
//   }, [billId, memberId]);

//   /** 🔄 Poll สถานะระหว่างยังไม่จ่าย */
//   useEffect(() => {
//     if (!payment || confirmed) return;
//     const interval = setInterval(async () => {
//       try {
//         const res = await fetch(
//           `/api/payments/status/${payment.billId}?memberId=${memberId || ""}`
//         );
//         const data = await res.json();

//         if (data.status === "PAID") {
//           clearInterval(interval);
//           setConfirmed(true);
//           setWaitingClose(true);

//           const updated = { ...payment, status: "PAID" };
//           setPayment(updated);
//           localStorage.setItem(
//             `enso_payment_${billId}_${memberId || "full"}`,
//             JSON.stringify(updated)
//           );
//         }
//       } catch (err) {
//         console.error("Polling failed:", err);
//       }
//     }, 3000);
//     return () => clearInterval(interval);
//   }, [payment, confirmed, billId, memberId]);

//   /** 🚫 ป้องกันย้อนกลับหลังจ่ายแล้ว */
//   useEffect(() => {
//     if (!confirmed) return;
//     const handlePopState = (event: PopStateEvent) => {
//       event.preventDefault();
//       alert("You have already completed the payment.");
//       navigate("/", { replace: true });
//     };
//     window.addEventListener("popstate", handlePopState);
//     return () => window.removeEventListener("popstate", handlePopState);
//   }, [confirmed, navigate]);


//   if (loading)
//     return <p className="text-center text-white mt-10">Loading...</p>;
//   if (!payment)
//     return <p className="text-center text-white mt-10">No payment data available.</p>;

//   return (
//     <div className="w-full min-h-screen bg-[#1E1E1E] text-white p-6 flex flex-col">
//       {/* Header */}
//       <div className="flex justify-between items-center mb-6">
//         <button
//           onClick={() => navigate(-1)}
//           disabled={confirmed}
//           className={`p-2 transition ${
//             confirmed ? "opacity-30 cursor-not-allowed" : "hover:opacity-80"
//           }`}
//         >
//           <img src={backIcon} alt="Back" className="w-5 h-5" />
//         </button>
//         <h1 className="title1 text-2xl">ENSO</h1>
//         <div className="w-5" />
//       </div>

//       <h2 className="text-xl text-center mb-2">Payment</h2>
//       <p className="text-sm text-center text-gray-400 mb-6">
//         {memberId ? `For Member #${memberId}` : "Full Bill Payment"}
//       </p>

//       {/* Card */}
//       <div className="bg-white text-black rounded-2xl p-6 w-[90%] mx-auto shadow-lg text-center">
//         <img src={logo} alt="ENSO" className="w-12 h-12 rounded-full mx-auto mb-2" />
//         <h3 className="font-bold text-lg mb-3">THAI QR PAYMENT</h3>
//         <img
//           src={payment.qrCode}
//           alt="QR Code"
//           className="w-56 h-56 mx-auto border rounded-md shadow-md"
//         />
//         <p className="mt-4 font-bold text-lg">
//           Total: {Number(payment.amount).toFixed(2)} ฿
//         </p>

//         {confirmed ? (
//           <>
//             <p className="mt-4 text-green-600 font-semibold">✅ Payment completed!</p>
//             <p className="text-gray-400 text-sm mt-2">
//               Payment for the entire table has been received.
//             </p>
//           </>
//         ) : (
//           <p className="mt-4 text-gray-500 text-sm">
//             Waiting for payment confirmation...
//           </p>
//         )}
//       </div>

//       {/* ✅ ปุ่ม View Summary */}
//       {confirmed && waitingClose && (
//         <div className="mt-8 flex justify-center">
//           <button
//             onClick={() => navigate(`/session/${payment.sessionId}`)}
//             className="w-[250px] h-12 rounded-full font-semibold text-lg
//                        bg-gradient-to-r from-white to-black text-black
//                        shadow-[0_4px_18px_rgba(217,217,217,1)]
//                        hover:opacity-90 transition"
//           >
//             View Summary
//           </button>
//         </div>
//       )}
//     </div>
//   );
// };

// export default PaymentPage;


// import { useEffect, useState, useRef } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import backIcon from "../assets/imgs/back.png";
// import logo from "../assets/imgs/logo.png";

// interface PaymentData {
//   paymentId: number;
//   billId: number;
//   billSplitId?: number | null;
//   memberId?: number | null;
//   amount: string;
//   qrCode: string;
//   status?: string;
//   sessionId?: number | null;
// }

// const PaymentPage = () => {
//   const { billId, memberId } = useParams<{ billId: string; memberId?: string }>();
//   const navigate = useNavigate();

//   const [payment, setPayment] = useState<PaymentData | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [confirmed, setConfirmed] = useState(false);
//   const [waitingClose, setWaitingClose] = useState(false);
//   const hasCreated = useRef(false);

//   /** ✅ โหลดข้อมูลจาก localStorage ก่อน (กันหายหลังรีหน้า) */
//   useEffect(() => {
//     const saved = localStorage.getItem(`enso_payment_${billId}_${memberId || "full"}`);
//     if (saved) {
//       const parsed = JSON.parse(saved);
//       setPayment(parsed);
//       if (parsed.status === "PAID") {
//         setConfirmed(true);
//         setWaitingClose(true);
//       }
//     }
//   }, [billId, memberId]);

//   /** ✅ โหลดข้อมูลการชำระเงิน */
//   useEffect(() => {
//     if (hasCreated.current) return;
//     hasCreated.current = true;

//     const initPayment = async () => {
//       try {
//         const checkRes = await fetch(
//           `/api/payments/status/${billId}?memberId=${memberId || ""}`,
//           { credentials: "include" }
//         );
//         const existing = await checkRes.json();

//         console.log("💬 existing payment:", existing);

//         // 🟢 ถ้ามีอยู่แล้วและจ่ายแล้ว
//         if (existing?.status === "PAID") {
//           const savedData = {
//             paymentId: existing.paymentId,
//             billId: Number(billId),
//             billSplitId: existing.billSplitId || null,
//             memberId: memberId ? Number(memberId) : null,
//             qrCode: existing.qrCode || "",
//             amount: existing.amount || "0",
//             status: "PAID",
//             sessionId: existing.sessionId || null,
//           };
//           setPayment(savedData);
//           setConfirmed(true);
//           setWaitingClose(true);
//           localStorage.setItem(
//             `enso_payment_${billId}_${memberId || "full"}`,
//             JSON.stringify(savedData)
//           );
//           setLoading(false);
//           return;
//         }

//         // 🟡 ถ้ามี payment แล้วแต่ยังไม่จ่าย
//         if (existing?.status === "PENDING") {
//           // ✅ ถ้าไม่มี qrCode ให้สร้างใหม่
//           if (!existing.qrCode) {
//             console.log("⚠️ No QR found, creating new QR...");
//             const res = await fetch(`/api/payments`, {
//               method: "POST",
//               headers: { "Content-Type": "application/json" },
//               credentials: "include",
//               body: JSON.stringify({
//                 billId: Number(billId),
//                 memberId: memberId ? Number(memberId) : null,
//               }),
//             });
//             const data = await res.json();
//             if (!res.ok) throw new Error(data.error || "Failed to create payment");

//             setPayment(data);
//             localStorage.setItem(
//               `enso_payment_${billId}_${memberId || "full"}`,
//               JSON.stringify(data)
//             );
//             setLoading(false);
//             return;
//           }

//           // ✅ ถ้ามี qrCode แล้วก็ใช้ของเดิม
//           const pendingData = {
//             paymentId: existing.paymentId,
//             billId: Number(billId),
//             billSplitId: existing.billSplitId || null,
//             memberId: memberId ? Number(memberId) : null,
//             qrCode: existing.qrCode || "",
//             amount: existing.amount || "0",
//             status: "PENDING",
//             sessionId: existing.sessionId || null,
//           };
//           setPayment(pendingData);
//           localStorage.setItem(
//             `enso_payment_${billId}_${memberId || "full"}`,
//             JSON.stringify(pendingData)
//           );
//           setLoading(false);
//           return;
//         }

//         // 🔵 ถ้ายังไม่มีเลย → สร้างใหม่
//         const res = await fetch(`/api/payments`, {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           credentials: "include",
//           body: JSON.stringify({
//             billId: Number(billId),
//             memberId: memberId ? Number(memberId) : null,
//           }),
//         });
//         const data = await res.json();
//         if (!res.ok) throw new Error(data.error || "Failed to create payment");

//         setPayment(data);
//         localStorage.setItem(
//           `enso_payment_${billId}_${memberId || "full"}`,
//           JSON.stringify(data)
//         );
//       } catch (err) {
//         console.error("Error fetching or creating payment:", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     initPayment();
//   }, [billId, memberId]);

//   /** 🔄 Poll สถานะระหว่างยังไม่จ่าย */
//   useEffect(() => {
//     if (!payment || confirmed) return;
//     const interval = setInterval(async () => {
//       try {
//         const res = await fetch(
//           `/api/payments/status/${payment.billId}?memberId=${memberId || ""}`,
//           { credentials: "include" }
//         );
//         const data = await res.json();
//         console.log("🔁 Polling status:", data.status);

//         if (data.status === "PAID") {
//           clearInterval(interval);
//           setConfirmed(true);
//           setWaitingClose(true);

//           const updated = { ...payment, status: "PAID" };
//           setPayment(updated);
//           localStorage.setItem(
//             `enso_payment_${billId}_${memberId || "full"}`,
//             JSON.stringify(updated)
//           );
//         }
//       } catch (err) {
//         console.error("Polling failed:", err);
//       }
//     }, 3000);

//     return () => clearInterval(interval);
//   }, [payment, confirmed, billId, memberId]);

//   /** 🚫 ป้องกันย้อนกลับหลังจ่ายแล้ว */
//   useEffect(() => {
//     if (!confirmed) return;
//     const handlePopState = (event: PopStateEvent) => {
//       event.preventDefault();
//       alert("You have already completed the payment.");
//       navigate("/", { replace: true });
//     };
//     window.addEventListener("popstate", handlePopState);
//     return () => window.removeEventListener("popstate", handlePopState);
//   }, [confirmed, navigate]);

//   if (loading)
//     return <p className="text-center text-white mt-10">Loading...</p>;
//   if (!payment)
//     return <p className="text-center text-white mt-10">No payment data available.</p>;

//   return (
//     <div className="w-full min-h-screen bg-[#1E1E1E] text-white p-6 flex flex-col">
//       {/* Header */}
//       <div className="flex justify-between items-center mb-6">
//         <button
//           onClick={() => navigate(-1)}
//           disabled={confirmed}
//           className={`p-2 transition ${
//             confirmed ? "opacity-30 cursor-not-allowed" : "hover:opacity-80"
//           }`}
//         >
//           <img src={backIcon} alt="Back" className="w-5 h-5" />
//         </button>
//         <h1 className="title1 text-2xl">ENSO</h1>
//         <div className="w-5" />
//       </div>

//       <h2 className="text-xl text-center mb-2">Payment</h2>
//       <p className="text-sm text-center text-gray-400 mb-6">
//         {memberId ? `For Member #${memberId}` : "Full Bill Payment"}
//       </p>

//       {/* Card */}
//       <div className="bg-white text-black rounded-2xl p-6 w-[90%] mx-auto shadow-lg text-center">
//         <img src={logo} alt="ENSO" className="w-12 h-12 rounded-full mx-auto mb-2" />
//         <h3 className="font-bold text-lg mb-3">THAI QR PAYMENT</h3>
//         <img
//           src={payment.qrCode}
//           alt="QR Code"
//           className="w-56 h-56 mx-auto border rounded-md shadow-md"
//         />
//         <p className="mt-4 font-bold text-lg">
//           Total: {Number(payment.amount).toFixed(2)} ฿
//         </p>

//         {confirmed ? (
//           <>
//             <p className="mt-4 text-green-600 font-semibold">✅ Payment completed!</p>
//             <p className="text-gray-400 text-sm mt-2">
//               Payment for the entire table has been received.
//             </p>
//           </>
//         ) : (
//           <p className="mt-4 text-gray-500 text-sm">
//             Waiting for payment confirmation...
//           </p>
//         )}
//       </div>

//       {/* ✅ ปุ่ม View Summary */}
//       {confirmed && waitingClose && (
//         <div className="mt-8 flex justify-center">
//           <button
//             onClick={() => navigate(`/session/${payment.sessionId}`)}
//             className="w-[250px] h-12 rounded-full font-semibold text-lg
//                        bg-gradient-to-r from-white to-black text-black
//                        shadow-[0_4px_18px_rgba(217,217,217,1)]
//                        hover:opacity-90 transition"
//           >
//             View Summary
//           </button>
//         </div>
//       )}
//     </div>
//   );
// };

// export default PaymentPage;

