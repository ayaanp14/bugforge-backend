import { defineModule, type QuizSeed } from "../../dsl.js";
import { NCR_CASES, POW_CASES, PRIME_RANGE_CASES } from "./cases.js";

/** Questions are written with the right option first; rotate each one so the key lands in varied positions. */
const spread = (qs: QuizSeed[]): QuizSeed[] =>
  qs.map((q, i) => {
    const r = (i * 3 + 3) % q.options.length;
    return { ...q, options: [...q.options.slice(r), ...q.options.slice(0, r)], answer: (q.answer - r + q.options.length) % q.options.length };
  });

export default defineModule(import.meta.url, {
  slug: "number-theory",
  title: "Number theory: sieve, modular arithmetic, nCr",
  blurb: "The Sieve of Eratosthenes with prefix counts, exponentiation by squaring, inverses by Fermat's little theorem, nCr mod 1e9+7 from factorial tables, and __int128 for moduli near 10^18.",
  icon: "cpu",
  overview: `Contest number theory is a small toolkit used everywhere: answers "modulo 10⁹ + 7", primes up to 10⁷, binomial coefficients for counting problems, powers with exponents in the billions. This module teaches the four tools that cover most of it and the overflow rules that keep them correct.

The lesson animates the **Sieve of Eratosthenes** crossing out multiples from p², and **modular exponentiation** squaring its way through the bits of the exponent; then it turns division into multiplication by an inverse (Fermat's little theorem, since 10⁹ + 7 is prime) and builds factorial and inverse-factorial tables for O(1) nCr. The exercises answer 3 000 prime-count range queries with a sieve and a prefix count, and 3 000 nCr queries with n up to 10⁶. The timed checkpoint raises numbers up to 10¹⁸ to powers up to 10¹⁸ modulo values up to 10¹⁸ — where every product needs \`__int128\`.`,
  lessons: [
    {
      slug: "sieve-and-modular-arithmetic",
      file: "01-sieve-and-modular-arithmetic.md",
      exercises: [
        {
          title: "Primes in ranges",
          prompt: `Answer \`q\` questions: how many primes lie in the range \`[l, r]\`, both ends included?

**Input:** \`q\` (\`1 ≤ q ≤ 10^5\`), then \`q\` lines \`l r\` (\`1 ≤ l ≤ r ≤ 10^6\`).
**Output:** one line per question, the count.

\`\`\`text
5
1 10
10 20
2 2
1 1
14 16
\`\`\`
prints
\`\`\`text
4
4
1
0
0
\`\`\`

Trial division per question is far too slow at the limits; sieve once.`,
          starter: String.raw`#include <bits/stdc++.h>
using namespace std;
using ll = long long;

const int N = 1'000'000;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    // TODO: sieve composite[0..N]
    // TODO: cnt[i] = number of primes <= i
    int q;
    cin >> q;
    while (q--) {
        int l, r;
        cin >> l >> r;
        // TODO: print cnt[r] - cnt[l - 1]
    }
    return 0;
}
`,
          solution: String.raw`#include <bits/stdc++.h>
using namespace std;
using ll = long long;

const int N = 1'000'000;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    vector<bool> composite(N + 1, false);
    composite[0] = composite[1] = true;
    for (ll p = 2; p * p <= N; ++p)
        if (!composite[p])
            for (ll m = p * p; m <= N; m += p) composite[m] = true;

    // cnt[i] = primes in [1, i]; a range is a difference of two prefixes.
    vector<int> cnt(N + 1, 0);
    for (int i = 1; i <= N; ++i) cnt[i] = cnt[i - 1] + (composite[i] ? 0 : 1);

    int q;
    cin >> q;
    while (q--) {
        int l, r;
        cin >> l >> r;
        cout << cnt[r] - cnt[l - 1] << '\n';
    }
    return 0;
}
`,
          hints: [
            "Every question is about numbers up to 10^6. Find all the primes up to 10^6 once, before reading any question.",
            "Sieve of Eratosthenes: for each p with p * p <= N that is still unmarked, mark p*p, p*p + p, … as composite. Remember 0 and 1 are not prime.",
            "Build cnt[i] = primes in [1, i]; then the answer is cnt[r] - cnt[l - 1], with cnt[0] = 0.",
          ],
          cases: PRIME_RANGE_CASES,
        },
        {
          title: "nCr modulo 1e9+7",
          prompt: `Answer \`q\` questions: print \`C(n, r)\` — the number of ways to choose \`r\` items from \`n\` — modulo \`1 000 000 007\`. When \`r > n\` the answer is \`0\`.

**Input:** \`q\` (\`1 ≤ q ≤ 10^5\`), then \`q\` lines \`n r\` (\`0 ≤ n, r ≤ 10^6\`).
**Output:** one line per question.

\`\`\`text
5
5 2
10 0
10 10
3 5
0 0
\`\`\`
prints
\`\`\`text
10
1
1
0
1
\`\`\`

Precompute factorials and inverse factorials up to 10⁶ once; each question is then O(1).`,
          starter: String.raw`#include <bits/stdc++.h>
using namespace std;
using ll = long long;

const ll MOD = 1'000'000'007;
const int N = 1'000'000;

ll power(ll b, ll e) {
    // TODO: exponentiation by squaring, mod MOD
    return 1;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    vector<ll> fact(N + 1), inv(N + 1);
    // TODO: fact[i] = i! mod MOD; inv[N] = fact[N]^(MOD-2); inv[i-1] = inv[i] * i
    int q;
    cin >> q;
    while (q--) {
        int n, r;
        cin >> n >> r;
        // TODO: print 0 when r > n, else fact[n] * inv[r] % MOD * inv[n - r] % MOD
    }
    return 0;
}
`,
          solution: String.raw`#include <bits/stdc++.h>
using namespace std;
using ll = long long;

const ll MOD = 1'000'000'007;
const int N = 1'000'000;

ll power(ll b, ll e) {
    ll r = 1;
    b %= MOD;
    for (; e > 0; e >>= 1, b = b * b % MOD)
        if (e & 1) r = r * b % MOD;
    return r;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    vector<ll> fact(N + 1), inv(N + 1);
    fact[0] = 1;
    for (int i = 1; i <= N; ++i) fact[i] = fact[i - 1] * i % MOD;
    // MOD is prime, so fact[N]^(MOD-2) is its inverse (Fermat); walk down for the rest.
    inv[N] = power(fact[N], MOD - 2);
    for (int i = N; i > 0; --i) inv[i - 1] = inv[i] * i % MOD;

    int q;
    cin >> q;
    while (q--) {
        int n, r;
        cin >> n >> r;
        if (r > n) {
            cout << 0 << '\n';
            continue;
        }
        cout << fact[n] * inv[r] % MOD * inv[n - r] % MOD << '\n';
    }
    return 0;
}
`,
          hints: [
            "C(n, r) = n! / (r! (n - r)!). Under a prime modulus, dividing by x means multiplying by x^(MOD - 2).",
            "One modpow per query would work, but tables are cheaper: inv[N] = power(fact[N], MOD - 2), then inv[i - 1] = inv[i] * i % MOD going down.",
            "Reduce after every multiplication: both factors are below 1e9+7, so their product fits in long long, but a product of three does not.",
          ],
          cases: NCR_CASES,
        },
      ],
      quiz: spread([
        {
          prompt: "Why does the sieve's inner loop start at `p * p` rather than `2 * p`?",
          options: [
            "Every smaller multiple of p has a smaller prime factor and is already crossed out",
            "Starting at 2 * p would cross out p itself",
            "p * p is the only multiple that matters",
            "It is required for the prefix count to work",
          ],
          answer: 0,
          explanation: "k·p with k < p is divisible by some prime ≤ k < p, which crossed it out earlier. Starting at p·p skips repeated work — and lets the outer loop stop when p·p > N.",
        },
        {
          prompt: "`MOD = 1e9+7`. Which expression can overflow `long long` when `a`, `b` and `c` are already reduced mod MOD?",
          options: ["a * b * c % MOD", "a * b % MOD", "a * b % MOD * c % MOD", "(a + b) % MOD"],
          answer: 0,
          explanation: "Two reduced values multiply to under 1.0e18, which fits; multiplying that by a third before reducing can reach 10^27. Reduce after every product.",
        },
        {
          prompt: "What is `power(5, 0, 1)` with the lesson's modpow, which starts from `r = 1 % m`?",
          options: ["0", "1", "5", "Undefined"],
          answer: 0,
          explanation: "Everything is 0 modulo 1. Starting from `1 % m` gives 0 when m = 1; starting from a bare `1` would wrongly print 1.",
        },
        {
          prompt: "Why may a / b mod p be computed as `a * power(b, p - 2, p) % p`?",
          options: [
            "Because p is prime and b is not a multiple of p, b^(p-1) ≡ 1, so b^(p-2) is b's inverse",
            "Because p - 2 is always even",
            "It works for any modulus",
            "Because power rounds the division",
          ],
          answer: 0,
          explanation: "Fermat's little theorem: for prime p and b not divisible by p, b^(p−1) ≡ 1 (mod p), so b · b^(p−2) ≡ 1. For a composite modulus you need the extended Euclidean algorithm, and an inverse exists only when gcd(b, m) = 1.",
        },
      ]),
    },
    {
      slug: "number-theory-checkpoint",
      file: "02-checkpoint.md",
      kind: "test",
      passMark: 70,
      timeLimitMin: 45,
      exercises: [
        {
          title: "Huge powers, huge modulus",
          prompt: `Answer \`q\` questions: print \`a^b mod m\`. Take \`0^0 = 1\`, so \`a^0 mod m\` is \`1 mod m\`.

**Input:** \`q\` (\`1 ≤ q ≤ 10^4\`), then \`q\` lines \`a b m\` (\`0 ≤ a, b ≤ 10^18\`, \`1 ≤ m ≤ 10^18\`).
**Output:** one line per question.

\`\`\`text
5
2 10 1000
3 13 1000
5 0 7
7 3 1
0 0 10
\`\`\`
prints
\`\`\`text
24
323
1
0
1
\`\`\`

With \`m\` near 10¹⁸, the product of two residues reaches 10³⁶ — no 64-bit type holds it.`,
          starter: String.raw`#include <bits/stdc++.h>
using namespace std;
using ll = long long;

ll mulmod(ll a, ll b, ll m) {
    // TODO: multiply without overflow (hint: __int128)
    return 0;
}

ll power(ll b, ll e, ll m) {
    // TODO: exponentiation by squaring; start from 1 % m
    return 0;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int q;
    cin >> q;
    while (q--) {
        ll a, b, m;
        cin >> a >> b >> m;
        cout << power(a, b, m) << '\n';
    }
    return 0;
}
`,
          solution: String.raw`#include <bits/stdc++.h>
using namespace std;
using ll = long long;

// Residues below 10^18 multiply to below 10^36: only a 128-bit product holds it.
ll mulmod(ll a, ll b, ll m) {
    return static_cast<ll>(static_cast<__int128>(a) * b % m);
}

ll power(ll b, ll e, ll m) {
    ll r = 1 % m;   // m = 1 makes every answer 0
    b %= m;
    while (e > 0) {
        if (e & 1) r = mulmod(r, b, m);
        b = mulmod(b, b, m);
        e >>= 1;
    }
    return r;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int q;
    cin >> q;
    while (q--) {
        ll a, b, m;
        cin >> a >> b >> m;
        cout << power(a, b, m) << '\n';
    }
    return 0;
}
`,
          hints: [
            "b is up to 10^18, so multiply by squaring: about 60 steps per question.",
            "Both factors in every product are below m ≤ 10^18, so the product can reach 10^36. Cast one factor to __int128 before multiplying, take % m, then cast back.",
            "Start the result at 1 % m, not 1: when m = 1 every answer is 0, even for b = 0.",
          ],
          cases: POW_CASES,
        },
      ],
      quiz: spread([
        {
          prompt: "What is the time complexity of the Sieve of Eratosthenes up to n?",
          options: ["O(n log log n)", "O(n √n)", "O(n log n) per prime", "O(√n)"],
          answer: 0,
          explanation: "Each prime p crosses about n/p numbers, and the sum of 1/p over primes up to n grows like log log n. Trial division of every number would be O(n√n).",
        },
        {
          prompt: "How many multiplications does exponentiation by squaring use for an exponent near 10^18?",
          options: ["About 120 (two per bit, 60 bits)", "About 10^9", "About 10^18", "About 18"],
          answer: 0,
          explanation: "10^18 < 2^60, so there are at most 60 bits: one squaring per bit and at most one multiply into the result.",
        },
        {
          prompt: "Why is `(__int128)a * b % m` needed when m is near 10^18, but not when m = 1e9+7?",
          options: [
            "Residues below 1e9+7 multiply to under 2^60, which long long holds; residues below 10^18 multiply to up to 10^36",
            "__int128 is faster",
            "long long cannot hold 10^18",
            "Because % is undefined on long long",
          ],
          answer: 0,
          explanation: "long long holds up to about 9.2 × 10^18. (10^9)² = 10^18 fits; (10^18)² does not. __int128 holds about 1.7 × 10^38.",
        },
        {
          prompt: "With factorial tables up to N, `inv[N] = power(fact[N], MOD - 2)`. How is `inv[N - 1]` obtained?",
          options: ["inv[N] * N % MOD", "inv[N] / N", "power(fact[N - 1], MOD - 2) is the only way", "inv[N] * (N - 1) % MOD"],
          answer: 0,
          explanation: "1/(N−1)! = N / N! = N · inv[N]. Walking down this way computes every inverse factorial with one modpow and N multiplications.",
        },
        {
          prompt: "What is C(10, 3) mod 1e9+7?",
          options: ["120", "720", "30", "1000"],
          answer: 0,
          explanation: "10·9·8 / 3! = 720 / 6 = 120, already below the modulus.",
        },
        {
          prompt: "How do you count the primes in many ranges [l, r] with r ≤ 10^6?",
          options: [
            "Sieve once, build a prefix count, answer cnt[r] − cnt[l − 1]",
            "Trial-divide every number in each range",
            "Sieve each range separately",
            "Binary search for l and r in the sieve array",
          ],
          answer: 0,
          explanation: "The sieve is O(N log log N) once; the prefix count makes each range O(1). Trial division per range is O(range · √r) every time.",
        },
        {
          prompt: "Why can't you compute C(n, r) mod p as `fact[n] / (fact[r] * fact[n - r]) % p` with reduced factorials?",
          options: [
            "Reduced factorials are no longer divisible in the integers; division must be a multiplication by the modular inverse",
            "Division is slower than multiplication",
            "fact[n] overflows before the division",
            "It works, but only for even n",
          ],
          answer: 0,
          explanation: "After reducing mod p, fact[n] may be smaller than the divisor or not a multiple of it, so integer division gives nonsense. Multiply by the inverse instead.",
        },
        {
          prompt: "Fermat's little theorem gives inverses modulo a prime p. When does an inverse of b modulo a composite m exist?",
          options: ["Exactly when gcd(b, m) = 1", "Always", "Never", "Only when m is even"],
          answer: 0,
          explanation: "b has an inverse mod m iff b and m are coprime; the extended Euclidean algorithm finds it. Fermat's shortcut b^(m−2) only works for prime m.",
        },
        {
          prompt: "In `power`, what goes wrong if the base is not reduced (`b %= m`) before the loop, with b up to 10^18 and m = 1e9+7?",
          options: [
            "The first squaring b * b overflows long long",
            "Nothing; the answer is the same",
            "The loop runs forever",
            "The result is always 1",
          ],
          answer: 0,
          explanation: "b · b with b near 10^18 is 10^36: undefined behaviour in long long. Reducing first keeps every factor below m, so with m = 1e9+7 each product stays under 2^60.",
        },
        {
          prompt: "A smallest-prime-factor sieve stores `spf[x]` for every x ≤ N. How long does factoring one x ≤ N take with it?",
          options: ["O(log x)", "O(√x)", "O(N)", "O(1)"],
          answer: 0,
          explanation: "Repeatedly divide x by spf[x]. Each division at least halves x, so there are at most log2(x) steps.",
        },
      ]),
    },
  ],
});
