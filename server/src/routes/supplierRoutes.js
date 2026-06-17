const express = require('express');
const router = express.Router();
const { getSuppliers, createSupplier, deleteSuppliers, updateSupplier } = require('../controllers/supplierController');

router.get('/', getSuppliers);
router.post('/', createSupplier);
router.delete('/', deleteSuppliers);
router.put('/:id', updateSupplier);

module.exports = router;
