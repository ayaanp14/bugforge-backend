import { NOTE_SUBJECTS, allNotes, noteBlocks, noteBy, noteSummary, notesFor, subjectByKey, type NoteFormat, type NoteSummary } from "../lib/cs-notes.js";
import { DESIGN_PROBLEMS } from "../lib/design-practice.js";
import { noteFigure } from "../lib/note-figures/index.js";
import { credentialName } from "../lib/skill-catalog.js";
import type { Walkthrough } from "../lib/walkthroughs/core.js";

/**
 * The CS notes' pages (lib/cs-notes reads the files). Everything here is a
 * pure function of the shipped files, so it needs no cache of its own beyond
 * the process: the files are read once.
 */

export interface SubjectCard {
  key: string;
  title: string;
  short: string;
  blurb: string;
  seoTitle: string;
  description: string;
  tests: Array<{ slug: string; title: string }>;
  /** article: prose with figures; points: bullet points over looping animations (System Design). */
  format: NoteFormat;
  notes: NoteSummary[];
  minutes: number;
}

const testsOf = (slugs: string[]) =>
  slugs.map((slug) => {
    const [skill, level] = [slug.slice(0, slug.lastIndexOf("-")), slug.slice(slug.lastIndexOf("-") + 1)];
    return { slug, title: credentialName(skill, level) };
  });

/** Every subject with its notes in reading order — the /notes index and every page's sidebar. */
export function notesSyllabus(): { subjects: SubjectCard[] } {
  return {
    subjects: NOTE_SUBJECTS.map((s) => {
      const notes = notesFor(s.key).map(noteSummary);
      return {
        key: s.key,
        title: s.title,
        short: s.short,
        blurb: s.blurb,
        seoTitle: s.seoTitle,
        description: s.description,
        tests: testsOf(s.tests),
        format: s.format,
        notes,
        minutes: notes.reduce((t, n) => t + n.minutes, 0),
      };
    }),
  };
}

export interface NotePage {
  note: {
    subject: string;
    slug: string;
    title: string;
    minutes: number;
    level: string;
    updated: string;
    body: string;
    seo: { title: string; description: string; question: string; answer: string; faq: Array<{ q: string; a: string }> };
  };
  subject: { key: string; title: string; short: string; format: NoteFormat };
  position: number;
  count: number;
  prev: NoteSummary | null;
  next: NoteSummary | null;
  /** The figures the body places, by name. */
  figures: Record<string, Walkthrough>;
  tests: Array<{ slug: string; title: string }>;
  /**
   * Learn → practise → interview (2026-11-14): on a System Design or LLD note,
   * the design problem that practises it on the canvas (lib/design-practice,
   * by its `note`) and the interview round to defend it in, on this topic.
   * Null on the four CS subjects.
   */
  practice: {
    designSlug: string | null;
    round: "system-design-interview" | "low-level-design";
    topic: string;
    /** An LLD note's hands-on lesson in the Low-Level Design study track (LLD_PRACTICE), where the classes are written and judged; null elsewhere. */
    codeLesson: { href: string; title: string } | null;
  } | null;
}

/**
 * Each Low-Level Design note's practice lesson in the `lld` study track
 * (scripts/study-plans/lld) — the note teaches the design, the lesson has the
 * learner write it, judged on behaviour. The intro and UML notes share the
 * modelling module; the patterns note has none of its own (every case study
 * practises patterns). Pinned by cs-notes-practice.test.ts against the track,
 * so a renamed lesson fails the build rather than a link.
 */
export const LLD_PRACTICE: Readonly<Record<string, { lesson: string; title: string }>> = {
  "introduction-to-low-level-design": { lesson: "modelling-requirements", title: "From requirements to classes" },
  "uml-class-diagrams": { lesson: "modelling-requirements", title: "From requirements to classes" },
  "design-an-lru-cache": { lesson: "lru-cache-design", title: "Code an LRU cache" },
  "design-a-parking-lot": { lesson: "parking-lot-design", title: "Code a parking lot" },
  "design-a-vending-machine": { lesson: "vending-machine-design", title: "Code a vending machine" },
  "design-an-elevator-system": { lesson: "elevator-design", title: "Code an elevator system" },
  "design-a-movie-ticket-booking-system": { lesson: "ticket-booking-design", title: "Code a ticket booking system" },
  "design-an-expense-sharing-app": { lesson: "expense-sharing-design", title: "Code an expense sharing app" },
};

export function notePage(subjectKey: string, slug: string): NotePage | null {
  const subject = subjectByKey(subjectKey);
  const n = noteBy(subjectKey, slug);
  if (!subject || !n) return null;
  const siblings = notesFor(subjectKey);
  const i = siblings.indexOf(n);
  const figures: Record<string, Walkthrough> = {};
  for (const b of noteBlocks(n.body)) {
    if (b.kind !== "figure") continue;
    const w = noteFigure(n.slug, b.name);
    if (w) figures[b.name] = w;
  }
  return {
    note: {
      subject: n.subject,
      slug: n.slug,
      title: n.title,
      minutes: n.minutes,
      level: n.level,
      updated: n.updated,
      body: n.body,
      seo: { title: n.seoTitle, description: n.description, question: n.question, answer: n.answer, faq: n.faq },
    },
    subject: { key: subject.key, title: subject.title, short: subject.short, format: subject.format },
    position: i + 1,
    count: siblings.length,
    prev: i > 0 ? noteSummary(siblings[i - 1]!) : null,
    next: i < siblings.length - 1 ? noteSummary(siblings[i + 1]!) : null,
    figures,
    tests: testsOf(subject.tests),
    practice:
      subject.key === "system-design" || subject.key === "low-level-design"
        ? {
            designSlug: DESIGN_PROBLEMS.find((p) => p.note === n.slug)?.slug ?? null,
            round: subject.key === "low-level-design" ? "low-level-design" : "system-design-interview",
            topic: n.title,
            codeLesson:
              subject.key === "low-level-design" && LLD_PRACTICE[n.slug]
                ? { href: `/study-plans/lld/${LLD_PRACTICE[n.slug]!.lesson}`, title: LLD_PRACTICE[n.slug]!.title }
                : null,
          }
        : null,
  };
}

/** Sitemap entries: the index, each subject and each note, a note dated by its `updated`. */
export function notesSitemapEntries(): Array<{ path: string; lastmod?: Date | null }> {
  const notes = allNotes();
  return [
    { path: "/notes" },
    ...NOTE_SUBJECTS.filter((s) => notes.some((n) => n.subject === s.key)).map((s) => ({ path: `/notes/${s.key}` })),
    ...notes.map((n) => ({ path: `/notes/${n.subject}/${n.slug}`, lastmod: new Date(`${n.updated}T00:00:00Z`) })),
  ];
}
