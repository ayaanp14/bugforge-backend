"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
// Nodes are declared as paths: `document > body > ul#list > li#a > button#b`
const nodes = new Map();      // id -> { id, parent, listeners: [] }
function declare(pathLine) {
  // TODO
}
function dispatch(targetId, type) {
  // TODO: capture (root -> parent of target), target (capture listeners first, then bubble), bubble (parent -> root); stopPropagation, stopImmediatePropagation, preventDefault
}
for (const line of lines) {
  // TODO: path lines contain '>' ; `on <node> <type> <capture|bubble> <label> [stop|stopImmediate|prevent]` ; `dispatch <node> <type>`
}
