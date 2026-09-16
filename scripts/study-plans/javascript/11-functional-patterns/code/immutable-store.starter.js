"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
function reducer(state, action) {
  // TODO: add <text> | toggle <id> | remove <id> — return a NEW state, never mutate
}
// TODO: history for undo, memoized selector completedCount keyed by state.todos identity
