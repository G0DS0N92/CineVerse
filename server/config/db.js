const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri || uri.includes('username:password')) {
      console.warn('⚠️  MongoDB URI not configured or contains placeholder in server/.env');
      console.warn('ℹ️  Add your MongoDB Atlas connection string in server/.env to enable database operations.');
      return;
    }

    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // Do not terminate process in development so other endpoints can still be inspected
  }
};

module.exports = connectDB;
