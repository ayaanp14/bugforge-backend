"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
class Even {
  // TODO: static [Symbol.hasInstance](n)
}
class Version {
  constructor(major, minor) { this.major = major; this.minor = minor; }
  // TODO: [Symbol.toPrimitive](hint): number -> major + minor / 100; string -> vMAJOR.MINOR; default -> the string form
  // TODO: get [Symbol.toStringTag]()
}
const numbers = lines[0].trim().split(/\s+/).map(Number);
const [major, minor] = lines[1].trim().split(".").map(Number);
// TODO
