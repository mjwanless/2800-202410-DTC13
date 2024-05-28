const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const orderSchema = new Schema({
  orderId: String,
  orderDate: Date,
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

const orders = mongoose.model("orders", orderSchema);
module.exports = orders;
