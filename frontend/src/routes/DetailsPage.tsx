import { useEffect, useState } from "react";
import {
  IoClose,
  IoAddCircle,
  IoRemoveCircle,
  IoPersonAddSharp,
} from "react-icons/io5";
import { Link, useParams, useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import type { Member, SessionResponse } from "../types";
import { useQuery } from "@tanstack/react-query";
import IKImageWrapper from "../components/IKImageWrapper";
import { AnimatePresence, motion } from "motion/react";

const fetchMenuById = async (menuId: string) => {
  const res = await axios.get(`/api/menu_items/${menuId}`);
  return res.data;
};

const DetailsPage = () => {
  const navigate = useNavigate();
  const { menuId, sessionId } = useParams<{ menuId: string; sessionId: string }>();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("editId")

  const [isOpen, setIsOpen] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectMembers, setSelectMembers] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const [loadingItem, setLoadingItem] = useState(false);

  useEffect(() => {
    if (sessionId) {
      axios
        .get<SessionResponse>(`/api/dining_session/${sessionId}`)
        .then((res) => {
          const group = res.data.group;
          if (group && Array.isArray(group.members)) {
            setMembers(
              group.members.map((m: any) => ({
                id: String(m.id),
                name: m.name,
              }))
            );
          }
        })
        .catch(console.error);
    }
  }, [sessionId]);

  const { data: menu, isLoading, error } = useQuery({
    queryKey: ["menu", menuId],
    queryFn: () => fetchMenuById(menuId!),
    enabled: !!menuId,
  });

  useEffect(() => {
    if (editId) {
      setLoadingItem(true);
      axios
        .get(`/api/order-items/${editId}`)
        .then((res) => {
          const item = res.data;
          setQuantity(item.quantity || 1);
          setNote(item.note || "");
          if (item.memberId) setSelectMembers([String(item.memberId)]);
        })
        .catch((err) => console.error("Error loading item for edit:", err))
        .finally(() => setLoadingItem(false));
    }
  }, [editId]);

  const toggleSelectMember = (id: string) => {
    setSelectMembers((prev) =>
      prev.includes(id) ? prev.filter((mid) => mid !== id) : [...prev, id]
    );
  };

  const increaseQuantity = () => setQuantity((prev) => prev + 1);
  const decreaseQuantity = () => setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  const calculateTotalPrice = () =>
    menu ? (parseFloat(menu.price) * quantity).toFixed(0) : "0";

  const handleSave = async () => {
    if (selectMembers.length === 0) {
      alert("Please select your member for this menu");
      return;
    }

    try {
      if (editId) {
        await axios.patch(`/api/order-items/${editId}`, {
          quantity,
          note,
          memberId: selectMembers[0],
        });
        alert("Item updated successfully!");
        navigate(`/cart/${sessionId}`);
        return;
      }

      const items = selectMembers.map((memberId) => ({
        menuId: menu.id,
        qty: quantity,
        note,
        memberId,
      }));

      await axios.post("/api/orders", {
        diningSessionId: sessionId,
        items,
      });

      alert(`🛒 Added ${menu.name} to cart!`);
      navigate(`/cart/${sessionId}`);
    } catch (error: any) {
      console.error("Error saving item:", error.response?.data || error);
      alert("Failed to save. Please try again.");
    }
  };

  if (isLoading || loadingItem) return <p className="text-white p-6">Loading...</p>;
  if (error) return <p className="text-red-500 p-6">Error loading menu</p>;
  if (!menu) return <p className="text-gray-400 p-6">Menu not found</p>;

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col">
      {/* ปุ่มปิด */}
      <Link to={`/cart/${sessionId}`}>
        <IoClose className="absolute right-6 top-6 w-9 h-9 text-gray-300 z-20 cursor-pointer" />
      </Link>

      {/* BG IMG */}
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center blur-md brightness-75 scale-130"
        style={{ backgroundImage: `url(${menu.imageUrl})` }}
      ></div>

      {/* CONTENT */}
      <div className="relative flex-1 flex flex-col justify-start p-6">
        <div className="flex justify-center pt-20 relative">
          <IKImageWrapper
            src={menu.imageUrl}
            alt="menu image"
            className="w-70 rounded-xl"
          />
          <button
            className="absolute w-11 h-11 bg-black/50 rounded-full right-12 top-90 flex justify-center items-center cursor-pointer"
            onClick={() => setIsOpen(true)}
          >
            <IoPersonAddSharp className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* MODAL: เลือกสมาชิก */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-md flex justify-center items-center z-50"
              onClick={() => setIsOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                transition={{
                  type: "spring",
                  damping: 25,
                  stiffness: 300,
                  duration: 0.3,
                }}
                className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-6 w-80 max-h-[70vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-xl font-semibold text-white mb-4">
                  Select Members
                </h2>
                <div className="space-y-2">
                  {members.map((member) => (
                    <label
                      key={member.id}
                      className="flex items-center gap-3 p-1 rounded-xl cursor-pointer text-lg font-medium transition-all duration-200 hover:bg-white/10 group"
                    >
                      <input
                        type="checkbox"
                        value={member.id}
                        checked={selectMembers.includes(member.id)}
                        onChange={() => toggleSelectMember(member.id)}
                        className="w-5 h-5 accent-purple-500 cursor-pointer transition-transform duration-150 hover:scale-110"
                      />
                      <span className="text-gray-100 group-hover:text-white transition">
                        {member.name}
                      </span>
                    </label>
                  ))}
                </div>
                <div className="flex justify-end mt-6 gap-3">
                  <button
                    className="px-4 py-2 rounded-xl text-gray-300 hover:bg-white/10 transition"
                    onClick={() => setIsOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-5 py-2 rounded-xl text-white bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 shadow-lg hover:opacity-90 transition"
                    onClick={() => setIsOpen(false)}
                  >
                    Confirm
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TEXT SECTION */}
        <div className="text-white flex flex-col justify-start pt-10 p-3">
          <h1 className="text-3xl font-bold">{menu.name}</h1>
          <p className="font-normal text-base">{menu.description}</p>
          <h2 className="pt-6 text-xl font-semibold">Note</h2>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full min-h-[120px] mt-3 p-3 bg-zinc-300 rounded-2xl text-base focus:outline-none focus:ring-2 text-neutral-500 resize-y"
            placeholder="Please specify if you have any special requests."
          ></textarea>
        </div>
      </div>

      {/* FOOTER */}
      <div className="bottom-0 w-full h-20 flex items-center justify-between z-20 p-9">
        <div className="flex items-center gap-4">
          <IoRemoveCircle
            className="text-white w-8 h-8 cursor-pointer"
            onClick={decreaseQuantity}
          />
          <span className="text-white text-lg font-bold">{quantity}</span>
          <IoAddCircle
            onClick={increaseQuantity}
            className="text-white w-8 h-8 cursor-pointer"
          />
        </div>

       <button
          type="submit"
          onClick={handleSave}
          className="rounded-2xl text-white font-semibold px-6 py-3 cursor-pointer shadow-lg 
                    transition bg-gradient-to-r from-black to-stone-500 hover:opacity-90"
        >
          {editId ? "Update Item" : "Add to Cart"}
          <span className="ml-4 font-normal">{calculateTotalPrice()}.-</span>
        </button>

      </div>
    </div>
  );
};

export default DetailsPage;
