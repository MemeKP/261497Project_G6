import bg1 from "../assets/imgs/bg-1.png";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaLock } from "react-icons/fa";

const LoginPage = () => {
   const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("http://localhost:5001/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", 
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      navigate("/admin"); 
    } catch (err) {
      console.error(err);
      setError("error");
    }
  };


  return (
    <div className="w-full h-[852px] relative bg-black overflow-hidden">
      <img
        className="w-full h-full object-cover absolute inset-0"
        src={bg1}
        alt="background"
      />
      <div 
        className="absolute inset-0 bg-black opacity-70">
      </div>
    
      <div className="absolute flex flex-col items-center justify-center w-screen">
        <h1 className="title1 text-white text-9xl mt-30">ENSO</h1>
        <p className="text-white p-2 mt-3 font-[Gantari]">
          Please login with your admin credentials.
        </p>

        {/* Form */}
        <form
          onSubmit={handleLogin}
          className="mt-8 flex flex-col gap-4 w-[320px]"
        >
          {/* Username */}
          <div className="flex items-center gap-3 border-2 border-black bg-white/90 rounded-md px-4 h-12 w-full">
            <FaUser className="text-gray-400" />
            <input
              type="text"
              placeholder="username or email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-transparent outline-none w-full text-sm placeholder-gray-400"
            />
          </div>

          {/* Password */}
          <div className="flex items-center gap-3 border-2 border-black bg-white/90 rounded-md px-4 h-12 w-full">
            <FaLock className="text-gray-400 mr-2" />
            <input
              type="password"
              placeholder="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-transparent outline-none w-full text-sm placeholder-gray-400"
            />
          </div>

          {/* Error */}
          {error && <p className="text-red-400 text-sm">{error}</p>}

          {/* Forgot Password */}
          <div className="w-full text-right text-xs mt-[-8px]">
            <a href="/forgot-password" className="text-gray-200 hover:text-white font-[Gantari]">
              Forgot Password?
            </a>
          </div>

          {/* Button */}
          <button
            type="submit"
            className="w-[200px] h-12 rounded-full  border-white border-1 text-lg font-medium font-[Gantari] text-black shadow-[0px_4px_18px_0px_rgba(217,217,217,1.00)] 
             bg-gradient-to-r from-black via-black-200 to-gray-200 hover:opacity-90 transition mx-auto"
          >
            LogIn
          </button>

          {/* Sign Up */}
          <p className="text-sm text-gray-200 text-center mt-4 font-[Gantari]">
            Don’t have account?{" "}
            <button
              type="button"
              onClick={() => navigate("/register")}
              className="text-white font-semibold hover:underline"
            >
              Sign Up
            </button>
          </p>

        </form>

      </div>

      {/* Footer */}
      <p className="absolute flex items-center justify-center inset-x-0 bottom-0 text-white bg-black h-10 font-[Gantari]">© 2025 ENSO RESTUARANT</p>
    </div>
  )
}

export default LoginPage