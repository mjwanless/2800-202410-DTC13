const express = require("express");
const request = require("request");
const cors = require("cors");
require("dotenv").config();

const calculateRouter = express.Router();

calculateRouter.post("/calculate", async (req, res) => {
  let burnedCalories = 0;

  const { query } = req.body;
  let options = {
    method: "POST",
    url: "https://trackapi.nutritionix.com/v2/natural/exercise",
    headers: {
      "Content-Type": "application/json",
      "x-app-id": process.env.NUTRITIONIX_APP_ID,
      "x-app-key": process.env.NUTRITIONIX_APP_KEY,
    },
    body: JSON.stringify({
      query: query,
    }),
  };
  request(options, async function (error, response) {
    if (error) throw new Error(error);
    const result = JSON.parse(response.body);
    result.exercises.forEach((element) => {
      burnedCalories += element.nf_calories;
    });
    console.log("Calories burned:", burnedCalories);
    res.json({ result: burnedCalories });
  });
});

module.exports = calculateRouter;
