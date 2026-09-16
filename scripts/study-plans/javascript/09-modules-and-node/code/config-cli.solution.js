"use strict";
const input = require("fs").readFileSync(0, "utf8");
const DEFAULTS = { port: 3000, host: "localhost", debug: false, workers: 1 };
const ENV_KEYS = { port: "APP_PORT", host: "APP_HOST", debug: "APP_DEBUG", workers: "APP_WORKERS" };
const allLines = input.split("\n");
const argvLine = allLines[0] ?? "";                                  // line 1 is argv even when blank
const envLines = allLines.slice(1).filter((l) => l.includes("="));
const flags = {};
for (const a of argvLine.trim().split(/\s+/).filter(Boolean)) {
  if (!a.startsWith("--")) continue;
  const eq = a.indexOf("=");
  if (eq !== -1) flags[a.slice(2, eq)] = a.slice(eq + 1);
  else if (a.startsWith("--no-")) flags[a.slice(5)] = "false";
  else flags[a.slice(2)] = "true";
}
const env = Object.fromEntries(envLines.map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
function coerce(key, text) {
  const kind = typeof DEFAULTS[key];
  if (kind === "number") { const n = Number(text); if (!Number.isInteger(n)) throw new TypeError(`${key} must be an integer, got ${JSON.stringify(text)}`); return n; }
  if (kind === "boolean") { if (text === "true" || text === "1") return true; if (text === "false" || text === "0") return false; throw new TypeError(`${key} must be true/false, got ${JSON.stringify(text)}`); }
  return text;
}
const config = {}, sources = {}, errors = [];
for (const key of Object.keys(DEFAULTS)) {
  try {
    if (key in flags) { config[key] = coerce(key, flags[key]); sources[key] = "flag"; }
    else if (ENV_KEYS[key] in env) { config[key] = coerce(key, env[ENV_KEYS[key]]); sources[key] = "env"; }
    else { config[key] = DEFAULTS[key]; sources[key] = "default"; }
  } catch (err) { errors.push(err.message); }
}
if (Number.isInteger(config.port) && (config.port < 1 || config.port > 65535)) errors.push(`port must be 1-65535, got ${config.port}`);
if (Number.isInteger(config.workers) && config.workers < 1) errors.push(`workers must be at least 1, got ${config.workers}`);
if (errors.length) {
  console.log(`invalid: ${errors.join("; ")}`);
  console.log("wouldExitWith=1");
} else {
  console.log(`config=${JSON.stringify(config)}`);
  console.log(`sources: ${Object.entries(sources).map(([k, s]) => `${k}=${s}`).join(" ")}`);
  console.log("wouldExitWith=0");
}
