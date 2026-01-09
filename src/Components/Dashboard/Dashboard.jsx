import React, { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import Logo from "../../assets/brand/fmslogo.svg";
import ProfileSection from "../SubComponent/ProfileSection";

const DashboardLayout = ({ user, onLogout }) => {
  const [warehouseOpen, setWarehouseOpen] = useState(false);
  const [goodReciptOpen, setGoodReciptOpen] = useState(false);

  // Close all dropdowns
  const closeAllDropdowns = () => {
    setWarehouseOpen(false);
    setGoodReciptOpen(false);
  };

  // Toggle specific dropdown while closing others
  const toggleWarehouse = () => {
    setWarehouseOpen(!warehouseOpen);
    setGoodReciptOpen(false);
  };

  const toggleGoodRecipt = () => {
    setGoodReciptOpen(!goodReciptOpen);
    setWarehouseOpen(false);
  };

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
            onClick={closeAllDropdowns}
            className={({ isActive }) =>
              isActive
                ? "text-yellow-300 font-semibold border-b-2 border-yellow-300 pb-1"
                : "hover:text-yellow-300"
            }
          >
            Transport Pass
          </NavLink>

          {/* Good Recipt Dropdown */}
          <div className="relative">
            <button
              onClick={toggleGoodRecipt}
              className={`flex items-center gap-1 ${
                goodReciptOpen
                  ? "text-yellow-300 font-semibold"
                  : "hover:text-yellow-300"
              }`}
            >
              Good Recipt Section ▾
            </button>

            {goodReciptOpen && (
              <div className="absolute left-0 mt-2 bg-white text-black shadow-md rounded-md w-44 py-2 z-50">
                <NavLink
                  to="/dashboard/goodrecipts/grbyrail"
                  onClick={closeAllDropdowns}
                  className={({ isActive }) =>
                    `block px-4 py-2 hover:bg-gray-100 ${
                      isActive ? "text-yellow-600 font-semibold" : ""
                    }`
                  }
                >
                  GrByRail
                </NavLink>

                <NavLink
                  to="/dashboard/goodrecipts/grbyroad"
                  onClick={closeAllDropdowns}
                  className={({ isActive }) =>
                    `block px-4 py-2 hover:bg-gray-100 ${
                      isActive ? "text-yellow-600 font-semibold" : ""
                    }`
                  }
                >
                  GrByRoad
                </NavLink>
              </div>
            )}
          </div>

          {/* Warehouse Dropdown */}
          <div className="relative">
            <button
              onClick={toggleWarehouse}
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
                  onClick={closeAllDropdowns}
                  className={({ isActive }) =>
                    `block px-4 py-2 hover:bg-gray-100 ${
                      isActive ? "text-yellow-600 font-semibold" : ""
                    }`
                  }
                >
                  Godown
                </NavLink>

                <NavLink
                  to="/dashboard/warehouse/railheadinventory"
                  onClick={closeAllDropdowns}
                  className={({ isActive }) =>
                    `block px-4 py-2 hover:bg-gray-100 ${
                      isActive ? "text-yellow-600 font-semibold" : ""
                    }`
                  }
                >
                  Railhead Inventory
                </NavLink>

                <NavLink
                  to="/dashboard/warehouse/product-list"
                  onClick={closeAllDropdowns}
                  className={({ isActive }) =>
                    `block px-4 py-2 hover:bg-gray-100 ${
                      isActive ? "text-yellow-600 font-semibold" : ""
                    }`
                  }
                >
                  Product List
                </NavLink>

                <NavLink
                  to="/dashboard/warehouse/godown-tp"
                  onClick={closeAllDropdowns}
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
            onClick={closeAllDropdowns}
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
      <main
        className="flex-1 p-6"
        onClick={closeAllDropdowns} // Close dropdowns when clicking on main content
      >
        <Outlet />
      </main>
    </div>
  );
};
export default DashboardLayout;
