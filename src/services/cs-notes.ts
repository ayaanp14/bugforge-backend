import { NOTE_SUBJECTS, allNotes, noteBlocks, noteBy, noteSummary, notesFor, subjectByKey, type NoteSummary } from "../lib/cs-notes.js";
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
  subject: { key: string; title: string; short: string };
  position: number;
  count: number;
  prev: NoteSummary | null;
  next: NoteSummary | null;
  /** The figures the body places, by name. */
  figures: Record<string, Walkthrough>;
  tests: Array<{ slug: string; title: string }>;
}

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
    subject: { key: subject.key, title: subject.title, short: subject.short },
    position: i + 1,
    count: siblings.length,
    prev: i > 0 ? noteSummary(siblings[i - 1]!) : null,
    next: i < siblings.length - 1 ? noteSummary(siblings[i + 1]!) : null,
    figures,
    tests: testsOf(subject.tests),
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
