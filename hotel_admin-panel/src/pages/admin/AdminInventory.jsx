import React, { useState, useEffect } from "react";
import api from "../../api";
import { Package, Plus, Receipt, Search, UploadCloud } from "lucide-react";
import { showSuccess, showError } from "../../utils/alerts";

export default function AdminInventory() {
  const [items, setItems] = useState([]);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("stock"); // 'stock' or 'history'
  const [showStockInModal, setShowStockInModal] = useState(false);
  const [inventoryLookups, setInventoryLookups] = useState([]);

  // Pagination State
  const [itemPage, setItemPage] = useState(1);
  const [itemTotalPages, setItemTotalPages] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const limit = 10;

  // Form State
  const [commonData, setCommonData] = useState({
    supplierName: "",
    date: new Date().toISOString().split('T')[0], // Default to today
  });
  const [itemsList, setItemsList] = useState([
    { itemName: "", quantity: "", unit: "kg", price: "" }
  ]);

  const handleAddItem = () => {
    setItemsList([...itemsList, { itemName: "", quantity: "", unit: "kg", price: "" }]);
  };

  const handleRemoveItem = (index) => {
    if (itemsList.length === 1) return;
    const list = [...itemsList];
    list.splice(index, 1);
    setItemsList(list);
  };

  const handleItemChange = (index, field, value) => {
    const list = [...itemsList];
    list[index][field] = value;
    setItemsList(list);
  };
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchInventory();
    fetchInventoryLookups();
  }, [itemPage]);

  useEffect(() => {
    fetchHistory();
  }, [historyPage]);

  const fetchInventory = async () => {
    try {
      const res = await api.get(`/api/inventory/items?page=${itemPage}&limit=${limit}`);
      if (res.data.success) {
        setItems(res.data.data);
        setItemTotalPages(res.data.totalPages);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchInventoryLookups = async () => {
    try {
      const res = await api.get("/api/lookups?limit=1000");
      if (res.data.success) {
        setInventoryLookups(res.data.data.filter(l => l.type === "INVENTORY_ITEM" && l.isActive));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await api.get(`/api/inventory/history?page=${historyPage}&limit=${limit}`);
      if (res.data.success) {
        setHistory(res.data.data);
        setHistoryTotalPages(res.data.totalPages);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setInvoiceFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isValid = itemsList.every(item => item.itemName && item.quantity && item.price);
    if (!isValid || itemsList.length === 0) {
      showError("Error", "Please fill required fields for all items");
      return;
    }

    setIsSubmitting(true);
    try {
      let invoiceUrl = "";

      // Upload Invoice if selected
      if (invoiceFile) {
        const fileData = new FormData();
        fileData.append("files", invoiceFile);
        
        const uploadRes = await api.post("/api/upload", fileData, {
          headers: { 
            "Content-Type": "multipart/form-data"
          },
        });

        if (uploadRes.data.success && uploadRes.data.urls.length > 0) {
          invoiceUrl = uploadRes.data.urls[0];
        }
      }

      // Submit Stock In Batch
      const payload = {
        supplierName: commonData.supplierName,
        date: commonData.date,
        invoiceUrl,
        items: itemsList
      };

      const res = await api.post("/api/inventory/stock-in", payload);

      if (res.data.success) {
        showSuccess("Success", "Stock batch added successfully!");
        setShowStockInModal(false);
        setCommonData({
          supplierName: "",
          date: new Date().toISOString().split('T')[0],
        });
        setItemsList([{ itemName: "", quantity: "", unit: "kg", price: "" }]);
        setInvoiceFile(null);
        fetchInventory();
        fetchHistory();
      }
    } catch (err) {
      showError("Error", err.response?.data?.message || "Failed to add stock");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-amber-500 flex items-center gap-3">
            <Package className="w-8 h-8" />
            Inventory Management
          </h1>
          <p className="text-slate-400 mt-1">Manage restaurant stock and track invoices.</p>
        </div>
        <button
          onClick={() => setShowStockInModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 px-6 py-2.5 rounded-xl font-bold hover:shadow-lg hover:shadow-amber-500/20 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Stock In
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-slate-800">
        <button
          onClick={() => setActiveTab("stock")}
          className={`pb-3 px-4 font-semibold transition-colors relative ${
            activeTab === "stock" ? "text-amber-500" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Current Stock
          {activeTab === "stock" && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500 rounded-t-full"></span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`pb-3 px-4 font-semibold transition-colors relative ${
            activeTab === "history" ? "text-amber-500" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Stock In History
          {activeTab === "history" && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500 rounded-t-full"></span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 glass rounded-2xl border border-slate-800/50 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-900/50 text-amber-500/80 sticky top-0 z-10 backdrop-blur-md">
              <tr>
                {activeTab === "stock" ? (
                  <>
                    <th className="p-4 font-medium uppercase tracking-wider text-sm">Item Name</th>
                    <th className="p-4 font-medium uppercase tracking-wider text-sm">Unit</th>
                    <th className="p-4 font-medium uppercase tracking-wider text-sm text-right">Current Stock</th>
                  </>
                ) : (
                  <>
                    <th className="p-4 font-medium uppercase tracking-wider text-sm">Date</th>
                    <th className="p-4 font-medium uppercase tracking-wider text-sm">Item</th>
                    <th className="p-4 font-medium uppercase tracking-wider text-sm">Quantity</th>
                    <th className="p-4 font-medium uppercase tracking-wider text-sm">Price</th>
                    <th className="p-4 font-medium uppercase tracking-wider text-sm">Supplier</th>
                    <th className="p-4 font-medium uppercase tracking-wider text-sm">Invoice</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {activeTab === "stock" ? (
                items.length > 0 ? (
                  items.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="p-4 text-slate-200 font-medium">{item.name}</td>
                      <td className="p-4 text-slate-400">{item.unit}</td>
                      <td className="p-4 text-amber-400 font-bold text-right">
                        {item.currentStock} {item.unit}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="p-8 text-center text-slate-500">
                      No stock items found. Add stock to begin.
                    </td>
                  </tr>
                )
              ) : history.length > 0 ? (
                history.map((record) => (
                  <tr key={record._id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="p-4 text-slate-400">{new Date(record.date).toLocaleDateString()}</td>
                    <td className="p-4 text-slate-200 font-medium">{record.item?.name || "Unknown"}</td>
                    <td className="p-4 text-slate-300">
                      {record.quantity} {record.item?.unit}
                    </td>
                    <td className="p-4 text-slate-300">₹{record.price}</td>
                    <td className="p-4 text-slate-400">{record.supplierName || "-"}</td>
                    <td className="p-4">
                      {record.invoiceUrl ? (
                        <a
                          href={record.invoiceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-amber-500 hover:text-amber-400 hover:underline w-fit"
                        >
                          <Receipt className="w-4 h-4" />
                          View
                        </a>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">
                    No stock history found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-slate-800/50 flex justify-between items-center bg-slate-900/30">
          <button
            onClick={() => activeTab === "stock" ? setItemPage(p => Math.max(1, p - 1)) : setHistoryPage(p => Math.max(1, p - 1))}
            disabled={activeTab === "stock" ? itemPage === 1 : historyPage === 1}
            className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-slate-400 font-medium">
            Page {activeTab === "stock" ? itemPage : historyPage} of {activeTab === "stock" ? itemTotalPages : historyTotalPages}
          </span>
          <button
            onClick={() => activeTab === "stock" ? setItemPage(p => Math.min(itemTotalPages, p + 1)) : setHistoryPage(p => Math.min(historyTotalPages, p + 1))}
            disabled={activeTab === "stock" ? itemPage === itemTotalPages : historyPage === historyTotalPages}
            className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>

      {/* Stock In Modal */}
      {showStockInModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl animate-scale-up flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center shrink-0">
              <h2 className="text-2xl font-bold text-slate-200 flex items-center gap-2">
                <Plus className="text-amber-500" />
                Add Stock In
              </h2>
              <button
                onClick={() => setShowStockInModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="overflow-y-auto overflow-x-hidden p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
              {/* Common Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-slate-800">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Supplier Name</label>
                  <input
                    type="text"
                    value={commonData.supplierName}
                    onChange={(e) => setCommonData({ ...commonData, supplierName: e.target.value })}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Invoice Date</label>
                  <input
                    type="date"
                    required
                    value={commonData.date}
                    onChange={(e) => setCommonData({ ...commonData, date: e.target.value })}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
                  />
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-semibold text-slate-300">Items List</label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-amber-500 text-sm font-semibold hover:text-amber-400 flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Add Item
                  </button>
                </div>
                {itemsList.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-3 items-start bg-slate-950/30 p-4 rounded-xl border border-slate-800/50">
                    <div className="col-span-12 md:col-span-3">
                      <select
                        required
                        value={item.itemName}
                        onChange={(e) => handleItemChange(index, "itemName", e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500/50"
                      >
                        <option value="">Select Item</option>
                        {inventoryLookups.map(lookup => (
                          <option key={lookup._id} value={lookup.name}>{lookup.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-6 md:col-span-2">
                      <select
                        value={item.unit}
                        onChange={(e) => handleItemChange(index, "unit", e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500/50"
                      >
                        <option value="kg">kg</option>
                        <option value="liter">liter</option>
                        <option value="pieces">pieces</option>
                        <option value="grams">grams</option>
                        <option value="box">box</option>
                      </select>
                    </div>
                    <div className="col-span-6 md:col-span-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500/50"
                        placeholder="Qty"
                      />
                    </div>
                    <div className="col-span-9 md:col-span-3">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={item.price}
                        onChange={(e) => handleItemChange(index, "price", e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500/50"
                        placeholder="Total ₹"
                      />
                    </div>
                    <div className="col-span-3 md:col-span-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        disabled={itemsList.length === 1}
                        className="p-2 text-slate-500 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Upload Invoice (Optional)</label>
                <div className="relative group">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="w-full bg-slate-950/50 border border-dashed border-slate-700 hover:border-amber-500/50 rounded-xl p-6 flex flex-col items-center justify-center gap-2 transition-colors">
                    <UploadCloud className="w-8 h-8 text-slate-500 group-hover:text-amber-500 transition-colors" />
                    <p className="text-sm text-slate-400">
                      {invoiceFile ? invoiceFile.name : "Click or drag file to upload"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowStockInModal(false)}
                  className="px-6 py-2.5 rounded-xl font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-amber-500 text-slate-950 px-6 py-2.5 rounded-xl font-bold hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? "Saving..." : "Save Stock In"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
