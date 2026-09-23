import crypto from "node:crypto";

/**
 * A cuid-shaped id, for rows this codebase inserts with raw SQL.
 *
 * Almost every id here comes from Prisma's `@default(cuid())`, which the
 * client fills in. A statement written as raw SQL — a conditional INSERT that
 * has to be one statement to be atomic — has to supply its own, and it should
 * look like every other id in the table rather than announcing which code
 * path created the row.
 *
 * The shape is cuid v1's: 'c', the time in base 36, a per-process counter, a
 * fingerprint and randomness. Only the uniqueness matters — the id is opaque
 * everywhere it is used — but the fingerprint and counter are what keep two
 * processes minting in the same millisecond apart.
 */
const FINGERPRINT = crypto.randomBytes(2).toString("hex").padStart(4, "0");
let counter = Math.floor(Math.random() * 1_679_616);

const block = (n: number, size: number) => n.toString(36).padStart(size, "0").slice(-size);

export function newId(): string {
  counter = (counter + 1) % 1_679_616;
  const time = Date.now().toString(36);
  const random = block(crypto.randomInt(0, 1_679_616), 4) + block(crypto.randomInt(0, 1_679_616), 4);
  return `c${time}${block(counter, 4)}${FINGERPRINT}${random}`;
}
