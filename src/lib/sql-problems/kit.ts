import type { Rng } from "./types.js";

/**
 * Helpers for a SQL problem's `gen` — deterministic data from the rng the
 * judge seeds with the problem's slug (a submission sees the same hidden
 * datasets every time; a different problem sees different ones).
 */

/** mulberry32 over a string seed — the catalogue's generator (scripts/catalog/types.ts), here so the API image has it. */
export function makeRng(seed: string): Rng {
  let a = [...seed].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7) >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** An integer in [lo, hi]. */
export const ri = (rng: Rng, lo: number, hi: number): number => lo + Math.floor(rng() * (hi - lo + 1));
export const pick = <T,>(rng: Rng, arr: readonly T[]): T => arr[ri(rng, 0, arr.length - 1)]!;
export const chance = (rng: Rng, p: number): boolean => rng() < p;
export function shuffle<T>(rng: Rng, arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}
/** k distinct items of `arr` (k ≤ arr.length), in random order. */
export const sample = <T,>(rng: Rng, arr: readonly T[], k: number): T[] => shuffle(rng, [...arr]).slice(0, Math.min(k, arr.length));
/** `v`, or NULL with probability p. */
export const maybeNull = <T,>(rng: Rng, p: number, v: T): T | null => (rng() < p ? null : v);
/** A multiple of `step` in [lo, hi] — salaries in thousands, prices in tens. */
export const roundTo = (rng: Rng, lo: number, hi: number, step: number): number => ri(rng, Math.ceil(lo / step), Math.floor(hi / step)) * step;

const pad = (n: number) => String(n).padStart(2, "0");
/** A 'YYYY-MM-DD' between two dates (inclusive). */
export function dateBetween(rng: Rng, from: string, to: string): string {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  const d = new Date(a + ri(rng, 0, Math.round((b - a) / 86_400_000)) * 86_400_000);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}
/** `date` plus `days` days, as 'YYYY-MM-DD'. */
export function addDays(date: string, days: number): string {
  const d = new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}
/** A 'YYYY-MM-DD HH:MM:SS' on `date`. */
export const atTime = (rng: Rng, date: string): string => `${date} ${pad(ri(rng, 0, 23))}:${pad(ri(rng, 0, 59))}:${pad(ri(rng, 0, 59))}`;

export const FIRST_NAMES = [
  "Aarav", "Aditi", "Ananya", "Arjun", "Diya", "Ishaan", "Kavya", "Meera", "Neha", "Nikhil",
  "Priya", "Rahul", "Riya", "Rohan", "Saanvi", "Sneha", "Tanvi", "Vikram", "Vivaan", "Zara",
  "Aisha", "Kabir", "Farhan", "Pooja", "Harsh", "Simran", "Karan", "Anjali", "Dev", "Ira",
  "Alex", "Maria", "John", "Sara", "David", "Emma", "Liam", "Noah", "Olivia", "Mia",
] as const;
export const LAST_NAMES = ["Sharma", "Verma", "Iyer", "Nair", "Reddy", "Khan", "Singh", "Gupta", "Patel", "Das", "Menon", "Joshi", "Rao", "Bose", "Mehta"] as const;
export const DEPARTMENTS = ["Engineering", "Sales", "HR", "Finance", "Marketing", "Support", "Design", "Legal"] as const;
export const CITIES = ["Bengaluru", "Mumbai", "Delhi", "Hyderabad", "Chennai", "Pune", "Kolkata", "Ahmedabad", "Jaipur", "Kochi"] as const;
export const PRODUCTS = ["Laptop", "Phone", "Tablet", "Monitor", "Keyboard", "Mouse", "Headphones", "Camera", "Printer", "Router", "Speaker", "Watch"] as const;

/** `n` distinct first names (n ≤ 40). */
export const names = (rng: Rng, n: number): string[] => sample(rng, FIRST_NAMES, n);
