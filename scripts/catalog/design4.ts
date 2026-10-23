/**
 * Design classes, fourth set — wave 7, batch 38.
 * Real problems only: LeetCode numbered design problems (bitsets, an ATM,
 * allocators, number/food/task/packet systems, LFU, range modules, a
 * skiplist, MK average, movie rental, a rank tracker). Worked examples are
 * phrased for CodeKairo.
 *
 * Every problem here is a class whose methods the judge calls in sequence
 * (src/lib/driver-structures.ts): a case is two lines — the operations, then
 * each one's arguments, the constructor's first — answered by one array with
 * `null` for the constructor and every void method. Each `run` below is the
 * reference: a plain, obviously-correct simulation (usually a linear scan over
 * everything stored) that produces the expected array; the solutions use the
 * structure the problem is about.
 *
 * Where LeetCode's statement has a value that does not fit a signed 32-bit
 * int, every input and every answer still does, and only the solutions'
 * internals are 64-bit (an ATM's stored note counts, MK Average's window
 * sum). LeetCode's parameter name `val` is never used — it is a keyword in
 * Kotlin — so those parameters are called `value`.
 *
 * Per-language notes. The judge's languages without an ordered map or a
 * priority queue (JavaScript, TypeScript, C, Go, Swift, Ruby, PHP's arrays)
 * keep sorted arrays with a hand-written binary search or a small binary
 * heap; C has no hash map either, so it indexes arrays by a bounded value or
 * searches a small table. JavaScript is Node 12 (no ??, ?., at(), flat, no
 * class fields); TypeScript compiles as TS 3.7 to ES5, so it sticks to plain
 * objects and arrays; Rust is 1.40 (`std::i32::MAX`, no matches!, no
 * let-else); Kotlin 1.3 uses java.util collections; Swift 5.2; Go 1.13; PHP
 * runs inside `namespace Solution;`, so SPL classes are written
 * `\SplMinHeap`. The C harness has no math.h or limits.h.
 *
 * Generated sequences stay at 40 operations or fewer (5,000 hidden cases a
 * problem in one judge process); the statements keep the real constraints.
 */
import {
  code, describe, explain, designInput, pick, ri, shuffle, randLower,
  type CatalogProblem, type Rng,
} from "./types.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Args = any[][];
type Run = (ops: string[], args: Args) => unknown[];

/** One statement example: the two input lines, the reference's answer and a note. */
const exampleOf = (run: Run, ops: string[], args: Args, note?: string) =>
  ({ in: designInput(ops, args), out: JSON.stringify(run(ops, args)), note });

/** One judge case from the reference. */
const caseOf = (run: Run, ops: string[], args: Args) =>
  ({ input: designInput(ops, args), expectedOutput: JSON.stringify(run(ops, args)) });

/** A judge's closing words for every design statement. */
const CALLS = "The judge calls the methods in the order listed in the first input line, with the arguments in the second; the expected output holds each call's result, `null` for the constructor and for every method that returns nothing.";

export const DESIGN4_PROBLEMS: CatalogProblem[] = [

  // ── Design Bitset (LC 2166) ───────────────────────────────────────
  (() => {
    const run: Run = (ops, args) => {
      let bits: number[] = [];
      return ops.map((op, i) => {
        const a = args[i];
        switch (op) {
          case "Bitset": bits = new Array(a[0]).fill(0); return null;
          case "fix": bits[a[0]] = 1; return null;
          case "unfix": bits[a[0]] = 0; return null;
          case "flip": bits = bits.map((b) => 1 - b); return null;
          case "all": return bits.every((b) => b === 1);
          case "one": return bits.some((b) => b === 1);
          case "count": return bits.filter((b) => b === 1).length;
          case "toString": return bits.join("");
        }
        return null;
      });
    };
    const ex = [
      { ops: ["Bitset", "fix", "fix", "flip", "all", "unfix", "flip", "one", "unfix", "count", "toString"], args: [[5], [3], [1], [], [], [0], [], [], [0], [], []] },
      { ops: ["Bitset", "one", "flip", "all", "count", "unfix", "toString", "fix", "all"], args: [[2], [], [], [], [], [1], [], [1], []] },
    ];
    return {
      slug: "design-bitset",
      title: "Design Bitset",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "String", "Design", "Amazon", "Google"],
      signature: {
        funcName: "Bitset", params: [{ name: "size", type: "int" as const }], returns: "void" as const,
        methods: [
          { name: "fix", params: [{ name: "idx", type: "int" as const }], returns: "void" as const },
          { name: "unfix", params: [{ name: "idx", type: "int" as const }], returns: "void" as const },
          { name: "flip", params: [], returns: "void" as const },
          { name: "all", params: [], returns: "bool" as const },
          { name: "one", params: [], returns: "bool" as const },
          { name: "count", params: [], returns: "int" as const },
          { name: "toString", params: [], returns: "string" as const },
        ],
      },
      description: describe(
        "A **bitset** stores a fixed number of bits, each `0` or `1`. Write the class `Bitset`:\n\n- `Bitset(int size)` creates `size` bits, all `0`.\n- `void fix(int idx)` sets bit `idx` to `1` (no change if it already is).\n- `void unfix(int idx)` sets bit `idx` to `0` (no change if it already is).\n- `void flip()` inverts every bit: each `0` becomes `1` and each `1` becomes `0`.\n- `boolean all()` returns whether every bit is `1`.\n- `boolean one()` returns whether at least one bit is `1`.\n- `int count()` returns how many bits are `1`.\n- `String toString()` returns the bits as a string of `0`s and `1`s, bit `0` first.\n\n" + CALLS,
        [
          exampleOf(run, ex[0].ops, ex[0].args, "After fixing bits 3 and 1 the bitset is 01010; flip makes it 10101, so not all bits are 1. unfix(0) gives 00101 and flip gives 11010, which has a 1. unfix(0) leaves 01010: two 1s."),
          exampleOf(run, ex[1].ops, ex[1].args, "Two zero bits: none is 1. After flip both are 1, so all() is true. unfix(1) gives 10; fixing bit 1 again makes all() true."),
        ],
        ["1 <= size <= 10^5", "0 <= idx <= size - 1", "At most 10^5 calls are made in total to fix, unfix, flip, all, one, count and toString", "At least one call is made to all, one, count or toString", "At most 5 calls are made to toString"]),
      hints: [
        "Flipping every bit one by one costs O(size) per call, and there can be 10^5 flips. Can a flip be recorded instead of performed?",
        "Keep one `flipped` flag. The real value of bit `i` is `stored[i] XOR flipped`, so `flip()` only toggles the flag.",
        "Also keep the number of 1s. `fix`/`unfix` change it by one only when the bit's real value actually changes, and `flip` turns it into `size - ones`. Then `all`, `one` and `count` are O(1).",
      ],
      editorial: explain({
        idea: "Never touch the whole array on a flip: store the bits as they were last written plus a global `flipped` flag, and keep a running count of 1s. Every operation except `toString` becomes O(1).",
        steps: [
          "Store `stored[0..size-1]` (all 0), `flipped = 0` and `ones = 0`.",
          "`fix(idx)`: if `stored[idx] XOR flipped` is 0, toggle `stored[idx]` and add 1 to `ones`.",
          "`unfix(idx)`: if `stored[idx] XOR flipped` is 1, toggle `stored[idx]` and subtract 1 from `ones`.",
          "`flip()`: toggle `flipped` and set `ones = size - ones`.",
          "`all()` is `ones == size`, `one()` is `ones > 0`, `count()` is `ones`.",
          "`toString()` writes `stored[i] XOR flipped` for every `i`.",
        ],
        why: "The invariant is that bit `i` equals `stored[i] XOR flipped` and that `ones` counts the indices where that is 1. `fix`/`unfix` toggle the stored bit only when the real bit must change, which changes the count by exactly one; `flip` inverts every real bit at once, so the 1s become exactly the former 0s, of which there were `size - ones`.",
        time: "O(1) per operation except toString, which is O(size)",
        space: "O(size)",
        pitfalls: [
          "`fix` on a bit that is already 1 must not change the count — compare the real value, not the stored one.",
          "Build `toString` with a string builder; concatenating characters one at a time is quadratic in some languages.",
        ],
      }),
      examples: ex.map((e) => caseOf(run, e.ops, e.args)),
      gen: (rng: Rng) => {
        const size = pick(rng, [1, 2, ri(rng, 1, 8), ri(rng, 1, 30), 100000]);
        const ops = ["Bitset"], args: Args = [[size]];
        let strs = 0;
        const top = size === 100000 ? 30 : size - 1;
        for (let m = ri(rng, 1, pick(rng, [4, 15, 40])); m > 0; m--) {
          const r = rng();
          if (r < 0.22) { ops.push("fix"); args.push([size === 100000 && rng() < 0.3 ? 99999 : ri(rng, 0, top)]); }
          else if (r < 0.4) { ops.push("unfix"); args.push([ri(rng, 0, top)]); }
          else if (r < 0.55) { ops.push("flip"); args.push([]); }
          else if (r < 0.66) { ops.push("all"); args.push([]); }
          else if (r < 0.77) { ops.push("one"); args.push([]); }
          else if (r < 0.9 || strs >= 5 || size === 100000) { ops.push("count"); args.push([]); }
          else { strs++; ops.push("toString"); args.push([]); }
        }
        return caseOf(run, ops, args);
      },
      solutions: {
        python: code`
          class Bitset:

              def __init__(self, size: int):
                  self.size = size
                  self.stored = [0] * size  # the real bit i is stored[i] ^ flipped
                  self.flipped = 0
                  self.ones = 0

              def fix(self, idx: int) -> None:
                  if self.stored[idx] ^ self.flipped == 0:
                      self.stored[idx] ^= 1
                      self.ones += 1

              def unfix(self, idx: int) -> None:
                  if self.stored[idx] ^ self.flipped == 1:
                      self.stored[idx] ^= 1
                      self.ones -= 1

              def flip(self) -> None:
                  self.flipped ^= 1
                  self.ones = self.size - self.ones

              def all(self) -> bool:
                  return self.ones == self.size

              def one(self) -> bool:
                  return self.ones > 0

              def count(self) -> int:
                  return self.ones

              def toString(self) -> str:
                  f = self.flipped
                  return "".join("1" if b ^ f else "0" for b in self.stored)
        `,
        javascript: code`
          var Bitset = function(size) {
              this.size = size;
              this.stored = new Uint8Array(size); // the real bit i is stored[i] ^ flipped
              this.flipped = 0;
              this.ones = 0;
          };

          Bitset.prototype.fix = function(idx) {
              if ((this.stored[idx] ^ this.flipped) === 0) { this.stored[idx] ^= 1; this.ones++; }
          };

          Bitset.prototype.unfix = function(idx) {
              if ((this.stored[idx] ^ this.flipped) === 1) { this.stored[idx] ^= 1; this.ones--; }
          };

          Bitset.prototype.flip = function() {
              this.flipped ^= 1;
              this.ones = this.size - this.ones;
          };

          Bitset.prototype.all = function() { return this.ones === this.size; };

          Bitset.prototype.one = function() { return this.ones > 0; };

          Bitset.prototype.count = function() { return this.ones; };

          Bitset.prototype.toString = function() {
              var parts = new Array(this.size);
              for (var i = 0; i < this.size; i++) parts[i] = (this.stored[i] ^ this.flipped) ? "1" : "0";
              return parts.join("");
          };
        `,
        typescript: code`
          class Bitset {
              size: number;
              stored: number[]; // the real bit i is stored[i] ^ flipped
              flipped: number;
              ones: number;

              constructor(size: number) {
                  this.size = size;
                  this.stored = [];
                  for (var i = 0; i < size; i++) this.stored.push(0);
                  this.flipped = 0;
                  this.ones = 0;
              }

              fix(idx: number): void {
                  if ((this.stored[idx] ^ this.flipped) === 0) { this.stored[idx] ^= 1; this.ones++; }
              }

              unfix(idx: number): void {
                  if ((this.stored[idx] ^ this.flipped) === 1) { this.stored[idx] ^= 1; this.ones--; }
              }

              flip(): void {
                  this.flipped ^= 1;
                  this.ones = this.size - this.ones;
              }

              all(): boolean { return this.ones === this.size; }

              one(): boolean { return this.ones > 0; }

              count(): number { return this.ones; }

              toString(): string {
                  var parts: string[] = [];
                  for (var i = 0; i < this.size; i++) parts.push((this.stored[i] ^ this.flipped) ? "1" : "0");
                  return parts.join("");
              }
          }
        `,
        java: code`
          class Bitset {
              private boolean[] stored; // the real bit i is stored[i] ^ flipped
              private boolean flipped = false;
              private int size, ones = 0;

              public Bitset(int size) {
                  this.size = size;
                  stored = new boolean[size];
              }

              public void fix(int idx) {
                  if (stored[idx] == flipped) { stored[idx] = !stored[idx]; ones++; }
              }

              public void unfix(int idx) {
                  if (stored[idx] != flipped) { stored[idx] = !stored[idx]; ones--; }
              }

              public void flip() {
                  flipped = !flipped;
                  ones = size - ones;
              }

              public boolean all() { return ones == size; }

              public boolean one() { return ones > 0; }

              public int count() { return ones; }

              public String toString() {
                  StringBuilder sb = new StringBuilder(size);
                  for (int i = 0; i < size; i++) sb.append(stored[i] != flipped ? '1' : '0');
                  return sb.toString();
              }
          }
        `,
        cpp: code`
          class Bitset {
              vector<char> stored; // the real bit i is stored[i] ^ flipped
              int size, ones = 0;
              char flipped = 0;
          public:
              Bitset(int size) : stored(size, 0), size(size) {}

              void fix(int idx) {
                  if ((stored[idx] ^ flipped) == 0) { stored[idx] ^= 1; ones++; }
              }

              void unfix(int idx) {
                  if ((stored[idx] ^ flipped) == 1) { stored[idx] ^= 1; ones--; }
              }

              void flip() {
                  flipped ^= 1;
                  ones = size - ones;
              }

              bool all() { return ones == size; }

              bool one() { return ones > 0; }

              int count() { return ones; }

              string toString() {
                  string s(size, '0');
                  for (int i = 0; i < size; i++) if (stored[i] ^ flipped) s[i] = '1';
                  return s;
              }
          };
        `,
        c: code`
          typedef struct {
              char* stored; /* the real bit i is stored[i] ^ flipped */
              int size, ones;
              char flipped;
          } Bitset;

          Bitset* bitsetCreate(int size) {
              Bitset* b = (Bitset*)malloc(sizeof(Bitset));
              b->stored = (char*)calloc(size, 1);
              b->size = size;
              b->ones = 0;
              b->flipped = 0;
              return b;
          }

          void bitsetFix(Bitset* obj, int idx) {
              if ((obj->stored[idx] ^ obj->flipped) == 0) { obj->stored[idx] ^= 1; obj->ones++; }
          }

          void bitsetUnfix(Bitset* obj, int idx) {
              if ((obj->stored[idx] ^ obj->flipped) == 1) { obj->stored[idx] ^= 1; obj->ones--; }
          }

          void bitsetFlip(Bitset* obj) {
              obj->flipped ^= 1;
              obj->ones = obj->size - obj->ones;
          }

          bool bitsetAll(Bitset* obj) { return obj->ones == obj->size; }

          bool bitsetOne(Bitset* obj) { return obj->ones > 0; }

          int bitsetCount(Bitset* obj) { return obj->ones; }

          char* bitsetToString(Bitset* obj) {
              char* s = (char*)malloc(obj->size + 1);
              for (int i = 0; i < obj->size; i++) s[i] = (obj->stored[i] ^ obj->flipped) ? '1' : '0';
              s[obj->size] = '\0';
              return s;
          }

          void bitsetFree(Bitset* obj) {
              free(obj->stored);
              free(obj);
          }
        `,
        csharp: code`
          public class Bitset {
              private bool[] stored; // the real bit i is stored[i] ^ flipped
              private bool flipped = false;
              private int size, ones = 0;

              public Bitset(int size) {
                  this.size = size;
                  stored = new bool[size];
              }

              public void Fix(int idx) {
                  if (stored[idx] == flipped) { stored[idx] = !stored[idx]; ones++; }
              }

              public void Unfix(int idx) {
                  if (stored[idx] != flipped) { stored[idx] = !stored[idx]; ones--; }
              }

              public void Flip() {
                  flipped = !flipped;
                  ones = size - ones;
              }

              public bool All() { return ones == size; }

              public bool One() { return ones > 0; }

              public int Count() { return ones; }

              public override string ToString() {
                  var sb = new System.Text.StringBuilder(size);
                  for (int i = 0; i < size; i++) sb.Append(stored[i] != flipped ? '1' : '0');
                  return sb.ToString();
              }
          }
        `,
        go: code`
          type Bitset struct {
          	stored  []bool // the real bit i is stored[i] != flipped
          	flipped bool
          	size    int
          	ones    int
          }

          func Constructor(size int) Bitset {
          	return Bitset{stored: make([]bool, size), size: size}
          }

          func (this *Bitset) Fix(idx int) {
          	if this.stored[idx] == this.flipped {
          		this.stored[idx] = !this.stored[idx]
          		this.ones++
          	}
          }

          func (this *Bitset) Unfix(idx int) {
          	if this.stored[idx] != this.flipped {
          		this.stored[idx] = !this.stored[idx]
          		this.ones--
          	}
          }

          func (this *Bitset) Flip() {
          	this.flipped = !this.flipped
          	this.ones = this.size - this.ones
          }

          func (this *Bitset) All() bool { return this.ones == this.size }

          func (this *Bitset) One() bool { return this.ones > 0 }

          func (this *Bitset) Count() int { return this.ones }

          func (this *Bitset) ToString() string {
          	b := make([]byte, this.size)
          	for i := range b {
          		if this.stored[i] != this.flipped {
          			b[i] = '1'
          		} else {
          			b[i] = '0'
          		}
          	}
          	return string(b)
          }
        `,
        kotlin: code`
          class Bitset(size: Int) {
              private val size = size
              private val stored = BooleanArray(size) // the real bit i is stored[i] != flipped
              private var flipped = false
              private var ones = 0

              fun fix(idx: Int) {
                  if (stored[idx] == flipped) { stored[idx] = !stored[idx]; ones++ }
              }

              fun unfix(idx: Int) {
                  if (stored[idx] != flipped) { stored[idx] = !stored[idx]; ones-- }
              }

              fun flip() {
                  flipped = !flipped
                  ones = size - ones
              }

              fun all(): Boolean = ones == size

              fun one(): Boolean = ones > 0

              fun count(): Int = ones

              override fun toString(): String {
                  val sb = StringBuilder(size)
                  for (i in 0 until size) sb.append(if (stored[i] != flipped) '1' else '0')
                  return sb.toString()
              }
          }
        `,
        swift: code`
          class Bitset {
              var stored: [Bool] // the real bit i is stored[i] != flipped
              var flipped = false
              var size: Int
              var ones = 0

              init(_ size: Int) {
                  self.size = size
                  stored = [Bool](repeating: false, count: size)
              }

              func fix(_ idx: Int) {
                  if stored[idx] == flipped { stored[idx] = !stored[idx]; ones += 1 }
              }

              func unfix(_ idx: Int) {
                  if stored[idx] != flipped { stored[idx] = !stored[idx]; ones -= 1 }
              }

              func flip() {
                  flipped = !flipped
                  ones = size - ones
              }

              func all() -> Bool { return ones == size }

              func one() -> Bool { return ones > 0 }

              func count() -> Int { return ones }

              func toString() -> String {
                  var chars = [Character](repeating: "0", count: size)
                  for i in 0..<size where stored[i] != flipped { chars[i] = "1" }
                  return String(chars)
              }
          }
        `,
        rust: code`
          struct Bitset {
              stored: Vec<bool>, // the real bit i is stored[i] != flipped
              flipped: bool,
              size: i32,
              ones: i32,
          }

          impl Bitset {
              fn new(size: i32) -> Self {
                  Bitset { stored: vec![false; size as usize], flipped: false, size, ones: 0 }
              }

              fn fix(&mut self, idx: i32) {
                  let i = idx as usize;
                  if self.stored[i] == self.flipped { self.stored[i] = !self.stored[i]; self.ones += 1; }
              }

              fn unfix(&mut self, idx: i32) {
                  let i = idx as usize;
                  if self.stored[i] != self.flipped { self.stored[i] = !self.stored[i]; self.ones -= 1; }
              }

              fn flip(&mut self) {
                  self.flipped = !self.flipped;
                  self.ones = self.size - self.ones;
              }

              fn all(&mut self) -> bool { self.ones == self.size }

              fn one(&mut self) -> bool { self.ones > 0 }

              fn count(&mut self) -> i32 { self.ones }

              fn toString(&mut self) -> String {
                  let f = self.flipped;
                  self.stored.iter().map(|&b| if b != f { '1' } else { '0' }).collect()
              }
          }
        `,
        php: code`
          class Bitset {
              private $stored; // the real bit i is stored[i] ^ flipped
              private $flipped = 0;
              private $size;
              private $ones = 0;

              function __construct($size) {
                  $this->size = $size;
                  $this->stored = str_repeat("0", $size);
              }

              function fix($idx) {
                  if (((int)$this->stored[$idx] ^ $this->flipped) === 0) {
                      $this->stored[$idx] = $this->stored[$idx] === "0" ? "1" : "0";
                      $this->ones++;
                  }
              }

              function unfix($idx) {
                  if (((int)$this->stored[$idx] ^ $this->flipped) === 1) {
                      $this->stored[$idx] = $this->stored[$idx] === "0" ? "1" : "0";
                      $this->ones--;
                  }
              }

              function flip() {
                  $this->flipped ^= 1;
                  $this->ones = $this->size - $this->ones;
              }

              function all() { return $this->ones === $this->size; }

              function one() { return $this->ones > 0; }

              function count() { return $this->ones; }

              function toString() {
                  return $this->flipped ? strtr($this->stored, "01", "10") : $this->stored;
              }
          }
        `,
        ruby: code`
          class Bitset
            def initialize(size)
              @size = size
              @stored = "0" * size # the real bit i is stored[i] ^ flipped
              @flipped = false
              @ones = 0
            end

            def fix(idx)
              if (@stored[idx] == "1") == @flipped
                @stored[idx] = @stored[idx] == "1" ? "0" : "1"
                @ones += 1
              end
            end

            def unfix(idx)
              if (@stored[idx] == "1") != @flipped
                @stored[idx] = @stored[idx] == "1" ? "0" : "1"
                @ones -= 1
              end
            end

            def flip
              @flipped = !@flipped
              @ones = @size - @ones
            end

            def all
              @ones == @size
            end

            def one
              @ones > 0
            end

            def count
              @ones
            end

            def toString
              @flipped ? @stored.tr("01", "10") : @stored.dup
            end
          end
        `,
      },
    };
  })(),


  // ── Design an ATM Machine (LC 2241) ───────────────────────────────
  (() => {
    const NOTES = [20, 50, 100, 200, 500];
    const run: Run = (ops, args) => {
      const cnt = [0, 0, 0, 0, 0];
      return ops.map((op, i) => {
        if (op === "deposit") { for (let j = 0; j < 5; j++) cnt[j] += args[i][0][j]; return null; }
        if (op === "withdraw") {
          let left = args[i][0];
          const take = [0, 0, 0, 0, 0];
          for (let j = 4; j >= 0; j--) { take[j] = Math.min(cnt[j], Math.floor(left / NOTES[j])); left -= take[j] * NOTES[j]; }
          if (left !== 0) return [-1];
          for (let j = 0; j < 5; j++) cnt[j] -= take[j];
          return take;
        }
        return null;
      });
    };
    const ex = [
      { ops: ["ATM", "deposit", "withdraw", "deposit", "withdraw", "withdraw"], args: [[], [[0, 0, 1, 2, 1]], [600], [[0, 1, 0, 1, 1]], [600], [550]] },
      { ops: ["ATM", "withdraw", "deposit", "withdraw", "withdraw", "deposit", "withdraw"], args: [[], [40], [[5, 0, 0, 0, 0]], [60], [70], [[0, 1, 0, 0, 0]], [70]] },
    ];
    return {
      slug: "design-an-atm-machine",
      title: "Design an ATM Machine",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Greedy", "Design", "Amazon", "Microsoft"],
      signature: {
        funcName: "ATM", params: [], returns: "void" as const,
        methods: [
          { name: "deposit", params: [{ name: "banknotesCount", type: "int[]" as const }], returns: "void" as const },
          { name: "withdraw", params: [{ name: "amount", type: "int" as const }], returns: "int[]" as const },
        ],
      },
      description: describe(
        "An ATM holds banknotes of five values: `20`, `50`, `100`, `200` and `500` dollars, and starts empty.\n\nTo pay out an amount, the machine always uses the **largest notes first**: it takes as many 500s as it can without going over the amount, then as many 200s as it can for what is left, and so on down to the 20s. If that greedy pass does not reach the amount exactly, the withdrawal is **refused** and no notes leave the machine — even if some other choice of notes would have worked.\n\nFor example, with three $200 notes and one $500 note, a request for $600 takes the $500, then cannot make the remaining $100 out of $200s, so it is refused.\n\nWrite the class `ATM`:\n\n- `ATM()` creates an empty machine.\n- `void deposit(int[] banknotesCount)` adds `banknotesCount[i]` notes of the `i`-th value, in the order `[20, 50, 100, 200, 500]`.\n- `int[] withdraw(int amount)` returns how many notes of each value (same order) were paid out, or `[-1]` if the withdrawal is refused.\n\n" + CALLS,
        [
          exampleOf(run, ex[0].ops, ex[0].args, "The first $600 is one $500 and one $100. After the second deposit the machine holds 1×50, 3×200 and 1×500: $600 takes the $500, then no $200 fits into $100 and the $50 leaves $50 that no note covers, so it is refused. $550 is the $500 plus the $50."),
          exampleOf(run, ex[1].ops, ex[1].args, "An empty machine refuses $40. $60 is three $20s, leaving two. $70 needs a $50 the machine does not have yet; after one is deposited it pays 1×20 + 1×50."),
        ],
        ["banknotesCount.length == 5", "0 <= banknotesCount[i] <= 10^9", "1 <= amount <= 10^9", "At most 5000 calls are made in total to deposit and withdraw", "At least one call is made to each of deposit and withdraw", "The machine may hold more than 2^31 - 1 notes of one value, so store the counts in 64-bit integers; every answer fits in 32 bits"]),
      hints: [
        "The order of note values is fixed and the rule is fixed: largest first. Simulate it exactly — do not search for a better combination.",
        "For each value from $500 down to $20 take `min(available, remaining / value)` notes.",
        "Work on a copy of the counts (or just record what you would take) and only subtract from the machine once you know the remainder reached 0.",
      ],
      editorial: explain({
        idea: "The withdrawal rule is a greedy pass that the problem prescribes, so there is nothing to optimise: walk the five values from largest to smallest, take as many of each as fit, and commit the result only if the remainder is exactly zero.",
        steps: [
          "Keep `count[0..4]` (64-bit) for the values `[20, 50, 100, 200, 500]`.",
          "`deposit`: add each `banknotesCount[i]` to `count[i]`.",
          "`withdraw(amount)`: for `i = 4` down to `0`, let `take[i] = min(count[i], amount / value[i])` and subtract `take[i] * value[i]` from `amount`.",
          "If `amount` is not 0 afterwards, return `[-1]` and leave the counts alone.",
          "Otherwise subtract `take` from `count` and return `take`.",
        ],
        why: "Taking `min(count, remaining / value)` notes is exactly \"as many as possible without exceeding the remaining amount\", which is the machine's rule at every value. Because the counts are only changed after the pass succeeds, a refused withdrawal leaves the machine untouched.",
        time: "O(1) per call (five note values)",
        space: "O(1)",
        pitfalls: [
          "Deposits of up to 10^9 notes, 5000 times, overflow a 32-bit count — use 64-bit integers for the stored counts.",
          "Do not subtract while scanning: a refused withdrawal must not change the machine.",
          "A smarter combination does not count: with 3×$200 and 1×$500, $600 is refused even though 3×$200 would pay it.",
        ],
      }),
      examples: ex.map((e) => caseOf(run, e.ops, e.args)),
      gen: (rng: Rng) => {
        const ops = ["ATM"], args: Args = [[]];
        const big = rng() < 0.15;
        const cap = big ? 1000000000 : pick(rng, [2, 4, 10]);
        for (let m = ri(rng, 2, pick(rng, [5, 15, 40])); m > 0; m--) {
          if (rng() < 0.4) {
            ops.push("deposit");
            args.push([NOTES.map(() => (rng() < 0.4 ? 0 : ri(rng, 0, cap)))]);
          } else {
            const r = rng();
            let amount: number;
            if (r < 0.6) {
              amount = 0;
              for (let j = 0; j < 5; j++) amount += NOTES[j] * (rng() < 0.5 ? 0 : ri(rng, 0, big ? 400000 : 3));
              if (amount === 0) amount = pick(rng, NOTES);
            } else if (r < 0.85) amount = 10 * ri(rng, 1, 200);
            else amount = ri(rng, 1, 1000000000);
            ops.push("withdraw"); args.push([Math.min(amount, 1000000000)]);
          }
        }
        if (!ops.includes("deposit")) { ops.splice(1, 0, "deposit"); args.splice(1, 0, [[1, 1, 1, 1, 1]]); }
        if (!ops.includes("withdraw")) { ops.push("withdraw"); args.push([70]); }
        return caseOf(run, ops, args);
      },
      solutions: {
        python: code`
          class ATM:

              def __init__(self):
                  self.notes = [20, 50, 100, 200, 500]
                  self.count = [0] * 5

              def deposit(self, banknotesCount: List[int]) -> None:
                  for i in range(5):
                      self.count[i] += banknotesCount[i]

              def withdraw(self, amount: int) -> List[int]:
                  take = [0] * 5
                  for i in range(4, -1, -1):  # largest notes first
                      take[i] = min(self.count[i], amount // self.notes[i])
                      amount -= take[i] * self.notes[i]
                  if amount != 0:
                      return [-1]  # refused: the machine keeps every note
                  for i in range(5):
                      self.count[i] -= take[i]
                  return take
        `,
        javascript: code`
          var ATM = function() {
              this.notes = [20, 50, 100, 200, 500];
              this.count = [0, 0, 0, 0, 0]; // doubles: exact far beyond 5000 * 10^9
          };

          ATM.prototype.deposit = function(banknotesCount) {
              for (var i = 0; i < 5; i++) this.count[i] += banknotesCount[i];
          };

          ATM.prototype.withdraw = function(amount) {
              var take = [0, 0, 0, 0, 0];
              for (var i = 4; i >= 0; i--) { // largest notes first
                  take[i] = Math.min(this.count[i], Math.floor(amount / this.notes[i]));
                  amount -= take[i] * this.notes[i];
              }
              if (amount !== 0) return [-1]; // refused: the machine keeps every note
              for (var j = 0; j < 5; j++) this.count[j] -= take[j];
              return take;
          };
        `,
        typescript: code`
          class ATM {
              notes: number[];
              count: number[]; // doubles: exact far beyond 5000 * 10^9

              constructor() {
                  this.notes = [20, 50, 100, 200, 500];
                  this.count = [0, 0, 0, 0, 0];
              }

              deposit(banknotesCount: number[]): void {
                  for (var i = 0; i < 5; i++) this.count[i] += banknotesCount[i];
              }

              withdraw(amount: number): number[] {
                  var take = [0, 0, 0, 0, 0];
                  for (var i = 4; i >= 0; i--) { // largest notes first
                      take[i] = Math.min(this.count[i], Math.floor(amount / this.notes[i]));
                      amount -= take[i] * this.notes[i];
                  }
                  if (amount !== 0) return [-1]; // refused: the machine keeps every note
                  for (var j = 0; j < 5; j++) this.count[j] -= take[j];
                  return take;
              }
          }
        `,
        java: code`
          class ATM {
              private static final int[] NOTES = {20, 50, 100, 200, 500};
              private long[] count = new long[5];

              public ATM() {
              }

              public void deposit(int[] banknotesCount) {
                  for (int i = 0; i < 5; i++) count[i] += banknotesCount[i];
              }

              public int[] withdraw(int amount) {
                  int[] take = new int[5];
                  for (int i = 4; i >= 0; i--) { // largest notes first
                      take[i] = (int) Math.min(count[i], amount / NOTES[i]);
                      amount -= take[i] * NOTES[i];
                  }
                  if (amount != 0) return new int[]{-1}; // refused: the machine keeps every note
                  for (int i = 0; i < 5; i++) count[i] -= take[i];
                  return take;
              }
          }
        `,
        cpp: code`
          class ATM {
              const int notes[5] = {20, 50, 100, 200, 500};
              long long count[5] = {0, 0, 0, 0, 0};
          public:
              ATM() {}

              void deposit(vector<int>& banknotesCount) {
                  for (int i = 0; i < 5; i++) count[i] += banknotesCount[i];
              }

              vector<int> withdraw(int amount) {
                  vector<int> take(5, 0);
                  for (int i = 4; i >= 0; i--) { // largest notes first
                      take[i] = (int)min(count[i], (long long)(amount / notes[i]));
                      amount -= take[i] * notes[i];
                  }
                  if (amount != 0) return {-1}; // refused: the machine keeps every note
                  for (int i = 0; i < 5; i++) count[i] -= take[i];
                  return take;
              }
          };
        `,
        c: code`
          typedef struct {
              long long count[5];
          } ATM;

          static const int ATM_NOTES[5] = {20, 50, 100, 200, 500};

          ATM* aTMCreate() {
              return (ATM*)calloc(1, sizeof(ATM));
          }

          void aTMDeposit(ATM* obj, int* banknotesCount, int banknotesCountSize) {
              for (int i = 0; i < 5 && i < banknotesCountSize; i++) obj->count[i] += banknotesCount[i];
          }

          int* aTMWithdraw(ATM* obj, int amount, int* returnSize) {
              int* take = (int*)malloc(5 * sizeof(int));
              for (int i = 4; i >= 0; i--) { /* largest notes first */
                  long long fit = amount / ATM_NOTES[i];
                  take[i] = (int)(obj->count[i] < fit ? obj->count[i] : fit);
                  amount -= take[i] * ATM_NOTES[i];
              }
              if (amount != 0) { /* refused: the machine keeps every note */
                  take[0] = -1;
                  *returnSize = 1;
                  return take;
              }
              for (int i = 0; i < 5; i++) obj->count[i] -= take[i];
              *returnSize = 5;
              return take;
          }

          void aTMFree(ATM* obj) {
              free(obj);
          }
        `,
        csharp: code`
          public class ATM {
              private static readonly int[] Notes = {20, 50, 100, 200, 500};
              private long[] count = new long[5];

              public ATM() {
              }

              public void Deposit(int[] banknotesCount) {
                  for (int i = 0; i < 5; i++) count[i] += banknotesCount[i];
              }

              public int[] Withdraw(int amount) {
                  int[] take = new int[5];
                  for (int i = 4; i >= 0; i--) { // largest notes first
                      take[i] = (int)Math.Min(count[i], amount / Notes[i]);
                      amount -= take[i] * Notes[i];
                  }
                  if (amount != 0) return new int[] { -1 }; // refused: the machine keeps every note
                  for (int i = 0; i < 5; i++) count[i] -= take[i];
                  return take;
              }
          }
        `,
        go: code`
          var atmNotes = [5]int64{20, 50, 100, 200, 500}

          type ATM struct {
          	count [5]int64
          }

          func Constructor() ATM {
          	return ATM{}
          }

          func (this *ATM) Deposit(banknotesCount []int) {
          	for i := 0; i < 5; i++ {
          		this.count[i] += int64(banknotesCount[i])
          	}
          }

          func (this *ATM) Withdraw(amount int) []int {
          	left := int64(amount)
          	take := make([]int, 5)
          	for i := 4; i >= 0; i-- { // largest notes first
          		t := left / atmNotes[i]
          		if this.count[i] < t {
          			t = this.count[i]
          		}
          		take[i] = int(t)
          		left -= t * atmNotes[i]
          	}
          	if left != 0 {
          		return []int{-1} // refused: the machine keeps every note
          	}
          	for i := 0; i < 5; i++ {
          		this.count[i] -= int64(take[i])
          	}
          	return take
          }
        `,
        kotlin: code`
          class ATM() {
              private val notes = intArrayOf(20, 50, 100, 200, 500)
              private val count = LongArray(5)

              fun deposit(banknotesCount: IntArray) {
                  for (i in 0 until 5) count[i] += banknotesCount[i].toLong()
              }

              fun withdraw(amount: Int): IntArray {
                  var left = amount
                  val take = IntArray(5)
                  for (i in 4 downTo 0) { // largest notes first
                      take[i] = minOf(count[i], (left / notes[i]).toLong()).toInt()
                      left -= take[i] * notes[i]
                  }
                  if (left != 0) return intArrayOf(-1) // refused: the machine keeps every note
                  for (i in 0 until 5) count[i] -= take[i].toLong()
                  return take
              }
          }
        `,
        swift: code`
          class ATM {
              let notes = [20, 50, 100, 200, 500]
              var count = [Int](repeating: 0, count: 5) // Int is 64-bit

              init() {}

              func deposit(_ banknotesCount: [Int]) {
                  for i in 0..<5 { count[i] += banknotesCount[i] }
              }

              func withdraw(_ amount: Int) -> [Int] {
                  var left = amount
                  var take = [Int](repeating: 0, count: 5)
                  for i in stride(from: 4, through: 0, by: -1) { // largest notes first
                      take[i] = min(count[i], left / notes[i])
                      left -= take[i] * notes[i]
                  }
                  if left != 0 { return [-1] } // refused: the machine keeps every note
                  for i in 0..<5 { count[i] -= take[i] }
                  return take
              }
          }
        `,
        rust: code`
          const ATM_NOTES: [i64; 5] = [20, 50, 100, 200, 500];

          struct ATM {
              count: [i64; 5],
          }

          impl ATM {
              fn new() -> Self { ATM { count: [0; 5] } }

              fn deposit(&mut self, banknotesCount: Vec<i32>) {
                  for i in 0..5 { self.count[i] += banknotesCount[i] as i64; }
              }

              fn withdraw(&mut self, amount: i32) -> Vec<i32> {
                  let mut left = amount as i64;
                  let mut take = vec![0i64; 5];
                  for i in (0..5).rev() { // largest notes first
                      take[i] = std::cmp::min(self.count[i], left / ATM_NOTES[i]);
                      left -= take[i] * ATM_NOTES[i];
                  }
                  if left != 0 { return vec![-1]; } // refused: the machine keeps every note
                  for i in 0..5 { self.count[i] -= take[i]; }
                  take.into_iter().map(|t| t as i32).collect()
              }
          }
        `,
        php: code`
          class ATM {
              private $notes = [20, 50, 100, 200, 500];
              private $count = [0, 0, 0, 0, 0]; // PHP ints are 64-bit

              function __construct() {
              }

              function deposit($banknotesCount) {
                  for ($i = 0; $i < 5; $i++) $this->count[$i] += $banknotesCount[$i];
              }

              function withdraw($amount) {
                  $take = [0, 0, 0, 0, 0];
                  for ($i = 4; $i >= 0; $i--) { // largest notes first
                      $take[$i] = min($this->count[$i], intdiv($amount, $this->notes[$i]));
                      $amount -= $take[$i] * $this->notes[$i];
                  }
                  if ($amount !== 0) return [-1]; // refused: the machine keeps every note
                  for ($i = 0; $i < 5; $i++) $this->count[$i] -= $take[$i];
                  return $take;
              }
          }
        `,
        ruby: code`
          class ATM
            NOTES = [20, 50, 100, 200, 500]

            def initialize
              @count = [0, 0, 0, 0, 0]
            end

            def deposit(banknotesCount)
              5.times { |i| @count[i] += banknotesCount[i] }
            end

            def withdraw(amount)
              take = [0, 0, 0, 0, 0]
              4.downto(0) do |i| # largest notes first
                take[i] = [@count[i], amount / NOTES[i]].min
                amount -= take[i] * NOTES[i]
              end
              return [-1] if amount != 0 # refused: the machine keeps every note
              5.times { |i| @count[i] -= take[i] }
              take
            end
          end
        `,
      },
    };
  })(),

  // ── Smallest Number in Infinite Set (LC 2336) ─────────────────────
  (() => {
    const run: Run = (ops, args) => {
      const gone = new Set<number>();
      return ops.map((op, i) => {
        if (op === "popSmallest") { let k = 1; while (gone.has(k)) k++; gone.add(k); return k; }
        if (op === "addBack") { gone.delete(args[i][0]); return null; }
        return null;
      });
    };
    const ex = [
      { ops: ["SmallestInfiniteSet", "addBack", "popSmallest", "popSmallest", "popSmallest", "addBack", "popSmallest", "popSmallest", "popSmallest"], args: [[], [2], [], [], [], [1], [], [], []] },
      { ops: ["SmallestInfiniteSet", "popSmallest", "popSmallest", "popSmallest", "addBack", "addBack", "addBack", "popSmallest", "popSmallest", "popSmallest"], args: [[], [], [], [], [3], [1], [3], [], [], []] },
    ];
    return {
      slug: "smallest-number-in-infinite-set",
      title: "Smallest Number in Infinite Set",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "Heap (Priority Queue)", "Ordered Set", "Design", "Amazon", "Google"],
      signature: {
        funcName: "SmallestInfiniteSet", params: [], returns: "void" as const,
        methods: [
          { name: "popSmallest", params: [], returns: "int" as const },
          { name: "addBack", params: [{ name: "num", type: "int" as const }], returns: "void" as const },
        ],
      },
      description: describe(
        "A set starts out holding **every** positive integer: `1, 2, 3, 4, …`. Write the class `SmallestInfiniteSet`:\n\n- `SmallestInfiniteSet()` creates the set with all positive integers in it.\n- `int popSmallest()` removes the smallest number in the set and returns it.\n- `void addBack(int num)` puts `num` back into the set if it is not already there (otherwise nothing happens).\n\n" + CALLS,
        [
          exampleOf(run, ex[0].ops, ex[0].args, "2 is already in the set, so addBack(2) changes nothing. The pops take 1, 2 and 3; 1 comes back and is the next smallest, followed by 4 and 5."),
          exampleOf(run, ex[1].ops, ex[1].args, "After 1, 2 and 3 are taken, 3 and 1 are put back (the second addBack(3) does nothing). The pops return 1, 3, then 4 — 2 is still gone."),
        ],
        ["1 <= num <= 1000", "At most 1000 calls are made in total to popSmallest and addBack"]),
      hints: [
        "Almost all of the set is one unbroken run: every number from some `next` upwards is still there. Track `next` instead of the infinite set.",
        "The only other members are numbers smaller than `next` that were added back. Keep those in a structure that gives you its minimum quickly.",
        "`popSmallest` takes the smallest added-back number if there is one (it is below `next`), otherwise returns `next` and advances it. `addBack(num)` matters only when `num < next` and `num` is not already stored.",
      ],
      editorial: explain({
        idea: "Split the set into two parts: the infinite tail `next, next+1, …` (never touched yet) and a small sorted collection of numbers below `next` that were added back. The minimum is always the smallest added-back number if any exist, else `next`.",
        steps: [
          "Start with `next = 1` and an empty ordered set (or min-heap plus membership set) `back`.",
          "`popSmallest()`: if `back` is non-empty, remove and return its minimum; otherwise return `next` and increase it by one.",
          "`addBack(num)`: if `num < next` and `num` is not in `back`, insert it. A number `>= next` is already in the set.",
        ],
        why: "The invariant is that the set equals `back ∪ {next, next+1, …}` with every element of `back` below `next`. A pop of the tail keeps it (the tail just starts one later); a pop from `back` keeps it; `addBack` inserts only numbers missing from both parts. Since all of `back` lies below `next`, its minimum, when it exists, is the set's minimum.",
        time: "O(log n) per call with a heap or balanced tree (O(n) insertion with a sorted array), n ≤ 1000",
        space: "O(n)",
        pitfalls: [
          "Adding back a number that is still present must not create a duplicate — check `num < next` and membership in `back`.",
          "A plain min-heap without a membership check returns the same number twice after a double addBack.",
        ],
      }),
      examples: ex.map((e) => caseOf(run, e.ops, e.args)),
      gen: (rng: Rng) => {
        const ops = ["SmallestInfiniteSet"], args: Args = [[]];
        const top = pick(rng, [3, 8, 25, 1000]);
        for (let m = ri(rng, 1, pick(rng, [5, 20, 40])); m > 0; m--) {
          if (rng() < 0.55) { ops.push("popSmallest"); args.push([]); }
          else { ops.push("addBack"); args.push([ri(rng, 1, top)]); }
        }
        return caseOf(run, ops, args);
      },
      solutions: {
        python: code`
          import heapq

          class SmallestInfiniteSet:

              def __init__(self):
                  self.next = 1      # every number >= next is in the set
                  self.heap = []     # added-back numbers below next
                  self.inHeap = set()

              def popSmallest(self) -> int:
                  if self.heap:
                      x = heapq.heappop(self.heap)
                      self.inHeap.discard(x)
                      return x
                  self.next += 1
                  return self.next - 1

              def addBack(self, num: int) -> None:
                  if num < self.next and num not in self.inHeap:
                      self.inHeap.add(num)
                      heapq.heappush(self.heap, num)
        `,
        javascript: code`
          var SmallestInfiniteSet = function() {
              this.next = 1;  // every number >= next is in the set
              this.back = []; // added-back numbers below next, sorted ascending
          };

          SmallestInfiniteSet.prototype.popSmallest = function() {
              if (this.back.length > 0) return this.back.shift();
              return this.next++;
          };

          SmallestInfiniteSet.prototype.addBack = function(num) {
              if (num >= this.next) return;
              var lo = 0, hi = this.back.length;
              while (lo < hi) {
                  var mid = (lo + hi) >> 1;
                  if (this.back[mid] < num) lo = mid + 1; else hi = mid;
              }
              if (lo < this.back.length && this.back[lo] === num) return;
              this.back.splice(lo, 0, num);
          };
        `,
        typescript: code`
          class SmallestInfiniteSet {
              next: number;   // every number >= next is in the set
              back: number[]; // added-back numbers below next, sorted ascending

              constructor() {
                  this.next = 1;
                  this.back = [];
              }

              popSmallest(): number {
                  if (this.back.length > 0) return this.back.shift();
                  return this.next++;
              }

              addBack(num: number): void {
                  if (num >= this.next) return;
                  var lo = 0, hi = this.back.length;
                  while (lo < hi) {
                      var mid = (lo + hi) >> 1;
                      if (this.back[mid] < num) lo = mid + 1; else hi = mid;
                  }
                  if (lo < this.back.length && this.back[lo] === num) return;
                  this.back.splice(lo, 0, num);
              }
          }
        `,
        java: code`
          class SmallestInfiniteSet {
              private int next = 1; // every number >= next is in the set
              private TreeSet<Integer> back = new TreeSet<>(); // added-back numbers below next

              public SmallestInfiniteSet() {
              }

              public int popSmallest() {
                  if (!back.isEmpty()) return back.pollFirst();
                  return next++;
              }

              public void addBack(int num) {
                  if (num < next) back.add(num);
              }
          }
        `,
        cpp: code`
          class SmallestInfiniteSet {
              int next = 1;  // every number >= next is in the set
              set<int> back; // added-back numbers below next
          public:
              SmallestInfiniteSet() {}

              int popSmallest() {
                  if (!back.empty()) {
                      int x = *back.begin();
                      back.erase(back.begin());
                      return x;
                  }
                  return next++;
              }

              void addBack(int num) {
                  if (num < next) back.insert(num);
              }
          };
        `,
        c: code`
          typedef struct {
              int next;      /* every number >= next is in the set */
              int back[1001]; /* added-back numbers below next, sorted ascending */
              int head, n;    /* the live part is back[head .. head + n) */
          } SmallestInfiniteSet;

          SmallestInfiniteSet* smallestInfiniteSetCreate() {
              SmallestInfiniteSet* s = (SmallestInfiniteSet*)malloc(sizeof(SmallestInfiniteSet));
              s->next = 1;
              s->head = 0;
              s->n = 0;
              return s;
          }

          int smallestInfiniteSetPopSmallest(SmallestInfiniteSet* obj) {
              if (obj->n > 0) {
                  obj->n--;
                  return obj->back[obj->head++];
              }
              return obj->next++;
          }

          void smallestInfiniteSetAddBack(SmallestInfiniteSet* obj, int num) {
              if (num >= obj->next) return;
              if (obj->n > 0 && obj->head > 0) { /* slide the live part to the front */
                  for (int i = 0; i < obj->n; i++) obj->back[i] = obj->back[obj->head + i];
              }
              obj->head = 0;
              int lo = 0, hi = obj->n;
              while (lo < hi) {
                  int mid = (lo + hi) / 2;
                  if (obj->back[mid] < num) lo = mid + 1; else hi = mid;
              }
              if (lo < obj->n && obj->back[lo] == num) return;
              for (int i = obj->n; i > lo; i--) obj->back[i] = obj->back[i - 1];
              obj->back[lo] = num;
              obj->n++;
          }

          void smallestInfiniteSetFree(SmallestInfiniteSet* obj) {
              free(obj);
          }
        `,
        csharp: code`
          public class SmallestInfiniteSet {
              private int next = 1; // every number >= next is in the set
              private SortedSet<int> back = new SortedSet<int>(); // added-back numbers below next

              public SmallestInfiniteSet() {
              }

              public int PopSmallest() {
                  if (back.Count > 0) {
                      int x = back.Min;
                      back.Remove(x);
                      return x;
                  }
                  return next++;
              }

              public void AddBack(int num) {
                  if (num < next) back.Add(num);
              }
          }
        `,
        go: code`
          type SmallestInfiniteSet struct {
          	next int   // every number >= next is in the set
          	back []int // added-back numbers below next, sorted ascending
          }

          func Constructor() SmallestInfiniteSet {
          	return SmallestInfiniteSet{next: 1}
          }

          func (this *SmallestInfiniteSet) PopSmallest() int {
          	if len(this.back) > 0 {
          		x := this.back[0]
          		this.back = this.back[1:]
          		return x
          	}
          	this.next++
          	return this.next - 1
          }

          func (this *SmallestInfiniteSet) AddBack(num int) {
          	if num >= this.next {
          		return
          	}
          	i := sort.SearchInts(this.back, num)
          	if i < len(this.back) && this.back[i] == num {
          		return
          	}
          	this.back = append(this.back, 0)
          	copy(this.back[i+1:], this.back[i:])
          	this.back[i] = num
          }
        `,
        kotlin: code`
          class SmallestInfiniteSet() {
              private var next = 1 // every number >= next is in the set
              private val back = java.util.TreeSet<Int>() // added-back numbers below next

              fun popSmallest(): Int {
                  if (!back.isEmpty()) return back.pollFirst()!!
                  next++
                  return next - 1
              }

              fun addBack(num: Int) {
                  if (num < next) back.add(num)
              }
          }
        `,
        swift: code`
          class SmallestInfiniteSet {
              var next = 1         // every number >= next is in the set
              var back: [Int] = [] // added-back numbers below next, sorted ascending

              init() {}

              func popSmallest() -> Int {
                  if !back.isEmpty { return back.removeFirst() }
                  next += 1
                  return next - 1
              }

              func addBack(_ num: Int) {
                  if num >= next { return }
                  var lo = 0, hi = back.count
                  while lo < hi {
                      let mid = (lo + hi) / 2
                      if back[mid] < num { lo = mid + 1 } else { hi = mid }
                  }
                  if lo < back.count && back[lo] == num { return }
                  back.insert(num, at: lo)
              }
          }
        `,
        rust: code`
          use std::collections::BTreeSet;

          struct SmallestInfiniteSet {
              next: i32,           // every number >= next is in the set
              back: BTreeSet<i32>, // added-back numbers below next
          }

          impl SmallestInfiniteSet {
              fn new() -> Self { SmallestInfiniteSet { next: 1, back: BTreeSet::new() } }

              fn popSmallest(&mut self) -> i32 {
                  let first = self.back.iter().next().cloned();
                  if let Some(x) = first {
                      self.back.remove(&x);
                      return x;
                  }
                  self.next += 1;
                  self.next - 1
              }

              fn addBack(&mut self, num: i32) {
                  if num < self.next { self.back.insert(num); }
              }
          }
        `,
        php: code`
          class SmallestInfiniteSet {
              private $next = 1;      // every number >= next is in the set
              private $heap;          // added-back numbers below next
              private $inHeap = [];

              function __construct() {
                  $this->heap = new \SplMinHeap();
              }

              function popSmallest() {
                  if (!$this->heap->isEmpty()) {
                      $x = $this->heap->extract();
                      unset($this->inHeap[$x]);
                      return $x;
                  }
                  return $this->next++;
              }

              function addBack($num) {
                  if ($num < $this->next && !isset($this->inHeap[$num])) {
                      $this->inHeap[$num] = true;
                      $this->heap->insert($num);
                  }
              }
          }
        `,
        ruby: code`
          class SmallestInfiniteSet
            def initialize
              @next = 1  # every number >= next is in the set
              @back = [] # added-back numbers below next, sorted ascending
            end

            def popSmallest
              return @back.shift unless @back.empty?
              @next += 1
              @next - 1
            end

            def addBack(num)
              return if num >= @next
              i = @back.bsearch_index { |x| x >= num } || @back.length
              return if i < @back.length && @back[i] == num
              @back.insert(i, num)
            end
          end
        `,
      },
    };
  })(),

  // ── Design a Number Container System (LC 2349) ────────────────────
  (() => {
    const run: Run = (ops, args) => {
      const at = new Map<number, number>();
      return ops.map((op, i) => {
        if (op === "change") { at.set(args[i][0], args[i][1]); return null; }
        if (op === "find") {
          let best = -1;
          for (const [idx, num] of at) if (num === args[i][0] && (best < 0 || idx < best)) best = idx;
          return best;
        }
        return null;
      });
    };
    const ex = [
      { ops: ["NumberContainers", "find", "change", "change", "change", "change", "find", "change", "find"], args: [[], [7], [4, 7], [2, 7], [9, 7], [6, 7], [7], [2, 3], [7]] },
      { ops: ["NumberContainers", "change", "change", "find", "change", "find", "find"], args: [[], [1000000000, 5], [1, 1000000000], [1000000000], [1, 5], [5], [1000000000]] },
    ];
    return {
      slug: "design-a-number-container-system",
      title: "Design a Number Container System",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "Heap (Priority Queue)", "Ordered Set", "Design", "Amazon", "Microsoft"],
      signature: {
        funcName: "NumberContainers", params: [], returns: "void" as const,
        methods: [
          { name: "change", params: [{ name: "index", type: "int" as const }, { name: "number", type: "int" as const }], returns: "void" as const },
          { name: "find", params: [{ name: "number", type: "int" as const }], returns: "int" as const },
        ],
      },
      description: describe(
        "A row of containers is numbered `1, 2, 3, …`; each container is empty or holds one number. Write the class `NumberContainers`:\n\n- `NumberContainers()` creates the row with every container empty.\n- `void change(int index, int number)` puts `number` into container `index`. If that container already held a number, the old one is replaced.\n- `int find(int number)` returns the **smallest** index of a container that currently holds `number`, or `-1` if no container does.\n\n" + CALLS,
        [
          exampleOf(run, ex[0].ops, ex[0].args, "No container holds 7 at first. After 7 is put into containers 4, 2, 9 and 6, the smallest is 2. Replacing container 2's number with 3 leaves 4 as the smallest holding 7."),
          exampleOf(run, ex[1].ops, ex[1].args, "Indices and numbers both go up to 10^9. Container 1 first holds 10^9 and then 5, so afterwards 5 is found at index 1 (smaller than 10^9) and nothing holds 10^9 any more."),
        ],
        ["1 <= index, number <= 10^9", "At most 10^5 calls are made in total to change and find"]),
      hints: [
        "You need two directions: which number each index holds, and which indices hold each number.",
        "For each number keep its indices in a structure that gives the minimum fast — an ordered set, or a min-heap.",
        "When `change` overwrites an index, its old number loses that index. With an ordered set, remove it there; with a heap, leave it and discard heap tops that no longer hold the number when `find` looks (lazy deletion).",
      ],
      editorial: explain({
        idea: "Keep a map `index → number` and, for every number, an ordered set (or lazy min-heap) of the indices holding it. `find` is then the smallest element of one set.",
        steps: [
          "`change(index, number)`: if `index` already held some `old`, remove `index` from `old`'s set. Store `index → number` and add `index` to `number`'s set.",
          "`find(number)`: return the smallest index in `number`'s set, or `-1` if the set is missing or empty.",
          "Lazy variant with a heap: `change` only pushes `index` onto `number`'s heap; `find` pops tops whose current number (from the map) is not `number` until a valid one is on top.",
        ],
        why: "Each set holds exactly the indices whose current number is its key: `change` moves the index out of its old set and into its new one, and nothing else changes which number an index holds. The smallest element of the set is therefore the answer. In the lazy version a stale heap entry is never returned, because `find` checks it against the map before trusting it.",
        time: "O(log n) per call (amortised for the lazy heap)",
        space: "O(n) for n changes",
        pitfalls: [
          "Forgetting to remove the index from its previous number's set makes `find` report a container that has since been overwritten.",
          "Writing the same number into the same container twice must leave it findable — with a set that is automatic; with a lazy heap, duplicates are harmless.",
        ],
      }),
      examples: ex.map((e) => caseOf(run, e.ops, e.args)),
      gen: (rng: Rng) => {
        const ops = ["NumberContainers"], args: Args = [[]];
        const big = rng() < 0.3;
        const idxTop = big ? 1000000000 : pick(rng, [3, 8, 20]);
        const nums = Array.from({ length: ri(rng, 1, 5) }, () => (big && rng() < 0.5 ? ri(rng, 1, 1000000000) : ri(rng, 1, 10)));
        const usedIdx: number[] = [];
        for (let m = ri(rng, 1, pick(rng, [5, 20, 40])); m > 0; m--) {
          if (rng() < 0.55) {
            const index = usedIdx.length && rng() < 0.4 ? pick(rng, usedIdx) : ri(rng, 1, idxTop);
            usedIdx.push(index);
            ops.push("change"); args.push([index, pick(rng, nums)]);
          } else {
            ops.push("find"); args.push([rng() < 0.85 ? pick(rng, nums) : ri(rng, 1, 1000000000)]);
          }
        }
        return caseOf(run, ops, args);
      },
      solutions: {
        python: code`
          import heapq

          class NumberContainers:

              def __init__(self):
                  self.at = {}     # index -> number it holds now
                  self.heaps = {}  # number -> min-heap of indices (may hold stale ones)

              def change(self, index: int, number: int) -> None:
                  self.at[index] = number
                  heapq.heappush(self.heaps.setdefault(number, []), index)

              def find(self, number: int) -> int:
                  h = self.heaps.get(number)
                  while h and self.at[h[0]] != number:
                      heapq.heappop(h)  # that container was overwritten since
                  return h[0] if h else -1
        `,
        javascript: code`
          var NumberContainers = function() {
              this.at = new Map();  // index -> number it holds now
              this.idx = new Map(); // number -> its indices, sorted ascending
          };

          function ncLowerBound(a, x) {
              var lo = 0, hi = a.length;
              while (lo < hi) {
                  var mid = (lo + hi) >> 1;
                  if (a[mid] < x) lo = mid + 1; else hi = mid;
              }
              return lo;
          }

          NumberContainers.prototype.change = function(index, number) {
              if (this.at.has(index)) {
                  var old = this.idx.get(this.at.get(index));
                  old.splice(ncLowerBound(old, index), 1);
              }
              this.at.set(index, number);
              if (!this.idx.has(number)) this.idx.set(number, []);
              var a = this.idx.get(number);
              a.splice(ncLowerBound(a, index), 0, index);
          };

          NumberContainers.prototype.find = function(number) {
              var a = this.idx.get(number);
              return a && a.length > 0 ? a[0] : -1;
          };
        `,
        typescript: code`
          class NumberContainers {
              at: { [index: number]: number };    // index -> number it holds now
              idx: { [number: number]: number[] }; // number -> its indices, sorted ascending

              constructor() {
                  this.at = {};
                  this.idx = {};
              }

              lowerBound(a: number[], x: number): number {
                  var lo = 0, hi = a.length;
                  while (lo < hi) {
                      var mid = (lo + hi) >> 1;
                      if (a[mid] < x) lo = mid + 1; else hi = mid;
                  }
                  return lo;
              }

              change(index: number, number: number): void {
                  if (this.at[index] !== undefined) {
                      var old = this.idx[this.at[index]];
                      old.splice(this.lowerBound(old, index), 1);
                  }
                  this.at[index] = number;
                  if (this.idx[number] === undefined) this.idx[number] = [];
                  var a = this.idx[number];
                  a.splice(this.lowerBound(a, index), 0, index);
              }

              find(number: number): number {
                  var a = this.idx[number];
                  return a !== undefined && a.length > 0 ? a[0] : -1;
              }
          }
        `,
        java: code`
          class NumberContainers {
              private HashMap<Integer, Integer> at = new HashMap<>();           // index -> number
              private HashMap<Integer, TreeSet<Integer>> idx = new HashMap<>(); // number -> indices

              public NumberContainers() {
              }

              public void change(int index, int number) {
                  Integer old = at.put(index, number);
                  if (old != null) idx.get(old).remove(index);
                  idx.computeIfAbsent(number, k -> new TreeSet<>()).add(index);
              }

              public int find(int number) {
                  TreeSet<Integer> s = idx.get(number);
                  return s == null || s.isEmpty() ? -1 : s.first();
              }
          }
        `,
        cpp: code`
          class NumberContainers {
              unordered_map<int, int> at;       // index -> number
              unordered_map<int, set<int>> idx; // number -> indices
          public:
              NumberContainers() {}

              void change(int index, int number) {
                  auto it = at.find(index);
                  if (it != at.end()) idx[it->second].erase(index);
                  at[index] = number;
                  idx[number].insert(index);
              }

              int find(int number) {
                  auto it = idx.find(number);
                  if (it == idx.end() || it->second.empty()) return -1;
                  return *it->second.begin();
              }
          };
        `,
        c: code`
          /* No hash map in C: a table of (index, number) pairs, one row per container
             ever written. Every call is a scan of that table. */
          typedef struct {
              int *index, *number;
              int n, cap;
          } NumberContainers;

          NumberContainers* numberContainersCreate() {
              NumberContainers* c = (NumberContainers*)malloc(sizeof(NumberContainers));
              c->n = 0;
              c->cap = 16;
              c->index = (int*)malloc(c->cap * sizeof(int));
              c->number = (int*)malloc(c->cap * sizeof(int));
              return c;
          }

          void numberContainersChange(NumberContainers* obj, int index, int number) {
              for (int i = 0; i < obj->n; i++)
                  if (obj->index[i] == index) { obj->number[i] = number; return; }
              if (obj->n == obj->cap) {
                  obj->cap *= 2;
                  obj->index = (int*)realloc(obj->index, obj->cap * sizeof(int));
                  obj->number = (int*)realloc(obj->number, obj->cap * sizeof(int));
              }
              obj->index[obj->n] = index;
              obj->number[obj->n] = number;
              obj->n++;
          }

          int numberContainersFind(NumberContainers* obj, int number) {
              int best = -1;
              for (int i = 0; i < obj->n; i++)
                  if (obj->number[i] == number && (best < 0 || obj->index[i] < best)) best = obj->index[i];
              return best;
          }

          void numberContainersFree(NumberContainers* obj) {
              free(obj->index);
              free(obj->number);
              free(obj);
          }
        `,
        csharp: code`
          public class NumberContainers {
              private Dictionary<int, int> at = new Dictionary<int, int>();                 // index -> number
              private Dictionary<int, SortedSet<int>> idx = new Dictionary<int, SortedSet<int>>(); // number -> indices

              public NumberContainers() {
              }

              public void Change(int index, int number) {
                  int old;
                  if (at.TryGetValue(index, out old)) idx[old].Remove(index);
                  at[index] = number;
                  SortedSet<int> s;
                  if (!idx.TryGetValue(number, out s)) { s = new SortedSet<int>(); idx[number] = s; }
                  s.Add(index);
              }

              public int Find(int number) {
                  SortedSet<int> s;
                  if (!idx.TryGetValue(number, out s) || s.Count == 0) return -1;
                  return s.Min;
              }
          }
        `,
        go: code`
          type NumberContainers struct {
          	at  map[int]int   // index -> number
          	idx map[int][]int // number -> indices, sorted ascending
          }

          func Constructor() NumberContainers {
          	return NumberContainers{at: map[int]int{}, idx: map[int][]int{}}
          }

          func (this *NumberContainers) Change(index int, number int) {
          	if old, ok := this.at[index]; ok {
          		a := this.idx[old]
          		i := sort.SearchInts(a, index)
          		this.idx[old] = append(a[:i], a[i+1:]...)
          	}
          	this.at[index] = number
          	a := this.idx[number]
          	i := sort.SearchInts(a, index)
          	a = append(a, 0)
          	copy(a[i+1:], a[i:])
          	a[i] = index
          	this.idx[number] = a
          }

          func (this *NumberContainers) Find(number int) int {
          	a := this.idx[number]
          	if len(a) == 0 {
          		return -1
          	}
          	return a[0]
          }
        `,
        kotlin: code`
          class NumberContainers() {
              private val at = HashMap<Int, Int>()                     // index -> number
              private val idx = HashMap<Int, java.util.TreeSet<Int>>() // number -> indices

              fun change(index: Int, number: Int) {
                  val old = at.put(index, number)
                  if (old != null) idx[old]!!.remove(index)
                  idx.getOrPut(number) { java.util.TreeSet<Int>() }.add(index)
              }

              fun find(number: Int): Int {
                  val s = idx[number]
                  return if (s == null || s.isEmpty()) -1 else s.first()
              }
          }
        `,
        swift: code`
          class NumberContainers {
              var at: [Int: Int] = [:]    // index -> number
              var idx: [Int: [Int]] = [:] // number -> indices, sorted ascending

              init() {}

              func lowerBound(_ a: [Int], _ x: Int) -> Int {
                  var lo = 0, hi = a.count
                  while lo < hi {
                      let mid = (lo + hi) / 2
                      if a[mid] < x { lo = mid + 1 } else { hi = mid }
                  }
                  return lo
              }

              func change(_ index: Int, _ number: Int) {
                  if let old = at[index] {
                      let i = lowerBound(idx[old]!, index)
                      idx[old]!.remove(at: i)
                  }
                  at[index] = number
                  let a = idx[number] ?? []
                  idx[number, default: []].insert(index, at: lowerBound(a, index))
              }

              func find(_ number: Int) -> Int {
                  if let a = idx[number], let first = a.first { return first }
                  return -1
              }
          }
        `,
        rust: code`
          use std::collections::{BTreeSet, HashMap};

          struct NumberContainers {
              at: HashMap<i32, i32>,           // index -> number
              idx: HashMap<i32, BTreeSet<i32>>, // number -> indices
          }

          impl NumberContainers {
              fn new() -> Self { NumberContainers { at: HashMap::new(), idx: HashMap::new() } }

              fn change(&mut self, index: i32, number: i32) {
                  if let Some(old) = self.at.insert(index, number) {
                      if let Some(s) = self.idx.get_mut(&old) { s.remove(&index); }
                  }
                  self.idx.entry(number).or_insert_with(BTreeSet::new).insert(index);
              }

              fn find(&mut self, number: i32) -> i32 {
                  match self.idx.get(&number).and_then(|s| s.iter().next()) {
                      Some(&i) => i,
                      None => -1,
                  }
              }
          }
        `,
        php: code`
          class NumberContainers {
              private $at = [];    // index -> number it holds now
              private $heaps = []; // number -> min-heap of indices (may hold stale ones)

              function __construct() {
              }

              function change($index, $number) {
                  $this->at[$index] = $number;
                  if (!isset($this->heaps[$number])) $this->heaps[$number] = new \SplMinHeap();
                  $this->heaps[$number]->insert($index);
              }

              function find($number) {
                  if (!isset($this->heaps[$number])) return -1;
                  $h = $this->heaps[$number];
                  while (!$h->isEmpty() && $this->at[$h->top()] !== $number) $h->extract(); // overwritten since
                  return $h->isEmpty() ? -1 : $h->top();
              }
          }
        `,
        ruby: code`
          class NumberContainers
            def initialize
              @at = {}  # index -> number
              @idx = {} # number -> indices, sorted ascending
            end

            def change(index, number)
              old = @at[index]
              if old
                a = @idx[old]
                a.delete_at(a.bsearch_index { |x| x >= index })
              end
              @at[index] = number
              a = (@idx[number] ||= [])
              a.insert(a.bsearch_index { |x| x >= index } || a.length, index)
            end

            def find(number)
              a = @idx[number]
              a.nil? || a.empty? ? -1 : a[0]
            end
          end
        `,
      },
    };
  })(),

  // ── Design a Food Rating System (LC 2353) ─────────────────────────
  (() => {
    const run: Run = (ops, args) => {
      let foods: string[] = [], cuisines: string[] = [], ratings: number[] = [];
      return ops.map((op, i) => {
        const a = args[i];
        if (op === "FoodRatings") { foods = a[0].slice(); cuisines = a[1].slice(); ratings = a[2].slice(); return null; }
        if (op === "changeRating") { ratings[foods.indexOf(a[0])] = a[1]; return null; }
        if (op === "highestRated") {
          let best = -1;
          for (let j = 0; j < foods.length; j++) {
            if (cuisines[j] !== a[0]) continue;
            if (best < 0 || ratings[j] > ratings[best] || (ratings[j] === ratings[best] && foods[j] < foods[best])) best = j;
          }
          return foods[best];
        }
        return null;
      });
    };
    const ex = [
      {
        ops: ["FoodRatings", "highestRated", "highestRated", "changeRating", "highestRated", "changeRating", "highestRated", "changeRating", "highestRated"],
        args: [[["dosa", "idli", "biryani", "korma", "vada", "pulao"], ["south", "south", "mughlai", "mughlai", "south", "mughlai"], [8, 8, 10, 7, 6, 9]],
          ["south"], ["mughlai"], ["biryani", 5], ["mughlai"], ["vada", 8], ["south"], ["dosa", 1], ["south"]],
      },
      {
        ops: ["FoodRatings", "highestRated", "changeRating", "highestRated", "changeRating", "highestRated"],
        args: [[["pho"], ["vietnamese"], [100000000]], ["vietnamese"], ["pho", 1], ["vietnamese"], ["pho", 3], ["vietnamese"]],
      },
    ];
    return {
      slug: "design-a-food-rating-system",
      title: "Design a Food Rating System",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "String", "Heap (Priority Queue)", "Ordered Set", "Design", "Amazon", "Bloomberg"],
      signature: {
        funcName: "FoodRatings",
        params: [{ name: "foods", type: "string[]" as const }, { name: "cuisines", type: "string[]" as const }, { name: "ratings", type: "int[]" as const }],
        returns: "void" as const,
        methods: [
          { name: "changeRating", params: [{ name: "food", type: "string" as const }, { name: "newRating", type: "int" as const }], returns: "void" as const },
          { name: "highestRated", params: [{ name: "cuisine", type: "string" as const }], returns: "string" as const },
        ],
      },
      description: describe(
        "A food app lists `n` dishes. Dish `i` is called `foods[i]`, belongs to the cuisine `cuisines[i]` and has the rating `ratings[i]`. Write the class `FoodRatings`:\n\n- `FoodRatings(String[] foods, String[] cuisines, int[] ratings)` stores the `n` dishes.\n- `void changeRating(String food, int newRating)` sets the rating of the dish named `food` to `newRating`.\n- `String highestRated(String cuisine)` returns the name of the dish with the **highest rating** in that cuisine. If several dishes share the highest rating, return the one whose name is **lexicographically smallest**.\n\n" + CALLS,
        [
          exampleOf(run, ex[0].ops, ex[0].args, "dosa and idli tie at 8 in south, and \"dosa\" comes first. Once biryani drops to 5, pulao (9) leads mughlai. vada rising to 8 does not beat dosa (same rating, larger name); after dosa drops to 1, idli leads."),
          exampleOf(run, ex[1].ops, ex[1].args, "With a single dish in the cuisine it is always the answer, whatever its rating."),
        ],
        ["1 <= n <= 2 * 10^4", "n == foods.length == cuisines.length == ratings.length", "1 <= foods[i].length, cuisines[i].length <= 10", "foods[i] and cuisines[i] consist of lowercase English letters", "1 <= ratings[i] <= 10^8", "All the strings in foods are distinct", "food is the name of a dish in foods; cuisine is a cuisine of at least one dish", "1 <= newRating <= 10^8", "At most 2 * 10^4 calls are made in total to changeRating and highestRated"]),
      hints: [
        "Scanning every dish of a cuisine on each query is too slow when one cuisine holds most of the 2 * 10^4 dishes.",
        "Keep, per cuisine, its dishes ordered by (rating descending, name ascending). The answer is then the first element.",
        "A rating change must move the dish inside that order: in an ordered set, remove the old (rating, name) and insert the new one. With a heap, push the new pair and skip tops whose rating is out of date (lazy deletion).",
      ],
      editorial: explain({
        idea: "Map each dish to its cuisine and current rating, and keep each cuisine's dishes in an ordered set keyed by `(-rating, name)`. The highest rated dish is the set's first element; a rating change is a delete and an insert.",
        steps: [
          "Build `cuisineOf[food]`, `rating[food]`, and for every cuisine an ordered set of `(-rating, name)` pairs.",
          "`changeRating(food, r)`: in `cuisineOf[food]`'s set remove `(-rating[food], food)`, set `rating[food] = r`, insert `(-r, food)`.",
          "`highestRated(cuisine)`: return the name of the first pair in that cuisine's set.",
          "Heap alternative: push `(-r, food)` on every change and, when querying, pop tops whose stored rating differs from `rating[food]`.",
        ],
        why: "Sorting by `-rating` first and by name second puts the highest rating first and, among equal ratings, the lexicographically smallest name first — exactly the required tie-break. Each set always holds one up-to-date pair per dish of its cuisine, because a change replaces that dish's pair.",
        time: "O(log n) per call (amortised O(log n) with the lazy heap); O(n log n) to build",
        space: "O(n)",
        pitfalls: [
          "The tie-break is the smaller *name*, not the dish that came first in the input.",
          "If a comparator reads the current rating from a map, remove the dish from the set *before* updating its rating, or the set can no longer find it.",
          "Compare names by character codes (ordinal), not with a locale-aware comparison.",
        ],
      }),
      examples: ex.map((e) => caseOf(run, e.ops, e.args)),
      gen: (rng: Rng) => {
        const n = pick(rng, [1, ri(rng, 1, 5), ri(rng, 2, 14)]);
        const alpha = pick(rng, ["ab", "abc", "abcdefghijklmnopqrstuvwxyz"]);
        const seen = new Set<string>();
        const foods: string[] = [];
        while (foods.length < n) { const f = randLower(rng, 1, pick(rng, [3, 6, 10]), alpha); if (!seen.has(f)) { seen.add(f); foods.push(f); } }
        const pool = Array.from({ length: ri(rng, 1, 4) }, (_, k) => ["thai", "greek", "south", "tex", "nordic", "kerala"][k] + (rng() < 0.3 ? "x" : ""));
        const cuisines = foods.map(() => pick(rng, pool));
        const rTop = pick(rng, [2, 5, 100000000]);
        const ratings = foods.map(() => ri(rng, 1, rTop));
        const present = [...new Set(cuisines)];
        const ops = ["FoodRatings"], args: Args = [[foods, cuisines, ratings]];
        for (let m = ri(rng, 1, pick(rng, [5, 20, 40])); m > 0; m--) {
          if (rng() < 0.5) { ops.push("changeRating"); args.push([pick(rng, foods), ri(rng, 1, rTop)]); }
          else { ops.push("highestRated"); args.push([pick(rng, present)]); }
        }
        return caseOf(run, ops, args);
      },
      solutions: {
        python: code`
          import heapq

          class FoodRatings:

              def __init__(self, foods: List[str], cuisines: List[str], ratings: List[int]):
                  self.cuisineOf = {}
                  self.rating = {}
                  self.heaps = {}  # cuisine -> heap of (-rating, name); stale pairs are skipped later
                  for f, c, r in zip(foods, cuisines, ratings):
                      self.cuisineOf[f] = c
                      self.rating[f] = r
                      self.heaps.setdefault(c, []).append((-r, f))
                  for h in self.heaps.values():
                      heapq.heapify(h)

              def changeRating(self, food: str, newRating: int) -> None:
                  self.rating[food] = newRating
                  heapq.heappush(self.heaps[self.cuisineOf[food]], (-newRating, food))

              def highestRated(self, cuisine: str) -> str:
                  h = self.heaps[cuisine]
                  while -h[0][0] != self.rating[h[0][1]]:
                      heapq.heappop(h)  # that rating has changed since
                  return h[0][1]
        `,
        javascript: code`
          // Each cuisine keeps [rating, name] pairs sorted by rating descending, then name ascending.
          function frBefore(r1, n1, r2, n2) {
              return r1 > r2 || (r1 === r2 && n1 < n2);
          }

          function frPos(list, r, name) { // first position not before (r, name)
              var lo = 0, hi = list.length;
              while (lo < hi) {
                  var mid = (lo + hi) >> 1;
                  if (frBefore(list[mid][0], list[mid][1], r, name)) lo = mid + 1; else hi = mid;
              }
              return lo;
          }

          var FoodRatings = function(foods, cuisines, ratings) {
              this.cuisineOf = new Map();
              this.rating = new Map();
              this.lists = new Map();
              for (var i = 0; i < foods.length; i++) {
                  this.cuisineOf.set(foods[i], cuisines[i]);
                  this.rating.set(foods[i], ratings[i]);
                  if (!this.lists.has(cuisines[i])) this.lists.set(cuisines[i], []);
                  this.lists.get(cuisines[i]).push([ratings[i], foods[i]]);
              }
              this.lists.forEach(function(list) {
                  list.sort(function(a, b) { return frBefore(a[0], a[1], b[0], b[1]) ? -1 : 1; });
              });
          };

          FoodRatings.prototype.changeRating = function(food, newRating) {
              var list = this.lists.get(this.cuisineOf.get(food));
              var old = this.rating.get(food);
              list.splice(frPos(list, old, food), 1);
              list.splice(frPos(list, newRating, food), 0, [newRating, food]);
              this.rating.set(food, newRating);
          };

          FoodRatings.prototype.highestRated = function(cuisine) {
              return this.lists.get(cuisine)[0][1];
          };
        `,
        typescript: code`
          // Each cuisine keeps [rating, name] pairs sorted by rating descending, then name ascending.
          // Keys get a "k" prefix so no name can collide with an Object.prototype member.
          class FoodRatings {
              cuisineOf: { [food: string]: string };
              rating: { [food: string]: number };
              lists: { [cuisine: string]: any[][] };

              constructor(foods: string[], cuisines: string[], ratings: number[]) {
                  this.cuisineOf = {};
                  this.rating = {};
                  this.lists = {};
                  for (var i = 0; i < foods.length; i++) {
                      this.cuisineOf["k" + foods[i]] = cuisines[i];
                      this.rating["k" + foods[i]] = ratings[i];
                      if (this.lists["k" + cuisines[i]] === undefined) this.lists["k" + cuisines[i]] = [];
                      this.lists["k" + cuisines[i]].push([ratings[i], foods[i]]);
                  }
                  var self = this;
                  for (var key in this.lists) {
                      this.lists[key].sort(function(a, b) { return self.before(a[0], a[1], b[0], b[1]) ? -1 : 1; });
                  }
              }

              before(r1: number, n1: string, r2: number, n2: string): boolean {
                  return r1 > r2 || (r1 === r2 && n1 < n2);
              }

              pos(list: any[][], r: number, name: string): number { // first position not before (r, name)
                  var lo = 0, hi = list.length;
                  while (lo < hi) {
                      var mid = (lo + hi) >> 1;
                      if (this.before(list[mid][0], list[mid][1], r, name)) lo = mid + 1; else hi = mid;
                  }
                  return lo;
              }

              changeRating(food: string, newRating: number): void {
                  var list = this.lists["k" + this.cuisineOf["k" + food]];
                  var old = this.rating["k" + food];
                  list.splice(this.pos(list, old, food), 1);
                  list.splice(this.pos(list, newRating, food), 0, [newRating, food]);
                  this.rating["k" + food] = newRating;
              }

              highestRated(cuisine: string): string {
                  return this.lists["k" + cuisine][0][1];
              }
          }
        `,
        java: code`
          class FoodRatings {
              private HashMap<String, String> cuisineOf = new HashMap<>();
              private HashMap<String, Integer> rating = new HashMap<>();
              private HashMap<String, TreeSet<String>> sets = new HashMap<>();
              // Orders dish names by their current rating (high first), then by name.
              private Comparator<String> order = (a, b) -> {
                  int ra = rating.get(a), rb = rating.get(b);
                  return ra != rb ? Integer.compare(rb, ra) : a.compareTo(b);
              };

              public FoodRatings(String[] foods, String[] cuisines, int[] ratings) {
                  for (int i = 0; i < foods.length; i++) {
                      cuisineOf.put(foods[i], cuisines[i]);
                      rating.put(foods[i], ratings[i]);
                      sets.computeIfAbsent(cuisines[i], k -> new TreeSet<>(order)).add(foods[i]);
                  }
              }

              public void changeRating(String food, int newRating) {
                  TreeSet<String> s = sets.get(cuisineOf.get(food));
                  s.remove(food); // while the comparator still sees the old rating
                  rating.put(food, newRating);
                  s.add(food);
              }

              public String highestRated(String cuisine) {
                  return sets.get(cuisine).first();
              }
          }
        `,
        cpp: code`
          class FoodRatings {
              unordered_map<string, string> cuisineOf;
              unordered_map<string, int> rating;
              unordered_map<string, set<pair<int, string>>> sets; // cuisine -> (-rating, name)
          public:
              FoodRatings(vector<string>& foods, vector<string>& cuisines, vector<int>& ratings) {
                  for (size_t i = 0; i < foods.size(); i++) {
                      cuisineOf[foods[i]] = cuisines[i];
                      rating[foods[i]] = ratings[i];
                      sets[cuisines[i]].insert({-ratings[i], foods[i]});
                  }
              }

              void changeRating(string food, int newRating) {
                  auto& s = sets[cuisineOf[food]];
                  s.erase({-rating[food], food});
                  rating[food] = newRating;
                  s.insert({-newRating, food});
              }

              string highestRated(string cuisine) {
                  return sets[cuisine].begin()->second;
              }
          };
        `,
        c: code`
          /* No hash map or ordered set in C: the dishes stay in arrays, a rating change
             finds the dish by name and a query scans the dishes of the cuisine. */
          typedef struct {
              char** foods;
              char** cuisines;
              int* ratings;
              int n;
          } FoodRatings;

          static char* frCopy(const char* s) {
              size_t len = strlen(s);
              char* t = (char*)malloc(len + 1);
              memcpy(t, s, len + 1);
              return t;
          }

          FoodRatings* foodRatingsCreate(char** foods, int foodsSize, char** cuisines, int cuisinesSize, int* ratings, int ratingsSize) {
              FoodRatings* o = (FoodRatings*)malloc(sizeof(FoodRatings));
              o->n = foodsSize;
              o->foods = (char**)malloc(foodsSize * sizeof(char*));
              o->cuisines = (char**)malloc(foodsSize * sizeof(char*));
              o->ratings = (int*)malloc(foodsSize * sizeof(int));
              for (int i = 0; i < foodsSize; i++) {
                  o->foods[i] = frCopy(foods[i]);
                  o->cuisines[i] = frCopy(cuisines[i]);
                  o->ratings[i] = ratings[i];
              }
              return o;
          }

          void foodRatingsChangeRating(FoodRatings* obj, char* food, int newRating) {
              for (int i = 0; i < obj->n; i++)
                  if (strcmp(obj->foods[i], food) == 0) { obj->ratings[i] = newRating; return; }
          }

          char* foodRatingsHighestRated(FoodRatings* obj, char* cuisine) {
              int best = -1;
              for (int i = 0; i < obj->n; i++) {
                  if (strcmp(obj->cuisines[i], cuisine) != 0) continue;
                  if (best < 0 || obj->ratings[i] > obj->ratings[best] ||
                      (obj->ratings[i] == obj->ratings[best] && strcmp(obj->foods[i], obj->foods[best]) < 0)) best = i;
              }
              return obj->foods[best];
          }

          void foodRatingsFree(FoodRatings* obj) {
              for (int i = 0; i < obj->n; i++) { free(obj->foods[i]); free(obj->cuisines[i]); }
              free(obj->foods);
              free(obj->cuisines);
              free(obj->ratings);
              free(obj);
          }
        `,
        csharp: code`
          public class FoodRatings {
              private Dictionary<string, string> cuisineOf = new Dictionary<string, string>();
              private Dictionary<string, int> rating = new Dictionary<string, int>();
              private Dictionary<string, SortedSet<string>> sets = new Dictionary<string, SortedSet<string>>();

              // Orders dish names by their current rating (high first), then by name (ordinal).
              private class Order : IComparer<string> {
                  private Dictionary<string, int> rating;
                  public Order(Dictionary<string, int> rating) { this.rating = rating; }
                  public int Compare(string a, string b) {
                      int ra = rating[a], rb = rating[b];
                      return ra != rb ? rb.CompareTo(ra) : string.CompareOrdinal(a, b);
                  }
              }

              public FoodRatings(string[] foods, string[] cuisines, int[] ratings) {
                  var order = new Order(rating);
                  for (int i = 0; i < foods.Length; i++) {
                      cuisineOf[foods[i]] = cuisines[i];
                      rating[foods[i]] = ratings[i];
                      SortedSet<string> s;
                      if (!sets.TryGetValue(cuisines[i], out s)) { s = new SortedSet<string>(order); sets[cuisines[i]] = s; }
                      s.Add(foods[i]);
                  }
              }

              public void ChangeRating(string food, int newRating) {
                  var s = sets[cuisineOf[food]];
                  s.Remove(food); // while the comparer still sees the old rating
                  rating[food] = newRating;
                  s.Add(food);
              }

              public string HighestRated(string cuisine) {
                  return sets[cuisine].Min;
              }
          }
        `,
        go: code`
          type frDish struct {
          	rating int
          	name   string
          }

          // before reports whether a sorts ahead of b: higher rating first, then smaller name.
          func frBefore(a, b frDish) bool {
          	return a.rating > b.rating || (a.rating == b.rating && a.name < b.name)
          }

          type FoodRatings struct {
          	cuisineOf map[string]string
          	rating    map[string]int
          	lists     map[string][]frDish // each sorted by frBefore
          }

          func Constructor(foods []string, cuisines []string, ratings []int) FoodRatings {
          	fr := FoodRatings{cuisineOf: map[string]string{}, rating: map[string]int{}, lists: map[string][]frDish{}}
          	for i, f := range foods {
          		fr.cuisineOf[f] = cuisines[i]
          		fr.rating[f] = ratings[i]
          		fr.lists[cuisines[i]] = append(fr.lists[cuisines[i]], frDish{ratings[i], f})
          	}
          	for _, l := range fr.lists {
          		list := l
          		sort.Slice(list, func(i, j int) bool { return frBefore(list[i], list[j]) })
          	}
          	return fr
          }

          func (this *FoodRatings) ChangeRating(food string, newRating int) {
          	c := this.cuisineOf[food]
          	list := this.lists[c]
          	old := frDish{this.rating[food], food}
          	i := sort.Search(len(list), func(k int) bool { return !frBefore(list[k], old) })
          	list = append(list[:i], list[i+1:]...)
          	nw := frDish{newRating, food}
          	j := sort.Search(len(list), func(k int) bool { return !frBefore(list[k], nw) })
          	list = append(list, frDish{})
          	copy(list[j+1:], list[j:])
          	list[j] = nw
          	this.lists[c] = list
          	this.rating[food] = newRating
          }

          func (this *FoodRatings) HighestRated(cuisine string) string {
          	return this.lists[cuisine][0].name
          }
        `,
        kotlin: code`
          class FoodRatings(foods: Array<String>, cuisines: Array<String>, ratings: IntArray) {
              private val cuisineOf = HashMap<String, String>()
              private val rating = HashMap<String, Int>()
              private val sets = HashMap<String, java.util.TreeSet<String>>()
              // Orders dish names by their current rating (high first), then by name.
              private val order = Comparator<String> { a, b ->
                  val ra = rating[a]!!
                  val rb = rating[b]!!
                  if (ra != rb) rb.compareTo(ra) else a.compareTo(b)
              }

              init {
                  for (i in foods.indices) {
                      cuisineOf[foods[i]] = cuisines[i]
                      rating[foods[i]] = ratings[i]
                      sets.getOrPut(cuisines[i]) { java.util.TreeSet<String>(order) }.add(foods[i])
                  }
              }

              fun changeRating(food: String, newRating: Int) {
                  val s = sets[cuisineOf[food]!!]!!
                  s.remove(food) // while the comparator still sees the old rating
                  rating[food] = newRating
                  s.add(food)
              }

              fun highestRated(cuisine: String): String = sets[cuisine]!!.first()
          }
        `,
        swift: code`
          class FoodRatings {
              var cuisineOf: [String: String] = [:]
              var rating: [String: Int] = [:]
              var lists: [String: [(Int, String)]] = [:] // (-rating, name), sorted ascending

              init(_ foods: [String], _ cuisines: [String], _ ratings: [Int]) {
                  for i in 0..<foods.count {
                      cuisineOf[foods[i]] = cuisines[i]
                      rating[foods[i]] = ratings[i]
                      lists[cuisines[i], default: []].append((-ratings[i], foods[i]))
                  }
                  for key in Array(lists.keys) { lists[key]!.sort { $0 < $1 } }
              }

              func pos(_ list: [(Int, String)], _ key: (Int, String)) -> Int { // first entry not below key
                  var lo = 0, hi = list.count
                  while lo < hi {
                      let mid = (lo + hi) / 2
                      if list[mid] < key { lo = mid + 1 } else { hi = mid }
                  }
                  return lo
              }

              func changeRating(_ food: String, _ newRating: Int) {
                  let c = cuisineOf[food]!
                  var list = lists[c]!
                  list.remove(at: pos(list, (-rating[food]!, food)))
                  list.insert((-newRating, food), at: pos(list, (-newRating, food)))
                  lists[c] = list
                  rating[food] = newRating
              }

              func highestRated(_ cuisine: String) -> String {
                  return lists[cuisine]![0].1
              }
          }
        `,
        rust: code`
          use std::collections::{BTreeSet, HashMap};

          struct FoodRatings {
              cuisine_of: HashMap<String, String>,
              rating: HashMap<String, i32>,
              sets: HashMap<String, BTreeSet<(i32, String)>>, // cuisine -> (-rating, name)
          }

          impl FoodRatings {
              fn new(foods: Vec<String>, cuisines: Vec<String>, ratings: Vec<i32>) -> Self {
                  let mut fr = FoodRatings { cuisine_of: HashMap::new(), rating: HashMap::new(), sets: HashMap::new() };
                  for i in 0..foods.len() {
                      fr.cuisine_of.insert(foods[i].clone(), cuisines[i].clone());
                      fr.rating.insert(foods[i].clone(), ratings[i]);
                      fr.sets.entry(cuisines[i].clone()).or_insert_with(BTreeSet::new).insert((-ratings[i], foods[i].clone()));
                  }
                  fr
              }

              fn changeRating(&mut self, food: String, newRating: i32) {
                  let c = self.cuisine_of[&food].clone();
                  let old = self.rating[&food];
                  let s = self.sets.get_mut(&c).unwrap();
                  s.remove(&(-old, food.clone()));
                  s.insert((-newRating, food.clone()));
                  self.rating.insert(food, newRating);
              }

              fn highestRated(&mut self, cuisine: String) -> String {
                  self.sets[&cuisine].iter().next().unwrap().1.clone()
              }
          }
        `,
        php: code`
          // Top of the heap: the highest rating, then the smallest name.
          class FoodHeap extends \SplHeap {
              protected function compare($a, $b) {
                  if ($a[0] !== $b[0]) return $a[0] - $b[0];
                  return strcmp($b[1], $a[1]);
              }
          }

          class FoodRatings {
              private $cuisineOf = [];
              private $rating = [];
              private $heaps = []; // cuisine -> heap of [rating, name]; stale pairs are skipped later

              function __construct($foods, $cuisines, $ratings) {
                  foreach ($foods as $i => $f) {
                      $this->cuisineOf[$f] = $cuisines[$i];
                      $this->rating[$f] = $ratings[$i];
                      if (!isset($this->heaps[$cuisines[$i]])) $this->heaps[$cuisines[$i]] = new FoodHeap();
                      $this->heaps[$cuisines[$i]]->insert([$ratings[$i], $f]);
                  }
              }

              function changeRating($food, $newRating) {
                  $this->rating[$food] = $newRating;
                  $this->heaps[$this->cuisineOf[$food]]->insert([$newRating, $food]);
              }

              function highestRated($cuisine) {
                  $h = $this->heaps[$cuisine];
                  while ($h->top()[0] !== $this->rating[$h->top()[1]]) $h->extract(); // rating changed since
                  return $h->top()[1];
              }
          }
        `,
        ruby: code`
          class FoodRatings
            def initialize(foods, cuisines, ratings)
              @cuisine_of = {}
              @rating = {}
              @lists = Hash.new { |h, k| h[k] = [] } # cuisine -> [-rating, name], sorted ascending
              foods.each_with_index do |f, i|
                @cuisine_of[f] = cuisines[i]
                @rating[f] = ratings[i]
                @lists[cuisines[i]] << [-ratings[i], f]
              end
              @lists.each_value(&:sort!)
            end

            def changeRating(food, newRating)
              list = @lists[@cuisine_of[food]]
              old = [-@rating[food], food]
              list.delete_at(list.bsearch_index { |x| (x <=> old) >= 0 })
              key = [-newRating, food]
              list.insert(list.bsearch_index { |x| (x <=> key) >= 0 } || list.length, key)
              @rating[food] = newRating
            end

            def highestRated(cuisine)
              @lists[cuisine][0][1]
            end
          end
        `,
      },
    };
  })(),

  // ── Longest Uploaded Prefix (LC 2424) ─────────────────────────────
  (() => {
    const run: Run = (ops, args) => {
      const up = new Set<number>();
      return ops.map((op, i) => {
        if (op === "upload") { up.add(args[i][0]); return null; }
        if (op === "longest") { let k = 0; while (up.has(k + 1)) k++; return k; }
        return null;
      });
    };
    const ex = [
      { ops: ["LUPrefix", "upload", "longest", "upload", "longest", "upload", "longest"], args: [[4], [3], [], [1], [], [2], []] },
      { ops: ["LUPrefix", "longest", "upload", "longest"], args: [[1], [], [1], []] },
    ];
    return {
      slug: "longest-uploaded-prefix",
      title: "Longest Uploaded Prefix",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "Binary Search", "Union Find", "Design", "Ordered Set", "Google"],
      signature: {
        funcName: "LUPrefix", params: [{ name: "n", type: "int" as const }], returns: "void" as const,
        methods: [
          { name: "upload", params: [{ name: "video", type: "int" as const }], returns: "void" as const },
          { name: "longest", params: [], returns: "int" as const },
        ],
      },
      description: describe(
        "A stream of `n` videos, numbered `1` to `n`, is being uploaded to a server — in any order. The **longest uploaded prefix** is the largest `i` such that videos `1, 2, …, i` have all been uploaded (`0` if video `1` has not been).\n\nWrite the class `LUPrefix`:\n\n- `LUPrefix(int n)` sets up a stream of `n` videos, none uploaded yet.\n- `void upload(int video)` uploads `video`.\n- `int longest()` returns the length of the longest uploaded prefix.\n\n" + CALLS,
        [
          exampleOf(run, ex[0].ops, ex[0].args, "Video 3 alone gives no prefix (video 1 is missing). After video 1 the prefix is 1; once video 2 arrives, 1, 2 and 3 are all there, so it jumps to 3."),
          exampleOf(run, ex[1].ops, ex[1].args, "With a single video, the prefix is 0 until it is uploaded and 1 afterwards."),
        ],
        ["1 <= video <= n <= 10^5", "All values of video are distinct", "At most 2 * 10^5 calls are made in total to upload and longest", "At least one call is made to longest"]),
      hints: [
        "The answer never goes down: once videos 1..i are all uploaded they stay uploaded.",
        "Keep a pointer `p` to the current prefix length and a boolean per video.",
        "After an upload, advance `p` while video `p + 1` is uploaded. Each video is stepped over at most once in total.",
      ],
      editorial: explain({
        idea: "The prefix length only grows, so it can be maintained by a pointer that walks forward over uploaded videos. Every video is passed by the pointer at most once, so the whole stream costs O(n) in total.",
        steps: [
          "Keep `seen[1..n+1]` (all false) and `prefix = 0`.",
          "`upload(video)`: set `seen[video] = true`, then while `seen[prefix + 1]` is true, increase `prefix`.",
          "`longest()`: return `prefix`.",
        ],
        why: "The invariant is that `prefix` is the largest `i` with videos `1..i` uploaded. An upload can only extend that run, and the loop extends it exactly as far as consecutive uploaded videos reach; video `prefix + 1` is then missing, so the run cannot be longer.",
        time: "O(1) amortised per call — O(n + q) in total",
        space: "O(n)",
        pitfalls: [
          "Size the array `n + 2` (or bound the loop by `n`) so checking video `prefix + 1` after the last video stays in range.",
          "Recomputing the prefix from 1 on every `longest` call is O(n) per call and too slow for 2 * 10^5 calls.",
        ],
      }),
      examples: ex.map((e) => caseOf(run, e.ops, e.args)),
      gen: (rng: Rng) => {
        const n = pick(rng, [1, ri(rng, 1, 6), ri(rng, 1, 30), 100000]);
        const pool = n === 100000 ? shuffle(rng, [1, 2, 3, 4, 5, 6, 100000, 99999, ri(rng, 7, 99998)]) : shuffle(rng, Array.from({ length: n }, (_, k) => k + 1));
        if (n > 3 && rng() < 0.3) pool.sort((a, b) => a - b);
        const ops = ["LUPrefix"], args: Args = [[n]];
        let next = 0;
        for (let m = ri(rng, 1, pick(rng, [5, 20, 40])); m > 0; m--) {
          if (next < pool.length && rng() < 0.6) { ops.push("upload"); args.push([pool[next++]]); }
          else { ops.push("longest"); args.push([]); }
        }
        ops.push("longest"); args.push([]);
        return caseOf(run, ops, args);
      },
      solutions: {
        python: code`
          class LUPrefix:

              def __init__(self, n: int):
                  self.seen = [False] * (n + 2)
                  self.prefix = 0  # videos 1..prefix are all uploaded

              def upload(self, video: int) -> None:
                  self.seen[video] = True
                  while self.seen[self.prefix + 1]:
                      self.prefix += 1

              def longest(self) -> int:
                  return self.prefix
        `,
        javascript: code`
          var LUPrefix = function(n) {
              this.seen = new Uint8Array(n + 2);
              this.prefix = 0; // videos 1..prefix are all uploaded
          };

          LUPrefix.prototype.upload = function(video) {
              this.seen[video] = 1;
              while (this.seen[this.prefix + 1]) this.prefix++;
          };

          LUPrefix.prototype.longest = function() {
              return this.prefix;
          };
        `,
        typescript: code`
          class LUPrefix {
              seen: { [video: number]: boolean }; // only uploaded videos have an entry
              prefix: number; // videos 1..prefix are all uploaded

              constructor(n: number) {
                  this.seen = {};
                  this.prefix = 0;
              }

              upload(video: number): void {
                  this.seen[video] = true;
                  while (this.seen[this.prefix + 1]) this.prefix++;
              }

              longest(): number {
                  return this.prefix;
              }
          }
        `,
        java: code`
          class LUPrefix {
              private boolean[] seen;
              private int prefix = 0; // videos 1..prefix are all uploaded

              public LUPrefix(int n) {
                  seen = new boolean[n + 2];
              }

              public void upload(int video) {
                  seen[video] = true;
                  while (seen[prefix + 1]) prefix++;
              }

              public int longest() {
                  return prefix;
              }
          }
        `,
        cpp: code`
          class LUPrefix {
              vector<char> seen;
              int prefix = 0; // videos 1..prefix are all uploaded
          public:
              LUPrefix(int n) : seen(n + 2, 0) {}

              void upload(int video) {
                  seen[video] = 1;
                  while (seen[prefix + 1]) prefix++;
              }

              int longest() {
                  return prefix;
              }
          };
        `,
        c: code`
          typedef struct {
              char* seen;
              int prefix; /* videos 1..prefix are all uploaded */
          } LUPrefix;

          LUPrefix* lUPrefixCreate(int n) {
              LUPrefix* o = (LUPrefix*)malloc(sizeof(LUPrefix));
              o->seen = (char*)calloc(n + 2, 1);
              o->prefix = 0;
              return o;
          }

          void lUPrefixUpload(LUPrefix* obj, int video) {
              obj->seen[video] = 1;
              while (obj->seen[obj->prefix + 1]) obj->prefix++;
          }

          int lUPrefixLongest(LUPrefix* obj) {
              return obj->prefix;
          }

          void lUPrefixFree(LUPrefix* obj) {
              free(obj->seen);
              free(obj);
          }
        `,
        csharp: code`
          public class LUPrefix {
              private bool[] seen;
              private int prefix = 0; // videos 1..prefix are all uploaded

              public LUPrefix(int n) {
                  seen = new bool[n + 2];
              }

              public void Upload(int video) {
                  seen[video] = true;
                  while (seen[prefix + 1]) prefix++;
              }

              public int Longest() {
                  return prefix;
              }
          }
        `,
        go: code`
          type LUPrefix struct {
          	seen   []bool
          	prefix int // videos 1..prefix are all uploaded
          }

          func Constructor(n int) LUPrefix {
          	return LUPrefix{seen: make([]bool, n+2)}
          }

          func (this *LUPrefix) Upload(video int) {
          	this.seen[video] = true
          	for this.seen[this.prefix+1] {
          		this.prefix++
          	}
          }

          func (this *LUPrefix) Longest() int {
          	return this.prefix
          }
        `,
        kotlin: code`
          class LUPrefix(n: Int) {
              private val seen = BooleanArray(n + 2)
              private var prefix = 0 // videos 1..prefix are all uploaded

              fun upload(video: Int) {
                  seen[video] = true
                  while (seen[prefix + 1]) prefix++
              }

              fun longest(): Int = prefix
          }
        `,
        swift: code`
          class LUPrefix {
              var seen: [Bool]
              var prefix = 0 // videos 1..prefix are all uploaded

              init(_ n: Int) {
                  seen = [Bool](repeating: false, count: n + 2)
              }

              func upload(_ video: Int) {
                  seen[video] = true
                  while seen[prefix + 1] { prefix += 1 }
              }

              func longest() -> Int {
                  return prefix
              }
          }
        `,
        rust: code`
          struct LUPrefix {
              seen: Vec<bool>,
              prefix: usize, // videos 1..prefix are all uploaded
          }

          impl LUPrefix {
              fn new(n: i32) -> Self { LUPrefix { seen: vec![false; n as usize + 2], prefix: 0 } }

              fn upload(&mut self, video: i32) {
                  self.seen[video as usize] = true;
                  while self.seen[self.prefix + 1] { self.prefix += 1; }
              }

              fn longest(&mut self) -> i32 {
                  self.prefix as i32
              }
          }
        `,
        php: code`
          class LUPrefix {
              private $seen = [];
              private $prefix = 0; // videos 1..prefix are all uploaded

              function __construct($n) {
              }

              function upload($video) {
                  $this->seen[$video] = true;
                  while (isset($this->seen[$this->prefix + 1])) $this->prefix++;
              }

              function longest() {
                  return $this->prefix;
              }
          }
        `,
        ruby: code`
          class LUPrefix
            def initialize(n)
              @seen = Array.new(n + 2, false)
              @prefix = 0 # videos 1..prefix are all uploaded
            end

            def upload(video)
              @seen[video] = true
              @prefix += 1 while @seen[@prefix + 1]
            end

            def longest
              @prefix
            end
          end
        `,
      },
    };
  })(),

  // ── Design Memory Allocator (LC 2502) ─────────────────────────────
  (() => {
    const run: Run = (ops, args) => {
      let mem: number[] = [];
      return ops.map((op, i) => {
        const a = args[i];
        if (op === "Allocator") { mem = new Array(a[0]).fill(0); return null; }
        if (op === "allocate") {
          const [size, id] = a;
          for (let s = 0; s + size <= mem.length; s++) {
            let ok = true;
            for (let t = s; t < s + size; t++) if (mem[t] !== 0) { ok = false; break; }
            if (ok) { for (let t = s; t < s + size; t++) mem[t] = id; return s; }
          }
          return -1;
        }
        if (op === "freeMemory") { let c = 0; for (let t = 0; t < mem.length; t++) if (mem[t] === a[0]) { mem[t] = 0; c++; } return c; }
        return null;
      });
    };
    const ex = [
      { ops: ["Allocator", "allocate", "allocate", "allocate", "freeMemory", "allocate", "allocate", "allocate", "freeMemory", "allocate", "freeMemory"], args: [[10], [1, 1], [1, 2], [1, 3], [2], [3, 4], [1, 1], [1, 1], [1], [10, 2], [7]] },
      { ops: ["Allocator", "allocate", "allocate", "freeMemory", "allocate", "allocate"], args: [[5], [5, 9], [1, 3], [9], [2, 4], [4, 4]] },
    ];
    return {
      slug: "design-memory-allocator",
      title: "Design Memory Allocator",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Simulation", "Design", "Amazon"],
      signature: {
        funcName: "Allocator", params: [{ name: "n", type: "int" as const }], returns: "void" as const,
        methods: [
          { name: "allocate", params: [{ name: "size", type: "int" as const }, { name: "mID", type: "int" as const }], returns: "int" as const },
          { name: "freeMemory", params: [{ name: "mID", type: "int" as const }], returns: "int" as const },
        ],
      },
      description: describe(
        "A memory of `n` units is indexed `0` to `n - 1`, all free at the start. Write the class `Allocator`:\n\n- `Allocator(int n)` creates the memory.\n- `int allocate(int size, int mID)` finds the **leftmost** run of `size` consecutive free units, marks them as owned by `mID`, and returns the index of the run's first unit. If no such run exists it returns `-1` and changes nothing.\n- `int freeMemory(int mID)` frees **every** unit owned by `mID` and returns how many units that was.\n\nThe same `mID` may be used by several allocations; all of its units are freed together. An `mID` that owns nothing frees `0` units.\n\n" + CALLS,
        [
          exampleOf(run, ex[0].ops, ex[0].args, "Units 0, 1, 2 go to ids 1, 2, 3. Freeing id 2 opens unit 1, but the three-unit block for id 4 must start at 3. The next two single units for id 1 take 1 and then 6. Freeing id 1 releases units 0, 1 and 6. Ten units are no longer free in a row, and id 7 owns nothing."),
          exampleOf(run, ex[1].ops, ex[1].args, "Id 9 fills the whole memory, so the next request fails. Once it is freed, id 4 gets units 0–1; only units 2–4 are left free, so the request for four more fails."),
        ],
        ["1 <= n, size, mID <= 1000", "At most 1000 calls are made in total to allocate and freeMemory"]),
      hints: [
        "With n and the number of calls both at most 1000, an O(n) scan per call is fast enough.",
        "Store, for each unit, the id that owns it (0 for free).",
        "For `allocate`, walk the units counting the current run of free ones; the moment the run reaches `size`, the block ends here and starts `size - 1` units earlier.",
      ],
      editorial: explain({
        idea: "Keep an array `owner[0..n-1]` (0 = free). Allocation is one left-to-right pass that tracks the length of the current free run; freeing is one pass that clears every unit with that id.",
        steps: [
          "`allocate(size, mID)`: let `run = 0`; for each unit `i`, set `run = run + 1` if `owner[i] == 0`, else `run = 0`. When `run == size`, fill `owner[i - size + 1 .. i]` with `mID` and return `i - size + 1`.",
          "If the pass ends without a run of `size`, return `-1`.",
          "`freeMemory(mID)`: clear every unit whose owner is `mID`, counting them, and return the count.",
        ],
        why: "The first index at which a free run reaches length `size` is the end of the leftmost block of `size` free units: any block that starts earlier would have completed its run earlier. Freeing by scanning catches every unit of an id even when it came from several separate allocations.",
        time: "O(n) per call",
        space: "O(n)",
        pitfalls: [
          "Ids are not unique per allocation — free all of an id's units, not just one block.",
          "A failed allocation must not mark any unit.",
        ],
      }),
      examples: ex.map((e) => caseOf(run, e.ops, e.args)),
      gen: (rng: Rng) => {
        const n = pick(rng, [1, ri(rng, 1, 10), ri(rng, 5, 60), 1000]);
        const ids = ri(rng, 1, pick(rng, [2, 5, 1000]));
        const ops = ["Allocator"], args: Args = [[n]];
        for (let m = ri(rng, 1, pick(rng, [5, 20, 40])); m > 0; m--) {
          if (rng() < 0.65) {
            const size = rng() < 0.1 ? ri(rng, 1, 1000) : ri(rng, 1, Math.max(1, Math.ceil(n / pick(rng, [1, 3, 8]))));
            ops.push("allocate"); args.push([size, ri(rng, 1, ids)]);
          } else { ops.push("freeMemory"); args.push([ri(rng, 1, ids)]); }
        }
        return caseOf(run, ops, args);
      },
      solutions: {
        python: code`
          class Allocator:

              def __init__(self, n: int):
                  self.owner = [0] * n  # 0 means free

              def allocate(self, size: int, mID: int) -> int:
                  run = 0
                  for i, o in enumerate(self.owner):
                      run = run + 1 if o == 0 else 0
                      if run == size:
                          start = i - size + 1
                          self.owner[start:i + 1] = [mID] * size
                          return start
                  return -1

              def freeMemory(self, mID: int) -> int:
                  freed = 0
                  for i, o in enumerate(self.owner):
                      if o == mID:
                          self.owner[i] = 0
                          freed += 1
                  return freed
        `,
        javascript: code`
          var Allocator = function(n) {
              this.owner = new Int32Array(n); // 0 means free
          };

          Allocator.prototype.allocate = function(size, mID) {
              var run = 0;
              for (var i = 0; i < this.owner.length; i++) {
                  run = this.owner[i] === 0 ? run + 1 : 0;
                  if (run === size) {
                      for (var j = i - size + 1; j <= i; j++) this.owner[j] = mID;
                      return i - size + 1;
                  }
              }
              return -1;
          };

          Allocator.prototype.freeMemory = function(mID) {
              var freed = 0;
              for (var i = 0; i < this.owner.length; i++) {
                  if (this.owner[i] === mID) { this.owner[i] = 0; freed++; }
              }
              return freed;
          };
        `,
        typescript: code`
          class Allocator {
              owner: number[]; // 0 means free

              constructor(n: number) {
                  this.owner = [];
                  for (var i = 0; i < n; i++) this.owner.push(0);
              }

              allocate(size: number, mID: number): number {
                  var run = 0;
                  for (var i = 0; i < this.owner.length; i++) {
                      run = this.owner[i] === 0 ? run + 1 : 0;
                      if (run === size) {
                          for (var j = i - size + 1; j <= i; j++) this.owner[j] = mID;
                          return i - size + 1;
                      }
                  }
                  return -1;
              }

              freeMemory(mID: number): number {
                  var freed = 0;
                  for (var i = 0; i < this.owner.length; i++) {
                      if (this.owner[i] === mID) { this.owner[i] = 0; freed++; }
                  }
                  return freed;
              }
          }
        `,
        java: code`
          class Allocator {
              private int[] owner; // 0 means free

              public Allocator(int n) {
                  owner = new int[n];
              }

              public int allocate(int size, int mID) {
                  int run = 0;
                  for (int i = 0; i < owner.length; i++) {
                      run = owner[i] == 0 ? run + 1 : 0;
                      if (run == size) {
                          for (int j = i - size + 1; j <= i; j++) owner[j] = mID;
                          return i - size + 1;
                      }
                  }
                  return -1;
              }

              public int freeMemory(int mID) {
                  int freed = 0;
                  for (int i = 0; i < owner.length; i++) {
                      if (owner[i] == mID) { owner[i] = 0; freed++; }
                  }
                  return freed;
              }
          }
        `,
        cpp: code`
          class Allocator {
              vector<int> owner; // 0 means free
          public:
              Allocator(int n) : owner(n, 0) {}

              int allocate(int size, int mID) {
                  int run = 0;
                  for (int i = 0; i < (int)owner.size(); i++) {
                      run = owner[i] == 0 ? run + 1 : 0;
                      if (run == size) {
                          for (int j = i - size + 1; j <= i; j++) owner[j] = mID;
                          return i - size + 1;
                      }
                  }
                  return -1;
              }

              int freeMemory(int mID) {
                  int freed = 0;
                  for (int& o : owner) {
                      if (o == mID) { o = 0; freed++; }
                  }
                  return freed;
              }
          };
        `,
        c: code`
          typedef struct {
              int* owner; /* 0 means free */
              int n;
          } Allocator;

          Allocator* allocatorCreate(int n) {
              Allocator* a = (Allocator*)malloc(sizeof(Allocator));
              a->owner = (int*)calloc(n, sizeof(int));
              a->n = n;
              return a;
          }

          int allocatorAllocate(Allocator* obj, int size, int mID) {
              int run = 0;
              for (int i = 0; i < obj->n; i++) {
                  run = obj->owner[i] == 0 ? run + 1 : 0;
                  if (run == size) {
                      for (int j = i - size + 1; j <= i; j++) obj->owner[j] = mID;
                      return i - size + 1;
                  }
              }
              return -1;
          }

          int allocatorFreeMemory(Allocator* obj, int mID) {
              int freed = 0;
              for (int i = 0; i < obj->n; i++) {
                  if (obj->owner[i] == mID) { obj->owner[i] = 0; freed++; }
              }
              return freed;
          }

          void allocatorFree(Allocator* obj) {
              free(obj->owner);
              free(obj);
          }
        `,
        csharp: code`
          public class Allocator {
              private int[] owner; // 0 means free

              public Allocator(int n) {
                  owner = new int[n];
              }

              public int Allocate(int size, int mID) {
                  int run = 0;
                  for (int i = 0; i < owner.Length; i++) {
                      run = owner[i] == 0 ? run + 1 : 0;
                      if (run == size) {
                          for (int j = i - size + 1; j <= i; j++) owner[j] = mID;
                          return i - size + 1;
                      }
                  }
                  return -1;
              }

              public int FreeMemory(int mID) {
                  int freed = 0;
                  for (int i = 0; i < owner.Length; i++) {
                      if (owner[i] == mID) { owner[i] = 0; freed++; }
                  }
                  return freed;
              }
          }
        `,
        go: code`
          type Allocator struct {
          	owner []int // 0 means free
          }

          func Constructor(n int) Allocator {
          	return Allocator{owner: make([]int, n)}
          }

          func (this *Allocator) Allocate(size int, mID int) int {
          	run := 0
          	for i, o := range this.owner {
          		if o == 0 {
          			run++
          		} else {
          			run = 0
          		}
          		if run == size {
          			for j := i - size + 1; j <= i; j++ {
          				this.owner[j] = mID
          			}
          			return i - size + 1
          		}
          	}
          	return -1
          }

          func (this *Allocator) FreeMemory(mID int) int {
          	freed := 0
          	for i, o := range this.owner {
          		if o == mID {
          			this.owner[i] = 0
          			freed++
          		}
          	}
          	return freed
          }
        `,
        kotlin: code`
          class Allocator(n: Int) {
              private val owner = IntArray(n) // 0 means free

              fun allocate(size: Int, mID: Int): Int {
                  var run = 0
                  for (i in owner.indices) {
                      run = if (owner[i] == 0) run + 1 else 0
                      if (run == size) {
                          for (j in i - size + 1..i) owner[j] = mID
                          return i - size + 1
                      }
                  }
                  return -1
              }

              fun freeMemory(mID: Int): Int {
                  var freed = 0
                  for (i in owner.indices) {
                      if (owner[i] == mID) { owner[i] = 0; freed++ }
                  }
                  return freed
              }
          }
        `,
        swift: code`
          class Allocator {
              var owner: [Int] // 0 means free

              init(_ n: Int) {
                  owner = [Int](repeating: 0, count: n)
              }

              func allocate(_ size: Int, _ mID: Int) -> Int {
                  var run = 0
                  for i in 0..<owner.count {
                      run = owner[i] == 0 ? run + 1 : 0
                      if run == size {
                          for j in (i - size + 1)...i { owner[j] = mID }
                          return i - size + 1
                      }
                  }
                  return -1
              }

              func freeMemory(_ mID: Int) -> Int {
                  var freed = 0
                  for i in 0..<owner.count where owner[i] == mID {
                      owner[i] = 0
                      freed += 1
                  }
                  return freed
              }
          }
        `,
        rust: code`
          struct Allocator {
              owner: Vec<i32>, // 0 means free
          }

          impl Allocator {
              fn new(n: i32) -> Self { Allocator { owner: vec![0; n as usize] } }

              fn allocate(&mut self, size: i32, mID: i32) -> i32 {
                  let size = size as usize;
                  let mut run = 0usize;
                  for i in 0..self.owner.len() {
                      run = if self.owner[i] == 0 { run + 1 } else { 0 };
                      if run == size {
                          for j in i + 1 - size..=i { self.owner[j] = mID; }
                          return (i + 1 - size) as i32;
                      }
                  }
                  -1
              }

              fn freeMemory(&mut self, mID: i32) -> i32 {
                  let mut freed = 0;
                  for o in self.owner.iter_mut() {
                      if *o == mID { *o = 0; freed += 1; }
                  }
                  freed
              }
          }
        `,
        php: code`
          class Allocator {
              private $owner; // 0 means free
              private $n;

              function __construct($n) {
                  $this->n = $n;
                  $this->owner = array_fill(0, $n, 0);
              }

              function allocate($size, $mID) {
                  $run = 0;
                  for ($i = 0; $i < $this->n; $i++) {
                      $run = $this->owner[$i] === 0 ? $run + 1 : 0;
                      if ($run === $size) {
                          for ($j = $i - $size + 1; $j <= $i; $j++) $this->owner[$j] = $mID;
                          return $i - $size + 1;
                      }
                  }
                  return -1;
              }

              function freeMemory($mID) {
                  $freed = 0;
                  for ($i = 0; $i < $this->n; $i++) {
                      if ($this->owner[$i] === $mID) { $this->owner[$i] = 0; $freed++; }
                  }
                  return $freed;
              }
          }
        `,
        ruby: code`
          class Allocator
            def initialize(n)
              @owner = Array.new(n, 0) # 0 means free
            end

            def allocate(size, mID)
              run = 0
              @owner.each_with_index do |o, i|
                run = o == 0 ? run + 1 : 0
                if run == size
                  start = i - size + 1
                  (start..i).each { |j| @owner[j] = mID }
                  return start
                end
              end
              -1
            end

            def freeMemory(mID)
              freed = 0
              @owner.each_index do |i|
                if @owner[i] == mID
                  @owner[i] = 0
                  freed += 1
                end
              end
              freed
            end
          end
        `,
      },
    };
  })(),

  // ── Find Consecutive Integers from a Data Stream (LC 2526) ────────
  (() => {
    const run: Run = (ops, args) => {
      let value = 0, k = 0;
      const seen: number[] = [];
      return ops.map((op, i) => {
        if (op === "DataStream") { value = args[i][0]; k = args[i][1]; return null; }
        if (op === "consec") {
          seen.push(args[i][0]);
          if (seen.length < k) return false;
          for (let t = seen.length - k; t < seen.length; t++) if (seen[t] !== value) return false;
          return true;
        }
        return null;
      });
    };
    const ex = [
      { ops: ["DataStream", "consec", "consec", "consec", "consec", "consec"], args: [[4, 3], [4], [4], [4], [3], [4]] },
      { ops: ["DataStream", "consec", "consec", "consec"], args: [[1000000000, 1], [1000000000], [7], [1000000000]] },
    ];
    return {
      slug: "find-consecutive-integers-from-a-data-stream",
      title: "Find Consecutive Integers from a Data Stream",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "Queue", "Counting", "Design", "Intuit"],
      signature: {
        funcName: "DataStream", params: [{ name: "value", type: "int" as const }, { name: "k", type: "int" as const }], returns: "void" as const,
        methods: [{ name: "consec", params: [{ name: "num", type: "int" as const }], returns: "bool" as const }],
      },
      description: describe(
        "Integers arrive one at a time. After each arrival you must say whether the **last `k`** integers of the stream are all equal to a fixed `value`.\n\nWrite the class `DataStream`:\n\n- `DataStream(int value, int k)` starts an empty stream watching for `k` copies of `value` in a row.\n- `boolean consec(int num)` appends `num` to the stream and returns `true` if the last `k` integers are all equal to `value`. If fewer than `k` integers have arrived so far, it returns `false`.\n\n" + CALLS,
        [
          exampleOf(run, ex[0].ops, ex[0].args, "The first two calls see fewer than 3 integers. The third completes 4, 4, 4. Then 3 arrives, and the last three are 4, 4, 3; after the next 4 they are 4, 3, 4."),
          exampleOf(run, ex[1].ops, ex[1].args, "With k = 1, each answer is just whether the newest integer equals value."),
        ],
        ["1 <= value, num <= 10^9", "1 <= k <= 10^5", "At most 10^5 calls are made to consec"]),
      hints: [
        "Keeping the last k integers and checking them all costs O(k) per call.",
        "Only one thing about the window matters: how long the current run of `value` at the end of the stream is.",
        "Keep a counter: reset it to 0 when `num != value`, otherwise add 1. The answer is `counter >= k`.",
      ],
      editorial: explain({
        idea: "The last `k` integers are all `value` exactly when the stream ends in a run of at least `k` copies of `value`. A single counter of that trailing run answers every call in O(1).",
        steps: [
          "Keep `run = 0`.",
          "`consec(num)`: if `num == value`, increase `run`; otherwise set `run = 0`.",
          "Return `run >= k`.",
        ],
        why: "After each call `run` is the number of consecutive copies of `value` at the end of the stream: a match extends that suffix by one, anything else ends it. The last `k` integers are all `value` if and only if that suffix has length at least `k` (and it cannot when fewer than `k` integers have arrived).",
        time: "O(1) per call",
        space: "O(1)",
        pitfalls: [
          "Return `false` until at least `k` integers have arrived — the counter handles that automatically because it cannot exceed the number of calls.",
          "Do not store the stream: 10^5 calls with k up to 10^5 make a window scan quadratic.",
        ],
      }),
      examples: ex.map((e) => caseOf(run, e.ops, e.args)),
      gen: (rng: Rng) => {
        const value = rng() < 0.2 ? ri(rng, 1, 1000000000) : ri(rng, 1, 3);
        const k = rng() < 0.08 ? 100000 : ri(rng, 1, pick(rng, [2, 5, 12]));
        const ops = ["DataStream"], args: Args = [[value, k]];
        const other = value === 1 ? 2 : value - 1;
        for (let m = ri(rng, 1, pick(rng, [5, 20, 40])); m > 0; m--) {
          const r = rng();
          ops.push("consec"); args.push([r < 0.75 ? value : r < 0.9 ? other : ri(rng, 1, 1000000000)]);
        }
        return caseOf(run, ops, args);
      },
      solutions: {
        python: code`
          class DataStream:

              def __init__(self, value: int, k: int):
                  self.value = value
                  self.k = k
                  self.run = 0  # copies of value at the end of the stream

              def consec(self, num: int) -> bool:
                  self.run = self.run + 1 if num == self.value else 0
                  return self.run >= self.k
        `,
        javascript: code`
          var DataStream = function(value, k) {
              this.value = value;
              this.k = k;
              this.run = 0; // copies of value at the end of the stream
          };

          DataStream.prototype.consec = function(num) {
              this.run = num === this.value ? this.run + 1 : 0;
              return this.run >= this.k;
          };
        `,
        typescript: code`
          class DataStream {
              value: number;
              k: number;
              run: number; // copies of value at the end of the stream

              constructor(value: number, k: number) {
                  this.value = value;
                  this.k = k;
                  this.run = 0;
              }

              consec(num: number): boolean {
                  this.run = num === this.value ? this.run + 1 : 0;
                  return this.run >= this.k;
              }
          }
        `,
        java: code`
          class DataStream {
              private int value, k, run = 0; // run: copies of value at the end of the stream

              public DataStream(int value, int k) {
                  this.value = value;
                  this.k = k;
              }

              public boolean consec(int num) {
                  run = num == value ? run + 1 : 0;
                  return run >= k;
              }
          }
        `,
        cpp: code`
          class DataStream {
              int value, k, run = 0; // run: copies of value at the end of the stream
          public:
              DataStream(int value, int k) : value(value), k(k) {}

              bool consec(int num) {
                  run = num == value ? run + 1 : 0;
                  return run >= k;
              }
          };
        `,
        c: code`
          typedef struct {
              int value, k, run; /* run: copies of value at the end of the stream */
          } DataStream;

          DataStream* dataStreamCreate(int value, int k) {
              DataStream* d = (DataStream*)malloc(sizeof(DataStream));
              d->value = value;
              d->k = k;
              d->run = 0;
              return d;
          }

          bool dataStreamConsec(DataStream* obj, int num) {
              obj->run = num == obj->value ? obj->run + 1 : 0;
              return obj->run >= obj->k;
          }

          void dataStreamFree(DataStream* obj) {
              free(obj);
          }
        `,
        csharp: code`
          public class DataStream {
              private int value, k, run = 0; // run: copies of value at the end of the stream

              public DataStream(int value, int k) {
                  this.value = value;
                  this.k = k;
              }

              public bool Consec(int num) {
                  run = num == value ? run + 1 : 0;
                  return run >= k;
              }
          }
        `,
        go: code`
          type DataStream struct {
          	value, k, run int // run: copies of value at the end of the stream
          }

          func Constructor(value int, k int) DataStream {
          	return DataStream{value: value, k: k}
          }

          func (this *DataStream) Consec(num int) bool {
          	if num == this.value {
          		this.run++
          	} else {
          		this.run = 0
          	}
          	return this.run >= this.k
          }
        `,
        kotlin: code`
          class DataStream(value: Int, k: Int) {
              private val value = value
              private val k = k
              private var run = 0 // copies of value at the end of the stream

              fun consec(num: Int): Boolean {
                  run = if (num == value) run + 1 else 0
                  return run >= k
              }
          }
        `,
        swift: code`
          class DataStream {
              let value: Int
              let k: Int
              var run = 0 // copies of value at the end of the stream

              init(_ value: Int, _ k: Int) {
                  self.value = value
                  self.k = k
              }

              func consec(_ num: Int) -> Bool {
                  run = num == value ? run + 1 : 0
                  return run >= k
              }
          }
        `,
        rust: code`
          struct DataStream {
              value: i32,
              k: i32,
              run: i32, // copies of value at the end of the stream
          }

          impl DataStream {
              fn new(value: i32, k: i32) -> Self { DataStream { value, k, run: 0 } }

              fn consec(&mut self, num: i32) -> bool {
                  self.run = if num == self.value { self.run + 1 } else { 0 };
                  self.run >= self.k
              }
          }
        `,
        php: code`
          class DataStream {
              private $value;
              private $k;
              private $run = 0; // copies of value at the end of the stream

              function __construct($value, $k) {
                  $this->value = $value;
                  $this->k = $k;
              }

              function consec($num) {
                  $this->run = $num === $this->value ? $this->run + 1 : 0;
                  return $this->run >= $this->k;
              }
          }
        `,
        ruby: code`
          class DataStream
            def initialize(value, k)
              @value = value
              @k = k
              @run = 0 # copies of value at the end of the stream
            end

            def consec(num)
              @run = num == @value ? @run + 1 : 0
              @run >= @k
            end
          end
        `,
      },
    };
  })(),

  // ── Frequency Tracker (LC 2671) ───────────────────────────────────
  (() => {
    const run: Run = (ops, args) => {
      const items: number[] = [];
      return ops.map((op, i) => {
        const x = args[i][0];
        if (op === "add") { items.push(x); return null; }
        if (op === "deleteOne") { const j = items.indexOf(x); if (j >= 0) items.splice(j, 1); return null; }
        if (op === "hasFrequency") {
          const c = new Map<number, number>();
          for (const v of items) c.set(v, (c.get(v) || 0) + 1);
          for (const f of c.values()) if (f === x) return true;
          return false;
        }
        return null;
      });
    };
    const ex = [
      { ops: ["FrequencyTracker", "add", "add", "hasFrequency", "add", "hasFrequency", "deleteOne", "hasFrequency"], args: [[], [5], [5], [2], [8], [1], [5], [2]] },
      { ops: ["FrequencyTracker", "deleteOne", "hasFrequency", "add", "deleteOne", "deleteOne", "hasFrequency"], args: [[], [3], [1], [3], [3], [3], [1]] },
    ];
    return {
      slug: "frequency-tracker",
      title: "Frequency Tracker",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "Counting", "Design", "Amazon"],
      signature: {
        funcName: "FrequencyTracker", params: [], returns: "void" as const,
        methods: [
          { name: "add", params: [{ name: "number", type: "int" as const }], returns: "void" as const },
          { name: "deleteOne", params: [{ name: "number", type: "int" as const }], returns: "void" as const },
          { name: "hasFrequency", params: [{ name: "frequency", type: "int" as const }], returns: "bool" as const },
        ],
      },
      description: describe(
        "Keep a collection of numbers (duplicates allowed) and answer questions about how often numbers occur. Write the class `FrequencyTracker`:\n\n- `FrequencyTracker()` starts with an empty collection.\n- `void add(int number)` adds one copy of `number`.\n- `void deleteOne(int number)` removes one copy of `number` if there is one; otherwise nothing happens.\n- `boolean hasFrequency(int frequency)` returns whether some number occurs **exactly** `frequency` times in the collection.\n\n" + CALLS,
        [
          exampleOf(run, ex[0].ops, ex[0].args, "5 occurs twice, so frequency 2 exists. Adding 8 gives a number that occurs once. After one 5 is removed, 5 and 8 both occur once and nothing occurs twice."),
          exampleOf(run, ex[1].ops, ex[1].args, "Deleting a number that is not there does nothing. After 3 is added and removed, no number occurs once; the second removal of 3 is ignored."),
        ],
        ["1 <= number <= 10^5", "1 <= frequency <= 10^5", "At most 2 * 10^5 calls are made in total to add, deleteOne and hasFrequency"]),
      hints: [
        "Counting how often each number occurs is a hash map. But `hasFrequency` asks the reverse question.",
        "Keep a second count: for every frequency `f`, how many distinct numbers currently occur exactly `f` times.",
        "When a number's count changes from `c` to `c + 1` (or `c - 1`), one number leaves frequency `c` and joins the new one — update both tallies.",
      ],
      editorial: explain({
        idea: "Two maps: `count[number]` and `numbersWith[f]` — the number of distinct values whose count is exactly `f`. Every update moves one value from one frequency to a neighbouring one, and `hasFrequency(f)` is `numbersWith[f] > 0`.",
        steps: [
          "`add(x)`: let `c = count[x]`; if `c > 0` decrease `numbersWith[c]`; set `count[x] = c + 1` and increase `numbersWith[c + 1]`.",
          "`deleteOne(x)`: let `c = count[x]`; if `c == 0` do nothing. Otherwise decrease `numbersWith[c]`, set `count[x] = c - 1`, and if `c - 1 > 0` increase `numbersWith[c - 1]`.",
          "`hasFrequency(f)`: return `numbersWith[f] > 0`.",
        ],
        why: "The invariant is that `numbersWith[f]` equals the number of values whose count is `f` (for `f >= 1`). An add or a delete changes exactly one value's count by one, so exactly one value leaves its old frequency and enters the new one, and the two adjustments keep the invariant.",
        time: "O(1) per call",
        space: "O(n) for n distinct numbers",
        pitfalls: [
          "Deleting a number that is absent must not make its count negative or touch `numbersWith`.",
          "Do not record frequency 0 in `numbersWith` — `hasFrequency` is only asked for `f >= 1`, but a stray count there is a sign the bookkeeping is off.",
        ],
      }),
      examples: ex.map((e) => caseOf(run, e.ops, e.args)),
      gen: (rng: Rng) => {
        const top = pick(rng, [2, 4, 10, 100000]);
        const ops = ["FrequencyTracker"], args: Args = [[]];
        for (let m = ri(rng, 1, pick(rng, [5, 20, 40])); m > 0; m--) {
          const r = rng();
          if (r < 0.45) { ops.push("add"); args.push([ri(rng, 1, top)]); }
          else if (r < 0.65) { ops.push("deleteOne"); args.push([ri(rng, 1, top)]); }
          else { ops.push("hasFrequency"); args.push([rng() < 0.05 ? 100000 : ri(rng, 1, pick(rng, [2, 4, 8]))]); }
        }
        return caseOf(run, ops, args);
      },
      solutions: {
        python: code`
          from collections import defaultdict

          class FrequencyTracker:

              def __init__(self):
                  self.count = defaultdict(int)        # number -> how often it occurs
                  self.numbersWith = defaultdict(int)  # f -> how many numbers occur exactly f times

              def add(self, number: int) -> None:
                  c = self.count[number]
                  if c > 0:
                      self.numbersWith[c] -= 1
                  self.count[number] = c + 1
                  self.numbersWith[c + 1] += 1

              def deleteOne(self, number: int) -> None:
                  c = self.count[number]
                  if c == 0:
                      return
                  self.numbersWith[c] -= 1
                  self.count[number] = c - 1
                  if c > 1:
                      self.numbersWith[c - 1] += 1

              def hasFrequency(self, frequency: int) -> bool:
                  return self.numbersWith[frequency] > 0
        `,
        javascript: code`
          var FrequencyTracker = function() {
              this.count = new Map();       // number -> how often it occurs
              this.numbersWith = new Map(); // f -> how many numbers occur exactly f times
          };

          FrequencyTracker.prototype.bump = function(f, d) {
              this.numbersWith.set(f, (this.numbersWith.get(f) || 0) + d);
          };

          FrequencyTracker.prototype.add = function(number) {
              var c = this.count.get(number) || 0;
              if (c > 0) this.bump(c, -1);
              this.count.set(number, c + 1);
              this.bump(c + 1, 1);
          };

          FrequencyTracker.prototype.deleteOne = function(number) {
              var c = this.count.get(number) || 0;
              if (c === 0) return;
              this.bump(c, -1);
              this.count.set(number, c - 1);
              if (c > 1) this.bump(c - 1, 1);
          };

          FrequencyTracker.prototype.hasFrequency = function(frequency) {
              return (this.numbersWith.get(frequency) || 0) > 0;
          };
        `,
        typescript: code`
          class FrequencyTracker {
              count: { [n: number]: number };       // number -> how often it occurs
              numbersWith: { [f: number]: number }; // f -> how many numbers occur exactly f times

              constructor() {
                  this.count = {};
                  this.numbersWith = {};
              }

              bump(f: number, d: number): void {
                  this.numbersWith[f] = (this.numbersWith[f] || 0) + d;
              }

              add(number: number): void {
                  var c = this.count[number] || 0;
                  if (c > 0) this.bump(c, -1);
                  this.count[number] = c + 1;
                  this.bump(c + 1, 1);
              }

              deleteOne(number: number): void {
                  var c = this.count[number] || 0;
                  if (c === 0) return;
                  this.bump(c, -1);
                  this.count[number] = c - 1;
                  if (c > 1) this.bump(c - 1, 1);
              }

              hasFrequency(frequency: number): boolean {
                  return (this.numbersWith[frequency] || 0) > 0;
              }
          }
        `,
        java: code`
          class FrequencyTracker {
              private HashMap<Integer, Integer> count = new HashMap<>();       // number -> occurrences
              private HashMap<Integer, Integer> numbersWith = new HashMap<>(); // f -> numbers occurring f times

              public FrequencyTracker() {
              }

              public void add(int number) {
                  int c = count.getOrDefault(number, 0);
                  if (c > 0) numbersWith.merge(c, -1, Integer::sum);
                  count.put(number, c + 1);
                  numbersWith.merge(c + 1, 1, Integer::sum);
              }

              public void deleteOne(int number) {
                  int c = count.getOrDefault(number, 0);
                  if (c == 0) return;
                  numbersWith.merge(c, -1, Integer::sum);
                  count.put(number, c - 1);
                  if (c > 1) numbersWith.merge(c - 1, 1, Integer::sum);
              }

              public boolean hasFrequency(int frequency) {
                  return numbersWith.getOrDefault(frequency, 0) > 0;
              }
          }
        `,
        cpp: code`
          class FrequencyTracker {
              unordered_map<int, int> count;       // number -> how often it occurs
              unordered_map<int, int> numbersWith; // f -> how many numbers occur exactly f times
          public:
              FrequencyTracker() {}

              void add(int number) {
                  int c = count[number];
                  if (c > 0) numbersWith[c]--;
                  count[number] = c + 1;
                  numbersWith[c + 1]++;
              }

              void deleteOne(int number) {
                  auto it = count.find(number);
                  if (it == count.end() || it->second == 0) return;
                  int c = it->second;
                  numbersWith[c]--;
                  it->second = c - 1;
                  if (c > 1) numbersWith[c - 1]++;
              }

              bool hasFrequency(int frequency) {
                  auto it = numbersWith.find(frequency);
                  return it != numbersWith.end() && it->second > 0;
              }
          };
        `,
        c: code`
          /* Numbers and frequencies are both bounded (10^5 and the 2 * 10^5 calls),
             so plain arrays stand in for the two maps. */
          #define FT_NUM 100001
          #define FT_FREQ 200002

          typedef struct {
              int* count;       /* number -> how often it occurs */
              int* numbersWith; /* f -> how many numbers occur exactly f times */
          } FrequencyTracker;

          FrequencyTracker* frequencyTrackerCreate() {
              FrequencyTracker* t = (FrequencyTracker*)malloc(sizeof(FrequencyTracker));
              t->count = (int*)calloc(FT_NUM, sizeof(int));
              t->numbersWith = (int*)calloc(FT_FREQ, sizeof(int));
              return t;
          }

          void frequencyTrackerAdd(FrequencyTracker* obj, int number) {
              int c = obj->count[number];
              if (c > 0) obj->numbersWith[c]--;
              obj->count[number] = c + 1;
              obj->numbersWith[c + 1]++;
          }

          void frequencyTrackerDeleteOne(FrequencyTracker* obj, int number) {
              int c = obj->count[number];
              if (c == 0) return;
              obj->numbersWith[c]--;
              obj->count[number] = c - 1;
              if (c > 1) obj->numbersWith[c - 1]++;
          }

          bool frequencyTrackerHasFrequency(FrequencyTracker* obj, int frequency) {
              return frequency < FT_FREQ && obj->numbersWith[frequency] > 0;
          }

          void frequencyTrackerFree(FrequencyTracker* obj) {
              free(obj->count);
              free(obj->numbersWith);
              free(obj);
          }
        `,
        csharp: code`
          public class FrequencyTracker {
              private Dictionary<int, int> count = new Dictionary<int, int>();       // number -> occurrences
              private Dictionary<int, int> numbersWith = new Dictionary<int, int>(); // f -> numbers occurring f times

              public FrequencyTracker() {
              }

              private void Bump(int f, int d) {
                  int v;
                  numbersWith.TryGetValue(f, out v);
                  numbersWith[f] = v + d;
              }

              public void Add(int number) {
                  int c;
                  count.TryGetValue(number, out c);
                  if (c > 0) Bump(c, -1);
                  count[number] = c + 1;
                  Bump(c + 1, 1);
              }

              public void DeleteOne(int number) {
                  int c;
                  count.TryGetValue(number, out c);
                  if (c == 0) return;
                  Bump(c, -1);
                  count[number] = c - 1;
                  if (c > 1) Bump(c - 1, 1);
              }

              public bool HasFrequency(int frequency) {
                  int v;
                  return numbersWith.TryGetValue(frequency, out v) && v > 0;
              }
          }
        `,
        go: code`
          type FrequencyTracker struct {
          	count       map[int]int // number -> how often it occurs
          	numbersWith map[int]int // f -> how many numbers occur exactly f times
          }

          func Constructor() FrequencyTracker {
          	return FrequencyTracker{count: map[int]int{}, numbersWith: map[int]int{}}
          }

          func (this *FrequencyTracker) Add(number int) {
          	c := this.count[number]
          	if c > 0 {
          		this.numbersWith[c]--
          	}
          	this.count[number] = c + 1
          	this.numbersWith[c+1]++
          }

          func (this *FrequencyTracker) DeleteOne(number int) {
          	c := this.count[number]
          	if c == 0 {
          		return
          	}
          	this.numbersWith[c]--
          	this.count[number] = c - 1
          	if c > 1 {
          		this.numbersWith[c-1]++
          	}
          }

          func (this *FrequencyTracker) HasFrequency(frequency int) bool {
          	return this.numbersWith[frequency] > 0
          }
        `,
        kotlin: code`
          class FrequencyTracker() {
              private val count = HashMap<Int, Int>()       // number -> how often it occurs
              private val numbersWith = HashMap<Int, Int>() // f -> how many numbers occur exactly f times

              private fun bump(f: Int, d: Int) { numbersWith[f] = (numbersWith[f] ?: 0) + d }

              fun add(number: Int) {
                  val c = count[number] ?: 0
                  if (c > 0) bump(c, -1)
                  count[number] = c + 1
                  bump(c + 1, 1)
              }

              fun deleteOne(number: Int) {
                  val c = count[number] ?: 0
                  if (c == 0) return
                  bump(c, -1)
                  count[number] = c - 1
                  if (c > 1) bump(c - 1, 1)
              }

              fun hasFrequency(frequency: Int): Boolean = (numbersWith[frequency] ?: 0) > 0
          }
        `,
        swift: code`
          class FrequencyTracker {
              var count: [Int: Int] = [:]       // number -> how often it occurs
              var numbersWith: [Int: Int] = [:] // f -> how many numbers occur exactly f times

              init() {}

              func add(_ number: Int) {
                  let c = count[number, default: 0]
                  if c > 0 { numbersWith[c, default: 0] -= 1 }
                  count[number] = c + 1
                  numbersWith[c + 1, default: 0] += 1
              }

              func deleteOne(_ number: Int) {
                  let c = count[number, default: 0]
                  if c == 0 { return }
                  numbersWith[c, default: 0] -= 1
                  count[number] = c - 1
                  if c > 1 { numbersWith[c - 1, default: 0] += 1 }
              }

              func hasFrequency(_ frequency: Int) -> Bool {
                  return numbersWith[frequency, default: 0] > 0
              }
          }
        `,
        rust: code`
          use std::collections::HashMap;

          struct FrequencyTracker {
              count: HashMap<i32, i32>,        // number -> how often it occurs
              numbers_with: HashMap<i32, i32>, // f -> how many numbers occur exactly f times
          }

          impl FrequencyTracker {
              fn new() -> Self { FrequencyTracker { count: HashMap::new(), numbers_with: HashMap::new() } }

              fn add(&mut self, number: i32) {
                  let c = *self.count.get(&number).unwrap_or(&0);
                  if c > 0 { *self.numbers_with.entry(c).or_insert(0) -= 1; }
                  self.count.insert(number, c + 1);
                  *self.numbers_with.entry(c + 1).or_insert(0) += 1;
              }

              fn deleteOne(&mut self, number: i32) {
                  let c = *self.count.get(&number).unwrap_or(&0);
                  if c == 0 { return; }
                  *self.numbers_with.entry(c).or_insert(0) -= 1;
                  self.count.insert(number, c - 1);
                  if c > 1 { *self.numbers_with.entry(c - 1).or_insert(0) += 1; }
              }

              fn hasFrequency(&mut self, frequency: i32) -> bool {
                  *self.numbers_with.get(&frequency).unwrap_or(&0) > 0
              }
          }
        `,
        php: code`
          class FrequencyTracker {
              private $count = [];       // number -> how often it occurs
              private $numbersWith = []; // f -> how many numbers occur exactly f times

              function __construct() {
              }

              private function bump($f, $d) {
                  $this->numbersWith[$f] = ($this->numbersWith[$f] ?? 0) + $d;
              }

              function add($number) {
                  $c = $this->count[$number] ?? 0;
                  if ($c > 0) $this->bump($c, -1);
                  $this->count[$number] = $c + 1;
                  $this->bump($c + 1, 1);
              }

              function deleteOne($number) {
                  $c = $this->count[$number] ?? 0;
                  if ($c === 0) return;
                  $this->bump($c, -1);
                  $this->count[$number] = $c - 1;
                  if ($c > 1) $this->bump($c - 1, 1);
              }

              function hasFrequency($frequency) {
                  return ($this->numbersWith[$frequency] ?? 0) > 0;
              }
          }
        `,
        ruby: code`
          class FrequencyTracker
            def initialize
              @count = Hash.new(0)        # number -> how often it occurs
              @numbers_with = Hash.new(0) # f -> how many numbers occur exactly f times
            end

            def add(number)
              c = @count[number]
              @numbers_with[c] -= 1 if c > 0
              @count[number] = c + 1
              @numbers_with[c + 1] += 1
            end

            def deleteOne(number)
              c = @count[number]
              return if c == 0
              @numbers_with[c] -= 1
              @count[number] = c - 1
              @numbers_with[c - 1] += 1 if c > 1
            end

            def hasFrequency(frequency)
              @numbers_with[frequency] > 0
            end
          end
        `,
      },
    };
  })(),

  // ── Design Task Manager (LC 3408) ─────────────────────────────────
  (() => {
    const run: Run = (ops, args) => {
      const tasks = new Map<number, { user: number; prio: number }>();
      return ops.map((op, i) => {
        const a = args[i];
        switch (op) {
          case "TaskManager": for (const [u, t, p] of a[0]) tasks.set(t, { user: u, prio: p }); return null;
          case "add": tasks.set(a[1], { user: a[0], prio: a[2] }); return null;
          case "edit": tasks.get(a[0])!.prio = a[1]; return null;
          case "rmv": tasks.delete(a[0]); return null;
          case "execTop": {
            let best = -1;
            for (const [t, v] of tasks) {
              if (best < 0) { best = t; continue; }
              const b = tasks.get(best)!;
              if (v.prio > b.prio || (v.prio === b.prio && t > best)) best = t;
            }
            if (best < 0) return -1;
            const u = tasks.get(best)!.user;
            tasks.delete(best);
            return u;
          }
        }
        return null;
      });
    };
    const ex = [
      { ops: ["TaskManager", "add", "edit", "execTop", "rmv", "add", "execTop"], args: [[[[1, 101, 10], [2, 102, 20], [3, 103, 15]]], [4, 104, 5], [102, 8], [], [101], [5, 105, 15], []] },
      { ops: ["TaskManager", "execTop", "execTop", "add", "execTop", "execTop"], args: [[[[7, 3, 0], [8, 9, 0]]], [], [], [6, 3, 1000000000], [], []] },
    ];
    return {
      slug: "design-task-manager",
      title: "Design Task Manager",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "Heap (Priority Queue)", "Ordered Set", "Design", "Amazon"],
      signature: {
        funcName: "TaskManager", params: [{ name: "tasks", type: "int[][]" as const }], returns: "void" as const,
        methods: [
          { name: "add", params: [{ name: "userId", type: "int" as const }, { name: "taskId", type: "int" as const }, { name: "priority", type: "int" as const }], returns: "void" as const },
          { name: "edit", params: [{ name: "taskId", type: "int" as const }, { name: "newPriority", type: "int" as const }], returns: "void" as const },
          { name: "rmv", params: [{ name: "taskId", type: "int" as const }], returns: "void" as const },
          { name: "execTop", params: [], returns: "int" as const },
        ],
      },
      description: describe(
        "A task manager tracks tasks that belong to users. Every task has a unique `taskId`, the `userId` it belongs to and a `priority`. Write the class `TaskManager`:\n\n- `TaskManager(int[][] tasks)` starts with the given tasks; each `tasks[i]` is `[userId, taskId, priority]`.\n- `void add(int userId, int taskId, int priority)` adds a task for that user. No current task has this `taskId`.\n- `void edit(int taskId, int newPriority)` changes the priority of an existing task.\n- `void rmv(int taskId)` removes an existing task.\n- `int execTop()` runs the task with the **highest priority** — among equal priorities, the one with the **highest `taskId`** — removes it from the manager and returns its `userId`. If there are no tasks it returns `-1`.\n\n" + CALLS,
        [
          exampleOf(run, ex[0].ops, ex[0].args, "Task 102 drops from 20 to 8, so the top task is 103 (priority 15) of user 3. After 101 is removed, tasks 105 (15) and 104 (5) and 102 (8) remain; 105 runs, belonging to user 5."),
          exampleOf(run, ex[1].ops, ex[1].args, "Both tasks have priority 0, so the higher id 9 runs first (user 8), then 3 (user 7). Once task id 3 is free it can be added again; it runs, and then the manager is empty."),
        ],
        ["1 <= tasks.length <= 10^5", "0 <= userId <= 10^5", "0 <= taskId <= 10^5", "0 <= priority, newPriority <= 10^9", "At most 2 * 10^5 calls are made in total to add, edit, rmv and execTop", "add is only called with a taskId that is not currently in the manager; edit and rmv only with one that is"]),
      hints: [
        "Scanning every task in `execTop` is O(n) per call — too slow for 2 * 10^5 calls on 10^5 tasks.",
        "Order the tasks by the pair (priority, taskId) — both descending — in a max-heap or an ordered set, and keep a map from taskId to its user and current priority.",
        "With an ordered set, `edit` and `rmv` delete the old pair. With a heap, push the new pair on `edit`, leave old pairs in, and have `execTop` discard tops that no longer match the map (lazy deletion).",
      ],
      editorial: explain({
        idea: "A map `taskId → (userId, priority)` holds the truth; a max-heap of `(priority, taskId)` pairs finds the top task. Changed and removed tasks leave stale pairs in the heap, which `execTop` recognises against the map and throws away.",
        steps: [
          "For every initial task and every `add`, record it in the map and push `(priority, taskId)`.",
          "`edit(taskId, p)`: update the map's priority and push `(p, taskId)`; the old pair goes stale.",
          "`rmv(taskId)`: delete it from the map; its pairs go stale.",
          "`execTop()`: pop pairs while the top's task is missing from the map or has a different priority there. If the heap empties, return `-1`; otherwise delete that task from the map, pop it and return its user.",
        ],
        why: "Every live task always has a heap pair equal to its current `(priority, taskId)`, because each change pushes one. A pair that matches the map is therefore exactly a live task, and the heap orders pairs by priority, then id — so the first matching top is the task the problem asks for. Discarded pairs never match again unless the same `(priority, taskId)` comes back, in which case the pair is correct again.",
        time: "O(log n) amortised per call; O(n log n) to build",
        space: "O(n + number of edits)",
        pitfalls: [
          "The tie-break is the **higher** taskId, not the lower one.",
          "A task removed and later re-added with the same id must not be confused with its old self — compare the priority stored in the map, not just the id.",
          "Pack `(priority, taskId)` into one 64-bit key (`priority * 2^17 + taskId`), or compare pairs; 32 bits are not enough.",
        ],
      }),
      examples: ex.map((e) => caseOf(run, e.ops, e.args)),
      gen: (rng: Rng) => {
        const idTop = pick(rng, [6, 20, 100000]);
        const userTop = pick(rng, [3, 100000]);
        const prTop = pick(rng, [2, 6, 1000000000]);
        const sim = new Map<number, number>(); // the live tasks: taskId -> priority
        const fresh = () => { for (;;) { const t = ri(rng, 0, idTop); if (!sim.has(t)) return t; } };
        const init: number[][] = [];
        for (let k = ri(rng, 1, Math.min(8, idTop)); k > 0; k--) { const t = fresh(), p = ri(rng, 0, prTop); sim.set(t, p); init.push([ri(rng, 0, userTop), t, p]); }
        const ops = ["TaskManager"], args: Args = [[init]];
        for (let m = ri(rng, 1, pick(rng, [5, 20, 40])); m > 0; m--) {
          const r = rng();
          const live = [...sim.keys()];
          if (r < 0.25 && sim.size <= idTop) { const t = fresh(), p = ri(rng, 0, prTop); sim.set(t, p); ops.push("add"); args.push([ri(rng, 0, userTop), t, p]); }
          else if (r < 0.45 && live.length) { const t = pick(rng, live), p = ri(rng, 0, prTop); sim.set(t, p); ops.push("edit"); args.push([t, p]); }
          else if (r < 0.6 && live.length) { const t = pick(rng, live); sim.delete(t); ops.push("rmv"); args.push([t]); }
          else {
            ops.push("execTop"); args.push([]);
            let best = -1;
            for (const [t, p] of sim) if (best < 0 || p > sim.get(best)! || (p === sim.get(best)! && t > best)) best = t;
            if (best >= 0) sim.delete(best);
          }
        }
        return caseOf(run, ops, args);
      },
      solutions: {
        python: code`
          import heapq

          class TaskManager:

              def __init__(self, tasks: List[List[int]]):
                  self.info = {}  # taskId -> (userId, priority)
                  self.heap = []  # (-priority, -taskId); stale pairs are skipped later
                  for u, t, p in tasks:
                      self.info[t] = (u, p)
                      self.heap.append((-p, -t))
                  heapq.heapify(self.heap)

              def add(self, userId: int, taskId: int, priority: int) -> None:
                  self.info[taskId] = (userId, priority)
                  heapq.heappush(self.heap, (-priority, -taskId))

              def edit(self, taskId: int, newPriority: int) -> None:
                  self.info[taskId] = (self.info[taskId][0], newPriority)
                  heapq.heappush(self.heap, (-newPriority, -taskId))

              def rmv(self, taskId: int) -> None:
                  del self.info[taskId]

              def execTop(self) -> int:
                  while self.heap:
                      p, t = self.heap[0]
                      cur = self.info.get(-t)
                      heapq.heappop(self.heap)
                      if cur is not None and cur[1] == -p:
                          del self.info[-t]
                          return cur[0]
                  return -1
        `,
        javascript: code`
          // A max-heap of packed keys priority * 2^17 + taskId (below 2^47, exact in a double).
          var TM_SHIFT = 131072;

          var TaskManager = function(tasks) {
              this.user = new Map(); // taskId -> userId
              this.prio = new Map(); // taskId -> current priority
              this.heap = [];        // stale keys are skipped by execTop
              for (var i = 0; i < tasks.length; i++) this.add(tasks[i][0], tasks[i][1], tasks[i][2]);
          };

          TaskManager.prototype.push = function(key) {
              var h = this.heap, i = h.length;
              h.push(key);
              while (i > 0) {
                  var p = (i - 1) >> 1;
                  if (h[p] >= key) break;
                  h[i] = h[p]; i = p;
              }
              h[i] = key;
          };

          TaskManager.prototype.pop = function() {
              var h = this.heap, last = h.pop();
              if (h.length === 0) return;
              var i = 0, n = h.length;
              for (;;) {
                  var l = 2 * i + 1, r = l + 1, m = i, mv = last;
                  if (l < n && h[l] > mv) { m = l; mv = h[l]; }
                  if (r < n && h[r] > mv) { m = r; mv = h[r]; }
                  if (m === i) break;
                  h[i] = h[m]; i = m;
              }
              h[i] = last;
          };

          TaskManager.prototype.add = function(userId, taskId, priority) {
              this.user.set(taskId, userId);
              this.prio.set(taskId, priority);
              this.push(priority * TM_SHIFT + taskId);
          };

          TaskManager.prototype.edit = function(taskId, newPriority) {
              this.prio.set(taskId, newPriority);
              this.push(newPriority * TM_SHIFT + taskId);
          };

          TaskManager.prototype.rmv = function(taskId) {
              this.user.delete(taskId);
              this.prio.delete(taskId);
          };

          TaskManager.prototype.execTop = function() {
              while (this.heap.length > 0) {
                  var key = this.heap[0];
                  var t = key % TM_SHIFT, p = (key - t) / TM_SHIFT;
                  this.pop();
                  if (this.prio.has(t) && this.prio.get(t) === p) {
                      var u = this.user.get(t);
                      this.rmv(t);
                      return u;
                  }
              }
              return -1;
          };
        `,
        typescript: code`
          // A max-heap of packed keys priority * 2^17 + taskId (below 2^47, exact in a double).
          class TaskManager {
              user: { [taskId: number]: number };
              prio: { [taskId: number]: number };
              heap: number[]; // stale keys are skipped by execTop

              constructor(tasks: number[][]) {
                  this.user = {};
                  this.prio = {};
                  this.heap = [];
                  for (var i = 0; i < tasks.length; i++) this.add(tasks[i][0], tasks[i][1], tasks[i][2]);
              }

              push(key: number): void {
                  var h = this.heap, i = h.length;
                  h.push(key);
                  while (i > 0) {
                      var p = (i - 1) >> 1;
                      if (h[p] >= key) break;
                      h[i] = h[p]; i = p;
                  }
                  h[i] = key;
              }

              pop(): void {
                  var h = this.heap, last = h.pop();
                  if (h.length === 0) return;
                  var i = 0, n = h.length;
                  for (;;) {
                      var l = 2 * i + 1, r = l + 1, m = i, mv = last;
                      if (l < n && h[l] > mv) { m = l; mv = h[l]; }
                      if (r < n && h[r] > mv) { m = r; mv = h[r]; }
                      if (m === i) break;
                      h[i] = h[m]; i = m;
                  }
                  h[i] = last;
              }

              add(userId: number, taskId: number, priority: number): void {
                  this.user[taskId] = userId;
                  this.prio[taskId] = priority;
                  this.push(priority * 131072 + taskId);
              }

              edit(taskId: number, newPriority: number): void {
                  this.prio[taskId] = newPriority;
                  this.push(newPriority * 131072 + taskId);
              }

              rmv(taskId: number): void {
                  delete this.user[taskId];
                  delete this.prio[taskId];
              }

              execTop(): number {
                  while (this.heap.length > 0) {
                      var key = this.heap[0];
                      var t = key % 131072, p = (key - t) / 131072;
                      this.pop();
                      if (this.prio[t] !== undefined && this.prio[t] === p) {
                          var u = this.user[t];
                          this.rmv(t);
                          return u;
                      }
                  }
                  return -1;
              }
          }
        `,
        java: code`
          class TaskManager {
              private HashMap<Integer, Integer> user = new HashMap<>(), prio = new HashMap<>();
              private TreeSet<Long> order = new TreeSet<>(); // priority * 2^17 + taskId

              private static long key(int priority, int taskId) { return ((long) priority << 17) | taskId; }

              public TaskManager(int[][] tasks) {
                  for (int[] t : tasks) add(t[0], t[1], t[2]);
              }

              public void add(int userId, int taskId, int priority) {
                  user.put(taskId, userId);
                  prio.put(taskId, priority);
                  order.add(key(priority, taskId));
              }

              public void edit(int taskId, int newPriority) {
                  order.remove(key(prio.get(taskId), taskId));
                  prio.put(taskId, newPriority);
                  order.add(key(newPriority, taskId));
              }

              public void rmv(int taskId) {
                  order.remove(key(prio.get(taskId), taskId));
                  prio.remove(taskId);
                  user.remove(taskId);
              }

              public int execTop() {
                  if (order.isEmpty()) return -1;
                  int taskId = (int) (order.last() & ((1 << 17) - 1));
                  int u = user.get(taskId);
                  rmv(taskId);
                  return u;
              }
          }
        `,
        cpp: code`
          class TaskManager {
              unordered_map<int, int> user, prio; // taskId -> userId / current priority
              set<pair<int, int>> order;          // (priority, taskId)
          public:
              TaskManager(vector<vector<int>>& tasks) {
                  for (auto& t : tasks) add(t[0], t[1], t[2]);
              }

              void add(int userId, int taskId, int priority) {
                  user[taskId] = userId;
                  prio[taskId] = priority;
                  order.insert({priority, taskId});
              }

              void edit(int taskId, int newPriority) {
                  order.erase({prio[taskId], taskId});
                  prio[taskId] = newPriority;
                  order.insert({newPriority, taskId});
              }

              void rmv(int taskId) {
                  order.erase({prio[taskId], taskId});
                  prio.erase(taskId);
                  user.erase(taskId);
              }

              int execTop() {
                  if (order.empty()) return -1;
                  int taskId = prev(order.end())->second;
                  int u = user[taskId];
                  rmv(taskId);
                  return u;
              }
          };
        `,
        c: code`
          /* Task ids are at most 10^5, so arrays indexed by id hold each task; a binary
             max-heap of keys priority * 2^17 + taskId finds the top, with stale keys
             (edited or removed tasks) skipped when they surface. */
          #define TM_IDS 100001

          typedef struct {
              int *user, *prio;
              char* alive;
              long long* heap;
              int n, cap;
          } TaskManager;

          static void tmPush(TaskManager* o, long long key) {
              if (o->n == o->cap) { o->cap *= 2; o->heap = (long long*)realloc(o->heap, o->cap * sizeof(long long)); }
              int i = o->n++;
              while (i > 0 && o->heap[(i - 1) / 2] < key) { o->heap[i] = o->heap[(i - 1) / 2]; i = (i - 1) / 2; }
              o->heap[i] = key;
          }

          static void tmPop(TaskManager* o) {
              long long last = o->heap[--o->n];
              int i = 0;
              for (;;) {
                  int l = 2 * i + 1, r = l + 1, m = i;
                  long long mv = last;
                  if (l < o->n && o->heap[l] > mv) { m = l; mv = o->heap[l]; }
                  if (r < o->n && o->heap[r] > mv) { m = r; mv = o->heap[r]; }
                  if (m == i) break;
                  o->heap[i] = o->heap[m];
                  i = m;
              }
              if (o->n > 0) o->heap[i] = last;
          }

          void taskManagerAdd(TaskManager* obj, int userId, int taskId, int priority) {
              obj->user[taskId] = userId;
              obj->prio[taskId] = priority;
              obj->alive[taskId] = 1;
              tmPush(obj, ((long long)priority << 17) | taskId);
          }

          TaskManager* taskManagerCreate(int** tasks, int tasksSize, int* tasksColSize) {
              TaskManager* o = (TaskManager*)malloc(sizeof(TaskManager));
              o->user = (int*)malloc(TM_IDS * sizeof(int));
              o->prio = (int*)malloc(TM_IDS * sizeof(int));
              o->alive = (char*)calloc(TM_IDS, 1);
              o->cap = 16;
              o->n = 0;
              o->heap = (long long*)malloc(o->cap * sizeof(long long));
              for (int i = 0; i < tasksSize; i++) taskManagerAdd(o, tasks[i][0], tasks[i][1], tasks[i][2]);
              return o;
          }

          void taskManagerEdit(TaskManager* obj, int taskId, int newPriority) {
              obj->prio[taskId] = newPriority;
              tmPush(obj, ((long long)newPriority << 17) | taskId);
          }

          void taskManagerRmv(TaskManager* obj, int taskId) {
              obj->alive[taskId] = 0;
          }

          int taskManagerExecTop(TaskManager* obj) {
              while (obj->n > 0) {
                  long long key = obj->heap[0];
                  int t = (int)(key & ((1 << 17) - 1));
                  int p = (int)(key >> 17);
                  tmPop(obj);
                  if (obj->alive[t] && obj->prio[t] == p) {
                      obj->alive[t] = 0;
                      return obj->user[t];
                  }
              }
              return -1;
          }

          void taskManagerFree(TaskManager* obj) {
              free(obj->user);
              free(obj->prio);
              free(obj->alive);
              free(obj->heap);
              free(obj);
          }
        `,
        csharp: code`
          public class TaskManager {
              private Dictionary<int, int> user = new Dictionary<int, int>(), prio = new Dictionary<int, int>();
              private SortedSet<long> order = new SortedSet<long>(); // priority * 2^17 + taskId

              private static long Key(int priority, int taskId) { return ((long)priority << 17) | (long)taskId; }

              public TaskManager(int[][] tasks) {
                  foreach (var t in tasks) Add(t[0], t[1], t[2]);
              }

              public void Add(int userId, int taskId, int priority) {
                  user[taskId] = userId;
                  prio[taskId] = priority;
                  order.Add(Key(priority, taskId));
              }

              public void Edit(int taskId, int newPriority) {
                  order.Remove(Key(prio[taskId], taskId));
                  prio[taskId] = newPriority;
                  order.Add(Key(newPriority, taskId));
              }

              public void Rmv(int taskId) {
                  order.Remove(Key(prio[taskId], taskId));
                  prio.Remove(taskId);
                  user.Remove(taskId);
              }

              public int ExecTop() {
                  if (order.Count == 0) return -1;
                  int taskId = (int)(order.Max & ((1 << 17) - 1));
                  int u = user[taskId];
                  Rmv(taskId);
                  return u;
              }
          }
        `,
        go: code`
          // A binary max-heap of keys priority<<17 | taskId; stale keys are skipped by ExecTop.
          type TaskManager struct {
          	user, prio map[int]int
          	heap       []int
          }

          func Constructor(tasks [][]int) TaskManager {
          	tm := TaskManager{user: map[int]int{}, prio: map[int]int{}}
          	for _, t := range tasks {
          		tm.Add(t[0], t[1], t[2])
          	}
          	return tm
          }

          func (this *TaskManager) push(key int) {
          	h := append(this.heap, key)
          	i := len(h) - 1
          	for i > 0 && h[(i-1)/2] < key {
          		h[i] = h[(i-1)/2]
          		i = (i - 1) / 2
          	}
          	h[i] = key
          	this.heap = h
          }

          func (this *TaskManager) pop() {
          	h := this.heap
          	last := h[len(h)-1]
          	h = h[:len(h)-1]
          	n := len(h)
          	if n > 0 {
          		i := 0
          		for {
          			l, r, m, mv := 2*i+1, 2*i+2, i, last
          			if l < n && h[l] > mv {
          				m, mv = l, h[l]
          			}
          			if r < n && h[r] > mv {
          				m = r
          			}
          			if m == i {
          				break
          			}
          			h[i] = h[m]
          			i = m
          		}
          		h[i] = last
          	}
          	this.heap = h
          }

          func (this *TaskManager) Add(userId int, taskId int, priority int) {
          	this.user[taskId] = userId
          	this.prio[taskId] = priority
          	this.push(priority<<17 | taskId)
          }

          func (this *TaskManager) Edit(taskId int, newPriority int) {
          	this.prio[taskId] = newPriority
          	this.push(newPriority<<17 | taskId)
          }

          func (this *TaskManager) Rmv(taskId int) {
          	delete(this.user, taskId)
          	delete(this.prio, taskId)
          }

          func (this *TaskManager) ExecTop() int {
          	for len(this.heap) > 0 {
          		key := this.heap[0]
          		t, p := key&(1<<17-1), key>>17
          		this.pop()
          		if cur, ok := this.prio[t]; ok && cur == p {
          			u := this.user[t]
          			this.Rmv(t)
          			return u
          		}
          	}
          	return -1
          }
        `,
        kotlin: code`
          class TaskManager(tasks: Array<IntArray>) {
              private val user = HashMap<Int, Int>()
              private val prio = HashMap<Int, Int>()
              private val order = java.util.TreeSet<Long>() // priority * 2^17 + taskId

              private fun key(priority: Int, taskId: Int): Long = (priority.toLong() shl 17) or taskId.toLong()

              init {
                  for (t in tasks) add(t[0], t[1], t[2])
              }

              fun add(userId: Int, taskId: Int, priority: Int) {
                  user[taskId] = userId
                  prio[taskId] = priority
                  order.add(key(priority, taskId))
              }

              fun edit(taskId: Int, newPriority: Int) {
                  order.remove(key(prio[taskId]!!, taskId))
                  prio[taskId] = newPriority
                  order.add(key(newPriority, taskId))
              }

              fun rmv(taskId: Int) {
                  order.remove(key(prio[taskId]!!, taskId))
                  prio.remove(taskId)
                  user.remove(taskId)
              }

              fun execTop(): Int {
                  if (order.isEmpty()) return -1
                  val taskId = (order.last() and ((1L shl 17) - 1)).toInt()
                  val u = user[taskId]!!
                  rmv(taskId)
                  return u
              }
          }
        `,
        swift: code`
          // A binary max-heap of keys priority << 17 | taskId; stale keys are skipped by execTop.
          class TaskManager {
              var user: [Int: Int] = [:]
              var prio: [Int: Int] = [:]
              var heap: [Int] = []

              init(_ tasks: [[Int]]) {
                  for t in tasks { add(t[0], t[1], t[2]) }
              }

              func push(_ key: Int) {
                  heap.append(key)
                  var i = heap.count - 1
                  while i > 0 && heap[(i - 1) / 2] < key {
                      heap[i] = heap[(i - 1) / 2]
                      i = (i - 1) / 2
                  }
                  heap[i] = key
              }

              func pop() {
                  let last = heap.removeLast()
                  let n = heap.count
                  if n == 0 { return }
                  var i = 0
                  while true {
                      let l = 2 * i + 1, r = l + 1
                      var m = i, mv = last
                      if l < n && heap[l] > mv { m = l; mv = heap[l] }
                      if r < n && heap[r] > mv { m = r }
                      if m == i { break }
                      heap[i] = heap[m]
                      i = m
                  }
                  heap[i] = last
              }

              func add(_ userId: Int, _ taskId: Int, _ priority: Int) {
                  user[taskId] = userId
                  prio[taskId] = priority
                  push(priority << 17 | taskId)
              }

              func edit(_ taskId: Int, _ newPriority: Int) {
                  prio[taskId] = newPriority
                  push(newPriority << 17 | taskId)
              }

              func rmv(_ taskId: Int) {
                  user[taskId] = nil
                  prio[taskId] = nil
              }

              func execTop() -> Int {
                  while !heap.isEmpty {
                      let key = heap[0]
                      let t = key & ((1 << 17) - 1), p = key >> 17
                      pop()
                      if let cur = prio[t], cur == p {
                          let u = user[t]!
                          rmv(t)
                          return u
                      }
                  }
                  return -1
              }
          }
        `,
        rust: code`
          use std::collections::{BTreeSet, HashMap};

          struct TaskManager {
              user: HashMap<i32, i32>,
              prio: HashMap<i32, i32>,
              order: BTreeSet<(i32, i32)>, // (priority, taskId)
          }

          impl TaskManager {
              fn new(tasks: Vec<Vec<i32>>) -> Self {
                  let mut tm = TaskManager { user: HashMap::new(), prio: HashMap::new(), order: BTreeSet::new() };
                  for t in tasks.iter() { tm.add(t[0], t[1], t[2]); }
                  tm
              }

              fn add(&mut self, userId: i32, taskId: i32, priority: i32) {
                  self.user.insert(taskId, userId);
                  self.prio.insert(taskId, priority);
                  self.order.insert((priority, taskId));
              }

              fn edit(&mut self, taskId: i32, newPriority: i32) {
                  let old = self.prio[&taskId];
                  self.order.remove(&(old, taskId));
                  self.prio.insert(taskId, newPriority);
                  self.order.insert((newPriority, taskId));
              }

              fn rmv(&mut self, taskId: i32) {
                  let old = self.prio[&taskId];
                  self.order.remove(&(old, taskId));
                  self.prio.remove(&taskId);
                  self.user.remove(&taskId);
              }

              fn execTop(&mut self) -> i32 {
                  let top = self.order.iter().next_back().cloned();
                  match top {
                      None => -1,
                      Some((_, taskId)) => {
                          let u = self.user[&taskId];
                          self.rmv(taskId);
                          u
                      }
                  }
              }
          }
        `,
        php: code`
          class TaskManager {
              private $user = [];
              private $prio = [];
              private $heap; // max-heap of priority << 17 | taskId; stale keys are skipped

              function __construct($tasks) {
                  $this->heap = new \SplMaxHeap();
                  foreach ($tasks as $t) $this->add($t[0], $t[1], $t[2]);
              }

              function add($userId, $taskId, $priority) {
                  $this->user[$taskId] = $userId;
                  $this->prio[$taskId] = $priority;
                  $this->heap->insert(($priority << 17) | $taskId);
              }

              function edit($taskId, $newPriority) {
                  $this->prio[$taskId] = $newPriority;
                  $this->heap->insert(($newPriority << 17) | $taskId);
              }

              function rmv($taskId) {
                  unset($this->user[$taskId], $this->prio[$taskId]);
              }

              function execTop() {
                  while (!$this->heap->isEmpty()) {
                      $key = $this->heap->extract();
                      $t = $key & ((1 << 17) - 1);
                      $p = $key >> 17;
                      if (isset($this->prio[$t]) && $this->prio[$t] === $p) {
                          $u = $this->user[$t];
                          $this->rmv($t);
                          return $u;
                      }
                  }
                  return -1;
              }
          }
        `,
        ruby: code`
          # A binary max-heap of keys priority << 17 | taskId; stale keys are skipped by execTop.
          class TaskManager
            def initialize(tasks)
              @user = {}
              @prio = {}
              @heap = []
              tasks.each { |u, t, p| add(u, t, p) }
            end

            def push(key)
              h = @heap
              h << key
              i = h.length - 1
              while i > 0 && h[(i - 1) / 2] < key
                h[i] = h[(i - 1) / 2]
                i = (i - 1) / 2
              end
              h[i] = key
            end

            def pop_top
              h = @heap
              last = h.pop
              n = h.length
              return if n == 0
              i = 0
              loop do
                l = 2 * i + 1
                r = l + 1
                m = i
                mv = last
                if l < n && h[l] > mv
                  m = l
                  mv = h[l]
                end
                m = r if r < n && h[r] > mv
                break if m == i
                h[i] = h[m]
                i = m
              end
              h[i] = last
            end

            def add(userId, taskId, priority)
              @user[taskId] = userId
              @prio[taskId] = priority
              push((priority << 17) | taskId)
            end

            def edit(taskId, newPriority)
              @prio[taskId] = newPriority
              push((newPriority << 17) | taskId)
            end

            def rmv(taskId)
              @user.delete(taskId)
              @prio.delete(taskId)
            end

            def execTop
              until @heap.empty?
                key = @heap[0]
                t = key & ((1 << 17) - 1)
                p = key >> 17
                pop_top
                if @prio[t] == p
                  u = @user[t]
                  rmv(t)
                  return u
                end
              end
              -1
            end
          end
        `,
      },
    };
  })(),

  // ── Implement Router (LC 3508) ────────────────────────────────────
  (() => {
    const run: Run = (ops, args) => {
      let limit = 0;
      const q: number[][] = [];
      return ops.map((op, i) => {
        const a = args[i];
        if (op === "Router") { limit = a[0]; return null; }
        if (op === "addPacket") {
          if (q.some((p) => p[0] === a[0] && p[1] === a[1] && p[2] === a[2])) return false;
          if (q.length === limit) q.shift();
          q.push([a[0], a[1], a[2]]);
          return true;
        }
        if (op === "forwardPacket") return q.length ? q.shift()! : [];
        if (op === "getCount") return q.filter((p) => p[1] === a[0] && p[2] >= a[1] && p[2] <= a[2]).length;
        return null;
      });
    };
    const ex = [
      {
        ops: ["Router", "addPacket", "addPacket", "addPacket", "addPacket", "addPacket", "forwardPacket", "addPacket", "getCount"],
        args: [[3], [1, 4, 90], [2, 5, 90], [1, 4, 90], [3, 5, 95], [4, 5, 105], [], [5, 2, 110], [5, 100, 110]],
      },
      { ops: ["Router", "addPacket", "forwardPacket", "forwardPacket", "getCount"], args: [[2], [7, 4, 1], [], [], [4, 1, 1000000000]] },
    ];
    return {
      slug: "implement-router",
      title: "Implement Router",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Binary Search", "Queue", "Design", "Ordered Set", "Amazon"],
      signature: {
        funcName: "Router", params: [{ name: "memoryLimit", type: "int" as const }], returns: "void" as const,
        methods: [
          { name: "addPacket", params: [{ name: "source", type: "int" as const }, { name: "destination", type: "int" as const }, { name: "timestamp", type: "int" as const }], returns: "bool" as const },
          { name: "forwardPacket", params: [], returns: "int[]" as const },
          { name: "getCount", params: [{ name: "destination", type: "int" as const }, { name: "startTime", type: "int" as const }, { name: "endTime", type: "int" as const }], returns: "int" as const },
        ],
      },
      description: describe(
        "A network router stores data packets until it forwards them. A packet is the triple `(source, destination, timestamp)`; two packets with the same three values are **duplicates**. The router holds at most `memoryLimit` packets and forwards them first-in, first-out.\n\nWrite the class `Router`:\n\n- `Router(int memoryLimit)` creates an empty router.\n- `boolean addPacket(int source, int destination, int timestamp)` stores the packet and returns `true`, unless a duplicate is already stored, in which case it stores nothing and returns `false`. If the router is full when a new packet is stored, the **oldest** stored packet is dropped first.\n- `int[] forwardPacket()` removes the oldest stored packet and returns it as `[source, destination, timestamp]`, or returns `[]` if the router is empty.\n- `int getCount(int destination, int startTime, int endTime)` returns how many **stored** packets (not yet forwarded or dropped) have this `destination` and a timestamp in `[startTime, endTime]`, both ends included.\n\nCalls to `addPacket` come with non-decreasing timestamps.\n\n" + CALLS,
        [
          exampleOf(run, ex[0].ops, ex[0].args, "The second [1, 4, 90] is a duplicate. Adding [4, 5, 105] to a full router drops the oldest, [1, 4, 90]. Forwarding sends [2, 5, 90]. After [5, 2, 110] arrives, the stored packets for destination 5 are at 95 and 105, and only 105 is in [100, 110]."),
          exampleOf(run, ex[1].ops, ex[1].args, "Once the only packet is forwarded the router is empty: the next forward returns [], and nothing is left to count."),
        ],
        ["2 <= memoryLimit <= 10^5", "1 <= source, destination <= 2 * 10^5", "1 <= timestamp <= 10^9", "1 <= startTime <= endTime <= 10^9", "At most 10^5 calls are made in total to addPacket, forwardPacket and getCount", "addPacket is called with timestamps in non-decreasing order"]),
      hints: [
        "Three questions need three structures: arrival order (a queue), duplicate detection (a hash set of triples), and per-destination counting.",
        "Because timestamps only grow, each destination's stored timestamps, in arrival order, are already sorted. A range count is two binary searches.",
        "Packets leave only from the front of the global queue — so for their destination they are also the earliest one stored. Keep per destination a list of timestamps plus a count of how many at its front have left.",
      ],
      editorial: explain({
        idea: "Store the packets in a FIFO queue, their triples in a hash set, and for every destination the list of its timestamps in arrival order with a moving start index. Timestamps arrive sorted, so each list is sorted and `getCount` is a pair of binary searches over its live part.",
        steps: [
          "`addPacket(s, d, t)`: if `(s, d, t)` is in the set, return `false`. If the queue holds `memoryLimit` packets, remove the oldest (see below). Push the packet, add its triple to the set, append `t` to `list[d]`, return `true`.",
          "Removing the oldest packet (for a drop or `forwardPacket`): pop it from the queue, delete its triple from the set, and advance `start[d]` of its destination by one.",
          "`forwardPacket()`: return `[]` if the queue is empty; otherwise remove the oldest packet as above and return it.",
          "`getCount(d, a, b)`: in `list[d]` from `start[d]` onwards, count the timestamps in `[a, b]` with a lower bound of `a` and an upper bound of `b`.",
        ],
        why: "Within one destination, packets join in arrival order and arrival order is timestamp order, so `list[d]` is sorted. Packets leave strictly in arrival order, so the ones of destination `d` that have left are exactly the first `start[d]` entries of `list[d]`; the rest are the stored ones, still sorted, which is what the binary searches need.",
        time: "O(1) for addPacket and forwardPacket (expected, for the hash set), O(log n) for getCount",
        space: "O(n) for n packets added",
        pitfalls: [
          "A dropped or forwarded packet is no longer a duplicate — remove its triple from the set.",
          "getCount counts only stored packets; forgetting to advance the destination's start index counts packets that already left.",
          "The duplicate check comes before the eviction: a duplicate must not push the oldest packet out.",
        ],
      }),
      examples: ex.map((e) => caseOf(run, e.ops, e.args)),
      gen: (rng: Rng) => {
        const limit = rng() < 0.1 ? 100000 : ri(rng, 2, 6);
        const pool = Array.from({ length: ri(rng, 1, 3) }, () => (rng() < 0.15 ? 200000 : ri(rng, 1, 4)));
        const big = rng() < 0.2;
        let t = big ? ri(rng, 1, 1000) : 1;
        const recent: number[][] = [];
        const ops = ["Router"], args: Args = [[limit]];
        for (let m = ri(rng, 1, pick(rng, [5, 20, 40])); m > 0; m--) {
          const r = rng();
          if (r < 0.55) {
            if (rng() < 0.4) t = Math.min(1000000000, t + (big ? ri(rng, 1, 300000000) : ri(rng, 1, 3)));
            let pk: number[];
            const same = recent.filter((p) => p[2] === t);
            if (same.length && rng() < 0.35) pk = pick(rng, same).slice();
            else pk = [pick(rng, pool), pick(rng, pool), t];
            recent.push(pk);
            ops.push("addPacket"); args.push(pk);
          } else if (r < 0.75) { ops.push("forwardPacket"); args.push([]); }
          else {
            const lo = ri(rng, 1, t), hi = rng() < 0.2 ? 1000000000 : ri(rng, lo, Math.min(1000000000, t + 2));
            ops.push("getCount"); args.push([pick(rng, pool), lo, hi]);
          }
        }
        return caseOf(run, ops, args);
      },
      solutions: {
        python: code`
          from bisect import bisect_left, bisect_right
          from collections import deque

          class Router:

              def __init__(self, memoryLimit: int):
                  self.limit = memoryLimit
                  self.queue = deque()  # stored packets, oldest first
                  self.keys = set()     # their (source, destination, timestamp)
                  self.times = {}       # destination -> its timestamps in arrival order
                  self.start = {}       # destination -> how many of those have left

              def _drop_oldest(self):
                  p = self.queue.popleft()
                  self.keys.discard(p)
                  self.start[p[1]] += 1
                  return p

              def addPacket(self, source: int, destination: int, timestamp: int) -> bool:
                  p = (source, destination, timestamp)
                  if p in self.keys:
                      return False
                  if len(self.queue) == self.limit:
                      self._drop_oldest()
                  self.queue.append(p)
                  self.keys.add(p)
                  self.times.setdefault(destination, []).append(timestamp)
                  self.start.setdefault(destination, 0)
                  return True

              def forwardPacket(self) -> List[int]:
                  if not self.queue:
                      return []
                  return list(self._drop_oldest())

              def getCount(self, destination: int, startTime: int, endTime: int) -> int:
                  ts = self.times.get(destination)
                  if not ts:
                      return 0
                  lo = self.start[destination]
                  return bisect_right(ts, endTime, lo) - bisect_left(ts, startTime, lo)
        `,
        javascript: code`
          var Router = function(memoryLimit) {
              this.limit = memoryLimit;
              this.queue = [];      // stored packets, oldest at index head
              this.head = 0;
              this.keys = new Set(); // "source,destination,timestamp" of stored packets
              this.times = new Map(); // destination -> its timestamps in arrival order
              this.start = new Map(); // destination -> how many of those have left
          };

          function rtBound(a, lo, x, upper) { // first index >= lo with a[i] > x (upper) or >= x
              var hi = a.length;
              while (lo < hi) {
                  var mid = (lo + hi) >> 1;
                  if (upper ? a[mid] <= x : a[mid] < x) lo = mid + 1; else hi = mid;
              }
              return lo;
          }

          Router.prototype.dropOldest = function() {
              var p = this.queue[this.head++];
              this.keys.delete(p[0] + "," + p[1] + "," + p[2]);
              this.start.set(p[1], this.start.get(p[1]) + 1);
              return p;
          };

          Router.prototype.addPacket = function(source, destination, timestamp) {
              var key = source + "," + destination + "," + timestamp;
              if (this.keys.has(key)) return false;
              if (this.queue.length - this.head === this.limit) this.dropOldest();
              this.queue.push([source, destination, timestamp]);
              this.keys.add(key);
              if (!this.times.has(destination)) { this.times.set(destination, []); this.start.set(destination, 0); }
              this.times.get(destination).push(timestamp);
              return true;
          };

          Router.prototype.forwardPacket = function() {
              if (this.head === this.queue.length) return [];
              return this.dropOldest();
          };

          Router.prototype.getCount = function(destination, startTime, endTime) {
              var ts = this.times.get(destination);
              if (!ts) return 0;
              var lo = this.start.get(destination);
              return rtBound(ts, lo, endTime, true) - rtBound(ts, lo, startTime, false);
          };
        `,
        typescript: code`
          class Router {
              limit: number;
              queue: number[][]; // stored packets, oldest at index head
              head: number;
              keys: { [key: string]: boolean };    // "source,destination,timestamp" of stored packets
              times: { [dest: number]: number[] }; // destination -> its timestamps in arrival order
              start: { [dest: number]: number };   // destination -> how many of those have left

              constructor(memoryLimit: number) {
                  this.limit = memoryLimit;
                  this.queue = [];
                  this.head = 0;
                  this.keys = {};
                  this.times = {};
                  this.start = {};
              }

              bound(a: number[], lo: number, x: number, upper: boolean): number {
                  var hi = a.length;
                  while (lo < hi) {
                      var mid = (lo + hi) >> 1;
                      if (upper ? a[mid] <= x : a[mid] < x) lo = mid + 1; else hi = mid;
                  }
                  return lo;
              }

              dropOldest(): number[] {
                  var p = this.queue[this.head++];
                  delete this.keys[p[0] + "," + p[1] + "," + p[2]];
                  this.start[p[1]]++;
                  return p;
              }

              addPacket(source: number, destination: number, timestamp: number): boolean {
                  var key = source + "," + destination + "," + timestamp;
                  if (this.keys[key]) return false;
                  if (this.queue.length - this.head === this.limit) this.dropOldest();
                  this.queue.push([source, destination, timestamp]);
                  this.keys[key] = true;
                  if (this.times[destination] === undefined) { this.times[destination] = []; this.start[destination] = 0; }
                  this.times[destination].push(timestamp);
                  return true;
              }

              forwardPacket(): number[] {
                  if (this.head === this.queue.length) return [];
                  return this.dropOldest();
              }

              getCount(destination: number, startTime: number, endTime: number): number {
                  var ts = this.times[destination];
                  if (ts === undefined) return 0;
                  var lo = this.start[destination];
                  return this.bound(ts, lo, endTime, true) - this.bound(ts, lo, startTime, false);
              }
          }
        `,
        java: code`
          class Router {
              private int limit;
              private ArrayDeque<int[]> queue = new ArrayDeque<>();       // stored packets, oldest first
              private HashSet<String> keys = new HashSet<>();               // their triples
              private HashMap<Integer, ArrayList<Integer>> times = new HashMap<>(); // destination -> timestamps
              private HashMap<Integer, Integer> start = new HashMap<>();    // destination -> how many left

              public Router(int memoryLimit) {
                  limit = memoryLimit;
              }

              private static String key(int s, int d, int t) { return s + "," + d + "," + t; }

              private int[] dropOldest() {
                  int[] p = queue.pollFirst();
                  keys.remove(key(p[0], p[1], p[2]));
                  start.merge(p[1], 1, Integer::sum);
                  return p;
              }

              private static int bound(ArrayList<Integer> a, int lo, int x, boolean upper) {
                  int hi = a.size();
                  while (lo < hi) {
                      int mid = (lo + hi) >>> 1;
                      int v = a.get(mid);
                      if (upper ? v <= x : v < x) lo = mid + 1; else hi = mid;
                  }
                  return lo;
              }

              public boolean addPacket(int source, int destination, int timestamp) {
                  if (!keys.add(key(source, destination, timestamp))) return false;
                  if (queue.size() == limit) dropOldest();
                  queue.addLast(new int[]{source, destination, timestamp});
                  times.computeIfAbsent(destination, k -> new ArrayList<>()).add(timestamp);
                  start.putIfAbsent(destination, 0);
                  return true;
              }

              public int[] forwardPacket() {
                  if (queue.isEmpty()) return new int[0];
                  return dropOldest();
              }

              public int getCount(int destination, int startTime, int endTime) {
                  ArrayList<Integer> ts = times.get(destination);
                  if (ts == null) return 0;
                  int lo = start.get(destination);
                  return bound(ts, lo, endTime, true) - bound(ts, lo, startTime, false);
              }
          }
        `,
        cpp: code`
          class Router {
              int limit;
              deque<array<int, 3>> q;                  // stored packets, oldest first
              set<array<int, 3>> keys;                 // their triples
              unordered_map<int, vector<int>> times;   // destination -> timestamps in arrival order
              unordered_map<int, int> start;           // destination -> how many of those have left

              array<int, 3> dropOldest() {
                  array<int, 3> p = q.front();
                  q.pop_front();
                  keys.erase(p);
                  start[p[1]]++;
                  return p;
              }
          public:
              Router(int memoryLimit) : limit(memoryLimit) {}

              bool addPacket(int source, int destination, int timestamp) {
                  array<int, 3> p = {source, destination, timestamp};
                  if (keys.count(p)) return false;
                  if ((int)q.size() == limit) dropOldest();
                  q.push_back(p);
                  keys.insert(p);
                  times[destination].push_back(timestamp);
                  return true;
              }

              vector<int> forwardPacket() {
                  if (q.empty()) return {};
                  array<int, 3> p = dropOldest();
                  return {p[0], p[1], p[2]};
              }

              int getCount(int destination, int startTime, int endTime) {
                  auto it = times.find(destination);
                  if (it == times.end()) return 0;
                  auto b = it->second.begin() + start[destination];
                  auto e = it->second.end();
                  return (int)(upper_bound(b, e, endTime) - lower_bound(b, e, startTime));
              }
          };
        `,
        c: code`
          /* Destinations are at most 2 * 10^5, so arrays indexed by destination hold each
             one's timestamps. With no hash set in C, the duplicate check uses the order of
             arrival: timestamps never decrease, so the stored packets with the new packet's
             timestamp are the newest ones — a duplicate can only be among them. */
          #define RT_DEST 200001

          typedef struct {
              int limit;
              int (*q)[3];   /* every packet ever stored; the live ones are q[head .. tail) */
              int head, tail, cap;
              int** times;   /* destination -> its timestamps in arrival order */
              int* tlen;
              int* tcap;
              int* start;    /* destination -> how many of those have left */
              int* used;     /* destinations whose timestamp list was allocated */
              int nUsed;
          } Router;

          Router* routerCreate(int memoryLimit) {
              Router* r = (Router*)malloc(sizeof(Router));
              r->limit = memoryLimit;
              r->cap = 16;
              r->q = (int(*)[3])malloc(r->cap * sizeof(*r->q));
              r->head = r->tail = 0;
              r->times = (int**)calloc(RT_DEST, sizeof(int*));
              r->tlen = (int*)calloc(RT_DEST, sizeof(int));
              r->tcap = (int*)calloc(RT_DEST, sizeof(int));
              r->start = (int*)calloc(RT_DEST, sizeof(int));
              r->used = (int*)malloc(16 * sizeof(int));
              r->nUsed = 0;
              return r;
          }

          static int* rtDropOldest(Router* r) {
              int* p = r->q[r->head++];
              r->start[p[1]]++;
              return p;
          }

          bool routerAddPacket(Router* obj, int source, int destination, int timestamp) {
              for (int i = obj->tail - 1; i >= obj->head && obj->q[i][2] == timestamp; i--)
                  if (obj->q[i][0] == source && obj->q[i][1] == destination) return false;
              if (obj->tail - obj->head == obj->limit) rtDropOldest(obj);
              if (obj->tail == obj->cap) {
                  obj->cap *= 2;
                  obj->q = (int(*)[3])realloc(obj->q, obj->cap * sizeof(*obj->q));
              }
              obj->q[obj->tail][0] = source;
              obj->q[obj->tail][1] = destination;
              obj->q[obj->tail][2] = timestamp;
              obj->tail++;
              if (obj->tlen[destination] == obj->tcap[destination]) {
                  if (obj->tcap[destination] == 0) {
                      if ((obj->nUsed & (obj->nUsed - 1)) == 0 && obj->nUsed >= 16)
                          obj->used = (int*)realloc(obj->used, 2 * obj->nUsed * sizeof(int));
                      obj->used[obj->nUsed++] = destination;
                  }
                  obj->tcap[destination] = obj->tcap[destination] ? obj->tcap[destination] * 2 : 4;
                  obj->times[destination] = (int*)realloc(obj->times[destination], obj->tcap[destination] * sizeof(int));
              }
              obj->times[destination][obj->tlen[destination]++] = timestamp;
              return true;
          }

          int* routerForwardPacket(Router* obj, int* returnSize) {
              int* out = (int*)malloc(3 * sizeof(int));
              if (obj->head == obj->tail) { *returnSize = 0; return out; }
              int* p = rtDropOldest(obj);
              out[0] = p[0];
              out[1] = p[1];
              out[2] = p[2];
              *returnSize = 3;
              return out;
          }

          static int rtBound(int* a, int lo, int hi, int x, int upper) {
              while (lo < hi) {
                  int mid = (lo + hi) / 2;
                  if (upper ? a[mid] <= x : a[mid] < x) lo = mid + 1; else hi = mid;
              }
              return lo;
          }

          int routerGetCount(Router* obj, int destination, int startTime, int endTime) {
              int* a = obj->times[destination];
              int lo = obj->start[destination], hi = obj->tlen[destination];
              if (a == NULL) return 0;
              return rtBound(a, lo, hi, endTime, 1) - rtBound(a, lo, hi, startTime, 0);
          }

          void routerFree(Router* obj) {
              for (int i = 0; i < obj->nUsed; i++) free(obj->times[obj->used[i]]);
              free(obj->used);
              free(obj->times);
              free(obj->tlen);
              free(obj->tcap);
              free(obj->start);
              free(obj->q);
              free(obj);
          }
        `,
        csharp: code`
          public class Router {
              private int limit;
              private LinkedList<int[]> queue = new LinkedList<int[]>(); // stored packets, oldest first
              private HashSet<string> keys = new HashSet<string>();      // their triples
              private Dictionary<int, List<int>> times = new Dictionary<int, List<int>>(); // destination -> timestamps
              private Dictionary<int, int> start = new Dictionary<int, int>(); // destination -> how many left

              public Router(int memoryLimit) {
                  limit = memoryLimit;
              }

              private static string Key(int s, int d, int t) { return s + "," + d + "," + t; }

              private int[] DropOldest() {
                  int[] p = queue.First.Value;
                  queue.RemoveFirst();
                  keys.Remove(Key(p[0], p[1], p[2]));
                  start[p[1]]++;
                  return p;
              }

              private static int Bound(List<int> a, int lo, int x, bool upper) {
                  int hi = a.Count;
                  while (lo < hi) {
                      int mid = (lo + hi) / 2;
                      if (upper ? a[mid] <= x : a[mid] < x) lo = mid + 1; else hi = mid;
                  }
                  return lo;
              }

              public bool AddPacket(int source, int destination, int timestamp) {
                  if (!keys.Add(Key(source, destination, timestamp))) return false;
                  if (queue.Count == limit) DropOldest();
                  queue.AddLast(new int[] { source, destination, timestamp });
                  List<int> ts;
                  if (!times.TryGetValue(destination, out ts)) { ts = new List<int>(); times[destination] = ts; start[destination] = 0; }
                  ts.Add(timestamp);
                  return true;
              }

              public int[] ForwardPacket() {
                  if (queue.Count == 0) return new int[0];
                  return DropOldest();
              }

              public int GetCount(int destination, int startTime, int endTime) {
                  List<int> ts;
                  if (!times.TryGetValue(destination, out ts)) return 0;
                  int lo = start[destination];
                  return Bound(ts, lo, endTime, true) - Bound(ts, lo, startTime, false);
              }
          }
        `,
        go: code`
          type Router struct {
          	limit int
          	queue [][3]int          // every packet stored; the live ones are queue[head:]
          	head  int
          	keys  map[[3]int]bool   // triples of stored packets
          	times map[int][]int     // destination -> timestamps in arrival order
          	start map[int]int       // destination -> how many of those have left
          }

          func Constructor(memoryLimit int) Router {
          	return Router{limit: memoryLimit, keys: map[[3]int]bool{}, times: map[int][]int{}, start: map[int]int{}}
          }

          func (this *Router) dropOldest() [3]int {
          	p := this.queue[this.head]
          	this.head++
          	delete(this.keys, p)
          	this.start[p[1]]++
          	return p
          }

          func (this *Router) AddPacket(source int, destination int, timestamp int) bool {
          	p := [3]int{source, destination, timestamp}
          	if this.keys[p] {
          		return false
          	}
          	if len(this.queue)-this.head == this.limit {
          		this.dropOldest()
          	}
          	this.queue = append(this.queue, p)
          	this.keys[p] = true
          	this.times[destination] = append(this.times[destination], timestamp)
          	return true
          }

          func (this *Router) ForwardPacket() []int {
          	if this.head == len(this.queue) {
          		return []int{}
          	}
          	p := this.dropOldest()
          	return []int{p[0], p[1], p[2]}
          }

          func (this *Router) GetCount(destination int, startTime int, endTime int) int {
          	ts := this.times[destination][this.start[destination]:]
          	return sort.SearchInts(ts, endTime+1) - sort.SearchInts(ts, startTime)
          }
        `,
        kotlin: code`
          class Router(memoryLimit: Int) {
              private val limit = memoryLimit
              private val queue = java.util.ArrayDeque<IntArray>()       // stored packets, oldest first
              private val keys = HashSet<Triple<Int, Int, Int>>()         // their triples
              private val times = HashMap<Int, ArrayList<Int>>()          // destination -> timestamps
              private val start = HashMap<Int, Int>()                     // destination -> how many left

              private fun dropOldest(): IntArray {
                  val p = queue.pollFirst()
                  keys.remove(Triple(p[0], p[1], p[2]))
                  start[p[1]] = start[p[1]]!! + 1
                  return p
              }

              private fun bound(a: ArrayList<Int>, from: Int, x: Int, upper: Boolean): Int {
                  var lo = from
                  var hi = a.size
                  while (lo < hi) {
                      val mid = (lo + hi) ushr 1
                      if (if (upper) a[mid] <= x else a[mid] < x) lo = mid + 1 else hi = mid
                  }
                  return lo
              }

              fun addPacket(source: Int, destination: Int, timestamp: Int): Boolean {
                  if (!keys.add(Triple(source, destination, timestamp))) return false
                  if (queue.size == limit) dropOldest()
                  queue.addLast(intArrayOf(source, destination, timestamp))
                  times.getOrPut(destination) { ArrayList<Int>() }.add(timestamp)
                  if (!start.containsKey(destination)) start[destination] = 0
                  return true
              }

              fun forwardPacket(): IntArray {
                  if (queue.isEmpty()) return intArrayOf()
                  return dropOldest()
              }

              fun getCount(destination: Int, startTime: Int, endTime: Int): Int {
                  val ts = times[destination] ?: return 0
                  val lo = start[destination]!!
                  return bound(ts, lo, endTime, true) - bound(ts, lo, startTime, false)
              }
          }
        `,
        swift: code`
          class Router {
              let limit: Int
              var queue: [[Int]] = []        // every packet stored; the live ones are queue[head...]
              var head = 0
              var keys = Set<[Int]>()        // triples of stored packets
              var times: [Int: [Int]] = [:]  // destination -> timestamps in arrival order
              var start: [Int: Int] = [:]    // destination -> how many of those have left

              init(_ memoryLimit: Int) {
                  limit = memoryLimit
              }

              func dropOldest() -> [Int] {
                  let p = queue[head]
                  head += 1
                  keys.remove(p)
                  start[p[1], default: 0] += 1
                  return p
              }

              func bound(_ a: [Int], _ from: Int, _ x: Int, _ upper: Bool) -> Int {
                  var lo = from, hi = a.count
                  while lo < hi {
                      let mid = (lo + hi) / 2
                      if upper ? a[mid] <= x : a[mid] < x { lo = mid + 1 } else { hi = mid }
                  }
                  return lo
              }

              func addPacket(_ source: Int, _ destination: Int, _ timestamp: Int) -> Bool {
                  let p = [source, destination, timestamp]
                  if keys.contains(p) { return false }
                  if queue.count - head == limit { _ = dropOldest() }
                  queue.append(p)
                  keys.insert(p)
                  times[destination, default: []].append(timestamp)
                  return true
              }

              func forwardPacket() -> [Int] {
                  if head == queue.count { return [] }
                  return dropOldest()
              }

              func getCount(_ destination: Int, _ startTime: Int, _ endTime: Int) -> Int {
                  guard let ts = times[destination] else { return 0 }
                  let lo = start[destination, default: 0]
                  return bound(ts, lo, endTime, true) - bound(ts, lo, startTime, false)
              }
          }
        `,
        rust: code`
          use std::collections::{HashMap, HashSet, VecDeque};

          struct Router {
              limit: usize,
              queue: VecDeque<(i32, i32, i32)>, // stored packets, oldest first
              keys: HashSet<(i32, i32, i32)>,   // their triples
              times: HashMap<i32, Vec<i32>>,    // destination -> timestamps in arrival order
              start: HashMap<i32, usize>,       // destination -> how many of those have left
          }

          impl Router {
              fn new(memoryLimit: i32) -> Self {
                  Router { limit: memoryLimit as usize, queue: VecDeque::new(), keys: HashSet::new(), times: HashMap::new(), start: HashMap::new() }
              }

              fn drop_oldest(&mut self) -> (i32, i32, i32) {
                  let p = self.queue.pop_front().unwrap();
                  self.keys.remove(&p);
                  *self.start.entry(p.1).or_insert(0) += 1;
                  p
              }

              fn addPacket(&mut self, source: i32, destination: i32, timestamp: i32) -> bool {
                  let p = (source, destination, timestamp);
                  if self.keys.contains(&p) { return false; }
                  if self.queue.len() == self.limit { self.drop_oldest(); }
                  self.queue.push_back(p);
                  self.keys.insert(p);
                  self.times.entry(destination).or_insert_with(Vec::new).push(timestamp);
                  true
              }

              fn forwardPacket(&mut self) -> Vec<i32> {
                  if self.queue.is_empty() { return vec![]; }
                  let p = self.drop_oldest();
                  vec![p.0, p.1, p.2]
              }

              fn getCount(&mut self, destination: i32, startTime: i32, endTime: i32) -> i32 {
                  let ts = match self.times.get(&destination) { Some(v) => v, None => return 0 };
                  let lo = *self.start.get(&destination).unwrap_or(&0);
                  let live = &ts[lo..];
                  let bound = |x: i32, upper: bool| -> usize {
                      let (mut l, mut h) = (0usize, live.len());
                      while l < h {
                          let mid = (l + h) / 2;
                          if if upper { live[mid] <= x } else { live[mid] < x } { l = mid + 1; } else { h = mid; }
                      }
                      l
                  };
                  (bound(endTime, true) - bound(startTime, false)) as i32
              }
          }
        `,
        php: code`
          class Router {
              private $limit;
              private $queue;       // stored packets, oldest first
              private $keys = [];   // "source,destination,timestamp" of stored packets
              private $times = [];  // destination -> timestamps in arrival order
              private $start = [];  // destination -> how many of those have left

              function __construct($memoryLimit) {
                  $this->limit = $memoryLimit;
                  $this->queue = new \SplQueue();
              }

              private function dropOldest() {
                  $p = $this->queue->dequeue();
                  unset($this->keys[$p[0] . "," . $p[1] . "," . $p[2]]);
                  $this->start[$p[1]]++;
                  return $p;
              }

              private function bound($a, $lo, $x, $upper) {
                  $hi = count($a);
                  while ($lo < $hi) {
                      $mid = ($lo + $hi) >> 1;
                      if ($upper ? $a[$mid] <= $x : $a[$mid] < $x) $lo = $mid + 1; else $hi = $mid;
                  }
                  return $lo;
              }

              function addPacket($source, $destination, $timestamp) {
                  $key = $source . "," . $destination . "," . $timestamp;
                  if (isset($this->keys[$key])) return false;
                  if (count($this->queue) === $this->limit) $this->dropOldest();
                  $this->queue->enqueue([$source, $destination, $timestamp]);
                  $this->keys[$key] = true;
                  if (!isset($this->times[$destination])) { $this->times[$destination] = []; $this->start[$destination] = 0; }
                  $this->times[$destination][] = $timestamp;
                  return true;
              }

              function forwardPacket() {
                  if ($this->queue->isEmpty()) return [];
                  return $this->dropOldest();
              }

              function getCount($destination, $startTime, $endTime) {
                  if (!isset($this->times[$destination])) return 0;
                  $ts = $this->times[$destination];
                  $lo = $this->start[$destination];
                  return $this->bound($ts, $lo, $endTime, true) - $this->bound($ts, $lo, $startTime, false);
              }
          }
        `,
        ruby: code`
          class Router
            def initialize(memoryLimit)
              @limit = memoryLimit
              @queue = []  # every packet stored; the live ones are @queue[@head..]
              @head = 0
              @keys = {}   # triples of stored packets
              @times = {}  # destination -> timestamps in arrival order
              @start = {}  # destination -> how many of those have left
            end

            def drop_oldest
              p = @queue[@head]
              @head += 1
              @keys.delete(p)
              @start[p[1]] += 1
              p
            end

            def addPacket(source, destination, timestamp)
              p = [source, destination, timestamp]
              return false if @keys.key?(p)
              drop_oldest if @queue.length - @head == @limit
              @queue << p
              @keys[p] = true
              (@times[destination] ||= []) << timestamp
              @start[destination] ||= 0
              true
            end

            def forwardPacket
              return [] if @head == @queue.length
              drop_oldest
            end

            def getCount(destination, startTime, endTime)
              ts = @times[destination]
              return 0 unless ts
              lo = @start[destination]
              hi_end = (lo...ts.length).bsearch { |i| ts[i] > endTime } || ts.length
              lo_end = (lo...ts.length).bsearch { |i| ts[i] >= startTime } || ts.length
              hi_end - lo_end
            end
          end
        `,
      },
    };
  })(),

  // ── Data Stream as Disjoint Intervals (LC 352) ────────────────────
  (() => {
    const run: Run = (ops, args) => {
      const seen = new Set<number>();
      return ops.map((op, i) => {
        if (op === "addNum") { seen.add(args[i][0]); return null; }
        if (op === "getIntervals") {
          const v = [...seen].sort((a, b) => a - b);
          const out: number[][] = [];
          for (const x of v) {
            if (out.length && out[out.length - 1][1] === x - 1) out[out.length - 1][1] = x;
            else out.push([x, x]);
          }
          return out;
        }
        return null;
      });
    };
    const ex = [
      {
        ops: ["SummaryRanges", "addNum", "getIntervals", "addNum", "getIntervals", "addNum", "getIntervals", "addNum", "getIntervals", "addNum", "getIntervals"],
        args: [[], [4], [], [6], [], [10], [], [5], [], [9], []],
      },
      { ops: ["SummaryRanges", "getIntervals", "addNum", "addNum", "addNum", "getIntervals"], args: [[], [], [10000], [0], [10000], []] },
    ];
    return {
      slug: "data-stream-as-disjoint-intervals",
      title: "Data Stream as Disjoint Intervals",
      difficulty: "HARD" as const,
      tags: ["Binary Search", "Design", "Ordered Set", "Google", "Amazon"],
      signature: {
        funcName: "SummaryRanges", params: [], returns: "void" as const,
        methods: [
          { name: "addNum", params: [{ name: "value", type: "int" as const }], returns: "void" as const },
          { name: "getIntervals", params: [], returns: "int[][]" as const },
        ],
      },
      description: describe(
        "Non-negative integers arrive one at a time. At any moment, summarise the distinct numbers seen so far as a list of **disjoint intervals**: each interval `[start, end]` covers every integer from `start` to `end`, and no two intervals touch or overlap (so `[1, 2]` and `[3, 3]` would be one interval `[1, 3]`).\n\nWrite the class `SummaryRanges`:\n\n- `SummaryRanges()` starts with no numbers.\n- `void addNum(int value)` adds `value` to the stream (it may have been seen before).\n- `int[][] getIntervals()` returns the summary as a list of `[start, end]` pairs **sorted by `start`**.\n\n" + CALLS,
        [
          exampleOf(run, ex[0].ops, ex[0].args, "4, 6 and 10 start as separate intervals. 5 joins [4, 4] and [6, 6] into [4, 6]; 9 extends [10, 10] to [9, 10]."),
          exampleOf(run, ex[1].ops, ex[1].args, "Before any number arrives the summary is empty. Adding 10000 a second time changes nothing."),
        ],
        ["0 <= value <= 10^4", "At most 3 * 10^4 calls are made in total to addNum and getIntervals", "At most 10^2 calls are made to getIntervals"],
        "What if there are lots of merges and the number of disjoint intervals is small compared to the size of the stream?"),
      hints: [
        "Keep the intervals themselves, sorted by start, rather than the raw numbers.",
        "A new value can only interact with two intervals: the last one starting at or before it, and the first one starting after it. Find them by binary search (or an ordered map's floor and higher entries).",
        "Four cases: the value is already covered; it is adjacent to both neighbours (merge them); adjacent to one (extend it); or to neither (insert `[value, value]`).",
      ],
      editorial: explain({
        idea: "Maintain the summary itself — a sorted list of disjoint, non-adjacent intervals — and update it locally on each addition. Only the interval just before the value and the one just after it can absorb or be merged by the value.",
        steps: [
          "Let `i` be the index of the first interval whose start is greater than `value`; the interval before it, `i - 1`, is the last one starting at or before `value`.",
          "If interval `i - 1` exists and its end is `>= value`, the value is already covered — stop.",
          "Let `left` be whether interval `i - 1` ends at `value - 1`, and `right` whether interval `i` starts at `value + 1`.",
          "Both: set interval `i - 1`'s end to interval `i`'s end and delete interval `i`. Only `left`: set interval `i - 1`'s end to `value`. Only `right`: set interval `i`'s start to `value`. Neither: insert `[value, value]` at position `i`.",
          "`getIntervals()` returns the list as it is.",
        ],
        why: "The list stays sorted, disjoint and non-adjacent: a covered value changes nothing; otherwise `value` lies strictly between the end of interval `i - 1` and the start of interval `i`, so only those two can be adjacent to it, and each case joins exactly the intervals that `value` connects. Every other interval is at least two away from `value` and is untouched.",
        time: "O(log k) to locate plus O(k) for an array insertion or deletion (O(log k) with a balanced ordered map), where k is the number of intervals; getIntervals is O(k)",
        space: "O(k)",
        pitfalls: [
          "Repeated values must not create duplicate intervals — check whether the value is already covered first.",
          "Intervals that become adjacent (end + 1 == next start) must be merged; they are not allowed to sit side by side.",
        ],
      }),
      examples: ex.map((e) => caseOf(run, e.ops, e.args)),
      gen: (rng: Rng) => {
        const top = pick(rng, [5, 12, 30, 10000]);
        const ops = ["SummaryRanges"], args: Args = [[]];
        for (let m = ri(rng, 1, pick(rng, [5, 20, 40])); m > 0; m--) {
          if (rng() < 0.7) { ops.push("addNum"); args.push([rng() < 0.05 ? pick(rng, [0, 10000]) : ri(rng, 0, top)]); }
          else { ops.push("getIntervals"); args.push([]); }
        }
        ops.push("getIntervals"); args.push([]);
        return caseOf(run, ops, args);
      },
      solutions: {
        python: code`
          from bisect import bisect_right

          class SummaryRanges:

              def __init__(self):
                  self.starts = []  # disjoint, non-adjacent intervals, sorted
                  self.ends = []

              def addNum(self, value: int) -> None:
                  s, e = self.starts, self.ends
                  i = bisect_right(s, value)  # first interval starting after value
                  if i > 0 and e[i - 1] >= value:
                      return  # already covered
                  left = i > 0 and e[i - 1] == value - 1
                  right = i < len(s) and s[i] == value + 1
                  if left and right:
                      e[i - 1] = e[i]
                      del s[i]
                      del e[i]
                  elif left:
                      e[i - 1] = value
                  elif right:
                      s[i] = value
                  else:
                      s.insert(i, value)
                      e.insert(i, value)

              def getIntervals(self) -> List[List[int]]:
                  return [[a, b] for a, b in zip(self.starts, self.ends)]
        `,
        javascript: code`
          var SummaryRanges = function() {
              this.starts = []; // disjoint, non-adjacent intervals, sorted
              this.ends = [];
          };

          SummaryRanges.prototype.addNum = function(value) {
              var s = this.starts, e = this.ends;
              var lo = 0, hi = s.length; // first interval starting after value
              while (lo < hi) {
                  var mid = (lo + hi) >> 1;
                  if (s[mid] <= value) lo = mid + 1; else hi = mid;
              }
              var i = lo;
              if (i > 0 && e[i - 1] >= value) return; // already covered
              var left = i > 0 && e[i - 1] === value - 1;
              var right = i < s.length && s[i] === value + 1;
              if (left && right) { e[i - 1] = e[i]; s.splice(i, 1); e.splice(i, 1); }
              else if (left) e[i - 1] = value;
              else if (right) s[i] = value;
              else { s.splice(i, 0, value); e.splice(i, 0, value); }
          };

          SummaryRanges.prototype.getIntervals = function() {
              var out = [];
              for (var i = 0; i < this.starts.length; i++) out.push([this.starts[i], this.ends[i]]);
              return out;
          };
        `,
        typescript: code`
          class SummaryRanges {
              starts: number[]; // disjoint, non-adjacent intervals, sorted
              ends: number[];

              constructor() {
                  this.starts = [];
                  this.ends = [];
              }

              addNum(value: number): void {
                  var s = this.starts, e = this.ends;
                  var lo = 0, hi = s.length; // first interval starting after value
                  while (lo < hi) {
                      var mid = (lo + hi) >> 1;
                      if (s[mid] <= value) lo = mid + 1; else hi = mid;
                  }
                  var i = lo;
                  if (i > 0 && e[i - 1] >= value) return; // already covered
                  var left = i > 0 && e[i - 1] === value - 1;
                  var right = i < s.length && s[i] === value + 1;
                  if (left && right) { e[i - 1] = e[i]; s.splice(i, 1); e.splice(i, 1); }
                  else if (left) e[i - 1] = value;
                  else if (right) s[i] = value;
                  else { s.splice(i, 0, value); e.splice(i, 0, value); }
              }

              getIntervals(): number[][] {
                  var out: number[][] = [];
                  for (var i = 0; i < this.starts.length; i++) out.push([this.starts[i], this.ends[i]]);
                  return out;
              }
          }
        `,
        java: code`
          class SummaryRanges {
              private TreeMap<Integer, Integer> iv = new TreeMap<>(); // start -> end, disjoint and non-adjacent

              public SummaryRanges() {
              }

              public void addNum(int value) {
                  Map.Entry<Integer, Integer> lo = iv.floorEntry(value), hi = iv.higherEntry(value);
                  if (lo != null && lo.getValue() >= value) return; // already covered
                  boolean left = lo != null && lo.getValue() == value - 1;
                  boolean right = hi != null && hi.getKey() == value + 1;
                  if (left && right) {
                      iv.put(lo.getKey(), hi.getValue());
                      iv.remove(hi.getKey());
                  } else if (left) {
                      iv.put(lo.getKey(), value);
                  } else if (right) {
                      iv.remove(hi.getKey());
                      iv.put(value, hi.getValue());
                  } else {
                      iv.put(value, value);
                  }
              }

              public int[][] getIntervals() {
                  int[][] out = new int[iv.size()][];
                  int k = 0;
                  for (Map.Entry<Integer, Integer> e : iv.entrySet()) out[k++] = new int[]{e.getKey(), e.getValue()};
                  return out;
              }
          }
        `,
        cpp: code`
          class SummaryRanges {
              map<int, int> iv; // start -> end, disjoint and non-adjacent
          public:
              SummaryRanges() {}

              void addNum(int value) {
                  auto hi = iv.upper_bound(value); // first interval starting after value
                  auto lo = hi == iv.begin() ? iv.end() : prev(hi);
                  if (lo != iv.end() && lo->second >= value) return; // already covered
                  bool left = lo != iv.end() && lo->second == value - 1;
                  bool right = hi != iv.end() && hi->first == value + 1;
                  if (left && right) {
                      lo->second = hi->second;
                      iv.erase(hi);
                  } else if (left) {
                      lo->second = value;
                  } else if (right) {
                      int e = hi->second;
                      iv.erase(hi);
                      iv[value] = e;
                  } else {
                      iv[value] = value;
                  }
              }

              vector<vector<int>> getIntervals() {
                  vector<vector<int>> out;
                  for (auto& p : iv) out.push_back({p.first, p.second});
                  return out;
              }
          };
        `,
        c: code`
          typedef struct {
              int *starts, *ends; /* disjoint, non-adjacent intervals, sorted */
              int n, cap;
          } SummaryRanges;

          SummaryRanges* summaryRangesCreate() {
              SummaryRanges* r = (SummaryRanges*)malloc(sizeof(SummaryRanges));
              r->n = 0;
              r->cap = 16;
              r->starts = (int*)malloc(r->cap * sizeof(int));
              r->ends = (int*)malloc(r->cap * sizeof(int));
              return r;
          }

          void summaryRangesAddNum(SummaryRanges* obj, int value) {
              int* s = obj->starts;
              int* e = obj->ends;
              int lo = 0, hi = obj->n; /* first interval starting after value */
              while (lo < hi) {
                  int mid = (lo + hi) / 2;
                  if (s[mid] <= value) lo = mid + 1; else hi = mid;
              }
              int i = lo;
              if (i > 0 && e[i - 1] >= value) return; /* already covered */
              int left = i > 0 && e[i - 1] == value - 1;
              int right = i < obj->n && s[i] == value + 1;
              if (left && right) {
                  e[i - 1] = e[i];
                  for (int k = i; k + 1 < obj->n; k++) { s[k] = s[k + 1]; e[k] = e[k + 1]; }
                  obj->n--;
              } else if (left) {
                  e[i - 1] = value;
              } else if (right) {
                  s[i] = value;
              } else {
                  if (obj->n == obj->cap) {
                      obj->cap *= 2;
                      obj->starts = (int*)realloc(obj->starts, obj->cap * sizeof(int));
                      obj->ends = (int*)realloc(obj->ends, obj->cap * sizeof(int));
                      s = obj->starts;
                      e = obj->ends;
                  }
                  for (int k = obj->n; k > i; k--) { s[k] = s[k - 1]; e[k] = e[k - 1]; }
                  s[i] = value;
                  e[i] = value;
                  obj->n++;
              }
          }

          int** summaryRangesGetIntervals(SummaryRanges* obj, int* returnSize, int** returnColumnSizes) {
              int** out = (int**)malloc((obj->n + 1) * sizeof(int*));
              *returnColumnSizes = (int*)malloc((obj->n + 1) * sizeof(int));
              for (int i = 0; i < obj->n; i++) {
                  out[i] = (int*)malloc(2 * sizeof(int));
                  out[i][0] = obj->starts[i];
                  out[i][1] = obj->ends[i];
                  (*returnColumnSizes)[i] = 2;
              }
              *returnSize = obj->n;
              return out;
          }

          void summaryRangesFree(SummaryRanges* obj) {
              free(obj->starts);
              free(obj->ends);
              free(obj);
          }
        `,
        csharp: code`
          public class SummaryRanges {
              private List<int> starts = new List<int>(), ends = new List<int>(); // disjoint, non-adjacent, sorted

              public SummaryRanges() {
              }

              public void AddNum(int value) {
                  int lo = 0, hi = starts.Count; // first interval starting after value
                  while (lo < hi) {
                      int mid = (lo + hi) / 2;
                      if (starts[mid] <= value) lo = mid + 1; else hi = mid;
                  }
                  int i = lo;
                  if (i > 0 && ends[i - 1] >= value) return; // already covered
                  bool left = i > 0 && ends[i - 1] == value - 1;
                  bool right = i < starts.Count && starts[i] == value + 1;
                  if (left && right) { ends[i - 1] = ends[i]; starts.RemoveAt(i); ends.RemoveAt(i); }
                  else if (left) ends[i - 1] = value;
                  else if (right) starts[i] = value;
                  else { starts.Insert(i, value); ends.Insert(i, value); }
              }

              public int[][] GetIntervals() {
                  int[][] res = new int[starts.Count][];
                  for (int i = 0; i < starts.Count; i++) res[i] = new int[] { starts[i], ends[i] };
                  return res;
              }
          }
        `,
        go: code`
          type SummaryRanges struct {
          	starts, ends []int // disjoint, non-adjacent intervals, sorted
          }

          func Constructor() SummaryRanges {
          	return SummaryRanges{}
          }

          func (this *SummaryRanges) AddNum(value int) {
          	s, e := this.starts, this.ends
          	i := sort.Search(len(s), func(k int) bool { return s[k] > value }) // first interval starting after value
          	if i > 0 && e[i-1] >= value {
          		return // already covered
          	}
          	left := i > 0 && e[i-1] == value-1
          	right := i < len(s) && s[i] == value+1
          	switch {
          	case left && right:
          		e[i-1] = e[i]
          		this.starts = append(s[:i], s[i+1:]...)
          		this.ends = append(e[:i], e[i+1:]...)
          	case left:
          		e[i-1] = value
          	case right:
          		s[i] = value
          	default:
          		s = append(s, 0)
          		copy(s[i+1:], s[i:])
          		s[i] = value
          		e = append(e, 0)
          		copy(e[i+1:], e[i:])
          		e[i] = value
          		this.starts, this.ends = s, e
          	}
          }

          func (this *SummaryRanges) GetIntervals() [][]int {
          	out := [][]int{}
          	for i := range this.starts {
          		out = append(out, []int{this.starts[i], this.ends[i]})
          	}
          	return out
          }
        `,
        kotlin: code`
          class SummaryRanges() {
              private val iv = java.util.TreeMap<Int, Int>() // start -> end, disjoint and non-adjacent

              fun addNum(value: Int) {
                  val lo = iv.floorEntry(value)
                  val hi = iv.higherEntry(value)
                  if (lo != null && lo.value >= value) return // already covered
                  val left = lo != null && lo.value == value - 1
                  val right = hi != null && hi.key == value + 1
                  if (left && right) {
                      iv[lo!!.key] = hi!!.value
                      iv.remove(hi.key)
                  } else if (left) {
                      iv[lo!!.key] = value
                  } else if (right) {
                      iv.remove(hi!!.key)
                      iv[value] = hi.value
                  } else {
                      iv[value] = value
                  }
              }

              fun getIntervals(): Array<IntArray> = iv.entries.map { intArrayOf(it.key, it.value) }.toTypedArray()
          }
        `,
        swift: code`
          class SummaryRanges {
              var starts: [Int] = [] // disjoint, non-adjacent intervals, sorted
              var ends: [Int] = []

              init() {}

              func addNum(_ value: Int) {
                  var lo = 0, hi = starts.count // first interval starting after value
                  while lo < hi {
                      let mid = (lo + hi) / 2
                      if starts[mid] <= value { lo = mid + 1 } else { hi = mid }
                  }
                  let i = lo
                  if i > 0 && ends[i - 1] >= value { return } // already covered
                  let left = i > 0 && ends[i - 1] == value - 1
                  let right = i < starts.count && starts[i] == value + 1
                  if left && right {
                      ends[i - 1] = ends[i]
                      starts.remove(at: i)
                      ends.remove(at: i)
                  } else if left {
                      ends[i - 1] = value
                  } else if right {
                      starts[i] = value
                  } else {
                      starts.insert(value, at: i)
                      ends.insert(value, at: i)
                  }
              }

              func getIntervals() -> [[Int]] {
                  return (0..<starts.count).map { [starts[$0], ends[$0]] }
              }
          }
        `,
        rust: code`
          struct SummaryRanges {
              starts: Vec<i32>, // disjoint, non-adjacent intervals, sorted
              ends: Vec<i32>,
          }

          impl SummaryRanges {
              fn new() -> Self { SummaryRanges { starts: Vec::new(), ends: Vec::new() } }

              fn addNum(&mut self, value: i32) {
                  let (mut lo, mut hi) = (0usize, self.starts.len()); // first interval starting after value
                  while lo < hi {
                      let mid = (lo + hi) / 2;
                      if self.starts[mid] <= value { lo = mid + 1; } else { hi = mid; }
                  }
                  let i = lo;
                  if i > 0 && self.ends[i - 1] >= value { return; } // already covered
                  let left = i > 0 && self.ends[i - 1] == value - 1;
                  let right = i < self.starts.len() && self.starts[i] == value + 1;
                  if left && right {
                      self.ends[i - 1] = self.ends[i];
                      self.starts.remove(i);
                      self.ends.remove(i);
                  } else if left {
                      self.ends[i - 1] = value;
                  } else if right {
                      self.starts[i] = value;
                  } else {
                      self.starts.insert(i, value);
                      self.ends.insert(i, value);
                  }
              }

              fn getIntervals(&mut self) -> Vec<Vec<i32>> {
                  self.starts.iter().zip(self.ends.iter()).map(|(&a, &b)| vec![a, b]).collect()
              }
          }
        `,
        php: code`
          class SummaryRanges {
              private $starts = []; // disjoint, non-adjacent intervals, sorted
              private $ends = [];

              function __construct() {
              }

              function addNum($value) {
                  $lo = 0;
                  $hi = count($this->starts); // first interval starting after value
                  while ($lo < $hi) {
                      $mid = ($lo + $hi) >> 1;
                      if ($this->starts[$mid] <= $value) $lo = $mid + 1; else $hi = $mid;
                  }
                  $i = $lo;
                  if ($i > 0 && $this->ends[$i - 1] >= $value) return; // already covered
                  $left = $i > 0 && $this->ends[$i - 1] === $value - 1;
                  $right = $i < count($this->starts) && $this->starts[$i] === $value + 1;
                  if ($left && $right) {
                      $this->ends[$i - 1] = $this->ends[$i];
                      array_splice($this->starts, $i, 1);
                      array_splice($this->ends, $i, 1);
                  } elseif ($left) {
                      $this->ends[$i - 1] = $value;
                  } elseif ($right) {
                      $this->starts[$i] = $value;
                  } else {
                      array_splice($this->starts, $i, 0, [$value]);
                      array_splice($this->ends, $i, 0, [$value]);
                  }
              }

              function getIntervals() {
                  $out = [];
                  foreach ($this->starts as $i => $s) $out[] = [$s, $this->ends[$i]];
                  return $out;
              }
          }
        `,
        ruby: code`
          class SummaryRanges
            def initialize
              @starts = [] # disjoint, non-adjacent intervals, sorted
              @ends = []
            end

            def addNum(value)
              i = @starts.bsearch_index { |s| s > value } || @starts.length # first interval starting after value
              return if i > 0 && @ends[i - 1] >= value # already covered
              left = i > 0 && @ends[i - 1] == value - 1
              right = i < @starts.length && @starts[i] == value + 1
              if left && right
                @ends[i - 1] = @ends[i]
                @starts.delete_at(i)
                @ends.delete_at(i)
              elsif left
                @ends[i - 1] = value
              elsif right
                @starts[i] = value
              else
                @starts.insert(i, value)
                @ends.insert(i, value)
              end
            end

            def getIntervals
              @starts.each_index.map { |i| [@starts[i], @ends[i]] }
            end
          end
        `,
      },
    };
  })(),

  // ── LFU Cache (LC 460) ────────────────────────────────────────────
  (() => {
    const run: Run = (ops, args) => {
      let cap = 0, tick = 0;
      const items = new Map<number, { value: number; freq: number; used: number }>();
      return ops.map((op, i) => {
        const a = args[i];
        tick++;
        if (op === "LFUCache") { cap = a[0]; return null; }
        if (op === "get") {
          const it = items.get(a[0]);
          if (!it) return -1;
          it.freq++; it.used = tick;
          return it.value;
        }
        if (op === "put") {
          const it = items.get(a[0]);
          if (it) { it.value = a[1]; it.freq++; it.used = tick; return null; }
          if (items.size === cap) {
            let victim = -1;
            for (const [k, v] of items) {
              const w = victim < 0 ? null : items.get(victim)!;
              if (!w || v.freq < w.freq || (v.freq === w.freq && v.used < w.used)) victim = k;
            }
            items.delete(victim);
          }
          items.set(a[0], { value: a[1], freq: 1, used: tick });
          return null;
        }
        return null;
      });
    };
    const ex = [
      {
        ops: ["LFUCache", "put", "put", "get", "get", "put", "get", "get", "put", "get", "get", "get"],
        args: [[2], [5, 50], [6, 60], [5], [5], [7, 70], [6], [7], [8, 80], [7], [5], [8]],
      },
      { ops: ["LFUCache", "put", "get", "put", "get", "get", "put", "get"], args: [[1], [2, 1], [2], [3, 2], [2], [3], [3, 0], [3]] },
    ];
    return {
      slug: "lfu-cache",
      title: "LFU Cache",
      difficulty: "HARD" as const,
      tags: ["Hash Table", "Linked List", "Design", "Amazon", "Google", "Microsoft", "Meta"],
      signature: {
        funcName: "LFUCache", params: [{ name: "capacity", type: "int" as const }], returns: "void" as const,
        methods: [
          { name: "get", params: [{ name: "key", type: "int" as const }], returns: "int" as const },
          { name: "put", params: [{ name: "key", type: "int" as const }, { name: "value", type: "int" as const }], returns: "void" as const },
        ],
      },
      description: describe(
        "Design a cache that evicts the **least frequently used** key when it is full. Every key has a **use counter**: it starts at `1` when the key is inserted and goes up by one each time the key is read with `get` or updated with `put`.\n\nWrite the class `LFUCache`:\n\n- `LFUCache(int capacity)` creates an empty cache that holds at most `capacity` keys.\n- `int get(int key)` returns the value of `key` if it is in the cache, otherwise `-1`.\n- `void put(int key, int value)` sets the value of `key` if it is present; otherwise inserts it. If inserting would exceed `capacity`, first remove the key with the **smallest use counter**; if several keys tie, remove the one that was **used least recently** (read or written longest ago).\n\nBoth `get` and `put` must run in O(1) average time.\n\n" + CALLS,
        [
          exampleOf(run, ex[0].ops, ex[0].args, "After two reads key 5 has counter 3 and key 6 counter 1, so inserting 7 evicts 6. Key 7 is read once (counter 2); inserting 8 then evicts 7, the less frequently used of 5 and 7."),
          exampleOf(run, ex[1].ops, ex[1].args, "With room for one key, inserting 3 evicts 2. Updating 3 to 0 keeps it (0 is a real value)."),
        ],
        ["1 <= capacity <= 10^4", "0 <= key <= 10^5", "0 <= value <= 10^9", "At most 2 * 10^5 calls are made to get and put"]),
      hints: [
        "You need the key with the smallest counter, and among those the least recently used — an LRU order *inside* each counter value.",
        "Group the keys by counter: for every counter `f`, a doubly linked list (or an insertion-ordered set) of the keys with that counter, oldest use first.",
        "Track `minFreq`, the smallest counter present. A use moves a key from list `f` to the end of list `f + 1` (and bumps `minFreq` if list `f` emptied and was the minimum). A brand-new key always resets `minFreq` to 1. Eviction takes the front of list `minFreq`.",
      ],
      editorial: explain({
        idea: "Keep a hash map from key to its node (value and counter) and, for every counter value, a doubly linked list of the keys with that counter in order of last use. Together with the smallest counter in use, `minFreq`, every operation touches a constant number of nodes.",
        steps: [
          "`touch(key)`: unlink its node from list `freq`; if that list is now empty and `freq == minFreq`, increase `minFreq`. Increase the node's counter and append it to the end of the list for the new counter.",
          "`get(key)`: if absent return `-1`; otherwise `touch` it and return its value.",
          "`put(key, value)` on a present key: set the value and `touch` it.",
          "`put` on a new key: if the cache is full, remove the node at the front of list `minFreq` (least recently used among the least frequently used) and drop it from the map. Insert the new node with counter 1 at the end of list 1 and set `minFreq = 1`.",
        ],
        why: "Within one list, nodes are appended when they arrive at that counter, so the front is the one used longest ago; across lists, `minFreq` names the smallest counter in use. It only changes in two ways: a use can empty the minimum list, and then the moved key sits at `minFreq + 1`, the new minimum; a new key has counter 1, the smallest possible. So the front of list `minFreq` is always exactly the key the rules evict.",
        time: "O(1) average per get and put",
        space: "O(capacity)",
        pitfalls: [
          "Updating an existing key with `put` counts as a use: its counter goes up.",
          "Evict *before* inserting the new key — otherwise the new key (counter 1) could be evicted immediately.",
          "Reset `minFreq` to 1 after inserting a new key, not to whatever it was.",
        ],
      }),
      examples: ex.map((e) => caseOf(run, e.ops, e.args)),
      gen: (rng: Rng) => {
        const cap = rng() < 0.05 ? 10000 : ri(rng, 1, pick(rng, [1, 2, 3, 5]));
        const keyTop = pick(rng, [3, 6, 12, 100000]);
        const used: number[] = [];
        const ops = ["LFUCache"], args: Args = [[cap]];
        for (let m = ri(rng, 1, pick(rng, [5, 20, 40])); m > 0; m--) {
          const key = used.length && rng() < 0.6 ? pick(rng, used) : ri(rng, 0, keyTop);
          used.push(key);
          if (rng() < 0.5) { ops.push("put"); args.push([key, rng() < 0.2 ? ri(rng, 0, 1000000000) : ri(rng, 0, 99)]); }
          else { ops.push("get"); args.push([key]); }
        }
        return caseOf(run, ops, args);
      },
      solutions: {
        python: code`
          from collections import defaultdict, OrderedDict

          class LFUCache:

              def __init__(self, capacity: int):
                  self.cap = capacity
                  self.node = {}                          # key -> [value, counter]
                  self.byFreq = defaultdict(OrderedDict)  # counter -> keys, least recently used first
                  self.minFreq = 0

              def _touch(self, key):
                  f = self.node[key][1]
                  del self.byFreq[f][key]
                  if not self.byFreq[f]:
                      del self.byFreq[f]
                      if self.minFreq == f:
                          self.minFreq = f + 1
                  self.node[key][1] = f + 1
                  self.byFreq[f + 1][key] = None

              def get(self, key: int) -> int:
                  if key not in self.node:
                      return -1
                  self._touch(key)
                  return self.node[key][0]

              def put(self, key: int, value: int) -> None:
                  if key in self.node:
                      self.node[key][0] = value
                      self._touch(key)
                      return
                  if len(self.node) == self.cap:
                      old, _ = self.byFreq[self.minFreq].popitem(last=False)
                      if not self.byFreq[self.minFreq]:
                          del self.byFreq[self.minFreq]
                      del self.node[old]
                  self.node[key] = [value, 1]
                  self.byFreq[1][key] = None
                  self.minFreq = 1
        `,
        javascript: code`
          // A Map iterates in insertion order, so each counter's Map of keys is an LRU list.
          var LFUCache = function(capacity) {
              this.cap = capacity;
              this.node = new Map();   // key -> { value, freq }
              this.byFreq = new Map(); // counter -> Map of keys, least recently used first
              this.minFreq = 0;
          };

          LFUCache.prototype.listOf = function(f) {
              var l = this.byFreq.get(f);
              if (!l) { l = new Map(); this.byFreq.set(f, l); }
              return l;
          };

          LFUCache.prototype.touch = function(key) {
              var n = this.node.get(key), f = n.freq, l = this.byFreq.get(f);
              l.delete(key);
              if (l.size === 0) {
                  this.byFreq.delete(f);
                  if (this.minFreq === f) this.minFreq = f + 1;
              }
              n.freq = f + 1;
              this.listOf(f + 1).set(key, true);
          };

          LFUCache.prototype.get = function(key) {
              var n = this.node.get(key);
              if (!n) return -1;
              this.touch(key);
              return n.value;
          };

          LFUCache.prototype.put = function(key, value) {
              var n = this.node.get(key);
              if (n) { n.value = value; this.touch(key); return; }
              if (this.node.size === this.cap) {
                  var l = this.byFreq.get(this.minFreq);
                  var old = l.keys().next().value;
                  l.delete(old);
                  if (l.size === 0) this.byFreq.delete(this.minFreq);
                  this.node.delete(old);
              }
              this.node.set(key, { value: value, freq: 1 });
              this.listOf(1).set(key, true);
              this.minFreq = 1;
          };
        `,
        typescript: code`
          // One circular doubly linked list per counter (a sentinel node), least recently used first.
          class LfuNode {
              key: number; value: number; freq: number;
              prev: LfuNode; next: LfuNode;
              constructor(key: number, value: number) {
                  this.key = key; this.value = value; this.freq = 1;
                  this.prev = this; this.next = this;
              }
          }

          class LFUCache {
              cap: number;
              size: number;
              minFreq: number;
              node: { [key: number]: LfuNode };
              lists: { [freq: number]: LfuNode };

              constructor(capacity: number) {
                  this.cap = capacity;
                  this.size = 0;
                  this.minFreq = 0;
                  this.node = {};
                  this.lists = {};
              }

              listOf(f: number): LfuNode {
                  if (this.lists[f] === undefined) this.lists[f] = new LfuNode(-1, -1);
                  return this.lists[f];
              }

              unlink(n: LfuNode): void { n.prev.next = n.next; n.next.prev = n.prev; }

              append(n: LfuNode): void {
                  var s = this.listOf(n.freq);
                  n.prev = s.prev; n.next = s;
                  s.prev.next = n; s.prev = n;
              }

              touch(n: LfuNode): void {
                  this.unlink(n);
                  var s = this.lists[n.freq];
                  if (s.next === s && this.minFreq === n.freq) this.minFreq++;
                  n.freq++;
                  this.append(n);
              }

              get(key: number): number {
                  var n = this.node[key];
                  if (n === undefined) return -1;
                  this.touch(n);
                  return n.value;
              }

              put(key: number, value: number): void {
                  var n = this.node[key];
                  if (n !== undefined) { n.value = value; this.touch(n); return; }
                  if (this.size === this.cap) {
                      var old = this.lists[this.minFreq].next;
                      this.unlink(old);
                      delete this.node[old.key];
                      this.size--;
                  }
                  n = new LfuNode(key, value);
                  this.node[key] = n;
                  this.append(n);
                  this.minFreq = 1;
                  this.size++;
              }
          }
        `,
        java: code`
          class LFUCache {
              private int cap, minFreq = 0;
              private HashMap<Integer, int[]> node = new HashMap<>(); // key -> {value, counter}
              private HashMap<Integer, LinkedHashSet<Integer>> byFreq = new HashMap<>(); // counter -> keys, LRU first

              public LFUCache(int capacity) {
                  cap = capacity;
              }

              private void touch(int key) {
                  int[] n = node.get(key);
                  int f = n[1];
                  LinkedHashSet<Integer> l = byFreq.get(f);
                  l.remove(key);
                  if (l.isEmpty()) {
                      byFreq.remove(f);
                      if (minFreq == f) minFreq = f + 1;
                  }
                  n[1] = f + 1;
                  byFreq.computeIfAbsent(f + 1, k -> new LinkedHashSet<>()).add(key);
              }

              public int get(int key) {
                  int[] n = node.get(key);
                  if (n == null) return -1;
                  touch(key);
                  return n[0];
              }

              public void put(int key, int value) {
                  int[] n = node.get(key);
                  if (n != null) { n[0] = value; touch(key); return; }
                  if (node.size() == cap) {
                      LinkedHashSet<Integer> l = byFreq.get(minFreq);
                      int old = l.iterator().next();
                      l.remove(old);
                      if (l.isEmpty()) byFreq.remove(minFreq);
                      node.remove(old);
                  }
                  node.put(key, new int[]{value, 1});
                  byFreq.computeIfAbsent(1, k -> new LinkedHashSet<>()).add(key);
                  minFreq = 1;
              }
          }
        `,
        cpp: code`
          class LFUCache {
              struct Item { int value, freq; list<int>::iterator pos; };
              int cap, minFreq = 0;
              unordered_map<int, Item> node;         // key -> value, counter, place in its list
              unordered_map<int, list<int>> byFreq;  // counter -> keys, least recently used first

              void touch(Item& it, int key) {
                  int f = it.freq;
                  list<int>& l = byFreq[f];
                  l.erase(it.pos);
                  if (l.empty()) {
                      byFreq.erase(f);
                      if (minFreq == f) minFreq = f + 1;
                  }
                  it.freq = f + 1;
                  list<int>& nl = byFreq[f + 1];
                  it.pos = nl.insert(nl.end(), key);
              }
          public:
              LFUCache(int capacity) : cap(capacity) {}

              int get(int key) {
                  auto f = node.find(key);
                  if (f == node.end()) return -1;
                  touch(f->second, key);
                  return f->second.value;
              }

              void put(int key, int value) {
                  auto f = node.find(key);
                  if (f != node.end()) { f->second.value = value; touch(f->second, key); return; }
                  if ((int)node.size() == cap) {
                      list<int>& l = byFreq[minFreq];
                      int old = l.front();
                      l.pop_front();
                      if (l.empty()) byFreq.erase(minFreq);
                      node.erase(old);
                  }
                  list<int>& l1 = byFreq[1];
                  node[key] = Item{value, 1, l1.insert(l1.end(), key)};
                  minFreq = 1;
              }
          };
        `,
        c: code`
          /* Keys are at most 10^5 and counters at most the 2 * 10^5 calls, so every map
             is an array. Each counter has a doubly linked list of keys, least recently used
             first; links store key + 1 so that calloc's 0 means "none". */
          #define LFU_KEYS 100001
          #define LFU_FREQ 200005

          typedef struct {
              int cap, size, minFreq;
              int *val, *freq, *prv, *nxt; /* per key; freq 0 = not cached */
              int *head, *tail;            /* per counter: key + 1 of the oldest / newest, 0 = empty */
          } LFUCache;

          LFUCache* lFUCacheCreate(int capacity) {
              LFUCache* c = (LFUCache*)malloc(sizeof(LFUCache));
              c->cap = capacity;
              c->size = 0;
              c->minFreq = 0;
              c->val = (int*)calloc(LFU_KEYS, sizeof(int));
              c->freq = (int*)calloc(LFU_KEYS, sizeof(int));
              c->prv = (int*)calloc(LFU_KEYS, sizeof(int));
              c->nxt = (int*)calloc(LFU_KEYS, sizeof(int));
              c->head = (int*)calloc(LFU_FREQ, sizeof(int));
              c->tail = (int*)calloc(LFU_FREQ, sizeof(int));
              return c;
          }

          static void lfuUnlink(LFUCache* c, int k) {
              int f = c->freq[k], p = c->prv[k], n = c->nxt[k];
              if (p) c->nxt[p - 1] = n; else c->head[f] = n;
              if (n) c->prv[n - 1] = p; else c->tail[f] = p;
          }

          static void lfuAppend(LFUCache* c, int k) {
              int f = c->freq[k];
              c->prv[k] = c->tail[f];
              c->nxt[k] = 0;
              if (c->tail[f]) c->nxt[c->tail[f] - 1] = k + 1; else c->head[f] = k + 1;
              c->tail[f] = k + 1;
          }

          static void lfuTouch(LFUCache* c, int k) {
              int f = c->freq[k];
              lfuUnlink(c, k);
              if (!c->head[f] && c->minFreq == f) c->minFreq++;
              c->freq[k] = f + 1;
              lfuAppend(c, k);
          }

          int lFUCacheGet(LFUCache* obj, int key) {
              if (!obj->freq[key]) return -1;
              lfuTouch(obj, key);
              return obj->val[key];
          }

          void lFUCachePut(LFUCache* obj, int key, int value) {
              if (obj->freq[key]) { obj->val[key] = value; lfuTouch(obj, key); return; }
              if (obj->size == obj->cap) {
                  int old = obj->head[obj->minFreq] - 1;
                  lfuUnlink(obj, old);
                  obj->freq[old] = 0;
                  obj->size--;
              }
              obj->val[key] = value;
              obj->freq[key] = 1;
              lfuAppend(obj, key);
              obj->minFreq = 1;
              obj->size++;
          }

          void lFUCacheFree(LFUCache* obj) {
              free(obj->val); free(obj->freq); free(obj->prv); free(obj->nxt);
              free(obj->head); free(obj->tail);
              free(obj);
          }
        `,
        csharp: code`
          public class LFUCache {
              private int cap, minFreq = 0;
              private Dictionary<int, int> val = new Dictionary<int, int>(), freq = new Dictionary<int, int>();
              private Dictionary<int, LinkedListNode<int>> where = new Dictionary<int, LinkedListNode<int>>();
              private Dictionary<int, LinkedList<int>> byFreq = new Dictionary<int, LinkedList<int>>(); // counter -> keys, LRU first

              public LFUCache(int capacity) {
                  cap = capacity;
              }

              private LinkedList<int> ListOf(int f) {
                  LinkedList<int> l;
                  if (!byFreq.TryGetValue(f, out l)) { l = new LinkedList<int>(); byFreq[f] = l; }
                  return l;
              }

              private void Touch(int key) {
                  int f = freq[key];
                  LinkedList<int> l = byFreq[f];
                  l.Remove(where[key]);
                  if (l.Count == 0) {
                      byFreq.Remove(f);
                      if (minFreq == f) minFreq = f + 1;
                  }
                  freq[key] = f + 1;
                  where[key] = ListOf(f + 1).AddLast(key);
              }

              public int Get(int key) {
                  if (!val.ContainsKey(key)) return -1;
                  Touch(key);
                  return val[key];
              }

              public void Put(int key, int value) {
                  if (val.ContainsKey(key)) { val[key] = value; Touch(key); return; }
                  if (val.Count == cap) {
                      LinkedList<int> l = byFreq[minFreq];
                      int old = l.First.Value;
                      l.RemoveFirst();
                      if (l.Count == 0) byFreq.Remove(minFreq);
                      val.Remove(old); freq.Remove(old); where.Remove(old);
                  }
                  val[key] = value;
                  freq[key] = 1;
                  where[key] = ListOf(1).AddLast(key);
                  minFreq = 1;
              }
          }
        `,
        go: code`
          // One circular doubly linked list per counter (a sentinel node), least recently used first.
          type lfuNode struct {
          	key, value, freq int
          	prev, next       *lfuNode
          }

          type LFUCache struct {
          	cap, minFreq int
          	nodes        map[int]*lfuNode
          	lists        map[int]*lfuNode
          }

          func Constructor(capacity int) LFUCache {
          	return LFUCache{cap: capacity, nodes: map[int]*lfuNode{}, lists: map[int]*lfuNode{}}
          }

          func (this *LFUCache) listOf(f int) *lfuNode {
          	s, ok := this.lists[f]
          	if !ok {
          		s = &lfuNode{}
          		s.prev, s.next = s, s
          		this.lists[f] = s
          	}
          	return s
          }

          func lfuUnlink(n *lfuNode) {
          	n.prev.next = n.next
          	n.next.prev = n.prev
          }

          func (this *LFUCache) appendNode(n *lfuNode) {
          	s := this.listOf(n.freq)
          	n.prev, n.next = s.prev, s
          	s.prev.next = n
          	s.prev = n
          }

          func (this *LFUCache) touch(n *lfuNode) {
          	lfuUnlink(n)
          	s := this.lists[n.freq]
          	if s.next == s && this.minFreq == n.freq {
          		this.minFreq++
          	}
          	n.freq++
          	this.appendNode(n)
          }

          func (this *LFUCache) Get(key int) int {
          	n, ok := this.nodes[key]
          	if !ok {
          		return -1
          	}
          	this.touch(n)
          	return n.value
          }

          func (this *LFUCache) Put(key int, value int) {
          	if n, ok := this.nodes[key]; ok {
          		n.value = value
          		this.touch(n)
          		return
          	}
          	if len(this.nodes) == this.cap {
          		old := this.lists[this.minFreq].next
          		lfuUnlink(old)
          		delete(this.nodes, old.key)
          	}
          	n := &lfuNode{key: key, value: value, freq: 1}
          	this.nodes[key] = n
          	this.appendNode(n)
          	this.minFreq = 1
          }
        `,
        kotlin: code`
          class LFUCache(capacity: Int) {
              private val cap = capacity
              private var minFreq = 0
              private val node = HashMap<Int, IntArray>() // key -> {value, counter}
              private val byFreq = HashMap<Int, LinkedHashSet<Int>>() // counter -> keys, LRU first

              private fun touch(key: Int) {
                  val n = node[key]!!
                  val f = n[1]
                  val l = byFreq[f]!!
                  l.remove(key)
                  if (l.isEmpty()) {
                      byFreq.remove(f)
                      if (minFreq == f) minFreq = f + 1
                  }
                  n[1] = f + 1
                  byFreq.getOrPut(f + 1) { LinkedHashSet<Int>() }.add(key)
              }

              fun get(key: Int): Int {
                  val n = node[key] ?: return -1
                  touch(key)
                  return n[0]
              }

              fun put(key: Int, value: Int) {
                  val n = node[key]
                  if (n != null) { n[0] = value; touch(key); return }
                  if (node.size == cap) {
                      val l = byFreq[minFreq]!!
                      val old = l.iterator().next()
                      l.remove(old)
                      if (l.isEmpty()) byFreq.remove(minFreq)
                      node.remove(old)
                  }
                  node[key] = intArrayOf(value, 1)
                  byFreq.getOrPut(1) { LinkedHashSet<Int>() }.add(key)
                  minFreq = 1
              }
          }
        `,
        swift: code`
          // One circular doubly linked list per counter (a sentinel node), least recently used first.
          final class LfuNode {
              var key: Int, value: Int, freq = 1
              var prev: LfuNode!
              var next: LfuNode!
              init(_ key: Int, _ value: Int) { self.key = key; self.value = value }
          }

          class LFUCache {
              let cap: Int
              var minFreq = 0
              var nodes: [Int: LfuNode] = [:]
              var lists: [Int: LfuNode] = [:]

              init(_ capacity: Int) { cap = capacity }

              func listOf(_ f: Int) -> LfuNode {
                  if let s = lists[f] { return s }
                  let s = LfuNode(-1, -1)
                  s.prev = s
                  s.next = s
                  lists[f] = s
                  return s
              }

              func unlink(_ n: LfuNode) {
                  n.prev.next = n.next
                  n.next.prev = n.prev
              }

              func append(_ n: LfuNode) {
                  let s = listOf(n.freq)
                  n.prev = s.prev
                  n.next = s
                  s.prev.next = n
                  s.prev = n
              }

              func touch(_ n: LfuNode) {
                  unlink(n)
                  let s = lists[n.freq]!
                  if s.next === s && minFreq == n.freq { minFreq += 1 }
                  n.freq += 1
                  append(n)
              }

              func get(_ key: Int) -> Int {
                  guard let n = nodes[key] else { return -1 }
                  touch(n)
                  return n.value
              }

              func put(_ key: Int, _ value: Int) {
                  if let n = nodes[key] {
                      n.value = value
                      touch(n)
                      return
                  }
                  if nodes.count == cap {
                      let old: LfuNode = lists[minFreq]!.next
                      unlink(old)
                      nodes[old.key] = nil
                  }
                  let n = LfuNode(key, value)
                  nodes[key] = n
                  append(n)
                  minFreq = 1
              }
          }
        `,
        rust: code`
          use std::collections::{BTreeSet, HashMap};

          // The eviction order as an ordered set of (counter, last use, key): its first
          // element is the least frequently used key, ties broken by the oldest use.
          struct LFUCache {
              cap: usize,
              clock: u64,
              items: HashMap<i32, (i32, i32, u64)>, // key -> (value, counter, last use)
              order: BTreeSet<(i32, u64, i32)>,
          }

          impl LFUCache {
              fn new(capacity: i32) -> Self {
                  LFUCache { cap: capacity as usize, clock: 0, items: HashMap::new(), order: BTreeSet::new() }
              }

              fn touch(&mut self, key: i32) -> i32 {
                  self.clock += 1;
                  let clock = self.clock;
                  let it = self.items.get_mut(&key).unwrap();
                  self.order.remove(&(it.1, it.2, key));
                  it.1 += 1;
                  it.2 = clock;
                  self.order.insert((it.1, it.2, key));
                  it.0
              }

              fn get(&mut self, key: i32) -> i32 {
                  if !self.items.contains_key(&key) { return -1; }
                  self.touch(key)
              }

              fn put(&mut self, key: i32, value: i32) {
                  if self.items.contains_key(&key) {
                      self.items.get_mut(&key).unwrap().0 = value;
                      self.touch(key);
                      return;
                  }
                  if self.items.len() == self.cap {
                      let first = *self.order.iter().next().unwrap();
                      self.order.remove(&first);
                      self.items.remove(&first.2);
                  }
                  self.clock += 1;
                  self.items.insert(key, (value, 1, self.clock));
                  self.order.insert((1, self.clock, key));
              }
          }
        `,
        php: code`
          // PHP arrays keep insertion order, so each counter's array of keys is an LRU list.
          class LFUCache {
              private $cap;
              private $minFreq = 0;
              private $node = [];   // key -> [value, counter]
              private $byFreq = []; // counter -> [key => true], least recently used first

              function __construct($capacity) {
                  $this->cap = $capacity;
              }

              private function touch($key) {
                  $f = $this->node[$key][1];
                  unset($this->byFreq[$f][$key]);
                  if (count($this->byFreq[$f]) === 0) {
                      unset($this->byFreq[$f]);
                      if ($this->minFreq === $f) $this->minFreq = $f + 1;
                  }
                  $this->node[$key][1] = $f + 1;
                  $this->byFreq[$f + 1][$key] = true;
              }

              function get($key) {
                  if (!isset($this->node[$key])) return -1;
                  $this->touch($key);
                  return $this->node[$key][0];
              }

              function put($key, $value) {
                  if (isset($this->node[$key])) {
                      $this->node[$key][0] = $value;
                      $this->touch($key);
                      return;
                  }
                  if (count($this->node) === $this->cap) {
                      $old = array_key_first($this->byFreq[$this->minFreq]);
                      unset($this->byFreq[$this->minFreq][$old]);
                      if (count($this->byFreq[$this->minFreq]) === 0) unset($this->byFreq[$this->minFreq]);
                      unset($this->node[$old]);
                  }
                  $this->node[$key] = [$value, 1];
                  $this->byFreq[1][$key] = true;
                  $this->minFreq = 1;
              }
          }
        `,
        ruby: code`
          # Ruby hashes keep insertion order, so each counter's hash of keys is an LRU list.
          class LFUCache
            def initialize(capacity)
              @cap = capacity
              @min_freq = 0
              @node = {}    # key -> [value, counter]
              @by_freq = {} # counter -> { key => true }, least recently used first
            end

            def touch(key)
              f = @node[key][1]
              l = @by_freq[f]
              l.delete(key)
              if l.empty?
                @by_freq.delete(f)
                @min_freq = f + 1 if @min_freq == f
              end
              @node[key][1] = f + 1
              (@by_freq[f + 1] ||= {})[key] = true
            end

            def get(key)
              return -1 unless @node.key?(key)
              touch(key)
              @node[key][0]
            end

            def put(key, value)
              if @node.key?(key)
                @node[key][0] = value
                touch(key)
                return
              end
              if @node.size == @cap
                l = @by_freq[@min_freq]
                old, = l.shift
                @by_freq.delete(@min_freq) if l.empty?
                @node.delete(old)
              end
              @node[key] = [value, 1]
              (@by_freq[1] ||= {})[key] = true
              @min_freq = 1
            end
          end
        `,
      },
    };
  })(),

  // ── Range Module (LC 715) ─────────────────────────────────────────
  (() => {
    const run: Run = (ops, args) => {
      let iv: number[][] = []; // disjoint, sorted, touching ones merged
      const norm = (list: number[][]) => {
        list.sort((a, b) => a[0] - b[0]);
        const out: number[][] = [];
        for (const [a, b] of list) {
          if (out.length && a <= out[out.length - 1][1]) out[out.length - 1][1] = Math.max(out[out.length - 1][1], b);
          else out.push([a, b]);
        }
        return out;
      };
      return ops.map((op, i) => {
        const [l, r] = args[i];
        if (op === "addRange") { iv = norm(iv.concat([[l, r]])); return null; }
        if (op === "removeRange") {
          const out: number[][] = [];
          for (const [a, b] of iv) {
            if (b <= l || a >= r) { out.push([a, b]); continue; }
            if (a < l) out.push([a, l]);
            if (b > r) out.push([r, b]);
          }
          iv = norm(out);
          return null;
        }
        if (op === "queryRange") return iv.some(([a, b]) => a <= l && r <= b);
        return null;
      });
    };
    const ex = [
      { ops: ["RangeModule", "addRange", "removeRange", "queryRange", "queryRange", "queryRange"], args: [[], [5, 15], [8, 10], [5, 8], [6, 11], [10, 15]] },
      { ops: ["RangeModule", "addRange", "addRange", "queryRange", "removeRange", "queryRange", "queryRange"], args: [[], [1, 3], [3, 1000000000], [2, 999999999], [1, 1000000000], [1, 2], [5, 6]] },
    ];
    return {
      slug: "range-module",
      title: "Range Module",
      difficulty: "HARD" as const,
      tags: ["Segment Tree", "Ordered Set", "Design", "Binary Search", "Google", "Amazon", "Uber"],
      signature: {
        funcName: "RangeModule", params: [], returns: "void" as const,
        methods: [
          { name: "addRange", params: [{ name: "left", type: "int" as const }, { name: "right", type: "int" as const }], returns: "void" as const },
          { name: "queryRange", params: [{ name: "left", type: "int" as const }, { name: "right", type: "int" as const }], returns: "bool" as const },
          { name: "removeRange", params: [{ name: "left", type: "int" as const }, { name: "right", type: "int" as const }], returns: "void" as const },
        ],
      },
      description: describe(
        "A range module tracks which real numbers are currently covered. Every range is **half-open**: `[left, right)` contains every `x` with `left <= x < right`.\n\nWrite the class `RangeModule`:\n\n- `RangeModule()` starts with nothing tracked.\n- `void addRange(int left, int right)` starts tracking every number in `[left, right)`. Parts that are already tracked stay tracked.\n- `boolean queryRange(int left, int right)` returns `true` if **every** number in `[left, right)` is currently tracked.\n- `void removeRange(int left, int right)` stops tracking every number in `[left, right)` that is currently tracked.\n\n" + CALLS,
        [
          exampleOf(run, ex[0].ops, ex[0].args, "After removing [8, 10) from [5, 15), the tracked numbers are [5, 8) and [10, 15). [5, 8) is covered, [6, 11) has a gap at [8, 10), and [10, 15) is covered."),
          exampleOf(run, ex[1].ops, ex[1].args, "[1, 3) and [3, 10^9) touch, so together they cover [1, 10^9). Removing [1, 10^9) clears everything."),
        ],
        ["1 <= left < right <= 10^9", "At most 10^4 calls are made in total to addRange, queryRange and removeRange"]),
      hints: [
        "Store the tracked numbers as a sorted list of disjoint intervals; merge intervals that overlap or touch so that every maximal tracked stretch is one interval.",
        "`queryRange(l, r)` is then a single check: the last interval starting at or before `l` must end at or after `r`.",
        "Both updates affect one contiguous block of intervals, which two binary searches find. `addRange` replaces that block by one merged interval; `removeRange` replaces it by at most two leftover pieces.",
      ],
      editorial: explain({
        idea: "Keep the tracked set as sorted, disjoint, non-touching half-open intervals. Every operation locates the block of intervals it concerns with binary search and rewrites only that block.",
        steps: [
          "`addRange(l, r)`: let `i` be the first interval whose end is `>= l` and `j` the first whose start is `> r`. Intervals `i..j-1` overlap or touch `[l, r)`; replace them with `[min(l, start[i]), max(r, end[j-1]))` (or just insert `[l, r)` at `i` when the block is empty).",
          "`removeRange(l, r)`: let `i` be the first interval whose end is `> l` and `j` the first whose start is `>= r`. Replace intervals `i..j-1` with what survives of them: `[start[i], l)` if `start[i] < l`, and `[r, end[j-1])` if `end[j-1] > r`.",
          "`queryRange(l, r)`: take the last interval whose start is `<= l`; the answer is whether it exists and its end is `>= r`.",
        ],
        why: "Because intervals are disjoint and sorted, both their starts and their ends are increasing, so \"the intervals meeting `[l, r]`\" is one contiguous index range found by binary search. Merging touching intervals means a covered stretch is always a single interval, which is why one interval must contain `[l, r)` for a query to succeed — no union of two stored intervals can cover more than either does alone.",
        time: "O(log n) to locate plus O(n) to splice an array (O(log n) amortised with a balanced tree), where n is the number of stored intervals",
        space: "O(n)",
        pitfalls: [
          "The ranges are half-open: `[1, 3)` and `[3, 5)` together cover `[1, 5)`, but `[1, 3)` does not contain 3.",
          "In `removeRange`, an interval that only touches the removed range (ends exactly at `l` or starts exactly at `r`) must be left untouched — use strict comparisons there.",
        ],
      }),
      examples: ex.map((e) => caseOf(run, e.ops, e.args)),
      gen: (rng: Rng) => {
        const top = pick(rng, [8, 20, 60, 1000000000]);
        const ops = ["RangeModule"], args: Args = [[]];
        const span = () => {
          const a = ri(rng, 1, top - 1);
          const len = top > 100 && rng() < 0.7 ? ri(rng, 1, Math.floor(top / pick(rng, [2, 10, 1000]))) : ri(rng, 1, Math.max(1, Math.floor(top / 3)));
          return [a, Math.min(top, a + len)];
        };
        for (let m = ri(rng, 1, pick(rng, [5, 20, 40])); m > 0; m--) {
          const r = rng();
          ops.push(r < 0.35 ? "addRange" : r < 0.6 ? "removeRange" : "queryRange");
          args.push(span());
        }
        return caseOf(run, ops, args);
      },
      solutions: {
        python: code`
          from bisect import bisect_left, bisect_right

          class RangeModule:

              def __init__(self):
                  self.starts = []  # disjoint, non-touching half-open intervals, sorted
                  self.ends = []

              def addRange(self, left: int, right: int) -> None:
                  i = bisect_left(self.ends, left)     # first interval ending at or after left
                  j = bisect_right(self.starts, right) # first interval starting after right
                  if i < j:
                      left = min(left, self.starts[i])
                      right = max(right, self.ends[j - 1])
                  self.starts[i:j] = [left]
                  self.ends[i:j] = [right]

              def queryRange(self, left: int, right: int) -> bool:
                  k = bisect_right(self.starts, left) - 1  # last interval starting at or before left
                  return k >= 0 and self.ends[k] >= right

              def removeRange(self, left: int, right: int) -> None:
                  i = bisect_right(self.ends, left)    # first interval ending after left
                  j = bisect_left(self.starts, right)  # first interval starting at or after right
                  if i >= j:
                      return
                  ns, ne = [], []
                  if self.starts[i] < left:
                      ns.append(self.starts[i])
                      ne.append(left)
                  if self.ends[j - 1] > right:
                      ns.append(right)
                      ne.append(self.ends[j - 1])
                  self.starts[i:j] = ns
                  self.ends[i:j] = ne
        `,
        javascript: code`
          // first index whose value is >= x (strict: > x) in a sorted array
          function rmBound(a, x, strict) {
              var lo = 0, hi = a.length;
              while (lo < hi) {
                  var mid = (lo + hi) >> 1;
                  if (strict ? a[mid] <= x : a[mid] < x) lo = mid + 1; else hi = mid;
              }
              return lo;
          }

          var RangeModule = function() {
              this.starts = []; // disjoint, non-touching half-open intervals, sorted
              this.ends = [];
          };

          RangeModule.prototype.addRange = function(left, right) {
              var i = rmBound(this.ends, left, false), j = rmBound(this.starts, right, true);
              if (i < j) {
                  left = Math.min(left, this.starts[i]);
                  right = Math.max(right, this.ends[j - 1]);
              }
              this.starts.splice(i, j - i, left);
              this.ends.splice(i, j - i, right);
          };

          RangeModule.prototype.queryRange = function(left, right) {
              var k = rmBound(this.starts, left, true) - 1;
              return k >= 0 && this.ends[k] >= right;
          };

          RangeModule.prototype.removeRange = function(left, right) {
              var i = rmBound(this.ends, left, true), j = rmBound(this.starts, right, false);
              if (i >= j) return;
              var ns = [], ne = [];
              if (this.starts[i] < left) { ns.push(this.starts[i]); ne.push(left); }
              if (this.ends[j - 1] > right) { ns.push(right); ne.push(this.ends[j - 1]); }
              Array.prototype.splice.apply(this.starts, [i, j - i].concat(ns));
              Array.prototype.splice.apply(this.ends, [i, j - i].concat(ne));
          };
        `,
        typescript: code`
          class RangeModule {
              starts: number[]; // disjoint, non-touching half-open intervals, sorted
              ends: number[];

              constructor() {
                  this.starts = [];
                  this.ends = [];
              }

              bound(a: number[], x: number, strict: boolean): number { // first index >= x (strict: > x)
                  var lo = 0, hi = a.length;
                  while (lo < hi) {
                      var mid = (lo + hi) >> 1;
                      if (strict ? a[mid] <= x : a[mid] < x) lo = mid + 1; else hi = mid;
                  }
                  return lo;
              }

              addRange(left: number, right: number): void {
                  var i = this.bound(this.ends, left, false), j = this.bound(this.starts, right, true);
                  if (i < j) {
                      left = Math.min(left, this.starts[i]);
                      right = Math.max(right, this.ends[j - 1]);
                  }
                  this.starts.splice(i, j - i, left);
                  this.ends.splice(i, j - i, right);
              }

              queryRange(left: number, right: number): boolean {
                  var k = this.bound(this.starts, left, true) - 1;
                  return k >= 0 && this.ends[k] >= right;
              }

              removeRange(left: number, right: number): void {
                  var i = this.bound(this.ends, left, true), j = this.bound(this.starts, right, false);
                  if (i >= j) return;
                  var s0 = this.starts[i], e1 = this.ends[j - 1];
                  this.starts.splice(i, j - i);
                  this.ends.splice(i, j - i);
                  if (e1 > right) { this.starts.splice(i, 0, right); this.ends.splice(i, 0, e1); }
                  if (s0 < left) { this.starts.splice(i, 0, s0); this.ends.splice(i, 0, left); }
              }
          }
        `,
        java: code`
          class RangeModule {
              private ArrayList<Integer> starts = new ArrayList<>(), ends = new ArrayList<>(); // disjoint, non-touching, sorted

              public RangeModule() {
              }

              private static int bound(ArrayList<Integer> a, int x, boolean strict) { // first index >= x (strict: > x)
                  int lo = 0, hi = a.size();
                  while (lo < hi) {
                      int mid = (lo + hi) >>> 1;
                      int v = a.get(mid);
                      if (strict ? v <= x : v < x) lo = mid + 1; else hi = mid;
                  }
                  return lo;
              }

              public void addRange(int left, int right) {
                  int i = bound(ends, left, false), j = bound(starts, right, true);
                  if (i < j) {
                      left = Math.min(left, starts.get(i));
                      right = Math.max(right, ends.get(j - 1));
                  }
                  starts.subList(i, j).clear();
                  ends.subList(i, j).clear();
                  starts.add(i, left);
                  ends.add(i, right);
              }

              public boolean queryRange(int left, int right) {
                  int k = bound(starts, left, true) - 1;
                  return k >= 0 && ends.get(k) >= right;
              }

              public void removeRange(int left, int right) {
                  int i = bound(ends, left, true), j = bound(starts, right, false);
                  if (i >= j) return;
                  int s0 = starts.get(i), e1 = ends.get(j - 1);
                  starts.subList(i, j).clear();
                  ends.subList(i, j).clear();
                  if (e1 > right) { starts.add(i, right); ends.add(i, e1); }
                  if (s0 < left) { starts.add(i, s0); ends.add(i, left); }
              }
          }
        `,
        cpp: code`
          class RangeModule {
              map<int, int> iv; // start -> end: disjoint, non-touching half-open intervals
          public:
              RangeModule() {}

              void addRange(int left, int right) {
                  auto it = iv.upper_bound(left);
                  if (it != iv.begin() && prev(it)->second >= left) --it; // the interval before touches [left, right)
                  while (it != iv.end() && it->first <= right) {
                      left = min(left, it->first);
                      right = max(right, it->second);
                      it = iv.erase(it);
                  }
                  iv[left] = right;
              }

              bool queryRange(int left, int right) {
                  auto it = iv.upper_bound(left);
                  if (it == iv.begin()) return false;
                  return prev(it)->second >= right;
              }

              void removeRange(int left, int right) {
                  auto it = iv.upper_bound(left);
                  if (it != iv.begin() && prev(it)->second > left) --it; // the interval before overlaps
                  int s0 = -1, e1 = -1;
                  while (it != iv.end() && it->first < right) {
                      if (it->first < left) s0 = it->first;
                      if (it->second > right) e1 = it->second;
                      it = iv.erase(it);
                  }
                  if (s0 >= 0) iv[s0] = left;
                  if (e1 >= 0) iv[right] = e1;
              }
          };
        `,
        c: code`
          typedef struct {
              int *starts, *ends; /* disjoint, non-touching half-open intervals, sorted */
              int n, cap;
          } RangeModule;

          RangeModule* rangeModuleCreate() {
              RangeModule* m = (RangeModule*)malloc(sizeof(RangeModule));
              m->n = 0;
              m->cap = 16;
              m->starts = (int*)malloc(m->cap * sizeof(int));
              m->ends = (int*)malloc(m->cap * sizeof(int));
              return m;
          }

          static int rmBound(int* a, int n, int x, int strict) { /* first index >= x (strict: > x) */
              int lo = 0, hi = n;
              while (lo < hi) {
                  int mid = (lo + hi) / 2;
                  if (strict ? a[mid] <= x : a[mid] < x) lo = mid + 1; else hi = mid;
              }
              return lo;
          }

          /* Replace intervals [i, j) with the k intervals (ns[t], ne[t]). */
          static void rmSplice(RangeModule* m, int i, int j, int* ns, int* ne, int k) {
              int newN = m->n - (j - i) + k;
              if (newN > m->cap) {
                  while (newN > m->cap) m->cap *= 2;
                  m->starts = (int*)realloc(m->starts, m->cap * sizeof(int));
                  m->ends = (int*)realloc(m->ends, m->cap * sizeof(int));
              }
              memmove(m->starts + i + k, m->starts + j, (m->n - j) * sizeof(int));
              memmove(m->ends + i + k, m->ends + j, (m->n - j) * sizeof(int));
              for (int t = 0; t < k; t++) { m->starts[i + t] = ns[t]; m->ends[i + t] = ne[t]; }
              m->n = newN;
          }

          void rangeModuleAddRange(RangeModule* obj, int left, int right) {
              int i = rmBound(obj->ends, obj->n, left, 0), j = rmBound(obj->starts, obj->n, right, 1);
              if (i < j) {
                  if (obj->starts[i] < left) left = obj->starts[i];
                  if (obj->ends[j - 1] > right) right = obj->ends[j - 1];
              }
              rmSplice(obj, i, j, &left, &right, 1);
          }

          bool rangeModuleQueryRange(RangeModule* obj, int left, int right) {
              int k = rmBound(obj->starts, obj->n, left, 1) - 1;
              return k >= 0 && obj->ends[k] >= right;
          }

          void rangeModuleRemoveRange(RangeModule* obj, int left, int right) {
              int i = rmBound(obj->ends, obj->n, left, 1), j = rmBound(obj->starts, obj->n, right, 0);
              if (i >= j) return;
              int ns[2], ne[2], k = 0;
              if (obj->starts[i] < left) { ns[k] = obj->starts[i]; ne[k] = left; k++; }
              if (obj->ends[j - 1] > right) { ns[k] = right; ne[k] = obj->ends[j - 1]; k++; }
              rmSplice(obj, i, j, ns, ne, k);
          }

          void rangeModuleFree(RangeModule* obj) {
              free(obj->starts);
              free(obj->ends);
              free(obj);
          }
        `,
        csharp: code`
          public class RangeModule {
              private List<int> starts = new List<int>(), ends = new List<int>(); // disjoint, non-touching, sorted

              public RangeModule() {
              }

              private static int Bound(List<int> a, int x, bool strict) { // first index >= x (strict: > x)
                  int lo = 0, hi = a.Count;
                  while (lo < hi) {
                      int mid = (lo + hi) / 2;
                      if (strict ? a[mid] <= x : a[mid] < x) lo = mid + 1; else hi = mid;
                  }
                  return lo;
              }

              public void AddRange(int left, int right) {
                  int i = Bound(ends, left, false), j = Bound(starts, right, true);
                  if (i < j) {
                      left = Math.Min(left, starts[i]);
                      right = Math.Max(right, ends[j - 1]);
                  }
                  starts.RemoveRange(i, j - i);
                  ends.RemoveRange(i, j - i);
                  starts.Insert(i, left);
                  ends.Insert(i, right);
              }

              public bool QueryRange(int left, int right) {
                  int k = Bound(starts, left, true) - 1;
                  return k >= 0 && ends[k] >= right;
              }

              public void RemoveRange(int left, int right) {
                  int i = Bound(ends, left, true), j = Bound(starts, right, false);
                  if (i >= j) return;
                  int s0 = starts[i], e1 = ends[j - 1];
                  starts.RemoveRange(i, j - i);
                  ends.RemoveRange(i, j - i);
                  if (e1 > right) { starts.Insert(i, right); ends.Insert(i, e1); }
                  if (s0 < left) { starts.Insert(i, s0); ends.Insert(i, left); }
              }
          }
        `,
        go: code`
          type RangeModule struct {
          	starts, ends []int // disjoint, non-touching half-open intervals, sorted
          }

          func Constructor() RangeModule {
          	return RangeModule{}
          }

          // splice replaces intervals [i, j) with the given ones.
          func (this *RangeModule) splice(i, j int, ns, ne []int) {
          	s := append(append(append([]int{}, this.starts[:i]...), ns...), this.starts[j:]...)
          	e := append(append(append([]int{}, this.ends[:i]...), ne...), this.ends[j:]...)
          	this.starts, this.ends = s, e
          }

          func (this *RangeModule) AddRange(left int, right int) {
          	i := sort.SearchInts(this.ends, left)      // first interval ending at or after left
          	j := sort.SearchInts(this.starts, right+1) // first interval starting after right
          	if i < j {
          		if this.starts[i] < left {
          			left = this.starts[i]
          		}
          		if this.ends[j-1] > right {
          			right = this.ends[j-1]
          		}
          	}
          	this.splice(i, j, []int{left}, []int{right})
          }

          func (this *RangeModule) QueryRange(left int, right int) bool {
          	k := sort.SearchInts(this.starts, left+1) - 1 // last interval starting at or before left
          	return k >= 0 && this.ends[k] >= right
          }

          func (this *RangeModule) RemoveRange(left int, right int) {
          	i := sort.SearchInts(this.ends, left+1)  // first interval ending after left
          	j := sort.SearchInts(this.starts, right) // first interval starting at or after right
          	if i >= j {
          		return
          	}
          	ns, ne := []int{}, []int{}
          	if this.starts[i] < left {
          		ns, ne = append(ns, this.starts[i]), append(ne, left)
          	}
          	if this.ends[j-1] > right {
          		ns, ne = append(ns, right), append(ne, this.ends[j-1])
          	}
          	this.splice(i, j, ns, ne)
          }
        `,
        kotlin: code`
          class RangeModule() {
              private val iv = java.util.TreeMap<Int, Int>() // start -> end: disjoint, non-touching half-open intervals

              fun addRange(left: Int, right: Int) {
                  var l = left
                  var r = right
                  val before = iv.floorEntry(l)
                  if (before != null && before.value >= l) l = before.key
                  while (true) {
                      val e = iv.ceilingEntry(l) ?: break
                      if (e.key > r) break
                      r = maxOf(r, e.value)
                      iv.remove(e.key)
                  }
                  iv[l] = r
              }

              fun queryRange(left: Int, right: Int): Boolean {
                  val e = iv.floorEntry(left) ?: return false
                  return e.value >= right
              }

              fun removeRange(left: Int, right: Int) {
                  val before = iv.lowerEntry(left)
                  if (before != null && before.value > left) {
                      iv[before.key] = left
                      if (before.value > right) iv[right] = before.value
                  }
                  while (true) {
                      val e = iv.ceilingEntry(left) ?: break
                      if (e.key >= right) break
                      iv.remove(e.key)
                      if (e.value > right) iv[right] = e.value
                  }
              }
          }
        `,
        swift: code`
          class RangeModule {
              var starts: [Int] = [] // disjoint, non-touching half-open intervals, sorted
              var ends: [Int] = []

              init() {}

              func bound(_ a: [Int], _ x: Int, _ strict: Bool) -> Int { // first index >= x (strict: > x)
                  var lo = 0, hi = a.count
                  while lo < hi {
                      let mid = (lo + hi) / 2
                      if strict ? a[mid] <= x : a[mid] < x { lo = mid + 1 } else { hi = mid }
                  }
                  return lo
              }

              func addRange(_ left: Int, _ right: Int) {
                  let i = bound(ends, left, false), j = bound(starts, right, true)
                  var l = left, r = right
                  if i < j {
                      l = min(l, starts[i])
                      r = max(r, ends[j - 1])
                  }
                  starts.replaceSubrange(i..<j, with: [l])
                  ends.replaceSubrange(i..<j, with: [r])
              }

              func queryRange(_ left: Int, _ right: Int) -> Bool {
                  let k = bound(starts, left, true) - 1
                  return k >= 0 && ends[k] >= right
              }

              func removeRange(_ left: Int, _ right: Int) {
                  let i = bound(ends, left, true), j = bound(starts, right, false)
                  if i >= j { return }
                  var ns: [Int] = [], ne: [Int] = []
                  if starts[i] < left { ns.append(starts[i]); ne.append(left) }
                  if ends[j - 1] > right { ns.append(right); ne.append(ends[j - 1]) }
                  starts.replaceSubrange(i..<j, with: ns)
                  ends.replaceSubrange(i..<j, with: ne)
              }
          }
        `,
        rust: code`
          struct RangeModule {
              starts: Vec<i32>, // disjoint, non-touching half-open intervals, sorted
              ends: Vec<i32>,
          }

          // first index whose value is >= x (strict: > x)
          fn rm_bound(a: &[i32], x: i32, strict: bool) -> usize {
              let (mut lo, mut hi) = (0usize, a.len());
              while lo < hi {
                  let mid = (lo + hi) / 2;
                  if if strict { a[mid] <= x } else { a[mid] < x } { lo = mid + 1; } else { hi = mid; }
              }
              lo
          }

          impl RangeModule {
              fn new() -> Self { RangeModule { starts: Vec::new(), ends: Vec::new() } }

              fn addRange(&mut self, left: i32, right: i32) {
                  let i = rm_bound(&self.ends, left, false);
                  let j = rm_bound(&self.starts, right, true);
                  let (mut l, mut r) = (left, right);
                  if i < j {
                      l = l.min(self.starts[i]);
                      r = r.max(self.ends[j - 1]);
                  }
                  self.starts.splice(i..j, vec![l]);
                  self.ends.splice(i..j, vec![r]);
              }

              fn queryRange(&mut self, left: i32, right: i32) -> bool {
                  let k = rm_bound(&self.starts, left, true);
                  k > 0 && self.ends[k - 1] >= right
              }

              fn removeRange(&mut self, left: i32, right: i32) {
                  let i = rm_bound(&self.ends, left, true);
                  let j = rm_bound(&self.starts, right, false);
                  if i >= j { return; }
                  let (mut ns, mut ne) = (Vec::new(), Vec::new());
                  if self.starts[i] < left { ns.push(self.starts[i]); ne.push(left); }
                  if self.ends[j - 1] > right { ns.push(right); ne.push(self.ends[j - 1]); }
                  self.starts.splice(i..j, ns);
                  self.ends.splice(i..j, ne);
              }
          }
        `,
        php: code`
          class RangeModule {
              private $starts = []; // disjoint, non-touching half-open intervals, sorted
              private $ends = [];

              function __construct() {
              }

              private function bound($a, $x, $strict) { // first index >= x (strict: > x)
                  $lo = 0;
                  $hi = count($a);
                  while ($lo < $hi) {
                      $mid = ($lo + $hi) >> 1;
                      if ($strict ? $a[$mid] <= $x : $a[$mid] < $x) $lo = $mid + 1; else $hi = $mid;
                  }
                  return $lo;
              }

              function addRange($left, $right) {
                  $i = $this->bound($this->ends, $left, false);
                  $j = $this->bound($this->starts, $right, true);
                  if ($i < $j) {
                      $left = min($left, $this->starts[$i]);
                      $right = max($right, $this->ends[$j - 1]);
                  }
                  array_splice($this->starts, $i, $j - $i, [$left]);
                  array_splice($this->ends, $i, $j - $i, [$right]);
              }

              function queryRange($left, $right) {
                  $k = $this->bound($this->starts, $left, true) - 1;
                  return $k >= 0 && $this->ends[$k] >= $right;
              }

              function removeRange($left, $right) {
                  $i = $this->bound($this->ends, $left, true);
                  $j = $this->bound($this->starts, $right, false);
                  if ($i >= $j) return;
                  $ns = [];
                  $ne = [];
                  if ($this->starts[$i] < $left) { $ns[] = $this->starts[$i]; $ne[] = $left; }
                  if ($this->ends[$j - 1] > $right) { $ns[] = $right; $ne[] = $this->ends[$j - 1]; }
                  array_splice($this->starts, $i, $j - $i, $ns);
                  array_splice($this->ends, $i, $j - $i, $ne);
              }
          }
        `,
        ruby: code`
          class RangeModule
            def initialize
              @starts = [] # disjoint, non-touching half-open intervals, sorted
              @ends = []
            end

            def addRange(left, right)
              i = @ends.bsearch_index { |e| e >= left } || @ends.length
              j = @starts.bsearch_index { |s| s > right } || @starts.length
              if i < j
                left = [left, @starts[i]].min
                right = [right, @ends[j - 1]].max
              end
              @starts[i...j] = [left]
              @ends[i...j] = [right]
            end

            def queryRange(left, right)
              k = (@starts.bsearch_index { |s| s > left } || @starts.length) - 1
              k >= 0 && @ends[k] >= right
            end

            def removeRange(left, right)
              i = @ends.bsearch_index { |e| e > left } || @ends.length
              j = @starts.bsearch_index { |s| s >= right } || @starts.length
              return if i >= j
              ns = []
              ne = []
              if @starts[i] < left
                ns << @starts[i]
                ne << left
              end
              if @ends[j - 1] > right
                ns << right
                ne << @ends[j - 1]
              end
              @starts[i...j] = ns
              @ends[i...j] = ne
            end
          end
        `,
      },
    };
  })(),

  // ── Prefix and Suffix Search (LC 745) ─────────────────────────────
  (() => {
    const run: Run = (ops, args) => {
      let words: string[] = [];
      return ops.map((op, i) => {
        if (op === "WordFilter") { words = args[i][0]; return null; }
        if (op === "f") {
          const [p, s] = args[i];
          for (let j = words.length - 1; j >= 0; j--) if (words[j].startsWith(p) && words[j].endsWith(s)) return j;
          return -1;
        }
        return null;
      });
    };
    const ex = [
      { ops: ["WordFilter", "f", "f", "f", "f", "f"], args: [[["dosa", "dal", "salad", "sad"]], ["d", "a"], ["sa", "d"], ["s", "lad"], ["da", "sa"], ["dosa", "dosa"]] },
      { ops: ["WordFilter", "f", "f"], args: [[["aa", "aa"]], ["a", "a"], ["aaa", "a"]] },
    ];
    return {
      slug: "prefix-and-suffix-search",
      title: "Prefix and Suffix Search",
      difficulty: "HARD" as const,
      tags: ["Array", "Hash Table", "String", "Design", "Trie", "Google", "Meta"],
      signature: {
        funcName: "WordFilter", params: [{ name: "words", type: "string[]" as const }], returns: "void" as const,
        methods: [{ name: "f", params: [{ name: "pref", type: "string" as const }, { name: "suff", type: "string" as const }], returns: "int" as const }],
      },
      description: describe(
        "Build a dictionary that finds words by a given prefix **and** a given suffix at the same time.\n\nWrite the class `WordFilter`:\n\n- `WordFilter(String[] words)` stores the dictionary; word `i` is `words[i]`.\n- `int f(String pref, String suff)` returns the **largest index** `i` such that `words[i]` starts with `pref` and ends with `suff`, or `-1` if no word does. A whole word counts as its own prefix and suffix.\n\n" + CALLS,
        [
          exampleOf(run, ex[0].ops, ex[0].args, "\"dosa\" starts with d and ends with a. Both \"salad\" and \"sad\" fit (sa…d); the larger index, 3, wins. Only \"salad\" ends with \"lad\". No word starts with \"da\" and ends with \"sa\"."),
          exampleOf(run, ex[1].ops, ex[1].args, "The same word may appear twice; the later copy has the larger index. No word is long enough to start with \"aaa\"."),
        ],
        ["1 <= words.length <= 10^4", "1 <= words[i].length <= 7", "1 <= pref.length, suff.length <= 7", "words[i], pref and suff consist of lowercase English letters only", "At most 10^4 calls are made to f"]),
      hints: [
        "Words are at most 7 letters long, so each word has at most 7 non-empty prefixes and 7 non-empty suffixes — at most 49 (prefix, suffix) pairs.",
        "Precompute an answer for every pair: a hash map from `prefix + '#' + suffix` to the index of the word. Insert the words in order so a later word overwrites an earlier one.",
        "A trie works too: for each word insert `suffix + '{' + word` for every suffix, storing the latest index in each node; a query walks `suff + '{' + pref`.",
      ],
      editorial: explain({
        idea: "Because words are tiny (length ≤ 7), we can afford to list every (prefix, suffix) pair of every word in advance and map it to the largest index that has it. Each query is then one hash lookup.",
        steps: [
          "For each word `w` at index `i`, in increasing `i`, and for every prefix length `a` and suffix length `b` from 1 to `len(w)`: set `map[w[0:a] + '#' + w[len-b:]] = i`.",
          "`f(pref, suff)`: return `map[pref + '#' + suff]` if present, otherwise `-1`.",
        ],
        why: "A word matches the query exactly when `pref` is one of its prefixes and `suff` one of its suffixes, i.e. when the key `pref#suff` was generated by it. Processing indices in increasing order and overwriting leaves the largest matching index in the map. The separator `#` cannot occur in a word, so different (prefix, suffix) pairs never produce the same key.",
        time: "O(N · L^3) to build (N words, L ≤ 7, building each key costs O(L)); O(L) per query",
        space: "O(N · L^3)",
        pitfalls: [
          "Without a separator, `\"ab\" + \"c\"` and `\"a\" + \"bc\"` collide.",
          "Return the largest index, so insert in order and let later words overwrite.",
          "A query whose prefix is longer than every word must return -1 — no special case is needed when only real prefixes are inserted.",
        ],
      }),
      examples: ex.map((e) => caseOf(run, e.ops, e.args)),
      gen: (rng: Rng) => {
        const alpha = pick(rng, ["ab", "abc", "abcdefghijklmnopqrstuvwxyz"]);
        const words = Array.from({ length: ri(rng, 1, pick(rng, [1, 5, 15])) }, () => randLower(rng, 1, 7, alpha));
        const ops = ["WordFilter"], args: Args = [[words]];
        for (let m = ri(rng, 1, pick(rng, [5, 20, 30])); m > 0; m--) {
          let p: string, s: string;
          if (rng() < 0.7) {
            const w = pick(rng, words), w2 = rng() < 0.7 ? w : pick(rng, words);
            p = w.slice(0, ri(rng, 1, w.length));
            s = w2.slice(w2.length - ri(rng, 1, w2.length));
          } else { p = randLower(rng, 1, 7, alpha); s = randLower(rng, 1, 7, alpha); }
          ops.push("f"); args.push([p, s]);
        }
        return caseOf(run, ops, args);
      },
      solutions: {
        python: code`
          class WordFilter:

              def __init__(self, words: List[str]):
                  self.best = {}  # "prefix#suffix" -> largest index having both
                  for i, w in enumerate(words):
                      n = len(w)
                      for a in range(1, n + 1):
                          p = w[:a]
                          for b in range(1, n + 1):
                              self.best[p + "#" + w[n - b:]] = i

              def f(self, pref: str, suff: str) -> int:
                  return self.best.get(pref + "#" + suff, -1)
        `,
        javascript: code`
          var WordFilter = function(words) {
              this.best = new Map(); // "prefix#suffix" -> largest index having both
              for (var i = 0; i < words.length; i++) {
                  var w = words[i], n = w.length;
                  for (var a = 1; a <= n; a++) {
                      var p = w.substring(0, a);
                      for (var b = 1; b <= n; b++) this.best.set(p + "#" + w.substring(n - b), i);
                  }
              }
          };

          WordFilter.prototype.f = function(pref, suff) {
              var r = this.best.get(pref + "#" + suff);
              return r === undefined ? -1 : r;
          };
        `,
        typescript: code`
          class WordFilter {
              best: { [key: string]: number }; // "prefix#suffix" -> largest index having both

              constructor(words: string[]) {
                  this.best = {};
                  for (var i = 0; i < words.length; i++) {
                      var w = words[i], n = w.length;
                      for (var a = 1; a <= n; a++) {
                          var p = w.substring(0, a);
                          for (var b = 1; b <= n; b++) this.best[p + "#" + w.substring(n - b)] = i;
                      }
                  }
              }

              f(pref: string, suff: string): number {
                  var r = this.best[pref + "#" + suff];
                  return r === undefined ? -1 : r;
              }
          }
        `,
        java: code`
          class WordFilter {
              private HashMap<String, Integer> best = new HashMap<>(); // "prefix#suffix" -> largest index

              public WordFilter(String[] words) {
                  for (int i = 0; i < words.length; i++) {
                      String w = words[i];
                      int n = w.length();
                      for (int a = 1; a <= n; a++) {
                          String p = w.substring(0, a) + "#";
                          for (int b = 1; b <= n; b++) best.put(p + w.substring(n - b), i);
                      }
                  }
              }

              public int f(String pref, String suff) {
                  return best.getOrDefault(pref + "#" + suff, -1);
              }
          }
        `,
        cpp: code`
          class WordFilter {
              unordered_map<string, int> best; // "prefix#suffix" -> largest index having both
          public:
              WordFilter(vector<string>& words) {
                  for (int i = 0; i < (int)words.size(); i++) {
                      const string& w = words[i];
                      int n = w.size();
                      for (int a = 1; a <= n; a++) {
                          string p = w.substr(0, a) + "#";
                          for (int b = 1; b <= n; b++) best[p + w.substr(n - b)] = i;
                      }
                  }
              }

              int f(string pref, string suff) {
                  auto it = best.find(pref + "#" + suff);
                  return it == best.end() ? -1 : it->second;
              }
          };
        `,
        c: code`
          /* No hash map in C, so a small open-addressing table. A string of at most seven
             lowercase letters is a base-27 number below 27^7, so a (prefix, suffix) pair is
             a pair of 64-bit codes. */
          typedef struct {
              unsigned long long *kp, *ks;
              int* val; /* index + 1; 0 = empty slot */
              unsigned long long mask;
          } WordFilter;

          static unsigned long long wfCode(const char* s, int from, int to) {
              unsigned long long c = 0;
              for (int i = from; i < to; i++) c = c * 27 + (unsigned long long)(s[i] - 'a' + 1);
              return c;
          }

          static unsigned long long wfSlot(WordFilter* o, unsigned long long p, unsigned long long s) {
              unsigned long long h = (p * 0x9E3779B97F4A7C15ULL) ^ (s * 0xC2B2AE3D27D4EB4FULL);
              h ^= h >> 29;
              h &= o->mask;
              while (o->val[h] && (o->kp[h] != p || o->ks[h] != s)) h = (h + 1) & o->mask;
              return h;
          }

          WordFilter* wordFilterCreate(char** words, int wordsSize) {
              WordFilter* o = (WordFilter*)malloc(sizeof(WordFilter));
              unsigned long long need = 0, cap = 64;
              for (int i = 0; i < wordsSize; i++) { unsigned long long n = strlen(words[i]); need += n * n; }
              while (cap < 2 * need) cap *= 2;
              o->mask = cap - 1;
              o->kp = (unsigned long long*)malloc(cap * sizeof(unsigned long long));
              o->ks = (unsigned long long*)malloc(cap * sizeof(unsigned long long));
              o->val = (int*)calloc(cap, sizeof(int));
              for (int i = 0; i < wordsSize; i++) {
                  int n = strlen(words[i]);
                  for (int a = 1; a <= n; a++) {
                      unsigned long long p = wfCode(words[i], 0, a);
                      for (int b = 1; b <= n; b++) {
                          unsigned long long s = wfCode(words[i], n - b, n);
                          unsigned long long h = wfSlot(o, p, s);
                          o->kp[h] = p;
                          o->ks[h] = s;
                          o->val[h] = i + 1; /* later words overwrite: largest index wins */
                      }
                  }
              }
              return o;
          }

          int wordFilterF(WordFilter* obj, char* pref, char* suff) {
              int lp = strlen(pref), ls = strlen(suff);
              unsigned long long h = wfSlot(obj, wfCode(pref, 0, lp), wfCode(suff, 0, ls));
              return obj->val[h] - 1;
          }

          void wordFilterFree(WordFilter* obj) {
              free(obj->kp);
              free(obj->ks);
              free(obj->val);
              free(obj);
          }
        `,
        csharp: code`
          public class WordFilter {
              private Dictionary<string, int> best = new Dictionary<string, int>(); // "prefix#suffix" -> largest index

              public WordFilter(string[] words) {
                  for (int i = 0; i < words.Length; i++) {
                      string w = words[i];
                      int n = w.Length;
                      for (int a = 1; a <= n; a++) {
                          string p = w.Substring(0, a) + "#";
                          for (int b = 1; b <= n; b++) best[p + w.Substring(n - b)] = i;
                      }
                  }
              }

              public int F(string pref, string suff) {
                  int r;
                  return best.TryGetValue(pref + "#" + suff, out r) ? r : -1;
              }
          }
        `,
        go: code`
          type WordFilter struct {
          	best map[string]int // "prefix#suffix" -> largest index having both
          }

          func Constructor(words []string) WordFilter {
          	wf := WordFilter{best: map[string]int{}}
          	for i, w := range words {
          		n := len(w)
          		for a := 1; a <= n; a++ {
          			p := w[:a] + "#"
          			for b := 1; b <= n; b++ {
          				wf.best[p+w[n-b:]] = i
          			}
          		}
          	}
          	return wf
          }

          func (this *WordFilter) F(pref string, suff string) int {
          	if r, ok := this.best[pref+"#"+suff]; ok {
          		return r
          	}
          	return -1
          }
        `,
        kotlin: code`
          class WordFilter(words: Array<String>) {
              private val best = HashMap<String, Int>() // "prefix#suffix" -> largest index having both

              init {
                  for (i in words.indices) {
                      val w = words[i]
                      val n = w.length
                      for (a in 1..n) {
                          val p = w.substring(0, a) + "#"
                          for (b in 1..n) best[p + w.substring(n - b)] = i
                      }
                  }
              }

              fun f(pref: String, suff: String): Int = best[pref + "#" + suff] ?: -1
          }
        `,
        swift: code`
          class WordFilter {
              var best: [String: Int] = [:] // "prefix#suffix" -> largest index having both

              init(_ words: [String]) {
                  for (i, word) in words.enumerated() {
                      let w = Array(word)
                      let n = w.count
                      for a in 1...n {
                          let p = String(w[0..<a]) + "#"
                          for b in 1...n { best[p + String(w[(n - b)..<n])] = i }
                      }
                  }
              }

              func f(_ pref: String, _ suff: String) -> Int {
                  return best[pref + "#" + suff] ?? -1
              }
          }
        `,
        rust: code`
          use std::collections::HashMap;

          struct WordFilter {
              best: HashMap<String, i32>, // "prefix#suffix" -> largest index having both
          }

          impl WordFilter {
              fn new(words: Vec<String>) -> Self {
                  let mut best = HashMap::new();
                  for (i, w) in words.iter().enumerate() {
                      let n = w.len();
                      for a in 1..=n {
                          for b in 1..=n {
                              best.insert(format!("{}#{}", &w[..a], &w[n - b..]), i as i32);
                          }
                      }
                  }
                  WordFilter { best }
              }

              fn f(&mut self, pref: String, suff: String) -> i32 {
                  *self.best.get(&format!("{}#{}", pref, suff)).unwrap_or(&-1)
              }
          }
        `,
        php: code`
          class WordFilter {
              private $best = []; // "prefix#suffix" -> largest index having both

              function __construct($words) {
                  foreach ($words as $i => $w) {
                      $n = strlen($w);
                      for ($a = 1; $a <= $n; $a++) {
                          $p = substr($w, 0, $a) . "#";
                          for ($b = 1; $b <= $n; $b++) $this->best[$p . substr($w, $n - $b)] = $i;
                      }
                  }
              }

              function f($pref, $suff) {
                  return $this->best[$pref . "#" . $suff] ?? -1;
              }
          }
        `,
        ruby: code`
          class WordFilter
            def initialize(words)
              @best = {} # "prefix#suffix" -> largest index having both
              words.each_with_index do |w, i|
                n = w.length
                (1..n).each do |a|
                  p = w[0, a] + "#"
                  (1..n).each { |b| @best[p + w[n - b, b]] = i }
                end
              end
            end

            def f(pref, suff)
              @best.fetch(pref + "#" + suff, -1)
            end
          end
        `,
      },
    };
  })(),

  // ── Dinner Plate Stacks (LC 1172) ─────────────────────────────────
  (() => {
    const run: Run = (ops, args) => {
      let cap = 0;
      const st: number[][] = [];
      return ops.map((op, i) => {
        const a = args[i];
        if (op === "DinnerPlates") { cap = a[0]; return null; }
        if (op === "push") {
          let k = 0;
          while (k < st.length && st[k].length >= cap) k++;
          if (k === st.length) st.push([]);
          st[k].push(a[0]);
          return null;
        }
        if (op === "pop") {
          for (let k = st.length - 1; k >= 0; k--) if (st[k].length) return st[k].pop()!;
          return -1;
        }
        if (op === "popAtStack") return a[0] < st.length && st[a[0]].length ? st[a[0]].pop()! : -1;
        return null;
      });
    };
    const ex = [
      {
        ops: ["DinnerPlates", "push", "push", "push", "push", "popAtStack", "push", "push", "pop", "popAtStack", "pop", "popAtStack"],
        args: [[3], [4], [5], [6], [7], [0], [8], [9], [], [1], [], [5]],
      },
      { ops: ["DinnerPlates", "push", "push", "push", "popAtStack", "push", "pop", "pop", "pop", "pop"], args: [[1], [1], [2], [3], [1], [7], [], [], [], []] },
    ];
    return {
      slug: "dinner-plate-stacks",
      title: "Dinner Plate Stacks",
      difficulty: "HARD" as const,
      tags: ["Hash Table", "Stack", "Heap (Priority Queue)", "Design", "Amazon"],
      signature: {
        funcName: "DinnerPlates", params: [{ name: "capacity", type: "int" as const }], returns: "void" as const,
        methods: [
          { name: "push", params: [{ name: "value", type: "int" as const }], returns: "void" as const },
          { name: "pop", params: [], returns: "int" as const },
          { name: "popAtStack", params: [{ name: "index", type: "int" as const }], returns: "int" as const },
        ],
      },
      description: describe(
        "An unlimited row of stacks is numbered `0, 1, 2, …` from left to right. Every stack holds at most `capacity` plates.\n\nWrite the class `DinnerPlates`:\n\n- `DinnerPlates(int capacity)` creates the row, every stack empty.\n- `void push(int value)` puts a plate with `value` on top of the **leftmost** stack that is not full.\n- `int pop()` takes the top plate off the **rightmost** non-empty stack and returns its value, or returns `-1` if every stack is empty.\n- `int popAtStack(int index)` takes the top plate off stack `index` and returns its value, or returns `-1` if that stack is empty.\n\n" + CALLS,
        [
          exampleOf(run, ex[0].ops, ex[0].args, "Plates 4, 5, 6 fill stack 0 and 7 starts stack 1. Taking 6 from stack 0 leaves room there, so 8 goes back to stack 0 and 9 to stack 1. pop takes 9 (stack 1 is rightmost), popAtStack(1) takes 7, and the next pop finds 8 on stack 0. Stack 5 is empty."),
          exampleOf(run, ex[1].ops, ex[1].args, "With capacity 1 each plate gets its own stack. Emptying stack 1 makes it the leftmost free one, so 7 lands there; pop then takes 3, 7 and 1, in that order."),
        ],
        ["1 <= capacity <= 2 * 10^4", "1 <= value <= 2 * 10^4", "0 <= index <= 10^5", "At most 2 * 10^5 calls are made in total to push, pop and popAtStack"]),
      hints: [
        "Store the stacks in a growable list. `pop` is `popAtStack` on the last stack — keep the list trimmed so that its last stack is never empty.",
        "The hard part is `push`: a `popAtStack` in the middle can open a gap far to the left. Scanning for the leftmost non-full stack is O(n).",
        "Keep the indices of the non-full stacks in a min-heap (or an ordered set). `popAtStack(i)` adds `i`; `push` uses the smallest index and removes it once that stack is full. With a heap, discard tops that point past the end of the trimmed list or at a stack that is full again.",
      ],
      editorial: explain({
        idea: "Two things must be found fast: the leftmost non-full stack (for `push`) and the rightmost non-empty one (for `pop`). A min-heap or ordered set of non-full stack indices answers the first; trimming empty stacks off the end of the list answers the second.",
        steps: [
          "Keep `stacks` (a list of stacks, whose last stack is never empty) and `open`, the indices of stacks in the list that are not full.",
          "`push(value)`: if `open` is non-empty, push onto stack `min(open)` and drop that index from `open` once the stack reaches `capacity`. Otherwise append a new stack holding `value` (and add its index to `open` if `capacity > 1`).",
          "`popAtStack(index)`: if `index` is past the end or the stack is empty, return `-1`. Otherwise pop its top, add `index` to `open`, then remove empty stacks from the end of the list (and their indices from `open`).",
          "`pop()`: return `-1` if the list is empty, else `popAtStack(last index)`.",
          "With a lazy min-heap instead of an ordered set, `push` first discards tops that are past the end of the list or point at a full stack, and a flag per index keeps each index in the heap at most once.",
        ],
        why: "`open` always holds exactly the non-full stacks inside the list: a stack becomes non-full only when created or popped (both add it) and stops being non-full only when `push` fills it (which removes it). Every stack beyond the list is empty, so if `open` is empty the leftmost non-full stack is the next new one. Trimming keeps the last stack in the list non-empty, so `pop` acts on the rightmost non-empty stack.",
        time: "O(log n) per call (amortised for the trimming and the lazy heap)",
        space: "O(number of plates + number of stacks)",
        pitfalls: [
          "`pop` must skip empty stacks on the right — trim them, or a middle `popAtStack` leaves `pop` looking at an empty stack.",
          "After trimming, indices in the heap may point past the end of the list; they are not valid targets for `push` until the list grows back.",
          "`popAtStack` with an index far beyond the list returns `-1`, not an error.",
        ],
      }),
      examples: ex.map((e) => caseOf(run, e.ops, e.args)),
      gen: (rng: Rng) => {
        const cap = rng() < 0.05 ? 20000 : ri(rng, 1, pick(rng, [1, 2, 3, 4]));
        const ops = ["DinnerPlates"], args: Args = [[cap]];
        let pushes = 0;
        for (let m = ri(rng, 1, pick(rng, [5, 20, 40])); m > 0; m--) {
          const r = rng();
          if (r < 0.5) { pushes++; ops.push("push"); args.push([rng() < 0.1 ? 20000 : ri(rng, 1, 99)]); }
          else if (r < 0.7) { ops.push("pop"); args.push([]); }
          else { ops.push("popAtStack"); args.push([rng() < 0.05 ? 100000 : ri(rng, 0, Math.ceil(pushes / cap) + 1)]); }
        }
        return caseOf(run, ops, args);
      },
      solutions: {
        python: code`
          import heapq

          class DinnerPlates:

              def __init__(self, capacity: int):
                  self.cap = capacity
                  self.stacks = []   # the last stack is never empty
                  self.heap = []     # candidate non-full stack indices (checked when used)
                  self.inHeap = set()

              def _offer(self, i):
                  if i not in self.inHeap:
                      self.inHeap.add(i)
                      heapq.heappush(self.heap, i)

              def push(self, value: int) -> None:
                  while self.heap and (self.heap[0] >= len(self.stacks) or len(self.stacks[self.heap[0]]) == self.cap):
                      self.inHeap.discard(heapq.heappop(self.heap))
                  if self.heap:
                      i = self.heap[0]
                      self.stacks[i].append(value)
                      if len(self.stacks[i]) == self.cap:
                          self.inHeap.discard(heapq.heappop(self.heap))
                  else:
                      self.stacks.append([value])
                      if self.cap > 1:
                          self._offer(len(self.stacks) - 1)

              def pop(self) -> int:
                  if not self.stacks:
                      return -1
                  return self.popAtStack(len(self.stacks) - 1)

              def popAtStack(self, index: int) -> int:
                  if index >= len(self.stacks) or not self.stacks[index]:
                      return -1
                  x = self.stacks[index].pop()
                  self._offer(index)
                  while self.stacks and not self.stacks[-1]:
                      self.stacks.pop()
                  return x
        `,
        javascript: code`
          var DinnerPlates = function(capacity) {
              this.cap = capacity;
              this.stacks = [];   // the last stack is never empty
              this.heap = [];     // candidate non-full stack indices (checked when used)
              this.inHeap = [];
          };

          DinnerPlates.prototype.offer = function(i) {
              if (this.inHeap[i]) return;
              this.inHeap[i] = true;
              var h = this.heap, k = h.length;
              h.push(i);
              while (k > 0 && h[(k - 1) >> 1] > i) { h[k] = h[(k - 1) >> 1]; k = (k - 1) >> 1; }
              h[k] = i;
          };

          DinnerPlates.prototype.take = function() { // remove the heap's minimum
              var h = this.heap;
              this.inHeap[h[0]] = false;
              var last = h.pop();
              if (h.length === 0) return;
              var k = 0, n = h.length;
              for (;;) {
                  var l = 2 * k + 1, r = l + 1, m = k, mv = last;
                  if (l < n && h[l] < mv) { m = l; mv = h[l]; }
                  if (r < n && h[r] < mv) { m = r; }
                  if (m === k) break;
                  h[k] = h[m]; k = m;
              }
              h[k] = last;
          };

          DinnerPlates.prototype.push = function(value) {
              while (this.heap.length && (this.heap[0] >= this.stacks.length || this.stacks[this.heap[0]].length === this.cap)) this.take();
              if (this.heap.length) {
                  var s = this.stacks[this.heap[0]];
                  s.push(value);
                  if (s.length === this.cap) this.take();
              } else {
                  this.stacks.push([value]);
                  if (this.cap > 1) this.offer(this.stacks.length - 1);
              }
          };

          DinnerPlates.prototype.pop = function() {
              if (this.stacks.length === 0) return -1;
              return this.popAtStack(this.stacks.length - 1);
          };

          DinnerPlates.prototype.popAtStack = function(index) {
              if (index >= this.stacks.length || this.stacks[index].length === 0) return -1;
              var x = this.stacks[index].pop();
              this.offer(index);
              while (this.stacks.length && this.stacks[this.stacks.length - 1].length === 0) this.stacks.pop();
              return x;
          };
        `,
        typescript: code`
          class DinnerPlates {
              cap: number;
              stacks: number[][]; // the last stack is never empty
              heap: number[];     // candidate non-full stack indices (checked when used)
              inHeap: boolean[];

              constructor(capacity: number) {
                  this.cap = capacity;
                  this.stacks = [];
                  this.heap = [];
                  this.inHeap = [];
              }

              offer(i: number): void {
                  if (this.inHeap[i]) return;
                  this.inHeap[i] = true;
                  var h = this.heap, k = h.length;
                  h.push(i);
                  while (k > 0 && h[(k - 1) >> 1] > i) { h[k] = h[(k - 1) >> 1]; k = (k - 1) >> 1; }
                  h[k] = i;
              }

              take(): void { // remove the heap's minimum
                  var h = this.heap;
                  this.inHeap[h[0]] = false;
                  var last = h.pop();
                  if (h.length === 0) return;
                  var k = 0, n = h.length;
                  for (;;) {
                      var l = 2 * k + 1, r = l + 1, m = k, mv = last;
                      if (l < n && h[l] < mv) { m = l; mv = h[l]; }
                      if (r < n && h[r] < mv) { m = r; }
                      if (m === k) break;
                      h[k] = h[m]; k = m;
                  }
                  h[k] = last;
              }

              push(value: number): void {
                  while (this.heap.length && (this.heap[0] >= this.stacks.length || this.stacks[this.heap[0]].length === this.cap)) this.take();
                  if (this.heap.length) {
                      var s = this.stacks[this.heap[0]];
                      s.push(value);
                      if (s.length === this.cap) this.take();
                  } else {
                      this.stacks.push([value]);
                      if (this.cap > 1) this.offer(this.stacks.length - 1);
                  }
              }

              pop(): number {
                  if (this.stacks.length === 0) return -1;
                  return this.popAtStack(this.stacks.length - 1);
              }

              popAtStack(index: number): number {
                  if (index >= this.stacks.length || this.stacks[index].length === 0) return -1;
                  var x = this.stacks[index].pop();
                  this.offer(index);
                  while (this.stacks.length && this.stacks[this.stacks.length - 1].length === 0) this.stacks.pop();
                  return x;
              }
          }
        `,
        java: code`
          class DinnerPlates {
              private int cap;
              private ArrayList<ArrayDeque<Integer>> stacks = new ArrayList<>(); // the last stack is never empty
              private TreeSet<Integer> open = new TreeSet<>(); // indices of non-full stacks in the list

              public DinnerPlates(int capacity) {
                  cap = capacity;
              }

              public void push(int value) {
                  if (!open.isEmpty()) {
                      int i = open.first();
                      ArrayDeque<Integer> s = stacks.get(i);
                      s.push(value);
                      if (s.size() == cap) open.remove(i);
                  } else {
                      ArrayDeque<Integer> s = new ArrayDeque<>();
                      s.push(value);
                      stacks.add(s);
                      if (cap > 1) open.add(stacks.size() - 1);
                  }
              }

              public int pop() {
                  if (stacks.isEmpty()) return -1;
                  return popAtStack(stacks.size() - 1);
              }

              public int popAtStack(int index) {
                  if (index >= stacks.size() || stacks.get(index).isEmpty()) return -1;
                  int x = stacks.get(index).pop();
                  open.add(index);
                  while (!stacks.isEmpty() && stacks.get(stacks.size() - 1).isEmpty()) {
                      open.remove(stacks.size() - 1);
                      stacks.remove(stacks.size() - 1);
                  }
                  return x;
              }
          }
        `,
        cpp: code`
          class DinnerPlates {
              int cap;
              vector<vector<int>> stacks; // the last stack is never empty
              set<int> open;              // indices of non-full stacks in the list
          public:
              DinnerPlates(int capacity) : cap(capacity) {}

              void push(int value) {
                  if (!open.empty()) {
                      int i = *open.begin();
                      stacks[i].push_back(value);
                      if ((int)stacks[i].size() == cap) open.erase(i);
                  } else {
                      stacks.push_back({value});
                      if (cap > 1) open.insert(stacks.size() - 1);
                  }
              }

              int pop() {
                  if (stacks.empty()) return -1;
                  return popAtStack(stacks.size() - 1);
              }

              int popAtStack(int index) {
                  if (index >= (int)stacks.size() || stacks[index].empty()) return -1;
                  int x = stacks[index].back();
                  stacks[index].pop_back();
                  open.insert(index);
                  while (!stacks.empty() && stacks.back().empty()) {
                      open.erase(stacks.size() - 1);
                      stacks.pop_back();
                  }
                  return x;
              }
          };
        `,
        c: code`
          /* Every stack is a slice of one flat array: stack i holds plates[i * cap ..
             i * cap + size[i]). A binary min-heap holds candidate non-full stack indices,
             checked when used; inHeap keeps each index in it at most once. */
          typedef struct {
              int cap, n;          /* n stacks in the list; the last is never empty */
              int *plates, *size;
              char* inHeap;
              int *heap, hn;
              int scap;            /* room for scap stacks */
          } DinnerPlates;

          DinnerPlates* dinnerPlatesCreate(int capacity) {
              DinnerPlates* d = (DinnerPlates*)malloc(sizeof(DinnerPlates));
              d->cap = capacity;
              d->n = 0;
              d->hn = 0;
              d->scap = 4;
              d->plates = (int*)malloc((size_t)d->scap * capacity * sizeof(int));
              d->size = (int*)calloc(d->scap, sizeof(int));
              d->inHeap = (char*)calloc(d->scap, 1);
              d->heap = (int*)malloc(d->scap * sizeof(int));
              return d;
          }

          static void dpGrow(DinnerPlates* d) {
              int old = d->scap;
              d->scap *= 2;
              d->plates = (int*)realloc(d->plates, (size_t)d->scap * d->cap * sizeof(int));
              d->size = (int*)realloc(d->size, d->scap * sizeof(int));
              d->inHeap = (char*)realloc(d->inHeap, d->scap);
              d->heap = (int*)realloc(d->heap, d->scap * sizeof(int));
              for (int i = old; i < d->scap; i++) { d->size[i] = 0; d->inHeap[i] = 0; }
          }

          static void dpOffer(DinnerPlates* d, int i) {
              if (d->inHeap[i]) return;
              d->inHeap[i] = 1;
              int k = d->hn++;
              while (k > 0 && d->heap[(k - 1) / 2] > i) { d->heap[k] = d->heap[(k - 1) / 2]; k = (k - 1) / 2; }
              d->heap[k] = i;
          }

          static void dpTake(DinnerPlates* d) {
              d->inHeap[d->heap[0]] = 0;
              int last = d->heap[--d->hn], k = 0;
              if (d->hn == 0) return;
              for (;;) {
                  int l = 2 * k + 1, r = l + 1, m = k, mv = last;
                  if (l < d->hn && d->heap[l] < mv) { m = l; mv = d->heap[l]; }
                  if (r < d->hn && d->heap[r] < mv) m = r;
                  if (m == k) break;
                  d->heap[k] = d->heap[m];
                  k = m;
              }
              d->heap[k] = last;
          }

          void dinnerPlatesPush(DinnerPlates* obj, int value) {
              while (obj->hn > 0 && (obj->heap[0] >= obj->n || obj->size[obj->heap[0]] == obj->cap)) dpTake(obj);
              if (obj->hn > 0) {
                  int i = obj->heap[0];
                  obj->plates[(size_t)i * obj->cap + obj->size[i]++] = value;
                  if (obj->size[i] == obj->cap) dpTake(obj);
              } else {
                  if (obj->n == obj->scap) dpGrow(obj);
                  int i = obj->n++;
                  obj->size[i] = 1;
                  obj->plates[(size_t)i * obj->cap] = value;
                  if (obj->cap > 1) dpOffer(obj, i);
              }
          }

          int dinnerPlatesPopAtStack(DinnerPlates* obj, int index) {
              if (index >= obj->n || obj->size[index] == 0) return -1;
              int x = obj->plates[(size_t)index * obj->cap + --obj->size[index]];
              dpOffer(obj, index);
              while (obj->n > 0 && obj->size[obj->n - 1] == 0) obj->n--;
              return x;
          }

          int dinnerPlatesPop(DinnerPlates* obj) {
              if (obj->n == 0) return -1;
              return dinnerPlatesPopAtStack(obj, obj->n - 1);
          }

          void dinnerPlatesFree(DinnerPlates* obj) {
              free(obj->plates);
              free(obj->size);
              free(obj->inHeap);
              free(obj->heap);
              free(obj);
          }
        `,
        csharp: code`
          public class DinnerPlates {
              private int cap;
              private List<Stack<int>> stacks = new List<Stack<int>>(); // the last stack is never empty
              private SortedSet<int> open = new SortedSet<int>();        // indices of non-full stacks in the list

              public DinnerPlates(int capacity) {
                  cap = capacity;
              }

              public void Push(int value) {
                  if (open.Count > 0) {
                      int i = open.Min;
                      stacks[i].Push(value);
                      if (stacks[i].Count == cap) open.Remove(i);
                  } else {
                      var s = new Stack<int>();
                      s.Push(value);
                      stacks.Add(s);
                      if (cap > 1) open.Add(stacks.Count - 1);
                  }
              }

              public int Pop() {
                  if (stacks.Count == 0) return -1;
                  return PopAtStack(stacks.Count - 1);
              }

              public int PopAtStack(int index) {
                  if (index >= stacks.Count || stacks[index].Count == 0) return -1;
                  int x = stacks[index].Pop();
                  open.Add(index);
                  while (stacks.Count > 0 && stacks[stacks.Count - 1].Count == 0) {
                      open.Remove(stacks.Count - 1);
                      stacks.RemoveAt(stacks.Count - 1);
                  }
                  return x;
              }
          }
        `,
        go: code`
          type DinnerPlates struct {
          	cap    int
          	stacks [][]int // the last stack is never empty
          	heap   []int   // candidate non-full stack indices (checked when used)
          	inHeap map[int]bool
          }

          func Constructor(capacity int) DinnerPlates {
          	return DinnerPlates{cap: capacity, inHeap: map[int]bool{}}
          }

          func (this *DinnerPlates) offer(i int) {
          	if this.inHeap[i] {
          		return
          	}
          	this.inHeap[i] = true
          	h := append(this.heap, i)
          	k := len(h) - 1
          	for k > 0 && h[(k-1)/2] > i {
          		h[k] = h[(k-1)/2]
          		k = (k - 1) / 2
          	}
          	h[k] = i
          	this.heap = h
          }

          func (this *DinnerPlates) take() {
          	h := this.heap
          	this.inHeap[h[0]] = false
          	last := h[len(h)-1]
          	h = h[:len(h)-1]
          	if n := len(h); n > 0 {
          		k := 0
          		for {
          			l, r, m, mv := 2*k+1, 2*k+2, k, last
          			if l < n && h[l] < mv {
          				m, mv = l, h[l]
          			}
          			if r < n && h[r] < mv {
          				m = r
          			}
          			if m == k {
          				break
          			}
          			h[k] = h[m]
          			k = m
          		}
          		h[k] = last
          	}
          	this.heap = h
          }

          func (this *DinnerPlates) Push(value int) {
          	for len(this.heap) > 0 && (this.heap[0] >= len(this.stacks) || len(this.stacks[this.heap[0]]) == this.cap) {
          		this.take()
          	}
          	if len(this.heap) > 0 {
          		i := this.heap[0]
          		this.stacks[i] = append(this.stacks[i], value)
          		if len(this.stacks[i]) == this.cap {
          			this.take()
          		}
          	} else {
          		this.stacks = append(this.stacks, []int{value})
          		if this.cap > 1 {
          			this.offer(len(this.stacks) - 1)
          		}
          	}
          }

          func (this *DinnerPlates) Pop() int {
          	if len(this.stacks) == 0 {
          		return -1
          	}
          	return this.PopAtStack(len(this.stacks) - 1)
          }

          func (this *DinnerPlates) PopAtStack(index int) int {
          	if index >= len(this.stacks) || len(this.stacks[index]) == 0 {
          		return -1
          	}
          	s := this.stacks[index]
          	x := s[len(s)-1]
          	this.stacks[index] = s[:len(s)-1]
          	this.offer(index)
          	for len(this.stacks) > 0 && len(this.stacks[len(this.stacks)-1]) == 0 {
          		this.stacks = this.stacks[:len(this.stacks)-1]
          	}
          	return x
          }
        `,
        kotlin: code`
          class DinnerPlates(capacity: Int) {
              private val cap = capacity
              private val stacks = ArrayList<java.util.ArrayDeque<Int>>() // the last stack is never empty
              private val open = java.util.TreeSet<Int>()                 // indices of non-full stacks in the list

              fun push(value: Int) {
                  if (!open.isEmpty()) {
                      val i = open.first()
                      val s = stacks[i]
                      s.push(value)
                      if (s.size == cap) open.remove(i)
                  } else {
                      val s = java.util.ArrayDeque<Int>()
                      s.push(value)
                      stacks.add(s)
                      if (cap > 1) open.add(stacks.size - 1)
                  }
              }

              fun pop(): Int {
                  if (stacks.isEmpty()) return -1
                  return popAtStack(stacks.size - 1)
              }

              fun popAtStack(index: Int): Int {
                  if (index >= stacks.size || stacks[index].isEmpty()) return -1
                  val x = stacks[index].pop()
                  open.add(index)
                  while (!stacks.isEmpty() && stacks[stacks.size - 1].isEmpty()) {
                      open.remove(stacks.size - 1)
                      stacks.removeAt(stacks.size - 1)
                  }
                  return x
              }
          }
        `,
        swift: code`
          class DinnerPlates {
              let cap: Int
              var stacks: [[Int]] = []     // the last stack is never empty
              var heap: [Int] = []         // candidate non-full stack indices (checked when used)
              var inHeap = Set<Int>()

              init(_ capacity: Int) { cap = capacity }

              func offer(_ i: Int) {
                  if inHeap.contains(i) { return }
                  inHeap.insert(i)
                  heap.append(i)
                  var k = heap.count - 1
                  while k > 0 && heap[(k - 1) / 2] > i {
                      heap[k] = heap[(k - 1) / 2]
                      k = (k - 1) / 2
                  }
                  heap[k] = i
              }

              func take() {
                  inHeap.remove(heap[0])
                  let last = heap.removeLast()
                  let n = heap.count
                  if n == 0 { return }
                  var k = 0
                  while true {
                      let l = 2 * k + 1, r = l + 1
                      var m = k, mv = last
                      if l < n && heap[l] < mv { m = l; mv = heap[l] }
                      if r < n && heap[r] < mv { m = r }
                      if m == k { break }
                      heap[k] = heap[m]
                      k = m
                  }
                  heap[k] = last
              }

              func push(_ value: Int) {
                  while !heap.isEmpty && (heap[0] >= stacks.count || stacks[heap[0]].count == cap) { take() }
                  if !heap.isEmpty {
                      let i = heap[0]
                      stacks[i].append(value)
                      if stacks[i].count == cap { take() }
                  } else {
                      stacks.append([value])
                      if cap > 1 { offer(stacks.count - 1) }
                  }
              }

              func pop() -> Int {
                  if stacks.isEmpty { return -1 }
                  return popAtStack(stacks.count - 1)
              }

              func popAtStack(_ index: Int) -> Int {
                  if index >= stacks.count || stacks[index].isEmpty { return -1 }
                  let x = stacks[index].removeLast()
                  offer(index)
                  while let last = stacks.last, last.isEmpty { stacks.removeLast() }
                  return x
              }
          }
        `,
        rust: code`
          use std::collections::BTreeSet;

          struct DinnerPlates {
              cap: usize,
              stacks: Vec<Vec<i32>>, // the last stack is never empty
              open: BTreeSet<usize>, // indices of non-full stacks in the list
          }

          impl DinnerPlates {
              fn new(capacity: i32) -> Self {
                  DinnerPlates { cap: capacity as usize, stacks: Vec::new(), open: BTreeSet::new() }
              }

              fn push(&mut self, value: i32) {
                  let first = self.open.iter().next().cloned();
                  match first {
                      Some(i) => {
                          self.stacks[i].push(value);
                          if self.stacks[i].len() == self.cap { self.open.remove(&i); }
                      }
                      None => {
                          self.stacks.push(vec![value]);
                          if self.cap > 1 { self.open.insert(self.stacks.len() - 1); }
                      }
                  }
              }

              fn pop(&mut self) -> i32 {
                  if self.stacks.is_empty() { return -1; }
                  let last = self.stacks.len() - 1;
                  self.popAtStack(last as i32)
              }

              fn popAtStack(&mut self, index: i32) -> i32 {
                  let i = index as usize;
                  if i >= self.stacks.len() || self.stacks[i].is_empty() { return -1; }
                  let x = self.stacks[i].pop().unwrap();
                  self.open.insert(i);
                  while !self.stacks.is_empty() && self.stacks[self.stacks.len() - 1].is_empty() {
                      self.open.remove(&(self.stacks.len() - 1));
                      self.stacks.pop();
                  }
                  x
              }
          }
        `,
        php: code`
          class DinnerPlates {
              private $cap;
              private $stacks = [];   // the last stack is never empty
              private $heap;          // candidate non-full stack indices (checked when used)
              private $inHeap = [];

              function __construct($capacity) {
                  $this->cap = $capacity;
                  $this->heap = new \SplMinHeap();
              }

              private function offer($i) {
                  if (isset($this->inHeap[$i])) return;
                  $this->inHeap[$i] = true;
                  $this->heap->insert($i);
              }

              private function take() {
                  unset($this->inHeap[$this->heap->extract()]);
              }

              function push($value) {
                  while (!$this->heap->isEmpty()) {
                      $i = $this->heap->top();
                      if ($i < count($this->stacks) && count($this->stacks[$i]) < $this->cap) break;
                      $this->take();
                  }
                  if (!$this->heap->isEmpty()) {
                      $i = $this->heap->top();
                      $this->stacks[$i][] = $value;
                      if (count($this->stacks[$i]) === $this->cap) $this->take();
                  } else {
                      $this->stacks[] = [$value];
                      if ($this->cap > 1) $this->offer(count($this->stacks) - 1);
                  }
              }

              function pop() {
                  if (count($this->stacks) === 0) return -1;
                  return $this->popAtStack(count($this->stacks) - 1);
              }

              function popAtStack($index) {
                  if ($index >= count($this->stacks) || count($this->stacks[$index]) === 0) return -1;
                  $x = array_pop($this->stacks[$index]);
                  $this->offer($index);
                  while (count($this->stacks) > 0 && count($this->stacks[count($this->stacks) - 1]) === 0) array_pop($this->stacks);
                  return $x;
              }
          }
        `,
        ruby: code`
          class DinnerPlates
            def initialize(capacity)
              @cap = capacity
              @stacks = []  # the last stack is never empty
              @heap = []    # candidate non-full stack indices (checked when used)
              @in_heap = {}
            end

            def offer(i)
              return if @in_heap[i]
              @in_heap[i] = true
              h = @heap
              h << i
              k = h.length - 1
              while k > 0 && h[(k - 1) / 2] > i
                h[k] = h[(k - 1) / 2]
                k = (k - 1) / 2
              end
              h[k] = i
            end

            def take
              h = @heap
              @in_heap.delete(h[0])
              last = h.pop
              n = h.length
              return if n == 0
              k = 0
              loop do
                l = 2 * k + 1
                r = l + 1
                m = k
                mv = last
                if l < n && h[l] < mv
                  m = l
                  mv = h[l]
                end
                m = r if r < n && h[r] < mv
                break if m == k
                h[k] = h[m]
                k = m
              end
              h[k] = last
            end

            def push(value)
              take while !@heap.empty? && (@heap[0] >= @stacks.length || @stacks[@heap[0]].length == @cap)
              if @heap.empty?
                @stacks << [value]
                offer(@stacks.length - 1) if @cap > 1
              else
                s = @stacks[@heap[0]]
                s << value
                take if s.length == @cap
              end
            end

            def pop
              return -1 if @stacks.empty?
              popAtStack(@stacks.length - 1)
            end

            def popAtStack(index)
              return -1 if index >= @stacks.length || @stacks[index].empty?
              x = @stacks[index].pop
              offer(index)
              @stacks.pop while !@stacks.empty? && @stacks[-1].empty?
              x
            end
          end
        `,
      },
    };
  })(),

  // ── Design Skiplist (LC 1206) ─────────────────────────────────────
  (() => {
    const run: Run = (ops, args) => {
      const items: number[] = [];
      return ops.map((op, i) => {
        const x = args[i][0];
        if (op === "search") return items.includes(x);
        if (op === "add") { items.push(x); return null; }
        if (op === "erase") { const j = items.indexOf(x); if (j < 0) return false; items.splice(j, 1); return true; }
        return null;
      });
    };
    const ex = [
      {
        ops: ["Skiplist", "add", "add", "add", "search", "erase", "search", "erase", "search", "erase", "search"],
        args: [[], [7], [7], [3], [7], [7], [7], [7], [7], [7], [3]],
      },
      { ops: ["Skiplist", "search", "add", "add", "search", "erase", "search"], args: [[], [0], [0], [20000], [20000], [0], [0]] },
    ];
    return {
      slug: "design-skiplist",
      title: "Design Skiplist",
      difficulty: "HARD" as const,
      tags: ["Linked List", "Design", "Google", "Microsoft"],
      signature: {
        funcName: "Skiplist", params: [], returns: "void" as const,
        methods: [
          { name: "search", params: [{ name: "target", type: "int" as const }], returns: "bool" as const },
          { name: "add", params: [{ name: "num", type: "int" as const }], returns: "void" as const },
          { name: "erase", params: [{ name: "num", type: "int" as const }], returns: "bool" as const },
        ],
      },
      description: describe(
        "Implement a **skiplist** without using any built-in ordered library. A skiplist keeps its values in sorted linked lists stacked in levels: the bottom level holds every value, and each value is also copied up into the next level with probability 1/2. A search starts at the top level and drops down a level whenever the next value would overshoot, so `search`, `add` and `erase` all take O(log n) expected time.\n\nThe same value may be stored more than once. Write the class `Skiplist`:\n\n- `Skiplist()` creates an empty skiplist.\n- `boolean search(int target)` returns whether `target` is stored.\n- `void add(int num)` stores `num` (another copy if it is already there).\n- `boolean erase(int num)` removes **one** copy of `num` and returns `true`, or returns `false` (and changes nothing) if `num` is not stored.\n\n" + CALLS,
        [
          exampleOf(run, ex[0].ops, ex[0].args, "7 is stored twice. The first erase removes one copy, so 7 is still found; the second removes the other. A third erase finds nothing to remove. 3 was never touched."),
          exampleOf(run, ex[1].ops, ex[1].args, "0 and 20000 are the smallest and largest values allowed."),
        ],
        ["0 <= num, target <= 2 * 10^4", "At most 5 * 10^4 calls are made in total to search, add and erase"]),
      hints: [
        "Start from a sorted linked list: search is O(n) because you can only step one node at a time. Add express lanes — higher levels that skip over many nodes.",
        "Give each new node a random height: level 1 always, and each further level with probability 1/2 (up to a cap such as 16). A head node with the full height starts every level.",
        "All three operations begin the same way: from the top level down, move right while the next value is smaller than the key, and remember the last node visited on each level. Those are the nodes whose `next` pointers an insertion or deletion rewires.",
      ],
      editorial: explain({
        idea: "A skiplist is a sorted linked list with probabilistic express lanes. Walking from the top lane down, every operation finds, on each level, the last node before the key — the \"update path\" — in O(log n) expected steps; inserting or deleting a node is then only a matter of splicing it into or out of those lanes.",
        steps: [
          "Keep a head node with `L = 16` forward pointers (enough for far more than 5 · 10^4 values).",
          "`path(key)`: start at the head on level `L - 1`; on each level move right while the next node's value is `< key`, record the current node as `path[level]`, then go down a level.",
          "`search(target)`: the node after `path[0]` on level 0 is the first value `>= target`; report whether it equals `target`.",
          "`add(num)`: pick a height `h` (1, plus one more level with probability 1/2 each time, at most `L`). For levels `0..h-1`, set `node.next[lv] = path[lv].next[lv]` and `path[lv].next[lv] = node`.",
          "`erase(num)`: let `node` be the node after `path[0]` on level 0; if it is missing or holds another value, return `false`. Otherwise, on each of its levels, set `path[lv].next[lv] = node.next[lv]`, and return `true`.",
        ],
        why: "Every level is a sorted sub-list of the level below, so moving right while values are smaller never skips a value `>= key`, and dropping a level only refines the position; `path[0]` is therefore the last node of the whole list below `key`. Because heights double the gap between express stops on average, each level is crossed in O(1) expected steps, giving O(log n) expected work. With duplicates, the node after `path[0]` is the first copy, and on each of its levels it is also the first node `>= num`, so `path[lv].next[lv]` is exactly that node.",
        time: "O(log n) expected per operation",
        space: "O(n) expected (about two pointers per value)",
        pitfalls: [
          "Use strict `<` while walking right; with `<=`, a search would step past the copies it is looking for.",
          "`erase` removes one copy only and must report `false` without touching the list when the value is absent.",
          "The coin flips only affect speed: the stored values, and so every answer, are the same whatever the random heights are.",
        ],
      }),
      examples: ex.map((e) => caseOf(run, e.ops, e.args)),
      gen: (rng: Rng) => {
        const top = pick(rng, [3, 8, 30, 20000]);
        const used: number[] = [];
        const ops = ["Skiplist"], args: Args = [[]];
        for (let m = ri(rng, 1, pick(rng, [5, 20, 40])); m > 0; m--) {
          const x = used.length && rng() < 0.6 ? pick(rng, used) : ri(rng, 0, top);
          used.push(x);
          const r = rng();
          ops.push(r < 0.4 ? "add" : r < 0.7 ? "search" : "erase");
          args.push([x]);
        }
        return caseOf(run, ops, args);
      },
      solutions: {
        python: code`
          import random

          class SkipNode:
              __slots__ = ("value", "nxt")

              def __init__(self, value, height):
                  self.value = value
                  self.nxt = [None] * height

          class Skiplist:
              LEVELS = 16

              def __init__(self):
                  self.head = SkipNode(-1, self.LEVELS)

              def _path(self, key):  # on every level, the last node with value < key
                  path = [None] * self.LEVELS
                  cur = self.head
                  for lv in range(self.LEVELS - 1, -1, -1):
                      while cur.nxt[lv] is not None and cur.nxt[lv].value < key:
                          cur = cur.nxt[lv]
                      path[lv] = cur
                  return path

              def search(self, target: int) -> bool:
                  node = self._path(target)[0].nxt[0]
                  return node is not None and node.value == target

              def add(self, num: int) -> None:
                  path = self._path(num)
                  height = 1
                  while height < self.LEVELS and random.random() < 0.5:
                      height += 1
                  node = SkipNode(num, height)
                  for lv in range(height):
                      node.nxt[lv] = path[lv].nxt[lv]
                      path[lv].nxt[lv] = node

              def erase(self, num: int) -> bool:
                  path = self._path(num)
                  node = path[0].nxt[0]
                  if node is None or node.value != num:
                      return False
                  for lv in range(len(node.nxt)):
                      if path[lv].nxt[lv] is node:
                          path[lv].nxt[lv] = node.nxt[lv]
                  return True
        `,
        javascript: code`
          var SK_LEVELS = 16;

          function SkipNode(value, height) {
              this.value = value;
              this.nxt = new Array(height);
              for (var i = 0; i < height; i++) this.nxt[i] = null;
          }

          var Skiplist = function() {
              this.head = new SkipNode(-1, SK_LEVELS);
          };

          Skiplist.prototype.path = function(key) { // on every level, the last node with value < key
              var path = new Array(SK_LEVELS), cur = this.head;
              for (var lv = SK_LEVELS - 1; lv >= 0; lv--) {
                  while (cur.nxt[lv] !== null && cur.nxt[lv].value < key) cur = cur.nxt[lv];
                  path[lv] = cur;
              }
              return path;
          };

          Skiplist.prototype.search = function(target) {
              var node = this.path(target)[0].nxt[0];
              return node !== null && node.value === target;
          };

          Skiplist.prototype.add = function(num) {
              var path = this.path(num), height = 1;
              while (height < SK_LEVELS && Math.random() < 0.5) height++;
              var node = new SkipNode(num, height);
              for (var lv = 0; lv < height; lv++) {
                  node.nxt[lv] = path[lv].nxt[lv];
                  path[lv].nxt[lv] = node;
              }
          };

          Skiplist.prototype.erase = function(num) {
              var path = this.path(num), node = path[0].nxt[0];
              if (node === null || node.value !== num) return false;
              for (var lv = 0; lv < node.nxt.length; lv++) {
                  if (path[lv].nxt[lv] === node) path[lv].nxt[lv] = node.nxt[lv];
              }
              return true;
          };
        `,
        typescript: code`
          class SkipNode {
              value: number;
              nxt: SkipNode[];
              constructor(value: number, height: number) {
                  this.value = value;
                  this.nxt = [];
                  for (var i = 0; i < height; i++) this.nxt.push(null);
              }
          }

          class Skiplist {
              levels: number;
              head: SkipNode;

              constructor() {
                  this.levels = 16;
                  this.head = new SkipNode(-1, this.levels);
              }

              path(key: number): SkipNode[] { // on every level, the last node with value < key
                  var path: SkipNode[] = [], cur = this.head;
                  for (var i = 0; i < this.levels; i++) path.push(null);
                  for (var lv = this.levels - 1; lv >= 0; lv--) {
                      while (cur.nxt[lv] !== null && cur.nxt[lv].value < key) cur = cur.nxt[lv];
                      path[lv] = cur;
                  }
                  return path;
              }

              search(target: number): boolean {
                  var node = this.path(target)[0].nxt[0];
                  return node !== null && node.value === target;
              }

              add(num: number): void {
                  var path = this.path(num), height = 1;
                  while (height < this.levels && Math.random() < 0.5) height++;
                  var node = new SkipNode(num, height);
                  for (var lv = 0; lv < height; lv++) {
                      node.nxt[lv] = path[lv].nxt[lv];
                      path[lv].nxt[lv] = node;
                  }
              }

              erase(num: number): boolean {
                  var path = this.path(num), node = path[0].nxt[0];
                  if (node === null || node.value !== num) return false;
                  for (var lv = 0; lv < node.nxt.length; lv++) {
                      if (path[lv].nxt[lv] === node) path[lv].nxt[lv] = node.nxt[lv];
                  }
                  return true;
              }
          }
        `,
        java: code`
          class Skiplist {
              private static final int LEVELS = 16;

              private static class Node {
                  int value;
                  Node[] nxt;
                  Node(int value, int height) { this.value = value; nxt = new Node[height]; }
              }

              private final Node head = new Node(-1, LEVELS);
              private final Random rnd = new Random();

              public Skiplist() {
              }

              private Node[] path(int key) { // on every level, the last node with value < key
                  Node[] path = new Node[LEVELS];
                  Node cur = head;
                  for (int lv = LEVELS - 1; lv >= 0; lv--) {
                      while (cur.nxt[lv] != null && cur.nxt[lv].value < key) cur = cur.nxt[lv];
                      path[lv] = cur;
                  }
                  return path;
              }

              public boolean search(int target) {
                  Node node = path(target)[0].nxt[0];
                  return node != null && node.value == target;
              }

              public void add(int num) {
                  Node[] path = path(num);
                  int height = 1;
                  while (height < LEVELS && rnd.nextBoolean()) height++;
                  Node node = new Node(num, height);
                  for (int lv = 0; lv < height; lv++) {
                      node.nxt[lv] = path[lv].nxt[lv];
                      path[lv].nxt[lv] = node;
                  }
              }

              public boolean erase(int num) {
                  Node[] path = path(num);
                  Node node = path[0].nxt[0];
                  if (node == null || node.value != num) return false;
                  for (int lv = 0; lv < node.nxt.length; lv++) {
                      if (path[lv].nxt[lv] == node) path[lv].nxt[lv] = node.nxt[lv];
                  }
                  return true;
              }
          }
        `,
        cpp: code`
          class Skiplist {
              static const int LEVELS = 16;
              struct Node {
                  int value;
                  vector<Node*> nxt;
                  Node(int v, int h) : value(v), nxt(h, nullptr) {}
              };
              Node* head = new Node(-1, LEVELS);

              void path(int key, Node** out) { // on every level, the last node with value < key
                  Node* cur = head;
                  for (int lv = LEVELS - 1; lv >= 0; lv--) {
                      while (cur->nxt[lv] && cur->nxt[lv]->value < key) cur = cur->nxt[lv];
                      out[lv] = cur;
                  }
              }
          public:
              Skiplist() {}

              bool search(int target) {
                  Node* p[LEVELS];
                  path(target, p);
                  Node* node = p[0]->nxt[0];
                  return node && node->value == target;
              }

              void add(int num) {
                  Node* p[LEVELS];
                  path(num, p);
                  int height = 1;
                  while (height < LEVELS && (rand() & 1)) height++;
                  Node* node = new Node(num, height);
                  for (int lv = 0; lv < height; lv++) {
                      node->nxt[lv] = p[lv]->nxt[lv];
                      p[lv]->nxt[lv] = node;
                  }
              }

              bool erase(int num) {
                  Node* p[LEVELS];
                  path(num, p);
                  Node* node = p[0]->nxt[0];
                  if (!node || node->value != num) return false;
                  for (int lv = 0; lv < (int)node->nxt.size(); lv++) {
                      if (p[lv]->nxt[lv] == node) p[lv]->nxt[lv] = node->nxt[lv];
                  }
                  delete node;
                  return true;
              }
          };
        `,
        c: code`
          #define SK_LEVELS 16

          typedef struct SkNode {
              int value, height;
              struct SkNode* nxt[SK_LEVELS];
          } SkNode;

          typedef struct {
              SkNode* head;
          } Skiplist;

          static SkNode* skNew(int value, int height) {
              SkNode* n = (SkNode*)malloc(sizeof(SkNode));
              n->value = value;
              n->height = height;
              for (int i = 0; i < SK_LEVELS; i++) n->nxt[i] = NULL;
              return n;
          }

          Skiplist* skiplistCreate() {
              Skiplist* s = (Skiplist*)malloc(sizeof(Skiplist));
              s->head = skNew(-1, SK_LEVELS);
              return s;
          }

          static void skPath(Skiplist* s, int key, SkNode** path) { /* last node with value < key, per level */
              SkNode* cur = s->head;
              for (int lv = SK_LEVELS - 1; lv >= 0; lv--) {
                  while (cur->nxt[lv] != NULL && cur->nxt[lv]->value < key) cur = cur->nxt[lv];
                  path[lv] = cur;
              }
          }

          bool skiplistSearch(Skiplist* obj, int target) {
              SkNode* path[SK_LEVELS];
              skPath(obj, target, path);
              SkNode* node = path[0]->nxt[0];
              return node != NULL && node->value == target;
          }

          void skiplistAdd(Skiplist* obj, int num) {
              SkNode* path[SK_LEVELS];
              skPath(obj, num, path);
              int height = 1;
              while (height < SK_LEVELS && (rand() & 1)) height++;
              SkNode* node = skNew(num, height);
              for (int lv = 0; lv < height; lv++) {
                  node->nxt[lv] = path[lv]->nxt[lv];
                  path[lv]->nxt[lv] = node;
              }
          }

          bool skiplistErase(Skiplist* obj, int num) {
              SkNode* path[SK_LEVELS];
              skPath(obj, num, path);
              SkNode* node = path[0]->nxt[0];
              if (node == NULL || node->value != num) return false;
              for (int lv = 0; lv < node->height; lv++) {
                  if (path[lv]->nxt[lv] == node) path[lv]->nxt[lv] = node->nxt[lv];
              }
              free(node);
              return true;
          }

          void skiplistFree(Skiplist* obj) {
              SkNode* n = obj->head;
              while (n != NULL) {
                  SkNode* next = n->nxt[0];
                  free(n);
                  n = next;
              }
              free(obj);
          }
        `,
        csharp: code`
          public class Skiplist {
              private const int Levels = 16;

              private class Node {
                  public int Value;
                  public Node[] Nxt;
                  public Node(int value, int height) { Value = value; Nxt = new Node[height]; }
              }

              private Node head = new Node(-1, Levels);
              private Random rnd = new Random();

              public Skiplist() {
              }

              private Node[] Path(int key) { // on every level, the last node with value < key
                  var path = new Node[Levels];
                  Node cur = head;
                  for (int lv = Levels - 1; lv >= 0; lv--) {
                      while (cur.Nxt[lv] != null && cur.Nxt[lv].Value < key) cur = cur.Nxt[lv];
                      path[lv] = cur;
                  }
                  return path;
              }

              public bool Search(int target) {
                  Node node = Path(target)[0].Nxt[0];
                  return node != null && node.Value == target;
              }

              public void Add(int num) {
                  Node[] path = Path(num);
                  int height = 1;
                  while (height < Levels && rnd.Next(2) == 0) height++;
                  var node = new Node(num, height);
                  for (int lv = 0; lv < height; lv++) {
                      node.Nxt[lv] = path[lv].Nxt[lv];
                      path[lv].Nxt[lv] = node;
                  }
              }

              public bool Erase(int num) {
                  Node[] path = Path(num);
                  Node node = path[0].Nxt[0];
                  if (node == null || node.Value != num) return false;
                  for (int lv = 0; lv < node.Nxt.Length; lv++) {
                      if (path[lv].Nxt[lv] == node) path[lv].Nxt[lv] = node.Nxt[lv];
                  }
                  return true;
              }
          }
        `,
        go: code`
          const skLevels = 16

          type skNode struct {
          	value int
          	nxt   []*skNode
          }

          type Skiplist struct {
          	head *skNode
          	seed uint32 // xorshift state for the coin flips
          }

          func Constructor() Skiplist {
          	return Skiplist{head: &skNode{value: -1, nxt: make([]*skNode, skLevels)}, seed: 2463534242}
          }

          func (this *Skiplist) coin() bool {
          	this.seed ^= this.seed << 13
          	this.seed ^= this.seed >> 17
          	this.seed ^= this.seed << 5
          	return this.seed&1 == 1
          }

          func (this *Skiplist) path(key int) [skLevels]*skNode { // on every level, the last node with value < key
          	var path [skLevels]*skNode
          	cur := this.head
          	for lv := skLevels - 1; lv >= 0; lv-- {
          		for cur.nxt[lv] != nil && cur.nxt[lv].value < key {
          			cur = cur.nxt[lv]
          		}
          		path[lv] = cur
          	}
          	return path
          }

          func (this *Skiplist) Search(target int) bool {
          	node := this.path(target)[0].nxt[0]
          	return node != nil && node.value == target
          }

          func (this *Skiplist) Add(num int) {
          	path := this.path(num)
          	height := 1
          	for height < skLevels && this.coin() {
          		height++
          	}
          	node := &skNode{value: num, nxt: make([]*skNode, height)}
          	for lv := 0; lv < height; lv++ {
          		node.nxt[lv] = path[lv].nxt[lv]
          		path[lv].nxt[lv] = node
          	}
          }

          func (this *Skiplist) Erase(num int) bool {
          	path := this.path(num)
          	node := path[0].nxt[0]
          	if node == nil || node.value != num {
          		return false
          	}
          	for lv := range node.nxt {
          		if path[lv].nxt[lv] == node {
          			path[lv].nxt[lv] = node.nxt[lv]
          		}
          	}
          	return true
          }
        `,
        kotlin: code`
          class Skiplist() {
              private class Node(val value: Int, height: Int) {
                  val nxt = arrayOfNulls<Node>(height)
              }

              private val levels = 16
              private val head = Node(-1, levels)
              private val rnd = java.util.Random()

              private fun path(key: Int): Array<Node> { // on every level, the last node with value < key
                  val path = Array(levels) { head }
                  var cur = head
                  for (lv in levels - 1 downTo 0) {
                      while (true) {
                          val next = cur.nxt[lv]
                          if (next != null && next.value < key) cur = next else break
                      }
                      path[lv] = cur
                  }
                  return path
              }

              fun search(target: Int): Boolean {
                  val node = path(target)[0].nxt[0]
                  return node != null && node.value == target
              }

              fun add(num: Int) {
                  val path = path(num)
                  var height = 1
                  while (height < levels && rnd.nextBoolean()) height++
                  val node = Node(num, height)
                  for (lv in 0 until height) {
                      node.nxt[lv] = path[lv].nxt[lv]
                      path[lv].nxt[lv] = node
                  }
              }

              fun erase(num: Int): Boolean {
                  val path = path(num)
                  val node = path[0].nxt[0]
                  if (node == null || node.value != num) return false
                  for (lv in 0 until node.nxt.size) {
                      if (path[lv].nxt[lv] === node) path[lv].nxt[lv] = node.nxt[lv]
                  }
                  return true
              }
          }
        `,
        swift: code`
          final class SkipNode {
              let value: Int
              var nxt: [SkipNode?]
              init(_ value: Int, _ height: Int) {
                  self.value = value
                  nxt = [SkipNode?](repeating: nil, count: height)
              }
          }

          class Skiplist {
              let levels = 16
              let head: SkipNode

              init() { head = SkipNode(-1, 16) }

              func path(_ key: Int) -> [SkipNode] { // on every level, the last node with value < key
                  var path = [SkipNode](repeating: head, count: levels)
                  var cur = head
                  for lv in stride(from: levels - 1, through: 0, by: -1) {
                      while let next = cur.nxt[lv], next.value < key { cur = next }
                      path[lv] = cur
                  }
                  return path
              }

              func search(_ target: Int) -> Bool {
                  if let node = path(target)[0].nxt[0] { return node.value == target }
                  return false
              }

              func add(_ num: Int) {
                  let p = path(num)
                  var height = 1
                  while height < levels && Bool.random() { height += 1 }
                  let node = SkipNode(num, height)
                  for lv in 0..<height {
                      node.nxt[lv] = p[lv].nxt[lv]
                      p[lv].nxt[lv] = node
                  }
              }

              func erase(_ num: Int) -> Bool {
                  let p = path(num)
                  guard let node = p[0].nxt[0], node.value == num else { return false }
                  for lv in 0..<node.nxt.count where p[lv].nxt[lv] === node {
                      p[lv].nxt[lv] = node.nxt[lv]
                  }
                  return true
              }
          }
        `,
        rust: code`
          const SK_LEVELS: usize = 16;

          // Nodes live in vectors and link by index; index 0 is the head, which is never
          // anyone's successor, so a link of 0 means "none".
          struct Skiplist {
              value: Vec<i32>,
              next: Vec<[usize; SK_LEVELS]>,
              height: Vec<usize>,
              seed: u32, // xorshift state for the coin flips
          }

          impl Skiplist {
              fn new() -> Self {
                  Skiplist { value: vec![-1], next: vec![[0; SK_LEVELS]], height: vec![SK_LEVELS], seed: 2463534242 }
              }

              fn path(&self, key: i32) -> [usize; SK_LEVELS] { // on every level, the last node with value < key
                  let mut path = [0usize; SK_LEVELS];
                  let mut cur = 0usize;
                  for lv in (0..SK_LEVELS).rev() {
                      loop {
                          let n = self.next[cur][lv];
                          if n != 0 && self.value[n] < key { cur = n; } else { break; }
                      }
                      path[lv] = cur;
                  }
                  path
              }

              fn search(&mut self, target: i32) -> bool {
                  let n = self.next[self.path(target)[0]][0];
                  n != 0 && self.value[n] == target
              }

              fn add(&mut self, num: i32) {
                  let p = self.path(num);
                  let mut h = 1;
                  while h < SK_LEVELS {
                      self.seed ^= self.seed << 13;
                      self.seed ^= self.seed >> 17;
                      self.seed ^= self.seed << 5;
                      if self.seed & 1 == 0 { break; }
                      h += 1;
                  }
                  let id = self.value.len();
                  self.value.push(num);
                  self.next.push([0; SK_LEVELS]);
                  self.height.push(h);
                  for lv in 0..h {
                      let after = self.next[p[lv]][lv];
                      self.next[id][lv] = after;
                      self.next[p[lv]][lv] = id;
                  }
              }

              fn erase(&mut self, num: i32) -> bool {
                  let p = self.path(num);
                  let n = self.next[p[0]][0];
                  if n == 0 || self.value[n] != num { return false; }
                  for lv in 0..self.height[n] {
                      if self.next[p[lv]][lv] == n {
                          let after = self.next[n][lv];
                          self.next[p[lv]][lv] = after;
                      }
                  }
                  true
              }
          }
        `,
        php: code`
          class SkipNode {
              public $value;
              public $nxt;
              function __construct($value, $height) {
                  $this->value = $value;
                  $this->nxt = array_fill(0, $height, null);
              }
          }

          class Skiplist {
              const LEVELS = 16;
              private $head;

              function __construct() {
                  $this->head = new SkipNode(-1, self::LEVELS);
              }

              private function path($key) { // on every level, the last node with value < key
                  $path = [];
                  $cur = $this->head;
                  for ($lv = self::LEVELS - 1; $lv >= 0; $lv--) {
                      while ($cur->nxt[$lv] !== null && $cur->nxt[$lv]->value < $key) $cur = $cur->nxt[$lv];
                      $path[$lv] = $cur;
                  }
                  return $path;
              }

              function search($target) {
                  $node = $this->path($target)[0]->nxt[0];
                  return $node !== null && $node->value === $target;
              }

              function add($num) {
                  $path = $this->path($num);
                  $height = 1;
                  while ($height < self::LEVELS && mt_rand(0, 1) === 1) $height++;
                  $node = new SkipNode($num, $height);
                  for ($lv = 0; $lv < $height; $lv++) {
                      $node->nxt[$lv] = $path[$lv]->nxt[$lv];
                      $path[$lv]->nxt[$lv] = $node;
                  }
              }

              function erase($num) {
                  $path = $this->path($num);
                  $node = $path[0]->nxt[0];
                  if ($node === null || $node->value !== $num) return false;
                  for ($lv = 0; $lv < count($node->nxt); $lv++) {
                      if ($path[$lv]->nxt[$lv] === $node) $path[$lv]->nxt[$lv] = $node->nxt[$lv];
                  }
                  return true;
              }
          }
        `,
        ruby: code`
          class SkipNode
            attr_reader :value, :nxt

            def initialize(value, height)
              @value = value
              @nxt = Array.new(height)
            end
          end

          class Skiplist
            LEVELS = 16

            def initialize
              @head = SkipNode.new(-1, LEVELS)
            end

            def path(key) # on every level, the last node with value < key
              path = Array.new(LEVELS)
              cur = @head
              (LEVELS - 1).downto(0) do |lv|
                cur = cur.nxt[lv] while cur.nxt[lv] && cur.nxt[lv].value < key
                path[lv] = cur
              end
              path
            end

            def search(target)
              node = path(target)[0].nxt[0]
              !node.nil? && node.value == target
            end

            def add(num)
              p = path(num)
              height = 1
              height += 1 while height < LEVELS && rand(2) == 1
              node = SkipNode.new(num, height)
              height.times do |lv|
                node.nxt[lv] = p[lv].nxt[lv]
                p[lv].nxt[lv] = node
              end
            end

            def erase(num)
              p = path(num)
              node = p[0].nxt[0]
              return false if node.nil? || node.value != num
              node.nxt.each_index do |lv|
                p[lv].nxt[lv] = node.nxt[lv] if p[lv].nxt[lv].equal?(node)
              end
              true
            end
          end
        `,
      },
    };
  })(),

  // ── Finding MK Average (LC 1825) ──────────────────────────────────
  (() => {
    const run: Run = (ops, args) => {
      let m = 0, k = 0;
      const stream: number[] = [];
      return ops.map((op, i) => {
        if (op === "MKAverage") { m = args[i][0]; k = args[i][1]; return null; }
        if (op === "addElement") { stream.push(args[i][0]); return null; }
        if (op === "calculateMKAverage") {
          if (stream.length < m) return -1;
          const w = stream.slice(stream.length - m).sort((a, b) => a - b).slice(k, m - k);
          return Math.floor(w.reduce((s, x) => s + x, 0) / w.length);
        }
        return null;
      });
    };
    const ex = [
      {
        ops: ["MKAverage", "addElement", "addElement", "addElement", "addElement", "calculateMKAverage", "addElement", "calculateMKAverage", "addElement", "calculateMKAverage", "addElement", "calculateMKAverage"],
        args: [[5, 1], [10], [20], [30], [40], [], [1], [], [100000], [], [2], []],
      },
      {
        ops: ["MKAverage", "addElement", "addElement", "calculateMKAverage", "addElement", "calculateMKAverage", "addElement", "calculateMKAverage", "addElement", "calculateMKAverage"],
        args: [[3, 1], [5], [5], [], [5], [], [6], [], [8], []],
      },
    ];
    return {
      slug: "finding-mk-average",
      title: "Finding MK Average",
      difficulty: "HARD" as const,
      tags: ["Queue", "Heap (Priority Queue)", "Ordered Set", "Binary Indexed Tree", "Design", "Google"],
      signature: {
        funcName: "MKAverage", params: [{ name: "m", type: "int" as const }, { name: "k", type: "int" as const }], returns: "void" as const,
        methods: [
          { name: "addElement", params: [{ name: "num", type: "int" as const }], returns: "void" as const },
          { name: "calculateMKAverage", params: [], returns: "int" as const },
        ],
      },
      description: describe(
        "Integers arrive in a stream. The **MK average** of the stream is computed from its last `m` elements:\n\n1. If fewer than `m` elements have arrived, the MK average is `-1`.\n2. Otherwise take the last `m` elements, remove the `k` smallest and the `k` largest of them (as a multiset — equal values are separate elements).\n3. The MK average is the average of the `m - 2k` elements left, **rounded down** to an integer.\n\nWrite the class `MKAverage`:\n\n- `MKAverage(int m, int k)` starts an empty stream.\n- `void addElement(int num)` appends `num` to the stream.\n- `int calculateMKAverage()` returns the current MK average.\n\n" + CALLS,
        [
          exampleOf(run, ex[0].ops, ex[0].args, "With 10, 20, 30, 40, 1 the window sorted is 1, 10, 20, 30, 40; dropping 1 and 40 leaves 10, 20, 30, average 20. After 100000 the window is 20, 30, 40, 1, 100000 and the middle three average 30. After 2 the middle is 2, 30, 40: 72 / 3 = 24."),
          exampleOf(run, ex[1].ops, ex[1].args, "Equal values are separate elements: from 5, 5, 5 one 5 is dropped at each end. The window 5, 6, 8 keeps only 6."),
        ],
        ["3 <= m <= 10^5", "1 <= k * 2 < m", "1 <= num <= 10^5", "At most 10^5 calls are made in total to addElement and calculateMKAverage", "The sum of the window can exceed 2^31 - 1, so add it up in 64 bits; the average itself fits in 32 bits"]),
      hints: [
        "Sorting the last `m` elements on every query is O(m log m) — too slow when both `m` and the number of queries are 10^5.",
        "The middle sum is (sum of the `m - k` smallest) − (sum of the `k` smallest). So you need \"sum of the c smallest elements of the window\" quickly, while elements enter and leave.",
        "Values are at most 10^5: keep two Fenwick trees indexed by value — counts and sums — over the window (a queue tells you which element leaves). Walking down the count tree finds the value where the c-th smallest lies, and the sum tree gives everything below it. (Three ordered multisets — bottom k, middle, top k — also work.)",
      ],
      editorial: explain({
        idea: "Keep the window in a queue and, over the value range 1..10^5, two Fenwick trees: how many window elements have each value, and their total. The sum of the `c` smallest elements is one top-down walk of the trees, and the MK average is the difference of two such sums divided by `m - 2k`.",
        steps: [
          "`addElement(num)`: push `num` to the queue and add (1, num) at position `num` in the count and sum trees. If the queue now holds more than `m` elements, pop the oldest value `x` and add (−1, −x) at position `x`.",
          "`smallest(c)`: walk the Fenwick tree from the highest power of two down, moving to `pos + step` whenever the count stored there is `< c` remaining; collect the counts and sums passed. The walk ends at `pos` with fewer than `c` elements at values `<= pos`; the remaining ones all have value `pos + 1`, so add `remaining * (pos + 1)`.",
          "`calculateMKAverage()`: return `-1` while the queue holds fewer than `m` elements; otherwise `(smallest(m - k) - smallest(k)) / (m - 2k)`, rounded down.",
        ],
        why: "Sorted, the window's middle elements are positions `k+1 … m-k`, whose sum is the sum of the first `m - k` minus the sum of the first `k`. The Fenwick walk keeps the invariant that `pos` is the largest value with fewer than `c` elements at or below it, so the `c`-th smallest element has value exactly `pos + 1` — counting the leftover copies at that value handles duplicates.",
        time: "O(log V) per call, V = 10^5",
        space: "O(V + m)",
        pitfalls: [
          "The window sum reaches 10^10 — use 64-bit sums.",
          "Duplicates: the k smallest may cut through a run of equal values; take only part of that run (the `remaining * (pos + 1)` term).",
          "Only the last `m` elements count — evict the oldest one when the stream grows past `m`.",
        ],
      }),
      examples: ex.map((e) => caseOf(run, e.ops, e.args)),
      gen: (rng: Rng) => {
        const m = rng() < 0.05 ? 100000 : ri(rng, 3, pick(rng, [3, 6, 12, 25]));
        const k = ri(rng, 1, Math.floor((m - 1) / 2));
        const top = pick(rng, [3, 10, 100000]);
        const ops = ["MKAverage"], args: Args = [[m, k]];
        for (let c = ri(rng, 1, pick(rng, [10, 25, 40])); c > 0; c--) {
          if (rng() < 0.65) { ops.push("addElement"); args.push([rng() < 0.05 ? 100000 : ri(rng, 1, top)]); }
          else { ops.push("calculateMKAverage"); args.push([]); }
        }
        return caseOf(run, ops, args);
      },
      solutions: {
        python: code`
          from collections import deque

          class MKAverage:
              SIZE = 1 << 17  # Fenwick trees over values 1..131072 (values are <= 10^5)

              def __init__(self, m: int, k: int):
                  self.m, self.k = m, k
                  self.window = deque()
                  # Kept sparse (only positions an update touched): a fresh 131073-slot list
                  # per instance is most of the cost when many small streams are built.
                  self.cnt = {}
                  self.tot = {}

              def _update(self, x, c):
                  i = x
                  cnt, tot = self.cnt, self.tot
                  while i <= self.SIZE:
                      cnt[i] = cnt.get(i, 0) + c
                      tot[i] = tot.get(i, 0) + c * x
                      i += i & -i

              def _smallest(self, c):  # sum of the c smallest values in the window
                  pos, acc, step = 0, 0, self.SIZE
                  cnt, tot = self.cnt, self.tot
                  while step:
                      nxt = pos + step
                      here = cnt.get(nxt, 0)
                      if nxt <= self.SIZE and here < c:
                          pos = nxt
                          c -= here
                          acc += tot.get(nxt, 0)
                      step >>= 1
                  return acc + c * (pos + 1)  # the rest all equal pos + 1

              def addElement(self, num: int) -> None:
                  self.window.append(num)
                  self._update(num, 1)
                  if len(self.window) > self.m:
                      self._update(self.window.popleft(), -1)

              def calculateMKAverage(self) -> int:
                  if len(self.window) < self.m:
                      return -1
                  return (self._smallest(self.m - self.k) - self._smallest(self.k)) // (self.m - 2 * self.k)
        `,
        javascript: code`
          var MK_SIZE = 131072; // Fenwick trees over values 1..2^17 (values are <= 10^5)

          var MKAverage = function(m, k) {
              this.m = m;
              this.k = k;
              this.window = [];
              this.head = 0;
              this.cnt = new Int32Array(MK_SIZE + 1);
              this.tot = new Float64Array(MK_SIZE + 1); // sums stay below 2^53, so doubles are exact
          };

          MKAverage.prototype.update = function(x, c) {
              for (var i = x; i <= MK_SIZE; i += i & -i) { this.cnt[i] += c; this.tot[i] += c * x; }
          };

          MKAverage.prototype.smallest = function(c) { // sum of the c smallest values in the window
              var pos = 0, acc = 0;
              for (var step = MK_SIZE; step > 0; step >>= 1) {
                  var nxt = pos + step;
                  if (nxt <= MK_SIZE && this.cnt[nxt] < c) { pos = nxt; c -= this.cnt[nxt]; acc += this.tot[nxt]; }
              }
              return acc + c * (pos + 1); // the rest all equal pos + 1
          };

          MKAverage.prototype.addElement = function(num) {
              this.window.push(num);
              this.update(num, 1);
              if (this.window.length - this.head > this.m) this.update(this.window[this.head++], -1);
          };

          MKAverage.prototype.calculateMKAverage = function() {
              if (this.window.length - this.head < this.m) return -1;
              return Math.floor((this.smallest(this.m - this.k) - this.smallest(this.k)) / (this.m - 2 * this.k));
          };
        `,
        typescript: code`
          // Fenwick trees over values 1..2^17 (values are <= 10^5), kept as sparse objects:
          // only the positions an update has touched exist.
          class MKAverage {
              m: number;
              k: number;
              window: number[];
              head: number;
              cnt: { [i: number]: number };
              tot: { [i: number]: number };

              constructor(m: number, k: number) {
                  this.m = m;
                  this.k = k;
                  this.window = [];
                  this.head = 0;
                  this.cnt = {};
                  this.tot = {};
              }

              update(x: number, c: number): void {
                  for (var i = x; i <= 131072; i += i & -i) {
                      this.cnt[i] = (this.cnt[i] || 0) + c;
                      this.tot[i] = (this.tot[i] || 0) + c * x;
                  }
              }

              smallest(c: number): number { // sum of the c smallest values in the window
                  var pos = 0, acc = 0;
                  for (var step = 131072; step > 0; step >>= 1) {
                      var nxt = pos + step, here = this.cnt[nxt] || 0;
                      if (nxt <= 131072 && here < c) { pos = nxt; c -= here; acc += this.tot[nxt] || 0; }
                  }
                  return acc + c * (pos + 1); // the rest all equal pos + 1
              }

              addElement(num: number): void {
                  this.window.push(num);
                  this.update(num, 1);
                  if (this.window.length - this.head > this.m) this.update(this.window[this.head++], -1);
              }

              calculateMKAverage(): number {
                  if (this.window.length - this.head < this.m) return -1;
                  return Math.floor((this.smallest(this.m - this.k) - this.smallest(this.k)) / (this.m - 2 * this.k));
              }
          }
        `,
        java: code`
          class MKAverage {
              private static final int SIZE = 1 << 17; // Fenwick trees over values 1..2^17
              private final int m, k;
              private final ArrayDeque<Integer> window = new ArrayDeque<>();
              // Sparse (only positions an update touched): two 2^17-slot arrays per instance
              // cost more than all the work when many small streams are built.
              private final HashMap<Integer, long[]> tree = new HashMap<>(); // position -> {count, sum}

              public MKAverage(int m, int k) {
                  this.m = m;
                  this.k = k;
              }

              private void update(int x, int c) {
                  for (int i = x; i <= SIZE; i += i & -i) {
                      long[] t = tree.computeIfAbsent(i, z -> new long[2]);
                      t[0] += c;
                      t[1] += (long) c * x;
                  }
              }

              private long smallest(int c) { // sum of the c smallest values in the window
                  int pos = 0;
                  long acc = 0;
                  for (int step = SIZE; step > 0; step >>= 1) {
                      int nxt = pos + step;
                      long[] t = tree.get(nxt);
                      long here = t == null ? 0 : t[0];
                      if (nxt <= SIZE && here < c) { pos = nxt; c -= here; acc += t == null ? 0 : t[1]; }
                  }
                  return acc + (long) c * (pos + 1); // the rest all equal pos + 1
              }

              public void addElement(int num) {
                  window.addLast(num);
                  update(num, 1);
                  if (window.size() > m) update(window.pollFirst(), -1);
              }

              public int calculateMKAverage() {
                  if (window.size() < m) return -1;
                  return (int) ((smallest(m - k) - smallest(k)) / (m - 2 * k));
              }
          }
        `,
        cpp: code`
          class MKAverage {
              static const int SIZE = 1 << 17; // Fenwick trees over values 1..2^17
              int m, k;
              deque<int> window;
              // Sparse (only positions an update touched): two 2^17-slot arrays per instance
              // cost more than all the work when many small streams are built.
              unordered_map<int, long long> cnt, tot;

              void update(int x, int c) {
                  for (int i = x; i <= SIZE; i += i & -i) { cnt[i] += c; tot[i] += (long long)c * x; }
              }

              long long smallest(int c) { // sum of the c smallest values in the window
                  int pos = 0;
                  long long acc = 0;
                  for (int step = SIZE; step > 0; step >>= 1) {
                      int nxt = pos + step;
                      auto it = cnt.find(nxt);
                      long long here = it == cnt.end() ? 0 : it->second;
                      if (nxt <= SIZE && here < c) { pos = nxt; c -= here; acc += tot[nxt]; }
                  }
                  return acc + (long long)c * (pos + 1); // the rest all equal pos + 1
              }
          public:
              MKAverage(int m, int k) : m(m), k(k) {}

              void addElement(int num) {
                  window.push_back(num);
                  update(num, 1);
                  if ((int)window.size() > m) { update(window.front(), -1); window.pop_front(); }
              }

              int calculateMKAverage() {
                  if ((int)window.size() < m) return -1;
                  return (int)((smallest(m - k) - smallest(k)) / (m - 2 * k));
              }
          };
        `,
        c: code`
          #define MK_SIZE 131072 /* Fenwick trees over values 1..2^17 (values are <= 10^5) */

          typedef struct {
              int m, k;
              int* window; /* every element added; the window is window[head .. n) */
              int head, n, cap;
              int* cnt;
              long long* tot;
          } MKAverage;

          MKAverage* mKAverageCreate(int m, int k) {
              MKAverage* a = (MKAverage*)malloc(sizeof(MKAverage));
              a->m = m;
              a->k = k;
              a->head = a->n = 0;
              a->cap = 16;
              a->window = (int*)malloc(a->cap * sizeof(int));
              a->cnt = (int*)calloc(MK_SIZE + 1, sizeof(int));
              a->tot = (long long*)calloc(MK_SIZE + 1, sizeof(long long));
              return a;
          }

          static void mkUpdate(MKAverage* a, int x, int c) {
              for (int i = x; i <= MK_SIZE; i += i & -i) { a->cnt[i] += c; a->tot[i] += (long long)c * x; }
          }

          static long long mkSmallest(MKAverage* a, int c) { /* sum of the c smallest values in the window */
              int pos = 0;
              long long acc = 0;
              for (int step = MK_SIZE; step > 0; step >>= 1) {
                  int nxt = pos + step;
                  if (nxt <= MK_SIZE && a->cnt[nxt] < c) { pos = nxt; c -= a->cnt[nxt]; acc += a->tot[nxt]; }
              }
              return acc + (long long)c * (pos + 1); /* the rest all equal pos + 1 */
          }

          void mKAverageAddElement(MKAverage* obj, int num) {
              if (obj->n == obj->cap) { obj->cap *= 2; obj->window = (int*)realloc(obj->window, obj->cap * sizeof(int)); }
              obj->window[obj->n++] = num;
              mkUpdate(obj, num, 1);
              if (obj->n - obj->head > obj->m) mkUpdate(obj, obj->window[obj->head++], -1);
          }

          int mKAverageCalculateMKAverage(MKAverage* obj) {
              if (obj->n - obj->head < obj->m) return -1;
              return (int)((mkSmallest(obj, obj->m - obj->k) - mkSmallest(obj, obj->k)) / (obj->m - 2 * obj->k));
          }

          void mKAverageFree(MKAverage* obj) {
              free(obj->window);
              free(obj->cnt);
              free(obj->tot);
              free(obj);
          }
        `,
        csharp: code`
          public class MKAverage {
              private const int Size = 1 << 17; // Fenwick trees over values 1..2^17
              private int m, k;
              private Queue<int> window = new Queue<int>();
              private int[] cnt = new int[Size + 1];
              private long[] tot = new long[Size + 1];

              public MKAverage(int m, int k) {
                  this.m = m;
                  this.k = k;
              }

              private void Update(int x, int c) {
                  for (int i = x; i <= Size; i += i & -i) { cnt[i] += c; tot[i] += (long)c * x; }
              }

              private long Smallest(int c) { // sum of the c smallest values in the window
                  int pos = 0;
                  long acc = 0;
                  for (int step = Size; step > 0; step >>= 1) {
                      int nxt = pos + step;
                      if (nxt <= Size && cnt[nxt] < c) { pos = nxt; c -= cnt[nxt]; acc += tot[nxt]; }
                  }
                  return acc + (long)c * (pos + 1); // the rest all equal pos + 1
              }

              public void AddElement(int num) {
                  window.Enqueue(num);
                  Update(num, 1);
                  if (window.Count > m) Update(window.Dequeue(), -1);
              }

              public int CalculateMKAverage() {
                  if (window.Count < m) return -1;
                  return (int)((Smallest(m - k) - Smallest(k)) / (m - 2 * k));
              }
          }
        `,
        go: code`
          const mkSize = 1 << 17 // Fenwick trees over values 1..2^17 (values are <= 10^5)

          type MKAverage struct {
          	m, k   int
          	window []int // every element added; the window is window[head:]
          	head   int
          	cnt    []int
          	tot    []int64
          }

          func Constructor(m int, k int) MKAverage {
          	return MKAverage{m: m, k: k, cnt: make([]int, mkSize+1), tot: make([]int64, mkSize+1)}
          }

          func (this *MKAverage) update(x, c int) {
          	for i := x; i <= mkSize; i += i & -i {
          		this.cnt[i] += c
          		this.tot[i] += int64(c * x)
          	}
          }

          func (this *MKAverage) smallest(c int) int64 { // sum of the c smallest values in the window
          	pos := 0
          	var acc int64
          	for step := mkSize; step > 0; step >>= 1 {
          		nxt := pos + step
          		if nxt <= mkSize && this.cnt[nxt] < c {
          			pos = nxt
          			c -= this.cnt[nxt]
          			acc += this.tot[nxt]
          		}
          	}
          	return acc + int64(c)*int64(pos+1) // the rest all equal pos + 1
          }

          func (this *MKAverage) AddElement(num int) {
          	this.window = append(this.window, num)
          	this.update(num, 1)
          	if len(this.window)-this.head > this.m {
          		this.update(this.window[this.head], -1)
          		this.head++
          	}
          }

          func (this *MKAverage) CalculateMKAverage() int {
          	if len(this.window)-this.head < this.m {
          		return -1
          	}
          	return int((this.smallest(this.m-this.k) - this.smallest(this.k)) / int64(this.m-2*this.k))
          }
        `,
        kotlin: code`
          class MKAverage(m: Int, k: Int) {
              private val size = 1 shl 17 // Fenwick trees over values 1..2^17
              private val m = m
              private val k = k
              private val window = java.util.ArrayDeque<Int>()
              // Sparse (only positions an update touched): two 2^17-slot arrays per instance
              // cost more than all the work when many small streams are built.
              private val tree = HashMap<Int, LongArray>() // position -> {count, sum}

              private fun update(x: Int, c: Int) {
                  var i = x
                  while (i <= size) {
                      val t = tree.getOrPut(i) { LongArray(2) }
                      t[0] += c.toLong()
                      t[1] += c.toLong() * x
                      i += i and -i
                  }
              }

              private fun smallest(count: Int): Long { // sum of the c smallest values in the window
                  var c = count.toLong()
                  var pos = 0
                  var acc = 0L
                  var step = size
                  while (step > 0) {
                      val nxt = pos + step
                      val t = tree[nxt]
                      val here = if (t == null) 0L else t[0]
                      if (nxt <= size && here < c) { pos = nxt; c -= here; acc += if (t == null) 0L else t[1] }
                      step = step shr 1
                  }
                  return acc + c * (pos + 1) // the rest all equal pos + 1
              }

              fun addElement(num: Int) {
                  window.addLast(num)
                  update(num, 1)
                  if (window.size > m) update(window.pollFirst(), -1)
              }

              fun calculateMKAverage(): Int {
                  if (window.size < m) return -1
                  return ((smallest(m - k) - smallest(k)) / (m - 2 * k)).toInt()
              }
          }
        `,
        swift: code`
          class MKAverage {
              let size = 1 << 17 // Fenwick trees over values 1..2^17
              let m: Int, k: Int
              var window: [Int] = [] // every element added; the window is window[head...]
              var head = 0
              var cnt: [Int]
              var tot: [Int] // Int is 64-bit

              init(_ m: Int, _ k: Int) {
                  self.m = m
                  self.k = k
                  cnt = [Int](repeating: 0, count: (1 << 17) + 1)
                  tot = [Int](repeating: 0, count: (1 << 17) + 1)
              }

              func update(_ x: Int, _ c: Int) {
                  var i = x
                  while i <= size {
                      cnt[i] += c
                      tot[i] += c * x
                      i += i & -i
                  }
              }

              func smallest(_ count: Int) -> Int { // sum of the c smallest values in the window
                  var c = count, pos = 0, acc = 0, step = size
                  while step > 0 {
                      let nxt = pos + step
                      if nxt <= size && cnt[nxt] < c { pos = nxt; c -= cnt[nxt]; acc += tot[nxt] }
                      step >>= 1
                  }
                  return acc + c * (pos + 1) // the rest all equal pos + 1
              }

              func addElement(_ num: Int) {
                  window.append(num)
                  update(num, 1)
                  if window.count - head > m {
                      update(window[head], -1)
                      head += 1
                  }
              }

              func calculateMKAverage() -> Int {
                  if window.count - head < m { return -1 }
                  return (smallest(m - k) - smallest(k)) / (m - 2 * k)
              }
          }
        `,
        rust: code`
          use std::collections::VecDeque;

          const MK_SIZE: usize = 1 << 17; // Fenwick trees over values 1..2^17 (values are <= 10^5)

          struct MKAverage {
              m: usize,
              k: usize,
              window: VecDeque<i32>,
              cnt: Vec<i64>,
              tot: Vec<i64>,
          }

          impl MKAverage {
              fn new(m: i32, k: i32) -> Self {
                  MKAverage { m: m as usize, k: k as usize, window: VecDeque::new(), cnt: vec![0; MK_SIZE + 1], tot: vec![0; MK_SIZE + 1] }
              }

              fn update(&mut self, x: i32, c: i64) {
                  let mut i = x as usize;
                  while i <= MK_SIZE {
                      self.cnt[i] += c;
                      self.tot[i] += c * x as i64;
                      i += i & i.wrapping_neg();
                  }
              }

              fn smallest(&self, count: usize) -> i64 { // sum of the c smallest values in the window
                  let mut c = count as i64;
                  let (mut pos, mut acc, mut step) = (0usize, 0i64, MK_SIZE);
                  while step > 0 {
                      let nxt = pos + step;
                      if nxt <= MK_SIZE && self.cnt[nxt] < c { pos = nxt; c -= self.cnt[nxt]; acc += self.tot[nxt]; }
                      step >>= 1;
                  }
                  acc + c * (pos as i64 + 1) // the rest all equal pos + 1
              }

              fn addElement(&mut self, num: i32) {
                  self.window.push_back(num);
                  self.update(num, 1);
                  if self.window.len() > self.m {
                      let old = self.window.pop_front().unwrap();
                      self.update(old, -1);
                  }
              }

              fn calculateMKAverage(&mut self) -> i32 {
                  if self.window.len() < self.m { return -1; }
                  ((self.smallest(self.m - self.k) - self.smallest(self.k)) / (self.m - 2 * self.k) as i64) as i32
              }
          }
        `,
        php: code`
          // Fenwick trees over values 1..2^17 (values are <= 10^5), kept sparse: only the
          // positions an update has touched exist.
          class MKAverage {
              const SIZE = 131072;
              private $m;
              private $k;
              private $window;
              private $cnt = [];
              private $tot = [];

              function __construct($m, $k) {
                  $this->m = $m;
                  $this->k = $k;
                  $this->window = new \SplQueue();
              }

              private function update($x, $c) {
                  for ($i = $x; $i <= self::SIZE; $i += $i & -$i) {
                      $this->cnt[$i] = ($this->cnt[$i] ?? 0) + $c;
                      $this->tot[$i] = ($this->tot[$i] ?? 0) + $c * $x;
                  }
              }

              private function smallest($c) { // sum of the c smallest values in the window
                  $pos = 0;
                  $acc = 0;
                  for ($step = self::SIZE; $step > 0; $step >>= 1) {
                      $nxt = $pos + $step;
                      $here = $this->cnt[$nxt] ?? 0;
                      if ($nxt <= self::SIZE && $here < $c) { $pos = $nxt; $c -= $here; $acc += $this->tot[$nxt] ?? 0; }
                  }
                  return $acc + $c * ($pos + 1); // the rest all equal pos + 1
              }

              function addElement($num) {
                  $this->window->enqueue($num);
                  $this->update($num, 1);
                  if (count($this->window) > $this->m) $this->update($this->window->dequeue(), -1);
              }

              function calculateMKAverage() {
                  if (count($this->window) < $this->m) return -1;
                  return intdiv($this->smallest($this->m - $this->k) - $this->smallest($this->k), $this->m - 2 * $this->k);
              }
          }
        `,
        ruby: code`
          class MKAverage
            SIZE = 1 << 17 # Fenwick trees over values 1..2^17 (values are <= 10^5)

            def initialize(m, k)
              @m = m
              @k = k
              @window = [] # every element added; the window is @window[@head..]
              @head = 0
              @cnt = Array.new(SIZE + 1, 0)
              @tot = Array.new(SIZE + 1, 0)
            end

            def update(x, c)
              i = x
              while i <= SIZE
                @cnt[i] += c
                @tot[i] += c * x
                i += i & -i
              end
            end

            def smallest(c) # sum of the c smallest values in the window
              pos = 0
              acc = 0
              step = SIZE
              while step > 0
                nxt = pos + step
                if nxt <= SIZE && @cnt[nxt] < c
                  pos = nxt
                  c -= @cnt[nxt]
                  acc += @tot[nxt]
                end
                step >>= 1
              end
              acc + c * (pos + 1) # the rest all equal pos + 1
            end

            def addElement(num)
              @window << num
              update(num, 1)
              if @window.length - @head > @m
                update(@window[@head], -1)
                @head += 1
              end
            end

            def calculateMKAverage
              return -1 if @window.length - @head < @m
              (smallest(@m - @k) - smallest(@k)) / (@m - 2 * @k)
            end
          end
        `,
      },
    };
  })(),

  // ── Design Movie Rental System (LC 1912) ──────────────────────────
  (() => {
    const run: Run = (ops, args) => {
      let entries: Array<{ shop: number; movie: number; price: number; out: boolean }> = [];
      const byPrice = (a: { price: number; shop: number; movie: number }, b: { price: number; shop: number; movie: number }) =>
        a.price - b.price || a.shop - b.shop || a.movie - b.movie;
      return ops.map((op, i) => {
        const a = args[i];
        if (op === "MovieRentingSystem") { entries = a[1].map((e: number[]) => ({ shop: e[0], movie: e[1], price: e[2], out: false })); return null; }
        if (op === "search") return entries.filter((e) => e.movie === a[0] && !e.out).sort(byPrice).slice(0, 5).map((e) => e.shop);
        if (op === "rent") { entries.find((e) => e.shop === a[0] && e.movie === a[1])!.out = true; return null; }
        if (op === "drop") { entries.find((e) => e.shop === a[0] && e.movie === a[1])!.out = false; return null; }
        if (op === "report") return entries.filter((e) => e.out).sort(byPrice).slice(0, 5).map((e) => [e.shop, e.movie]);
        return null;
      });
    };
    const ex = [
      {
        ops: ["MovieRentingSystem", "search", "rent", "rent", "report", "search", "drop", "search", "report"],
        args: [[4, [[0, 7, 30], [1, 7, 25], [2, 7, 30], [3, 7, 40], [1, 9, 10], [3, 9, 10]]], [7], [1, 7], [3, 9], [], [9], [1, 7], [7], []],
      },
      {
        ops: ["MovieRentingSystem", "search", "rent", "rent", "rent", "search", "report", "search"],
        args: [[6, [[0, 5, 2], [1, 5, 2], [2, 5, 2], [3, 5, 1], [4, 5, 2], [5, 5, 2]]], [5], [3, 5], [5, 5], [0, 5], [5], [], [8]],
      },
    ];
    return {
      slug: "design-movie-rental-system",
      title: "Design Movie Rental System",
      difficulty: "HARD" as const,
      tags: ["Array", "Hash Table", "Heap (Priority Queue)", "Ordered Set", "Design", "Flipkart"],
      signature: {
        funcName: "MovieRentingSystem", params: [{ name: "n", type: "int" as const }, { name: "entries", type: "int[][]" as const }], returns: "void" as const,
        methods: [
          { name: "search", params: [{ name: "movie", type: "int" as const }], returns: "int[]" as const },
          { name: "rent", params: [{ name: "shop", type: "int" as const }, { name: "movie", type: "int" as const }], returns: "void" as const },
          { name: "drop", params: [{ name: "shop", type: "int" as const }, { name: "movie", type: "int" as const }], returns: "void" as const },
          { name: "report", params: [], returns: "int[][]" as const },
        ],
      },
      description: describe(
        "A movie rental company has `n` shops, numbered `0` to `n - 1`. Each `entries[i] = [shop, movie, price]` says that `shop` has one copy of `movie` that rents for `price`. A shop carries at most one copy of each movie.\n\nWrite the class `MovieRentingSystem`:\n\n- `MovieRentingSystem(int n, int[][] entries)` sets up the shops; every copy starts out unrented.\n- `int[] search(int movie)` returns the shops that have an **unrented** copy of `movie` — the **cheapest 5** of them (all of them if fewer), ordered by price, then by shop number.\n- `void rent(int shop, int movie)` rents out the unrented copy of `movie` at `shop`.\n- `void drop(int shop, int movie)` returns the rented copy of `movie` to `shop`.\n- `int[][] report()` returns the **cheapest 5** rented copies as `[shop, movie]` pairs (all of them if fewer), ordered by price, then by shop, then by movie.\n\n`rent` is only called for a copy that is currently unrented, and `drop` only for one that is currently rented.\n\n" + CALLS,
        [
          exampleOf(run, ex[0].ops, ex[0].args, "Movie 7 is cheapest at shop 1 (25); shops 0 and 2 tie at 30 and are ordered by number. After renting, the rented copies sorted by price are movie 9 at shop 3 (10) and movie 7 at shop 1 (25). Once shop 1's copy of 7 comes back, it is the cheapest again."),
          exampleOf(run, ex[1].ops, ex[1].args, "Six shops have movie 5 but search lists only the cheapest five. After three rentals, three shops are left. No shop has movie 8."),
        ],
        ["1 <= n <= 3 * 10^5", "1 <= entries.length <= 10^5", "0 <= shop < n", "1 <= movie, price <= 10^4", "Each shop carries at most one copy of a movie", "At most 10^5 calls are made in total to search, rent, drop and report"]),
      hints: [
        "Both queries want \"the 5 smallest\" of a set that changes one element at a time — an ordered set per question.",
        "For each movie, keep its unrented copies ordered by (price, shop). Keep one global ordered set of rented copies ordered by (price, shop, movie). A map from (shop, movie) to price lets `rent` and `drop` find the keys.",
        "`rent` moves a copy from its movie's set into the rented set; `drop` moves it back. `search` and `report` read the first five elements.",
      ],
      editorial: explain({
        idea: "Each query is a top-5 over a set that changes by one element per update, so keep those sets ordered: per movie, the unrented copies by (price, shop); globally, the rented copies by (price, shop, movie).",
        steps: [
          "Build `price[(shop, movie)]` and, for every movie, an ordered set `avail[movie]` of `(price, shop)` holding all its copies; start an empty ordered set `rented` of `(price, shop, movie)`.",
          "`search(movie)`: return the shops of the first five elements of `avail[movie]` (an empty list if the movie is unknown).",
          "`rent(shop, movie)`: with `p = price[(shop, movie)]`, remove `(p, shop)` from `avail[movie]` and add `(p, shop, movie)` to `rented`.",
          "`drop(shop, movie)`: the reverse — remove from `rented`, add back to `avail[movie]`.",
          "`report()`: return `[shop, movie]` for the first five elements of `rented`.",
        ],
        why: "Every copy is in exactly one place: its movie's available set while unrented, the rented set while out — `rent` and `drop` move it across. The sets' orders are exactly the problem's tie-break rules, so their first five elements are the required answers.",
        time: "O(log E) per rent/drop and O(log E) (plus 5 steps) per search/report with balanced ordered sets; O(E log E) to build",
        space: "O(E) for E entries",
        pitfalls: [
          "Ties: order by price, then shop (and then movie in the report) — all ascending.",
          "Return fewer than five when fewer exist, and an empty list for a movie nobody carries or nobody has unrented.",
          "A shop number alone does not identify a copy — key the price lookup by the pair (shop, movie).",
        ],
      }),
      examples: ex.map((e) => caseOf(run, e.ops, e.args)),
      gen: (rng: Rng) => {
        const bigShops = rng() < 0.1;
        const n = bigShops ? 300000 : ri(rng, 1, 8);
        const movieTop = pick(rng, [2, 5, 10000]);
        const priceTop = pick(rng, [2, 5, 10000]);
        const seen = new Set<string>();
        const entries: number[][] = [];
        for (let t = ri(rng, 1, 22); t > 0; t--) {
          const shop = bigShops ? pick(rng, [0, 299999, ri(rng, 0, 299999)]) : ri(rng, 0, n - 1);
          const movie = ri(rng, 1, movieTop);
          if (seen.has(shop + "," + movie)) continue;
          seen.add(shop + "," + movie);
          entries.push([shop, movie, ri(rng, 1, priceTop)]);
        }
        const out = new Set<number>(); // indices of rented entries
        const ops = ["MovieRentingSystem"], args: Args = [[n, entries]];
        for (let c = ri(rng, 1, pick(rng, [8, 20, 40])); c > 0; c--) {
          const r = rng();
          const free = entries.map((_, j) => j).filter((j) => !out.has(j));
          if (r < 0.3 && free.length) { const j = pick(rng, free); out.add(j); ops.push("rent"); args.push([entries[j][0], entries[j][1]]); }
          else if (r < 0.45 && out.size) { const j = pick(rng, [...out]); out.delete(j); ops.push("drop"); args.push([entries[j][0], entries[j][1]]); }
          else if (r < 0.75) { ops.push("search"); args.push([rng() < 0.85 ? pick(rng, entries)[1] : ri(rng, 1, 10000)]); }
          else { ops.push("report"); args.push([]); }
        }
        return caseOf(run, ops, args);
      },
      solutions: {
        python: code`
          from bisect import bisect_left, insort

          class MovieRentingSystem:

              def __init__(self, n: int, entries: List[List[int]]):
                  self.price = {}   # (shop, movie) -> price
                  self.avail = {}   # movie -> sorted (price, shop) of unrented copies
                  self.rented = []  # sorted (price, shop, movie) of rented copies
                  for shop, movie, p in entries:
                      self.price[(shop, movie)] = p
                      self.avail.setdefault(movie, []).append((p, shop))
                  for lst in self.avail.values():
                      lst.sort()

              def search(self, movie: int) -> List[int]:
                  return [shop for _, shop in self.avail.get(movie, [])[:5]]

              def rent(self, shop: int, movie: int) -> None:
                  p = self.price[(shop, movie)]
                  lst = self.avail[movie]
                  del lst[bisect_left(lst, (p, shop))]
                  insort(self.rented, (p, shop, movie))

              def drop(self, shop: int, movie: int) -> None:
                  p = self.price[(shop, movie)]
                  del self.rented[bisect_left(self.rented, (p, shop, movie))]
                  insort(self.avail[movie], (p, shop))

              def report(self) -> List[List[int]]:
                  return [[shop, movie] for _, shop, movie in self.rented[:5]]
        `,
        javascript: code`
          // A copy's keys are packed into exact doubles: (price, shop) as price * 2^19 + shop,
          // and (price, shop, movie) as that times 2^14 plus movie — at most 2^47.
          var MR_SHOP = 524288, MR_MOVIE = 16384;

          function mrPos(a, x) { // first index whose key is >= x
              var lo = 0, hi = a.length;
              while (lo < hi) {
                  var mid = (lo + hi) >> 1;
                  if (a[mid] < x) lo = mid + 1; else hi = mid;
              }
              return lo;
          }

          var MovieRentingSystem = function(n, entries) {
              this.price = new Map(); // shop * 2^14 + movie -> price
              this.avail = new Map(); // movie -> sorted (price, shop) keys of unrented copies
              this.rented = [];       // sorted (price, shop, movie) keys of rented copies
              for (var i = 0; i < entries.length; i++) {
                  var shop = entries[i][0], movie = entries[i][1], p = entries[i][2];
                  this.price.set(shop * MR_MOVIE + movie, p);
                  if (!this.avail.has(movie)) this.avail.set(movie, []);
                  this.avail.get(movie).push(p * MR_SHOP + shop);
              }
              this.avail.forEach(function(a) { a.sort(function(x, y) { return x - y; }); });
          };

          MovieRentingSystem.prototype.search = function(movie) {
              var a = this.avail.get(movie) || [], out = [];
              for (var i = 0; i < a.length && i < 5; i++) out.push(a[i] % MR_SHOP);
              return out;
          };

          MovieRentingSystem.prototype.rent = function(shop, movie) {
              var p = this.price.get(shop * MR_MOVIE + movie), a = this.avail.get(movie), key = p * MR_SHOP + shop;
              a.splice(mrPos(a, key), 1);
              var full = key * MR_MOVIE + movie;
              this.rented.splice(mrPos(this.rented, full), 0, full);
          };

          MovieRentingSystem.prototype.drop = function(shop, movie) {
              var p = this.price.get(shop * MR_MOVIE + movie), a = this.avail.get(movie), key = p * MR_SHOP + shop;
              this.rented.splice(mrPos(this.rented, key * MR_MOVIE + movie), 1);
              a.splice(mrPos(a, key), 0, key);
          };

          MovieRentingSystem.prototype.report = function() {
              var out = [];
              for (var i = 0; i < this.rented.length && i < 5; i++) {
                  var full = this.rented[i], movie = full % MR_MOVIE, key = (full - movie) / MR_MOVIE;
                  out.push([key % MR_SHOP, movie]);
              }
              return out;
          };
        `,
        typescript: code`
          // A copy's keys are packed into exact doubles: (price, shop) as price * 2^19 + shop,
          // and (price, shop, movie) as that times 2^14 plus movie — at most 2^47.
          class MovieRentingSystem {
              price: { [shopMovie: number]: number };
              avail: { [movie: number]: number[] }; // sorted (price, shop) keys of unrented copies
              rented: number[];                     // sorted (price, shop, movie) keys of rented copies

              constructor(n: number, entries: number[][]) {
                  this.price = {};
                  this.avail = {};
                  this.rented = [];
                  for (var i = 0; i < entries.length; i++) {
                      var shop = entries[i][0], movie = entries[i][1], p = entries[i][2];
                      this.price[shop * 16384 + movie] = p;
                      if (this.avail[movie] === undefined) this.avail[movie] = [];
                      this.avail[movie].push(p * 524288 + shop);
                  }
                  for (var m in this.avail) this.avail[m].sort(function(x, y) { return x - y; });
              }

              pos(a: number[], x: number): number { // first index whose key is >= x
                  var lo = 0, hi = a.length;
                  while (lo < hi) {
                      var mid = (lo + hi) >> 1;
                      if (a[mid] < x) lo = mid + 1; else hi = mid;
                  }
                  return lo;
              }

              search(movie: number): number[] {
                  var a = this.avail[movie] || [], out: number[] = [];
                  for (var i = 0; i < a.length && i < 5; i++) out.push(a[i] % 524288);
                  return out;
              }

              rent(shop: number, movie: number): void {
                  var key = this.price[shop * 16384 + movie] * 524288 + shop, a = this.avail[movie];
                  a.splice(this.pos(a, key), 1);
                  var full = key * 16384 + movie;
                  this.rented.splice(this.pos(this.rented, full), 0, full);
              }

              drop(shop: number, movie: number): void {
                  var key = this.price[shop * 16384 + movie] * 524288 + shop, a = this.avail[movie];
                  this.rented.splice(this.pos(this.rented, key * 16384 + movie), 1);
                  a.splice(this.pos(a, key), 0, key);
              }

              report(): number[][] {
                  var out: number[][] = [];
                  for (var i = 0; i < this.rented.length && i < 5; i++) {
                      var full = this.rented[i], movie = full % 16384, key = (full - movie) / 16384;
                      out.push([key % 524288, movie]);
                  }
                  return out;
              }
          }
        `,
        java: code`
          class MovieRentingSystem {
              private HashMap<Long, Integer> price = new HashMap<>(); // (shop, movie) -> price
              private HashMap<Integer, TreeSet<int[]>> avail = new HashMap<>(); // movie -> {price, shop}
              private TreeSet<int[]> rented = new TreeSet<>((a, b) ->
                  a[0] != b[0] ? Integer.compare(a[0], b[0]) : a[1] != b[1] ? Integer.compare(a[1], b[1]) : Integer.compare(a[2], b[2]));

              private static long key(int shop, int movie) { return (long) shop << 14 | movie; }

              public MovieRentingSystem(int n, int[][] entries) {
                  for (int[] e : entries) {
                      price.put(key(e[0], e[1]), e[2]);
                      avail.computeIfAbsent(e[1], k -> new TreeSet<>((a, b) -> a[0] != b[0] ? Integer.compare(a[0], b[0]) : Integer.compare(a[1], b[1])))
                           .add(new int[]{e[2], e[0]});
                  }
              }

              public int[] search(int movie) {
                  TreeSet<int[]> s = avail.get(movie);
                  if (s == null) return new int[0];
                  int[] out = new int[Math.min(5, s.size())];
                  int i = 0;
                  for (int[] c : s) { if (i == out.length) break; out[i++] = c[1]; }
                  return out;
              }

              public void rent(int shop, int movie) {
                  int p = price.get(key(shop, movie));
                  avail.get(movie).remove(new int[]{p, shop});
                  rented.add(new int[]{p, shop, movie});
              }

              public void drop(int shop, int movie) {
                  int p = price.get(key(shop, movie));
                  rented.remove(new int[]{p, shop, movie});
                  avail.get(movie).add(new int[]{p, shop});
              }

              public int[][] report() {
                  int[][] out = new int[Math.min(5, rented.size())][];
                  int i = 0;
                  for (int[] c : rented) { if (i == out.length) break; out[i++] = new int[]{c[1], c[2]}; }
                  return out;
              }
          }
        `,
        cpp: code`
          class MovieRentingSystem {
              unordered_map<long long, int> price;              // (shop, movie) -> price
              unordered_map<int, set<pair<int, int>>> avail;    // movie -> (price, shop) unrented
              set<tuple<int, int, int>> rented;                 // (price, shop, movie)

              static long long key(int shop, int movie) { return (long long)shop << 14 | movie; }
          public:
              MovieRentingSystem(int n, vector<vector<int>>& entries) {
                  for (auto& e : entries) {
                      price[key(e[0], e[1])] = e[2];
                      avail[e[1]].insert({e[2], e[0]});
                  }
              }

              vector<int> search(int movie) {
                  vector<int> out;
                  auto it = avail.find(movie);
                  if (it == avail.end()) return out;
                  for (auto& c : it->second) {
                      if (out.size() == 5) break;
                      out.push_back(c.second);
                  }
                  return out;
              }

              void rent(int shop, int movie) {
                  int p = price[key(shop, movie)];
                  avail[movie].erase({p, shop});
                  rented.insert(make_tuple(p, shop, movie));
              }

              void drop(int shop, int movie) {
                  int p = price[key(shop, movie)];
                  rented.erase(make_tuple(p, shop, movie));
                  avail[movie].insert({p, shop});
              }

              vector<vector<int>> report() {
                  vector<vector<int>> out;
                  for (auto& c : rented) {
                      if (out.size() == 5) break;
                      out.push_back({get<1>(c), get<2>(c)});
                  }
                  return out;
              }
          };
        `,
        c: code`
          /* Movies are at most 10^4, so per-movie data lives in arrays indexed by movie. Each
             movie keeps all its copies sorted by shop (to look up a price) and its unrented
             copies as sorted packed keys price * 2^19 + shop; the rented copies are one sorted
             array of keys (price * 2^19 + shop) * 2^14 + movie. */
          #define MR_MOVIES 10001
          #define MR_SHOP 524288LL
          #define MR_MOVIE 16384LL

          typedef struct {
              int** shops;            /* movie -> its shops, ascending */
              int** prices;           /* movie -> the price at each of those shops */
              int* count;             /* movie -> number of copies */
              long long** avail;      /* movie -> sorted keys of unrented copies */
              int* availN;
              long long* rented;
              int rentedN;
              int* used;              /* movies that have copies */
              int usedN;
          } MovieRentingSystem;

          static int mrCmpInt(const void* a, const void* b) { return (*(const int*)a > *(const int*)b) - (*(const int*)a < *(const int*)b); }
          static int mrCmpLL(const void* a, const void* b) { return (*(const long long*)a > *(const long long*)b) - (*(const long long*)a < *(const long long*)b); }

          static int mrPos(long long* a, int n, long long x) { /* first index whose key is >= x */
              int lo = 0, hi = n;
              while (lo < hi) {
                  int mid = (lo + hi) / 2;
                  if (a[mid] < x) lo = mid + 1; else hi = mid;
              }
              return lo;
          }

          MovieRentingSystem* movieRentingSystemCreate(int n, int** entries, int entriesSize, int* entriesColSize) {
              MovieRentingSystem* s = (MovieRentingSystem*)malloc(sizeof(MovieRentingSystem));
              s->shops = (int**)calloc(MR_MOVIES, sizeof(int*));
              s->prices = (int**)calloc(MR_MOVIES, sizeof(int*));
              s->count = (int*)calloc(MR_MOVIES, sizeof(int));
              s->avail = (long long**)calloc(MR_MOVIES, sizeof(long long*));
              s->availN = (int*)calloc(MR_MOVIES, sizeof(int));
              s->rented = (long long*)malloc((entriesSize + 1) * sizeof(long long));
              s->rentedN = 0;
              s->used = (int*)malloc((entriesSize + 1) * sizeof(int));
              s->usedN = 0;
              for (int i = 0; i < entriesSize; i++) {
                  int m = entries[i][1];
                  if (s->count[m] == 0) s->used[s->usedN++] = m;
                  s->count[m]++;
              }
              for (int u = 0; u < s->usedN; u++) {
                  int m = s->used[u];
                  s->shops[m] = (int*)malloc(s->count[m] * sizeof(int));
                  s->prices[m] = (int*)malloc(s->count[m] * sizeof(int));
                  s->avail[m] = (long long*)malloc(s->count[m] * sizeof(long long));
              }
              /* (shop, price) pairs per movie, packed as shop * 2^14 + price so one sort orders by shop */
              long long** tmp = (long long**)malloc(MR_MOVIES * sizeof(long long*));
              int* fill = (int*)calloc(MR_MOVIES, sizeof(int));
              for (int u = 0; u < s->usedN; u++) tmp[s->used[u]] = (long long*)malloc(s->count[s->used[u]] * sizeof(long long));
              for (int i = 0; i < entriesSize; i++) {
                  int shop = entries[i][0], m = entries[i][1], p = entries[i][2];
                  tmp[m][fill[m]] = (long long)shop * MR_MOVIE + p;
                  s->avail[m][fill[m]] = p * MR_SHOP + shop;
                  fill[m]++;
              }
              for (int u = 0; u < s->usedN; u++) {
                  int m = s->used[u];
                  qsort(tmp[m], s->count[m], sizeof(long long), mrCmpLL);
                  for (int j = 0; j < s->count[m]; j++) {
                      s->shops[m][j] = (int)(tmp[m][j] / MR_MOVIE);
                      s->prices[m][j] = (int)(tmp[m][j] % MR_MOVIE);
                  }
                  qsort(s->avail[m], s->count[m], sizeof(long long), mrCmpLL);
                  s->availN[m] = s->count[m];
                  free(tmp[m]);
              }
              free(tmp);
              free(fill);
              return s;
          }

          static int mrPrice(MovieRentingSystem* s, int shop, int movie) {
              int* a = s->shops[movie];
              int lo = 0, hi = s->count[movie];
              while (lo < hi) {
                  int mid = (lo + hi) / 2;
                  if (a[mid] < shop) lo = mid + 1; else hi = mid;
              }
              return s->prices[movie][lo];
          }

          int* movieRentingSystemSearch(MovieRentingSystem* obj, int movie, int* returnSize) {
              int* out = (int*)malloc(5 * sizeof(int));
              int k = 0;
              if (movie < MR_MOVIES)
                  for (; k < 5 && k < obj->availN[movie]; k++) out[k] = (int)(obj->avail[movie][k] % MR_SHOP);
              *returnSize = k;
              return out;
          }

          void movieRentingSystemRent(MovieRentingSystem* obj, int shop, int movie) {
              long long key = mrPrice(obj, shop, movie) * MR_SHOP + shop;
              long long* a = obj->avail[movie];
              int i = mrPos(a, obj->availN[movie], key);
              memmove(a + i, a + i + 1, (obj->availN[movie] - i - 1) * sizeof(long long));
              obj->availN[movie]--;
              long long full = key * MR_MOVIE + movie;
              int j = mrPos(obj->rented, obj->rentedN, full);
              memmove(obj->rented + j + 1, obj->rented + j, (obj->rentedN - j) * sizeof(long long));
              obj->rented[j] = full;
              obj->rentedN++;
          }

          void movieRentingSystemDrop(MovieRentingSystem* obj, int shop, int movie) {
              long long key = mrPrice(obj, shop, movie) * MR_SHOP + shop;
              int j = mrPos(obj->rented, obj->rentedN, key * MR_MOVIE + movie);
              memmove(obj->rented + j, obj->rented + j + 1, (obj->rentedN - j - 1) * sizeof(long long));
              obj->rentedN--;
              long long* a = obj->avail[movie];
              int i = mrPos(a, obj->availN[movie], key);
              memmove(a + i + 1, a + i, (obj->availN[movie] - i) * sizeof(long long));
              a[i] = key;
              obj->availN[movie]++;
          }

          int** movieRentingSystemReport(MovieRentingSystem* obj, int* returnSize, int** returnColumnSizes) {
              int k = obj->rentedN < 5 ? obj->rentedN : 5;
              int** out = (int**)malloc(5 * sizeof(int*));
              *returnColumnSizes = (int*)malloc(5 * sizeof(int));
              for (int i = 0; i < k; i++) {
                  long long full = obj->rented[i];
                  out[i] = (int*)malloc(2 * sizeof(int));
                  out[i][0] = (int)((full / MR_MOVIE) % MR_SHOP);
                  out[i][1] = (int)(full % MR_MOVIE);
                  (*returnColumnSizes)[i] = 2;
              }
              *returnSize = k;
              return out;
          }

          void movieRentingSystemFree(MovieRentingSystem* obj) {
              for (int u = 0; u < obj->usedN; u++) {
                  int m = obj->used[u];
                  free(obj->shops[m]);
                  free(obj->prices[m]);
                  free(obj->avail[m]);
              }
              free(obj->shops); free(obj->prices); free(obj->count);
              free(obj->avail); free(obj->availN); free(obj->rented); free(obj->used);
              free(obj);
          }
        `,
        csharp: code`
          public class MovieRentingSystem {
              private Dictionary<long, int> price = new Dictionary<long, int>();                 // (shop, movie) -> price
              private Dictionary<int, SortedSet<long>> avail = new Dictionary<int, SortedSet<long>>(); // movie -> price * 2^19 + shop
              private SortedSet<long> rented = new SortedSet<long>(); // (price * 2^19 + shop) * 2^14 + movie

              private static long Key(int shop, int movie) { return ((long)shop << 14) | (long)movie; }

              public MovieRentingSystem(int n, int[][] entries) {
                  foreach (var e in entries) {
                      price[Key(e[0], e[1])] = e[2];
                      SortedSet<long> s;
                      if (!avail.TryGetValue(e[1], out s)) { s = new SortedSet<long>(); avail[e[1]] = s; }
                      s.Add(((long)e[2] << 19) | (long)e[0]);
                  }
              }

              public int[] Search(int movie) {
                  var res = new List<int>();
                  SortedSet<long> s;
                  if (avail.TryGetValue(movie, out s)) {
                      foreach (long c in s) {
                          if (res.Count == 5) break;
                          res.Add((int)(c & ((1L << 19) - 1)));
                      }
                  }
                  return res.ToArray();
              }

              public void Rent(int shop, int movie) {
                  long key = ((long)price[Key(shop, movie)] << 19) | (long)shop;
                  avail[movie].Remove(key);
                  rented.Add((key << 14) | (long)movie);
              }

              public void Drop(int shop, int movie) {
                  long key = ((long)price[Key(shop, movie)] << 19) | (long)shop;
                  rented.Remove((key << 14) | (long)movie);
                  avail[movie].Add(key);
              }

              public int[][] Report() {
                  var res = new List<int[]>();
                  foreach (long c in rented) {
                      if (res.Count == 5) break;
                      res.Add(new int[] { (int)((c >> 14) & ((1L << 19) - 1)), (int)(c & ((1L << 14) - 1)) });
                  }
                  return res.ToArray();
              }
          }
        `,
        go: code`
          // Keys are packed: (price, shop) as price<<19 | shop and (price, shop, movie) as that<<14 | movie.
          type MovieRentingSystem struct {
          	price  map[int]int   // shop<<14 | movie -> price
          	avail  map[int][]int // movie -> sorted (price, shop) keys of unrented copies
          	rented []int         // sorted (price, shop, movie) keys of rented copies
          }

          func Constructor(n int, entries [][]int) MovieRentingSystem {
          	s := MovieRentingSystem{price: map[int]int{}, avail: map[int][]int{}}
          	for _, e := range entries {
          		s.price[e[0]<<14|e[1]] = e[2]
          		s.avail[e[1]] = append(s.avail[e[1]], e[2]<<19|e[0])
          	}
          	for _, a := range s.avail {
          		sort.Ints(a)
          	}
          	return s
          }

          func mrInsert(a []int, x int) []int {
          	i := sort.SearchInts(a, x)
          	a = append(a, 0)
          	copy(a[i+1:], a[i:])
          	a[i] = x
          	return a
          }

          func mrRemove(a []int, x int) []int {
          	i := sort.SearchInts(a, x)
          	return append(a[:i], a[i+1:]...)
          }

          func (this *MovieRentingSystem) Search(movie int) []int {
          	out := []int{}
          	for _, k := range this.avail[movie] {
          		if len(out) == 5 {
          			break
          		}
          		out = append(out, k&(1<<19-1))
          	}
          	return out
          }

          func (this *MovieRentingSystem) Rent(shop int, movie int) {
          	key := this.price[shop<<14|movie]<<19 | shop
          	this.avail[movie] = mrRemove(this.avail[movie], key)
          	this.rented = mrInsert(this.rented, key<<14|movie)
          }

          func (this *MovieRentingSystem) Drop(shop int, movie int) {
          	key := this.price[shop<<14|movie]<<19 | shop
          	this.rented = mrRemove(this.rented, key<<14|movie)
          	this.avail[movie] = mrInsert(this.avail[movie], key)
          }

          func (this *MovieRentingSystem) Report() [][]int {
          	out := [][]int{}
          	for _, k := range this.rented {
          		if len(out) == 5 {
          			break
          		}
          		out = append(out, []int{(k >> 14) & (1<<19 - 1), k & (1<<14 - 1)})
          	}
          	return out
          }
        `,
        kotlin: code`
          class MovieRentingSystem(n: Int, entries: Array<IntArray>) {
              private val price = HashMap<Long, Int>()                       // (shop, movie) -> price
              private val avail = HashMap<Int, java.util.TreeSet<Long>>()    // movie -> price shl 19 or shop
              private val rented = java.util.TreeSet<Long>()                 // (price shl 19 or shop) shl 14 or movie

              private fun key(shop: Int, movie: Int): Long = (shop.toLong() shl 14) or movie.toLong()

              init {
                  for (e in entries) {
                      price[key(e[0], e[1])] = e[2]
                      avail.getOrPut(e[1]) { java.util.TreeSet<Long>() }.add((e[2].toLong() shl 19) or e[0].toLong())
                  }
              }

              fun search(movie: Int): IntArray {
                  val s = avail[movie] ?: return intArrayOf()
                  val out = ArrayList<Int>()
                  for (c in s) {
                      if (out.size == 5) break
                      out.add((c and ((1L shl 19) - 1)).toInt())
                  }
                  return out.toIntArray()
              }

              fun rent(shop: Int, movie: Int) {
                  val k = (price[key(shop, movie)]!!.toLong() shl 19) or shop.toLong()
                  avail[movie]!!.remove(k)
                  rented.add((k shl 14) or movie.toLong())
              }

              fun drop(shop: Int, movie: Int) {
                  val k = (price[key(shop, movie)]!!.toLong() shl 19) or shop.toLong()
                  rented.remove((k shl 14) or movie.toLong())
                  avail[movie]!!.add(k)
              }

              fun report(): Array<IntArray> {
                  val out = ArrayList<IntArray>()
                  for (c in rented) {
                      if (out.size == 5) break
                      out.add(intArrayOf(((c shr 14) and ((1L shl 19) - 1)).toInt(), (c and ((1L shl 14) - 1)).toInt()))
                  }
                  return out.toTypedArray()
              }
          }
        `,
        swift: code`
          // Keys are packed: (price, shop) as price << 19 | shop and (price, shop, movie) as that << 14 | movie.
          class MovieRentingSystem {
              var price: [Int: Int] = [:]   // shop << 14 | movie -> price
              var avail: [Int: [Int]] = [:] // movie -> sorted (price, shop) keys of unrented copies
              var rented: [Int] = []        // sorted (price, shop, movie) keys of rented copies

              init(_ n: Int, _ entries: [[Int]]) {
                  for e in entries {
                      price[e[0] << 14 | e[1]] = e[2]
                      avail[e[1], default: []].append(e[2] << 19 | e[0])
                  }
                  for m in Array(avail.keys) { avail[m]!.sort() }
              }

              func pos(_ a: [Int], _ x: Int) -> Int { // first index whose key is >= x
                  var lo = 0, hi = a.count
                  while lo < hi {
                      let mid = (lo + hi) / 2
                      if a[mid] < x { lo = mid + 1 } else { hi = mid }
                  }
                  return lo
              }

              func search(_ movie: Int) -> [Int] {
                  guard let a = avail[movie] else { return [] }
                  return a.prefix(5).map { $0 & ((1 << 19) - 1) }
              }

              func rent(_ shop: Int, _ movie: Int) {
                  let key = price[shop << 14 | movie]! << 19 | shop
                  avail[movie]!.remove(at: pos(avail[movie]!, key))
                  let full = key << 14 | movie
                  rented.insert(full, at: pos(rented, full))
              }

              func drop(_ shop: Int, _ movie: Int) {
                  let key = price[shop << 14 | movie]! << 19 | shop
                  rented.remove(at: pos(rented, key << 14 | movie))
                  avail[movie]!.insert(key, at: pos(avail[movie]!, key))
              }

              func report() -> [[Int]] {
                  return rented.prefix(5).map { [($0 >> 14) & ((1 << 19) - 1), $0 & ((1 << 14) - 1)] }
              }
          }
        `,
        rust: code`
          use std::collections::{BTreeSet, HashMap};

          struct MovieRentingSystem {
              price: HashMap<(i32, i32), i32>,             // (shop, movie) -> price
              avail: HashMap<i32, BTreeSet<(i32, i32)>>,   // movie -> (price, shop) unrented
              rented: BTreeSet<(i32, i32, i32)>,           // (price, shop, movie)
          }

          impl MovieRentingSystem {
              fn new(n: i32, entries: Vec<Vec<i32>>) -> Self {
                  let mut s = MovieRentingSystem { price: HashMap::new(), avail: HashMap::new(), rented: BTreeSet::new() };
                  for e in entries.iter() {
                      s.price.insert((e[0], e[1]), e[2]);
                      s.avail.entry(e[1]).or_insert_with(BTreeSet::new).insert((e[2], e[0]));
                  }
                  s
              }

              fn search(&mut self, movie: i32) -> Vec<i32> {
                  match self.avail.get(&movie) {
                      Some(set) => set.iter().take(5).map(|&(_, shop)| shop).collect(),
                      None => vec![],
                  }
              }

              fn rent(&mut self, shop: i32, movie: i32) {
                  let p = self.price[&(shop, movie)];
                  self.avail.get_mut(&movie).unwrap().remove(&(p, shop));
                  self.rented.insert((p, shop, movie));
              }

              fn drop(&mut self, shop: i32, movie: i32) {
                  let p = self.price[&(shop, movie)];
                  self.rented.remove(&(p, shop, movie));
                  self.avail.get_mut(&movie).unwrap().insert((p, shop));
              }

              fn report(&mut self) -> Vec<Vec<i32>> {
                  self.rented.iter().take(5).map(|&(_, shop, movie)| vec![shop, movie]).collect()
              }
          }
        `,
        php: code`
          // Keys are packed: (price, shop) as price << 19 | shop and (price, shop, movie) as that << 14 | movie.
          class MovieRentingSystem {
              private $price = [];  // shop << 14 | movie -> price
              private $avail = [];  // movie -> sorted (price, shop) keys of unrented copies
              private $rented = []; // sorted (price, shop, movie) keys of rented copies

              function __construct($n, $entries) {
                  foreach ($entries as $e) {
                      $this->price[($e[0] << 14) | $e[1]] = $e[2];
                      $this->avail[$e[1]][] = ($e[2] << 19) | $e[0];
                  }
                  foreach ($this->avail as $m => $a) {
                      sort($a);
                      $this->avail[$m] = $a;
                  }
              }

              private function pos($a, $x) { // first index whose key is >= x
                  $lo = 0;
                  $hi = count($a);
                  while ($lo < $hi) {
                      $mid = ($lo + $hi) >> 1;
                      if ($a[$mid] < $x) $lo = $mid + 1; else $hi = $mid;
                  }
                  return $lo;
              }

              function search($movie) {
                  $out = [];
                  foreach (array_slice($this->avail[$movie] ?? [], 0, 5) as $k) $out[] = $k & ((1 << 19) - 1);
                  return $out;
              }

              function rent($shop, $movie) {
                  $key = ($this->price[($shop << 14) | $movie] << 19) | $shop;
                  array_splice($this->avail[$movie], $this->pos($this->avail[$movie], $key), 1);
                  $full = ($key << 14) | $movie;
                  array_splice($this->rented, $this->pos($this->rented, $full), 0, [$full]);
              }

              function drop($shop, $movie) {
                  $key = ($this->price[($shop << 14) | $movie] << 19) | $shop;
                  array_splice($this->rented, $this->pos($this->rented, ($key << 14) | $movie), 1);
                  array_splice($this->avail[$movie], $this->pos($this->avail[$movie], $key), 0, [$key]);
              }

              function report() {
                  $out = [];
                  foreach (array_slice($this->rented, 0, 5) as $k) $out[] = [($k >> 14) & ((1 << 19) - 1), $k & ((1 << 14) - 1)];
                  return $out;
              }
          }
        `,
        ruby: code`
          class MovieRentingSystem
            def initialize(n, entries)
              @price = {}   # [shop, movie] -> price
              @avail = {}   # movie -> sorted [price, shop] of unrented copies
              @rented = []  # sorted [price, shop, movie] of rented copies
              entries.each do |shop, movie, p|
                @price[[shop, movie]] = p
                (@avail[movie] ||= []) << [p, shop]
              end
              @avail.each_value(&:sort!)
            end

            def pos(a, x) # first index whose element is >= x
              a.bsearch_index { |y| (y <=> x) >= 0 } || a.length
            end

            def search(movie)
              (@avail[movie] || []).first(5).map { |_, shop| shop }
            end

            def rent(shop, movie)
              p = @price[[shop, movie]]
              a = @avail[movie]
              a.delete_at(pos(a, [p, shop]))
              key = [p, shop, movie]
              @rented.insert(pos(@rented, key), key)
            end

            def drop(shop, movie)
              p = @price[[shop, movie]]
              @rented.delete_at(pos(@rented, [p, shop, movie]))
              a = @avail[movie]
              a.insert(pos(a, [p, shop]), [p, shop])
            end

            def report
              @rented.first(5).map { |_, shop, movie| [shop, movie] }
            end
          end
        `,
      },
    };
  })(),

  // ── Sequentially Ordinal Rank Tracker (LC 2102) ───────────────────
  (() => {
    const run: Run = (ops, args) => {
      const locs: Array<[string, number]> = [];
      let gets = 0;
      return ops.map((op, i) => {
        if (op === "add") { locs.push([args[i][0], args[i][1]]); return null; }
        if (op === "get") {
          const sorted = locs.slice().sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
          return sorted[gets++][0];
        }
        return null;
      });
    };
    const ex = [
      {
        ops: ["SORTracker", "add", "add", "get", "add", "get", "add", "get", "add", "get", "add", "get"],
        args: [[], ["ooty", 4], ["goa", 3], [], ["agra", 4], [], ["kochi", 2], [], ["delhi", 5], [], ["pune", 3], []],
      },
      { ops: ["SORTracker", "add", "add", "get", "get"], args: [[], ["z", 1], ["a", 1], [], []] },
    ];
    return {
      slug: "sequentially-ordinal-rank-tracker",
      title: "Sequentially Ordinal Rank Tracker",
      difficulty: "HARD" as const,
      tags: ["Design", "Heap (Priority Queue)", "Ordered Set", "Google"],
      signature: {
        funcName: "SORTracker", params: [], returns: "void" as const,
        methods: [
          { name: "add", params: [{ name: "name", type: "string" as const }, { name: "score", type: "int" as const }], returns: "void" as const },
          { name: "get", params: [], returns: "string" as const },
        ],
      },
      description: describe(
        "A travel site ranks scenic locations. Each location has a unique `name` and a `score`; a location ranks **better** than another if its score is higher, or if the scores are equal and its name is lexicographically smaller.\n\nLocations are added one at a time, and the site keeps asking for the next one down the ranking: the first `get` returns the best location, the second `get` the 2nd best, and so on — each counted over **all** locations added up to that moment.\n\nWrite the class `SORTracker`:\n\n- `SORTracker()` starts with no locations.\n- `void add(String name, int score)` adds a location.\n- `String get()` returns the name of the `i`-th best location added so far, where `i` is the number of times `get` has been called, including this call.\n\n`get` is never called more times than the number of locations added so far.\n\n" + CALLS,
        [
          exampleOf(run, ex[0].ops, ex[0].args, "First get: ooty is best. After agra (also 4, smaller name) the ranking is agra, ooty, goa, so the 2nd is ooty. Kochi (2) makes goa 3rd. Delhi (5) goes on top: delhi, agra, ooty, goa, kochi — the 4th is goa. Pune ties goa at 3 but comes after it by name, so it is 5th."),
          exampleOf(run, ex[1].ops, ex[1].args, "Equal scores are ranked by name: \"a\" before \"z\"."),
        ],
        ["name consists of lowercase English letters and is unique among all added locations", "1 <= name.length <= 10", "1 <= score <= 10^5", "At most 4 * 10^4 calls are made in total to add and get", "get is called at most as many times as add, counting only the calls made so far"]),
      hints: [
        "Sorting on every `get` is too slow. Notice that the rank asked for only ever moves forward by one.",
        "Split the locations in two: the `i` best seen so far (where `i` = gets so far), and everything else. You only ever need the *worst* of the first group and the *best* of the second.",
        "Two heaps: a heap of the top group with its worst on top, and a heap of the rest with its best on top. `add` pushes into the top group and then moves that group's worst across; `get` moves the best of the rest into the top group and returns it.",
      ],
      editorial: explain({
        idea: "Keep the locations split into the `i` best so far (`i` = number of `get` calls) and the rest, each in a heap ordered so that the boundary element is on top: the worst of the best group, and the best of the rest. Each operation moves one element across the boundary.",
        steps: [
          "Use \"better\" = higher score, or equal score and smaller name.",
          "`best`: a heap whose top is the *worst* location in it. `rest`: a heap whose top is the *best* location in it. Both start empty.",
          "`add(name, score)`: push the location into `best`, then pop `best`'s worst and push it into `rest`. `best` keeps its size.",
          "`get()`: pop the best location of `rest`, push it into `best`, and return its name.",
        ],
        why: "Invariant: `best` holds exactly the `i` best locations added so far and `rest` all others. When a location is added, the `i + 1` candidates in `best` lose their worst one to `rest`, so `best` again holds the `i` best. On a `get`, the `(i + 1)`-th best location overall is the best one outside the top `i`, i.e. the top of `rest`; moving it makes `best` hold the `i + 1` best — and it is exactly the location the call must return.",
        time: "O(log n) per call",
        space: "O(n)",
        pitfalls: [
          "Each heap needs the full two-key order — by score, then by name — and the two heaps need *opposite* orders.",
          "After an `add` the answer of the next `get` may change even though `i` does not: always route a new location through `best` so a better newcomer pushes the old boundary element out.",
        ],
      }),
      examples: ex.map((e) => caseOf(run, e.ops, e.args)),
      gen: (rng: Rng) => {
        const alpha = pick(rng, ["ab", "abc", "abcdefghijklmnopqrstuvwxyz"]);
        const scoreTop = pick(rng, [2, 5, 100000]);
        const used = new Set<string>();
        let adds = 0, gets = 0;
        const ops = ["SORTracker"], args: Args = [[]];
        for (let c = ri(rng, 1, pick(rng, [6, 20, 40])); c > 0; c--) {
          if (gets < adds && rng() < 0.45) { gets++; ops.push("get"); args.push([]); continue; }
          let name = "";
          for (let t = 0; t < 50; t++) { name = randLower(rng, 1, pick(rng, [3, 10]), alpha); if (!used.has(name)) break; }
          if (used.has(name)) continue;
          used.add(name);
          adds++;
          ops.push("add"); args.push([name, rng() < 0.05 ? 100000 : ri(rng, 1, scoreTop)]);
        }
        if (gets < adds) { ops.push("get"); args.push([]); }
        return caseOf(run, ops, args);
      },
      solutions: {
        python: code`
          import heapq

          class Worst:  # heap entry whose smallest element is the worst-ranked location
              __slots__ = ("score", "name")

              def __init__(self, score, name):
                  self.score, self.name = score, name

              def __lt__(self, other):
                  return self.score < other.score or (self.score == other.score and self.name > other.name)

          class SORTracker:

              def __init__(self):
                  self.best = []  # the i best so far; top = the worst of them
                  self.rest = []  # everything else as (-score, name); top = the best of them

              def add(self, name: str, score: int) -> None:
                  w = heapq.heappushpop(self.best, Worst(score, name))
                  heapq.heappush(self.rest, (-w.score, w.name))

              def get(self) -> str:
                  s, name = heapq.heappop(self.rest)
                  heapq.heappush(self.best, Worst(-s, name))
                  return name
        `,
        javascript: code`
          // better(a, b): a ranks above b — higher score, or equal score and smaller name.
          function sorBetter(a, b) { return a.score > b.score || (a.score === b.score && a.name < b.name); }

          // A binary heap whose top is the element for which first(top, x) holds against every x.
          function SorHeap(first) { this.a = []; this.first = first; }
          SorHeap.prototype.push = function(x) {
              var a = this.a, i = a.length;
              a.push(x);
              while (i > 0) {
                  var p = (i - 1) >> 1;
                  if (!this.first(x, a[p])) break;
                  a[i] = a[p]; i = p;
              }
              a[i] = x;
          };
          SorHeap.prototype.pop = function() {
              var a = this.a, top = a[0], last = a.pop();
              if (a.length > 0) {
                  var i = 0, n = a.length;
                  for (;;) {
                      var l = 2 * i + 1, r = l + 1, m = i, mv = last;
                      if (l < n && this.first(a[l], mv)) { m = l; mv = a[l]; }
                      if (r < n && this.first(a[r], mv)) { m = r; }
                      if (m === i) break;
                      a[i] = a[m]; i = m;
                  }
                  a[i] = last;
              }
              return top;
          };

          var SORTracker = function() {
              this.best = new SorHeap(function(x, y) { return sorBetter(y, x); }); // top = worst of the i best
              this.rest = new SorHeap(sorBetter);                                    // top = best of the rest
          };

          SORTracker.prototype.add = function(name, score) {
              this.best.push({ name: name, score: score });
              this.rest.push(this.best.pop());
          };

          SORTracker.prototype.get = function() {
              var x = this.rest.pop();
              this.best.push(x);
              return x.name;
          };
        `,
        typescript: code`
          interface SorLoc { name: string; score: number; }

          // A binary heap whose top is the element for which first(top, x) holds against every x.
          class SorHeap {
              a: SorLoc[];
              first: (x: SorLoc, y: SorLoc) => boolean;
              constructor(first: (x: SorLoc, y: SorLoc) => boolean) { this.a = []; this.first = first; }
              push(x: SorLoc): void {
                  var a = this.a, i = a.length;
                  a.push(x);
                  while (i > 0) {
                      var p = (i - 1) >> 1;
                      if (!this.first(x, a[p])) break;
                      a[i] = a[p]; i = p;
                  }
                  a[i] = x;
              }
              pop(): SorLoc {
                  var a = this.a, top = a[0], last = a.pop();
                  if (a.length > 0) {
                      var i = 0, n = a.length;
                      for (;;) {
                          var l = 2 * i + 1, r = l + 1, m = i, mv = last;
                          if (l < n && this.first(a[l], mv)) { m = l; mv = a[l]; }
                          if (r < n && this.first(a[r], mv)) { m = r; }
                          if (m === i) break;
                          a[i] = a[m]; i = m;
                      }
                      a[i] = last;
                  }
                  return top;
              }
          }

          // better(a, b): a ranks above b — higher score, or equal score and smaller name.
          function sorBetter(a: SorLoc, b: SorLoc): boolean { return a.score > b.score || (a.score === b.score && a.name < b.name); }

          class SORTracker {
              best: SorHeap; // the i best so far; top = the worst of them
              rest: SorHeap; // everything else; top = the best of them

              constructor() {
                  this.best = new SorHeap(function(x, y) { return sorBetter(y, x); });
                  this.rest = new SorHeap(sorBetter);
              }

              add(name: string, score: number): void {
                  this.best.push({ name: name, score: score });
                  this.rest.push(this.best.pop());
              }

              get(): string {
                  var x = this.rest.pop();
                  this.best.push(x);
                  return x.name;
              }
          }
        `,
        java: code`
          class SORTracker {
              private static final class Loc {
                  final String name;
                  final int score;
                  Loc(String name, int score) { this.name = name; this.score = score; }
              }

              // RANK: better locations first — higher score, then smaller name.
              private static final Comparator<Loc> RANK = (a, b) -> a.score != b.score ? Integer.compare(b.score, a.score) : a.name.compareTo(b.name);
              private final PriorityQueue<Loc> best = new PriorityQueue<>(RANK.reversed()); // top = worst of the i best
              private final PriorityQueue<Loc> rest = new PriorityQueue<>(RANK);            // top = best of the rest

              public SORTracker() {
              }

              public void add(String name, int score) {
                  best.offer(new Loc(name, score));
                  rest.offer(best.poll());
              }

              public String get() {
                  Loc x = rest.poll();
                  best.offer(x);
                  return x.name;
              }
          }
        `,
        cpp: code`
          class SORTracker {
              // better(a, b): a ranks above b — higher score, then smaller name.
              struct Loc { int score; string name; };
              struct WorstOnTop { bool operator()(const Loc& a, const Loc& b) const {   // a is "less" when a is better
                  return a.score > b.score || (a.score == b.score && a.name < b.name); } };
              struct BestOnTop { bool operator()(const Loc& a, const Loc& b) const {    // a is "less" when a is worse
                  return a.score < b.score || (a.score == b.score && a.name > b.name); } };
              priority_queue<Loc, vector<Loc>, WorstOnTop> best; // the i best so far
              priority_queue<Loc, vector<Loc>, BestOnTop> rest;  // everything else
          public:
              SORTracker() {}

              void add(string name, int score) {
                  best.push({score, name});
                  rest.push(best.top());
                  best.pop();
              }

              string get() {
                  Loc x = rest.top();
                  rest.pop();
                  best.push(x);
                  return x.name;
              }
          };
        `,
        c: code`
          /* Two binary heaps of locations. sorBetter(a, b): a ranks above b — higher score,
             or equal score and smaller name. */
          typedef struct {
              int score;
              char* name;
          } SorLoc;

          typedef struct {
              SorLoc* a;
              int n, cap;
              int bestOnTop; /* 1: top is the best element; 0: top is the worst */
          } SorHeap;

          typedef struct {
              SorHeap best; /* the i best so far; top = the worst of them */
              SorHeap rest; /* everything else; top = the best of them */
          } SORTracker;

          static int sorBetter(SorLoc* x, SorLoc* y) {
              return x->score > y->score || (x->score == y->score && strcmp(x->name, y->name) < 0);
          }

          static int sorFirst(SorHeap* h, SorLoc* x, SorLoc* y) { /* does x belong above y? */
              return h->bestOnTop ? sorBetter(x, y) : sorBetter(y, x);
          }

          static void sorPush(SorHeap* h, SorLoc x) {
              if (h->n == h->cap) { h->cap = h->cap ? h->cap * 2 : 16; h->a = (SorLoc*)realloc(h->a, h->cap * sizeof(SorLoc)); }
              int i = h->n++;
              while (i > 0 && sorFirst(h, &x, &h->a[(i - 1) / 2])) { h->a[i] = h->a[(i - 1) / 2]; i = (i - 1) / 2; }
              h->a[i] = x;
          }

          static SorLoc sorPop(SorHeap* h) {
              SorLoc top = h->a[0], last = h->a[--h->n];
              int i = 0;
              if (h->n > 0) {
                  for (;;) {
                      int l = 2 * i + 1, r = l + 1, m = i;
                      SorLoc* mv = &last;
                      if (l < h->n && sorFirst(h, &h->a[l], mv)) { m = l; mv = &h->a[l]; }
                      if (r < h->n && sorFirst(h, &h->a[r], mv)) m = r;
                      if (m == i) break;
                      h->a[i] = h->a[m];
                      i = m;
                  }
                  h->a[i] = last;
              }
              return top;
          }

          SORTracker* sORTrackerCreate() {
              SORTracker* t = (SORTracker*)calloc(1, sizeof(SORTracker));
              t->best.bestOnTop = 0;
              t->rest.bestOnTop = 1;
              return t;
          }

          void sORTrackerAdd(SORTracker* obj, char* name, int score) {
              SorLoc x;
              size_t len = strlen(name);
              x.score = score;
              x.name = (char*)malloc(len + 1);
              memcpy(x.name, name, len + 1);
              sorPush(&obj->best, x);
              sorPush(&obj->rest, sorPop(&obj->best));
          }

          char* sORTrackerGet(SORTracker* obj) {
              SorLoc x = sorPop(&obj->rest);
              sorPush(&obj->best, x);
              return x.name;
          }

          void sORTrackerFree(SORTracker* obj) {
              for (int i = 0; i < obj->best.n; i++) free(obj->best.a[i].name);
              for (int i = 0; i < obj->rest.n; i++) free(obj->rest.a[i].name);
              free(obj->best.a);
              free(obj->rest.a);
              free(obj);
          }
        `,
        csharp: code`
          public class SORTracker {
              // RANK: better locations first — higher score, then smaller name (ordinal). Names are
              // unique, so a sorted set keyed by (score, name) never merges two locations.
              private class Rank : IComparer<Tuple<int, string>> {
                  public int Compare(Tuple<int, string> a, Tuple<int, string> b) {
                      if (a.Item1 != b.Item1) return b.Item1.CompareTo(a.Item1);
                      return string.CompareOrdinal(a.Item2, b.Item2);
                  }
              }

              private SortedSet<Tuple<int, string>> best = new SortedSet<Tuple<int, string>>(new Rank()); // the i best so far
              private SortedSet<Tuple<int, string>> rest = new SortedSet<Tuple<int, string>>(new Rank()); // everything else

              public SORTracker() {
              }

              public void Add(string name, int score) {
                  best.Add(Tuple.Create(score, name));
                  var worst = best.Max;
                  best.Remove(worst);
                  rest.Add(worst);
              }

              public string Get() {
                  var x = rest.Min;
                  rest.Remove(x);
                  best.Add(x);
                  return x.Item2;
              }
          }
        `,
        go: code`
          type sorLoc struct {
          	name  string
          	score int
          }

          // sorBetter: a ranks above b — higher score, or equal score and smaller name.
          func sorBetter(a, b sorLoc) bool {
          	return a.score > b.score || (a.score == b.score && a.name < b.name)
          }

          // A binary heap whose top is the element for which first(top, x) holds against every x.
          type sorHeap struct {
          	a     []sorLoc
          	first func(x, y sorLoc) bool
          }

          func (h *sorHeap) push(x sorLoc) {
          	h.a = append(h.a, x)
          	i := len(h.a) - 1
          	for i > 0 && h.first(x, h.a[(i-1)/2]) {
          		h.a[i] = h.a[(i-1)/2]
          		i = (i - 1) / 2
          	}
          	h.a[i] = x
          }

          func (h *sorHeap) pop() sorLoc {
          	top := h.a[0]
          	last := h.a[len(h.a)-1]
          	h.a = h.a[:len(h.a)-1]
          	if n := len(h.a); n > 0 {
          		i := 0
          		for {
          			l, r, m, mv := 2*i+1, 2*i+2, i, last
          			if l < n && h.first(h.a[l], mv) {
          				m, mv = l, h.a[l]
          			}
          			if r < n && h.first(h.a[r], mv) {
          				m = r
          			}
          			if m == i {
          				break
          			}
          			h.a[i] = h.a[m]
          			i = m
          		}
          		h.a[i] = last
          	}
          	return top
          }

          type SORTracker struct {
          	best *sorHeap // the i best so far; top = the worst of them
          	rest *sorHeap // everything else; top = the best of them
          }

          func Constructor() SORTracker {
          	return SORTracker{
          		best: &sorHeap{first: func(x, y sorLoc) bool { return sorBetter(y, x) }},
          		rest: &sorHeap{first: sorBetter},
          	}
          }

          func (this *SORTracker) Add(name string, score int) {
          	this.best.push(sorLoc{name, score})
          	this.rest.push(this.best.pop())
          }

          func (this *SORTracker) Get() string {
          	x := this.rest.pop()
          	this.best.push(x)
          	return x.name
          }
        `,
        kotlin: code`
          class SORTracker() {
              private class Loc(val name: String, val score: Int)

              // rank: better locations first — higher score, then smaller name.
              private val rank = Comparator<Loc> { a, b -> if (a.score != b.score) b.score.compareTo(a.score) else a.name.compareTo(b.name) }
              private val best = java.util.PriorityQueue<Loc>(rank.reversed()) // the i best so far; top = the worst of them
              private val rest = java.util.PriorityQueue<Loc>(rank)            // everything else; top = the best of them

              fun add(name: String, score: Int) {
                  best.offer(Loc(name, score))
                  rest.offer(best.poll())
              }

              fun get(): String {
                  val x = rest.poll()
                  best.offer(x)
                  return x.name
              }
          }
        `,
        swift: code`
          struct SorLoc {
              let name: String
              let score: Int
          }

          // sorBetter: a ranks above b — higher score, or equal score and smaller name.
          func sorBetter(_ a: SorLoc, _ b: SorLoc) -> Bool {
              return a.score > b.score || (a.score == b.score && a.name < b.name)
          }

          // A binary heap whose top is the element for which first(top, x) holds against every x.
          struct SorHeap {
              var a: [SorLoc] = []
              let first: (SorLoc, SorLoc) -> Bool

              init(_ first: @escaping (SorLoc, SorLoc) -> Bool) { self.first = first }

              mutating func push(_ x: SorLoc) {
                  a.append(x)
                  var i = a.count - 1
                  while i > 0 && first(x, a[(i - 1) / 2]) {
                      a[i] = a[(i - 1) / 2]
                      i = (i - 1) / 2
                  }
                  a[i] = x
              }

              mutating func pop() -> SorLoc {
                  let top = a[0]
                  let last = a.removeLast()
                  let n = a.count
                  if n > 0 {
                      var i = 0
                      while true {
                          let l = 2 * i + 1, r = l + 1
                          var m = i, mv = last
                          if l < n && first(a[l], mv) { m = l; mv = a[l] }
                          if r < n && first(a[r], mv) { m = r }
                          if m == i { break }
                          a[i] = a[m]
                          i = m
                      }
                      a[i] = last
                  }
                  return top
              }
          }

          class SORTracker {
              var best = SorHeap({ sorBetter($1, $0) }) // the i best so far; top = the worst of them
              var rest = SorHeap(sorBetter)             // everything else; top = the best of them

              init() {}

              func add(_ name: String, _ score: Int) {
                  best.push(SorLoc(name: name, score: score))
                  rest.push(best.pop())
              }

              func get() -> String {
                  let x = rest.pop()
                  best.push(x)
                  return x.name
              }
          }
        `,
        rust: code`
          use std::cmp::Reverse;
          use std::collections::BinaryHeap;

          struct SORTracker {
              best: BinaryHeap<(Reverse<i32>, String)>, // the i best so far; top = lowest score, then largest name
              rest: BinaryHeap<(i32, Reverse<String>)>, // everything else; top = highest score, then smallest name
          }

          impl SORTracker {
              fn new() -> Self { SORTracker { best: BinaryHeap::new(), rest: BinaryHeap::new() } }

              fn add(&mut self, name: String, score: i32) {
                  self.best.push((Reverse(score), name));
                  let (Reverse(s), n) = self.best.pop().unwrap();
                  self.rest.push((s, Reverse(n)));
              }

              fn get(&mut self) -> String {
                  let (s, Reverse(n)) = self.rest.pop().unwrap();
                  self.best.push((Reverse(s), n.clone()));
                  n
              }
          }
        `,
        php: code`
          // SplHeap puts on top the element that compare() ranks highest.
          class SorWorstOnTop extends \SplHeap { // top = the worst location
              protected function compare($a, $b) {
                  if ($a[0] !== $b[0]) return $b[0] - $a[0];
                  return strcmp($a[1], $b[1]);
              }
          }

          class SorBestOnTop extends \SplHeap { // top = the best location
              protected function compare($a, $b) {
                  if ($a[0] !== $b[0]) return $a[0] - $b[0];
                  return strcmp($b[1], $a[1]);
              }
          }

          class SORTracker {
              private $best; // the i best so far, as [score, name]
              private $rest; // everything else

              function __construct() {
                  $this->best = new SorWorstOnTop();
                  $this->rest = new SorBestOnTop();
              }

              function add($name, $score) {
                  $this->best->insert([$score, $name]);
                  $this->rest->insert($this->best->extract());
              }

              function get() {
                  $x = $this->rest->extract();
                  $this->best->insert($x);
                  return $x[1];
              }
          }
        `,
        ruby: code`
          # A binary heap whose top is the element for which the block (first) holds against every other.
          class SorHeap
            def initialize(&first)
              @a = []
              @first = first
            end

            def push(x)
              a = @a
              a << x
              i = a.length - 1
              while i > 0 && @first.call(x, a[(i - 1) / 2])
                a[i] = a[(i - 1) / 2]
                i = (i - 1) / 2
              end
              a[i] = x
            end

            def pop
              a = @a
              top = a[0]
              last = a.pop
              n = a.length
              if n > 0
                i = 0
                loop do
                  l = 2 * i + 1
                  r = l + 1
                  m = i
                  mv = last
                  if l < n && @first.call(a[l], mv)
                    m = l
                    mv = a[l]
                  end
                  m = r if r < n && @first.call(a[r], mv)
                  break if m == i
                  a[i] = a[m]
                  i = m
                end
                a[i] = last
              end
              top
            end
          end

          class SORTracker
            # better: x ranks above y — higher score, or equal score and smaller name. Entries are [score, name].
            BETTER = lambda { |x, y| x[0] > y[0] || (x[0] == y[0] && x[1] < y[1]) }

            def initialize
              @best = SorHeap.new { |x, y| BETTER.call(y, x) } # the i best so far; top = the worst of them
              @rest = SorHeap.new { |x, y| BETTER.call(x, y) } # everything else; top = the best of them
            end

            def add(name, score)
              @best.push([score, name])
              @rest.push(@best.pop)
            end

            def get
              x = @rest.pop
              @best.push(x)
              x[1]
            end
          end
        `,
      },
    };
  })(),

];
