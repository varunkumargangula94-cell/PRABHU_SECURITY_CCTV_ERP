const express = require('express');
const router = express.Router();
const supportController = require('../controllers/supportController');
const verifyAdmin = require('../middleware/auth');

// Public route: Submit support query
router.post('/support-tickets', supportController.createSupportTicket);

// Admin routes: View & manage support tickets
router.get('/admin/support-tickets', verifyAdmin, supportController.getAllSupportTicketsAdmin);
router.put('/admin/support-tickets/:id/status', verifyAdmin, supportController.updateTicketStatus);
router.delete('/admin/support-tickets/:id', verifyAdmin, supportController.deleteTicket);

module.exports = router;
