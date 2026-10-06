import { prisma } from "../lib/prisma.js";
import { CHANNELS, classifyTouch, parseTouch, pickAcquisition, type Acquisition, type Channel } from "../lib/traffic-source.js";

/**
 * Where people come from, for the admin panel: visits by channel and by
 * source (Google, ChatGPT, LinkedIn, a link shared on WhatsApp …), which of
 * those turned into accounts, and how one account found the site.
 *
 * Two event names carry it (frontend/src/lib/traffic-source.ts):
 *  - `visit` — once per new visit, with the referrer host, campaign tags, the
 *    in-app browser and the landing route. The visit count is a count of these.
 *  - `attribution` — once per account per browser, the first time a session
 *    is held: the browser's first and latest arrival. An account's earliest
 *    one, if sent within a day of signup, is how that account was found.
 *
 * The verdict is lib/traffic-source.ts's, made here at read time over grouped
 * rows, so a better table re-reads history.
 */

const SOURCE_ROWS = 30;
const RECENT_ROWS = 30;

/** A JSON column read through a raw query: the driver may hand back text. */
function json(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

interface GroupRow {
  ref: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  refParam: string | null;
  click: string | null;
  app: string | null;
  device: string | null;
  landing: string | null;
  n: bigint | number;
}

/**
 * The device classes a visit names (frontend lib/traffic-source.ts
 * deviceClass), in the order the panel lists them. "unknown" is a visit
 * recorded before 2026-10-06, when the class was added, or by a client
 * that did not send it.
 */
const DEVICES = ["phone", "tablet", "desktop", "unknown"] as const;
type Device = (typeof DEVICES)[number];
const deviceOf = (value: string | null): Device => (value === "phone" || value === "tablet" || value === "desktop" ? value : "unknown");

export async function trafficReport(since: Date) {
  const [groups, recentRows, signupRows, signupsTotal] = await Promise.all([
    // Grouped on the raw facts: a few hundred rows however many visits there were.
    prisma.$queryRaw<GroupRow[]>`
      SELECT
        JSON_UNQUOTE(JSON_EXTRACT(props, '$.ref')) AS ref,
        JSON_UNQUOTE(JSON_EXTRACT(props, '$.utmSource')) AS utmSource,
        JSON_UNQUOTE(JSON_EXTRACT(props, '$.utmMedium')) AS utmMedium,
        JSON_UNQUOTE(JSON_EXTRACT(props, '$.utmCampaign')) AS utmCampaign,
        JSON_UNQUOTE(JSON_EXTRACT(props, '$.refParam')) AS refParam,
        JSON_UNQUOTE(JSON_EXTRACT(props, '$.click')) AS click,
        JSON_UNQUOTE(JSON_EXTRACT(props, '$.app')) AS app,
        JSON_UNQUOTE(JSON_EXTRACT(props, '$.device')) AS device,
        path AS landing,
        COUNT(*) AS n
      FROM AppEvent
      WHERE name = 'visit' AND createdAt >= ${since}
      GROUP BY ref, utmSource, utmMedium, utmCampaign, refParam, click, app, device, landing`,
    prisma.appEvent.findMany({
      where: { name: "visit", createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: RECENT_ROWS,
      select: { id: true, createdAt: true, props: true, path: true, userId: true },
    }),
    // Every account made in the window with its attribution events (index userId, createdAt).
    prisma.$queryRaw<Array<{ userId: string; createdAt: Date; props: unknown; at: Date | null }>>`
      SELECT u.id AS userId, u.createdAt AS createdAt, e.props AS props, e.createdAt AS at
      FROM User u
      LEFT JOIN AppEvent e ON e.userId = u.id AND e.name = 'attribution'
      WHERE u.createdAt >= ${since}`,
    prisma.user.count({ where: { createdAt: { gte: since } } }),
  ]);

  const channelVisits = new Map<Channel, number>();
  const channelSignups = new Map<Channel, number>();
  const sources = new Map<string, { source: string; channel: Channel; visits: number; signups: number; landings: Map<string, number> }>();
  const campaigns = new Map<string, { campaign: string; source: string; channel: Channel; visits: number }>();
  const sourceRow = (source: string, channel: Channel) => {
    const key = `${channel}|${source}`;
    let row = sources.get(key);
    if (!row) sources.set(key, (row = { source, channel, visits: 0, signups: 0, landings: new Map() }));
    return row;
  };

  const deviceVisits = new Map<Device, number>();
  let visits = 0;
  for (const g of groups) {
    const n = Number(g.n);
    const c = classifyTouch(parseTouch(g) ?? {});
    visits += n;
    const device = deviceOf(g.device);
    deviceVisits.set(device, (deviceVisits.get(device) ?? 0) + n);
    channelVisits.set(c.channel, (channelVisits.get(c.channel) ?? 0) + n);
    const row = sourceRow(c.source, c.channel);
    row.visits += n;
    if (g.landing) row.landings.set(g.landing, (row.landings.get(g.landing) ?? 0) + n);
    if (c.campaign) {
      const key = `${c.campaign}|${c.source}`;
      const camp = campaigns.get(key) ?? { campaign: c.campaign, source: c.source, channel: c.channel, visits: 0 };
      camp.visits += n;
      campaigns.set(key, camp);
    }
  }

  // Signups by the source that first brought them.
  const byUser = new Map<string, { createdAt: Date; rows: Array<{ props: unknown; at: Date }> }>();
  for (const r of signupRows) {
    const entry = byUser.get(r.userId) ?? { createdAt: new Date(r.createdAt), rows: [] };
    if (r.at) entry.rows.push({ props: json(r.props), at: new Date(r.at) });
    byUser.set(r.userId, entry);
  }
  let attributed = 0;
  for (const { createdAt, rows } of byUser.values()) {
    const a = pickAcquisition(createdAt, rows);
    if (!a?.atSignup || !a.first) continue;
    attributed++;
    channelSignups.set(a.first.channel, (channelSignups.get(a.first.channel) ?? 0) + 1);
    sourceRow(a.first.source, a.first.channel).signups++;
  }

  const names = await accountNames(recentRows.map((r) => r.userId));

  return {
    since: since.toISOString(),
    visits,
    signups: { total: signupsTotal, attributed },
    channels: CHANNELS.map((c) => ({ channel: c.id, label: c.label, visits: channelVisits.get(c.id) ?? 0, signups: channelSignups.get(c.id) ?? 0 })),
    // Phones vs laptops — which pages to make phone-first is decided from this.
    devices: DEVICES.map((device) => ({ device, visits: deviceVisits.get(device) ?? 0 })),
    sources: [...sources.values()]
      .sort((a, b) => b.visits - a.visits || b.signups - a.signups)
      .slice(0, SOURCE_ROWS)
      .map(({ landings, ...row }) => ({ ...row, topLanding: [...landings.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null })),
    campaigns: [...campaigns.values()].sort((a, b) => b.visits - a.visits).slice(0, 10),
    recent: recentRows.map((r) => {
      const touch = parseTouch(r.props) ?? {};
      const c = classifyTouch({ ...touch, landing: touch.landing ?? r.path });
      return {
        id: r.id,
        at: r.createdAt.toISOString(),
        channel: c.channel,
        source: c.source,
        campaign: c.campaign,
        ref: touch.ref ?? null,
        landing: r.path,
        user: r.userId ? (names.get(r.userId) ?? { id: r.userId, name: null, username: null }) : null,
      };
    }),
  };
}

async function accountNames(ids: Array<string | null>) {
  const unique = [...new Set(ids.filter((id): id is string => !!id))];
  if (unique.length === 0) return new Map<string, { id: string; name: string | null; username: string | null }>();
  const users = await prisma.user.findMany({ where: { id: { in: unique } }, select: { id: true, name: true, username: true } });
  return new Map(users.map((u) => [u.id, u]));
}

/** "Came from" for a page of the account list: one read for every row. */
export async function cameFromOf(users: ReadonlyArray<{ id: string; createdAt: Date }>) {
  const out = new Map<string, { channel: Channel; source: string; atSignup: boolean } | null>();
  if (users.length === 0) return out;
  const rows = await prisma.appEvent.findMany({
    where: { name: "attribution", userId: { in: users.map((u) => u.id) } },
    select: { userId: true, props: true, createdAt: true },
  });
  for (const u of users) {
    const a = pickAcquisition(
      u.createdAt,
      rows.filter((r) => r.userId === u.id).map((r) => ({ props: r.props, at: r.createdAt })),
    );
    out.set(u.id, a?.first ? { channel: a.first.channel, source: a.first.source, atSignup: a.atSignup } : null);
  }
  return out;
}

/** How one account found the site, and how it has arrived since. */
export async function userTraffic(userId: string, createdAt: Date): Promise<{ acquisition: Acquisition | null; arrivals: Array<{ at: string; channel: Channel; source: string; campaign: string | null; ref: string | null; landing: string | null }> }> {
  const [attributions, visits] = await Promise.all([
    prisma.appEvent.findMany({ where: { userId, name: "attribution" }, orderBy: { createdAt: "asc" }, take: 3, select: { props: true, createdAt: true } }),
    prisma.appEvent.findMany({ where: { userId, name: "visit" }, orderBy: { createdAt: "desc" }, take: 12, select: { props: true, path: true, createdAt: true } }),
  ]);
  return {
    acquisition: pickAcquisition(createdAt, attributions.map((a) => ({ props: a.props, at: a.createdAt }))),
    arrivals: visits.map((v) => {
      const touch = parseTouch(v.props) ?? {};
      const c = classifyTouch({ ...touch, landing: touch.landing ?? v.path });
      return { at: v.createdAt.toISOString(), channel: c.channel, source: c.source, campaign: c.campaign, ref: touch.ref ?? null, landing: v.path };
    }),
  };
}
