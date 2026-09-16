"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const sleep = (ms, v) => new Promise((r) => setTimeout(r, ms, v));
const routes = {
  "/api/user": { status: 200, delay: 5, body: { id: 1, name: "Ada" } },
  "/api/missing": { status: 404, delay: 5, body: { error: "no such user" } },
  "/api/broken": { status: 500, delay: 5, text: "<html>Internal Server Error</html>" },
  "/api/slow": { status: 200, delay: 100, body: { ok: true } },
};
function fakeFetch(url, { signal } = {}) {
  // TODO: resolve after the route's delay with a Response-like object { ok, status, json(), text() } whose body can be read once; reject with AbortError on abort
}
class HttpError extends Error { constructor(status, message, detail) { super(message); this.name = "HttpError"; this.status = status; this.detail = detail; } }
async function getJson(url, timeoutMs) {
  // TODO: timeout with AbortController, ok check with the error body as detail, parse json
}
