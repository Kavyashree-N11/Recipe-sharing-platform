const mongoose = require('mongoose');
const RecipeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  ingredients: { type: String, required: true },
  instructions: { type: String, required: true },
  category: { type: String, required: true }, // e.g., Breakfast, Lunch
  time: { type: Number, required: true }, // in minutes
  imageUrl: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
module.exports = mongoose.model('Recipe', RecipeSchema);