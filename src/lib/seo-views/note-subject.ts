/**
 * The first screen of a CS notes subject page (/notes/dbms) as data, for the
 * static-first view the Worker draws from it (frontend
 * lib/seo/views/api/note-subject.ts; the registry and the reasons are in
 * lib/seo-views/index.ts).
 *
 * What NotesSubjectPage shows a visitor, in its order: the eyebrow (the
 * subject's short name), the h1, the blurb, the counts line ("12 notes ·
 * about 3 hours of reading · …"), every note numbered in reading order with
 * its description, level and minutes, "Start with …", then — beside the list
 * from 1200 px, under it below — the subject's skill tests and the other
 * subjects with their blurbs. Every word is the syllabus's
 * (services/cs-notes notesSyllabus), which the page reads too; the reading
 * time is sent already worded because services/seo.ts `readingTime` and the
 * SPA's note-format `readingTime` are the one rule, and the view may not
 * import the SPA's component files.
 *
 * Built in services/seo.ts noteSubjectHead from the syllabus card it has
 * already loaded — no read of its own (2026-10-13).
 */
export interface NoteSubjectView {
  kind: "note-subject";
  key: string;
  title: string;
  short: string;
  blurb: string;
  /** "about 3 hours" — the head's readingTime(card.minutes). */
  reading: string;
  notes: Array<{ slug: string; title: string; description: string; level: string; minutes: number }>;
  tests: Array<{ slug: string; title: string }>;
  /** The other subjects that have notes, in syllabus order (the rail's "Other subjects"). */
  others: Array<{ key: string; title: string; blurb: string; notes: number }>;
}

interface CardLike {
  key: string;
  title: string;
  short: string;
  blurb: string;
  tests: Array<{ slug: string; title: string }>;
  notes: Array<{ slug: string; title: string; description: string; level: string; minutes: number }>;
}

/** The view over the syllabus's cards; `reading` is the head's worded reading time for this subject. */
export function noteSubjectView(card: CardLike, all: readonly CardLike[], reading: string): NoteSubjectView {
  return {
    kind: "note-subject",
    key: card.key,
    title: card.title,
    short: card.short,
    blurb: card.blurb,
    reading,
    notes: card.notes.map((n) => ({ slug: n.slug, title: n.title, description: n.description, level: n.level, minutes: n.minutes })),
    tests: card.tests.map((t) => ({ slug: t.slug, title: t.title })),
    // NotesSubjectPage: `subjects.filter((o) => o.key !== s.key && o.notes.length > 0)`.
    others: all.filter((o) => o.key !== card.key && o.notes.length > 0).map((o) => ({ key: o.key, title: o.title, blurb: o.blurb, notes: o.notes.length })),
  };
}
