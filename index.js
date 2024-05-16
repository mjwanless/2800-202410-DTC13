// ======================================
// Just some fun import statements
// ======================================
const express = require("express");
require("dotenv").config();
const session = require("express-session");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
var MongoDBStore = require("connect-mongodb-session")(session);
const sessionExpireTime = 1 * 60 * 60 * 1000;  //1 hour
const saltRounds = 10;
const joi = require("joi");

// ======================================
// Create a new express app and set up the port for .env variables
// ======================================
const app = express();
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

// Connecting to the Atlas database
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

const User = mongoose.model("User", userSchema);

// mongoDB session
var store = new MongoDBStore({
  uri: atlasURI,
  collection: "sessions",
  autoRemove: 'native'
});

// Catch errors
store.on("error", function (error) {
  console.log(error);
});

app.use(
  session({
    secret: mongodb_session_secret,
    resave: false,
    saveUninitialized: true,
    store: store,
  })
);

// ======================================
// This is to be able to use html, css, and js files in the public folder
// ======================================
app.use(express.static(__dirname + "/public"));

// ======================================
// Where the magic happens ================================================================
// ======================================

// ======================================
// Commit to create dev branch
// ======================================

// ======================================
// functions and middleware
// ======================================

// Middleware to check if the user is authenticated
isAuthenticated = (req, res, next) => {
  if (req.session.authenticated) {
    req.session.username = req.session.username
    next()
  }
  else
    return res.redirect('/login')
}

// Middleware to create a user
const createUser = async (req, res, next) => {
  const schema = joi.object({
    username: joi.string().alphanum().max(30).required(),
    email: joi.string().max(200).required(),
    password: joi.string().max(50).required(),
    security_question: joi.string().max(50).required(),
    security_answer: joi.string().max(50).required()
  })
  const { error } = schema.validate(req.body)
  if (error) {
    return res.send(`Error in user data: ${error.details[0].message}, <a href='/signup'>try again</a>`);
  }

  var hashedPassword = await bcrypt.hash(req.body.password, saltRounds)
  var hashedSecurityAnswer = await bcrypt.hash(req.body.security_answer, saltRounds)

  const user = new User({
    username: req.body.username,
    email: req.body.email,
    password: hashedPassword,
    security_question: req.body.security_question,
    security_answer: hashedSecurityAnswer
  })

  try {
    await user.save();
  }
  catch (err) {
    console.log("Failed to create user:", err)
    res.status(500).send("Internal server error");
  }

  req.session.authenticated = true
  req.session.username = req.body.username
  req.session.cookie.maxAge = sessionExpireTime
  next()
}

// Middleware to validate a user account
const loginValidation = async (req, res, next) => {
  const schema = joi.object({
    email: joi.string().max(200).required()
  })
  const validationResult = schema.validate({ email: req.body.email });
  if (validationResult.error) {
    res.send("login validation result error", { error: validationResult.error });
    return;
  }
  try {
    user = await User.findOne({ email: req.body.email })
    if (user) {
      const outputPassword = user.password
      const inputPassword = req.body.password

      if (await bcrypt.compare(inputPassword, outputPassword)) {
        req.session.authenticated = true
        req.session.username = user.username
        req.session.cookie.maxAge = sessionExpireTime
        next()
      } else {
        return res.render('login', { wrongPassword: true })
      }
    } else {
      return res.render('login', { noUser: true })
    }
  }
  catch (err) {
    console.log("fail to login", err)
  }
}

// Middleware to reset a password
const resetPassword = async (req, res, next) => {
  const schema = joi.object({
    email: joi.string().max(200).required()
  })
  const validationResult = schema.validate({ email: req.body.email });
  if (validationResult.error) {
    res.send("login validation result error", { error: validationResult.error });
    return;
  }
  try {
    user = await User.findOne({ email: req.body.email })
    if (user) {
      const outputQuestion = user.security_question
      const inputQuestion = req.body.security_question
      const outputAnswer = user.security_answer
      const inputAnswer = req.body.security_answer

      if (inputQuestion != outputQuestion || !await bcrypt.compare(inputAnswer, outputAnswer)) {
        return res.render('reset_password', { wrongAnswer: true })
      }

      var hashedPassword = await bcrypt.hash(req.body.password, saltRounds)

      try {
        await User.findOneAndUpdate(
          { email: req.body.email },
          { $set: { password: hashedPassword } }
        );

        next()
      }
      catch (err) {
        console.error("Failed to update password:", err);
        res.status(500).send("Failed to update password.");
      }

    } else {
      return res.render('reset_password', { noUser: true })
    }
  }
  catch (err) {
    console.log("fail to login", err)
  }
}

// GET request for the root URL/"Homepage"
app.get("/", (req, res) => {
  res.render("landing");
}
);

// GET request for the login page
app.get("/login", (req, res) => {
  res.render("login");
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


app.use(isAuthenticated);
app.get("/home", (req, res) => {
  res.render("home");
});

app.get("/browse", (req, res) => {
  res.render("browse");
});

// GET request for the recipedisplaypage
app.get("/recipedisplaypage", (req, res) => {
  res.render("recipedisplaypage");
});

app.get('/favorites', (req, res) => { 
  res.render('favorites') })

// User Account page
app.get("/user_account", async (req, res) => {
  if (req.session.username) {
    try {
      // Fetch the user based on the username stored in the session
      const user = await User.findOne({ username: req.session.username });
      if (!user) {
        return res.status(404).send("User not found");
      }
      // Render the user_account page with user data
      res.render("user_account", { user: user });
    } catch (err) {
      console.error("Failed to retrieve user:", err);
      res.status(500).send("Internal server error");
    }
  } else {
    res.redirect("/login");  // Redirect to login if no username is found in the session
  }
});

app.get("/user_profile", async (req, res) => {
  if (req.session.username) {
    try {
      // Fetch the user from the database using the username stored in the session
      const user = await User.findOne({ username: req.session.username });
      if (user) {
        res.render("user_profile", { user: user }); // Pass user data to the template
      } else {
        res.status(404).send("User not found");
      }
    } catch (err) {
      console.error("Failed to retrieve user for profile:", err);
      res.status(500).send("Internal server error");
    }
  } else {
    res.redirect("/login"); // If not authenticated, redirect to login
  }
});

app.post("/update_profile", async (req, res) => {
  const { name, email, phone, address } = req.body;
  try {
    const updatedUser = await User.findOneAndUpdate(
      { username: req.session.username },
      { $set: { username: name, email: email, phone: phone, address: address } },
      { new: true }
    );
    // Update session if necessary
    req.session.username = updatedUser.username;
    res.redirect("/user_profile"); // Redirect to the profile page to show updated info
  } catch (err) {
    console.error("Failed to update user:", err);
    res.status(500).send("Failed to update profile.");
  }
});


// Logout page
app.post("/signout", (req, res) => {
  req.session.destroy();
  res.clearCookie("connect.sid", { path: "/" });
  res.send("you have logged out");
});

// 404 Page (Keep down here so that you don't muck up other routes)
app.get("*", (req, res) => {
  res.status(404).render("404");
});

// This is to let us know that the server is running and is good to go/where
app.listen(port, () => {
  console.log(`Server is running on port: http://localhost:${port}`);
});
