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
  slug: "strings",
  title: "Strings",
  blurb: "Immutability and the pool, comparison, the String API, StringBuilder, formatting and text blocks, Unicode, and regular expressions.",
  icon: "text",
  overview: `Text is most of what programs handle, and Java's String has a design — immutable, pooled, UTF-16 — whose consequences show up in every interview and every codebase: why == is wrong, why += in a loop is slow, why an emoji has length 2, why split drops trailing empties.

This module goes through the String class methodically: how strings are created and shared, how they are compared and ordered, the twenty methods that do most of the work and their edge cases, StringBuilder for building text, format strings and text blocks for producing it, characters and encodings underneath, and regular expressions for pattern work.

By the end you can manipulate text correctly and efficiently, and answer the string questions interviewers reach for first.`,
  lessons: [
    {
      slug: "string-basics",
      file: "01-string-basics.md",
      exercises: [
        {
          title: "Palindromes",
          prompt: `Read an integer \`n\`, then \`n\` lines. For each line print \`yes\` if it reads the same forwards and backwards (exact character comparison, case-sensitive) and \`no\` otherwise. Compare characters with two indices walking inward — do not build a reversed copy.

**Input:** \`n\`, then \`n\` lines (a line may contain spaces).
**Output:** \`n\` lines.`,
          starter: String.raw`import java.io.*;

public class Main {
    static boolean isPalindrome(String s) {
        // TODO: two indices, one from each end
        return false;
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine().trim());
        for (int i = 0; i < n; i++) {
            System.out.println(isPalindrome(br.readLine()) ? "yes" : "no");
        }
    }
}
`,
          solution: String.raw`import java.io.*;

public class Main {
    static boolean isPalindrome(String s) {
        int lo = 0, hi = s.length() - 1;
        while (lo < hi) {
            if (s.charAt(lo) != s.charAt(hi)) return false;
            lo++;
            hi--;
        }
        return true;
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine().trim());
        for (int i = 0; i < n; i++) {
            System.out.println(isPalindrome(br.readLine()) ? "yes" : "no");
        }
    }
}
`,
          hints: ["The last index is length() - 1.", "Stop when the two indices meet; an empty string is a palindrome."],
          cases: [
            { stdin: "3\nlevel\nJava\nstep on no pets\n", expected: "yes\nno\nyes\n" },
            { stdin: "2\nAba\na\n", expected: "no\nyes\n" },
            { stdin: "2\n\nabccba\n", expected: "yes\nyes\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`String s = \"hi\"; s.toUpperCase(); System.out.println(s);` prints…",
          options: ["`HI`", "`hi` — the result of `toUpperCase` was discarded", "`Hi`", "A compile error"],
          answer: 1,
          explanation: "Strings are immutable; `toUpperCase` returns a new string and leaves `s` alone. `s = s.toUpperCase()` is what was meant.",
        },
        {
          prompt: "`String a = \"java\"; String b = \"java\"; a == b` is…",
          options: ["`true` — both literals refer to the same pooled object", "`false` — different variables", "Undefined", "A compile error"],
          answer: 0,
          explanation: "Identical string literals resolve to one object in the string pool. It is still wrong to rely on — a string read at run time is not pooled.",
        },
        {
          prompt: "Which is a reason strings are immutable?",
          options: ["It makes concatenation faster", "Safe use as `HashMap` keys and sharing via the pool", "Strings would otherwise not fit in memory", "The JVM cannot modify heap objects"],
          answer: 1,
          explanation: "A key that could change would break hashing; sharing one object for equal literals is only safe if nobody can alter it. Concatenation is actually *slower* because of immutability.",
        },
        {
          prompt: "What does `\"x\" + null` produce?",
          options: ["`NullPointerException`", "`\"x\"`", "`\"xnull\"`", "Compile error"],
          answer: 2,
          explanation: "Concatenation converts operands with `String.valueOf`, which turns `null` into the text `\"null\"`. Calling a method on a null string is what throws.",
        },
        {
          prompt: "Why is `s += x` inside a loop of 100 000 iterations slow?",
          options: ["Strings are stored on the stack", "Each `+=` copies the whole accumulated string into a new one — quadratic total work", "The JIT cannot compile loops with strings", "It is not slow"],
          answer: 1,
          explanation: "Immutability means every concatenation allocates a new string of the full length so far. `StringBuilder.append` grows a buffer in place instead.",
        },
      ],
    },
    {
      slug: "comparing-strings",
      file: "02-comparing-strings.md",
      exercises: [
        {
          title: "First and last in order",
          prompt: `Read three words (whitespace-separated). Print two lines:

1. \`strict: <first> <last>\` — the smallest and largest by \`compareTo\`.
2. \`ignoreCase: <first> <last>\` — the smallest and largest by \`compareToIgnoreCase\`.

Print the words as they were given (do not change their case).

Example: \`banana Apple cherry\` →
\`\`\`
strict: Apple cherry
ignoreCase: Apple cherry
\`\`\`
and \`zebra apple Mango\` →
\`\`\`
strict: Mango zebra
ignoreCase: apple zebra
\`\`\``,
          starter: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        String a = in.next(), b = in.next(), c = in.next();
        // TODO: find min and max under compareTo, then under compareToIgnoreCase
    }
}
`,
          solution: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        String a = in.next(), b = in.next(), c = in.next();

        String min = a, max = a;
        if (b.compareTo(min) < 0) min = b;
        if (c.compareTo(min) < 0) min = c;
        if (b.compareTo(max) > 0) max = b;
        if (c.compareTo(max) > 0) max = c;
        System.out.println("strict: " + min + " " + max);

        String imin = a, imax = a;
        if (b.compareToIgnoreCase(imin) < 0) imin = b;
        if (c.compareToIgnoreCase(imin) < 0) imin = c;
        if (b.compareToIgnoreCase(imax) > 0) imax = b;
        if (c.compareToIgnoreCase(imax) > 0) imax = c;
        System.out.println("ignoreCase: " + imin + " " + imax);
    }
}
`,
          hints: ["compareTo < 0 means the receiver sorts first.", "Uppercase letters sort before lowercase under compareTo, so the two orders can differ."],
          cases: [
            { stdin: "banana Apple cherry\n", expected: "strict: Apple cherry\nignoreCase: Apple cherry\n" },
            { stdin: "zebra apple Mango\n", expected: "strict: Mango zebra\nignoreCase: apple zebra\n" },
            { stdin: "b B a\n", expected: "strict: B b\nignoreCase: a b\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`String s = new Scanner(System.in).next();` — the user types `yes`. `s == \"yes\"` is…",
          options: ["`true`", "`false` — the input string is a new object, not the pooled literal", "`true` only after `trim()`", "Compile error"],
          answer: 1,
          explanation: "Strings created at run time are not interned. `==` compares references. `s.equals(\"yes\")` is the correct test.",
        },
        {
          prompt: "`\"Zebra\".compareTo(\"apple\")` is…",
          options: ["Positive, because Z comes after a alphabetically", "Negative, because `'Z'` (90) is less than `'a'` (97)", "0", "An exception"],
          answer: 1,
          explanation: "`compareTo` compares UTF-16 code units; all uppercase letters precede all lowercase ones. `compareToIgnoreCase` or `String.CASE_INSENSITIVE_ORDER` gives the human order.",
        },
        {
          prompt: "Why is `\"literal\".equals(variable)` preferred over `variable.equals(\"literal\")`?",
          options: ["It is faster", "It cannot throw `NullPointerException` when `variable` is null", "The compiler requires it", "It ignores case"],
          answer: 1,
          explanation: "Calling a method on a null reference throws; `equals` on a literal simply returns false for a null argument. `Objects.equals(a, b)` is the symmetric null-safe form.",
        },
        {
          prompt: "Two strings are `equals`. What must be true of their `hashCode`s?",
          options: ["They may differ", "They are equal", "They are equal only if both are interned", "`hashCode` is not defined for strings"],
          answer: 1,
          explanation: "The `equals`/`hashCode` contract: equal objects must have equal hash codes. `String.hashCode` is computed from the characters, so this holds — and `HashMap` depends on it.",
        },
        {
          prompt: "`switch (s) { case \"a\" -> … }` with `s == null` does what?",
          options: ["Runs the default branch", "Throws `NullPointerException`", "Matches `case \"null\"`", "Compile error"],
          answer: 1,
          explanation: "A string `switch` starts by calling `hashCode()` on the selector, which throws for null. Guard with `if (s == null)` first.",
        },
      ],
    },
    {
      slug: "string-methods",
      file: "03-string-methods.md",
      exercises: [
        {
          title: "Email parts",
          prompt: `Read an integer \`n\`, then \`n\` email addresses, one per line. For each, print \`user=<user> domain=<domain> tld=<tld>\` where \`user\` is everything before the \`@\`, \`domain\` everything after it, and \`tld\` the part of the domain after its **last** dot. If the line has no \`@\`, or the domain has no dot, print \`invalid\`.

Use \`indexOf\`, \`lastIndexOf\` and \`substring\`. Trim each line first.

Example: \`ada@mail.example.com\` → \`user=ada domain=mail.example.com tld=com\``,
          starter: IO,
          solution: String.raw`import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine().trim());
        StringBuilder out = new StringBuilder();
        for (int i = 0; i < n; i++) {
            String line = br.readLine().trim();
            int at = line.indexOf('@');
            if (at == -1) {
                out.append("invalid\n");
                continue;
            }
            String user = line.substring(0, at);
            String domain = line.substring(at + 1);
            int dot = domain.lastIndexOf('.');
            if (dot == -1) {
                out.append("invalid\n");
                continue;
            }
            String tld = domain.substring(dot + 1);
            out.append("user=").append(user).append(" domain=").append(domain).append(" tld=").append(tld).append('\n');
        }
        System.out.print(out);
    }
}
`,
          hints: ["indexOf returns -1 when absent — check before substring.", "lastIndexOf('.') on the domain, not on the whole line."],
          cases: [
            { stdin: "3\nada@mail.example.com\nbob@localhost\nnot-an-email\n", expected: "user=ada domain=mail.example.com tld=com\ninvalid\ninvalid\n" },
            { stdin: "2\n  x@y.io  \nfirst.last@corp.co.uk\n", expected: "user=x domain=y.io tld=io\nuser=first.last domain=corp.co.uk tld=uk\n" },
            { stdin: "1\n@domain.com\n", expected: "user= domain=domain.com tld=com\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`\"Hello, World\".substring(7, 12)` is…",
          options: ["`\"World\"`", "`\" World\"`", "`\"Worl\"`", "An exception"],
          answer: 0,
          explanation: "Begin is inclusive (index 7 = 'W'), end is exclusive (index 12 = one past 'd'). The length of the result is `end - begin` = 5.",
        },
        {
          prompt: "`\"a,b,,c,,\".split(\",\").length` is…",
          options: ["6", "4", "5", "3"],
          answer: 1,
          explanation: "Trailing empty strings are removed: `[\"a\", \"b\", \"\", \"c\"]`. Pass a negative limit (`split(\",\", -1)`) to keep them.",
        },
        {
          prompt: "`\"a.b.c\".replaceAll(\".\", \"-\")` produces…",
          options: ["`\"a-b-c\"`", "`\"-----\"`", "`\"a.b.c\"`", "An exception"],
          answer: 1,
          explanation: "`replaceAll` takes a regex, and `.` matches any character. Use `replace(\".\", \"-\")` (literal) or escape: `\"\\\\.\"`.",
        },
        {
          prompt: "`\"abc\".indexOf(\"z\")` returns…",
          options: ["0", "-1", "`null`", "Throws `StringIndexOutOfBoundsException`"],
          answer: 1,
          explanation: "Searching never throws; a miss is −1. Only indexing (`charAt`, `substring`) with a bad index throws.",
        },
        {
          prompt: "Why pass `Locale.ROOT` to `toLowerCase()` for keywords and file extensions?",
          options: ["It is faster", "The default locale can change the result (Turkish `I` → dotless `ı`)", "`toLowerCase()` without a locale is deprecated", "It handles emoji"],
          answer: 1,
          explanation: "Case mapping is locale-sensitive. Programmatic text should be mapped with `Locale.ROOT` so `\"TITLE\".toLowerCase()` is the same on every machine.",
        },
      ],
    },
    {
      slug: "stringbuilder",
      file: "04-stringbuilder.md",
      exercises: [
        {
          title: "Run-length encoding",
          prompt: `Read one line and print its run-length encoding: each maximal run of the same character becomes the character followed by the run length. Build the result with a \`StringBuilder\`.

**Input:** one non-empty line of letters.
**Output:** one line.

Example: \`aaabccdddd\` → \`a3b1c2d4\``,
          starter: String.raw`import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String s = br.readLine();
        StringBuilder sb = new StringBuilder();
        // TODO: walk the string, count runs, append char + count
        System.out.println(sb);
    }
}
`,
          solution: String.raw`import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String s = br.readLine();
        StringBuilder sb = new StringBuilder();
        int i = 0;
        while (i < s.length()) {
            char c = s.charAt(i);
            int j = i;
            while (j < s.length() && s.charAt(j) == c) j++;
            sb.append(c).append(j - i);
            i = j;
        }
        System.out.println(sb);
    }
}
`,
          hints: ["Advance a second index j while charAt(j) equals the run's character.", "append(char) then append(int) — chain them."],
          cases: [
            { stdin: "aaabccdddd\n", expected: "a3b1c2d4\n" },
            { stdin: "abc\n", expected: "a1b1c1\n" },
            { stdin: "zzzzzzzzzzzz\n", expected: "z12\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What is the main difference between `StringBuilder` and `StringBuffer`?",
          options: ["`StringBuffer` is immutable", "`StringBuffer`'s methods are synchronised; `StringBuilder`'s are not and it is faster", "`StringBuilder` cannot be reversed", "`StringBuffer` is newer"],
          answer: 1,
          explanation: "Same API, different locking. `StringBuffer` (Java 1.0) synchronises every call; `StringBuilder` (Java 5) is the default choice.",
        },
        {
          prompt: "`StringBuilder a = new StringBuilder(\"x\"), b = new StringBuilder(\"x\"); a.equals(b)` is…",
          options: ["`true`", "`false` — `StringBuilder` does not override `equals`", "A compile error", "`true` after `toString()` is called on both automatically"],
          answer: 1,
          explanation: "`StringBuilder` inherits `Object.equals` (identity). Compare with `a.toString().equals(b.toString())` or `a.compareTo(b) == 0`.",
        },
        {
          prompt: "`sb.append('a' + 1)` appends…",
          options: ["`\"b\"`", "`\"98\"`", "`\"a1\"`", "Nothing — compile error"],
          answer: 1,
          explanation: "`'a' + 1` is an `int` (98), so the `append(int)` overload runs. Cast: `sb.append((char) ('a' + 1))`.",
        },
        {
          prompt: "How do you clear a `StringBuilder` for reuse?",
          options: ["`sb.clear()`", "`sb.setLength(0)`", "`sb = null`", "`sb.delete()`"],
          answer: 1,
          explanation: "`setLength(0)` empties it and keeps the buffer. There is no `clear()`; `delete(0, sb.length())` also works but is longer.",
        },
        {
          prompt: "When is plain `+` concatenation perfectly fine?",
          options: ["Never — always use a builder", "In a single expression such as `\"x=\" + x + \", y=\" + y`", "Only for two operands", "Only with literals"],
          answer: 1,
          explanation: "The compiler turns one concatenation expression into one efficient operation. The builder matters for loops and multi-statement assembly.",
        },
      ],
    },
    {
      slug: "formatting-and-text-blocks",
      file: "05-formatting-and-text-blocks.md",
      exercises: [
        {
          title: "Receipt",
          prompt: `Read an integer \`n\`, then \`n\` lines each with an item name (no spaces), a quantity and a unit price (\`coffee 2 3.50\`). Print one line per item formatted as \`%-10s%4d%10.2f\` — name left-aligned in 10, quantity right-aligned in 4, line total (quantity × price) in 10 with two decimals — followed by a final line \`%-14s%10.2f\` with the word \`TOTAL\` and the sum of the line totals.

Example: \`2\` then \`coffee 2 3.50\` and \`bagel 1 2.25\` →
\`\`\`
coffee       2      7.00
bagel        1      2.25
TOTAL               9.25
\`\`\``,
          starter: IO,
          solution: String.raw`import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine().trim());
        StringBuilder out = new StringBuilder();
        double total = 0;
        for (int i = 0; i < n; i++) {
            String[] p = br.readLine().trim().split("\\s+");
            String name = p[0];
            int qty = Integer.parseInt(p[1]);
            double price = Double.parseDouble(p[2]);
            double line = qty * price;
            total += line;
            out.append(String.format("%-10s%4d%10.2f%n", name, qty, line));
        }
        out.append(String.format("%-14s%10.2f%n", "TOTAL", total));
        System.out.print(out);
    }
}
`,
          hints: ["%-10s pads on the right; %10.2f pads on the left and rounds to two places.", "The TOTAL line's word takes 14 columns so its number lines up with the totals above."],
          cases: [
            { stdin: "2\ncoffee 2 3.50\nbagel 1 2.25\n", expected: "coffee       2      7.00\nbagel        1      2.25\nTOTAL               9.25\n" },
            { stdin: "1\nwidget 100 0.10\n", expected: "widget     100     10.00\nTOTAL              10.00\n" },
            { stdin: "3\na 1 1\nb 1 1\nc 1 1.004\n", expected: "a            1      1.00\nb            1      1.00\nc            1      1.00\nTOTAL               3.00\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`String.format(\"[%-6s]\", \"ab\")` gives…",
          options: ["`[    ab]`", "`[ab    ]`", "`[ab]`", "`[000ab]`"],
          answer: 1,
          explanation: "Width 6 with the `-` flag left-aligns and pads on the right. Without the flag it would be right-aligned.",
        },
        {
          prompt: "`String.format(\"%,d\", 1234567)` in the ROOT locale gives…",
          options: ["`1234567`", "`1,234,567`", "`1.234.567`", "An exception"],
          answer: 1,
          explanation: "The `,` flag inserts grouping separators appropriate to the locale — commas for ROOT/US, dots for German.",
        },
        {
          prompt: "Are format strings checked by the compiler?",
          options: ["Yes", "No — a mismatch such as `%d` with a `String` throws at run time", "Only in `printf`", "Only with `-Xlint`"],
          answer: 1,
          explanation: "`String.format` parses the pattern at run time; `IllegalFormatConversionException` and `MissingFormatArgumentException` are the results of a mismatch.",
        },
        {
          prompt: "In a text block, what determines how much indentation is removed?",
          options: ["The first line only", "The least-indented content line **or** the closing `\"\"\"`, whichever is further left", "Nothing is removed", "Four spaces always"],
          answer: 1,
          explanation: "The common leading whitespace of all lines, including the position of the closing delimiter, is stripped. Moving the closing `\"\"\"` left keeps more indentation.",
        },
        {
          prompt: "`String.format(\"%.2f\", 2.675)` prints `2.68`, although the stored double is 2.67499999…. Why?",
          options: ["`%f` always rounds up", "Java's formatter rounds the shortest decimal representation (`2.675`) HALF_UP, not the exact binary value", "The JIT corrects the value", "A JDK bug"],
          answer: 1,
          explanation: "Unlike C's printf, Java's `%f` works from the digits `Double.toString` would produce and rounds those HALF_UP. `Math.round(2.675 * 100)` sees the binary value and gives 267.",
        },
      ],
    },
    {
      slug: "chars-and-unicode",
      file: "06-chars-and-unicode.md",
      exercises: [
        {
          title: "Count what is really there",
          prompt: `Read one line and print four counts on one line: \`units=<length()> codepoints=<codePointCount> letters=<count of code points for which Character.isLetter is true> digits=<count of code points for which Character.isDigit is true>\`.

Iterate by **code point**, not by \`char\`, so that a character outside the Basic Multilingual Plane (an emoji, for instance) is counted once.

**Input:** one line (UTF-8).
**Output:** one line.

Example: \`abc 123\` → \`units=7 codepoints=7 letters=3 digits=3\``,
          starter: String.raw`import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String s = br.readLine();
        int letters = 0, digits = 0;
        // TODO: walk the string by code point with codePointAt and Character.charCount
        System.out.println("units=" + s.length() + " codepoints=" + s.codePointCount(0, s.length())
            + " letters=" + letters + " digits=" + digits);
    }
}
`,
          solution: String.raw`import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String s = br.readLine();
        int letters = 0, digits = 0;
        for (int i = 0; i < s.length(); ) {
            int cp = s.codePointAt(i);
            if (Character.isLetter(cp)) letters++;
            if (Character.isDigit(cp)) digits++;
            i += Character.charCount(cp);
        }
        System.out.println("units=" + s.length() + " codepoints=" + s.codePointCount(0, s.length())
            + " letters=" + letters + " digits=" + digits);
    }
}
`,
          hints: ["Character.isLetter and isDigit have int (code point) overloads.", "Advance by Character.charCount(cp): 1 for most characters, 2 for a surrogate pair."],
          cases: [
            { stdin: "abc 123\n", expected: "units=7 codepoints=7 letters=3 digits=3\n" },
            { stdin: "café é\n", expected: "units=6 codepoints=6 letters=5 digits=0\n" },
            { stdin: "hi 😀 5\n", expected: "units=7 codepoints=6 letters=2 digits=1\n" },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`\"😀\".length()` is…",
          options: ["1", "2 — the emoji is a surrogate pair of two UTF-16 units", "4", "Depends on the platform"],
          answer: 1,
          explanation: "U+1F600 lies outside the Basic Multilingual Plane and takes two `char`s. `codePointCount` reports 1.",
        },
        {
          prompt: "Which call is the correct way to turn bytes into text?",
          options: ["`new String(bytes)`", "`new String(bytes, StandardCharsets.UTF_8)`", "`bytes.toString()`", "`String.valueOf(bytes)`"],
          answer: 1,
          explanation: "Always name the charset. `bytes.toString()` gives `[B@hash`; the no-argument constructor used the platform default before Java 18.",
        },
        {
          prompt: "How many bytes is `\"é\"` in UTF-8?",
          options: ["1", "2", "3", "4"],
          answer: 1,
          explanation: "U+00E9 encodes as two bytes (C3 A9) in UTF-8. ASCII is one byte; CJK characters are three; emoji are four.",
        },
        {
          prompt: "`Character.isDigit(c)` is true for…",
          options: ["Only `'0'`–`'9'`", "Any Unicode decimal digit, including non-ASCII ones", "Digits and letters", "Only if `c` is an `int`"],
          answer: 1,
          explanation: "The `Character` methods are Unicode-aware. For a strict ASCII check compare ranges: `c >= '0' && c <= '9'`.",
        },
        {
          prompt: "`new StringBuilder(\"a😀\").reverse()` gives…",
          options: ["A string with the emoji broken into two halves", "`\"😀a\"` — `reverse` keeps surrogate pairs intact", "`\"a😀\"` unchanged", "An exception"],
          answer: 1,
          explanation: "`StringBuilder.reverse` is specified to treat surrogate pairs as single characters. A hand-written `char` swap would corrupt them.",
        },
      ],
    },
    {
      slug: "regex",
      file: "07-regex.md",
      exercises: [
        {
          title: "Numbers in the noise",
          prompt: `Read one line and find every integer in it (an optional minus sign followed by one or more digits) using a compiled \`Pattern\` and \`Matcher.find()\`. Print the numbers space-separated on the first line (or \`none\` if there are none), and \`sum=<total>\` on the second, using a \`long\` for the total.

Example: \`Order 66 shipped -3 items, ref 2024\` →
\`\`\`
66 -3 2024
sum=2087
\`\`\``,
          starter: String.raw`import java.io.*;
import java.util.regex.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String line = br.readLine();
        Pattern p = Pattern.compile("-?\\d+");
        Matcher m = p.matcher(line);
        // TODO: loop with m.find(), collect m.group()
    }
}
`,
          solution: String.raw`import java.io.*;
import java.util.regex.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String line = br.readLine();
        Pattern p = Pattern.compile("-?\\d+");
        Matcher m = p.matcher(line);
        StringBuilder found = new StringBuilder();
        long sum = 0;
        while (m.find()) {
            if (found.length() > 0) found.append(' ');
            found.append(m.group());
            sum += Long.parseLong(m.group());
        }
        System.out.println(found.length() == 0 ? "none" : found.toString());
        System.out.println("sum=" + sum);
    }
}
`,
          hints: ["find() advances to the next match each call; group() is the matched text.", "Parse with Long.parseLong — a number in the text may exceed int."],
          cases: [
            { stdin: "Order 66 shipped -3 items, ref 2024\n", expected: "66 -3 2024\nsum=2087\n" },
            { stdin: "no digits at all\n", expected: "none\nsum=0\n" },
            { stdin: "big 9999999999 and 1\n", expected: "9999999999 1\nsum=10000000000\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`\"abc123\".matches(\"\\\\d+\")` is…",
          options: ["`true`", "`false` — `matches` requires the whole string to match", "`true` because it contains digits", "A compile error"],
          answer: 1,
          explanation: "`matches` is anchored at both ends. To search for digits anywhere, use a `Matcher` and `find()`.",
        },
        {
          prompt: "Which pattern removes HTML tags from `<b>bold</b> text` without swallowing the text between tags?",
          options: ["`<.*>`", "`<.*?>` or `<[^>]*>`", "`<.+>`", "`<>`"],
          answer: 1,
          explanation: "Greedy `.*` runs to the last `>`. Lazy `.*?` or a negated class `[^>]*` stops at the first one.",
        },
        {
          prompt: "Why hoist `Pattern.compile(...)` out of a loop?",
          options: ["`Pattern` objects are single-use", "Compilation is the expensive part; a `Pattern` is immutable and reusable", "The loop would not compile otherwise", "It changes the match results"],
          answer: 1,
          explanation: "`String.matches`/`split`/`replaceAll` recompile every call. A `static final Pattern` is parsed once; `Matcher` is created per input.",
        },
        {
          prompt: "In `replaceAll`, what does `$1` in the replacement string mean?",
          options: ["A literal dollar and 1", "The text captured by the first group", "The first match", "An error"],
          answer: 1,
          explanation: "`$n` refers to capturing group n; `$0` is the whole match. A literal `$` must be escaped (`Matcher.quoteReplacement`).",
        },
        {
          prompt: "`\"a|b|c\".split(\"|\")` gives…",
          options: ["`[\"a\", \"b\", \"c\"]`", "`[\"a\", \"|\", \"b\", \"|\", \"c\"]` — `|` is alternation with an empty pattern, so it splits between every character", "`[\"a|b|c\"]`", "An exception"],
          answer: 1,
          explanation: "`|` is a regex metacharacter meaning \"empty or empty\", which matches at every position. Escape it: `split(\"\\\\|\")`.",
        },
      ],
    },
    {
      slug: "strings-checkpoint",
      file: "08-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "Caesar shift",
          prompt: `Read an integer \`k\` (which may be negative or larger than 26) on the first line, then a line of text. Print the text with every letter shifted \`k\` places forward in the alphabet, wrapping around, preserving case; leave non-letters unchanged.

Use \`char\` arithmetic and \`Math.floorMod\` so negative shifts work. Build the output with a \`StringBuilder\`.

Example: \`3\` then \`Hello, World!\` → \`Khoor, Zruog!\``,
          starter: IO,
          solution: String.raw`import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int k = Integer.parseInt(br.readLine().trim());
        String text = br.readLine();
        int shift = Math.floorMod(k, 26);
        StringBuilder sb = new StringBuilder(text.length());
        for (int i = 0; i < text.length(); i++) {
            char c = text.charAt(i);
            if (c >= 'a' && c <= 'z') {
                sb.append((char) ('a' + (c - 'a' + shift) % 26));
            } else if (c >= 'A' && c <= 'Z') {
                sb.append((char) ('A' + (c - 'A' + shift) % 26));
            } else {
                sb.append(c);
            }
        }
        System.out.println(sb);
    }
}
`,
          hints: ["Reduce k with Math.floorMod(k, 26) first.", "(c - 'a' + shift) % 26 gives the new offset; add 'a' back and cast to char."],
          cases: [
            { stdin: "3\nHello, World!\n", expected: "Khoor, Zruog!\n" },
            { stdin: "-3\nKhoor, Zruog!\n", expected: "Hello, World!\n" },
            { stdin: "52\nabc XYZ 123\n", expected: "abc XYZ 123\n", hidden: true },
            { stdin: "13\nUryyb\n", expected: "Hello\n", hidden: true },
          ],
        },
        {
          title: "Title case and acronym",
          prompt: `Read one line containing words separated by any amount of whitespace. Print two lines:

1. The words in **Title Case** (first letter uppercase, the rest lowercase), joined by single spaces.
2. \`acronym=<X>\` where \`X\` is the uppercase first letter of every word.

Split with a regular expression, trim first, and use \`Character.toUpperCase\`/\`toLowerCase\`.

Example: \`  the QUICK   brown fox \` →
\`\`\`
The Quick Brown Fox
acronym=TQBF
\`\`\``,
          starter: IO,
          solution: String.raw`import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String line = br.readLine().trim();
        String[] words = line.isEmpty() ? new String[0] : line.split("\\s+");
        StringBuilder title = new StringBuilder();
        StringBuilder acronym = new StringBuilder();
        for (int i = 0; i < words.length; i++) {
            String w = words[i];
            char first = Character.toUpperCase(w.charAt(0));
            if (i > 0) title.append(' ');
            title.append(first).append(w.substring(1).toLowerCase());
            acronym.append(first);
        }
        System.out.println(title);
        System.out.println("acronym=" + acronym);
    }
}
`,
          hints: ["trim() then split(\"\\\\s+\") gives clean words.", "w.substring(1) is the rest of the word; lowercase it."],
          cases: [
            { stdin: "  the QUICK   brown fox \n", expected: "The Quick Brown Fox\nacronym=TQBF\n" },
            { stdin: "java\n", expected: "Java\nacronym=J\n" },
            { stdin: "portable network GRAPHICS\n", expected: "Portable Network Graphics\nacronym=PNG\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which statement about `String` is false?",
          options: ["It is immutable", "It is `final`", "Its `hashCode` is cached after the first call", "Its `length()` returns the number of Unicode characters"],
          answer: 3,
          explanation: "`length()` counts UTF-16 code units; a supplementary character counts as two. The other three statements are true.",
        },
        {
          prompt: "`String a = \"ja\" + \"va\"; a == \"java\"` is…",
          options: ["`true` — the compiler folds the constant and pools it", "`false`", "`true` only with `intern()`", "Undefined"],
          answer: 0,
          explanation: "Concatenation of compile-time constants is folded into one literal, which is interned. With a non-final variable operand it would be a run-time object and `false`.",
        },
        {
          prompt: "How should two possibly-null strings be compared for equality?",
          options: ["`a == b`", "`a.equals(b)`", "`Objects.equals(a, b)`", "`a.compareTo(b) == 0`"],
          answer: 2,
          explanation: "`Objects.equals` handles null on either side. `a.equals(b)` throws when `a` is null; `==` compares references.",
        },
        {
          prompt: "`\"10\".compareTo(\"9\")` is…",
          options: ["Positive", "Negative — `'1'` is less than `'9'`", "0", "An exception"],
          answer: 1,
          explanation: "Strings compare character by character. For numeric ordering parse first or use a comparator on the parsed value.",
        },
        {
          prompt: "`\"banana\".indexOf(\"an\", 2)` returns…",
          options: ["1", "3", "-1", "2"],
          answer: 1,
          explanation: "The search starts at index 2 (`\"nana\"`), and the next `\"an\"` begins at index 3.",
        },
        {
          prompt: "`\"a.b\".split(\".\")` returns…",
          options: ["`[\"a\", \"b\"]`", "An empty array", "`[\"a.b\"]`", "`[\"\", \"\", \"\"]`"],
          answer: 1,
          explanation: "`.` matches every character, so every piece is empty and trailing empties are dropped — nothing is left. Escape it: `\"\\\\.\"`.",
        },
        {
          prompt: "Which builds a large string in a loop efficiently?",
          options: ["`s += piece`", "`s = s.concat(piece)`", "`sb.append(piece)` on a `StringBuilder`, then `toString()`", "`String.format(\"%s%s\", s, piece)`"],
          answer: 2,
          explanation: "Only the builder appends in place. The other three create a new full-length string on every iteration.",
        },
        {
          prompt: "`new StringBuilder(\"abc\").reverse().toString()` gives…",
          options: ["`\"cba\"`", "`\"abc\"`", "`\"StringBuilder@…\"`", "A compile error"],
          answer: 0,
          explanation: "`reverse` mutates the builder in place and returns it; `toString` produces the string. This is the idiomatic reversal.",
        },
        {
          prompt: "`String.format(\"%05.1f\", 3.14159)` gives…",
          options: ["`003.1`", "`3.1`", "`3.14`", "`00003.1`"],
          answer: 0,
          explanation: "Width 5 total, one decimal, zero-padded: `3.1` is three characters, padded to `003.1`.",
        },
        {
          prompt: "What does a text block do with the line terminators in the source file?",
          options: ["Keeps them as written (`\\r\\n` on Windows)", "Normalises every line ending to `\\n`", "Removes them", "Converts them to spaces"],
          answer: 1,
          explanation: "Text blocks always produce `\\n` line endings regardless of how the file was saved, so the string is the same on every platform.",
        },
        {
          prompt: "Reading a UTF-8 file with `new String(bytes, StandardCharsets.ISO_8859_1)` produces…",
          options: ["The correct text", "Mojibake — multi-byte characters become two or more wrong characters", "An exception", "The correct text for ASCII only, with an exception otherwise"],
          answer: 1,
          explanation: "Latin-1 maps every byte to a character, so the two bytes of `é` become `Ã©`. Wrong charset never throws; it silently corrupts.",
        },
        {
          prompt: "`\"Hello World\".replaceAll(\"o\", \"0\")` and `.replace(\"o\", \"0\")` differ in…",
          options: ["Nothing here — both replace every `o`; `replaceAll` treats its pattern as a regex", "`replace` changes only the first", "`replaceAll` changes only the first", "`replace` is deprecated"],
          answer: 0,
          explanation: "Both replace all occurrences. The difference is that `replaceAll`'s first argument is a regular expression, which matters for characters like `.`.",
        },
        {
          prompt: "In a regex, what does `\\b` match?",
          options: ["A backspace", "A word boundary — the position between a word character and a non-word character", "A blank line", "A literal `b`"],
          answer: 1,
          explanation: "`\\bcat\\b` matches `cat` but not `concatenate`. Inside a character class `[\\b]` it is a backspace.",
        },
        {
          prompt: "`Character.getNumericValue('7')` returns…",
          options: ["`'7'`", "7", "55", "-1"],
          answer: 1,
          explanation: "It returns the digit's value as an `int`. `'7' - '0'` gives the same for ASCII digits; `(int) '7'` would be the code 55.",
        },
        {
          prompt: "Why is `\"x\".equals(sb)` (where `sb` is a `StringBuilder` holding `x`) false?",
          options: ["`StringBuilder` contents are private", "`String.equals` returns false for any non-`String` argument", "It is true", "`sb` is null"],
          answer: 1,
          explanation: "`String.equals` checks `instanceof String` first. Use `\"x\".contentEquals(sb)` to compare with any `CharSequence`.",
        },
      ],
    },
  ],
}, more);
