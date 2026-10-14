import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Check,
  Zap,
  Shield,
  Crown,
  Receipt,
  Printer,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Lock,
  Unlock,
  Sparkles,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import api from "../../api";
import Swal from "sweetalert2";
import PremiumSubscriptionInvoice from "../../components/PremiumSubscriptionInvoice";

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      return resolve(true);
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const DEFAULT_PLANS = {
  Starter: {
    id: "Starter",
    name: "Starter",
    monthlyPrice: 1499,
    yearlyPrice: 14990,
    description: "10 rooms tak ke chhote hotel/guest house ke liye",
    features: [
      "Room booking & Management",
      "Billing & GST Invoice generation",
      "Up to 2 Staff accounts",
      "Reports & Daily revenue stats",
      "Standard Email Support",
    ],
  },
  Growth: {
    id: "Growth",
    name: "Growth",
    monthlyPrice: 3999,
    yearlyPrice: 39990,
    popular: true,
    description: "Restaurant & Bar wale hotels ke liye complete setup",
    features: [
      "Starter ka sab kuch",
      "Restaurant POS & KOT billing",
      "Kitchen Display (KDS) & QR Ordering",
      "Up to 10 Staff accounts",
      "Inventory & Stock tracking",
      "Priority WhatsApp & Phone Support",
    ],
  },
  Enterprise: {
    id: "Enterprise",
    name: "Enterprise",
    monthlyPrice: 9999,
    yearlyPrice: 99990,
    description: "Chain aur bade luxury resorts ke liye",
    features: [
      "Growth ka sab kuch",
      "Multi-property management",
      "Unlimited Staff accounts",
      "Advanced Analytics & Custom Excel Exports",
      "24/7 Dedicated Account Manager",
      "Custom Branding & API access",
    ],
  },
};

export default function AdminBilling() {
  const [currentUser, setCurrentUser] = useState(null);
  const [subscription, setSubscription] = useState({
    plan: "none",
    isActive: false,
    validUntil: null,
    daysRemaining: 0,
    isExpired: false,
  });
  const [plans, setPlans] = useState(DEFAULT_PLANS);
  const [razorpayKeyId, setRazorpayKeyId] = useState("");
  const [billingCycle, setBillingCycle] = useState("monthly"); // "monthly" | "yearly"
  const [invoices, setInvoices] = useState([]);
  const [printingInvoice, setPrintingInvoice] = useState(null);
  const [processingPlan, setProcessingPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch initial details
  const fetchSubscriptionData = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      if (user) {
        setCurrentUser(user);
      }

      // Fetch Plans & Key
      try {
        const plansRes = await api.get("/api/payment/plans");
        if (plansRes.data?.plans) {
          setPlans(plansRes.data.plans);
        }
        if (plansRes.data?.keyId) {
          setRazorpayKeyId(plansRes.data.keyId);
        }
      } catch (err) {
        console.error("Failed to fetch plans:", err);
      }

      // Fetch Subscription Status
      try {
        const statusRes = await api.get("/api/payment/status");
        if (statusRes.data?.subscription) {
          setSubscription(statusRes.data.subscription);
        } else if (user) {
          setSubscription({
            plan: user.subscriptionPlan || "none",
            isActive: user.subscriptionStatus === "active",
            validUntil: user.subscriptionExpiresAt || null,
            daysRemaining: 0,
            isExpired: false,
          });
        }
      } catch (err) {
        console.error("Failed to fetch subscription status:", err);
      }

      // Fetch Invoices
      try {
        const invoicesRes = await api.get("/api/payment/my-invoices");
        setInvoices(invoicesRes.data || []);
      } catch (err) {
        console.error("Failed to fetch invoices:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionData();
    loadRazorpayScript();
  }, []);

  const handleSubscribe = async (planKey) => {
    const isScriptLoaded = await loadRazorpayScript();
    if (!isScriptLoaded) {
      Swal.fire({
        icon: "error",
        title: "Gateway Error",
        text: "Razorpay SDK could not be loaded. Please check your internet connection.",
      });
      return;
    }

    setProcessingPlan(planKey);

    try {
      // 1. Create Razorpay order on backend
      const { data } = await api.post("/api/payment/razorpay/create-order", {
        plan: planKey,
        billingCycle,
      });

      if (!data.success) {
        throw new Error(data.message || "Failed to create payment order");
      }

      // 2. Open Razorpay Checkout modal
      const options = {
        key: data.keyId || razorpayKeyId,
        amount: data.amount,
        currency: data.currency || "INR",
        name: data.hotelName || currentUser?.hotelName || "StayFlow PMS",
        description: `${planKey} Plan Subscription (${billingCycle === "yearly" ? "1 Year" : "30 Days"})`,
        image: "/favicon.svg",
        order_id: data.orderId,
        prefill: {
          name: data.customerName || currentUser?.name || "Hotel Admin",
          email: data.customerEmail || currentUser?.email || "",
          contact: data.customerPhone || currentUser?.mobile || "",
        },
        notes: {
          plan: planKey,
          billingCycle,
        },
        theme: {
          color: "#0A2F2F", // StayFlow Emerald theme
        },
        handler: async function (response) {
          try {
            Swal.fire({
              title: "Verifying Payment...",
              text: "Please wait while we securely confirm your transaction with Razorpay.",
              allowOutsideClick: false,
              didOpen: () => {
                Swal.showLoading();
              },
            });

            // 3. Verify payment on backend
            const verifyRes = await api.post("/api/payment/razorpay/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan: planKey,
              billingCycle,
            });

            if (verifyRes.data.success) {
              // Update local storage user
              const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
              const updatedUser = {
                ...storedUser,
                subscriptionPlan: verifyRes.data.subscription.plan,
                subscriptionStatus: "active",
                subscriptionExpiresAt: verifyRes.data.subscription.validUntil,
              };
              localStorage.setItem("user", JSON.stringify(updatedUser));
              setCurrentUser(updatedUser);
              setSubscription(verifyRes.data.subscription);
              window.dispatchEvent(new Event("user-updated"));

              // Refresh invoices
              try {
                const invRes = await api.get("/api/payment/my-invoices");
                setInvoices(invRes.data || []);
              } catch (_) {}

              Swal.fire({
                icon: "success",
                title: "Subscription Activated!",
                html: `
                  <div class="text-left text-sm space-y-2 mt-2">
                    <p class="font-bold text-emerald-600 text-base">🎉 Payment completed successfully!</p>
                    <p><b>Plan:</b> ${planKey} (${billingCycle})</p>
                    <p><b>Valid Until:</b> ${new Date(verifyRes.data.subscription.validUntil).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
                    <div class="p-3 bg-emerald-50 rounded-lg text-emerald-800 border border-emerald-200 mt-3">
                      <b>Staff Logins Unlocked:</b> Your hotel staff can now sign in and operate their counters without restriction.
                    </div>
                  </div>
                `,
                confirmButtonText: "Awesome!",
                confirmButtonColor: "#F2A33A",
              });
            } else {
              throw new Error(verifyRes.data.message || "Verification failed");
            }
          } catch (verifyErr) {
            console.error("Verification error:", verifyErr);
            Swal.fire({
              icon: "error",
              title: "Verification Failed",
              text: verifyErr.response?.data?.message || verifyErr.message || "Failed to verify transaction.",
              confirmButtonColor: "#EF4444",
            });
          }
        },
        modal: {
          ondismiss: function () {
            setProcessingPlan(null);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (failResponse) {
        console.error("Payment failed:", failResponse);
        Swal.fire({
          icon: "error",
          title: "Payment Cancelled or Failed",
          text: failResponse.error?.description || "Transaction was not completed.",
          confirmButtonColor: "#EF4444",
        });
        setProcessingPlan(null);
      });

      rzp.open();
    } catch (err) {
      console.error("Order creation error:", err);
      Swal.fire({
        icon: "error",
        title: "Payment Error",
        text: err.response?.data?.message || err.message || "Could not initiate payment.",
        confirmButtonColor: "#EF4444",
      });
    } finally {
      setProcessingPlan(null);
    }
  };

  const isCurrentPlanActive = (planName) => {
    return subscription.isActive && subscription.plan?.toLowerCase() === planName.toLowerCase();
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto min-h-full">
      {/* Page Title & Status Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-100 flex items-center gap-3">
            <span className="p-2.5 bg-saffron-500/10 text-saffron-500 rounded-2xl border border-saffron-500/20">
              <Crown className="w-7 h-7" />
            </span>
            Hotel Subscription & Billing
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Activate or upgrade your StayFlow plan to enable staff logins, billing counters, and POS operations.
          </p>
        </div>

        {/* Refresh Status Button */}
        <button
          onClick={fetchSubscriptionData}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Status
        </button>
      </div>

      {/* Subscription Status Alert Banner */}
      {!subscription.isActive || subscription.plan === "none" ? (
        <div className="mb-8 p-5 rounded-2xl bg-gradient-to-r from-red-950/40 via-red-900/20 to-slate-900 border border-red-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-500/20 text-red-400 rounded-xl shrink-0 mt-0.5 border border-red-500/30">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/30">
                  Subscription Inactive (None)
                </span>
                <span className="text-xs text-red-300/80 font-medium">Staff Login Locked</span>
              </div>
              <h2 className="text-lg font-bold text-slate-100 mt-1">
                Your hotel does not have an active subscription yet.
              </h2>
              <p className="text-slate-300 text-sm mt-0.5 max-w-2xl">
                As Hotel Admin, you can configure your profile, manage dishes, and rooms. However,{" "}
                <b className="text-red-300">your staff members cannot log in</b> until you choose and activate a subscription plan below.
              </p>
            </div>
          </div>
          <a
            href="#plans-section"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-saffron-500 to-amber-500 hover:from-saffron-400 hover:to-amber-400 text-slate-950 font-bold text-sm shrink-0 shadow-lg shadow-saffron-500/20 transition-transform active:scale-95 flex items-center gap-2"
          >
            Choose a Plan <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      ) : (
        <div className="mb-8 p-5 rounded-2xl bg-gradient-to-r from-lagoon-950/60 via-lagoon-900/40 to-slate-900 border border-emerald-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl shrink-0 mt-0.5 border border-emerald-500/30">
              <Unlock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {subscription.plan} Plan Active
                </span>
                <span className="text-xs text-emerald-300/90 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Staff Logins Enabled
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-100 mt-1">
                Your hotel subscription is active and operational.
              </h2>
              <p className="text-slate-300 text-sm mt-0.5 flex items-center gap-2 flex-wrap">
                <span className="text-saffron-400 font-semibold flex items-center gap-1">
                  <Calendar className="w-4 h-4" /> Valid until:{" "}
                  {subscription.validUntil
                    ? new Date(subscription.validUntil).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "Active"}
                </span>
                <span className="text-slate-400">({subscription.daysRemaining} days remaining)</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs text-emerald-400 font-semibold bg-emerald-950/50 px-3 py-1.5 rounded-lg border border-emerald-800/40">
              ● All Counters Active
            </span>
          </div>
        </div>
      )}

      {/* Billing Cycle Toggle */}
      <div id="plans-section" className="flex flex-col items-center justify-center my-8">
        <div className="inline-flex items-center p-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-inner">
          <button
            type="button"
            onClick={() => setBillingCycle("monthly")}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              billingCycle === "monthly"
                ? "bg-gradient-to-r from-saffron-500 to-amber-500 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Monthly Billing
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle("yearly")}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              billingCycle === "yearly"
                ? "bg-gradient-to-r from-saffron-500 to-amber-500 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Yearly Billing
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Save 17%
            </span>
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Payments powered by Razorpay. UPI, NetBanking, Debit/Credit Cards & Wallets supported.
        </p>
      </div>

      {/* Plans Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
        {Object.entries(plans).map(([key, plan]) => {
          const isActive = isCurrentPlanActive(key);
          const isPopular = plan.popular;
          const price = billingCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
          const isProcessing = processingPlan === key;

          return (
            <div
              key={key}
              className={`rounded-3xl p-7 relative flex flex-col transition-all duration-300 ${
                isActive
                  ? "bg-gradient-to-b from-lagoon-900/40 to-slate-900 border-2 border-emerald-500 shadow-xl shadow-emerald-500/10"
                  : isPopular
                  ? "bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-saffron-500/60 shadow-xl shadow-saffron-500/10 transform lg:-translate-y-2"
                  : "bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/80"
              }`}
            >
              {/* Badges */}
              {isPopular && !isActive && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-saffron-500 to-amber-500 text-slate-950 font-bold px-4 py-1 rounded-full text-xs flex items-center gap-1 shadow-lg shadow-saffron-500/30 tracking-wide uppercase">
                  <Crown className="w-3.5 h-3.5" /> Most Popular
                </div>
              )}

              {isActive && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 font-bold px-4 py-1 rounded-full text-xs flex items-center gap-1 shadow-lg shadow-emerald-500/30 tracking-wide uppercase">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Your Current Plan
                </div>
              )}

              {/* Card Header */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-display font-bold text-slate-100 flex items-center gap-2">
                    {plan.name}
                    {key === "Growth" && <Zap className="w-5 h-5 text-saffron-500" />}
                    {key === "Enterprise" && <Sparkles className="w-5 h-5 text-amber-400" />}
                  </h3>
                </div>
                <p className="text-xs text-slate-400 min-h-[32px]">{plan.description}</p>

                {/* Price Display */}
                <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-baseline gap-2">
                  <span className="text-4xl font-black text-white font-display">₹{price.toLocaleString("en-IN")}</span>
                  <span className="text-xs text-slate-400 font-medium">
                    / {billingCycle === "yearly" ? "year" : "month"}
                  </span>
                </div>
                {billingCycle === "yearly" && (
                  <p className="text-[11px] text-emerald-400 font-medium mt-1">
                    Equivalent to ₹{Math.round(price / 12).toLocaleString("en-IN")}/mo (Billed annually)
                  </p>
                )}
              </div>

              {/* Features List */}
              <div className="flex-1 my-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Included Features:</p>
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-slate-300 text-sm">
                      <Check className="w-4 h-4 text-saffron-500 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <button
                disabled={isProcessing}
                onClick={() => handleSubscribe(key)}
                className={`mt-6 w-full py-3.5 px-6 rounded-2xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg ${
                  isActive
                    ? "bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30"
                    : isPopular
                    ? "bg-gradient-to-r from-saffron-500 via-amber-500 to-yellow-500 text-slate-950 hover:brightness-110 active:scale-95 shadow-saffron-500/20"
                    : "bg-slate-800 hover:bg-slate-700 text-white active:scale-95 border border-slate-700"
                }`}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Processing...
                  </>
                ) : isActive ? (
                  <>
                    <RefreshCw className="w-4 h-4" /> Renew / Extend Plan
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" /> Subscribe with Razorpay
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Trust & Guarantee Box */}
      <div className="mt-12 max-w-4xl mx-auto p-6 rounded-2xl bg-slate-900/40 border border-slate-800/60 text-center flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-left">
          <div className="p-3 bg-saffron-500/10 text-saffron-500 rounded-xl">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-200">100% Secure Razorpay Checkout</h4>
            <p className="text-xs text-slate-400">
              256-bit encrypted transactions. Instant activation for all billing desks and staff logins.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-semibold text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
            UPI / GPay / PhonePe
          </span>
          <span className="text-xs font-semibold text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
            Cards & NetBanking
          </span>
        </div>
      </div>

      {/* Invoices / Billing History Section */}
      <div className="mt-12 max-w-6xl mx-auto bg-slate-900/60 p-6 sm:p-8 rounded-3xl border border-slate-800/80 shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-200 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-saffron-500" /> Subscription Invoices & Billing History
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Download and print GST tax invoices for your past subscription payments.
            </p>
          </div>
          <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
            {invoices.length} Transactions
          </span>
        </div>

        {invoices.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl">
            <Receipt className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm font-medium">No past payment transactions found.</p>
            <p className="text-slate-500 text-xs mt-1">
              When you purchase a subscription via Razorpay, your tax invoice will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="pb-3 px-4 font-semibold">Date</th>
                  <th className="pb-3 px-4 font-semibold">Order / Txn ID</th>
                  <th className="pb-3 px-4 font-semibold">Payment ID</th>
                  <th className="pb-3 px-4 font-semibold">Plan</th>
                  <th className="pb-3 px-4 font-semibold">Cycle</th>
                  <th className="pb-3 px-4 font-semibold">Amount</th>
                  <th className="pb-3 px-4 font-semibold">Status</th>
                  <th className="pb-3 px-4 font-semibold text-right">Tax Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-4 text-xs text-slate-300">
                      {new Date(inv.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-400 font-mono">
                      {inv.txnid || inv.orderId || "N/A"}
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-400 font-mono">
                      {inv.paymentId || "—"}
                    </td>
                    <td className="py-4 px-4 text-xs font-semibold text-slate-200">
                      <span className="capitalize">{inv.planName}</span>
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-400 capitalize">
                      {inv.billingCycle || "monthly"}
                    </td>
                    <td className="py-4 px-4 text-xs text-white font-bold">
                      ₹{Number(inv.amount || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="py-4 px-4 text-xs">
                      {inv.status === "success" ? (
                        <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md text-[11px] font-semibold">
                          Success
                        </span>
                      ) : (
                        <span className="text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-md text-[11px] font-semibold">
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      {inv.status === "success" && (
                        <button
                          onClick={() => setPrintingInvoice(inv)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-saffron-500/10 text-saffron-400 border border-saffron-500/20 hover:bg-saffron-500/20 transition-all"
                        >
                          <Printer className="w-3.5 h-3.5" /> Print Invoice
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Printable Invoice Modal */}
      {printingInvoice && (
        <PremiumSubscriptionInvoice
          invoice={printingInvoice}
          onClose={() => setPrintingInvoice(null)}
        />
      )}
    </div>
  );
}
