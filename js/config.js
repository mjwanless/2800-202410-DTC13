/* jshint esversion: 8 */

module.exports = {
  user: process.env.FRESHPLATE_EMAIL,
  clientId: process.env.EMAIL_CLIENTID,
  clientSecret: process.env.EMAIL_CLIENTSECRET,
  refreshToken: process.env.EMAIL_REFRESH_TOKEN,
};