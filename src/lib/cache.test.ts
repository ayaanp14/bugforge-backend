import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { cached, cachedShared, invalidate, invalidatePrefix } from "./cache.js";

/**
 * The invalidation contract: after invalidate(key) returns, no read of `key`
 * may answer with data loaded before it. The dashboard and /api/me depend on
 * it right after a submission — the one moment a stale number is noticed.
 * (No REDIS_URL under test, so cachedShared runs its L1 path.)
 */

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}

let seq = 0;
const freshKey = (name: string) => `test:${name}:${++seq}`;

describe("cache invalidation", () => {
  for (const [name, read] of [
    ["cached", (key: string, load: () => Promise<string>) => cached(key, 60_000, load)],
    ["cachedShared", (key: string, load: () => Promise<string>) => cachedShared(key, 60, load)],
  ] as const) {
    it(`${name}: a load that began before invalidate() does not store its result`, async () => {
      const key = freshKey(name);
      const slow = deferred<string>();
      const before = read(key, () => slow.promise);
      invalidate(key);
      slow.resolve("before-write");
      // Its own caller still gets an answer…
      assert.equal(await before, "before-write");
      // …but the next read loads again instead of serving it.
      let loads = 0;
      const after = await read(key, async () => {
        loads++;
        return "after-write";
      });
      assert.equal(after, "after-write");
      assert.equal(loads, 1);
    });
  }

  it("a disowned load finishing does not free the newer load's single-flight slot", async () => {
    const key = freshKey("slot");
    const first = deferred<string>();
    const second = deferred<string>();
    let calls = 0;
    const load = () => (++calls === 1 ? first.promise : second.promise);
    const a = cached(key, 60_000, load);
    invalidate(key);
    const b = cached(key, 60_000, load);
    first.resolve("old");
    await a;
    // A third reader arriving now must join the second load, not start a third.
    const c = cached(key, 60_000, load);
    second.resolve("new");
    assert.deepEqual(await Promise.all([b, c]), ["new", "new"]);
    assert.equal(calls, 2);
  });

  it("a load that failed leaves nothing behind", async () => {
    const key = freshKey("fail");
    await assert.rejects(cached(key, 60_000, async () => Promise.reject(new Error("db down"))));
    assert.equal(await cached(key, 60_000, async () => "ok"), "ok");
  });

  it("a flood of not-found answers cannot evict a real entry", async () => {
    // /api/seo/head is unsigned and ahead of the rate limiter; every invented
    // slug used to land a null in the one 2,000-entry map for an hour.
    const real = freshKey("dashboard");
    let realLoads = 0;
    await cached(real, 60_000, async () => `dash${++realLoads}`);
    for (let i = 0; i < 3_000; i++) await cached(freshKey("seo-miss"), 60 * 60_000, async () => null);
    assert.equal(await cached(real, 60_000, async () => `dash${++realLoads}`), "dash1");
    assert.equal(realLoads, 1);
  });

  it("a key that was a miss becomes a hit once it exists, and the miss is gone", async () => {
    const key = freshKey("seeded-later");
    assert.equal(await cached<string | null>(key, 60_000, async () => null), null);
    invalidate(key);
    assert.equal(await cached<string | null>(key, 60_000, async () => "now-published"), "now-published");
    assert.equal(await cached<string | null>(key, 60_000, async () => null), "now-published");
  });

  it("invalidatePrefix drops the family and nothing else", async () => {
    const base = freshKey("feed");
    const keep = freshKey("other");
    let loads = 0;
    const load = async () => `v${++loads}`;
    await cached(`${base}:all`, 60_000, load);
    await cached(`${base}:tag:java`, 60_000, load);
    await cached(keep, 60_000, load);
    invalidatePrefix(`${base}:`);
    assert.equal(await cached(`${base}:all`, 60_000, load), "v4");
    assert.equal(await cached(`${base}:tag:java`, 60_000, load), "v5");
    assert.equal(await cached(keep, 60_000, load), "v3");
  });
});
