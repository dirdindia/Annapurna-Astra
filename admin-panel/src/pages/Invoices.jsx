import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Receipt, Search, ChevronLeft, ChevronRight, Loader2, X, Building2, User, CreditCard, Clock, CheckCircle2, AlertCircle, Printer } from 'lucide-react';
import api from '../api';
import PremiumSubscriptionInvoice from '../components/PremiumSubscriptionInvoice';

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [printingInvoice, setPrintingInvoice] = useState(null);
  const limit = 10;

  useEffect(() => {
    fetchInvoices();
  }, [page, searchQuery]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const url = searchQuery
        ? `/superadmin/invoices?page=${page}&limit=${limit}&search=${encodeURIComponent(searchQuery)}`
        : `/superadmin/invoices?page=${page}&limit=${limit}`;
      const res = await api.get(url);
      setInvoices(res.data.data || []);
      setTotalPages(res.data.pages || 1);
      setTotalCount(res.data.total || 0);
    } catch (err) {
      console.error('Failed to fetch invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) setPage(page + 1);
  };

  const handlePrevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-lagoon-900 to-lagoon-500 tracking-tight">SaaS Payments</h1>
        <p className="text-sm text-slate-500 mt-2 font-medium">Manage and track all subscription invoices.</p>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/50 overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50/30 gap-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by Txn ID, Hotel, or Plan..." 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-lagoon-500/10 focus:border-lagoon-500 transition-all font-medium shadow-sm"
            />
          </div>
          <div className="text-sm font-bold text-slate-500 bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm">
            Total Transactions: <span className="text-blue-600">{totalCount}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Transaction ID</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Hotel Details</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Plan</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
                    <p className="text-slate-500 mt-2 font-medium">Loading invoices...</p>
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Receipt className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">No invoices found</h3>
                    <p className="text-slate-500 mt-1">There are no subscription payments recorded yet.</p>
                  </td>
                </tr>
              ) : (
                invoices.map((invoice, idx) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={invoice._id} 
                    onClick={() => setSelectedInvoice(invoice)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-5">
                      <span className="font-mono text-xs font-bold text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
                        {invoice.txnid}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="font-bold text-lagoon-950">{invoice.hotelId?.name || invoice.customerName || 'Unknown Hotel'}</div>
                      <div className="text-xs text-lagoon-600 font-medium mt-0.5">{invoice.hotelId?.email || invoice.customerEmail}</div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="capitalize font-bold text-saffron-800 bg-saffron-500/15 px-3 py-1 rounded-full border border-saffron-500/30 text-xs shadow-sm">
                        {invoice.planName}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="font-black text-lagoon-950 text-lg font-display">₹{invoice.amount?.toLocaleString('en-IN')}</span>
                    </td>
                    <td className="px-6 py-5">
                      {invoice.status === 'success' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Success
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Failed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-sm font-bold text-slate-700">{new Date(invoice.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                      <div className="text-xs font-medium text-slate-400 mt-0.5">{new Date(invoice.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Server-Side Pagination Controls */}
        {!loading && totalPages > 0 && (
          <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-600 font-medium">
              Showing page <span className="font-bold text-slate-900">{page}</span> of <span className="font-bold text-slate-900">{totalPages}</span>
            </p>
            <div className="flex items-center gap-2">
              <button 
                onClick={handlePrevPage} 
                disabled={page === 1}
                className="flex items-center gap-1 px-4 py-2 rounded-lg font-semibold text-sm border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              
              <div className="hidden sm:flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = page - 2 + i;
                  if (page <= 3) pageNum = i + 1;
                  if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                  
                  if (pageNum > 0 && pageNum <= totalPages) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-9 h-9 rounded-lg font-bold text-sm border transition-colors shadow-sm ${
                          page === pageNum 
                            ? 'bg-lagoon-900 text-white border-lagoon-900 shadow-sm' 
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-lagoon-900'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                  return null;
                })}
              </div>

              <button 
                onClick={handleNextPage} 
                disabled={page === totalPages}
                className="flex items-center gap-1 px-4 py-2 rounded-lg font-semibold text-sm border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Invoice Details Modal */}
      <AnimatePresence>
        {selectedInvoice && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedInvoice(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] z-50 overflow-hidden flex flex-col max-h-[90vh] border border-slate-100"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-saffron-500/10 text-saffron-600 rounded-xl border border-saffron-500/20">
                    <Receipt className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-lagoon-950 font-display">Transaction Details</h2>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedInvoice.txnid}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedInvoice(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                {/* Status Banner */}
                <div className={`p-4 rounded-xl flex items-center gap-3 border ${
                  selectedInvoice.status === 'success' 
                    ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                    : 'bg-rose-50 border-rose-100 text-rose-800'
                }`}>
                  {selectedInvoice.status === 'success' ? <CheckCircle2 className="w-6 h-6 text-emerald-600" /> : <AlertCircle className="w-6 h-6 text-rose-600" />}
                  <div>
                    <h3 className="font-bold capitalize">{selectedInvoice.status} Payment</h3>
                    <p className="text-sm opacity-80">This transaction was processed securely via Razorpay.</p>
                  </div>
                  <div className="ml-auto text-right">
                    <span className="text-2xl font-black font-display text-lagoon-950">₹{selectedInvoice.amount?.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  {/* Hotel Info */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Building2 className="w-4 h-4" /> Hotel Details
                    </h3>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <p className="font-bold text-lagoon-950 text-base">{selectedInvoice.hotelId?.name || selectedInvoice.customerName || 'N/A'}</p>
                      <p className="text-slate-500 text-xs mt-1">{selectedInvoice.hotelId?.email || selectedInvoice.customerEmail || 'N/A'}</p>
                      {selectedInvoice.hotelId?.phone && <p className="text-slate-500 text-xs mt-0.5 font-mono">{selectedInvoice.hotelId.phone}</p>}
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <CreditCard className="w-4 h-4" /> Subscription Plan
                    </h3>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 h-[88px] flex flex-col justify-center">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-lagoon-950 text-base capitalize">{selectedInvoice.planName} Plan</span>
                        <span className="px-2.5 py-1 bg-saffron-500/15 text-saffron-800 border border-saffron-500/30 text-xs font-bold rounded-full">SaaS</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-6">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-4">
                    <Clock className="w-4 h-4" /> Timeline
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-800">Created At</span>
                      <span>{new Date(selectedInvoice.createdAt).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'medium' })}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50 mt-auto flex justify-end">
                <div className="flex gap-3">
                  <button 
                    onClick={() => { setPrintingInvoice(selectedInvoice); setSelectedInvoice(null); }}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-saffron-500 to-amber-500 hover:brightness-105 text-slate-950 font-bold rounded-xl transition-all shadow-sm"
                  >
                    <Printer className="w-4 h-4" /> Print Invoice
                  </button>
                  <button 
                    onClick={() => setSelectedInvoice(null)}
                    className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition-colors shadow-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Print View */}
      {printingInvoice && (
        <PremiumSubscriptionInvoice 
          invoice={printingInvoice} 
          onClose={() => setPrintingInvoice(null)} 
        />
      )}
    </div>
  );
}
