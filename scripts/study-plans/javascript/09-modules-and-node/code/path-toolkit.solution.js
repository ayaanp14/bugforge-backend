"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const path = require("node:path").posix;   // posix on purpose: the same answers on every OS
const CWD = "/home/user/project";
for (const line of lines) {
  const [cmd, ...args] = line.trim().split(/\s+/);
  let out;
  if (cmd === "join") out = path.join(...args);
  else if (cmd === "resolve") out = path.resolve(CWD, ...args);
  else if (cmd === "normalize") out = path.normalize(args[0]);
  else if (cmd === "basename") out = path.basename(args[0], args[1]);
  else if (cmd === "extname") out = JSON.stringify(path.extname(args[0]));
  else if (cmd === "dirname") out = path.dirname(args[0]);
  else if (cmd === "relative") out = path.relative(args[0], args[1]);
  else if (cmd === "parse") out = JSON.stringify(path.parse(args[0]));
  console.log(`${cmd} ${args.join(" ")} => ${out}`);
}
