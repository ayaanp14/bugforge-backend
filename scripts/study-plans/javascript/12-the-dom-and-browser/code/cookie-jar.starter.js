"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
// `Set-Cookie: name=value; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=3600` lines, then `request <url> <same-site|cross-site> <method> <navigation|subresource>` lines
function parseSetCookie(header) {
  // TODO: { name, value, path, secure, httpOnly, sameSite, maxAge }
}
function shouldSend(cookie, req) {
  // TODO: return null when sent, else a reason: expired | insecure | path | samesite
}
