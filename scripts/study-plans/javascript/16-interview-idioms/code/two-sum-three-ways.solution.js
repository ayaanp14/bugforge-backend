"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const nums = lines[0].trim().split(/\s+/).map(Number);
const target = Number(lines[1]);
const show = (pair) => (pair ? `indices ${pair.join(",")} (${nums[pair[0]]}+${nums[pair[1]]})` : "none");
let checks = 0, brute = null;
outer: for (let i = 0; i < nums.length; i++) for (let j = i + 1; j < nums.length; j++) { checks++; if (nums[i] + nums[j] === target) { brute = [i, j]; break outer; } }
console.log(`brute force: pairs checked=${checks} -> ${show(brute)} | O(n^2) time, O(1) space`);
const order = nums.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]);       // keep the original indices alongside the values
let lo = 0, hi = order.length - 1, steps = 0, twoPointers = null;
while (lo < hi) { steps++; const s = order[lo][0] + order[hi][0]; if (s === target) { twoPointers = [order[lo][1], order[hi][1]].sort((a, b) => a - b); break; } if (s < target) lo++; else hi--; }
console.log(`two pointers: sort, then steps=${steps} -> ${show(twoPointers)} | O(n log n) time, O(n) space for the index pairs`);
const seen = new Map();
let lookups = 0, hash = null;
for (let i = 0; i < nums.length && !hash; i++) { lookups++; const need = target - nums[i]; if (seen.has(need)) hash = [seen.get(need), i]; else seen.set(nums[i], i); }
console.log(`hash map: lookups=${lookups} -> ${show(hash)} | O(n) time, O(n) space`);
const sums = [brute, twoPointers, hash].map((p) => (p ? nums[p[0]] + nums[p[1]] === target : null));
console.log(sums.every((s) => s === true) ? `all three found a pair summing to ${target}` : sums.every((s) => s === null) ? `no pair sums to ${target}: all three agree` : "DISAGREEMENT");
