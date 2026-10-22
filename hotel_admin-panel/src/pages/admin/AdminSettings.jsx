import React, { useState, useEffect } from "react";
import { 
  Settings, Shield, LayoutGrid, Check, X, AlertCircle, Database, User, 
  MapPin, Building2, Landmark, FileText, Clock, CreditCard, Globe, QrCode, ShieldCheck, Phone, Star, Percent, Share2,
  Loader2, CheckCircle2, ShieldAlert, BellRing, Send, KeyRound, Smartphone, ExternalLink, Sparkles,
  Bot, ChevronDown, ChevronUp, Copy
} from "lucide-react";
import AdminLookups from "./AdminLookups";
import { authAPI, uploadAPI, antiTheftAPI } from "../../api";
import Swal from "sweetalert2";
import { State, City } from "country-state-city";
import MagneticButton from "../../components/MagneticButton";

const indianStates = State.getStatesOfCountry("IN");

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState("profile");
  const [currentUser, setCurrentUser] = useState(null);
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [detectingChatId, setDetectingChatId] = useState(false);
  const [showBotInstructions, setShowBotInstructions] = useState(false);
  const [copiedBotCommand, setCopiedBotCommand] = useState(false);

  const handleCopyCommand = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedBotCommand(true);
    setTimeout(() => setCopiedBotCommand(false), 2000);
  };

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
    telegramAlertsEnabled: false,
    telegramChatId: "",
    antiTheftOtpRequired: true,
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
            telegramAlertsEnabled: Boolean(user.telegramAlertsEnabled),
            telegramChatId: user.telegramChatId || "",
            antiTheftOtpRequired: user.antiTheftOtpRequired !== undefined ? Boolean(user.antiTheftOtpRequired) : true,
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
            telegramAlertsEnabled: Boolean(user.telegramAlertsEnabled),
            telegramChatId: user.telegramChatId || "",
            antiTheftOtpRequired: user.antiTheftOtpRequired !== undefined ? Boolean(user.antiTheftOtpRequired) : true,
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

  const handleTestTelegram = async () => {
    if (!profileData.telegramChatId) {
      Swal.fire({
        icon: "warning",
        title: "Telegram Chat ID Required",
        text: "Please enter your Telegram Chat ID first to test the alert.",
        background: '#ffffff',
        color: '#1e293b',
      });
      return;
    }
    setTestingTelegram(true);
    try {
      const res = await antiTheftAPI.testTelegramAlert(profileData.telegramChatId);
      if (res.data.success) {
        Swal.fire({
          icon: "success",
          title: "Test Alert Sent! 🚀",
          text: "Check your Telegram app. A notification alert was delivered with sound!",
          background: '#ffffff',
          color: '#1e293b',
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Test Alert Failed",
        text: err.response?.data?.message || "Make sure you started the bot on Telegram and your Chat ID is correct.",
        background: '#ffffff',
        color: '#1e293b',
      });
    } finally {
      setTestingTelegram(false);
    }
  };

  const handleDetectChatId = async () => {
    setDetectingChatId(true);
    try {
      const res = await antiTheftAPI.detectChatId();
      if (res.data.success && res.data.chatId) {
        setProfileData((prev) => ({
          ...prev,
          telegramChatId: res.data.chatId,
        }));
        Swal.fire({
          icon: "success",
          title: "Chat ID Auto-Detected! 🎉",
          html: `<div style="font-size: 14px; color: #1e293b;">
                  Owner Chat ID <b>${res.data.chatId}</b> (${res.data.senderName}) mil gaya!<br/><br/>
                  Niche <b>"Save Anti-Theft Preferences"</b> par click karein aur phir <b>"Send Test Alert"</b> test karein!
                 </div>`,
          background: '#ffffff',
          color: '#1e293b',
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "info",
        title: "Pehle Telegram Bot me 'START' dabayein",
        html: `
          <div style="text-align: left; font-size: 13px; line-height: 1.6; color: #334155;">
            <p>Bot ko abhi tak aapka koi message nahi mila!</p>
            <div style="background: #f1f5f9; padding: 12px; border-radius: 8px; margin: 10px 0; border: 1px solid #e2e8f0;">
              <b>Aasan 2 Steps:</b>
              <ol style="margin-top: 6px; padding-left: 18px;">
                <li>Niche diye gaye link se official bot open karein: <br/><a href="https://t.me/e_annapurna_alerts_bot" target="_blank" style="color: #0284c7; font-weight: bold; text-decoration: underline;">@e_annapurna_alerts_bot</a></li>
                <li>Telegram me niche <b>START</b> button dabayein.</li>
              </ol>
            </div>
            <p style="margin: 0; font-size: 12px; color: #64748b;">START dabate hi wapas aakar <b>Auto-Detect</b> dabayein, aapka Chat ID bina type kiye automatic aa jayega!</p>
          </div>
        `,
        confirmButtonText: "Open Telegram Bot (@e_annapurna_alerts_bot)",
        showCancelButton: true,
        cancelButtonText: "Cancel",
        background: '#ffffff',
        color: '#1e293b',
        customClass: { confirmButton: 'bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded border-none shadow' }
      }).then((result) => {
        if (result.isConfirmed) {
          window.open("https://t.me/e_annapurna_alerts_bot", "_blank");
        }
      });
    } finally {
      setDetectingChatId(false);
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
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto min-h-full">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-saffron-500/10 border border-saffron-500/25 text-saffron-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Settings className="w-3.5 h-3.5 animate-[spin_6s_linear_infinite]" />
            Hotel Configuration Center
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white font-display tracking-tight flex items-center gap-3">
            Settings & Preferences
          </h1>
          <p className="text-slate-300 text-sm mt-1">
            Manage your hotel branding, billing compliance, banking details & staff permissions.
          </p>
        </div>

        {currentUser?.hotelName && (
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl glass border border-white/10 shadow-lg">
            {currentUser.hotelLogo ? (
              <img src={currentUser.hotelLogo} alt="Logo" className="w-8 h-8 rounded-lg object-contain bg-white/10 p-0.5" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-saffron-500/20 text-saffron-400 font-bold flex items-center justify-center text-xs">
                {currentUser.hotelName.charAt(0)}
              </div>
            )}
            <div>
              <p className="text-xs font-bold text-white leading-tight">{currentUser.hotelName}</p>
              <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active Property
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="glass border border-white/10 rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-2xl backdrop-blur-xl">
        {/* Tabs Sidebar */}
        <div className="settings-tabs-sidebar w-full md:w-64 border-b md:border-b-0 md:border-r border-white/10 bg-slate-950/40 p-3 md:p-4 flex flex-row md:flex-col gap-2 overflow-x-auto shrink-0 custom-scrollbar">
          <p className="text-[10px] uppercase font-black tracking-widest text-saffron-400 px-3 py-1 hidden md:block">
            Preferences Menu
          </p>
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap text-sm font-semibold cursor-pointer ${
              activeTab === "profile"
                ? "settings-tab-active bg-gradient-to-r from-saffron-500/25 to-saffron-500/10 text-white border border-saffron-400/50 shadow-sm"
                : "settings-tab-inactive text-slate-300 hover:text-white hover:bg-white/[0.06] border border-transparent"
            }`}
          >
            <div className={`p-1.5 rounded-lg ${activeTab === "profile" ? "bg-saffron-500 text-slate-950 font-bold" : "bg-white/[0.06] text-saffron-300"}`}>
              <User className="w-4 h-4" />
            </div>
            <span>Profile & Hotel</span>
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap text-sm font-semibold cursor-pointer ${
              activeTab === "security"
                ? "settings-tab-active bg-gradient-to-r from-saffron-500/25 to-saffron-500/10 text-white border border-saffron-400/50 shadow-sm"
                : "settings-tab-inactive text-slate-300 hover:text-white hover:bg-white/[0.06] border border-transparent"
            }`}
          >
            <div className={`p-1.5 rounded-lg ${activeTab === "security" ? "bg-saffron-500 text-slate-950 font-bold" : "bg-white/[0.06] text-saffron-300"}`}>
              <Shield className="w-4 h-4" />
            </div>
            <span>Security</span>
          </button>
          <button
            onClick={() => setActiveTab("staff")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap text-sm font-semibold cursor-pointer ${
              activeTab === "staff"
                ? "settings-tab-active bg-gradient-to-r from-saffron-500/25 to-saffron-500/10 text-white border border-saffron-400/50 shadow-sm"
                : "settings-tab-inactive text-slate-300 hover:text-white hover:bg-white/[0.06] border border-transparent"
            }`}
          >
            <div className={`p-1.5 rounded-lg ${activeTab === "staff" ? "bg-saffron-500 text-slate-950 font-bold" : "bg-white/[0.06] text-saffron-300"}`}>
              <LayoutGrid className="w-4 h-4" />
            </div>
            <span>Staff Panel</span>
          </button>
          <button
            onClick={() => setActiveTab("lookups")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap text-sm font-semibold cursor-pointer ${
              activeTab === "lookups"
                ? "settings-tab-active bg-gradient-to-r from-saffron-500/25 to-saffron-500/10 text-white border border-saffron-400/50 shadow-sm"
                : "settings-tab-inactive text-slate-300 hover:text-white hover:bg-white/[0.06] border border-transparent"
            }`}
          >
            <div className={`p-1.5 rounded-lg ${activeTab === "lookups" ? "bg-saffron-500 text-slate-950 font-bold" : "bg-white/[0.06] text-saffron-300"}`}>
              <Database className="w-4 h-4" />
            </div>
            <span>Lookups Master</span>
          </button>
          <button
            onClick={() => setActiveTab("anti-theft")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap text-sm font-semibold cursor-pointer ${
              activeTab === "anti-theft"
                ? "settings-tab-active-rose bg-gradient-to-r from-rose-500/25 to-rose-500/10 text-white border border-rose-400/50 shadow-sm"
                : "settings-tab-inactive text-slate-300 hover:text-white hover:bg-white/[0.06] border border-transparent"
            }`}
          >
            <div className={`p-1.5 rounded-lg ${activeTab === "anti-theft" ? "bg-rose-500 text-white font-bold" : "bg-white/[0.06] text-rose-400"}`}>
              <ShieldAlert className="w-4 h-4" />
            </div>
            <span className="flex items-center gap-1.5">
              Anti-Theft OTP
              <span className="text-[10px] bg-rose-500/20 text-rose-300 font-bold px-1.5 py-0.5 rounded-full border border-rose-400/30">Free</span>
            </span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar">
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
                  <label className="block text-sm font-semibold text-slate-200 mb-2">Name</label>
                  <input
                    type="text"
                    required
                    value={profileData.name || ""}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    className="w-full bg-[#061C1C]/80 border border-white/15 text-white font-medium rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-400 focus:ring-1 focus:ring-saffron-400/50 transition-all shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-2">Email</label>
                  <input
                    type="email"
                    required
                    value={profileData.email || ""}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    className="w-full bg-[#061C1C]/80 border border-white/15 text-white font-medium rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-400 focus:ring-1 focus:ring-saffron-400/50 transition-all shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-2">Mobile</label>
                  <input
                    type="text"
                    required
                    value={profileData.mobile || ""}
                    onChange={(e) => setProfileData({ ...profileData, mobile: e.target.value })}
                    className="w-full bg-[#061C1C]/80 border border-white/15 text-white font-medium rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-400 focus:ring-1 focus:ring-saffron-400/50 transition-all shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-2">Age</label>
                  <input
                    type="number"
                    value={profileData.age ?? ""}
                    onChange={(e) => setProfileData({ ...profileData, age: e.target.value })}
                    className="w-full bg-[#061C1C]/80 border border-white/15 text-white font-medium rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-400 focus:ring-1 focus:ring-saffron-400/50 transition-all shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-2">Address</label>
                  <input
                    type="text"
                    value={profileData.address || ""}
                    onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                    className="w-full bg-[#061C1C]/80 border border-white/15 text-white font-medium rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-400 focus:ring-1 focus:ring-saffron-400/50 transition-all shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-2">State</label>
                  <select
                    value={personalState}
                    onChange={(e) => {
                      setPersonalState(e.target.value);
                      setProfileData((prev) => ({ ...prev, city: "" }));
                      setCustomPersonalCity(false);
                    }}
                    className="w-full bg-[#061C1C]/80 border border-white/15 text-white font-medium rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-400 focus:ring-1 focus:ring-saffron-400/50 transition-all shadow-inner"
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
                    <label className="block text-sm font-semibold text-slate-200">City</label>
                    <button
                      type="button"
                      onClick={() => setCustomPersonalCity(!customPersonalCity)}
                      className="text-[11px] font-bold text-saffron-400 hover:text-saffron-300 underline cursor-pointer"
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
                      className="w-full bg-[#061C1C]/80 border border-white/15 text-white font-medium rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-400 focus:ring-1 focus:ring-saffron-400/50 transition-all shadow-inner"
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
                      className="w-full bg-[#061C1C]/80 border border-white/15 text-white font-medium rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-400 focus:ring-1 focus:ring-saffron-400/50 transition-all shadow-inner"
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
                  <h3 className="text-lg font-bold font-display text-saffron-400 mb-1 border-b border-saffron-500/20 pb-2 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-saffron-400" />
                    Hotel Details & Identity
                  </h3>
                  <p className="text-xs text-slate-300">Primary hotel identity, brand logo, contact numbers and location.</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-2">Hotel Name</label>
                  <input
                    type="text"
                    value={profileData.hotelName || ""}
                    onChange={(e) => setProfileData({ ...profileData, hotelName: e.target.value })}
                    className="w-full bg-[#061C1C]/80 border border-white/15 text-white font-medium rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-400 focus:ring-1 focus:ring-saffron-400/50 transition-all shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-2">Hotel Email</label>
                  <input
                    type="email"
                    value={profileData.hotelEmail || ""}
                    onChange={(e) => setProfileData({ ...profileData, hotelEmail: e.target.value })}
                    className="w-full bg-[#061C1C]/80 border border-white/15 text-white font-medium rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-400 focus:ring-1 focus:ring-saffron-400/50 transition-all shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-2">Hotel Phone</label>
                  <input
                    type="text"
                    value={profileData.hotelPhone || ""}
                    onChange={(e) => setProfileData({ ...profileData, hotelPhone: e.target.value })}
                    className="w-full bg-[#061C1C]/80 border border-white/15 text-white font-medium rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-400 focus:ring-1 focus:ring-saffron-400/50 transition-all shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-2">Hotel State</label>
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
                    className="w-full bg-[#061C1C]/80 border border-white/15 text-white font-medium rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-400 focus:ring-1 focus:ring-saffron-400/50 transition-all shadow-inner"
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
                    <label className="block text-sm font-semibold text-slate-200">Hotel City</label>
                    <button
                      type="button"
                      onClick={() => setCustomHotelCity(!customHotelCity)}
                      className="text-[11px] font-bold text-saffron-400 hover:text-saffron-300 underline cursor-pointer"
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
                      className="w-full bg-[#061C1C]/80 border border-white/15 text-white font-medium rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-400 focus:ring-1 focus:ring-saffron-400/50 transition-all shadow-inner"
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
                      className="w-full bg-[#061C1C]/80 border border-white/15 text-white font-medium rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-400 focus:ring-1 focus:ring-saffron-400/50 transition-all shadow-inner"
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
                  <label className="block text-sm font-semibold text-slate-200 mb-2">Hotel Type</label>
                  <select
                    value={profileData.hotelType || "Hotel"}
                    onChange={(e) => setProfileData({ ...profileData, hotelType: e.target.value })}
                    className="w-full bg-[#061C1C]/80 border border-white/15 text-white font-medium rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-400 focus:ring-1 focus:ring-saffron-400/50 transition-all shadow-inner"
                  >
                    <option value="Hotel">Hotel</option>
                    <option value="Resort">Resort</option>
                    <option value="Guest house">Guest house</option>
                    <option value="Restaurant only">Restaurant only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-2">Hotel Star Category</label>
                  <select
                    value={profileData.starRating || "3-Star"}
                    onChange={(e) => setProfileData({ ...profileData, starRating: e.target.value })}
                    className="w-full bg-[#061C1C]/80 border border-white/15 text-white font-medium rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-400 focus:ring-1 focus:ring-saffron-400/50 transition-all shadow-inner"
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
                  <label className="block text-sm font-semibold text-slate-200 mb-2">Hotel Pincode</label>
                  <input
                    type="text"
                    placeholder="e.g. 110001"
                    value={profileData.hotelPincode || ""}
                    onChange={(e) => setProfileData({ ...profileData, hotelPincode: e.target.value })}
                    className="w-full bg-[#061C1C]/80 border border-white/15 text-white font-medium rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-400 focus:ring-1 focus:ring-saffron-400/50 transition-all shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-2">Reception / Desk Phone</label>
                  <input
                    type="text"
                    placeholder="e.g. 011-23456789 or 9876543210"
                    value={profileData.receptionPhone || ""}
                    onChange={(e) => setProfileData({ ...profileData, receptionPhone: e.target.value })}
                    className="w-full bg-[#061C1C]/80 border border-white/15 text-white font-medium rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-400 focus:ring-1 focus:ring-saffron-400/50 transition-all shadow-inner"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-200 mb-2">Logo (Upload Brand Logo)</label>
                  <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-[#061C1C]/60 border border-white/10">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="w-full text-slate-200 text-sm file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-saffron-500 file:text-slate-950 hover:file:bg-saffron-400 cursor-pointer"
                    />
                    {profileData.hotelLogo && (
                      <div className="flex items-center gap-3 shrink-0 p-2 bg-white/5 border border-white/10 rounded-xl">
                        <img src={profileData.hotelLogo} alt="Logo Preview" className="w-12 h-12 object-contain rounded-lg bg-white/10 p-1" />
                        <div className="text-left">
                          <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Uploaded
                          </span>
                          <p className="text-[10px] text-slate-400">Applied to Invoices</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-200 mb-2">Hotel Full Address</label>
                  <textarea
                    rows="2"
                    placeholder="Street, Landmark, Area..."
                    value={profileData.hotelAddress || ""}
                    onChange={(e) => setProfileData({ ...profileData, hotelAddress: e.target.value })}
                    className="w-full bg-[#061C1C]/80 border border-white/15 text-white font-medium rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-400 focus:ring-1 focus:ring-saffron-400/50 transition-all shadow-inner"
                  />
                </div>

                {/* 1. Legal & Tax Compliance */}
                <div className="md:col-span-2 mt-6">
                  <h3 className="text-lg font-bold font-display text-saffron-400 mb-1 border-b border-saffron-500/20 pb-2 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-saffron-400" />
                    Legal & Tax Compliance
                  </h3>
                  <p className="text-xs text-slate-300">Printed on official invoices and used for tax filing compliance.</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-2">GSTIN (GST Number)</label>
                  <input
                    type="text"
                    placeholder="e.g. 07AAAAA0000A1Z5"
                    value={profileData.gstin || ""}
                    onChange={(e) => setProfileData({ ...profileData, gstin: e.target.value.toUpperCase() })}
                    className="w-full bg-[#061C1C]/80 border border-white/15 text-white font-medium rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-400 focus:ring-1 focus:ring-saffron-400/50 transition-all uppercase font-mono text-xs shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-2">FSSAI License No.</label>
                  <input
                    type="text"
                    placeholder="e.g. 10012345678901 (14 digits)"
                    value={profileData.fssaiNumber || ""}
                    onChange={(e) => setProfileData({ ...profileData, fssaiNumber: e.target.value })}
                    className="w-full bg-[#061C1C]/80 border border-white/15 text-white font-medium rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-400 focus:ring-1 focus:ring-saffron-400/50 transition-all font-mono text-xs shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-2">Business PAN Number</label>
                  <input
                    type="text"
                    placeholder="e.g. ABCDE1234F"
                    value={profileData.panNumber || ""}
                    onChange={(e) => setProfileData({ ...profileData, panNumber: e.target.value.toUpperCase() })}
                    className="w-full bg-[#061C1C]/80 border border-white/15 text-white font-medium rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-400 focus:ring-1 focus:ring-saffron-400/50 transition-all uppercase font-mono text-xs shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-2">Trade / Sarai Act License No.</label>
                  <input
                    type="text"
                    placeholder="Municipal or Police license no."
                    value={profileData.tradeLicenseNumber || ""}
                    onChange={(e) => setProfileData({ ...profileData, tradeLicenseNumber: e.target.value })}
                    className="w-full bg-[#061C1C]/80 border border-white/15 text-white font-medium rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-400 focus:ring-1 focus:ring-saffron-400/50 transition-all text-xs shadow-inner"
                  />
                </div>

                {/* 2. Timings & Invoicing Configuration */}
                <div className="md:col-span-2 mt-6">
                  <h3 className="text-lg font-bold font-display text-saffron-400 mb-1 border-b border-saffron-500/20 pb-2 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-saffron-400" />
                    Timings, Tax Rates & Invoicing Rules
                  </h3>
                  <p className="text-xs text-slate-300">Controls default booking check-in/out policies, tax slabs and invoice series.</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-2">Default Check-In Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 12:00 PM"
                    value={profileData.checkInTime || ""}
                    onChange={(e) => setProfileData({ ...profileData, checkInTime: e.target.value })}
                    className="w-full bg-[#061C1C]/80 border border-white/15 text-white font-medium rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-400 focus:ring-1 focus:ring-saffron-400/50 transition-all shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-2">Default Check-Out Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 11:00 AM"
                    value={profileData.checkOutTime || ""}
                    onChange={(e) => setProfileData({ ...profileData, checkOutTime: e.target.value })}
                    className="w-full bg-[#061C1C]/80 border border-white/15 text-white font-medium rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-400 focus:ring-1 focus:ring-saffron-400/50 transition-all shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-2">Restaurant Bill Prefix</label>
                  <input
                    type="text"
                    placeholder="e.g. REST- or BILL-"
                    value={profileData.invoicePrefixRestaurant || ""}
                    onChange={(e) => setProfileData({ ...profileData, invoicePrefixRestaurant: e.target.value })}
                    className="w-full bg-[#061C1C]/80 border border-white/15 text-white font-medium rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-400 focus:ring-1 focus:ring-saffron-400/50 transition-all font-mono text-xs shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-2">Room Bill Prefix</label>
                  <input
                    type="text"
                    placeholder="e.g. ROOM- or ST-"
                    value={profileData.invoicePrefixRoom || ""}
                    onChange={(e) => setProfileData({ ...profileData, invoicePrefixRoom: e.target.value })}
                    className="w-full bg-[#061C1C]/80 border border-white/15 text-white font-medium rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-400 focus:ring-1 focus:ring-saffron-400/50 transition-all font-mono text-xs shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-2">Food / Restaurant GST Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 5"
                    value={profileData.foodGstRate ?? 5}
                    onChange={(e) => setProfileData({ ...profileData, foodGstRate: e.target.value })}
                    className="w-full bg-[#061C1C]/80 border border-white/15 text-white font-medium rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-400 focus:ring-1 focus:ring-saffron-400/50 transition-all shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-2">Room Booking GST Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 12"
                    value={profileData.roomGstRate ?? 12}
                    onChange={(e) => setProfileData({ ...profileData, roomGstRate: e.target.value })}
                    className="w-full bg-[#061C1C]/80 border border-white/15 text-white font-medium rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-400 focus:ring-1 focus:ring-saffron-400/50 transition-all shadow-inner"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-200 mb-2">Invoice Terms & Policy (Footer Note)</label>
                  <textarea
                    rows="2"
                    placeholder="e.g. 1. Valid ID required at check-in. 2. Cancellation subject to hotel policy."
                    value={profileData.invoiceTerms || ""}
                    onChange={(e) => setProfileData({ ...profileData, invoiceTerms: e.target.value })}
                    className="w-full bg-[#061C1C]/80 border border-white/15 text-white font-medium rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-400 focus:ring-1 focus:ring-saffron-400/50 transition-all text-xs shadow-inner"
                  />
                </div>

                {/* 3. Guest Policy & Operations */}
                <div className="md:col-span-2 mt-6">
                  <h3 className="text-lg font-bold font-display text-saffron-400 mb-1 border-b border-saffron-500/20 pb-2 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-saffron-400" />
                    Guest Policy & Operations
                  </h3>
                  <p className="text-xs text-slate-300">Official check-in requirements and policies printed on GRC and receipts.</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-200 mb-2">Accepted ID Proof Policy & Guidelines</label>
                  <textarea
                    rows="2"
                    placeholder="e.g. Aadhaar Card, Passport, Driving License, or Voter ID required at check-in"
                    value={profileData.idProofPolicy || ""}
                    onChange={(e) => setProfileData({ ...profileData, idProofPolicy: e.target.value })}
                    className="w-full bg-[#061C1C]/80 border border-white/15 text-white font-medium rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-400 focus:ring-1 focus:ring-saffron-400/50 transition-all text-xs shadow-inner"
                  />
                </div>

                {/* 4. Bank & UPI Payment Details */}
                <div className="md:col-span-2 mt-6">
                  <h3 className="text-lg font-bold font-display text-saffron-400 mb-1 border-b border-saffron-500/20 pb-2 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-saffron-400" />
                    Bank & UPI Payment Details
                  </h3>
                  <p className="text-xs text-slate-300">Used for direct UPI QR code generation on guest invoices and B2B settlements.</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-2">UPI ID (For Bill QR Code)</label>
                  <input
                    type="text"
                    placeholder="e.g. hotel@okhdfcbank"
                    value={profileData.upiId || ""}
                    onChange={(e) => setProfileData({ ...profileData, upiId: e.target.value })}
                    className="w-full bg-[#061C1C]/80 border border-white/15 text-white font-medium rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-400 focus:ring-1 focus:ring-saffron-400/50 transition-all font-mono text-xs shadow-inner"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold text-slate-200">Bank IFSC Code</label>
                    <span className="text-[10px] text-saffron-400 font-mono font-bold">
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
                      className="w-full bg-[#061C1C]/80 border border-white/15 text-white font-medium rounded-xl pl-4 pr-24 py-3 focus:outline-none focus:border-saffron-400 focus:ring-1 focus:ring-saffron-400/50 transition-all uppercase font-mono text-xs tracking-wider shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={() => fetchIfscDetails(profileData.bankIfscCode)}
                      disabled={ifscLoading || (profileData.bankIfscCode || "").length !== 11}
                      className="absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-lg bg-saffron-500/20 hover:bg-saffron-500/30 text-saffron-300 border border-saffron-400/40 text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm"
                    >
                      {ifscLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-saffron-400" />
                          <span>Checking...</span>
                        </>
                      ) : ifscDetails ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-bold">Verified</span>
                        </>
                      ) : (
                        <span>Verify</span>
                      )}
                    </button>
                  </div>
                  {ifscError && (
                    <p className="text-xs text-rose-400 mt-1.5 flex items-center gap-1 font-semibold">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {ifscError}
                    </p>
                  )}
                  {!ifscError && !ifscDetails && (
                    <p className="text-[11px] text-slate-300 mt-1">
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
                  <label className="block text-sm font-semibold text-slate-200 mb-2">Bank Name</label>
                  <input
                    type="text"
                    placeholder="e.g. HDFC Bank, SBI, ICICI"
                    value={profileData.bankName || ""}
                    onChange={(e) => setProfileData({ ...profileData, bankName: e.target.value })}
                    className="w-full bg-[#061C1C]/80 border border-white/15 text-white font-medium rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-400 focus:ring-1 focus:ring-saffron-400/50 transition-all shadow-inner"
                  />
                  {ifscDetails && (
                    <p className="text-[10px] text-emerald-400 font-semibold mt-1">Auto-filled: {ifscDetails.BANK}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-2">Account Holder Name</label>
                  <input
                    type="text"
                    placeholder="Beneficiary name as in bank"
                    value={profileData.bankAccountName || ""}
                    onChange={(e) => setProfileData({ ...profileData, bankAccountName: e.target.value })}
                    className="w-full bg-[#061C1C]/80 border border-white/15 text-white font-medium rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-400 focus:ring-1 focus:ring-saffron-400/50 transition-all shadow-inner"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-200 mb-2">Bank Account Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 50100234567890"
                    value={profileData.bankAccountNumber || ""}
                    onChange={(e) => setProfileData({ ...profileData, bankAccountNumber: e.target.value })}
                    className="w-full bg-[#061C1C]/80 border border-white/15 text-white font-medium rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-400 focus:ring-1 focus:ring-saffron-400/50 transition-all font-mono text-xs shadow-inner"
                  />
                </div>

                {/* 5. Digital, Location & Social Presence */}
                <div className="md:col-span-2 mt-6">
                  <h3 className="text-lg font-bold font-display text-saffron-400 mb-1 border-b border-saffron-500/20 pb-2 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-saffron-400" />
                    Digital, Location & Social Presence
                  </h3>
                  <p className="text-xs text-slate-300">Used for WhatsApp booking confirmations, guest navigation links and social branding.</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-2">Website URL</label>
                  <input
                    type="url"
                    placeholder="https://www.yourhotel.com"
                    value={profileData.websiteUrl || ""}
                    onChange={(e) => setProfileData({ ...profileData, websiteUrl: e.target.value })}
                    className="w-full bg-[#061C1C]/80 border border-white/15 text-white font-medium rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-400 focus:ring-1 focus:ring-saffron-400/50 transition-all shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-2">Google Maps Location Link</label>
                  <input
                    type="url"
                    placeholder="https://maps.app.goo.gl/..."
                    value={profileData.googleMapsUrl || ""}
                    onChange={(e) => setProfileData({ ...profileData, googleMapsUrl: e.target.value })}
                    className="w-full bg-[#061C1C]/80 border border-white/15 text-white font-medium rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-400 focus:ring-1 focus:ring-saffron-400/50 transition-all shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-2">Instagram Handle / URL</label>
                  <input
                    type="text"
                    placeholder="e.g. @yourhotel or https://instagram.com/yourhotel"
                    value={profileData.instagramUrl || ""}
                    onChange={(e) => setProfileData({ ...profileData, instagramUrl: e.target.value })}
                    className="w-full bg-[#061C1C]/80 border border-white/15 text-white font-medium rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-400 focus:ring-1 focus:ring-saffron-400/50 transition-all shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-2">Facebook Page URL</label>
                  <input
                    type="url"
                    placeholder="https://facebook.com/yourhotel"
                    value={profileData.facebookUrl || ""}
                    onChange={(e) => setProfileData({ ...profileData, facebookUrl: e.target.value })}
                    className="w-full bg-[#061C1C]/80 border border-white/15 text-white font-medium rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-400 focus:ring-1 focus:ring-saffron-400/50 transition-all shadow-inner"
                  />
                </div>
                
                <div className="md:col-span-2 mt-8 pt-4 border-t border-white/10 flex justify-center">
                  <MagneticButton
                    type="submit"
                    className="w-full sm:w-auto min-w-[260px] bg-gradient-to-r from-saffron-400 to-saffron-500 hover:from-saffron-300 hover:to-saffron-400 text-slate-950 font-extrabold py-3.5 px-10 rounded-xl transition-all active:scale-95 shadow-xl shadow-saffron-500/25 text-sm cursor-pointer flex items-center justify-center gap-2.5 mx-auto"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Save All Hotel Details
                  </MagneticButton>
                </div>
              </form>
            </div>
          )}

          {activeTab === "security" && (
            <div className="animate-fade-in max-w-md">
              <h2 className="text-xl font-bold font-display text-saffron-400 mb-6 flex items-center gap-2 border-b border-saffron-500/20 pb-3">
                <Shield className="w-5 h-5 text-saffron-400" />
                Change Password
              </h2>
              <form onSubmit={handlePasswordUpdate} className="flex flex-col gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-2">Current Password</label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-[#061C1C]/80 border border-white/15 text-white font-medium rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-400 focus:ring-1 focus:ring-saffron-400/50 transition-all shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-2">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-[#061C1C]/80 border border-white/15 text-white font-medium rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-400 focus:ring-1 focus:ring-saffron-400/50 transition-all shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-[#061C1C]/80 border border-white/15 text-white font-medium rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-400 focus:ring-1 focus:ring-saffron-400/50 transition-all shadow-inner"
                  />
                </div>
                <div className="pt-2 flex justify-center">
                  <MagneticButton
                    type="submit"
                    className="w-full sm:w-auto min-w-[220px] bg-gradient-to-r from-saffron-400 to-saffron-500 hover:from-saffron-300 hover:to-saffron-400 text-slate-950 font-extrabold py-3.5 px-8 rounded-xl transition-all active:scale-95 shadow-xl shadow-saffron-500/25 text-sm cursor-pointer flex items-center justify-center gap-2 mx-auto"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Update Password
                  </MagneticButton>
                </div>
              </form>
            </div>
          )}

          {activeTab === "staff" && (
            <div className="animate-fade-in max-w-2xl">
              <h2 className="text-xl font-bold font-display text-saffron-400 mb-2 flex items-center gap-2 border-b border-saffron-500/20 pb-3">
                <LayoutGrid className="w-5 h-5 text-saffron-400" />
                Staff Panel Modules
              </h2>
              <p className="text-sm text-slate-300 mb-6 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                Toggle which operational modules are accessible to staff members.
              </p>

              <div className="flex flex-col gap-3.5 mb-8">
                {[
                  { key: "restaurant", label: "Restaurant Billing" },
                  { key: "roomBooking", label: "Room Booking" },
                  { key: "kot", label: "KOT Billing" },
                  { key: "advanceBooking", label: "Advance Bookings" },
                  { key: "grc", label: "Print GRC" },
                ].map((mod) => (
                  <div key={mod.key} className="flex items-center justify-between p-4 rounded-xl bg-[#061C1C]/80 border border-white/10 hover:border-white/20 transition-all shadow-inner">
                    <span className="font-semibold text-slate-100 text-sm tracking-wide">{mod.label}</span>
                    <button
                      type="button"
                      onClick={() => handlePermissionToggle(mod.key)}
                      className={`relative w-14 h-7 rounded-full transition-colors cursor-pointer ${
                        permissions[mod.key] ? "bg-gradient-to-r from-saffron-500 to-amber-500 shadow-[0_0_12px_rgba(246,180,69,0.4)]" : "bg-slate-800 border border-white/10"
                      }`}
                    >
                      <div
                        className={`absolute top-1 flex items-center justify-center w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                          permissions[mod.key] ? "translate-x-8" : "translate-x-1"
                        }`}
                      >
                        {permissions[mod.key] ? (
                          <Check className="w-3 h-3 text-slate-950 font-bold" />
                        ) : (
                          <X className="w-3 h-3 text-slate-600" />
                        )}
                      </div>
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex justify-center">
                <MagneticButton
                  type="button"
                  onClick={savePermissions}
                  className="w-full sm:w-auto min-w-[240px] bg-gradient-to-r from-saffron-400 to-saffron-500 hover:from-saffron-300 hover:to-saffron-400 text-slate-950 font-extrabold py-3.5 px-10 rounded-xl transition-all active:scale-95 shadow-xl shadow-saffron-500/25 text-sm cursor-pointer flex items-center justify-center gap-2 mx-auto"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Save Preferences
                </MagneticButton>
              </div>
            </div>
          )}

          {activeTab === "lookups" && (
            <div className="animate-fade-in h-full">
              <AdminLookups isComponent={true} />
            </div>
          )}

          {activeTab === "anti-theft" && (
            <div className="animate-fade-in max-w-4xl space-y-6">
              {/* Header Card */}
              <div className="anti-theft-hero p-6 rounded-2xl bg-gradient-to-br from-rose-950/40 via-slate-900/60 to-slate-950 border border-rose-500/30 shadow-xl backdrop-blur-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="anti-theft-icon-box p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 shrink-0">
                      <ShieldAlert className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="anti-theft-badge inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-rose-500/20 border border-rose-500/40 text-rose-300 mb-2">
                        🛡️ 100% Free Anti-Theft Engine
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                        Cash Theft & KOT Fraud Prevention
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                        Cashier customer se cash lene ke baad system me printed KOT ya item cancel/void na kar sake. Cancellation attempt par turant Owner ke phone par <b>Instant Telegram Alert & OTP</b> trigger hota hai.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Settings */}
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                {/* Configuration Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Toggle: Anti-Theft OTP Required */}
                  <div className="anti-theft-card p-5 rounded-xl bg-slate-900/50 border border-white/10 shadow-sm flex flex-col justify-between hover:border-white/20 transition-all">
                    <div>
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <span className="text-sm font-bold text-white flex items-center gap-2">
                          <KeyRound className="w-4 h-4 text-amber-400" />
                          Anti-Theft Manager OTP
                        </span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={profileData.antiTheftOtpRequired}
                            onChange={(e) =>
                              setProfileData((prev) => ({
                                ...prev,
                                antiTheftOtpRequired: e.target.checked,
                              }))
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                        </label>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Agar koi cashier printed KOT ya item cancel karega, toh system bina Owner OTP ke cancel nahi karne dega.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2 text-[11px] font-semibold text-emerald-400">
                      <Check className="w-3.5 h-3.5" /> Recommended: Always Keep Enabled
                    </div>
                  </div>

                  {/* Toggle: Telegram Alerts Enabled */}
                  <div className="anti-theft-card p-5 rounded-xl bg-slate-900/50 border border-white/10 shadow-sm flex flex-col justify-between hover:border-white/20 transition-all">
                    <div>
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <span className="text-sm font-bold text-white flex items-center gap-2">
                          <BellRing className="w-4 h-4 text-sky-400" />
                          Telegram Push Alerts
                        </span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={profileData.telegramAlertsEnabled}
                            onChange={(e) =>
                              setProfileData((prev) => ({
                                ...prev,
                                telegramAlertsEnabled: e.target.checked,
                              }))
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                        </label>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        100% Free Forever. Owner ke mobile screen par turant notification sound ke saath alert aur 4-digit OTP aayega.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2 text-[11px] font-semibold text-sky-400">
                      <Smartphone className="w-3.5 h-3.5" /> Instant Delivery (&lt; 1 Second)
                    </div>
                  </div>
                </div>

                {/* Telegram Chat ID & Test Alert */}
                <div className="anti-theft-card p-6 rounded-2xl bg-slate-900/50 border border-white/10 shadow-sm space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-sky-400" />
                        Owner's Telegram Settings
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Alerts receive karne ke liye apne Telegram account ko connect karein.
                      </p>
                    </div>

                    <a
                      href="https://t.me/e_annapurna_alerts_bot"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-sky-500/15 border border-sky-400/30 text-sky-300 hover:bg-sky-500/25 text-xs font-semibold transition-all"
                    >
                      <span>Default Bot: <b>@e_annapurna_alerts_bot</b></span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* Step 1 Highlight Notice */}
                  <div className="anti-theft-notice p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-200">
                    <span className="text-base">⚠️</span>
                    <div className="leading-relaxed">
                      <b>Important (Bad Request: chat not found se bachne ke liye):</b> Telegram bots tab tak message nahi bhej sakte jab tak aap khud Telegram me jakar bot open karke <b>"START"</b> na dabayein.
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                    <div className="md:col-span-6 space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                        <span>Owner Telegram Chat ID <span className="text-rose-500">*</span></span>
                        <span className="text-[11px] text-slate-400 font-normal">Numeric ID (e.g. 582194821)</span>
                      </label>
                      <input
                        type="text"
                        value={profileData.telegramChatId}
                        onChange={(e) =>
                          setProfileData((prev) => ({
                            ...prev,
                            telegramChatId: e.target.value.trim(),
                          }))
                        }
                        placeholder="e.g. 582194821 (Not username)"
                        className="anti-theft-input w-full bg-slate-950/80 border border-white/15 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 font-mono"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <button
                        type="button"
                        onClick={handleDetectChatId}
                        disabled={detectingChatId}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-400/30 font-bold py-3 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 text-xs disabled:opacity-40 active:scale-95 shadow-sm"
                        title="Telegram bot par 'START' dabane ke baad yahan click karein, Chat ID apne aap aa jayegi"
                      >
                        {detectingChatId ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" />
                            Detecting...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                            Auto-Detect Chat ID
                          </>
                        )}
                      </button>
                    </div>

                    <div className="md:col-span-3">
                      <button
                        type="button"
                        onClick={handleTestTelegram}
                        disabled={testingTelegram || !profileData.telegramChatId}
                        className="w-full bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-400/40 font-bold py-3 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed text-xs active:scale-95 shadow-sm"
                      >
                        {testingTelegram ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            Send Test Alert
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <MagneticButton
                      type="submit"
                      className="bg-gradient-to-r from-saffron-400 to-saffron-500 hover:from-saffron-300 hover:to-saffron-400 text-slate-950 font-black py-3 px-8 rounded-xl transition-all active:scale-95 shadow-lg shadow-saffron-500/20 text-xs sm:text-sm cursor-pointer flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Save Anti-Theft Preferences
                    </MagneticButton>
                  </div>
                </div>
              </form>

              {/* Step-by-Step Telegram Guide & Preview Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 30-Second Setup Guide */}
                <div className="anti-theft-card p-5 rounded-2xl bg-slate-900/50 border border-white/10 shadow-sm space-y-3">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    📱 30 Seconds Setup Guide (Owner ke liye)
                  </h4>
                  <ol className="text-xs text-slate-300 space-y-3 list-decimal list-inside leading-relaxed">
                    <li>
                      Apne phone me Telegram open karein aur bot link open karein:{" "}
                      <a
                        href="https://t.me/e_annapurna_alerts_bot"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-sky-400 hover:underline font-bold"
                      >
                        @e_annapurna_alerts_bot <ExternalLink className="w-3 h-3" />
                      </a>
                    </li>
                    <li>
                      Niche <b>START</b> button par click karein.
                    </li>
                    <li>
                      Upar diye gaye <b>"Auto-Detect Chat ID"</b> button par click karein. Aapka Chat ID apne aap aa jayegi!
                    </li>
                    <li>
                      <b>Save Anti-Theft Preferences</b> dabayein, phir <b>Send Test Alert</b> se verify karein!
                    </li>
                  </ol>
                  <p className="text-[11px] text-slate-400 pt-2 border-t border-white/5">
                    💡 <i>Alternative:</i> Aap <a href="https://t.me/userinfobot" target="_blank" rel="noreferrer" className="text-sky-400 underline font-semibold">@userinfobot</a> se bhi numeric ID dekh kar paste kar sakte hain. Lekin <b>bot ko START karna zaroori hai</b>.
                  </p>
                </div>

                {/* Mock Telegram Notification Preview */}
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 shadow-xl space-y-3" style={{ backgroundColor: '#0b141a', color: '#e9edef' }}>
                  <div className="flex items-center justify-between text-xs border-b border-white/10 pb-2">
                    <span className="font-bold text-sky-400 flex items-center gap-1.5">
                      💬 Telegram Alert Preview
                    </span>
                    <span className="text-[10px] text-slate-400">Just Now</span>
                  </div>
                  <div className="p-3.5 rounded-xl border border-white/10 text-xs space-y-1.5 font-sans" style={{ backgroundColor: '#111b21', color: '#e9edef' }}>
                    <div className="text-rose-400 font-black">
                      🚨 ANTI-THEFT ALERT: KOT CANCEL ATTEMPT
                    </div>
                    <div className="text-[11px] space-y-0.5" style={{ color: '#d1d7db' }}>
                      <div>🏨 <b>Hotel:</b> {profileData.hotelName || "Grand Portico"}</div>
                      <div>📍 <b>Location:</b> Table 3</div>
                      <div>👤 <b>Cashier:</b> Ajay Kumar</div>
                      <div>💰 <b>Total Amount:</b> ₹280</div>
                      <div>🍲 <b>Item:</b> Paneer Tikka (1x)</div>
                    </div>
                    <div className="p-2 mt-2 rounded-lg bg-rose-500/20 border border-rose-500/40 text-center font-mono font-bold text-rose-300 tracking-wider">
                      OTP: 5821
                    </div>
                    <div className="text-[10px] text-center italic" style={{ color: '#8696a0' }}>
                      Valid for 5 minutes. Verify before sharing.
                    </div>
                  </div>
                </div>
              </div>

              {/* Bot Creation Guide Accordion (NEW) */}
              <div className="anti-theft-card p-5 rounded-2xl bg-slate-900/40 border border-white/10 shadow-sm space-y-3 transition-all">
                <button
                  type="button"
                  onClick={() => setShowBotInstructions((prev) => !prev)}
                  className="w-full flex items-center justify-between text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-300">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2 group-hover:text-sky-400 transition-colors">
                        🤖 Apna Khud Ka Telegram Bot Kaise Banayein? (1 Minute Free Guide)
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          100% Free
                        </span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Agar aapko apne hotel ke naam ka personal Telegram bot banana hai, toh yeh aasan 5 steps follow karein.
                      </p>
                    </div>
                  </div>
                  <div className="p-1 rounded-lg bg-white/5 text-slate-400">
                    {showBotInstructions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {showBotInstructions && (
                  <div className="pt-3 border-t border-white/10 space-y-4 animate-fade-in text-xs text-slate-300">
                    <div className="anti-theft-ready-box p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-200 flex items-center justify-between">
                      <div>
                        💡 <b>Already Ready Bot:</b> Aapko naya bot banane ki zaroorat nahi hai agar aap default bot use karna chahein! Default bot <b>@e_annapurna_alerts_bot</b> pehle se configure hai.
                      </div>
                      <a
                        href="https://t.me/e_annapurna_alerts_bot"
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 ml-3 px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold text-[11px] inline-flex items-center gap-1 shadow-sm"
                      >
                        Open Bot <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {/* Step 1 */}
                      <div className="anti-theft-subbox p-3.5 rounded-xl bg-slate-950/60 border border-white/10 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-300 flex items-center justify-center text-xs font-bold">1</span>
                            BotFather Open Karein
                          </span>
                          <a
                            href="https://t.me/BotFather"
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] font-bold text-sky-400 hover:underline inline-flex items-center gap-0.5"
                          >
                            @BotFather <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Telegram app me search karein <b>@BotFather</b> (verified blue tick bot) aur chat open karke <b>START</b> dabayein.
                        </p>
                      </div>

                      {/* Step 2 */}
                      <div className="anti-theft-subbox p-3.5 rounded-xl bg-slate-950/60 border border-white/10 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-300 flex items-center justify-center text-xs font-bold">2</span>
                            Command Bhejein: /newbot
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyCommand("/newbot")}
                            className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-slate-300 hover:bg-white/20 inline-flex items-center gap-1 cursor-pointer"
                          >
                            {copiedBotCommand ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            {copiedBotCommand ? "Copied" : "Copy"}
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          BotFather ko message me <code>/newbot</code> type karke bhejein.
                        </p>
                      </div>

                      {/* Step 3 */}
                      <div className="anti-theft-subbox p-3.5 rounded-xl bg-slate-950/60 border border-white/10 space-y-1.5">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-300 flex items-center justify-center text-xs font-bold">3</span>
                          Bot Name & Username Dein
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          • <b>Name:</b> Apne hotel ka naam (jaise: <i>Grand Palace Alerts</i>)<br/>
                          • <b>Username:</b> Ek unique username jo <code>_bot</code> se end ho (jaise: <i>grand_palace_kot_bot</i>).
                        </p>
                      </div>

                      {/* Step 4 */}
                      <div className="anti-theft-subbox p-3.5 rounded-xl bg-slate-950/60 border border-white/10 space-y-1.5">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-300 flex items-center justify-center text-xs font-bold">4</span>
                          Token Copy & Paste Karein
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          BotFather aapko ek <b>HTTP API Token</b> dega (jaise <code>8963016276:AA...</code>).<br/>
                          Use project ke <b><code>backend/.env</code></b> file me daalein:<br/>
                          <code className="text-sky-400 font-bold">TELEGRAM_BOT_TOKEN=your_token</code>
                        </p>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                      <span>
                        <b>Done!</b> Ab apne banaye naye bot ko Telegram me open karke <b>START</b> dabayein aur upar <b>"Auto-Detect Chat ID"</b> click karein!
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
