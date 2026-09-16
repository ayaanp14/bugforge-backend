"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
// `Set-Cookie: name=value; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=3600` lines, then `request <url> <same-site|cross-site> <method> <navigation|subresource>` lines
function parseSetCookie(header) {
  const [pair, ...attrs] = header.replace(/^Set-Cookie:\s*/i, "").split(";").map((s) => s.trim());
  const [name, value = ""] = pair.split("=");
  const cookie = { name, value, path: "/", secure: false, httpOnly: false, sameSite: "Lax", maxAge: null };
  for (const attr of attrs) {
    const [k, v = ""] = attr.split("=");
    const key = k.toLowerCase();
    if (key === "path") cookie.path = v;
    else if (key === "secure") cookie.secure = true;
    else if (key === "httponly") cookie.httpOnly = true;
    else if (key === "samesite") cookie.sameSite = v[0].toUpperCase() + v.slice(1).toLowerCase();
    else if (key === "max-age") cookie.maxAge = Number(v);
  }
  return cookie;
}
function shouldSend(cookie, req) {
  if (cookie.maxAge !== null && cookie.maxAge <= 0) return "expired";
  if (cookie.secure && req.url.protocol !== "https:") return "insecure";
  if (!req.url.pathname.startsWith(cookie.path)) return "path";
  if (cookie.sameSite === "None" && !cookie.secure) return "samesite-none-requires-secure";
  if (req.site === "cross-site") {
    if (cookie.sameSite === "Strict") return "samesite-strict";
    if (cookie.sameSite === "Lax" && !(req.kind === "navigation" && req.method === "GET")) return "samesite-lax";
  }
  return null;
}
const jar = [];
for (const line of lines) {
  const text = line.trim();
  if (/^set-cookie:/i.test(text)) { jar.push(parseSetCookie(text)); continue; }
  if (!text.startsWith("request ")) continue;
  const [, urlText, site, method, kind] = text.split(/\s+/);
  const req = { url: new URL(urlText), site, method, kind };
  const sent = [], blocked = [];
  for (const c of jar) { const why = shouldSend(c, req); (why ? blocked : sent).push(why ? `${c.name}(${why})` : `${c.name}=${c.value}`); }
  console.log(`${method} ${urlText} [${site}, ${kind}] -> Cookie: ${sent.join("; ") || "(none)"}${blocked.length ? ` | blocked: ${blocked.join(", ")}` : ""}`);
}
console.log(`readableByScript=${jar.filter((c) => !c.httpOnly).map((c) => c.name).join(",") || "-"}`);
