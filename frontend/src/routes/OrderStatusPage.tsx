import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

interface OrderItem {
  id: number;
  menuName: string;
  quantity: number;
  status: string;
  memberName?: string;
  note?: string; 
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

      const data = (rawData || []).map((order: any) => ({
        id: order.id,
        status: order.status || "PREPARING",
        tableId: order.tableId,
        items: (order.items || []).map((item: any) => ({
          id: item.id,
          menuName:
            item.menuName ||
            item.menu_item_name ||
            item.menuItem?.name ||
            "Unnamed Item",
          quantity: item.quantity ?? 0,
          status: item.status || order.status || "PREPARING",
          memberName: item.memberName || "Unknown", 
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

  const allItems = orders.flatMap((order) =>
    order.items.map((item) => ({
      ...item,
      status: item.status || order.status || "PREPARING",
    }))
  );

  const preparing = allItems.filter((i) => i.status === "PREPARING" || i.status === "PENDING");
  const ready = allItems.filter((i) => i.status === "READY");
  const completed = allItems.filter((i) => i.status === "COMPLETED");
  
  const groupedItems = preparing.reduce((acc: any, item) => {
    const key = item.menuName;
    if (!acc[key]) {
      acc[key] = { ...item, quantity: 0, members: [] };
    }
    acc[key].quantity += item.quantity;
    acc[key].members.push(item.memberName);
    return acc;
  }, {});

const groupedList = Object.values(groupedItems);

  return (
    <div className="w-full min-h-screen relative bg-[#1E1E1E] text-white p-6 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="title1 text-2xl">ENSO</h1>
        <div className="w-6" />
      </div>

      {/* Title */}
      <h2 className="text-xl text-center mb-2"> Your Order </h2>
      <p className="text-sm text-center mb-6">
        Orders Items:{" "}
        <span className="font-semibold">
          {preparing.reduce((sum, item) => sum + item.quantity, 0) +
          ready.reduce((sum, item) => sum + item.quantity, 0)}{" "}
          items
        </span>

      </p>

      {/* Preparing Section */}
      <div
        className="bg-white text-black rounded-lg p-4 mb-4 cursor-pointer"
        onClick={() => toggleSection("preparing")}
      >
        <div className="flex justify-between items-center font-semibold">
          <span>All items ({preparing.length})</span>
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
          {groupedList.length > 0 ? (
            groupedList.map((item: any, idx) => (
              <div key={idx} className="flex flex-col px-1 mb-2">
                <div className="flex justify-between">
                  <span>{item.menuName}</span>
                  <span className="text-gray-700 font-medium">x {item.quantity}</span>
                </div>
                <span className="text-gray-500 text-xs">
                  👤 {item.members.join(", ")}
                </span>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No items preparing.</p>
          )}
        </div>
      )}
      </div>

      {/* Message Section */}
      <div className="flex flex-col flex-1 justify-end">
        <p className="text-center text-gray-300 text-sm mb-3 leading-relaxed">
          Your order has been received and  <br />
          is now being prepared. Please wait a moment.
        </p>
      </div>

      {/* Buttons */}
      <div className="mt-auto flex flex-col gap-4">
        <button
          onClick={async () => {
            try {
              const tableId = orders[0]?.tableId || orders[orders.length - 1]?.tableId;
              if (!tableId) {
                alert("Cannot find tableId for this session.");
                return;
              }

              const res = await fetch(`/api/orders/new`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  diningSessionId: Number(sessionId),
                  tableId: tableId,
                  items: [], 
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
              const orderRes = await fetch(`/api/orders/session/${sessionId}`, {
                credentials: "include",
              });
              const orders = await orderRes.json();

              if (!orderRes.ok || !orders || !Array.isArray(orders) || orders.length === 0) {
                alert("No orders found for this session.");
                return;
              }

              const latestOrder = orders[orders.length - 1];
              if (!latestOrder || !latestOrder.id) {
                alert("No valid latest order found.");
                return;
              }

              const res = await fetch(`/api/bill-splits/sessions/${sessionId}/bill`, {
                method: "POST",
                credentials: "include",
              });

              if (!res.ok) throw new Error("Failed to generate bill");

              const billData = await res.json();
              console.log("Bill created:", billData);

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