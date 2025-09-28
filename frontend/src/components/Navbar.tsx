import React from "react";
import basket from "../assets/imgs/basket.png";

const Navbar = () => {
  return (
    <div className="min-h-5 flex flex-row justify-between pr-3 p-2 pl-3 ">
      <div className="text-white font-[hogback] text-2xl font-normal">ENSO</div>
      <div className="relative">
        <img src={basket} alt="basket icon" className="w-10 h-10" />
        <div className="w-5 h-5 rounded-full absolute -top-1 -right-1 flex justify-center items-center text-white text-xs font-semibold bg-red-800">
          3
        </div>
      </div>
    </div>
  );
};

export default Navbar;
