// Before any import: the service reaches prisma and telemetry at module
// load; nothing here touches the database.
process.env["TELEMETRY_DISABLED"] = "true";

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { writePath } from "./resumes.js";
import { parseResumeText, readPath } from "../lib/resume-parse.js";
import { SAMPLE } from "../lib/resume-parse.test.js";

/**
 * The pure part of the resume service: applying an accepted suggestion to
 * the content by path. Ownership and the job runner are exercised against
 * a live server by scratch/smoke-resumes.mts and the Playwright suite.
 *
 * Run with: npm test
 */

const { content } = parseResumeText(SAMPLE);

describe("writePath", () => {
  it("replaces one bullet and nothing else", () => {
    const next = writePath(content, "experience.0.bullets.2", "Migrated a monolith to microservices on Kubernetes");
    assert.equal(readPath(next, "experience.0.bullets.2"), "Migrated a monolith to microservices on Kubernetes");
    assert.equal(readPath(content, "experience.0.bullets.2"), "Worked on migrating a monolith to microservices on Kubernetes");
    assert.deepEqual(next.experience[0].bullets.slice(0, 2), content.experience[0].bullets.slice(0, 2));
    assert.deepEqual(next.projects, content.projects);
  });
  it("writes the summary, an achievement and a custom bullet", () => {
    const withCustom = { ...content, customSections: [{ id: "c1", title: "Extra", bullets: ["old"] }] };
    assert.equal(writePath(withCustom, "summary", "New summary").summary, "New summary");
    assert.equal(writePath(withCustom, "achievements.1", "Solved 600+ problems").achievements[1], "Solved 600+ problems");
    assert.equal(writePath(withCustom, "customSections.0.bullets.0", "new").customSections[0].bullets[0], "new");
  });
  it("ignores a path that addresses nothing", () => {
    assert.deepEqual(writePath(content, "experience.7.bullets.0", "x"), content);
    assert.deepEqual(writePath(content, "basics.name", "x"), content);
    assert.deepEqual(writePath(content, "unplaced", "x"), content);
  });
});
