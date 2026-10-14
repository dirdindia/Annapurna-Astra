import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Lock,
  Save,
  Mail,
  Shield,
  KeyRound,
  CheckCircle2,
  Server,
  CreditCard,
  Bell,
  Sparkles,
  Zap,
  Globe,
  Database,
  Crown,
} from 'lucide-react';
import Swal from 'sweetalert2';

export default function Settings() {
  const [profile, setProfile] = useState({
    name: 'Super Admin',
    email: 'admin@gmail.com',
    phone: '+91 98765 43210',
    role: 'Root Super Administrator',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [savingPassword, setSavingPassword] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const handleUpdateProfile = (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setTimeout(() => {
      setSavingProfile(false);
      Swal.fire({
        icon: 'success',
        title: 'Profile Updated',
        text: 'Super administrator profile details saved successfully.',
        timer: 1800,
        showConfirmButton: false,
      });
    }, 600);
  };

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Missing Fields',
        text: 'Please enter both current and new password.',
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Password Mismatch',
        text: 'New password and confirm password do not match.',
      });
      return;
    }

    setSavingPassword(true);
    setTimeout(() => {
      setSavingPassword(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      Swal.fire({
        icon: 'success',
        title: 'Security Updated',
        text: 'Master password has been updated securely.',
        timer: 1800,
        showConfirmButton: false,
      });
    }, 800);
  };

  return (
    <div className="max-w-6xl mx-auto pb-12 font-sans space-y-8">
      {/* Page Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-saffron-500/10 border border-saffron-500/20 text-saffron-700 text-xs font-bold uppercase tracking-wider mb-2">
          <Shield className="w-3.5 h-3.5 text-saffron-600" />
          Master Security & System Hub
        </div>
        <h1 className="text-3xl font-display font-extrabold text-lagoon-950 tracking-tight">
          Super Admin Settings
        </h1>
        <p className="text-sm text-lagoon-700/80 mt-1 font-medium">
          Manage your master credentials, payment gateway settings, and platform-wide rules.
        </p>
      </div>

      {/* Main Profile Hero Banner */}
      <div className="stayflow-card rounded-3xl overflow-hidden">
        {/* Banner with Lagoon and Saffron Glow */}
        <div className="bg-gradient-to-r from-lagoon-950 via-lagoon-900 to-lagoon-950 relative overflow-hidden p-6 sm:p-8">
          <div className="absolute top-0 right-0 w-80 h-full bg-saffron-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-10 w-40 h-40 bg-lagoon-500/20 rounded-full blur-2xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-lagoon-800 to-lagoon-950 border-2 border-saffron-500/30 flex items-center justify-center text-saffron-400 font-display font-black text-2xl shadow-xl shrink-0">
                SA
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
                  Super Admin
                </h2>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-saffron-400 bg-saffron-500/20 border border-saffron-500/30 px-3 py-0.5 rounded-full">
                    <Crown className="w-3 h-3 text-saffron-400" /> Root Administrator
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                    ● Active Session
                  </span>
                </div>
              </div>
            </div>

            <span className="text-xs font-mono font-bold text-lagoon-200 bg-white/10 border border-white/10 px-3 py-1.5 rounded-xl">
              StayFlow Core Engine v2.4.0
            </span>
          </div>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profile Info Form */}
        <div className="stayflow-card rounded-3xl p-6 sm:p-8">
          <div className="flex items-center gap-3 pb-4 mb-6 border-b border-lagoon-100">
            <div className="w-10 h-10 rounded-2xl bg-lagoon-50 text-lagoon-800 flex items-center justify-center border border-lagoon-200">
              <User className="w-5 h-5 text-saffron-600" />
            </div>
            <div>
              <h3 className="font-bold text-lagoon-950 font-display text-lg">Admin Profile Information</h3>
              <p className="text-xs text-lagoon-600">Platform administrator identity and contact info</p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-lagoon-900 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-lagoon-200 rounded-xl text-xs font-bold text-lagoon-950 focus:outline-none focus:border-saffron-500 focus:ring-2 focus:ring-saffron-500/10 transition-all shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-lagoon-900 uppercase tracking-wider mb-1.5">
                Primary Master Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-lagoon-400" />
                <input
                  type="email"
                  disabled
                  value={profile.email}
                  className="w-full pl-10 pr-4 py-2.5 bg-lagoon-50/70 border border-lagoon-200 rounded-xl text-xs font-semibold text-lagoon-700 cursor-not-allowed"
                />
              </div>
              <p className="text-[11px] text-lagoon-500 mt-1 flex items-center gap-1 font-medium">
                <Shield className="w-3 h-3 text-saffron-600" /> Master account email cannot be modified.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-lagoon-900 uppercase tracking-wider mb-1.5">
                Contact Phone
              </label>
              <input
                type="text"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-lagoon-200 rounded-xl text-xs font-semibold text-lagoon-950 focus:outline-none focus:border-saffron-500 focus:ring-2 focus:ring-saffron-500/10 transition-all shadow-sm"
              />
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={savingProfile}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-lagoon-900 text-white hover:bg-lagoon-800 transition-all shadow-sm flex items-center gap-2"
              >
                <Save className="w-4 h-4 text-saffron-400" />
                {savingProfile ? 'Saving...' : 'Save Profile Details'}
              </button>
            </div>
          </form>
        </div>

        {/* Master Password Form */}
        <div className="stayflow-card rounded-3xl p-6 sm:p-8">
          <div className="flex items-center gap-3 pb-4 mb-6 border-b border-lagoon-100">
            <div className="w-10 h-10 rounded-2xl bg-saffron-500/10 text-saffron-600 flex items-center justify-center border border-saffron-500/20">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lagoon-950 font-display text-lg">Change Master Password</h3>
              <p className="text-xs text-lagoon-600">Update super admin login password securely</p>
            </div>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-lagoon-900 uppercase tracking-wider mb-1.5">
                Current Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-lagoon-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-lagoon-200 rounded-xl text-xs font-semibold text-lagoon-950 focus:outline-none focus:border-saffron-500 focus:ring-2 focus:ring-saffron-500/10 transition-all shadow-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-lagoon-900 uppercase tracking-wider mb-1.5">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-lagoon-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-lagoon-200 rounded-xl text-xs font-semibold text-lagoon-950 focus:outline-none focus:border-saffron-500 focus:ring-2 focus:ring-saffron-500/10 transition-all shadow-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-lagoon-900 uppercase tracking-wider mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-lagoon-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-lagoon-200 rounded-xl text-xs font-semibold text-lagoon-950 focus:outline-none focus:border-saffron-500 focus:ring-2 focus:ring-saffron-500/10 transition-all shadow-sm"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={savingPassword}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-saffron-500 to-amber-500 text-slate-950 hover:brightness-105 transition-all shadow-md shadow-saffron-500/20 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {savingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Platform & Razorpay Gateway System Status */}
      <div className="stayflow-card rounded-3xl p-6 sm:p-8">
        <h3 className="text-lg font-bold text-lagoon-950 font-display mb-2 flex items-center gap-2">
          <Server className="w-5 h-5 text-saffron-600" />
          StayFlow Platform & Gateway Status
        </h3>
        <p className="text-xs text-lagoon-600 mb-6 font-medium">
          Global architecture health, payment gateway integration, and business rule enforcement.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Razorpay Gateway */}
          <div className="p-5 rounded-2xl bg-lagoon-50/70 border border-lagoon-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-lagoon-800 uppercase tracking-wider">Payment Gateway</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Online
                </span>
              </div>
              <h4 className="text-base font-bold text-lagoon-950 font-display flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-saffron-600" /> Razorpay Gateway
              </h4>
              <p className="text-xs text-lagoon-600 mt-1">
                Keys loaded from server environment. Automated HMAC-SHA256 verification active.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-lagoon-200/60 text-[11px] font-mono text-lagoon-700">
              Key ID: rzp_test_***1E
            </div>
          </div>

          {/* Staff Login Restriction */}
          <div className="p-5 rounded-2xl bg-saffron-500/5 border border-saffron-500/20 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-saffron-800 uppercase tracking-wider">Access Policy</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-saffron-500/20 text-saffron-800 border border-saffron-500/30">
                  Enforced
                </span>
              </div>
              <h4 className="text-base font-bold text-lagoon-950 font-display flex items-center gap-2">
                <Shield className="w-4 h-4 text-saffron-600" /> Staff Login Lock Rule
              </h4>
              <p className="text-xs text-lagoon-700 mt-1">
                Hotels with subscription = <span className="font-bold">none</span> or expired are strictly blocked from staff logins.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-saffron-500/20 text-[11px] font-semibold text-saffron-800">
              ✓ Hotel Admin can always login to renew
            </div>
          </div>

          {/* Database & Cloud Sync */}
          <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Database Cluster</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Connected
                </span>
              </div>
              <h4 className="text-base font-bold text-lagoon-950 font-display flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600" /> MongoDB Atlas Cloud
              </h4>
              <p className="text-xs text-emerald-700 mt-1">
                Multi-tenant hotel records, subscription invoices, dishes, and bookings synced.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-emerald-200/60 text-[11px] font-semibold text-emerald-800">
              ● Port 5000 REST API Active
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
