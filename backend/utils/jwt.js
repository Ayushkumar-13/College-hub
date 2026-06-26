// FILE: backend/utils/jwt.js
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'College_hub'; // fallback secret

function signToken(payload, expiresIn = '90d') {
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

export { signToken, verifyToken };
