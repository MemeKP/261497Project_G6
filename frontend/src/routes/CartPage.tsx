import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaMinus, FaPlus } from "react-icons/fa";
import { IoIosArrowBack } from "react-icons/io";
import basketIcon from "../assets/imgs/basket.png";
import type { CartItem } from "../types";


const CartPage = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmItem, setConfirmItem] = useState<CartItem | null>(null);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        console.log("🧾 Fetching draft order for session:", sessionId);

        const orderRes = await fetch(`/api/orders/session/${sessionId}/cart`, {
          credentials: "include",
        });

        if (!orderRes.ok) throw new Error("No draft order found");

        const latestOrder = await orderRes.json();

        console.log("🧾 Draft order:", latestOrder.id);

        // ดึง order_items ของออเดอร์นี้
        const res = await fetch(`/api/order-items/orders/${latestOrder.id}/items`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error(`Failed to fetch order items: ${res.status}`);

        const data = await res.json();
        console.log("📦 Raw order items from backend:", data);

        const mapped: CartItem[] = data.map((item: any) => ({
          id: item.id,
          menuId: item.menuItemId ?? item.menu_item_id ?? 0,
          name: item.menuName ?? item.menu_name ?? "Unknown Menu",
          price: parseFloat(item.menuPrice ?? item.menu_price ?? 0),
          qty: item.quantity ?? item.qty ?? 1,
          note: item.note ?? "",
          image: item.imageUrl ?? item.menuItem?.imageUrl ?? "/fallback.png",
          memberName: item.memberName ?? item.member_name ?? "",
        }));

        setCart(mapped);
      } catch (err) {
        console.error("Error fetching cart:", err);
        setCart([]);
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) fetchCart();
  }, [sessionId]);

  const updateQty = async (id: number, delta: number) => {
    const target = cart.find((item) => item.id === id);
    if (!target) return;

    const newQty = Math.max(1, target.qty + delta);

    if (target.qty === 1 && delta === -1) {
      setConfirmItem(target);
      return;
    }

    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, qty: newQty } : item))
    );

    try {
      const res = await fetch(`/api/order-items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: newQty }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to update quantity in database");

      console.log(`Updated item ${id} → qty = ${newQty}`);
    } catch (err) {
      console.error("Error updating quantity:", err);
      alert("Failed to update item. Please try again.");

      setCart((prev) =>
        prev.map((item) => (item.id === id ? { ...item, qty: target.qty } : item))
      );
    }
  };

  const total = cart.reduce(
    (sum, item) => sum + (item.price || 0) * (item.qty || 0),
    0
  );

  if (loading) return <div className="text-white p-4">Loading...</div>;

  return (
    <div className="w-full min-h-screen relative bg-[#1E1E1E] overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center w-full p-4 text-white">
        <button onClick={() => navigate(`/homepage/${sessionId}`)} className="text-2xl">
          <IoIosArrowBack />
        </button>
        <h1 className="title1 text-2xl">ENSO</h1>
        <button className="text-2xl">
          <img src={basketIcon} alt="Basket" className="w-7 h-7 inline-block" />
        </button>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center p-4 text-white min-h-screen pb-48">
        <h2 className="text-xl mb-6">Your Order</h2>

        <div className="flex flex-col gap-6 w-full">
          {cart.length === 0 ? (
            <p className="text-gray-400 text-center mt-20">
              No items in your cart yet.
            </p>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="relative flex items-center justify-between 
                           bg-black rounded-[25px] px-6 py-4.5
                           shadow-[0_4px_20px_rgba(255,255,255,0.25)] max-w-md ml-6"
              >
                <div className="absolute -left-4">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 rounded-full object-cover 
                               shadow-[0_4px_10px_rgba(0,0,0,0.6)]"
                  />
                </div>

                <div
                  className="ml-16 cursor-pointer"
                  onClick={() => navigate(`/details/${sessionId}/${item.menuId}`)}
                >
                  <p className="font-bold text-lg text-white">{item.name}</p>
                  <p className="text-sm text-gray-300">{item.price}.-</p>
                  {item.memberName && (
                    <p className="text-xs text-pink-400 font-semibold mb-1">
                      Member: {item.memberName}
                    </p>
                  )}
                  {item.note && (
                    <p className="text-xs text-gray-400 italic">Note: {item.note}</p>
                  )}
                </div>

                {/* + / - */}
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
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#1E1E1E] border-t border-gray-600 z-40">
        <div className="w-full max-w-md mx-auto px-6 py-4">
          <div className="flex justify-between items-center text-lg text-white">
            <span>Total</span>
            <span>{total.toFixed(0)}.-</span>
          </div>

          <button
            onClick={async () => {
              try {
                const res = await fetch(`/api/orders/session/${sessionId}/close`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                });

                if (!res.ok) {
                  const errData = await res.json();
                  alert(`Checkout failed: ${errData.error || res.statusText}`);
                  return;
                }

                alert("Checkout successful!");
                setCart([]);
                navigate(`/orderstatus/${sessionId}`);
              } catch (err) {
                console.error(err);
                alert("error during checkout");
              }
            }}
            className="w-[200px] h-12 mt-4 mx-auto block rounded-full text-lg font-semibold text-black 
                      shadow-[0px_4px_18px_0px_rgba(217,217,217,1.00)] 
                      bg-gradient-to-r from-white to-black hover:opacity-90 transition"
          >
            CHECKOUT
          </button>
        </div>
      </div>

      {/* Confirm Delete Modal */}
      {confirmItem && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] z-50">
          <div className="bg-white rounded-2xl shadow-lg p-6 w-[300px] max-w-[85%] text-center">
            <p className="text-lg font-medium mb-6">
              Are you sure you want to remove{" "}
              <span className="font-bold">{confirmItem.name}</span> from your cart?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setConfirmItem(null)}
                className="px-5 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition"
              >
                Cancel
              </button>

              <button
                onClick={async () => {
                  if (!confirmItem) return;
                  try {
                    const res = await fetch(`/api/order-items/${confirmItem.id}`, {
                      method: "DELETE",
                      credentials: "include",
                    });
                    if (!res.ok)
                      throw new Error("Failed to delete item from database");
                    setCart((prev) =>
                      prev.filter((i) => i.id !== confirmItem.id)
                    );
                  } catch (err) {
                    console.error("Error deleting item:", err);
                    alert("Unable to delete item. Please try again later.");
                  } finally {
                    setConfirmItem(null);
                  }
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
