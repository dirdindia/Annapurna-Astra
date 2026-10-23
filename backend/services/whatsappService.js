const axios = require("axios");

/**
 * Send a message via Meta Official WhatsApp Cloud API
 * @param {string} to - Recipient phone number with country code (e.g. "919204188464")
 * @param {string} text - Message text to send
 * @param {object} customConfig - Optional per-hotel config (token, phoneNumberId)
 */
const sendMetaWhatsAppMessage = async (to, text, customConfig = {}) => {
  const token = customConfig.accessToken || process.env.WHATSAPP_TOKEN;
  const phoneNumberId = customConfig.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    return {
      success: false,
      isConfigured: false,
      message: "Meta WhatsApp Cloud API credentials not configured in backend/.env",
    };
  }

  // Format recipient phone number: remove '+' or non-digit characters
  let cleanTo = String(to).replace(/\D/g, "");
  // If Indian 10-digit number without country code, prepend 91
  if (cleanTo.length === 10) {
    cleanTo = `91${cleanTo}`;
  }

  try {
    const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;
    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: cleanTo,
      type: "text",
      text: {
        preview_url: true,
        body: text,
      },
    };

    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      timeout: 12000,
    });

    return {
      success: true,
      isConfigured: true,
      messageId: response.data?.messages?.[0]?.id,
      data: response.data,
    };
  } catch (error) {
    const errorDetails = error.response?.data?.error;
    console.error("[WhatsAppService] Meta API Error:", errorDetails || error.message);
    return {
      success: false,
      isConfigured: true,
      error: errorDetails?.message || error.message,
      code: errorDetails?.code,
      fbtrace_id: errorDetails?.fbtrace_id,
    };
  }
};

/**
 * Format invoice into a clean, professional WhatsApp bill
 */
const formatInvoiceMessage = ({
  hotelName,
  hotelAddress,
  hotelPhone,
  hotelGst,
  invoiceNumber,
  customerName,
  tableOrRoom,
  items,
  subTotal,
  discountAmount,
  tax,
  grandTotal,
  paymentMode,
  billUrl,
  createdAt,
}) => {
  const billDate = new Date(createdAt || Date.now()).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  let itemsText = "";
  if (Array.isArray(items) && items.length > 0) {
    itemsText = items
      .map(
        (it) =>
          `• ${it.quantity}x ${it.name} — ₹${Number(it.price * it.quantity).toFixed(0)}`
      )
      .join("\n");
  } else {
    itemsText = "• Bill Items Recorded";
  }

  const lines = [
    `🏨 *${hotelName ? hotelName.toUpperCase() : "HOTEL INVOICE"}*`,
    hotelAddress ? `📍 _${hotelAddress}_` : null,
    hotelPhone ? `📞 Phone: ${hotelPhone}` : null,
    hotelGst ? `🏛️ GSTIN: ${hotelGst}` : null,
    `━━━━━━━━━━━━━━━━━━━━`,
    `🧾 *Invoice No:* #${invoiceNumber}`,
    `📅 *Date:* ${billDate}`,
    customerName ? `👤 *Guest:* ${customerName}` : null,
    tableOrRoom ? (tableOrRoom.toLowerCase().includes("room") ? `🛏️ *Room:* ${tableOrRoom}` : `🍽️ *Table:* ${tableOrRoom}`) : null,
    `━━━━━━━━━━━━━━━━━━━━`,
    tableOrRoom?.toLowerCase().includes("room") ? `📋 *STAY & BILL SUMMARY:*` : `📋 *ORDER SUMMARY:*`,
    itemsText,
    `━━━━━━━━━━━━━━━━━━━━`,
    `💰 *Subtotal:* ₹${Number(subTotal || 0).toFixed(2)}`,
    discountAmount && discountAmount > 0
      ? `🏷️ *Discount:* -₹${Number(discountAmount).toFixed(2)}`
      : null,
    tax && tax > 0 ? `⚖️ *GST (Taxes):* ₹${Number(tax).toFixed(2)}` : null,
    `💳 *Grand Total:* ₹${Number(grandTotal || 0).toFixed(2)} (${paymentMode || "Paid"})`,
    `━━━━━━━━━━━━━━━━━━━━`,
    billUrl ? `📄 *Download Official Bill & Receipt:*\n\n${billUrl}\n` : null,
    tableOrRoom?.toLowerCase().includes("room") ? `🙏 *Thank you for staying with us! Visit again.*` : `🙏 *Thank you for dining with us! Visit again.*`,
    `_Powered by Annapurna Astra_ ✨`,
  ];

  return lines.filter(Boolean).join("\n");
};

/**
 * Generate Direct wa.me Deep Link
 */
const generateWaMeLink = (phone, text) => {
  let cleanPhone = String(phone || "").replace(/\D/g, "");
  if (cleanPhone.length === 10) cleanPhone = `91${cleanPhone}`;
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
};

/**
 * Send WhatsApp Invoice (Attempts Cloud API first, always provides wa.me fallback link)
 */
const sendInvoiceWhatsApp = async ({
  customerMobile,
  customerName,
  hotel,
  invoice,
  billUrl,
  customConfig = {},
}) => {
  if (!customerMobile) {
    return { success: false, message: "Customer mobile number is missing" };
  }

  const formattedText = formatInvoiceMessage({
    hotelName: hotel?.name,
    hotelAddress: hotel?.address ? `${hotel.address}, ${hotel.city || ""}` : "",
    hotelPhone: hotel?.phone || hotel?.receptionPhone,
    hotelGst: hotel?.gstin,
    invoiceNumber: invoice.invoiceNumber || invoice._id?.toString().slice(-6).toUpperCase(),
    customerName: customerName || invoice.customerName,
    tableOrRoom: invoice.table?.tableNo ? `Table ${invoice.table.tableNo}` : (invoice.tableNo || (invoice.roomBookingId ? "Room Service" : "")),
    items: invoice.items,
    subTotal: invoice.subTotal,
    discountAmount: invoice.discountAmount,
    tax: invoice.tax,
    grandTotal: invoice.grandTotal,
    paymentMode: invoice.paymentMode,
    billUrl: billUrl,
    createdAt: invoice.createdAt,
  });

  const waLink = generateWaMeLink(customerMobile, formattedText);

  // Attempt Meta Cloud API background send
  const metaResult = await sendMetaWhatsAppMessage(customerMobile, formattedText, customConfig);

  return {
    success: metaResult.success,
    sentViaApi: metaResult.success,
    isConfigured: metaResult.isConfigured,
    apiResponse: metaResult,
    waLink: waLink,
    message: metaResult.success
      ? "Bill successfully sent to customer's WhatsApp via Cloud API!"
      : "Cloud API not sent (use direct link).",
  };
};

module.exports = {
  sendMetaWhatsAppMessage,
  formatInvoiceMessage,
  generateWaMeLink,
  sendInvoiceWhatsApp,
};
