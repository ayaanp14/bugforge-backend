"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
function assertNever(x) { throw new Error(`unhandled variant: ${JSON.stringify(x)}`); }
function area(shape) {
  switch (shape.kind) {
    case "circle": return Math.PI * shape.r ** 2;      // shape is the circle member here: r exists
    case "rect": return shape.w * shape.h;
    case "square": return shape.s ** 2;
    default: return assertNever(shape);
  }
}
function render(state) {
  switch (state.status) {
    case "loading": return "spinner";
    case "error": return `error banner: ${state.error}`;
    case "ready": return `list of ${state.data.length}`;
    default: return assertNever(state);
  }
}
for (const line of lines) {
  try {
    const value = JSON.parse(line);
    if ("kind" in value) console.log(`${value.kind}: area=${area(value).toFixed(2)}`);
    else if ("status" in value) console.log(`${value.status}: ${render(value)}`);
    else console.log("no discriminant: cannot dispatch");
  } catch (err) {
    console.log(`error: ${err.message}`);
  }
}
