"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const routeLines = lines.filter((l) => l.startsWith("route "));
const commands = lines.filter((l) => !l.startsWith("route "));
const routes = routeLines.map((l) => {
  const pattern = l.split(/\s+/)[1];
  const keys = [];
  const source = pattern.replace(/\//g, "\\/").replace(/:(\w+)/g, (_, k) => { keys.push(k); return "([^/]+)"; }).replace(/\*/g, () => { keys.push("rest"); return "(.*)"; });
  return { pattern, keys, re: new RegExp(`^${source}$`) };
});
function match(pathWithQuery) {
  const url = new URL(pathWithQuery, "http://app.local");
  const query = Object.fromEntries(url.searchParams);
  for (const r of routes) {
    const m = r.re.exec(url.pathname);
    if (m) return `matched ${r.pattern} params=${JSON.stringify(Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])])))} query=${JSON.stringify(query)}`;
  }
  return `404 ${url.pathname}`;
}
const history = ["/"];
let index = 0;
const render = (why) => console.log(`${why} ${history[index]} -> ${match(history[index])}`);
for (const line of commands) {
  const [cmd, arg] = line.trim().split(/\s+/);
  if (cmd === "push") { history.splice(index + 1); history.push(arg); index++; render("pushState"); }        // a new entry discards the forward stack
  else if (cmd === "replace") { history[index] = arg; render("replaceState"); }
  else if (cmd === "back") { if (index > 0) { index--; render("popstate"); } else console.log("back: nothing to go back to"); }
  else if (cmd === "forward") { if (index < history.length - 1) { index++; render("popstate"); } else console.log("forward: nothing ahead"); }
  else if (cmd === "stack") console.log(`stack=${JSON.stringify(history)} index=${index}`);
}
