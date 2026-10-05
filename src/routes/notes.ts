import { Router } from "express";
import { browserCache, SEEDED_CONTENT_MAX_AGE } from "../lib/http-cache.js";
import { NOTE_SLUG } from "../lib/cs-notes.js";
import { notePage, notesSyllabus } from "../services/cs-notes.js";

/**
 * /api/notes — the CS fundamentals notes (lib/cs-notes): caller-free reads
 * of files shipped in the image, shared-cached like the roadmap lessons.
 */
export const notesRouter = Router();

notesRouter.get("/", browserCache(SEEDED_CONTENT_MAX_AGE, { shared: true }), (_req, res) => {
  res.json(notesSyllabus());
});

notesRouter.get("/:subject/:slug", browserCache(SEEDED_CONTENT_MAX_AGE, { shared: true }), (req, res) => {
  const subject = String(req.params["subject"] ?? "");
  const slug = String(req.params["slug"] ?? "");
  const page = NOTE_SLUG.test(subject) && NOTE_SLUG.test(slug) ? notePage(subject, slug) : null;
  if (!page) {
    res.removeHeader("Cache-Control");
    res.status(404).json({ error: "There is no note at this address." });
    return;
  }
  res.json(page);
});
