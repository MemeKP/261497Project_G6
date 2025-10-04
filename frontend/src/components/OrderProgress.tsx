import React, { useState } from "react";

/** ORDER SCHEMA
 * export const orders = pgTable('orders', {
   id: serial('id').primaryKey(),
   table_id: integer('table_id').notNull(),
   group_id: integer('group_id').references(() => groups.id), 
   user_id: integer('user_id').references(() => users.id), 
   dining_session_id: integer('dining_session_id').references(() => diningSessions.id),
   status: varchar('status', { length: 20 }).default("PENDING"), 
   created_at: timestamp('created_at').defaultNow()
 });
 */

const orders = [
  { id: "001", table: 7, status: "PENDING", time: "17:11" },
  { id: "002", table: 2, status: "PREPARING", time: "17:30" },
  { id: "003", table: 2, status: "PENDING", time: "17:31" },
  { id: "004", table: 1, status: "COMPLETED", time: "18:01" },
  { id: "005", table: 5, status: "SERVED", time: "18:48" },
];

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

const OrderProgress = () => {
  const [selectedTable, setSelectedTable] = useState("all");

  // ดึงเฉพาะtableที่มีอยู่จริง (เพื่อใส่ใน dropdown)
  const uniqueTables = Array.from(new Set(orders.map((o) => o.table))).sort(
    (a, b) => a - b
  );

  // กรองorderตามโต๊ะที่เลือก
  const filteredOrders =
    selectedTable === "all"
      ? orders
      : orders.filter((o) => o.table === Number(selectedTable));

  return (
    <div className="mt-6">
      {/* TITLE + DROPDOWN */}
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-black text-xl font-bold">Order in progress</h1>

        {/* DROPDOWN */}
        <select
          value={selectedTable}
          onChange={(e) => setSelectedTable(e.target.value)}
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
                key={order.id}
                className="text-neutral-500 font-medium border-b last:border-0"
              >
                <td className="py-2">{order.id}</td>
                <td>{order.table}</td>
                <td>
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColor(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>
                </td>
                <td>{order.time}</td>
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
