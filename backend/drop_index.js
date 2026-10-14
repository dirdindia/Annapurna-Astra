require("dotenv").config();
const mongoose = require("mongoose");

async function dropIndex() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");

    const db = mongoose.connection.db;
    const collections = await db.collections();
    
    for (let collection of collections) {
      if (collection.collectionName === "grccounters") {
        console.log("Found grccounters collection.");
        const indexes = await collection.indexes();
        console.log("Indexes:", indexes);

        try {
          await collection.dropIndex("name_1");
          console.log("Successfully dropped name_1 index.");
        } catch (err) {
          console.log("Could not drop name_1 index:", err.message);
        }
      }
    }

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

dropIndex();
