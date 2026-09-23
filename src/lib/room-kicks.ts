import { prisma } from "./prisma.js";

/**
 * The kicked-participant list on a pair room.
 *
 * `PairRoom.kickedUserIds` is a `Json` column holding an array of user ids —
 * MySQL has no scalar list type, so it cannot be `String[]`. That distinction
 * matters more than it looks:
 *
 *  - Prisma's `{ push: id }` operator is defined for **scalar lists**, not for
 *    `Json`. Against a Json column it is not an append at all: the object is
 *    taken as the literal value to store, so the first kick replaced
 *    `["…"]` with `{"push":"<userId>"}`. Every later read then did
 *    `(room.kickedUserIds as string[]).includes(...)` on an object and threw,
 *    which is a 500 on every attempt to join that room from then on.
 *  - Reading the array, editing it in JavaScript and writing the whole thing
 *    back — how the re-join used to remove someone — loses any kick that
 *    landed in between, because the snapshot it edits is already stale.
 *
 * Both operations are therefore expressed as single atomic statements against
 * the JSON value itself, which is correct under concurrency and costs one
 * round trip rather than a read plus a write.
 */

/**
 * Add a user to a room's kicked list, if they are not already on it.
 *
 * `JSON_ARRAY_APPEND` mutates the stored array in place. The `JSON_CONTAINS`
 * guard makes a repeated kick a no-op instead of a duplicate entry, and the
 * `JSON_TYPE` guard repairs a row left non-array by the old `push` bug rather
 * than appending to something that is not a list.
 */
export async function addKickedUser(roomId: string, userId: string): Promise<void> {
  await prisma.$executeRaw`
    UPDATE PairRoom
    SET kickedUserIds = CASE
      WHEN kickedUserIds IS NULL OR JSON_TYPE(kickedUserIds) <> 'ARRAY' THEN JSON_ARRAY(${userId})
      WHEN JSON_CONTAINS(kickedUserIds, JSON_QUOTE(${userId})) THEN kickedUserIds
      ELSE JSON_ARRAY_APPEND(kickedUserIds, '$', ${userId})
    END
    WHERE id = ${roomId}`;
}

/**
 * Remove a user from a room's kicked list.
 *
 * `JSON_SEARCH` finds the element's path and `JSON_REMOVE` deletes it, so a
 * kick that lands at the same moment survives — the statement edits the
 * committed array rather than overwriting it with a copy. Removing someone who
 * is not on the list is a no-op, which is what a re-join with a valid recovery
 * code should be if the host un-kicked them first.
 */
export async function removeKickedUser(roomId: string, userId: string): Promise<void> {
  await prisma.$executeRaw`
    UPDATE PairRoom
    SET kickedUserIds = JSON_REMOVE(kickedUserIds, JSON_UNQUOTE(JSON_SEARCH(kickedUserIds, 'one', ${userId})))
    WHERE id = ${roomId}
      AND JSON_TYPE(kickedUserIds) = 'ARRAY'
      AND JSON_SEARCH(kickedUserIds, 'one', ${userId}) IS NOT NULL`;
}

/**
 * The kicked list as an array, whatever is actually in the column.
 *
 * A row written by the old `push` path holds an object, and anything that
 * treated it as an array threw. Reading through this turns that into "nobody
 * is kicked" — the safe answer, since the recovery-code gate is what actually
 * protects a room, and it keeps a legacy row serving instead of 500ing.
 */
export function kickedUserIdsOf(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((id): id is string => typeof id === "string");
}
