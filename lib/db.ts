import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@/shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Serverless-optimized pool configuration
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  // Limit connections for serverless environments
  max: 10,
  // Close idle connections after 20 seconds (serverless functions timeout)
  idleTimeoutMillis: 20000,
  // Don't wait too long for a connection
  connectionTimeoutMillis: 10000,
});

// Handle pool errors to prevent crashes
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

export const db = drizzle(pool, { schema });
