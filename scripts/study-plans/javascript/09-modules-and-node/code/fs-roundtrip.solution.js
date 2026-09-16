"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const fsp = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
async function main() {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), "study-"));
  const at = (name) => path.join(dir, name);
  try {
    for (const line of lines) {
      const [cmd, name, ...rest] = line.trim().split(/\s+/);
      const text = rest.join(" ");
      try {
        if (cmd === "write") { await fsp.writeFile(at(name), text + "\n"); console.log(`wrote ${name}`); }
        else if (cmd === "append") { await fsp.appendFile(at(name), text + "\n"); console.log(`appended ${name}`); }
        else if (cmd === "read") console.log(`${name}: ${JSON.stringify(await fsp.readFile(at(name), "utf8"))}`);
        else if (cmd === "list") {
          const entries = await fsp.readdir(dir, { withFileTypes: true });
          console.log(`list: ${entries.map((e) => `${e.name}${e.isDirectory() ? "/" : ""}`).sort().join(" ") || "(empty)"}`);
        } else if (cmd === "stat") { const st = await fsp.stat(at(name)); console.log(`${name}: ${st.size} bytes file=${st.isFile()}`); }
        else if (cmd === "rename") { await fsp.rename(at(name), at(rest[0])); console.log(`renamed ${name} -> ${rest[0]}`); }
        else if (cmd === "remove") { await fsp.rm(at(name)); console.log(`removed ${name}`); }
        else if (cmd === "mkdir") { await fsp.mkdir(at(name), { recursive: true }); console.log(`mkdir ${name}`); }
        else if (cmd === "exists") console.log(`${name} exists=${await fsp.access(at(name)).then(() => true, () => false)}`);
      } catch (err) {
        console.log(`${cmd} ${name}: error ${err.code}`);
      }
    }
  } finally {
    await fsp.rm(dir, { recursive: true, force: true });
  }
}
main();
