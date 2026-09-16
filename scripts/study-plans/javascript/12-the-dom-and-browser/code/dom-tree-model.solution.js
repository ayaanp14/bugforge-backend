"use strict";
const input = require("fs").readFileSync(0, "utf8");
// Build a tree from indented lines: `tag#id.class.other text...`
function parseTree(treeLines) {
  const root = { tag: "document", id: "", classes: [], text: "", children: [], parent: null, depth: -1 };
  const stack = [root];
  for (const raw of treeLines) {
    const depth = raw.match(/^ */)[0].length / 2;
    const [head, ...words] = raw.trim().split(/\s+/);
    const tag = head.match(/^[a-z0-9]+/)?.[0] ?? "div";
    const id = head.match(/#([\w-]+)/)?.[1] ?? "";
    const classes = [...head.matchAll(/\.([\w-]+)/g)].map((m) => m[1]);
    const node = { tag, id, classes, text: words.join(" "), children: [], parent: null, depth };
    while (stack.length > 1 && stack.at(-1).depth >= depth) stack.pop();
    node.parent = stack.at(-1);
    stack.at(-1).children.push(node);
    stack.push(node);
  }
  return root;
}
const describe = (n) => `${n.tag}${n.id ? "#" + n.id : ""}${n.classes.map((c) => "." + c).join("")}`;
const [treeText, commandText] = input.split("\n---\n");
const root = parseTree(treeText.split("\n").filter((l) => l.trim() !== ""));
function matches(node, simple) {
  const tag = simple.match(/^[a-z0-9]+/)?.[0];
  const id = simple.match(/#([\w-]+)/)?.[1];
  const classes = [...simple.matchAll(/\.([\w-]+)/g)].map((m) => m[1]);
  return (!tag || node.tag === tag) && (!id || node.id === id) && classes.every((c) => node.classes.includes(c));
}
function* descendants(node) { for (const c of node.children) { yield c; yield* descendants(c); } }
function querySelectorAll(scope, selector) {
  const parts = selector.trim().split(/\s+/);
  let current = [scope];
  for (const part of parts) {
    const next = new Set();
    for (const n of current) for (const d of descendants(n)) if (matches(d, part)) next.add(d);
    current = [...next];
  }
  return current;
}
const querySelector = (scope, selector) => querySelectorAll(scope, selector)[0] ?? null;
function textContent(node) {
  return [node.text, ...node.children.map(textContent)].filter(Boolean).join(" ").trim();
}
function closest(node, selector) { for (let n = node; n && n.parent; n = n.parent) if (matches(n, selector)) return n; return null; }
for (const line of commandText.split("\n").filter((l) => l.trim() !== "")) {
  const [cmd, ...rest] = line.trim().split(/\s+/);
  if (cmd === "qsa") { const found = querySelectorAll(root, rest.join(" ")); console.log(`qsa ${rest.join(" ")}: ${found.length} -> ${found.map(describe).join(", ") || "-"}`); }
  else if (cmd === "text") { const n = querySelector(root, rest.join(" ")); console.log(`text ${rest.join(" ")}: ${n ? JSON.stringify(textContent(n)) : "null"}`); }
  else if (cmd === "closest") { const start = querySelector(root, rest[0]); const found = start && closest(start, rest[1]); console.log(`closest ${rest[0]} ${rest[1]}: ${found ? describe(found) : "null"}`); }
}
