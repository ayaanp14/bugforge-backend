/**
 * One way to turn a title into a URL segment, shared by the seeders and the
 * backfill so the same title always yields the same address.
 *
 * Lower-case ASCII letters, digits and single hyphens, nothing leading or
 * trailing, at most 80 characters cut on a hyphen: "The Checkout Meltdown"
 * → "the-checkout-meltdown", "Ghost Rows in the Audit Log" →
 * "ghost-rows-in-the-audit-log". Accents are folded (é → e) rather than
 * dropped, so "Café" and "Cafe" do not collide by accident and neither
 * loses a letter. An empty result (a title of only symbols) falls back to
 * "untitled" so a caller never writes an empty slug.
 */
export function slugify(title: string, max = 80): string {
  const base = title
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!base) return "untitled";
  if (base.length <= max) return base;
  const cut = base.slice(0, max);
  const at = cut.lastIndexOf("-");
  return at > 20 ? cut.slice(0, at) : cut;
}

/**
 * A slug no other row holds and no route reserves: the base, or the base
 * with "-2", "-3" … appended. `taken` answers whether a candidate is in use.
 */
export async function uniqueSlug(title: string, taken: (candidate: string) => Promise<boolean>, reserved: ReadonlySet<string> = new Set()): Promise<string> {
  const base = slugify(title);
  let candidate = base;
  for (let n = 2; reserved.has(candidate) || (await taken(candidate)); n++) candidate = `${base}-${n}`;
  return candidate;
}
