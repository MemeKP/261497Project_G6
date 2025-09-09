import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./db/schema.ts",
  out: "./db/migration",
  dbCredentials: {
    url: "./db.sqlite",
  },
  verbose: true,
  strict: true,
});
