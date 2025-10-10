import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

// Types - อัพเดทให้ตรงกับ backend
interface Payment {
  billId: number;
  splitId: number;  // เพิ่ม splitId
  memberId: number;
  name: string;
  role: string;
  amount: number;
  status: 'Completed' | 'Pending';
  date: string;
  method: string;
  paymentId?: number;
}

const PaymentHistory = () => {
  const [selectedTable, setSelectedTable] = useState<number>(4);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Fetch payment history
  useEffect(() => {

      fetchPaymentHistory();
    
  }, [selectedTable]); // depend on sessionId

  const fetchPaymentHistory = async () => {
    const sessionId = `session_table_${selectedTable}`;
    if (!sessionId) {
      setError('Session ID is missing');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/payments/sessions/${sessionId}/payments`, {
        credentials: 'include', // ย้ายมาอยู่ใน fetch options
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setPayments(data.data);
      } else {
        setError(data.error || 'Failed to load payment history');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  // Toggle payment status - แก้ให้ใช้ splitId
  const handleToggleStatus = async (billId: number, splitId: number, currentStatus: string) => {
    try {
      const response = await fetch(
        `/api/payments/bills/${billId}/splits/${splitId}/toggle-status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // ย้ายมาอยู่ใน fetch options
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Update local state - ใช้ splitId ในการเปรียบเทียบ
        setPayments(prev =>
          prev.map(p =>
            p.splitId === splitId
              ? { ...p, status: data.data.isPaid ? 'Completed' : 'Pending' }
              : p
          )
        );
      } else {
        alert(data.error || 'Failed to update payment status');
      }
    } catch (err) {
      console.error('Toggle error:', err);
      alert('Error updating status');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // แสดง loading ถ้าไม่มี sessionId
  if (!sessionId) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-semibold">Session ID not found</p>
          <p className="text-gray-500 text-sm mt-2">Please check your URL</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Payment Management</h1>
            <p className="text-gray-500 text-sm mt-1">Session ID: {sessionId}</p>
          </div>
          <button
            onClick={fetchPaymentHistory}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {/* Payment History */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="font-bold text-lg mb-4">Payment History</h2>

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
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all hover:scale-105 active:scale-95 ${
                        p.status === 'Completed'
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                      }`}
                    >
                      {p.status === 'Completed' ? '✓ Paid' : '⏳ Pending'}
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
                  {payments.filter(p => p.status === 'Completed').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Pending:</span>
                <span className="font-semibold text-yellow-600">
                  {payments.filter(p => p.status === 'Pending').length}
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
  );
};

export default PaymentHistory;