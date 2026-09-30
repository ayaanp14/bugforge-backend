import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { foldPerDay, modelOf, sessionSeconds, stringList, voiceChoice, wasSat } from "./admin-interviews.js";

/**
 * The admin interviews view reads everything off existing session rows; these
 * pin the readings that are easy to get subtly wrong. No database.
 *
 * Run with: npm test
 */

const T0 = new Date("2026-09-30T10:00:00.000Z");
const at = (secs: number) => new Date(T0.getTime() + secs * 1000);

describe("wasSat", () => {
  it("counts a closed round, an answered written round and a voice round whose audio began", () => {
    assert.equal(wasSat({ status: "completed", mode: "written", startedAt: null, answered: 0 }), true);
    assert.equal(wasSat({ status: "started", mode: "written", startedAt: null, answered: 1 }), true);
    assert.equal(wasSat({ status: "abandoned", mode: "voice", startedAt: T0, answered: 0 }), true);
  });

  it("does not count a round opened and left at the door", () => {
    assert.equal(wasSat({ status: "started", mode: "written", startedAt: null, answered: 0 }), false);
    assert.equal(wasSat({ status: "abandoned", mode: "voice", startedAt: null, answered: 0 }), false);
    // startedAt on a written row means nothing; only a voice round is sat by its clock.
    assert.equal(wasSat({ status: "started", mode: "written", startedAt: T0, answered: 0 }), false);
  });
});

describe("sessionSeconds", () => {
  const base = { durationSec: null, startedAt: null, endedAt: null, completedAt: null, createdAt: T0 };

  it("prefers a voice round's written duration, then its audio start and end", () => {
    assert.equal(sessionSeconds({ ...base, mode: "voice", durationSec: 900, startedAt: T0, endedAt: at(1200) }), 900);
    assert.equal(sessionSeconds({ ...base, mode: "voice", startedAt: at(5), endedAt: at(605) }), 600);
    assert.equal(sessionSeconds({ ...base, mode: "voice", startedAt: T0 }), null);
  });

  it("reads a written round from creation to completion, or nothing while it is open", () => {
    assert.equal(sessionSeconds({ ...base, mode: "written", completedAt: at(1830) }), 1830);
    assert.equal(sessionSeconds({ ...base, mode: "written" }), null);
  });

  it("never goes negative on skewed clocks", () => {
    assert.equal(sessionSeconds({ ...base, mode: "voice", startedAt: at(10), endedAt: T0 }), 0);
  });
});

describe("modelOf", () => {
  it("uses the recorded model when the row has one", () => {
    assert.deepEqual(modelOf({ mode: "voice", provider: "gemini", realtimeModel: "gemini-live-x" }, "nvidia/nemotron"), {
      provider: "gemini",
      model: "gemini-live-x",
      modelRecorded: true,
    });
  });

  it("reads a written round as today's configured model, flagged as not recorded", () => {
    assert.deepEqual(modelOf({ mode: "written", provider: null, realtimeModel: null }, "nvidia/nemotron"), {
      provider: "nvidia",
      model: "nvidia/nemotron",
      modelRecorded: false,
    });
  });

  it("does not invent a model for a voice row that lacks one", () => {
    assert.equal(modelOf({ mode: "voice", provider: "gemini", realtimeModel: null }, "nvidia/nemotron").model, null);
  });
});

describe("voiceChoice", () => {
  it("names the interviewer and language of a spoken round", () => {
    assert.deepEqual(voiceChoice("voice", { interviewer: "kate", language: "hinglish", currentQuestion: 3 }), {
      interviewer: { id: "kate", name: "Kate", tone: "Firm" },
      language: "hinglish",
    });
  });

  it("reads an unknown or missing interviewer as no choice", () => {
    assert.deepEqual(voiceChoice("voice", { interviewer: "nobody" }), { interviewer: null, language: null });
    assert.deepEqual(voiceChoice("voice", null), { interviewer: null, language: null });
  });

  it("ignores voiceState on a written round", () => {
    assert.deepEqual(voiceChoice("written", { interviewer: "kate", language: "hindi" }), { interviewer: null, language: null });
  });
});

describe("foldPerDay", () => {
  it("puts both modes of a day on one row, in day order", () => {
    const out = foldPerDay([
      { day: "2026-09-29", mode: "voice", n: 2n },
      { day: new Date("2026-09-28T00:00:00.000Z"), mode: "written", n: 3n },
      { day: "2026-09-29", mode: "written", n: 1 },
    ]);
    assert.deepEqual(out, [
      { day: "2026-09-28", written: 3, voice: 0 },
      { day: "2026-09-29", written: 1, voice: 2 },
    ]);
  });
});

describe("stringList", () => {
  it("keeps strings and drops anything else an old row holds", () => {
    assert.deepEqual(stringList(["a", 1, null, "b"]), ["a", "b"]);
    assert.deepEqual(stringList(null), []);
    assert.deepEqual(stringList({ a: "b" }), []);
  });
});
