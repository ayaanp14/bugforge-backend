"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
// alloc <id> <size> | ref <from|root> <to> | unref <from|root> <to> | scavenge | major | stats
// young objects survive two scavenges then get promoted to old space; a scavenge treats every old-space object as a root
// (the remembered set — it never looks inside old space); a major collection marks from the real roots over both spaces
const objects = new Map();   // id -> { size, refs: Set, gen: "young"|"old", age }
const roots = new Set();
// TODO
