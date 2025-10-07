import { BsClipboard2CheckFill, BsClipboard2XFill } from "react-icons/bs";
import revenue from "../assets/imgs/revenue.png";
import { IoIosPeople } from "react-icons/io";
import { useQuery } from "@tanstack/react-query";
import { type ActiveSession, type ActiveSessionGroup, type Order } from "../types";

const OverAll = () => {
  // Fetch active session (แค่ครั้งเดียว)
  const { data: activeSessionData } = useQuery<ActiveSessionGroup>({
    queryKey: ["activeSession"],
    queryFn: async () => {
      const res = await fetch("/api/dining_session/active", {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to fetch active session");
      const data = await res.json();
      console.log("Fetched active sessions:", data);
      return data;
    },
  });

  const activeSessions = activeSessionData?.activeSessions || [];
  const totalActiveTables = activeSessionData?.totalActiveTables || 0;

  // Fetch orders สำหรับทุก active session
const { data: allOrders = [] } = useQuery<Order[]>({
  queryKey: ["allOrdersForActiveSessions", activeSessions.map(s => s.id)],
  queryFn: async () => {
    if (activeSessions.length === 0) return [];
    
    const ordersBySession = await Promise.all(
      activeSessions.map(async (session: ActiveSession) => {
        const res = await fetch(`/api/orders/session/${session.id}`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) return [];
        return res.json();
      })
    );

    return ordersBySession.flat(); // รวม array ของทุก session เป็น array เดียว
  },
  enabled: activeSessions.length > 0,
});
  
  const totalOrders = allOrders.length;
  const totalCanceled = allOrders.filter(
    (o) => o.status === "cancelled" || o.status === "canceled"
  ).length;
  const totalRevenue = allOrders
    .filter((o) => o.status === "completed" || o.status === "paid")
    .reduce((sum, o) => sum + (o.totalPrice || 0), 0);

  return (
    <div className="pt-6 grid grid-cols-2 gap-6">
      {/* TOTAL ORDERS */}
      <div className="flex items-center bg-white rounded-2xl p-2 shadow-md">
        <BsClipboard2CheckFill className="text-3xl text-black mr-1" />
        <div className="flex flex-col ml-2">
          <p className="text-sm font-bold text-black">Total Orders</p>
          <p className="text-2xl font-bold text-black">{totalOrders}</p>
        </div>
      </div>

      {/* TOTAL CANCELED */}
      <div className="flex items-center bg-white rounded-2xl p-2 shadow-md">
        <BsClipboard2XFill className="text-3xl text-black mr-1" />
        <div className="flex flex-col ml-2">
          <p className="text-sm font-bold text-black">Total Canceled</p>
          <p className="text-2xl font-bold text-black">{totalCanceled}</p>
        </div>
      </div>

      {/* TOTAL REVENUE */}
      <div className="flex items-center bg-white rounded-2xl p-2 shadow-md">
        <img src={revenue} alt="total revenue" className="h-8 w-8 mr-3" />
        <div className="flex flex-col ml-2">
          <p className="text-sm font-bold text-black">Total Revenue</p>
          <p className="text-2xl font-bold text-black">฿{totalRevenue.toFixed(2)}</p>
        </div>
      </div>

      {/* ACTIVE SESSION */}
      <div className="flex items-center bg-green-100 rounded-2xl p-2 shadow-md">
        <IoIosPeople className="text-3xl text-green-600 mr-1" />
        <div className="flex flex-col ml-2">
          <p className="text-sm font-bold text-green-600">Active sessions</p>
          <p className="text-2xl font-bold text-green-600">{totalActiveTables}</p>
        </div>
      </div>
    </div>
  );
};

export default OverAll;

// 3️Fetch groups สำหรับ session
  /*
  const { data: groups = [] } = useQuery({
    queryKey: ["sessionGroups", activeSessionId],
    queryFn: async () => {
      if (!activeSessionId) return [];
      const res = await fetch(`/api/group/session/${activeSessionId}`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to fetch groups");
      return res.json();
    },
    enabled: !!activeSessionId,
  });*/