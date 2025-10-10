import { defineConfig } from "cypress";
import "dotenv/config";

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      config.env = config.env || {};
      config.env.FRONTEND_URL = process.env.FRONTEND_URL;
      config.env.BACKEND_URL = process.env.BACKEND_URL;
      console.log("Extended config.env with process.env");
      return config;
    },
  },
});