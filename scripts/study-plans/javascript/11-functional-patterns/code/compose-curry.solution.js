"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const pipe = (...fns) => (x) => fns.reduce((acc, f) => f(acc), x);
const compose = (...fns) => (x) => fns.reduceRight((acc, f) => f(acc), x);
function curry(fn) {
  return function curried(...args) {
    return args.length >= fn.length ? fn(...args) : (...more) => curried(...args, ...more);
  };
}
const partial = (fn, ...preset) => (...later) => fn(...preset, ...later);
const [a, b, c] = lines[0].trim().split(/\s+/).map(Number);
const add3 = curry((x, y, z) => x + y + z);
console.log(`curry=${add3(a)(b)(c)},${add3(a, b)(c)},${add3(a)(b, c)},${add3(a, b, c)}`);
const inc = (x) => x + 1, double = (x) => x * 2;
console.log(`pipe(inc,double)(${a})=${pipe(inc, double)(a)} compose(inc,double)(${a})=${compose(inc, double)(a)}`);
const greet = (greeting, punctuation, name) => `${greeting}, ${name}${punctuation}`;
const hello = partial(greet, "Hello", "!");
console.log(`partial=${hello("Ada")} | ${partial(greet, "Hi")("?", "Bob")}`);
const slugify = pipe((s) => s.trim().toLowerCase(), (s) => s.replace(/[^a-z0-9]+/g, "-"), (s) => s.replace(/^-|-$/g, ""));
for (const line of lines.slice(1)) console.log(`slug=${slugify(line)}`);
const withDefault = curry((x, y = 0) => x + y);
console.log(`arityTrap: length=${((x, y = 0) => x + y).length} curried(5)=${typeof withDefault(5) === "function" ? "function" : withDefault(5)}`);
