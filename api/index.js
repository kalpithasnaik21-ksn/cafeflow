// Vercel serverless wrapper for Express
const app = require("../backend/src/app");

// Export handler instead of listen
module.exports = (req, res) => {
  return app(req, res);
};
