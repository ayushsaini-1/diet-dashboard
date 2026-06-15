const Meal = require('../models/Meal');
const NutritionLog = require('../models/NutritionLog');
const Food = require('../models/Food');

// @desc    Create a meal
// @route   POST /api/meals
// @access  Private
exports.createMeal = async (req, res) => {
  try {
    const { mealType, date, items, notes } = req.body;

    // Calculate total nutrition
    let totalNutrition = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
    };

    // Process items and calculate nutrition
    for (let item of items) {
      const food = await Food.findById(item.food);
      if (!food) {
        return res.status(404).json({ success: false, message: `Food item ${item.food} not found` });
      }

      const quantity = item.quantity || 1;
      const multiplier = quantity / food.servingSize;

      item.nutrition = {
        calories: Math.round(food.nutrition.calories * multiplier),
        protein: food.nutrition.protein ? Math.round(food.nutrition.protein * multiplier) : 0,
        carbs: food.nutrition.carbs ? Math.round(food.nutrition.carbs * multiplier) : 0,
        fat: food.nutrition.fat ? Math.round(food.nutrition.fat * multiplier) : 0,
        fiber: food.nutrition.fiber ? Math.round(food.nutrition.fiber * multiplier) : 0,
        sugar: food.nutrition.sugar ? Math.round(food.nutrition.sugar * multiplier) : 0,
      };

      // Add to total
      totalNutrition.calories += item.nutrition.calories;
      totalNutrition.protein += item.nutrition.protein || 0;
      totalNutrition.carbs += item.nutrition.carbs || 0;
      totalNutrition.fat += item.nutrition.fat || 0;
      totalNutrition.fiber += item.nutrition.fiber || 0;
      totalNutrition.sugar += item.nutrition.sugar || 0;
    }

    const meal = await Meal.create({
      user: req.user.id,
      mealType,
      date,
      items,
      totalNutrition,
      notes,
    });

    await meal.populate('items.food');

    res.status(201).json({
      success: true,
      meal,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get meals for a specific date
// @route   GET /api/meals/:date
// @access  Private
exports.getMealsByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);

    const meals = await Meal.find({
      user: req.user.id,
      date: { $gte: startDate, $lt: endDate },
    }).populate('items.food');

    res.status(200).json({
      success: true,
      meals,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a meal
// @route   PUT /api/meals/:id
// @access  Private
exports.updateMeal = async (req, res) => {
  try {
    let meal = await Meal.findById(req.params.id);

    if (!meal) {
      return res.status(404).json({ success: false, message: 'Meal not found' });
    }

    if (meal.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this meal' });
    }

    const { mealType, items, notes } = req.body;

    if (mealType) meal.mealType = mealType;
    if (notes !== undefined) meal.notes = notes;

    if (items) {
      let totalNutrition = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
      };

      for (let item of items) {
        const food = await Food.findById(item.food);
        if (!food) {
          return res.status(404).json({ success: false, message: `Food item ${item.food} not found` });
        }

        const quantity = item.quantity || 1;
        const multiplier = quantity / food.servingSize;

        item.nutrition = {
          calories: Math.round(food.nutrition.calories * multiplier),
          protein: food.nutrition.protein ? Math.round(food.nutrition.protein * multiplier) : 0,
          carbs: food.nutrition.carbs ? Math.round(food.nutrition.carbs * multiplier) : 0,
          fat: food.nutrition.fat ? Math.round(food.nutrition.fat * multiplier) : 0,
          fiber: food.nutrition.fiber ? Math.round(food.nutrition.fiber * multiplier) : 0,
          sugar: food.nutrition.sugar ? Math.round(food.nutrition.sugar * multiplier) : 0,
        };

        totalNutrition.calories += item.nutrition.calories;
        totalNutrition.protein += item.nutrition.protein || 0;
        totalNutrition.carbs += item.nutrition.carbs || 0;
        totalNutrition.fat += item.nutrition.fat || 0;
        totalNutrition.fiber += item.nutrition.fiber || 0;
        totalNutrition.sugar += item.nutrition.sugar || 0;
      }

      meal.items = items;
      meal.totalNutrition = totalNutrition;
    }

    await meal.save();
    await meal.populate('items.food');

    res.status(200).json({
      success: true,
      meal,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a meal
// @route   DELETE /api/meals/:id
// @access  Private
exports.deleteMeal = async (req, res) => {
  try {
    const meal = await Meal.findById(req.params.id);

    if (!meal) {
      return res.status(404).json({ success: false, message: 'Meal not found' });
    }

    if (meal.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this meal' });
    }

    await Meal.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Meal deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
