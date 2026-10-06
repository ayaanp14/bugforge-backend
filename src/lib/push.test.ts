import { describe, it } from "node:test";
import assert from "node:assert/strict";

process.env["TELEMETRY_DISABLED"] = "true";
const { isPushEndpoint, isPushed } = await import("./push.js");

describe("push endpoints", () => {
  it("takes the browsers' push services", () => {
    for (const url of [
      "https://fcm.googleapis.com/fcm/send/abc:def",
      "https://updates.push.services.mozilla.com/wpush/v2/gAAAA",
      "https://web.push.apple.com/QGuQyavXutnMH",
      "https://wns2-par02p.notify.windows.com/w/?token=BQYAAA",
    ]) assert.equal(isPushEndpoint(url), true, url);
  });

  it("refuses anything the API could be steered at", () => {
    for (const url of [
      "http://fcm.googleapis.com/fcm/send/abc", // not https
      "https://fcm.googleapis.com:8443/fcm/send/abc", // a port
      "https://fcm.googleapis.com.evil.example/x", // a look-alike host
      "https://evilpush.apple.com.example/x",
      "https://localhost/push",
      "https://169.254.169.254/latest/meta-data/",
      "https://api.codekairo.com/api/me",
      "not a url",
    ]) assert.equal(isPushEndpoint(url), false, url);
  });
});

describe("pushed types", () => {
  it("pushes reminders and what other people did", () => {
    for (const type of ["streak_at_risk_2026-10-06", "daily_kata_2026-10-06", "study_plan_due_2026-10-06", "battles_reminder:abc", "mention", "comment_reply", "post_comment", "answer_accepted", "new_follower"]) {
      assert.equal(isPushed(type), true, type);
    }
  });

  it("does not push what the account just did on the site, or the noisy ones", () => {
    for (const type of ["welcome", "first_solve", "streak_7", "post_like", "roadmap_stage_cleared:arrays", "weekly_digest_2026-10-05", "skill_credential:CK-1:issued", "mention_extra"]) {
      assert.equal(isPushed(type), false, type);
    }
  });
});
