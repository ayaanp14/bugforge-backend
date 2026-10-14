import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import type { Request, Response } from "express";
import { claimedEngine, createCrawlerVerifier, type Resolver } from "./search-crawler.js";
import { makeGeneralLimiter } from "../middleware/rate-limit.js";

const GOOGLE = ["googlebot.com", "google.com"];

/** PTR and forward records as Google publishes them for one crawler host. */
function fakeDns(records: { ptr: Record<string, string[]>; a: Record<string, string[]> }) {
  const asked = { reverse: 0, lookup: 0 };
  const resolver: Resolver = {
    reverse: async (ip) => {
      asked.reverse++;
      const names = records.ptr[ip];
      if (!names) throw Object.assign(new Error("not found"), { code: "ENOTFOUND" });
      return names;
    },
    lookup: async (host) => {
      asked.lookup++;
      return records.a[host] ?? [];
    },
  };
  return { resolver, asked };
}

describe("search crawler verification", () => {
  it("names the engine a User-Agent claims", () => {
    assert.deepEqual(claimedEngine("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"), GOOGLE);
    assert.deepEqual(claimedEngine("Mozilla/5.0 (compatible; bingbot/2.0)"), ["search.msn.com"]);
    assert.equal(claimedEngine("Mozilla/5.0 (Windows NT 10.0) Chrome/141"), null);
    assert.equal(claimedEngine(undefined), null);
  });

  it("accepts an address whose PTR is Google's and resolves back to it", async () => {
    const { resolver } = fakeDns({
      ptr: { "66.249.66.1": ["crawl-66-249-66-1.googlebot.com"] },
      a: { "crawl-66-249-66-1.googlebot.com": ["66.249.66.1"] },
    });
    assert.equal(await createCrawlerVerifier(resolver)("66.249.66.1", GOOGLE), true);
    assert.equal(await createCrawlerVerifier(resolver)("::ffff:66.249.66.1", GOOGLE), true, "an IPv4-mapped address is its IPv4 address");
  });

  it("matches an IPv6 crawler however the address is spelled", async () => {
    const { resolver } = fakeDns({
      ptr: { "2001:4860:4801:10::1": ["crawl-2001-4860-4801-10--1.googlebot.com."] },
      a: { "crawl-2001-4860-4801-10--1.googlebot.com": ["2001:4860:4801:0010:0000:0000:0000:0001"] },
    });
    assert.equal(await createCrawlerVerifier(resolver)("2001:4860:4801:10::1", GOOGLE), true);
  });

  it("refuses a PTR outside the engine's domains or one that does not resolve back", async () => {
    const { resolver } = fakeDns({
      ptr: { "1.2.3.4": ["googlebot.com.evil.example"], "5.6.7.8": ["crawl.googlebot.com"] },
      a: { "googlebot.com.evil.example": ["1.2.3.4"], "crawl.googlebot.com": ["66.249.66.1"] },
    });
    const verified = createCrawlerVerifier(resolver);
    assert.equal(await verified("1.2.3.4", GOOGLE), false, "a look-alike name");
    assert.equal(await verified("5.6.7.8", GOOGLE), false, "a PTR the scraper set on its own address");
    assert.equal(await verified("9.9.9.9", GOOGLE), false, "no PTR at all");
  });

  it("asks DNS once per address while the answer is cached", async () => {
    let t = 0;
    const { resolver, asked } = fakeDns({ ptr: { "66.249.66.1": ["crawl.googlebot.com"] }, a: { "crawl.googlebot.com": ["66.249.66.1"] } });
    const verified = createCrawlerVerifier(resolver, () => t);
    await Promise.all([verified("66.249.66.1", GOOGLE), verified("66.249.66.1", GOOGLE)]);
    await verified("66.249.66.1", GOOGLE);
    assert.equal(asked.reverse, 1);
    t += 25 * 60 * 60 * 1000;
    await verified("66.249.66.1", GOOGLE);
    assert.equal(asked.reverse, 2, "a day later it is checked again");
  });
});

describe("the general limiter and crawlers", () => {
  function hit(limiter: ReturnType<typeof makeGeneralLimiter>, ip: string, ua: string, method = "GET"): Promise<number> {
    const req = { method, ip, socket: { remoteAddress: ip }, headers: { "user-agent": ua } } as unknown as Request;
    const res = new EventEmitter() as EventEmitter & Response;
    return new Promise((resolve) => {
      res.setHeader = () => res;
      res.status = (code: number) => {
        resolve(code);
        return res;
      };
      res.json = () => res;
      limiter(req, res, () => resolve(200));
    });
  }

  const GOOGLEBOT = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

  it("lets a proven crawler past the people's allowance, and nobody else", async () => {
    const limiter = makeGeneralLimiter(async (ip) => ip === "66.249.66.9");
    const statuses = async (ip: string, ua: string, method = "GET") => {
      const out: number[] = [];
      for (let i = 0; i < 320; i++) out.push(await hit(limiter, ip, ua, method));
      return out;
    };
    assert.ok((await statuses("66.249.66.9", GOOGLEBOT)).every((s) => s === 200), "a proven Googlebot renders 320 reads a minute");
    assert.ok((await statuses("6.6.6.6", GOOGLEBOT)).includes(429), "the same claim from elsewhere is a person");
    assert.ok((await statuses("66.249.66.9", GOOGLEBOT, "POST")).includes(429), "writes stay on the people's bucket");
  });
});
