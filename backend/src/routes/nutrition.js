const express = require('express');
const { logNutrition, getNutritionLog, getNutritionSummary, getWeeklyReport } = require('../controllers/nutritionController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/log', protect, logNutrition);
router.get('/log/:date', protect, getNutritionLog);
router.get('/summary/:startDate/:endDate', protect, getNutritionSummary);
router.get('/weekly/:date', protect, getWeeklyReport);

module.exports = router;
