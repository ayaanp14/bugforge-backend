"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
// Schema DSL on line 1:  name:string age:number email?:string tags:string[] role:"admin"|"user"
function compile(dsl) {
  // TODO: fields -> { key, optional, type: { kind: "string"|"number"|"boolean", or literal union, or array of } }
}
function toType(schema) {
  // TODO: `{ name: string; age: number; email?: string; tags: string[]; role: "admin" | "user" }`
}
function parse(schema, value) {
  // TODO: return { ok: true, value } or { ok: false, errors: ["<path>: <message>"] } with every error collected
}
