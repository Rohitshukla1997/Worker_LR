import { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import Login from "./Components/LoginPage/Login";
import DashboardLayout from "./Components/Dashboard/Dashboard";
import ProfileCard from "./Components/SubComponent/ProfileCard";
import Godown from "./Components/Warehouse Section/Godown/Godown";
import ProductList from "./Components/Warehouse Section/ProductList/ProductList";
import Inventory from "./Components/Warehouse Section/Invenotry/Inventory";
import GodownTP from "./Components/Warehouse Section/GodownTP/GodownTP";
import GrByRail from "./Components/GoodRecipts/GrByRail";
import GrByRoad from "./Components/GoodRecipts/GrByRoad";
import InventoryList from "./Components/Warehouse Section/Godown/component/InventoryList";
import RailheadIventory from "./Components/Warehouse Section/RailheadInventory/RailheadInventory";

// Create a wrapper component to protect routes
const PrivateRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const location = useLocation();

  useEffect(() => {
    // Check authentication status
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    setIsAuthenticated(!!(token && storedUser));
  }, []);

  // Show nothing while checking authentication
  if (isAuthenticated === null) {
    return null; // Or a loading spinner
  }

  // If authenticated, render the children (protected content)
  if (isAuthenticated) {
    return children;
  }

  // If not authenticated, redirect to login with return URL
  return (
    <Navigate
      to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
      replace
    />
  );
};

// Create a wrapper for the login route
const PublicRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    setIsAuthenticated(!!(token && storedUser));
  }, []);

  if (isAuthenticated === null) {
    return null;
  }

  // If already authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  const [user, setUser] = useState(null);

  // Load user/token from localStorage when app mounts
  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (data) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.worker));
    setUser(data.worker);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <Router>
      <Routes>
        {/* Login Route */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login onLogin={handleLogin} />
            </PublicRoute>
          }
        />

        {/* Dashboard with nested routes */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DashboardLayout user={user} onLogout={handleLogout} />
            </PrivateRoute>
          }
        >
          {/* Default Home (index route) → TpPass */}
          <Route index element={<GodownTP />} />

          {/* Add Warehouse Routes Here */}
          <Route path="warehouse/godown" element={<Godown />} />
          <Route
            path="warehouse/railheadinventory"
            element={<RailheadIventory />}
          />

          <Route
            path="warehouse/InventoryList/:id"
            element={<InventoryList />}
          />

          <Route path="warehouse/product-list" element={<ProductList />} />
          <Route path="warehouse/inventory" element={<Inventory />} />

          {/* Good Recipt Section */}
          <Route path="goodrecipts/grbyrail" element={<GrByRail />} />
          <Route path="goodrecipts/grbyroad" element={<GrByRoad />} />

          {/* About page → ProfileCard */}
          <Route path="profileCard" element={<ProfileCard />} />
        </Route>

        {/* Default redirect */}
        <Route
          path="/"
          element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
        />

        {/* Catch-all route - redirect to dashboard if authenticated, otherwise to login */}
        <Route
          path="*"
          element={
            user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
