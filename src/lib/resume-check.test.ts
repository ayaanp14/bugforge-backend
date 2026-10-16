process.env["TELEMETRY_DISABLED"] = "true";

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CheckEnvelopeError, buildCheckEnvelope, readCheckEnvelope } from "./resume-check.js";
import { renderPdf } from "./resume-export.js";
import { MAX_JD_CHARS } from "./resume-requirements.js";
import { parseResumeText } from "./resume-parse.js";
import { SAMPLE } from "./resume-parse.test.js";
import { checkResumeForVisitor } from "../services/resumes.js";

/**
 * The visitor's ATS check: the envelope that carries a file and its target
 * in one request, and the check itself on a real PDF — scored, with nothing
 * written (the service has no database call on this path; a test database
 * is never touched).
 *
 * Run with: npm test
 */

const bytes = (s: string) => new TextEncoder().encode(s);

describe("readCheckEnvelope", () => {
  it("round-trips the meta and the file", () => {
    const file = bytes("%PDF-1.7 not really");
    const { meta, file: out } = readCheckEnvelope(buildCheckEnvelope({ filename: "cv.pdf", type: "application/pdf", role: " Backend Engineer ", jobDescription: "Java, Spring" }, file));
    assert.deepEqual(meta, { filename: "cv.pdf", type: "application/pdf", role: "Backend Engineer", company: "", jobDescription: "Java, Spring" });
    assert.deepEqual([...out], [...file]);
  });

  it("refuses an empty file, a short body and a meta length past the body", () => {
    assert.throws(() => readCheckEnvelope(buildCheckEnvelope({}, new Uint8Array())), /Choose a PDF or DOCX/);
    assert.throws(() => readCheckEnvelope(new Uint8Array([0, 0])), CheckEnvelopeError);
    assert.throws(() => readCheckEnvelope(new Uint8Array([0, 0, 0, 200, 123, 125])), /could not be read/);
  });

  it("refuses meta that is not a JSON object", () => {
    const env = buildCheckEnvelope({}, bytes("x"));
    const bad = new Uint8Array([0, 0, 0, 2, 91, 93, 120]); // "[]" then the file
    assert.throws(() => readCheckEnvelope(bad), /could not be read/);
    assert.ok(readCheckEnvelope(env));
  });

  it("holds the job description to the members' limit", () => {
    assert.throws(() => readCheckEnvelope(buildCheckEnvelope({ jobDescription: "a".repeat(MAX_JD_CHARS + 1) }, bytes("x"))), /limited to/);
  });

  it("ignores fields of the wrong type", () => {
    const { meta } = readCheckEnvelope(buildCheckEnvelope({ role: 42 as unknown as string, company: ["x"] as unknown as string }, bytes("x")));
    assert.equal(meta.role, "");
    assert.equal(meta.company, "");
  });
});

describe("checkResumeForVisitor", () => {
  it("scores a real PDF against a role without the model", async () => {
    const pdf = await renderPdf(parseResumeText(SAMPLE).content);
    const check = await checkResumeForVisitor(new Uint8Array(pdf), "application/pdf", { role: "Backend Engineer", company: "", jobDescription: "" });
    assert.equal(check.resume.format, "pdf");
    assert.ok(check.result.overallScore > 0 && check.result.overallScore <= 100);
    assert.equal(check.result.ai.status, "unavailable");
    assert.match(check.result.ai.reason ?? "", /free account/);
    assert.equal(check.result.target.source, "role");
    // The two judgement categories are the heuristic's, never a model's.
    assert.notEqual(check.result.scoreBreakdown.experienceRelevance.byModel, true);
    // …and say why without calling the model "unavailable" — nothing failed.
    assert.match(check.result.scoreBreakdown.experienceRelevance.reason, /^Heuristic \(the AI review runs on a free account\)/);
    assert.match(check.result.scoreBreakdown.jobAlignment.reason, /^Heuristic \(the AI review runs on a free account\)/);
    assert.deepEqual(check.result.bulletPointSuggestions, []);
  });

  it("refuses bytes that are not a resume with the members' sentence", async () => {
    await assert.rejects(() => checkResumeForVisitor(bytes("hello, this is plainly not a pdf or a docx file at all ".repeat(10)), "application/pdf", { role: "", company: "", jobDescription: "" }), /PDF|DOCX/);
  });
});
