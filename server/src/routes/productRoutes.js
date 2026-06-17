const express = require('express');
const router = express.Router();
const { getProducts, getProductByBarcode, createProduct, updateProduct, deleteProducts } = require('../controllers/productController');

router.get('/', getProducts);
router.get('/barcode/:barcode', getProductByBarcode);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/', deleteProducts);

module.exports = router;
