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

    console.log(`------------- MongoDB Connected -----------`);
  } catch (error) {
    console.error(`-------- MongoDB Connection Error: ${error.message} ---------`);
    process.exit(1);
  }
};

module.exports = connectDB;
