"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
class Temperature {
  #celsius = 0;
  // TODO: get/set celsius, get/set fahrenheit, get kelvin; setters reject values below -273.15 with RangeError("below absolute zero")
}
const t = new Temperature();
for (const line of lines) {
  const [cmd, value] = line.trim().split(/\s+/);
  // TODO: c <v> | f <v> | show | inspect
}
