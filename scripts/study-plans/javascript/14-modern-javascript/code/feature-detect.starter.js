"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const checks = {
  // TODO: name -> { kind: "syntax" | "builtin", present: () => boolean }; detect syntax with new Function(source) in try/catch
};
for (const name of lines.map((l) => l.trim())) {
  // TODO: print `<name>: native` or `<name>: missing -> transpile` (syntax) / `<name>: missing -> polyfill` (builtin) / `<name>: unknown feature`
}
