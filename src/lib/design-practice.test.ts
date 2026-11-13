import { test } from "node:test";
import assert from "node:assert/strict";
import {
  COMPONENTS,
  DESIGN_POINTS,
  DESIGN_PROBLEMS,
  DESIGN_RUBRIC,
  MIN_ANSWER_CHARS,
  buildDesignMessages,
  coerceDesignReview,
  emptyAnswer,
  guardDesignReview,
  parseAnswer,
  problemBySlug,
  type DesignAnswer,
} from "./design-practice.js";
import { DesignReviewSchema } from "./design-practice.js";

/** The system design canvas's rules (lib/design-practice). Run with: npm test */

const full = (): DesignAnswer => ({
  functional: "Shorten a URL; redirect a short URL to the original; custom aliases optional.",
  nonFunctional: "Redirects under 50 ms at p99; highly available; links never collide.",
  estimates: "100M writes/month ≈ 40/s; reads 100x ≈ 4,000/s; 500 bytes a row → 600 GB over 10 years.",
  api: "POST /links {url} → {short}; GET /{code} → 302 Location.",
  dataModel: "links(code PK, url, created_at, owner) in a key-value store keyed by code.",
  flow: "Client → load balancer → app → cache (code→url) → database on a miss.",
  deepDive: "Key generation from a counter range per server, base62; cache hot links; 302 keeps analytics.",
  components: ["client", "load-balancer", "app-server", "cache", "nosql"],
});

test("the rubric adds to 100 and every problem is complete", () => {
  assert.equal(DESIGN_POINTS, 100);
  assert.equal(new Set(DESIGN_PROBLEMS.map((p) => p.slug)).size, DESIGN_PROBLEMS.length);
  for (const p of DESIGN_PROBLEMS) {
    assert.ok(p.title && p.brief && p.scale && p.note, p.slug);
    assert.ok(p.mustCover.length >= 3, `${p.slug} names what a strong answer covers`);
  }
  assert.equal(problemBySlug("chat-app")?.note, "design-a-chat-app");
  assert.equal(problemBySlug("nope"), undefined);
});

test("an answer is trimmed, capped, its unknown components dropped, and too-thin designs refused", () => {
  const ok = parseAnswer({ ...full(), components: ["cache", "cache", "warp-drive", 7] });
  assert.ok("answer" in ok);
  assert.deepEqual(ok.answer.components, ["cache"]);

  assert.match((parseAnswer({ functional: "x" }) as { error: string }).error, new RegExp(String(MIN_ANSWER_CHARS)));
  assert.match((parseAnswer({ ...full(), api: "x".repeat(2_001) }) as { error: string }).error, /API is over 2,000/);
  assert.match((parseAnswer({ ...full(), flow: 12 }) as { error: string }).error, /must be text/);
  assert.match((parseAnswer(null) as { error: string }).error, /object/);
});

test("the messages fence the design as data and give the reviewer what to look for", () => {
  const msgs = buildDesignMessages(problemBySlug("url-shortener")!, full(), "SYSTEM");
  assert.equal(msgs[0]!.content, "SYSTEM");
  const user = msgs[1]!.content;
  assert.match(user, /=== BEGIN DESIGN ===/);
  assert.match(user, /## Components chosen\nClient, Load balancer, App servers, Cache, NoSQL store/);
  assert.match(user, /A STRONG ANSWER COVERS/);
  for (const c of DESIGN_RUBRIC) assert.match(user, new RegExp(`- ${c.key} \\(0–${c.max}\\)`));
});

test("the guard clamps scores, fills skipped criteria, drops invented ones, and an empty section earns nothing", () => {
  const raw = DesignReviewSchema.parse(
    coerceDesignReview({
      criteria: [
        { key: "requirements", score: "18", note: "Clear scope." },
        { key: "estimates", score: 99, note: "Way over." },
        { key: "architecture", score: 20.6, note: "Cache in front of the store." },
        { key: "bonus", score: 50, note: "invented" },
      ],
      summary: "Solid.",
      strengths: "Caches hot links.",
      missed: ["Collision handling", "", "Analytics"],
      confidence: "HIGH",
    }),
  );
  const r = guardDesignReview(raw, full())!;
  assert.deepEqual(
    r.criteria.map((c) => [c.key, c.score]),
    [
      ["requirements", 18],
      ["estimates", 15],
      ["interfaces", 0],
      ["architecture", 21],
      ["tradeoffs", 0],
    ],
  );
  assert.equal(r.criteria[2]!.note, "Not addressed.");
  assert.equal(r.score, 54);
  assert.deepEqual(r.strengths, ["Caches hot links."]);
  assert.deepEqual(r.missed, ["Collision handling", "Analytics"]);
  assert.equal(r.confidence, "high");

  // The model cannot give points for a section the member left empty.
  const thin = { ...full(), estimates: "" };
  const r2 = guardDesignReview(raw, thin)!;
  assert.equal(r2.criteria[1]!.score, 0);
  assert.equal(r2.criteria[1]!.note, "Left empty.");

  assert.equal(guardDesignReview(DesignReviewSchema.parse(coerceDesignReview({ criteria: [{ key: "x", score: 1, note: "" }] })), full()), null);
});

test("the palette has unique keys and an empty answer has every field", () => {
  assert.equal(new Set(COMPONENTS.map((c) => c.key)).size, COMPONENTS.length);
  assert.deepEqual(Object.keys(emptyAnswer()).sort(), ["api", "components", "dataModel", "deepDive", "estimates", "flow", "functional", "nonFunctional"]);
});
