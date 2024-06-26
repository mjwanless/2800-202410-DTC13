/* jshint esversion: 8 */

const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const feedbackSchema = new Schema({
  name: String,
  message: String,
  time: Date
});
const feedbacks = mongoose.model("feedbacks", feedbackSchema);
module.exports = feedbacks;