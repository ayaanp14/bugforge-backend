---
title: The sieve, modular arithmetic and nCr mod p
minutes: 15
seo-title: Sieve of Eratosthenes, Modpow and nCr mod p in C++
description: The number theory contests use most: a sieve for primes up to 10^7, fast modular exponentiation, inverses by Fermat, and nCr mod 1e9+7 from factorial tables.
question: How do you compute nCr modulo 1e9+7?
answer: Precompute factorials `fact[i] = i! mod p` up to the largest n, then inverse factorials: `inv[n] = fact[n]^(p-2) mod p` by Fermat's little theorem and `inv[i-1] = inv[i] * i mod p` going down. Then `C(n, r) = fact[n] * inv[r] % p * inv[n-r] % p` answers each query in O(1), and 0 when r > n. This works because 1e9+7 is prime.
q: What is the time complexity of the Sieve of Eratosthenes?
a: O(n log log n) time and O(n) memory. Each prime p crosses out about n/p numbers starting from p squared, and the sum of n/p over primes up to n grows like n log log n. A sieve up to 10^7 runs in well under a second.
q: Why is 1e9+7 used as a modulus?
a: It is prime, so every non-zero value has a modular inverse and division works through Fermat's little theorem. It is also below 2^30, so two reduced values multiply to less than 2^60 and fit in a `long long` without overflow.
q: How does fast modular exponentiation work?
a: Read the exponent's bits from the lowest. Each step squares the base, and multiplies the base into the result when the bit is 1, reducing modulo m every time. That takes O(log e) multiplications instead of e.
q: How do I multiply two numbers modulo m when m is near 10^18?
a: The product of two values below 10^18 can reach 10^36, far past `long long`. Cast to `__int128` for the multiplication, `(__int128)a * b % m`, then back to `long long`. With a modulus below about 3·10^9 a plain `long long` product is enough.
q: Why does the sieve start crossing out at p squared?
a: Every smaller multiple k·p with k < p has a prime factor smaller than p, so an earlier prime has already crossed it out. Starting at p·p skips that repeated work and lets the outer loop stop once p·p exceeds n.
---
Three tools cover most of the number theory a contest asks for: a **sieve** for every prime at once, **modular exponentiation** for huge powers, and **factorial tables** for binomial coefficients under a prime modulus.

## The sieve

Testing each number by trial division costs O(n√n). The Sieve of Eratosthenes marks every composite up to n in O(n log log n): each prime crosses out its multiples, starting at its square.

@figure sieve

```cpp
vector<bool> composite(N + 1);
composite[0] = composite[1] = true;
for (ll p = 2; p * p <= N; ++p)
    if (!composite[p])
        for (ll m = p * p; m <= N; m += p) composite[m] = true;
```

- Range questions — "how many primes in [l, r]" — become a **prefix count** over the sieve: O(1) each.
- Keep the smallest prime factor instead of a bool and you can factor any number up to N in O(log N).

## Powers by squaring

`a^e mod m` with `e` up to 10¹⁸ needs about 60 steps, not 10¹⁸.

@figure modpow

```cpp
ll power(ll b, ll e, ll m) {
    ll r = 1 % m;
    b %= m;
    for (; e > 0; e >>= 1, b = b * b % m)
        if (e & 1) r = r * b % m;
    return r;
}
```

- **Reduce after every product.** Below `MOD = 1e9+7` two values multiply to under 2⁶⁰, safe in `long long`.
- **A modulus near 10¹⁸?** Multiply in `__int128`: `(__int128)a * b % m`.
- `1 % m`, not `1`: when `m = 1` the answer is 0.

## Division mod a prime, and nCr

You cannot divide under a modulus, but you can multiply by an **inverse**. For a prime `p`, Fermat gives `a⁻¹ = a^(p−2) mod p`.

```cpp
fact[0] = 1;
for (int i = 1; i <= N; ++i) fact[i] = fact[i - 1] * i % MOD;
inv[N] = power(fact[N], MOD - 2, MOD);
for (int i = N; i > 0; --i) inv[i - 1] = inv[i] * i % MOD;
// C(n, r) = fact[n] * inv[r] % MOD * inv[n - r] % MOD, and 0 when r > n
```

One modpow and two O(N) loops, then every query is O(1).

## The traps

- **Three factors, one reduction.** `a * b * c % MOD` overflows even when each is reduced; reduce after every product.
- **Negative results.** `(a - b) % MOD` can be negative in C++; write `(a - b + MOD) % MOD`.
- **A composite modulus.** Fermat's inverse needs a prime. Modulo a composite `m`, `b` has an inverse only when `gcd(b, m) = 1`.
- **Tables too small.** Size them by the largest `n` any query can ask, not the first one you read.

```game
type: match
title: The tool for the job
prompt: Match each task to the technique that solves it in time.
- Count primes in a million ranges up to 10^6 => sieve plus a prefix count
- 2^(10^18) mod 1e9+7 => exponentiation by squaring
- a / b mod 1e9+7 => multiply by b^(MOD-2)
- C(n, r) mod 1e9+7 for 10^5 queries => factorial and inverse factorial tables
- a * b mod m with m near 10^18 => multiply in __int128
```

## More practice

- [Count Primes](/problems/count-primes) — the sieve itself.
- [Closest Prime Numbers in Range](/problems/closest-prime-numbers-in-range) — sieve, then scan.
- [Count Good Numbers](/problems/count-good-numbers) — modpow with a huge exponent.
- [Prime Arrangements](/problems/prime-arrangements) — a sieve and factorials mod p.
- [Count Anagrams](/problems/count-anagrams) — multinomials with inverse factorials.
