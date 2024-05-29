/* jshint esversion: 8 */

const mongoose = require("mongoose");
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
  cart: {
    type: Map,
    of: {
      recipePrice: Number,
      quantity: Number
    }
  }
});
const User = mongoose.model("User", userSchema);
module.exports = User;