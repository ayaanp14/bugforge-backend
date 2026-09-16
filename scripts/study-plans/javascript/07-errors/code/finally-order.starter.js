"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
function run(mode) {
  const log = [];
  // TODO: try { log try; ok -> return; throw/rethrow -> throw new Error("boom"); override -> return }
  //       catch { log catch <msg>; rethrow -> throw err; else return "from catch" }
  //       finally { log finally; override -> return "from finally" }
  return { log, result: undefined };
}
for (const mode of lines.map((l) => l.trim())) {
  // TODO: print `mode=<mode>: <log joined by ,> -> <result>` or `... -> outer caught <message>`
}
