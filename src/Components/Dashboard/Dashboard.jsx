import React, { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import Logo from "../../assets/brand/fmslogo.svg";
import ProfileSection from "../SubComponent/ProfileSection";

const DashboardLayout = ({ user, onLogout }) => {
  const [warehouseOpen, setWarehouseOpen] = useState(false);

  // Close dropdown when clicking any link
  const closeDropdown = () => setWarehouseOpen(false);

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
        <nav className="flex items-center space-x-8 px-6 py-2 bg-black/20 text-sm font-medium relative">
          {/* Transport Pass */}
          <NavLink
            to="/dashboard"
            end
            className={({ isActive }) =>
              isActive
                ? "text-yellow-300 font-semibold border-b-2 border-yellow-300 pb-1"
                : "hover:text-yellow-300"
            }
          >
            Transport Pass
          </NavLink>

          {/* Warehouse Dropdown */}
          <div className="relative">
            <button
              onClick={() => setWarehouseOpen(!warehouseOpen)}
              className={`flex items-center gap-1 ${
                warehouseOpen
                  ? "text-yellow-300 font-semibold"
                  : "hover:text-yellow-300"
              }`}
            >
              Warehouse Section ▾
            </button>

            {warehouseOpen && (
              <div className="absolute left-0 mt-2 bg-white text-black shadow-md rounded-md w-44 py-2 z-50">
                <NavLink
                  to="/dashboard/warehouse/godown"
                  onClick={closeDropdown}
                  className={({ isActive }) =>
                    `block px-4 py-2 hover:bg-gray-100 ${
                      isActive ? "text-yellow-600 font-semibold" : ""
                    }`
                  }
                >
                  Godown
                </NavLink>

                <NavLink
                  to="/dashboard/warehouse/product-list"
                  onClick={closeDropdown}
                  className={({ isActive }) =>
                    `block px-4 py-2 hover:bg-gray-100 ${
                      isActive ? "text-yellow-600 font-semibold" : ""
                    }`
                  }
                >
                  Product List
                </NavLink>

                <NavLink
                  to="/dashboard/warehouse/inventory"
                  onClick={closeDropdown}
                  className={({ isActive }) =>
                    `block px-4 py-2 hover:bg-gray-100 ${
                      isActive ? "text-yellow-600 font-semibold" : ""
                    }`
                  }
                >
                  Inventory
                </NavLink>

                <NavLink
                  to="/dashboard/warehouse/godown-tp"
                  onClick={closeDropdown}
                  className={({ isActive }) =>
                    `block px-4 py-2 hover:bg-gray-100 ${
                      isActive ? "text-yellow-600 font-semibold" : ""
                    }`
                  }
                >
                  Godown TP
                </NavLink>
              </div>
            )}
          </div>

          {/* About */}
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
