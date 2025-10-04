import { FaArrowRightLong } from "react-icons/fa6";
import type {  MenuItemsProps } from "../types";
import IKImageWrapper from "./IKImageWrapper";
import { Link, useParams } from "react-router-dom";

const MenuItems: React.FC<MenuItemsProps> = ({ menu }) => {
  const { sessionId } = useParams<{ menuId: string; sessionId: string }>();
  return (
    <div className="w-[90%] sm:w-100 md:w-96 h-32 mt-5">
       <div className="h-24 relative bg-black rounded-tr-3xl rounded-br-3xl ml-6 sm:ml-6 md:ml-10">
        <IKImageWrapper 
        src={menu.imageUrl}
        width={125}
        className="absolute -top-1/8 left-1/14 -translate-x-1/2 w-32 h-32 sm:w-36 sm:h-36 md:w-38 md:h-38"
        alt="menu image"
        />
        <div className="justify-start text-white pl-24 p-4">
          <div className="text-xs sm:text-sm md:text-base font-semibold">
            {menu.name}
          </div>
          <div className="text-[10px] line-clamp-2 sm:text-xs md:text-sm font-normal">
            {menu.description}
          </div>
          <div className="flex justify-end items-center">
            {/* <div className="flex w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 bg-white rounded-full items-center justify-center">
              <p className="flex text-black font-semibold text-xs sm:text-sm md:text-base">
                1
              </p>
            </div> */}
            <Link to={`/details/${sessionId}/${menu.id}`}>
            <FaArrowRightLong className="h-6 sm:h-7 md:h-8 text-white ml-3" />
      
            </Link>
                </div>
        </div>
      </div>
    </div>
  );
};

export default MenuItems;
