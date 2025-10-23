import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import QRCode from "qrcode"; 
import type { SessionResponse } from "../types";

const QrDisplay: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrInfo, setQrInfo] = useState<{ path: string; sessionId: number; tableNumber: number } | null>(null);

  const fetchQrCode = async () => {
  if (!sessionId) {
    setError("Session ID is missing in URL.");
    setIsLoading(false);
    return;
  }

  setIsLoading(true);
  setError(null);

  try {
    const res = await axios.get<SessionResponse>(
      `/api/dining_session/${sessionId}`
    );

    console.log("🔍 Session response:", res.data);

    // วิธีที่ 1: ใช้ QR Code image ที่ backend สร้างไว้แล้ว
    const sessionQrCode = res.data.session.qrCode;
    if (sessionQrCode && sessionQrCode.startsWith('data:image')) {
      console.log("✅ Using pre-generated QR code from backend");
      setQrCodeData(sessionQrCode);
      
      // ตั้งค่า qrInfo สำหรับแสดงข้อมูล
      const qrData = res.data.session.qrData;
      setQrInfo({
        path: qrData?.path || `/tables/${sessionId}`,
        sessionId: qrData?.sessionId || parseInt(sessionId),
        tableNumber: qrData?.tableNumber || parseInt(sessionId)
      });
    } else {
      // วิธีที่ 2: สร้าง QR Code ใหม่ใน frontend
      console.log("🔄 Generating new QR code in frontend");
      const qrData = res.data.session.qrData;
      const path = qrData?.path || `/tables/${sessionId}`;
      const fullUrl = `${window.location.origin}${path}`;
      
      console.log("🔍 Frontend QR URL:", fullUrl);

      const qrCodeImage = await QRCode.toDataURL(fullUrl, {
        errorCorrectionLevel: "M",
        margin: 1,
        width: 300,
      });

      setQrCodeData(qrCodeImage);
      setQrInfo({
        path: path,
        sessionId: qrData?.sessionId || parseInt(sessionId),
        tableNumber: qrData?.tableNumber || parseInt(sessionId)
      });
    }
    
  } catch (err) {
    console.error("[QR Display] Failed to fetch session data:", err);
    
    // ✅ Fallback: สร้าง QR Code จาก sessionId
    try {
      const fallbackPath = `/tables/${sessionId}`;
      const fallbackUrl = `${window.location.origin}${fallbackPath}`;
      console.log("🔍 Fallback QR URL:", fallbackUrl);
      
      const qrCodeImage = await QRCode.toDataURL(fallbackUrl, {
        errorCorrectionLevel: "M",
        margin: 1,
        width: 300,
      });

      setQrCodeData(qrCodeImage);
      setQrInfo({
        path: fallbackPath,
        sessionId: parseInt(sessionId),
        tableNumber: parseInt(sessionId)
      });
    } catch (qrError) {
      console.log('QRDISPLAY ERROR', qrError)
      setError("Failed to generate QR code.");
    }
  } finally {
    setIsLoading(false);
  }
};

  useEffect(() => {
    fetchQrCode();
  }, [sessionId]);

  // Function สำหรับ copy URL
  const copyUrlToClipboard = async () => {
    if (qrInfo) {
      const fullUrl = `${window.location.origin}${qrInfo.path}`;
      try {
        await navigator.clipboard.writeText(fullUrl);
        alert("URL copied to clipboard!");
      } catch (err) {
        console.error("Failed to copy URL:", err);
      }
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#1B1C20] flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 p-8 rounded-2xl shadow-2xl text-center">
        <h1 className="text-2xl font-bold text-white mb-2 font-[Epilogue]">
          Table {qrInfo?.tableNumber || sessionId}
        </h1>
        <p className="text-gray-400 mb-6">Session ID: {sessionId}</p>

        {isLoading && (
          <div className="text-yellow-400 font-[Epilogue] animate-pulse">
            Generating QR Code...
          </div>
        )}

        {error && (
          <div className="text-red-500 font-[Epilogue] mb-4">Error: {error}</div>
        )}

        {qrCodeData && (
          <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-inner">
            <p className="text-lg font-semibold text-gray-700 mb-4">
              Scan to Order
            </p>
            <img
              src={qrCodeData}
              alt={`QR Code for Table ${qrInfo?.tableNumber || sessionId}`}
              className="w-64 h-64 sm:w-80 sm:h-80 rounded-lg border-8 border-gray-200 shadow-xl mb-4"
            />
            
            {/* ✅ แสดง URL และปุ่ม copy */}
            <div className="mt-4 w-full">
              <p className="text-sm text-gray-600 mb-2">Or share this URL:</p>
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  value={qrInfo ? `${window.location.origin}${qrInfo.path}` : ''}
                  readOnly
                  className="flex-1 p-2 text-sm bg-gray-100 rounded border border-gray-300 truncate"
                />
                <button 
                  onClick={copyUrlToClipboard}
                  className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QrDisplay;