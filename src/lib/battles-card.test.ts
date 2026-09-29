import { test } from "node:test";
import assert from "node:assert/strict";
import { CARD_HEIGHT, CARD_WIDTH, cardVersion, renderTournamentCard, type TournamentCard } from "./battles-card.js";

// The link-preview card is drawn with fonts and a WASM rasteriser read from
// content/og and node_modules; this renders real cards, so a missing asset
// or a layout satori refuses fails here and not on the first share.

const card = (over: Partial<TournamentCard> = {}): TournamentCard => ({
  slug: "freshers-knockout",
  title: "Freshers Knockout",
  org: "The Coding Club",
  verified: true,
  format: "knockout",
  teamSize: 1,
  capacity: 64,
  startsAt: new Date("2026-10-03T04:30:00Z"),
  registrationClosesAt: new Date("2026-10-02T12:30:00Z"),
  durationMinutes: 45,
  problems: 5,
  phase: "registration",
  ...over,
});

/** Width and height from the PNG's IHDR chunk. */
const size = (png: Buffer) => ({ width: png.readUInt32BE(16), height: png.readUInt32BE(20) });

test("a card is a 1200×630 PNG small enough for every preview", async () => {
  for (const c of [
    card(),
    // The longest title a tournament may have (battles-rules titleMax 140), a long host, a team contest, live.
    card({ title: "A".repeat(20) + " " + "Grand Coding Championship ".repeat(5), org: "Government College of Engineering and Research, Avasari Khurd", format: "icpc", teamSize: 3, capacity: null, phase: "live" }),
    card({ phase: "finished", problems: 0 }),
  ]) {
    const png = await renderTournamentCard(c);
    assert.equal(png.subarray(1, 4).toString("latin1"), "PNG");
    assert.deepEqual(size(png), { width: CARD_WIDTH, height: CARD_HEIGHT });
    // WhatsApp drops a preview image much over 300 KB.
    assert.ok(png.length < 300_000, `${png.length} bytes`);
  }
});

test("the version follows what is drawn", () => {
  assert.equal(cardVersion(card()), cardVersion(card()));
  assert.match(cardVersion(card()), /^[0-9a-f]{10}$/);
  assert.notEqual(cardVersion(card({ phase: "live" })), cardVersion(card()));
  assert.notEqual(cardVersion(card({ org: "Another Club" })), cardVersion(card()));
});
