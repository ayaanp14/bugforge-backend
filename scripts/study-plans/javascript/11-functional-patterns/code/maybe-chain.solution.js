"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const Some = (value) => ({ isSome: true, map: (f) => Some(f(value)), flatMap: (f) => f(value), filter: (p) => (p(value) ? Some(value) : None), getOrElse: () => value, toString: () => `Some(${JSON.stringify(value)})` });
const None = { isSome: false, map: () => None, flatMap: () => None, filter: () => None, getOrElse: (fb) => fb, toString: () => "None" };
const fromNullable = (v) => (v === null || v === undefined ? None : Some(v));
const users = JSON.parse(lines[0]);
const findUser = (id) => fromNullable(users.find((u) => u.id === id));
for (const id of lines.slice(1).map(Number)) {
  const city = findUser(id)
    .flatMap((u) => fromNullable(u.address))
    .map((a) => a.city.toUpperCase())
    .filter((c) => c.length > 3);
  const chained = users.find((u) => u.id === id)?.address?.city?.toUpperCase() ?? "unknown";
  console.log(`${id}: maybe=${city} value=${city.getOrElse("unknown")} optionalChaining=${chained} name=${findUser(id).map((u) => u.name).getOrElse("nobody")}`);
}
const inner = Some(2).map((x) => Some(x)).getOrElse();       // map wrapped the Maybe: Some(Some(2))
console.log(`nested: map -> Some containing ${inner} | flatMap -> ${Some(2).flatMap((x) => Some(x))}`);
