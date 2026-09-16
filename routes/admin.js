const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const verifyAdmin = require('../middleware/auth');

router.post('/admin/login', adminController.loginAdmin);
router.get('/admin/dashboard', verifyAdmin, adminController.getDashboardStats);

module.exports = router;
