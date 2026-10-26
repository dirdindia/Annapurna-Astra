import React, { useState, useEffect, useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
  Flame,
  Award,
  ShieldCheck,
  Star,
  Ticket,
  Users,
  BellRing,
  Timer,
  Check,
  AlertTriangle,
} from "lucide-react";
import { publicAPI } from "../../api";
import api from "../../api";
import Swal from "sweetalert2";
import Guest3DStarfield from "../../components/Guest3DStarfield";
import MagneticButton from "../../components/MagneticButton";

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

  // Waitlist / Live Queue State
  const [waitlistId, setWaitlistId] = useState(() => localStorage.getItem("active_waitlist_id") || null);
  const [waitlistData, setWaitlistData] = useState(null);
  const [queueSummary, setQueueSummary] = useState(null);
  const [waitlistGuests, setWaitlistGuests] = useState(2);
  const [waitlistNotes, setWaitlistNotes] = useState("");
  const [submittingWaitlist, setSubmittingWaitlist] = useState(false);
  const [refreshingWaitlist, setRefreshingWaitlist] = useState(false);

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
          const fetchedTables = res.data.data.tables || [];
          setTables(fetchedTables);

          if (preselectedTable) {
            const match = fetchedTables.find(
              (t) => String(t.tableNo).trim().toLowerCase() === String(preselectedTable).trim().toLowerCase()
            );
            const storedOrderId = localStorage.getItem("active_qr_order_id");
            if (match && (match.status === "Occupied" || match.status === "Booked") && !storedOrderId) {
              setSelectedTable("");
            } else {
              setSelectedTable(preselectedTable);
            }
          }
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

    const baseUrl = api.defaults.baseURL || "http://localhost:5000/";
    const streamUrl = new URL(`/api/public/order-stream/${activeOrderId}`, baseUrl);
    const eventSource = new EventSource(streamUrl.toString());

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

  // Available vs Occupied tables calculation
  const availableTables = useMemo(
    () => tables.filter((t) => t.status !== "Occupied" && t.status !== "Booked"),
    [tables]
  );
  const occupiedTables = useMemo(
    () => tables.filter((t) => t.status === "Occupied" || t.status === "Booked"),
    [tables]
  );
  const allTablesOccupied = tables.length > 0 && availableTables.length === 0;

  // Handle Order Submission
  const handlePlaceOrder = async () => {
    if (totalItemsCount === 0) {
      Swal.fire({ icon: "warning", title: "Cart is empty", text: "Please add some delicious items first!" });
      return;
    }

    if (activeTab === "dine_in") {
      if (!selectedTable) {
        Swal.fire({
          icon: "warning",
          title: allTablesOccupied ? "All Tables Occupied" : "Select Your Table",
          text: allTablesOccupied
            ? "All dining tables are currently occupied. Please join our live queue or select Takeaway (Parcel)!"
            : "Please select an available Table number so our staff knows where to serve!",
        });
        return;
      }

      const selectedTblObj = tables.find((t) => String(t.tableNo) === String(selectedTable));
      if (selectedTblObj && (selectedTblObj.status === "Occupied" || selectedTblObj.status === "Booked")) {
        if (!trackedOrder || String(trackedOrder.tableNo) !== String(selectedTable)) {
          Swal.fire({
            icon: "error",
            title: "Table Currently Occupied",
            text: `Table ${selectedTable} is currently busy with dining guests. Please select an available table, switch to Takeaway (Parcel), or join our Live Queue!`,
            confirmButtonText: "Join Live Queue",
            showCancelButton: true,
            cancelButtonText: "OK",
          }).then((result) => {
            if (result.isConfirmed) {
              setActiveTab("waitlist");
              setIsCartOpen(false);
            }
          });
          return;
        }
      }
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
          name: hotel?.name || "E-Annapurna Dining",
          description: `Order Payment for ${activeTab === "parcel" ? "Parcel" : `Table ${selectedTable}`}`,
          image: hotel?.logo || "/e-annapurna-logo.jpeg",
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

  // Fetch Live Queue Summary
  const fetchQueueSummary = async () => {
    if (!hotelId) return;
    try {
      const res = await publicAPI.getQueueSummary(hotelId);
      if (res.data.success) {
        setQueueSummary(res.data.data);
      }
    } catch (e) {
      console.error("Queue summary error:", e);
    }
  };

  // Fetch Token Status
  const fetchWaitlistStatus = async (idToFetch = waitlistId) => {
    if (!idToFetch) return;
    setRefreshingWaitlist(true);
    try {
      const res = await publicAPI.getWaitlistStatus(idToFetch);
      if (res.data.success) {
        const item = res.data.data.waitlist || res.data.data;
        setWaitlistData({
          ...item,
          positionAhead: res.data.data.positionAhead ?? item.positionAhead ?? 0,
          estimatedWaitMinutes: res.data.data.estimatedWaitMinutes ?? item.estimatedWaitMinutes ?? 10,
        });
      }
    } catch (e) {
      if (e.response?.status === 404) {
        localStorage.removeItem("active_waitlist_id");
        setWaitlistId(null);
        setWaitlistData(null);
      }
    } finally {
      setRefreshingWaitlist(false);
    }
  };

  // Polling for queue summary & active token status
  useEffect(() => {
    if (!hotelId) return;
    fetchQueueSummary();
    const interval = setInterval(() => {
      fetchQueueSummary();
      if (waitlistId) {
        fetchWaitlistStatus(waitlistId);
      }
    }, 12000);
    return () => clearInterval(interval);
  }, [hotelId, waitlistId]);

  // Initial fetch for waitlist status if id exists
  useEffect(() => {
    if (waitlistId) {
      fetchWaitlistStatus(waitlistId);
    }
  }, [waitlistId]);

  // Join Waiting Queue
  const handleJoinWaitlist = async (e) => {
    if (e) e.preventDefault();
    if (!customerName.trim() || !customerMobile.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Missing Information",
        text: "Please enter your Name and Mobile Number to generate a queue token.",
      });
      return;
    }

    setSubmittingWaitlist(true);
    try {
      const payload = {
        hotelId: hotel._id,
        customerName: customerName.trim(),
        customerMobile: customerMobile.trim(),
        guestsCount: Number(waitlistGuests) || 2,
        notes: waitlistNotes,
      };

      const res = await publicAPI.joinWaitlist(payload);
      if (res.data.success) {
        const item = res.data.data.waitlist || res.data.data;
        const mergedItem = {
          ...item,
          positionAhead: res.data.data.positionAhead ?? item.positionAhead ?? 0,
          estimatedWaitMinutes: res.data.data.estimatedWaitMinutes ?? item.estimatedWaitMinutes ?? 10,
        };
        setWaitlistId(item._id);
        setWaitlistData(mergedItem);
        localStorage.setItem("active_waitlist_id", item._id);
        localStorage.setItem("guest_name", customerName.trim());
        localStorage.setItem("guest_mobile", customerMobile.trim());

        Swal.fire({
          icon: "success",
          title: `Queue Token #${item.tokenNo} 🎟️`,
          html: `<p class="text-sm">Aapka number queue mein lag chuka hai!</p>
                 <p class="text-base font-bold text-amber-500 mt-2">Ahead in line: ${res.data.data.positionAhead} groups</p>
                 <p class="text-xs text-gray-400 mt-1">Est. wait: ~${res.data.data.estimatedWaitMinutes} minutes</p>
                 <p class="text-xs text-gray-500 mt-3">Jaise hi table ready hoga, yahi screen par alert aayega.</p>`,
          confirmButtonColor: "#f59e0b",
        });

        fetchQueueSummary();
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Could Not Join Queue",
        text: err.response?.data?.message || "Failed to generate queue token.",
      });
    } finally {
      setSubmittingWaitlist(false);
    }
  };

  // Cancel Queue Token
  const handleCancelWaitlist = async () => {
    if (!waitlistId) return;
    const result = await Swal.fire({
      title: "Leave Queue?",
      text: "Are you sure you want to cancel your waiting token?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Cancel Token",
      cancelButtonText: "No, Keep My Spot",
      confirmButtonColor: "#ef4444",
    });

    if (result.isConfirmed) {
      try {
        await publicAPI.cancelWaitlist(waitlistId);
        localStorage.removeItem("active_waitlist_id");
        setWaitlistId(null);
        setWaitlistData(null);
        Swal.fire({ icon: "info", title: "Cancelled", text: "Your waiting token has been cancelled." });
        fetchQueueSummary();
      } catch (e) {
        Swal.fire({ icon: "error", title: "Error", text: "Failed to cancel queue token." });
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#061C1C] flex flex-col items-center justify-center text-[#EAF3F1] p-4 relative overflow-hidden">
        <Guest3DStarfield />
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-14 h-14 border-4 border-saffron-500/20 border-t-saffron-400 rounded-full animate-spin mb-4 shadow-lg shadow-saffron-500/20"></div>
          <p className="text-base font-extrabold text-white font-display tracking-wide">Loading Restaurant Menu...</p>
          <p className="text-xs text-saffron-300 font-medium mt-1">Preparing your digital dining experience</p>
        </div>
      </div>
    );
  }

  if (error || !hotel) {
    return (
      <div className="min-h-screen bg-[#061C1C] flex flex-col items-center justify-center text-[#EAF3F1] p-6 text-center relative overflow-hidden">
        <Guest3DStarfield />
        <div className="relative z-10 max-w-sm p-8 rounded-3xl bg-[#0A2F2F]/80 backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4 shadow-md shadow-rose-500/10">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-white font-display mb-2">Menu Unavailable</h2>
          <p className="text-xs text-slate-300 max-w-sm mb-6 leading-relaxed">{error || "Could not find restaurant."}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-saffron-400 to-saffron-500 hover:from-saffron-300 hover:to-saffron-400 text-slate-950 font-black text-xs transition-all shadow-xl shadow-saffron-500/25 cursor-pointer active:scale-95"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#061C1C] text-[#EAF3F1] pb-32 font-sans selection:bg-saffron-500 selection:text-slate-950 overflow-x-hidden">
      {/* Pure 3D Animated Cosmic Starfield across entire background */}
      <Guest3DStarfield />

      {/* Top Floating Glass Navigation Bar with Hotel Branding starting from top */}
      <nav className="sticky top-0 z-40 bg-[#061C1C]/85 backdrop-blur-xl border-b border-white/10 px-4 py-3.5 shadow-2xl">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {Boolean(hotel.logo && hotel.logo.trim()) ? (
              <img
                src={hotel.logo}
                alt={hotel.name}
                className="w-10 h-10 rounded-2xl object-cover border border-saffron-500/40 bg-[#0A2F2F] p-0.5 shadow-md shadow-saffron-500/15"
              />
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-saffron-400 to-saffron-600 flex items-center justify-center text-slate-950 font-black text-base shadow-lg shadow-saffron-500/25">
                {hotel.name?.charAt(0) || "A"}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-extrabold text-white leading-tight font-display tracking-wide truncate max-w-[200px] sm:max-w-xs">
                  {hotel.name}
                </h1>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest uppercase bg-saffron-500/20 text-saffron-400 border border-saffron-500/30">
                  {hotel.type || "Restaurant"}
                </span>
              </div>
              <p className="text-[11px] text-saffron-400 font-semibold flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Open for Dining</span>
                {hotel.city && (
                  <span className="text-slate-300 font-normal">
                    • <MapPin className="w-3 h-3 inline text-saffron-400 -mt-0.5" /> {hotel.city}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {totalItemsCount > 0 && (
              <button
                onClick={() => setIsCartOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-saffron-400 to-saffron-500 text-slate-950 font-black text-xs shadow-lg shadow-saffron-500/30 cursor-pointer active:scale-95 transition-all"
              >
                <ShoppingBag className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{totalItemsCount}</span>
                <span className="opacity-80 font-mono">₹{grandTotal}</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hotel Welcome & Location Header Card */}
      <div className="relative z-10 max-w-xl mx-auto px-4 pt-4">
        <div className="p-4 rounded-3xl bg-[#0A2F2F]/60 backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col gap-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-saffron-500/15 border border-saffron-500/30 text-saffron-400 text-[10px] font-black uppercase tracking-wider mb-1">
                <Sparkles className="w-3 h-3" />
                Contactless QR Ordering
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white font-display tracking-tight">
                Welcome to {hotel.name}
              </h2>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-semibold shrink-0">
              {hotel.type || "Fine Dining"}
            </span>
          </div>

          <p className="text-xs text-slate-300 flex items-center gap-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 text-saffron-400 shrink-0" />
            <span>{hotel.address || `${hotel.city || ""}, ${hotel.state || ""}`}</span>
          </p>
        </div>
      </div>

      {/* Live Order Tracker Banner (If customer has an active order) */}
      {trackedOrder && (
        <div className="max-w-xl mx-auto px-4 mt-4">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-2xl border backdrop-blur-xl transition-all shadow-xl ${
              trackedOrder.approvalStatus === "pending"
                ? "bg-amber-500/10 border-amber-500/30 text-amber-200"
                : trackedOrder.approvalStatus === "approved"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
                : "bg-rose-500/10 border-rose-500/30 text-rose-200"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                {trackedOrder.approvalStatus === "pending" && (
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                    <Clock className="w-5 h-5 animate-spin" />
                  </div>
                )}
                {trackedOrder.approvalStatus === "approved" && (
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                )}
                {trackedOrder.approvalStatus === "rejected" && (
                  <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30">
                    <XCircle className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-sm tracking-wide text-white font-display">
                      Order #{trackedOrder.orderDisplayId}
                    </span>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 font-bold text-saffron-300">
                      {trackedOrder.orderType === "Table" ? `Table ${trackedOrder.tableNo || ""}` : "Takeaway"}
                    </span>
                    {trackedOrder.pendingAddons?.some((a) => a.status === "pending") && (
                      <span className="px-2.5 py-0.5 rounded-full bg-saffron-500/20 text-saffron-300 border border-saffron-500/30 text-[10px] font-black animate-pulse">
                        + Add-ons pending
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-1 font-medium text-slate-300">
                    {trackedOrder.approvalStatus === "pending" && "Waiting for kitchen to accept..."}
                    {trackedOrder.approvalStatus === "approved" &&
                      `Kitchen status: ${trackedOrder.kdsStatus?.toUpperCase() || "PREPARING 👨‍🍳"}`}
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
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-saffron-400 to-saffron-500 text-slate-950 font-black text-xs flex items-center gap-1 shadow-lg shadow-saffron-500/20 cursor-pointer active:scale-95 transition-all"
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
                  className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Active Waitlist Live Notification Banner */}
      {waitlistData && (waitlistData.status === "waiting" || waitlistData.status === "called") && (
        <div className="max-w-xl mx-auto px-4 mt-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-3.5 rounded-2xl border backdrop-blur-xl flex items-center justify-between shadow-xl ${
              waitlistData.status === "called"
                ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-200 animate-pulse"
                : "bg-amber-500/15 border-amber-500/40 text-amber-200"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0 pr-2">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                waitlistData.status === "called"
                  ? "bg-emerald-500/30 border-emerald-400 text-emerald-300"
                  : "bg-amber-500/20 border-amber-400 text-amber-300"
              }`}>
                <Ticket className="w-5 h-5" />
              </div>
              <div className="truncate">
                <p className="font-extrabold text-xs text-white flex items-center gap-2">
                  <span>Token #{waitlistData.tokenNo}</span>
                  {waitlistData.status === "called" ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px]">
                      TABLE READY! 🎉
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-[10px]">
                      In Queue
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-slate-300 mt-0.5 truncate">
                  {waitlistData.status === "called"
                    ? `Please proceed to Table ${waitlistData.assignedTableNo || "Host Desk"}`
                    : `${waitlistData.positionAhead || 0} groups ahead · ~${waitlistData.estimatedWaitMinutes || 12}m wait`}
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab("waitlist")}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-saffron-400 to-saffron-500 text-slate-950 font-black text-xs shrink-0 cursor-pointer shadow-md active:scale-95 transition-all"
            >
              View Ticket
            </button>
          </motion.div>
        </div>
      )}

      {/* Tab Controls (Dine-In, Parcel, Book Table, Live Queue, Track Order) */}
      <div className="max-w-xl mx-auto px-4 mt-4">
        <div className="grid grid-cols-5 gap-1 p-1.5 bg-[#0A2F2F]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl">
          <button
            onClick={() => setActiveTab("dine_in")}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2 px-1 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
              activeTab === "dine_in"
                ? "bg-gradient-to-r from-saffron-400 to-saffron-500 text-slate-950 shadow-md shadow-saffron-500/25 font-black"
                : "text-slate-300 hover:text-white hover:bg-white/5"
            }`}
          >
            <Utensils className={`w-3.5 h-3.5 shrink-0 ${activeTab === "dine_in" ? "text-slate-950 stroke-[2.5]" : "text-saffron-400"}`} />
            <span className="truncate">Dine-In</span>
          </button>

          <button
            onClick={() => setActiveTab("parcel")}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2 px-1 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
              activeTab === "parcel"
                ? "bg-gradient-to-r from-saffron-400 to-saffron-500 text-slate-950 shadow-md shadow-saffron-500/25 font-black"
                : "text-slate-300 hover:text-white hover:bg-white/5"
            }`}
          >
            <ShoppingBag className={`w-3.5 h-3.5 shrink-0 ${activeTab === "parcel" ? "text-slate-950 stroke-[2.5]" : "text-saffron-400"}`} />
            <span className="truncate">Takeaway</span>
          </button>

          <button
            onClick={() => setActiveTab("table_booking")}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2 px-1 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
              activeTab === "table_booking"
                ? "bg-gradient-to-r from-saffron-400 to-saffron-500 text-slate-950 shadow-md shadow-saffron-500/25 font-black"
                : "text-slate-300 hover:text-white hover:bg-white/5"
            }`}
          >
            <CalendarDays className={`w-3.5 h-3.5 shrink-0 ${activeTab === "table_booking" ? "text-slate-950 stroke-[2.5]" : "text-saffron-400"}`} />
            <span className="truncate">Book Table</span>
          </button>

          <button
            onClick={() => setActiveTab("waitlist")}
            className={`relative flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2 px-1 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
              activeTab === "waitlist"
                ? "bg-gradient-to-r from-saffron-400 to-saffron-500 text-slate-950 shadow-md shadow-saffron-500/25 font-black"
                : "text-slate-300 hover:text-white hover:bg-white/5"
            }`}
          >
            <Ticket className={`w-3.5 h-3.5 shrink-0 ${activeTab === "waitlist" ? "text-slate-950 stroke-[2.5]" : "text-amber-400"}`} />
            <span className="truncate">Live Queue</span>
            {waitlistData && (waitlistData.status === "waiting" || waitlistData.status === "called") && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("track_order")}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2 px-1 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
              activeTab === "track_order"
                ? "bg-gradient-to-r from-saffron-400 to-saffron-500 text-slate-950 shadow-md shadow-saffron-500/25 font-black"
                : "text-slate-300 hover:text-white hover:bg-white/5"
            }`}
          >
            <Search className={`w-3.5 h-3.5 shrink-0 ${activeTab === "track_order" ? "text-slate-950 stroke-[2.5]" : "text-saffron-400"}`} />
            <span className="truncate">Track</span>
          </button>
        </div>

        {/* Table Selector (Only for Dine-in tab) */}
        {activeTab === "dine_in" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-3 flex flex-col gap-2.5"
          >
            <div
              className={`p-3.5 backdrop-blur-xl border rounded-2xl flex items-center justify-between gap-3 shadow-lg ${
                allTablesOccupied
                  ? "bg-rose-950/70 border-rose-500/40"
                  : "bg-[#0A2F2F]/60 border-white/10"
              }`}
            >
              <div className="flex items-center gap-2.5 text-xs">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    allTablesOccupied ? "bg-rose-500 animate-ping" : "bg-saffron-400 animate-ping"
                  }`}
                ></span>
                <span className="text-white font-extrabold tracking-wide">
                  {allTablesOccupied ? "Table Status:" : "Your Table:"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {allTablesOccupied ? (
                  <span className="px-3 py-1.5 rounded-xl bg-rose-500/20 border border-rose-500/50 text-rose-300 font-extrabold text-xs flex items-center gap-1.5 shadow-inner">
                    <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse"></span>
                    All Tables Occupied
                  </span>
                ) : (
                  <select
                    value={selectedTable}
                    onChange={(e) => setSelectedTable(e.target.value)}
                    className="bg-[#061C1C]/90 border border-saffron-500/40 rounded-xl px-3.5 py-1.5 text-xs font-extrabold text-saffron-300 shadow-inner focus:outline-none focus:ring-2 focus:ring-saffron-400/40 cursor-pointer"
                  >
                    <option value="" className="bg-[#0A2F2F] text-slate-300">-- Choose Table --</option>
                    {tables.map((tbl) => {
                      const isOcc = tbl.status === "Occupied" || tbl.status === "Booked";
                      return (
                        <option
                          key={tbl._id}
                          value={tbl.tableNo}
                          disabled={isOcc}
                          className={
                            isOcc
                              ? "bg-[#061C1C] text-rose-400/60 font-normal"
                              : "bg-[#0A2F2F] text-white font-bold"
                          }
                        >
                          Table {tbl.tableNo} ({tbl.capacity || 2} Seater) {isOcc ? "• (Occupied)" : "• Available"}
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>
            </div>

            {/* When all tables are occupied, show prominent alert banner directing to Live Queue or Takeaway */}
            {allTablesOccupied && (
              <div className="p-3.5 bg-gradient-to-r from-rose-950/90 via-red-950/80 to-[#0A2F2F]/90 border border-rose-500/40 rounded-2xl shadow-xl space-y-2.5">
                <div className="flex items-center gap-2 text-rose-300 font-extrabold text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Restaurant Dining Full — All Tables Occupied</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  All tables are currently busy with dining guests. Please join our <b>Live Queue / Waitlist</b> to reserve your turn, or order as <b>Takeaway (Parcel)</b>!
                </p>
                <div className="flex items-center gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setActiveTab("waitlist")}
                    className="flex-1 py-2 rounded-xl bg-gradient-to-r from-saffron-500 to-amber-600 text-slate-950 font-black text-xs shadow-md shadow-saffron-500/20 hover:scale-[1.01] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Ticket className="w-3.5 h-3.5" />
                    <span>Join Live Queue (Token)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("parcel")}
                    className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-xs border border-white/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-saffron-400" />
                    <span>Takeaway (Parcel)</span>
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Main Content Area */}
      <main className="max-w-xl mx-auto px-4 mt-4">
        {/* VIEW 1 & 2: DINE-IN OR PARCEL (MENU BROWSING) */}
        {activeTab === "dine_in" || activeTab === "parcel" ? (
          <div>
            {/* Search Bar & Category Chips */}
            <div className="sticky top-14 z-20 bg-[#061C1C]/95 backdrop-blur-2xl p-2 rounded-2xl border border-white/10 shadow-2xl flex flex-col gap-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-saffron-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search dishes, drinks, thalis, desserts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#061C1C] border border-white/20 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-400 shadow-inner focus:outline-none focus:ring-2 focus:ring-saffron-400/40 focus:border-saffron-400 transition-all font-medium"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Categories horizontally scrollable */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                <button
                  onClick={() => setSelectedCategory("All")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === "All"
                      ? "bg-gradient-to-r from-saffron-400 to-saffron-500 text-slate-950 shadow-md shadow-saffron-500/25 font-black scale-[1.02]"
                      : "bg-[#0A2F2F]/70 text-slate-300 hover:text-white hover:bg-[#0A2F2F] border border-white/10"
                  }`}
                >
                  All Items ({dishes.length})
                </button>

                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? "bg-gradient-to-r from-saffron-400 to-saffron-500 text-slate-950 shadow-md shadow-saffron-500/25 font-black scale-[1.02]"
                        : "bg-[#0A2F2F]/70 text-slate-300 hover:text-white hover:bg-[#0A2F2F] border border-white/10"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Dish Cards List with Framer Motion Stagger */}
            <div className="flex flex-col gap-3 mt-2">
              {filteredDishes.length === 0 ? (
                <div className="p-10 text-center bg-[#0A2F2F]/40 rounded-3xl border border-white/10 my-6 shadow-xl">
                  <Utensils className="w-10 h-10 text-saffron-400/50 mx-auto mb-2" />
                  <p className="text-sm font-extrabold text-white">No dishes found</p>
                  <p className="text-xs text-slate-400 mt-1">Try searching for something else or pick another category.</p>
                </div>
              ) : (
                filteredDishes.map((dish, index) => {
                  const qtyInCart = cart[dish._id]?.quantity || 0;
                  const isNonVeg =
                    dish.name.toLowerCase().includes("chicken") ||
                    dish.name.toLowerCase().includes("mutton") ||
                    dish.name.toLowerCase().includes("egg") ||
                    dish.name.toLowerCase().includes("fish");

                  return (
                    <motion.div
                      key={dish._id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.03, 0.4), duration: 0.3 }}
                      className="group p-4 bg-[#0A2F2F]/50 hover:bg-[#0A2F2F]/80 border border-white/10 hover:border-saffron-500/40 rounded-3xl flex items-center justify-between gap-3.5 transition-all shadow-xl hover:shadow-saffron-500/5 backdrop-blur-md"
                    >
                      {/* Dish Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {/* Veg/Non-veg Dot Indicator */}
                          <span
                            className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0 ${
                              isNonVeg ? "border-rose-500 bg-rose-500/10" : "border-emerald-500 bg-emerald-500/10"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isNonVeg ? "bg-rose-500" : "bg-emerald-500"
                              }`}
                            ></span>
                          </span>

                          <h3 className="font-extrabold text-sm text-white group-hover:text-saffron-300 transition-colors truncate font-display">
                            {dish.name}
                          </h3>
                        </div>

                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] text-slate-300 font-medium">{dish.category || "General"}</span>
                          {dish.price > 250 && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-saffron-500/15 text-saffron-400 border border-saffron-500/30">
                              <Star className="w-2.5 h-2.5 fill-saffron-400" /> Chef's Special
                            </span>
                          )}
                        </div>

                        <p className="text-base font-black text-saffron-400 mt-2 font-mono tracking-tight">
                          ₹{dish.price}
                        </p>
                      </div>

                      {/* Image (if available) & Quantity Controls */}
                      <div className="flex flex-col items-end justify-between gap-2.5 shrink-0 self-stretch">
                        {Boolean(dish.image && dish.image.trim()) ? (
                          <div className="relative overflow-hidden rounded-2xl w-20 h-20 min-w-[5rem] max-w-[5rem] min-h-[5rem] max-h-[5rem] border border-white/15 shadow-md group-hover:scale-102 transition-transform shrink-0 bg-[#061C1C]">
                            <img
                              src={dish.image}
                              alt={dish.name}
                              className="w-full h-full object-cover rounded-2xl block"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none rounded-2xl" />
                          </div>
                        ) : (
                          <div className="w-20 h-20 min-w-[5rem] max-w-[5rem] min-h-[5rem] max-h-[5rem] rounded-2xl bg-[#061C1C]/80 border border-white/10 flex items-center justify-center text-saffron-400/50 shrink-0">
                            <Utensils className="w-6 h-6" />
                          </div>
                        )}

                        {qtyInCart > 0 ? (
                          <div className="flex items-center bg-gradient-to-r from-saffron-400 to-saffron-500 text-slate-950 rounded-xl px-2 py-1 font-black shadow-md shadow-saffron-500/30">
                            <button
                              onClick={() => removeFromCart(dish._id)}
                              className="p-1 hover:opacity-80 active:scale-90 transition-transform cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                            </button>
                            <span className="px-2 text-xs font-black">{qtyInCart}</span>
                            <button
                              onClick={() => addToCart(dish)}
                              className="p-1 hover:opacity-80 active:scale-90 transition-transform cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                            </button>
                          </div>
                        ) : (
                          <MagneticButton>
                            <button
                              onClick={() => addToCart(dish)}
                              className="flex items-center gap-1.5 bg-gradient-to-r from-saffron-400/20 to-saffron-500/20 hover:from-saffron-400 hover:to-saffron-500 text-saffron-400 hover:text-slate-950 border border-saffron-500/40 hover:border-saffron-400 rounded-xl px-4 py-1.5 text-xs font-black transition-all shadow-md active:scale-95 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>Add</span>
                            </button>
                          </MagneticButton>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        ) : activeTab === "table_booking" ? (
          /* VIEW 3: TABLE BOOKING FORM */
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0A2F2F]/60 backdrop-blur-xl border border-white/15 rounded-3xl p-6 md:p-8 shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-saffron-500/20 text-saffron-400 border border-saffron-500/30">
                <CalendarDays className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-black text-white font-display">Reserve a Dining Table</h2>
            </div>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              Planning lunch or dinner at {hotel.name}? Reserve your table in advance to avoid waiting.
            </p>

            <form onSubmit={handleTableBooking} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs text-slate-200 font-bold mb-1.5 block">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-[#061C1C]/80 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-saffron-400/40 focus:border-saffron-400 transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-200 font-bold mb-1.5 block">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit mobile"
                    value={customerMobile}
                    onChange={(e) => setCustomerMobile(e.target.value)}
                    className="w-full bg-[#061C1C]/80 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-saffron-400/40 focus:border-saffron-400 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="text-xs text-slate-200 font-bold mb-1.5 block">Date *</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split("T")[0]}
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full bg-[#061C1C]/80 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-saffron-400/40 focus:border-saffron-400 transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-200 font-bold mb-1.5 block">Time Slot *</label>
                  <input
                    type="time"
                    required
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="w-full bg-[#061C1C]/80 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-saffron-400/40 focus:border-saffron-400 transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-200 font-bold mb-1.5 block">Guests *</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={guestsCount}
                    onChange={(e) => setGuestsCount(e.target.value)}
                    className="w-full bg-[#061C1C]/80 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-saffron-400/40 focus:border-saffron-400 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-200 font-bold mb-1.5 block">Special Requests (Optional)</label>
                <textarea
                  rows="2"
                  placeholder="Birthday decoration, quiet corner, baby chair..."
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  className="w-full bg-[#061C1C]/80 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-saffron-400/40 focus:border-saffron-400 transition-all font-medium"
                ></textarea>
              </div>

              <div className="pt-2 flex justify-center">
                <MagneticButton>
                  <button
                    type="submit"
                    disabled={submittingBooking}
                    className="w-full sm:w-auto min-w-[260px] py-3.5 px-8 rounded-xl bg-gradient-to-r from-saffron-400 to-saffron-500 hover:from-saffron-300 hover:to-saffron-400 text-slate-950 font-black text-sm tracking-wide shadow-xl shadow-saffron-500/25 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {submittingBooking ? "Submitting Reservation..." : "Confirm Table Reservation Request"}
                  </button>
                </MagneticButton>
              </div>
            </form>
          </motion.div>
        ) : activeTab === "waitlist" ? (
          /* VIEW 4: LIVE WAITING QUEUE TOKEN & FORM */
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Live Queue Header Card */}
            <div className="bg-[#0A2F2F]/60 backdrop-blur-xl border border-white/15 rounded-3xl p-6 shadow-2xl">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/20 to-saffron-500/20 text-saffron-400 border border-saffron-500/30 shadow-lg">
                    <Ticket className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white font-display flex items-center gap-2">
                      <span>Live Waiting Queue</span>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-saffron-500/20 text-saffron-300 border border-saffron-500/30">
                        Smart Token
                      </span>
                    </h2>
                    <p className="text-xs text-slate-300">
                      Walked in and tables are full? Reserve your turn digitally.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    fetchQueueSummary();
                    if (waitlistId) fetchWaitlistStatus(waitlistId);
                  }}
                  disabled={refreshingWaitlist}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
                  title="Refresh Queue"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshingWaitlist ? "animate-spin text-saffron-400" : ""}`} />
                </button>
              </div>

              {/* Quick Status Metrics */}
              <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-white/10">
                <div className="bg-[#061C1C]/80 border border-white/10 rounded-2xl p-3 text-center">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Tables Status</p>
                  <p className="text-sm font-black text-white mt-0.5">
                    {queueSummary ? `${queueSummary.occupiedTables}/${queueSummary.totalTables} Full` : "Live Sync"}
                  </p>
                </div>
                <div className="bg-[#061C1C]/80 border border-white/10 rounded-2xl p-3 text-center">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Total in Queue</p>
                  <p className="text-sm font-black text-amber-400 mt-0.5 font-mono">
                    {queueSummary ? `${queueSummary.waitingCount} ${queueSummary.waitingCount === 1 ? "Group" : "Groups"}` : "0 Groups"}
                  </p>
                </div>
                <div className="bg-[#061C1C]/80 border border-white/10 rounded-2xl p-3 text-center">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Avg Wait Time</p>
                  <p className="text-sm font-black text-emerald-400 mt-0.5 font-mono">
                    ~{queueSummary?.estimatedWaitPerParty || 12}m / group
                  </p>
                </div>
              </div>
            </div>

            {/* IF GUEST HAS AN ACTIVE TOKEN */}
            {waitlistData && (waitlistData.status === "waiting" || waitlistData.status === "called" || waitlistData.status === "seated") ? (
              <div className="bg-gradient-to-b from-[#0A2F2F]/80 to-[#061C1C]/90 backdrop-blur-2xl border-2 border-saffron-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-saffron-500/10 rounded-full blur-3xl pointer-events-none" />

                {/* Status Header */}
                <div className="flex items-center justify-between pb-6 border-b border-white/10">
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-widest text-saffron-400">
                      Your Digital Dining Pass
                    </span>
                    <h3 className="text-3xl font-black text-white font-mono mt-1">
                      Token #{waitlistData.tokenNo}
                    </h3>
                  </div>

                  <div className="text-right">
                    {waitlistData.status === "waiting" && (
                      <span className="px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                        In Live Queue
                      </span>
                    )}
                    {waitlistData.status === "called" && (
                      <span className="px-3.5 py-1.5 rounded-full bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-emerald-500/30 animate-pulse">
                        <BellRing className="w-3.5 h-3.5" />
                        Table Ready!
                      </span>
                    )}
                    {waitlistData.status === "seated" && (
                      <span className="px-3 py-1.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 text-xs font-black uppercase tracking-wider">
                        Seated at Table {waitlistData.assignedTableNo}
                      </span>
                    )}
                  </div>
                </div>

                {/* Called / Ready Alert Banner */}
                {waitlistData.status === "called" && (
                  <motion.div
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    className="mt-6 p-4 rounded-2xl bg-emerald-500/25 border-2 border-emerald-400 text-emerald-100 flex items-start gap-3.5 shadow-2xl"
                  >
                    <div className="p-2 rounded-xl bg-emerald-500 text-slate-950 font-black">
                      <Check className="w-5 h-5 stroke-[3]" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-base text-white">Your Table is Ready! 🎉</h4>
                      <p className="text-xs text-emerald-100 mt-1 leading-relaxed">
                        Namaste <b>{waitlistData.customerName}</b>, Table <b>#{waitlistData.assignedTableNo || "Front"}</b> is prepared for your party of {waitlistData.guestsCount}. Please contact the reception/host desk within 5 minutes.
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Waiting Position & Countdown */}
                {waitlistData.status === "waiting" && (
                  <div className="my-6 p-5 rounded-2xl bg-[#061C1C]/70 border border-white/10 flex flex-col sm:flex-row items-center justify-around gap-4 text-center">
                    <div>
                      <p className="text-xs text-slate-400 font-bold uppercase">Ahead of You</p>
                      <p className="text-3xl font-black text-saffron-400 font-mono mt-1">
                        {waitlistData.positionAhead ?? 0}{" "}
                        <span className="text-xs font-sans text-slate-300">
                          {(waitlistData.positionAhead ?? 0) === 1 ? "party" : "parties"}
                        </span>
                      </p>
                      <p className="text-[10px] font-bold text-amber-400 mt-0.5">
                        {(waitlistData.positionAhead ?? 0) === 0 ? "🎉 You're Next in Line!" : `#${(waitlistData.positionAhead ?? 0) + 1} in queue`}
                      </p>
                    </div>
                    <div className="h-8 w-px bg-white/10 hidden sm:block" />
                    <div>
                      <p className="text-xs text-slate-400 font-bold uppercase">Estimated Wait</p>
                      <p className="text-3xl font-black text-emerald-400 font-mono mt-1">
                        ~{waitlistData.estimatedWaitMinutes || 12} <span className="text-xs font-sans text-slate-300">mins</span>
                      </p>
                    </div>
                    <div className="h-8 w-px bg-white/10 hidden sm:block" />
                    <div>
                      <p className="text-xs text-slate-400 font-bold uppercase">Party Size</p>
                      <p className="text-3xl font-black text-white font-mono mt-1">
                        {waitlistData.guestsCount} <span className="text-xs font-sans text-slate-300">guests</span>
                      </p>
                    </div>
                  </div>
                )}

                {/* Seated Celebration */}
                {waitlistData.status === "seated" && (
                  <div className="my-6 p-5 rounded-2xl bg-sky-500/15 border border-sky-400/30 text-center">
                    <p className="text-base font-black text-white">You are seated at Table {waitlistData.assignedTableNo}!</p>
                    <p className="text-xs text-sky-200 mt-1">Enjoy your meal! You can now browse our menu and order directly.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTable(waitlistData.assignedTableNo);
                        setActiveTab("dine_in");
                      }}
                      className="mt-4 px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs shadow-lg cursor-pointer"
                    >
                      Browse Dine-In Menu ➔
                    </button>
                  </div>
                )}

                {/* Customer Details info */}
                <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-300">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-white">{waitlistData.customerName}</span>
                    <span>•</span>
                    <span className="font-mono">{waitlistData.customerMobile}</span>
                  </div>

                  {waitlistData.status === "waiting" && (
                    <button
                      type="button"
                      onClick={handleCancelWaitlist}
                      className="text-xs text-rose-400 hover:text-rose-300 font-bold underline underline-offset-4 cursor-pointer"
                    >
                      Cancel Token
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* JOIN WAITING QUEUE FORM */
              <div className="bg-[#0A2F2F]/60 backdrop-blur-xl border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl">
                <div className="mb-6">
                  <h3 className="text-lg font-black text-white font-display">Get Your Live Queue Token</h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Enter your name & mobile number. We will assign your position in the digital queue and alert you as soon as a table becomes available!
                  </p>
                </div>

                <form onSubmit={handleJoinWaitlist} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-xs text-slate-200 font-bold mb-1.5 block">Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rahul Sharma"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full bg-[#061C1C]/80 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-saffron-400/40 focus:border-saffron-400 transition-all font-medium"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-200 font-bold mb-1.5 block">Mobile Number *</label>
                      <input
                        type="tel"
                        required
                        placeholder="10-digit mobile number"
                        value={customerMobile}
                        onChange={(e) => setCustomerMobile(e.target.value)}
                        className="w-full bg-[#061C1C]/80 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-saffron-400/40 focus:border-saffron-400 transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-200 font-bold mb-1.5 block">Number of Guests *</label>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center bg-[#061C1C]/80 border border-white/15 rounded-xl p-1">
                        <button
                          type="button"
                          onClick={() => setWaitlistGuests((prev) => Math.max(1, prev - 1))}
                          className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 text-white flex items-center justify-center font-bold cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-12 text-center text-sm font-black text-saffron-400 font-mono">
                          {waitlistGuests}
                        </span>
                        <button
                          type="button"
                          onClick={() => setWaitlistGuests((prev) => Math.min(20, prev + 1))}
                          className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 text-white flex items-center justify-center font-bold cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-xs text-slate-400">
                        {waitlistGuests <= 2 ? "Couples / Small table" : waitlistGuests <= 4 ? "Standard Family Table" : "Large Group Table"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-200 font-bold mb-1.5 block">Seating Preferences (Optional)</label>
                    <textarea
                      rows="2"
                      placeholder="e.g. Quiet corner, high chair for toddler, AC area..."
                      value={waitlistNotes}
                      onChange={(e) => setWaitlistNotes(e.target.value)}
                      className="w-full bg-[#061C1C]/80 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-saffron-400/40 focus:border-saffron-400 transition-all font-medium"
                    />
                  </div>

                  <div className="pt-2 flex justify-center">
                    <MagneticButton className="w-full sm:w-auto">
                      <button
                        type="submit"
                        disabled={submittingWaitlist}
                        className="w-full sm:w-auto min-w-[280px] py-3.5 px-8 rounded-xl bg-gradient-to-r from-saffron-400 to-saffron-500 hover:from-saffron-300 hover:to-saffron-400 text-slate-950 font-black text-sm tracking-wide shadow-xl shadow-saffron-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {submittingWaitlist ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Generating Token...</span>
                          </>
                        ) : (
                          <>
                            <Ticket className="w-4 h-4" />
                            <span>🎟️ Get My Queue Token</span>
                          </>
                        )}
                      </button>
                    </MagneticButton>
                  </div>
                </form>
              </div>
            )}
          </motion.div>
        ) : (
          /* VIEW 4: TRACK ORDER BY MOBILE */
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0A2F2F]/60 backdrop-blur-xl border border-white/15 rounded-3xl p-6 md:p-8 shadow-2xl space-y-5"
          >
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2 font-display">
                <Search className="w-5 h-5 text-saffron-400" />
                Track Your Active Order
              </h2>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Enter your 10-digit mobile number used during ordering to check live preparation status, bill details, or add more items to your table.
              </p>
            </div>

            <form onSubmit={handleTrackByMobile} className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-slate-200 font-bold mb-1.5 block">Your Mobile Number *</label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    required
                    placeholder="Enter 10-digit mobile"
                    value={trackMobile}
                    onChange={(e) => setTrackMobile(e.target.value)}
                    className="flex-1 bg-[#061C1C]/80 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-saffron-400/40 focus:border-saffron-400 transition-all font-medium"
                  />
                  <MagneticButton>
                    <button
                      type="submit"
                      disabled={searchingTrack}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-saffron-400 to-saffron-500 text-slate-950 font-black text-xs hover:opacity-95 active:scale-95 transition-all shrink-0 flex items-center gap-1.5 shadow-lg shadow-saffron-500/25 cursor-pointer"
                    >
                      {searchingTrack ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Search className="w-3.5 h-3.5 stroke-[2.5]" />
                      )}
                      <span>{searchingTrack ? "Searching..." : "Track Order"}</span>
                    </button>
                  </MagneticButton>
                </div>
              </div>
            </form>

            {/* Display Tracked Order Details if Found */}
            {trackedOrder && (
              <div className="p-4 rounded-2xl bg-[#061C1C]/80 border border-white/15 space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                  <div>
                    <span className="text-xs font-black text-white font-display">Order #{trackedOrder.orderDisplayId}</span>
                    <span className="text-[10px] ml-2 px-2.5 py-0.5 rounded-full bg-saffron-500/20 border border-saffron-500/30 text-saffron-300 font-bold">
                      {trackedOrder.orderType === "Table" ? `Table ${trackedOrder.tableNo}` : "Takeaway"}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase ${
                      trackedOrder.approvalStatus === "approved"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : trackedOrder.approvalStatus === "pending"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                    }`}
                  >
                    {trackedOrder.approvalStatus === "approved"
                      ? `Active (${trackedOrder.kdsStatus || "Preparing"})`
                      : trackedOrder.approvalStatus}
                  </span>
                </div>

                {/* Items Summary */}
                <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar text-xs pr-1">
                  {trackedOrder.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-slate-300">
                      <span>
                        <span className="font-bold text-saffron-400">{item.quantity}x</span> {item.name}
                      </span>
                      <span className="text-white font-mono font-bold">₹{item.price * item.quantity}</span>
                    </div>
                  ))}

                  {/* Pending Addons */}
                  {trackedOrder.pendingAddons?.filter((a) => a.status === "pending").map((addon, aIdx) => (
                    <div key={aIdx} className="p-2.5 rounded-xl bg-saffron-500/10 border border-saffron-500/30 text-[11px] text-saffron-200">
                      <div className="font-bold flex items-center gap-1.5 text-saffron-400">
                        <Clock className="w-3.5 h-3.5 animate-spin" /> Additional Items Pending Approval:
                      </div>
                      {addon.items?.map((adItem, i) => (
                        <div key={i} className="flex justify-between text-slate-300 ml-2 mt-1">
                          <span>{adItem.quantity}x {adItem.name}</span>
                          <span className="font-bold text-white">₹{adItem.price * adItem.quantity}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                <div className="border-t border-white/10 pt-2.5 flex items-center justify-between">
                  <span className="text-xs text-slate-300 font-semibold">Total Bill Amount:</span>
                  <span className="text-base font-black text-saffron-400 font-mono">₹{trackedOrder.grandTotal}</span>
                </div>

                {/* Action button: Order more items */}
                <div className="pt-1 flex justify-center">
                  <MagneticButton>
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
                      className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-saffron-400 to-saffron-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-saffron-500/25 cursor-pointer"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      <span>+ Order More Food for This Table</span>
                    </button>
                  </MagneticButton>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </main>

      {/* Floating Cart Bottom Pill Bar */}
      {totalItemsCount > 0 && !isCartOpen && (
        <div className="fixed bottom-4 left-0 right-0 z-30 px-4">
          <div className="max-w-xl mx-auto">
            <MagneticButton className="w-full">
              <button
                onClick={() => setIsCartOpen(true)}
                className="w-full p-4 rounded-2xl bg-gradient-to-r from-saffron-400 to-saffron-500 text-slate-950 shadow-2xl shadow-saffron-500/40 flex items-center justify-between font-black transition-all hover:scale-[1.01] active:scale-[0.99] border border-white/20 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-slate-950 text-saffron-400 flex items-center justify-center text-xs font-black shadow-inner">
                    {totalItemsCount}
                  </span>
                  <div className="text-left">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-950 block">
                      {activeTab === "parcel" ? "Takeaway Basket" : `Table ${selectedTable || "(Select Table)"}`}
                    </span>
                    <span className="text-[10px] text-slate-800 font-bold block">Tap to review & checkout</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="text-lg font-black font-mono">₹{grandTotal}</span>
                  <span className="text-xs px-3 py-1.5 bg-slate-950 text-saffron-400 rounded-xl flex items-center gap-1 font-black shadow-sm">
                    View Cart <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                  </span>
                </div>
              </button>
            </MagneticButton>
          </div>
        </div>
      )}

      {/* Cart Drawer / Bottom Sheet Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex flex-col justify-end transition-opacity">
          <div
            className="w-full max-w-xl mx-auto bg-[#0A2F2F] border-t border-x border-white/20 rounded-t-3xl max-h-[90vh] flex flex-col shadow-2xl animate-fade-in"
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#061C1C]/70">
              <div>
                <h3 className="font-extrabold text-white text-base font-display tracking-wide">Your Order Summary</h3>
                <p className="text-xs text-saffron-400 font-bold mt-0.5">
                  {activeTab === "parcel" ? "Takeaway / Parcel" : `Dining at Table ${selectedTable || "Unassigned"}`}
                </p>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/15 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer border border-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 overflow-y-auto custom-scrollbar flex-1 flex flex-col gap-4">
              {/* Items List */}
              <div className="flex flex-col gap-2.5">
                {Object.values(cart).map((item) => (
                  <div
                    key={item.dish._id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-[#061C1C]/70 border border-white/10 text-xs shadow-sm"
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="font-bold text-white truncate text-sm">{item.dish.name}</p>
                      <p className="text-slate-300 mt-0.5">₹{item.dish.price} each</p>
                    </div>

                    <div className="flex items-center bg-[#0A2F2F] border border-white/20 rounded-xl px-2.5 py-1 font-bold text-white shadow-inner">
                      <button
                        onClick={() => removeFromCart(item.dish._id)}
                        className="p-1 text-slate-300 hover:text-saffron-400 cursor-pointer active:scale-90"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2.5 font-black text-saffron-400">{item.quantity}</span>
                      <button
                        onClick={() => addToCart(item.dish)}
                        className="p-1 text-slate-300 hover:text-saffron-400 cursor-pointer active:scale-90"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className="font-black text-saffron-400 pl-3 w-18 text-right font-mono text-sm">
                      ₹{item.dish.price * item.quantity}
                    </span>
                  </div>
                ))}
              </div>

              {/* Customer Info Form */}
              <div className="p-4 bg-[#061C1C]/70 border border-white/10 rounded-2xl flex flex-col gap-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-200">Customer Details (for bill & KOT):</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    required
                    placeholder="Your Name *"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="bg-[#0A2F2F]/80 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-saffron-400/40 focus:border-saffron-400 transition-all font-medium"
                  />
                  <input
                    type="tel"
                    required
                    placeholder="Mobile Number (Mandatory) *"
                    value={customerMobile}
                    onChange={(e) => setCustomerMobile(e.target.value)}
                    className="bg-[#0A2F2F]/80 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-saffron-400/40 focus:border-saffron-400 transition-all font-medium"
                  />
                </div>

                {activeTab === "dine_in" && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs text-slate-200 font-bold block">Confirm Table:</label>
                      {allTablesOccupied && (
                        <span className="text-[10px] font-black text-rose-400 uppercase tracking-wider flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span>
                          All Occupied
                        </span>
                      )}
                    </div>
                    {allTablesOccupied ? (
                      <div className="p-3 bg-rose-950/70 border border-rose-500/40 rounded-xl space-y-2">
                        <p className="text-xs text-rose-300 font-bold">
                          All tables are currently occupied. Cannot place a new Dine-In order right now.
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab("waitlist");
                              setIsCartOpen(false);
                            }}
                            className="flex-1 py-1.5 px-2.5 rounded-lg bg-gradient-to-r from-saffron-500 to-amber-600 text-slate-950 font-black text-xs text-center cursor-pointer shadow-md"
                          >
                            Join Live Queue
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab("parcel");
                            }}
                            className="flex-1 py-1.5 px-2.5 rounded-lg bg-slate-800 text-slate-200 font-bold text-xs text-center border border-white/10 cursor-pointer"
                          >
                            Switch to Takeaway
                          </button>
                        </div>
                      </div>
                    ) : (
                      <select
                        value={selectedTable}
                        onChange={(e) => setSelectedTable(e.target.value)}
                        className="w-full bg-[#0A2F2F]/80 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold focus:outline-none focus:ring-2 focus:ring-saffron-400/40 focus:border-saffron-400 cursor-pointer"
                      >
                        <option value="" className="bg-[#0A2F2F] text-slate-300">-- Select Table --</option>
                        {tables.map((t) => {
                          const isOcc = t.status === "Occupied" || t.status === "Booked";
                          return (
                            <option
                              key={t._id}
                              value={t.tableNo}
                              disabled={isOcc}
                              className={
                                isOcc
                                  ? "bg-[#061C1C] text-rose-400/60 font-normal"
                                  : "bg-[#0A2F2F] text-white font-bold"
                              }
                            >
                              Table {t.tableNo} {t.capacity ? `(${t.capacity} Seater)` : ""} {isOcc ? "• (Occupied)" : "• Available"}
                            </option>
                          );
                        })}
                      </select>
                    )}
                  </div>
                )}
              </div>

              {/* Payment Mode Selector */}
              <div className="p-4 bg-[#061C1C]/70 border border-white/10 rounded-2xl">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-2.5">Choose Payment Method:</p>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMode("Counter")}
                    className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs cursor-pointer ${
                      paymentMode === "Counter"
                        ? "bg-saffron-500/20 border-saffron-400 text-saffron-300 font-bold shadow-lg shadow-saffron-500/10"
                        : "bg-[#0A2F2F]/60 border-white/10 text-slate-300 hover:text-white"
                    }`}
                  >
                    <Banknote className="w-5 h-5 text-saffron-400" />
                    <span className="font-bold">Pay at Counter</span>
                    <span className="text-[10px] opacity-75">Cash/UPI later</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMode("Online")}
                    className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs cursor-pointer ${
                      paymentMode === "Online"
                        ? "bg-saffron-500/20 border-saffron-400 text-saffron-300 font-bold shadow-lg shadow-saffron-500/10"
                        : "bg-[#0A2F2F]/60 border-white/10 text-slate-300 hover:text-white"
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-saffron-400" />
                    <span className="font-bold">Pay Online</span>
                    <span className="text-[10px] opacity-75">UPI / Cards</span>
                  </button>
                </div>
              </div>

              {/* Bill Breakdown */}
              <div className="p-4 bg-[#061C1C]/70 border border-white/10 rounded-2xl flex flex-col gap-2 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Subtotal</span>
                  <span className="font-semibold text-white font-mono">₹{subTotal}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Food GST ({gstRate}%)</span>
                  <span className="font-semibold text-white font-mono">₹{taxAmount}</span>
                </div>
                <div className="border-t border-white/10 pt-2.5 mt-1 flex justify-between font-extrabold text-sm text-white">
                  <span>Grand Total</span>
                  <span className="text-saffron-400 font-black font-mono text-base">₹{grandTotal}</span>
                </div>
              </div>
            </div>

            {/* Modal Bottom CTA */}
            <div className="p-4 border-t border-white/10 bg-[#061C1C]/80">
              <MagneticButton className="w-full">
                <button
                  onClick={handlePlaceOrder}
                  disabled={submittingOrder || (activeTab === "dine_in" && allTablesOccupied)}
                  className={`w-full py-3.5 rounded-2xl font-black text-sm tracking-wide shadow-xl transition-all flex items-center justify-center gap-2 ${
                    activeTab === "dine_in" && allTablesOccupied
                      ? "bg-rose-950/60 border border-rose-500/40 text-rose-300 cursor-not-allowed opacity-80"
                      : "bg-gradient-to-r from-saffron-400 to-saffron-500 hover:from-saffron-300 hover:to-saffron-400 text-slate-950 shadow-saffron-500/30 hover:opacity-95 active:scale-98 cursor-pointer disabled:opacity-50"
                  }`}
                >
                  {activeTab === "dine_in" && allTablesOccupied ? (
                    <span className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      All Tables Occupied — Join Queue
                    </span>
                  ) : submittingOrder ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sending Order...</span>
                    </>
                  ) : (
                    <>
                      <span>{paymentMode === "Online" ? `Pay ₹${grandTotal} & Place Order` : `Place Order (₹${grandTotal})`}</span>
                      <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                    </>
                  )}
                </button>
              </MagneticButton>
              <p className="text-[10px] text-center text-slate-400 mt-2 font-medium">
                Order will be dispatched directly to kitchen upon manager confirmation.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
