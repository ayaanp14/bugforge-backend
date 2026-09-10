/**
 * Numbers, digits and elementary maths — the staple of Indian service-company
 * coding rounds (TCS NQT, Infosys, Wipro, Capgemini) alongside the
 * product-company classics that open an Amazon or Google phone screen.
 *
 * JS solutions must be Node 12-safe: no ??, ?., replaceAll, .at() or .flat().
 */

import { bool, describe, fmtIntArr, ri, type CatalogProblem, type Rng } from "./types.js";

export const NUMBER_PROBLEMS: CatalogProblem[] = [

  // ── Reverse Integer ─────────────────────────────────────────────
  (() => {
    const ref = (x: number) => {
      const sign = x < 0 ? -1 : 1;
      let n = Math.abs(x), r = 0;
      while (n > 0) { r = r * 10 + (n % 10); n = Math.floor(n / 10); }
      r *= sign;
      return r < -2147483648 || r > 2147483647 ? 0 : r;
    };
    return {
      slug: "reverse-integer",
      title: "Reverse Integer",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "Amazon", "Microsoft", "Adobe", "TCS"],
      signature: { funcName: "reverse", params: [{ name: "x", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given a signed 32-bit integer `x`, return `x` with its **digits reversed**. If reversing `x` causes the value to fall outside the signed 32-bit range `[-2^31, 2^31 - 1]`, return `0` instead.\n\nAssume the environment does not allow you to store 64-bit integers.",
        [
          { in: "x = 123", out: "321" },
          { in: "x = -123", out: "-321" },
          { in: "x = 120", out: "21", note: "Trailing zeros of the input become leading zeros, which are dropped." },
        ],
        ["-2^31 <= x <= 2^31 - 1"]),
      hints: [
        "Peel digits off the right with `x % 10` and push them onto a running result with `result = result * 10 + digit`.",
        "Handle the sign once, up front, and reverse the absolute value.",
        "Check the 32-bit bound after building the result — the overflow cases must return 0, not a wrapped value.",
      ],
      examples: [
        { input: "123", expectedOutput: "321" },
        { input: "-123", expectedOutput: "-321" },
        { input: "120", expectedOutput: "21" },
      ],
      gen: (rng: Rng) => {
        const x = rng() < 0.45 ? ri(rng, -2147483648, 2147483647) : ri(rng, -999999, 999999);
        return { input: String(x), expectedOutput: String(ref(x)) };
      },
      solutions: {
        python: `def reverse(x: int) -> int:\n    sign = -1 if x < 0 else 1\n    n = abs(x)\n    result = 0\n    while n > 0:\n        result = result * 10 + n % 10\n        n //= 10\n    result *= sign\n    if result < -2147483648 or result > 2147483647:\n        return 0\n    return result`,
        javascript: `var reverse = function(x) {\n    const sign = x < 0 ? -1 : 1;\n    let n = Math.abs(x);\n    let result = 0;\n    while (n > 0) {\n        result = result * 10 + (n % 10);\n        n = Math.floor(n / 10);\n    }\n    result *= sign;\n    if (result < -2147483648 || result > 2147483647) return 0;\n    return result;\n};`,
              typescript: `function reverse(x: number): number {\n    var sign = x < 0 ? -1 : 1;\n    var n = Math.abs(x);\n    var result = 0;\n    while (n > 0) {\n        result = result * 10 + (n % 10);\n        n = Math.floor(n / 10);\n    }\n    result *= sign;\n    if (result < -2147483648 || result > 2147483647) return 0;\n    return result;\n}`,
              java: `public static int reverse(int x) {\n    int sign = x < 0 ? -1 : 1;\n    long n = Math.abs((long) x);\n    long result = 0;\n    while (n > 0) {\n        result = result * 10 + n % 10;\n        n /= 10;\n    }\n    result *= sign;\n    if (result < Integer.MIN_VALUE || result > Integer.MAX_VALUE) return 0;\n    return (int) result;\n}`,
              cpp: `int reverse(int x) {\n    int sign = x < 0 ? -1 : 1;\n    long long n = (long long) x;\n    if (n < 0) n = -n;\n    long long result = 0;\n    while (n > 0) {\n        result = result * 10 + n % 10;\n        n /= 10;\n    }\n    result *= sign;\n    if (result < -2147483648LL || result > 2147483647LL) return 0;\n    return (int) result;\n}`,
              c: `int reverse(int x) {\n    int sign = x < 0 ? -1 : 1;\n    long long n = (long long) x;\n    if (n < 0) n = -n;\n    long long result = 0;\n    while (n > 0) {\n        result = result * 10 + n % 10;\n        n /= 10;\n    }\n    result *= sign;\n    if (result < -2147483648LL || result > 2147483647LL) return 0;\n    return (int) result;\n}`,
              csharp: `public static int Reverse(int x)\n{\n    int sign = x < 0 ? -1 : 1;\n    long n = Math.Abs((long) x);\n    long result = 0;\n    while (n > 0)\n    {\n        result = result * 10 + n % 10;\n        n /= 10;\n    }\n    result *= sign;\n    if (result < int.MinValue || result > int.MaxValue) return 0;\n    return (int) result;\n}`,
              go: `func reverse(x int) int {\n	sign := 1\n	if x < 0 {\n		sign = -1\n		x = -x\n	}\n	result := 0\n	for x > 0 {\n		result = result*10 + x%10\n		x /= 10\n	}\n	result *= sign\n	if result < -2147483648 || result > 2147483647 {\n		return 0\n	}\n	return result\n}`,
              kotlin: `fun reverse(x: Int): Int {\n    val sign = if (x < 0) -1L else 1L\n    var n = Math.abs(x.toLong())\n    var result = 0L\n    while (n > 0) {\n        result = result * 10 + n % 10\n        n /= 10\n    }\n    result *= sign\n    if (result < -2147483648L || result > 2147483647L) return 0\n    return result.toInt()\n}`,
              swift: `func reverse(_ x: Int) -> Int {\n    let sign = x < 0 ? -1 : 1\n    var n = x < 0 ? -x : x\n    var result = 0\n    while n > 0 {\n        result = result * 10 + n % 10\n        n /= 10\n    }\n    result *= sign\n    if result < -2147483648 || result > 2147483647 { return 0 }\n    return result\n}`,
              rust: `fn reverse(x: i32) -> i32 {\n    let sign: i64 = if x < 0 { -1 } else { 1 };\n    let mut n = (x as i64).abs();\n    let mut result: i64 = 0;\n    while n > 0 {\n        result = result * 10 + n % 10;\n        n /= 10;\n    }\n    result *= sign;\n    if result < -2147483648 || result > 2147483647 {\n        return 0;\n    }\n    result as i32\n}`,
              php: `function reverse($x) {\n    $sign = $x < 0 ? -1 : 1;\n    $n = abs($x);\n    $result = 0;\n    while ($n > 0) {\n        $result = $result * 10 + $n % 10;\n        $n = intdiv($n, 10);\n    }\n    $result *= $sign;\n    if ($result < -2147483648 || $result > 2147483647) return 0;\n    return $result;\n}`,
              ruby: `def reverse(x)\n  sign = x < 0 ? -1 : 1\n  n = x.abs\n  result = 0\n  while n > 0\n    result = result * 10 + n % 10\n    n /= 10\n  end\n  result *= sign\n  return 0 if result < -2147483648 || result > 2147483647\n  result\nend`,
      },
    };
  })(),

  // ── Palindrome Number ───────────────────────────────────────────
  (() => {
    const ref = (x: number) => {
      if (x < 0) return false;
      let n = x, r = 0;
      while (n > 0) { r = r * 10 + (n % 10); n = Math.floor(n / 10); }
      return r === x;
    };
    return {
      slug: "palindrome-number",
      title: "Palindrome Number",
      difficulty: "EASY" as const,
      tags: ["Math", "Amazon", "TCS", "Infosys", "Cognizant"],
      signature: { funcName: "isPalindrome", params: [{ name: "x", type: "int" as const }], returns: "bool" as const },
      description: describe(
        "Given an integer `x`, return `true` if `x` reads the same forwards and backwards, and `false` otherwise.\n\nA negative number is never a palindrome: `-121` reads as `121-` from right to left.",
        [
          { in: "x = 121", out: "true" },
          { in: "x = -121", out: "false", note: "Reversed it reads 121-, which is not the same number." },
          { in: "x = 10", out: "false", note: "Reversed it is 01 = 1." },
        ],
        ["-2^31 <= x <= 2^31 - 1"],
        "Can you solve it without converting the integer to a string?"),
      hints: [
        "Reject negatives immediately.",
        "Reverse the number arithmetically and compare it with the original.",
        "To avoid overflow entirely, reverse only the second half and stop when the reversed part is at least as large as what remains.",
      ],
      examples: [
        { input: "121", expectedOutput: "true" },
        { input: "-121", expectedOutput: "false" },
        { input: "10", expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        let x: number;
        const roll = rng();
        if (roll < 0.35) {
          const half = String(ri(rng, 1, 999));
          const rev = half.split("").reverse().join("");
          x = parseInt(rng() < 0.5 ? half + rev : half + String(ri(rng, 0, 9)) + rev, 10);
        } else if (roll < 0.6) {
          x = ri(rng, -99999, -1);
        } else {
          x = ri(rng, 0, 999999);
        }
        return { input: String(x), expectedOutput: bool(ref(x)) };
      },
      solutions: {
        python: `def isPalindrome(x: int) -> bool:\n    if x < 0:\n        return False\n    n, rev = x, 0\n    while n > 0:\n        rev = rev * 10 + n % 10\n        n //= 10\n    return rev == x`,
        javascript: `var isPalindrome = function(x) {\n    if (x < 0) return false;\n    let n = x, rev = 0;\n    while (n > 0) {\n        rev = rev * 10 + (n % 10);\n        n = Math.floor(n / 10);\n    }\n    return rev === x;\n};`,
              typescript: `function isPalindrome(x: number): boolean {\n    if (x < 0) return false;\n    var n = x;\n    var rev = 0;\n    while (n > 0) {\n        rev = rev * 10 + (n % 10);\n        n = Math.floor(n / 10);\n    }\n    return rev === x;\n}`,
              java: `public static boolean isPalindrome(int x) {\n    if (x < 0) return false;\n    int n = x;\n    long rev = 0;\n    while (n > 0) {\n        rev = rev * 10 + n % 10;\n        n /= 10;\n    }\n    return rev == (long) x;\n}`,
              cpp: `bool isPalindrome(int x) {\n    if (x < 0) return false;\n    int n = x;\n    long long rev = 0;\n    while (n > 0) {\n        rev = rev * 10 + n % 10;\n        n /= 10;\n    }\n    return rev == (long long) x;\n}`,
              c: `bool isPalindrome(int x) {\n    if (x < 0) return false;\n    int n = x;\n    long long rev = 0;\n    while (n > 0) {\n        rev = rev * 10 + n % 10;\n        n /= 10;\n    }\n    return rev == (long long) x;\n}`,
              csharp: `public static bool IsPalindrome(int x)\n{\n    if (x < 0) return false;\n    int n = x;\n    long rev = 0;\n    while (n > 0)\n    {\n        rev = rev * 10 + n % 10;\n        n /= 10;\n    }\n    return rev == (long) x;\n}`,
              go: `func isPalindrome(x int) bool {\n	if x < 0 {\n		return false\n	}\n	n, rev := x, 0\n	for n > 0 {\n		rev = rev*10 + n%10\n		n /= 10\n	}\n	return rev == x\n}`,
              kotlin: `fun isPalindrome(x: Int): Boolean {\n    if (x < 0) return false\n    var n = x\n    var rev = 0L\n    while (n > 0) {\n        rev = rev * 10 + n % 10\n        n /= 10\n    }\n    return rev == x.toLong()\n}`,
              swift: `func isPalindrome(_ x: Int) -> Bool {\n    if x < 0 { return false }\n    var n = x\n    var rev = 0\n    while n > 0 {\n        rev = rev * 10 + n % 10\n        n /= 10\n    }\n    return rev == x\n}`,
              rust: `fn isPalindrome(x: i32) -> bool {\n    if x < 0 {\n        return false;\n    }\n    let mut n = x as i64;\n    let mut rev: i64 = 0;\n    while n > 0 {\n        rev = rev * 10 + n % 10;\n        n /= 10;\n    }\n    rev == x as i64\n}`,
              php: `function isPalindrome($x) {\n    if ($x < 0) return false;\n    $n = $x;\n    $rev = 0;\n    while ($n > 0) {\n        $rev = $rev * 10 + $n % 10;\n        $n = intdiv($n, 10);\n    }\n    return $rev === $x;\n}`,
              ruby: `def isPalindrome(x)\n  return false if x < 0\n  n = x\n  rev = 0\n  while n > 0\n    rev = rev * 10 + n % 10\n    n /= 10\n  end\n  rev == x\nend`,
      },
    };
  })(),

  // ── Count Primes ────────────────────────────────────────────────
  (() => {
    const ref = (n: number) => {
      if (n < 3) return 0;
      const sieve = new Uint8Array(n);
      let count = 0;
      for (let i = 2; i < n; i++) {
        if (sieve[i] === 0) { count++; for (let j = i * i; j < n; j += i) sieve[j] = 1; }
      }
      return count;
    };
    return {
      slug: "count-primes",
      title: "Count Primes",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "Sieve of Eratosthenes", "Amazon", "Microsoft", "Google", "Adobe"],
      signature: { funcName: "countPrimes", params: [{ name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given an integer `n`, return the number of prime numbers that are **strictly less than** `n`.\n\nA prime is a whole number greater than 1 whose only divisors are 1 and itself.",
        [
          { in: "n = 10", out: "4", note: "The primes below 10 are 2, 3, 5 and 7." },
          { in: "n = 0", out: "0" },
          { in: "n = 2", out: "0", note: "2 itself is excluded — the bound is strict." },
        ],
        ["0 <= n <= 800"],
        "Testing each number for primality is O(n·√n). Can you do it in O(n log log n)?"),
      hints: [
        "Testing every candidate separately repeats work. Instead, cross out multiples.",
        "Sieve of Eratosthenes: walk `i` upward from 2; the first time you reach an uncrossed `i` it must be prime, so cross out `i·i`, `i·i + i`, `i·i + 2i`, …",
        "Start crossing at `i·i`, not `2i` — every smaller multiple of `i` already carries a smaller prime factor and is gone.",
      ],
      examples: [
        { input: "10", expectedOutput: "4" },
        { input: "0", expectedOutput: "0" },
        { input: "2", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = rng() < 0.2 ? ri(rng, 0, 12) : ri(rng, 0, 800);
        return { input: String(n), expectedOutput: String(ref(n)) };
      },
      solutions: {
        python: `def countPrimes(n: int) -> int:\n    if n < 3:\n        return 0\n    sieve = [True] * n\n    sieve[0] = sieve[1] = False\n    i = 2\n    while i * i < n:\n        if sieve[i]:\n            for j in range(i * i, n, i):\n                sieve[j] = False\n        i += 1\n    return sum(sieve)`,
        javascript: `var countPrimes = function(n) {\n    if (n < 3) return 0;\n    const sieve = new Uint8Array(n);\n    let count = 0;\n    for (let i = 2; i < n; i++) {\n        if (sieve[i] === 0) {\n            count++;\n            for (let j = i * i; j < n; j += i) sieve[j] = 1;\n        }\n    }\n    return count;\n};`,
              typescript: `function countPrimes(n: number): number {\n    if (n < 3) return 0;\n    var sieve: boolean[] = [];\n    for (var k = 0; k < n; k++) sieve.push(false);\n    var count = 0;\n    for (var i = 2; i < n; i++) {\n        if (!sieve[i]) {\n            count++;\n            for (var j = i * i; j < n; j += i) sieve[j] = true;\n        }\n    }\n    return count;\n}`,
              java: `public static int countPrimes(int n) {\n    if (n < 3) return 0;\n    boolean[] sieve = new boolean[n];\n    int count = 0;\n    for (int i = 2; i < n; i++) {\n        if (!sieve[i]) {\n            count++;\n            for (long j = (long) i * i; j < n; j += i) sieve[(int) j] = true;\n        }\n    }\n    return count;\n}`,
              cpp: `int countPrimes(int n) {\n    if (n < 3) return 0;\n    vector<char> sieve(n, 0);\n    int count = 0;\n    for (int i = 2; i < n; i++) {\n        if (!sieve[i]) {\n            count++;\n            for (long long j = (long long) i * i; j < n; j += i) sieve[j] = 1;\n        }\n    }\n    return count;\n}`,
              c: `int countPrimes(int n) {\n    if (n < 3) return 0;\n    char* sieve = (char*) calloc(n, 1);\n    int count = 0;\n    for (int i = 2; i < n; i++) {\n        if (!sieve[i]) {\n            count++;\n            for (long long j = (long long) i * i; j < n; j += i) sieve[j] = 1;\n        }\n    }\n    free(sieve);\n    return count;\n}`,
              csharp: `public static int CountPrimes(int n)\n{\n    if (n < 3) return 0;\n    bool[] sieve = new bool[n];\n    int count = 0;\n    for (int i = 2; i < n; i++)\n    {\n        if (!sieve[i])\n        {\n            count++;\n            for (long j = (long) i * i; j < n; j += i) sieve[(int) j] = true;\n        }\n    }\n    return count;\n}`,
              go: `func countPrimes(n int) int {\n	if n < 3 {\n		return 0\n	}\n	sieve := make([]bool, n)\n	count := 0\n	for i := 2; i < n; i++ {\n		if !sieve[i] {\n			count++\n			for j := i * i; j < n; j += i {\n				sieve[j] = true\n			}\n		}\n	}\n	return count\n}`,
              kotlin: `fun countPrimes(n: Int): Int {\n    if (n < 3) return 0\n    val sieve = BooleanArray(n)\n    var count = 0\n    for (i in 2 until n) {\n        if (!sieve[i]) {\n            count++\n            var j = i.toLong() * i\n            while (j < n) {\n                sieve[j.toInt()] = true\n                j += i\n            }\n        }\n    }\n    return count\n}`,
              swift: `func countPrimes(_ n: Int) -> Int {\n    if n < 3 { return 0 }\n    var sieve = [Bool](repeating: false, count: n)\n    var count = 0\n    var i = 2\n    while i < n {\n        if !sieve[i] {\n            count += 1\n            var j = i * i\n            while j < n {\n                sieve[j] = true\n                j += i\n            }\n        }\n        i += 1\n    }\n    return count\n}`,
              rust: `fn countPrimes(n: i32) -> i32 {\n    if n < 3 {\n        return 0;\n    }\n    let limit = n as usize;\n    let mut sieve = vec![false; limit];\n    let mut count = 0;\n    let mut i: usize = 2;\n    while i < limit {\n        if !sieve[i] {\n            count += 1;\n            let mut j = i * i;\n            while j < limit {\n                sieve[j] = true;\n                j += i;\n            }\n        }\n        i += 1;\n    }\n    count\n}`,
              php: `function countPrimes($n) {\n    if ($n < 3) return 0;\n    $sieve = array_fill(0, $n, false);\n    $count = 0;\n    for ($i = 2; $i < $n; $i++) {\n        if (!$sieve[$i]) {\n            $count++;\n            for ($j = $i * $i; $j < $n; $j += $i) $sieve[$j] = true;\n        }\n    }\n    return $count;\n}`,
              ruby: `def countPrimes(n)\n  return 0 if n < 3\n  sieve = Array.new(n, false)\n  count = 0\n  i = 2\n  while i < n\n    unless sieve[i]\n      count += 1\n      j = i * i\n      while j < n\n        sieve[j] = true\n        j += i\n      end\n    end\n    i += 1\n  end\n  count\nend`,
      },
    };
  })(),

  // ── Happy Number ────────────────────────────────────────────────
  (() => {
    const ref = (n: number) => {
      const seen = new Set<number>();
      let cur = n;
      while (cur !== 1 && !seen.has(cur)) {
        seen.add(cur);
        let s = 0;
        while (cur > 0) { const d = cur % 10; s += d * d; cur = Math.floor(cur / 10); }
        cur = s;
      }
      return cur === 1;
    };
    return {
      slug: "happy-number",
      title: "Happy Number",
      difficulty: "EASY" as const,
      tags: ["Hash Table", "Math", "Two Pointers", "Google", "Amazon", "Uber", "Airbnb"],
      signature: { funcName: "isHappy", params: [{ name: "n", type: "int" as const }], returns: "bool" as const },
      description: describe(
        "Write an algorithm to decide whether a positive integer `n` is **happy**.\n\nA happy number is defined by this process: replace the number by the sum of the squares of its digits, and repeat. If the process reaches `1` the number is happy. If it loops forever without reaching `1`, it is not.\n\nReturn `true` if and only if `n` is happy.",
        [
          { in: "n = 19", out: "true", note: "1²+9²=82, 8²+2²=68, 6²+8²=100, 1²+0²+0²=1." },
          { in: "n = 2", out: "false", note: "The sequence enters the cycle 4, 16, 37, 58, 89, 145, 42, 20, 4, …" },
          { in: "n = 1", out: "true" },
        ],
        ["1 <= n <= 200000"]),
      hints: [
        "The process either reaches 1 or repeats a value it has already produced — there is no third outcome.",
        "Remember every value you have seen in a hash set; seeing one twice means you are in a cycle.",
        "Because it is a sequence that eventually cycles, Floyd's slow/fast pointer also works and uses O(1) memory.",
      ],
      examples: [
        { input: "19", expectedOutput: "true" },
        { input: "2", expectedOutput: "false" },
        { input: "1", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const n = rng() < 0.25 ? ri(rng, 1, 60) : ri(rng, 1, 200000);
        return { input: String(n), expectedOutput: bool(ref(n)) };
      },
      solutions: {
        python: `def isHappy(n: int) -> bool:\n    seen = set()\n    while n != 1 and n not in seen:\n        seen.add(n)\n        total = 0\n        while n > 0:\n            d = n % 10\n            total += d * d\n            n //= 10\n        n = total\n    return n == 1`,
        javascript: `var isHappy = function(n) {\n    const seen = new Set();\n    while (n !== 1 && !seen.has(n)) {\n        seen.add(n);\n        let total = 0;\n        while (n > 0) {\n            const d = n % 10;\n            total += d * d;\n            n = Math.floor(n / 10);\n        }\n        n = total;\n    }\n    return n === 1;\n};`,
              typescript: `function isHappy(n: number): boolean {\n    var seen: { [key: string]: boolean } = {};\n    while (n !== 1 && seen[String(n)] !== true) {\n        seen[String(n)] = true;\n        var total = 0;\n        var x = n;\n        while (x > 0) {\n            var d = x % 10;\n            total += d * d;\n            x = Math.floor(x / 10);\n        }\n        n = total;\n    }\n    return n === 1;\n}`,
              java: `public static boolean isHappy(int n) {\n    Set<Integer> seen = new HashSet<>();\n    while (n != 1 && !seen.contains(n)) {\n        seen.add(n);\n        int total = 0;\n        int x = n;\n        while (x > 0) {\n            int d = x % 10;\n            total += d * d;\n            x /= 10;\n        }\n        n = total;\n    }\n    return n == 1;\n}`,
              cpp: `bool isHappy(int n) {\n    unordered_set<int> seen;\n    while (n != 1 && seen.count(n) == 0) {\n        seen.insert(n);\n        int total = 0;\n        int x = n;\n        while (x > 0) {\n            int d = x % 10;\n            total += d * d;\n            x /= 10;\n        }\n        n = total;\n    }\n    return n == 1;\n}`,
              c: `static int squareDigitSum(int x) {\n    int total = 0;\n    while (x > 0) {\n        int d = x % 10;\n        total += d * d;\n        x /= 10;\n    }\n    return total;\n}\n\nbool isHappy(int n) {\n    int slow = n;\n    int fast = squareDigitSum(n);\n    while (fast != 1 && slow != fast) {\n        slow = squareDigitSum(slow);\n        fast = squareDigitSum(squareDigitSum(fast));\n    }\n    return fast == 1;\n}`,
              csharp: `public static bool IsHappy(int n)\n{\n    var seen = new HashSet<int>();\n    while (n != 1 && !seen.Contains(n))\n    {\n        seen.Add(n);\n        int total = 0;\n        int x = n;\n        while (x > 0)\n        {\n            int d = x % 10;\n            total += d * d;\n            x /= 10;\n        }\n        n = total;\n    }\n    return n == 1;\n}`,
              go: `func isHappy(n int) bool {\n	seen := make(map[int]bool)\n	for n != 1 && !seen[n] {\n		seen[n] = true\n		total := 0\n		x := n\n		for x > 0 {\n			d := x % 10\n			total += d * d\n			x /= 10\n		}\n		n = total\n	}\n	return n == 1\n}`,
              kotlin: `fun isHappy(n: Int): Boolean {\n    var cur = n\n    val seen = HashSet<Int>()\n    while (cur != 1 && !seen.contains(cur)) {\n        seen.add(cur)\n        var total = 0\n        var x = cur\n        while (x > 0) {\n            val d = x % 10\n            total += d * d\n            x /= 10\n        }\n        cur = total\n    }\n    return cur == 1\n}`,
              swift: `func isHappy(_ n: Int) -> Bool {\n    var cur = n\n    var seen = Set<Int>()\n    while cur != 1 && !seen.contains(cur) {\n        seen.insert(cur)\n        var total = 0\n        var x = cur\n        while x > 0 {\n            let d = x % 10\n            total += d * d\n            x /= 10\n        }\n        cur = total\n    }\n    return cur == 1\n}`,
              rust: `fn isHappy(n: i32) -> bool {\n    use std::collections::HashSet;\n    let mut cur = n;\n    let mut seen: HashSet<i32> = HashSet::new();\n    while cur != 1 && !seen.contains(&cur) {\n        seen.insert(cur);\n        let mut total = 0;\n        let mut x = cur;\n        while x > 0 {\n            let d = x % 10;\n            total += d * d;\n            x /= 10;\n        }\n        cur = total;\n    }\n    cur == 1\n}`,
              php: `function isHappy($n) {\n    $seen = array();\n    while ($n !== 1 && !isset($seen[$n])) {\n        $seen[$n] = true;\n        $total = 0;\n        $x = $n;\n        while ($x > 0) {\n            $d = $x % 10;\n            $total += $d * $d;\n            $x = intdiv($x, 10);\n        }\n        $n = $total;\n    }\n    return $n === 1;\n}`,
              ruby: `def isHappy(n)\n  seen = {}\n  while n != 1 && !seen[n]\n    seen[n] = true\n    total = 0\n    x = n\n    while x > 0\n      d = x % 10\n      total += d * d\n      x /= 10\n    end\n    n = total\n  end\n  n == 1\nend`,
      },
    };
  })(),

  // ── Ugly Number ─────────────────────────────────────────────────
  (() => {
    const ref = (n: number) => {
      if (n <= 0) return false;
      let x = n;
      const factors = [2, 3, 5];
      for (let i = 0; i < factors.length; i++) while (x % factors[i] === 0) x /= factors[i];
      return x === 1;
    };
    return {
      slug: "ugly-number",
      title: "Ugly Number",
      difficulty: "EASY" as const,
      tags: ["Math", "Amazon", "Adobe", "Infosys"],
      signature: { funcName: "isUgly", params: [{ name: "n", type: "int" as const }], returns: "bool" as const },
      description: describe(
        "An **ugly number** is a positive integer whose prime factors are limited to `2`, `3` and `5`.\n\nGiven an integer `n`, return `true` if `n` is ugly.",
        [
          { in: "n = 6", out: "true", note: "6 = 2 × 3." },
          { in: "n = 14", out: "false", note: "14 = 2 × 7, and 7 is not allowed." },
          { in: "n = 1", out: "true", note: "1 has no prime factors at all, so the condition holds vacuously." },
        ],
        ["-2^31 <= n <= 2^31 - 1"]),
      hints: [
        "Zero and negatives are never ugly.",
        "Divide out every factor of 2, then every factor of 3, then every factor of 5.",
        "What is left is 1 exactly when no other prime was present.",
      ],
      examples: [
        { input: "6", expectedOutput: "true" },
        { input: "14", expectedOutput: "false" },
        { input: "1", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        let n: number;
        const roll = rng();
        if (roll < 0.4) {
          n = 1;
          const steps = ri(rng, 0, 12);
          for (let i = 0; i < steps; i++) n *= [2, 3, 5][ri(rng, 0, 2)];
        } else if (roll < 0.55) {
          n = ri(rng, -50, 0);
        } else {
          n = ri(rng, 1, 100000);
        }
        return { input: String(n), expectedOutput: bool(ref(n)) };
      },
      solutions: {
        python: `def isUgly(n: int) -> bool:\n    if n <= 0:\n        return False\n    for f in (2, 3, 5):\n        while n % f == 0:\n            n //= f\n    return n == 1`,
        javascript: `var isUgly = function(n) {\n    if (n <= 0) return false;\n    const factors = [2, 3, 5];\n    for (let i = 0; i < factors.length; i++) {\n        while (n % factors[i] === 0) n /= factors[i];\n    }\n    return n === 1;\n};`,
              typescript: `function isUgly(n: number): boolean {\n    if (n <= 0) return false;\n    var factors = [2, 3, 5];\n    for (var i = 0; i < factors.length; i++) {\n        while (n % factors[i] === 0) n /= factors[i];\n    }\n    return n === 1;\n}`,
              java: `public static boolean isUgly(int n) {\n    if (n <= 0) return false;\n    int[] factors = {2, 3, 5};\n    for (int f : factors) {\n        while (n % f == 0) n /= f;\n    }\n    return n == 1;\n}`,
              cpp: `bool isUgly(int n) {\n    if (n <= 0) return false;\n    int factors[3] = {2, 3, 5};\n    for (int i = 0; i < 3; i++) {\n        while (n % factors[i] == 0) n /= factors[i];\n    }\n    return n == 1;\n}`,
              c: `bool isUgly(int n) {\n    if (n <= 0) return false;\n    int factors[3] = {2, 3, 5};\n    for (int i = 0; i < 3; i++) {\n        while (n % factors[i] == 0) n /= factors[i];\n    }\n    return n == 1;\n}`,
              csharp: `public static bool IsUgly(int n)\n{\n    if (n <= 0) return false;\n    int[] factors = { 2, 3, 5 };\n    foreach (int f in factors)\n    {\n        while (n % f == 0) n /= f;\n    }\n    return n == 1;\n}`,
              go: `func isUgly(n int) bool {\n	if n <= 0 {\n		return false\n	}\n	for _, f := range []int{2, 3, 5} {\n		for n%f == 0 {\n			n /= f\n		}\n	}\n	return n == 1\n}`,
              kotlin: `fun isUgly(n: Int): Boolean {\n    if (n <= 0) return false\n    var cur = n\n    for (f in intArrayOf(2, 3, 5)) {\n        while (cur % f == 0) cur /= f\n    }\n    return cur == 1\n}`,
              swift: `func isUgly(_ n: Int) -> Bool {\n    if n <= 0 { return false }\n    var cur = n\n    for f in [2, 3, 5] {\n        while cur % f == 0 { cur /= f }\n    }\n    return cur == 1\n}`,
              rust: `fn isUgly(n: i32) -> bool {\n    if n <= 0 {\n        return false;\n    }\n    let mut cur = n;\n    for f in [2, 3, 5].iter() {\n        while cur % f == 0 {\n            cur /= f;\n        }\n    }\n    cur == 1\n}`,
              php: `function isUgly($n) {\n    if ($n <= 0) return false;\n    foreach (array(2, 3, 5) as $f) {\n        while ($n % $f === 0) $n = intdiv($n, $f);\n    }\n    return $n === 1;\n}`,
              ruby: `def isUgly(n)\n  return false if n <= 0\n  [2, 3, 5].each do |f|\n    n /= f while n % f == 0\n  end\n  n == 1\nend`,
      },
    };
  })(),

  // ── Add Digits (Digital Root) ───────────────────────────────────
  (() => {
    const ref = (num: number) => {
      let n = num;
      while (n >= 10) { let s = 0; while (n > 0) { s += n % 10; n = Math.floor(n / 10); } n = s; }
      return n;
    };
    return {
      slug: "add-digits",
      title: "Add Digits",
      difficulty: "EASY" as const,
      tags: ["Math", "Simulation", "Number Theory", "Amazon", "Adobe", "Cognizant", "Capgemini"],
      signature: { funcName: "addDigits", params: [{ name: "num", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given a non-negative integer `num`, repeatedly add all of its digits until the result has only one digit, and return that digit.",
        [
          { in: "num = 38", out: "2", note: "3+8 = 11, then 1+1 = 2. Two has one digit, so stop." },
          { in: "num = 0", out: "0" },
          { in: "num = 9999", out: "9", note: "9+9+9+9 = 36, then 3+6 = 9." },
        ],
        ["0 <= num <= 2^31 - 1"],
        "Can you do it in O(1) time without any loop?"),
      hints: [
        "The straightforward solution simply loops the summation until one digit remains.",
        "Summing digits never changes a number's remainder modulo 9, because 10 ≡ 1 (mod 9).",
        "That gives a closed form: 0 for 0, otherwise `1 + (num - 1) % 9`.",
      ],
      examples: [
        { input: "38", expectedOutput: "2" },
        { input: "0", expectedOutput: "0" },
        { input: "9999", expectedOutput: "9" },
      ],
      gen: (rng: Rng) => {
        const num = rng() < 0.2 ? ri(rng, 0, 20) : ri(rng, 0, 2147483647);
        return { input: String(num), expectedOutput: String(ref(num)) };
      },
      solutions: {
        python: `def addDigits(num: int) -> int:\n    if num == 0:\n        return 0\n    return 1 + (num - 1) % 9`,
        javascript: `var addDigits = function(num) {\n    if (num === 0) return 0;\n    return 1 + (num - 1) % 9;\n};`,
              typescript: `function addDigits(num: number): number {\n    if (num === 0) return 0;\n    return 1 + (num - 1) % 9;\n}`,
              java: `public static int addDigits(int num) {\n    if (num == 0) return 0;\n    return 1 + (num - 1) % 9;\n}`,
              cpp: `int addDigits(int num) {\n    if (num == 0) return 0;\n    return 1 + (num - 1) % 9;\n}`,
              c: `int addDigits(int num) {\n    if (num == 0) return 0;\n    return 1 + (num - 1) % 9;\n}`,
              csharp: `public static int AddDigits(int num)\n{\n    if (num == 0) return 0;\n    return 1 + (num - 1) % 9;\n}`,
              go: `func addDigits(num int) int {\n	if num == 0 {\n		return 0\n	}\n	return 1 + (num-1)%9\n}`,
              kotlin: `fun addDigits(num: Int): Int {\n    if (num == 0) return 0\n    return 1 + (num - 1) % 9\n}`,
              swift: `func addDigits(_ num: Int) -> Int {\n    if num == 0 { return 0 }\n    return 1 + (num - 1) % 9\n}`,
              rust: `fn addDigits(num: i32) -> i32 {\n    if num == 0 {\n        return 0;\n    }\n    1 + (num - 1) % 9\n}`,
              php: `function addDigits($num) {\n    if ($num === 0) return 0;\n    return 1 + ($num - 1) % 9;\n}`,
              ruby: `def addDigits(num)\n  return 0 if num == 0\n  1 + (num - 1) % 9\nend`,
      },
    };
  })(),

  // ── Fizz Buzz ───────────────────────────────────────────────────
  (() => {
    const ref = (n: number) => {
      const out: string[] = [];
      for (let i = 1; i <= n; i++) {
        if (i % 15 === 0) out.push("FizzBuzz");
        else if (i % 3 === 0) out.push("Fizz");
        else if (i % 5 === 0) out.push("Buzz");
        else out.push(String(i));
      }
      return out;
    };
    return {
      slug: "fizz-buzz",
      title: "Fizz Buzz",
      difficulty: "EASY" as const,
      tags: ["Math", "String", "Simulation", "Microsoft", "Amazon", "TCS", "Infosys", "Wipro"],
      signature: { funcName: "fizzBuzz", params: [{ name: "n", type: "int" as const }], returns: "string[]" as const },
      description: describe(
        "Given an integer `n`, return a string array `answer` of length `n` (**1-indexed**) where:\n\n- `answer[i] == \"FizzBuzz\"` if `i` is divisible by both 3 and 5;\n- `answer[i] == \"Fizz\"` if `i` is divisible by 3;\n- `answer[i] == \"Buzz\"` if `i` is divisible by 5;\n- `answer[i] == i` as a string otherwise.",
        [
          { in: "n = 3", out: '["1","2","Fizz"]' },
          { in: "n = 5", out: '["1","2","Fizz","4","Buzz"]' },
          { in: "n = 15", out: '["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz"]' },
        ],
        ["1 <= n <= 40"]),
      hints: [
        "Test divisibility by 15 first — otherwise a multiple of 15 is caught by the Fizz branch and never reaches FizzBuzz.",
        "Divisible by 15 is exactly the same as divisible by both 3 and 5.",
      ],
      examples: [
        { input: "3", expectedOutput: '["1","2","Fizz"]' },
        { input: "5", expectedOutput: '["1","2","Fizz","4","Buzz"]' },
        { input: "15", expectedOutput: '["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz"]' },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 40);
        return { input: String(n), expectedOutput: JSON.stringify(ref(n)) };
      },
      solutions: {
        python: `def fizzBuzz(n: int):\n    out = []\n    for i in range(1, n + 1):\n        if i % 15 == 0:\n            out.append("FizzBuzz")\n        elif i % 3 == 0:\n            out.append("Fizz")\n        elif i % 5 == 0:\n            out.append("Buzz")\n        else:\n            out.append(str(i))\n    return out`,
        javascript: `var fizzBuzz = function(n) {\n    const out = [];\n    for (let i = 1; i <= n; i++) {\n        if (i % 15 === 0) out.push("FizzBuzz");\n        else if (i % 3 === 0) out.push("Fizz");\n        else if (i % 5 === 0) out.push("Buzz");\n        else out.push(String(i));\n    }\n    return out;\n};`,
              typescript: `function fizzBuzz(n: number): string[] {\n    var out: string[] = [];\n    for (var i = 1; i <= n; i++) {\n        if (i % 15 === 0) out.push("FizzBuzz");\n        else if (i % 3 === 0) out.push("Fizz");\n        else if (i % 5 === 0) out.push("Buzz");\n        else out.push(String(i));\n    }\n    return out;\n}`,
              java: `public static String[] fizzBuzz(int n) {\n    String[] out = new String[n];\n    for (int i = 1; i <= n; i++) {\n        if (i % 15 == 0) out[i - 1] = "FizzBuzz";\n        else if (i % 3 == 0) out[i - 1] = "Fizz";\n        else if (i % 5 == 0) out[i - 1] = "Buzz";\n        else out[i - 1] = String.valueOf(i);\n    }\n    return out;\n}`,
              cpp: `vector<string> fizzBuzz(int n) {\n    vector<string> out;\n    for (int i = 1; i <= n; i++) {\n        if (i % 15 == 0) out.push_back("FizzBuzz");\n        else if (i % 3 == 0) out.push_back("Fizz");\n        else if (i % 5 == 0) out.push_back("Buzz");\n        else out.push_back(to_string(i));\n    }\n    return out;\n}`,
              c: `char** fizzBuzz(int n, int* returnSize) {\n    char** out = (char**) malloc(sizeof(char*) * n);\n    for (int i = 1; i <= n; i++) {\n        char* s = (char*) malloc(16);\n        if (i % 15 == 0) strcpy(s, "FizzBuzz");\n        else if (i % 3 == 0) strcpy(s, "Fizz");\n        else if (i % 5 == 0) strcpy(s, "Buzz");\n        else sprintf(s, "%d", i);\n        out[i - 1] = s;\n    }\n    *returnSize = n;\n    return out;\n}`,
              csharp: `public static string[] FizzBuzz(int n)\n{\n    string[] out_ = new string[n];\n    for (int i = 1; i <= n; i++)\n    {\n        if (i % 15 == 0) out_[i - 1] = "FizzBuzz";\n        else if (i % 3 == 0) out_[i - 1] = "Fizz";\n        else if (i % 5 == 0) out_[i - 1] = "Buzz";\n        else out_[i - 1] = i.ToString();\n    }\n    return out_;\n}`,
              go: `func fizzBuzz(n int) []string {\n	out := make([]string, 0, n)\n	for i := 1; i <= n; i++ {\n		if i%15 == 0 {\n			out = append(out, "FizzBuzz")\n		} else if i%3 == 0 {\n			out = append(out, "Fizz")\n		} else if i%5 == 0 {\n			out = append(out, "Buzz")\n		} else {\n			out = append(out, strconv.Itoa(i))\n		}\n	}\n	return out\n}`,
              kotlin: `fun fizzBuzz(n: Int): Array<String> {\n    val out = ArrayList<String>()\n    for (i in 1..n) {\n        if (i % 15 == 0) out.add("FizzBuzz")\n        else if (i % 3 == 0) out.add("Fizz")\n        else if (i % 5 == 0) out.add("Buzz")\n        else out.add(i.toString())\n    }\n    return out.toTypedArray()\n}`,
              swift: `func fizzBuzz(_ n: Int) -> [String] {\n    var out: [String] = []\n    var i = 1\n    while i <= n {\n        if i % 15 == 0 { out.append("FizzBuzz") }\n        else if i % 3 == 0 { out.append("Fizz") }\n        else if i % 5 == 0 { out.append("Buzz") }\n        else { out.append(String(i)) }\n        i += 1\n    }\n    return out\n}`,
              rust: `fn fizzBuzz(n: i32) -> Vec<String> {\n    let mut out: Vec<String> = Vec::new();\n    for i in 1..=n {\n        if i % 15 == 0 {\n            out.push(String::from("FizzBuzz"));\n        } else if i % 3 == 0 {\n            out.push(String::from("Fizz"));\n        } else if i % 5 == 0 {\n            out.push(String::from("Buzz"));\n        } else {\n            out.push(i.to_string());\n        }\n    }\n    out\n}`,
              php: `function fizzBuzz($n) {\n    $out = array();\n    for ($i = 1; $i <= $n; $i++) {\n        if ($i % 15 === 0) $out[] = "FizzBuzz";\n        else if ($i % 3 === 0) $out[] = "Fizz";\n        else if ($i % 5 === 0) $out[] = "Buzz";\n        else $out[] = strval($i);\n    }\n    return $out;\n}`,
              ruby: `def fizzBuzz(n)\n  out = []\n  (1..n).each do |i|\n    if i % 15 == 0\n      out << "FizzBuzz"\n    elsif i % 3 == 0\n      out << "Fizz"\n    elsif i % 5 == 0\n      out << "Buzz"\n    else\n      out << i.to_s\n    end\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Power of Two ────────────────────────────────────────────────
  (() => {
    const ref = (n: number) => n > 0 && (n & (n - 1)) === 0;
    return {
      slug: "power-of-two",
      title: "Power of Two",
      difficulty: "EASY" as const,
      tags: ["Math", "Bit Manipulation", "Amazon", "Google", "Apple", "Zoho"],
      signature: { funcName: "isPowerOfTwo", params: [{ name: "n", type: "int" as const }], returns: "bool" as const },
      description: describe(
        "Given an integer `n`, return `true` if it is a power of two — that is, if there exists an integer `x` with `n == 2^x`.",
        [
          { in: "n = 1", out: "true", note: "2^0 = 1." },
          { in: "n = 16", out: "true", note: "2^4 = 16." },
          { in: "n = 3", out: "false" },
        ],
        ["-2^31 <= n <= 2^31 - 1"],
        "Can you solve it without loops or recursion?"),
      hints: [
        "Powers of two are positive; rule out zero and negatives first.",
        "In binary a power of two has exactly one set bit.",
        "`n & (n - 1)` clears the lowest set bit. If that leaves zero, there was only one bit to clear.",
      ],
      examples: [
        { input: "1", expectedOutput: "true" },
        { input: "16", expectedOutput: "true" },
        { input: "3", expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        const n = rng() < 0.4 ? Math.pow(2, ri(rng, 0, 30)) : ri(rng, -1000, 1000000);
        return { input: String(n), expectedOutput: bool(ref(n)) };
      },
      solutions: {
        python: `def isPowerOfTwo(n: int) -> bool:\n    return n > 0 and (n & (n - 1)) == 0`,
        javascript: `var isPowerOfTwo = function(n) {\n    return n > 0 && (n & (n - 1)) === 0;\n};`,
              typescript: `function isPowerOfTwo(n: number): boolean {\n    return n > 0 && (n & (n - 1)) === 0;\n}`,
              java: `public static boolean isPowerOfTwo(int n) {\n    return n > 0 && (n & (n - 1)) == 0;\n}`,
              cpp: `bool isPowerOfTwo(int n) {\n    return n > 0 && (n & (n - 1)) == 0;\n}`,
              c: `bool isPowerOfTwo(int n) {\n    return n > 0 && (n & (n - 1)) == 0;\n}`,
              csharp: `public static bool IsPowerOfTwo(int n)\n{\n    return n > 0 && (n & (n - 1)) == 0;\n}`,
              go: `func isPowerOfTwo(n int) bool {\n	return n > 0 && n&(n-1) == 0\n}`,
              kotlin: `fun isPowerOfTwo(n: Int): Boolean {\n    return n > 0 && (n and (n - 1)) == 0\n}`,
              swift: `func isPowerOfTwo(_ n: Int) -> Bool {\n    return n > 0 && (n & (n - 1)) == 0\n}`,
              rust: `fn isPowerOfTwo(n: i32) -> bool {\n    n > 0 && (n & (n - 1)) == 0\n}`,
              php: `function isPowerOfTwo($n) {\n    return $n > 0 && ($n & ($n - 1)) === 0;\n}`,
              ruby: `def isPowerOfTwo(n)\n  n > 0 && (n & (n - 1)) == 0\nend`,
      },
    };
  })(),

  // ── Power of Three ──────────────────────────────────────────────
  (() => {
    const ref = (n: number) => n > 0 && 1162261467 % n === 0;
    return {
      slug: "power-of-three",
      title: "Power of Three",
      difficulty: "EASY" as const,
      tags: ["Math", "Recursion", "Google", "Amazon", "Hulu"],
      signature: { funcName: "isPowerOfThree", params: [{ name: "n", type: "int" as const }], returns: "bool" as const },
      description: describe(
        "Given an integer `n`, return `true` if it is a power of three — that is, if there exists an integer `x` with `n == 3^x`.",
        [
          { in: "n = 27", out: "true", note: "3^3 = 27." },
          { in: "n = 0", out: "false" },
          { in: "n = 45", out: "false", note: "45 = 3² × 5." },
        ],
        ["-2^31 <= n <= 2^31 - 1"],
        "Can you solve it without loops or recursion?"),
      hints: [
        "The loop solution divides by 3 while the remainder is zero and checks that 1 is left.",
        "Three is prime, so the only divisors of 3^19 that are themselves powers of three are 3^0 … 3^19.",
        "3^19 = 1162261467 is the largest power of three inside a 32-bit int — test whether it is divisible by `n`.",
      ],
      examples: [
        { input: "27", expectedOutput: "true" },
        { input: "0", expectedOutput: "false" },
        { input: "45", expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        const n = rng() < 0.4 ? Math.pow(3, ri(rng, 0, 19)) : ri(rng, -100, 200000);
        return { input: String(n), expectedOutput: bool(ref(n)) };
      },
      solutions: {
        python: `def isPowerOfThree(n: int) -> bool:\n    return n > 0 and 1162261467 % n == 0`,
        javascript: `var isPowerOfThree = function(n) {\n    return n > 0 && 1162261467 % n === 0;\n};`,
              typescript: `function isPowerOfThree(n: number): boolean {\n    return n > 0 && 1162261467 % n === 0;\n}`,
              java: `public static boolean isPowerOfThree(int n) {\n    return n > 0 && 1162261467 % n == 0;\n}`,
              cpp: `bool isPowerOfThree(int n) {\n    return n > 0 && 1162261467 % n == 0;\n}`,
              c: `bool isPowerOfThree(int n) {\n    return n > 0 && 1162261467 % n == 0;\n}`,
              csharp: `public static bool IsPowerOfThree(int n)\n{\n    return n > 0 && 1162261467 % n == 0;\n}`,
              go: `func isPowerOfThree(n int) bool {\n	return n > 0 && 1162261467%n == 0\n}`,
              kotlin: `fun isPowerOfThree(n: Int): Boolean {\n    return n > 0 && 1162261467 % n == 0\n}`,
              swift: `func isPowerOfThree(_ n: Int) -> Bool {\n    return n > 0 && 1162261467 % n == 0\n}`,
              rust: `fn isPowerOfThree(n: i32) -> bool {\n    n > 0 && 1162261467 % n == 0\n}`,
              php: `function isPowerOfThree($n) {\n    return $n > 0 && 1162261467 % $n === 0;\n}`,
              ruby: `def isPowerOfThree(n)\n  n > 0 && 1162261467 % n == 0\nend`,
      },
    };
  })(),

  // ── Factorial Trailing Zeroes ───────────────────────────────────
  (() => {
    const ref = (n: number) => {
      let count = 0;
      for (let p = 5; p <= n; p *= 5) count += Math.floor(n / p);
      return count;
    };
    return {
      slug: "factorial-trailing-zeroes",
      title: "Factorial Trailing Zeroes",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "Google", "Amazon", "Bloomberg", "Infosys"],
      signature: { funcName: "trailingZeroes", params: [{ name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given an integer `n`, return the number of trailing zeroes in `n!`.\n\nNote that `n! = n × (n - 1) × (n - 2) × … × 2 × 1`.",
        [
          { in: "n = 3", out: "0", note: "3! = 6, which ends in no zero." },
          { in: "n = 5", out: "1", note: "5! = 120, one trailing zero." },
          { in: "n = 30", out: "7" },
        ],
        ["0 <= n <= 100000"],
        "Can you do it in logarithmic time?"),
      hints: [
        "A trailing zero comes from a factor of 10 = 2 × 5.",
        "Factors of 2 are far more plentiful than factors of 5, so the answer is just the number of 5s in the factorisation of `n!`.",
        "Count multiples of 5, then of 25, then of 125, … and add them up: 25 contributes two fives, not one.",
      ],
      examples: [
        { input: "3", expectedOutput: "0" },
        { input: "5", expectedOutput: "1" },
        { input: "30", expectedOutput: "7" },
      ],
      gen: (rng: Rng) => {
        const n = rng() < 0.25 ? ri(rng, 0, 30) : ri(rng, 0, 100000);
        return { input: String(n), expectedOutput: String(ref(n)) };
      },
      solutions: {
        python: `def trailingZeroes(n: int) -> int:\n    count = 0\n    power = 5\n    while power <= n:\n        count += n // power\n        power *= 5\n    return count`,
        javascript: `var trailingZeroes = function(n) {\n    let count = 0;\n    for (let power = 5; power <= n; power *= 5) {\n        count += Math.floor(n / power);\n    }\n    return count;\n};`,
              typescript: `function trailingZeroes(n: number): number {\n    var count = 0;\n    for (var power = 5; power <= n; power *= 5) {\n        count += Math.floor(n / power);\n    }\n    return count;\n}`,
              java: `public static int trailingZeroes(int n) {\n    int count = 0;\n    for (long power = 5; power <= n; power *= 5) {\n        count += n / power;\n    }\n    return count;\n}`,
              cpp: `int trailingZeroes(int n) {\n    int count = 0;\n    for (long long power = 5; power <= n; power *= 5) {\n        count += n / power;\n    }\n    return count;\n}`,
              c: `int trailingZeroes(int n) {\n    int count = 0;\n    for (long long power = 5; power <= n; power *= 5) {\n        count += (int) (n / power);\n    }\n    return count;\n}`,
              csharp: `public static int TrailingZeroes(int n)\n{\n    int count = 0;\n    for (long power = 5; power <= n; power *= 5)\n    {\n        count += (int) (n / power);\n    }\n    return count;\n}`,
              go: `func trailingZeroes(n int) int {\n	count := 0\n	for power := 5; power <= n; power *= 5 {\n		count += n / power\n	}\n	return count\n}`,
              kotlin: `fun trailingZeroes(n: Int): Int {\n    var count = 0\n    var power = 5L\n    while (power <= n) {\n        count += (n / power).toInt()\n        power *= 5\n    }\n    return count\n}`,
              swift: `func trailingZeroes(_ n: Int) -> Int {\n    var count = 0\n    var power = 5\n    while power <= n {\n        count += n / power\n        power *= 5\n    }\n    return count\n}`,
              rust: `fn trailingZeroes(n: i32) -> i32 {\n    let mut count: i64 = 0;\n    let mut power: i64 = 5;\n    let big = n as i64;\n    while power <= big {\n        count += big / power;\n        power *= 5;\n    }\n    count as i32\n}`,
              php: `function trailingZeroes($n) {\n    $count = 0;\n    for ($power = 5; $power <= $n; $power *= 5) {\n        $count += intdiv($n, $power);\n    }\n    return $count;\n}`,
              ruby: `def trailingZeroes(n)\n  count = 0\n  power = 5\n  while power <= n\n    count += n / power\n    power *= 5\n  end\n  count\nend`,
      },
    };
  })(),

  // ── Excel Sheet Column Number ───────────────────────────────────
  (() => {
    const ref = (title: string) => {
      let n = 0;
      for (let i = 0; i < title.length; i++) n = n * 26 + (title.charCodeAt(i) - 64);
      return n;
    };
    return {
      slug: "excel-sheet-column-number",
      title: "Excel Sheet Column Number",
      difficulty: "EASY" as const,
      tags: ["Math", "String", "Amazon", "Microsoft", "Zoho", "Facebook"],
      signature: { funcName: "titleToNumber", params: [{ name: "columnTitle", type: "string" as const }], returns: "int" as const },
      description: describe(
        "Given a string `columnTitle` that represents the column title as it appears in an Excel sheet, return its corresponding column number.\n\n```\nA  -> 1\nB  -> 2\n…\nZ  -> 26\nAA -> 27\nAB -> 28\n…\n```",
        [
          { in: 'columnTitle = "A"', out: "1" },
          { in: 'columnTitle = "AB"', out: "28", note: "1 × 26 + 2." },
          { in: 'columnTitle = "ZY"', out: "701" },
        ],
        ["1 <= columnTitle.length <= 5", "columnTitle consists of uppercase English letters."]),
      hints: [
        "This is base 26, except the digits run 1…26 rather than 0…25 — there is no zero digit.",
        "Fold left to right: `n = n * 26 + (ch - 'A' + 1)`.",
      ],
      examples: [
        { input: '"A"', expectedOutput: "1" },
        { input: '"AB"', expectedOutput: "28" },
        { input: '"ZY"', expectedOutput: "701" },
      ],
      gen: (rng: Rng) => {
        const len = ri(rng, 1, 5);
        let t = "";
        for (let i = 0; i < len; i++) t += String.fromCharCode(65 + ri(rng, 0, 25));
        return { input: `"${t}"`, expectedOutput: String(ref(t)) };
      },
      solutions: {
        python: `def titleToNumber(columnTitle: str) -> int:\n    n = 0\n    for ch in columnTitle:\n        n = n * 26 + (ord(ch) - ord('A') + 1)\n    return n`,
        javascript: `var titleToNumber = function(columnTitle) {\n    let n = 0;\n    for (let i = 0; i < columnTitle.length; i++) {\n        n = n * 26 + (columnTitle.charCodeAt(i) - 64);\n    }\n    return n;\n};`,
              typescript: `function titleToNumber(columnTitle: string): number {\n    var n = 0;\n    for (var i = 0; i < columnTitle.length; i++) {\n        n = n * 26 + (columnTitle.charCodeAt(i) - 64);\n    }\n    return n;\n}`,
              java: `public static int titleToNumber(String columnTitle) {\n    int n = 0;\n    for (int i = 0; i < columnTitle.length(); i++) {\n        n = n * 26 + (columnTitle.charAt(i) - 'A' + 1);\n    }\n    return n;\n}`,
              cpp: `int titleToNumber(string columnTitle) {\n    int n = 0;\n    for (size_t i = 0; i < columnTitle.size(); i++) {\n        n = n * 26 + (columnTitle[i] - 'A' + 1);\n    }\n    return n;\n}`,
              c: `int titleToNumber(const char* columnTitle) {\n    int n = 0;\n    for (int i = 0; columnTitle[i] != '\\0'; i++) {\n        n = n * 26 + (columnTitle[i] - 'A' + 1);\n    }\n    return n;\n}`,
              csharp: `public static int TitleToNumber(string columnTitle)\n{\n    int n = 0;\n    for (int i = 0; i < columnTitle.Length; i++)\n    {\n        n = n * 26 + (columnTitle[i] - 'A' + 1);\n    }\n    return n;\n}`,
              go: `func titleToNumber(columnTitle string) int {\n	n := 0\n	for i := 0; i < len(columnTitle); i++ {\n		n = n*26 + int(columnTitle[i]-'A') + 1\n	}\n	return n\n}`,
              kotlin: `fun titleToNumber(columnTitle: String): Int {\n    var n = 0\n    for (ch in columnTitle) {\n        n = n * 26 + (ch - 'A' + 1)\n    }\n    return n\n}`,
              swift: `func titleToNumber(_ columnTitle: String) -> Int {\n    var n = 0\n    for byte in Array(columnTitle.utf8) {\n        n = n * 26 + (Int(byte) - 65 + 1)\n    }\n    return n\n}`,
              rust: `fn titleToNumber(columnTitle: String) -> i32 {\n    let mut n = 0;\n    for byte in columnTitle.as_bytes() {\n        n = n * 26 + (*byte as i32 - 65 + 1);\n    }\n    n\n}`,
              php: `function titleToNumber($columnTitle) {\n    $n = 0;\n    $len = strlen($columnTitle);\n    for ($i = 0; $i < $len; $i++) {\n        $n = $n * 26 + (ord($columnTitle[$i]) - 65 + 1);\n    }\n    return $n;\n}`,
              ruby: `def titleToNumber(columnTitle)\n  n = 0\n  columnTitle.each_char do |ch|\n    n = n * 26 + (ch.ord - 65 + 1)\n  end\n  n\nend`,
      },
    };
  })(),

  // ── Excel Sheet Column Title ────────────────────────────────────
  (() => {
    const ref = (num: number) => {
      let n = num, out = "";
      while (n > 0) { n--; out = String.fromCharCode(65 + (n % 26)) + out; n = Math.floor(n / 26); }
      return out;
    };
    return {
      slug: "excel-sheet-column-title",
      title: "Excel Sheet Column Title",
      difficulty: "EASY" as const,
      tags: ["Math", "String", "Microsoft", "Amazon", "Zoho", "Facebook"],
      signature: { funcName: "convertToTitle", params: [{ name: "columnNumber", type: "int" as const }], returns: "string" as const },
      description: describe(
        "Given an integer `columnNumber`, return its corresponding column title as it appears in an Excel sheet.\n\n```\n1  -> A\n2  -> B\n…\n26 -> Z\n27 -> AA\n28 -> AB\n…\n```",
        [
          { in: "columnNumber = 1", out: "A" },
          { in: "columnNumber = 28", out: "AB" },
          { in: "columnNumber = 701", out: "ZY" },
        ],
        ["1 <= columnNumber <= 2^31 - 1"]),
      hints: [
        "This is base 26 with digits 1…26 instead of 0…25, so the usual `% 26` is off by one.",
        "Decrement the number by 1 before each digit extraction; that shifts the range back to 0…25.",
        "Build the string from the least significant letter, prepending as you go.",
      ],
      examples: [
        { input: "1", expectedOutput: "A" },
        { input: "28", expectedOutput: "AB" },
        { input: "701", expectedOutput: "ZY" },
      ],
      gen: (rng: Rng) => {
        const n = rng() < 0.3 ? ri(rng, 1, 60) : ri(rng, 1, 12000000);
        return { input: String(n), expectedOutput: ref(n) };
      },
      solutions: {
        python: `def convertToTitle(columnNumber: int) -> str:\n    out = []\n    while columnNumber > 0:\n        columnNumber -= 1\n        out.append(chr(ord('A') + columnNumber % 26))\n        columnNumber //= 26\n    return "".join(reversed(out))`,
        javascript: `var convertToTitle = function(columnNumber) {\n    let out = "";\n    while (columnNumber > 0) {\n        columnNumber--;\n        out = String.fromCharCode(65 + (columnNumber % 26)) + out;\n        columnNumber = Math.floor(columnNumber / 26);\n    }\n    return out;\n};`,
              typescript: `function convertToTitle(columnNumber: number): string {\n    var out = "";\n    while (columnNumber > 0) {\n        columnNumber--;\n        out = String.fromCharCode(65 + (columnNumber % 26)) + out;\n        columnNumber = Math.floor(columnNumber / 26);\n    }\n    return out;\n}`,
              java: `public static String convertToTitle(int columnNumber) {\n    StringBuilder sb = new StringBuilder();\n    while (columnNumber > 0) {\n        columnNumber--;\n        sb.append((char) ('A' + columnNumber % 26));\n        columnNumber /= 26;\n    }\n    return sb.reverse().toString();\n}`,
              cpp: `string convertToTitle(int columnNumber) {\n    string out = "";\n    while (columnNumber > 0) {\n        columnNumber--;\n        out += (char) ('A' + columnNumber % 26);\n        columnNumber /= 26;\n    }\n    reverse(out.begin(), out.end());\n    return out;\n}`,
              c: `char* convertToTitle(int columnNumber) {\n    char buf[16];\n    int len = 0;\n    while (columnNumber > 0) {\n        columnNumber--;\n        buf[len++] = (char) ('A' + columnNumber % 26);\n        columnNumber /= 26;\n    }\n    char* out = (char*) malloc(len + 1);\n    for (int i = 0; i < len; i++) out[i] = buf[len - 1 - i];\n    out[len] = '\\0';\n    return out;\n}`,
              csharp: `public static string ConvertToTitle(int columnNumber)\n{\n    var sb = new System.Text.StringBuilder();\n    while (columnNumber > 0)\n    {\n        columnNumber--;\n        sb.Insert(0, (char) ('A' + columnNumber % 26));\n        columnNumber /= 26;\n    }\n    return sb.ToString();\n}`,
              go: `func convertToTitle(columnNumber int) string {\n	out := []byte{}\n	for columnNumber > 0 {\n		columnNumber--\n		out = append(out, byte('A'+columnNumber%26))\n		columnNumber /= 26\n	}\n	for i, j := 0, len(out)-1; i < j; i, j = i+1, j-1 {\n		out[i], out[j] = out[j], out[i]\n	}\n	return string(out)\n}`,
              kotlin: `fun convertToTitle(columnNumber: Int): String {\n    var n = columnNumber\n    val sb = StringBuilder()\n    while (n > 0) {\n        n--\n        sb.append(('A' + n % 26))\n        n /= 26\n    }\n    return sb.reverse().toString()\n}`,
              swift: `func convertToTitle(_ columnNumber: Int) -> String {\n    var n = columnNumber\n    var chars: [Character] = []\n    while n > 0 {\n        n -= 1\n        chars.append(Character(UnicodeScalar(UInt8(65 + n % 26))))\n        n /= 26\n    }\n    return String(chars.reversed())\n}`,
              rust: `fn convertToTitle(columnNumber: i32) -> String {\n    let mut n = columnNumber;\n    let mut bytes: Vec<u8> = Vec::new();\n    while n > 0 {\n        n -= 1;\n        bytes.push(65u8 + (n % 26) as u8);\n        n /= 26;\n    }\n    bytes.reverse();\n    String::from_utf8(bytes).unwrap()\n}`,
              php: `function convertToTitle($columnNumber) {\n    $out = "";\n    while ($columnNumber > 0) {\n        $columnNumber--;\n        $out = chr(65 + $columnNumber % 26) . $out;\n        $columnNumber = intdiv($columnNumber, 26);\n    }\n    return $out;\n}`,
              ruby: `def convertToTitle(columnNumber)\n  out = ""\n  while columnNumber > 0\n    columnNumber -= 1\n    out = (65 + columnNumber % 26).chr + out\n    columnNumber /= 26\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Roman to Integer ────────────────────────────────────────────
  (() => {
    const VAL: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
    const ref = (s: string) => {
      let total = 0;
      for (let i = 0; i < s.length; i++) {
        const v = VAL[s[i]];
        if (i + 1 < s.length && v < VAL[s[i + 1]]) total -= v;
        else total += v;
      }
      return total;
    };
    const toRoman = (num: number) => {
      const vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
      const syms = ["M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"];
      let n = num, out = "";
      for (let i = 0; i < vals.length; i++) while (n >= vals[i]) { out += syms[i]; n -= vals[i]; }
      return out;
    };
    return {
      slug: "roman-to-integer",
      title: "Roman to Integer",
      difficulty: "EASY" as const,
      tags: ["Hash Table", "Math", "String", "Amazon", "Microsoft", "Meta", "Infosys", "Goldman Sachs"],
      signature: { funcName: "romanToInt", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "Roman numerals are written with the symbols `I`, `V`, `X`, `L`, `C`, `D` and `M`, worth 1, 5, 10, 50, 100, 500 and 1000.\n\nNumbers are normally written largest to smallest and added up, but six subtractive pairs exist: `IV` (4), `IX` (9), `XL` (40), `XC` (90), `CD` (400) and `CM` (900).\n\nGiven a valid roman numeral `s`, convert it to an integer.",
        [
          { in: 's = "III"', out: "3" },
          { in: 's = "LVIII"', out: "58", note: "L = 50, V = 5, III = 3." },
          { in: 's = "MCMXCIV"', out: "1994", note: "M = 1000, CM = 900, XC = 90, IV = 4." },
        ],
        ["1 <= s.length <= 15", "s is a valid roman numeral in the range [1, 3999]."]),
      hints: [
        "Scan left to right and look one symbol ahead.",
        "A symbol worth less than the one after it is being subtracted; otherwise it is added.",
        "That single rule covers all six subtractive pairs without listing them.",
      ],
      examples: [
        { input: '"III"', expectedOutput: "3" },
        { input: '"LVIII"', expectedOutput: "58" },
        { input: '"MCMXCIV"', expectedOutput: "1994" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 3999);
        const s = toRoman(n);
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: `def romanToInt(s: str) -> int:\n    val = {"I": 1, "V": 5, "X": 10, "L": 50, "C": 100, "D": 500, "M": 1000}\n    total = 0\n    for i, ch in enumerate(s):\n        if i + 1 < len(s) and val[ch] < val[s[i + 1]]:\n            total -= val[ch]\n        else:\n            total += val[ch]\n    return total`,
        javascript: `var romanToInt = function(s) {\n    const val = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };\n    let total = 0;\n    for (let i = 0; i < s.length; i++) {\n        if (i + 1 < s.length && val[s[i]] < val[s[i + 1]]) total -= val[s[i]];\n        else total += val[s[i]];\n    }\n    return total;\n};`,
              typescript: `function romanToInt(s: string): number {\n    var val: { [key: string]: number } = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };\n    var total = 0;\n    for (var i = 0; i < s.length; i++) {\n        var cur = val[s.charAt(i)];\n        if (i + 1 < s.length && cur < val[s.charAt(i + 1)]) total -= cur;\n        else total += cur;\n    }\n    return total;\n}`,
              java: `public static int romanToInt(String s) {\n    Map<Character, Integer> val = new HashMap<>();\n    val.put('I', 1); val.put('V', 5); val.put('X', 10); val.put('L', 50);\n    val.put('C', 100); val.put('D', 500); val.put('M', 1000);\n    int total = 0;\n    for (int i = 0; i < s.length(); i++) {\n        int cur = val.get(s.charAt(i));\n        if (i + 1 < s.length() && cur < val.get(s.charAt(i + 1))) total -= cur;\n        else total += cur;\n    }\n    return total;\n}`,
              cpp: `int romanToInt(string s) {\n    unordered_map<char, int> val = {{'I', 1}, {'V', 5}, {'X', 10}, {'L', 50}, {'C', 100}, {'D', 500}, {'M', 1000}};\n    int total = 0;\n    for (size_t i = 0; i < s.size(); i++) {\n        int cur = val[s[i]];\n        if (i + 1 < s.size() && cur < val[s[i + 1]]) total -= cur;\n        else total += cur;\n    }\n    return total;\n}`,
              c: `static int romanValue(char c) {\n    switch (c) {\n        case 'I': return 1;\n        case 'V': return 5;\n        case 'X': return 10;\n        case 'L': return 50;\n        case 'C': return 100;\n        case 'D': return 500;\n        default: return 1000;\n    }\n}\n\nint romanToInt(const char* s) {\n    int n = (int) strlen(s);\n    int total = 0;\n    for (int i = 0; i < n; i++) {\n        int cur = romanValue(s[i]);\n        if (i + 1 < n && cur < romanValue(s[i + 1])) total -= cur;\n        else total += cur;\n    }\n    return total;\n}`,
              csharp: `public static int RomanToInt(string s)\n{\n    var val = new Dictionary<char, int> {\n        { 'I', 1 }, { 'V', 5 }, { 'X', 10 }, { 'L', 50 },\n        { 'C', 100 }, { 'D', 500 }, { 'M', 1000 }\n    };\n    int total = 0;\n    for (int i = 0; i < s.Length; i++)\n    {\n        int cur = val[s[i]];\n        if (i + 1 < s.Length && cur < val[s[i + 1]]) total -= cur;\n        else total += cur;\n    }\n    return total;\n}`,
              go: `func romanToInt(s string) int {\n	val := map[byte]int{'I': 1, 'V': 5, 'X': 10, 'L': 50, 'C': 100, 'D': 500, 'M': 1000}\n	total := 0\n	for i := 0; i < len(s); i++ {\n		cur := val[s[i]]\n		if i+1 < len(s) && cur < val[s[i+1]] {\n			total -= cur\n		} else {\n			total += cur\n		}\n	}\n	return total\n}`,
              kotlin: `fun romanToInt(s: String): Int {\n    val val_ = hashMapOf('I' to 1, 'V' to 5, 'X' to 10, 'L' to 50, 'C' to 100, 'D' to 500, 'M' to 1000)\n    var total = 0\n    for (i in 0 until s.length) {\n        val cur = val_[s[i]]!!\n        if (i + 1 < s.length && cur < val_[s[i + 1]]!!) total -= cur\n        else total += cur\n    }\n    return total\n}`,
              swift: `func romanToInt(_ s: String) -> Int {\n    let val: [Character: Int] = ["I": 1, "V": 5, "X": 10, "L": 50, "C": 100, "D": 500, "M": 1000]\n    let chars = Array(s)\n    var total = 0\n    for i in 0..<chars.count {\n        let cur = val[chars[i]]!\n        if i + 1 < chars.count && cur < val[chars[i + 1]]! {\n            total -= cur\n        } else {\n            total += cur\n        }\n    }\n    return total\n}`,
              rust: `fn romanToInt(s: String) -> i32 {\n    fn value(c: u8) -> i32 {\n        match c {\n            b'I' => 1,\n            b'V' => 5,\n            b'X' => 10,\n            b'L' => 50,\n            b'C' => 100,\n            b'D' => 500,\n            _ => 1000,\n        }\n    }\n    let bytes = s.as_bytes();\n    let mut total = 0;\n    for i in 0..bytes.len() {\n        let cur = value(bytes[i]);\n        if i + 1 < bytes.len() && cur < value(bytes[i + 1]) {\n            total -= cur;\n        } else {\n            total += cur;\n        }\n    }\n    total\n}`,
              php: `function romanToInt($s) {\n    $val = array("I" => 1, "V" => 5, "X" => 10, "L" => 50, "C" => 100, "D" => 500, "M" => 1000);\n    $total = 0;\n    $n = strlen($s);\n    for ($i = 0; $i < $n; $i++) {\n        $cur = $val[$s[$i]];\n        if ($i + 1 < $n && $cur < $val[$s[$i + 1]]) $total -= $cur;\n        else $total += $cur;\n    }\n    return $total;\n}`,
              ruby: `def romanToInt(s)\n  val = { "I" => 1, "V" => 5, "X" => 10, "L" => 50, "C" => 100, "D" => 500, "M" => 1000 }\n  total = 0\n  (0...s.length).each do |i|\n    cur = val[s[i]]\n    if i + 1 < s.length && cur < val[s[i + 1]]\n      total -= cur\n    else\n      total += cur\n    end\n  end\n  total\nend`,
      },
    };
  })(),

  // ── Integer to Roman ────────────────────────────────────────────
  (() => {
    const VALS = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
    const SYMS = ["M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"];
    const ref = (num: number) => {
      let n = num, out = "";
      for (let i = 0; i < VALS.length; i++) while (n >= VALS[i]) { out += SYMS[i]; n -= VALS[i]; }
      return out;
    };
    return {
      slug: "integer-to-roman",
      title: "Integer to Roman",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "Math", "String", "Greedy", "Amazon", "Microsoft", "Adobe", "Twitter"],
      signature: { funcName: "intToRoman", params: [{ name: "num", type: "int" as const }], returns: "string" as const },
      description: describe(
        "Given an integer `num` between 1 and 3999, convert it to a roman numeral.\n\nSymbols are written largest to smallest and added up, except for the six subtractive pairs `IV` (4), `IX` (9), `XL` (40), `XC` (90), `CD` (400) and `CM` (900).",
        [
          { in: "num = 3", out: "III" },
          { in: "num = 58", out: "LVIII", note: "50 + 5 + 3." },
          { in: "num = 1994", out: "MCMXCIV", note: "1000 + 900 + 90 + 4." },
        ],
        ["1 <= num <= 3999"]),
      hints: [
        "Put the six subtractive pairs into the value table alongside the seven plain symbols — thirteen values in all.",
        "Walk the table from the largest value down, appending the symbol and subtracting while the value still fits.",
        "Greedy is exact here because each table entry is a distinct denomination that only one representation can use.",
      ],
      examples: [
        { input: "3", expectedOutput: "III" },
        { input: "58", expectedOutput: "LVIII" },
        { input: "1994", expectedOutput: "MCMXCIV" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 3999);
        return { input: String(n), expectedOutput: ref(n) };
      },
      solutions: {
        python: `def intToRoman(num: int) -> str:\n    vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1]\n    syms = ["M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"]\n    out = []\n    for v, sym in zip(vals, syms):\n        while num >= v:\n            out.append(sym)\n            num -= v\n    return "".join(out)`,
        javascript: `var intToRoman = function(num) {\n    const vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];\n    const syms = ["M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"];\n    let out = "";\n    for (let i = 0; i < vals.length; i++) {\n        while (num >= vals[i]) {\n            out += syms[i];\n            num -= vals[i];\n        }\n    }\n    return out;\n};`,
              typescript: `function intToRoman(num: number): string {\n    var vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];\n    var syms = ["M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"];\n    var out = "";\n    for (var i = 0; i < vals.length; i++) {\n        while (num >= vals[i]) {\n            out += syms[i];\n            num -= vals[i];\n        }\n    }\n    return out;\n}`,
              java: `public static String intToRoman(int num) {\n    int[] vals = {1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1};\n    String[] syms = {"M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"};\n    StringBuilder sb = new StringBuilder();\n    for (int i = 0; i < vals.length; i++) {\n        while (num >= vals[i]) {\n            sb.append(syms[i]);\n            num -= vals[i];\n        }\n    }\n    return sb.toString();\n}`,
              cpp: `string intToRoman(int num) {\n    int vals[13] = {1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1};\n    string syms[13] = {"M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"};\n    string out = "";\n    for (int i = 0; i < 13; i++) {\n        while (num >= vals[i]) {\n            out += syms[i];\n            num -= vals[i];\n        }\n    }\n    return out;\n}`,
              c: `char* intToRoman(int num) {\n    int vals[13] = {1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1};\n    const char* syms[13] = {"M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"};\n    char* out = (char*) malloc(32);\n    int len = 0;\n    for (int i = 0; i < 13; i++) {\n        while (num >= vals[i]) {\n            const char* sym = syms[i];\n            for (int k = 0; sym[k] != '\\0'; k++) out[len++] = sym[k];\n            num -= vals[i];\n        }\n    }\n    out[len] = '\\0';\n    return out;\n}`,
              csharp: `public static string IntToRoman(int num)\n{\n    int[] vals = { 1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1 };\n    string[] syms = { "M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I" };\n    var sb = new System.Text.StringBuilder();\n    for (int i = 0; i < vals.Length; i++)\n    {\n        while (num >= vals[i])\n        {\n            sb.Append(syms[i]);\n            num -= vals[i];\n        }\n    }\n    return sb.ToString();\n}`,
              go: `func intToRoman(num int) string {\n	vals := []int{1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1}\n	syms := []string{"M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"}\n	var sb strings.Builder\n	for i := 0; i < len(vals); i++ {\n		for num >= vals[i] {\n			sb.WriteString(syms[i])\n			num -= vals[i]\n		}\n	}\n	return sb.String()\n}`,
              kotlin: `fun intToRoman(num: Int): String {\n    var n = num\n    val vals = intArrayOf(1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1)\n    val syms = arrayOf("M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I")\n    val sb = StringBuilder()\n    for (i in vals.indices) {\n        while (n >= vals[i]) {\n            sb.append(syms[i])\n            n -= vals[i]\n        }\n    }\n    return sb.toString()\n}`,
              swift: `func intToRoman(_ num: Int) -> String {\n    var n = num\n    let vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1]\n    let syms = ["M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"]\n    var out = ""\n    for i in 0..<vals.count {\n        while n >= vals[i] {\n            out += syms[i]\n            n -= vals[i]\n        }\n    }\n    return out\n}`,
              rust: `fn intToRoman(num: i32) -> String {\n    let mut n = num;\n    let vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];\n    let syms = ["M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"];\n    let mut out = String::new();\n    for i in 0..vals.len() {\n        while n >= vals[i] {\n            out.push_str(syms[i]);\n            n -= vals[i];\n        }\n    }\n    out\n}`,
              php: `function intToRoman($num) {\n    $vals = array(1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1);\n    $syms = array("M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I");\n    $out = "";\n    for ($i = 0; $i < 13; $i++) {\n        while ($num >= $vals[$i]) {\n            $out .= $syms[$i];\n            $num -= $vals[$i];\n        }\n    }\n    return $out;\n}`,
              ruby: `def intToRoman(num)\n  vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1]\n  syms = ["M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"]\n  out = ""\n  vals.each_with_index do |v, i|\n    while num >= v\n      out += syms[i]\n      num -= v\n    end\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Add Binary ──────────────────────────────────────────────────
  (() => {
    const ref = (a: string, b: string) => {
      let i = a.length - 1, j = b.length - 1, carry = 0, out = "";
      while (i >= 0 || j >= 0 || carry > 0) {
        const s = (i >= 0 ? a.charCodeAt(i) - 48 : 0) + (j >= 0 ? b.charCodeAt(j) - 48 : 0) + carry;
        out = String(s % 2) + out;
        carry = s > 1 ? 1 : 0;
        i--; j--;
      }
      return out;
    };
    const randBits = (rng: Rng, lo: number, hi: number) => {
      const len = ri(rng, lo, hi);
      let s = String(ri(rng, 0, 1));
      for (let i = 1; i < len; i++) s += String(ri(rng, 0, 1));
      return s.length > 1 && s[0] === "0" ? String(ri(rng, 0, 1)) + s.slice(1) : s;
    };
    return {
      slug: "add-binary",
      title: "Add Binary",
      difficulty: "EASY" as const,
      tags: ["Math", "String", "Bit Manipulation", "Simulation", "Google", "Meta", "Amazon", "Adobe"],
      signature: { funcName: "addBinary", params: [{ name: "a", type: "string" as const }, { name: "b", type: "string" as const }], returns: "string" as const },
      description: describe(
        "Given two binary strings `a` and `b`, return their sum as a binary string.",
        [
          { in: 'a = "11", b = "1"', out: "100" },
          { in: 'a = "1010", b = "1011"', out: "10101" },
          { in: 'a = "0", b = "0"', out: "0" },
        ],
        ["1 <= a.length, b.length <= 24", "a and b consist only of '0' or '1' characters."]),
      hints: [
        "Do not convert to a number — the inputs can be longer than any built-in integer.",
        "Walk both strings from the right with a carry, exactly as you would add on paper.",
        "Keep looping while either string has digits left **or** the carry is still 1.",
      ],
      examples: [
        { input: '"11"\n"1"', expectedOutput: "100" },
        { input: '"1010"\n"1011"', expectedOutput: "10101" },
        { input: '"0"\n"0"', expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const a = randBits(rng, 1, 24), b = randBits(rng, 1, 24);
        return { input: `"${a}"\n"${b}"`, expectedOutput: ref(a, b) };
      },
      solutions: {
        python: `def addBinary(a: str, b: str) -> str:\n    i, j, carry = len(a) - 1, len(b) - 1, 0\n    out = []\n    while i >= 0 or j >= 0 or carry:\n        total = carry\n        if i >= 0:\n            total += int(a[i])\n            i -= 1\n        if j >= 0:\n            total += int(b[j])\n            j -= 1\n        out.append(str(total % 2))\n        carry = total // 2\n    return "".join(reversed(out))`,
        javascript: `var addBinary = function(a, b) {\n    let i = a.length - 1, j = b.length - 1, carry = 0, out = "";\n    while (i >= 0 || j >= 0 || carry > 0) {\n        let total = carry;\n        if (i >= 0) { total += a.charCodeAt(i) - 48; i--; }\n        if (j >= 0) { total += b.charCodeAt(j) - 48; j--; }\n        out = String(total % 2) + out;\n        carry = total > 1 ? 1 : 0;\n    }\n    return out;\n};`,
              typescript: `function addBinary(a: string, b: string): string {\n    var i = a.length - 1;\n    var j = b.length - 1;\n    var carry = 0;\n    var out = "";\n    while (i >= 0 || j >= 0 || carry > 0) {\n        var total = carry;\n        if (i >= 0) { total += a.charCodeAt(i) - 48; i--; }\n        if (j >= 0) { total += b.charCodeAt(j) - 48; j--; }\n        out = String(total % 2) + out;\n        carry = total > 1 ? 1 : 0;\n    }\n    return out;\n}`,
              java: `public static String addBinary(String a, String b) {\n    int i = a.length() - 1, j = b.length() - 1, carry = 0;\n    StringBuilder sb = new StringBuilder();\n    while (i >= 0 || j >= 0 || carry > 0) {\n        int total = carry;\n        if (i >= 0) { total += a.charAt(i) - '0'; i--; }\n        if (j >= 0) { total += b.charAt(j) - '0'; j--; }\n        sb.append((char) ('0' + total % 2));\n        carry = total > 1 ? 1 : 0;\n    }\n    return sb.reverse().toString();\n}`,
              cpp: `string addBinary(string a, string b) {\n    int i = (int) a.size() - 1, j = (int) b.size() - 1, carry = 0;\n    string out = "";\n    while (i >= 0 || j >= 0 || carry > 0) {\n        int total = carry;\n        if (i >= 0) { total += a[i] - '0'; i--; }\n        if (j >= 0) { total += b[j] - '0'; j--; }\n        out += (char) ('0' + total % 2);\n        carry = total > 1 ? 1 : 0;\n    }\n    reverse(out.begin(), out.end());\n    return out;\n}`,
              c: `char* addBinary(const char* a, const char* b) {\n    int i = (int) strlen(a) - 1;\n    int j = (int) strlen(b) - 1;\n    int carry = 0;\n    int cap = (i > j ? i : j) + 3;\n    char* buf = (char*) malloc(cap);\n    int len = 0;\n    while (i >= 0 || j >= 0 || carry > 0) {\n        int total = carry;\n        if (i >= 0) { total += a[i] - '0'; i--; }\n        if (j >= 0) { total += b[j] - '0'; j--; }\n        buf[len++] = (char) ('0' + total % 2);\n        carry = total > 1 ? 1 : 0;\n    }\n    char* out = (char*) malloc(len + 1);\n    for (int k = 0; k < len; k++) out[k] = buf[len - 1 - k];\n    out[len] = '\\0';\n    free(buf);\n    return out;\n}`,
              csharp: `public static string AddBinary(string a, string b)\n{\n    int i = a.Length - 1, j = b.Length - 1, carry = 0;\n    var sb = new System.Text.StringBuilder();\n    while (i >= 0 || j >= 0 || carry > 0)\n    {\n        int total = carry;\n        if (i >= 0) { total += a[i] - '0'; i--; }\n        if (j >= 0) { total += b[j] - '0'; j--; }\n        sb.Insert(0, (char) ('0' + total % 2));\n        carry = total > 1 ? 1 : 0;\n    }\n    return sb.ToString();\n}`,
              go: `func addBinary(a string, b string) string {\n	i, j, carry := len(a)-1, len(b)-1, 0\n	out := []byte{}\n	for i >= 0 || j >= 0 || carry > 0 {\n		total := carry\n		if i >= 0 {\n			total += int(a[i] - '0')\n			i--\n		}\n		if j >= 0 {\n			total += int(b[j] - '0')\n			j--\n		}\n		out = append(out, byte('0'+total%2))\n		if total > 1 {\n			carry = 1\n		} else {\n			carry = 0\n		}\n	}\n	for x, y := 0, len(out)-1; x < y; x, y = x+1, y-1 {\n		out[x], out[y] = out[y], out[x]\n	}\n	return string(out)\n}`,
              kotlin: `fun addBinary(a: String, b: String): String {\n    var i = a.length - 1\n    var j = b.length - 1\n    var carry = 0\n    val sb = StringBuilder()\n    while (i >= 0 || j >= 0 || carry > 0) {\n        var total = carry\n        if (i >= 0) { total += a[i] - '0'; i-- }\n        if (j >= 0) { total += b[j] - '0'; j-- }\n        sb.append(('0' + total % 2))\n        carry = if (total > 1) 1 else 0\n    }\n    return sb.reverse().toString()\n}`,
              swift: `func addBinary(_ a: String, _ b: String) -> String {\n    let av = Array(a.utf8)\n    let bv = Array(b.utf8)\n    var i = av.count - 1\n    var j = bv.count - 1\n    var carry = 0\n    var chars: [Character] = []\n    while i >= 0 || j >= 0 || carry > 0 {\n        var total = carry\n        if i >= 0 { total += Int(av[i]) - 48; i -= 1 }\n        if j >= 0 { total += Int(bv[j]) - 48; j -= 1 }\n        chars.append(Character(UnicodeScalar(UInt8(48 + total % 2))))\n        carry = total > 1 ? 1 : 0\n    }\n    return String(chars.reversed())\n}`,
              rust: `fn addBinary(a: String, b: String) -> String {\n    let av = a.as_bytes();\n    let bv = b.as_bytes();\n    let mut i = av.len() as i32 - 1;\n    let mut j = bv.len() as i32 - 1;\n    let mut carry = 0;\n    let mut out: Vec<u8> = Vec::new();\n    while i >= 0 || j >= 0 || carry > 0 {\n        let mut total = carry;\n        if i >= 0 {\n            total += (av[i as usize] - b'0') as i32;\n            i -= 1;\n        }\n        if j >= 0 {\n            total += (bv[j as usize] - b'0') as i32;\n            j -= 1;\n        }\n        out.push(b'0' + (total % 2) as u8);\n        carry = if total > 1 { 1 } else { 0 };\n    }\n    out.reverse();\n    String::from_utf8(out).unwrap()\n}`,
              php: `function addBinary($a, $b) {\n    $i = strlen($a) - 1;\n    $j = strlen($b) - 1;\n    $carry = 0;\n    $out = "";\n    while ($i >= 0 || $j >= 0 || $carry > 0) {\n        $total = $carry;\n        if ($i >= 0) { $total += ord($a[$i]) - 48; $i--; }\n        if ($j >= 0) { $total += ord($b[$j]) - 48; $j--; }\n        $out = strval($total % 2) . $out;\n        $carry = $total > 1 ? 1 : 0;\n    }\n    return $out;\n}`,
              ruby: `def addBinary(a, b)\n  i = a.length - 1\n  j = b.length - 1\n  carry = 0\n  out = ""\n  while i >= 0 || j >= 0 || carry > 0\n    total = carry\n    if i >= 0\n      total += a[i].ord - 48\n      i -= 1\n    end\n    if j >= 0\n      total += b[j].ord - 48\n      j -= 1\n    end\n    out = (total % 2).to_s + out\n    carry = total > 1 ? 1 : 0\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Plus One ────────────────────────────────────────────────────
  (() => {
    const ref = (digits: number[]) => {
      const d = digits.slice();
      for (let i = d.length - 1; i >= 0; i--) {
        if (d[i] < 9) { d[i]++; return d; }
        d[i] = 0;
      }
      return [1].concat(d);
    };
    return {
      slug: "plus-one",
      title: "Plus One",
      difficulty: "EASY" as const,
      tags: ["Array", "Math", "Google", "Amazon", "Meta", "Apple", "TCS"],
      signature: { funcName: "plusOne", params: [{ name: "digits", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "You are given a large integer represented as an integer array `digits`, where each `digits[i]` is the i-th digit, ordered most significant first. The integer has no leading zeros.\n\nIncrement the integer by one and return the resulting array of digits.",
        [
          { in: "digits = [1,2,3]", out: "[1,2,4]", note: "123 + 1 = 124." },
          { in: "digits = [4,3,9]", out: "[4,4,0]", note: "The 9 rolls over and carries into the 3." },
          { in: "digits = [9,9]", out: "[1,0,0]", note: "Every digit rolls over, so the result is one digit longer." },
        ],
        ["1 <= digits.length <= 40", "0 <= digits[i] <= 9", "digits does not contain leading zeros."]),
      hints: [
        "Walk from the last digit backwards.",
        "A digit below 9 can absorb the increment — bump it and you are done immediately.",
        "A 9 becomes 0 and the carry continues. If the loop runs off the front, every digit was a 9: prepend a 1.",
      ],
      examples: [
        { input: "[1,2,3]", expectedOutput: "[1,2,4]" },
        { input: "[4,3,9]", expectedOutput: "[4,4,0]" },
        { input: "[9,9]", expectedOutput: "[1,0,0]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 40);
        const nines = rng() < 0.25;
        const d: number[] = [];
        for (let i = 0; i < n; i++) d.push(nines ? 9 : ri(rng, 0, 9));
        if (d[0] === 0) d[0] = ri(rng, 1, 9);
        return { input: fmtIntArr(d), expectedOutput: fmtIntArr(ref(d)) };
      },
      solutions: {
        python: `def plusOne(digits):\n    d = list(digits)\n    for i in range(len(d) - 1, -1, -1):\n        if d[i] < 9:\n            d[i] += 1\n            return d\n        d[i] = 0\n    return [1] + d`,
        javascript: `var plusOne = function(digits) {\n    const d = digits.slice();\n    for (let i = d.length - 1; i >= 0; i--) {\n        if (d[i] < 9) {\n            d[i]++;\n            return d;\n        }\n        d[i] = 0;\n    }\n    return [1].concat(d);\n};`,
              typescript: `function plusOne(digits: number[]): number[] {\n    var d = digits.slice();\n    for (var i = d.length - 1; i >= 0; i--) {\n        if (d[i] < 9) {\n            d[i]++;\n            return d;\n        }\n        d[i] = 0;\n    }\n    return [1].concat(d);\n}`,
              java: `public static int[] plusOne(int[] digits) {\n    int[] d = Arrays.copyOf(digits, digits.length);\n    for (int i = d.length - 1; i >= 0; i--) {\n        if (d[i] < 9) {\n            d[i]++;\n            return d;\n        }\n        d[i] = 0;\n    }\n    int[] out = new int[d.length + 1];\n    out[0] = 1;\n    return out;\n}`,
              cpp: `vector<int> plusOne(vector<int>& digits) {\n    vector<int> d = digits;\n    for (int i = (int) d.size() - 1; i >= 0; i--) {\n        if (d[i] < 9) {\n            d[i]++;\n            return d;\n        }\n        d[i] = 0;\n    }\n    vector<int> out(d.size() + 1, 0);\n    out[0] = 1;\n    return out;\n}`,
              c: `int* plusOne(int* digits, int digitsSize, int* returnSize) {\n    int* d = (int*) malloc(sizeof(int) * (digitsSize + 1));\n    for (int i = 0; i < digitsSize; i++) d[i + 1] = digits[i];\n    d[0] = 0;\n    for (int i = digitsSize; i >= 1; i--) {\n        if (d[i] < 9) {\n            d[i]++;\n            *returnSize = digitsSize;\n            return d + 1;\n        }\n        d[i] = 0;\n    }\n    d[0] = 1;\n    *returnSize = digitsSize + 1;\n    return d;\n}`,
              csharp: `public static int[] PlusOne(int[] digits)\n{\n    int[] d = (int[]) digits.Clone();\n    for (int i = d.Length - 1; i >= 0; i--)\n    {\n        if (d[i] < 9)\n        {\n            d[i]++;\n            return d;\n        }\n        d[i] = 0;\n    }\n    int[] outArr = new int[d.Length + 1];\n    outArr[0] = 1;\n    return outArr;\n}`,
              go: `func plusOne(digits []int) []int {\n	d := make([]int, len(digits))\n	copy(d, digits)\n	for i := len(d) - 1; i >= 0; i-- {\n		if d[i] < 9 {\n			d[i]++\n			return d\n		}\n		d[i] = 0\n	}\n	out := make([]int, len(d)+1)\n	out[0] = 1\n	return out\n}`,
              kotlin: `fun plusOne(digits: IntArray): IntArray {\n    val d = digits.copyOf()\n    for (i in d.indices.reversed()) {\n        if (d[i] < 9) {\n            d[i]++\n            return d\n        }\n        d[i] = 0\n    }\n    val out = IntArray(d.size + 1)\n    out[0] = 1\n    return out\n}`,
              swift: `func plusOne(_ digits: [Int]) -> [Int] {\n    var d = digits\n    var i = d.count - 1\n    while i >= 0 {\n        if d[i] < 9 {\n            d[i] += 1\n            return d\n        }\n        d[i] = 0\n        i -= 1\n    }\n    var out = [Int](repeating: 0, count: d.count + 1)\n    out[0] = 1\n    return out\n}`,
              rust: `fn plusOne(digits: Vec<i32>) -> Vec<i32> {\n    let mut d = digits;\n    let mut i = d.len();\n    while i > 0 {\n        i -= 1;\n        if d[i] < 9 {\n            d[i] += 1;\n            return d;\n        }\n        d[i] = 0;\n    }\n    let mut out = vec![0; d.len() + 1];\n    out[0] = 1;\n    out\n}`,
              php: `function plusOne($digits) {\n    $d = $digits;\n    for ($i = count($d) - 1; $i >= 0; $i--) {\n        if ($d[$i] < 9) {\n            $d[$i]++;\n            return $d;\n        }\n        $d[$i] = 0;\n    }\n    array_unshift($d, 1);\n    return $d;\n}`,
              ruby: `def plusOne(digits)\n  d = digits.dup\n  i = d.length - 1\n  while i >= 0\n    if d[i] < 9\n      d[i] += 1\n      return d\n    end\n    d[i] = 0\n    i -= 1\n  end\n  [1] + d\nend`,
      },
    };
  })(),

  // ── Add Strings ─────────────────────────────────────────────────
  (() => {
    const ref = (a: string, b: string) => {
      let i = a.length - 1, j = b.length - 1, carry = 0, out = "";
      while (i >= 0 || j >= 0 || carry > 0) {
        const s = (i >= 0 ? a.charCodeAt(i) - 48 : 0) + (j >= 0 ? b.charCodeAt(j) - 48 : 0) + carry;
        out = String(s % 10) + out;
        carry = s >= 10 ? 1 : 0;
        i--; j--;
      }
      return out;
    };
    const randNum = (rng: Rng) => {
      const len = ri(rng, 1, 20);
      if (len === 1) return String(ri(rng, 0, 9));
      let s = String(ri(rng, 1, 9));
      for (let i = 1; i < len; i++) s += String(ri(rng, 0, 9));
      return s;
    };
    return {
      slug: "add-strings",
      title: "Add Strings",
      difficulty: "EASY" as const,
      tags: ["Math", "String", "Simulation", "Google", "Amazon", "Meta", "Airbnb"],
      signature: { funcName: "addStrings", params: [{ name: "num1", type: "string" as const }, { name: "num2", type: "string" as const }], returns: "string" as const },
      description: describe(
        "Given two non-negative integers `num1` and `num2` represented as strings, return their sum as a string.\n\nYou must solve the problem without converting the inputs to integers directly and without using any big-integer library.",
        [
          { in: 'num1 = "11", num2 = "123"', out: "134" },
          { in: 'num1 = "456", num2 = "77"', out: "533" },
          { in: 'num1 = "0", num2 = "0"', out: "0" },
        ],
        ["1 <= num1.length, num2.length <= 20", "num1 and num2 consist of digits only.", "Neither has a leading zero, except the value 0 itself."]),
      hints: [
        "Column addition from the right, carrying as you go.",
        "Treat a missing digit in the shorter string as 0 rather than special-casing the lengths.",
        "The loop must survive a final carry — `\"9\" + \"1\"` is `\"10\"`, one character longer than either input.",
      ],
      examples: [
        { input: '"11"\n"123"', expectedOutput: "134" },
        { input: '"456"\n"77"', expectedOutput: "533" },
        { input: '"0"\n"0"', expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const a = randNum(rng), b = randNum(rng);
        return { input: `"${a}"\n"${b}"`, expectedOutput: ref(a, b) };
      },
      solutions: {
        python: `def addStrings(num1: str, num2: str) -> str:\n    i, j, carry = len(num1) - 1, len(num2) - 1, 0\n    out = []\n    while i >= 0 or j >= 0 or carry:\n        total = carry\n        if i >= 0:\n            total += ord(num1[i]) - 48\n            i -= 1\n        if j >= 0:\n            total += ord(num2[j]) - 48\n            j -= 1\n        out.append(str(total % 10))\n        carry = total // 10\n    return "".join(reversed(out))`,
        javascript: `var addStrings = function(num1, num2) {\n    let i = num1.length - 1, j = num2.length - 1, carry = 0, out = "";\n    while (i >= 0 || j >= 0 || carry > 0) {\n        let total = carry;\n        if (i >= 0) { total += num1.charCodeAt(i) - 48; i--; }\n        if (j >= 0) { total += num2.charCodeAt(j) - 48; j--; }\n        out = String(total % 10) + out;\n        carry = total >= 10 ? 1 : 0;\n    }\n    return out;\n};`,
              typescript: `function addStrings(num1: string, num2: string): string {\n    var i = num1.length - 1;\n    var j = num2.length - 1;\n    var carry = 0;\n    var out = "";\n    while (i >= 0 || j >= 0 || carry > 0) {\n        var total = carry;\n        if (i >= 0) { total += num1.charCodeAt(i) - 48; i--; }\n        if (j >= 0) { total += num2.charCodeAt(j) - 48; j--; }\n        out = String(total % 10) + out;\n        carry = total >= 10 ? 1 : 0;\n    }\n    return out;\n}`,
              java: `public static String addStrings(String num1, String num2) {\n    int i = num1.length() - 1, j = num2.length() - 1, carry = 0;\n    StringBuilder sb = new StringBuilder();\n    while (i >= 0 || j >= 0 || carry > 0) {\n        int total = carry;\n        if (i >= 0) { total += num1.charAt(i) - '0'; i--; }\n        if (j >= 0) { total += num2.charAt(j) - '0'; j--; }\n        sb.append((char) ('0' + total % 10));\n        carry = total >= 10 ? 1 : 0;\n    }\n    return sb.reverse().toString();\n}`,
              cpp: `string addStrings(string num1, string num2) {\n    int i = (int) num1.size() - 1, j = (int) num2.size() - 1, carry = 0;\n    string out = "";\n    while (i >= 0 || j >= 0 || carry > 0) {\n        int total = carry;\n        if (i >= 0) { total += num1[i] - '0'; i--; }\n        if (j >= 0) { total += num2[j] - '0'; j--; }\n        out += (char) ('0' + total % 10);\n        carry = total >= 10 ? 1 : 0;\n    }\n    reverse(out.begin(), out.end());\n    return out;\n}`,
              c: `char* addStrings(const char* num1, const char* num2) {\n    int i = (int) strlen(num1) - 1;\n    int j = (int) strlen(num2) - 1;\n    int carry = 0;\n    int cap = (i > j ? i : j) + 3;\n    char* buf = (char*) malloc(cap);\n    int len = 0;\n    while (i >= 0 || j >= 0 || carry > 0) {\n        int total = carry;\n        if (i >= 0) { total += num1[i] - '0'; i--; }\n        if (j >= 0) { total += num2[j] - '0'; j--; }\n        buf[len++] = (char) ('0' + total % 10);\n        carry = total >= 10 ? 1 : 0;\n    }\n    char* out = (char*) malloc(len + 1);\n    for (int k = 0; k < len; k++) out[k] = buf[len - 1 - k];\n    out[len] = '\\0';\n    free(buf);\n    return out;\n}`,
              csharp: `public static string AddStrings(string num1, string num2)\n{\n    int i = num1.Length - 1, j = num2.Length - 1, carry = 0;\n    var sb = new System.Text.StringBuilder();\n    while (i >= 0 || j >= 0 || carry > 0)\n    {\n        int total = carry;\n        if (i >= 0) { total += num1[i] - '0'; i--; }\n        if (j >= 0) { total += num2[j] - '0'; j--; }\n        sb.Insert(0, (char) ('0' + total % 10));\n        carry = total >= 10 ? 1 : 0;\n    }\n    return sb.ToString();\n}`,
              go: `func addStrings(num1 string, num2 string) string {\n	i, j, carry := len(num1)-1, len(num2)-1, 0\n	out := []byte{}\n	for i >= 0 || j >= 0 || carry > 0 {\n		total := carry\n		if i >= 0 {\n			total += int(num1[i] - '0')\n			i--\n		}\n		if j >= 0 {\n			total += int(num2[j] - '0')\n			j--\n		}\n		out = append(out, byte('0'+total%10))\n		if total >= 10 {\n			carry = 1\n		} else {\n			carry = 0\n		}\n	}\n	for x, y := 0, len(out)-1; x < y; x, y = x+1, y-1 {\n		out[x], out[y] = out[y], out[x]\n	}\n	return string(out)\n}`,
              kotlin: `fun addStrings(num1: String, num2: String): String {\n    var i = num1.length - 1\n    var j = num2.length - 1\n    var carry = 0\n    val sb = StringBuilder()\n    while (i >= 0 || j >= 0 || carry > 0) {\n        var total = carry\n        if (i >= 0) { total += num1[i] - '0'; i-- }\n        if (j >= 0) { total += num2[j] - '0'; j-- }\n        sb.append(('0' + total % 10))\n        carry = if (total >= 10) 1 else 0\n    }\n    return sb.reverse().toString()\n}`,
              swift: `func addStrings(_ num1: String, _ num2: String) -> String {\n    let av = Array(num1.utf8)\n    let bv = Array(num2.utf8)\n    var i = av.count - 1\n    var j = bv.count - 1\n    var carry = 0\n    var chars: [Character] = []\n    while i >= 0 || j >= 0 || carry > 0 {\n        var total = carry\n        if i >= 0 { total += Int(av[i]) - 48; i -= 1 }\n        if j >= 0 { total += Int(bv[j]) - 48; j -= 1 }\n        chars.append(Character(UnicodeScalar(UInt8(48 + total % 10))))\n        carry = total >= 10 ? 1 : 0\n    }\n    return String(chars.reversed())\n}`,
              rust: `fn addStrings(num1: String, num2: String) -> String {\n    let av = num1.as_bytes();\n    let bv = num2.as_bytes();\n    let mut i = av.len() as i32 - 1;\n    let mut j = bv.len() as i32 - 1;\n    let mut carry = 0;\n    let mut out: Vec<u8> = Vec::new();\n    while i >= 0 || j >= 0 || carry > 0 {\n        let mut total = carry;\n        if i >= 0 {\n            total += (av[i as usize] - b'0') as i32;\n            i -= 1;\n        }\n        if j >= 0 {\n            total += (bv[j as usize] - b'0') as i32;\n            j -= 1;\n        }\n        out.push(b'0' + (total % 10) as u8);\n        carry = if total >= 10 { 1 } else { 0 };\n    }\n    out.reverse();\n    String::from_utf8(out).unwrap()\n}`,
              php: `function addStrings($num1, $num2) {\n    $i = strlen($num1) - 1;\n    $j = strlen($num2) - 1;\n    $carry = 0;\n    $out = "";\n    while ($i >= 0 || $j >= 0 || $carry > 0) {\n        $total = $carry;\n        if ($i >= 0) { $total += ord($num1[$i]) - 48; $i--; }\n        if ($j >= 0) { $total += ord($num2[$j]) - 48; $j--; }\n        $out = strval($total % 10) . $out;\n        $carry = $total >= 10 ? 1 : 0;\n    }\n    return $out;\n}`,
              ruby: `def addStrings(num1, num2)\n  i = num1.length - 1\n  j = num2.length - 1\n  carry = 0\n  out = ""\n  while i >= 0 || j >= 0 || carry > 0\n    total = carry\n    if i >= 0\n      total += num1[i].ord - 48\n      i -= 1\n    end\n    if j >= 0\n      total += num2[j].ord - 48\n      j -= 1\n    end\n    out = (total % 10).to_s + out\n    carry = total >= 10 ? 1 : 0\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Fibonacci Number ────────────────────────────────────────────
  (() => {
    const ref = (n: number) => {
      let a = 0, b = 1;
      for (let i = 0; i < n; i++) { const t = a + b; a = b; b = t; }
      return a;
    };
    return {
      slug: "fibonacci-number",
      title: "Fibonacci Number",
      difficulty: "EASY" as const,
      tags: ["Math", "Dynamic Programming", "Recursion", "TCS", "Infosys", "Wipro", "Amazon", "Accenture"],
      signature: { funcName: "fib", params: [{ name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "The Fibonacci numbers form the sequence `F` where each number is the sum of the two before it, starting from 0 and 1:\n\n```\nF(0) = 0,  F(1) = 1\nF(n) = F(n - 1) + F(n - 2)   for n > 1\n```\n\nGiven `n`, calculate `F(n)`.",
        [
          { in: "n = 2", out: "1", note: "F(2) = F(1) + F(0) = 1 + 0 = 1." },
          { in: "n = 4", out: "3", note: "F(4) = F(3) + F(2) = 2 + 1 = 3." },
          { in: "n = 0", out: "0" },
        ],
        ["0 <= n <= 46", "The answer fits in a signed 32-bit integer."],
        "The naive recursion is O(2^n). Can you answer in O(n) time and O(1) space?"),
      hints: [
        "Plain recursion recomputes the same F(k) exponentially many times.",
        "Only the last two values ever matter, so carry them in two variables and slide forward.",
        "Start with a = F(0) = 0 and b = F(1) = 1, then repeat `(a, b) = (b, a + b)` exactly n times.",
      ],
      examples: [
        { input: "2", expectedOutput: "1" },
        { input: "4", expectedOutput: "3" },
        { input: "0", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 0, 46);
        return { input: String(n), expectedOutput: String(ref(n)) };
      },
      solutions: {
        python: `def fib(n: int) -> int:\n    a, b = 0, 1\n    for _ in range(n):\n        a, b = b, a + b\n    return a`,
        javascript: `var fib = function(n) {\n    let a = 0, b = 1;\n    for (let i = 0; i < n; i++) {\n        const next = a + b;\n        a = b;\n        b = next;\n    }\n    return a;\n};`,
              typescript: `function fib(n: number): number {\n    var a = 0;\n    var b = 1;\n    for (var i = 0; i < n; i++) {\n        var next = a + b;\n        a = b;\n        b = next;\n    }\n    return a;\n}`,
              java: `public static int fib(int n) {\n    int a = 0, b = 1;\n    for (int i = 0; i < n; i++) {\n        int next = a + b;\n        a = b;\n        b = next;\n    }\n    return a;\n}`,
              cpp: `int fib(int n) {\n    long long a = 0, b = 1;\n    for (int i = 0; i < n; i++) {\n        long long next = a + b;\n        a = b;\n        b = next;\n    }\n    return (int) a;\n}`,
              c: `int fib(int n) {\n    long long a = 0, b = 1;\n    for (int i = 0; i < n; i++) {\n        long long next = a + b;\n        a = b;\n        b = next;\n    }\n    return (int) a;\n}`,
              csharp: `public static int Fib(int n)\n{\n    long a = 0, b = 1;\n    for (int i = 0; i < n; i++)\n    {\n        long next = a + b;\n        a = b;\n        b = next;\n    }\n    return (int) a;\n}`,
              go: `func fib(n int) int {\n	a, b := 0, 1\n	for i := 0; i < n; i++ {\n		a, b = b, a+b\n	}\n	return a\n}`,
              kotlin: `fun fib(n: Int): Int {\n    var a = 0L\n    var b = 1L\n    for (i in 0 until n) {\n        val next = a + b\n        a = b\n        b = next\n    }\n    return a.toInt()\n}`,
              swift: `func fib(_ n: Int) -> Int {\n    var a = 0\n    var b = 1\n    var i = 0\n    while i < n {\n        let next = a + b\n        a = b\n        b = next\n        i += 1\n    }\n    return a\n}`,
              rust: `fn fib(n: i32) -> i32 {\n    let mut a: i64 = 0;\n    let mut b: i64 = 1;\n    for _ in 0..n {\n        let next = a + b;\n        a = b;\n        b = next;\n    }\n    a as i32\n}`,
              php: `function fib($n) {\n    $a = 0;\n    $b = 1;\n    for ($i = 0; $i < $n; $i++) {\n        $next = $a + $b;\n        $a = $b;\n        $b = $next;\n    }\n    return $a;\n}`,
              ruby: `def fib(n)\n  a = 0\n  b = 1\n  n.times do\n    a, b = b, a + b\n  end\n  a\nend`,
      },
    };
  })(),

  // ── N-th Tribonacci Number ──────────────────────────────────────
  (() => {
    const ref = (n: number) => {
      let a = 0, b = 1, c = 1;
      if (n === 0) return 0;
      if (n < 3) return 1;
      for (let i = 3; i <= n; i++) { const t = a + b + c; a = b; b = c; c = t; }
      return c;
    };
    return {
      slug: "n-th-tribonacci-number",
      title: "N-th Tribonacci Number",
      difficulty: "EASY" as const,
      tags: ["Math", "Dynamic Programming", "Memoization", "Amazon", "Google", "Adobe"],
      signature: { funcName: "tribonacci", params: [{ name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "The Tribonacci sequence `T` is defined by\n\n```\nT(0) = 0,  T(1) = 1,  T(2) = 1\nT(n + 3) = T(n) + T(n + 1) + T(n + 2)   for n >= 0\n```\n\nGiven `n`, return the value of `T(n)`.",
        [
          { in: "n = 4", out: "4", note: "T(3) = 0 + 1 + 1 = 2, T(4) = 1 + 1 + 2 = 4." },
          { in: "n = 25", out: "1389537" },
          { in: "n = 0", out: "0" },
        ],
        ["0 <= n <= 37", "The answer fits in a 32-bit integer."]),
      hints: [
        "Same shape as Fibonacci, but the window is three values wide instead of two.",
        "Seed a, b, c with T(0), T(1), T(2) and slide the window forward n - 2 times.",
        "Handle n = 0, 1, 2 before the loop so the seeds are not overwritten.",
      ],
      examples: [
        { input: "4", expectedOutput: "4" },
        { input: "25", expectedOutput: "1389537" },
        { input: "0", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 0, 37);
        return { input: String(n), expectedOutput: String(ref(n)) };
      },
      solutions: {
        python: `def tribonacci(n: int) -> int:\n    if n == 0:\n        return 0\n    if n < 3:\n        return 1\n    a, b, c = 0, 1, 1\n    for _ in range(3, n + 1):\n        a, b, c = b, c, a + b + c\n    return c`,
        javascript: `var tribonacci = function(n) {\n    if (n === 0) return 0;\n    if (n < 3) return 1;\n    let a = 0, b = 1, c = 1;\n    for (let i = 3; i <= n; i++) {\n        const next = a + b + c;\n        a = b;\n        b = c;\n        c = next;\n    }\n    return c;\n};`,
              typescript: `function tribonacci(n: number): number {\n    if (n === 0) return 0;\n    if (n < 3) return 1;\n    var a = 0;\n    var b = 1;\n    var c = 1;\n    for (var i = 3; i <= n; i++) {\n        var next = a + b + c;\n        a = b;\n        b = c;\n        c = next;\n    }\n    return c;\n}`,
              java: `public static int tribonacci(int n) {\n    if (n == 0) return 0;\n    if (n < 3) return 1;\n    long a = 0, b = 1, c = 1;\n    for (int i = 3; i <= n; i++) {\n        long next = a + b + c;\n        a = b;\n        b = c;\n        c = next;\n    }\n    return (int) c;\n}`,
              cpp: `int tribonacci(int n) {\n    if (n == 0) return 0;\n    if (n < 3) return 1;\n    long long a = 0, b = 1, c = 1;\n    for (int i = 3; i <= n; i++) {\n        long long next = a + b + c;\n        a = b;\n        b = c;\n        c = next;\n    }\n    return (int) c;\n}`,
              c: `int tribonacci(int n) {\n    if (n == 0) return 0;\n    if (n < 3) return 1;\n    long long a = 0, b = 1, c = 1;\n    for (int i = 3; i <= n; i++) {\n        long long next = a + b + c;\n        a = b;\n        b = c;\n        c = next;\n    }\n    return (int) c;\n}`,
              csharp: `public static int Tribonacci(int n)\n{\n    if (n == 0) return 0;\n    if (n < 3) return 1;\n    long a = 0, b = 1, c = 1;\n    for (int i = 3; i <= n; i++)\n    {\n        long next = a + b + c;\n        a = b;\n        b = c;\n        c = next;\n    }\n    return (int) c;\n}`,
              go: `func tribonacci(n int) int {\n	if n == 0 {\n		return 0\n	}\n	if n < 3 {\n		return 1\n	}\n	a, b, c := 0, 1, 1\n	for i := 3; i <= n; i++ {\n		a, b, c = b, c, a+b+c\n	}\n	return c\n}`,
              kotlin: `fun tribonacci(n: Int): Int {\n    if (n == 0) return 0\n    if (n < 3) return 1\n    var a = 0L\n    var b = 1L\n    var c = 1L\n    for (i in 3..n) {\n        val next = a + b + c\n        a = b\n        b = c\n        c = next\n    }\n    return c.toInt()\n}`,
              swift: `func tribonacci(_ n: Int) -> Int {\n    if n == 0 { return 0 }\n    if n < 3 { return 1 }\n    var a = 0\n    var b = 1\n    var c = 1\n    var i = 3\n    while i <= n {\n        let next = a + b + c\n        a = b\n        b = c\n        c = next\n        i += 1\n    }\n    return c\n}`,
              rust: `fn tribonacci(n: i32) -> i32 {\n    if n == 0 {\n        return 0;\n    }\n    if n < 3 {\n        return 1;\n    }\n    let mut a: i64 = 0;\n    let mut b: i64 = 1;\n    let mut c: i64 = 1;\n    for _ in 3..=n {\n        let next = a + b + c;\n        a = b;\n        b = c;\n        c = next;\n    }\n    c as i32\n}`,
              php: `function tribonacci($n) {\n    if ($n === 0) return 0;\n    if ($n < 3) return 1;\n    $a = 0; $b = 1; $c = 1;\n    for ($i = 3; $i <= $n; $i++) {\n        $next = $a + $b + $c;\n        $a = $b;\n        $b = $c;\n        $c = $next;\n    }\n    return $c;\n}`,
              ruby: `def tribonacci(n)\n  return 0 if n == 0\n  return 1 if n < 3\n  a, b, c = 0, 1, 1\n  (3..n).each do\n    a, b, c = b, c, a + b + c\n  end\n  c\nend`,
      },
    };
  })(),

  // ── Armstrong Number ────────────────────────────────────────────
  (() => {
    const ref = (n: number) => {
      const s = String(n), k = s.length;
      let total = 0;
      for (let i = 0; i < k; i++) total += Math.pow(s.charCodeAt(i) - 48, k);
      return total === n;
    };
    return {
      slug: "armstrong-number",
      title: "Armstrong Number",
      difficulty: "EASY" as const,
      tags: ["Math", "TCS", "Infosys", "Wipro", "Capgemini", "Accenture"],
      signature: { funcName: "isArmstrong", params: [{ name: "n", type: "int" as const }], returns: "bool" as const },
      description: describe(
        "A number is an **Armstrong number** (also called a narcissistic number) when the sum of its own digits, each raised to the power of the number of digits, equals the number itself.\n\nGiven a positive integer `n`, return `true` if `n` is an Armstrong number.",
        [
          { in: "n = 153", out: "true", note: "It has 3 digits and 1³ + 5³ + 3³ = 1 + 125 + 27 = 153." },
          { in: "n = 123", out: "false", note: "1³ + 2³ + 3³ = 36, not 123." },
          { in: "n = 9474", out: "true", note: "9⁴ + 4⁴ + 7⁴ + 4⁴ = 9474." },
        ],
        ["1 <= n <= 1000000"]),
      hints: [
        "Count the digits first — that count is the exponent every digit is raised to.",
        "Then sum `digit ^ k` over the digits and compare with the original number.",
        "Single-digit numbers are all Armstrong numbers, since d¹ = d.",
      ],
      examples: [
        { input: "153", expectedOutput: "true" },
        { input: "123", expectedOutput: "false" },
        { input: "9474", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const known = [1, 2, 3, 4, 5, 6, 7, 8, 9, 153, 370, 371, 407, 1634, 8208, 9474, 54748, 92727, 93084, 548834];
        const n = rng() < 0.35 ? known[ri(rng, 0, known.length - 1)] : ri(rng, 1, 1000000);
        return { input: String(n), expectedOutput: bool(ref(n)) };
      },
      solutions: {
        python: `def isArmstrong(n: int) -> bool:\n    s = str(n)\n    k = len(s)\n    return sum(int(ch) ** k for ch in s) == n`,
        javascript: `var isArmstrong = function(n) {\n    const s = String(n);\n    const k = s.length;\n    let total = 0;\n    for (let i = 0; i < k; i++) {\n        total += Math.pow(s.charCodeAt(i) - 48, k);\n    }\n    return total === n;\n};`,
              typescript: `function isArmstrong(n: number): boolean {\n    var s = String(n);\n    var k = s.length;\n    var total = 0;\n    for (var i = 0; i < k; i++) {\n        total += Math.pow(s.charCodeAt(i) - 48, k);\n    }\n    return total === n;\n}`,
              java: `public static boolean isArmstrong(int n) {\n    String s = String.valueOf(n);\n    int k = s.length();\n    long total = 0;\n    for (int i = 0; i < k; i++) {\n        long d = s.charAt(i) - '0';\n        long p = 1;\n        for (int e = 0; e < k; e++) p *= d;\n        total += p;\n    }\n    return total == n;\n}`,
              cpp: `bool isArmstrong(int n) {\n    string s = to_string(n);\n    int k = (int) s.size();\n    long long total = 0;\n    for (int i = 0; i < k; i++) {\n        long long d = s[i] - '0';\n        long long p = 1;\n        for (int e = 0; e < k; e++) p *= d;\n        total += p;\n    }\n    return total == (long long) n;\n}`,
              c: `bool isArmstrong(int n) {\n    char s[16];\n    sprintf(s, "%d", n);\n    int k = (int) strlen(s);\n    long long total = 0;\n    for (int i = 0; i < k; i++) {\n        long long d = s[i] - '0';\n        long long p = 1;\n        for (int e = 0; e < k; e++) p *= d;\n        total += p;\n    }\n    return total == (long long) n;\n}`,
              csharp: `public static bool IsArmstrong(int n)\n{\n    string s = n.ToString();\n    int k = s.Length;\n    long total = 0;\n    for (int i = 0; i < k; i++)\n    {\n        long d = s[i] - '0';\n        long p = 1;\n        for (int e = 0; e < k; e++) p *= d;\n        total += p;\n    }\n    return total == n;\n}`,
              go: `func isArmstrong(n int) bool {\n	s := strconv.Itoa(n)\n	k := len(s)\n	total := 0\n	for i := 0; i < k; i++ {\n		d := int(s[i] - '0')\n		p := 1\n		for e := 0; e < k; e++ {\n			p *= d\n		}\n		total += p\n	}\n	return total == n\n}`,
              kotlin: `fun isArmstrong(n: Int): Boolean {\n    val s = n.toString()\n    val k = s.length\n    var total = 0L\n    for (i in 0 until k) {\n        val d = (s[i] - '0').toLong()\n        var p = 1L\n        for (e in 0 until k) p *= d\n        total += p\n    }\n    return total == n.toLong()\n}`,
              swift: `func isArmstrong(_ n: Int) -> Bool {\n    let s = Array(String(n).utf8)\n    let k = s.count\n    var total = 0\n    for i in 0..<k {\n        let d = Int(s[i]) - 48\n        var p = 1\n        for _ in 0..<k { p *= d }\n        total += p\n    }\n    return total == n\n}`,
              rust: `fn isArmstrong(n: i32) -> bool {\n    let s = n.to_string();\n    let bytes = s.as_bytes();\n    let k = bytes.len();\n    let mut total: i64 = 0;\n    for i in 0..k {\n        let d = (bytes[i] - b'0') as i64;\n        let mut p: i64 = 1;\n        for _ in 0..k {\n            p *= d;\n        }\n        total += p;\n    }\n    total == n as i64\n}`,
              php: `function isArmstrong($n) {\n    $s = strval($n);\n    $k = strlen($s);\n    $total = 0;\n    for ($i = 0; $i < $k; $i++) {\n        $d = ord($s[$i]) - 48;\n        $p = 1;\n        for ($e = 0; $e < $k; $e++) $p *= $d;\n        $total += $p;\n    }\n    return $total === $n;\n}`,
              ruby: `def isArmstrong(n)\n  s = n.to_s\n  k = s.length\n  total = 0\n  s.each_char do |ch|\n    total += (ch.ord - 48) ** k\n  end\n  total == n\nend`,
      },
    };
  })(),

  // ── Strong Number (Krishnamurthy) ───────────────────────────────
  (() => {
    const FACT = [1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880];
    const ref = (n: number) => {
      let x = n, total = 0;
      while (x > 0) { total += FACT[x % 10]; x = Math.floor(x / 10); }
      return total === n;
    };
    return {
      slug: "strong-number",
      title: "Strong Number",
      difficulty: "EASY" as const,
      tags: ["Math", "Infosys", "Wipro", "TCS", "Tech Mahindra"],
      signature: { funcName: "isStrongNumber", params: [{ name: "n", type: "int" as const }], returns: "bool" as const },
      description: describe(
        "A **strong number** (sometimes called a Krishnamurthy number) is a number equal to the sum of the factorials of its digits.\n\nGiven a positive integer `n`, return `true` if `n` is a strong number.",
        [
          { in: "n = 145", out: "true", note: "1! + 4! + 5! = 1 + 24 + 120 = 145." },
          { in: "n = 132", out: "false", note: "1! + 3! + 2! = 1 + 6 + 2 = 9, not 132." },
          { in: "n = 40585", out: "true", note: "4! + 0! + 5! + 8! + 5! = 40585." },
        ],
        ["1 <= n <= 100000", "0! = 1."]),
      hints: [
        "There are only ten possible digits, so precompute 0! … 9! once instead of recomputing per digit.",
        "Remember that 0! = 1, not 0 — this is the case most solutions get wrong.",
        "Peel digits with `% 10` and `/ 10` and accumulate.",
      ],
      examples: [
        { input: "145", expectedOutput: "true" },
        { input: "132", expectedOutput: "false" },
        { input: "40585", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const known = [1, 2, 145, 40585];
        const n = rng() < 0.25 ? known[ri(rng, 0, known.length - 1)] : ri(rng, 1, 100000);
        return { input: String(n), expectedOutput: bool(ref(n)) };
      },
      solutions: {
        python: `def isStrongNumber(n: int) -> bool:\n    fact = [1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880]\n    total, x = 0, n\n    while x > 0:\n        total += fact[x % 10]\n        x //= 10\n    return total == n`,
        javascript: `var isStrongNumber = function(n) {\n    const fact = [1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880];\n    let total = 0, x = n;\n    while (x > 0) {\n        total += fact[x % 10];\n        x = Math.floor(x / 10);\n    }\n    return total === n;\n};`,
              typescript: `function isStrongNumber(n: number): boolean {\n    var fact = [1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880];\n    var total = 0;\n    var x = n;\n    while (x > 0) {\n        total += fact[x % 10];\n        x = Math.floor(x / 10);\n    }\n    return total === n;\n}`,
              java: `public static boolean isStrongNumber(int n) {\n    int[] fact = {1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880};\n    long total = 0;\n    int x = n;\n    while (x > 0) {\n        total += fact[x % 10];\n        x /= 10;\n    }\n    return total == n;\n}`,
              cpp: `bool isStrongNumber(int n) {\n    int fact[10] = {1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880};\n    long long total = 0;\n    int x = n;\n    while (x > 0) {\n        total += fact[x % 10];\n        x /= 10;\n    }\n    return total == (long long) n;\n}`,
              c: `bool isStrongNumber(int n) {\n    int fact[10] = {1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880};\n    long long total = 0;\n    int x = n;\n    while (x > 0) {\n        total += fact[x % 10];\n        x /= 10;\n    }\n    return total == (long long) n;\n}`,
              csharp: `public static bool IsStrongNumber(int n)\n{\n    int[] fact = { 1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880 };\n    long total = 0;\n    int x = n;\n    while (x > 0)\n    {\n        total += fact[x % 10];\n        x /= 10;\n    }\n    return total == n;\n}`,
              go: `func isStrongNumber(n int) bool {\n	fact := []int{1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880}\n	total := 0\n	x := n\n	for x > 0 {\n		total += fact[x%10]\n		x /= 10\n	}\n	return total == n\n}`,
              kotlin: `fun isStrongNumber(n: Int): Boolean {\n    val fact = intArrayOf(1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880)\n    var total = 0L\n    var x = n\n    while (x > 0) {\n        total += fact[x % 10]\n        x /= 10\n    }\n    return total == n.toLong()\n}`,
              swift: `func isStrongNumber(_ n: Int) -> Bool {\n    let fact = [1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880]\n    var total = 0\n    var x = n\n    while x > 0 {\n        total += fact[x % 10]\n        x /= 10\n    }\n    return total == n\n}`,
              rust: `fn isStrongNumber(n: i32) -> bool {\n    let fact: [i64; 10] = [1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880];\n    let mut total: i64 = 0;\n    let mut x = n;\n    while x > 0 {\n        total += fact[(x % 10) as usize];\n        x /= 10;\n    }\n    total == n as i64\n}`,
              php: `function isStrongNumber($n) {\n    $fact = array(1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880);\n    $total = 0;\n    $x = $n;\n    while ($x > 0) {\n        $total += $fact[$x % 10];\n        $x = intdiv($x, 10);\n    }\n    return $total === $n;\n}`,
              ruby: `def isStrongNumber(n)\n  fact = [1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880]\n  total = 0\n  x = n\n  while x > 0\n    total += fact[x % 10]\n    x /= 10\n  end\n  total == n\nend`,
      },
    };
  })(),

  // ── Automorphic Number ──────────────────────────────────────────
  (() => {
    const ref = (n: number) => {
      const sq = String(n * n), s = String(n);
      return sq.slice(sq.length - s.length) === s;
    };
    return {
      slug: "automorphic-number",
      title: "Automorphic Number",
      difficulty: "EASY" as const,
      tags: ["Math", "String", "TCS", "Cognizant", "Capgemini"],
      signature: { funcName: "isAutomorphic", params: [{ name: "n", type: "int" as const }], returns: "bool" as const },
      description: describe(
        "A number is **automorphic** when its square ends with the number itself.\n\nGiven a positive integer `n`, return `true` if `n` is automorphic.",
        [
          { in: "n = 25", out: "true", note: "25² = 625, which ends in 25." },
          { in: "n = 7", out: "false", note: "7² = 49, which does not end in 7." },
          { in: "n = 76", out: "true", note: "76² = 5776." },
        ],
        ["1 <= n <= 100000"]),
      hints: [
        "You do not need string comparison: `n²` ends with `n` exactly when `n² mod 10^d == n`, where `d` is the digit count of `n`.",
        "Compute 10^d by counting digits, then take one modulo.",
        "Comparing the tail of `str(n*n)` with `str(n)` is the same test written differently.",
      ],
      examples: [
        { input: "25", expectedOutput: "true" },
        { input: "7", expectedOutput: "false" },
        { input: "76", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const known = [1, 5, 6, 25, 76, 376, 625, 9376];
        const n = rng() < 0.3 ? known[ri(rng, 0, known.length - 1)] : ri(rng, 1, 100000);
        return { input: String(n), expectedOutput: bool(ref(n)) };
      },
      solutions: {
        python: `def isAutomorphic(n: int) -> bool:\n    power = 1\n    x = n\n    while x > 0:\n        power *= 10\n        x //= 10\n    return (n * n) % power == n`,
        javascript: `var isAutomorphic = function(n) {\n    let power = 1, x = n;\n    while (x > 0) {\n        power *= 10;\n        x = Math.floor(x / 10);\n    }\n    return (n * n) % power === n;\n};`,
              typescript: `function isAutomorphic(n: number): boolean {\n    var power = 1;\n    var x = n;\n    while (x > 0) {\n        power *= 10;\n        x = Math.floor(x / 10);\n    }\n    return (n * n) % power === n;\n}`,
              java: `public static boolean isAutomorphic(int n) {\n    long power = 1;\n    int x = n;\n    while (x > 0) {\n        power *= 10;\n        x /= 10;\n    }\n    return ((long) n * n) % power == n;\n}`,
              cpp: `bool isAutomorphic(int n) {\n    long long power = 1;\n    int x = n;\n    while (x > 0) {\n        power *= 10;\n        x /= 10;\n    }\n    return ((long long) n * n) % power == (long long) n;\n}`,
              c: `bool isAutomorphic(int n) {\n    long long power = 1;\n    int x = n;\n    while (x > 0) {\n        power *= 10;\n        x /= 10;\n    }\n    return ((long long) n * n) % power == (long long) n;\n}`,
              csharp: `public static bool IsAutomorphic(int n)\n{\n    long power = 1;\n    int x = n;\n    while (x > 0)\n    {\n        power *= 10;\n        x /= 10;\n    }\n    return ((long) n * n) % power == n;\n}`,
              go: `func isAutomorphic(n int) bool {\n	power := 1\n	x := n\n	for x > 0 {\n		power *= 10\n		x /= 10\n	}\n	return (n*n)%power == n\n}`,
              kotlin: `fun isAutomorphic(n: Int): Boolean {\n    var power = 1L\n    var x = n\n    while (x > 0) {\n        power *= 10\n        x /= 10\n    }\n    return (n.toLong() * n) % power == n.toLong()\n}`,
              swift: `func isAutomorphic(_ n: Int) -> Bool {\n    var power = 1\n    var x = n\n    while x > 0 {\n        power *= 10\n        x /= 10\n    }\n    return (n * n) % power == n\n}`,
              rust: `fn isAutomorphic(n: i32) -> bool {\n    let mut power: i64 = 1;\n    let mut x = n;\n    while x > 0 {\n        power *= 10;\n        x /= 10;\n    }\n    let big = n as i64;\n    (big * big) % power == big\n}`,
              php: `function isAutomorphic($n) {\n    $power = 1;\n    $x = $n;\n    while ($x > 0) {\n        $power *= 10;\n        $x = intdiv($x, 10);\n    }\n    return ($n * $n) % $power === $n;\n}`,
              ruby: `def isAutomorphic(n)\n  power = 1\n  x = n\n  while x > 0\n    power *= 10\n    x /= 10\n  end\n  (n * n) % power == n\nend`,
      },
    };
  })(),

  // ── Neon Number ─────────────────────────────────────────────────
  (() => {
    const ref = (n: number) => {
      let sq = n * n, total = 0;
      while (sq > 0) { total += sq % 10; sq = Math.floor(sq / 10); }
      return total === n;
    };
    return {
      slug: "neon-number",
      title: "Neon Number",
      difficulty: "EASY" as const,
      tags: ["Math", "TCS", "Wipro", "Mphasis"],
      signature: { funcName: "isNeon", params: [{ name: "n", type: "int" as const }], returns: "bool" as const },
      description: describe(
        "A **neon number** is a number whose square's digits add up to the number itself.\n\nGiven a non-negative integer `n`, return `true` if `n` is a neon number.",
        [
          { in: "n = 9", out: "true", note: "9² = 81 and 8 + 1 = 9." },
          { in: "n = 8", out: "false", note: "8² = 64 and 6 + 4 = 10, not 8." },
          { in: "n = 1", out: "true", note: "1² = 1." },
        ],
        ["0 <= n <= 100000"]),
      hints: [
        "Square the number, then sum the digits of the square.",
        "Compare that digit sum with the original number.",
        "In the range of an int there are only four neon numbers — 0, 1, 9 — so most inputs answer false.",
      ],
      examples: [
        { input: "9", expectedOutput: "true" },
        { input: "8", expectedOutput: "false" },
        { input: "1", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const n = rng() < 0.3 ? ri(rng, 0, 12) : ri(rng, 0, 100000);
        return { input: String(n), expectedOutput: bool(ref(n)) };
      },
      solutions: {
        python: `def isNeon(n: int) -> bool:\n    sq = n * n\n    total = 0\n    while sq > 0:\n        total += sq % 10\n        sq //= 10\n    return total == n`,
        javascript: `var isNeon = function(n) {\n    let sq = n * n, total = 0;\n    while (sq > 0) {\n        total += sq % 10;\n        sq = Math.floor(sq / 10);\n    }\n    return total === n;\n};`,
              typescript: `function isNeon(n: number): boolean {\n    var sq = n * n;\n    var total = 0;\n    while (sq > 0) {\n        total += sq % 10;\n        sq = Math.floor(sq / 10);\n    }\n    return total === n;\n}`,
              java: `public static boolean isNeon(int n) {\n    long sq = (long) n * n;\n    long total = 0;\n    while (sq > 0) {\n        total += sq % 10;\n        sq /= 10;\n    }\n    return total == n;\n}`,
              cpp: `bool isNeon(int n) {\n    long long sq = (long long) n * n;\n    long long total = 0;\n    while (sq > 0) {\n        total += sq % 10;\n        sq /= 10;\n    }\n    return total == (long long) n;\n}`,
              c: `bool isNeon(int n) {\n    long long sq = (long long) n * n;\n    long long total = 0;\n    while (sq > 0) {\n        total += sq % 10;\n        sq /= 10;\n    }\n    return total == (long long) n;\n}`,
              csharp: `public static bool IsNeon(int n)\n{\n    long sq = (long) n * n;\n    long total = 0;\n    while (sq > 0)\n    {\n        total += sq % 10;\n        sq /= 10;\n    }\n    return total == n;\n}`,
              go: `func isNeon(n int) bool {\n	sq := n * n\n	total := 0\n	for sq > 0 {\n		total += sq % 10\n		sq /= 10\n	}\n	return total == n\n}`,
              kotlin: `fun isNeon(n: Int): Boolean {\n    var sq = n.toLong() * n\n    var total = 0L\n    while (sq > 0) {\n        total += sq % 10\n        sq /= 10\n    }\n    return total == n.toLong()\n}`,
              swift: `func isNeon(_ n: Int) -> Bool {\n    var sq = n * n\n    var total = 0\n    while sq > 0 {\n        total += sq % 10\n        sq /= 10\n    }\n    return total == n\n}`,
              rust: `fn isNeon(n: i32) -> bool {\n    let big = n as i64;\n    let mut sq = big * big;\n    let mut total: i64 = 0;\n    while sq > 0 {\n        total += sq % 10;\n        sq /= 10;\n    }\n    total == big\n}`,
              php: `function isNeon($n) {\n    $sq = $n * $n;\n    $total = 0;\n    while ($sq > 0) {\n        $total += $sq % 10;\n        $sq = intdiv($sq, 10);\n    }\n    return $total === $n;\n}`,
              ruby: `def isNeon(n)\n  sq = n * n\n  total = 0\n  while sq > 0\n    total += sq % 10\n    sq /= 10\n  end\n  total == n\nend`,
      },
    };
  })(),

  // ── Disarium Number ─────────────────────────────────────────────
  (() => {
    const ref = (n: number) => {
      const s = String(n);
      let total = 0;
      for (let i = 0; i < s.length; i++) total += Math.pow(s.charCodeAt(i) - 48, i + 1);
      return total === n;
    };
    return {
      slug: "disarium-number",
      title: "Disarium Number",
      difficulty: "EASY" as const,
      tags: ["Math", "Infosys", "Capgemini", "Virtusa"],
      signature: { funcName: "isDisarium", params: [{ name: "n", type: "int" as const }], returns: "bool" as const },
      description: describe(
        "A **disarium number** is a number where the sum of its digits, each raised to the power of its **1-based position**, equals the number itself.\n\nGiven a positive integer `n`, return `true` if `n` is a disarium number.",
        [
          { in: "n = 89", out: "true", note: "8¹ + 9² = 8 + 81 = 89." },
          { in: "n = 135", out: "true", note: "1¹ + 3² + 5³ = 1 + 9 + 125 = 135." },
          { in: "n = 76", out: "false", note: "7¹ + 6² = 43, not 76." },
        ],
        ["1 <= n <= 1000000"]),
      hints: [
        "Positions run left to right starting at 1, so the leftmost digit gets exponent 1.",
        "That makes the string form convenient: index i carries exponent i + 1.",
        "Contrast this with an Armstrong number, where every digit shares the same exponent.",
      ],
      examples: [
        { input: "89", expectedOutput: "true" },
        { input: "135", expectedOutput: "true" },
        { input: "76", expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        const known = [1, 2, 3, 89, 135, 175, 518, 598, 1306, 1676, 2427];
        const n = rng() < 0.3 ? known[ri(rng, 0, known.length - 1)] : ri(rng, 1, 1000000);
        return { input: String(n), expectedOutput: bool(ref(n)) };
      },
      solutions: {
        python: `def isDisarium(n: int) -> bool:\n    s = str(n)\n    total = 0\n    for i, ch in enumerate(s):\n        total += int(ch) ** (i + 1)\n    return total == n`,
        javascript: `var isDisarium = function(n) {\n    const s = String(n);\n    let total = 0;\n    for (let i = 0; i < s.length; i++) {\n        total += Math.pow(s.charCodeAt(i) - 48, i + 1);\n    }\n    return total === n;\n};`,
              typescript: `function isDisarium(n: number): boolean {\n    var s = String(n);\n    var total = 0;\n    for (var i = 0; i < s.length; i++) {\n        total += Math.pow(s.charCodeAt(i) - 48, i + 1);\n    }\n    return total === n;\n}`,
              java: `public static boolean isDisarium(int n) {\n    String s = String.valueOf(n);\n    long total = 0;\n    for (int i = 0; i < s.length(); i++) {\n        long d = s.charAt(i) - '0';\n        long p = 1;\n        for (int e = 0; e <= i; e++) p *= d;\n        total += p;\n    }\n    return total == n;\n}`,
              cpp: `bool isDisarium(int n) {\n    string s = to_string(n);\n    long long total = 0;\n    for (int i = 0; i < (int) s.size(); i++) {\n        long long d = s[i] - '0';\n        long long p = 1;\n        for (int e = 0; e <= i; e++) p *= d;\n        total += p;\n    }\n    return total == (long long) n;\n}`,
              c: `bool isDisarium(int n) {\n    char s[16];\n    sprintf(s, "%d", n);\n    int len = (int) strlen(s);\n    long long total = 0;\n    for (int i = 0; i < len; i++) {\n        long long d = s[i] - '0';\n        long long p = 1;\n        for (int e = 0; e <= i; e++) p *= d;\n        total += p;\n    }\n    return total == (long long) n;\n}`,
              csharp: `public static bool IsDisarium(int n)\n{\n    string s = n.ToString();\n    long total = 0;\n    for (int i = 0; i < s.Length; i++)\n    {\n        long d = s[i] - '0';\n        long p = 1;\n        for (int e = 0; e <= i; e++) p *= d;\n        total += p;\n    }\n    return total == n;\n}`,
              go: `func isDisarium(n int) bool {\n	s := strconv.Itoa(n)\n	total := 0\n	for i := 0; i < len(s); i++ {\n		d := int(s[i] - '0')\n		p := 1\n		for e := 0; e <= i; e++ {\n			p *= d\n		}\n		total += p\n	}\n	return total == n\n}`,
              kotlin: `fun isDisarium(n: Int): Boolean {\n    val s = n.toString()\n    var total = 0L\n    for (i in 0 until s.length) {\n        val d = (s[i] - '0').toLong()\n        var p = 1L\n        for (e in 0..i) p *= d\n        total += p\n    }\n    return total == n.toLong()\n}`,
              swift: `func isDisarium(_ n: Int) -> Bool {\n    let s = Array(String(n).utf8)\n    var total = 0\n    for i in 0..<s.count {\n        let d = Int(s[i]) - 48\n        var p = 1\n        for _ in 0...i { p *= d }\n        total += p\n    }\n    return total == n\n}`,
              rust: `fn isDisarium(n: i32) -> bool {\n    let s = n.to_string();\n    let bytes = s.as_bytes();\n    let mut total: i64 = 0;\n    for i in 0..bytes.len() {\n        let d = (bytes[i] - b'0') as i64;\n        let mut p: i64 = 1;\n        for _ in 0..=i {\n            p *= d;\n        }\n        total += p;\n    }\n    total == n as i64\n}`,
              php: `function isDisarium($n) {\n    $s = strval($n);\n    $len = strlen($s);\n    $total = 0;\n    for ($i = 0; $i < $len; $i++) {\n        $d = ord($s[$i]) - 48;\n        $p = 1;\n        for ($e = 0; $e <= $i; $e++) $p *= $d;\n        $total += $p;\n    }\n    return $total === $n;\n}`,
              ruby: `def isDisarium(n)\n  s = n.to_s\n  total = 0\n  s.each_char.with_index do |ch, i|\n    total += (ch.ord - 48) ** (i + 1)\n  end\n  total == n\nend`,
      },
    };
  })(),

  // ── Harshad Number ──────────────────────────────────────────────
  (() => {
    const ref = (n: number) => {
      let x = n, total = 0;
      while (x > 0) { total += x % 10; x = Math.floor(x / 10); }
      return n % total === 0;
    };
    return {
      slug: "harshad-number",
      title: "Harshad Number",
      difficulty: "EASY" as const,
      tags: ["Math", "Infosys", "TCS", "Mindtree"],
      signature: { funcName: "isHarshad", params: [{ name: "n", type: "int" as const }], returns: "bool" as const },
      description: describe(
        "A **Harshad number** (or Niven number) is an integer that is divisible by the sum of its own digits.\n\nGiven a positive integer `n`, return `true` if `n` is a Harshad number.",
        [
          { in: "n = 18", out: "true", note: "1 + 8 = 9 and 18 is divisible by 9." },
          { in: "n = 19", out: "false", note: "1 + 9 = 10 and 19 is not divisible by 10." },
          { in: "n = 1729", out: "true", note: "1 + 7 + 2 + 9 = 19 and 1729 = 19 × 91." },
        ],
        ["1 <= n <= 1000000"]),
      hints: [
        "Sum the digits, then take one modulo.",
        "Because `n >= 1`, the digit sum is at least 1 and can never be zero — no divide-by-zero guard needed.",
        "Every single-digit number is Harshad.",
      ],
      examples: [
        { input: "18", expectedOutput: "true" },
        { input: "19", expectedOutput: "false" },
        { input: "1729", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const n = rng() < 0.2 ? ri(rng, 1, 40) : ri(rng, 1, 1000000);
        return { input: String(n), expectedOutput: bool(ref(n)) };
      },
      solutions: {
        python: `def isHarshad(n: int) -> bool:\n    total, x = 0, n\n    while x > 0:\n        total += x % 10\n        x //= 10\n    return n % total == 0`,
        javascript: `var isHarshad = function(n) {\n    let total = 0, x = n;\n    while (x > 0) {\n        total += x % 10;\n        x = Math.floor(x / 10);\n    }\n    return n % total === 0;\n};`,
              typescript: `function isHarshad(n: number): boolean {\n    var total = 0;\n    var x = n;\n    while (x > 0) {\n        total += x % 10;\n        x = Math.floor(x / 10);\n    }\n    return n % total === 0;\n}`,
              java: `public static boolean isHarshad(int n) {\n    int total = 0;\n    int x = n;\n    while (x > 0) {\n        total += x % 10;\n        x /= 10;\n    }\n    return n % total == 0;\n}`,
              cpp: `bool isHarshad(int n) {\n    int total = 0;\n    int x = n;\n    while (x > 0) {\n        total += x % 10;\n        x /= 10;\n    }\n    return n % total == 0;\n}`,
              c: `bool isHarshad(int n) {\n    int total = 0;\n    int x = n;\n    while (x > 0) {\n        total += x % 10;\n        x /= 10;\n    }\n    return n % total == 0;\n}`,
              csharp: `public static bool IsHarshad(int n)\n{\n    int total = 0;\n    int x = n;\n    while (x > 0)\n    {\n        total += x % 10;\n        x /= 10;\n    }\n    return n % total == 0;\n}`,
              go: `func isHarshad(n int) bool {\n	total := 0\n	x := n\n	for x > 0 {\n		total += x % 10\n		x /= 10\n	}\n	return n%total == 0\n}`,
              kotlin: `fun isHarshad(n: Int): Boolean {\n    var total = 0\n    var x = n\n    while (x > 0) {\n        total += x % 10\n        x /= 10\n    }\n    return n % total == 0\n}`,
              swift: `func isHarshad(_ n: Int) -> Bool {\n    var total = 0\n    var x = n\n    while x > 0 {\n        total += x % 10\n        x /= 10\n    }\n    return n % total == 0\n}`,
              rust: `fn isHarshad(n: i32) -> bool {\n    let mut total = 0;\n    let mut x = n;\n    while x > 0 {\n        total += x % 10;\n        x /= 10;\n    }\n    n % total == 0\n}`,
              php: `function isHarshad($n) {\n    $total = 0;\n    $x = $n;\n    while ($x > 0) {\n        $total += $x % 10;\n        $x = intdiv($x, 10);\n    }\n    return $n % $total === 0;\n}`,
              ruby: `def isHarshad(n)\n  total = 0\n  x = n\n  while x > 0\n    total += x % 10\n    x /= 10\n  end\n  n % total == 0\nend`,
      },
    };
  })(),

  // ── Perfect Number ──────────────────────────────────────────────
  (() => {
    const ref = (num: number) => {
      if (num <= 1) return false;
      let sum = 1;
      for (let d = 2; d * d <= num; d++) {
        if (num % d === 0) { sum += d; const other = num / d; if (other !== d) sum += other; }
      }
      return sum === num;
    };
    return {
      slug: "perfect-number",
      title: "Perfect Number",
      difficulty: "EASY" as const,
      tags: ["Math", "TCS", "Infosys", "Accenture", "Amazon"],
      signature: { funcName: "checkPerfectNumber", params: [{ name: "num", type: "int" as const }], returns: "bool" as const },
      description: describe(
        "A **perfect number** is a positive integer that equals the sum of its positive divisors, excluding the number itself. A divisor of an integer `x` is an integer that divides `x` exactly.\n\nGiven an integer `num`, return `true` if it is a perfect number.",
        [
          { in: "num = 28", out: "true", note: "28 = 1 + 2 + 4 + 7 + 14." },
          { in: "num = 7", out: "false", note: "Its only proper divisor is 1." },
          { in: "num = 6", out: "true", note: "6 = 1 + 2 + 3." },
        ],
        ["1 <= num <= 1000000"]),
      hints: [
        "Only test divisors up to √num — each small divisor `d` pairs with `num / d`.",
        "Seed the sum with 1 and start the loop at 2, so `num` itself is never added.",
        "Watch the perfect square case: when `d * d == num`, add `d` only once.",
      ],
      examples: [
        { input: "28", expectedOutput: "true" },
        { input: "7", expectedOutput: "false" },
        { input: "6", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const known = [6, 28, 496, 8128];
        const n = rng() < 0.25 ? known[ri(rng, 0, known.length - 1)] : ri(rng, 1, 1000000);
        return { input: String(n), expectedOutput: bool(ref(n)) };
      },
      solutions: {
        python: `def checkPerfectNumber(num: int) -> bool:\n    if num <= 1:\n        return False\n    total = 1\n    d = 2\n    while d * d <= num:\n        if num % d == 0:\n            total += d\n            other = num // d\n            if other != d:\n                total += other\n        d += 1\n    return total == num`,
        javascript: `var checkPerfectNumber = function(num) {\n    if (num <= 1) return false;\n    let total = 1;\n    for (let d = 2; d * d <= num; d++) {\n        if (num % d === 0) {\n            total += d;\n            const other = num / d;\n            if (other !== d) total += other;\n        }\n    }\n    return total === num;\n};`,
              typescript: `function checkPerfectNumber(num: number): boolean {\n    if (num <= 1) return false;\n    var total = 1;\n    for (var d = 2; d * d <= num; d++) {\n        if (num % d === 0) {\n            total += d;\n            var other = num / d;\n            if (other !== d) total += other;\n        }\n    }\n    return total === num;\n}`,
              java: `public static boolean checkPerfectNumber(int num) {\n    if (num <= 1) return false;\n    long total = 1;\n    for (int d = 2; (long) d * d <= num; d++) {\n        if (num % d == 0) {\n            total += d;\n            int other = num / d;\n            if (other != d) total += other;\n        }\n    }\n    return total == num;\n}`,
              cpp: `bool checkPerfectNumber(int num) {\n    if (num <= 1) return false;\n    long long total = 1;\n    for (int d = 2; (long long) d * d <= num; d++) {\n        if (num % d == 0) {\n            total += d;\n            int other = num / d;\n            if (other != d) total += other;\n        }\n    }\n    return total == (long long) num;\n}`,
              c: `bool checkPerfectNumber(int num) {\n    if (num <= 1) return false;\n    long long total = 1;\n    for (int d = 2; (long long) d * d <= num; d++) {\n        if (num % d == 0) {\n            total += d;\n            int other = num / d;\n            if (other != d) total += other;\n        }\n    }\n    return total == (long long) num;\n}`,
              csharp: `public static bool CheckPerfectNumber(int num)\n{\n    if (num <= 1) return false;\n    long total = 1;\n    for (int d = 2; (long) d * d <= num; d++)\n    {\n        if (num % d == 0)\n        {\n            total += d;\n            int other = num / d;\n            if (other != d) total += other;\n        }\n    }\n    return total == num;\n}`,
              go: `func checkPerfectNumber(num int) bool {\n	if num <= 1 {\n		return false\n	}\n	total := 1\n	for d := 2; d*d <= num; d++ {\n		if num%d == 0 {\n			total += d\n			other := num / d\n			if other != d {\n				total += other\n			}\n		}\n	}\n	return total == num\n}`,
              kotlin: `fun checkPerfectNumber(num: Int): Boolean {\n    if (num <= 1) return false\n    var total = 1L\n    var d = 2\n    while (d.toLong() * d <= num) {\n        if (num % d == 0) {\n            total += d\n            val other = num / d\n            if (other != d) total += other\n        }\n        d++\n    }\n    return total == num.toLong()\n}`,
              swift: `func checkPerfectNumber(_ num: Int) -> Bool {\n    if num <= 1 { return false }\n    var total = 1\n    var d = 2\n    while d * d <= num {\n        if num % d == 0 {\n            total += d\n            let other = num / d\n            if other != d { total += other }\n        }\n        d += 1\n    }\n    return total == num\n}`,
              rust: `fn checkPerfectNumber(num: i32) -> bool {\n    if num <= 1 {\n        return false;\n    }\n    let n = num as i64;\n    let mut total: i64 = 1;\n    let mut d: i64 = 2;\n    while d * d <= n {\n        if n % d == 0 {\n            total += d;\n            let other = n / d;\n            if other != d {\n                total += other;\n            }\n        }\n        d += 1;\n    }\n    total == n\n}`,
              php: `function checkPerfectNumber($num) {\n    if ($num <= 1) return false;\n    $total = 1;\n    for ($d = 2; $d * $d <= $num; $d++) {\n        if ($num % $d === 0) {\n            $total += $d;\n            $other = intdiv($num, $d);\n            if ($other !== $d) $total += $other;\n        }\n    }\n    return $total === $num;\n}`,
              ruby: `def checkPerfectNumber(num)\n  return false if num <= 1\n  total = 1\n  d = 2\n  while d * d <= num\n    if num % d == 0\n      total += d\n      other = num / d\n      total += other if other != d\n    end\n    d += 1\n  end\n  total == num\nend`,
      },
    };
  })(),

  // ── Prime Factors ───────────────────────────────────────────────
  (() => {
    const ref = (n: number) => {
      const out: number[] = [];
      let x = n;
      for (let d = 2; d * d <= x; d++) while (x % d === 0) { out.push(d); x /= d; }
      if (x > 1) out.push(x);
      return out;
    };
    return {
      slug: "prime-factors",
      title: "Prime Factorisation",
      difficulty: "EASY" as const,
      tags: ["Math", "Number Theory", "TCS", "Infosys", "Wipro", "HCL"],
      signature: { funcName: "primeFactors", params: [{ name: "n", type: "int" as const }], returns: "int[]" as const },
      description: describe(
        "Given an integer `n` greater than 1, return all of its prime factors in **non-decreasing order**, repeating a factor as many times as it divides `n`.",
        [
          { in: "n = 12", out: "[2,2,3]", note: "12 = 2 × 2 × 3." },
          { in: "n = 97", out: "[97]", note: "97 is prime, so it is its own only factor." },
          { in: "n = 100", out: "[2,2,5,5]" },
        ],
        ["2 <= n <= 1000000"]),
      hints: [
        "Divide out each candidate `d` completely before moving on — that guarantees every `d` you find is prime.",
        "You only need to test `d` while `d * d <= n`, because at most one prime factor can exceed √n.",
        "Whatever is left above 1 after the loop is that last large prime; do not forget to append it.",
      ],
      examples: [
        { input: "12", expectedOutput: "[2,2,3]" },
        { input: "97", expectedOutput: "[97]" },
        { input: "100", expectedOutput: "[2,2,5,5]" },
      ],
      gen: (rng: Rng) => {
        const n = rng() < 0.25 ? ri(rng, 2, 60) : ri(rng, 2, 1000000);
        return { input: String(n), expectedOutput: fmtIntArr(ref(n)) };
      },
      solutions: {
        python: `def primeFactors(n: int):\n    out = []\n    d = 2\n    while d * d <= n:\n        while n % d == 0:\n            out.append(d)\n            n //= d\n        d += 1\n    if n > 1:\n        out.append(n)\n    return out`,
        javascript: `var primeFactors = function(n) {\n    const out = [];\n    for (let d = 2; d * d <= n; d++) {\n        while (n % d === 0) {\n            out.push(d);\n            n /= d;\n        }\n    }\n    if (n > 1) out.push(n);\n    return out;\n};`,
              typescript: `function primeFactors(n: number): number[] {\n    var out: number[] = [];\n    for (var d = 2; d * d <= n; d++) {\n        while (n % d === 0) {\n            out.push(d);\n            n /= d;\n        }\n    }\n    if (n > 1) out.push(n);\n    return out;\n}`,
              java: `public static int[] primeFactors(int n) {\n    List<Integer> out = new ArrayList<>();\n    for (int d = 2; (long) d * d <= n; d++) {\n        while (n % d == 0) {\n            out.add(d);\n            n /= d;\n        }\n    }\n    if (n > 1) out.add(n);\n    int[] res = new int[out.size()];\n    for (int i = 0; i < res.length; i++) res[i] = out.get(i);\n    return res;\n}`,
              cpp: `vector<int> primeFactors(int n) {\n    vector<int> out;\n    for (int d = 2; (long long) d * d <= n; d++) {\n        while (n % d == 0) {\n            out.push_back(d);\n            n /= d;\n        }\n    }\n    if (n > 1) out.push_back(n);\n    return out;\n}`,
              c: `int* primeFactors(int n, int* returnSize) {\n    int* out = (int*) malloc(sizeof(int) * 32);\n    int len = 0;\n    for (int d = 2; (long long) d * d <= n; d++) {\n        while (n % d == 0) {\n            out[len++] = d;\n            n /= d;\n        }\n    }\n    if (n > 1) out[len++] = n;\n    *returnSize = len;\n    return out;\n}`,
              csharp: `public static int[] PrimeFactors(int n)\n{\n    var out_ = new List<int>();\n    for (int d = 2; (long) d * d <= n; d++)\n    {\n        while (n % d == 0)\n        {\n            out_.Add(d);\n            n /= d;\n        }\n    }\n    if (n > 1) out_.Add(n);\n    return out_.ToArray();\n}`,
              go: `func primeFactors(n int) []int {\n	out := []int{}\n	for d := 2; d*d <= n; d++ {\n		for n%d == 0 {\n			out = append(out, d)\n			n /= d\n		}\n	}\n	if n > 1 {\n		out = append(out, n)\n	}\n	return out\n}`,
              kotlin: `fun primeFactors(n: Int): IntArray {\n    var cur = n\n    val out = ArrayList<Int>()\n    var d = 2\n    while (d.toLong() * d <= cur) {\n        while (cur % d == 0) {\n            out.add(d)\n            cur /= d\n        }\n        d++\n    }\n    if (cur > 1) out.add(cur)\n    return out.toIntArray()\n}`,
              swift: `func primeFactors(_ n: Int) -> [Int] {\n    var cur = n\n    var out: [Int] = []\n    var d = 2\n    while d * d <= cur {\n        while cur % d == 0 {\n            out.append(d)\n            cur /= d\n        }\n        d += 1\n    }\n    if cur > 1 { out.append(cur) }\n    return out\n}`,
              rust: `fn primeFactors(n: i32) -> Vec<i32> {\n    let mut cur = n;\n    let mut out: Vec<i32> = Vec::new();\n    let mut d: i32 = 2;\n    while (d as i64) * (d as i64) <= cur as i64 {\n        while cur % d == 0 {\n            out.push(d);\n            cur /= d;\n        }\n        d += 1;\n    }\n    if cur > 1 {\n        out.push(cur);\n    }\n    out\n}`,
              php: `function primeFactors($n) {\n    $out = array();\n    for ($d = 2; $d * $d <= $n; $d++) {\n        while ($n % $d === 0) {\n            $out[] = $d;\n            $n = intdiv($n, $d);\n        }\n    }\n    if ($n > 1) $out[] = $n;\n    return $out;\n}`,
              ruby: `def primeFactors(n)\n  out = []\n  d = 2\n  while d * d <= n\n    while n % d == 0\n      out << d\n      n /= d\n    end\n    d += 1\n  end\n  out << n if n > 1\n  out\nend`,
      },
    };
  })(),

  // ── Find Greatest Common Divisor of Array ───────────────────────
  (() => {
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const ref = (nums: number[]) => {
      let lo = nums[0], hi = nums[0];
      for (let i = 1; i < nums.length; i++) { if (nums[i] < lo) lo = nums[i]; if (nums[i] > hi) hi = nums[i]; }
      return gcd(hi, lo);
    };
    return {
      slug: "find-greatest-common-divisor-of-array",
      title: "Find Greatest Common Divisor of Array",
      difficulty: "EASY" as const,
      tags: ["Array", "Math", "Number Theory", "Amazon", "TCS", "Infosys", "Accenture"],
      signature: { funcName: "findGCD", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given an integer array `nums`, return the greatest common divisor of its **smallest** and **largest** elements.\n\nThe greatest common divisor of two numbers is the largest positive integer that divides both of them.",
        [
          { in: "nums = [2,5,6,9,10]", out: "2", note: "The smallest is 2 and the largest is 10; gcd(2, 10) = 2." },
          { in: "nums = [7,5,6,8,3]", out: "1", note: "gcd(3, 8) = 1." },
          { in: "nums = [3,3]", out: "3" },
        ],
        ["2 <= nums.length <= 40", "1 <= nums[i] <= 1000"]),
      hints: [
        "One pass finds both the minimum and the maximum.",
        "Euclid's algorithm computes the gcd: `gcd(a, b) = gcd(b, a mod b)`, ending when b reaches 0.",
        "The smallest and largest may be the same element when every value is equal — that is fine, gcd(x, x) = x.",
      ],
      examples: [
        { input: "[2,5,6,9,10]", expectedOutput: "2" },
        { input: "[7,5,6,8,3]", expectedOutput: "1" },
        { input: "[3,3]", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 2, 40);
        const nums: number[] = [];
        for (let i = 0; i < n; i++) nums.push(ri(rng, 1, 1000));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `def findGCD(nums):\n    a, b = min(nums), max(nums)\n    while b:\n        a, b = b, a % b\n    return a`,
        javascript: `var findGCD = function(nums) {\n    let lo = nums[0], hi = nums[0];\n    for (let i = 1; i < nums.length; i++) {\n        if (nums[i] < lo) lo = nums[i];\n        if (nums[i] > hi) hi = nums[i];\n    }\n    while (lo !== 0) {\n        const t = hi % lo;\n        hi = lo;\n        lo = t;\n    }\n    return hi;\n};`,
              typescript: `function findGCD(nums: number[]): number {\n    var lo = nums[0];\n    var hi = nums[0];\n    for (var i = 1; i < nums.length; i++) {\n        if (nums[i] < lo) lo = nums[i];\n        if (nums[i] > hi) hi = nums[i];\n    }\n    while (lo !== 0) {\n        var t = hi % lo;\n        hi = lo;\n        lo = t;\n    }\n    return hi;\n}`,
              java: `public static int findGCD(int[] nums) {\n    int lo = nums[0], hi = nums[0];\n    for (int x : nums) {\n        if (x < lo) lo = x;\n        if (x > hi) hi = x;\n    }\n    while (lo != 0) {\n        int t = hi % lo;\n        hi = lo;\n        lo = t;\n    }\n    return hi;\n}`,
              cpp: `int findGCD(vector<int>& nums) {\n    int lo = nums[0], hi = nums[0];\n    for (int x : nums) {\n        if (x < lo) lo = x;\n        if (x > hi) hi = x;\n    }\n    while (lo != 0) {\n        int t = hi % lo;\n        hi = lo;\n        lo = t;\n    }\n    return hi;\n}`,
              c: `int findGCD(int* nums, int numsSize) {\n    int lo = nums[0], hi = nums[0];\n    for (int i = 1; i < numsSize; i++) {\n        if (nums[i] < lo) lo = nums[i];\n        if (nums[i] > hi) hi = nums[i];\n    }\n    while (lo != 0) {\n        int t = hi % lo;\n        hi = lo;\n        lo = t;\n    }\n    return hi;\n}`,
              csharp: `public static int FindGCD(int[] nums)\n{\n    int lo = nums[0], hi = nums[0];\n    foreach (int x in nums)\n    {\n        if (x < lo) lo = x;\n        if (x > hi) hi = x;\n    }\n    while (lo != 0)\n    {\n        int t = hi % lo;\n        hi = lo;\n        lo = t;\n    }\n    return hi;\n}`,
              go: `func findGCD(nums []int) int {\n	lo, hi := nums[0], nums[0]\n	for _, x := range nums {\n		if x < lo {\n			lo = x\n		}\n		if x > hi {\n			hi = x\n		}\n	}\n	for lo != 0 {\n		lo, hi = hi%lo, lo\n	}\n	return hi\n}`,
              kotlin: `fun findGCD(nums: IntArray): Int {\n    var lo = nums[0]\n    var hi = nums[0]\n    for (x in nums) {\n        if (x < lo) lo = x\n        if (x > hi) hi = x\n    }\n    while (lo != 0) {\n        val t = hi % lo\n        hi = lo\n        lo = t\n    }\n    return hi\n}`,
              swift: `func findGCD(_ nums: [Int]) -> Int {\n    var lo = nums[0]\n    var hi = nums[0]\n    for x in nums {\n        if x < lo { lo = x }\n        if x > hi { hi = x }\n    }\n    while lo != 0 {\n        let t = hi % lo\n        hi = lo\n        lo = t\n    }\n    return hi\n}`,
              rust: `fn findGCD(nums: Vec<i32>) -> i32 {\n    let mut lo = nums[0];\n    let mut hi = nums[0];\n    for x in nums.iter() {\n        if *x < lo {\n            lo = *x;\n        }\n        if *x > hi {\n            hi = *x;\n        }\n    }\n    while lo != 0 {\n        let t = hi % lo;\n        hi = lo;\n        lo = t;\n    }\n    hi\n}`,
              php: `function findGCD($nums) {\n    $lo = $nums[0];\n    $hi = $nums[0];\n    foreach ($nums as $x) {\n        if ($x < $lo) $lo = $x;\n        if ($x > $hi) $hi = $x;\n    }\n    while ($lo !== 0) {\n        $t = $hi % $lo;\n        $hi = $lo;\n        $lo = $t;\n    }\n    return $hi;\n}`,
              ruby: `def findGCD(nums)\n  lo = nums.min\n  hi = nums.max\n  while lo != 0\n    lo, hi = hi % lo, lo\n  end\n  hi\nend`,
      },
    };
  })(),

  // ── Self Dividing Numbers ───────────────────────────────────────
  (() => {
    const selfDiv = (n: number) => {
      let x = n;
      while (x > 0) { const d = x % 10; if (d === 0 || n % d !== 0) return false; x = Math.floor(x / 10); }
      return true;
    };
    const ref = (left: number, right: number) => {
      const out: number[] = [];
      for (let n = left; n <= right; n++) if (selfDiv(n)) out.push(n);
      return out;
    };
    return {
      slug: "self-dividing-numbers",
      title: "Self Dividing Numbers",
      difficulty: "EASY" as const,
      tags: ["Math", "Amazon", "Epic Systems", "Cognizant"],
      signature: { funcName: "selfDividingNumbers", params: [{ name: "left", type: "int" as const }, { name: "right", type: "int" as const }], returns: "int[]" as const },
      description: describe(
        "A **self-dividing number** is a number that is divisible by every digit it contains. For example, `128` is self-dividing because `128 % 1 == 0`, `128 % 2 == 0` and `128 % 8 == 0`. A self-dividing number is never allowed to contain the digit zero.\n\nGiven two integers `left` and `right`, return a sorted list of every self-dividing number in the inclusive range `[left, right]`.",
        [
          { in: "left = 1, right = 22", out: "[1,2,3,4,5,6,7,8,9,11,12,15,22]" },
          { in: "left = 47, right = 85", out: "[48,55,66,77]" },
          { in: "left = 10, right = 10", out: "[]", note: "10 contains a zero." },
        ],
        ["1 <= left <= right <= 20000", "right - left <= 120"]),
      hints: [
        "Test each number in the range independently — the range is small.",
        "Peel the digits of the candidate while keeping the original value to divide by.",
        "A zero digit disqualifies immediately; do not attempt the division.",
      ],
      examples: [
        { input: "1\n22", expectedOutput: "[1,2,3,4,5,6,7,8,9,11,12,15,22]" },
        { input: "47\n85", expectedOutput: "[48,55,66,77]" },
        { input: "10\n10", expectedOutput: "[]" },
      ],
      gen: (rng: Rng) => {
        const left = ri(rng, 1, 19800);
        const right = left + ri(rng, 0, 120);
        return { input: `${left}\n${right}`, expectedOutput: fmtIntArr(ref(left, right)) };
      },
      solutions: {
        python: `def selfDividingNumbers(left: int, right: int):\n    out = []\n    for n in range(left, right + 1):\n        x, ok = n, True\n        while x > 0:\n            d = x % 10\n            if d == 0 or n % d != 0:\n                ok = False\n                break\n            x //= 10\n        if ok:\n            out.append(n)\n    return out`,
        javascript: `var selfDividingNumbers = function(left, right) {\n    const out = [];\n    for (let n = left; n <= right; n++) {\n        let x = n, ok = true;\n        while (x > 0) {\n            const d = x % 10;\n            if (d === 0 || n % d !== 0) { ok = false; break; }\n            x = Math.floor(x / 10);\n        }\n        if (ok) out.push(n);\n    }\n    return out;\n};`,
              typescript: `function selfDividingNumbers(left: number, right: number): number[] {\n    var out: number[] = [];\n    for (var n = left; n <= right; n++) {\n        var x = n;\n        var ok = true;\n        while (x > 0) {\n            var d = x % 10;\n            if (d === 0 || n % d !== 0) { ok = false; break; }\n            x = Math.floor(x / 10);\n        }\n        if (ok) out.push(n);\n    }\n    return out;\n}`,
              java: `public static int[] selfDividingNumbers(int left, int right) {\n    List<Integer> out = new ArrayList<>();\n    for (int n = left; n <= right; n++) {\n        int x = n;\n        boolean ok = true;\n        while (x > 0) {\n            int d = x % 10;\n            if (d == 0 || n % d != 0) { ok = false; break; }\n            x /= 10;\n        }\n        if (ok) out.add(n);\n    }\n    int[] res = new int[out.size()];\n    for (int i = 0; i < res.length; i++) res[i] = out.get(i);\n    return res;\n}`,
              cpp: `vector<int> selfDividingNumbers(int left, int right) {\n    vector<int> out;\n    for (int n = left; n <= right; n++) {\n        int x = n;\n        bool ok = true;\n        while (x > 0) {\n            int d = x % 10;\n            if (d == 0 || n % d != 0) { ok = false; break; }\n            x /= 10;\n        }\n        if (ok) out.push_back(n);\n    }\n    return out;\n}`,
              c: `int* selfDividingNumbers(int left, int right, int* returnSize) {\n    int cap = right - left + 1;\n    int* out = (int*) malloc(sizeof(int) * (cap > 0 ? cap : 1));\n    int len = 0;\n    for (int n = left; n <= right; n++) {\n        int x = n;\n        bool ok = true;\n        while (x > 0) {\n            int d = x % 10;\n            if (d == 0 || n % d != 0) { ok = false; break; }\n            x /= 10;\n        }\n        if (ok) out[len++] = n;\n    }\n    *returnSize = len;\n    return out;\n}`,
              csharp: `public static int[] SelfDividingNumbers(int left, int right)\n{\n    var out_ = new List<int>();\n    for (int n = left; n <= right; n++)\n    {\n        int x = n;\n        bool ok = true;\n        while (x > 0)\n        {\n            int d = x % 10;\n            if (d == 0 || n % d != 0) { ok = false; break; }\n            x /= 10;\n        }\n        if (ok) out_.Add(n);\n    }\n    return out_.ToArray();\n}`,
              go: `func selfDividingNumbers(left int, right int) []int {\n	out := []int{}\n	for n := left; n <= right; n++ {\n		x := n\n		ok := true\n		for x > 0 {\n			d := x % 10\n			if d == 0 || n%d != 0 {\n				ok = false\n				break\n			}\n			x /= 10\n		}\n		if ok {\n			out = append(out, n)\n		}\n	}\n	return out\n}`,
              kotlin: `fun selfDividingNumbers(left: Int, right: Int): IntArray {\n    val out = ArrayList<Int>()\n    for (n in left..right) {\n        var x = n\n        var ok = true\n        while (x > 0) {\n            val d = x % 10\n            if (d == 0 || n % d != 0) {\n                ok = false\n                break\n            }\n            x /= 10\n        }\n        if (ok) out.add(n)\n    }\n    return out.toIntArray()\n}`,
              swift: `func selfDividingNumbers(_ left: Int, _ right: Int) -> [Int] {\n    var out: [Int] = []\n    var n = left\n    while n <= right {\n        var x = n\n        var ok = true\n        while x > 0 {\n            let d = x % 10\n            if d == 0 || n % d != 0 {\n                ok = false\n                break\n            }\n            x /= 10\n        }\n        if ok { out.append(n) }\n        n += 1\n    }\n    return out\n}`,
              rust: `fn selfDividingNumbers(left: i32, right: i32) -> Vec<i32> {\n    let mut out: Vec<i32> = Vec::new();\n    for n in left..=right {\n        let mut x = n;\n        let mut ok = true;\n        while x > 0 {\n            let d = x % 10;\n            if d == 0 || n % d != 0 {\n                ok = false;\n                break;\n            }\n            x /= 10;\n        }\n        if ok {\n            out.push(n);\n        }\n    }\n    out\n}`,
              php: `function selfDividingNumbers($left, $right) {\n    $out = array();\n    for ($n = $left; $n <= $right; $n++) {\n        $x = $n;\n        $ok = true;\n        while ($x > 0) {\n            $d = $x % 10;\n            if ($d === 0 || $n % $d !== 0) { $ok = false; break; }\n            $x = intdiv($x, 10);\n        }\n        if ($ok) $out[] = $n;\n    }\n    return $out;\n}`,
              ruby: `def selfDividingNumbers(left, right)\n  out = []\n  (left..right).each do |n|\n    x = n\n    ok = true\n    while x > 0\n      d = x % 10\n      if d == 0 || n % d != 0\n        ok = false\n        break\n      end\n      x /= 10\n    end\n    out << n if ok\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Number of Steps to Reduce a Number to Zero ──────────────────
  (() => {
    const ref = (num: number) => {
      let n = num, steps = 0;
      while (n > 0) { n = n % 2 === 0 ? n / 2 : n - 1; steps++; }
      return steps;
    };
    return {
      slug: "number-of-steps-to-reduce-a-number-to-zero",
      title: "Number of Steps to Reduce a Number to Zero",
      difficulty: "EASY" as const,
      tags: ["Math", "Bit Manipulation", "Amazon", "Adobe", "Cognizant"],
      signature: { funcName: "numberOfSteps", params: [{ name: "num", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given an integer `num`, return the number of steps needed to reduce it to zero.\n\nIn one step, if the current number is even you divide it by two; otherwise you subtract one from it.",
        [
          { in: "num = 14", out: "6", note: "14 → 7 → 6 → 3 → 2 → 1 → 0." },
          { in: "num = 8", out: "4", note: "8 → 4 → 2 → 1 → 0." },
          { in: "num = 0", out: "0" },
        ],
        ["0 <= num <= 1000000"],
        "In binary, each division is a right shift and each subtraction clears a set bit. Can you answer from the bit pattern alone?"),
      hints: [
        "Simulate the process directly; it terminates in O(log num) steps.",
        "In binary, halving is a right shift and subtracting one from an odd number clears its lowest bit.",
        "So the answer is (number of bits - 1) + (number of set bits), for num > 0.",
      ],
      examples: [
        { input: "14", expectedOutput: "6" },
        { input: "8", expectedOutput: "4" },
        { input: "0", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const num = rng() < 0.2 ? ri(rng, 0, 20) : ri(rng, 0, 1000000);
        return { input: String(num), expectedOutput: String(ref(num)) };
      },
      solutions: {
        python: `def numberOfSteps(num: int) -> int:\n    steps = 0\n    while num > 0:\n        num = num // 2 if num % 2 == 0 else num - 1\n        steps += 1\n    return steps`,
        javascript: `var numberOfSteps = function(num) {\n    let steps = 0;\n    while (num > 0) {\n        num = num % 2 === 0 ? num / 2 : num - 1;\n        steps++;\n    }\n    return steps;\n};`,
              typescript: `function numberOfSteps(num: number): number {\n    var steps = 0;\n    while (num > 0) {\n        num = num % 2 === 0 ? num / 2 : num - 1;\n        steps++;\n    }\n    return steps;\n}`,
              java: `public static int numberOfSteps(int num) {\n    int steps = 0;\n    while (num > 0) {\n        num = num % 2 == 0 ? num / 2 : num - 1;\n        steps++;\n    }\n    return steps;\n}`,
              cpp: `int numberOfSteps(int num) {\n    int steps = 0;\n    while (num > 0) {\n        num = num % 2 == 0 ? num / 2 : num - 1;\n        steps++;\n    }\n    return steps;\n}`,
              c: `int numberOfSteps(int num) {\n    int steps = 0;\n    while (num > 0) {\n        num = num % 2 == 0 ? num / 2 : num - 1;\n        steps++;\n    }\n    return steps;\n}`,
              csharp: `public static int NumberOfSteps(int num)\n{\n    int steps = 0;\n    while (num > 0)\n    {\n        num = num % 2 == 0 ? num / 2 : num - 1;\n        steps++;\n    }\n    return steps;\n}`,
              go: `func numberOfSteps(num int) int {\n	steps := 0\n	for num > 0 {\n		if num%2 == 0 {\n			num /= 2\n		} else {\n			num--\n		}\n		steps++\n	}\n	return steps\n}`,
              kotlin: `fun numberOfSteps(num: Int): Int {\n    var n = num\n    var steps = 0\n    while (n > 0) {\n        n = if (n % 2 == 0) n / 2 else n - 1\n        steps++\n    }\n    return steps\n}`,
              swift: `func numberOfSteps(_ num: Int) -> Int {\n    var n = num\n    var steps = 0\n    while n > 0 {\n        n = n % 2 == 0 ? n / 2 : n - 1\n        steps += 1\n    }\n    return steps\n}`,
              rust: `fn numberOfSteps(num: i32) -> i32 {\n    let mut n = num;\n    let mut steps = 0;\n    while n > 0 {\n        n = if n % 2 == 0 { n / 2 } else { n - 1 };\n        steps += 1;\n    }\n    steps\n}`,
              php: `function numberOfSteps($num) {\n    $steps = 0;\n    while ($num > 0) {\n        $num = $num % 2 === 0 ? intdiv($num, 2) : $num - 1;\n        $steps++;\n    }\n    return $steps;\n}`,
              ruby: `def numberOfSteps(num)\n  steps = 0\n  while num > 0\n    num = num % 2 == 0 ? num / 2 : num - 1\n    steps += 1\n  end\n  steps\nend`,
      },
    };
  })(),

  // ── Subtract the Product and Sum of Digits ──────────────────────
  (() => {
    const ref = (n: number) => {
      let x = n, prod = 1, sum = 0;
      while (x > 0) { const d = x % 10; prod *= d; sum += d; x = Math.floor(x / 10); }
      return prod - sum;
    };
    return {
      slug: "subtract-product-and-sum-of-digits",
      title: "Subtract the Product and Sum of Digits of an Integer",
      difficulty: "EASY" as const,
      tags: ["Math", "Amazon", "Infosys", "Wipro"],
      signature: { funcName: "subtractProductAndSum", params: [{ name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given an integer `n`, return the product of its digits minus the sum of its digits.",
        [
          { in: "n = 234", out: "15", note: "Product = 2 × 3 × 4 = 24, sum = 2 + 3 + 4 = 9, and 24 - 9 = 15." },
          { in: "n = 4421", out: "21", note: "Product = 32, sum = 11." },
          { in: "n = 1", out: "0" },
        ],
        ["1 <= n <= 100000"]),
      hints: [
        "One pass over the digits can maintain both accumulators at once.",
        "Seed the product at 1 and the sum at 0.",
        "A zero digit legitimately zeroes the product — do not skip it.",
      ],
      examples: [
        { input: "234", expectedOutput: "15" },
        { input: "4421", expectedOutput: "21" },
        { input: "1", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 100000);
        return { input: String(n), expectedOutput: String(ref(n)) };
      },
      solutions: {
        python: `def subtractProductAndSum(n: int) -> int:\n    prod, total = 1, 0\n    while n > 0:\n        d = n % 10\n        prod *= d\n        total += d\n        n //= 10\n    return prod - total`,
        javascript: `var subtractProductAndSum = function(n) {\n    let prod = 1, total = 0;\n    while (n > 0) {\n        const d = n % 10;\n        prod *= d;\n        total += d;\n        n = Math.floor(n / 10);\n    }\n    return prod - total;\n};`,
              typescript: `function subtractProductAndSum(n: number): number {\n    var prod = 1;\n    var total = 0;\n    while (n > 0) {\n        var d = n % 10;\n        prod *= d;\n        total += d;\n        n = Math.floor(n / 10);\n    }\n    return prod - total;\n}`,
              java: `public static int subtractProductAndSum(int n) {\n    int prod = 1, total = 0;\n    while (n > 0) {\n        int d = n % 10;\n        prod *= d;\n        total += d;\n        n /= 10;\n    }\n    return prod - total;\n}`,
              cpp: `int subtractProductAndSum(int n) {\n    int prod = 1, total = 0;\n    while (n > 0) {\n        int d = n % 10;\n        prod *= d;\n        total += d;\n        n /= 10;\n    }\n    return prod - total;\n}`,
              c: `int subtractProductAndSum(int n) {\n    int prod = 1, total = 0;\n    while (n > 0) {\n        int d = n % 10;\n        prod *= d;\n        total += d;\n        n /= 10;\n    }\n    return prod - total;\n}`,
              csharp: `public static int SubtractProductAndSum(int n)\n{\n    int prod = 1, total = 0;\n    while (n > 0)\n    {\n        int d = n % 10;\n        prod *= d;\n        total += d;\n        n /= 10;\n    }\n    return prod - total;\n}`,
              go: `func subtractProductAndSum(n int) int {\n	prod, total := 1, 0\n	for n > 0 {\n		d := n % 10\n		prod *= d\n		total += d\n		n /= 10\n	}\n	return prod - total\n}`,
              kotlin: `fun subtractProductAndSum(n: Int): Int {\n    var cur = n\n    var prod = 1\n    var total = 0\n    while (cur > 0) {\n        val d = cur % 10\n        prod *= d\n        total += d\n        cur /= 10\n    }\n    return prod - total\n}`,
              swift: `func subtractProductAndSum(_ n: Int) -> Int {\n    var cur = n\n    var prod = 1\n    var total = 0\n    while cur > 0 {\n        let d = cur % 10\n        prod *= d\n        total += d\n        cur /= 10\n    }\n    return prod - total\n}`,
              rust: `fn subtractProductAndSum(n: i32) -> i32 {\n    let mut cur = n;\n    let mut prod = 1;\n    let mut total = 0;\n    while cur > 0 {\n        let d = cur % 10;\n        prod *= d;\n        total += d;\n        cur /= 10;\n    }\n    prod - total\n}`,
              php: `function subtractProductAndSum($n) {\n    $prod = 1;\n    $total = 0;\n    while ($n > 0) {\n        $d = $n % 10;\n        $prod *= $d;\n        $total += $d;\n        $n = intdiv($n, 10);\n    }\n    return $prod - $total;\n}`,
              ruby: `def subtractProductAndSum(n)\n  prod = 1\n  total = 0\n  while n > 0\n    d = n % 10\n    prod *= d\n    total += d\n    n /= 10\n  end\n  prod - total\nend`,
      },
    };
  })(),

  // ── Find Numbers with Even Number of Digits ─────────────────────
  (() => {
    const ref = (nums: number[]) => {
      let count = 0;
      for (let i = 0; i < nums.length; i++) if (String(nums[i]).length % 2 === 0) count++;
      return count;
    };
    return {
      slug: "find-numbers-with-even-number-of-digits",
      title: "Find Numbers with Even Number of Digits",
      difficulty: "EASY" as const,
      tags: ["Array", "Math", "Amazon", "TCS", "Capgemini"],
      signature: { funcName: "findNumbers", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given an array `nums` of integers, return how many of them contain an **even number of digits**.",
        [
          { in: "nums = [12,345,2,6,7896]", out: "2", note: "12 has 2 digits and 7896 has 4; the rest have an odd count." },
          { in: "nums = [555,901,482,1771]", out: "1", note: "Only 1771 has an even number of digits." },
          { in: "nums = [1,2,3]", out: "0" },
        ],
        ["1 <= nums.length <= 50", "1 <= nums[i] <= 100000"]),
      hints: [
        "Digit count is just the length of the decimal representation.",
        "Or count divisions by 10 until the value reaches zero, if you would rather avoid strings.",
      ],
      examples: [
        { input: "[12,345,2,6,7896]", expectedOutput: "2" },
        { input: "[555,901,482,1771]", expectedOutput: "1" },
        { input: "[1,2,3]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 50);
        const nums: number[] = [];
        for (let i = 0; i < n; i++) nums.push(ri(rng, 1, 100000));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `def findNumbers(nums):\n    return sum(1 for x in nums if len(str(x)) % 2 == 0)`,
        javascript: `var findNumbers = function(nums) {\n    let count = 0;\n    for (let i = 0; i < nums.length; i++) {\n        if (String(nums[i]).length % 2 === 0) count++;\n    }\n    return count;\n};`,
              typescript: `function findNumbers(nums: number[]): number {\n    var count = 0;\n    for (var i = 0; i < nums.length; i++) {\n        var digits = 0;\n        var x = nums[i];\n        while (x > 0) {\n            digits++;\n            x = Math.floor(x / 10);\n        }\n        if (digits % 2 === 0) count++;\n    }\n    return count;\n}`,
              java: `public static int findNumbers(int[] nums) {\n    int count = 0;\n    for (int v : nums) {\n        int digits = 0, x = v;\n        while (x > 0) {\n            digits++;\n            x /= 10;\n        }\n        if (digits % 2 == 0) count++;\n    }\n    return count;\n}`,
              cpp: `int findNumbers(vector<int>& nums) {\n    int count = 0;\n    for (int v : nums) {\n        int digits = 0, x = v;\n        while (x > 0) {\n            digits++;\n            x /= 10;\n        }\n        if (digits % 2 == 0) count++;\n    }\n    return count;\n}`,
              c: `int findNumbers(int* nums, int numsSize) {\n    int count = 0;\n    for (int i = 0; i < numsSize; i++) {\n        int digits = 0, x = nums[i];\n        while (x > 0) {\n            digits++;\n            x /= 10;\n        }\n        if (digits % 2 == 0) count++;\n    }\n    return count;\n}`,
              csharp: `public static int FindNumbers(int[] nums)\n{\n    int count = 0;\n    foreach (int v in nums)\n    {\n        int digits = 0, x = v;\n        while (x > 0)\n        {\n            digits++;\n            x /= 10;\n        }\n        if (digits % 2 == 0) count++;\n    }\n    return count;\n}`,
              go: `func findNumbers(nums []int) int {\n	count := 0\n	for _, v := range nums {\n		digits, x := 0, v\n		for x > 0 {\n			digits++\n			x /= 10\n		}\n		if digits%2 == 0 {\n			count++\n		}\n	}\n	return count\n}`,
              kotlin: `fun findNumbers(nums: IntArray): Int {\n    var count = 0\n    for (v in nums) {\n        var digits = 0\n        var x = v\n        while (x > 0) {\n            digits++\n            x /= 10\n        }\n        if (digits % 2 == 0) count++\n    }\n    return count\n}`,
              swift: `func findNumbers(_ nums: [Int]) -> Int {\n    var count = 0\n    for v in nums {\n        var digits = 0\n        var x = v\n        while x > 0 {\n            digits += 1\n            x /= 10\n        }\n        if digits % 2 == 0 { count += 1 }\n    }\n    return count\n}`,
              rust: `fn findNumbers(nums: Vec<i32>) -> i32 {\n    let mut count = 0;\n    for v in nums.iter() {\n        let mut digits = 0;\n        let mut x = *v;\n        while x > 0 {\n            digits += 1;\n            x /= 10;\n        }\n        if digits % 2 == 0 {\n            count += 1;\n        }\n    }\n    count\n}`,
              php: `function findNumbers($nums) {\n    $count = 0;\n    foreach ($nums as $v) {\n        $digits = 0;\n        $x = $v;\n        while ($x > 0) {\n            $digits++;\n            $x = intdiv($x, 10);\n        }\n        if ($digits % 2 === 0) $count++;\n    }\n    return $count;\n}`,
              ruby: `def findNumbers(nums)\n  count = 0\n  nums.each do |v|\n    digits = 0\n    x = v\n    while x > 0\n      digits += 1\n      x /= 10\n    end\n    count += 1 if digits % 2 == 0\n  end\n  count\nend`,
      },
    };
  })(),

  // ── Maximum 69 Number ───────────────────────────────────────────
  (() => {
    const ref = (num: number) => {
      const s = String(num);
      const i = s.indexOf("6");
      if (i < 0) return num;
      return parseInt(s.slice(0, i) + "9" + s.slice(i + 1), 10);
    };
    return {
      slug: "maximum-69-number",
      title: "Maximum 69 Number",
      difficulty: "EASY" as const,
      tags: ["Math", "Greedy", "Amazon", "Adobe"],
      signature: { funcName: "maximum69Number", params: [{ name: "num", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You are given a positive integer `num` consisting only of the digits `6` and `9`.\n\nReturn the maximum number you can get by changing **at most one** digit — a 6 may become a 9, or a 9 may become a 6.",
        [
          { in: "num = 9669", out: "9969", note: "Changing the first 6 gives the largest result." },
          { in: "num = 9996", out: "9999" },
          { in: "num = 9999", out: "9999", note: "No change is better than leaving it alone." },
        ],
        ["1 <= num <= 10^4", "num consists only of the digits 6 and 9."]),
      hints: [
        "Turning a 9 into a 6 only ever makes the number smaller, so the single change must be 6 → 9.",
        "Changing the **leftmost** 6 gains the most, because it sits in the highest place value.",
        "If there is no 6 at all, return the number unchanged.",
      ],
      examples: [
        { input: "9669", expectedOutput: "9969" },
        { input: "9996", expectedOutput: "9999" },
        { input: "9999", expectedOutput: "9999" },
      ],
      gen: (rng: Rng) => {
        const len = ri(rng, 1, 4);
        let s = "";
        for (let i = 0; i < len; i++) s += rng() < 0.5 ? "6" : "9";
        const num = parseInt(s, 10);
        return { input: String(num), expectedOutput: String(ref(num)) };
      },
      solutions: {
        python: `def maximum69Number(num: int) -> int:\n    s = str(num)\n    i = s.find("6")\n    if i < 0:\n        return num\n    return int(s[:i] + "9" + s[i + 1:])`,
        javascript: `var maximum69Number = function(num) {\n    const s = String(num);\n    const i = s.indexOf("6");\n    if (i < 0) return num;\n    return parseInt(s.slice(0, i) + "9" + s.slice(i + 1), 10);\n};`,
              typescript: `function maximum69Number(num: number): number {\n    var s = String(num);\n    var i = s.indexOf("6");\n    if (i < 0) return num;\n    return parseInt(s.substring(0, i) + "9" + s.substring(i + 1), 10);\n}`,
              java: `public static int maximum69Number(int num) {\n    String s = String.valueOf(num);\n    int i = s.indexOf('6');\n    if (i < 0) return num;\n    return Integer.parseInt(s.substring(0, i) + "9" + s.substring(i + 1));\n}`,
              cpp: `int maximum69Number(int num) {\n    string s = to_string(num);\n    size_t i = s.find('6');\n    if (i == string::npos) return num;\n    s[i] = '9';\n    return stoi(s);\n}`,
              c: `int maximum69Number(int num) {\n    char s[16];\n    sprintf(s, "%d", num);\n    for (int i = 0; s[i] != '\\0'; i++) {\n        if (s[i] == '6') {\n            s[i] = '9';\n            break;\n        }\n    }\n    return atoi(s);\n}`,
              csharp: `public static int Maximum69Number(int num)\n{\n    string s = num.ToString();\n    int i = s.IndexOf('6');\n    if (i < 0) return num;\n    return int.Parse(s.Substring(0, i) + "9" + s.Substring(i + 1));\n}`,
              go: `func maximum69Number(num int) int {\n	s := []byte(strconv.Itoa(num))\n	for i := 0; i < len(s); i++ {\n		if s[i] == '6' {\n			s[i] = '9'\n			break\n		}\n	}\n	v, _ := strconv.Atoi(string(s))\n	return v\n}`,
              kotlin: `fun maximum69Number(num: Int): Int {\n    val s = num.toString().toCharArray()\n    for (i in s.indices) {\n        if (s[i] == '6') {\n            s[i] = '9'\n            break\n        }\n    }\n    return String(s).toInt()\n}`,
              swift: `func maximum69Number(_ num: Int) -> Int {\n    var chars = Array(String(num))\n    for i in 0..<chars.count {\n        if chars[i] == "6" {\n            chars[i] = "9"\n            break\n        }\n    }\n    return Int(String(chars))!\n}`,
              rust: `fn maximum69Number(num: i32) -> i32 {\n    let mut bytes = num.to_string().into_bytes();\n    for i in 0..bytes.len() {\n        if bytes[i] == b'6' {\n            bytes[i] = b'9';\n            break;\n        }\n    }\n    String::from_utf8(bytes).unwrap().parse::<i32>().unwrap()\n}`,
              php: `function maximum69Number($num) {\n    $s = strval($num);\n    $i = strpos($s, "6");\n    if ($i === false) return $num;\n    $s[$i] = "9";\n    return intval($s);\n}`,
              ruby: `def maximum69Number(num)\n  s = num.to_s\n  i = s.index("6")\n  return num if i.nil?\n  s[i] = "9"\n  s.to_i\nend`,
      },
    };
  })(),
];
