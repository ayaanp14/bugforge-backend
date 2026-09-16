"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
function parseCsvLine(line) {
  const fields = [];
  let field = "", inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { field += '"'; i++; }   // an escaped quote
        else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") { fields.push(field); field = ""; }
    else field += ch;
  }
  if (inQuotes) throw new SyntaxError("unterminated quoted field");
  fields.push(field);
  return fields;
}
for (const line of lines) {
  try { console.log(JSON.stringify(parseCsvLine(line.replace(/\r$/, "")))); }
  catch (err) { console.log(`error: ${err.message}`); }
}
