/**
 * The Short as an Instagram reel. The API (src/services/video-instagram.ts) holds
 * the token and makes every call to Instagram; this sends the file, waits for
 * Instagram to process it and asks for the publish. Every failure here is a
 * sentence for the run's warnings, never a failed run: the videos are on YouTube
 * either way.
 */
import { readFileSync } from "node:fs";
import { claimReel, dropReel, publishReel, reelStatus, stageReel, startReel } from "./runner.ts";

/** Meta suggests checking a container about once a minute; a reel this size is usually ready in one or two. */
const POLL_MS = 20_000;
const POLL_LIMIT_MS = 12 * 60_000;

/** Null when it is on Instagram (or was meant to be skipped quietly), else what went wrong. */
export async function postReel(runId: string, file: string, title: string, caption: string, publish: boolean): Promise<string | null> {
  let name: string | undefined;
  try {
    const claim = await claimReel(runId, title, publish);
    if ("skip" in claim) return claim.skip;
    if ("mediaId" in claim) {
      console.log(`reel already up: ${claim.url ?? claim.mediaId}`);
      return null;
    }
    name = (await stageReel(runId, readFileSync(file))).name;
    const { containerId } = await startReel(runId, name, caption);
    const started = Date.now();
    for (;;) {
      await new Promise((r) => setTimeout(r, POLL_MS));
      const state = await reelStatus(runId, containerId);
      if (state.statusCode === "FINISHED") break;
      if (state.statusCode === "ERROR" || state.statusCode === "EXPIRED") return `Not on Instagram: it refused the video (${state.status || state.statusCode}).`;
      if (Date.now() - started > POLL_LIMIT_MS) return "Not on Instagram: it was still processing the video after 12 minutes.";
    }
    const reel = await publishReel(runId, name, containerId);
    name = undefined; // published: the API deleted its copy
    console.log(`reel: ${reel.url ?? reel.mediaId}`);
    return null;
  } catch (e) {
    return `Not on Instagram: ${(e as Error).message}`;
  } finally {
    if (name) await dropReel(runId, name);
  }
}
