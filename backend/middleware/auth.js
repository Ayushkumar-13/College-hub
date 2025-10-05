/*
 * FILE: backend/middleware/auth.js
 * LOCATION: college-social-platform/backend/middleware/auth.js
 * PURPOSE: JWT authentication middleware
 */

const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Expecting "Bearer <token>"

  if (!token) {
    return res.status(401).json({ success: false, error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach decoded token (user id, role) to request
    next();
  } catch (error) {
    console.error('JWT verification failed:', error.message);
    return res.status(403).json({ success: false, error: 'Invalid or expired token.' });
  }
};

module.exports = authenticateToken;
