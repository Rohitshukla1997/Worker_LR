import React from "react";
import { User, Lock } from "lucide-react";
import Profile from "../../assets/brand/svgimg.svg";
import Logo from "../../assets/brand/fmslog2.png";

const Login = ({ onLogin }) => {
  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-[#ede7f6] relative">
      {/* Decorative Circles */}
      <div className="absolute top-17 left-53 w-24 h-24 bg-[#cbb4d4] rounded-full"></div>
      <div className="absolute bottom-17 right-53 w-24 h-24 bg-white rounded-full shadow-lg"></div>

      {/* Card */}
      <div className="w-4/5 max-w-5xl h-[550px] flex shadow-xl rounded-2xl overflow-hidden relative z-10 bg-gradient-to-r from-[#20002c] to-[#cbb4d4]">
        {/* Left Section */}
        <div className="w-1/2 flex flex-col items-center px-12 py-12 bg-white bg-opacity-90 rounded-l-2xl">
          <img
            src={Logo}
            alt="Logo"
            className="h-16 w-80 object-contain mb-8"
          />

          <h2 className="text-3xl font-bold mb-2 text-center text-gray-800">
            Sign In
          </h2>
          <p className="text-gray-600 text-sm text-center mb-8">
            Let's Create Transport Pass with FMS!
          </p>

          {/* Username */}
          <div className="flex items-center border rounded-lg px-3 py-2 mb-4 bg-gray-100 w-full">
            <User className="w-5 h-5 text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Username"
              className="bg-transparent outline-none w-full text-sm"
            />
          </div>

          {/* Password */}
          <div className="flex items-center border rounded-lg px-3 py-2 mb-6 bg-gray-100 w-full">
            <Lock className="w-5 h-5 text-gray-400 mr-2" />
            <input
              type="password"
              placeholder="Password"
              className="bg-transparent outline-none w-full text-sm"
            />
          </div>

          {/* Login Button */}
          <button
            type="button"
            onClick={onLogin}
            className="w-full py-2 px-4 rounded-lg text-white font-semibold bg-gradient-to-r from-[#20002c] to-[#cbb4d4] hover:opacity-90 transition"
          >
            Login
          </button>
        </div>

        {/* Right Section */}
        <div className="w-1/2 relative flex justify-center items-center p-8">
          <svg
            className="absolute inset-0 w-full h-full opacity-20"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
          >
            <path
              fill="white"
              fillOpacity="0.4"
              d="M0,64L60,90.7C120,117,240,171,360,197.3C480,224,600,224,720,192C840,160,960,96,1080,74.7C1200,53,1320,75,1380,85.3L1440,96L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
            />
          </svg>

          <div className="relative z-10 text-center text-white">
            <h2 className="text-2xl font-bold mb-4">Welcome Back!</h2>
            <p className="mb-6 text-sm opacity-90">
              Manage your work, track TP Pass progress, and stay connected.
            </p>
            <img
              src={Profile}
              alt="Worker"
              className="mx-auto rounded-xl object-contain h-56 w-auto shadow-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
