const express = require('express');
const router = express.Router();
const { getDashboardStats, getNotifications } = require('../controllers/dashboardController');

router.get('/stats', getDashboardStats);
router.get('/notifications', getNotifications);

module.exports = router;
