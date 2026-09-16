"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
// Each line: `<name>: <property> <property> ...` — the order properties are added; `-prop` deletes it (dictionary mode).
// A `site <name> <obj> <obj> ...` line is a property-access site that has seen those objects.
const transitions = new Map();     // "S0|x" -> shape id
let nextShape = 1;
// TODO: assign every object a shape by walking the transition tree from S0; a delete gives a unique dictionary shape; classify sites
