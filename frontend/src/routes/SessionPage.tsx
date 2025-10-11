import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import bg1 from "../assets/imgs/bg-1.png";
import logo from "../assets/imgs/logo.png";

interface SessionData {
  id: number;
  tableNo: number | string;
  guests: number;
  orders: number;
  total: number;
  startTime?: string | null;
  endTime?: string | null;
}

const SessionPage = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch(`/api/dining_session/${sessionId}`, {
          credentials: "include",
        });
        const raw = await res.json();
        console.log("📦 Raw session data:", raw);

        if (!res.ok) throw new Error(raw.error || "Failed to fetch session");

        // ✅ ดึงข้อมูล session และ group
        const s = raw.session;
        const g = raw.group;

        // ✅ แปลงเวลาให้อยู่ในรูปแบบ HH:mm ตาม timezone ไทย
        const formatTime = (timeString?: string | null) => {
          if (!timeString) return null;
          const date = new Date(timeString);
          return date.toLocaleTimeString("th-TH", {
            hour: "2-digit",
            minute: "2-digit",
          });
        };

        const data: SessionData = {
          id: s.id,
          tableNo: s.tableId ?? "-",
          guests: s.totalCustomers ?? g?.members?.length ?? 0,
          orders: g?.members?.length ?? 0, // ถ้ายังไม่มี order count จริง ๆ ใช้จำนวนสมาชิกแทนชั่วคราว
          total: 0, // ถ้ามี total จริงใน backend สามารถใส่เพิ่มทีหลัง
          startTime: formatTime(s.startedAt),
          endTime: formatTime(s.endedAt),
        };

        setSession(data);
      } catch (err) {
        console.error("❌ Error fetching session:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [sessionId]);

  if (loading)
    return <p className="text-white text-center mt-10">Loading...</p>;
  if (!session)
    return <p className="text-white text-center mt-10">No session data.</p>;

  return (
    <div className="w-full h-screen relative bg-black overflow-hidden">
      {/* Background */}
      <div
        className="w-full h-full bg-cover bg-center absolute inset-0"
        style={{ backgroundImage: `url(${bg1})` }}
      ></div>
      <div className="absolute inset-0 bg-black opacity-70"></div>

      {/* Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 font-[Gantari]">
        {/* Title */}
        <h1 className="text-4xl font-bold mb-2">Thank You!</h1>
        <p className="text-center text-lg text-gray-200 mb-8">
          Thank you for dining with us! <br /> We hope to see you again.
        </p>

        {/* Card */}
        <div className="bg-white/95 text-black rounded-3xl shadow-lg p-6 w-[330px] text-center">
          <img
            src={logo}
            alt="ENSO Logo"
            className="w-14 h-14 mx-auto mb-2 rounded-full"
          />
          <h2 className="text-xl font-bold mb-1">
            Table no: {session.tableNo ?? "-"}
          </h2>
          <p className="text-gray-600 mb-3 text-sm">
            {session.startTime ?? "--:--"},{" "}
            {new Date().toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
            })}
          </p>

          <div className="text-left text-sm border-t border-gray-300 pt-3 space-y-2">
            <p>
              <span className="font-semibold">🪑 Session:</span> #{session.id}
            </p>
            <p>
              <span className="font-semibold">👥 Guests:</span>{" "}
              {session.guests ?? 0} persons
            </p>
            <p>
              <span className="font-semibold">🍣 Orders:</span>{" "}
              {session.orders ?? 0} items
            </p>
            <p>
              <span className="font-semibold">💰 Total:</span>{" "}
              {session.total ? session.total.toFixed(2) : "0.00"} ฿
            </p>
            <p>
              <span className="font-semibold">🕒 Time:</span>{" "}
              Start {session.startTime ?? "--:--"} | End{" "}
              {session.endTime ?? "--:--"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionPage;
