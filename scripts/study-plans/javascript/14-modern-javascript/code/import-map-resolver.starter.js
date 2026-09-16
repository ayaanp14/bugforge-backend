"use strict";
const input = require("fs").readFileSync(0, "utf8");
const [mapText, ...queries] = input.split("\n").filter((l) => l.trim() !== "");
const importMap = JSON.parse(mapText);      // { imports: { bare: url, "prefix/": url }, scopes: { scopeUrl: { bare: url } } }
function resolve(specifier, referrer) {
  // TODO: scopes whose key is a prefix of the referrer win (longest first), then imports; exact match, then trailing-slash prefix match; else relative/absolute via new URL; else throw
}
