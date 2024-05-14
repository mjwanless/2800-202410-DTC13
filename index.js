// ======================================
// Just some fun import statements
// ======================================
const express = require("express");
require("dotenv").config();
const session = require("express-session");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
var MongoDBStore = require("connect-mongodb-session")(session);
const sessionExpireTime = 1 * 60 * 60 * 1000;
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
  name: String,
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

// connect schema to collection
const users = mongoose.model("users", userSchema);

// mongoDB session
var store = new MongoDBStore({
  uri: atlasURI,
  collection: "sessions",
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

// Middleware to check if the session is valid
function isValidSession(req) {
  if (req.session.authenticated) {
    return true;
  } else {
    return false;
  }
}

// Middleware to check if the session is valid
function sessionValidation(req, res, next) {
  console.log(req.session.authenticated);
  console.log(req.session.name);
  console.log(req.session.role);
  if (isValidSession(req)) {
    next();
  } else {
    res.redirect("/login");
  }
}

// Middleware to check if the user is an admin
function isAdmin(req) {
  if (req.session.role == "admin") {
    return true;
  } else {
    return false;
  }
}

// Middleware to check if the user is an admin
function adminAuthorization(req, res, next) {
  console.log(req.session.role);
  if (isAdmin(req)) {
    next();
  } else {
    res.status(403);
    res.render("notadmin");
  }
}

// GET request for the root URL/"Homepage"
app.get("/", (req, res) => {
  let name = req.session.name;

  if (req.session.authenticated) {
    res.render("indexauthenticateduser", { name: name });
  } else {
    res.render("indexunauthenticateduser");
  }
});

// GET request for the login page
app.get("/login", (req, res) => {
  res.render("login");
});

// POST request for the login page
app.post("/loginValidation", async (req, res) => {
  let email = req.body.email;
  let password = req.body.password;

  const userSchema = joi.object({
    email: joi.string().email().max(200).required(),
  });

  const validationResult = userSchema.validate({ email: email });

  if (validationResult.error != null) {
    res.render("loginvalidationresulterror", { error: validationResult.error });
    return;
  }

  const result = await userCollection
    .find({ email: email })
    .project({ role: 1, email: 1, password: 1, name: 1, _id: 1 })
    .toArray();

  console.log(result[0]);
  if (result.length != 1) {
    res.render("usernotfound");
    return;
  }

  if (await bcrypt.compare(password, result[0].password)) {
    req.session.authenticated = true;
    req.session.name = result[0].name;
    req.session.role = result[0].role;
    req.session.cookie.maxAge = sessionExpireTime;

    res.redirect("/loggedIn");
    return;
  } else {
    res.render("incorrectpassword");
    return;
  }
});

// Checking to see if the user is authenticated
app.use("/loggedIn", sessionValidation);
app.get("/loggedIn", (req, res) => {
  if (req.session.authenticated) {
    res.redirect("/members");
  } else {
    res.redirect("/login");
  }
});

// GET request for the signup page
app.get("/signup", (req, res) => {
  res.render("signup");
});

// POST request for the signup page
app.post("/createUser", async (req, res) => {
  let name = req.body.name;
  let email = req.body.email;
  let password = req.body.password;
  let role = req.body.role;

  if (!name) {
    res.render("createusernoname");
    return;
  } else if (!email) {
    res.render("createusernoemail");
    return;
  } else if (!password) {
    res.render("createusernopassword");
    return;
  } else if (!role) {
    res.render("createusernorole");
    return;
  }

  const userSchema = joi.object({
    name: joi.string().alphanum().max(30).required(),
    email: joi.string().email().max(200).required(),
    password: joi.string().max(30).required(),
    role: joi.string().valid("admin", "user").required(),
  });

  const validationResult = userSchema.validate({
    name: name,
    email: email,
    password: password,
    role: role,
  });

  if (validationResult.error) {
    res.render("validationresulterror", { error: validationResult.error });
    return;
  }

  let hashedPassword = bcrypt.hashSync(password, saltRounds);
  await userCollection.insertOne({
    name: name,
    email: email,
    password: hashedPassword,
    role: role,
  });

  req.session.authenticated = true;
  req.session.name = name;
  req.session.role = role;
  req.session.cookie.maxAge = sessionExpireTime;
  res.redirect("/members");
});

// Members page
app.get("/members", async (req, res) => {
  console.log(req.session.role);
  let name = req.session.name;

  if (!req.session.authenticated) {
    res.redirect("/");
    return;
  }

  res.render("members", { name: name });
});

// New admin page
app.get("/admin", sessionValidation, adminAuthorization, async (req, res) => {
  const result = await userCollection
    .find()
    .project({ email: 1, role: 1, _id: 1 })
    .toArray();
  res.render("admin", { results: result });
});

// POST request for the admin page
app.post("/updateRole", async (req, res) => {
  let email = req.body.email;
  let role = req.body.role;

  await userCollection.updateOne({ email: email }, { $set: { role: role } });

  res.redirect("/admin");
});

// Logout page
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.clearCookie("connect.sid", { path: "/" });
  res.render("logout");
});

// 404 Page (Keep down here so that you don't muck up other routes)
app.get("*", (req, res) => {
  res.status(404);
  res.render("404");
});

// This is to let us know that the server is running and is good to go/where
app.listen(port, () => {
  console.log(`Server is running on port: http://localhost:${port}`);
});
