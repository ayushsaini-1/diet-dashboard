const mongoose = require('mongoose');

const nutritionLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    meals: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Meal',
      },
    ],
    totalNutrition: {
      calories: {
        type: Number,
        default: 0,
      },
      protein: Number,
      carbs: Number,
      fat: Number,
      fiber: Number,
      sugar: Number,
      sodium: Number,
      cholesterol: Number,
    },
    waterIntake: {
      type: Number, // in ml
      default: 0,
    },
    exercise: [
      {
        name: String,
        duration: Number, // in minutes
        caloriesBurned: Number,
      },
    ],
    weight: Number, // in kg
    mood: {
      type: String,
      enum: ['great', 'good', 'okay', 'bad'],
    },
    notes: String,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('NutritionLog', nutritionLogSchema);
