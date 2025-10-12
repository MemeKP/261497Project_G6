import "dotenv/config";
import { defineConfig } from "drizzle-kit";
// import { connectionString } from "@db/utils.js";
import { connectionString } from "./db/utils.ts";

export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema.ts",
  out: "./db/migration",
  dbCredentials: {
    url: connectionString,
  },
  verbose: true,
  strict: true,
});