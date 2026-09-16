"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l !== "");
for (const s of lines) {
  console.log(`once=${s.replace("a", "_")}`);
  console.log(`all=${s.replaceAll("a", "_")}`);
  const words = s.trim() === "" ? 0 : s.trim().split(/\s+/).length;
  console.log(`words=${words}`);
  console.log(`padded=${s.trim().padStart(12, ".")}`);
}
