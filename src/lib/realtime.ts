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

/** The socket.io room every participant of a duel listens on. */
export const duelRoom = (duelId: string) => `duel:${duelId}`;
