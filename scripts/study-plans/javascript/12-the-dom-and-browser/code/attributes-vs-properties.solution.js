"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
// A model of an <input>: attributes (the markup) and properties (live state), with the dirty-value flag the real DOM uses.
const el = { attributes: new Map(), value: "", dirty: false, checked: false, className: "", dataset: {} };
const camel = (s) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
function setAttribute(name, value) {
  el.attributes.set(name, value);
  if (name === "value" && !el.dirty) el.value = value;          // the attribute drives the property only until the user edits
  if (name === "class") el.className = value;
  if (name.startsWith("data-")) el.dataset[camel(name.slice(5))] = value;
}
const classList = {
  get list() { return el.className.split(/\s+/).filter(Boolean); },
  sync(list) { el.className = list.join(" "); el.attributes.set("class", el.className); },
  add(c) { const l = this.list; if (!l.includes(c)) l.push(c); this.sync(l); },
  remove(c) { this.sync(this.list.filter((x) => x !== c)); },
  toggle(c) { this.list.includes(c) ? this.remove(c) : this.add(c); },
};
for (const line of lines) {
  const [cmd, a, ...rest] = line.trim().split(/\s+/);
  const v = rest.join(" ");
  if (cmd === "setAttr") setAttribute(a, v);
  else if (cmd === "type") { el.value = a; el.dirty = true; }                  // a user edit: property only, and the flag flips
  else if (cmd === "setProp") { el[a] = a === "checked" ? v === "true" : v; if (a === "value") el.dirty = true; }
  else if (cmd === "addClass") classList.add(a);
  else if (cmd === "removeClass") classList.remove(a);
  else if (cmd === "toggleClass") classList.toggle(a);
  else if (cmd === "data") setAttribute(`data-${a}`, v);
  else if (cmd === "get") {
    console.log(`value: attr=${JSON.stringify(el.attributes.get("value") ?? null)} prop=${JSON.stringify(el.value)} dirty=${el.dirty}`);
    console.log(`class: attr=${JSON.stringify(el.attributes.get("class") ?? null)} className=${JSON.stringify(el.className)} list=${JSON.stringify(classList.list)}`);
    console.log(`dataset=${JSON.stringify(el.dataset)} checked=${el.checked}`);
  }
}
