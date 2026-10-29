const Order = require("../models/Order");
const Dish = require("../models/Dish");

/**
 * Normalizes dish names by stripping item code prefixes (e.g. [VE01], [ST01], VE01 -)
 * so "[VE01] Veg Thali" and "Veg Thali" merge into a single item.
 */
const cleanDishName = (raw) => {
  if (!raw) return "";
  return raw
    .replace(/^\[[A-Za-z0-9_.-]+\]\s*/i, "") // strips [VE01], [ST01]
    .replace(/^[A-Za-z0-9_.-]{2,8}\s*[-:]\s*/i, "") // strips VE01 - or VE01:
    .replace(/\s+/g, " ")
    .trim();
};

/**
 * @desc    Get Simple Daily Forecast & Top 10 Selling Dishes based on Hotel's Last 30 Days Actual Orders
 * @route   GET /api/inventory/ai-forecast
 * @access  Private (Staff / Hotel Admin)
 */
exports.getDailyPrepForecast = async (req, res) => {
  try {
    const hotelId = req.user.hotelId || req.user._id;
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    // Target date (defaults to today)
    const targetDate = req.query.date ? new Date(req.query.date) : new Date();
    const targetDOW = targetDate.getDay();
    const dayName = daysOfWeek[targetDOW];
    const isWeekend = targetDOW === 0 || targetDOW === 5 || targetDOW === 6; // Fri, Sat, Sun

    // 1. Fetch hotel's actual orders in the last 30 days
    const thirtyDaysAgo = new Date(targetDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    const orders = await Order.find({
      hotelId,
      status: { $ne: "Cancelled" },
      createdAt: { $gte: thirtyDaysAgo, $lte: targetDate },
    }).select("items createdAt status");

    // Track sales per dish
    const dishStats = {};
    const dayOccurrences = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    const datesSet = new Set();

    orders.forEach((order) => {
      if (!order.createdAt) return;
      const orderDate = new Date(order.createdAt);
      const dow = orderDate.getDay();
      const dateKey = orderDate.toISOString().split("T")[0];

      if (!datesSet.has(dateKey)) {
        datesSet.add(dateKey);
        dayOccurrences[dow] = (dayOccurrences[dow] || 0) + 1;
      }

      if (Array.isArray(order.items)) {
        order.items.forEach((item) => {
          const rawName = (item.name || "").trim();
          if (!rawName) return;

          // Clean item code prefixes so duplicates merge
          const displayName = cleanDishName(rawName) || rawName;
          const key = displayName.toLowerCase();
          const qty = Number(item.quantity) || 1;
          const price = Number(item.price) || 0;
          const category = item.category || "Main Menu";

          if (!dishStats[key]) {
            dishStats[key] = {
              name: displayName,
              totalSold: 0,
              totalRevenue: 0,
              category: (category !== "Main Menu" && category !== "General") ? category : category,
              dowSold: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
              orderCount: 0,
            };
          } else {
            // Upgrade category to more specific one if available
            if ((dishStats[key].category === "Main Menu" || dishStats[key].category === "General") && category && category !== "Main Menu") {
              dishStats[key].category = category;
            }
          }

          dishStats[key].totalSold += qty;
          dishStats[key].totalRevenue += qty * price;
          dishStats[key].dowSold[dow] = (dishStats[key].dowSold[dow] || 0) + qty;
          dishStats[key].orderCount += 1;
        });
      }
    });

    const activeDaysCount = datesSet.size || 1;
    const thisDowOccurrences = dayOccurrences[targetDOW] || 1;

    let forecastedItems = [];
    const statKeys = Object.keys(dishStats);

    // 2. If orders exist in the last 30 days: Calculate demand based on real orders
    if (statKeys.length > 0) {
      forecastedItems = statKeys.map((key) => {
        const item = dishStats[key];
        const dowQty = item.dowSold[targetDOW] || 0;

        // Average for this specific day of week
        const dowAvg = dowQty / thisDowOccurrences;
        // Overall daily average across last 30 active days
        const dailyAvg = item.totalSold / activeDaysCount;

        // Weighted estimate: 65% day-of-week trend + 35% overall daily average
        let projected = Math.round(dowAvg * 0.65 + dailyAvg * 0.35);
        if (projected < 1 && item.totalSold > 0) projected = 1;

        // Suggested prep with safety buffer (+10% to prevent running out during rush)
        const recommendedPrep = Math.ceil(projected * 1.1);

        return {
          dishName: item.name,
          category: item.category,
          totalSold30Days: item.totalSold,
          totalRevenue: Math.round(item.totalRevenue),
          expectedToday: projected,
          recommendedPrep,
          dowSales: dowQty,
        };
      })
      // Sort by highest selling items first
      .sort((a, b) => b.totalSold30Days - a.totalSold30Days);
    } else {
      // 3. Fallback: If no orders yet in past 30 days, load the hotel's actual Menu Dishes
      const actualHotelDishes = await Dish.find({ hotelId })
        .limit(10)
        .select("name category price");

      if (actualHotelDishes.length > 0) {
        const seenMenuNames = new Set();
        forecastedItems = [];

        actualHotelDishes.forEach((dish, i) => {
          const cleaned = cleanDishName(dish.name) || dish.name;
          const k = cleaned.toLowerCase();
          if (seenMenuNames.has(k)) return;
          seenMenuNames.add(k);

          const baselineQty = isWeekend ? Math.max(10 - i, 3) : Math.max(6 - i, 2);
          forecastedItems.push({
            dishName: cleaned,
            category: dish.category || "Main Menu",
            totalSold30Days: baselineQty * 6,
            totalRevenue: baselineQty * 6 * (dish.price || 150),
            expectedToday: baselineQty,
            recommendedPrep: Math.ceil(baselineQty * 1.1),
            dowSales: baselineQty,
            isMenuFallback: true,
          });
        });
      }
    }

    // Strictly limit to Top 10 items
    const top10Dishes = forecastedItems.slice(0, 10).map((item, idx) => {
      let badge = "Regular Demand";
      let badgeColor = "slate";
      if (idx === 0) {
        badge = "🔥 #1 Bestseller";
        badgeColor = "rose";
      } else if (idx <= 2) {
        badge = "⭐ High Demand";
        badgeColor = "amber";
      } else if (idx <= 5) {
        badge = "⚡ Steady Sales";
        badgeColor = "emerald";
      }

      return {
        ...item,
        rank: idx + 1,
        demandBadge: badge,
        badgeColor,
      };
    });

    // 4. Practical kitchen guidance for the chef
    const top1 = top10Dishes[0];
    const top2 = top10Dishes[1];

    let aiHeadline = "";
    let prepAdvice = "";
    let wastageTip = "";

    if (top1) {
      if (isWeekend) {
        aiHeadline = `Aaj ${dayName} hai (Weekend Rush). Past 30 days ke hisaab se '#1 ${top1.dishName}' sabse zyada order hota hai.`;
        prepAdvice = `Aaj '${top1.dishName}' ke average ${top1.expectedToday} orders expected hain (Suggested Prep: ${top1.recommendedPrep} portions)${top2 ? ` aur '${top2.dishName}' ke ${top2.expectedToday} orders` : ""}. Morning me advance prep rakhein taaki delays na hon.`;
        wastageTip = `Wastage se bachne ke liye subah 60% batch prep karein aur baki 40% evening rush ke time fresh banayein.`;
      } else {
        aiHeadline = `Aaj ${dayName} hai. Past 30 days actual sales ke mutabik Top 10 demand list ready hai.`;
        prepAdvice = `Aapke top item '${top1.dishName}' ke lagbhag ${top1.expectedToday} orders expected hain${top2 ? ` aur '${top2.dishName}' ke ${top2.expectedToday} orders` : ""}. Chef is quantity ko dekh kar morning prep checklist ready karein.`;
        wastageTip = `Chopping, boiling aur gravies subah ready rakhein taaki rush time me kitchen smooth chale.`;
      }
    } else {
      aiHeadline = `Aaj ${dayName} hai. Real-time kitchen demand analysis ready hai.`;
      prepAdvice = `Top selling dishes dekh kar aaj ki morning prep checklist prepare karein.`;
      wastageTip = `Demand ke mutabik batch preparation follow karein.`;
    }

    res.status(200).json({
      success: true,
      data: {
        date: targetDate.toISOString().split("T")[0],
        dayName,
        isWeekend,
        totalOrdersAnalyzed: orders.length,
        activeDaysAnalyzed: activeDaysCount,
        aiHeadline,
        prepAdvice,
        wastageTip,
        rushHours: {
          lunch: "1:00 PM - 3:30 PM",
          dinner: isWeekend ? "8:00 PM - 11:15 PM (Weekend Rush)" : "8:00 PM - 10:30 PM",
        },
        topSellingItems: top10Dishes,
      },
    });
  } catch (error) {
    console.error("AI Daily Prep Forecast Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate AI Prep Forecast",
      error: error.message,
    });
  }
};
