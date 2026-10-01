import { boundsOf, type Walkthrough } from "./core.js";

/**
 * What every walkthrough must satisfy, as a list of complaints (empty when
 * it is fine). Pinned for every topic by walkthroughs.test.ts and printed by
 * scripts/preview-walkthroughs.ts while one is being written.
 *
 * The limits are the page's: the figure sits in a ~700 px column and scales
 * down on a phone, so it must not be wider than 640 or taller than 440
 * units (wider ones shrank their 14 px labels below legibility on a 360 px
 * screen); five to sixteen frames is long enough to show the idea and
 * short enough to watch; a caption is read under the figure while it
 * plays, so it is plain text of one or two sentences.
 */
export function walkthroughProblems(slug: string, w: Walkthrough): string[] {
  const out: string[] = [];
  const say = (m: string) => out.push(`${slug}: ${m}`);
  if (!w.title || w.title.length > 90) say(`title must be 1–90 characters (${w.title.length})`);
  if (!w.input || w.input.length > 140) say(`input must be 1–140 characters (${w.input.length})`);
  if (w.frames.length < 5 || w.frames.length > 16) say(`needs 5–16 frames, has ${w.frames.length}`);
  if (w.width > 640) say(`too wide: ${w.width} > 640`);
  if (w.height > 440) say(`too tall: ${w.height} > 440`);
  if (w.width < 120 || w.height < 60) say(`suspiciously small: ${w.width}×${w.height}`);
  const captions = new Set<string>();
  const kinds = new Map<string, string>();
  w.frames.forEach((f, n) => {
    const at = `frame ${n + 1}`;
    if (f.items.length === 0) say(`${at} is empty`);
    if (f.caption.length < 30 || f.caption.length > 340) say(`${at} caption must be 30–340 characters (${f.caption.length}): ${f.caption}`);
    if (/[*`_]{2}|`|\[[^\]]*\]\(/.test(f.caption)) say(`${at} caption has Markdown in it: ${f.caption}`);
    if (/undefined|NaN|\[object/.test(f.caption)) say(`${at} caption has a broken value: ${f.caption}`);
    if (captions.has(f.caption)) say(`${at} repeats an earlier caption`);
    captions.add(f.caption);
    const ids = new Set<string>();
    for (const it of f.items) {
      if (ids.has(it.id)) say(`${at} has two items with id "${it.id}"`);
      ids.add(it.id);
      const seen = kinds.get(it.id);
      if (seen && seen !== it.k) say(`id "${it.id}" is a ${seen} in one frame and a ${it.k} in another`);
      kinds.set(it.id, it.k);
      const b = boundsOf(it);
      if (![b.x1, b.y1, b.x2, b.y2].every(Number.isFinite)) say(`${at} item "${it.id}" has a non-finite coordinate`);
      if (b.x1 < -0.5 || b.y1 < -0.5 || b.x2 > w.width + 0.5 || b.y2 > w.height + 0.5) say(`${at} item "${it.id}" falls outside the viewBox`);
      if ((it.k === "text" || it.k === "cell" || it.k === "node") && /undefined|NaN/.test(it.text)) say(`${at} item "${it.id}" shows "${it.text}"`);
      if (it.k === "text" && it.text.length > 70) say(`${at} text "${it.id}" is over 70 characters — put prose in the caption`);
    }
  });
  return out;
}
