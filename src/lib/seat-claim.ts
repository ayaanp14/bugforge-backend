import { prisma } from "./prisma.js";
import { newId } from "./db-ids.js";

/**
 * Claiming a seat, as one statement.
 *
 * Both seat systems here — a pair room and a duel — enforce the same kind of
 * invariant: *at most N rows may exist for this parent*. Both used to do it by
 * opening an interactive transaction, counting inside it and inserting if the
 * count was low enough. That means the capacity check and the insert are two
 * round trips with a lock held across the gap between them, and on this
 * database a gap is about 270ms wide.
 *
 * A conditional INSERT expresses the same rule in a single statement:
 *
 *   INSERT INTO <seats> (...) SELECT ... WHERE (SELECT COUNT(*) ...) < cap
 *
 * MySQL evaluates the subquery and performs the insert as one operation, and
 * under REPEATABLE READ the read in an `INSERT ... SELECT` takes shared
 * next-key locks on what it counted — so two joiners racing for the last seat
 * are serialised by the engine rather than by us holding a lock across the
 * network. `affectedRows` is the answer: 1 means the seat is taken, 0 means
 * the room was full. Nothing is held between statements because there is only
 * one statement.
 *
 * Re-joining is a duplicate key on the existing `@@unique` and is reported as
 * `already`, which every caller treats as an idempotent success — a retried
 * request must not fail, and must not seat anybody twice.
 *
 * `seat-claim.test.ts` pins the outcome mapping; the concurrency behaviour is
 * exercised against a real database by `scratch/stress-seats.mts`.
 */

export type SeatClaim = "claimed" | "full" | "already";

/**
 * What the database actually said, dug out of however it was wrapped.
 *
 * A duplicate key raised by `prisma.<model>.create` arrives as a tidy
 * `P2002`. The identical violation raised by `$executeRaw` does not: it
 * comes back as `P2010` ("raw query failed") with the real cause buried in
 * `meta.driverAdapterError.cause.originalCode`. Classifying on the outer code
 * alone therefore treats a re-join as a crash, which is exactly the bug this
 * function exists to prevent — so it walks the whole error instead of trusting
 * one field.
 */
function errorSignals(err: unknown): { codes: Set<string>; text: string } {
  const codes = new Set<string>();
  let text = "";
  const seen = new Set<unknown>();
  const walk = (node: unknown, depth: number) => {
    if (!node || typeof node !== "object" || depth > 6 || seen.has(node)) return;
    seen.add(node);
    const o = node as Record<string, unknown>;
    for (const key of ["code", "originalCode", "errno", "kind"]) {
      const v = o[key];
      if (typeof v === "string" || typeof v === "number") codes.add(String(v));
    }
    if (typeof o["message"] === "string") text += " " + o["message"];
    if (typeof o["originalMessage"] === "string") text += " " + o["originalMessage"];
    for (const key of ["meta", "cause", "driverAdapterError"]) walk(o[key], depth + 1);
  };
  walk(err, 0);
  return { codes, text };
}

/** MySQL's duplicate-key error, however the driver surfaces it. */
export function isDuplicateKey(err: unknown): boolean {
  const { codes, text } = errorSignals(err);
  if (codes.has("P2002") || codes.has("ER_DUP_ENTRY") || codes.has("1062") || codes.has("UniqueConstraintViolation")) return true;
  return /duplicate entry/i.test(text);
}

/**
 * Transient failures worth another attempt: a deadlock the engine broke, and
 * a lock wait that ran out. Both mean "nobody's write landed, try again" —
 * unlike a duplicate key or a full room, which are answers, and unlike an
 * application error, which must not be retried at all.
 */
export function isTransientLockError(err: unknown): boolean {
  if (isDuplicateKey(err)) return false;
  const { codes, text } = errorSignals(err);
  if (codes.has("1213") || codes.has("1205") || codes.has("P2034")) return true;
  if (codes.has("ER_LOCK_DEADLOCK") || codes.has("ER_LOCK_WAIT_TIMEOUT")) return true;
  return /deadlock|lock wait timeout/i.test(text);
}

/** Runs `fn`, retrying once on a deadlock or lock-wait timeout with a little jitter. */
export async function withLockRetry<T>(label: string, fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (!isTransientLockError(err) || attempt === attempts) {
        lastErr = err;
        break;
      }
      console.warn(`[db] ${label}: transient lock failure on attempt ${attempt}, retrying`);
      // A little jitter so two callers that just collided do not collide again
      // in lockstep. Bounded: one retry, then the caller hears about it.
      await new Promise((r) => setTimeout(r, attempt * 25 + Math.floor(Math.random() * 50)));
      lastErr = err;
    }
  }
  throw lastErr;
}

/** Seat a guest in a pair room, if it is below capacity. */
export async function claimRoomSeat(roomId: string, userId: string, capacity: number): Promise<SeatClaim> {
  return withLockRetry("claimRoomSeat", async () => {
    try {
      const inserted = await prisma.$executeRaw`
        INSERT INTO RoomParticipant (id, roomId, userId, role, joinedAt)
        SELECT ${newId()}, ${roomId}, ${userId}, 'guest', NOW(3)
        WHERE (SELECT COUNT(*) FROM RoomParticipant WHERE roomId = ${roomId}) < ${capacity}`;
      return inserted > 0 ? "claimed" : "full";
    } catch (err) {
      if (isDuplicateKey(err)) return "already";
      throw err;
    }
  });
}

/**
 * Seat a player in a duel: still waiting, below capacity, and on the right
 * team — all decided by the one statement that inserts the row.
 *
 * The team is the part that could not simply be checked and then written.
 * Which side a joiner lands on depends on who is already seated, so computing
 * it in JavaScript from a row read a moment earlier is exactly the stale-
 * snapshot problem the old lock existed to prevent: two people joining a 2v2
 * together would both read "one on team 1" and both be put on team 2.
 * Expressed here as a CASE over the live counts, it is decided at insert time
 * against the committed rows.
 *
 * This is `nextTeam` in routes/duels.ts transcribed — the two must agree, and
 * `seat-claim.test.ts` cross-checks them over every participant arrangement
 * rather than trusting that they were kept in step by hand.
 */
export async function claimDuelSeat(
  duelId: string,
  userId: string,
  mode: string,
  capacity: number,
): Promise<SeatClaim | "gone"> {
  const isPairs = mode === "2v2" ? 1 : 0;
  return withLockRetry("claimDuelSeat", async () => {
    try {
      const inserted = await prisma.$executeRaw`
        INSERT INTO DuelParticipant (id, duelId, userId, team, joinedAt)
        SELECT
          ${newId()},
          ${duelId},
          ${userId},
          CASE WHEN ${isPairs} = 1
               THEN CASE WHEN (SELECT COUNT(*) FROM DuelParticipant WHERE duelId = ${duelId} AND team = 1)
                            <= (SELECT COUNT(*) FROM DuelParticipant WHERE duelId = ${duelId} AND team = 2)
                         THEN 1 ELSE 2 END
               ELSE CASE WHEN (SELECT COUNT(*) FROM DuelParticipant WHERE duelId = ${duelId} AND team = 1) > 0
                         THEN 2 ELSE 1 END
          END,
          NOW(3)
        WHERE (SELECT status FROM Duel WHERE id = ${duelId}) = 'waiting'
          AND (SELECT COUNT(*) FROM DuelParticipant WHERE duelId = ${duelId}) < ${capacity}`;
      if (inserted > 0) return "claimed";
      // Nothing was inserted: either the duel started (or vanished) or it
      // filled. One cheap read tells the caller which, and it is only paid on
      // the losing path.
      const duel = await prisma.duel.findUnique({ where: { id: duelId }, select: { status: true } });
      return duel?.status === "waiting" ? "full" : "gone";
    } catch (err) {
      if (isDuplicateKey(err)) return "already";
      throw err;
    }
  });
}
