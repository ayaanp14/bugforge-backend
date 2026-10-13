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

/** Pushed on `/rt` to a session another sign-in replaced; the client signs out. */
export const SESSION_REPLACED_EVENT = "session:replaced";

/**
 * Closes the sockets this instance holds for an account's *older* sessions —
 * every one whose token was issued before `issuedAt` (`socket.data.sessionIat`,
 * set at the handshake) — after a sign-in elsewhere replaced them. Their
 * tokens are already refused (lib/session-revocation), but a socket is only
 * authenticated at its handshake: without this a pair room or a duel kept
 * relaying as the old device. The bell's socket is told first, so the tab
 * signs out at once instead of on its next request; `disconnect()` (not
 * `true`) sends the close after that packet on the same transport.
 */
export function closeReplacedSockets(userId: string, issuedAt: number): void {
  if (!io) return;
  const older = (socket: { data?: { userId?: string; sessionIat?: number } }) =>
    socket.data?.userId === userId && (socket.data.sessionIat ?? 0) < issuedAt;
  try {
    for (const socket of io.of(USER_NAMESPACE).sockets.values()) {
      if (!older(socket)) continue;
      socket.emit(SESSION_REPLACED_EVENT);
      socket.disconnect();
    }
    for (const socket of io.of("/").sockets.values()) {
      if (older(socket)) socket.disconnect(true);
    }
  } catch (err) {
    console.error(`closeReplacedSockets(${userId}) failed:`, err);
  }
}

/**
 * Closes every socket this instance holds for an account — the bell's on
 * `/rt` and any room's (pair, duel) on `/` — for an account that was just
 * deleted. Its token is already refused (lib/session-revocation), but a
 * socket authenticated once at its handshake and would otherwise stay open,
 * relaying edits and chat as someone who no longer exists. Local sockets
 * only, like userIsConnected; another instance's drop on their next request.
 */
export async function disconnectUser(userId: string): Promise<void> {
  if (!io) return;
  try {
    io.of(USER_NAMESPACE).in(userRoom(userId)).disconnectSockets(true);
    for (const socket of io.of("/").sockets.values()) {
      if (socket.data?.userId === userId) socket.disconnect(true);
    }
  } catch (err) {
    console.error(`disconnectUser(${userId}) failed:`, err);
  }
}
