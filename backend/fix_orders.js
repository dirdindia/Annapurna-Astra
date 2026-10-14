const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const Order = require("./models/Order");
const Invoice = require("./models/Invoice");

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("Connected to DB");
    
    // Find all billed orders that do not have customerName
    const orders = await Order.find({ status: "Billed", customerName: null });
    console.log(`Found ${orders.length} billed orders missing customerName`);
    
    let updatedCount = 0;
    for (const order of orders) {
      const invoice = await Invoice.findOne({ orderId: order._id });
      if (invoice) {
        order.customerName = invoice.customerName;
        order.customerMobile = invoice.customerMobile;
        await order.save();
        console.log(`Updated Order ${order._id} with Customer ${invoice.customerName}`);
        updatedCount++;
      }
    }
    
    console.log(`Migration complete. Updated ${updatedCount} orders.`);
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
