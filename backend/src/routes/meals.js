const express = require('express');
const { createMeal, getMealsByDate, updateMeal, deleteMeal } = require('../controllers/mealController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, createMeal);
router.get('/:date', protect, getMealsByDate);
router.put('/:id', protect, updateMeal);
router.delete('/:id', protect, deleteMeal);

module.exports = router;
