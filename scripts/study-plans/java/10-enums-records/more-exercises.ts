import type { ExerciseSource } from "../../dsl.js";

/** A second program per lesson (a third for the checkpoint) — see defineModule's `extras`. */
const more: Record<string, ExerciseSource[]> = {
  "enum-basics": [
    {
      title: "Traffic light cycle",
      prompt: `Declare \`enum Light { RED, GREEN, YELLOW }\` with a method \`Light next()\` that cycles \`RED → GREEN → YELLOW → RED\` using \`values()\` and \`ordinal()\`. Read a starting colour and an integer \`k\`; print the light after each of \`k\` steps, one per line, then \`ordinal=<ordinal of the final light>\`. A starting colour that is not a constant makes \`valueOf\` throw — catch it and print \`unknown light: <text>\` instead.

Example: \`RED 4\` →
\`\`\`
GREEN
YELLOW
RED
GREEN
ordinal=1
\`\`\``,
      starter: String.raw`import java.util.*;

enum Light {
    RED, GREEN, YELLOW;
    Light next() {
        // TODO
        return this;
    }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        String start = in.next();
        int k = in.nextInt();
        // TODO
    }
}
`,
      solution: String.raw`import java.util.*;

enum Light {
    RED, GREEN, YELLOW;
    Light next() {
        Light[] all = values();
        return all[(ordinal() + 1) % all.length];
    }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        String start = in.next();
        int k = in.nextInt();
        Light light;
        try {
            light = Light.valueOf(start);
        } catch (IllegalArgumentException e) {
            System.out.println("unknown light: " + start);
            return;
        }
        for (int i = 0; i < k; i++) {
            light = light.next();
            System.out.println(light);
        }
        System.out.println("ordinal=" + light.ordinal());
    }
}
`,
      hints: ["values() returns the constants in declaration order; (ordinal() + 1) % length wraps around.", "valueOf is exact-match and case-sensitive; it throws IllegalArgumentException for anything else."],
      cases: [
        { stdin: "RED 4\n", expected: "GREEN\nYELLOW\nRED\nGREEN\nordinal=1\n" },
        { stdin: "YELLOW 1\n", expected: "RED\nordinal=0\n" },
        { stdin: "blue 3\n", expected: "unknown light: blue\n", hidden: true },
      ],
    },
  ],
  "enums-with-state": [
    {
      title: "Coins with values",
      prompt: `Declare \`enum Coin { QUARTER(25), DIME(10), NICKEL(5), PENNY(1) }\` with a \`cents\` field, a constructor and an accessor. Read an integer \`n\` and \`n\` amounts in cents. For each, make change greedily from the largest coin down (\`values()\` is already in that order) and print \`<amount>: <k> QUARTER, <k> DIME, …\` listing only coins used, then \`coins=<total count>\`.

Example: \`2\` then \`41 30\` →
\`\`\`
41: 1 QUARTER, 1 DIME, 1 NICKEL, 1 PENNY coins=4
30: 1 QUARTER, 1 NICKEL coins=2
\`\`\``,
      starter: String.raw`import java.util.*;

enum Coin {
    QUARTER(25), DIME(10), NICKEL(5), PENNY(1);
    // TODO: field, constructor, accessor
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            int amount = in.nextInt();
            // TODO
        }
    }
}
`,
      solution: String.raw`import java.util.*;

enum Coin {
    QUARTER(25), DIME(10), NICKEL(5), PENNY(1);
    private final int cents;
    Coin(int cents) { this.cents = cents; }
    int cents() { return cents; }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            int amount = in.nextInt();
            int left = amount, total = 0;
            List<String> parts = new ArrayList<>();
            for (Coin c : Coin.values()) {
                int k = left / c.cents();
                if (k > 0) {
                    parts.add(k + " " + c);
                    total += k;
                    left -= k * c.cents();
                }
            }
            System.out.println(amount + ": " + String.join(", ", parts) + " coins=" + total);
        }
    }
}
`,
      hints: ["An enum constructor runs once per constant; the field makes each constant carry its value.", "Greedy change works for this coin set: divide, subtract, move to the next coin."],
      cases: [
        { stdin: "2\n41 30\n", expected: "41: 1 QUARTER, 1 DIME, 1 NICKEL, 1 PENNY coins=4\n30: 1 QUARTER, 1 NICKEL coins=2\n" },
        { stdin: "1\n99\n", expected: "99: 3 QUARTER, 2 DIME, 4 PENNY coins=9\n" },
        { stdin: "2\n0 100\n", expected: "0:  coins=0\n100: 4 QUARTER coins=4\n", hidden: true },
      ],
    },
  ],
  "enumset-and-enummap": [
    {
      title: "Permission sets",
      prompt: `Declare \`enum Perm { READ, WRITE, EXEC, ADMIN }\`. Read two lines, each a space-separated list of permissions (or \`-\` for none), into two \`EnumSet\`s \`a\` and \`b\`. Print \`union=<…>\`, \`intersection=<…>\`, \`onlyA=<…>\` (\`a\` minus \`b\`) and \`missingFromA=<EnumSet.complementOf(a)>\`, each as the set's \`toString\` — EnumSets print in declaration order whatever the input order. Then, with an \`EnumMap<Perm, Integer>\`, count how many of the two sets contain each permission and print it.

Example: \`WRITE READ\` / \`READ EXEC\` →
\`\`\`
union=[READ, WRITE, EXEC]
intersection=[READ]
onlyA=[WRITE]
missingFromA=[EXEC, ADMIN]
counts={READ=2, WRITE=1, EXEC=1}
\`\`\``,
      starter: String.raw`import java.util.*;

enum Perm { READ, WRITE, EXEC, ADMIN }

public class Main {
    static EnumSet<Perm> parse(String line) {
        EnumSet<Perm> set = EnumSet.noneOf(Perm.class);
        // TODO
        return set;
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        EnumSet<Perm> a = parse(in.nextLine()), b = parse(in.nextLine());
        // TODO
    }
}
`,
      solution: String.raw`import java.util.*;

enum Perm { READ, WRITE, EXEC, ADMIN }

public class Main {
    static EnumSet<Perm> parse(String line) {
        EnumSet<Perm> set = EnumSet.noneOf(Perm.class);
        for (String t : line.trim().split("\\s+")) if (!t.isEmpty() && !t.equals("-")) set.add(Perm.valueOf(t));
        return set;
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        EnumSet<Perm> a = parse(in.nextLine()), b = parse(in.nextLine());
        EnumSet<Perm> union = EnumSet.copyOf(a); union.addAll(b);
        EnumSet<Perm> inter = EnumSet.copyOf(a); inter.retainAll(b);
        EnumSet<Perm> onlyA = EnumSet.copyOf(a); onlyA.removeAll(b);
        System.out.println("union=" + union);
        System.out.println("intersection=" + inter);
        System.out.println("onlyA=" + onlyA);
        System.out.println("missingFromA=" + EnumSet.complementOf(a));
        EnumMap<Perm, Integer> counts = new EnumMap<>(Perm.class);
        for (Perm p : a) counts.merge(p, 1, Integer::sum);
        for (Perm p : b) counts.merge(p, 1, Integer::sum);
        System.out.println("counts=" + counts);
    }
}
`,
      hints: ["EnumSet.copyOf then addAll/retainAll/removeAll — the set algebra on a bit vector.", "An EnumMap iterates in constant order too, so its toString is stable."],
      cases: [
        { stdin: "WRITE READ\nREAD EXEC\n", expected: "union=[READ, WRITE, EXEC]\nintersection=[READ]\nonlyA=[WRITE]\nmissingFromA=[EXEC, ADMIN]\ncounts={READ=2, WRITE=1, EXEC=1}\n" },
        { stdin: "-\nADMIN\n", expected: "union=[ADMIN]\nintersection=[]\nonlyA=[]\nmissingFromA=[READ, WRITE, EXEC, ADMIN]\ncounts={ADMIN=1}\n" },
        { stdin: "ADMIN EXEC WRITE READ\nREAD\n", expected: "union=[READ, WRITE, EXEC, ADMIN]\nintersection=[READ]\nonlyA=[WRITE, EXEC, ADMIN]\nmissingFromA=[]\ncounts={READ=2, WRITE=1, EXEC=1, ADMIN=1}\n", hidden: true },
      ],
    },
  ],
  records: [
    {
      title: "Rational numbers as records",
      prompt: `Write \`record Rational(long num, long den)\` whose **compact constructor** rejects a zero denominator (\`IllegalArgumentException\`), moves any sign to the numerator and reduces by the gcd — so \`new Rational(2, -4)\` becomes \`-1/2\`. Add \`plus\` and \`times\` returning new records, and \`toString\` as \`num/den\` (just \`num\` when \`den == 1\`). Read \`n\` lines \`a b op c d\` and print \`a/b op c/d = <result>\`; record equality then works by value: also print \`equal=<result.equals(new Rational(…))>\` where the second is the same fraction unreduced, given on the line as \`e f\`.

Example: \`1 2 + 1 3 5 6\` (one line, \`n = 1\`) →
\`\`\`
1/2 + 1/3 = 5/6 equal=true
\`\`\``,
      starter: String.raw`import java.util.*;

record Rational(long num, long den) {
    Rational {
        // TODO: validate, normalise sign, reduce
    }
    Rational plus(Rational o) { /* TODO */ return this; }
    Rational times(Rational o) { /* TODO */ return this; }
    @Override public String toString() { return den == 1 ? String.valueOf(num) : num + "/" + den; }
    static long gcd(long a, long b) { return b == 0 ? Math.abs(a) : gcd(b, a % b); }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            long a = in.nextLong(), b = in.nextLong();
            String op = in.next();
            long c = in.nextLong(), d = in.nextLong();
            long e = in.nextLong(), f = in.nextLong();
            // TODO
        }
    }
}
`,
      solution: String.raw`import java.util.*;

record Rational(long num, long den) {
    Rational {
        if (den == 0) throw new IllegalArgumentException("zero denominator");
        if (den < 0) { num = -num; den = -den; }
        long g = gcd(num, den);
        if (g > 1) { num /= g; den /= g; }
    }
    Rational plus(Rational o) { return new Rational(num * o.den + o.num * den, den * o.den); }
    Rational times(Rational o) { return new Rational(num * o.num, den * o.den); }
    @Override public String toString() { return den == 1 ? String.valueOf(num) : num + "/" + den; }
    static long gcd(long a, long b) { return b == 0 ? Math.abs(a) : gcd(b, a % b); }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            long a = in.nextLong(), b = in.nextLong();
            String op = in.next();
            long c = in.nextLong(), d = in.nextLong();
            long e = in.nextLong(), f = in.nextLong();
            Rational x = new Rational(a, b), y = new Rational(c, d);
            Rational r = op.equals("+") ? x.plus(y) : x.times(y);
            System.out.println(x + " " + op + " " + y + " = " + r + " equal=" + r.equals(new Rational(e, f)));
        }
    }
}
`,
      hints: ["In a compact constructor you reassign the parameters; the fields are set from them afterwards.", "Because every Rational is reduced on construction, the generated equals compares canonical forms."],
      cases: [
        { stdin: "1\n1 2 + 1 3 5 6\n", expected: "1/2 + 1/3 = 5/6 equal=true\n" },
        { stdin: "2\n2 -4 * 3 1 -3 2\n1 3 + 2 3 2 2\n", expected: "-1/2 * 3 = -3/2 equal=true\n1/3 + 2/3 = 1 equal=true\n" },
        { stdin: "1\n6 8 + 1 4 4 4\n", expected: "3/4 + 1/4 = 1 equal=true\n", hidden: true },
      ],
    },
  ],
  "records-in-practice": [
    {
      title: "Records as map keys",
      prompt: `Declare \`record Key(String city, int year)\`. Read \`n\` lines \`<city> <year> <amount>\` and total the amounts per \`(city, year)\` in a \`TreeMap<Key, Long>\` ordered by city then year (\`Comparator.comparing(Key::city).thenComparingInt(Key::year)\`). Print \`<city> <year>: <total>\` per key, then \`keys=<count>\`. Records make correct, immutable composite keys with no code of your own.

Example: \`4\` then \`oslo 2023 10\`, \`rome 2023 5\`, \`oslo 2023 7\`, \`oslo 2022 1\` →
\`\`\`
oslo 2022: 1
oslo 2023: 17
rome 2023: 5
keys=3
\`\`\``,
      starter: String.raw`import java.util.*;

record Key(String city, int year) { }

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        TreeMap<Key, Long> totals = new TreeMap<>(Comparator.comparing(Key::city).thenComparingInt(Key::year));
        // TODO
    }
}
`,
      solution: String.raw`import java.util.*;

record Key(String city, int year) { }

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        TreeMap<Key, Long> totals = new TreeMap<>(Comparator.comparing(Key::city).thenComparingInt(Key::year));
        for (int i = 0; i < n; i++) {
            Key k = new Key(in.next(), in.nextInt());
            totals.merge(k, in.nextLong(), Long::sum);
        }
        totals.forEach((k, v) -> System.out.println(k.city() + " " + k.year() + ": " + v));
        System.out.println("keys=" + totals.size());
    }
}
`,
      hints: ["Two Key records with the same city and year are equal — merge finds the existing entry.", "A TreeMap needs an order; the record has no natural one, so hand it a Comparator."],
      cases: [
        { stdin: "4\noslo 2023 10\nrome 2023 5\noslo 2023 7\noslo 2022 1\n", expected: "oslo 2022: 1\noslo 2023: 17\nrome 2023: 5\nkeys=3\n" },
        { stdin: "1\npune 2024 100\n", expected: "pune 2024: 100\nkeys=1\n" },
        { stdin: "3\nb 1 1\na 2 2\na 1 3\n", expected: "a 1: 3\na 2: 2\nb 1: 1\nkeys=3\n", hidden: true },
      ],
    },
  ],
  "enums-records-checkpoint": [
    {
      title: "A deck of cards",
      prompt: `Declare \`enum Suit { CLUBS, DIAMONDS, HEARTS, SPADES }\`, \`enum Rank { TWO, THREE, …, TEN, JACK, QUEEN, KING, ACE }\` and \`record Card(Rank rank, Suit suit)\`. Read \`n\` cards as \`<RANK> <SUIT>\`. Print them sorted by rank then suit (both by ordinal) as \`RANK of SUIT\`, then \`highest=<the highest card>\`, \`flush=<all the same suit>\`, and \`pairs=<how many ranks appear at least twice>\` using an \`EnumMap<Rank, Integer>\`.

Example: \`3\` then \`ACE SPADES\`, \`TWO HEARTS\`, \`TWO CLUBS\` →
\`\`\`
TWO of CLUBS
TWO of HEARTS
ACE of SPADES
highest=ACE of SPADES
flush=false
pairs=1
\`\`\``,
      starter: String.raw`import java.util.*;

enum Suit { CLUBS, DIAMONDS, HEARTS, SPADES }
enum Rank { TWO, THREE, FOUR, FIVE, SIX, SEVEN, EIGHT, NINE, TEN, JACK, QUEEN, KING, ACE }
record Card(Rank rank, Suit suit) {
    @Override public String toString() { return rank + " of " + suit; }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<Card> hand = new ArrayList<>();
        for (int i = 0; i < n; i++) hand.add(new Card(Rank.valueOf(in.next()), Suit.valueOf(in.next())));
        // TODO
    }
}
`,
      solution: String.raw`import java.util.*;

enum Suit { CLUBS, DIAMONDS, HEARTS, SPADES }
enum Rank { TWO, THREE, FOUR, FIVE, SIX, SEVEN, EIGHT, NINE, TEN, JACK, QUEEN, KING, ACE }
record Card(Rank rank, Suit suit) {
    @Override public String toString() { return rank + " of " + suit; }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<Card> hand = new ArrayList<>();
        for (int i = 0; i < n; i++) hand.add(new Card(Rank.valueOf(in.next()), Suit.valueOf(in.next())));
        hand.sort(Comparator.comparing(Card::rank).thenComparing(Card::suit));
        for (Card c : hand) System.out.println(c);
        System.out.println("highest=" + hand.get(hand.size() - 1));
        boolean flush = hand.stream().map(Card::suit).distinct().count() == 1;
        System.out.println("flush=" + flush);
        EnumMap<Rank, Integer> counts = new EnumMap<>(Rank.class);
        for (Card c : hand) counts.merge(c.rank(), 1, Integer::sum);
        long pairs = counts.values().stream().filter(v -> v >= 2).count();
        System.out.println("pairs=" + pairs);
    }
}
`,
      hints: ["Enums are Comparable by ordinal, so Comparator.comparing(Card::rank) needs nothing more.", "The last card after sorting is the highest."],
      cases: [
        { stdin: "3\nACE SPADES\nTWO HEARTS\nTWO CLUBS\n", expected: "TWO of CLUBS\nTWO of HEARTS\nACE of SPADES\nhighest=ACE of SPADES\nflush=false\npairs=1\n" },
        { stdin: "2\nKING HEARTS\nTEN HEARTS\n", expected: "TEN of HEARTS\nKING of HEARTS\nhighest=KING of HEARTS\nflush=true\npairs=0\n" },
        { stdin: "4\nFIVE CLUBS\nFIVE DIAMONDS\nNINE SPADES\nNINE CLUBS\n", expected: "FIVE of CLUBS\nFIVE of DIAMONDS\nNINE of CLUBS\nNINE of SPADES\nhighest=NINE of SPADES\nflush=false\npairs=2\n", hidden: true },
      ],
    },
  ],
};

export default more;
