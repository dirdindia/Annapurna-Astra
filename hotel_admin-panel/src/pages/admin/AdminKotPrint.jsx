import React, { useState, useEffect } from "react";
import { UtensilsCrossed, Printer, ArrowLeft, CheckSquare, Square, Search } from "lucide-react";
import api, { tableAPI, orderAPI } from "../../api";
import ThermalReceipt from "../../components/ThermalReceipt";
import { showSuccess, showError } from "../../utils/alerts";

export default function AdminKotPrint() {
  const [tables, setTables] = useState([]);
  const [virtualOrders, setVirtualOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [itemsToPrint, setItemsToPrint] = useState([]);
  const [generatedKOT, setGeneratedKOT] = useState(null);

  const fetchActiveData = async () => {
    try {
      setLoading(true);
      const tablesRes = await tableAPI.getTables();
      const occupiedTables = (tablesRes.data.data || []).filter(t => t.status === "Occupied");
      setTables(occupiedTables);

      const virtualRes = await api.get("api/orders/virtual/active");
      if (virtualRes.data.success) {
        setVirtualOrders(virtualRes.data.data || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveData();
  }, []);

  const handleTableClick = async (table) => {
    try {
      setLoading(true);
      const res = await orderAPI.getActiveOrder(table._id);
      if (res.data.data) {
        setupOrderForPrint(res.data.data, table.tableNo);
      } else {
        showError("No Order", "No active order found for this table.");
      }
    } catch (error) {
      showError("Error", "Failed to fetch order.");
    } finally {
      setLoading(false);
    }
  };

  const handleVirtualClick = (order) => {
    setupOrderForPrint(order, order.orderDisplayId);
  };

  const setupOrderForPrint = (order, displayNo) => {
    const items = order.items.map(item => {
      const pendingQty = item.quantity - (item.printedQuantity || 0);
      return {
        ...item,
        pendingQty: Math.max(0, pendingQty),
        selected: pendingQty > 0
      };
    });

    setSelectedOrder({ ...order, displayNo, items });
    setItemsToPrint(items.filter(i => i.selected));
  };

  const toggleItemSelection = (dishId) => {
    setSelectedOrder(prev => {
      const updatedItems = prev.items.map(item => {
        if (item.dishId === dishId) {
          return { ...item, selected: !item.selected };
        }
        return item;
      });
      setItemsToPrint(updatedItems.filter(i => i.selected));
      return { ...prev, items: updatedItems };
    });
  };

  const handlePrintKOT = async () => {
    if (itemsToPrint.length === 0) {
      showError("No Items", "Please select at least one item to print.");
      return;
    }

    const finalPrintItems = itemsToPrint.map(item => ({
      name: item.name,
      quantity: item.pendingQty > 0 ? item.pendingQty : item.quantity,
      price: item.price
    }));

    setLoading(true);
    try {
      const updateData = itemsToPrint.map(item => ({
        dishId: item.dishId,
        quantity: item.pendingQty > 0 ? item.pendingQty : item.quantity
      }));

      await orderAPI.markKotPrinted(selectedOrder._id, updateData);

      setGeneratedKOT({
        invoiceNumber: selectedOrder.orderDisplayId || "KOT",
        table: { tableNo: selectedOrder.displayNo },
        items: finalPrintItems,
        createdAt: new Date().toISOString(),
        createdBy: selectedOrder.createdBy
      });
      
      const updatedItems = selectedOrder.items.map(item => {
        const printed = itemsToPrint.find(i => i.dishId === item.dishId);
        if (printed) {
          const addedQty = printed.pendingQty > 0 ? printed.pendingQty : printed.quantity;
          return { ...item, printedQuantity: (item.printedQuantity || 0) + addedQty, pendingQty: 0, selected: false };
        }
        return item;
      });
      setSelectedOrder({ ...selectedOrder, items: updatedItems });
      setItemsToPrint([]);

    } catch (error) {
      showError("Error", error.response?.data?.message || error.message || "Failed to update KOT print status.");
    } finally {
      setLoading(false);
    }
  };

  const closeReceipt = () => {
    setGeneratedKOT(null);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 min-h-[calc(100vh-80px)]">
      <div className="flex items-center gap-4 mb-6 border-b border-slate-800 pb-4">
        {selectedOrder && (
          <button onClick={() => setSelectedOrder(null)} className="p-2 bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div>
          <h1 className="text-3xl font-bold text-amber-500 flex items-center gap-3">
            <Printer className="w-8 h-8" />
            Print Pending KOT
          </h1>
          <p className="text-slate-400 mt-1">
            {selectedOrder ? `Select items to print for ${selectedOrder.displayNo}` : "Select an active order to print its KOT."}
          </p>
        </div>
      </div>

      {!selectedOrder ? (
        <div className="space-y-6">
          {loading && <div className="text-amber-500">Loading active orders...</div>}
          
          {tables.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-slate-300 mb-4">Dine-in Tables (Occupied)</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {tables.map(table => (
                  <div key={table._id} onClick={() => handleTableClick(table)} className="p-4 rounded-2xl border-2 border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/20 shadow-lg cursor-pointer transition-all flex flex-col justify-center items-center h-24">
                    <span className="text-2xl font-bold text-slate-200">{table.tableNo}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {virtualOrders.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-slate-300 mb-4 mt-6">Delivery / Parcel Orders</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {virtualOrders.map(order => (
                  <div key={order._id} onClick={() => handleVirtualClick(order)} className="p-4 rounded-2xl border-2 border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20 shadow-lg cursor-pointer transition-all flex flex-col justify-center items-center h-24">
                    <span className="text-xl font-bold text-slate-200">{order.orderDisplayId}</span>
                    <span className="text-xs text-amber-500 uppercase">{order.orderType}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && tables.length === 0 && virtualOrders.length === 0 && (
            <div className="py-12 text-center text-slate-500">
              <UtensilsCrossed className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No active orders found.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="glass p-6 rounded-2xl border border-gold-800/20 shadow-xl relative overflow-hidden max-w-2xl mx-auto">
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-yellow-400"></div>
           <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-200">{selectedOrder.displayNo}</h2>
              <div className="bg-amber-500/20 text-amber-400 px-3 py-1 rounded-lg text-sm font-bold">
                {itemsToPrint.length} Items Selected
              </div>
           </div>

           <div className="space-y-6 mb-8 max-h-[50vh] overflow-y-auto pr-2">
              {/* Pending Items Section */}
              {selectedOrder.items.filter(item => item.pendingQty > 0).length > 0 && (
                <div>
                  <h3 className="text-emerald-400 font-bold mb-3 border-b border-emerald-500/30 pb-1">New / Pending Items</h3>
                  <div className="space-y-2">
                    {selectedOrder.items.filter(item => item.pendingQty > 0).map(item => (
                      <div 
                        key={item.dishId} 
                        onClick={() => toggleItemSelection(item.dishId)}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                          item.selected 
                            ? "bg-amber-500/10 border-amber-500/50" 
                            : "bg-slate-900/50 border-slate-800 hover:border-slate-600"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {item.selected ? (
                            <CheckSquare className="w-5 h-5 text-amber-500" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-500" />
                          )}
                          <div>
                            <p className="font-bold text-slate-200">{item.name}</p>
                            <p className="text-xs text-slate-400">Total Qty: {item.quantity}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded text-xs font-bold animate-pulse">
                            New: {item.pendingQty}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Already Printed Section */}
              {selectedOrder.items.filter(item => item.pendingQty === 0).length > 0 && (
                <div>
                  <h3 className="text-slate-500 font-bold mb-3 border-b border-slate-800 pb-1">Already Printed (Can select to reprint)</h3>
                  <div className="space-y-2">
                    {selectedOrder.items.filter(item => item.pendingQty === 0).map(item => (
                      <div 
                        key={item.dishId} 
                        onClick={() => toggleItemSelection(item.dishId)}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                          item.selected 
                            ? "bg-amber-500/10 border-amber-500/50" 
                            : "bg-slate-900/30 border-slate-800 hover:border-slate-600 opacity-75"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {item.selected ? (
                            <CheckSquare className="w-5 h-5 text-amber-500" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-500" />
                          )}
                          <div>
                            <p className="font-bold text-slate-400">{item.name}</p>
                            <p className="text-xs text-slate-500">Total Qty: {item.quantity}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="bg-slate-800 text-slate-500 px-2 py-1 rounded text-xs">
                            Printed ({item.printedQuantity || 0})
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
           </div>

           <button 
             onClick={handlePrintKOT}
             disabled={loading || itemsToPrint.length === 0}
             className="w-full bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 font-bold py-3.5 px-4 rounded-xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
           >
             {loading ? "Processing..." : `Print KOT (${itemsToPrint.length} items)`}
           </button>
        </div>
      )}

      {generatedKOT && (
        <ThermalReceipt invoice={generatedKOT} isKot={true} onClose={closeReceipt} />
      )}
    </div>
  );
}
