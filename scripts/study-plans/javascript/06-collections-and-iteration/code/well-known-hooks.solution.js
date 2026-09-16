"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
class Even {
  static [Symbol.hasInstance](n) { return Number.isInteger(n) && n % 2 === 0; }
}
class Version {
  constructor(major, minor) { this.major = major; this.minor = minor; }
  [Symbol.toPrimitive](hint) {
    if (hint === "number") return this.major + this.minor / 100;
    return `v${this.major}.${this.minor}`;      // string and default
  }
  get [Symbol.toStringTag]() { return "Version"; }
}
const numbers = lines[0].trim().split(/\s+/).map(Number);
const [major, minor] = lines[1].trim().split(".").map(Number);
console.log(`even=${numbers.filter((n) => n instanceof Even).join(",")} odd=${numbers.filter((n) => !(n instanceof Even)).join(",")}`);
const v = new Version(major, minor);
console.log(`string=${v} number=${+v} default=${v + ""} compare=${v > 1} tag=${Object.prototype.toString.call(v)}`);
const spreadable = { length: 2, 0: "x", 1: "y", [Symbol.isConcatSpreadable]: true };
const notSpreadable = { length: 2, 0: "x", 1: "y" };
console.log(`concatSpreadable=${JSON.stringify([1].concat(spreadable))} concatPlain=${JSON.stringify([1].concat(notSpreadable))}`);
