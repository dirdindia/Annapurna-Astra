import React from "react";
import { Printer, X } from "lucide-react";

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

export default function PremiumSubscriptionInvoice({ invoice, onClose }) {
  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const invoiceDate = new Date(invoice.createdAt);
  const totalAmount = invoice.amount || 0;
  
  // Calculate base and platform fee (assuming 2% platform fee was added)
  // Let's deduce base from total: base = total / 1.02
  const baseAmount = totalAmount / 1.02;
  const platformFee = totalAmount - baseAmount;
  
  const amountInWords = numberToWords(Math.round(totalAmount));

  return (
    <div className="fixed inset-0 z-[100] bg-gray-500 overflow-y-auto">
      {/* Top action bar (Hidden on Print) */}
      <div className="sticky top-0 bg-white shadow-md px-6 py-4 flex justify-between items-center z-10 print:hidden">
        <h2 className="text-xl font-bold text-gray-800">Print Subscription Invoice</h2>
        <div className="flex gap-4">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold transition-colors"
          >
            <Printer className="w-5 h-5" /> Print
          </button>
          <button 
            onClick={onClose}
            className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 px-5 py-2 rounded-lg font-semibold transition-colors"
          >
            <X className="w-5 h-5" /> Close
          </button>
        </div>
      </div>

      <style>
        {`
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .print\\:hidden { display: none !important; }
            .page-break { page-break-after: always; }
          }
        `}
      </style>

      {/* Printable Area */}
      <div className="bg-white text-black p-8 w-full text-sm font-sans relative my-8 mx-auto shadow-2xl print:shadow-none print:m-0" style={{ width: '800px' }}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4 border-b-2 border-black pb-4">
          <div className="w-1/4">
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-lagoon-900 to-lagoon-500 uppercase font-display">StayFlow</h1>
            <p className="text-xs mt-1 font-bold text-lagoon-900">StayFlow Solutions</p>
          </div>
          <div className="w-2/4 text-center">
            <h1 className="text-xl font-bold tracking-wide uppercase underline">Tax Invoice (Subscription)</h1>
            <p className="text-xs font-semibold mt-2">www.stayflow.com</p>
            <p className="text-xs font-semibold">support@stayflow.com</p>
          </div>
          <div className="w-1/4 text-right text-xs font-bold space-y-1">
            <p>Invoice No: {invoice.txnid}</p>
            <p>Date: {invoiceDate.toLocaleDateString("en-GB", {day:'2-digit', month:'short', year:'numeric'})}</p>
          </div>
        </div>

        {/* Customer Details */}
        <div className="border border-black p-4 mb-4 bg-gray-50 flex justify-between">
          <div className="w-1/2">
            <h3 className="font-bold border-b border-gray-300 pb-1 mb-2 uppercase text-xs">Billed To (Hotel)</h3>
            <p className="font-bold text-sm">{invoice.hotelId?.name || invoice.customerName || 'N/A'}</p>
            <p className="text-xs mt-1">Email: {invoice.hotelId?.email || invoice.customerEmail}</p>
            {invoice.hotelId?.contact && <p className="text-xs mt-1">Contact: {invoice.hotelId.contact}</p>}
          </div>
          <div className="w-1/2 text-right">
            <h3 className="font-bold border-b border-gray-300 pb-1 mb-2 uppercase text-xs">Plan Details</h3>
            <p className="font-bold text-sm capitalize">{invoice.planName} Plan</p>
            <p className="text-xs mt-1 text-emerald-700 font-bold uppercase">Status: {invoice.status}</p>
          </div>
        </div>

        {/* Table */}
        <table className="w-full border-collapse border border-black mb-4">
          <thead>
            <tr className="bg-gray-200 text-black">
              <th className="border border-black p-2 text-left w-12 text-xs">S.No</th>
              <th className="border border-black p-2 text-left text-xs">Description</th>
              <th className="border border-black p-2 text-center w-24 text-xs">Quantity</th>
              <th className="border border-black p-2 text-right w-32 text-xs">Rate (₹)</th>
              <th className="border border-black p-2 text-right w-32 text-xs">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-black p-2 text-center">1</td>
              <td className="border border-black p-2 font-semibold">
                SaaS Subscription - {invoice.planName} Plan
                <div className="text-[10px] font-normal text-gray-600 mt-1">Software as a Service (Access)</div>
              </td>
              <td className="border border-black p-2 text-center">1</td>
              <td className="border border-black p-2 text-right">{baseAmount.toFixed(2)}</td>
              <td className="border border-black p-2 text-right font-bold">{baseAmount.toFixed(2)}</td>
            </tr>
            <tr>
              <td className="border border-black p-2 text-center">2</td>
              <td className="border border-black p-2 font-semibold">
                Platform Processing Fee (2%)
              </td>
              <td className="border border-black p-2 text-center">-</td>
              <td className="border border-black p-2 text-right">-</td>
              <td className="border border-black p-2 text-right font-bold">{platformFee.toFixed(2)}</td>
            </tr>
            {/* Empty rows to fill space */}
            {Array.from({ length: 3 }).map((_, i) => (
              <tr key={i}>
                <td className="border border-black p-2">&nbsp;</td>
                <td className="border border-black p-2">&nbsp;</td>
                <td className="border border-black p-2">&nbsp;</td>
                <td className="border border-black p-2">&nbsp;</td>
                <td className="border border-black p-2">&nbsp;</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="4" className="border border-black p-2 text-right font-bold text-xs uppercase bg-gray-100">
                Total Amount
              </td>
              <td className="border border-black p-2 text-right font-bold text-sm bg-gray-100">
                ₹{totalAmount.toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Amount in words & Signature */}
        <div className="flex border border-black p-4 min-h-[120px]">
          <div className="w-2/3 border-r border-black pr-4">
            <p className="text-xs font-semibold underline mb-1">Amount Chargeable (in words)</p>
            <p className="text-sm font-bold capitalize">Rupees {amountInWords}</p>
            
            <p className="text-[10px] text-gray-500 mt-6">
              * This is a computer generated invoice and does not require a physical signature.<br/>
              * Valid for 1 Year subscription from the date of payment.
            </p>
          </div>
          <div className="w-1/3 flex flex-col justify-end items-center pl-4 pb-2">
            <div className="w-32 border-b border-black mb-1"></div>
            <p className="text-xs font-bold">Authorized Signatory</p>
            <p className="text-[10px] font-semibold mt-1 uppercase text-lagoon-700">StayFlow</p>
          </div>
        </div>
      </div>
    </div>
  );
}
