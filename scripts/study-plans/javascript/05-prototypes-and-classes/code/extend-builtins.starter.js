"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
class DefaultMap extends Map {
  // TODO: constructor(makeDefault); get(key) creates the default when missing
}
class Stack extends Array {
  // TODO: peek()
}
class HttpError extends Error {
  // TODO: constructor(status, message) — set name and status
}
const words = lines[0].trim().split(/\s+/);
const numbers = lines[1].trim().split(/\s+/).map(Number);
const [status, ...msg] = lines[2].trim().split(/\s+/);
// TODO
