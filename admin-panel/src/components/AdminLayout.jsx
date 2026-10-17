import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Settings, LogOut, Building2, ChevronLeft, ChevronRight, Menu, X, Bell, Receipt, Crown, Sparkles, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';
import MagneticButton from './MagneticButton';

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
        <div className="flex items-center gap-3 overflow-hidden cursor-pointer" onClick={() => navigate('/dashboard')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400/20 to-saffron-500/20 border border-saffron-500/40 flex items-center justify-center p-1 shadow-md shrink-0">
            <img src="/favicon.svg" alt="Annapurna Astra Logo" className="w-6 h-6 rounded-lg" />
          </div>
          {!isCollapsed && (
            <motion.div 
              initial={{ opacity: 0, w: 0 }}
              animate={{ opacity: 1, w: 'auto' }}
              exit={{ opacity: 0, w: 0 }}
              className="flex flex-col"
            >
              <h1 className="text-xl font-black text-white tracking-tight whitespace-nowrap font-display leading-tight">
                Annapurna <span className="text-saffron-400">Astra</span>
              </h1>
              <p className="text-[11px] uppercase tracking-widest text-saffron-400 font-extrabold mt-0.5">
                Super Admin Cloud
              </p>
            </motion.div>
          )}
        </div>
      </div>

      <nav className="flex-1 py-5 px-3.5 space-y-2 overflow-y-auto custom-scrollbar">
        {!isCollapsed && (
          <div className="px-3 py-1 flex items-center justify-between border-b border-white/[0.08] mb-2 pb-2">
            <p className="text-[11px] uppercase font-black tracking-widest text-saffron-400">
              Admin Navigation
            </p>
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Root
            </span>
          </div>
        )}

        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3.5 px-3.5 py-3 rounded-xl transition-all duration-300 group cursor-pointer ${
                isActive 
                  ? 'bg-gradient-to-r from-saffron-500/25 via-saffron-500/15 to-transparent text-white font-bold border-l-4 border-saffron-500 shadow-md shadow-saffron-500/10' 
                  : 'text-slate-200 hover:bg-white/10 hover:text-white font-semibold'
              } ${isCollapsed ? 'justify-center px-2' : ''}`
            }
            title={isCollapsed ? item.name : ''}
          >
            <div className={`relative transition-transform duration-200 group-hover:scale-110 ${window.location.pathname.includes(item.path) ? 'text-saffron-400 drop-shadow-[0_0_8px_rgba(242,163,58,0.6)]' : 'text-slate-300 group-hover:text-white'}`}>
              {item.icon}
            </div>
            {!isCollapsed && (
              <span className="whitespace-nowrap text-[14.5px] font-bold tracking-wide">
                {item.name}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        <MagneticButton className="w-full">
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 w-full px-3.5 py-3 text-slate-200 hover:bg-red-500/20 hover:text-red-300 font-bold text-sm rounded-xl transition-all group cursor-pointer ${isCollapsed ? 'justify-center px-2' : ''}`}
            title={isCollapsed ? "Logout" : ""}
          >
            <LogOut className="w-5 h-5 text-rose-400 group-hover:-translate-x-1 transition-transform shrink-0" />
            {!isCollapsed && <span>Logout Master</span>}
          </button>
        </MagneticButton>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-[#FAFAF6] font-sans overflow-hidden selection:bg-amber-400 selection:text-slate-900">
      
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="fixed top-0 left-0 h-full w-72 bg-gradient-to-b from-lagoon-950 via-lagoon-900 to-lagoon-950 border-r border-lagoon-800/50 z-50 flex flex-col shadow-2xl lg:hidden"
            >
              <div className="absolute top-4 right-4 z-50">
                <MagneticButton>
                  <button onClick={() => setIsMobileOpen(false)} className="p-2 text-slate-300 hover:text-white bg-black/20 rounded-xl cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </MagneticButton>
              </div>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex flex-col bg-gradient-to-b from-lagoon-950 via-lagoon-900 to-lagoon-950 border-r border-lagoon-800/40 z-30 transition-all duration-300 relative shadow-2xl ${isCollapsed ? 'w-20' : 'w-68'}`}>
        <div className="absolute -right-4 top-8 z-40">
          <MagneticButton>
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="bg-lagoon-800 border border-saffron-500/40 text-saffron-400 p-1.5 rounded-full hover:bg-lagoon-700 hover:scale-110 transition-all shadow-lg cursor-pointer"
            >
              {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </button>
          </MagneticButton>
        </div>
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Background ambient glow */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-lagoon-400/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-saffron-400/5 rounded-full blur-[100px] pointer-events-none" />

        {/* Header */}
        <header className="bg-white/95 backdrop-blur-xl border-b border-lagoon-100/90 shadow-sm h-18 flex items-center justify-between px-4 sm:px-8 z-20 shrink-0 sticky top-0">
          <div className="flex items-center gap-4">
            <MagneticButton>
              <button 
                onClick={() => setIsMobileOpen(true)}
                className="lg:hidden p-2 text-lagoon-800 hover:bg-lagoon-50 rounded-xl transition-colors shadow-sm cursor-pointer"
              >
                <Menu className="w-6 h-6" />
              </button>
            </MagneticButton>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-lagoon-50/80 border border-lagoon-200/60">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[11px] font-bold text-lagoon-800 uppercase tracking-wider">
                Annapurna Astra Cloud Architecture Control
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-5">
            <div className="relative">
              <MagneticButton>
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2.5 text-lagoon-800 hover:text-saffron-600 hover:bg-lagoon-50 rounded-xl transition-colors cursor-pointer"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-saffron-500 rounded-full ring-2 ring-white"></span>
                  )}
                </button>
              </MagneticButton>
              
              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                    className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-lagoon-100 overflow-hidden z-50"
                  >
                    <div className="p-4 border-b border-lagoon-100 flex items-center justify-between bg-lagoon-50/80">
                      <h3 className="font-bold text-lagoon-900 font-display text-sm">System Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="bg-saffron-500/15 text-saffron-700 text-xs px-2.5 py-0.5 rounded-full font-bold border border-saffron-500/20">
                          {unreadCount} New
                        </span>
                      )}
                    </div>
                    <div className="max-h-[360px] overflow-y-auto custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 text-sm">No new notifications</div>
                      ) : (
                        notifications.map((notif) => (
                          <div 
                            key={notif._id} 
                            onClick={() => !notif.isRead && handleReadNotification(notif._id)}
                            className={`p-3.5 border-b border-lagoon-50 cursor-pointer transition-colors hover:bg-lagoon-50/40 ${!notif.isRead ? 'bg-saffron-500/5' : ''}`}
                          >
                            <div className="flex justify-between items-start mb-1">
                              <h4 className={`text-xs ${!notif.isRead ? 'font-bold text-lagoon-950' : 'font-medium text-lagoon-800'}`}>{notif.title}</h4>
                              <span className="text-[10px] text-lagoon-400 whitespace-nowrap ml-2">
                                {new Date(notif.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 line-clamp-2">{notif.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="h-8 w-px bg-lagoon-200/60 hidden sm:block"></div>

            {/* Super Admin Profile Pill */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-xs font-black text-lagoon-950 font-display leading-tight">Super Admin</p>
                <p className="text-[10px] text-saffron-700 font-bold uppercase tracking-wider">Root Cloud Authority</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-lagoon-800 to-lagoon-950 border border-saffron-500/30 flex items-center justify-center text-saffron-400 font-black shadow-md font-display text-xs">
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
