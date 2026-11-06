/**
 * The pipeline's three stages, each a job in .github/workflows/daily-video.yml so
 * that the stage rendering model-written code holds no secrets:
 *
 *   create  --run <id> | --prompt "..."   Claude's script, the voice, the compositions, the review
 *   render  --run <id>                    run the on-screen code, every frame, the mp4s
 *   publish --run <id>                    YouTube
 *   demo    [--voice]                     the reference composition through voice + render, no Claude
 *
 * Everything sits in out/<id>/; the workflow carries that between jobs.
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compose, findDuplicate, MODEL, reviewVideo, revise, spend, writeScript } from "./claude.ts";
import { inspect, launch, loadFonts, pageHtml, renderThumbnail, renderVideo } from "./render.ts";
import { claimUpload, fetchJob, nextTopic, recordUpload, report, type Job } from "./runner.ts";
import { ScriptSchema, SHORT_MAX_SECONDS, type Format, type RunState, type Script, type Timeline } from "./types.ts";
import { voiceCut } from "./voice.ts";
import { chapters, setCaptions, setThumbnail, uploadVideo } from "./youtube.ts";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..");
const SITE = "https://codekairo.com";
const FORMATS: Format[] = ["landscape", "short"];
/** Each revision rewrites a whole composition, the costly part of a run; two is the most a day's video gets. */
const MAX_ROUNDS = 2;

const args = process.argv.slice(2);
const opt = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const command = args[0];
const runId = opt("run") ?? `local-${new Date().toISOString().slice(0, 19).replace(/[-:T]/g, "")}`;
const dir = path.join(ROOT, "out", runId);
const cutDir = (f: Format) => path.join(dir, f);

const readJson = <T,>(file: string) => JSON.parse(readFileSync(path.join(dir, file), "utf8")) as T;
const writeJson = (file: string, value: unknown) => writeFileSync(path.join(dir, file), JSON.stringify(value, null, 1));

/** Only a page that really answers gets printed under the channel's name. The Worker sends a true 404 for an unknown slug. */
async function practiceUrl(script: Script): Promise<string> {
  const wanted = script.practicePath.startsWith("/") ? script.practicePath : `/${script.practicePath}`;
  const good = await fetch(SITE + wanted, { redirect: "follow" }).then((r) => r.ok).catch(() => false);
  return SITE + (good ? wanted : "/challenges");
}

async function create() {
  const job: Job = opt("prompt")
    ? { id: runId, prompt: opt("prompt")!, privacy: "private", source: "typed", posted: [] }
    : await fetchJob(runId);
  mkdirSync(dir, { recursive: true });
  writeJson("job.json", job);
  const warnings: string[] = [];

  await loadFonts();
  await report(runId, { status: "scripting", model: MODEL });
  // First and cheap: never spend a video's worth of tokens on one the channel has.
  // A typed topic stops here with a sentence; an automatic one moves to the next in line.
  for (let tries = 0; ; tries++) {
    const duplicateOf = await findDuplicate(job.prompt, job.posted);
    if (!duplicateOf) break;
    console.log(`already posted as "${duplicateOf}": ${job.prompt}`);
    if (tries >= 5) throw new Error("Five topics in a row were already on the channel. Add a new prompt.");
    job.prompt = await nextTopic(runId, duplicateOf);
  }
  writeJson("job.json", job);
  let script = await writeScript(job.prompt, job.posted);
  await report(runId, { status: "voicing", title: script.landscape.title, usd: spend.usd });
  const timelines = {} as Record<Format, Timeline>;
  for (const format of FORMATS) {
    mkdirSync(cutDir(format), { recursive: true });
    console.log(`voicing the ${format} cut`);
    timelines[format] = await voiceCut(format, script[format].scenes, cutDir(format), warnings);
  }
  if (timelines.short.duration > SHORT_MAX_SECONDS) throw new Error(`The Short came out at ${timelines.short.duration.toFixed(0)} s; YouTube would not file it as a Short.`);
  writeJson("script.json", script);

  await report(runId, { status: "composing", usd: spend.usd });
  const compositions = {} as Record<Format, string>;
  for (const format of FORMATS) {
    console.log(`composing the ${format} cut`);
    compositions[format] = await compose(script, format, timelines[format]);
    writeFileSync(path.join(cutDir(format), "composition.html"), compositions[format]);
  }

  const browser = await launch();
  let cleared = false;
  let open: string[] = [];
  try {
    for (let round = 0; ; round++) {
      await report(runId, { status: "reviewing", round, usd: spend.usd });
      const problems: Record<Format, string[]> = { landscape: [], short: [] };
      const stills: { format: Format; scene: string; jpeg: Buffer }[] = [];
      for (const format of FORMATS) {
        const seen = await inspect(browser, format, pageHtml(format, timelines[format], compositions[format], script.code), timelines[format]);
        problems[format].push(...seen.problems);
        stills.push(...seen.stills.map((s) => ({ format, ...s })));
      }
      // Don't pay to look at frames of a page that is already known to be broken.
      if (!problems.landscape.length && !problems.short.length) {
        const review = await reviewVideo(script, stills);
        writeJson(`review-${round}.json`, review);
        for (const p of review.problems) {
          if (p.severity !== "blocker") continue;
          const line = `scene "${p.scene}": ${p.problem}`;
          if (p.format === "both" || p.format === "landscape") problems.landscape.push(line);
          if (p.format === "both" || p.format === "short") problems.short.push(line);
        }
      }
      open = [...problems.landscape, ...problems.short];
      console.log(open.length ? `round ${round}:\n  ${open.join("\n  ")}` : `round ${round}: clear`);
      if (!open.length) {
        cleared = true;
        break;
      }
      if (round >= MAX_ROUNDS) break;
      await report(runId, { status: "revising", round, usd: spend.usd });
      for (const format of FORMATS) {
        if (!problems[format].length) continue;
        compositions[format] = await revise(script, format, timelines[format], compositions[format], problems[format]);
        writeFileSync(path.join(cutDir(format), "composition.html"), compositions[format]);
      }
    }
    await renderThumbnail(browser, script, path.join(dir, "thumbnail.jpg"));
  } finally {
    await browser.close();
  }
  if (!cleared) warnings.push(...open.slice(0, 8).map((p) => `Review: ${p}`));

  const state: RunState = { id: runId, cleared, warnings, practiceUrl: await practiceUrl(script), usage: spend };
  writeJson("state.json", state);
  script = ScriptSchema.parse(script);
  for (const format of FORMATS) writeFileSync(path.join(cutDir(format), "page.html"), pageHtml(format, timelines[format], compositions[format], script.code));
  await report(runId, { status: "rendering", usd: spend.usd, cleared, warnings });
}

/** Whatever's on screen has to compile and print what the script says it prints. */
function checkCode(script: Script) {
  if (!script.code || script.code.language.toLowerCase() !== "java") return;
  const tmp = mkdtempSync(path.join(tmpdir(), "video-code-"));
  try {
    const file = path.join(tmp, "Main.java");
    writeFileSync(file, script.code.source);
    const run = spawnSync("java", [file], { cwd: tmp, encoding: "utf8", timeout: 20_000, env: { PATH: process.env["PATH"] ?? "" } });
    if (run.error) throw new Error(`Could not run the on-screen Java: ${run.error.message}`);
    if (run.status !== 0) throw new Error(`The on-screen Java fails: ${run.stderr.slice(0, 600)}`);
    if (run.stdout.trim() !== script.code.expectedOutput.trim()) throw new Error(`The on-screen Java prints "${run.stdout.trim()}", the script says "${script.code.expectedOutput.trim()}".`);
    console.log("on-screen Java compiles and prints what it should");
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

async function render() {
  await loadFonts();
  const script = readJson<Script>("script.json");
  checkCode(script);
  const browser = await launch();
  try {
    for (const format of FORMATS) {
      const started = Date.now();
      const timeline = JSON.parse(readFileSync(path.join(cutDir(format), "timeline.json"), "utf8")) as Timeline;
      const html = readFileSync(path.join(cutDir(format), "page.html"), "utf8");
      await renderVideo(browser, format, html, timeline, path.join(cutDir(format), "narration.wav"), path.join(cutDir(format), "video.mp4"));
      console.log(`${format}: ${timeline.duration.toFixed(1)} s of video in ${((Date.now() - started) / 60000).toFixed(1)} min`);
    }
  } finally {
    await browser.close();
  }
}

const hashtags = (tags: string[]) => tags.slice(0, 5).map((t) => `#${t.replace(/[^a-z0-9]/gi, "")}`).join(" ");
const tracked = (url: string, medium: string, slug: string) =>
  `${url}?utm_source=youtube&utm_medium=${medium}&utm_campaign=daily-video&utm_content=${encodeURIComponent(slug)}`;

const sha256Of = (file: string) => createHash("sha256").update(readFileSync(file)).digest("hex");

async function publish() {
  const job = readJson<Job>("job.json");
  const script = readJson<Script>("script.json");
  const state = readJson<RunState>("state.json");
  // Nothing goes public that the review did not clear.
  const privacy = state.cleared ? job.privacy : "private";
  const slug = runId;

  await report(runId, { status: "uploading", usd: state.usage.usd });

  // The API decides each upload just before it happens, against what YouTube says
  // is on the channel, so a re-run of this job can never post either cut twice.
  const landscapeFile = path.join(cutDir("landscape"), "video.mp4");
  const landscapeHash = sha256Of(landscapeFile);
  const landscapeClaim = await claimUpload(runId, "landscape", script.landscape.title, landscapeHash);
  if ("videoId" in landscapeClaim) {
    state.landscapeId = landscapeClaim.videoId;
    console.log(`landscape already up: ${state.landscapeId}`);
  } else {
    const token = landscapeClaim.accessToken;
    const timeline = JSON.parse(readFileSync(path.join(cutDir("landscape"), "timeline.json"), "utf8")) as Timeline;
    const description = [
      script.landscape.description,
      `Practise it on CodeKairo: ${tracked(state.practiceUrl, "video", slug)}`,
      chapters(timeline),
      hashtags(script.landscape.tags),
    ].filter(Boolean).join("\n\n");
    state.landscapeId = await uploadVideo(token, landscapeFile, { title: script.landscape.title, description, tags: script.landscape.tags, privacy });
    await recordUpload(runId, "landscape", state.landscapeId, script.landscape.title, landscapeHash);
    for (const problem of [await setThumbnail(token, state.landscapeId, path.join(dir, "thumbnail.jpg")), await setCaptions(token, state.landscapeId, path.join(cutDir("landscape"), "captions.srt"))]) {
      if (problem) state.warnings.push(problem);
    }
  }

  const shortFile = path.join(cutDir("short"), "video.mp4");
  const shortHash = sha256Of(shortFile);
  const shortClaim = await claimUpload(runId, "short", script.short.title, shortHash);
  if ("videoId" in shortClaim) {
    state.shortId = shortClaim.videoId;
    console.log(`short already up: ${state.shortId}`);
  } else {
    const description = [
      script.short.description,
      // An unlisted or private long cut isn't worth pointing at.
      privacy === "public" ? `The full explanation: https://youtu.be/${state.landscapeId}` : "",
      `Practise it on CodeKairo: ${tracked(state.practiceUrl, "short", slug)}`,
      hashtags(script.short.tags),
    ].filter(Boolean).join("\n\n");
    state.shortId = await uploadVideo(shortClaim.accessToken, shortFile, { title: script.short.title, description, tags: script.short.tags, privacy });
    await recordUpload(runId, "short", state.shortId, script.short.title, shortHash);
  }
  await report(runId, { status: state.cleared ? "done" : "needs_review", privacy, warnings: state.warnings, usd: state.usage.usd });
}

async function demo() {
  await loadFonts();
  mkdirSync(dir, { recursive: true });
  const script = ScriptSchema.parse(JSON.parse(readFileSync(path.join(ROOT, "fixtures", "demo-script.json"), "utf8")));
  writeJson("script.json", script);
  const composition = readFileSync(path.join(ROOT, "fixtures", "reference-short.html"), "utf8");
  const warnings: string[] = [];
  mkdirSync(cutDir("short"), { recursive: true });
  const timeline = await voiceCut("short", script.short.scenes, cutDir("short"), warnings, !args.includes("--voice"));
  const html = pageHtml("short", timeline, composition, script.code);
  writeFileSync(path.join(cutDir("short"), "page.html"), html);
  const browser = await launch();
  try {
    const seen = await inspect(browser, "short", html, timeline);
    console.log(seen.problems.length ? `problems:\n  ${seen.problems.join("\n  ")}` : "inspection: clear");
    seen.stills.forEach((s) => writeFileSync(path.join(cutDir("short"), `still-${s.scene}.jpg`), s.jpeg));
    await renderThumbnail(browser, script, path.join(dir, "thumbnail.jpg"));
    const started = Date.now();
    await renderVideo(browser, "short", html, timeline, path.join(cutDir("short"), "narration.wav"), path.join(cutDir("short"), "video.mp4"));
    console.log(`${timeline.duration.toFixed(1)} s of video in ${((Date.now() - started) / 1000).toFixed(0)} s → ${path.join(cutDir("short"), "video.mp4")}`);
  } finally {
    await browser.close();
  }
  if (warnings.length) console.log(warnings.join("\n"));
}

const COMMANDS: Record<string, () => Promise<void>> = { create, render, publish, demo };
const run = command ? COMMANDS[command] : undefined;
if (!run) {
  console.error(`usage: cli.ts ${Object.keys(COMMANDS).join("|")} [--run id]`);
  process.exit(2);
}
run().catch(async (e: Error) => {
  console.error(e);
  await report(runId, { status: "failed", error: e.message.slice(0, 600), usd: spend.usd });
  process.exit(1);
});
