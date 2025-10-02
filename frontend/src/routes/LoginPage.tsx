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
      const res = await fetch("http://localhost:3000/auth/login", {
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
    <div className="w-full min-h-screen flex flex-col bg-black relative overflow-y-auto">
      {/* Background */}
      <img
        className="w-full h-full object-cover absolute inset-0"
        src={bg1}
        alt="background"
      />
      <div className="absolute inset-0 bg-black opacity-70"></div>

      {/* Content */}
      <div className="relative flex-1 flex flex-col items-center justify-start pt-16 pb-12">
        <h1 className="title1 text-white text-9xl">ENSO</h1>
        <p className="text-white p-2 mt-3 font-[Gantari] text-center">
          Please login with your admin credentials.
        </p>

        {/* Form */}
        <form
          onSubmit={handleLogin}
          className="mt-8 flex flex-col gap-4 w-[320px]"
        >
          {/* Username or Email */}
          <div className="flex flex-col gap-1 w-full">
            <label className="text-xs text-white font-[Gantari]">
              username or email
            </label>
            <div className="flex items-center gap-3 border-2 border-black bg-white/90 rounded-md px-4 h-12 w-full">
              <FaUser className="text-gray-400" />
              <input
                type="text"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent outline-none w-full text-sm placeholder-gray-400"
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1 w-full">
            <label className="text-xs text-white font-[Gantari]">password</label>
            <div className="flex items-center gap-3 border-2 border-black bg-white/90 rounded-md px-4 h-12 w-full">
              <FaLock className="text-gray-400 mr-2" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-transparent outline-none w-full text-sm placeholder-gray-400"
              />
            </div>
          </div>

          {/* Error */}
          {error && <p className="text-red-400 text-sm">{error}</p>}

          {/* Button */}
          <button
            type="submit"
            className="w-[200px] h-12 rounded-full border-white border-1 text-lg font-medium font-[Gantari] text-black shadow-[0px_4px_18px_0px_rgba(217,217,217,1.00)] 
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
      <footer className="relative bg-black text-white h-10 flex items-center justify-center font-[Gantari]">
        © 2025 ENSO RESTAURANT
      </footer>
    </div>
  );
};

export default LoginPage;