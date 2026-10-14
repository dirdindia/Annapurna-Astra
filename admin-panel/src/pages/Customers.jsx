import { useState, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  Mail, 
  Phone, 
  ShieldCheck, 
  FileText, 
  CreditCard, 
  Globe, 
  Clock, 
  Receipt, 
  Percent, 
  Crown, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  Copy, 
  Check, 
  ExternalLink, 
  X, 
  Star, 
  Landmark, 
  Sparkles,
  Eye, 
  Search, 
  Trash2, 
  Power,
  Shield,
  FileCheck,
  Calendar,
  Lock,
  Unlock,
  Smartphone,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';
import Swal from 'sweetalert2';

const InstagramIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

const FacebookIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

const showToast = (message, icon = 'success') => {
  const Toast = Swal.mixin({
    toast: true,
    position: 'top',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    background: '#061C1C',
    color: '#ffffff',
    iconColor: '#F2A33A',
    didOpen: (toast) => {
      toast.onmouseenter = Swal.stopTimer;
      toast.onmouseleave = Swal.resumeTimer;
    }
  });
  Toast.fire({ icon, title: message });
};

export default function Customers() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [copiedKey, setCopiedKey] = useState(null);

  // Fetch hotels from backend
  const fetchHotels = async () => {
    try {
      const response = await api.get('/superadmin/hotels');
      setHotels(response.data);
    } catch (error) {
      console.error("Error fetching hotels:", error);
      showToast('Failed to load hotels data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotels();
  }, []);

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast(`Copied to clipboard`, 'success');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCopySummary = (h) => {
    if (!h) return;
    const summary = `
========================================
STAYFLOW HOTEL SUMMARY
========================================
Hotel Name: ${h.name}
Star Rating: ${h.starRating || '3-Star'}
Property Type: ${h.type || 'Hotel'}
Hotel ID: ${h._id}
Official Email: ${h.email}
Phone / Contact: ${h.contact || h.phone || 'N/A'}
Reception Phone: ${h.receptionPhone || 'N/A'}
Address: ${h.address || 'N/A'}
Location: ${h.city || ''}, ${h.state || ''} - ${h.pincode || ''}

----------------------------------------
OWNER / ADMIN DETAILS
----------------------------------------
Owner Name: ${h.ownerName || 'Admin'}
Owner Email: ${h.ownerEmail || h.email}
Owner Mobile: ${h.ownerMobile || h.phone || 'N/A'}

----------------------------------------
LEGAL & TAX COMPLIANCE
----------------------------------------
GSTIN: ${h.gstin || 'N/A'}
PAN Number: ${h.panNumber || 'N/A'}
FSSAI License: ${h.fssaiNumber || 'N/A'}
Trade License: ${h.tradeLicenseNumber || 'N/A'}
CIN: ${h.cinNo || 'N/A'}

----------------------------------------
OPERATIONS & POLICIES
----------------------------------------
Check-In Time: ${h.checkInTime || '12:00 PM'}
Check-Out Time: ${h.checkOutTime || '11:00 AM'}
Room GST: ${h.roomGstRate ?? 12}% | Food GST: ${h.foodGstRate ?? 5}%
Prefixes: Room (${h.invoicePrefixRoom || 'ROOM-'}) | Restaurant (${h.invoicePrefixRestaurant || 'REST-'})
ID Proof Policy: ${h.idProofPolicy || 'Standard'}

----------------------------------------
BANKING & UPI
----------------------------------------
UPI ID: ${h.upiId || 'N/A'}
Bank Name: ${h.bankName || 'N/A'}
Account Number: ${h.bankAccountNumber || 'N/A'}
IFSC Code: ${h.bankIfscCode || 'N/A'}
Account Holder: ${h.bankAccountName || 'N/A'}

----------------------------------------
SUBSCRIPTION & STATUS
----------------------------------------
Plan: ${h.subscriptionPlan || 'none'}
Status: ${h.subscriptionStatus}
Account: ${h.isActive ? 'Active' : 'Suspended'}
Registered On: ${new Date(h.createdAt).toLocaleDateString()}
========================================
    `.trim();

    navigator.clipboard.writeText(summary);
    showToast('Full hotel dossier copied to clipboard!', 'success');
  };

  const handleView = (hotel) => {
    setSelectedHotel(hotel);
    setActiveTab('overview');
  };

  const handleToggleSubscription = async (hotel) => {
    const action = hotel.subscriptionStatus === 'active' ? 'Deactivate' : 'Activate';
    const result = await Swal.fire({
      title: `Manually ${action} Subscription?`,
      text: `Change subscription status for ${hotel.name}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#F2A33A',
      cancelButtonColor: '#0F4B4A',
      confirmButtonText: `Yes, ${action}!`,
      customClass: {
        popup: 'rounded-[24px] shadow-2xl border border-lagoon-100',
        title: 'text-lagoon-950 font-bold',
        htmlContainer: 'text-lagoon-700',
        confirmButton: 'rounded-xl px-6 py-2.5 font-semibold text-sm bg-saffron-500 text-white',
        cancelButton: 'rounded-xl px-6 py-2.5 font-semibold text-sm bg-lagoon-700 text-white'
      }
    });

    if (result.isConfirmed) {
      try {
        await api.put(`/superadmin/hotels/${hotel._id}/subscription`);
        showToast('Subscription status changed successfully.', 'success');
        fetchHotels();
        if (selectedHotel && selectedHotel._id === hotel._id) {
          setSelectedHotel(prev => ({
            ...prev,
            subscriptionStatus: prev.subscriptionStatus === 'active' ? 'inactive' : 'active',
            isActive: prev.subscriptionStatus !== 'active'
          }));
        }
      } catch (error) {
        showToast('Something went wrong', 'error');
      }
    }
  };

  const handleDelete = async (hotel) => {
    const result = await Swal.fire({
      title: 'Are you absolutely sure?',
      text: "This action cannot be undone. This will permanently delete the hotel and all associated data.",
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Yes, delete it!',
      customClass: {
        popup: 'rounded-[24px] shadow-2xl border border-slate-100',
        title: 'text-slate-800 font-bold',
        htmlContainer: 'text-slate-500',
        confirmButton: 'rounded-xl px-6 py-2.5 font-semibold text-sm',
        cancelButton: 'rounded-xl px-6 py-2.5 font-semibold text-sm'
      }
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/superadmin/hotels/${hotel._id}`);
        showToast('The hotel has been deleted.', 'success');
        if (selectedHotel && selectedHotel._id === hotel._id) {
          setSelectedHotel(null);
        }
        fetchHotels();
      } catch (error) {
        showToast('Failed to delete hotel', 'error');
      }
    }
  };

  const filteredHotels = hotels.filter(hotel => 
    hotel.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    hotel.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (hotel.city && hotel.city.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="pb-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-extrabold text-lagoon-950 tracking-tight">Customers (Hotels)</h1>
          <p className="text-sm text-lagoon-700/80 mt-1 font-medium">
            Manage all registered properties, explore full compliance details, banking, policies, and subscriptions.
          </p>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="stayflow-card rounded-3xl overflow-hidden"
      >
        <div className="p-6 sm:p-8 border-b border-lagoon-100 flex flex-col sm:flex-row sm:items-center justify-between bg-lagoon-50/40 gap-4">
          <div className="relative w-full max-w-md">
            <Search className="w-5 h-5 absolute left-4 top-3.5 text-lagoon-400" />
            <input 
              type="text" 
              placeholder="Search hotels by name, email, or city..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-lagoon-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-saffron-500/10 focus:border-saffron-500 transition-all font-medium text-lagoon-950 shadow-sm"
            />
          </div>
          <div className="text-xs font-bold text-lagoon-700 bg-white px-4 py-2.5 rounded-xl border border-lagoon-200/80 shadow-xs">
            Total Properties: <span className="text-lagoon-950 font-black">{hotels.length}</span>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-lagoon-50/70 border-b border-lagoon-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-lagoon-900 uppercase tracking-wider">Hotel Details</th>
                <th className="px-6 py-4 text-xs font-bold text-lagoon-900 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-xs font-bold text-lagoon-900 uppercase tracking-wider">Subscription</th>
                <th className="px-6 py-4 text-xs font-bold text-lagoon-900 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-lagoon-900 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-slate-500 font-medium">Loading hotels...</td>
                </tr>
              ) : filteredHotels.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-slate-500 font-medium">No hotels found.</td>
                </tr>
              ) : (
                filteredHotels.map((hotel, index) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    key={hotel._id} 
                    onClick={() => handleView(hotel)}
                    className={`hover:bg-lagoon-50/50 transition-colors group cursor-pointer ${!hotel.isActive ? 'bg-amber-50/20' : ''}`}
                  >
                    <td className="px-6 py-5 sm:px-8">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-lagoon-850 to-lagoon-950 flex items-center justify-center shrink-0 border border-lagoon-700 overflow-hidden shadow-sm">
                          {hotel.logo ? (
                            <img src={hotel.logo} alt={hotel.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-saffron-400 font-black text-lg font-display">{hotel.name.charAt(0)}</span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-lagoon-950 font-bold font-display">{hotel.name}</p>
                            {hotel.starRating && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-saffron-500/10 text-saffron-700 border border-saffron-500/20">
                                {hotel.starRating}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-lagoon-600 font-medium mt-0.5">{hotel.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-lagoon-800 font-medium">{hotel.contact || hotel.phone || 'N/A'}</div>
                      <div className="text-xs text-lagoon-500">{hotel.city || 'No City'}{hotel.state ? `, ${hotel.state}` : ''}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-start gap-1">
                        <span className="text-sm font-bold capitalize text-lagoon-900">{hotel.subscriptionPlan || 'none'}</span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 text-[10px] rounded-full font-bold border ${
                          hotel.subscriptionStatus === 'active' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-amber-50 text-amber-800 border-amber-300'
                        }`}>
                          {hotel.subscriptionStatus}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 text-xs rounded-full font-bold border ${
                        hotel.isActive ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-slate-100 text-slate-700 border-slate-300'
                      }`}>
                        {hotel.isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>}
                        {!hotel.isActive && <span className="w-1.5 h-1.5 rounded-full bg-slate-500 mr-1.5"></span>}
                        {hotel.isActive ? 'Active' : 'Blocked'}
                      </span>
                    </td>
                    <td className="px-6 py-5 sm:px-8 text-right flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => handleView(hotel)} 
                        className="p-2.5 text-lagoon-600 hover:text-lagoon-950 hover:bg-lagoon-100/60 rounded-xl transition-all border border-transparent hover:border-lagoon-200" 
                        title="View Full Details"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      
                      <button 
                        onClick={() => handleToggleSubscription(hotel)} 
                        className="p-2.5 text-lagoon-600 hover:text-saffron-700 hover:bg-saffron-50 rounded-xl transition-all border border-transparent hover:border-saffron-200" 
                        title="Toggle Subscription"
                      >
                        <Power className="w-5 h-5" />
                      </button>
                      
                      <button 
                        onClick={() => handleDelete(hotel)} 
                        className="p-2.5 text-lagoon-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-200" 
                        title="Delete Hotel"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* FULL HOTEL DETAILS MODAL */}
      <AnimatePresence>
        {selectedHotel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedHotel(null)}
              className="fixed inset-0 bg-lagoon-950/65 backdrop-blur-md"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-lagoon-100/80 overflow-hidden z-10 flex flex-col max-h-[92vh]"
            >
              {/* Header Hero */}
              <div className="p-6 sm:p-7 bg-gradient-to-r from-lagoon-950 via-lagoon-900 to-lagoon-950 text-white relative overflow-hidden shrink-0">
                <div className="absolute top-0 right-0 w-80 h-80 bg-saffron-500/15 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

                <div className="relative z-10 flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4 sm:gap-5">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center overflow-hidden shrink-0 shadow-lg">
                      {selectedHotel.logo ? (
                        <img src={selectedHotel.logo} alt={selectedHotel.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl sm:text-4xl font-black text-saffron-400 font-display">
                          {selectedHotel.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
                          {selectedHotel.name}
                        </h2>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-saffron-500/20 text-saffron-300 border border-saffron-500/30">
                          <Star className="w-3.5 h-3.5 fill-saffron-400 text-saffron-400" />
                          {selectedHotel.starRating || '3-Star'}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/10 text-lagoon-100 border border-white/15">
                          <Building2 className="w-3.5 h-3.5 text-saffron-400" />
                          {selectedHotel.type || 'Hotel'}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-lagoon-200 mt-1 flex items-center gap-1.5 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-saffron-400" />
                        {selectedHotel.city ? `${selectedHotel.city}${selectedHotel.state ? `, ${selectedHotel.state}` : ''}` : 'Location Not Set'}
                        <span className="opacity-40">•</span>
                        <span>ID:</span>
                        <span className="font-mono text-white/90">{selectedHotel._id}</span>
                        <button 
                          onClick={() => handleCopy(selectedHotel._id, 'id')} 
                          className="hover:text-saffron-300 transition-colors p-1"
                          title="Copy Hotel ID"
                        >
                          {copiedKey === 'id' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedHotel(null)}
                    className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors shrink-0"
                    title="Close"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Status & Plan Ribbon */}
              <div className="bg-lagoon-50/80 border-b border-lagoon-100 px-6 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
                  {/* Plan */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-lagoon-600 font-bold uppercase tracking-wider text-[11px]">Plan:</span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-saffron-500/10 text-saffron-800 border border-saffron-500/30 font-bold capitalize">
                      <Crown className="w-3.5 h-3.5 text-saffron-600" />
                      {selectedHotel.subscriptionPlan || 'None'}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-lagoon-600 font-bold uppercase tracking-wider text-[11px]">Sub Status:</span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                      selectedHotel.subscriptionStatus === 'active'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-amber-50 text-amber-800 border-amber-300'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${selectedHotel.subscriptionStatus === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                      {selectedHotel.subscriptionStatus === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Validity */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-lagoon-600 font-bold uppercase tracking-wider text-[11px]">Validity:</span>
                    <span className="text-lagoon-900 font-bold">
                      {selectedHotel.subscriptionExpiresAt 
                        ? `${new Date(selectedHotel.subscriptionExpiresAt).toLocaleDateString()} (${selectedHotel.daysRemaining} days left)`
                        : 'No expiry set'}
                    </span>
                  </div>

                  {/* Staff Login Permission */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-lagoon-600 font-bold uppercase tracking-wider text-[11px]">Staff Access:</span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold ${
                      selectedHotel.subscriptionStatus === 'active'
                        ? 'bg-emerald-100 text-emerald-900'
                        : 'bg-rose-100 text-rose-900'
                    }`}>
                      {selectedHotel.subscriptionStatus === 'active' ? (
                        <>
                          <Unlock className="w-3 h-3 text-emerald-700" /> Login Allowed
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3 text-rose-700" /> Login Restricted
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Account Status Badge */}
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
                    selectedHotel.isActive ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-rose-50 text-rose-800 border-rose-300'
                  }`}>
                    {selectedHotel.isActive ? 'Account Active' : 'Account Blocked'}
                  </span>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-2 px-6 pt-3 pb-2 border-b border-lagoon-100 bg-white overflow-x-auto custom-scrollbar shrink-0">
                {[
                  { id: 'overview', label: 'Overview & Contacts', icon: Building2 },
                  { id: 'legal', label: 'Legal & Tax Compliance', icon: ShieldCheck },
                  { id: 'operations', label: 'Operations & Invoicing', icon: Clock },
                  { id: 'banking', label: 'Banking & UPI Payment', icon: Landmark },
                  { id: 'digital', label: 'Online & Social', icon: Globe },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                        isActive
                          ? 'bg-lagoon-900 text-white shadow-sm shadow-lagoon-900/20'
                          : 'text-lagoon-700 hover:text-lagoon-950 hover:bg-lagoon-50'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-saffron-400' : 'text-lagoon-400'}`} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Scrollable Modal Content */}
              <div className="p-6 sm:p-7 overflow-y-auto custom-scrollbar flex-1 space-y-6 bg-slate-50/40">
                
                {/* 1. OVERVIEW & CONTACTS TAB */}
                {activeTab === 'overview' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    {/* Hotel Contacts & Location */}
                    <div className="bg-white p-5 rounded-2xl border border-lagoon-100 shadow-xs">
                      <div className="flex items-center gap-2 text-lagoon-900 font-bold text-sm mb-4">
                        <Building2 className="w-4 h-4 text-saffron-600" />
                        <span>Property Details & Official Contact</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="bg-lagoon-50/40 p-3.5 rounded-xl border border-lagoon-100/70">
                          <p className="text-[10px] font-bold text-lagoon-500 uppercase tracking-wider">Official Email</p>
                          <div className="flex items-center justify-between gap-1 mt-1">
                            <p className="text-sm font-bold text-lagoon-950 truncate">{selectedHotel.email}</p>
                            <button onClick={() => handleCopy(selectedHotel.email, 'email')} className="text-lagoon-400 hover:text-lagoon-950 p-1">
                              {copiedKey === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        <div className="bg-lagoon-50/40 p-3.5 rounded-xl border border-lagoon-100/70">
                          <p className="text-[10px] font-bold text-lagoon-500 uppercase tracking-wider">Primary Phone</p>
                          <div className="flex items-center justify-between gap-1 mt-1">
                            <p className="text-sm font-bold text-lagoon-950">{selectedHotel.contact || selectedHotel.phone || 'N/A'}</p>
                            <button onClick={() => handleCopy(selectedHotel.contact || selectedHotel.phone, 'phone')} className="text-lagoon-400 hover:text-lagoon-950 p-1">
                              {copiedKey === 'phone' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        <div className="bg-lagoon-50/40 p-3.5 rounded-xl border border-lagoon-100/70">
                          <p className="text-[10px] font-bold text-lagoon-500 uppercase tracking-wider">Reception Phone</p>
                          <div className="flex items-center justify-between gap-1 mt-1">
                            <p className="text-sm font-bold text-lagoon-950">{selectedHotel.receptionPhone || 'Not set'}</p>
                            {selectedHotel.receptionPhone && (
                              <button onClick={() => handleCopy(selectedHotel.receptionPhone, 'reception')} className="text-lagoon-400 hover:text-lagoon-950 p-1">
                                {copiedKey === 'reception' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="bg-lagoon-50/40 p-3.5 rounded-xl border border-lagoon-100/70">
                          <p className="text-[10px] font-bold text-lagoon-500 uppercase tracking-wider">City</p>
                          <p className="text-sm font-bold text-lagoon-950 mt-1">{selectedHotel.city || 'N/A'}</p>
                        </div>

                        <div className="bg-lagoon-50/40 p-3.5 rounded-xl border border-lagoon-100/70">
                          <p className="text-[10px] font-bold text-lagoon-500 uppercase tracking-wider">State</p>
                          <p className="text-sm font-bold text-lagoon-950 mt-1">{selectedHotel.state || 'N/A'}</p>
                        </div>

                        <div className="bg-lagoon-50/40 p-3.5 rounded-xl border border-lagoon-100/70">
                          <p className="text-[10px] font-bold text-lagoon-500 uppercase tracking-wider">Pincode</p>
                          <p className="text-sm font-bold text-lagoon-950 mt-1">{selectedHotel.pincode || 'N/A'}</p>
                        </div>

                        <div className="bg-lagoon-50/40 p-3.5 rounded-xl border border-lagoon-100/70 col-span-1 sm:col-span-2 md:col-span-3">
                          <p className="text-[10px] font-bold text-lagoon-500 uppercase tracking-wider">Complete Address</p>
                          <p className="text-sm font-bold text-lagoon-950 mt-1 leading-relaxed">
                            {selectedHotel.address || `${selectedHotel.city || ''}, ${selectedHotel.state || ''} ${selectedHotel.pincode || ''}` || 'Not provided'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Owner / Hotel Admin Card */}
                    <div className="bg-white p-5 rounded-2xl border border-lagoon-100 shadow-xs">
                      <div className="flex items-center gap-2 text-lagoon-900 font-bold text-sm mb-4">
                        <User className="w-4 h-4 text-saffron-600" />
                        <span>Registered Property Administrator (Owner)</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-lagoon-50/40 p-3.5 rounded-xl border border-lagoon-100/70">
                          <p className="text-[10px] font-bold text-lagoon-500 uppercase tracking-wider">Owner / Admin Name</p>
                          <p className="text-sm font-bold text-lagoon-950 mt-1">{selectedHotel.ownerName || 'Admin'}</p>
                        </div>

                        <div className="bg-lagoon-50/40 p-3.5 rounded-xl border border-lagoon-100/70">
                          <p className="text-[10px] font-bold text-lagoon-500 uppercase tracking-wider">Owner Email</p>
                          <div className="flex items-center justify-between gap-1 mt-1">
                            <p className="text-sm font-bold text-lagoon-950 truncate">{selectedHotel.ownerEmail || selectedHotel.email}</p>
                            <button onClick={() => handleCopy(selectedHotel.ownerEmail || selectedHotel.email, 'ownerEmail')} className="text-lagoon-400 hover:text-lagoon-950 p-1">
                              {copiedKey === 'ownerEmail' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        <div className="bg-lagoon-50/40 p-3.5 rounded-xl border border-lagoon-100/70">
                          <p className="text-[10px] font-bold text-lagoon-500 uppercase tracking-wider">Owner Mobile</p>
                          <div className="flex items-center justify-between gap-1 mt-1">
                            <p className="text-sm font-bold text-lagoon-950">{selectedHotel.ownerMobile || selectedHotel.phone || 'N/A'}</p>
                            <button onClick={() => handleCopy(selectedHotel.ownerMobile || selectedHotel.phone, 'ownerMobile')} className="text-lagoon-400 hover:text-lagoon-950 p-1">
                              {copiedKey === 'ownerMobile' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Metadata Card */}
                    <div className="bg-white p-4 rounded-2xl border border-lagoon-100 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs font-semibold text-lagoon-600">
                      <div>
                        Registered Since: <span className="text-lagoon-950 font-bold">{new Date(selectedHotel.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      </div>
                      <div>
                        Database Ref: <span className="font-mono text-lagoon-800">{selectedHotel._id}</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 2. LEGAL & TAX COMPLIANCE TAB */}
                {activeTab === 'legal' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    <div className="bg-white p-5 rounded-2xl border border-lagoon-100 shadow-xs">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-lagoon-900 font-bold text-sm">
                          <ShieldCheck className="w-4 h-4 text-saffron-600" />
                          <span>Government & Tax Compliance Credentials</span>
                        </div>
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          Commercial Invoicing Active
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* GSTIN */}
                        <div className="bg-lagoon-50/40 p-4 rounded-xl border border-lagoon-100/70">
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] font-bold text-lagoon-500 uppercase tracking-wider">GSTIN Number</p>
                            {selectedHotel.gstin && (
                              <button onClick={() => handleCopy(selectedHotel.gstin, 'gstin')} className="text-xs text-saffron-700 hover:text-saffron-800 font-bold flex items-center gap-1">
                                {copiedKey === 'gstin' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                Copy
                              </button>
                            )}
                          </div>
                          <p className="text-base font-mono font-bold text-lagoon-950 mt-1">
                            {selectedHotel.gstin || <span className="text-slate-400 font-sans text-sm font-normal">Not Provided</span>}
                          </p>
                          <p className="text-[11px] text-lagoon-600 mt-1">Goods & Services Tax Identification Number</p>
                        </div>

                        {/* PAN */}
                        <div className="bg-lagoon-50/40 p-4 rounded-xl border border-lagoon-100/70">
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] font-bold text-lagoon-500 uppercase tracking-wider">Permanent Account Number (PAN)</p>
                            {selectedHotel.panNumber && (
                              <button onClick={() => handleCopy(selectedHotel.panNumber, 'pan')} className="text-xs text-saffron-700 hover:text-saffron-800 font-bold flex items-center gap-1">
                                {copiedKey === 'pan' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                Copy
                              </button>
                            )}
                          </div>
                          <p className="text-base font-mono font-bold text-lagoon-950 mt-1">
                            {selectedHotel.panNumber || <span className="text-slate-400 font-sans text-sm font-normal">Not Provided</span>}
                          </p>
                          <p className="text-[11px] text-lagoon-600 mt-1">Official Income Tax Entity Registration</p>
                        </div>

                        {/* FSSAI */}
                        <div className="bg-lagoon-50/40 p-4 rounded-xl border border-lagoon-100/70">
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] font-bold text-lagoon-500 uppercase tracking-wider">FSSAI License Number</p>
                            {selectedHotel.fssaiNumber && (
                              <button onClick={() => handleCopy(selectedHotel.fssaiNumber, 'fssai')} className="text-xs text-saffron-700 hover:text-saffron-800 font-bold flex items-center gap-1">
                                {copiedKey === 'fssai' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                Copy
                              </button>
                            )}
                          </div>
                          <p className="text-base font-mono font-bold text-lagoon-950 mt-1">
                            {selectedHotel.fssaiNumber || <span className="text-slate-400 font-sans text-sm font-normal">Not Provided</span>}
                          </p>
                          <p className="text-[11px] text-lagoon-600 mt-1">Food Safety & Standards Authority License</p>
                        </div>

                        {/* Trade License */}
                        <div className="bg-lagoon-50/40 p-4 rounded-xl border border-lagoon-100/70">
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] font-bold text-lagoon-500 uppercase tracking-wider">Trade License / Municipal Reg.</p>
                            {selectedHotel.tradeLicenseNumber && (
                              <button onClick={() => handleCopy(selectedHotel.tradeLicenseNumber, 'trade')} className="text-xs text-saffron-700 hover:text-saffron-800 font-bold flex items-center gap-1">
                                {copiedKey === 'trade' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                Copy
                              </button>
                            )}
                          </div>
                          <p className="text-base font-mono font-bold text-lagoon-950 mt-1">
                            {selectedHotel.tradeLicenseNumber || <span className="text-slate-400 font-sans text-sm font-normal">Not Provided</span>}
                          </p>
                          <p className="text-[11px] text-lagoon-600 mt-1">Local Municipality Trade & Hospitality Permit</p>
                        </div>

                        {/* CIN Number */}
                        <div className="bg-lagoon-50/40 p-4 rounded-xl border border-lagoon-100/70 sm:col-span-2">
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] font-bold text-lagoon-500 uppercase tracking-wider">Corporate Identity Number (CIN)</p>
                            {selectedHotel.cinNo && (
                              <button onClick={() => handleCopy(selectedHotel.cinNo, 'cin')} className="text-xs text-saffron-700 hover:text-saffron-800 font-bold flex items-center gap-1">
                                {copiedKey === 'cin' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                Copy
                              </button>
                            )}
                          </div>
                          <p className="text-base font-mono font-bold text-lagoon-950 mt-1">
                            {selectedHotel.cinNo || <span className="text-slate-400 font-sans text-sm font-normal">Not Provided</span>}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-saffron-500/10 border border-saffron-500/20 rounded-2xl p-4 flex items-start gap-3">
                      <Info className="w-5 h-5 text-saffron-600 shrink-0 mt-0.5" />
                      <div className="text-xs text-saffron-900 leading-relaxed font-medium">
                        These tax and license credentials automatically generate on customer room folios, dining bills, and regulatory audit reports exported through the StayFlow billing engine.
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 3. OPERATIONS & INVOICING TAB */}
                {activeTab === 'operations' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    {/* Timings & GST Rates */}
                    <div className="bg-white p-5 rounded-2xl border border-lagoon-100 shadow-xs">
                      <div className="flex items-center gap-2 text-lagoon-900 font-bold text-sm mb-4">
                        <Clock className="w-4 h-4 text-saffron-600" />
                        <span>Daily Operations, Timings & Tax Rates</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-lagoon-50/40 p-3.5 rounded-xl border border-lagoon-100/70">
                          <p className="text-[10px] font-bold text-lagoon-500 uppercase tracking-wider">Check-In Time</p>
                          <p className="text-base font-bold text-lagoon-950 mt-1">{selectedHotel.checkInTime || '12:00 PM'}</p>
                        </div>

                        <div className="bg-lagoon-50/40 p-3.5 rounded-xl border border-lagoon-100/70">
                          <p className="text-[10px] font-bold text-lagoon-500 uppercase tracking-wider">Check-Out Time</p>
                          <p className="text-base font-bold text-lagoon-950 mt-1">{selectedHotel.checkOutTime || '11:00 AM'}</p>
                        </div>

                        <div className="bg-lagoon-50/40 p-3.5 rounded-xl border border-lagoon-100/70">
                          <p className="text-[10px] font-bold text-lagoon-500 uppercase tracking-wider">Room GST Rate</p>
                          <p className="text-base font-bold text-lagoon-950 mt-1">{selectedHotel.roomGstRate ?? 12}%</p>
                        </div>

                        <div className="bg-lagoon-50/40 p-3.5 rounded-xl border border-lagoon-100/70">
                          <p className="text-[10px] font-bold text-lagoon-500 uppercase tracking-wider">Food GST Rate</p>
                          <p className="text-base font-bold text-lagoon-950 mt-1">{selectedHotel.foodGstRate ?? 5}%</p>
                        </div>
                      </div>
                    </div>

                    {/* Invoice Configuration & Prefixes */}
                    <div className="bg-white p-5 rounded-2xl border border-lagoon-100 shadow-xs">
                      <div className="flex items-center gap-2 text-lagoon-900 font-bold text-sm mb-4">
                        <Receipt className="w-4 h-4 text-saffron-600" />
                        <span>Billing & Invoice Customization</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-lagoon-50/40 p-3.5 rounded-xl border border-lagoon-100/70">
                          <p className="text-[10px] font-bold text-lagoon-500 uppercase tracking-wider">Room Invoice Prefix</p>
                          <p className="text-base font-mono font-bold text-lagoon-950 mt-1">{selectedHotel.invoicePrefixRoom || 'ROOM-'}</p>
                          <p className="text-[11px] text-lagoon-600 mt-0.5">Example: {selectedHotel.invoicePrefixRoom || 'ROOM-'}1024</p>
                        </div>

                        <div className="bg-lagoon-50/40 p-3.5 rounded-xl border border-lagoon-100/70">
                          <p className="text-[10px] font-bold text-lagoon-500 uppercase tracking-wider">Restaurant Invoice Prefix</p>
                          <p className="text-base font-mono font-bold text-lagoon-950 mt-1">{selectedHotel.invoicePrefixRestaurant || 'REST-'}</p>
                          <p className="text-[11px] text-lagoon-600 mt-0.5">Example: {selectedHotel.invoicePrefixRestaurant || 'REST-'}5082</p>
                        </div>

                        <div className="bg-lagoon-50/40 p-3.5 rounded-xl border border-lagoon-100/70 col-span-1 sm:col-span-2">
                          <p className="text-[10px] font-bold text-lagoon-500 uppercase tracking-wider">Mandatory Guest ID Policy</p>
                          <p className="text-sm font-semibold text-lagoon-950 mt-1 leading-relaxed">
                            {selectedHotel.idProofPolicy || 'Aadhaar Card, Passport, Driving License, or Voter ID required at check-in'}
                          </p>
                        </div>

                        <div className="bg-lagoon-50/40 p-3.5 rounded-xl border border-lagoon-100/70 col-span-1 sm:col-span-2">
                          <p className="text-[10px] font-bold text-lagoon-500 uppercase tracking-wider">Invoice Terms & Remarks</p>
                          <p className="text-sm font-medium text-lagoon-900 mt-1 whitespace-pre-wrap leading-relaxed">
                            {selectedHotel.invoiceTerms || 'Standard stayflow terms & conditions applied.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 4. BANKING & UPI TAB */}
                {activeTab === 'banking' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    <div className="bg-white p-5 rounded-2xl border border-lagoon-100 shadow-xs">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-lagoon-900 font-bold text-sm">
                          <Landmark className="w-4 h-4 text-saffron-600" />
                          <span>Direct Settlement Bank Account & UPI ID</span>
                        </div>
                        <span className="text-xs font-bold text-lagoon-700 bg-lagoon-50 px-2.5 py-1 rounded-full border border-lagoon-200">
                          Direct Settlement
                        </span>
                      </div>

                      {/* UPI ID Banner */}
                      <div className="bg-gradient-to-r from-saffron-500/15 via-saffron-400/10 to-transparent p-4 rounded-xl border border-saffron-500/30 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-bold text-saffron-800 uppercase tracking-wider">Primary UPI ID (VPA)</p>
                          <p className="text-lg font-mono font-bold text-lagoon-950 mt-0.5">
                            {selectedHotel.upiId || <span className="text-slate-400 font-sans text-sm font-normal">Not Configured</span>}
                          </p>
                        </div>
                        {selectedHotel.upiId && (
                          <button 
                            onClick={() => handleCopy(selectedHotel.upiId, 'upi')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-saffron-300 text-saffron-900 font-bold text-xs shadow-xs hover:bg-saffron-50 transition-colors w-fit"
                          >
                            {copiedKey === 'upi' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            Copy UPI ID
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-lagoon-50/40 p-3.5 rounded-xl border border-lagoon-100/70">
                          <p className="text-[10px] font-bold text-lagoon-500 uppercase tracking-wider">Bank Name</p>
                          <p className="text-base font-bold text-lagoon-950 mt-1">{selectedHotel.bankName || 'Not Set'}</p>
                        </div>

                        <div className="bg-lagoon-50/40 p-3.5 rounded-xl border border-lagoon-100/70">
                          <p className="text-[10px] font-bold text-lagoon-500 uppercase tracking-wider">Account Holder Name</p>
                          <p className="text-base font-bold text-lagoon-950 mt-1">{selectedHotel.bankAccountName || 'Not Set'}</p>
                        </div>

                        <div className="bg-lagoon-50/40 p-3.5 rounded-xl border border-lagoon-100/70">
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] font-bold text-lagoon-500 uppercase tracking-wider">Bank Account Number</p>
                            {selectedHotel.bankAccountNumber && (
                              <button onClick={() => handleCopy(selectedHotel.bankAccountNumber, 'accNo')} className="text-xs text-saffron-700 hover:text-saffron-800 font-bold flex items-center gap-1">
                                {copiedKey === 'accNo' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                Copy
                              </button>
                            )}
                          </div>
                          <p className="text-base font-mono font-bold text-lagoon-950 mt-1">
                            {selectedHotel.bankAccountNumber || <span className="text-slate-400 font-sans text-sm font-normal">Not Set</span>}
                          </p>
                        </div>

                        <div className="bg-lagoon-50/40 p-3.5 rounded-xl border border-lagoon-100/70">
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] font-bold text-lagoon-500 uppercase tracking-wider">IFSC Code</p>
                            {selectedHotel.bankIfscCode && (
                              <button onClick={() => handleCopy(selectedHotel.bankIfscCode, 'ifsc')} className="text-xs text-saffron-700 hover:text-saffron-800 font-bold flex items-center gap-1">
                                {copiedKey === 'ifsc' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                Copy
                              </button>
                            )}
                          </div>
                          <p className="text-base font-mono font-bold text-lagoon-950 mt-1">
                            {selectedHotel.bankIfscCode || <span className="text-slate-400 font-sans text-sm font-normal">Not Set</span>}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 5. ONLINE & SOCIAL PRESENCE TAB */}
                {activeTab === 'digital' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    <div className="bg-white p-5 rounded-2xl border border-lagoon-100 shadow-xs">
                      <div className="flex items-center gap-2 text-lagoon-900 font-bold text-sm mb-4">
                        <Globe className="w-4 h-4 text-saffron-600" />
                        <span>Web, Social & Mapping Links</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Website */}
                        <div className="bg-lagoon-50/40 p-4 rounded-xl border border-lagoon-100/70 flex items-start justify-between gap-3">
                          <div className="overflow-hidden">
                            <p className="text-[10px] font-bold text-lagoon-500 uppercase tracking-wider flex items-center gap-1">
                              <Globe className="w-3.5 h-3.5 text-lagoon-600" /> Official Website
                            </p>
                            <p className="text-sm font-bold text-lagoon-950 mt-1 truncate">
                              {selectedHotel.websiteUrl || <span className="text-slate-400 font-normal">Not Set</span>}
                            </p>
                          </div>
                          {selectedHotel.websiteUrl && (
                            <a 
                              href={selectedHotel.websiteUrl.startsWith('http') ? selectedHotel.websiteUrl : `https://${selectedHotel.websiteUrl}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="p-2 bg-white rounded-lg border border-lagoon-200 text-lagoon-700 hover:text-saffron-600 hover:border-saffron-300 transition-colors shrink-0"
                              title="Open Website"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>

                        {/* Google Maps */}
                        <div className="bg-lagoon-50/40 p-4 rounded-xl border border-lagoon-100/70 flex items-start justify-between gap-3">
                          <div className="overflow-hidden">
                            <p className="text-[10px] font-bold text-lagoon-500 uppercase tracking-wider flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-lagoon-600" /> Google Maps Location
                            </p>
                            <p className="text-sm font-bold text-lagoon-950 mt-1 truncate">
                              {selectedHotel.googleMapsUrl || <span className="text-slate-400 font-normal">Not Set</span>}
                            </p>
                          </div>
                          {selectedHotel.googleMapsUrl && (
                            <a 
                              href={selectedHotel.googleMapsUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              className="p-2 bg-white rounded-lg border border-lagoon-200 text-lagoon-700 hover:text-saffron-600 hover:border-saffron-300 transition-colors shrink-0"
                              title="Open in Google Maps"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>

                        {/* Instagram */}
                        <div className="bg-lagoon-50/40 p-4 rounded-xl border border-lagoon-100/70 flex items-start justify-between gap-3">
                          <div className="overflow-hidden">
                            <p className="text-[10px] font-bold text-lagoon-500 uppercase tracking-wider flex items-center gap-1">
                              <InstagramIcon className="w-3.5 h-3.5 text-rose-500" /> Instagram Handle / URL
                            </p>
                            <p className="text-sm font-bold text-lagoon-950 mt-1 truncate">
                              {selectedHotel.instagramUrl || <span className="text-slate-400 font-normal">Not Set</span>}
                            </p>
                          </div>
                          {selectedHotel.instagramUrl && (
                            <a 
                              href={selectedHotel.instagramUrl.startsWith('http') ? selectedHotel.instagramUrl : `https://${selectedHotel.instagramUrl}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="p-2 bg-white rounded-lg border border-lagoon-200 text-lagoon-700 hover:text-rose-600 hover:border-rose-300 transition-colors shrink-0"
                              title="Open Instagram"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>

                        {/* Facebook */}
                        <div className="bg-lagoon-50/40 p-4 rounded-xl border border-lagoon-100/70 flex items-start justify-between gap-3">
                          <div className="overflow-hidden">
                            <p className="text-[10px] font-bold text-lagoon-500 uppercase tracking-wider flex items-center gap-1">
                              <FacebookIcon className="w-3.5 h-3.5 text-blue-600" /> Facebook Page
                            </p>
                            <p className="text-sm font-bold text-lagoon-950 mt-1 truncate">
                              {selectedHotel.facebookUrl || <span className="text-slate-400 font-normal">Not Set</span>}
                            </p>
                          </div>
                          {selectedHotel.facebookUrl && (
                            <a 
                              href={selectedHotel.facebookUrl.startsWith('http') ? selectedHotel.facebookUrl : `https://${selectedHotel.facebookUrl}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="p-2 bg-white rounded-lg border border-lagoon-200 text-lagoon-700 hover:text-blue-600 hover:border-blue-300 transition-colors shrink-0"
                              title="Open Facebook"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

              </div>

              {/* Modal Footer Actions */}
              <div className="p-4 sm:p-5 border-t border-lagoon-100 bg-white flex flex-wrap items-center justify-between gap-3 shrink-0">
                <button
                  onClick={() => handleToggleSubscription(selectedHotel)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                    selectedHotel.subscriptionStatus === 'active'
                      ? 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                  }`}
                >
                  <Power className="w-4 h-4" />
                  {selectedHotel.subscriptionStatus === 'active' ? 'Deactivate Subscription' : 'Activate Subscription'}
                </button>

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={() => handleCopySummary(selectedHotel)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-lagoon-200 text-xs font-bold text-lagoon-800 hover:bg-lagoon-50 transition-colors"
                  >
                    <Copy className="w-4 h-4 text-lagoon-600" />
                    Copy Summary
                  </button>

                  <button
                    onClick={() => setSelectedHotel(null)}
                    className="px-5 py-2.5 rounded-xl bg-lagoon-900 hover:bg-lagoon-950 text-white text-xs font-bold transition-all shadow-sm"
                  >
                    Close
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
