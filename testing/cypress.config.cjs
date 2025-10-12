const path = require("path");
require("dotenv").config();

module.exports = {
  e2e: {
    baseUrl: process.env.BACKEND_URL || "http://localhost:3000",
    specPattern: "cypress/e2e/**/*.cy.{ts,js}",
    supportFile: "cypress/support/e2e.ts",
    video: false,
    setupNodeEvents(on, config) {
      config.env = config.env || {};
      config.env.FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
      config.env.BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";
      console.log("Loaded environment variables into Cypress config");
      return config;
    },
  },
};
