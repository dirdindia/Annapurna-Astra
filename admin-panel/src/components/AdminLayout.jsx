import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Settings, LogOut, Building2, ChevronLeft, ChevronRight, Menu, X, Bell, Receipt, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/superadmin/notifications', { headers: { hideLoader: true } });
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  const handleReadNotification = async (id) => {
    try {
      await api.put(`/superadmin/notifications/${id}/read`);
      if (Array.isArray(notifications)) {
        setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = Array.isArray(notifications) ? notifications.filter(n => !n.isRead).length : 0;

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: 'Customers', path: '/customers', icon: <Users className="w-5 h-5" /> },
    { name: 'Subscriptions', path: '/subscriptions', icon: <Crown className="w-5 h-5" /> },
    { name: 'Invoices', path: '/invoices', icon: <Receipt className="w-5 h-5" /> },
    { name: 'Settings', path: '/settings', icon: <Settings className="w-5 h-5" /> },
  ];

  const SidebarContent = () => (
    <>
      <div className={`p-5 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} border-b border-white/10`}>
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="bg-lagoon-700 border border-white/20 p-2 rounded-xl shadow-lg shrink-0">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          {!isCollapsed && (
            <motion.h1 
              initial={{ opacity: 0, w: 0 }}
              animate={{ opacity: 1, w: 'auto' }}
              exit={{ opacity: 0, w: 0 }}
              className="text-xl font-black text-white tracking-tight whitespace-nowrap font-display"
            >
              Annapurna <span className="text-saffron-400">Astra</span>
            </motion.h1>
          )}
        </div>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 p-3 rounded-xl transition-all duration-300 group ${
                isActive 
                  ? 'bg-white/10 text-white font-bold shadow-[inset_4px_0_0_#F2A33A]' 
                  : 'text-slate-300 hover:bg-white/5 hover:text-white font-medium'
              } ${isCollapsed ? 'justify-center' : ''}`
            }
            title={isCollapsed ? item.name : ''}
          >
            <div className={`relative ${window.location.pathname.includes(item.path) ? 'text-saffron-400 drop-shadow-[0_0_8px_rgba(242,163,58,0.5)]' : 'text-slate-400 group-hover:text-white'}`}>
              {item.icon}
            </div>
            {!isCollapsed && <span className="whitespace-nowrap">{item.name}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 w-full p-3 text-slate-300 hover:bg-red-500/20 hover:text-red-400 font-medium rounded-xl transition-all group ${isCollapsed ? 'justify-center' : ''}`}
          title={isCollapsed ? "Logout" : ""}
        >
          <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-linen font-sans overflow-hidden">
      
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="fixed top-0 left-0 h-full w-64 bg-lagoon-900 border-r border-black/10 z-50 flex flex-col shadow-2xl lg:hidden"
            >
              <div className="absolute top-4 right-4 z-50">
                <button onClick={() => setIsMobileOpen(false)} className="p-2 text-slate-300 hover:text-white bg-black/20 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex flex-col bg-lagoon-900 border-r border-black/10 z-30 transition-all duration-300 relative shadow-2xl ${isCollapsed ? 'w-20' : 'w-64'}`}>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-4 top-8 bg-lagoon-700 border border-black/20 text-white p-1.5 rounded-full hover:bg-lagoon-500 hover:scale-110 transition-all z-40 shadow-lg"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Background ambient glow */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-lagoon-400/5 rounded-full blur-[100px] pointer-events-none mix-blend-multiply"></div>
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-saffron-400/5 rounded-full blur-[100px] pointer-events-none mix-blend-multiply"></div>

        {/* Header */}
        <header className="bg-white/90 backdrop-blur-md border-b border-lagoon-100/80 shadow-sm h-20 flex items-center justify-between px-4 sm:px-8 z-20 shrink-0 sticky top-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden p-2 text-lagoon-800 hover:bg-lagoon-50 rounded-xl transition-colors shadow-sm"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden sm:flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold text-lagoon-600 uppercase tracking-wider">Annapurna Astra Cloud System Control</span>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2.5 text-lagoon-700 hover:text-saffron-600 hover:bg-lagoon-50 rounded-xl transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-saffron-500 rounded-full ring-2 ring-white"></span>
                )}
              </button>
              
              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-lagoon-100 overflow-hidden z-50"
                  >
                    <div className="p-4 border-b border-lagoon-100 flex items-center justify-between bg-lagoon-50/60">
                      <h3 className="font-bold text-lagoon-900 font-display">System Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="bg-saffron-500/15 text-saffron-700 text-xs px-2.5 py-0.5 rounded-full font-bold border border-saffron-500/20">
                          {unreadCount} New
                        </span>
                      )}
                    </div>
                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 text-sm">No new notifications</div>
                      ) : (
                        notifications.map((notif) => (
                          <div 
                            key={notif._id} 
                            onClick={() => !notif.isRead && handleReadNotification(notif._id)}
                            className={`p-4 border-b border-lagoon-50 cursor-pointer transition-colors hover:bg-lagoon-50/40 ${!notif.isRead ? 'bg-saffron-500/5' : ''}`}
                          >
                            <div className="flex justify-between items-start mb-1">
                              <h4 className={`text-sm ${!notif.isRead ? 'font-bold text-lagoon-950' : 'font-medium text-lagoon-800'}`}>{notif.title}</h4>
                              <span className="text-[10px] text-lagoon-400 whitespace-nowrap ml-2">
                                {new Date(notif.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 line-clamp-2">{notif.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="h-8 w-px bg-lagoon-200/60 hidden sm:block"></div>
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-bold text-lagoon-950 group-hover:text-saffron-600 transition-colors font-display">Super Admin</p>
                <p className="text-xs text-lagoon-500 font-medium">admin@gmail.com</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lagoon-800 to-lagoon-950 border border-lagoon-700 flex items-center justify-center text-saffron-400 font-black shadow-md font-display">
                SA
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-4 sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="max-w-7xl mx-auto h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
