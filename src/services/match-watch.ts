/**
 * The live code relay of a knockout match, bound to this process: the real
 * seat lookup (knockout.ts matchSeat), the public-match check spectators
 * pass (knockout.ts matchIsPublic), one store of the players' latest
 * buffers, and its two relays — the code to the staff watching, the
 * activity alone to spectators. The protocol and its rules are
 * match-watch-rules.ts.
 */
import { matchIsPublic, matchSeat } from "./knockout.js";
import { ACTIVITY_GAP_MS, LiveDrafts, Relay, registerMatchWatch, sendActivity, type WatchIo, type WatchSocket } from "./match-watch-rules.js";

const drafts = new LiveDrafts();
const relay = new Relay(drafts);
const activity = new Relay(drafts, ACTIVITY_GAP_MS, sendActivity);
setInterval(() => drafts.sweep(Date.now()), 60_000).unref();

/** Wire one socket's watch events (index.ts, every connection to the default namespace). */
export function watchMatches(io: WatchIo, socket: WatchSocket): void {
  registerMatchWatch(io, socket, { drafts, relay, activity, seatOf: matchSeat, isPublicMatch: matchIsPublic });
}
