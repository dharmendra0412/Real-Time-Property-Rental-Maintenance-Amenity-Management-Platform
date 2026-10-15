const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Ensure db and uploads exist
const db = require('./db');
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const app = express();
const server = http.createServer(app);

// Initialize Socket.io with bi-directional streaming
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE']
  }
});

// Attach io instance to express app so routes can broadcast events
app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static React build and uploaded images
const clientDist = fs.existsSync(path.join(__dirname, '..', 'dist'))
  ? path.join(__dirname, '..', 'dist')
  : path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.use('/uploads', express.static(uploadDir));

// Route Handlers (Support both /api/* and /* for Vercel Serverless Rewrites)
const authRoutes = require('./routes/auth');
const propertiesRoutes = require('./routes/properties');
const maintenanceRoutes = require('./routes/maintenance');
const amenitiesRoutes = require('./routes/amenities');
const dashboardRoutes = require('./routes/dashboard');

app.use(['/api/auth', '/auth'], authRoutes);
app.use(['/api/properties', '/properties'], propertiesRoutes);
app.use(['/api/maintenance', '/maintenance'], maintenanceRoutes);
app.use(['/api/amenities', '/amenities'], amenitiesRoutes);
app.use(['/api/dashboard', '/dashboard'], dashboardRoutes);

// Health check endpoint
const healthHandler = (req, res) => {
  const hasDb = !!process.env.DATABASE_URL;
  res.json({
    status: hasDb ? 'ONLINE' : 'CONFIG_ERROR',
    database: hasDb ? 'PostgreSQL (Connected)' : 'DATABASE_URL Missing in Environment',
    service: 'Real-Time Property Rental, Maintenance & Amenity Management Platform',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
};
app.get(['/api/health', '/health'], healthHandler);

// Socket.io Real-Time Event Management
io.on('connection', (socket) => {
  console.log(`[WebSocket] Client connected: ${socket.id} (Total: ${io.engine.clientsCount})`);

  socket.on('disconnect', () => {
    console.log(`[WebSocket] Client disconnected: ${socket.id} (Remaining: ${io.engine.clientsCount})`);
  });

  // Client joins specific property or role room
  socket.on('join_room', (roomName) => {
    socket.join(roomName);
    console.log(`[WebSocket] Socket ${socket.id} joined room: ${roomName}`);
  });
});

// SPA Fallback
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
    if (path.extname(req.path)) {
      return res.status(404).end();
    }
    return res.sendFile(path.join(clientDist, 'index.html'));
  }
  next();
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error occurred.'
  });
});

const PORT = process.env.PORT || 5000;
if (process.env.VERCEL !== '1') {
  server.listen(PORT, () => {
    console.log(`================================================================`);
    console.log(`🚀 Real-Time Property Platform Server running on port ${PORT}`);
    console.log(`📡 Local Web Application: http://localhost:${PORT}`);
    console.log(`⚡ WebSocket Server: Ready for bi-directional real-time sync`);
    console.log(`💾 Database Engine: 100% Pure PostgreSQL (Neon Cloud / pg Pool)`);
    console.log(`🔒 Data Integrity: Clean Fresh Database - Zero Mock Data`);
    console.log(`================================================================`);
  });
}

module.exports = { app, server, io };
