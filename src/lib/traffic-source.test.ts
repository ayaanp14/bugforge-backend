import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { classifyTouch, normalizeHost, parseAttribution, pickAcquisition, type Touch } from "./traffic-source.js";

const verdict = (t: Touch) => {
  const c = classifyTouch(t);
  return `${c.channel}:${c.source}`;
};

describe("classifyTouch", () => {
  it("names search engines from their regional hosts and apps", () => {
    assert.equal(verdict({ ref: "www.google.com" }), "search:Google");
    assert.equal(verdict({ ref: "www.google.co.in" }), "search:Google");
    assert.equal(verdict({ ref: "google.com.au" }), "search:Google");
    assert.equal(verdict({ ref: "com.google.android.googlequicksearchbox" }), "search:Google");
    assert.equal(verdict({ app: "GSA/312.0" }), "search:Google");
    assert.equal(verdict({ ref: "www.bing.com" }), "search:Bing");
    assert.equal(verdict({ ref: "duckduckgo.com" }), "search:DuckDuckGo");
    assert.equal(verdict({ ref: "yandex.ru" }), "search:Yandex");
  });

  it("tells AI assistants apart from the search engines of the same company", () => {
    assert.equal(verdict({ ref: "gemini.google.com" }), "ai:Gemini");
    assert.equal(verdict({ ref: "chatgpt.com" }), "ai:ChatGPT");
    assert.equal(verdict({ ref: "chat.openai.com" }), "ai:ChatGPT");
    assert.equal(verdict({ ref: "www.perplexity.ai" }), "ai:Perplexity");
    assert.equal(verdict({ ref: "claude.ai" }), "ai:Claude");
    assert.equal(verdict({ ref: "copilot.microsoft.com" }), "ai:Copilot");
    assert.equal(verdict({ ref: "chat.deepseek.com" }), "ai:DeepSeek");
    assert.equal(verdict({ ref: "com.openai.chatgpt" }), "ai:ChatGPT");
    // ChatGPT stamps its citations with a campaign tag and often no referrer.
    assert.equal(verdict({ utmSource: "chatgpt.com" }), "ai:ChatGPT");
  });

  it("reads social networks from hosts, short links, Android packages and in-app browsers", () => {
    assert.equal(verdict({ ref: "www.linkedin.com" }), "social:LinkedIn");
    assert.equal(verdict({ ref: "lnkd.in" }), "social:LinkedIn");
    assert.equal(verdict({ ref: "com.linkedin.android" }), "social:LinkedIn");
    assert.equal(verdict({ app: "LinkedInApp" }), "social:LinkedIn");
    assert.equal(verdict({ ref: "t.co" }), "social:X (Twitter)");
    assert.equal(verdict({ ref: "l.facebook.com" }), "social:Facebook");
    assert.equal(verdict({ ref: "l.instagram.com" }), "social:Instagram");
    assert.equal(verdict({ app: "Instagram" }), "social:Instagram");
    assert.equal(verdict({ app: "FBAV" }), "social:Facebook");
    assert.equal(verdict({ ref: "out.reddit.com" }), "social:Reddit");
    assert.equal(verdict({ ref: "news.ycombinator.com" }), "social:Hacker News");
    assert.equal(verdict({ ref: "github.com" }), "social:GitHub");
  });

  it("counts messaging apps and shared pages as shared links", () => {
    assert.equal(verdict({ ref: "web.whatsapp.com" }), "shared:WhatsApp");
    assert.equal(verdict({ ref: "com.whatsapp" }), "shared:WhatsApp");
    assert.equal(verdict({ ref: "org.telegram.messenger" }), "shared:Telegram");
    assert.equal(verdict({ ref: "discord.com" }), "shared:Discord");
    assert.equal(verdict({ ref: "classroom.google.com" }), "shared:Google Classroom");
    // WhatsApp sends no referrer: a win card opened with nothing is a link someone sent.
    assert.equal(verdict({ landing: "/share/:id" }), "shared:Link to a shared page");
    assert.equal(verdict({ landing: "/verify/:code" }), "shared:Link to a shared page");
    assert.equal(verdict({ landing: "/pair-room/:roomId" }), "shared:Link to a shared page");
    // …but the same page reached from LinkedIn is LinkedIn.
    assert.equal(verdict({ ref: "www.linkedin.com", landing: "/verify/:code" }), "social:LinkedIn");
  });

  it("puts mail before the search page of the same company", () => {
    assert.equal(verdict({ ref: "mail.google.com" }), "email:Gmail");
    assert.equal(verdict({ ref: "com.google.android.gm" }), "email:Gmail");
    assert.equal(verdict({ ref: "outlook.live.com" }), "email:Outlook");
    assert.equal(verdict({ ref: "mail.yahoo.com" }), "email:Yahoo Mail");
    assert.equal(verdict({ ref: "webmail.example.org" }), "email:Email (other)");
  });

  it("lets campaign tags win, with the medium deciding the channel", () => {
    // The campaign Worker's newsletter links (frontend/campaign/worker/template.ts).
    const c = classifyTouch({ utmSource: "newsletter", utmMedium: "email", utmCampaign: "october" });
    assert.deepEqual(c, { channel: "email", source: "Newsletter", campaign: "october" });
    assert.equal(verdict({ utmSource: "linkedin", utmMedium: "social", ref: "google.com" }), "social:LinkedIn");
    assert.equal(verdict({ utmSource: "facebook", utmMedium: "paid_social" }), "ads:Facebook");
    assert.equal(verdict({ utmSource: "whatsapp", utmMedium: "share" }), "shared:WhatsApp");
    assert.equal(verdict({ utmSource: "college-fest", utmMedium: "poster" }), "campaign:college-fest");
  });

  it("treats an ads click id as paid even under a search referrer", () => {
    assert.equal(verdict({ ref: "www.google.com", click: "gclid" }), "ads:Google Ads");
    assert.equal(verdict({ click: "msclkid" }), "ads:Microsoft Ads");
    // fbclid rides organic links too, so it only speaks when nothing else does.
    assert.equal(verdict({ click: "fbclid" }), "social:Facebook");
    assert.equal(verdict({ ref: "l.instagram.com", click: "fbclid" }), "social:Instagram");
  });

  it("names an unknown site by its host and falls back to direct", () => {
    assert.equal(verdict({ ref: "www.geeksforgeeks.org" }), "referral:geeksforgeeks.org");
    assert.equal(verdict({ ref: "battles.codekairo.com" }), "referral:CodeKairo Battles");
    assert.equal(verdict({ refParam: "producthunt" }), "social:Product Hunt");
    assert.equal(verdict({ landing: "/problems/:slug" }), "direct:No referrer");
    assert.equal(verdict({}), "direct:No referrer");
  });
});

describe("normalizeHost", () => {
  it("drops case, port, www and the redirect subdomains", () => {
    assert.equal(normalizeHost("WWW.Google.COM"), "google.com");
    assert.equal(normalizeHost("localhost:3000"), "localhost");
    assert.equal(normalizeHost("lm.facebook.com"), "facebook.com");
  });
});

describe("pickAcquisition", () => {
  const created = new Date("2026-10-03T10:00:00Z");
  const first = { ref: "www.google.com", landing: "/problems/:slug", at: Date.parse("2026-10-01T08:00:00Z") };
  const last = { landing: "/register", at: Date.parse("2026-10-03T09:55:00Z") };

  it("takes the earliest attribution and says whether it was recorded at signup", () => {
    const a = pickAcquisition(created, [
      { props: { first: { ref: "chatgpt.com", landing: "/", at: 1 }, last: null }, at: new Date("2026-10-09T00:00:00Z") },
      { props: { first, last }, at: new Date("2026-10-03T10:02:00Z") },
    ]);
    assert.ok(a);
    assert.equal(a.first?.source, "Google");
    assert.equal(a.first?.landing, "/problems/:slug");
    assert.equal(a.last?.channel, "direct");
    assert.equal(a.atSignup, true);
  });

  it("marks an account that predates its first attribution", () => {
    const a = pickAcquisition(new Date("2026-06-01T00:00:00Z"), [{ props: { first, last: first }, at: new Date("2026-10-03T10:02:00Z") }]);
    assert.equal(a?.atSignup, false);
    assert.equal(a?.last, null, "the same arrival twice is reported once");
  });

  it("ignores payloads it cannot read", () => {
    assert.equal(parseAttribution({ first: "google" }), null);
    assert.equal(pickAcquisition(created, [{ props: null, at: created }]), null);
  });
});
