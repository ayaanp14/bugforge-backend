"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
// brackets <s> | next-greater <nums…> | simplify-path <path> | bfs <rows> followed by <rows> grid lines (S start, E end, # wall, . open)
const PAIRS = { ")": "(", "]": "[", "}": "{" };
function brackets(s) {
  const stack = [];
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if ("([{".includes(c)) stack.push([c, i]);
    else if (c in PAIRS) { if (stack.length === 0 || stack.at(-1)[0] !== PAIRS[c]) return `invalid at ${i} (unexpected '${c}')`; stack.pop(); }
  }
  return stack.length ? `invalid at ${stack.at(-1)[1]} (unclosed '${stack.at(-1)[0]}')` : "valid";
}
function nextGreater(nums) {
  const out = new Array(nums.length).fill(-1), stack = [];                  // stack holds indices with no answer yet, values decreasing
  for (let i = 0; i < nums.length; i++) { while (stack.length && nums[stack.at(-1)] < nums[i]) out[stack.pop()] = nums[i]; stack.push(i); }
  return out;
}
function simplifyPath(p) {
  const stack = [];
  for (const part of p.split("/")) { if (part === "" || part === ".") continue; if (part === "..") stack.pop(); else stack.push(part); }
  return "/" + stack.join("/");
}
function bfs(grid) {
  const rows = grid.length, cols = grid[0].length;
  let start, end;
  grid.forEach((row, r) => [...row].forEach((c, col) => { if (c === "S") start = [r, col]; if (c === "E") end = [r, col]; }));
  const queue = [[...start, 0]], seen = new Set([`${start[0]},${start[1]}`]);
  for (let i = 0; i < queue.length; i++) {                                    // index pointer, never shift()
    const [r, c, d] = queue[i];
    if (r === end[0] && c === end[1]) return `shortest=${d} visited=${seen.size}`;
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nr = r + dr, nc = c + dc, key = `${nr},${nc}`;
      if (nr < 0 || nc < 0 || nr >= rows || nc >= cols || grid[nr][nc] === "#" || seen.has(key)) continue;
      seen.add(key); queue.push([nr, nc, d + 1]);
    }
  }
  return `unreachable visited=${seen.size}`;
}
for (let i = 0; i < lines.length; i++) {
  const [cmd, ...rest] = lines[i].trim().split(/\s+/);
  if (cmd === "brackets") console.log(`brackets "${rest[0] ?? ""}": ${brackets(rest[0] ?? "")}`);   // an empty string has no token at all
  else if (cmd === "next-greater") console.log(`next-greater [${rest.join(",")}] -> [${nextGreater(rest.map(Number)).join(",")}]`);
  else if (cmd === "simplify-path") console.log(`simplify-path ${rest[0]} -> ${simplifyPath(rest[0])}`);
  else if (cmd === "bfs") { const n = Number(rest[0]); const grid = lines.slice(i + 1, i + 1 + n).map((l) => l.trim()); i += n; console.log(`bfs ${grid[0].length}x${n}: ${bfs(grid)}`); }
}
