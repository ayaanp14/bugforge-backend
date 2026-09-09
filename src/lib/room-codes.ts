import * as crypto from "crypto";

/**
 * Codes that let someone into a private room.
 *
 * These used to come from `Math.random()`, which is fast but predictable: its
 * output is a deterministic sequence, so observing a few codes can narrow down
 * what the next ones will be. A code is the only thing standing between a
 * stranger and a private room, which makes it a credential, and credentials
 * come from the cryptographic generator.
 *
 * The alphabet leaves out the characters people mistype when reading a code
 * aloud or off a screen — 0/O and 1/I/L — so the codes stay easy to share.
 */

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/**
 * `randomInt` rather than reducing a random byte, because 256 does not divide
 * evenly by the alphabet length and the remainder would make some characters
 * more likely than others.
 */
function block(length: number): string {
  let out = "";
  for (let i = 0; i < length; i += 1) out += ALPHABET[crypto.randomInt(0, ALPHABET.length)];
  return out;
}

/**
 * An invite code in the familiar `ABCD-EFGH` shape.
 *
 * Eight characters from a 31-character alphabet is a little over 39 bits,
 * which is far past guessing one by hand and enough that scanning for a live
 * room is not worth an attacker's time.
 */
export function generateInviteCode(): string {
  return `${block(4)}-${block(4)}`;
}

/** A six-character code for recovering a room. */
export function generateRecoveryCode(): string {
  return block(6);
}
