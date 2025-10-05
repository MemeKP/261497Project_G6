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

        if (!data || !data.items) {
          setBill(null);
          return;
        }

        // ✅ แปลง price เป็น number เพื่อกัน .toFixed error
        const fixedData = {
          ...data,
          items: data.items.map((i: any) => ({
            ...i,
            price: Number(i.price),
          })),
        };

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
          onClick={() => navigate(`/payment/${bill.id}`)} // ✅ ไปหน้า Payment
          className="w-[280px] h-12 rounded-full text-base font-semibold text-black 
                     shadow-[0px_4px_18px_rgba(217,217,217,1.00)] 
                     bg-gradient-to-r from-white to-black hover:opacity-90 transition"
        >
          Pay Entire Bill
        </button>
        <button
          onClick={() => navigate(`/splitbill/${bill.id}`)} // ✅ ไปหน้า Split Bill
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
