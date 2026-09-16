"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
class Temperature {
  #celsius = 0;
  get celsius() { return this.#celsius; }
  set celsius(v) {
    if (v < -273.15) throw new RangeError("below absolute zero");
    this.#celsius = v;
  }
  get fahrenheit() { return this.#celsius * 9 / 5 + 32; }
  set fahrenheit(v) { this.celsius = (v - 32) * 5 / 9; }   // reuse the validating setter
  get kelvin() { return this.#celsius + 273.15; }
}
const t = new Temperature();
for (const line of lines) {
  const [cmd, value] = line.trim().split(/\s+/);
  try {
    if (cmd === "c") t.celsius = Number(value);
    else if (cmd === "f") t.fahrenheit = Number(value);
    else if (cmd === "show") console.log(`C=${t.celsius.toFixed(1)} F=${t.fahrenheit.toFixed(1)} K=${t.kelvin.toFixed(2)}`);
    else if (cmd === "inspect") console.log(`keys=${JSON.stringify(Object.keys(t))} json=${JSON.stringify(t)} protoHasCelsius=${Object.hasOwn(Temperature.prototype, "celsius")}`);
  } catch (e) {
    console.log(`error: ${e.message}`);
  }
}
