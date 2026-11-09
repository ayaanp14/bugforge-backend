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

/**
 * A run reports between steps (no step outlasts a 20-minute batch wait plus a
 * direct call) and every 20 minutes while holding for 18:00, so silence past this
 * means it died unreported.
 */
export const VIDEO_STALLED_MS = 3 * 60 * 60 * 1000;

/**
 * 15:00 IST: the run starts three hours before it posts, so its Claude calls can
 * wait in the Batches API at half price (since 2026-11-09; video/src/claude.ts),
 * and the publish job holds the upload until 18:00 IST. Evening, because that is
 * when students are off class and scrolling (the owner's call, 2026-11-09; it
 * posted at 10:00 before). A window, as every job here has, because the tick is five minutes
 * and a deploy can be restarting on the hour; the JobRun row makes it once a day.
 * Later than this, and the day's video is skipped rather than posted at a random hour.
 */
export function videoPeriod(hourIst: number, minuteIst: number, day: string): string | null {
  return hourIst === 15 && minuteIst < 30 ? day : null;
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

/**
 * A reel's caption opens with its title, so that first line is how a re-run knows
 * the reel is already on the account: Instagram, unlike YouTube's claim, has no
 * other key to go by.
 */
export function reelOnAccount<T extends { caption?: string }>(title: string, media: T[]): T | null {
  const key = titleKey(title);
  if (!key) return null;
  return media.find((m) => titleKey((m.caption ?? "").split("\n")[0] ?? "") === key) ?? null;
}

/** The names the API gives a reel's files (the MP4 and its cover) for Instagram to fetch: 24 random bytes, nothing that could walk a path. */
export const REEL_FILE = /^[A-Za-z0-9_-]{32}\.(mp4|jpg)$/;

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
 * What runs when the queue is empty: what a placement student actually types into
 * YouTube. From the fourth entry on (rewritten 2026-11-09, the owner's ask for
 * views), each coding topic is named by its LeetCode title and number, the way
 * it is searched, and every few days an aptitude topic, which placement students
 * search as much as DSA. The position is stored (VideoSettings.autoNext, 3 when
 * this was written), so never insert or reorder before it: add to the end, or
 * rewrite only entries the position hasn't reached. Anything the channel already
 * has is skipped when its turn comes.
 */
export const AUTO_TOPICS = [
  "Valid Parentheses and the stack: why the last thing opened must close first",
  "Kadane's algorithm: maximum subarray in O(n)",
  "Two pointers: Container With Most Water",
  "Best Time to Buy and Sell Stock (LeetCode 121): one pass, keep the cheapest day",
  "Longest Substring Without Repeating Characters (LeetCode 3): the sliding window",
  "Time and work aptitude for placement tests: the LCM shortcut",
  "Reverse Linked List (LeetCode 206), iteratively and recursively",
  "Move Zeroes (LeetCode 283): two pointers in place",
  "Percentages shortcuts for placement aptitude tests",
  "Linked List Cycle (LeetCode 141): Floyd's tortoise and hare",
  "Merge Intervals (LeetCode 56): why sorting first makes it easy",
  "Profit and loss shortcuts for placement aptitude tests",
  "Subarray Sum Equals K (LeetCode 560): prefix sums and a hash map",
  "Majority Element (LeetCode 169): Boyer-Moore voting",
  "Number of Islands (LeetCode 200): BFS on a grid",
  "Speed, time and distance aptitude: trains and relative speed",
  "Climbing Stairs (LeetCode 70): dynamic programming from scratch",
  "Product of Array Except Self (LeetCode 238) without division",
  "Coin Change (LeetCode 322): why greedy fails and DP works",
  "Number series questions in placement aptitude tests: spotting the pattern",
  "3Sum (LeetCode 15): sort, then two pointers",
  "Next Greater Element: the monotonic stack",
  "Binary Tree Level Order Traversal (LeetCode 102): BFS with a queue",
  "Probability for placement aptitude tests: coins, dice and cards",
  "Validate Binary Search Tree (LeetCode 98), and the bug most people write first",
  "Kth Largest Element in an Array (LeetCode 215): heaps",
  "Lowest Common Ancestor of a Binary Tree (LeetCode 236)",
  "Course Schedule (LeetCode 207): topological sort and detecting a cycle",
  "Ratio and proportion shortcuts for placement aptitude tests",
  "Longest Common Subsequence (LeetCode 1143): reading the DP table",
  "0/1 knapsack: the pattern behind many DP problems",
  "Subsets and Permutations (LeetCode 78, 46): backtracking",
  "Single Number (LeetCode 136): the XOR trick",
  "LRU Cache (LeetCode 146): a hash map plus a doubly linked list",
  "Second highest salary in SQL: the classic interview query",
  "SQL joins: inner, left, right and when each returns what",
  "Dijkstra's algorithm: shortest paths step by step",
  "Union-Find: path compression and union by rank",
  "Implement Trie (LeetCode 208): how autocomplete finds prefixes fast",
  "Big O in practice: reading the complexity of real code",
  "Database indexes: how a B-tree makes a query fast",
  "Database normalization: 1NF, 2NF and 3NF on one messy table",
  "ACID transactions: what each letter protects you from",
  "What happens when you type a URL and press enter",
  "Processes vs threads: the operating systems interview question",
  "Deadlock: the four conditions and how to break one",
  "OOP pillars with one running example: encapsulation, inheritance, polymorphism, abstraction",
  "Load balancing: round robin, least connections and consistent routing",
  "Caching strategies: cache aside, write through and write back",
  "Designing a URL shortener: the system design interview walkthrough",
  "Message queues: why systems stop calling each other directly",
  "Database sharding: splitting data, and what it costs you",
  "Hash maps inside: buckets, collisions and resizing",
];
