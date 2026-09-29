import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { conversationLanguage, INTERVIEWERS, interviewerFor } from "./interviewers.js";
import { buildContext, GEMINI_VOICES, systemInstruction } from "../services/realtime-interview.js";

/**
 * The interviewer and language a spoken round is started with arrive from the
 * lobby as request fields, so every path here is also a path for a tampered
 * or stale client — and what they decide is the voice on the call and the
 * first words of the brief.
 */

const config = {
  roleId: "sde-1",
  roundId: "coding-interview",
  difficulty: "intermediate",
  experienceBand: "Junior (0-2 years)",
  interviewStyle: "Mixed",
  stackFocusIds: [],
  focusAreaIds: [],
};

const brief = (extra: Partial<Parameters<typeof buildContext>[0]> = {}) =>
  systemInstruction(
    buildContext({ config, durationMinutes: 20, language: null, roleLabel: "SDE 1", roundLabel: "Coding Interview", topics: [], ...extra }),
  );

describe("interviewer choice", () => {
  it("knows its own ids and nothing else", () => {
    assert.equal(interviewerFor("owen")?.name, "Owen");
    assert.equal(interviewerFor("Kate"), null);
    assert.equal(interviewerFor("Kore"), null, "a vendor voice name is not an interviewer id");
    assert.equal(interviewerFor({ id: "kate" }), null);
  });

  it("reads no choice — a round from before it, an older client — as no interviewer", () => {
    assert.equal(interviewerFor(null), null);
    assert.equal(interviewerFor(undefined), null);
  });

  it("gives every interviewer a voice, and no two the same one", () => {
    const voices = INTERVIEWERS.map((interviewer) => GEMINI_VOICES[interviewer.id]);
    assert.ok(voices.every(Boolean));
    assert.equal(new Set(voices).size, INTERVIEWERS.length);
  });

  it("gives the lobby's default, Charles, the voice every round had before there was a choice", () => {
    assert.equal(GEMINI_VOICES.charles, "Charon");
  });
});

describe("conversation language", () => {
  it("accepts the three offered and opens anything else in English", () => {
    assert.equal(conversationLanguage("hindi"), "hindi");
    assert.equal(conversationLanguage("hinglish"), "hinglish");
    assert.equal(conversationLanguage("english"), "english");
    assert.equal(conversationLanguage("french"), "english");
    assert.equal(conversationLanguage(null), "english");
  });
});

describe("the brief", () => {
  it("names the chosen interviewer and nobody when none was chosen", () => {
    assert.match(brief({ interviewer: interviewerFor("kate") }), /Your name is Kate/);
    assert.doesNotMatch(brief(), /Your name is/);
  });

  it("opens in the chosen language and still follows the candidate", () => {
    assert.match(brief(), /Open in English\. From then on, follow the candidate/);
    assert.match(brief({ openingLanguage: "hindi" }), /Open in Hindi — the candidate chose it/);
    assert.match(brief({ openingLanguage: "hinglish" }), /Open in Hinglish, /);
    assert.match(brief({ openingLanguage: "hindi" }), /They answer in English, you stay in English/);
  });
});
