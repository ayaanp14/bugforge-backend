"use strict";
const lines = require("fs").readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== "");
const sleep = (ms, v) => new Promise((r) => setTimeout(r, ms, v));
const routes = {
  "/api/user": { status: 200, delay: 5, body: { id: 1, name: "Ada" } },
  "/api/missing": { status: 404, delay: 5, body: { error: "no such user" } },
  "/api/broken": { status: 500, delay: 5, text: "<html>Internal Server Error</html>" },
  "/api/slow": { status: 100, delay: 100, body: { ok: true } },
};
routes["/api/slow"].status = 200;
function fakeFetch(url, { signal } = {}) {
  const route = routes[new URL(url, "http://localhost").pathname];
  return new Promise((resolve, reject) => {
    if (!route) return reject(new TypeError("Failed to fetch"));            // network-level failure: the only kind fetch rejects with
    const timer = setTimeout(() => {
      let used = false;
      const text = route.text ?? JSON.stringify(route.body);
      const read = () => { if (used) return Promise.reject(new TypeError("body used already")); used = true; return Promise.resolve(text); };
      resolve({ ok: route.status >= 200 && route.status < 300, status: route.status, text: read, json: () => read().then(JSON.parse) });
    }, route.delay);
    signal?.addEventListener("abort", () => { clearTimeout(timer); reject(Object.assign(new Error("The operation was aborted"), { name: "AbortError" })); });
  });
}
class HttpError extends Error { constructor(status, message, detail) { super(message); this.name = "HttpError"; this.status = status; this.detail = detail; } }
async function getJson(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fakeFetch(url, { signal: controller.signal });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new HttpError(res.status, `GET ${url} -> ${res.status}`, detail);
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}
async function main() {
  const timeoutMs = Number(lines[0]);
  for (const url of lines.slice(1).map((l) => l.trim())) {
    try {
      console.log(`${url}: ok ${JSON.stringify(await getJson(url, timeoutMs))}`);
    } catch (err) {
      if (err instanceof HttpError) console.log(`${url}: HttpError ${err.status} detail=${JSON.stringify(err.detail)}`);
      else if (err.name === "AbortError") console.log(`${url}: timed out after ${timeoutMs} ms`);
      else console.log(`${url}: ${err.name}: ${err.message}`);
    }
  }
  const res = await fakeFetch("/api/user");
  await res.text();
  await res.json().then(() => console.log("second read ok"), (e) => console.log(`second read: ${e.name}: ${e.message}`));
}
main();
