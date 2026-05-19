import pg from "pg";

const { Pool } = pg;

function createPool() {
  if (!process.env.DATABASE_URL) return null;

  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: false } : undefined,
  });
}

const globalForPg = globalThis;

export const pool = globalForPg.__catarinoPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  globalForPg.__catarinoPool = pool;
}

export function hasDatabase() {
  return Boolean(pool);
}

export async function query(text, params = []) {
  if (!pool) {
    throw new Error("DATABASE_URL não configurada.");
  }

  return pool.query(text, params);
}
