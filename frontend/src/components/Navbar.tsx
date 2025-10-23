import basket from "../assets/imgs/basket.png";
import { Link, useParams } from "react-router-dom";
import { useCart } from "../context/useCart";

const Navbar = () => {
   const { sessionId } = useParams<{ sessionId: string }>();
  const { cartCount, currentOrderId } = useCart();

  // เพิ่ม debug logs
  console.log('Navbar - currentOrderId:', currentOrderId);
  console.log('Navbar - cartCount:', cartCount);

  console.log('currentOrderId:', localStorage.getItem('currentOrderId'));
console.log('activeOrders:', localStorage.getItem('activeOrders'));

  return (
    <div className="min-h-5 flex flex-row justify-between pr-3 p-2 pl-3">
      <div className="text-white font-[hogback] text-2xl font-normal">ENSO</div>
      
      <div className="flex items-center gap-4">
        {/* แสดง order ปัจจุบัน ลองได้ถ้าอยากแต่ไม่สวย*/}
        {/* {currentOrderId && (
          <span className="text-white text-sm">
            Order #{currentOrderId}
          </span>
        )} */}
        
        <div className="relative">
          <Link to={`/cart/${sessionId}`}>
            <img src={basket} alt="basket icon" className="w-10 h-10" />
          </Link>
          {cartCount > 0 && (
            <div className="w-5 h-5 rounded-full absolute -top-1 -right-1 flex justify-center items-center text-white text-xs font-semibold bg-red-800">
              {cartCount}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
