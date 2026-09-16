const express = require('express');
const router = express.Router();
const workPhotoController = require('../controllers/workPhotoController');
const verifyAdmin = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public route: fetch visible installation photos
router.get('/work-photos', workPhotoController.getPublicPhotos);

// Admin-only routes
router.get('/admin/work-photos', verifyAdmin, workPhotoController.getAllPhotosAdmin);
router.post('/admin/work-photos', verifyAdmin, upload.single('image'), workPhotoController.uploadWorkPhoto);
router.put('/admin/work-photos/:id', verifyAdmin, workPhotoController.updateWorkPhoto);
router.delete('/admin/work-photos/:id', verifyAdmin, workPhotoController.deleteWorkPhoto);

module.exports = router;
