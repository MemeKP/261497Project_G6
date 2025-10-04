import React, { useState } from "react";
import type { Table } from "../types";
import { AnimatePresence, motion } from "motion/react";

const tables: Table[] = [
  { id: 1, number: 1, status: "AVAILABLE" },
  { id: 2, number: 2, status: "OCCUPIED" },
  { id: 3, number: 3, status: "AVAILABLE" },
  { id: 4, number: 4, status: "AVAILABLE" },
  { id: 5, number: 5, status: "OCCUPIED" },
  { id: 6, number: 6, status: "OCCUPIED" },
  { id: 7, number: 7, status: "AVAILABLE" },
  { id: 8, number: 8, status: "OCCUPIED" },
  { id: 9, number: 9, status: "AVAILABLE" },
];

const TableAndSession: React.FC = () => {
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  return (
    <div className="pt-6">
      <h1 className="text-black text-xl font-bold">Table & Sessions</h1>
      <div className="bg-white rounded-2xl p-4 shadow-md">
        <div className="grid grid-cols-3 gap-3">
          {tables.map((table) => (
            <button
              onClick={() => setSelectedTable(table)}
              key={table.id}
              className={`py-4 rounded-lg font-semibold text-center items-center justify-center 
                ${
                  table.status === "OCCUPIED"
                    ? "bg-emerald-500 text-white"
                    : "bg-zinc-300 text-black"
                }
              ${
                selectedTable?.id === table.id
                  ? table.status === "OCCUPIED"
                    ? "border-4 border-teal-400" 
                    : "border-4 border-black" 
                  : "border border-transparent" 
              }
              `}
            >
              Table {table.number}
            </button>
          ))}
        </div>
      </div>

      {/* MODAL */}
      <AnimatePresence>
        {selectedTable && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-xl shadow-lg p-6 w-80 relative"
              initial={{ y: 50, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 50, opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <button
                onClick={() => setSelectedTable(null)}
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>

              {/* Status */}
              <h2 className="text-stone-400 text-sm mb-1">Status</h2>
              <p
                className={`text-2xl font-bold mb-4 ${
                  selectedTable.status === "OCCUPIED"
                    ? "text-emerald-500"
                    : "text-gray-400"
                }`}
              >
                {selectedTable.status === "OCCUPIED" ? "Active" : "Free"}
              </p>

              {/* Action */}
              <div className="mt-2">
                <h3 className="text-stone-400 text-sm mb-2">Action</h3>
                <div className="flex gap-2">
                  <button className="px-3 py-1 rounded bg-gray-200 text-gray-600 text-sm">
                    Set this table
                  </button>
                  <button
                    className="px-3 py-1 rounded bg-purple-200 text-purple-700 text-sm"
                    onClick={() =>
                      alert(`Generate QR for table ${selectedTable.number}`)
                    }
                  >
                    QR
                  </button>
                </div>
              </div>

              {/* Link view orders */}
              <div className="mt-4">
                <a
                  href={`/orders/${selectedTable.id}`}
                  className="text-blue-500 text-sm underline"
                >
                  View Orders
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TableAndSession;
