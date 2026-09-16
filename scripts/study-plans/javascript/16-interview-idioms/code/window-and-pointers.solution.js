"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
// longest-unique <s> | at-most-k <k> <s> | max-window <k> <nums…> | pair-sorted <target> <sorted nums…>
function longestUnique(chars) {
  const last = new Map();
  let best = [0, 0];
  for (let right = 0, left = 0; right < chars.length; right++) {
    if (last.has(chars[right]) && last.get(chars[right]) >= left) left = last.get(chars[right]) + 1;   // jump past the previous occurrence
    last.set(chars[right], right);
    if (right - left + 1 > best[1] - best[0]) best = [left, right + 1];
  }
  return best;
}
function atMostK(chars, k) {
  const count = new Map();
  let best = [0, 0];
  for (let right = 0, left = 0; right < chars.length; right++) {
    count.set(chars[right], (count.get(chars[right]) ?? 0) + 1);
    while (count.size > k) { const c = chars[left++]; count.set(c, count.get(c) - 1); if (count.get(c) === 0) count.delete(c); }   // shrink until valid; delete so size means distinct
    if (right - left + 1 > best[1] - best[0]) best = [left, right + 1];
  }
  return best;
}
for (const line of lines) {
  const [cmd, ...rest] = line.trim().split(/\s+/);
  if (cmd === "longest-unique") { const chars = [...rest[0]]; const [l, r] = longestUnique(chars); console.log(`longest-unique ${rest[0]}: length=${r - l} substring=${chars.slice(l, r).join("")}`); }
  else if (cmd === "at-most-k") { const k = Number(rest[0]), chars = [...rest[1]]; const [l, r] = atMostK(chars, k); console.log(`at-most-k k=${k} ${rest[1]}: length=${r - l} substring=${chars.slice(l, r).join("")}`); }
  else if (cmd === "max-window") {
    const k = Number(rest[0]), nums = rest.slice(1).map(Number);
    if (k > nums.length) { console.log(`max-window k=${k}: k larger than n=${nums.length}`); continue; }
    let sum = 0, best = -Infinity, at = 0;
    for (let i = 0; i < nums.length; i++) { sum += nums[i]; if (i >= k) sum -= nums[i - k]; if (i >= k - 1 && sum > best) { best = sum; at = i - k + 1; } }   // add the new, drop the one that left
    console.log(`max-window k=${k}: sum=${best} window=[${nums.slice(at, at + k).join(",")}] at ${at}`);
  } else if (cmd === "pair-sorted") {
    const target = Number(rest[0]), nums = rest.slice(1).map(Number);
    let lo = 0, hi = nums.length - 1, steps = 0, found = null;
    while (lo < hi) { steps++; const s = nums[lo] + nums[hi]; if (s === target) { found = [nums[lo], nums[hi]]; break; } if (s < target) lo++; else hi--; }
    console.log(`pair-sorted target=${target}: ${found ? `${found[0]}+${found[1]}` : "none"} steps=${steps}`);
  }
}
