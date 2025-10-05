/*
 * FILE: backend/config/cloudinary.js
 * LOCATION: college-social-platform/backend/config/cloudinary.js
 * PURPOSE: Cloudinary configuration for media uploads
 */

const cloudinary = require('cloudinary').v2;

const cloudinaryConfig = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });

  console.log('---- Cloudinary configured successfully-----');
};

module.exports = cloudinaryConfig;