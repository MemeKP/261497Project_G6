import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaMinus, FaPlus } from "react-icons/fa";
import { IoIosArrowBack } from "react-icons/io";  // back arrow
import { FaBasketShopping } from "react-icons/fa6"; // basket
import menu1 from "../assets/imgs/menu1.png";
import menu2 from "../assets/imgs/menu2.png";

interface CartItem {
  id: number;
  name: string;
  price: number;
  qty: number;
  image: string;
}

const CartPage = () => {
  const navigate = useNavigate();

  // Example data (normally comes from store/context)
  const [cart, setCart] = useState<CartItem[]>([
    { id: 1, name: "Lorem Ipsum", price: 159, qty: 2, image: menu1 },
    { id: 2, name: "Lorem Ipsum", price: 179, qty: 1, image: menu2 },
  ]);

  // Update item quantity
  const updateQty = (id: number, delta: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item
      )
    );
  };

  // Calculate total price
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <div className="w-full h-[852px] relative bg-[#1E1E1E] overflow-hidden">

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center p-4 text-white h-full">
        {/* Header */}
        <div className="flex justify-between items-center w-full mb-6">
        {/* Back button */}
        <button onClick={() => navigate(-1)} className="text-2xl">
            <IoIosArrowBack />
        </button>

        {/* Title */}
        <h1 className="title1 text-2xl">ENSO</h1>

        {/* Basket icon */}
        <button onClick={() => navigate("/cart")} className="text-2xl">
            <FaBasketShopping />
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
                            shadow-[0_4px_20px_rgba(255,255,255,0.25)]  max-w-md ml-6 "
                >
                {/* Food image overlapping on the left */}
                <div className="absolute -left-4">
                    <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 rounded-full object-cover 
                                shadow-[0_4px_10px_rgba(0,0,0,0.6)]"
                    />
                </div>

                {/* Text content (shifted right to give space for image) */}
                <div className="ml-16">
                    <p className="font-bold text-lg text-white">{item.name}</p>
                    <p className="text-sm text-gray-300">{item.price}.-</p>
                </div>

                {/* Quantity controls */}
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

        {/* Total and Checkout */}
        <div className="mt-auto w-full">
          <div className="flex justify-between items-center text-lg border-t border-gray-500 pt-4">
            <span>Total</span>
            <span>{total}.-</span>
          </div>

          <button
            onClick={() => navigate("/orderstatus")}
            className="w-[200px] h-12 mt-4 mx-auto block rounded-full text-lg font-semibold text-black 
                       shadow-[0px_4px_18px_0px_rgba(217,217,217,1.00)] 
                       bg-gradient-to-r from-white to-black hover:opacity-90 transition"
          >
            CHECKOUT
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartPage;