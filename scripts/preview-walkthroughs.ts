/**
 * Lay out every frame of the topic walkthroughs (src/lib/walkthroughs) on one
 * HTML page, with each one's validation complaints, for review while
 * writing them — and, with --png, screenshot that page in system Chrome
 * (the frontend's Playwright, nothing downloaded).
 *
 *   npx tsx scripts/preview-walkthroughs.ts [--group <file>] [--only slug,slug] [--out dir] [--png] [--dark]
 *   npx tsx scripts/preview-walkthroughs.ts --lesson <lesson slug> [--only name,name] [--png] [--dark]
 *   npx tsx scripts/preview-walkthroughs.ts --note <note slug> [--only name,name] [--png] [--dark]
 *
 * --lesson previews a roadmap lesson's own figures (src/lib/lesson-figures/
 * <slug>.ts) under the lesson limits (one frame allowed, 600 wide), into
 * scratch/lesson-figures/<slug>/ unless --out says otherwise.
 *
 * --note does the same for a CS note's figures (src/lib/note-figures/
 * <slug>.ts, the same limits), into scratch/note-figures/<slug>/. It
 * imports that one module by its path rather than through the registry, so
 * a figure can be previewed while another note's module is mid-edit.
 *
 * --group loads src/lib/walkthroughs/<file>.ts's own WALKTHROUGHS record as
 * well as the registry (a group not registered yet can be previewed).
 * Writes <out>/walkthroughs.html (default out: scratch/walkthroughs/) and,
 * with --png, one <out>/<slug>.png per walkthrough.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { WALKTHROUGHS } from "../src/lib/walkthroughs/index.js";
import { frameSvg } from "../src/lib/walkthroughs/svg.js";
import { walkthroughProblems } from "../src/lib/walkthroughs/validate.js";
import { FIGURE_LIMITS } from "../src/lib/lesson-figures/index.js";
import { LESSON_FIGURES } from "../src/lib/lesson-figures/registry.js";
import type { Walkthrough } from "../src/lib/walkthroughs/core.js";

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const value = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

async function main() {
  const lesson = value("lesson");
  const noteSlug = value("note");
  if (lesson && !LESSON_FIGURES[lesson]) throw new Error(`no figure module for lesson "${lesson}"`);
  let noteFigures: Record<string, () => Walkthrough> | undefined;
  if (noteSlug) {
    const file = resolve(here, "../src/lib/note-figures", `${noteSlug}.ts`);
    if (!existsSync(file)) throw new Error(`no figure module for note "${noteSlug}" (src/lib/note-figures/${noteSlug}.ts)`);
    noteFigures = ((await import(pathToFileURL(file).href)) as { FIGURES?: Record<string, () => Walkthrough> }).FIGURES;
    if (!noteFigures) throw new Error(`${noteSlug}.ts exports no FIGURES`);
  }
  const registry: Record<string, () => Walkthrough> = noteFigures ? { ...noteFigures } : lesson ? { ...LESSON_FIGURES[lesson] } : { ...WALKTHROUGHS };
  const limits = lesson || noteFigures ? FIGURE_LIMITS : {};
  const group = value("group");
  let groupSlugs: string[] | undefined;
  if (group && !lesson && !noteSlug) {
    const mod = (await import(pathToFileURL(resolve(here, "../src/lib/walkthroughs", `${group}.ts`)).href)) as { WALKTHROUGHS?: Record<string, () => Walkthrough> };
    if (!mod.WALKTHROUGHS) throw new Error(`${group}.ts exports no WALKTHROUGHS`);
    Object.assign(registry, mod.WALKTHROUGHS);
    groupSlugs = Object.keys(mod.WALKTHROUGHS);
  }
  const only = value("only")?.split(",").map((s) => s.trim()).filter(Boolean);
  // A group alone previews its own; --only narrows to the named ones.
  const slugs = (only ?? groupSlugs ?? Object.keys(registry)).filter((s) => s in registry);
  const out = resolve(value("out") ?? resolve(here, noteSlug ? `../scratch/note-figures/${noteSlug}` : lesson ? `../scratch/lesson-figures/${lesson}` : "../scratch/walkthroughs"));
  mkdirSync(out, { recursive: true });

  let failures = 0;
  const sections: string[] = [];
  for (const slug of slugs) {
    let w: Walkthrough;
    try {
      w = registry[slug]();
    } catch (err) {
      failures++;
      console.error(`${slug}: THREW ${(err as Error).stack}`);
      sections.push(`<section id="${slug}"><h2>${slug}</h2><p class="bad">threw: ${esc(String(err))}</p></section>`);
      continue;
    }
    const problems = walkthroughProblems(slug, w, limits);
    failures += problems.length;
    for (const p of problems) console.error(p);
    console.log(`${slug}: ${w.frames.length} frames, ${w.width}×${w.height}, ${JSON.stringify(w).length} bytes${problems.length ? `, ${problems.length} problem(s)` : ""}`);
    sections.push(
      `<section id="${slug}"><h2>${esc(w.title)} <small>${slug} · ${w.width}×${w.height} · ${w.frames.length} frames</small></h2><p class="input">${esc(w.input)}</p>` +
        (problems.length ? `<ul class="bad">${problems.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>` : "") +
        `<ol>${w.frames.map((f) => `<li><div class="fig">${frameSvg(w, f)}</div><p>${esc(f.caption)}</p></li>`).join("")}</ol></section>`,
    );
  }
  const dark = flag("dark");
  const html = `<!doctype html><html${dark ? ' data-theme="dark"' : ""}><head><meta charset="utf-8"><title>Walkthroughs</title><style>
:root{--font-sans:system-ui;--font-mono:'JetBrains Mono',Consolas,monospace}
${dark ? ":root{--color-text:#F5F5F5;--color-text-secondary:#A3A3A3;--color-text-tertiary:#8C8C8C;--color-text-disabled:#595959;--color-border:#262626;--color-border-strong:#383838;--color-surface:#111111;--color-bg-subtle:#1C1C1C;--color-accent:#23A5FD;--color-error:#FF7A7E;--color-on-primary:#111111} body{background:#0A0A0A;color:#F5F5F5}" : "body{background:#fff;color:#111}"}
body{font-family:system-ui;margin:24px}section{margin-bottom:48px}h2{font-size:18px}small{font-weight:400;color:#888;font-size:12px}
ol{display:grid;grid-template-columns:repeat(auto-fill,minmax(420px,1fr));gap:20px;padding-left:20px}li p{font-size:13px;line-height:1.5;max-width:60ch}
.fig svg{max-width:100%;height:auto;border:1px solid #8883;border-radius:6px}.bad{color:#c22d32}.input{font-family:monospace;font-size:13px;color:#666}
</style></head><body>${sections.join("")}</body></html>`;
  const file = resolve(out, "walkthroughs.html");
  writeFileSync(file, html);
  console.log(`\nwrote ${file}${failures ? ` — ${failures} problem(s)` : ""}`);

  if (flag("png")) {
    const req = createRequire(resolve(here, "../../frontend/package.json"));
    // The frontend's Playwright, typed here by the little this script uses (the backend has no @playwright/test).
    interface Shot {
      count(): Promise<number>;
      screenshot(o: { path: string }): Promise<unknown>;
    }
    interface Browser {
      newPage(o: { viewport: { width: number; height: number } }): Promise<{ goto(url: string): Promise<unknown>; locator(sel: string): Shot }>;
      close(): Promise<void>;
    }
    const { chromium } = req("@playwright/test") as { chromium: { launch(o: { channel: string }): Promise<Browser> } };
    const browser = await chromium.launch({ channel: "chrome" });
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    await page.goto(pathToFileURL(file).href);
    for (const slug of slugs) {
      const el = page.locator(`section#${slug}`);
      if (await el.count()) await el.screenshot({ path: resolve(out, `${slug}.png`) });
    }
    await browser.close();
    console.log(`screenshots in ${out}`);
  }
  if (failures) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
