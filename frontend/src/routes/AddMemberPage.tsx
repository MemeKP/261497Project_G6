import React from "react";
import { BsPlusCircleFill, BsDashLg } from "react-icons/bs";
import { Link } from "react-router-dom";

interface InputProps {
  input: string;
}

const AddMemberPage: React.FC<InputProps> = ({
  input,

}) => {
  const members = ["Somjai", "Somsee", "Somporn", "Somjit"];

  return (
    <div className="w-full h-[852px] bg-[#1B1C20] flex justify-center">
      <div className="w-80 items-center justify-center">
        {/* ADD */}
        <div className="flex flex-col items-center">
          <div className="flex items-center space-x-2 mt-20">
            <BsPlusCircleFill className="text-white text-2xl" />
            <input 
              type="text" 
              value={input}
              // onChange={}
              placeholder="Add your friend's names"
              className="text-gray-200 font-[Epilogue] border-none outline-none"
            />
          </div>
        </div>

        {/* NAME */}
        <div className="flex flex-col items-center mt-10 space-y-4">
          {members.map((name, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-black w-80 rounded-xl px-4 py-3 text-white font-semibold text-lg font-[Epilogue]"
            >
              <span>{name}</span>
              <BsDashLg className="text-2xl text-red-500 cursor-pointer" />
            </div>
          ))}
        </div>

        {/* BUTTON */}
        <div className="flex bottom-4 justify-end mt-8">
          <Link to="/homepage">
            <button
              className=" bg-gradient-to-r from-black to-gray-700 
    text-white rounded-full px-10 py-2 text-sm font-[Epilogue] cursor-pointer 
    transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg hover:from-gray-900 hover:to-gray-500"
            >
              continue
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AddMemberPage;
