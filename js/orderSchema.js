/* jshint esversion: 8 */


const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const orderSchema = new Schema({
  name: String,
  message: String,
  time: Date,
});

const orders = mongoose.model("orders", orderSchema);
module.exports = orders;
