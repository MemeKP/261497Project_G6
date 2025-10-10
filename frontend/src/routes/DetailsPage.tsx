import { useEffect, useState } from "react";
import {
  IoClose,
  IoAddCircle,
  IoRemoveCircle,
  IoPersonAddSharp,
} from "react-icons/io5";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import type { Member, SessionResponse } from "../types";
import { useQuery } from "@tanstack/react-query";
import IKImageWrapper from "../components/IKImageWrapper";
import { AnimatePresence, motion } from "motion/react";

const fetchMenuById = async (menuId: string) => {
  try {
    const res = await axios.get(`/api/menu_items/${menuId}`);
    // console.log("Fetched menu:", res.data);
    return res.data;
  } catch (error) {
    console.error("Error fetching menu:", error);
    if (axios.isAxiosError(error)) {
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
    }
    throw error;
  }
};
const DetailsPage = () => {
  const { menuId, sessionId } = useParams<{
    menuId: string;
    sessionId: string;
  }>();
  const [isOpen, setIsOpen] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectMembers, setSelectMembers] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const [currentOrder, setCurrentOrder] = useState(null);

  useEffect(() => {
    if (sessionId) {
      axios
        .get<SessionResponse>(`/api/dining_session/${sessionId}`)
        .then((res) => {
          // console.log("Session data:", res.data);
          const group = res.data.group;
          // console.log(group);
          if (group && Array.isArray(group.members)) {
            setMembers(
              group.members.map((m: unknown) => {
                const member = m as {
                  id: number;
                  name: string;
                };
                return {
                  id: String(member.id),
                  name: member.name,
                };
              })
            );
          }
        })
        .catch((err) => console.error(err));
    }
  }, [sessionId]);

  const {
    data: menu,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["menu", menuId],
    queryFn: () => fetchMenuById(menuId!),
    enabled: !!menuId,
  });

  if (isLoading) return <p className="text-white">Loading...</p>;
  if (error) return <p className="text-red-500">Error loading menu</p>;
  if (!menu) return <p className="text-gray-400">Menu not found</p>;

  const toggleSelectMember = (id: string) => {
    setSelectMembers((prev) =>
      prev.includes(id) ? prev.filter((mid) => mid !== id) : [...prev, id]
    );
  };

  const increaseQuantity = () => {
    setQuantity((prev) => prev + 1);
  };
  const decreaseQuantity = () => {
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  };
  const calculateTotalPrice = () => {
    return (parseFloat(menu.price) * quantity).toFixed(0);
  };

 const handleAddToCart = async () => {
  if (selectMembers.length === 0) {
    alert("Please select your member for this menu");
    return;
  }

  try {
    // สร้างรายการ items ที่จะเพิ่ม
    const items = selectMembers.map(memberId => ({
      menuId: menu.id,
      qty: quantity,
      note,
      memberId,
    }));

    // ตรวจสอบว่ามี order เดิมไหม
    let existingOrder = null;
    try {
      const res = await axios.get(`/api/orders/session/${sessionId}`);
      existingOrder = res.data;
    } catch (err) {
      console.warn("No existing order found, will create new one");
    }

    //  ถ้ามี order เดิม → เพิ่มเข้า order_items เดิม
    if (existingOrder && existingOrder.id) {
      for (const item of items) {
        await axios.post("/api/order-items", {
          orderId: existingOrder.id,
          menu_item_id: item.menuId,
          member_id: item.memberId,
          quantity: item.qty,
          note: item.note,
        });
      }
      alert(` Added ${menu.name} to existing order.`);
      return;
    }

    //  3. ถ้ายังไม่มี order → ค่อยสร้าง order ใหม่
    const createOrderRes = await axios.post("/api/orders", {
      diningSessionId: sessionId,
      items,
    });

    alert(`Added ${menu.name} to cart!`);
  } catch (error: any) {
    console.error("Error adding to cart:", error.response?.data || error);
    alert("Failed to add to cart. Please try again.");
  }
};


  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col">
      <Link to={`/homepage/${sessionId}`}>
        <IoClose className="absolute right-6 top-6 w-9 h-9 text-gray-300 z-20" />
      </Link>
      {/* BG IMG */}
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center blur-md brightness-75 scale-130"
        style={{ backgroundImage: `url(${menu.imageUrl})` }}
      ></div>

      {/* CONTENT */}
      <div className="relative flex-1 flex flex-col justify-start p-6">
        <div className="flex justify-center pt-20">
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
                initial={{
                  opacity: 0,
                  scale: 0.8,
                  y: 20,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  scale: 0.8,
                  y: 20,
                }}
                transition={{
                  type: "spring",
                  damping: 25,
                  stiffness: 300,
                  duration: 0.3,
                }}
                className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-6 w-80 max-h-[70vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* HEADER */}
                <motion.div
                  className="flex justify-between items-center mb-4"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <h2 className="text-xl font-semibold text-white">
                    Select Members
                  </h2>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsOpen(false)}
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    <IoClose className="w-6 h-6" />
                  </motion.button>
                </motion.div>

                {/* LIST */}
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
                      <span className="text-gray-100 group-hover:text-white transition-colors duration-200 group-hover:translate-x-1">
                        {member.name}
                      </span>
                    </label>
                  ))}
                </div>

                {/* FOOTER */}
                <motion.div
                  className="flex justify-end mt-6 gap-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 rounded-xl text-gray-300 hover:bg-white/10 transition"
                    onClick={() => setIsOpen(false)}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{
                      scale: 1.05,
                      background:
                        "linear-gradient(to right, #8b5cf6, #ec4899, #f43f5e)",
                    }}
                    whileTap={{ scale: 0.95 }}
                    className="px-5 py-2 rounded-xl text-white bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 shadow-lg hover:opacity-90 transition"
                    onClick={() => {
                      console.log("Selected members:", selectMembers);
                      setIsOpen(false);
                    }}
                  >
                    Confirm
                  </motion.button>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="text-white flex flex-col justify-start pt-10 p-3">
          <h1 className="text-3xl font-bold">{menu.name}</h1>
          <p className="font-normal text-base">{menu.description}</p>
          <h2 className="pt-6 text-xl font-semibold">Note</h2>
          <form>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full min-h-[120px] mt-3 p-3 border-none bg-zinc-300 rounded-2xl text-base focus:outline-none focus:ring-2 transition-all resize-y text-neutral-500"
              placeholder="Please specify if you have any special requests."
            ></textarea>
          </form>
        </div>
      </div>
      <div className=" bottom-0 w-full h-20 flex items-center justify-between z-20 p-9">
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
          onClick={handleAddToCart}
          className="bg-gradient-to-r from-black to-stone-500 rounded-2xl text-white font-semibold px-4 py-2 cursor-pointer"
        >
          Add to cart
          <span className="ml-4 font-normal">
            {calculateTotalPrice()} .-
          </span>{" "}
        </button>
      </div>
    </div>
  );
};

export default DetailsPage;