/*
 * FILE: backend/middleware/auth.js
 * PURPOSE: JWT authentication middleware
 */

import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'College_hub';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Expecting "Bearer <token>"

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access denied. No token provided.'
    });
  }

  try {
    const decoded = jwt.verify(token, SECRET);
   
    // Ensure decoded contains user id
    if (!decoded?.id) {
      return res.status(403).json({
        success: false,
        error: 'Invalid token payload.'
      });
    }

    req.user = {
      id: decoded.id,
      role: decoded.role || 'user',
      collegeId: decoded.collegeId || null,
    };
    next();
  } catch (error) {
    console.error('JWT verification failed:', error.message);
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token.'
    });
  }
};

export default authenticateToken;
