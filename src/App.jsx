import { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./Components/LoginPage/Login";
import Dashboard from "./Components/Dashboard/Dashboard";
import ProfileCard from "./Components/SubComponent/ProfileCard";

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
    // Save token and user info
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

        {/* Dashboard + Nested Routes */}
        <Route
          path="/dashboard"
          element={
            user ? (
              <Dashboard user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          {/* 👇 Nested Route Example */}
          <Route path="profileCard" element={<ProfileCard />} />
        </Route>

        {/* Default Route */}
        <Route
          path="*"
          element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
        />
      </Routes>
    </Router>
  );
}

export default App;
