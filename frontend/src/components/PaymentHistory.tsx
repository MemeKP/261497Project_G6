import { useState } from "react";

interface Payment {
  name: string;
  role: string;
  date: string;
  method: string;
  status: string;
}

// ✅ เพิ่ม Record<number, Payment[]> เพื่อบอก TS ว่าคีย์เป็นตัวเลขจริง
const mockPayments: Record<number, Payment[]> = {
  1: [
    { name: "Sommai", role: "Host", date: "September 6, 2025 20.55", method: "QR", status: "Completed" },
    { name: "Somjai", role: "Guest", date: "September 6, 2025 20.55", method: "QR", status: "Completed" },
  ],
  2: [
    { name: "Somsee", role: "Guest", date: "September 6, 2025 20.56", method: "QR", status: "Pending" },
  ],
  3: [
    { name: "Somporn", role: "Guest", date: "September 6, 2025 20.56", method: "QR", status: "Completed" },
    { name: "Somjit", role: "Guest", date: "September 6, 2025 20.56", method: "QR", status: "Pending" },
  ],
  4: [
    { name: "Somjai", role: "Guest", date: "September 6, 2025 20.55", method: "QR", status: "Completed" },
    { name: "Somsee", role: "Guest", date: "September 6, 2025 20.56", method: "QR", status: "Pending" },
    { name: "Somjit", role: "Guest", date: "September 6, 2025 20.56", method: "QR", status: "Pending" },
  ],
};

const PaymentHistory = () => {
  const [selectedTable, setSelectedTable] = useState<number>(4);

  const payments = mockPayments[selectedTable] || [];

  return (
    <div className="mt-6">
      {/* Table Selector */}
      <div>
        <h1 className="font-bold text-lg">Table</h1>
        <select
          value={selectedTable}
          onChange={(e) => setSelectedTable(Number(e.target.value))}
          className="mt-2 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value={1}>1</option>
          <option value={2}>2</option>
          <option value={3}>3</option>
          <option value={4}>4</option>
        </select>
      </div>

      {/* Payment History */}
      <div className="mt-6">
        <h2 className="font-bold text-lg mb-2">Payment History</h2>

        <div className="space-y-3">
          {payments.map((p, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm"
            >
              <div>
                <p className="font-semibold">{p.name}</p>
                {/* <p className="text-gray-500 text-sm">{p.role}</p> */}
              </div>

              <div className="text-gray-500 text-xs">{p.date}</div>

              {/* <div className="text-gray-500 text-sm">{p.method}</div> */}

              <div
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  p.status === "Completed"
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {p.status}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PaymentHistory;