---
title: Checkpoint — Number theory
minutes: 45
seo-title: Number Theory Practice Test: Sieve, Modpow and nCr Quiz
description: A timed 45-minute number theory practice test: the sieve, exponentiation by squaring, Fermat inverses, nCr mod p and 128-bit products for moduli near 10^18.
q: How do you compute a^b mod m when a, b and m are up to 10^18?
a: Use exponentiation by squaring, about 60 steps for a 60-bit exponent, and do every multiplication in `__int128`: `(__int128)x * y % m`. Two residues below 10^18 multiply to up to 10^36, which overflows `long long`. Start the result at `1 % m` so that m = 1 gives 0.
q: When does a modular inverse exist?
a: An inverse of b modulo m exists exactly when gcd(b, m) = 1. For a prime modulus such as 1e9+7 that is every b not divisible by it, and Fermat's little theorem gives it as `b^(m-2) mod m`; for a composite modulus use the extended Euclidean algorithm.
---
A timed checkpoint on contest number theory: the sieve and prefix counts, exponentiation by squaring, inverses under a prime modulus, factorial tables for nCr, and keeping every product inside its type.

**How it works.** Ten questions and one program, in **45 minutes** from when you start the timer. Clear 70% of the questions and get the program accepted on every hidden case — moduli up to 10¹⁸ included — to complete the module.

**Before you start**, make sure you can answer these from memory:

- Why the sieve starts at p², and its complexity.
- The modpow loop, and why the result starts at `1 % m`.
- Why reduced residues below 1e9+7 multiply safely in `long long`, and what changes near 10¹⁸.
- How one modpow and two loops give every inverse factorial up to N.
- When an inverse exists modulo a composite number.
