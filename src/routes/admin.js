const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.get('/users', adminController.listUsers);
router.put('/users/:id/ban', adminController.banUser);
router.get('/analytics', adminController.getAnalytics);
router.post('/announcements', adminController.sendAnnouncement);

module.exports = router; 