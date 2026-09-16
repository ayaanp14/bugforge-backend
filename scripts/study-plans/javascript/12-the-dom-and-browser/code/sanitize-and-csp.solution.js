"use strict";
const input = require("fs").readFileSync(0, "utf8");
const [html, cspLine, ...scripts] = input.split("\n").filter((l) => l.trim() !== "");
const ALLOWED_TAGS = new Set(["b", "i", "p", "a", "br"]);
const escapeHtml = (s) => s.replace(/&(?!#?\w+;)|[<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);   // an existing entity like &amp; is left alone
function sanitize(markup) {
  const tokens = markup.split(/(<[^>]+>)/);                                    // tags and text alternate
  const dropped = [];
  let skipping = null;                                                        // inside <script>...</script>: drop the content too
  const out = tokens.map((tok) => {
    const m = /^<(\/?)([a-zA-Z0-9]+)([^>]*)>$/.exec(tok);
    if (!m) return skipping ? "" : escapeHtml(tok);
    const [, close, rawTag, attrText] = m;
    const tag = rawTag.toLowerCase();
    if (skipping) { if (close && tag === skipping) skipping = null; return ""; }
    if (!ALLOWED_TAGS.has(tag)) { dropped.push(tag); if (!close && (tag === "script" || tag === "style")) skipping = tag; return ""; }
    if (close) return `</${tag}>`;
    let attrs = "";
    if (tag === "a") {
      const href = /href\s*=\s*"([^"]*)"/i.exec(attrText)?.[1];
      if (href && /^https?:\/\//i.test(href)) attrs = ` href="${escapeHtml(href)}" rel="noopener"`;
      else if (href) dropped.push(`a[href=${href.split(":")[0]}:]`);
    }
    for (const on of attrText.matchAll(/\s(on\w+)=/gi)) dropped.push(on[1].toLowerCase());
    return `<${tag}${attrs}>`;
  });
  return { html: out.join(""), dropped };
}
function cspAllows(policy, source) {
  const directive = policy.split(";").map((d) => d.trim()).find((d) => d.startsWith("script-src")) ?? "script-src 'none'";
  const sources = directive.split(/\s+/).slice(1);
  if (source === "inline") return sources.includes("'unsafe-inline'");
  if (source === "eval") return sources.includes("'unsafe-eval'");
  if (source === "self") return sources.includes("'self'");
  const host = new URL(source).host;
  return sources.some((s) => {
    if (s.startsWith("'")) return false;
    const pattern = s.replace(/^https?:\/\//, "");
    return pattern.startsWith("*.") ? host.endsWith(pattern.slice(1)) : host === pattern;
  });
}
const { html: clean, dropped } = sanitize(html);
console.log(`sanitized=${clean}`);
console.log(`dropped=${dropped.join(",") || "-"}`);
for (const s of scripts.map((l) => l.trim())) console.log(`${s}: ${cspAllows(cspLine, s) ? "allowed" : "blocked"}`);
