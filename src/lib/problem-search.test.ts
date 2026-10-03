import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { correctSearch, foldWord, normalizeSearch, parseSearch, rankCatalogue, rankSearch, RANK, searchVocabulary, SEARCH_MAX_CHARS, SEARCH_MAX_PARTS, type TextHit } from "./problem-search.js";

/*
 * Problem search (2026-10-03): what a query means and the order matches come
 * back in. The full-text half is stubbed here as the map the service would
 * hand over — which problems' statements contain which terms — so every rule
 * is pinned without a database.
 *
 * Run with: npx tsx --test src/lib/problem-search.test.ts
 */

interface Row {
  id: string;
  title: string;
  tags: string[];
}

// In catalogue order (newest first), the order ties fall back to.
const ROWS: Row[] = [
  { id: "p01", title: "Two Sum", tags: ["Array", "Hash Table", "Amazon", "Google"] },
  { id: "p02", title: "Two Sum II - Input Array Is Sorted", tags: ["Array", "Two Pointers", "Binary Search", "Amazon"] },
  { id: "p03", title: "Two Sum Less Than K", tags: ["Array", "Two Pointers", "Sorting"] },
  { id: "p04", title: "Sum of Two Integers", tags: ["Math", "Bit Manipulation", "Meta"] },
  { id: "p05", title: "Maximum Subarray", tags: ["Array", "Dynamic Programming", "Amazon", "Microsoft"] },
  { id: "p06", title: "Rotate Array", tags: ["Array", "Math", "Microsoft"] },
  { id: "p07", title: "Array Partition", tags: ["Array", "Greedy", "Sorting"] },
  { id: "p08", title: "Product of Array Except Self", tags: ["Array", "Prefix Sum", "Amazon", "Apple"] },
  { id: "p09", title: "Sliding Window Maximum", tags: ["Array", "Sliding Window", "Heap (Priority Queue)", "Amazon", "Google"] },
  { id: "p10", title: "Longest Substring Without Repeating Characters", tags: ["String", "Hash Table", "Sliding Window", "Amazon"] },
  { id: "p11", title: "Binary Search", tags: ["Array", "Binary Search"] },
  { id: "p12", title: "Search Insert Position", tags: ["Array", "Binary Search", "Google"] },
  { id: "p13", title: "Kth Largest Element in an Array", tags: ["Array", "Heap", "Heap (Priority Queue)", "Amazon", "Facebook"] },
  { id: "p14", title: "Sum of Distances in Tree", tags: ["Tree", "Depth-First Search", "Google"] },
  { id: "p15", title: "Range Sum Query - Mutable", tags: ["Array", "Segment Tree", "Binary Indexed Tree", "Google"] },
  { id: "p16", title: "Climbing Stairs", tags: ["Math", "Dynamic Programming", "Memoization", "Goldman Sachs"] },
  { id: "p17", title: "Word Ladder", tags: ["Hash Table", "String", "Breadth-First Search", "Amazon"] },
  { id: "p18", title: "Coin Change", tags: ["Array", "Dynamic Programming", "Breadth-First Search"] },
];

const VOCAB = searchVocabulary(ROWS.map((r) => r.tags));

/** The titles a query returns, best first. `text` maps id → terms its statement contains. */
function search(raw: string, text: Record<string, { relevance: number; terms: string[] }> = {}, opts: { textDown?: boolean } = {}): string[] {
  const parsed = parseSearch(normalizeSearch(raw), VOCAB);
  let hits: Map<string, TextHit> | null = new Map();
  for (const [id, { relevance, terms }] of Object.entries(text)) {
    let mask = 0;
    for (const t of terms) {
      const at = parsed.terms.indexOf(t);
      if (at !== -1) mask |= 1 << at;
    }
    if (mask) hits.set(id, { relevance, mask });
  }
  if (opts.textDown) hits = null;
  return rankCatalogue(ROWS, parsed, hits).map((r) => r.title);
}

describe("normalizeSearch", () => {
  it("is no search for nothing, blanks, punctuation or a non-string", () => {
    for (const raw of ["", "   ", "\t\n", "!!!", "--", "*", undefined, null, 42, ["array"], { q: "array" }]) {
      assert.equal(normalizeSearch(raw), "", JSON.stringify(raw));
    }
  });

  it("folds case, accents and runs of spaces", () => {
    assert.equal(normalizeSearch("  ARRAY  "), "array");
    assert.equal(normalizeSearch("Two    Sum"), "two sum");
    assert.equal(normalizeSearch("Pascal's Triangle"), "pascal s triangle");
    assert.equal(normalizeSearch("Café  Ñandú"), "cafe nandu");
    assert.equal(normalizeSearch("Two Sum II - Input Array"), "two sum ii input array");
  });

  it("cuts a long query at SEARCH_MAX_CHARS", () => {
    const out = normalizeSearch("array ".repeat(1000));
    assert.ok(out.length <= SEARCH_MAX_CHARS);
    assert.ok(out.startsWith("array array"));
  });

  it("leaves no full-text operator or quote in what it returns", () => {
    const hostile = [`'; DROP TABLE Problem; --`, `+amazon -google*`, `"two sum" @3`, `<script>alert(1)</script>`, `%_\\`, `two) OR (1=1`, `~tree >heap <stack`];
    for (const raw of hostile) assert.match(normalizeSearch(raw), /^[\p{L}\p{N} ]*$/u, raw);
    assert.equal(normalizeSearch(`'; DROP TABLE Problem; --`), "drop table problem");
  });
});

describe("parseSearch", () => {
  it("reads a tag's name as one part, longest first", () => {
    const parsed = parseSearch(normalizeSearch("amazon sliding window"), VOCAB);
    assert.deepEqual(parsed.parts.map((p) => [p.phrase, p.entity?.kind ?? null]), [["amazon", "company"], ["sliding window", "topic"]]);
    assert.deepEqual(parsed.terms, ["amazon", "sliding", "window"]);
  });

  it("knows the names people use that are not the tag's words", () => {
    const has = (raw: string, tag: string) => parseSearch(normalizeSearch(raw), VOCAB).parts[0]?.entity?.tags.has(tag) ?? false;
    assert.ok(has("dp", "Dynamic Programming"));
    assert.ok(has("BFS", "Breadth-First Search"));
    assert.ok(has("priority queue", "Heap (Priority Queue)"));
    assert.ok(has("facebook", "Meta"), "the old company name finds the new");
    assert.ok(has("heap", "Heap (Priority Queue)"), "a topic's aliases are the same topic");
    assert.ok(has("goldman sachs", "Goldman Sachs"));
    assert.ok(has("arrays", "Array"), "plural");
  });

  it("drops stopwords and single letters as parts, and short words from the full-text terms", () => {
    const parsed = parseSearch(normalizeSearch("the sum of a k"), VOCAB);
    assert.deepEqual(parsed.parts.map((p) => p.phrase), ["sum"]);
    assert.deepEqual(parsed.terms, ["sum"]);
    assert.deepEqual(parseSearch("dp", VOCAB).terms, [], "under innodb_ft_min_token_size: no statement is sent");
  });

  it("asks for each thing once and at most SEARCH_MAX_PARTS things", () => {
    assert.equal(parseSearch("sum sum sum", VOCAB).parts.length, 1);
    const many = parseSearch(normalizeSearch("alpha bravo charlie delta echo foxtrot golf hotel india juliet kilo"), VOCAB);
    assert.equal(many.parts.length, SEARCH_MAX_PARTS);
    assert.ok(many.terms.length <= SEARCH_MAX_PARTS);
  });

  it("stems full-text terms so the prefix covers both spellings", () => {
    assert.deepEqual(parseSearch("queries", VOCAB).terms, ["quer"]);
    assert.deepEqual(parseSearch("arrays", VOCAB).terms, ["array"]);
    assert.equal(foldWord("queries"), "query");
    assert.equal(foldWord("matches"), "match");
    assert.equal(foldWord("class"), "class");
    assert.equal(foldWord("3sum"), "3sum");
  });
});

describe("rankCatalogue", () => {
  it("'array': a title starting with it, then a title word, then inside a word, then the tag alone", () => {
    const out = search("array");
    assert.equal(out[0], "Array Partition");
    assert.ok(out.indexOf("Rotate Array") < out.indexOf("Maximum Subarray"), "word start before infix");
    assert.ok(out.indexOf("Maximum Subarray") < out.indexOf("Coin Change"), "a title match before the tag alone");
    assert.ok(out.includes("Coin Change"), "found through the Array tag, though the title never says so");
    assert.ok(!out.includes("Climbing Stairs"));
  });

  it("'two': titles with the word, shortest first", () => {
    const out = search("two");
    assert.deepEqual(out.slice(0, 3), ["Two Sum", "Two Sum Less Than K", "Two Sum II - Input Array Is Sorted"]);
    assert.ok(out.includes("Sum of Two Integers"));
  });

  it("'amazon': every problem tagged with the company, none of which says Amazon, in catalogue order", () => {
    const out = search("amazon");
    const tagged = ROWS.filter((r) => r.tags.includes("Amazon")).map((r) => r.title);
    assert.deepEqual(out, tagged);
  });

  it("an exact title comes first", () => {
    assert.equal(search("two sum")[0], "Two Sum");
    assert.equal(search("Binary Search")[0], "Binary Search");
    assert.equal(search("longest substring without repeating characters")[0], "Longest Substring Without Repeating Characters");
  });

  it("a partial title, as typed, finds the problem", () => {
    assert.equal(search("two su")[0], "Two Sum");
    assert.equal(search("longest subs")[0], "Longest Substring Without Repeating Characters");
    assert.equal(search("product of arr")[0], "Product of Array Except Self");
  });

  it("a company or topic tag finds its problems by name", () => {
    assert.deepEqual(search("goldman sachs"), ["Climbing Stairs"]);
    // The old name and the new are one company: both tags answer either.
    assert.deepEqual(search("facebook"), ["Sum of Two Integers", "Kth Largest Element in an Array"]);
    assert.deepEqual(search("meta"), search("facebook"));
    assert.deepEqual(new Set(search("sliding window")), new Set(["Sliding Window Maximum", "Longest Substring Without Repeating Characters"]));
    assert.deepEqual(new Set(search("dp")), new Set(["Maximum Subarray", "Climbing Stairs", "Coin Change"]));
    // Both heap tags are one topic; the problem carrying both appears once.
    assert.deepEqual(new Set(search("heap")), new Set(["Sliding Window Maximum", "Kth Largest Element in an Array"]));
  });

  it("is blind to case and surrounding whitespace", () => {
    const expected = search("array");
    for (const raw of ["ARRAY", "Array", "  array  ", "\tArRaY\n"]) assert.deepEqual(search(raw), expected, raw);
  });

  it("several parts must all be satisfied: 'amazon array', 'google tree', 'amazon sliding window'", () => {
    const amazonArray = search("amazon array");
    assert.ok(amazonArray.length > 0);
    for (const title of amazonArray) {
      const row = ROWS.find((r) => r.title === title)!;
      assert.ok(row.tags.includes("Amazon"), title);
      assert.ok(row.tags.includes("Array") || /array/i.test(row.title), title);
    }
    assert.ok(!amazonArray.includes("Rotate Array"), "an Array problem not asked at Amazon");

    // Google's problems with a tree: the Tree tag, or a tree tag (Segment Tree).
    assert.deepEqual(search("google tree"), ["Sum of Distances in Tree", "Range Sum Query - Mutable"]);
    assert.deepEqual(new Set(search("amazon sliding window")), new Set(["Sliding Window Maximum", "Longest Substring Without Repeating Characters"]));
  });

  it("the parts of a title in any order find it", () => {
    assert.equal(search("sum two")[0], "Two Sum");
  });

  it("a part only the statement answers comes from the full-text hits", () => {
    const out = search("amazon ladder", { p17: { relevance: 1, terms: ["ladder"] } });
    assert.deepEqual(out, ["Word Ladder"]);
    const textOnly = search("staircase", { p16: { relevance: 2.5, terms: ["staircase"] } });
    assert.deepEqual(textOnly, ["Climbing Stairs"]);
  });

  it("orders statement-only matches by relevance", () => {
    const out = search("recursion", { p16: { relevance: 0.5, terms: ["recursion"] }, p18: { relevance: 3.1, terms: ["recursion"] } });
    assert.deepEqual(out, ["Coin Change", "Climbing Stairs"]);
  });

  it("with one unknown word, answers the best partial match instead of nothing", () => {
    const out = search("amazon blockchain");
    assert.deepEqual(out, search("amazon"));
  });

  it("finds nothing for nothing", () => {
    assert.deepEqual(search("zzqqxx"), []);
    assert.deepEqual(search("zzqqxx wwvvyy"), []);
  });

  it("returns each problem once, however many signals found it", () => {
    for (const raw of ["array", "two sum", "amazon array", "heap", "binary search", "sliding window"]) {
      const out = search(raw, Object.fromEntries(ROWS.map((r) => [r.id, { relevance: 1, terms: normalizeSearch(raw).split(" ") }])));
      assert.equal(new Set(out).size, out.length, raw);
    }
  });

  it("ranks exact title > prefix > topic > title word > inside a word > statement", () => {
    const rows: Row[] = [
      { id: "s", title: "Valid Tree", tags: [] }, // statement only
      { id: "i", title: "Subgraph Count", tags: [] }, // inside a word
      { id: "c", title: "Count Islands", tags: ["Graph"] }, // topic
      { id: "w", title: "Clone Graph", tags: [] }, // a title word
      { id: "p", title: "Graphs And Paths", tags: [] }, // title prefix
      { id: "e", title: "Graph", tags: [] }, // exact
    ];
    const parsed = parseSearch("graph", searchVocabulary(rows.map((r) => r.tags)));
    const hits = new Map<string, TextHit>([["s", { relevance: 2, mask: 1 }]]);
    assert.deepEqual(rankCatalogue(rows, parsed, hits).map((r) => r.id), ["e", "p", "c", "w", "i", "s"]);
  });

  it("weighs a company above a topic, and both below a title prefix", () => {
    assert.ok(RANK.titleExact > RANK.titlePrefix);
    assert.ok(RANK.titlePrefix > RANK.companyExact);
    assert.ok(RANK.companyExact > RANK.tagExact);
    assert.ok(RANK.tagExact > RANK.titleContainsWord);
    assert.ok(RANK.titleContainsWord > RANK.titleContains);
    assert.ok(RANK.titleContains > RANK.text + RANK.textRelevance);
  });

  it("is deterministic, so pages sliced from it neither repeat nor skip a row", () => {
    const text = Object.fromEntries(ROWS.map((r, i) => [r.id, { relevance: (i % 3) + 1, terms: ["array"] }]));
    const all = search("array", text);
    assert.deepEqual(search("array", text), all);
    const pages = [all.slice(0, 4), all.slice(4, 8), all.slice(8)];
    assert.deepEqual(pages.flat(), all);
    assert.equal(new Set(pages.flat()).size, all.length);
  });

  it("still answers from titles, topics and companies when the full-text half is down", () => {
    assert.equal(search("two sum", {}, { textDown: true })[0], "Two Sum");
    assert.deepEqual(search("amazon", {}, { textDown: true }), search("amazon"));
    assert.deepEqual(search("staircase", {}, { textDown: true }), []);
  });

  it("a query of only stopwords or one letter is a title lookup", () => {
    // All three hold "of" as a word; the shorter title is the closer match.
    assert.deepEqual(search("of"), ["Sum of Two Integers", "Sum of Distances in Tree", "Product of Array Except Self"]);
    assert.ok(search("k").includes("Two Sum Less Than K"));
  });

  it("is unharmed by hostile input", () => {
    for (const raw of [`'; DROP TABLE Problem; --`, `+amazon -google*`, `"two sum"`, `%`, `\\`, "a".repeat(10_000)]) {
      assert.doesNotThrow(() => search(raw), raw);
    }
    assert.equal(search(`"two sum"`)[0], "Two Sum");
    assert.deepEqual(search("+amazon -google*"), search("amazon google"));
  });
});

describe("problem numbers", () => {
  // The fixture numbered in order: Two Sum is #1, Binary Search #11, Kth Largest #13.
  const NUMBERED = ROWS.map((r, i) => ({ ...r, number: i + 1 }));
  const find = (raw: string) => rankCatalogue(NUMBERED, parseSearch(normalizeSearch(raw), VOCAB), new Map()).map((r) => r.title);

  it("a query that is a problem's number finds it first, however it is written", () => {
    assert.equal(find("1")[0], "Two Sum");
    assert.equal(find("#13")[0], "Kth Largest Element in an Array");
    assert.equal(find("11.")[0], "Binary Search");
    assert.equal(find("1. two sum")[0], "Two Sum");
  });

  it("matches the whole number, not a prefix of it", () => {
    assert.deepEqual(find("11"), ["Binary Search"]);
    assert.deepEqual(find("99"), []);
  });
});

describe("typos", () => {
  it("corrects each word no title or tag uses to the closest one that is", () => {
    assert.equal(correctSearch("tow sum", ROWS), "two sum");
    assert.equal(correctSearch("slidng window", ROWS), "sliding window");
    assert.equal(correctSearch("climbng stairs", ROWS), "climbing stairs");
    assert.equal(correctSearch("amazn", ROWS), "amazon");
    assert.equal(correctSearch("binary serch", ROWS), "binary search");
  });

  it("leaves known words, numbers, stopwords and short words alone", () => {
    assert.equal(correctSearch("two sum", ROWS), null);
    assert.equal(correctSearch("of k 3sum", ROWS), null);
    assert.equal(correctSearch("zzqqxxyy", ROWS), null, "nothing within reach");
    assert.equal(correctSearch("", ROWS), null);
  });

  it("says when an answer is only a partial match — the cue to correct", () => {
    const run = (raw: string) => rankSearch(ROWS, parseSearch(normalizeSearch(raw), VOCAB), new Map());
    assert.equal(run("two sum").complete, true);
    assert.equal(run("amazon blockchain").complete, false);
    assert.equal(run("tow sum").complete, false);
    assert.equal(run("zzqqxx").complete, false);
    assert.equal(run("two sum").rows[0]!.title, "Two Sum");
  });
});

describe("firm matches", () => {
  const run = (raw: string, text: Record<string, string[]> = {}) => {
    const parsed = parseSearch(normalizeSearch(raw), VOCAB);
    const hits = new Map<string, TextHit>();
    for (const [id, terms] of Object.entries(text)) {
      let mask = 0;
      for (const t of terms) if (parsed.terms.includes(t)) mask |= 1 << parsed.terms.indexOf(t);
      if (mask) hits.set(id, { relevance: 1, mask });
    }
    return rankSearch(ROWS, parsed, hits);
  };

  it("is firm when a title, a number or a tag of that name answers every part", () => {
    assert.equal(run("two sum").firm, true);
    assert.equal(run("amazon").firm, true, "the company tag");
    assert.equal(run("amazon array").firm, true);
  });

  it("is complete but not firm when a part is answered only by a statement or a longer tag's word", () => {
    const viaText = run("ladder staircase", { p17: ["ladder", "staircase"] });
    assert.equal(viaText.complete, true);
    assert.equal(viaText.firm, false);
    assert.equal(run("pointer").firm, false, "only a word of Two Pointers");
  });
});
