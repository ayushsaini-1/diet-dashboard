const User = require('../models/User');

// @desc    Update user profile
// @route   PUT /api/users/:id
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, age, gender, weight, height, activityLevel, dietaryGoal, allergies, preferences } = req.body;

    let user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this user' });
    }

    // Update fields
    if (name) user.name = name;
    if (age) user.age = age;
    if (gender) user.gender = gender;
    if (weight) user.weight = weight;
    if (height) user.height = height;
    if (activityLevel) user.activityLevel = activityLevel;
    if (dietaryGoal) user.dietaryGoal = dietaryGoal;
    if (allergies) user.allergies = allergies;
    if (preferences) user.preferences = preferences;

    // Calculate daily calorie goal
    if (weight && height && age && gender && activityLevel) {
      user.dailyCalorieGoal = calculateCalories(weight, height, age, gender, activityLevel, dietaryGoal);
    }

    await user.save();

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/users/:id
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Calculate daily calorie requirements using Harris-Benedict equation
const calculateCalories = (weight, height, age, gender, activityLevel, dietaryGoal) => {
  let bmr;

  if (gender === 'male') {
    bmr = 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age;
  } else {
    bmr = 447.593 + 9.247 * weight + 3.098 * height - 4.33 * age;
  }

  const activityMultipliers = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
    extremely_active: 1.9,
  };

  let tdee = bmr * (activityMultipliers[activityLevel] || 1.55);

  // Adjust based on dietary goal
  if (dietaryGoal === 'lose_weight') {
    tdee -= 500; // 500 calorie deficit
  } else if (dietaryGoal === 'gain_weight') {
    tdee += 500; // 500 calorie surplus
  }

  return Math.round(tdee);
};
