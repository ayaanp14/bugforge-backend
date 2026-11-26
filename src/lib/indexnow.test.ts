import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { PING_PATH_MAX, announceToSearchEngines, indexNowPayload, parseSitemap, planPings } from "./indexnow.js";

test("the request names the host, the key's file and absolute addresses", () => {
  const body = indexNowPayload(["/interview-experiences/amazon/sde-2025-abc"], "https://codekairo.com");
  assert.equal(body.host, "codekairo.com");
  assert.equal(body.keyLocation, `https://codekairo.com/${body.key}.txt`);
  assert.deepEqual(body.urlList, ["https://codekairo.com/interview-experiences/amazon/sde-2025-abc"]);
  // The engines check this file; backend CI has no frontend checkout, so only where both exist.
  const file = new URL(`../../../frontend/public/${body.key}.txt`, import.meta.url);
  if (existsSync(file)) assert.equal(readFileSync(file, "utf8").trim(), body.key);
});

test("only production announces, unless switched off, and a failure never throws", async (t) => {
  const calls: string[] = [];
  t.mock.method(globalThis, "fetch", async (url: string) => {
    calls.push(url);
    throw new Error("network down");
  });
  const before = { env: process.env["NODE_ENV"], off: process.env["INDEXNOW"] };
  t.mock.method(console, "warn", () => {});
  try {
    delete process.env["INDEXNOW"];
    process.env["NODE_ENV"] = "development";
    announceToSearchEngines(["/a"]);
    assert.equal(calls.length, 0);

    process.env["NODE_ENV"] = "production";
    process.env["INDEXNOW"] = "off";
    announceToSearchEngines(["/a"]);
    assert.equal(calls.length, 0);

    delete process.env["INDEXNOW"];
    announceToSearchEngines([]);
    assert.equal(calls.length, 0);
    announceToSearchEngines(["/a"]);
    assert.equal(calls.length, 1);
    await new Promise((resolve) => setImmediate(resolve));
  } finally {
    if (before.env === undefined) delete process.env["NODE_ENV"];
    else process.env["NODE_ENV"] = before.env;
    if (before.off !== undefined) process.env["INDEXNOW"] = before.off;
  }
});

const O = "https://codekairo.com";
const urlset = (...urls: Array<[string, string?]>) =>
  `<?xml version="1.0"?><urlset>${urls.map(([loc, mod]) => `<url>\n  <loc>${loc}</loc>${mod ? `\n  <lastmod>${mod}</lastmod>` : ""}\n</url>`).join("")}</urlset>`;

test("a sitemap reads as paths with their lastmod; other hosts are dropped", () => {
  const xml = urlset([`${O}/`], [`${O}/problems/two-sum`, "2026-10-09"], [`${O}/a?x=1&amp;y=2`, "2026-11-01T10:00:00Z"], ["https://battles.codekairo.com/x", "2026-10-01"]);
  assert.deepEqual(parseSitemap(xml, O), [
    { path: "/", lastmod: "" },
    { path: "/problems/two-sum", lastmod: "2026-10-09" },
    { path: "/a?x=1&y=2", lastmod: "2026-11-01" },
  ]);
});

test("only new, moved and removed pages are sent; removed ones are then forgotten", () => {
  const entries = [
    { path: "/same", lastmod: "2026-10-09" },
    { path: "/moved", lastmod: "2026-11-20" },
    { path: "/new", lastmod: "" },
    { path: "/new", lastmod: "" }, // listed in two sitemaps
  ];
  const sent = new Map([["/same", "2026-10-09"], ["/moved", "2026-10-09"], ["/gone", ""]]);
  const plan = planPings(entries, sent);
  assert.deepEqual(plan.send, ["/moved", "/new", "/gone"]);
  assert.deepEqual(plan.upsert, [{ path: "/moved", lastmod: "2026-11-20" }, { path: "/new", lastmod: "" }]);
  assert.deepEqual(plan.remove, ["/gone"]);
  assert.equal(plan.deferred, 0);
  assert.deepEqual(planPings([{ path: "/same", lastmod: "2026-10-09" }], new Map([["/same", "2026-10-09"]])).send, []);
});

test("a run sends at most the limit, changed pages first, and defers the rest", () => {
  const entries = Array.from({ length: 5 }, (_, i) => ({ path: `/p${i}`, lastmod: "" }));
  const plan = planPings(entries, new Map([["/gone", ""]]), 3);
  assert.deepEqual(plan.send, ["/p0", "/p1", "/p2"]);
  assert.deepEqual(plan.remove, []);
  assert.equal(plan.deferred, 3);
  // An address longer than the stored key is never swept (it would be due every day).
  assert.deepEqual(planPings([{ path: "/" + "x".repeat(PING_PATH_MAX), lastmod: "" }], new Map()).send, []);
});
