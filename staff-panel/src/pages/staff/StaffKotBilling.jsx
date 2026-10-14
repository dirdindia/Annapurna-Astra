import React, { useState, useEffect } from "react";
import api, { tableAPI, orderAPI } from "../../api";
import { UtensilsCrossed, Users, Plus, Minus, Trash2, Search, ArrowUpRight, ArrowLeft, Bike, ShoppingBag, Truck, X } from "lucide-react";
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

  useEffect(() => {
    fetchTables();
    fetchVirtualOrders();
    fetchAllCategories();
  }, []);

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
      orderType: order.orderType
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

  const handleTableClick = async (table) => {
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
        items: cart,
        subTotal,
        tax,
        grandTotal
      });
      
      const savedOrder = res.data.data;

      if (newKotItems.length > 0) {
        setIsKotPrint(true);
        setGeneratedInvoice({
          tableNo: "Table " + selectedTable.tableNo,
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
      const res = await api.post(`api/orders/${activeOrderId}/checkout`, { ...checkoutData, discountPercentage });
      if (res.data.success) {
        setIsKotPrint(false);
        setGeneratedInvoice(res.data.data);
        setShowCheckoutModal(false);
        setCheckoutData({ customerName: "", customerMobile: "", customerEmail: "", paymentMode: "Cash" });
        setDiscountPercentage(0);
      }
    } catch (error) {
      showError("Checkout Failed", error.response?.data?.message || "Failed to generate bill.");
    } finally {
      setLoading(false);
    }
  };

  const promptCheckout = () => {
    if(selectedTable?.orderType !== 'Table') {
      setCheckoutData(prev => ({...prev, customerName: selectedTable?.tableNo}));
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

        <div className="flex flex-wrap gap-3 mb-6">
          <button onClick={() => handleCreateNewVirtual('Swiggy')} className="px-4 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl flex items-center gap-2 font-bold shadow-md shadow-orange-600/20 active:scale-95 transition-all text-xs">
            <Bike className="w-4 h-4"/> New Swiggy Order
          </button>
          <button onClick={() => handleCreateNewVirtual('Zomato')} className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl flex items-center gap-2 font-bold shadow-md shadow-red-600/20 active:scale-95 transition-all text-xs">
            <Bike className="w-4 h-4"/> New Zomato Order
          </button>
          <button onClick={() => handleCreateNewVirtual('Parcel')} className="px-4 py-2.5 bg-gradient-to-r from-saffron-500 to-saffron-600 hover:from-saffron-400 hover:to-saffron-500 text-lagoon-950 rounded-xl flex items-center gap-2 font-bold shadow-md shadow-saffron-500/20 active:scale-95 transition-all text-xs">
            <ShoppingBag className="w-4 h-4"/> New Parcel
          </button>
        </div>

        {virtualOrders.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2 font-display"><Truck className="w-5 h-5 text-saffron-500"/> Active Delivery & Parcel Orders</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {virtualOrders.map(order => (
                <div key={order._id} onClick={() => handleVirtualOrderClick(order)} className="p-4 rounded-2xl border-2 border-saffron-500/40 bg-saffron-500/10 hover:bg-saffron-500/20 shadow-lg cursor-pointer transition-all active:scale-95 flex flex-col justify-between h-32 hover:border-saffron-500/70">
                  <div className="flex justify-between items-start">
                    <span className="text-xl font-bold text-slate-200 font-mono">{order.orderDisplayId}</span>
                    <ShoppingBag className="w-5 h-5 text-saffron-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider mb-1 text-saffron-400">{order.orderType}</p>
                    <p className="text-xs text-slate-400">{order.items.length} Items</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <h2 className="text-lg font-bold text-slate-200 mb-4 font-display">Dine-in Tables</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {(tables || []).map(table => (
            <div 
              key={table._id}
              onClick={() => handleTableClick(table)}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all transform active:scale-95 flex flex-col justify-between h-32
                ${table.status === 'Available' 
                  ? 'border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/20 shadow-lg shadow-emerald-500/10' 
                  : 'border-red-500/50 bg-red-500/10 hover:bg-red-500/20 shadow-lg shadow-red-500/10'
                }`}
            >
              <div className="flex justify-between items-start">
                <span className="text-2xl font-bold text-slate-200 font-mono">{table.tableNo}</span>
                <Users className={`w-5 h-5 ${table.status === 'Available' ? 'text-emerald-400' : 'text-red-400'}`} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: table.status === 'Available' ? '#34d399' : '#f87171' }}>
                  {table.status}
                </p>
                <p className="text-xs text-slate-400">{table.capacity} Seater</p>
              </div>
            </div>
          ))}
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

        {/* Table Info & Back Button */}
        <div className="flex items-center gap-4 border-b border-slate-800 pb-3">
          <button onClick={goBackToTables} className="p-2 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-300 hover:text-white hover:border-saffron-500/40 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold font-display text-slate-200">
            Table <span className="text-saffron-400 font-mono">{selectedTable?.tableNo}</span>
          </h2>
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
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Card">Card</option>
                  <option value="Credit Bill">Credit Bill</option>
                  <option value="NC Bill">NC Bill (Non-Chargeable)</option>
                </select>
              </div>
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
                {loading ? 'Processing...' : 'Complete Checkout & Print'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
