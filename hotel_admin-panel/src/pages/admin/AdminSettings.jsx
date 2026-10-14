import React, { useState, useEffect } from "react";
import { 
  Settings, Shield, LayoutGrid, Check, X, AlertCircle, Database, User, 
  MapPin, Building2, Landmark, FileText, Clock, CreditCard, Globe, QrCode, ShieldCheck, Phone, Star, Percent, Share2,
  Loader2, CheckCircle2 
} from "lucide-react";
import AdminLookups from "./AdminLookups";
import { authAPI, uploadAPI } from "../../api";
import Swal from "sweetalert2";
import { State, City } from "country-state-city";

const indianStates = State.getStatesOfCountry("IN");

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState("profile");
  const [currentUser, setCurrentUser] = useState(null);

  // Profile Form
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    mobile: "",
    age: "",
    address: "",
    city: "",
    hotelName: "",
    hotelEmail: "",
    hotelPhone: "",
    hotelAddress: "",
    hotelCity: "",
    hotelState: "",
    hotelPincode: "",
    hotelLogo: "",
    hotelType: "Hotel",
    // Legal & Tax Compliance
    gstin: "",
    fssaiNumber: "",
    panNumber: "",
    tradeLicenseNumber: "",
    // Timings & Invoicing Rules
    checkInTime: "12:00 PM",
    checkOutTime: "11:00 AM",
    invoicePrefixRestaurant: "REST-",
    invoicePrefixRoom: "ROOM-",
    invoiceTerms: "",
    foodGstRate: 5,
    roomGstRate: 12,
    // Guest Policy & Operations
    idProofPolicy: "Aadhaar Card, Passport, Driving License, or Voter ID required at check-in",
    // Banking & Payment
    upiId: "",
    bankName: "",
    bankAccountNumber: "",
    bankIfscCode: "",
    bankAccountName: "",
    // Contact & Online
    receptionPhone: "",
    websiteUrl: "",
    googleMapsUrl: "",
    instagramUrl: "",
    facebookUrl: "",
    starRating: "3-Star",
  });

  // Security Form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Permissions Form
  const [permissions, setPermissions] = useState({
    restaurant: true,
    roomBooking: true,
    kot: true,
    advanceBooking: true,
    grc: true,
  });

  // Location State & City variables
  const [personalState, setPersonalState] = useState("");
  const [customPersonalCity, setCustomPersonalCity] = useState(false);
  const [customHotelCity, setCustomHotelCity] = useState(false);

  // IFSC API State & Lookup
  const [ifscLoading, setIfscLoading] = useState(false);
  const [ifscDetails, setIfscDetails] = useState(null);
  const [ifscError, setIfscError] = useState("");

  const fetchIfscDetails = async (code) => {
    const cleanCode = (code || profileData.bankIfscCode || "").trim().toUpperCase();
    if (!cleanCode) {
      setIfscError("Please enter an IFSC code.");
      setIfscDetails(null);
      return;
    }
    if (cleanCode.length !== 11) {
      setIfscError("IFSC code must be exactly 11 characters.");
      setIfscDetails(null);
      return;
    }

    setIfscLoading(true);
    setIfscError("");
    try {
      const response = await fetch(`https://ifsc.razorpay.com/${cleanCode}`);
      if (!response.ok) {
        throw new Error("Invalid IFSC code or branch not found");
      }
      const data = await response.json();
      setIfscDetails(data);
      setIfscError("");
      setProfileData((prev) => ({
        ...prev,
        bankIfscCode: cleanCode,
        bankName: data.BANK || prev.bankName,
      }));
    } catch (err) {
      setIfscDetails(null);
      setIfscError("Invalid IFSC code or branch not found. Please verify.");
    } finally {
      setIfscLoading(false);
    }
  };

  const handleIfscChange = (e) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 11);
    setProfileData((prev) => ({ ...prev, bankIfscCode: val }));
    setIfscError("");
    if (val.length === 11) {
      fetchIfscDetails(val);
    } else {
      setIfscDetails(null);
    }
  };

  const getSelectedStateObj = (stateName) => {
    if (!stateName) return null;
    return indianStates.find(
      (s) => s.name.toLowerCase() === stateName.toLowerCase() || s.isoCode.toLowerCase() === stateName.toLowerCase()
    );
  };

  const hotelStateObj = getSelectedStateObj(profileData.hotelState);
  const hotelCities = hotelStateObj ? City.getCitiesOfState("IN", hotelStateObj.isoCode) : [];

  const personalStateObj = getSelectedStateObj(personalState);
  const personalCities = personalStateObj ? City.getCitiesOfState("IN", personalStateObj.isoCode) : [];

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await authAPI.getProfile();
        if (res.data.success) {
          const user = res.data.user;
          setCurrentUser(user);
          localStorage.setItem("user", JSON.stringify(user));
          if (user.staffPermissions) {
            setPermissions(user.staffPermissions);
          }
          if (user.hotelState) {
            setPersonalState(user.hotelState);
          }
          setProfileData({
            name: user.name || "",
            email: user.email || "",
            mobile: user.mobile || "",
            age: user.age || "",
            address: user.address || "",
            city: user.city || "",
            hotelName: user.hotelName || "",
            hotelEmail: user.hotelEmail || "",
            hotelPhone: user.hotelContact || "",
            hotelAddress: user.hotelAddress || "",
            hotelCity: user.hotelCity || "",
            hotelState: user.hotelState || "",
            hotelPincode: user.hotelPincode || "",
            hotelLogo: user.hotelLogo || "",
            hotelType: user.hotelType || "Hotel",
            gstin: user.gstin || "",
            fssaiNumber: user.fssaiNumber || "",
            panNumber: user.panNumber || "",
            tradeLicenseNumber: user.tradeLicenseNumber || "",
            checkInTime: user.checkInTime || "12:00 PM",
            checkOutTime: user.checkOutTime || "11:00 AM",
            invoicePrefixRestaurant: user.invoicePrefixRestaurant || "REST-",
            invoicePrefixRoom: user.invoicePrefixRoom || "ROOM-",
            invoiceTerms: user.invoiceTerms || "",
            foodGstRate: user.foodGstRate !== undefined ? user.foodGstRate : 5,
            roomGstRate: user.roomGstRate !== undefined ? user.roomGstRate : 12,
            idProofPolicy: user.idProofPolicy || "Aadhaar Card, Passport, Driving License, or Voter ID required at check-in",
            upiId: user.upiId || "",
            bankName: user.bankName || "",
            bankAccountNumber: user.bankAccountNumber || "",
            bankIfscCode: user.bankIfscCode || "",
            bankAccountName: user.bankAccountName || "",
            receptionPhone: user.receptionPhone || "",
            websiteUrl: user.websiteUrl || "",
            googleMapsUrl: user.googleMapsUrl || "",
            instagramUrl: user.instagramUrl || "",
            facebookUrl: user.facebookUrl || "",
            starRating: user.starRating || "3-Star",
          });
          if (user.bankIfscCode && user.bankIfscCode.length === 11) {
            fetchIfscDetails(user.bankIfscCode);
          }
        }
      } catch (err) {
        // Fallback to local storage
        const user = JSON.parse(localStorage.getItem("user"));
        if (user) {
          setCurrentUser(user);
          if (user.staffPermissions) {
            setPermissions(user.staffPermissions);
          }
          if (user.hotelState) {
            setPersonalState(user.hotelState);
          }
          setProfileData({
            name: user.name || "",
            email: user.email || "",
            mobile: user.mobile || "",
            age: user.age || "",
            address: user.address || "",
            city: user.city || "",
            hotelName: user.hotelName || "",
            hotelEmail: user.hotelEmail || "",
            hotelPhone: user.hotelContact || "",
            hotelAddress: user.hotelAddress || "",
            hotelCity: user.hotelCity || "",
            hotelState: user.hotelState || "",
            hotelPincode: user.hotelPincode || "",
            hotelLogo: user.hotelLogo || "",
            hotelType: user.hotelType || "Hotel",
            gstin: user.gstin || "",
            fssaiNumber: user.fssaiNumber || "",
            panNumber: user.panNumber || "",
            tradeLicenseNumber: user.tradeLicenseNumber || "",
            checkInTime: user.checkInTime || "12:00 PM",
            checkOutTime: user.checkOutTime || "11:00 AM",
            invoicePrefixRestaurant: user.invoicePrefixRestaurant || "REST-",
            invoicePrefixRoom: user.invoicePrefixRoom || "ROOM-",
            invoiceTerms: user.invoiceTerms || "",
            foodGstRate: user.foodGstRate !== undefined ? user.foodGstRate : 5,
            roomGstRate: user.roomGstRate !== undefined ? user.roomGstRate : 12,
            idProofPolicy: user.idProofPolicy || "Aadhaar Card, Passport, Driving License, or Voter ID required at check-in",
            upiId: user.upiId || "",
            bankName: user.bankName || "",
            bankAccountNumber: user.bankAccountNumber || "",
            bankIfscCode: user.bankIfscCode || "",
            bankAccountName: user.bankAccountName || "",
            receptionPhone: user.receptionPhone || "",
            websiteUrl: user.websiteUrl || "",
            googleMapsUrl: user.googleMapsUrl || "",
            instagramUrl: user.instagramUrl || "",
            facebookUrl: user.facebookUrl || "",
            starRating: user.starRating || "3-Star",
          });
          if (user.bankIfscCode && user.bankIfscCode.length === 11) {
            fetchIfscDetails(user.bankIfscCode);
          }
        }
      }
    };
    fetchProfile();
  }, []);

  const handleLogoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append("files", file);
      try {
        const res = await uploadAPI.uploadFiles(formData);
        if (res.data.success && res.data.urls.length > 0) {
          setProfileData((prev) => ({ ...prev, hotelLogo: res.data.urls[0] }));
          Swal.fire({
            icon: "success",
            title: "Uploaded",
            text: "Logo uploaded successfully. Save changes to apply.",
            timer: 2000,
            showConfirmButton: false,
            background: '#ffffff',
            color: '#1e293b',
          });
        }
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Upload Failed",
          text: err.response?.data?.message || "Failed to upload logo",
          background: '#ffffff',
          color: '#1e293b',
          customClass: { confirmButton: 'bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-4 rounded border-none shadow' },
        });
      }
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await authAPI.updateProfile(profileData);
      if (res.data.success) {
        Swal.fire({ 
          icon: "success", 
          title: "Success", 
          text: "Profile updated successfully!",
          background: '#ffffff',
          color: '#1e293b',
          customClass: { confirmButton: 'bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-4 rounded border-none shadow' },
        });
        if (currentUser) {
          const updatedUser = { ...currentUser, ...res.data.user };
          localStorage.setItem("user", JSON.stringify(updatedUser));
          setCurrentUser(updatedUser);
          window.dispatchEvent(new Event("user-updated"));
        }
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Failed",
        text: err.response?.data?.message || "Failed to update profile",
        background: '#ffffff',
        color: '#1e293b',
        customClass: { confirmButton: 'bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-4 rounded border-none shadow' },
      });
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      Swal.fire({ 
        icon: "error", 
        title: "Oops...", 
        text: "New passwords do not match!",
        background: '#ffffff',
        color: '#1e293b',
        customClass: { confirmButton: 'bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-4 rounded border-none shadow' },
      });
      return;
    }
    try {
      const res = await authAPI.updatePassword({ currentPassword, newPassword });
      if (res.data.success) {
        Swal.fire({ 
          icon: "success", 
          title: "Success", 
          text: "Password updated successfully!",
          background: '#ffffff',
          color: '#1e293b',
          customClass: { confirmButton: 'bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-4 rounded border-none shadow' },
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Failed",
        text: err.response?.data?.message || "Failed to update password",
        background: '#ffffff',
        color: '#1e293b',
        customClass: { confirmButton: 'bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-4 rounded border-none shadow' },
      });
    }
  };

  const handlePermissionToggle = (key) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const savePermissions = async () => {
    try {
      const res = await authAPI.updateStaffPermissions({ permissions });
      if (res.data.success) {
        Swal.fire({ 
          icon: "success", 
          title: "Success", 
          text: "Staff permissions updated!",
          background: '#ffffff',
          color: '#1e293b',
          customClass: { confirmButton: 'bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-4 rounded border-none shadow' },
        });
        // Update local storage
        if (currentUser) {
          const updatedUser = { ...currentUser, staffPermissions: res.data.staffPermissions };
          localStorage.setItem("user", JSON.stringify(updatedUser));
          setCurrentUser(updatedUser);
          // dispatch a custom event to update Navbar without reload
          window.dispatchEvent(new Event("user-updated"));
        }
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Failed",
        text: err.response?.data?.message || "Failed to update permissions",
        background: '#ffffff',
        color: '#1e293b',
        customClass: { confirmButton: 'bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-4 rounded border-none shadow' },
      });
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto min-h-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-amber-500 flex items-center gap-3">
            <Settings className="w-8 h-8" />
            Settings
          </h1>
          <p className="text-slate-400 mt-1">Manage security and panel preferences</p>
        </div>
      </div>

      <div className="glass border border-gold-800/20 rounded-2xl overflow-hidden flex flex-col md:flex-row min-h-[500px]">
        {/* Tabs Sidebar */}
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-amber-500/10 bg-slate-800/30 p-4 flex flex-row md:flex-col gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap ${
              activeTab === "profile"
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold shadow-lg shadow-amber-500/10"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            }`}
          >
            <User className="w-5 h-5" />
            Profile
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap ${
              activeTab === "security"
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold shadow-lg shadow-amber-500/10"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            }`}
          >
            <Shield className="w-5 h-5" />
            Security
          </button>
          <button
            onClick={() => setActiveTab("staff")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap ${
              activeTab === "staff"
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold shadow-lg shadow-amber-500/10"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            }`}
          >
            <LayoutGrid className="w-5 h-5" />
            Staff Panel
          </button>
          <button
            onClick={() => setActiveTab("lookups")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap ${
              activeTab === "lookups"
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold shadow-lg shadow-amber-500/10"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            }`}
          >
            <Database className="w-5 h-5" />
            Lookups Master
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
          {activeTab === "profile" && (
            <div className="animate-fade-in max-w-4xl">
              <h2 className="text-2xl font-bold font-display text-saffron-500 mb-6 flex items-center gap-2.5 border-b border-saffron-500/20 pb-3">
                <Settings className="w-6 h-6 text-saffron-400" />
                Update Profile & Hotel Details
              </h2>
              <form onSubmit={handleProfileUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                {/* Personal Details */}
                <div className="md:col-span-2">
                  <h3 className="text-lg font-bold font-display text-saffron-500 mb-1 border-b border-saffron-500/20 pb-2 flex items-center gap-2">
                    <User className="w-5 h-5 text-saffron-400" />
                    Personal Details
                  </h3>
                  <p className="text-xs text-slate-400">Admin personal profile & contact information.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Name</label>
                  <input
                    type="text"
                    required
                    value={profileData.name || ""}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                  <input
                    type="email"
                    required
                    value={profileData.email || ""}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Mobile</label>
                  <input
                    type="text"
                    required
                    value={profileData.mobile || ""}
                    onChange={(e) => setProfileData({ ...profileData, mobile: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Age</label>
                  <input
                    type="number"
                    value={profileData.age ?? ""}
                    onChange={(e) => setProfileData({ ...profileData, age: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Address</label>
                  <input
                    type="text"
                    value={profileData.address || ""}
                    onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">State</label>
                  <select
                    value={personalState}
                    onChange={(e) => {
                      setPersonalState(e.target.value);
                      setProfileData((prev) => ({ ...prev, city: "" }));
                      setCustomPersonalCity(false);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-500/50 transition-colors"
                  >
                    <option value="">Select State</option>
                    {indianStates.map((s) => (
                      <option key={s.isoCode} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-slate-300">City</label>
                    <button
                      type="button"
                      onClick={() => setCustomPersonalCity(!customPersonalCity)}
                      className="text-[11px] text-saffron-500 hover:underline"
                    >
                      {customPersonalCity ? "Select from list" : "Type manually"}
                    </button>
                  </div>
                  {customPersonalCity || !personalState ? (
                    <input
                      type="text"
                      placeholder={personalState ? "Enter city name" : "Select state first, or type city name"}
                      value={profileData.city || ""}
                      onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-500/50 transition-colors"
                    />
                  ) : (
                    <select
                      value={profileData.city || ""}
                      onChange={(e) => {
                        if (e.target.value === "__OTHER__") {
                          setCustomPersonalCity(true);
                          setProfileData({ ...profileData, city: "" });
                        } else {
                          setProfileData({ ...profileData, city: e.target.value });
                        }
                      }}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-500/50 transition-colors"
                    >
                      <option value="">Select City ({personalCities.length} available)</option>
                      {profileData.city && !personalCities.some(c => c.name.toLowerCase() === profileData.city.toLowerCase()) && (
                        <option value={profileData.city}>{profileData.city} (Current)</option>
                      )}
                      {personalCities.map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                      <option value="__OTHER__">+ Other (Type manually)...</option>
                    </select>
                  )}
                </div>
                
                {/* Hotel Details */}
                <div className="md:col-span-2 mt-6">
                  <h3 className="text-lg font-bold font-display text-saffron-500 mb-1 border-b border-saffron-500/20 pb-2 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-saffron-400" />
                    Hotel Details & Identity
                  </h3>
                  <p className="text-xs text-slate-400">Primary hotel identity, brand logo, contact numbers and location.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Hotel Name</label>
                  <input
                    type="text"
                    value={profileData.hotelName || ""}
                    onChange={(e) => setProfileData({ ...profileData, hotelName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Hotel Email</label>
                  <input
                    type="email"
                    value={profileData.hotelEmail || ""}
                    onChange={(e) => setProfileData({ ...profileData, hotelEmail: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Hotel Phone</label>
                  <input
                    type="text"
                    value={profileData.hotelPhone || ""}
                    onChange={(e) => setProfileData({ ...profileData, hotelPhone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Hotel State</label>
                  <select
                    value={profileData.hotelState}
                    onChange={(e) => {
                      const selected = e.target.value;
                      setProfileData((prev) => ({
                        ...prev,
                        hotelState: selected,
                        hotelCity: "",
                      }));
                      setCustomHotelCity(false);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-500/50 transition-colors"
                  >
                    <option value="">Select State</option>
                    {indianStates.map((s) => (
                      <option key={s.isoCode} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-slate-300">Hotel City</label>
                    <button
                      type="button"
                      onClick={() => setCustomHotelCity(!customHotelCity)}
                      className="text-[11px] text-saffron-500 hover:underline"
                    >
                      {customHotelCity ? "Select from list" : "Type manually"}
                    </button>
                  </div>
                  {customHotelCity || !profileData.hotelState ? (
                    <input
                      type="text"
                      placeholder={profileData.hotelState ? "Enter city name" : "Select state first, or type city name"}
                      value={profileData.hotelCity}
                      onChange={(e) => setProfileData({ ...profileData, hotelCity: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-500/50 transition-colors"
                    />
                  ) : (
                    <select
                      value={profileData.hotelCity}
                      onChange={(e) => {
                        if (e.target.value === "__OTHER__") {
                          setCustomHotelCity(true);
                          setProfileData({ ...profileData, hotelCity: "" });
                        } else {
                          setProfileData({ ...profileData, hotelCity: e.target.value });
                        }
                      }}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-500/50 transition-colors"
                    >
                      <option value="">Select City ({hotelCities.length} available)</option>
                      {profileData.hotelCity && !hotelCities.some(c => c.name.toLowerCase() === profileData.hotelCity.toLowerCase()) && (
                        <option value={profileData.hotelCity}>{profileData.hotelCity} (Current)</option>
                      )}
                      {hotelCities.map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                      <option value="__OTHER__">+ Other (Type manually)...</option>
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Hotel Type</label>
                  <select
                    value={profileData.hotelType || "Hotel"}
                    onChange={(e) => setProfileData({ ...profileData, hotelType: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-500/50 transition-colors"
                  >
                    <option value="Hotel">Hotel</option>
                    <option value="Resort">Resort</option>
                    <option value="Guest house">Guest house</option>
                    <option value="Restaurant only">Restaurant only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Hotel Star Category</label>
                  <select
                    value={profileData.starRating || "3-Star"}
                    onChange={(e) => setProfileData({ ...profileData, starRating: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-500/50 transition-colors"
                  >
                    <option value="Budget">Budget / Standard</option>
                    <option value="1-Star">1-Star</option>
                    <option value="2-Star">2-Star</option>
                    <option value="3-Star">3-Star</option>
                    <option value="4-Star">4-Star</option>
                    <option value="5-Star">5-Star Luxury</option>
                    <option value="Boutique">Boutique Hotel</option>
                    <option value="Heritage">Heritage Property</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Hotel Pincode</label>
                  <input
                    type="text"
                    placeholder="e.g. 110001"
                    value={profileData.hotelPincode || ""}
                    onChange={(e) => setProfileData({ ...profileData, hotelPincode: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Reception / Desk Phone</label>
                  <input
                    type="text"
                    placeholder="e.g. 011-23456789 or 9876543210"
                    value={profileData.receptionPhone || ""}
                    onChange={(e) => setProfileData({ ...profileData, receptionPhone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-500/50 transition-colors"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Logo (Upload File)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:border-saffron-500/50 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-saffron-500/20 file:text-saffron-500 hover:file:bg-saffron-500/30"
                  />
                  {profileData.hotelLogo && (
                    <div className="mt-2 text-xs text-saffron-500 truncate" title={profileData.hotelLogo}>
                      Current: {profileData.hotelLogo.substring(0, 40)}...
                    </div>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Hotel Full Address</label>
                  <textarea
                    rows="2"
                    placeholder="Street, Landmark, Area..."
                    value={profileData.hotelAddress || ""}
                    onChange={(e) => setProfileData({ ...profileData, hotelAddress: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-500/50 transition-colors"
                  />
                </div>

                {/* 1. Legal & Tax Compliance */}
                <div className="md:col-span-2 mt-6">
                  <h3 className="text-lg font-bold font-display text-saffron-500 mb-1 border-b border-saffron-500/20 pb-2 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-saffron-400" />
                    Legal & Tax Compliance
                  </h3>
                  <p className="text-xs text-slate-400">Printed on official invoices and used for tax filing compliance.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">GSTIN (GST Number)</label>
                  <input
                    type="text"
                    placeholder="e.g. 07AAAAA0000A1Z5"
                    value={profileData.gstin || ""}
                    onChange={(e) => setProfileData({ ...profileData, gstin: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-500/50 transition-colors uppercase font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">FSSAI License No.</label>
                  <input
                    type="text"
                    placeholder="e.g. 10012345678901 (14 digits)"
                    value={profileData.fssaiNumber || ""}
                    onChange={(e) => setProfileData({ ...profileData, fssaiNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-500/50 transition-colors font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Business PAN Number</label>
                  <input
                    type="text"
                    placeholder="e.g. ABCDE1234F"
                    value={profileData.panNumber || ""}
                    onChange={(e) => setProfileData({ ...profileData, panNumber: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-500/50 transition-colors uppercase font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Trade / Sarai Act License No.</label>
                  <input
                    type="text"
                    placeholder="Municipal or Police license no."
                    value={profileData.tradeLicenseNumber || ""}
                    onChange={(e) => setProfileData({ ...profileData, tradeLicenseNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-500/50 transition-colors text-xs"
                  />
                </div>

                {/* 2. Timings & Invoicing Configuration */}
                <div className="md:col-span-2 mt-6">
                  <h3 className="text-lg font-bold font-display text-saffron-500 mb-1 border-b border-saffron-500/20 pb-2 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-saffron-400" />
                    Timings, Tax Rates & Invoicing Rules
                  </h3>
                  <p className="text-xs text-slate-400">Controls default booking check-in/out policies, tax slabs and invoice series.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Default Check-In Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 12:00 PM"
                    value={profileData.checkInTime || ""}
                    onChange={(e) => setProfileData({ ...profileData, checkInTime: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Default Check-Out Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 11:00 AM"
                    value={profileData.checkOutTime || ""}
                    onChange={(e) => setProfileData({ ...profileData, checkOutTime: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Restaurant Bill Prefix</label>
                  <input
                    type="text"
                    placeholder="e.g. REST- or BILL-"
                    value={profileData.invoicePrefixRestaurant || ""}
                    onChange={(e) => setProfileData({ ...profileData, invoicePrefixRestaurant: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-500/50 transition-colors font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Room Bill Prefix</label>
                  <input
                    type="text"
                    placeholder="e.g. ROOM- or ST-"
                    value={profileData.invoicePrefixRoom || ""}
                    onChange={(e) => setProfileData({ ...profileData, invoicePrefixRoom: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-500/50 transition-colors font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Food / Restaurant GST Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 5"
                    value={profileData.foodGstRate ?? 5}
                    onChange={(e) => setProfileData({ ...profileData, foodGstRate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Room Booking GST Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 12"
                    value={profileData.roomGstRate ?? 12}
                    onChange={(e) => setProfileData({ ...profileData, roomGstRate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-500/50 transition-colors"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Invoice Terms & Policy (Footer Note)</label>
                  <textarea
                    rows="2"
                    placeholder="e.g. 1. Valid ID required at check-in. 2. Cancellation subject to hotel policy."
                    value={profileData.invoiceTerms || ""}
                    onChange={(e) => setProfileData({ ...profileData, invoiceTerms: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-500/50 transition-colors text-xs"
                  />
                </div>

                {/* 3. Guest Policy & Operations */}
                <div className="md:col-span-2 mt-6">
                  <h3 className="text-lg font-bold font-display text-saffron-500 mb-1 border-b border-saffron-500/20 pb-2 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-saffron-400" />
                    Guest Policy & Operations
                  </h3>
                  <p className="text-xs text-slate-400">Official check-in requirements and policies printed on GRC and receipts.</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Accepted ID Proof Policy & Guidelines</label>
                  <textarea
                    rows="2"
                    placeholder="e.g. Aadhaar Card, Passport, Driving License, or Voter ID required at check-in"
                    value={profileData.idProofPolicy || ""}
                    onChange={(e) => setProfileData({ ...profileData, idProofPolicy: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-500/50 transition-colors text-xs"
                  />
                </div>

                {/* 4. Bank & UPI Payment Details */}
                <div className="md:col-span-2 mt-6">
                  <h3 className="text-lg font-bold font-display text-saffron-500 mb-1 border-b border-saffron-500/20 pb-2 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-saffron-400" />
                    Bank & UPI Payment Details
                  </h3>
                  <p className="text-xs text-slate-400">Used for direct UPI QR code generation on guest invoices and B2B settlements.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">UPI ID (For Bill QR Code)</label>
                  <input
                    type="text"
                    placeholder="e.g. hotel@okhdfcbank"
                    value={profileData.upiId || ""}
                    onChange={(e) => setProfileData({ ...profileData, upiId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-500/50 transition-colors font-mono text-xs"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-slate-300">Bank IFSC Code</label>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {(profileData.bankIfscCode || "").length}/11
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={11}
                      placeholder="e.g. SBIN0000691 or HDFC0000001"
                      value={profileData.bankIfscCode || ""}
                      onChange={handleIfscChange}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl pl-4 pr-24 py-3 focus:outline-none focus:border-saffron-500/50 transition-colors uppercase font-mono text-xs tracking-wider"
                    />
                    <button
                      type="button"
                      onClick={() => fetchIfscDetails(profileData.bankIfscCode)}
                      disabled={ifscLoading || (profileData.bankIfscCode || "").length !== 11}
                      className="absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-lg bg-saffron-500/10 hover:bg-saffron-500/20 text-saffron-400 border border-saffron-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {ifscLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-saffron-400" />
                          <span>Checking...</span>
                        </>
                      ) : ifscDetails ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Verified</span>
                        </>
                      ) : (
                        <span>Verify</span>
                      )}
                    </button>
                  </div>
                  {ifscError && (
                    <p className="text-xs text-rose-400 mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {ifscError}
                    </p>
                  )}
                  {!ifscError && !ifscDetails && (
                    <p className="text-[11px] text-slate-500 mt-1">
                      Enter 11-digit IFSC code to auto-fetch official bank name & branch
                    </p>
                  )}
                </div>

                {/* Verified Bank Details Card */}
                {ifscDetails && (
                  <div className="md:col-span-2 ifsc-verified-card rounded-2xl p-4.5 transition-all">
                    <div className="flex items-center justify-between mb-3 border-b ifsc-divider pb-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/25">
                          <Landmark className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold ifsc-title font-display">{ifscDetails.BANK}</h4>
                          <p className="text-[11px] ifsc-subtitle font-mono">Branch: {ifscDetails.BRANCH}</p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ifsc-rbi-badge">
                        <CheckCircle2 className="w-3.5 h-3.5" /> RBI Verified
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                      <div className="ifsc-sub-box p-3 rounded-xl">
                        <span className="text-[10px] ifsc-label font-bold uppercase tracking-wider block">City & State</span>
                        <span className="ifsc-val font-semibold mt-0.5 block">{ifscDetails.CITY || ifscDetails.CENTRE}, {ifscDetails.STATE}</span>
                      </div>
                      <div className="ifsc-sub-box p-3 rounded-xl">
                        <span className="text-[10px] ifsc-label font-bold uppercase tracking-wider block">MICR Code</span>
                        <span className="ifsc-val font-mono font-semibold mt-0.5 block">{ifscDetails.MICR || 'N/A'}</span>
                      </div>
                      <div className="ifsc-sub-box p-3 rounded-xl">
                        <span className="text-[10px] ifsc-label font-bold uppercase tracking-wider block">Payment Methods</span>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          {ifscDetails.UPI && <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/25">UPI</span>}
                          {ifscDetails.NEFT && <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold border border-blue-500/25">NEFT</span>}
                          {ifscDetails.RTGS && <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold border border-indigo-500/25">RTGS</span>}
                          {ifscDetails.IMPS && <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-bold border border-purple-500/25">IMPS</span>}
                        </div>
                      </div>
                      <div className="ifsc-sub-box p-3 rounded-xl sm:col-span-2 md:col-span-3">
                        <span className="text-[10px] ifsc-label font-bold uppercase tracking-wider block">Full Branch Address</span>
                        <span className="ifsc-addr font-medium mt-0.5 block text-[11px] leading-relaxed">{ifscDetails.ADDRESS}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Bank Name</label>
                  <input
                    type="text"
                    placeholder="e.g. HDFC Bank, SBI, ICICI"
                    value={profileData.bankName || ""}
                    onChange={(e) => setProfileData({ ...profileData, bankName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-500/50 transition-colors"
                  />
                  {ifscDetails && (
                    <p className="text-[10px] text-emerald-400 mt-1">Auto-filled: {ifscDetails.BANK}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Account Holder Name</label>
                  <input
                    type="text"
                    placeholder="Beneficiary name as in bank"
                    value={profileData.bankAccountName || ""}
                    onChange={(e) => setProfileData({ ...profileData, bankAccountName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-500/50 transition-colors"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Bank Account Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 50100234567890"
                    value={profileData.bankAccountNumber || ""}
                    onChange={(e) => setProfileData({ ...profileData, bankAccountNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-500/50 transition-colors font-mono text-xs"
                  />
                </div>

                {/* 5. Digital, Location & Social Presence */}
                <div className="md:col-span-2 mt-6">
                  <h3 className="text-lg font-bold font-display text-saffron-500 mb-1 border-b border-saffron-500/20 pb-2 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-saffron-400" />
                    Digital, Location & Social Presence
                  </h3>
                  <p className="text-xs text-slate-400">Used for WhatsApp booking confirmations, guest navigation links and social branding.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Website URL</label>
                  <input
                    type="url"
                    placeholder="https://www.yourhotel.com"
                    value={profileData.websiteUrl || ""}
                    onChange={(e) => setProfileData({ ...profileData, websiteUrl: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Google Maps Location Link</label>
                  <input
                    type="url"
                    placeholder="https://maps.app.goo.gl/..."
                    value={profileData.googleMapsUrl || ""}
                    onChange={(e) => setProfileData({ ...profileData, googleMapsUrl: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Instagram Handle / URL</label>
                  <input
                    type="text"
                    placeholder="e.g. @yourhotel or https://instagram.com/yourhotel"
                    value={profileData.instagramUrl || ""}
                    onChange={(e) => setProfileData({ ...profileData, instagramUrl: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Facebook Page URL</label>
                  <input
                    type="url"
                    placeholder="https://facebook.com/yourhotel"
                    value={profileData.facebookUrl || ""}
                    onChange={(e) => setProfileData({ ...profileData, facebookUrl: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-500/50 transition-colors"
                  />
                </div>
                
                <div className="md:col-span-2 mt-6">
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-saffron-500 to-saffron-600 hover:from-saffron-400 hover:to-saffron-500 text-lagoon-950 font-bold py-3.5 px-8 rounded-xl transition-all active:scale-95 shadow-lg shadow-saffron-500/20 text-sm"
                  >
                    Save All Hotel Details
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === "security" && (
            <div className="animate-fade-in max-w-md">
              <h2 className="text-xl font-bold font-display text-saffron-500 mb-6 flex items-center gap-2 border-b border-saffron-500/20 pb-3">
                <Shield className="w-5 h-5 text-saffron-400" />
                Change Password
              </h2>
              <form onSubmit={handlePasswordUpdate} className="flex flex-col gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Current Password</label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500/50 transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  className="mt-2 bg-gradient-to-r from-saffron-500 to-saffron-600 hover:from-saffron-400 hover:to-saffron-500 text-lagoon-950 font-bold py-3.5 px-6 rounded-xl transition-all active:scale-95 shadow-md shadow-saffron-500/20 text-sm"
                >
                  Update Password
                </button>
              </form>
            </div>
          )}

          {activeTab === "staff" && (
            <div className="animate-fade-in max-w-2xl">
              <h2 className="text-xl font-bold font-display text-saffron-500 mb-2 flex items-center gap-2 border-b border-saffron-500/20 pb-3">
                <LayoutGrid className="w-5 h-5 text-saffron-400" />
                Staff Panel Modules
              </h2>
              <p className="text-sm text-slate-400 mb-6 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                Select which menus should be visible to staff members.
              </p>

              <div className="flex flex-col gap-4 mb-8">
                {[
                  { key: "restaurant", label: "Restaurant Billing" },
                  { key: "roomBooking", label: "Room Booking" },
                  { key: "kot", label: "KOT Billing" },
                  { key: "advanceBooking", label: "Advance Bookings" },
                  { key: "grc", label: "Print GRC" },
                ].map((mod) => (
                  <div key={mod.key} className="flex items-center justify-between p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
                    <span className="font-medium text-slate-200">{mod.label}</span>
                    <button
                      onClick={() => handlePermissionToggle(mod.key)}
                      className={`relative w-14 h-7 rounded-full transition-colors ${
                        permissions[mod.key] ? "bg-amber-500" : "bg-slate-700"
                      }`}
                    >
                      <div
                        className={`absolute top-1 flex items-center justify-center w-5 h-5 rounded-full bg-white transition-transform ${
                          permissions[mod.key] ? "translate-x-8" : "translate-x-1"
                        }`}
                      >
                        {permissions[mod.key] ? (
                          <Check className="w-3 h-3 text-amber-500" />
                        ) : (
                          <X className="w-3 h-3 text-slate-400" />
                        )}
                      </div>
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={savePermissions}
                className="bg-gradient-to-r from-saffron-500 to-saffron-600 hover:from-saffron-400 hover:to-saffron-500 text-lagoon-950 font-bold py-3.5 px-8 rounded-xl transition-all active:scale-95 shadow-md shadow-saffron-500/20 text-sm"
              >
                Save Preferences
              </button>
            </div>
          )}

          {activeTab === "lookups" && (
            <div className="animate-fade-in h-full">
              <AdminLookups isComponent={true} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
