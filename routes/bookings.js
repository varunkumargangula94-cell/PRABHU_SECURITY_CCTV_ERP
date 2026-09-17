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

// Soft Delete & Bin Management Routes
router.put('/admin/bookings/:id/delete', verifyAdmin, bookingController.softDeleteBooking);
router.delete('/admin/bookings/:id', verifyAdmin, bookingController.softDeleteBooking);
router.put('/admin/bookings/:id/restore', verifyAdmin, bookingController.restoreBooking);
router.delete('/admin/bookings/:id/permanent', verifyAdmin, bookingController.permanentDeleteBooking);
router.get('/admin/bin', verifyAdmin, bookingController.getBinItems);
router.delete('/admin/bin/empty', verifyAdmin, bookingController.emptyBin);

module.exports = router;
