const mongoose = require("mongoose");

/**
 * Generate a short 2-5 character uppercase prefix code from hotel name.
 * Examples:
 * - "royal king" -> "RK"
 * - "Sapphire Inn" -> "SI"
 * - "Grand Portico Dumka" -> "GPD"
 * - "Hotel Annapurna" -> "HA"
 * - "Taj" -> "TAJ"
 * - "" / null -> "EA"
 */
function getHotelPrefixCode(hotelName) {
  if (!hotelName || typeof hotelName !== "string") return "EA";
  
  // Clean string: letters, numbers and spaces only
  const clean = hotelName.replace(/[^a-zA-Z0-9\s]/g, " ").trim().toUpperCase();
  const words = clean.split(/\s+/).filter(Boolean);

  if (words.length === 0) return "EA";

  if (words.length === 1) {
    const single = words[0];
    return single.length <= 4 ? single : single.slice(0, 4);
  }

  // Multiple words: take first character of each word up to 4 words
  const initials = words.map((w) => w[0]).join("");
  if (initials.length >= 2 && initials.length <= 4) {
    return initials;
  }
  return initials.slice(0, 4);
}

/**
 * Get default restaurant invoice prefix based on hotel name.
 * e.g. "royal king" -> "RK-REST-"
 */
function getDefaultRestaurantPrefix(hotelName) {
  const code = getHotelPrefixCode(hotelName);
  return `${code}-REST-`;
}

/**
 * Get default room invoice prefix based on hotel name.
 * e.g. "royal king" -> "RK-ROOM-"
 */
function getDefaultRoomPrefix(hotelName) {
  const code = getHotelPrefixCode(hotelName);
  return `${code}-ROOM-`;
}

/**
 * Generate next non-colliding invoice number for a hotel.
 * Checks against existing records in MongoDB to guarantee 100% uniqueness.
 */
async function generateUniqueInvoiceNumber({
  hotelId,
  hotelName = "",
  configuredPrefix = "",
  type = "restaurant", // "restaurant" | "room"
}) {
  let prefix = (configuredPrefix || "").trim();

  // If prefix is missing or is the generic unbranded default, generate from hotel name
  const isGeneric = !prefix || prefix === "REST-" || prefix === "ROOM-";
  if (isGeneric) {
    prefix = type === "room"
      ? getDefaultRoomPrefix(hotelName)
      : getDefaultRestaurantPrefix(hotelName);
  }

  // Ensure prefix ends with a hyphen if it doesn't already
  if (!prefix.endsWith("-")) {
    prefix = `${prefix}-`;
  }

  const modelName = type === "room" ? "RoomBooking" : "Invoice";
  const Model = mongoose.model(modelName);

  // Estimate start sequence from hotel's existing count
  const count = await Model.countDocuments({ hotelId });
  let seq = 1001 + count;
  let candidate = `${prefix}${seq}`;

  // Collision loop check: ensure candidate is globally unique in collection
  while (await Model.exists({ invoiceNumber: candidate })) {
    seq++;
    candidate = `${prefix}${seq}`;
  }

  return { invoiceNumber: candidate, resolvedPrefix: prefix };
}

module.exports = {
  getHotelPrefixCode,
  getDefaultRestaurantPrefix,
  getDefaultRoomPrefix,
  generateUniqueInvoiceNumber,
};

