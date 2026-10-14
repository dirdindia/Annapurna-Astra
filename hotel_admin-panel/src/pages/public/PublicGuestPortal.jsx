import React, { useState, useEffect, useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import {
  Utensils,
  ShoppingBag,
  CalendarDays,
  Search,
  Plus,
  Minus,
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  AlertCircle,
  CreditCard,
  Banknote,
  ChevronRight,
  X,
  Sparkles,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { publicAPI } from "../../api";
import Swal from "sweetalert2";

// Helper to dynamically load Razorpay checkout script
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function PublicGuestPortal() {
  const { hotelId } = useParams();
  const [searchParams] = useSearchParams();
  const preselectedTable = searchParams.get("table") || "";

  // Data states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hotel, setHotel] = useState(null);
  const [dishes, setDishes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tables, setTables] = useState([]);

  // Active Tab: 'dine_in' | 'parcel' | 'table_booking'
  const [activeTab, setActiveTab] = useState("dine_in");

  // Selection & Form states
  const [selectedTable, setSelectedTable] = useState(preselectedTable);
  const [customerName, setCustomerName] = useState(() => localStorage.getItem("guest_name") || "");
  const [customerMobile, setCustomerMobile] = useState(() => localStorage.getItem("guest_mobile") || "");
  const [customerEmail, setCustomerEmail] = useState("");
  const [orderNotes, setOrderNotes] = useState("");

  // Menu filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Cart state: { [dishId]: { dish, quantity } }
  const [cart, setCart] = useState({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [paymentMode, setPaymentMode] = useState("Counter"); // 'Counter' | 'Online'
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // Active placed order tracking state
  const [activeOrderId, setActiveOrderId] = useState(() => localStorage.getItem("active_qr_order_id") || null);
  const [trackedOrder, setTrackedOrder] = useState(null);
  const [pollingInterval, setPollingInterval] = useState(null);

  // Mobile tracking lookup state
  const [trackMobile, setTrackMobile] = useState(() => localStorage.getItem("guest_mobile") || "");
  const [searchingTrack, setSearchingTrack] = useState(false);

  // Table booking form state
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [guestsCount, setGuestsCount] = useState(2);
  const [bookingNotes, setBookingNotes] = useState("");
  const [submittingBooking, setSubmittingBooking] = useState(false);

  const handleTrackByMobile = async (e) => {
    if (e) e.preventDefault();
    if (!trackMobile.trim() || trackMobile.trim().length < 10) {
      Swal.fire({
        icon: "warning",
        title: "Enter Mobile Number",
        text: "Please enter your 10-digit mobile number to search your active order.",
      });
      return;
    }

    setSearchingTrack(true);
    try {
      const res = await publicAPI.getOrderByMobile(hotelId, trackMobile.trim());
      if (res.data.success && res.data.data) {
        const order = res.data.data;
        setActiveOrderId(order._id);
        localStorage.setItem("active_qr_order_id", order._id);
        setTrackedOrder(order);
        if (order.tableNo) setSelectedTable(order.tableNo);
        if (order.customerName) setCustomerName(order.customerName);
        if (order.customerMobile) setCustomerMobile(order.customerMobile);

        Swal.fire({
          icon: "success",
          title: "Order Found!",
          text: `Found active order #${order.orderDisplayId} for ${order.orderType === "Table" ? `Table ${order.tableNo}` : "Takeaway"}.`,
          timer: 2500,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          icon: "info",
          title: "No Active Order",
          text: "No active running order found for this number.",
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "info",
        title: "No Active Order",
        text: err.response?.data?.message || "No active order found for this mobile number. You can place a fresh order from the menu!",
      });
    } finally {
      setSearchingTrack(false);
    }
  };

  // Fetch hotel info & menu
  useEffect(() => {
    if (!hotelId) {
      setError("Invalid Hotel Link. Hotel ID is missing.");
      setLoading(false);
      return;
    }

    const fetchMenu = async () => {
      try {
        setLoading(true);
        const res = await publicAPI.getMenu(hotelId);
        if (res.data.success) {
          setHotel(res.data.data.hotel);
          setDishes(res.data.data.dishes || []);
          setCategories(res.data.data.categories || []);
          setTables(res.data.data.tables || []);
          if (preselectedTable) setSelectedTable(preselectedTable);
        } else {
          setError(res.data.message || "Could not load menu");
        }
      } catch (err) {
        console.error(err);
        setError("Could not connect to restaurant. Please check the QR code or link.");
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, [hotelId, preselectedTable]);

  // Order Tracking Status Fetch (Manual / On Load)
  const refreshOrderStatus = async () => {
    if (!activeOrderId) return;
    try {
      const res = await publicAPI.getOrderStatus(activeOrderId);
      if (res.data.success) {
        setTrackedOrder(res.data.data);
      }
    } catch (err) {
      console.error("Status error:", err);
    }
  };

  // Real-time SSE Connection for Customer: Instant status update when admin approves/rejects
  useEffect(() => {
    if (!activeOrderId) {
      setTrackedOrder(null);
      return;
    }

    refreshOrderStatus();

    const streamUrl = `http://localhost:5000/api/public/order-stream/${activeOrderId}`;
    const eventSource = new EventSource(streamUrl);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "order_approved") {
          setTrackedOrder((prev) => ({
            ...prev,
            approvalStatus: "approved",
            kdsStatus: data.kdsStatus || "preparing",
          }));

          Swal.fire({
            icon: "success",
            title: "Order Approved! 👨‍🍳",
            text: "The restaurant has verified your order. Kitchen is preparing your meal!",
            timer: 4000,
            confirmButtonColor: "#f59e0b",
          });
        } else if (data.type === "order_rejected") {
          setTrackedOrder((prev) => ({
            ...prev,
            approvalStatus: "rejected",
            rejectionReason: data.rejectionReason || "Order declined",
          }));

          Swal.fire({
            icon: "error",
            title: "Order Declined",
            text: data.rejectionReason || "Restaurant was unable to accept your order.",
            confirmButtonColor: "#ef4444",
          });
        } else if (data.type === "kds_status_update") {
          setTrackedOrder((prev) => ({
            ...prev,
            kdsStatus: data.kdsStatus,
          }));
        } else if (data.type === "addon_approved") {
          setTrackedOrder(data.order);
          Swal.fire({
            icon: "success",
            title: "Add-on Approved! 👨‍🍳",
            text: "Your additional items have been accepted and sent to the kitchen!",
            timer: 3500,
            confirmButtonColor: "#f59e0b",
          });
        } else if (data.type === "addon_rejected") {
          setTrackedOrder(data.order);
          Swal.fire({
            icon: "info",
            title: "Add-on Update",
            text: data.message || "Additional items request could not be accepted.",
            confirmButtonColor: "#ef4444",
          });
        }
      } catch (err) {
        console.error("Customer SSE parse error:", err);
      }
    };

    eventSource.onerror = () => {
      // EventSource auto-reconnects
    };

    return () => {
      eventSource.close();
    };
  }, [activeOrderId]);

  // Save guest details in localStorage for seamless repeat orders
  useEffect(() => {
    if (customerName) localStorage.setItem("guest_name", customerName);
  }, [customerName]);

  useEffect(() => {
    if (customerMobile) localStorage.setItem("guest_mobile", customerMobile);
  }, [customerMobile]);

  // Cart operations
  const addToCart = (dish) => {
    setCart((prev) => {
      const current = prev[dish._id];
      const newQty = current ? current.quantity + 1 : 1;
      return {
        ...prev,
        [dish._id]: { dish, quantity: newQty },
      };
    });
  };

  const removeFromCart = (dishId) => {
    setCart((prev) => {
      const current = prev[dishId];
      if (!current) return prev;
      if (current.quantity <= 1) {
        const copy = { ...prev };
        delete copy[dishId];
        return copy;
      }
      return {
        ...prev,
        [dishId]: { ...current, quantity: current.quantity - 1 },
      };
    });
  };

  const totalItemsCount = useMemo(() => {
    return Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const subTotal = useMemo(() => {
    return Object.values(cart).reduce((sum, item) => sum + item.dish.price * item.quantity, 0);
  }, [cart]);

  const gstRate = hotel?.foodGstRate || 5;
  const taxAmount = useMemo(() => {
    return Math.round((subTotal * (gstRate / 100)) * 100) / 100;
  }, [subTotal, gstRate]);

  const grandTotal = useMemo(() => {
    return Math.round((subTotal + taxAmount) * 100) / 100;
  }, [subTotal, taxAmount]);

  // Filtered dishes
  const filteredDishes = useMemo(() => {
    return dishes.filter((d) => {
      const matchesCategory = selectedCategory === "All" || d.category === selectedCategory;
      const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [dishes, selectedCategory, searchQuery]);

  // Handle Order Submission
  const handlePlaceOrder = async () => {
    if (totalItemsCount === 0) {
      Swal.fire({ icon: "warning", title: "Cart is empty", text: "Please add some delicious items first!" });
      return;
    }

    if (activeTab === "dine_in" && !selectedTable) {
      Swal.fire({
        icon: "warning",
        title: "Select Your Table",
        text: "Please select your Table number so our staff knows where to serve!",
      });
      return;
    }

    if (!customerName.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Enter Your Name",
        text: "Please enter your name for the order receipt.",
      });
      return;
    }

    if (!customerMobile.trim() || customerMobile.trim().length < 10) {
      Swal.fire({
        icon: "warning",
        title: "Mobile Number Required",
        text: "Please enter a valid 10-digit mobile number so you can track your order & add more items anytime!",
      });
      return;
    }

    const itemsPayload = Object.values(cart).map((item) => ({
      dishId: item.dish._id,
      name: item.dish.name,
      price: item.dish.price,
      quantity: item.quantity,
      category: item.dish.category,
    }));

    // If Online Payment (Razorpay)
    if (paymentMode === "Online") {
      setSubmittingOrder(true);
      try {
        const loaded = await loadRazorpayScript();
        if (!loaded) {
          Swal.fire({ icon: "error", title: "Payment Gateway Error", text: "Could not load Razorpay gateway." });
          setSubmittingOrder(false);
          return;
        }

        // 1. Create Razorpay order on server
        const rzpRes = await publicAPI.createPaymentOrder({
          amount: grandTotal,
          hotelId: hotel._id,
          orderType: activeTab === "parcel" ? "Parcel" : "Table",
        });

        if (!rzpRes.data.success) {
          throw new Error(rzpRes.data.message || "Failed to initialize payment");
        }

        const { razorpayOrderId, amount, currency, key } = rzpRes.data.data;

        // 2. Open Razorpay modal
        const options = {
          key,
          amount,
          currency,
          name: hotel?.name || "StayFlow Dining",
          description: `Order Payment for ${activeTab === "parcel" ? "Parcel" : `Table ${selectedTable}`}`,
          image: hotel?.logo || "/favicon.svg",
          order_id: razorpayOrderId,
          prefill: {
            name: customerName,
            contact: customerMobile || "",
            email: customerEmail || "",
          },
          theme: {
            color: "#f59e0b",
          },
          handler: async function (response) {
            try {
              // 3. Verify signature
              const verifyRes = await publicAPI.verifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });

              if (verifyRes.data.success) {
                // 4. Place order with Paid status
                await submitFinalOrder({
                  paymentMode: "Online (Razorpay)",
                  paymentDetails: {
                    razorpayOrderId: response.razorpay_order_id,
                    razorpayPaymentId: response.razorpay_payment_id,
                    razorpaySignature: response.razorpay_signature,
                    paidAt: new Date(),
                  },
                });
              }
            } catch (vErr) {
              console.error(vErr);
              Swal.fire({ icon: "error", title: "Verification Failed", text: "Payment verification failed." });
            }
          },
          modal: {
            ondismiss: function () {
              setSubmittingOrder(false);
            },
          },
        };

        const razorpayInstance = new window.Razorpay(options);
        razorpayInstance.open();
      } catch (err) {
        console.error(err);
        Swal.fire({ icon: "error", title: "Payment Error", text: err.message || "Something went wrong" });
        setSubmittingOrder(false);
      }
      return;
    }

    // Cash/Counter Order
    submitFinalOrder({
      paymentMode: "Counter (Cash/Card)",
    });
  };

  const submitFinalOrder = async (extraPayload = {}) => {
    setSubmittingOrder(true);
    try {
      const itemsPayload = Object.values(cart).map((item) => ({
        dishId: item.dish._id,
        name: item.dish.name,
        price: item.dish.price,
        quantity: item.quantity,
        category: item.dish.category,
      }));

      const payload = {
        hotelId: hotel._id,
        orderType: activeTab === "parcel" ? "Parcel" : "Table",
        tableNo: activeTab === "dine_in" ? selectedTable : "",
        customerName: customerName.trim(),
        customerMobile: customerMobile.trim(),
        customerEmail: customerEmail.trim(),
        items: itemsPayload,
        subTotal,
        tax: taxAmount,
        grandTotal,
        ...extraPayload,
      };

      const res = await publicAPI.placeOrder(payload);

      if (res.data.success) {
        const orderData = res.data.data;
        setActiveOrderId(orderData._id);
        localStorage.setItem("active_qr_order_id", orderData._id);
        setTrackedOrder(orderData);
        setCart({});
        setIsCartOpen(false);

        Swal.fire({
          icon: "success",
          title: "Order Placed!",
          text: "Your order has been sent to the hotel for verification.",
          confirmButtonColor: "#f59e0b",
        });
      } else {
        Swal.fire({ icon: "error", title: "Order Failed", text: res.data.message || "Could not place order." });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Order Failed",
        text: err.response?.data?.message || "Server error while placing order.",
      });
    } finally {
      setSubmittingOrder(false);
    }
  };

  // Handle Table Reservation
  const handleTableBooking = async (e) => {
    e.preventDefault();
    if (!customerName || !customerMobile || !bookingDate || !bookingTime) {
      Swal.fire({ icon: "warning", title: "Missing Details", text: "Please fill in all required fields." });
      return;
    }

    setSubmittingBooking(true);
    try {
      const payload = {
        hotelId: hotel._id,
        customerName,
        customerMobile,
        customerEmail,
        bookingDate,
        bookingTime,
        guestsCount: Number(guestsCount) || 2,
        specialRequests: bookingNotes,
        tableNo: selectedTable || "",
      };

      const res = await publicAPI.bookTable(payload);
      if (res.data.success) {
        Swal.fire({
          icon: "success",
          title: "Reservation Requested! 🎉",
          text: "The hotel will confirm your table shortly. We look forward to hosting you!",
          confirmButtonColor: "#f59e0b",
        });
        setBookingNotes("");
      } else {
        Swal.fire({ icon: "error", title: "Booking Failed", text: res.data.message });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "Booking Failed", text: "Could not request table reservation." });
    } finally {
      setSubmittingBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 p-4">
        <div className="w-14 h-14 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mb-4"></div>
        <p className="text-base font-semibold text-amber-400">Loading Restaurant Menu...</p>
        <p className="text-xs text-slate-400 mt-1">Please wait while we fetch the latest dishes</p>
      </div>
    );
  }

  if (error || !hotel) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-100 mb-2">Menu Unavailable</h2>
        <p className="text-sm text-slate-400 max-w-sm mb-6">{error || "Could not find restaurant."}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-28 font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Hotel Header / Hero Card */}
      <header className="relative bg-gradient-to-b from-teal-950/80 via-slate-900 to-slate-950 border-b border-teal-800/30 px-4 pt-6 pb-5 shadow-lg">
        <div className="max-w-xl mx-auto flex items-start gap-4">
          {Boolean(hotel.logo && hotel.logo.trim()) ? (
            <img
              src={hotel.logo}
              alt={hotel.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-500/30 shadow-md bg-slate-900 shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-black text-2xl shrink-0 shadow-md">
              {hotel.name?.charAt(0) || "S"}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">
                {hotel.type || "Restaurant"}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Open for Dining
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white truncate mt-1 tracking-tight">
              {hotel.name}
            </h1>

            <p className="text-xs text-slate-400 flex items-center gap-1 mt-1 truncate">
              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{hotel.address || `${hotel.city}, ${hotel.state || ""}`}</span>
            </p>
          </div>
        </div>

        {/* Live Order Tracker Banner (If customer has an active order) */}
        {trackedOrder && (
          <div className="max-w-xl mx-auto mt-4">
            <div
              className={`p-3.5 rounded-2xl border backdrop-blur-md transition-all shadow-md ${
                trackedOrder.approvalStatus === "pending"
                  ? "bg-amber-500/10 border-amber-500/40 text-amber-300"
                  : trackedOrder.approvalStatus === "approved"
                  ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                  : "bg-rose-500/10 border-rose-500/40 text-rose-300"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  {trackedOrder.approvalStatus === "pending" && (
                    <Clock className="w-5 h-5 animate-spin text-amber-400 shrink-0" />
                  )}
                  {trackedOrder.approvalStatus === "approved" && (
                    <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                  )}
                  {trackedOrder.approvalStatus === "rejected" && (
                    <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  )}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm tracking-wide">
                        Order #{trackedOrder.orderDisplayId}
                      </span>
                      <span className="text-[11px] px-1.5 py-0.2 rounded bg-black/40 border border-white/10">
                        {trackedOrder.orderType === "Table" ? `Table ${trackedOrder.tableNo || ""}` : "Takeaway"}
                      </span>
                      {trackedOrder.pendingAddons?.some((a) => a.status === "pending") && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-300 text-[10px] font-black animate-pulse">
                          + Add-on items pending approval
                        </span>
                      )}
                    </div>
                    <p className="text-xs mt-0.5 opacity-90">
                      {trackedOrder.approvalStatus === "pending" && "Waiting for restaurant to verify & accept..."}
                      {trackedOrder.approvalStatus === "approved" &&
                        `Order Accepted! Kitchen status: ${trackedOrder.kdsStatus?.toUpperCase() || "PREPARING"}`}
                      {trackedOrder.approvalStatus === "rejected" &&
                        `Declined: ${trackedOrder.rejectionReason || "Items unavailable"}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {trackedOrder.approvalStatus === "approved" && (
                    <button
                      onClick={() => {
                        setActiveTab("dine_in");
                        if (trackedOrder.tableNo) setSelectedTable(trackedOrder.tableNo);
                        Swal.fire({
                          icon: "info",
                          title: "Add More Items",
                          text: `Select any item from the menu below to add to your Table ${trackedOrder.tableNo} order!`,
                          timer: 2500,
                          showConfirmButton: false,
                        });
                      }}
                      className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1 shadow-sm transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Items</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      localStorage.removeItem("active_qr_order_id");
                      setActiveOrderId(null);
                      setTrackedOrder(null);
                    }}
                    title="Dismiss tracker"
                    className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Controls (Dine-In, Parcel, Book Table, Track Order) */}
        <div className="max-w-xl mx-auto mt-4">
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-900/90 border border-teal-800/40 rounded-2xl backdrop-blur-md">
            <button
              onClick={() => setActiveTab("dine_in")}
              className={`flex items-center justify-center gap-1 py-2.5 px-1 rounded-xl text-xs font-bold transition-all ${
                activeTab === "dine_in"
                  ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <Utensils className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Dine-In</span>
            </button>

            <button
              onClick={() => setActiveTab("parcel")}
              className={`flex items-center justify-center gap-1 py-2.5 px-1 rounded-xl text-xs font-bold transition-all ${
                activeTab === "parcel"
                  ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Takeaway</span>
            </button>

            <button
              onClick={() => setActiveTab("table_booking")}
              className={`flex items-center justify-center gap-1 py-2.5 px-1 rounded-xl text-xs font-bold transition-all ${
                activeTab === "table_booking"
                  ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Book Table</span>
            </button>

            <button
              onClick={() => setActiveTab("track_order")}
              className={`flex items-center justify-center gap-1 py-2.5 px-1 rounded-xl text-xs font-bold transition-all ${
                activeTab === "track_order"
                  ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <Search className="w-3.5 h-3.5 shrink-0 text-amber-400" />
              <span className="truncate">Track Order</span>
            </button>
          </div>
        </div>

        {/* Table Selector (Only for Dine-in tab) */}
        {activeTab === "dine_in" && (
          <div className="max-w-xl mx-auto mt-3 p-3 bg-teal-950/40 border border-teal-800/40 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span className="text-slate-300 font-medium">Your Table:</span>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                className="bg-slate-900 border border-amber-500/40 rounded-xl px-3 py-1.5 text-xs font-bold text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              >
                <option value="">-- Choose Table --</option>
                {tables.map((tbl) => (
                  <option key={tbl._id} value={tbl.tableNo}>
                    Table {tbl.tableNo} ({tbl.capacity || 2} Seater)
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="max-w-xl mx-auto px-4 mt-4">
        {/* VIEW 1 & 2: DINE-IN OR PARCEL (MENU BROWSING) */}
        {activeTab === "dine_in" || activeTab === "parcel" ? (
          <div>
            {/* Search Bar & Category Chips */}
            <div className="sticky top-2 z-20 bg-slate-950/90 backdrop-blur-md pt-1 pb-3 flex flex-col gap-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search dishes, drinks, thalis..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Categories horizontally scrollable */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                <button
                  onClick={() => setSelectedCategory("All")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCategory === "All"
                      ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                      : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                  }`}
                >
                  All Items ({dishes.length})
                </button>

                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                        : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Dish Cards List */}
            <div className="flex flex-col gap-3 mt-1">
              {filteredDishes.length === 0 ? (
                <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-slate-800/60 my-6">
                  <Utensils className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-300">No dishes found</p>
                  <p className="text-xs text-slate-500 mt-1">Try searching for something else or pick another category.</p>
                </div>
              ) : (
                filteredDishes.map((dish) => {
                  const qtyInCart = cart[dish._id]?.quantity || 0;

                  return (
                    <div
                      key={dish._id}
                      className="p-3.5 bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 rounded-2xl flex items-center justify-between gap-3 transition-all"
                    >
                      {/* Dish Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {/* Veg/Non-veg Dot Indicator */}
                          <span
                            className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0 ${
                              dish.name.toLowerCase().includes("chicken") ||
                              dish.name.toLowerCase().includes("mutton") ||
                              dish.name.toLowerCase().includes("egg") ||
                              dish.name.toLowerCase().includes("fish")
                                ? "border-red-500"
                                : "border-emerald-500"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                dish.name.toLowerCase().includes("chicken") ||
                                dish.name.toLowerCase().includes("mutton") ||
                                dish.name.toLowerCase().includes("egg") ||
                                dish.name.toLowerCase().includes("fish")
                                  ? "bg-red-500"
                                  : "bg-emerald-500"
                              }`}
                            ></span>
                          </span>

                          <h3 className="font-bold text-sm text-slate-100 truncate">{dish.name}</h3>
                        </div>

                        <p className="text-xs text-slate-400 mt-0.5">{dish.category || "General"}</p>

                        <p className="text-sm font-extrabold text-amber-400 mt-1.5">₹{dish.price}</p>
                      </div>

                      {/* Image (if available) & Quantity Controls */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {Boolean(dish.image && dish.image.trim()) && (
                          <img
                            src={dish.image}
                            alt={dish.name}
                            className="w-16 h-16 rounded-xl object-cover border border-slate-700 shadow-sm"
                          />
                        )}

                        {qtyInCart > 0 ? (
                          <div className="flex items-center bg-amber-500 text-slate-950 rounded-xl px-2 py-1 font-bold shadow-md shadow-amber-500/20">
                            <button
                              onClick={() => removeFromCart(dish._id)}
                              className="p-1 hover:opacity-80 active:scale-95"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="px-2 text-xs font-black">{qtyInCart}</span>
                            <button
                              onClick={() => addToCart(dish)}
                              className="p-1 hover:opacity-80 active:scale-95"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(dish)}
                            className="flex items-center gap-1 bg-slate-800 hover:bg-amber-500 text-slate-200 hover:text-slate-950 border border-slate-700 hover:border-amber-500 rounded-xl px-3 py-1.5 text-xs font-bold transition-all active:scale-95"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : activeTab === "table_booking" ? (
          /* VIEW 3: TABLE BOOKING FORM */
          <div className="bg-slate-900/70 border border-teal-800/30 rounded-3xl p-5 shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <CalendarDays className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-bold text-white">Reserve a Dining Table</h2>
            </div>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              Planning lunch or dinner at {hotel.name}? Reserve your table in advance to avoid waiting.
            </p>

            <form onSubmit={handleTableBooking} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-semibold mb-1 block">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-semibold mb-1 block">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit mobile"
                    value={customerMobile}
                    onChange={(e) => setCustomerMobile(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-semibold mb-1 block">Date *</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split("T")[0]}
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-semibold mb-1 block">Time Slot *</label>
                  <input
                    type="time"
                    required
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-semibold mb-1 block">Guests *</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={guestsCount}
                    onChange={(e) => setGuestsCount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold mb-1 block">Special Requests (Optional)</label>
                <textarea
                  rows="2"
                  placeholder="Birthday decoration, quiet corner, baby chair..."
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={submittingBooking}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-amber-500/20 hover:opacity-95 active:scale-98 transition-all disabled:opacity-50 mt-2"
              >
                {submittingBooking ? "Submitting Reservation..." : "Confirm Table Reservation Request"}
              </button>
            </form>
          </div>
        ) : (
          /* VIEW 4: TRACK ORDER BY MOBILE */
          <div className="bg-slate-900/60 border border-teal-800/40 rounded-3xl p-5 backdrop-blur-md space-y-5">
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <Search className="w-5 h-5 text-amber-400" />
                Track Your Active Order
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Enter your 10-digit mobile number used during ordering to check live preparation status, bill details, or add more items to your table.
              </p>
            </div>

            <form onSubmit={handleTrackByMobile} className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-slate-300 font-semibold mb-1 block">Your Mobile Number *</label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    required
                    placeholder="Enter 10-digit mobile"
                    value={trackMobile}
                    onChange={(e) => setTrackMobile(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="submit"
                    disabled={searchingTrack}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xs hover:opacity-90 active:scale-98 transition-all shrink-0 flex items-center gap-1.5"
                  >
                    {searchingTrack ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Search className="w-3.5 h-3.5" />
                    )}
                    <span>{searchingTrack ? "Searching..." : "Track Order"}</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Display Tracked Order Details if Found */}
            {trackedOrder && (
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div>
                    <span className="text-xs font-black text-white">Order #{trackedOrder.orderDisplayId}</span>
                    <span className="text-[10px] ml-2 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                      {trackedOrder.orderType === "Table" ? `Table ${trackedOrder.tableNo}` : "Takeaway"}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${
                      trackedOrder.approvalStatus === "approved"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : trackedOrder.approvalStatus === "pending"
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-rose-500/20 text-rose-400"
                    }`}
                  >
                    {trackedOrder.approvalStatus === "approved"
                      ? `Active (${trackedOrder.kdsStatus || "Preparing"})`
                      : trackedOrder.approvalStatus}
                  </span>
                </div>

                {/* Items Summary */}
                <div className="space-y-1.5 max-h-48 overflow-y-auto text-xs pr-1">
                  {trackedOrder.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-slate-300">
                      <span>
                        <span className="font-bold text-amber-400">{item.quantity}x</span> {item.name}
                      </span>
                      <span className="text-slate-400 font-mono">₹{item.price * item.quantity}</span>
                    </div>
                  ))}

                  {/* Pending Addons */}
                  {trackedOrder.pendingAddons?.filter((a) => a.status === "pending").map((addon, aIdx) => (
                    <div key={aIdx} className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300">
                      <div className="font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3 animate-spin" /> Additional Items Pending Approval:
                      </div>
                      {addon.items?.map((adItem, i) => (
                        <div key={i} className="flex justify-between text-slate-300 ml-2 mt-0.5">
                          <span>{adItem.quantity}x {adItem.name}</span>
                          <span>₹{adItem.price * adItem.quantity}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-800 pt-2.5 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Total Bill Amount:</span>
                  <span className="text-sm font-black text-amber-400">₹{trackedOrder.grandTotal}</span>
                </div>

                {/* Action button: Order more items */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("dine_in");
                    if (trackedOrder.tableNo) setSelectedTable(trackedOrder.tableNo);
                    Swal.fire({
                      icon: "info",
                      title: "Add More Items",
                      text: `Select any item from the menu to add to your Table ${trackedOrder.tableNo} order!`,
                      timer: 2000,
                      showConfirmButton: false,
                    });
                  }}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 hover:opacity-90 active:scale-98 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Order More Food for This Table</span>
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating Cart Bottom Pill Bar */}
      {totalItemsCount > 0 && !isCartOpen && (
        <div className="fixed bottom-4 left-0 right-0 z-30 px-4">
          <div className="max-w-xl mx-auto">
            <button
              onClick={() => setIsCartOpen(true)}
              className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 shadow-2xl shadow-amber-500/30 flex items-center justify-between font-black transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-full bg-slate-950 text-amber-400 flex items-center justify-center text-xs font-black">
                  {totalItemsCount}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider">
                  {activeTab === "parcel" ? "Takeaway Order" : `Table ${selectedTable || "(Select)"}`}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-black">₹{grandTotal}</span>
                <span className="text-xs px-2 py-1 bg-slate-950/20 rounded-lg flex items-center gap-1 font-bold">
                  View Cart <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Cart Drawer / Bottom Sheet Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end">
          <div
            className="w-full max-w-xl mx-auto bg-slate-900 border-t border-teal-800/40 rounded-t-3xl max-h-[90vh] flex flex-col shadow-2xl animate-fade-in"
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-white text-base">Your Order Summary</h3>
                <p className="text-xs text-amber-400 font-semibold mt-0.5">
                  {activeTab === "parcel" ? "Takeaway / Parcel" : `Dining at Table ${selectedTable || "Unassigned"}`}
                </p>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-4">
              {/* Items List */}
              <div className="flex flex-col gap-2.5">
                {Object.values(cart).map((item) => (
                  <div
                    key={item.dish._id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs"
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="font-bold text-slate-200 truncate">{item.dish.name}</p>
                      <p className="text-slate-400 mt-0.5">₹{item.dish.price} each</p>
                    </div>

                    <div className="flex items-center bg-slate-800 rounded-lg px-2 py-1 font-bold text-white">
                      <button
                        onClick={() => removeFromCart(item.dish._id)}
                        className="p-1 hover:text-amber-400"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 font-black">{item.quantity}</span>
                      <button
                        onClick={() => addToCart(item.dish)}
                        className="p-1 hover:text-amber-400"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <span className="font-black text-amber-400 pl-3 w-16 text-right">
                      ₹{item.dish.price * item.quantity}
                    </span>
                  </div>
                ))}
              </div>

              {/* Customer Info Form */}
              <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl flex flex-col gap-3">
                <p className="text-xs font-bold text-slate-300">Customer Details (for bill & KOT verification):</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    required
                    placeholder="Your Name *"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                  <input
                    type="tel"
                    required
                    placeholder="Mobile Number (Mandatory) *"
                    value={customerMobile}
                    onChange={(e) => setCustomerMobile(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {activeTab === "dine_in" && (
                  <div>
                    <label className="text-[11px] text-slate-400 font-semibold mb-1 block">Confirm Table:</label>
                    <select
                      value={selectedTable}
                      onChange={(e) => setSelectedTable(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-400 font-bold focus:outline-none focus:border-amber-500"
                    >
                      <option value="">-- Select Table --</option>
                      {tables.map((t) => (
                        <option key={t._id} value={t.tableNo}>
                          Table {t.tableNo}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Payment Mode Selector */}
              <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl">
                <p className="text-xs font-bold text-slate-300 mb-2">Choose Payment Method:</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMode("Counter")}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs ${
                      paymentMode === "Counter"
                        ? "bg-amber-500/10 border-amber-500 text-amber-400 font-bold"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    <Banknote className="w-5 h-5" />
                    <span>Pay at Counter</span>
                    <span className="text-[10px] opacity-70">Cash/UPI later</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMode("Online")}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs ${
                      paymentMode === "Online"
                        ? "bg-amber-500/10 border-amber-500 text-amber-400 font-bold"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    <CreditCard className="w-5 h-5" />
                    <span>Pay Online</span>
                    <span className="text-[10px] opacity-70">UPI / Card (Razorpay)</span>
                  </button>
                </div>
              </div>

              {/* Bill Breakdown */}
              <div className="p-3.5 bg-slate-950/40 border border-slate-800 rounded-2xl flex flex-col gap-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal</span>
                  <span>₹{subTotal}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Food GST ({gstRate}%)</span>
                  <span>₹{taxAmount}</span>
                </div>
                <div className="border-t border-slate-800 pt-1.5 mt-1 flex justify-between font-extrabold text-sm text-white">
                  <span>Grand Total</span>
                  <span className="text-amber-400">₹{grandTotal}</span>
                </div>
              </div>
            </div>

            {/* Modal Bottom CTA */}
            <div className="p-4 border-t border-slate-800 bg-slate-950">
              <button
                onClick={handlePlaceOrder}
                disabled={submittingOrder}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 font-black text-sm tracking-wide shadow-xl shadow-amber-500/20 hover:opacity-95 active:scale-98 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submittingOrder ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sending Order...</span>
                  </>
                ) : (
                  <>
                    <span>{paymentMode === "Online" ? `Pay ₹${grandTotal} & Place Order` : `Place Order (₹${grandTotal})`}</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
              <p className="text-[10px] text-center text-slate-500 mt-2">
                Order will be sent directly to the hotel kitchen upon manager confirmation.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
