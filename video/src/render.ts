/**
 * The composition as a page, and the page as a video: Chrome draws frame i at
 * t = i / 30 and x264 takes the screenshots, as reels/http-vs-https does, so the
 * result never depends on how fast the machine is.
 *
 * The page is model-written code, so it runs with nothing to reach: the only
 * thing the route answers is the document itself, and its CSP allows no network
 * of any kind. Its fonts and logo are inlined for that reason.
 *
 * The fonts come from the live site when a job starts rather than from this
 * repository: Gilroy is licensed, and this repository is public.
 */
import { spawn } from "node:child_process";
import { cpus } from "node:os";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ffmpegStatic from "ffmpeg-static";
import { chromium, type Browser, type CDPSession, type Page } from "playwright-core";
import { FPS, FRAMES, type Format, type Script, type Timeline } from "./types.ts";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE_FONTS = "https://codekairo.com/fonts";

let fontCss = "";

/** Once per job, before the first pageHtml or thumbnail. */
export async function loadFonts(): Promise<void> {
  if (fontCss) return;
  const face = async (family: string, weight: number | string, file: string) => {
    const res = await fetch(`${SITE_FONTS}/${file}`);
    if (!res.ok) throw new Error(`Font ${file}: ${res.status}`);
    const data = Buffer.from(await res.arrayBuffer()).toString("base64");
    return `@font-face{font-family:${family};font-weight:${weight};src:url(data:font/woff2;base64,${data}) format("woff2")}`;
  };
  fontCss = (
    await Promise.all([
      face("Gilroy", 400, "Gilroy-400.woff2"),
      face("Gilroy", 500, "Gilroy-500.woff2"),
      face("Gilroy", 600, "Gilroy-600.woff2"),
      face("Gilroy", 700, "Gilroy-700.woff2"),
      face("'JetBrains Mono'", "100 800", "JetBrainsMono.woff2"),
    ])
  ).join("\n");
}

const fonts = () => fontCss;
const logo = () => `data:image/webp;base64,${readFileSync(path.join(HERE, "..", "assets", "logo-dark-144.webp")).toString("base64")}`;

const CSP = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; font-src data:; img-src data:";
const ORIGIN = "http://stage.invalid/";

/** JSON inside a script tag: `<` escaped so the data cannot close it. */
const inline = (value: unknown) => JSON.stringify(value).replace(/</g, "\\u003c");

export function pageHtml(format: Format, timeline: Timeline, composition: string, code: Script["code"]): string {
  const frame = FRAMES[format];
  const vertical = format === "short";
  const { stage } = frame;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
${fonts()}
*{box-sizing:border-box;margin:0;padding:0;animation:none!important;transition:none!important}
html,body{width:${frame.w}px;height:${frame.h}px;overflow:hidden;background:#0A0A0A;color:#F5F5F5;font-family:Gilroy,sans-serif;-webkit-font-smoothing:antialiased}
#ck-head{position:absolute;left:${stage.x}px;right:${stage.x}px;top:${vertical ? 136 : 36}px;display:flex;align-items:center;justify-content:space-between;padding-bottom:${vertical ? 20 : 14}px;border-bottom:1px solid #262626}
#ck-brand{display:flex;align-items:center;gap:14px;font:600 ${vertical ? 36 : 28}px Gilroy}
#ck-brand img{height:${vertical ? 48 : 38}px;width:auto;display:block}
#ck-where{font:500 ${vertical ? 28 : 24}px Gilroy;color:#A3A3A3}
#ck-num{font:500 ${vertical ? 28 : 24}px 'JetBrains Mono';color:#3AA9FF;margin-right:12px}
#ck-progress{position:absolute;left:0;right:0;bottom:-1px;height:2px;background:#3AA9FF;transform-origin:left}
#ck-stage{position:absolute;left:${stage.x}px;top:${stage.y}px;width:${stage.w}px;height:${stage.h}px}
#ck-captions{position:absolute;left:${stage.x}px;right:${stage.x}px;top:${stage.y + stage.h + (vertical ? 40 : 28)}px;height:${vertical ? 170 : 110}px;text-align:center;font:600 ${vertical ? 60 : 44}px/1.25 Gilroy}
.ck-code{font-family:'JetBrains Mono',monospace;font-variant-ligatures:none;line-height:1.55;white-space:pre;color:#EFF8FF}
.ck-line{padding:0 12px;border-left:3px solid transparent}
.ck-on{background:#161616;border-left-color:#3AA9FF}
</style>
<script>window.__CK_DATA=${inline({ timeline, frame, code })}</script>
<script>${readFileSync(path.join(HERE, "runtime.js"), "utf8")}</script>
</head><body>
<div id="ck-head"><div id="ck-brand"><img src="${logo()}" alt="">CodeKairo</div><div id="ck-where"><span id="ck-num"></span><span id="ck-title"></span><div id="ck-progress"></div></div></div>
<div id="ck-stage">${composition}</div>
<div id="ck-captions"></div>
</body></html>`;
}

export async function launch(): Promise<Browser> {
  return chromium.launch({ channel: "chrome", headless: true });
}

interface Stage {
  page: Page;
  cdp: CDPSession;
  errors: string[];
}

async function open(browser: Browser, format: Format, html: string): Promise<Stage> {
  const frame = FRAMES[format];
  const context = await browser.newContext({ viewport: { width: frame.w, height: frame.h }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error" && !m.text().includes("Content Security Policy")) errors.push(m.text()); });
  await page.route("**/*", (route) =>
    route.request().url() === ORIGIN
      ? route.fulfill({ status: 200, contentType: "text/html; charset=utf-8", headers: { "Content-Security-Policy": CSP }, body: html })
      : route.abort(),
  );
  await page.goto(ORIGIN);
  await page.evaluate(() => document.fonts.ready.then(() => Promise.all(["500 20px Gilroy", "600 20px Gilroy", "700 20px Gilroy", "500 20px 'JetBrains Mono'"].map((f) => document.fonts.load(f)))));
  return { page, cdp: await context.newCDPSession(page), errors };
}

const seek = (page: Page, t: number) => page.evaluate((v) => (window as unknown as { __ck: { seek(t: number): void } }).__ck.seek(v), t);

async function shot(stage: Stage, quality: number, scale = 1): Promise<Buffer> {
  const { width, height } = stage.page.viewportSize()!;
  const { data } = (await stage.cdp.send("Page.captureScreenshot", {
    format: "jpeg",
    quality,
    optimizeForSpeed: true,
    clip: { x: 0, y: 0, width, height, scale },
  })) as { data: string };
  return Buffer.from(data, "base64");
}

export interface Inspection {
  /** What is mechanically wrong: thrown errors, missing scenes, text off the stage. */
  problems: string[];
  /** A half-size frame from late in each scene, for the visual review. */
  stills: { scene: string; jpeg: Buffer }[];
}

/** Everything that can be told without watching it, plus the frames for the review to look at. */
export async function inspect(browser: Browser, format: Format, html: string, timeline: Timeline): Promise<Inspection> {
  const stage = await open(browser, format, html);
  const problems: string[] = [];
  const stills: Inspection["stills"] = [];
  const missing = await stage.page.evaluate(() => (window as unknown as { __ck?: { missing(): string[] } }).__ck?.missing() ?? ["(runtime did not load)"]);
  if (missing.length) problems.push(`No <section data-scene> for: ${missing.join(", ")}`);
  for (const scene of timeline.scenes) {
    for (const v of [0.25, 0.8]) {
      const t = scene.start + (scene.end - scene.start) * v;
      await seek(stage.page, t).catch((e: Error) => problems.push(`scene "${scene.id}" at ${t.toFixed(1)} s threw: ${e.message}`));
      const found = await stage.page.evaluate(() => (window as unknown as { __ck: { audit(): string[] } }).__ck.audit());
      problems.push(...found.map((p) => `scene "${scene.id}" at ${t.toFixed(1)} s: ${p}`));
    }
    stills.push({ scene: scene.id, jpeg: await shot(stage, 70, 0.5) });
  }
  // A picture must depend on t alone: visit a moment, go elsewhere, come back.
  const a = timeline.scenes[Math.floor(timeline.scenes.length / 2)]!;
  const b = timeline.scenes[timeline.scenes.length - 1]!;
  const moment = (a.start + a.end) / 2;
  await seek(stage.page, moment);
  const first = await shot(stage, 70, 0.5);
  await seek(stage.page, (b.start + b.end) / 2);
  await seek(stage.page, moment);
  if (!first.equals(await shot(stage, 70, 0.5))) problems.push(`Going to a later time and back to ${moment.toFixed(1)} s drew a different picture: draw must be a pure function of t, keeping no state between frames.`);
  problems.push(...stage.errors.map((e) => `page error: ${e}`));
  await stage.page.context().close();
  return { problems: [...new Set(problems)].slice(0, 30), stills };
}

/** Every frame, in order, into x264 with the narration. */
export async function renderVideo(browser: Browser, format: Format, html: string, timeline: Timeline, audioPath: string, outPath: string): Promise<void> {
  const frames = Math.ceil(timeline.duration * FPS);
  // x264 needs a core of its own or the screenshots starve it.
  const workers = Number(process.env["RENDER_WORKERS"]) || Math.max(1, cpus().length - 1);
  const stages = await Promise.all(Array.from({ length: workers }, () => open(browser, format, html)));

  const ff = spawn(process.env["FFMPEG_PATH"] || (ffmpegStatic as unknown as string), [
    "-y", "-hide_banner", "-loglevel", "error",
    "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "-",
    "-i", audioPath,
    "-map", "0:v", "-map", "1:a",
    // Screenshots are full-range BT.601; delivery is limited-range BT.709, tagged so:
    // Remotion's untagged output is what shifted colours in the social apps.
    "-vf", "scale=in_range=pc:out_range=tv:in_color_matrix=bt601:out_color_matrix=bt709,format=yuv420p",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-g", String(FPS * 2), "-r", String(FPS),
    "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", "-color_range", "tv",
    "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
    "-t", timeline.duration.toFixed(3), "-movflags", "+faststart", outPath,
  ], { stdio: ["pipe", "inherit", "inherit"] });
  const encoded = new Promise<void>((resolve, reject) => {
    ff.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}`))));
    ff.on("error", reject);
  });

  const started = Date.now();
  const ready = new Map<number, Buffer>();
  let next = 0;
  let written = 0;
  // A worker that gets ahead waits here, so a slow encoder bounds what sits in memory.
  const room: (() => void)[] = [];
  const flush = async () => {
    while (ready.has(written)) {
      const jpeg = ready.get(written)!;
      ready.delete(written);
      written++;
      if (!ff.stdin.write(jpeg)) await new Promise((r) => ff.stdin.once("drain", r));
      room.splice(0).forEach((go) => go());
      if (written % (FPS * 10) === 0 || written === frames) {
        const rate = written / ((Date.now() - started) / 1000);
        console.log(`  ${format} ${written}/${frames} frames, ${rate.toFixed(1)} fps, ~${Math.round((frames - written) / rate)} s left`);
      }
    }
  };
  let flushing = Promise.resolve();

  await Promise.all(
    stages.map(async (stage) => {
      while (next < frames) {
        const i = next++;
        while (i - written > workers * 4) await new Promise<void>((go) => room.push(go));
        await seek(stage.page, i / FPS);
        ready.set(i, await shot(stage, 92));
        flushing = flushing.then(flush);
      }
    }),
  );
  await flushing;
  ff.stdin.end();
  await encoded;
  const errors = [...new Set(stages.flatMap((s) => s.errors))];
  await Promise.all(stages.map((s) => s.page.context().close()));
  if (errors.length) throw new Error(`The page failed during the render: ${errors.slice(0, 5).join("; ")}`);
}

/** A template of ours, not the model's: the thumbnail is the one frame seen before anyone chooses to watch. */
export async function renderThumbnail(browser: Browser, script: Script, outPath: string): Promise<void> {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
  await page.setContent(`<!doctype html><style>${fonts()}*{margin:0;box-sizing:border-box}
body{width:1280px;height:720px;background:#0A0A0A;color:#F5F5F5;font-family:Gilroy;padding:72px;display:flex;flex-direction:column;justify-content:space-between}
.b{display:flex;align-items:center;gap:18px;font:600 40px Gilroy}.b img{height:56px;width:auto;display:block}
h1{font:700 104px/1.05 Gilroy;max-width:1120px}.t{font:600 38px Gilroy;color:#3AA9FF;letter-spacing:.06em;text-transform:uppercase;border-top:2px solid #3AA9FF;padding-top:24px}</style>
<div class="b"><img src="${logo()}" alt="">CodeKairo</div><h1>${esc(script.thumbnail.headline)}</h1><div class="t">${esc(script.thumbnail.tag)}</div>`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: outPath, type: "jpeg", quality: 90 });
  await context.close();
}
