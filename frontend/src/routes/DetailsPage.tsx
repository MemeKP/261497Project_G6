import React, { useEffect } from "react";
import bg from "../assets/imgs/menu3.png";
import { IoClose, IoAddCircle, IoRemoveCircle, IoPersonAddSharp } from "react-icons/io5";
import { Link, useParams } from "react-router-dom";
import axios from "axios";

const DetailsPage = () => {
    const { sessionId } = useParams<{ sessionId: string }>();

  useEffect(() => {
    if (sessionId) {
      axios.get(`/api/dining_session/${sessionId}`)
        .then(res => {
          console.log("Session data:", res.data);
        })
        .catch(err => console.error(err));
    }
  }, [sessionId]);
  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col">
      <Link to={`/homepage/${sessionId}`}>
        <IoClose className="absolute right-6 top-6 w-9 h-9 text-gray-300 z-20" />
      </Link>
      {/* BG IMG */}
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center blur-md brightness-75 scale-125"
        style={{ backgroundImage: `url(${bg})` }}
      ></div>

      {/* CONTENT */}
      <div className="relative flex-1 flex flex-col justify-start p-6">
        <div className="flex justify-center pt-20">
          <img src={bg} alt="menu image" className="w-70 rounded-xl" />
          <button className="absolute w-11 h-11 bg-black/50 rounded-full right-12 top-90 flex justify-center items-center cursor-pointer">
          <IoPersonAddSharp className="w-6 h-6 text-white"/>
          </button>
        </div>

        <div className="text-white flex flex-col justify-start pt-10 p-3">
          <h1 className="text-3xl font-bold">Lorem Ipsum</h1>
          <p className="font-normal text-base">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. maximus
            consectetur nisi in porta.
          </p>
          <h2 className="pt-6 text-xl font-semibold">Note</h2>
          <form action="">
            <textarea
              className="w-full min-h-[120px] mt-3 p-3 border-none bg-zinc-300 rounded-2xl text-base focus:outline-none focus:ring-2 transition-all resize-y text-neutral-500"
              placeholder="Please specify if you have any special requests."
            ></textarea>
            
          </form>
        </div>
      </div>
      <div className=" bottom-0 w-full h-20 flex items-center justify-between z-20 p-9">
        <div className="flex items-center gap-4">
          <IoRemoveCircle className="text-white w-8 h-8 cursor-pointer" />
          <span className="text-white text-lg font-bold">1</span>
          <IoAddCircle className="text-white w-8 h-8 cursor-pointer" />
        </div>
        <button type="submit" className="bg-gradient-to-r from-black to-stone-500 rounded-2xl text-white font-semibold px-4 py-2 cursor-pointer">
          Add to cart
          <span className="ml-4 font-normal">159.-</span>
        </button>
      </div>
    </div>
  );
};

export default DetailsPage;
