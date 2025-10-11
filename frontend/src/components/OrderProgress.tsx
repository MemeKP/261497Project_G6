import React, { useState } from "react";
import type { ActiveSession, Order } from "../types";
import { useQuery } from "@tanstack/react-query";

interface OrderProgressProps {
  activeSessions: ActiveSession[];
}

const statusColor = (status: string) => {
  switch (status) {
    case "PENDING":
      return "text-yellow-600 bg-yellow-100";
    case "PREPARING":
      return "text-blue-600 bg-blue-100";
    case "COMPLETED":
      return "text-green-600 bg-green-100";
    case "SERVED":
      return "text-purple-600 bg-purple-100";
    default:
      return "text-gray-600 bg-gray-100";
  }
};

const OrderProgress: React.FC<OrderProgressProps> = ({ activeSessions }) => {
  const [selectedTable, setSelectedTable] = useState<"all" | number>("all");
  const allSessionIds = activeSessions?.map((s) => s.id) || [];

   // Fetch orders สำหรับทุก active session
  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["ordersForAllSessions", allSessionIds],
    queryFn: async () => {
      if (allSessionIds.length === 0) return [];

      const ordersBySession = await Promise.all(
        allSessionIds.map(async (sessionId) => {
          const res = await fetch(`/api/orders/session/${sessionId}`, {
            method: "GET",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          });
          if (!res.ok) return [];
          return res.json() as Promise<Order[]>;
        })
      );

      return ordersBySession.flat();
    },
    enabled: allSessionIds.length > 0,
    refetchInterval: 5000, // 5 sec
  });

  // ✅ ใช้ activeSessions แทน orders ในการดึง tables
  const uniqueTables = activeSessions
    ? Array.from(new Set(activeSessions.map((s) => s.tableId))).sort((a, b) => a - b)
    : [];

  console.log("Active Sessions:", activeSessions);
  console.log("Unique Tables from active sessions:", uniqueTables);
  console.log("Orders in OrderProgress:", orders);

  // กรอง order ตาม table
  const filteredOrders =
    selectedTable === "all"
      ? orders
      : orders.filter((o) => o.tableId === selectedTable);

  return (
    <div className="mt-6">
      {/* TITLE + DROPDOWN */}
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-black text-xl font-bold">Order in progress</h1>

        {/* DROPDOWN */}
        <select
          value={selectedTable}
          onChange={(e) =>
            setSelectedTable(
              e.target.value === "all" ? "all" : Number(e.target.value)
            )
          }
          className="border border-gray-300 rounded-lg text-sm px-2 py-1 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="all">All Tables</option>
          {uniqueTables.map((table) => (
            <option key={table} value={table}>
              Table {table}
            </option>
          ))}
        </select>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow-md p-4">
        <table className="w-full text-left">
          <thead>
            <tr className="text-gray-500 text-sm border-b">
              <th className="pb-2">OrderID</th>
              <th className="pb-2">Table</th>
              <th className="pb-2">Status</th>
              <th className="pb-2">Time</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr
                key={`${order.id}-${order.tableId}`} // Combine order.id and table_id to create a unique key
                className="text-neutral-500 font-medium border-b last:border-0"
              >
                <td className="py-2">{order.id}</td>
                <td>{order.tableId}</td>
                <td>
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColor(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>
                </td>
                <td>
                  {order.createdAt
                    ? new Date(order.createdAt.replace(" ", "T")).toLocaleString([], {
                      month: 'short',  // Oct, Nov, etc.
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                    : 'N/A' // Or any fallback value, like 'No Date'
                  }
                </td>
              </tr>
            ))}

            {filteredOrders.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="text-center text-gray-400 py-3 italic"
                >
                  No orders for this table
                </td>
              </tr>
            )}
          </tbody>

        </table>
      </div>
    </div>
  );
};

export default OrderProgress;