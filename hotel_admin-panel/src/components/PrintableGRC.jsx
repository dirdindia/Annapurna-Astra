import React from "react";

export default function PrintableGRC({ grcNo }) {
  const storedUser = localStorage.getItem("user");
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  const hName = currentUser?.hotelName || "YOUR HOTEL NAME";
  const hAddress = currentUser?.hotelAddress || "Your Hotel Address";
  const hContact = currentUser?.hotelContact || "Phone Number";
  const hEmail = currentUser?.hotelEmail || "";
  const hLogo = currentUser?.hotelLogo || "";
  const hGst = currentUser?.hotelGstNo || "";
  const hCin = currentUser?.hotelCinNo || "";

  return (
    <div className="grc-form-container text-black font-sans relative w-full" style={{ boxSizing: 'border-box' }}>
      
      {/* Header */}
      <div className="flex flex-col items-center text-center w-full mb-4 relative">
        {hLogo && <img src={hLogo} alt="Hotel Logo" className="w-16 h-16 object-contain mx-auto mb-2 grayscale" />}
        <h1 className="text-2xl font-bold tracking-wide uppercase">{hName}</h1>
        <p className="text-[12px] font-semibold">Guest Registration Card</p>
        <p className="text-[12px] font-semibold mt-1 break-words max-w-[400px]">{hAddress}</p>
        <p className="text-[12px] font-semibold">PHONE:- {hContact}</p>
        {hEmail && <p className="text-[11px] font-semibold">E-MAIL:- {hEmail}</p>}
        {hGst && <p className="text-[11px] font-semibold">GSTIN:- {hGst}</p>}
        {hCin && <p className="text-[11px] font-semibold">CIN:- {hCin}</p>}
        
        <h2 className="text-sm font-bold underline mt-1">Arrival Report</h2>
        
        <div className="absolute right-2 top-2 text-xs font-semibold">
          GRC No. {grcNo}
        </div>
      </div>

      <div className="text-center font-bold text-xs underline mb-1">Fill By Guest</div>

      {/* Guest Name Grid */}
      <div className="w-full mb-1">
        <div className="flex items-center text-xs mb-1">
          <span className="w-16">Name 1 :</span>
          <div className="flex-1 grid gap-0 h-5 border-t border-l border-b border-black" style={{ gridTemplateColumns: 'repeat(31, minmax(0, 1fr))' }}>
            {Array.from({ length: 31 }).map((_, i) => (
              <div key={i} className="border-r border-black h-full"></div>
            ))}
          </div>
        </div>
        <div className="flex items-center text-xs mb-1">
          <span className="w-16">Name 2 :</span>
          <div className="flex-1 grid gap-0 h-5 border-t border-l border-b border-black" style={{ gridTemplateColumns: 'repeat(31, minmax(0, 1fr))' }}>
            {Array.from({ length: 31 }).map((_, i) => (
              <div key={i} className="border-r border-black h-full"></div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Details Table */}
      <div className="w-full text-xs flex flex-col gap-1.5 mb-2">
        <div className="flex items-center">
          <div className="w-[50%] flex border-b border-black pb-0.5">
            <span className="w-28">Father Name:</span>
            <div className="flex-1"></div>
          </div>
          <div className="w-[50%] flex border-b border-black pb-0.5 pl-2">
            <span className="w-24">No of Person</span>
            <div className="flex-1"></div>
          </div>
        </div>

        <div className="flex items-center border-b border-black pb-0.5">
          <span className="w-28">Company Name:</span>
          <div className="flex-1"></div>
        </div>

        <div className="flex items-center border-b border-black pb-0.5">
          <span className="w-28">Address :</span>
          <div className="flex-1"></div>
        </div>

        <div className="flex items-center">
          <div className="w-[40%] flex border-b border-black pb-0.5">
            <span className="w-28">City:</span>
            <div className="flex-1"></div>
          </div>
          <div className="w-[40%] flex border-b border-black pb-0.5 pl-2">
            <span className="w-24">Nationality :</span>
            <div className="flex-1"></div>
          </div>
          <div className="w-[20%] flex border-b border-black pb-0.5 pl-2">
            <span className="w-12">Age :</span>
            <div className="flex-1"></div>
          </div>
        </div>

        <div className="flex items-center border-b border-black pb-0.5">
          <span className="w-28">Mobile No. :</span>
          <div className="flex-1"></div>
        </div>

        <div className="flex items-center">
          <div className="w-[50%] flex border-b border-black pb-0.5">
            <span className="w-28">Date of Birth :</span>
            <div className="flex-1"></div>
          </div>
          <div className="w-[50%] flex border-b border-black pb-0.5 pl-2">
            <span className="w-24">Anniversary :</span>
            <div className="flex-1"></div>
          </div>
        </div>

        <div className="flex items-center">
          <div className="w-[50%] flex border-b border-black pb-0.5">
            <span className="w-28">Arrival From :</span>
            <div className="flex-1"></div>
          </div>
          <div className="w-[50%] flex border-b border-black pb-0.5 pl-2">
            <span className="w-24">Destination :</span>
            <div className="flex-1"></div>
          </div>
        </div>

        <div className="flex items-center">
          <div className="w-[50%] flex border-b border-black pb-0.5">
            <span className="w-28">Purpose visit :</span>
            <div className="flex-1"></div>
          </div>
          <div className="w-[50%] flex border-b border-black pb-0.5 pl-2">
            <span className="w-24">Mode Of Travel :</span>
            <div className="flex-1"></div>
          </div>
        </div>

        <div className="flex items-center">
          <div className="w-[50%] flex border-b border-black pb-0.5">
            <span className="w-28">Guest Id :</span>
            <div className="flex-1"></div>
          </div>
          <div className="w-[50%] flex border-b border-black pb-0.5 pl-2">
            <span className="w-24">Id Proff No. :</span>
            <div className="flex-1"></div>
          </div>
        </div>

        <div className="flex items-center border-b border-black pb-0.5">
          <span className="w-28">Remark :</span>
          <div className="flex-1"></div>
        </div>

        <div className="flex items-center pt-1 pb-1">
          <span className="w-32">Mode of Payment :</span>
          <div className="flex gap-4 items-center">
            <label className="flex items-center gap-1"><div className="w-4 h-4 border border-black"></div> CASH</label>
            <label className="flex items-center gap-1"><div className="w-4 h-4 border border-black"></div> TRAVEL AGENT</label>
            <label className="flex items-center gap-1"><div className="w-4 h-4 border border-black"></div> OTHER</label>
            <div className="w-24 border-b border-black"></div>
            <label className="flex items-center gap-1"><div className="w-4 h-4 border border-black"></div> CREDIT CARD NO.</label>
            <div className="w-32 border-b border-black"></div>
          </div>
        </div>
        
        <div className="flex items-center border-b border-black pb-0.5">
          <span className="w-48">BILL TO COMPANY NAME:</span>
          <div className="flex-1"></div>
        </div>
      </div>

      <div className="text-center font-bold text-xs underline mt-2 mb-1">Fill By Foreign Nationals Only</div>
      <div className="text-xs mb-1">Passport Details :</div>
      <div className="w-full border border-black flex flex-col text-xs mb-3">
        <div className="flex border-b border-black h-8 items-center bg-white">
          <div className="w-[15%] border-r border-black h-full flex items-center justify-center font-semibold">Number</div>
          <div className="w-[20%] border-r border-black h-full flex items-center justify-center font-semibold text-center">Place of issue</div>
          <div className="w-[15%] border-r border-black h-full flex items-center justify-center font-semibold text-center">Date of issue</div>
          <div className="w-[15%] border-r border-black h-full flex items-center justify-center font-semibold">Validity</div>
          <div className="w-[20%] border-r border-black h-full flex items-center justify-center font-semibold text-center">Date of Arrival in India</div>
          <div className="w-[15%] h-full flex items-center justify-center font-semibold text-center">Duration of stay in India</div>
        </div>
        <div className="flex h-8 items-center">
          <div className="w-[15%] border-r border-black h-full"></div>
          <div className="w-[20%] border-r border-black h-full"></div>
          <div className="w-[15%] border-r border-black h-full"></div>
          <div className="w-[15%] border-r border-black h-full"></div>
          <div className="w-[20%] border-r border-black h-full"></div>
          <div className="w-[15%] h-full"></div>
        </div>
      </div>

      <div className="text-xs mb-1">Certificate of Registration</div>
      <div className="flex text-xs mb-2">
        <div className="flex-1 flex border-b border-black pb-0 mr-4">
          <span className="w-16">Number</span>
          <div className="flex-1"></div>
        </div>
        <div className="flex-1 flex border-b border-black pb-0 mr-4">
          <span className="w-12">Date</span>
          <div className="flex-1"></div>
        </div>
        <div className="flex-1 flex border-b border-black pb-0">
          <span className="w-32">Palace of issued</span>
          <div className="flex-1"></div>
        </div>
      </div>
      
      <div className="text-center text-xs font-semibold mb-2">
        ( The registration of foreigners ( Form C ) Hotel Arrival Report Rule 14 of 4939 )
      </div>

      <div className="text-center font-bold text-xs underline mb-3">Fill By Front Desk</div>

      <div className="w-full text-xs flex flex-col gap-2 mb-4">
        <div className="flex items-center">
          <div className="w-[33%] flex border-b border-black pb-0.5 pr-2">
            <span className="w-24">Chk In Date :</span>
            <div className="flex-1"></div>
          </div>
          <div className="w-[33%] flex border-b border-black pb-0.5 pr-2">
            <span className="w-24">Chk In Time :</span>
            <div className="flex-1"></div>
          </div>
          <div className="w-[34%] flex border-b border-black pb-0.5">
            <span className="w-28">Chk Out Date :</span>
            <div className="flex-1"></div>
          </div>
        </div>

        <div className="flex items-center">
          <div className="w-[50%] flex border-b border-black pb-0.5 pr-2">
            <span className="w-24">Room No.:</span>
            <div className="flex-1"></div>
          </div>
          <div className="w-[25%] flex border-b border-black pb-0.5 pr-2">
            <span className="w-24">Room Type :</span>
            <div className="flex-1"></div>
          </div>
          <div className="w-[25%] flex border-b border-black pb-0.5">
            <span className="w-24">Advance :</span>
            <div className="flex-1"></div>
          </div>
        </div>

        <div className="flex items-center">
          <div className="w-[50%] flex border-b border-black pb-0.5 pr-2">
            <span className="w-28">Plan/Package :</span>
            <div className="flex-1"></div>
          </div>
          <div className="w-[25%] flex border-b border-black pb-0.5 pr-2">
            <span className="w-24">Plan Amount :</span>
            <div className="flex-1"></div>
          </div>
          <div className="w-[25%] flex border-b border-black pb-0.5">
            <span className="w-24">R.No. :</span>
            <div className="flex-1"></div>
          </div>
        </div>
        
        <div className="flex items-center border-b border-black pb-0.5">
          <span className="w-24">Comments</span>
          <div className="flex-1"></div>
        </div>
      </div>

      <div className="flex justify-between items-start text-[11px] mt-4">
        <div className="flex flex-col gap-1">
          <p>1. I agree to abide by the Hotel rules Printed overleaf.</p>
          <p>2. Any arms are not allowed in hotel primices.</p>
          <p>3. Dogs are not allowed in hotel primices.</p>
          <p>4. Alcohol not allowed into the hotel primices.</p>
        </div>
        <div className="font-semibold mt-4 text-xs">
          Check out time : 12:00 Noon
        </div>
      </div>

      <div className="signature-block flex justify-between items-end text-xs w-full mt-auto pt-4">
        <div className="w-32 text-center">
          Guest Signature
        </div>
        <div className="w-40 text-center">
          Front Office Assistant
        </div>
        <div className="w-32 text-center">
          ( Approved BY )
        </div>
      </div>

      {/* Global Print Styles */}
      <style>{`
        .grc-form-container {
          background-color: white;
          padding: 10mm;
          margin: 0 auto;
          max-width: 210mm;
          min-height: 290mm;
          display: flex;
          flex-direction: column;
        }
        @media print {
          @page { 
            size: A4 portrait; 
            margin: 0; /* MUST be 0 to hide browser headers and footers */
          }
          
          /* Strip ALL backgrounds from wrappers to fix blue/grey color */
          html, body, #root, [class*="bg-"] {
            background-color: transparent !important;
          }
          
          /* Enforce pure A4 dimensions for the form */
          .grc-form-container {
            background-color: white !important;
            width: 100% !important;
            height: 297mm !important; /* Full A4 height */
            max-width: none !important;
            min-height: 297mm !important;
            padding: 12mm !important; /* Safe zone padding */
            margin: 0 !important;
            position: relative !important;
            box-sizing: border-box !important;
            display: flex !important;
            flex-direction: column !important;
          }

          /* Force signature block to the absolute bottom of the A4 page padding area */
          .signature-block {
            position: absolute !important;
            bottom: 12mm !important;
            left: 12mm !important;
            right: 12mm !important;
            margin-top: auto !important;
          }

          body { 
            -webkit-print-color-adjust: exact !important; 
            margin: 0;
            padding: 0;
          }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}
