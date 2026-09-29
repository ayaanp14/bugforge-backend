/**
 * The live code relay of a knockout match, bound to this process: the real
 * seat lookup (knockout.ts matchSeat) and one store of the players' latest
 * buffers. The protocol and its rules are match-watch-rules.ts.
 */
import { matchSeat } from "./knockout.js";
import { LiveDrafts, Relay, registerMatchWatch, type WatchIo, type WatchSocket } from "./match-watch-rules.js";

const drafts = new LiveDrafts();
const relay = new Relay(drafts);
setInterval(() => drafts.sweep(Date.now()), 60_000).unref();

/** Wire one socket's watch events (index.ts, every connection to the default namespace). */
export function watchMatches(io: WatchIo, socket: WatchSocket): void {
  registerMatchWatch(io, socket, { drafts, relay, seatOf: matchSeat });
}
