// import { useNavigate, useParams } from "react-router-dom";
// import { useEffect, useState } from "react";
// import basket from "../assets/imgs/basket.png";

// const Navbar = () => {
//   const navigate = useNavigate();
//   const { sessionId } = useParams<{ sessionId: string }>();
//   const [itemCount, setItemCount] = useState<number>(0);

//   useEffect(() => {
//     const fetchCartCount = async () => {
//       if (!sessionId) return;

//       try {
//         const orderRes = await fetch(`/api/orders/session/${sessionId}/cart`, {
//           credentials: "include",
//         });
//         if (!orderRes.ok) throw new Error("No draft order found");
//         const latestOrder = await orderRes.json();

//         const res = await fetch(`/api/order-items/orders/${latestOrder.id}/items`, {
//           credentials: "include",
//         });
//         if (!res.ok) throw new Error("Failed to fetch order items");

//         const data = await res.json();

//         const total = data.reduce(
//           (sum: number, item: any) => sum + (item.quantity ?? item.qty ?? 1),
//           0
//         );

//         setItemCount(total);
//       } catch (err) {
//         console.error("Error fetching cart count:", err);
//         setItemCount(0);
//       }
//     };

//     fetchCartCount();

//   }, [sessionId]);

//   const handleBasketClick = () => {
//     if (sessionId) {
//       navigate(`/cart/${sessionId}`);
//     } else {
//       alert("No session found.");
//     }
//   };

//   return (
//     <div className="min-h-5 flex flex-row justify-between pr-3 p-2 pl-3">
//       <div className="text-white font-[hogback] text-2xl font-normal">ENSO</div>

//       <div className="relative cursor-pointer" onClick={handleBasketClick}>
//         <img src={basket} alt="basket icon" className="w-10 h-10" />

//         {itemCount > 0 && (
//           <div className="w-5 h-5 rounded-full absolute -top-1 -right-1 flex justify-center items-center text-white text-xs font-semibold bg-red-800">
//             {itemCount}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Navbar;


import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import basket from "../assets/imgs/basket.png";

const Navbar = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const [itemCount, setItemCount] = useState<number>(0);

  useEffect(() => {
  const fetchCartCount = async () => {
    if (!sessionId) return;

    try {
      const orderRes = await fetch(`/api/orders/session/${sessionId}/cart`, {
        credentials: "include",
      });

      if (!orderRes.ok) {
        console.warn("⚠️ No draft order found:", orderRes.statusText);
        setItemCount(0);
        return;
      }

      const data = await orderRes.json();
      const orderId = data?.order?.id || data?.id;

      // 🟢 ถ้าไม่มี order → ไม่มีตะกร้า
      if (!orderId) {
        setItemCount(0);
        return;
      }

      const res = await fetch(`/api/order-items/orders/${orderId}/items`, {
        credentials: "include",
      });

      if (!res.ok) {
        console.warn("⚠️ Failed to fetch order items");
        setItemCount(0);
        return;
      }

      const items = await res.json();
      const total = items.reduce(
        (sum: number, item: any) => sum + (item.quantity ?? item.qty ?? 1),
        0
      );

      setItemCount(total);
    } catch (err) {
      console.warn("Skipping cart count:", err);
      setItemCount(0);
    }
  };

  fetchCartCount();
}, [sessionId]);


  const handleBasketClick = () => {
    if (sessionId) {
      navigate(`/cart/${sessionId}`);
    } else {
      alert("No session found.");
    }
  };

  return (
    <div className="min-h-5 flex flex-row justify-between pr-3 p-2 pl-3">
      <div className="text-white font-[hogback] text-2xl font-normal">ENSO</div>

      <div className="relative cursor-pointer" onClick={handleBasketClick}>
        <img src={basket} alt="basket icon" className="w-10 h-10" />

        {itemCount > 0 && (
          <div className="w-5 h-5 rounded-full absolute -top-1 -right-1 flex justify-center items-center text-white text-xs font-semibold bg-red-800">
            {itemCount}
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;