import React, { useEffect, useRef, useState } from "react";
import { Printer, X, CheckCircle, Send } from "lucide-react";
import html2canvas from "html2canvas";
import Swal from "sweetalert2";
import api, { orderAPI } from "../api";

export default function ThermalReceipt({ invoice, onClose, isKot = false }) {
  const receiptRef = useRef(null);
  const [isSendingWa, setIsSendingWa] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      window.print();
    }, 500);
    return () => {
      clearTimeout(timer);
    };
  }, []);

  if (!invoice) return null;

  const storedUser = localStorage.getItem("user");
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  const hName = currentUser?.hotelName || "YOUR HOTEL NAME";
  const hAddress = currentUser?.hotelAddress || "Your Hotel Address";
  const hContact = currentUser?.hotelContact || "Phone Number";
  const hEmail = currentUser?.hotelEmail || "";
  const hCashier = invoice.createdBy?.name || currentUser?.name || "STAFF";
  const hLogo = currentUser?.hotelLogo || "";
  const hGst = currentUser?.gstin || currentUser?.hotelGstNo || "";
  const hCin = currentUser?.hotelCinNo || "";
  const hUpiId = currentUser?.upiId || "";
  const hTerms = currentUser?.invoiceTerms || "1. All Disputes are Subject to local Jurisdiction only.\n2. If you are satisfied tell others, If not tell us.";

  const checkInDate = new Date(invoice.createdAt || Date.now());
  const dateStr = checkInDate.toLocaleDateString("en-GB", { day: '2-digit', month: '2-digit', year: '2-digit' });
  const timeStr = checkInDate.toLocaleTimeString("en-GB", { hour: '2-digit', minute: '2-digit' });
  
  const safeId = invoice._id ? invoice._id.toString() : "NEW123";
  const defaultPrefix = currentUser?.invoicePrefixRestaurant || "REST-";
  const kotNo = invoice.kotNumber || invoice.invoiceNumber || safeId.substring(Math.max(0, safeId.length - 6)).toUpperCase();
  const billNo = invoice.invoiceNumber || `${defaultPrefix}${safeId.substring(Math.max(0, safeId.length - 6)).toUpperCase()}`;
  const tableNo = (invoice.table && invoice.table.tableNo) ? invoice.table.tableNo : invoice.tableNo || 'N/A';

  const foodTaxRate = Number(invoice.taxRate !== undefined ? invoice.taxRate : (currentUser?.foodGstRate !== undefined ? currentUser.foodGstRate : 5));
  const halfTaxRate = (foodTaxRate / 2).toFixed(1).replace(/\.0$/, '');

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

  const ReceiptContent = () => (
    <div ref={receiptRef} className="bg-white text-black font-mono mx-auto px-2 pb-4" style={{ width: '80mm', minHeight: '100mm', fontSize: '12px', lineHeight: '1.2' }}>
      <div className="text-center mb-1">
        {!isKot && hLogo && <img src={hLogo} alt="Hotel Logo" className="w-16 h-16 object-contain mx-auto mb-2 grayscale" />}
        <h1 className="text-xl font-bold tracking-wide uppercase">{isKot ? "KITCHEN KOT" : hName}</h1>
        {!isKot && (
          <>
            <p>Hotel Dashboard</p>
            <p className="break-words max-w-[250px] mx-auto">{hAddress}</p>
            <p>PHONE:- {hContact}</p>
            {hEmail && <p>{hEmail}</p>}
            {hGst && <p className="font-semibold">GSTIN: {hGst}</p>}
            {hCin && <p className="font-semibold">CIN: {hCin}</p>}
            <h2 className="font-bold underline mt-1 text-sm">Tax Invoice</h2>
          </>
        )}
      </div>

      <div className="border-t border-b border-black border-dashed my-1 py-1 flex justify-center">
        <span className="font-semibold mr-2">Kot No:</span>
        <span className="font-semibold">{kotNo}</span>
      </div>

      <div className="border-b border-black border-dashed pb-1 mb-1">
        <div className="flex justify-between font-semibold">
          <div className="w-[20%]">Bill No:</div>
          <div className="w-[30%] text-center">Table No:</div>
          <div className="w-[25%] text-center">Date:</div>
          <div className="w-[25%] text-right">Time:</div>
        </div>
        <div className="flex justify-between">
          <div className="w-[20%]">{billNo}</div>
          <div className="w-[30%] text-center">{tableNo !== 'N/A' ? tableNo : ''}</div>
          <div className="w-[25%] text-center">{dateStr}</div>
          <div className="w-[25%] text-right">{timeStr}</div>
        </div>
      </div>

      <div className="border-b border-black border-dashed pb-1 mb-1 font-semibold">
        <div className="flex justify-between">
          <div className={`w-[45%] ${isKot ? 'w-[70%]' : ''}`}>Item Name</div>
          <div className={`w-[15%] text-center ${isKot ? 'w-[30%] text-right' : ''}`}>Qty.</div>
          {!isKot && <div className="w-[20%] text-right">Rate</div>}
          {!isKot && <div className="w-[20%] text-right">Amount</div>}
        </div>
      </div>

      <div className="border-b border-black border-dashed pb-1 mb-1">
        {invoice.items && invoice.items.map((item, i) => (
          <div key={i} className="flex justify-between mb-1">
            <div className={`w-[45%] break-words pr-1 ${isKot ? 'w-[70%]' : ''}`}>{item.name}</div>
            <div className={`w-[15%] text-center font-bold ${isKot ? 'w-[30%] text-right text-base' : ''}`}>{(item.quantity).toFixed(3)}</div>
            {!isKot && <div className="w-[20%] text-right">{(item.price).toFixed(2)}</div>}
            {!isKot && <div className="w-[20%] text-right">{(item.price * item.quantity).toFixed(2)}</div>}
          </div>
        ))}
      </div>

      {!isKot && (
        <>
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
                  <div className="w-[60%] text-right pr-4">CGST {halfTaxRate}%:</div>
                  <div className="w-[40%] text-right">{cgst.toFixed(2)}</div>
                </div>
                <div className="flex justify-end w-full">
                  <div className="w-[60%] text-right pr-4">SGST {halfTaxRate}%:</div>
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
            <span className="uppercase">{hCashier}</span>
          </div>

          {hUpiId && (
            <div className="mt-4 mb-2 flex flex-col items-center justify-center border-t border-b border-black border-dashed py-2">
              <div className="font-bold text-sm mb-1 uppercase tracking-wider">Scan & Pay</div>
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&margin=1&data=${encodeURIComponent(`upi://pay?pa=${hUpiId}&pn=${encodeURIComponent(hName)}&am=${netAmount.toFixed(2)}&cu=INR`)}`} 
                alt="UPI QR Code" 
                className="w-24 h-24 object-contain mix-blend-multiply"
                crossOrigin="anonymous"
              />
              <div className="text-[10px] mt-1 font-semibold">UPI: {hUpiId}</div>
            </div>
          )}

          <div className="mt-2 font-bold underline text-sm">
            Terms & Conditions
          </div>
          <div className="text-[11px] leading-tight mt-1 whitespace-pre-line">
            {hTerms}
          </div>
        </>
      )}

      {isKot && (
        <>
          <div className="mt-2 font-semibold">
            <span className="mr-4">Staff:</span>
            <span className="uppercase">{hCashier}</span>
          </div>
          <div className="mt-2 text-center font-bold uppercase tracking-widest text-lg">
            Please Prepare Items
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[80] bg-white text-black flex justify-center items-start overflow-auto pb-10 print-receipt-wrapper">
      
      {/* Non-print UI buttons */}
      <div className="fixed top-4 right-4 no-print flex gap-2 z-[85] flex-wrap justify-end">
        {isKot && (
          <button
            onClick={async () => {
              try {
                await orderAPI.printKOT({
                  orderNo: kotNo,
                  tableNo: invoice.table?.tableNo || invoice.tableNo,
                  items: invoice.items,
                  type: invoice.orderType || 'Dine-in'
                });
                alert("KOT sent to printer successfully!");
              } catch (error) {
                console.error(error);
                alert("Failed to send KOT to printer.");
              }
            }}
            className="px-4 py-2 bg-green-600 text-white rounded font-bold shadow-lg"
          >
            Network Print (KOT)
          </button>
        )}
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold shadow-lg transition-colors cursor-pointer"
        >
          Normal Print
        </button>
        <button
          type="button"
          onClick={async () => {
            let mobile = invoice.customerMobile;
            const hasValidMobile = mobile && mobile !== "N/A" && mobile.replace(/\D/g, "").length >= 10;
            
            // Prompt for mobile number (prefill if available)
            const { value: inputMobile } = await Swal.fire({
              title: "Send WhatsApp Bill",
              text: "Customer ka 10-digit WhatsApp number dalein:",
              input: "tel",
              inputValue: hasValidMobile ? mobile.replace(/\D/g, "").slice(-10) : "",
              inputPlaceholder: "9876543210",
              showCancelButton: true,
              confirmButtonText: "Send Bill",
              cancelButtonText: "Cancel",
              customClass: {
                container: "swal2-topmost"
              },
              didOpen: (modal) => {
                const container = modal.closest(".swal2-container") || modal.parentElement;
                if (container) container.style.zIndex = "99999999";
              }
            });
            if (!inputMobile) return;
            mobile = inputMobile;

              setIsSendingWa(true);
              try {
                if (invoice._id && invoice._id !== "PROFORMA") {
                  const res = await api.post(`/api/invoices/${invoice._id}/send-whatsapp`, {
                    targetMobile: mobile,
                  });

                  if (res.data?.waLink) {
                    window.open(res.data.waLink, "_blank");
                    Swal.fire({
                      icon: "success",
                      title: "Opening WhatsApp Web 📲",
                      text: `WhatsApp chat opened for ${mobile}. Bas WhatsApp me Send button dabayein!`,
                      timer: 3500,
                      showConfirmButton: false,
                      didOpen: (modal) => {
                        const container = modal.closest(".swal2-container") || modal.parentElement;
                        if (container) container.style.zIndex = "99999999";
                      }
                    });
                  } else {
                    Swal.fire({
                      icon: "info",
                      title: "WhatsApp Bill Ready",
                      text: res.data?.message || "Bill processed.",
                      didOpen: (modal) => {
                        const container = modal.closest(".swal2-container") || modal.parentElement;
                        if (container) container.style.zIndex = "99999999";
                      }
                    });
                  }
                } else {
                  // Direct wa.me fallback
                  const text = `🏨 *${hName}* - Tax Invoice\nBill No: #${billNo}\nTotal: ₹${netAmount.toFixed(2)}\nThank you for visiting!`;
                  const link = `https://wa.me/91${mobile.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
                  window.open(link, "_blank");
                }
              } catch (err) {
                console.error(err);
                Swal.fire({
                  icon: "error",
                  title: "Failed to Send",
                  text: err.response?.data?.message || "Could not send WhatsApp bill.",
                  didOpen: (modal) => {
                    const container = modal.closest(".swal2-container") || modal.parentElement;
                    if (container) container.style.zIndex = "99999999";
                  }
                });
              } finally {
                setIsSendingWa(false);
              }
            }}
            disabled={isSendingWa}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold shadow-lg flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{isSendingWa ? "Sending..." : "WhatsApp Bill"}</span>
          </button>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded font-bold shadow-lg transition-colors cursor-pointer"
        >
          Close
        </button>
      </div>

      <div className="w-[300px] bg-white p-4 font-mono text-sm leading-tight text-black print:w-[80mm] print:m-0 print:p-0">
        <ReceiptContent />
      </div>

      {/* Global styles for print format */}
      <style>{`
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          @page {
            margin: 0px !important;
            padding: 0px !important;
          }
          
          /* Reset everything that might trap fixed positioning */
          * {
            transform: none !important;
            animation: none !important;
            transition: none !important;
            backdrop-filter: none !important;
          }

          /* Completely remove Navbar and Sidebar from layout flow */
          nav, aside, .no-print {
            display: none !important;
          }

          /* Hide other elements visually */
          body * {
            visibility: hidden;
          }

          /* Reset root containers so they don't add padding or heights */
          #root, 
          #root > div, 
          #root > div > div {
            position: static !important;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            min-height: 0 !important;
          }

          /* Unhide the receipt and lock it to the absolute top of the page */
          .print-receipt-wrapper, .print-receipt-wrapper * {
            visibility: visible;
          }
          .print-receipt-wrapper {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
}
