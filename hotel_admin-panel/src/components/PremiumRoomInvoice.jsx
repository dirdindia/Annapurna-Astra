import React, { useState } from "react";
import { Printer, X, CheckCircle } from "lucide-react";

// Helper to convert number to words
function numberToWords(num) {
  const a = ['','One ','Two ','Three ','Four ', 'Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
  const b = ['', '', 'Twenty','Thirty','Forty','Fifty', 'Sixty','Seventy','Eighty','Ninety'];

  if ((num = num.toString()).length > 9) return 'overflow';
  let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return; let str = '';
  str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
  str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
  str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
  str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
  str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'Only' : 'Only';
  return str.trim();
}

export default function PremiumRoomInvoice({ booking, onClose, isSplit = false }) {
  if (!booking) return null;

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

  const checkInDate = new Date(booking.checkInTime);
  const checkOutDate = new Date(booking.checkOutTime || Date.now());
  const diffTime = Math.abs(checkOutDate - checkInDate);
  const gracePeriod = 2 * 60 * 60 * 1000;
  const adjustedDiffTime = Math.max(0, diffTime - gracePeriod);
  let diffDays = Math.ceil(adjustedDiffTime / (1000 * 60 * 60 * 24));
  if (diffDays === 0) diffDays = 1;

  const guestName = booking.guests && booking.guests[0] ? booking.guests[0].name.toUpperCase() : 'N/A';
  const pax = booking.guests ? booking.guests.length : 1;
  const roomType = booking.room?.type || 'N/A';
  const roomNo = booking.room?.roomNumber || 'N/A';
  const roomTariff = booking.room?.price || 0;
  const billNo = booking.invoiceNumber || booking._id.substring(booking._id.length - 6).toUpperCase();
  const grcNo = booking._id.substring(booking._id.length - 4).toUpperCase();
  
  const address = booking.hasGST ? booking.companyAddress : 'N/A';
  const company = booking.hasGST ? booking.companyName : '';
  const gstIn = booking.hasGST ? booking.gstNumber : '';

  const InvoiceContent = ({ isRestaurantOnly = false, isCombined = false }) => {
    const rows = [];
    let subTotal = 0;
    let cgst = 0;
    let sgst = 0;

    if (!isRestaurantOnly) {
      for (let i = 0; i < diffDays; i++) {
        const d = new Date(checkInDate);
        d.setDate(d.getDate() + i);
        rows.push({
          date: d.toLocaleDateString("en-GB", {day:'2-digit', month:'short', year:'numeric'}),
          vch: `RC/${billNo}`,
          desc: `Room Charge, Room No: ${roomNo}`,
          amt: roomTariff
        });
        subTotal += roomTariff;
      }
      cgst += subTotal * 0.025;
      sgst += subTotal * 0.025;
    }

    if (isCombined || isRestaurantOnly) {
      if (booking.restaurantBills) {
        booking.restaurantBills.forEach((bill) => {
          const bDate = new Date(bill.createdAt || checkOutDate);
          const bNo = bill.invoiceNumber || bill._id.substring(bill._id.length - 6).toUpperCase();
          if (bill.items) {
            bill.items.forEach((item) => {
              rows.push({
                date: bDate.toLocaleDateString("en-GB", {day:'2-digit', month:'short', year:'numeric'}),
                vch: `RB/${bNo}`,
                desc: `Restaurant: ${item.name} (Qty: ${item.quantity})`,
                amt: item.price * item.quantity
              });
              subTotal += item.price * item.quantity;
            });
          }
          if (bill.tax) {
            cgst += bill.tax / 2;
            sgst += bill.tax / 2;
          }
        });
      }
    }

    const grandTotal = subTotal + cgst + sgst;
    const amountInWords = numberToWords(Math.round(grandTotal));
    
    // Add empty rows to fill space if needed
    const fillRows = Array.from({ length: Math.max(0, 10 - rows.length) }).map((_, i) => ({
      date: "\u00A0", vch: "\u00A0", desc: "\u00A0", amt: null
    }));
    const allRows = [...rows, ...fillRows];

    return (
      <div className="bg-white text-black p-4 w-full text-sm font-sans relative" style={{ width: '800px', margin: '0 auto', pageBreakAfter: 'always' }}>
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="w-1/4 pt-2">
            {hLogo && <img src={hLogo} alt="Hotel Logo" className="w-24 h-24 object-contain" />}
          </div>
          <div className="w-2/4 text-center">
            <h1 className="text-3xl font-bold tracking-wide uppercase" style={{ color: '#000' }}>{hName}</h1>
            <p className="text-[11px] font-semibold mt-1 break-words max-w-[250px] mx-auto">{hAddress}</p>
            <p className="text-[11px] mt-1 font-semibold">PHONE:- {hContact}</p>
            {hEmail && <p className="text-[11px] font-semibold">E-MAIL:- {hEmail}</p>}
            <h2 className="text-sm font-bold mt-2 underline">Tax Invoice {isRestaurantOnly ? "(Restaurant)" : ""}</h2>
          </div>
          <div className="w-1/4 text-right pt-6 text-[10px] font-bold">
            {hGst && <p>GST IN:- {hGst}</p>}
            {hCin && <p>CIN:- {hCin}</p>}
            <p>SAC/HSN CODE:-996311</p>
          </div>
        </div>

        {/* Tables Box */}
        <div className="border border-black flex flex-col mt-4 w-full">
          <div className="flex border-b border-black font-semibold text-xs bg-gray-100">
            <div className="w-[30%] border-r border-black p-1">G.R.C. No.: {grcNo}</div>
            <div className="w-[20%] border-r border-black p-1">Bill No.</div>
            <div className="w-[25%] border-r border-black p-1 text-center">{billNo}</div>
            <div className="w-[25%] p-1 flex justify-between"><span>Room No. :</span><span>{roomNo}</span></div>
          </div>
          <div className="flex border-b border-black font-semibold text-xs text-center bg-gray-100">
            <div className="w-[35%] border-r border-black p-1 text-left pl-2">GUEST NAME</div>
            <div className="w-[15%] border-r border-black p-1">Room.Tariff.</div>
            <div className="w-[15%] border-r border-black p-1">Pax</div>
            <div className="w-[20%] border-r border-black p-1">Room Type</div>
            <div className="w-[15%] p-1">Nationality</div>
          </div>
          <div className="flex border-b border-black text-xs text-center">
            <div className="w-[35%] border-r border-black p-1 text-left pl-2 uppercase">{guestName}</div>
            <div className="w-[15%] border-r border-black p-1">{roomTariff}</div>
            <div className="w-[15%] border-r border-black p-1">{pax}/0</div>
            <div className="w-[20%] border-r border-black p-1">{roomType}</div>
            <div className="w-[15%] p-1 uppercase">INDIAN</div>
          </div>
          <div className="flex border-b border-black font-semibold text-xs text-center bg-gray-100">
            <div className="w-[50%] border-r border-black p-1 text-center">ADDRESS</div>
            <div className="w-[25%] border-r border-black p-1">Check In Date & Time</div>
            <div className="w-[25%] p-1">Check Out Date & Time</div>
          </div>
          <div className="flex border-b border-black text-xs">
            <div className="w-[50%] border-r border-black p-1 uppercase whitespace-pre-wrap">{address}</div>
            <div className="w-[25%] border-r border-black p-1 text-center flex flex-col justify-center">
              <span>{checkInDate.toLocaleDateString("en-GB")}</span>
              <span>{checkInDate.toLocaleTimeString("en-GB", {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
            <div className="w-[25%] p-1 text-center flex flex-col justify-center">
              <span>{checkOutDate.toLocaleDateString("en-GB")}</span>
              <span>{checkOutDate.toLocaleTimeString("en-GB", {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
          </div>
          <div className="flex border-b border-black text-xs bg-gray-100 font-semibold">
            <div className="w-[12%] p-1">Company</div>
            <div className="w-[48%] p-1 uppercase">: {company}</div>
            <div className="w-[25%] p-1 uppercase">{gstIn}</div>
            <div className="w-[15%] p-1 text-right">Plan: CP</div>
          </div>
        </div>

        {/* Main Table Content */}
        <div className="border border-black border-t-0 flex flex-col w-full" style={{ minHeight: '350px' }}>
          <div className="flex border-b border-black font-semibold text-xs bg-gray-100 h-6">
            <div className="w-[15%] border-r border-black p-1">Date</div>
            <div className="w-[15%] border-r border-black p-1">Bill/Voucher</div>
            <div className="w-[45%] border-r border-black p-1">Description</div>
            <div className="w-[12.5%] border-r border-black p-1 text-center">Debit</div>
            <div className="w-[12.5%] p-1 text-center">Credit</div>
          </div>
          
          <div className="flex-1 flex text-xs relative pb-[120px]">
            <div className="w-[15%] border-r border-black p-1">
              {allRows.map((r, i) => <div key={`d-${i}`}>{r.date}</div>)}
            </div>
            <div className="w-[15%] border-r border-black p-1">
              {allRows.map((r, i) => <div key={`v-${i}`}>{r.vch}</div>)}
            </div>
            <div className="w-[45%] border-r border-black p-1">
              {allRows.map((r, i) => <div key={`desc-${i}`} className="truncate">{r.desc}</div>)}
            </div>
            <div className="w-[12.5%] border-r border-black p-1 text-right pr-2">
              {allRows.map((r, i) => <div key={`deb-${i}`}>{r.amt !== null ? r.amt.toFixed(2) : "\u00A0"}</div>)}
            </div>
            <div className="w-[12.5%] p-1"></div>

            <div className="flex border-t border-black text-xs absolute bottom-0 w-full bg-white h-[120px]">
              <div className="w-[60%] border-r border-black flex flex-col">
                <div className="font-semibold p-1">Remark :</div>
                <div className="p-1 pb-4 italic font-semibold">: {amountInWords}</div>
              </div>
              <div className="w-[40%] flex">
                <div className="w-[60%] border-r border-black flex flex-col">
                  <div className="p-1 border-b border-black h-6">TOTAL</div>
                  <div className="p-1 h-6">AMOUNT</div>
                  <div className="p-1 h-6">CGST @2.5%</div>
                  <div className="p-1 h-6">SGST @2.5%</div>
                  <div className="p-1 border-t border-black font-semibold h-[24px]">BALANCE</div>
                </div>
                <div className="w-[40%] flex flex-col text-right">
                  <div className="p-1 border-b border-black pr-2 h-6">{subTotal.toFixed(2)}</div>
                  <div className="p-1 pr-2 h-6">{subTotal.toFixed(2)}</div>
                  <div className="p-1 pr-2 h-6">{cgst.toFixed(2)}</div>
                  <div className="p-1 pr-2 h-6">{sgst.toFixed(2)}</div>
                  <div className="p-1 border-t border-black font-semibold pr-2 h-[24px]">{grandTotal.toFixed(2)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Area */}
        <div className="border border-black border-t-0 p-2 text-[10px] w-full flex flex-col relative pb-8">
          <p className="font-semibold">Mode of Payment: {booking.finalPaymentMode || 'Cash'} {booking.advancePaymentMode ? `(Adv: ${booking.advancePaymentMode})` : ''}</p>
          {/* <div className="absolute left-10 top-2 w-[70px] h-[70px] border border-black rounded-full flex flex-col items-center justify-center opacity-40 rotate-[-15deg] pointer-events-none">
            <span className="text-[7px] font-bold text-center leading-tight mt-1">ROYAL<br/>MAJESTIC</span>
            <span className="text-[7px] border-t border-b border-black w-[80%] text-center my-0.5">DUMKA<br/>814101</span>
            <span className="text-[7px] mb-1">(Jh.)</span>
          </div> */}

          <div className="text-center mt-4 flex flex-col items-center z-10 w-full relative">
            <p className="font-bold text-[11px] border-b border-black pb-0.5 inline-block mx-auto mb-1 tracking-wide">
              PLEASE RETURN YOUR KEY ON DEPARTURE
            </p>
            <p className="uppercase mb-1" style={{ fontSize: '8.5px' }}>
              I AGREE THAT I AM RESPONSIBLE FOR THE FULL PAYMENT OF THIS BILL IN THE EVENTS,IF IT IS NOT PAID (BY THE COMPANY/ORGANIGATION OR PERSON INDICATED)
            </p>
            <p className="font-bold text-[11px] uppercase mb-1 underline tracking-wide">
              CHECK OUT TIME: 24Hrs
            </p>
            <p className="italic font-semibold mb-6">
              (Subject to Dumka Juridiction)
            </p>
          </div>

          <div className="flex justify-between items-end w-full px-4 text-xs font-semibold mt-4">
            <div className="text-center">
              <div className="w-32 border-b border-black mb-1"></div>
              <p>Cashier's Signature</p>
            </div>
            <div className="text-center flex-1 italic text-[11px] px-4 font-normal">
              -------------------Thank You for Honouring us by your visit-------------------
            </div>
            <div className="text-center">
              <div className="w-32 border-b border-black mb-1"></div>
              <p>Guest's Signature</p>
            </div>
          </div>
          
          <div className="absolute bottom-2 right-4 text-xs font-semibold">
            Page: 1
          </div>
          <div className="absolute bottom-2 left-4 text-[9px] font-semibold">
            E. & O. E.
          </div>
        </div>
      </div>
    );
  }

  const hasRestaurant = booking.restaurantBills && booking.restaurantBills.length > 0;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto print-modal-overlay">
      <div className="bg-slate-300 rounded-2xl w-full max-w-4xl shadow-2xl relative flex flex-col my-8 no-print h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-slate-400 shrink-0 bg-slate-900 rounded-t-2xl">
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle className="w-5 h-5" />
            <span className="font-semibold text-sm">Invoice Generated Successfully</span>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto bg-slate-400 flex-1 flex flex-col items-center gap-8">
          {isSplit && hasRestaurant ? (
            <>
              <div className="shadow-2xl bg-white p-4 scale-[0.8] origin-top md:scale-100">
                <InvoiceContent isRestaurantOnly={false} isCombined={false} />
              </div>
              <div className="shadow-2xl bg-white p-4 scale-[0.8] origin-top md:scale-100 mt-4">
                <InvoiceContent isRestaurantOnly={true} isCombined={false} />
              </div>
            </>
          ) : (
            <div className="shadow-2xl bg-white p-4 scale-[0.8] origin-top md:scale-100">
              <InvoiceContent isRestaurantOnly={false} isCombined={true} />
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-400 bg-slate-900 flex items-center justify-end gap-3 rounded-b-2xl shrink-0">
          <button onClick={onClose} className="px-4 py-2 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-xl text-sm font-medium transition-all">
            Close
          </button>
          <button onClick={handlePrint} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-amber-600/20 active:scale-95">
            <Printer className="w-4 h-4" />
            <span>Print Invoice</span>
          </button>
        </div>
      </div>

      <div className="print-only hidden w-full">
        {isSplit && hasRestaurant ? (
          <>
            <InvoiceContent isRestaurantOnly={false} isCombined={false} />
            <InvoiceContent isRestaurantOnly={true} isCombined={false} />
          </>
        ) : (
          <InvoiceContent isRestaurantOnly={false} isCombined={true} />
        )}
      </div>
    </div>
  );
}
