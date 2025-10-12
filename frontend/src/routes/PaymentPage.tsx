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
}

const PaymentPage = () => {
  const { billId, memberId } = useParams<{ billId: string; memberId?: string }>();
  const navigate = useNavigate();

  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [waitingClose, setWaitingClose] = useState(false);

  const hasCreated = useRef(false);

  // ✅ สร้าง QR ครั้งเดียว
  useEffect(() => {
    if (hasCreated.current) return;
    hasCreated.current = true;

    const createPayment = async () => {
      try {
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

        setPayment(data);
      } catch (err) {
        console.error("Error creating payment:", err);
      } finally {
        setLoading(false);
      }
    };

    createPayment();
  }, [billId, memberId]);

  // 🔄 Poll สถานะการชำระเงิน
  useEffect(() => {
    if (!payment) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/payments/status/${payment.billId}?memberId=${memberId || ""}`
        );
        const data = await res.json();

        if (data.status === "PAID") {
          setConfirmed(true);
          clearInterval(interval);

          // 🟩 กรณีเป็น Split Bill
          if (memberId) {
            setTimeout(() => {
              navigate(`/splitbill/${payment.billId}`);
            }, 1200);
          }
          // 🟦 กรณีเป็น Full Bill (ทั้งโต๊ะ)
          else {
            setWaitingClose(true);

            // ✅ เริ่ม poll สถานะ session ว่าถูกปิดหรือยัง
            const sessionInterval = setInterval(async () => {
              try {
                const res2 = await fetch(`/api/dining_session/by-bill/${payment.billId}`);
                const sessionData = await res2.json();

                if (sessionData.status === "COMPLETED") {
                  clearInterval(sessionInterval);
                  alert("✅ Table has been closed by admin.");
                  navigate(`/session/${sessionData.id}`);
                }
              } catch (err) {
                console.error("Session polling failed:", err);
              }
            }, 3000);
          }
        }
      } catch (err) {
        console.error("Polling payment status failed:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [payment]);

  // 🚫 ป้องกันการย้อนกลับหลังจากจ่ายเงิน
  useEffect(() => {
    if (!confirmed) return;

    const handlePopState = (event: PopStateEvent) => {
      event.preventDefault();
      alert("You have already completed the payment.");
      navigate("/", { replace: true });
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [confirmed, navigate]);

  if (loading) return <p className="text-center text-white mt-10">Loading...</p>;
  if (!payment)
    return <p className="text-center text-white mt-10">No payment data available.</p>;

  return (
    <div className="w-full min-h-screen relative bg-[#1E1E1E] text-white p-6 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          disabled={confirmed} // ❌ ห้ามกดย้อนกลับหลังจ่ายแล้ว
          className={`p-2 transition ${confirmed ? "opacity-30 cursor-not-allowed" : "hover:opacity-80"}`}
        >
          <img src={backIcon} alt="Back" className="w-5 h-5 md:w-6 md:h-6 object-contain" />
        </button>
        <h1 className="title1 text-2xl tracking-wider">ENSO</h1>
        <div className="w-5 md:w-6" />
      </div>

      <h2 className="text-xl text-center mb-2">Payment</h2>
      <p className="text-sm text-center text-gray-400 mb-6">
        {memberId ? `For Member #${memberId}` : "Full Bill Payment"}
      </p>

      {/* Card */}
      <div className="bg-white text-black rounded-2xl p-6 w-[90%] mx-auto shadow-lg text-center">
        <div className="flex flex-col items-center">
          <img src={logo} alt="ENSO" className="w-12 h-12 rounded-full mb-2" />
          <h3 className="font-bold text-lg mb-3">THAI QR PAYMENT</h3>
          <img
            src={payment.qrCode}
            alt="QR Code"
            className="w-56 h-56 border rounded-md shadow-md"
          />
          <p className="mt-4 font-bold text-lg">
            Total: {Number(payment.amount).toFixed(2)} ฿
          </p>

          {/* แสดงข้อความสถานะ */}
          {confirmed ? (
            waitingClose ? (
              <>
                <p className="mt-4 text-green-600 font-semibold">
                  ✅ Payment completed!
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  Waiting for admin to close the table...
                </p>
              </>
            ) : (
              <>
                <p className="mt-4 text-green-600 font-semibold">
                   Payment Received!
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  Redirecting to split bill...
                </p>
              </>
            )
          ) : (
            <p className="mt-4 text-gray-500 text-sm">
              Waiting for payment confirmation...
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
