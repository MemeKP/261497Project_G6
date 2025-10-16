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