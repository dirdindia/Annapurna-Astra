import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";

// Pages
import Login from "./pages/Login";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminStaff from "./pages/admin/AdminStaff";
import AdminDishes from "./pages/admin/AdminDishes";
import AdminReports from "./pages/admin/AdminReports";
import AdminKotReports from "./pages/admin/AdminKotReports";
import AdminRooms from "./pages/admin/AdminRooms";
import AdminRoomReports from "./pages/admin/AdminRoomReports";
import AdminTables from "./pages/admin/AdminTables";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminInventory from "./pages/admin/AdminInventory";
import AdminBilling from "./pages/admin/AdminBilling";
import AdminLookups from "./pages/admin/AdminLookups";
import AdminKotPrint from "./pages/admin/AdminKotPrint";
import AdminQrOrders from "./pages/admin/AdminQrOrders";
import PublicGuestPortal from "./pages/public/PublicGuestPortal";


// Guard for Admin Routes
const AdminRoute = ({ children, currentUser, handleLogout, theme, toggleTheme }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role !== "hotel_admin") return <Navigate to="/login" replace />;
  return (
    <div className="min-h-screen flex flex-col overflow-hidden">
      <Navbar 
        currentUser={currentUser} 
        onLogout={handleLogout} 
        theme={theme} 
        toggleTheme={toggleTheme} 
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      <div className="flex flex-1 min-w-0 relative h-[calc(100vh-73px)]">
        <Sidebar isOpen={isSidebarOpen} closeSidebar={() => setIsSidebarOpen(false)} />
        <div className="flex-1 bg-slate-950/20 animate-fade-in min-w-0 overflow-x-hidden overflow-y-auto w-full">
          {children}
        </div>
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

  useEffect(() => {
    if (currentUser && currentUser.hotelName) {
      document.title = `${currentUser.hotelName} - E-Annapurna`;
    } else {
      document.title = "E-Annapurna - Hotel Admin Panel";
    }
  }, [currentUser]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");
    if (storedUser && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.role === "hotel_admin") {
          setCurrentUser(parsedUser);
        } else {
          localStorage.removeItem("user");
          localStorage.removeItem("token");
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
      <div className="min-h-screen bg-[#061C1C] flex flex-col items-center justify-center text-saffron-500 font-sans gap-3">
        <div className="w-10 h-10 border-4 border-saffron-500/20 border-t-saffron-500 rounded-full animate-spin"></div>
        <p className="text-sm font-bold tracking-wide">Loading E-Annapurna Admin...</p>
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
              <Navigate to="/admin" replace />
            ) : (
              <Login onLoginSuccess={handleLoginSuccess} />
            )
          }
        />

        <Route
          path="/admin"
          element={
            <AdminRoute currentUser={currentUser} handleLogout={handleLogout} theme={theme} toggleTheme={toggleTheme}>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/reports"
          element={
            <AdminRoute currentUser={currentUser} handleLogout={handleLogout} theme={theme} toggleTheme={toggleTheme}>
              <AdminReports />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/rooms"
          element={
            <AdminRoute currentUser={currentUser} handleLogout={handleLogout} theme={theme} toggleTheme={toggleTheme}>
              <AdminRooms />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/room-reports"
          element={
            <AdminRoute currentUser={currentUser} handleLogout={handleLogout} theme={theme} toggleTheme={toggleTheme}>
              <AdminRoomReports />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/settings"
          element={
            <AdminRoute currentUser={currentUser} handleLogout={handleLogout} theme={theme} toggleTheme={toggleTheme}>
              <AdminSettings />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/inventory"
          element={
            <AdminRoute currentUser={currentUser} handleLogout={handleLogout} theme={theme} toggleTheme={toggleTheme}>
              <AdminInventory />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/lookups"
          element={
            <AdminRoute currentUser={currentUser} handleLogout={handleLogout} theme={theme} toggleTheme={toggleTheme}>
              <AdminLookups />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/kot-reports"
          element={
            <AdminRoute currentUser={currentUser} handleLogout={handleLogout} theme={theme} toggleTheme={toggleTheme}>
              <AdminKotReports />
            </AdminRoute>
          }
        />
        
        <Route
          path="/admin/kot-print"
          element={
            <AdminRoute currentUser={currentUser} handleLogout={handleLogout} theme={theme} toggleTheme={toggleTheme}>
              <AdminKotPrint />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/staff"
          element={
            <AdminRoute currentUser={currentUser} handleLogout={handleLogout} theme={theme} toggleTheme={toggleTheme}>
              <AdminStaff />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/dishes"
          element={
            <AdminRoute currentUser={currentUser} handleLogout={handleLogout} theme={theme} toggleTheme={toggleTheme}>
              <AdminDishes />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/tables"
          element={
            <AdminRoute currentUser={currentUser} handleLogout={handleLogout} theme={theme} toggleTheme={toggleTheme}>
              <AdminTables />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/billing"
          element={
            <AdminRoute currentUser={currentUser} handleLogout={handleLogout} theme={theme} toggleTheme={toggleTheme}>
              <AdminBilling />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/subscription"
          element={
            <AdminRoute currentUser={currentUser} handleLogout={handleLogout} theme={theme} toggleTheme={toggleTheme}>
              <AdminBilling />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/qr-orders"
          element={
            <AdminRoute currentUser={currentUser} handleLogout={handleLogout} theme={theme} toggleTheme={toggleTheme}>
              <AdminQrOrders />
            </AdminRoute>
          }
        />

        {/* Public Scan & Order / Table Booking Portal (No Login Required) */}
        <Route path="/menu/:hotelId" element={<PublicGuestPortal />} />
        <Route path="/scan/:hotelId" element={<PublicGuestPortal />} />

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
