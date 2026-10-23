import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { Printer, Download, Share2, CheckCircle2, ShieldCheck, Utensils, Building2, Phone, MapPin, Receipt, ArrowLeft, Image as ImageIcon } from "lucide-react";
import html2canvas from "html2canvas";
import api from "../../api";

export default function PublicBillView() {
  const { invoiceId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingImage, setDownloadingImage] = useState(false);
  const receiptCardRef = useRef(null);

  useEffect(() => {
    const fetchBill = async () => {
      try {
        setLoading(true);
        // Call public bill endpoint via api.js
        const res = await api.get(`/api/public/bill/${invoiceId}`, { showLoader: false });
        if (res.data?.success) {
          setData(res.data);
        } else {
          setError("Invoice not found or expired.");
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load digital invoice.");
      } finally {
        setLoading(false);
      }
    };

    if (invoiceId) {
      fetchBill();
    }
  }, [invoiceId]);

  const handleShare = () => {
    const inv = data?.invoice;
    const h = data?.hotel;
    if (navigator.share) {
      navigator.share({
        title: `${h?.name || "Hotel"} - Bill #${inv?.invoiceNumber}`,
        text: `Tax Invoice #${inv?.invoiceNumber} for ₹${inv?.grandTotal}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Bill URL copied to clipboard!");
    }
  };

  const handleDownloadImage = async () => {
    if (!receiptCardRef.current) return;
    try {
      setDownloadingImage(true);
      const canvas = await html2canvas(receiptCardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const imgUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = imgUrl;
      a.download = `Invoice-${data?.invoice?.invoiceNumber || "Bill"}.png`;
      a.click();
    } catch (err) {
      console.error("Image download error:", err);
      window.print();
    } finally {
      setDownloadingImage(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-emerald-400 p-4">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-semibold tracking-wide">Loading Digital Invoice...</p>
      </div>
    );
  }

  if (error || !data?.invoice) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4 text-rose-400">
          <Receipt className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Invoice Not Found</h1>
        <p className="text-sm text-slate-400 max-w-md mb-6">{error || "This invoice link may be invalid or expired."}</p>
      </div>
    );
  }

  const { invoice, hotel } = data;
  const billDate = new Date(invoice.createdAt || Date.now()).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const cgst = Number(invoice.tax || 0) / 2;
  const sgst = Number(invoice.tax || 0) / 2;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center py-6 px-3 sm:px-6 pb-24">
      {/* Top Action Bar (hidden in print) */}
      <div className="w-full max-w-xl flex items-center justify-between gap-3 mb-6 print:hidden">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Verified Digital Invoice</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-white/10 transition-colors cursor-pointer"
            title="Share Bill link"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Share</span>
          </button>
          <button
            onClick={handleDownloadImage}
            disabled={downloadingImage}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-white/10 transition-colors cursor-pointer"
            title="Save as Image (PNG)"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{downloadingImage ? "Saving..." : "Save Image"}</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
            title="Download PDF or Print"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Main Invoice Card */}
      <div 
        ref={receiptCardRef}
        className="w-full max-w-xl bg-white text-slate-900 rounded-3xl shadow-2xl p-6 sm:p-8 font-sans border border-slate-200 print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none"
      >
        {/* Header */}
        <div className="border-b border-slate-200 pb-6 text-center">
          {hotel?.logo && (
            <img src={hotel.logo} alt="Logo" className="w-16 h-16 object-contain mx-auto mb-3" />
          )}
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
            {hotel?.name || "HOTEL INVOICE"}
          </h1>
          {hotel?.address && (
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              {hotel.address}{hotel.city ? `, ${hotel.city}` : ""}
            </p>
          )}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-slate-600 mt-2 font-medium">
            {hotel?.phone && <span>📞 {hotel.phone}</span>}
            {hotel?.gstin && <span className="font-bold text-slate-800">GSTIN: {hotel.gstin}</span>}
            {hotel?.fssaiNumber && <span>FSSAI: {hotel.fssaiNumber}</span>}
          </div>
          <div className="mt-4 inline-block px-3 py-1 bg-emerald-50 text-emerald-700 font-bold text-xs uppercase tracking-wider rounded-full border border-emerald-200">
            Original Tax Invoice
          </div>
        </div>

        {/* Invoice Metadata */}
        <div className="grid grid-cols-2 gap-4 py-5 border-b border-slate-200 text-xs">
          <div>
            <span className="text-slate-400 block font-medium">INVOICE NUMBER</span>
            <span className="font-mono font-black text-slate-900 text-sm">#{invoice.invoiceNumber}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block font-medium">DATE & TIME</span>
            <span className="font-semibold text-slate-800">{billDate}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">BILLED TO</span>
            <span className="font-bold text-slate-900 text-sm block">{invoice.customerName || "Walk-in Guest"}</span>
            {invoice.customerMobile && invoice.customerMobile !== "N/A" && (
              <span className="text-slate-500">{invoice.customerMobile}</span>
            )}
          </div>
          <div className="text-right">
            <span className="text-slate-400 block font-medium">TABLE / LOCATION</span>
            <span className="font-bold text-slate-800 text-sm">
              {invoice.tableId?.tableNo ? `Table ${invoice.tableId.tableNo}` : (invoice.tableNo ? `Table ${invoice.tableNo}` : (invoice.roomBookingId ? "Room Service" : "Dine-in / Takeaway"))}
            </span>
          </div>
        </div>

        {/* Items Table */}
        <div className="py-5 border-b border-slate-200">
          <div className="flex justify-between font-bold text-xs text-slate-400 uppercase tracking-wider pb-3 border-b border-slate-100">
            <div className="w-[50%]">Item Description</div>
            <div className="w-[15%] text-center">Qty</div>
            <div className="w-[15%] text-right">Rate</div>
            <div className="w-[20%] text-right">Amount</div>
          </div>
          <div className="divide-y divide-slate-100">
            {invoice.items && invoice.items.map((item, idx) => (
              <div key={idx} className="flex justify-between py-2.5 text-xs text-slate-800">
                <div className="w-[50%] font-semibold pr-2">{item.name}</div>
                <div className="w-[15%] text-center font-mono text-slate-600">{item.quantity}</div>
                <div className="w-[15%] text-right font-mono text-slate-600">₹{Number(item.price).toFixed(0)}</div>
                <div className="w-[20%] text-right font-mono font-bold text-slate-900">
                  ₹{Number(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Calculation Totals */}
        <div className="pt-4 pb-6 border-b border-slate-200 space-y-2 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span className="font-mono font-semibold">₹{Number(invoice.subTotal || 0).toFixed(2)}</span>
          </div>
          {invoice.discountAmount > 0 && (
            <div className="flex justify-between text-emerald-600 font-medium">
              <span>Discount ({invoice.discountPercentage}%)</span>
              <span className="font-mono">-₹{Number(invoice.discountAmount).toFixed(2)}</span>
            </div>
          )}
          {cgst > 0 && (
            <div className="flex justify-between text-slate-500">
              <span>CGST</span>
              <span className="font-mono">₹{cgst.toFixed(2)}</span>
            </div>
          )}
          {sgst > 0 && (
            <div className="flex justify-between text-slate-500">
              <span>SGST</span>
              <span className="font-mono">₹{sgst.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-3 border-t border-slate-200 text-sm font-black text-slate-900">
            <div>
              <span>Grand Total</span>
              <span className="ml-2 text-xs font-normal text-slate-500">
                ({invoice.paymentMode || "Paid"})
              </span>
            </div>
            <span className="text-xl font-mono text-emerald-700">₹{Number(invoice.grandTotal || 0).toFixed(2)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-6 text-center text-xs text-slate-400 space-y-2">
          <p className="font-semibold text-slate-700">Thank you for visiting! Have a wonderful day. 🙏</p>
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Official Digital Invoice • Secured by Annapurna Astra</span>
          </div>
        </div>
      </div>

      {/* Floating Download Bar for Mobile Screens (hidden in print) */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-50 print:hidden flex gap-2">
        <button
          onClick={handleDownloadImage}
          disabled={downloadingImage}
          className="flex-1 py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-bold text-xs shadow-xl border border-white/10 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
        >
          <ImageIcon className="w-4 h-4 text-amber-400" />
          <span>{downloadingImage ? "Saving..." : "Save Image"}</span>
        </button>
        <button
          onClick={() => window.print()}
          className="flex-1 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold text-xs shadow-2xl shadow-emerald-950 flex items-center justify-center gap-1.5 border border-emerald-400/30 transition-all cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Download PDF</span>
        </button>
      </div>
    </div>
  );
}
