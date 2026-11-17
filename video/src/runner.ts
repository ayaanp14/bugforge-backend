/**
 * The pipeline's line back to the API (src/routes/video-studio.ts): what to make, how
 * it is going, and whether an upload may go ahead. The YouTube refresh token stays
 * there, so nothing here can outlive the run. No API_URL: a local run, and these only print.
 */

const URL_BASE = process.env["API_URL"]?.replace(/\/$/, "");
const SECRET = process.env["VIDEO_RUNNER_SECRET"];

/** What a connection that never opened throws with (fetch's TypeError carries it as `cause.code`). */
const NOT_SENT_CODES = new Set(["ECONNREFUSED", "ENOTFOUND", "EAI_AGAIN", "ENETUNREACH", "EHOSTUNREACH", "UND_ERR_CONNECT_TIMEOUT"]);

/**
 * Whether a failed fetch never reached the API — the connection did not open,
 * so nothing was sent and the request can go again whatever it asks for. Not a
 * reset or a lost answer, which may have been acted on.
 *
 * ETIMEDOUT counts only from the connect: Node tries each address of the host
 * (IPv6, IPv4) and reports one AggregateError when all of them time out, which
 * is what 17 Nov 2026's video died of — api.codekairo.com points straight at the
 * instance, and at 18:00 IST it took no connection for a moment, between status
 * lines that went through on either side of it.
 */
export function neverSent(err: unknown): boolean {
  const cause = (err as { cause?: { code?: unknown; syscall?: unknown; name?: unknown; errors?: unknown } } | null)?.cause;
  if (!cause || typeof cause.code !== "string") return false;
  if (NOT_SENT_CODES.has(cause.code)) return true;
  return cause.code === "ETIMEDOUT" && (cause.syscall === "connect" || cause.name === "AggregateError" || Array.isArray(cause.errors));
}

/** The waits between tries of a request that never left: ~2.5 minutes in all, longer than a blip, short of a real outage. */
const RETRY_WAITS_MS = [5_000, 10_000, 20_000, 40_000, 75_000];

/**
 * One request to the runner API. A connection that never opened is tried again
 * (`neverSent`), so one bad moment on the network cannot cost the day's video;
 * `retry: false` for the status lines, which are fire-and-forget and must not
 * hold the pipeline for minutes while the API is away.
 */
async function call(path: string, init: RequestInit = {}, opts: { retry?: boolean } = {}): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fetch(`${URL_BASE}/api/video-studio/runner/${path}`, {
        ...init,
        headers: { Authorization: `Bearer ${SECRET}`, "Content-Type": "application/json", ...init.headers },
      });
    } catch (err) {
      const wait = RETRY_WAITS_MS[attempt];
      if (opts.retry === false || wait === undefined || !neverSent(err)) throw err;
      const code = (err as { cause?: { code?: string } }).cause?.code;
      console.warn(`${path.split("/").slice(1).join("/") || "job"}: no connection to the API (${code}); trying again in ${wait / 1000} s`);
      await new Promise((done) => setTimeout(done, wait));
    }
  }
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
  // A lost status line must never cost the video it describes — nor hold it up: not retried.
  await call(`${id}/status`, { method: "POST", body: JSON.stringify(status) }, { retry: false }).catch((e: Error) => console.warn(`status not sent: ${e.message}`));
}

/** The topic was already made: a replacement, or a thrown sentence if this one was typed. */
export async function nextTopic(id: string, duplicateOf: string): Promise<string> {
  const res = await call(`${id}/next-topic`, { method: "POST", body: JSON.stringify({ duplicateOf }) });
  const body = (await res.json()) as { prompt?: string; error?: string };
  if (!res.ok || !body.prompt) throw new Error(body.error ?? `next-topic: ${res.status}`);
  return body.prompt;
}

export type Claim = { videoId: string } | { accessToken: string };

/**
 * Asked immediately before each upload. A refusal throws: the video is already on the channel.
 *
 * Also tried again on a server error, not only a connection that never opened: the
 * claim uploads nothing (the API answers a token, or the id of an upload already
 * made), and the same run claiming the same cut twice is answered the same way
 * (lib/video-studio decideClaim), so a second ask can never post twice. The API
 * reads YouTube to answer it, which is where a passing 5xx comes from.
 */
export async function claimUpload(id: string, format: string, title: string, sha256: string): Promise<Claim> {
  if (!URL_BASE) throw new Error("API_URL is not set: publishing needs the API's YouTube connection.");
  for (let attempt = 1; ; attempt++) {
    const res = await call(`${id}/claim`, { method: "POST", body: JSON.stringify({ format, title, sha256 }) });
    const body = (await res.json().catch(() => ({}))) as Claim & { error?: string };
    if (res.ok) return body;
    if (res.status < 500 || attempt >= 4) throw new Error(body.error ?? `claim: ${res.status}`);
    console.warn(`claim: the API answered ${res.status}; asking again in ${attempt * 15} s`);
    await new Promise((done) => setTimeout(done, attempt * 15_000));
  }
}

/** `site`: the pages the video belongs on and whether it went up public (only then is it shown there). */
export async function recordUpload(id: string, format: string, videoId: string, title: string, sha256: string, site: { pages: string[]; public: boolean; seconds: number } | null = null): Promise<void> {
  // Retried hard: this is the line that keeps a re-run from posting it again.
  for (let attempt = 1; ; attempt++) {
    const res = await call(`${id}/uploaded`, { method: "POST", body: JSON.stringify({ format, videoId, title, sha256, ...site }) }).catch(() => null);
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

/** The MP4 (or its JPEG cover) to the API, which serves it to Instagram: Instagram fetches a reel from a URL. */
export const stageReel = (id: string, file: Buffer, type: "video/mp4" | "image/jpeg" = "video/mp4") =>
  reelCall<{ name: string }>(`${id}/reel/file`, { method: "POST", headers: { "Content-Type": type }, body: new Uint8Array(file) });

export const startReel = (id: string, name: string, caption: string, extra: { cover?: string; audioName?: string } = {}) =>
  reelCall<{ containerId: string }>(`${id}/reel/start`, { method: "POST", body: JSON.stringify({ name, caption, ...extra }) });

export const reelStatus = (id: string, containerId: string) => reelCall<{ statusCode: string; status: string }>(`${id}/reel/status/${containerId}`);

export const publishReel = (id: string, name: string, containerId: string, cover?: string) =>
  reelCall<{ mediaId: string; url: string | null }>(`${id}/reel/publish`, { method: "POST", body: JSON.stringify({ name, containerId, cover }) });

/** Deletes the API's copy now rather than in two hours. */
export const dropReel = (id: string, name: string) =>
  call(`${id}/reel/drop`, { method: "POST", body: JSON.stringify({ name }) }, { retry: false }).then(() => undefined, () => undefined);
