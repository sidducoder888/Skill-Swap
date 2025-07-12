const express = require('express');
const router = express.Router();
const skillController = require('../controllers/skillController');

router.get('/', skillController.getSkills);
router.post('/', skillController.addSkill); // Admin only
router.get('/categories', skillController.getCategories);

module.exports = router; 