const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./models/User");

dotenv.config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log("MongoDB Connected");
  let admin = await User.findOne({ role: "admin" });
  if (admin) {
    admin.email = "admin@gmail.com";
    admin.password = "admin@123";
    await admin.save();
    console.log("Admin updated successfully");
  } else {
    console.log("No admin found to update");
  }
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
