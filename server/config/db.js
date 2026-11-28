const mongoose = require('mongoose');

const connectDB = async () => {
  // If already connected or connecting, reuse the existing connection (critical for Vercel serverless speed)
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  try {
    const uri = process.env.MONGODB_URI;
    if (!uri || uri.includes('username:password')) {
      console.warn('[Warning] MongoDB URI not configured or contains placeholder in server/.env');
      return;
    }

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[Database Error] MongoDB Connection Error: ${error.message}`);
  }
};

module.exports = connectDB;
