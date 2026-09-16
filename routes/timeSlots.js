const express = require('express');
const router = express.Router();
const timeSlotController = require('../controllers/timeSlotController');
const verifyAdmin = require('../middleware/auth');

// Public route: fetch available time slots
router.get('/time-slots', timeSlotController.getAvailableSlots);

// Admin-only routes
router.get('/admin/time-slots', verifyAdmin, timeSlotController.getAllSlotsAdmin);
router.post('/admin/time-slots', verifyAdmin, timeSlotController.createSlot);
router.put('/admin/time-slots/:id', verifyAdmin, timeSlotController.toggleSlotStatus);

module.exports = router;
