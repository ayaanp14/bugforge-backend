import { Router } from "express";
import { headFor, sitemapXml } from "../services/seo.js";
import { battlesHead, battlesIndexHtml, battlesSitemapXml } from "../services/battles-seo.js";

/**
 * What the site's edge asks the API on a crawler's behalf.
 *
 * Both routes are public and unsigned — the Cloudflare Worker serving
 * codekairo.com calls them, and it holds no platform key (platformGuard
 * exempts /api/seo). They only ever read published content that the SPA
 * shows to visitors anyway, and they answer with cache headers the edge
 * honours, so the API sees one request per URL per hour, not one per crawl.
 *
 *   GET /api/seo/head?path=/problems/two-sum   → { path, title, description, content, facts }
 *                                                 { redirect } when the address has moved
 *                                                 or 404 when nothing is there
 *   GET /api/seo/sitemaps/problems.xml         → a sitemap of that content
 */
const router = Router();

router.get("/head", async (req, res) => {
  const raw = typeof req.query["path"] === "string" ? req.query["path"] : "";
  const path = raw.split(/[?#]/)[0].toLowerCase().replace(/\/+$/, "") || "/";
  if (!path.startsWith("/") || path.length > 200) {
    res.status(400).json({ error: "path must be an absolute site path" });
    return;
  }
  const head = await headFor(path);
  // An hour for a page or a redirect, five minutes for a miss: content
  // appears by seeding, and a 404 must not outlive the seed by much.
  res.setHeader("Cache-Control", head ? "public, max-age=3600, stale-while-revalidate=86400" : "public, max-age=300");
  if (!head) {
    res.status(404).json({ error: "No public page at that path" });
    return;
  }
  res.json(head);
});

/**
 * The same two lookups for the tournament site (battles.codekairo.com,
 * services/battles-seo): a tournament's or an organizer's head, and the
 * sitemaps of both. Ten minutes at the edge rather than an hour — a
 * tournament's places and phase move while registration is open.
 *
 * Every answer carries `X-Battles-Seo: 1`. The Worker trusts a 404 only
 * when it has it, so a Worker deployed ahead of this route (whose 404 is
 * the API's generic one) serves the app rather than calling every
 * tournament missing.
 */
router.get("/battles/head", async (req, res) => {
  const raw = typeof req.query["path"] === "string" ? req.query["path"] : "";
  const path = raw.split(/[?#]/)[0].toLowerCase().replace(/\/+$/, "") || "/";
  res.setHeader("X-Battles-Seo", "1");
  if (!path.startsWith("/") || path.length > 200) {
    res.status(400).json({ error: "path must be an absolute site path" });
    return;
  }
  const head = await battlesHead(path);
  res.setHeader("Cache-Control", head ? "public, max-age=600, stale-while-revalidate=3600" : "public, max-age=300");
  if (!head) {
    res.status(404).json({ error: "No public page at that path" });
    return;
  }
  res.json(head);
});

/** Every public tournament and organizer as links, for the prerendered /tournaments and home pages. */
router.get("/battles/index", async (_req, res) => {
  res.setHeader("X-Battles-Seo", "1");
  res.setHeader("Cache-Control", "public, max-age=600, stale-while-revalidate=3600");
  res.json({ content: await battlesIndexHtml() });
});

router.get("/battles/sitemaps/:name.xml", async (req, res) => {
  const body = await battlesSitemapXml(req.params["name"] ?? "");
  res.setHeader("X-Battles-Seo", "1");
  if (body === null) {
    res.status(404).type("text/plain").send("No such sitemap");
    return;
  }
  res.setHeader("Cache-Control", "public, max-age=900, stale-while-revalidate=86400");
  res.type("application/xml").send(body);
});

router.get("/sitemaps/:name.xml", async (req, res) => {
  const xml = await sitemapXml(req.params["name"] ?? "");
  if (xml === null) {
    res.status(404).type("text/plain").send("No such sitemap");
    return;
  }
  res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
  res.type("application/xml").send(xml);
});

export default router;
