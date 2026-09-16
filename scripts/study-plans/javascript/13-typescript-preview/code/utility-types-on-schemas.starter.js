"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
// A schema is { key: type } with a trailing ? for optional and a leading `readonly ` for readonly.
const schema = JSON.parse(lines[0]);
const print = (s) => `{ ${Object.entries(s).map(([k, t]) => `${k}: ${t}`).join("; ")} }`;
// TODO: Partial | Required | Readonly | Pick k k | Omit k k | Record k v | keyof — chained with |
