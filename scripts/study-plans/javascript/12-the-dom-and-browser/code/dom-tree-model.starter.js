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
  // TODO: simple selector `tag#id.class.class` — every part must match
}
function querySelectorAll(scope, selector) {
  // TODO: descendant combinator: split on whitespace; each part matches some descendant of a previous match
}
function textContent(node) {
  // TODO: own text plus descendants' text, space-separated, trimmed
}
for (const line of commandText.split("\n").filter((l) => l.trim() !== "")) {
  const [cmd, ...rest] = line.trim().split(/\s+/);
  // TODO: qsa <selector> | text <selector> | closest <#id> <selector>
}
