"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const routeLines = lines.filter((l) => l.startsWith("route "));
const commands = lines.filter((l) => !l.startsWith("route "));
// TODO: compile `/users/:id` and `/files/*` into matchers; a history stack with index; push | replace | back | forward; print the match on every navigation
