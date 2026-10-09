import { prisma } from "../lib/prisma.js";
import { claimRoomSeat, type SeatClaim } from "../lib/seat-claim.js";
import { encodeCode } from "../lib/obfuscation.js";
import { generateInviteCode } from "../lib/room-codes.js";
import { invalidate } from "../lib/cache.js";

/**
 * Opening a pair room and taking a seat in one, shared by the pairing page
 * (routes/pair-rooms.ts) and the cohort sessions (services/cohorts.ts) so the
 * two cannot drift: the same seat cap, the same per-account brake on rooms
 * left waiting, the same host row, the same database-enforced capacity.
 */

/** How long a room can sit unopened before the lobby stops advertising it. */
export const LOBBY_WINDOW_MS = 24 * 60 * 60 * 1000;

/** Waiting rooms one account may have open at a time. */
export const MAX_WAITING_ROOMS_PER_USER = 3;

/** The seats a room may have: two to four. */
export const MIN_SEATS = 2;
export const MAX_SEATS = 4;

/**
 * The lobby is the same list for every caller (the route reads no session)
 * and every open of the pairing page asks for it, so one copy is shared for
 * a few seconds. What changes it drops it: a room opened, joined (it leaves
 * the lobby as it goes active), closed or deleted — so the copy is never
 * staler than the window, and the only thing that reaches it by the clock
 * is a waiting room ageing out of LOBBY_WINDOW_MS.
 */
export const LOBBY_KEY = "pair:lobby:v1";

export function forgetLobby(): void {
  invalidate(LOBBY_KEY);
}

export class PairRoomError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "PairRoomError";
  }
}

/**
 * Open a room on a published problem with the caller as its host. Throws a
 * PairRoomError for a missing problem or too many rooms already waiting.
 * `include` is the caller's own shape of the answer.
 */
export async function openPairRoom<I extends object>(
  userId: string,
  opts: { problemId: string; mode: "private" | "collaborative"; seats: number; include: I },
) {
  // Two to four seats. A room with zero (or a thousand) seats used to be
  // accepted as typed.
  const seats = Number.isInteger(opts.seats) ? Math.min(MAX_SEATS, Math.max(MIN_SEATS, opts.seats)) : MIN_SEATS;

  // A person opens a room and waits in it; they do not need five. Nothing
  // capped it, and every unopened one sat in the lobby for a day. The
  // problem check and the count are independent, so they travel together.
  const [problem, waiting] = await Promise.all([
    prisma.problem.findFirst({ where: { id: opts.problemId, isPublished: true }, select: { id: true } }),
    prisma.pairRoom.count({
      where: { createdBy: userId, status: "waiting", startedAt: { gte: new Date(Date.now() - LOBBY_WINDOW_MS) } },
    }),
  ]);
  if (!problem) throw new PairRoomError("Problem not found", 404);
  if (waiting >= MAX_WAITING_ROOMS_PER_USER) {
    throw new PairRoomError(`You already have ${waiting} rooms waiting for a partner. Join one of those, or close them, before opening another.`, 409);
  }

  // Only generate inviteCode for private rooms. The code is the only thing
  // gating entry, so it comes from the cryptographic generator.
  const rawInviteCode = opts.mode === "private" ? generateInviteCode() : null;

  const room = await prisma.pairRoom.create({
    data: {
      problemId: opts.problemId,
      mode: opts.mode,
      maxParticipants: seats,
      createdBy: userId,
      inviteCode: encodeCode(rawInviteCode),
      status: "waiting",
      // The row has no createdAt; this is what the lobby ages rooms by until
      // a guest arrives and the join below restamps it as the real start.
      startedAt: new Date(),
      participants: { create: { userId, role: "host" } },
    },
    include: opts.include,
  });
  forgetLobby();
  return room;
}

/**
 * Seat the caller in a room (the passcode, kick and closed checks are the
 * caller's). The capacity rule is enforced by the database in the statement
 * that inserts the row (lib/seat-claim.ts); a re-join is `already`.
 */
export async function seatInRoom(roomId: string, userId: string, maxParticipants: number): Promise<SeatClaim> {
  const claim = await claimRoomSeat(roomId, userId, maxParticipants);
  if (claim !== "claimed") return claim;
  // A room becomes active when somebody joins the host. Guarded on the
  // status rather than on a participant count read earlier: two joiners
  // arriving together both saw "one participant" and both wrote, which
  // restamped startedAt and moved the abandonment clock backwards.
  const { count: started } = await prisma.pairRoom.updateMany({
    where: { id: roomId, status: "waiting" },
    data: { status: "active", startedAt: new Date() },
  });
  // Active rooms are not in the lobby.
  if (started > 0) forgetLobby();
  return claim;
}
