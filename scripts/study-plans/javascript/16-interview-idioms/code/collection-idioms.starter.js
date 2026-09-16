"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
// Line 1: records `name:dept:age`; then commands: count <field> | group <field> | unique <field> | sort <field> <field> | chunk <n> | top <k> <field> | range <a> <b> | zip <field> <field> | minmax <field> | dedupe-by <field>
const records = lines[0].trim().split(/\s+/).map((r) => { const [name, dept, age] = r.split(":"); return { name, dept, age: Number(age) }; });
// TODO
