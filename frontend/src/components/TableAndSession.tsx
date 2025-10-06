import React, { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ActiveSession } from "../types";

interface Table {
  id: number;
  number: number;
  status: "OCCUPIED" | "FREE";
}

const TOTAL_TABLES = 9; // fix ให้ร้านมี 9 โต๊ะ

const TableAndSession: React.FC = () => {
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const queryClient = useQueryClient();

  // Fetch active sessions
  const { data: activeSessions = [] } = useQuery<ActiveSession[]>({
    queryKey: ["activeSessions"],
    queryFn: async () => {
      const res = await fetch("/api/dining_session/active", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch active sessions");
      const data = await res.json();
      return data.activeSessions;
    },
  });

  // แปลงเป็น tables
  const tables: Table[] = Array.from({ length: TOTAL_TABLES }, (_, i) => {
    const tableId = i + 1;
    const occupied = activeSessions.some((s) => s.tableId === tableId);
    return {
      id: tableId,
      number: tableId,
      status: occupied ? "OCCUPIED" : "FREE",
    };
  });

  // Mutation: Set Table (สร้าง session)
  const mutation = useMutation({
  mutationFn: async (tableId: number) => {
    const res = await fetch(`/api/dining_session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tableId }),
    });
    if (!res.ok) throw new Error("Failed to set table");
    return res.json();
  },
  onSuccess: () => {
    queryClient.invalidateQueries(["activeSessions"]);
  },
});


  // Generate QR
  const generateQRMutation = useMutation({
  mutationFn: async (tableId: number) => {
    const res = await fetch(`/api/dining_session/${tableId}/qr`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Failed to generate QR");
    return res.json();
  },
  onSuccess: (data) => {
    alert(`QR Code generated!\n${data.qrUrl}`);
  },
});


  return (
    <div className="pt-6">
      <h1 className="text-black text-xl font-bold">Table & Sessions</h1>
      <div className="bg-white rounded-2xl p-4 shadow-md">
        <div className="grid grid-cols-3 gap-3">
          {tables.map((table) => (
            <button
              key={table.id}
              onClick={() => setSelectedTable(table)}
              className={`py-4 rounded-lg cursor-pointer font-semibold text-center 
                ${table.status === "OCCUPIED" ? "bg-emerald-500 text-white" : "bg-zinc-300 text-black"}
                ${selectedTable?.id === table.id ? "border-4 border-black" : "border border-transparent"}
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
                className="absolute cursor-pointer top-2 right-2 text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>

              {/* Status */}
              <h2 className="text-stone-400 text-sm mb-1">Status</h2>
              <p className={`text-2xl font-bold mb-4 ${selectedTable.status === "OCCUPIED" ? "text-emerald-500" : "text-gray-400"}`}>
                {selectedTable.status === "OCCUPIED" ? "Active" : "Free"}
              </p>

              {/* Action */}
              <div className="mt-2">
                <h3 className="text-stone-400 text-sm mb-2">Action</h3>
                <div className="flex gap-2">
                  <button
                    className="px-3 py-1 rounded cursor-pointer bg-gray-200 text-gray-600 text-sm"
                    onClick={() => {
                      if (selectedTable.status === "FREE") {
                        mutation.mutate(selectedTable.id);
                      }
                    }}
                  >
                    Set this table
                  </button>
                  <button
                    className="px-3 py-1 cursor-pointer rounded bg-purple-200 text-purple-700 text-sm"
                    onClick={() => generateQRMutation.mutate(selectedTable.id)}
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
