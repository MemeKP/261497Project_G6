import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

interface OrderItem {
  id: number;
  menuName: string;
  quantity: number;
  status: string;
}

interface Order {
  id: number;
  status: string;
  tableId: number;
  items: OrderItem[];
}

const OrderStatusPage = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch(`/api/orders/session/${sessionId}`);
        const rawData = await res.json();

        // ✅ ปรับโครงสร้างข้อมูลให้ตรงกับที่ frontend ใช้
        const data = (rawData || []).map((order: any) => ({
          id: order.id,
          status: order.status || "PREPARING",
          tableId: order.table_id,
          items: (order.items || []).map((item: any) => ({
            id: item.id,
            menuName: item.menuItem?.name || "Unnamed Item",
            quantity: item.quantity ?? 0,
            status: item.status || order.status || "PREPARING",
          })),
        }));

        setOrders(data);
      } catch (err) {
        console.error("Error fetching order status:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [sessionId]);

  if (loading) return <div className="text-white p-4">Loading...</div>;

  // รวมเมนูทั้งหมดจากทุกออเดอร์
  const allItems = orders.flatMap((order) =>
    order.items.map((item) => ({
      ...item,
      status: item.status || order.status || "PREPARING",
    }))
  );

  // แยกตามสถานะ
  const preparing = allItems.filter((i) => i.status === "PREPARING" || i.status === "PENDING");
  const ready = allItems.filter((i) => i.status === "READY");
  const completed = allItems.filter((i) => i.status === "COMPLETED");

  return (
    <div className="w-full min-h-screen relative bg-[#1E1E1E] text-white p-6 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="title1 text-2xl">ENSO</h1>
        <div className="w-6" />
      </div>

      {/* Title */}
      <h2 className="text-xl text-center mb-2">Order Status</h2>
      <p className="text-sm text-center mb-6">
        Orders in progress:{" "}
        <span className="font-semibold">{preparing.length + ready.length} items</span>
      </p>

      {/* Preparing Section */}
      <div
        className="bg-white text-black rounded-lg p-4 mb-4 cursor-pointer"
        onClick={() => toggleSection("preparing")}
      >
        <div className="flex justify-between items-center font-semibold">
          <span>Preparing ({preparing.length})</span>
          <span className="text-sm text-gray-600 flex items-center">
            {openSection === "preparing" ? (
              <FaChevronUp className="ml-2" />
            ) : (
              <FaChevronDown className="ml-2" />
            )}
          </span>
        </div>
        {openSection === "preparing" && (
          <div className="mt-2 text-sm">
            {preparing.length > 0 ? (
              preparing.map((item) => (
                <p key={item.id}>
                  {item.menuName} x {item.quantity}
                </p>
              ))
            ) : (
              <p className="text-gray-500">No items preparing.</p>
            )}
          </div>
        )}
      </div>

      {/* Ready Section */}
      <div
        className="bg-white text-black rounded-lg p-4 mb-4 cursor-pointer"
        onClick={() => toggleSection("ready")}
      >
        <div className="flex justify-between items-center font-semibold">
          <span>Ready to Serve ({ready.length})</span>
          <span className="text-sm text-gray-600 flex items-center">
            {openSection === "ready" ? (
              <FaChevronUp className="ml-2" />
            ) : (
              <FaChevronDown className="ml-2" />
            )}
          </span>
        </div>
        {openSection === "ready" && (
          <div className="mt-2 text-sm">
            {ready.length > 0 ? (
              ready.map((item) => (
                <p key={item.id}>
                  {item.menuName} x {item.quantity}
                </p>
              ))
            ) : (
              <p className="text-gray-500">No ready items.</p>
            )}
          </div>
        )}
      </div>

      {/* Completed Section */}
      <div
        className="bg-white text-black rounded-lg p-4 mb-6 cursor-pointer"
        onClick={() => toggleSection("completed")}
      >
        <div className="flex justify-between items-center font-semibold">
          <span>Completed ({completed.length})</span>
          {openSection === "completed" ? (
            <FaChevronUp className="ml-2 text-gray-600" />
          ) : (
            <FaChevronDown className="ml-2 text-gray-600" />
          )}
        </div>
        {openSection === "completed" && (
          <div className="mt-2 text-sm">
            {completed.length > 0 ? (
              completed.map((item) => (
                <p key={item.id}>
                  {item.menuName} x {item.quantity}
                </p>
              ))
            ) : (
              <p className="text-gray-500">No completed items.</p>
            )}
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="mt-auto flex flex-col gap-4">
        <button
          onClick={async () => {
            try {
              // ✅ ดึง tableId จาก order ล่าสุด (เพราะทุก order ของ session ใช้โต๊ะเดียวกัน)
              const tableId = orders[0]?.tableId || orders[orders.length - 1]?.tableId;
              if (!tableId) {
                alert("Cannot find tableId for this session.");
                return;
              }

              // ✅ ส่งทั้ง diningSessionId และ tableId ไป backend
              const res = await fetch(`/api/orders`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  diningSessionId: Number(sessionId),
                  tableId: tableId,
                  items: [], // ตอน new order ยังไม่มีเมนู
                }),
                credentials: "include",
              });

              if (!res.ok) throw new Error("Failed to create new order");
              const newOrder = await res.json();
              console.log("🆕 Created new order:", newOrder);

              navigate(`/homepage/${sessionId}`);
            } catch (err) {
              console.error("Error creating new order:", err);
              alert("Failed to create new order. Please try again.");
            }
          }}
          className="w-[300px] h-12 mx-auto rounded-full text-lg font-semibold text-black 
                    shadow-[0px_4px_18px_0px_rgba(217,217,217,1.00)] 
                    bg-gradient-to-r from-white to-black hover:opacity-90 transition"
        >
          New Order
        </button>

        <button
          onClick={async () => {
            try {
              // ✅ โหลด order ล่าสุดใน session
              const orderRes = await fetch(`/api/orders/session/${sessionId}`, {
                credentials: "include",
              });
              const orders = await orderRes.json();

              if (!orders || orders.length === 0) {
                alert("No orders found for this session.");
                return;
              }

              const latestOrder = orders[orders.length - 1];
              const orderId = latestOrder.id;

              // ✅ สร้างบิลใหม่จาก order ล่าสุด
              const res = await fetch(`/api/bill-splits/sessions/${sessionId}/bill`, {
                method: "POST",
                credentials: "include",
              });

              if (!res.ok) throw new Error("Failed to generate bill");

              const billData = await res.json();
              console.log("✅ Bill created:", billData);

              // ✅ ไปหน้าแสดงบิล โดยส่ง orderId แทน sessionId
              navigate(`/billpage/${sessionId}`);
            } catch (err) {
              console.error("Error generating bill:", err);
              alert("Failed to generate bill. Please try again.");
            }
          }}
          className="w-[300px] h-12 mx-auto rounded-full text-lg font-semibold text-black 
                    shadow-[0px_4px_18px_0px_rgba(217,217,217,1.00)] 
                    bg-gradient-to-r from-white to-black hover:opacity-90 transition"
        >
          Generate Bill
        </button>

      </div>
    </div>
  );
};

export default OrderStatusPage;
