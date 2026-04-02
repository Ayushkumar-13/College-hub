/*
 * FILE: backend/config/database.js
 * LOCATION: college-social-platform/backend/config/database.js
 * PURPOSE: MongoDB connection configuration
 */

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Removed deprecated options
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB persistent connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected. Mongoose will try to reconnect...');
    });

    console.log(`------------- MongoDB Connected -----------`);
  } catch (error) {
    console.error(`-------- MongoDB Connection Error: ${error.message} ---------`);
    process.exit(1);
  }
};

module.exports = connectDB;
