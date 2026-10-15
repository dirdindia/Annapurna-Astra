import React, { useState, useEffect } from "react";
import api, { tableAPI, orderAPI, tableBookingAPI } from "../../api";
import { UtensilsCrossed, Users, Plus, Minus, Trash2, Search, ArrowUpRight, ArrowLeft, Bike, ShoppingBag, Truck, X, BedDouble, CalendarClock, Calendar, Clock, Phone, AlertCircle, CalendarDays, CheckCircle, Hotel } from "lucide-react";
import { showError, showSuccess, showConfirm } from "../../utils/alerts";
import ThermalReceipt from "../../components/ThermalReceipt";

export default function StaffKotBilling() {
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
  const [categories, setCategories] = useState(["All"]);
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

  const [activeBookings, setActiveBookings] = useState([]);
  const [showRoomSelectModal, setShowRoomSelectModal] = useState(false);

  useEffect(() => {
    fetchTables();
    fetchVirtualOrders();
    fetchAllCategories();
    fetchActiveBookings();
    fetchTableBookings();

    // Listen for live table booking confirmation & order updates
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
            if (data.type === "table_booking_updated" || data.type === "new_table_booking" || data.type === "order_billed" || data.type === "order_cancelled") {
              fetchTables();
              fetchVirtualOrders();
              fetchTableBookings();
            }
          } catch (e) {}
        };
      } catch (err) {}
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, []);

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
      const res = await api.get("api/room-bookings?status=Checked-In");
      if (res.data.success) {
        setActiveBookings(res.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching active rooms:", error);
    }
  };

  const fetchVirtualOrders = async () => {
    try {
      const res = await api.get("api/orders/virtual/active");
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
      const res = await api.get("api/dishes");
      if (res.data.success) {
        const cats = ["All", ...new Set(res.data.dishes.map((d) => d.category))];
        setCategories(cats);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchDishes = async () => {
    try {
      const categoryParam = selectedCategory === "All" ? "" : encodeURIComponent(selectedCategory);
      const res = await api.get(`api/dishes?page=${currentPage}&limit=${itemsPerPage}&search=${encodeURIComponent(search)}&category=${categoryParam}`);
      if (res.data.success) {
        // filter out unavailable dishes just in case, though ideally backend does this
        const available = res.data.dishes.filter(d => d.available);
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

  const subTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = Math.round((subTotal * (discountPercentage || 0) / 100) * 100) / 100;
  const tax = applyGST ? Math.round(((subTotal - discountAmount) * 0.05) * 100) / 100 : 0; // 5% GST
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

        // // Update backend printed quantities for these new items
        // try {
        //   const updateData = newKotItems.map(item => ({
        //     dishId: item.dishId,
        //     quantity: item.quantity // the diffQty
        //   }));
        //   await orderAPI.markKotPrinted(savedOrder._id, updateData);
        // } catch (e) {
        //   console.error("Failed to mark KOT as printed", e);
        // }

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
      "Are you sure you want to cancel this KOT? This will clear the order and make the table available.",
      "Yes, Cancel KOT",
      "No",
      "#ef4444"
    ).then(async (result) => {
      if (result.isConfirmed) {
        setLoading(true);
        try {
          await api.delete(`/api/orders/${activeOrderId}`);
          showSuccess("Cancelled", "KOT cancelled successfully");
          setCart([]);
          goBackToTables();
        } catch (error) {
          showError("Error", error.response?.data?.message || "Failed to cancel KOT");
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleCheckout = async (e) => {
    if(e) e.preventDefault();
    if (!activeOrderId) return;
    
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

      const res = await api.post(`api/orders/${activeOrderId}/checkout`, payload);
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

  const promptCheckout = () => {
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
            <h1 className="text-2xl md:text-3xl font-extrabold font-display text-transparent bg-clip-text bg-gradient-to-r from-saffron-400 to-saffron-600 flex items-center gap-3">
              <UtensilsCrossed className="w-7 h-7 text-saffron-500" /> KOT Dining & Delivery Tables
            </h1>
            <p className="text-slate-400 mt-1 text-xs md:text-sm font-medium">
              Manage live table orders, Swiggy, Zomato and parcel tokens
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <button 
            type="button"
            onClick={() => {
              fetchActiveBookings();
              setShowRoomSelectModal(true);
            }} 
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl flex items-center gap-2 font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all text-xs"
          >
            <BedDouble className="w-4 h-4"/> New Room Guest KOT
          </button>
          <button 
            type="button"
            onClick={() => handleCreateNewVirtual('Parcel')} 
            className="px-4 py-2.5 bg-gradient-to-r from-saffron-500 to-saffron-600 hover:from-saffron-400 hover:to-saffron-500 text-lagoon-950 rounded-xl flex items-center gap-2 font-bold shadow-md shadow-saffron-500/20 active:scale-95 transition-all text-xs"
          >
            <ShoppingBag className="w-4 h-4"/> New Parcel
          </button>
          <button 
            type="button"
            onClick={() => handleCreateNewVirtual('Swiggy')} 
            className="px-4 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl flex items-center gap-2 font-bold shadow-md shadow-orange-600/20 active:scale-95 transition-all text-xs"
          >
            <Bike className="w-4 h-4"/> New Swiggy Order
          </button>
          <button 
            type="button"
            onClick={() => handleCreateNewVirtual('Zomato')} 
            className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl flex items-center gap-2 font-bold shadow-md shadow-red-600/20 active:scale-95 transition-all text-xs"
          >
            <Bike className="w-4 h-4"/> New Zomato Order
          </button>
          
          {/* Table Reservations Pill Button (Exact SecureBillPro Flow) */}
          <button
            type="button"
            onClick={() => setShowBookingsModal(true)}
            className="px-4 py-2.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-400 hover:text-amber-300 rounded-xl flex items-center gap-2 font-bold text-xs transition-all shadow-sm active:scale-95"
          >
            <CalendarDays className="w-4 h-4 text-amber-400" />
            <span>Table Reservations</span>
            {tableBookings.filter((b) => b.status === "confirmed").length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950">
                {tableBookings.filter((b) => b.status === "confirmed").length} Active
              </span>
            )}
          </button>
        </div>

        {virtualOrders.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2 font-display">
              <Truck className="w-5 h-5 text-saffron-500"/> Active Room, Delivery & Parcel Orders
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {virtualOrders.map(order => {
                const isRoom = order.orderType === "Room";
                return (
                  <div 
                    key={order._id} 
                    onClick={() => handleVirtualOrderClick(order)} 
                    className={`p-4 rounded-2xl border-2 shadow-lg cursor-pointer transition-all active:scale-95 flex flex-col justify-between h-32 ${
                      isRoom 
                        ? "border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 hover:border-emerald-500/70"
                        : "border-saffron-500/40 bg-saffron-500/10 hover:bg-saffron-500/20 hover:border-saffron-500/70"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-xl font-bold text-slate-200 font-mono">{order.orderDisplayId}</span>
                      {isRoom ? (
                        <BedDouble className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <ShoppingBag className="w-5 h-5 text-saffron-400" />
                      )}
                    </div>
                    <div>
                      <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isRoom ? "text-emerald-400" : "text-saffron-400"}`}>
                        {order.orderType === "Room" ? "Room Guest" : order.orderType}
                      </p>
                      <p className="text-xs text-slate-400">{order.items.length} Items</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-lg font-bold text-slate-200 font-display">Dine-in Tables</h2>
          <div className="flex items-center gap-3 text-xs text-slate-400">
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
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all transform active:scale-95 flex flex-col justify-between h-36 relative ${
                  table.status === 'Occupied' 
                    ? 'border-red-500/50 bg-red-500/10 hover:bg-red-500/20 shadow-lg shadow-red-500/10' 
                    : isReserved
                    ? 'border-amber-500/60 bg-amber-500/10 hover:bg-amber-500/20 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/30'
                    : 'border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/20 shadow-lg shadow-emerald-500/10' 
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-2xl font-bold text-slate-200 font-mono">{table.tableNo}</span>
                    {isReserved && table.status === "Available" && (
                      <span className="block text-[10px] font-black text-amber-400 mt-0.5">
                        {reservation.bookingTime}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {isReserved && (
                      <span title={`Reserved for ${reservation.customerName}`} className="p-1 rounded-lg bg-amber-500/20 text-amber-400">
                        <Clock className="w-4 h-4" />
                      </span>
                    )}
                    <Users className={`w-5 h-5 ${
                      table.status === 'Occupied' ? 'text-red-400' : isReserved ? 'text-amber-400' : 'text-emerald-400'
                    }`} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p
                      className="text-xs font-black uppercase tracking-wider"
                      style={{
                        color: table.status === 'Occupied' ? '#f87171' : isReserved ? '#fbbf24' : '#34d399',
                      }}
                    >
                      {table.status === 'Occupied' ? 'Occupied' : isReserved ? 'Reserved' : 'Available'}
                    </p>
                    <p className="text-[11px] text-slate-400">{table.capacity} Seater</p>
                  </div>
                  {isReserved && table.status === "Available" && (
                    <p className="text-[10px] text-slate-300 truncate font-semibold">
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
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-lg shadow-2xl relative animate-fade-in max-h-[85vh] flex flex-col">
              <button onClick={() => setShowRoomSelectModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                <X className="w-5 h-5"/>
              </button>
              <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
                <BedDouble className="w-5 h-5 text-emerald-400" />
                <h2 className="text-xl font-bold font-display text-slate-200">Select Active Room Guest</h2>
              </div>
              
              <p className="text-xs text-slate-400 mb-4">
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
                      className="p-3.5 bg-slate-850/80 border border-slate-700/60 hover:border-emerald-500/60 hover:bg-emerald-500/10 rounded-xl cursor-pointer transition-all flex items-center justify-between group active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold font-mono text-sm">
                          {b.room?.roomNumber || "R"}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-200 text-sm group-hover:text-emerald-300 transition-colors">
                            Room {b.room?.roomNumber}
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {b.guests?.[0]?.name || "Guest"} • {b.guests?.[0]?.phone || "No phone"}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 group-hover:bg-emerald-500/20">
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
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl w-full max-w-2xl shadow-2xl relative animate-fade-in max-h-[85vh] flex flex-col">
              <button
                onClick={() => setShowBookingsModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4 border-b border-slate-800 pb-4">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold font-display text-slate-200">
                    Table Reservations & Bookings
                  </h2>
                  <p className="text-xs text-slate-400">
                    View upcoming table reservations made by customers via QR standee
                  </p>
                </div>
              </div>

              {tableBookings.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  <CalendarDays className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  No table bookings found.
                </div>
              ) : (
                <div className="overflow-y-auto flex-1 space-y-3 pr-1 custom-scrollbar">
                  {tableBookings.map((b) => (
                    <div
                      key={b._id}
                      className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex flex-col items-center justify-center text-amber-400 font-mono font-bold shrink-0">
                          <span className="text-[9px] uppercase">Table</span>
                          <span className="text-sm">{b.tableNo || "Any"}</span>
                        </div>
                        <div>
                          <p className="font-bold text-slate-200 text-sm flex items-center gap-2">
                            <span>{b.customerName}</span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                b.status === "confirmed"
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                  : b.status === "completed"
                                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                  : b.status === "cancelled"
                                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                  : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                              }`}
                            >
                              {b.status}
                            </span>
                          </p>
                          <p className="text-slate-400 text-[11px] mt-0.5">
                            📞 {b.customerMobile} • 👥 {b.guestsCount} Guests • 📅 <span className="text-amber-400 font-semibold">{b.bookingDate} at {b.bookingTime}</span>
                          </p>
                          {b.specialRequests && (
                            <p className="text-[11px] text-amber-300/80 mt-1 italic">
                              "{b.specialRequests}"
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Staff Actions: Allocate Table & Seat Guest / Complete */}
                      <div className="flex flex-wrap sm:flex-col items-end gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                        {/* Table Selector Dropdown */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-slate-400">Assign:</span>
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
                            className="bg-slate-900 border border-slate-700 text-amber-400 text-xs font-bold rounded-lg px-2 py-1 focus:outline-none focus:border-amber-500"
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
                                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[11px] transition-all"
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search dishes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900/60 border border-slate-800 text-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm outline-none focus:border-saffron-500 transition-colors"
            />
          </div>
          <div className="flex flex-wrap gap-2 pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all duration-200 ${
                  selectedCategory === cat
                    ? "bg-gradient-to-r from-saffron-500 to-saffron-600 text-lagoon-950 shadow-md shadow-saffron-500/20"
                    : "glass-card text-slate-400 hover:text-slate-200 hover:border-saffron-500/30"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Table/Room Info & Back Button */}
        <div className="flex items-center gap-4 border-b border-slate-800 pb-3 flex-wrap">
          <button onClick={goBackToTables} className="p-2 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-300 hover:text-white hover:border-saffron-500/40 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold font-display text-slate-200">
              {selectedTable?.orderType === 'Table' ? 'Table ' : ''}
              <span className="text-saffron-400 font-mono">{selectedTable?.tableNo}</span>
            </h2>
            {selectedTable?.guestName && (
              <span className="text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold px-2.5 py-1 rounded-lg">
                Guest: {selectedTable.guestName}
              </span>
            )}
          </div>
          <span className={`px-2.5 py-1 text-xs rounded-lg font-bold uppercase ${selectedTable?.status === 'Available' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
            {selectedTable?.status}
          </span>
        </div>

        {/* Dish Grid & Pagination */}
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 content-start">
            {currentDishes.map((dish) => (
              <div
                key={dish._id}
                onClick={() => addToCart(dish)}
                className="glass-card rounded-2xl overflow-hidden hover:border-saffron-500/40 transition-all duration-300 cursor-pointer flex flex-col group active:scale-[0.98] select-none hover:shadow-lg hover:shadow-saffron-500/5"
              >
                <div className="h-32 w-full bg-slate-850 relative overflow-hidden shrink-0">
                  <img
                    src={dish.image}
                    alt={dish.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=60"; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60"></div>
                  <span className="absolute bottom-2.5 right-2.5 bg-lagoon-950/90 text-saffron-400 border border-saffron-500/30 font-bold px-2 py-0.5 rounded-lg text-xs font-mono backdrop-blur-sm">
                    ₹{dish.price}
                  </span>
                </div>
                <div className="p-2.5 flex flex-col gap-1.5 flex-1">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-sm text-slate-200 line-clamp-2 leading-snug break-words">
                        {dish.name}
                      </h3>
                      {dish.dishId && <span className="shrink-0 text-[10px] bg-lagoon-900/80 text-saffron-400/90 px-1.5 py-0.5 rounded border border-saffron-500/20 whitespace-nowrap">{dish.dishId}</span>}
                    </div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">{dish.category}</p>
                  </div>
                  <button className="w-full mt-auto py-1.5 bg-slate-900/60 border border-slate-800 text-slate-300 hover:border-saffron-500/30 group-hover:bg-saffron-500/15 group-hover:text-saffron-400 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-all">
                    <span>Add to Cart</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 pt-2 border-t border-slate-800 no-print pb-2 mt-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-1.5 bg-slate-800/80 border border-slate-700/60 text-slate-300 rounded-lg disabled:opacity-50 hover:bg-slate-700 hover:border-saffron-500/30 hover:text-saffron-400 transition-all text-sm font-semibold"
              >
                Prev
              </button>
              <span className="text-slate-400 text-sm font-semibold">
                Page {currentPage} of {totalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-1.5 bg-slate-800/80 border border-slate-700/60 text-slate-300 rounded-lg disabled:opacity-50 hover:bg-slate-700 hover:border-saffron-500/30 hover:text-saffron-400 transition-all text-sm font-semibold"
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
          <div className="p-4 border-b border-slate-800 bg-slate-900/40 flex justify-between items-center rounded-t-2xl">
            <h3 className="font-bold text-slate-200">Current KOT</h3>
            <span className="bg-saffron-500/15 text-saffron-400 border border-saffron-500/20 px-2.5 py-0.5 rounded-md text-xs font-bold font-mono">{cart.length} Items</span>
          </div>

          <div className="flex-1 p-3 overflow-y-auto divide-y divide-slate-800/50">
            {cart.length > 0 ? (
              cart.map((item) => (
                <div key={item.dishId} className="py-2.5 flex justify-between items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-200 line-clamp-2">{item.name}</p>
                    <p className="text-[10px] text-saffron-400 font-mono font-bold">₹{item.price}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => updateQuantity(item.dishId, -1)} className="p-1 bg-slate-800 border border-slate-700 text-slate-300 rounded hover:border-saffron-500/40"><Minus className="w-3 h-3" /></button>
                    <span className="text-xs font-bold font-mono w-4 text-center text-slate-200">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.dishId, 1)} className="p-1 bg-slate-800 border border-slate-700 text-slate-300 rounded hover:border-saffron-500/40"><Plus className="w-3 h-3" /></button>
                    <button onClick={() => removeFromCart(item.dishId)} className="p-1 text-red-400 hover:bg-red-500/20 rounded ml-1"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-slate-500 text-sm">No items in KOT. Add dishes from the menu.</div>
            )}
          </div>

          <div className="p-4 bg-slate-900/40 border-t border-slate-800 rounded-b-2xl">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs text-slate-300 flex items-center gap-2 cursor-pointer font-medium">
                <input type="checkbox" checked={applyGST} onChange={(e) => setApplyGST(e.target.checked)} className="accent-saffron-500" />
                Apply 5% GST
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Discount %</span>
                <input 
                  type="number" 
                  min="0"
                  max="100"
                  value={discountPercentage}
                  onChange={e => setDiscountPercentage(Number(e.target.value) || 0)}
                  className="w-16 bg-slate-800 border border-slate-700 text-white rounded-lg px-2 py-1 text-xs outline-none focus:border-saffron-500 text-right"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="flex justify-between text-xs py-1 text-slate-400"><span>Subtotal</span><span className="font-mono">₹{subTotal.toFixed(2)}</span></div>
            {discountAmount > 0 && <div className="flex justify-between text-xs py-1 text-saffron-400 font-medium"><span>Discount ({discountPercentage}%)</span><span className="font-mono">-₹{discountAmount.toFixed(2)}</span></div>}
            {applyGST && <div className="flex justify-between text-xs py-1 text-slate-400"><span>GST (5%)</span><span className="font-mono">₹{tax.toFixed(2)}</span></div>}
            <div className="flex justify-between font-bold text-slate-200 py-1.5 border-t border-slate-800 mt-1"><span>Grand Total</span><span className="text-saffron-400 font-mono">₹{grandTotal.toFixed(2)}</span></div>
            
            <div className="mt-4 flex flex-col gap-2">
              <button 
                onClick={handleSaveOrder}
                disabled={loading || cart.length === 0}
                className="w-full py-2.5 bg-gradient-to-r from-saffron-500 to-saffron-600 hover:from-saffron-400 hover:to-saffron-500 text-lagoon-950 font-bold rounded-xl shadow-lg shadow-saffron-500/20 active:scale-[0.98] transition-all flex justify-center items-center gap-2 text-sm disabled:opacity-50"
              >
                Save / Send to Kitchen
              </button>
              
              {selectedTable?.status === "Occupied" && (
                <>
                  <button 
                    onClick={handlePrintProforma}
                    disabled={loading}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-md shadow-blue-600/20 flex justify-center items-center gap-2 mt-1 text-sm disabled:opacity-50"
                  >
                    Print Proforma Bill
                  </button>
                  <button 
                    onClick={promptCheckout}
                    disabled={loading}
                    className="w-full mt-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-md shadow-emerald-600/20 flex justify-center items-center gap-2 text-sm disabled:opacity-50"
                  >
                    Generate Final Bill & Pay
                  </button>
                  <button 
                    onClick={handleCancelKOT}
                    disabled={loading}
                    className="w-full mt-1 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 font-bold rounded-xl hover:bg-red-500/20 transition-all flex justify-center items-center text-xs disabled:opacity-50"
                  >
                    Cancel KOT
                  </button>
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
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md shadow-2xl relative animate-fade-in">
            <button onClick={() => setShowCheckoutModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5"/>
            </button>
            <h2 className="text-xl font-bold font-display text-slate-200 mb-6 border-b border-slate-800 pb-2">Final Checkout</h2>
            <form onSubmit={handleCheckout} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Payment Mode *</label>
                <select 
                  value={checkoutData.paymentMode} 
                  onChange={e => setCheckoutData({...checkoutData, paymentMode: e.target.value})}
                  className="w-full bg-slate-800/80 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-saffron-500"
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
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-xs">
                  <p className="font-bold">✓ Direct Room Folio Post</p>
                  <p className="mt-0.5 text-emerald-400/80">
                    {selectedTable?.tableNo ? `This bill (₹${grandTotal.toFixed(2)}) will be added directly to ${selectedTable.tableNo} final checkout balance.` : "Will be linked to the room folio."}
                  </p>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Customer Name {['NC Bill', 'Credit Bill'].includes(checkoutData.paymentMode) ? '*' : ''}</label>
                <input 
                  type="text" 
                  value={checkoutData.customerName}
                  onChange={e => setCheckoutData({...checkoutData, customerName: e.target.value})}
                  className="w-full bg-slate-800/80 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-saffron-500"
                  placeholder="John Doe"
                  required={['NC Bill', 'Credit Bill'].includes(checkoutData.paymentMode)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Mobile Number</label>
                <input 
                  type="tel" 
                  value={checkoutData.customerMobile}
                  onChange={e => setCheckoutData({...checkoutData, customerMobile: e.target.value})}
                  className="w-full bg-slate-800/80 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-saffron-500"
                  placeholder="10-digit mobile"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Email (Optional)</label>
                <input 
                  type="email" 
                  value={checkoutData.customerEmail}
                  onChange={e => setCheckoutData({...checkoutData, customerEmail: e.target.value})}
                  className="w-full bg-slate-800/80 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-saffron-500"
                />
              </div>
              <button type="submit" disabled={loading} className="mt-4 w-full py-3 bg-gradient-to-r from-saffron-500 to-saffron-600 hover:from-saffron-400 hover:to-saffron-500 text-lagoon-950 font-bold rounded-xl shadow-lg shadow-saffron-500/20 text-sm transition-all active:scale-[0.98]">
                {loading ? 'Processing...' : (checkoutData.paymentMode === 'Added to Room' ? 'Post to Room & Complete' : 'Complete Checkout & Print')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
