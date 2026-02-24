import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.warn("DATABASE_URL not set; vote and comment count features will be disabled.");
}

export const sql = connectionString ? neon(connectionString) : null;
