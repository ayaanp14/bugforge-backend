"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l !== "");
function createUser({ name = "anon", role = "member", tags = [] } = {}) {
  // TODO
}
for (const line of lines) {
  const opts = line.trim() === "-" ? undefined : JSON.parse(line);
  console.log(createUser(opts));
}
