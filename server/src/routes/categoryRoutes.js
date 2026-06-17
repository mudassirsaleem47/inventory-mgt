const express = require('express');
const router = express.Router();
const { getCategories, createCategory, updateCategory, deleteCategories } = require('../controllers/categoryController');

router.get('/', getCategories);
router.post('/', createCategory);
router.put('/:id', updateCategory);
router.delete('/', deleteCategories);

module.exports = router;
