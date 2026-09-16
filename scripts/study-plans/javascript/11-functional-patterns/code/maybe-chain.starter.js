"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const Some = (value) => ({ isSome: true, map: (f) => Some(f(value)), flatMap: (f) => f(value), filter: (p) => (p(value) ? Some(value) : None), getOrElse: () => value, toString: () => `Some(${JSON.stringify(value)})` });
const None = { isSome: false, map: () => None, flatMap: () => None, filter: () => None, getOrElse: (fb) => fb, toString: () => "None" };
const fromNullable = (v) => (v === null || v === undefined ? None : Some(v));
const users = JSON.parse(lines[0]);
// TODO: for each id on the following lines, find the user, reach address.city upper-cased, filter cities longer than 3; compare with ?. and ??
