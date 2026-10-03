import { test } from "node:test";
import assert from "node:assert/strict";
import { renderContentCard, CONTENT_CARD_HEIGHT, CONTENT_CARD_WIDTH, type ContentCard } from "./content-card.js";

// Renders real cards (content/og, resvg's WASM) on the worker thread, as the
// API does. The point of the worker is the second test: a card is ~80 ms of
// synchronous WASM, and drawn on the event loop it held every other request
// for that long (lib/og-card.ts has the measurements).

const card: ContentCard = {
  kind: "problem",
  label: "DSA problem",
  eyebrow: "Arrays · Hash Table",
  title: "Two Sum",
  facts: [
    { value: "Easy", unit: "difficulty" },
    { value: "13", unit: "languages" },
    { value: "Free", unit: "editorial" },
  ],
};

function pngSize(png: Buffer): { width: number; height: number } {
  assert.equal(png.subarray(1, 4).toString("latin1"), "PNG");
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
}

test("a content card renders on the worker as a 1200×630 PNG", async () => {
  const errors: unknown[] = [];
  const original = console.error;
  console.error = (...args: unknown[]) => void errors.push(args);
  try {
    const png = await renderContentCard(card);
    assert.deepEqual(pngSize(png), { width: CONTENT_CARD_WIDTH, height: CONTENT_CARD_HEIGHT });
  } finally {
    console.error = original;
  }
  // renderCard says so when it falls back to the main thread.
  assert.deepEqual(errors, []);
});

test("rendering cards does not stall the event loop", async () => {
  await renderContentCard(card); // the worker is warm: fonts and WASM loaded
  let last = performance.now();
  let worst = 0;
  const tick = setInterval(() => {
    const now = performance.now();
    worst = Math.max(worst, now - last);
    last = now;
  }, 2);
  try {
    // Six distinct cards at once — on the event loop that is ~0.5 s with no tick.
    const pngs = await Promise.all([1, 2, 3, 4, 5, 6].map((n) => renderContentCard({ ...card, title: `${card.title} ${n}` })));
    assert.equal(pngs.length, 6);
  } finally {
    clearInterval(tick);
  }
  assert.ok(worst < 50, `the event loop went ${worst.toFixed(1)} ms without a tick`);
});
