import React, { useState, useEffect } from "react";
import api, { tableAPI, orderAPI, tableBookingAPI, waitlistAPI } from "../../api";
import { UtensilsCrossed, Users, Plus, Minus, Trash2, Search, ArrowUpRight, ArrowLeft, Bike, ShoppingBag, Truck, X, BedDouble, CalendarClock, Calendar, Clock, Phone, AlertCircle, CalendarDays, CheckCircle, Hotel, Ticket, UserPlus, PhoneCall, Check, RefreshCw, UserCheck, ShieldAlert, KeyRound, ShieldCheck, Flame } from "lucide-react";
import { showError, showSuccess, showConfirm } from "../../utils/alerts";
import ThermalReceipt from "../../components/ThermalReceipt";
import MagneticButton from "../../components/MagneticButton";

export default function StaffKotBilling({ theme: propTheme }) {
  const currentTheme = propTheme || (typeof document !== "undefined" && document.body.classList.contains("light") ? "light" : "dark");
  const [tables, setTables] = useState([]);
  const [virtualOrders, setVirtualOrders] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutData, setCheckoutData] = useState({
    customerName: "",
    customerMobile: "",
    customerEmail: "",
    paymentMode: "Cash"
  });
  const [discountPercentage, setDiscountPercentage] = useState(0);
  // Menu Data
  const [dishes, setDishes] = useState([]);
  const [filteredDishes, setFilteredDishes] = useState([]);
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState(["All", "🔥 Top Orders"]);
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  

  // Order Data
  const [cart, setCart] = useState([]);
  const [initialCart, setInitialCart] = useState([]);
  const [activeOrderId, setActiveOrderId] = useState(null);
  
  // View states
  const [view, setView] = useState("tables"); // "tables" or "order"
  const [loading, setLoading] = useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState(null);
  const [proformaInvoice, setProformaInvoice] = useState(null);
  const [isKotPrint, setIsKotPrint] = useState(false);
  const [applyGST, setApplyGST] = useState(true);

  // Table Bookings / Reservations
  const [tableBookings, setTableBookings] = useState([]);
  const [showBookingsModal, setShowBookingsModal] = useState(false);

  // Live Waitlist & Queue
  const [waitlistActive, setWaitlistActive] = useState([]);
  const [waitlistCompleted, setWaitlistCompleted] = useState([]);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [waitlistTab, setWaitlistTab] = useState("active"); // "active", "walkin", "history"
  const [newWalkin, setNewWalkin] = useState({
    customerName: "",
    customerMobile: "",
    guestsCount: 2,
    notes: "",
    assignedTableNo: "",
  });
  const [isSubmittingWalkin, setIsSubmittingWalkin] = useState(false);
  const [waitlistLoading, setWaitlistLoading] = useState(false);

  const [activeBookings, setActiveBookings] = useState([]);
  const [showRoomSelectModal, setShowRoomSelectModal] = useState(false);

  // Anti-Theft KOT & Void OTP Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpModalData, setOtpModalData] = useState({
    type: "full_order", // "full_order" or "item_void"
    auditId: "",
    orderId: "",
    otp: "",
    reason: "Customer cancelled",
    tableNo: "",
    dishId: "",
    quantityToVoid: 1,
    itemName: "",
    amount: 0,
    isSubmitting: false,
    error: "",
  });

  useEffect(() => {
    fetchTables();
    fetchVirtualOrders();
    fetchAllCategories();
    fetchActiveBookings();
    fetchTableBookings();
    fetchWaitlist();

    // Listen for live table booking confirmation & order & waitlist updates
    const token = localStorage.getItem("token");
    let eventSource;
    if (token) {
      try {
        const baseUrl = api.defaults.baseURL || "http://localhost:5000/";
        const streamUrl = new URL("/api/kds/stream", baseUrl);
        streamUrl.searchParams.set("token", token);
        eventSource = new EventSource(streamUrl.toString());
        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (
              data.type === "table_booking_updated" || 
              data.type === "new_table_booking" || 
              data.type === "order_billed" || 
              data.type === "order_cancelled" ||
              data.type === "waitlist_updated"
            ) {
              fetchTables();
              fetchVirtualOrders();
              fetchTableBookings();
              fetchWaitlist();
            }
          } catch (e) {}
        };
      } catch (err) {}
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, []);

  const fetchWaitlist = async () => {
    setWaitlistLoading(true);
    try {
      const res = await waitlistAPI.getAdminWaitlist();
      if (res.data.success) {
        setWaitlistActive(res.data.data.active || []);
        setWaitlistCompleted(res.data.data.completed || []);
      }
    } catch (error) {
      console.error("Error fetching waitlist:", error);
    } finally {
      setWaitlistLoading(false);
    }
  };

  const handleCallGuest = async (entry, tableNo) => {
    try {
      const res = await waitlistAPI.callGuest(entry._id, { tableNo });
      if (res.data.success) {
        showSuccess("Guest Called!", `Guest ${entry.customerName} has been alerted for Table ${tableNo || entry.assignedTableNo || "Next Free Table"}.`);
        fetchWaitlist();
      }
    } catch (err) {
      showError("Call Failed", err.response?.data?.message || "Failed to call guest");
    }
  };

  const handleSeatGuest = async (entry, tableNo) => {
    const chosenTableNo = tableNo || entry.assignedTableNo;
    if (!chosenTableNo) {
      showError("Select Table", "Please pick an available table to seat this guest.");
      return;
    }
    const tableObj = tables.find((t) => String(t.tableNo) === String(chosenTableNo));
    try {
      const res = await waitlistAPI.seatGuest(entry._id, { tableNo: chosenTableNo, tableId: tableObj?._id });
      if (res.data.success) {
        showSuccess("Guest Seated!", `Token ${entry.tokenNo} (${entry.customerName}) seated at Table ${chosenTableNo}.`);
        fetchWaitlist();
        fetchTables();
        setShowWaitlistModal(false);
        if (tableObj) {
          setCheckoutData((prev) => ({
            ...prev,
            customerName: entry.customerName || "",
            customerMobile: entry.customerMobile || "",
            paymentMode: "Cash",
          }));
          handleTableClick(tableObj);
        }
      }
    } catch (err) {
      showError("Seating Failed", err.response?.data?.message || "Failed to seat guest");
    }
  };

  const handleUpdateWaitlistStatus = async (id, status) => {
    const confirm = await showConfirm(
      `Confirm ${status === "cancelled" ? "Cancellation" : "No-Show"}`,
      `Are you sure you want to mark this guest as ${status}?`
    );
    if (!confirm) return;
    try {
      await waitlistAPI.updateStatus(id, status);
      showSuccess("Updated", `Token marked as ${status}.`);
      fetchWaitlist();
    } catch (err) {
      showError("Error", err.response?.data?.message || "Failed to update status");
    }
  };

  const handleAddWalkinGuest = async (e) => {
    e.preventDefault();
    if (!newWalkin.customerName.trim() || !newWalkin.customerMobile.trim()) {
      showError("Missing Info", "Please enter guest name and mobile number.");
      return;
    }
    setIsSubmittingWalkin(true);
    try {
      const res = await waitlistAPI.addManualGuest(newWalkin);
      if (res.data.success) {
        showSuccess("Queue Token Created!", `Token #${res.data.data.tokenNo} issued for ${res.data.data.customerName}!`);
        setNewWalkin({ customerName: "", customerMobile: "", guestsCount: 2, notes: "", assignedTableNo: "" });
        setWaitlistTab("active");
        fetchWaitlist();
      }
    } catch (err) {
      showError("Error", err.response?.data?.message || "Failed to add walk-in guest");
    } finally {
      setIsSubmittingWalkin(false);
    }
  };

  const fetchTableBookings = async () => {
    try {
      const res = await tableBookingAPI.getBookings();
      if (res.data.success) {
        setTableBookings(res.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching table bookings:", error);
    }
  };

  const fetchActiveBookings = async () => {
    try {
      const res = await api.get("/api/room-bookings?status=Checked-In");
      if (res.data.success) {
        setActiveBookings(res.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching active rooms:", error);
    }
  };

  const fetchVirtualOrders = async () => {
    try {
      const res = await api.get("/api/orders/virtual/active");
      if (res.data.success) {
        setVirtualOrders(res.data.data || []);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchTables = async () => {
    try {
      const res = await tableAPI.getTables();
      setTables(res.data.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const [serverTotalPages, setServerTotalPages] = useState(1);

  const fetchAllCategories = async () => {
    try {
      const res = await api.get("/api/dishes");
      if (res.data.success) {
        const rawCats = [...new Set(res.data.dishes.map((d) => d.category))].filter(Boolean);
        // "All" followed by "🔥 Top Orders", then standard menu categories
        setCategories(["All", "🔥 Top Orders", ...rawCats]);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchDishes = async () => {
    try {
      let url = "";
      if (selectedCategory === "🔥 Top Orders" || selectedCategory === "Top Orders") {
        url = `/api/dishes?topOrders=true&search=${encodeURIComponent(search)}`;
      } else {
        const categoryParam = selectedCategory === "All" ? "" : encodeURIComponent(selectedCategory);
        url = `/api/dishes?page=${currentPage}&limit=${itemsPerPage}&search=${encodeURIComponent(search)}&category=${categoryParam}`;
      }

      const res = await api.get(url);
      if (res.data.success) {
        // filter out unavailable dishes just in case, though ideally backend does this
        const available = res.data.dishes.filter(d => d.available !== false);
        setFilteredDishes(available);
        if (res.data.pagination) {
          setServerTotalPages(res.data.pagination.totalPages || 1);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchDishes();
  }, [search, selectedCategory, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory]);

  const handleVirtualOrderClick = async (order) => {
    setSelectedTable({
      _id: 'virtual',
      tableNo: order.orderDisplayId,
      status: 'Occupied',
      orderType: order.orderType,
      roomBookingId: order.roomBookingId || null
    });
    setCart(order.items || []);
    setInitialCart(JSON.parse(JSON.stringify(order.items || [])));
    setActiveOrderId(order._id);
    setDiscountPercentage(0);
    setView("order");
  };

  const handleCreateNewVirtual = async (type) => {
    setSelectedTable({
      _id: 'virtual',
      tableNo: 'New ' + type,
      status: 'Available',
      orderType: type
    });
    setCart([]);
    setInitialCart([]);
    setActiveOrderId(null);
    setDiscountPercentage(0);
    setView("order");
  };

  const handleSelectRoomForKot = (booking) => {
    const roomNum = booking.room?.roomNumber || "Room";
    const guestName = booking.guests?.[0]?.name || "Guest";
    const guestPhone = booking.guests?.[0]?.phone || "";
    setSelectedTable({
      _id: 'virtual',
      tableNo: `Room ${roomNum}`,
      status: 'Available',
      orderType: 'Room',
      roomBookingId: booking._id,
      guestName,
      guestPhone,
      roomNumber: roomNum
    });
    setCart([]);
    setInitialCart([]);
    setActiveOrderId(null);
    setDiscountPercentage(0);
    setShowRoomSelectModal(false);
    setView("order");
  };

  const getTableReservation = (tableNo) => {
    if (!tableNo) return null;
    const todayStr = new Date().toISOString().split("T")[0];
    return tableBookings.find(
      (b) =>
        b.status === "confirmed" &&
        b.bookingDate === todayStr &&
        String(b.tableNo).trim().toLowerCase() === String(tableNo).trim().toLowerCase()
    );
  };

  const handleTableClick = async (table) => {
    const reservation = getTableReservation(table.tableNo);
    if (reservation && table.status === "Available") {
      const confirmResult = await showConfirm(
        `Table ${table.tableNo} is Reserved!`,
        `This table is reserved for "${reservation.customerName}" at ${reservation.bookingTime} (${reservation.guestsCount} Guests). Do you still want to seat walk-in guests or create an order here?`,
        "Yes, Proceed",
        "warning"
      );
      if (!confirmResult) return;
    }

    setSelectedTable(table);
    setCart([]);
    setInitialCart([]);
    setActiveOrderId(null);
    setDiscountPercentage(0);
    setView("order");

    if (table.status === "Occupied") {
      try {
        const res = await orderAPI.getActiveOrder(table._id);
        if (res.data.data) {
          const orderData = res.data.data;
          setActiveOrderId(orderData._id);
          setCart(orderData.items);
          setInitialCart(JSON.parse(JSON.stringify(orderData.items)));
        }
      } catch (error) {
        console.error("Error fetching active order", error);
      }
    }
  };

  const goBackToTables = () => {
    setView("tables");
    setSelectedTable(null);
    setDiscountPercentage(0);
    fetchTables();
    fetchVirtualOrders();
  };

  const addToCart = (dish) => {
    const existing = cart.find((item) => item.dishId === dish._id);
    if (existing) {
      setCart(cart.map((item) => item.dishId === dish._id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      const displayName = dish.dishId ? `[${dish.dishId}] ${dish.name}` : dish.name;
      setCart([...cart, { dishId: dish._id, name: displayName, price: dish.price, quantity: 1 }]);
    }
  };

  const removeFromCart = (dishId) => {
    setCart(cart.filter((item) => item.dishId !== dishId));
  };

  const updateQuantity = (dishId, amt) => {
    setCart(
      cart.map((item) => {
        if (item.dishId === dishId) {
          const nextQty = item.quantity + amt;
          return nextQty > 0 ? { ...item, quantity: nextQty } : null;
        }
        return item;
      }).filter(Boolean)
    );
  };

  const storedUser = localStorage.getItem("user");
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  const foodGstRate = Number(currentUser?.foodGstRate !== undefined ? currentUser.foodGstRate : 5);

  const subTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = Math.round((subTotal * (discountPercentage || 0) / 100) * 100) / 100;
  const tax = applyGST ? Math.round(((subTotal - discountAmount) * (foodGstRate / 100)) * 100) / 100 : 0;
  const grandTotal = Math.round((subTotal - discountAmount + tax) * 100) / 100;

  const handleSaveOrder = async () => {
    if (cart.length === 0) {
      showError("Empty Order", "Please add items to the KOT.");
      return;
    }

    // Compute newly added items for the kitchen print
    const newKotItems = [];
    cart.forEach(currentItem => {
      const oldItem = initialCart.find(i => i.dishId === currentItem.dishId);
      const oldQty = oldItem ? oldItem.quantity : 0;
      const diffQty = currentItem.quantity - oldQty;
      if (diffQty > 0) {
        newKotItems.push({
          ...currentItem,
          quantity: diffQty
        });
      }
    });

    setLoading(true);
    try {
      const res = await orderAPI.createOrUpdateOrder({
        tableId: selectedTable._id === 'virtual' ? null : selectedTable._id,
        orderType: selectedTable.orderType || 'Table',
        orderId: activeOrderId,
        roomBookingId: selectedTable.roomBookingId || null,
        items: cart,
        subTotal,
        tax,
        grandTotal
      });
      
      const savedOrder = res.data.data;
      if (savedOrder?._id) {
        setActiveOrderId(savedOrder._id);
      }
      setInitialCart(JSON.parse(JSON.stringify(cart)));

      if (newKotItems.length > 0) {
        setIsKotPrint(true);
        const displayTableNo = selectedTable.orderType === 'Table' 
          ? ("Table " + selectedTable.tableNo) 
          : selectedTable.tableNo;

        setGeneratedInvoice({
          tableNo: displayTableNo,
          items: newKotItems,
          createdAt: new Date().toISOString()
        });

        // Update backend printed quantities for these new items
        try {
          const updateData = newKotItems.map(item => ({
            dishId: item.dishId,
            quantity: item.quantity // the diffQty
          }));
          await orderAPI.markKotPrinted(savedOrder._id, updateData);
        } catch (e) {
          console.error("Failed to mark KOT as printed", e);
        }

      } else {
        showSuccess("Saved", "Order updated! No new items to print for KOT.");
        goBackToTables();
      }
    } catch (error) {
      showError("Save Failed", error.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelKOT = () => {
    if (!activeOrderId) return;
    
    showConfirm(
      "Cancel KOT?",
      "Are you sure you want to cancel this KOT? If items were printed, Owner authorization OTP will be triggered.",
      "Yes, Cancel KOT",
      "No",
      "#ef4444"
    ).then(async (result) => {
      if (result.isConfirmed) {
        setLoading(true);
        try {
          const res = await orderAPI.requestCancelOrder(activeOrderId, "KOT Cancelled by Staff");
          if (res.data.requiresOtp) {
            setOtpModalData({
              type: "full_order",
              auditId: res.data.auditId,
              orderId: activeOrderId,
              otp: "",
              reason: "Customer changed mind / mistake",
              tableNo: res.data.tableNo || (selectedTable?.tableNo ? `Table ${selectedTable.tableNo}` : "Takeaway"),
              amount: res.data.totalAmount || subTotal,
              dishId: "",
              quantityToVoid: 1,
              itemName: "Entire KOT Order",
              isSubmitting: false,
              error: "",
            });
            setShowOtpModal(true);
          } else {
            showSuccess("Cancelled", "KOT cancelled successfully");
            setCart([]);
            goBackToTables();
          }
        } catch (error) {
          showError("Error", error.response?.data?.message || "Failed to cancel KOT");
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleItemVoidAttempt = async (dishId, amt) => {
    const item = cart.find(i => i.dishId === dishId);
    if (!item) return;

    const isPrinted = (item.printedQuantity || 0) > 0;
    const nextQty = amt === -999 ? 0 : (item.quantity + amt);
    const willReduceBelowPrinted = nextQty < (item.printedQuantity || 0);

    // If item was already printed in the kitchen and active order exists
    if (isPrinted && willReduceBelowPrinted && activeOrderId) {
      const confirm = await showConfirm(
        `Void ${item.name}?`,
        `This item has already been printed for the kitchen! Voiding it requires Owner Authorization OTP via Telegram.`,
        "Request Owner OTP",
        "Keep Item",
        "#f59e0b"
      );
      if (!confirm || !confirm.isConfirmed) return;

      const qtyToVoid = amt === -999 ? item.quantity : Math.abs(amt);
      try {
        setLoading(true);
        const res = await orderAPI.requestItemVoid(activeOrderId, {
          dishId,
          quantityToVoid: qtyToVoid,
          reason: "Item Void Request",
        });

        if (res.data.requiresOtp) {
          setOtpModalData({
            type: "item_void",
            auditId: res.data.auditId,
            orderId: activeOrderId,
            otp: "",
            reason: "Customer cancelled dish",
            tableNo: selectedTable?.tableNo ? `Table ${selectedTable.tableNo}` : "Takeaway",
            dishId,
            quantityToVoid: qtyToVoid,
            itemName: item.name,
            amount: res.data.voidAmount || (item.price * qtyToVoid),
            isSubmitting: false,
            error: "",
          });
          setShowOtpModal(true);
        } else {
          if (amt === -999 || item.quantity <= 1) {
            removeFromCart(dishId);
          } else {
            updateQuantity(dishId, amt);
          }
          showSuccess("Updated", `${item.name} removed from order.`);
        }
      } catch (err) {
        showError("Void Failed", err.response?.data?.message || "Could not void item.");
      } finally {
        setLoading(false);
      }
      return;
    }

    // Normal unprinted modification
    if (amt === -999) {
      removeFromCart(dishId);
    } else {
      updateQuantity(dishId, amt);
    }
  };

  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    if (!otpModalData.otp || otpModalData.otp.trim().length < 4) {
      setOtpModalData(prev => ({ ...prev, error: "Please enter the 4-digit OTP sent to Owner's Telegram." }));
      return;
    }

    setOtpModalData(prev => ({ ...prev, isSubmitting: true, error: "" }));
    try {
      if (otpModalData.type === "full_order") {
        const res = await orderAPI.verifyCancelOrder(otpModalData.orderId, otpModalData.auditId, otpModalData.otp.trim());
        if (res.data.success) {
          setShowOtpModal(false);
          showSuccess("Authorized & Cancelled", "Owner OTP verified! KOT has been cancelled.");
          setCart([]);
          goBackToTables();
        }
      } else {
        const res = await orderAPI.verifyItemVoid(otpModalData.orderId, {
          auditId: otpModalData.auditId,
          otp: otpModalData.otp.trim(),
          dishId: otpModalData.dishId,
          quantityToVoid: otpModalData.quantityToVoid,
        });
        if (res.data.success) {
          setShowOtpModal(false);
          showSuccess("Item Voided", `${otpModalData.itemName} removed successfully.`);
          if (res.data.data) {
            setCart(res.data.data.items || []);
          } else {
            setCart(prev => prev.filter(i => i.dishId !== otpModalData.dishId));
          }
        }
      }
    } catch (err) {
      setOtpModalData(prev => ({
        ...prev,
        error: err.response?.data?.message || "Incorrect OTP. Verification failed.",
        isSubmitting: false,
      }));
    }
  };

  const handleCheckout = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    
    let orderId = activeOrderId;
    // Fallback if activeOrderId was not set in state
    if (!orderId && selectedTable?._id) {
      try {
        const activeRes = await orderAPI.getActiveOrder(selectedTable._id);
        if (activeRes.data?.data?._id) {
          orderId = activeRes.data.data._id;
          setActiveOrderId(orderId);
        }
      } catch (err) {}
    }

    if (!orderId) {
      showError("Order Not Found", "No active order found for this table. Please save/send KOT items first.");
      return;
    }
    
    // Validate checkout data for NC or Credit
    if (['NC Bill', 'Credit Bill'].includes(checkoutData.paymentMode) && !checkoutData.customerName) {
      showError("Name Required", "Customer name is mandatory for NC or Credit Bills.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...checkoutData,
        discountPercentage,
        roomBookingId: selectedTable?.roomBookingId || null
      };

      const res = await orderAPI.checkoutOrder(orderId, payload);
      if (res.data.success) {
        setIsKotPrint(false);
        if (checkoutData.paymentMode === "Added to Room" || selectedTable?.orderType === "Room") {
          showSuccess("Added to Room", "Order bill successfully posted to guest's room folio.");
          setShowCheckoutModal(false);
          setCheckoutData({ customerName: "", customerMobile: "", customerEmail: "", paymentMode: "Cash" });
          setDiscountPercentage(0);
          goBackToTables();
        } else {
          setGeneratedInvoice(res.data.data);
          setShowCheckoutModal(false);
          setCheckoutData({ customerName: "", customerMobile: "", customerEmail: "", paymentMode: "Cash" });
          setDiscountPercentage(0);
        }
      }
    } catch (error) {
      showError("Checkout Failed", error.response?.data?.message || "Failed to generate bill.");
    } finally {
      setLoading(false);
    }
  };

  const promptCheckout = async () => {
    if (cart.length === 0) {
      showError("Empty Order", "Cannot generate bill for an empty order.");
      return;
    }

    // Ensure we have activeOrderId if table is already occupied
    if (!activeOrderId && selectedTable?._id) {
      try {
        const res = await orderAPI.getActiveOrder(selectedTable._id);
        if (res.data?.data?._id) {
          setActiveOrderId(res.data.data._id);
        }
      } catch (e) {
        console.error("Error resolving active order id", e);
      }
    }

    if (selectedTable?.orderType === 'Room') {
      setCheckoutData({
        customerName: selectedTable?.guestName || selectedTable?.tableNo || "Room Guest",
        customerMobile: selectedTable?.guestPhone || "",
        customerEmail: "",
        paymentMode: "Added to Room"
      });
    } else if (selectedTable?.orderType !== 'Table') {
      setCheckoutData(prev => ({ ...prev, customerName: selectedTable?.tableNo, paymentMode: "Cash" }));
    } else {
      setCheckoutData(prev => ({ ...prev, paymentMode: "Cash" }));
    }
    setShowCheckoutModal(true);
  };

  const handleCloseReceipt = () => {
    setGeneratedInvoice(null);
    goBackToTables();
  };

  const handlePrintProforma = () => {
    if (cart.length === 0) {
      showError("Empty Order", "Please add items to print a bill.");
      return;
    }
    const invoice = {
      _id: activeOrderId || "PROFORMA",
      invoiceNumber: "PROFORMA",
      table: { tableNo: selectedTable?.tableNo },
      items: cart,
      subTotal: subTotal,
      discountPercentage: discountPercentage || 0,
      discountAmount: discountAmount,
      tax: tax,
      grandTotal: grandTotal,
      createdAt: new Date().toISOString(),
    };
    setProformaInvoice(invoice);
  };

  // Server-side pagination
  const currentDishes = filteredDishes;
  const totalPages = serverTotalPages;

  if (view === "tables") {
    return (
      <div className="p-4 md:p-6 max-w-7xl mx-auto min-h-[calc(100vh-80px)]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 no-print">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold font-display text-white flex items-center gap-3">
              <UtensilsCrossed className="w-7 h-7 text-saffron-400" /> 
              <span>KOT Dining & Delivery Tables</span>
            </h1>
            <p className="text-slate-300 mt-1 text-xs md:text-sm font-medium">
              Manage live table orders, Swiggy, Zomato and parcel tokens
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <MagneticButton>
            <button 
              type="button"
              onClick={() => {
                fetchActiveBookings();
                setShowRoomSelectModal(true);
              }} 
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl flex items-center gap-2 font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all text-xs cursor-pointer"
            >
              <BedDouble className="w-4 h-4"/> New Room Guest KOT
            </button>
          </MagneticButton>

          <MagneticButton>
            <button 
              type="button"
              onClick={() => handleCreateNewVirtual('Parcel')} 
              className="px-4 py-2.5 bg-gradient-to-r from-saffron-400 to-saffron-500 hover:from-saffron-300 hover:to-saffron-400 text-slate-950 rounded-xl flex items-center gap-2 font-extrabold shadow-md shadow-saffron-500/20 active:scale-95 transition-all text-xs cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4"/> New Parcel
            </button>
          </MagneticButton>

          <MagneticButton>
            <button 
              type="button"
              onClick={() => handleCreateNewVirtual('Swiggy')} 
              className="px-4 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl flex items-center gap-2 font-bold shadow-md shadow-orange-600/20 active:scale-95 transition-all text-xs cursor-pointer"
            >
              <Bike className="w-4 h-4"/> New Swiggy Order
            </button>
          </MagneticButton>

          <MagneticButton>
            <button 
              type="button"
              onClick={() => handleCreateNewVirtual('Zomato')} 
              className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl flex items-center gap-2 font-bold shadow-md shadow-red-600/20 active:scale-95 transition-all text-xs cursor-pointer"
            >
              <Bike className="w-4 h-4"/> New Zomato Order
            </button>
          </MagneticButton>
          
          {/* Table Reservations & Live Waitlist Pill Buttons */}
          <div className="ml-auto flex items-center gap-2">
            <MagneticButton>
              <button
                type="button"
                onClick={() => {
                  fetchWaitlist();
                  setShowWaitlistModal(true);
                }}
                className="px-4 py-2.5 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-800 dark:text-cyan-300 hover:text-cyan-900 dark:hover:text-cyan-200 rounded-xl flex items-center gap-2 font-bold text-xs transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                <Ticket className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span>Live Waitlist</span>
                {waitlistActive.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-500 text-slate-950 animate-pulse">
                    {waitlistActive.filter((w) => w.status === "waiting").length} Waiting
                  </span>
                )}
              </button>
            </MagneticButton>

            <MagneticButton>
              <button
                type="button"
                onClick={() => setShowBookingsModal(true)}
                className="px-4 py-2.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-800 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-200 rounded-xl flex items-center gap-2 font-bold text-xs transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                <CalendarDays className="w-4 h-4 text-saffron-600 dark:text-amber-400" />
                <span>Table Reservations</span>
                {tableBookings.filter((b) => b.status === "confirmed").length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950">
                    {tableBookings.filter((b) => b.status === "confirmed").length} Active
                  </span>
                )}
              </button>
            </MagneticButton>
          </div>
        </div>

        {virtualOrders.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 font-display">
              <Truck className="w-5 h-5 text-saffron-500"/> Active Room, Delivery & Parcel Orders
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {virtualOrders.map(order => {
                const isRoom = order.orderType === "Room";
                return (
                  <div 
                    key={order._id} 
                    onClick={() => handleVirtualOrderClick(order)} 
                    className={`p-4 rounded-2xl border-2 shadow-md cursor-pointer transition-all active:scale-95 flex flex-col justify-between h-32 ${
                      isRoom 
                        ? "border-emerald-400 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20"
                        : "border-saffron-400 dark:border-saffron-500/40 bg-saffron-50 dark:bg-saffron-500/10 hover:bg-saffron-100 dark:hover:bg-saffron-500/20"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-xl font-black text-slate-900 dark:text-white font-mono">{order.orderDisplayId}</span>
                      {isRoom ? (
                        <BedDouble className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <ShoppingBag className="w-5 h-5 text-saffron-600 dark:text-saffron-400" />
                      )}
                    </div>
                    <div>
                      <p className={`text-xs font-black uppercase tracking-wider mb-1 ${isRoom ? "text-emerald-700 dark:text-emerald-400" : "text-saffron-700 dark:text-saffron-400"}`}>
                        {order.orderType === "Room" ? "Room Guest" : order.orderType}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">{order.items.length} Items</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white font-display">Dine-in Tables</h2>
          <div className="flex items-center gap-3 text-xs text-slate-700 dark:text-slate-300 font-semibold">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Available</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Reserved Today</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Occupied (KOT Active)</span>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {(tables || []).map(table => {
            const reservation = getTableReservation(table.tableNo) || table.advanceBooking;
            const isReserved = Boolean(reservation);

            return (
              <div 
                key={table._id} 
                onClick={() => handleTableClick(table)} 
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all transform hover:-translate-y-1 active:scale-95 flex flex-col justify-between h-36 relative ${
                  table.status === 'Occupied' 
                    ? 'border-rose-400 dark:border-red-500/60 bg-rose-50 dark:bg-red-950/25 hover:bg-rose-100 dark:hover:bg-red-950/40 shadow-md' 
                    : isReserved
                    ? 'border-amber-400 dark:border-amber-500/70 bg-amber-50 dark:bg-amber-950/25 hover:bg-amber-100 dark:hover:bg-amber-950/40 shadow-md ring-1 ring-amber-400/50'
                    : 'border-emerald-400 dark:border-emerald-500/60 bg-emerald-50 dark:bg-emerald-950/25 hover:bg-emerald-100 dark:hover:bg-emerald-950/40 shadow-md' 
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">{table.tableNo}</span>
                    {isReserved && table.status === "Available" && (
                      <span className="block text-[10px] font-black text-amber-800 dark:text-amber-300 mt-0.5">
                        {reservation.bookingTime}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {isReserved && (
                      <span title={`Reserved for ${reservation.customerName}`} className="p-1 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-400">
                        <Clock className="w-4 h-4" />
                      </span>
                    )}
                    <Users className={`w-5 h-5 ${
                      table.status === 'Occupied' ? 'text-rose-600 dark:text-red-400' : isReserved ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                    }`} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p
                      className={`text-xs font-black uppercase tracking-wider ${
                        table.status === 'Occupied' 
                          ? 'text-rose-700 dark:text-rose-400' 
                          : isReserved 
                          ? 'text-amber-800 dark:text-amber-300' 
                          : 'text-emerald-800 dark:text-emerald-400'
                      }`}
                    >
                      {table.status === 'Occupied' ? 'Occupied' : isReserved ? 'Reserved' : 'Available'}
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold">{table.capacity} Seater</p>
                  </div>
                  {isReserved && table.status === "Available" && (
                    <p className="text-[10px] text-slate-800 dark:text-slate-300 truncate font-bold">
                      👤 {reservation.customerName}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
          {tables.length === 0 && (
            <div className="col-span-full py-10 text-center text-slate-500">
              No tables found. Please ask Admin to add tables.
            </div>
          )}
        </div>

        {/* Generate Invoice Overlay */}
        {generatedInvoice && (
          <ThermalReceipt invoice={generatedInvoice} isKot={isKotPrint} onClose={handleCloseReceipt} />
        )}

        {/* Room Guest Selection Modal */}
        {showRoomSelectModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl w-full max-w-lg shadow-2xl relative animate-fade-in max-h-[85vh] flex flex-col text-slate-900 dark:text-white">
              <button onClick={() => setShowRoomSelectModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-white">
                <X className="w-5 h-5"/>
              </button>
              <div className="flex items-center gap-2 mb-4 border-b border-slate-200 dark:border-slate-800 pb-3">
                <BedDouble className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-xl font-bold font-display text-slate-900 dark:text-slate-200">Select Active Room Guest</h2>
              </div>
              
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 font-medium">
                Select an occupied room below to create a KOT. When billed, this order will be automatically charged to the guest's room tab.
              </p>

              <div className="overflow-y-auto space-y-2.5 flex-1 pr-1 custom-scrollbar">
                {activeBookings.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 text-sm">
                    No currently checked-in rooms found.
                  </div>
                ) : (
                  activeBookings.map((b) => (
                    <div
                      key={b._id}
                      onClick={() => handleSelectRoomForKot(b)}
                      className="p-3.5 bg-slate-50 dark:bg-slate-850/80 border border-slate-200 dark:border-slate-700/60 hover:border-emerald-500/60 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl cursor-pointer transition-all flex items-center justify-between group active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold font-mono text-sm">
                          {b.room?.roomNumber || "R"}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-slate-200 text-sm group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                            Room {b.room?.roomNumber}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {b.guests?.[0]?.name || "Guest"} • {b.guests?.[0]?.phone || "No phone"}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 group-hover:bg-emerald-500/20">
                        Select Room →
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Table Reservations Modal (Exact SecureBillPro Flow & Design) */}
        {showBookingsModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl w-full max-w-2xl shadow-2xl relative animate-fade-in max-h-[85vh] flex flex-col text-slate-900 dark:text-white">
              <button
                onClick={() => setShowBookingsModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-saffron-600 dark:text-amber-400 border border-amber-500/20">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold font-display text-slate-900 dark:text-slate-200">
                    Table Reservations & Bookings
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                    View upcoming table reservations made by customers via QR standee
                  </p>
                </div>
              </div>

              {tableBookings.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  <CalendarDays className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  No table bookings found.
                </div>
              ) : (
                <div className="overflow-y-auto flex-1 space-y-3 pr-1 custom-scrollbar">
                  {tableBookings.map((b) => (
                    <div
                      key={b._id}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex flex-col items-center justify-center text-amber-800 dark:text-amber-400 font-mono font-bold shrink-0">
                          <span className="text-[9px] uppercase">Table</span>
                          <span className="text-sm">{b.tableNo || "Any"}</span>
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-200 text-sm flex items-center gap-2">
                            <span>{b.customerName}</span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                b.status === "confirmed"
                                  ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                                  : b.status === "completed"
                                  ? "bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-500/30"
                                  : b.status === "cancelled"
                                  ? "bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/30"
                                  : "bg-amber-500/20 text-amber-800 dark:text-amber-400 border border-amber-500/30"
                              }`}
                            >
                              {b.status}
                            </span>
                          </p>
                          <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5">
                            📞 {b.customerMobile} • 👥 {b.guestsCount} Guests • 📅 <span className="text-amber-800 dark:text-amber-400 font-bold">{b.bookingDate} at {b.bookingTime}</span>
                          </p>
                          {b.specialRequests && (
                            <p className="text-[11px] text-amber-800/90 dark:text-amber-300/80 mt-1 italic font-medium">
                              "{b.specialRequests}"
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Staff Actions: Allocate Table & Seat Guest / Complete */}
                      <div className="flex flex-wrap sm:flex-col items-end gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-800">
                        {/* Table Selector Dropdown */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Assign:</span>
                          <select
                            value={b.tableNo || ""}
                            onChange={async (e) => {
                              const newTableNo = e.target.value;
                              try {
                                await tableBookingAPI.updateBooking(b._id, { tableNo: newTableNo });
                                fetchTableBookings();
                                fetchTables();
                                showSuccess("Table Allocated!", `Reservation assigned to Table ${newTableNo || "Any"}`);
                              } catch (err) {
                                showError("Failed", err.response?.data?.message || "Could not allocate table");
                              }
                            }}
                            className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-saffron-700 dark:text-amber-400 text-xs font-bold rounded-lg px-2 py-1 focus:outline-none focus:border-amber-500"
                          >
                            <option value="">-- Table --</option>
                            {tables.map((tbl) => (
                              <option key={tbl._id} value={tbl.tableNo}>
                                Table {tbl.tableNo} ({tbl.capacity}P)
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5">
                          {b.status === "confirmed" && (
                            <>
                              <button
                                type="button"
                                onClick={async () => {
                                  // Find the table object
                                  const tableObj = tables.find((t) => String(t.tableNo) === String(b.tableNo));
                                  if (!tableObj) {
                                    showError("Select Table", "Please assign a table from the dropdown first before seating guest!");
                                    return;
                                  }
                                  // Mark booking completed and seat guest
                                  await tableBookingAPI.updateBooking(b._id, { status: "completed" });
                                  setShowBookingsModal(false);
                                  // Pre-fill customer details in checkoutData
                                  setCheckoutData(prev => ({
                                    ...prev,
                                    customerName: b.customerName || "",
                                    customerMobile: b.customerMobile || "",
                                    customerEmail: b.customerEmail || "",
                                    paymentMode: "Cash"
                                  }));
                                  handleTableClick(tableObj);
                                  showSuccess("Guest Seated!", `Opening KOT menu for Table ${b.tableNo}`);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] transition-all shadow-sm flex items-center gap-1"
                              >
                                <UtensilsCrossed className="w-3 h-3" />
                                <span>Seat Guest & KOT</span>
                              </button>

                              <button
                                type="button"
                                onClick={async () => {
                                  await tableBookingAPI.updateBooking(b._id, { status: "completed" });
                                  fetchTableBookings();
                                  fetchTables();
                                  showSuccess("Completed", "Reservation marked as completed/seated.");
                                }}
                                title="Mark Completed (Release Reserved Status)"
                                className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-transparent font-bold text-[11px] transition-all"
                              >
                                Mark Done
                              </button>
                            </>
                          )}

                          {b.status === "pending" && (
                            <button
                              type="button"
                              onClick={async () => {
                                await tableBookingAPI.updateBooking(b._id, { status: "confirmed" });
                                fetchTableBookings();
                                fetchTables();
                                showSuccess("Confirmed", "Reservation confirmed.");
                              }}
                              className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] transition-all"
                            >
                              Confirm
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Live Waitlist & Digital Token Queue Modal */}
        {showWaitlistModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl w-full max-w-3xl shadow-2xl relative animate-fade-in max-h-[88vh] flex flex-col text-slate-900 dark:text-white">
              {/* Close button */}
              <button
                onClick={() => setShowWaitlistModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="flex items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 mb-4 pr-8">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                    <Ticket className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Live Dining Waitlist & Queue</span>
                      {waitlistActive.length > 0 && (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500 text-slate-950 font-black">
                          {waitlistActive.length} In Line
                        </span>
                      )}
                    </h2>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                      Real-time walk-in guest queue when tables are full • Call & Seat guests
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={fetchWaitlist}
                  disabled={waitlistLoading}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all text-xs flex items-center gap-1.5 font-bold cursor-pointer"
                  title="Refresh Queue"
                >
                  <RefreshCw className={`w-4 h-4 ${waitlistLoading ? "animate-spin text-cyan-500" : ""}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>

              {/* Sub-Tabs: Active Queue | + Walk-in Guest | History */}
              <div className="flex items-center gap-2 mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">
                <button
                  type="button"
                  onClick={() => setWaitlistTab("active")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    waitlistTab === "active"
                      ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/20"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Active Queue ({waitlistActive.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setWaitlistTab("walkin")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    waitlistTab === "walkin"
                      ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/20"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Add Walk-In Guest</span>
                </button>

                <button
                  type="button"
                  onClick={() => setWaitlistTab("history")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    waitlistTab === "history"
                      ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/20"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Seated Today ({waitlistCompleted.length})</span>
                </button>
              </div>

              {/* Tab 1: Active Queue */}
              {waitlistTab === "active" && (
                <div className="overflow-y-auto flex-1 space-y-3 pr-1 custom-scrollbar">
                  {waitlistActive.length === 0 ? (
                    <div className="py-12 text-center text-slate-400">
                      <Ticket className="w-12 h-12 text-slate-400 mx-auto mb-2 opacity-50" />
                      <p className="font-bold text-slate-700 dark:text-slate-300">No customers waiting right now!</p>
                      <p className="text-xs text-slate-500 mt-1">
                        When dining tables are full, guests can scan QR standee or you can click "+ Add Walk-In Guest" to issue a token.
                      </p>
                      <button
                        type="button"
                        onClick={() => setWaitlistTab("walkin")}
                        className="mt-4 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs inline-flex items-center gap-1.5 transition-all shadow-md shadow-cyan-600/20"
                      >
                        <UserPlus className="w-4 h-4" /> Issue Walk-In Token
                      </button>
                    </div>
                  ) : (
                    waitlistActive.map((entry, index) => {
                      const minutesWaiting = Math.max(
                        1,
                        Math.round((new Date() - new Date(entry.createdAt)) / 60000)
                      );
                      const availableTables = (tables || []).filter((t) => t.status === "Available");

                      return (
                        <div
                          key={entry._id}
                          className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                            entry.status === "called"
                              ? "bg-cyan-500/10 border-cyan-500/40 ring-1 ring-cyan-500/30"
                              : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800"
                          }`}
                        >
                          {/* Left: Token info */}
                          <div className="flex items-start gap-3.5">
                            <div className="w-14 h-14 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex flex-col items-center justify-center text-cyan-800 dark:text-cyan-300 font-mono font-black shrink-0 shadow-sm">
                              <span className="text-[10px] uppercase font-bold text-cyan-600 dark:text-cyan-400">#Pos {index + 1}</span>
                              <span className="text-base">{entry.tokenNo}</span>
                            </div>

                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
                                  {entry.customerName}
                                </h4>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                    entry.status === "called"
                                      ? "bg-blue-500 text-white animate-pulse"
                                      : "bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30"
                                  }`}
                                >
                                  {entry.status === "called" ? "📣 Called - Table Ready" : "⏳ Waiting"}
                                </span>
                                {entry.assignedTableNo && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                                    Table {entry.assignedTableNo}
                                  </span>
                                )}
                              </div>

                              <p className="text-slate-600 dark:text-slate-400 text-xs mt-1 flex items-center gap-3 flex-wrap">
                                <span className="flex items-center gap-1 font-semibold">
                                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                                  <a href={`tel:${entry.customerMobile}`} className="hover:underline">{entry.customerMobile}</a>
                                </span>
                                <span className="flex items-center gap-1 font-semibold">
                                  <Users className="w-3.5 h-3.5 text-slate-400" />
                                  {entry.guestsCount} Guests
                                </span>
                                <span className="text-amber-800 dark:text-amber-400 font-bold">
                                  ⏱ {minutesWaiting}m waiting
                                </span>
                              </p>

                              {entry.notes && (
                                <p className="text-xs text-slate-500 italic mt-1 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg inline-block">
                                  Note: "{entry.notes}"
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Right: Actions (Table Selection, Call, Seat, No-Show) */}
                          <div className="flex flex-wrap items-center gap-2 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-200 dark:border-slate-800">
                            {/* Available Tables Dropdown */}
                            <div className="flex items-center gap-1.5">
                              <select
                                defaultValue={entry.assignedTableNo || ""}
                                id={`select-tbl-${entry._id}`}
                                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold rounded-xl px-2.5 py-2 focus:outline-none focus:border-cyan-500 shadow-sm"
                              >
                                <option value="">-- Pick Table --</option>
                                {availableTables.map((tbl) => (
                                  <option key={tbl._id} value={tbl.tableNo}>
                                    Table {tbl.tableNo} ({tbl.capacity}P)
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Call Guest Button */}
                            <button
                              type="button"
                              onClick={() => {
                                const selEl = document.getElementById(`select-tbl-${entry._id}`);
                                const chosenTable = selEl?.value || entry.assignedTableNo;
                                handleCallGuest(entry, chosenTable);
                              }}
                              className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-cyan-600/20 active:scale-95 cursor-pointer"
                              title="Alert customer that table is ready"
                            >
                              <PhoneCall className="w-3.5 h-3.5" />
                              <span>{entry.status === "called" ? "Call Again" : "Call Guest"}</span>
                            </button>

                            {/* Seat Guest & Open KOT */}
                            <button
                              type="button"
                              onClick={() => {
                                const selEl = document.getElementById(`select-tbl-${entry._id}`);
                                const chosenTable = selEl?.value || entry.assignedTableNo;
                                handleSeatGuest(entry, chosenTable);
                              }}
                              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer"
                            >
                              <UtensilsCrossed className="w-3.5 h-3.5" />
                              <span>Seat & KOT</span>
                            </button>

                            {/* No-Show / Cancel */}
                            <button
                              type="button"
                              onClick={() => handleUpdateWaitlistStatus(entry._id, "no_show")}
                              className="px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-500/10 hover:text-rose-600 text-slate-500 dark:text-slate-400 font-bold text-xs transition-all border border-slate-200 dark:border-slate-700"
                              title="Guest did not show up"
                            >
                              No Show
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Tab 2: Add Walk-In Guest Form */}
              {waitlistTab === "walkin" && (
                <form onSubmit={handleAddWalkinGuest} className="overflow-y-auto flex-1 space-y-4 pr-1">
                  <div className="bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/30 p-3.5 rounded-2xl text-xs text-cyan-900 dark:text-cyan-200 flex items-center gap-3">
                    <Ticket className="w-5 h-5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                    <p>
                      Walk-in guest arrived at the counter and dining tables are full? Issue them a live queue token. They will be notified when a table becomes available.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Guest Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={newWalkin.customerName}
                        onChange={(e) => setNewWalkin({ ...newWalkin, customerName: e.target.value })}
                        placeholder="e.g. Ramesh Kumar"
                        className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2.5 text-sm outline-none focus:border-cyan-500 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Mobile Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={newWalkin.customerMobile}
                        onChange={(e) => setNewWalkin({ ...newWalkin, customerMobile: e.target.value })}
                        placeholder="10-digit mobile number"
                        className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2.5 text-sm outline-none focus:border-cyan-500 font-mono font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Party Size (Guests Count)
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setNewWalkin({ ...newWalkin, guestsCount: Math.max(1, newWalkin.guestsCount - 1) })}
                          className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 font-black text-base hover:bg-slate-300 dark:hover:bg-slate-700 flex items-center justify-center transition-all"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={newWalkin.guestsCount}
                          onChange={(e) => setNewWalkin({ ...newWalkin, guestsCount: Number(e.target.value) || 1 })}
                          className="w-20 text-center bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-2 font-bold text-base outline-none focus:border-cyan-500"
                        />
                        <button
                          type="button"
                          onClick={() => setNewWalkin({ ...newWalkin, guestsCount: newWalkin.guestsCount + 1 })}
                          className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 font-black text-base hover:bg-slate-300 dark:hover:bg-slate-700 flex items-center justify-center transition-all"
                        >
                          +
                        </button>
                        <span className="text-xs text-slate-500 ml-1 font-semibold">Guests</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Preferred Table (Optional)
                      </label>
                      <select
                        value={newWalkin.assignedTableNo}
                        onChange={(e) => setNewWalkin({ ...newWalkin, assignedTableNo: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2.5 text-sm outline-none focus:border-cyan-500 font-semibold"
                      >
                        <option value="">Any Available Table</option>
                        {tables.map((t) => (
                          <option key={t._id} value={t.tableNo}>
                            Table {t.tableNo} ({t.capacity} Seater) - {t.status}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Special Notes / Seating Requests
                    </label>
                    <input
                      type="text"
                      value={newWalkin.notes}
                      onChange={(e) => setNewWalkin({ ...newWalkin, notes: e.target.value })}
                      placeholder="e.g. AC section, high chair needed, near window"
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2.5 text-sm outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="pt-2">
                    <MagneticButton className="w-full">
                      <button
                        type="submit"
                        disabled={isSubmittingWalkin}
                        className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-extrabold rounded-xl shadow-lg shadow-cyan-600/20 text-sm transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer disabled:opacity-50"
                      >
                        <Ticket className="w-4 h-4" />
                        <span>{isSubmittingWalkin ? "Generating Token..." : "Issue Queue Token"}</span>
                      </button>
                    </MagneticButton>
                  </div>
                </form>
              )}

              {/* Tab 3: Completed History */}
              {waitlistTab === "history" && (
                <div className="overflow-y-auto flex-1 space-y-2.5 pr-1 custom-scrollbar">
                  {waitlistCompleted.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      No completed queue entries yet today.
                    </div>
                  ) : (
                    waitlistCompleted.map((entry) => (
                      <div
                        key={entry._id}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded-lg border border-cyan-500/20">
                            {entry.tokenNo}
                          </span>
                          <div>
                            <h5 className="font-bold text-slate-900 dark:text-white">{entry.customerName}</h5>
                            <p className="text-slate-500 text-[11px]">
                              {entry.customerMobile} • {entry.guestsCount} Guests
                              {entry.assignedTableNo && ` • Seated at Table ${entry.assignedTableNo}`}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            entry.status === "seated"
                              ? "bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 border border-emerald-500/30"
                              : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                          }`}
                        >
                          {entry.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ORDER VIEW
  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 md:p-6 min-h-[calc(100vh-80px)]">
      {/* LEFT: MENU ITEMS */}
      <div className="flex-1 flex flex-col gap-4 no-print">
        {/* Search & Categories (Moved to Top) */}
        <div className="flex flex-col gap-3">
          <div className="relative w-full">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
              currentTheme === "light" ? "text-slate-400" : "text-slate-500"
            }`} />
            <input
              type="text"
              placeholder="Search dishes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none transition-colors border ${
                currentTheme === "light"
                  ? "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-saffron-500 shadow-sm"
                  : "bg-slate-900/60 border-slate-800 text-slate-200 placeholder:text-slate-500 focus:border-saffron-500"
              }`}
            />
          </div>
          <div className="flex flex-wrap gap-2 pb-1">
            {categories.map((cat) => {
              const isTop = cat === "🔥 Top Orders" || cat === "Top Orders";
              const isSelected = selectedCategory === cat;

              let btnClasses = "px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 cursor-pointer ";

              if (isSelected) {
                if (isTop) {
                  btnClasses += "bg-gradient-to-r from-rose-600 via-amber-600 to-saffron-600 text-white shadow-lg shadow-rose-500/30 font-black scale-105 border border-rose-500/40";
                } else {
                  btnClasses += "bg-gradient-to-r from-saffron-500 to-saffron-600 text-slate-950 font-black shadow-md shadow-saffron-500/20";
                }
              } else {
                if (isTop) {
                  btnClasses += currentTheme === "light"
                    ? "bg-rose-50 border-2 border-rose-300 text-rose-700 hover:bg-rose-100 font-black shadow-sm"
                    : "bg-rose-950/40 border border-rose-500/40 text-rose-300 hover:bg-rose-900/40 font-extrabold";
                } else {
                  btnClasses += currentTheme === "light"
                    ? "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-saffron-500/30 shadow-sm font-semibold"
                    : "glass-card text-slate-400 hover:text-slate-200 hover:border-saffron-500/30";
                }
              }

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={btnClasses}
                >
                  {isTop && (
                    <Flame
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isSelected
                          ? "text-white fill-white"
                          : currentTheme === "light"
                          ? "text-rose-600 fill-rose-600"
                          : "text-rose-400 fill-rose-400"
                      }`}
                    />
                  )}
                  <span className={isSelected && isTop ? "text-white font-black" : ""}>
                    {cat.replace(/^🔥\s*/, "")}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Table/Room Info & Back Button */}
        <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-3 flex-wrap">
          <MagneticButton>
            <button onClick={goBackToTables} className="p-2 bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-saffron-500/40 transition-colors cursor-pointer">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </MagneticButton>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold font-display text-slate-900 dark:text-slate-200">
              {selectedTable?.orderType === 'Table' ? 'Table ' : ''}
              <span className="text-saffron-700 dark:text-saffron-400 font-mono font-black">{selectedTable?.tableNo}</span>
            </h2>
            {selectedTable?.guestName && (
              <span className="text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-bold px-2.5 py-1 rounded-lg">
                Guest: {selectedTable.guestName}
              </span>
            )}
          </div>
          <span className={`px-2.5 py-1 text-xs rounded-lg font-bold uppercase ${selectedTable?.status === 'Available' ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-700 dark:text-red-400 border border-red-500/30'}`}>
            {selectedTable?.status}
          </span>
        </div>

        {/* Dish Grid & Pagination */}
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 content-start">
            {filteredDishes.map((dish) => (
              <div
                key={dish._id}
                onClick={() => addToCart(dish)}
                className="glass-card rounded-2xl overflow-hidden hover:border-saffron-500/40 transition-all duration-300 cursor-pointer flex flex-col group active:scale-[0.98] select-none hover:shadow-lg hover:shadow-saffron-500/5"
              >
                <div className="h-32 w-full bg-slate-100 dark:bg-slate-850 relative overflow-hidden shrink-0">
                  <img
                    src={dish.image}
                    alt={dish.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=60"; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60"></div>
                  {/* Top Order / Bestseller Badge */}
                  {dish.topRank && (
                    <span className="absolute top-2 left-2 bg-rose-600 text-white font-black text-[10px] px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1 backdrop-blur-sm border border-rose-400/40 z-10">
                      <Flame className="w-3 h-3 fill-white text-white shrink-0" />
                      <span className="text-white font-black whitespace-nowrap">
                        #{dish.topRank} Top Seller {dish.salesCount > 0 ? `(${dish.salesCount} sold)` : ''}
                      </span>
                    </span>
                  )}
                  <span className="absolute bottom-2.5 right-2.5 bg-white/95 dark:bg-lagoon-950/90 text-saffron-700 dark:text-saffron-400 border border-saffron-400/50 dark:border-saffron-500/30 font-black px-2 py-0.5 rounded-lg text-xs font-mono backdrop-blur-sm shadow-sm z-10">
                    ₹{dish.price}
                  </span>
                </div>
                <div className="p-2.5 flex flex-col gap-1.5 flex-1">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-slate-200 line-clamp-2 leading-snug break-words">
                        {dish.name}
                      </h3>
                      {dish.dishId && (
                        <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded border whitespace-nowrap ${
                          currentTheme === "light"
                            ? "bg-slate-100 text-saffron-700 border-saffron-500/30"
                            : "bg-lagoon-900/80 text-saffron-400 border-saffron-500/20"
                        }`}>
                          {dish.dishId}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5 font-semibold">{dish.category}</p>
                  </div>
                  <button className={`w-full mt-auto py-1.5 border rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    currentTheme === "light"
                      ? "bg-slate-100 hover:bg-saffron-50 border-slate-200 hover:border-saffron-500/40 text-slate-800 hover:text-saffron-700 font-bold"
                      : "bg-slate-900/60 hover:bg-saffron-500/15 border-slate-800 hover:border-saffron-500/40 text-slate-300 hover:text-saffron-400 font-bold"
                  }`}>
                    <span>Add to Cart</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {serverTotalPages > 1 && (
            <div className="flex justify-center items-center gap-4 pt-2 border-t border-slate-200 dark:border-slate-800 no-print pb-2 mt-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 rounded-lg disabled:opacity-50 hover:bg-slate-200 dark:hover:bg-slate-700 hover:border-saffron-500/30 hover:text-saffron-700 dark:hover:text-saffron-400 transition-all text-sm font-semibold"
              >
                Prev
              </button>
              <span className="text-slate-600 dark:text-slate-400 text-sm font-semibold">
                Page {currentPage} of {serverTotalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(serverTotalPages, p + 1))}
                disabled={currentPage === serverTotalPages}
                className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 rounded-lg disabled:opacity-50 hover:bg-slate-200 dark:hover:bg-slate-700 hover:border-saffron-500/30 hover:text-saffron-700 dark:hover:text-saffron-400 transition-all text-sm font-semibold"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: CART / KOT */}
      <div className="w-full lg:w-96 flex flex-col gap-4 no-print shrink-0">
        <div className="glass-card rounded-2xl flex flex-col flex-1 min-h-[400px]">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/40 flex justify-between items-center rounded-t-2xl">
            <h3 className="font-bold text-slate-900 dark:text-slate-200">Current KOT</h3>
            <span className="bg-saffron-500/15 text-saffron-700 dark:text-saffron-400 border border-saffron-500/30 px-2.5 py-0.5 rounded-md text-xs font-black font-mono">{cart.length} Items</span>
          </div>

          <div className="flex-1 p-3 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800/50">
            {cart.length > 0 ? (
              cart.map((item) => (
                <div key={item.dishId} className="py-2.5 flex justify-between items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-200 line-clamp-2">{item.name}</p>
                      {item.printedQuantity > 0 && (
                        <span className="px-1.5 py-0.5 bg-amber-500/20 border border-amber-500/30 text-amber-500 dark:text-amber-400 rounded text-[9px] font-bold">
                          KOT Printed ({item.printedQuantity})
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-saffron-700 dark:text-saffron-400 font-mono font-black">₹{item.price}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => handleItemVoidAttempt(item.dishId, -1)} className="p-1 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded hover:border-saffron-500/40 cursor-pointer"><Minus className="w-3 h-3" /></button>
                    <span className="text-xs font-bold font-mono w-4 text-center text-slate-900 dark:text-slate-200">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.dishId, 1)} className="p-1 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded hover:border-saffron-500/40 cursor-pointer"><Plus className="w-3 h-3" /></button>
                    <button onClick={() => handleItemVoidAttempt(item.dishId, -999)} className="p-1 text-rose-600 dark:text-red-400 hover:bg-red-500/20 rounded ml-1 cursor-pointer"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-slate-500 text-sm">No items in KOT. Add dishes from the menu.</div>
            )}
          </div>

          <div className="p-4 bg-slate-50/80 dark:bg-slate-900/40 border-t border-slate-200 dark:border-slate-800 rounded-b-2xl">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2 cursor-pointer font-bold">
                <input type="checkbox" checked={applyGST} onChange={(e) => setApplyGST(e.target.checked)} className="accent-saffron-500" />
                Apply {foodGstRate}% GST
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">Discount %</span>
                <input 
                  type="number" 
                  min="0"
                  max="100"
                  value={discountPercentage}
                  onChange={e => setDiscountPercentage(Number(e.target.value) || 0)}
                  className="w-16 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-2 py-1 text-xs outline-none focus:border-saffron-500 text-right font-bold"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="flex justify-between text-xs py-1 text-slate-600 dark:text-slate-400 font-semibold"><span>Subtotal</span><span className="font-mono">₹{subTotal.toFixed(2)}</span></div>
            {discountAmount > 0 && <div className="flex justify-between text-xs py-1 text-saffron-700 dark:text-saffron-400 font-bold"><span>Discount ({discountPercentage}%)</span><span className="font-mono">-₹{discountAmount.toFixed(2)}</span></div>}
            {applyGST && <div className="flex justify-between text-xs py-1 text-slate-600 dark:text-slate-400 font-semibold"><span>GST ({foodGstRate}%)</span><span className="font-mono">₹{tax.toFixed(2)}</span></div>}
            <div className="flex justify-between font-bold text-slate-900 dark:text-slate-200 py-1.5 border-t border-slate-200 dark:border-slate-800 mt-1"><span>Grand Total</span><span className="text-saffron-700 dark:text-saffron-400 font-mono font-black text-lg">₹{grandTotal.toFixed(2)}</span></div>
            
            <div className="mt-4 flex flex-col gap-2">
              <MagneticButton className="w-full">
                <button 
                  type="button"
                  onClick={handleSaveOrder}
                  disabled={loading || cart.length === 0}
                  className="w-full py-2.5 bg-gradient-to-r from-saffron-500 to-saffron-600 hover:from-saffron-400 hover:to-saffron-500 text-lagoon-950 font-black rounded-xl shadow-lg shadow-saffron-500/20 active:scale-[0.98] transition-all flex justify-center items-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
                >
                  Save / Send to Kitchen
                </button>
              </MagneticButton>
              
              {selectedTable?.status === "Occupied" && (
                <>
                  <MagneticButton className="w-full">
                    <button 
                      type="button"
                      onClick={handlePrintProforma}
                      disabled={loading}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-md shadow-blue-600/20 flex justify-center items-center gap-2 mt-1 text-sm disabled:opacity-50 cursor-pointer"
                    >
                      Print Proforma Bill
                    </button>
                  </MagneticButton>
                  <MagneticButton className="w-full">
                    <button 
                      type="button"
                      onClick={promptCheckout}
                      disabled={loading}
                      className="w-full mt-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-md shadow-emerald-600/20 flex justify-center items-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
                    >
                      Generate Final Bill & Pay
                    </button>
                  </MagneticButton>
                  <MagneticButton className="w-full">
                    <button 
                      type="button"
                      onClick={handleCancelKOT}
                      disabled={loading}
                      className="w-full mt-2 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold rounded-xl transition-all shadow-md shadow-rose-600/25 flex justify-center items-center gap-2 text-xs disabled:opacity-50 cursor-pointer border border-rose-700"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-white" />
                      Cancel Order / KOT
                    </button>
                  </MagneticButton>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Generate Invoice Overlay for Order View */}
      {generatedInvoice && (
        <ThermalReceipt invoice={generatedInvoice} isKot={isKotPrint} onClose={handleCloseReceipt} />
      )}

      {/* Proforma Invoice Overlay */}
      {proformaInvoice && (
        <ThermalReceipt invoice={proformaInvoice} isKot={false} onClose={() => setProformaInvoice(null)} />
      )}

      {/* Checkout Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl w-full max-w-md shadow-2xl relative animate-fade-in text-slate-900 dark:text-white">
            <button onClick={() => setShowCheckoutModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-white">
              <X className="w-5 h-5"/>
            </button>
            <h2 className="text-xl font-bold font-display text-slate-900 dark:text-slate-200 mb-6 border-b border-slate-200 dark:border-slate-800 pb-2">Final Checkout</h2>
            <form onSubmit={handleCheckout} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 mb-1">Payment Mode *</label>
                <select 
                  value={checkoutData.paymentMode} 
                  onChange={e => setCheckoutData({...checkoutData, paymentMode: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-saffron-500 font-semibold"
                >
                  {selectedTable?.orderType === "Room" ? (
                    <>
                      <option value="Added to Room">🏨 Added to Room (Post to Folio)</option>
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="Card">Card</option>
                    </>
                  ) : (
                    <>
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="Card">Card</option>
                      <option value="Credit Bill">Credit Bill</option>
                      <option value="NC Bill">NC Bill (Non-Chargeable)</option>
                    </>
                  )}
                </select>
              </div>
              {checkoutData.paymentMode === "Added to Room" && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/20 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs">
                  <p className="font-bold">✓ Direct Room Folio Post</p>
                  <p className="mt-0.5 text-emerald-700 dark:text-emerald-400/80">
                    {selectedTable?.tableNo ? `This bill (₹${grandTotal.toFixed(2)}) will be added directly to ${selectedTable.tableNo} final checkout balance.` : "Will be linked to the room folio."}
                  </p>
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 mb-1">Customer Name {['NC Bill', 'Credit Bill'].includes(checkoutData.paymentMode) ? '*' : ''}</label>
                <input 
                  type="text" 
                  value={checkoutData.customerName}
                  onChange={e => setCheckoutData({...checkoutData, customerName: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-saffron-500"
                  placeholder="John Doe"
                  required={['NC Bill', 'Credit Bill'].includes(checkoutData.paymentMode)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 mb-1">Mobile Number</label>
                <input 
                  type="tel" 
                  value={checkoutData.customerMobile}
                  onChange={e => setCheckoutData({...checkoutData, customerMobile: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-saffron-500"
                  placeholder="10-digit mobile"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 mb-1">Email (Optional)</label>
                <input 
                  type="email" 
                  value={checkoutData.customerEmail}
                  onChange={e => setCheckoutData({...checkoutData, customerEmail: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-saffron-500"
                />
              </div>
              <MagneticButton className="w-full">
                <button type="submit" disabled={loading} className="mt-4 w-full py-3 bg-gradient-to-r from-saffron-500 to-saffron-600 hover:from-saffron-400 hover:to-saffron-500 text-lagoon-950 font-black rounded-xl shadow-lg shadow-saffron-500/20 text-sm transition-all active:scale-[0.98] cursor-pointer">
                  {loading ? 'Processing...' : (checkoutData.paymentMode === 'Added to Room' ? 'Post to Room & Complete' : 'Complete Checkout & Print')}
                </button>
              </MagneticButton>
            </form>
          </div>
        </div>
      )}

      {/* Anti-Theft KOT & Void OTP Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-rose-500/30 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-6 relative">
            <button
              onClick={() => setShowOtpModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  Owner Authorization OTP
                </h3>
                <p className="text-xs text-rose-400 font-semibold">
                  Anti-Theft Fraud Prevention Active
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-white/10 mb-4 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Action:</span>
                <span className="font-bold text-white uppercase">
                  {otpModalData.type === "full_order" ? "Cancel Entire KOT" : "Void Food Item"}
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Location:</span>
                <span className="font-bold text-amber-400">{otpModalData.tableNo}</span>
              </div>
              {otpModalData.type === "item_void" && (
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">Voiding Item:</span>
                  <span className="font-bold text-white">{otpModalData.itemName} ({otpModalData.quantityToVoid}x)</span>
                </div>
              )}
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Void Amount:</span>
                <span className="font-mono font-bold text-rose-400 text-sm">₹{otpModalData.amount}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-sky-950/40 border border-sky-500/30 text-sky-200 text-xs flex items-start gap-2 mb-4">
              <KeyRound className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <p>
                Owner ke <b>Telegram</b> par instant alert aur 4-digit OTP bhej diya gaya hai. Owner se OTP lekar enter karein.
              </p>
            </div>

            <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider text-center">
                  Enter 4-Digit Owner OTP
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={otpModalData.otp}
                  onChange={(e) =>
                    setOtpModalData((prev) => ({
                      ...prev,
                      otp: e.target.value.replace(/[^0-9]/g, "").slice(0, 4),
                      error: "",
                    }))
                  }
                  autoFocus
                  placeholder="• • • •"
                  className="w-full text-center text-3xl font-mono font-black tracking-widest bg-slate-950 border border-white/20 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 text-rose-300 rounded-xl py-3 outline-none transition-all placeholder:text-slate-600"
                />
              </div>

              {otpModalData.error && (
                <div className="p-2.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold text-center">
                  {otpModalData.error}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOtpModal(false)}
                  className="w-1/3 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={otpModalData.isSubmitting || otpModalData.otp.length < 4}
                  className="flex-1 py-3 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white font-black rounded-xl shadow-lg shadow-rose-500/30 text-xs transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {otpModalData.isSubmitting ? "Verifying..." : "Verify & Authorize"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
