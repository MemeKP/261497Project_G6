import React, { useState, useEffect } from "react";
import { BsPlusCircleFill, BsDashLg } from "react-icons/bs";
import { Link, useParams } from "react-router-dom";
import PageAnimation from "../common/PageAnimetion";
import axios from "axios";
import type { Member } from "../types";

const AddMemberPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [input, setInput] = useState("");
  const [members, setMembers] = useState<Member[]>([]);

  const fetchMembers = async () => {
    try {
      if (!sessionId) return;
      const res = await axios.get<Member[]>(`/api/group/session/${sessionId}`);
      setMembers(res.data.map((m) => ({ id: String(m.id), name: m.name })));
    } catch (err) {
      console.error("Failed to fetch members:", err);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [sessionId]);

  const handleAdd = async () => {
    if (!input.trim() || !sessionId) return;

    try {
      const res = await axios.post<Member>("/api/group/add", {
        name: input,
        diningSessionId: Number(sessionId),
      });
      setMembers([
        ...members,
        { id: String(res.data.id), name: res.data.name },
      ]);
      setInput("");
    } catch (err) {
      console.error("Failed to add member:", err);
    }
  };

  const handleRemove = async (memberId: string, index: number) => {
    try {
      await axios.delete(`/api/group/${memberId}`);
      setMembers(members.filter((_, i) => i !== index));
    } catch (err) {
      console.error("Failed to remove member:", err);
    }
  };

  return (
    <div className="w-full h-[852px] bg-[#1B1C20] flex justify-center">
      <div className="w-80 items-center justify-center">
        {/* ADD */}
        <PageAnimation index={0}>
          <div className="flex flex-col items-center">
            <div className="flex items-center space-x-2 mt-20">
              <BsPlusCircleFill
                className="text-white text-2xl cursor-pointer"
                onClick={handleAdd}
              />
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                placeholder="Add your friend's names"
                className="text-gray-200 font-[Epilogue] border-none outline-none bg-transparent"
              />
            </div>
          </div>
        </PageAnimation>
        {/* NAME */}
        <PageAnimation index={1}>
          <div className="flex flex-col items-center mt-10 space-y-4">
            {members.map((member, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-black w-80 rounded-xl px-4 py-3 text-white font-semibold text-lg font-[Epilogue]"
              >
                <span>{member.name}</span>
                <BsDashLg
                  className="text-2xl text-red-500 cursor-pointer"
                  onClick={() => handleRemove(member.id, index)}
                />
              </div>
            ))}
          </div>
        </PageAnimation>
        {/* BUTTON */}
        <PageAnimation index={2}>
          <div className="flex bottom-4 justify-end mt-8">
            <Link to={`/homepage/${sessionId}`}>
              <button
                className=" bg-gradient-to-r from-black to-gray-700 
    text-white rounded-full px-10 py-2 text-sm font-[Epilogue] cursor-pointer 
    transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg hover:from-gray-900 hover:to-gray-500"
              >
                continue
              </button>
            </Link>
          </div>
        </PageAnimation>
      </div>
    </div>
  );
};

export default AddMemberPage;
