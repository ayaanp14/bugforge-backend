import type { ExerciseSource } from "../../dsl.js";

/** A second program per lesson (a third for the checkpoint) — see defineModule's `extras`. */
const more: Record<string, ExerciseSource[]> = {
  "defining-methods": [
    {
      title: "gcd, lcm and a helper for each",
      prompt: `Write \`static long gcd(long a, long b)\` (Euclid), \`static long lcm(long a, long b)\` (\`a / gcd * b\` — divide first to avoid overflow) and \`static boolean coprime(long a, long b)\`. Read an integer \`n\` and \`n\` pairs; print \`gcd(a,b)=<g> lcm(a,b)=<l> coprime=<true|false>\` for each. Every method has one job and a name that says it.

Example: \`2\` then \`12 18\`, \`7 20\` →
\`\`\`
gcd(12,18)=6 lcm(12,18)=36 coprime=false
gcd(7,20)=1 lcm(7,20)=140 coprime=true
\`\`\``,
      starter: String.raw`import java.util.Scanner;

public class Main {
    static long gcd(long a, long b) {
        // TODO
        return 0;
    }
    static long lcm(long a, long b) {
        // TODO
        return 0;
    }
    static boolean coprime(long a, long b) {
        // TODO
        return false;
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            long a = in.nextLong(), b = in.nextLong();
            System.out.println("gcd(" + a + "," + b + ")=" + gcd(a, b) + " lcm(" + a + "," + b + ")=" + lcm(a, b) + " coprime=" + coprime(a, b));
        }
    }
}
`,
      solution: String.raw`import java.util.Scanner;

public class Main {
    static long gcd(long a, long b) {
        while (b != 0) {
            long t = a % b;
            a = b;
            b = t;
        }
        return a;
    }
    static long lcm(long a, long b) {
        return a / gcd(a, b) * b;
    }
    static boolean coprime(long a, long b) {
        return gcd(a, b) == 1;
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            long a = in.nextLong(), b = in.nextLong();
            System.out.println("gcd(" + a + "," + b + ")=" + gcd(a, b) + " lcm(" + a + "," + b + ")=" + lcm(a, b) + " coprime=" + coprime(a, b));
        }
    }
}
`,
      hints: ["Euclid: replace (a, b) by (b, a % b) until b is 0.", "lcm and coprime are one-liners that call gcd — that is what helpers are for."],
      cases: [
        { stdin: "2\n12 18\n7 20\n", expected: "gcd(12,18)=6 lcm(12,18)=36 coprime=false\ngcd(7,20)=1 lcm(7,20)=140 coprime=true\n" },
        { stdin: "1\n100 10\n", expected: "gcd(100,10)=10 lcm(100,10)=100 coprime=false\n" },
        { stdin: "2\n1000000007 1000000009\n9 9\n", expected: "gcd(1000000007,1000000009)=1 lcm(1000000007,1000000009)=1000000016000000063 coprime=true\ngcd(9,9)=9 lcm(9,9)=9 coprime=false\n", hidden: true },
      ],
    },
  ],
  "pass-by-value": [
    {
      title: "Mutate or rebind?",
      prompt: `Write three methods and call each from \`main\`: \`static void fill(int[] a, int v)\` sets every element to \`v\`; \`static void replace(int[] a, int v)\` assigns \`a = new int[]{v}\` (a rebind); \`static void append(StringBuilder sb, String s)\` appends; and \`static void shout(String s)\` assigns \`s = s.toUpperCase()\`. Read \`v\` and a word \`w\`; start with \`int[] a = {1, 2, 3}\` and \`StringBuilder sb = new StringBuilder(w)\`. After each call print what the **caller** sees.

Example: \`9 hi\` →
\`\`\`
after fill: [9, 9, 9]
after replace: [9, 9, 9]
after append: hi!
after shout: hi
\`\`\``,
      starter: String.raw`import java.util.*;

public class Main {
    static void fill(int[] a, int v) { /* TODO */ }
    static void replace(int[] a, int v) { /* TODO */ }
    static void append(StringBuilder sb, String s) { /* TODO */ }
    static void shout(String s) { /* TODO */ }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int v = in.nextInt();
        String w = in.next();
        int[] a = {1, 2, 3};
        StringBuilder sb = new StringBuilder(w);
        // TODO: call and print
    }
}
`,
      solution: String.raw`import java.util.*;

public class Main {
    static void fill(int[] a, int v) { Arrays.fill(a, v); }
    static void replace(int[] a, int v) { a = new int[]{v}; }
    static void append(StringBuilder sb, String s) { sb.append(s); }
    static void shout(String s) { s = s.toUpperCase(); }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int v = in.nextInt();
        String w = in.next();
        int[] a = {1, 2, 3};
        StringBuilder sb = new StringBuilder(w);
        fill(a, v);
        System.out.println("after fill: " + Arrays.toString(a));
        replace(a, v);
        System.out.println("after replace: " + Arrays.toString(a));
        append(sb, "!");
        System.out.println("after append: " + sb);
        shout(w);
        System.out.println("after shout: " + w);
    }
}
`,
      hints: ["A method can change the object its parameter points to, never the caller's variable.", "String is immutable, so shout cannot even mutate — the reassignment is local."],
      cases: [
        { stdin: "9 hi\n", expected: "after fill: [9, 9, 9]\nafter replace: [9, 9, 9]\nafter append: hi!\nafter shout: hi\n" },
        { stdin: "0 Java\n", expected: "after fill: [0, 0, 0]\nafter replace: [0, 0, 0]\nafter append: Java!\nafter shout: Java\n" },
        { stdin: "-5 x\n", expected: "after fill: [-5, -5, -5]\nafter replace: [-5, -5, -5]\nafter append: x!\nafter shout: x\n", hidden: true },
      ],
    },
  ],
  overloading: [
    {
      title: "Which overload?",
      prompt: `Define four overloads named \`describe\`: \`describe(int)\`, \`describe(long)\`, \`describe(double)\` and \`describe(Object)\`, each returning its own name (\`"int"\`, \`"long"\`, \`"double"\`, \`"Object"\`). Read \`n\` tokens of the form \`<kind>:<value>\` where kind is \`int\`, \`long\`, \`double\`, \`char\`, \`short\`, \`Integer\` or \`String\`; declare a variable of exactly that type, call \`describe\` with it, and print \`<token> -> <chosen overload>\`. Widening beats boxing; a \`char\` or \`short\` widens to \`int\`; an \`Integer\` is an \`Object\`.

Example: \`4\` then \`int:5 char:a Integer:5 short:7\` →
\`\`\`
int:5 -> int
char:a -> int
Integer:5 -> Object
short:7 -> int
\`\`\``,
      starter: String.raw`import java.util.Scanner;

public class Main {
    static String describe(int x) { return "int"; }
    static String describe(long x) { return "long"; }
    static String describe(double x) { return "double"; }
    static String describe(Object x) { return "Object"; }

    static String pick(String kind, String value) {
        switch (kind) {
            case "int": { int v = Integer.parseInt(value); return describe(v); }
            // TODO: long, double, char, short, Integer, String
            default: return "?";
        }
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            String token = in.next();
            String[] parts = token.split(":");
            System.out.println(token + " -> " + pick(parts[0], parts[1]));
        }
    }
}
`,
      solution: String.raw`import java.util.Scanner;

public class Main {
    static String describe(int x) { return "int"; }
    static String describe(long x) { return "long"; }
    static String describe(double x) { return "double"; }
    static String describe(Object x) { return "Object"; }

    static String pick(String kind, String value) {
        switch (kind) {
            case "int": { int v = Integer.parseInt(value); return describe(v); }
            case "long": { long v = Long.parseLong(value); return describe(v); }
            case "double": { double v = Double.parseDouble(value); return describe(v); }
            case "char": { char v = value.charAt(0); return describe(v); }
            case "short": { short v = Short.parseShort(value); return describe(v); }
            case "Integer": { Integer v = Integer.valueOf(value); return describe(v); }
            case "String": { String v = value; return describe(v); }
            default: return "?";
        }
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            String token = in.next();
            String[] parts = token.split(":");
            System.out.println(token + " -> " + pick(parts[0], parts[1]));
        }
    }
}
`,
      hints: ["Resolution happens at compile time on the declared type of the argument variable.", "Phase 1 (widening only) wins before phase 2 (boxing): char → int beats char → Character → Object."],
      cases: [
        { stdin: "4\nint:5 char:a Integer:5 short:7\n", expected: "int:5 -> int\nchar:a -> int\nInteger:5 -> Object\nshort:7 -> int\n" },
        { stdin: "3\nlong:9 double:2.5 String:hey\n", expected: "long:9 -> long\ndouble:2.5 -> double\nString:hey -> Object\n" },
        { stdin: "2\nchar:Z int:-1\n", expected: "char:Z -> int\nint:-1 -> int\n", hidden: true },
      ],
    },
  ],
  varargs: [
    {
      title: "Varargs toolkit",
      prompt: `Write \`static String join(String sep, String... parts)\` and \`static int max(int first, int... rest)\` (the required first parameter guarantees at least one value). Read an integer \`n\` and \`n\` commands: \`join <sep> <k> <k words>\` prints the words joined with \`sep\`; \`max <k> <k ints>\` prints the largest. Call \`join\` with the words spread from an array and \`max\` with the first value split off — that is what varargs make natural.

Example: \`2\` then \`join - 3 a b c\`, \`max 4 3 9 2 7\` →
\`\`\`
a-b-c
9
\`\`\``,
      starter: String.raw`import java.util.*;

public class Main {
    static String join(String sep, String... parts) {
        // TODO
        return "";
    }
    static int max(int first, int... rest) {
        // TODO
        return first;
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            String cmd = in.next();
            // TODO
        }
    }
}
`,
      solution: String.raw`import java.util.*;

public class Main {
    static String join(String sep, String... parts) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < parts.length; i++) {
            if (i > 0) sb.append(sep);
            sb.append(parts[i]);
        }
        return sb.toString();
    }
    static int max(int first, int... rest) {
        int m = first;
        for (int x : rest) m = Math.max(m, x);
        return m;
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            String cmd = in.next();
            if (cmd.equals("join")) {
                String sep = in.next();
                int k = in.nextInt();
                String[] words = new String[k];
                for (int j = 0; j < k; j++) words[j] = in.next();
                System.out.println(join(sep, words));
            } else {
                int k = in.nextInt();
                int first = in.nextInt();
                int[] rest = new int[k - 1];
                for (int j = 0; j < k - 1; j++) rest[j] = in.nextInt();
                System.out.println(max(first, rest));
            }
        }
    }
}
`,
      hints: ["Inside the method a varargs parameter is just an array — length, indexing, for-each all work.", "An array can be passed where varargs are expected; a zero-length array means 'no extra values'."],
      cases: [
        { stdin: "2\njoin - 3 a b c\nmax 4 3 9 2 7\n", expected: "a-b-c\n9\n" },
        { stdin: "2\njoin , 1 solo\nmax 1 -4\n", expected: "solo\n-4\n" },
        { stdin: "2\njoin :: 2 x y\nmax 3 5 5 5\n", expected: "x::y\n5\n", hidden: true },
      ],
    },
  ],
  recursion: [
    {
      title: "Towers of Hanoi",
      prompt: `Read \`n\` (\`1 ≤ n ≤ 8\`). Print the moves that transfer \`n\` discs from peg \`A\` to peg \`C\` using peg \`B\`, one per line as \`move disc <k> from <X> to <Y>\` (disc 1 is the smallest), in the order the classic recursion produces them, then \`moves=<total>\`. The recursion: move \`n-1\` discs to the spare peg, move disc \`n\`, move the \`n-1\` back on top.

Example: \`2\` →
\`\`\`
move disc 1 from A to B
move disc 2 from A to C
move disc 1 from B to C
moves=3
\`\`\``,
      starter: String.raw`import java.util.Scanner;

public class Main {
    static int moves = 0;

    static void hanoi(int n, char from, char to, char via) {
        // TODO
    }

    public static void main(String[] args) {
        int n = new Scanner(System.in).nextInt();
        hanoi(n, 'A', 'C', 'B');
        System.out.println("moves=" + moves);
    }
}
`,
      solution: String.raw`import java.util.Scanner;

public class Main {
    static int moves = 0;

    static void hanoi(int n, char from, char to, char via) {
        if (n == 0) return;
        hanoi(n - 1, from, via, to);
        System.out.println("move disc " + n + " from " + from + " to " + to);
        moves++;
        hanoi(n - 1, via, to, from);
    }

    public static void main(String[] args) {
        int n = new Scanner(System.in).nextInt();
        hanoi(n, 'A', 'C', 'B');
        System.out.println("moves=" + moves);
    }
}
`,
      hints: ["The base case is n == 0: nothing to move.", "The spare peg swaps roles between the two recursive calls."],
      cases: [
        { stdin: "2\n", expected: "move disc 1 from A to B\nmove disc 2 from A to C\nmove disc 1 from B to C\nmoves=3\n" },
        { stdin: "1\n", expected: "move disc 1 from A to C\nmoves=1\n" },
        { stdin: "3\n", expected: "move disc 1 from A to C\nmove disc 2 from A to B\nmove disc 1 from C to B\nmove disc 3 from A to C\nmove disc 1 from B to A\nmove disc 2 from B to C\nmove disc 1 from A to C\nmoves=7\n", hidden: true },
      ],
    },
  ],
  "scope-and-lifetime": [
    {
      title: "Ids that survive the call",
      prompt: `A \`static int nextId\` field lives for the whole program; a local lives for one call. Write \`static int issue()\` that returns \`nextId++\` (ids start at 1) and \`static String label(String kind)\` that declares a **local** \`count\` starting at 0, increments it, and returns \`kind + "#" + issue() + " (local count " + count + ")"\`. Read \`n\` kinds and print \`label(kind)\` for each, then \`issued=<nextId - 1>\`. The local count is 1 every time; the static id keeps climbing.

Example: \`3\` then \`ticket ticket badge\` →
\`\`\`
ticket#1 (local count 1)
ticket#2 (local count 1)
badge#3 (local count 1)
issued=3
\`\`\``,
      starter: String.raw`import java.util.Scanner;

public class Main {
    static int nextId = 1;

    static int issue() {
        // TODO
        return 0;
    }

    static String label(String kind) {
        // TODO: a local count that is fresh on every call
        return kind;
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) System.out.println(label(in.next()));
        System.out.println("issued=" + (nextId - 1));
    }
}
`,
      solution: String.raw`import java.util.Scanner;

public class Main {
    static int nextId = 1;

    static int issue() {
        return nextId++;
    }

    static String label(String kind) {
        int count = 0;
        count++;
        return kind + "#" + issue() + " (local count " + count + ")";
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) System.out.println(label(in.next()));
        System.out.println("issued=" + (nextId - 1));
    }
}
`,
      hints: ["nextId++ returns the old value and then increments — exactly 'issue this id, move to the next'.", "A local variable is created when the method is entered and discarded when it returns; it cannot remember anything."],
      cases: [
        { stdin: "3\nticket ticket badge\n", expected: "ticket#1 (local count 1)\nticket#2 (local count 1)\nbadge#3 (local count 1)\nissued=3\n" },
        { stdin: "1\npass\n", expected: "pass#1 (local count 1)\nissued=1\n" },
        { stdin: "0\n", expected: "issued=0\n", hidden: true },
      ],
    },
  ],
  "methods-checkpoint": [
    {
      title: "Every subset",
      prompt: `Read an integer \`n\` and \`n\` distinct words. Print every subset of the words, one per line, as the words joined by spaces (the empty subset prints as \`{}\`), in the order produced by the recursion "for each word, first leave it out, then take it" — so the empty set comes first and the full set last. Finish with \`subsets=<2^n>\`.

Example: \`2\` then \`a b\` →
\`\`\`
{}
b
a
a b
subsets=4
\`\`\``,
      starter: String.raw`import java.util.*;

public class Main {
    static String[] words;
    static int count = 0;

    static void subsets(int i, List<String> chosen) {
        // TODO
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        words = new String[n];
        for (int i = 0; i < n; i++) words[i] = in.next();
        subsets(0, new ArrayList<>());
        System.out.println("subsets=" + count);
    }
}
`,
      solution: String.raw`import java.util.*;

public class Main {
    static String[] words;
    static int count = 0;

    static void subsets(int i, List<String> chosen) {
        if (i == words.length) {
            System.out.println(chosen.isEmpty() ? "{}" : String.join(" ", chosen));
            count++;
            return;
        }
        subsets(i + 1, chosen);                 // leave words[i] out
        chosen.add(words[i]);                   // take it
        subsets(i + 1, chosen);
        chosen.remove(chosen.size() - 1);       // undo, so the caller's list is unchanged
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        words = new String[n];
        for (int i = 0; i < n; i++) words[i] = in.next();
        subsets(0, new ArrayList<>());
        System.out.println("subsets=" + count);
    }
}
`,
      hints: ["Two recursive calls per word: without it, then with it.", "Remove the word after the second call — backtracking restores the shared list."],
      cases: [
        { stdin: "2\na b\n", expected: "{}\nb\na\na b\nsubsets=4\n" },
        { stdin: "0\n", expected: "{}\nsubsets=1\n" },
        { stdin: "3\nx y z\n", expected: "{}\nz\ny\ny z\nx\nx z\nx y\nx y z\nsubsets=8\n", hidden: true },
      ],
    },
  ],
};

export default more;
