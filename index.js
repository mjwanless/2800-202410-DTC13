// ======================================
// Just some fun import statements
// ======================================
const express = require("express");
require("dotenv").config();
const session = require("express-session");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
var MongoDBStore = require("connect-mongodb-session")(session);
const dateFormat = require("date-fns");
const nodeMailer = require("nodemailer");
const cors = require("cors");
const { google } = require("googleapis");
const config = require("./config");
const monthlyRecipe = require("./createData");
const OAuth2 = google.auth.OAuth2; //google auth library to send email without user interaction and consent
const OAuth2Client = new OAuth2(config.clientId, config.clientSecret); //google auth client
OAuth2Client.setCredentials({ refresh_token: config.refreshToken });

const sessionExpireTime = 1 * 60 * 60 * 1000; //1 hour
const saltRounds = 10;
const joi = require("joi");
const { Double } = require("mongodb");
const { is, fr, ht, tr, el } = require("date-fns/locale");

// ======================================
// Create a new express app and set up the port for .env variables
// ======================================
const app = express();
app.use(cors());
const port = process.env.PORT || 3000;

app.set("view engine", "ejs");

// ======================================
// This is to be able to allow us to parse the req.body/URL-encoded bodies
// ======================================
app.use(express.urlencoded({ extended: false }));

// ======================================
// We need a session setup to maintain security and user data and create sessions with cookies
// ======================================

// Mongo variables from the .env file
const mongodb_host = process.env.MONGODB_HOST;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;

// // Connecting to the Atlas database
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

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  security_question: String,
  security_answer: String,
  preferences: Array,
  my_fav: Array,
  address: String,
  phone: String,
  order: Array,
});

const orderSchema = new mongoose.Schema({
  orderId: String,
  orde_date: Date,
  isPickup: Boolean,
  isDelivery: Boolean,
  vendor: {
    name: String,
    address: String,
  },
  amount: Number,
  info: {
    recipeTitle: String,
    description: String,
  },
});

const User = mongoose.model("User", userSchema);
const orders = mongoose.model("orders", orderSchema);

// mongoDB session
var store = new MongoDBStore({
  uri: atlasURI,
  collection: "sessions",
  autoRemove: "native",
});

// // Catch errors
// store.on("error", function (error) {
//   console.log(error);
// });

app.use(
  session({
    secret: mongodb_session_secret,
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

// // ======================================
// // This is to be able to use html, css, and js files in the public folder
// // ======================================
app.use(express.static(__dirname + "/public"));

// // ======================================
// // Where the magic happens ================================================================
// // ======================================

// // ======================================
// // Commit to create dev branch
// // ======================================

// ======================================
// functions and middleware
// ======================================
let emailSent = false;

// Middleware to check if the user is authenticated
isAuthenticated = (req, res, next) => {
  if (req.session.authenticated) {
    req.session.username = req.session.username;
    next();
  } else return res.redirect("/login");
};

// Middleware to create a user
const createUser = async (req, res, next) => {
  const schema = joi.object({
    username: joi.string().alphanum().max(30).required(),
    email: joi.string().max(200).required(),
    password: joi.string().max(50).required(),
    security_question: joi.string().max(50).required(),
    security_answer: joi.string().max(50).required(),
  });
  const { error } = schema.validate(req.body);
  if (error) {
    return res.send(
      `Error in user data: ${error.details[0].message}, <a href='/signup'>try again</a>`
    );
  }

  var hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
  var hashedSecurityAnswer = await bcrypt.hash(
    req.body.security_answer,
    saltRounds
  );

  const user = new User({
    username: req.body.username,
    email: req.body.email,
    password: hashedPassword,
    security_question: req.body.security_question,
    security_answer: hashedSecurityAnswer,
  });

  try {
    await user.save();
  } catch (err) {
    console.log("Failed to create user:", err);
    res.status(500).send("Internal server error");
  }

  req.session.authenticated = true;
  req.session.username = req.body.username;
  req.session.cookie.maxAge = sessionExpireTime;
  next();
};

// Middleware to validate a user account
const loginValidation = async (req, res, next) => {
  const schema = joi.object({
    email: joi.string().max(200).required(),
  });
  req.session.email = req.body.email;
  const validationResult = schema.validate({ email: req.session.email });
  if (validationResult.error) {
    res.send("login validation result error", {
      error: validationResult.error,
    });
    return;
  }
  try {
    user = await User.findOne({ email: req.body.email });
    if (user) {
      const outputPassword = user.password;
      const inputPassword = req.body.password;

      if (await bcrypt.compare(inputPassword, outputPassword)) {
        req.session.authenticated = true;
        req.session.username = user.username;
        req.session.cookie.maxAge = sessionExpireTime;
        next();
      } else {
        return res.render("login", { wrongPassword: true });
      }
    } else {
      return res.render("login", { noUser: true });
    }
  } catch (err) {
    console.log("fail to login", err);
  }
};

// Middleware to reset a password
const resetPassword = async (req, res, next) => {
  const schema = joi.object({
    email: joi.string().max(200).required(),
  });
  const validationResult = schema.validate({ email: req.body.email });
  if (validationResult.error) {
    res.send("login validation result error", {
      error: validationResult.error,
    });
    return;
  }
  try {
    user = await User.findOne({ email: req.body.email });
    if (user) {
      const outputQuestion = user.security_question;
      const inputQuestion = req.body.security_question;
      const outputAnswer = user.security_answer;
      const inputAnswer = req.body.security_answer;

      if (
        inputQuestion != outputQuestion ||
        !(await bcrypt.compare(inputAnswer, outputAnswer))
      ) {
        return res.render("reset_password", { wrongAnswer: true });
      }

      var hashedPassword = await bcrypt.hash(req.body.password, saltRounds);

      try {
        await User.findOneAndUpdate(
          { email: req.body.email },
          { $set: { password: hashedPassword } }
        );

        next();
      } catch (err) {
        console.error("Failed to update password:", err);
        res.status(500).send("Failed to update password.");
      }
    } else {
      return res.render("reset_password", { noUser: true });
    }
  } catch (err) {
    console.log("fail to login", err);
  }
};

// GET request for the root URL/"Homepage"
app.get("/", (req, res) => {
  res.render("landing");
});

// GET request for the login page
app.get("/login", (req, res) => {
  res.render("login");
});

// Test for API data display
app.get("/apitest", (req, res) => {
  res.render("api_practice");
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
  res.redirect("/home"); // Changed from "/test" to "/user_account"
});

// After successful login
app.post("/login", loginValidation, (req, res) => {
  res.redirect("/home"); // Changed from "/test" to "/user_account"
});

// After successful password reset
app.post("/reset_password", resetPassword, (req, res) => {
  res.redirect("/login");
});

//post request for the order confirmation page
app.post("/orderconfirm", async (req, res) => {
  //generate random order number
  const number = (Math.floor(Math.random() * 1000) + 1).toString();
  // generate random 3 letter code
  let letter = "";
  for (let i = 0; i < 3; i++) {
    letter += String.fromCharCode(Math.floor(Math.random() * 26) + 65);
  }
  const orderNumber = number + letter;

  //update user's order list
  await User.updateOne(
    { username: req.session.username },
    { $push: { order: orderNumber } }
  );

  // calculate delivery date
  const now = new Date();
  const deliveryDate = new Date(now.setDate(now.getDate() + 7));
  const formattedDate = dateFormat.format(deliveryDate, "yyyy-MM-dd");

  // format the amount
  const currencyFormater = new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  });
  //TO DO: get the amount from the cart
  const amount = 55.0; // hard coded amount for now
  const formattedAmount = currencyFormater.format(amount);

  // send email
  const accessToken = await OAuth2Client.getAccessToken(); //get a new access token to send email every time

  const user = await User.findOne({ email: req.session.email });
  const recipient = user.email;
  const userName = user.username;
  function sendConfirmationEmail(recipient) {
    const transporter = nodeMailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: config.user,
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        refreshToken: config.refreshToken,
        accessToken: accessToken,
      },
    });

    const mailOptions = {
      from: `Fresh Plate <${config.user}>`,
      to: recipient,
      subject: "Order Confirmation",
      html: confirmationInfo(),
    };

    transporter.sendMail(mailOptions, (err, result) => {
      if (err) {
        console.log(err);
      } else {
        console.log("Email sent: " + result);
      }
      transporter.close();
    });
  }

  function confirmationInfo() {
    return `
    <h1>Hello ${userName} ! </h1>
    <h3>Order Confirmation: ${orderNumber}</h3>
    <h3>Total amount: $ ${amount}</h3>
    <p>Thank you for your order. Your order has been confirmed.</p>
    <p>Thank you for choosing Fresh Plate</p>
    `;
  }
  sendConfirmationEmail(recipient);

  //save the order to the database
  await orders
    .create({
      orderId: orderNumber,
      orde_date: new Date(),
      isPickup: false,
      isDelivery: true,
      vendor: {
        name: "Fresh Plate",
        address: "1234 Fresh Plate Lane",
      },
      amount: amount,
      info: {
        recipeTitle: "Recipe Title",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      },
    })
    .then((order) => {
      order.save();
      console.log("Order created: ", order);
    });

  res.render("orderconfirm", {
    orderId: orderNumber,
    deliveryDate: formattedDate,
    amount: formattedAmount,
  });
});

app.use(isAuthenticated);

// the code snippets for using the cached recipes to store the recipes for 2 days are from ChatGPT openAI
let cachedRecipes = {
  timestamp: null,
  data: [],
};

const TWO_DAYS_IN_MILLISECONDS = 2 * 24 * 60 * 60 * 1000; // 2 days in milliseconds

function isCacheExpired() {
  if (!cachedRecipes.timestamp) return true; // if there is no timestamp, cache is expired
  const currentTime = new Date().getTime();
  return currentTime - cachedRecipes.timestamp > TWO_DAYS_IN_MILLISECONDS; // if the cache is older than 2 days, it is expired
}

// function to get the recommendation from the API
const getRecommendation = async (preferenceList, recipeList, res) => {
  // a for loop to qurey each preference from the API and store the recipes ids in recipeList
  for (let i = 0; i < preferenceList.length; i++) {
    const preference = preferenceList[i];
    const response = await fetch(
      `https://api.edamam.com/search?app_id=${process.env.EDAMAM_APP_ID}&app_key=${process.env.EDAMAM_APP_KEY}&q=${preference}`
    )
      .then((response) => response.json())
      .then((data) => {
        const recipes = data.hits;
        // only get two recipes for each preference
        for (let j = 1; j < 3; j++) {
          let index = Math.floor(Math.random() * 10);
          let recipeId = recipes[index].recipe.uri.split("#recipe_")[1];
          let imgUrl = recipes[index].recipe.image;
          let recipeTitle = recipes[index].recipe.label;
          recipeList.push({ recipeId, imgUrl, recipeTitle });
        }
      });
  }
};

async function fetchAndCacheRecommendations(preferenceList) {
  cachedRecipes.timestamp = new Date().getTime(); // update the timestamp
  cachedRecipes.data = []; // clear the cache
  await getRecommendation(preferenceList, cachedRecipes.data);
}

app.get("/home", async (req, res) => {
  let preferenceList = [];
  let recipeList = [];
  let monthlyRecipeList = [];

  // get user's preferences from database
  const getPreference = async (email) => {
    try {
      const user = await User.findOne({ email: email });
      if (user) {
        preferenceList = user.preferences;
      } else {
        console.log("User not found");
      }
    } catch (error) {
      console.error("Error fetching user preferences:", error);
    }
  };

  await getPreference(req.session.email);

  // if user has no preferences, use default preferences
  if (preferenceList.length == 0) {
    preferenceList = ["chicken", "beef", "pork", "vegetarian"];
  } else if (preferenceList.length < 2) {
    preferenceList.push("vegetarian", "crab");
  } else if (preferenceList.length < 3) {
    preferenceList.push("crab");
  }

  if (isCacheExpired()) {
    await fetchAndCacheRecommendations(preferenceList);
  }
  recipeList = cachedRecipes.data;

  // monthlyRecipe
  monthlyRecipes = await monthlyRecipe.find({});
  if (monthlyRecipes) {
    for (let i = 0; i < 6; i++) {
      let recipeId = monthlyRecipes[i].recipeId;
      let recipeImg = monthlyRecipes[i].recipeImg;
      let recipeTitle = monthlyRecipes[i].recipeTitle;
      monthlyRecipeList.push({ recipeId, recipeImg, recipeTitle });
    }
  } else {
    console.log("No monthly recipe found");
  }

  res.render("home", {
    recipeList: recipeList,
    monthlyRecipeList: monthlyRecipeList,
  });
});

app.get("/cart", (req, res) => {
  res.render("cart");
});

app.get("/browse", (req, res) => {
  res.render("browse");
});

// GET request for the recipedisplaypage
app.post("/recipeInfo/:id", (req, res) => {
  
  res.sendStatus(200);
});

app.get("/recipeInfo/:id", (req, res) => {
  const recipeId = req.params.id;
  console.log(recipeId);
  res.render("recipeInfo");
});


// This is for testing, will be refactored as app.post("/payment")
app.get("/payment", async (req, res) => {
  res.render("payment");
});

// User Account page
app.get("/user_account", isAuthenticated, async (req, res) => {
  if (req.session.username) {
    try {
      const user = await User.findOne({ username: req.session.username });
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

// User profile page
app.get("/user_profile", isAuthenticated, async (req, res) => {
  if (req.session.username) {
    try {
      const user = await User.findOne({ username: req.session.username });
      if (user) {
        res.render("user_profile", { user: user });
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

// Update user profile
app.post("/update_profile", isAuthenticated, async (req, res) => {
  const { name, email, phone, address } = req.body;
  try {
    const updatedUser = await User.findOneAndUpdate(
      { username: req.session.username },
      {
        $set: { username: name, email: email, phone: phone, address: address },
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

// favorite page
app.get("/favorite", (req, res) => {
  res.render("favorite");
});

// my preference page
app.get("/my_preference", (req, res) => {
  res.render("my_preference");
});

// Logout page
app.post("/logout", (req, res) => {
  res.clearCookie("connect.sid", { path: "/" });
  req.session.destroy();
  res.redirect("/");
});

// 404 Page (Keep down here so that you don't muck up other routes)
app.get("*", (req, res) => {
  res.status(404).render("404");
});

// This is to let us know that the server is running and is good to go/where
app.listen(port, () => {
  console.log(`Server is running on port: http://localhost:${port}`);
});
