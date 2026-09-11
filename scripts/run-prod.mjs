/**
 * Runs any script against the PRODUCTION database instead of local dev.
 *
 *   node scripts/run-prod.mjs scripts/seed-catalog.ts --seed --resume
 *
 * Reads DATABASE_URL from .env.production.local (gitignored) and puts it in
 * the child's environment. `dotenv/config` never overrides a variable that is
 * already set, so src/lib/prisma.ts picks this up over backend/.env.
 */
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";

const text = readFileSync(new URL("../.env.production.local", import.meta.url), "utf8");
const env = { ...process.env };
for (const line of text.split(/\r?\n/)) {
  const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
if (!env["DATABASE_URL"]) throw new Error(".env.production.local has no DATABASE_URL");
console.log(`[run-prod] target: ${new URL(env["DATABASE_URL"]).host}`);

const child = spawn("npx", ["tsx", ...process.argv.slice(2)], { stdio: "inherit", env, shell: true });
child.on("exit", (code) => process.exit(code ?? 1));
