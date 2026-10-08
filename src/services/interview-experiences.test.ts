import { test } from "node:test";
import assert from "node:assert/strict";
import { experienceIdOf, experiencePath } from "./interview-experiences.js";

const ID = "cmg3x8k2p0001abcdefghijkl";

test("an experience's page is the company key, the role and year, then the post id", () => {
  assert.equal(experiencePath(ID, { company: "Amazon", role: "SDE Intern", year: 2025 }), `/interview-experiences/amazon/sde-intern-2025-${ID}`);
  // A company typed another way files under the catalogue's name, as the list filter does.
  assert.equal(experiencePath(ID, { company: "facebook", role: "E4", year: 2026 }), `/interview-experiences/meta/e4-2026-${ID}`);
  assert.equal(experiencePath(ID, { company: "Café Coffee Day", role: "Backend dev (Node.js)", year: 2024 }), `/interview-experiences/cafe-coffee-day/backend-dev-node-js-2024-${ID}`);
});

test("the id is read off the last segment, whatever the words before it say", () => {
  const path = experiencePath(ID, { company: "Amazon", role: "SDE Intern", year: 2025 });
  assert.equal(experienceIdOf(path.split("/")[3]!), ID);
  assert.equal(experienceIdOf(`some-other-words-${ID}`), ID);
  assert.equal(experienceIdOf(ID), ID);
  assert.equal(experienceIdOf("sde-intern-2025"), null);
  assert.equal(experienceIdOf("sde-intern-2025-short"), null);
});
