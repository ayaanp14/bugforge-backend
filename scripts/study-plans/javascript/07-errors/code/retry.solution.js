"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
class TransientError extends Error { constructor(m) { super(m); this.name = "TransientError"; this.transient = true; } }
class PermanentError extends Error { constructor(m) { super(m); this.name = "PermanentError"; } }
function withRetry(fn, { attempts, isTransient }) {
  let last;
  for (let i = 1; i <= attempts; i++) {
    try {
      const value = fn(i);
      console.log(`attempt ${i}: ok`);
      return value;
    } catch (err) {
      if (!isTransient(err)) { console.log(`attempt ${i}: failed (permanent) - not retrying`); throw err; }
      console.log(`attempt ${i}: failed (transient)`);
      last = err;
    }
  }
  throw new Error(`gave up after ${attempts} attempts`, { cause: last });
}
const [attempts, failures, kind] = lines[0].trim().split(/\s+/);
const flaky = (i) => {
  if (i <= Number(failures)) {
    if (kind === "permanent") throw new PermanentError(`attempt ${i} rejected`);
    throw new TransientError(`attempt ${i} timed out`);
  }
  return `ok on attempt ${i}`;
};
try {
  console.log(`result=${withRetry(flaky, { attempts: Number(attempts), isTransient: (e) => e.transient === true })}`);
} catch (err) {
  const chain = [];
  for (let e = err; e; e = e.cause) chain.push(`${e.name}: ${e.message}`);
  console.log(`failed: ${chain.join(" <- ")}`);
}
