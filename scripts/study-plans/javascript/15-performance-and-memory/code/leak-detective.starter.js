"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
// Each line: `snapshot <n>: Class=count Class=count ...`
// TODO: classes that grow strictly at every snapshot are suspects; report growth per snapshot and rank by total growth
