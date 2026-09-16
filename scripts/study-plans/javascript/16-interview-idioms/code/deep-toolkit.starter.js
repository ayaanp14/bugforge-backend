"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const evaluate = (src) => new Function(`return (${src});`)();   // the inputs are trusted JavaScript expressions
// Commands (TAP output): equal <true|false> ||| <a> ||| <b>   |   clone <expr>   |   flatten <expr>
function deepEqual(a, b, seen = new Map()) { /* TODO: Object.is, prototypes, Date, RegExp, Map, Set, arrays, own keys, cycles */ }
function deepClone(value, seen = new WeakMap()) { /* TODO: primitives, Date, RegExp, Map, Set, arrays, objects keeping their prototype; cycles and shared references via seen */ }
function flatten(obj, prefix = "", out = {}) { /* TODO: dotted keys; arrays and empty objects are leaves */ }
function unflatten(flat) { /* TODO */ }
