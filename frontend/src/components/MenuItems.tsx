import React from 'react'
import { FaArrowRightLong } from 'react-icons/fa6'
import sg1 from "../assets/imgs/signature.png";
import sg2 from "../assets/imgs/menu1.png";

const MenuItems = () => {
  return (
     <div className="w-40 h-56 relative mt-5">
            <div className="w-36 h-46 left-[8px] top-[45px] absolute bg-black rounded-bl-3xl rounded-br-3xl"></div>
            <FaArrowRightLong className="text-white w-2.5 h-3.5 left-[125px] top-[200px] absolute" />
            <div className="w-28 left-[22px] top-[159px] absolute justify-start text-white font-['Epilogue']">
              <div className="text-[10px] font-semibold">Lorem Ipsum</div>
              <div className="text-[7px] font-normal">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. maximus
                consectetur nisi in porta.
              </div>
            </div>

            <img
              src={sg2}
              alt="menu"
              className="w-40 h-40 left-0 top-0 absolute"
            />
          </div>
  )
}

export default MenuItems