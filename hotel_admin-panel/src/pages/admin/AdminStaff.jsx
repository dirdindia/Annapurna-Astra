import React, { useState, useEffect } from "react";
import api from "../../api";
import { UserPlus, Users, Trash2, Mail, Phone, MapPin, User, ShieldAlert, ShieldCheck, Shield, Sparkles } from "lucide-react";
import { showError, showConfirm } from "../../utils/alerts";
import MagneticButton from "../../components/MagneticButton";

export default function AdminStaff() {
  const [staffList, setStaffList] = useState([]);
  
  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mobile, setMobile] = useState("");
  const [age, setAge] = useState("");
  const [address, setAddress] = useState("");
  const [role, setRole] = useState("sub_admin"); // 'sub_admin' or 'staff'
  const [filterRole, setFilterRole] = useState("all");
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const res = await api.get("api/auth/staff");
      if (res.data.success) {
        setStaffList(res.data.staff);
      }
    } catch (error) {
      console.error("Error fetching staff:", error);
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const res = await api.post("api/auth/register-staff", {
        name,
        email,
        password,
        mobile,
        age: Number(age),
        address,
        role,
      });

      if (res.data.success) {
        setMessage({ 
          text: `${role === "sub_admin" ? "Sub-Admin" : "Staff"} account created successfully!`, 
          type: "success" 
        });
        // Clear fields
        setName("");
        setEmail("");
        setPassword("");
        setMobile("");
        setAge("");
        setAddress("");
        setRole("sub_admin");
        
        // Refresh list
        fetchStaff();
      }
    } catch (error) {
      console.error("Staff creation failed:", error);
      setMessage({
        text: error.response?.data?.message || "Failed to create account.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStaff = async (id) => {
    const result = await showConfirm(
      "Are you sure?",
      "You want to delete this staff member? They will lose access to the system.",
      "Yes, Delete!"
    );
    if (!result.isConfirmed) return;

    try {
      const res = await api.delete(`api/auth/staff/${id}`);
      if (res.data.success) {
        fetchStaff();
      }
    } catch (error) {
      console.error("Failed to delete staff:", error);
      showError("Failed", error.response?.data?.message || "Failed to delete staff");
    }
  };

  return (
    <div className="flex-1 p-6 flex flex-col gap-6 overflow-x-hidden no-print">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold text-amber-500 flex items-center gap-3">
            <Users className="w-8 h-8" />
            Staff & Sub-Admin Management
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Create Sub-Admins (with revenue hidden) and Staff credentials for hotel operations
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 shrink-0">
          <button
            onClick={() => setFilterRole("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterRole === "all"
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            All ({staffList.length})
          </button>
          <button
            onClick={() => setFilterRole("sub_admin")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              filterRole === "sub_admin"
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Sub-Admins ({staffList.filter(s => s.role === "sub_admin").length})
          </button>
          <button
            onClick={() => setFilterRole("staff")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              filterRole === "staff"
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Staff ({staffList.filter(s => s.role !== "sub_admin").length})
          </button>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        {/* LEFT: STAFF & SUB-ADMIN LIST TABLE */}
        <div className="flex-1 flex flex-col gap-6 min-w-0">
        <div className="glass-card rounded-2xl p-6 flex flex-col gap-4">

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/10 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Member Name</th>
                  <th className="py-3 px-4">Role & Access</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Phone / Mob</th>
                  <th className="py-3 px-4">Age</th>
                  <th className="py-3 px-4">Address</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {staffList.filter(s => filterRole === "all" ? true : (filterRole === "sub_admin" ? s.role === "sub_admin" : s.role !== "sub_admin")).length > 0 ? (
                  staffList
                    .filter(s => filterRole === "all" ? true : (filterRole === "sub_admin" ? s.role === "sub_admin" : s.role !== "sub_admin"))
                    .map((staff) => (
                    <tr key={staff._id} className="hover:bg-slate-900/20 text-slate-350 transition-colors">
                      <td className="py-4 px-4 font-bold text-slate-200">
                        {staff.name}
                      </td>
                      <td className="py-4 px-4">
                        {staff.role === "sub_admin" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-300 border border-amber-500/40 shadow-sm">
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                            Sub-Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-teal-500/15 text-teal-300 border border-teal-500/30">
                            <User className="w-3.5 h-3.5 text-teal-400" />
                            Staff POS
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 font-mono text-xs">{staff.email}</td>
                      <td className="py-4 px-4">{staff.mobile}</td>
                      <td className="py-4 px-4 font-mono">{staff.age} yrs</td>
                      <td className="py-4 px-4 max-w-[150px] truncate">{staff.address}</td>
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => handleDeleteStaff(staff._id)}
                          className="p-1.5 hover:bg-red-500/10 text-slate-500 hover:text-red-400 border border-transparent hover:border-red-500/25 rounded-lg transition-all cursor-pointer"
                          title="Revoke Access"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-550">
                      <div className="inline-flex items-center gap-2 mb-1">
                        <ShieldAlert className="w-4 h-4 text-slate-650" />
                        <span className="font-semibold text-xs">No registered accounts found</span>
                      </div>
                      <p className="text-[10px] text-slate-600">Register new Sub-Admin or Staff using the form on the right</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* RIGHT: REGISTER SUB-ADMIN / STAFF FORM */}
      <div className="w-full xl:w-96 shrink-0">
        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center gap-2 mb-5 border-b border-slate-800 pb-3">
            <UserPlus className="w-4 h-4 text-amber-500" />
            <h2 className="font-bold text-sm text-slate-200">Create Team Account</h2>
          </div>

          {message.text && (
            <div className={`p-4 rounded-xl mb-4 text-xs border ${
              message.type === "success" 
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                : "bg-red-500/10 border-red-500/20 text-red-300"
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleCreateStaff} className="space-y-4">
            {/* ROLE SELECTOR */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Account Role & Access
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole("sub_admin")}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 cursor-pointer ${
                    role === "sub_admin"
                      ? "bg-amber-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10"
                      : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Sub-Admin</span>
                  </div>
                  <span className="text-[10px] text-slate-400 leading-tight">Admin access (Revenue Hidden)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole("staff")}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 cursor-pointer ${
                    role === "staff"
                      ? "bg-teal-500/20 border-teal-500 text-teal-300 shadow-md shadow-teal-500/10"
                      : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <User className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Staff POS</span>
                  </div>
                  <span className="text-[10px] text-slate-400 leading-tight">Waiter, KOT & Desk billing</span>
                </button>
              </div>

              {role === "sub_admin" && (
                <div className="mt-2.5 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[11px] text-amber-300/90 flex items-start gap-2 leading-relaxed">
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Sub-Admin Privacy Protection:</strong> Sub-Admin will login to this Admin Panel, but will <u>never</u> see hotel revenue, monthly turnover, or financial totals.
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-slate-900/60 border border-slate-800 text-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs outline-none focus:border-amber-500/60"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@marwaribasa.com"
                  className="w-full bg-slate-900/60 border border-slate-800 text-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs outline-none focus:border-amber-500/60"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Temporary Password"
                className="w-full bg-slate-900/60 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-amber-500/60"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Mobile No.
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="tel"
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="Mobile"
                    className="w-full bg-slate-900/60 border border-slate-800 text-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs outline-none focus:border-amber-500/60"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Age (Years)
                </label>
                <input
                  type="number"
                  required
                  min="18"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Age"
                  className="w-full bg-slate-900/60 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-amber-500/60"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Residential Address
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <textarea
                  required
                  rows="2"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Full Address details"
                  className="w-full bg-slate-900/60 border border-slate-800 text-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs outline-none focus:border-amber-500/60 resize-none"
                ></textarea>
              </div>
            </div>

            <div className="pt-2 flex justify-center">
              <MagneticButton className="w-full">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-6 bg-gradient-to-r from-saffron-400 to-saffron-500 hover:from-saffron-300 hover:to-saffron-400 text-slate-950 font-extrabold rounded-xl shadow-lg shadow-saffron-500/20 active:scale-[0.98] transition-all flex items-center justify-center text-xs disabled:opacity-50 cursor-pointer"
                >
                  {loading 
                    ? "Creating Account..." 
                    : (role === "sub_admin" ? "🛡️ Create Sub-Admin Account" : "👨‍🍳 Register Staff Member")}
                </button>
              </MagneticButton>
            </div>
          </form>
        </div>
      </div>

    </div>
    </div>
  );
}
