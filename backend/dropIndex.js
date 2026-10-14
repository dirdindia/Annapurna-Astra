require('dotenv').config();
const mongoose = require('mongoose');

async function dropIndex() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    const db = mongoose.connection.db;
    
    // Drop room index
    try {
      const roomCollection = db.collection('rooms');
      await roomCollection.dropIndex('roomNumber_1');
      console.log('Successfully dropped the roomNumber_1 index');
    } catch (e) {
      console.log('Index roomNumber_1 not found or error:', e.message);
    }

    // Drop table index
    try {
      const tableCollection = db.collection('tables');
      await tableCollection.dropIndex('tableNo_1');
      console.log('Successfully dropped the tableNo_1 index');
    } catch (e) {
      console.log('Index tableNo_1 not found or error:', e.message);
    }
    
    process.exit(0);
  } catch (error) {
    if (error.codeName === 'IndexNotFound') {
      console.log('Index roomNumber_1 not found, it might have already been dropped');
      process.exit(0);
    } else {
      console.error('Error dropping index:', error);
      process.exit(1);
    }
  }
}

dropIndex();
