# Annapurna Astra - Restaurant KOT & Smart POS Billing System
## Complete Product & Operational Documentation (Client-Ready Guide)

---

### Executive Overview
**Annapurna Astra KOT & Restaurant Billing Engine** ek next-generation restaurant POS system hai jo multi-environment dining ko seamlessly automate karta hai. Chahe aapka restaurant **Dine-In Tables, Takeaway Parcels, Delivery Orders, ya Direct Customer QR Self-Ordering** run karta ho, Annapurna Astra order punching se lekar kitchen preparation aur final GST thermal billing tak 100% paperless aur real-time sync provide karta hai.

---

## 1. Core Modules & Multi-Screen Ecosystem

Annapurna Astra KOT suite mein 5 synced interfaces hain jo Server-Sent Events (SSE) aur WebSocket protocol se bina page refresh ke instant communicate karte hain:

| Screen / Module | Primary User | Functionality |
| :--- | :--- | :--- |
| **KOT Billing Desk (`/staff/kot`)** | Waiters / Captains / Cashiers | Interactive Floor Table Plan, Rapid Dish Catalog Search, Virtual Order Staging, Running Table Add-ons, Print KOT & Final Tax Bill. |
| **Kitchen Display System - KDS (`/staff/kds`)** | Kitchen Chefs / Head Cook | Kitchen wall screen par live running tickets, item-wise cooking timer, preparation state updates (Preparing ➔ Ready ➔ Delivered). |
| **Dining Hall Display (`/staff/hall-display`)** | Hall Captains & Waiters | Large LED TV display dining hall mein: kaun sa order ready hai aur kis table par serve karna hai. |
| **QR Scan & Order System (`/admin/qr-orders`)** | Admin / Cashier / Manager | Tables par lage Standee QR se aaye direct customer orders ko verify karna, decline/approve karna, aur Advance Table Reservations handle karna. |
| **KOT Reports & Analytics (`/admin/kot-reports`)** | Hotel Admin & Accounts | Live ongoing running KOTs, settled invoices, item-wise consumption, payment mode distribution, thermal bill reprint. |

---

## 2. Table Floor Management & Live Visual Plan

Restaurant floor par lage sabhi tables ka real-time visual dashboard:
1. **Color-Coded Statuses**:
   - 🟢 **Available (Green)**: Table free hai, naye guest ke liye ready.
   - 🔴 **Occupied (Red)**: Guests baithe hain, active running KOT order chal raha hai.
   - 🟡 **Advance Table Booking (Yellow)**: Guest ne online table reserve kiya hai.
2. **Occupied Table Intelligence**:
   - Red card par click karte hi table ka **ongoing order, added dishes, quantities, aur running running total** instant screen par load ho jata hai.
   - Guest kitni der se baitha hai aur last order kab punch hua tha, iska timestamp visible hota hai.
3. **Table Switching & Merging**:
   - Agar guest ek table se doosre table shift hota hai, to items aur running bill effortlessly transfer ho jate hain.

---

## 3. Order Punching & Virtual KOT Generation (`/staff/kot`)

Staff Panel ke `/staff/kot` par POS cashier ya captain ke liye ultra-fast billing interface design kiya gaya hai:

### Step 1: Dine-In vs Takeaway Selection
- **Dine-In**: Floor grid se table number select karein.
- **Takeaway / Delivery**: Direct Parcel mode select karein jisme customer name aur mobile number record hota hai.

### Step 2: Instant Menu Search & Category Filter
- **Category Filter**: All, Starters, Main Course, Breads, Rice, Beverages, Desserts, Chinese, South Indian.
- **Live Search**: Dish ka naam ya shortcut code type karte hi milliseconds mein matching items filter ho jate hain.
- **Portion & Variant Support**: Half / Full portions, Veg / Non-Veg badges, custom spice note.

### Step 3: Order Cart & Virtual Staging
- Selected items cart mein add hote hain with `+` / `-` quantity buttons.
- Subtotal, applicable taxes (CGST 2.5% + SGST 2.5% ya standard 5% restaurant GST), aur grand total auto-calculate hota hai.

### Step 4: KOT Punching & Instant Kitchen Routing
- Cashier **"Punch KOT"** click karta hai:
  1. System instant **Kitchen Order Ticket (KOT)** generate karta hai jisme Table No, KOT Number, Date/Time, Items aur Quantity print hoti hai.
  2. Kitchen ke **KDS screen** par ek loud chime ke saath order blink karne lagta hai.
  3. Table status instantly **Occupied (Red)** ban jata hai.

---

## 4. Running Table Add-on Items (Re-Ordering Flow)

Restaurant mein aksar guests beech mein extra roti, dal, cold drink ya dessert order karte hain:
1. Staff occupied table par click karta hai.
2. Pehle se punch ho chuke items locked state mein dikhte hain with tag `(Already in Kitchen)`.
3. Naye items menu se add kiye jate hain.
4. **"Punch Add-on KOT"** click karte hi sirf aur sirf **naya add-on item** kitchen ke liye print hota hai (taaki chef purana item dubara na banaye), jabki table ka master bill ek saath merge rehta hai!

---

## 5. Kitchen Display System (KDS - `/staff/kds`)

Traditional paper slips ke alawa Annapurna Astra smart Kitchen screens support karta hai:
1. **Live Ticket Pipeline**: Har ticket par Table No / Parcel tag, Waiter name, aur ordered items list hoti hai.
2. **Real-time Color Coded Cooking Timer**:
   - 🟢 `< 10 mins`: Normal speed.
   - 🟡 `10 - 20 mins`: Cooking in progress.
   - 🔴 `> 20 mins`: High priority order (alert blinking).
3. **1-Click Kitchen Statuses**:
   - `Start Preparing`: Chef khana banana shuru karta hai.
   - `Mark Ready`: Khana ban kar counter par aa chuka hai (Hall Display screen aur Waiter ko instant sound chime ke saath notify hota hai).
   - `Mark Delivered`: Waiter khana table par serve kar chuka hai.

---

## 6. Table QR Scan & Self-Ordering System (`/menu/:hotelId`)

Annapurna Astra har hotel ko unka dedicated **Master Branded QR Standee** deta hai:
1. **Customer Mobile Experience**:
   - Guest bina koi app download kiye camera se scan karta hai.
   - Mobile par hotel ka digital menu open ho jata hai with high-res food photos, descriptions, aur pricing.
   - Guest apna Table No aur items select karke order place karta hai.
2. **Admin Verification & Fraud Protection**:
   - Customer ka order seedhe kitchen mein jane ke bajaye Admin/Cashier ke **Incoming Orders** tab (`/admin/qr-orders`) par pending verification mein aata hai.
   - Cashier 1-click mein **Approve** (KOT auto-fired) ya **Decline with Reason** (e.g. Out of stock) karta hai.
   - Real-time customer ke phone par status update hota hai: *"Order Approved! Chef is preparing your food"*.
3. **Advance Table Reservation via QR**:
   - Customers ghar baithe QR link se dining table reserve kar sakte hain (Guest count, date, time, special requests).
   - Admin panel par instant sound alert aur **Pending Reservations Badge** show hota hai jahan se 1-click confirmation aur table allotment hota hai.

---

## 7. Checkout, Multi-Mode Payment & Tax Invoicing

Jab guest dining finish karke bill request karta hai:
1. Staff table par **"Generate Bill / Checkout"** click karta hai.
2. **Bill Settlement Options**:
   - **Discount**: Flat ₹ discount ya Percentage (%) discount.
   - **Payment Modes**: Cash, UPI / Dynamic QR Code, Credit/Debit Card, Net Banking.
   - **Split Payment**: Half Cash aur Half UPI payment seamlessly settle karne ki suvidha.
3. **Thermal Receipt Printing**:
   - Standard 80mm / 3-inch thermal printer par restaurant logo, Hotel GSTIN, FSSAI License Number, Bill Number, Table No, Itemized breakup, GST breakdown (CGST + SGST), aur "Thank You, Visit Again!" print hota hai.
4. **Table Release**:
   - Bill settle hote hi table immediately **Available (Green)** ho jata hai.

---

## 8. KOT Audit & Sales Reports (`/admin/kot-reports`)

Hotel Admin har moment ka financial aur operational control rakhta hai:
1. **Live Ongoing vs Settled Orders**: Active tables ke running orders aur completed bills ka alag view.
2. **Decline / Cancellation Audit**: Jo orders cancel ya decline hue, unka reason aur cashier ID track rehta hai taaki pilferage ya theft zero ho sake.
3. **Daily Sales Breakdown**: Total Food Sales, Total Beverage Sales, Total Tax collected, aur Payment mode summary.
4. **Instant Re-Print**: Purana bill kabhi bhi search karke single click par re-print kiya ja sakta hai.

---

## 9. Hardware & Infrastructure Support

- **Thermal POS Printers**: 80mm / 58mm USB, Bluetooth, aur Network (LAN/Wi-Fi) thermal printers support (Epson, TVS, Retsol, NGX, POSIFLEX).
- **Screens**: Touchscreen POS terminals, Windows PCs, Android Tablets, aur Smart LED TVs (Kitchen aur Hall display ke liye).
- **Zero Software Installation**: 100% web-based cloud SaaS; kisi bhi device ke browser par instantly open hota hai.
