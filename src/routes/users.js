const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/me', userController.getProfile);
router.put('/me', userController.updateProfile);
router.get('/search', userController.searchUsers);
router.get('/:id', userController.getUserById);

module.exports = router; 