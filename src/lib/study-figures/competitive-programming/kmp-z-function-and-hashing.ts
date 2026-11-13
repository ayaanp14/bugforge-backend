import { bandOver, finish, row, rowLabel, slotX, under, type Item, type Tone, type Walkthrough } from "../../walkthroughs/core.js";
import { label } from "../../lesson-figures/kit.js";

/**
 * KMP, the Z-function and rolling hashes (competitive-programming track,
 * module 12).
 *
 *  - kmp: the prefix function of "abab" built one character at a time, then
 *    KMP run on the lesson's example text "abababcabab". The pattern row
 *    glides to each alignment the real search reaches; its pi values travel
 *    with it. Every match and fallback drawn is one the loop took.
 *  - z-box: the Z algorithm on "aabxaabxcaab", one position per frame, with
 *    the box [l, r) of the rightmost match so far and where each z[i] starts
 *    from (z[i − l], capped at r − i) before any comparison.
 */

const S = 40;
const G = 6;

/* ── KMP ──────────────────────────────────────────────────── */

function prefixFunction(s: string): number[] {
  const pi = new Array<number>(s.length).fill(0);
  for (let i = 1; i < s.length; i++) {
    let j = pi[i - 1]!;
    while (j > 0 && s[i] !== s[j]) j = pi[j - 1]!;
    if (s[i] === s[j]) j++;
    pi[i] = j;
  }
  return pi;
}

function kmp(): Walkthrough {
  const P = "abab";
  const T = "abababcabab";
  const m = P.length;
  const pi = prefixFunction(P);

  // Run the search, keeping the events worth a frame.
  type Ev = { kind: "match"; i: number; at: number; from: number; fresh: boolean } | { kind: "fallback"; i: number; j: number; to: number };
  const events: Ev[] = [];
  const found: number[] = [];
  let j = 0;
  let resumed = 0;
  let fellBack = false;
  for (let i = 0; i < T.length; i++) {
    while (j > 0 && T[i] !== P[j]) {
      events.push({ kind: "fallback", i, j, to: pi[j - 1]! });
      fellBack = true;
      j = pi[j - 1]!;
    }
    if (T[i] === P[j]) j++;
    if (j === m) {
      found.push(i - m + 1);
      events.push({ kind: "match", i, at: i - m + 1, from: resumed, fresh: found.length === 1 || fellBack });
      fellBack = false;
      j = pi[m - 1]!;
      resumed = j;
    }
  }
  const expected: number[] = [];
  for (let s = 0; s + m <= T.length; s++) if (T.slice(s, s + m) === P) expected.push(s);
  if (expected.join() !== found.join()) throw new Error(`kmp: ${found.join()} != ${expected.join()}`);

  const PY = 70;
  const pattern = (shift: number, tone: (k: number) => Tone, piShown: number): Item[] => {
    const x = slotX(shift, 0, S, G);
    const items = row("p", [...P], { x, y: PY, tone });
    pi.forEach((v, k) => items.push(label(`pi${k}`, k < piShown ? String(v) : "·", x + slotX(k, 0, S, G) + S / 2, PY + S + 14, { tone: k < piShown ? "accent" : "faint", size: 12, mono: true, weight: 600 })));
    items.push(rowLabel("pl", "pattern", x - 10, PY));
    items.push({ k: "text", id: "pil", x: x - 10, y: PY + S + 14, text: "pi", tone: "soft", anchor: "end", size: 12 });
    return items;
  };
  const text = (tone: (i: number) => Tone): Item[] => [rowLabel("tl", "text", -10, 0), ...row("t", [...T], { index: true, tone })];

  const frames = [
    {
      caption: `pi[i] is the length of the longest proper prefix of the pattern that is also a suffix of its first i + 1 characters. pi[0] is always 0; pi[1] = ${pi[1]}, since "ab" has no border.`,
      items: pattern(0, (k) => (k <= 1 ? "accent" : "plain"), 2),
    },
    {
      caption: `"aba": "ab" had no border, so the new a is compared with the first character. They match: pi[2] = ${pi[2]}.`,
      items: pattern(0, (k) => (k === 0 || k === 2 ? "accent" : "plain"), 3),
    },
    {
      caption: `"abab": the previous border "a" extends by b, so pi[3] = ${pi[3]} — the pattern's longest border is "ab". The table is built in O(m).`,
      items: pattern(0, (k) => (k <= 3 ? "accent" : "plain"), 4),
    },
  ];
  for (const e of events) {
    if (e.kind === "match") {
      frames.push({
        caption: found.indexOf(e.at) === 0
          ? `Scan the text with j = characters matched. At index ${e.i} all ${m} match: an occurrence at index ${e.at}.`
          : e.fresh
          ? `From j = 0 the pattern is matched afresh, one text character at a time: at index ${e.i} all ${m} match, an occurrence at index ${e.at}.`
          : `After the last match j fell back to pi[3] = ${e.from}: the pattern slid by ${m - e.from} and "${P.slice(0, e.from)}" was already matched, so only ${m - e.from} new characters were compared. Another match at index ${e.at}.`,
        items: [...text((i) => (i >= e.at && i <= e.i ? "strong" : found.includes(i) && i < e.at ? "accent" : "plain")), ...pattern(e.at, () => "strong", 4)],
      });
    } else {
      const shift = e.i - e.j;
      frames.push({
        caption: `Index ${e.i}: text ${T[e.i]} ≠ pattern ${P[e.j]} with j = ${e.j}. Instead of restarting, j falls back to pi[${e.j - 1}] = ${e.to}; the text pointer stays at ${e.i}.`,
        items: [...text((i) => (i === e.i ? "error" : i >= shift && i < e.i ? "accent" : "plain")), ...pattern(shift, (k) => (k === e.j ? "error" : k < e.j ? "accent" : "plain"), 4)],
      });
    }
  }
  const last = events[events.length - 1]!;
  if (last.kind === "match") frames[frames.length - 1]!.caption += ` In all: ${found.length} occurrences, at ${found.join(", ")}, in one pass of the text.`;
  return finish({ title: "KMP: build the prefix function, then never move back in the text", input: `pattern = "${P}", text = "${T}"`, frames });
}

/* ── Z-function ───────────────────────────────────────────── */

function zBox(): Walkthrough {
  const s = "aabxaabxcaab";
  const n = s.length;
  const z = new Array<number>(n).fill(0);
  type Step = { i: number; l: number; r: number; start: number; fromBox: boolean; z: number; newBox: boolean };
  const steps: Step[] = [];
  let l = 0;
  let r = 0;
  for (let i = 1; i < n; i++) {
    let v = 0;
    const fromBox = i < r;
    if (fromBox) v = Math.min(r - i, z[i - l]!);
    const start = v;
    const boxL = l;
    const boxR = r;
    while (i + v < n && s[v] === s[i + v]) v++;
    z[i] = v;
    const newBox = v > 0 && i + v > r;
    if (newBox) {
      l = i;
      r = i + v;
    }
    steps.push({ i, l: newBox ? l : boxL, r: newBox ? r : boxR, start, fromBox, z: v, newBox });
  }
  for (let i = 1; i < n; i++) {
    let k = 0;
    while (i + k < n && s[k] === s[i + k]) k++;
    if (k !== z[i]) throw new Error(`z-box: z[${i}] = ${z[i]} != ${k}`);
  }

  const ZY = 78;
  const draw = (st: Step | null): Item[] => {
    const items: Item[] = [];
    if (st && st.r > st.l) {
      items.push(bandOver("box", st.l, st.r - 1));
      items.push(bandOver("copy", 0, st.r - st.l - 1, { tone: "ghost" }));
    }
    items.push(rowLabel("sl", "s", -10, 0), ...row("s", [...s], { index: true, tone: (k) => (st && k >= st.i && k < st.i + st.z ? "strong" : st && k >= st.l && k < st.r ? "accent" : "plain") }));
    items.push(rowLabel("zl", "z", -10, ZY));
    items.push(
      ...row("z", z, {
        y: ZY,
        text: (k) => (k === 0 ? "–" : st && k <= st.i ? String(z[k]) : ""),
        tone: (k) => (st && k === st.i ? "accent" : st && k < st.i ? "plain" : "ghost"),
      }),
    );
    if (st) items.push(under("ip", st.i, "i", { y: ZY }));
    if (st && st.r > st.l) items.push({ k: "text", id: "readout", x: 0, y: ZY + S + 40, text: `box [l, r) = [${st.l}, ${st.r})`, tone: "accent", anchor: "start", size: 13, mono: true, weight: 600 });
    else items.push({ k: "text", id: "readout", x: 0, y: ZY + S + 40, text: "no box yet", tone: "faint", anchor: "start", size: 13, mono: true, weight: 600 });
    return items;
  };

  const frames = [
    {
      caption: `z[i] is how many characters starting at i match the start of s. Comparing from scratch at every i would be O(n²); the box [l, r) of the rightmost match found so far lets most positions start with an answer.`,
      items: draw(null),
    },
    ...steps.map((st) => {
      const head = st.fromBox
        ? `i = ${st.i} is inside the box, which copies s from index 0, so z[${st.i}] starts at min(r − i, z[${st.i - st.l}]) = ${st.start} for free`
        : `i = ${st.i} is not inside the box: compare from scratch`;
      const tail = st.z > st.start ? `; comparing on gives z[${st.i}] = ${st.z}` : `; ${st.start === 0 && !st.fromBox ? `s[${st.i}] = ${s[st.i]} differs from s[0], so z[${st.i}] = 0` : `the next character differs, so z[${st.i}] = ${st.z}`}`;
      const box = st.newBox ? `. The match reaches past the old box: the box becomes [${st.l}, ${st.r}).` : ".";
      return { caption: `${head}${tail}${box}`, items: draw(st) };
    }),
  ];
  return finish({ title: "The Z-function: positions inside the box start from z[i − l]", input: `s = "${s}"`, frames });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  kmp,
  "z-box": zBox,
};
