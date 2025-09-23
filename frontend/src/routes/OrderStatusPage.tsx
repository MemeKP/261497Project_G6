import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaChevronDown, FaChevronUp, FaArrowLeft } from "react-icons/fa";

const OrderStatusPage = () => {
  const [openSection, setOpenSection] = useState<string | null>(null);
  const navigate = useNavigate();

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <div className="w-full h-[852px] relative bg-[#1E1E1E] text-white p-6 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="title1 text-2xl">ENSO</h1>
        <div className="w-6" /> {/* placeholder to balance layout */}
      </div>

      {/* Title */}
      <h2 className="text-xl  text-center mb-2">Order Status</h2>
      <p className="text-sm text-center mb-6">
        Orders In progress : <span className="font-semibold">4 items</span>
      </p>

      {/* Preparing Section */}
      <div
        className="bg-white text-black rounded-lg p-4 mb-4 cursor-pointer"
        onClick={() => toggleSection("preparing")}
      >
        <div className="flex justify-between items-center font-semibold">
          <span>Preparing(2)</span>
          <span className="text-sm text-gray-600 flex items-center">
            Ready in: 8min{" "}
            {openSection === "preparing" ? (
              <FaChevronUp className="ml-2" />
            ) : (
              <FaChevronDown className="ml-2" />
            )}
          </span>
        </div>
        {openSection === "preparing" && (
          <div className="mt-2 text-sm">
            <p>Lorem Ipsum</p>
            <p>Lorem Ipsum</p>
          </div>
        )}
      </div>

      {/* Ready To Serve Section */}
      <div
        className="bg-white text-black rounded-lg p-4 mb-4 cursor-pointer"
        onClick={() => toggleSection("ready")}
      >
        <div className="flex justify-between items-center font-semibold">
          <span>Ready To Serve(1)</span>
          <span className="text-sm text-gray-600 flex items-center">
            Ready in: 2min{" "}
            {openSection === "ready" ? (
              <FaChevronUp className="ml-2" />
            ) : (
              <FaChevronDown className="ml-2" />
            )}
          </span>
        </div>
        {openSection === "ready" && (
          <div className="mt-2 text-sm">
            <p>Lorem Ipsum</p>
          </div>
        )}
      </div>

      {/* Complete Section */}
      <div
        className="bg-white text-black rounded-lg p-4 mb-6 cursor-pointer"
        onClick={() => toggleSection("complete")}
      >
        <div className="flex justify-between items-center font-semibold">
          <span>Complete(1)</span>
          {openSection === "complete" ? (
            <FaChevronUp className="ml-2 text-gray-600" />
          ) : (
            <FaChevronDown className="ml-2 text-gray-600" />
          )}
        </div>
        {openSection === "complete" && (
          <div className="mt-2 text-sm">
            <p>Lorem Ipsum</p>
            {/* Progress Bar */}
            <div className="w-full bg-gray-300 rounded-full h-2 mt-2">
              <div className="bg-green-400 h-2 rounded-full w-1/3"></div>
            </div>
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="mt-auto flex flex-col gap-4">
        <button
          onClick={() => navigate("/homepage")}
          className="w-[300px] h-12 mx-auto rounded-full text-lg font-semibold text-black 
                     shadow-[0px_4px_18px_0px_rgba(217,217,217,1.00)] 
                     bg-gradient-to-r from-white to-black hover:opacity-90 transition"
        >
          Add to Order
        </button>

        <button
          onClick={() => navigate("/billpage")}
          className="w-[300px] h-12 mx-auto rounded-full text-lg font-semibold text-black 
                     shadow-[0px_4px_18px_0px_rgba(217,217,217,1.00)] 
                     bg-gradient-to-r from-white to-black hover:opacity-90 transition"
        >
          Generate Bill
        </button>
      </div>
    </div>
  );
};

export default OrderStatusPage;
