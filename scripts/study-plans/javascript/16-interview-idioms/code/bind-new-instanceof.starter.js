"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
// Implement myCall, myApply, myBind (partial application AND `new` support), myNew (honour an object returned by the constructor) and myInstanceOf (walk the prototype chain).
// Input: check names, or `all`. Checks: call apply bind-partial bind-this bind-new new-plain new-returns-object instanceof
Function.prototype.myCall = function (thisArg, ...args) { /* TODO */ };
Function.prototype.myApply = function (thisArg, args = []) { /* TODO */ };
Function.prototype.myBind = function (thisArg, ...preset) { /* TODO */ };
function myNew(Ctor, ...args) { /* TODO */ }
function myInstanceOf(value, Ctor) { /* TODO */ }
