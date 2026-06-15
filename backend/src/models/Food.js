const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide food name'],
      trim: true,
    },
    servingSize: {
      type: Number,
      required: true, // in grams
    },
    unit: {
      type: String,
      enum: ['g', 'ml', 'cup', 'oz', 'tbsp', 'tsp', 'piece'],
      default: 'g',
    },
    nutrition: {
      calories: {
        type: Number,
        required: true,
      },
      protein: Number, // in grams
      carbs: Number, // in grams
      fat: Number, // in grams
      fiber: Number, // in grams
      sugar: Number, // in grams
      sodium: Number, // in mg
      cholesterol: Number, // in mg
      calcium: Number, // in mg
      iron: Number, // in mg
      potassium: Number, // in mg
      vitaminA: Number, // in IU
      vitaminC: Number, // in mg
      vitaminD: Number, // in IU
    },
    foodGroup: {
      type: String,
      enum: ['fruits', 'vegetables', 'grains', 'protein', 'dairy', 'oils', 'other'],
    },
    barcode: String,
    source: {
      type: String,
      enum: ['usda', 'custom', 'user'],
      default: 'usda',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Food', foodSchema);
