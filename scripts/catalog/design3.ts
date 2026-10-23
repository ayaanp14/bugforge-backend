/**
 * Design classes — wave 7, batch 37.
 * Real problems only: LeetCode numbered design problems. Worked examples are
 * phrased for CodeKairo.
 *
 * Every problem here is a class whose methods the judge calls in sequence
 * (src/lib/driver-structures.ts): a case is two lines — the operations, then
 * each one's arguments, the constructor's first — answered by one array with
 * `null` for the constructor and every void method. Each `run` below is the
 * reference: a plain, obviously-correct simulation (often a brute force over
 * the whole history) that produces the expected array.
 *
 * Where LeetCode's statement has a value that does not fit a signed 32-bit
 * int (Simple Bank System's balances are `long`), the constraints are reduced
 * so that every value provably does, and the statement says so. LeetCode's
 * parameter name `val` is never used — it is a keyword in Kotlin — so those
 * parameters are called `value`.
 *
 * Per-language notes. The judge's languages without an ordered map or a
 * priority queue (JavaScript, TypeScript, C, Go, Swift, Ruby; C has no hash
 * map either) keep sorted arrays with a hand-written binary search, a small
 * binary heap, or — in C, where sizes allow — a linear search over a small
 * table of names. JavaScript is Node 12 (no ??, ?., at(), flat); TypeScript
 * compiles as TS 3.7 to ES5, so it sticks to plain objects and arrays; Rust is
 * 1.40 (no partition_point, no matches!); Kotlin 1.3 uses java.util
 * collections; PHP runs inside a namespace, so SPL classes are written
 * `\SplMinHeap`. The C harness has no math.h or limits.h.
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

export const DESIGN3_PROBLEMS: CatalogProblem[] = [

  // ── RLE Iterator (LC 900) ─────────────────────────────────────────
  (() => {
    const run: Run = (ops, args) => {
      let enc: number[] = [];
      let i = 0;
      return ops.map((op, k) => {
        if (op === "RLEIterator") { enc = (args[k][0] as number[]).slice(); i = 0; return null; }
        let n = args[k][0] as number;
        while (i < enc.length && n > enc[i]) { n -= enc[i]; i += 2; }
        if (i >= enc.length) return -1;
        enc[i] -= n;
        return enc[i + 1];
      });
    };
    const make = (rng: Rng) => {
      const pairs = ri(rng, 1, pick(rng, [1, 3, 6, 10]));
      const enc: number[] = [];
      for (let p = 0; p < pairs; p++) {
        enc.push(rng() < 0.08 ? ri(rng, 100000000, 1000000000) : ri(rng, 0, pick(rng, [1, 3, 6])));
        enc.push(rng() < 0.1 ? ri(rng, 0, 1000000000) : ri(rng, 0, 9));
      }
      const ops = ["RLEIterator"], args: Args = [[enc]];
      for (let m = ri(rng, 1, pick(rng, [2, 6, 15, 30])); m > 0; m--) {
        ops.push("next");
        args.push([rng() < 0.05 ? ri(rng, 1, 1000000000) : ri(rng, 1, pick(rng, [1, 3, 8]))]);
      }
      return { ops, args };
    };
    return {
      slug: "rle-iterator",
      title: "RLE Iterator",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Counting", "Design", "Google"],
      signature: {
        funcName: "RLEIterator", params: [{ name: "encoding", type: "int[]" as const }], returns: "void" as const,
        methods: [{ name: "next", params: [{ name: "n", type: "int" as const }], returns: "int" as const }],
      },
      description: describe(
        "A sequence of integers can be stored compactly with **run-length encoding**: an even-length array `encoding` where, for every even index `i`, the value `encoding[i + 1]` appears `encoding[i]` times in a row. For example `[3,8,0,9,2,5]` stands for `[8,8,8,5,5]` — three 8s, no 9s, two 5s. A run with a count of `0` contributes nothing.\n\nWrite the class `RLEIterator` that walks such a sequence without expanding it:\n\n- `RLEIterator(int[] encoding)` starts at the beginning of the sequence that `encoding` describes.\n- `int next(int n)` consumes the next `n` elements and returns the **last** one consumed. If fewer than `n` elements are left, it consumes all of them and returns `-1`.\n\n" + CALLS,
        [
          exampleOf(run, ["RLEIterator", "next", "next", "next", "next"], [[[2, 4, 0, 7, 3, 1]], [1], [2], [2], [1]],
            "The sequence is [4,4,1,1,1]. next(1) consumes one 4 and returns 4. next(2) consumes the other 4 and a 1, returning 1. Only one 1 is left, so next(2) consumes it and returns -1; after that nothing remains and next(1) is -1 too."),
          exampleOf(run, ["RLEIterator", "next", "next", "next"], [[[0, 9, 1000000000, 5]], [999999999], [1], [1]],
            "The run of 9s is empty. The sequence is a billion 5s: the first call consumes all but one and returns 5, the second consumes the last 5, and the third finds nothing left."),
        ],
        ["2 <= encoding.length <= 1000", "encoding.length is even", "0 <= encoding[i] <= 10^9", "1 <= n <= 10^9", "At most 1000 calls are made to next"]),
      hints: [
        "The counts can be a billion, so the sequence can never be written out. Work with the runs themselves.",
        "Keep a pointer to the current run and treat its count as \"how many of this value are still unread\".",
        "For `next(n)`: while `n` is larger than the current run's remaining count, subtract that count from `n` and move to the next run. If you run out of runs, return -1; otherwise take `n` from the current run and return its value.",
      ],
      editorial: explain({
        idea: "Never expand the encoding. Keep a pointer `i` to the current run and let `encoding[i]` mean \"elements of this run not yet consumed\"; a call to `next` eats whole runs until the remainder fits inside one.",
        steps: [
          "Copy the encoding and set `i = 0`.",
          "`next(n)`: while `i` is inside the array and `n > encoding[i]`, do `n -= encoding[i]` and `i += 2` — that run is used up entirely (empty runs pass through here too).",
          "If `i` ran past the end, fewer than `n` elements were left: return -1 (they are all consumed now, so every later call returns -1 as well).",
          "Otherwise `n <= encoding[i]`: subtract `n` from the run and return its value `encoding[i + 1]`.",
        ],
        why: "The loop consumes exactly the elements before the one that ends this call: a run is skipped only when all of it is needed, and the call stops in the first run that still holds at least `n` elements, whose value is therefore the last element consumed. Leaving the remainder in `encoding[i]` makes the next call start exactly where this one stopped.",
        time: "O(r + q) over the whole session for r runs and q calls — the pointer only moves forward",
        space: "O(r) for the copy",
        pitfalls: [
          "Expanding the runs into a list runs out of memory: a single count can be 10^9.",
          "The comparison is `n > count`, not `>=`: when `n` equals the remaining count, the call ends inside this run and returns its value.",
          "After a call returns -1 the iterator is exhausted; the pointer is already past the end, so nothing extra is needed.",
        ],
      }),
      examples: [
        caseOf(run, ["RLEIterator", "next", "next", "next", "next"], [[[2, 4, 0, 7, 3, 1]], [1], [2], [2], [1]]),
        caseOf(run, ["RLEIterator", "next", "next", "next"], [[[0, 9, 1000000000, 5]], [999999999], [1], [1]]),
      ],
      gen: (rng: Rng) => { const { ops, args } = make(rng); return caseOf(run, ops, args); },
      solutions: {
        python: code`
          class RLEIterator:

              def __init__(self, encoding: List[int]):
                  self.enc = list(encoding)
                  self.i = 0

              def next(self, n: int) -> int:
                  enc = self.enc
                  while self.i < len(enc) and n > enc[self.i]:
                      n -= enc[self.i]  # this whole run is consumed
                      self.i += 2
                  if self.i >= len(enc):
                      return -1
                  enc[self.i] -= n
                  return enc[self.i + 1]
        `,
        javascript: code`
          var RLEIterator = function(encoding) {
              this.enc = encoding.slice();
              this.i = 0;
          };

          RLEIterator.prototype.next = function(n) {
              var enc = this.enc;
              while (this.i < enc.length && n > enc[this.i]) {
                  n -= enc[this.i]; // this whole run is consumed
                  this.i += 2;
              }
              if (this.i >= enc.length) return -1;
              enc[this.i] -= n;
              return enc[this.i + 1];
          };
        `,
        typescript: code`
          class RLEIterator {
              enc: number[];
              i: number;

              constructor(encoding: number[]) {
                  this.enc = encoding.slice();
                  this.i = 0;
              }

              next(n: number): number {
                  var enc = this.enc;
                  while (this.i < enc.length && n > enc[this.i]) {
                      n -= enc[this.i]; // this whole run is consumed
                      this.i += 2;
                  }
                  if (this.i >= enc.length) return -1;
                  enc[this.i] -= n;
                  return enc[this.i + 1];
              }
          }
        `,
        java: code`
          class RLEIterator {
              private int[] enc;
              private int i = 0;

              public RLEIterator(int[] encoding) {
                  enc = encoding.clone();
              }

              public int next(int n) {
                  while (i < enc.length && n > enc[i]) {
                      n -= enc[i]; // this whole run is consumed
                      i += 2;
                  }
                  if (i >= enc.length) return -1;
                  enc[i] -= n;
                  return enc[i + 1];
              }
          }
        `,
        cpp: code`
          class RLEIterator {
              vector<int> enc;
              size_t i = 0;
          public:
              RLEIterator(vector<int>& encoding) : enc(encoding) {}

              int next(int n) {
                  while (i < enc.size() && n > enc[i]) {
                      n -= enc[i]; // this whole run is consumed
                      i += 2;
                  }
                  if (i >= enc.size()) return -1;
                  enc[i] -= n;
                  return enc[i + 1];
              }
          };
        `,
        c: code`
          typedef struct {
              int* enc;
              int size, i;
          } RLEIterator;

          RLEIterator* rLEIteratorCreate(int* encoding, int encodingSize) {
              RLEIterator* o = (RLEIterator*)malloc(sizeof(RLEIterator));
              o->enc = (int*)malloc((encodingSize + 1) * sizeof(int));
              memcpy(o->enc, encoding, encodingSize * sizeof(int));
              o->size = encodingSize;
              o->i = 0;
              return o;
          }

          int rLEIteratorNext(RLEIterator* obj, int n) {
              while (obj->i < obj->size && n > obj->enc[obj->i]) {
                  n -= obj->enc[obj->i]; /* this whole run is consumed */
                  obj->i += 2;
              }
              if (obj->i >= obj->size) return -1;
              obj->enc[obj->i] -= n;
              return obj->enc[obj->i + 1];
          }

          void rLEIteratorFree(RLEIterator* obj) {
              free(obj->enc);
              free(obj);
          }
        `,
        csharp: code`
          public class RLEIterator {
              private int[] enc;
              private int i = 0;

              public RLEIterator(int[] encoding) {
                  enc = (int[])encoding.Clone();
              }

              public int Next(int n) {
                  while (i < enc.Length && n > enc[i]) {
                      n -= enc[i]; // this whole run is consumed
                      i += 2;
                  }
                  if (i >= enc.Length) return -1;
                  enc[i] -= n;
                  return enc[i + 1];
              }
          }
        `,
        go: code`
          type RLEIterator struct {
          	enc []int
          	i   int
          }

          func Constructor(encoding []int) RLEIterator {
          	e := make([]int, len(encoding))
          	copy(e, encoding)
          	return RLEIterator{enc: e}
          }

          func (this *RLEIterator) Next(n int) int {
          	for this.i < len(this.enc) && n > this.enc[this.i] {
          		n -= this.enc[this.i] // this whole run is consumed
          		this.i += 2
          	}
          	if this.i >= len(this.enc) {
          		return -1
          	}
          	this.enc[this.i] -= n
          	return this.enc[this.i+1]
          }
        `,
        kotlin: code`
          class RLEIterator(encoding: IntArray) {
              private val enc = encoding.copyOf()
              private var i = 0

              fun next(n: Int): Int {
                  var m = n
                  while (i < enc.size && m > enc[i]) {
                      m -= enc[i] // this whole run is consumed
                      i += 2
                  }
                  if (i >= enc.size) return -1
                  enc[i] -= m
                  return enc[i + 1]
              }
          }
        `,
        swift: code`
          class RLEIterator {
              var enc: [Int]
              var i = 0

              init(_ encoding: [Int]) {
                  enc = encoding
              }

              func next(_ n: Int) -> Int {
                  var m = n
                  while i < enc.count && m > enc[i] {
                      m -= enc[i] // this whole run is consumed
                      i += 2
                  }
                  if i >= enc.count { return -1 }
                  enc[i] -= m
                  return enc[i + 1]
              }
          }
        `,
        rust: code`
          struct RLEIterator {
              enc: Vec<i32>,
              i: usize,
          }

          impl RLEIterator {
              fn new(encoding: Vec<i32>) -> Self {
                  RLEIterator { enc: encoding, i: 0 }
              }

              fn next(&mut self, n: i32) -> i32 {
                  let mut m = n;
                  while self.i < self.enc.len() && m > self.enc[self.i] {
                      m -= self.enc[self.i]; // this whole run is consumed
                      self.i += 2;
                  }
                  if self.i >= self.enc.len() {
                      return -1;
                  }
                  self.enc[self.i] -= m;
                  self.enc[self.i + 1]
              }
          }
        `,
        php: code`
          class RLEIterator {
              private $enc;
              private $i = 0;

              function __construct($encoding) {
                  $this->enc = $encoding;
              }

              function next($n) {
                  $size = count($this->enc);
                  while ($this->i < $size && $n > $this->enc[$this->i]) {
                      $n -= $this->enc[$this->i]; // this whole run is consumed
                      $this->i += 2;
                  }
                  if ($this->i >= $size) return -1;
                  $this->enc[$this->i] -= $n;
                  return $this->enc[$this->i + 1];
              }
          }
        `,
        ruby: code`
          class RLEIterator
            def initialize(encoding)
              @enc = encoding.dup
              @i = 0
            end

            def next(n)
              while @i < @enc.length && n > @enc[@i]
                n -= @enc[@i] # this whole run is consumed
                @i += 2
              end
              return -1 if @i >= @enc.length
              @enc[@i] -= n
              @enc[@i + 1]
            end
          end
        `,
      },
    };
  })(),

  // ── Online Election (LC 911) ──────────────────────────────────────
  (() => {
    const run: Run = (ops, args) => {
      let persons: number[] = [], times: number[] = [];
      return ops.map((op, k) => {
        if (op === "TopVotedCandidate") { persons = args[k][0]; times = args[k][1]; return null; }
        const t = args[k][0] as number;
        // Brute force: recount every vote cast at or before t.
        const cnt = new Map<number, number>();
        let leader = -1;
        for (let v = 0; v < times.length && times[v] <= t; v++) {
          const p = persons[v];
          cnt.set(p, (cnt.get(p) || 0) + 1);
          if (leader === -1 || (cnt.get(p) as number) >= (cnt.get(leader) as number)) leader = p;
        }
        return leader;
      });
    };
    const make = (rng: Rng) => {
      const n = ri(rng, 1, pick(rng, [1, 4, 12, 30]));
      const kinds = Math.min(n, ri(rng, 1, pick(rng, [2, 3, 5, 30])));
      const persons = Array.from({ length: n }, () => ri(rng, 0, kinds - 1));
      const times: number[] = [];
      let t = rng() < 0.3 ? 0 : ri(rng, 0, 20);
      for (let v = 0; v < n; v++) { times.push(t); t += rng() < 0.05 ? ri(rng, 1, 50000000) : ri(rng, 1, 5); }
      if (times[n - 1] > 1000000000) for (let v = 0; v < n; v++) times[v] = v * 3; // keep times within 10^9
      const ops = ["TopVotedCandidate"], args: Args = [[persons, times]];
      const last = times[n - 1];
      for (let m = ri(rng, 1, pick(rng, [2, 8, 20, 35])); m > 0; m--) {
        ops.push("q");
        const r = rng();
        args.push([r < 0.3 ? pick(rng, times) : r < 0.4 ? Math.min(1000000000, last + ri(rng, 0, 1000)) : Math.min(1000000000, ri(rng, times[0], last + 3))]);
      }
      return { ops, args };
    };
    const ex1: [string[], Args] = [["TopVotedCandidate", "q", "q", "q", "q", "q"], [[[0, 1, 1, 0, 0, 1], [0, 4, 9, 15, 22, 30]], [3], [9], [16], [25], [30]]];
    const ex2: [string[], Args] = [["TopVotedCandidate", "q", "q"], [[[1, 0], [7, 8]], [7], [1000000000]]];
    return {
      slug: "online-election",
      title: "Online Election",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Binary Search", "Design", "Google"],
      signature: {
        funcName: "TopVotedCandidate",
        params: [{ name: "persons", type: "int[]" as const }, { name: "times", type: "int[]" as const }],
        returns: "void" as const,
        methods: [{ name: "q", params: [{ name: "t", type: "int" as const }], returns: "int" as const }],
      },
      description: describe(
        "An election records its votes as they arrive: the `i`-th vote went to candidate `persons[i]` at time `times[i]`, and the times are strictly increasing.\n\nWrite the class `TopVotedCandidate`:\n\n- `TopVotedCandidate(int[] persons, int[] times)` stores the votes.\n- `int q(int t)` returns the candidate who was **leading at time `t`** — the one with the most votes among the votes cast at or before `t`. A vote cast exactly at `t` counts. If several candidates are tied for the most votes, the one among them who received a vote **most recently** leads.\n\n" + CALLS,
        [
          exampleOf(run, ex1[0], ex1[1], "By time 3 only candidate 0 has a vote. At time 9 the counts are 0:1, 1:2, so 1 leads. At 16 they are 2:2 and candidate 0 voted last, so 0 leads; at 25 candidate 0 has 3. At 30 it is 3:3 again and the latest vote went to 1."),
          exampleOf(run, ex2[0], ex2[1], "Candidate 1 leads at time 7. At time 8 candidate 0 draws level and, having received the latest vote, leads from then on."),
        ],
        ["1 <= persons.length <= 5000", "times.length == persons.length", "0 <= persons[i] < persons.length", "0 <= times[i] <= 10^9", "times is strictly increasing", "times[0] <= t <= 10^9", "At most 10^4 calls are made to q"]),
      hints: [
        "The leader only changes when a vote arrives, so there are at most n different answers — one per vote.",
        "Walk the votes once in time order, keeping a count per candidate and the current leader. After vote `i`, record who leads.",
        "A query at time `t` asks about the last vote cast at or before `t`: find it with a binary search over `times` and return the leader recorded there. Ties go to the newest voter, so update the leader when the new count is `>=` the leader's.",
      ],
      editorial: explain({
        idea: "Precompute the leader after every vote, then answer each query by binary searching for the last vote at or before `t`.",
        steps: [
          "Scan the votes in order with a count per candidate and a current `leader`.",
          "After counting vote `i` for candidate `p`, if `count[p] >= count[leader]` then `leader = p`; store `lead[i] = leader`.",
          "`q(t)`: binary search the largest `i` with `times[i] <= t` (it exists because `t >= times[0]`) and return `lead[i]`.",
        ],
        why: "Between two consecutive votes the counts do not change, so the leader at time `t` is the leader just after the last vote cast at or before `t`. During the scan only the candidate who just received a vote can overtake: with `>=`, a candidate who draws level becomes leader because they are now the most recent voter among the tied ones, which is exactly the tie rule.",
        time: "O(n) to build, O(log n) per query",
        space: "O(n)",
        pitfalls: [
          "Using `>` instead of `>=` keeps the older candidate on a tie — the rule is the opposite.",
          "A vote cast exactly at time `t` counts; search for the last time `<= t`, not `< t`.",
          "Recounting the votes for every query is O(n) a query, 5 × 10^7 steps at the limits.",
        ],
      }),
      examples: [caseOf(run, ex1[0], ex1[1]), caseOf(run, ex2[0], ex2[1])],
      gen: (rng: Rng) => { const { ops, args } = make(rng); return caseOf(run, ops, args); },
      solutions: {
        python: code`
          import bisect

          class TopVotedCandidate:

              def __init__(self, persons: List[int], times: List[int]):
                  self.times = times
                  self.lead = []
                  count = [0] * len(persons)
                  leader = persons[0]
                  for p in persons:
                      count[p] += 1
                      if count[p] >= count[leader]:  # a tie goes to the newest voter
                          leader = p
                      self.lead.append(leader)

              def q(self, t: int) -> int:
                  return self.lead[bisect.bisect_right(self.times, t) - 1]
        `,
        javascript: code`
          var TopVotedCandidate = function(persons, times) {
              this.times = times;
              this.lead = [];
              var count = new Array(persons.length).fill(0);
              var leader = persons[0];
              for (var i = 0; i < persons.length; i++) {
                  var p = persons[i];
                  count[p]++;
                  if (count[p] >= count[leader]) leader = p; // a tie goes to the newest voter
                  this.lead.push(leader);
              }
          };

          TopVotedCandidate.prototype.q = function(t) {
              var lo = 0, hi = this.times.length - 1; // last vote at or before t
              while (lo < hi) {
                  var mid = (lo + hi + 1) >> 1;
                  if (this.times[mid] <= t) lo = mid; else hi = mid - 1;
              }
              return this.lead[lo];
          };
        `,
        typescript: code`
          class TopVotedCandidate {
              times: number[];
              lead: number[];

              constructor(persons: number[], times: number[]) {
                  this.times = times;
                  this.lead = [];
                  var count: number[] = [];
                  for (var i = 0; i < persons.length; i++) count.push(0);
                  var leader = persons[0];
                  for (var i = 0; i < persons.length; i++) {
                      var p = persons[i];
                      count[p]++;
                      if (count[p] >= count[leader]) leader = p; // a tie goes to the newest voter
                      this.lead.push(leader);
                  }
              }

              q(t: number): number {
                  var lo = 0, hi = this.times.length - 1; // last vote at or before t
                  while (lo < hi) {
                      var mid = (lo + hi + 1) >> 1;
                      if (this.times[mid] <= t) lo = mid; else hi = mid - 1;
                  }
                  return this.lead[lo];
              }
          }
        `,
        java: code`
          class TopVotedCandidate {
              private int[] times, lead;

              public TopVotedCandidate(int[] persons, int[] times) {
                  this.times = times;
                  lead = new int[persons.length];
                  int[] count = new int[persons.length];
                  int leader = persons[0];
                  for (int i = 0; i < persons.length; i++) {
                      int p = persons[i];
                      count[p]++;
                      if (count[p] >= count[leader]) leader = p; // a tie goes to the newest voter
                      lead[i] = leader;
                  }
              }

              public int q(int t) {
                  int lo = 0, hi = times.length - 1; // last vote at or before t
                  while (lo < hi) {
                      int mid = (lo + hi + 1) >>> 1;
                      if (times[mid] <= t) lo = mid; else hi = mid - 1;
                  }
                  return lead[lo];
              }
          }
        `,
        cpp: code`
          class TopVotedCandidate {
              vector<int> times, lead;
          public:
              TopVotedCandidate(vector<int>& persons, vector<int>& times) : times(times) {
                  vector<int> count(persons.size(), 0);
                  int leader = persons[0];
                  for (int p : persons) {
                      count[p]++;
                      if (count[p] >= count[leader]) leader = p; // a tie goes to the newest voter
                      lead.push_back(leader);
                  }
              }

              int q(int t) {
                  int i = upper_bound(times.begin(), times.end(), t) - times.begin() - 1;
                  return lead[i];
              }
          };
        `,
        c: code`
          typedef struct {
              int* times;
              int* lead;
              int n;
          } TopVotedCandidate;

          TopVotedCandidate* topVotedCandidateCreate(int* persons, int personsSize, int* times, int timesSize) {
              TopVotedCandidate* o = (TopVotedCandidate*)malloc(sizeof(TopVotedCandidate));
              o->n = personsSize;
              o->times = (int*)malloc(personsSize * sizeof(int));
              o->lead = (int*)malloc(personsSize * sizeof(int));
              memcpy(o->times, times, personsSize * sizeof(int));
              int* count = (int*)calloc(personsSize, sizeof(int));
              int leader = persons[0];
              for (int i = 0; i < personsSize; i++) {
                  int p = persons[i];
                  count[p]++;
                  if (count[p] >= count[leader]) leader = p; /* a tie goes to the newest voter */
                  o->lead[i] = leader;
              }
              free(count);
              return o;
          }

          int topVotedCandidateQ(TopVotedCandidate* obj, int t) {
              int lo = 0, hi = obj->n - 1; /* last vote at or before t */
              while (lo < hi) {
                  int mid = (lo + hi + 1) / 2;
                  if (obj->times[mid] <= t) lo = mid; else hi = mid - 1;
              }
              return obj->lead[lo];
          }

          void topVotedCandidateFree(TopVotedCandidate* obj) {
              free(obj->times);
              free(obj->lead);
              free(obj);
          }
        `,
        csharp: code`
          public class TopVotedCandidate {
              private int[] times, lead;

              public TopVotedCandidate(int[] persons, int[] times) {
                  this.times = times;
                  lead = new int[persons.Length];
                  int[] count = new int[persons.Length];
                  int leader = persons[0];
                  for (int i = 0; i < persons.Length; i++) {
                      int p = persons[i];
                      count[p]++;
                      if (count[p] >= count[leader]) leader = p; // a tie goes to the newest voter
                      lead[i] = leader;
                  }
              }

              public int Q(int t) {
                  int lo = 0, hi = times.Length - 1; // last vote at or before t
                  while (lo < hi) {
                      int mid = (lo + hi + 1) / 2;
                      if (times[mid] <= t) lo = mid; else hi = mid - 1;
                  }
                  return lead[lo];
              }
          }
        `,
        go: code`
          type TopVotedCandidate struct {
          	times []int
          	lead  []int
          }

          func Constructor(persons []int, times []int) TopVotedCandidate {
          	count := make([]int, len(persons))
          	lead := make([]int, len(persons))
          	leader := persons[0]
          	for i, p := range persons {
          		count[p]++
          		if count[p] >= count[leader] { // a tie goes to the newest voter
          			leader = p
          		}
          		lead[i] = leader
          	}
          	return TopVotedCandidate{times: times, lead: lead}
          }

          func (this *TopVotedCandidate) Q(t int) int {
          	i := sort.SearchInts(this.times, t+1) - 1 // last vote at or before t
          	return this.lead[i]
          }
        `,
        kotlin: code`
          class TopVotedCandidate(persons: IntArray, times: IntArray) {
              private val times = times
              private val lead = IntArray(persons.size)

              init {
                  val count = IntArray(persons.size)
                  var leader = persons[0]
                  for (i in persons.indices) {
                      val p = persons[i]
                      count[p]++
                      if (count[p] >= count[leader]) leader = p // a tie goes to the newest voter
                      lead[i] = leader
                  }
              }

              fun q(t: Int): Int {
                  var lo = 0
                  var hi = times.size - 1 // last vote at or before t
                  while (lo < hi) {
                      val mid = (lo + hi + 1) / 2
                      if (times[mid] <= t) lo = mid else hi = mid - 1
                  }
                  return lead[lo]
              }
          }
        `,
        swift: code`
          class TopVotedCandidate {
              var times: [Int]
              var lead: [Int] = []

              init(_ persons: [Int], _ times: [Int]) {
                  self.times = times
                  var count = [Int](repeating: 0, count: persons.count)
                  var leader = persons[0]
                  for p in persons {
                      count[p] += 1
                      if count[p] >= count[leader] { leader = p } // a tie goes to the newest voter
                      lead.append(leader)
                  }
              }

              func q(_ t: Int) -> Int {
                  var lo = 0, hi = times.count - 1 // last vote at or before t
                  while lo < hi {
                      let mid = (lo + hi + 1) / 2
                      if times[mid] <= t { lo = mid } else { hi = mid - 1 }
                  }
                  return lead[lo]
              }
          }
        `,
        rust: code`
          struct TopVotedCandidate {
              times: Vec<i32>,
              lead: Vec<i32>,
          }

          impl TopVotedCandidate {
              fn new(persons: Vec<i32>, times: Vec<i32>) -> Self {
                  let mut count = vec![0; persons.len()];
                  let mut lead = Vec::with_capacity(persons.len());
                  let mut leader = persons[0] as usize;
                  for &p in persons.iter() {
                      let p = p as usize;
                      count[p] += 1;
                      if count[p] >= count[leader] { leader = p; } // a tie goes to the newest voter
                      lead.push(leader as i32);
                  }
                  TopVotedCandidate { times, lead }
              }

              fn q(&mut self, t: i32) -> i32 {
                  let (mut lo, mut hi) = (0usize, self.times.len() - 1); // last vote at or before t
                  while lo < hi {
                      let mid = (lo + hi + 1) / 2;
                      if self.times[mid] <= t { lo = mid; } else { hi = mid - 1; }
                  }
                  self.lead[lo]
              }
          }
        `,
        php: code`
          class TopVotedCandidate {
              private $times;
              private $lead = [];

              function __construct($persons, $times) {
                  $this->times = $times;
                  $count = array_fill(0, count($persons), 0);
                  $leader = $persons[0];
                  foreach ($persons as $p) {
                      $count[$p]++;
                      if ($count[$p] >= $count[$leader]) $leader = $p; // a tie goes to the newest voter
                      $this->lead[] = $leader;
                  }
              }

              function q($t) {
                  $lo = 0; $hi = count($this->times) - 1; // last vote at or before t
                  while ($lo < $hi) {
                      $mid = intdiv($lo + $hi + 1, 2);
                      if ($this->times[$mid] <= $t) $lo = $mid; else $hi = $mid - 1;
                  }
                  return $this->lead[$lo];
              }
          }
        `,
        ruby: code`
          class TopVotedCandidate
            def initialize(persons, times)
              @times = times
              @lead = []
              count = Array.new(persons.length, 0)
              leader = persons[0]
              persons.each do |p|
                count[p] += 1
                leader = p if count[p] >= count[leader] # a tie goes to the newest voter
                @lead << leader
              end
            end

            def q(t)
              i = (@times.bsearch_index { |x| x > t } || @times.length) - 1 # last vote at or before t
              @lead[i]
            end
          end
        `,
      },
    };
  })(),

  // ── Time Based Key-Value Store (LC 981) ───────────────────────────
  (() => {
    const run: Run = (ops, args) => {
      const sets: Array<[string, string, number]> = [];
      return ops.map((op, k) => {
        if (op === "TimeMap") return null;
        if (op === "set") { sets.push([args[k][0], args[k][1], args[k][2]]); return null; }
        // Brute force: the latest set of this key at or before the timestamp.
        let best = "", bt = -1;
        for (const [key, v, ts] of sets) if (key === args[k][0] && ts <= args[k][1] && ts > bt) { best = v; bt = ts; }
        return best;
      });
    };
    const make = (rng: Rng) => {
      const keys = Array.from({ length: ri(rng, 1, 4) }, () => randLower(rng, 1, 4, "abcfo19"));
      const ops = ["TimeMap"], args: Args = [[]];
      let ts = rng() < 0.2 ? 1 : ri(rng, 1, 30);
      let any = false;
      for (let m = ri(rng, 1, pick(rng, [3, 10, 25, 40])); m > 0; m--) {
        if (!any || rng() < 0.45) {
          ops.push("set");
          args.push([pick(rng, keys), randLower(rng, 1, 5, "abcdexyz0123456789"), ts]);
          ts += rng() < 0.05 ? ri(rng, 1, 100000) : ri(rng, 1, 4);
          any = true;
        } else {
          ops.push("get");
          const key = rng() < 0.1 ? randLower(rng, 1, 4, "abcfo19") : pick(rng, keys);
          args.push([key, rng() < 0.05 ? 10000000 : ri(rng, 1, ts + 2)]);
        }
      }
      return { ops, args };
    };
    const ex1: [string[], Args] = [["TimeMap", "set", "get", "get", "set", "get", "get"], [[], ["fruit", "apple", 1], ["fruit", 1], ["fruit", 3], ["fruit", "mango", 4], ["fruit", 4], ["fruit", 5]]];
    const ex2: [string[], Args] = [["TimeMap", "set", "set", "get", "get", "get"], [[], ["k1", "low", 10], ["k2", "high", 20], ["k1", 9], ["k2", 25], ["k3", 30]]];
    return {
      slug: "time-based-key-value-store",
      title: "Time Based Key-Value Store",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "String", "Binary Search", "Design", "Amazon", "Google", "Meta", "Uber"],
      signature: {
        funcName: "TimeMap", params: [], returns: "void" as const,
        methods: [
          { name: "set", params: [{ name: "key", type: "string" as const }, { name: "value", type: "string" as const }, { name: "timestamp", type: "int" as const }], returns: "void" as const },
          { name: "get", params: [{ name: "key", type: "string" as const }, { name: "timestamp", type: "int" as const }], returns: "string" as const },
        ],
      },
      description: describe(
        "Build a key-value store that remembers every value a key has ever held, each stamped with the time it was written, and can answer \"what was this key's value at time t?\".\n\nWrite the class `TimeMap`:\n\n- `TimeMap()` creates an empty store.\n- `void set(String key, String value, int timestamp)` records that `key` holds `value` from time `timestamp` on.\n- `String get(String key, int timestamp)` returns the value of the `set` call for `key` with the **largest timestamp that is `<= timestamp`**. If `key` was never set at or before that time, it returns the empty string `\"\"`.\n\n" + CALLS,
        [
          exampleOf(run, ex1[0], ex1[1], "At times 1 and 3 the latest value of fruit is apple. From time 4 on, mango replaces it."),
          exampleOf(run, ex2[0], ex2[1], "k1 was first set at time 10, so asking at time 9 gives the empty string. k2 at time 25 is high; k3 was never set."),
        ],
        ["1 <= key.length, value.length <= 100", "key and value consist of lowercase English letters and digits", "1 <= timestamp <= 10^7", "The timestamps of all set calls are strictly increasing", "At most 2 * 10^5 calls are made to set and get"]),
      hints: [
        "Group the history by key: each key needs its own list of (timestamp, value) pairs.",
        "Because the `set` timestamps only ever increase, appending to a key's list keeps it sorted by time — no sorting needed.",
        "`get` wants the last entry with time `<= timestamp`: binary search the key's list for the first time greater than `timestamp` and step back one. If that falls before the start, answer `\"\"`.",
      ],
      editorial: explain({
        idea: "A hash map from key to that key's history. The histories are appended in time order, so each one is already sorted and a binary search finds the value in force at any time.",
        steps: [
          "`set(key, value, timestamp)`: append `(timestamp, value)` to `history[key]`.",
          "`get(key, timestamp)`: if `key` has no history, return `\"\"`.",
          "Binary search the history for the first entry whose time is greater than `timestamp`; the entry just before it is the latest one at or before `timestamp`.",
          "Return that entry's value, or `\"\"` if there is none (every write came later).",
        ],
        why: "The problem guarantees strictly increasing `set` timestamps, so every history list is sorted by time by construction. In a sorted list the entries `<= timestamp` form a prefix; its last element is the most recent write that had happened by then, which is exactly the value the key held.",
        time: "O(1) per set, O(log m) per get for a key with m writes",
        space: "O(total number of set calls)",
        pitfalls: [
          "Searching for the first time `>= timestamp` and stepping back one skips a write made exactly at `timestamp`, which must be returned.",
          "A key that exists but whose first write is after `timestamp` must give `\"\"`, not its first value.",
          "Scanning the whole list on every `get` is O(m) and too slow at 2 × 10^5 calls.",
        ],
      }),
      examples: [caseOf(run, ex1[0], ex1[1]), caseOf(run, ex2[0], ex2[1])],
      gen: (rng: Rng) => { const { ops, args } = make(rng); return caseOf(run, ops, args); },
      solutions: {
        python: code`
          import bisect

          class TimeMap:

              def __init__(self):
                  self.times = {}
                  self.values = {}

              def set(self, key: str, value: str, timestamp: int) -> None:
                  # set timestamps only increase, so each list stays sorted
                  self.times.setdefault(key, []).append(timestamp)
                  self.values.setdefault(key, []).append(value)

              def get(self, key: str, timestamp: int) -> str:
                  ts = self.times.get(key)
                  if not ts:
                      return ""
                  i = bisect.bisect_right(ts, timestamp) - 1
                  return self.values[key][i] if i >= 0 else ""
        `,
        javascript: code`
          var TimeMap = function() {
              this.h = new Map(); // key -> { ts: [], vs: [] }, sorted by time
          };

          TimeMap.prototype.set = function(key, value, timestamp) {
              var e = this.h.get(key);
              if (!e) { e = { ts: [], vs: [] }; this.h.set(key, e); }
              e.ts.push(timestamp);
              e.vs.push(value);
          };

          TimeMap.prototype.get = function(key, timestamp) {
              var e = this.h.get(key);
              if (!e) return "";
              var lo = 0, hi = e.ts.length; // first time > timestamp
              while (lo < hi) {
                  var mid = (lo + hi) >> 1;
                  if (e.ts[mid] <= timestamp) lo = mid + 1; else hi = mid;
              }
              return lo > 0 ? e.vs[lo - 1] : "";
          };
        `,
        typescript: code`
          class TimeMap {
              ts: { [key: string]: number[] };
              vs: { [key: string]: string[] };

              constructor() {
                  this.ts = Object.create(null);
                  this.vs = Object.create(null);
              }

              set(key: string, value: string, timestamp: number): void {
                  if (!this.ts[key]) { this.ts[key] = []; this.vs[key] = []; }
                  this.ts[key].push(timestamp); // set timestamps only increase
                  this.vs[key].push(value);
              }

              get(key: string, timestamp: number): string {
                  var t = this.ts[key];
                  if (!t) return "";
                  var lo = 0, hi = t.length; // first time > timestamp
                  while (lo < hi) {
                      var mid = (lo + hi) >> 1;
                      if (t[mid] <= timestamp) lo = mid + 1; else hi = mid;
                  }
                  return lo > 0 ? this.vs[key][lo - 1] : "";
              }
          }
        `,
        java: code`
          class TimeMap {
              private HashMap<String, TreeMap<Integer, String>> h = new HashMap<>();

              public TimeMap() {
              }

              public void set(String key, String value, int timestamp) {
                  h.computeIfAbsent(key, k -> new TreeMap<>()).put(timestamp, value);
              }

              public String get(String key, int timestamp) {
                  TreeMap<Integer, String> t = h.get(key);
                  if (t == null) return "";
                  Map.Entry<Integer, String> e = t.floorEntry(timestamp); // latest write at or before timestamp
                  return e == null ? "" : e.getValue();
              }
          }
        `,
        cpp: code`
          class TimeMap {
              unordered_map<string, vector<pair<int, string>>> h;
          public:
              TimeMap() {}

              void set(string key, string value, int timestamp) {
                  h[key].push_back({timestamp, value}); // set timestamps only increase
              }

              string get(string key, int timestamp) {
                  auto it = h.find(key);
                  if (it == h.end()) return "";
                  auto& v = it->second;
                  auto p = upper_bound(v.begin(), v.end(), timestamp,
                      [](int t, const pair<int, string>& e) { return t < e.first; });
                  return p == v.begin() ? "" : prev(p)->second;
              }
          };
        `,
        c: code`
          /* No hash map in C: keys live in a small table searched linearly; each
             key's history is a pair of arrays sorted by time. */
          typedef struct {
              char* key;
              int n, cap;
              int* ts;
              char** vals;
          } TmKey;

          typedef struct {
              TmKey* keys;
              int n, cap;
          } TimeMap;

          static char* tmDup(const char* s) {
              size_t len = strlen(s);
              char* d = (char*)malloc(len + 1);
              memcpy(d, s, len + 1);
              return d;
          }

          TimeMap* timeMapCreate() {
              TimeMap* o = (TimeMap*)malloc(sizeof(TimeMap));
              o->n = 0;
              o->cap = 8;
              o->keys = (TmKey*)malloc(8 * sizeof(TmKey));
              return o;
          }

          static TmKey* tmFind(TimeMap* o, const char* key) {
              for (int i = 0; i < o->n; i++) if (strcmp(o->keys[i].key, key) == 0) return &o->keys[i];
              return NULL;
          }

          void timeMapSet(TimeMap* obj, char* key, char* value, int timestamp) {
              TmKey* k = tmFind(obj, key);
              if (!k) {
                  if (obj->n == obj->cap) { obj->cap *= 2; obj->keys = (TmKey*)realloc(obj->keys, obj->cap * sizeof(TmKey)); }
                  k = &obj->keys[obj->n++];
                  k->key = tmDup(key);
                  k->n = 0;
                  k->cap = 4;
                  k->ts = (int*)malloc(4 * sizeof(int));
                  k->vals = (char**)malloc(4 * sizeof(char*));
              }
              if (k->n == k->cap) {
                  k->cap *= 2;
                  k->ts = (int*)realloc(k->ts, k->cap * sizeof(int));
                  k->vals = (char**)realloc(k->vals, k->cap * sizeof(char*));
              }
              k->ts[k->n] = timestamp; /* set timestamps only increase */
              k->vals[k->n++] = tmDup(value);
          }

          char* timeMapGet(TimeMap* obj, char* key, int timestamp) {
              TmKey* k = tmFind(obj, key);
              if (!k) return "";
              int lo = 0, hi = k->n; /* first time > timestamp */
              while (lo < hi) {
                  int mid = (lo + hi) / 2;
                  if (k->ts[mid] <= timestamp) lo = mid + 1; else hi = mid;
              }
              return lo > 0 ? k->vals[lo - 1] : "";
          }

          void timeMapFree(TimeMap* obj) {
              for (int i = 0; i < obj->n; i++) {
                  TmKey* k = &obj->keys[i];
                  for (int j = 0; j < k->n; j++) free(k->vals[j]);
                  free(k->vals); free(k->ts); free(k->key);
              }
              free(obj->keys);
              free(obj);
          }
        `,
        csharp: code`
          public class TimeMap {
              private Dictionary<string, List<int>> ts = new Dictionary<string, List<int>>();
              private Dictionary<string, List<string>> vs = new Dictionary<string, List<string>>();

              public TimeMap() {
              }

              public void Set(string key, string value, int timestamp) {
                  if (!ts.ContainsKey(key)) { ts[key] = new List<int>(); vs[key] = new List<string>(); }
                  ts[key].Add(timestamp); // set timestamps only increase
                  vs[key].Add(value);
              }

              public string Get(string key, int timestamp) {
                  List<int> t;
                  if (!ts.TryGetValue(key, out t)) return "";
                  int lo = 0, hi = t.Count; // first time > timestamp
                  while (lo < hi) {
                      int mid = (lo + hi) / 2;
                      if (t[mid] <= timestamp) lo = mid + 1; else hi = mid;
                  }
                  return lo > 0 ? vs[key][lo - 1] : "";
              }
          }
        `,
        go: code`
          type tmEntry struct {
          	ts int
          	v  string
          }

          type TimeMap struct {
          	h map[string][]tmEntry
          }

          func Constructor() TimeMap {
          	return TimeMap{h: map[string][]tmEntry{}}
          }

          func (this *TimeMap) Set(key string, value string, timestamp int) {
          	this.h[key] = append(this.h[key], tmEntry{timestamp, value}) // set timestamps only increase
          }

          func (this *TimeMap) Get(key string, timestamp int) string {
          	list := this.h[key]
          	i := sort.Search(len(list), func(j int) bool { return list[j].ts > timestamp })
          	if i == 0 {
          		return ""
          	}
          	return list[i-1].v
          }
        `,
        kotlin: code`
          class TimeMap() {
              private val h = HashMap<String, java.util.TreeMap<Int, String>>()

              fun set(key: String, value: String, timestamp: Int) {
                  h.getOrPut(key) { java.util.TreeMap<Int, String>() }[timestamp] = value
              }

              fun get(key: String, timestamp: Int): String {
                  val t = h[key] ?: return ""
                  return t.floorEntry(timestamp)?.value ?: "" // latest write at or before timestamp
              }
          }
        `,
        swift: code`
          class TimeMap {
              var h: [String: [(Int, String)]] = [:]

              init() {}

              func set(_ key: String, _ value: String, _ timestamp: Int) {
                  h[key, default: []].append((timestamp, value)) // set timestamps only increase
              }

              func get(_ key: String, _ timestamp: Int) -> String {
                  guard let list = h[key] else { return "" }
                  var lo = 0, hi = list.count // first time > timestamp
                  while lo < hi {
                      let mid = (lo + hi) / 2
                      if list[mid].0 <= timestamp { lo = mid + 1 } else { hi = mid }
                  }
                  return lo > 0 ? list[lo - 1].1 : ""
              }
          }
        `,
        rust: code`
          use std::collections::HashMap;

          struct TimeMap {
              h: HashMap<String, Vec<(i32, String)>>,
          }

          impl TimeMap {
              fn new() -> Self {
                  TimeMap { h: HashMap::new() }
              }

              fn set(&mut self, key: String, value: String, timestamp: i32) {
                  self.h.entry(key).or_insert_with(Vec::new).push((timestamp, value)); // set timestamps only increase
              }

              fn get(&mut self, key: String, timestamp: i32) -> String {
                  match self.h.get(&key) {
                      None => String::new(),
                      Some(list) => {
                          let (mut lo, mut hi) = (0usize, list.len()); // first time > timestamp
                          while lo < hi {
                              let mid = (lo + hi) / 2;
                              if list[mid].0 <= timestamp { lo = mid + 1; } else { hi = mid; }
                          }
                          if lo > 0 { list[lo - 1].1.clone() } else { String::new() }
                      }
                  }
              }
          }
        `,
        php: code`
          class TimeMap {
              private $ts = [];
              private $vs = [];

              function __construct() {
              }

              function set($key, $value, $timestamp) {
                  $this->ts[$key][] = $timestamp; // set timestamps only increase
                  $this->vs[$key][] = $value;
              }

              function get($key, $timestamp) {
                  if (!isset($this->ts[$key])) return "";
                  $t = $this->ts[$key];
                  $lo = 0; $hi = count($t); // first time > timestamp
                  while ($lo < $hi) {
                      $mid = intdiv($lo + $hi, 2);
                      if ($t[$mid] <= $timestamp) $lo = $mid + 1; else $hi = $mid;
                  }
                  return $lo > 0 ? $this->vs[$key][$lo - 1] : "";
              }
          }
        `,
        ruby: code`
          class TimeMap
            def initialize
              @ts = Hash.new { |h, k| h[k] = [] }
              @vs = Hash.new { |h, k| h[k] = [] }
            end

            def set(key, value, timestamp)
              @ts[key] << timestamp # set timestamps only increase
              @vs[key] << value
            end

            def get(key, timestamp)
              return "" unless @ts.key?(key)
              t = @ts[key]
              i = t.bsearch_index { |x| x > timestamp } || t.length
              i > 0 ? @vs[key][i - 1] : ""
            end
          end
        `,
      },
    };
  })(),

  // ── Snapshot Array (LC 1146) ──────────────────────────────────────
  (() => {
    const run: Run = (ops, args) => {
      let cur = new Map<number, number>();
      const snaps: Array<Map<number, number>> = [];
      return ops.map((op, k) => {
        if (op === "SnapshotArray") { cur = new Map(); return null; }
        if (op === "set") { cur.set(args[k][0], args[k][1]); return null; }
        if (op === "snap") { snaps.push(new Map(cur)); return snaps.length - 1; }
        const v = snaps[args[k][1]].get(args[k][0]);
        return v === undefined ? 0 : v;
      });
    };
    const make = (rng: Rng) => {
      const length = rng() < 0.04 ? 50000 : ri(rng, 1, pick(rng, [1, 3, 8, 30]));
      const ops = ["SnapshotArray"], args: Args = [[length]];
      let snaps = 0;
      const idx = () => (length > 50 && rng() < 0.5 ? pick(rng, [0, length - 1]) : ri(rng, 0, Math.min(length, 50) - 1));
      for (let m = ri(rng, 1, pick(rng, [3, 10, 25, 40])); m > 0; m--) {
        const r = rng();
        if (r < 0.4) { ops.push("set"); args.push([idx(), rng() < 0.1 ? ri(rng, 0, 1000000000) : ri(rng, 0, 9)]); }
        else if (r < 0.65 || snaps === 0) { ops.push("snap"); args.push([]); snaps++; }
        else { ops.push("get"); args.push([idx(), ri(rng, 0, snaps - 1)]); }
      }
      return { ops, args };
    };
    const ex1: [string[], Args] = [["SnapshotArray", "set", "snap", "set", "get", "get"], [[3], [0, 5], [], [0, 6], [0, 0], [1, 0]]];
    const ex2: [string[], Args] = [["SnapshotArray", "snap", "set", "set", "snap", "snap", "get", "get", "get"], [[2], [], [1, 4], [1, 7], [], [], [1, 0], [1, 1], [1, 2]]];
    return {
      slug: "snapshot-array",
      title: "Snapshot Array",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Binary Search", "Design", "Google"],
      signature: {
        funcName: "SnapshotArray", params: [{ name: "length", type: "int" as const }], returns: "void" as const,
        methods: [
          { name: "set", params: [{ name: "index", type: "int" as const }, { name: "value", type: "int" as const }], returns: "void" as const },
          { name: "snap", params: [], returns: "int" as const },
          { name: "get", params: [{ name: "index", type: "int" as const }, { name: "snapId", type: "int" as const }], returns: "int" as const },
        ],
      },
      description: describe(
        "Implement an array that can take snapshots of itself and later read any element as it was in any snapshot.\n\nWrite the class `SnapshotArray`:\n\n- `SnapshotArray(int length)` creates an array of `length` elements, all `0`.\n- `void set(int index, int value)` sets the element at `index` to `value`.\n- `int snap()` takes a snapshot and returns its id: the number of times `snap` had been called before (so the first snapshot is `0`).\n- `int get(int index, int snapId)` returns the value the element at `index` had when snapshot `snapId` was taken.\n\n" + CALLS,
        [
          exampleOf(run, ex1[0], ex1[1], "Snapshot 0 is taken while element 0 is 5; setting it to 6 afterwards does not change snapshot 0. Element 1 was never set, so it is 0."),
          exampleOf(run, ex2[0], ex2[1], "Snapshot 0 is taken before anything is set. Element 1 is set twice before snapshot 1, which keeps the last value, 7; snapshot 2 sees the same 7."),
        ],
        ["1 <= length <= 5 * 10^4", "0 <= index < length", "0 <= value <= 10^9", "0 <= snapId < the number of snap calls made so far", "At most 5 * 10^4 calls are made to set, snap and get"]),
      hints: [
        "Copying the whole array on every snapshot costs O(length) per `snap` — far too much. Most elements do not change between snapshots.",
        "Store, for each index, only its changes: a list of (snapshot id, value) pairs in the order they happened. Several `set`s before the same snapshot overwrite one another.",
        "`get(index, snapId)` wants the last change to `index` recorded with an id `<= snapId` — binary search that index's list. No such change means the element was still `0`.",
      ],
      editorial: explain({
        idea: "Record history per element instead of copying the array: each index keeps a list of `(snapId, value)` pairs, where `snapId` is the id the next snapshot will get at the time of the write.",
        steps: [
          "Keep a counter `snapId = 0` and, for each index, an initially empty history list.",
          "`set(index, value)`: if the index's last entry has id `snapId`, overwrite its value; otherwise append `(snapId, value)`.",
          "`snap()`: return `snapId` and then increase it.",
          "`get(index, snapId)`: binary search the index's history for the last entry with id `<= snapId` and return its value, or `0` if there is none.",
        ],
        why: "A write made while the counter is `s` happens after snapshot `s - 1` and before snapshot `s`, so it belongs to snapshot `s` and every later one until the element changes again. Within one id only the last write matters, which the overwrite keeps. The ids in each history are increasing, so the last entry with id `<= snapId` is the value the element held when that snapshot was taken.",
        time: "O(1) per set and snap, O(log k) per get for an index changed k times",
        space: "O(number of set calls)",
        pitfalls: [
          "Copying the array on `snap` is O(length) per call — 2.5 × 10^9 steps at the limits.",
          "Appending on every `set` instead of overwriting within the same id still works for `get` if the search finds the *last* matching entry; finding the first one returns a stale value.",
          "Untouched elements are `0`, so an empty history (or one whose first change came later) answers `0`.",
        ],
      }),
      examples: [caseOf(run, ex1[0], ex1[1]), caseOf(run, ex2[0], ex2[1])],
      gen: (rng: Rng) => { const { ops, args } = make(rng); return caseOf(run, ops, args); },
      solutions: {
        python: code`
          import bisect

          class SnapshotArray:

              def __init__(self, length: int):
                  self.snap_id = 0
                  self.ids = {}   # index -> snapshot ids of its changes, increasing
                  self.vals = {}  # index -> the value written for each of those ids

              def set(self, index: int, value: int) -> None:
                  ids = self.ids.setdefault(index, [])
                  vals = self.vals.setdefault(index, [])
                  if ids and ids[-1] == self.snap_id:
                      vals[-1] = value  # a later write before the same snapshot wins
                  else:
                      ids.append(self.snap_id)
                      vals.append(value)

              def snap(self) -> int:
                  self.snap_id += 1
                  return self.snap_id - 1

              def get(self, index: int, snapId: int) -> int:
                  ids = self.ids.get(index)
                  if not ids:
                      return 0
                  i = bisect.bisect_right(ids, snapId) - 1
                  return self.vals[index][i] if i >= 0 else 0
        `,
        javascript: code`
          var SnapshotArray = function(length) {
              this.snapId = 0;
              this.h = new Map(); // index -> { ids: [], vals: [] }
          };

          SnapshotArray.prototype.set = function(index, value) {
              var e = this.h.get(index);
              if (!e) { e = { ids: [], vals: [] }; this.h.set(index, e); }
              var n = e.ids.length;
              if (n > 0 && e.ids[n - 1] === this.snapId) e.vals[n - 1] = value; // same snapshot: overwrite
              else { e.ids.push(this.snapId); e.vals.push(value); }
          };

          SnapshotArray.prototype.snap = function() {
              return this.snapId++;
          };

          SnapshotArray.prototype.get = function(index, snapId) {
              var e = this.h.get(index);
              if (!e) return 0;
              var lo = 0, hi = e.ids.length; // first id > snapId
              while (lo < hi) {
                  var mid = (lo + hi) >> 1;
                  if (e.ids[mid] <= snapId) lo = mid + 1; else hi = mid;
              }
              return lo > 0 ? e.vals[lo - 1] : 0;
          };
        `,
        typescript: code`
          class SnapshotArray {
              snapId: number;
              ids: { [index: number]: number[] };
              vals: { [index: number]: number[] };

              constructor(length: number) {
                  this.snapId = 0;
                  this.ids = {};
                  this.vals = {};
              }

              set(index: number, value: number): void {
                  if (!this.ids[index]) { this.ids[index] = []; this.vals[index] = []; }
                  var ids = this.ids[index], vals = this.vals[index], n = ids.length;
                  if (n > 0 && ids[n - 1] === this.snapId) vals[n - 1] = value; // same snapshot: overwrite
                  else { ids.push(this.snapId); vals.push(value); }
              }

              snap(): number {
                  return this.snapId++;
              }

              get(index: number, snapId: number): number {
                  var ids = this.ids[index];
                  if (!ids) return 0;
                  var lo = 0, hi = ids.length; // first id > snapId
                  while (lo < hi) {
                      var mid = (lo + hi) >> 1;
                      if (ids[mid] <= snapId) lo = mid + 1; else hi = mid;
                  }
                  return lo > 0 ? this.vals[index][lo - 1] : 0;
              }
          }
        `,
        java: code`
          class SnapshotArray {
              private int snapId = 0;
              private HashMap<Integer, TreeMap<Integer, Integer>> h = new HashMap<>();

              public SnapshotArray(int length) {
              }

              public void set(int index, int value) {
                  // put() on the same snapshot id overwrites the earlier write
                  h.computeIfAbsent(index, k -> new TreeMap<>()).put(snapId, value);
              }

              public int snap() {
                  return snapId++;
              }

              public int get(int index, int snapId) {
                  TreeMap<Integer, Integer> t = h.get(index);
                  if (t == null) return 0;
                  Map.Entry<Integer, Integer> e = t.floorEntry(snapId);
                  return e == null ? 0 : e.getValue();
              }
          }
        `,
        cpp: code`
          class SnapshotArray {
              int snapId = 0;
              vector<vector<pair<int, int>>> h; // per index: (snapshot id, value), ids increasing
          public:
              SnapshotArray(int length) : h(length) {}

              void set(int index, int value) {
                  auto& v = h[index];
                  if (!v.empty() && v.back().first == snapId) v.back().second = value; // same snapshot: overwrite
                  else v.push_back({snapId, value});
              }

              int snap() {
                  return snapId++;
              }

              int get(int index, int snapId) {
                  auto& v = h[index];
                  auto it = upper_bound(v.begin(), v.end(), make_pair(snapId, INT_MAX));
                  return it == v.begin() ? 0 : prev(it)->second;
              }
          };
        `,
        c: code`
          typedef struct {
              int snapId;
              int** ids;   /* per index, allocated on its first write */
              int** vals;
              int* cnt;
              int* cap;
              int length;
          } SnapshotArray;

          SnapshotArray* snapshotArrayCreate(int length) {
              SnapshotArray* o = (SnapshotArray*)malloc(sizeof(SnapshotArray));
              o->snapId = 0;
              o->length = length;
              o->ids = (int**)calloc(length, sizeof(int*));
              o->vals = (int**)calloc(length, sizeof(int*));
              o->cnt = (int*)calloc(length, sizeof(int));
              o->cap = (int*)calloc(length, sizeof(int));
              return o;
          }

          void snapshotArraySet(SnapshotArray* obj, int index, int value) {
              int n = obj->cnt[index];
              if (n > 0 && obj->ids[index][n - 1] == obj->snapId) { obj->vals[index][n - 1] = value; return; } /* same snapshot: overwrite */
              if (n == obj->cap[index]) {
                  obj->cap[index] = n ? 2 * n : 2;
                  obj->ids[index] = (int*)realloc(obj->ids[index], obj->cap[index] * sizeof(int));
                  obj->vals[index] = (int*)realloc(obj->vals[index], obj->cap[index] * sizeof(int));
              }
              obj->ids[index][n] = obj->snapId;
              obj->vals[index][n] = value;
              obj->cnt[index] = n + 1;
          }

          int snapshotArraySnap(SnapshotArray* obj) {
              return obj->snapId++;
          }

          int snapshotArrayGet(SnapshotArray* obj, int index, int snapId) {
              int lo = 0, hi = obj->cnt[index]; /* first id > snapId */
              while (lo < hi) {
                  int mid = (lo + hi) / 2;
                  if (obj->ids[index][mid] <= snapId) lo = mid + 1; else hi = mid;
              }
              return lo > 0 ? obj->vals[index][lo - 1] : 0;
          }

          void snapshotArrayFree(SnapshotArray* obj) {
              for (int i = 0; i < obj->length; i++) { free(obj->ids[i]); free(obj->vals[i]); }
              free(obj->ids); free(obj->vals); free(obj->cnt); free(obj->cap);
              free(obj);
          }
        `,
        csharp: code`
          public class SnapshotArray {
              private int snapId = 0;
              private Dictionary<int, List<int>> ids = new Dictionary<int, List<int>>();
              private Dictionary<int, List<int>> vals = new Dictionary<int, List<int>>();

              public SnapshotArray(int length) {
              }

              public void Set(int index, int value) {
                  if (!ids.ContainsKey(index)) { ids[index] = new List<int>(); vals[index] = new List<int>(); }
                  var a = ids[index];
                  var v = vals[index];
                  if (a.Count > 0 && a[a.Count - 1] == snapId) v[v.Count - 1] = value; // same snapshot: overwrite
                  else { a.Add(snapId); v.Add(value); }
              }

              public int Snap() {
                  return snapId++;
              }

              public int Get(int index, int snapId) {
                  List<int> a;
                  if (!ids.TryGetValue(index, out a)) return 0;
                  int lo = 0, hi = a.Count; // first id > snapId
                  while (lo < hi) {
                      int mid = (lo + hi) / 2;
                      if (a[mid] <= snapId) lo = mid + 1; else hi = mid;
                  }
                  return lo > 0 ? vals[index][lo - 1] : 0;
              }
          }
        `,
        go: code`
          type SnapshotArray struct {
          	snapId int
          	h      map[int][][2]int // index -> (snapshot id, value), ids increasing
          }

          func Constructor(length int) SnapshotArray {
          	return SnapshotArray{h: map[int][][2]int{}}
          }

          func (this *SnapshotArray) Set(index int, value int) {
          	v := this.h[index]
          	if len(v) > 0 && v[len(v)-1][0] == this.snapId {
          		v[len(v)-1][1] = value // same snapshot: overwrite
          		return
          	}
          	this.h[index] = append(v, [2]int{this.snapId, value})
          }

          func (this *SnapshotArray) Snap() int {
          	this.snapId++
          	return this.snapId - 1
          }

          func (this *SnapshotArray) Get(index int, snapId int) int {
          	v := this.h[index]
          	i := sort.Search(len(v), func(j int) bool { return v[j][0] > snapId })
          	if i == 0 {
          		return 0
          	}
          	return v[i-1][1]
          }
        `,
        kotlin: code`
          class SnapshotArray(length: Int) {
              private var snapId = 0
              private val h = HashMap<Int, java.util.TreeMap<Int, Int>>()

              fun set(index: Int, value: Int) {
                  // put on the same snapshot id overwrites the earlier write
                  h.getOrPut(index) { java.util.TreeMap<Int, Int>() }[snapId] = value
              }

              fun snap(): Int = snapId++

              fun get(index: Int, snapId: Int): Int {
                  val t = h[index] ?: return 0
                  return t.floorEntry(snapId)?.value ?: 0
              }
          }
        `,
        swift: code`
          class SnapshotArray {
              var snapId = 0
              var h: [Int: [(Int, Int)]] = [:] // index -> (snapshot id, value), ids increasing

              init(_ length: Int) {}

              func set(_ index: Int, _ value: Int) {
                  var v = h[index] ?? []
                  if let last = v.last, last.0 == snapId { v[v.count - 1].1 = value } // same snapshot: overwrite
                  else { v.append((snapId, value)) }
                  h[index] = v
              }

              func snap() -> Int {
                  snapId += 1
                  return snapId - 1
              }

              func get(_ index: Int, _ snapId: Int) -> Int {
                  guard let v = h[index] else { return 0 }
                  var lo = 0, hi = v.count // first id > snapId
                  while lo < hi {
                      let mid = (lo + hi) / 2
                      if v[mid].0 <= snapId { lo = mid + 1 } else { hi = mid }
                  }
                  return lo > 0 ? v[lo - 1].1 : 0
              }
          }
        `,
        rust: code`
          use std::collections::HashMap;

          struct SnapshotArray {
              snap_id: i32,
              h: HashMap<i32, Vec<(i32, i32)>>, // index -> (snapshot id, value), ids increasing
          }

          impl SnapshotArray {
              fn new(length: i32) -> Self {
                  SnapshotArray { snap_id: 0, h: HashMap::new() }
              }

              fn set(&mut self, index: i32, value: i32) {
                  let id = self.snap_id;
                  let v = self.h.entry(index).or_insert_with(Vec::new);
                  let n = v.len();
                  if n > 0 && v[n - 1].0 == id { v[n - 1].1 = value; } else { v.push((id, value)); } // same snapshot: overwrite
              }

              fn snap(&mut self) -> i32 {
                  self.snap_id += 1;
                  self.snap_id - 1
              }

              fn get(&mut self, index: i32, snap_id: i32) -> i32 {
                  match self.h.get(&index) {
                      None => 0,
                      Some(v) => {
                          let (mut lo, mut hi) = (0usize, v.len()); // first id > snap_id
                          while lo < hi {
                              let mid = (lo + hi) / 2;
                              if v[mid].0 <= snap_id { lo = mid + 1; } else { hi = mid; }
                          }
                          if lo > 0 { v[lo - 1].1 } else { 0 }
                      }
                  }
              }
          }
        `,
        php: code`
          class SnapshotArray {
              private $snapId = 0;
              private $ids = [];
              private $vals = [];

              function __construct($length) {
              }

              function set($index, $value) {
                  $n = isset($this->ids[$index]) ? count($this->ids[$index]) : 0;
                  if ($n > 0 && $this->ids[$index][$n - 1] == $this->snapId) { $this->vals[$index][$n - 1] = $value; return; } // same snapshot: overwrite
                  $this->ids[$index][] = $this->snapId;
                  $this->vals[$index][] = $value;
              }

              function snap() {
                  return $this->snapId++;
              }

              function get($index, $snapId) {
                  if (!isset($this->ids[$index])) return 0;
                  $a = $this->ids[$index];
                  $lo = 0; $hi = count($a); // first id > snapId
                  while ($lo < $hi) {
                      $mid = intdiv($lo + $hi, 2);
                      if ($a[$mid] <= $snapId) $lo = $mid + 1; else $hi = $mid;
                  }
                  return $lo > 0 ? $this->vals[$index][$lo - 1] : 0;
              }
          }
        `,
        ruby: code`
          class SnapshotArray
            def initialize(length)
              @snap_id = 0
              @ids = Hash.new { |h, k| h[k] = [] }
              @vals = Hash.new { |h, k| h[k] = [] }
            end

            def set(index, value)
              ids = @ids[index]
              if !ids.empty? && ids[-1] == @snap_id
                @vals[index][-1] = value # same snapshot: overwrite
              else
                ids << @snap_id
                @vals[index] << value
              end
            end

            def snap
              @snap_id += 1
              @snap_id - 1
            end

            def get(index, snap_id)
              return 0 unless @ids.key?(index)
              ids = @ids[index]
              i = ids.bsearch_index { |x| x > snap_id } || ids.length
              i > 0 ? @vals[index][i - 1] : 0
            end
          end
        `,
      },
    };
  })(),

  // ── Iterator for Combination (LC 1286) ────────────────────────────
  (() => {
    const run: Run = (ops, args) => {
      let chars = "", k = 0, idx: number[] = [], has = true;
      return ops.map((op, a) => {
        if (op === "CombinationIterator") {
          chars = args[a][0]; k = args[a][1];
          idx = Array.from({ length: k }, (_, i) => i); has = true;
          return null;
        }
        if (op === "hasNext") return has;
        const s = idx.map((i) => chars[i]).join("");
        let i = k - 1;
        while (i >= 0 && idx[i] === chars.length - k + i) i--;
        if (i < 0) has = false;
        else { idx[i]++; for (let j = i + 1; j < k; j++) idx[j] = idx[j - 1] + 1; }
        return s;
      });
    };
    const binom = (n: number, k: number) => { let r = 1; for (let i = 0; i < k; i++) r = (r * (n - i)) / (i + 1); return Math.round(r); };
    const make = (rng: Rng) => {
      const n = ri(rng, 1, pick(rng, [2, 4, 7, 15]));
      const chars = shuffle(rng, "abcdefghijklmnopqrstuvwxyz".split("")).slice(0, n).sort().join("");
      const k = ri(rng, 1, n);
      let left = binom(n, k);
      const ops = ["CombinationIterator"], args: Args = [[chars, k]];
      for (let m = ri(rng, 1, pick(rng, [3, 10, 25, 40])); m > 0; m--) {
        if (left > 0 && rng() < 0.7) { ops.push("next"); args.push([]); left--; }
        else { ops.push("hasNext"); args.push([]); }
      }
      return { ops, args };
    };
    const ex1: [string[], Args] = [["CombinationIterator", "next", "hasNext", "next", "hasNext", "next", "hasNext"], [["xyz", 2], [], [], [], [], [], []]];
    const ex2: [string[], Args] = [["CombinationIterator", "hasNext", "next", "next", "next", "next"], [["bdfg", 3], [], [], [], [], []]];
    return {
      slug: "iterator-for-combination",
      title: "Iterator for Combination",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Backtracking", "Design", "Google"],
      signature: {
        funcName: "CombinationIterator",
        params: [{ name: "characters", type: "string" as const }, { name: "combinationLength", type: "int" as const }],
        returns: "void" as const,
        methods: [
          { name: "next", params: [], returns: "string" as const },
          { name: "hasNext", params: [], returns: "bool" as const },
        ],
      },
      description: describe(
        "Write the class `CombinationIterator`, which hands out the combinations of a set of letters one at a time, in **lexicographical order**:\n\n- `CombinationIterator(String characters, int combinationLength)` receives a string of **sorted, distinct** lowercase letters and the length of the combinations to produce.\n- `String next()` returns the next combination of `combinationLength` letters (each combination keeps the letters in their original order).\n- `boolean hasNext()` returns `true` if a call to `next` would still produce a combination.\n\n" + CALLS,
        [
          exampleOf(run, ex1[0], ex1[1], "The combinations of two letters from xyz, in order, are xy, xz, yz. After the third one, hasNext is false."),
          exampleOf(run, ex2[0], ex2[1], "Choosing three of b, d, f, g gives bdf, bdg, bfg, dfg — four combinations."),
        ],
        ["1 <= combinationLength <= characters.length <= 15", "characters consists of distinct lowercase English letters, sorted ascending", "At most 10^4 calls are made to next and hasNext", "Every call to next is valid"]),
      hints: [
        "Since the letters are sorted, a combination is just a set of increasing positions `i0 < i1 < … < i(k-1)`, and lexicographic order on the strings is lexicographic order on the positions.",
        "Start from positions `0, 1, …, k-1`. To get the next combination, find the rightmost position that can still move right.",
        "Position `j` can move while `idx[j] < n - k + j` (there must be room for the positions after it). Increase it by one and set every later position to the one before it plus one. If no position can move, the iteration is over.",
      ],
      editorial: explain({
        idea: "Generate combinations lazily from an array of `k` increasing positions, advancing it the way an odometer advances — rightmost movable digit first.",
        steps: [
          "Store the letters, `k`, the positions `idx = [0, 1, …, k-1]` and a flag `has = true`.",
          "`next()`: build the answer from the letters at `idx`, then advance: find the largest `j` with `idx[j] < n - k + j`.",
          "If there is none, this was the last combination: set `has = false`. Otherwise do `idx[j]++` and `idx[t] = idx[t-1] + 1` for every `t > j`.",
          "`hasNext()`: return `has`.",
        ],
        why: "The positions after `j` are all at their maximum (`n - k + t`), so the current combination is the largest one with this prefix `idx[0..j]`. The smallest combination greater than it must change position `j`, by the least amount — one step — and then take the smallest possible tail, the consecutive positions after it. Because the letters are sorted and distinct, the order of position arrays is exactly the order of the strings.",
        time: "O(k) per call",
        space: "O(k)",
        pitfalls: [
          "Precomputing every combination works for n ≤ 15 (at most 6,435) but wastes memory and time when few are asked for.",
          "The bound for position `j` is `n - k + j`, not `n - 1`: later positions need room after it.",
          "hasNext must be decided *after* advancing; computing it from the combination about to be returned is off by one.",
        ],
      }),
      examples: [caseOf(run, ex1[0], ex1[1]), caseOf(run, ex2[0], ex2[1])],
      gen: (rng: Rng) => { const { ops, args } = make(rng); return caseOf(run, ops, args); },
      solutions: {
        python: code`
          class CombinationIterator:

              def __init__(self, characters: str, combinationLength: int):
                  self.chars = characters
                  self.k = combinationLength
                  self.idx = list(range(combinationLength))
                  self.has = True

              def next(self) -> str:
                  chars, k, idx = self.chars, self.k, self.idx
                  s = "".join(chars[i] for i in idx)
                  j = k - 1
                  while j >= 0 and idx[j] == len(chars) - k + j:  # already at its rightmost place
                      j -= 1
                  if j < 0:
                      self.has = False
                  else:
                      idx[j] += 1
                      for t in range(j + 1, k):
                          idx[t] = idx[t - 1] + 1
                  return s

              def hasNext(self) -> bool:
                  return self.has
        `,
        javascript: code`
          var CombinationIterator = function(characters, combinationLength) {
              this.chars = characters;
              this.k = combinationLength;
              this.idx = [];
              for (var i = 0; i < combinationLength; i++) this.idx.push(i);
              this.has = true;
          };

          CombinationIterator.prototype.next = function() {
              var idx = this.idx, k = this.k, n = this.chars.length, s = "";
              for (var i = 0; i < k; i++) s += this.chars[idx[i]];
              var j = k - 1;
              while (j >= 0 && idx[j] === n - k + j) j--; // already at its rightmost place
              if (j < 0) this.has = false;
              else {
                  idx[j]++;
                  for (var t = j + 1; t < k; t++) idx[t] = idx[t - 1] + 1;
              }
              return s;
          };

          CombinationIterator.prototype.hasNext = function() {
              return this.has;
          };
        `,
        typescript: code`
          class CombinationIterator {
              chars: string;
              k: number;
              idx: number[];
              has: boolean;

              constructor(characters: string, combinationLength: number) {
                  this.chars = characters;
                  this.k = combinationLength;
                  this.idx = [];
                  for (var i = 0; i < combinationLength; i++) this.idx.push(i);
                  this.has = true;
              }

              next(): string {
                  var idx = this.idx, k = this.k, n = this.chars.length, s = "";
                  for (var i = 0; i < k; i++) s += this.chars[idx[i]];
                  var j = k - 1;
                  while (j >= 0 && idx[j] === n - k + j) j--; // already at its rightmost place
                  if (j < 0) this.has = false;
                  else {
                      idx[j]++;
                      for (var t = j + 1; t < k; t++) idx[t] = idx[t - 1] + 1;
                  }
                  return s;
              }

              hasNext(): boolean {
                  return this.has;
              }
          }
        `,
        java: code`
          class CombinationIterator {
              private String chars;
              private int k;
              private int[] idx;
              private boolean has = true;

              public CombinationIterator(String characters, int combinationLength) {
                  chars = characters;
                  k = combinationLength;
                  idx = new int[k];
                  for (int i = 0; i < k; i++) idx[i] = i;
              }

              public String next() {
                  StringBuilder sb = new StringBuilder();
                  for (int i : idx) sb.append(chars.charAt(i));
                  int n = chars.length(), j = k - 1;
                  while (j >= 0 && idx[j] == n - k + j) j--; // already at its rightmost place
                  if (j < 0) has = false;
                  else {
                      idx[j]++;
                      for (int t = j + 1; t < k; t++) idx[t] = idx[t - 1] + 1;
                  }
                  return sb.toString();
              }

              public boolean hasNext() {
                  return has;
              }
          }
        `,
        cpp: code`
          class CombinationIterator {
              string chars;
              int k;
              vector<int> idx;
              bool has = true;
          public:
              CombinationIterator(string characters, int combinationLength) : chars(characters), k(combinationLength), idx(combinationLength) {
                  for (int i = 0; i < k; i++) idx[i] = i;
              }

              string next() {
                  string s;
                  for (int i : idx) s += chars[i];
                  int n = chars.size(), j = k - 1;
                  while (j >= 0 && idx[j] == n - k + j) j--; // already at its rightmost place
                  if (j < 0) has = false;
                  else {
                      idx[j]++;
                      for (int t = j + 1; t < k; t++) idx[t] = idx[t - 1] + 1;
                  }
                  return s;
              }

              bool hasNext() {
                  return has;
              }
          };
        `,
        c: code`
          typedef struct {
              char chars[16];
              int n, k;
              int idx[16];
              bool has;
          } CombinationIterator;

          CombinationIterator* combinationIteratorCreate(char* characters, int combinationLength) {
              CombinationIterator* o = (CombinationIterator*)malloc(sizeof(CombinationIterator));
              o->n = (int)strlen(characters);
              memcpy(o->chars, characters, o->n + 1);
              o->k = combinationLength;
              for (int i = 0; i < combinationLength; i++) o->idx[i] = i;
              o->has = true;
              return o;
          }

          char* combinationIteratorNext(CombinationIterator* obj) {
              int k = obj->k;
              char* s = (char*)malloc(k + 1);
              for (int i = 0; i < k; i++) s[i] = obj->chars[obj->idx[i]];
              s[k] = '\0';
              int j = k - 1;
              while (j >= 0 && obj->idx[j] == obj->n - k + j) j--; /* already at its rightmost place */
              if (j < 0) obj->has = false;
              else {
                  obj->idx[j]++;
                  for (int t = j + 1; t < k; t++) obj->idx[t] = obj->idx[t - 1] + 1;
              }
              return s;
          }

          bool combinationIteratorHasNext(CombinationIterator* obj) {
              return obj->has;
          }

          void combinationIteratorFree(CombinationIterator* obj) {
              free(obj);
          }
        `,
        csharp: code`
          public class CombinationIterator {
              private string chars;
              private int k;
              private int[] idx;
              private bool has = true;

              public CombinationIterator(string characters, int combinationLength) {
                  chars = characters;
                  k = combinationLength;
                  idx = new int[k];
                  for (int i = 0; i < k; i++) idx[i] = i;
              }

              public string Next() {
                  var sb = new System.Text.StringBuilder();
                  foreach (int i in idx) sb.Append(chars[i]);
                  int n = chars.Length, j = k - 1;
                  while (j >= 0 && idx[j] == n - k + j) j--; // already at its rightmost place
                  if (j < 0) has = false;
                  else {
                      idx[j]++;
                      for (int t = j + 1; t < k; t++) idx[t] = idx[t - 1] + 1;
                  }
                  return sb.ToString();
              }

              public bool HasNext() {
                  return has;
              }
          }
        `,
        go: code`
          type CombinationIterator struct {
          	chars string
          	k     int
          	idx   []int
          	has   bool
          }

          func Constructor(characters string, combinationLength int) CombinationIterator {
          	idx := make([]int, combinationLength)
          	for i := range idx {
          		idx[i] = i
          	}
          	return CombinationIterator{chars: characters, k: combinationLength, idx: idx, has: true}
          }

          func (this *CombinationIterator) Next() string {
          	b := make([]byte, this.k)
          	for i, p := range this.idx {
          		b[i] = this.chars[p]
          	}
          	n, k, j := len(this.chars), this.k, this.k-1
          	for j >= 0 && this.idx[j] == n-k+j { // already at its rightmost place
          		j--
          	}
          	if j < 0 {
          		this.has = false
          	} else {
          		this.idx[j]++
          		for t := j + 1; t < k; t++ {
          			this.idx[t] = this.idx[t-1] + 1
          		}
          	}
          	return string(b)
          }

          func (this *CombinationIterator) HasNext() bool {
          	return this.has
          }
        `,
        kotlin: code`
          class CombinationIterator(characters: String, combinationLength: Int) {
              private val chars = characters
              private val k = combinationLength
              private val idx = IntArray(combinationLength) { it }
              private var has = true

              fun next(): String {
                  val sb = StringBuilder()
                  for (i in idx) sb.append(chars[i])
                  val n = chars.length
                  var j = k - 1
                  while (j >= 0 && idx[j] == n - k + j) j-- // already at its rightmost place
                  if (j < 0) has = false
                  else {
                      idx[j]++
                      for (t in j + 1 until k) idx[t] = idx[t - 1] + 1
                  }
                  return sb.toString()
              }

              fun hasNext(): Boolean = has
          }
        `,
        swift: code`
          class CombinationIterator {
              var chars: [Character]
              var k: Int
              var idx: [Int]
              var has = true

              init(_ characters: String, _ combinationLength: Int) {
                  chars = Array(characters)
                  k = combinationLength
                  idx = Array(0..<combinationLength)
              }

              func next() -> String {
                  let s = String(idx.map { chars[$0] })
                  let n = chars.count
                  var j = k - 1
                  while j >= 0 && idx[j] == n - k + j { j -= 1 } // already at its rightmost place
                  if j < 0 { has = false }
                  else {
                      idx[j] += 1
                      var t = j + 1
                      while t < k { idx[t] = idx[t - 1] + 1; t += 1 }
                  }
                  return s
              }

              func hasNext() -> Bool {
                  return has
              }
          }
        `,
        rust: code`
          struct CombinationIterator {
              chars: Vec<u8>,
              k: usize,
              idx: Vec<usize>,
              has: bool,
          }

          impl CombinationIterator {
              fn new(characters: String, combination_length: i32) -> Self {
                  let k = combination_length as usize;
                  CombinationIterator { chars: characters.into_bytes(), k, idx: (0..k).collect(), has: true }
              }

              fn next(&mut self) -> String {
                  let s: Vec<u8> = self.idx.iter().map(|&i| self.chars[i]).collect();
                  let (n, k) = (self.chars.len(), self.k);
                  let mut j = k;
                  while j > 0 && self.idx[j - 1] == n - k + j - 1 { j -= 1; } // already at its rightmost place
                  if j == 0 {
                      self.has = false;
                  } else {
                      let j = j - 1;
                      self.idx[j] += 1;
                      for t in j + 1..k { self.idx[t] = self.idx[t - 1] + 1; }
                  }
                  String::from_utf8(s).unwrap()
              }

              fn hasNext(&mut self) -> bool {
                  self.has
              }
          }
        `,
        php: code`
          class CombinationIterator {
              private $chars;
              private $k;
              private $idx;
              private $has = true;

              function __construct($characters, $combinationLength) {
                  $this->chars = $characters;
                  $this->k = $combinationLength;
                  $this->idx = range(0, $combinationLength - 1);
              }

              function next() {
                  $s = "";
                  foreach ($this->idx as $i) $s .= $this->chars[$i];
                  $n = strlen($this->chars); $k = $this->k; $j = $k - 1;
                  while ($j >= 0 && $this->idx[$j] == $n - $k + $j) $j--; // already at its rightmost place
                  if ($j < 0) $this->has = false;
                  else {
                      $this->idx[$j]++;
                      for ($t = $j + 1; $t < $k; $t++) $this->idx[$t] = $this->idx[$t - 1] + 1;
                  }
                  return $s;
              }

              function hasNext() {
                  return $this->has;
              }
          }
        `,
        ruby: code`
          class CombinationIterator
            def initialize(characters, combination_length)
              @chars = characters
              @k = combination_length
              @idx = (0...combination_length).to_a
              @has = true
            end

            def next
              s = @idx.map { |i| @chars[i] }.join
              n = @chars.length
              j = @k - 1
              j -= 1 while j >= 0 && @idx[j] == n - @k + j # already at its rightmost place
              if j < 0
                @has = false
              else
                @idx[j] += 1
                (j + 1...@k).each { |t| @idx[t] = @idx[t - 1] + 1 }
              end
              s
            end

            def hasNext
              @has
            end
          end
        `,
      },
    };
  })(),

  // ── Tweet Counts Per Frequency (LC 1348) ──────────────────────────
  (() => {
    const CHUNK: Record<string, number> = { minute: 60, hour: 3600, day: 86400 };
    const run: Run = (ops, args) => {
      const rec: Array<[string, number]> = [];
      return ops.map((op, k) => {
        if (op === "TweetCounts") return null;
        if (op === "recordTweet") { rec.push([args[k][0], args[k][1]]); return null; }
        const [freq, name, start, end] = args[k] as [string, string, number, number];
        const out: number[] = [];
        // Brute force: walk the chunks and count each one separately.
        for (let lo = start; lo <= end; lo += CHUNK[freq]) {
          const hi = Math.min(end, lo + CHUNK[freq] - 1);
          out.push(rec.filter(([nm, t]) => nm === name && t >= lo && t <= hi).length);
        }
        return out;
      });
    };
    const make = (rng: Rng) => {
      const names = Array.from({ length: ri(rng, 1, 3) }, () => "tw" + ri(rng, 0, 9));
      const span = pick(rng, [100, 400, 2000, 10000, 100000]);
      const base = rng() < 0.15 ? 1000000000 - span : rng() < 0.5 ? 0 : ri(rng, 0, 100000000);
      const ops = ["TweetCounts"], args: Args = [[]];
      for (let m = ri(rng, 1, pick(rng, [3, 10, 25, 40])); m > 0; m--) {
        if (rng() < 0.65) { ops.push("recordTweet"); args.push([pick(rng, names), base + ri(rng, 0, span)]); }
        else {
          const freq = pick(rng, ["minute", "minute", "hour", "day"]);
          const start = base + ri(rng, 0, span);
          const end = Math.min(1000000000, start + ri(rng, 0, pick(rng, [0, 59, 60, 300, 700, 3600, 10000])));
          ops.push("getTweetCountsPerFrequency");
          args.push([freq, rng() < 0.1 ? "tw" + ri(rng, 0, 9) : pick(rng, names), start, end]);
        }
      }
      return { ops, args };
    };
    const ex1: [string[], Args] = [
      ["TweetCounts", "recordTweet", "recordTweet", "recordTweet", "getTweetCountsPerFrequency", "getTweetCountsPerFrequency", "recordTweet", "getTweetCountsPerFrequency"],
      [[], ["tweet3", 0], ["tweet3", 60], ["tweet3", 10], ["minute", "tweet3", 0, 59], ["minute", "tweet3", 0, 60], ["tweet3", 120], ["hour", "tweet3", 0, 210]],
    ];
    const ex2: [string[], Args] = [
      ["TweetCounts", "recordTweet", "recordTweet", "getTweetCountsPerFrequency", "getTweetCountsPerFrequency"],
      [[], ["news", 5], ["news", 130], ["minute", "news", 10, 200], ["day", "sport", 0, 100]],
    ];
    return {
      slug: "tweet-counts-per-frequency",
      title: "Tweet Counts Per Frequency",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "Binary Search", "Sorting", "Ordered Set", "Design", "Twitter"],
      signature: {
        funcName: "TweetCounts", params: [], returns: "void" as const,
        methods: [
          { name: "recordTweet", params: [{ name: "tweetName", type: "string" as const }, { name: "time", type: "int" as const }], returns: "void" as const },
          {
            name: "getTweetCountsPerFrequency",
            params: [{ name: "freq", type: "string" as const }, { name: "tweetName", type: "string" as const }, { name: "startTime", type: "int" as const }, { name: "endTime", type: "int" as const }],
            returns: "int[]" as const,
          },
        ],
      },
      description: describe(
        "A social network wants activity charts: how many times a tweet was posted in each minute, hour or day of a time window.\n\nThe window `[startTime, endTime]` (in seconds, both ends included) is cut into consecutive chunks of the chosen frequency — 60 seconds for `\"minute\"`, 3600 for `\"hour\"`, 86400 for `\"day\"` — starting at `startTime`: `[startTime, startTime + size - 1]`, `[startTime + size, startTime + 2·size - 1]`, and so on. The last chunk stops at `endTime` and may be shorter than the others.\n\nWrite the class `TweetCounts`:\n\n- `TweetCounts()` creates an empty record.\n- `void recordTweet(String tweetName, int time)` records one posting of `tweetName` at second `time`.\n- `int[] getTweetCountsPerFrequency(String freq, String tweetName, int startTime, int endTime)` returns, for each chunk in order, how many recorded postings of `tweetName` fall inside it.\n\n" + CALLS,
        [
          exampleOf(run, ex1[0], ex1[1], "[0,59] is one minute holding the postings at 0 and 10. [0,60] is two chunks, [0,59] and [60,60], with 2 and 1 postings. After a posting at 120, the hour window [0,210] is a single chunk holding all four."),
          exampleOf(run, ex2[0], ex2[1], "The window [10,200] splits into [10,69], [70,129], [130,189] and [190,200]; only the posting at 130 is inside it. Nothing was recorded for sport, so its single day chunk counts 0."),
        ],
        ["0 <= time, startTime, endTime <= 10^9", "0 <= endTime - startTime <= 10^4", "freq is \"minute\", \"hour\" or \"day\"", "tweetName consists of lowercase English letters and digits", "At most 10^4 calls are made to recordTweet and getTweetCountsPerFrequency in total"]),
      hints: [
        "Keep the posting times of each tweet name together, in a map from name to a list of times.",
        "The number of chunks is `(endTime - startTime) / size + 1` (integer division), and a posting at time `t` inside the window belongs to chunk `(t - startTime) / size`.",
        "So one pass over the tweet's times fills an array of counts: skip times outside `[startTime, endTime]` and increment the chunk each remaining time maps to. (With the times kept sorted, a binary search can jump straight to the window.)",
      ],
      editorial: explain({
        idea: "Store each tweet's posting times; a query allocates one counter per chunk and drops every posting inside the window into its chunk with one division.",
        steps: [
          "`recordTweet(name, time)`: append `time` to `times[name]`.",
          "`getTweetCountsPerFrequency(freq, name, start, end)`: let `size` be 60, 3600 or 86400 and make `(end - start) / size + 1` counters, all 0.",
          "For each recorded time `t` of `name` with `start <= t <= end`, increment counter `(t - start) / size`.",
          "Return the counters.",
        ],
        why: "Chunk `i` covers `[start + i·size, start + (i+1)·size - 1]`, so a time `t >= start` lies in chunk `floor((t - start) / size)`; for `t <= end` that index is at most `(end - start) / size`, the last chunk — which is why the last chunk is automatically cut at `end`. Every posting inside the window is counted exactly once, in its own chunk.",
        time: "O(1) per record, O(p + c) per query for p postings of that tweet and c chunks",
        space: "O(total postings)",
        pitfalls: [
          "The chunks start at `startTime`, not at multiples of 60 — `[10,69]` is a minute here.",
          "The last chunk may be shorter but must still be present: `[0,60]` in minutes is two chunks, `[0,59]` and `[60,60]`.",
          "A tweet name never recorded still gets its full array of zeros.",
        ],
      }),
      examples: [caseOf(run, ex1[0], ex1[1]), caseOf(run, ex2[0], ex2[1])],
      gen: (rng: Rng) => { const { ops, args } = make(rng); return caseOf(run, ops, args); },
      solutions: {
        python: code`
          class TweetCounts:
              SIZE = {"minute": 60, "hour": 3600, "day": 86400}

              def __init__(self):
                  self.times = {}

              def recordTweet(self, tweetName: str, time: int) -> None:
                  self.times.setdefault(tweetName, []).append(time)

              def getTweetCountsPerFrequency(self, freq: str, tweetName: str, startTime: int, endTime: int) -> List[int]:
                  size = self.SIZE[freq]
                  res = [0] * ((endTime - startTime) // size + 1)
                  for t in self.times.get(tweetName, []):
                      if startTime <= t <= endTime:
                          res[(t - startTime) // size] += 1  # the chunk this posting falls in
                  return res
        `,
        javascript: code`
          var TweetCounts = function() {
              this.times = new Map();
          };

          TweetCounts.prototype.recordTweet = function(tweetName, time) {
              if (!this.times.has(tweetName)) this.times.set(tweetName, []);
              this.times.get(tweetName).push(time);
          };

          TweetCounts.prototype.getTweetCountsPerFrequency = function(freq, tweetName, startTime, endTime) {
              var size = freq === "minute" ? 60 : freq === "hour" ? 3600 : 86400;
              var res = new Array(Math.floor((endTime - startTime) / size) + 1).fill(0);
              var list = this.times.get(tweetName) || [];
              for (var i = 0; i < list.length; i++) {
                  var t = list[i];
                  if (t >= startTime && t <= endTime) res[Math.floor((t - startTime) / size)]++; // the chunk this posting falls in
              }
              return res;
          };
        `,
        typescript: code`
          class TweetCounts {
              times: { [name: string]: number[] };

              constructor() {
                  this.times = Object.create(null);
              }

              recordTweet(tweetName: string, time: number): void {
                  if (!this.times[tweetName]) this.times[tweetName] = [];
                  this.times[tweetName].push(time);
              }

              getTweetCountsPerFrequency(freq: string, tweetName: string, startTime: number, endTime: number): number[] {
                  var size = freq === "minute" ? 60 : freq === "hour" ? 3600 : 86400;
                  var res: number[] = [];
                  var chunks = Math.floor((endTime - startTime) / size) + 1;
                  for (var c = 0; c < chunks; c++) res.push(0);
                  var list = this.times[tweetName] || [];
                  for (var i = 0; i < list.length; i++) {
                      var t = list[i];
                      if (t >= startTime && t <= endTime) res[Math.floor((t - startTime) / size)]++; // the chunk this posting falls in
                  }
                  return res;
              }
          }
        `,
        java: code`
          class TweetCounts {
              private HashMap<String, List<Integer>> times = new HashMap<>();

              public TweetCounts() {
              }

              public void recordTweet(String tweetName, int time) {
                  times.computeIfAbsent(tweetName, k -> new ArrayList<>()).add(time);
              }

              public int[] getTweetCountsPerFrequency(String freq, String tweetName, int startTime, int endTime) {
                  int size = freq.equals("minute") ? 60 : freq.equals("hour") ? 3600 : 86400;
                  int[] res = new int[(endTime - startTime) / size + 1];
                  for (int t : times.getOrDefault(tweetName, new ArrayList<>()))
                      if (t >= startTime && t <= endTime) res[(t - startTime) / size]++; // the chunk this posting falls in
                  return res;
              }
          }
        `,
        cpp: code`
          class TweetCounts {
              unordered_map<string, vector<int>> times;
          public:
              TweetCounts() {}

              void recordTweet(string tweetName, int time) {
                  times[tweetName].push_back(time);
              }

              vector<int> getTweetCountsPerFrequency(string freq, string tweetName, int startTime, int endTime) {
                  int size = freq == "minute" ? 60 : freq == "hour" ? 3600 : 86400;
                  vector<int> res((endTime - startTime) / size + 1, 0);
                  auto it = times.find(tweetName);
                  if (it != times.end())
                      for (int t : it->second)
                          if (t >= startTime && t <= endTime) res[(t - startTime) / size]++; // the chunk this posting falls in
                  return res;
              }
          };
        `,
        c: code`
          /* No hash map in C: tweet names live in a small table searched linearly. */
          typedef struct {
              char* name;
              int* t;
              int n, cap;
          } TcName;

          typedef struct {
              TcName* a;
              int n, cap;
          } TweetCounts;

          TweetCounts* tweetCountsCreate() {
              TweetCounts* o = (TweetCounts*)malloc(sizeof(TweetCounts));
              o->n = 0;
              o->cap = 4;
              o->a = (TcName*)malloc(4 * sizeof(TcName));
              return o;
          }

          static TcName* tcFind(TweetCounts* o, const char* name) {
              for (int i = 0; i < o->n; i++) if (strcmp(o->a[i].name, name) == 0) return &o->a[i];
              return NULL;
          }

          void tweetCountsRecordTweet(TweetCounts* obj, char* tweetName, int time) {
              TcName* e = tcFind(obj, tweetName);
              if (!e) {
                  if (obj->n == obj->cap) { obj->cap *= 2; obj->a = (TcName*)realloc(obj->a, obj->cap * sizeof(TcName)); }
                  e = &obj->a[obj->n++];
                  size_t len = strlen(tweetName);
                  e->name = (char*)malloc(len + 1);
                  memcpy(e->name, tweetName, len + 1);
                  e->n = 0;
                  e->cap = 4;
                  e->t = (int*)malloc(4 * sizeof(int));
              }
              if (e->n == e->cap) { e->cap *= 2; e->t = (int*)realloc(e->t, e->cap * sizeof(int)); }
              e->t[e->n++] = time;
          }

          int* tweetCountsGetTweetCountsPerFrequency(TweetCounts* obj, char* freq, char* tweetName, int startTime, int endTime, int* returnSize) {
              int size = freq[0] == 'm' ? 60 : freq[0] == 'h' ? 3600 : 86400;
              int chunks = (endTime - startTime) / size + 1;
              int* res = (int*)calloc(chunks, sizeof(int));
              TcName* e = tcFind(obj, tweetName);
              if (e)
                  for (int i = 0; i < e->n; i++)
                      if (e->t[i] >= startTime && e->t[i] <= endTime) res[(e->t[i] - startTime) / size]++; /* the chunk this posting falls in */
              *returnSize = chunks;
              return res;
          }

          void tweetCountsFree(TweetCounts* obj) {
              for (int i = 0; i < obj->n; i++) { free(obj->a[i].name); free(obj->a[i].t); }
              free(obj->a);
              free(obj);
          }
        `,
        csharp: code`
          public class TweetCounts {
              private Dictionary<string, List<int>> times = new Dictionary<string, List<int>>();

              public TweetCounts() {
              }

              public void RecordTweet(string tweetName, int time) {
                  if (!times.ContainsKey(tweetName)) times[tweetName] = new List<int>();
                  times[tweetName].Add(time);
              }

              public int[] GetTweetCountsPerFrequency(string freq, string tweetName, int startTime, int endTime) {
                  int size = freq == "minute" ? 60 : freq == "hour" ? 3600 : 86400;
                  int[] res = new int[(endTime - startTime) / size + 1];
                  List<int> list;
                  if (times.TryGetValue(tweetName, out list))
                      foreach (int t in list)
                          if (t >= startTime && t <= endTime) res[(t - startTime) / size]++; // the chunk this posting falls in
                  return res;
              }
          }
        `,
        go: code`
          type TweetCounts struct {
          	times map[string][]int
          }

          func Constructor() TweetCounts {
          	return TweetCounts{times: map[string][]int{}}
          }

          func (this *TweetCounts) RecordTweet(tweetName string, time int) {
          	this.times[tweetName] = append(this.times[tweetName], time)
          }

          func (this *TweetCounts) GetTweetCountsPerFrequency(freq string, tweetName string, startTime int, endTime int) []int {
          	size := 86400
          	if freq == "minute" {
          		size = 60
          	} else if freq == "hour" {
          		size = 3600
          	}
          	res := make([]int, (endTime-startTime)/size+1)
          	for _, t := range this.times[tweetName] {
          		if t >= startTime && t <= endTime {
          			res[(t-startTime)/size]++ // the chunk this posting falls in
          		}
          	}
          	return res
          }
        `,
        kotlin: code`
          class TweetCounts() {
              private val times = HashMap<String, MutableList<Int>>()

              fun recordTweet(tweetName: String, time: Int) {
                  times.getOrPut(tweetName) { ArrayList<Int>() }.add(time)
              }

              fun getTweetCountsPerFrequency(freq: String, tweetName: String, startTime: Int, endTime: Int): IntArray {
                  val size = when (freq) { "minute" -> 60; "hour" -> 3600; else -> 86400 }
                  val res = IntArray((endTime - startTime) / size + 1)
                  for (t in times[tweetName] ?: ArrayList<Int>())
                      if (t >= startTime && t <= endTime) res[(t - startTime) / size]++ // the chunk this posting falls in
                  return res
              }
          }
        `,
        swift: code`
          class TweetCounts {
              var times: [String: [Int]] = [:]

              init() {}

              func recordTweet(_ tweetName: String, _ time: Int) {
                  times[tweetName, default: []].append(time)
              }

              func getTweetCountsPerFrequency(_ freq: String, _ tweetName: String, _ startTime: Int, _ endTime: Int) -> [Int] {
                  let size = freq == "minute" ? 60 : freq == "hour" ? 3600 : 86400
                  var res = [Int](repeating: 0, count: (endTime - startTime) / size + 1)
                  for t in times[tweetName] ?? [] where t >= startTime && t <= endTime {
                      res[(t - startTime) / size] += 1 // the chunk this posting falls in
                  }
                  return res
              }
          }
        `,
        rust: code`
          use std::collections::HashMap;

          struct TweetCounts {
              times: HashMap<String, Vec<i32>>,
          }

          impl TweetCounts {
              fn new() -> Self {
                  TweetCounts { times: HashMap::new() }
              }

              fn recordTweet(&mut self, tweet_name: String, time: i32) {
                  self.times.entry(tweet_name).or_insert_with(Vec::new).push(time);
              }

              fn getTweetCountsPerFrequency(&mut self, freq: String, tweet_name: String, start_time: i32, end_time: i32) -> Vec<i32> {
                  let size = match freq.as_str() { "minute" => 60, "hour" => 3600, _ => 86400 };
                  let mut res = vec![0; ((end_time - start_time) / size + 1) as usize];
                  if let Some(list) = self.times.get(&tweet_name) {
                      for &t in list.iter() {
                          if t >= start_time && t <= end_time { res[((t - start_time) / size) as usize] += 1; } // the chunk this posting falls in
                      }
                  }
                  res
              }
          }
        `,
        php: code`
          class TweetCounts {
              private $times = [];

              function __construct() {
              }

              function recordTweet($tweetName, $time) {
                  $this->times[$tweetName][] = $time;
              }

              function getTweetCountsPerFrequency($freq, $tweetName, $startTime, $endTime) {
                  $size = $freq === "minute" ? 60 : ($freq === "hour" ? 3600 : 86400);
                  $res = array_fill(0, intdiv($endTime - $startTime, $size) + 1, 0);
                  foreach ($this->times[$tweetName] ?? [] as $t)
                      if ($t >= $startTime && $t <= $endTime) $res[intdiv($t - $startTime, $size)]++; // the chunk this posting falls in
                  return $res;
              }
          }
        `,
        ruby: code`
          class TweetCounts
            SIZE = { "minute" => 60, "hour" => 3600, "day" => 86400 }

            def initialize
              @times = Hash.new { |h, k| h[k] = [] }
            end

            def recordTweet(tweet_name, time)
              @times[tweet_name] << time
            end

            def getTweetCountsPerFrequency(freq, tweet_name, start_time, end_time)
              size = SIZE[freq]
              res = Array.new((end_time - start_time) / size + 1, 0)
              (@times.key?(tweet_name) ? @times[tweet_name] : []).each do |t|
                res[(t - start_time) / size] += 1 if t >= start_time && t <= end_time # the chunk this posting falls in
              end
              res
            end
          end
        `,
      },
    };
  })(),

  // ── Product of the Last K Numbers (LC 1352) ───────────────────────
  (() => {
    const run: Run = (ops, args) => {
      const nums: number[] = [];
      return ops.map((op, k) => {
        if (op === "ProductOfNumbers") return null;
        if (op === "add") { nums.push(args[k][0]); return null; }
        let p = 1;
        for (let i = nums.length - args[k][0]; i < nums.length; i++) p *= nums[i]; // exact: every product fits 32 bits
        return p;
      });
    };
    const LIMIT = 2147483647;
    const make = (rng: Rng) => {
      const ops = ["ProductOfNumbers"], args: Args = [[]];
      let count = 0, runProd = 1;
      const hi = pick(rng, [2, 3, 10, 100]);
      for (let m = ri(rng, 1, pick(rng, [3, 10, 25, 40])); m > 0; m--) {
        if (count === 0 || rng() < 0.55) {
          let num = rng() < 0.1 ? 0 : ri(rng, 1, hi);
          if (runProd * num > LIMIT) num = rng() < 0.5 ? 1 : 0; // keep every contiguous product within 32 bits
          runProd = num === 0 ? 1 : runProd * num;
          ops.push("add"); args.push([num]); count++;
        } else {
          ops.push("getProduct"); args.push([rng() < 0.2 ? count : ri(rng, 1, count)]);
        }
      }
      return { ops, args };
    };
    const ex1: [string[], Args] = [
      ["ProductOfNumbers", "add", "add", "add", "getProduct", "getProduct", "add", "getProduct", "add", "getProduct"],
      [[], [3], [2], [5], [2], [3], [0], [2], [4], [1]],
    ];
    const ex2: [string[], Args] = [["ProductOfNumbers", "add", "add", "getProduct", "getProduct"], [[], [100], [7], [1], [2]]];
    return {
      slug: "product-of-the-last-k-numbers",
      title: "Product of the Last K Numbers",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Math", "Prefix Sum", "Design", "Google", "Amazon"],
      signature: {
        funcName: "ProductOfNumbers", params: [], returns: "void" as const,
        methods: [
          { name: "add", params: [{ name: "num", type: "int" as const }], returns: "void" as const },
          { name: "getProduct", params: [{ name: "k", type: "int" as const }], returns: "int" as const },
        ],
      },
      description: describe(
        "Numbers arrive one at a time. At any moment you may be asked for the product of the most recent `k` of them.\n\nWrite the class `ProductOfNumbers`:\n\n- `ProductOfNumbers()` starts with an empty stream.\n- `void add(int num)` appends `num` to the stream.\n- `int getProduct(int k)` returns the product of the last `k` numbers in the stream. At least `k` numbers have been added whenever it is called.\n\nThe stream is guaranteed to stay small enough that the product of **any** contiguous run of its numbers fits in a signed 32-bit integer.\n\n" + CALLS,
        [
          exampleOf(run, ex1[0], ex1[1], "After 3, 2, 5 the last two multiply to 10 and the last three to 30. Once a 0 arrives, any product that reaches back over it is 0. After 4 is added, the last one number is 4."),
          exampleOf(run, ex2[0], ex2[1], "The last number is 7; the last two are 100 and 7."),
        ],
        ["0 <= num <= 100", "1 <= k <= 4 * 10^4", "At most 4 * 10^4 calls are made to add and getProduct", "k never exceeds the number of numbers added so far", "The product of any contiguous run of the stream fits in a signed 32-bit integer"],
        "Can you make every call O(1)?"),
      hints: [
        "For sums of the last k numbers you would keep prefix sums and subtract. Products have the same trick with division: last-k product = prefix[n] / prefix[n - k].",
        "Division breaks on zeros: a prefix product that has passed a 0 is 0 forever after.",
        "When a 0 arrives, throw the prefix list away and start again from `[1]`. Then if `k` reaches back further than the list does, the window contains that 0 and the answer is 0; otherwise divide.",
      ],
      editorial: explain({
        idea: "Keep prefix products of the numbers since the last zero. Any window that stays inside that stretch is a quotient of two prefixes; any longer window contains a zero.",
        steps: [
          "Start with `pre = [1]`.",
          "`add(num)`: if `num == 0`, reset `pre = [1]`; otherwise append `pre[last] * num`.",
          "`getProduct(k)`: if `k >= pre.length`, the last `k` numbers include the most recent zero — return 0.",
          "Otherwise return `pre[last] / pre[last - k]`.",
        ],
        why: "After the reset, `pre[i]` is the product of the first `i` numbers added since the last zero, so the product of the last `k` of them is `pre[m] / pre[m - k]` — exact, because every factor is a positive integer that divides out. `pre` has one more entry than there are numbers since the zero, so `k >= pre.length` means the window reaches the zero itself. Each `pre[i]` is a contiguous product, so it fits in 32 bits by the guarantee.",
        time: "O(1) per call (amortised for the list append)",
        space: "O(n)",
        pitfalls: [
          "Without the reset a single 0 makes every later prefix 0 and the division undefined.",
          "Multiplying the last k numbers on every query is O(k) — 1.6 × 10^9 steps at the limits.",
          "The comparison is `k >= len(pre)`, not `>`: `pre` starts with the extra 1.",
        ],
      }),
      examples: [caseOf(run, ex1[0], ex1[1]), caseOf(run, ex2[0], ex2[1])],
      gen: (rng: Rng) => { const { ops, args } = make(rng); return caseOf(run, ops, args); },
      solutions: {
        python: code`
          class ProductOfNumbers:

              def __init__(self):
                  self.pre = [1]  # prefix products since the last zero

              def add(self, num: int) -> None:
                  if num == 0:
                      self.pre = [1]
                  else:
                      self.pre.append(self.pre[-1] * num)

              def getProduct(self, k: int) -> int:
                  if k >= len(self.pre):
                      return 0  # the window reaches back to a zero
                  return self.pre[-1] // self.pre[-1 - k]
        `,
        javascript: code`
          var ProductOfNumbers = function() {
              this.pre = [1]; // prefix products since the last zero
          };

          ProductOfNumbers.prototype.add = function(num) {
              if (num === 0) this.pre = [1];
              else this.pre.push(this.pre[this.pre.length - 1] * num);
          };

          ProductOfNumbers.prototype.getProduct = function(k) {
              var n = this.pre.length;
              if (k >= n) return 0; // the window reaches back to a zero
              return this.pre[n - 1] / this.pre[n - 1 - k];
          };
        `,
        typescript: code`
          class ProductOfNumbers {
              pre: number[];

              constructor() {
                  this.pre = [1]; // prefix products since the last zero
              }

              add(num: number): void {
                  if (num === 0) this.pre = [1];
                  else this.pre.push(this.pre[this.pre.length - 1] * num);
              }

              getProduct(k: number): number {
                  var n = this.pre.length;
                  if (k >= n) return 0; // the window reaches back to a zero
                  return this.pre[n - 1] / this.pre[n - 1 - k];
              }
          }
        `,
        java: code`
          class ProductOfNumbers {
              private List<Integer> pre = new ArrayList<>(); // prefix products since the last zero

              public ProductOfNumbers() {
                  pre.add(1);
              }

              public void add(int num) {
                  if (num == 0) { pre.clear(); pre.add(1); }
                  else pre.add(pre.get(pre.size() - 1) * num);
              }

              public int getProduct(int k) {
                  int n = pre.size();
                  if (k >= n) return 0; // the window reaches back to a zero
                  return pre.get(n - 1) / pre.get(n - 1 - k);
              }
          }
        `,
        cpp: code`
          class ProductOfNumbers {
              vector<int> pre{1}; // prefix products since the last zero
          public:
              ProductOfNumbers() {}

              void add(int num) {
                  if (num == 0) pre.assign(1, 1);
                  else pre.push_back(pre.back() * num);
              }

              int getProduct(int k) {
                  int n = pre.size();
                  if (k >= n) return 0; // the window reaches back to a zero
                  return pre[n - 1] / pre[n - 1 - k];
              }
          };
        `,
        c: code`
          typedef struct {
              int* pre; /* prefix products since the last zero */
              int n, cap;
          } ProductOfNumbers;

          ProductOfNumbers* productOfNumbersCreate() {
              ProductOfNumbers* o = (ProductOfNumbers*)malloc(sizeof(ProductOfNumbers));
              o->cap = 16;
              o->pre = (int*)malloc(16 * sizeof(int));
              o->pre[0] = 1;
              o->n = 1;
              return o;
          }

          void productOfNumbersAdd(ProductOfNumbers* obj, int num) {
              if (num == 0) { obj->n = 1; return; }
              if (obj->n == obj->cap) { obj->cap *= 2; obj->pre = (int*)realloc(obj->pre, obj->cap * sizeof(int)); }
              obj->pre[obj->n] = obj->pre[obj->n - 1] * num;
              obj->n++;
          }

          int productOfNumbersGetProduct(ProductOfNumbers* obj, int k) {
              if (k >= obj->n) return 0; /* the window reaches back to a zero */
              return obj->pre[obj->n - 1] / obj->pre[obj->n - 1 - k];
          }

          void productOfNumbersFree(ProductOfNumbers* obj) {
              free(obj->pre);
              free(obj);
          }
        `,
        csharp: code`
          public class ProductOfNumbers {
              private List<int> pre = new List<int> { 1 }; // prefix products since the last zero

              public ProductOfNumbers() {
              }

              public void Add(int num) {
                  if (num == 0) { pre.Clear(); pre.Add(1); }
                  else pre.Add(pre[pre.Count - 1] * num);
              }

              public int GetProduct(int k) {
                  int n = pre.Count;
                  if (k >= n) return 0; // the window reaches back to a zero
                  return pre[n - 1] / pre[n - 1 - k];
              }
          }
        `,
        go: code`
          type ProductOfNumbers struct {
          	pre []int // prefix products since the last zero
          }

          func Constructor() ProductOfNumbers {
          	return ProductOfNumbers{pre: []int{1}}
          }

          func (this *ProductOfNumbers) Add(num int) {
          	if num == 0 {
          		this.pre = []int{1}
          		return
          	}
          	this.pre = append(this.pre, this.pre[len(this.pre)-1]*num)
          }

          func (this *ProductOfNumbers) GetProduct(k int) int {
          	n := len(this.pre)
          	if k >= n {
          		return 0 // the window reaches back to a zero
          	}
          	return this.pre[n-1] / this.pre[n-1-k]
          }
        `,
        kotlin: code`
          class ProductOfNumbers() {
              private val pre = arrayListOf(1) // prefix products since the last zero

              fun add(num: Int) {
                  if (num == 0) { pre.clear(); pre.add(1) }
                  else pre.add(pre[pre.size - 1] * num)
              }

              fun getProduct(k: Int): Int {
                  val n = pre.size
                  if (k >= n) return 0 // the window reaches back to a zero
                  return pre[n - 1] / pre[n - 1 - k]
              }
          }
        `,
        swift: code`
          class ProductOfNumbers {
              var pre = [1] // prefix products since the last zero

              init() {}

              func add(_ num: Int) {
                  if num == 0 { pre = [1] } else { pre.append(pre[pre.count - 1] * num) }
              }

              func getProduct(_ k: Int) -> Int {
                  let n = pre.count
                  if k >= n { return 0 } // the window reaches back to a zero
                  return pre[n - 1] / pre[n - 1 - k]
              }
          }
        `,
        rust: code`
          struct ProductOfNumbers {
              pre: Vec<i32>, // prefix products since the last zero
          }

          impl ProductOfNumbers {
              fn new() -> Self {
                  ProductOfNumbers { pre: vec![1] }
              }

              fn add(&mut self, num: i32) {
                  if num == 0 {
                      self.pre = vec![1];
                  } else {
                      let last = self.pre[self.pre.len() - 1];
                      self.pre.push(last * num);
                  }
              }

              fn getProduct(&mut self, k: i32) -> i32 {
                  let (n, k) = (self.pre.len(), k as usize);
                  if k >= n { return 0; } // the window reaches back to a zero
                  self.pre[n - 1] / self.pre[n - 1 - k]
              }
          }
        `,
        php: code`
          class ProductOfNumbers {
              private $pre = [1]; // prefix products since the last zero

              function __construct() {
              }

              function add($num) {
                  if ($num == 0) $this->pre = [1];
                  else $this->pre[] = $this->pre[count($this->pre) - 1] * $num;
              }

              function getProduct($k) {
                  $n = count($this->pre);
                  if ($k >= $n) return 0; // the window reaches back to a zero
                  return intdiv($this->pre[$n - 1], $this->pre[$n - 1 - $k]);
              }
          }
        `,
        ruby: code`
          class ProductOfNumbers
            def initialize
              @pre = [1] # prefix products since the last zero
            end

            def add(num)
              if num == 0
                @pre = [1]
              else
                @pre << @pre[-1] * num
              end
            end

            def getProduct(k)
              return 0 if k >= @pre.length # the window reaches back to a zero
              @pre[-1] / @pre[-1 - k]
            end
          end
        `,
      },
    };
  })(),

  // ── Design a Stack With Increment Operation (LC 1381) ─────────────
  (() => {
    const run: Run = (ops, args) => {
      let max = 0;
      const st: number[] = [];
      return ops.map((op, k) => {
        if (op === "CustomStack") { max = args[k][0]; st.length = 0; return null; }
        if (op === "push") { if (st.length < max) st.push(args[k][0]); return null; }
        if (op === "pop") return st.length ? (st.pop() as number) : -1;
        for (let i = 0; i < Math.min(args[k][0], st.length); i++) st[i] += args[k][1];
        return null;
      });
    };
    const make = (rng: Rng) => {
      const max = ri(rng, 1, pick(rng, [1, 3, 8, 1000]));
      const ops = ["CustomStack"], args: Args = [[max]];
      for (let m = ri(rng, 1, pick(rng, [3, 10, 25, 40])); m > 0; m--) {
        const r = rng();
        if (r < 0.45) { ops.push("push"); args.push([ri(rng, 1, rng() < 0.1 ? 1000 : 9)]); }
        else if (r < 0.75) { ops.push("pop"); args.push([]); }
        else { ops.push("increment"); args.push([ri(rng, 1, pick(rng, [1, 3, 10, 1000])), ri(rng, 0, rng() < 0.1 ? 100 : 9)]); }
      }
      return { ops, args };
    };
    const ex1: [string[], Args] = [
      ["CustomStack", "push", "push", "pop", "push", "push", "push", "increment", "increment", "pop", "pop", "pop", "pop"],
      [[3], [1], [2], [], [2], [3], [4], [5, 100], [2, 100], [], [], [], []],
    ];
    const ex2: [string[], Args] = [["CustomStack", "pop", "push", "increment", "pop"], [[1], [], [7], [4, 3], []]];
    return {
      slug: "design-a-stack-with-increment-operation",
      title: "Design a Stack With Increment Operation",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Stack", "Design", "Amazon"],
      signature: {
        funcName: "CustomStack", params: [{ name: "maxSize", type: "int" as const }], returns: "void" as const,
        methods: [
          { name: "push", params: [{ name: "x", type: "int" as const }], returns: "void" as const },
          { name: "pop", params: [], returns: "int" as const },
          { name: "increment", params: [{ name: "k", type: "int" as const }, { name: "value", type: "int" as const }], returns: "void" as const },
        ],
      },
      description: describe(
        "Design a stack with a capacity and one extra operation that adds to its bottom elements.\n\nWrite the class `CustomStack`:\n\n- `CustomStack(int maxSize)` creates an empty stack that can hold at most `maxSize` elements.\n- `void push(int x)` puts `x` on top of the stack, unless the stack already holds `maxSize` elements, in which case it does nothing.\n- `int pop()` removes the top element and returns it, or returns `-1` if the stack is empty.\n- `void increment(int k, int value)` adds `value` to each of the bottom `k` elements. If the stack holds fewer than `k` elements, it adds `value` to all of them.\n\n" + CALLS,
        [
          exampleOf(run, ex1[0], ex1[1], "The stack fills to [1,2,3] (bottom first) and the push of 4 is ignored. increment(5,100) touches all three: [101,102,103]; increment(2,100) touches the bottom two: [201,202,103]. The pops then return 103, 202, 201, and -1 once it is empty."),
          exampleOf(run, ex2[0], ex2[1], "Popping an empty stack gives -1. increment(4,3) reaches beyond the single element and simply adds 3 to it."),
        ],
        ["1 <= maxSize, x, k <= 1000", "0 <= value <= 100", "At most 1000 calls are made to each of push, pop and increment"]),
      hints: [
        "An array holds the stack. Adding `value` to the bottom `k` elements one by one is O(k) per increment — can you defer the work?",
        "Only `pop` ever reads an element. Record the increment at the topmost element it reaches, index `min(k, size) - 1`, in a parallel array `inc`.",
        "When popping index `i`, return `stack[i] + inc[i]` and pass `inc[i]` down to `inc[i - 1]`: everything below `i` received that increment too.",
      ],
      editorial: explain({
        idea: "Lazy increments: store each increment once, at the highest index it covers, and let it trickle down one element at a time as the stack is popped.",
        steps: [
          "Keep the stack in an array `st` and a parallel array `inc` of pending additions, both empty.",
          "`push(x)`: if there is room, append `x` to `st` and `0` to `inc`.",
          "`increment(k, value)`: if the stack is not empty, add `value` to `inc[min(k, size) - 1]`.",
          "`pop()`: if empty return -1. Otherwise for the top index `i`, the answer is `st[i] + inc[i]`; if `i > 0` add `inc[i]` to `inc[i - 1]`; remove both entries and return the answer.",
        ],
        why: "Invariant: the true value of element `j` is `st[j]` plus the sum of `inc[i]` over all `i >= j`. An increment of the bottom `m` elements adds to exactly the elements `j <= m - 1`, which is what putting it at `inc[m - 1]` does. Popping the top `i` reads its true value `st[i] + inc[i]` (nothing is above it), and moving `inc[i]` to `inc[i - 1]` keeps the sum for every element below unchanged.",
        time: "O(1) per call",
        space: "O(maxSize)",
        pitfalls: [
          "Forgetting to pass `inc[i]` down on pop loses the increment for the elements underneath.",
          "`increment` on an empty stack must do nothing — `min(k, 0) - 1` is -1.",
          "A push onto a full stack is ignored silently; it must not overwrite the top.",
        ],
      }),
      examples: [caseOf(run, ex1[0], ex1[1]), caseOf(run, ex2[0], ex2[1])],
      gen: (rng: Rng) => { const { ops, args } = make(rng); return caseOf(run, ops, args); },
      solutions: {
        python: code`
          class CustomStack:

              def __init__(self, maxSize: int):
                  self.max = maxSize
                  self.st = []
                  self.inc = []  # inc[i] is owed to st[i] and everything below it

              def push(self, x: int) -> None:
                  if len(self.st) < self.max:
                      self.st.append(x)
                      self.inc.append(0)

              def pop(self) -> int:
                  if not self.st:
                      return -1
                  add = self.inc.pop()
                  if self.inc:
                      self.inc[-1] += add  # pass the increment down
                  return self.st.pop() + add

              def increment(self, k: int, value: int) -> None:
                  i = min(k, len(self.st)) - 1
                  if i >= 0:
                      self.inc[i] += value
        `,
        javascript: code`
          var CustomStack = function(maxSize) {
              this.max = maxSize;
              this.st = [];
              this.inc = []; // inc[i] is owed to st[i] and everything below it
          };

          CustomStack.prototype.push = function(x) {
              if (this.st.length < this.max) { this.st.push(x); this.inc.push(0); }
          };

          CustomStack.prototype.pop = function() {
              if (this.st.length === 0) return -1;
              var add = this.inc.pop();
              if (this.inc.length) this.inc[this.inc.length - 1] += add; // pass the increment down
              return this.st.pop() + add;
          };

          CustomStack.prototype.increment = function(k, value) {
              var i = Math.min(k, this.st.length) - 1;
              if (i >= 0) this.inc[i] += value;
          };
        `,
        typescript: code`
          class CustomStack {
              max: number;
              st: number[];
              inc: number[];

              constructor(maxSize: number) {
                  this.max = maxSize;
                  this.st = [];
                  this.inc = []; // inc[i] is owed to st[i] and everything below it
              }

              push(x: number): void {
                  if (this.st.length < this.max) { this.st.push(x); this.inc.push(0); }
              }

              pop(): number {
                  if (this.st.length === 0) return -1;
                  var add = this.inc.pop();
                  if (this.inc.length) this.inc[this.inc.length - 1] += add; // pass the increment down
                  return this.st.pop() + add;
              }

              increment(k: number, value: number): void {
                  var i = Math.min(k, this.st.length) - 1;
                  if (i >= 0) this.inc[i] += value;
              }
          }
        `,
        java: code`
          class CustomStack {
              private int[] st, inc; // inc[i] is owed to st[i] and everything below it
              private int size = 0;

              public CustomStack(int maxSize) {
                  st = new int[maxSize];
                  inc = new int[maxSize];
              }

              public void push(int x) {
                  if (size < st.length) { st[size] = x; inc[size] = 0; size++; }
              }

              public int pop() {
                  if (size == 0) return -1;
                  int i = --size;
                  if (i > 0) inc[i - 1] += inc[i]; // pass the increment down
                  return st[i] + inc[i];
              }

              public void increment(int k, int value) {
                  int i = Math.min(k, size) - 1;
                  if (i >= 0) inc[i] += value;
              }
          }
        `,
        cpp: code`
          class CustomStack {
              vector<int> st, inc; // inc[i] is owed to st[i] and everything below it
              int maxSize;
          public:
              CustomStack(int maxSize) : maxSize(maxSize) {}

              void push(int x) {
                  if ((int)st.size() < maxSize) { st.push_back(x); inc.push_back(0); }
              }

              int pop() {
                  if (st.empty()) return -1;
                  int i = st.size() - 1;
                  int res = st[i] + inc[i];
                  if (i > 0) inc[i - 1] += inc[i]; // pass the increment down
                  st.pop_back();
                  inc.pop_back();
                  return res;
              }

              void increment(int k, int value) {
                  int i = min(k, (int)st.size()) - 1;
                  if (i >= 0) inc[i] += value;
              }
          };
        `,
        c: code`
          typedef struct {
              int* st;
              int* inc; /* inc[i] is owed to st[i] and everything below it */
              int size, max;
          } CustomStack;

          CustomStack* customStackCreate(int maxSize) {
              CustomStack* o = (CustomStack*)malloc(sizeof(CustomStack));
              o->st = (int*)malloc(maxSize * sizeof(int));
              o->inc = (int*)malloc(maxSize * sizeof(int));
              o->size = 0;
              o->max = maxSize;
              return o;
          }

          void customStackPush(CustomStack* obj, int x) {
              if (obj->size < obj->max) { obj->st[obj->size] = x; obj->inc[obj->size] = 0; obj->size++; }
          }

          int customStackPop(CustomStack* obj) {
              if (obj->size == 0) return -1;
              int i = --obj->size;
              if (i > 0) obj->inc[i - 1] += obj->inc[i]; /* pass the increment down */
              return obj->st[i] + obj->inc[i];
          }

          void customStackIncrement(CustomStack* obj, int k, int value) {
              int i = (k < obj->size ? k : obj->size) - 1;
              if (i >= 0) obj->inc[i] += value;
          }

          void customStackFree(CustomStack* obj) {
              free(obj->st);
              free(obj->inc);
              free(obj);
          }
        `,
        csharp: code`
          public class CustomStack {
              private int[] st, inc; // inc[i] is owed to st[i] and everything below it
              private int size = 0;

              public CustomStack(int maxSize) {
                  st = new int[maxSize];
                  inc = new int[maxSize];
              }

              public void Push(int x) {
                  if (size < st.Length) { st[size] = x; inc[size] = 0; size++; }
              }

              public int Pop() {
                  if (size == 0) return -1;
                  int i = --size;
                  if (i > 0) inc[i - 1] += inc[i]; // pass the increment down
                  return st[i] + inc[i];
              }

              public void Increment(int k, int value) {
                  int i = Math.Min(k, size) - 1;
                  if (i >= 0) inc[i] += value;
              }
          }
        `,
        go: code`
          type CustomStack struct {
          	st, inc []int // inc[i] is owed to st[i] and everything below it
          	max     int
          }

          func Constructor(maxSize int) CustomStack {
          	return CustomStack{max: maxSize}
          }

          func (this *CustomStack) Push(x int) {
          	if len(this.st) < this.max {
          		this.st = append(this.st, x)
          		this.inc = append(this.inc, 0)
          	}
          }

          func (this *CustomStack) Pop() int {
          	i := len(this.st) - 1
          	if i < 0 {
          		return -1
          	}
          	res := this.st[i] + this.inc[i]
          	if i > 0 {
          		this.inc[i-1] += this.inc[i] // pass the increment down
          	}
          	this.st, this.inc = this.st[:i], this.inc[:i]
          	return res
          }

          func (this *CustomStack) Increment(k int, value int) {
          	i := k
          	if len(this.st) < i {
          		i = len(this.st)
          	}
          	if i > 0 {
          		this.inc[i-1] += value
          	}
          }
        `,
        kotlin: code`
          class CustomStack(maxSize: Int) {
              private val st = IntArray(maxSize)
              private val inc = IntArray(maxSize) // inc[i] is owed to st[i] and everything below it
              private var size = 0

              fun push(x: Int) {
                  if (size < st.size) { st[size] = x; inc[size] = 0; size++ }
              }

              fun pop(): Int {
                  if (size == 0) return -1
                  val i = --size
                  if (i > 0) inc[i - 1] += inc[i] // pass the increment down
                  return st[i] + inc[i]
              }

              fun increment(k: Int, value: Int) {
                  val i = minOf(k, size) - 1
                  if (i >= 0) inc[i] += value
              }
          }
        `,
        swift: code`
          class CustomStack {
              var st: [Int] = []
              var inc: [Int] = [] // inc[i] is owed to st[i] and everything below it
              let maxSize: Int

              init(_ maxSize: Int) {
                  self.maxSize = maxSize
              }

              func push(_ x: Int) {
                  if st.count < maxSize { st.append(x); inc.append(0) }
              }

              func pop() -> Int {
                  if st.isEmpty { return -1 }
                  let i = st.count - 1
                  let res = st[i] + inc[i]
                  if i > 0 { inc[i - 1] += inc[i] } // pass the increment down
                  st.removeLast()
                  inc.removeLast()
                  return res
              }

              func increment(_ k: Int, _ value: Int) {
                  let i = min(k, st.count) - 1
                  if i >= 0 { inc[i] += value }
              }
          }
        `,
        rust: code`
          struct CustomStack {
              st: Vec<i32>,
              inc: Vec<i32>, // inc[i] is owed to st[i] and everything below it
              max: usize,
          }

          impl CustomStack {
              fn new(max_size: i32) -> Self {
                  CustomStack { st: Vec::new(), inc: Vec::new(), max: max_size as usize }
              }

              fn push(&mut self, x: i32) {
                  if self.st.len() < self.max { self.st.push(x); self.inc.push(0); }
              }

              fn pop(&mut self) -> i32 {
                  if self.st.is_empty() { return -1; }
                  let i = self.st.len() - 1;
                  let add = self.inc[i];
                  if i > 0 { self.inc[i - 1] += add; } // pass the increment down
                  self.inc.pop();
                  self.st.pop().unwrap() + add
              }

              fn increment(&mut self, k: i32, value: i32) {
                  let i = std::cmp::min(k as usize, self.st.len());
                  if i > 0 { self.inc[i - 1] += value; }
              }
          }
        `,
        php: code`
          class CustomStack {
              private $max;
              private $st = [];
              private $inc = []; // inc[i] is owed to st[i] and everything below it

              function __construct($maxSize) {
                  $this->max = $maxSize;
              }

              function push($x) {
                  if (count($this->st) < $this->max) { $this->st[] = $x; $this->inc[] = 0; }
              }

              function pop() {
                  $i = count($this->st) - 1;
                  if ($i < 0) return -1;
                  $add = array_pop($this->inc);
                  if ($i > 0) $this->inc[$i - 1] += $add; // pass the increment down
                  return array_pop($this->st) + $add;
              }

              function increment($k, $value) {
                  $i = min($k, count($this->st)) - 1;
                  if ($i >= 0) $this->inc[$i] += $value;
              }
          }
        `,
        ruby: code`
          class CustomStack
            def initialize(max_size)
              @max = max_size
              @st = []
              @inc = [] # inc[i] is owed to st[i] and everything below it
            end

            def push(x)
              if @st.length < @max
                @st << x
                @inc << 0
              end
            end

            def pop
              return -1 if @st.empty?
              add = @inc.pop
              @inc[-1] += add unless @inc.empty? # pass the increment down
              @st.pop + add
            end

            def increment(k, value)
              i = [k, @st.length].min - 1
              @inc[i] += value if i >= 0
            end
          end
        `,
      },
    };
  })(),

  // ── Design Browser History (LC 1472) ──────────────────────────────
  (() => {
    const run: Run = (ops, args) => {
      let hist: string[] = [];
      let cur = 0;
      return ops.map((op, k) => {
        if (op === "BrowserHistory") { hist = [args[k][0]]; cur = 0; return null; }
        if (op === "visit") { hist = hist.slice(0, cur + 1); hist.push(args[k][0]); cur++; return null; }
        if (op === "back") { for (let s = 0; s < args[k][0] && cur > 0; s++) cur--; return hist[cur]; }
        for (let s = 0; s < args[k][0] && cur < hist.length - 1; s++) cur++;
        return hist[cur];
      });
    };
    const url = (rng: Rng) => randLower(rng, 1, 6, "abcdeklmo") + pick(rng, ["", ".com", ".org", ".in"]);
    const make = (rng: Rng) => {
      const ops = ["BrowserHistory"], args: Args = [[url(rng)]];
      const big = pick(rng, [1, 3, 10, 100]);
      for (let m = ri(rng, 1, pick(rng, [3, 10, 25, 40])); m > 0; m--) {
        const r = rng();
        if (r < 0.45) { ops.push("visit"); args.push([url(rng)]); }
        else { ops.push(r < 0.75 ? "back" : "forward"); args.push([ri(rng, 1, big)]); }
      }
      return { ops, args };
    };
    const ex1: [string[], Args] = [
      ["BrowserHistory", "visit", "visit", "visit", "back", "back", "forward", "visit", "forward", "back", "back"],
      [["codekairo.com"], ["mail.com"], ["maps.com"], ["news.com"], [1], [1], [1], ["docs.com"], [2], [2], [7]],
    ];
    const ex2: [string[], Args] = [["BrowserHistory", "back", "forward", "visit", "back"], [["home"], [3], [3], ["a.in"], [100]]];
    return {
      slug: "design-browser-history",
      title: "Design Browser History",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Linked List", "Stack", "Design", "Amazon", "Google", "Microsoft", "Bloomberg"],
      signature: {
        funcName: "BrowserHistory", params: [{ name: "homepage", type: "string" as const }], returns: "void" as const,
        methods: [
          { name: "visit", params: [{ name: "url", type: "string" as const }], returns: "void" as const },
          { name: "back", params: [{ name: "steps", type: "int" as const }], returns: "string" as const },
          { name: "forward", params: [{ name: "steps", type: "int" as const }], returns: "string" as const },
        ],
      },
      description: describe(
        "Model a single browser tab: it starts on a home page, visits other pages, and can move back and forward through its history.\n\nWrite the class `BrowserHistory`:\n\n- `BrowserHistory(String homepage)` opens the tab on `homepage`.\n- `void visit(String url)` goes from the current page to `url`. This **erases all forward history**.\n- `String back(int steps)` moves back `steps` pages — or as far as the history allows, if fewer than `steps` pages lie behind — and returns the page it ends on.\n- `String forward(int steps)` moves forward `steps` pages — or as far as possible — and returns the page it ends on.\n\n" + CALLS,
        [
          exampleOf(run, ex1[0], ex1[1], "After three visits the history is codekairo.com, mail.com, maps.com, news.com. Two single steps back land on maps.com then mail.com, and one forward on maps.com. Visiting docs.com from there drops news.com, so forward(2) cannot move. back(2) reaches mail.com, and back(7) stops at the home page."),
          exampleOf(run, ex2[0], ex2[1], "With only the home page, neither back nor forward can move. After visiting a.in, back(100) returns to home."),
        ],
        ["1 <= homepage.length, url.length <= 20", "homepage and url consist of lowercase English letters and '.'", "1 <= steps <= 100", "At most 5000 calls are made to visit, back and forward"]),
      hints: [
        "The history is a line of pages with a cursor on the current one; back and forward just move the cursor.",
        "Keep the pages in an array with an index `cur` for the current page and an index `last` for the furthest page you can go forward to.",
        "`visit` writes the new page at `cur + 1` (overwriting whatever was there) and sets `last = cur`. `back` clamps `cur - steps` at 0, `forward` clamps `cur + steps` at `last` — both O(1).",
      ],
      editorial: explain({
        idea: "One array and two indices: `cur`, the page being shown, and `last`, the end of the forward history. Erasing the forward history is just moving `last` — the stale entries are overwritten later.",
        steps: [
          "Start with `pages = [homepage]`, `cur = last = 0`.",
          "`visit(url)`: `cur++`; write `url` at `pages[cur]` (append if the array is that short); set `last = cur`.",
          "`back(steps)`: `cur = max(0, cur - steps)`; return `pages[cur]`.",
          "`forward(steps)`: `cur = min(last, cur + steps)`; return `pages[cur]`.",
        ],
        why: "`pages[0..last]` is always exactly the tab's history and `cur` its position in it: a visit keeps the pages up to the current one, adds the new page right after it and makes it the end, which is what erasing the forward history means. Moving back or forward can never leave `[0, last]`, and clamping gives the \"as far as possible\" rule.",
        time: "O(1) per call (amortised for the array growth)",
        space: "O(number of visits)",
        pitfalls: [
          "Forgetting to reset `last` on a visit lets `forward` reach pages that were erased.",
          "Using `pages.length - 1` as the forward limit has the same bug when stale entries remain past `last`.",
          "Two stacks (back and forward) also work, but each step of `back`/`forward` is then O(1) per page moved, O(steps) per call.",
        ],
      }),
      examples: [caseOf(run, ex1[0], ex1[1]), caseOf(run, ex2[0], ex2[1])],
      gen: (rng: Rng) => { const { ops, args } = make(rng); return caseOf(run, ops, args); },
      solutions: {
        python: code`
          class BrowserHistory:

              def __init__(self, homepage: str):
                  self.pages = [homepage]
                  self.cur = 0
                  self.last = 0  # pages[0..last] is the history

              def visit(self, url: str) -> None:
                  self.cur += 1
                  if self.cur == len(self.pages):
                      self.pages.append(url)
                  else:
                      self.pages[self.cur] = url
                  self.last = self.cur  # erases the forward history

              def back(self, steps: int) -> str:
                  self.cur = max(0, self.cur - steps)
                  return self.pages[self.cur]

              def forward(self, steps: int) -> str:
                  self.cur = min(self.last, self.cur + steps)
                  return self.pages[self.cur]
        `,
        javascript: code`
          var BrowserHistory = function(homepage) {
              this.pages = [homepage];
              this.cur = 0;
              this.last = 0; // pages[0..last] is the history
          };

          BrowserHistory.prototype.visit = function(url) {
              this.pages[++this.cur] = url;
              this.last = this.cur; // erases the forward history
          };

          BrowserHistory.prototype.back = function(steps) {
              this.cur = Math.max(0, this.cur - steps);
              return this.pages[this.cur];
          };

          BrowserHistory.prototype.forward = function(steps) {
              this.cur = Math.min(this.last, this.cur + steps);
              return this.pages[this.cur];
          };
        `,
        typescript: code`
          class BrowserHistory {
              pages: string[];
              cur: number;
              last: number;

              constructor(homepage: string) {
                  this.pages = [homepage];
                  this.cur = 0;
                  this.last = 0; // pages[0..last] is the history
              }

              visit(url: string): void {
                  this.pages[++this.cur] = url;
                  this.last = this.cur; // erases the forward history
              }

              back(steps: number): string {
                  this.cur = Math.max(0, this.cur - steps);
                  return this.pages[this.cur];
              }

              forward(steps: number): string {
                  this.cur = Math.min(this.last, this.cur + steps);
                  return this.pages[this.cur];
              }
          }
        `,
        java: code`
          class BrowserHistory {
              private List<String> pages = new ArrayList<>();
              private int cur = 0, last = 0; // pages[0..last] is the history

              public BrowserHistory(String homepage) {
                  pages.add(homepage);
              }

              public void visit(String url) {
                  cur++;
                  if (cur == pages.size()) pages.add(url); else pages.set(cur, url);
                  last = cur; // erases the forward history
              }

              public String back(int steps) {
                  cur = Math.max(0, cur - steps);
                  return pages.get(cur);
              }

              public String forward(int steps) {
                  cur = Math.min(last, cur + steps);
                  return pages.get(cur);
              }
          }
        `,
        cpp: code`
          class BrowserHistory {
              vector<string> pages;
              int cur = 0, last = 0; // pages[0..last] is the history
          public:
              BrowserHistory(string homepage) : pages{homepage} {}

              void visit(string url) {
                  cur++;
                  if (cur == (int)pages.size()) pages.push_back(url); else pages[cur] = url;
                  last = cur; // erases the forward history
              }

              string back(int steps) {
                  cur = max(0, cur - steps);
                  return pages[cur];
              }

              string forward(int steps) {
                  cur = min(last, cur + steps);
                  return pages[cur];
              }
          };
        `,
        c: code`
          typedef struct {
              char** pages; /* pages[0..last] is the history */
              int size, cap, cur, last;
          } BrowserHistory;

          static char* bhDup(const char* s) {
              size_t len = strlen(s);
              char* d = (char*)malloc(len + 1);
              memcpy(d, s, len + 1);
              return d;
          }

          BrowserHistory* browserHistoryCreate(char* homepage) {
              BrowserHistory* o = (BrowserHistory*)malloc(sizeof(BrowserHistory));
              o->cap = 8;
              o->pages = (char**)malloc(8 * sizeof(char*));
              o->pages[0] = bhDup(homepage);
              o->size = 1;
              o->cur = o->last = 0;
              return o;
          }

          void browserHistoryVisit(BrowserHistory* obj, char* url) {
              obj->cur++;
              if (obj->cur == obj->size) {
                  if (obj->size == obj->cap) { obj->cap *= 2; obj->pages = (char**)realloc(obj->pages, obj->cap * sizeof(char*)); }
                  obj->size++;
              } else {
                  free(obj->pages[obj->cur]);
              }
              obj->pages[obj->cur] = bhDup(url);
              obj->last = obj->cur; /* erases the forward history */
          }

          char* browserHistoryBack(BrowserHistory* obj, int steps) {
              obj->cur = obj->cur - steps < 0 ? 0 : obj->cur - steps;
              return obj->pages[obj->cur];
          }

          char* browserHistoryForward(BrowserHistory* obj, int steps) {
              obj->cur = obj->cur + steps > obj->last ? obj->last : obj->cur + steps;
              return obj->pages[obj->cur];
          }

          void browserHistoryFree(BrowserHistory* obj) {
              for (int i = 0; i < obj->size; i++) free(obj->pages[i]);
              free(obj->pages);
              free(obj);
          }
        `,
        csharp: code`
          public class BrowserHistory {
              private List<string> pages = new List<string>();
              private int cur = 0, last = 0; // pages[0..last] is the history

              public BrowserHistory(string homepage) {
                  pages.Add(homepage);
              }

              public void Visit(string url) {
                  cur++;
                  if (cur == pages.Count) pages.Add(url); else pages[cur] = url;
                  last = cur; // erases the forward history
              }

              public string Back(int steps) {
                  cur = Math.Max(0, cur - steps);
                  return pages[cur];
              }

              public string Forward(int steps) {
                  cur = Math.Min(last, cur + steps);
                  return pages[cur];
              }
          }
        `,
        go: code`
          type BrowserHistory struct {
          	pages     []string // pages[0..last] is the history
          	cur, last int
          }

          func Constructor(homepage string) BrowserHistory {
          	return BrowserHistory{pages: []string{homepage}}
          }

          func (this *BrowserHistory) Visit(url string) {
          	this.cur++
          	if this.cur == len(this.pages) {
          		this.pages = append(this.pages, url)
          	} else {
          		this.pages[this.cur] = url
          	}
          	this.last = this.cur // erases the forward history
          }

          func (this *BrowserHistory) Back(steps int) string {
          	this.cur -= steps
          	if this.cur < 0 {
          		this.cur = 0
          	}
          	return this.pages[this.cur]
          }

          func (this *BrowserHistory) Forward(steps int) string {
          	this.cur += steps
          	if this.cur > this.last {
          		this.cur = this.last
          	}
          	return this.pages[this.cur]
          }
        `,
        kotlin: code`
          class BrowserHistory(homepage: String) {
              private val pages = arrayListOf(homepage)
              private var cur = 0
              private var last = 0 // pages[0..last] is the history

              fun visit(url: String) {
                  cur++
                  if (cur == pages.size) pages.add(url) else pages[cur] = url
                  last = cur // erases the forward history
              }

              fun back(steps: Int): String {
                  cur = maxOf(0, cur - steps)
                  return pages[cur]
              }

              fun forward(steps: Int): String {
                  cur = minOf(last, cur + steps)
                  return pages[cur]
              }
          }
        `,
        swift: code`
          class BrowserHistory {
              var pages: [String]
              var cur = 0, last = 0 // pages[0..last] is the history

              init(_ homepage: String) {
                  pages = [homepage]
              }

              func visit(_ url: String) {
                  cur += 1
                  if cur == pages.count { pages.append(url) } else { pages[cur] = url }
                  last = cur // erases the forward history
              }

              func back(_ steps: Int) -> String {
                  cur = max(0, cur - steps)
                  return pages[cur]
              }

              func forward(_ steps: Int) -> String {
                  cur = min(last, cur + steps)
                  return pages[cur]
              }
          }
        `,
        rust: code`
          struct BrowserHistory {
              pages: Vec<String>, // pages[0..=last] is the history
              cur: usize,
              last: usize,
          }

          impl BrowserHistory {
              fn new(homepage: String) -> Self {
                  BrowserHistory { pages: vec![homepage], cur: 0, last: 0 }
              }

              fn visit(&mut self, url: String) {
                  self.cur += 1;
                  if self.cur == self.pages.len() { self.pages.push(url); } else { self.pages[self.cur] = url; }
                  self.last = self.cur; // erases the forward history
              }

              fn back(&mut self, steps: i32) -> String {
                  let s = steps as usize;
                  self.cur = if s > self.cur { 0 } else { self.cur - s };
                  self.pages[self.cur].clone()
              }

              fn forward(&mut self, steps: i32) -> String {
                  self.cur = std::cmp::min(self.last, self.cur + steps as usize);
                  self.pages[self.cur].clone()
              }
          }
        `,
        php: code`
          class BrowserHistory {
              private $pages;
              private $cur = 0;
              private $last = 0; // pages[0..last] is the history

              function __construct($homepage) {
                  $this->pages = [$homepage];
              }

              function visit($url) {
                  $this->pages[++$this->cur] = $url;
                  $this->last = $this->cur; // erases the forward history
              }

              function back($steps) {
                  $this->cur = max(0, $this->cur - $steps);
                  return $this->pages[$this->cur];
              }

              function forward($steps) {
                  $this->cur = min($this->last, $this->cur + $steps);
                  return $this->pages[$this->cur];
              }
          }
        `,
        ruby: code`
          class BrowserHistory
            def initialize(homepage)
              @pages = [homepage]
              @cur = 0
              @last = 0 # pages[0..last] is the history
            end

            def visit(url)
              @cur += 1
              @pages[@cur] = url
              @last = @cur # erases the forward history
            end

            def back(steps)
              @cur = [0, @cur - steps].max
              @pages[@cur]
            end

            def forward(steps)
              @cur = [@last, @cur + steps].min
              @pages[@cur]
            end
          end
        `,
      },
    };
  })(),

  // ── Throne Inheritance (LC 1600) ──────────────────────────────────
  (() => {
    const run: Run = (ops, args) => {
      let king = "";
      const kids = new Map<string, string[]>();
      const dead = new Set<string>();
      const order = (p: string, out: string[]) => {
        if (!dead.has(p)) out.push(p);
        for (const c of kids.get(p) || []) order(c, out);
        return out;
      };
      return ops.map((op, k) => {
        if (op === "ThroneInheritance") { king = args[k][0]; return null; }
        if (op === "birth") { const p = args[k][0] as string; kids.set(p, [...(kids.get(p) || []), args[k][1]]); return null; }
        if (op === "death") { dead.add(args[k][0]); return null; }
        return order(king, []);
      });
    };
    const make = (rng: Rng) => {
      const used = new Set<string>();
      const fresh = () => { let s; do s = randLower(rng, 1, pick(rng, [3, 6, 10]), "abcdefghijklmnopqrstuvwxyz"); while (used.has(s)); used.add(s); return s; };
      const king = fresh();
      const alive = [king];
      const ops = ["ThroneInheritance"], args: Args = [[king]];
      for (let m = ri(rng, 1, pick(rng, [3, 10, 25, 40])); m > 0; m--) {
        const r = rng();
        if (r < 0.55 && alive.length) {
          const child = fresh();
          ops.push("birth"); args.push([pick(rng, alive), child]); alive.push(child);
        } else if (r < 0.72 && alive.length) {
          const i = ri(rng, 0, alive.length - 1);
          ops.push("death"); args.push([alive[i]]); alive.splice(i, 1);
        } else { ops.push("getInheritanceOrder"); args.push([]); }
      }
      if (ops[ops.length - 1] !== "getInheritanceOrder") { ops.push("getInheritanceOrder"); args.push([]); }
      return { ops, args };
    };
    const ex1: [string[], Args] = [
      ["ThroneInheritance", "birth", "birth", "birth", "birth", "birth", "birth", "getInheritanceOrder", "death", "getInheritanceOrder"],
      [["king"], ["king", "andy"], ["king", "bob"], ["king", "catherine"], ["andy", "matthew"], ["bob", "alex"], ["bob", "asha"], [], ["bob"], []],
    ];
    const ex2: [string[], Args] = [["ThroneInheritance", "death", "birth", "getInheritanceOrder"], [["elena"], ["elena"], ["elena", "noor"], []]];
    return {
      slug: "throne-inheritance",
      title: "Throne Inheritance",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "Tree", "Depth-First Search", "Design"],
      signature: {
        funcName: "ThroneInheritance", params: [{ name: "kingName", type: "string" as const }], returns: "void" as const,
        methods: [
          { name: "birth", params: [{ name: "parentName", type: "string" as const }, { name: "childName", type: "string" as const }], returns: "void" as const },
          { name: "death", params: [{ name: "name", type: "string" as const }], returns: "void" as const },
          { name: "getInheritanceOrder", params: [], returns: "string[]" as const },
        ],
      },
      description: describe(
        "A kingdom's line of succession lists the king first, then, for each of his children from oldest to youngest, that child followed by that child's whole line of succession — the same rule, applied again. A person who has died stays in the family tree (their descendants keep their place) but is left out of the list.\n\nWrite the class `ThroneInheritance`:\n\n- `ThroneInheritance(String kingName)` starts the family with the king.\n- `void birth(String parentName, String childName)` records that `childName` was born to `parentName`, as that parent's youngest child.\n- `void death(String name)` records that `name` has died.\n- `String[] getInheritanceOrder()` returns the current line of succession, living people only, in order.\n\n" + CALLS,
        [
          exampleOf(run, ex1[0], ex1[1], "The order walks king, then andy and his son matthew, then bob and his children alex and asha, then catherine. When bob dies he leaves the list, but his children keep their places after matthew."),
          exampleOf(run, ex2[0], ex2[1], "The king can die too; his child noor is then first in line."),
        ],
        ["1 <= kingName.length, parentName.length, childName.length, name.length <= 15", "All names consist of lowercase English letters", "All names are distinct: no childName repeats an earlier name", "Every parentName and name passed to death already belongs to the family", "In every call to birth, parentName is alive", "At most 10^5 calls are made to birth and death", "At most 10 calls are made to getInheritanceOrder"]),
      hints: [
        "The family is a tree: each person's children, in birth order. Keep a map from name to a list of children.",
        "The line of succession is exactly a pre-order traversal of that tree starting at the king, children visited oldest first.",
        "Deaths never change the tree — only who is printed. Keep a set of the dead and skip them during the traversal. (Use an explicit stack: the family can be a chain 10^5 people deep.)",
      ],
      editorial: explain({
        idea: "The succession rule is a pre-order walk of the family tree. Store the tree once, mark the dead in a set, and walk it when the order is asked for.",
        steps: [
          "Keep `children`: name → list of children in birth order, and a set `dead`.",
          "`birth(parent, child)`: append `child` to `children[parent]`. `death(name)`: add `name` to `dead`.",
          "`getInheritanceOrder()`: walk the tree from the king in pre-order with a stack — pop a person, output them unless dead, then push their children youngest first so the oldest comes off next.",
        ],
        why: "The statement's rule — a person, then each child's whole line in age order — is the definition of a pre-order traversal with children in birth order. A death removes a person from the output but not from the tree, so their subtree is still visited in its place, exactly as the rule requires.",
        time: "O(1) per birth and death, O(n) per getInheritanceOrder for n people ever born",
        space: "O(n)",
        pitfalls: [
          "Removing a dead person from the tree would orphan their descendants; only skip them when printing.",
          "Recursion on a chain of 10^5 people can overflow the call stack; an explicit stack avoids it.",
          "Children must be pushed youngest first so that the stack yields the oldest first.",
        ],
      }),
      examples: [caseOf(run, ex1[0], ex1[1]), caseOf(run, ex2[0], ex2[1])],
      gen: (rng: Rng) => { const { ops, args } = make(rng); return caseOf(run, ops, args); },
      solutions: {
        python: code`
          class ThroneInheritance:

              def __init__(self, kingName: str):
                  self.king = kingName
                  self.children = {}
                  self.dead = set()

              def birth(self, parentName: str, childName: str) -> None:
                  self.children.setdefault(parentName, []).append(childName)

              def death(self, name: str) -> None:
                  self.dead.add(name)

              def getInheritanceOrder(self) -> List[str]:
                  order, stack = [], [self.king]
                  while stack:  # pre-order walk, oldest child first
                      p = stack.pop()
                      if p not in self.dead:
                          order.append(p)
                      stack.extend(reversed(self.children.get(p, [])))
                  return order
        `,
        javascript: code`
          var ThroneInheritance = function(kingName) {
              this.king = kingName;
              this.children = new Map();
              this.dead = new Set();
          };

          ThroneInheritance.prototype.birth = function(parentName, childName) {
              if (!this.children.has(parentName)) this.children.set(parentName, []);
              this.children.get(parentName).push(childName);
          };

          ThroneInheritance.prototype.death = function(name) {
              this.dead.add(name);
          };

          ThroneInheritance.prototype.getInheritanceOrder = function() {
              var order = [], stack = [this.king];
              while (stack.length) { // pre-order walk, oldest child first
                  var p = stack.pop();
                  if (!this.dead.has(p)) order.push(p);
                  var c = this.children.get(p) || [];
                  for (var i = c.length - 1; i >= 0; i--) stack.push(c[i]);
              }
              return order;
          };
        `,
        typescript: code`
          class ThroneInheritance {
              king: string;
              children: { [name: string]: string[] };
              dead: { [name: string]: boolean };

              constructor(kingName: string) {
                  this.king = kingName;
                  this.children = Object.create(null);
                  this.dead = Object.create(null);
              }

              birth(parentName: string, childName: string): void {
                  if (!this.children[parentName]) this.children[parentName] = [];
                  this.children[parentName].push(childName);
              }

              death(name: string): void {
                  this.dead[name] = true;
              }

              getInheritanceOrder(): string[] {
                  var order: string[] = [], stack: string[] = [this.king];
                  while (stack.length) { // pre-order walk, oldest child first
                      var p = stack.pop();
                      if (!this.dead[p]) order.push(p);
                      var c = this.children[p] || [];
                      for (var i = c.length - 1; i >= 0; i--) stack.push(c[i]);
                  }
                  return order;
              }
          }
        `,
        java: code`
          class ThroneInheritance {
              private String king;
              private HashMap<String, List<String>> children = new HashMap<>();
              private HashSet<String> dead = new HashSet<>();

              public ThroneInheritance(String kingName) {
                  king = kingName;
              }

              public void birth(String parentName, String childName) {
                  children.computeIfAbsent(parentName, k -> new ArrayList<>()).add(childName);
              }

              public void death(String name) {
                  dead.add(name);
              }

              public String[] getInheritanceOrder() {
                  List<String> order = new ArrayList<>();
                  Deque<String> stack = new ArrayDeque<>();
                  stack.push(king);
                  while (!stack.isEmpty()) { // pre-order walk, oldest child first
                      String p = stack.pop();
                      if (!dead.contains(p)) order.add(p);
                      List<String> c = children.get(p);
                      if (c != null) for (int i = c.size() - 1; i >= 0; i--) stack.push(c.get(i));
                  }
                  return order.toArray(new String[0]);
              }
          }
        `,
        cpp: code`
          class ThroneInheritance {
              string king;
              unordered_map<string, vector<string>> children;
              unordered_set<string> dead;
          public:
              ThroneInheritance(string kingName) : king(kingName) {}

              void birth(string parentName, string childName) {
                  children[parentName].push_back(childName);
              }

              void death(string name) {
                  dead.insert(name);
              }

              vector<string> getInheritanceOrder() {
                  vector<string> order, stack{king};
                  while (!stack.empty()) { // pre-order walk, oldest child first
                      string p = stack.back();
                      stack.pop_back();
                      if (!dead.count(p)) order.push_back(p);
                      auto it = children.find(p);
                      if (it != children.end())
                          for (auto c = it->second.rbegin(); c != it->second.rend(); ++c) stack.push_back(*c);
                  }
                  return order;
              }
          };
        `,
        c: code`
          /* People are numbered in order of appearance; names are found by a linear
             search (C has no hash map), children kept as growable index lists. */
          typedef struct {
              char** name;
              bool* dead;
              int** kids;
              int* kidN;
              int* kidCap;
              int n, cap;
          } ThroneInheritance;

          static int tiAdd(ThroneInheritance* o, const char* s) {
              if (o->n == o->cap) {
                  o->cap *= 2;
                  o->name = (char**)realloc(o->name, o->cap * sizeof(char*));
                  o->dead = (bool*)realloc(o->dead, o->cap * sizeof(bool));
                  o->kids = (int**)realloc(o->kids, o->cap * sizeof(int*));
                  o->kidN = (int*)realloc(o->kidN, o->cap * sizeof(int));
                  o->kidCap = (int*)realloc(o->kidCap, o->cap * sizeof(int));
              }
              size_t len = strlen(s);
              o->name[o->n] = (char*)malloc(len + 1);
              memcpy(o->name[o->n], s, len + 1);
              o->dead[o->n] = false;
              o->kids[o->n] = NULL;
              o->kidN[o->n] = o->kidCap[o->n] = 0;
              return o->n++;
          }

          static int tiFind(ThroneInheritance* o, const char* s) {
              for (int i = 0; i < o->n; i++) if (strcmp(o->name[i], s) == 0) return i;
              return -1;
          }

          ThroneInheritance* throneInheritanceCreate(char* kingName) {
              ThroneInheritance* o = (ThroneInheritance*)malloc(sizeof(ThroneInheritance));
              o->n = 0;
              o->cap = 8;
              o->name = (char**)malloc(8 * sizeof(char*));
              o->dead = (bool*)malloc(8 * sizeof(bool));
              o->kids = (int**)malloc(8 * sizeof(int*));
              o->kidN = (int*)malloc(8 * sizeof(int));
              o->kidCap = (int*)malloc(8 * sizeof(int));
              tiAdd(o, kingName);
              return o;
          }

          void throneInheritanceBirth(ThroneInheritance* obj, char* parentName, char* childName) {
              int p = tiFind(obj, parentName);
              int c = tiAdd(obj, childName);
              if (obj->kidN[p] == obj->kidCap[p]) {
                  obj->kidCap[p] = obj->kidCap[p] ? 2 * obj->kidCap[p] : 2;
                  obj->kids[p] = (int*)realloc(obj->kids[p], obj->kidCap[p] * sizeof(int));
              }
              obj->kids[p][obj->kidN[p]++] = c;
          }

          void throneInheritanceDeath(ThroneInheritance* obj, char* name) {
              obj->dead[tiFind(obj, name)] = true;
          }

          char** throneInheritanceGetInheritanceOrder(ThroneInheritance* obj, int* returnSize) {
              char** order = (char**)malloc((obj->n + 1) * sizeof(char*));
              int* stack = (int*)malloc((obj->n + 1) * sizeof(int));
              int top = 0, m = 0;
              stack[top++] = 0;
              while (top > 0) { /* pre-order walk, oldest child first */
                  int p = stack[--top];
                  if (!obj->dead[p]) order[m++] = obj->name[p];
                  for (int i = obj->kidN[p] - 1; i >= 0; i--) stack[top++] = obj->kids[p][i];
              }
              free(stack);
              *returnSize = m;
              return order;
          }

          void throneInheritanceFree(ThroneInheritance* obj) {
              for (int i = 0; i < obj->n; i++) { free(obj->name[i]); free(obj->kids[i]); }
              free(obj->name); free(obj->dead); free(obj->kids); free(obj->kidN); free(obj->kidCap);
              free(obj);
          }
        `,
        csharp: code`
          public class ThroneInheritance {
              private string king;
              private Dictionary<string, List<string>> children = new Dictionary<string, List<string>>();
              private HashSet<string> dead = new HashSet<string>();

              public ThroneInheritance(string kingName) {
                  king = kingName;
              }

              public void Birth(string parentName, string childName) {
                  if (!children.ContainsKey(parentName)) children[parentName] = new List<string>();
                  children[parentName].Add(childName);
              }

              public void Death(string name) {
                  dead.Add(name);
              }

              public string[] GetInheritanceOrder() {
                  var order = new List<string>();
                  var stack = new Stack<string>();
                  stack.Push(king);
                  while (stack.Count > 0) { // pre-order walk, oldest child first
                      string p = stack.Pop();
                      if (!dead.Contains(p)) order.Add(p);
                      List<string> c;
                      if (children.TryGetValue(p, out c)) for (int i = c.Count - 1; i >= 0; i--) stack.Push(c[i]);
                  }
                  return order.ToArray();
              }
          }
        `,
        go: code`
          type ThroneInheritance struct {
          	king     string
          	children map[string][]string
          	dead     map[string]bool
          }

          func Constructor(kingName string) ThroneInheritance {
          	return ThroneInheritance{king: kingName, children: map[string][]string{}, dead: map[string]bool{}}
          }

          func (this *ThroneInheritance) Birth(parentName string, childName string) {
          	this.children[parentName] = append(this.children[parentName], childName)
          }

          func (this *ThroneInheritance) Death(name string) {
          	this.dead[name] = true
          }

          func (this *ThroneInheritance) GetInheritanceOrder() []string {
          	order := []string{}
          	stack := []string{this.king}
          	for len(stack) > 0 { // pre-order walk, oldest child first
          		p := stack[len(stack)-1]
          		stack = stack[:len(stack)-1]
          		if !this.dead[p] {
          			order = append(order, p)
          		}
          		c := this.children[p]
          		for i := len(c) - 1; i >= 0; i-- {
          			stack = append(stack, c[i])
          		}
          	}
          	return order
          }
        `,
        kotlin: code`
          class ThroneInheritance(kingName: String) {
              private val king = kingName
              private val children = HashMap<String, MutableList<String>>()
              private val dead = HashSet<String>()

              fun birth(parentName: String, childName: String) {
                  children.getOrPut(parentName) { ArrayList<String>() }.add(childName)
              }

              fun death(name: String) {
                  dead.add(name)
              }

              fun getInheritanceOrder(): Array<String> {
                  val order = ArrayList<String>()
                  val stack = java.util.ArrayDeque<String>()
                  stack.push(king)
                  while (stack.isNotEmpty()) { // pre-order walk, oldest child first
                      val p = stack.pop()
                      if (p !in dead) order.add(p)
                      val c = children[p] ?: continue
                      for (i in c.size - 1 downTo 0) stack.push(c[i])
                  }
                  return order.toTypedArray()
              }
          }
        `,
        swift: code`
          class ThroneInheritance {
              var king: String
              var children: [String: [String]] = [:]
              var dead = Set<String>()

              init(_ kingName: String) {
                  king = kingName
              }

              func birth(_ parentName: String, _ childName: String) {
                  children[parentName, default: []].append(childName)
              }

              func death(_ name: String) {
                  dead.insert(name)
              }

              func getInheritanceOrder() -> [String] {
                  var order: [String] = []
                  var stack = [king]
                  while let p = stack.popLast() { // pre-order walk, oldest child first
                      if !dead.contains(p) { order.append(p) }
                      if let c = children[p] { stack.append(contentsOf: c.reversed()) }
                  }
                  return order
              }
          }
        `,
        rust: code`
          use std::collections::{HashMap, HashSet};

          struct ThroneInheritance {
              king: String,
              children: HashMap<String, Vec<String>>,
              dead: HashSet<String>,
          }

          impl ThroneInheritance {
              fn new(king_name: String) -> Self {
                  ThroneInheritance { king: king_name, children: HashMap::new(), dead: HashSet::new() }
              }

              fn birth(&mut self, parent_name: String, child_name: String) {
                  self.children.entry(parent_name).or_insert_with(Vec::new).push(child_name);
              }

              fn death(&mut self, name: String) {
                  self.dead.insert(name);
              }

              fn getInheritanceOrder(&mut self) -> Vec<String> {
                  let mut order: Vec<String> = Vec::new();
                  let mut stack: Vec<&String> = vec![&self.king];
                  while let Some(p) = stack.pop() { // pre-order walk, oldest child first
                      if !self.dead.contains(p) { order.push(p.clone()); }
                      if let Some(c) = self.children.get(p) {
                          for child in c.iter().rev() { stack.push(child); }
                      }
                  }
                  order
              }
          }
        `,
        php: code`
          class ThroneInheritance {
              private $king;
              private $children = [];
              private $dead = [];

              function __construct($kingName) {
                  $this->king = $kingName;
              }

              function birth($parentName, $childName) {
                  $this->children[$parentName][] = $childName;
              }

              function death($name) {
                  $this->dead[$name] = true;
              }

              function getInheritanceOrder() {
                  $order = [];
                  $stack = [$this->king];
                  while ($stack) { // pre-order walk, oldest child first
                      $p = array_pop($stack);
                      if (!isset($this->dead[$p])) $order[] = $p;
                      if (isset($this->children[$p])) {
                          $c = $this->children[$p];
                          for ($i = count($c) - 1; $i >= 0; $i--) $stack[] = $c[$i];
                      }
                  }
                  return $order;
              }
          }
        `,
        ruby: code`
          require 'set'

          class ThroneInheritance
            def initialize(king_name)
              @king = king_name
              @children = Hash.new { |h, k| h[k] = [] }
              @dead = Set.new
            end

            def birth(parent_name, child_name)
              @children[parent_name] << child_name
            end

            def death(name)
              @dead << name
            end

            def getInheritanceOrder
              order = []
              stack = [@king]
              until stack.empty? # pre-order walk, oldest child first
                p = stack.pop
                order << p unless @dead.include?(p)
                stack.concat(@children[p].reverse) if @children.key?(p)
              end
              order
            end
          end
        `,
      },
    };
  })(),

  // ── Design Front Middle Back Queue (LC 1670) ──────────────────────
  (() => {
    const run: Run = (ops, args) => {
      const q: number[] = [];
      return ops.map((op, k) => {
        if (op === "FrontMiddleBackQueue") return null;
        if (op === "pushFront") { q.unshift(args[k][0]); return null; }
        if (op === "pushMiddle") { q.splice(q.length >> 1, 0, args[k][0]); return null; }
        if (op === "pushBack") { q.push(args[k][0]); return null; }
        if (q.length === 0) return -1;
        if (op === "popFront") return q.shift() as number;
        if (op === "popMiddle") return q.splice((q.length - 1) >> 1, 1)[0];
        return q.pop() as number;
      });
    };
    const OPS = ["pushFront", "pushMiddle", "pushBack", "popFront", "popMiddle", "popBack"];
    const make = (rng: Rng) => {
      const ops = ["FrontMiddleBackQueue"], args: Args = [[]];
      const pushBias = pick(rng, [0.4, 0.55, 0.7]);
      for (let m = ri(rng, 1, pick(rng, [3, 10, 25, 40])); m > 0; m--) {
        const op = rng() < pushBias ? OPS[ri(rng, 0, 2)] : OPS[ri(rng, 3, 5)];
        ops.push(op);
        args.push(op.startsWith("push") ? [rng() < 0.1 ? ri(rng, 1, 1000000000) : ri(rng, 1, 99)] : []);
      }
      return { ops, args };
    };
    const ex1: [string[], Args] = [
      ["FrontMiddleBackQueue", "pushFront", "pushBack", "pushMiddle", "pushMiddle", "popFront", "popMiddle", "popMiddle", "popBack", "popFront"],
      [[], [1], [2], [3], [4], [], [], [], [], []],
    ];
    const ex2: [string[], Args] = [
      ["FrontMiddleBackQueue", "pushBack", "pushBack", "pushBack", "pushBack", "pushBack", "pushMiddle", "popMiddle", "popMiddle"],
      [[], [10], [20], [30], [40], [50], [60], [], []],
    ];
    return {
      slug: "design-front-middle-back-queue",
      title: "Design Front Middle Back Queue",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Linked List", "Design", "Queue"],
      signature: {
        funcName: "FrontMiddleBackQueue", params: [], returns: "void" as const,
        methods: [
          { name: "pushFront", params: [{ name: "value", type: "int" as const }], returns: "void" as const },
          { name: "pushMiddle", params: [{ name: "value", type: "int" as const }], returns: "void" as const },
          { name: "pushBack", params: [{ name: "value", type: "int" as const }], returns: "void" as const },
          { name: "popFront", params: [], returns: "int" as const },
          { name: "popMiddle", params: [], returns: "int" as const },
          { name: "popBack", params: [], returns: "int" as const },
        ],
      },
      description: describe(
        "Design a queue that can add and remove elements at the front, the back **and the middle**.\n\nWrite the class `FrontMiddleBackQueue`:\n\n- `FrontMiddleBackQueue()` creates an empty queue.\n- `void pushFront(int value)`, `void pushMiddle(int value)` and `void pushBack(int value)` insert `value` at the front, the middle and the back.\n- `int popFront()`, `int popMiddle()` and `int popBack()` remove the element at the front, the middle and the back and return it, or return `-1` if the queue is empty.\n\nWhen there are two middle positions, the operation uses the **one nearer the front**. For example, `pushMiddle(6)` on `[1,2,3,4,5]` gives `[1,2,6,3,4,5]`, and `popMiddle()` on `[1,2,6,3,4,5]` removes and returns `6`.\n\n" + CALLS,
        [
          exampleOf(run, ex1[0], ex1[1], "The queue becomes [1], [1,2], [1,3,2], then [1,4,3,2]. popFront takes 1 leaving [4,3,2]; popMiddle takes the middle 3; on [4,2] the front middle is 4; popBack takes 2, and the empty queue gives -1."),
          exampleOf(run, ex2[0], ex2[1], "[10,20,30,40,50] has one middle position for an insertion, before 30: [10,20,60,30,40,50]. popMiddle on six elements takes the front middle, 60, and on five elements the true middle, 30."),
        ],
        ["1 <= value <= 10^9", "At most 1000 calls are made to the six methods in total"]),
      hints: [
        "With one array the middle operations shift half the elements every time. Can you keep the middle at an end of something?",
        "Split the queue into a front half and a back half, each a deque, and keep the back half equal in size to the front half or one larger.",
        "Then the front middle for popping is the last of the front half when the halves are equal, and the first of the back half otherwise; inserting in the middle goes to the front of the back half when equal, the back of the front half otherwise. After any front/back operation, move one element across to restore the balance.",
      ],
      editorial: explain({
        idea: "Keep two deques, `left` and `right`, whose concatenation is the queue, with `len(left) <= len(right) <= len(left) + 1`. The middle is then always at the seam, so every operation touches only deque ends.",
        steps: [
          "`rebalance()`: if `left` is longer than `right`, move the last of `left` to the front of `right`; if `right` is two longer than `left`, move the first of `right` to the back of `left`.",
          "`pushFront`: add to the front of `left`, rebalance. `pushBack`: add to the back of `right`, rebalance.",
          "`pushMiddle`: if the halves are equal, add to the front of `right`; otherwise add to the back of `left`.",
          "Pops on an empty queue (`right` empty) return -1. `popFront`: take the front of `left`, or of `right` if `left` is empty, then rebalance. `popBack`: take the back of `right`, rebalance.",
          "`popMiddle`: if the halves are equal take the back of `left`, otherwise the front of `right`.",
        ],
        why: "For a queue of size `n`, insertion in the middle means position `floor(n/2)` and removal means index `floor((n-1)/2)`. With the invariant, `left` holds exactly the first `floor(n/2)` elements, so position `floor(n/2)` is the seam: the front of `right` when `n` is even, the back of `left` when odd keeps the sizes legal. Index `floor((n-1)/2)` is the last of `left` when `n` is even and the first of `right` when it is odd. Each operation changes the sizes by one, and one move across restores the invariant.",
        time: "O(1) per call",
        space: "O(n)",
        pitfalls: [
          "Off by one in the middle rules: insertion goes to index `n/2`, removal takes index `(n-1)/2`, both rounded down.",
          "With one element it sits in `right`; `popFront` must look there when `left` is empty.",
          "A plain list with insert/remove at the middle also passes 1000 calls, at O(n) each.",
        ],
      }),
      examples: [caseOf(run, ex1[0], ex1[1]), caseOf(run, ex2[0], ex2[1])],
      gen: (rng: Rng) => { const { ops, args } = make(rng); return caseOf(run, ops, args); },
      solutions: {
        python: code`
          from collections import deque

          class FrontMiddleBackQueue:

              def __init__(self):
                  self.left = deque()   # invariant: len(left) <= len(right) <= len(left) + 1
                  self.right = deque()

              def _balance(self):
                  if len(self.left) > len(self.right):
                      self.right.appendleft(self.left.pop())
                  elif len(self.right) > len(self.left) + 1:
                      self.left.append(self.right.popleft())

              def pushFront(self, value: int) -> None:
                  self.left.appendleft(value)
                  self._balance()

              def pushMiddle(self, value: int) -> None:
                  if len(self.left) == len(self.right):
                      self.right.appendleft(value)
                  else:
                      self.left.append(value)

              def pushBack(self, value: int) -> None:
                  self.right.append(value)
                  self._balance()

              def popFront(self) -> int:
                  if not self.right:
                      return -1
                  x = self.left.popleft() if self.left else self.right.popleft()
                  self._balance()
                  return x

              def popMiddle(self) -> int:
                  if not self.right:
                      return -1
                  if len(self.left) == len(self.right):
                      return self.left.pop()
                  return self.right.popleft()

              def popBack(self) -> int:
                  if not self.right:
                      return -1
                  x = self.right.pop()
                  self._balance()
                  return x
        `,
        javascript: code`
          var FrontMiddleBackQueue = function() {
              this.left = [];  // invariant: left.length <= right.length <= left.length + 1
              this.right = [];
          };

          FrontMiddleBackQueue.prototype.balance = function() {
              if (this.left.length > this.right.length) this.right.unshift(this.left.pop());
              else if (this.right.length > this.left.length + 1) this.left.push(this.right.shift());
          };

          FrontMiddleBackQueue.prototype.pushFront = function(value) {
              this.left.unshift(value);
              this.balance();
          };

          FrontMiddleBackQueue.prototype.pushMiddle = function(value) {
              if (this.left.length === this.right.length) this.right.unshift(value);
              else this.left.push(value);
          };

          FrontMiddleBackQueue.prototype.pushBack = function(value) {
              this.right.push(value);
              this.balance();
          };

          FrontMiddleBackQueue.prototype.popFront = function() {
              if (this.right.length === 0) return -1;
              var x = this.left.length ? this.left.shift() : this.right.shift();
              this.balance();
              return x;
          };

          FrontMiddleBackQueue.prototype.popMiddle = function() {
              if (this.right.length === 0) return -1;
              return this.left.length === this.right.length ? this.left.pop() : this.right.shift();
          };

          FrontMiddleBackQueue.prototype.popBack = function() {
              if (this.right.length === 0) return -1;
              var x = this.right.pop();
              this.balance();
              return x;
          };
        `,
        typescript: code`
          class FrontMiddleBackQueue {
              left: number[];
              right: number[];

              constructor() {
                  this.left = [];  // invariant: left.length <= right.length <= left.length + 1
                  this.right = [];
              }

              balance(): void {
                  if (this.left.length > this.right.length) this.right.unshift(this.left.pop());
                  else if (this.right.length > this.left.length + 1) this.left.push(this.right.shift());
              }

              pushFront(value: number): void {
                  this.left.unshift(value);
                  this.balance();
              }

              pushMiddle(value: number): void {
                  if (this.left.length === this.right.length) this.right.unshift(value);
                  else this.left.push(value);
              }

              pushBack(value: number): void {
                  this.right.push(value);
                  this.balance();
              }

              popFront(): number {
                  if (this.right.length === 0) return -1;
                  var x = this.left.length ? this.left.shift() : this.right.shift();
                  this.balance();
                  return x;
              }

              popMiddle(): number {
                  if (this.right.length === 0) return -1;
                  return this.left.length === this.right.length ? this.left.pop() : this.right.shift();
              }

              popBack(): number {
                  if (this.right.length === 0) return -1;
                  var x = this.right.pop();
                  this.balance();
                  return x;
              }
          }
        `,
        java: code`
          class FrontMiddleBackQueue {
              // invariant: left.size() <= right.size() <= left.size() + 1
              private Deque<Integer> left = new ArrayDeque<>(), right = new ArrayDeque<>();

              public FrontMiddleBackQueue() {
              }

              private void balance() {
                  if (left.size() > right.size()) right.addFirst(left.pollLast());
                  else if (right.size() > left.size() + 1) left.addLast(right.pollFirst());
              }

              public void pushFront(int value) {
                  left.addFirst(value);
                  balance();
              }

              public void pushMiddle(int value) {
                  if (left.size() == right.size()) right.addFirst(value); else left.addLast(value);
              }

              public void pushBack(int value) {
                  right.addLast(value);
                  balance();
              }

              public int popFront() {
                  if (right.isEmpty()) return -1;
                  int x = left.isEmpty() ? right.pollFirst() : left.pollFirst();
                  balance();
                  return x;
              }

              public int popMiddle() {
                  if (right.isEmpty()) return -1;
                  return left.size() == right.size() ? left.pollLast() : right.pollFirst();
              }

              public int popBack() {
                  if (right.isEmpty()) return -1;
                  int x = right.pollLast();
                  balance();
                  return x;
              }
          }
        `,
        cpp: code`
          class FrontMiddleBackQueue {
              deque<int> left, right; // invariant: left.size() <= right.size() <= left.size() + 1

              void balance() {
                  if (left.size() > right.size()) { right.push_front(left.back()); left.pop_back(); }
                  else if (right.size() > left.size() + 1) { left.push_back(right.front()); right.pop_front(); }
              }
          public:
              FrontMiddleBackQueue() {}

              void pushFront(int value) {
                  left.push_front(value);
                  balance();
              }

              void pushMiddle(int value) {
                  if (left.size() == right.size()) right.push_front(value); else left.push_back(value);
              }

              void pushBack(int value) {
                  right.push_back(value);
                  balance();
              }

              int popFront() {
                  if (right.empty()) return -1;
                  int x;
                  if (left.empty()) { x = right.front(); right.pop_front(); }
                  else { x = left.front(); left.pop_front(); }
                  balance();
                  return x;
              }

              int popMiddle() {
                  if (right.empty()) return -1;
                  int x;
                  if (left.size() == right.size()) { x = left.back(); left.pop_back(); }
                  else { x = right.front(); right.pop_front(); }
                  return x;
              }

              int popBack() {
                  if (right.empty()) return -1;
                  int x = right.back();
                  right.pop_back();
                  balance();
                  return x;
              }
          };
        `,
        c: code`
          /* Two circular deques; at most 1000 calls means at most 1000 elements in all. */
          #define FMB_CAP 1024

          typedef struct { int buf[FMB_CAP]; int head, size; } FmbDeque;

          typedef struct {
              FmbDeque left, right; /* invariant: left.size <= right.size <= left.size + 1 */
          } FrontMiddleBackQueue;

          static void dqPushFront(FmbDeque* d, int x) { d->head = (d->head + FMB_CAP - 1) % FMB_CAP; d->buf[d->head] = x; d->size++; }
          static void dqPushBack(FmbDeque* d, int x) { d->buf[(d->head + d->size) % FMB_CAP] = x; d->size++; }
          static int dqPopFront(FmbDeque* d) { int x = d->buf[d->head]; d->head = (d->head + 1) % FMB_CAP; d->size--; return x; }
          static int dqPopBack(FmbDeque* d) { d->size--; return d->buf[(d->head + d->size) % FMB_CAP]; }

          static void fmbBalance(FrontMiddleBackQueue* q) {
              if (q->left.size > q->right.size) dqPushFront(&q->right, dqPopBack(&q->left));
              else if (q->right.size > q->left.size + 1) dqPushBack(&q->left, dqPopFront(&q->right));
          }

          FrontMiddleBackQueue* frontMiddleBackQueueCreate() {
              FrontMiddleBackQueue* q = (FrontMiddleBackQueue*)malloc(sizeof(FrontMiddleBackQueue));
              q->left.head = q->left.size = 0;
              q->right.head = q->right.size = 0;
              return q;
          }

          void frontMiddleBackQueuePushFront(FrontMiddleBackQueue* obj, int value) {
              dqPushFront(&obj->left, value);
              fmbBalance(obj);
          }

          void frontMiddleBackQueuePushMiddle(FrontMiddleBackQueue* obj, int value) {
              if (obj->left.size == obj->right.size) dqPushFront(&obj->right, value);
              else dqPushBack(&obj->left, value);
          }

          void frontMiddleBackQueuePushBack(FrontMiddleBackQueue* obj, int value) {
              dqPushBack(&obj->right, value);
              fmbBalance(obj);
          }

          int frontMiddleBackQueuePopFront(FrontMiddleBackQueue* obj) {
              if (obj->right.size == 0) return -1;
              int x = obj->left.size ? dqPopFront(&obj->left) : dqPopFront(&obj->right);
              fmbBalance(obj);
              return x;
          }

          int frontMiddleBackQueuePopMiddle(FrontMiddleBackQueue* obj) {
              if (obj->right.size == 0) return -1;
              return obj->left.size == obj->right.size ? dqPopBack(&obj->left) : dqPopFront(&obj->right);
          }

          int frontMiddleBackQueuePopBack(FrontMiddleBackQueue* obj) {
              if (obj->right.size == 0) return -1;
              int x = dqPopBack(&obj->right);
              fmbBalance(obj);
              return x;
          }

          void frontMiddleBackQueueFree(FrontMiddleBackQueue* obj) {
              free(obj);
          }
        `,
        csharp: code`
          public class FrontMiddleBackQueue {
              // invariant: left.Count <= right.Count <= left.Count + 1
              private LinkedList<int> left = new LinkedList<int>(), right = new LinkedList<int>();

              public FrontMiddleBackQueue() {
              }

              private void Balance() {
                  if (left.Count > right.Count) { right.AddFirst(left.Last.Value); left.RemoveLast(); }
                  else if (right.Count > left.Count + 1) { left.AddLast(right.First.Value); right.RemoveFirst(); }
              }

              public void PushFront(int value) {
                  left.AddFirst(value);
                  Balance();
              }

              public void PushMiddle(int value) {
                  if (left.Count == right.Count) right.AddFirst(value); else left.AddLast(value);
              }

              public void PushBack(int value) {
                  right.AddLast(value);
                  Balance();
              }

              public int PopFront() {
                  if (right.Count == 0) return -1;
                  var from = left.Count > 0 ? left : right;
                  int x = from.First.Value;
                  from.RemoveFirst();
                  Balance();
                  return x;
              }

              public int PopMiddle() {
                  if (right.Count == 0) return -1;
                  int x;
                  if (left.Count == right.Count) { x = left.Last.Value; left.RemoveLast(); }
                  else { x = right.First.Value; right.RemoveFirst(); }
                  return x;
              }

              public int PopBack() {
                  if (right.Count == 0) return -1;
                  int x = right.Last.Value;
                  right.RemoveLast();
                  Balance();
                  return x;
              }
          }
        `,
        go: code`
          type FrontMiddleBackQueue struct {
          	left, right []int // invariant: len(left) <= len(right) <= len(left)+1
          }

          func Constructor() FrontMiddleBackQueue {
          	return FrontMiddleBackQueue{}
          }

          func (this *FrontMiddleBackQueue) balance() {
          	if len(this.left) > len(this.right) {
          		x := this.left[len(this.left)-1]
          		this.left = this.left[:len(this.left)-1]
          		this.right = append([]int{x}, this.right...)
          	} else if len(this.right) > len(this.left)+1 {
          		this.left = append(this.left, this.right[0])
          		this.right = this.right[1:]
          	}
          }

          func (this *FrontMiddleBackQueue) PushFront(value int) {
          	this.left = append([]int{value}, this.left...)
          	this.balance()
          }

          func (this *FrontMiddleBackQueue) PushMiddle(value int) {
          	if len(this.left) == len(this.right) {
          		this.right = append([]int{value}, this.right...)
          	} else {
          		this.left = append(this.left, value)
          	}
          }

          func (this *FrontMiddleBackQueue) PushBack(value int) {
          	this.right = append(this.right, value)
          	this.balance()
          }

          func (this *FrontMiddleBackQueue) PopFront() int {
          	if len(this.right) == 0 {
          		return -1
          	}
          	var x int
          	if len(this.left) > 0 {
          		x, this.left = this.left[0], this.left[1:]
          	} else {
          		x, this.right = this.right[0], this.right[1:]
          	}
          	this.balance()
          	return x
          }

          func (this *FrontMiddleBackQueue) PopMiddle() int {
          	if len(this.right) == 0 {
          		return -1
          	}
          	if len(this.left) == len(this.right) {
          		x := this.left[len(this.left)-1]
          		this.left = this.left[:len(this.left)-1]
          		return x
          	}
          	x := this.right[0]
          	this.right = this.right[1:]
          	return x
          }

          func (this *FrontMiddleBackQueue) PopBack() int {
          	if len(this.right) == 0 {
          		return -1
          	}
          	x := this.right[len(this.right)-1]
          	this.right = this.right[:len(this.right)-1]
          	this.balance()
          	return x
          }
        `,
        kotlin: code`
          class FrontMiddleBackQueue() {
              // invariant: left.size <= right.size <= left.size + 1
              private val left = java.util.ArrayDeque<Int>()
              private val right = java.util.ArrayDeque<Int>()

              private fun balance() {
                  if (left.size > right.size) right.addFirst(left.pollLast())
                  else if (right.size > left.size + 1) left.addLast(right.pollFirst())
              }

              fun pushFront(value: Int) {
                  left.addFirst(value)
                  balance()
              }

              fun pushMiddle(value: Int) {
                  if (left.size == right.size) right.addFirst(value) else left.addLast(value)
              }

              fun pushBack(value: Int) {
                  right.addLast(value)
                  balance()
              }

              fun popFront(): Int {
                  if (right.isEmpty()) return -1
                  val x = if (left.isEmpty()) right.pollFirst() else left.pollFirst()
                  balance()
                  return x
              }

              fun popMiddle(): Int {
                  if (right.isEmpty()) return -1
                  return if (left.size == right.size) left.pollLast() else right.pollFirst()
              }

              fun popBack(): Int {
                  if (right.isEmpty()) return -1
                  val x = right.pollLast()
                  balance()
                  return x
              }
          }
        `,
        swift: code`
          class FrontMiddleBackQueue {
              var left: [Int] = []  // invariant: left.count <= right.count <= left.count + 1
              var right: [Int] = []

              init() {}

              func balance() {
                  if left.count > right.count { right.insert(left.removeLast(), at: 0) }
                  else if right.count > left.count + 1 { left.append(right.removeFirst()) }
              }

              func pushFront(_ value: Int) {
                  left.insert(value, at: 0)
                  balance()
              }

              func pushMiddle(_ value: Int) {
                  if left.count == right.count { right.insert(value, at: 0) } else { left.append(value) }
              }

              func pushBack(_ value: Int) {
                  right.append(value)
                  balance()
              }

              func popFront() -> Int {
                  if right.isEmpty { return -1 }
                  let x = left.isEmpty ? right.removeFirst() : left.removeFirst()
                  balance()
                  return x
              }

              func popMiddle() -> Int {
                  if right.isEmpty { return -1 }
                  return left.count == right.count ? left.removeLast() : right.removeFirst()
              }

              func popBack() -> Int {
                  if right.isEmpty { return -1 }
                  let x = right.removeLast()
                  balance()
                  return x
              }
          }
        `,
        rust: code`
          use std::collections::VecDeque;

          struct FrontMiddleBackQueue {
              left: VecDeque<i32>,  // invariant: left.len() <= right.len() <= left.len() + 1
              right: VecDeque<i32>,
          }

          impl FrontMiddleBackQueue {
              fn new() -> Self {
                  FrontMiddleBackQueue { left: VecDeque::new(), right: VecDeque::new() }
              }

              fn balance(&mut self) {
                  if self.left.len() > self.right.len() {
                      let x = self.left.pop_back().unwrap();
                      self.right.push_front(x);
                  } else if self.right.len() > self.left.len() + 1 {
                      let x = self.right.pop_front().unwrap();
                      self.left.push_back(x);
                  }
              }

              fn pushFront(&mut self, value: i32) {
                  self.left.push_front(value);
                  self.balance();
              }

              fn pushMiddle(&mut self, value: i32) {
                  if self.left.len() == self.right.len() { self.right.push_front(value); } else { self.left.push_back(value); }
              }

              fn pushBack(&mut self, value: i32) {
                  self.right.push_back(value);
                  self.balance();
              }

              fn popFront(&mut self) -> i32 {
                  if self.right.is_empty() { return -1; }
                  let x = if self.left.is_empty() { self.right.pop_front().unwrap() } else { self.left.pop_front().unwrap() };
                  self.balance();
                  x
              }

              fn popMiddle(&mut self) -> i32 {
                  if self.right.is_empty() { return -1; }
                  if self.left.len() == self.right.len() { self.left.pop_back().unwrap() } else { self.right.pop_front().unwrap() }
              }

              fn popBack(&mut self) -> i32 {
                  if self.right.is_empty() { return -1; }
                  let x = self.right.pop_back().unwrap();
                  self.balance();
                  x
              }
          }
        `,
        php: code`
          class FrontMiddleBackQueue {
              private $left = [];  // invariant: count(left) <= count(right) <= count(left) + 1
              private $right = [];

              function __construct() {
              }

              private function balance() {
                  if (count($this->left) > count($this->right)) array_unshift($this->right, array_pop($this->left));
                  elseif (count($this->right) > count($this->left) + 1) $this->left[] = array_shift($this->right);
              }

              function pushFront($value) {
                  array_unshift($this->left, $value);
                  $this->balance();
              }

              function pushMiddle($value) {
                  if (count($this->left) == count($this->right)) array_unshift($this->right, $value);
                  else $this->left[] = $value;
              }

              function pushBack($value) {
                  $this->right[] = $value;
                  $this->balance();
              }

              function popFront() {
                  if (!$this->right) return -1;
                  $x = $this->left ? array_shift($this->left) : array_shift($this->right);
                  $this->balance();
                  return $x;
              }

              function popMiddle() {
                  if (!$this->right) return -1;
                  return count($this->left) == count($this->right) ? array_pop($this->left) : array_shift($this->right);
              }

              function popBack() {
                  if (!$this->right) return -1;
                  $x = array_pop($this->right);
                  $this->balance();
                  return $x;
              }
          }
        `,
        ruby: code`
          class FrontMiddleBackQueue
            def initialize
              @left = []  # invariant: left.length <= right.length <= left.length + 1
              @right = []
            end

            def balance
              if @left.length > @right.length
                @right.unshift(@left.pop)
              elsif @right.length > @left.length + 1
                @left.push(@right.shift)
              end
            end

            def pushFront(value)
              @left.unshift(value)
              balance
            end

            def pushMiddle(value)
              if @left.length == @right.length
                @right.unshift(value)
              else
                @left.push(value)
              end
            end

            def pushBack(value)
              @right.push(value)
              balance
            end

            def popFront
              return -1 if @right.empty?
              x = @left.empty? ? @right.shift : @left.shift
              balance
              x
            end

            def popMiddle
              return -1 if @right.empty?
              @left.length == @right.length ? @left.pop : @right.shift
            end

            def popBack
              return -1 if @right.empty?
              x = @right.pop
              balance
              x
            end
          end
        `,
      },
    };
  })(),

  // ── Design Authentication Manager (LC 1797) ───────────────────────
  (() => {
    const run: Run = (ops, args) => {
      let ttl = 0;
      const exp = new Map<string, number>();
      return ops.map((op, k) => {
        if (op === "AuthenticationManager") { ttl = args[k][0]; return null; }
        if (op === "generate") { exp.set(args[k][0], args[k][1] + ttl); return null; }
        if (op === "renew") {
          const e = exp.get(args[k][0]);
          if (e !== undefined && e > args[k][1]) exp.set(args[k][0], args[k][1] + ttl);
          return null;
        }
        let c = 0;
        for (const e of exp.values()) if (e > args[k][0]) c++;
        return c;
      });
    };
    const make = (rng: Rng) => {
      const ttl = rng() < 0.05 ? 100000000 : ri(rng, 1, pick(rng, [2, 5, 12, 40]));
      const ops = ["AuthenticationManager"], args: Args = [[ttl]];
      const used = new Set<string>();
      let t = ri(rng, 1, 5);
      for (let m = ri(rng, 1, pick(rng, [3, 10, 25, 40])); m > 0; m--) {
        const r = rng();
        if (r < 0.4 || used.size === 0) {
          let id; do id = randLower(rng, 1, pick(rng, [1, 2, 5]), "abcdefg"); while (used.has(id) && used.size < 7);
          if (used.has(id)) { ops.push("countUnexpiredTokens"); args.push([t]); }
          else { used.add(id); ops.push("generate"); args.push([id, t]); }
        } else if (r < 0.75) {
          ops.push("renew"); args.push([rng() < 0.85 ? pick(rng, [...used]) : randLower(rng, 1, 5, "xyz"), t]);
        } else { ops.push("countUnexpiredTokens"); args.push([t]); }
        t += rng() < 0.05 ? ri(rng, 1, 1000) : ri(rng, 1, 4);
        if (t > 100000000) break;
      }
      return { ops, args };
    };
    const ex1: [string[], Args] = [
      ["AuthenticationManager", "renew", "generate", "countUnexpiredTokens", "generate", "renew", "renew", "countUnexpiredTokens"],
      [[5], ["aaa", 1], ["aaa", 2], [6], ["bbb", 7], ["aaa", 8], ["bbb", 10], [15]],
    ];
    const ex2: [string[], Args] = [["AuthenticationManager", "generate", "renew", "countUnexpiredTokens", "countUnexpiredTokens"], [[3], ["x", 1], ["x", 3], [5], [6]]];
    return {
      slug: "design-authentication-manager",
      title: "Design Authentication Manager",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "Linked List", "Design"],
      signature: {
        funcName: "AuthenticationManager", params: [{ name: "timeToLive", type: "int" as const }], returns: "void" as const,
        methods: [
          { name: "generate", params: [{ name: "tokenId", type: "string" as const }, { name: "currentTime", type: "int" as const }], returns: "void" as const },
          { name: "renew", params: [{ name: "tokenId", type: "string" as const }, { name: "currentTime", type: "int" as const }], returns: "void" as const },
          { name: "countUnexpiredTokens", params: [{ name: "currentTime", type: "int" as const }], returns: "int" as const },
        ],
      },
      description: describe(
        "An authentication system issues tokens that live for `timeToLive` seconds: a token generated or renewed at time `t` expires at time `t + timeToLive`. A renewal pushes the expiry back to `timeToLive` seconds after the renewal.\n\nWrite the class `AuthenticationManager`:\n\n- `AuthenticationManager(int timeToLive)` sets the lifetime of every token.\n- `void generate(String tokenId, int currentTime)` issues a new token `tokenId` at `currentTime`.\n- `void renew(String tokenId, int currentTime)` renews the token `tokenId` if it exists and has **not expired** at `currentTime`. Renewing a token that does not exist or has already expired does nothing.\n- `int countUnexpiredTokens(int currentTime)` returns how many tokens are unexpired at `currentTime`.\n\nExpiry takes effect before anything else: a token that expires exactly at time `t` is already expired for a `renew` or a count made at time `t`.\n\n" + CALLS,
        [
          exampleOf(run, ex1[0], ex1[1], "Renewing aaa at time 1 does nothing — it does not exist yet. aaa is generated at 2 and expires at 7, so it counts at 6, but at 8 it has expired and cannot be renewed. bbb, generated at 7, is renewed at 10 to expire at 15, so at 15 no token is left."),
          exampleOf(run, ex2[0], ex2[1], "x is generated at 1 with expiry 4 and renewed at 3 to expiry 6. At 5 it is alive; at 6 it has just expired."),
        ],
        ["1 <= timeToLive <= 10^8", "1 <= currentTime <= 10^8", "1 <= tokenId.length <= 5", "tokenId consists of lowercase English letters", "Every generate call uses a tokenId never generated before", "The currentTime values of all calls are strictly increasing", "At most 2000 calls are made to the three methods in total"]),
      hints: [
        "All a token needs is its expiry time. Keep a map from token id to expiry.",
        "A token is alive at time `t` exactly when its expiry is strictly greater than `t` — that one comparison handles the \"expires before anything else\" rule.",
        "`renew` checks that comparison before moving the expiry; `countUnexpiredTokens` counts the expiries greater than `t` (expired entries may be deleted as you go, since times only increase).",
      ],
      editorial: explain({
        idea: "Store each token's expiry time in a hash map. Every rule in the statement is then one comparison: a token is alive at `t` iff `expiry > t`.",
        steps: [
          "`generate(id, t)`: `expiry[id] = t + timeToLive`.",
          "`renew(id, t)`: if `id` is in the map and `expiry[id] > t`, set `expiry[id] = t + timeToLive`.",
          "`countUnexpiredTokens(t)`: count the entries with `expiry > t`. Because times strictly increase, an expired entry can never come back; deleting it while counting keeps the map small.",
        ],
        why: "A token issued or renewed at `s` is alive during `[s, s + timeToLive)`. Since expiry happens before other actions at the same instant, at time `t` it is alive iff `t < s + timeToLive`, i.e. `expiry > t` — for renewals and counts alike.",
        time: "O(1) per generate and renew, O(k) per count for k stored tokens",
        space: "O(k)",
        pitfalls: [
          "Using `>=` keeps a token alive at the very moment it expires; the statement says it is already gone.",
          "Renewing an expired token must not bring it back.",
          "For counts in O(1) amortised, keep tokens in a list ordered by expiry (renewing moves one to the end) and drop expired ones from the front — the linked-list variant of the same idea.",
        ],
      }),
      examples: [caseOf(run, ex1[0], ex1[1]), caseOf(run, ex2[0], ex2[1])],
      gen: (rng: Rng) => { const { ops, args } = make(rng); return caseOf(run, ops, args); },
      solutions: {
        python: code`
          class AuthenticationManager:

              def __init__(self, timeToLive: int):
                  self.ttl = timeToLive
                  self.expiry = {}

              def generate(self, tokenId: str, currentTime: int) -> None:
                  self.expiry[tokenId] = currentTime + self.ttl

              def renew(self, tokenId: str, currentTime: int) -> None:
                  if self.expiry.get(tokenId, 0) > currentTime:  # alive iff expiry > now
                      self.expiry[tokenId] = currentTime + self.ttl

              def countUnexpiredTokens(self, currentTime: int) -> int:
                  for k in [k for k, e in self.expiry.items() if e <= currentTime]:
                      del self.expiry[k]  # times only increase: expired tokens never return
                  return len(self.expiry)
        `,
        javascript: code`
          var AuthenticationManager = function(timeToLive) {
              this.ttl = timeToLive;
              this.expiry = new Map();
          };

          AuthenticationManager.prototype.generate = function(tokenId, currentTime) {
              this.expiry.set(tokenId, currentTime + this.ttl);
          };

          AuthenticationManager.prototype.renew = function(tokenId, currentTime) {
              var e = this.expiry.get(tokenId);
              if (e !== undefined && e > currentTime) this.expiry.set(tokenId, currentTime + this.ttl); // alive iff expiry > now
          };

          AuthenticationManager.prototype.countUnexpiredTokens = function(currentTime) {
              var self = this, dead = [];
              this.expiry.forEach(function(e, k) { if (e <= currentTime) dead.push(k); });
              dead.forEach(function(k) { self.expiry.delete(k); }); // times only increase: expired tokens never return
              return this.expiry.size;
          };
        `,
        typescript: code`
          class AuthenticationManager {
              ttl: number;
              expiry: { [id: string]: number };

              constructor(timeToLive: number) {
                  this.ttl = timeToLive;
                  this.expiry = Object.create(null);
              }

              generate(tokenId: string, currentTime: number): void {
                  this.expiry[tokenId] = currentTime + this.ttl;
              }

              renew(tokenId: string, currentTime: number): void {
                  var e = this.expiry[tokenId];
                  if (e !== undefined && e > currentTime) this.expiry[tokenId] = currentTime + this.ttl; // alive iff expiry > now
              }

              countUnexpiredTokens(currentTime: number): number {
                  var count = 0;
                  for (var k in this.expiry) {
                      if (this.expiry[k] > currentTime) count++;
                      else delete this.expiry[k]; // times only increase: expired tokens never return
                  }
                  return count;
              }
          }
        `,
        java: code`
          class AuthenticationManager {
              private int ttl;
              private HashMap<String, Integer> expiry = new HashMap<>();

              public AuthenticationManager(int timeToLive) {
                  ttl = timeToLive;
              }

              public void generate(String tokenId, int currentTime) {
                  expiry.put(tokenId, currentTime + ttl);
              }

              public void renew(String tokenId, int currentTime) {
                  Integer e = expiry.get(tokenId);
                  if (e != null && e > currentTime) expiry.put(tokenId, currentTime + ttl); // alive iff expiry > now
              }

              public int countUnexpiredTokens(int currentTime) {
                  expiry.values().removeIf(e -> e <= currentTime); // times only increase: expired tokens never return
                  return expiry.size();
              }
          }
        `,
        cpp: code`
          class AuthenticationManager {
              int ttl;
              unordered_map<string, int> expiry;
          public:
              AuthenticationManager(int timeToLive) : ttl(timeToLive) {}

              void generate(string tokenId, int currentTime) {
                  expiry[tokenId] = currentTime + ttl;
              }

              void renew(string tokenId, int currentTime) {
                  auto it = expiry.find(tokenId);
                  if (it != expiry.end() && it->second > currentTime) it->second = currentTime + ttl; // alive iff expiry > now
              }

              int countUnexpiredTokens(int currentTime) {
                  for (auto it = expiry.begin(); it != expiry.end();) {
                      if (it->second <= currentTime) it = expiry.erase(it); // expired tokens never return
                      else ++it;
                  }
                  return expiry.size();
              }
          };
        `,
        c: code`
          /* No hash map in C: tokens live in a small table searched linearly. */
          typedef struct {
              char id[8];
              int expiry;
          } AmToken;

          typedef struct {
              int ttl, n, cap;
              AmToken* t;
          } AuthenticationManager;

          AuthenticationManager* authenticationManagerCreate(int timeToLive) {
              AuthenticationManager* o = (AuthenticationManager*)malloc(sizeof(AuthenticationManager));
              o->ttl = timeToLive;
              o->n = 0;
              o->cap = 8;
              o->t = (AmToken*)malloc(8 * sizeof(AmToken));
              return o;
          }

          static AmToken* amFind(AuthenticationManager* o, const char* id) {
              for (int i = 0; i < o->n; i++) if (strcmp(o->t[i].id, id) == 0) return &o->t[i];
              return NULL;
          }

          void authenticationManagerGenerate(AuthenticationManager* obj, char* tokenId, int currentTime) {
              if (obj->n == obj->cap) { obj->cap *= 2; obj->t = (AmToken*)realloc(obj->t, obj->cap * sizeof(AmToken)); }
              strcpy(obj->t[obj->n].id, tokenId);
              obj->t[obj->n++].expiry = currentTime + obj->ttl;
          }

          void authenticationManagerRenew(AuthenticationManager* obj, char* tokenId, int currentTime) {
              AmToken* e = amFind(obj, tokenId);
              if (e && e->expiry > currentTime) e->expiry = currentTime + obj->ttl; /* alive iff expiry > now */
          }

          int authenticationManagerCountUnexpiredTokens(AuthenticationManager* obj, int currentTime) {
              int m = 0;
              for (int i = 0; i < obj->n; i++)
                  if (obj->t[i].expiry > currentTime) obj->t[m++] = obj->t[i]; /* drop expired: they never return */
              obj->n = m;
              return m;
          }

          void authenticationManagerFree(AuthenticationManager* obj) {
              free(obj->t);
              free(obj);
          }
        `,
        csharp: code`
          public class AuthenticationManager {
              private int ttl;
              private Dictionary<string, int> expiry = new Dictionary<string, int>();

              public AuthenticationManager(int timeToLive) {
                  ttl = timeToLive;
              }

              public void Generate(string tokenId, int currentTime) {
                  expiry[tokenId] = currentTime + ttl;
              }

              public void Renew(string tokenId, int currentTime) {
                  int e;
                  if (expiry.TryGetValue(tokenId, out e) && e > currentTime) expiry[tokenId] = currentTime + ttl; // alive iff expiry > now
              }

              public int CountUnexpiredTokens(int currentTime) {
                  var dead = expiry.Where(kv => kv.Value <= currentTime).Select(kv => kv.Key).ToList();
                  foreach (var k in dead) expiry.Remove(k); // times only increase: expired tokens never return
                  return expiry.Count;
              }
          }
        `,
        go: code`
          type AuthenticationManager struct {
          	ttl    int
          	expiry map[string]int
          }

          func Constructor(timeToLive int) AuthenticationManager {
          	return AuthenticationManager{ttl: timeToLive, expiry: map[string]int{}}
          }

          func (this *AuthenticationManager) Generate(tokenId string, currentTime int) {
          	this.expiry[tokenId] = currentTime + this.ttl
          }

          func (this *AuthenticationManager) Renew(tokenId string, currentTime int) {
          	if e, ok := this.expiry[tokenId]; ok && e > currentTime { // alive iff expiry > now
          		this.expiry[tokenId] = currentTime + this.ttl
          	}
          }

          func (this *AuthenticationManager) CountUnexpiredTokens(currentTime int) int {
          	for k, e := range this.expiry {
          		if e <= currentTime {
          			delete(this.expiry, k) // times only increase: expired tokens never return
          		}
          	}
          	return len(this.expiry)
          }
        `,
        kotlin: code`
          class AuthenticationManager(timeToLive: Int) {
              private val ttl = timeToLive
              private val expiry = HashMap<String, Int>()

              fun generate(tokenId: String, currentTime: Int) {
                  expiry[tokenId] = currentTime + ttl
              }

              fun renew(tokenId: String, currentTime: Int) {
                  val e = expiry[tokenId]
                  if (e != null && e > currentTime) expiry[tokenId] = currentTime + ttl // alive iff expiry > now
              }

              fun countUnexpiredTokens(currentTime: Int): Int {
                  expiry.values.removeIf { it <= currentTime } // times only increase: expired tokens never return
                  return expiry.size
              }
          }
        `,
        swift: code`
          class AuthenticationManager {
              let ttl: Int
              var expiry: [String: Int] = [:]

              init(_ timeToLive: Int) {
                  ttl = timeToLive
              }

              func generate(_ tokenId: String, _ currentTime: Int) {
                  expiry[tokenId] = currentTime + ttl
              }

              func renew(_ tokenId: String, _ currentTime: Int) {
                  if let e = expiry[tokenId], e > currentTime { expiry[tokenId] = currentTime + ttl } // alive iff expiry > now
              }

              func countUnexpiredTokens(_ currentTime: Int) -> Int {
                  expiry = expiry.filter { $0.value > currentTime } // times only increase: expired tokens never return
                  return expiry.count
              }
          }
        `,
        rust: code`
          use std::collections::HashMap;

          struct AuthenticationManager {
              ttl: i32,
              expiry: HashMap<String, i32>,
          }

          impl AuthenticationManager {
              fn new(time_to_live: i32) -> Self {
                  AuthenticationManager { ttl: time_to_live, expiry: HashMap::new() }
              }

              fn generate(&mut self, token_id: String, current_time: i32) {
                  self.expiry.insert(token_id, current_time + self.ttl);
              }

              fn renew(&mut self, token_id: String, current_time: i32) {
                  let ttl = self.ttl;
                  if let Some(e) = self.expiry.get_mut(&token_id) {
                      if *e > current_time { *e = current_time + ttl; } // alive iff expiry > now
                  }
              }

              fn countUnexpiredTokens(&mut self, current_time: i32) -> i32 {
                  self.expiry.retain(|_, e| *e > current_time); // times only increase: expired tokens never return
                  self.expiry.len() as i32
              }
          }
        `,
        php: code`
          class AuthenticationManager {
              private $ttl;
              private $expiry = [];

              function __construct($timeToLive) {
                  $this->ttl = $timeToLive;
              }

              function generate($tokenId, $currentTime) {
                  $this->expiry[$tokenId] = $currentTime + $this->ttl;
              }

              function renew($tokenId, $currentTime) {
                  if (isset($this->expiry[$tokenId]) && $this->expiry[$tokenId] > $currentTime) // alive iff expiry > now
                      $this->expiry[$tokenId] = $currentTime + $this->ttl;
              }

              function countUnexpiredTokens($currentTime) {
                  foreach ($this->expiry as $k => $e)
                      if ($e <= $currentTime) unset($this->expiry[$k]); // times only increase: expired tokens never return
                  return count($this->expiry);
              }
          }
        `,
        ruby: code`
          class AuthenticationManager
            def initialize(time_to_live)
              @ttl = time_to_live
              @expiry = {}
            end

            def generate(token_id, current_time)
              @expiry[token_id] = current_time + @ttl
            end

            def renew(token_id, current_time)
              e = @expiry[token_id]
              @expiry[token_id] = current_time + @ttl if e && e > current_time # alive iff expiry > now
            end

            def countUnexpiredTokens(current_time)
              @expiry.delete_if { |_, e| e <= current_time } # times only increase: expired tokens never return
              @expiry.size
            end
          end
        `,
      },
    };
  })(),

  // ── Seat Reservation Manager (LC 1845) ────────────────────────────
  (() => {
    const run: Run = (ops, args) => {
      const taken = new Set<number>();
      return ops.map((op, k) => {
        if (op === "SeatManager") return null;
        if (op === "unreserve") { taken.delete(args[k][0]); return null; }
        let s = 1;
        while (taken.has(s)) s++;
        taken.add(s);
        return s;
      });
    };
    const make = (rng: Rng) => {
      const n = rng() < 0.1 ? 100000 : ri(rng, 1, pick(rng, [1, 3, 8, 20]));
      const ops = ["SeatManager"], args: Args = [[n]];
      const taken = new Set<number>();
      const free = () => { let s = 1; while (taken.has(s)) s++; return s; };
      for (let m = ri(rng, 1, pick(rng, [3, 10, 25, 40])); m > 0; m--) {
        if (taken.size < n && (taken.size === 0 || rng() < 0.6)) { ops.push("reserve"); args.push([]); taken.add(free()); }
        else if (taken.size > 0) {
          const s = pick(rng, [...taken]);
          ops.push("unreserve"); args.push([s]); taken.delete(s);
        }
      }
      return { ops, args };
    };
    const ex1: [string[], Args] = [
      ["SeatManager", "reserve", "reserve", "unreserve", "reserve", "reserve", "reserve", "reserve", "unreserve"],
      [[5], [], [], [2], [], [], [], [], [5]],
    ];
    const ex2: [string[], Args] = [["SeatManager", "reserve", "reserve", "reserve", "unreserve", "unreserve", "reserve"], [[3], [], [], [], [3], [1], []]];
    return {
      slug: "seat-reservation-manager",
      title: "Seat Reservation Manager",
      difficulty: "MEDIUM" as const,
      tags: ["Heap (Priority Queue)", "Design", "Dropbox"],
      signature: {
        funcName: "SeatManager", params: [{ name: "n", type: "int" as const }], returns: "void" as const,
        methods: [
          { name: "reserve", params: [], returns: "int" as const },
          { name: "unreserve", params: [{ name: "seatNumber", type: "int" as const }], returns: "void" as const },
        ],
      },
      description: describe(
        "A venue has `n` seats numbered `1` to `n`, all free at the start. Design the system that hands them out.\n\nWrite the class `SeatManager`:\n\n- `SeatManager(int n)` sets up `n` free seats.\n- `int reserve()` reserves the **smallest-numbered** free seat and returns its number.\n- `void unreserve(int seatNumber)` makes the reserved seat `seatNumber` free again.\n\n" + CALLS,
        [
          exampleOf(run, ex1[0], ex1[1], "Seats 1 and 2 are handed out; 2 is returned, so the next reserve gives 2 again, then 3, 4 and 5. Seat 5 is then returned."),
          exampleOf(run, ex2[0], ex2[1], "All three seats are taken, then 3 and 1 come back. The smallest free seat is 1."),
        ],
        ["1 <= n <= 10^5", "1 <= seatNumber <= n", "reserve is only called while at least one seat is free", "unreserve is only called on a reserved seat", "At most 10^5 calls are made to reserve and unreserve in total"]),
      hints: [
        "Scanning from seat 1 for a free one is O(n) per call. Which seats can actually be the answer?",
        "Seats never touched so far are always the block `next, next + 1, …, n`; the only other free seats are ones that were returned.",
        "Keep `next` (the first untouched seat) and a min-heap of returned seats. Every returned seat is smaller than `next`, so `reserve` pops the heap when it is non-empty and otherwise hands out `next++`; `unreserve` pushes onto the heap.",
      ],
      editorial: explain({
        idea: "Split the free seats into two groups: the untouched tail `next..n`, described by one integer, and the seats that were returned, kept in a min-heap.",
        steps: [
          "Start with `next = 1` and an empty min-heap.",
          "`reserve()`: if the heap is not empty, pop and return its minimum; otherwise return `next` and increase it.",
          "`unreserve(s)`: push `s` onto the heap.",
        ],
        why: "Seats are handed out from the tail in increasing order, so every seat that was ever reserved — and therefore every returned seat — is smaller than `next`. Hence when the heap holds anything its minimum is the smallest free seat overall, and when it is empty the smallest free seat is `next`. (Calling reserve with no free seat is ruled out, so `next` never passes `n`.)",
        time: "O(log k) per call, where k is the number of returned seats waiting",
        space: "O(k) — never a table of all n seats",
        pitfalls: [
          "Pushing all n seats into the heap up front works but costs O(n log n) — or O(n) memory — before the first call.",
          "A max-heap or a plain stack of returned seats hands out the wrong seat when several are returned out of order.",
        ],
      }),
      examples: [caseOf(run, ex1[0], ex1[1]), caseOf(run, ex2[0], ex2[1])],
      gen: (rng: Rng) => { const { ops, args } = make(rng); return caseOf(run, ops, args); },
      solutions: {
        python: code`
          import heapq

          class SeatManager:

              def __init__(self, n: int):
                  self.next = 1      # seats next..n were never handed out
                  self.returned = [] # min-heap of seats given back, all < next

              def reserve(self) -> int:
                  if self.returned:
                      return heapq.heappop(self.returned)
                  self.next += 1
                  return self.next - 1

              def unreserve(self, seatNumber: int) -> None:
                  heapq.heappush(self.returned, seatNumber)
        `,
        javascript: code`
          var SeatManager = function(n) {
              this.next = 1;  // seats next..n were never handed out
              this.heap = []; // min-heap of seats given back, all < next
          };

          SeatManager.prototype.reserve = function() {
              var h = this.heap;
              if (h.length === 0) return this.next++;
              var top = h[0], last = h.pop();
              if (h.length) {
                  var i = 0;
                  for (;;) {
                      var l = 2 * i + 1, r = l + 1, m = i;
                      if (l < h.length && h[l] < (m === i ? last : h[m])) m = l;
                      if (r < h.length && h[r] < (m === i ? last : h[m])) m = r;
                      if (m === i) break;
                      h[i] = h[m];
                      i = m;
                  }
                  h[i] = last;
              }
              return top;
          };

          SeatManager.prototype.unreserve = function(seatNumber) {
              var h = this.heap, i = h.length;
              h.push(seatNumber);
              while (i > 0 && h[(i - 1) >> 1] > seatNumber) { h[i] = h[(i - 1) >> 1]; i = (i - 1) >> 1; }
              h[i] = seatNumber;
          };
        `,
        typescript: code`
          class SeatManager {
              next: number;
              heap: number[];

              constructor(n: number) {
                  this.next = 1;  // seats next..n were never handed out
                  this.heap = []; // min-heap of seats given back, all < next
              }

              reserve(): number {
                  var h = this.heap;
                  if (h.length === 0) return this.next++;
                  var top = h[0], last = h.pop();
                  if (h.length) {
                      var i = 0;
                      for (;;) {
                          var l = 2 * i + 1, r = l + 1, m = i;
                          if (l < h.length && h[l] < (m === i ? last : h[m])) m = l;
                          if (r < h.length && h[r] < (m === i ? last : h[m])) m = r;
                          if (m === i) break;
                          h[i] = h[m];
                          i = m;
                      }
                      h[i] = last;
                  }
                  return top;
              }

              unreserve(seatNumber: number): void {
                  var h = this.heap, i = h.length;
                  h.push(seatNumber);
                  while (i > 0 && h[(i - 1) >> 1] > seatNumber) { h[i] = h[(i - 1) >> 1]; i = (i - 1) >> 1; }
                  h[i] = seatNumber;
              }
          }
        `,
        java: code`
          class SeatManager {
              private int next = 1; // seats next..n were never handed out
              private PriorityQueue<Integer> returned = new PriorityQueue<>(); // all < next

              public SeatManager(int n) {
              }

              public int reserve() {
                  return returned.isEmpty() ? next++ : returned.poll();
              }

              public void unreserve(int seatNumber) {
                  returned.offer(seatNumber);
              }
          }
        `,
        cpp: code`
          class SeatManager {
              int next = 1; // seats next..n were never handed out
              priority_queue<int, vector<int>, greater<int>> returned; // all < next
          public:
              SeatManager(int n) {}

              int reserve() {
                  if (returned.empty()) return next++;
                  int s = returned.top();
                  returned.pop();
                  return s;
              }

              void unreserve(int seatNumber) {
                  returned.push(seatNumber);
              }
          };
        `,
        c: code`
          typedef struct {
              int next;  /* seats next..n were never handed out */
              int* heap; /* min-heap of seats given back, all < next */
              int size;
          } SeatManager;

          SeatManager* seatManagerCreate(int n) {
              SeatManager* o = (SeatManager*)malloc(sizeof(SeatManager));
              o->next = 1;
              o->heap = (int*)malloc((n + 1) * sizeof(int));
              o->size = 0;
              return o;
          }

          int seatManagerReserve(SeatManager* obj) {
              if (obj->size == 0) return obj->next++;
              int* h = obj->heap;
              int top = h[0], last = h[--obj->size], i = 0;
              for (;;) {
                  int l = 2 * i + 1, r = l + 1, m = i, mv = last;
                  if (l < obj->size && h[l] < mv) { m = l; mv = h[l]; }
                  if (r < obj->size && h[r] < mv) { m = r; mv = h[r]; }
                  if (m == i) break;
                  h[i] = h[m];
                  i = m;
              }
              h[i] = last;
              return top;
          }

          void seatManagerUnreserve(SeatManager* obj, int seatNumber) {
              int* h = obj->heap;
              int i = obj->size++;
              while (i > 0 && h[(i - 1) / 2] > seatNumber) { h[i] = h[(i - 1) / 2]; i = (i - 1) / 2; }
              h[i] = seatNumber;
          }

          void seatManagerFree(SeatManager* obj) {
              free(obj->heap);
              free(obj);
          }
        `,
        csharp: code`
          public class SeatManager {
              private int next = 1; // seats next..n were never handed out
              private SortedSet<int> returned = new SortedSet<int>(); // seats given back, all < next

              public SeatManager(int n) {
              }

              public int Reserve() {
                  if (returned.Count == 0) return next++;
                  int s = returned.Min;
                  returned.Remove(s);
                  return s;
              }

              public void Unreserve(int seatNumber) {
                  returned.Add(seatNumber);
              }
          }
        `,
        go: code`
          type seatHeap []int

          func (h seatHeap) Len() int            { return len(h) }
          func (h seatHeap) Less(i, j int) bool  { return h[i] < h[j] }
          func (h seatHeap) Swap(i, j int)       { h[i], h[j] = h[j], h[i] }
          func (h *seatHeap) Push(x interface{}) { *h = append(*h, x.(int)) }
          func (h *seatHeap) Pop() interface{} {
          	old := *h
          	x := old[len(old)-1]
          	*h = old[:len(old)-1]
          	return x
          }

          type SeatManager struct {
          	next     int      // seats next..n were never handed out
          	returned seatHeap // seats given back, all < next
          }

          func Constructor(n int) SeatManager {
          	return SeatManager{next: 1}
          }

          func (this *SeatManager) Reserve() int {
          	if this.returned.Len() > 0 {
          		return heap.Pop(&this.returned).(int)
          	}
          	this.next++
          	return this.next - 1
          }

          func (this *SeatManager) Unreserve(seatNumber int) {
          	heap.Push(&this.returned, seatNumber)
          }
        `,
        kotlin: code`
          class SeatManager(n: Int) {
              private var next = 1 // seats next..n were never handed out
              private val returned = java.util.PriorityQueue<Int>() // all < next

              fun reserve(): Int = if (returned.isEmpty()) next++ else returned.poll()

              fun unreserve(seatNumber: Int) {
                  returned.offer(seatNumber)
              }
          }
        `,
        swift: code`
          class SeatManager {
              var next = 1          // seats next..n were never handed out
              var heap: [Int] = []  // min-heap of seats given back, all < next

              init(_ n: Int) {}

              func reserve() -> Int {
                  if heap.isEmpty { next += 1; return next - 1 }
                  let top = heap[0], last = heap.removeLast()
                  if !heap.isEmpty {
                      var i = 0
                      while true {
                          let l = 2 * i + 1, r = l + 1
                          var m = i, mv = last
                          if l < heap.count && heap[l] < mv { m = l; mv = heap[l] }
                          if r < heap.count && heap[r] < mv { m = r; mv = heap[r] }
                          if m == i { break }
                          heap[i] = heap[m]
                          i = m
                      }
                      heap[i] = last
                  }
                  return top
              }

              func unreserve(_ seatNumber: Int) {
                  var i = heap.count
                  heap.append(seatNumber)
                  while i > 0 && heap[(i - 1) / 2] > seatNumber { heap[i] = heap[(i - 1) / 2]; i = (i - 1) / 2 }
                  heap[i] = seatNumber
              }
          }
        `,
        rust: code`
          use std::collections::BinaryHeap;
          use std::cmp::Reverse;

          struct SeatManager {
              next: i32,                       // seats next..n were never handed out
              returned: BinaryHeap<Reverse<i32>>, // seats given back, all < next
          }

          impl SeatManager {
              fn new(n: i32) -> Self {
                  SeatManager { next: 1, returned: BinaryHeap::new() }
              }

              fn reserve(&mut self) -> i32 {
                  if let Some(Reverse(s)) = self.returned.pop() { return s; }
                  self.next += 1;
                  self.next - 1
              }

              fn unreserve(&mut self, seat_number: i32) {
                  self.returned.push(Reverse(seat_number));
              }
          }
        `,
        php: code`
          class SeatManager {
              private $next = 1;   // seats next..n were never handed out
              private $returned;   // min-heap of seats given back, all < next

              function __construct($n) {
                  $this->returned = new \SplMinHeap();
              }

              function reserve() {
                  if (!$this->returned->isEmpty()) return $this->returned->extract();
                  return $this->next++;
              }

              function unreserve($seatNumber) {
                  $this->returned->insert($seatNumber);
              }
          }
        `,
        ruby: code`
          class SeatManager
            def initialize(n)
              @next = 1     # seats next..n were never handed out
              @heap = []    # min-heap of seats given back, all < next
            end

            def reserve
              if @heap.empty?
                @next += 1
                return @next - 1
              end
              top = @heap[0]
              last = @heap.pop
              unless @heap.empty?
                i = 0
                loop do
                  l = 2 * i + 1
                  r = l + 1
                  m = i
                  mv = last
                  if l < @heap.length && @heap[l] < mv
                    m = l
                    mv = @heap[l]
                  end
                  m = r if r < @heap.length && @heap[r] < mv
                  break if m == i
                  @heap[i] = @heap[m]
                  i = m
                end
                @heap[i] = last
              end
              top
            end

            def unreserve(seat_number)
              i = @heap.length
              @heap << seat_number
              while i > 0 && @heap[(i - 1) / 2] > seat_number
                @heap[i] = @heap[(i - 1) / 2]
                i = (i - 1) / 2
              end
              @heap[i] = seat_number
            end
          end
        `,
      },
    };
  })(),

  // ── Finding Pairs With a Certain Sum (LC 1865) ────────────────────
  (() => {
    const run: Run = (ops, args) => {
      let a: number[] = [], b: number[] = [];
      return ops.map((op, k) => {
        if (op === "FindSumPairs") { a = args[k][0]; b = (args[k][1] as number[]).slice(); return null; }
        if (op === "add") { b[args[k][0]] += args[k][1]; return null; }
        let c = 0; // brute force over every pair
        for (const x of a) for (const y of b) if (x + y === args[k][0]) c++;
        return c;
      });
    };
    const make = (rng: Rng) => {
      const small = rng() < 0.8;
      const nums1 = Array.from({ length: ri(rng, 1, pick(rng, [1, 4, 10, 25])) }, () => (small ? ri(rng, 1, 8) : ri(rng, 1, 1000000000)));
      const nums2 = Array.from({ length: ri(rng, 1, pick(rng, [1, 5, 15, 40])) }, () => (rng() < 0.9 ? ri(rng, 1, 8) : ri(rng, 1, 100000)));
      const ops = ["FindSumPairs"], args: Args = [[nums1, nums2]];
      for (let m = ri(rng, 1, pick(rng, [3, 10, 25, 40])); m > 0; m--) {
        if (rng() < 0.45) { ops.push("add"); args.push([ri(rng, 0, nums2.length - 1), rng() < 0.05 ? ri(rng, 1, 100000) : ri(rng, 1, 4)]); }
        else {
          ops.push("count");
          args.push([rng() < 0.6 ? Math.min(1000000000, pick(rng, nums1) + pick(rng, nums2) + ri(rng, 0, 3)) : ri(rng, 1, small ? 20 : 1000000000)]);
        }
      }
      return { ops, args };
    };
    const ex1: [string[], Args] = [
      ["FindSumPairs", "count", "add", "count", "count", "add", "add", "count"],
      [[[1, 1, 2, 2, 2, 3], [1, 4, 5, 2, 5, 4]], [7], [3, 2], [8], [4], [0, 1], [1, 1], [7]],
    ];
    const ex2: [string[], Args] = [["FindSumPairs", "count", "add", "count"], [[[5], [5, 5]], [10], [1, 100000], [10]]];
    return {
      slug: "finding-pairs-with-a-certain-sum",
      title: "Finding Pairs With a Certain Sum",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Design"],
      signature: {
        funcName: "FindSumPairs",
        params: [{ name: "nums1", type: "int[]" as const }, { name: "nums2", type: "int[]" as const }],
        returns: "void" as const,
        methods: [
          { name: "add", params: [{ name: "index", type: "int" as const }, { name: "value", type: "int" as const }], returns: "void" as const },
          { name: "count", params: [{ name: "tot", type: "int" as const }], returns: "int" as const },
        ],
      },
      description: describe(
        "You are given two integer arrays, `nums1` and `nums2`. The second one changes over time; the first never does.\n\nWrite the class `FindSumPairs`:\n\n- `FindSumPairs(int[] nums1, int[] nums2)` stores the two arrays.\n- `void add(int index, int value)` adds `value` to `nums2[index]`.\n- `int count(int tot)` returns the number of index pairs `(i, j)` with `nums1[i] + nums2[j] == tot`.\n\n" + CALLS,
        [
          exampleOf(run, ex1[0], ex1[1], "Sums of 7: each of the three 2s pairs with both 5s (6 pairs) and the 3 pairs with both 4s (2 more), 8 in all. After add(3,2) nums2 is [1,4,5,4,5,4]: the 3 meets both 5s to make 8, and only 3 + 1 makes 4. Two more additions give [2,5,5,4,5,4], where 9 + 2 = 11 pairs make 7."),
          exampleOf(run, ex2[0], ex2[1], "5 + 5 = 10 twice. After nums2[1] grows to 100005, only one pair is left."),
        ],
        ["1 <= nums1.length <= 1000", "1 <= nums2.length <= 10^5", "1 <= nums1[i] <= 10^9", "1 <= nums2[i] <= 10^5", "0 <= index < nums2.length", "1 <= value <= 10^5", "1 <= tot <= 10^9", "At most 1000 calls are made to add and to count each"]),
      hints: [
        "Checking every pair costs |nums1| × |nums2| — up to 10^8 per count. The two arrays are very different in size; use that.",
        "Keep a hash map counting how often each value occurs in `nums2`. For a fixed `x` in `nums1`, the pairs it makes number `freq[tot - x]`.",
        "`add` changes one entry of `nums2`: decrement the count of its old value and increment the count of its new one. Then `count` is one loop over the small array `nums1`.",
      ],
      editorial: explain({
        idea: "Loop over the small array and look the complement up in a frequency map of the large one. Updates only move one element between two counts.",
        steps: [
          "Store `nums1`, a copy of `nums2`, and `freq`: value → how many times it occurs in `nums2`.",
          "`add(index, value)`: `freq[nums2[index]]--`, `nums2[index] += value`, `freq[nums2[index]]++`.",
          "`count(tot)`: return the sum of `freq[tot - x]` over every `x` in `nums1` (a missing key counts 0).",
        ],
        why: "A pair `(i, j)` has `nums2[j] = tot - nums1[i]`, so for each `i` the matching `j` are exactly the occurrences of `tot - nums1[i]` in `nums2`, which `freq` holds. `add` keeps `freq` equal to the true counts of the current `nums2`, so every query sees the array as it is.",
        time: "O(n1 + n2) to build, O(1) per add, O(n1) per count",
        space: "O(n2)",
        pitfalls: [
          "Looping over `nums2` in `count` instead of `nums1` is up to 100 times slower — iterate the array of length ≤ 1000.",
          "`add` must update the frequency map, not just the array, or later counts read stale values.",
          "The answer can reach 10^8, which still fits a 32-bit int; the sum `tot - x` may be negative and simply finds nothing.",
        ],
      }),
      examples: [caseOf(run, ex1[0], ex1[1]), caseOf(run, ex2[0], ex2[1])],
      gen: (rng: Rng) => { const { ops, args } = make(rng); return caseOf(run, ops, args); },
      solutions: {
        python: code`
          from collections import Counter

          class FindSumPairs:

              def __init__(self, nums1: List[int], nums2: List[int]):
                  self.nums1 = nums1
                  self.nums2 = list(nums2)
                  self.freq = Counter(nums2)

              def add(self, index: int, value: int) -> None:
                  self.freq[self.nums2[index]] -= 1
                  self.nums2[index] += value
                  self.freq[self.nums2[index]] += 1

              def count(self, tot: int) -> int:
                  freq = self.freq
                  return sum(freq.get(tot - x, 0) for x in self.nums1)  # loop over the short array
        `,
        javascript: code`
          var FindSumPairs = function(nums1, nums2) {
              this.nums1 = nums1;
              this.nums2 = nums2.slice();
              this.freq = new Map();
              for (var i = 0; i < nums2.length; i++) this.freq.set(nums2[i], (this.freq.get(nums2[i]) || 0) + 1);
          };

          FindSumPairs.prototype.add = function(index, value) {
              var old = this.nums2[index];
              this.freq.set(old, this.freq.get(old) - 1);
              this.nums2[index] = old + value;
              this.freq.set(old + value, (this.freq.get(old + value) || 0) + 1);
          };

          FindSumPairs.prototype.count = function(tot) {
              var c = 0;
              for (var i = 0; i < this.nums1.length; i++) c += this.freq.get(tot - this.nums1[i]) || 0; // loop over the short array
              return c;
          };
        `,
        typescript: code`
          class FindSumPairs {
              nums1: number[];
              nums2: number[];
              freq: { [v: number]: number };

              constructor(nums1: number[], nums2: number[]) {
                  this.nums1 = nums1;
                  this.nums2 = nums2.slice();
                  this.freq = {};
                  for (var i = 0; i < nums2.length; i++) this.freq[nums2[i]] = (this.freq[nums2[i]] || 0) + 1;
              }

              add(index: number, value: number): void {
                  var old = this.nums2[index];
                  this.freq[old]--;
                  this.nums2[index] = old + value;
                  this.freq[old + value] = (this.freq[old + value] || 0) + 1;
              }

              count(tot: number): number {
                  var c = 0;
                  for (var i = 0; i < this.nums1.length; i++) c += this.freq[tot - this.nums1[i]] || 0; // loop over the short array
                  return c;
              }
          }
        `,
        java: code`
          class FindSumPairs {
              private int[] nums1, nums2;
              private HashMap<Integer, Integer> freq = new HashMap<>();

              public FindSumPairs(int[] nums1, int[] nums2) {
                  this.nums1 = nums1;
                  this.nums2 = nums2.clone();
                  for (int y : nums2) freq.merge(y, 1, Integer::sum);
              }

              public void add(int index, int value) {
                  freq.merge(nums2[index], -1, Integer::sum);
                  nums2[index] += value;
                  freq.merge(nums2[index], 1, Integer::sum);
              }

              public int count(int tot) {
                  int c = 0;
                  for (int x : nums1) c += freq.getOrDefault(tot - x, 0); // loop over the short array
                  return c;
              }
          }
        `,
        cpp: code`
          class FindSumPairs {
              vector<int> nums1, nums2;
              unordered_map<int, int> freq;
          public:
              FindSumPairs(vector<int>& nums1, vector<int>& nums2) : nums1(nums1), nums2(nums2) {
                  for (int y : nums2) freq[y]++;
              }

              void add(int index, int value) {
                  freq[nums2[index]]--;
                  nums2[index] += value;
                  freq[nums2[index]]++;
              }

              int count(int tot) {
                  int c = 0;
                  for (int x : nums1) { // loop over the short array
                      auto it = freq.find(tot - x);
                      if (it != freq.end()) c += it->second;
                  }
                  return c;
              }
          };
        `,
        c: code`
          /* A small open-addressing hash map, value -> count; every add creates at
             most one new key, so 2 * (n2 + 1001) slots never fill up. */
          typedef struct {
              int* nums1;
              int* nums2;
              int n1;
              int* key;
              int* cnt;
              char* used;
              int cap;
          } FindSumPairs;

          static int fspSlot(FindSumPairs* o, int k, bool insert) {
              unsigned h = ((unsigned)k * 2654435761u) & (unsigned)(o->cap - 1);
              while (o->used[h]) {
                  if (o->key[h] == k) return (int)h;
                  h = (h + 1) & (unsigned)(o->cap - 1);
              }
              if (!insert) return -1;
              o->used[h] = 1;
              o->key[h] = k;
              o->cnt[h] = 0;
              return (int)h;
          }

          FindSumPairs* findSumPairsCreate(int* nums1, int nums1Size, int* nums2, int nums2Size) {
              FindSumPairs* o = (FindSumPairs*)malloc(sizeof(FindSumPairs));
              o->n1 = nums1Size;
              o->nums1 = (int*)malloc(nums1Size * sizeof(int));
              memcpy(o->nums1, nums1, nums1Size * sizeof(int));
              o->nums2 = (int*)malloc(nums2Size * sizeof(int));
              memcpy(o->nums2, nums2, nums2Size * sizeof(int));
              o->cap = 16;
              while (o->cap < 2 * (nums2Size + 1001)) o->cap *= 2;
              o->key = (int*)malloc(o->cap * sizeof(int));
              o->cnt = (int*)malloc(o->cap * sizeof(int));
              o->used = (char*)calloc(o->cap, 1);
              for (int j = 0; j < nums2Size; j++) o->cnt[fspSlot(o, nums2[j], true)]++;
              return o;
          }

          void findSumPairsAdd(FindSumPairs* obj, int index, int value) {
              obj->cnt[fspSlot(obj, obj->nums2[index], false)]--;
              obj->nums2[index] += value;
              obj->cnt[fspSlot(obj, obj->nums2[index], true)]++;
          }

          int findSumPairsCount(FindSumPairs* obj, int tot) {
              int c = 0;
              for (int i = 0; i < obj->n1; i++) { /* loop over the short array */
                  int s = fspSlot(obj, tot - obj->nums1[i], false);
                  if (s >= 0) c += obj->cnt[s];
              }
              return c;
          }

          void findSumPairsFree(FindSumPairs* obj) {
              free(obj->nums1); free(obj->nums2);
              free(obj->key); free(obj->cnt); free(obj->used);
              free(obj);
          }
        `,
        csharp: code`
          public class FindSumPairs {
              private int[] nums1, nums2;
              private Dictionary<int, int> freq = new Dictionary<int, int>();

              public FindSumPairs(int[] nums1, int[] nums2) {
                  this.nums1 = nums1;
                  this.nums2 = (int[])nums2.Clone();
                  foreach (int y in nums2) Bump(y, 1);
              }

              private void Bump(int v, int d) {
                  int c;
                  freq.TryGetValue(v, out c);
                  freq[v] = c + d;
              }

              public void Add(int index, int value) {
                  Bump(nums2[index], -1);
                  nums2[index] += value;
                  Bump(nums2[index], 1);
              }

              public int Count(int tot) {
                  int total = 0, c;
                  foreach (int x in nums1) if (freq.TryGetValue(tot - x, out c)) total += c; // loop over the short array
                  return total;
              }
          }
        `,
        go: code`
          type FindSumPairs struct {
          	nums1, nums2 []int
          	freq         map[int]int
          }

          func Constructor(nums1 []int, nums2 []int) FindSumPairs {
          	b := make([]int, len(nums2))
          	copy(b, nums2)
          	freq := map[int]int{}
          	for _, y := range nums2 {
          		freq[y]++
          	}
          	return FindSumPairs{nums1: nums1, nums2: b, freq: freq}
          }

          func (this *FindSumPairs) Add(index int, value int) {
          	this.freq[this.nums2[index]]--
          	this.nums2[index] += value
          	this.freq[this.nums2[index]]++
          }

          func (this *FindSumPairs) Count(tot int) int {
          	c := 0
          	for _, x := range this.nums1 { // loop over the short array
          		c += this.freq[tot-x]
          	}
          	return c
          }
        `,
        kotlin: code`
          class FindSumPairs(nums1: IntArray, nums2: IntArray) {
              private val a = nums1
              private val b = nums2.copyOf()
              private val freq = HashMap<Int, Int>()

              init {
                  for (y in b) freq[y] = (freq[y] ?: 0) + 1
              }

              fun add(index: Int, value: Int) {
                  freq[b[index]] = freq[b[index]]!! - 1
                  b[index] += value
                  freq[b[index]] = (freq[b[index]] ?: 0) + 1
              }

              fun count(tot: Int): Int {
                  var c = 0
                  for (x in a) c += freq[tot - x] ?: 0 // loop over the short array
                  return c
              }
          }
        `,
        swift: code`
          class FindSumPairs {
              var nums1: [Int]
              var nums2: [Int]
              var freq: [Int: Int] = [:]

              init(_ nums1: [Int], _ nums2: [Int]) {
                  self.nums1 = nums1
                  self.nums2 = nums2
                  for y in nums2 { freq[y, default: 0] += 1 }
              }

              func add(_ index: Int, _ value: Int) {
                  freq[nums2[index], default: 0] -= 1
                  nums2[index] += value
                  freq[nums2[index], default: 0] += 1
              }

              func count(_ tot: Int) -> Int {
                  var c = 0
                  for x in nums1 { c += freq[tot - x] ?? 0 } // loop over the short array
                  return c
              }
          }
        `,
        rust: code`
          use std::collections::HashMap;

          struct FindSumPairs {
              nums1: Vec<i32>,
              nums2: Vec<i32>,
              freq: HashMap<i32, i32>,
          }

          impl FindSumPairs {
              fn new(nums1: Vec<i32>, nums2: Vec<i32>) -> Self {
                  let mut freq = HashMap::new();
                  for &y in nums2.iter() { *freq.entry(y).or_insert(0) += 1; }
                  FindSumPairs { nums1, nums2, freq }
              }

              fn add(&mut self, index: i32, value: i32) {
                  let i = index as usize;
                  *self.freq.entry(self.nums2[i]).or_insert(0) -= 1;
                  self.nums2[i] += value;
                  *self.freq.entry(self.nums2[i]).or_insert(0) += 1;
              }

              fn count(&mut self, tot: i32) -> i32 {
                  let mut c = 0;
                  for &x in self.nums1.iter() { c += *self.freq.get(&(tot - x)).unwrap_or(&0); } // loop over the short array
                  c
              }
          }
        `,
        php: code`
          class FindSumPairs {
              private $nums1;
              private $nums2;
              private $freq = [];

              function __construct($nums1, $nums2) {
                  $this->nums1 = $nums1;
                  $this->nums2 = $nums2;
                  foreach ($nums2 as $y) $this->freq[$y] = ($this->freq[$y] ?? 0) + 1;
              }

              function add($index, $value) {
                  $this->freq[$this->nums2[$index]]--;
                  $this->nums2[$index] += $value;
                  $v = $this->nums2[$index];
                  $this->freq[$v] = ($this->freq[$v] ?? 0) + 1;
              }

              function count($tot) {
                  $c = 0;
                  foreach ($this->nums1 as $x) $c += $this->freq[$tot - $x] ?? 0; // loop over the short array
                  return $c;
              }
          }
        `,
        ruby: code`
          class FindSumPairs
            def initialize(nums1, nums2)
              @nums1 = nums1
              @nums2 = nums2.dup
              @freq = Hash.new(0)
              nums2.each { |y| @freq[y] += 1 }
            end

            def add(index, value)
              @freq[@nums2[index]] -= 1
              @nums2[index] += value
              @freq[@nums2[index]] += 1
            end

            def count(tot)
              @nums1.sum { |x| @freq.fetch(tot - x, 0) } # loop over the short array
            end
          end
        `,
      },
    };
  })(),

  // ── Operations on Tree (LC 1993) ──────────────────────────────────
  (() => {
    const run: Run = (ops, args) => {
      let parent: number[] = [], locked: number[] = [];
      const isAncestor = (a: number, v: number) => { for (let x = parent[v]; x !== -1; x = parent[x]) if (x === a) return true; return false; };
      return ops.map((op, k) => {
        if (op === "LockingTree") { parent = args[k][0]; locked = parent.map(() => 0); return null; }
        const [num, user] = args[k] as [number, number];
        if (op === "lock") { if (locked[num]) return false; locked[num] = user; return true; }
        if (op === "unlock") { if (locked[num] !== user) return false; locked[num] = 0; return true; }
        if (locked[num]) return false;
        if (parent.some((_, a) => locked[a] && isAncestor(a, num))) return false;
        const desc = parent.map((_, v) => v).filter((v) => locked[v] && isAncestor(num, v));
        if (desc.length === 0) return false;
        for (const v of desc) locked[v] = 0;
        locked[num] = user;
        return true;
      });
    };
    const make = (rng: Rng) => {
      const n = ri(rng, 2, pick(rng, [3, 6, 12, 30]));
      const label = [0, ...shuffle(rng, Array.from({ length: n - 1 }, (_, i) => i + 1))];
      const parent = new Array(n).fill(-1);
      for (let i = 1; i < n; i++) parent[label[i]] = label[ri(rng, Math.max(0, rng() < 0.3 ? i - 1 : 0), i - 1)];
      const ops = ["LockingTree"], args: Args = [[parent]];
      const owner = new Array(n).fill(0);
      for (let m = ri(rng, 1, pick(rng, [3, 10, 25, 40])); m > 0; m--) {
        const num = ri(rng, 0, n - 1), r = rng();
        const user = ri(rng, 1, pick(rng, [1, 2, 3]));
        if (r < 0.45) { ops.push("lock"); args.push([num, user]); if (!owner[num]) owner[num] = user; }
        else if (r < 0.7) { ops.push("unlock"); args.push([num, owner[num] && rng() < 0.7 ? owner[num] : user]); }
        else { ops.push("upgrade"); args.push([num, user]); }
      }
      return { ops, args };
    };
    const ex1: [string[], Args] = [
      ["LockingTree", "lock", "unlock", "unlock", "lock", "upgrade", "lock"],
      [[[-1, 0, 0, 1, 1, 2, 2]], [2, 2], [2, 3], [2, 2], [4, 5], [0, 1], [0, 1]],
    ];
    const ex2: [string[], Args] = [
      ["LockingTree", "lock", "upgrade", "upgrade", "lock", "upgrade"],
      [[[-1, 0, 1, 2]], [3, 7], [2, 4], [0, 9], [1, 5], [2, 6]],
    ];
    return {
      slug: "operations-on-tree",
      title: "Operations on Tree",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Tree", "Depth-First Search", "Breadth-First Search", "Design"],
      signature: {
        funcName: "LockingTree", params: [{ name: "parent", type: "int[]" as const }], returns: "void" as const,
        methods: [
          { name: "lock", params: [{ name: "num", type: "int" as const }, { name: "user", type: "int" as const }], returns: "bool" as const },
          { name: "unlock", params: [{ name: "num", type: "int" as const }, { name: "user", type: "int" as const }], returns: "bool" as const },
          { name: "upgrade", params: [{ name: "num", type: "int" as const }, { name: "user", type: "int" as const }], returns: "bool" as const },
        ],
      },
      description: describe(
        "A tree of `n` nodes, numbered `0` to `n - 1`, is given as a parent array: `parent[i]` is the parent of node `i`, and the root `0` has `parent[0] == -1`. Users lock and unlock its nodes under these rules:\n\n- **Lock** — a node can be locked by a user only if it is currently unlocked. It then belongs to that user.\n- **Unlock** — a node can be unlocked only by the user who locked it.\n- **Upgrade** — a user may lock a node and at the same time unlock all of its descendants, but only if all three hold: the node is unlocked, it has **at least one locked descendant** (locked by anyone), and **none of its ancestors** is locked.\n\nWrite the class `LockingTree`:\n\n- `LockingTree(int[] parent)` builds the tree, all nodes unlocked.\n- `boolean lock(int num, int user)` locks node `num` for `user` if allowed; returns whether it did.\n- `boolean unlock(int num, int user)` unlocks node `num` if `user` holds it; returns whether it did.\n- `boolean upgrade(int num, int user)` performs the upgrade on `num` for `user` if allowed; returns whether it did.\n\n" + CALLS,
        [
          exampleOf(run, ex1[0], ex1[1], "Node 2 is locked by user 2; user 3 cannot unlock it, user 2 can. After user 5 locks node 4, user 1 upgrades the root: it is unlocked, has the locked descendant 4 and no ancestors, so node 4 is unlocked and the root locked for user 1. Locking the root again then fails."),
          exampleOf(run, ex2[0], ex2[1], "The tree is the chain 0-1-2-3 and node 3 is locked. Upgrading 2 succeeds and unlocks 3. Upgrading 0 then succeeds too — 2 is its locked descendant, and is unlocked by it. Once node 1 is locked, upgrading 2 fails: its ancestors 1 and 0 are locked."),
        ],
        ["n == parent.length", "2 <= n <= 2000", "0 <= parent[i] <= n - 1 for i != 0, and parent[0] == -1", "parent describes a valid tree", "0 <= num <= n - 1", "1 <= user <= 10^4", "At most 2000 calls are made to lock, unlock and upgrade in total"]),
      hints: [
        "Keep, for each node, the user who holds it (0 for unlocked). Lock and unlock are then single checks.",
        "For upgrade, the ancestor condition is a walk up the parent pointers. The descendant condition needs to walk down — build each node's list of children once in the constructor.",
        "Check the node and its ancestors first. Then traverse the subtree below `num` (DFS or BFS), unlocking every locked node you meet and noting whether there was one; if there was none, nothing changed and the answer is false, otherwise lock `num` for the user.",
      ],
      editorial: explain({
        idea: "Store the locking user per node and each node's children. Upgrade is a walk up (ancestors) followed by a traversal down (descendants), both bounded by the tree's size.",
        steps: [
          "Constructor: `lockedBy[v] = 0` for every node; `children[parent[i]].append(i)` for `i >= 1`.",
          "`lock(num, user)`: if `lockedBy[num] != 0` return false; else set it to `user` and return true.",
          "`unlock(num, user)`: if `lockedBy[num] != user` return false; else set it to 0 and return true.",
          "`upgrade(num, user)`: return false if `num` is locked or any node on the path `parent[num], parent[parent[num]], …` is locked.",
          "Traverse the subtree under `num` with a stack: every locked node found is unlocked and counted. If the count is 0 return false; otherwise set `lockedBy[num] = user` and return true.",
        ],
        why: "The three upgrade conditions are checked exactly as stated: the first two reads leave the tree unchanged when they fail, and the traversal unlocks descendants only — which is harmless when none are locked, since then nothing is modified before the false is returned. Unlocking during the same traversal that searches for a locked descendant saves a second pass.",
        time: "O(1) for lock and unlock, O(n) for upgrade",
        space: "O(n)",
        pitfalls: [
          "Unlock must compare against the user who locked the node; any other user fails even if the node is locked.",
          "Upgrade needs a locked *descendant*; a locked node elsewhere in the tree does not count, and neither does `num` itself.",
          "Check the ancestors before unlocking anything — otherwise a failing upgrade would already have changed descendants.",
        ],
      }),
      examples: [caseOf(run, ex1[0], ex1[1]), caseOf(run, ex2[0], ex2[1])],
      gen: (rng: Rng) => { const { ops, args } = make(rng); return caseOf(run, ops, args); },
      solutions: {
        python: code`
          class LockingTree:

              def __init__(self, parent: List[int]):
                  self.parent = parent
                  self.children = [[] for _ in parent]
                  for v in range(1, len(parent)):
                      self.children[parent[v]].append(v)
                  self.locked_by = [0] * len(parent)  # 0 = unlocked

              def lock(self, num: int, user: int) -> bool:
                  if self.locked_by[num]:
                      return False
                  self.locked_by[num] = user
                  return True

              def unlock(self, num: int, user: int) -> bool:
                  if self.locked_by[num] != user:
                      return False
                  self.locked_by[num] = 0
                  return True

              def upgrade(self, num: int, user: int) -> bool:
                  lb = self.locked_by
                  if lb[num]:
                      return False
                  a = self.parent[num]
                  while a != -1:  # no locked ancestor
                      if lb[a]:
                          return False
                      a = self.parent[a]
                  found = False
                  stack = list(self.children[num])
                  while stack:  # unlock every locked descendant
                      v = stack.pop()
                      if lb[v]:
                          lb[v] = 0
                          found = True
                      stack.extend(self.children[v])
                  if not found:
                      return False
                  lb[num] = user
                  return True
        `,
        javascript: code`
          var LockingTree = function(parent) {
              this.parent = parent;
              this.children = parent.map(function() { return []; });
              for (var v = 1; v < parent.length; v++) this.children[parent[v]].push(v);
              this.lockedBy = new Array(parent.length).fill(0); // 0 = unlocked
          };

          LockingTree.prototype.lock = function(num, user) {
              if (this.lockedBy[num]) return false;
              this.lockedBy[num] = user;
              return true;
          };

          LockingTree.prototype.unlock = function(num, user) {
              if (this.lockedBy[num] !== user) return false;
              this.lockedBy[num] = 0;
              return true;
          };

          LockingTree.prototype.upgrade = function(num, user) {
              var lb = this.lockedBy;
              if (lb[num]) return false;
              for (var a = this.parent[num]; a !== -1; a = this.parent[a]) if (lb[a]) return false; // no locked ancestor
              var found = false, stack = this.children[num].slice();
              while (stack.length) { // unlock every locked descendant
                  var v = stack.pop();
                  if (lb[v]) { lb[v] = 0; found = true; }
                  for (var i = 0; i < this.children[v].length; i++) stack.push(this.children[v][i]);
              }
              if (!found) return false;
              lb[num] = user;
              return true;
          };
        `,
        typescript: code`
          class LockingTree {
              parent: number[];
              children: number[][];
              lockedBy: number[];

              constructor(parent: number[]) {
                  this.parent = parent;
                  this.children = [];
                  this.lockedBy = []; // 0 = unlocked
                  for (var v = 0; v < parent.length; v++) { this.children.push([]); this.lockedBy.push(0); }
                  for (var v = 1; v < parent.length; v++) this.children[parent[v]].push(v);
              }

              lock(num: number, user: number): boolean {
                  if (this.lockedBy[num]) return false;
                  this.lockedBy[num] = user;
                  return true;
              }

              unlock(num: number, user: number): boolean {
                  if (this.lockedBy[num] !== user) return false;
                  this.lockedBy[num] = 0;
                  return true;
              }

              upgrade(num: number, user: number): boolean {
                  var lb = this.lockedBy;
                  if (lb[num]) return false;
                  for (var a = this.parent[num]; a !== -1; a = this.parent[a]) if (lb[a]) return false; // no locked ancestor
                  var found = false, stack = this.children[num].slice();
                  while (stack.length) { // unlock every locked descendant
                      var v = stack.pop();
                      if (lb[v]) { lb[v] = 0; found = true; }
                      for (var i = 0; i < this.children[v].length; i++) stack.push(this.children[v][i]);
                  }
                  if (!found) return false;
                  lb[num] = user;
                  return true;
              }
          }
        `,
        java: code`
          class LockingTree {
              private int[] parent, lockedBy; // lockedBy 0 = unlocked
              private List<List<Integer>> children = new ArrayList<>();

              public LockingTree(int[] parent) {
                  this.parent = parent;
                  lockedBy = new int[parent.length];
                  for (int v = 0; v < parent.length; v++) children.add(new ArrayList<>());
                  for (int v = 1; v < parent.length; v++) children.get(parent[v]).add(v);
              }

              public boolean lock(int num, int user) {
                  if (lockedBy[num] != 0) return false;
                  lockedBy[num] = user;
                  return true;
              }

              public boolean unlock(int num, int user) {
                  if (lockedBy[num] != user) return false;
                  lockedBy[num] = 0;
                  return true;
              }

              public boolean upgrade(int num, int user) {
                  if (lockedBy[num] != 0) return false;
                  for (int a = parent[num]; a != -1; a = parent[a]) if (lockedBy[a] != 0) return false; // no locked ancestor
                  boolean found = false;
                  Deque<Integer> stack = new ArrayDeque<>(children.get(num));
                  while (!stack.isEmpty()) { // unlock every locked descendant
                      int v = stack.pop();
                      if (lockedBy[v] != 0) { lockedBy[v] = 0; found = true; }
                      for (int c : children.get(v)) stack.push(c);
                  }
                  if (!found) return false;
                  lockedBy[num] = user;
                  return true;
              }
          }
        `,
        cpp: code`
          class LockingTree {
              vector<int> parent, lockedBy; // lockedBy 0 = unlocked
              vector<vector<int>> children;
          public:
              LockingTree(vector<int>& parent) : parent(parent), lockedBy(parent.size(), 0), children(parent.size()) {
                  for (int v = 1; v < (int)parent.size(); v++) children[parent[v]].push_back(v);
              }

              bool lock(int num, int user) {
                  if (lockedBy[num]) return false;
                  lockedBy[num] = user;
                  return true;
              }

              bool unlock(int num, int user) {
                  if (lockedBy[num] != user) return false;
                  lockedBy[num] = 0;
                  return true;
              }

              bool upgrade(int num, int user) {
                  if (lockedBy[num]) return false;
                  for (int a = parent[num]; a != -1; a = parent[a]) if (lockedBy[a]) return false; // no locked ancestor
                  bool found = false;
                  vector<int> stack(children[num].begin(), children[num].end());
                  while (!stack.empty()) { // unlock every locked descendant
                      int v = stack.back();
                      stack.pop_back();
                      if (lockedBy[v]) { lockedBy[v] = 0; found = true; }
                      for (int c : children[v]) stack.push_back(c);
                  }
                  if (!found) return false;
                  lockedBy[num] = user;
                  return true;
              }
          };
        `,
        c: code`
          typedef struct {
              int n;
              int* parent;
              int* lockedBy; /* 0 = unlocked */
              int* start;    /* children of v are kids[start[v] .. start[v + 1] - 1] */
              int* kids;
              int* stack;
          } LockingTree;

          LockingTree* lockingTreeCreate(int* parent, int parentSize) {
              int n = parentSize;
              LockingTree* o = (LockingTree*)malloc(sizeof(LockingTree));
              o->n = n;
              o->parent = (int*)malloc(n * sizeof(int));
              memcpy(o->parent, parent, n * sizeof(int));
              o->lockedBy = (int*)calloc(n, sizeof(int));
              o->start = (int*)calloc(n + 1, sizeof(int));
              o->kids = (int*)malloc(n * sizeof(int));
              o->stack = (int*)malloc(n * sizeof(int));
              for (int v = 1; v < n; v++) o->start[parent[v] + 1]++;
              for (int v = 0; v < n; v++) o->start[v + 1] += o->start[v];
              int* fill = (int*)malloc(n * sizeof(int));
              memcpy(fill, o->start, n * sizeof(int));
              for (int v = 1; v < n; v++) o->kids[fill[parent[v]]++] = v;
              free(fill);
              return o;
          }

          bool lockingTreeLock(LockingTree* obj, int num, int user) {
              if (obj->lockedBy[num]) return false;
              obj->lockedBy[num] = user;
              return true;
          }

          bool lockingTreeUnlock(LockingTree* obj, int num, int user) {
              if (obj->lockedBy[num] != user) return false;
              obj->lockedBy[num] = 0;
              return true;
          }

          bool lockingTreeUpgrade(LockingTree* obj, int num, int user) {
              if (obj->lockedBy[num]) return false;
              for (int a = obj->parent[num]; a != -1; a = obj->parent[a]) if (obj->lockedBy[a]) return false; /* no locked ancestor */
              bool found = false;
              int top = 0;
              for (int i = obj->start[num]; i < obj->start[num + 1]; i++) obj->stack[top++] = obj->kids[i];
              while (top > 0) { /* unlock every locked descendant */
                  int v = obj->stack[--top];
                  if (obj->lockedBy[v]) { obj->lockedBy[v] = 0; found = true; }
                  for (int i = obj->start[v]; i < obj->start[v + 1]; i++) obj->stack[top++] = obj->kids[i];
              }
              if (!found) return false;
              obj->lockedBy[num] = user;
              return true;
          }

          void lockingTreeFree(LockingTree* obj) {
              free(obj->parent); free(obj->lockedBy); free(obj->start); free(obj->kids); free(obj->stack);
              free(obj);
          }
        `,
        csharp: code`
          public class LockingTree {
              private int[] parent, lockedBy; // lockedBy 0 = unlocked
              private List<int>[] children;

              public LockingTree(int[] parent) {
                  this.parent = parent;
                  lockedBy = new int[parent.Length];
                  children = new List<int>[parent.Length];
                  for (int v = 0; v < parent.Length; v++) children[v] = new List<int>();
                  for (int v = 1; v < parent.Length; v++) children[parent[v]].Add(v);
              }

              public bool Lock(int num, int user) {
                  if (lockedBy[num] != 0) return false;
                  lockedBy[num] = user;
                  return true;
              }

              public bool Unlock(int num, int user) {
                  if (lockedBy[num] != user) return false;
                  lockedBy[num] = 0;
                  return true;
              }

              public bool Upgrade(int num, int user) {
                  if (lockedBy[num] != 0) return false;
                  for (int a = parent[num]; a != -1; a = parent[a]) if (lockedBy[a] != 0) return false; // no locked ancestor
                  bool found = false;
                  var stack = new Stack<int>(children[num]);
                  while (stack.Count > 0) { // unlock every locked descendant
                      int v = stack.Pop();
                      if (lockedBy[v] != 0) { lockedBy[v] = 0; found = true; }
                      foreach (int c in children[v]) stack.Push(c);
                  }
                  if (!found) return false;
                  lockedBy[num] = user;
                  return true;
              }
          }
        `,
        go: code`
          type LockingTree struct {
          	parent, lockedBy []int // lockedBy 0 = unlocked
          	children         [][]int
          }

          func Constructor(parent []int) LockingTree {
          	children := make([][]int, len(parent))
          	for v := 1; v < len(parent); v++ {
          		children[parent[v]] = append(children[parent[v]], v)
          	}
          	return LockingTree{parent: parent, lockedBy: make([]int, len(parent)), children: children}
          }

          func (this *LockingTree) Lock(num int, user int) bool {
          	if this.lockedBy[num] != 0 {
          		return false
          	}
          	this.lockedBy[num] = user
          	return true
          }

          func (this *LockingTree) Unlock(num int, user int) bool {
          	if this.lockedBy[num] != user {
          		return false
          	}
          	this.lockedBy[num] = 0
          	return true
          }

          func (this *LockingTree) Upgrade(num int, user int) bool {
          	if this.lockedBy[num] != 0 {
          		return false
          	}
          	for a := this.parent[num]; a != -1; a = this.parent[a] { // no locked ancestor
          		if this.lockedBy[a] != 0 {
          			return false
          		}
          	}
          	found := false
          	stack := append([]int{}, this.children[num]...)
          	for len(stack) > 0 { // unlock every locked descendant
          		v := stack[len(stack)-1]
          		stack = stack[:len(stack)-1]
          		if this.lockedBy[v] != 0 {
          			this.lockedBy[v] = 0
          			found = true
          		}
          		stack = append(stack, this.children[v]...)
          	}
          	if !found {
          		return false
          	}
          	this.lockedBy[num] = user
          	return true
          }
        `,
        kotlin: code`
          class LockingTree(parent: IntArray) {
              private val parent = parent
              private val lockedBy = IntArray(parent.size) // 0 = unlocked
              private val children = Array(parent.size) { ArrayList<Int>() }

              init {
                  for (v in 1 until parent.size) children[parent[v]].add(v)
              }

              fun lock(num: Int, user: Int): Boolean {
                  if (lockedBy[num] != 0) return false
                  lockedBy[num] = user
                  return true
              }

              fun unlock(num: Int, user: Int): Boolean {
                  if (lockedBy[num] != user) return false
                  lockedBy[num] = 0
                  return true
              }

              fun upgrade(num: Int, user: Int): Boolean {
                  if (lockedBy[num] != 0) return false
                  var a = parent[num]
                  while (a != -1) { // no locked ancestor
                      if (lockedBy[a] != 0) return false
                      a = parent[a]
                  }
                  var found = false
                  val stack = ArrayList<Int>(children[num])
                  while (stack.isNotEmpty()) { // unlock every locked descendant
                      val v = stack.removeAt(stack.size - 1)
                      if (lockedBy[v] != 0) { lockedBy[v] = 0; found = true }
                      stack.addAll(children[v])
                  }
                  if (!found) return false
                  lockedBy[num] = user
                  return true
              }
          }
        `,
        swift: code`
          class LockingTree {
              var parent: [Int]
              var lockedBy: [Int] // 0 = unlocked
              var children: [[Int]]

              init(_ parent: [Int]) {
                  self.parent = parent
                  lockedBy = [Int](repeating: 0, count: parent.count)
                  children = [[Int]](repeating: [], count: parent.count)
                  for v in 1..<parent.count { children[parent[v]].append(v) }
              }

              func lock(_ num: Int, _ user: Int) -> Bool {
                  if lockedBy[num] != 0 { return false }
                  lockedBy[num] = user
                  return true
              }

              func unlock(_ num: Int, _ user: Int) -> Bool {
                  if lockedBy[num] != user { return false }
                  lockedBy[num] = 0
                  return true
              }

              func upgrade(_ num: Int, _ user: Int) -> Bool {
                  if lockedBy[num] != 0 { return false }
                  var a = parent[num]
                  while a != -1 { // no locked ancestor
                      if lockedBy[a] != 0 { return false }
                      a = parent[a]
                  }
                  var found = false
                  var stack = children[num]
                  while let v = stack.popLast() { // unlock every locked descendant
                      if lockedBy[v] != 0 { lockedBy[v] = 0; found = true }
                      stack.append(contentsOf: children[v])
                  }
                  if !found { return false }
                  lockedBy[num] = user
                  return true
              }
          }
        `,
        rust: code`
          struct LockingTree {
              parent: Vec<i32>,
              locked_by: Vec<i32>, // 0 = unlocked
              children: Vec<Vec<usize>>,
          }

          impl LockingTree {
              fn new(parent: Vec<i32>) -> Self {
                  let n = parent.len();
                  let mut children = vec![Vec::new(); n];
                  for v in 1..n { children[parent[v] as usize].push(v); }
                  LockingTree { parent, locked_by: vec![0; n], children }
              }

              fn lock(&mut self, num: i32, user: i32) -> bool {
                  let i = num as usize;
                  if self.locked_by[i] != 0 { return false; }
                  self.locked_by[i] = user;
                  true
              }

              fn unlock(&mut self, num: i32, user: i32) -> bool {
                  let i = num as usize;
                  if self.locked_by[i] != user { return false; }
                  self.locked_by[i] = 0;
                  true
              }

              fn upgrade(&mut self, num: i32, user: i32) -> bool {
                  let i = num as usize;
                  if self.locked_by[i] != 0 { return false; }
                  let mut a = self.parent[i];
                  while a != -1 { // no locked ancestor
                      if self.locked_by[a as usize] != 0 { return false; }
                      a = self.parent[a as usize];
                  }
                  let mut found = false;
                  let mut stack: Vec<usize> = self.children[i].clone();
                  while let Some(v) = stack.pop() { // unlock every locked descendant
                      if self.locked_by[v] != 0 { self.locked_by[v] = 0; found = true; }
                      stack.extend(self.children[v].iter().cloned());
                  }
                  if !found { return false; }
                  self.locked_by[i] = user;
                  true
              }
          }
        `,
        php: code`
          class LockingTree {
              private $parent;
              private $lockedBy; // 0 = unlocked
              private $children;

              function __construct($parent) {
                  $n = count($parent);
                  $this->parent = $parent;
                  $this->lockedBy = array_fill(0, $n, 0);
                  $this->children = array_fill(0, $n, []);
                  for ($v = 1; $v < $n; $v++) $this->children[$parent[$v]][] = $v;
              }

              function lock($num, $user) {
                  if ($this->lockedBy[$num] != 0) return false;
                  $this->lockedBy[$num] = $user;
                  return true;
              }

              function unlock($num, $user) {
                  if ($this->lockedBy[$num] != $user) return false;
                  $this->lockedBy[$num] = 0;
                  return true;
              }

              function upgrade($num, $user) {
                  if ($this->lockedBy[$num] != 0) return false;
                  for ($a = $this->parent[$num]; $a != -1; $a = $this->parent[$a]) if ($this->lockedBy[$a] != 0) return false; // no locked ancestor
                  $found = false;
                  $stack = $this->children[$num];
                  while ($stack) { // unlock every locked descendant
                      $v = array_pop($stack);
                      if ($this->lockedBy[$v] != 0) { $this->lockedBy[$v] = 0; $found = true; }
                      foreach ($this->children[$v] as $c) $stack[] = $c;
                  }
                  if (!$found) return false;
                  $this->lockedBy[$num] = $user;
                  return true;
              }
          }
        `,
        ruby: code`
          class LockingTree
            def initialize(parent)
              @parent = parent
              @locked_by = Array.new(parent.length, 0) # 0 = unlocked
              @children = Array.new(parent.length) { [] }
              (1...parent.length).each { |v| @children[parent[v]] << v }
            end

            def lock(num, user)
              return false if @locked_by[num] != 0
              @locked_by[num] = user
              true
            end

            def unlock(num, user)
              return false if @locked_by[num] != user
              @locked_by[num] = 0
              true
            end

            def upgrade(num, user)
              return false if @locked_by[num] != 0
              a = @parent[num]
              while a != -1 # no locked ancestor
                return false if @locked_by[a] != 0
                a = @parent[a]
              end
              found = false
              stack = @children[num].dup
              until stack.empty? # unlock every locked descendant
                v = stack.pop
                if @locked_by[v] != 0
                  @locked_by[v] = 0
                  found = true
                end
                stack.concat(@children[v])
              end
              return false unless found
              @locked_by[num] = user
              true
            end
          end
        `,
      },
    };
  })(),

  // ── Detect Squares (LC 2013) ──────────────────────────────────────
  (() => {
    const run: Run = (ops, args) => {
      const pts: Array<[number, number]> = [];
      return ops.map((op, k) => {
        if (op === "DetectSquares") return null;
        const [x, y] = args[k][0] as [number, number];
        if (op === "add") { pts.push([x, y]); return null; }
        // Brute force: every added point as the diagonal corner, the other two counted directly.
        const has = (a: number, b: number) => pts.filter(([px, py]) => px === a && py === b).length;
        let c = 0;
        for (const [px, py] of pts) if (px !== x && Math.abs(px - x) === Math.abs(py - y)) c += has(x, py) * has(px, y);
        return c;
      });
    };
    const make = (rng: Rng) => {
      const span = pick(rng, [1, 2, 3, 5]);
      const bx = rng() < 0.15 ? 1000 - span : ri(rng, 0, 20), by = rng() < 0.15 ? 1000 - span : ri(rng, 0, 20);
      const pt = () => [bx + ri(rng, 0, span), by + ri(rng, 0, span)];
      const ops = ["DetectSquares"], args: Args = [[]];
      for (let m = ri(rng, 1, pick(rng, [3, 10, 25, 40])); m > 0; m--) {
        ops.push(rng() < 0.65 ? "add" : "count");
        args.push([pt()]);
      }
      return { ops, args };
    };
    const ex1: [string[], Args] = [
      ["DetectSquares", "add", "add", "add", "count", "count", "add", "count"],
      [[], [[3, 10]], [[11, 2]], [[3, 2]], [[11, 10]], [[14, 8]], [[11, 2]], [[11, 10]]],
    ];
    const ex2: [string[], Args] = [
      ["DetectSquares", "add", "add", "add", "add", "add", "count"],
      [[], [[1, 1]], [[1, 2]], [[2, 1]], [[0, 1]], [[1, 0]], [[2, 2]]],
    ];
    return {
      slug: "detect-squares",
      title: "Detect Squares",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Counting", "Design", "Google"],
      signature: {
        funcName: "DetectSquares", params: [], returns: "void" as const,
        methods: [
          { name: "add", params: [{ name: "point", type: "int[]" as const }], returns: "void" as const },
          { name: "count", params: [{ name: "point", type: "int[]" as const }], returns: "int" as const },
        ],
      },
      description: describe(
        "Points on a grid arrive one at a time; the same point may be added many times, and each copy counts separately.\n\nWrite the class `DetectSquares`:\n\n- `DetectSquares()` starts with no points.\n- `void add(int[] point)` adds the point `point = [x, y]`.\n- `int count(int[] point)` returns the number of ways to choose **three added points** that, together with the query point, form an **axis-aligned square with positive area** (sides parallel to the axes). Copies of a point are different choices.\n\n" + CALLS,
        [
          exampleOf(run, ex1[0], ex1[1], "With (3,10), (11,2) and (3,2), the query (11,10) closes one square of side 8. No square has (14,8) as a corner. After (11,2) is added a second time there are two ways to choose the three points."),
          exampleOf(run, ex2[0], ex2[1], "Only the unit square with corners (1,1), (1,2), (2,1) and (2,2) uses the query point; (0,1) and (1,0) form no square with it."),
        ],
        ["point.length == 2", "0 <= x, y <= 1000", "At most 3000 calls are made to add and count in total", "So every answer is below (3000 / 3)^3 = 10^9 and fits a signed 32-bit integer"]),
      hints: [
        "A square is fixed by two opposite corners. Given the query point, which added point should you guess?",
        "Try every distinct added point `(px, py)` as the corner diagonal to the query `(x, y)`: it must satisfy `|px - x| == |py - y| != 0`.",
        "The other two corners are then `(x, py)` and `(px, y)`. Keep a count per point in a hash map; each diagonal contributes `count(px, py) · count(x, py) · count(px, y)` ways.",
      ],
      editorial: explain({
        idea: "Count every point's copies in a hash map. For a query, each possible diagonal corner determines the whole square, and the number of ways is the product of the three corners' counts.",
        steps: [
          "`add([x, y])`: increment `cnt[(x, y)]`; remember the point in a list of distinct points the first time it appears.",
          "`count([x, y])`: for every distinct point `(px, py)` with `px != x` and `|px - x| == |py - y|`, add `cnt[(px, py)] · cnt[(x, py)] · cnt[(px, y)]`.",
          "Return the sum.",
        ],
        why: "In an axis-aligned square the query's opposite corner differs from it by the same non-zero amount in both coordinates, and the remaining corners share one coordinate with each — so every square is found exactly once, through its diagonal corner. Choosing one copy of each of the three corners independently gives the product of their counts; a missing corner contributes 0.",
        time: "O(1) per add, O(d) per count for d distinct points",
        space: "O(d)",
        pitfalls: [
          "`px != x` is needed: a diagonal with zero offset would be a square of area 0.",
          "Iterate distinct points with their counts, not every added copy — otherwise copies are counted twice over.",
          "Squares must be axis-aligned; tilted squares do not count.",
        ],
      }),
      examples: [caseOf(run, ex1[0], ex1[1]), caseOf(run, ex2[0], ex2[1])],
      gen: (rng: Rng) => { const { ops, args } = make(rng); return caseOf(run, ops, args); },
      solutions: {
        python: code`
          class DetectSquares:

              def __init__(self):
                  self.cnt = {}

              def add(self, point: List[int]) -> None:
                  p = (point[0], point[1])
                  self.cnt[p] = self.cnt.get(p, 0) + 1

              def count(self, point: List[int]) -> int:
                  x, y = point
                  cnt, res = self.cnt, 0
                  for (px, py), c in cnt.items():  # (px, py) as the corner opposite the query
                      if px != x and abs(px - x) == abs(py - y):
                          res += c * cnt.get((x, py), 0) * cnt.get((px, y), 0)
                  return res
        `,
        javascript: code`
          var DetectSquares = function() {
              this.cnt = new Map(); // x * 1001 + y -> copies
          };

          DetectSquares.prototype.add = function(point) {
              var k = point[0] * 1001 + point[1];
              this.cnt.set(k, (this.cnt.get(k) || 0) + 1);
          };

          DetectSquares.prototype.count = function(point) {
              var x = point[0], y = point[1], cnt = this.cnt, res = 0;
              cnt.forEach(function(c, k) { // (px, py) as the corner opposite the query
                  var px = Math.floor(k / 1001), py = k % 1001;
                  if (px !== x && Math.abs(px - x) === Math.abs(py - y))
                      res += c * (cnt.get(x * 1001 + py) || 0) * (cnt.get(px * 1001 + y) || 0);
              });
              return res;
          };
        `,
        typescript: code`
          class DetectSquares {
              cnt: { [key: number]: number };
              keys: number[];

              constructor() {
                  this.cnt = {}; // x * 1001 + y -> copies
                  this.keys = [];
              }

              add(point: number[]): void {
                  var k = point[0] * 1001 + point[1];
                  if (!this.cnt[k]) { this.cnt[k] = 0; this.keys.push(k); }
                  this.cnt[k]++;
              }

              count(point: number[]): number {
                  var x = point[0], y = point[1], res = 0;
                  for (var i = 0; i < this.keys.length; i++) { // (px, py) as the corner opposite the query
                      var k = this.keys[i], px = Math.floor(k / 1001), py = k % 1001;
                      if (px !== x && Math.abs(px - x) === Math.abs(py - y))
                          res += this.cnt[k] * (this.cnt[x * 1001 + py] || 0) * (this.cnt[px * 1001 + y] || 0);
                  }
                  return res;
              }
          }
        `,
        java: code`
          class DetectSquares {
              private HashMap<Integer, Integer> cnt = new HashMap<>(); // x * 1001 + y -> copies

              public DetectSquares() {
              }

              public void add(int[] point) {
                  cnt.merge(point[0] * 1001 + point[1], 1, Integer::sum);
              }

              public int count(int[] point) {
                  int x = point[0], y = point[1], res = 0;
                  for (Map.Entry<Integer, Integer> e : cnt.entrySet()) { // (px, py) as the corner opposite the query
                      int px = e.getKey() / 1001, py = e.getKey() % 1001;
                      if (px != x && Math.abs(px - x) == Math.abs(py - y))
                          res += e.getValue() * cnt.getOrDefault(x * 1001 + py, 0) * cnt.getOrDefault(px * 1001 + y, 0);
                  }
                  return res;
              }
          }
        `,
        cpp: code`
          class DetectSquares {
              unordered_map<int, int> cnt; // x * 1001 + y -> copies

              int get(int x, int y) {
                  auto it = cnt.find(x * 1001 + y);
                  return it == cnt.end() ? 0 : it->second;
              }
          public:
              DetectSquares() {}

              void add(vector<int> point) {
                  cnt[point[0] * 1001 + point[1]]++;
              }

              int count(vector<int> point) {
                  int x = point[0], y = point[1], res = 0;
                  for (auto& e : cnt) { // (px, py) as the corner opposite the query
                      int px = e.first / 1001, py = e.first % 1001;
                      if (px != x && abs(px - x) == abs(py - y)) res += e.second * get(x, py) * get(px, y);
                  }
                  return res;
              }
          };
        `,
        c: code`
          /* Coordinates are at most 1000, so the counts live in a 1001 x 1001 grid
             (calloc'd, untouched pages cost nothing) plus a list of distinct points. */
          typedef struct {
              int* grid;
              int* pts; /* distinct points as x * 1001 + y */
              int n, cap;
          } DetectSquares;

          DetectSquares* detectSquaresCreate() {
              DetectSquares* o = (DetectSquares*)malloc(sizeof(DetectSquares));
              o->grid = (int*)calloc(1001 * 1001, sizeof(int));
              o->n = 0;
              o->cap = 16;
              o->pts = (int*)malloc(16 * sizeof(int));
              return o;
          }

          void detectSquaresAdd(DetectSquares* obj, int* point, int pointSize) {
              int k = point[0] * 1001 + point[1];
              if (obj->grid[k]++ == 0) {
                  if (obj->n == obj->cap) { obj->cap *= 2; obj->pts = (int*)realloc(obj->pts, obj->cap * sizeof(int)); }
                  obj->pts[obj->n++] = k;
              }
          }

          int detectSquaresCount(DetectSquares* obj, int* point, int pointSize) {
              int x = point[0], y = point[1], res = 0;
              for (int i = 0; i < obj->n; i++) { /* (px, py) as the corner opposite the query */
                  int px = obj->pts[i] / 1001, py = obj->pts[i] % 1001;
                  int dx = px > x ? px - x : x - px, dy = py > y ? py - y : y - py;
                  if (dx != 0 && dx == dy) res += obj->grid[obj->pts[i]] * obj->grid[x * 1001 + py] * obj->grid[px * 1001 + y];
              }
              return res;
          }

          void detectSquaresFree(DetectSquares* obj) {
              free(obj->grid);
              free(obj->pts);
              free(obj);
          }
        `,
        csharp: code`
          public class DetectSquares {
              private Dictionary<int, int> cnt = new Dictionary<int, int>(); // x * 1001 + y -> copies

              public DetectSquares() {
              }

              private int Get(int k) { int c; return cnt.TryGetValue(k, out c) ? c : 0; }

              public void Add(int[] point) {
                  int k = point[0] * 1001 + point[1];
                  cnt[k] = Get(k) + 1;
              }

              public int Count(int[] point) {
                  int x = point[0], y = point[1], res = 0;
                  foreach (var e in cnt) { // (px, py) as the corner opposite the query
                      int px = e.Key / 1001, py = e.Key % 1001;
                      if (px != x && Math.Abs(px - x) == Math.Abs(py - y)) res += e.Value * Get(x * 1001 + py) * Get(px * 1001 + y);
                  }
                  return res;
              }
          }
        `,
        go: code`
          type DetectSquares struct {
          	cnt map[int]int // x * 1001 + y -> copies
          }

          func Constructor() DetectSquares {
          	return DetectSquares{cnt: map[int]int{}}
          }

          func (this *DetectSquares) Add(point []int) {
          	this.cnt[point[0]*1001+point[1]]++
          }

          func (this *DetectSquares) Count(point []int) int {
          	x, y, res := point[0], point[1], 0
          	for k, c := range this.cnt { // (px, py) as the corner opposite the query
          		px, py := k/1001, k%1001
          		dx, dy := px-x, py-y
          		if dx < 0 {
          			dx = -dx
          		}
          		if dy < 0 {
          			dy = -dy
          		}
          		if dx != 0 && dx == dy {
          			res += c * this.cnt[x*1001+py] * this.cnt[px*1001+y]
          		}
          	}
          	return res
          }
        `,
        kotlin: code`
          class DetectSquares() {
              private val cnt = HashMap<Int, Int>() // x * 1001 + y -> copies

              fun add(point: IntArray) {
                  val k = point[0] * 1001 + point[1]
                  cnt[k] = (cnt[k] ?: 0) + 1
              }

              fun count(point: IntArray): Int {
                  val x = point[0]
                  val y = point[1]
                  var res = 0
                  for ((k, c) in cnt) { // (px, py) as the corner opposite the query
                      val px = k / 1001
                      val py = k % 1001
                      if (px != x && Math.abs(px - x) == Math.abs(py - y))
                          res += c * (cnt[x * 1001 + py] ?: 0) * (cnt[px * 1001 + y] ?: 0)
                  }
                  return res
              }
          }
        `,
        swift: code`
          class DetectSquares {
              var cnt: [Int: Int] = [:] // x * 1001 + y -> copies

              init() {}

              func add(_ point: [Int]) {
                  cnt[point[0] * 1001 + point[1], default: 0] += 1
              }

              func count(_ point: [Int]) -> Int {
                  let x = point[0], y = point[1]
                  var res = 0
                  for (k, c) in cnt { // (px, py) as the corner opposite the query
                      let px = k / 1001, py = k % 1001
                      if px != x && abs(px - x) == abs(py - y) {
                          res += c * (cnt[x * 1001 + py] ?? 0) * (cnt[px * 1001 + y] ?? 0)
                      }
                  }
                  return res
              }
          }
        `,
        rust: code`
          use std::collections::HashMap;

          struct DetectSquares {
              cnt: HashMap<i32, i32>, // x * 1001 + y -> copies
          }

          impl DetectSquares {
              fn new() -> Self {
                  DetectSquares { cnt: HashMap::new() }
              }

              fn add(&mut self, point: Vec<i32>) {
                  *self.cnt.entry(point[0] * 1001 + point[1]).or_insert(0) += 1;
              }

              fn count(&mut self, point: Vec<i32>) -> i32 {
                  let (x, y) = (point[0], point[1]);
                  let mut res = 0;
                  for (&k, &c) in self.cnt.iter() { // (px, py) as the corner opposite the query
                      let (px, py) = (k / 1001, k % 1001);
                      if px != x && (px - x).abs() == (py - y).abs() {
                          let a = *self.cnt.get(&(x * 1001 + py)).unwrap_or(&0);
                          let b = *self.cnt.get(&(px * 1001 + y)).unwrap_or(&0);
                          res += c * a * b;
                      }
                  }
                  res
              }
          }
        `,
        php: code`
          class DetectSquares {
              private $cnt = []; // x * 1001 + y -> copies

              function __construct() {
              }

              function add($point) {
                  $k = $point[0] * 1001 + $point[1];
                  $this->cnt[$k] = ($this->cnt[$k] ?? 0) + 1;
              }

              function count($point) {
                  [$x, $y] = $point;
                  $res = 0;
                  foreach ($this->cnt as $k => $c) { // (px, py) as the corner opposite the query
                      $px = intdiv($k, 1001); $py = $k % 1001;
                      if ($px != $x && abs($px - $x) == abs($py - $y))
                          $res += $c * ($this->cnt[$x * 1001 + $py] ?? 0) * ($this->cnt[$px * 1001 + $y] ?? 0);
                  }
                  return $res;
              }
          }
        `,
        ruby: code`
          class DetectSquares
            def initialize
              @cnt = Hash.new(0) # [x, y] -> copies
            end

            def add(point)
              @cnt[[point[0], point[1]]] += 1
            end

            def count(point)
              x, y = point
              res = 0
              @cnt.each do |(px, py), c| # (px, py) as the corner opposite the query
                next if px == x || (px - x).abs != (py - y).abs
                res += c * @cnt.fetch([x, py], 0) * @cnt.fetch([px, y], 0)
              end
              res
            end
          end
        `,
      },
    };
  })(),

  // ── Stock Price Fluctuation (LC 2034) ─────────────────────────────
  (() => {
    const run: Run = (ops, args) => {
      const price = new Map<number, number>();
      let latest = 0;
      return ops.map((op, k) => {
        if (op === "StockPrice") return null;
        if (op === "update") { price.set(args[k][0], args[k][1]); latest = Math.max(latest, args[k][0]); return null; }
        if (op === "current") return price.get(latest) as number;
        const all = [...price.values()];
        return op === "maximum" ? Math.max(...all) : Math.min(...all);
      });
    };
    const make = (rng: Rng) => {
      const tsHi = rng() < 0.1 ? 1000000000 : pick(rng, [2, 4, 8, 20]);
      const pHi = rng() < 0.2 ? 1000000000 : pick(rng, [3, 10, 50]);
      const ops = ["StockPrice"], args: Args = [[]];
      let any = false;
      for (let m = ri(rng, 1, pick(rng, [3, 10, 25, 40])); m > 0; m--) {
        if (!any || rng() < 0.5) { ops.push("update"); args.push([ri(rng, 1, tsHi), ri(rng, 1, pHi)]); any = true; }
        else { ops.push(pick(rng, ["current", "maximum", "minimum"])); args.push([]); }
      }
      return { ops, args };
    };
    const ex1: [string[], Args] = [
      ["StockPrice", "update", "update", "current", "maximum", "update", "maximum", "update", "minimum"],
      [[], [1, 10], [2, 5], [], [], [1, 3], [], [4, 2], []],
    ];
    const ex2: [string[], Args] = [
      ["StockPrice", "update", "update", "current", "update", "current", "minimum"],
      [[], [7, 40], [3, 90], [], [7, 100], [], []],
    ];
    return {
      slug: "stock-price-fluctuation",
      title: "Stock Price Fluctuation",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "Design", "Heap (Priority Queue)", "Ordered Set", "Atlassian", "Google", "Amazon"],
      signature: {
        funcName: "StockPrice", params: [], returns: "void" as const,
        methods: [
          { name: "update", params: [{ name: "timestamp", type: "int" as const }, { name: "price", type: "int" as const }], returns: "void" as const },
          { name: "current", params: [], returns: "int" as const },
          { name: "maximum", params: [], returns: "int" as const },
          { name: "minimum", params: [], returns: "int" as const },
        ],
      },
      description: describe(
        "A feed reports a stock's price at various timestamps, but the records arrive **out of order**, and some are corrections: a later record for a timestamp that was already reported replaces the earlier price for that timestamp.\n\nWrite the class `StockPrice`:\n\n- `StockPrice()` starts with no records.\n- `void update(int timestamp, int price)` records that the price at `timestamp` is `price` (correcting any earlier record for that timestamp).\n- `int current()` returns the price at the **latest timestamp** recorded.\n- `int maximum()` and `int minimum()` return the highest and lowest price over all timestamps, using the current (corrected) price of each.\n\n" + CALLS,
        [
          exampleOf(run, ex1[0], ex1[1], "After prices 10 at time 1 and 5 at time 2, the latest timestamp is 2 (price 5) and the maximum is 10. Correcting time 1 to 3 makes the maximum 5. With 2 at time 4, the minimum is 2."),
          exampleOf(run, ex2[0], ex2[1], "Time 3 arrives after time 7 but is older, so current stays 40. Correcting time 7 to 100 changes current to 100; the minimum is then 90."),
        ],
        ["1 <= timestamp, price <= 10^9", "At most 10^5 calls are made to update, current, maximum and minimum in total", "current, maximum and minimum are called only after at least one update"]),
      hints: [
        "Keep a map from timestamp to its current price, and track the largest timestamp seen — that answers `current`.",
        "For `maximum`/`minimum` you need the extremes of a multiset of prices that supports replacing one value: an ordered map from price to how many timestamps hold it does that in O(log n).",
        "Alternatively push every `(price, timestamp)` into a max-heap and a min-heap and discard stale entries lazily: when the top's price no longer equals the map's price for its timestamp, pop it and look again.",
      ],
      editorial: explain({
        idea: "A hash map holds each timestamp's current price; an ordered multiset (or two heaps with lazy deletion) holds the prices so the extremes come out in O(log n) even after corrections.",
        steps: [
          "`update(t, p)`: if `t` already has a price `old`, remove one copy of `old` from the multiset. Store `price[t] = p`, add `p` to the multiset, and set `latest = max(latest, t)`.",
          "`current()`: return `price[latest]`.",
          "`maximum()` / `minimum()`: return the multiset's largest / smallest key.",
          "Heap variant: push `(p, t)` into both heaps on every update; before answering, pop the top while `price[top.t] != top.p` (it was corrected).",
        ],
        why: "The multiset always contains exactly one entry per timestamp — its current price — because a correction removes the old value before adding the new. Its extremes are therefore the answers. In the heap variant every stale entry is recognised by comparing with the map, and an entry that matches is a live price, so the first matching top is the true extreme; each entry is popped at most once.",
        time: "O(log n) per update, maximum and minimum (amortised for the heaps); O(1) for current",
        space: "O(n)",
        pitfalls: [
          "`current` is the price at the largest timestamp, not the most recent call — records arrive out of order.",
          "A correction must remove the old price; otherwise maximum and minimum can return a price that no longer exists.",
          "With a multiset, erase one copy of the old price, not all of them — two timestamps may share a price.",
        ],
      }),
      examples: [caseOf(run, ex1[0], ex1[1]), caseOf(run, ex2[0], ex2[1])],
      gen: (rng: Rng) => { const { ops, args } = make(rng); return caseOf(run, ops, args); },
      solutions: {
        python: code`
          import heapq

          class StockPrice:

              def __init__(self):
                  self.price = {}
                  self.latest = 0
                  self.max_heap = []  # (-price, timestamp), stale entries dropped lazily
                  self.min_heap = []  # (price, timestamp)

              def update(self, timestamp: int, price: int) -> None:
                  self.price[timestamp] = price
                  self.latest = max(self.latest, timestamp)
                  heapq.heappush(self.max_heap, (-price, timestamp))
                  heapq.heappush(self.min_heap, (price, timestamp))

              def current(self) -> int:
                  return self.price[self.latest]

              def maximum(self) -> int:
                  h = self.max_heap
                  while self.price[h[0][1]] != -h[0][0]:  # corrected since it was pushed
                      heapq.heappop(h)
                  return -h[0][0]

              def minimum(self) -> int:
                  h = self.min_heap
                  while self.price[h[0][1]] != h[0][0]:
                      heapq.heappop(h)
                  return h[0][0]
        `,
        javascript: code`
          // A min-heap of [key, timestamp] pairs; the max-heap stores key = -price.
          function spPush(h, item) {
              var i = h.length;
              h.push(item);
              while (i > 0 && h[(i - 1) >> 1][0] > item[0]) { h[i] = h[(i - 1) >> 1]; i = (i - 1) >> 1; }
              h[i] = item;
          }

          function spPop(h) {
              var last = h.pop();
              if (h.length === 0) return;
              var i = 0;
              for (;;) {
                  var l = 2 * i + 1, r = l + 1, m = i, mv = last[0];
                  if (l < h.length && h[l][0] < mv) { m = l; mv = h[l][0]; }
                  if (r < h.length && h[r][0] < mv) m = r;
                  if (m === i) break;
                  h[i] = h[m];
                  i = m;
              }
              h[i] = last;
          }

          var StockPrice = function() {
              this.price = new Map();
              this.latest = 0;
              this.maxH = [];
              this.minH = [];
          };

          StockPrice.prototype.update = function(timestamp, price) {
              this.price.set(timestamp, price);
              if (timestamp > this.latest) this.latest = timestamp;
              spPush(this.maxH, [-price, timestamp]);
              spPush(this.minH, [price, timestamp]);
          };

          StockPrice.prototype.current = function() {
              return this.price.get(this.latest);
          };

          StockPrice.prototype.maximum = function() {
              var h = this.maxH;
              while (this.price.get(h[0][1]) !== -h[0][0]) spPop(h); // corrected since it was pushed
              return -h[0][0];
          };

          StockPrice.prototype.minimum = function() {
              var h = this.minH;
              while (this.price.get(h[0][1]) !== h[0][0]) spPop(h);
              return h[0][0];
          };
        `,
        typescript: code`
          // A min-heap of [key, timestamp] pairs; the max-heap stores key = -price.
          function spPush(h: number[][], item: number[]): void {
              var i = h.length;
              h.push(item);
              while (i > 0 && h[(i - 1) >> 1][0] > item[0]) { h[i] = h[(i - 1) >> 1]; i = (i - 1) >> 1; }
              h[i] = item;
          }

          function spPop(h: number[][]): void {
              var last = h.pop();
              if (h.length === 0) return;
              var i = 0;
              for (;;) {
                  var l = 2 * i + 1, r = l + 1, m = i, mv = last[0];
                  if (l < h.length && h[l][0] < mv) { m = l; mv = h[l][0]; }
                  if (r < h.length && h[r][0] < mv) m = r;
                  if (m === i) break;
                  h[i] = h[m];
                  i = m;
              }
              h[i] = last;
          }

          class StockPrice {
              price: { [t: number]: number };
              latest: number;
              maxH: number[][];
              minH: number[][];

              constructor() {
                  this.price = {};
                  this.latest = 0;
                  this.maxH = [];
                  this.minH = [];
              }

              update(timestamp: number, price: number): void {
                  this.price[timestamp] = price;
                  if (timestamp > this.latest) this.latest = timestamp;
                  spPush(this.maxH, [-price, timestamp]);
                  spPush(this.minH, [price, timestamp]);
              }

              current(): number {
                  return this.price[this.latest];
              }

              maximum(): number {
                  var h = this.maxH;
                  while (this.price[h[0][1]] !== -h[0][0]) spPop(h); // corrected since it was pushed
                  return -h[0][0];
              }

              minimum(): number {
                  var h = this.minH;
                  while (this.price[h[0][1]] !== h[0][0]) spPop(h);
                  return h[0][0];
              }
          }
        `,
        java: code`
          class StockPrice {
              private HashMap<Integer, Integer> price = new HashMap<>();
              private TreeMap<Integer, Integer> counts = new TreeMap<>(); // price -> how many timestamps hold it
              private int latest = 0;

              public StockPrice() {
              }

              public void update(int timestamp, int price) {
                  Integer old = this.price.put(timestamp, price);
                  if (old != null) { // a correction: drop one copy of the old price
                      if (counts.get(old) == 1) counts.remove(old); else counts.put(old, counts.get(old) - 1);
                  }
                  counts.merge(price, 1, Integer::sum);
                  latest = Math.max(latest, timestamp);
              }

              public int current() {
                  return price.get(latest);
              }

              public int maximum() {
                  return counts.lastKey();
              }

              public int minimum() {
                  return counts.firstKey();
              }
          }
        `,
        cpp: code`
          class StockPrice {
              unordered_map<int, int> price;
              multiset<int> prices; // one entry per timestamp
              int latest = 0;
          public:
              StockPrice() {}

              void update(int timestamp, int price) {
                  auto it = this->price.find(timestamp);
                  if (it != this->price.end()) prices.erase(prices.find(it->second)); // a correction: drop one copy
                  this->price[timestamp] = price;
                  prices.insert(price);
                  latest = max(latest, timestamp);
              }

              int current() {
                  return price[latest];
              }

              int maximum() {
                  return *prices.rbegin();
              }

              int minimum() {
                  return *prices.begin();
              }
          };
        `,
        c: code`
          /* timestamp -> price in an open-addressing hash map (grown at half full),
             plus two heaps of (key, timestamp) with stale entries dropped lazily;
             the max-heap stores key = -price. */
          typedef struct { int key, ts; } SpItem;
          typedef struct { SpItem* a; int n, cap; } SpHeap;

          typedef struct {
              int* hts;
              int* hpr;
              char* used;
              int hcap, hn;
              int latest;
              SpHeap maxH, minH;
          } StockPrice;

          static void spHeapPush(SpHeap* h, int key, int ts) {
              if (h->n == h->cap) { h->cap = h->cap ? 2 * h->cap : 16; h->a = (SpItem*)realloc(h->a, h->cap * sizeof(SpItem)); }
              int i = h->n++;
              while (i > 0 && h->a[(i - 1) / 2].key > key) { h->a[i] = h->a[(i - 1) / 2]; i = (i - 1) / 2; }
              h->a[i].key = key;
              h->a[i].ts = ts;
          }

          static void spHeapPop(SpHeap* h) {
              SpItem last = h->a[--h->n];
              int i = 0;
              for (;;) {
                  int l = 2 * i + 1, r = l + 1, m = i, mv = last.key;
                  if (l < h->n && h->a[l].key < mv) { m = l; mv = h->a[l].key; }
                  if (r < h->n && h->a[r].key < mv) m = r;
                  if (m == i) break;
                  h->a[i] = h->a[m];
                  i = m;
              }
              if (h->n > 0) h->a[i] = last;
          }

          static int spSlot(StockPrice* o, int ts) {
              unsigned h = ((unsigned)ts * 2654435761u) & (unsigned)(o->hcap - 1);
              while (o->used[h] && o->hts[h] != ts) h = (h + 1) & (unsigned)(o->hcap - 1);
              return (int)h;
          }

          static void spGrow(StockPrice* o) {
              int oldCap = o->hcap;
              int* ots = o->hts; int* opr = o->hpr; char* oused = o->used;
              o->hcap *= 2;
              o->hts = (int*)malloc(o->hcap * sizeof(int));
              o->hpr = (int*)malloc(o->hcap * sizeof(int));
              o->used = (char*)calloc(o->hcap, 1);
              for (int i = 0; i < oldCap; i++) if (oused[i]) {
                  int s = spSlot(o, ots[i]);
                  o->used[s] = 1; o->hts[s] = ots[i]; o->hpr[s] = opr[i];
              }
              free(ots); free(opr); free(oused);
          }

          static int spPrice(StockPrice* o, int ts) {
              return o->hpr[spSlot(o, ts)];
          }

          StockPrice* stockPriceCreate() {
              StockPrice* o = (StockPrice*)malloc(sizeof(StockPrice));
              o->hcap = 16;
              o->hn = 0;
              o->hts = (int*)malloc(16 * sizeof(int));
              o->hpr = (int*)malloc(16 * sizeof(int));
              o->used = (char*)calloc(16, 1);
              o->latest = 0;
              o->maxH.a = NULL; o->maxH.n = o->maxH.cap = 0;
              o->minH.a = NULL; o->minH.n = o->minH.cap = 0;
              return o;
          }

          void stockPriceUpdate(StockPrice* obj, int timestamp, int price) {
              if (2 * (obj->hn + 1) > obj->hcap) spGrow(obj);
              int s = spSlot(obj, timestamp);
              if (!obj->used[s]) { obj->used[s] = 1; obj->hts[s] = timestamp; obj->hn++; }
              obj->hpr[s] = price;
              if (timestamp > obj->latest) obj->latest = timestamp;
              spHeapPush(&obj->maxH, -price, timestamp);
              spHeapPush(&obj->minH, price, timestamp);
          }

          int stockPriceCurrent(StockPrice* obj) {
              return spPrice(obj, obj->latest);
          }

          int stockPriceMaximum(StockPrice* obj) {
              while (spPrice(obj, obj->maxH.a[0].ts) != -obj->maxH.a[0].key) spHeapPop(&obj->maxH); /* corrected since pushed */
              return -obj->maxH.a[0].key;
          }

          int stockPriceMinimum(StockPrice* obj) {
              while (spPrice(obj, obj->minH.a[0].ts) != obj->minH.a[0].key) spHeapPop(&obj->minH);
              return obj->minH.a[0].key;
          }

          void stockPriceFree(StockPrice* obj) {
              free(obj->hts); free(obj->hpr); free(obj->used);
              free(obj->maxH.a); free(obj->minH.a);
              free(obj);
          }
        `,
        csharp: code`
          public class StockPrice {
              private Dictionary<int, int> price = new Dictionary<int, int>();
              // one entry per timestamp: price << 31 | timestamp, so Min and Max are the extremes
              private SortedSet<long> entries = new SortedSet<long>();
              private int latest = 0;

              public StockPrice() {
              }

              public void Update(int timestamp, int price) {
                  int old;
                  if (this.price.TryGetValue(timestamp, out old)) entries.Remove(((long)old << 31) | (long)timestamp); // a correction
                  this.price[timestamp] = price;
                  entries.Add(((long)price << 31) | (long)timestamp);
                  latest = Math.Max(latest, timestamp);
              }

              public int Current() {
                  return price[latest];
              }

              public int Maximum() {
                  return (int)(entries.Max >> 31);
              }

              public int Minimum() {
                  return (int)(entries.Min >> 31);
              }
          }
        `,
        go: code`
          type spItem struct{ key, ts int } // the max-heap stores key = -price
          type spHeap []spItem

          func (h spHeap) Len() int            { return len(h) }
          func (h spHeap) Less(i, j int) bool  { return h[i].key < h[j].key }
          func (h spHeap) Swap(i, j int)       { h[i], h[j] = h[j], h[i] }
          func (h *spHeap) Push(x interface{}) { *h = append(*h, x.(spItem)) }
          func (h *spHeap) Pop() interface{} {
          	old := *h
          	x := old[len(old)-1]
          	*h = old[:len(old)-1]
          	return x
          }

          type StockPrice struct {
          	price      map[int]int
          	latest     int
          	maxH, minH spHeap
          }

          func Constructor() StockPrice {
          	return StockPrice{price: map[int]int{}}
          }

          func (this *StockPrice) Update(timestamp int, price int) {
          	this.price[timestamp] = price
          	if timestamp > this.latest {
          		this.latest = timestamp
          	}
          	heap.Push(&this.maxH, spItem{-price, timestamp})
          	heap.Push(&this.minH, spItem{price, timestamp})
          }

          func (this *StockPrice) Current() int {
          	return this.price[this.latest]
          }

          func (this *StockPrice) Maximum() int {
          	for this.price[this.maxH[0].ts] != -this.maxH[0].key { // corrected since it was pushed
          		heap.Pop(&this.maxH)
          	}
          	return -this.maxH[0].key
          }

          func (this *StockPrice) Minimum() int {
          	for this.price[this.minH[0].ts] != this.minH[0].key {
          		heap.Pop(&this.minH)
          	}
          	return this.minH[0].key
          }
        `,
        kotlin: code`
          class StockPrice() {
              private val price = HashMap<Int, Int>()
              private val counts = java.util.TreeMap<Int, Int>() // price -> how many timestamps hold it
              private var latest = 0

              fun update(timestamp: Int, price: Int) {
                  val old = this.price.put(timestamp, price)
                  if (old != null) { // a correction: drop one copy of the old price
                      val c = counts[old]!!
                      if (c == 1) counts.remove(old) else counts[old] = c - 1
                  }
                  counts[price] = (counts[price] ?: 0) + 1
                  latest = maxOf(latest, timestamp)
              }

              fun current(): Int = price[latest]!!

              fun maximum(): Int = counts.lastKey()

              fun minimum(): Int = counts.firstKey()
          }
        `,
        swift: code`
          // A min-heap of (key, timestamp); the max-heap stores key = -price.
          struct SpHeap {
              var a: [(Int, Int)] = []

              var top: (Int, Int) { return a[0] }

              mutating func push(_ x: (Int, Int)) {
                  a.append(x)
                  var i = a.count - 1
                  while i > 0 && a[(i - 1) / 2].0 > a[i].0 { a.swapAt(i, (i - 1) / 2); i = (i - 1) / 2 }
              }

              mutating func pop() {
                  let last = a.removeLast()
                  if a.isEmpty { return }
                  a[0] = last
                  var i = 0
                  while true {
                      let l = 2 * i + 1, r = l + 1
                      var m = i
                      if l < a.count && a[l].0 < a[m].0 { m = l }
                      if r < a.count && a[r].0 < a[m].0 { m = r }
                      if m == i { break }
                      a.swapAt(i, m)
                      i = m
                  }
              }
          }

          class StockPrice {
              var price: [Int: Int] = [:]
              var latest = 0
              var maxH = SpHeap(), minH = SpHeap()

              init() {}

              func update(_ timestamp: Int, _ price: Int) {
                  self.price[timestamp] = price
                  latest = max(latest, timestamp)
                  maxH.push((-price, timestamp))
                  minH.push((price, timestamp))
              }

              func current() -> Int {
                  return price[latest]!
              }

              func maximum() -> Int {
                  while price[maxH.top.1]! != -maxH.top.0 { maxH.pop() } // corrected since it was pushed
                  return -maxH.top.0
              }

              func minimum() -> Int {
                  while price[minH.top.1]! != minH.top.0 { minH.pop() }
                  return minH.top.0
              }
          }
        `,
        rust: code`
          use std::collections::{BTreeMap, HashMap};

          struct StockPrice {
              price: HashMap<i32, i32>,
              counts: BTreeMap<i32, i32>, // price -> how many timestamps hold it
              latest: i32,
          }

          impl StockPrice {
              fn new() -> Self {
                  StockPrice { price: HashMap::new(), counts: BTreeMap::new(), latest: 0 }
              }

              fn update(&mut self, timestamp: i32, price: i32) {
                  if let Some(old) = self.price.insert(timestamp, price) { // a correction: drop one copy
                      let c = self.counts.get_mut(&old).unwrap();
                      *c -= 1;
                      if *c == 0 { self.counts.remove(&old); }
                  }
                  *self.counts.entry(price).or_insert(0) += 1;
                  if timestamp > self.latest { self.latest = timestamp; }
              }

              fn current(&mut self) -> i32 {
                  self.price[&self.latest]
              }

              fn maximum(&mut self) -> i32 {
                  *self.counts.keys().next_back().unwrap()
              }

              fn minimum(&mut self) -> i32 {
                  *self.counts.keys().next().unwrap()
              }
          }
        `,
        php: code`
          class StockPrice {
              private $price = [];
              private $latest = 0;
              private $maxH;
              private $minH;

              function __construct() {
                  // entries are price * 2^30 + timestamp (both below 2^30), stale ones dropped lazily
                  $this->maxH = new \SplMaxHeap();
                  $this->minH = new \SplMinHeap();
              }

              function update($timestamp, $price) {
                  $this->price[$timestamp] = $price;
                  if ($timestamp > $this->latest) $this->latest = $timestamp;
                  $key = $price * 1073741824 + $timestamp;
                  $this->maxH->insert($key);
                  $this->minH->insert($key);
              }

              function current() {
                  return $this->price[$this->latest];
              }

              private function live($h) {
                  for (;;) {
                      $top = $h->top();
                      $p = intdiv($top, 1073741824);
                      if ($this->price[$top % 1073741824] == $p) return $p;
                      $h->extract(); // corrected since it was pushed
                  }
              }

              function maximum() {
                  return $this->live($this->maxH);
              }

              function minimum() {
                  return $this->live($this->minH);
              }
          }
        `,
        ruby: code`
          class StockPrice
            def initialize
              @price = {}
              @latest = 0
              @sorted = [] # one price per timestamp, kept sorted
            end

            def update(timestamp, price)
              old = @price[timestamp]
              @sorted.delete_at(@sorted.bsearch_index { |x| x >= old }) if old # a correction: drop one copy
              @price[timestamp] = price
              @sorted.insert(@sorted.bsearch_index { |x| x >= price } || @sorted.length, price)
              @latest = timestamp if timestamp > @latest
            end

            def current
              @price[@latest]
            end

            def maximum
              @sorted[-1]
            end

            def minimum
              @sorted[0]
            end
          end
        `,
      },
    };
  })(),

  // ── Simple Bank System (LC 2043) ──────────────────────────────────
  (() => {
    const run: Run = (ops, args) => {
      let bal: number[] = [];
      const ok = (a: number) => a >= 1 && a <= bal.length;
      return ops.map((op, k) => {
        if (op === "Bank") { bal = (args[k][0] as number[]).slice(); return null; }
        if (op === "transfer") {
          const [a, b, m] = args[k] as number[];
          if (!ok(a) || !ok(b) || bal[a - 1] < m) return false;
          bal[a - 1] -= m; bal[b - 1] += m; return true;
        }
        const [a, m] = args[k] as number[];
        if (!ok(a)) return false;
        if (op === "deposit") { bal[a - 1] += m; return true; }
        if (bal[a - 1] < m) return false;
        bal[a - 1] -= m; return true;
      });
    };
    const make = (rng: Rng) => {
      const n = ri(rng, 1, pick(rng, [1, 3, 6, 20]));
      const hi = pick(rng, [10, 100, 1000000]);
      const balance = Array.from({ length: n }, () => (rng() < 0.15 ? 0 : ri(rng, 0, hi)));
      const ops = ["Bank"], args: Args = [[balance]];
      const acct = () => (rng() < 0.12 ? n + ri(rng, 1, 3) : ri(rng, 1, n));
      const money = () => (rng() < 0.1 ? 0 : ri(rng, 0, rng() < 0.5 ? hi : Math.min(hi, 20)));
      for (let m = ri(rng, 1, pick(rng, [3, 10, 25, 40])); m > 0; m--) {
        const r = rng();
        if (r < 0.4) { ops.push("transfer"); args.push([acct(), acct(), money()]); }
        else if (r < 0.7) { ops.push("deposit"); args.push([acct(), money()]); }
        else { ops.push("withdraw"); args.push([acct(), money()]); }
      }
      return { ops, args };
    };
    const ex1: [string[], Args] = [
      ["Bank", "withdraw", "transfer", "deposit", "transfer", "withdraw"],
      [[[10, 100, 20, 50, 30]], [3, 10], [5, 1, 20], [5, 20], [3, 4, 15], [10, 50]],
    ];
    const ex2: [string[], Args] = [["Bank", "transfer", "withdraw", "deposit", "withdraw"], [[[0, 7]], [2, 2, 7], [1, 1], [1, 5], [1, 5]]];
    return {
      slug: "simple-bank-system",
      title: "Simple Bank System",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Simulation", "Design"],
      signature: {
        funcName: "Bank", params: [{ name: "balance", type: "int[]" as const }], returns: "void" as const,
        methods: [
          { name: "transfer", params: [{ name: "account1", type: "int" as const }, { name: "account2", type: "int" as const }, { name: "money", type: "int" as const }], returns: "bool" as const },
          { name: "deposit", params: [{ name: "account", type: "int" as const }, { name: "money", type: "int" as const }], returns: "bool" as const },
          { name: "withdraw", params: [{ name: "account", type: "int" as const }, { name: "money", type: "int" as const }], returns: "bool" as const },
        ],
      },
      description: describe(
        "A bank has `n` accounts numbered `1` to `n`; the starting balance of account `i + 1` is `balance[i]`. Write the class `Bank`, which carries out transactions and refuses the invalid ones.\n\nA transaction is **valid** when every account number it names is between `1` and `n`, and the account money leaves holds **at least** that much money.\n\n- `Bank(int[] balance)` opens the accounts.\n- `boolean transfer(int account1, int account2, int money)` moves `money` from `account1` to `account2`.\n- `boolean deposit(int account, int money)` adds `money` to `account`.\n- `boolean withdraw(int account, int money)` takes `money` out of `account`.\n\nEach method performs the transaction and returns `true` if it is valid; otherwise it changes nothing and returns `false`. (LeetCode's version allows balances up to 10^12; here they are reduced so that every balance fits a signed 32-bit integer, as the constraints show.)\n\n" + CALLS,
        [
          exampleOf(run, ex1[0], ex1[1], "Account 3 goes from 20 to 10. Account 5 sends 20 to account 1 (5 now holds 10) and then receives 20 (30). Account 3 holds only 10, so it cannot send 15. Account 10 does not exist."),
          exampleOf(run, ex2[0], ex2[1], "A transfer from an account to itself is valid when the balance covers it. Account 1 starts empty, so the first withdrawal fails; after a deposit of 5 the same withdrawal of 5 succeeds."),
        ],
        ["n == balance.length", "1 <= n <= 1000", "0 <= balance[i] <= 10^6", "1 <= account, account1, account2 <= 10^5", "0 <= money <= 10^6", "At most 1000 calls are made to the three methods in total", "So every balance stays below 10^9 + 10^9 < 2^31"]),
      hints: [
        "This is a simulation: store the balances in an array, with account `a` at index `a - 1`.",
        "Write one helper that says whether an account number is valid, and check everything before changing anything.",
        "`transfer` needs both accounts valid and `balance[account1] >= money`; `deposit` only a valid account; `withdraw` a valid account holding at least `money`. A transfer to the same account is allowed.",
      ],
      editorial: explain({
        idea: "Keep the balances in an array and validate each transaction completely before applying it, so a refused transaction leaves no trace.",
        steps: [
          "Store a copy of `balance`; `valid(a)` is `1 <= a <= n`.",
          "`transfer(a, b, m)`: if `valid(a)`, `valid(b)` and `bal[a-1] >= m`, subtract `m` from `a`, add it to `b`, return true; else false.",
          "`deposit(a, m)`: if `valid(a)`, add `m` and return true; else false.",
          "`withdraw(a, m)`: if `valid(a)` and `bal[a-1] >= m`, subtract and return true; else false.",
        ],
        why: "Each method checks exactly the conditions the statement lists and mutates only after all of them hold. In a transfer between the same account the subtraction and the addition cancel, which is the correct result of a valid self-transfer.",
        time: "O(1) per call",
        space: "O(n)",
        pitfalls: [
          "Accounts are numbered from 1; index `a - 1`, and reject `a > n` — the argument can be as large as 10^5.",
          "Check the second account of a transfer before taking the money from the first.",
          "On LeetCode the balances are 64-bit; with the reduced constraints here 32 bits suffice, but a `long` costs nothing.",
        ],
      }),
      examples: [caseOf(run, ex1[0], ex1[1]), caseOf(run, ex2[0], ex2[1])],
      gen: (rng: Rng) => { const { ops, args } = make(rng); return caseOf(run, ops, args); },
      solutions: {
        python: code`
          class Bank:

              def __init__(self, balance: List[int]):
                  self.bal = list(balance)

              def _valid(self, a: int) -> bool:
                  return 1 <= a <= len(self.bal)

              def transfer(self, account1: int, account2: int, money: int) -> bool:
                  if not (self._valid(account1) and self._valid(account2)) or self.bal[account1 - 1] < money:
                      return False
                  self.bal[account1 - 1] -= money
                  self.bal[account2 - 1] += money
                  return True

              def deposit(self, account: int, money: int) -> bool:
                  if not self._valid(account):
                      return False
                  self.bal[account - 1] += money
                  return True

              def withdraw(self, account: int, money: int) -> bool:
                  if not self._valid(account) or self.bal[account - 1] < money:
                      return False
                  self.bal[account - 1] -= money
                  return True
        `,
        javascript: code`
          var Bank = function(balance) {
              this.bal = balance.slice();
          };

          Bank.prototype.valid = function(a) {
              return a >= 1 && a <= this.bal.length;
          };

          Bank.prototype.transfer = function(account1, account2, money) {
              if (!this.valid(account1) || !this.valid(account2) || this.bal[account1 - 1] < money) return false;
              this.bal[account1 - 1] -= money;
              this.bal[account2 - 1] += money;
              return true;
          };

          Bank.prototype.deposit = function(account, money) {
              if (!this.valid(account)) return false;
              this.bal[account - 1] += money;
              return true;
          };

          Bank.prototype.withdraw = function(account, money) {
              if (!this.valid(account) || this.bal[account - 1] < money) return false;
              this.bal[account - 1] -= money;
              return true;
          };
        `,
        typescript: code`
          class Bank {
              bal: number[];

              constructor(balance: number[]) {
                  this.bal = balance.slice();
              }

              valid(a: number): boolean {
                  return a >= 1 && a <= this.bal.length;
              }

              transfer(account1: number, account2: number, money: number): boolean {
                  if (!this.valid(account1) || !this.valid(account2) || this.bal[account1 - 1] < money) return false;
                  this.bal[account1 - 1] -= money;
                  this.bal[account2 - 1] += money;
                  return true;
              }

              deposit(account: number, money: number): boolean {
                  if (!this.valid(account)) return false;
                  this.bal[account - 1] += money;
                  return true;
              }

              withdraw(account: number, money: number): boolean {
                  if (!this.valid(account) || this.bal[account - 1] < money) return false;
                  this.bal[account - 1] -= money;
                  return true;
              }
          }
        `,
        java: code`
          class Bank {
              private long[] bal;

              public Bank(int[] balance) {
                  bal = new long[balance.length];
                  for (int i = 0; i < balance.length; i++) bal[i] = balance[i];
              }

              private boolean valid(int a) {
                  return a >= 1 && a <= bal.length;
              }

              public boolean transfer(int account1, int account2, int money) {
                  if (!valid(account1) || !valid(account2) || bal[account1 - 1] < money) return false;
                  bal[account1 - 1] -= money;
                  bal[account2 - 1] += money;
                  return true;
              }

              public boolean deposit(int account, int money) {
                  if (!valid(account)) return false;
                  bal[account - 1] += money;
                  return true;
              }

              public boolean withdraw(int account, int money) {
                  if (!valid(account) || bal[account - 1] < money) return false;
                  bal[account - 1] -= money;
                  return true;
              }
          }
        `,
        cpp: code`
          class Bank {
              vector<long long> bal;

              bool valid(int a) { return a >= 1 && a <= (int)bal.size(); }
          public:
              Bank(vector<int>& balance) : bal(balance.begin(), balance.end()) {}

              bool transfer(int account1, int account2, int money) {
                  if (!valid(account1) || !valid(account2) || bal[account1 - 1] < money) return false;
                  bal[account1 - 1] -= money;
                  bal[account2 - 1] += money;
                  return true;
              }

              bool deposit(int account, int money) {
                  if (!valid(account)) return false;
                  bal[account - 1] += money;
                  return true;
              }

              bool withdraw(int account, int money) {
                  if (!valid(account) || bal[account - 1] < money) return false;
                  bal[account - 1] -= money;
                  return true;
              }
          };
        `,
        c: code`
          typedef struct {
              long long* bal;
              int n;
          } Bank;

          Bank* bankCreate(int* balance, int balanceSize) {
              Bank* o = (Bank*)malloc(sizeof(Bank));
              o->n = balanceSize;
              o->bal = (long long*)malloc(balanceSize * sizeof(long long));
              for (int i = 0; i < balanceSize; i++) o->bal[i] = balance[i];
              return o;
          }

          static bool bankValid(Bank* o, int a) { return a >= 1 && a <= o->n; }

          bool bankTransfer(Bank* obj, int account1, int account2, int money) {
              if (!bankValid(obj, account1) || !bankValid(obj, account2) || obj->bal[account1 - 1] < money) return false;
              obj->bal[account1 - 1] -= money;
              obj->bal[account2 - 1] += money;
              return true;
          }

          bool bankDeposit(Bank* obj, int account, int money) {
              if (!bankValid(obj, account)) return false;
              obj->bal[account - 1] += money;
              return true;
          }

          bool bankWithdraw(Bank* obj, int account, int money) {
              if (!bankValid(obj, account) || obj->bal[account - 1] < money) return false;
              obj->bal[account - 1] -= money;
              return true;
          }

          void bankFree(Bank* obj) {
              free(obj->bal);
              free(obj);
          }
        `,
        csharp: code`
          public class Bank {
              private long[] bal;

              public Bank(int[] balance) {
                  bal = balance.Select(b => (long)b).ToArray();
              }

              private bool Valid(int a) {
                  return a >= 1 && a <= bal.Length;
              }

              public bool Transfer(int account1, int account2, int money) {
                  if (!Valid(account1) || !Valid(account2) || bal[account1 - 1] < money) return false;
                  bal[account1 - 1] -= money;
                  bal[account2 - 1] += money;
                  return true;
              }

              public bool Deposit(int account, int money) {
                  if (!Valid(account)) return false;
                  bal[account - 1] += money;
                  return true;
              }

              public bool Withdraw(int account, int money) {
                  if (!Valid(account) || bal[account - 1] < money) return false;
                  bal[account - 1] -= money;
                  return true;
              }
          }
        `,
        go: code`
          type Bank struct {
          	bal []int
          }

          func Constructor(balance []int) Bank {
          	b := make([]int, len(balance))
          	copy(b, balance)
          	return Bank{bal: b}
          }

          func (this *Bank) valid(a int) bool {
          	return a >= 1 && a <= len(this.bal)
          }

          func (this *Bank) Transfer(account1 int, account2 int, money int) bool {
          	if !this.valid(account1) || !this.valid(account2) || this.bal[account1-1] < money {
          		return false
          	}
          	this.bal[account1-1] -= money
          	this.bal[account2-1] += money
          	return true
          }

          func (this *Bank) Deposit(account int, money int) bool {
          	if !this.valid(account) {
          		return false
          	}
          	this.bal[account-1] += money
          	return true
          }

          func (this *Bank) Withdraw(account int, money int) bool {
          	if !this.valid(account) || this.bal[account-1] < money {
          		return false
          	}
          	this.bal[account-1] -= money
          	return true
          }
        `,
        kotlin: code`
          class Bank(balance: IntArray) {
              private val bal = LongArray(balance.size) { balance[it].toLong() }

              private fun valid(a: Int) = a >= 1 && a <= bal.size

              fun transfer(account1: Int, account2: Int, money: Int): Boolean {
                  if (!valid(account1) || !valid(account2) || bal[account1 - 1] < money) return false
                  bal[account1 - 1] -= money.toLong()
                  bal[account2 - 1] += money.toLong()
                  return true
              }

              fun deposit(account: Int, money: Int): Boolean {
                  if (!valid(account)) return false
                  bal[account - 1] += money.toLong()
                  return true
              }

              fun withdraw(account: Int, money: Int): Boolean {
                  if (!valid(account) || bal[account - 1] < money) return false
                  bal[account - 1] -= money.toLong()
                  return true
              }
          }
        `,
        swift: code`
          class Bank {
              var bal: [Int]

              init(_ balance: [Int]) {
                  bal = balance
              }

              func valid(_ a: Int) -> Bool {
                  return a >= 1 && a <= bal.count
              }

              func transfer(_ account1: Int, _ account2: Int, _ money: Int) -> Bool {
                  if !valid(account1) || !valid(account2) || bal[account1 - 1] < money { return false }
                  bal[account1 - 1] -= money
                  bal[account2 - 1] += money
                  return true
              }

              func deposit(_ account: Int, _ money: Int) -> Bool {
                  if !valid(account) { return false }
                  bal[account - 1] += money
                  return true
              }

              func withdraw(_ account: Int, _ money: Int) -> Bool {
                  if !valid(account) || bal[account - 1] < money { return false }
                  bal[account - 1] -= money
                  return true
              }
          }
        `,
        rust: code`
          struct Bank {
              bal: Vec<i64>,
          }

          impl Bank {
              fn new(balance: Vec<i32>) -> Self {
                  Bank { bal: balance.into_iter().map(|b| b as i64).collect() }
              }

              fn valid(&self, a: i32) -> bool {
                  a >= 1 && a as usize <= self.bal.len()
              }

              fn transfer(&mut self, account1: i32, account2: i32, money: i32) -> bool {
                  if !self.valid(account1) || !self.valid(account2) || self.bal[account1 as usize - 1] < money as i64 { return false; }
                  self.bal[account1 as usize - 1] -= money as i64;
                  self.bal[account2 as usize - 1] += money as i64;
                  true
              }

              fn deposit(&mut self, account: i32, money: i32) -> bool {
                  if !self.valid(account) { return false; }
                  self.bal[account as usize - 1] += money as i64;
                  true
              }

              fn withdraw(&mut self, account: i32, money: i32) -> bool {
                  if !self.valid(account) || self.bal[account as usize - 1] < money as i64 { return false; }
                  self.bal[account as usize - 1] -= money as i64;
                  true
              }
          }
        `,
        php: code`
          class Bank {
              private $bal;

              function __construct($balance) {
                  $this->bal = $balance;
              }

              private function valid($a) {
                  return $a >= 1 && $a <= count($this->bal);
              }

              function transfer($account1, $account2, $money) {
                  if (!$this->valid($account1) || !$this->valid($account2) || $this->bal[$account1 - 1] < $money) return false;
                  $this->bal[$account1 - 1] -= $money;
                  $this->bal[$account2 - 1] += $money;
                  return true;
              }

              function deposit($account, $money) {
                  if (!$this->valid($account)) return false;
                  $this->bal[$account - 1] += $money;
                  return true;
              }

              function withdraw($account, $money) {
                  if (!$this->valid($account) || $this->bal[$account - 1] < $money) return false;
                  $this->bal[$account - 1] -= $money;
                  return true;
              }
          }
        `,
        ruby: code`
          class Bank
            def initialize(balance)
              @bal = balance.dup
            end

            def valid(a)
              a >= 1 && a <= @bal.length
            end

            def transfer(account1, account2, money)
              return false if !valid(account1) || !valid(account2) || @bal[account1 - 1] < money
              @bal[account1 - 1] -= money
              @bal[account2 - 1] += money
              true
            end

            def deposit(account, money)
              return false unless valid(account)
              @bal[account - 1] += money
              true
            end

            def withdraw(account, money)
              return false if !valid(account) || @bal[account - 1] < money
              @bal[account - 1] -= money
              true
            end
          end
        `,
      },
    };
  })(),

  // ── Walking Robot Simulation II (LC 2069) ─────────────────────────
  (() => {
    const DIRS = ["East", "North", "West", "South"];
    const DX = [1, 0, -1, 0], DY = [0, 1, 0, -1];
    const run: Run = (ops, args) => {
      let w = 0, h = 0, x = 0, y = 0, d = 0;
      return ops.map((op, k) => {
        if (op === "Robot") { [w, h] = args[k] as number[]; x = y = d = 0; return null; }
        if (op === "getPos") return [x, y];
        if (op === "getDir") return DIRS[d];
        // Brute force: walk cell by cell, turning left whenever the next cell is outside.
        // A whole lap ends where it started, so only (num - 1) % perimeter + 1 steps matter.
        const per = 2 * (w + h) - 4;
        for (let s = (args[k][0] - 1) % per + 1; s > 0; s--) {
          while (x + DX[d] < 0 || x + DX[d] >= w || y + DY[d] < 0 || y + DY[d] >= h) d = (d + 1) % 4;
          x += DX[d]; y += DY[d];
        }
        return null;
      });
    };
    const make = (rng: Rng) => {
      const w = ri(rng, 2, pick(rng, [2, 4, 8, 100])), h = ri(rng, 2, pick(rng, [2, 4, 8, 100]));
      const per = 2 * (w + h) - 4;
      const ops = ["Robot"], args: Args = [[w, h]];
      for (let m = ri(rng, 1, pick(rng, [3, 10, 25, 40])); m > 0; m--) {
        const r = rng();
        if (r < 0.45) {
          const q = rng();
          ops.push("step");
          args.push([q < 0.1 ? per * ri(rng, 1, 3) : q < 0.2 ? ri(rng, 1, 100000) : ri(rng, 1, Math.max(1, Math.min(per + 3, pick(rng, [3, 10, 50]))))]);
        } else { ops.push(r < 0.75 ? "getPos" : "getDir"); args.push([]); }
      }
      return { ops, args };
    };
    const ex1: [string[], Args] = [
      ["Robot", "step", "step", "getPos", "getDir", "step", "step", "step", "getPos", "getDir"],
      [[6, 3], [2], [2], [], [], [2], [1], [4], [], []],
    ];
    const ex2: [string[], Args] = [["Robot", "getDir", "step", "getPos", "getDir"], [[2, 2], [], [8], [], []]];
    return {
      slug: "walking-robot-simulation-ii",
      title: "Walking Robot Simulation II",
      difficulty: "MEDIUM" as const,
      tags: ["Simulation", "Design"],
      signature: {
        funcName: "Robot",
        params: [{ name: "width", type: "int" as const }, { name: "height", type: "int" as const }],
        returns: "void" as const,
        methods: [
          { name: "step", params: [{ name: "num", type: "int" as const }], returns: "void" as const },
          { name: "getPos", params: [], returns: "int[]" as const },
          { name: "getDir", params: [], returns: "string" as const },
        ],
      },
      description: describe(
        "A robot moves on a `width × height` grid whose cells run from `(0, 0)` at the bottom-left to `(width - 1, height - 1)` at the top-right. It starts at `(0, 0)` facing `\"East\"`.\n\nTo take **one step**, the robot tries to move one cell forward in the direction it faces. If that cell is outside the grid, it instead turns 90 degrees **counterclockwise** and tries again, until the move succeeds.\n\nWrite the class `Robot`:\n\n- `Robot(int width, int height)` places the robot at `(0, 0)` facing East.\n- `void step(int num)` makes the robot take `num` steps.\n- `int[] getPos()` returns its cell as `[x, y]`.\n- `String getDir()` returns the direction it faces: `\"North\"`, `\"East\"`, `\"South\"` or `\"West\"`.\n\n" + CALLS,
        [
          exampleOf(run, ex1[0], ex1[1], "On a 6 × 3 grid the robot walks east to (4,0), still facing East. Two more steps take it to the corner (5,0) and, after turning, up to (5,1); one step reaches (5,2), and four more turn it West along the top row to (1,2)."),
          exampleOf(run, ex2[0], ex2[1], "On a 2 × 2 grid the perimeter is 4 cells, so 8 steps are two full laps back to (0,0) — but having arrived from (0,1), the robot now faces South."),
        ],
        ["2 <= width, height <= 100", "1 <= num <= 10^5", "At most 10^4 calls are made to step, getPos and getDir in total"]),
      hints: [
        "After the first step the robot never leaves the border of the grid: it walks the perimeter counterclockwise forever.",
        "The perimeter has `P = 2·(width + height) - 4` cells, so only `num mod P` matters for the position. Keep the robot's index along the perimeter instead of simulating.",
        "Map the index back to a cell and a direction: the bottom row faces East, the right column North, the top row West, the left column South. The one exception is index 0, the start cell: before any move it faces East, but once the robot has moved and returned there it faces South.",
      ],
      editorial: explain({
        idea: "The robot only ever circles the border, so its state is a position `i` along the perimeter of length `P = 2(w + h) - 4`. A step of `num` is `i = (i + num) mod P`; reading the cell and the direction is arithmetic on `i`.",
        steps: [
          "Keep `i = 0` and a flag `moved = false`. `step(num)`: `i = (i + num) % P`, `moved = true`.",
          "If `i < w`: the cell is `(i, 0)`, facing East — except `i == 0` after a move, which faces South.",
          "Else if `i < w + h - 1`: cell `(w - 1, i - (w - 1))`, facing North.",
          "Else if `i < 2w + h - 2`: cell `(w - 1 - (i - (w - 1) - (h - 1)), h - 1)`, facing West.",
          "Otherwise: cell `(0, h - 1 - (i - 2(w - 1) - (h - 1)))`, facing South.",
        ],
        why: "From `(0, 0)` facing East, the turn-when-blocked rule walks the bottom row east, the right column north, the top row west and the left column south, then repeats — so the sequence of cells is the perimeter in counterclockwise order and is periodic with period `P`. The robot faces the direction of its last move, and it only turns when the next move is blocked, so on arrival at a corner it still faces the side it came along; that is why each corner belongs to the earlier side in the mapping, and why `(0, 0)` faces South once it has been reached by a move.",
        time: "O(1) per call",
        space: "O(1)",
        pitfalls: [
          "Simulating `num` steps one by one is O(num) a call — up to 10^9 steps in total.",
          "`num` a multiple of `P` leaves the position unchanged but can change the direction at `(0, 0)` from East to South.",
          "The robot turns only when blocked, so at a corner it still faces the direction it arrived in.",
        ],
      }),
      examples: [caseOf(run, ex1[0], ex1[1]), caseOf(run, ex2[0], ex2[1])],
      gen: (rng: Rng) => { const { ops, args } = make(rng); return caseOf(run, ops, args); },
      solutions: {
        python: code`
          class Robot:

              def __init__(self, width: int, height: int):
                  self.w, self.h = width, height
                  self.per = 2 * (width + height) - 4  # the robot only circles the border
                  self.i = 0
                  self.moved = False

              def step(self, num: int) -> None:
                  self.i = (self.i + num) % self.per
                  self.moved = True

              def _state(self):
                  w, h, i = self.w, self.h, self.i
                  if i < w:
                      return [i, 0], ("South" if i == 0 and self.moved else "East")
                  if i < w + h - 1:
                      return [w - 1, i - (w - 1)], "North"
                  if i < 2 * w + h - 2:
                      return [w - 1 - (i - (w - 1) - (h - 1)), h - 1], "West"
                  return [0, h - 1 - (i - 2 * (w - 1) - (h - 1))], "South"

              def getPos(self) -> List[int]:
                  return self._state()[0]

              def getDir(self) -> str:
                  return self._state()[1]
        `,
        javascript: code`
          var Robot = function(width, height) {
              this.w = width;
              this.h = height;
              this.per = 2 * (width + height) - 4; // the robot only circles the border
              this.i = 0;
              this.moved = false;
          };

          Robot.prototype.step = function(num) {
              this.i = (this.i + num) % this.per;
              this.moved = true;
          };

          Robot.prototype.state = function() {
              var w = this.w, h = this.h, i = this.i;
              if (i < w) return [[i, 0], i === 0 && this.moved ? "South" : "East"];
              if (i < w + h - 1) return [[w - 1, i - (w - 1)], "North"];
              if (i < 2 * w + h - 2) return [[w - 1 - (i - (w - 1) - (h - 1)), h - 1], "West"];
              return [[0, h - 1 - (i - 2 * (w - 1) - (h - 1))], "South"];
          };

          Robot.prototype.getPos = function() {
              return this.state()[0];
          };

          Robot.prototype.getDir = function() {
              return this.state()[1];
          };
        `,
        typescript: code`
          class Robot {
              w: number;
              h: number;
              per: number;
              i: number;
              moved: boolean;

              constructor(width: number, height: number) {
                  this.w = width;
                  this.h = height;
                  this.per = 2 * (width + height) - 4; // the robot only circles the border
                  this.i = 0;
                  this.moved = false;
              }

              step(num: number): void {
                  this.i = (this.i + num) % this.per;
                  this.moved = true;
              }

              getPos(): number[] {
                  var w = this.w, h = this.h, i = this.i;
                  if (i < w) return [i, 0];
                  if (i < w + h - 1) return [w - 1, i - (w - 1)];
                  if (i < 2 * w + h - 2) return [w - 1 - (i - (w - 1) - (h - 1)), h - 1];
                  return [0, h - 1 - (i - 2 * (w - 1) - (h - 1))];
              }

              getDir(): string {
                  var w = this.w, h = this.h, i = this.i;
                  if (i < w) return i === 0 && this.moved ? "South" : "East";
                  if (i < w + h - 1) return "North";
                  if (i < 2 * w + h - 2) return "West";
                  return "South";
              }
          }
        `,
        java: code`
          class Robot {
              private int w, h, per, i = 0; // the robot only circles the border
              private boolean moved = false;

              public Robot(int width, int height) {
                  w = width;
                  h = height;
                  per = 2 * (width + height) - 4;
              }

              public void step(int num) {
                  i = (i + num) % per;
                  moved = true;
              }

              public int[] getPos() {
                  if (i < w) return new int[]{i, 0};
                  if (i < w + h - 1) return new int[]{w - 1, i - (w - 1)};
                  if (i < 2 * w + h - 2) return new int[]{w - 1 - (i - (w - 1) - (h - 1)), h - 1};
                  return new int[]{0, h - 1 - (i - 2 * (w - 1) - (h - 1))};
              }

              public String getDir() {
                  if (i < w) return i == 0 && moved ? "South" : "East";
                  if (i < w + h - 1) return "North";
                  if (i < 2 * w + h - 2) return "West";
                  return "South";
              }
          }
        `,
        cpp: code`
          class Robot {
              int w, h, per, i = 0; // the robot only circles the border
              bool moved = false;
          public:
              Robot(int width, int height) : w(width), h(height), per(2 * (width + height) - 4) {}

              void step(int num) {
                  i = (i + num) % per;
                  moved = true;
              }

              vector<int> getPos() {
                  if (i < w) return {i, 0};
                  if (i < w + h - 1) return {w - 1, i - (w - 1)};
                  if (i < 2 * w + h - 2) return {w - 1 - (i - (w - 1) - (h - 1)), h - 1};
                  return {0, h - 1 - (i - 2 * (w - 1) - (h - 1))};
              }

              string getDir() {
                  if (i < w) return i == 0 && moved ? "South" : "East";
                  if (i < w + h - 1) return "North";
                  if (i < 2 * w + h - 2) return "West";
                  return "South";
              }
          };
        `,
        c: code`
          typedef struct {
              int w, h, per, i; /* the robot only circles the border */
              bool moved;
          } Robot;

          Robot* robotCreate(int width, int height) {
              Robot* o = (Robot*)malloc(sizeof(Robot));
              o->w = width;
              o->h = height;
              o->per = 2 * (width + height) - 4;
              o->i = 0;
              o->moved = false;
              return o;
          }

          void robotStep(Robot* obj, int num) {
              obj->i = (obj->i + num) % obj->per;
              obj->moved = true;
          }

          int* robotGetPos(Robot* obj, int* returnSize) {
              int w = obj->w, h = obj->h, i = obj->i;
              int* p = (int*)malloc(2 * sizeof(int));
              if (i < w) { p[0] = i; p[1] = 0; }
              else if (i < w + h - 1) { p[0] = w - 1; p[1] = i - (w - 1); }
              else if (i < 2 * w + h - 2) { p[0] = w - 1 - (i - (w - 1) - (h - 1)); p[1] = h - 1; }
              else { p[0] = 0; p[1] = h - 1 - (i - 2 * (w - 1) - (h - 1)); }
              *returnSize = 2;
              return p;
          }

          char* robotGetDir(Robot* obj) {
              int w = obj->w, h = obj->h, i = obj->i;
              if (i < w) return i == 0 && obj->moved ? "South" : "East";
              if (i < w + h - 1) return "North";
              if (i < 2 * w + h - 2) return "West";
              return "South";
          }

          void robotFree(Robot* obj) {
              free(obj);
          }
        `,
        csharp: code`
          public class Robot {
              private int w, h, per, i = 0; // the robot only circles the border
              private bool moved = false;

              public Robot(int width, int height) {
                  w = width;
                  h = height;
                  per = 2 * (width + height) - 4;
              }

              public void Step(int num) {
                  i = (i + num) % per;
                  moved = true;
              }

              public int[] GetPos() {
                  if (i < w) return new int[] { i, 0 };
                  if (i < w + h - 1) return new int[] { w - 1, i - (w - 1) };
                  if (i < 2 * w + h - 2) return new int[] { w - 1 - (i - (w - 1) - (h - 1)), h - 1 };
                  return new int[] { 0, h - 1 - (i - 2 * (w - 1) - (h - 1)) };
              }

              public string GetDir() {
                  if (i < w) return i == 0 && moved ? "South" : "East";
                  if (i < w + h - 1) return "North";
                  if (i < 2 * w + h - 2) return "West";
                  return "South";
              }
          }
        `,
        go: code`
          type Robot struct {
          	w, h, per, i int // the robot only circles the border
          	moved        bool
          }

          func Constructor(width int, height int) Robot {
          	return Robot{w: width, h: height, per: 2*(width+height) - 4}
          }

          func (this *Robot) Step(num int) {
          	this.i = (this.i + num) % this.per
          	this.moved = true
          }

          func (this *Robot) GetPos() []int {
          	w, h, i := this.w, this.h, this.i
          	switch {
          	case i < w:
          		return []int{i, 0}
          	case i < w+h-1:
          		return []int{w - 1, i - (w - 1)}
          	case i < 2*w+h-2:
          		return []int{w - 1 - (i - (w - 1) - (h - 1)), h - 1}
          	}
          	return []int{0, h - 1 - (i - 2*(w-1) - (h - 1))}
          }

          func (this *Robot) GetDir() string {
          	w, h, i := this.w, this.h, this.i
          	switch {
          	case i < w:
          		if i == 0 && this.moved {
          			return "South"
          		}
          		return "East"
          	case i < w+h-1:
          		return "North"
          	case i < 2*w+h-2:
          		return "West"
          	}
          	return "South"
          }
        `,
        kotlin: code`
          class Robot(width: Int, height: Int) {
              private val w = width
              private val h = height
              private val per = 2 * (width + height) - 4 // the robot only circles the border
              private var i = 0
              private var moved = false

              fun step(num: Int) {
                  i = (i + num) % per
                  moved = true
              }

              fun getPos(): IntArray = when {
                  i < w -> intArrayOf(i, 0)
                  i < w + h - 1 -> intArrayOf(w - 1, i - (w - 1))
                  i < 2 * w + h - 2 -> intArrayOf(w - 1 - (i - (w - 1) - (h - 1)), h - 1)
                  else -> intArrayOf(0, h - 1 - (i - 2 * (w - 1) - (h - 1)))
              }

              fun getDir(): String = when {
                  i < w -> if (i == 0 && moved) "South" else "East"
                  i < w + h - 1 -> "North"
                  i < 2 * w + h - 2 -> "West"
                  else -> "South"
              }
          }
        `,
        swift: code`
          class Robot {
              let w: Int, h: Int, per: Int // the robot only circles the border
              var i = 0
              var moved = false

              init(_ width: Int, _ height: Int) {
                  w = width
                  h = height
                  per = 2 * (width + height) - 4
              }

              func step(_ num: Int) {
                  i = (i + num) % per
                  moved = true
              }

              func getPos() -> [Int] {
                  if i < w { return [i, 0] }
                  if i < w + h - 1 { return [w - 1, i - (w - 1)] }
                  if i < 2 * w + h - 2 { return [w - 1 - (i - (w - 1) - (h - 1)), h - 1] }
                  return [0, h - 1 - (i - 2 * (w - 1) - (h - 1))]
              }

              func getDir() -> String {
                  if i < w { return i == 0 && moved ? "South" : "East" }
                  if i < w + h - 1 { return "North" }
                  if i < 2 * w + h - 2 { return "West" }
                  return "South"
              }
          }
        `,
        rust: code`
          struct Robot {
              w: i32,
              h: i32,
              per: i32, // the robot only circles the border
              i: i32,
              moved: bool,
          }

          impl Robot {
              fn new(width: i32, height: i32) -> Self {
                  Robot { w: width, h: height, per: 2 * (width + height) - 4, i: 0, moved: false }
              }

              fn step(&mut self, num: i32) {
                  self.i = (self.i + num) % self.per;
                  self.moved = true;
              }

              fn getPos(&mut self) -> Vec<i32> {
                  let (w, h, i) = (self.w, self.h, self.i);
                  if i < w { vec![i, 0] }
                  else if i < w + h - 1 { vec![w - 1, i - (w - 1)] }
                  else if i < 2 * w + h - 2 { vec![w - 1 - (i - (w - 1) - (h - 1)), h - 1] }
                  else { vec![0, h - 1 - (i - 2 * (w - 1) - (h - 1))] }
              }

              fn getDir(&mut self) -> String {
                  let (w, h, i) = (self.w, self.h, self.i);
                  let d = if i < w { if i == 0 && self.moved { "South" } else { "East" } }
                      else if i < w + h - 1 { "North" }
                      else if i < 2 * w + h - 2 { "West" }
                      else { "South" };
                  d.to_string()
              }
          }
        `,
        php: code`
          class Robot {
              private $w;
              private $h;
              private $per; // the robot only circles the border
              private $i = 0;
              private $moved = false;

              function __construct($width, $height) {
                  $this->w = $width;
                  $this->h = $height;
                  $this->per = 2 * ($width + $height) - 4;
              }

              function step($num) {
                  $this->i = ($this->i + $num) % $this->per;
                  $this->moved = true;
              }

              function getPos() {
                  $w = $this->w; $h = $this->h; $i = $this->i;
                  if ($i < $w) return [$i, 0];
                  if ($i < $w + $h - 1) return [$w - 1, $i - ($w - 1)];
                  if ($i < 2 * $w + $h - 2) return [$w - 1 - ($i - ($w - 1) - ($h - 1)), $h - 1];
                  return [0, $h - 1 - ($i - 2 * ($w - 1) - ($h - 1))];
              }

              function getDir() {
                  $w = $this->w; $h = $this->h; $i = $this->i;
                  if ($i < $w) return $i == 0 && $this->moved ? "South" : "East";
                  if ($i < $w + $h - 1) return "North";
                  if ($i < 2 * $w + $h - 2) return "West";
                  return "South";
              }
          }
        `,
        ruby: code`
          class Robot
            def initialize(width, height)
              @w = width
              @h = height
              @per = 2 * (width + height) - 4 # the robot only circles the border
              @i = 0
              @moved = false
            end

            def step(num)
              @i = (@i + num) % @per
              @moved = true
            end

            def getPos
              w, h, i = @w, @h, @i
              return [i, 0] if i < w
              return [w - 1, i - (w - 1)] if i < w + h - 1
              return [w - 1 - (i - (w - 1) - (h - 1)), h - 1] if i < 2 * w + h - 2
              [0, h - 1 - (i - 2 * (w - 1) - (h - 1))]
            end

            def getDir
              w, h, i = @w, @h, @i
              return (i == 0 && @moved ? "South" : "East") if i < w
              return "North" if i < w + h - 1
              return "West" if i < 2 * w + h - 2
              "South"
            end
          end
        `,
      },
    };
  })(),

  // ── Range Frequency Queries (LC 2080) ─────────────────────────────
  (() => {
    const run: Run = (ops, args) => {
      let arr: number[] = [];
      return ops.map((op, k) => {
        if (op === "RangeFreqQuery") { arr = args[k][0]; return null; }
        const [l, r, v] = args[k] as number[];
        let c = 0;
        for (let i = l; i <= r; i++) if (arr[i] === v) c++;
        return c;
      });
    };
    const make = (rng: Rng) => {
      const n = ri(rng, 1, pick(rng, [1, 5, 15, 40]));
      const vhi = pick(rng, [1, 2, 3, 5, 10000]);
      const arr = Array.from({ length: n }, () => ri(rng, 1, vhi));
      const ops = ["RangeFreqQuery"], args: Args = [[arr]];
      for (let m = ri(rng, 1, pick(rng, [3, 10, 25, 40])); m > 0; m--) {
        const a = ri(rng, 0, n - 1), b = ri(rng, 0, n - 1);
        ops.push("query");
        args.push([Math.min(a, b), Math.max(a, b), rng() < 0.8 ? pick(rng, arr) : ri(rng, 1, 10000)]);
      }
      return { ops, args };
    };
    const ex1: [string[], Args] = [
      ["RangeFreqQuery", "query", "query", "query"],
      [[[12, 33, 4, 56, 22, 2, 34, 33, 22, 12, 34, 56]], [1, 2, 4], [0, 11, 33], [4, 8, 22]],
    ];
    const ex2: [string[], Args] = [["RangeFreqQuery", "query", "query"], [[[7, 7, 7]], [0, 0, 7], [1, 2, 5]]];
    return {
      slug: "range-frequency-queries",
      title: "Range Frequency Queries",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Binary Search", "Segment Tree", "Design"],
      signature: {
        funcName: "RangeFreqQuery", params: [{ name: "arr", type: "int[]" as const }], returns: "void" as const,
        methods: [
          { name: "query", params: [{ name: "left", type: "int" as const }, { name: "right", type: "int" as const }, { name: "value", type: "int" as const }], returns: "int" as const },
        ],
      },
      description: describe(
        "Answer many questions of the form \"how often does `value` occur in this stretch of the array?\" quickly.\n\nWrite the class `RangeFreqQuery`:\n\n- `RangeFreqQuery(int[] arr)` stores the 0-indexed array `arr`.\n- `int query(int left, int right, int value)` returns how many times `value` occurs in the subarray `arr[left..right]` (both ends included).\n\n" + CALLS,
        [
          exampleOf(run, ex1[0], ex1[1], "4 occurs once in [33,4]. 33 occurs twice in the whole array. In [22,2,34,33,22] the value 22 occurs twice."),
          exampleOf(run, ex2[0], ex2[1], "The single element at index 0 is 7; there is no 5 at all."),
        ],
        ["1 <= arr.length <= 10^5", "1 <= arr[i], value <= 10^4", "0 <= left <= right < arr.length", "At most 10^5 calls are made to query"]),
      hints: [
        "Counting through the range is O(n) per query — 10^10 steps at the limits. Precompute something per value instead.",
        "For each value, record the sorted list of indices where it occurs (one left-to-right pass builds them all already sorted).",
        "The answer is the number of those indices inside `[left, right]`: binary search for the first index `>= left` and the first index `> right`, and subtract.",
      ],
      editorial: explain({
        idea: "Group the indices by value. Each group is sorted, so the occurrences inside `[left, right]` form a contiguous block of it whose size two binary searches give.",
        steps: [
          "Constructor: for `i` from 0 to `n - 1`, append `i` to `positions[arr[i]]`.",
          "`query(left, right, value)`: if `value` has no positions, return 0.",
          "Otherwise return `upperBound(positions[value], right) - lowerBound(positions[value], left)` — the number of stored indices `i` with `left <= i <= right`.",
        ],
        why: "`positions[value]` lists exactly the indices holding `value`, in increasing order because they were appended left to right. In a sorted list, the elements in `[left, right]` are those from the first one `>= left` up to (not including) the first one `> right`, so the difference of the two search positions is their count.",
        time: "O(n) to build, O(log n) per query",
        space: "O(n)",
        pitfalls: [
          "The range is inclusive on both ends: search `> right` for the end, not `>= right`.",
          "A value that never occurs has no list; answer 0 instead of indexing a missing key.",
          "A segment tree of frequency maps also works, but it costs O(n log n) memory for no gain here.",
        ],
      }),
      examples: [caseOf(run, ex1[0], ex1[1]), caseOf(run, ex2[0], ex2[1])],
      gen: (rng: Rng) => { const { ops, args } = make(rng); return caseOf(run, ops, args); },
      solutions: {
        python: code`
          import bisect

          class RangeFreqQuery:

              def __init__(self, arr: List[int]):
                  self.pos = {}
                  for i, v in enumerate(arr):
                      self.pos.setdefault(v, []).append(i)  # appended in order, so sorted

              def query(self, left: int, right: int, value: int) -> int:
                  p = self.pos.get(value)
                  if not p:
                      return 0
                  return bisect.bisect_right(p, right) - bisect.bisect_left(p, left)
        `,
        javascript: code`
          function rfqLower(p, x) { // first index whose position is >= x
              var lo = 0, hi = p.length;
              while (lo < hi) { var mid = (lo + hi) >> 1; if (p[mid] < x) lo = mid + 1; else hi = mid; }
              return lo;
          }

          var RangeFreqQuery = function(arr) {
              this.pos = new Map();
              for (var i = 0; i < arr.length; i++) { // appended in order, so sorted
                  if (!this.pos.has(arr[i])) this.pos.set(arr[i], []);
                  this.pos.get(arr[i]).push(i);
              }
          };

          RangeFreqQuery.prototype.query = function(left, right, value) {
              var p = this.pos.get(value);
              if (!p) return 0;
              return rfqLower(p, right + 1) - rfqLower(p, left);
          };
        `,
        typescript: code`
          function rfqLower(p: number[], x: number): number { // first index whose position is >= x
              var lo = 0, hi = p.length;
              while (lo < hi) { var mid = (lo + hi) >> 1; if (p[mid] < x) lo = mid + 1; else hi = mid; }
              return lo;
          }

          class RangeFreqQuery {
              pos: { [v: number]: number[] };

              constructor(arr: number[]) {
                  this.pos = {};
                  for (var i = 0; i < arr.length; i++) { // appended in order, so sorted
                      if (!this.pos[arr[i]]) this.pos[arr[i]] = [];
                      this.pos[arr[i]].push(i);
                  }
              }

              query(left: number, right: number, value: number): number {
                  var p = this.pos[value];
                  if (!p) return 0;
                  return rfqLower(p, right + 1) - rfqLower(p, left);
              }
          }
        `,
        java: code`
          class RangeFreqQuery {
              private HashMap<Integer, List<Integer>> pos = new HashMap<>();

              public RangeFreqQuery(int[] arr) {
                  for (int i = 0; i < arr.length; i++) pos.computeIfAbsent(arr[i], k -> new ArrayList<>()).add(i); // sorted
              }

              private static int lower(List<Integer> p, int x) { // first index whose position is >= x
                  int lo = 0, hi = p.size();
                  while (lo < hi) { int mid = (lo + hi) >>> 1; if (p.get(mid) < x) lo = mid + 1; else hi = mid; }
                  return lo;
              }

              public int query(int left, int right, int value) {
                  List<Integer> p = pos.get(value);
                  if (p == null) return 0;
                  return lower(p, right + 1) - lower(p, left);
              }
          }
        `,
        cpp: code`
          class RangeFreqQuery {
              unordered_map<int, vector<int>> pos;
          public:
              RangeFreqQuery(vector<int>& arr) {
                  for (int i = 0; i < (int)arr.size(); i++) pos[arr[i]].push_back(i); // appended in order, so sorted
              }

              int query(int left, int right, int value) {
                  auto it = pos.find(value);
                  if (it == pos.end()) return 0;
                  auto& p = it->second;
                  return upper_bound(p.begin(), p.end(), right) - lower_bound(p.begin(), p.end(), left);
              }
          };
        `,
        c: code`
          /* No hash map in C: sort the keys value * 100001 + index (below 2^31 since
             value <= 10^4 and index < 10^5); one value's indices are then a sorted run. */
          typedef struct {
              int* keys;
              int n;
          } RangeFreqQuery;

          static int rfqCmp(const void* a, const void* b) {
              int x = *(const int*)a, y = *(const int*)b;
              return (x > y) - (x < y);
          }

          static int rfqLower(RangeFreqQuery* o, int x) { /* first key >= x */
              int lo = 0, hi = o->n;
              while (lo < hi) { int mid = (lo + hi) / 2; if (o->keys[mid] < x) lo = mid + 1; else hi = mid; }
              return lo;
          }

          RangeFreqQuery* rangeFreqQueryCreate(int* arr, int arrSize) {
              RangeFreqQuery* o = (RangeFreqQuery*)malloc(sizeof(RangeFreqQuery));
              o->n = arrSize;
              o->keys = (int*)malloc(arrSize * sizeof(int));
              for (int i = 0; i < arrSize; i++) o->keys[i] = arr[i] * 100001 + i;
              qsort(o->keys, arrSize, sizeof(int), rfqCmp);
              return o;
          }

          int rangeFreqQueryQuery(RangeFreqQuery* obj, int left, int right, int value) {
              int base = value * 100001;
              return rfqLower(obj, base + right + 1) - rfqLower(obj, base + left);
          }

          void rangeFreqQueryFree(RangeFreqQuery* obj) {
              free(obj->keys);
              free(obj);
          }
        `,
        csharp: code`
          public class RangeFreqQuery {
              private Dictionary<int, List<int>> pos = new Dictionary<int, List<int>>();

              public RangeFreqQuery(int[] arr) {
                  for (int i = 0; i < arr.Length; i++) { // appended in order, so sorted
                      if (!pos.ContainsKey(arr[i])) pos[arr[i]] = new List<int>();
                      pos[arr[i]].Add(i);
                  }
              }

              private static int Lower(List<int> p, int x) { // first index whose position is >= x
                  int lo = 0, hi = p.Count;
                  while (lo < hi) { int mid = (lo + hi) / 2; if (p[mid] < x) lo = mid + 1; else hi = mid; }
                  return lo;
              }

              public int Query(int left, int right, int value) {
                  List<int> p;
                  if (!pos.TryGetValue(value, out p)) return 0;
                  return Lower(p, right + 1) - Lower(p, left);
              }
          }
        `,
        go: code`
          type RangeFreqQuery struct {
          	pos map[int][]int
          }

          func Constructor(arr []int) RangeFreqQuery {
          	pos := map[int][]int{}
          	for i, v := range arr {
          		pos[v] = append(pos[v], i) // appended in order, so sorted
          	}
          	return RangeFreqQuery{pos: pos}
          }

          func (this *RangeFreqQuery) Query(left int, right int, value int) int {
          	p := this.pos[value]
          	return sort.SearchInts(p, right+1) - sort.SearchInts(p, left)
          }
        `,
        kotlin: code`
          class RangeFreqQuery(arr: IntArray) {
              private val pos = HashMap<Int, MutableList<Int>>()

              init {
                  for (i in arr.indices) pos.getOrPut(arr[i]) { ArrayList<Int>() }.add(i) // appended in order, so sorted
              }

              private fun lower(p: List<Int>, x: Int): Int { // first index whose position is >= x
                  var lo = 0
                  var hi = p.size
                  while (lo < hi) {
                      val mid = (lo + hi) / 2
                      if (p[mid] < x) lo = mid + 1 else hi = mid
                  }
                  return lo
              }

              fun query(left: Int, right: Int, value: Int): Int {
                  val p = pos[value] ?: return 0
                  return lower(p, right + 1) - lower(p, left)
              }
          }
        `,
        swift: code`
          class RangeFreqQuery {
              var pos: [Int: [Int]] = [:]

              init(_ arr: [Int]) {
                  for (i, v) in arr.enumerated() { pos[v, default: []].append(i) } // appended in order, so sorted
              }

              func lower(_ p: [Int], _ x: Int) -> Int { // first index whose position is >= x
                  var lo = 0, hi = p.count
                  while lo < hi {
                      let mid = (lo + hi) / 2
                      if p[mid] < x { lo = mid + 1 } else { hi = mid }
                  }
                  return lo
              }

              func query(_ left: Int, _ right: Int, _ value: Int) -> Int {
                  guard let p = pos[value] else { return 0 }
                  return lower(p, right + 1) - lower(p, left)
              }
          }
        `,
        rust: code`
          use std::collections::HashMap;

          struct RangeFreqQuery {
              pos: HashMap<i32, Vec<i32>>,
          }

          fn rfq_lower(p: &Vec<i32>, x: i32) -> usize { // first index whose position is >= x
              let (mut lo, mut hi) = (0usize, p.len());
              while lo < hi {
                  let mid = (lo + hi) / 2;
                  if p[mid] < x { lo = mid + 1; } else { hi = mid; }
              }
              lo
          }

          impl RangeFreqQuery {
              fn new(arr: Vec<i32>) -> Self {
                  let mut pos: HashMap<i32, Vec<i32>> = HashMap::new();
                  for (i, &v) in arr.iter().enumerate() { pos.entry(v).or_insert_with(Vec::new).push(i as i32); } // sorted
                  RangeFreqQuery { pos }
              }

              fn query(&mut self, left: i32, right: i32, value: i32) -> i32 {
                  match self.pos.get(&value) {
                      None => 0,
                      Some(p) => (rfq_lower(p, right + 1) - rfq_lower(p, left)) as i32,
                  }
              }
          }
        `,
        php: code`
          class RangeFreqQuery {
              private $pos = [];

              function __construct($arr) {
                  foreach ($arr as $i => $v) $this->pos[$v][] = $i; // appended in order, so sorted
              }

              private static function lower($p, $x) { // first index whose position is >= x
                  $lo = 0; $hi = count($p);
                  while ($lo < $hi) {
                      $mid = intdiv($lo + $hi, 2);
                      if ($p[$mid] < $x) $lo = $mid + 1; else $hi = $mid;
                  }
                  return $lo;
              }

              function query($left, $right, $value) {
                  if (!isset($this->pos[$value])) return 0;
                  $p = $this->pos[$value];
                  return self::lower($p, $right + 1) - self::lower($p, $left);
              }
          }
        `,
        ruby: code`
          class RangeFreqQuery
            def initialize(arr)
              @pos = Hash.new { |h, k| h[k] = [] }
              arr.each_with_index { |v, i| @pos[v] << i } # appended in order, so sorted
            end

            def query(left, right, value)
              return 0 unless @pos.key?(value)
              p = @pos[value]
              hi = p.bsearch_index { |x| x > right } || p.length
              lo = p.bsearch_index { |x| x >= left } || p.length
              hi - lo
            end
          end
        `,
      },
    };
  })(),
];
