import React from "react";
import { LuSearch } from "react-icons/lu";
import NavigationBar from "../components/InPageNavigation";
import sg1 from "../assets/imgs/signature.png";

const HomePage = () => {
  return (
    //     <div class="w-96 h-[852px] relative bg-zinc-900 overflow-hidden">
    //     <div class="left-[77px] top-[284px] absolute justify-start text-white text-8xl font-normal font-['Hogback']">Signature</div>
    //     <div class="left-[77px] top-[284px] absolute justify-start text-amber-300/20 text-8xl font-normal font-['Hogback_Demo_Version'] [text-shadow:_0px_4px_4px_rgb(0_0_0_/_0.25)]">Signature</div>
    //     <div class="w-96 h-20 left-0 top-0 absolute bg-gradient-to-r from-zinc-900"></div>
    //     <div class="left-[41px] top-[29px] absolute justify-start text-white text-2xl font-normal font-['Hogback_Demo_Version']">ENSO</div>
    //     <div class="w-72 h-11 left-[58px] top-[84px] absolute bg-zinc-300 rounded-[50px]"></div>
    //     <div class="left-[103px] top-[99px] absolute justify-start text-neutral-500 text-base font-normal font-['Epilogue']">search your favorite food</div>
    //     <div class="left-[49px] top-[583px] absolute justify-start text-white text-base font-bold font-['Epilogue']">Best seller</div>
    //     <img class="w-72 h-96 left-[59px] top-[185px] absolute" src="https://placehold.co/275x366" />
    //     <div class="w-28 h-16 left-[229px] top-[508px] absolute bg-black rounded-[10px] shadow-[3px_3px_5px_0px_rgba(244,233,32,1.00)]"></div>
    //     <div class="w-28 left-[236px] top-[514px] absolute justify-start text-white text-[10px] font-semibold font-['Epilogue']">Enso’s Secret Beef Ramen</div>
    //     <div class="w-28 left-[236px] top-[538px] absolute justify-start text-white text-[7px] font-normal font-['Epilogue']">A luxurious bowl featuring marinated beef, soft-boiled egg, </div>
    //     <div class="w-36 h-44 left-[47px] top-[660px] absolute bg-zinc-800 rounded-bl-3xl rounded-br-3xl blur-[2px]"></div>
    //     <div class="w-36 h-44 left-[43px] top-[657px] absolute bg-black rounded-bl-3xl rounded-br-3xl"></div>
    //     <div class="w-28 left-[57px] top-[771px] absolute justify-start text-white text-[10px] font-semibold font-['Epilogue']">Lorem Ipsum</div>
    //     <div class="w-28 left-[57px] top-[783px] absolute justify-start text-white text-[7px] font-normal font-['Epilogue']">Lorem ipsum dolor sit amet, consectetur adipiscing elit. maximus consectetur nisi in porta.</div>
    //     <div class="w-36 h-44 left-[214px] top-[661px] absolute bg-zinc-800 rounded-bl-3xl rounded-br-3xl blur-[2px]"></div>
    //     <div class="w-36 h-44 left-[210px] top-[657px] absolute bg-black rounded-bl-3xl rounded-br-3xl"></div>
    //     <img class="w-2.5 h-3.5 left-[321px] top-[806px] absolute" src="https://placehold.co/10x15" />
    //     <div class="w-28 left-[225px] top-[771px] absolute justify-start text-white text-[10px] font-semibold font-['Epilogue']">Lorem Ipsum</div>
    //     <div class="w-28 left-[225px] top-[783px] absolute justify-start text-white text-[7px] font-normal font-['Epilogue']">Lorem ipsum dolor sit amet, consectetur adipiscing elit. maximus consectetur nisi in porta.</div>
    //     <div class="w-40 h-36 left-[197px] top-[614px] absolute bg-zinc-300"></div>
    //     <div class="left-[307px] top-[155px] absolute justify-start text-white text-base font-semibold font-['Epilogue']">sushi</div>
    //     <div class="left-[88px] top-[155px] absolute justify-start text-white text-base font-semibold font-['Epilogue']">noodles</div>
    //     <div class="left-[173px] top-[155px] absolute justify-start text-white text-base font-semibold font-['Epilogue']">sashimi</div>
    //     <div class="left-[254px] top-[155px] absolute justify-start text-white text-base font-semibold font-['Epilogue']">rice</div>
    //     <div class="left-[47px] top-[155px] absolute justify-start text-white text-base font-semibold font-['Epilogue']">All</div>
    //     <div class="w-6 h-0 left-[44px] top-[172px] absolute outline outline-1 outline-offset-[-0.50px] outline-white"></div>
    //     <div class="w-5 h-5 left-[336px] top-[24px] absolute bg-red-800 rounded-full"></div>
    //     <div class="w-[5.07px] h-3 left-[343.61px] top-[29.77px] absolute text-center justify-start text-white text-xs font-semibold font-['Epilogue']">3</div>
    // </div>
    <>
      <div className="w-full h-[852px] bg-[#1B1C20] relative overflow-hidden">
        {/* SEARCH */}
        <div className="flex flex-col justify-center items-center ">
          <div className="flex items-center bg-zinc-300 rounded-full p-2 text-lg mt-15 text-[#6D6D71] font-[Epilogue]">
            <LuSearch className="flex text-[#6D6D71] text-lg" />
            search your fevorite food
          </div>
        </div>

        {/* NAVIGATION BAR */}
        <NavigationBar />

        {/* SIGNATURE MENU */}
        <div
          className="absolute text-[#F68522] text-9xl font-normal font-[hogback]"
          style={{
            top: "40%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            WebkitTextStroke: "1px #f4e920",
            textShadow: "3px 5px 16px rgba(255,255,255,0.25)",
          }}
        >
          Signature
        </div>
      </div>
      <img
        src={sg1}
        alt="Signature menu"
        className="w-72 h-96 absolute left-[59px] top-[185px] "
      />
      {/* INS. */}
      <div>
        
      </div>
      {/* MENU LIST */}
    </>
  );
};

export default HomePage;
