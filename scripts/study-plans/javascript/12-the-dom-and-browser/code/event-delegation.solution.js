"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
// The container holds items; a click lands on a path like `item3.icon` (the icon span inside item 3) or `item3` or `gap`.
const items = new Map();   // id -> { id, action }
const handled = new Map();
let listenerCount = 0;
const listeners = [];
const addListener = (fn, opts = {}) => { listeners.push({ fn, ...opts }); listenerCount++; };
const closestItem = (targetPath) => { const id = targetPath.split(".")[0]; return items.get(id) ?? null; };   // e.target.closest('[data-id]')
addListener((targetPath) => {
  const item = closestItem(targetPath);
  if (!item) { console.log(`click ${targetPath}: ignored (no item)`); return; }
  const action = item.action ?? "select";
  handled.set(action, (handled.get(action) ?? 0) + 1);
  console.log(`click ${targetPath}: ${action} on ${item.id}`);
});
addListener(() => console.log("first click on the container!"), { once: true });
function dispatchClick(targetPath) {
  for (const l of [...listeners]) {
    l.fn(targetPath);
    if (l.once) listeners.splice(listeners.indexOf(l), 1);
  }
}
for (const line of lines) {
  const [cmd, a, b] = line.trim().split(/\s+/);
  if (cmd === "add") items.set(a, { id: a, action: b });
  else if (cmd === "remove") items.delete(a);
  else if (cmd === "click") dispatchClick(a);
}
console.log(`listenersAdded=${listenerCount} active=${listeners.length} items=${items.size} handled=${JSON.stringify(Object.fromEntries([...handled].sort()))}`);
