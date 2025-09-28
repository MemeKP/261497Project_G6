import React from "react";
import { FaArrowRightLong } from "react-icons/fa6";
import sg2 from "../assets/imgs/menu1.png";
import { Link } from "react-router-dom";

const BestSeller = () => {
  return (
    <div className="mt-20 flex-1">
      <div className="h-full relative bg-black rounded-bl-3xl rounded-br-3xl flex flex-col justify-between p-2 shadow-[3px_3px_5px_0px_rgba(65,65,65,1.00)]">
        <img
          src={sg2}
          alt="menu"
          className="w-50 sm:w-44 md:w-48 absolute -top-18 left-1/2 -translate-x-1/2"
        />

        <div className="text-white mt-23 text-start px-2">
          <div className="text-base sm:text-lg font-semibold">Lorem Ipsum</div>
          <div className="text-[10px] sm:text-sm font-normal leading-snug">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. maximus
            consectetur nisi in porta.
          </div>
        </div>
        <Link to='/details'>
        <div className="flex justify-end pr-2">
          <FaArrowRightLong className="text-white w-4" />
        </div>
        </Link>
        
      </div>
    </div>
  );
};

export default BestSeller;
