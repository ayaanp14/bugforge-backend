"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const assert = require("node:assert/strict");
function validateUser(u) {
  const errors = [];
  if (u === null || typeof u !== "object" || Array.isArray(u)) throw new TypeError(`user must be an object, got ${u === null ? "null" : Array.isArray(u) ? "array" : typeof u}`);
  if (typeof u.name !== "string" || u.name.trim() === "") errors.push("name: required");
  if (!Number.isInteger(u.age) || u.age < 0 || u.age > 150) errors.push(`age: must be an integer 0-150, got ${JSON.stringify(u.age)}`);
  if (typeof u.email !== "string" || !u.email.includes("@")) errors.push("email: must contain @");
  if (errors.length) throw new Error(errors.join("; "));
  return { name: u.name.trim(), age: u.age, email: u.email.toLowerCase() };
}
for (const line of lines) {
  const text = line.trim();
  if (text.startsWith("assert ")) {
    const [, a, b] = text.split(/\s+/);
    try { assert.equal(Number(a), Number(b)); console.log(`assert ${a} ${b}: passed`); }
    catch (err) { console.log(`${err.name} code=${err.code} actual=${err.actual} expected=${err.expected}`); }
    continue;
  }
  try {
    console.log(`ok: ${JSON.stringify(validateUser(JSON.parse(text)))}`);
  } catch (err) {
    console.log(`${err instanceof TypeError ? "type error" : "invalid"}: ${err.message}`);
  }
}
