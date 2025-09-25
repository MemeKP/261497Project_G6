import { FaArrowRightLong } from "react-icons/fa6";
import sg3 from "../assets/imgs/menu3.png";

const MenuItems = () => {
  return (
    <div className="w-[90%] sm:w-100 md:w-96 h-32 mt-5">
      <div className="h-28 relative bg-black rounded-tr-3xl rounded-br-3xl ml-6 sm:ml-6 md:ml-10">
        <img
          src={sg3}
          alt="menu1"
          className="absolute -top-1/10 left-1/22 -translate-x-1/2 w-32 h-32 sm:w-36 sm:h-36 md:w-38 md:h-38"
        />

        <div className="justify-start text-white pl-22 sm:pl-25 md:pl-25 p-4">
          <div className="text-xs sm:text-sm md:text-base font-semibold">
            Lorem Ipsum
          </div>
          <div className="text-[10px] sm:text-xs md:text-sm font-normal">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. maximus
            consectetur nisi in porta.
          </div>
          <div className="flex justify-end items-center">
            <div className="flex w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 bg-white rounded-full items-center justify-center">
              <p className="flex text-black font-semibold text-xs sm:text-sm md:text-base">
                1
              </p>
            </div>
            <FaArrowRightLong className="h-6 sm:h-7 md:h-8 text-white ml-3" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuItems;
