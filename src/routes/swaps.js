const express = require('express');
const router = express.Router();
const swapController = require('../controllers/swapController');

router.post('/request', swapController.requestSwap);
router.put('/:id/accept', swapController.acceptSwap);
router.put('/:id/reject', swapController.rejectSwap);
router.delete('/:id', swapController.deleteSwap);
router.get('/my-requests', swapController.getMyRequests);

module.exports = router; 