import React from "react";
import { Printer, X, CheckCircle } from "lucide-react";

export default function PremiumInvoice({ invoice, onClose }) {
  if (!invoice) return null;

  const storedUser = localStorage.getItem("user");
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  const hName = currentUser?.hotelName || "YOUR HOTEL NAME";
  const hAddress = currentUser?.hotelAddress || "Your Hotel Address";
  const hContact = currentUser?.hotelContact || "Phone Number";
  const hEmail = currentUser?.hotelEmail || "";
  const hLogo = currentUser?.hotelLogo || "";
  const hGst = currentUser?.hotelGstNo || "";
  const hCin = currentUser?.hotelCinNo || "";

  const handlePrint = () => {
    window.print();
  };

  const checkInDate = new Date(invoice.createdAt);
  const dateStr = checkInDate.toLocaleDateString("en-GB", { day: '2-digit', month: '2-digit', year: '2-digit' });
  const timeStr = checkInDate.toLocaleTimeString("en-GB", { hour: '2-digit', minute: '2-digit' });
  
  const safeId = invoice._id ? invoice._id.toString() : "NEW123";
  const kotNo = invoice.kotNumber || invoice.invoiceNumber || safeId.substring(Math.max(0, safeId.length - 6)).toUpperCase();
  const billNo = invoice.invoiceNumber || safeId.substring(Math.max(0, safeId.length - 6)).toUpperCase();

  let subTotal = 0;
  if (invoice.items) {
    invoice.items.forEach(item => {
      subTotal += item.price * item.quantity;
    });
  }

  let cgst = 0;
  let sgst = 0;
  if (invoice.tax) {
    cgst = invoice.tax / 2;
    sgst = invoice.tax / 2;
  }

  const netAmount = subTotal - (invoice.discountAmount || 0) + cgst + sgst;

  const ThermalReceipt = () => (
    <div className="bg-white text-black font-mono mx-auto p-4" style={{ width: '80mm', minHeight: '100mm', fontSize: '12px', lineHeight: '1.2' }}>
      <div className="text-center mb-1">
        {hLogo && <img src={hLogo} alt="Hotel Logo" className="w-16 h-16 object-contain mx-auto mb-2 grayscale" />}
        <h1 className="text-xl font-bold tracking-wide uppercase">{hName}</h1>
        <p>Hotel Dashboard</p>
        <p className="break-words max-w-[250px] mx-auto">{hAddress}</p>
        <p>PHONE:- {hContact}</p>
        {hEmail && <p>{hEmail}</p>}
        {hGst && <p className="font-semibold">GSTIN: {hGst}</p>}
        {hCin && <p className="font-semibold">CIN: {hCin}</p>}
        <h2 className="font-bold underline mt-1 text-sm">Tax Invoice</h2>
      </div>

      <div className="border-t border-b border-black border-dashed my-1 py-1 flex justify-center">
        <span className="font-semibold mr-2">Kot No:</span>
        <span className="font-semibold">{kotNo}</span>
      </div>

      <div className="border-b border-black border-dashed pb-1 mb-1">
        <div className="flex justify-between font-semibold">
          <div className="w-[30%]">Bill No:</div>
          <div className="w-[35%] text-center">Date:</div>
          <div className="w-[35%] text-right">Time:</div>
        </div>
        <div className="flex justify-between">
          <div className="w-[30%]">{billNo}</div>
          <div className="w-[35%] text-center">{dateStr}</div>
          <div className="w-[35%] text-right">{timeStr}</div>
        </div>
      </div>

      <div className="border-b border-black border-dashed pb-1 mb-1 font-semibold">
        <div className="flex justify-between">
          <div className="w-[45%]">Item Name</div>
          <div className="w-[15%] text-center">Qty.</div>
          <div className="w-[20%] text-right">Rate</div>
          <div className="w-[20%] text-right">Amount</div>
        </div>
      </div>

      <div className="border-b border-black border-dashed pb-1 mb-1">
        {invoice.items && invoice.items.map((item, i) => (
          <div key={i} className="flex justify-between mb-1">
            <div className="w-[45%] break-words pr-1">{item.name}</div>
            <div className="w-[15%] text-center">{(item.quantity).toFixed(3)}</div>
            <div className="w-[20%] text-right">{(item.price).toFixed(2)}</div>
            <div className="w-[20%] text-right">{(item.price * item.quantity).toFixed(2)}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-end w-full mb-1 border-b border-black border-dashed pb-1">
        <div className="flex justify-end w-full font-semibold">
          <div className="w-[60%] text-right pr-4">Total:</div>
          <div className="w-[40%] text-right">{subTotal.toFixed(2)}</div>
        </div>
        {invoice.discountAmount > 0 && (
          <div className="flex justify-end w-full font-semibold">
            <div className="w-[60%] text-right pr-4">Discount ({invoice.discountPercentage}%):</div>
            <div className="w-[40%] text-right">-{invoice.discountAmount.toFixed(2)}</div>
          </div>
        )}
        {invoice.tax > 0 && (
          <>
            <div className="flex justify-end w-full">
              <div className="w-[60%] text-right pr-4">CGST 2.5%:</div>
              <div className="w-[40%] text-right">{cgst.toFixed(2)}</div>
            </div>
            <div className="flex justify-end w-full">
              <div className="w-[60%] text-right pr-4">SGST 2.5%:</div>
              <div className="w-[40%] text-right">{sgst.toFixed(2)}</div>
            </div>
          </>
        )}
        <div className="flex justify-end w-full font-bold mt-1 text-sm">
          <div className="w-[60%] text-right pr-4">Net Amount:</div>
          <div className="w-[40%] text-right">{netAmount.toFixed(2)}</div>
        </div>
      </div>

      <div className="mt-2 font-semibold">
        <span className="mr-4">Cashier:</span>
        <span>ROYAL</span>
      </div>

      <div className="mt-1 font-bold underline text-sm">
        Terms & Conditions
      </div>
      <div className="text-[11px] leading-tight mt-1">
        <p>1.All Disputes are Subject to DUMKA<br/>Jurisdiction only.</p>
        <p className="mt-1">2.If you are satisfied tell others, If not tell us</p>
      </div>

    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto print-modal-overlay">
      <div className="bg-slate-300 rounded-2xl w-full max-w-md shadow-2xl relative flex flex-col my-8 no-print max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-slate-400 shrink-0 bg-slate-900 rounded-t-2xl">
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle className="w-5 h-5" />
            <span className="font-semibold text-sm">Thermal Invoice Ready</span>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto bg-slate-400 flex-1 flex justify-center items-start">
          <div className="shadow-2xl">
            <ThermalReceipt />
          </div>
        </div>

        <div className="p-4 border-t border-slate-400 bg-slate-900 flex items-center justify-end gap-3 rounded-b-2xl shrink-0">
          <button onClick={onClose} className="px-4 py-2 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-xl text-sm font-medium transition-all">
            Close
          </button>
          <button onClick={handlePrint} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-amber-600/20 active:scale-95">
            <Printer className="w-4 h-4" />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>

      {/* Hidden Print Wrapper for Thermal Printer */}
      <div className="print-only hidden">
         <ThermalReceipt />
      </div>

      {/* Adding global styles for thermal printing if needed */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page {
            margin: 0;
            size: 80mm auto; /* Thermal paper width */
          }
          body {
            margin: 0;
            padding: 0;
          }
          .print-only {
            display: block !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}} />
    </div>
  );
}
