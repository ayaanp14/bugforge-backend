import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  candidateWordCount,
  coalesce,
  EMPTY_STATE,
  sanitizeEvents,
  stateOf,
} from "./voice-transcript.js";
import { prettyLabel } from "./interview-labels.js";

/**
 * The parts of a voice round that can be checked without a socket, a model or
 * a database. Everything here decides what ends up stored and scored, so a
 * regression is a wrong mark on someone's interview rather than a cosmetic bug.
 *
 * Run with: npm test
 */

describe("coalesce", () => {
  it("runs consecutive fragments from one speaker into a single turn", () => {
    const lines = coalesce([
      { speaker: "interviewer", text: "How would you" },
      { speaker: "interviewer", text: "scale that service?" },
      { speaker: "candidate", text: "I'd put Redis" },
      { speaker: "candidate", text: "in front of it." },
    ]);

    assert.deepEqual(lines, [
      { speaker: "interviewer", text: "How would you scale that service?" },
      { speaker: "candidate", text: "I'd put Redis in front of it." },
    ]);
  });

  it("starts a new turn when the speaker changes back", () => {
    const lines = coalesce([
      { speaker: "interviewer", text: "Why Redis?" },
      { speaker: "candidate", text: "It's fast." },
      { speaker: "interviewer", text: "Fast at what?" },
    ]);
    assert.equal(lines.length, 3);
    assert.equal(lines[2].text, "Fast at what?");
  });

  it("drops empty and whitespace-only fragments without breaking a turn", () => {
    const lines = coalesce([
      { speaker: "candidate", text: "I would" },
      { speaker: "candidate", text: "   " },
      { speaker: "candidate", text: null },
      { speaker: "candidate", text: "cache it." },
    ]);
    assert.deepEqual(lines, [{ speaker: "candidate", text: "I would cache it." }]);
  });

  it("treats any unknown speaker as the candidate rather than losing the line", () => {
    const lines = coalesce([{ speaker: "user", text: "Hello." }]);
    assert.equal(lines[0].speaker, "candidate");
  });

  it("returns nothing for an empty transcript", () => {
    assert.deepEqual(coalesce([]), []);
  });
});

describe("candidateWordCount", () => {
  it("counts only what the candidate said", () => {
    const count = candidateWordCount([
      { speaker: "interviewer", text: "one two three four five" },
      { speaker: "candidate", text: "six seven" },
    ]);
    assert.equal(count, 2);
  });

  it("is zero when the candidate never spoke", () => {
    assert.equal(candidateWordCount([{ speaker: "interviewer", text: "Anyone there?" }]), 0);
  });
});

describe("stateOf", () => {
  it("returns a fresh state for null, which is what an untouched column holds", () => {
    assert.deepEqual(stateOf(null), EMPTY_STATE);
    assert.deepEqual(stateOf(undefined), EMPTY_STATE);
  });

  it("keeps stored fields and fills in ones added since the row was written", () => {
    const state = stateOf({ currentQuestion: 4, resumeHandle: "abc" });
    assert.equal(state.currentQuestion, 4);
    assert.equal(state.resumeHandle, "abc");
    assert.equal(state.followUpsAsked, 0);
    assert.deepEqual(state.topicsCovered, []);
  });

  it("refuses a non-object without throwing", () => {
    assert.deepEqual(stateOf("nonsense"), EMPTY_STATE);
    assert.deepEqual(stateOf([1, 2, 3]), EMPTY_STATE);
  });

  it("does not share array state between two reads", () => {
    const first = stateOf(null);
    first.topicsCovered.push("React");
    assert.deepEqual(stateOf(null).topicsCovered, []);
  });
});

describe("sanitizeEvents", () => {
  const valid = { sequence: 1, speaker: "candidate", type: "transcript", text: "hi" };

  it("keeps a well-formed event", () => {
    const [event] = sanitizeEvents([valid]);
    assert.equal(event.sequence, 1);
    assert.equal(event.speaker, "candidate");
    assert.equal(event.text, "hi");
    assert.deepEqual(event.metadata, {});
  });

  it("preserves the order the client reported", () => {
    const events = sanitizeEvents([
      { ...valid, sequence: 7 },
      { ...valid, sequence: 8, speaker: "interviewer" },
      { ...valid, sequence: 9 },
    ]);
    assert.deepEqual(
      events.map((e) => e.sequence),
      [7, 8, 9],
    );
  });

  it("drops events with an unusable sequence", () => {
    assert.equal(sanitizeEvents([{ ...valid, sequence: -1 }]).length, 0);
    assert.equal(sanitizeEvents([{ ...valid, sequence: 1.5 }]).length, 0);
    assert.equal(sanitizeEvents([{ ...valid, sequence: "3" }]).length, 0);
    assert.equal(sanitizeEvents([{ ...valid, sequence: undefined }]).length, 0);
  });

  it("drops an unknown speaker rather than storing it", () => {
    assert.equal(sanitizeEvents([{ ...valid, speaker: "attacker" }]).length, 0);
  });

  it("accepts the system speaker used by lifecycle events", () => {
    assert.equal(sanitizeEvents([{ sequence: 0, speaker: "system", type: "interview_started" }]).length, 1);
  });

  it("caps a batch so one request cannot write unbounded rows", () => {
    const huge = Array.from({ length: 500 }, (_, i) => ({ ...valid, sequence: i }));
    assert.equal(sanitizeEvents(huge).length, 200);
  });

  it("truncates oversized text instead of rejecting the turn", () => {
    const [event] = sanitizeEvents([{ ...valid, text: "x".repeat(20_000) }]);
    assert.equal(event.text?.length, 8000);
  });

  it("normalises a missing or non-object metadata to an empty object", () => {
    assert.deepEqual(sanitizeEvents([{ ...valid, metadata: "nope" }])[0].metadata, {});
    assert.deepEqual(sanitizeEvents([{ ...valid, metadata: [1] }])[0].metadata, {});
    assert.deepEqual(sanitizeEvents([{ ...valid, metadata: { a: 1 } }])[0].metadata, { a: 1 });
  });

  it("returns nothing for input that is not an array", () => {
    assert.deepEqual(sanitizeEvents(undefined), []);
    assert.deepEqual(sanitizeEvents({ events: [] }), []);
    assert.deepEqual(sanitizeEvents(null), []);
  });

  it("survives null entries inside the array", () => {
    assert.equal(sanitizeEvents([null, valid, undefined]).length, 1);
  });
});

describe("prettyLabel", () => {
  it("turns configuration slugs into words the interviewer can say", () => {
    assert.equal(prettyLabel("node-express"), "Node Express");
    assert.equal(prettyLabel("frontend-engineer"), "Frontend Engineer");
  });

  it("upper-cases known acronyms", () => {
    assert.equal(prettyLabel("dsa"), "DSA");
    assert.equal(prettyLabel("api-design"), "API Design");
  });

  it("falls back to General for an empty label", () => {
    assert.equal(prettyLabel("   "), "General");
  });
});
