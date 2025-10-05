// FILE: backend/utils/jwt.js
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-this'; // fallback secret

function signToken(payload, expiresIn = '30d') {
  return jwt.sign(payload, SECRET, { expiresIn });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch (err) {
    // Do NOT throw, just return null for invalid token
    console.warn('⚠️ JWT verification failed:', err.message);
    return null;
  }
}

module.exports = { signToken, verifyToken };
