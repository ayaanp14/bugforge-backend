"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
// State: { status: "idle" } | { status: "loading"; attempt } | { status: "success"; data } | { status: "failure"; error; attempt }
// Event: FETCH | RESOLVE <data> | REJECT <error> | RETRY | RESET
function assertNever(x) { throw new Error(`unhandled: ${JSON.stringify(x)}`); }
function transition(state, event) {
  // TODO: nested switch on state.status then event.type; return the same state (unchanged) for combinations that do not apply; assertNever for unknown event types
}
