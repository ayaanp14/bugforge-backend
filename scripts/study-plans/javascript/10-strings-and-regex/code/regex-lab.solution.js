"use strict";
const input = require("fs").readFileSync(0, "utf8");
const [pattern, flagsLine, ...subjects] = input.split("\n").filter((l) => l !== "");
const flags = flagsLine.trim() === "-" ? "" : flagsLine.trim();
const re = new RegExp(pattern, flags);
console.log(`regex=${re} global=${re.global} unicode=${re.unicode}`);
for (const subject of subjects) {
  const fresh = new RegExp(pattern, flags);        // a fresh object so lastIndex never leaks between subjects
  const m = subject.match(fresh);
  console.log(`${JSON.stringify(subject)}: test=${new RegExp(pattern, flags).test(subject)} match=${m === null ? "null" : JSON.stringify([...m])}${m && m.groups ? ` groups=${JSON.stringify(m.groups)}` : ""}`);
}
if (subjects.length) {
  const first = subjects[0];
  const results = [], indices = [];
  for (let k = 0; k < 3; k++) { results.push(re.test(first)); indices.push(re.lastIndex); }   // the same object, three times
  console.log(`sameRegexThrice=${results.join(",")} lastIndex=${indices.join(",")}`);
}
