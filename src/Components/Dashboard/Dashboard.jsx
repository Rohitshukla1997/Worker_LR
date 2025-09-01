// src/components/DashboardLayout.jsx
import React from "react";
import Logo from "../../assets/brand/fmslogo.svg";
import ProfileSection from "../SubComponent/ProfileSection";

const DashboardLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 text-sm text-white font-semibold bg-gradient-to-r from-[#504255] to-[#cbb4d4] hover:opacity-90 transition">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <img src={Logo} alt="Logo" className="h-10 w-auto" />
        </div>

        {/* Profile & Notifications */}
        <ProfileSection
          name="John Doe"
          role="Admin"
          image="https://via.placeholder.com/150"
          onProfileClick={() => alert("Profile clicked")}
          onNotificationClick={() => alert("Notifications clicked")}
        />
      </header>

      {/* Content */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
};

export default DashboardLayout;
