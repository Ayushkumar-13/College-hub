/*
 * FILE: backend/config/database.js
 * LOCATION: college-social-platform/backend/config/database.js
 * PURPOSE: MongoDB connection configuration
 */

const mongoose = require('mongoose');

const MONGO_OPTIONS = {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  heartbeatFrequencyMS: 10000,
  maxPoolSize: 10,
};

const connectDB = async () => {
  const tryConnect = async () => {
    try {
      await mongoose.connect(process.env.MONGODB_URI, MONGO_OPTIONS);

      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err.message);
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️ MongoDB disconnected. Retrying in 5s...');
        setTimeout(tryConnect, 5000);
      });

      mongoose.connection.on('reconnected', () => {
        console.log('✅ MongoDB reconnected successfully');
      });

      console.log('------------- MongoDB Connected -----------');
    } catch (error) {
      console.error(`⚠️ MongoDB connection failed: ${error.message}`);
      console.warn('🔄 Retrying in 5 seconds...');
      setTimeout(tryConnect, 5000);
    }
  };

  await tryConnect();
};

module.exports = connectDB;
