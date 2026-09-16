const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { initDatabase } = require('./config/database');

// Import Routers
const bookingRoutes = require('./routes/bookings');
const timeSlotRoutes = require('./routes/timeSlots');
const productRoutes = require('./routes/products');
const serviceRoutes = require('./routes/services');
const reviewRoutes = require('./routes/reviews');
const workPhotoRoutes = require('./routes/workPhotos');
const comboOfferRoutes = require('./routes/comboOffers');
const adminRoutes = require('./routes/admin');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

const PORT = process.env.PORT || 5000;

// Initialize Database & Seed Data
initDatabase();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Attach Socket.io instance to App for Controller Access
app.set('io', io);

// Static Asset Directories
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure Uploads Directory Exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// API Routes
app.use('/api', bookingRoutes);
app.use('/api', timeSlotRoutes);
app.use('/api', productRoutes);
app.use('/api', serviceRoutes);
app.use('/api', reviewRoutes);
app.use('/api', workPhotoRoutes);
app.use('/api', comboOfferRoutes);
app.use('/api', adminRoutes);

// Socket.io Real-Time Event Handlers
io.on('connection', (socket) => {
  console.log(`🔌 Client connected to Socket.io: ${socket.id}`);

  socket.on('join_admin', () => {
    socket.join('admin_room');
    console.log(`👑 Admin socket ${socket.id} joined admin_room`);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// Serve Public Pages & Fallback
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Express Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Start Server
server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 CCTV ERP & Sales Server is running on port ${PORT}`);
  console.log(`🌐 Public Website: http://localhost:${PORT}`);
  console.log(`🔐 Admin Login:    http://localhost:${PORT}/admin-login.html`);
  console.log(`====================================================`);
});
