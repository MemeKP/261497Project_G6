import { useState, useEffect } from "react";
import logo from "../assets/imgs/logo.png";

interface OrderItem {
  name: string;
  qty: number;
  price: number;
}

interface BillData {
  tableId: number;
  date: string;
  items: OrderItem[];
  serviceRate: number;
}

const BillPage = () => {
  const [bill, setBill] = useState<BillData | null>(null);

  // Mock data generator
  useEffect(() => {
    const mockBill: BillData = {
      tableId: 4,
      date: new Date().toISOString(), // current time
      items: [
        { name: "Lorem Ipsum", qty: 2, price: 159 },
        { name: "Lorem Ipsum", qty: 1, price: 179 },
        { name: "Lorem Ipsum", qty: 1, price: 139 },
      ],
      serviceRate: 0.07,
    };

    setBill(mockBill);
  }, []);

  if (!bill) return <p className="text-center text-white">Loading...</p>;

  // Calculate totals
    const subTotal = bill.items.reduce((sum, i) => sum + i.qty * i.price, 0);
    const service = Number((subTotal * bill.serviceRate).toFixed(2));
    const total = Number((subTotal + service).toFixed(2));


  return (
    <div className="w-full h-[852px] relative bg-[#1E1E1E] text-white p-6 flex flex-col">
      {/* Header */}
      <div className="flex justify-start items-center mb-6">
        <h1 className="title1 text-2xl">ENSO</h1>
      </div>

      <h2 className="text-xl  text-center mb-6">Your Order</h2>

      {/* Bill Card */}
      <div className="bg-white text-black rounded-lg p-6 w-[90%] mx-auto">
        {/* Table info */}
        <div className="flex items-center gap-4 mb-4">
          <img src={logo} alt="ENSO" className="w-10 h-10 rounded-full" />
          <div>
            <p className="font-bold">Table no: {bill.tableId}</p>
            <p className="text-xs text-gray-600">
              {new Date(bill.date).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Items list */}
        <div className="text-sm mb-4">
          <div className="flex justify-between font-semibold border-b border-dashed border-gray-400 pb-1">
            <span>Item</span>
            <span>Qty</span>
            <span>Price</span>
          </div>

          {bill.items.map((item, idx) => (
            <div key={idx} className="flex justify-between py-1">
              <span>{item.name}</span>
              <span>{item.qty}</span>
              <span>{item.price}.-</span>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="text-sm border-t border-dashed border-gray-400 pt-2">
          <div className="flex justify-between">
            <span>Sub Total</span>
            <span>{subTotal.toFixed(2)}</span>
          </div>
            <div className="flex justify-between">
                <span>Service { (bill.serviceRate * 100).toFixed(0) }%</span>
                <span>{ service.toFixed(2) }</span>
            </div>

        </div>

        {/* Total */}
        <div className="flex justify-between font-bold text-lg mt-2">
          <span>Total</span>
          <span>{total.toFixed(2)}</span>
        </div>
      </div>

      {/* Buttons */}
      <div className="mt-auto flex gap-4 justify-center">
        <button
          className="w-[150px] h-12 rounded-full text-sm font-semibold text-black 
                     shadow-[0px_4px_18px_rgba(217,217,217,1.00)] 
                     bg-gradient-to-r from-white to-black hover:opacity-90 transition"
        >
          Pay Entire Bill
        </button>
        <button
          className="w-[150px] h-12 rounded-full text-sm font-semibold text-black 
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
