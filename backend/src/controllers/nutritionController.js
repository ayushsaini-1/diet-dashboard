const NutritionLog = require('../models/NutritionLog');
const Meal = require('../models/Meal');
const User = require('../models/User');

// @desc    Create or update nutrition log for a date
// @route   POST /api/nutrition/log
// @access  Private
exports.logNutrition = async (req, res) => {
  try {
    const { date, waterIntake, exercise, weight, mood, notes } = req.body;

    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);

    // Get all meals for the date
    const meals = await Meal.find({
      user: req.user.id,
      date: { $gte: startDate, $lt: endDate },
    });

    const mealIds = meals.map((m) => m._id);

    // Calculate total nutrition
    let totalNutrition = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
      cholesterol: 0,
    };

    for (let meal of meals) {
      totalNutrition.calories += meal.totalNutrition.calories || 0;
      totalNutrition.protein += meal.totalNutrition.protein || 0;
      totalNutrition.carbs += meal.totalNutrition.carbs || 0;
      totalNutrition.fat += meal.totalNutrition.fat || 0;
      totalNutrition.fiber += meal.totalNutrition.fiber || 0;
      totalNutrition.sugar += meal.totalNutrition.sugar || 0;
    }

    // Calculate calories burned from exercise
    let caloriesBurned = 0;
    if (exercise && exercise.length > 0) {
      caloriesBurned = exercise.reduce((total, ex) => total + (ex.caloriesBurned || 0), 0);
    }

    // Find or create nutrition log
    let nutritionLog = await NutritionLog.findOne({
      user: req.user.id,
      date: { $gte: startDate, $lt: endDate },
    });

    if (nutritionLog) {
      // Update existing
      nutritionLog.meals = mealIds;
      nutritionLog.totalNutrition = totalNutrition;
      nutritionLog.waterIntake = waterIntake || nutritionLog.waterIntake;
      nutritionLog.exercise = exercise || nutritionLog.exercise;
      nutritionLog.weight = weight || nutritionLog.weight;
      nutritionLog.mood = mood || nutritionLog.mood;
      nutritionLog.notes = notes || nutritionLog.notes;
    } else {
      // Create new
      nutritionLog = new NutritionLog({
        user: req.user.id,
        date: new Date(date),
        meals: mealIds,
        totalNutrition,
        waterIntake: waterIntake || 0,
        exercise: exercise || [],
        weight,
        mood,
        notes,
      });
    }

    await nutritionLog.save();

    res.status(200).json({
      success: true,
      nutritionLog,
      caloriesBurned,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get nutrition log for a specific date
// @route   GET /api/nutrition/log/:date
// @access  Private
exports.getNutritionLog = async (req, res) => {
  try {
    const { date } = req.params;
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);

    const nutritionLog = await NutritionLog.findOne({
      user: req.user.id,
      date: { $gte: startDate, $lt: endDate },
    }).populate({
      path: 'meals',
      populate: { path: 'items.food' },
    });

    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      nutritionLog,
      dailyGoal: user.dailyCalorieGoal,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get nutrition summary for a date range
// @route   GET /api/nutrition/summary/:startDate/:endDate
// @access  Private
exports.getNutritionSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.params;

    const logs = await NutritionLog.find({
      user: req.user.id,
      date: { $gte: new Date(startDate), $lte: new Date(endDate) },
    }).sort({ date: 1 });

    const summary = {
      totalDays: logs.length,
      averageCalories: 0,
      averageProtein: 0,
      averageCarbs: 0,
      averageFat: 0,
      averageWater: 0,
      totalCaloriesBurned: 0,
      weightProgress: [],
      moodDistribution: {},
    };

    if (logs.length > 0) {
      let totalCalories = 0,
        totalProtein = 0,
        totalCarbs = 0,
        totalFat = 0,
        totalWater = 0,
        totalCaloriesBurned = 0;

      for (let log of logs) {
        totalCalories += log.totalNutrition.calories || 0;
        totalProtein += log.totalNutrition.protein || 0;
        totalCarbs += log.totalNutrition.carbs || 0;
        totalFat += log.totalNutrition.fat || 0;
        totalWater += log.waterIntake || 0;

        if (log.exercise && log.exercise.length > 0) {
          const dayCaloriesBurned = log.exercise.reduce((total, ex) => total + (ex.caloriesBurned || 0), 0);
          totalCaloriesBurned += dayCaloriesBurned;
        }

        if (log.weight) {
          summary.weightProgress.push({
            date: log.date,
            weight: log.weight,
          });
        }

        if (log.mood) {
          summary.moodDistribution[log.mood] = (summary.moodDistribution[log.mood] || 0) + 1;
        }
      }

      summary.averageCalories = Math.round(totalCalories / logs.length);
      summary.averageProtein = Math.round(totalProtein / logs.length);
      summary.averageCarbs = Math.round(totalCarbs / logs.length);
      summary.averageFat = Math.round(totalFat / logs.length);
      summary.averageWater = Math.round(totalWater / logs.length);
      summary.totalCaloriesBurned = totalCaloriesBurned;
    }

    res.status(200).json({
      success: true,
      summary,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get weekly nutrition report
// @route   GET /api/nutrition/weekly/:date
// @access  Private
exports.getWeeklyReport = async (req, res) => {
  try {
    const { date } = req.params;
    const startDate = new Date(date);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);

    const logs = await NutritionLog.find({
      user: req.user.id,
      date: { $gte: startDate, $lt: endDate },
    })
      .populate({
        path: 'meals',
        populate: { path: 'items.food' },
      })
      .sort({ date: 1 });

    const user = await User.findById(req.user.id);

    const weeklyData = [];
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(startDate);
      dayDate.setDate(dayDate.getDate() + i);
      const dayLog = logs.find(
        (log) =>
          log.date.toDateString() === dayDate.toDateString()
      );

      weeklyData.push({
        date: dayDate.toISOString().split('T')[0],
        calories: dayLog?.totalNutrition.calories || 0,
        protein: dayLog?.totalNutrition.protein || 0,
        carbs: dayLog?.totalNutrition.carbs || 0,
        fat: dayLog?.totalNutrition.fat || 0,
        goal: user.dailyCalorieGoal,
      });
    }

    res.status(200).json({
      success: true,
      weeklyData,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
