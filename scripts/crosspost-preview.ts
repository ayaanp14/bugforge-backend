/**
 * What the daily Dev.to cross-post (services/crosspost.ts) would send, without
 * sending it.
 *
 *   npx tsx scripts/crosspost-preview.ts                  the queue, and the next post in full
 *   npx tsx scripts/crosspost-preview.ts --path /roadmap/two-pointers
 *   npx tsx scripts/crosspost-preview.ts --check          every page converted: anything site-only left in a post
 *
 * Reads the road from the DATABASE_URL in .env (the lesson order) and the
 * CrossPost rows (what is already claimed); writes nothing.
 */
import { prisma } from "../src/lib/prisma.js";
import { nextToPost } from "../src/lib/crosspost.js";
import { crosspostQueue, devtoPostFor } from "../src/services/crosspost.js";

const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? (args[i + 1] ?? "") : null;
};

const queue = await crosspostQueue();
const rows = await prisma.crossPost.findMany({ where: { platform: "devto" }, select: { path: true, status: true } });
const taken = new Set(rows.map((r) => r.path));

if (args.includes("--check")) {
  // Markup the site understands and Dev.to does not: a marker line, a site-relative link, an empty figure.
  let bad = 0;
  for (const item of queue) {
    const post = await devtoPostFor(item);
    const problems = [
      /^@(figure|walkthrough)\b/m.test(post.body_markdown) && "a marker line survived",
      /\]\(\/(?!\/)/.test(post.body_markdown) && "a site-relative link",
      /```output/.test(post.body_markdown) && "an output fence",
      !post.tags && "no tags",
      post.title.length > 128 && "title over 128",
    ].filter(Boolean);
    if (problems.length) {
      bad++;
      console.log(`${item.path}: ${problems.join(", ")}`);
    }
  }
  console.log(`${queue.length} pages checked, ${bad} with problems`);
} else {
  console.log(`${queue.length} pages in the queue, ${rows.length} claimed (${rows.filter((r) => r.status === "posted").length} posted).`);
  console.log(queue.slice(0, 6).map((i, n) => `  ${n + 1}. ${i.path}${taken.has(i.path) ? "  (claimed)" : ""}`).join("\n"));
  const path = flag("--path");
  const item = path ? queue.find((i) => i.path === path) : nextToPost(queue, taken);
  if (!item) {
    console.log(path ? `No page ${path} in the queue.` : "Nothing left to post.");
  } else {
    const post = await devtoPostFor(item);
    const { body_markdown, ...meta } = post;
    console.log("\n" + JSON.stringify(meta, null, 2) + "\n");
    console.log(body_markdown);
  }
}
await prisma.$disconnect();
