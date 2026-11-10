import assert from "node:assert/strict";
import { test } from "node:test";
import { videoMail } from "./video-notify.js";

const run = (over: Partial<Parameters<typeof videoMail>[0]>) =>
  videoMail({ id: "r1", status: "done", title: "Two Sum in Hindi", prompt: "two sum", usd: 0.71, error: null, logUrl: null, landscapeId: "L1", shortId: "S1", reelUrl: null, privacy: "public", warnings: [], ...over });

test("a posted run names the video and links both cuts", () => {
  const mail = run({});
  assert.equal(mail.subject, "Posted: Two Sum in Hindi");
  const text = mail.lines.map((l) => `${l.label}: ${l.text}`).join("\n");
  assert.match(text, /youtu\.be\/L1/);
  assert.match(text, /shorts\/S1/);
  assert.match(text, /\$0\.71/);
  assert.match(text, /Pin/);
});

test("a failed run leads with the error and falls back to the prompt for its name", () => {
  const mail = run({ status: "failed", title: null, error: "cue not in narration", landscapeId: null, shortId: null });
  assert.equal(mail.subject, "Video failed: two sum");
  assert.equal(mail.lines[0]!.label, "Error");
  assert.ok(!mail.lines.some((l) => l.label === "To do"));
});

test("a run held for review says so", () => {
  assert.match(run({ status: "needs_review", privacy: "private" }).subject, /^Check this one:/);
});
