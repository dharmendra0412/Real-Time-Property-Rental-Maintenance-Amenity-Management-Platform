const { app } = require('../server/index');

module.exports = (req, res) => {
  const hasDb = !!process.env.DATABASE_URL;
  return res.status(200).json({
    status: hasDb ? 'ONLINE' : 'CONFIG_ERROR',
    database: hasDb ? 'PostgreSQL (Connected)' : 'DATABASE_URL Missing in Environment',
    service: 'Real-Time Property Rental, Maintenance & Amenity Management Platform',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
};
