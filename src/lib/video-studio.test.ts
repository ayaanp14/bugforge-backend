import assert from "node:assert/strict";
import { test } from "node:test";
import { AUTO_TOPICS, REEL_FILE, decideClaim, nextStatus, obviousRepeat, reelOnAccount, titleKey, topicKey, videoPeriod, type PostedRow } from "./video-studio.js";

const row = (over: Partial<PostedRow>): PostedRow => ({ youtubeId: "yt1", title: "Two Sum", titleKey: "two sum", sha256: null, runId: null, ...over });
const claim = (over: Partial<Parameters<typeof decideClaim>[0]>) =>
  decideClaim({ runId: "run", existingId: null, claimedAt: null, title: "New video", sha256: "abc", posted: [], ...over });

test("a title's key ignores case, punctuation and hashtags", () => {
  assert.equal(titleKey("Two Sum!! Explained #coding #dsa"), "two sum explained");
});

test("a topic's key ignores filler words, so plain repeats match", () => {
  assert.equal(topicKey("Explain two sum"), topicKey("Two Sum tutorial"));
  assert.notEqual(topicKey("Two Sum"), topicKey("Three Sum"));
});

test("an obvious repeat is found, and a different topic is not", () => {
  assert.equal(obviousRepeat("explain binary search", ["Two Sum", "Binary Search"]), "Binary Search");
  assert.equal(obviousRepeat("binary search on the answer", ["Binary Search"]), null);
  assert.equal(obviousRepeat("the", ["The"]), null);
});

test("a cut this run already posted is never uploaded again", () => {
  assert.deepEqual(claim({ existingId: "yt9" }), { kind: "already", videoId: "yt9" });
});

test("a title already on the channel from elsewhere is refused", () => {
  const decision = claim({ title: "Two Sum #coding", posted: [row({})] });
  assert.equal(decision.kind, "refuse");
});

test("the same bytes from another run are refused, whatever the title", () => {
  const decision = claim({ posted: [row({ title: "Other", titleKey: "other", sha256: "abc", runId: "older" })] });
  assert.equal(decision.kind, "refuse");
});

test("an upload that finished before the job died is adopted, not posted again", () => {
  const decision = claim({ title: "Two Sum", claimedAt: new Date(), posted: [row({})] });
  assert.deepEqual(decision, { kind: "already", videoId: "yt1" });
});

test("without an earlier claim, that same title is someone else's and refused", () => {
  assert.equal(claim({ title: "Two Sum", claimedAt: null, posted: [row({})] }).kind, "refuse");
});

test("a new video may upload", () => {
  assert.deepEqual(claim({ posted: [row({})] }), { kind: "upload" });
});

test("a late failure report cannot unmark a finished publish", () => {
  assert.equal(nextStatus("done", "failed"), "done");
  assert.equal(nextStatus("needs_review", "failed"), "needs_review");
  assert.equal(nextStatus("rendering", "failed"), "failed");
  assert.equal(nextStatus("rendering", "uploading"), "uploading");
});

test("the job is due only in the half hour from 07:00 IST", () => {
  assert.equal(videoPeriod(7, 0, "2026-11-06"), "2026-11-06");
  assert.equal(videoPeriod(7, 29, "2026-11-06"), "2026-11-06");
  assert.equal(videoPeriod(7, 30, "2026-11-06"), null);
  assert.equal(videoPeriod(6, 59, "2026-11-06"), null);
  assert.equal(videoPeriod(10, 0, "2026-11-06"), null);
});

test("the automatic topics hold no repeat of each other", () => {
  assert.equal(new Set(AUTO_TOPICS.map(topicKey)).size, AUTO_TOPICS.length);
});

test("a reel already on the account is found by its caption's first line", () => {
  const media = [
    { id: "1", caption: "Binary Search in 60 Seconds\n\nmore text #dsa" },
    { id: "2", caption: "Kadane's Algorithm in 60 Seconds!\n\nMaximum subarray #coding" },
    { id: "3" },
  ];
  assert.equal(reelOnAccount("kadane's algorithm in 60 seconds", media)?.id, "2");
  assert.equal(reelOnAccount("Two Pointers in 60 Seconds", media), null);
  // A title made only of punctuation matches nothing, not every caption-less reel.
  assert.equal(reelOnAccount("!!", media), null);
});

test("a reel file name is the random kind the API makes, never a path", () => {
  assert.ok(REEL_FILE.test("abcdefghijklmnopqrstuvwxyz012345.mp4"));
  assert.ok(!REEL_FILE.test("../../etc/passwd.mp4"));
  assert.ok(!REEL_FILE.test("abcdefghijklmnopqrstuvwxyz01234.mp4"));
  assert.ok(REEL_FILE.test("abcdefghijklmnopqrstuvwxyz012345.jpg"));
  assert.ok(!REEL_FILE.test("abcdefghijklmnopqrstuvwxyz012345.html"));
});
