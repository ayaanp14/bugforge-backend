"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
function isUser(x) /* : x is User */ {
  // TODO: object with string id, string name, optional string email — and collect reasons in isUser.reasons for the report
}
function assertIsUser(x) /* : asserts x is User */ {
  // TODO: throw TypeError(`not a User: <reasons>`)
}
function assert(cond, msg) /* : asserts cond */ { if (!cond) throw new Error(msg); }
// TODO: for each JSON line report; then filter with the guard
