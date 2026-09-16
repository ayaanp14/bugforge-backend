"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
class ConfigError extends Error { constructor(message, options) { super(message, options); this.name = "ConfigError"; } }
function loadConfig(text) {
  let raw;
  try { raw = JSON.parse(text); }
  catch (err) { throw new ConfigError("config is not valid JSON", { cause: err }); }
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) throw new ConfigError("config must be an object", { cause: new TypeError(`got ${raw === null ? "null" : Array.isArray(raw) ? "array" : typeof raw}`) });
  const check = (field, fn) => {
    try { return fn(raw[field]); }
    catch (err) { throw new ConfigError(`invalid config at ${field}`, { cause: err }); }
  };
  return {
    host: check("host", (v) => { if (typeof v !== "string" || v.trim() === "") throw new TypeError(`host must be a non-empty string, got ${JSON.stringify(v)}`); return v.trim(); }),
    port: check("port", (v) => { if (!Number.isInteger(v) || v < 1 || v > 65535) throw new RangeError(`port must be 1-65535, got ${JSON.stringify(v)}`); return v; }),
    retries: check("retries", (v) => { if (v === undefined) return 3; if (!Number.isInteger(v) || v < 0) throw new RangeError(`retries must be a non-negative integer, got ${JSON.stringify(v)}`); return v; }),
  };
}
function describe(err) {
  const parts = [];
  for (let e = err; e; e = e.cause) parts.push(e instanceof SyntaxError ? e.name : `${e.name}: ${e.message}`);
  return parts.join(" <- ");
}
for (const line of lines) {
  try {
    const cfg = loadConfig(line);
    console.log(`ok: host=${cfg.host} port=${cfg.port} retries=${cfg.retries}`);
  } catch (err) {
    console.log(`error chain: ${describe(err)}`);
  }
}
