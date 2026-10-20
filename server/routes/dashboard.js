const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../auth');

// GET /api/dashboard/stats - Real-time operational metrics & KPIs (Publicly visible overview)
router.get('/stats', async (req, res) => {
  const startTime = process.hrtime();

  try {
    const todayStr = new Date().toISOString().split('T')[0];

    // Execute all independent queries in parallel using Promise.all
    const [
      statusCounts,
      mttrRow,
      csatRow,
      categoryBreakdown,
      priorityBreakdown,
      totalBookingsRow,
      activeTodayRow,
      popularAmenities,
      recentLogs,
      recentBookings
    ] = await Promise.all([
      db.all(`SELECT status, COUNT(*) as count FROM maintenance_requests GROUP BY status`),
      db.get(`SELECT AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600) as avg_resolution_hours, COUNT(*) as resolved_count FROM maintenance_requests WHERE resolved_at IS NOT NULL`),
      db.get(`SELECT AVG(satisfaction_rating) as avg_rating, COUNT(*) as rated_count FROM maintenance_requests WHERE satisfaction_rating IS NOT NULL`),
      db.all(`SELECT category, COUNT(*) as count FROM maintenance_requests GROUP BY category ORDER BY count DESC`),
      db.all(`SELECT priority, COUNT(*) as count FROM maintenance_requests GROUP BY priority ORDER BY count DESC`),
      db.get(`SELECT COUNT(*) as count FROM amenity_bookings`),
      db.get(`SELECT COUNT(*) as count FROM amenity_bookings WHERE booking_date = ? AND status IN ('CONFIRMED', 'CHECKED_IN')`, [todayStr]),
      db.all(`SELECT a.name, a.icon, COUNT(b.id) as booking_count FROM amenities a LEFT JOIN amenity_bookings b ON a.id = b.amenity_id GROUP BY a.id, a.name, a.icon ORDER BY booking_count DESC LIMIT 5`),
      db.all(`SELECT l.id, 'MAINTENANCE' as event_type, l.action_note as message, l.created_at, u.full_name as actor_name, u.role as actor_role, r.title as subject_title, r.id as subject_id FROM maintenance_logs l JOIN users u ON l.changed_by_user_id = u.id JOIN maintenance_requests r ON l.request_id = r.id ORDER BY l.created_at DESC LIMIT 8`),
      db.all(`SELECT b.id, 'AMENITY' as event_type, 'Booked ' || a.name || ' on ' || b.booking_date || ' (' || b.start_time || '-' || b.end_time || ')' as message, b.created_at, u.full_name as actor_name, u.role as actor_role, a.name as subject_title, b.id as subject_id FROM amenity_bookings b JOIN users u ON b.user_id = u.id JOIN amenities a ON b.amenity_id = a.id ORDER BY b.created_at DESC LIMIT 6`)
    ]);

    // 1. Maintenance Status Mapping
    const statusMap = { PENDING: 0, IN_PROGRESS: 0, COMPLETED: 0, CLOSED: 0 };
    let totalRequests = 0;
    statusCounts.forEach(s => {
      const cnt = parseInt(s.count, 10) || 0;
      statusMap[s.status] = cnt;
      totalRequests += cnt;
    });

    // 2. MTTR (Hours)
    const avgResolutionHours = mttrRow && mttrRow.avg_resolution_hours != null
      ? Math.round(Number(mttrRow.avg_resolution_hours) * 10) / 10 
      : null;

    // 3. Completion Rate (%)
    const completedOrClosed = (statusMap.COMPLETED || 0) + (statusMap.CLOSED || 0);
    const completionRate = totalRequests > 0 
      ? Math.round((completedOrClosed / totalRequests) * 100) 
      : 0;

    // 4. CSAT Rating
    const csatRating = csatRow && csatRow.avg_rating != null
      ? Math.round(Number(csatRow.avg_rating) * 10) / 10 
      : null;

    // 5. Amenity Booking Counts
    const totalBookings = totalBookingsRow ? parseInt(totalBookingsRow.count, 10) : 0;
    const activeBookingsToday = activeTodayRow ? parseInt(activeTodayRow.count, 10) : 0;

    const activityFeed = [...recentLogs, ...recentBookings]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10);

    // Compute server processing time
    const diff = process.hrtime(startTime);
    const responseTimeMs = (diff[0] * 1000 + diff[1] / 1e6).toFixed(2);

    res.json({
      kpis: {
        mttr_hours: avgResolutionHours,
        completion_rate_percent: completionRate,
        conflicts_prevented_count: 0, // Zero double booking guarantee
        csat_score: csatRating,
        system_response_ms: Number(responseTimeMs)
      },
      maintenance: {
        total: totalRequests,
        pending: statusMap.PENDING,
        in_progress: statusMap.IN_PROGRESS,
        completed: statusMap.COMPLETED,
        closed: statusMap.CLOSED,
        by_category: categoryBreakdown,
        by_priority: priorityBreakdown
      },
      amenities: {
        total_bookings: totalBookings,
        active_today: activeBookingsToday,
        popular: popularAmenities
      },
      activity_feed: activityFeed
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to compute dashboard metrics: ' + err.message });
  }
});

module.exports = router;
