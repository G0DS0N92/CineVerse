const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  // Allow CORS preflight requests to pass through without checking for a token
  if (req.method === 'OPTIONS') {
    return next();
  }

  let token;

  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (authHeader && authHeader.startsWith('Bearer')) {
    try {
      // Extract token from 'Bearer <token>'
      token = authHeader.split(' ')[1];

      // Verify token signature with JWT_SECRET
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'cineverse_super_secret_jwt_key_2026'
      );

      // Fetch user without password field and attach to request
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User belonging to this token no longer exists.',
        });
      }

      return next();
    } catch (error) {
      console.error('JWT verification error:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token. Please log in again.',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Authorization token missing.',
    });
  }
};

module.exports = { protect };
