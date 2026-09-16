"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const [numbersLine, textLine, passwordLine, ...checks] = lines;
console.log(`grouped=${numbersLine.trim().split(/\s+/).map((n) => n.replace(/\B(?=(\d{3})+(?!\d))/g, ",")).join(" ")}`);
const letters = (textLine.match(/\p{L}/gu) ?? []).length, asciiWord = (textLine.match(/\w/g) ?? []).length, digits = (textLine.match(/\p{Nd}/gu) ?? []).length;
console.log(`letters=${letters} asciiWordChars=${asciiWord} digits=${digits} words=${(textLine.match(/[\p{L}\p{M}]+/gu) ?? []).length}`);
const strong = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
console.log(`passwords=${passwordLine.trim().split(/\s+/).map((p) => `${p}:${strong.test(p)}`).join(" ")}`);
const validators = {
  hex: /^#(?:[0-9a-f]{3}){1,2}$/i,
  ipv4: /^(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)$/,
  date: /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
  slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
};
for (const line of checks) {
  const [kind, value] = line.trim().split(/\s+/);
  console.log(`${kind} ${value}: ${validators[kind].test(value)}`);
}
