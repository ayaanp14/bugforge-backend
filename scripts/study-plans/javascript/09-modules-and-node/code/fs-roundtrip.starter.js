"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const fsp = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
async function main() {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), "study-"));
  try {
    for (const line of lines) {
      const [cmd, name, ...rest] = line.trim().split(/\s+/);
      // TODO: write | append | read | list | stat | rename | remove | mkdir | exists — print error <code> on failure
    }
  } finally {
    await fsp.rm(dir, { recursive: true, force: true });
  }
}
main();
