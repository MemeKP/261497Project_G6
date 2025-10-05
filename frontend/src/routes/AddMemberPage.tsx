
import React, { useState, useEffect } from "react";
import { BsPlusCircleFill, BsDashLg } from "react-icons/bs";
import { Link, useParams } from "react-router-dom";
import PageAnimation from "../common/PageAnimetion";
import axios from "axios";
import type { Member, SessionResponse } from "../types";

const AddMemberPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [input, setInput] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [groupId, setGroupId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGroupAndMembers = async () => {
    setIsLoading(true);
    try {
      if (!sessionId) {
        console.warn("[FRONTEND] Session ID is missing in URL parameters.");
        setIsLoading(false);
        return;
      }

      const res = await axios.get<SessionResponse>(
        `/api/dining_session/${sessionId}`
      );

      console.log("[FRONTEND] API Response Data (RES.DATA):", res.data);

      const group = res.data.group;

      if (group && group.id && Array.isArray(group.members)) {
        setGroupId(group.id);
        setMembers(
          group.members.map((m: unknown) => {
            const member = m as {
              id: number;
              name: string;
              note?: string | null;
            };
            return {
              id: String(member.id),
              name: member.name,
              note: member.note || null,
            };
          })
        );

        console.log(
          `[FRONTEND] SUCCESS: Group loaded with ID: ${group.id}, Members count: ${group.members.length}`
        );
      } else {
        console.warn(
          `[FRONTEND] WARNING: Group structure in response is incorrect or group is null. Check res.data above. Response Group object:`,
          group
        );
        setGroupId(null);
      }
    } catch (err) {
      console.error(
        "[FRONTEND] ERROR: Failed to fetch group/session data. Check Network tab for API call details.",
        err
      );
      setGroupId(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupAndMembers();
  }, [sessionId]);

  const handleAdd = async () => {
    if (!input.trim() || groupId === null) {
      console.warn("Input is empty or Group ID is not set. Cannot add member.");
      return;
    }

    try {
      const res = await axios.post<Member>("/api/group_members/add", {
        name: input,
        groupId,
        diningSessionId: sessionId,
      });

      await fetchGroupAndMembers();

      setInput("");
      console.log("Member added successfully:", res.data.name);
    } catch (err) {
      console.error("Failed to add member:", err);
    }
  };

  const handleRemove = async (memberId: string, index: number) => {
    try {
      await axios.delete(`/api/group_members/member/${memberId}`);

      setMembers(members.filter((_, i) => i !== index));
      console.log("Member removed:", memberId);
    } catch (err) {
      console.error("Failed to remove member:", err);
    }
  };
  const isReadyToInteract = !isLoading && groupId !== null;

  return (
    <div className="w-full h-[852px] bg-[#1B1C20] flex justify-center">
      <div className="w-80 items-center justify-center">
        {/* ADD */}
        <PageAnimation index={0}>
          <div className="flex flex-col items-center">
            <div className="flex items-center space-x-2 mt-20">
              <BsPlusCircleFill
                className={`text-2xl cursor-pointer transition-colors ${
                  isReadyToInteract
                    ? "text-white hover:text-green-400"
                    : "text-gray-500 cursor-not-allowed"
                }`}
                onClick={isReadyToInteract ? handleAdd : undefined}
              />
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                placeholder={
                  isLoading
                    ? "Loading session data..."
                    : "Add your friend's names"
                }
                disabled={!isReadyToInteract} // Disabled ถ้ายังไม่พร้อม
                className="text-gray-200 font-[Epilogue] border-none outline-none bg-transparent placeholder-gray-500 disabled:opacity-50"
              />
            </div>
            {isLoading && (
              <p className="text-sm text-yellow-500 mt-2 animate-pulse">
                Loading session data and Group ID...
              </p>
            )}
            {!isLoading && groupId === null && (
              <p className="text-sm text-red-500 mt-2">
                Error: Group ID not found. Check if the session exists and has
                an associated group.
              </p>
            )}
          </div>
        </PageAnimation>
        {/* NAME */}
        <PageAnimation index={1}>
          <div className="flex flex-col items-center mt-10 space-y-4">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between bg-black w-80 rounded-xl px-4 py-3 text-white font-semibold text-lg font-[Epilogue] shadow-md hover:shadow-lg transition-shadow duration-200"
              >
                <span>{member.name}</span>
                {isReadyToInteract && (
                  <BsDashLg
                    className="text-2xl text-red-500 cursor-pointer hover:text-red-400 transition-colors"
                    onClick={() =>
                      handleRemove(
                        member.id,
                        members.findIndex((m) => m.id === member.id)
                      )
                    }
                  />
                )}
              </div>
            ))}
          </div>
        </PageAnimation>
        {/* BUTTON */}
        <PageAnimation index={2}>
          <div className="flex bottom-4 justify-end mt-8">
            <Link to={`/homepage/${groupId}`}>
              <button
                disabled={!isReadyToInteract}
                className={`bg-gradient-to-r from-black to-gray-700 
                text-white rounded-full px-10 py-2 text-sm font-[Epilogue] cursor-pointer 
                transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg
                ${
                  !isReadyToInteract
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:from-gray-900 hover:to-gray-500"
                }`}
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
