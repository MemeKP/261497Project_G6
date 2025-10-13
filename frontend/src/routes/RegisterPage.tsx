// import { useState ,useEffect} from "react";
// import { useNavigate } from "react-router-dom";
// import { FaUser, FaLock } from "react-icons/fa";
// import { FaPhoneAlt, FaHome } from "react-icons/fa";
// import { MdEmail } from "react-icons/md";
// import bg1 from "../assets/imgs/bg-1.png";

// const RegisterPage = () => {
//   const [username, setName] = useState("");
//   const [firstName, setFirstName] = useState("");
//   const [lastName, setLastName] = useState("");
//   const [phone, setPhone] = useState("");
//   const [address, setAddress] = useState("");
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");
//   const navigate = useNavigate();

//   useEffect(() => {
//     const checkIfAlreadyLogin = async () => {
//       try {
//         const res = await fetch("/api/auth/me", {
//           credentials: "include",
//         });
//         if (res.ok) {
//           navigate("/admin/dashboard"); // ถ้ายัง login อยู่ให้ไปหน้า dashboard เลย
//         }
//       } catch (err) {
//         console.log("Not logged in");
//       }
//     };
//     checkIfAlreadyLogin();
//   }, [navigate]);

//   const handleRegister = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError("");

//     try {
//       const res = await fetch(`/api/auth/register`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         credentials: "include", // ✅ เพิ่มเพื่อเก็บ session ทันทีหลัง register
//         body: JSON.stringify({
//           username,
//           email,
//           firstName,
//           lastName,
//           phone,
//           address,
//           password,
//           passwordConfirm: password,
//         }),
//       });

//       const data = await res.json();
//       if (!res.ok) {
//         setError(data.error || "Register failed");
//         return;
//       }

//       navigate("/admin/dashboard");
//     } catch (err) {
//       console.error(err);
//       setError("error");
//     }
//   };

//   return (
//     <div className="w-full min-h-screen flex flex-col bg-black relative overflow-y-auto">
//       {/* Background */}
//       <img
//         className="w-full h-full object-cover absolute inset-0"
//         src={bg1}
//         alt="background"
//       />
//       <div className="absolute inset-0 bg-black opacity-70"></div>

//       {/* Content */}
//       <div className="relative flex-1 flex flex-col items-center justify-start pt-16 pb-12">
//         <h1 className="title1 text-white text-9xl">ENSO</h1>
//         <p className="text-white p-2 mt-3 font-[Gantari] text-center">
//           Please login with your admin credentials.
//         </p>

//         {/* Form */}
//         <form
//           onSubmit={handleRegister}
//           className="mt-8 flex flex-col gap-4 w-[320px]"
//         >
//           {/* Username */}
//           <div className="flex flex-col gap-1 w-full">
//             <label className="text-xs text-white font-[Gantari]">username</label>
//             <div className="flex items-center gap-3 border-2 border-black bg-white/90 rounded-md px-4 h-12 w-full">
//               <FaUser className="text-gray-400" />
//               <input
//                 type="text"
//                 placeholder="admin"
//                 value={username}
//                 onChange={(e) => setName(e.target.value)}
//                 className="bg-transparent outline-none w-full text-sm placeholder-gray-400"
//               />
//             </div>
//           </div>

//           {/* Name Row */}
//           <div className="flex gap-2 w-full">
//             {/* First Name */}
//             <div className="flex flex-col gap-1 w-1/2">
//               <label className="text-xs text-white font-[Gantari]">First name</label>
//               <div className="flex items-center gap-3 border-2 border-black bg-white/90 rounded-md px-3 h-12">
//                 <FaUser className="text-gray-400" />
//                 <input
//                   type="text"
//                   placeholder="John"
//                   value={firstName}
//                   onChange={(e) => setFirstName(e.target.value)}
//                   className="bg-transparent outline-none w-full text-sm placeholder-gray-400"
//                 />
//               </div>
//             </div>

//             {/* Last Name */}
//             <div className="flex flex-col gap-1 w-1/2">
//               <label className="text-xs text-white font-[Gantari]">Last name</label>
//               <div className="flex items-center gap-3 border-2 border-black bg-white/90 rounded-md px-3 h-12">
//                 <FaUser className="text-gray-400" />
//                 <input
//                   type="text"
//                   placeholder="Doe"
//                   value={lastName}
//                   onChange={(e) => setLastName(e.target.value)}
//                   className="bg-transparent outline-none w-full text-sm placeholder-gray-400"
//                 />
//               </div>
//             </div>
//           </div>

//           {/* Phone */}
//           <div className="flex flex-col gap-1 w-full">
//             <label className="text-xs text-white font-[Gantari]">Phone</label>
//             <div className="flex items-center gap-3 border-2 border-black bg-white/90 rounded-md px-4 h-12">
//               <FaPhoneAlt className="text-gray-400" />
//               <input
//                 type="tel"
//                 placeholder="069-123-4567"
//                 value={phone}
//                 onChange={(e) => setPhone(e.target.value)}
//                 className="bg-transparent outline-none w-full text-sm placeholder-gray-400"
//               />
//             </div>
//           </div>

//           {/* Address */}
//           <div className="flex flex-col gap-1 w-full">
//             <label className="text-xs text-white font-[Gantari]">Address</label>
//             <div className="flex items-center gap-3 border-2 border-black bg-white/90 rounded-md px-4 h-12">
//               <FaHome className="text-gray-400" />
//               <input
//                 type="text"
//                 placeholder="123 Main Suthep"
//                 value={address}
//                 onChange={(e) => setAddress(e.target.value)}
//                 className="bg-transparent outline-none w-full text-sm placeholder-gray-400"
//               />
//             </div>
//           </div>

//           {/* Email */}
//           <div className="flex flex-col gap-1 w-full">
//             <label className="text-xs text-white font-[Gantari]">Email</label>
//             <div className="flex items-center gap-3 border-2 border-black bg-white/90 rounded-md px-4 h-12">
//               <MdEmail className="text-gray-400" />
//               <input
//                 type="email"
//                 placeholder="user@example.com"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 className="bg-transparent outline-none w-full text-sm placeholder-gray-400"
//               />
//             </div>
//           </div>

//           {/* Password */}
//           <div className="flex flex-col gap-1 w-full">
//             <label className="text-xs text-white font-[Gantari]">Password</label>
//             <div className="flex items-center gap-3 border-2 border-black bg-white/90 rounded-md px-4 h-12">
//               <FaLock className="text-gray-400 mr-2" />
//               <input
//                 type="password"
//                 placeholder="********"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 className="bg-transparent outline-none w-full text-sm placeholder-gray-400"
//               />
//             </div>
//           </div>

//           {/* Error */}
//           {error && <p className="text-red-400 text-sm">{error}</p>}

//           {/* Sign Up Button */}
//           <button
//             type="submit"
//             className="w-[200px] h-12 rounded-full border-white border-1 text-lg font-medium font-[Gantari] text-black shadow-[0px_4px_18px_0px_rgba(217,217,217,1.00)] 
//              bg-gradient-to-r from-black via-black-200 to-gray-200 hover:opacity-90 transition mx-auto"
//           >
//             SignUp
//           </button>

//           {/* Login Link */}
//           <p className="text-sm text-gray-200 text-center mt-4 font-[Gantari]">
//             Already have an account?{" "}
//             <button
//               type="button"
//               onClick={() => navigate("/login")}
//               className="text-white font-semibold hover:underline"
//             >
//               Log in
//             </button>
//           </p>
//         </form>
//       </div>

//       {/* Footer */}
//       <footer className="relative bg-black text-white h-10 flex items-center justify-center font-[Gantari]">
//         © 2025 ENSO RESTAURANT
//       </footer>
//     </div>
//   );
// };

// export default RegisterPage;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaLock, FaPhoneAlt, FaHome } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import bg1 from "../assets/imgs/bg-1.png";
import { useAuth } from "../context/useAuth"; // ✅ เพิ่มตรงนี้

const RegisterPage = () => {
  const [username, setName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();
  const { login } = useAuth(); 

  useEffect(() => {
    const checkIfAlreadyLogin = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.ok) {
          login(); 
          navigate("/admin/dashboard");
          return;
        }
      } catch (err) {
        console.log("Not logged in");
      } finally {
        setChecking(false);
      }
    };
    checkIfAlreadyLogin();
  }, [navigate, login]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
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

      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (loginRes.ok) {
        login(); 
        navigate("/admin/dashboard");
      } else {
        navigate("/login");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong, please try again.");
    }
  };

  if (checking) {
    return <div className="bg-black w-full h-screen" />;
  }

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
          Create your admin account below.
        </p>

        <form
          onSubmit={handleRegister}
          className="mt-8 flex flex-col gap-4 w-[320px]"
        >
          {/* Username */}
          <div className="flex flex-col gap-1 w-full">
            <label className="text-xs text-white font-[Gantari]">Username</label>
            <div className="flex items-center gap-3 border-2 border-black bg-white/90 rounded-md px-4 h-12 w-full">
              <FaUser className="text-gray-400" />
              <input
                type="text"
                placeholder="admin"
                value={username}
                onChange={(e) => setName(e.target.value)}
                className="bg-transparent outline-none w-full text-sm placeholder-gray-400"
              />
            </div>
          </div>

          {/* Name Row */}
          <div className="flex gap-2 w-full">
            <div className="flex flex-col gap-1 w-1/2">
              <label className="text-xs text-white font-[Gantari]">First name</label>
              <div className="flex items-center gap-3 border-2 border-black bg-white/90 rounded-md px-3 h-12">
                <FaUser className="text-gray-400" />
                <input
                  type="text"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="bg-transparent outline-none w-full text-sm placeholder-gray-400"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1 w-1/2">
              <label className="text-xs text-white font-[Gantari]">Last name</label>
              <div className="flex items-center gap-3 border-2 border-black bg-white/90 rounded-md px-3 h-12">
                <FaUser className="text-gray-400" />
                <input
                  type="text"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="bg-transparent outline-none w-full text-sm placeholder-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Phone */}
          <div className="flex flex-col gap-1 w-full">
            <label className="text-xs text-white font-[Gantari]">Phone</label>
            <div className="flex items-center gap-3 border-2 border-black bg-white/90 rounded-md px-4 h-12">
              <FaPhoneAlt className="text-gray-400" />
              <input
                type="tel"
                placeholder="069-123-4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-transparent outline-none w-full text-sm placeholder-gray-400"
              />
            </div>
          </div>

          {/* Address */}
          <div className="flex flex-col gap-1 w-full">
            <label className="text-xs text-white font-[Gantari]">Address</label>
            <div className="flex items-center gap-3 border-2 border-black bg-white/90 rounded-md px-4 h-12">
              <FaHome className="text-gray-400" />
              <input
                type="text"
                placeholder="123 Main Suthep"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="bg-transparent outline-none w-full text-sm placeholder-gray-400"
              />
            </div>
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1 w-full">
            <label className="text-xs text-white font-[Gantari]">Email</label>
            <div className="flex items-center gap-3 border-2 border-black bg-white/90 rounded-md px-4 h-12">
              <MdEmail className="text-gray-400" />
              <input
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent outline-none w-full text-sm placeholder-gray-400"
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1 w-full">
            <label className="text-xs text-white font-[Gantari]">Password</label>
            <div className="flex items-center gap-3 border-2 border-black bg-white/90 rounded-md px-4 h-12">
              <FaLock className="text-gray-400 mr-2" />
              <input
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-transparent outline-none w-full text-sm placeholder-gray-400"
              />
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            className="w-[200px] h-12 rounded-full border-white border-1 text-lg font-medium font-[Gantari] text-black shadow-[0px_4px_18px_0px_rgba(217,217,217,1.00)] 
             bg-gradient-to-r from-black via-black-200 to-gray-200 hover:opacity-90 transition mx-auto"
          >
            SignUp
          </button>

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

      <footer className="relative bg-black text-white h-10 flex items-center justify-center font-[Gantari]">
        © 2025 ENSO RESTAURANT
      </footer>
    </div>
  );
};

export default RegisterPage;
