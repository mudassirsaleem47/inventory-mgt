const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { getInvoices, getInvoice, createInvoice, updateInvoice, deleteInvoices } = require('../controllers/supplierInvoiceController');

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/supplier-invoices'));
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|pdf/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Only images (jpg, png) and PDF files are allowed'));
  }
});

router.get('/', getInvoices);
router.get('/:id', getInvoice);
router.post('/', upload.single('image'), createInvoice);
router.put('/:id', upload.single('image'), updateInvoice);
router.delete('/', deleteInvoices);

module.exports = router;
