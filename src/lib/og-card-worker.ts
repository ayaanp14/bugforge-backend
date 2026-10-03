import { parentPort } from "node:worker_threads";
import { renderTree } from "./og-card-render.js";
import type { Node } from "./og-card.js";

/**
 * The link-preview renderer's thread (lib/og-card.ts spawns it). One message
 * in per card, one out: the PNG's buffer is transferred, not copied. Messages
 * are answered as each render finishes; satori awaits internally, so two may
 * interleave, which is harmless — nothing here is shared between renders.
 */

interface Job {
  id: number;
  tree: Node;
  width: number;
  height: number;
}

parentPort?.on("message", (job: Job) => {
  renderTree(job.tree, job.width, job.height).then(
    (png) => parentPort?.postMessage({ id: job.id, png }, [png.buffer as ArrayBuffer]),
    (err: unknown) => parentPort?.postMessage({ id: job.id, error: err instanceof Error ? err.message : String(err) }),
  );
});
