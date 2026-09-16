"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const heap = new Map();    // id -> { size, refs: Set }
const roots = new Set();
// TODO: alloc <id> <size> | ref <from|root> <to> | unref <from|root> <to> | gc | retainers <id>
