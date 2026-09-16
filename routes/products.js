const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const verifyAdmin = require('../middleware/auth');

router.get('/products', productController.getProducts);
router.get('/admin/products', verifyAdmin, productController.getAllProductsAdmin);
router.post('/admin/products', verifyAdmin, productController.createProduct);
router.put('/admin/products/:id', verifyAdmin, productController.updateProduct);
router.delete('/admin/products/:id', verifyAdmin, productController.deleteProduct);

module.exports = router;
