"use strict";
const input = require("fs").readFileSync(0, "utf8");
const [html, cspLine, ...scripts] = input.split("\n").filter((l) => l.trim() !== "");
const ALLOWED_TAGS = new Set(["b", "i", "p", "a", "br"]);
const escapeHtml = (s) => s.replace(/&(?!#?\w+;)|[<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);   // an existing entity like &amp; is left alone
function sanitize(markup) {
  // TODO: keep allowed tags (a only with an http/https href), drop on* attributes, escape everything else as text
}
function cspAllows(policy, source) {
  // TODO: script-src directive: 'self' | 'unsafe-inline' | 'unsafe-eval' | host sources (scheme://host, with * subdomain)
}
