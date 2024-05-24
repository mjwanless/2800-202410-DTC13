const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const app = express();

const mongodb_host = process.env.MONGODB_HOST;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;

const appId = process.env.EDAMAM_APP_ID;
const appKey = process.env.EDAMAM_APP_KEY;

const atlasURI = `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/FreshPlate`;
const connectToDB = async () => {
  try {
    await mongoose.connect(atlasURI, {
      autoIndex: true,
      writeConcern: {
        w: "majority",
        j: true,
        wtimeout: 1000,
      },
    });
    console.log("Connected to Mongodb Atlas");
  } catch (error) {
    console.error(error);
  }
};
connectToDB();

const monthlyRecipesSchema = new mongoose.Schema({
  recipeTitle: String,
  recipeImg: String,
  recipeId: String,
});

const monthlyRecipe = mongoose.model("monthlyRecipes", monthlyRecipesSchema);

// const url = `https://api.edamam.com/api/recipes/v2?type=public&q=chinese&app_id=process.env.EDAMAM_APP_ID&app_key=process.env.EDAMAM_APP_KEY`;
// fetch(url)
//   .then((response) => response.json())
//   .then((data) => {
//     const recipes = data.hits;
//     recipes.forEach(async (recipe) => {
//       let recipeTitle = recipe.recipe.label;
//       let recipeImg = recipe.recipe.image;
//       let recipeId = recipe.recipe.uri.split("#recipe_")[1];
//       let newrecipe = new monthlyRecipe({
//         recipeTitle: recipeTitle,
//         recipeImg: recipeImg,
//         recipeId: recipeId,
//       });
//       try {
//         await newrecipe.save();
//         console.log("Recipe saved to database");
//       } catch (error) {
//         console.error(error);
//       }
//     });
//   });

module.exports = monthlyRecipe;
