const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const User = require("./models/User");
  const admin = await User.findOne({ role: "admin" });
  console.log("Admin User:", admin);
  
  mongoose.disconnect();
};
connectDB();
