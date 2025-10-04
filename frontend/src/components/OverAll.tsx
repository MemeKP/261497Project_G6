import { BsClipboard2CheckFill, BsClipboard2XFill } from "react-icons/bs";
import revenue from "../assets/imgs/revenue.png";
import { IoIosPeople } from "react-icons/io"; 

const OverAll = () => {
  return (
    <div className="pt-6 grid grid-cols-2 gap-6"> 
      
      {/* ORDER */}
      <div className="flex items-center bg-white rounded-2xl p-2 shadow-md"> 
        <BsClipboard2CheckFill className="text-3xl text-black mr-1" /> 
        <div className="flex flex-col ml-2"> 
          <p className="text-sm font-bold text-black">Total Orders</p>
          <p className="text-2xl font-bold text-black">40</p>
        </div>
      </div>

      {/* CANCEL */}
      <div className="flex items-center bg-white rounded-2xl p-2 shadow-md">
        <BsClipboard2XFill className="text-3xl text-black mr-1" /> 
        <div className="flex flex-col ml-2"> 
          <p className="text-sm font-bold text-black">Total Canceled</p>
          <p className="text-2xl font-bold text-black">3</p>
        </div>
      </div>
      
      {/* REVENUE */}
      <div className="flex items-center bg-white rounded-2xl p-2 shadow-md">
        <img src={revenue} alt="total revonue" className="h-8 w-8 mr-3" /> 
        <div className="flex flex-col ml-2"> 
          <p className="text-sm font-bold text-black">Total Revenue</p>
          <p className="text-2xl font-bold text-black">88</p>
        </div>
      </div>
      
      {/* ACTIVE SESSION */}
      <div className="flex items-center bg-green-100 rounded-2xl p-2 shadow-md"> 
        <IoIosPeople className="text-3xl text-green-600 mr-1" /> 
        <div className="flex flex-col ml-2"> 
          <p className="text-sm font-bold text-green-600">Active sessions</p>
          <p className="text-2xl font-bold text-green-600">8</p>
        </div>
      </div>
    </div>
  );
};

export default OverAll;
