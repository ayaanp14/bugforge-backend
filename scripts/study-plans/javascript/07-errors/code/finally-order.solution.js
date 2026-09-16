"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
function run(mode, log) {
  try {
    log.push("try");
    if (mode === "throw" || mode === "rethrow") throw new Error("boom");
    return "from try";
  } catch (err) {
    log.push(`catch ${err.message}`);
    if (mode === "rethrow") throw err;
    return "from catch";
  } finally {
    log.push("finally");
    if (mode === "override") return "from finally";   // overrides whatever try/catch decided — a bad habit shown on purpose
  }
}
for (const mode of lines.map((l) => l.trim())) {
  const log = [];
  let outcome;
  try {
    outcome = run(mode, log);
  } catch (err) {
    outcome = `outer caught ${err.message}`;
  }
  console.log(`mode=${mode}: ${log.join(",")} -> ${outcome}`);
}
