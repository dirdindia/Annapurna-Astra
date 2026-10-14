const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const User = require("./models/User");
const Dish = require("./models/Dish");

// Load env variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Default route
app.get("/", (req, res) => {
  res.send("Zoox is running...");
});

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/upload", require("./routes/uploadRoutes"));
app.use("/api/dishes", require("./routes/dishRoutes"));
app.use("/api/invoices", require("./routes/invoiceRoutes"));
app.use("/api/rooms", require("./routes/roomRoutes"));
app.use("/api/room-bookings", require("./routes/roomBookingRoutes"));
app.use("/api/tables", require("./routes/tableRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/grc", require("./routes/grcRoutes"));
app.use("/api/inventory", require("./routes/inventoryRoutes"));
app.use("/api/lookups", require("./routes/lookupRoutes"));
app.use("/api/superadmin", require("./routes/superAdminRoutes"));
app.use("/api/kds", require("./routes/kdsRoutes"));
app.use("/api/payment", require("./routes/paymentRoutes"));
app.use("/api/public", require("./routes/publicRoutes"));
// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
});

// Seed Admin User if none exists
const seedAdmin = async () => {
  try {
    const adminCount = await User.countDocuments({ role: "admin" });
    if (adminCount === 0) {
      console.log("No admin accounts found. Seeding default admin...");
      await User.create({
        name: "Super Admin",
        email: "admin@gmail.com",
        password: "admin@123", // Hashes automatically via pre-save hook
        role: "admin",
        mobile: "9999999999",
        age: 45,
        address: "HOTEL SWAYAMVAR VATIKA",
      });
      console.log("Default admin created successfully!");
      console.log("Email: admin@gmail.com");
      console.log("Password: password-admin@123");
    }
  } catch (error) {
    console.error(`Error seeding admin: ${error.message}`);
  }
};

// Seed Default Menu Dishes if none exist
// const seedDishes = async () => {
//   try {
//     const dishCount = await Dish.countDocuments();
//     if (dishCount === 0) {
//       console.log("No menu dishes found. Seeding default items...");
//       const defaultDishes = [
//         {
//           name: "Veg Thali Special",
//           price: 150,
//           category: "Veg Thali",
//           image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=60"
//         },
//         {
//           name: "Paneer Butter Masala",
//           price: 180,
//           category: "Paneer",
//           image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&auto=format&fit=crop&q=60"
//         },
//         {
//           name: "Fresh Sweet Dahi",
//           price: 40,
//           category: "Dahi",
//           image: "https://images.unsplash.com/photo-1571244856353-fb08f55d283f?w=600&auto=format&fit=crop&q=60"
//         },
//         {
//           name: "Gulab Jamun (Sweets)",
//           price: 50,
//           category: "Sweets",
//           image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=60"
//         },
//         {
//           name: "Special Dal Makhani",
//           price: 120,
//           category: "Veg Thali",
//           image: "https://images.unsplash.com/photo-1585857188825-7d2cfcfb0155?w=600&auto=format&fit=crop&q=60"
//         },
//         {
//           name: "Butter Naan",
//           price: 30,
//           category: "Rice & Bread",
//           image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=600&auto=format&fit=crop&q=60"
//         }
//       ];
//       await Dish.insertMany(defaultDishes);
//       console.log("Default menu dishes seeded successfully!");
//     }
//   } catch (error) {
//     console.error(`Error seeding dishes: ${error.message}`);
//   }
// };

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await seedAdmin();
  // await seedDishes();
});

