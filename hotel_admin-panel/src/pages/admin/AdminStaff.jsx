import React, { useState, useEffect } from "react";
import api from "../../api";
import { 
  UserPlus, 
  Users, 
  Trash2, 
  Mail, 
  Phone, 
  MapPin, 
  User, 
  ShieldAlert, 
  ShieldCheck, 
  Shield, 
  Sparkles,
  Edit3,
  X,
  KeyRound,
  Eye,
  EyeOff,
  Lock,
  RefreshCw
} from "lucide-react";
import { showError, showConfirm, showSuccess } from "../../utils/alerts";
import MagneticButton from "../../components/MagneticButton";

export default function AdminStaff() {
  const [staffList, setStaffList] = useState([]);
  
  // Create Form fields
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

  // Edit Staff Modal State
  const [editingStaff, setEditingStaff] = useState(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editMobile, setEditMobile] = useState("");
  const [editAge, setEditAge] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editRole, setEditRole] = useState("staff");
  const [editPassword, setEditPassword] = useState("");
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

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

  // Open Edit Modal & Populate Form
  const handleOpenEditModal = (staff) => {
    setEditingStaff(staff);
    setEditName(staff.name || "");
    setEditEmail(staff.email || "");
    setEditMobile(staff.mobile || "");
    setEditAge(staff.age || "");
    setEditAddress(staff.address || "");
    setEditRole(staff.role || "staff");
    setEditPassword(""); // Blank by default so password is only updated if admin types a new one
    setShowEditPassword(false);
    setEditError("");
  };

  // Handle Update Staff Submit
  const handleUpdateStaff = async (e) => {
    e.preventDefault();
    if (!editingStaff) return;
    setEditLoading(true);
    setEditError("");

    if (editPassword && editPassword.trim().length > 0 && editPassword.trim().length < 6) {
      setEditError("Password kam se kam 6 characters ka hona chahiye.");
      setEditLoading(false);
      return;
    }

    try {
      const payload = {
        name: editName.trim(),
        email: editEmail.trim(),
        mobile: editMobile.trim(),
        age: Number(editAge),
        address: editAddress.trim(),
        role: editRole,
      };

      if (editPassword && editPassword.trim().length >= 6) {
        payload.password = editPassword.trim();
      }

      const res = await api.put(`api/auth/staff/${editingStaff._id}`, payload);

      if (res.data.success) {
        showSuccess("Updated!", res.data.message || "Staff member updated successfully.");
        setEditingStaff(null);
        fetchStaff();
      }
    } catch (error) {
      console.error("Update staff error:", error);
      setEditError(error.response?.data?.message || "Failed to update staff member.");
    } finally {
      setEditLoading(false);
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
            Create, edit details, and update passwords for your hotel team & front-desk staff
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/80 p-1.5 rounded-2xl border border-slate-300 dark:border-slate-800 shrink-0 shadow-sm">
          <button
            onClick={() => setFilterRole("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterRole === "all"
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                : "text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white"
            }`}
          >
            All ({staffList.length})
          </button>
          <button
            onClick={() => setFilterRole("sub_admin")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              filterRole === "sub_admin"
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                : "text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white"
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
                : "text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white"
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
                    <th className="py-3 px-4 text-center">Actions</th>
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
                          <div className="flex items-center justify-center gap-2">
                            {/* EDIT BUTTON (Clear & High Contrast in both Light & Dark mode) */}
                            <button
                              onClick={() => handleOpenEditModal(staff)}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-amber-500/20 hover:bg-amber-500 text-amber-800 dark:text-amber-300 hover:text-slate-950 dark:hover:text-slate-950 border border-amber-500/40 hover:border-amber-500 shadow-sm transition-all cursor-pointer"
                              title="Edit Staff Details & Password"
                            >
                              <Edit3 className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>Edit</span>
                            </button>

                            {/* DELETE BUTTON */}
                            <button
                              onClick={() => handleDeleteStaff(staff._id)}
                              className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-600 dark:text-red-400 hover:text-white dark:hover:text-white border border-red-500/30 hover:border-red-500 shadow-sm transition-all cursor-pointer"
                              title="Revoke Access"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
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
                        ? "bg-amber-500/20 border-amber-500 text-amber-900 dark:text-amber-300 shadow-md shadow-amber-500/10 font-bold"
                        : "bg-slate-100 dark:bg-slate-900/60 border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>Sub-Admin</span>
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">Admin access (Revenue Hidden)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("staff")}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 cursor-pointer ${
                      role === "staff"
                        ? "bg-teal-500/20 border-teal-500 text-teal-900 dark:text-teal-300 shadow-md shadow-teal-500/10 font-bold"
                        : "bg-slate-100 dark:bg-slate-900/60 border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <User className="w-4 h-4 text-teal-500 shrink-0" />
                      <span>Staff POS</span>
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">Waiter, KOT & Desk billing</span>
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
                    className="w-full py-3.5 px-6 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl shadow-lg shadow-amber-500/25 active:scale-[0.98] transition-all flex items-center justify-center text-xs disabled:opacity-50 cursor-pointer"
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

      {/* ================= EDIT STAFF & PASSWORD UPDATE MODAL ================= */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-scaleUp text-slate-900 dark:text-white">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Edit Staff Account</span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 font-bold">
                      {editingStaff.name}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Update profile details or reset password for this team member
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingStaff(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleUpdateStaff} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {editError && (
                <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-300 text-xs flex items-center gap-2 font-medium">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              {/* Role Selection */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Account Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditRole("sub_admin")}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2 cursor-pointer ${
                      editRole === "sub_admin"
                        ? "bg-amber-500/20 border-amber-500 text-amber-800 dark:text-amber-300 font-extrabold shadow-sm"
                        : "bg-slate-100 dark:bg-slate-900/60 border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-500" />
                    <span className="text-xs">Sub-Admin</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditRole("staff")}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2 cursor-pointer ${
                      editRole === "staff"
                        ? "bg-teal-500/20 border-teal-500 text-teal-800 dark:text-teal-300 font-extrabold shadow-sm"
                        : "bg-slate-100 dark:bg-slate-900/60 border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                  >
                    <User className="w-4 h-4 text-teal-500" />
                    <span className="text-xs">Staff POS</span>
                  </button>
                </div>
              </div>

              {/* Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              {/* Mobile & Age */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={editMobile}
                    onChange={(e) => setEditMobile(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Age (Years)
                  </label>
                  <input
                    type="number"
                    required
                    min="18"
                    value={editAge}
                    onChange={(e) => setEditAge(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Residential Address
                </label>
                <textarea
                  rows="2"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs outline-none focus:border-amber-500 resize-none"
                />
              </div>

              {/* SPECIAL PASSWORD RESET SECTION FOR HOTEL ADMIN */}
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 space-y-2">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <label className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                    Update Password (Optional)
                  </label>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  Agar staff apna password bhool gaya hai to hotel admin yahan se naya password set kar sakta hai. 
                  <span className="text-amber-700 dark:text-amber-300 font-bold"> Agar password change nahi karna to ise khali chhod dein.</span>
                </p>

                <div className="relative pt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showEditPassword ? "text" : "password"}
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Enter new password (min 6 characters) or leave blank"
                    className="w-full bg-white dark:bg-slate-950 border border-amber-400 dark:border-amber-500/40 text-slate-900 dark:text-slate-100 rounded-xl py-2.5 pl-9 pr-10 text-xs outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                  >
                    {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/25 active:scale-95 transition-all cursor-pointer disabled:opacity-60"
                >
                  {editLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
