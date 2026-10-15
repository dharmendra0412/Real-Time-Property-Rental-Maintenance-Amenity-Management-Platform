const jwt = require('jsonwebtoken');
const db = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'property_management_super_secret_jwt_key_2026';

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please login.' });
  }

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired session. Please login again.' });
    }

    try {
      const user = await db.get('SELECT id, full_name, email, role, phone FROM users WHERE id = ?', [decoded.id]);
      if (!user) {
        return res.status(401).json({ error: 'User account no longer exists.' });
      }

      req.user = user;
      next();
    } catch (e) {
      return res.status(500).json({ error: 'Authentication database verification failed.' });
    }
  });
}

function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Requires one of the following roles: [${allowedRoles.join(', ')}]`
      });
    }
    next();
  };
}

module.exports = {
  JWT_SECRET,
  generateToken,
  authenticateToken,
  authorizeRoles
};
