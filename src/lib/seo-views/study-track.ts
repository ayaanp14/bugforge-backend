/**
 * The first screen of a study track page (/study-plans/java) as data, for
 * the static-first view the Worker draws from it (frontend
 * lib/seo/views/api/study-track.ts; the registry and the reasons are in
 * lib/seo-views/index.ts).
 *
 * What StudyTrackPage shows a visitor, in its order: the title, the blurb,
 * the counts line, "Read the first lesson", then the syllabus — every module
 * as a heading with its blurb, its count and its PDF, the first one open
 * with its lessons (a visitor has done nothing, so the first module is the
 * "current" one and opens by itself: services/study-plans moduleStatuses) —
 * and from 1200 px the rail's pace table and module list. Only the open
 * module's lessons are sent: the others are closed on the page, their rows
 * not rendered, and the whole track's lesson list would be ~10 KB of HTML
 * nobody sees before the app.
 *
 * Built in services/seo.ts trackHead from the `trackDefinition` it has
 * already loaded — no query of its own (2026-10-13).
 */
export interface StudyTrackView {
  kind: "study-track";
  key: string;
  title: string;
  blurb: string;
  runtime: string;
  lessons: number;
  minutes: number;
  /** The first lesson ("Read the first lesson"), null for an empty track. */
  first: string | null;
  modules: Array<{
    slug: string;
    title: string;
    blurb: string;
    minutes: number;
    lessons: number;
    pdf: string;
    /** Only the first (open) module's rows; [] for the rest. */
    rows: Array<{ slug: string; title: string; test: boolean; minutes: number; exercises: number }>;
  }>;
}

interface TrackLike {
  key: string;
  title: string;
  blurb: string;
  runtime: string;
  modules: Array<{ slug: string; title: string; blurb: string; lessons: Array<{ slug: string; title: string; kind: string; minutes: number; exercises: unknown[] }> }>;
}

/** The view over a loaded track definition; `pdfOf` is services/study-plans pdfPathFor. */
export function studyTrackView(track: TrackLike, pdfOf: (trackKey: string, moduleSlug: string) => string): StudyTrackView {
  // The open module: the first with any lesson (moduleStatuses marks the first not-done module current; a visitor has done none).
  const open = track.modules.findIndex((m) => m.lessons.length > 0);
  const all = track.modules.flatMap((m) => m.lessons);
  return {
    kind: "study-track",
    key: track.key,
    title: track.title,
    blurb: track.blurb,
    runtime: track.runtime,
    lessons: all.length,
    minutes: all.reduce((n, l) => n + l.minutes, 0),
    first: all[0]?.slug ?? null,
    modules: track.modules.map((m, i) => ({
      slug: m.slug,
      title: m.title,
      blurb: m.blurb,
      minutes: m.lessons.reduce((n, l) => n + l.minutes, 0),
      lessons: m.lessons.length,
      pdf: pdfOf(track.key, m.slug),
      rows: i === open ? m.lessons.map((l) => ({ slug: l.slug, title: l.title, test: l.kind === "test", minutes: l.minutes, exercises: l.exercises.length })) : [],
    })),
  };
}
