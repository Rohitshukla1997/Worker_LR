import { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./Components/LoginPage/Login";
import DashboardLayout from "./Components/Dashboard/Dashboard";
import ProfileCard from "./Components/SubComponent/ProfileCard";
import TpPass from "./Components/TransportPass/TpPass";
import Godown from "./Components/Warehouse Section/Godown/Godown";
import ProductList from "./Components/Warehouse Section/ProductList/ProductList";
import Inventory from "./Components/Warehouse Section/Invenotry/Inventory";
import GodownTP from "./Components/Warehouse Section/GodownTP/GodownTP";

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
            user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />

        {/* Dashboard with nested routes */}
        <Route
          path="/dashboard"
          element={
            user ? (
              <DashboardLayout user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          {/* Default Home (index route) → TpPass */}
          <Route index element={<TpPass />} />

          {/* Add Warehouse Routes Here */}
          <Route path="warehouse/godown" element={<Godown />} />
          <Route path="warehouse/product-list" element={<ProductList />} />
          <Route path="warehouse/inventory" element={<Inventory />} />
          <Route path="warehouse/godown-tp" element={<GodownTP />} />

          {/* About page → ProfileCard */}
          <Route path="profileCard" element={<ProfileCard />} />
        </Route>

        {/* Default redirect */}
        <Route
          path="*"
          element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
        />
      </Routes>
    </Router>
  );
}

export default App;
