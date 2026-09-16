"use strict";
const tokens = require("fs").readFileSync(0, "utf8").trim().split(/\s+/);
const [a, b, c] = tokens.slice(1, 4).map((name) => ({ name }));
function who() { return this === undefined ? "undefined" : this.name; }
// TODO: print bindTwice, callOnBound, arrowIgnoresBind, newOverridesBind
