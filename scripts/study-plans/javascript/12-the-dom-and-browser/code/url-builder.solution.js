"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
let url = null;
for (const line of lines) {
  const [cmd, ...args] = line.trim().split(/\s+/);
  if (cmd === "base") url = new URL(args[0]);
  else if (cmd === "resolve") url = new URL(args[0], url);
  else if (cmd === "set") url.searchParams.set(args[0], args.slice(1).join(" "));
  else if (cmd === "append") url.searchParams.append(args[0], args.slice(1).join(" "));
  else if (cmd === "delete") url.searchParams.delete(args[0]);
  else if (cmd === "path") url.pathname = "/" + args.map(encodeURIComponent).join("/");
  else if (cmd === "hash") url.hash = args[0] ?? "";           // no argument clears it
  else if (cmd === "show") console.log(String(url));
  else if (cmd === "parts") console.log(`origin=${url.origin} pathname=${url.pathname} search=${url.search} hash=${url.hash} host=${url.host} port=${JSON.stringify(url.port)}`);
  else if (cmd === "params") console.log(`params=${JSON.stringify([...url.searchParams])}`);
}
