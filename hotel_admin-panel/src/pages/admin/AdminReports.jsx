import React, { useState, useEffect } from "react";
import api from "../../api";
import { 
  Eye, Printer, Search, ChevronLeft, ChevronRight, AlertCircle, FileText, X
} from "lucide-react";

export default function AdminReports() {
  // Invoices list state
  const [invoices, setInvoices] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalInvoices, setTotalInvoices] = useState(0);
  const [limit] = useState(10);

  // Filters & search
  const [search, setSearch] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Invoice modal
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, [page, search, paymentMode, fromDate, toDate]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        search,
        source: "restaurant",
        paymentMode,
        fromDate,
        toDate
      };

      const res = await api.get("api/invoices", { params });
      if (res.data.success) {
        setInvoices(res.data.data);
        setTotalPages(res.data.pages);
        setTotalInvoices(res.data.total);
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  return (
    <div className="flex-1 p-6 space-y-8 overflow-x-hidden">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 no-print">
        <div>
          <h1 className="text-3xl font-bold text-amber-500 flex items-center gap-3">
            <FileText className="w-8 h-8" />
            Billing Report
          </h1>
          <p className="text-slate-400 mt-1">
            Search, filter and generate bills with server side pagination
          </p>
        </div>
      </div>

      {/* TABLE DATA LISTING WITH FILTERS */}
      <div className="glass-card rounded-2xl overflow-hidden no-print">
        
        {/* Table Filter Controls Header */}
        <div className="p-6 border-b border-slate-800/80 bg-slate-900/20 flex flex-col xl:flex-row gap-4 justify-between items-stretch xl:items-center">
          
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={paymentMode}
              onChange={(e) => { setPaymentMode(e.target.value); setPage(1); }}
              className="bg-slate-900 border border-slate-800 text-slate-300 rounded-lg text-xs px-3 py-2 outline-none focus:border-amber-500/50"
            >
              <option value="">All Payment Modes</option>
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="UPI">UPI</option>
              <option value="NC Bill">NC Bill</option>
              <option value="Credit Bill">Credit Bill</option>
            </select>

            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">From</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
                className="bg-transparent text-slate-300 text-xs outline-none focus:text-amber-500"
              />
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider border-l border-slate-700 pl-2">To</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => { setToDate(e.target.value); setPage(1); }}
                className="bg-transparent text-slate-300 text-xs outline-none focus:text-amber-500"
              />
              {(fromDate || toDate) && (
                <button 
                  onClick={() => { setFromDate(""); setToDate(""); setPage(1); }}
                  className="text-[10px] bg-red-500/20 text-red-400 hover:bg-red-500/40 px-2 py-1 rounded-md transition-all ml-1"
                  title="Clear Dates"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Right: Search */}
          <div className="relative max-w-sm w-full xl:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search Name / Mobile / INV..."
              value={search}
              onChange={handleSearchChange}
              className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs outline-none focus:border-amber-500/60"
            />
          </div>

        </div>

        {/* Invoice Grid/Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-16 text-center text-amber-500 font-bold">
              Loading invoices...
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/10 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-4 px-6">Invoice #</th>
                  <th className="py-4 px-6">Source</th>
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Customer Details</th>
                  <th className="py-4 px-6">Billed By (Staff)</th>
                  <th className="py-4 px-6">Payment Mode</th>
                  <th className="py-4 px-6 text-right">Grand Total</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {invoices.length > 0 ? (
                  invoices.map((inv) => (
                    <tr 
                      key={inv._id} 
                      onClick={() => setSelectedInvoice(inv)}
                      className="hover:bg-slate-900/30 text-slate-350 transition-colors cursor-pointer"
                    >
                      <td className="py-4 px-6 font-bold font-mono text-slate-200">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                          inv.orderId ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400"
                        }`}>
                          {inv.orderId ? `KOT (${inv.orderId.orderType})` : "Direct POS"}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {new Date(inv.createdAt).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-bold text-slate-200">{inv.customerName}</p>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">{inv.customerMobile}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-medium text-slate-300">
                        {inv.createdBy?.name || "System"}
                      </td>
                      <td className="py-4 px-6 font-semibold uppercase tracking-wider text-[10px] text-slate-300">
                        {inv.paymentMode || "-"}
                      </td>
                      <td className="py-4 px-6 text-right font-black font-mono text-amber-500 text-sm">
                        ₹{inv.grandTotal.toFixed(2)}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedInvoice(inv);
                            }}
                            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-750 rounded-lg transition-all flex items-center justify-center"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedInvoice(inv);
                              setTimeout(() => {
                                window.print();
                              }, 300);
                            }}
                            className="p-1.5 hover:bg-slate-850 text-slate-400 hover:text-amber-500 border border-slate-800 hover:border-slate-750 rounded-lg transition-all flex items-center justify-center"
                            title="Print Invoice"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-550">
                      <div className="inline-flex items-center justify-center gap-2 mb-2">
                        <AlertCircle className="w-5 h-5 text-slate-650" />
                        <span className="font-semibold">No invoices found</span>
                      </div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-600">Try adjusting your search query or dates</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Server-Side Pagination Bar */}
        {!loading && totalPages > 1 && (
          <div className="p-4 border-t border-slate-800/80 bg-slate-900/10 flex items-center justify-between">
            <span className="text-slate-500 font-medium">
              Showing page <strong className="text-slate-300">{page}</strong> of <strong className="text-slate-300">{totalPages}</strong> ({totalInvoices} total bills)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-2 border border-slate-800 hover:bg-slate-850 disabled:opacity-30 disabled:hover:bg-transparent text-slate-400 rounded-lg transition-all flex items-center justify-center"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="p-2 border border-slate-800 hover:bg-slate-850 disabled:opacity-30 disabled:hover:bg-transparent text-slate-400 rounded-lg transition-all flex items-center justify-center"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* BILLING DETAILS MODAL */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-500">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">Billing Details</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    {selectedInvoice.invoiceNumber} • {selectedInvoice.orderId ? `KOT (${selectedInvoice.orderId.orderType})` : "Direct POS"}
                  </p>
                </div>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedInvoice(null);
                }}
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar">
              
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex-1 min-w-[120px] bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200 dark:border-slate-800">
                  <p className="text-[10px] text-slate-500 dark:text-slate-500 font-bold uppercase tracking-wider mb-1">Customer</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{selectedInvoice.customerName}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">{selectedInvoice.customerMobile}</p>
                </div>
                <div className="flex-1 min-w-[120px] bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200 dark:border-slate-800">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Payment</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{selectedInvoice.paymentMode || "-"}</p>
                </div>
                <div className="flex-1 min-w-[120px] bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200 dark:border-slate-800">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Billed By</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{selectedInvoice.createdBy?.name || "System"}</p>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2 uppercase tracking-wider">
                  Order Items
                  <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full text-[10px]">
                    {selectedInvoice.items.length}
                  </span>
                </h3>
                <div className="bg-white dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                        <th className="py-3 px-4">Item</th>
                        <th className="py-3 px-4 text-center">Qty</th>
                        <th className="py-3 px-4 text-right">Price</th>
                        <th className="py-3 px-4 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                      {selectedInvoice.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 text-slate-700 dark:text-slate-300">
                          <td className="py-3 px-4 font-medium">{item.name}</td>
                          <td className="py-3 px-4 text-center font-mono">{item.quantity}</td>
                          <td className="py-3 px-4 text-right font-mono text-slate-500 dark:text-slate-400">₹{item.price.toFixed(2)}</td>
                          <td className="py-3 px-4 text-right font-mono text-amber-600 dark:text-amber-500 font-semibold">₹{(item.quantity * item.price).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <div className="w-full sm:w-64 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>Subtotal</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">₹{selectedInvoice.subTotal.toFixed(2)}</span>
                  </div>
                  {selectedInvoice.discountAmount > 0 && (
                    <div className="flex justify-between text-xs text-amber-500 dark:text-amber-500">
                      <span>Discount ({selectedInvoice.discountPercentage}%)</span>
                      <span className="font-mono">-₹{selectedInvoice.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>Tax (5%)</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">₹{selectedInvoice.tax.toFixed(2)}</span>
                  </div>
                  <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Total</span>
                    <span className="text-lg font-black font-mono text-amber-600 dark:text-amber-500">₹{selectedInvoice.grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
