import type { ExerciseSource } from "../../dsl.js";

/** A second program per lesson (a third for the checkpoint) — see defineModule's `extras`. */
const more: Record<string, ExerciseSource[]> = {
  "string-basics": [
    {
      title: "Proof of immutability",
      prompt: `Read one word \`w\` (no spaces). Call \`w.toUpperCase()\` **without** assigning the result and print \`after call: <w>\`; then assign \`String up = w.toUpperCase()\` and print \`assigned: <up>\`; call \`w.concat("!")\` unassigned and print \`still: <w>\`; finally print \`trim returns same object: <w == w.trim()>\` — \`trim\` hands back the very same object when there is nothing to remove.

Example: \`java\` →
\`\`\`
after call: java
assigned: JAVA
still: java
trim returns same object: true
\`\`\``,
      starter: String.raw`import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        String w = new Scanner(System.in).next();
        // TODO
    }
}
`,
      solution: String.raw`import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        String w = new Scanner(System.in).next();
        w.toUpperCase();
        System.out.println("after call: " + w);
        String up = w.toUpperCase();
        System.out.println("assigned: " + up);
        w.concat("!");
        System.out.println("still: " + w);
        System.out.println("trim returns same object: " + (w == w.trim()));
    }
}
`,
      hints: ["Every String method that 'changes' the text returns a new String; the original is untouched.", "trim() is specified to return this when no whitespace was removed — one of the few cases where == on strings is predictable."],
      cases: [
        { stdin: "java\n", expected: "after call: java\nassigned: JAVA\nstill: java\ntrim returns same object: true\n" },
        { stdin: "Hello\n", expected: "after call: Hello\nassigned: HELLO\nstill: Hello\ntrim returns same object: true\n" },
        { stdin: "x\n", expected: "after call: x\nassigned: X\nstill: x\ntrim returns same object: true\n", hidden: true },
      ],
    },
  ],
  "comparing-strings": [
    {
      title: "Two orders, one list",
      prompt: `Read an integer \`n\` and \`n\` words. Print \`natural: <words sorted with the natural String order>\`, then \`ignoreCase: <words sorted with String.CASE_INSENSITIVE_ORDER>\` (the sort is stable, so words equal ignoring case keep their input order), then \`distinctIgnoreCase: <how many distinct words there are when case is ignored>\` using a \`TreeSet\` built with that comparator. Join words with spaces.

Example: \`4\` then \`banana Apple apple Cherry\` →
\`\`\`
natural: Apple Cherry apple banana
ignoreCase: Apple apple banana Cherry
distinctIgnoreCase: 3
\`\`\``,
      starter: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<String> words = new ArrayList<>();
        for (int i = 0; i < n; i++) words.add(in.next());
        // TODO
    }
}
`,
      solution: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<String> words = new ArrayList<>();
        for (int i = 0; i < n; i++) words.add(in.next());
        List<String> natural = new ArrayList<>(words);
        Collections.sort(natural);
        System.out.println("natural: " + String.join(" ", natural));
        List<String> ignore = new ArrayList<>(words);
        ignore.sort(String.CASE_INSENSITIVE_ORDER);
        System.out.println("ignoreCase: " + String.join(" ", ignore));
        Set<String> distinct = new TreeSet<>(String.CASE_INSENSITIVE_ORDER);
        distinct.addAll(words);
        System.out.println("distinctIgnoreCase: " + distinct.size());
    }
}
`,
      hints: ["Natural order is by UTF-16 code unit: every upper-case letter sorts before every lower-case one.", "A TreeSet with a comparator treats elements the comparator calls equal as duplicates."],
      cases: [
        { stdin: "4\nbanana Apple apple Cherry\n", expected: "natural: Apple Cherry apple banana\nignoreCase: Apple apple banana Cherry\ndistinctIgnoreCase: 3\n" },
        { stdin: "3\nb B a\n", expected: "natural: B a b\nignoreCase: a b B\ndistinctIgnoreCase: 2\n" },
        { stdin: "2\nZed alpha\n", expected: "natural: Zed alpha\nignoreCase: alpha Zed\ndistinctIgnoreCase: 2\n", hidden: true },
      ],
    },
  ],
  "string-methods": [
    {
      title: "Slug maker",
      prompt: `Read lines until end of input; each is a title. Turn it into a URL slug: trim, lower-case (\`Locale.ROOT\`), replace every run of characters that are not \`a-z\` or \`0-9\` with a single \`-\`, and strip any leading or trailing \`-\`. Print \`slug=<slug>\` per line, or \`slug=(empty)\` when nothing is left.

Example input
\`\`\`
  Hello, World!
Java 17: What's New?
\`\`\`
→
\`\`\`
slug=hello-world
slug=java-17-what-s-new
\`\`\``,
      starter: String.raw`import java.io.*;
import java.util.*;

public class Main {
    static String slug(String title) {
        // TODO
        return title;
    }

    public static void main(String[] args) throws IOException {
        BufferedReader in = new BufferedReader(new InputStreamReader(System.in));
        String line;
        while ((line = in.readLine()) != null) {
            String s = slug(line);
            System.out.println("slug=" + (s.isEmpty() ? "(empty)" : s));
        }
    }
}
`,
      solution: String.raw`import java.io.*;
import java.util.*;

public class Main {
    static String slug(String title) {
        String s = title.trim().toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-");
        if (s.startsWith("-")) s = s.substring(1);
        if (s.endsWith("-")) s = s.substring(0, s.length() - 1);
        return s;
    }

    public static void main(String[] args) throws IOException {
        BufferedReader in = new BufferedReader(new InputStreamReader(System.in));
        String line;
        while ((line = in.readLine()) != null) {
            String s = slug(line);
            System.out.println("slug=" + (s.isEmpty() ? "(empty)" : s));
        }
    }
}
`,
      hints: ["replaceAll takes a regex: [^a-z0-9]+ is one or more characters that are not letters or digits.", "After collapsing, at most one dash can sit at each end — strip it."],
      cases: [
        { stdin: "  Hello, World!  \nJava 17: What's New?\n", expected: "slug=hello-world\nslug=java-17-what-s-new\n" },
        { stdin: "---\nA\n", expected: "slug=(empty)\nslug=a\n" },
        { stdin: "  Multiple   spaces & symbols!!! \n", expected: "slug=multiple-spaces-symbols\n", hidden: true },
      ],
    },
  ],
  stringbuilder: [
    {
      title: "Devowel, then mirror",
      prompt: `Read one line of words separated by single spaces. Print two lines: first the sentence with every vowel (\`aeiouAEIOU\`) removed — build it with a \`StringBuilder\`, appending only consonants; second the original sentence with **each word reversed in place** (word order unchanged) using \`new StringBuilder(word).reverse()\`. Words that lose all their letters disappear from the first line (collapse the spaces).

Example: \`Java is fun\` →
\`\`\`
Jv s fn
avaJ si nuf
\`\`\``,
      starter: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        String line = new Scanner(System.in).nextLine();
        // TODO
    }
}
`,
      solution: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        String line = new Scanner(System.in).nextLine();
        StringBuilder noVowels = new StringBuilder();
        StringBuilder mirrored = new StringBuilder();
        for (String word : line.trim().split(" ")) {
            StringBuilder w = new StringBuilder();
            for (char c : word.toCharArray()) {
                if ("aeiouAEIOU".indexOf(c) < 0) w.append(c);
            }
            if (w.length() > 0) {
                if (noVowels.length() > 0) noVowels.append(' ');
                noVowels.append(w);
            }
            if (mirrored.length() > 0) mirrored.append(' ');
            mirrored.append(new StringBuilder(word).reverse());
        }
        System.out.println(noVowels);
        System.out.println(mirrored);
    }
}
`,
      hints: ["indexOf(c) < 0 on the vowel string is a compact 'is not a vowel'.", "Append a space only before the second and later words to avoid a trailing space."],
      cases: [
        { stdin: "Java is fun\n", expected: "Jv s fn\navaJ si nuf\n" },
        { stdin: "a e i\n", expected: "\na e i\n" },
        { stdin: "StringBuilder beats concat\n", expected: "StrngBldr bts cnct\nredliuBgnirtS staeb tacnoc\n", hidden: true },
      ],
    },
  ],
  "formatting-and-text-blocks": [
    {
      title: "Aligned ledger",
      prompt: `Read an integer \`n\` and \`n\` lines \`<label> <amount>\` (amount an integer, possibly negative). Print each as \`%-12s%,12d\` — label left-aligned in 12, amount right-aligned in 12 with thousands separators — then a rule of 24 dashes and a \`TOTAL\` row in the same format. Use \`Locale.ROOT\` so the separator is a comma.

Example: \`2\` then \`rent -12500\`, \`salary 1250000\` →
\`\`\`
rent             -12,500
salary         1,250,000
------------------------
TOTAL          1,237,500
\`\`\``,
      starter: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        long total = 0;
        for (int i = 0; i < n; i++) {
            String label = in.next();
            long amount = in.nextLong();
            // TODO
        }
        // TODO
    }
}
`,
      solution: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        long total = 0;
        for (int i = 0; i < n; i++) {
            String label = in.next();
            long amount = in.nextLong();
            total += amount;
            System.out.println(String.format(Locale.ROOT, "%-12s%,12d", label, amount));
        }
        System.out.println("-".repeat(24));
        System.out.println(String.format(Locale.ROOT, "%-12s%,12d", "TOTAL", total));
    }
}
`,
      hints: ["%-12s pads on the right; %,12d groups thousands and pads on the left.", "\"-\".repeat(24) draws the rule."],
      cases: [
        { stdin: "2\nrent -12500\nsalary 1250000\n", expected: "rent             -12,500\nsalary         1,250,000\n------------------------\nTOTAL          1,237,500\n" },
        { stdin: "1\ncoffee 350\n", expected: "coffee               350\n------------------------\nTOTAL                350\n" },
        { stdin: "3\na 1\nb -1\nc 1000000000\n", expected: "a                      1\nb                     -1\nc           1,000,000,000\n------------------------\nTOTAL       1,000,000,000\n", hidden: true },
      ],
    },
  ],
  "chars-and-unicode": [
    {
      title: "Character census",
      prompt: `Read one line. Using the \`Character\` methods, count upper-case letters, lower-case letters, digits, whitespace and everything else, and print \`upper=<n> lower=<n> digits=<n> spaces=<n> other=<n>\`. Then print \`chars=<s.length()> codePoints=<s.codePointCount(0, s.length())>\` — they differ when a character needs two \`char\`s.

Example: \`Hello World 42!\` →
\`\`\`
upper=2 lower=8 digits=2 spaces=2 other=1
chars=15 codePoints=15
\`\`\``,
      starter: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        String s = in.hasNextLine() ? in.nextLine() : "";
        // TODO
    }
}
`,
      solution: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        String s = in.hasNextLine() ? in.nextLine() : "";
        int upper = 0, lower = 0, digits = 0, spaces = 0, other = 0;
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (Character.isUpperCase(c)) upper++;
            else if (Character.isLowerCase(c)) lower++;
            else if (Character.isDigit(c)) digits++;
            else if (Character.isWhitespace(c)) spaces++;
            else other++;
        }
        System.out.println("upper=" + upper + " lower=" + lower + " digits=" + digits + " spaces=" + spaces + " other=" + other);
        System.out.println("chars=" + s.length() + " codePoints=" + s.codePointCount(0, s.length()));
    }
}
`,
      hints: ["The Character.isX methods know about Unicode — é is a lower-case letter.", "An emoji is one code point but two chars; both halves count as 'other' here."],
      cases: [
        { stdin: "Hello World 42!\n", expected: "upper=2 lower=8 digits=2 spaces=2 other=1\nchars=15 codePoints=15\n" },
        { stdin: "héllo Wörld\n", expected: "upper=1 lower=9 digits=0 spaces=1 other=0\nchars=11 codePoints=11\n" },
        { stdin: "hi 😀\n", expected: "upper=0 lower=2 digits=0 spaces=1 other=2\nchars=5 codePoints=4\n", hidden: true },
      ],
    },
  ],
  regex: [
    {
      title: "Dates and masks",
      prompt: `Read lines until end of input. For every date of the form \`yyyy-mm-dd\` found in a line (pattern \`(\\d{4})-(\\d{2})-(\\d{2})\` with three groups) print \`date: y=<yyyy> m=<mm> d=<dd>\`. Then print the line with every run of digits replaced by a single \`#\` (\`replaceAll("\\\\d+", "#")\`), prefixed \`masked: \`.

Example input
\`\`\`
Paid 2024-03-01 and 2024-04-15, invoice 88
\`\`\`
→
\`\`\`
date: y=2024 m=03 d=01
date: y=2024 m=04 d=15
masked: Paid #-#-# and #-#-#, invoice #
\`\`\``,
      starter: String.raw`import java.io.*;
import java.util.regex.*;

public class Main {
    public static void main(String[] args) throws IOException {
        Pattern date = Pattern.compile("(\\d{4})-(\\d{2})-(\\d{2})");
        BufferedReader in = new BufferedReader(new InputStreamReader(System.in));
        String line;
        while ((line = in.readLine()) != null) {
            // TODO
        }
    }
}
`,
      solution: String.raw`import java.io.*;
import java.util.regex.*;

public class Main {
    public static void main(String[] args) throws IOException {
        Pattern date = Pattern.compile("(\\d{4})-(\\d{2})-(\\d{2})");
        BufferedReader in = new BufferedReader(new InputStreamReader(System.in));
        String line;
        while ((line = in.readLine()) != null) {
            Matcher m = date.matcher(line);
            while (m.find()) {
                System.out.println("date: y=" + m.group(1) + " m=" + m.group(2) + " d=" + m.group(3));
            }
            System.out.println("masked: " + line.replaceAll("\\d+", "#"));
        }
    }
}
`,
      hints: ["Matcher.find() in a loop walks every match; group(i) reads a capture.", "replaceAll works on the whole line with a fresh pattern."],
      cases: [
        { stdin: "Paid 2024-03-01 and 2024-04-15, invoice 88\n", expected: "date: y=2024 m=03 d=01\ndate: y=2024 m=04 d=15\nmasked: Paid #-#-# and #-#-#, invoice #\n" },
        { stdin: "no dates here\n", expected: "masked: no dates here\n" },
        { stdin: "1999-12-31T23:59\nabc123def456\n", expected: "date: y=1999 m=12 d=31\nmasked: #-#-#T#:#\nmasked: abc#def#\n", hidden: true },
      ],
    },
  ],
  "strings-checkpoint": [
    {
      title: "Word wrap",
      prompt: `Read an integer width \`w\` on the first line, then text on the remaining lines. Re-flow the words (split on any whitespace) greedily into lines of at most \`w\` characters, one space between words; a word longer than \`w\` goes on a line of its own. Print the lines, then \`lines=<count>\`.

Example: \`12\` then \`the quick brown fox jumps over the lazy dog\` →
\`\`\`
the quick
brown fox
jumps over
the lazy dog
lines=4
\`\`\``,
      starter: String.raw`import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader in = new BufferedReader(new InputStreamReader(System.in));
        int w = Integer.parseInt(in.readLine().trim());
        StringBuilder text = new StringBuilder();
        String line;
        while ((line = in.readLine()) != null) text.append(line).append(' ');
        String[] words = text.toString().trim().split("\\s+");
        // TODO
    }
}
`,
      solution: String.raw`import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader in = new BufferedReader(new InputStreamReader(System.in));
        int w = Integer.parseInt(in.readLine().trim());
        StringBuilder text = new StringBuilder();
        String line;
        while ((line = in.readLine()) != null) text.append(line).append(' ');
        String[] words = text.toString().trim().split("\\s+");
        StringBuilder current = new StringBuilder();
        int lines = 0;
        for (String word : words) {
            if (word.isEmpty()) continue;
            if (current.length() > 0 && current.length() + 1 + word.length() > w) {
                System.out.println(current);
                lines++;
                current.setLength(0);
            }
            if (current.length() > 0) current.append(' ');
            current.append(word);
        }
        if (current.length() > 0) {
            System.out.println(current);
            lines++;
        }
        System.out.println("lines=" + lines);
    }
}
`,
      hints: ["Before adding a word, check whether current + space + word would exceed w; if so, flush.", "setLength(0) empties a StringBuilder without allocating a new one."],
      cases: [
        { stdin: "12\nthe quick brown fox jumps over the lazy dog\n", expected: "the quick\nbrown fox\njumps over\nthe lazy dog\nlines=4\n" },
        { stdin: "5\nabcdefgh ij\n", expected: "abcdefgh\nij\nlines=2\n" },
        { stdin: "20\none\ntwo three\n\nfour\n", expected: "one two three four\nlines=1\n", hidden: true },
      ],
    },
  ],
};

export default more;
