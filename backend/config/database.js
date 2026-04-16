/*
 * FILE: backend/config/database.js
 * PURPOSE: Robust MongoDB connection with silent auto-retry
 */
const mongoose = require('mongoose');

const MONGO_OPTIONS = {
  serverSelectionTimeoutMS: 45000,
  connectTimeoutMS: 45000,
  socketTimeoutMS: 45000,
  heartbeatFrequencyMS: 10000,
  family: 4, 
  maxPoolSize: 10,
};

let isConnected = false;

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  isConnected = false;
});

let reconnectTimeout;
mongoose.connection.on('reconnected', () => {
  isConnected = true;
  clearTimeout(reconnectTimeout);
  reconnectTimeout = setTimeout(() => {
    console.log('✅ MongoDB reconnected successfully');
  }, 1000);
});

const connectDB = async (retries = 5) => {
  if (isConnected) return;

  const connString = process.env.MONGODB_URI;
  if (!connString) {
    throw new Error("MONGODB_URI is not defined in .env");
  }

  for (let i = 0; i < retries; i++) {
    try {
      const conn = await mongoose.connect(connString.trim(), MONGO_OPTIONS);
      isConnected = true;
      console.log(`------------- MongoDB Connected -----------`);
      return;
    } catch (error) {
      if (i === retries - 1) {
        console.error('❌ MongoDB connection failed after multiple attempts.');
        throw error;
      }
      // Silent retry
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};

module.exports = connectDB;
