const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const verifyAdmin = require('../middleware/auth');

router.get('/services', serviceController.getServices);
router.get('/admin/services', verifyAdmin, serviceController.getAllServicesAdmin);
router.post('/admin/services', verifyAdmin, serviceController.createService);

module.exports = router;
