import { LuSearch } from "react-icons/lu";
import homepage from "../assets/imgs/homepage.png";
import sg1 from "../assets/imgs/signature.png";
import { FaArrowRightLong } from "react-icons/fa6";
import InPageNavigation from "../components/InPageNavigation";
import MenuList from "../components/MenuList";
import BestSellerList from "../components/BestSellerList";
import { Link } from "react-router-dom";

const HomePage = () => {
  return (
    <div className="px-5">
      <section>
        <div className="w-full bg-[#1B1C20] text-white font-[Epilogue]">
          {/* SEARCH */}
          <div className="flex justify-center pt-6">
            <div className="flex items-center bg-zinc-300 rounded-full px-3 py-2 text-sm text-[#6D6D71] w-80">
              <LuSearch className="mr-2 text-lg" />
              search your favorite food
            </div>
          </div>
          {/* NAVIGATION */}
          <InPageNavigation />

          {/* HERO */}
          <div
            className="w-full min-h-129 bg-cover bg-center"
            style={{ backgroundImage: `url(${homepage})` }}
          >
            {/* SIGNATURE MENU */}
            <div className="flex flex-col items-center mt-6 relative">
              <img
                src={sg1}
                alt="Signature menu"
                className="w-72 h-96 relative"
              />
              <div className="absolute left-[150px] top-[330px] w-50 bg-black shadow-[3px_3px_5px_0px_rgba(244,233,32,1.00)] rounded-xl p-3 mt-4">
                <div className="font-semibold text-base">
                  Enso’s Secret Beef Ramen
                </div>
                <div className="font-light text-xs pr-6">
                  A luxurious bowl featuring marinated beef, soft-boiled egg.
                </div>
                <Link to='/details'>
                <FaArrowRightLong className="absolute bottom-2 right-2 w-4 h-4 text-white cursor-pointer" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BEST SELLER */}
      <section className="">
        <h2 className="text-lg font-bold mb-4 text-white">Best Seller</h2>
        <div className="flex gap-4 items-center justify-between">
          {/* Best seller menu */}
          <BestSellerList />
          {/* Card 1 */}
          {/* <div className="w-40 h-56 relative">
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
          </div> */}
        </div>
      </section>

      {/* MENU LIST */}
      <h1 className="mt-10 text-white font-bold">All Menu</h1>
        <MenuList />
     
    </div>
  );
};

export default HomePage;


