import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaMinus, FaPlus } from "react-icons/fa";
import { IoIosArrowBack } from "react-icons/io";
import { FaBasketShopping } from "react-icons/fa6";
import basketIcon from "../assets/imgs/basket.png"; // ✅ import รูป


interface CartItem {
  id: number;
  menuId: number;
  name: string;
  price: number;
  qty: number;
  note?: string;
  image?: string;
  memberName?: string;
}

const CartPage = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmItem, setConfirmItem] = useState<CartItem | null>(null);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const res = await fetch(`/api/orders/session/${sessionId}`, {
          credentials: "include",
        });
        const data = await res.json();

        const mapped: CartItem[] =
          data[0]?.items?.map((item: any) => ({
            id: item.id,
            menuId: item.menuItem?.id || item.menuItemId, 
            name: item.menuName || item.menuItem?.name || "Unknown",
            price: parseFloat(item.menuPrice ?? item.menuItem?.price ?? "0"),
            qty: item.quantity,
            note: item.note || "",
            image: item.menuItem?.imageUrl || "/fallback.png",
            memberName: item.member?.name || item.memberName || "", // ✅ ดึงชื่อ member
          })) || [];

        setCart(mapped);
      } catch (err) {
        console.error("Error fetching cart:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [sessionId]);

  const updateQty = (id: number, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          if (item.qty === 1 && delta === -1) {
            setConfirmItem(item);
            return item;
          }
          return { ...item, qty: Math.max(1, item.qty + delta) };
        }
        return item;
      })
    );
  };

  // const confirmDelete = () => {
  //   if (confirmItem) {
  //     setCart((prev) => prev.filter((i) => i.id !== confirmItem.id));
  //     setConfirmItem(null);
  //   }
  // };

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  if (loading) return <div className="text-white p-4">Loading...</div>;

  return (
    <div className="w-full min-h-screen relative bg-[#1E1E1E] overflow-hidden">
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center p-4 text-white min-h-screen pb-48">
        
        {/* Header */}
        <div className="flex justify-between items-center w-full mb-6">
          <button onClick={() => navigate(`/homepage/${sessionId}`)} className="text-2xl">
            <IoIosArrowBack />
          </button>

          <h1 className="title1 text-2xl">ENSO</h1>

          <button onClick={() => {}} className="text-2xl">
            <img
              src={basketIcon}
              alt="Basket"
              className="w-7 h-7 inline-block" 
            />
          </button>
        </div>

        <h2 className="text-xl mb-6">Your Order</h2>

        {/* Cart Items */}
        <div className="flex flex-col gap-6 w-full">
          {cart.map((item) => (
            <div
              key={item.id}
              className="relative flex items-center justify-between 
                        bg-black rounded-[25px] px-6 py-4.5
                        shadow-[0_4px_20px_rgba(255,255,255,0.25)] max-w-md ml-6 "
            >
              <div className="absolute -left-4">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-20 h-20 rounded-full object-cover 
                             shadow-[0_4px_10px_rgba(0,0,0,0.6)]"
                />
              </div>

              {/* คลิกเพื่อไปหน้า detail */}
              <div
                className="ml-16 cursor-pointer"
                onClick={() => navigate(`/details/${item.menuId}/${sessionId}`)}
              >
                <p className="font-bold text-lg text-white">{item.name}</p>
                <p className="text-sm text-gray-300">{item.price}.-</p>
               {item.memberName && (
                <p className="text-xs text-pink-400 font-semibold mb-1">
                  Member: {item.memberName}
                </p>
              )}
              {item.note && (
                <p className="text-xs text-gray-400 italic">
                  Note: {item.note}
                </p>
              )}

              </div>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={() => updateQty(item.id, -1)}
                  className="w-8 h-8 flex items-center justify-center 
                             rounded-full bg-white text-black shadow-md"
                >
                  <FaMinus size={10} />
                </button>
                <span className="text-base font-semibold">{item.qty}</span>
                <button
                  onClick={() => updateQty(item.id, +1)}
                  className="w-8 h-8 flex items-center justify-center 
                             rounded-full bg-white text-black shadow-md"
                >
                  <FaPlus size={10} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
          
      {/* Total and Checkout */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#1E1E1E] border-t border-gray-600 z-40">
        <div className="w-full max-w-md mx-auto px-6 py-4">
          <div className="flex justify-between items-center text-lg text-white">
            <span>Total</span>
            <span>{total}.-</span>
          </div>

          <button
            onClick={() => navigate(`/orderstatus/${sessionId}`)}
            className="w-[200px] h-12 mt-4 mx-auto block rounded-full text-lg font-semibold text-black 
                      shadow-[0px_4px_18px_0px_rgba(217,217,217,1.00)] 
                      bg-gradient-to-r from-white to-black hover:opacity-90 transition"
          >
            CHECKOUT
          </button>
        </div>
      </div>          

      {/* Custom Modal */}
      {confirmItem && (
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] z-50">
        <div className="bg-white rounded-2xl shadow-lg p-6 w-[300px] max-w-[85%] text-center">
          <p className="text-lg font-medium mb-6">
            Are you sure you want to remove <span className="font-bold">{confirmItem.name}</span> from your cart?
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setConfirmItem(null)}
              className="px-5 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setCart((prev) => prev.filter((i) => i.id !== confirmItem.id));
                setConfirmItem(null);
              }}
              className="px-5 py-2 rounded-lg bg-green-500 text-white font-semibold hover:bg-green-600 transition"
            >
              Yes
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
  );
};

export default CartPage;