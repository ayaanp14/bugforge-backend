/**
 * The pipeline's line back to the API (src/routes/video-studio.ts): what to make, how
 * it is going, and whether an upload may go ahead. The YouTube refresh token stays
 * there, so nothing here can outlive the run. No API_URL: a local run, and these only print.
 */

const URL_BASE = process.env["API_URL"]?.replace(/\/$/, "");
const SECRET = process.env["VIDEO_RUNNER_SECRET"];

async function call(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${URL_BASE}/api/video-studio/runner/${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${SECRET}`, "Content-Type": "application/json", ...init.headers },
  });
}

export interface Job {
  id: string;
  prompt: string;
  privacy: "public" | "unlisted" | "private";
  /** What the narration is spoken in; older runs predate it and read as Hinglish. */
  language?: "hinglish" | "english";
  source: "schedule" | "auto" | "typed";
  /** Everything already on the channel or already made. */
  posted: string[];
}

export async function fetchJob(id: string): Promise<Job> {
  const res = await call(id);
  if (!res.ok) throw new Error(`The API answered ${res.status} for run ${id}`);
  return (await res.json()) as Job;
}

export async function report(id: string, status: Record<string, unknown>): Promise<void> {
  console.log(`[${id}] ${JSON.stringify(status)}`);
  if (!URL_BASE) return;
  // A lost status line must never cost the video it describes.
  await call(`${id}/status`, { method: "POST", body: JSON.stringify(status) }).catch((e: Error) => console.warn(`status not sent: ${e.message}`));
}

/** The topic was already made: a replacement, or a thrown sentence if this one was typed. */
export async function nextTopic(id: string, duplicateOf: string): Promise<string> {
  const res = await call(`${id}/next-topic`, { method: "POST", body: JSON.stringify({ duplicateOf }) });
  const body = (await res.json()) as { prompt?: string; error?: string };
  if (!res.ok || !body.prompt) throw new Error(body.error ?? `next-topic: ${res.status}`);
  return body.prompt;
}

export type Claim = { videoId: string } | { accessToken: string };

/** Asked immediately before each upload. A refusal throws: the video is already on the channel. */
export async function claimUpload(id: string, format: string, title: string, sha256: string): Promise<Claim> {
  if (!URL_BASE) throw new Error("API_URL is not set: publishing needs the API's YouTube connection.");
  const res = await call(`${id}/claim`, { method: "POST", body: JSON.stringify({ format, title, sha256 }) });
  const body = (await res.json()) as Claim & { error?: string };
  if (!res.ok) throw new Error(body.error ?? `claim: ${res.status}`);
  return body;
}

export async function recordUpload(id: string, format: string, videoId: string, title: string, sha256: string): Promise<void> {
  // Retried hard: this is the line that keeps a re-run from posting it again.
  for (let attempt = 1; ; attempt++) {
    const res = await call(`${id}/uploaded`, { method: "POST", body: JSON.stringify({ format, videoId, title, sha256 }) }).catch(() => null);
    if (res?.ok) return;
    if (attempt >= 6) throw new Error(`Uploaded ${videoId} but could not record it (${res?.status ?? "no answer"}).`);
    await new Promise((done) => setTimeout(done, attempt * 5000));
  }
}

/* ── Instagram (src/services/video-instagram.ts on the API) ─────────────── */
//
// Every call to Instagram is the API's: its token never expires, so it never comes
// here. The run sends the file and asks how it is going.

export type ReelClaim = { skip: string | null } | { mediaId: string; url: string | null } | { go: true };

async function reelCall<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await call(path, init);
  const body = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(body.error ?? `${path}: ${res.status}`);
  return body;
}

/** Asked before the reel is made: skip it, it's already up, or go. */
export async function claimReel(id: string, title: string, publish: boolean): Promise<ReelClaim> {
  if (!URL_BASE) return { skip: null };
  return reelCall<ReelClaim>(`${id}/reel/claim`, { method: "POST", body: JSON.stringify({ title, publish }) });
}

/** The MP4 to the API, which serves it to Instagram: Instagram fetches a reel from a URL. */
export const stageReel = (id: string, file: Buffer) =>
  reelCall<{ name: string }>(`${id}/reel/file`, { method: "POST", headers: { "Content-Type": "video/mp4" }, body: new Uint8Array(file) });

export const startReel = (id: string, name: string, caption: string) =>
  reelCall<{ containerId: string }>(`${id}/reel/start`, { method: "POST", body: JSON.stringify({ name, caption }) });

export const reelStatus = (id: string, containerId: string) => reelCall<{ statusCode: string; status: string }>(`${id}/reel/status/${containerId}`);

export const publishReel = (id: string, name: string, containerId: string) =>
  reelCall<{ mediaId: string; url: string | null }>(`${id}/reel/publish`, { method: "POST", body: JSON.stringify({ name, containerId }) });

/** Deletes the API's copy now rather than in two hours. */
export const dropReel = (id: string, name: string) =>
  call(`${id}/reel/drop`, { method: "POST", body: JSON.stringify({ name }) }).then(() => undefined, () => undefined);
