const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authenticateToken } = require('../auth');

// Setup file upload storage
const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `ticket-${Date.now()}-${uuidv4().slice(0, 6)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are permitted.'));
    }
  }
});

// GET /api/maintenance - List tickets
router.get('/', authenticateToken, async (req, res) => {
  const { status, category, priority, unit_id } = req.query;
  const user = req.user;

  let query = `
    SELECT r.*,
           p.name as property_name,
           u.unit_number, u.floor,
           t.full_name as tenant_name, t.email as tenant_email, t.phone as tenant_phone,
           s.full_name as staff_name, s.email as staff_email
    FROM maintenance_requests r
    JOIN properties p ON r.property_id = p.id
    JOIN units u ON r.unit_id = u.id
    JOIN users t ON r.tenant_id = t.id
    LEFT JOIN users s ON r.assigned_staff_id = s.id
    WHERE 1=1
  `;
  const params = [];

  // Role filtering
  if (user.role === 'TENANT') {
    query += ' AND r.tenant_id = ?';
    params.push(user.id);
  } else if (user.role === 'STAFF') {
    query += " AND (r.assigned_staff_id = ? OR (r.assigned_staff_id IS NULL AND r.status = 'PENDING'))";
    params.push(user.id);
  }

  // Parameter filtering
  if (status && status !== 'ALL') {
    query += ' AND r.status = ?';
    params.push(status);
  }
  if (category && category !== 'ALL') {
    query += ' AND r.category = ?';
    params.push(category);
  }
  if (priority && priority !== 'ALL') {
    query += ' AND r.priority = ?';
    params.push(priority);
  }
  if (unit_id) {
    query += ' AND r.unit_id = ?';
    params.push(unit_id);
  }

  query += " ORDER BY CASE r.priority WHEN 'EMERGENCY' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'MEDIUM' THEN 3 ELSE 4 END ASC, r.created_at DESC";

  try {
    const requests = await db.all(query, params);
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/maintenance/:id - Ticket detail + audit logs
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const request = await db.get(`
      SELECT r.*,
             p.name as property_name, p.address as property_address,
             u.unit_number, u.floor,
             t.full_name as tenant_name, t.email as tenant_email, t.phone as tenant_phone,
             s.full_name as staff_name, s.email as staff_email
      FROM maintenance_requests r
      JOIN properties p ON r.property_id = p.id
      JOIN units u ON r.unit_id = u.id
      JOIN users t ON r.tenant_id = t.id
      LEFT JOIN users s ON r.assigned_staff_id = s.id
      WHERE r.id = ?
    `, [req.params.id]);

    if (!request) {
      return res.status(404).json({ error: 'Maintenance ticket not found.' });
    }

    if (req.user.role === 'TENANT' && request.tenant_id !== req.user.id) {
      return res.status(403).json({ error: 'You are not authorized to view this ticket.' });
    }

    const logs = await db.all(`
      SELECT l.*, u.full_name as user_name, u.role as user_role
      FROM maintenance_logs l
      JOIN users u ON l.changed_by_user_id = u.id
      WHERE l.request_id = ?
      ORDER BY l.created_at ASC
    `, [req.params.id]);

    res.json({ request, logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/maintenance - Create new ticket
router.post('/', authenticateToken, upload.single('photo'), async (req, res) => {
  const { title, description, category, priority, unit_id, property_id } = req.body;

  if (!title || !description || !category) {
    return res.status(400).json({ error: 'Title, description, and category are required.' });
  }

  let finalUnitId = unit_id;
  let finalPropertyId = property_id;

  try {
    if (req.user.role === 'TENANT' && (!finalUnitId || !finalPropertyId)) {
      const lease = await db.get(`
        SELECT l.unit_id, u.property_id
        FROM leases l
        JOIN units u ON l.unit_id = u.id
        WHERE l.tenant_id = ? AND l.status = 'ACTIVE'
        LIMIT 1
      `, [req.user.id]);

      if (!lease) {
        return res.status(400).json({ error: 'No active lease found for this tenant.' });
      }
      finalUnitId = lease.unit_id;
      finalPropertyId = lease.property_id;
    }

    const ticketId = `req-${Date.now().toString(36)}-${uuidv4().slice(0, 4)}`;
    const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const ticketPriority = priority || 'MEDIUM';

    await db.run(`
      INSERT INTO maintenance_requests (
        id, property_id, unit_id, tenant_id, category, priority, title, description, photo_url, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
    `, [
      ticketId,
      finalPropertyId,
      finalUnitId,
      req.user.id,
      category,
      ticketPriority,
      title.trim(),
      description.trim(),
      photoUrl
    ]);

    await db.run(`
      INSERT INTO maintenance_logs (id, request_id, changed_by_user_id, old_status, new_status, action_note)
      VALUES (?, ?, ?, NULL, 'PENDING', ?)
    `, [`log-${uuidv4().slice(0, 8)}`, ticketId, req.user.id, 'Ticket created by tenant']);

    const createdTicket = await db.get(`
      SELECT r.*,
             p.name as property_name,
             u.unit_number, u.floor,
             t.full_name as tenant_name, t.email as tenant_email
      FROM maintenance_requests r
      JOIN properties p ON r.property_id = p.id
      JOIN units u ON r.unit_id = u.id
      JOIN users t ON r.tenant_id = t.id
      WHERE r.id = ?
    `, [ticketId]);

    const io = req.app.get('io');
    if (io) {
      io.emit('maintenance:created', createdTicket);
    }

    res.status(201).json(createdTicket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/maintenance/:id/status - Update ticket status & assignment
router.patch('/:id/status', authenticateToken, async (req, res) => {
  const ticketId = req.params.id;
  const { status, assigned_staff_id, resolution_notes, scheduled_date, action_note } = req.body;

  try {
    const current = await db.get('SELECT * FROM maintenance_requests WHERE id = ?', [ticketId]);
    if (!current) {
      return res.status(404).json({ error: 'Maintenance ticket not found.' });
    }

    const validStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CLOSED'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const nextStatus = status || current.status;
    const nextAssigned = assigned_staff_id !== undefined ? assigned_staff_id : current.assigned_staff_id;
    const nextResolutionNotes = resolution_notes !== undefined ? resolution_notes : current.resolution_notes;
    const nextScheduled = scheduled_date !== undefined ? scheduled_date : current.scheduled_date;

    let resolvedAt = current.resolved_at;
    if (nextStatus === 'COMPLETED' && !current.resolved_at) {
      resolvedAt = new Date().toISOString();
    }

    await db.run(`
      UPDATE maintenance_requests
      SET status = ?,
          assigned_staff_id = ?,
          resolution_notes = ?,
          scheduled_date = ?,
          resolved_at = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [nextStatus, nextAssigned, nextResolutionNotes, nextScheduled, resolvedAt, ticketId]);

    const logNote = action_note || `Status transitioned from ${current.status} to ${nextStatus}`;
    await db.run(`
      INSERT INTO maintenance_logs (id, request_id, changed_by_user_id, old_status, new_status, action_note)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [`log-${uuidv4().slice(0, 8)}`, ticketId, req.user.id, current.status, nextStatus, logNote]);

    const updatedTicket = await db.get(`
      SELECT r.*,
             p.name as property_name,
             u.unit_number, u.floor,
             t.full_name as tenant_name, t.email as tenant_email,
             s.full_name as staff_name, s.email as staff_email
      FROM maintenance_requests r
      JOIN properties p ON r.property_id = p.id
      JOIN units u ON r.unit_id = u.id
      JOIN users t ON r.tenant_id = t.id
      LEFT JOIN users s ON r.assigned_staff_id = s.id
      WHERE r.id = ?
    `, [ticketId]);

    const io = req.app.get('io');
    if (io) {
      io.emit('maintenance:updated', updatedTicket);
    }

    res.json(updatedTicket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/maintenance/:id/rate - Tenant feedback rating
router.post('/:id/rate', authenticateToken, async (req, res) => {
  const ticketId = req.params.id;
  const { rating, feedback } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be an integer between 1 and 5.' });
  }

  try {
    const ticket = await db.get('SELECT * FROM maintenance_requests WHERE id = ?', [ticketId]);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found.' });
    }

    if (req.user.role === 'TENANT' && ticket.tenant_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only rate your own tickets.' });
    }

    await db.run(`
      UPDATE maintenance_requests
      SET satisfaction_rating = ?,
          satisfaction_feedback = ?,
          status = 'CLOSED',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [Math.round(rating), feedback || null, ticketId]);

    await db.run(`
      INSERT INTO maintenance_logs (id, request_id, changed_by_user_id, old_status, new_status, action_note)
      VALUES (?, ?, ?, ?, 'CLOSED', ?)
    `, [`log-${uuidv4().slice(0, 8)}`, ticketId, req.user.id, ticket.status, `Tenant rated ${rating} Stars: ${feedback || 'No comments'}`]);

    const updated = await db.get('SELECT * FROM maintenance_requests WHERE id = ?', [ticketId]);

    const io = req.app.get('io');
    if (io) {
      io.emit('maintenance:rated', updated);
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
