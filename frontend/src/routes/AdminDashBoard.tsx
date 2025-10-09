import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import AdminNav from "../components/AdminNav";
import OrderProgress from "../components/OrderProgress";
import OverAll from "../components/OverAll";
import TableAndSession from "../components/TableAndSession";
import type { ActiveSession } from "../types";

const AdminDashBoard = () => {
  const navigate = useNavigate();
  const [checkingAuth, setCheckingAuth] = useState(true);

  // ✅ ตรวจสอบ session ก่อนแสดงหน้า dashboard
  useEffect(() => {
    const verifySession = async () => {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
        });

        if (!res.ok) {
          navigate("/login");
        }
      } catch (err) {
        navigate("/login");
      } finally {
        setCheckingAuth(false);
      }
    };

    verifySession();
  }, [navigate]);

  // ✅ เรียก useQuery เสมอ แต่เปิด fetch เมื่อ auth ผ่านแล้วเท่านั้น
  const { data: activeSessionData } = useQuery<{ activeSessions: ActiveSession[] }>({
    queryKey: ["activeSession"],
    queryFn: async () => {
      const res = await fetch("/api/dining_session/active", {
        method: "GET",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch active sessions");
      return res.json();
    },
    enabled: !checkingAuth, // ✅ ปิดระหว่างรอตรวจ session
  });

  if (checkingAuth) {
    return <div className="p-6 text-gray-500">Checking authentication...</div>;
  }

  const activeSessions = activeSessionData?.activeSessions || [];

  return (
    <div className="bg-[#F4F3F7] min-h-screen w-full font-[Gantari] p-4">
      {/* NAVBAR (admin) */}
      <AdminNav />

      {/* HEADER */}
      <h1 className="text-xl font-bold text-black">Overview</h1>
      <p className="text-neutral-500 text-base font-normal">
        Welcome back to admin dashboard
      </p>

      {/* OVERALL */}
      <OverAll />

      {/* TABLE & SESSION */}
      <TableAndSession />

      {/* ORDER IN PROGRESS */}
      <OrderProgress activeSessions={activeSessions} />
    </div>
  );
};

export default AdminDashBoard;
