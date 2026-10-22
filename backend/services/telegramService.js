const axios = require("axios");

/**
 * Send a raw Telegram message via the Telegram Bot API.
 * 100% Free - uses official Telegram Bot API
 */
const sendTelegramMessage = async (chatId, text, parseMode = "HTML") => {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    console.warn("[TelegramService] TELEGRAM_BOT_TOKEN is not set in backend/.env");
    return {
      success: false,
      message: "Telegram Bot Token configure nahi hai! Kripya backend/.env me TELEGRAM_BOT_TOKEN add karein (@BotFather se free token milta hai).",
    };
  }

  if (!chatId) {
    return {
      success: false,
      message: "Chat ID is required",
    };
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await axios.post(
      url,
      {
        chat_id: chatId,
        text,
        parse_mode: parseMode,
      },
      { timeout: 8000 }
    );

    return { success: true, data: response.data };
  } catch (error) {
    let errorMsg =
      error.response?.data?.description || error.message || "Failed to send message";
    console.error("[TelegramService] Error:", errorMsg);

    if (errorMsg.includes("chat not found")) {
      errorMsg = "Telegram Error: 'chat not found'. Kripya pehle apne phone Telegram me bot (@e_annapurna_alerts_bot) open karke 'START' dabayein. Aur check karein ki aapne numeric Chat ID (e.g. 123456789) dali hai, username nahi.";
    } else if (errorMsg.includes("bot was blocked by the user")) {
      errorMsg = "Telegram Error: Bot blocked. Kripya Telegram bot ko unblock karein aur 'START' dabayein.";
    }

    return { success: false, error: errorMsg };
  }
};

/**
 * Send an Instant Anti-Theft KOT / Item Cancellation Alert with Authorization OTP.
 */
const sendCancelAlertOtp = async ({
  chatId,
  hotelName,
  tableOrOrder,
  items,
  totalAmount,
  cashierName,
  reason,
  otp,
  cancellationType = "full_order",
}) => {
  const isFullOrder = cancellationType === "full_order";
  const title = isFullOrder
    ? "🚨 <b>ANTI-THEFT ALERT: KOT CANCEL ATTEMPT</b>"
    : "⚠️ <b>ANTI-THEFT ALERT: ITEM VOID ATTEMPT</b>";

  let itemsText = "";
  if (Array.isArray(items) && items.length > 0) {
    itemsText = items
      .map(
        (it) =>
          `• <b>${it.name}</b> (${it.quantity}x) — ₹${it.price * it.quantity}`
      )
      .join("\n");
  } else {
    itemsText = "• (Items details recorded in audit)";
  }

  const message = `${title}

🏨 <b>Hotel:</b> ${hotelName || "Restaurant"}
📍 <b>Location:</b> ${tableOrOrder || "Dine-in"}
👤 <b>Cashier:</b> ${cashierName || "Staff"}
💰 <b>Total Amount:</b> ₹${totalAmount || 0}
📝 <b>Reason:</b> ${reason || "Customer request"}

📋 <b>Items:</b>
${itemsText}

━━━━━━━━━━━━━━━━━━━━
🔑 <b>AUTHORIZATION OTP:</b> <code>${otp}</code>
━━━━━━━━━━━━━━━━━━━━
⏱️ <i>Yeh OTP agle 5 minute ke liye valid hai.</i>
⚠️ <i>Sirf tabhi cashier ko OTP batayein jab cancellation genuine ho. Cash lene ke baad KOT cancel karna fraud ho sakta hai!</i>`;

  return await sendTelegramMessage(chatId, message);
};

/**
 * Send Confirmation Alert when cancellation is approved with valid OTP
 */
const sendCancelApprovedNotification = async ({
  chatId,
  hotelName,
  tableOrOrder,
  totalAmount,
  cashierName,
  reason,
}) => {
  const message = `✅ <b>KOT CANCELLATION AUTHORIZED</b>

🏨 <b>Hotel:</b> ${hotelName || "Restaurant"}
📍 <b>Location:</b> ${tableOrOrder}
👤 <b>Cashier:</b> ${cashierName}
💰 <b>Amount Voided:</b> ₹${totalAmount}
📝 <b>Reason:</b> ${reason}

ℹ️ <i>Action authorized via OTP and recorded in system audit log.</i>`;

  return await sendTelegramMessage(chatId, message);
};

/**
 * Send a Test Notification to verify bot connection
 */
const sendTestAlert = async (chatId, hotelName) => {
  const message = `🎉 <b>TELEGRAM ALERTS CONNECTED!</b>

🏨 <b>Hotel:</b> ${hotelName || "Your Restaurant"}
🛡️ <b>Anti-Theft Protection:</b> Active

Ab se jab bhi koi cashier printed KOT ya item cancel karega, aapke is Telegram par <b>Instant Alert aur OTP</b> aa jayega.

Aapka restaurant business ab 100% fraud-proof hai! 🚀`;

  return await sendTelegramMessage(chatId, message);
};

module.exports = {
  sendTelegramMessage,
  sendCancelAlertOtp,
  sendCancelApprovedNotification,
  sendTestAlert,
};
