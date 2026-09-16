const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const verifyAdmin = require('../middleware/auth');

// Public endpoints
router.post('/reviews', reviewController.submitReview);
router.get('/reviews', reviewController.getPublicReviews);

// Admin-only endpoints
router.get('/admin/reviews', verifyAdmin, reviewController.getAllReviewsAdmin);
router.put('/admin/reviews/:id', verifyAdmin, reviewController.updateReviewStatus);
router.delete('/admin/reviews/:id', verifyAdmin, reviewController.deleteReview);

module.exports = router;
