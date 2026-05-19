import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import pg from "pg";

const { Pool } = pg;

async function loadEnvFile() {
  try {
    const env = await fs.readFile(path.join(process.cwd(), ".env"), "utf8");
    for (const line of env.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!match || process.env[match[1]]) continue;
      process.env[match[1]] = match[2].replace(/^"|"$/g, "");
    }
  } catch {
    // Keep the original explicit error below when DATABASE_URL is absent.
  }
}

await loadEnvFile();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL não foi configurada. Copie .env.example para .env e ajuste a conexão.");
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: false } : undefined,
});

const root = process.cwd();
const schema = await fs.readFile(path.join(root, "database", "schema.sql"), "utf8");
const seed = await fs.readFile(path.join(root, "database", "seed.sql"), "utf8");

try {
  await pool.query(schema);
  await pool.query(seed);
  console.log("Banco PostgreSQL inicializado com schema e dados da Catarino Prime.");
} finally {
  await pool.end();
}
