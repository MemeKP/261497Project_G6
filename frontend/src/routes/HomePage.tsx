import React from "react";
import { LuSearch } from "react-icons/lu";
import NavigationBar from "../components/InPageNavigation";
import sg1 from "../assets/imgs/signature.png";
import homepage from "../assets/imgs/homepage.png";
import sg2 from "../assets/imgs/menu1.png";
import { FaArrowRightLong } from "react-icons/fa6";

const HomePage = () => {
  return (
    <div className="w-full min-h-screen bg-[#1B1C20] text-white font-[Epilogue]">
      {/* HERO */}
      <section
        className="w-full min-h-[600px] relative bg-cover bg-center"
        style={{ backgroundImage: `url(${homepage})` }}
      >
        {/* SEARCH */}
        <div className="flex justify-center pt-6">
          <div className="flex items-center bg-zinc-300 rounded-full px-3 py-2 text-sm text-[#6D6D71] w-80">
            <LuSearch className="mr-2 text-lg" />
            search your favorite food
          </div>
        </div>

        {/* NAVIGATION */}
        <NavigationBar />

        {/* SIGNATURE MENU */}
        <div className="flex flex-col items-center mt-6">
         
            <img
              src={sg1}
              alt="Signature menu"
              className="w-72 h-96 relative"
            />
            <div className="absolute left-[229px] top-[480px] w-64 bg-black shadow-[3px_3px_5px_0px_rgba(244,233,32,1.00)] rounded-xl p-3 mt-4">
              <div className="font-semibold text-base">
                Enso’s Secret Beef Ramen
              </div>
              <div className="font-light text-xs pr-6">
                A luxurious bowl featuring marinated beef, soft-boiled egg.
              </div>
              <FaArrowRightLong className="absolute bottom-2 right-2 w-4 h-4 text-white cursor-pointer" />
            </div>
      
        </div>
      </section>

      {/* BEST SELLER */}
      <section className="px-4 py-3">
        <h2 className="text-lg font-bold mb-4">Best Seller</h2>
        <div className="flex gap-4 overflow-x-auto scrollbar-hide">
          {/* Card 1 */}
          <div>
            <img
              src={sg2}
              alt="menu"
              className="w-50 h-50 object-cover rounded-lg"
            />
            <div className="bg-black rounded-xl p-3 min-w-[160px] shadow-2xl">
              <div className="mt-2 text-sm font-semibold">Lorem Ipsum</div>
              <div className="text-xs text-gray-300">
                Short description of the food here.
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div>
            <img
              src={sg2}
              alt="menu"
              className="w-50 h-50 object-cover rounded-lg"
            />
            <div className="bg-black rounded-xl p-3 min-w-[160px]">
              <div className="mt-2 text-sm font-semibold">Lorem Ipsum</div>
              <div className="text-xs text-gray-300">
                Short description of the food here.
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
