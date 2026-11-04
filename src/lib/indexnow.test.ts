import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { announceToSearchEngines, indexNowPayload } from "./indexnow.js";

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
