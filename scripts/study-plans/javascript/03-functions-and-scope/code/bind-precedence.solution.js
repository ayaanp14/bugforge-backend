"use strict";
const tokens = require("fs").readFileSync(0, "utf8").trim().split(/\s+/);
const [a, b, c] = tokens.slice(1, 4).map((name) => ({ name }));
function who() { return this === undefined ? "undefined" : this.name; }
const boundA = who.bind(a);
console.log(`bindTwice=${boundA.bind(b)()}`);            // the first bind wins
console.log(`callOnBound=${boundA.call(c)}`);            // call cannot override a bound this
const arrow = () => (this === undefined ? "undefined" : this.name);
console.log(`arrowIgnoresBind=${arrow.bind(a)()}`);      // arrows have no this of their own
function Named(name) { this.name = name; }
const BoundNamed = Named.bind(b);
console.log(`newOverridesBind=${new BoundNamed(c.name).name}`);   // new beats bind: this is the new object
