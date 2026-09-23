/**
 * A tiny handle on the socket.io server so routes can push without importing
 * index.ts (which would be a cycle). index.ts calls setIo() once at boot.
 */
import type { Server } from "socket.io";

let io: Server | null = null;

export function setIo(server: Server): void {
  io = server;
}

/** Fire-and-forget: a missing server (tests, scripts) must never break a route. */
export function emitToRoom(room: string, event: string, payload?: unknown): void {
  try {
    io?.to(room).emit(event, payload);
  } catch (err) {
    console.error(`emitToRoom(${room}, ${event}) failed:`, err);
  }
}

/** How many sockets are in a room right now; 0 when there is no server. */
export async function socketsInRoom(room: string): Promise<number> {
  try {
    return io ? (await io.in(room).fetchSockets()).length : 0;
  } catch (err) {
    console.error(`socketsInRoom(${room}) failed:`, err);
    return 0;
  }
}

/** The socket.io room every participant of a duel listens on. */
export const duelRoom = (duelId: string) => `duel:${duelId}`;

/* ── Account-level pushes (the notifications bell) ─────────────────────── */

/**
 * A namespace of its own, not the default `/`.
 *
 * socket.io-client multiplexes every namespace of one origin over a single
 * engine.io transport, but `io(url)` twice for the *same* namespace opens a
 * second connection (`sameNamespace` in its lookup). The bell's socket is
 * always-on, and a pair room or a duel opens `/` while it is up — putting
 * them all on `/` would have meant two WebSockets per tab instead of one.
 *
 * It also keeps the lifecycles apart: a duel hook's `socket.disconnect()` on
 * unmount tears down its own namespace socket and leaves the shared transport
 * alive as long as the bell still holds it.
 */
export const USER_NAMESPACE = "/rt";

/** The room inside that namespace carrying one account's pushes. */
export const userRoom = (userId: string) => `user_${userId}`;

export function emitToUser(userId: string, event: string, payload?: unknown): void {
  try {
    io?.of(USER_NAMESPACE).to(userRoom(userId)).emit(event, payload);
  } catch (err) {
    console.error(`emitToUser(${userId}, ${event}) failed:`, err);
  }
}

/**
 * Whether this instance is holding a socket for the account, read straight
 * off the local adapter rather than through `fetchSockets()`.
 *
 * It is called on every notification write, so it must not be a round trip:
 * with a Redis adapter one day, `fetchSockets()` would ask every instance the
 * question each time. Local-only is also the right answer here — the push is
 * driven by a cache signal that already reaches every instance, so each one
 * answers for its own sockets and nobody is asked twice.
 */
export function userIsConnected(userId: string): boolean {
  try {
    return (io?.of(USER_NAMESPACE).adapter.rooms.get(userRoom(userId))?.size ?? 0) > 0;
  } catch {
    return false;
  }
}
