"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
// State: { status: "idle" } | { status: "loading"; attempt } | { status: "success"; data } | { status: "failure"; error; attempt }
// Event: FETCH | RESOLVE <data> | REJECT <error> | RETRY | RESET
function assertNever(x) { throw new Error(`unhandled: ${JSON.stringify(x)}`); }
function transition(state, event) {
  switch (event.type) {
    case "FETCH": return state.status === "idle" ? { status: "loading", attempt: 1 } : state;
    case "RESOLVE": return state.status === "loading" ? { status: "success", data: event.data } : state;
    case "REJECT": return state.status === "loading" ? { status: "failure", error: event.error, attempt: state.attempt } : state;
    case "RETRY": return state.status === "failure" ? { status: "loading", attempt: state.attempt + 1 } : state;
    case "RESET": return { status: "idle" };
    default: return assertNever(event);          // an event the union does not know
  }
}
const describe = (s) => s.status === "idle" ? "idle" : s.status === "loading" ? `loading(attempt ${s.attempt})` : s.status === "success" ? `success(${JSON.stringify(s.data)})` : `failure(${s.error}, attempt ${s.attempt})`;
let state = { status: "idle" };
for (const line of lines) {
  const [type, ...rest] = line.trim().split(/\s+/);
  const event = type === "RESOLVE" ? { type, data: rest.join(" ") } : type === "REJECT" ? { type, error: rest.join(" ") } : { type };
  try {
    const next = transition(state, event);
    console.log(`${type}: ${describe(state)} -> ${describe(next)}${next === state ? " (ignored)" : ""}`);
    state = next;
  } catch (err) {
    console.log(`${type}: ${err.message}`);
  }
}
