/** What every step of the pipeline passes to the next, on disk in out/<run>/. */
import { z } from "zod";

export type Format = "landscape" | "short";

/**
 * The frame and the area a composition may draw in. The runtime owns the rest:
 * the brand header and the captions. A Short's stage stops well above the
 * bottom edge because YouTube lays its own title and buttons over the last
 * ~20% of the screen (the same layout as video/binary-search's vertical cut).
 */
export const FRAMES: Record<Format, { w: number; h: number; stage: { x: number; y: number; w: number; h: number } }> = {
  landscape: { w: 1920, h: 1080, stage: { x: 96, y: 130, w: 1728, h: 770 } },
  short: { w: 1080, h: 1920, stage: { x: 64, y: 240, w: 952, h: 1130 } },
};

export const FPS = 30;

/** YouTube files a vertical video as a Short up to three minutes; past that it is a regular upload. */
export const SHORT_MAX_SECONDS = 170;

const scene = z.object({
  id: z.string().min(1),
  // Trimmed rather than refused: a title one character long isn't worth throwing a paid-for script away.
  title: z.string().min(1).transform((s) => s.slice(0, 40)),
  narration: z.string().min(1),
  visual: z.string().min(1),
});

/**
 * The channel's shelves. A playlist keeps a viewer watching the next video, which
 * is most of what YouTube ranks on; a fixed list keeps them from splintering.
 */
export const PLAYLISTS = [
  "DSA Patterns",
  "Arrays and Strings",
  "Linked Lists, Stacks and Queues",
  "Trees and Graphs",
  "Dynamic Programming",
  "System Design",
  "CS Fundamentals",
  "Interview Preparation",
] as const;

const cut = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  tags: z.array(z.string()),
  /** Without the "#"; scripts written before the field existed have none. */
  hashtags: z.array(z.string()).default([]),
  scenes: z.array(scene).min(2),
});

export const ScriptSchema = z.object({
  topic: z.string().min(1),
  /** A codekairo.com path (/problems/two-sum). Checked against the live site before it is printed. */
  practicePath: z.string(),
  code: z
    .object({
      language: z.string(),
      /** Whole file: the render job compiles and runs Java as Main.java. */
      source: z.string(),
      /** What running it must print; the render job refuses to continue otherwise. */
      expectedOutput: z.string(),
    })
    .nullable(),
  thumbnail: z.object({ headline: z.string().min(1), tag: z.string().min(1) }),
  playlist: z.enum(PLAYLISTS).default("DSA Patterns"),
  landscape: cut,
  short: cut,
});
export type Script = z.infer<typeof ScriptSchema>;
export type SceneScript = z.infer<typeof scene>;

export const ReviewSchema = z.object({
  problems: z.array(
    z.object({
      format: z.enum(["landscape", "short", "both"]),
      scene: z.string(),
      severity: z.enum(["blocker", "minor"]),
      problem: z.string(),
    }),
  ),
});
export type Review = z.infer<typeof ReviewSchema>;

export interface Word {
  /** Seconds from the start of the video. */
  t: number;
  w: string;
}

export interface TimedScene {
  id: string;
  title: string;
  start: number;
  end: number;
  words: Word[];
}

export interface Timeline {
  format: Format;
  duration: number;
  scenes: TimedScene[];
}

export interface Usage {
  input: number;
  cacheWrite: number;
  cacheRead: number;
  output: number;
  usd: number;
}

/** What the create job leaves for publish beyond the files themselves. */
export interface RunState {
  id: string;
  /** False: the review did not clear it, so it goes up private for a person to look at. */
  cleared: boolean;
  warnings: string[];
  practiceUrl: string;
  usage: Usage;
  landscapeId?: string;
  shortId?: string;
}
