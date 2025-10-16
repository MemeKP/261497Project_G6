import { useState, useEffect } from 'react';
import type { DiningSession, Payment, Table } from '../types';
import { useQuery } from '@tanstack/react-query';


const PaymentHistory = () => {
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // ดึงข้อมูล active dining sessions
  const { data: activeSessions = [] } = useQuery<DiningSession[]>({
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


  // ดึงข้อมูลโต๊ะทั้งหมด
  const { data: tables = [] } = useQuery<Table[]>({
    queryKey: ["tablesWithStatus"],
    queryFn: async () => {
      const res = await fetch("/api/tables/session-status", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch tables");
      const data = await res.json();
      return data.tables;
    },
    refetchInterval: 5000,
  });

  // สร้างรายการของ tableIds ที่มี active session
  const activeTableIds = activeSessions.map(session => session.tableId);

  // กรองโต๊ะที่มี session active
  const availableTables = tables.filter(table => activeTableIds.includes(table.id));

  useEffect(() => {
    if (availableTables.length > 0 && selectedTable === null) {
      setSelectedTable(availableTables[0].id);
      console.log('Auto-selected table:', availableTables[0].id);
    }
  }, [availableTables, selectedTable]);

  const handleToggleStatus = async (billId: number, splitId: number, currentStatus: 'PAID' | 'PENDING') => {
    try {
      // สลับสถานะ
      const newStatus = currentStatus === 'PENDING' ? 'PAID' : 'PENDING';

      const response = await fetch(`/api/payments/bills/${billId}/splits/${splitId}/toggle-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      if (data.success) {
        // อัพเดต state
        setPayments(prev =>
          prev.map((p) =>
            p.billId === billId && p.splitId === splitId
              ? {
                ...p,
                status: newStatus,
                // อัพเดตวันที่ถ้าจ่ายเสร็จ
                date: newStatus === 'PAID' ? new Date().toISOString() : p.date
              }
              : p
          )
        );

        alert(`Payment status updated to ${newStatus === 'PAID' ? 'Paid' : 'Pending'}`);
      } else {
        alert(data.error || 'Failed to update payment status');
      }
    } catch (err) {
      console.error('Toggle error:', err);
      alert('Error updating status');
    }
  };

  // ใน useEffect ที่ดึงข้อมูล
  // useEffect(() => {
  //   const fetchPayments = async () => {
  //     if (!selectedTable) return;

  //     setLoading(true);
  //     setError('');
  //     try {
  //       const response = await fetch(`/api/payments?tableId=${selectedTable}`, {
  //         method: 'GET',
  //         credentials: 'include',
  //       });

  //       if (!response.ok) {
  //         if (response.status === 404) {
  //           setPayments([]); // เคลียร์ข้อมูลเก่า
  //           return;
  //         }
  //         throw new Error(`Error fetching payments: ${response.status}`);
  //       }

  //       const data = await response.json();

  //       // แปลง status ให้ตรงกับ type
  //       const formattedData: Payment[] = data.map((item: any) => ({
  //         ...item,
  //         status: item.status
  //       }));

  //       setPayments(formattedData);
  //     } catch (err) {
  //       console.log("ERROR IN FETCHING PAYMENT:", err);
  //       if (err instanceof Error && !err.message.includes('404')) {
  //         setError('Failed to load payment data');
  //       } else {
  //         setPayments([]);
  //       }
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchPayments();
  // }, [selectedTable]);
  useEffect(() => {
    const fetchPayments = async () => {
      if (!selectedTable) return;

      setLoading(true);
      setError('');
      try {
        console.log(`🔄 Fetching payments for table: ${selectedTable}`);

        const response = await fetch(`/api/payments?tableId=${selectedTable}`, {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) {
          if (response.status === 404) {
            console.log('📭 No payments found for table');
            setPayments([]);
            return;
          }
          throw new Error(`Error fetching payments: ${response.status}`);
        }

        const data = await response.json();
        console.log('📦 Payments data received:', data);

        // แปลง status ให้ตรงกับ type
        const formattedData: Payment[] = data.map((item: any) => ({
          ...item,
          status: item.status
        }));

        console.log(`✅ Loaded ${formattedData.length} payments`);
        setPayments(formattedData);

      } catch (err) {
        console.log("❌ ERROR IN FETCHING PAYMENT:", err);
        if (err instanceof Error && !err.message.includes('404')) {
          setError('Failed to load payment data');
        } else {
          setPayments([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [selectedTable]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-EN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <div className="min-h-screen p-2 mt-5">

        {/* Table Dropdown Selection */}
        <div className="mb-6">
          <label htmlFor="table-select" className="font-bold text-xl">
            Table:
          </label>

          {availableTables.length > 1 ? (
            <select
              id="table-select"
              className="ml-2 p-2 border rounded-md"
              value={selectedTable}
              onChange={(e) => setSelectedTable(Number(e.target.value))}
            >
              {availableTables.map((table) => (
                <option key={table.id} value={table.id}>
                  Table {table.number}
                </option>
              ))}
            </select>
          ) : availableTables.length === 1 ? (
            <span className="ml-2 text-lg font-semibold">
              Table {availableTables[0].number}
            </span>
          ) : (
            <span className="ml-2 text-gray-500">No active tables</span>
          )}
        </div>
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <h2 className="font-bold text-xl mb-4">Payment History</h2>
          {/* Payment History */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            {/* Loading State */}
            {loading && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
                <p className="text-gray-500 mt-2">Loading payments...</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4">
                <p className="font-semibold">Error</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            )}

            {/* Payment List */}
            {!loading && !error && (
              <div className="space-y-3">
                {payments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p>No payment records found</p>
                  </div>
                ) : (
                  payments.map((p, index) => (
                    <div
                      key={`${p.billId}-${p.splitId}-${index}`}
                      className="flex items-center justify-between bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{p.name}</p>
                        <p className="text-gray-500 text-sm mt-1">
                          {p.role} • ฿{p.amount.toFixed(2)}
                        </p>
                      </div>

                      <div className="text-gray-500 text-xs mr-4 text-right">
                        <div>{formatDate(p.date)}</div>
                        <div className="text-gray-400 mt-1">{p.method}</div>
                      </div>

                      <button
                        onClick={() => handleToggleStatus(p.billId, p.splitId, p.status)}
                        disabled={p.status === 'PAID'}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${p.status === 'PAID'
                          ? 'bg-green-100 text-green-700 cursor-not-allowed'
                          : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 hover:scale-105 active:scale-95'
                          } ${p.status !== 'PAID' && 'hover:scale-105 active:scale-95'}`}
                      >
                        {p.status === 'PAID' ? 'Paid' : 'Pending'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Summary */}
          {payments.length > 0 && (
            <div className="mt-6 bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-semibold mb-3">Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Payments:</span>
                  <span className="font-semibold">{payments.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Completed:</span>
                  <span className="font-semibold text-green-600">
                    {payments.filter(p => p.status === 'PAID').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Pending:</span>
                  <span className="font-semibold text-yellow-600">
                    {payments.filter(p => p.status === 'PENDING').length}
                  </span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Total Amount:</span>
                    <span className="font-bold text-lg">
                      ฿{payments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PaymentHistory;