/* jshint esversion: 8 */

const express = require("express");
const User = require("./userSchema");
const config = require("./config");
const nodeMailer = require("nodemailer");
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2; //google auth library to send email without user interaction and consent
const OAuth2Client = new OAuth2(config.clientId, config.clientSecret); //google auth client
OAuth2Client.setCredentials({ refresh_token: config.refreshToken });
const getAccessToken = require("./emailAccessToken");
const bcrypt = require("bcrypt");
const joi = require("joi");
const saltRounds = 10;
const resetPasswordRouter = express.Router();


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
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      const outputAnswer = user.security_answer;
      const inputAnswer = req.body.security_answer;

      if (!(await bcrypt.compare(inputAnswer, outputAnswer))) {
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

// After successful password reset
resetPasswordRouter.post("/reset_password", resetPassword, async (req, res) => {
  const accessToken = getAccessToken();
  // const accessToken = await OAuth2Client.getAccessToken();

  const user = await User.findOne({ email: req.body.email });
  const recipient = user.email;
  const userName = user.username;

  function resetPasswordEmail(recipient) {
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
      subject: "Password Has Been Reset Successfully",
      html: resetPasswordInfo(),
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

  function resetPasswordInfo() {
    return `
    <h1>Hello ${userName} ! </h1>
    <p>Your password has been reset successfully.</p>
    `;
  }
  resetPasswordEmail(recipient);

  res.redirect("/login");
});

module.exports = resetPasswordRouter;