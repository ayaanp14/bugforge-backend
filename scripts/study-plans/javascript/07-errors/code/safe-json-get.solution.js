"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
function parseJson(text) {
  try { return { ok: true, value: JSON.parse(text) }; }
  catch (err) { return { ok: false, error: `parse failed (${err.name})` }; }
}
function getPath(obj, path) {
  let current = obj;
  const walked = [];
  for (const key of path.split(".")) {
    if (current === null || typeof current !== "object" || !Object.hasOwn(current, key)) {
      return { ok: false, error: `missing '${key}' at ${walked.length ? walked.join(".") : "<root>"}` };
    }
    walked.push(key);
    current = current[key];
  }
  return { ok: true, value: current };
}
const parsed = parseJson(lines[0]);
if (!parsed.ok) {
  console.log(parsed.error);
} else {
  for (const path of lines.slice(1).map((l) => l.trim())) {
    const r = getPath(parsed.value, path);
    console.log(r.ok ? `${path} = ${JSON.stringify(r.value)}` : `${path}: ${r.error}`);
  }
}
