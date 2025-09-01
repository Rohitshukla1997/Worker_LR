import React from "react";
import { NavLink } from "react-router-dom";
import Logo from "../../assets/brand/fmslogo.svg";
import ProfileSection from "../SubComponent/ProfileSection";

const DashboardLayout = ({ children, user, onLogout }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#504255] to-[#cbb4d4] text-white shadow-md">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-6 py-3">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img src={Logo} alt="Logo" className="h-10 w-auto" />
          </div>

          {/* Profile & Notifications */}
          <ProfileSection
            name={user?.name || "Guest"}
            role={user?.role || "Admin"}
            image={user?.image}
            onProfileClick={() => alert("Profile clicked")}
            onNotificationClick={() => alert("Notifications clicked")}
            onLogout={onLogout}
          />
        </div>

        {/* Navigation Bar */}
        <nav className="flex items-center space-x-8 px-6 py-2 bg-black/20 text-sm font-medium">
          <NavLink
            to="/dashboard"
            end
            className={({ isActive }) =>
              `transition-colors ${
                isActive
                  ? "text-yellow-300 font-semibold border-b-2 border-yellow-300 pb-1"
                  : "hover:text-yellow-300"
              }`
            }
          >
            Home
          </NavLink>

          <NavLink
            to="/dashboard/profileCard"
            className={({ isActive }) =>
              `transition-colors ${
                isActive
                  ? "text-yellow-300 font-semibold border-b-2 border-yellow-300 pb-1"
                  : "hover:text-yellow-300"
              }`
            }
          >
            About
          </NavLink>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
};

export default DashboardLayout;
