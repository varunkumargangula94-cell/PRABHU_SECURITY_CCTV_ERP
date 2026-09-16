const express = require('express');
const router = express.Router();
const comboOfferController = require('../controllers/comboOfferController');
const verifyAdmin = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public endpoints
router.get('/combo-offers', comboOfferController.getPublicComboOffers);

// Admin-only endpoints
router.get('/admin/combo-offers', verifyAdmin, comboOfferController.getAllComboOffersAdmin);
router.post('/admin/combo-offers', verifyAdmin, upload.single('image'), comboOfferController.createComboOffer);
router.put('/admin/combo-offers/:id', verifyAdmin, upload.single('image'), comboOfferController.updateComboOffer);
router.delete('/admin/combo-offers/:id', verifyAdmin, comboOfferController.deleteComboOffer);

module.exports = router;
