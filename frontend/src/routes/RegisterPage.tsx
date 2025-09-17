import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaLock } from "react-icons/fa";
import { FaPhoneAlt, FaHome } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import bg1 from "../assets/imgs/bg-1.png";

const RegisterPage = () => {
  const [username, setName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("http://localhost:5001/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          email,
          firstName,
          lastName,
          phone,
          address,
          password,
          passwordConfirm: password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Register failed");
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

      {/* Content */}
      <div className="absolute flex flex-col items-center justify-center w-screen mt-[-80px]">
        <h1 className="title1 text-white text-9xl mt-30">ENSO</h1>
        <p className="text-white p-2 mt-3 font-[Gantari]">
          Please login with your admin credentials.
        </p>

        {/* Form */}
        <form
          onSubmit={handleRegister}
          className="mt-8 flex flex-col gap-4 w-[320px]"
        >
          {/* Username */}
          <div className="flex items-center gap-3 border-2 border-black bg-white/90 rounded-md px-4 h-12 w-full">
            <FaUser className="text-gray-400" />
            <input
              type="text"
              placeholder="username"
              value={username}
              onChange={(e) => setName(e.target.value)}
              className="bg-transparent outline-none w-full text-sm placeholder-gray-400"
            />
          </div>

          {/* Name Row */}
          <div className="flex gap-2 w-full">
            {/* First Name */}
            <div className="flex items-center gap-3 border-2 border-black bg-white/90 rounded-md px-3 h-12 w-1/2">
              <FaUser className="text-gray-400" />
              <input
                type="text"
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="bg-transparent outline-none w-full text-sm placeholder-gray-400"
              />
            </div>

            {/* Last Name */}
            <div className="flex items-center gap-3 border-2 border-black bg-white/90 rounded-md px-3 h-12 w-1/2">
              <FaUser className="text-gray-400" />
              <input
                type="text"
                placeholder="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="bg-transparent outline-none w-full text-sm placeholder-gray-400"
              />
            </div>
          </div>

          {/* Phone */}
          <div className="flex items-center gap-3 border-2 border-black bg-white/90 rounded-md px-4 h-12 w-full">
            <FaPhoneAlt className="text-gray-400" />
            <input
              type="tel"
              placeholder="Phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="bg-transparent outline-none w-full text-sm placeholder-gray-400"
            />
          </div>

          {/* Address */}
          <div className="flex items-center gap-3 border-2 border-black bg-white/90 rounded-md px-4 h-12 w-full">
            <FaHome className="text-gray-400" />
            <input
              type="text"
              placeholder="Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="bg-transparent outline-none w-full text-sm placeholder-gray-400"
            />
          </div>

          {/* Email */}
          <div className="flex items-center gap-3 border-2 border-black bg-white/90 rounded-md px-4 h-12 w-full">
            <MdEmail className="text-gray-400" />
            <input
              type="email"
              placeholder="user@example.com"
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

          {/* Sign Up Button */}
          <button
            type="submit"
            className="w-[200px] h-12 rounded-full  border-white border-1 text-lg font-medium font-[Gantari] text-black shadow-[0px_4px_18px_0px_rgba(217,217,217,1.00)] 
             bg-gradient-to-r from-black via-black-200 to-gray-200 hover:opacity-90 transition mx-auto"
          >
            SignUp
          </button>


          {/* Login Link */}
          <p className="text-sm text-gray-200 text-center mt-4 font-[Gantari]">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-white font-semibold hover:underline"
            >
              Log in
            </button>
          </p>
        </form>
      </div>

      {/* Footer */}
      <p className="absolute flex items-center justify-center inset-x-0 bottom-0 text-white bg-black h-10 font-[Gantari]">
        © 2025 ENSO RESTAURANT
      </p>
    </div>
  );
};

export default RegisterPage;
