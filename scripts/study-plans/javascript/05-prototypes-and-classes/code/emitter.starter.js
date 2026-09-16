"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
class Emitter {
  #listeners = new Map();   // event -> [{ id, fn, once }]
  // TODO: on(event, id, fn), once(event, id, fn), off(event, id), emit(event, payload) -> number called, count(event)
}
const em = new Emitter();
for (const line of lines) {
  const [cmd, event, arg] = line.trim().split(/\s+/);
  // TODO: on | once | off | emit | count — a listener prints `<id>:<event>:<payload>`
}
