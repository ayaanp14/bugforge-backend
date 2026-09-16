"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const Ok = (value) => ({ ok: true, value, map: (f) => Ok(f(value)), mapErr: () => Ok(value), flatMap: (f) => f(value), getOrElse: () => value, match: ({ ok }) => ok(value) });
const Err = (error) => ({ ok: false, error, map: () => Err(error), mapErr: (f) => Err(f(error)), flatMap: () => Err(error), getOrElse: (fb) => fb, match: ({ err }) => err(error) });
const attempt = (fn) => { try { return Ok(fn()); } catch (e) { return Err(e); } };
const parseJson = (text) => attempt(() => JSON.parse(text)).mapErr(() => ["config is not valid JSON"]);
const requireObject = (v) => (v !== null && typeof v === "object" && !Array.isArray(v) ? Ok(v) : Err([`config must be an object, got ${v === null ? "null" : Array.isArray(v) ? "array" : typeof v}`]));
const fields = {
  host: (v) => (typeof v === "string" && v.trim() ? Ok(v.trim()) : Err(`host must be a non-empty string, got ${JSON.stringify(v)}`)),
  port: (v) => (Number.isInteger(v) && v >= 1 && v <= 65535 ? Ok(v) : Err(`port must be 1-65535, got ${JSON.stringify(v)}`)),
  retries: (v) => (v === undefined ? Ok(3) : Number.isInteger(v) && v >= 0 ? Ok(v) : Err(`retries must be a non-negative integer, got ${JSON.stringify(v)}`)),
};
const validateFields = (raw) => {
  const results = Object.entries(fields).map(([name, check]) => [name, check(raw[name])]);
  const errors = results.filter(([, r]) => !r.ok).map(([name, r]) => `${name}: ${r.error}`);   // every failure, not just the first
  return errors.length ? Err(errors) : Ok(Object.fromEntries(results.map(([name, r]) => [name, r.value])));
};
const loadConfig = (text) => parseJson(text).flatMap(requireObject).flatMap(validateFields);
for (const line of lines) {
  console.log(loadConfig(line).match({
    ok: (cfg) => `ok: host=${cfg.host} port=${cfg.port} retries=${cfg.retries}`,
    err: (errors) => `errors(${errors.length}): ${errors.join("; ")}`,
  }));
}
