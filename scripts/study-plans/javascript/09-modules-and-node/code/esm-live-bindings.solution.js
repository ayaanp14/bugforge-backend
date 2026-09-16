"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const n = Number(lines[0]);
const url = "data:text/javascript,export let count = 0; export function inc() { count++; } export default 'the default';";
async function main() {
  const ns = await import(url);
  console.log(`count before=${ns.count}`);
  for (let i = 0; i < n; i++) ns.inc();
  console.log(`count after=${ns.count}`);              // live binding: the namespace reflects the module's current value
  const again = await import(url);
  console.log(`sameInstance=${again === ns} default=${ns.default}`);
  console.log(`namespaceKeys=${Object.keys(ns).sort().join(",")}`);
  let assign;
  try { ns.count = 99; assign = "changed"; } catch (err) { assign = err.constructor.name; }
  console.log(`assignToImport=${assign} stillCount=${ns.count}`);
  console.log(`requireCached=${require("fs") === require("fs")} typeofRequire=${typeof require} dirnameIsString=${typeof __dirname === "string"}`);
}
main();
