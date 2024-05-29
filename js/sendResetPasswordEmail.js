/* jshint esversion: 8 */

const express = require("express");
const User = require("./userSchema");
const config = require("./config");
const nodeMailer = require("nodemailer");
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2; // Google auth library to send email without user interaction and consent
const OAuth2Client = new OAuth2(config.clientId, config.clientSecret); // Google auth client
OAuth2Client.setCredentials({ refresh_token: config.refreshToken });
const getAccessToken = require("./emailAccessToken");
const bcrypt = require("bcrypt");
const joi = require("joi");
const saltRounds = 10;
const resetPasswordRouter = express.Router();

let user;

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
      const outputAnswer = user.security_answer;
      const inputAnswer = req.body.security_answer;

      if (!(await bcrypt.compare(inputAnswer, outputAnswer))) {
        return res.render("reset_password", { wrongAnswer: true, email: req.body.email });
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

function resetPasswordInfo(userName) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
    <div style="text-align: center; margin-bottom: 20px;">
        <img src="https://freshplate.onrender.com/logo1.svg" alt="Fresh Plate Logo" style="width: 150px; height: auto;">
    </div>  
    <h1 style="color: #333;">Hello ${userName}!</h1>
      <p style="color: #666; line-height: 1.5;">Your password has been reset successfully.</p>
      <p style="color: #666; line-height: 1.5;">If you did not request this change, please contact our support team immediately.</p>
      <p style="color: #666; line-height: 1.5;">
        You can now log in to your account using your new password. For any assistance, please visit our 
        <a href="#" style="color: #1a73e8;">Support Page</a> or contact us at 
        <a href="#" style="color: #1a73e8;">support@freshplate.com</a>.
      </p>
      <p style="color: #666; line-height: 1.5;">Thank you for choosing Fresh Plate. Stay secure!</p>
      <p style="color: #666; line-height: 1.5;">
        For more information, please read our 
        <a href="https://docs.google.com/document/d/1VoWqNivEph_rFmGik6b1JtnFFU8KOQrVuFWoxJF-Psk/edit?usp=sharing" style="color: #1a73e8;">Privacy Policy</a>.
      </p>
      <div style="text-align: center; margin-top: 20px;">
        <a href="https://freshplate.onrender.com/login" style="display: inline-block; padding: 10px 20px; font-size: 16px; color: #fff; background-color: #1a73e8; border-radius: 4px; text-decoration: none;">Log In</a>
      </div>
    </div>
    `;
}

// After successful password reset
resetPasswordRouter.post("/reset_password", resetPassword, async (req, res) => {
  const accessToken = getAccessToken();

  const recipientEmail = user.email;
  const userName = user.username;

  function resetPasswordEmail(recipientEmail) {
    const transporter = nodeMailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: config.user,
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        refreshToken: config.refreshToken,
        accessToken: accessToken
      },
    });

    const mailOptions = {
      from: `Fresh Plate <${config.user}>`,
      to: recipientEmail,
      subject: "Password Has Been Reset Successfully",
      html: resetPasswordInfo(userName),
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

  resetPasswordEmail(recipientEmail);

  res.redirect("/login");
});

module.exports = resetPasswordRouter;
