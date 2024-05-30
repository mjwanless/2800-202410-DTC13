/* jshint esversion: 8 */

const express = require("express");
const User = require("./userSchema");
require("dotenv").config();
const getPrice = require("./getPrice");
const getRecipeInfoRouter = express.Router();

getRecipeInfoRouter.get("/recipe_Info/:id", async (req, res) => {
  const recipeId = req.params.id;
  req.session.recipeId = recipeId;
  let recipeDetails = {};

  try {
    // Fetch recipe details from the API by id
    const response = await fetch(
      `https://api.edamam.com/api/recipes/v2/${recipeId}?type=public&app_id=${process.env.EDAMAM_APP_ID}&app_key=${process.env.EDAMAM_APP_KEY}`
    );
    const data = await response.json();

    // Check if the data.recipe exists
    if (data.recipe) {
      recipeDetails = {
        recipeId: recipeId,
        recipeTitle: data.recipe.label,
        recipeImg: data.recipe.image,
        recipeIngredients: data.recipe.ingredientLines,
        recipeCuisineType: data.recipe.cuisineType,
        recipeNutrients: data.recipe.totalNutrients,
      };

      let count = 0;
      for (let nutrient in data.recipe.totalNutrients) {
        if (count < 4) {
          recipeDetails.recipeNutrients[nutrient] =
            data.recipe.totalNutrients[nutrient];
          count++;
        } else {
          break;
        }
      }

      const user = await User.findOne({ email: req.session.email });
      recipeDetails.recipePrice = getPrice(recipeId);
      const favoriteList = user.my_fav;
      let isFavorite = false;
      if (favoriteList.includes(recipeId)) {
        isFavorite = true;
      }
      res.render("recipeInfo", {
        recipeDetails: recipeDetails,
        isFavorite: isFavorite,
      });
    } else {
      // Handle the case where data.recipe is undefined
      res.status(404).render("404");
    }
  } catch (error) {
    console.error("Error fetching recipe details:", error);
    res.status(500).send("Internal server error");
  }
});

module.exports = getRecipeInfoRouter;
