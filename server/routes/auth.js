const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { generateToken, authenticateToken } = require('../auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const user = await db.get('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email.trim()]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        phone: user.phone
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { full_name, email, password, role, phone, unit_id } = req.body;

  if (!full_name || !email || !password || !role) {
    return res.status(400).json({ error: 'Full name, email, password, and role are required.' });
  }

  const validRoles = ['TENANT', 'OWNER', 'STAFF', 'ADMIN'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
  }

  try {
    const existing = await db.get('SELECT id FROM users WHERE LOWER(email) = LOWER(?)', [email.trim()]);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const userId = `usr-${uuidv4().slice(0, 8)}`;
    const passwordHash = bcrypt.hashSync(password, 10);

    await db.run(`
      INSERT INTO users (id, full_name, email, password_hash, role, phone)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [userId, full_name.trim(), email.trim().toLowerCase(), passwordHash, role, phone || null]);

    // If registering as a tenant and a unit is assigned, bind lease
    if (role === 'TENANT' && unit_id) {
      const leaseId = `lease-${uuidv4().slice(0, 8)}`;
      const today = new Date().toISOString().split('T')[0];
      const nextYear = new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0];

      await db.run(`
        INSERT INTO leases (id, unit_id, tenant_id, start_date, end_date, rent_amount, status)
        VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')
      `, [leaseId, unit_id, userId, today, nextYear, 2200.00]);

      await db.run(`UPDATE units SET status = 'OCCUPIED' WHERE id = ?`, [unit_id]);
    }

    const newUser = await db.get('SELECT id, full_name, email, role, phone FROM users WHERE id = ?', [userId]);
    const token = generateToken(newUser);

    res.status(201).json({
      token,
      user: newUser
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  let context = {};

  try {
    if (req.user.role === 'TENANT') {
      const lease = await db.get(`
        SELECT l.*, u.unit_number, u.floor, p.name as property_name, p.address as property_address, p.id as property_id
        FROM leases l
        JOIN units u ON l.unit_id = u.id
        JOIN properties p ON u.property_id = p.id
        WHERE l.tenant_id = ? AND l.status = 'ACTIVE'
        LIMIT 1
      `, [req.user.id]);
      context.lease = lease || null;
    } else if (req.user.role === 'OWNER') {
      const properties = await db.all('SELECT * FROM properties WHERE owner_id = ?', [req.user.id]);
      context.properties = properties;
    }

    res.json({
      user: req.user,
      context
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/users
router.get('/users', authenticateToken, async (req, res) => {
  const role = req.query.role;
  let query = 'SELECT id, full_name, email, role, phone FROM users';
  let params = [];

  if (role) {
    query += ' WHERE role = ?';
    params.push(role);
  }

  try {
    const users = await db.all(query, params);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
