"use strict";
const input = require("fs").readFileSync(0, "utf8");
const graph = JSON.parse(input);      // { entry, modules: { name: { exports: [...], imports: { dep: [names] }, sideEffects: bool } } }
// TODO: reachable modules from the entry; used exports = imported names (+ every export of the entry); side-effect modules stay even if nothing is used
