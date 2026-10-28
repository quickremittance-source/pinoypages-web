// Apply db/migrations/*.sql in order. Usage: DATABASE_URL=... node scripts/db-migrate.mjs
// Refuses to run against Production unless ALLOW_PROD_MIGRATE=yes (owner approval required).
import { neon } from "@neondatabase/serverless";
import { readdir, readFile } from "node:fs/promises";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL not set");
if (process.env.VERCEL_ENV === "production" && process.env.ALLOW_PROD_MIGRATE !== "yes")
  throw new Error("Refusing to migrate production without ALLOW_PROD_MIGRATE=yes");
const sql = neon(url);
await sql.query(
  "create table if not exists schema_migrations (name text primary key, applied_at timestamptz default now())",
);
const done = new Set((await sql.query("select name from schema_migrations")).map((r) => r.name));
for (const f of (await readdir("db/migrations")).filter((x) => x.endsWith(".sql")).sort()) {
  if (done.has(f)) continue;
  const text = await readFile(`db/migrations/${f}`, "utf8");
  const stmts = text
    .split(/;\s*\n/)
    .map((s) => s.replace(/--.*$/gm, "").trim())
    .filter(Boolean);
  await sql.transaction(
    stmts.map((s) => sql.query(s)).concat(sql.query("insert into schema_migrations (name) values ($1)", [f])),
  );
  console.log("applied", f);
}
console.log("migrations up to date");
