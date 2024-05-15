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
  })
  const { error } = schema.validate(req.body)
  if (error) {
    return res.send(`Error in user data: ${error.details[0].message}, <a href='/signup'>try again</a>`);
  }

  var hashedPassword = await bcrypt.hash(req.body.password, saltRounds)
  const user = new User({
    username: req.body.username,
    email: req.body.email,
    password: hashedPassword
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

// GET request for the root URL/"Homepage"
app.get("/", (req, res) => {
  res.render("home");
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

app.post("/signup", createUser, (req, res) => {
  res.redirect("/test");
});

app.post("/login", loginValidation, (req, res) => {
  res.redirect("/test");
});

app.use(isAuthenticated)
// Members page
app.get("/test", async (req, res) => {
  res.render("test", { username: req.session.username });
});

// Logout page
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.clearCookie("connect.sid", { path: "/" });
  res.render("logout");
});

// 404 Page (Keep down here so that you don't muck up other routes)
app.get("*", (req, res) => {
  res.status(404).render("404");
});

// This is to let us know that the server is running and is good to go/where
app.listen(port, () => {
  console.log(`Server is running on port: http://localhost:${port}`);
});
