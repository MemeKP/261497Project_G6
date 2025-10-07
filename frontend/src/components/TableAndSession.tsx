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
  const [showqr, setShowqr] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);

  // Fetch active sessions
  const { data: activeSessions = [] } = useQuery<ActiveSession[]>({
    queryKey: ["activeSessions"],
    queryFn: async () => {
      const res = await fetch("/api/dining_session/active", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch active sessions");
      const data = await res.json();
      return data.activeSessions;
    },
    refetchInterval: 5000,
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

  // Mutation: Set Table (สร้าง sessionเปิดโต๊ะ)
  const startSessionMutation = useMutation({
    mutationFn: async (tableId: number) => {
      console.log("Starting session for table:", tableId);

      const res = await fetch(`/api/dining_session/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableId: Number(tableId) }),
      });
      if (!res.ok) throw new Error("Failed to set table");
      const data = await res.json();
      console.log("Session started response:", data);
      return data;
      // return res.json();
    },
    onSuccess: (data) => {
      console.log("Session created successfully:", data); 
      // queryClient.invalidateQueries(["activeSessions"]);
      queryClient.invalidateQueries({ queryKey: ["activeSession"] });
      queryClient.invalidateQueries({ queryKey: ["sessionGroups"] });
      if (data.session) {
        alert(
          `Session started successfully!\nTable: ${data.session.tableId}\nSession ID: ${data.session.id}`
        );
      }
      createGroupMutation.mutate({
      tableId: data.session.tableId,
      sessionId: data.session.id,
    });

      setSelectedTable(null);
    },
    onError: (error: Error) => {
      console.error("Error starting session:", error);
      alert(`Error: ${error.message}`);
    },
  });

  // Mutation: Create Group (สร้างกลุ่มลูกค้าในโต๊ะ)
  const createGroupMutation = useMutation({
    mutationFn: async ({
      tableId,
      sessionId,
    }: {
      tableId: number;
      sessionId: number;
    }) => {
      console.log("Creating group for table:", tableId, "session:", sessionId);
      const res = await fetch("/api/group/create", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tableId: Number(tableId),
          sessionId: Number(sessionId),
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create group");
      }
      const data = await res.json();
      console.log("Group created response:", data);
      return data;
    },
    onSuccess: (data) => {
      console.log("Group created successfully:", data);

      // Invalidate queries เพื่ออัพเดท table status
      queryClient.invalidateQueries({ queryKey: ["sessionGroups"] });

      // แสดง QR Code
      if (data.qrCode) {
        setQrCodeData(data.qrCode);
        setShowqr(true);
      } else if (data.group?.qrCode) {
        setQrCodeData(data.group.qrCode);
        setShowqr(true);
      } else {
        alert("Group created but QR code not found");
        setSelectedTable(null);
      }
    },
    onError: (error: Error) => {
      console.error("Error creating group:", error);
      alert(`Error creating group: ${error.message}`);
    },
  });

  /* Get QR for each table */
  const fetchQR = async (tableId: number) => {
    try {
      const res = await fetch(`/api/dining_session/qr/${tableId}`);
      if (!res.ok) throw new Error("Failed to fetch QR Code");
      const data = await res.json();
      setQrCodeData(data.qrCode); // ตั้งค่า qrCodeData เป็น URL ของ QR Code
      setShowqr(true); // แสดง modal
    } catch (error) {
      console.error("Error fetching QR Code:", error);
    }
  };

  const handleSetTable = () => {
    if (!selectedTable) return;

    console.log("handleSetTable - Selected table:", selectedTable);
    console.log("Active session:", activeSessions);

    const existingSessionForTable = activeSessions?.find(
      (session) =>
        session.tableId === selectedTable.id && session.status === "ACTIVE"
    );

    if (existingSessionForTable) {
      alert(
        "There is already an active session for this table. Please end it first or generate QR for this table."
      );
    } else {
      startSessionMutation.mutate(selectedTable.id);
    }
  };

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
                ${
                  table.status === "OCCUPIED"
                    ? "bg-emerald-500 text-white"
                    : "bg-zinc-300 text-black"
                }
                ${selectedTable?.id === table.id ? "ring-4 ring-black" : ""}
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
            className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedTable(null)}
          >
            <motion.div
              className="bg-white rounded-xl shadow-lg p-6 w-80 relative"
              initial={{ y: 50, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 50, opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedTable(null)}
                className="absolute cursor-pointer top-2 right-2 text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>

              {/* Table Info */}
              <h2 className="text-2xl font-bold text-black mb-4">
                Table {selectedTable.number}
              </h2>

              {/* Status */}
              <div className="mb-4">
                <h3 className="text-stone-400 text-sm mb-1">Status</h3>
                <p
                  className={`text-xl font-bold ${
                    selectedTable.status === "OCCUPIED"
                      ? "text-emerald-500"
                      : "text-gray-400"
                  }`}
                >
                  {selectedTable.status === "OCCUPIED" ? "Occupied" : "Free"}
                </p>
              </div>

              {/* Session Info */}
              {!activeSessions?.id && (
                <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    ⚠️ No active session. Start a session first.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="mt-4">
                <h3 className="text-stone-400 text-sm mb-2">Actions</h3>
                <div className="flex gap-2">
                  {/* Set Table Button - เปิดโต๊ะ (สร้าง session) */}
                  {!activeSessions?.id && (
                    <button
                      className="flex-1 px-4 py-2 cursor-pointer rounded bg-blue-500 hover:bg-blue-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleSetTable}
                      disabled={startSessionMutation.isPending}
                    >
                      {startSessionMutation.isPending
                        ? "Starting..."
                        : "Start Session"}
                    </button>
                  )}

                  {/* Generate QR Button - สร้างกลุ่มและ QR */}
                  {activeSessions?.id && selectedTable.status === "FREE" && (
                    <button
                      className="flex-1 px-4 py-2 cursor-pointer rounded bg-purple-500 hover:bg-purple-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      // onClick={handleGenerateQR}
                      disabled={createGroupMutation.isPending}
                    >
                      {createGroupMutation.isPending
                        ? "Creating..."
                        : "Generate QR"}
                    </button>
                  )}

                  {/* View qr - สำหรับโต๊ะที่เปิดsessionแล้ว */}
                  {selectedTable.status === "OCCUPIED" && (
                    <button
                      className="flex-1 px-4 py-2 cursor-pointer rounded bg-gray-500 hover:bg-gray-600 text-white font-semibold"
                      onClick={() => fetchQR(selectedTable.id)}
                    >
                      Qr
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showqr && qrCodeData && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setShowqr(false);
              setQrCodeData(null);
              setSelectedTable(null);
            }}
          >
            <motion.div
              className="bg-white rounded-xl shadow-lg p-6 w-80 relative"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  setShowqr(false);
                  setQrCodeData(null);
                  setSelectedTable(null);
                }}
                className="absolute cursor-pointer top-2 right-2 text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>

              <h2 className="text-xl font-bold text-center mb-4">
                QR Code Generated!
              </h2>

              <div className="flex justify-center mb-4">
                <img
                  src={qrCodeData}
                  alt="QR Code"
                  className="w-64 h-64 border-4 border-gray-200 rounded-lg"
                />
              </div>

              <p className="text-center text-sm text-gray-600">
                Scan this QR code to access the menu
              </p>

              <button
                onClick={() => {
                  setShowqr(false);
                  setQrCodeData(null);
                  setSelectedTable(null);
                }}
                className="w-full mt-4 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold"
              >
                Done
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TableAndSession;
