import { defineModule } from "../../dsl.js";
import more from "./more-exercises.js";

const IO = String.raw`import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringBuilder out = new StringBuilder();
        // TODO
        System.out.print(out);
    }
}
`;

export default defineModule(import.meta.url, {
  slug: "arrays",
  title: "Arrays",
  blurb: "Fixed-size typed arrays, 2D and jagged arrays, the Arrays utility class, aliasing versus copying, and the in-place patterns.",
  icon: "grid",
  overview: `Arrays are Java's most primitive data structure and the one under every other collection: fixed length, one element type, zero-based, bounds-checked, contiguous. Everything about them follows from one fact — an array is an object and an array variable is a reference.

This module builds up from that fact: creation and indexing, arrays of arrays (and why 2D copies are shallow), the Arrays class that supplies sorting, searching, copying and printing, the aliasing and defensive-copy rules that keep state safe, and the in-place patterns — reverse, rotate, count, prefix sums, two pointers — that interview problems are made of.

By the end you handle arrays fluently and safely, and recognise the standard patterns inside larger problems.`,
  lessons: [
    {
      slug: "array-basics",
      file: "01-array-basics.md",
      exercises: [
        {
          title: "Fill and report",
          prompt: `Read an integer \`n\`, then \`n\` integers into an \`int[]\`. Print three lines: the array reversed (space-separated), \`sum=<total>\`, and \`evens=<count of even values>\`. Use the array's \`length\` and index loops.

For \`n = 0\` the first line is empty.

Example: \`4\` then \`1 2 3 4\` →
\`\`\`
4 3 2 1
sum=10
evens=2
\`\`\``,
          starter: IO,
          solution: String.raw`import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        int[] a = new int[n];
        for (int i = 0; i < n; i++) a[i] = in.nextInt();

        StringBuilder out = new StringBuilder();
        for (int i = a.length - 1; i >= 0; i--) {
            if (i < a.length - 1) out.append(' ');
            out.append(a[i]);
        }
        out.append('\n');
        long sum = 0;
        int evens = 0;
        for (int v : a) {
            sum += v;
            if (v % 2 == 0) evens++;
        }
        out.append("sum=").append(sum).append('\n');
        out.append("evens=").append(evens).append('\n');
        System.out.print(out);
    }
}
`,
          hints: ["The last index is a.length - 1; count down to 0.", "Use a long for the sum."],
          cases: [
            { stdin: "4\n1 2 3 4\n", expected: "4 3 2 1\nsum=10\nevens=2\n" },
            { stdin: "0\n", expected: "\nsum=0\nevens=0\n" },
            { stdin: "3\n-2 0 7\n", expected: "7 0 -2\nsum=5\nevens=2\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does `new String[3]` contain immediately after creation?",
          options: ["Three empty strings", "Three nulls", "Nothing — it must be initialised first", "Three spaces"],
          answer: 1,
          explanation: "Reference-type arrays default every slot to `null`. Calling a method on an element before assigning it throws `NullPointerException`.",
        },
        {
          prompt: "`int[] a = {1, 2, 3}; a[3]` results in…",
          options: ["0", "`ArrayIndexOutOfBoundsException`", "3", "null"],
          answer: 1,
          explanation: "Valid indices are 0 through `length - 1`. Every access is bounds-checked at run time.",
        },
        {
          prompt: "Which is correct?",
          options: ["`a.length()`", "`a.length`", "`a.size()`", "`length(a)`"],
          answer: 1,
          explanation: "An array's length is a `final` field. `String.length()` and `List.size()` are methods — a favourite trick question.",
        },
        {
          prompt: "`int[] a = {1}; int[] b = {1}; a == b` is…",
          options: ["`true`", "`false` — different array objects; use `Arrays.equals`", "Compile error", "`true` only for primitives"],
          answer: 1,
          explanation: "Arrays are objects and `==` compares references. `a.equals(b)` is the same identity test; `Arrays.equals(a, b)` compares contents.",
        },
        {
          prompt: "Can an array's length change after creation?",
          options: ["Yes, with `a.length = 10`", "Yes, with `a.resize(10)`", "No — create a new array and copy", "Only for object arrays"],
          answer: 2,
          explanation: "Length is fixed at `new`. `Arrays.copyOf(a, newLength)` creates the bigger array; `ArrayList` automates this.",
        },
      ],
    },
    {
      slug: "multidimensional",
      file: "02-multidimensional.md",
      exercises: [
        {
          title: "Row and column sums",
          prompt: `Read integers \`R\` and \`C\`, then an \`R × C\` grid of integers. Print \`R\` lines \`row <i>=<sum>\`, then \`C\` lines \`col <j>=<sum>\`, then \`diag=<sum of cells where row == col>\`.

Example: \`2 3\` then \`1 2 3\` / \`4 5 6\` →
\`\`\`
row 0=6
row 1=15
col 0=5
col 1=7
col 2=9
diag=6
\`\`\``,
          starter: IO,
          solution: String.raw`import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        Scanner in = new Scanner(System.in);
        int r = in.nextInt(), c = in.nextInt();
        long[][] g = new long[r][c];
        for (int i = 0; i < r; i++)
            for (int j = 0; j < c; j++)
                g[i][j] = in.nextLong();

        StringBuilder out = new StringBuilder();
        long[] col = new long[c];
        long diag = 0;
        for (int i = 0; i < r; i++) {
            long row = 0;
            for (int j = 0; j < c; j++) {
                row += g[i][j];
                col[j] += g[i][j];
                if (i == j) diag += g[i][j];
            }
            out.append("row ").append(i).append('=').append(row).append('\n');
        }
        for (int j = 0; j < c; j++) out.append("col ").append(j).append('=').append(col[j]).append('\n');
        out.append("diag=").append(diag).append('\n');
        System.out.print(out);
    }
}
`,
          hints: ["Accumulate column sums into a col[] array while walking the rows.", "The diagonal exists only where the row and column indices are equal — fine for non-square grids."],
          cases: [
            { stdin: "2 3\n1 2 3\n4 5 6\n", expected: "row 0=6\nrow 1=15\ncol 0=5\ncol 1=7\ncol 2=9\ndiag=6\n" },
            { stdin: "3 1\n5\n-5\n10\n", expected: "row 0=5\nrow 1=-5\nrow 2=10\ncol 0=10\ndiag=5\n" },
            { stdin: "2 2\n1 1\n1 1\n", expected: "row 0=2\nrow 1=2\ncol 0=2\ncol 1=2\ndiag=2\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "How many array objects does `new int[3][4]` allocate?",
          options: ["1", "3", "4", "12"],
          answer: 2,
          explanation: "One outer `int[3]` plus three inner `int[4]` rows. There is no single 12-element block.",
        },
        {
          prompt: "`int[][] j = new int[3][];` — what is `j[0]`?",
          options: ["An empty array", "`null`", "`new int[3]`", "Compile error"],
          answer: 1,
          explanation: "Omitting the inner dimension creates only the outer array; each row must be created separately, and rows may have different lengths.",
        },
        {
          prompt: "`int[][] b = a.clone(); b[0][0] = 9;` — effect on `a`?",
          options: ["None", "`a[0][0]` is also 9 — the rows are shared", "`a` is null", "Compile error"],
          answer: 1,
          explanation: "`clone` copies the outer array's references. Deep-copy by cloning each row.",
        },
        {
          prompt: "How do you print a 2D array's contents?",
          options: ["`System.out.println(grid)`", "`Arrays.toString(grid)`", "`Arrays.deepToString(grid)`", "`grid.toString()`"],
          answer: 2,
          explanation: "`toString` on the outer array prints row references like `[I@1b6d`; `deepToString` recurses into the rows.",
        },
        {
          prompt: "The width of row `r` in a possibly jagged `int[][] g` is…",
          options: ["`g.length`", "`g[0].length`", "`g[r].length`", "`g.width`"],
          answer: 2,
          explanation: "Each row is its own array with its own length. `g[0].length` is only the width if the grid is rectangular.",
        },
      ],
    },
    {
      slug: "arrays-utility",
      file: "03-arrays-utility.md",
      exercises: [
        {
          title: "Sort, search, slice",
          prompt: `Read an integer \`n\`, then \`n\` integers, then an integer \`q\` and \`q\` query values. Sort the array with \`Arrays.sort\` and print it with \`Arrays.toString\`. For each query print \`<value> at <index>\` if \`Arrays.binarySearch\` finds it, otherwise \`<value> insert at <position>\` where \`position\` is decoded from the negative return value. Finally print the middle third of the sorted array (\`Arrays.copyOfRange\` from \`n/3\` to \`2n/3\`) with \`Arrays.toString\`.

Example: \`6\` then \`5 3 9 1 7 3\`, \`2\` then \`7 4\` →
\`\`\`
[1, 3, 3, 5, 7, 9]
7 at 4
4 insert at 3
[3, 5]
\`\`\``,
          starter: IO,
          solution: String.raw`import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        int[] a = new int[n];
        for (int i = 0; i < n; i++) a[i] = in.nextInt();
        Arrays.sort(a);
        StringBuilder out = new StringBuilder();
        out.append(Arrays.toString(a)).append('\n');
        int q = in.nextInt();
        for (int i = 0; i < q; i++) {
            int v = in.nextInt();
            int r = Arrays.binarySearch(a, v);
            if (r >= 0) out.append(v).append(" at ").append(r).append('\n');
            else out.append(v).append(" insert at ").append(-(r + 1)).append('\n');
        }
        int[] middle = Arrays.copyOfRange(a, n / 3, 2 * n / 3);
        out.append(Arrays.toString(middle)).append('\n');
        System.out.print(out);
    }
}
`,
          hints: ["A negative binarySearch result r encodes the insertion point as -(r + 1).", "copyOfRange takes [from, to)."],
          cases: [
            { stdin: "6\n5 3 9 1 7 3\n2\n7 4\n", expected: "[1, 3, 3, 5, 7, 9]\n7 at 4\n4 insert at 3\n[3, 5]\n" },
            { stdin: "3\n2 2 2\n1\n0\n", expected: "[2, 2, 2]\n0 insert at 0\n[2]\n" },
            { stdin: "1\n5\n2\n5 6\n", expected: "[5]\n5 at 0\n6 insert at 1\n[]\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`Arrays.binarySearch(a, x)` on an **unsorted** array returns…",
          options: ["The correct index", "−1", "An unspecified result", "Throws"],
          answer: 2,
          explanation: "Binary search assumes sortedness; on unsorted input the answer is meaningless. Sort first.",
        },
        {
          prompt: "How do you sort an `int[]` in descending order?",
          options: ["`Arrays.sort(a, Collections.reverseOrder())`", "`Arrays.sort(a, Comparator.reverseOrder())`", "Sort ascending and read it backwards (or box to `Integer[]`)", "`Arrays.sortDesc(a)`"],
          answer: 2,
          explanation: "Comparators apply to object arrays only. For primitives, reverse after sorting, negate values, or use `Integer[]`.",
        },
        {
          prompt: "`Arrays.asList(new int[]{1, 2, 3}).size()` is…",
          options: ["3", "1 — the `int[]` is a single element", "0", "Compile error"],
          answer: 1,
          explanation: "`asList` takes `T...`; a primitive array is not boxed, so it becomes one element of type `int[]`. Use `Arrays.stream(a).boxed()`.",
        },
        {
          prompt: "`List<String> l = Arrays.asList(\"a\", \"b\"); l.add(\"c\");` throws…",
          options: ["Nothing", "`UnsupportedOperationException` — the list is a fixed-size view", "`IndexOutOfBoundsException`", "`NullPointerException`"],
          answer: 1,
          explanation: "`asList` wraps the array; `set` works but the size cannot change. Wrap in `new ArrayList<>(…)` to get a growable list.",
        },
        {
          prompt: "`System.arraycopy(a, 0, a, 1, a.length - 1)` does what?",
          options: ["Throws because source and destination are the same", "Shifts every element one position to the right, in place, correctly", "Corrupts the array", "Copies nothing"],
          answer: 1,
          explanation: "`arraycopy` handles overlapping ranges as if through a temporary buffer. The last element is overwritten; the first is left as is.",
        },
      ],
    },
    {
      slug: "copying-and-references",
      file: "04-copying-and-references.md",
      exercises: [
        {
          title: "Snapshot versus alias",
          prompt: `Read an integer \`n\` and \`n\` integers into an array \`live\`. Make \`alias = live\` and \`snapshot = live.clone()\`. Then read an integer \`m\` and \`m\` updates \`index value\`, applying each as \`live[index] = value\`. Finally print three lines: \`live=<Arrays.toString(live)>\`, \`alias=<…>\`, \`snapshot=<…>\`, and a fourth line \`same=<alias == live> equal=<Arrays.equals(live, snapshot)>\`.

Example: \`3\` then \`1 2 3\`, \`1\` then \`0 9\` →
\`\`\`
live=[9, 2, 3]
alias=[9, 2, 3]
snapshot=[1, 2, 3]
same=true equal=false
\`\`\``,
          starter: IO,
          solution: String.raw`import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        int[] live = new int[n];
        for (int i = 0; i < n; i++) live[i] = in.nextInt();
        int[] alias = live;
        int[] snapshot = live.clone();
        int m = in.nextInt();
        for (int i = 0; i < m; i++) {
            int index = in.nextInt();
            int value = in.nextInt();
            live[index] = value;
        }
        System.out.println("live=" + Arrays.toString(live));
        System.out.println("alias=" + Arrays.toString(alias));
        System.out.println("snapshot=" + Arrays.toString(snapshot));
        System.out.println("same=" + (alias == live) + " equal=" + Arrays.equals(live, snapshot));
    }
}
`,
          hints: ["Assignment aliases; clone copies.", "Parenthesise (alias == live) inside string concatenation."],
          cases: [
            { stdin: "3\n1 2 3\n1\n0 9\n", expected: "live=[9, 2, 3]\nalias=[9, 2, 3]\nsnapshot=[1, 2, 3]\nsame=true equal=false\n" },
            { stdin: "2\n4 4\n0\n", expected: "live=[4, 4]\nalias=[4, 4]\nsnapshot=[4, 4]\nsame=true equal=true\n" },
            { stdin: "1\n7\n2\n0 8\n0 7\n", expected: "live=[7]\nalias=[7]\nsnapshot=[7]\nsame=true equal=true\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`int[] b = a;` followed by `b[0] = 5` changes `a[0]` because…",
          options: ["Arrays are copied lazily", "`a` and `b` are two references to one array", "`int[]` is a primitive", "It does not change `a[0]`"],
          answer: 1,
          explanation: "Assignment copies the reference. Only `clone`/`copyOf` create a second array.",
        },
        {
          prompt: "`StringBuilder[] c = sbs.clone(); c[0].append(\"!\");` affects `sbs[0]`?",
          options: ["No", "Yes — the copy is shallow; both slots refer to the same builder", "Only if `sbs` is final", "Compile error"],
          answer: 1,
          explanation: "Copying an object array copies references. The elements are shared until you copy them individually.",
        },
        {
          prompt: "Why does a getter return `values.clone()` instead of `values`?",
          options: ["Performance", "So callers cannot mutate the object's internal array", "Because arrays cannot be returned", "To sort it"],
          answer: 1,
          explanation: "This is a defensive copy. Returning the field would let any caller change the object's state from outside.",
        },
        {
          prompt: "Does `final int[] a` prevent `a[0] = 1`?",
          options: ["Yes", "No — `final` fixes the reference, not the elements", "Only for primitives", "Only outside the class"],
          answer: 1,
          explanation: "`final` means `a` cannot be reassigned to another array. The array's contents remain mutable.",
        },
        {
          prompt: "A shallow copy of a `String[]` is safe to share because…",
          options: ["Strings are primitives", "Strings are immutable, so shared elements cannot be changed", "`String[]` is always deep-copied", "It is not safe"],
          answer: 1,
          explanation: "Sharing immutable elements is harmless. Shallow copies are a problem only for mutable element types.",
        },
      ],
    },
    {
      slug: "array-patterns",
      file: "05-array-patterns.md",
      exercises: [
        {
          title: "Rotate, count, prefix",
          prompt: `Read an integer \`n\`, then \`n\` integers in the range 0–9, then an integer \`k\`. Print three lines:

1. The array rotated **right** by \`k\` (k may exceed n), using the three-reversal method, space-separated.
2. \`counts=<c0 c1 … c9>\` — how many times each digit 0–9 appears in the (original) array, using a counting array.
3. \`prefix=<p1 p2 … pn>\` — the running totals of the original array.

Example: \`5\` then \`1 2 3 4 5\`, \`k = 2\` →
\`\`\`
4 5 1 2 3
counts=0 1 1 1 1 1 0 0 0 0
prefix=1 3 6 10 15
\`\`\``,
          starter: String.raw`import java.util.*;

public class Main {
    static void reverse(int[] a, int from, int to) {   // [from, to)
        // TODO
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        int[] a = new int[n];
        for (int i = 0; i < n; i++) a[i] = in.nextInt();
        int k = in.nextInt();
        // TODO
    }
}
`,
          solution: String.raw`import java.util.*;

public class Main {
    static void reverse(int[] a, int from, int to) {
        for (int i = from, j = to - 1; i < j; i++, j--) {
            int t = a[i]; a[i] = a[j]; a[j] = t;
        }
    }

    static String join(int[] a) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < a.length; i++) {
            if (i > 0) sb.append(' ');
            sb.append(a[i]);
        }
        return sb.toString();
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        int[] a = new int[n];
        for (int i = 0; i < n; i++) a[i] = in.nextInt();
        int k = in.nextInt();

        int[] counts = new int[10];
        long[] prefix = new long[n];
        long run = 0;
        for (int i = 0; i < n; i++) {
            counts[a[i]]++;
            run += a[i];
            prefix[i] = run;
        }

        int[] rotated = a.clone();
        if (n > 0) {
            int r = ((k % n) + n) % n;
            reverse(rotated, 0, n);
            reverse(rotated, 0, r);
            reverse(rotated, r, n);
        }

        System.out.println(join(rotated));
        System.out.println("counts=" + join(counts));
        StringBuilder p = new StringBuilder("prefix=");
        for (int i = 0; i < n; i++) {
            if (i > 0) p.append(' ');
            p.append(prefix[i]);
        }
        System.out.println(p);
    }
}
`,
          hints: ["Normalise k with ((k % n) + n) % n before the three reversals.", "counts[a[i]]++ uses the value as the index."],
          cases: [
            { stdin: "5\n1 2 3 4 5\n2\n", expected: "4 5 1 2 3\ncounts=0 1 1 1 1 1 0 0 0 0\nprefix=1 3 6 10 15\n" },
            { stdin: "4\n9 9 0 9\n7\n", expected: "9 0 9 9\ncounts=1 0 0 0 0 0 0 0 0 3\nprefix=9 18 18 27\n" },
            { stdin: "3\n1 2 3\n3\n", expected: "1 2 3\ncounts=0 1 1 1 0 0 0 0 0 0\nprefix=1 3 6\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Rotating an array right by `k` with three reversals is…",
          options: ["O(n) time, O(n) space", "O(n) time, O(1) extra space", "O(k·n) time", "O(n log n)"],
          answer: 1,
          explanation: "Reverse the whole array, then the first k, then the rest — each element moves a constant number of times, in place.",
        },
        {
          prompt: "Why does a prefix-sum array usually have `n + 1` entries?",
          options: ["To store the total twice", "A leading 0 makes `prefix[to] - prefix[from]` work when `from == 0`", "Arrays must be even-length", "For 1-based indexing only"],
          answer: 1,
          explanation: "With `prefix[0] = 0`, any range sum is one subtraction with no special case at the start.",
        },
        {
          prompt: "A counting array `int[26]` indexed by `c - 'a'` is appropriate when…",
          options: ["Values are arbitrary strings", "Values are a small, known range such as lowercase letters", "Values are doubles", "Never — use a map"],
          answer: 1,
          explanation: "Index-as-key counting is the fastest frequency table when the key space is small and dense; a `HashMap` handles the general case.",
        },
        {
          prompt: "In the read/write two-pointer filter, the write index after the loop is…",
          options: ["Always n", "The number of kept elements — the new logical length", "The index of the last removed element", "Undefined"],
          answer: 1,
          explanation: "Every kept element is written at `write++`, so `write` counts the kept elements and marks where the tail begins.",
        },
        {
          prompt: "Kadane's algorithm is seeded with `a[0]` rather than 0 so that…",
          options: ["It runs faster", "An all-negative array yields its largest element, not 0", "It handles empty arrays", "The loop starts at index 0"],
          answer: 1,
          explanation: "With a 0 seed, `best` would never go below 0 and an all-negative input would report a subarray sum of 0 — an empty subarray, which is usually not allowed.",
        },
      ],
    },
    {
      slug: "arrays-checkpoint",
      file: "06-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "Rotate a square matrix",
          prompt: `Read an integer \`n\`, then an \`n × n\` grid of integers. Rotate it 90° clockwise **in place** — transpose (swap across the main diagonal, each pair once), then reverse each row — and print the result, one row per line, values space-separated.

Example: \`3\` then \`1 2 3\` / \`4 5 6\` / \`7 8 9\` →
\`\`\`
7 4 1
8 5 2
9 6 3
\`\`\``,
          starter: IO,
          solution: String.raw`import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        int[][] m = new int[n][n];
        for (int r = 0; r < n; r++)
            for (int c = 0; c < n; c++)
                m[r][c] = in.nextInt();

        for (int r = 0; r < n; r++) {
            for (int c = r + 1; c < n; c++) {
                int t = m[r][c]; m[r][c] = m[c][r]; m[c][r] = t;
            }
        }
        for (int[] row : m) {
            for (int i = 0, j = n - 1; i < j; i++, j--) {
                int t = row[i]; row[i] = row[j]; row[j] = t;
            }
        }

        StringBuilder out = new StringBuilder();
        for (int[] row : m) {
            for (int c = 0; c < n; c++) {
                if (c > 0) out.append(' ');
                out.append(row[c]);
            }
            out.append('\n');
        }
        System.out.print(out);
    }
}
`,
          hints: ["Transpose with the inner loop starting at c = r + 1 so each pair is swapped once.", "Reversing each row after the transpose gives a clockwise rotation."],
          cases: [
            { stdin: "3\n1 2 3\n4 5 6\n7 8 9\n", expected: "7 4 1\n8 5 2\n9 6 3\n" },
            { stdin: "1\n5\n", expected: "5\n" },
            { stdin: "2\n1 2\n3 4\n", expected: "3 1\n4 2\n", hidden: true },
            { stdin: "4\n1 2 3 4\n5 6 7 8\n9 10 11 12\n13 14 15 16\n", expected: "13 9 5 1\n14 10 6 2\n15 11 7 3\n16 12 8 4\n", hidden: true },
          ],
        },
        {
          title: "Range sums with a prefix array",
          prompt: `Read an integer \`n\`, then \`n\` integers (which may be negative and large), then an integer \`q\` and \`q\` queries \`l r\` (0-based, inclusive on both ends). Build a prefix-sum array of \`n + 1\` \`long\`s once and answer every query in O(1). Print one sum per line.

Example: \`5\` then \`1 2 3 4 5\`, \`3\` then \`0 4\`, \`1 3\`, \`2 2\` →
\`\`\`
15
9
3
\`\`\``,
          starter: IO,
          solution: String.raw`import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        String[] t = new String(System.in.readAllBytes()).trim().split("\\s+");
        int p = 0;
        int n = Integer.parseInt(t[p++]);
        long[] prefix = new long[n + 1];
        for (int i = 0; i < n; i++) prefix[i + 1] = prefix[i] + Long.parseLong(t[p++]);
        int q = Integer.parseInt(t[p++]);
        StringBuilder out = new StringBuilder();
        for (int i = 0; i < q; i++) {
            int l = Integer.parseInt(t[p++]);
            int r = Integer.parseInt(t[p++]);
            out.append(prefix[r + 1] - prefix[l]).append('\n');
        }
        System.out.print(out);
    }
}
`,
          hints: ["prefix[i + 1] = prefix[i] + a[i]; the sum of a[l..r] is prefix[r + 1] - prefix[l].", "Use long everywhere — the totals can exceed int."],
          cases: [
            { stdin: "5\n1 2 3 4 5\n3\n0 4\n1 3\n2 2\n", expected: "15\n9\n3\n" },
            { stdin: "3\n2000000000 2000000000 -1\n2\n0 1\n0 2\n", expected: "4000000000\n3999999999\n" },
            { stdin: "1\n-7\n1\n0 0\n", expected: "-7\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`int[] a = new int[5];` — the value of `a[4]` is…",
          options: ["Undefined", "0", "null", "5"],
          answer: 1,
          explanation: "Numeric arrays are zero-filled on creation. Only reference arrays hold nulls.",
        },
        {
          prompt: "`for (int i = 0; i <= a.length; i++) sum += a[i];` fails with…",
          options: ["A compile error", "`ArrayIndexOutOfBoundsException` at the last iteration", "Nothing — it works", "`NullPointerException`"],
          answer: 1,
          explanation: "`a[a.length]` is one past the end. The condition must be `i < a.length`.",
        },
        {
          prompt: "`Object[] o = new String[2]; o[0] = 42;` results in…",
          options: ["Compile error", "`ArrayStoreException` at run time — arrays are covariant but checked on store", "Success", "`ClassCastException`"],
          answer: 1,
          explanation: "The assignment compiles because `String[]` is an `Object[]`; the JVM checks the element's runtime type on every store.",
        },
        {
          prompt: "Which creates a jagged array with rows of lengths 1, 2 and 3?",
          options: ["`new int[3][3]`", "`new int[3][]` then assigning `new int[r + 1]` to each row", "`new int[1][2][3]`", "It is impossible"],
          answer: 1,
          explanation: "Leaving the inner dimension open and creating each row separately gives rows of any lengths.",
        },
        {
          prompt: "`Arrays.deepEquals` is needed for…",
          options: ["Comparing two `int[]`", "Comparing nested arrays such as `int[][]` by contents", "Comparing strings", "Sorting"],
          answer: 1,
          explanation: "`Arrays.equals` on `int[][]` compares the row references. `deepEquals` recurses into the rows.",
        },
        {
          prompt: "`Arrays.fill(grid, new int[4])` on an `int[4][4]` results in…",
          options: ["A zeroed grid of independent rows", "Every row being the **same** array object", "A compile error", "Only row 0 filled"],
          answer: 1,
          explanation: "`fill` stores the one reference in every outer slot. Fill each row separately: `for (int[] row : grid) Arrays.fill(row, v)`.",
        },
        {
          prompt: "`Arrays.binarySearch(sorted, x)` returns −4. Where would `x` be inserted?",
          options: ["Index 4", "Index 3 — the insertion point is `-(r + 1)`", "Index −4", "It is present at 4"],
          answer: 1,
          explanation: "`-(−4 + 1)` = 3. The encoding lets a negative result carry the position too.",
        },
        {
          prompt: "Which produces a growable list from `Integer[] boxed`?",
          options: ["`Arrays.asList(boxed)`", "`new ArrayList<>(Arrays.asList(boxed))`", "`List.of(boxed)`", "`boxed.toList()`"],
          answer: 1,
          explanation: "`asList` and `List.of` give fixed-size/immutable lists. Copying into an `ArrayList` gives one you can add to.",
        },
        {
          prompt: "A constructor stores a caller's `int[]` directly in a field. The risk is…",
          options: ["Memory leak", "The caller can later change the object's state through their own reference", "Compile error", "The array is copied twice"],
          answer: 1,
          explanation: "The field aliases the caller's array. Store `values.clone()` to own the data.",
        },
        {
          prompt: "To sum ranges quickly after O(n) preprocessing, use…",
          options: ["A sorted copy", "A prefix-sum array", "Binary search", "A counting array"],
          answer: 1,
          explanation: "Prefix sums answer any `[l, r]` sum with one subtraction.",
        },
        {
          prompt: "`reverse(a, 0, n); reverse(a, 0, k); reverse(a, k, n);` performs…",
          options: ["A left rotation by k", "A right rotation by k", "A full reversal", "Nothing"],
          answer: 1,
          explanation: "Reverse all, then the first k, then the remainder — the last k elements end up at the front, in order.",
        },
        {
          prompt: "Why prefer `int[]` over `Integer[]` for numeric work?",
          options: ["`Integer[]` cannot be sorted", "Primitives are stored contiguously without per-element objects — smaller and faster", "`int[]` can grow", "No difference"],
          answer: 1,
          explanation: "An `Integer[]` holds references to heap objects; an `int[]` holds the values. Cache behaviour and memory both favour the primitive array.",
        },
      ],
    },
  ],
}, more);
