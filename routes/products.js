const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const verifyAdmin = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/products', productController.getProducts);
router.get('/admin/products', verifyAdmin, productController.getAllProductsAdmin);
router.post('/admin/products', verifyAdmin, upload.single('image'), productController.createProduct);
router.put('/admin/products/:id', verifyAdmin, upload.single('image'), productController.updateProduct);
router.delete('/admin/products/:id', verifyAdmin, productController.deleteProduct);

module.exports = router;
