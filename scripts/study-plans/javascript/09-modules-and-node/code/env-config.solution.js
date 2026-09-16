"use strict";
const input = require("fs").readFileSync(0, "utf8");
function parseDotenv(text) {
  const out = {};
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const m = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!m) continue;
    let value = m[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    else value = value.replace(/\s+#.*$/, "");                   // trailing comment on an unquoted value
    value = value.replace(/\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g, (_, name) => out[name] ?? "");
    out[m[1]] = value;
  }
  return out;
}
const [envText, requiredLine] = input.split("\n---\n");
const env = parseDotenv(envText);
const required = (requiredLine ?? "").trim().split(/\s+/).filter(Boolean);
const missing = required.filter((k) => !(k in env) || env[k] === "");
console.log(`env=${JSON.stringify(env)}`);
console.log(`missing=${JSON.stringify(missing)} wouldExitWith=${missing.length ? 1 : 0}`);
process.on("exit", (code) => console.log(`exit handler: code=${code}`));   // synchronous work only in here
