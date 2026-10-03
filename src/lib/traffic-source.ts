/**
 * Where a visit came from: Google, ChatGPT, LinkedIn, a link shared on
 * WhatsApp, a newsletter — read from the facts the browser can see when a
 * visit starts (frontend/src/lib/traffic-source.ts sends them as the `visit`
 * event, and the first and latest of them as `attribution` once the visitor
 * signs in).
 *
 * The browser sends raw facts, never a verdict: the referrer's host, the
 * campaign tags, a click id's *name*, an in-app browser's token, the landing
 * route. The verdict is made here, at read time, so a better table re-reads
 * every visit already stored — the admin panel is the only reader, and it
 * reads a few hundred grouped rows.
 *
 * What a referrer can and cannot tell:
 *  - Search engines and AI assistants send their origin (google.co.in,
 *    chatgpt.com, gemini.google.com, perplexity.ai). ChatGPT also stamps
 *    `utm_source=chatgpt.com` on the links it cites.
 *  - An Android app that hands a link to Chrome shows as
 *    `android-app://<package>` — the package is matched like a host.
 *  - LinkedIn, Instagram and Facebook open links in their own browser, which
 *    often sends no referrer at all; the User-Agent token is what is left.
 *  - WhatsApp, Telegram desktop and most mail apps send nothing. Such a visit
 *    is "direct" unless it lands on a page that only exists to be shared
 *    (a win card, a credential, a profile, a pair-room invite) — then it was
 *    a shared link, whatever app carried it.
 */

export type Channel = "search" | "ai" | "social" | "shared" | "email" | "referral" | "campaign" | "ads" | "direct";

/** Display order and names for the admin panel. */
export const CHANNELS: ReadonlyArray<{ id: Channel; label: string }> = [
  { id: "search", label: "Search engines" },
  { id: "ai", label: "AI assistants" },
  { id: "social", label: "Social media" },
  { id: "shared", label: "Shared links" },
  { id: "email", label: "Email" },
  { id: "referral", label: "Other websites" },
  { id: "campaign", label: "Tagged campaigns" },
  { id: "ads", label: "Ads" },
  { id: "direct", label: "Direct or unknown" },
];

/** What the browser recorded about one arrival. Every field is optional except where it landed. */
export interface Touch {
  /** The referrer's host (`www.google.co.in`) or an Android app's package (`com.linkedin.android`). */
  ref?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  /** A `?ref=` parameter (Product Hunt appends `ref=producthunt`). */
  refParam?: string | null;
  /** The *name* of the click id on the URL (gclid, fbclid …) — never its value. */
  click?: string | null;
  /** The in-app browser token in the User-Agent (LinkedInApp, Instagram, FBAV, GSA/ …). */
  app?: string | null;
  /** The landing route pattern (`/problems/:slug`). */
  landing?: string | null;
}

export interface Classified {
  channel: Channel;
  /** A name a person recognises: "Google", "ChatGPT", "WhatsApp", or the site's host. */
  source: string;
  /** The campaign, when one was tagged. */
  campaign: string | null;
}

/* ── the host table ─────────────────────────────────────────────────── */

type Matcher = (host: string) => boolean;

/** host is the domain or a subdomain of it. Android packages are listed whole and match exactly. */
const domains =
  (...list: string[]): Matcher =>
  (host) =>
    list.some((d) => host === d || host.endsWith(`.${d}`));

/** google.com, google.co.in, google.com.au, google.de … */
const GOOGLE = /^(?:[a-z0-9-]+\.)*google\.(?:com|co\.[a-z]{2}|com\.[a-z]{2}|[a-z]{2})$/;
const YANDEX = /^(?:[a-z0-9-]+\.)*(?:yandex\.[a-z.]{2,6}|ya\.ru)$/;
const PINTEREST = /^(?:[a-z0-9-]+\.)*pinterest\.(?:com|co\.[a-z]{2}|[a-z]{2})$|^pin\.it$/;

/**
 * First match wins, so the specific comes before the general: Gemini and
 * Gmail before Google search, a mail host before its company's search page.
 */
const RULES: ReadonlyArray<readonly [Matcher, string, Channel]> = [
  // AI assistants
  [domains("chatgpt.com", "chat.openai.com", "openai.com", "com.openai.chatgpt"), "ChatGPT", "ai"],
  [domains("gemini.google.com", "bard.google.com", "com.google.android.apps.bard"), "Gemini", "ai"],
  [domains("claude.ai", "claude.com", "com.anthropic.claude"), "Claude", "ai"],
  [domains("perplexity.ai", "ai.perplexity.app.android"), "Perplexity", "ai"],
  [domains("copilot.microsoft.com", "copilot.cloud.microsoft", "edgeservices.bing.com", "com.microsoft.copilot"), "Copilot", "ai"],
  [domains("deepseek.com", "com.deepseek.chat"), "DeepSeek", "ai"],
  [domains("grok.com", "ai.x.grok"), "Grok", "ai"],
  [domains("meta.ai"), "Meta AI", "ai"],
  [domains("you.com"), "You.com", "ai"],
  [domains("phind.com"), "Phind", "ai"],
  [domains("chat.mistral.ai"), "Mistral", "ai"],
  [domains("poe.com"), "Poe", "ai"],
  [domains("kimi.com", "kimi.moonshot.cn"), "Kimi", "ai"],
  [domains("chat.qwen.ai"), "Qwen", "ai"],
  [domains("duck.ai"), "Duck.ai", "ai"],

  // Email
  [domains("mail.google.com", "inbox.google.com", "com.google.android.gm"), "Gmail", "email"],
  [domains("outlook.live.com", "outlook.office.com", "outlook.office365.com", "outlook.cloud.microsoft", "com.microsoft.office.outlook"), "Outlook", "email"],
  [domains("mail.yahoo.com", "com.yahoo.mobile.client.android.mail"), "Yahoo Mail", "email"],
  [domains("mail.zoho.com", "mail.zoho.in"), "Zoho Mail", "email"],
  [domains("mail.proton.me", "ch.protonmail.android"), "Proton Mail", "email"],
  [(h) => /^(?:web)?mail\./.test(h), "Email (other)", "email"],

  // Shared links: messaging apps, class and document links
  [domains("whatsapp.com", "wa.me", "com.whatsapp", "com.whatsapp.w4b"), "WhatsApp", "shared"],
  [domains("telegram.org", "t.me", "telegram.me", "org.telegram.messenger", "org.telegram.messenger.web", "org.thunderdog.challegram"), "Telegram", "shared"],
  [domains("discord.com", "discord.gg", "discordapp.com", "com.discord"), "Discord", "shared"],
  [domains("slack.com", "com.slack"), "Slack", "shared"],
  [domains("messenger.com", "com.facebook.orca"), "Messenger", "shared"],
  [domains("teams.microsoft.com", "teams.live.com", "teams.cloud.microsoft", "com.microsoft.teams"), "Microsoft Teams", "shared"],
  [domains("signal.org", "org.thoughtcrime.securesms"), "Signal", "shared"],
  [domains("classroom.google.com", "com.google.android.apps.classroom"), "Google Classroom", "shared"],
  [domains("docs.google.com", "drive.google.com", "sites.google.com"), "Google Docs", "shared"],
  [domains("notion.so", "notion.site"), "Notion", "shared"],

  // Search engines (the Google app on Android and iOS too)
  [domains("news.google.com"), "Google News", "search"],
  [domains("com.google.android.googlequicksearchbox"), "Google", "search"],
  [(h) => GOOGLE.test(h), "Google", "search"],
  [domains("bing.com", "com.microsoft.bing"), "Bing", "search"],
  [domains("duckduckgo.com", "com.duckduckgo.mobile.android"), "DuckDuckGo", "search"],
  [domains("yahoo.com", "yahoo.co.jp"), "Yahoo", "search"],
  [(h) => YANDEX.test(h), "Yandex", "search"],
  [domains("baidu.com"), "Baidu", "search"],
  [domains("ecosia.org"), "Ecosia", "search"],
  [domains("search.brave.com"), "Brave Search", "search"],
  [domains("naver.com"), "Naver", "search"],
  [domains("startpage.com"), "Startpage", "search"],
  [domains("qwant.com"), "Qwant", "search"],
  [domains("kagi.com"), "Kagi", "search"],
  [domains("seznam.cz"), "Seznam", "search"],
  [domains("search.aol.com"), "AOL", "search"],

  // Social networks and developer communities
  [domains("linkedin.com", "lnkd.in", "com.linkedin.android"), "LinkedIn", "social"],
  [domains("x.com", "twitter.com", "t.co", "com.twitter.android"), "X (Twitter)", "social"],
  [domains("instagram.com", "com.instagram.android"), "Instagram", "social"],
  [domains("threads.net", "threads.com", "com.instagram.barcelona"), "Threads", "social"],
  [domains("facebook.com", "fb.com", "fb.me", "com.facebook.katana", "com.facebook.lite"), "Facebook", "social"],
  [domains("reddit.com", "redd.it", "com.reddit.frontpage"), "Reddit", "social"],
  [domains("youtube.com", "youtu.be", "com.google.android.youtube"), "YouTube", "social"],
  [domains("quora.com"), "Quora", "social"],
  [domains("medium.com"), "Medium", "social"],
  [domains("news.ycombinator.com"), "Hacker News", "social"],
  [domains("dev.to"), "DEV", "social"],
  [domains("hashnode.com", "hashnode.dev"), "Hashnode", "social"],
  [domains("producthunt.com"), "Product Hunt", "social"],
  [domains("github.com"), "GitHub", "social"],
  [domains("stackoverflow.com", "stackexchange.com"), "Stack Overflow", "social"],
  [domains("tiktok.com", "com.zhiliaoapp.musically"), "TikTok", "social"],
  [domains("snapchat.com", "com.snapchat.android"), "Snapchat", "social"],
  [domains("bsky.app"), "Bluesky", "social"],
  [(h) => PINTEREST.test(h), "Pinterest", "social"],

  // Our own other sites
  [domains("battles.codekairo.com"), "CodeKairo Battles", "referral"],
];

/** An in-app browser's User-Agent token (as the frontend matched it, lowercased) → who it belongs to. */
const APP_TOKENS: ReadonlyArray<readonly [RegExp, string, Channel]> = [
  [/^linkedinapp/, "LinkedIn", "social"],
  [/^instagram/, "Instagram", "social"],
  [/^(?:fban|fbav|fb_iab|fbios)/, "Facebook", "social"],
  [/^snapchat/, "Snapchat", "social"],
  [/^twitter/, "X (Twitter)", "social"],
  [/^(?:musical_ly|bytedancewebview|tiktok)/, "TikTok", "social"],
  [/^pinterest/, "Pinterest", "social"],
  [/^whatsapp/, "WhatsApp", "shared"],
  [/^telegram/, "Telegram", "shared"],
  [/^discord/, "Discord", "shared"],
  [/^line\//, "LINE", "shared"],
  [/^micromessenger/, "WeChat", "shared"],
  [/^gsa\//, "Google", "search"],
];

/** A word a campaign tag uses for a source → a host the table knows. */
const SOURCE_ALIASES: Record<string, string> = {
  google: "google.com",
  bing: "bing.com",
  yahoo: "yahoo.com",
  duckduckgo: "duckduckgo.com",
  ddg: "duckduckgo.com",
  chatgpt: "chatgpt.com",
  openai: "chatgpt.com",
  gemini: "gemini.google.com",
  bard: "gemini.google.com",
  claude: "claude.ai",
  perplexity: "perplexity.ai",
  copilot: "copilot.microsoft.com",
  deepseek: "deepseek.com",
  grok: "grok.com",
  linkedin: "linkedin.com",
  twitter: "x.com",
  x: "x.com",
  facebook: "facebook.com",
  fb: "facebook.com",
  instagram: "instagram.com",
  ig: "instagram.com",
  threads: "threads.net",
  reddit: "reddit.com",
  youtube: "youtube.com",
  yt: "youtube.com",
  quora: "quora.com",
  medium: "medium.com",
  hackernews: "news.ycombinator.com",
  hn: "news.ycombinator.com",
  producthunt: "producthunt.com",
  product_hunt: "producthunt.com",
  github: "github.com",
  whatsapp: "whatsapp.com",
  wa: "whatsapp.com",
  telegram: "telegram.org",
  tg: "telegram.org",
  discord: "discord.com",
  slack: "slack.com",
  gmail: "mail.google.com",
  outlook: "outlook.live.com",
  tiktok: "tiktok.com",
};

/** A click id's name → the network that adds it. Ads ids are paid clicks; the social ones are added to organic links too. */
const CLICK_IDS: Record<string, readonly [string, Channel]> = {
  gclid: ["Google Ads", "ads"],
  gbraid: ["Google Ads", "ads"],
  wbraid: ["Google Ads", "ads"],
  dclid: ["Google Ads", "ads"],
  msclkid: ["Microsoft Ads", "ads"],
  li_fat_id: ["LinkedIn Ads", "ads"],
  ttclid: ["TikTok Ads", "ads"],
};
const SOCIAL_CLICK_IDS: Record<string, readonly [string, Channel]> = {
  fbclid: ["Facebook", "social"],
  twclid: ["X (Twitter)", "social"],
  // Google adds srsltid to organic results for some pages.
  srsltid: ["Google", "search"],
};

const PAID_MEDIUM = /^(?:cpc|ppc|cpm|paid(?:[-_ ]?(?:search|social|media))?|display|banner|ads?|sponsored|retargeting)$/;
const EMAIL_MEDIUM = /^(?:e-?mail|newsletter|mail)$/;
const SHARE_MEDIUM = /^(?:share|shared|social[-_]?share|invite)$/;

/**
 * Pages that exist to be passed around: a win card, a credential's proof, a
 * public profile, a post's permalink, an invite into a room or a duel. Landed
 * on with no referrer, someone sent the link.
 */
export const SHARED_LANDINGS: ReadonlySet<string> = new Set([
  "/share/:id",
  "/verify/:code",
  "/u/:username",
  "/community/p/:id",
  "/pair-room/:roomId",
  "/duels/:id",
]);

/* ── classification ─────────────────────────────────────────────────── */

/** A host as the table expects it: lower case, no port, no leading `www.` or `m.`. */
export function normalizeHost(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, "")
    .replace(/^(?:www\d?|m|l|lm|out)\./, "")
    .replace(/\.$/, "");
}

function byHost(host: string): { source: string; channel: Channel } | null {
  for (const [match, source, channel] of RULES) if (match(host)) return { source, channel };
  if (host === "codekairo.com" || host.endsWith(".codekairo.com")) return { source: `CodeKairo (${host})`, channel: "referral" };
  return null;
}

/** A campaign's source word or host → a known source, or null. */
function byTag(tag: string): { source: string; channel: Channel } | null {
  const word = normalizeHost(tag);
  return byHost(word) ?? (SOURCE_ALIASES[word] ? byHost(SOURCE_ALIASES[word]) : null);
}

const clean = (v: unknown, max = 100): string | null => {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s && s !== "null" ? s.slice(0, max) : null;
};

/** A stored touch (an event's props, or one half of an attribution) read defensively. */
export function parseTouch(value: unknown): Touch | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  return {
    ref: clean(v["ref"]),
    utmSource: clean(v["utmSource"], 64),
    utmMedium: clean(v["utmMedium"], 64),
    utmCampaign: clean(v["utmCampaign"], 64),
    refParam: clean(v["refParam"], 64),
    click: clean(v["click"], 16),
    app: clean(v["app"], 32),
    landing: clean(v["landing"], 120),
  };
}

/**
 * The verdict for one arrival. Order of evidence, strongest first:
 *  1. Campaign tags — someone wrote them on purpose (the newsletter, ChatGPT's
 *     own `utm_source`). The medium decides email / ads / shared; the source
 *     names it.
 *  2. An ads click id — a paid click, even when the referrer says google.com.
 *  3. The referrer.
 *  4. The in-app browser, then a social click id (both survive a hidden referrer).
 *  5. A `?ref=` word.
 *  6. Nothing at all: a shared page means a shared link; anything else is direct.
 */
export function classifyTouch(t: Touch): Classified {
  const campaign = t.utmCampaign ?? null;
  const utmSource = t.utmSource?.toLowerCase() ?? null;
  const utmMedium = t.utmMedium?.toLowerCase() ?? null;

  if (utmSource || utmMedium) {
    const known = utmSource ? byTag(utmSource) : null;
    const named = known?.source ?? (utmSource ? t.utmSource!.slice(0, 40) : "(untagged source)");
    if (utmMedium && PAID_MEDIUM.test(utmMedium)) return { channel: "ads", source: named, campaign };
    if (utmMedium && EMAIL_MEDIUM.test(utmMedium)) return { channel: "email", source: utmSource === "newsletter" ? "Newsletter" : named, campaign };
    if (utmMedium && SHARE_MEDIUM.test(utmMedium)) return { channel: "shared", source: named, campaign };
    if (utmSource === "newsletter") return { channel: "email", source: "Newsletter", campaign };
    if (known) return { channel: known.channel, source: known.source, campaign };
    return { channel: "campaign", source: named, campaign };
  }

  const click = t.click?.toLowerCase() ?? null;
  if (click && CLICK_IDS[click]) {
    const [source, channel] = CLICK_IDS[click];
    return { channel, source, campaign };
  }

  if (t.ref) {
    const host = normalizeHost(t.ref);
    const known = byHost(host);
    if (known) return { ...known, campaign };
    if (host) return { channel: "referral", source: host, campaign };
  }

  if (t.app) {
    const token = t.app.toLowerCase();
    for (const [re, source, channel] of APP_TOKENS) if (re.test(token)) return { channel, source, campaign };
  }

  if (click && SOCIAL_CLICK_IDS[click]) {
    const [source, channel] = SOCIAL_CLICK_IDS[click];
    return { channel, source, campaign };
  }

  if (t.refParam) {
    const known = byTag(t.refParam.toLowerCase());
    return known ? { ...known, campaign } : { channel: "campaign", source: t.refParam.slice(0, 40), campaign };
  }

  if (t.landing && SHARED_LANDINGS.has(t.landing)) return { channel: "shared", source: "Link to a shared page", campaign };
  return { channel: "direct", source: "No referrer", campaign };
}

export const channelLabel = (id: Channel): string => CHANNELS.find((c) => c.id === id)?.label ?? id;

/* ── attribution ────────────────────────────────────────────────────── */

/** One `attribution` event's payload: the browser's first and latest arrival, each stamped with when (client ms). */
export interface Attribution {
  first: (Touch & { at: number | null }) | null;
  last: (Touch & { at: number | null }) | null;
}

export function parseAttribution(props: unknown): Attribution | null {
  if (!props || typeof props !== "object") return null;
  const p = props as Record<string, unknown>;
  const read = (v: unknown) => {
    const touch = parseTouch(v);
    if (!touch) return null;
    const at = (v as Record<string, unknown>)["at"];
    return { ...touch, at: typeof at === "number" && Number.isFinite(at) ? at : null };
  };
  const first = read(p["first"]);
  const last = read(p["last"]);
  return first || last ? { first, last } : null;
}

/**
 * How long after an account is created its first attribution can still be
 * the story of how it was found. The event is sent when the browser first
 * holds the new session — at once for a social sign-in, after the emailed
 * code for a password one (usually minutes; a day is generous). An account
 * that predates traffic sources reports its device's first visit *since*
 * then, which is not how it found the site.
 */
export const SIGNUP_ATTRIBUTION_WINDOW_MS = 24 * 3_600_000;

export interface Acquisition {
  /** The source that first brought this browser here. */
  first: (Classified & { landing: string | null; at: string | null }) | null;
  /** The arrival nearest the sign-in, when it differs from the first. */
  last: (Classified & { landing: string | null; at: string | null }) | null;
  /** When the attribution was recorded. */
  recordedAt: string;
  /** Recorded around signup — so `first` is how the account was found. */
  atSignup: boolean;
}

/** The account's acquisition from its attribution events (any order): the earliest one wins. */
export function pickAcquisition(createdAt: Date, rows: ReadonlyArray<{ props: unknown; at: Date }>): Acquisition | null {
  const sorted = [...rows].sort((a, b) => a.at.getTime() - b.at.getTime());
  for (const row of sorted) {
    const attribution = parseAttribution(row.props);
    if (!attribution) continue;
    const describe = (t: Attribution["first"]) =>
      t ? { ...classifyTouch(t), landing: t.landing ?? null, at: t.at ? new Date(t.at).toISOString() : null } : null;
    const first = describe(attribution.first ?? attribution.last);
    const last = describe(attribution.last);
    const same = first && last && first.source === last.source && first.at === last.at;
    return {
      first,
      last: same ? null : last,
      recordedAt: row.at.toISOString(),
      atSignup: row.at.getTime() - createdAt.getTime() <= SIGNUP_ATTRIBUTION_WINDOW_MS,
    };
  }
  return null;
}
