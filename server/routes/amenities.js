const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authenticateToken } = require('../auth');

// GET /api/amenities - List all amenities
router.get('/', authenticateToken, async (req, res) => {
  try {
    const propertyId = req.query.property_id;
    let query = 'SELECT * FROM amenities WHERE is_active = 1';
    let params = [];

    if (propertyId) {
      query += ' AND property_id = ?';
      params.push(propertyId);
    }

    query += ' ORDER BY name ASC';
    const amenities = await db.all(query, params);
    res.json(amenities);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch amenities: ' + err.message });
  }
});

// POST /api/amenities - Add real amenity
router.post('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'OWNER' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only property owners or administrators can register amenities.' });
    }

    const { property_id, name, description, icon, max_capacity, opening_time, closing_time, slot_duration_minutes, rules } = req.body;

    if (!property_id || !name || !opening_time || !closing_time) {
      return res.status(400).json({ error: 'Property, name, opening time, and closing time are required.' });
    }

    const amenityId = `amenity-${uuidv4().slice(0, 8)}`;
    await db.run(`
      INSERT INTO amenities (
        id, property_id, name, description, icon, max_capacity, opening_time, closing_time, slot_duration_minutes, rules, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `, [
      amenityId,
      property_id,
      name.trim(),
      description || null,
      icon || 'star',
      parseInt(max_capacity, 10) || 1,
      opening_time,
      closing_time,
      parseInt(slot_duration_minutes, 10) || 60,
      rules || null
    ]);

    const newAmenity = await db.get('SELECT * FROM amenities WHERE id = ?', [amenityId]);
    res.status(201).json(newAmenity);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create amenity: ' + err.message });
  }
});

// GET /api/amenities/:id/availability - Get slots & bookings for a specific date
router.get('/:id/availability', authenticateToken, async (req, res) => {
  try {
    const amenityId = req.params.id;
    const date = req.query.date || new Date().toISOString().split('T')[0];

    const amenity = await db.get('SELECT * FROM amenities WHERE id = ?', [amenityId]);
    if (!amenity) {
      return res.status(404).json({ error: 'Amenity not found.' });
    }

    // Get active reservations on that date
    const bookings = await db.all(`
      SELECT b.id, b.amenity_id, b.booking_date, b.start_time, b.end_time, 
             b.attendees_count, b.status, b.notes, b.user_id,
             u.full_name as user_name
      FROM amenity_bookings b
      JOIN users u ON b.user_id = u.id
      WHERE b.amenity_id = ? 
        AND b.booking_date = ? 
        AND b.status IN ('CONFIRMED', 'CHECKED_IN')
      ORDER BY b.start_time ASC
    `, [amenityId, date]);

    // Generate granular time slots based on slot_duration_minutes
    const slots = [];
    const [openHour, openMin] = amenity.opening_time.split(':').map(Number);
    const [closeHour, closeMin] = amenity.closing_time.split(':').map(Number);

    let currentMin = openHour * 60 + openMin;
    const endLimitMin = closeHour * 60 + closeMin;
    const duration = amenity.slot_duration_minutes || 60;

    while (currentMin + duration <= endLimitMin) {
      const sH = String(Math.floor(currentMin / 60)).padStart(2, '0');
      const sM = String(currentMin % 60).padStart(2, '0');
      const eH = String(Math.floor((currentMin + duration) / 60)).padStart(2, '0');
      const eM = String((currentMin + duration) % 60).padStart(2, '0');

      const slotStart = `${sH}:${sM}`;
      const slotEnd = `${eH}:${eM}`;

      // Overlap condition: (slotStart < b.end_time) AND (slotEnd > b.start_time)
      const overlappingBookings = bookings.filter(b => slotStart < b.end_time && slotEnd > b.start_time);
      const totalBookedAttendees = overlappingBookings.reduce((sum, b) => sum + (b.attendees_count || 1), 0);

      const exclusiveAmenities = ['amenity-tennis', 'amenity-clubhouse', 'amenity-conference', 'amenity-bbq'];
      const isExclusive = amenity.max_capacity <= 1 || exclusiveAmenities.includes(amenity.id);

      const isAvailable = isExclusive 
        ? overlappingBookings.length === 0 
        : totalBookedAttendees < amenity.max_capacity;

      slots.push({
        start_time: slotStart,
        end_time: slotEnd,
        is_available: isAvailable,
        capacity_remaining: isExclusive ? (overlappingBookings.length === 0 ? 1 : 0) : Math.max(0, amenity.max_capacity - totalBookedAttendees),
        max_capacity: isExclusive ? 1 : amenity.max_capacity,
        bookings: overlappingBookings.map(b => ({
          id: b.id,
          user_id: b.user_id,
          user_name: b.user_id === req.user.id || req.user.role !== 'TENANT' ? b.user_name : 'Reserved',
          is_mine: b.user_id === req.user.id,
          status: b.status
        }))
      });

      currentMin += duration;
    }

    res.json({
      amenity,
      date,
      slots,
      active_bookings_count: bookings.length
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch availability: ' + err.message });
  }
});

// POST /api/amenities/book - Atomic conflict-checked slot reservation
router.post('/book', authenticateToken, async (req, res) => {
  try {
    const { amenity_id, booking_date, start_time, end_time, attendees_count, notes } = req.body;

    if (!amenity_id || !booking_date || !start_time || !end_time) {
      return res.status(400).json({ error: 'Amenity, date, start time, and end time are required.' });
    }

    if (start_time >= end_time) {
      return res.status(400).json({ error: 'Start time must be before end time.' });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (booking_date < todayStr) {
      return res.status(400).json({ error: 'Cannot book amenity slots in the past.' });
    }

    const amenity = await db.get('SELECT * FROM amenities WHERE id = ? AND is_active = 1', [amenity_id]);
    if (!amenity) {
      return res.status(404).json({ error: 'Amenity not found or inactive.' });
    }

    if (start_time < amenity.opening_time || end_time > amenity.closing_time) {
      return res.status(400).json({
        error: `Booking must be within operating hours (${amenity.opening_time} - ${amenity.closing_time}).`
      });
    }

    const requestedAttendees = Number(attendees_count) || 1;

    // ATOMIC DATABASE TRANSACTION FOR CONFLICT PREVENTION
    const newBooking = await db.transaction(async (txDb) => {
      // Check overlapping bookings: (requestedStart < existingEnd) AND (requestedEnd > existingStart)
      const conflicts = await txDb.all(`
        SELECT b.*, u.full_name as user_name
        FROM amenity_bookings b
        JOIN users u ON b.user_id = u.id
        WHERE b.amenity_id = ?
          AND b.booking_date = ?
          AND b.status IN ('CONFIRMED', 'CHECKED_IN')
          AND b.start_time < ?
          AND b.end_time > ?
      `, [amenity_id, booking_date, end_time, start_time]);

      const exclusiveAmenities = ['amenity-tennis', 'amenity-clubhouse', 'amenity-conference', 'amenity-bbq'];
      const isExclusive = amenity.max_capacity <= 1 || exclusiveAmenities.includes(amenity.id);

      if (isExclusive && conflicts.length > 0) {
        const conflictSlot = `${conflicts[0].start_time} - ${conflicts[0].end_time}`;
        const err = new Error(`Double-booking conflict prevented! This amenity is already reserved from ${conflictSlot} on ${booking_date}.`);
        err.statusCode = 409;
        throw err;
      }

      const currentBookedCount = conflicts.reduce((sum, b) => sum + (b.attendees_count || 1), 0);
      if (!isExclusive && currentBookedCount + requestedAttendees > amenity.max_capacity) {
        const err = new Error(`Capacity exceeded! Only ${Math.max(0, amenity.max_capacity - currentBookedCount)} spot(s) remaining for this time window.`);
        err.statusCode = 409;
        throw err;
      }

      // Insert verified booking
      const bookingId = `bk-${Date.now().toString(36)}-${uuidv4().slice(0, 4)}`;
      await txDb.run(`
        INSERT INTO amenity_bookings (
          id, amenity_id, user_id, booking_date, start_time, end_time, attendees_count, status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'CONFIRMED', ?)
      `, [bookingId, amenity_id, req.user.id, booking_date, start_time, end_time, requestedAttendees, notes || null]);

      return await txDb.get(`
        SELECT b.*, a.name as amenity_name, a.icon as amenity_icon, u.full_name as user_name
        FROM amenity_bookings b
        JOIN amenities a ON b.amenity_id = a.id
        JOIN users u ON b.user_id = u.id
        WHERE b.id = ?
      `, [bookingId]);
    });

    // Broadcast real-time booking update via WebSockets
    const io = req.app.get('io');
    if (io) {
      io.emit('amenity:booked', newBooking);
    }

    res.status(201).json(newBooking);
  } catch (err) {
    return res.status(err.statusCode || 409).json({ error: err.message });
  }
});

// GET /api/amenities/my-bookings - List user's bookings (or all if manager)
router.get('/my-bookings', authenticateToken, async (req, res) => {
  try {
    let query = `
      SELECT b.*, a.name as amenity_name, a.icon as amenity_icon, a.rules as amenity_rules,
             u.full_name as user_name, u.email as user_email
      FROM amenity_bookings b
      JOIN amenities a ON b.amenity_id = a.id
      JOIN users u ON b.user_id = u.id
    `;
    const params = [];

    if (req.user.role === 'TENANT') {
      query += ' WHERE b.user_id = ?';
      params.push(req.user.id);
    }

    query += ' ORDER BY b.booking_date DESC, b.start_time DESC';
    const bookings = await db.all(query, params);
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bookings: ' + err.message });
  }
});

// PATCH /api/amenities/bookings/:id/check-in - Check in to amenity
router.patch('/bookings/:id/check-in', authenticateToken, async (req, res) => {
  try {
    const booking = await db.get('SELECT * FROM amenity_bookings WHERE id = ?', [req.params.id]);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    if (req.user.role === 'TENANT' && booking.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized.' });
    }

    if (booking.status !== 'CONFIRMED') {
      return res.status(400).json({ error: `Cannot check in from status: ${booking.status}` });
    }

    await db.run(`UPDATE amenity_bookings SET status = 'CHECKED_IN' WHERE id = ?`, [booking.id]);
    const updated = await db.get(`
      SELECT b.*, a.name as amenity_name, u.full_name as user_name
      FROM amenity_bookings b
      JOIN amenities a ON b.amenity_id = a.id
      JOIN users u ON b.user_id = u.id
      WHERE b.id = ?
    `, [booking.id]);

    const io = req.app.get('io');
    if (io) {
      io.emit('amenity:checked_in', updated);
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to check in: ' + err.message });
  }
});

// PATCH /api/amenities/bookings/:id/check-out - Complete session / Check out
router.patch('/bookings/:id/check-out', authenticateToken, async (req, res) => {
  try {
    const booking = await db.get('SELECT * FROM amenity_bookings WHERE id = ?', [req.params.id]);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    if (req.user.role === 'TENANT' && booking.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized.' });
    }

    await db.run(`UPDATE amenity_bookings SET status = 'COMPLETED' WHERE id = ?`, [booking.id]);
    const updated = await db.get(`
      SELECT b.*, a.name as amenity_name, u.full_name as user_name
      FROM amenity_bookings b
      JOIN amenities a ON b.amenity_id = a.id
      JOIN users u ON b.user_id = u.id
      WHERE b.id = ?
    `, [booking.id]);

    const io = req.app.get('io');
    if (io) {
      io.emit('amenity:checked_out', updated);
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to check out: ' + err.message });
  }
});

// PATCH /api/amenities/bookings/:id/cancel - Cancel booking & immediately free slot
router.patch('/bookings/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const booking = await db.get('SELECT * FROM amenity_bookings WHERE id = ?', [req.params.id]);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    if (req.user.role === 'TENANT' && booking.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to cancel this reservation.' });
    }

    await db.run(`UPDATE amenity_bookings SET status = 'CANCELLED' WHERE id = ?`, [booking.id]);

    const updated = await db.get(`
      SELECT b.*, a.name as amenity_name, u.full_name as user_name
      FROM amenity_bookings b
      JOIN amenities a ON b.amenity_id = a.id
      JOIN users u ON b.user_id = u.id
      WHERE b.id = ?
    `, [booking.id]);

    const io = req.app.get('io');
    if (io) {
      io.emit('amenity:cancelled', updated);
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel booking: ' + err.message });
  }
});

module.exports = router;
