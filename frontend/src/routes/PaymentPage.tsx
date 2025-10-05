import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import backIcon from "../assets/imgs/back.png";
import logo from "../assets/imgs/logo.png";

interface PaymentData {
  paymentId: number;
  billId: number;
  billSplitId?: number | null;
  memberId?: number | null;
  amount: string;
  qrCode: string; // ✅ ใช้ field นี้ตรงกับ backend
}

const PaymentPage = () => {
  const { billId, memberId } = useParams<{ billId: string; memberId?: string }>();
  const navigate = useNavigate();

  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
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

  useEffect(() => {
    if (!payment) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/status/${payment.billId}?memberId=${memberId || ""}`);
        const data = await res.json();
        if (data.status === "PAID") {
          clearInterval(interval);
          setConfirmed(true);
        }
      } catch (err) {
        console.error("Polling payment status failed:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [payment]);

  if (loading) return <p className="text-white text-center mt-10">Loading...</p>;
  if (!payment) return <p className="text-white text-center mt-10">No payment data available.</p>;

  return (
    <div className="w-full min-h-screen bg-[#1E1E1E] text-white flex flex-col items-center p-6">
      {/* Header */}
      <div className="w-full flex justify-between items-center mb-4">
        <img src={backIcon} alt="back" className="w-6 h-6 cursor-pointer" onClick={() => navigate(-1)} />
        <h1 className="font-bold text-2xl">ENSO</h1>
        <div className="w-6" />
      </div>

      <h2 className="text-xl mb-2">Payment</h2>
      <p className="text-gray-400 mb-6">
        {memberId ? `For Member #${memberId}` : "Full Bill Payment"}
      </p>

      {/* Payment Card */}
      <div className="bg-white text-black p-6 rounded-xl shadow-lg w-[90%] max-w-sm text-center">
        <img src={logo} alt="ENSO" className="w-12 h-12 mx-auto mb-2 rounded-full" />
        <h3 className="font-bold text-lg mb-2">THAI QR PAYMENT</h3>

        <img
          src={payment.qrCode} // ✅ ใช้ฟิลด์จาก backend โดยตรง
          alt="QR Code"
          className="w-56 h-56 mx-auto border rounded-md"
        />

        <p className="mt-3 font-semibold text-lg">
          Total: {Number(payment.amount).toFixed(2)} ฿
        </p>

        {confirmed ? (
          <p className="mt-4 text-green-500 font-semibold">✅ Payment Received!</p>
        ) : (
          <p className="mt-4 text-gray-500 text-sm">Waiting for payment confirmation...</p>
        )}
      </div>

      <button
        onClick={() => navigate(-1)}
        className="mt-10 bg-gradient-to-r from-white to-gray-300 text-black px-6 py-2 rounded-full font-semibold hover:opacity-80 transition"
      >
        Back to Bill
      </button>
    </div>
  );
};

export default PaymentPage;
