import { useState } from "react";
import { IoMenu, IoPersonCircleSharp } from "react-icons/io5";
import { Link } from "react-router-dom";

const AdminNav = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative flex flex-row justify-between items-center py-1 bg-none">
      {/* HAMBURGER */}
      <div
        className="cursor-pointer text-3xl z-50"
        onClick={() => setOpen((prev) => !prev)}
      >
        {open ? "✕" : <IoMenu />}
      </div>

      {/* PROFILE IMG */}
      <IoPersonCircleSharp className="text-4xl" />

      {/* MENU LIST */}
      <div
        className={`fixed top-0 left-0 w-full h-screen bg-white flex flex-col items-center font-bold text-xl justify-center gap-8 transition-all duration-300 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Link to="/admin/dashboard">Overview</Link>
        <Link to="/admin/order">Order List</Link>
        <Link to="/admin/payment">Payment</Link>
      </div>
    </div>
  );
};

export default AdminNav;
