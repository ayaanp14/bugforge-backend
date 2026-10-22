import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { FALLBACK_MODELS, currentModel, fetchWithModelFallback, isModelUnavailable, resetModelAvailability, usableModel } from "./model-fallback.js";

/**
 * The retired-model fallback (lib/ai/model-fallback.ts) on a stubbed
 * provider: a model NVIDIA no longer serves is skipped for the hour and the
 * request goes again on the next; load and server errors are not mistaken
 * for a missing model.
 *
 * Run with: npm test
 */

beforeEach(() => resetModelAvailability());

const GONE_404 = '{"status":404,"title":"Not Found","detail":"Function \'ac74\': Not found for account \'0pe\'"}';
const GONE_410 = '{"status":410,"title":"Gone","detail":"The model has reached its end of life on 2026-08-26"}';

test("what counts as a missing model, and what does not", () => {
  assert.equal(isModelUnavailable(404, GONE_404), true);
  assert.equal(isModelUnavailable(410, GONE_410), true);
  assert.equal(isModelUnavailable(400, "The model `x` does not exist"), true);
  assert.equal(isModelUnavailable(429, "rate limited"), false);
  assert.equal(isModelUnavailable(503, "overloaded"), false);
  assert.equal(isModelUnavailable(400, "max_tokens too large"), false);
});

test("a retired model is retried once on the next, and skipped from then on", async () => {
  const sent: string[] = [];
  const send = async (model: string) => {
    sent.push(model);
    return model === "old/model" ? new Response(GONE_404, { status: 404 }) : new Response('{"ok":true}', { status: 200 });
  };
  const first = await fetchWithModelFallback("old/model", send);
  assert.equal(first.response.status, 200);
  assert.equal(first.model, FALLBACK_MODELS[0]);
  assert.deepEqual(sent, ["old/model", FALLBACK_MODELS[0]]);

  sent.length = 0;
  const second = await fetchWithModelFallback("old/model", send);
  assert.equal(second.model, FALLBACK_MODELS[0]);
  assert.deepEqual(sent, [FALLBACK_MODELS[0]], "no wasted round trip within the hour");
  assert.equal(currentModel("old/model"), FALLBACK_MODELS[0], "what a stored answer records");
});

test("down the whole list when each is gone; the last answer comes back when none is left", async () => {
  const sent: string[] = [];
  const result = await fetchWithModelFallback("old/model", async (model) => {
    sent.push(model);
    return new Response(GONE_410, { status: 410 });
  });
  assert.equal(result.response.status, 410);
  assert.deepEqual(sent, ["old/model", ...FALLBACK_MODELS]);
});

test("a busy or failing model is not swapped: that is the caller's retry", async () => {
  const sent: string[] = [];
  const result = await fetchWithModelFallback("old/model", async (model) => {
    sent.push(model);
    return new Response("overloaded", { status: 503 });
  });
  assert.equal(result.response.status, 503);
  assert.deepEqual(sent, ["old/model"]);
  assert.equal(usableModel("old/model"), "old/model");
});
