import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import type { SessionResponse } from "../types";

const QrDisplay: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

    const sessionQrCode = res.data.session.qrCode;
    if(sessionQrCode){
      setQrCodeData(sessionQrCode)
    } else (
      // fallback 
      setQrCodeData('test เอา hardcode test ได้')
    )
    
  } catch (err) {
    console.error("[QR Display] Failed to fetch session data:", err);
    setError("Failed to connect to the session server.");
  } finally {
    setIsLoading(false);
  }
};

  useEffect(() => {
    fetchQrCode();
  }, [sessionId]);

  return (
    <div className="w-full min-h-screen bg-[#1B1C20] flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 p-8 rounded-2xl shadow-2xl text-center">
        <h1 className="text-2xl font-bold text-white mb-6 font-[Epilogue]">
          Session ID: {sessionId}
        </h1>

        {isLoading && (
          <div className="text-yellow-400 font-[Epilogue] animate-pulse">
            Loading QR Code...
          </div>
        )}

        {error && (
          <div className="text-red-500 font-[Epilogue]">Error: {error}</div>
        )}

        {qrCodeData && (
          <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-inner">
            <p className="text-lg font-semibold text-gray-700 mb-4">
             scane to order
            </p>
            <img
              src={qrCodeData}
              alt={`QR Code for session ${sessionId}`}
              className="w-64 h-64 sm:w-80 sm:h-80 rounded-lg border-8 border-gray-200 shadow-xl"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default QrDisplay;