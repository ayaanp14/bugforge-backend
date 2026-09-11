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
