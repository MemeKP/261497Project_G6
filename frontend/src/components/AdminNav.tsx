import { useEffect, useRef, useState } from "react";
import { IoMenu, IoPersonCircleSharp } from "react-icons/io5";
import { Link, useNavigate } from "react-router-dom";

const AdminNav = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate()
  const [showDropdown, setDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [userLogin, setUserLogin] = useState(false)
  const [ currentUser, setCurrentUser] = useState(null)

  const handleLogout = async () => {
    try {
      //
      setCurrentUser(null)
      setUserLogin(false)
      navigate('/login')
    } catch (error) {
      console.log("Cannot logout: ", error)
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative flex flex-row justify-between items-center py-1 bg-none">
      {/* HAMBURGER */}
      <div
        className="cursor-pointer text-3xl z-[9999]"
        onClick={() => setOpen((prev) => !prev)}
      >
        {open ? "✕" : <IoMenu />}
      </div>

      {/* PROFILE IMG */}
      <div className="relative" ref={dropdownRef}>
        <IoPersonCircleSharp
          className="text-4xl cursor-pointer hover:opacity-80 transition"
          onClick={() => setDropdown((prev) => !prev)}
        />
      
        {showDropdown && (
          <div
            className="absolute right-0 mt-2 w-32 bg-white rounded-xl shadow-lg text-sm z-[50] animate-fadeIn"
          >
            <button
              onClick={handleLogout}
              className="w-full cursor-pointer text-left px-2 py-1 text-red-500 rounded-xl hover:bg-red-50 hover:text-red-600 transition"
            >
              Logout
            </button>
          </div>
        )}

      {/* MENU LIST */}
      <div
        className={`fixed top-0 left-0 w-full h-screen bg-white flex flex-col items-center font-bold text-xl justify-center gap-8 transition-all duration-300 ease-in-out z-[9990] ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Link to="/admin/dashboard">Overview</Link>
        <Link to="/admin/order">Order List</Link>
        <Link to="/admin/payment">Payment</Link>
      </div>
    </div>
    </div>
  );
};

export default AdminNav;
