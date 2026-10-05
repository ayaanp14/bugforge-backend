---
title: Functional Dependencies in DBMS
order: 4
minutes: 13
level: intermediate
updated: 2026-10-05
seo-title: Functional Dependency in DBMS: Closure, Keys, Cover
description: Functional dependencies in DBMS: Armstrong's axioms, attribute closure step by step, finding every candidate key, and computing a canonical cover, all worked.
question: What is a functional dependency in DBMS?
answer: A functional dependency X → Y holds in a relation when any two rows that agree on the attributes X must also agree on the attributes Y; the X values determine the Y values. Roll number determines a student's name, so roll_no → name. Functional dependencies define keys and normal forms, and Armstrong's axioms derive every dependency implied by a given set.
q: What is a trivial functional dependency?
a: A functional dependency X → Y is trivial when Y is a subset of X, such as {roll_no, name} → name. It holds in every relation and says nothing about the data. It is non-trivial when Y has at least one attribute not in X, and completely non-trivial when X and Y share no attributes.
q: What are Armstrong's axioms?
a: Three inference rules for functional dependencies: reflexivity (if Y is a subset of X, then X → Y), augmentation (if X → Y, then XZ → YZ) and transitivity (if X → Y and Y → Z, then X → Z). They are sound, deriving only valid dependencies, and complete, deriving all of them.
q: What is the closure of an attribute set?
a: The closure X+ is the set of all attributes that X functionally determines under a set of dependencies F. Start with X and keep adding the right side of any dependency whose left side is already inside the set, until nothing changes. If X+ contains every attribute, X is a super key.
q: How do you find candidate keys from functional dependencies?
a: Attributes that appear on no right-hand side must be in every key, and attributes that appear only on right-hand sides are in none. Compute the closure of the must-have set; if it covers all attributes, it is the only key. Otherwise add the remaining attributes in growing combinations and keep the minimal sets whose closure is everything.
q: What is a canonical cover?
a: A canonical cover of F is a simplest equivalent set of dependencies: no dependency is redundant, no attribute on either side is extraneous, and dependencies with the same left side are combined. It implies exactly the same dependencies as F, so checking it on updates is cheaper.
q: Can sample data prove a functional dependency?
a: No. A dependency is a rule about every legal state of the relation. A single pair of rows that agree on X but differ on Y disproves X → Y, but rows that happen to satisfy it prove nothing, because a later insert may break it.
---

A **functional dependency** (FD) is a rule of the form "if you know this, you know that": a roll number fixes a student's name, a course code fixes its title, a PIN code fixes its post office. Functional dependencies are the mathematics underneath keys and normalization. Every normal form is defined with them, and every "find the candidate keys" or "is this relation in BCNF" question is answered by computing with them. This note covers the definition, Armstrong's axioms, attribute closure, finding all candidate keys and computing a canonical cover, each worked by hand.

## What a functional dependency is

For attribute sets X and Y of a relation R, **X → Y** ("X functionally determines Y", or "Y is functionally dependent on X") holds if any two rows that have the same values for X also have the same values for Y. X is the determinant (left-hand side) and Y the dependent (right-hand side).

An FD is a rule about every state the table is allowed to be in, which comes from the meaning of the data. An instance can only disprove one. Look at these rows:

| roll_no | name | course_id | grade |
| --- | --- | --- | --- |
| 101 | Asha | CS301 | A |
| 101 | Asha | CS302 | B |
| 102 | Vikram | CS301 | A |
| 103 | Asha | CS302 | B |

| Candidate FD | In these rows | Conclusion |
| --- | --- | --- |
| roll_no → name | 101 maps to Asha both times | Consistent; a real rule of the college |
| name → roll_no | Asha maps to 101 and 103 | Violated, so it is not an FD |
| roll_no → grade | 101 has A and B | Violated |
| {roll_no, course_id} → grade | Every pair appears once | Consistent; a real rule |
| course_id → grade | CS301 gives A twice, CS302 gives B twice | Consistent by coincidence; not a rule, and the next row may break it |

The last row is the trap: the data satisfies course_id → grade, but nothing in the college's rules says every student in a course gets the same grade.

FDs generalize keys. K is a super key of R exactly when K → R, that is, K determines every attribute.

## Trivial and non-trivial dependencies

| Kind | Condition | Example |
| --- | --- | --- |
| Trivial | Y ⊆ X | {roll_no, name} → name |
| Non-trivial | Y has an attribute not in X | roll_no → {roll_no, name} |
| Completely non-trivial | X ∩ Y is empty | roll_no → name |

Trivial FDs hold in every relation, so normal-form definitions only ever test non-trivial ones.

## Armstrong's axioms

Given a set F of FDs, many more follow from it. The set of all FDs implied by F is its **closure**, written F+. Armstrong's axioms generate F+:

| Rule | Statement |
| --- | --- |
| Reflexivity | If Y ⊆ X, then X → Y |
| Augmentation | If X → Y, then XZ → YZ for any Z |
| Transitivity | If X → Y and Y → Z, then X → Z |

They are **sound** (they derive only FDs that really hold) and **complete** (every FD that holds can be derived with them). Four derived rules save time:

| Derived rule | Statement | Proof from the axioms |
| --- | --- | --- |
| Union | X → Y and X → Z give X → YZ | Augment X → Y by X: X → XY. Augment X → Z by Y: XY → YZ. Transitivity: X → YZ |
| Decomposition | X → YZ gives X → Y and X → Z | YZ → Y by reflexivity, then transitivity |
| Pseudotransitivity | X → Y and WY → Z give WX → Z | Augment X → Y by W: WX → WY, then transitivity |
| Composition | X → Y and A → B give XA → YB | Augment each, then transitivity |

Decomposition works on the right side only. From AB → C you **cannot** conclude A → C or B → C.

## Attribute closure

Computing F+ directly is exponential, so in practice you compute the **closure of an attribute set**, X+: everything X determines.

1. Set result = X.
2. For each FD Y → Z in F: if Y is entirely inside result, add Z to result.
3. Repeat step 2 until a full pass adds nothing.

Take R(A, B, C, G, H, I) with F = {A → B, A → C, CG → H, CG → I, B → H}. Compute (AG)+:

| Step | FD used | Why it applies | Closure so far |
| --- | --- | --- | --- |
| Start | none | the set itself | A, G |
| 1 | A → B | A is inside | A, B, G |
| 2 | A → C | A is inside | A, B, C, G |
| 3 | CG → H | C and G are inside | A, B, C, G, H |
| 4 | CG → I | C and G are inside | A, B, C, G, H, I |
| 5 | B → H | adds nothing new | A, B, C, G, H, I |

(AG)+ = ABCGHI, every attribute, so AG is a super key. Closure answers three questions:

- **Is X a super key?** Yes if X+ contains all of R.
- **Does F imply X → Y?** Yes if Y ⊆ X+. Does F imply B → C? B+ = {B, H}, which lacks C, so no.
- **Is X a candidate key?** X+ is everything and no proper subset's closure is. Here A+ = {A, B, C, H} (A → B, A → C, B → H; CG → H cannot fire without G) and G+ = {G}, so AG is a candidate key.

## Finding all candidate keys

A method that never misses a key:

1. Sort the attributes. **Left-only** attributes (on some left side, no right side) and attributes that appear in **no FD at all** cannot be derived, so they belong to every key. **Right-only** attributes can always be derived from the rest, so they belong to no candidate key. The rest appear on **both** sides.
2. Compute the closure of the must-have set. If it covers R, it is the one and only candidate key.
3. Otherwise add "both" attributes to it, one at a time, then two at a time, and so on, keeping every set whose closure is R and skipping any set that contains a key already found.

**Example 1.** In the relation above, left-only attributes are A and G, right-only are H and I, and B and C appear on both sides. (AG)+ is everything, so **AG is the only candidate key**.

**Example 2.** R(A, B, C, D, E) with F = {A → BC, CD → E, B → D, E → A}. Every attribute appears on both sides, so no attribute is forced and we test sets by size.

| Set | Closure, step by step | Super key? |
| --- | --- | --- |
| A | A → BC gives ABC; B → D gives ABCD; CD → E gives ABCDE | Yes |
| B | B → D gives BD; nothing else fires | No |
| C | nothing fires | No |
| D | nothing fires | No |
| E | E → A gives AE; A → BC gives ABCE; B → D gives ABCDE | Yes |
| BC | B → D gives BCD; CD → E gives BCDE; E → A gives ABCDE | Yes |
| BD | nothing fires (CD → E needs C) | No |
| CD | CD → E gives CDE; E → A gives ACDE; A → BC gives ABCDE | Yes |

Pairs containing A or E are not minimal, so only BC, BD and CD needed testing. The only triple without A or E is BCD, which contains BC. The candidate keys are **A, E, BC and CD**, so every attribute here is prime. That fact matters in the next note: this relation is in 3NF, but B → D has a determinant that is not a super key, so it is not in BCNF.

## Canonical cover

Two FD sets F and G are **equivalent** when F+ = G+: each FD of one follows from the other (check with closures). A **canonical cover** Fc is the simplest set equivalent to F, which makes integrity checks cheap. Removing from a dependency an attribute that does not change F+ is called removing an **extraneous** attribute.

1. Split every right side into single attributes (decomposition).
2. For each FD with two or more attributes on the left, test each left attribute: in XA → B, A is extraneous if B ∈ X+ computed with all of F. Drop it if so.
3. For each FD X → B, compute X+ using F without that FD. If B is still in it, the FD is redundant; delete it.
4. Combine FDs with the same left side (union).

The set after step 3 is a **minimal cover**; step 4 makes it the canonical cover. Work F = {A → B, AB → C, C → D, A → D} on R(A, B, C, D):

| Step | Test | Result |
| --- | --- | --- |
| 1. Split right sides | already single | A → B, AB → C, C → D, A → D |
| 2. Left side of AB → C | Is B extraneous? A+ with all of F: A → B gives AB, AB → C gives ABC, C → D gives ABCD. C is inside, so yes | Replace with A → C |
| 2. Same FD | Is A extraneous? B+ = B, no C | Keep A |
| 3. A → D | A+ without it: A → B, A → C, C → D give ABCD; D is inside | Redundant, delete |
| 3. A → B | A+ without it: A → C, C → D give ACD; no B | Keep |
| 3. A → C | A+ without it: A → B gives AB; no C | Keep |
| 3. C → D | C+ without it: C; no D | Keep |
| 4. Combine | A → B and A → C share a left side | A → BC |

Minimal cover: {A → B, A → C, C → D}. Canonical cover: **{A → BC, C → D}**. To confirm equivalence, check each original FD under the cover: A+ = ABCD, so A → B, A → D and AB → C all follow, and C → D is in it.

A minimal cover is not always unique; the order in which you test can give different, equally valid answers.

## Common mistakes

- Splitting a left side: AB → C does not give A → C.
- Treating sample rows as proof of an FD: they can only disprove one.
- Stopping the closure loop after one pass: a later FD can enable an earlier one; repeat until nothing changes.
- Calling any super key a candidate key without checking that its proper subsets are not super keys.
- Testing an extraneous left attribute against F minus the FD itself: left-side tests use all of F; redundancy tests drop the FD.
- Forgetting attributes that appear in no FD: they must be part of every key.

## Interview questions

**Define a functional dependency.** X → Y holds in R if any two tuples that agree on X also agree on Y. It is a constraint on all legal instances of R, decided from the meaning of the data.

**State Armstrong's axioms and say why they matter.** Reflexivity, augmentation and transitivity. They are sound and complete, so every implied dependency can be derived with them and nothing false can.

**Prove the union rule.** From X → Y, augmenting by X gives X → XY. From X → Z, augmenting by Y gives XY → YZ. Transitivity on the two gives X → YZ.

**How do you check whether a set of attributes is a super key?** Compute its closure under F. It is a super key if the closure is every attribute of the relation, and a candidate key if additionally no proper subset has that property.

**R(A, B, C, D) has F = {AB → C, C → D, D → A}. What are the candidate keys?** B is left-only and must be in every key, but B+ = {B}. AB+ = ABCD, CB+ = BCDA and DB+ = BDAC, so the keys are AB, BC and BD.

**What is the difference between a minimal cover and a canonical cover?** Both have no redundant FDs and no extraneous attributes. A minimal cover has single attributes on every right side; a canonical cover merges FDs with the same left side into one.

**What is an extraneous attribute?** An attribute that can be removed from a dependency without changing the closure of the set. In AB → C with A → C also implied, B is extraneous on the left.

**Why do we compute attribute closure instead of F+?** F+ can have exponentially many dependencies. Every practical question (is X a key, does F imply X → Y) is answered by one attribute closure, which takes time polynomial in the size of F.

Next, use these tools to design good tables: [Normalization in DBMS: 1NF to BCNF](/notes/dbms/normalization). Dependencies and keys are examined in the [SQL (Intermediate) skill test](/skill-tests/sql-intermediate).
