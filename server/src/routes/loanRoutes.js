const express = require('express');
const router = express.Router();
const {
  getLoans,
  createLoan,
  updateLoan,
  deleteLoans
} = require('../controllers/loanController');

router.get('/', getLoans);
router.post('/', createLoan);
router.put('/:id', updateLoan);
router.delete('/', deleteLoans);

module.exports = router;
