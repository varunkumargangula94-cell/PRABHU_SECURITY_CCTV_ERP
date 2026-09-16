const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const verifyAdmin = require('../middleware/auth');

// Public route: customer submit booking
router.post('/bookings', bookingController.createBooking);

// Admin-only routes
router.get('/admin/bookings', verifyAdmin, bookingController.getAllBookings);
router.get('/admin/bookings/:id', verifyAdmin, bookingController.getBookingById);
router.put('/admin/bookings/:id/status', verifyAdmin, bookingController.updateBookingStatus);

module.exports = router;
