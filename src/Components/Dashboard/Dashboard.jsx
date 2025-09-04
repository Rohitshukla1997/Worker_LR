import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import Logo from "../../assets/brand/fmslogo.svg";
import ProfileSection from "../SubComponent/ProfileSection";

const DashboardLayout = ({ user, onLogout }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#504255] to-[#cbb4d4] text-white shadow-md">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <img src={Logo} alt="Logo" className="h-10 w-auto" />
          </div>

          <ProfileSection name={user?.name || "Guest"} onLogout={onLogout} />
        </div>

        {/* Navigation */}
        <nav className="flex items-center space-x-8 px-6 py-2 bg-black/20 text-sm font-medium">
          <NavLink
            to="/dashboard"
            end
            className={({ isActive }) =>
              isActive
                ? "text-yellow-300 font-semibold border-b-2 border-yellow-300 pb-1"
                : "hover:text-yellow-300"
            }
          >
            Home
          </NavLink>

          <NavLink
            to="/dashboard/profileCard"
            className={({ isActive }) =>
              isActive
                ? "text-yellow-300 font-semibold border-b-2 border-yellow-300 pb-1"
                : "hover:text-yellow-300"
            }
          >
            About
          </NavLink>
        </nav>
      </header>

      {/* Main content */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
