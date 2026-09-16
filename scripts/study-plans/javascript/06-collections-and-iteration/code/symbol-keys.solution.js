"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const stringKeys = lines[0].trim().split(/\s+/);
const symbolNames = lines[1].trim().split(/\s+/);
const obj = {};
stringKeys.forEach((k, i) => { obj[k] = i; });
const symbols = symbolNames.map((n) => Symbol(n));
symbols.forEach((s, i) => { obj[s] = `hidden-${i}`; });
console.log(`keys=${Object.keys(obj).join(",")} json=${JSON.stringify(obj)}`);
console.log(`symbols=${Object.getOwnPropertySymbols(obj).length} descriptions=${Object.getOwnPropertySymbols(obj).map((s) => s.description).join(",")}`);
console.log(`ownKeys=${Reflect.ownKeys(obj).length} spreadKeepsSymbols=${Object.getOwnPropertySymbols({ ...obj }).length === symbols.length}`);
const name = symbolNames[0];
console.log(`plainEqual=${Symbol(name) === Symbol(name)} forEqual=${Symbol.for(name) === Symbol.for(name)} keyFor=${Symbol.keyFor(Symbol.for(name))} keyForPlain=${Symbol.keyFor(symbols[0])}`);
let templated;
try { templated = `${symbols[0]}`; } catch (e) { templated = e.constructor.name; }
console.log(`template=${templated} string=${String(symbols[0])} typeof=${typeof symbols[0]}`);
