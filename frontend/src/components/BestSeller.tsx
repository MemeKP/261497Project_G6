import { FaArrowRightLong } from "react-icons/fa6";
import { Link, useParams } from "react-router-dom";
import type { MenuItemsProps } from "../types";
import IKImageWrapper from "./IKImageWrapper";

const BestSeller: React.FC<MenuItemsProps> = ({menu}) => {
  const { sessionId } = useParams<{ sessionId: string }>();

  return (
    <div className="mt-20 flex-1">
      <div className="h-full relative bg-black rounded-bl-3xl rounded-br-3xl flex flex-col justify-between p-2 shadow-[3px_3px_5px_0px_rgba(65,65,65,1.00)]">
        <IKImageWrapper
          src={menu.imageUrl}
          width={200}
          className="w-45 absolute sm:w-44 md:w-48 -top-22 left-1/2 -translate-x-1/2"
          alt="best seller menu"
        />
        <div className="text-white mt-18 text-start px-2">
          <div className="text-base sm:text-lg font-semibold">{menu.name}</div>
          <div className="text-[10px] sm:text-sm font-normal leading-snug">
           {menu.description}
          </div>
        </div>
        <Link to={`/details/${sessionId}/${menu.id}`}>
        <div className="flex justify-end pr-2">
          
          <FaArrowRightLong className="text-white w-4" />
        </div>
      </Link>
        
      </div>
    </div>
  );
};

export default BestSeller;