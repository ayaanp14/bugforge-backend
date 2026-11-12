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
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { COMPOSE_MODEL, compose, composeCover, withoutLeetCode, findDuplicate, MODEL, reviewCover, reviewVideo, revise, spend, useBatches, writeScript, type Language } from "./claude.ts";
import { inspect, launch, loadFonts, pageHtml, renderCover, renderThumbnail, renderVideo } from "./render.ts";
import { claimUpload, fetchJob, nextTopic, recordUpload, report, type Job } from "./runner.ts";
import { ScriptSchema, SHORT_MAX_SECONDS, type Format, type RunState, type Script, type Timeline } from "./types.ts";
import { postReel } from "./instagram.ts";
import { voiceCut, voiceName } from "./voice.ts";
import { addToPlaylist, chapters, postComment, setCaptions, setThumbnail, uploadVideo } from "./youtube.ts";
import { candidatePages, livePage, SITE } from "./site.ts";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..");
const FORMATS: Format[] = ["landscape", "short"];
/**
 * Fix rounds a day's video gets before it posts anyway. Three since 2026-11-12:
 * a round is cheap now (edits, Sonnet, batched), and the owner's rule is that the
 * review fixes what it finds and the video always goes out.
 */
const MAX_ROUNDS = 3;

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
/** The script's pages, checked against the live site: a page that doesn't answer is never printed. */
async function pagesOf(script: Script) {
  const practiceUrl = (await livePage(script.practicePath, null)) ?? `${SITE}/challenges`;
  const learnUrl = await livePage(script.learnPath ?? "", null);
  return { practiceUrl, learnUrl: learnUrl === practiceUrl ? null : learnUrl };
}

async function create() {
  const job: Job = opt("prompt")
    ? { id: runId, prompt: opt("prompt")!, privacy: "private", language: opt("language") === "english" ? "english" : "hinglish", source: "typed", posted: [] }
    : await fetchJob(runId);
  mkdirSync(dir, { recursive: true });
  writeJson("job.json", job);
  const warnings: string[] = [];

  await loadFonts();
  // Only the daily run can wait on the Batches API; "Make one now" is someone watching.
  useBatches(job.source === "schedule");
  await report(runId, { status: "scripting", model: MODEL === COMPOSE_MODEL ? MODEL : `${MODEL} + ${COMPOSE_MODEL}` });
  console.log(`voice: ${voiceName()}`);
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
  const language = job.language ?? "hinglish";
  let script = await writeScript(job.prompt, job.posted, language, await candidatePages(job.prompt));
  // Never LeetCode inside the video (the owner's rule): taken out before the voice reads it or a page draws it.
  const scrubbed = withoutLeetCode(script);
  script = scrubbed.script;
  if (scrubbed.changed) console.log(`took "LeetCode" out of ${scrubbed.changed} line(s) of the script`);
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
  // What each cut was last sent back for. A rewrite that comes back with the same
  // problems is not getting anywhere, and each one costs about forty cents, so
  // that cut is left as it is (and posted private) rather than paid for again.
  const last: Record<Format, Set<string>> = { landscape: new Set(), short: new Set() };
  const gist = (p: string) => p.replace(/[\d.]+/g, "#");
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
        const review = await reviewVideo(script, stills, language);
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
      const worth = FORMATS.filter((format) => problems[format].length && !problems[format].every((p) => last[format].has(gist(p))));
      if (!worth.length) {
        console.log("the last rewrite fixed nothing; not paying for another");
        break;
      }
      await report(runId, { status: "revising", round, usd: spend.usd });
      for (const format of worth) {
        last[format] = new Set(problems[format].map(gist));
        compositions[format] = await revise(script, format, timelines[format], compositions[format], problems[format]);
        writeFileSync(path.join(cutDir(format), "composition.html"), compositions[format]);
      }
    }
    await renderThumbnail(browser, script, path.join(dir, "thumbnail.jpg"));
    await makeCover(browser, script, language, warnings);
  } finally {
    await browser.close();
  }
  if (!cleared) warnings.push(...open.slice(0, 8).map((p) => `Review: ${p}`));

  const state: RunState = { id: runId, cleared, warnings, ...(await pagesOf(script)), usage: spend };
  writeJson("state.json", state);
  script = ScriptSchema.parse(script);
  for (const format of FORMATS) writeFileSync(path.join(cutDir(format), "page.html"), pageHtml(format, timelines[format], compositions[format], script.code));
  await report(runId, { status: "rendering", usd: spend.usd, cleared, warnings });
}

/**
 * The Short's cover, used as its YouTube thumbnail and the reel's Instagram cover:
 * designed by the model, checked like a frame, reviewed, and rewritten once if the
 * review finds a blocker. Without one, both fall back to a frame of the video.
 */
async function makeCover(browser: Awaited<ReturnType<typeof launch>>, script: Script, language: Language, warnings: string[]) {
  let html = "";
  let problems: string[] = [];
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      html = await composeCover(script, attempt && html ? { html, problems } : undefined);
      writeFileSync(path.join(dir, "cover.html"), html);
      const drawn = await renderCover(browser, html);
      // Don't pay to look at a cover already known to be broken.
      problems = drawn.problems.length ? drawn.problems : await reviewCover(script, drawn.still, language);
      if (!problems.length) {
        writeFileSync(path.join(dir, "cover.jpg"), drawn.jpeg);
        console.log("cover: clear");
        return;
      }
      console.log(`cover, attempt ${attempt + 1}:\n  ${problems.join("\n  ")}`);
    } catch (e) {
      problems = [(e as Error).message];
    }
  }
  warnings.push(`Cover: not used (${problems[0] ?? "no reason given"}); the Short and the reel show a frame of the video.`);
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

/**
 * YouTube shows the first three hashtags above the title, and more than fifteen
 * makes it ignore them all; three is the whole point. Older scripts with none fall
 * back to their tags. A Short always carries #shorts.
 */
const hashtags = (cut: Script["landscape"], short: boolean) => {
  const words = (cut.hashtags.length ? cut.hashtags : cut.tags)
    .map((t) => t.replace(/[^a-z0-9]/gi, "").toLowerCase())
    .filter((t, i, all) => t && all.indexOf(t) === i);
  const picked = short ? ["shorts", ...words.filter((t) => t !== "shorts")] : words;
  return picked.slice(0, 3).map((t) => `#${t}`).join(" ");
};
const FOLLOW = "A new coding interview explainer every day. Subscribe so you don't miss the next one.";
const playlistName = (script: Script, language: string, short: boolean) =>
  `${short ? "Coding Shorts" : script.playlist}${language === "english" ? "" : " in Hindi"}`;
const playlistAbout = (name: string) =>
  `${name}: short, animated explanations for coding interviews and campus placements, from CodeKairo. Practise every topic at ${SITE}`;
const tracked = (url: string, medium: string, slug: string) =>
  `${url}?utm_source=youtube&utm_medium=${medium}&utm_campaign=daily-video&utm_content=${encodeURIComponent(slug)}`;

/**
 * Every place a video sends viewers to the site, each with its own utm_medium so
 * the admin's traffic table tells description, Short and comment apart. The
 * practice page first: it is the one the video is about.
 */
function siteLinks(state: RunState, medium: string, slug: string, full: boolean): string {
  const lines = [`▶ Solve it yourself, free: ${tracked(state.practiceUrl, medium, slug)}`];
  if (state.learnUrl) lines.push(`📘 Learn the pattern: ${tracked(state.learnUrl, medium, slug)}`);
  if (full) {
    if (!state.practiceUrl.endsWith("/roadmap") && state.learnUrl !== `${SITE}/roadmap`) lines.push(`🗺 The free DSA roadmap: ${tracked(`${SITE}/roadmap`, medium, slug)}`);
    lines.push(`💼 Mock interviews, aptitude and placement tests: ${tracked(SITE, medium, slug)}`);
  }
  return lines.join("\n");
}

/** The site's pages this video belongs on (the API shows a public one there: services/site-videos.ts). */
const onSite = (state: RunState, privacy: string, seconds: number) => ({
  pages: [state.practiceUrl, state.learnUrl].filter((u): u is string => Boolean(u)).map((u) => new URL(u).pathname),
  public: privacy === "public",
  seconds,
});

/** The comment each public video gets from the channel (pin it in Studio: the API can't). */
const commentText = (state: RunState, medium: string, slug: string) =>
  [
    "Try it yourself before you look at the answer 👇",
    siteLinks(state, medium, slug, false),
    "Which problem should we explain next? Tell us below.",
  ].join("\n\n");

const sha256Of = (file: string) => createHash("sha256").update(readFileSync(file)).digest("hex");

/**
 * The daily run starts at 15:00 IST so its Claude calls can wait in the Batches
 * API at half price, and posts at 18:00 IST, when students are off class and
 * scrolling (lib/video-studio.ts videoPeriod on the API). A run that finishes later posts at once. While it waits it tells the API
 * every 20 minutes, so the page shows it waiting and it never reads as stalled.
 */
const POST_AT_IST = { hour: 18, minute: 0 };

async function holdUntilPostTime(usd: number) {
  const now = new Date();
  const ist = new Date(now.getTime() + 330 * 60_000);
  const target = Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate(), POST_AT_IST.hour, POST_AT_IST.minute) - 330 * 60_000;
  // Only a wait inside the same afternoon: a run that somehow ended past midnight shouldn't sit for a day.
  if (target <= now.getTime() || target - now.getTime() > 4 * 60 * 60_000) return;
  console.log(`waiting until 18:00 IST to post (${Math.round((target - now.getTime()) / 60_000)} min)`);
  while (Date.now() < target) {
    await report(runId, { status: "scheduled", usd });
    await new Promise((r) => setTimeout(r, Math.min(20 * 60_000, target - Date.now())));
  }
}

async function publish() {
  const job = readJson<Job>("job.json");
  const script = readJson<Script>("script.json");
  const state = readJson<RunState>("state.json");
  // Always the privacy the page sets (the owner's rule, 2026-11-12: "the video needs
  // to post no matter which error comes"). Until then a run the review didn't clear
  // went up private and skipped Instagram, which is how 11 Nov's video sat unseen
  // over captions only the code could fix. What the review still flags after its
  // fix rounds is in the run's warnings and the owner's mail.
  const privacy = job.privacy;
  const slug = runId;
  const language = job.language ?? "hinglish";

  if (job.source === "schedule") await holdUntilPostTime(state.usage.usd);
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
      siteLinks(state, "video", slug, true),
      chapters(timeline),
      FOLLOW,
      hashtags(script.landscape, false),
    ].filter(Boolean).join("\n\n");
    state.landscapeId = await uploadVideo(token, landscapeFile, { title: script.landscape.title, description, tags: script.landscape.tags, privacy, language });
    await recordUpload(runId, "landscape", state.landscapeId, script.landscape.title, landscapeHash, onSite(state, privacy, timeline.duration));
    const playlist = playlistName(script, language, false);
    for (const problem of [
      await setThumbnail(token, state.landscapeId, path.join(dir, "thumbnail.jpg")),
      await setCaptions(token, state.landscapeId, path.join(cutDir("landscape"), "captions.srt"), language),
      await addToPlaylist(token, state.landscapeId, playlist, playlistAbout(playlist)),
      privacy === "public" ? await postComment(token, state.landscapeId, commentText(state, "comment", slug)) : null,
    ]) {
      if (problem) state.warnings.push(problem);
    }
  }

  const shortFile = path.join(cutDir("short"), "video.mp4");
  const coverFile = path.join(dir, "cover.jpg");
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
      siteLinks(state, "short", slug, false),
      hashtags(script.short, true),
    ].filter(Boolean).join("\n\n");
    const token = shortClaim.accessToken;
    state.shortId = await uploadVideo(token, shortFile, { title: script.short.title, description, tags: script.short.tags, privacy, language });
    const shortTimeline = JSON.parse(readFileSync(path.join(cutDir("short"), "timeline.json"), "utf8")) as Timeline;
    await recordUpload(runId, "short", state.shortId, script.short.title, shortHash, onSite(state, privacy, shortTimeline.duration));
    // The designed cover, the same one the reel gets; without it YouTube picks a frame.
    const playlist = playlistName(script, language, true);
    for (const problem of [
      existsSync(coverFile) ? await setThumbnail(token, state.shortId, coverFile) : null,
      await setCaptions(token, state.shortId, path.join(cutDir("short"), "captions.srt"), language),
      await addToPlaylist(token, state.shortId, playlist, playlistAbout(playlist)),
      privacy === "public" ? await postComment(token, state.shortId, commentText(state, "short-comment", slug)) : null,
    ]) {
      if (problem) state.warnings.push(problem);
    }
  }
  // The same Short as an Instagram reel. Instagram has no private posts, so only a
  // run that went up public is posted there; the API says no when it's not connected.
  const caption = reelCaption(script, state.practiceUrl);
  const reelProblem = await postReel(runId, {
    file: shortFile,
    cover: existsSync(coverFile) ? coverFile : null,
    // The caption's first line is how a re-run recognises the reel on the account.
    title: caption.split("\n")[0]!,
    caption,
    // The topic up to its colon: Instagram cuts an audio name at 60 characters.
    audioName: `${script.topic.split(":")[0]!.trim().slice(0, 45)} · CodeKairo`,
    publish: privacy === "public",
  });
  if (reelProblem) state.warnings.push(reelProblem);

  await report(runId, { status: "done", privacy, warnings: state.warnings, usd: state.usage.usd });
}

/**
 * The hook first, since it is all Instagram shows before "more", and how a re-run
 * recognises the reel on the account (reelOnAccount on the API). Then the idea, the
 * save/share line and a question (saves, shares and comments are what Instagram
 * ranks a reel on). Links in a caption aren't clickable, so the site is written out
 * for reading. Three to five specific hashtags; generic reach tags read as spam.
 * Scripts from before the reel field fall back to the Short's words.
 */
function reelCaption(script: Script, practiceUrl: string): string {
  const reel = script.reel;
  const tags = [...(reel?.hashtags ?? []), ...script.short.hashtags, ...script.short.tags]
    .map((t) => t.replace(/[^a-z0-9]/gi, "").toLowerCase())
    .filter((t, i, all) => t && !GENERIC_TAGS.has(t) && t.length <= 30 && all.indexOf(t) === i)
    .slice(0, 5)
    .map((t) => `#${t}`)
    .join(" ");
  const page = practiceUrl.replace(/^https?:\/\//, "").replace(/\?.*$/, "");
  return [
    (reel?.hook ?? script.short.title).replace(/\s*\n\s*/g, " ").trim(),
    reel?.caption ?? script.short.description,
    `Practise it free on CodeKairo: ${page}`,
    "A new coding interview explainer every day. Follow so you don't miss the next one.",
    tags,
  ]
    .filter(Boolean)
    .join("\n\n")
    .slice(0, 2200);
}

const GENERIC_TAGS = new Set(["shorts", "reels", "reel", "viral", "fyp", "foryou", "explore", "explorepage", "trending"]);

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
