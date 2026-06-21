import { defineConfig } from "drizzle-kit";

const url = (process.env.DATABASE_URI ?? process.env.DATABASE_URL)!;

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: { url },
});
