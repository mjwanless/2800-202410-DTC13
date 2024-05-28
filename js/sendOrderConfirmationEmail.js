/* jshint esversion: 8 */


const express = require("express");
const User = require("./userSchema");
const config = require("./config");
const nodeMailer = require("nodemailer");
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2; //google auth library to send email without user interaction and consent
const OAuth2Client = new OAuth2(config.clientId, config.clientSecret); //google auth client
OAuth2Client.setCredentials({ refresh_token: config.refreshToken });
const dateFormat = require("date-fns");
const { is, fr, ht, tr, el } = require("date-fns/locale");
const orders = require("./orderSchema");
const orderconfirmRouter = express.Router();

const getConfirmationNumber = () =>{
  // Generate random order number
  const number = (Math.floor(Math.random() * 1000) + 1).toString();
  // Generate random 3 letter code
  let letter = "";
  for (let i = 0; i < 3; i++) {
    letter += String.fromCharCode(Math.floor(Math.random() * 26) + 65);
  }
   const orderNumber = number + letter;
   return orderNumber;
}

// Calculate delivery date
const getDeliveryDate = () =>{
  const now = new Date();
  const deliveryDate = new Date(now.setDate(now.getDate() + 7));
  const formattedDate = dateFormat.format(deliveryDate, "yyyy-MM-dd");
  return formattedDate;
}

// format the amount into CAD
const getTotalAmount = (amount) =>{
  const currencyFormater = new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  });
  const formattedAmount = currencyFormater.format(amount);
  return formattedAmount;
}


// save order to the database
const saveOrder = async (orderNumber, amount) =>{
  await orders
    .create({
      orderId: orderNumber,
      orderDate: new Date(),
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
      console.log("Order saved to the database");
    });
}

function confirmationInfo(userName, orderNumber, amount) {
  return `
    <h1>Hello ${userName} ! </h1>
    <h3>Order Confirmation: ${orderNumber}</h3>
    <h3>Total amount: $ ${amount}</h3>
    <p>Thank you for your order. Your order has been confirmed.</p>
    <p>Thank you for choosing Fresh Plate</p>
    `;
}

function sendConfirmationEmail(recipient, accessToken, userName, orderNumber, formattedAmount) {
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
    html: confirmationInfo(userName, orderNumber, formattedAmount),
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

//post request for the order confirmation page
orderconfirmRouter.post("/orderconfirm", async (req, res) => {

  const orderNumber = getConfirmationNumber();
  const formattedDate = getDeliveryDate();
  const formattedAmount = getTotalAmount(req.body.amount);

  //update user's order list
  await User.updateOne(
    { username: req.session.username },
    { $push: { order: orderNumber } }
  );

  //get a new access token to send email every time
  const accessToken = await OAuth2Client.getAccessToken();
  const user = await User.findOne({ email: req.session.email });
  const recipient = user.email;
  const userName = user.username;

  sendConfirmationEmail(recipient, accessToken, userName, orderNumber, formattedAmount);  
  saveOrder(orderNumber, req.body.amount);

  res.render("orderconfirm", {
    orderId: orderNumber,
    deliveryDate: formattedDate,
    amount: formattedAmount,
  });
});

module.exports = orderconfirmRouter;