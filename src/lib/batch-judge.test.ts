import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { fitEncodedStdin } from "./batch-judge.js";
import { buildBatchStdin, encodeBatchStdin } from "./batch.js";
import { PAIZA_MAX_STDIN_CHARS } from "./paiza.js";

// A deterministic stand-in for random envelopes: pseudo-random int pairs
// compress poorly, which is what pushed russian-doll-envelopes past Paiza's
// input cap on the gzip path (2026-11-08).
function pairsCase(seed: number, n: number): { input: string } {
  let x = seed;
  const next = () => (x = (x * 1103515245 + 12345) % 2147483648);
  const pairs = Array.from({ length: n }, () => `[${next() % 100000},${next() % 100000}]`);
  return { input: `[${pairs.join(",")}]` };
}

describe("fitEncodedStdin", () => {
  it("leaves a chunk that fits alone", () => {
    const chunk = [pairsCase(1, 50), pairsCase(2, 50)];
    assert.deepEqual(fitEncodedStdin(chunk, "java"), [chunk]);
  });

  it("splits a poorly compressing chunk until every part fits Paiza's cap, keeping order", () => {
    const chunk = Array.from({ length: 400 }, (_, i) => pairsCase(i + 1, 300)); // ~5 MB raw
    const parts = fitEncodedStdin(chunk, "java");
    assert.ok(parts.length > 1);
    assert.deepEqual(parts.flat(), chunk);
    for (const part of parts) {
      const encoded = encodeBatchStdin(buildBatchStdin(part.map((c) => c.input)), "java");
      assert.ok(encoded.length <= PAIZA_MAX_STDIN_CHARS, `part of ${part.length} cases encodes to ${encoded.length}`);
    }
  });

  it("never splits below one case", () => {
    const one = [pairsCase(7, 40000)];
    assert.deepEqual(fitEncodedStdin(one, "java"), [one]);
  });
});
