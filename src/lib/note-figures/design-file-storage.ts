import { finish, type Frame, type Item, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { box, label } from "../lesson-figures/kit.js";
import { lifelines, message } from "./kit.js";
import { along, database, packet, service, wire } from "./sd-kit.js";

/**
 * Design a File Storage Service: the case study's figures (content/notes/
 * system-design/design-file-storage.md). Every figure loops (a points
 * subject), and every value it draws is computed here:
 *
 *  - chunk-dedup: a file split into six fixed-size chunks, each hashed with
 *    a toy 16-bit fingerprint (FNV-1a folded); a chunk whose hash the block
 *    store already holds is not uploaded.
 *  - delta-sync: the same file edited — one chunk changed, one appended. The
 *    client re-chunks it and uploads only the hashes the server's chunk list
 *    lacks, then commits version 2.
 *  - sync-notify: the messages that carry that edit to a second device, as a
 *    sequence diagram — the chunk it downloads is the one the delta uploaded.
 *  - conflict: two devices commit edits made on the same version; the server
 *    accepts a commit only when its base version is the current one, so the
 *    second becomes a conflicted copy.
 *
 * Chunks are four characters here so they fit in a box; real services use
 * megabyte chunks and SHA-256. The figures say so in their captions.
 */

/** FNV-1a over the chunk, folded to 16 bits and written as four hex digits: a toy content fingerprint. */
function fingerprint(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return (((h >>> 16) ^ (h & 0xffff)) >>> 0).toString(16).padStart(4, "0");
}

/** Split a file's content into fixed-size chunks. */
const chunk = (content: string, size = 4): string[] => Array.from({ length: Math.ceil(content.length / size) }, (_, i) => content.slice(i * size, i * size + size));

/** Version 1 of the file, and the edit that makes version 2 (third chunk changed, one chunk appended). */
const V1 = "Kq7zR2mxKq7zpW4eR2mxJ8sd";
const V2 = "Kq7zR2mxKq7zpX4eR2mxJ8sdT0vb";

/** Check the toy hash keeps distinct chunks apart, or a "duplicate" in a figure would be a lie. */
function hashes(chunks: readonly string[]): string[] {
  const out = chunks.map(fingerprint);
  const byHash = new Map<string, string>();
  chunks.forEach((c, i) => {
    const seen = byHash.get(out[i]);
    if (seen !== undefined && seen !== c) throw new Error(`fingerprint collision: ${seen} and ${c}`);
    byHash.set(out[i], c);
  });
  return out;
}

/* ── Chunking and dedup ───────────────────────────────────────────── */

function chunkDedup(): Walkthrough {
  const chunks = chunk(V1);
  const hs = hashes(chunks);
  const N = chunks.length;
  const CW = 54;
  const STEP = 60;
  const SX = 400;
  // Run the upload: the block store starts empty and keeps each new hash once.
  const store: string[] = [];
  const log = hs.map((h) => {
    const dup = store.includes(h);
    if (!dup) store.push(h);
    return { h, dup, stored: [...store] };
  });
  const dups = log.filter((l) => l.dup).length;
  if (dups === 0 || dups === N) throw new Error("chunk-dedup: the example should mix new and repeated chunks");
  const frames: Frame[] = [];
  const draw = (k: number, caption: string) => {
    const items: Item[] = [
      label("f-h", "trip.mov, in fixed-size chunks", 0, 0, { anchor: "start", tone: "soft", size: 11, weight: 600 }),
      label("s-h", "block store", SX, 0, { anchor: "start", tone: "soft", size: 11, weight: 600 }),
    ];
    chunks.forEach((c, i) => {
      const cur = i === k - 1 && k <= N;
      items.push(box(`c${i}`, i * STEP, 14, c, { w: CW, h: 28, size: 11, tone: cur ? "accent" : "plain" }));
      if (i < k) {
        const l = log[i];
        const tone: Tone = l.dup ? "muted" : cur ? "accent" : "strong";
        items.push(box(`h${i}`, i * STEP, 62, l.h, { w: CW, h: 24, size: 10, tone }));
        items.push(label(`v${i}`, l.dup ? "skip" : "send", i * STEP + CW / 2, 102, { tone: l.dup ? "faint" : "accent", size: 10 }));
        items.push(wire(`a${i}`, { x: i * STEP + CW / 2, y: 43 }, { x: i * STEP + CW / 2, y: 61 }, { tone: cur ? "accent" : "faint" }));
      }
    });
    const shown = k === 0 ? [] : log[Math.min(k, N) - 1].stored;
    shown.forEach((h, j) => {
      const isNew = k <= N && !log[k - 1].dup && h === log[k - 1].h;
      items.push(box(`s-${h}`, SX, 14 + j * 30, h, { w: 70, h: 24, size: 10, tone: isNew ? "accent" : "strong" }));
    });
    if (k >= 1 && k <= N && log[k - 1].dup) {
      const at = log[k - 1].stored.indexOf(log[k - 1].h);
      items.push(wire("match", { x: (k - 1) * STEP + CW, y: 74 }, { x: SX - 2, y: 26 + at * 30 }, { tone: "ink", dashed: true }));
    }
    if (k > N) items.push(label("sum", `${N} chunks · ${N - dups} sent · ${dups} skipped`, 0, 130, { anchor: "start", tone: "accent", size: 12, weight: 600 }));
    else items.push(label("sum", "", 0, 130, { anchor: "start", size: 12 }));
    frames.push({ caption, items });
  };
  draw(0, `The client cuts the file into fixed-size chunks — ${chunks[0].length} characters here, about 4 MB in a real service — and fingerprints each one before sending anything.`);
  log.forEach((l, i) => {
    const caption = l.dup
      ? `Chunk ${i + 1} hashes to ${l.h}, which the block store already holds. Nothing is uploaded: the file's chunk list simply names ${l.h} again.`
      : i === 0
        ? `Chunk ${i + 1} hashes to ${l.h}. The block store has never seen it, so the client uploads the chunk, stored under its hash.`
        : `Chunk ${i + 1} hashes to ${l.h}, a hash the store lacks, so this chunk is uploaded too. The store now holds ${l.stored.length} distinct chunks.`;
    draw(i + 1, caption);
  });
  draw(N + 1, `${N - dups} of ${N} chunks crossed the network. The same check works across files and users: identical content is stored once. Here the hash is a toy 16-bit one; real systems use SHA-256.`);
  return finish({ title: "Chunking and dedup: hash every chunk, upload only the new ones", input: "", frames });
}

/* ── Delta sync ───────────────────────────────────────────────────── */

/** What the edit uploads: the hashes in version 2's list that version 1's list lacks. */
function delta() {
  const h1 = hashes(chunk(V1));
  const h2 = hashes(chunk(V2));
  const have = new Set(h1);
  const missing = [...new Set(h2.filter((h) => !have.has(h)))];
  return { h1, h2, missing };
}

function deltaSync(): Walkthrough {
  const { h1, h2, missing } = delta();
  if (missing.length === 0 || missing.length >= h2.length) throw new Error("delta-sync: the edit should change some chunks, not all");
  const CW = 54;
  const STEP = 60;
  const frames: Frame[] = [];
  const blocks = (tone: Tone, sub: string) => database("blocks", 130, 176, "Block store", { w: 110, tone, sub });
  const meta = (tone: Tone, sub: string) => database("meta", 280, 176, "Metadata DB", { w: 110, tone, sub });
  const draw = (stage: number, caption: string) => {
    const items: Item[] = [label("r1", "v1 on server", 0, 22, { anchor: "start", tone: "soft", size: 11, weight: 600 })];
    h1.forEach((h, i) => items.push(box(`a${i}`, 96 + i * STEP, 10, h, { w: CW, h: 24, size: 10, tone: stage >= 2 ? "muted" : "strong" })));
    if (stage >= 1) {
      items.push(label("r2", "v2 on laptop", 0, 76, { anchor: "start", tone: "soft", size: 11, weight: 600 }));
      h2.forEach((h, i) => {
        const isNew = missing.includes(h);
        const tone: Tone = stage === 1 ? "plain" : isNew ? (stage >= 4 ? "strong" : "accent") : "muted";
        items.push(box(`b${i}`, 96 + i * STEP, 64, h, { w: CW, h: 24, size: 10, tone }));
        if (stage >= 2) items.push(label(`m${i}`, isNew ? "new" : "have", 96 + i * STEP + CW / 2, 104, { tone: isNew ? "accent" : "faint", size: 10 }));
      });
    }
    const b = blocks(stage === 3 ? "accent" : "plain", stage >= 3 ? `+${missing.length} chunks` : "chunks by hash");
    const m = meta(stage >= 4 ? "accent" : "plain", stage >= 4 ? `file 42 → v2, ${h2.length} hashes` : `file 42 → v1, ${h1.length} hashes`);
    items.push(...b.items, ...m.items);
    const client = service("client", 0, 128, "Laptop", { w: 80, tone: stage >= 1 && stage <= 4 ? "accent" : "plain" });
    items.push(...client.items);
    items.push(wire("c-b", client.right, { x: b.top.x, y: b.top.y }, { tone: stage === 3 ? "accent" : "line" }));
    items.push(wire("c-m", client.right, { x: m.top.x, y: m.top.y }, { tone: stage === 4 ? "accent" : "line" }));
    missing.forEach((h, j) => {
      if (stage === 3) items.push(packet(`p${j}`, along(client.right, b.top, 0.3 + j * 0.35), { text: j + 1, tone: "accent" }));
    });
    frames.push({ caption, items });
  };
  draw(0, `The metadata database holds file 42 as version 1: an ordered list of ${h1.length} chunk hashes. The bytes themselves live in the block store, keyed by hash.`);
  draw(1, `The user edits the file. The laptop re-chunks it and hashes again: ${h2.length} chunks now, because the edit changed some bytes and added more at the end.`);
  draw(2, `It compares the new list with the old one. ${h2.length - missing.length} of the ${h2.length} hashes are already on the server; only ${missing.join(" and ")} are new.`);
  draw(3, `The laptop uploads just those ${missing.length} chunks — the delta — instead of the whole file. Sending them again would be harmless: a chunk keyed by its hash is stored once.`);
  draw(4, `Last, it commits version 2's hash list to the metadata database in one write. Until that commit, other devices still see version 1, never a half-uploaded file.`);
  return finish({ title: "Delta sync: re-chunk, compare hash lists, upload only what changed", input: "", frames });
}

/* ── Sync to another device ───────────────────────────────────────── */

function syncNotify(): Walkthrough {
  const { h2, missing } = delta();
  const actors = ["Laptop", "Blocks", "Metadata", "Notify", "Phone"];
  const L = 0, B = 1, M = 2, N = 3, P = 4;
  const steps: Array<{ from: number; to: number; text: string; reply?: boolean; caption: string }> = [
    { from: L, to: B, text: `PUT ${missing.join(", ")}`, caption: `The laptop uploads the ${missing.length} new chunks to the block store first, so every hash the next commit names already exists.` },
    { from: L, to: M, text: `commit v2 (${h2.length} hashes)`, caption: "Then it commits version 2's chunk list to the metadata service, the one source of truth for which version is current." },
    { from: M, to: N, text: "file 42 changed", caption: "The metadata service publishes a change event. A queue between them keeps the commit fast even when many devices must hear about it." },
    { from: N, to: P, text: "v2 ready", reply: true, caption: "The phone holds an open connection (a long poll or WebSocket) to the notification service, so it hears about the change at once instead of polling every few seconds." },
    { from: P, to: M, text: "GET file 42", caption: "The phone asks for version 2's chunk list and compares it with the hashes it already has on disk, exactly as the laptop did." },
    { from: P, to: B, text: `GET ${missing.join(", ")}`, caption: `It downloads only ${missing.join(" and ")}, the chunks it lacks, and rebuilds the file locally. Both devices now hold version 2.` },
  ];
  const GAP = 104;
  const TOP = 44;
  const ROW = 40;
  const frames: Frame[] = [];
  for (let k = 0; k <= steps.length; k++) {
    const active = new Set<number>();
    if (k > 0) {
      active.add(steps[k - 1].from);
      active.add(steps[k - 1].to);
    }
    const ll = lifelines("ll", actors, { gap: GAP, w: 84, h: 28, length: TOP + steps.length * ROW - 14, size: 11, tone: (i) => (active.has(i) ? "accent" : "plain") });
    const items: Item[] = [...ll.items];
    steps.slice(0, k).forEach((s, i) => {
      const cur = i === k - 1;
      items.push(...message(`msg${i}`, ll.xOf(s.from), ll.xOf(s.to), TOP + 14 + i * ROW, s.text, { tone: cur ? "accent" : "ink", dashed: s.reply, size: 10.5 }));
    });
    const caption = k === 0 ? "Two devices, one account. Follow how an edit on the laptop reaches the phone: three services, six messages, and no full-file transfer anywhere." : steps[k - 1].caption;
    frames.push({ caption, items });
  }
  return finish({ title: "Sync: upload chunks, commit metadata, notify, then pull the delta", input: "", frames });
}

/* ── Conflicts ────────────────────────────────────────────────────── */

function conflict(): Walkthrough {
  // The server accepts a commit only if it was made on the current version (compare-and-set).
  let current = 3;
  const commit = (base: number) => {
    if (base !== current) return { ok: false, now: current };
    current += 1;
    return { ok: true, now: current };
  };
  const first = commit(3);
  const second = commit(3);
  if (!first.ok || second.ok) throw new Error("conflict: the second commit on the same base should be refused");
  const frames: Frame[] = [];
  const draw = (stage: number, caption: string) => {
    const ver = stage >= 2 ? first.now : 3;
    const server = database("srv", 150, 16, "Metadata", { w: 130, tone: stage === 2 ? "accent" : stage === 3 ? "error" : "plain", sub: `report.docx · v${ver}` });
    const laptop = service("lap", 0, 150, "Laptop", { w: 110, tone: stage === 2 ? "accent" : "plain", sub: stage === 0 ? "has v3" : stage === 1 ? "v3 + edit L" : `has v${first.now}` });
    const phone = service("pho", 320, 150, "Phone", { w: 110, tone: stage === 3 ? "error" : stage >= 4 ? "accent" : "plain", sub: stage === 0 ? "has v3" : stage <= 3 ? "v3 + edit P" : `has v${first.now} + copy` });
    const items: Item[] = [...server.items, ...laptop.items, ...phone.items];
    items.push(wire("l-s", laptop.top, { x: server.left.x + 20, y: server.bottom.y }, { tone: stage === 2 ? "accent" : "line", label: stage === 2 ? "base 3 ✓" : undefined }));
    items.push(wire("p-s", phone.top, { x: server.right.x - 20, y: server.bottom.y }, { tone: stage === 3 ? "error" : stage === 4 ? "accent" : "line", label: stage === 3 ? "base 3 ✗" : undefined }));
    if (stage === 2) items.push(packet("cl", along(laptop.top, { x: server.left.x + 20, y: server.bottom.y }, 0.22), { text: "L", tone: "accent" }));
    if (stage === 3) items.push(packet("cp", along(phone.top, { x: server.right.x - 20, y: server.bottom.y }, 0.22), { text: "P", tone: "error" }));
    if (stage >= 4) {
      items.push(box("copy", 280, 228, "report (Phone's conflicted copy)", { w: 190, h: 26, size: 10, tone: "strong" }));
      items.push(box("main", 0, 228, `report.docx v${first.now}`, { w: 130, h: 26, size: 10, tone: "strong" }));
    }
    frames.push({ caption, items });
  };
  draw(0, "Both devices hold version 3 of report.docx. Each commit tells the server which version the edit was made on, its base version.");
  draw(1, "The laptop and the phone both edit the file while offline. Neither knows about the other's change, and both edits are on base version 3.");
  draw(2, `The laptop reconnects first. Its base, 3, is the current version, so the server accepts the commit and the file becomes version ${first.now}.`);
  draw(3, `The phone commits on base 3 too, but the current version is now ${second.now}. The compare-and-set fails, so the server refuses rather than silently overwrite the laptop's edit.`);
  draw(4, `The phone saves its edit as a conflicted copy and downloads version ${first.now}. No work is lost; the user, who knows what both edits meant, merges them.`);
  return finish({ title: "Conflicts: accept a commit only on the current version", input: "", frames });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "chunk-dedup": chunkDedup,
  "delta-sync": deltaSync,
  "sync-notify": syncNotify,
  conflict,
};
