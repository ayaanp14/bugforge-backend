"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
// reverse <s> | palindrome <text…> | camel <kebab-case> | kebab <camelCase> | title <text…> | truncate <n> <text…> | rle <s> | count <char> <text…> | pad <width> <n> | words <text…>
for (const line of lines) {
  const [cmd, ...rest] = line.trim().split(/\s+/);
  const text = rest.join(" ");
  if (cmd === "reverse") console.log(`reverse: ${[...rest[0]].reverse().join("")}`);                                  // spread = code points; split("") would break emoji
  else if (cmd === "palindrome") { const t = text.toLowerCase().replace(/[^\p{L}\p{N}]/gu, ""); console.log(`palindrome: ${t === [...t].reverse().join("")}`); }
  else if (cmd === "camel") console.log(`camel: ${rest[0].replace(/-(\w)/g, (_, c) => c.toUpperCase())}`);
  else if (cmd === "kebab") console.log(`kebab: ${rest[0].replace(/[A-Z]/g, (c) => "-" + c.toLowerCase())}`);
  else if (cmd === "title") console.log(`title: ${text.split(/\s+/).map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(" ")}`);
  else if (cmd === "truncate") { const n = Number(rest[0]), s = rest.slice(1).join(" "), cps = [...s]; console.log(`truncate ${n}: ${cps.length <= n ? s : cps.slice(0, n - 1).join("") + "…"}`); }
  else if (cmd === "rle") console.log(`rle: ${rest[0].replace(/(.)\1*/gsu, (run, c) => [...run].length + c)}`);       // backreference matches the run
  else if (cmd === "count") { const s = rest.slice(1).join(" "); console.log(`count ${rest[0]}: ${[...s].filter((c) => c === rest[0]).length}`); }
  else if (cmd === "pad") console.log(`pad: ${String(rest[1]).padStart(Number(rest[0]), "0")}`);
  else if (cmd === "words") { const words = text.trim().split(/\s+/).filter(Boolean); console.log(`words: ${words.length} longest=${words.reduce((a, b) => ([...b].length > [...a].length ? b : a), "")}`); }
}
