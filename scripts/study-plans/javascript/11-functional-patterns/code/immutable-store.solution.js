"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
let nextId = 1;
function reducer(state, action) {
  switch (action.type) {
    case "add": return { ...state, todos: [...state.todos, { id: nextId++, text: action.text, done: false }] };
    case "toggle": return { ...state, todos: state.todos.map((t) => (t.id === action.id ? { ...t, done: !t.done } : t)) };
    case "remove": return { ...state, todos: state.todos.filter((t) => t.id !== action.id) };
    case "rename": return { ...state, title: action.title };
    default: return state;
  }
}
let selectorRuns = 0;
const completedCount = (() => { let lastTodos, lastValue; return (state) => {
  if (state.todos !== lastTodos) { selectorRuns++; lastTodos = state.todos; lastValue = state.todos.filter((t) => t.done).length; }   // recompute only when the slice changed
  return lastValue;
}; })();
const history = [{ title: "list", todos: [] }];
for (const line of lines) {
  const [cmd, ...rest] = line.trim().split(/\s+/);
  const state = history.at(-1);
  if (cmd === "undo") { if (history.length > 1) history.pop(); console.log(`undo -> ${JSON.stringify(history.at(-1).todos.map((t) => t.text))}`); continue; }
  const action = cmd === "add" ? { type: "add", text: rest.join(" ") } : cmd === "rename" ? { type: "rename", title: rest.join(" ") } : { type: cmd, id: Number(rest[0]) };
  const next = reducer(state, action);
  history.push(next);
  const untouched = state.todos.filter((t) => next.todos.includes(t)).length;
  console.log(`${line.trim()}: todos=${JSON.stringify(next.todos.map((t) => `${t.id}:${t.text}${t.done ? "*" : ""}`))} todosChanged=${next.todos !== state.todos} sharedItems=${untouched} completed=${completedCount(next)} selectorRuns=${selectorRuns}`);
}
console.log(`history=${history.length} firstStateStillEmpty=${history[0].todos.length === 0}`);
