const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
async function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access denied. Please login.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mysecretkey123');
    req.user = decoded;

    // Optionally check if user still exists
    const user = await User.findById(decoded.userId).select('-password');
    if (user) {
      req.userDetails = user;
    }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token. Please login again.' });
  }
}

// Middleware to verify Admin access
async function verifyAdmin(req, res, next) {
  await verifyToken(req, res, async () => {
    try {
      const user = req.userDetails || (await User.findById(req.user.userId));
      if (!user || !user.isAdmin) {
        return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
      }
      req.isAdmin = true;
      next();
    } catch (err) {
      return res.status(500).json({ message: 'Authorization error.' });
    }
  });
}

module.exports = {
  verifyToken,
  verifyAdmin,
};
