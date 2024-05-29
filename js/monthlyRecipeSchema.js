/* jshint esversion: 8 */

const mongoose = require("mongoose");

const monthlyRecipesSchema = new mongoose.Schema({
  recipeTitle: String,
  recipeImg: String,
  recipeId: String
});
const monthlyRecipe = mongoose.model("monthlyRecipes", monthlyRecipesSchema);
module.exports = monthlyRecipe;