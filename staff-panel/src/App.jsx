import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";

// Pages
import Login from "./pages/Login";
import StaffBilling from "./pages/staff/StaffBilling";
import StaffRoomBooking from "./pages/staff/StaffRoomBooking";
import StaffKotBilling from "./pages/staff/StaffKotBilling";
import StaffGRC from "./pages/staff/StaffGRC";
import StaffKDS from "./pages/staff/StaffKDS";
import StaffHallDisplay from "./pages/staff/StaffHallDisplay";

// Guard for Staff Routes
const StaffRoute = ({ children, currentUser, handleLogout, theme, toggleTheme }) => {
  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role !== "staff" && currentUser.role !== "admin") {
    return <Navigate to="/login" replace />;
  }
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar currentUser={currentUser} onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
};

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "dark";
  });

  useEffect(() => {
    if (theme === "light") {
      document.body.classList.add("light");
    } else {
      document.body.classList.remove("light");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");
    if (storedUser && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.role === "admin" || parsedUser.role === "staff") {
          setCurrentUser(parsedUser);
        } else {
          localStorage.removeItem("user");
        }
      } catch (err) {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setCurrentUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-lagoon-950 flex flex-col items-center justify-center text-saffron-400 font-bold font-display gap-3">
        <div className="w-10 h-10 border-3 border-saffron-500/30 border-t-saffron-500 rounded-full animate-spin"></div>
        <span>Loading Staff Panel...</span>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            currentUser ? (
              <Navigate to="/staff" replace />
            ) : (
              <Login onLoginSuccess={handleLoginSuccess} />
            )
          }
        />

        <Route
          path="/staff"
          element={
            <StaffRoute currentUser={currentUser} handleLogout={handleLogout} theme={theme} toggleTheme={toggleTheme}>
              <StaffBilling />
            </StaffRoute>
          }
        />

        <Route
          path="/staff/rooms"
          element={
            <StaffRoute currentUser={currentUser} handleLogout={handleLogout} theme={theme} toggleTheme={toggleTheme}>
              <StaffRoomBooking />
            </StaffRoute>
          }
        />

        <Route
          path="/staff/grc"
          element={
            <StaffRoute currentUser={currentUser} handleLogout={handleLogout} theme={theme} toggleTheme={toggleTheme}>
              <StaffGRC />
            </StaffRoute>
          }
        />

        <Route
          path="/staff/kot"
          element={
            <StaffRoute currentUser={currentUser} handleLogout={handleLogout} theme={theme} toggleTheme={toggleTheme}>
              <StaffKotBilling />
            </StaffRoute>
          }
        />

        <Route
          path="/staff/kds"
          element={
            <StaffRoute currentUser={currentUser} handleLogout={handleLogout} theme={theme} toggleTheme={toggleTheme}>
              <StaffKDS />
            </StaffRoute>
          }
        />

        <Route
          path="/staff/hall-display"
          element={
            <StaffRoute currentUser={currentUser} handleLogout={handleLogout} theme={theme} toggleTheme={toggleTheme}>
              <StaffHallDisplay />
            </StaffRoute>
          }
        />

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
