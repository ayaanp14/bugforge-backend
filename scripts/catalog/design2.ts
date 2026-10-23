/**
 * Design problems, second set — wave 7, batch 36.
 * Real problems only: LeetCode numbered classics that ask for a class whose
 * methods are called in sequence (hash set/map, LRU cache, min stack, tries,
 * range-sum structures, circular queues, calendars, Twitter's feed). Worked
 * examples are phrased for CodeKairo.
 *
 * Wire format (src/lib/driver-structures.ts): a case is two lines — the
 * operations, then each one's arguments, the constructor's first — and the
 * answer is one JSON array with null for the constructor and for every void
 * method. Each problem's `run` replays a sequence against the plainest model
 * of the structure (a JS Set, Map, array scan) — that model, not the
 * solutions' data structure, is what every expected output comes from.
 *
 * Judge contract: no string ever holds `"` or `\`, and nothing holds a
 * `__CODEKAIRO_` sentinel. JS solutions are Node 12-safe (no ??, ?., at(),
 * replaceAll, flat or flatMap, no class fields); TypeScript is the plain
 * `var` style. The C harness has no math.h or limits.h. PHP runs inside
 * `namespace Solution;`, so built-in classes are written `\SplQueue`; Rust is
 * 1.40 (no `matches!`), Kotlin 1.3 (java.util.ArrayDeque, never
 * kotlin.collections'), Swift 5.2, Go 1.13. No parameter is named `val` —
 * it is a Kotlin keyword — so LeetCode's `val` becomes `value` or `x`, and
 * My Calendar's `start`/`end` are `startTime`/`endTime` (Ruby's `end`).
 *
 * Generated sequences stay at 40 operations or fewer (5,000 hidden cases a
 * problem in one judge process); the statements keep the real constraints.
 */
import {
  code, describe, designInput, explain, pick, randLower, ri, shuffle,
  type CatalogProblem, type Rng,
} from "./types.js";

/** The sentence every statement ends its intro with. */
const CALLS = "The judge calls the methods in the order listed in the first input line, with the arguments in the second; the expected output holds each call's result, `null` for the constructor and for every `void` method.";

/** A visible or hidden case from a sequence and the reference replay. */
const caseOf = <A extends unknown[][]>(ops: string[], args: A, run: (o: string[], a: A) => unknown[]) =>
  ({ input: designInput(ops, args), expectedOutput: JSON.stringify(run(ops, args)) });

/** An example block for describe(): the two input lines, the output, a note. */
const exOf = <A extends unknown[][]>(ops: string[], args: A, run: (o: string[], a: A) => unknown[], note: string) =>
  ({ in: designInput(ops, args), out: JSON.stringify(run(ops, args)), note });

/** A key that is often one seen before, sometimes a fresh one, sometimes a bucket neighbour of an old one. */
const keyFrom = (rng: Rng, used: number[], top: number) => {
  const r = rng();
  if (used.length && r < 0.45) return pick(rng, used);
  if (used.length && r < 0.6) { const k = pick(rng, used) + 769 * ri(rng, 1, 3); if (k <= top) return k; }
  const k = ri(rng, 0, top);
  used.push(k);
  return k;
};

export const DESIGN2_PROBLEMS: CatalogProblem[] = [

  // ── Design HashSet (LC 705) ───────────────────────────────────────
  (() => {
    const run = (ops: string[], args: number[][]) => {
      const s = new Set<number>();
      return ops.map((op, i) => {
        if (op === "add") { s.add(args[i][0]); return null; }
        if (op === "remove") { s.delete(args[i][0]); return null; }
        if (op === "contains") return s.has(args[i][0]);
        return null;
      });
    };
    const ex = [
      { ops: ["MyHashSet", "add", "add", "contains", "contains", "add", "contains", "remove", "contains"], args: [[], [3], [8], [3], [5], [8], [8], [8], [8]] },
      { ops: ["MyHashSet", "contains", "remove", "add", "add", "contains", "contains"], args: [[], [0], [0], [1000000], [0], [1000000], [0]] },
    ];
    return {
      slug: "design-hashset",
      title: "Design HashSet",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "Design", "Amazon", "Microsoft", "Google", "Apple"],
      signature: {
        funcName: "MyHashSet", params: [], returns: "void" as const,
        methods: [
          { name: "add", params: [{ name: "key", type: "int" as const }], returns: "void" as const },
          { name: "remove", params: [{ name: "key", type: "int" as const }], returns: "void" as const },
          { name: "contains", params: [{ name: "key", type: "int" as const }], returns: "bool" as const },
        ],
      },
      description: describe(
        "Build a set of integers **without** using your language's built-in hash table or set. Write the class `MyHashSet`:\n\n- `MyHashSet()` creates an empty set.\n- `void add(int key)` puts `key` into the set (adding a key that is already there changes nothing).\n- `void remove(int key)` takes `key` out of the set; if it is not there, nothing happens.\n- `boolean contains(int key)` returns whether `key` is in the set.\n\n" + CALLS,
        [
          exOf(ex[0].ops, ex[0].args, run, "3 and 8 go in; 5 never did. Adding 8 a second time changes nothing, and once 8 is removed it is gone."),
          exOf(ex[1].ops, ex[1].args, run, "Removing a key that was never added is allowed and does nothing. 0 and 1000000 are the smallest and largest keys."),
        ],
        ["0 <= key <= 10^6", "At most 10^4 calls are made to add, remove and contains"]),
      hints: [
        "With keys up to 10^6 a boolean array would work, but the point is the general technique: map each key to one of a fixed number of buckets.",
        "Use `key % B` for a prime `B` such as 769 as the bucket index. Different keys can land in the same bucket — that is a collision.",
        "Make each bucket a small list (separate chaining): `add` appends only if the key is not already in that bucket's list, `remove` deletes it from there, `contains` scans that one list.",
      ],
      editorial: explain({
        idea: "Separate chaining: an array of `B` buckets, each a short list of keys. A key lives in bucket `key % B`, so every operation only looks at one bucket's list instead of the whole set.",
        steps: [
          "Create `B = 769` empty buckets (a prime spreads keys evenly).",
          "`add(key)`: look in bucket `key % B`; append `key` if it is not already there.",
          "`remove(key)`: look in bucket `key % B`; delete `key` if it is there.",
          "`contains(key)`: report whether bucket `key % B` holds `key`.",
        ],
        why: "Every key is only ever stored in, searched in and removed from the one bucket its hash picks, so a key is in the set exactly when it is in that bucket's list, and the duplicate check on `add` keeps each key there at most once.",
        time: "O(n / B) per operation on average, where n is the number of keys stored",
        space: "O(B + n)",
        pitfalls: [
          "Appending without checking first lets a key appear twice in a bucket; one `remove` would then leave a copy behind.",
          "In Java, `list.remove(key)` with an `int` removes by **index** — remove `Integer.valueOf(key)`.",
        ],
      }),
      examples: ex.map((e) => caseOf(e.ops, e.args, run)),
      gen: (rng: Rng) => {
        const top = pick(rng, [5, 20, 1000, 1000000]);
        const ops = ["MyHashSet"], args: number[][] = [[]], used: number[] = [];
        for (let m = ri(rng, 1, pick(rng, [3, 12, 25, 40])); m > 0; m--) {
          const r = rng(), key = keyFrom(rng, used, top);
          ops.push(r < 0.4 ? "add" : r < 0.62 ? "remove" : "contains");
          args.push([key]);
        }
        return caseOf(ops, args, run);
      },
      solutions: {
        python: code`
          class MyHashSet:

              def __init__(self):
                  self.size = 769
                  self.buckets = [[] for _ in range(self.size)]

              def add(self, key: int) -> None:
                  b = self.buckets[key % self.size]
                  if key not in b:
                      b.append(key)

              def remove(self, key: int) -> None:
                  b = self.buckets[key % self.size]
                  if key in b:
                      b.remove(key)

              def contains(self, key: int) -> bool:
                  return key in self.buckets[key % self.size]
        `,
        javascript: code`
          var MyHashSet = function() {
              this.size = 769;
              this.buckets = [];
              for (var i = 0; i < this.size; i++) this.buckets.push([]);
          };

          MyHashSet.prototype.add = function(key) {
              var b = this.buckets[key % this.size];
              if (b.indexOf(key) < 0) b.push(key);
          };

          MyHashSet.prototype.remove = function(key) {
              var b = this.buckets[key % this.size];
              var i = b.indexOf(key);
              if (i >= 0) b.splice(i, 1);
          };

          MyHashSet.prototype.contains = function(key) {
              return this.buckets[key % this.size].indexOf(key) >= 0;
          };
        `,
        typescript: code`
          class MyHashSet {
              size: number;
              buckets: number[][];

              constructor() {
                  this.size = 769;
                  this.buckets = [];
                  for (var i = 0; i < this.size; i++) this.buckets.push([]);
              }

              add(key: number): void {
                  var b = this.buckets[key % this.size];
                  if (b.indexOf(key) < 0) b.push(key);
              }

              remove(key: number): void {
                  var b = this.buckets[key % this.size];
                  var i = b.indexOf(key);
                  if (i >= 0) b.splice(i, 1);
              }

              contains(key: number): boolean {
                  return this.buckets[key % this.size].indexOf(key) >= 0;
              }
          }
        `,
        java: code`
          class MyHashSet {
              private static final int SIZE = 769;
              private List<List<Integer>> buckets = new ArrayList<>();

              public MyHashSet() {
                  for (int i = 0; i < SIZE; i++) buckets.add(new LinkedList<>());
              }

              public void add(int key) {
                  List<Integer> b = buckets.get(key % SIZE);
                  if (!b.contains(key)) b.add(key);
              }

              public void remove(int key) {
                  buckets.get(key % SIZE).remove(Integer.valueOf(key)); // by value, not by index
              }

              public boolean contains(int key) {
                  return buckets.get(key % SIZE).contains(key);
              }
          }
        `,
        cpp: code`
          class MyHashSet {
              static const int SIZE = 769;
              vector<list<int>> buckets;
          public:
              MyHashSet() : buckets(SIZE) {}

              void add(int key) {
                  list<int>& b = buckets[key % SIZE];
                  if (find(b.begin(), b.end(), key) == b.end()) b.push_back(key);
              }

              void remove(int key) {
                  buckets[key % SIZE].remove(key);
              }

              bool contains(int key) {
                  list<int>& b = buckets[key % SIZE];
                  return find(b.begin(), b.end(), key) != b.end();
              }
          };
        `,
        c: code`
          #define HS_SIZE 769

          typedef struct HsNode {
              int key;
              struct HsNode* next;
          } HsNode;

          typedef struct {
              HsNode* buckets[HS_SIZE];
          } MyHashSet;

          MyHashSet* myHashSetCreate() {
              return (MyHashSet*)calloc(1, sizeof(MyHashSet));
          }

          bool myHashSetContains(MyHashSet* obj, int key) {
              for (HsNode* n = obj->buckets[key % HS_SIZE]; n != NULL; n = n->next)
                  if (n->key == key) return true;
              return false;
          }

          void myHashSetAdd(MyHashSet* obj, int key) {
              if (myHashSetContains(obj, key)) return;
              HsNode* n = (HsNode*)malloc(sizeof(HsNode));
              n->key = key;
              n->next = obj->buckets[key % HS_SIZE];
              obj->buckets[key % HS_SIZE] = n;
          }

          void myHashSetRemove(MyHashSet* obj, int key) {
              HsNode** link = &obj->buckets[key % HS_SIZE];
              while (*link != NULL) {
                  if ((*link)->key == key) {
                      HsNode* dead = *link;
                      *link = dead->next;
                      free(dead);
                      return;
                  }
                  link = &(*link)->next;
              }
          }

          void myHashSetFree(MyHashSet* obj) {
              for (int i = 0; i < HS_SIZE; i++) {
                  HsNode* n = obj->buckets[i];
                  while (n != NULL) { HsNode* next = n->next; free(n); n = next; }
              }
              free(obj);
          }
        `,
        csharp: code`
          public class MyHashSet {
              private const int Size = 769;
              private List<int>[] buckets = new List<int>[Size];

              public MyHashSet() {
                  for (int i = 0; i < Size; i++) buckets[i] = new List<int>();
              }

              public void Add(int key) {
                  List<int> b = buckets[key % Size];
                  if (!b.Contains(key)) b.Add(key);
              }

              public void Remove(int key) {
                  buckets[key % Size].Remove(key);
              }

              public bool Contains(int key) {
                  return buckets[key % Size].Contains(key);
              }
          }
        `,
        go: code`
          const hsSize = 769

          type MyHashSet struct {
          	buckets [][]int
          }

          func Constructor() MyHashSet {
          	return MyHashSet{buckets: make([][]int, hsSize)}
          }

          func (this *MyHashSet) Add(key int) {
          	if !this.Contains(key) {
          		h := key % hsSize
          		this.buckets[h] = append(this.buckets[h], key)
          	}
          }

          func (this *MyHashSet) Remove(key int) {
          	h := key % hsSize
          	b := this.buckets[h]
          	for i, k := range b {
          		if k == key {
          			this.buckets[h] = append(b[:i], b[i+1:]...)
          			return
          		}
          	}
          }

          func (this *MyHashSet) Contains(key int) bool {
          	for _, k := range this.buckets[key%hsSize] {
          		if k == key {
          			return true
          		}
          	}
          	return false
          }
        `,
        kotlin: code`
          class MyHashSet() {
              private val size = 769
              private val buckets = Array(size) { mutableListOf<Int>() }

              fun add(key: Int) {
                  val b = buckets[key % size]
                  if (!b.contains(key)) b.add(key)
              }

              fun remove(key: Int) {
                  buckets[key % size].remove(key)
              }

              fun contains(key: Int): Boolean = buckets[key % size].contains(key)
          }
        `,
        swift: code`
          class MyHashSet {
              let size = 769
              var buckets: [[Int]]

              init() {
                  buckets = [[Int]](repeating: [], count: size)
              }

              func add(_ key: Int) {
                  if !contains(key) { buckets[key % size].append(key) }
              }

              func remove(_ key: Int) {
                  let h = key % size
                  if let i = buckets[h].firstIndex(of: key) { buckets[h].remove(at: i) }
              }

              func contains(_ key: Int) -> Bool {
                  return buckets[key % size].contains(key)
              }
          }
        `,
        rust: code`
          const HS_SIZE: usize = 769;

          struct MyHashSet {
              buckets: Vec<Vec<i32>>,
          }

          impl MyHashSet {
              fn new() -> Self { MyHashSet { buckets: vec![Vec::new(); HS_SIZE] } }

              fn add(&mut self, key: i32) {
                  let b = &mut self.buckets[key as usize % HS_SIZE];
                  if !b.contains(&key) { b.push(key); }
              }

              fn remove(&mut self, key: i32) {
                  let b = &mut self.buckets[key as usize % HS_SIZE];
                  if let Some(i) = b.iter().position(|&k| k == key) { b.swap_remove(i); }
              }

              fn contains(&mut self, key: i32) -> bool {
                  self.buckets[key as usize % HS_SIZE].contains(&key)
              }
          }
        `,
        php: code`
          class MyHashSet {
              private $size = 769;
              private $buckets = [];

              function __construct() {
                  $this->buckets = array_fill(0, $this->size, []);
              }

              function add($key) {
                  $h = $key % $this->size;
                  if (!in_array($key, $this->buckets[$h], true)) $this->buckets[$h][] = $key;
              }

              function remove($key) {
                  $h = $key % $this->size;
                  $i = array_search($key, $this->buckets[$h], true);
                  if ($i !== false) array_splice($this->buckets[$h], $i, 1);
              }

              function contains($key) {
                  return in_array($key, $this->buckets[$key % $this->size], true);
              }
          }
        `,
        ruby: code`
          class MyHashSet
            SIZE = 769

            def initialize
              @buckets = Array.new(SIZE) { [] }
            end

            def add(key)
              b = @buckets[key % SIZE]
              b << key unless b.include?(key)
            end

            def remove(key)
              @buckets[key % SIZE].delete(key)
            end

            def contains(key)
              @buckets[key % SIZE].include?(key)
            end
          end
        `,
      },
    };
  })(),

  // ── Design HashMap (LC 706) ───────────────────────────────────────
  (() => {
    const run = (ops: string[], args: number[][]) => {
      const m = new Map<number, number>();
      return ops.map((op, i) => {
        if (op === "put") { m.set(args[i][0], args[i][1]); return null; }
        if (op === "remove") { m.delete(args[i][0]); return null; }
        if (op === "get") { const v = m.get(args[i][0]); return v === undefined ? -1 : v; }
        return null;
      });
    };
    const ex = [
      { ops: ["MyHashMap", "put", "put", "get", "get", "put", "get", "remove", "get"], args: [[], [1, 10], [2, 20], [1], [3], [2, 5], [2], [2], [2]] },
      { ops: ["MyHashMap", "get", "put", "put", "get", "remove", "get"], args: [[], [7], [7, 0], [776, 9], [7], [776], [776]] },
    ];
    return {
      slug: "design-hashmap",
      title: "Design HashMap",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "Design", "Amazon", "Microsoft", "Google", "Bloomberg"],
      signature: {
        funcName: "MyHashMap", params: [], returns: "void" as const,
        methods: [
          { name: "put", params: [{ name: "key", type: "int" as const }, { name: "value", type: "int" as const }], returns: "void" as const },
          { name: "get", params: [{ name: "key", type: "int" as const }], returns: "int" as const },
          { name: "remove", params: [{ name: "key", type: "int" as const }], returns: "void" as const },
        ],
      },
      description: describe(
        "Build a map from integer keys to integer values **without** using your language's built-in hash table. Write the class `MyHashMap`:\n\n- `MyHashMap()` creates an empty map.\n- `void put(int key, int value)` stores the pair `(key, value)`; if `key` is already present, its value is replaced.\n- `int get(int key)` returns the value stored for `key`, or `-1` if the map holds no entry for it.\n- `void remove(int key)` deletes the entry for `key` if there is one.\n\n" + CALLS,
        [
          exOf(ex[0].ops, ex[0].args, run, "Key 3 was never stored, so `get(3)` is -1. Putting key 2 again overwrites 20 with 5; after removing key 2, `get(2)` is -1."),
          exOf(ex[1].ops, ex[1].args, run, "A stored value of 0 is a real value, not \"missing\". Keys 7 and 776 share a bucket when there are 769 buckets, and removing one leaves the other alone."),
        ],
        ["0 <= key, value <= 10^6", "At most 10^4 calls are made to put, get and remove"]),
      hints: [
        "Pick a fixed number of buckets `B` and send each key to bucket `key % B`.",
        "Two keys can share a bucket, so a bucket must remember which key each value belongs to: store `(key, value)` pairs.",
        "`put` scans its bucket and overwrites the pair with that key if there is one, otherwise appends; `get` and `remove` scan the same bucket.",
      ],
      editorial: explain({
        idea: "Separate chaining with key/value pairs: `B` buckets, each a short list of `(key, value)` pairs; a key is only ever stored in bucket `key % B`.",
        steps: [
          "Create `B = 769` empty buckets.",
          "`put(key, value)`: in bucket `key % B`, if a pair has this key set its value; otherwise append `(key, value)`.",
          "`get(key)`: return the value of the pair with this key in bucket `key % B`, or `-1`.",
          "`remove(key)`: delete the pair with this key from bucket `key % B`, if any.",
        ],
        why: "Every operation on a key touches only the bucket its hash selects, and `put` never creates a second pair for a key already in that bucket, so each key has at most one pair and `get` finds exactly the value last put.",
        time: "O(n / B) per operation on average",
        space: "O(B + n)",
        pitfalls: [
          "Storing only values in the buckets cannot tell colliding keys apart.",
          "A value of `0` is valid — do not use 0 as the \"absent\" marker.",
        ],
      }),
      examples: ex.map((e) => caseOf(e.ops, e.args, run)),
      gen: (rng: Rng) => {
        const top = pick(rng, [5, 20, 1000, 1000000]);
        const vtop = pick(rng, [9, 1000000]);
        const ops = ["MyHashMap"], args: number[][] = [[]], used: number[] = [];
        for (let m = ri(rng, 1, pick(rng, [3, 12, 25, 40])); m > 0; m--) {
          const r = rng(), key = keyFrom(rng, used, top);
          if (r < 0.45) { ops.push("put"); args.push([key, ri(rng, 0, vtop)]); }
          else if (r < 0.62) { ops.push("remove"); args.push([key]); }
          else { ops.push("get"); args.push([key]); }
        }
        return caseOf(ops, args, run);
      },
      solutions: {
        python: code`
          class MyHashMap:

              def __init__(self):
                  self.size = 769
                  self.buckets = [[] for _ in range(self.size)]

              def put(self, key: int, value: int) -> None:
                  b = self.buckets[key % self.size]
                  for pair in b:
                      if pair[0] == key:
                          pair[1] = value
                          return
                  b.append([key, value])

              def get(self, key: int) -> int:
                  for k, v in self.buckets[key % self.size]:
                      if k == key:
                          return v
                  return -1

              def remove(self, key: int) -> None:
                  b = self.buckets[key % self.size]
                  for i, pair in enumerate(b):
                      if pair[0] == key:
                          b.pop(i)
                          return
        `,
        javascript: code`
          var MyHashMap = function() {
              this.size = 769;
              this.buckets = [];
              for (var i = 0; i < this.size; i++) this.buckets.push([]);
          };

          MyHashMap.prototype.put = function(key, value) {
              var b = this.buckets[key % this.size];
              for (var i = 0; i < b.length; i++) if (b[i][0] === key) { b[i][1] = value; return; }
              b.push([key, value]);
          };

          MyHashMap.prototype.get = function(key) {
              var b = this.buckets[key % this.size];
              for (var i = 0; i < b.length; i++) if (b[i][0] === key) return b[i][1];
              return -1;
          };

          MyHashMap.prototype.remove = function(key) {
              var b = this.buckets[key % this.size];
              for (var i = 0; i < b.length; i++) if (b[i][0] === key) { b.splice(i, 1); return; }
          };
        `,
        typescript: code`
          class MyHashMap {
              size: number;
              buckets: number[][][];

              constructor() {
                  this.size = 769;
                  this.buckets = [];
                  for (var i = 0; i < this.size; i++) this.buckets.push([]);
              }

              put(key: number, value: number): void {
                  var b = this.buckets[key % this.size];
                  for (var i = 0; i < b.length; i++) if (b[i][0] === key) { b[i][1] = value; return; }
                  b.push([key, value]);
              }

              get(key: number): number {
                  var b = this.buckets[key % this.size];
                  for (var i = 0; i < b.length; i++) if (b[i][0] === key) return b[i][1];
                  return -1;
              }

              remove(key: number): void {
                  var b = this.buckets[key % this.size];
                  for (var i = 0; i < b.length; i++) if (b[i][0] === key) { b.splice(i, 1); return; }
              }
          }
        `,
        java: code`
          class MyHashMap {
              private static final int SIZE = 769;
              private List<List<int[]>> buckets = new ArrayList<>();

              public MyHashMap() {
                  for (int i = 0; i < SIZE; i++) buckets.add(new LinkedList<>());
              }

              public void put(int key, int value) {
                  List<int[]> b = buckets.get(key % SIZE);
                  for (int[] pair : b) if (pair[0] == key) { pair[1] = value; return; }
                  b.add(new int[]{key, value});
              }

              public int get(int key) {
                  for (int[] pair : buckets.get(key % SIZE)) if (pair[0] == key) return pair[1];
                  return -1;
              }

              public void remove(int key) {
                  Iterator<int[]> it = buckets.get(key % SIZE).iterator();
                  while (it.hasNext()) if (it.next()[0] == key) { it.remove(); return; }
              }
          }
        `,
        cpp: code`
          class MyHashMap {
              static const int SIZE = 769;
              vector<list<pair<int, int>>> buckets;
          public:
              MyHashMap() : buckets(SIZE) {}

              void put(int key, int value) {
                  for (auto& p : buckets[key % SIZE]) if (p.first == key) { p.second = value; return; }
                  buckets[key % SIZE].push_back({key, value});
              }

              int get(int key) {
                  for (auto& p : buckets[key % SIZE]) if (p.first == key) return p.second;
                  return -1;
              }

              void remove(int key) {
                  auto& b = buckets[key % SIZE];
                  for (auto it = b.begin(); it != b.end(); ++it) if (it->first == key) { b.erase(it); return; }
              }
          };
        `,
        c: code`
          #define HM_SIZE 769

          typedef struct HmNode {
              int key, value;
              struct HmNode* next;
          } HmNode;

          typedef struct {
              HmNode* buckets[HM_SIZE];
          } MyHashMap;

          MyHashMap* myHashMapCreate() {
              return (MyHashMap*)calloc(1, sizeof(MyHashMap));
          }

          void myHashMapPut(MyHashMap* obj, int key, int value) {
              for (HmNode* n = obj->buckets[key % HM_SIZE]; n != NULL; n = n->next)
                  if (n->key == key) { n->value = value; return; }
              HmNode* n = (HmNode*)malloc(sizeof(HmNode));
              n->key = key;
              n->value = value;
              n->next = obj->buckets[key % HM_SIZE];
              obj->buckets[key % HM_SIZE] = n;
          }

          int myHashMapGet(MyHashMap* obj, int key) {
              for (HmNode* n = obj->buckets[key % HM_SIZE]; n != NULL; n = n->next)
                  if (n->key == key) return n->value;
              return -1;
          }

          void myHashMapRemove(MyHashMap* obj, int key) {
              HmNode** link = &obj->buckets[key % HM_SIZE];
              while (*link != NULL) {
                  if ((*link)->key == key) {
                      HmNode* dead = *link;
                      *link = dead->next;
                      free(dead);
                      return;
                  }
                  link = &(*link)->next;
              }
          }

          void myHashMapFree(MyHashMap* obj) {
              for (int i = 0; i < HM_SIZE; i++) {
                  HmNode* n = obj->buckets[i];
                  while (n != NULL) { HmNode* next = n->next; free(n); n = next; }
              }
              free(obj);
          }
        `,
        csharp: code`
          public class MyHashMap {
              private const int Size = 769;
              private List<int[]>[] buckets = new List<int[]>[Size];

              public MyHashMap() {
                  for (int i = 0; i < Size; i++) buckets[i] = new List<int[]>();
              }

              public void Put(int key, int value) {
                  foreach (int[] pair in buckets[key % Size]) if (pair[0] == key) { pair[1] = value; return; }
                  buckets[key % Size].Add(new int[] { key, value });
              }

              public int Get(int key) {
                  foreach (int[] pair in buckets[key % Size]) if (pair[0] == key) return pair[1];
                  return -1;
              }

              public void Remove(int key) {
                  buckets[key % Size].RemoveAll(p => p[0] == key);
              }
          }
        `,
        go: code`
          const hmSize = 769

          type MyHashMap struct {
          	buckets [][][2]int
          }

          func Constructor() MyHashMap {
          	return MyHashMap{buckets: make([][][2]int, hmSize)}
          }

          func (this *MyHashMap) Put(key int, value int) {
          	h := key % hmSize
          	for i := range this.buckets[h] {
          		if this.buckets[h][i][0] == key {
          			this.buckets[h][i][1] = value
          			return
          		}
          	}
          	this.buckets[h] = append(this.buckets[h], [2]int{key, value})
          }

          func (this *MyHashMap) Get(key int) int {
          	for _, p := range this.buckets[key%hmSize] {
          		if p[0] == key {
          			return p[1]
          		}
          	}
          	return -1
          }

          func (this *MyHashMap) Remove(key int) {
          	h := key % hmSize
          	b := this.buckets[h]
          	for i, p := range b {
          		if p[0] == key {
          			this.buckets[h] = append(b[:i], b[i+1:]...)
          			return
          		}
          	}
          }
        `,
        kotlin: code`
          class MyHashMap() {
              private val size = 769
              private val buckets = Array(size) { mutableListOf<IntArray>() }

              fun put(key: Int, value: Int) {
                  val b = buckets[key % size]
                  for (pair in b) if (pair[0] == key) { pair[1] = value; return }
                  b.add(intArrayOf(key, value))
              }

              fun get(key: Int): Int {
                  for (pair in buckets[key % size]) if (pair[0] == key) return pair[1]
                  return -1
              }

              fun remove(key: Int) {
                  buckets[key % size].removeAll { it[0] == key }
              }
          }
        `,
        swift: code`
          class MyHashMap {
              let size = 769
              var buckets: [[(Int, Int)]]

              init() {
                  buckets = [[(Int, Int)]](repeating: [], count: size)
              }

              func put(_ key: Int, _ value: Int) {
                  let h = key % size
                  if let i = buckets[h].firstIndex(where: { $0.0 == key }) { buckets[h][i].1 = value }
                  else { buckets[h].append((key, value)) }
              }

              func get(_ key: Int) -> Int {
                  for (k, v) in buckets[key % size] where k == key { return v }
                  return -1
              }

              func remove(_ key: Int) {
                  let h = key % size
                  if let i = buckets[h].firstIndex(where: { $0.0 == key }) { buckets[h].remove(at: i) }
              }
          }
        `,
        rust: code`
          const HM_SIZE: usize = 769;

          struct MyHashMap {
              buckets: Vec<Vec<(i32, i32)>>,
          }

          impl MyHashMap {
              fn new() -> Self { MyHashMap { buckets: vec![Vec::new(); HM_SIZE] } }

              fn put(&mut self, key: i32, value: i32) {
                  let b = &mut self.buckets[key as usize % HM_SIZE];
                  for p in b.iter_mut() {
                      if p.0 == key { p.1 = value; return; }
                  }
                  b.push((key, value));
              }

              fn get(&mut self, key: i32) -> i32 {
                  for p in self.buckets[key as usize % HM_SIZE].iter() {
                      if p.0 == key { return p.1; }
                  }
                  -1
              }

              fn remove(&mut self, key: i32) {
                  let b = &mut self.buckets[key as usize % HM_SIZE];
                  if let Some(i) = b.iter().position(|p| p.0 == key) { b.swap_remove(i); }
              }
          }
        `,
        php: code`
          class MyHashMap {
              private $size = 769;
              private $buckets = [];

              function __construct() {
                  $this->buckets = array_fill(0, $this->size, []);
              }

              function put($key, $value) {
                  $h = $key % $this->size;
                  foreach ($this->buckets[$h] as $i => $pair) {
                      if ($pair[0] === $key) { $this->buckets[$h][$i][1] = $value; return; }
                  }
                  $this->buckets[$h][] = [$key, $value];
              }

              function get($key) {
                  foreach ($this->buckets[$key % $this->size] as $pair) if ($pair[0] === $key) return $pair[1];
                  return -1;
              }

              function remove($key) {
                  $h = $key % $this->size;
                  foreach ($this->buckets[$h] as $i => $pair) {
                      if ($pair[0] === $key) { array_splice($this->buckets[$h], $i, 1); return; }
                  }
              }
          }
        `,
        ruby: code`
          class MyHashMap
            SIZE = 769

            def initialize
              @buckets = Array.new(SIZE) { [] }
            end

            def put(key, value)
              b = @buckets[key % SIZE]
              pair = b.find { |p| p[0] == key }
              if pair then pair[1] = value else b << [key, value] end
            end

            def get(key)
              pair = @buckets[key % SIZE].find { |p| p[0] == key }
              pair ? pair[1] : -1
            end

            def remove(key)
              @buckets[key % SIZE].reject! { |p| p[0] == key }
            end
          end
        `,
      },
    };
  })(),

  // ── Number of Recent Calls (LC 933) ───────────────────────────────
  (() => {
    const run = (ops: string[], args: number[][]) => {
      const seen: number[] = [];
      return ops.map((op, i) => {
        if (op !== "ping") return null;
        const t = args[i][0];
        seen.push(t);
        return seen.filter((s) => s >= t - 3000).length;
      });
    };
    const ex = [
      { ops: ["RecentCounter", "ping", "ping", "ping", "ping"], args: [[], [1], [100], [3001], [3002]] },
      { ops: ["RecentCounter", "ping", "ping", "ping", "ping", "ping"], args: [[], [500], [3500], [3501], [9000], [9001]] },
    ];
    return {
      slug: "number-of-recent-calls",
      title: "Number of Recent Calls",
      difficulty: "EASY" as const,
      tags: ["Queue", "Design", "Amazon", "Google"],
      signature: {
        funcName: "RecentCounter", params: [], returns: "void" as const,
        methods: [{ name: "ping", params: [{ name: "t", type: "int" as const }], returns: "int" as const }],
      },
      description: describe(
        "A service receives requests and wants to know how busy it has been lately. Write the class `RecentCounter`:\n\n- `RecentCounter()` starts with no requests.\n- `int ping(int t)` records a new request at time `t` (in milliseconds) and returns how many requests — this one included — happened in the inclusive window `[t - 3000, t]`.\n\nEvery call to `ping` uses a strictly larger `t` than the call before it.\n\n" + CALLS,
        [
          exOf(ex[0].ops, ex[0].args, run, "At t = 3001 the window is [1, 3001], which still holds the request at 1. At t = 3002 the window is [2, 3002], so the request at 1 has dropped out: 100, 3001 and 3002 remain."),
          exOf(ex[1].ops, ex[1].args, run, "A request exactly 3000 ms old (500 seen from 3500) is still counted. By t = 9000 every earlier request is too old."),
        ],
        ["1 <= t <= 10^9", "Each call to ping uses a strictly larger t than the previous call", "At most 10^4 calls are made to ping"]),
      hints: [
        "Because the times only grow, a request that is too old for one call is too old for every later call.",
        "Keep the requests in arrival order and throw away old ones from the front.",
        "Use a queue: push `t`, then pop from the front while the front is `< t - 3000`; the queue's size is the answer.",
      ],
      editorial: explain({
        idea: "Keep the requests still inside the window in a queue. Times arrive in increasing order, so the oldest request is always at the front, and once it falls out of the window it never comes back.",
        steps: [
          "`ping(t)`: push `t` onto the back of the queue.",
          "While the front of the queue is smaller than `t - 3000`, pop it.",
          "Return the queue's size.",
        ],
        why: "The queue is sorted because `t` strictly increases. Every element popped is older than `t - 3000` and so outside every future window too (later windows start even later), while every element kept is at least `t - 3000` and at most `t` — exactly the requests in the window.",
        time: "amortized O(1) per ping — each request is pushed once and popped at most once",
        space: "O(w), where w is the most requests inside one 3000 ms window",
        pitfalls: [
          "The window is inclusive at both ends: a request at exactly `t - 3000` counts.",
          "Shifting from the front of a plain array is O(n) in some languages; a head index (or a real deque) keeps it O(1).",
        ],
      }),
      examples: ex.map((e) => caseOf(e.ops, e.args, run)),
      gen: (rng: Rng) => {
        const step = pick(rng, [5, 300, 1500, 3000, 6000]);
        const ops = ["RecentCounter"], args: number[][] = [[]];
        let t = rng() < 0.15 ? 1000000000 - 40 * step - 1 : ri(rng, 0, 5000);
        for (let m = ri(rng, 1, pick(rng, [1, 6, 20, 40])); m > 0; m--) {
          t += rng() < 0.15 ? 3000 : ri(rng, 1, step);
          ops.push("ping"); args.push([t]);
        }
        return caseOf(ops, args, run);
      },
      solutions: {
        python: code`
          from collections import deque

          class RecentCounter:

              def __init__(self):
                  self.q = deque()

              def ping(self, t: int) -> int:
                  self.q.append(t)
                  while self.q[0] < t - 3000:
                      self.q.popleft()
                  return len(self.q)
        `,
        javascript: code`
          var RecentCounter = function() {
              this.q = [];
              this.head = 0; // index of the oldest request still in the window
          };

          RecentCounter.prototype.ping = function(t) {
              this.q.push(t);
              while (this.q[this.head] < t - 3000) this.head++;
              return this.q.length - this.head;
          };
        `,
        typescript: code`
          class RecentCounter {
              q: number[];
              head: number;

              constructor() {
                  this.q = [];
                  this.head = 0; // index of the oldest request still in the window
              }

              ping(t: number): number {
                  this.q.push(t);
                  while (this.q[this.head] < t - 3000) this.head++;
                  return this.q.length - this.head;
              }
          }
        `,
        java: code`
          class RecentCounter {
              private Deque<Integer> q = new ArrayDeque<>();

              public RecentCounter() {
              }

              public int ping(int t) {
                  q.offer(t);
                  while (q.peek() < t - 3000) q.poll();
                  return q.size();
              }
          }
        `,
        cpp: code`
          class RecentCounter {
              queue<int> q;
          public:
              RecentCounter() {}

              int ping(int t) {
                  q.push(t);
                  while (q.front() < t - 3000) q.pop();
                  return (int)q.size();
              }
          };
        `,
        c: code`
          typedef struct {
              int* q;
              int head, tail, cap;
          } RecentCounter;

          RecentCounter* recentCounterCreate() {
              RecentCounter* o = (RecentCounter*)malloc(sizeof(RecentCounter));
              o->cap = 64;
              o->q = (int*)malloc(o->cap * sizeof(int));
              o->head = 0;
              o->tail = 0;
              return o;
          }

          int recentCounterPing(RecentCounter* obj, int t) {
              if (obj->tail == obj->cap) { obj->cap *= 2; obj->q = (int*)realloc(obj->q, obj->cap * sizeof(int)); }
              obj->q[obj->tail++] = t;
              while (obj->q[obj->head] < t - 3000) obj->head++;
              return obj->tail - obj->head;
          }

          void recentCounterFree(RecentCounter* obj) {
              free(obj->q);
              free(obj);
          }
        `,
        csharp: code`
          public class RecentCounter {
              private Queue<int> q = new Queue<int>();

              public RecentCounter() {
              }

              public int Ping(int t) {
                  q.Enqueue(t);
                  while (q.Peek() < t - 3000) q.Dequeue();
                  return q.Count;
              }
          }
        `,
        go: code`
          type RecentCounter struct {
          	q []int
          }

          func Constructor() RecentCounter {
          	return RecentCounter{}
          }

          func (this *RecentCounter) Ping(t int) int {
          	this.q = append(this.q, t)
          	for this.q[0] < t-3000 {
          		this.q = this.q[1:]
          	}
          	return len(this.q)
          }
        `,
        kotlin: code`
          class RecentCounter() {
              private val q = java.util.ArrayDeque<Int>()

              fun ping(t: Int): Int {
                  q.offer(t)
                  while (q.peek() < t - 3000) q.poll()
                  return q.size
              }
          }
        `,
        swift: code`
          class RecentCounter {
              var q: [Int] = []
              var head = 0 // index of the oldest request still in the window

              init() {}

              func ping(_ t: Int) -> Int {
                  q.append(t)
                  while q[head] < t - 3000 { head += 1 }
                  return q.count - head
              }
          }
        `,
        rust: code`
          use std::collections::VecDeque;

          struct RecentCounter {
              q: VecDeque<i32>,
          }

          impl RecentCounter {
              fn new() -> Self { RecentCounter { q: VecDeque::new() } }

              fn ping(&mut self, t: i32) -> i32 {
                  self.q.push_back(t);
                  while *self.q.front().unwrap() < t - 3000 { self.q.pop_front(); }
                  self.q.len() as i32
              }
          }
        `,
        php: code`
          class RecentCounter {
              private $q;

              function __construct() {
                  $this->q = new \SplQueue();
              }

              function ping($t) {
                  $this->q->enqueue($t);
                  while ($this->q->bottom() < $t - 3000) $this->q->dequeue();
                  return count($this->q);
              }
          }
        `,
        ruby: code`
          class RecentCounter
            def initialize
              @q = []
              @head = 0 # index of the oldest request still in the window
            end

            def ping(t)
              @q << t
              @head += 1 while @q[@head] < t - 3000
              @q.length - @head
            end
          end
        `,
      },
    };
  })(),

  // ── Design Parking System (LC 1603) ───────────────────────────────
  (() => {
    const run = (ops: string[], args: number[][]) => {
      const free = [0, 0, 0, 0];
      return ops.map((op, i) => {
        if (op === "ParkingSystem") { free[1] = args[i][0]; free[2] = args[i][1]; free[3] = args[i][2]; return null; }
        const c = args[i][0];
        if (free[c] === 0) return false;
        free[c]--;
        return true;
      });
    };
    const ex = [
      { ops: ["ParkingSystem", "addCar", "addCar", "addCar", "addCar"], args: [[1, 1, 0], [1], [2], [3], [1]] },
      { ops: ["ParkingSystem", "addCar", "addCar", "addCar", "addCar", "addCar"], args: [[0, 2, 1], [2], [1], [2], [2], [3]] },
    ];
    return {
      slug: "design-parking-system",
      title: "Design Parking System",
      difficulty: "EASY" as const,
      tags: ["Design", "Simulation", "Counting", "Amazon", "Microsoft"],
      signature: {
        funcName: "ParkingSystem", params: [{ name: "big", type: "int" as const }, { name: "medium", type: "int" as const }, { name: "small", type: "int" as const }], returns: "void" as const,
        methods: [{ name: "addCar", params: [{ name: "carType", type: "int" as const }], returns: "bool" as const }],
      },
      description: describe(
        "A parking lot has three sizes of space — big, medium and small — with a fixed number of each. A car may only park in a space of its own size, and cars never leave. Write the class `ParkingSystem`:\n\n- `ParkingSystem(int big, int medium, int small)` creates a lot with that many spaces of each size.\n- `boolean addCar(int carType)` tries to park a car of type `carType` (`1` = big, `2` = medium, `3` = small). If a space of that size is free the car takes it and the call returns `true`; otherwise it returns `false`.\n\n" + CALLS,
        [
          exOf(ex[0].ops, ex[0].args, run, "One big and one medium space: the first big car and the medium car park. There are no small spaces, and the second big car finds the only big space taken."),
          exOf(ex[1].ops, ex[1].args, run, "Two medium spaces fill up after two medium cars, so the third is turned away. There are no big spaces at all; the small car takes the one small space."),
        ],
        ["0 <= big, medium, small <= 1000", "carType is 1, 2 or 3", "At most 1000 calls are made to addCar"]),
      hints: [
        "A car never moves into a space of another size, so the three sizes are three independent counters.",
        "Store the free spaces per type in an array indexed by `carType`.",
        "`addCar` checks the counter for its type: zero means `false`; otherwise decrement it and return `true`.",
      ],
      editorial: explain({
        idea: "Keep one counter of free spaces per car type. Parking a car is a check and a decrement of its own counter.",
        steps: [
          "Store `free = [_, big, medium, small]` so `free[carType]` is the number of free spaces for that type.",
          "`addCar(carType)`: if `free[carType] == 0` return `false`; otherwise decrement it and return `true`.",
        ],
        why: "Spaces of different sizes never interact and cars never leave, so the only state that matters is how many spaces of each size are still free.",
        time: "O(1) per call",
        space: "O(1)",
        pitfalls: [
          "`carType` is 1-based; index an array of size 4 or subtract one.",
          "A lot may have zero spaces of a size from the start.",
        ],
      }),
      examples: ex.map((e) => caseOf(e.ops, e.args, run)),
      gen: (rng: Rng) => {
        const cap = () => (rng() < 0.15 ? pick(rng, [0, 1000]) : ri(rng, 0, pick(rng, [2, 6, 15])));
        const ops = ["ParkingSystem"], args: number[][] = [[cap(), cap(), cap()]];
        for (let m = ri(rng, 1, pick(rng, [3, 12, 25, 40])); m > 0; m--) { ops.push("addCar"); args.push([ri(rng, 1, 3)]); }
        return caseOf(ops, args, run);
      },
      solutions: {
        python: code`
          class ParkingSystem:

              def __init__(self, big: int, medium: int, small: int):
                  self.free = [0, big, medium, small]

              def addCar(self, carType: int) -> bool:
                  if self.free[carType] == 0:
                      return False
                  self.free[carType] -= 1
                  return True
        `,
        javascript: code`
          var ParkingSystem = function(big, medium, small) {
              this.free = [0, big, medium, small];
          };

          ParkingSystem.prototype.addCar = function(carType) {
              if (this.free[carType] === 0) return false;
              this.free[carType]--;
              return true;
          };
        `,
        typescript: code`
          class ParkingSystem {
              free: number[];

              constructor(big: number, medium: number, small: number) {
                  this.free = [0, big, medium, small];
              }

              addCar(carType: number): boolean {
                  if (this.free[carType] === 0) return false;
                  this.free[carType]--;
                  return true;
              }
          }
        `,
        java: code`
          class ParkingSystem {
              private int[] free;

              public ParkingSystem(int big, int medium, int small) {
                  free = new int[]{0, big, medium, small};
              }

              public boolean addCar(int carType) {
                  if (free[carType] == 0) return false;
                  free[carType]--;
                  return true;
              }
          }
        `,
        cpp: code`
          class ParkingSystem {
              int freeSpaces[4];
          public:
              ParkingSystem(int big, int medium, int small) {
                  freeSpaces[0] = 0;
                  freeSpaces[1] = big;
                  freeSpaces[2] = medium;
                  freeSpaces[3] = small;
              }

              bool addCar(int carType) {
                  if (freeSpaces[carType] == 0) return false;
                  freeSpaces[carType]--;
                  return true;
              }
          };
        `,
        c: code`
          typedef struct {
              int freeSpaces[4];
          } ParkingSystem;

          ParkingSystem* parkingSystemCreate(int big, int medium, int small) {
              ParkingSystem* o = (ParkingSystem*)malloc(sizeof(ParkingSystem));
              o->freeSpaces[0] = 0;
              o->freeSpaces[1] = big;
              o->freeSpaces[2] = medium;
              o->freeSpaces[3] = small;
              return o;
          }

          bool parkingSystemAddCar(ParkingSystem* obj, int carType) {
              if (obj->freeSpaces[carType] == 0) return false;
              obj->freeSpaces[carType]--;
              return true;
          }

          void parkingSystemFree(ParkingSystem* obj) {
              free(obj);
          }
        `,
        csharp: code`
          public class ParkingSystem {
              private int[] free;

              public ParkingSystem(int big, int medium, int small) {
                  free = new int[] { 0, big, medium, small };
              }

              public bool AddCar(int carType) {
                  if (free[carType] == 0) return false;
                  free[carType]--;
                  return true;
              }
          }
        `,
        go: code`
          type ParkingSystem struct {
          	free [4]int
          }

          func Constructor(big int, medium int, small int) ParkingSystem {
          	return ParkingSystem{free: [4]int{0, big, medium, small}}
          }

          func (this *ParkingSystem) AddCar(carType int) bool {
          	if this.free[carType] == 0 {
          		return false
          	}
          	this.free[carType]--
          	return true
          }
        `,
        kotlin: code`
          class ParkingSystem(big: Int, medium: Int, small: Int) {
              private val free = intArrayOf(0, big, medium, small)

              fun addCar(carType: Int): Boolean {
                  if (free[carType] == 0) return false
                  free[carType]--
                  return true
              }
          }
        `,
        swift: code`
          class ParkingSystem {
              var free: [Int]

              init(_ big: Int, _ medium: Int, _ small: Int) {
                  free = [0, big, medium, small]
              }

              func addCar(_ carType: Int) -> Bool {
                  if free[carType] == 0 { return false }
                  free[carType] -= 1
                  return true
              }
          }
        `,
        rust: code`
          struct ParkingSystem {
              free: [i32; 4],
          }

          impl ParkingSystem {
              fn new(big: i32, medium: i32, small: i32) -> Self {
                  ParkingSystem { free: [0, big, medium, small] }
              }

              fn addCar(&mut self, carType: i32) -> bool {
                  let c = carType as usize;
                  if self.free[c] == 0 { return false; }
                  self.free[c] -= 1;
                  true
              }
          }
        `,
        php: code`
          class ParkingSystem {
              private $free;

              function __construct($big, $medium, $small) {
                  $this->free = [0, $big, $medium, $small];
              }

              function addCar($carType) {
                  if ($this->free[$carType] == 0) return false;
                  $this->free[$carType]--;
                  return true;
              }
          }
        `,
        ruby: code`
          class ParkingSystem
            def initialize(big, medium, small)
              @free = [0, big, medium, small]
            end

            def addCar(carType)
              return false if @free[carType] == 0
              @free[carType] -= 1
              true
            end
          end
        `,
      },
    };
  })(),

  // ── Design an Ordered Stream (LC 1656) ────────────────────────────
  (() => {
    const run = (ops: string[], args: Array<Array<number | string>>) => {
      let slots: Array<string | null> = [], ptr = 1;
      return ops.map((op, i) => {
        if (op === "OrderedStream") { slots = new Array((args[i][0] as number) + 2).fill(null); return null; }
        slots[args[i][0] as number] = args[i][1] as string;
        const out: string[] = [];
        while (slots[ptr] !== null && slots[ptr] !== undefined) out.push(slots[ptr++] as string);
        return out;
      });
    };
    const ex: Array<{ ops: string[]; args: Array<Array<number | string>> }> = [
      { ops: ["OrderedStream", "insert", "insert", "insert", "insert", "insert"], args: [[5], [3, "ccccc"], [1, "aaaaa"], [2, "bbbbb"], [5, "eeeee"], [4, "ddddd"]] },
      { ops: ["OrderedStream", "insert", "insert", "insert"], args: [[3], [2, "lemon"], [3, "mango"], [1, "apple"]] },
    ];
    return {
      slug: "design-an-ordered-stream",
      title: "Design an Ordered Stream",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "Design", "Bloomberg", "Amazon"],
      signature: {
        funcName: "OrderedStream", params: [{ name: "n", type: "int" as const }], returns: "void" as const,
        methods: [{ name: "insert", params: [{ name: "idKey", type: "int" as const }, { name: "value", type: "string" as const }], returns: "string[]" as const }],
      },
      description: describe(
        "`n` pairs `(idKey, value)` arrive in some arbitrary order, where the `idKey`s are exactly `1` to `n`, each once. The stream must hand the values back **in `idKey` order**, as soon as it can.\n\nWrite the class `OrderedStream`:\n\n- `OrderedStream(int n)` prepares a stream for `n` values.\n- `String[] insert(int idKey, String value)` stores the pair and returns the **largest possible chunk** of values that can now be released: starting from the smallest `idKey` not yet released, every consecutive stored value, in `idKey` order. If the next `idKey` to release has not arrived, it returns an empty list.\n\nConcatenating all the returned chunks gives the values sorted by `idKey`.\n\n" + CALLS,
        [
          exOf(ex[0].ops, ex[0].args, run, "Id 3 arrives first but 1 is still missing, so nothing is released. Id 1 releases just itself (2 is missing); id 2 releases 2 and the waiting 3. Id 5 waits for 4, and 4 releases both."),
          exOf(ex[1].ops, ex[1].args, run, "Everything waits for id 1, which then releases all three values at once."),
        ],
        ["1 <= n <= 1000", "1 <= idKey <= n", "value.length == 5", "value consists only of lowercase letters", "Each call to insert has a different idKey", "Exactly n calls are made to insert"]),
      hints: [
        "Store each value at index `idKey` of an array of size `n + 1` as it arrives.",
        "Keep a pointer to the smallest `idKey` that has not been released yet.",
        "After storing, walk the pointer forward while the slot under it is filled, collecting those values — that walk is the chunk.",
      ],
      editorial: explain({
        idea: "An array of slots plus a release pointer. Each insert fills one slot, then the pointer advances over every consecutive filled slot, and the values it passes are exactly what can be released now.",
        steps: [
          "Create `slots` of size `n + 2` (all empty) and `ptr = 1`.",
          "`insert(idKey, value)`: set `slots[idKey] = value`.",
          "While `slots[ptr]` is filled, append it to the chunk and increment `ptr`.",
          "Return the chunk (possibly empty).",
        ],
        why: "Everything below `ptr` has been released and `slots[ptr]` is the first id not yet released. A value can only be released once every smaller id has been, so the chunk is precisely the run of filled slots starting at `ptr` — no more (the run ends at a missing id), no less (every filled slot in the run qualifies).",
        time: "O(n) over all n inserts — the pointer only moves forward",
        space: "O(n)",
        pitfalls: [
          "Releasing only the value just inserted misses values that were waiting behind it.",
          "Size the array so `slots[n + 1]` exists (or check `ptr <= n`) — the pointer walks one past the last id.",
        ],
      }),
      examples: ex.map((e) => caseOf(e.ops, e.args, run)),
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 5, 15, 40]));
        const order = shuffle(rng, Array.from({ length: n }, (_, i) => i + 1));
        if (rng() < 0.15) order.sort((a, b) => a - b);
        else if (rng() < 0.15) order.sort((a, b) => b - a);
        const ops = ["OrderedStream"], args: Array<Array<number | string>> = [[n]];
        for (const id of order) { ops.push("insert"); args.push([id, randLower(rng, 5, 5, pick(rng, ["ab", "abcdefghijklmnopqrstuvwxyz"]))]); }
        return caseOf(ops, args, run);
      },
      solutions: {
        python: code`
          from typing import List

          class OrderedStream:

              def __init__(self, n: int):
                  self.slots = [None] * (n + 2)
                  self.ptr = 1

              def insert(self, idKey: int, value: str) -> List[str]:
                  self.slots[idKey] = value
                  out = []
                  while self.slots[self.ptr] is not None:
                      out.append(self.slots[self.ptr])
                      self.ptr += 1
                  return out
        `,
        javascript: code`
          var OrderedStream = function(n) {
              this.slots = new Array(n + 2).fill(null);
              this.ptr = 1;
          };

          OrderedStream.prototype.insert = function(idKey, value) {
              this.slots[idKey] = value;
              var out = [];
              while (this.slots[this.ptr] !== null) out.push(this.slots[this.ptr++]);
              return out;
          };
        `,
        typescript: code`
          class OrderedStream {
              slots: string[];
              ptr: number;

              constructor(n: number) {
                  this.slots = [];
                  for (var i = 0; i < n + 2; i++) this.slots.push(null);
                  this.ptr = 1;
              }

              insert(idKey: number, value: string): string[] {
                  this.slots[idKey] = value;
                  var out: string[] = [];
                  while (this.slots[this.ptr] !== null) out.push(this.slots[this.ptr++]);
                  return out;
              }
          }
        `,
        java: code`
          class OrderedStream {
              private String[] slots;
              private int ptr = 1;

              public OrderedStream(int n) {
                  slots = new String[n + 2];
              }

              public String[] insert(int idKey, String value) {
                  slots[idKey] = value;
                  int from = ptr;
                  while (slots[ptr] != null) ptr++;
                  return Arrays.copyOfRange(slots, from, ptr);
              }
          }
        `,
        cpp: code`
          class OrderedStream {
              vector<string> slots;
              vector<bool> filled;
              int ptr = 1;
          public:
              OrderedStream(int n) : slots(n + 2), filled(n + 2, false) {}

              vector<string> insert(int idKey, string value) {
                  slots[idKey] = value;
                  filled[idKey] = true;
                  vector<string> out;
                  while (filled[ptr]) out.push_back(slots[ptr++]);
                  return out;
              }
          };
        `,
        c: code`
          typedef struct {
              char** slots;
              int n, ptr;
          } OrderedStream;

          OrderedStream* orderedStreamCreate(int n) {
              OrderedStream* o = (OrderedStream*)malloc(sizeof(OrderedStream));
              o->slots = (char**)calloc(n + 2, sizeof(char*));
              o->n = n;
              o->ptr = 1;
              return o;
          }

          char** orderedStreamInsert(OrderedStream* obj, int idKey, char* value, int* returnSize) {
              size_t len = strlen(value);
              obj->slots[idKey] = (char*)malloc(len + 1);
              memcpy(obj->slots[idKey], value, len + 1);
              int from = obj->ptr;
              while (obj->slots[obj->ptr] != NULL) obj->ptr++;
              *returnSize = obj->ptr - from;
              char** out = (char**)malloc((*returnSize + 1) * sizeof(char*));
              for (int i = 0; i < *returnSize; i++) out[i] = obj->slots[from + i];
              return out;
          }

          void orderedStreamFree(OrderedStream* obj) {
              for (int i = 0; i <= obj->n; i++) free(obj->slots[i]); /* free(NULL) is a no-op */
              free(obj->slots);
              free(obj);
          }
        `,
        csharp: code`
          public class OrderedStream {
              private string[] slots;
              private int ptr = 1;

              public OrderedStream(int n) {
                  slots = new string[n + 2];
              }

              public string[] Insert(int idKey, string value) {
                  slots[idKey] = value;
                  var outList = new List<string>();
                  while (slots[ptr] != null) outList.Add(slots[ptr++]);
                  return outList.ToArray();
              }
          }
        `,
        go: code`
          type OrderedStream struct {
          	slots []string
          	ptr   int
          }

          func Constructor(n int) OrderedStream {
          	return OrderedStream{slots: make([]string, n+2), ptr: 1}
          }

          func (this *OrderedStream) Insert(idKey int, value string) []string {
          	this.slots[idKey] = value
          	from := this.ptr
          	for this.slots[this.ptr] != "" { // every value has five letters, so "" means empty
          		this.ptr++
          	}
          	out := make([]string, this.ptr-from)
          	copy(out, this.slots[from:this.ptr])
          	return out
          }
        `,
        kotlin: code`
          class OrderedStream(n: Int) {
              private val slots = arrayOfNulls<String>(n + 2)
              private var ptr = 1

              fun insert(idKey: Int, value: String): Array<String> {
                  slots[idKey] = value
                  val out = mutableListOf<String>()
                  while (slots[ptr] != null) out.add(slots[ptr++]!!)
                  return out.toTypedArray()
              }
          }
        `,
        swift: code`
          class OrderedStream {
              var slots: [String?]
              var ptr = 1

              init(_ n: Int) {
                  slots = [String?](repeating: nil, count: n + 2)
              }

              func insert(_ idKey: Int, _ value: String) -> [String] {
                  slots[idKey] = value
                  var out: [String] = []
                  while let s = slots[ptr] {
                      out.append(s)
                      ptr += 1
                  }
                  return out
              }
          }
        `,
        rust: code`
          struct OrderedStream {
              slots: Vec<Option<String>>,
              ptr: usize,
          }

          impl OrderedStream {
              fn new(n: i32) -> Self {
                  OrderedStream { slots: vec![None; n as usize + 2], ptr: 1 }
              }

              fn insert(&mut self, idKey: i32, value: String) -> Vec<String> {
                  self.slots[idKey as usize] = Some(value);
                  let mut out = Vec::new();
                  while self.slots[self.ptr].is_some() {
                      out.push(self.slots[self.ptr].clone().unwrap());
                      self.ptr += 1;
                  }
                  out
              }
          }
        `,
        php: code`
          class OrderedStream {
              private $slots;
              private $ptr = 1;

              function __construct($n) {
                  $this->slots = array_fill(0, $n + 2, null);
              }

              function insert($idKey, $value) {
                  $this->slots[$idKey] = $value;
                  $out = [];
                  while ($this->slots[$this->ptr] !== null) $out[] = $this->slots[$this->ptr++];
                  return $out;
              }
          }
        `,
        ruby: code`
          class OrderedStream
            def initialize(n)
              @slots = Array.new(n + 2)
              @ptr = 1
            end

            def insert(idKey, value)
              @slots[idKey] = value
              out = []
              while @slots[@ptr]
                out << @slots[@ptr]
                @ptr += 1
              end
              out
            end
          end
        `,
      },
    };
  })(),

  // ── Design Neighbor Sum Service (LC 3242) ─────────────────────────
  (() => {
    const run = (ops: string[], args: Array<Array<number | number[][]>>) => {
      let g: number[][] = [];
      const near = (v: number, dirs: number[][]) => {
        for (let r = 0; r < g.length; r++) for (let c = 0; c < g.length; c++) if (g[r][c] === v) {
          let s = 0;
          for (const [dr, dc] of dirs) { const y = r + dr, x = c + dc; if (y >= 0 && y < g.length && x >= 0 && x < g.length) s += g[y][x]; }
          return s;
        }
        return 0;
      };
      return ops.map((op, i) => {
        if (op === "NeighborSum") { g = args[i][0] as number[][]; return null; }
        const v = args[i][0] as number;
        return op === "adjacentSum" ? near(v, [[-1, 0], [1, 0], [0, -1], [0, 1]]) : near(v, [[-1, -1], [-1, 1], [1, -1], [1, 1]]);
      });
    };
    const ex: Array<{ ops: string[]; args: Array<Array<number | number[][]>> }> = [
      { ops: ["NeighborSum", "adjacentSum", "adjacentSum", "diagonalSum", "diagonalSum"], args: [[[[0, 1, 2], [3, 4, 5], [6, 7, 8]]], [1], [4], [4], [8]] },
      { ops: ["NeighborSum", "adjacentSum", "diagonalSum"], args: [[[[1, 2, 0, 3], [4, 7, 15, 6], [8, 9, 10, 11], [12, 13, 14, 5]]], [15], [9]] },
    ];
    return {
      slug: "design-neighbor-sum-service",
      title: "Design Neighbor Sum Service",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "Matrix", "Simulation", "Design", "Amazon"],
      signature: {
        funcName: "NeighborSum", params: [{ name: "grid", type: "int[][]" as const }], returns: "void" as const,
        methods: [
          { name: "adjacentSum", params: [{ name: "value", type: "int" as const }], returns: "int" as const },
          { name: "diagonalSum", params: [{ name: "value", type: "int" as const }], returns: "int" as const },
        ],
      },
      description: describe(
        "You are given an `n x n` grid whose cells hold the numbers `0` to `n² - 1`, each exactly once. Write the class `NeighborSum`:\n\n- `NeighborSum(int[][] grid)` stores the grid.\n- `int adjacentSum(int value)` returns the sum of the cells directly **above, below, left and right** of the cell holding `value`.\n- `int diagonalSum(int value)` returns the sum of the cells **diagonally** next to the cell holding `value` (top-left, top-right, bottom-left, bottom-right).\n\nNeighbours that would fall outside the grid are simply left out.\n\n" + CALLS,
        [
          exOf(ex[0].ops, ex[0].args, run, "1 sits in the top row: its neighbours are 0, 2 and 4. 4 is the centre, with 1, 3, 5, 7 beside it and 0, 2, 6, 8 on its diagonals. 8 is a corner with a single diagonal neighbour, 4."),
          exOf(ex[1].ops, ex[1].args, run, "15 is at row 1, column 2: above it 0, below it 10, left 7, right 6. 9 is at row 2, column 1: its diagonals are 4, 15, 12 and 14."),
        ],
        ["3 <= n == grid.length == grid[0].length <= 10", "0 <= grid[i][j] <= n² - 1", "All grid[i][j] are distinct", "value in adjacentSum and diagonalSum is a number in the grid", "At most 2 * n² calls are made to adjacentSum and diagonalSum"]),
      hints: [
        "Every query names a value, not a position — the first job is to find where that value is.",
        "Because the values are exactly `0` to `n² - 1`, you can record each value's row and column once, in the constructor.",
        "Then each query is four in-bounds checks around that position, with one list of offsets for the sides and one for the diagonals.",
      ],
      editorial: explain({
        idea: "Precompute where each value lives. The values are a permutation of `0 … n² - 1`, so two arrays `row[v]` and `col[v]` turn every query into a constant number of neighbour checks.",
        steps: [
          "In the constructor, for every cell `(r, c)` set `row[grid[r][c]] = r` and `col[grid[r][c]] = c`.",
          "`adjacentSum(value)`: from `(row[value], col[value])`, add the cells at offsets `(-1,0), (1,0), (0,-1), (0,1)` that are inside the grid.",
          "`diagonalSum(value)`: the same with offsets `(-1,-1), (-1,1), (1,-1), (1,1)`.",
        ],
        why: "The lookup arrays are exact because each value appears in exactly one cell, and checking an offset against `0 <= y, x < n` keeps precisely the neighbours that exist.",
        time: "O(n²) to build, O(1) per query",
        space: "O(n²)",
        pitfalls: [
          "Scanning the whole grid for the value on every query works but costs O(n²) per call.",
          "Edge and corner cells have fewer neighbours — skip offsets that leave the grid rather than reading outside it.",
        ],
      }),
      examples: ex.map((e) => caseOf(e.ops, e.args, run)),
      gen: (rng: Rng) => {
        const n = ri(rng, 3, pick(rng, [3, 4, 6, 10]));
        const vals = shuffle(rng, Array.from({ length: n * n }, (_, i) => i));
        const grid = Array.from({ length: n }, (_, r) => vals.slice(r * n, r * n + n));
        const ops = ["NeighborSum"], args: Array<Array<number | number[][]>> = [[grid]];
        for (let m = ri(rng, 1, Math.min(40, 2 * n * n, pick(rng, [4, 15, 40]))); m > 0; m--) {
          ops.push(rng() < 0.5 ? "adjacentSum" : "diagonalSum");
          args.push([ri(rng, 0, n * n - 1)]);
        }
        return caseOf(ops, args, run);
      },
      solutions: {
        python: code`
          from typing import List

          class NeighborSum:
              SIDES = ((-1, 0), (1, 0), (0, -1), (0, 1))
              DIAGONALS = ((-1, -1), (-1, 1), (1, -1), (1, 1))

              def __init__(self, grid: List[List[int]]):
                  self.g = grid
                  self.n = len(grid)
                  self.pos = [None] * (self.n * self.n)
                  for r in range(self.n):
                      for c in range(self.n):
                          self.pos[grid[r][c]] = (r, c)

              def _around(self, value: int, offsets) -> int:
                  r, c = self.pos[value]
                  s = 0
                  for dr, dc in offsets:
                      y, x = r + dr, c + dc
                      if 0 <= y < self.n and 0 <= x < self.n:
                          s += self.g[y][x]
                  return s

              def adjacentSum(self, value: int) -> int:
                  return self._around(value, self.SIDES)

              def diagonalSum(self, value: int) -> int:
                  return self._around(value, self.DIAGONALS)
        `,
        javascript: code`
          var SIDES = [[-1, 0], [1, 0], [0, -1], [0, 1]];
          var DIAGONALS = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

          var NeighborSum = function(grid) {
              this.g = grid;
              this.n = grid.length;
              this.row = [];
              this.col = [];
              for (var r = 0; r < this.n; r++)
                  for (var c = 0; c < this.n; c++) { this.row[grid[r][c]] = r; this.col[grid[r][c]] = c; }
          };

          NeighborSum.prototype.around = function(value, offsets) {
              var s = 0;
              for (var k = 0; k < 4; k++) {
                  var y = this.row[value] + offsets[k][0], x = this.col[value] + offsets[k][1];
                  if (y >= 0 && y < this.n && x >= 0 && x < this.n) s += this.g[y][x];
              }
              return s;
          };

          NeighborSum.prototype.adjacentSum = function(value) {
              return this.around(value, SIDES);
          };

          NeighborSum.prototype.diagonalSum = function(value) {
              return this.around(value, DIAGONALS);
          };
        `,
        typescript: code`
          class NeighborSum {
              g: number[][];
              n: number;
              row: number[];
              col: number[];

              constructor(grid: number[][]) {
                  this.g = grid;
                  this.n = grid.length;
                  this.row = [];
                  this.col = [];
                  for (var r = 0; r < this.n; r++)
                      for (var c = 0; c < this.n; c++) { this.row[grid[r][c]] = r; this.col[grid[r][c]] = c; }
              }

              around(value: number, offsets: number[][]): number {
                  var s = 0;
                  for (var k = 0; k < 4; k++) {
                      var y = this.row[value] + offsets[k][0], x = this.col[value] + offsets[k][1];
                      if (y >= 0 && y < this.n && x >= 0 && x < this.n) s += this.g[y][x];
                  }
                  return s;
              }

              adjacentSum(value: number): number {
                  return this.around(value, [[-1, 0], [1, 0], [0, -1], [0, 1]]);
              }

              diagonalSum(value: number): number {
                  return this.around(value, [[-1, -1], [-1, 1], [1, -1], [1, 1]]);
              }
          }
        `,
        java: code`
          class NeighborSum {
              private static final int[][] SIDES = {{-1, 0}, {1, 0}, {0, -1}, {0, 1}};
              private static final int[][] DIAGONALS = {{-1, -1}, {-1, 1}, {1, -1}, {1, 1}};
              private int[][] g;
              private int n;
              private int[] row, col;

              public NeighborSum(int[][] grid) {
                  g = grid;
                  n = grid.length;
                  row = new int[n * n];
                  col = new int[n * n];
                  for (int r = 0; r < n; r++)
                      for (int c = 0; c < n; c++) { row[grid[r][c]] = r; col[grid[r][c]] = c; }
              }

              private int around(int value, int[][] offsets) {
                  int s = 0;
                  for (int[] d : offsets) {
                      int y = row[value] + d[0], x = col[value] + d[1];
                      if (y >= 0 && y < n && x >= 0 && x < n) s += g[y][x];
                  }
                  return s;
              }

              public int adjacentSum(int value) {
                  return around(value, SIDES);
              }

              public int diagonalSum(int value) {
                  return around(value, DIAGONALS);
              }
          }
        `,
        cpp: code`
          class NeighborSum {
              vector<vector<int>> g;
              int n;
              vector<int> row, col;

              int around(int value, const int (*offsets)[2]) {
                  int s = 0;
                  for (int k = 0; k < 4; k++) {
                      int y = row[value] + offsets[k][0], x = col[value] + offsets[k][1];
                      if (y >= 0 && y < n && x >= 0 && x < n) s += g[y][x];
                  }
                  return s;
              }
          public:
              NeighborSum(vector<vector<int>>& grid) : g(grid), n((int)grid.size()), row(n * n), col(n * n) {
                  for (int r = 0; r < n; r++)
                      for (int c = 0; c < n; c++) { row[grid[r][c]] = r; col[grid[r][c]] = c; }
              }

              int adjacentSum(int value) {
                  static const int sides[4][2] = {{-1, 0}, {1, 0}, {0, -1}, {0, 1}};
                  return around(value, sides);
              }

              int diagonalSum(int value) {
                  static const int diagonals[4][2] = {{-1, -1}, {-1, 1}, {1, -1}, {1, 1}};
                  return around(value, diagonals);
              }
          };
        `,
        c: code`
          typedef struct {
              int n;
              int* cells; /* the grid, row by row */
              int* row;
              int* col;
          } NeighborSum;

          static const int NS_SIDES[4][2] = {{-1, 0}, {1, 0}, {0, -1}, {0, 1}};
          static const int NS_DIAGONALS[4][2] = {{-1, -1}, {-1, 1}, {1, -1}, {1, 1}};

          NeighborSum* neighborSumCreate(int** grid, int gridSize, int* gridColSize) {
              int n = gridSize;
              NeighborSum* o = (NeighborSum*)malloc(sizeof(NeighborSum));
              o->n = n;
              o->cells = (int*)malloc(n * n * sizeof(int));
              o->row = (int*)malloc(n * n * sizeof(int));
              o->col = (int*)malloc(n * n * sizeof(int));
              for (int r = 0; r < n; r++)
                  for (int c = 0; c < n; c++) {
                      o->cells[r * n + c] = grid[r][c];
                      o->row[grid[r][c]] = r;
                      o->col[grid[r][c]] = c;
                  }
              return o;
          }

          static int nsAround(NeighborSum* o, int value, const int offsets[4][2]) {
              int s = 0;
              for (int k = 0; k < 4; k++) {
                  int y = o->row[value] + offsets[k][0], x = o->col[value] + offsets[k][1];
                  if (y >= 0 && y < o->n && x >= 0 && x < o->n) s += o->cells[y * o->n + x];
              }
              return s;
          }

          int neighborSumAdjacentSum(NeighborSum* obj, int value) {
              return nsAround(obj, value, NS_SIDES);
          }

          int neighborSumDiagonalSum(NeighborSum* obj, int value) {
              return nsAround(obj, value, NS_DIAGONALS);
          }

          void neighborSumFree(NeighborSum* obj) {
              free(obj->cells);
              free(obj->row);
              free(obj->col);
              free(obj);
          }
        `,
        csharp: code`
          public class NeighborSum {
              private static readonly int[][] Sides = { new[] { -1, 0 }, new[] { 1, 0 }, new[] { 0, -1 }, new[] { 0, 1 } };
              private static readonly int[][] Diagonals = { new[] { -1, -1 }, new[] { -1, 1 }, new[] { 1, -1 }, new[] { 1, 1 } };
              private int[][] g;
              private int n;
              private int[] row, col;

              public NeighborSum(int[][] grid) {
                  g = grid;
                  n = grid.Length;
                  row = new int[n * n];
                  col = new int[n * n];
                  for (int r = 0; r < n; r++)
                      for (int c = 0; c < n; c++) { row[grid[r][c]] = r; col[grid[r][c]] = c; }
              }

              private int Around(int value, int[][] offsets) {
                  int s = 0;
                  foreach (int[] d in offsets) {
                      int y = row[value] + d[0], x = col[value] + d[1];
                      if (y >= 0 && y < n && x >= 0 && x < n) s += g[y][x];
                  }
                  return s;
              }

              public int AdjacentSum(int value) {
                  return Around(value, Sides);
              }

              public int DiagonalSum(int value) {
                  return Around(value, Diagonals);
              }
          }
        `,
        go: code`
          var nsSides = [4][2]int{{-1, 0}, {1, 0}, {0, -1}, {0, 1}}
          var nsDiagonals = [4][2]int{{-1, -1}, {-1, 1}, {1, -1}, {1, 1}}

          type NeighborSum struct {
          	g        [][]int
          	row, col []int
          }

          func Constructor(grid [][]int) NeighborSum {
          	n := len(grid)
          	o := NeighborSum{g: grid, row: make([]int, n*n), col: make([]int, n*n)}
          	for r := 0; r < n; r++ {
          		for c := 0; c < n; c++ {
          			o.row[grid[r][c]] = r
          			o.col[grid[r][c]] = c
          		}
          	}
          	return o
          }

          func (this *NeighborSum) around(value int, offsets [4][2]int) int {
          	n, s := len(this.g), 0
          	for _, d := range offsets {
          		y, x := this.row[value]+d[0], this.col[value]+d[1]
          		if y >= 0 && y < n && x >= 0 && x < n {
          			s += this.g[y][x]
          		}
          	}
          	return s
          }

          func (this *NeighborSum) AdjacentSum(value int) int {
          	return this.around(value, nsSides)
          }

          func (this *NeighborSum) DiagonalSum(value int) int {
          	return this.around(value, nsDiagonals)
          }
        `,
        kotlin: code`
          class NeighborSum(grid: Array<IntArray>) {
              private val g = grid
              private val n = grid.size
              private val row = IntArray(n * n)
              private val col = IntArray(n * n)

              init {
                  for (r in 0 until n) for (c in 0 until n) { row[grid[r][c]] = r; col[grid[r][c]] = c }
              }

              private fun around(value: Int, offsets: Array<IntArray>): Int {
                  var s = 0
                  for (d in offsets) {
                      val y = row[value] + d[0]
                      val x = col[value] + d[1]
                      if (y in 0 until n && x in 0 until n) s += g[y][x]
                  }
                  return s
              }

              fun adjacentSum(value: Int): Int =
                  around(value, arrayOf(intArrayOf(-1, 0), intArrayOf(1, 0), intArrayOf(0, -1), intArrayOf(0, 1)))

              fun diagonalSum(value: Int): Int =
                  around(value, arrayOf(intArrayOf(-1, -1), intArrayOf(-1, 1), intArrayOf(1, -1), intArrayOf(1, 1)))
          }
        `,
        swift: code`
          class NeighborSum {
              let g: [[Int]]
              let n: Int
              var row: [Int]
              var col: [Int]

              init(_ grid: [[Int]]) {
                  g = grid
                  n = grid.count
                  row = [Int](repeating: 0, count: n * n)
                  col = [Int](repeating: 0, count: n * n)
                  for r in 0..<n {
                      for c in 0..<n { row[grid[r][c]] = r; col[grid[r][c]] = c }
                  }
              }

              private func around(_ value: Int, _ offsets: [(Int, Int)]) -> Int {
                  var s = 0
                  for (dr, dc) in offsets {
                      let y = row[value] + dr, x = col[value] + dc
                      if y >= 0 && y < n && x >= 0 && x < n { s += g[y][x] }
                  }
                  return s
              }

              func adjacentSum(_ value: Int) -> Int {
                  return around(value, [(-1, 0), (1, 0), (0, -1), (0, 1)])
              }

              func diagonalSum(_ value: Int) -> Int {
                  return around(value, [(-1, -1), (-1, 1), (1, -1), (1, 1)])
              }
          }
        `,
        rust: code`
          struct NeighborSum {
              g: Vec<Vec<i32>>,
              row: Vec<i32>,
              col: Vec<i32>,
          }

          impl NeighborSum {
              fn new(grid: Vec<Vec<i32>>) -> Self {
                  let n = grid.len();
                  let mut row = vec![0; n * n];
                  let mut col = vec![0; n * n];
                  for r in 0..n {
                      for c in 0..n {
                          row[grid[r][c] as usize] = r as i32;
                          col[grid[r][c] as usize] = c as i32;
                      }
                  }
                  NeighborSum { g: grid, row, col }
              }

              fn around(&self, value: i32, offsets: &[(i32, i32); 4]) -> i32 {
                  let n = self.g.len() as i32;
                  let mut s = 0;
                  for &(dr, dc) in offsets.iter() {
                      let y = self.row[value as usize] + dr;
                      let x = self.col[value as usize] + dc;
                      if y >= 0 && y < n && x >= 0 && x < n { s += self.g[y as usize][x as usize]; }
                  }
                  s
              }

              fn adjacentSum(&mut self, value: i32) -> i32 {
                  self.around(value, &[(-1, 0), (1, 0), (0, -1), (0, 1)])
              }

              fn diagonalSum(&mut self, value: i32) -> i32 {
                  self.around(value, &[(-1, -1), (-1, 1), (1, -1), (1, 1)])
              }
          }
        `,
        php: code`
          class NeighborSum {
              private $g;
              private $n;
              private $row = [];
              private $col = [];

              function __construct($grid) {
                  $this->g = $grid;
                  $this->n = count($grid);
                  for ($r = 0; $r < $this->n; $r++)
                      for ($c = 0; $c < $this->n; $c++) { $this->row[$grid[$r][$c]] = $r; $this->col[$grid[$r][$c]] = $c; }
              }

              private function around($value, $offsets) {
                  $s = 0;
                  foreach ($offsets as $d) {
                      $y = $this->row[$value] + $d[0];
                      $x = $this->col[$value] + $d[1];
                      if ($y >= 0 && $y < $this->n && $x >= 0 && $x < $this->n) $s += $this->g[$y][$x];
                  }
                  return $s;
              }

              function adjacentSum($value) {
                  return $this->around($value, [[-1, 0], [1, 0], [0, -1], [0, 1]]);
              }

              function diagonalSum($value) {
                  return $this->around($value, [[-1, -1], [-1, 1], [1, -1], [1, 1]]);
              }
          }
        `,
        ruby: code`
          class NeighborSum
            SIDES = [[-1, 0], [1, 0], [0, -1], [0, 1]].freeze
            DIAGONALS = [[-1, -1], [-1, 1], [1, -1], [1, 1]].freeze

            def initialize(grid)
              @g = grid
              @n = grid.length
              @pos = []
              grid.each_with_index { |line, r| line.each_with_index { |v, c| @pos[v] = [r, c] } }
            end

            def adjacentSum(value)
              around(value, SIDES)
            end

            def diagonalSum(value)
              around(value, DIAGONALS)
            end

            private

            def around(value, offsets)
              r, c = @pos[value]
              offsets.sum do |dr, dc|
                y = r + dr
                x = c + dc
                y >= 0 && y < @n && x >= 0 && x < @n ? @g[y][x] : 0
              end
            end
          end
        `,
      },
    };
  })(),

  // ── LRU Cache (LC 146) ────────────────────────────────────────────
  (() => {
    const run = (ops: string[], args: number[][]) => {
      let cap = 0;
      const m = new Map<number, number>(); // insertion order = recency, oldest first
      return ops.map((op, i) => {
        if (op === "LRUCache") { cap = args[i][0]; return null; }
        const key = args[i][0];
        if (op === "get") {
          if (!m.has(key)) return -1;
          const v = m.get(key) as number;
          m.delete(key); m.set(key, v);
          return v;
        }
        if (m.has(key)) m.delete(key);
        else if (m.size === cap) m.delete(m.keys().next().value as number);
        m.set(key, args[i][1]);
        return null;
      });
    };
    const ex = [
      { ops: ["LRUCache", "put", "put", "get", "put", "get", "put", "get", "get", "get"], args: [[2], [1, 10], [2, 20], [1], [3, 30], [2], [4, 40], [1], [3], [4]] },
      { ops: ["LRUCache", "put", "put", "put", "get", "put", "get"], args: [[1], [5, 1], [5, 2], [6, 3], [5], [6, 0], [6]] },
    ];
    return {
      slug: "lru-cache",
      title: "LRU Cache",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "Design", "Amazon", "Microsoft", "Google", "Meta"],
      signature: {
        funcName: "LRUCache", params: [{ name: "capacity", type: "int" as const }], returns: "void" as const,
        methods: [
          { name: "get", params: [{ name: "key", type: "int" as const }], returns: "int" as const },
          { name: "put", params: [{ name: "key", type: "int" as const }, { name: "value", type: "int" as const }], returns: "void" as const },
        ],
      },
      description: describe(
        "Design a cache with a fixed capacity that, when full, throws out the **least recently used** entry. Write the class `LRUCache`:\n\n- `LRUCache(int capacity)` creates an empty cache that holds at most `capacity` keys.\n- `int get(int key)` returns the value stored for `key`, or `-1` if it is not in the cache. A successful `get` counts as a use of the key.\n- `void put(int key, int value)` stores `value` for `key`, replacing any older value; this also counts as a use. If storing a **new** key would take the cache past its capacity, first remove the key whose last use is the oldest.\n\nBoth `get` and `put` must run in `O(1)` average time.\n\n" + CALLS,
        [
          exOf(ex[0].ops, ex[0].args, run, "`get(1)` makes 1 the most recent, so putting 3 evicts 2. Putting 4 then evicts 1 (used before 3), leaving 3 and 4."),
          exOf(ex[1].ops, ex[1].args, run, "With room for one key, updating key 5 keeps it, but putting 6 evicts 5. Overwriting an existing key never evicts anything — the value 0 replaces 3."),
        ],
        ["1 <= capacity <= 3000", "0 <= key <= 10^4", "0 <= value <= 10^5", "At most 2 * 10^5 calls are made to get and put"]),
      hints: [
        "A hash map gives O(1) lookup by key, but it cannot tell you which key was used longest ago.",
        "Keep the keys in a list ordered by last use: a use moves a key to the front, and eviction takes the key at the back.",
        "Moving an element to the front in O(1) needs a doubly linked list whose nodes the hash map points at directly — the map finds the node, the list relinks it.",
      ],
      editorial: explain({
        idea: "Combine a hash map with a doubly linked list. The list holds the entries in order of last use (most recent at the front); the map takes a key straight to its list node, so every reorder and every eviction is a constant number of pointer changes.",
        steps: [
          "Keep a sentinel node so the list is circular: `head.next` is the most recently used entry, `head.prev` the least.",
          "`get(key)`: if the map has no node for `key`, return `-1`. Otherwise unlink the node, insert it right after the sentinel and return its value.",
          "`put(key, value)`: if the key exists, update the value and move its node to the front.",
          "Otherwise, if the cache is full, unlink the node at `head.prev` and delete its key from the map. Then create a node for `(key, value)`, put it at the front and record it in the map.",
        ],
        why: "The list is always ordered by last use: each use moves exactly the used node to the front, which keeps every other node's relative order. So the node at the back is the one whose last use is oldest — the entry LRU eviction must remove — and the map is updated in the same step, so it never points at a removed node.",
        time: "O(1) average per get and put",
        space: "O(capacity)",
        pitfalls: [
          "Updating an existing key must not evict anything, even when the cache is full.",
          "Forgetting that `get` is a use (it must move the key to the front) is the most common bug.",
          "Each node must remember its key: eviction starts from the list node and has to delete that key from the map.",
          "Built-in ordered maps (`LinkedHashMap` with access order, Python's `OrderedDict`, insertion-ordered hashes in JavaScript, PHP and Ruby) are this same structure; using them is fine once you can explain what they do.",
        ],
      }),
      examples: ex.map((e) => caseOf(e.ops, e.args, run)),
      gen: (rng: Rng) => {
        const cap = rng() < 0.1 ? 3000 : ri(rng, 1, pick(rng, [1, 2, 3, 5, 10]));
        const top = pick(rng, [4, 10, 25, 10000]);
        const vtop = pick(rng, [9, 100000]);
        const ops = ["LRUCache"], args: number[][] = [[cap]], used: number[] = [];
        for (let m = ri(rng, 1, pick(rng, [4, 15, 40])); m > 0; m--) {
          const key = used.length && rng() < 0.6 ? pick(rng, used) : ri(rng, 0, top);
          used.push(key);
          if (rng() < 0.5) { ops.push("put"); args.push([key, ri(rng, 0, vtop)]); }
          else { ops.push("get"); args.push([key]); }
        }
        return caseOf(ops, args, run);
      },
      solutions: {
        python: code`
          from collections import OrderedDict

          class LRUCache:

              def __init__(self, capacity: int):
                  self.cap = capacity
                  self.items = OrderedDict()  # a hash map over a doubly linked list, oldest first

              def get(self, key: int) -> int:
                  if key not in self.items:
                      return -1
                  self.items.move_to_end(key)
                  return self.items[key]

              def put(self, key: int, value: int) -> None:
                  if key in self.items:
                      self.items.move_to_end(key)
                  elif len(self.items) == self.cap:
                      self.items.popitem(last=False)  # evict the least recently used
                  self.items[key] = value
        `,
        javascript: code`
          // A hash map from key to node, over a circular doubly linked list with a sentinel:
          // head.next is the most recently used entry, head.prev the least.
          var LRUCache = function(capacity) {
              this.cap = capacity;
              this.size = 0;
              this.nodes = {};
              this.head = { key: -1, value: 0, prev: null, next: null };
              this.head.prev = this.head;
              this.head.next = this.head;
          };

          LRUCache.prototype.unlink = function(n) {
              n.prev.next = n.next;
              n.next.prev = n.prev;
          };

          LRUCache.prototype.pushFront = function(n) {
              n.next = this.head.next;
              n.prev = this.head;
              this.head.next.prev = n;
              this.head.next = n;
          };

          LRUCache.prototype.get = function(key) {
              var n = this.nodes[key];
              if (n === undefined) return -1;
              this.unlink(n);
              this.pushFront(n);
              return n.value;
          };

          LRUCache.prototype.put = function(key, value) {
              var n = this.nodes[key];
              if (n !== undefined) {
                  n.value = value;
                  this.unlink(n);
                  this.pushFront(n);
                  return;
              }
              if (this.size === this.cap) {
                  var lru = this.head.prev;
                  this.unlink(lru);
                  delete this.nodes[lru.key];
                  this.size--;
              }
              n = { key: key, value: value, prev: null, next: null };
              this.nodes[key] = n;
              this.pushFront(n);
              this.size++;
          };
        `,
        typescript: code`
          class CacheNode {
              key: number;
              value: number;
              prev: CacheNode;
              next: CacheNode;

              constructor(key: number, value: number) {
                  this.key = key;
                  this.value = value;
                  this.prev = this;
                  this.next = this;
              }
          }

          // head.next is the most recently used entry, head.prev the least.
          class LRUCache {
              cap: number;
              size: number;
              nodes: { [key: number]: CacheNode };
              head: CacheNode;

              constructor(capacity: number) {
                  this.cap = capacity;
                  this.size = 0;
                  this.nodes = {};
                  this.head = new CacheNode(-1, 0);
              }

              unlink(n: CacheNode): void {
                  n.prev.next = n.next;
                  n.next.prev = n.prev;
              }

              pushFront(n: CacheNode): void {
                  n.next = this.head.next;
                  n.prev = this.head;
                  this.head.next.prev = n;
                  this.head.next = n;
              }

              get(key: number): number {
                  var n = this.nodes[key];
                  if (n === undefined) return -1;
                  this.unlink(n);
                  this.pushFront(n);
                  return n.value;
              }

              put(key: number, value: number): void {
                  var n = this.nodes[key];
                  if (n !== undefined) {
                      n.value = value;
                      this.unlink(n);
                      this.pushFront(n);
                      return;
                  }
                  if (this.size === this.cap) {
                      var lru = this.head.prev;
                      this.unlink(lru);
                      delete this.nodes[lru.key];
                      this.size--;
                  }
                  n = new CacheNode(key, value);
                  this.nodes[key] = n;
                  this.pushFront(n);
                  this.size++;
              }
          }
        `,
        java: code`
          class LRUCache {
              private final int cap;
              private final LinkedHashMap<Integer, Integer> map;

              public LRUCache(int capacity) {
                  cap = capacity;
                  // accessOrder = true: iteration runs from least to most recently used
                  map = new LinkedHashMap<Integer, Integer>(16, 0.75f, true) {
                      @Override
                      protected boolean removeEldestEntry(Map.Entry<Integer, Integer> eldest) {
                          return size() > cap;
                      }
                  };
              }

              public int get(int key) {
                  return map.getOrDefault(key, -1);
              }

              public void put(int key, int value) {
                  map.put(key, value);
              }
          }
        `,
        cpp: code`
          class LRUCache {
              int cap;
              list<pair<int, int>> order; // front = most recently used
              unordered_map<int, list<pair<int, int>>::iterator> where;
          public:
              LRUCache(int capacity) : cap(capacity) {}

              int get(int key) {
                  auto it = where.find(key);
                  if (it == where.end()) return -1;
                  order.splice(order.begin(), order, it->second);
                  return it->second->second;
              }

              void put(int key, int value) {
                  auto it = where.find(key);
                  if (it != where.end()) {
                      it->second->second = value;
                      order.splice(order.begin(), order, it->second);
                      return;
                  }
                  if ((int)order.size() == cap) {
                      where.erase(order.back().first);
                      order.pop_back();
                  }
                  order.push_front({key, value});
                  where[key] = order.begin();
              }
          };
        `,
        c: code`
          /* Nodes live in arrays: node 0 is the sentinel of a circular doubly linked list
             (next[0] = most recently used, prev[0] = least), nodes 1..capacity hold entries,
             and slot[key] is the node holding key (0 = absent; keys are at most 10^4). */
          #define LRU_KEYS 10001

          typedef struct {
              int cap, size;
              int *key, *value, *prev, *next;
              int slot[LRU_KEYS];
          } LRUCache;

          static void lruUnlink(LRUCache* c, int i) {
              c->next[c->prev[i]] = c->next[i];
              c->prev[c->next[i]] = c->prev[i];
          }

          static void lruPushFront(LRUCache* c, int i) {
              c->next[i] = c->next[0];
              c->prev[i] = 0;
              c->prev[c->next[0]] = i;
              c->next[0] = i;
          }

          LRUCache* lRUCacheCreate(int capacity) {
              LRUCache* c = (LRUCache*)calloc(1, sizeof(LRUCache));
              c->cap = capacity;
              c->key = (int*)malloc((capacity + 1) * sizeof(int));
              c->value = (int*)malloc((capacity + 1) * sizeof(int));
              c->prev = (int*)malloc((capacity + 1) * sizeof(int));
              c->next = (int*)malloc((capacity + 1) * sizeof(int));
              c->prev[0] = 0;
              c->next[0] = 0;
              return c;
          }

          int lRUCacheGet(LRUCache* obj, int key) {
              int i = obj->slot[key];
              if (i == 0) return -1;
              lruUnlink(obj, i);
              lruPushFront(obj, i);
              return obj->value[i];
          }

          void lRUCachePut(LRUCache* obj, int key, int value) {
              int i = obj->slot[key];
              if (i != 0) {
                  obj->value[i] = value;
                  lruUnlink(obj, i);
                  lruPushFront(obj, i);
                  return;
              }
              if (obj->size == obj->cap) {
                  i = obj->prev[0]; /* the least recently used node is reused */
                  lruUnlink(obj, i);
                  obj->slot[obj->key[i]] = 0;
              } else {
                  i = ++obj->size;
              }
              obj->key[i] = key;
              obj->value[i] = value;
              obj->slot[key] = i;
              lruPushFront(obj, i);
          }

          void lRUCacheFree(LRUCache* obj) {
              free(obj->key);
              free(obj->value);
              free(obj->prev);
              free(obj->next);
              free(obj);
          }
        `,
        csharp: code`
          public class LRUCache {
              private int cap;
              private Dictionary<int, LinkedListNode<int[]>> map = new Dictionary<int, LinkedListNode<int[]>>();
              private LinkedList<int[]> order = new LinkedList<int[]>(); // first = most recently used

              public LRUCache(int capacity) {
                  cap = capacity;
              }

              public int Get(int key) {
                  LinkedListNode<int[]> node;
                  if (!map.TryGetValue(key, out node)) return -1;
                  order.Remove(node);
                  order.AddFirst(node);
                  return node.Value[1];
              }

              public void Put(int key, int value) {
                  LinkedListNode<int[]> node;
                  if (map.TryGetValue(key, out node)) {
                      node.Value[1] = value;
                      order.Remove(node);
                      order.AddFirst(node);
                      return;
                  }
                  if (map.Count == cap) {
                      map.Remove(order.Last.Value[0]);
                      order.RemoveLast();
                  }
                  map[key] = order.AddFirst(new int[] { key, value });
              }
          }
        `,
        go: code`
          type lruEntry struct {
          	key, value int
          }

          type LRUCache struct {
          	cap   int
          	order *list.List // front = most recently used
          	items map[int]*list.Element
          }

          func Constructor(capacity int) LRUCache {
          	return LRUCache{cap: capacity, order: list.New(), items: map[int]*list.Element{}}
          }

          func (this *LRUCache) Get(key int) int {
          	e, ok := this.items[key]
          	if !ok {
          		return -1
          	}
          	this.order.MoveToFront(e)
          	return e.Value.(*lruEntry).value
          }

          func (this *LRUCache) Put(key int, value int) {
          	if e, ok := this.items[key]; ok {
          		e.Value.(*lruEntry).value = value
          		this.order.MoveToFront(e)
          		return
          	}
          	if this.order.Len() == this.cap {
          		last := this.order.Back()
          		this.order.Remove(last)
          		delete(this.items, last.Value.(*lruEntry).key)
          	}
          	this.items[key] = this.order.PushFront(&lruEntry{key, value})
          }
        `,
        kotlin: code`
          class LRUCache(capacity: Int) {
              private val cap = capacity
              // accessOrder = true: iteration runs from least to most recently used
              private val map = object : java.util.LinkedHashMap<Int, Int>(16, 0.75f, true) {
                  override fun removeEldestEntry(eldest: MutableMap.MutableEntry<Int, Int>?): Boolean = size > cap
              }

              fun get(key: Int): Int = map[key] ?: -1

              fun put(key: Int, value: Int) {
                  map[key] = value
              }
          }
        `,
        swift: code`
          final class CacheNode {
              var key: Int
              var value: Int
              var prev: CacheNode?
              var next: CacheNode?

              init(_ key: Int, _ value: Int) {
                  self.key = key
                  self.value = value
              }
          }

          class LRUCache {
              let cap: Int
              var nodes: [Int: CacheNode] = [:]
              let head = CacheNode(-1, 0) // head.next = most recently used
              let tail = CacheNode(-1, 0) // tail.prev = least recently used

              init(_ capacity: Int) {
                  cap = capacity
                  head.next = tail
                  tail.prev = head
              }

              private func unlink(_ n: CacheNode) {
                  n.prev!.next = n.next
                  n.next!.prev = n.prev
              }

              private func pushFront(_ n: CacheNode) {
                  n.next = head.next
                  n.prev = head
                  head.next!.prev = n
                  head.next = n
              }

              func get(_ key: Int) -> Int {
                  guard let n = nodes[key] else { return -1 }
                  unlink(n)
                  pushFront(n)
                  return n.value
              }

              func put(_ key: Int, _ value: Int) {
                  if let n = nodes[key] {
                      n.value = value
                      unlink(n)
                      pushFront(n)
                      return
                  }
                  if nodes.count == cap {
                      let lru = tail.prev!
                      unlink(lru)
                      nodes[lru.key] = nil
                  }
                  let n = CacheNode(key, value)
                  nodes[key] = n
                  pushFront(n)
              }
          }
        `,
        rust: code`
          use std::collections::HashMap;

          // Nodes live in vectors: node 0 is the sentinel of a circular doubly linked list
          // (next[0] = most recently used, prev[0] = least), and the map takes a key to its node.
          struct LRUCache {
              cap: usize,
              map: HashMap<i32, usize>,
              key: Vec<i32>,
              value: Vec<i32>,
              prev: Vec<usize>,
              next: Vec<usize>,
          }

          impl LRUCache {
              fn new(capacity: i32) -> Self {
                  LRUCache { cap: capacity as usize, map: HashMap::new(), key: vec![0], value: vec![0], prev: vec![0], next: vec![0] }
              }

              fn unlink(&mut self, i: usize) {
                  let (p, n) = (self.prev[i], self.next[i]);
                  self.next[p] = n;
                  self.prev[n] = p;
              }

              fn push_front(&mut self, i: usize) {
                  let f = self.next[0];
                  self.next[i] = f;
                  self.prev[i] = 0;
                  self.prev[f] = i;
                  self.next[0] = i;
              }

              fn get(&mut self, key: i32) -> i32 {
                  if let Some(i) = self.map.get(&key).cloned() {
                      self.unlink(i);
                      self.push_front(i);
                      return self.value[i];
                  }
                  -1
              }

              fn put(&mut self, key: i32, value: i32) {
                  if let Some(i) = self.map.get(&key).cloned() {
                      self.value[i] = value;
                      self.unlink(i);
                      self.push_front(i);
                      return;
                  }
                  let i = if self.map.len() == self.cap {
                      let lru = self.prev[0]; // reuse the least recently used node
                      self.unlink(lru);
                      let old = self.key[lru];
                      self.map.remove(&old);
                      lru
                  } else {
                      self.key.push(0);
                      self.value.push(0);
                      self.prev.push(0);
                      self.next.push(0);
                      self.key.len() - 1
                  };
                  self.key[i] = key;
                  self.value[i] = value;
                  self.map.insert(key, i);
                  self.push_front(i);
              }
          }
        `,
        php: code`
          class LRUCache {
              private $cap;
              private $items = []; // PHP arrays keep insertion order: oldest first

              function __construct($capacity) {
                  $this->cap = $capacity;
              }

              function get($key) {
                  if (!array_key_exists($key, $this->items)) return -1;
                  $v = $this->items[$key];
                  unset($this->items[$key]); // re-insert to make it the newest
                  $this->items[$key] = $v;
                  return $v;
              }

              function put($key, $value) {
                  if (array_key_exists($key, $this->items)) {
                      unset($this->items[$key]);
                  } elseif (count($this->items) == $this->cap) {
                      reset($this->items);
                      unset($this->items[key($this->items)]); // evict the oldest
                  }
                  $this->items[$key] = $value;
              }
          }
        `,
        ruby: code`
          class LRUCache
            def initialize(capacity)
              @cap = capacity
              @items = {} # Ruby hashes keep insertion order: oldest first
            end

            def get(key)
              return -1 unless @items.key?(key)
              @items[key] = @items.delete(key) # re-insert to make it the newest
            end

            def put(key, value)
              if @items.key?(key)
                @items.delete(key)
              elsif @items.size == @cap
                @items.shift # evict the oldest
              end
              @items[key] = value
            end
          end
        `,
      },
    };
  })(),

  // ── Min Stack (LC 155) ────────────────────────────────────────────
  (() => {
    const run = (ops: string[], args: number[][]) => {
      const st: number[] = [];
      return ops.map((op, i) => {
        if (op === "push") { st.push(args[i][0]); return null; }
        if (op === "pop") { st.pop(); return null; }
        if (op === "top") return st[st.length - 1];
        if (op === "getMin") return Math.min(...st);
        return null;
      });
    };
    const ex = [
      { ops: ["MinStack", "push", "push", "push", "getMin", "pop", "top", "getMin"], args: [[], [-2], [0], [-3], [], [], [], []] },
      { ops: ["MinStack", "push", "push", "push", "getMin", "pop", "getMin", "pop", "getMin"], args: [[], [4], [4], [7], [], [], [], [], []] },
    ];
    return {
      slug: "min-stack",
      title: "Min Stack",
      difficulty: "MEDIUM" as const,
      tags: ["Stack", "Design", "Amazon", "Microsoft", "Google", "Bloomberg"],
      signature: {
        funcName: "MinStack", params: [], returns: "void" as const,
        methods: [
          { name: "push", params: [{ name: "x", type: "int" as const }], returns: "void" as const },
          { name: "pop", params: [], returns: "void" as const },
          { name: "top", params: [], returns: "int" as const },
          { name: "getMin", params: [], returns: "int" as const },
        ],
      },
      description: describe(
        "Design a stack that can also report its smallest element, with **every** operation in `O(1)` time. Write the class `MinStack`:\n\n- `MinStack()` creates an empty stack.\n- `void push(int x)` pushes `x` onto the stack.\n- `void pop()` removes the element on top of the stack.\n- `int top()` returns the element on top of the stack.\n- `int getMin()` returns the smallest element currently in the stack.\n\n" + CALLS,
        [
          exOf(ex[0].ops, ex[0].args, run, "After pushing -2, 0, -3 the minimum is -3. Popping -3 leaves 0 on top and -2 as the minimum again."),
          exOf(ex[1].ops, ex[1].args, run, "Duplicates matter: with two 4s on the stack, popping one 4 still leaves a 4, so the minimum stays 4."),
        ],
        ["-2^31 <= x <= 2^31 - 1", "pop, top and getMin are only called on a non-empty stack", "At most 3 * 10^4 calls are made to push, pop, top and getMin"]),
      hints: [
        "Keeping a single \"current minimum\" variable breaks as soon as the minimum is popped — what was the minimum before it?",
        "The minimum of the stack depends only on what is below the top, and that never changes while the top is there.",
        "Store, with every element, the minimum of the stack at the moment it was pushed: `min(x, previous minimum)`. Then `getMin` reads it from the top entry.",
      ],
      editorial: explain({
        idea: "Push pairs `(x, minimum so far)`. The minimum of a stack is fixed by the elements in it, and the elements below the top never change while the top is in place, so the pair on top always carries the current minimum.",
        steps: [
          "`push(x)`: push `(x, x)` if the stack is empty, else `(x, min(x, top.min))`.",
          "`pop()`: pop the top pair.",
          "`top()`: return the top pair's value.",
          "`getMin()`: return the top pair's minimum.",
        ],
        why: "By induction, each pair's stored minimum is the minimum of itself and every element under it. Popping removes a pair without changing the pairs below, whose stored minima were computed from exactly the elements that remain.",
        time: "O(1) per operation",
        space: "O(n)",
        pitfalls: [
          "A separate min-stack that only records strictly smaller values breaks on duplicates of the minimum — record `<=` values, or store the minimum with every element as here.",
          "Values span the whole 32-bit range; avoid tricks like storing `x - min`, which overflow in 32 bits.",
        ],
      }),
      examples: ex.map((e) => caseOf(e.ops, e.args, run)),
      gen: (rng: Rng) => {
        const wide = rng() < 0.3;
        const value = () => {
          if (wide && rng() < 0.2) return pick(rng, [-2147483648, 2147483647]);
          return wide ? ri(rng, -2147483648, 2147483647) : ri(rng, -5, 5);
        };
        const ops = ["MinStack"], args: number[][] = [[]];
        let size = 0;
        for (let m = ri(rng, 1, pick(rng, [3, 12, 25, 40])); m > 0; m--) {
          const r = rng();
          if (size === 0 || r < 0.4) { ops.push("push"); args.push([value()]); size++; }
          else if (r < 0.6) { ops.push("pop"); args.push([]); size--; }
          else if (r < 0.75) { ops.push("top"); args.push([]); }
          else { ops.push("getMin"); args.push([]); }
        }
        return caseOf(ops, args, run);
      },
      solutions: {
        python: code`
          class MinStack:

              def __init__(self):
                  self.st = []  # pairs (value, minimum of the stack up to here)

              def push(self, x: int) -> None:
                  self.st.append((x, min(x, self.st[-1][1]) if self.st else x))

              def pop(self) -> None:
                  self.st.pop()

              def top(self) -> int:
                  return self.st[-1][0]

              def getMin(self) -> int:
                  return self.st[-1][1]
        `,
        javascript: code`
          var MinStack = function() {
              this.vals = [];
              this.mins = []; // mins[i] = minimum of vals[0..i]
          };

          MinStack.prototype.push = function(x) {
              var n = this.mins.length;
              this.vals.push(x);
              this.mins.push(n === 0 ? x : Math.min(x, this.mins[n - 1]));
          };

          MinStack.prototype.pop = function() {
              this.vals.pop();
              this.mins.pop();
          };

          MinStack.prototype.top = function() {
              return this.vals[this.vals.length - 1];
          };

          MinStack.prototype.getMin = function() {
              return this.mins[this.mins.length - 1];
          };
        `,
        typescript: code`
          class MinStack {
              vals: number[];
              mins: number[];

              constructor() {
                  this.vals = [];
                  this.mins = []; // mins[i] = minimum of vals[0..i]
              }

              push(x: number): void {
                  var n = this.mins.length;
                  this.vals.push(x);
                  this.mins.push(n === 0 ? x : Math.min(x, this.mins[n - 1]));
              }

              pop(): void {
                  this.vals.pop();
                  this.mins.pop();
              }

              top(): number {
                  return this.vals[this.vals.length - 1];
              }

              getMin(): number {
                  return this.mins[this.mins.length - 1];
              }
          }
        `,
        java: code`
          class MinStack {
              private Deque<int[]> st = new ArrayDeque<>(); // pairs {value, minimum up to here}

              public MinStack() {
              }

              public void push(int x) {
                  st.push(new int[]{x, st.isEmpty() ? x : Math.min(x, st.peek()[1])});
              }

              public void pop() {
                  st.pop();
              }

              public int top() {
                  return st.peek()[0];
              }

              public int getMin() {
                  return st.peek()[1];
              }
          }
        `,
        cpp: code`
          class MinStack {
              vector<pair<int, int>> st; // {value, minimum up to here}
          public:
              MinStack() {}

              void push(int x) {
                  st.push_back({x, st.empty() ? x : min(x, st.back().second)});
              }

              void pop() {
                  st.pop_back();
              }

              int top() {
                  return st.back().first;
              }

              int getMin() {
                  return st.back().second;
              }
          };
        `,
        c: code`
          typedef struct {
              int *vals, *mins; /* mins[i] = minimum of vals[0..i] */
              int size, cap;
          } MinStack;

          MinStack* minStackCreate() {
              MinStack* s = (MinStack*)malloc(sizeof(MinStack));
              s->cap = 16;
              s->size = 0;
              s->vals = (int*)malloc(s->cap * sizeof(int));
              s->mins = (int*)malloc(s->cap * sizeof(int));
              return s;
          }

          void minStackPush(MinStack* obj, int x) {
              if (obj->size == obj->cap) {
                  obj->cap *= 2;
                  obj->vals = (int*)realloc(obj->vals, obj->cap * sizeof(int));
                  obj->mins = (int*)realloc(obj->mins, obj->cap * sizeof(int));
              }
              int m = obj->size == 0 || x < obj->mins[obj->size - 1] ? x : obj->mins[obj->size - 1];
              obj->vals[obj->size] = x;
              obj->mins[obj->size] = m;
              obj->size++;
          }

          void minStackPop(MinStack* obj) {
              obj->size--;
          }

          int minStackTop(MinStack* obj) {
              return obj->vals[obj->size - 1];
          }

          int minStackGetMin(MinStack* obj) {
              return obj->mins[obj->size - 1];
          }

          void minStackFree(MinStack* obj) {
              free(obj->vals);
              free(obj->mins);
              free(obj);
          }
        `,
        csharp: code`
          public class MinStack {
              private Stack<int[]> st = new Stack<int[]>(); // pairs {value, minimum up to here}

              public MinStack() {
              }

              public void Push(int x) {
                  st.Push(new int[] { x, st.Count == 0 ? x : Math.Min(x, st.Peek()[1]) });
              }

              public void Pop() {
                  st.Pop();
              }

              public int Top() {
                  return st.Peek()[0];
              }

              public int GetMin() {
                  return st.Peek()[1];
              }
          }
        `,
        go: code`
          type MinStack struct {
          	vals, mins []int // mins[i] = minimum of vals[0..i]
          }

          func Constructor() MinStack {
          	return MinStack{}
          }

          func (this *MinStack) Push(x int) {
          	m := x
          	if n := len(this.mins); n > 0 && this.mins[n-1] < x {
          		m = this.mins[n-1]
          	}
          	this.vals = append(this.vals, x)
          	this.mins = append(this.mins, m)
          }

          func (this *MinStack) Pop() {
          	this.vals = this.vals[:len(this.vals)-1]
          	this.mins = this.mins[:len(this.mins)-1]
          }

          func (this *MinStack) Top() int {
          	return this.vals[len(this.vals)-1]
          }

          func (this *MinStack) GetMin() int {
          	return this.mins[len(this.mins)-1]
          }
        `,
        kotlin: code`
          class MinStack() {
              private val vals = java.util.ArrayDeque<Int>()
              private val mins = java.util.ArrayDeque<Int>() // top of mins = minimum of vals

              fun push(x: Int) {
                  vals.push(x)
                  mins.push(if (mins.isEmpty()) x else minOf(x, mins.peek()))
              }

              fun pop() {
                  vals.pop()
                  mins.pop()
              }

              fun top(): Int = vals.peek()

              fun getMin(): Int = mins.peek()
          }
        `,
        swift: code`
          class MinStack {
              var st: [(value: Int, low: Int)] = [] // each value with the minimum up to it

              init() {}

              func push(_ x: Int) {
                  st.append((x, st.isEmpty ? x : min(x, st[st.count - 1].low)))
              }

              func pop() {
                  st.removeLast()
              }

              func top() -> Int {
                  return st[st.count - 1].value
              }

              func getMin() -> Int {
                  return st[st.count - 1].low
              }
          }
        `,
        rust: code`
          struct MinStack {
              st: Vec<(i32, i32)>, // (value, minimum up to here)
          }

          impl MinStack {
              fn new() -> Self { MinStack { st: Vec::new() } }

              fn push(&mut self, x: i32) {
                  let m = match self.st.last() { Some(&(_, low)) if low < x => low, _ => x };
                  self.st.push((x, m));
              }

              fn pop(&mut self) { self.st.pop(); }

              fn top(&mut self) -> i32 { self.st.last().unwrap().0 }

              fn getMin(&mut self) -> i32 { self.st.last().unwrap().1 }
          }
        `,
        php: code`
          class MinStack {
              private $st = []; // pairs [value, minimum up to here]

              function __construct() {
              }

              function push($x) {
                  $n = count($this->st);
                  $this->st[] = [$x, $n == 0 ? $x : min($x, $this->st[$n - 1][1])];
              }

              function pop() {
                  array_pop($this->st);
              }

              function top() {
                  return $this->st[count($this->st) - 1][0];
              }

              function getMin() {
                  return $this->st[count($this->st) - 1][1];
              }
          }
        `,
        ruby: code`
          class MinStack
            def initialize
              @st = [] # pairs [value, minimum up to here]
            end

            def push(x)
              @st << [x, @st.empty? ? x : [x, @st[-1][1]].min]
            end

            def pop
              @st.pop
            end

            def top
              @st[-1][0]
            end

            def getMin
              @st[-1][1]
            end
          end
        `,
      },
    };
  })(),

  // ── Implement Trie (Prefix Tree) (LC 208) ─────────────────────────
  (() => {
    const run = (ops: string[], args: string[][]) => {
      const words = new Set<string>();
      return ops.map((op, i) => {
        if (op === "insert") { words.add(args[i][0]); return null; }
        if (op === "search") return words.has(args[i][0]);
        if (op === "startsWith") { const p = args[i][0]; return [...words].some((w) => w.startsWith(p)); }
        return null;
      });
    };
    const ex = [
      { ops: ["Trie", "insert", "search", "search", "startsWith", "insert", "search"], args: [[], ["apple"], ["apple"], ["app"], ["app"], ["app"], ["app"]] },
      { ops: ["Trie", "startsWith", "insert", "insert", "startsWith", "search", "startsWith"], args: [[], ["c"], ["cat"], ["car"], ["ca"], ["ca"], ["cart"]] },
    ];
    return {
      slug: "implement-trie-prefix-tree",
      title: "Implement Trie (Prefix Tree)",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "String", "Trie", "Design", "Amazon", "Google", "Microsoft"],
      signature: {
        funcName: "Trie", params: [], returns: "void" as const,
        methods: [
          { name: "insert", params: [{ name: "word", type: "string" as const }], returns: "void" as const },
          { name: "search", params: [{ name: "word", type: "string" as const }], returns: "bool" as const },
          { name: "startsWith", params: [{ name: "prefix", type: "string" as const }], returns: "bool" as const },
        ],
      },
      description: describe(
        "A **trie** (prefix tree) stores a set of strings so that both whole words and prefixes can be looked up quickly — the structure behind autocomplete and spell checkers. Write the class `Trie`:\n\n- `Trie()` creates an empty trie.\n- `void insert(String word)` adds `word` to the trie.\n- `boolean search(String word)` returns `true` if `word` was inserted before (as a whole word), `false` otherwise.\n- `boolean startsWith(String prefix)` returns `true` if some inserted word begins with `prefix`, `false` otherwise.\n\n" + CALLS,
        [
          exOf(ex[0].ops, ex[0].args, run, "\"app\" is a prefix of \"apple\" but was not inserted as a word, so `search(\"app\")` is false until it is inserted."),
          exOf(ex[1].ops, ex[1].args, run, "Nothing starts with \"c\" in an empty trie. After \"cat\" and \"car\", \"ca\" is a prefix but not a word, and no word starts with \"cart\"."),
        ],
        ["1 <= word.length, prefix.length <= 2000", "word and prefix consist only of lowercase English letters", "At most 3 * 10^4 calls are made to insert, search and startsWith"]),
      hints: [
        "Words that share a beginning can share the storage for it: make a tree where each edge is a letter.",
        "Each node has up to 26 children, one per letter, and a flag saying whether some word ends exactly at this node.",
        "Insert walks down from the root, creating missing children. Search and startsWith walk the same path; search additionally needs the end flag on the last node, startsWith only needs the path to exist.",
      ],
      editorial: explain({
        idea: "Each node of the trie stands for one prefix: the path of letters from the root to it. A node keeps one child per next letter and a flag marking that a whole inserted word ends there.",
        steps: [
          "`insert(word)`: start at the root; for each letter, move to that child, creating it if missing. Mark the last node as a word end.",
          "Walking a string: start at the root and follow each letter's child; if one is missing, the string is not a prefix of any word.",
          "`search(word)`: walk `word`; return whether the walk succeeded and the final node is marked as a word end.",
          "`startsWith(prefix)`: return whether the walk of `prefix` succeeded.",
        ],
        why: "A node exists exactly when its prefix is a prefix of some inserted word, because inserting creates the whole path of a word and nothing else creates nodes. The end flag separates \"was inserted\" from \"is only a prefix\" — `app` and `apple` share every node of `app`, and only the flag tells them apart.",
        time: "O(L) per operation, L = length of the argument",
        space: "O(total letters inserted × alphabet size) for array children",
        pitfalls: [
          "Without the end flag, `search(\"app\")` would wrongly succeed after inserting only `apple`.",
          "Inserting the same word twice must not create a second path — following existing children takes care of it.",
        ],
      }),
      examples: ex.map((e) => caseOf(e.ops, e.args, run)),
      gen: (rng: Rng) => {
        const abc = pick(rng, ["ab", "abc", "abcdefghijklmnopqrstuvwxyz"]);
        const maxLen = pick(rng, [3, 6, 10]);
        const ops = ["Trie"], args: string[][] = [[]], added: string[] = [];
        for (let m = ri(rng, 1, pick(rng, [4, 15, 40])); m > 0; m--) {
          const r = rng();
          let s = added.length && rng() < 0.5 ? pick(rng, added) : randLower(rng, 1, maxLen, abc);
          if (r < 0.4) { ops.push("insert"); added.push(s); }
          else {
            if (rng() < 0.4) s = s.slice(0, ri(rng, 1, s.length)); // a prefix of something
            ops.push(r < 0.7 ? "search" : "startsWith");
          }
          args.push([s]);
        }
        return caseOf(ops, args, run);
      },
      solutions: {
        python: code`
          class Trie:

              def __init__(self):
                  self.root = {}  # letter -> child node; "$" marks a word end

              def insert(self, word: str) -> None:
                  node = self.root
                  for ch in word:
                      node = node.setdefault(ch, {})
                  node["$"] = True

              def _walk(self, s: str):
                  node = self.root
                  for ch in s:
                      node = node.get(ch)
                      if node is None:
                          return None
                  return node

              def search(self, word: str) -> bool:
                  node = self._walk(word)
                  return node is not None and "$" in node

              def startsWith(self, prefix: str) -> bool:
                  return self._walk(prefix) is not None
        `,
        javascript: code`
          var Trie = function() {
              this.root = { children: {}, end: false };
          };

          Trie.prototype.insert = function(word) {
              var node = this.root;
              for (var i = 0; i < word.length; i++) {
                  var ch = word[i];
                  if (!node.children[ch]) node.children[ch] = { children: {}, end: false };
                  node = node.children[ch];
              }
              node.end = true;
          };

          Trie.prototype.walk = function(s) {
              var node = this.root;
              for (var i = 0; i < s.length && node; i++) node = node.children[s[i]];
              return node || null;
          };

          Trie.prototype.search = function(word) {
              var node = this.walk(word);
              return node !== null && node.end;
          };

          Trie.prototype.startsWith = function(prefix) {
              return this.walk(prefix) !== null;
          };
        `,
        typescript: code`
          class TrieNode {
              children: { [ch: string]: TrieNode };
              end: boolean;

              constructor() {
                  this.children = {};
                  this.end = false;
              }
          }

          class Trie {
              root: TrieNode;

              constructor() {
                  this.root = new TrieNode();
              }

              insert(word: string): void {
                  var node = this.root;
                  for (var i = 0; i < word.length; i++) {
                      var ch = word[i];
                      if (!node.children[ch]) node.children[ch] = new TrieNode();
                      node = node.children[ch];
                  }
                  node.end = true;
              }

              walk(s: string): TrieNode {
                  var node = this.root;
                  for (var i = 0; i < s.length && node; i++) node = node.children[s[i]];
                  return node || null;
              }

              search(word: string): boolean {
                  var node = this.walk(word);
                  return node !== null && node.end;
              }

              startsWith(prefix: string): boolean {
                  return this.walk(prefix) !== null;
              }
          }
        `,
        java: code`
          class Trie {
              private static class Node {
                  Node[] next = new Node[26];
                  boolean end;
              }

              private Node root = new Node();

              public Trie() {
              }

              public void insert(String word) {
                  Node node = root;
                  for (int i = 0; i < word.length(); i++) {
                      int c = word.charAt(i) - 'a';
                      if (node.next[c] == null) node.next[c] = new Node();
                      node = node.next[c];
                  }
                  node.end = true;
              }

              private Node walk(String s) {
                  Node node = root;
                  for (int i = 0; i < s.length() && node != null; i++) node = node.next[s.charAt(i) - 'a'];
                  return node;
              }

              public boolean search(String word) {
                  Node node = walk(word);
                  return node != null && node.end;
              }

              public boolean startsWith(String prefix) {
                  return walk(prefix) != null;
              }
          }
        `,
        cpp: code`
          class Trie {
              struct Node {
                  Node* next[26] = {};
                  bool end = false;
              };
              Node* root = new Node();

              Node* walk(const string& s) {
                  Node* node = root;
                  for (size_t i = 0; i < s.size() && node; i++) node = node->next[s[i] - 'a'];
                  return node;
              }
          public:
              Trie() {}

              void insert(string word) {
                  Node* node = root;
                  for (char ch : word) {
                      int c = ch - 'a';
                      if (!node->next[c]) node->next[c] = new Node();
                      node = node->next[c];
                  }
                  node->end = true;
              }

              bool search(string word) {
                  Node* node = walk(word);
                  return node && node->end;
              }

              bool startsWith(string prefix) {
                  return walk(prefix) != nullptr;
              }
          };
        `,
        c: code`
          /* The trie is its own node type: the root is the object the judge holds. */
          typedef struct Trie {
              struct Trie* next[26];
              bool end;
          } Trie;

          Trie* trieCreate() {
              return (Trie*)calloc(1, sizeof(Trie));
          }

          void trieInsert(Trie* obj, char* word) {
              Trie* node = obj;
              for (char* p = word; *p; p++) {
                  int c = *p - 'a';
                  if (node->next[c] == NULL) node->next[c] = trieCreate();
                  node = node->next[c];
              }
              node->end = true;
          }

          static Trie* trieWalk(Trie* node, const char* s) {
              for (; *s && node != NULL; s++) node = node->next[*s - 'a'];
              return node;
          }

          bool trieSearch(Trie* obj, char* word) {
              Trie* node = trieWalk(obj, word);
              return node != NULL && node->end;
          }

          bool trieStartsWith(Trie* obj, char* prefix) {
              return trieWalk(obj, prefix) != NULL;
          }

          void trieFree(Trie* obj) {
              for (int c = 0; c < 26; c++) if (obj->next[c] != NULL) trieFree(obj->next[c]);
              free(obj);
          }
        `,
        csharp: code`
          public class Trie {
              private class Node {
                  public Node[] Next = new Node[26];
                  public bool End;
              }

              private Node root = new Node();

              public Trie() {
              }

              public void Insert(string word) {
                  Node node = root;
                  foreach (char ch in word) {
                      int c = ch - 'a';
                      if (node.Next[c] == null) node.Next[c] = new Node();
                      node = node.Next[c];
                  }
                  node.End = true;
              }

              private Node Walk(string s) {
                  Node node = root;
                  for (int i = 0; i < s.Length && node != null; i++) node = node.Next[s[i] - 'a'];
                  return node;
              }

              public bool Search(string word) {
                  Node node = Walk(word);
                  return node != null && node.End;
              }

              public bool StartsWith(string prefix) {
                  return Walk(prefix) != null;
              }
          }
        `,
        go: code`
          type trieNode struct {
          	next [26]*trieNode
          	end  bool
          }

          type Trie struct {
          	root *trieNode
          }

          func Constructor() Trie {
          	return Trie{root: &trieNode{}}
          }

          func (this *Trie) Insert(word string) {
          	node := this.root
          	for i := 0; i < len(word); i++ {
          		c := word[i] - 'a'
          		if node.next[c] == nil {
          			node.next[c] = &trieNode{}
          		}
          		node = node.next[c]
          	}
          	node.end = true
          }

          func (this *Trie) walk(s string) *trieNode {
          	node := this.root
          	for i := 0; i < len(s) && node != nil; i++ {
          		node = node.next[s[i]-'a']
          	}
          	return node
          }

          func (this *Trie) Search(word string) bool {
          	node := this.walk(word)
          	return node != nil && node.end
          }

          func (this *Trie) StartsWith(prefix string) bool {
          	return this.walk(prefix) != nil
          }
        `,
        kotlin: code`
          class Trie() {
              private class Node {
                  val next = arrayOfNulls<Node>(26)
                  var end = false
              }

              private val root = Node()

              fun insert(word: String) {
                  var node = root
                  for (ch in word) {
                      val c = ch - 'a'
                      if (node.next[c] == null) node.next[c] = Node()
                      node = node.next[c]!!
                  }
                  node.end = true
              }

              private fun walk(s: String): Node? {
                  var node: Node? = root
                  for (ch in s) {
                      node = node?.next?.get(ch - 'a') ?: return null
                  }
                  return node
              }

              fun search(word: String): Boolean = walk(word)?.end == true

              fun startsWith(prefix: String): Boolean = walk(prefix) != null
          }
        `,
        swift: code`
          final class TrieNode {
              var next = [TrieNode?](repeating: nil, count: 26)
              var end = false
          }

          class Trie {
              let root = TrieNode()

              init() {}

              func insert(_ word: String) {
                  var node = root
                  for b in word.utf8 {
                      let c = Int(b) - 97
                      if node.next[c] == nil { node.next[c] = TrieNode() }
                      node = node.next[c]!
                  }
                  node.end = true
              }

              private func walk(_ s: String) -> TrieNode? {
                  var node = root
                  for b in s.utf8 {
                      guard let child = node.next[Int(b) - 97] else { return nil }
                      node = child
                  }
                  return node
              }

              func search(_ word: String) -> Bool {
                  return walk(word)?.end ?? false
              }

              func startsWith(_ prefix: String) -> Bool {
                  return walk(prefix) != nil
              }
          }
        `,
        rust: code`
          // Nodes live in vectors; node 0 is the root, and a child index of 0 means "no child".
          struct Trie {
              next: Vec<[usize; 26]>,
              end: Vec<bool>,
          }

          impl Trie {
              fn new() -> Self { Trie { next: vec![[0; 26]], end: vec![false] } }

              fn insert(&mut self, word: String) {
                  let mut node = 0;
                  for b in word.bytes() {
                      let c = (b - b'a') as usize;
                      if self.next[node][c] == 0 {
                          self.next.push([0; 26]);
                          self.end.push(false);
                          self.next[node][c] = self.next.len() - 1;
                      }
                      node = self.next[node][c];
                  }
                  self.end[node] = true;
              }

              fn walk(&self, s: &str) -> Option<usize> {
                  let mut node = 0;
                  for b in s.bytes() {
                      node = self.next[node][(b - b'a') as usize];
                      if node == 0 { return None; }
                  }
                  Some(node)
              }

              fn search(&mut self, word: String) -> bool {
                  match self.walk(&word) { Some(n) => self.end[n], None => false }
              }

              fn startsWith(&mut self, prefix: String) -> bool {
                  self.walk(&prefix).is_some()
              }
          }
        `,
        php: code`
          class Trie {
              // Nodes are numbered; $next[$n] maps a letter to a child number.
              private $next = [[]];
              private $end = [false];

              function __construct() {
              }

              function insert($word) {
                  $node = 0;
                  for ($i = 0; $i < strlen($word); $i++) {
                      $ch = $word[$i];
                      if (!isset($this->next[$node][$ch])) {
                          $this->next[] = [];
                          $this->end[] = false;
                          $this->next[$node][$ch] = count($this->next) - 1;
                      }
                      $node = $this->next[$node][$ch];
                  }
                  $this->end[$node] = true;
              }

              private function walk($s) {
                  $node = 0;
                  for ($i = 0; $i < strlen($s); $i++) {
                      if (!isset($this->next[$node][$s[$i]])) return -1;
                      $node = $this->next[$node][$s[$i]];
                  }
                  return $node;
              }

              function search($word) {
                  $node = $this->walk($word);
                  return $node >= 0 && $this->end[$node];
              }

              function startsWith($prefix) {
                  return $this->walk($prefix) >= 0;
              }
          }
        `,
        ruby: code`
          class Trie
            def initialize
              @root = {} # letter => child node; :end marks a word end
            end

            def insert(word)
              node = @root
              word.each_char { |ch| node = (node[ch] ||= {}) }
              node[:end] = true
            end

            def search(word)
              node = walk(word)
              !node.nil? && node.key?(:end)
            end

            def startsWith(prefix)
              !walk(prefix).nil?
            end

            private

            def walk(s)
              node = @root
              s.each_char do |ch|
                node = node[ch]
                return nil if node.nil?
              end
              node
            end
          end
        `,
      },
    };
  })(),

  // ── Design Add and Search Words Data Structure (LC 211) ───────────
  (() => {
    const run = (ops: string[], args: string[][]) => {
      const words: string[] = [];
      const fits = (w: string, p: string) => w.length === p.length && [...p].every((ch, i) => ch === "." || ch === w[i]);
      return ops.map((op, i) => {
        if (op === "addWord") { words.push(args[i][0]); return null; }
        if (op === "search") return words.some((w) => fits(w, args[i][0]));
        return null;
      });
    };
    const ex = [
      { ops: ["WordDictionary", "addWord", "addWord", "addWord", "search", "search", "search", "search"], args: [[], ["bad"], ["dad"], ["mad"], ["pad"], ["bad"], [".ad"], ["b.."]] },
      { ops: ["WordDictionary", "search", "addWord", "addWord", "search", "search", "search"], args: [[], ["."], ["a"], ["ab"], ["."], [".."], ["a.c"]] },
    ];
    return {
      slug: "design-add-and-search-words-data-structure",
      title: "Design Add and Search Words Data Structure",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Depth-First Search", "Trie", "Design", "Meta", "Amazon", "Google"],
      signature: {
        funcName: "WordDictionary", params: [], returns: "void" as const,
        methods: [
          { name: "addWord", params: [{ name: "word", type: "string" as const }], returns: "void" as const },
          { name: "search", params: [{ name: "word", type: "string" as const }], returns: "bool" as const },
        ],
      },
      description: describe(
        "Design a word collection that can answer pattern queries in which a dot matches any single letter. Write the class `WordDictionary`:\n\n- `WordDictionary()` creates an empty collection.\n- `void addWord(String word)` adds `word`.\n- `boolean search(String word)` returns `true` if some added word matches `word`, `false` otherwise. `word` may contain dots `'.'`; a dot matches **any one** letter. A match must have exactly the same length.\n\n" + CALLS,
        [
          exOf(ex[0].ops, ex[0].args, run, "\"pad\" was never added. \".ad\" matches bad, dad and mad; \"b..\" matches bad."),
          exOf(ex[1].ops, ex[1].args, run, "An empty collection matches nothing. \".\" matches the one-letter word \"a\" and \"..\" matches \"ab\"; no three-letter word was added."),
        ],
        ["1 <= word.length <= 25", "word in addWord consists of lowercase English letters", "word in search consists of lowercase letters and '.'", "There are at most 2 dots in word for search queries", "At most 10^4 calls are made to addWord and search"]),
      hints: [
        "Without dots this is exactly a trie lookup.",
        "A dot does not tell you which child to follow — so try all of them.",
        "Search recursively: at position `i` with node `n`, a letter follows one child, a dot tries every existing child; at the end of the pattern, succeed only if `n` marks a word end.",
      ],
      editorial: explain({
        idea: "Store the words in a trie. A pattern lookup walks the trie like a normal search, except that at a dot it branches into every child — a depth-first search that succeeds as soon as one branch reaches a word end exactly at the pattern's end.",
        steps: [
          "`addWord(word)`: insert into the trie, marking the last node as a word end.",
          "`search(word)`: call `dfs(root, 0)`.",
          "`dfs(node, i)`: if `i == word.length` return whether `node` is a word end. If `word[i]` is a letter, recurse into that child if it exists (else fail). If it is a dot, return true if `dfs(child, i + 1)` succeeds for any child.",
        ],
        why: "A word matches the pattern exactly when its trie path agrees with every letter of the pattern and has the same length. The search explores exactly those paths: it follows the forced child for a letter, every child for a dot, and checks the end flag when the pattern runs out, so it finds a match if and only if one was added.",
        time: "O(L) per addWord; O(26^d · L) per search with d dots (d <= 2 here)",
        space: "O(total letters added)",
        pitfalls: [
          "A match must end at a node marked as a word end — \"ba.\" must not match a stored \"bad\" prefix of \"badge\" unless \"bad\" itself was added.",
          "Return early once a branch succeeds; exploring the remaining children is wasted work.",
        ],
      }),
      examples: ex.map((e) => caseOf(e.ops, e.args, run)),
      gen: (rng: Rng) => {
        const abc = pick(rng, ["ab", "abc", "abcdefghijklmnopqrstuvwxyz"]);
        const maxLen = pick(rng, [3, 5, 8]);
        const ops = ["WordDictionary"], args: string[][] = [[]], added: string[] = [];
        for (let m = ri(rng, 1, pick(rng, [4, 15, 40])); m > 0; m--) {
          let s = added.length && rng() < 0.55 ? pick(rng, added) : randLower(rng, 1, maxLen, abc);
          if (rng() < 0.4) { ops.push("addWord"); added.push(s); }
          else {
            const chars = s.split("");
            for (let d = ri(rng, 0, Math.min(2, chars.length)); d > 0; d--) chars[ri(rng, 0, chars.length - 1)] = ".";
            s = chars.join("");
            ops.push("search");
          }
          args.push([s]);
        }
        return caseOf(ops, args, run);
      },
      solutions: {
        python: code`
          class WordDictionary:

              def __init__(self):
                  self.root = {}  # letter -> child node; "$" marks a word end

              def addWord(self, word: str) -> None:
                  node = self.root
                  for ch in word:
                      node = node.setdefault(ch, {})
                  node["$"] = True

              def search(self, word: str) -> bool:
                  def dfs(node, i):
                      if i == len(word):
                          return "$" in node
                      ch = word[i]
                      if ch == ".":
                          return any(dfs(child, i + 1) for key, child in node.items() if key != "$")
                      child = node.get(ch)
                      return child is not None and dfs(child, i + 1)
                  return dfs(self.root, 0)
        `,
        javascript: code`
          var WordDictionary = function() {
              this.root = { children: {}, end: false };
          };

          WordDictionary.prototype.addWord = function(word) {
              var node = this.root;
              for (var i = 0; i < word.length; i++) {
                  var ch = word[i];
                  if (!node.children[ch]) node.children[ch] = { children: {}, end: false };
                  node = node.children[ch];
              }
              node.end = true;
          };

          WordDictionary.prototype.search = function(word) {
              var dfs = function(node, i) {
                  if (i === word.length) return node.end;
                  var ch = word[i];
                  if (ch !== ".") return !!node.children[ch] && dfs(node.children[ch], i + 1);
                  for (var k in node.children) if (dfs(node.children[k], i + 1)) return true;
                  return false;
              };
              return dfs(this.root, 0);
          };
        `,
        typescript: code`
          class WordNode {
              children: { [ch: string]: WordNode };
              end: boolean;

              constructor() {
                  this.children = {};
                  this.end = false;
              }
          }

          class WordDictionary {
              root: WordNode;

              constructor() {
                  this.root = new WordNode();
              }

              addWord(word: string): void {
                  var node = this.root;
                  for (var i = 0; i < word.length; i++) {
                      var ch = word[i];
                      if (!node.children[ch]) node.children[ch] = new WordNode();
                      node = node.children[ch];
                  }
                  node.end = true;
              }

              search(word: string): boolean {
                  var dfs = function(node: WordNode, i: number): boolean {
                      if (i === word.length) return node.end;
                      var ch = word[i];
                      if (ch !== ".") return !!node.children[ch] && dfs(node.children[ch], i + 1);
                      for (var k in node.children) if (dfs(node.children[k], i + 1)) return true;
                      return false;
                  };
                  return dfs(this.root, 0);
              }
          }
        `,
        java: code`
          class WordDictionary {
              private static class Node {
                  Node[] next = new Node[26];
                  boolean end;
              }

              private Node root = new Node();

              public WordDictionary() {
              }

              public void addWord(String word) {
                  Node node = root;
                  for (int i = 0; i < word.length(); i++) {
                      int c = word.charAt(i) - 'a';
                      if (node.next[c] == null) node.next[c] = new Node();
                      node = node.next[c];
                  }
                  node.end = true;
              }

              public boolean search(String word) {
                  return dfs(root, word, 0);
              }

              private boolean dfs(Node node, String word, int i) {
                  if (i == word.length()) return node.end;
                  char ch = word.charAt(i);
                  if (ch != '.') {
                      Node child = node.next[ch - 'a'];
                      return child != null && dfs(child, word, i + 1);
                  }
                  for (Node child : node.next) if (child != null && dfs(child, word, i + 1)) return true;
                  return false;
              }
          }
        `,
        cpp: code`
          class WordDictionary {
              struct Node {
                  Node* next[26] = {};
                  bool end = false;
              };
              Node* root = new Node();

              bool dfs(Node* node, const string& word, size_t i) {
                  if (i == word.size()) return node->end;
                  if (word[i] != '.') {
                      Node* child = node->next[word[i] - 'a'];
                      return child && dfs(child, word, i + 1);
                  }
                  for (Node* child : node->next) if (child && dfs(child, word, i + 1)) return true;
                  return false;
              }
          public:
              WordDictionary() {}

              void addWord(string word) {
                  Node* node = root;
                  for (char ch : word) {
                      int c = ch - 'a';
                      if (!node->next[c]) node->next[c] = new Node();
                      node = node->next[c];
                  }
                  node->end = true;
              }

              bool search(string word) {
                  return dfs(root, word, 0);
              }
          };
        `,
        c: code`
          /* The dictionary is its own trie node type: the root is the object the judge holds. */
          typedef struct WordDictionary {
              struct WordDictionary* next[26];
              bool end;
          } WordDictionary;

          WordDictionary* wordDictionaryCreate() {
              return (WordDictionary*)calloc(1, sizeof(WordDictionary));
          }

          void wordDictionaryAddWord(WordDictionary* obj, char* word) {
              WordDictionary* node = obj;
              for (char* p = word; *p; p++) {
                  int c = *p - 'a';
                  if (node->next[c] == NULL) node->next[c] = wordDictionaryCreate();
                  node = node->next[c];
              }
              node->end = true;
          }

          static bool wdDfs(WordDictionary* node, const char* p) {
              if (*p == '\0') return node->end;
              if (*p != '.') {
                  WordDictionary* child = node->next[*p - 'a'];
                  return child != NULL && wdDfs(child, p + 1);
              }
              for (int c = 0; c < 26; c++)
                  if (node->next[c] != NULL && wdDfs(node->next[c], p + 1)) return true;
              return false;
          }

          bool wordDictionarySearch(WordDictionary* obj, char* word) {
              return wdDfs(obj, word);
          }

          void wordDictionaryFree(WordDictionary* obj) {
              for (int c = 0; c < 26; c++) if (obj->next[c] != NULL) wordDictionaryFree(obj->next[c]);
              free(obj);
          }
        `,
        csharp: code`
          public class WordDictionary {
              private class Node {
                  public Node[] Next = new Node[26];
                  public bool End;
              }

              private Node root = new Node();

              public WordDictionary() {
              }

              public void AddWord(string word) {
                  Node node = root;
                  foreach (char ch in word) {
                      int c = ch - 'a';
                      if (node.Next[c] == null) node.Next[c] = new Node();
                      node = node.Next[c];
                  }
                  node.End = true;
              }

              public bool Search(string word) {
                  return Dfs(root, word, 0);
              }

              private bool Dfs(Node node, string word, int i) {
                  if (i == word.Length) return node.End;
                  if (word[i] != '.') {
                      Node child = node.Next[word[i] - 'a'];
                      return child != null && Dfs(child, word, i + 1);
                  }
                  foreach (Node child in node.Next) if (child != null && Dfs(child, word, i + 1)) return true;
                  return false;
              }
          }
        `,
        go: code`
          type wordNode struct {
          	next [26]*wordNode
          	end  bool
          }

          type WordDictionary struct {
          	root *wordNode
          }

          func Constructor() WordDictionary {
          	return WordDictionary{root: &wordNode{}}
          }

          func (this *WordDictionary) AddWord(word string) {
          	node := this.root
          	for i := 0; i < len(word); i++ {
          		c := word[i] - 'a'
          		if node.next[c] == nil {
          			node.next[c] = &wordNode{}
          		}
          		node = node.next[c]
          	}
          	node.end = true
          }

          func (this *WordDictionary) Search(word string) bool {
          	var dfs func(node *wordNode, i int) bool
          	dfs = func(node *wordNode, i int) bool {
          		if i == len(word) {
          			return node.end
          		}
          		if word[i] != '.' {
          			child := node.next[word[i]-'a']
          			return child != nil && dfs(child, i+1)
          		}
          		for _, child := range node.next {
          			if child != nil && dfs(child, i+1) {
          				return true
          			}
          		}
          		return false
          	}
          	return dfs(this.root, 0)
          }
        `,
        kotlin: code`
          class WordDictionary() {
              private class Node {
                  val next = arrayOfNulls<Node>(26)
                  var end = false
              }

              private val root = Node()

              fun addWord(word: String) {
                  var node = root
                  for (ch in word) {
                      val c = ch - 'a'
                      if (node.next[c] == null) node.next[c] = Node()
                      node = node.next[c]!!
                  }
                  node.end = true
              }

              fun search(word: String): Boolean = dfs(root, word, 0)

              private fun dfs(node: Node, word: String, i: Int): Boolean {
                  if (i == word.length) return node.end
                  if (word[i] != '.') {
                      val child = node.next[word[i] - 'a'] ?: return false
                      return dfs(child, word, i + 1)
                  }
                  for (child in node.next) if (child != null && dfs(child, word, i + 1)) return true
                  return false
              }
          }
        `,
        swift: code`
          final class WordNode {
              var next = [WordNode?](repeating: nil, count: 26)
              var end = false
          }

          class WordDictionary {
              let root = WordNode()

              init() {}

              func addWord(_ word: String) {
                  var node = root
                  for b in word.utf8 {
                      let c = Int(b) - 97
                      if node.next[c] == nil { node.next[c] = WordNode() }
                      node = node.next[c]!
                  }
                  node.end = true
              }

              func search(_ word: String) -> Bool {
                  return dfs(root, Array(word.utf8), 0)
              }

              private func dfs(_ node: WordNode, _ w: [UInt8], _ i: Int) -> Bool {
                  if i == w.count { return node.end }
                  if w[i] != 46 { // not a dot
                      guard let child = node.next[Int(w[i]) - 97] else { return false }
                      return dfs(child, w, i + 1)
                  }
                  for case let child? in node.next where dfs(child, w, i + 1) { return true }
                  return false
              }
          }
        `,
        rust: code`
          // Nodes live in vectors; node 0 is the root, and a child index of 0 means "no child".
          struct WordDictionary {
              next: Vec<[usize; 26]>,
              end: Vec<bool>,
          }

          impl WordDictionary {
              fn new() -> Self { WordDictionary { next: vec![[0; 26]], end: vec![false] } }

              fn addWord(&mut self, word: String) {
                  let mut node = 0;
                  for b in word.bytes() {
                      let c = (b - b'a') as usize;
                      if self.next[node][c] == 0 {
                          self.next.push([0; 26]);
                          self.end.push(false);
                          self.next[node][c] = self.next.len() - 1;
                      }
                      node = self.next[node][c];
                  }
                  self.end[node] = true;
              }

              fn dfs(&self, w: &[u8], i: usize, node: usize) -> bool {
                  if i == w.len() { return self.end[node]; }
                  if w[i] != b'.' {
                      let child = self.next[node][(w[i] - b'a') as usize];
                      return child != 0 && self.dfs(w, i + 1, child);
                  }
                  self.next[node].iter().any(|&child| child != 0 && self.dfs(w, i + 1, child))
              }

              fn search(&mut self, word: String) -> bool {
                  self.dfs(word.as_bytes(), 0, 0)
              }
          }
        `,
        php: code`
          class WordDictionary {
              // Nodes are numbered; $next[$n] maps a letter to a child number.
              private $next = [[]];
              private $end = [false];

              function __construct() {
              }

              function addWord($word) {
                  $node = 0;
                  for ($i = 0; $i < strlen($word); $i++) {
                      $ch = $word[$i];
                      if (!isset($this->next[$node][$ch])) {
                          $this->next[] = [];
                          $this->end[] = false;
                          $this->next[$node][$ch] = count($this->next) - 1;
                      }
                      $node = $this->next[$node][$ch];
                  }
                  $this->end[$node] = true;
              }

              function search($word) {
                  return $this->dfs($word, 0, 0);
              }

              private function dfs($word, $i, $node) {
                  if ($i == strlen($word)) return $this->end[$node];
                  $ch = $word[$i];
                  if ($ch !== '.') {
                      return isset($this->next[$node][$ch]) && $this->dfs($word, $i + 1, $this->next[$node][$ch]);
                  }
                  foreach ($this->next[$node] as $child) if ($this->dfs($word, $i + 1, $child)) return true;
                  return false;
              }
          }
        `,
        ruby: code`
          class WordDictionary
            def initialize
              @root = {} # letter => child node; :end marks a word end
            end

            def addWord(word)
              node = @root
              word.each_char { |ch| node = (node[ch] ||= {}) }
              node[:end] = true
            end

            def search(word)
              dfs(@root, word, 0)
            end

            private

            def dfs(node, word, i)
              return node.key?(:end) if i == word.length
              ch = word[i]
              if ch != "."
                child = node[ch]
                return !child.nil? && dfs(child, word, i + 1)
              end
              node.any? { |key, child| key != :end && dfs(child, word, i + 1) }
            end
          end
        `,
      },
    };
  })(),

  // ── Range Sum Query 2D - Immutable (LC 304) ───────────────────────
  (() => {
    const run = (ops: string[], args: Array<Array<number | number[][]>>) => {
      let mat: number[][] = [];
      return ops.map((op, i) => {
        if (op === "NumMatrix") { mat = args[i][0] as number[][]; return null; }
        const [r1, c1, r2, c2] = args[i] as number[];
        let s = 0;
        for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) s += mat[r][c];
        return s;
      });
    };
    const input = (matrix: number[][], qs: number[][]) => ({ ops: ["NumMatrix", ...qs.map(() => "sumRegion")], args: [[matrix], ...qs] as Array<Array<number | number[][]>> });
    const ex = [
      input([[3, 0, 1, 4, 2], [5, 6, 3, 2, 1], [1, 2, 0, 1, 5], [4, 1, 0, 1, 7], [1, 0, 3, 0, 5]], [[2, 1, 4, 3], [1, 1, 2, 2], [1, 2, 2, 4]]),
      input([[-4, 7], [2, -9]], [[0, 0, 1, 1], [1, 0, 1, 0], [0, 1, 1, 1]]),
    ];
    return {
      slug: "range-sum-query-2d-immutable",
      title: "Range Sum Query 2D - Immutable",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Matrix", "Prefix Sum", "Design", "Amazon", "Google", "Meta"],
      signature: {
        funcName: "NumMatrix", params: [{ name: "matrix", type: "int[][]" as const }], returns: "void" as const,
        methods: [{
          name: "sumRegion",
          params: [{ name: "row1", type: "int" as const }, { name: "col1", type: "int" as const }, { name: "row2", type: "int" as const }, { name: "col2", type: "int" as const }],
          returns: "int" as const,
        }],
      },
      description: describe(
        "Given a 2D integer `matrix` that never changes, answer many queries asking for the sum of the elements inside a rectangle. Write the class `NumMatrix`:\n\n- `NumMatrix(int[][] matrix)` initialises the object with `matrix`.\n- `int sumRegion(int row1, int col1, int row2, int col2)` returns the sum of the elements in the rectangle whose upper-left corner is `(row1, col1)` and lower-right corner is `(row2, col2)`, both included.\n\nEach `sumRegion` call must take `O(1)` time.\n\n" + CALLS,
        [
          { ...exOf(ex[0].ops, ex[0].args, run, "Rows 2–4 × columns 1–3 hold 2+0+1 + 1+0+1 + 0+3+0 = 8. The 2×2 block at rows 1–2, columns 1–2 is 6+3+2+0 = 11; rows 1–2, columns 2–4 sum to 12.") },
          { ...exOf(ex[1].ops, ex[1].args, run, "The whole matrix sums to -4; the single cell (1, 0) is 2; the right column is 7 + (-9) = -2.") },
        ],
        ["m == matrix.length, n == matrix[i].length", "1 <= m, n <= 200", "-10^4 <= matrix[i][j] <= 10^4", "0 <= row1 <= row2 < m", "0 <= col1 <= col2 < n", "At most 10^4 calls are made to sumRegion"]),
      hints: [
        "In one dimension, a prefix sum array answers any range sum with one subtraction. Generalise the prefix to a rectangle anchored at the top-left corner.",
        "Let `P[r][c]` be the sum of all cells above and to the left of `(r, c)` (exclusive). Build it with `P[r+1][c+1] = matrix[r][c] + P[r][c+1] + P[r+1][c] - P[r][c]`.",
        "A query is inclusion–exclusion: `P[row2+1][col2+1] - P[row1][col2+1] - P[row2+1][col1] + P[row1][col1]`.",
      ],
      editorial: explain({
        idea: "Precompute 2D prefix sums: `P[r][c]` is the sum of the rectangle from `(0, 0)` to `(r - 1, c - 1)`. Any rectangle is then one big corner rectangle minus two strips plus the corner that was subtracted twice.",
        steps: [
          "Allocate `P` of size `(m + 1) × (n + 1)` filled with 0 (row 0 and column 0 are empty prefixes).",
          "For every cell: `P[r+1][c+1] = matrix[r][c] + P[r][c+1] + P[r+1][c] - P[r][c]`.",
          "`sumRegion(r1, c1, r2, c2)` returns `P[r2+1][c2+1] - P[r1][c2+1] - P[r2+1][c1] + P[r1][c1]`.",
        ],
        why: "`P[r2+1][c2+1]` covers everything up to the bottom-right corner. Subtracting `P[r1][c2+1]` removes the rows above the rectangle and `P[r2+1][c1]` the columns to its left; the top-left block lies in both and was removed twice, so it is added back once. What remains is exactly the query rectangle. The same identity, read the other way, is the build formula.",
        time: "O(m · n) to build, O(1) per query",
        space: "O(m · n)",
        pitfalls: [
          "The extra zero row and column remove every special case for `row1 = 0` or `col1 = 0`.",
          "Forgetting to add back `P[r1][c1]` subtracts the top-left block twice.",
          "Prefix sums reach at most 4 · 10^8 in absolute value under the constraints, so 32-bit integers suffice.",
        ],
      }),
      examples: ex.map((e) => caseOf(e.ops, e.args, run)),
      gen: (rng: Rng) => {
        const m = ri(rng, 1, pick(rng, [1, 4, 8])), n = ri(rng, 1, pick(rng, [1, 4, 8]));
        const top = pick(rng, [9, 10000]);
        const matrix = Array.from({ length: m }, () => Array.from({ length: n }, () => (rng() < 0.05 ? pick(rng, [-10000, 10000]) : ri(rng, -top, top))));
        const qs = Array.from({ length: ri(rng, 1, pick(rng, [1, 5, 20, 39])) }, () => {
          const r1 = ri(rng, 0, m - 1), c1 = ri(rng, 0, n - 1);
          return [r1, c1, ri(rng, r1, m - 1), ri(rng, c1, n - 1)];
        });
        const { ops, args } = input(matrix, qs);
        return caseOf(ops, args, run);
      },
      solutions: {
        python: code`
          from typing import List

          class NumMatrix:

              def __init__(self, matrix: List[List[int]]):
                  m, n = len(matrix), len(matrix[0])
                  self.p = [[0] * (n + 1) for _ in range(m + 1)]
                  for r in range(m):
                      for c in range(n):
                          self.p[r + 1][c + 1] = matrix[r][c] + self.p[r][c + 1] + self.p[r + 1][c] - self.p[r][c]

              def sumRegion(self, row1: int, col1: int, row2: int, col2: int) -> int:
                  p = self.p
                  return p[row2 + 1][col2 + 1] - p[row1][col2 + 1] - p[row2 + 1][col1] + p[row1][col1]
        `,
        javascript: code`
          var NumMatrix = function(matrix) {
              var m = matrix.length, n = matrix[0].length;
              this.p = [];
              for (var r = 0; r <= m; r++) {
                  this.p.push([]);
                  for (var c = 0; c <= n; c++) this.p[r].push(0);
              }
              for (var r2 = 0; r2 < m; r2++)
                  for (var c2 = 0; c2 < n; c2++)
                      this.p[r2 + 1][c2 + 1] = matrix[r2][c2] + this.p[r2][c2 + 1] + this.p[r2 + 1][c2] - this.p[r2][c2];
          };

          NumMatrix.prototype.sumRegion = function(row1, col1, row2, col2) {
              var p = this.p;
              return p[row2 + 1][col2 + 1] - p[row1][col2 + 1] - p[row2 + 1][col1] + p[row1][col1];
          };
        `,
        typescript: code`
          class NumMatrix {
              p: number[][];

              constructor(matrix: number[][]) {
                  var m = matrix.length, n = matrix[0].length;
                  this.p = [];
                  for (var r = 0; r <= m; r++) {
                      this.p.push([]);
                      for (var c = 0; c <= n; c++) this.p[r].push(0);
                  }
                  for (var r2 = 0; r2 < m; r2++)
                      for (var c2 = 0; c2 < n; c2++)
                          this.p[r2 + 1][c2 + 1] = matrix[r2][c2] + this.p[r2][c2 + 1] + this.p[r2 + 1][c2] - this.p[r2][c2];
              }

              sumRegion(row1: number, col1: number, row2: number, col2: number): number {
                  var p = this.p;
                  return p[row2 + 1][col2 + 1] - p[row1][col2 + 1] - p[row2 + 1][col1] + p[row1][col1];
              }
          }
        `,
        java: code`
          class NumMatrix {
              private int[][] p;

              public NumMatrix(int[][] matrix) {
                  int m = matrix.length, n = matrix[0].length;
                  p = new int[m + 1][n + 1];
                  for (int r = 0; r < m; r++)
                      for (int c = 0; c < n; c++)
                          p[r + 1][c + 1] = matrix[r][c] + p[r][c + 1] + p[r + 1][c] - p[r][c];
              }

              public int sumRegion(int row1, int col1, int row2, int col2) {
                  return p[row2 + 1][col2 + 1] - p[row1][col2 + 1] - p[row2 + 1][col1] + p[row1][col1];
              }
          }
        `,
        cpp: code`
          class NumMatrix {
              vector<vector<int>> p;
          public:
              NumMatrix(vector<vector<int>>& matrix) {
                  int m = matrix.size(), n = matrix[0].size();
                  p.assign(m + 1, vector<int>(n + 1, 0));
                  for (int r = 0; r < m; r++)
                      for (int c = 0; c < n; c++)
                          p[r + 1][c + 1] = matrix[r][c] + p[r][c + 1] + p[r + 1][c] - p[r][c];
              }

              int sumRegion(int row1, int col1, int row2, int col2) {
                  return p[row2 + 1][col2 + 1] - p[row1][col2 + 1] - p[row2 + 1][col1] + p[row1][col1];
              }
          };
        `,
        c: code`
          typedef struct {
              int w;  /* row width of p: n + 1 */
              int* p; /* (m + 1) x (n + 1) prefix sums, row by row */
          } NumMatrix;

          NumMatrix* numMatrixCreate(int** matrix, int matrixSize, int* matrixColSize) {
              int m = matrixSize, n = matrixColSize[0], w = n + 1;
              NumMatrix* o = (NumMatrix*)malloc(sizeof(NumMatrix));
              o->w = w;
              o->p = (int*)calloc((m + 1) * w, sizeof(int));
              for (int r = 0; r < m; r++)
                  for (int c = 0; c < n; c++)
                      o->p[(r + 1) * w + c + 1] = matrix[r][c] + o->p[r * w + c + 1] + o->p[(r + 1) * w + c] - o->p[r * w + c];
              return o;
          }

          int numMatrixSumRegion(NumMatrix* obj, int row1, int col1, int row2, int col2) {
              int w = obj->w;
              int* p = obj->p;
              return p[(row2 + 1) * w + col2 + 1] - p[row1 * w + col2 + 1] - p[(row2 + 1) * w + col1] + p[row1 * w + col1];
          }

          void numMatrixFree(NumMatrix* obj) {
              free(obj->p);
              free(obj);
          }
        `,
        csharp: code`
          public class NumMatrix {
              private int[,] p;

              public NumMatrix(int[][] matrix) {
                  int m = matrix.Length, n = matrix[0].Length;
                  p = new int[m + 1, n + 1];
                  for (int r = 0; r < m; r++)
                      for (int c = 0; c < n; c++)
                          p[r + 1, c + 1] = matrix[r][c] + p[r, c + 1] + p[r + 1, c] - p[r, c];
              }

              public int SumRegion(int row1, int col1, int row2, int col2) {
                  return p[row2 + 1, col2 + 1] - p[row1, col2 + 1] - p[row2 + 1, col1] + p[row1, col1];
              }
          }
        `,
        go: code`
          type NumMatrix struct {
          	p [][]int
          }

          func Constructor(matrix [][]int) NumMatrix {
          	m, n := len(matrix), len(matrix[0])
          	p := make([][]int, m+1)
          	for r := range p {
          		p[r] = make([]int, n+1)
          	}
          	for r := 0; r < m; r++ {
          		for c := 0; c < n; c++ {
          			p[r+1][c+1] = matrix[r][c] + p[r][c+1] + p[r+1][c] - p[r][c]
          		}
          	}
          	return NumMatrix{p: p}
          }

          func (this *NumMatrix) SumRegion(row1 int, col1 int, row2 int, col2 int) int {
          	p := this.p
          	return p[row2+1][col2+1] - p[row1][col2+1] - p[row2+1][col1] + p[row1][col1]
          }
        `,
        kotlin: code`
          class NumMatrix(matrix: Array<IntArray>) {
              private val p = Array(matrix.size + 1) { IntArray(matrix[0].size + 1) }

              init {
                  for (r in matrix.indices)
                      for (c in matrix[0].indices)
                          p[r + 1][c + 1] = matrix[r][c] + p[r][c + 1] + p[r + 1][c] - p[r][c]
              }

              fun sumRegion(row1: Int, col1: Int, row2: Int, col2: Int): Int =
                  p[row2 + 1][col2 + 1] - p[row1][col2 + 1] - p[row2 + 1][col1] + p[row1][col1]
          }
        `,
        swift: code`
          class NumMatrix {
              var p: [[Int]]

              init(_ matrix: [[Int]]) {
                  let m = matrix.count, n = matrix[0].count
                  p = [[Int]](repeating: [Int](repeating: 0, count: n + 1), count: m + 1)
                  for r in 0..<m {
                      for c in 0..<n {
                          p[r + 1][c + 1] = matrix[r][c] + p[r][c + 1] + p[r + 1][c] - p[r][c]
                      }
                  }
              }

              func sumRegion(_ row1: Int, _ col1: Int, _ row2: Int, _ col2: Int) -> Int {
                  return p[row2 + 1][col2 + 1] - p[row1][col2 + 1] - p[row2 + 1][col1] + p[row1][col1]
              }
          }
        `,
        rust: code`
          struct NumMatrix {
              p: Vec<Vec<i32>>,
          }

          impl NumMatrix {
              fn new(matrix: Vec<Vec<i32>>) -> Self {
                  let (m, n) = (matrix.len(), matrix[0].len());
                  let mut p = vec![vec![0; n + 1]; m + 1];
                  for r in 0..m {
                      for c in 0..n {
                          p[r + 1][c + 1] = matrix[r][c] + p[r][c + 1] + p[r + 1][c] - p[r][c];
                      }
                  }
                  NumMatrix { p }
              }

              fn sumRegion(&mut self, row1: i32, col1: i32, row2: i32, col2: i32) -> i32 {
                  let (r1, c1, r2, c2) = (row1 as usize, col1 as usize, row2 as usize + 1, col2 as usize + 1);
                  self.p[r2][c2] - self.p[r1][c2] - self.p[r2][c1] + self.p[r1][c1]
              }
          }
        `,
        php: code`
          class NumMatrix {
              private $p;

              function __construct($matrix) {
                  $m = count($matrix);
                  $n = count($matrix[0]);
                  $this->p = array_fill(0, $m + 1, array_fill(0, $n + 1, 0));
                  for ($r = 0; $r < $m; $r++)
                      for ($c = 0; $c < $n; $c++)
                          $this->p[$r + 1][$c + 1] = $matrix[$r][$c] + $this->p[$r][$c + 1] + $this->p[$r + 1][$c] - $this->p[$r][$c];
              }

              function sumRegion($row1, $col1, $row2, $col2) {
                  $p = $this->p;
                  return $p[$row2 + 1][$col2 + 1] - $p[$row1][$col2 + 1] - $p[$row2 + 1][$col1] + $p[$row1][$col1];
              }
          }
        `,
        ruby: code`
          class NumMatrix
            def initialize(matrix)
              m = matrix.length
              n = matrix[0].length
              @p = Array.new(m + 1) { Array.new(n + 1, 0) }
              m.times do |r|
                n.times do |c|
                  @p[r + 1][c + 1] = matrix[r][c] + @p[r][c + 1] + @p[r + 1][c] - @p[r][c]
                end
              end
            end

            def sumRegion(row1, col1, row2, col2)
              @p[row2 + 1][col2 + 1] - @p[row1][col2 + 1] - @p[row2 + 1][col1] + @p[row1][col1]
            end
          end
        `,
      },
    };
  })(),

  // ── Range Sum Query - Mutable (LC 307) ────────────────────────────
  (() => {
    const run = (ops: string[], args: Array<Array<number | number[]>>) => {
      let a: number[] = [];
      return ops.map((op, i) => {
        if (op === "NumArray") { a = (args[i][0] as number[]).slice(); return null; }
        const [x, y] = args[i] as number[];
        if (op === "update") { a[x] = y; return null; }
        return a.slice(x, y + 1).reduce((s, v) => s + v, 0);
      });
    };
    const ex: Array<{ ops: string[]; args: Array<Array<number | number[]>> }> = [
      { ops: ["NumArray", "sumRange", "update", "sumRange", "sumRange"], args: [[[1, 3, 5]], [0, 2], [1, 2], [0, 2], [1, 1]] },
      { ops: ["NumArray", "sumRange", "update", "update", "sumRange", "sumRange"], args: [[[-2, 0, 3, -5, 2]], [1, 3], [3, 4], [0, 100], [0, 4], [2, 3]] },
    ];
    return {
      slug: "range-sum-query-mutable",
      title: "Range Sum Query - Mutable",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Binary Indexed Tree", "Segment Tree", "Design", "Google", "Amazon", "Meta"],
      signature: {
        funcName: "NumArray", params: [{ name: "nums", type: "int[]" as const }], returns: "void" as const,
        methods: [
          { name: "update", params: [{ name: "index", type: "int" as const }, { name: "value", type: "int" as const }], returns: "void" as const },
          { name: "sumRange", params: [{ name: "left", type: "int" as const }, { name: "right", type: "int" as const }], returns: "int" as const },
        ],
      },
      description: describe(
        "Given an integer array `nums`, support two kinds of operation, mixed in any order: changing one element, and asking for the sum of a range. Write the class `NumArray`:\n\n- `NumArray(int[] nums)` initialises the object with `nums`.\n- `void update(int index, int value)` sets `nums[index]` to `value`.\n- `int sumRange(int left, int right)` returns `nums[left] + nums[left + 1] + … + nums[right]`.\n\n" + CALLS,
        [
          exOf(ex[0].ops, ex[0].args, run, "Initially 1 + 3 + 5 = 9. After `nums[1]` becomes 2 the array is [1,2,5]: the whole sum is 8 and the range [1,1] is 2."),
          exOf(ex[1].ops, ex[1].args, run, "0 + 3 + (-5) = -2. After the updates the array is [100,0,3,4,2]: it sums to 109, and indices 2–3 to 7."),
        ],
        ["1 <= nums.length <= 3 * 10^4", "-100 <= nums[i], value <= 100", "0 <= index < nums.length", "0 <= left <= right < nums.length", "At most 3 * 10^4 calls are made to update and sumRange"]),
      hints: [
        "A plain prefix-sum array answers a query in O(1) but an update forces O(n) prefixes to change; a plain array is the other way round. You need both in O(log n).",
        "A Fenwick tree (binary indexed tree) stores partial sums over ranges whose lengths are powers of two, chosen by the lowest set bit of the index.",
        "Keep the current array too: `update` adds the difference `value - nums[index]` along `i += i & -i`, and a prefix sum adds `tree[i]` along `i -= i & -i`. Then `sumRange(l, r) = prefix(r + 1) - prefix(l)`.",
      ],
      editorial: explain({
        idea: "A Fenwick tree keeps, at 1-based position `i`, the sum of the `i & -i` elements ending at `i`. Every prefix splits into O(log n) such blocks, and every element lies in O(log n) of them, so both a point update and a prefix sum take O(log n).",
        steps: [
          "Keep a copy of `nums` and a tree array of size `n + 1`, all zero; add every `nums[i]` at position `i + 1`.",
          "`add(i, delta)`: while `i <= n`, `tree[i] += delta` and `i += i & -i`.",
          "`prefix(i)` (sum of the first `i` elements): while `i > 0`, add `tree[i]` and `i -= i & -i`.",
          "`update(index, value)`: `add(index + 1, value - nums[index])`, then store `nums[index] = value`.",
          "`sumRange(left, right)` returns `prefix(right + 1) - prefix(left)`.",
        ],
        why: "Stripping the lowest set bit from `i` repeatedly walks through disjoint blocks that together cover exactly positions `1..i`, so `prefix` adds each element once. Adding the lowest set bit walks upward through exactly the blocks that contain position `i`, so `add` changes every stored sum that includes that element and no other.",
        time: "O(n log n) to build, O(log n) per update and query",
        space: "O(n)",
        pitfalls: [
          "`update` sets a value; the tree needs the difference from the old value, so keep the array.",
          "The tree is 1-based; position 0 would loop forever (`0 & -0 = 0`).",
          "A segment tree solves it equally well — the Fenwick tree is just shorter.",
        ],
      }),
      examples: ex.map((e) => caseOf(e.ops, e.args, run)),
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 5, 15, 40]));
        const v = () => (rng() < 0.1 ? pick(rng, [-100, 100]) : ri(rng, -100, 100));
        const nums = Array.from({ length: n }, v);
        const ops = ["NumArray"], args: Array<Array<number | number[]>> = [[nums]];
        for (let m = ri(rng, 1, pick(rng, [3, 15, 39])); m > 0; m--) {
          if (rng() < 0.45) { ops.push("update"); args.push([ri(rng, 0, n - 1), v()]); }
          else { const l = ri(rng, 0, n - 1); ops.push("sumRange"); args.push([l, ri(rng, l, n - 1)]); }
        }
        return caseOf(ops, args, run);
      },
      solutions: {
        python: code`
          from typing import List

          class NumArray:

              def __init__(self, nums: List[int]):
                  self.n = len(nums)
                  self.nums = [0] * self.n
                  self.tree = [0] * (self.n + 1)
                  for i, x in enumerate(nums):
                      self.update(i, x)

              def _add(self, i: int, delta: int) -> None:
                  while i <= self.n:
                      self.tree[i] += delta
                      i += i & -i

              def _prefix(self, i: int) -> int:
                  s = 0
                  while i > 0:
                      s += self.tree[i]
                      i -= i & -i
                  return s

              def update(self, index: int, value: int) -> None:
                  self._add(index + 1, value - self.nums[index])
                  self.nums[index] = value

              def sumRange(self, left: int, right: int) -> int:
                  return self._prefix(right + 1) - self._prefix(left)
        `,
        javascript: code`
          var NumArray = function(nums) {
              this.n = nums.length;
              this.nums = [];
              this.tree = [0];
              for (var i = 0; i < this.n; i++) { this.nums.push(0); this.tree.push(0); }
              for (var j = 0; j < this.n; j++) this.update(j, nums[j]);
          };

          NumArray.prototype.add = function(i, delta) {
              for (; i <= this.n; i += i & -i) this.tree[i] += delta;
          };

          NumArray.prototype.prefix = function(i) {
              var s = 0;
              for (; i > 0; i -= i & -i) s += this.tree[i];
              return s;
          };

          NumArray.prototype.update = function(index, value) {
              this.add(index + 1, value - this.nums[index]);
              this.nums[index] = value;
          };

          NumArray.prototype.sumRange = function(left, right) {
              return this.prefix(right + 1) - this.prefix(left);
          };
        `,
        typescript: code`
          class NumArray {
              n: number;
              nums: number[];
              tree: number[];

              constructor(nums: number[]) {
                  this.n = nums.length;
                  this.nums = [];
                  this.tree = [0];
                  for (var i = 0; i < this.n; i++) { this.nums.push(0); this.tree.push(0); }
                  for (var j = 0; j < this.n; j++) this.update(j, nums[j]);
              }

              add(i: number, delta: number): void {
                  for (; i <= this.n; i += i & -i) this.tree[i] += delta;
              }

              prefix(i: number): number {
                  var s = 0;
                  for (; i > 0; i -= i & -i) s += this.tree[i];
                  return s;
              }

              update(index: number, value: number): void {
                  this.add(index + 1, value - this.nums[index]);
                  this.nums[index] = value;
              }

              sumRange(left: number, right: number): number {
                  return this.prefix(right + 1) - this.prefix(left);
              }
          }
        `,
        java: code`
          class NumArray {
              private int n;
              private int[] nums, tree;

              public NumArray(int[] nums) {
                  n = nums.length;
                  this.nums = new int[n];
                  tree = new int[n + 1];
                  for (int i = 0; i < n; i++) update(i, nums[i]);
              }

              private void add(int i, int delta) {
                  for (; i <= n; i += i & -i) tree[i] += delta;
              }

              private int prefix(int i) {
                  int s = 0;
                  for (; i > 0; i -= i & -i) s += tree[i];
                  return s;
              }

              public void update(int index, int value) {
                  add(index + 1, value - nums[index]);
                  nums[index] = value;
              }

              public int sumRange(int left, int right) {
                  return prefix(right + 1) - prefix(left);
              }
          }
        `,
        cpp: code`
          class NumArray {
              int n;
              vector<int> a, tree;

              void add(int i, int delta) {
                  for (; i <= n; i += i & -i) tree[i] += delta;
              }

              int prefix(int i) {
                  int s = 0;
                  for (; i > 0; i -= i & -i) s += tree[i];
                  return s;
              }
          public:
              NumArray(vector<int>& nums) : n(nums.size()), a(nums.size(), 0), tree(nums.size() + 1, 0) {
                  for (int i = 0; i < n; i++) update(i, nums[i]);
              }

              void update(int index, int value) {
                  add(index + 1, value - a[index]);
                  a[index] = value;
              }

              int sumRange(int left, int right) {
                  return prefix(right + 1) - prefix(left);
              }
          };
        `,
        c: code`
          typedef struct {
              int n;
              int* a;    /* the current values */
              int* tree; /* Fenwick tree, 1-based */
          } NumArray;

          static void naAdd(NumArray* o, int i, int delta) {
              for (; i <= o->n; i += i & -i) o->tree[i] += delta;
          }

          static int naPrefix(NumArray* o, int i) {
              int s = 0;
              for (; i > 0; i -= i & -i) s += o->tree[i];
              return s;
          }

          void numArrayUpdate(NumArray* obj, int index, int value) {
              naAdd(obj, index + 1, value - obj->a[index]);
              obj->a[index] = value;
          }

          NumArray* numArrayCreate(int* nums, int numsSize) {
              NumArray* o = (NumArray*)malloc(sizeof(NumArray));
              o->n = numsSize;
              o->a = (int*)calloc(numsSize, sizeof(int));
              o->tree = (int*)calloc(numsSize + 1, sizeof(int));
              for (int i = 0; i < numsSize; i++) numArrayUpdate(o, i, nums[i]);
              return o;
          }

          int numArraySumRange(NumArray* obj, int left, int right) {
              return naPrefix(obj, right + 1) - naPrefix(obj, left);
          }

          void numArrayFree(NumArray* obj) {
              free(obj->a);
              free(obj->tree);
              free(obj);
          }
        `,
        csharp: code`
          public class NumArray {
              private int n;
              private int[] a, tree;

              public NumArray(int[] nums) {
                  n = nums.Length;
                  a = new int[n];
                  tree = new int[n + 1];
                  for (int i = 0; i < n; i++) Update(i, nums[i]);
              }

              private void Add(int i, int delta) {
                  for (; i <= n; i += i & -i) tree[i] += delta;
              }

              private int Prefix(int i) {
                  int s = 0;
                  for (; i > 0; i -= i & -i) s += tree[i];
                  return s;
              }

              public void Update(int index, int value) {
                  Add(index + 1, value - a[index]);
                  a[index] = value;
              }

              public int SumRange(int left, int right) {
                  return Prefix(right + 1) - Prefix(left);
              }
          }
        `,
        go: code`
          type NumArray struct {
          	a, tree []int
          }

          func Constructor(nums []int) NumArray {
          	o := NumArray{a: make([]int, len(nums)), tree: make([]int, len(nums)+1)}
          	for i, x := range nums {
          		o.Update(i, x)
          	}
          	return o
          }

          func (this *NumArray) add(i, delta int) {
          	for ; i < len(this.tree); i += i & -i {
          		this.tree[i] += delta
          	}
          }

          func (this *NumArray) prefix(i int) int {
          	s := 0
          	for ; i > 0; i -= i & -i {
          		s += this.tree[i]
          	}
          	return s
          }

          func (this *NumArray) Update(index int, value int) {
          	this.add(index+1, value-this.a[index])
          	this.a[index] = value
          }

          func (this *NumArray) SumRange(left int, right int) int {
          	return this.prefix(right+1) - this.prefix(left)
          }
        `,
        kotlin: code`
          class NumArray(nums: IntArray) {
              private val n = nums.size
              private val a = IntArray(n)
              private val tree = IntArray(n + 1)

              init {
                  for (i in 0 until n) update(i, nums[i])
              }

              private fun add(start: Int, delta: Int) {
                  var i = start
                  while (i <= n) { tree[i] += delta; i += i and -i }
              }

              private fun prefix(end: Int): Int {
                  var i = end
                  var s = 0
                  while (i > 0) { s += tree[i]; i -= i and -i }
                  return s
              }

              fun update(index: Int, value: Int) {
                  add(index + 1, value - a[index])
                  a[index] = value
              }

              fun sumRange(left: Int, right: Int): Int = prefix(right + 1) - prefix(left)
          }
        `,
        swift: code`
          class NumArray {
              var a: [Int]
              var tree: [Int]

              init(_ nums: [Int]) {
                  a = [Int](repeating: 0, count: nums.count)
                  tree = [Int](repeating: 0, count: nums.count + 1)
                  for (i, x) in nums.enumerated() { update(i, x) }
              }

              private func add(_ start: Int, _ delta: Int) {
                  var i = start
                  while i < tree.count { tree[i] += delta; i += i & -i }
              }

              private func prefix(_ end: Int) -> Int {
                  var i = end, s = 0
                  while i > 0 { s += tree[i]; i -= i & -i }
                  return s
              }

              func update(_ index: Int, _ value: Int) {
                  add(index + 1, value - a[index])
                  a[index] = value
              }

              func sumRange(_ left: Int, _ right: Int) -> Int {
                  return prefix(right + 1) - prefix(left)
              }
          }
        `,
        rust: code`
          struct NumArray {
              a: Vec<i32>,
              tree: Vec<i32>, // Fenwick tree, 1-based
          }

          impl NumArray {
              fn new(nums: Vec<i32>) -> Self {
                  let mut o = NumArray { a: vec![0; nums.len()], tree: vec![0; nums.len() + 1] };
                  for (i, &x) in nums.iter().enumerate() { o.update(i as i32, x); }
                  o
              }

              fn add(&mut self, start: usize, delta: i32) {
                  let mut i = start as i64;
                  while (i as usize) < self.tree.len() { self.tree[i as usize] += delta; i += i & -i; }
              }

              fn prefix(&self, end: usize) -> i32 {
                  let (mut i, mut s) = (end as i64, 0);
                  while i > 0 { s += self.tree[i as usize]; i -= i & -i; }
                  s
              }

              fn update(&mut self, index: i32, value: i32) {
                  let k = index as usize;
                  let delta = value - self.a[k];
                  self.add(k + 1, delta);
                  self.a[k] = value;
              }

              fn sumRange(&mut self, left: i32, right: i32) -> i32 {
                  self.prefix(right as usize + 1) - self.prefix(left as usize)
              }
          }
        `,
        php: code`
          class NumArray {
              private $n;
              private $a;
              private $tree;

              function __construct($nums) {
                  $this->n = count($nums);
                  $this->a = array_fill(0, $this->n, 0);
                  $this->tree = array_fill(0, $this->n + 1, 0);
                  foreach ($nums as $i => $x) $this->update($i, $x);
              }

              private function add($i, $delta) {
                  for (; $i <= $this->n; $i += $i & -$i) $this->tree[$i] += $delta;
              }

              private function prefix($i) {
                  $s = 0;
                  for (; $i > 0; $i -= $i & -$i) $s += $this->tree[$i];
                  return $s;
              }

              function update($index, $value) {
                  $this->add($index + 1, $value - $this->a[$index]);
                  $this->a[$index] = $value;
              }

              function sumRange($left, $right) {
                  return $this->prefix($right + 1) - $this->prefix($left);
              }
          }
        `,
        ruby: code`
          class NumArray
            def initialize(nums)
              @n = nums.length
              @a = Array.new(@n, 0)
              @tree = Array.new(@n + 1, 0)
              nums.each_with_index { |x, i| update(i, x) }
            end

            def update(index, value)
              add(index + 1, value - @a[index])
              @a[index] = value
            end

            def sumRange(left, right)
              prefix(right + 1) - prefix(left)
            end

            private

            def add(i, delta)
              while i <= @n
                @tree[i] += delta
                i += i & -i
              end
            end

            def prefix(i)
              s = 0
              while i > 0
                s += @tree[i]
                i -= i & -i
              end
              s
            end
          end
        `,
      },
    };
  })(),

  // ── Implement Magic Dictionary (LC 676) ───────────────────────────
  (() => {
    const run = (ops: string[], args: Array<Array<string | string[]>>) => {
      let dict: string[] = [];
      return ops.map((op, i) => {
        if (op === "buildDict") { dict = args[i][0] as string[]; return null; }
        if (op !== "search") return null;
        const s = args[i][0] as string;
        return dict.some((w) => w.length === s.length && [...w].filter((ch, k) => ch !== s[k]).length === 1);
      });
    };
    const ex: Array<{ ops: string[]; args: Array<Array<string | string[]>> }> = [
      { ops: ["MagicDictionary", "buildDict", "search", "search", "search", "search"], args: [[], [["hello", "leetcode"]], ["hello"], ["hhllo"], ["hell"], ["leetcoded"]] },
      { ops: ["MagicDictionary", "buildDict", "search", "search", "search"], args: [[], [["hello", "hallo", "a"]], ["hello"], ["b"], ["hxllx"]] },
    ];
    return {
      slug: "implement-magic-dictionary",
      title: "Implement Magic Dictionary",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "String", "Depth-First Search", "Trie", "Design", "Google", "Amazon"],
      signature: {
        funcName: "MagicDictionary", params: [], returns: "void" as const,
        methods: [
          { name: "buildDict", params: [{ name: "dictionary", type: "string[]" as const }], returns: "void" as const },
          { name: "search", params: [{ name: "searchWord", type: "string" as const }], returns: "bool" as const },
        ],
      },
      description: describe(
        "Design a dictionary that answers: can you change **exactly one** character of a given word so that it becomes a word in the dictionary? Write the class `MagicDictionary`:\n\n- `MagicDictionary()` creates the object.\n- `void buildDict(String[] dictionary)` fills it with a list of **distinct** words.\n- `boolean search(String searchWord)` returns `true` if changing exactly one character of `searchWord` (to a different letter) turns it into a dictionary word, `false` otherwise.\n\nA word that is already in the dictionary does not count by itself — one character must change.\n\n" + CALLS,
        [
          exOf(ex[0].ops, ex[0].args, run, "\"hello\" itself needs zero changes, so it is false. \"hhllo\" becomes \"hello\" by changing its second letter. Lengths must match, so \"hell\" and \"leetcoded\" can never work."),
          exOf(ex[1].ops, ex[1].args, run, "\"hello\" is in the dictionary, but changing its 'e' to 'a' gives \"hallo\", which is too — so it is true. \"b\" → \"a\" works; \"hxllx\" differs from \"hello\" in two places."),
        ],
        ["1 <= dictionary.length <= 100", "1 <= dictionary[i].length <= 100", "dictionary[i] consists of only lowercase English letters", "All the strings in dictionary are distinct", "1 <= searchWord.length <= 100", "searchWord consists of only lowercase English letters", "buildDict is called once, before search", "At most 100 calls are made to search"]),
      hints: [
        "A dictionary word can only be reached if it has the same length as the search word.",
        "For a candidate of the same length, count the positions where the two words differ.",
        "The answer is `true` exactly when some same-length word differs in exactly one position; stop counting a candidate as soon as it reaches two differences.",
      ],
      editorial: explain({
        idea: "Changing exactly one character of `searchWord` gives word `w` precisely when `w` has the same length and differs from `searchWord` in exactly one position. With at most 100 words of length at most 100, checking each same-length word directly is fast; grouping the words by length skips the others.",
        steps: [
          "`buildDict`: group the words by length.",
          "`search(s)`: for each word `w` of length `|s|`, count positions `i` with `w[i] != s[i]`, stopping at 2.",
          "Return `true` as soon as some word has exactly one difference; `false` if none does.",
        ],
        why: "Changing one character to a different letter produces a word at Hamming distance exactly 1 from the original, and every word at distance 1 can be produced that way. So the question is whether the dictionary holds a word at Hamming distance 1 — which the scan checks word by word.",
        time: "O(N · L) per search for N words of length L; O(N · L) to build",
        space: "O(N · L)",
        pitfalls: [
          "A search word that is itself in the dictionary is not automatically true — it needs a *different* word one change away.",
          "Words of a different length can never match; checking them wastes time and risks index errors.",
          "For far more searches, precompute every \"generalised neighbour\" (`h*llo`, one `*` per position) with its count — the standard O(L²) per search alternative.",
        ],
      }),
      examples: ex.map((e) => caseOf(e.ops, e.args, run)),
      gen: (rng: Rng) => {
        const abc = pick(rng, ["ab", "abc", "abcd", "abcdefghijklmnopqrstuvwxyz"]);
        const maxLen = pick(rng, [2, 4, 7]);
        const want = ri(rng, 1, pick(rng, [2, 6, 15]));
        const seen = new Set<string>();
        for (let t = 0; t < 200 && seen.size < want; t++) seen.add(randLower(rng, 1, maxLen, abc));
        const dict = shuffle(rng, [...seen]);
        const ops = ["MagicDictionary", "buildDict"], args: Array<Array<string | string[]>> = [[], [dict]];
        for (let m = ri(rng, 1, pick(rng, [3, 12, 30])); m > 0; m--) {
          const base = rng() < 0.75 ? pick(rng, dict) : randLower(rng, 1, maxLen, abc);
          const chars = base.split("");
          for (let d = ri(rng, 0, 2); d > 0; d--) chars[ri(rng, 0, chars.length - 1)] = abc[ri(rng, 0, abc.length - 1)];
          ops.push("search"); args.push([chars.join("")]);
        }
        return caseOf(ops, args, run);
      },
      solutions: {
        python: code`
          from typing import List

          class MagicDictionary:

              def __init__(self):
                  self.by_len = {}

              def buildDict(self, dictionary: List[str]) -> None:
                  for w in dictionary:
                      self.by_len.setdefault(len(w), []).append(w)

              def search(self, searchWord: str) -> bool:
                  for w in self.by_len.get(len(searchWord), []):
                      diff = 0
                      for a, b in zip(w, searchWord):
                          if a != b:
                              diff += 1
                              if diff > 1:
                                  break
                      if diff == 1:
                          return True
                  return False
        `,
        javascript: code`
          var MagicDictionary = function() {
              this.byLen = {};
          };

          MagicDictionary.prototype.buildDict = function(dictionary) {
              for (var i = 0; i < dictionary.length; i++) {
                  var w = dictionary[i];
                  (this.byLen[w.length] = this.byLen[w.length] || []).push(w);
              }
          };

          MagicDictionary.prototype.search = function(searchWord) {
              var words = this.byLen[searchWord.length] || [];
              for (var i = 0; i < words.length; i++) {
                  var diff = 0;
                  for (var k = 0; k < searchWord.length && diff < 2; k++) if (words[i][k] !== searchWord[k]) diff++;
                  if (diff === 1) return true;
              }
              return false;
          };
        `,
        typescript: code`
          class MagicDictionary {
              byLen: { [len: number]: string[] };

              constructor() {
                  this.byLen = {};
              }

              buildDict(dictionary: string[]): void {
                  for (var i = 0; i < dictionary.length; i++) {
                      var w = dictionary[i];
                      (this.byLen[w.length] = this.byLen[w.length] || []).push(w);
                  }
              }

              search(searchWord: string): boolean {
                  var words = this.byLen[searchWord.length] || [];
                  for (var i = 0; i < words.length; i++) {
                      var diff = 0;
                      for (var k = 0; k < searchWord.length && diff < 2; k++) if (words[i][k] !== searchWord[k]) diff++;
                      if (diff === 1) return true;
                  }
                  return false;
              }
          }
        `,
        java: code`
          class MagicDictionary {
              private Map<Integer, List<String>> byLen = new HashMap<>();

              public MagicDictionary() {
              }

              public void buildDict(String[] dictionary) {
                  for (String w : dictionary) byLen.computeIfAbsent(w.length(), k -> new ArrayList<>()).add(w);
              }

              public boolean search(String searchWord) {
                  for (String w : byLen.getOrDefault(searchWord.length(), Collections.emptyList())) {
                      int diff = 0;
                      for (int k = 0; k < w.length() && diff < 2; k++) if (w.charAt(k) != searchWord.charAt(k)) diff++;
                      if (diff == 1) return true;
                  }
                  return false;
              }
          }
        `,
        cpp: code`
          class MagicDictionary {
              unordered_map<int, vector<string>> byLen;
          public:
              MagicDictionary() {}

              void buildDict(vector<string> dictionary) {
                  for (auto& w : dictionary) byLen[w.size()].push_back(w);
              }

              bool search(string searchWord) {
                  auto it = byLen.find(searchWord.size());
                  if (it == byLen.end()) return false;
                  for (auto& w : it->second) {
                      int diff = 0;
                      for (size_t k = 0; k < w.size() && diff < 2; k++) if (w[k] != searchWord[k]) diff++;
                      if (diff == 1) return true;
                  }
                  return false;
              }
          };
        `,
        c: code`
          typedef struct {
              char** words;
              int* lens;
              int count;
          } MagicDictionary;

          MagicDictionary* magicDictionaryCreate() {
              return (MagicDictionary*)calloc(1, sizeof(MagicDictionary));
          }

          void magicDictionaryBuildDict(MagicDictionary* obj, char** dictionary, int dictionarySize) {
              obj->words = (char**)malloc((dictionarySize + 1) * sizeof(char*));
              obj->lens = (int*)malloc((dictionarySize + 1) * sizeof(int));
              obj->count = dictionarySize;
              for (int i = 0; i < dictionarySize; i++) {
                  int len = (int)strlen(dictionary[i]);
                  obj->words[i] = (char*)malloc(len + 1);
                  memcpy(obj->words[i], dictionary[i], len + 1);
                  obj->lens[i] = len;
              }
          }

          bool magicDictionarySearch(MagicDictionary* obj, char* searchWord) {
              int len = (int)strlen(searchWord);
              for (int i = 0; i < obj->count; i++) {
                  if (obj->lens[i] != len) continue;
                  int diff = 0;
                  for (int k = 0; k < len && diff < 2; k++) if (obj->words[i][k] != searchWord[k]) diff++;
                  if (diff == 1) return true;
              }
              return false;
          }

          void magicDictionaryFree(MagicDictionary* obj) {
              for (int i = 0; i < obj->count; i++) free(obj->words[i]);
              free(obj->words);
              free(obj->lens);
              free(obj);
          }
        `,
        csharp: code`
          public class MagicDictionary {
              private Dictionary<int, List<string>> byLen = new Dictionary<int, List<string>>();

              public MagicDictionary() {
              }

              public void BuildDict(string[] dictionary) {
                  foreach (string w in dictionary) {
                      if (!byLen.ContainsKey(w.Length)) byLen[w.Length] = new List<string>();
                      byLen[w.Length].Add(w);
                  }
              }

              public bool Search(string searchWord) {
                  List<string> words;
                  if (!byLen.TryGetValue(searchWord.Length, out words)) return false;
                  foreach (string w in words) {
                      int diff = 0;
                      for (int k = 0; k < w.Length && diff < 2; k++) if (w[k] != searchWord[k]) diff++;
                      if (diff == 1) return true;
                  }
                  return false;
              }
          }
        `,
        go: code`
          type MagicDictionary struct {
          	byLen map[int][]string
          }

          func Constructor() MagicDictionary {
          	return MagicDictionary{byLen: map[int][]string{}}
          }

          func (this *MagicDictionary) BuildDict(dictionary []string) {
          	for _, w := range dictionary {
          		this.byLen[len(w)] = append(this.byLen[len(w)], w)
          	}
          }

          func (this *MagicDictionary) Search(searchWord string) bool {
          	for _, w := range this.byLen[len(searchWord)] {
          		diff := 0
          		for k := 0; k < len(w) && diff < 2; k++ {
          			if w[k] != searchWord[k] {
          				diff++
          			}
          		}
          		if diff == 1 {
          			return true
          		}
          	}
          	return false
          }
        `,
        kotlin: code`
          class MagicDictionary() {
              private val byLen = HashMap<Int, MutableList<String>>()

              fun buildDict(dictionary: Array<String>) {
                  for (w in dictionary) byLen.getOrPut(w.length) { mutableListOf() }.add(w)
              }

              fun search(searchWord: String): Boolean {
                  for (w in byLen[searchWord.length] ?: return false) {
                      var diff = 0
                      var k = 0
                      while (k < w.length && diff < 2) { if (w[k] != searchWord[k]) diff++; k++ }
                      if (diff == 1) return true
                  }
                  return false
              }
          }
        `,
        swift: code`
          class MagicDictionary {
              var byLen: [Int: [[UInt8]]] = [:]

              init() {}

              func buildDict(_ dictionary: [String]) {
                  for w in dictionary {
                      let bytes = Array(w.utf8)
                      byLen[bytes.count, default: []].append(bytes)
                  }
              }

              func search(_ searchWord: String) -> Bool {
                  let s = Array(searchWord.utf8)
                  for w in byLen[s.count] ?? [] {
                      var diff = 0
                      var k = 0
                      while k < w.count && diff < 2 { if w[k] != s[k] { diff += 1 }; k += 1 }
                      if diff == 1 { return true }
                  }
                  return false
              }
          }
        `,
        rust: code`
          use std::collections::HashMap;

          struct MagicDictionary {
              by_len: HashMap<usize, Vec<Vec<u8>>>,
          }

          impl MagicDictionary {
              fn new() -> Self { MagicDictionary { by_len: HashMap::new() } }

              fn buildDict(&mut self, dictionary: Vec<String>) {
                  for w in dictionary {
                      self.by_len.entry(w.len()).or_insert_with(Vec::new).push(w.into_bytes());
                  }
              }

              fn search(&mut self, searchWord: String) -> bool {
                  let s = searchWord.as_bytes();
                  match self.by_len.get(&s.len()) {
                      None => false,
                      Some(words) => words.iter().any(|w| w.iter().zip(s.iter()).filter(|(a, b)| a != b).take(2).count() == 1),
                  }
              }
          }
        `,
        php: code`
          class MagicDictionary {
              private $byLen = [];

              function __construct() {
              }

              function buildDict($dictionary) {
                  foreach ($dictionary as $w) $this->byLen[strlen($w)][] = $w;
              }

              function search($searchWord) {
                  $len = strlen($searchWord);
                  if (!isset($this->byLen[$len])) return false;
                  foreach ($this->byLen[$len] as $w) {
                      $diff = 0;
                      for ($k = 0; $k < $len && $diff < 2; $k++) if ($w[$k] !== $searchWord[$k]) $diff++;
                      if ($diff == 1) return true;
                  }
                  return false;
              }
          }
        `,
        ruby: code`
          class MagicDictionary
            def initialize
              @by_len = Hash.new { |h, k| h[k] = [] }
            end

            def buildDict(dictionary)
              dictionary.each { |w| @by_len[w.length] << w }
            end

            def search(searchWord)
              return false unless @by_len.key?(searchWord.length)
              @by_len[searchWord.length].any? do |w|
                diff = 0
                w.length.times do |k|
                  diff += 1 if w[k] != searchWord[k]
                  break if diff > 1
                end
                diff == 1
              end
            end
          end
        `,
      },
    };
  })(),

  // ── Map Sum Pairs (LC 677) ────────────────────────────────────────
  (() => {
    const run = (ops: string[], args: Array<Array<string | number>>) => {
      const m = new Map<string, number>();
      return ops.map((op, i) => {
        if (op === "insert") { m.set(args[i][0] as string, args[i][1] as number); return null; }
        if (op !== "sum") return null;
        const p = args[i][0] as string;
        let s = 0;
        m.forEach((v, k) => { if (k.startsWith(p)) s += v; });
        return s;
      });
    };
    const ex: Array<{ ops: string[]; args: Array<Array<string | number>> }> = [
      { ops: ["MapSum", "insert", "sum", "insert", "sum"], args: [[], ["apple", 3], ["ap"], ["app", 2], ["ap"]] },
      { ops: ["MapSum", "insert", "insert", "sum", "insert", "sum", "sum"], args: [[], ["cat", 5], ["car", 4], ["ca"], ["cat", 1], ["ca"], ["dog"]] },
    ];
    return {
      slug: "map-sum-pairs",
      title: "Map Sum Pairs",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "String", "Trie", "Design", "Google", "Amazon"],
      signature: {
        funcName: "MapSum", params: [], returns: "void" as const,
        methods: [
          { name: "insert", params: [{ name: "key", type: "string" as const }, { name: "value", type: "int" as const }], returns: "void" as const },
          { name: "sum", params: [{ name: "prefix", type: "string" as const }], returns: "int" as const },
        ],
      },
      description: describe(
        "Design a map from string keys to integer values that can also add up the values of all keys sharing a prefix. Write the class `MapSum`:\n\n- `MapSum()` creates an empty map.\n- `void insert(String key, int value)` stores the pair `(key, value)`. If `key` is already present, its old value is **replaced**.\n- `int sum(String prefix)` returns the sum of the values of every key that starts with `prefix`.\n\n" + CALLS,
        [
          exOf(ex[0].ops, ex[0].args, run, "Only \"apple\" starts with \"ap\" at first (3). After inserting \"app\" with 2, both keys start with \"ap\": 3 + 2 = 5."),
          exOf(ex[1].ops, ex[1].args, run, "\"cat\" and \"car\" give 5 + 4 = 9. Re-inserting \"cat\" with 1 replaces 5, so the sum drops to 1 + 4 = 5. No key starts with \"dog\"."),
        ],
        ["1 <= key.length, prefix.length <= 50", "key and prefix consist of only lowercase English letters", "1 <= value <= 1000", "At most 50 calls are made to insert and sum"]),
      hints: [
        "Summing over every stored key on each query works, but a trie lets the prefix itself lead you to exactly the keys that share it.",
        "Store at every trie node the total value of all keys passing through it; then `sum(prefix)` is the total at the prefix's node.",
        "Re-inserting a key must replace its value: remember each key's current value and add only the difference `value - old` along its path.",
      ],
      editorial: explain({
        idea: "A trie whose every node carries the sum of the values of all keys passing through it. A query walks the prefix and reads one number; an insert walks its key and adds the change in that key's value to every node on the way.",
        steps: [
          "Each node holds children, `total` (sum over keys through it) and `own` (the value of the key ending exactly here, 0 if none).",
          "`insert(key, value)`: walk `key`, creating missing nodes, to its last node; let `delta = value - own`, set `own = value`.",
          "Walk `key` again from the root and add `delta` to `total` of every node on the path.",
          "`sum(prefix)`: walk `prefix`; if a child is missing return 0, otherwise return the last node's `total`.",
        ],
        why: "A key's value contributes to the total of exactly the nodes on its path, which are the nodes of its prefixes. Adding `delta` keeps every such total equal to the sum of the *current* values, because the old value was counted there and is replaced by the new one. The node of `prefix` therefore holds the sum over all keys starting with `prefix`.",
        time: "O(L) per insert and per sum, L = length of the string",
        space: "O(total letters inserted)",
        pitfalls: [
          "Adding `value` instead of `value - old` double-counts a key that is inserted twice.",
          "A prefix with no node in the trie sums to 0, not to an error.",
        ],
      }),
      examples: ex.map((e) => caseOf(e.ops, e.args, run)),
      gen: (rng: Rng) => {
        const abc = pick(rng, ["ab", "abc", "abcdefghijklmnopqrstuvwxyz"]);
        const maxLen = pick(rng, [3, 6, 12]);
        const ops = ["MapSum"], args: Array<Array<string | number>> = [[]], keys: string[] = [];
        for (let m = ri(rng, 1, pick(rng, [4, 15, 40])); m > 0; m--) {
          let s = keys.length && rng() < 0.5 ? pick(rng, keys) : randLower(rng, 1, maxLen, abc);
          if (rng() < 0.5) { ops.push("insert"); keys.push(s); args.push([s, rng() < 0.1 ? 1000 : ri(rng, 1, pick(rng, [9, 1000]))]); }
          else { if (rng() < 0.6) s = s.slice(0, ri(rng, 1, s.length)); ops.push("sum"); args.push([s]); }
        }
        return caseOf(ops, args, run);
      },
      solutions: {
        python: code`
          class MapSum:

              def __init__(self):
                  # letter -> child; "#" = total of the keys through this node, "=" = value of the key ending here
                  self.root = {"#": 0}

              def insert(self, key: str, value: int) -> None:
                  path = [self.root]
                  for ch in key:
                      path.append(path[-1].setdefault(ch, {"#": 0}))
                  delta = value - path[-1].get("=", 0)
                  path[-1]["="] = value
                  for node in path:
                      node["#"] += delta

              def sum(self, prefix: str) -> int:
                  node = self.root
                  for ch in prefix:
                      if ch not in node:
                          return 0
                      node = node[ch]
                  return node["#"]
        `,
        javascript: code`
          var MapSum = function() {
              this.root = { children: {}, total: 0, own: 0 };
          };

          MapSum.prototype.insert = function(key, value) {
              var path = [this.root], node = this.root;
              for (var i = 0; i < key.length; i++) {
                  var ch = key[i];
                  if (!node.children[ch]) node.children[ch] = { children: {}, total: 0, own: 0 };
                  node = node.children[ch];
                  path.push(node);
              }
              var delta = value - node.own;
              node.own = value;
              for (var k = 0; k < path.length; k++) path[k].total += delta;
          };

          MapSum.prototype.sum = function(prefix) {
              var node = this.root;
              for (var i = 0; i < prefix.length; i++) {
                  node = node.children[prefix[i]];
                  if (!node) return 0;
              }
              return node.total;
          };
        `,
        typescript: code`
          class SumNode {
              children: { [ch: string]: SumNode };
              total: number;
              own: number;

              constructor() {
                  this.children = {};
                  this.total = 0;
                  this.own = 0;
              }
          }

          class MapSum {
              root: SumNode;

              constructor() {
                  this.root = new SumNode();
              }

              insert(key: string, value: number): void {
                  var path = [this.root], node = this.root;
                  for (var i = 0; i < key.length; i++) {
                      var ch = key[i];
                      if (!node.children[ch]) node.children[ch] = new SumNode();
                      node = node.children[ch];
                      path.push(node);
                  }
                  var delta = value - node.own;
                  node.own = value;
                  for (var k = 0; k < path.length; k++) path[k].total += delta;
              }

              sum(prefix: string): number {
                  var node = this.root;
                  for (var i = 0; i < prefix.length; i++) {
                      node = node.children[prefix[i]];
                      if (!node) return 0;
                  }
                  return node.total;
              }
          }
        `,
        java: code`
          class MapSum {
              private static class Node {
                  Node[] next = new Node[26];
                  int total, own;
              }

              private Node root = new Node();

              public MapSum() {
              }

              public void insert(String key, int value) {
                  Node node = root;
                  for (int i = 0; i < key.length(); i++) {
                      int c = key.charAt(i) - 'a';
                      if (node.next[c] == null) node.next[c] = new Node();
                      node = node.next[c];
                  }
                  int delta = value - node.own;
                  node.own = value;
                  node = root;
                  root.total += delta;
                  for (int i = 0; i < key.length(); i++) {
                      node = node.next[key.charAt(i) - 'a'];
                      node.total += delta;
                  }
              }

              public int sum(String prefix) {
                  Node node = root;
                  for (int i = 0; i < prefix.length() && node != null; i++) node = node.next[prefix.charAt(i) - 'a'];
                  return node == null ? 0 : node.total;
              }
          }
        `,
        cpp: code`
          class MapSum {
              struct Node {
                  Node* next[26] = {};
                  int total = 0, own = 0;
              };
              Node* root = new Node();
          public:
              MapSum() {}

              void insert(string key, int value) {
                  vector<Node*> path{root};
                  for (char ch : key) {
                      Node*& child = path.back()->next[ch - 'a'];
                      if (!child) child = new Node();
                      path.push_back(child);
                  }
                  int delta = value - path.back()->own;
                  path.back()->own = value;
                  for (Node* node : path) node->total += delta;
              }

              int sum(string prefix) {
                  Node* node = root;
                  for (size_t i = 0; i < prefix.size() && node; i++) node = node->next[prefix[i] - 'a'];
                  return node ? node->total : 0;
              }
          };
        `,
        c: code`
          /* The map is its own trie node type: the root is the object the judge holds. */
          typedef struct MapSum {
              struct MapSum* next[26];
              int total; /* sum of the values of every key through this node */
              int own;   /* value of the key ending exactly here, 0 if none */
          } MapSum;

          MapSum* mapSumCreate() {
              return (MapSum*)calloc(1, sizeof(MapSum));
          }

          void mapSumInsert(MapSum* obj, char* key, int value) {
              MapSum* node = obj;
              for (char* p = key; *p; p++) {
                  int c = *p - 'a';
                  if (node->next[c] == NULL) node->next[c] = mapSumCreate();
                  node = node->next[c];
              }
              int delta = value - node->own;
              node->own = value;
              node = obj;
              node->total += delta;
              for (char* p = key; *p; p++) {
                  node = node->next[*p - 'a'];
                  node->total += delta;
              }
          }

          int mapSumSum(MapSum* obj, char* prefix) {
              MapSum* node = obj;
              for (char* p = prefix; *p && node != NULL; p++) node = node->next[*p - 'a'];
              return node == NULL ? 0 : node->total;
          }

          void mapSumFree(MapSum* obj) {
              for (int c = 0; c < 26; c++) if (obj->next[c] != NULL) mapSumFree(obj->next[c]);
              free(obj);
          }
        `,
        csharp: code`
          public class MapSum {
              private class Node {
                  public Node[] Next = new Node[26];
                  public int Total, Own;
              }

              private Node root = new Node();

              public MapSum() {
              }

              public void Insert(string key, int value) {
                  var path = new List<Node> { root };
                  Node node = root;
                  foreach (char ch in key) {
                      int c = ch - 'a';
                      if (node.Next[c] == null) node.Next[c] = new Node();
                      node = node.Next[c];
                      path.Add(node);
                  }
                  int delta = value - node.Own;
                  node.Own = value;
                  foreach (Node n in path) n.Total += delta;
              }

              public int Sum(string prefix) {
                  Node node = root;
                  for (int i = 0; i < prefix.Length && node != null; i++) node = node.Next[prefix[i] - 'a'];
                  return node == null ? 0 : node.Total;
              }
          }
        `,
        go: code`
          type sumNode struct {
          	next       [26]*sumNode
          	total, own int
          }

          type MapSum struct {
          	root *sumNode
          }

          func Constructor() MapSum {
          	return MapSum{root: &sumNode{}}
          }

          func (this *MapSum) Insert(key string, value int) {
          	path := []*sumNode{this.root}
          	node := this.root
          	for i := 0; i < len(key); i++ {
          		c := key[i] - 'a'
          		if node.next[c] == nil {
          			node.next[c] = &sumNode{}
          		}
          		node = node.next[c]
          		path = append(path, node)
          	}
          	delta := value - node.own
          	node.own = value
          	for _, n := range path {
          		n.total += delta
          	}
          }

          func (this *MapSum) Sum(prefix string) int {
          	node := this.root
          	for i := 0; i < len(prefix) && node != nil; i++ {
          		node = node.next[prefix[i]-'a']
          	}
          	if node == nil {
          		return 0
          	}
          	return node.total
          }
        `,
        kotlin: code`
          class MapSum() {
              private class Node {
                  val next = arrayOfNulls<Node>(26)
                  var total = 0
                  var own = 0
              }

              private val root = Node()

              fun insert(key: String, value: Int) {
                  val path = mutableListOf(root)
                  var node = root
                  for (ch in key) {
                      val c = ch - 'a'
                      if (node.next[c] == null) node.next[c] = Node()
                      node = node.next[c]!!
                      path.add(node)
                  }
                  val delta = value - node.own
                  node.own = value
                  for (n in path) n.total += delta
              }

              fun sum(prefix: String): Int {
                  var node = root
                  for (ch in prefix) node = node.next[ch - 'a'] ?: return 0
                  return node.total
              }
          }
        `,
        swift: code`
          final class SumNode {
              var next = [SumNode?](repeating: nil, count: 26)
              var total = 0
              var own = 0
          }

          class MapSum {
              let root = SumNode()

              init() {}

              func insert(_ key: String, _ value: Int) {
                  var path = [root]
                  var node = root
                  for b in key.utf8 {
                      let c = Int(b) - 97
                      if node.next[c] == nil { node.next[c] = SumNode() }
                      node = node.next[c]!
                      path.append(node)
                  }
                  let delta = value - node.own
                  node.own = value
                  for n in path { n.total += delta }
              }

              func sum(_ prefix: String) -> Int {
                  var node = root
                  for b in prefix.utf8 {
                      guard let child = node.next[Int(b) - 97] else { return 0 }
                      node = child
                  }
                  return node.total
              }
          }
        `,
        rust: code`
          // Nodes live in vectors; node 0 is the root, and a child index of 0 means "no child".
          struct MapSum {
              next: Vec<[usize; 26]>,
              total: Vec<i32>, // sum of the values of every key through the node
              own: Vec<i32>,   // value of the key ending exactly at the node
          }

          impl MapSum {
              fn new() -> Self { MapSum { next: vec![[0; 26]], total: vec![0], own: vec![0] } }

              fn insert(&mut self, key: String, value: i32) {
                  let mut path = vec![0];
                  let mut node = 0;
                  for b in key.bytes() {
                      let c = (b - b'a') as usize;
                      if self.next[node][c] == 0 {
                          self.next.push([0; 26]);
                          self.total.push(0);
                          self.own.push(0);
                          self.next[node][c] = self.next.len() - 1;
                      }
                      node = self.next[node][c];
                      path.push(node);
                  }
                  let delta = value - self.own[node];
                  self.own[node] = value;
                  for n in path { self.total[n] += delta; }
              }

              fn sum(&mut self, prefix: String) -> i32 {
                  let mut node = 0;
                  for b in prefix.bytes() {
                      node = self.next[node][(b - b'a') as usize];
                      if node == 0 { return 0; }
                  }
                  self.total[node]
              }
          }
        `,
        php: code`
          class MapSum {
              // Nodes are numbered; $next[$n] maps a letter to a child number.
              private $next = [[]];
              private $total = [0];
              private $own = [0];

              function __construct() {
              }

              function insert($key, $value) {
                  $path = [0];
                  $node = 0;
                  for ($i = 0; $i < strlen($key); $i++) {
                      $ch = $key[$i];
                      if (!isset($this->next[$node][$ch])) {
                          $this->next[] = [];
                          $this->total[] = 0;
                          $this->own[] = 0;
                          $this->next[$node][$ch] = count($this->next) - 1;
                      }
                      $node = $this->next[$node][$ch];
                      $path[] = $node;
                  }
                  $delta = $value - $this->own[$node];
                  $this->own[$node] = $value;
                  foreach ($path as $n) $this->total[$n] += $delta;
              }

              function sum($prefix) {
                  $node = 0;
                  for ($i = 0; $i < strlen($prefix); $i++) {
                      if (!isset($this->next[$node][$prefix[$i]])) return 0;
                      $node = $this->next[$node][$prefix[$i]];
                  }
                  return $this->total[$node];
              }
          }
        `,
        ruby: code`
          class MapSum
            def initialize
              @root = { total: 0, own: 0, next: {} }
            end

            def insert(key, value)
              path = [@root]
              key.each_char { |ch| path << (path[-1][:next][ch] ||= { total: 0, own: 0, next: {} }) }
              delta = value - path[-1][:own]
              path[-1][:own] = value
              path.each { |node| node[:total] += delta }
            end

            def sum(prefix)
              node = @root
              prefix.each_char do |ch|
                node = node[:next][ch]
                return 0 if node.nil?
              end
              node[:total]
            end
          end
        `,
      },
    };
  })(),

  // ── Design Twitter (LC 355) ───────────────────────────────────────
  (() => {
    const run = (ops: string[], args: number[][]) => {
      const tweets: number[][] = []; // [author, tweetId], oldest first
      const follows = new Map<number, Set<number>>();
      return ops.map((op, i) => {
        const [a, b] = args[i];
        if (op === "postTweet") { tweets.push([a, b]); return null; }
        if (op === "follow") { if (!follows.has(a)) follows.set(a, new Set()); (follows.get(a) as Set<number>).add(b); return null; }
        if (op === "unfollow") { if (follows.has(a)) (follows.get(a) as Set<number>).delete(b); return null; }
        if (op === "getNewsFeed") {
          const out: number[] = [];
          for (let k = tweets.length - 1; k >= 0 && out.length < 10; k--) {
            const author = tweets[k][0];
            if (author === a || (follows.has(a) && (follows.get(a) as Set<number>).has(author))) out.push(tweets[k][1]);
          }
          return out;
        }
        return null;
      });
    };
    const ex = [
      { ops: ["Twitter", "postTweet", "getNewsFeed", "follow", "postTweet", "getNewsFeed", "unfollow", "getNewsFeed"], args: [[], [1, 5], [1], [1, 2], [2, 6], [1], [1, 2], [1]] },
      { ops: ["Twitter", "postTweet", "postTweet", "postTweet", "follow", "getNewsFeed", "getNewsFeed"], args: [[], [3, 41], [4, 17], [3, 8], [4, 3], [4], [9]] },
    ];
    return {
      slug: "design-twitter",
      title: "Design Twitter",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "Heap (Priority Queue)", "Design", "Amazon", "Microsoft", "Google", "Meta"],
      signature: {
        funcName: "Twitter", params: [], returns: "void" as const,
        methods: [
          { name: "postTweet", params: [{ name: "userId", type: "int" as const }, { name: "tweetId", type: "int" as const }], returns: "void" as const },
          { name: "getNewsFeed", params: [{ name: "userId", type: "int" as const }], returns: "int[]" as const },
          { name: "follow", params: [{ name: "followerId", type: "int" as const }, { name: "followeeId", type: "int" as const }], returns: "void" as const },
          { name: "unfollow", params: [{ name: "followerId", type: "int" as const }, { name: "followeeId", type: "int" as const }], returns: "void" as const },
        ],
      },
      description: describe(
        "Design a tiny version of Twitter: users post tweets, follow and unfollow each other, and read a news feed of the most recent tweets. Write the class `Twitter`:\n\n- `Twitter()` creates the service with no users, tweets or follows.\n- `void postTweet(int userId, int tweetId)` records a new tweet with id `tweetId` by user `userId`. Every call uses a new `tweetId`, and later calls are more recent.\n- `int[] getNewsFeed(int userId)` returns the ids of the **10 most recent** tweets posted either by `userId` or by someone `userId` currently follows, **most recent first** (fewer if there are fewer such tweets).\n- `void follow(int followerId, int followeeId)` makes `followerId` follow `followeeId` (no effect if already following).\n- `void unfollow(int followerId, int followeeId)` makes `followerId` stop following `followeeId` (no effect if not following).\n\n" + CALLS,
        [
          exOf(ex[0].ops, ex[0].args, run, "User 1's feed starts as their own tweet 5. After following user 2, tweet 6 is newer and comes first. After unfollowing, only tweet 5 is left."),
          exOf(ex[1].ops, ex[1].args, run, "User 4 follows user 3, so their feed holds 3's tweets 8 and 41 and their own 17, newest first. User 9 has posted nothing and follows nobody: an empty feed."),
        ],
        ["1 <= userId, followerId, followeeId <= 500", "followerId != followeeId", "0 <= tweetId <= 10^4", "All the tweets have unique ids", "At most 3 * 10^4 calls are made to postTweet, getNewsFeed, follow and unfollow"]),
      hints: [
        "Give every tweet a timestamp from a global counter, so \"most recent\" is a comparison of numbers.",
        "Store each user's own tweets in posting order, and each user's followees in a set — follow and unfollow become set operations.",
        "A feed only needs the last 10 tweets of each relevant user: merge those lists by timestamp (a max-heap over the users' newest tweets, or gather the candidates and sort) and keep the first 10.",
      ],
      editorial: explain({
        idea: "Keep per user a list of `(time, tweetId)` in posting order and a set of followees. A feed is a merge, newest first, of the tweet lists of the user and their followees — and since only 10 tweets are wanted, only the last 10 of each list can ever matter.",
        steps: [
          "`postTweet(u, id)`: append `(time++, id)` to `u`'s list.",
          "`follow(a, b)` / `unfollow(a, b)`: add `b` to / remove `b` from `a`'s followee set.",
          "`getNewsFeed(u)`: for `u` and every followee, take the last (up to) 10 entries of their list as candidates.",
          "Order the candidates by time, newest first, and return the ids of the first 10. (A max-heap seeded with each user's newest tweet does the same merge in `O(10 log F)`.)",
        ],
        why: "Every tweet in the feed belongs to `u` or a followee, so it is in one of the lists considered. Any tweet that is not among its own author's 10 newest has 10 newer tweets from that one author ahead of it, so it can never make a 10-tweet feed — dropping it is safe. Sorting the rest by the global timestamp gives exactly the most recent first.",
        time: "O(1) for postTweet, follow and unfollow; O(10F log(10F)) for getNewsFeed with F followees",
        space: "O(T + E) for T tweets and E follow relations",
        pitfalls: [
          "A user's own tweets are in their feed even though they do not follow themselves.",
          "Tweet ids are not timestamps — order by posting time, not by id.",
          "Unfollowing someone you do not follow must be a harmless no-op.",
        ],
      }),
      examples: ex.map((e) => caseOf(e.ops, e.args, run)),
      gen: (rng: Rng) => {
        const nUsers = pick(rng, [2, 3, 5, 10]);
        const ids = rng() < 0.3 ? shuffle(rng, Array.from({ length: 500 }, (_, i) => i + 1)).slice(0, nUsers) : Array.from({ length: nUsers }, (_, i) => i + 1);
        const tweetIds = new Set<number>();
        const ops = ["Twitter"], args: number[][] = [[]];
        for (let m = ri(rng, 1, pick(rng, [5, 20, 40])); m > 0; m--) {
          const r = rng(), u = pick(rng, ids);
          if (r < 0.45) {
            let t = ri(rng, 0, pick(rng, [50, 10000]));
            while (tweetIds.has(t)) t = ri(rng, 0, 10000);
            tweetIds.add(t);
            ops.push("postTweet"); args.push([u, t]);
          } else if (r < 0.7) { ops.push("getNewsFeed"); args.push([u]); }
          else {
            const others = ids.filter((x) => x !== u);
            ops.push(r < 0.88 ? "follow" : "unfollow"); args.push([u, pick(rng, others)]);
          }
        }
        return caseOf(ops, args, run);
      },
      solutions: {
        python: code`
          from typing import List

          class Twitter:

              def __init__(self):
                  self.time = 0
                  self.tweets = {}    # user -> [(time, tweetId)] in posting order
                  self.following = {}  # user -> set of followees

              def postTweet(self, userId: int, tweetId: int) -> None:
                  self.tweets.setdefault(userId, []).append((self.time, tweetId))
                  self.time += 1

              def getNewsFeed(self, userId: int) -> List[int]:
                  candidates = []
                  for u in {userId} | self.following.get(userId, set()):
                      candidates.extend(self.tweets.get(u, [])[-10:])  # older ones can never make the top 10
                  candidates.sort(reverse=True)
                  return [tweetId for _, tweetId in candidates[:10]]

              def follow(self, followerId: int, followeeId: int) -> None:
                  self.following.setdefault(followerId, set()).add(followeeId)

              def unfollow(self, followerId: int, followeeId: int) -> None:
                  self.following.get(followerId, set()).discard(followeeId)
        `,
        javascript: code`
          var Twitter = function() {
              this.time = 0;
              this.tweets = {};    // user -> [[time, tweetId]] in posting order
              this.following = {}; // user -> { followee: true }
          };

          Twitter.prototype.postTweet = function(userId, tweetId) {
              (this.tweets[userId] = this.tweets[userId] || []).push([this.time++, tweetId]);
          };

          Twitter.prototype.getNewsFeed = function(userId) {
              var users = [userId], f = this.following[userId] || {};
              for (var k in f) users.push(Number(k));
              var cand = [];
              for (var i = 0; i < users.length; i++) {
                  var list = this.tweets[users[i]] || [];
                  for (var j = Math.max(0, list.length - 10); j < list.length; j++) cand.push(list[j]);
              }
              cand.sort(function(a, b) { return b[0] - a[0]; });
              var out = [];
              for (var t = 0; t < cand.length && t < 10; t++) out.push(cand[t][1]);
              return out;
          };

          Twitter.prototype.follow = function(followerId, followeeId) {
              (this.following[followerId] = this.following[followerId] || {})[followeeId] = true;
          };

          Twitter.prototype.unfollow = function(followerId, followeeId) {
              if (this.following[followerId]) delete this.following[followerId][followeeId];
          };
        `,
        typescript: code`
          class Twitter {
              time: number;
              tweets: { [user: number]: number[][] };
              following: { [user: number]: { [followee: number]: boolean } };

              constructor() {
                  this.time = 0;
                  this.tweets = {};
                  this.following = {};
              }

              postTweet(userId: number, tweetId: number): void {
                  (this.tweets[userId] = this.tweets[userId] || []).push([this.time++, tweetId]);
              }

              getNewsFeed(userId: number): number[] {
                  var users = [userId], f = this.following[userId] || {};
                  for (var k in f) users.push(Number(k));
                  var cand: number[][] = [];
                  for (var i = 0; i < users.length; i++) {
                      var list = this.tweets[users[i]] || [];
                      for (var j = Math.max(0, list.length - 10); j < list.length; j++) cand.push(list[j]);
                  }
                  cand.sort(function(a, b) { return b[0] - a[0]; });
                  var out: number[] = [];
                  for (var t = 0; t < cand.length && t < 10; t++) out.push(cand[t][1]);
                  return out;
              }

              follow(followerId: number, followeeId: number): void {
                  (this.following[followerId] = this.following[followerId] || {})[followeeId] = true;
              }

              unfollow(followerId: number, followeeId: number): void {
                  if (this.following[followerId]) delete this.following[followerId][followeeId];
              }
          }
        `,
        java: code`
          class Twitter {
              private int time = 0;
              private Map<Integer, List<int[]>> tweets = new HashMap<>();     // user -> {time, tweetId}
              private Map<Integer, Set<Integer>> following = new HashMap<>();

              public Twitter() {
              }

              public void postTweet(int userId, int tweetId) {
                  tweets.computeIfAbsent(userId, k -> new ArrayList<>()).add(new int[]{time++, tweetId});
              }

              public List<Integer> feedOf(int userId) {
                  PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> b[0] - a[0]);
                  Set<Integer> users = new HashSet<>(following.getOrDefault(userId, Collections.emptySet()));
                  users.add(userId);
                  for (int u : users) {
                      List<int[]> list = tweets.getOrDefault(u, Collections.emptyList());
                      for (int j = Math.max(0, list.size() - 10); j < list.size(); j++) heap.add(list.get(j));
                  }
                  List<Integer> out = new ArrayList<>();
                  while (!heap.isEmpty() && out.size() < 10) out.add(heap.poll()[1]);
                  return out;
              }

              public int[] getNewsFeed(int userId) {
                  return feedOf(userId).stream().mapToInt(Integer::intValue).toArray();
              }

              public void follow(int followerId, int followeeId) {
                  following.computeIfAbsent(followerId, k -> new HashSet<>()).add(followeeId);
              }

              public void unfollow(int followerId, int followeeId) {
                  Set<Integer> s = following.get(followerId);
                  if (s != null) s.remove(followeeId);
              }
          }
        `,
        cpp: code`
          class Twitter {
              int time = 0;
              unordered_map<int, vector<pair<int, int>>> tweets; // user -> {time, tweetId}
              unordered_map<int, unordered_set<int>> following;
          public:
              Twitter() {}

              void postTweet(int userId, int tweetId) {
                  tweets[userId].push_back({time++, tweetId});
              }

              vector<int> getNewsFeed(int userId) {
                  vector<int> users(following[userId].begin(), following[userId].end());
                  users.push_back(userId);
                  vector<pair<int, int>> cand;
                  for (int u : users) {
                      auto& list = tweets[u];
                      for (size_t j = list.size() > 10 ? list.size() - 10 : 0; j < list.size(); j++) cand.push_back(list[j]);
                  }
                  sort(cand.rbegin(), cand.rend()); // newest first
                  vector<int> out;
                  for (size_t t = 0; t < cand.size() && t < 10; t++) out.push_back(cand[t].second);
                  return out;
              }

              void follow(int followerId, int followeeId) {
                  following[followerId].insert(followeeId);
              }

              void unfollow(int followerId, int followeeId) {
                  following[followerId].erase(followeeId);
              }
          };
        `,
        c: code`
          /* User ids are 1..500: per user, a growing array of (time, tweetId) pairs and a list of followees. */
          #define TW_USERS 501

          typedef struct {
              int time;
              int* tw[TW_USERS]; /* time0, id0, time1, id1, ... */
              int twCount[TW_USERS], twCap[TW_USERS];
              int* fol[TW_USERS];
              int folCount[TW_USERS], folCap[TW_USERS];
          } Twitter;

          Twitter* twitterCreate() {
              return (Twitter*)calloc(1, sizeof(Twitter));
          }

          void twitterPostTweet(Twitter* obj, int userId, int tweetId) {
              int u = userId;
              if (obj->twCount[u] == obj->twCap[u]) {
                  obj->twCap[u] = obj->twCap[u] ? obj->twCap[u] * 2 : 8;
                  obj->tw[u] = (int*)realloc(obj->tw[u], 2 * obj->twCap[u] * sizeof(int));
              }
              obj->tw[u][2 * obj->twCount[u]] = obj->time++;
              obj->tw[u][2 * obj->twCount[u] + 1] = tweetId;
              obj->twCount[u]++;
          }

          static int twByTimeDesc(const void* a, const void* b) {
              return ((const int*)b)[0] - ((const int*)a)[0];
          }

          int* twitterGetNewsFeed(Twitter* obj, int userId, int* returnSize) {
              int nUsers = obj->folCount[userId] + 1;
              int* cand = (int*)malloc(2 * 10 * nUsers * sizeof(int));
              int n = 0;
              for (int k = 0; k < nUsers; k++) {
                  int u = k == 0 ? userId : obj->fol[userId][k - 1];
                  int from = obj->twCount[u] > 10 ? obj->twCount[u] - 10 : 0; /* older ones never make the top 10 */
                  for (int j = from; j < obj->twCount[u]; j++) {
                      cand[2 * n] = obj->tw[u][2 * j];
                      cand[2 * n + 1] = obj->tw[u][2 * j + 1];
                      n++;
                  }
              }
              qsort(cand, n, 2 * sizeof(int), twByTimeDesc);
              *returnSize = n < 10 ? n : 10;
              int* out = (int*)malloc(10 * sizeof(int));
              for (int t = 0; t < *returnSize; t++) out[t] = cand[2 * t + 1];
              free(cand);
              return out;
          }

          void twitterFollow(Twitter* obj, int followerId, int followeeId) {
              int a = followerId;
              for (int i = 0; i < obj->folCount[a]; i++) if (obj->fol[a][i] == followeeId) return;
              if (obj->folCount[a] == obj->folCap[a]) {
                  obj->folCap[a] = obj->folCap[a] ? obj->folCap[a] * 2 : 4;
                  obj->fol[a] = (int*)realloc(obj->fol[a], obj->folCap[a] * sizeof(int));
              }
              obj->fol[a][obj->folCount[a]++] = followeeId;
          }

          void twitterUnfollow(Twitter* obj, int followerId, int followeeId) {
              int a = followerId;
              for (int i = 0; i < obj->folCount[a]; i++)
                  if (obj->fol[a][i] == followeeId) { obj->fol[a][i] = obj->fol[a][--obj->folCount[a]]; return; }
          }

          void twitterFree(Twitter* obj) {
              for (int u = 0; u < TW_USERS; u++) { free(obj->tw[u]); free(obj->fol[u]); }
              free(obj);
          }
        `,
        csharp: code`
          public class Twitter {
              private int time = 0;
              private Dictionary<int, List<int[]>> tweets = new Dictionary<int, List<int[]>>(); // user -> {time, tweetId}
              private Dictionary<int, HashSet<int>> following = new Dictionary<int, HashSet<int>>();

              public Twitter() {
              }

              public void PostTweet(int userId, int tweetId) {
                  if (!tweets.ContainsKey(userId)) tweets[userId] = new List<int[]>();
                  tweets[userId].Add(new int[] { time++, tweetId });
              }

              public int[] GetNewsFeed(int userId) {
                  var users = new List<int> { userId };
                  HashSet<int> f;
                  if (following.TryGetValue(userId, out f)) users.AddRange(f);
                  var cand = new List<int[]>();
                  foreach (int u in users) {
                      List<int[]> list;
                      if (!tweets.TryGetValue(u, out list)) continue;
                      for (int j = Math.Max(0, list.Count - 10); j < list.Count; j++) cand.Add(list[j]);
                  }
                  return cand.OrderByDescending(t => t[0]).Take(10).Select(t => t[1]).ToArray();
              }

              public void Follow(int followerId, int followeeId) {
                  if (!following.ContainsKey(followerId)) following[followerId] = new HashSet<int>();
                  following[followerId].Add(followeeId);
              }

              public void Unfollow(int followerId, int followeeId) {
                  HashSet<int> f;
                  if (following.TryGetValue(followerId, out f)) f.Remove(followeeId);
              }
          }
        `,
        go: code`
          type Twitter struct {
          	time      int
          	tweets    map[int][][2]int // user -> {time, tweetId}
          	following map[int]map[int]bool
          }

          func Constructor() Twitter {
          	return Twitter{tweets: map[int][][2]int{}, following: map[int]map[int]bool{}}
          }

          func (this *Twitter) PostTweet(userId int, tweetId int) {
          	this.tweets[userId] = append(this.tweets[userId], [2]int{this.time, tweetId})
          	this.time++
          }

          func (this *Twitter) GetNewsFeed(userId int) []int {
          	users := []int{userId}
          	for u := range this.following[userId] {
          		users = append(users, u)
          	}
          	cand := [][2]int{}
          	for _, u := range users {
          		list := this.tweets[u]
          		from := len(list) - 10
          		if from < 0 {
          			from = 0
          		}
          		cand = append(cand, list[from:]...)
          	}
          	sort.Slice(cand, func(i, j int) bool { return cand[i][0] > cand[j][0] })
          	out := []int{}
          	for t := 0; t < len(cand) && t < 10; t++ {
          		out = append(out, cand[t][1])
          	}
          	return out
          }

          func (this *Twitter) Follow(followerId int, followeeId int) {
          	if this.following[followerId] == nil {
          		this.following[followerId] = map[int]bool{}
          	}
          	this.following[followerId][followeeId] = true
          }

          func (this *Twitter) Unfollow(followerId int, followeeId int) {
          	delete(this.following[followerId], followeeId)
          }
        `,
        kotlin: code`
          class Twitter() {
              private var time = 0
              private val tweets = HashMap<Int, MutableList<IntArray>>() // user -> {time, tweetId}
              private val following = HashMap<Int, MutableSet<Int>>()

              fun postTweet(userId: Int, tweetId: Int) {
                  tweets.getOrPut(userId) { mutableListOf() }.add(intArrayOf(time++, tweetId))
              }

              fun getNewsFeed(userId: Int): IntArray {
                  val users = (following[userId] ?: mutableSetOf<Int>()) + userId
                  val cand = mutableListOf<IntArray>()
                  for (u in users) cand.addAll((tweets[u] ?: mutableListOf<IntArray>()).takeLast(10))
                  return cand.sortedByDescending { it[0] }.take(10).map { it[1] }.toIntArray()
              }

              fun follow(followerId: Int, followeeId: Int) {
                  following.getOrPut(followerId) { mutableSetOf() }.add(followeeId)
              }

              fun unfollow(followerId: Int, followeeId: Int) {
                  following[followerId]?.remove(followeeId)
              }
          }
        `,
        swift: code`
          class Twitter {
              var time = 0
              var tweets: [Int: [(Int, Int)]] = [:] // user -> (time, tweetId)
              var following: [Int: Set<Int>] = [:]

              init() {}

              func postTweet(_ userId: Int, _ tweetId: Int) {
                  tweets[userId, default: []].append((time, tweetId))
                  time += 1
              }

              func getNewsFeed(_ userId: Int) -> [Int] {
                  var cand: [(Int, Int)] = []
                  for u in following[userId, default: []].union([userId]) {
                      cand.append(contentsOf: (tweets[u] ?? []).suffix(10))
                  }
                  cand.sort { $0.0 > $1.0 }
                  return cand.prefix(10).map { $0.1 }
              }

              func follow(_ followerId: Int, _ followeeId: Int) {
                  following[followerId, default: []].insert(followeeId)
              }

              func unfollow(_ followerId: Int, _ followeeId: Int) {
                  following[followerId]?.remove(followeeId)
              }
          }
        `,
        rust: code`
          use std::collections::{HashMap, HashSet};

          struct Twitter {
              time: i32,
              tweets: HashMap<i32, Vec<(i32, i32)>>, // user -> (time, tweetId)
              following: HashMap<i32, HashSet<i32>>,
          }

          impl Twitter {
              fn new() -> Self { Twitter { time: 0, tweets: HashMap::new(), following: HashMap::new() } }

              fn postTweet(&mut self, userId: i32, tweetId: i32) {
                  self.tweets.entry(userId).or_insert_with(Vec::new).push((self.time, tweetId));
                  self.time += 1;
              }

              fn getNewsFeed(&mut self, userId: i32) -> Vec<i32> {
                  let mut users = vec![userId];
                  if let Some(f) = self.following.get(&userId) { users.extend(f.iter().cloned()); }
                  let mut cand: Vec<(i32, i32)> = Vec::new();
                  for u in users {
                      if let Some(list) = self.tweets.get(&u) {
                          let from = if list.len() > 10 { list.len() - 10 } else { 0 };
                          cand.extend_from_slice(&list[from..]);
                      }
                  }
                  cand.sort_by(|a, b| b.0.cmp(&a.0));
                  cand.iter().take(10).map(|t| t.1).collect()
              }

              fn follow(&mut self, followerId: i32, followeeId: i32) {
                  self.following.entry(followerId).or_insert_with(HashSet::new).insert(followeeId);
              }

              fn unfollow(&mut self, followerId: i32, followeeId: i32) {
                  if let Some(f) = self.following.get_mut(&followerId) { f.remove(&followeeId); }
              }
          }
        `,
        php: code`
          class Twitter {
              private $time = 0;
              private $tweets = [];    // user -> [[time, tweetId]]
              private $following = []; // user -> [followee => true]

              function __construct() {
              }

              function postTweet($userId, $tweetId) {
                  $this->tweets[$userId][] = [$this->time++, $tweetId];
              }

              function getNewsFeed($userId) {
                  $users = array_keys($this->following[$userId] ?? []);
                  $users[] = $userId;
                  $cand = [];
                  foreach ($users as $u) {
                      foreach (array_slice($this->tweets[$u] ?? [], -10) as $t) $cand[] = $t;
                  }
                  usort($cand, function ($a, $b) { return $b[0] - $a[0]; });
                  return array_map(function ($t) { return $t[1]; }, array_slice($cand, 0, 10));
              }

              function follow($followerId, $followeeId) {
                  $this->following[$followerId][$followeeId] = true;
              }

              function unfollow($followerId, $followeeId) {
                  unset($this->following[$followerId][$followeeId]);
              }
          }
        `,
        ruby: code`
          require 'set'

          class Twitter
            def initialize
              @time = 0
              @tweets = Hash.new { |h, k| h[k] = [] }       # user => [[time, tweetId]]
              @following = Hash.new { |h, k| h[k] = Set.new }
            end

            def postTweet(userId, tweetId)
              @tweets[userId] << [@time, tweetId]
              @time += 1
            end

            def getNewsFeed(userId)
              cand = []
              (@following[userId].to_a + [userId]).each { |u| cand.concat(@tweets[u].last(10)) }
              cand.sort_by { |t| -t[0] }.first(10).map { |t| t[1] }
            end

            def follow(followerId, followeeId)
              @following[followerId] << followeeId
            end

            def unfollow(followerId, followeeId)
              @following[followerId].delete(followeeId)
            end
          end
        `,
      },
    };
  })(),

  // ── Design Circular Queue (LC 622) ────────────────────────────────
  (() => {
    const run = (ops: string[], args: number[][]) => {
      let k = 0;
      const q: number[] = [];
      return ops.map((op, i) => {
        switch (op) {
          case "MyCircularQueue": k = args[i][0]; return null;
          case "enQueue": if (q.length === k) return false; q.push(args[i][0]); return true;
          case "deQueue": if (q.length === 0) return false; q.shift(); return true;
          case "Front": return q.length ? q[0] : -1;
          case "Rear": return q.length ? q[q.length - 1] : -1;
          case "isEmpty": return q.length === 0;
          default: return q.length === k;
        }
      });
    };
    const make = (rng: Rng, name: string, choices: string[]) => {
      const k = rng() < 0.05 ? 1000 : ri(rng, 1, pick(rng, [1, 3, 6]));
      const ops = [name], args: number[][] = [[k]];
      for (let m = ri(rng, 1, pick(rng, [5, 20, 40])); m > 0; m--) {
        const op = pick(rng, choices);
        ops.push(op);
        args.push(op.startsWith("en") || op.startsWith("insert") ? [ri(rng, 0, pick(rng, [9, 1000]))] : []);
      }
      return { ops, args };
    };
    const ex = [
      { ops: ["MyCircularQueue", "enQueue", "enQueue", "enQueue", "enQueue", "Rear", "isFull", "deQueue", "enQueue", "Rear"], args: [[3], [1], [2], [3], [4], [], [], [], [4], []] },
      { ops: ["MyCircularQueue", "Front", "deQueue", "enQueue", "Front", "Rear", "deQueue", "isEmpty"], args: [[1], [], [], [7], [], [], [], []] },
    ];
    return {
      slug: "design-circular-queue",
      title: "Design Circular Queue",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Queue", "Design", "Amazon", "Microsoft", "Apple", "Meta"],
      signature: {
        funcName: "MyCircularQueue", params: [{ name: "k", type: "int" as const }], returns: "void" as const,
        methods: [
          { name: "enQueue", params: [{ name: "value", type: "int" as const }], returns: "bool" as const },
          { name: "deQueue", params: [], returns: "bool" as const },
          { name: "Front", params: [], returns: "int" as const },
          { name: "Rear", params: [], returns: "int" as const },
          { name: "isEmpty", params: [], returns: "bool" as const },
          { name: "isFull", params: [], returns: "bool" as const },
        ],
      },
      description: describe(
        "Implement a **circular queue** (ring buffer): a FIFO queue of fixed capacity stored in an array whose last slot wraps around to the first, so the space freed at the front can be reused. Do not use a built-in queue. Write the class `MyCircularQueue`:\n\n- `MyCircularQueue(int k)` creates a queue that holds at most `k` elements.\n- `boolean enQueue(int value)` adds `value` at the rear; returns `true` on success, `false` if the queue is full.\n- `boolean deQueue()` removes the front element; returns `true` on success, `false` if the queue is empty.\n- `int Front()` returns the front element, or `-1` if the queue is empty.\n- `int Rear()` returns the last element, or `-1` if the queue is empty.\n- `boolean isEmpty()` / `boolean isFull()` report whether the queue is empty / full.\n\n" + CALLS,
        [
          exOf(ex[0].ops, ex[0].args, run, "Capacity 3: the fourth enQueue fails. After one deQueue there is room again, and 4 becomes the rear — stored in the slot 1 used to occupy."),
          exOf(ex[1].ops, ex[1].args, run, "On an empty queue Front is -1 and deQueue fails. With capacity 1, 7 is both front and rear."),
        ],
        ["1 <= k <= 1000", "0 <= value <= 1000", "At most 3000 calls are made to enQueue, deQueue, Front, Rear, isEmpty and isFull"]),
      hints: [
        "Use an array of size `k` and never shift elements — move indices instead.",
        "Keep the index of the front element and the number of elements; the rear is then `(front + count - 1) % k`.",
        "enQueue writes at `(front + count) % k`; deQueue just advances `front = (front + 1) % k`. With an explicit count, \"empty\" and \"full\" are never ambiguous.",
      ],
      editorial: explain({
        idea: "A fixed array plus two numbers — where the front is and how many elements there are — describes the whole queue. Positions are taken modulo `k`, so the queue wraps around the end of the array and reuses freed slots without moving anything.",
        steps: [
          "Store `buf` of size `k`, `head = 0`, `count = 0`.",
          "`enQueue(v)`: if `count == k` return false; set `buf[(head + count) % k] = v`, increment `count`.",
          "`deQueue()`: if `count == 0` return false; `head = (head + 1) % k`, decrement `count`.",
          "`Front()` is `buf[head]` and `Rear()` is `buf[(head + count - 1) % k]`, or `-1` when empty.",
          "`isEmpty()` is `count == 0`; `isFull()` is `count == k`.",
        ],
        why: "The elements always occupy the `count` slots starting at `head` and wrapping around. enQueue fills the next slot after the last one, deQueue releases the first, and neither touches the others, so the FIFO order is preserved and every slot is reused once it is freed.",
        time: "O(1) per operation",
        space: "O(k)",
        pitfalls: [
          "With only a head and a tail index, `head == tail` means both empty and full — keep a count (or leave one slot unused).",
          "Front and Rear must return -1 on an empty queue rather than a stale slot.",
        ],
      }),
      examples: ex.map((e) => caseOf(e.ops, e.args, run)),
      gen: (rng: Rng) => {
        const { ops, args } = make(rng, "MyCircularQueue", ["enQueue", "enQueue", "enQueue", "deQueue", "deQueue", "Front", "Rear", "isEmpty", "isFull"]);
        return caseOf(ops, args, run);
      },
      solutions: {
        python: code`
          class MyCircularQueue:

              def __init__(self, k: int):
                  self.buf = [0] * k
                  self.head = 0
                  self.count = 0

              def enQueue(self, value: int) -> bool:
                  if self.count == len(self.buf):
                      return False
                  self.buf[(self.head + self.count) % len(self.buf)] = value
                  self.count += 1
                  return True

              def deQueue(self) -> bool:
                  if self.count == 0:
                      return False
                  self.head = (self.head + 1) % len(self.buf)
                  self.count -= 1
                  return True

              def Front(self) -> int:
                  return self.buf[self.head] if self.count else -1

              def Rear(self) -> int:
                  return self.buf[(self.head + self.count - 1) % len(self.buf)] if self.count else -1

              def isEmpty(self) -> bool:
                  return self.count == 0

              def isFull(self) -> bool:
                  return self.count == len(self.buf)
        `,
        javascript: code`
          var MyCircularQueue = function(k) {
              this.k = k;
              this.buf = [];
              this.head = 0;
              this.count = 0;
          };

          MyCircularQueue.prototype.enQueue = function(value) {
              if (this.count === this.k) return false;
              this.buf[(this.head + this.count) % this.k] = value;
              this.count++;
              return true;
          };

          MyCircularQueue.prototype.deQueue = function() {
              if (this.count === 0) return false;
              this.head = (this.head + 1) % this.k;
              this.count--;
              return true;
          };

          MyCircularQueue.prototype.Front = function() {
              return this.count === 0 ? -1 : this.buf[this.head];
          };

          MyCircularQueue.prototype.Rear = function() {
              return this.count === 0 ? -1 : this.buf[(this.head + this.count - 1) % this.k];
          };

          MyCircularQueue.prototype.isEmpty = function() {
              return this.count === 0;
          };

          MyCircularQueue.prototype.isFull = function() {
              return this.count === this.k;
          };
        `,
        typescript: code`
          class MyCircularQueue {
              k: number;
              buf: number[];
              head: number;
              count: number;

              constructor(k: number) {
                  this.k = k;
                  this.buf = [];
                  this.head = 0;
                  this.count = 0;
              }

              enQueue(value: number): boolean {
                  if (this.count === this.k) return false;
                  this.buf[(this.head + this.count) % this.k] = value;
                  this.count++;
                  return true;
              }

              deQueue(): boolean {
                  if (this.count === 0) return false;
                  this.head = (this.head + 1) % this.k;
                  this.count--;
                  return true;
              }

              Front(): number {
                  return this.count === 0 ? -1 : this.buf[this.head];
              }

              Rear(): number {
                  return this.count === 0 ? -1 : this.buf[(this.head + this.count - 1) % this.k];
              }

              isEmpty(): boolean {
                  return this.count === 0;
              }

              isFull(): boolean {
                  return this.count === this.k;
              }
          }
        `,
        java: code`
          class MyCircularQueue {
              private int[] buf;
              private int head = 0, count = 0;

              public MyCircularQueue(int k) {
                  buf = new int[k];
              }

              public boolean enQueue(int value) {
                  if (count == buf.length) return false;
                  buf[(head + count) % buf.length] = value;
                  count++;
                  return true;
              }

              public boolean deQueue() {
                  if (count == 0) return false;
                  head = (head + 1) % buf.length;
                  count--;
                  return true;
              }

              public int Front() {
                  return count == 0 ? -1 : buf[head];
              }

              public int Rear() {
                  return count == 0 ? -1 : buf[(head + count - 1) % buf.length];
              }

              public boolean isEmpty() {
                  return count == 0;
              }

              public boolean isFull() {
                  return count == buf.length;
              }
          }
        `,
        cpp: code`
          class MyCircularQueue {
              vector<int> buf;
              int head = 0, count = 0;
          public:
              MyCircularQueue(int k) : buf(k) {}

              bool enQueue(int value) {
                  if (count == (int)buf.size()) return false;
                  buf[(head + count) % buf.size()] = value;
                  count++;
                  return true;
              }

              bool deQueue() {
                  if (count == 0) return false;
                  head = (head + 1) % buf.size();
                  count--;
                  return true;
              }

              int Front() {
                  return count == 0 ? -1 : buf[head];
              }

              int Rear() {
                  return count == 0 ? -1 : buf[(head + count - 1) % buf.size()];
              }

              bool isEmpty() {
                  return count == 0;
              }

              bool isFull() {
                  return count == (int)buf.size();
              }
          };
        `,
        c: code`
          typedef struct {
              int* buf;
              int k, head, count;
          } MyCircularQueue;

          MyCircularQueue* myCircularQueueCreate(int k) {
              MyCircularQueue* q = (MyCircularQueue*)malloc(sizeof(MyCircularQueue));
              q->buf = (int*)malloc(k * sizeof(int));
              q->k = k;
              q->head = 0;
              q->count = 0;
              return q;
          }

          bool myCircularQueueEnQueue(MyCircularQueue* obj, int value) {
              if (obj->count == obj->k) return false;
              obj->buf[(obj->head + obj->count) % obj->k] = value;
              obj->count++;
              return true;
          }

          bool myCircularQueueDeQueue(MyCircularQueue* obj) {
              if (obj->count == 0) return false;
              obj->head = (obj->head + 1) % obj->k;
              obj->count--;
              return true;
          }

          int myCircularQueueFront(MyCircularQueue* obj) {
              return obj->count == 0 ? -1 : obj->buf[obj->head];
          }

          int myCircularQueueRear(MyCircularQueue* obj) {
              return obj->count == 0 ? -1 : obj->buf[(obj->head + obj->count - 1) % obj->k];
          }

          bool myCircularQueueIsEmpty(MyCircularQueue* obj) {
              return obj->count == 0;
          }

          bool myCircularQueueIsFull(MyCircularQueue* obj) {
              return obj->count == obj->k;
          }

          void myCircularQueueFree(MyCircularQueue* obj) {
              free(obj->buf);
              free(obj);
          }
        `,
        csharp: code`
          public class MyCircularQueue {
              private int[] buf;
              private int head = 0, count = 0;

              public MyCircularQueue(int k) {
                  buf = new int[k];
              }

              public bool EnQueue(int value) {
                  if (count == buf.Length) return false;
                  buf[(head + count) % buf.Length] = value;
                  count++;
                  return true;
              }

              public bool DeQueue() {
                  if (count == 0) return false;
                  head = (head + 1) % buf.Length;
                  count--;
                  return true;
              }

              public int Front() {
                  return count == 0 ? -1 : buf[head];
              }

              public int Rear() {
                  return count == 0 ? -1 : buf[(head + count - 1) % buf.Length];
              }

              public bool IsEmpty() {
                  return count == 0;
              }

              public bool IsFull() {
                  return count == buf.Length;
              }
          }
        `,
        go: code`
          type MyCircularQueue struct {
          	buf         []int
          	head, count int
          }

          func Constructor(k int) MyCircularQueue {
          	return MyCircularQueue{buf: make([]int, k)}
          }

          func (this *MyCircularQueue) EnQueue(value int) bool {
          	if this.count == len(this.buf) {
          		return false
          	}
          	this.buf[(this.head+this.count)%len(this.buf)] = value
          	this.count++
          	return true
          }

          func (this *MyCircularQueue) DeQueue() bool {
          	if this.count == 0 {
          		return false
          	}
          	this.head = (this.head + 1) % len(this.buf)
          	this.count--
          	return true
          }

          func (this *MyCircularQueue) Front() int {
          	if this.count == 0 {
          		return -1
          	}
          	return this.buf[this.head]
          }

          func (this *MyCircularQueue) Rear() int {
          	if this.count == 0 {
          		return -1
          	}
          	return this.buf[(this.head+this.count-1)%len(this.buf)]
          }

          func (this *MyCircularQueue) IsEmpty() bool {
          	return this.count == 0
          }

          func (this *MyCircularQueue) IsFull() bool {
          	return this.count == len(this.buf)
          }
        `,
        kotlin: code`
          class MyCircularQueue(k: Int) {
              private val buf = IntArray(k)
              private var head = 0
              private var count = 0

              fun enQueue(value: Int): Boolean {
                  if (count == buf.size) return false
                  buf[(head + count) % buf.size] = value
                  count++
                  return true
              }

              fun deQueue(): Boolean {
                  if (count == 0) return false
                  head = (head + 1) % buf.size
                  count--
                  return true
              }

              fun Front(): Int = if (count == 0) -1 else buf[head]

              fun Rear(): Int = if (count == 0) -1 else buf[(head + count - 1) % buf.size]

              fun isEmpty(): Boolean = count == 0

              fun isFull(): Boolean = count == buf.size
          }
        `,
        swift: code`
          class MyCircularQueue {
              var buf: [Int]
              var head = 0
              var count = 0

              init(_ k: Int) {
                  buf = [Int](repeating: 0, count: k)
              }

              func enQueue(_ value: Int) -> Bool {
                  if count == buf.count { return false }
                  buf[(head + count) % buf.count] = value
                  count += 1
                  return true
              }

              func deQueue() -> Bool {
                  if count == 0 { return false }
                  head = (head + 1) % buf.count
                  count -= 1
                  return true
              }

              func Front() -> Int {
                  return count == 0 ? -1 : buf[head]
              }

              func Rear() -> Int {
                  return count == 0 ? -1 : buf[(head + count - 1) % buf.count]
              }

              func isEmpty() -> Bool {
                  return count == 0
              }

              func isFull() -> Bool {
                  return count == buf.count
              }
          }
        `,
        rust: code`
          struct MyCircularQueue {
              buf: Vec<i32>,
              head: usize,
              count: usize,
          }

          impl MyCircularQueue {
              fn new(k: i32) -> Self { MyCircularQueue { buf: vec![0; k as usize], head: 0, count: 0 } }

              fn enQueue(&mut self, value: i32) -> bool {
                  let k = self.buf.len();
                  if self.count == k { return false; }
                  self.buf[(self.head + self.count) % k] = value;
                  self.count += 1;
                  true
              }

              fn deQueue(&mut self) -> bool {
                  if self.count == 0 { return false; }
                  self.head = (self.head + 1) % self.buf.len();
                  self.count -= 1;
                  true
              }

              fn Front(&mut self) -> i32 {
                  if self.count == 0 { -1 } else { self.buf[self.head] }
              }

              fn Rear(&mut self) -> i32 {
                  if self.count == 0 { -1 } else { self.buf[(self.head + self.count - 1) % self.buf.len()] }
              }

              fn isEmpty(&mut self) -> bool { self.count == 0 }

              fn isFull(&mut self) -> bool { self.count == self.buf.len() }
          }
        `,
        php: code`
          class MyCircularQueue {
              private $buf;
              private $k;
              private $head = 0;
              private $count = 0;

              function __construct($k) {
                  $this->k = $k;
                  $this->buf = array_fill(0, $k, 0);
              }

              function enQueue($value) {
                  if ($this->count == $this->k) return false;
                  $this->buf[($this->head + $this->count) % $this->k] = $value;
                  $this->count++;
                  return true;
              }

              function deQueue() {
                  if ($this->count == 0) return false;
                  $this->head = ($this->head + 1) % $this->k;
                  $this->count--;
                  return true;
              }

              function Front() {
                  return $this->count == 0 ? -1 : $this->buf[$this->head];
              }

              function Rear() {
                  return $this->count == 0 ? -1 : $this->buf[($this->head + $this->count - 1) % $this->k];
              }

              function isEmpty() {
                  return $this->count == 0;
              }

              function isFull() {
                  return $this->count == $this->k;
              }
          }
        `,
        ruby: code`
          class MyCircularQueue
            def initialize(k)
              @buf = Array.new(k, 0)
              @head = 0
              @count = 0
            end

            def enQueue(value)
              return false if @count == @buf.length
              @buf[(@head + @count) % @buf.length] = value
              @count += 1
              true
            end

            def deQueue
              return false if @count == 0
              @head = (@head + 1) % @buf.length
              @count -= 1
              true
            end

            def Front
              @count == 0 ? -1 : @buf[@head]
            end

            def Rear
              @count == 0 ? -1 : @buf[(@head + @count - 1) % @buf.length]
            end

            def isEmpty
              @count == 0
            end

            def isFull
              @count == @buf.length
            end
          end
        `,
      },
    };
  })(),

  // ── Design Circular Deque (LC 641) ────────────────────────────────
  (() => {
    const run = (ops: string[], args: number[][]) => {
      let k = 0;
      const d: number[] = [];
      return ops.map((op, i) => {
        switch (op) {
          case "MyCircularDeque": k = args[i][0]; return null;
          case "insertFront": if (d.length === k) return false; d.unshift(args[i][0]); return true;
          case "insertLast": if (d.length === k) return false; d.push(args[i][0]); return true;
          case "deleteFront": if (d.length === 0) return false; d.shift(); return true;
          case "deleteLast": if (d.length === 0) return false; d.pop(); return true;
          case "getFront": return d.length ? d[0] : -1;
          case "getRear": return d.length ? d[d.length - 1] : -1;
          case "isEmpty": return d.length === 0;
          default: return d.length === k;
        }
      });
    };
    const ex = [
      { ops: ["MyCircularDeque", "insertLast", "insertLast", "insertFront", "insertFront", "getRear", "isFull", "deleteLast", "insertFront", "getFront"], args: [[3], [1], [2], [3], [4], [], [], [], [4], []] },
      { ops: ["MyCircularDeque", "getFront", "deleteLast", "insertFront", "insertLast", "getRear", "deleteFront", "getFront", "isEmpty"], args: [[2], [], [], [5], [8], [], [], [], []] },
    ];
    return {
      slug: "design-circular-deque",
      title: "Design Circular Deque",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Queue", "Design", "Amazon", "Microsoft", "Google"],
      signature: {
        funcName: "MyCircularDeque", params: [{ name: "k", type: "int" as const }], returns: "void" as const,
        methods: [
          { name: "insertFront", params: [{ name: "value", type: "int" as const }], returns: "bool" as const },
          { name: "insertLast", params: [{ name: "value", type: "int" as const }], returns: "bool" as const },
          { name: "deleteFront", params: [], returns: "bool" as const },
          { name: "deleteLast", params: [], returns: "bool" as const },
          { name: "getFront", params: [], returns: "int" as const },
          { name: "getRear", params: [], returns: "int" as const },
          { name: "isEmpty", params: [], returns: "bool" as const },
          { name: "isFull", params: [], returns: "bool" as const },
        ],
      },
      description: describe(
        "Implement a **circular double-ended queue** of fixed capacity, where elements can be added and removed at both ends, without using a built-in deque. Write the class `MyCircularDeque`:\n\n- `MyCircularDeque(int k)` creates a deque that holds at most `k` elements.\n- `boolean insertFront(int value)` / `boolean insertLast(int value)` add `value` at the front / back; they return `true` on success and `false` if the deque is full.\n- `boolean deleteFront()` / `boolean deleteLast()` remove the front / back element; they return `true` on success and `false` if the deque is empty.\n- `int getFront()` / `int getRear()` return the front / back element, or `-1` if the deque is empty.\n- `boolean isEmpty()` / `boolean isFull()` report whether the deque is empty / full.\n\n" + CALLS,
        [
          exOf(ex[0].ops, ex[0].args, run, "Capacity 3 holds [3,1,2]; inserting 4 at the front fails. The rear is 2. After deleteLast the deque is [3,1], so 4 fits at the front and becomes getFront."),
          exOf(ex[1].ops, ex[1].args, run, "An empty deque answers -1 and refuses to delete. After [5,8], the rear is 8; deleting the front leaves 8 at both ends."),
        ],
        ["1 <= k <= 1000", "0 <= value <= 1000", "At most 2000 calls are made to insertFront, insertLast, deleteFront, deleteLast, getFront, getRear, isEmpty and isFull"]),
      hints: [
        "This is a circular queue that can also grow and shrink at the front.",
        "Keep `front` (index of the first element) and `count` in an array of size `k`; the last element is at `(front + count - 1) % k`.",
        "insertFront moves `front` one step back — `(front - 1 + k) % k` keeps it non-negative — and writes there; deleteFront moves it one step forward. The back end only changes `count`.",
      ],
      editorial: explain({
        idea: "A ring buffer with a front index and a count. Both ends are reachable in O(1): the front is `front`, the back is `front + count - 1`, each taken modulo `k`; adding at the front steps `front` backwards around the ring.",
        steps: [
          "Store `buf` of size `k`, `front = 0`, `count = 0`.",
          "`insertFront(v)`: if full return false; `front = (front - 1 + k) % k`, `buf[front] = v`, `count++`.",
          "`insertLast(v)`: if full return false; `buf[(front + count) % k] = v`, `count++`.",
          "`deleteFront()`: if empty return false; `front = (front + 1) % k`, `count--`. `deleteLast()`: if empty return false; `count--`.",
          "`getFront()` is `buf[front]`, `getRear()` is `buf[(front + count - 1) % k]` (each -1 when empty); `isEmpty` / `isFull` compare `count` with 0 / `k`.",
        ],
        why: "The elements always occupy the `count` consecutive ring positions starting at `front`. Each operation either extends or shrinks that run by one slot at the appropriate end and leaves every other element in place, so the deque order is kept and no element is ever moved.",
        time: "O(1) per operation",
        space: "O(k)",
        pitfalls: [
          "`(front - 1) % k` is negative for `front = 0` in C, C++, Java, Go, JavaScript and others — add `k` first.",
          "Return -1 from getFront / getRear on an empty deque.",
        ],
      }),
      examples: ex.map((e) => caseOf(e.ops, e.args, run)),
      gen: (rng: Rng) => {
        const k = rng() < 0.05 ? 1000 : ri(rng, 1, pick(rng, [1, 3, 6]));
        const ops = ["MyCircularDeque"], args: number[][] = [[k]];
        const choices = ["insertFront", "insertLast", "insertFront", "insertLast", "deleteFront", "deleteLast", "getFront", "getRear", "isEmpty", "isFull"];
        for (let m = ri(rng, 1, pick(rng, [5, 20, 40])); m > 0; m--) {
          const op = pick(rng, choices);
          ops.push(op);
          args.push(op.startsWith("insert") ? [ri(rng, 0, pick(rng, [9, 1000]))] : []);
        }
        return caseOf(ops, args, run);
      },
      solutions: {
        python: code`
          class MyCircularDeque:

              def __init__(self, k: int):
                  self.buf = [0] * k
                  self.k = k
                  self.front = 0
                  self.count = 0

              def insertFront(self, value: int) -> bool:
                  if self.count == self.k:
                      return False
                  self.front = (self.front - 1) % self.k
                  self.buf[self.front] = value
                  self.count += 1
                  return True

              def insertLast(self, value: int) -> bool:
                  if self.count == self.k:
                      return False
                  self.buf[(self.front + self.count) % self.k] = value
                  self.count += 1
                  return True

              def deleteFront(self) -> bool:
                  if self.count == 0:
                      return False
                  self.front = (self.front + 1) % self.k
                  self.count -= 1
                  return True

              def deleteLast(self) -> bool:
                  if self.count == 0:
                      return False
                  self.count -= 1
                  return True

              def getFront(self) -> int:
                  return self.buf[self.front] if self.count else -1

              def getRear(self) -> int:
                  return self.buf[(self.front + self.count - 1) % self.k] if self.count else -1

              def isEmpty(self) -> bool:
                  return self.count == 0

              def isFull(self) -> bool:
                  return self.count == self.k
        `,
        javascript: code`
          var MyCircularDeque = function(k) {
              this.k = k;
              this.buf = [];
              this.front = 0;
              this.count = 0;
          };

          MyCircularDeque.prototype.insertFront = function(value) {
              if (this.count === this.k) return false;
              this.front = (this.front - 1 + this.k) % this.k;
              this.buf[this.front] = value;
              this.count++;
              return true;
          };

          MyCircularDeque.prototype.insertLast = function(value) {
              if (this.count === this.k) return false;
              this.buf[(this.front + this.count) % this.k] = value;
              this.count++;
              return true;
          };

          MyCircularDeque.prototype.deleteFront = function() {
              if (this.count === 0) return false;
              this.front = (this.front + 1) % this.k;
              this.count--;
              return true;
          };

          MyCircularDeque.prototype.deleteLast = function() {
              if (this.count === 0) return false;
              this.count--;
              return true;
          };

          MyCircularDeque.prototype.getFront = function() {
              return this.count === 0 ? -1 : this.buf[this.front];
          };

          MyCircularDeque.prototype.getRear = function() {
              return this.count === 0 ? -1 : this.buf[(this.front + this.count - 1) % this.k];
          };

          MyCircularDeque.prototype.isEmpty = function() {
              return this.count === 0;
          };

          MyCircularDeque.prototype.isFull = function() {
              return this.count === this.k;
          };
        `,
        typescript: code`
          class MyCircularDeque {
              k: number;
              buf: number[];
              front: number;
              count: number;

              constructor(k: number) {
                  this.k = k;
                  this.buf = [];
                  this.front = 0;
                  this.count = 0;
              }

              insertFront(value: number): boolean {
                  if (this.count === this.k) return false;
                  this.front = (this.front - 1 + this.k) % this.k;
                  this.buf[this.front] = value;
                  this.count++;
                  return true;
              }

              insertLast(value: number): boolean {
                  if (this.count === this.k) return false;
                  this.buf[(this.front + this.count) % this.k] = value;
                  this.count++;
                  return true;
              }

              deleteFront(): boolean {
                  if (this.count === 0) return false;
                  this.front = (this.front + 1) % this.k;
                  this.count--;
                  return true;
              }

              deleteLast(): boolean {
                  if (this.count === 0) return false;
                  this.count--;
                  return true;
              }

              getFront(): number {
                  return this.count === 0 ? -1 : this.buf[this.front];
              }

              getRear(): number {
                  return this.count === 0 ? -1 : this.buf[(this.front + this.count - 1) % this.k];
              }

              isEmpty(): boolean {
                  return this.count === 0;
              }

              isFull(): boolean {
                  return this.count === this.k;
              }
          }
        `,
        java: code`
          class MyCircularDeque {
              private int[] buf;
              private int k, front = 0, count = 0;

              public MyCircularDeque(int k) {
                  this.k = k;
                  buf = new int[k];
              }

              public boolean insertFront(int value) {
                  if (count == k) return false;
                  front = (front - 1 + k) % k;
                  buf[front] = value;
                  count++;
                  return true;
              }

              public boolean insertLast(int value) {
                  if (count == k) return false;
                  buf[(front + count) % k] = value;
                  count++;
                  return true;
              }

              public boolean deleteFront() {
                  if (count == 0) return false;
                  front = (front + 1) % k;
                  count--;
                  return true;
              }

              public boolean deleteLast() {
                  if (count == 0) return false;
                  count--;
                  return true;
              }

              public int getFront() {
                  return count == 0 ? -1 : buf[front];
              }

              public int getRear() {
                  return count == 0 ? -1 : buf[(front + count - 1) % k];
              }

              public boolean isEmpty() {
                  return count == 0;
              }

              public boolean isFull() {
                  return count == k;
              }
          }
        `,
        cpp: code`
          class MyCircularDeque {
              vector<int> buf;
              int k, front = 0, count = 0;
          public:
              MyCircularDeque(int k) : buf(k), k(k) {}

              bool insertFront(int value) {
                  if (count == k) return false;
                  front = (front - 1 + k) % k;
                  buf[front] = value;
                  count++;
                  return true;
              }

              bool insertLast(int value) {
                  if (count == k) return false;
                  buf[(front + count) % k] = value;
                  count++;
                  return true;
              }

              bool deleteFront() {
                  if (count == 0) return false;
                  front = (front + 1) % k;
                  count--;
                  return true;
              }

              bool deleteLast() {
                  if (count == 0) return false;
                  count--;
                  return true;
              }

              int getFront() {
                  return count == 0 ? -1 : buf[front];
              }

              int getRear() {
                  return count == 0 ? -1 : buf[(front + count - 1) % k];
              }

              bool isEmpty() {
                  return count == 0;
              }

              bool isFull() {
                  return count == k;
              }
          };
        `,
        c: code`
          typedef struct {
              int* buf;
              int k, front, count;
          } MyCircularDeque;

          MyCircularDeque* myCircularDequeCreate(int k) {
              MyCircularDeque* d = (MyCircularDeque*)malloc(sizeof(MyCircularDeque));
              d->buf = (int*)malloc(k * sizeof(int));
              d->k = k;
              d->front = 0;
              d->count = 0;
              return d;
          }

          bool myCircularDequeInsertFront(MyCircularDeque* obj, int value) {
              if (obj->count == obj->k) return false;
              obj->front = (obj->front - 1 + obj->k) % obj->k;
              obj->buf[obj->front] = value;
              obj->count++;
              return true;
          }

          bool myCircularDequeInsertLast(MyCircularDeque* obj, int value) {
              if (obj->count == obj->k) return false;
              obj->buf[(obj->front + obj->count) % obj->k] = value;
              obj->count++;
              return true;
          }

          bool myCircularDequeDeleteFront(MyCircularDeque* obj) {
              if (obj->count == 0) return false;
              obj->front = (obj->front + 1) % obj->k;
              obj->count--;
              return true;
          }

          bool myCircularDequeDeleteLast(MyCircularDeque* obj) {
              if (obj->count == 0) return false;
              obj->count--;
              return true;
          }

          int myCircularDequeGetFront(MyCircularDeque* obj) {
              return obj->count == 0 ? -1 : obj->buf[obj->front];
          }

          int myCircularDequeGetRear(MyCircularDeque* obj) {
              return obj->count == 0 ? -1 : obj->buf[(obj->front + obj->count - 1) % obj->k];
          }

          bool myCircularDequeIsEmpty(MyCircularDeque* obj) {
              return obj->count == 0;
          }

          bool myCircularDequeIsFull(MyCircularDeque* obj) {
              return obj->count == obj->k;
          }

          void myCircularDequeFree(MyCircularDeque* obj) {
              free(obj->buf);
              free(obj);
          }
        `,
        csharp: code`
          public class MyCircularDeque {
              private int[] buf;
              private int k, front = 0, count = 0;

              public MyCircularDeque(int k) {
                  this.k = k;
                  buf = new int[k];
              }

              public bool InsertFront(int value) {
                  if (count == k) return false;
                  front = (front - 1 + k) % k;
                  buf[front] = value;
                  count++;
                  return true;
              }

              public bool InsertLast(int value) {
                  if (count == k) return false;
                  buf[(front + count) % k] = value;
                  count++;
                  return true;
              }

              public bool DeleteFront() {
                  if (count == 0) return false;
                  front = (front + 1) % k;
                  count--;
                  return true;
              }

              public bool DeleteLast() {
                  if (count == 0) return false;
                  count--;
                  return true;
              }

              public int GetFront() {
                  return count == 0 ? -1 : buf[front];
              }

              public int GetRear() {
                  return count == 0 ? -1 : buf[(front + count - 1) % k];
              }

              public bool IsEmpty() {
                  return count == 0;
              }

              public bool IsFull() {
                  return count == k;
              }
          }
        `,
        go: code`
          type MyCircularDeque struct {
          	buf                []int
          	k, front, count int
          }

          func Constructor(k int) MyCircularDeque {
          	return MyCircularDeque{buf: make([]int, k), k: k}
          }

          func (this *MyCircularDeque) InsertFront(value int) bool {
          	if this.count == this.k {
          		return false
          	}
          	this.front = (this.front - 1 + this.k) % this.k
          	this.buf[this.front] = value
          	this.count++
          	return true
          }

          func (this *MyCircularDeque) InsertLast(value int) bool {
          	if this.count == this.k {
          		return false
          	}
          	this.buf[(this.front+this.count)%this.k] = value
          	this.count++
          	return true
          }

          func (this *MyCircularDeque) DeleteFront() bool {
          	if this.count == 0 {
          		return false
          	}
          	this.front = (this.front + 1) % this.k
          	this.count--
          	return true
          }

          func (this *MyCircularDeque) DeleteLast() bool {
          	if this.count == 0 {
          		return false
          	}
          	this.count--
          	return true
          }

          func (this *MyCircularDeque) GetFront() int {
          	if this.count == 0 {
          		return -1
          	}
          	return this.buf[this.front]
          }

          func (this *MyCircularDeque) GetRear() int {
          	if this.count == 0 {
          		return -1
          	}
          	return this.buf[(this.front+this.count-1)%this.k]
          }

          func (this *MyCircularDeque) IsEmpty() bool {
          	return this.count == 0
          }

          func (this *MyCircularDeque) IsFull() bool {
          	return this.count == this.k
          }
        `,
        kotlin: code`
          class MyCircularDeque(k: Int) {
              private val k = k
              private val buf = IntArray(k)
              private var front = 0
              private var count = 0

              fun insertFront(value: Int): Boolean {
                  if (count == k) return false
                  front = (front - 1 + k) % k
                  buf[front] = value
                  count++
                  return true
              }

              fun insertLast(value: Int): Boolean {
                  if (count == k) return false
                  buf[(front + count) % k] = value
                  count++
                  return true
              }

              fun deleteFront(): Boolean {
                  if (count == 0) return false
                  front = (front + 1) % k
                  count--
                  return true
              }

              fun deleteLast(): Boolean {
                  if (count == 0) return false
                  count--
                  return true
              }

              fun getFront(): Int = if (count == 0) -1 else buf[front]

              fun getRear(): Int = if (count == 0) -1 else buf[(front + count - 1) % k]

              fun isEmpty(): Boolean = count == 0

              fun isFull(): Boolean = count == k
          }
        `,
        swift: code`
          class MyCircularDeque {
              var buf: [Int]
              let k: Int
              var front = 0
              var count = 0

              init(_ k: Int) {
                  self.k = k
                  buf = [Int](repeating: 0, count: k)
              }

              func insertFront(_ value: Int) -> Bool {
                  if count == k { return false }
                  front = (front - 1 + k) % k
                  buf[front] = value
                  count += 1
                  return true
              }

              func insertLast(_ value: Int) -> Bool {
                  if count == k { return false }
                  buf[(front + count) % k] = value
                  count += 1
                  return true
              }

              func deleteFront() -> Bool {
                  if count == 0 { return false }
                  front = (front + 1) % k
                  count -= 1
                  return true
              }

              func deleteLast() -> Bool {
                  if count == 0 { return false }
                  count -= 1
                  return true
              }

              func getFront() -> Int {
                  return count == 0 ? -1 : buf[front]
              }

              func getRear() -> Int {
                  return count == 0 ? -1 : buf[(front + count - 1) % k]
              }

              func isEmpty() -> Bool {
                  return count == 0
              }

              func isFull() -> Bool {
                  return count == k
              }
          }
        `,
        rust: code`
          struct MyCircularDeque {
              buf: Vec<i32>,
              k: usize,
              front: usize,
              count: usize,
          }

          impl MyCircularDeque {
              fn new(k: i32) -> Self {
                  MyCircularDeque { buf: vec![0; k as usize], k: k as usize, front: 0, count: 0 }
              }

              fn insertFront(&mut self, value: i32) -> bool {
                  if self.count == self.k { return false; }
                  self.front = (self.front + self.k - 1) % self.k;
                  self.buf[self.front] = value;
                  self.count += 1;
                  true
              }

              fn insertLast(&mut self, value: i32) -> bool {
                  if self.count == self.k { return false; }
                  self.buf[(self.front + self.count) % self.k] = value;
                  self.count += 1;
                  true
              }

              fn deleteFront(&mut self) -> bool {
                  if self.count == 0 { return false; }
                  self.front = (self.front + 1) % self.k;
                  self.count -= 1;
                  true
              }

              fn deleteLast(&mut self) -> bool {
                  if self.count == 0 { return false; }
                  self.count -= 1;
                  true
              }

              fn getFront(&mut self) -> i32 {
                  if self.count == 0 { -1 } else { self.buf[self.front] }
              }

              fn getRear(&mut self) -> i32 {
                  if self.count == 0 { -1 } else { self.buf[(self.front + self.count - 1) % self.k] }
              }

              fn isEmpty(&mut self) -> bool { self.count == 0 }

              fn isFull(&mut self) -> bool { self.count == self.k }
          }
        `,
        php: code`
          class MyCircularDeque {
              private $buf;
              private $k;
              private $front = 0;
              private $count = 0;

              function __construct($k) {
                  $this->k = $k;
                  $this->buf = array_fill(0, $k, 0);
              }

              function insertFront($value) {
                  if ($this->count == $this->k) return false;
                  $this->front = ($this->front - 1 + $this->k) % $this->k;
                  $this->buf[$this->front] = $value;
                  $this->count++;
                  return true;
              }

              function insertLast($value) {
                  if ($this->count == $this->k) return false;
                  $this->buf[($this->front + $this->count) % $this->k] = $value;
                  $this->count++;
                  return true;
              }

              function deleteFront() {
                  if ($this->count == 0) return false;
                  $this->front = ($this->front + 1) % $this->k;
                  $this->count--;
                  return true;
              }

              function deleteLast() {
                  if ($this->count == 0) return false;
                  $this->count--;
                  return true;
              }

              function getFront() {
                  return $this->count == 0 ? -1 : $this->buf[$this->front];
              }

              function getRear() {
                  return $this->count == 0 ? -1 : $this->buf[($this->front + $this->count - 1) % $this->k];
              }

              function isEmpty() {
                  return $this->count == 0;
              }

              function isFull() {
                  return $this->count == $this->k;
              }
          }
        `,
        ruby: code`
          class MyCircularDeque
            def initialize(k)
              @k = k
              @buf = Array.new(k, 0)
              @front = 0
              @count = 0
            end

            def insertFront(value)
              return false if @count == @k
              @front = (@front - 1) % @k # Ruby's % is never negative
              @buf[@front] = value
              @count += 1
              true
            end

            def insertLast(value)
              return false if @count == @k
              @buf[(@front + @count) % @k] = value
              @count += 1
              true
            end

            def deleteFront
              return false if @count == 0
              @front = (@front + 1) % @k
              @count -= 1
              true
            end

            def deleteLast
              return false if @count == 0
              @count -= 1
              true
            end

            def getFront
              @count == 0 ? -1 : @buf[@front]
            end

            def getRear
              @count == 0 ? -1 : @buf[(@front + @count - 1) % @k]
            end

            def isEmpty
              @count == 0
            end

            def isFull
              @count == @k
            end
          end
        `,
      },
    };
  })(),

  // ── Design Linked List (LC 707) ───────────────────────────────────
  (() => {
    const run = (ops: string[], args: number[][]) => {
      const a: number[] = [];
      return ops.map((op, i) => {
        const [x, y] = args[i];
        switch (op) {
          case "get": return x < a.length ? a[x] : -1;
          case "addAtHead": a.unshift(x); return null;
          case "addAtTail": a.push(x); return null;
          case "addAtIndex": if (x <= a.length) a.splice(x, 0, y); return null;
          case "deleteAtIndex": if (x < a.length) a.splice(x, 1); return null;
          default: return null;
        }
      });
    };
    const ex = [
      { ops: ["MyLinkedList", "addAtHead", "addAtTail", "addAtIndex", "get", "deleteAtIndex", "get"], args: [[], [1], [3], [1, 2], [1], [1], [1]] },
      { ops: ["MyLinkedList", "get", "addAtIndex", "addAtIndex", "addAtTail", "deleteAtIndex", "get", "get"], args: [[], [0], [1, 9], [0, 4], [6], [5], [0], [1]] },
    ];
    return {
      slug: "design-linked-list",
      title: "Design Linked List",
      difficulty: "MEDIUM" as const,
      tags: ["Linked List", "Simulation", "Design", "Amazon", "Microsoft", "Google"],
      signature: {
        funcName: "MyLinkedList", params: [], returns: "void" as const,
        methods: [
          { name: "get", params: [{ name: "index", type: "int" as const }], returns: "int" as const },
          { name: "addAtHead", params: [{ name: "value", type: "int" as const }], returns: "void" as const },
          { name: "addAtTail", params: [{ name: "value", type: "int" as const }], returns: "void" as const },
          { name: "addAtIndex", params: [{ name: "index", type: "int" as const }, { name: "value", type: "int" as const }], returns: "void" as const },
          { name: "deleteAtIndex", params: [{ name: "index", type: "int" as const }], returns: "void" as const },
        ],
      },
      description: describe(
        "Implement your own linked list (singly or doubly linked, without the built-in list type). Positions are 0-indexed. Write the class `MyLinkedList`:\n\n- `MyLinkedList()` creates an empty list.\n- `int get(int index)` returns the value of the node at position `index`, or `-1` if `index` is out of range.\n- `void addAtHead(int value)` inserts a node with `value` before the first node; it becomes the new head.\n- `void addAtTail(int value)` appends a node with `value` after the last node.\n- `void addAtIndex(int index, int value)` inserts a node with `value` so that it ends up at position `index`. If `index` equals the length it is appended; if `index` is greater than the length nothing is inserted.\n- `void deleteAtIndex(int index)` removes the node at position `index` if it exists.\n\n" + CALLS,
        [
          exOf(ex[0].ops, ex[0].args, run, "The list goes [1] → [1,3] → [1,2,3], so position 1 holds 2. Deleting position 1 leaves [1,3], and position 1 now holds 3."),
          exOf(ex[1].ops, ex[1].args, run, "An empty list has no position 0. Inserting at index 1 of an empty list is out of range and ignored; index 0 works. After [4,6], deleting position 5 does nothing."),
        ],
        ["0 <= index, value <= 1000", "At most 2000 calls are made to get, addAtHead, addAtTail, addAtIndex and deleteAtIndex"]),
      hints: [
        "Every operation needs to reach a position, so they all share one walk: from the head, follow `next` pointers `index` times.",
        "Inserting or deleting at position `index` changes the node *before* it. A dummy (sentinel) node in front of the head means every position has a node before it, the head included.",
        "Keep the length in a counter, so out-of-range indexes are rejected before walking.",
      ],
      editorial: explain({
        idea: "A singly linked list with a dummy node before the head and a size counter. To act at position `i`, walk `i` steps from the dummy to reach the node just before it; inserting and deleting then rewire one `next` pointer.",
        steps: [
          "Keep `dummy` (its `next` is the head) and `size`.",
          "`get(i)`: if `i >= size` return -1; otherwise walk `i + 1` steps from `dummy` and return that node's value.",
          "`addAtIndex(i, v)`: if `i > size` do nothing. Otherwise walk `i` steps from `dummy` to node `p`, create a node with `next = p.next`, set `p.next` to it, increment `size`.",
          "`addAtHead(v)` is `addAtIndex(0, v)`; `addAtTail(v)` is `addAtIndex(size, v)`.",
          "`deleteAtIndex(i)`: if `i >= size` do nothing. Otherwise walk `i` steps to `p`, set `p.next = p.next.next`, decrement `size`.",
        ],
        why: "After `i` steps from the dummy you stand on the node before position `i` (the dummy itself for `i = 0`), so splicing a node in after it puts the new node exactly at position `i`, and unlinking its successor removes exactly position `i`. The size check makes the walk never run off the end.",
        time: "O(i) for an operation at position i (O(1) at the head); O(n) for addAtTail without a tail pointer",
        space: "O(n)",
        pitfalls: [
          "`addAtIndex` with `index == size` appends; only `index > size` is ignored.",
          "Without a dummy node, inserting or deleting at position 0 needs separate head-handling code — the usual source of bugs.",
          "Update the size on every successful insert and delete, and only then.",
        ],
      }),
      examples: ex.map((e) => caseOf(e.ops, e.args, run)),
      gen: (rng: Rng) => {
        const vtop = pick(rng, [9, 1000]);
        const ops = ["MyLinkedList"], args: number[][] = [[]];
        let len = 0;
        for (let m = ri(rng, 1, pick(rng, [5, 20, 40])); m > 0; m--) {
          const r = rng(), idx = rng() < 0.1 ? ri(rng, 0, 1000) : ri(rng, 0, len + 1);
          if (r < 0.2) { ops.push("addAtHead"); args.push([ri(rng, 0, vtop)]); len++; }
          else if (r < 0.4) { ops.push("addAtTail"); args.push([ri(rng, 0, vtop)]); len++; }
          else if (r < 0.6) { ops.push("addAtIndex"); args.push([idx, ri(rng, 0, vtop)]); if (idx <= len) len++; }
          else if (r < 0.75) { ops.push("deleteAtIndex"); args.push([idx]); if (idx < len) len--; }
          else { ops.push("get"); args.push([idx]); }
        }
        return caseOf(ops, args, run);
      },
      solutions: {
        python: code`
          class Node:
              __slots__ = ("value", "next")

              def __init__(self, value, nxt=None):
                  self.value = value
                  self.next = nxt

          class MyLinkedList:

              def __init__(self):
                  self.dummy = Node(0)  # dummy.next is the head
                  self.size = 0

              def _before(self, index):
                  p = self.dummy
                  for _ in range(index):
                      p = p.next
                  return p

              def get(self, index: int) -> int:
                  if index >= self.size:
                      return -1
                  return self._before(index).next.value

              def addAtHead(self, value: int) -> None:
                  self.addAtIndex(0, value)

              def addAtTail(self, value: int) -> None:
                  self.addAtIndex(self.size, value)

              def addAtIndex(self, index: int, value: int) -> None:
                  if index > self.size:
                      return
                  p = self._before(index)
                  p.next = Node(value, p.next)
                  self.size += 1

              def deleteAtIndex(self, index: int) -> None:
                  if index >= self.size:
                      return
                  p = self._before(index)
                  p.next = p.next.next
                  self.size -= 1
        `,
        javascript: code`
          var MyLinkedList = function() {
              this.dummy = { value: 0, next: null }; // dummy.next is the head
              this.size = 0;
          };

          MyLinkedList.prototype.before = function(index) {
              var p = this.dummy;
              for (var i = 0; i < index; i++) p = p.next;
              return p;
          };

          MyLinkedList.prototype.get = function(index) {
              if (index >= this.size) return -1;
              return this.before(index).next.value;
          };

          MyLinkedList.prototype.addAtHead = function(value) {
              this.addAtIndex(0, value);
          };

          MyLinkedList.prototype.addAtTail = function(value) {
              this.addAtIndex(this.size, value);
          };

          MyLinkedList.prototype.addAtIndex = function(index, value) {
              if (index > this.size) return;
              var p = this.before(index);
              p.next = { value: value, next: p.next };
              this.size++;
          };

          MyLinkedList.prototype.deleteAtIndex = function(index) {
              if (index >= this.size) return;
              var p = this.before(index);
              p.next = p.next.next;
              this.size--;
          };
        `,
        typescript: code`
          class LlNode {
              value: number;
              next: LlNode;

              constructor(value: number, next: LlNode) {
                  this.value = value;
                  this.next = next;
              }
          }

          class MyLinkedList {
              dummy: LlNode; // dummy.next is the head
              size: number;

              constructor() {
                  this.dummy = new LlNode(0, null);
                  this.size = 0;
              }

              before(index: number): LlNode {
                  var p = this.dummy;
                  for (var i = 0; i < index; i++) p = p.next;
                  return p;
              }

              get(index: number): number {
                  if (index >= this.size) return -1;
                  return this.before(index).next.value;
              }

              addAtHead(value: number): void {
                  this.addAtIndex(0, value);
              }

              addAtTail(value: number): void {
                  this.addAtIndex(this.size, value);
              }

              addAtIndex(index: number, value: number): void {
                  if (index > this.size) return;
                  var p = this.before(index);
                  p.next = new LlNode(value, p.next);
                  this.size++;
              }

              deleteAtIndex(index: number): void {
                  if (index >= this.size) return;
                  var p = this.before(index);
                  p.next = p.next.next;
                  this.size--;
              }
          }
        `,
        java: code`
          class MyLinkedList {
              private static class Node {
                  int value;
                  Node next;
                  Node(int value, Node next) { this.value = value; this.next = next; }
              }

              private Node dummy = new Node(0, null); // dummy.next is the head
              private int size = 0;

              public MyLinkedList() {
              }

              private Node before(int index) {
                  Node p = dummy;
                  for (int i = 0; i < index; i++) p = p.next;
                  return p;
              }

              public int get(int index) {
                  if (index >= size) return -1;
                  return before(index).next.value;
              }

              public void addAtHead(int value) {
                  addAtIndex(0, value);
              }

              public void addAtTail(int value) {
                  addAtIndex(size, value);
              }

              public void addAtIndex(int index, int value) {
                  if (index > size) return;
                  Node p = before(index);
                  p.next = new Node(value, p.next);
                  size++;
              }

              public void deleteAtIndex(int index) {
                  if (index >= size) return;
                  Node p = before(index);
                  p.next = p.next.next;
                  size--;
              }
          }
        `,
        cpp: code`
          class MyLinkedList {
              struct Node {
                  int value;
                  Node* next;
              };
              Node* dummy = new Node{0, nullptr}; // dummy->next is the head
              int size = 0;

              Node* before(int index) {
                  Node* p = dummy;
                  for (int i = 0; i < index; i++) p = p->next;
                  return p;
              }
          public:
              MyLinkedList() {}

              ~MyLinkedList() {
                  while (dummy) { Node* next = dummy->next; delete dummy; dummy = next; }
              }

              int get(int index) {
                  if (index >= size) return -1;
                  return before(index)->next->value;
              }

              void addAtHead(int value) {
                  addAtIndex(0, value);
              }

              void addAtTail(int value) {
                  addAtIndex(size, value);
              }

              void addAtIndex(int index, int value) {
                  if (index > size) return;
                  Node* p = before(index);
                  p->next = new Node{value, p->next};
                  size++;
              }

              void deleteAtIndex(int index) {
                  if (index >= size) return;
                  Node* p = before(index);
                  Node* dead = p->next;
                  p->next = dead->next;
                  delete dead;
                  size--;
              }
          };
        `,
        c: code`
          typedef struct LlNode {
              int value;
              struct LlNode* next;
          } LlNode;

          typedef struct {
              LlNode dummy; /* dummy.next is the head */
              int size;
          } MyLinkedList;

          static LlNode* llBefore(MyLinkedList* l, int index) {
              LlNode* p = &l->dummy;
              for (int i = 0; i < index; i++) p = p->next;
              return p;
          }

          MyLinkedList* myLinkedListCreate() {
              return (MyLinkedList*)calloc(1, sizeof(MyLinkedList));
          }

          int myLinkedListGet(MyLinkedList* obj, int index) {
              if (index >= obj->size) return -1;
              return llBefore(obj, index)->next->value;
          }

          void myLinkedListAddAtIndex(MyLinkedList* obj, int index, int value) {
              if (index > obj->size) return;
              LlNode* p = llBefore(obj, index);
              LlNode* n = (LlNode*)malloc(sizeof(LlNode));
              n->value = value;
              n->next = p->next;
              p->next = n;
              obj->size++;
          }

          void myLinkedListAddAtHead(MyLinkedList* obj, int value) {
              myLinkedListAddAtIndex(obj, 0, value);
          }

          void myLinkedListAddAtTail(MyLinkedList* obj, int value) {
              myLinkedListAddAtIndex(obj, obj->size, value);
          }

          void myLinkedListDeleteAtIndex(MyLinkedList* obj, int index) {
              if (index >= obj->size) return;
              LlNode* p = llBefore(obj, index);
              LlNode* dead = p->next;
              p->next = dead->next;
              free(dead);
              obj->size--;
          }

          void myLinkedListFree(MyLinkedList* obj) {
              LlNode* n = obj->dummy.next;
              while (n != NULL) { LlNode* next = n->next; free(n); n = next; }
              free(obj);
          }
        `,
        csharp: code`
          public class MyLinkedList {
              private class Node {
                  public int Value;
                  public Node Next;
              }

              private Node dummy = new Node(); // dummy.Next is the head
              private int size = 0;

              public MyLinkedList() {
              }

              private Node Before(int index) {
                  Node p = dummy;
                  for (int i = 0; i < index; i++) p = p.Next;
                  return p;
              }

              public int Get(int index) {
                  if (index >= size) return -1;
                  return Before(index).Next.Value;
              }

              public void AddAtHead(int value) {
                  AddAtIndex(0, value);
              }

              public void AddAtTail(int value) {
                  AddAtIndex(size, value);
              }

              public void AddAtIndex(int index, int value) {
                  if (index > size) return;
                  Node p = Before(index);
                  p.Next = new Node { Value = value, Next = p.Next };
                  size++;
              }

              public void DeleteAtIndex(int index) {
                  if (index >= size) return;
                  Node p = Before(index);
                  p.Next = p.Next.Next;
                  size--;
              }
          }
        `,
        go: code`
          type llNode struct {
          	value int
          	next  *llNode
          }

          type MyLinkedList struct {
          	dummy *llNode // dummy.next is the head
          	size  int
          }

          func Constructor() MyLinkedList {
          	return MyLinkedList{dummy: &llNode{}}
          }

          func (this *MyLinkedList) before(index int) *llNode {
          	p := this.dummy
          	for i := 0; i < index; i++ {
          		p = p.next
          	}
          	return p
          }

          func (this *MyLinkedList) Get(index int) int {
          	if index >= this.size {
          		return -1
          	}
          	return this.before(index).next.value
          }

          func (this *MyLinkedList) AddAtHead(value int) {
          	this.AddAtIndex(0, value)
          }

          func (this *MyLinkedList) AddAtTail(value int) {
          	this.AddAtIndex(this.size, value)
          }

          func (this *MyLinkedList) AddAtIndex(index int, value int) {
          	if index > this.size {
          		return
          	}
          	p := this.before(index)
          	p.next = &llNode{value, p.next}
          	this.size++
          }

          func (this *MyLinkedList) DeleteAtIndex(index int) {
          	if index >= this.size {
          		return
          	}
          	p := this.before(index)
          	p.next = p.next.next
          	this.size--
          }
        `,
        kotlin: code`
          class MyLinkedList() {
              private class Node(var value: Int, var next: Node?)

              private val dummy = Node(0, null) // dummy.next is the head
              private var size = 0

              private fun before(index: Int): Node {
                  var p = dummy
                  repeat(index) { p = p.next!! }
                  return p
              }

              fun get(index: Int): Int = if (index >= size) -1 else before(index).next!!.value

              fun addAtHead(value: Int) = addAtIndex(0, value)

              fun addAtTail(value: Int) = addAtIndex(size, value)

              fun addAtIndex(index: Int, value: Int) {
                  if (index > size) return
                  val p = before(index)
                  p.next = Node(value, p.next)
                  size++
              }

              fun deleteAtIndex(index: Int) {
                  if (index >= size) return
                  val p = before(index)
                  p.next = p.next!!.next
                  size--
              }
          }
        `,
        swift: code`
          final class LlNode {
              var value: Int
              var next: LlNode?

              init(_ value: Int, _ next: LlNode?) {
                  self.value = value
                  self.next = next
              }
          }

          class MyLinkedList {
              let dummy = LlNode(0, nil) // dummy.next is the head
              var size = 0

              init() {}

              private func before(_ index: Int) -> LlNode {
                  var p = dummy
                  for _ in 0..<index { p = p.next! }
                  return p
              }

              func get(_ index: Int) -> Int {
                  return index >= size ? -1 : before(index).next!.value
              }

              func addAtHead(_ value: Int) {
                  addAtIndex(0, value)
              }

              func addAtTail(_ value: Int) {
                  addAtIndex(size, value)
              }

              func addAtIndex(_ index: Int, _ value: Int) {
                  if index > size { return }
                  let p = before(index)
                  p.next = LlNode(value, p.next)
                  size += 1
              }

              func deleteAtIndex(_ index: Int) {
                  if index >= size { return }
                  let p = before(index)
                  p.next = p.next!.next
                  size -= 1
              }
          }
        `,
        rust: code`
          struct LlNode {
              value: i32,
              next: Option<Box<LlNode>>,
          }

          struct MyLinkedList {
              head: Option<Box<LlNode>>,
              size: i32,
          }

          impl MyLinkedList {
              fn new() -> Self { MyLinkedList { head: None, size: 0 } }

              fn get(&mut self, index: i32) -> i32 {
                  if index >= self.size { return -1; }
                  let mut cur = self.head.as_ref();
                  for _ in 0..index { cur = cur.unwrap().next.as_ref(); }
                  cur.unwrap().value
              }

              fn addAtHead(&mut self, value: i32) { self.addAtIndex(0, value); }

              fn addAtTail(&mut self, value: i32) {
                  let n = self.size;
                  self.addAtIndex(n, value);
              }

              fn addAtIndex(&mut self, index: i32, value: i32) {
                  if index > self.size { return; }
                  // link is the Option that should hold position index
                  let mut link = &mut self.head;
                  for _ in 0..index { link = &mut link.as_mut().unwrap().next; }
                  let rest = link.take();
                  *link = Some(Box::new(LlNode { value, next: rest }));
                  self.size += 1;
              }

              fn deleteAtIndex(&mut self, index: i32) {
                  if index >= self.size { return; }
                  let mut link = &mut self.head;
                  for _ in 0..index { link = &mut link.as_mut().unwrap().next; }
                  let removed = link.take().unwrap();
                  *link = removed.next;
                  self.size -= 1;
              }
          }
        `,
        php: code`
          class LlNode {
              public $value;
              public $next;

              function __construct($value, $next) {
                  $this->value = $value;
                  $this->next = $next;
              }
          }

          class MyLinkedList {
              private $dummy; // dummy->next is the head
              private $size = 0;

              function __construct() {
                  $this->dummy = new LlNode(0, null);
              }

              private function before($index) {
                  $p = $this->dummy;
                  for ($i = 0; $i < $index; $i++) $p = $p->next;
                  return $p;
              }

              function get($index) {
                  if ($index >= $this->size) return -1;
                  return $this->before($index)->next->value;
              }

              function addAtHead($value) {
                  $this->addAtIndex(0, $value);
              }

              function addAtTail($value) {
                  $this->addAtIndex($this->size, $value);
              }

              function addAtIndex($index, $value) {
                  if ($index > $this->size) return;
                  $p = $this->before($index);
                  $p->next = new LlNode($value, $p->next);
                  $this->size++;
              }

              function deleteAtIndex($index) {
                  if ($index >= $this->size) return;
                  $p = $this->before($index);
                  $p->next = $p->next->next;
                  $this->size--;
              }
          }
        `,
        ruby: code`
          class MyLinkedList
            LlNode = Struct.new(:value, :nxt)

            def initialize
              @dummy = LlNode.new(0, nil) # @dummy.nxt is the head
              @size = 0
            end

            def get(index)
              return -1 if index >= @size
              before(index).nxt.value
            end

            def addAtHead(value)
              addAtIndex(0, value)
            end

            def addAtTail(value)
              addAtIndex(@size, value)
            end

            def addAtIndex(index, value)
              return if index > @size
              p = before(index)
              p.nxt = LlNode.new(value, p.nxt)
              @size += 1
            end

            def deleteAtIndex(index)
              return if index >= @size
              p = before(index)
              p.nxt = p.nxt.nxt
              @size -= 1
            end

            private

            def before(index)
              p = @dummy
              index.times { p = p.nxt }
              p
            end
          end
        `,
      },
    };
  })(),

  // ── My Calendar I (LC 729) ────────────────────────────────────────
  (() => {
    const run = (ops: string[], args: number[][]) => {
      const booked: number[][] = [];
      return ops.map((op, i) => {
        if (op !== "book") return null;
        const [s, e] = args[i];
        if (booked.some(([s2, e2]) => s < e2 && s2 < e)) return false;
        booked.push([s, e]);
        return true;
      });
    };
    const ex = [
      { ops: ["MyCalendar", "book", "book", "book"], args: [[], [10, 20], [15, 25], [20, 30]] },
      { ops: ["MyCalendar", "book", "book", "book", "book", "book"], args: [[], [47, 50], [33, 41], [39, 45], [33, 42], [25, 33]] },
    ];
    return {
      slug: "my-calendar-i",
      title: "My Calendar I",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Binary Search", "Ordered Set", "Segment Tree", "Design", "Google", "Amazon", "Uber"],
      signature: {
        funcName: "MyCalendar", params: [], returns: "void" as const,
        methods: [{ name: "book", params: [{ name: "startTime", type: "int" as const }, { name: "endTime", type: "int" as const }], returns: "bool" as const }],
      },
      description: describe(
        "You are building a calendar. A new event may be added only if it does not cause a **double booking** — two events sharing some moment of time.\n\nAn event is the half-open interval `[startTime, endTime)`: it covers every real `x` with `startTime <= x < endTime`, so an event ending at 20 and one starting at 20 do not overlap.\n\nWrite the class `MyCalendar`:\n\n- `MyCalendar()` creates an empty calendar.\n- `boolean book(int startTime, int endTime)` adds the event and returns `true` if it does not overlap any event already in the calendar; otherwise it leaves the calendar unchanged and returns `false`.\n\n" + CALLS,
        [
          exOf(ex[0].ops, ex[0].args, run, "[15, 25) overlaps [10, 20) on [15, 20), so it is refused. [20, 30) starts exactly when [10, 20) ends — no overlap."),
          exOf(ex[1].ops, ex[1].args, run, "[39, 45) overlaps [33, 41) and [33, 42) overlaps it too. [25, 33) ends exactly where [33, 41) begins, so it fits."),
        ],
        ["0 <= startTime < endTime <= 10^9", "At most 1000 calls are made to book"]),
      hints: [
        "Two half-open intervals `[s1, e1)` and `[s2, e2)` overlap exactly when `s1 < e2` and `s2 < e1`.",
        "Checking every booked event works, but the booked events never overlap each other — keep them sorted by start.",
        "In sorted order, only the two neighbours of the new event's position can conflict: the event starting at or after `startTime` (it must start at or after `endTime`), and the one before it (it must end by `startTime`). Find the position by binary search.",
      ],
      editorial: explain({
        idea: "The accepted events are pairwise disjoint, so sorted by start they are also sorted by end. A new event can only collide with its immediate neighbours in that order, which a binary search (or an ordered map's floor/ceiling) finds in O(log n).",
        steps: [
          "Keep the bookings sorted by start time (an ordered map from start to end, or two parallel sorted arrays).",
          "Find the first booking whose start is `>= startTime` — the successor. If it exists and its start is `< endTime`, refuse.",
          "Take the booking just before it — the predecessor. If it exists and its end is `> startTime`, refuse.",
          "Otherwise insert `[startTime, endTime)` at that position and accept.",
        ],
        why: "Every booking after the successor starts even later than the successor, so if the successor does not reach into the new event, none of them does. Every booking before the predecessor ends no later than the predecessor starts (they are disjoint and sorted), so if the predecessor ends by `startTime`, all earlier ones do too. Hence checking the two neighbours is enough.",
        time: "O(log n) per book with a balanced ordered map; O(n) with a sorted array because of the insertion",
        space: "O(n)",
        pitfalls: [
          "The intervals are half-open: `end == start` of the next event is fine, so compare with strict `<`.",
          "A refused event must not be stored.",
        ],
      }),
      examples: ex.map((e) => caseOf(e.ops, e.args, run)),
      gen: (rng: Rng) => {
        const span = pick(rng, [30, 200, 1000000000]);
        const ops = ["MyCalendar"], args: number[][] = [[]];
        for (let m = ri(rng, 1, pick(rng, [5, 20, 40])); m > 0; m--) {
          const s = ri(rng, 0, span - 1);
          const e = Math.min(span, s + ri(rng, 1, Math.max(1, Math.floor(span / pick(rng, [3, 10, 40])))));
          ops.push("book"); args.push([s, e]);
        }
        return caseOf(ops, args, run);
      },
      solutions: {
        python: code`
          from bisect import bisect_left

          class MyCalendar:

              def __init__(self):
                  self.starts = []  # bookings sorted by start; they never overlap,
                  self.ends = []    # so the ends are sorted too

              def book(self, startTime: int, endTime: int) -> bool:
                  i = bisect_left(self.starts, startTime)
                  if i < len(self.starts) and self.starts[i] < endTime:
                      return False
                  if i > 0 and self.ends[i - 1] > startTime:
                      return False
                  self.starts.insert(i, startTime)
                  self.ends.insert(i, endTime)
                  return True
        `,
        javascript: code`
          var MyCalendar = function() {
              this.starts = []; // bookings sorted by start
              this.ends = [];
          };

          MyCalendar.prototype.book = function(startTime, endTime) {
              var lo = 0, hi = this.starts.length; // first booking starting at or after startTime
              while (lo < hi) {
                  var mid = (lo + hi) >> 1;
                  if (this.starts[mid] < startTime) lo = mid + 1; else hi = mid;
              }
              if (lo < this.starts.length && this.starts[lo] < endTime) return false;
              if (lo > 0 && this.ends[lo - 1] > startTime) return false;
              this.starts.splice(lo, 0, startTime);
              this.ends.splice(lo, 0, endTime);
              return true;
          };
        `,
        typescript: code`
          class MyCalendar {
              starts: number[]; // bookings sorted by start
              ends: number[];

              constructor() {
                  this.starts = [];
                  this.ends = [];
              }

              book(startTime: number, endTime: number): boolean {
                  var lo = 0, hi = this.starts.length; // first booking starting at or after startTime
                  while (lo < hi) {
                      var mid = (lo + hi) >> 1;
                      if (this.starts[mid] < startTime) lo = mid + 1; else hi = mid;
                  }
                  if (lo < this.starts.length && this.starts[lo] < endTime) return false;
                  if (lo > 0 && this.ends[lo - 1] > startTime) return false;
                  this.starts.splice(lo, 0, startTime);
                  this.ends.splice(lo, 0, endTime);
                  return true;
              }
          }
        `,
        java: code`
          class MyCalendar {
              private TreeMap<Integer, Integer> cal = new TreeMap<>(); // start -> end

              public MyCalendar() {
              }

              public boolean book(int startTime, int endTime) {
                  Map.Entry<Integer, Integer> next = cal.ceilingEntry(startTime);
                  if (next != null && next.getKey() < endTime) return false;
                  Map.Entry<Integer, Integer> prev = cal.lowerEntry(startTime);
                  if (prev != null && prev.getValue() > startTime) return false;
                  cal.put(startTime, endTime);
                  return true;
              }
          }
        `,
        cpp: code`
          class MyCalendar {
              map<int, int> cal; // start -> end
          public:
              MyCalendar() {}

              bool book(int startTime, int endTime) {
                  auto next = cal.lower_bound(startTime);
                  if (next != cal.end() && next->first < endTime) return false;
                  if (next != cal.begin() && prev(next)->second > startTime) return false;
                  cal[startTime] = endTime;
                  return true;
              }
          };
        `,
        c: code`
          typedef struct {
              int *starts, *ends; /* bookings sorted by start */
              int n, cap;
          } MyCalendar;

          MyCalendar* myCalendarCreate() {
              MyCalendar* c = (MyCalendar*)malloc(sizeof(MyCalendar));
              c->cap = 16;
              c->n = 0;
              c->starts = (int*)malloc(c->cap * sizeof(int));
              c->ends = (int*)malloc(c->cap * sizeof(int));
              return c;
          }

          bool myCalendarBook(MyCalendar* obj, int startTime, int endTime) {
              int lo = 0, hi = obj->n; /* first booking starting at or after startTime */
              while (lo < hi) {
                  int mid = (lo + hi) / 2;
                  if (obj->starts[mid] < startTime) lo = mid + 1; else hi = mid;
              }
              if (lo < obj->n && obj->starts[lo] < endTime) return false;
              if (lo > 0 && obj->ends[lo - 1] > startTime) return false;
              if (obj->n == obj->cap) {
                  obj->cap *= 2;
                  obj->starts = (int*)realloc(obj->starts, obj->cap * sizeof(int));
                  obj->ends = (int*)realloc(obj->ends, obj->cap * sizeof(int));
              }
              for (int i = obj->n; i > lo; i--) { obj->starts[i] = obj->starts[i - 1]; obj->ends[i] = obj->ends[i - 1]; }
              obj->starts[lo] = startTime;
              obj->ends[lo] = endTime;
              obj->n++;
              return true;
          }

          void myCalendarFree(MyCalendar* obj) {
              free(obj->starts);
              free(obj->ends);
              free(obj);
          }
        `,
        csharp: code`
          public class MyCalendar {
              private List<int> starts = new List<int>(); // bookings sorted by start
              private List<int> ends = new List<int>();

              public MyCalendar() {
              }

              public bool Book(int startTime, int endTime) {
                  int i = starts.BinarySearch(startTime);
                  if (i < 0) i = ~i; // first booking starting at or after startTime
                  if (i < starts.Count && starts[i] < endTime) return false;
                  if (i > 0 && ends[i - 1] > startTime) return false;
                  starts.Insert(i, startTime);
                  ends.Insert(i, endTime);
                  return true;
              }
          }
        `,
        go: code`
          type MyCalendar struct {
          	starts, ends []int // bookings sorted by start
          }

          func Constructor() MyCalendar {
          	return MyCalendar{}
          }

          func (this *MyCalendar) Book(startTime int, endTime int) bool {
          	i := sort.SearchInts(this.starts, startTime) // first booking starting at or after startTime
          	if i < len(this.starts) && this.starts[i] < endTime {
          		return false
          	}
          	if i > 0 && this.ends[i-1] > startTime {
          		return false
          	}
          	this.starts = append(this.starts, 0)
          	copy(this.starts[i+1:], this.starts[i:])
          	this.starts[i] = startTime
          	this.ends = append(this.ends, 0)
          	copy(this.ends[i+1:], this.ends[i:])
          	this.ends[i] = endTime
          	return true
          }
        `,
        kotlin: code`
          class MyCalendar() {
              private val cal = java.util.TreeMap<Int, Int>() // start -> end

              fun book(startTime: Int, endTime: Int): Boolean {
                  val next = cal.ceilingEntry(startTime)
                  if (next != null && next.key < endTime) return false
                  val prev = cal.lowerEntry(startTime)
                  if (prev != null && prev.value > startTime) return false
                  cal[startTime] = endTime
                  return true
              }
          }
        `,
        swift: code`
          class MyCalendar {
              var starts: [Int] = [] // bookings sorted by start
              var ends: [Int] = []

              init() {}

              func book(_ startTime: Int, _ endTime: Int) -> Bool {
                  var lo = 0, hi = starts.count // first booking starting at or after startTime
                  while lo < hi {
                      let mid = (lo + hi) / 2
                      if starts[mid] < startTime { lo = mid + 1 } else { hi = mid }
                  }
                  if lo < starts.count && starts[lo] < endTime { return false }
                  if lo > 0 && ends[lo - 1] > startTime { return false }
                  starts.insert(startTime, at: lo)
                  ends.insert(endTime, at: lo)
                  return true
              }
          }
        `,
        rust: code`
          use std::collections::BTreeMap;

          struct MyCalendar {
              cal: BTreeMap<i32, i32>, // start -> end
          }

          impl MyCalendar {
              fn new() -> Self { MyCalendar { cal: BTreeMap::new() } }

              fn book(&mut self, startTime: i32, endTime: i32) -> bool {
                  if let Some((&s, _)) = self.cal.range(startTime..).next() {
                      if s < endTime { return false; }
                  }
                  if let Some((_, &e)) = self.cal.range(..startTime).next_back() {
                      if e > startTime { return false; }
                  }
                  self.cal.insert(startTime, endTime);
                  true
              }
          }
        `,
        php: code`
          class MyCalendar {
              private $starts = []; // bookings sorted by start
              private $ends = [];

              function __construct() {
              }

              function book($startTime, $endTime) {
                  $lo = 0;
                  $hi = count($this->starts); // first booking starting at or after startTime
                  while ($lo < $hi) {
                      $mid = ($lo + $hi) >> 1;
                      if ($this->starts[$mid] < $startTime) $lo = $mid + 1; else $hi = $mid;
                  }
                  if ($lo < count($this->starts) && $this->starts[$lo] < $endTime) return false;
                  if ($lo > 0 && $this->ends[$lo - 1] > $startTime) return false;
                  array_splice($this->starts, $lo, 0, [$startTime]);
                  array_splice($this->ends, $lo, 0, [$endTime]);
                  return true;
              }
          }
        `,
        ruby: code`
          class MyCalendar
            def initialize
              @starts = [] # bookings sorted by start
              @ends = []
            end

            def book(startTime, endTime)
              i = @starts.bsearch_index { |s| s >= startTime } || @starts.length
              return false if i < @starts.length && @starts[i] < endTime
              return false if i > 0 && @ends[i - 1] > startTime
              @starts.insert(i, startTime)
              @ends.insert(i, endTime)
              true
            end
          end
        `,
      },
    };
  })(),

  // ── My Calendar II (LC 731) ───────────────────────────────────────
  (() => {
    const run = (ops: string[], args: number[][]) => {
      const booked: number[][] = [];
      return ops.map((op, i) => {
        if (op !== "book") return null;
        const [s, e] = args[i];
        // a triple booking exists iff some pair of booked events overlaps, and that overlap meets the new event
        for (let a = 0; a < booked.length; a++) for (let b = a + 1; b < booked.length; b++) {
          const lo = Math.max(booked[a][0], booked[b][0]), hi = Math.min(booked[a][1], booked[b][1]);
          if (lo < hi && s < hi && lo < e) return false;
        }
        booked.push([s, e]);
        return true;
      });
    };
    const ex = [
      { ops: ["MyCalendarTwo", "book", "book", "book", "book", "book", "book"], args: [[], [10, 20], [50, 60], [10, 40], [5, 15], [5, 10], [25, 55]] },
      { ops: ["MyCalendarTwo", "book", "book", "book", "book"], args: [[], [0, 10], [0, 10], [10, 20], [9, 11]] },
    ];
    return {
      slug: "my-calendar-ii",
      title: "My Calendar II",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Binary Search", "Ordered Set", "Prefix Sum", "Segment Tree", "Design", "Google", "Amazon"],
      signature: {
        funcName: "MyCalendarTwo", params: [], returns: "void" as const,
        methods: [{ name: "book", params: [{ name: "startTime", type: "int" as const }, { name: "endTime", type: "int" as const }], returns: "bool" as const }],
      },
      description: describe(
        "You are building a calendar that tolerates double bookings but not **triple bookings** — some moment of time shared by three events.\n\nAn event is the half-open interval `[startTime, endTime)`: it covers every real `x` with `startTime <= x < endTime`.\n\nWrite the class `MyCalendarTwo`:\n\n- `MyCalendarTwo()` creates an empty calendar.\n- `boolean book(int startTime, int endTime)` adds the event and returns `true` if doing so does not create a triple booking; otherwise it leaves the calendar unchanged and returns `false`.\n\n" + CALLS,
        [
          exOf(ex[0].ops, ex[0].args, run, "[10, 40) double-books [10, 20) — allowed. [5, 15) would cover [10, 15) a third time, so it is refused. [5, 10) only touches [10, 40) at its end. [25, 55) double-books [10, 40) and [50, 60) on separate stretches, never three at once."),
          exOf(ex[1].ops, ex[1].args, run, "Two identical events are fine. [9, 11) would cover [9, 10) a third time, even though the last part, [10, 11), would only be double-booked."),
        ],
        ["0 <= startTime < endTime <= 10^9", "At most 1000 calls are made to book"]),
      hints: [
        "A new event creates a triple booking exactly when it overlaps a stretch of time that is already double-booked.",
        "So keep two lists: every accepted booking, and every stretch that is covered twice (the pairwise overlaps of bookings).",
        "To book `[s, e)`: refuse if it overlaps any double-booked stretch. Otherwise, add its overlap with each existing booking — `[max(s, s2), min(e, e2))` when non-empty — to the double-booked list, then add the event itself.",
      ],
      editorial: explain({
        idea: "Track the double-booked stretches explicitly. A point becomes triple-booked only if the new event covers a point that two earlier events already cover, i.e. a point inside one of their pairwise overlaps.",
        steps: [
          "Keep `booked` (accepted events) and `overlaps` (stretches covered by two accepted events).",
          "`book(s, e)`: for each `[a, b)` in `overlaps`, if `s < b` and `a < e` return `false`.",
          "For each `[a, b)` in `booked`, if they overlap, append `[max(s, a), min(e, b))` to `overlaps`.",
          "Append `[s, e)` to `booked` and return `true`.",
        ],
        why: "Since no point is ever triple-booked, the points covered twice are exactly the union of the pairwise intersections of accepted events, which is what `overlaps` holds. A new event creates a triple booking iff it covers such a point — the first check. When it is accepted, the newly double-covered points are exactly its intersections with the earlier events, which the second loop records.",
        time: "O(n) per book (n accepted events), O(n²) for n calls",
        space: "O(n)",
        pitfalls: [
          "Check the overlaps list *before* adding the new event's intersections, or an event is compared with itself.",
          "Half-open intervals: events that only touch at an endpoint share no time.",
          "A sweep over a sorted map of `+1` at starts and `-1` at ends (checking that the running count never reaches 3) is the usual alternative, also O(n) per call.",
        ],
      }),
      examples: ex.map((e) => caseOf(e.ops, e.args, run)),
      gen: (rng: Rng) => {
        const span = pick(rng, [30, 200, 1000000000]);
        const ops = ["MyCalendarTwo"], args: number[][] = [[]];
        for (let m = ri(rng, 1, pick(rng, [5, 20, 40])); m > 0; m--) {
          const s = ri(rng, 0, span - 1);
          const e = Math.min(span, s + ri(rng, 1, Math.max(1, Math.floor(span / pick(rng, [2, 5, 20])))));
          ops.push("book"); args.push([s, e]);
        }
        return caseOf(ops, args, run);
      },
      solutions: {
        python: code`
          class MyCalendarTwo:

              def __init__(self):
                  self.booked = []
                  self.overlaps = []  # stretches already covered twice

              def book(self, startTime: int, endTime: int) -> bool:
                  for a, b in self.overlaps:
                      if startTime < b and a < endTime:
                          return False
                  for a, b in self.booked:
                      if startTime < b and a < endTime:
                          self.overlaps.append((max(startTime, a), min(endTime, b)))
                  self.booked.append((startTime, endTime))
                  return True
        `,
        javascript: code`
          var MyCalendarTwo = function() {
              this.booked = [];
              this.overlaps = []; // stretches already covered twice
          };

          MyCalendarTwo.prototype.book = function(startTime, endTime) {
              var i;
              for (i = 0; i < this.overlaps.length; i++)
                  if (startTime < this.overlaps[i][1] && this.overlaps[i][0] < endTime) return false;
              for (i = 0; i < this.booked.length; i++) {
                  var a = this.booked[i][0], b = this.booked[i][1];
                  if (startTime < b && a < endTime) this.overlaps.push([Math.max(startTime, a), Math.min(endTime, b)]);
              }
              this.booked.push([startTime, endTime]);
              return true;
          };
        `,
        typescript: code`
          class MyCalendarTwo {
              booked: number[][];
              overlaps: number[][]; // stretches already covered twice

              constructor() {
                  this.booked = [];
                  this.overlaps = [];
              }

              book(startTime: number, endTime: number): boolean {
                  var i: number;
                  for (i = 0; i < this.overlaps.length; i++)
                      if (startTime < this.overlaps[i][1] && this.overlaps[i][0] < endTime) return false;
                  for (i = 0; i < this.booked.length; i++) {
                      var a = this.booked[i][0], b = this.booked[i][1];
                      if (startTime < b && a < endTime) this.overlaps.push([Math.max(startTime, a), Math.min(endTime, b)]);
                  }
                  this.booked.push([startTime, endTime]);
                  return true;
              }
          }
        `,
        java: code`
          class MyCalendarTwo {
              private List<int[]> booked = new ArrayList<>();
              private List<int[]> overlaps = new ArrayList<>(); // stretches already covered twice

              public MyCalendarTwo() {
              }

              public boolean book(int startTime, int endTime) {
                  for (int[] o : overlaps) if (startTime < o[1] && o[0] < endTime) return false;
                  for (int[] b : booked)
                      if (startTime < b[1] && b[0] < endTime)
                          overlaps.add(new int[]{Math.max(startTime, b[0]), Math.min(endTime, b[1])});
                  booked.add(new int[]{startTime, endTime});
                  return true;
              }
          }
        `,
        cpp: code`
          class MyCalendarTwo {
              vector<pair<int, int>> booked;
              vector<pair<int, int>> overlaps; // stretches already covered twice
          public:
              MyCalendarTwo() {}

              bool book(int startTime, int endTime) {
                  for (auto& o : overlaps) if (startTime < o.second && o.first < endTime) return false;
                  for (auto& b : booked)
                      if (startTime < b.second && b.first < endTime)
                          overlaps.push_back({max(startTime, b.first), min(endTime, b.second)});
                  booked.push_back({startTime, endTime});
                  return true;
              }
          };
        `,
        c: code`
          typedef struct {
              int* booked;   /* start0, end0, start1, end1, ... */
              int* overlaps; /* stretches already covered twice, same layout */
              int nb, no, capb, capo;
          } MyCalendarTwo;

          MyCalendarTwo* myCalendarTwoCreate() {
              MyCalendarTwo* c = (MyCalendarTwo*)malloc(sizeof(MyCalendarTwo));
              c->nb = c->no = 0;
              c->capb = c->capo = 16;
              c->booked = (int*)malloc(2 * c->capb * sizeof(int));
              c->overlaps = (int*)malloc(2 * c->capo * sizeof(int));
              return c;
          }

          bool myCalendarTwoBook(MyCalendarTwo* obj, int startTime, int endTime) {
              for (int i = 0; i < obj->no; i++)
                  if (startTime < obj->overlaps[2 * i + 1] && obj->overlaps[2 * i] < endTime) return false;
              for (int i = 0; i < obj->nb; i++) {
                  int a = obj->booked[2 * i], b = obj->booked[2 * i + 1];
                  if (startTime < b && a < endTime) {
                      if (obj->no == obj->capo) {
                          obj->capo *= 2;
                          obj->overlaps = (int*)realloc(obj->overlaps, 2 * obj->capo * sizeof(int));
                      }
                      obj->overlaps[2 * obj->no] = startTime > a ? startTime : a;
                      obj->overlaps[2 * obj->no + 1] = endTime < b ? endTime : b;
                      obj->no++;
                  }
              }
              if (obj->nb == obj->capb) {
                  obj->capb *= 2;
                  obj->booked = (int*)realloc(obj->booked, 2 * obj->capb * sizeof(int));
              }
              obj->booked[2 * obj->nb] = startTime;
              obj->booked[2 * obj->nb + 1] = endTime;
              obj->nb++;
              return true;
          }

          void myCalendarTwoFree(MyCalendarTwo* obj) {
              free(obj->booked);
              free(obj->overlaps);
              free(obj);
          }
        `,
        csharp: code`
          public class MyCalendarTwo {
              private List<int[]> booked = new List<int[]>();
              private List<int[]> overlaps = new List<int[]>(); // stretches already covered twice

              public MyCalendarTwo() {
              }

              public bool Book(int startTime, int endTime) {
                  foreach (int[] o in overlaps) if (startTime < o[1] && o[0] < endTime) return false;
                  foreach (int[] b in booked)
                      if (startTime < b[1] && b[0] < endTime)
                          overlaps.Add(new int[] { Math.Max(startTime, b[0]), Math.Min(endTime, b[1]) });
                  booked.Add(new int[] { startTime, endTime });
                  return true;
              }
          }
        `,
        go: code`
          type MyCalendarTwo struct {
          	booked, overlaps [][2]int // overlaps: stretches already covered twice
          }

          func Constructor() MyCalendarTwo {
          	return MyCalendarTwo{}
          }

          func (this *MyCalendarTwo) Book(startTime int, endTime int) bool {
          	for _, o := range this.overlaps {
          		if startTime < o[1] && o[0] < endTime {
          			return false
          		}
          	}
          	for _, b := range this.booked {
          		if startTime < b[1] && b[0] < endTime {
          			lo, hi := b[0], b[1]
          			if startTime > lo {
          				lo = startTime
          			}
          			if endTime < hi {
          				hi = endTime
          			}
          			this.overlaps = append(this.overlaps, [2]int{lo, hi})
          		}
          	}
          	this.booked = append(this.booked, [2]int{startTime, endTime})
          	return true
          }
        `,
        kotlin: code`
          class MyCalendarTwo() {
              private val booked = mutableListOf<IntArray>()
              private val overlaps = mutableListOf<IntArray>() // stretches already covered twice

              fun book(startTime: Int, endTime: Int): Boolean {
                  for (o in overlaps) if (startTime < o[1] && o[0] < endTime) return false
                  for (b in booked)
                      if (startTime < b[1] && b[0] < endTime)
                          overlaps.add(intArrayOf(maxOf(startTime, b[0]), minOf(endTime, b[1])))
                  booked.add(intArrayOf(startTime, endTime))
                  return true
              }
          }
        `,
        swift: code`
          class MyCalendarTwo {
              var booked: [(Int, Int)] = []
              var overlaps: [(Int, Int)] = [] // stretches already covered twice

              init() {}

              func book(_ startTime: Int, _ endTime: Int) -> Bool {
                  for (a, b) in overlaps where startTime < b && a < endTime { return false }
                  for (a, b) in booked where startTime < b && a < endTime {
                      overlaps.append((max(startTime, a), min(endTime, b)))
                  }
                  booked.append((startTime, endTime))
                  return true
              }
          }
        `,
        rust: code`
          struct MyCalendarTwo {
              booked: Vec<(i32, i32)>,
              overlaps: Vec<(i32, i32)>, // stretches already covered twice
          }

          impl MyCalendarTwo {
              fn new() -> Self { MyCalendarTwo { booked: Vec::new(), overlaps: Vec::new() } }

              fn book(&mut self, startTime: i32, endTime: i32) -> bool {
                  if self.overlaps.iter().any(|&(a, b)| startTime < b && a < endTime) { return false; }
                  for &(a, b) in self.booked.iter() {
                      if startTime < b && a < endTime {
                          self.overlaps.push((startTime.max(a), endTime.min(b)));
                      }
                  }
                  self.booked.push((startTime, endTime));
                  true
              }
          }
        `,
        php: code`
          class MyCalendarTwo {
              private $booked = [];
              private $overlaps = []; // stretches already covered twice

              function __construct() {
              }

              function book($startTime, $endTime) {
                  foreach ($this->overlaps as $o) if ($startTime < $o[1] && $o[0] < $endTime) return false;
                  foreach ($this->booked as $b)
                      if ($startTime < $b[1] && $b[0] < $endTime)
                          $this->overlaps[] = [max($startTime, $b[0]), min($endTime, $b[1])];
                  $this->booked[] = [$startTime, $endTime];
                  return true;
              }
          }
        `,
        ruby: code`
          class MyCalendarTwo
            def initialize
              @booked = []
              @overlaps = [] # stretches already covered twice
            end

            def book(startTime, endTime)
              return false if @overlaps.any? { |a, b| startTime < b && a < endTime }
              @booked.each do |a, b|
                @overlaps << [[startTime, a].max, [endTime, b].min] if startTime < b && a < endTime
              end
              @booked << [startTime, endTime]
              true
            end
          end
        `,
      },
    };
  })(),

];
