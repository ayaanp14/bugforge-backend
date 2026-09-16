"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
class TransientError extends Error { constructor(m) { super(m); this.name = "TransientError"; this.transient = true; } }
class PermanentError extends Error { constructor(m) { super(m); this.name = "PermanentError"; } }
function withRetry(fn, { attempts, isTransient }) {
  // TODO
}
const [attempts, failures, kind] = lines[0].trim().split(/\s+/);
// TODO: fn(i) fails for i <= failures with the given kind, then returns `ok on attempt i`
