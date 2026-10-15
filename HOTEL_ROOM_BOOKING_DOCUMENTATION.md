# Annapurna Astra - Hotel Room Booking & Front Desk Management
## Complete Product & Operational Documentation (Client-Ready Guide)

---

### Executive Overview
**Annapurna Astra Hotel Room Booking & Front Desk System** ek enterprise-grade Cloud PMS (Property Management System) hai jo hotel owners, front office managers, aur desk staff ko unke hotel ke saare operations seamlessly manage karne ki suvidha deta hai.

Isme room inventory create karne se lekar **guest check-in (with live webcam photo & document capture), GST compliance verification, advance booking, daily room tariff billing, discount/service charges, multi-mode split payment, thermal/A4 tax invoice generation**, aur **GRC (Guest Registration Card) printout** tak sabhi features available hain.

---

## 1. System Architecture & Access Hierarchy

Annapurna Astra mein 2 complementary panels hain jo synchronized database ke saath real-time operate karte hain:

| Role / Panel | Access URL | Primary Responsibilities |
| :--- | :--- | :--- |
| **Hotel Admin Panel** | `/admin` | Complete Hotel Configuration, Room Inventory setup, Master Room Tariffs, Room Audit Reports, Financial Tracking, Staff Permission Controls, GRC Sequences, Hotel branding (Logo/GST/Address/Bank details). |
| **Hotel Staff Panel** | `/staff` | Daily Front Desk Execution, Instant Guest Check-In, Live Webcam KYC Verification, Advance Room Reservations, Room Status Monitoring, Checkout & Tax Billing, GRC Printing. |

---

## 2. Master Room Inventory & Tariff Setup (Admin Panel)

Hotel Admin Panel ke **Manage > Rooms** (`/admin/rooms`) se hotel ke har room ki setting hoti hai:

1. **Room Creation & Category Assignment**:
   - **Room Number**: Unique identifier (e.g., 101, 202, Deluxe-01).
   - **Room Type**: AC, Non-AC, Deluxe, Super Deluxe, Suite, Executive.
   - **Bed Configuration**: Single, Double, Triple, Family Bed setup.
   - **Base Price per Night**: Standard default tariff (₹ per night) jo check-in karte waqt automatic load hota hai.
2. **Room Status Visual Grid**:
   - 🟢 **Available (Green)**: Room clean, ready for instant check-in or booking.
   - 🔴 **Occupied (Red)**: Guest currently stayed in room.
   - 🟡 **Advance-Booked (Yellow)**: Reserved for a customer arriving on an upcoming date.
   - ⚪ **Maintenance / Cleaning**: Room temporarily out of service.
3. **Edit & Delete Control**: Room rates aur configuration dynamically update kiye ja sakte hain bina ongoing check-ins ko affect kiye.

---

## 3. Front Desk Guest Check-In Workflow (Staff Panel)

Front Desk Staff `Staff Panel > Room Booking` (`/staff/rooms`) se guests ka check-in karte hain.

### Step-by-Step Check-In Process:
1. **Room Selection**: Staff screen par available room card par click karta hai.
2. **Guest Information**:
   - **Primary Guest Details**: Full Name, Age, Mobile Number.
   - **Additional Guests**: `+ Add Guest` button se room mein stay karne wale har adult/child ka alag record add hota hai.
3. **Live KYC & Digital Document Capture**:
   - **Live Webcam Photo**: Front desk webcam se guest ki live live picture capture hoti hai jo police verification/GRC ke liye mandatory hai.
   - **Government ID Verification**: Dropdown options (Aadhar Card, Passport, Driving License, Voter ID).
   - **ID Number & Document Upload/Snapshot**: ID card ka number aur photo directly upload ya webcam se capture ki jati hai.
4. **Corporate / B2B GST Verification**:
   - Agar guest corporate trip par hai, to `Apply GST` toggle enable kiya jata hai.
   - **GST Number Input**: Company ka GSTIN enter karke automated validation hota hai.
   - **Company Name & Billing Address**: Invoice mein automatically print hone ke liye save hota hai.
5. **Advance Deposit Recording**:
   - Check-in ke waqt guest dwara diya gaya advance token amount enter kiya jata hai.
   - Payment Mode: Cash, UPI, Card, Net Banking.
   - System advance amount ka record receipt ke saath lock karta hai jo checkout billing mein automatic deduct ho jata hai.
6. **Expected Stay Period**:
   - Check-in Date/Time aur Expected Check-out Date select karke confirm karte hi room status instant **Occupied (Red)** ho jata hai.

---

## 4. Advance Room Booking & Reservation (Upcoming Guests)

Agar guest future date ke liye room book karta hai:
1. Staff room card click karke **Booking Type: "Advance Booking"** select karta hai.
2. Expected Check-In Date aur Expected Check-Out Date enter ki jati hai.
3. Guest ka contact number aur token advance deposit record hota hai.
4. Room grid par room ka color **Yellow (Advance Booked)** display hota hai taaki koi dusra staff double-booking na kare.
5. Jab guest actually hotel arrive karta hai, yellow card click karke **"Convert to Check-in"** par 1-click mein active check-in ho jata hai bina details dobara bhare.

---

## 5. Guest Registration Card (GRC) Printing (`/staff/grc`)

Hotel compliance aur local authority guidelines ke anusaar har guest se check-in ke samay GRC sign karwana anivarya hota hai:
1. **Automated Sequence Counter**: System automatically har guest ke liye continuous serial number GRC-001, GRC-002 maintain karta hai.
2. **Complete Pre-filled Information**:
   - Hotel Name, Logo, Address, Registration details.
   - Guest Name, Mobile Number, Nationality, Arrived From, Proceeding To.
   - Room Number, Room Type, Rate, Check-in Date & Time, Check-out Date.
   - Number of Pax (Male/Female/Children), ID Type & ID Number.
   - Terms & Conditions and Guest Signature Box.
3. **Print & Counter Increment**: Desk staff `Print GRC` click karta hai; print command execute hote hi server par sequence number automatic agle number par increment ho jata hai. Admin chahe to sequence reset bhi kar sakta hai.

---

## 6. Checkout & Automated Billing Engine

Jab guest checkout ke liye front desk par aata hai, staff occupied room card par click karta hai:

1. **Automated Stay Calculation**:
   - System guest ke check-in timestamp aur checkout time ka exact difference calculate karta hai.
   - Number of days/nights ke hisaab se total room tariff automatic multiply ho jata hai.
   - Staff chahe to manual discount ya rate adjustment kar sakta hai.
2. **Advance Amount Auto-Deduction**:
   - Check-in ke time diya gaya advance payment total bill se automatically minus ho jata hai.
   - **Net Payable Balance** screen par highlight ho jata hai.
3. **Payment Modes & Split Bill**:
   - Cash, UPI/QR Code, Credit/Debit Card, Direct Bank Transfer.
   - **Split Bill Feature**: Agar guest half cash aur half UPI pay karna chahe, to multiple payment split allow hota hai.
4. **GST / Non-GST Invoice Generation**:
   - Central GST (CGST) aur State GST (SGST) room tariff slab ke anusaar dynamically calculate hota hai.
   - Corporate GSTIN invoice mein cleanly format hota hai jisse guest company input tax credit (ITC) claim kar sake.
5. **Instant Room Turnover**:
   - Payment submit hote hi room status immediately **Available (Green)** ho jata hai, jisse agla guest check-in kar sake.

---

## 7. Reports & Financial Audit (Admin Panel > Room Reports)

Hotel Admin Panel ke `/admin/room-reports` mein complete audit trail rehta hai:
1. **Detailed Booking History**: Har purani aur active booking ka date-wise filter, guest search by mobile/name.
2. **Digital KYC Vault**: Guest ki photo aur upload kiya gaya ID proof kisi bhi samay view aur download kiya ja sakta hai.
3. **Invoice Archive & Re-Print**: Purana bill kisi bhi waqt open karke A4 ya 3-inch thermal printer format mein re-print ya PDF download kiya ja sakta hai.
4. **Payment Mode Analytics**: Daily Cash collection, UPI collection, aur Card collection ka alag breakdown jo night audit ko zero-error banata hai.

---

## 8. Hardware & Printer Compatibility

- **Desktop & Laptops**: Kisi bhi Chrome / Edge browser par full responsiveness.
- **Webcams**: Inbuilt laptop camera ya USB external HD webcams (Logitech, etc.) plug-and-play support.
- **Printers Supported**:
  - Regular A4 / Letter Laser & Inkjet Printers (HP, Canon, Epson, Brother).
  - 80mm (3-inch) Thermal POS Printers (TVS, Epson, Xprinter) for rapid counter slips.
