/**
 * Whether a request's User-Agent belongs to a program rather than a person.
 *
 * Crawlers that render pages run the SPA, and the SPA reports a page view
 * like any reader would. On 2026-09-28 that was 957 of the 973 "visits" in
 * AppEvent: Applebot from 1,404 addresses and Googlebot, one page each, no
 * referrer, all day long — the admin panel's visitor numbers were fifty times
 * the people. Only the Caddy log, which has the User-Agent, could tell them
 * apart; AppEvent keeps no UA. So the ingest drops their batches instead.
 *
 * Crawlers keep full access to the API (robots.ts allows /api/ — without it
 * every rendered page was a soft 404); this only decides what gets counted.
 *
 * Mirrored by AUTOMATED_AGENT in frontend/src/lib/telemetry.ts, which skips
 * the request in the first place. Keep the two in step; this one is the one
 * that counts, because a bundle cached before the frontend copy existed still
 * posts.
 */

const AUTOMATED_AGENT = new RegExp(
  [
    // The two that were ~98% of the page views, then the other search and AI
    // crawlers seen in the wild. Most also match the generic "…bot/" below;
    // naming them keeps the rule readable and survives a UA that drops the slash.
    "applebot",
    "googlebot",
    "google-inspectiontool",
    "googleother",
    "adsbot",
    "mediapartners-google",
    "storebot",
    "bingbot",
    "bingpreview",
    "yandex",
    "baiduspider",
    "duckduckbot",
    "petalbot",
    "bytespider",
    "amazonbot",
    "gptbot",
    "chatgpt",
    "oai-searchbot",
    "claudebot",
    "claude-user",
    "claude-searchbot",
    "perplexity",
    "ccbot",
    "meta-externalagent",
    "facebookexternalhit",
    // Tools that load a page to measure or test it, not to read it
    // (PageSpeed Insights sends "Chrome-Lighthouse").
    "headlesschrome",
    "lighthouse",
    "pagespeed",
    "ptst\\/",
    "gtmetrix",
    "phantomjs",
    "puppeteer",
    "playwright",
    "selenium",
    // Anything else that announces itself: "Twitterbot/1.0", "Slackbot-…",
    // "SomeCrawler". The character after "bot" is required so a phone model
    // containing the letters does not match.
    "crawler",
    "spider",
    "[a-z]bot[\\/\\-;)]",
    "[a-z]bot$",
    // HTTP libraries. okhttp is deliberately absent: it is what the Android
    // app's fetch sends, and that app is people.
    "^(?:curl|wget|python|go-http-client|node-fetch|axios|undici|java\\/|libwww)",
  ].join("|"),
  "i",
);

export function isAutomatedAgent(userAgent: string | string[] | undefined | null): boolean {
  const ua = Array.isArray(userAgent) ? userAgent[0] : userAgent;
  // Every browser sends one; a request without it is a script.
  if (!ua || !ua.trim()) return true;
  // Cubot phones put the brand in the model string ("CUBOT_X30", "CUBOT NOTE 20",
  // "…; CUBOT)"), which the generic "…bot" rule would read as a crawler.
  return AUTOMATED_AGENT.test(ua.replace(/cubot/gi, ""));
}
