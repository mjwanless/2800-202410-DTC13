/* jshint esversion: 8 */


const config = require("./config");
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2; //google auth library to send email without user interaction and consent
const OAuth2Client = new OAuth2(config.clientId, config.clientSecret); //google auth client
OAuth2Client.setCredentials({ refresh_token: config.refreshToken });

let globalAccessToken;

async function getAccessToken() {
  if (!globalAccessToken) {
    const accessToken = await OAuth2Client.getAccessToken();
    return accessToken;
  }
}

module.exports = getAccessToken;