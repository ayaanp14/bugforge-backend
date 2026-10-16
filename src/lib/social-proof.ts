/**
 * The rules behind the landing page's "who is here" (services/social-proof):
 * pure, so the privacy floor is pinned by social-proof.test.ts.
 *
 * Colleges are what members typed (`User.instituteName`, self-reported and
 * already public on their profiles). The landing page names a college only
 * when at least MIN_MEMBERS_TO_NAME members share it — a name there never
 * points at one person — and counts the rest without naming them.
 */
export const MIN_MEMBERS_TO_NAME = 3;
export const MAX_COLLEGES_NAMED = 12;

/** Spelling-insensitive key: case, punctuation and runs of space don't make a new college. */
export function collegeKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

export interface CollegeSummary {
  /** Distinct colleges across members who typed one. */
  count: number;
  /** Colleges with at least MIN_MEMBERS_TO_NAME members, most members first, in their most common spelling. */
  named: string[];
}

export function summariseColleges(rows: ReadonlyArray<{ name: string; members: number }>): CollegeSummary {
  const byKey = new Map<string, { total: number; spellings: Map<string, number> }>();
  for (const row of rows) {
    const shown = row.name.trim().replace(/\s+/g, " ");
    const key = collegeKey(shown);
    if (key.length < 2) continue;
    const entry = byKey.get(key) ?? { total: 0, spellings: new Map() };
    entry.total += row.members;
    entry.spellings.set(shown, (entry.spellings.get(shown) ?? 0) + row.members);
    byKey.set(key, entry);
  }
  const named = [...byKey.values()]
    .filter((e) => e.total >= MIN_MEMBERS_TO_NAME)
    .sort((a, b) => b.total - a.total)
    .slice(0, MAX_COLLEGES_NAMED)
    .map((e) => [...e.spellings.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]![0]);
  return { count: byKey.size, named };
}

/** A member as a quote signs them: the first word of their name, never the surname or a username. */
export function firstName(name: string | null | undefined): string | null {
  const first = (name ?? "").trim().split(/\s+/)[0] ?? "";
  return first.length >= 2 ? first.slice(0, 30) : null;
}
