const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authenticateToken } = require('../auth');

// Public route to view properties (for tenant registration unit picker)
router.get('/public-list', async (req, res) => {
  try {
    const properties = await db.all(`
      SELECT p.id, p.name, p.address, p.city, p.state
      FROM properties p
      ORDER BY p.name ASC
    `);

    const propertiesWithUnits = await Promise.all(properties.map(async (p) => {
      const units = await db.all(`
        SELECT id, unit_number, floor, status
        FROM units
        WHERE property_id = ?
        ORDER BY unit_number ASC
      `, [p.id]);
      return { ...p, units };
    }));

    res.json(propertiesWithUnits);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/properties - List properties for authenticated user
router.get('/', authenticateToken, async (req, res) => {
  let query = `
    SELECT p.*,
           (SELECT COUNT(*) FROM units u WHERE u.property_id = p.id) as total_units,
           (SELECT COUNT(*) FROM units u WHERE u.property_id = p.id AND u.status = 'OCCUPIED') as occupied_units,
           (SELECT COUNT(*) FROM amenities a WHERE a.property_id = p.id) as amenities_count
    FROM properties p
  `;
  const params = [];

  if (req.user.role === 'OWNER') {
    query += ' WHERE p.owner_id = ?';
    params.push(req.user.id);
  }

  try {
    const properties = await db.all(query, params);
    res.json(properties);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/properties - Create a real property
router.post('/', authenticateToken, async (req, res) => {
  if (req.user.role !== 'OWNER' && req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Only property owners or administrators can register properties.' });
  }

  const { name, address, city, state, zip_code } = req.body;

  if (!name || !address || !city || !state || !zip_code) {
    return res.status(400).json({ error: 'Property name, address, city, state, and zip code are required.' });
  }

  const propId = `prop-${uuidv4().slice(0, 8)}`;
  try {
    await db.run(`
      INSERT INTO properties (id, owner_id, name, address, city, state, zip_code)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [propId, req.user.id, name.trim(), address.trim(), city.trim(), state.trim(), zip_code.trim()]);

    const newProperty = await db.get('SELECT * FROM properties WHERE id = ?', [propId]);
    res.status(201).json(newProperty);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/properties/:id - Get property details with units and amenities
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const property = await db.get('SELECT * FROM properties WHERE id = ?', [req.params.id]);
    if (!property) {
      return res.status(404).json({ error: 'Property not found.' });
    }

    const units = await db.all(`
      SELECT u.*, 
             l.id as lease_id, l.start_date, l.end_date, l.rent_amount,
             usr.full_name as tenant_name, usr.email as tenant_email
      FROM units u
      LEFT JOIN leases l ON u.id = l.unit_id AND l.status = 'ACTIVE'
      LEFT JOIN users usr ON l.tenant_id = usr.id
      WHERE u.property_id = ?
      ORDER BY u.unit_number ASC
    `, [req.params.id]);

    const amenities = await db.all('SELECT * FROM amenities WHERE property_id = ? AND is_active = 1', [req.params.id]);

    res.json({
      property,
      units,
      amenities
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/properties/:id/units - Add a real unit to a property
router.post('/:id/units', authenticateToken, async (req, res) => {
  if (req.user.role !== 'OWNER' && req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Only owners or administrators can add units.' });
  }

  const propertyId = req.params.id;
  const { unit_number, floor } = req.body;

  if (!unit_number || floor === undefined) {
    return res.status(400).json({ error: 'Unit number and floor are required.' });
  }

  const unitId = `unit-${uuidv4().slice(0, 8)}`;
  try {
    await db.run(`
      INSERT INTO units (id, property_id, unit_number, floor, status)
      VALUES (?, ?, ?, ?, 'VACANT')
    `, [unitId, propertyId, String(unit_number).trim(), parseInt(floor, 10)]);

    const newUnit = await db.get('SELECT * FROM units WHERE id = ?', [unitId]);
    res.status(201).json(newUnit);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/properties/units/:unitId/lease - Assign a registered tenant to a unit
router.post('/units/:unitId/lease', authenticateToken, async (req, res) => {
  if (req.user.role !== 'OWNER' && req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Only property owners or administrators can execute leases.' });
  }

  const unitId = req.params.unitId;
  const { tenant_id, rent_amount, start_date, end_date } = req.body;

  if (!tenant_id || !rent_amount) {
    return res.status(400).json({ error: 'Tenant and rent amount are required.' });
  }

  const leaseId = `lease-${uuidv4().slice(0, 8)}`;
  const sDate = start_date || new Date().toISOString().split('T')[0];
  const eDate = end_date || new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0];

  try {
    await db.run(`
      INSERT INTO leases (id, unit_id, tenant_id, start_date, end_date, rent_amount, status)
      VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')
    `, [leaseId, unitId, tenant_id, sDate, eDate, parseFloat(rent_amount)]);

    await db.run(`UPDATE units SET status = 'OCCUPIED' WHERE id = ?`, [unitId]);

    res.status(201).json({ message: 'Lease executed successfully', leaseId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
