"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const sleep = (ms, value) => new Promise((resolve) => setTimeout(resolve, ms, value));
const jobs = new Map(lines.map((l) => {
  const [name, ms, deps] = l.trim().split(/\s+/);
  return [name, { name, ms: Number(ms), deps: deps === "-" ? [] : deps.split(",") }];
}));
// TODO: promiseFor(name) memoised: wait for every dependency, then run; record completion order and virtual finish time
