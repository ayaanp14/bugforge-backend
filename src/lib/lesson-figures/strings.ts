import { finish, note, row, rowLabel, slotMid, slotX, type Frame, type Item, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { arrow, box, label } from "./kit.js";

/**
 * Strings: the lesson's figures (content/roadmap/strings.md places each
 * with "@figure <name>"). Character codes read from charCodeAt, the
 * concatenation triangle counted copy by copy, the 26-slot count run on
 * real strings, the mirror pairs a palindrome check compares, and a split /
 * reverse / join that glides the words into place.
 */

const code = (c: string) => c.charCodeAt(0);
/** A number as the page prints it: a real minus sign. */
const fmt = (v: number) => String(v).replace("-", "−");
const small = (id: string, text: string, x: number, y: number, tone: "soft" | "faint" | "accent" = "faint"): Item => label(id, text, x, y, { mono: true, size: 10.5, tone });

/** The three runs of ASCII codes, and a word turned into codes and into 0–25 positions. */
function charCodes(): Walkthrough {
  const runs: Array<[string, string, string]> = [
    ["0", "9", "digits"],
    ["A", "Z", "capitals"],
    ["a", "z", "small letters"],
  ];
  const BW = 112;
  const BG = 18;
  const items: Item[] = [];
  runs.forEach(([a, z, name], k) => {
    const x = k * (BW + BG);
    items.push(label(`rn${k}`, name, x + BW / 2, -14, { size: 11, tone: "soft", weight: 600 }));
    items.push(box(`run${k}`, x, 0, `'${a}' … '${z}'`, { tone: k === 2 ? "accent" : "plain", w: BW, h: 34, size: 13 }));
    items.push(label(`rc${k}`, `${code(a)} … ${code(z)}`, x + BW / 2, 50, { size: 12, tone: "ink", mono: true }));
  });
  const shift = code("a") - code("A");
  items.push(arrow("up", { x: BW + BG + BW / 2 + 20, y: 62 }, { x: 2 * (BW + BG) + BW / 2 - 20, y: 62 }, { tone: "accent", bow: 18, label: `+ ${shift}` }));
  const word = "code";
  const Y = 128;
  const S = { size: 40, gap: 8 };
  const X0 = 96;
  items.push(rowLabel("lw", "s", X0 - 12, Y, S.size));
  items.push(...row("w", [...word], { x: X0, y: Y, ...S, tone: () => "plain" }));
  items.push(label("lc", "code", X0 - 12, Y + S.size + 16, { anchor: "end", size: 11, tone: "faint" }));
  items.push(label("lp", "c − 'a'", X0 - 12, Y + S.size + 38, { anchor: "end", size: 11, tone: "faint" }));
  [...word].forEach((c, i) => {
    items.push(small(`wc${i}`, String(code(c)), slotMid(i, X0, S.size, S.gap), Y + S.size + 16, "soft"));
    items.push(label(`wp${i}`, String(code(c) - code("a")), slotMid(i, X0, S.size, S.gap), Y + S.size + 38, { mono: true, size: 12.5, tone: "accent", weight: 600 }));
  });
  return finish({
    title: "Characters are numbers: the ASCII runs and c − 'a'",
    input: "",
    frames: [
      {
        caption: `Digits, capitals and small letters each sit in an unbroken run of codes, so subtracting a run's first code gives a position: c − 'a' maps 'a' to 0 and 'z' to 25, and c − '0' turns '7' into 7. A small letter is its capital plus ${shift}.`,
        items,
      },
    ],
  });
}

/** result = result + c copies the whole string every step: a triangle of copies, against a builder's single row of writes. */
function concatTrap(): Walkthrough {
  const target = "abcde";
  const n = target.length;
  const S = { size: 30, gap: 4 };
  const ROW = 36;
  const frames: Frame[] = [];
  let total = 0;
  const totals: number[] = [];

  const draw = (upto: number, builder = false): Item[] => {
    const items: Item[] = [];
    for (let k = 1; k <= upto; k++) {
      const y = (k - 1) * ROW;
      const current = k === upto && !builder;
      items.push(rowLabel(`rl${k}`, `step ${k}`, -10, y, S.size));
      items.push(
        ...row(`r${k}-`, [...target.slice(0, k)], {
          ...S,
          y,
          tone: (i) => (current ? (i === k - 1 ? "strong" : "accent") : "muted"),
        }),
      );
      items.push(label(`rc${k}`, `${k} copied`, slotX(n, 0, S.size, S.gap) + 8, y + S.size / 2, { anchor: "start", size: 11, tone: current ? "accent" : "faint", mono: true }));
    }
    const yNote = n * ROW + 10;
    items.push(note("tot", `characters copied: ${totals.slice(0, upto).join(" + ")} = ${totals.slice(0, upto).reduce((a, b) => a + b, 0)}`, 0, yNote, { weight: 600, size: 12.5 }));
    if (builder) {
      const yb = yNote + 30;
      items.push(rowLabel("bl", "builder", -10, yb, S.size));
      items.push(...row("b", [...target], { ...S, y: yb, tone: () => "strong" }));
      for (let i = n; i < n + 3; i++) items.push(box(`bs${i}`, slotX(i, 0, S.size, S.gap), yb, "", { tone: "ghost", w: S.size, h: S.size }));
      items.push(label("bw", `${n} writes`, slotX(n + 3, 0, S.size, S.gap) + 8, yb + S.size / 2, { anchor: "start", size: 11, tone: "accent", mono: true }));
    }
    return items;
  };

  for (let k = 1; k <= n; k++) {
    total += k;
    totals.push(k);
    frames.push({
      caption:
        k === 1
          ? `result = result + c builds a brand-new string every time, because Java, Python and JavaScript strings cannot change. Step 1 makes "a": 1 character copied.`
          : k === 2
            ? `Step 2 cannot extend "a" in place. It copies "a" into a new string and adds "b": 2 characters, and the old string is thrown away.`
            : `Step ${k} copies all ${k - 1} old characters again, plus "${target[k - 1]}": ${k} more, ${total} so far. The copies pile up as a triangle.`,
      items: draw(k),
    });
  }
  frames.push({
    caption: `Building n characters this way copies 1 + 2 + … + n = n(n + 1)/2 — ${total} here, about 5 × 10⁹ for 100,000. A builder writes into spare room and converts once: ${n} writes, O(n).`,
    items: draw(n, true),
  });
  return finish({ title: "Why result = result + c in a loop is O(n²)", input: `build "${target}" one character at a time`, frames });
}

/** Valid Anagram with a 26-slot count: add the first string's letters, subtract the second's, check for zeros. */
function anagramCount(): Walkthrough {
  const s = "rat";
  const t = "car";
  const letters = [...new Set([...s, ...t])].sort();
  const count = new Map(letters.map((c) => [c, 0]));
  const S = { size: 38, gap: 8 };
  const SLOT = { size: 44, gap: 10 };
  const Y_T = 52;
  const Y_C = 128;
  const frames: Frame[] = [];

  const draw = (o: { word?: "s" | "t"; i?: number; verdict?: boolean }): Item[] => {
    const items: Item[] = [rowLabel("ls", "s", -10, 0, S.size), rowLabel("lt", "t", -10, Y_T, S.size)];
    items.push(...row("s", [...s], { ...S, tone: (i) => (o.word === "s" && i === o.i ? "accent" : "plain") }));
    items.push(...row("t", [...t], { ...S, y: Y_T, tone: (i) => (o.word === "t" && i === o.i ? "accent" : "plain") }));
    const cur = o.word ? (o.word === "s" ? s : t)[o.i!] : undefined;
    items.push(rowLabel("lc", "count", -10, Y_C, SLOT.size));
    letters.forEach((c, k) => {
      const v = count.get(c)!;
      const tone: Tone = o.verdict ? (v === 0 ? "plain" : "error") : c === cur ? "accent" : "plain";
      items.push(box(`c${c}`, slotX(k, 0, SLOT.size, SLOT.gap), Y_C, fmt(v), { tone, w: SLOT.size, h: SLOT.size }));
      items.push(label(`cl${c}`, `'${c}'`, slotMid(k, 0, SLOT.size, SLOT.gap), Y_C + SLOT.size + 13, { size: 11.5, tone: "ink", mono: true }));
      items.push(small(`ci${c}`, `[${code(c) - code("a")}]`, slotMid(k, 0, SLOT.size, SLOT.gap), Y_C + SLOT.size + 28));
    });
    // The change, tagged over the slot it lands in (the slot and the letter share the accent).
    if (cur !== undefined) items.push(label("go", o.word === "s" ? "+1" : "−1", slotMid(letters.indexOf(cur), 0, SLOT.size, SLOT.gap), Y_C - 12, { size: 12.5, tone: "accent", weight: 700, mono: true }));
    return items;
  };

  frames.push({
    caption: `Only the letters that occur are drawn; the other ${26 - letters.length} of the 26 slots stay 0. A letter's slot is c − 'a', so no hashing is needed, and the array's size never depends on the input: O(1) space.`,
    items: draw({}),
  });
  [...s].forEach((c, i) => {
    count.set(c, count.get(c)! + 1);
    frames.push({
      caption:
        i === 0
          ? `Add s: '${c}' − 'a' = ${code(c) - code("a")}, so slot ${code(c) - code("a")} goes up by one.`
          : i === s.length - 1
            ? `'${c}' adds one to slot ${code(c) - code("a")}. The slots now hold how often each letter appears in "${s}".`
            : `'${c}' − 'a' = ${code(c) - code("a")}: slot ${code(c) - code("a")} goes up by one too.`,
      items: draw({ word: "s", i }),
    });
  });
  [...t].forEach((c, i) => {
    count.set(c, count.get(c)! - 1);
    const v = count.get(c)!;
    frames.push({
      caption: i === 0 ? `Now subtract t. '${c}' never appeared in s, so its slot drops to ${fmt(v)}: t has a letter s lacks.` : `'${c}' takes one away from slot ${code(c) - code("a")}, which is back to ${fmt(v)}.`,
      items: draw({ word: "t", i }),
    });
  });
  const off = letters.filter((c) => count.get(c) !== 0);
  frames.push({
    caption: `Not anagrams: ${off.map((c) => `'${c}' ends at ${fmt(count.get(c)!)}`).join(" and ")}. Strings are anagrams exactly when every slot ends at zero — one pass over each, O(n), against O(n log n) for sorting both.`,
    items: draw({ verdict: true }),
  });
  return finish({ title: "Valid anagram with a 26-slot count", input: `s = "${s}", t = "${t}"`, frames });
}

/** The pairs a palindrome check compares: punctuation dropped, letters matched with their mirror image, outermost first. */
function mirrorPairs(): Walkthrough {
  const examples = ["Don't nod.", "race a car"];
  const S = { size: 30, gap: 4 };
  const Y_CLEAN = 92;
  const frames: Frame[] = [];
  const isAlnum = (c: string) => /[a-z0-9]/i.test(c);
  examples.forEach((raw, e) => {
    const chars = [...raw];
    const keep = chars.map((c, i) => (isAlnum(c) ? i : -1)).filter((i) => i >= 0);
    const clean = keep.map((i) => chars[i].toLowerCase());
    const m = clean.length;
    const x0 = ((chars.length - m) * (S.size + S.gap)) / 2;
    // The first mirror pair that differs, if any.
    let bad = -1;
    for (let a = 0; a < Math.floor(m / 2); a++) if (clean[a] !== clean[m - 1 - a]) { bad = a; break; }
    const pairsShown = bad === -1 ? Math.floor(m / 2) : bad + 1;
    const items: Item[] = [rowLabel("lr", "s", -10, 0, S.size), rowLabel("lc", "cleaned", -10, Y_CLEAN, S.size)];
    items.push(...row(`r${e}-`, chars.map((c) => (c === " " ? "␣" : c)), { ...S, tone: (i) => (isAlnum(chars[i]) ? "plain" : "muted") }));
    keep.forEach((ri, ci) =>
      items.push(arrow(`d${e}-${ci}`, { x: slotMid(ri, 0, S.size, S.gap), y: S.size + 4 }, { x: slotMid(ci, x0, S.size, S.gap), y: Y_CLEAN - 4 }, { tone: "faint", head: false })),
    );
    const pairTone = (a: number): Tone => (a === bad ? "error" : "accent");
    items.push(
      ...row(`c${e}-`, clean, {
        ...S,
        x: x0,
        y: Y_CLEAN,
        tone: (i) => {
          const a = Math.min(i, m - 1 - i);
          if (a >= pairsShown) return a === i && i === m - 1 - i ? "plain" : "plain";
          return pairTone(a);
        },
      }),
    );
    for (let a = 0; a < pairsShown; a++) {
      const L = slotMid(a, x0, S.size, S.gap);
      const R = slotMid(m - 1 - a, x0, S.size, S.gap);
      items.push(arrow(`p${e}-${a}`, { x: L, y: Y_CLEAN + S.size + 4 }, { x: R, y: Y_CLEAN + S.size + 4 }, { tone: a === bad ? "error" : "accent", head: false, bow: Math.max(12, (R - L) / 4.5) }));
    }
    const pad = (Math.max(...examples.map((x) => x.length)) * (S.size + S.gap)) / 2;
    items.push(label("verdict", bad === -1 ? `${pairsShown} pairs match: a palindrome` : `pair ${bad + 1}: '${clean[bad]}' ≠ '${clean[m - 1 - bad]}' — not a palindrome`, pad, Y_CLEAN + S.size + 76, { size: 12.5, tone: bad === -1 ? "accent" : "error", weight: 600, mono: true }));
    frames.push({
      caption:
        bad === -1
          ? `Drop what is not a letter or digit and lower-case the rest: "${raw}" becomes "${clean.join("")}", a palindrome when every mirror pair matches. Skipping punctuation from both ends makes the two pointers meet exactly these pairs, outermost first.`
          : `In "${raw}" the first ${bad} pair${bad === 1 ? "" : "s"} match, but pair ${bad + 1}, '${clean[bad]}' and '${clean[m - 1 - bad]}', does not, so the answer is false the moment the pointers reach it. Everything outside left..right is always already matched.`,
      items,
    });
  });
  return finish({ title: "Why skipping punctuation is safe: the pointers compare mirror pairs", input: examples.map((x) => `"${x}"`).join(" and "), frames });
}

/** Reverse Words in a String: split on runs of spaces, reverse the list, join once with single spaces. */
function reverseWords(): Walkthrough {
  const s = "  the sky   is blue  ";
  const chars = [...s];
  const words: Array<{ text: string; start: number }> = [];
  const re = /\S+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) words.push({ text: m[0], start: m.index });
  const C = 20;
  const G = 2;
  const cx = (i: number) => i * (C + G);
  const Y_W = 70;
  const WH = 32;
  const charW = 9.5;
  const wordW = (w: string) => Math.max(40, w.length * charW + 18);
  const frames: Frame[] = [];

  const raw = (tone: (i: number) => Tone): Item[] => chars.map((c, i) => box(`ch${i}`, cx(i), 0, c === " " ? "·" : c, { tone: tone(i), w: C, h: C + 8, size: 13 }));
  const listAt = (order: number[], y: number, tone: Tone): Item[] => {
    const items: Item[] = [];
    let x = 0;
    order.forEach((k, pos) => {
      items.push(box(`w${k}`, x, y, words[k].text, { tone, w: wordW(words[k].text), h: WH, size: 13 }));
      x += wordW(words[k].text) + 10;
      if (pos < order.length - 1) items.push(label(`cm${pos}`, ",", x - 6, y + WH / 2 + 4, { size: 13, tone: "faint", mono: true }));
    });
    return items;
  };
  const inWord = (i: number) => words.some((w) => i >= w.start && i < w.start + w.text.length);

  frames.push({
    caption: `The goal: the words in reverse order, separated by single spaces, with no spaces at the ends. The input has spaces at both ends and runs of several between words (drawn as dots).`,
    items: raw(() => "plain"),
  });
  const split = [...words.keys()];
  frames.push({
    caption: `Split, treating any run of spaces as one separator: ${words.length} words, and every space is gone. Python's s.split() does this with no argument; Java and JavaScript trim, then split on runs of whitespace.`,
    items: [...raw((i) => (inWord(i) ? "plain" : "muted")), ...words.flatMap((w, k) => [box(`w${k}`, cx(w.start), Y_W, w.text, { tone: "accent", w: wordW(w.text), h: WH, size: 13 })])],
  });
  const reversed = [...split].reverse();
  frames.push({
    caption: `Reverse the list of words — the words themselves stay as they are. Splitting, reversing and joining are each one pass: O(n) in all.`,
    items: [...raw((i) => (inWord(i) ? "plain" : "muted")), ...listAt(reversed, Y_W, "accent")],
  });
  const out = reversed.map((k) => words[k].text).join(" ");
  frames.push({
    caption: `Join once with single spaces: "${out}". In Java, Python and JavaScript that one join (or a StringBuilder) is what keeps the build linear; a C++ std::string can simply append.`,
    items: [
      ...raw((i) => (inWord(i) ? "plain" : "muted")),
      ...listAt(reversed, Y_W, "plain"),
      ...[...out].map((c, i) => box(`o${i}`, cx(i), Y_W + 58, c === " " ? "·" : c, { tone: "strong", w: C, h: C + 8, size: 13 })),
    ],
  });
  return finish({ title: "Reversing the words: split, reverse, join", input: `s = "${s}"`, frames });
}

export const FIGURES: Readonly<Record<string, () => Walkthrough>> = {
  "char-codes": charCodes,
  "concat-trap": concatTrap,
  "anagram-count": anagramCount,
  "mirror-pairs": mirrorPairs,
  "reverse-words": reverseWords,
};
