"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
function userProblems(x) {
  if (x === null || typeof x !== "object" || Array.isArray(x)) return [`expected an object, got ${x === null ? "null" : Array.isArray(x) ? "array" : typeof x}`];
  const problems = [];
  if (typeof x.id !== "string") problems.push("id must be a string");
  if (typeof x.name !== "string" || x.name.trim() === "") problems.push("name must be a non-empty string");
  if (x.email !== undefined && typeof x.email !== "string") problems.push("email must be a string when present");
  return problems;
}
function isUser(x) /* : x is User */ { return userProblems(x).length === 0; }          // the guard's body IS the runtime check the type relies on
function assertIsUser(x) /* : asserts x is User */ {
  const problems = userProblems(x);
  if (problems.length) throw new TypeError(`not a User: ${problems.join(", ")}`);
}
function assert(cond, msg) /* : asserts cond */ { if (!cond) throw new Error(msg); }
const values = lines.map((l) => { try { return JSON.parse(l); } catch { return Symbol.for("invalid"); } });
for (const v of values) {
  if (v === Symbol.for("invalid")) { console.log("invalid JSON"); continue; }
  try { assertIsUser(v); console.log(`User ${v.name}${v.email ? ` <${v.email}>` : ""}`); }
  catch (err) { console.log(err.message); }
}
const users = values.filter(isUser);                 // with a guard, TypeScript types this as User[]
console.log(`users=${users.length} via filter: ${users.map((u) => u.id).join(",") || "-"}`);
try { assert(users.length > 0, "at least one user required"); console.log(`first user id=${users[0].id}`); }
catch (err) { console.log(`assertion failed: ${err.message}`); }
