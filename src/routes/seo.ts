import { Router } from "express";
import { headFor, sitemapXml } from "../services/seo.js";

/**
 * What the site's edge asks the API on a crawler's behalf.
 *
 * Both routes are public and unsigned — the Cloudflare Worker serving
 * codekairo.com calls them, and it holds no platform key (platformGuard
 * exempts /api/seo). They only ever read published content that the SPA
 * shows to visitors anyway, and they answer with cache headers the edge
 * honours, so the API sees one request per URL per hour, not one per crawl.
 *
 *   GET /api/seo/head?path=/problems/two-sum   → { path, title, description }
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
  res.setHeader("Cache-Control", head ? "public, max-age=3600, stale-while-revalidate=86400" : "public, max-age=300");
  if (!head) {
    res.status(404).json({ error: "No public page at that path" });
    return;
  }
  res.json(head);
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
