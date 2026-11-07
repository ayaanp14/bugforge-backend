/**
 * The daily videos' rules, pure and pinned by video-studio.test.ts:
 * services/video-studio.ts does the reading and writing, and video/ (on GitHub's
 * runners) does the making.
 */

export const VIDEO_PRIVACY = ["public", "unlisted", "private"] as const;
export type VideoPrivacy = (typeof VIDEO_PRIVACY)[number];

/** Hinglish first: the channel is for Indian students (the owner's call, 2026-11-07). */
export const VIDEO_LANGUAGES = ["hinglish", "english"] as const;
export type VideoLanguage = (typeof VIDEO_LANGUAGES)[number];

export const VIDEO_FINISHED = new Set(["done", "needs_review", "failed"]);

/** The workflow's jobs time out in under this, so silence past it means it died unreported. */
export const VIDEO_STALLED_MS = 3 * 60 * 60 * 1000;

/**
 * 10:00 IST. A window, as every job here has, because the tick is five minutes
 * and a deploy can be restarting at 10:00:00; the JobRun row makes it once a day.
 * Later than this, and the day's video is skipped rather than posted at a random hour.
 */
export function videoPeriod(hourIst: number, minuteIst: number, day: string): string | null {
  return hourIst === 10 && minuteIst < 30 ? day : null;
}

const STOP_WORDS = new Set(["a", "an", "the", "how", "to", "what", "why", "explain", "explained", "explaining", "tutorial", "video", "about", "on", "in", "of", "and", "with", "for", "is", "it", "shorts", "short"]);

/** A title with its hashtags, case and punctuation gone: "Two Sum!! #coding" and "two sum" are one title. */
export function titleKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/#\S+/g, " ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .slice(0, 200);
}

/** A prompt's words in order, without the filler: "Explain two sum" and "two sum tutorial" are one topic. */
export function topicKey(prompt: string): string {
  return titleKey(prompt)
    .split(" ")
    .filter((w) => !STOP_WORDS.has(w))
    .join(" ");
}

/**
 * The first earlier title or prompt this one obviously repeats, without asking a
 * model. Catches the plain repeat for free; the run's first step asks Claude about
 * the rest ("Two Sum with a HashMap" against "Two Sum in Java").
 */
export function obviousRepeat(prompt: string, earlier: string[]): string | null {
  const key = topicKey(prompt);
  if (!key) return null;
  return earlier.find((e) => topicKey(e) === key) ?? null;
}

export type ClaimDecision =
  /** This run already posted this cut: answer with its id, upload nothing. */
  | { kind: "already"; videoId: string }
  /** A video with this title or these bytes is on the channel from elsewhere. */
  | { kind: "refuse"; reason: string }
  | { kind: "upload" };

export interface PostedRow {
  youtubeId: string;
  title: string;
  titleKey: string;
  sha256: string | null;
  runId: string | null;
}

/**
 * May this run upload this cut? Called immediately before every upload, after
 * re-reading the channel.
 *
 * `claimedAt` is what closes the one gap the ids can't: the upload finished and the
 * job died before reporting it. The re-run then finds its own title on the channel
 * with no run attached, and because this run had claimed that cut, takes it as its
 * own rather than posting again.
 */
export function decideClaim(input: {
  runId: string;
  existingId: string | null;
  claimedAt: Date | null;
  title: string;
  sha256: string;
  posted: PostedRow[];
}): ClaimDecision {
  if (input.existingId) return { kind: "already", videoId: input.existingId };
  const key = titleKey(input.title);
  const sameBytes = input.posted.find((p) => p.sha256 === input.sha256);
  if (sameBytes) {
    return sameBytes.runId === input.runId ? { kind: "already", videoId: sameBytes.youtubeId } : { kind: "refuse", reason: `This exact video is already on the channel as "${sameBytes.title}".` };
  }
  const sameTitle = input.posted.find((p) => p.titleKey === key);
  if (sameTitle) {
    if (sameTitle.runId === input.runId || (sameTitle.runId === null && input.claimedAt)) return { kind: "already", videoId: sameTitle.youtubeId };
    return { kind: "refuse", reason: `A video titled "${sameTitle.title}" is already on the channel.` };
  }
  return { kind: "upload" };
}

/**
 * A run that says it failed after a finished publish (the workflow's failure step
 * landing late) stays as it was: what is on YouTube must stay reported.
 */
export function nextStatus(current: string, incoming: string): string {
  return (current === "done" || current === "needs_review") && incoming === "failed" ? current : incoming;
}

/** What a run is asked for once the queue and the list below have both run out. */
export const OPEN_TOPIC = "Choose the most useful coding-interview or computer science topic for placement students that the channel has not covered yet.";

/**
 * What runs when the queue is empty, in roughly the road's learning order: what a
 * placement student searches for. Add to the end, because the position is stored.
 * Anything here the channel already has is skipped when its turn comes.
 */
export const AUTO_TOPICS = [
  "Valid Parentheses and the stack: why the last thing opened must close first",
  "Kadane's algorithm: maximum subarray in O(n)",
  "Two pointers: Container With Most Water",
  "Sliding window: longest substring without repeating characters",
  "Reverse a linked list, iteratively and recursively",
  "Detect a cycle in a linked list with Floyd's tortoise and hare",
  "Merge intervals: why sorting first makes it easy",
  "Prefix sums: subarray sum equals K",
  "Monotonic stack: next greater element",
  "Binary tree traversals: inorder, preorder, postorder and level order",
  "Validate a binary search tree, and the bug most people write first",
  "Lowest common ancestor of a binary tree",
  "Heaps: finding the Kth largest element",
  "BFS on a grid: number of islands",
  "Topological sort: course schedule and detecting a cycle",
  "Dijkstra's algorithm: shortest paths step by step",
  "Union-Find: path compression and union by rank",
  "Dynamic programming from scratch: climbing stairs and memoization",
  "Coin change: why greedy fails and DP works",
  "Longest common subsequence: reading the DP table",
  "0/1 knapsack: the pattern behind many DP problems",
  "Backtracking: generating all subsets and permutations",
  "Tries: how autocomplete finds prefixes fast",
  "Bit manipulation: single number and the XOR trick",
  "Big O in practice: reading the complexity of real code",
  "Load balancing: round robin, least connections and consistent routing",
  "Database indexes: how a B-tree makes a query fast",
  "SQL joins: inner, left, right and when each returns what",
  "Database normalization: 1NF, 2NF and 3NF on one messy table",
  "ACID transactions: what each letter protects you from",
  "What happens when you type a URL and press enter",
  "Processes vs threads: the operating systems interview question",
  "Deadlock: the four conditions and how to break one",
  "OOP pillars with one running example: encapsulation, inheritance, polymorphism, abstraction",
  "Caching strategies: cache aside, write through and write back",
  "Designing a URL shortener: the system design interview walkthrough",
  "Message queues: why systems stop calling each other directly",
  "Database sharding: splitting data, and what it costs you",
  "Hash maps inside: buckets, collisions and resizing",
];
