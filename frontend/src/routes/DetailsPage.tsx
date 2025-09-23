import React from "react";
import bg from "../assets/imgs/menu3.png";

const DetailsPage = () => {
  return (
    <div className="relative min-h-inherit overflow-hidden flex flex-col">
      {/* BG IMG */}
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center blur-md brightness-75 scale-125"
        style={{ backgroundImage: `url(${bg})` }}
      ></div>

      {/* CONTENT */}
      <div className="relative flex-1 flex flex-col justify-start p-6">
        <div className="flex justify-center mt-20">
          <img src={bg} alt="menu image" className="w-70 rounded-xl" />
        </div>

        <div className="text-white flex flex-col justify-start mt-15 p-3">
          <h1 className="text-3xl font-bold">Lorem Ipsum</h1>
          <p className="font-normal text-base">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. maximus
            consectetur nisi in porta.
          </p>
          <h2 className="mt-3 text-xl font-semibold">Note</h2>
          <form action="">
            <textarea
              className="w-full min-h-[120px] p-3 border-none bg-zinc-300 rounded-2xl text-base focus:outline-none focus:ring-2 transition-all resize-y text-neutral-500"
              placeholder="Please specify if you have any special requests."
            ></textarea>
            <div className="flex justify-end mt-3">
              <button
                type="submit"
                className="bg-gradient-to-r from-black to-stone-500 rounded-2xl text-white px-4 py-2 cursor-pointer"
              >
                Add to cart
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DetailsPage;

