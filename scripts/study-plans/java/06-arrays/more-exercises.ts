import type { ExerciseSource } from "../../dsl.js";

/** A second program per lesson (a third for the checkpoint) — see defineModule's `extras`. */
const more: Record<string, ExerciseSource[]> = {
  "array-basics": [
    {
      title: "Dice histogram",
      prompt: `Read an integer \`n\` and \`n\` dice rolls (each 1–6). Count them in an \`int[7]\` indexed by face (index 0 unused), then print one line per face \`<face>: <count> <stars>\` with one \`*\` per roll, and finally \`mode=<the most rolled face, lowest on ties>\`.

Example: \`6\` then \`3 1 3 6 3 1\` →
\`\`\`
1: 2 **
2: 0
3: 3 ***
4: 0
5: 0
6: 1 *
mode=3
\`\`\``,
      starter: String.raw`import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        int[] counts = new int[7];
        // TODO
    }
}
`,
      solution: String.raw`import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        int[] counts = new int[7];
        for (int i = 0; i < n; i++) counts[in.nextInt()]++;
        int mode = 1;
        for (int face = 1; face <= 6; face++) {
            System.out.println(face + ": " + counts[face] + " " + "*".repeat(counts[face]));
            if (counts[face] > counts[mode]) mode = face;
        }
        System.out.println("mode=" + mode);
    }
}
`,
      hints: ["counts[roll]++ is the whole counting loop — the array index is the face.", "Strictly greater keeps the lowest face on ties."],
      cases: [
        { stdin: "6\n3 1 3 6 3 1\n", expected: "1: 2 **\n2: 0 \n3: 3 ***\n4: 0 \n5: 0 \n6: 1 *\nmode=3\n" },
        { stdin: "0\n", expected: "1: 0 \n2: 0 \n3: 0 \n4: 0 \n5: 0 \n6: 0 \nmode=1\n" },
        { stdin: "4\n6 6 2 2\n", expected: "1: 0 \n2: 2 **\n3: 0 \n4: 0 \n5: 0 \n6: 2 **\nmode=2\n", hidden: true },
      ],
    },
  ],
  multidimensional: [
    {
      title: "Transpose and trace",
      prompt: `Read \`r\` and \`c\` and an \`r × c\` matrix. Print its transpose (\`c\` rows of \`r\` values, space-separated), then \`trace=<sum of m[i][i] for i < min(r, c)>\` and \`symmetric=<true if r == c and the matrix equals its transpose>\`.

Example: \`2 3\` then \`1 2 3\` / \`4 5 6\` →
\`\`\`
1 4
2 5
3 6
trace=6
symmetric=false
\`\`\``,
      starter: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int r = in.nextInt(), c = in.nextInt();
        int[][] m = new int[r][c];
        for (int i = 0; i < r; i++) for (int j = 0; j < c; j++) m[i][j] = in.nextInt();
        int[][] t = new int[c][r];
        // TODO
    }
}
`,
      solution: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int r = in.nextInt(), c = in.nextInt();
        int[][] m = new int[r][c];
        for (int i = 0; i < r; i++) for (int j = 0; j < c; j++) m[i][j] = in.nextInt();
        int[][] t = new int[c][r];
        for (int i = 0; i < r; i++) for (int j = 0; j < c; j++) t[j][i] = m[i][j];
        for (int[] row : t) {
            StringBuilder sb = new StringBuilder();
            for (int x : row) sb.append(sb.length() > 0 ? " " : "").append(x);
            System.out.println(sb);
        }
        long trace = 0;
        for (int i = 0; i < Math.min(r, c); i++) trace += m[i][i];
        System.out.println("trace=" + trace);
        System.out.println("symmetric=" + (r == c && Arrays.deepEquals(m, t)));
    }
}
`,
      hints: ["t[j][i] = m[i][j] — swap the indexes; the transpose has c rows.", "Arrays.deepEquals compares nested arrays element by element."],
      cases: [
        { stdin: "2 3\n1 2 3\n4 5 6\n", expected: "1 4\n2 5\n3 6\ntrace=6\nsymmetric=false\n" },
        { stdin: "2 2\n1 7\n7 1\n", expected: "1 7\n7 1\ntrace=2\nsymmetric=true\n" },
        { stdin: "1 1\n-3\n", expected: "-3\ntrace=-3\nsymmetric=true\n", hidden: true },
      ],
    },
  ],
  "arrays-utility": [
    {
      title: "Binary search report",
      prompt: `Read an integer \`n\`, \`n\` integers, then \`q\` and \`q\` query values. Sort the array with \`Arrays.sort\` and print \`sorted=<Arrays.toString>\`. For each query print \`<v>: found at <index>\` when \`Arrays.binarySearch\` finds it, or \`<v>: insert at <position>\` decoded from the negative result (\`-(insertion point) - 1\`). Finally print \`equalToCopy=<Arrays.equals(sorted, Arrays.copyOf(sorted, n))>\`.

Example: \`4\` then \`9 2 7 4\`, \`3\` then \`7 5 10\` →
\`\`\`
sorted=[2, 4, 7, 9]
7: found at 2
5: insert at 2
10: insert at 4
equalToCopy=true
\`\`\``,
      starter: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        int[] a = new int[n];
        for (int i = 0; i < n; i++) a[i] = in.nextInt();
        // TODO
    }
}
`,
      solution: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        int[] a = new int[n];
        for (int i = 0; i < n; i++) a[i] = in.nextInt();
        Arrays.sort(a);
        System.out.println("sorted=" + Arrays.toString(a));
        int q = in.nextInt();
        for (int i = 0; i < q; i++) {
            int v = in.nextInt();
            int at = Arrays.binarySearch(a, v);
            if (at >= 0) System.out.println(v + ": found at " + at);
            else System.out.println(v + ": insert at " + (-at - 1));
        }
        System.out.println("equalToCopy=" + Arrays.equals(a, Arrays.copyOf(a, n)));
    }
}
`,
      hints: ["binarySearch only works on a sorted array — sort first.", "A negative result r encodes the insertion point as -r - 1."],
      cases: [
        { stdin: "4\n9 2 7 4\n3\n7 5 10\n", expected: "sorted=[2, 4, 7, 9]\n7: found at 2\n5: insert at 2\n10: insert at 4\nequalToCopy=true\n" },
        { stdin: "1\n5\n2\n5 0\n", expected: "sorted=[5]\n5: found at 0\n0: insert at 0\nequalToCopy=true\n" },
        { stdin: "5\n3 3 3 1 1\n2\n2 3\n", expected: "sorted=[1, 1, 3, 3, 3]\n2: insert at 2\n3: found at 2\nequalToCopy=true\n", hidden: true },
      ],
    },
  ],
  "copying-and-references": [
    {
      title: "Shallow grid, deep grid",
      prompt: `Read \`r\`, \`c\` and an \`r × c\` grid. Make \`shallow = grid.clone()\` (a new outer array whose rows are the **same** row arrays) and \`deep\` — a fresh array with every row cloned. Set \`grid[0][0] = 99\`. Print \`shallow[0][0]=<…>\` and \`deep[0][0]=<…>\`, then \`sharesRows=<shallow[0] == grid[0]>\` and \`deepSharesRows=<deep[0] == grid[0]>\`, then \`deepEquals=<Arrays.deepEquals(grid, deep)>\`.

Example: \`2 2\` then \`1 2\` / \`3 4\` →
\`\`\`
shallow[0][0]=99
deep[0][0]=1
sharesRows=true
deepSharesRows=false
deepEquals=false
\`\`\``,
      starter: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int r = in.nextInt(), c = in.nextInt();
        int[][] grid = new int[r][c];
        for (int i = 0; i < r; i++) for (int j = 0; j < c; j++) grid[i][j] = in.nextInt();
        int[][] shallow = grid.clone();
        int[][] deep = new int[r][];
        // TODO
    }
}
`,
      solution: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int r = in.nextInt(), c = in.nextInt();
        int[][] grid = new int[r][c];
        for (int i = 0; i < r; i++) for (int j = 0; j < c; j++) grid[i][j] = in.nextInt();
        int[][] shallow = grid.clone();
        int[][] deep = new int[r][];
        for (int i = 0; i < r; i++) deep[i] = grid[i].clone();
        grid[0][0] = 99;
        System.out.println("shallow[0][0]=" + shallow[0][0]);
        System.out.println("deep[0][0]=" + deep[0][0]);
        System.out.println("sharesRows=" + (shallow[0] == grid[0]));
        System.out.println("deepSharesRows=" + (deep[0] == grid[0]));
        System.out.println("deepEquals=" + Arrays.deepEquals(grid, deep));
    }
}
`,
      hints: ["clone() on a 2-D array copies only the outer array of references.", "Clone each row to get an independent copy — or Arrays.stream(grid).map(int[]::clone).toArray(int[][]::new)."],
      cases: [
        { stdin: "2 2\n1 2\n3 4\n", expected: "shallow[0][0]=99\ndeep[0][0]=1\nsharesRows=true\ndeepSharesRows=false\ndeepEquals=false\n" },
        { stdin: "1 1\n99\n", expected: "shallow[0][0]=99\ndeep[0][0]=99\nsharesRows=true\ndeepSharesRows=false\ndeepEquals=true\n" },
        { stdin: "1 3\n5 6 7\n", expected: "shallow[0][0]=99\ndeep[0][0]=5\nsharesRows=true\ndeepSharesRows=false\ndeepEquals=false\n", hidden: true },
      ],
    },
  ],
  "array-patterns": [
    {
      title: "Two pointers, in place",
      prompt: `Read an integer \`n\` and \`n\` integers **sorted ascending**. In place, with two indexes and no extra array: (1) remove duplicates so the first \`k\` slots hold the distinct values — print \`distinct=<k> <those k values>\`; then read another \`m\` and \`m\` integers and (2) move every zero to the end while keeping the order of the non-zeros — print \`zerosMoved=<array>\`.

Example: \`6\` then \`1 1 2 3 3 3\`, then \`5\` then \`0 4 0 5 6\` →
\`\`\`
distinct=3 1 2 3
zerosMoved=[4, 5, 6, 0, 0]
\`\`\``,
      starter: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        int[] a = new int[n];
        for (int i = 0; i < n; i++) a[i] = in.nextInt();
        // TODO (1)
        int m = in.nextInt();
        int[] b = new int[m];
        for (int i = 0; i < m; i++) b[i] = in.nextInt();
        // TODO (2)
    }
}
`,
      solution: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        int[] a = new int[n];
        for (int i = 0; i < n; i++) a[i] = in.nextInt();
        int k = 0;
        for (int i = 0; i < n; i++) {
            if (k == 0 || a[i] != a[k - 1]) a[k++] = a[i];
        }
        StringBuilder sb = new StringBuilder("distinct=" + k);
        for (int i = 0; i < k; i++) sb.append(' ').append(a[i]);
        System.out.println(sb);

        int m = in.nextInt();
        int[] b = new int[m];
        for (int i = 0; i < m; i++) b[i] = in.nextInt();
        int write = 0;
        for (int i = 0; i < m; i++) if (b[i] != 0) b[write++] = b[i];
        while (write < m) b[write++] = 0;
        System.out.println("zerosMoved=" + Arrays.toString(b));
    }
}
`,
      hints: ["A write index trails a read index; copy forward only what you keep.", "After compacting the non-zeros, fill the tail with zeros."],
      cases: [
        { stdin: "6\n1 1 2 3 3 3\n5\n0 4 0 5 6\n", expected: "distinct=3 1 2 3\nzerosMoved=[4, 5, 6, 0, 0]\n" },
        { stdin: "0\n3\n0 0 0\n", expected: "distinct=0\nzerosMoved=[0, 0, 0]\n" },
        { stdin: "4\n2 2 2 2\n4\n1 2 3 4\n", expected: "distinct=1 2\nzerosMoved=[1, 2, 3, 4]\n", hidden: true },
      ],
    },
  ],
  "arrays-checkpoint": [
    {
      title: "Pascal's triangle",
      prompt: `Read an integer \`n\` (\`1 ≤ n ≤ 30\`). Build the first \`n\` rows of Pascal's triangle as a **jagged** \`long[][]\` — row \`i\` has \`i + 1\` entries, each the sum of the two above it — and print each row space-separated. Then print \`rowSum=<sum of the last row>\` (which is \`2^(n-1)\`) and \`middle=<the largest value in the last row>\`.

Example: \`4\` →
\`\`\`
1
1 1
1 2 1
1 3 3 1
rowSum=8
middle=3
\`\`\``,
      starter: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        int n = new Scanner(System.in).nextInt();
        long[][] t = new long[n][];
        // TODO
    }
}
`,
      solution: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        int n = new Scanner(System.in).nextInt();
        long[][] t = new long[n][];
        for (int i = 0; i < n; i++) {
            t[i] = new long[i + 1];
            t[i][0] = t[i][i] = 1;
            for (int j = 1; j < i; j++) t[i][j] = t[i - 1][j - 1] + t[i - 1][j];
        }
        for (long[] row : t) {
            StringBuilder sb = new StringBuilder();
            for (long x : row) sb.append(sb.length() > 0 ? " " : "").append(x);
            System.out.println(sb);
        }
        long sum = 0, max = 0;
        for (long x : t[n - 1]) { sum += x; max = Math.max(max, x); }
        System.out.println("rowSum=" + sum);
        System.out.println("middle=" + max);
    }
}
`,
      hints: ["Allocate each row with its own length — that is what makes the array jagged.", "The ends are 1; everything between is the sum of the two entries above."],
      cases: [
        { stdin: "4\n", expected: "1\n1 1\n1 2 1\n1 3 3 1\nrowSum=8\nmiddle=3\n" },
        { stdin: "1\n", expected: "1\nrowSum=1\nmiddle=1\n" },
        { stdin: "6\n", expected: "1\n1 1\n1 2 1\n1 3 3 1\n1 4 6 4 1\n1 5 10 10 5 1\nrowSum=32\nmiddle=10\n", hidden: true },
      ],
    },
  ],
};

export default more;
