const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');

router.post('/', ratingController.rateSwap);
router.get('/user/:id', ratingController.getUserRatings);

module.exports = router; 