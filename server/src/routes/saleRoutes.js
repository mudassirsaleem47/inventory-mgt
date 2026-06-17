const express = require('express');
const router = express.Router();
const { getSales, createSale, deleteSales } = require('../controllers/saleController');

router.get('/', getSales);
router.post('/', createSale);
router.delete('/', deleteSales);

module.exports = router;
