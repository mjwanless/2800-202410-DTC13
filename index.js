/* jshint esversion: 8 */

// Import statements for the required modules.
const express = require("express");
require("dotenv").config();
const session = require("express-session");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
var MongoDBStore = require("connect-mongodb-session")(session);
const cors = require("cors");

// Import modules.
const monthlyRecipe = require("./js/monthlyRecipeSchema");
const feedbacks = require("./js/createFeedback");
const userModel = require("./js/userSchema");
const orders = require("./js/orderSchema");
const calculator = require("./js/caloriesCalculator");
const sendConfirmationEmail = require("./js/sendOrderConfirmationEmail");
const sendResetPasswordEmail = require("./js/sendResetPasswordEmail");
const getRecipeInfo = require("./js/getRecipeInfo");

const sessionExpireTime = 1 * 60 * 60 * 1000; // 1 hour expiration time for session
const saltRounds = 10;
const joi = require("joi");

// Create a new express app and set up the port for .env variables
const app = express();
exports.app = app;
app.use(cors());
const port = process.env.PORT || 3000;
app.set("view engine", "ejs");

// This is to be able to allow us to parse the req.body/URL-encoded bodies
app.use(express.urlencoded({ extended: false }));

// Mongo variables from the .env file
const mongodb_host = process.env.MONGODB_HOST;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;

// Connect to the Atlas database.
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

// Define Mongoose model for preferences
const preferenceSchema = new mongoose.Schema({
  name: String,
  category: String,
});
const Preference = mongoose.model("Preference", preferenceSchema);

// MongoDB session setup to maintain security and user data and create sessions with cookies
var store = new MongoDBStore({
  uri: atlasURI,
  collection: "sessions",
  autoRemove: "native",
});

app.use(
  session({
    secret: mongodb_session_secret,
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

// This is to be able to use html, css, and js files in the public folder
app.use(express.static(__dirname + "/public"));
app.use(express.json());

// Middleware to check if the user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session.authenticated) {
    next();
  } else {
    return res.redirect("/login");
  }
};

// Middleware to create a user
const createUser = async (req, res, next) => {
  const schema = joi.object({
    username: joi.string().alphanum().max(30).required(),
    email: joi.string().max(200).required().email(),
    password: joi.string().max(50).required(),
    security_question: joi.string().max(50).required(),
    security_answer: joi.string().max(50).required(),
  });

  const { error } = schema.validate(req.body);
  console.log(error);

  if (!req.body.security_question) {
    return res.render("signup", {
      noSecurityQuestion: true,
      email: req.body.email.trim(),
      username: req.body.username.trim(),
    });
  }

  if (error) {
    if (error.details[0].message == '"email" must be a valid email') {
      return res.render("signup", {
        invalidEmail: true,
        username: req.body.username.trim(),
        email: req.body.email.trim(),
      });
    }

    if (
      error.details[0].message ==
      '"username" must only contain alpha-numeric characters'
    ) {
      return res.render("signup", {
        invalidUsername: true,
        email: req.body.email.trim(),
        username: req.body.username.trim(),
      });
    }

    return res.render("signup", {
      error: true,
      email: req.body.email.trim(),
      username: req.body.username.trim(),
    });
  }

  // Check if there isn't already an account with this email
  const existingUser = await userModel.findOne({
    email: req.body.email.trim(),
  });
  if (existingUser) {
    return res.render("signup", {
      repeatEmail: true,
      username: req.body.username.trim(),
    });
  }

  var hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
  var hashedSecurityAnswer = await bcrypt.hash(
    req.body.security_answer.trim(),
    saltRounds
  );

  const user = new userModel({
    username: req.body.username.trim(),
    email: req.body.email.trim(),
    password: hashedPassword,
    security_question: req.body.security_question,
    security_answer: hashedSecurityAnswer.trim(),
    cart: new Map(),
  });

  try {
    await user.save();
  } catch (err) {
    console.log("Failed to create user:", err);
    res.status(500).send("Internal server error");
  }

  req.session.authenticated = true;
  req.session.username = req.body.username.trim();
  req.session.cookie.maxAge = sessionExpireTime;
  next();
};

// Middleware to validate a user account
const loginValidation = async (req, res, next) => {
  const schema = joi.object({
    email: joi.string().max(200).required(),
  });
  req.session.email = req.body.email.trim();
  const validationResult = schema.validate({ email: req.session.email });
  if (validationResult.error) {
    res.render("login", { invalidEmail: true, email: req.body.email.trim() });
  }
  try {
    const user = await userModel.findOne({ email: req.body.email.trim() });
    if (user) {
      const outputPassword = user.password;
      const inputPassword = req.body.password;

      if (await bcrypt.compare(inputPassword, outputPassword)) {
        req.session.authenticated = true;
        req.session.username = user.username;
        req.session.cookie.maxAge = sessionExpireTime;
        next();
      } else {
        return res.render("login", {
          wrongPassword: true,
          email: req.body.email.trim(),
        });
      }
    } else {
      return res.render("login", {
        noUser: true,
        email: req.body.email.trim(),
      });
    }
  } catch (err) {
    console.log("fail to login", err);
  }
};

// GET request for the root URL/"Homepage"
app.get("/", async (req, res) => {
  let reviews = await feedbacks.find({}).sort({ time: -1 }).limit(3);
  if (reviews) {
    res.render("landing", { reviews: reviews });
  } else {
    res.render("landing", { reviews: [] });
  }
});

// GET request for the login page
app.get("/login", (req, res) => {
  res.render("login");
});

// GET request for the my_cart page
app.get("/mycart", async (req, res) => {
  try {
    const user = await userModel.findOne({ email: req.session.email });
    if (!user) {
      return res.status(404).send("User not found");
    }

    /*
     * Get the price list from the cart and
     * the priceList is an array of objects with recipeId, recipePrice, and quantity.
     */
    let priceList = [];
    user.cart.forEach((value, key) => {
      priceList.push({
        recipeId: key,
        recipePrice: value.recipePrice,
        quantity: value.quantity,
      });
    });

    const recipeIds = Array.from(user.cart.keys());

    // Using map to create an array of promises
    const recipeDetailsPromises = recipeIds.map(async (recipeId) => {
      try {
        const response = await fetch(
          `https://api.edamam.com/api/recipes/v2/${recipeId}?type=public&app_id=${process.env.EDAMAM_APP_ID}&app_key=${process.env.EDAMAM_APP_KEY}`
        );
        const data = await response.json();

        return data.recipe;
      } catch (error) {
        console.error(`Error fetching recipe ${recipeId}:`, error);
        return null;
      }
    });

    const recipeDetails = await Promise.all(recipeDetailsPromises);
    const filteredRecipes = recipeDetails.filter((recipe) => recipe !== null);

    res.render("my_cart", {
      recipeDetails: filteredRecipes,
      priceList: priceList,
    });
  } catch (err) {
    console.error("Failed to retrieve cart items:", err);
    res.status(500).send("Internal server error");
  }
});

// GET request for the signup page
app.get("/signup", (req, res) => {
  res.render("signup");
});

// GET request for the reset password page
app.get("/reset_password", (req, res) => {
  res.render("reset_password");
});

// After successful signup
app.post("/signup", createUser, (req, res) => {
  req.session.username = req.body.username.trim();
  req.session.email = req.body.email.trim();
  res.redirect("/my_preference");
});

app.post("/signup", async (req, res) => {
  const { username, email, password, security_question, security_answer } =
    req.body;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const newUser = new userModel({
    username,
    email,
    password: hashedPassword,
    security_question,
    security_answer,
  });

  try {
    await newUser.save();
    req.session.username = username.trim();
    req.session.email = email.trim();
    res.redirect("/my_preference");
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).send("Error creating user");
  }
});

// After successful login
app.post("/login", loginValidation, (req, res) => {
  res.redirect("/home");
});

// GET security question based on the email
app.get("/getSecurityQuestion/:email", async (req, res) => {
  const email = req.params.email.trim();
  try {
    const requestedUser = await userModel.findOne({ email: email });
    res.json(requestedUser.security_question);
  } catch (err) {
    console.error("Failed to retrieve user:", err);
    res.json(null);
  }
});

app.use(sendResetPasswordEmail);

app.use(isAuthenticated);

// Code snippets for using the cached recipes to store the recipes for 2 days are from ChatGPT openAI
let cachedRecipes = {
  timestamp: null,
  data: [],
};

const TWO_DAYS_IN_MILLISECONDS = 2 * 24 * 60 * 60 * 1000;

function isCacheExpired() {
  if (!cachedRecipes.timestamp) return true; // If there is no timestamp, cache is expired
  const currentTime = new Date().getTime();
  return currentTime - cachedRecipes.timestamp >= TWO_DAYS_IN_MILLISECONDS; // If the cache is older than 2 days, it is expired
}

const getRecommendation = async (preferenceList) => {
  try {
    let recipeList = [];

    await Promise.all(
      preferenceList.map(async (preference) => {
        const response = await fetch(
          `https://api.edamam.com/search?app_id=${process.env.EDAMAM_APP_ID}&app_key=${process.env.EDAMAM_APP_KEY}&q=${preference}`
        );
        const data = await response.json();

        if (data && data.hits && data.hits.length > 0) {
          const recipes = data.hits;
          for (let j = 1; j < 3; j++) {
            let index = Math.floor(Math.random() * 10);
            let recipeId = recipes[index].recipe.uri.split("#recipe_")[1];
            let imgUrl = recipes[index].recipe.image;
            let recipeTitle = recipes[index].recipe.label;
            if (recipeTitle.length > 40) {
              recipeTitle = recipeTitle.substring(0, 40) + "...";
            }
            recipeList.push({ recipeId, imgUrl, recipeTitle });
          }
        }
      })
    );
    cachedRecipes.timestamp = new Date().getTime();
    cachedRecipes.data = recipeList;
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return [];
  }
};

async function fetchAndCacheRecommendations(preferenceList) {
  if (isCacheExpired()) {
    await getRecommendation(preferenceList);
  }
}

// GET user's preferences from database
const getPreference = async (email) => {
  try {
    const user = await userModel.findOne({ email: email });
    if (user) {
      return user.preferences;
    } else {
      console.log("User not found");
    }
  } catch (error) {
    console.error("Error fetching user preferences:", error);
  }
};

app.get("/home", async (req, res) => {
  let preferenceList = [];
  let recipeList = [];
  let monthlyRecipeList = [];
  preferenceList = await getPreference(req.session.email);
  // If user has no preferences, use default preferences
  if (preferenceList.length == 0) {
    preferenceList = ["chicken", "beef", "pork", "vegetarian"];
  } else if (preferenceList.length < 2) {
    preferenceList.push("vegetarian", "crab");
  } else if (preferenceList.length < 3) {
    preferenceList.push("crab");
  }
  await fetchAndCacheRecommendations(preferenceList);
  recipeList = cachedRecipes.data;

  // MonthlyRecipe
  const monthlyRecipes = await monthlyRecipe.find({});
  if (monthlyRecipes) {
    for (let i = 0; i < 6; i++) {
      let recipeId = monthlyRecipes[i].recipeId;
      let recipeImg = monthlyRecipes[i].recipeImg;
      let recipeTitle = monthlyRecipes[i].recipeTitle;
      let description = monthlyRecipes[i].description;
      monthlyRecipeList.push({ recipeId, recipeImg, recipeTitle, description});
    }
  } else {
    console.log("No monthly recipe found");
  }
  res.render("home", {
    recipeList: recipeList,
    monthlyRecipeList: monthlyRecipeList,
  });
});

app.get("/browse", (req, res) => {
  res.render("browse");
});

app.use(getRecipeInfo);

app.post("/add_to_cart", async (req, res) => {
  try {
    const user = await userModel.findOne({ email: req.session.email });
    if (!user) {
      return res.status(404).send("User not found");
    }

    const recipeId = req.body.recipeId;
    const recipePrice = parseFloat(req.body.recipePrice);

    if (!user.cart.has(recipeId)) {
      user.cart.set(recipeId, {
        recipePrice: recipePrice,
        quantity: 1,
      });
    } else {
      user.cart.get(recipeId).quantity += 1;
    }
    await user.save();
    res.status(200).json({ message: "Added to cart successfully" });
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).send("Internal server error");
  }
});

app.post("/recipe_Info/:id", async (req, res) => {
  try {
    const user = await userModel.findOne({ email: req.session.email });
    if (!user) {
      return res.status(404).send("User not found");
    }

    const userCart = user.cart;

    try {
      await userModel.findOneAndUpdate(
        { email: req.session.email },
        { $set: { cart: userCart } }
      );
      res.sendStatus(200);
    } catch (err) {
      console.error("Failed to update cart.", err);
      res.status(500).send("Failed to update cart.");
    }
  } catch (err) {
    console.error("Failed to retrieve user:", err);
    res.status(500).send("Internal server error");
  }
});

app.get("/get_cart_number", async (req, res) => {
  try {
    const user = await userModel.findOne({ email: req.session.email });
    let cartCount = 0;

    user.cart.forEach((item) => {
      if (item) cartCount += item.quantity;
    });
    res.json(cartCount);
  } catch (err) {
    console.error("Failed to retrieve user:", err);
    res.json(0);
  }
});

// GET request for the recipe_search_page
app.get("/recipe_search_page", (req, res) => {
  res.render("recipe_search_page");
});

app.get("/get_search_query/:query", async (req, res) => {
  const appId = process.env.EDAMAM_APP_ID;
  const appKey = process.env.EDAMAM_APP_KEY;
  const query = req.params.query;

  const url = `https://api.edamam.com/search?app_id=${appId}&app_key=${appKey}&q=${query}`;
  const response = await fetch(url);
  const data = await response.json();

  res.json(data);
});

// This is for testing, will be refactored as app.post("/payment")
app.get("/payment", async (req, res) => {
  const user = await userModel.findOne({ email: req.session.email });
  const userCart = user.cart;
  let priceList = [];
  let totalPrice = 0;
  await userCart.forEach((item) => {
    totalPrice += item.recipePrice * item.quantity;
  });

  // Tax calculation
  const tax = totalPrice * 0.12;

  // Push the total price before tax, tax, and total price with tax to the priceList array
  priceList.push(totalPrice, tax, totalPrice + tax);

  res.render("payment", { priceList: priceList });
});

// app.post("/update_cart", async (req, res) => {
//   try {
//     const { recipeLabel, action } = req.body;

//     const user = await userModel.findOne({ email: req.session.email });
//     if (!user) {
//       console.error("User not found");
//       return res
//         .status(404)
//         .json({ success: false, message: "User not found." });
//     }

//     if (!user.cart) {
//       user.cart = [];
//     }
//     if (!user.cart) {
//       user.cart = [];
//     }

//     let item = user.cart.find((item) => item.label === recipeLabel);

//     if (item) {
//       if (action === "increment") {
//         item.count += 1;
//       } else if (action === "decrement" && item.count > 1) {
//         item.count -= 1;
//       } else if (action === "decrement" && item.count === 1) {
//         user.cart = user.cart.filter((item) => item.label !== recipeLabel); // Remove item if count is 1
//       }

//       await userModel.updateOne(
//         { username: req.session.username },
//         { $set: { cart: user.cart } }
//       );

//       console.log("Cart updated:", user.cart);
//       res.json({ success: true });
//     } else {
//       console.error("Item not found in cart");
//       res.json({ success: false, message: "Item not found in cart." });
//     }
//   } catch (error) {
//     console.error("Error updating cart:", error);
//     res.status(500).json({ success: false, message: "Internal server error" });
//   }
// });

// User Account page
app.get("/user_account", async (req, res) => {
  if (req.session.username) {
    try {
      const user = await userModel.findOne({ email: req.session.email });
      if (!user) {
        return res.status(404).send("User not found");
      }
      res.render("user_account", { user: user });
    } catch (err) {
      console.error("Failed to retrieve user:", err);
      res.status(500).send("Internal server error");
    }
  } else {
    res.redirect("/login"); // Redirect to login if no username is found in the session
  }
});

// Route to get user orders
app.get("/user_orders", async (req, res) => {
  try {
    const user = await userModel.findOne({ email: req.session.email });
    const userOrders = await orders.find({ orderId: { $in: user.order } }).sort({ orderDate: -1 });
    res.json(userOrders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).send("Error fetching orders");
  }
});

// Route to render order history page
app.get('/order_history', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 5;
  try {
    const user = await userModel.findOne({ email: req.session.email });
    const totalOrders = await orders.countDocuments({ orderId: { $in: user.order } });
    const paginatedOrders = await orders
      .find({ orderId: { $in: user.order } })
      .sort({ orderDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.render('order_history', {
      orders: paginatedOrders,
      totalPages: Math.ceil(totalOrders / limit),
      currentPage: page,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});


// Route to render order details page
app.get("/order/:orderId", async (req, res) => {
  try {
    const order = await orders.findOne({ orderId: req.params.orderId });
    res.render("order_details", { order });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).send("Error fetching order");
  }
});

app.get("/user_profile", async (req, res) => {
  if (req.session.username) {
    try {
      const user = await userModel.findOne({ email: req.session.email });
      if (user) {
        res.render("userProfile", { user: user });
      } else {
        res.status(404).send("User not found");
      }
    } catch (err) {
      console.error("Failed to retrieve user for profile:", err);
      res.status(500).send("Internal server error");
    }
  } else {
    res.redirect("/login");
  }
});

app.post("/update_profile", async (req, res) => {
  const { name, email, phone, address } = req.body;
  try {
    const updatedUser = await userModel.findOneAndUpdate(
      { email: req.session.email },
      {
        $set: {
          username: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
        },
      },
      { new: true }
    );
    req.session.username = updatedUser.username;
    res.redirect("/user_profile");
  } catch (err) {
    console.error("Failed to update user:", err);
    res.status(500).send("Failed to update profile.");
  }
});

// Favorites page
app.get("/favorites", async (req, res) => {
  const user = await userModel.findOne({ email: req.session.email });
  const favoriteList = user.my_fav;

  let recipeDetailsArray = [];
  await Promise.all(
    favoriteList.map(async (recipeId) => {
      const response = await fetch(
        `https://api.edamam.com/api/recipes/v2/${recipeId}?type=public&app_id=${process.env.EDAMAM_APP_ID}&app_key=${process.env.EDAMAM_APP_KEY}`
      );
      const data = await response.json();

      recipeDetailsArray.push({
        recipeId: recipeId,
        recipeTitle: data.recipe.label,
        recipeImg: data.recipe.image,
      });
    })
  );

  res.render("favorites", { recipeDetails: recipeDetailsArray });
});

// Get feedback page
app.get("/feedback", (req, res) => {
  res.render("feedback");
});

app.post("/favorites/remove/:id", async (req, res) => {
  const id = req.params.id;
  try {
    await userModel.findOneAndUpdate(
      { email: req.session.email },
      { $pull: { my_fav: id } }
    );
    res.status(200).send("Removed favorite");
    console.log("Removed favorite:", id);
  } catch (err) {
    console.error("Failed to remove favorite:", err);
    res.status(500).send("Failed to remove favorite.");
  }
});

app.post("/favorites/add/:id", async (req, res) => {
  const id = req.params.id;
  try {
    await userModel.findOneAndUpdate(
      { email: req.session.email },
      { $push: { my_fav: id } }
    );
    res.status(200).send("Added favorite");
    console.log("Added favorite:", id);
  } catch (err) {
    console.error("Failed to add favorite:", err);
    res.status(500).send("Failed to add favorite.");
  }
});

// Store feedback in the database
app.post("/save_feedback", async (req, res) => {
  const name = req.body.name.trim();
  const message = req.body.message.trim();
  const timestamp = new Date();
  const feedback = new feedbacks({
    name: name,
    message: message,
    time: timestamp,
  });
  try {
    await feedback.save();
    res.redirect("/user_account");
  } catch (err) {
    console.error("Failed to save feedback:", err);
    res.status(500).send("Failed to save feedback.");
  }
});

// Route to render the my preferences page
app.get("/my_preference", async (req, res) => {
  try {
    const preferences = await Preference.find();
    res.render("my_preference", { preferences });
  } catch (error) {
    console.error("Error fetching preferences:", error);
    res.status(500).send("Error fetching preferences");
  }
});

// Route to update user preferences
app.post("/update_preference", async (req, res) => {
  const { preferences } = req.body;
  try {
    await userModel.findOneAndUpdate(
      { email: req.session.email },
      { $set: { preferences: preferences } },
      { new: true }
    );
    res.json({ status: "success" });
  } catch (error) {
    console.error("Error updating preferences:", error);
    res.status(500).json({ status: "error" });
  }
});

// Route to render the local preferences page
app.get("/local_preference", isAuthenticated, async (req, res) => {
  try {
    const user = await userModel.findOne({ email: req.session.email });
    res.render("localPreference", { user });
  } catch (error) {
    console.error("Error fetching user preferences:", error);
    res.status(500).send("Error fetching user preferences");
  }
});

// Route to save the preferences
app.post("/save_preferences", async (req, res) => {
  const preferences = req.body.preferences;
  try {
    await userModel.findOneAndUpdate(
      { email: req.session.email },
      { $set: { preferences: preferences } },
      { new: true }
    );
    res.sendStatus(200);
  } catch (error) {
    console.error("Error saving preferences:", error);
    res.status(500).send("Error saving preferences");
  }
});

app.post("/delete_preference", async (req, res) => {
  const { preference } = req.body;
  try {
    await userModel.updateOne(
      { username: req.session.username },
      { $pull: { preferences: preference } }
    );
    res.json({ status: "success" });
  } catch (error) {
    console.error("Error deleting preference:", error);
    res.status(500).json({ status: "error" });
  }
});

// Get post request for decrease quantity in the cart and update the cart in the database
app.post("/quantity/decrease/:id", async (req, res) => {
  const recipeId = req.params.id;
  try {
    const user = await userModel.findOne({ email: req.session.email });
    if (!user) {
      return res.status(404).send("User not found");
    }
    await userModel.updateOne(
      { email: req.session.email },
      { $inc: { [`cart.${recipeId}.quantity`]: -1 } }
    );
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).send("Error fetching user");
  }
  res.status(200).send("Decreased quantity");
});

// Get post request for increase quantity in the cart and update the cart in the database
app.post("/quantity/increase/:id", async (req, res) => {
  const recipeId = req.params.id;
  try {
    const user = await userModel.findOne({ email: req.session.email });
    if (!user) {
      return res.status(404).send("User not found");
    }
    await userModel.updateOne(
      { email: req.session.email },
      { $inc: { [`cart.${recipeId}.quantity`]: 1 } }
    );
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).send("Error fetching user");
  }
  res.status(200).send("Increased quantity");
});

app.post("/deleteRecipe/:id", async (req, res) => {
  const recipeId = req.params.id;
  try {
    await userModel.updateOne(
      { email: req.session.email },
      { $unset: { [`cart.${recipeId}`]: "" } }
    );
    res.status(200).send("Deleted recipe");
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).send("Error fetching user");
  }
});

// Logout page
app.post("/logout", (req, res) => {
  res.clearCookie("connect.sid", { path: "/" });
  req.session.destroy();
  res.redirect("/");
});

// Import the calculator routes and use them as middleware
app.use(calculator);

// Route to handle the order confirmation
app.use(sendConfirmationEmail);

// 404 Page (Keep down here so that you don't muck up other routes)
app.get("*", (req, res) => {
  res.status(404).render("404");
});

// This is to let us know that the server is running and is good to go/where
app.listen(port, () => {
  console.log(`Server is running on port: http://localhost:${port}`);
});
