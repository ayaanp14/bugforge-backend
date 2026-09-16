"use strict";
const input = require("fs").readFileSync(0, "utf8");
const [mode, ...code] = input.split("\n");
const rules = [
  // TODO: [name, regex, message, fix?] — no-var, eqeqeq, no-console (allow console.error), no-debugger, max-len 80, no-trailing-spaces
];
// TODO: `check` prints `line:col rule message` per finding and a summary; `fix` applies fixes then prints the code and the remaining count
