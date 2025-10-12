import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import backIcon from "../assets/imgs/back.png";
import bg1 from "../assets/imgs/bg-1.png";

interface MemberSplit {
  memberId: number;
  name: string;
  amount: string;
  paid: boolean;
}

const SplitBillPage = () => {
  const { billId } = useParams<{ billId: string }>();
  const navigate = useNavigate();
  const [splits, setSplits] = useState<MemberSplit[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchSplits = async () => {
      try {
        const res = await fetch(`/api/bill-splits/bills/${billId}/splits`, {
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch splits");

        setSplits(data);
        const sum = data.reduce((acc: number, s: any) => acc + Number(s.amount), 0);
        setTotal(sum);
      } catch (err) {
        console.error("Error fetching splits:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSplits();
  }, [billId]);

  if (loading) return <p className="text-white text-center mt-10">Loading...</p>;
  if (splits.length === 0)
    return <p className="text-white text-center mt-10">No bill data.</p>;

  return (
    <>
      {/* BACKGROUND */}
      <div className="w-full h-screen relative bg-black overflow-hidden">
        {/* BACKGROUND IMAGE */}
        <div
          className="w-full h-full bg-cover bg-center absolute inset-0"
          style={{ backgroundImage: `url(${bg1})` }}
        ></div>
        {/* Layer  */}
        <div className="absolute inset-0 bg-black opacity-70"></div>

        {/* CONTENT */}
        <div className="absolute inset-0 flex flex-col items-center p-6 text-white">
          {/* Header */}
          <div className="w-full flex justify-between items-center mb-6">
            <img
              src={backIcon}
              alt="back"
              className="w-8 h-8 cursor-pointer bg-white/20 hover:bg-white/40 rounded-full p-1 transition"
              onClick={() => navigate(-1)}
            />
            <h1 className="title1 font-bold text-3xl tracking-wider">
              ENSO
            </h1>
            <div className="w-6" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-semibold mt-2 mb-1 font-[Gantari]">Split Bill</h2>
          <p className="text-gray-200 mb-8 text-lg font-[Gantari]">
            Total: {total.toFixed(2)} ฿
          </p>

          {/* List */}
          <div className="w-full max-w-md flex flex-col gap-4">
          {splits.map((split) => (
            <div
              key={split.memberId}
              onClick={() => navigate(`/payment/${billId}/${split.memberId}`)}
              className={`flex justify-between items-center px-6 py-4 rounded-full cursor-pointer text-lg font-[Gantari] transition relative
                ${
                  split.paid
                    ? "bg-white text-black border-2 border-green-600 shadow-[0_0_10px_rgba(74,222,128,0.3)]"
                    : "bg-black/80 text-white border border-white/30 hover:bg-black/60"
                }`}
            >
              <span className="font-semibold">{split.name}</span>

              {/* PAID */}
              <span className="flex items-center gap-2">
                {split.amount} ฿
                {split.paid && (
                  <span className="w-5 h-5 bg-green-600 text-white rounded-full flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-3 h-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
        </div>
      </div>
    </>
  );
};

export default SplitBillPage;