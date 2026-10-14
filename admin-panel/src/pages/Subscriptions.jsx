import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown,
  Search,
  Building2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Edit3,
  Power,
  ShieldCheck,
  Zap,
  Sparkles,
  Lock,
  Unlock,
  X,
  Clock,
  ArrowRight,
} from 'lucide-react';
import api from '../api';
import Swal from 'sweetalert2';

export default function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'active' | 'inactive' | 'expired'
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, expired: 0 });
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [editForm, setEditForm] = useState({ plan: 'Growth', isActive: true, days: 30 });
  const [submitting, setSubmitting] = useState(false);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/superadmin/subscriptions');
      if (res.data?.data) {
        setSubscriptions(res.data.data);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      }
    } catch (err) {
      console.error('Failed to fetch subscriptions:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load hotel subscription data.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleOpenEdit = (hotel) => {
    setSelectedHotel(hotel);
    setEditForm({
      plan: hotel.plan === 'none' ? 'Starter' : hotel.plan,
      isActive: hotel.isActive,
      days: hotel.daysRemaining > 0 ? hotel.daysRemaining : 30,
    });
  };

  const handleSaveSubscription = async (e) => {
    e.preventDefault();
    if (!selectedHotel) return;

    try {
      setSubmitting(true);
      const res = await api.put(`/superadmin/hotels/${selectedHotel._id}/subscription`, {
        plan: editForm.plan,
        isActive: editForm.isActive,
        days: editForm.days,
      });

      if (res.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Subscription Updated',
          text: `${selectedHotel.hotelName}'s subscription has been updated to ${editForm.plan} plan.`,
          timer: 2000,
          showConfirmButton: false,
        });
        setSelectedHotel(null);
        fetchSubscriptions();
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Failed',
        text: err.response?.data?.message || 'Failed to update subscription',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (hotel) => {
    const actionText = hotel.isActive ? 'deactivate' : 'activate';
    const result = await Swal.fire({
      title: `${hotel.isActive ? 'Suspend' : 'Activate'} Subscription?`,
      html: `
        <div class="text-left text-sm space-y-2 mt-2">
          <p>Are you sure you want to <b>${actionText}</b> subscription for <b>${hotel.hotelName}</b>?</p>
          <p class="${hotel.isActive ? 'text-rose-600' : 'text-emerald-600'} font-semibold">
            ${hotel.isActive ? '⚠️ Staff members will be locked out and cannot log in.' : '✓ Staff members will be unlocked and can log in immediately.'}
          </p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: hotel.isActive ? '#E11D48' : '#0F4B4A',
      cancelButtonColor: '#94A3B8',
      confirmButtonText: `Yes, ${actionText}!`,
    });

    if (result.isConfirmed) {
      try {
        await api.put(`/superadmin/hotels/${hotel._id}/subscription`, {
          isActive: !hotel.isActive,
          plan: hotel.plan === 'none' ? 'Starter' : hotel.plan,
          days: 30,
        });
        Swal.fire({
          icon: 'success',
          title: 'Status Updated',
          text: `Hotel subscription status has been updated.`,
          timer: 1500,
          showConfirmButton: false,
        });
        fetchSubscriptions();
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to update status',
        });
      }
    }
  };

  // Filter subscriptions
  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesSearch =
      sub.hotelName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.hotelEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.ownerName?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'active') return sub.isActive;
    if (activeTab === 'inactive') return !sub.isActive && !sub.isExpired;
    if (activeTab === 'expired') return sub.isExpired;
    return true;
  });

  return (
    <div className="space-y-7 max-w-7xl mx-auto pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-saffron-500/10 border border-saffron-500/20 text-saffron-700 text-xs font-bold uppercase tracking-wider mb-2">
            <Crown className="w-3.5 h-3.5 text-saffron-600" />
            SaaS Plan Administration
          </div>
          <h1 className="text-3xl font-display font-extrabold text-lagoon-950 tracking-tight">
            Hotel Subscriptions Management
          </h1>
          <p className="text-sm text-lagoon-700/80 mt-1 font-medium">
            Supervise active plans, grant extensions, and manage staff login permissions for all hotels.
          </p>
        </div>

        <button
          onClick={fetchSubscriptions}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white border border-lagoon-200 text-lagoon-900 hover:text-saffron-700 hover:border-saffron-500 shadow-sm transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Data
        </button>
      </div>

      {/* Metric Cards - Harmonized StayFlow Palette */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Hotels */}
        <div className="stayflow-card p-6 rounded-3xl relative overflow-hidden group hover:border-lagoon-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-lagoon-600 uppercase tracking-wider">Total Hotels</span>
            <div className="w-10 h-10 rounded-2xl bg-lagoon-900 text-white flex items-center justify-center shadow-md">
              <Building2 className="w-5 h-5 text-saffron-400" />
            </div>
          </div>
          <h3 className="text-3xl font-black text-lagoon-950 font-display">{stats.total}</h3>
          <p className="text-xs text-lagoon-600 mt-1 font-medium">Onboarded properties</p>
        </div>

        {/* Active Subscriptions */}
        <div className="bg-white p-6 rounded-3xl border border-emerald-200/80 shadow-[0_8px_30px_rgb(16,185,129,0.06)] relative overflow-hidden group hover:border-emerald-400 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Active Subscriptions</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-3xl font-black text-emerald-700 font-display">{stats.active}</h3>
          <p className="text-xs text-emerald-600 mt-1 font-semibold flex items-center gap-1">
            <Unlock className="w-3.5 h-3.5" /> Staff Logins Enabled
          </p>
        </div>

        {/* No Plan / Inactive */}
        <div className="bg-white p-6 rounded-3xl border border-saffron-400/40 shadow-[0_8px_30px_rgb(242,163,58,0.06)] relative overflow-hidden group hover:border-saffron-500 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-saffron-700 uppercase tracking-wider">Inactive / None</span>
            <div className="w-10 h-10 rounded-2xl bg-saffron-500/10 text-saffron-600 border border-saffron-500/20 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-3xl font-black text-saffron-700 font-display">{stats.inactive}</h3>
          <p className="text-xs text-saffron-600 mt-1 font-semibold flex items-center gap-1">
            <Lock className="w-3.5 h-3.5" /> Staff Logins Locked
          </p>
        </div>

        {/* Expired */}
        <div className="bg-white p-6 rounded-3xl border border-rose-200/80 shadow-[0_8px_30px_rgb(225,29,72,0.06)] relative overflow-hidden group hover:border-rose-400 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">Expired</span>
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-3xl font-black text-rose-700 font-display">{stats.expired}</h3>
          <p className="text-xs text-rose-600 mt-1 font-semibold flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Renewal Overdue
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="stayflow-card rounded-3xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Tabs */}
        <div className="inline-flex items-center p-1.5 bg-lagoon-50 rounded-2xl border border-lagoon-100 w-full md:w-auto overflow-x-auto">
          {[
            { id: 'all', label: 'All Hotels', count: stats.total },
            { id: 'active', label: 'Active', count: stats.active },
            { id: 'inactive', label: 'Inactive / None', count: stats.inactive },
            { id: 'expired', label: 'Expired', count: stats.expired },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-lagoon-900 text-white shadow-md'
                  : 'text-lagoon-800 hover:text-lagoon-950 hover:bg-white/60'
              }`}
            >
              {tab.label}
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-lagoon-200/60 text-lagoon-800'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-lagoon-500" />
          <input
            type="text"
            placeholder="Search hotel, owner, or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-lagoon-200 rounded-2xl text-xs font-medium text-lagoon-950 focus:outline-none focus:ring-4 focus:ring-saffron-500/10 focus:border-saffron-500 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="stayflow-card rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-lagoon-50/80 border-b border-lagoon-100 text-lagoon-900 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Hotel Property</th>
                <th className="px-6 py-4">Owner Contact</th>
                <th className="px-6 py-4">Current Plan</th>
                <th className="px-6 py-4">Access Status</th>
                <th className="px-6 py-4">Subscription Validity</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-lagoon-100/70">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center">
                    <RefreshCw className="w-8 h-8 text-lagoon-700 animate-spin mx-auto mb-2" />
                    <p className="text-lagoon-700 text-sm font-semibold">Loading subscriptions...</p>
                  </td>
                </tr>
              ) : filteredSubscriptions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center">
                    <div className="w-14 h-14 bg-lagoon-50 rounded-2xl flex items-center justify-center mx-auto mb-3 text-lagoon-600">
                      <Crown className="w-7 h-7" />
                    </div>
                    <h4 className="text-base font-bold text-lagoon-950 font-display">No hotels match this filter</h4>
                    <p className="text-xs text-lagoon-600 mt-1">Try clearing your search query or selecting another tab.</p>
                  </td>
                </tr>
              ) : (
                filteredSubscriptions.map((hotel, idx) => (
                  <motion.tr
                    key={hotel._id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className="hover:bg-lagoon-50/40 transition-colors"
                  >
                    {/* Hotel Details */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-lagoon-800 to-lagoon-950 border border-lagoon-700 text-saffron-400 font-black text-sm flex items-center justify-center shrink-0 shadow-sm font-display">
                          {hotel.logo ? (
                            <img src={hotel.logo} alt="logo" className="w-full h-full object-cover rounded-2xl" />
                          ) : (
                            hotel.hotelName?.charAt(0) || 'H'
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-lagoon-950 text-sm font-display">{hotel.hotelName}</p>
                          <p className="text-xs text-lagoon-600 font-medium">
                            {hotel.city ? `${hotel.city}` : 'N/A'}{hotel.state ? `, ${hotel.state}` : ''}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Owner Details */}
                    <td className="px-6 py-4">
                      <p className="font-bold text-lagoon-900 text-xs">{hotel.ownerName}</p>
                      <p className="text-xs text-lagoon-600 font-medium">{hotel.hotelEmail}</p>
                      <p className="text-[11px] text-lagoon-500 font-mono">{hotel.hotelPhone}</p>
                    </td>

                    {/* Plan Badge */}
                    <td className="px-6 py-4">
                      {hotel.plan === 'Growth' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-saffron-500/15 text-saffron-800 border border-saffron-500/30 shadow-sm">
                          <Crown className="w-3.5 h-3.5 text-saffron-600" /> Growth (₹3,999)
                        </span>
                      )}
                      {hotel.plan === 'Enterprise' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200 shadow-sm">
                          <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Enterprise (₹9,999)
                        </span>
                      )}
                      {hotel.plan === 'Starter' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-lagoon-50 text-lagoon-800 border border-lagoon-200 shadow-sm">
                          <ShieldCheck className="w-3.5 h-3.5 text-lagoon-600" /> Starter (₹1,499)
                        </span>
                      )}
                      {(hotel.plan === 'none' || !hotel.plan) && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          None (Unsubscribed)
                        </span>
                      )}
                    </td>

                    {/* Access Status Badge */}
                    <td className="px-6 py-4">
                      {hotel.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-sm">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Active (Staff Login On)
                        </span>
                      ) : hotel.isExpired ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-300">
                          <span className="w-2 h-2 rounded-full bg-rose-500"></span> Expired (Staff Locked)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300">
                          <Lock className="w-3 h-3 text-amber-600" /> None (Staff Locked)
                        </span>
                      )}
                    </td>

                    {/* Validity Info */}
                    <td className="px-6 py-4">
                      {hotel.validUntil ? (
                        <div>
                          <p className="text-xs font-bold text-lagoon-950">
                            {new Date(hotel.validUntil).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                          <span
                            className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${
                              hotel.daysRemaining > 5
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : hotel.daysRemaining > 0
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {hotel.daysRemaining > 0 ? `${hotel.daysRemaining} days left` : 'Expired'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">No active validity</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(hotel)}
                          className="px-3 py-1.5 rounded-xl bg-lagoon-50 hover:bg-lagoon-100 text-lagoon-900 border border-lagoon-200/80 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                          title="Manage Plan & Validity"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-saffron-600" /> Manage
                        </button>
                        <button
                          onClick={() => handleToggleStatus(hotel)}
                          className={`p-2 rounded-xl transition-all border ${
                            hotel.isActive
                              ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                          }`}
                          title={hotel.isActive ? 'Suspend Staff Access' : 'Activate Staff Access'}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Subscription Modal */}
      <AnimatePresence>
        {selectedHotel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedHotel(null)}
              className="fixed inset-0 bg-lagoon-950/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-lagoon-100 overflow-hidden z-10"
            >
              {/* Modal Header */}
              <div className="p-6 bg-gradient-to-r from-lagoon-900 via-lagoon-800 to-lagoon-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white/10 text-saffron-400 rounded-2xl border border-white/20">
                    <Crown className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg font-display">Manage Subscription</h3>
                    <p className="text-xs text-lagoon-100/80">{selectedHotel.hotelName}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedHotel(null)}
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveSubscription} className="p-6 space-y-5 bg-white">
                {/* Plan Selection */}
                <div>
                  <label className="block text-xs font-bold text-lagoon-900 uppercase tracking-wider mb-2">
                    Assign Plan
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'Starter', label: 'Starter', price: '₹1,499' },
                      { id: 'Growth', label: 'Growth', price: '₹3,999' },
                      { id: 'Enterprise', label: 'Enterprise', price: '₹9,999' },
                    ].map((p) => (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => setEditForm({ ...editForm, plan: p.id })}
                        className={`p-3 rounded-2xl border text-xs font-bold text-center transition-all ${
                          editForm.plan === p.id
                            ? 'border-saffron-500 bg-saffron-500/10 text-saffron-900 ring-2 ring-saffron-500/20'
                            : 'border-lagoon-200 bg-lagoon-50/50 text-lagoon-800 hover:bg-lagoon-50'
                        }`}
                      >
                        <p>{p.label}</p>
                        <p className="text-[10px] text-lagoon-600 font-semibold mt-0.5">{p.price}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status Toggle */}
                <div>
                  <label className="block text-xs font-bold text-lagoon-900 uppercase tracking-wider mb-2">
                    Staff Login Status
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setEditForm({ ...editForm, isActive: true })}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                        editForm.isActive
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <Unlock className="w-3.5 h-3.5 text-emerald-600" /> Active (Staff Unlocked)
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditForm({ ...editForm, isActive: false })}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                        !editForm.isActive
                          ? 'bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-500/20'
                          : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5 text-rose-600" /> Inactive (Staff Locked)
                    </button>
                  </div>
                </div>

                {/* Validity Duration */}
                <div>
                  <label className="block text-xs font-bold text-lagoon-900 uppercase tracking-wider mb-2">
                    Set Validity Period (Days from Today)
                  </label>
                  <div className="flex items-center gap-2 mb-2">
                    {[30, 90, 180, 365].map((d) => (
                      <button
                        type="button"
                        key={d}
                        onClick={() => setEditForm({ ...editForm, days: d })}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                          editForm.days === d
                            ? 'bg-lagoon-900 text-white border-lagoon-900 shadow-sm'
                            : 'bg-lagoon-50 border-lagoon-200 text-lagoon-800 hover:bg-lagoon-100'
                        }`}
                      >
                        {d} Days
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={editForm.days}
                    onChange={(e) => setEditForm({ ...editForm, days: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-lagoon-200 rounded-xl text-xs font-semibold text-lagoon-950 focus:outline-none focus:border-saffron-500 focus:ring-2 focus:ring-saffron-500/10"
                    placeholder="Enter custom number of days"
                  />
                </div>

                {/* Action Buttons */}
                <div className="pt-3 flex items-center justify-end gap-3 border-t border-lagoon-100">
                  <button
                    type="button"
                    onClick={() => setSelectedHotel(null)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-saffron-500 to-amber-500 text-slate-950 hover:brightness-105 shadow-md shadow-saffron-500/20 transition-all flex items-center gap-1.5"
                  >
                    {submitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                    Save Subscription Plan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
