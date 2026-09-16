"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
// Union members: string number boolean null undefined Date string[] {kind:"a"} {kind:"b"}
const members = lines[0].trim().split(/\s+/);
function describe(m) {
  if (m === "null") return { typeof: "object", isNull: true, isDate: false, isArray: false, kind: null, canBeFalsy: true, alwaysFalsy: true };
  if (m === "undefined") return { typeof: "undefined", isNull: false, isDate: false, isArray: false, kind: null, canBeFalsy: true, alwaysFalsy: true };
  if (m === "string" || m === "number" || m === "boolean") return { typeof: m, isNull: false, isDate: false, isArray: false, kind: null, canBeFalsy: true, alwaysFalsy: false };
  if (m === "Date") return { typeof: "object", isNull: false, isDate: true, isArray: false, kind: null, canBeFalsy: false, alwaysFalsy: false };
  if (m.endsWith("[]")) return { typeof: "object", isNull: false, isDate: false, isArray: true, kind: null, canBeFalsy: false, alwaysFalsy: false };
  const kind = /kind:"([^"]+)"/.exec(m)?.[1] ?? null;
  return { typeof: "object", isNull: false, isDate: false, isArray: false, kind, canBeFalsy: false, alwaysFalsy: false };
}
function narrow(members, check) {
  const yes = [], no = [];
  for (const m of members) {
    const d = describe(m);
    let result;                              // true = definitely passes, false = definitely fails, "both" = could go either way
    const [op, ...rest] = check.split(/\s+/);
    const arg = op === "kind" ? rest[1] : rest[0];       // `kind === a` carries the operator in the middle
    if (op === "typeof") result = d.typeof === arg;
    else if (op === "instanceof") result = d.isDate;
    else if (op === "===") result = d.isNull;
    else if (op === "truthy") result = d.alwaysFalsy ? false : d.canBeFalsy ? "both" : true;
    else if (op === "Array.isArray") result = d.isArray;
    else if (op === "in") result = d.kind !== null;
    else if (op === "kind") result = d.kind === null ? false : d.kind === arg;
    else throw new SyntaxError(`unknown check '${check}'`);
    if (result === true || result === "both") yes.push(m);
    if (result === false || result === "both") no.push(m);     // a falsy-capable primitive stays in both branches
  }
  return { yes, no };
}
const show = (ms) => ms.join(" | ") || "never";
for (const line of lines.slice(1)) console.log(`${line.trim()} -> true: ${show(narrow(members, line.trim()).yes)} | false: ${show(narrow(members, line.trim()).no)}`);
