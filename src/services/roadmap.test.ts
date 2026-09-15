import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { clearedTiers, walk, type RoadDefinition } from "./roadmap.js";

/**
 * The road's two pure rules: which stages are open, and which chests are.
 * Both decide XP and what a reader is allowed to see, so they are pinned
 * here without a database.
 *
 * Run with: npm test
 */

const problem = (id: string) => ({ id, slug: id, title: id, difficulty: "easy" });

const road: RoadDefinition = {
  tiers: [
    { id: "foundations", title: "Foundations", blurb: "", rewardXp: 30, interviewCredits: 1 },
    { id: "core", title: "Core techniques", blurb: "", rewardXp: 50, interviewCredits: 1 },
  ],
  stages: [
    { id: "arrays", key: "arrays", title: "Arrays", blurb: "", tier: "foundations", icon: "layers", required: 2, problems: [problem("a1"), problem("a2"), problem("a3")] },
    { id: "hashing", key: "hashing", title: "Hashing", blurb: "", tier: "foundations", icon: "hash", required: 1, problems: [problem("h1"), problem("h2")] },
    { id: "stacks", key: "stacks", title: "Stacks", blurb: "", tier: "core", icon: "stack", required: 1, problems: [problem("s1")] },
  ],
};

describe("walk", () => {
  it("opens only the first stage on an untouched road and hides the locked ones' problems", () => {
    const stages = walk(road, new Set());
    assert.deepEqual(stages.map((s) => s.status), ["open", "locked", "locked"]);
    assert.equal(stages[0].problems?.length, 3);
    assert.equal(stages[1].problems, null);
  });

  it("clears a stage at `required` solves and opens the next", () => {
    const stages = walk(road, new Set(["a1", "a3"]));
    assert.deepEqual(stages.map((s) => s.status), ["cleared", "open", "locked"]);
    assert.equal(stages[0].solved, 2);
  });

  it("counts a stage cleared from the catalogue even when the one before it is not — the lock guides, it does not gate", () => {
    const stages = walk(road, new Set(["h1"]));
    assert.deepEqual(stages.map((s) => s.status), ["open", "cleared", "open"]);
  });

  it("keeps a stage locked while the one before it is open and unsolved", () => {
    const stages = walk(road, new Set(["a1"]));
    assert.deepEqual(stages.map((s) => s.status), ["open", "locked", "locked"]);
  });
});

describe("clearedTiers", () => {
  it("is empty until every stage of a tier is cleared", () => {
    assert.deepEqual(clearedTiers(road, walk(road, new Set(["a1", "a2"]))), []);
  });

  it("names a tier once its last stage clears, and the next tier once its own does", () => {
    assert.deepEqual(clearedTiers(road, walk(road, new Set(["a1", "a2", "h1"]))), ["foundations"]);
    assert.deepEqual(clearedTiers(road, walk(road, new Set(["a1", "a2", "h1", "s1"]))), ["foundations", "core"]);
  });

  it("never clears a tier with no stages behind it", () => {
    const empty: RoadDefinition = { tiers: [{ id: "ghost", title: "Ghost", blurb: "", rewardXp: 10, interviewCredits: 0 }], stages: [] };
    assert.deepEqual(clearedTiers(empty, walk(empty, new Set())), []);
  });
});
