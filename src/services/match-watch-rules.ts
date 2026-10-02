/**
 * Watching a knockout match live: each player's editor, relayed to the
 * tournament's organizers — and CodeKairo's admins — as it is typed: the
 * match room's watch view (frontend battles/src/components/contest/
 * WatchPane). Staff in a match room have no editor, no Run and no Submit
 * of their own; what they get instead is both sides' code, side by side,
 * as it changes.
 *
 * Everyone else may spectate a public match (since 2026-10-02, signed in
 * or not): they get each side's *activity* — the language, how many lines,
 * when it last changed, so the room can say who is typing — and never the
 * code, which is published only when the tournament is over (battles-view-
 * rules.ts says why: every match of a round is on the same problem).
 *
 * No database in this file, so match-watch-rules.test.ts drives the whole
 * protocol with fakes; match-watch.ts binds the real seat lookup
 * (knockout.ts matchSeat) and the process's store.
 *
 * Socket events on the default namespace, every one decided by the seat
 * lookup — the account behind the socket's verified token against the
 * match row — never by anything the client says about itself:
 *
 *   play-match  (matchId, ack)  a player's room opens its relay: admitted
 *                               only for one of the match's two players,
 *                               while the match is not over.
 *   match-code  {matchId, code, language}
 *                               the player's buffer (the client throttles
 *                               it); dropped from a socket play-match did
 *                               not admit, and outside the match's clock.
 *   watch-match (matchId, ack)  an organizer or CodeKairo admin who is not
 *                               a player of the match joins its watch room;
 *                               the ack carries both sides' latest buffers.
 *   unwatch-match (matchId)
 *   spectate-match (matchId, ack)
 *                               anyone, anonymous sockets included, joins a
 *                               public match's spectate room; the ack
 *                               carries each side's latest activity.
 *   unspectate-match (matchId)
 *
 * and out: `match-code` {matchId, side, code, language, at} to the watch
 * room, at most one per side per RELAY_GAP_MS; `match-activity` {matchId,
 * side, language, lines, at} to the spectate room, at most one per side per
 * ACTIVITY_GAP_MS (a hall of spectators needs "typing", not every
 * keystroke); and `match-code-resend` to the players when a watcher arrives
 * to a side the server holds nothing for (the API restarted, or the player
 * has not typed since reconnecting).
 *
 * Nothing is written to the database. The latest buffer of each side is
 * kept in memory for LIVE_DRAFT_TTL_MS after its last change, so an
 * organizer who opens a match late, or reloads, sees where each player is,
 * and a decided match keeps its final code on screen for a while. One
 * process holds them — the API runs as one instance (backend/deploy); with
 * a second one a watcher there would still get every change through the
 * socket.io adapter, only not the snapshot on joining.
 *
 * Players are told in the room that the organizers and CodeKairo's admins
 * can follow their code, and the Battles privacy policy says so, as it says
 * what spectators see (frontend battles/src/content/battles-policies.ts,
 * "What an organizer sees" and "What is public").
 */
export const matchWatchRoom = (matchId: string) => `match-watch:${matchId}`;
export const matchPlayRoom = (matchId: string) => `match-play:${matchId}`;
export const matchSpectateRoom = (matchId: string) => `match-spectate:${matchId}`;

/** The editor's languages (frontend components/problems/CodeEditor LANGUAGE_OPTIONS). */
const LANGUAGES = new Set(["javascript", "typescript", "python", "java", "cpp", "c", "csharp", "go", "kotlin", "swift", "rust", "php", "ruby"]);
/** /api/submit's own cap (routes/execution.ts): a buffer no submission could carry is not relayed either. */
export const MAX_CODE_CHARS = 65_536;
/** How long a side's buffer outlives its last change. */
export const LIVE_DRAFT_TTL_MS = 30 * 60_000;
/** The most matches held at once; the least recently changed goes first. */
const MAX_MATCHES = 2_000;
/** The fastest one side's code reaches the watchers, whatever a client sends. */
export const RELAY_GAP_MS = 150;
/** The fastest one side's activity reaches the spectators: enough for "typing" (the client's window is 2.5 s). */
export const ACTIVITY_GAP_MS = 1_000;
/** How long a socket's seat is trusted before the match row is read again (a match ends, a waiting one starts). */
const SEAT_TTL_MS = 5_000;

export type Side = "a" | "b";
export interface LiveDraft {
  code: string;
  language: string;
  at: number;
}

/** What a spectator learns of a side's buffer: never the code. */
export interface LiveActivity {
  language: string;
  lines: number;
  at: number;
}

export const activityOf = (d: LiveDraft | null): LiveActivity | null => (d ? { language: d.language, lines: d.code === "" ? 0 : d.code.split("\n").length, at: d.at } : null);

/** A player's relayed buffer, or null for anything that is not one. */
export function sanitizeDraft(payload: unknown): { matchId: string; code: string; language: string } | null {
  if (!payload || typeof payload !== "object") return null;
  const { matchId, code, language } = payload as Record<string, unknown>;
  if (typeof matchId !== "string" || !matchId || matchId.length > 64) return null;
  if (typeof code !== "string" || code.length > MAX_CODE_CHARS) return null;
  if (typeof language !== "string" || !LANGUAGES.has(language)) return null;
  return { matchId, code, language };
}

/**
 * Who an account is to one match (knockout.ts matchSeat): one of its
 * players, an organizer of the tournament, a CodeKairo admin — or none of
 * these; null when the match is not a published knockout's.
 */
export type Seat = { side: Side | null; manager: boolean; admin?: boolean; status: string; startedAt: Date | null; endsAt: Date | null } | null;

/** A player may open the relay for a match they sit that is not over — during the break too, so it is ready at the start. */
export const playAllowed = (seat: Seat): boolean => !!seat && seat.side !== null && seat.status !== "done";

/** Their code is relayed only while the match is being played: not before the problem opens, not after the clock. */
export function relayAllowed(seat: Seat, now: number): boolean {
  if (!seat || seat.side === null || seat.status !== "live" || !seat.startedAt) return false;
  return seat.startedAt.getTime() <= now && (!seat.endsAt || now < seat.endsAt.getTime());
}

/** Only staff watch the code — the tournament's organizers and CodeKairo's admins — and never one who plays in the match. */
export const watchAllowed = (seat: Seat): boolean => !!seat && seat.side === null && (seat.manager || seat.admin === true);

/** The latest buffer of each side of each match, forgotten LIVE_DRAFT_TTL_MS after its last change. */
export class LiveDrafts {
  private byMatch = new Map<string, { a?: LiveDraft; b?: LiveDraft; touched: number }>();

  set(matchId: string, side: Side, draft: LiveDraft): void {
    const entry = this.byMatch.get(matchId) ?? { touched: 0 };
    entry[side] = draft;
    entry.touched = draft.at;
    // Re-inserted so the Map's order is least recently changed first.
    this.byMatch.delete(matchId);
    this.byMatch.set(matchId, entry);
    if (this.byMatch.size > MAX_MATCHES) {
      const oldest = this.byMatch.keys().next().value;
      if (oldest !== undefined) this.byMatch.delete(oldest);
    }
  }

  get(matchId: string): { a: LiveDraft | null; b: LiveDraft | null } {
    const entry = this.byMatch.get(matchId);
    return { a: entry?.a ?? null, b: entry?.b ?? null };
  }

  sweep(now: number): void {
    for (const [id, entry] of this.byMatch) if (now - entry.touched > LIVE_DRAFT_TTL_MS) this.byMatch.delete(id);
  }

  get size(): number {
    return this.byMatch.size;
  }
}

/** What this module needs of the socket.io server and a socket — structural, so tests can hand it fakes. */
export interface WatchIo {
  to(room: string): { emit(event: string, payload: unknown): unknown };
}
export interface WatchSocket {
  data: { userId?: string };
  rooms: Set<string>;
  join(room: string): unknown;
  leave(room: string): unknown;
  on(event: string, listener: (...args: any[]) => void): unknown;
}

/** What one relay sends for a side's latest buffer, and where. */
type Send = (io: WatchIo, matchId: string, side: Side, draft: LiveDraft) => void;

/** The code itself, to the staff watching. */
export const sendCode: Send = (io, matchId, side, draft) => io.to(matchWatchRoom(matchId)).emit("match-code", { matchId, side, ...draft });
/** The activity alone, to the spectators. */
export const sendActivity: Send = (io, matchId, side, draft) => io.to(matchSpectateRoom(matchId)).emit("match-activity", { matchId, side, ...activityOf(draft) });

/**
 * One side's buffer reaches a room at most once per gap — RELAY_GAP_MS for
 * the code to the watchers, ACTIVITY_GAP_MS for the activity to the
 * spectators: a change inside the gap is held and the latest buffer goes
 * out when it closes, so the last keystroke is never lost and a client
 * sending on every keypress cannot flood the rooms.
 */
export class Relay {
  private last = new Map<string, number>();
  private held = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(
    private readonly drafts: LiveDrafts,
    private readonly gapMs = RELAY_GAP_MS,
    private readonly send: Send = sendCode,
  ) {}

  push(io: WatchIo, matchId: string, side: Side): void {
    const key = `${matchId}:${side}`;
    if (this.held.has(key)) return;
    const wait = (this.last.get(key) ?? 0) + this.gapMs - Date.now();
    const send = () => {
      this.held.delete(key);
      this.last.set(key, Date.now());
      const draft = this.drafts.get(matchId)[side];
      if (draft) this.send(io, matchId, side, draft);
    };
    if (wait <= 0) send();
    else this.held.set(key, setTimeout(send, wait));
  }
}

/** What registerMatchWatch is handed: the store, the two relays and the lookups match-watch.ts binds to the database. */
export interface WatchDeps {
  drafts: LiveDrafts;
  relay: Relay;
  /** The spectators' relay (sendActivity); without one, nobody spectates. */
  activity?: Relay;
  seatOf: (userId: string, matchId: string) => Promise<Seat>;
  /** Whether anyone may spectate the match: a published knockout's, of a verified organizer. */
  isPublicMatch?: (matchId: string) => Promise<boolean>;
}

/** Wire one socket's watch events; match-watch.ts binds the real seat lookup and the process's store. */
export function registerMatchWatch(io: WatchIo, socket: WatchSocket, deps: WatchDeps): void {
  const seats = new Map<string, { seat: Seat; at: number }>();
  const seatFor = async (matchId: string, maxAgeMs: number): Promise<Seat> => {
    const userId = socket.data.userId;
    if (!userId) return null;
    const hit = seats.get(matchId);
    if (hit && Date.now() - hit.at < maxAgeMs) return hit.seat;
    const seat = await deps.seatOf(userId, matchId);
    seats.set(matchId, { seat, at: Date.now() });
    // A socket sits one match at a time; a handful covers a tab walking the bracket.
    if (seats.size > 16) seats.delete(seats.keys().next().value!);
    return seat;
  };
  const reply = (ack: unknown, body: unknown) => {
    if (typeof ack === "function") (ack as (b: unknown) => void)(body);
  };

  socket.on("play-match", async (matchId: unknown, ack?: unknown) => {
    try {
      if (typeof matchId !== "string" || !matchId) return reply(ack, { ok: false });
      const seat = await seatFor(matchId, 0);
      if (!playAllowed(seat)) return reply(ack, { ok: false });
      socket.join(matchPlayRoom(matchId));
      reply(ack, { ok: true });
    } catch (err) {
      console.error("play-match error:", err);
      reply(ack, { ok: false });
    }
  });

  socket.on("match-code", async (payload: unknown) => {
    const draft = sanitizeDraft(payload);
    if (!draft || !socket.rooms.has(matchPlayRoom(draft.matchId))) return;
    try {
      const seat = await seatFor(draft.matchId, SEAT_TTL_MS);
      const now = Date.now();
      if (!seat?.side || !relayAllowed(seat, now)) return;
      deps.drafts.set(draft.matchId, seat.side, { code: draft.code, language: draft.language, at: now });
      deps.relay.push(io, draft.matchId, seat.side);
      deps.activity?.push(io, draft.matchId, seat.side);
    } catch (err) {
      console.error("match-code error:", err);
    }
  });

  socket.on("watch-match", async (matchId: unknown, ack?: unknown) => {
    try {
      if (typeof matchId !== "string" || !matchId) return reply(ack, { ok: false });
      const seat = await seatFor(matchId, 0);
      if (!watchAllowed(seat)) return reply(ack, { ok: false });
      socket.join(matchWatchRoom(matchId));
      const snapshot = deps.drafts.get(matchId);
      reply(ack, { ok: true, ...snapshot });
      if (!snapshot.a || !snapshot.b) io.to(matchPlayRoom(matchId)).emit("match-code-resend", { matchId });
    } catch (err) {
      console.error("watch-match error:", err);
      reply(ack, { ok: false });
    }
  });

  socket.on("unwatch-match", (matchId: unknown) => {
    if (typeof matchId === "string" && matchId) socket.leave(matchWatchRoom(matchId));
  });

  // Spectators: no seat is needed or looked up — an anonymous socket has no
  // account to seat. What decides is whether the match is public, read
  // once per match per socket (a published match stays published).
  const publicMatches = new Set<string>();
  socket.on("spectate-match", async (matchId: unknown, ack?: unknown) => {
    try {
      if (typeof matchId !== "string" || !matchId || matchId.length > 64 || !deps.activity || !deps.isPublicMatch) return reply(ack, { ok: false });
      if (!publicMatches.has(matchId)) {
        if (!(await deps.isPublicMatch(matchId))) return reply(ack, { ok: false });
        publicMatches.add(matchId);
        if (publicMatches.size > 16) publicMatches.delete(publicMatches.values().next().value!);
      }
      socket.join(matchSpectateRoom(matchId));
      const snapshot = deps.drafts.get(matchId);
      reply(ack, { ok: true, a: activityOf(snapshot.a), b: activityOf(snapshot.b) });
    } catch (err) {
      console.error("spectate-match error:", err);
      reply(ack, { ok: false });
    }
  });

  socket.on("unspectate-match", (matchId: unknown) => {
    if (typeof matchId === "string" && matchId) socket.leave(matchSpectateRoom(matchId));
  });
}
