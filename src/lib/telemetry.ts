/**
 * Error reporting for the API, and the ingest for the SPA's.
 *
 * Until this existed, a production failure left one trace: a `console.error`
 * line in the Railway log, which nobody reads unless someone has already
 * complained. `/voice/complete` returned 500 for a day before anyone noticed.
 * Every error now also becomes an `ErrorReport` row that the admin panel
 * groups and counts, so "what broke this week" is a page rather than a grep.
 *
 * Three rules keep this from becoming a problem of its own:
 *
 *  - It never throws and never awaits on the request path. A report is a
 *    fire-and-forget insert; if the database is the thing that is down, the
 *    insert fails quietly and the log line still exists.
 *  - It is bounded. The same fingerprint is written at most once per
 *    THROTTLE_MS per instance, so a dependency outage that fails every request
 *    produces a handful of rows a minute, not one per request.
 *  - It groups. Messages carry ids, numbers and paths that differ per
 *    occurrence; the fingerprint strips them so a defect is one line in the
 *    panel with a count, not a thousand lines that all say the same thing.
 */
import { AsyncLocalStorage } from "node:async_hooks";
import { createHash } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { prisma } from "./prisma.js";

export type ErrorSource = "api" | "web" | "android";

export interface ErrorInput {
  source: ErrorSource;
  kind: string;
  message: string;
  stack?: string | null;
  path?: string | null;
  userId?: string | null;
  userAgent?: string | null;
  release?: string | null;
  meta?: Record<string, unknown> | null;
}

/* ── fingerprinting ────────────────────────────────────────────────── */

const MAX_MESSAGE = 2000;
const MAX_STACK = 8000;

/**
 * The message with everything that varies per occurrence taken out: hex ids
 * and cuids, plain numbers, quoted strings, and URLs. "Order ck_3f9a not
 * found" and "Order ck_77b1 not found" are the same defect.
 */
export function normaliseMessage(message: string): string {
  return message
    .slice(0, 400)
    .replace(/https?:\/\/[^\s"')]+/g, "<url>")
    .replace(/"[^"]{0,120}"/g, '"<str>"')
    .replace(/'[^']{0,120}'/g, "'<str>'")
    // Any token of eight or more that carries a digit: a cuid, an order id
    // ("ck_3f9a…"), a hex hash, a session token.
    .replace(/\b(?=[a-z0-9_-]*\d)[a-z0-9_-]{8,}\b/gi, "<id>")
    .replace(/\d+(\.\d+)?/g, "<n>")
    .trim()
    .toLowerCase();
}

/** The first frame that belongs to us, so two errors thrown from the same line group together. */
function topFrame(stack: string | null | undefined): string {
  if (!stack) return "";
  const frames = stack.split("\n").slice(1);
  const own = frames.find((f) => !/node_modules|node:internal|\(<anonymous>\)/.test(f)) ?? frames[0] ?? "";
  // Drop column numbers: a re-deploy shifts them without the code changing.
  return own.trim().replace(/:\d+:\d+\)?$/, "").replace(/:\d+\)?$/, "");
}

export function fingerprintOf(input: Pick<ErrorInput, "source" | "kind" | "message" | "stack">): string {
  const material = `${input.source}|${input.kind}|${normaliseMessage(input.message)}|${topFrame(input.stack)}`;
  return createHash("sha1").update(material).digest("hex");
}

/* ── writing ───────────────────────────────────────────────────────── */

/**
 * Off switch. Set in the unit tests, which exercise code that reports as a
 * side effect (a granted subscription tracks an event) and must not open a
 * database connection to do it — a pool that opens is a process that never
 * exits, and the test runner waits on it forever.
 */
const disabled = (): boolean => process.env["TELEMETRY_DISABLED"] === "true";

const THROTTLE_MS = 10_000;
const THROTTLE_MAX_KEYS = 2000;
const lastWritten = new Map<string, number>();

/** Whether this fingerprint was written in the last window; records it if not. */
function admit(fingerprint: string, now = Date.now()): boolean {
  const last = lastWritten.get(fingerprint);
  if (last !== undefined && now - last < THROTTLE_MS) return false;
  if (lastWritten.size >= THROTTLE_MAX_KEYS) lastWritten.clear();
  lastWritten.set(fingerprint, now);
  return true;
}

/** Test seam: forget the throttle so the same error may be written again. */
export function resetThrottle(): void {
  lastWritten.clear();
}

const clip = (value: string | null | undefined, max: number): string | null =>
  value == null ? null : value.length > max ? value.slice(0, max) : value;

/**
 * Record one error. Returns the fingerprint so a caller can echo it to the
 * user ("quote this to support"); the write itself is not awaited.
 */
export function reportError(input: ErrorInput): string {
  const message = (input.message || "Unknown error").slice(0, MAX_MESSAGE);
  const fingerprint = fingerprintOf({ ...input, message });
  if (disabled() || !admit(fingerprint)) return fingerprint;

  prisma.errorReport
    .create({
      data: {
        source: input.source,
        kind: input.kind.slice(0, 24),
        message,
        stack: clip(input.stack, MAX_STACK),
        path: clip(input.path, 512),
        fingerprint,
        userId: input.userId ?? null,
        userAgent: clip(input.userAgent, 512),
        release: clip(input.release, 64),
        meta: input.meta ? (input.meta as object) : undefined,
      },
      select: { id: true },
    })
    .catch((err: unknown) => {
      // Once, not per failure: if the database is down every report fails.
      if (!warnedWriteFailure) {
        warnedWriteFailure = true;
        console.error("[telemetry] could not write error report:", (err as Error)?.message ?? err);
      }
    });

  return fingerprint;
}

let warnedWriteFailure = false;

/** Whatever was thrown, as message + stack. */
export function describeError(err: unknown): { message: string; stack: string | null; name: string | null; code: string | null } {
  if (err instanceof Error) {
    return { message: err.message || err.name, stack: err.stack ?? null, name: err.name, code: (err as { code?: string }).code ?? null };
  }
  return { message: typeof err === "string" ? err : JSON.stringify(err) ?? String(err), stack: null, name: null, code: null };
}

/* ── the request scope ─────────────────────────────────────────────── */

/**
 * Most 500s in this API are not unhandled: the route caught the error,
 * logged it with `console.error`, and answered `{ error: "Internal server
 * error" }` itself — sixty-odd catch blocks, all of that shape. Rather than
 * edit each one to also call reportError, the response is watched for a 5xx
 * status and the *log line the route already writes* is read back from a
 * per-request store: the first `Error` passed to console.error during the
 * request is the one to attach. AsyncLocalStorage follows the request through
 * every await, so a log from deep inside a service still lands on the right
 * response.
 */
interface RequestScope {
  error: unknown;
}

const scope = new AsyncLocalStorage<RequestScope>();

let consoleHooked = false;

/** Keep the first Error argument of a console.error call inside the current request. */
function hookConsoleError(): void {
  if (consoleHooked) return;
  consoleHooked = true;
  const original = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    const store = scope.getStore();
    if (store && store.error === undefined) {
      const thrown = args.find((a) => a instanceof Error) ?? args.find((a) => typeof a === "string" && a.length > 0);
      if (thrown !== undefined) store.error = thrown;
    }
    original(...args);
  };
}

/**
 * Express middleware: opens the scope and reports any 5xx the response ends
 * with. Mount before the routers, after the body parsers.
 */
export function errorTelemetry(req: Request, res: Response, next: NextFunction): void {
  hookConsoleError();
  const store: RequestScope = { error: undefined };
  res.on("finish", () => {
    if (res.statusCode < 500) return;
    const thrown = store.error;
    const described = thrown === undefined ? { message: `HTTP ${res.statusCode}`, stack: null, name: null, code: null } : describeError(thrown);
    reportError({
      source: "api",
      kind: "response",
      message: described.message,
      stack: described.stack,
      path: `${req.method} ${req.route?.path ? req.baseUrl + String(req.route.path) : req.originalUrl.split("?")[0]}`,
      userId: (req as Request & { user?: { userId: string } }).user?.userId ?? null,
      userAgent: req.headers["user-agent"] ?? null,
      meta: { status: res.statusCode, name: described.name, code: described.code, url: req.originalUrl.slice(0, 512) },
    });
  });
  scope.run(store, next);
}

/**
 * Mark the current request's error explicitly. For the final Express error
 * handler, which receives the error as an argument rather than logging it.
 */
export function noteRequestError(err: unknown): void {
  const store = scope.getStore();
  if (store && store.error === undefined) store.error = err;
}

/* ── the browser's reports ─────────────────────────────────────────── */

const CLIENT_KINDS = new Set(["window", "rejection", "render", "chunk", "http"]);

/**
 * Validate and shape what the SPA (or the app) posts to /api/events/errors.
 * The caller is untrusted: every field is clipped, unknown kinds are folded
 * into "window", and nothing here can throw.
 */
export function parseClientError(
  body: unknown,
  ctx: { userId: string | null; userAgent: string | null; source: ErrorSource },
): ErrorInput | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const message = typeof b["message"] === "string" ? b["message"].trim() : "";
  if (!message) return null;
  const kind = typeof b["kind"] === "string" && CLIENT_KINDS.has(b["kind"]) ? b["kind"] : "window";
  const meta: Record<string, unknown> = {};
  if (typeof b["componentStack"] === "string") meta["componentStack"] = b["componentStack"].slice(0, 4000);
  if (typeof b["status"] === "number") meta["status"] = b["status"];
  if (typeof b["url"] === "string") meta["url"] = b["url"].slice(0, 512);
  return {
    source: ctx.source,
    kind,
    message: message.slice(0, MAX_MESSAGE),
    stack: typeof b["stack"] === "string" ? b["stack"].slice(0, MAX_STACK) : null,
    path: typeof b["path"] === "string" ? b["path"].slice(0, 512) : null,
    release: typeof b["release"] === "string" ? b["release"].slice(0, 64) : null,
    userId: ctx.userId,
    userAgent: ctx.userAgent,
    meta: Object.keys(meta).length > 0 ? meta : null,
  };
}

/* ── product events ────────────────────────────────────────────────── */

export interface EventInput {
  name: string;
  path: string | null;
  props: Record<string, unknown> | null;
  sessionId: string | null;
}

const EVENT_NAME = /^[a-z][a-z0-9_.:-]{0,63}$/;
const MAX_EVENTS_PER_BATCH = 25;
const MAX_PROPS_JSON = 2048;

/**
 * Validate a batch of events from the client. Bad rows are dropped rather
 * than failing the batch: one malformed event must not lose the other
 * twenty-four, and the client is going to retry nothing either way.
 */
export function parseEvents(body: unknown): EventInput[] {
  const raw = body && typeof body === "object" ? (body as { events?: unknown }).events : null;
  if (!Array.isArray(raw)) return [];
  const out: EventInput[] = [];
  for (const item of raw.slice(0, MAX_EVENTS_PER_BATCH)) {
    if (!item || typeof item !== "object") continue;
    const e = item as Record<string, unknown>;
    const name = typeof e["name"] === "string" ? e["name"] : "";
    if (!EVENT_NAME.test(name)) continue;
    let props: Record<string, unknown> | null = null;
    if (e["props"] && typeof e["props"] === "object" && !Array.isArray(e["props"])) {
      const json = JSON.stringify(e["props"]);
      if (json.length <= MAX_PROPS_JSON) props = e["props"] as Record<string, unknown>;
    }
    out.push({
      name,
      path: typeof e["path"] === "string" ? e["path"].slice(0, 512) : null,
      props,
      sessionId: typeof e["sessionId"] === "string" ? e["sessionId"].slice(0, 40) : null,
    });
  }
  return out;
}

/** Record events from a client; not awaited by the route. */
export function recordEvents(events: EventInput[], ctx: { userId: string | null; platform: string }): void {
  if (events.length === 0 || disabled()) return;
  prisma.appEvent
    .createMany({
      data: events.map((e) => ({
        name: e.name,
        userId: ctx.userId,
        sessionId: e.sessionId,
        path: e.path,
        platform: ctx.platform,
        props: e.props ? (e.props as object) : undefined,
      })),
    })
    .catch((err: unknown) => {
      if (!warnedWriteFailure) {
        warnedWriteFailure = true;
        console.error("[telemetry] could not write events:", (err as Error)?.message ?? err);
      }
    });
}

/** A server-side event — a webhook granted access, a job ran — on the same table. */
export function trackServerEvent(name: string, props: Record<string, unknown> | null = null, userId: string | null = null): void {
  if (!EVENT_NAME.test(name)) return;
  recordEvents([{ name, path: null, props, sessionId: null }], { userId, platform: "api" });
}
