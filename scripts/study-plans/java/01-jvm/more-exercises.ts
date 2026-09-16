import type { ExerciseSource } from "../../dsl.js";

/** A second program per lesson (a third for the checkpoint) — see defineModule's `extras`. */
const more: Record<string, ExerciseSource[]> = {
  "what-is-java": [
    {
      title: "Greet everyone",
      prompt: `Read an integer \`n\` and \`n\` names, one per token. Print \`Hello, <name>!\` for each, in order, and then \`Greeted <n> people.\` — or \`Greeted 1 person.\` when \`n\` is 1. Every Java program starts as a class with a \`main\`; this one also has a loop and a decision.

Example: \`2\` then \`Ada Linus\` →
\`\`\`
Hello, Ada!
Hello, Linus!
Greeted 2 people.
\`\`\``,
      starter: String.raw`import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        // TODO
    }
}
`,
      solution: String.raw`import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            System.out.println("Hello, " + in.next() + "!");
        }
        System.out.println("Greeted " + n + (n == 1 ? " person." : " people."));
    }
}
`,
      hints: ["A for loop from 0 to n reads one name per iteration.", "The ternary operator picks the word: n == 1 ? \"person\" : \"people\"."],
      cases: [
        { stdin: "2\nAda Linus\n", expected: "Hello, Ada!\nHello, Linus!\nGreeted 2 people.\n" },
        { stdin: "1\nGrace\n", expected: "Hello, Grace!\nGreeted 1 person.\n" },
        { stdin: "0\n", expected: "Greeted 0 people.\n", hidden: true },
      ],
    },
  ],
  "jdk-jre-jvm": [
    {
      title: "Which layer?",
      prompt: `Read an integer \`n\` and \`n\` names of things that ship with Java. Print \`<name>: <layer>\` where the layer is \`JDK\` for developer tools (\`javac\`, \`jshell\`, \`jar\`, \`javadoc\`, \`jdb\`), \`JRE\` for the class library (\`java.util\`, \`java.lang\`, \`java.io\`, \`java.time\`) and \`JVM\` for the engine (\`garbage-collector\`, \`jit\`, \`class-loader\`, \`bytecode-verifier\`, \`interpreter\`). Anything else is \`unknown\`. Use a \`switch\`.

Example: \`3\` then \`javac jit java.util\` →
\`\`\`
javac: JDK
jit: JVM
java.util: JRE
\`\`\``,
      starter: String.raw`import java.util.Scanner;

public class Main {
    static String layer(String name) {
        // TODO: switch on the name
        return "unknown";
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            String name = in.next();
            System.out.println(name + ": " + layer(name));
        }
    }
}
`,
      solution: String.raw`import java.util.Scanner;

public class Main {
    static String layer(String name) {
        return switch (name) {
            case "javac", "jshell", "jar", "javadoc", "jdb" -> "JDK";
            case "java.util", "java.lang", "java.io", "java.time" -> "JRE";
            case "garbage-collector", "jit", "class-loader", "bytecode-verifier", "interpreter" -> "JVM";
            default -> "unknown";
        };
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            String name = in.next();
            System.out.println(name + ": " + layer(name));
        }
    }
}
`,
      hints: ["A switch expression with comma-separated case labels groups several names on one arrow.", "default catches everything you did not list."],
      cases: [
        { stdin: "3\njavac jit java.util\n", expected: "javac: JDK\njit: JVM\njava.util: JRE\n" },
        { stdin: "2\nmaven jshell\n", expected: "maven: unknown\njshell: JDK\n" },
        { stdin: "4\nclass-loader java.time jar interpreter\n", expected: "class-loader: JVM\njava.time: JRE\njar: JDK\ninterpreter: JVM\n", hidden: true },
      ],
    },
  ],
  "compile-and-run": [
    {
      title: "A tiny stack machine",
      prompt: `The JVM is a stack machine: bytecode pushes values onto an operand stack and instructions pop their inputs from it. Simulate one. Read an integer \`n\` and \`n\` instructions: \`push <int>\`, \`add\`, \`sub\`, \`mul\` (each pops two values \`b\` then \`a\` and pushes \`a op b\`), \`dup\` (pushes a copy of the top) and \`print\` (prints the top without popping). Use an \`ArrayDeque<Integer>\`.

Example: \`6\` then \`push 6\`, \`push 7\`, \`mul\`, \`print\`, \`push 2\`, \`sub\` then \`print\` (7 instructions) →
\`\`\`
42
40
\`\`\``,
      starter: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        Deque<Integer> stack = new ArrayDeque<>();
        for (int i = 0; i < n; i++) {
            String op = in.next();
            // TODO
        }
    }
}
`,
      solution: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        Deque<Integer> stack = new ArrayDeque<>();
        for (int i = 0; i < n; i++) {
            String op = in.next();
            switch (op) {
                case "push" -> stack.push(in.nextInt());
                case "dup" -> stack.push(stack.peek());
                case "print" -> System.out.println(stack.peek());
                default -> {
                    int b = stack.pop(), a = stack.pop();
                    stack.push(switch (op) { case "add" -> a + b; case "sub" -> a - b; default -> a * b; });
                }
            }
        }
    }
}
`,
      hints: ["Pop b first, then a — the second operand is on top.", "print peeks; it must not consume the value."],
      cases: [
        { stdin: "7\npush 6\npush 7\nmul\nprint\npush 2\nsub\nprint\n", expected: "42\n40\n" },
        { stdin: "4\npush 5\ndup\nadd\nprint\n", expected: "10\n" },
        { stdin: "6\npush 10\npush 3\nsub\npush 4\nmul\nprint\n", expected: "28\n", hidden: true },
      ],
    },
  ],
  "anatomy-of-a-program": [
    {
      title: "Comment stripper",
      prompt: `Read lines of Java-like source until end of input. Remove every \`//\` comment (from the two slashes to the end of the line — assume no string literals contain \`//\`), drop lines that are then blank, and print the remaining lines with trailing whitespace trimmed. Finally print \`braces balanced: <true|false>\` by counting \`{\` against \`}\` in the kept text.

Example input
\`\`\`
public class Main { // the class
    // a comment line
    int x = 1;   // trailing
}
\`\`\`
→
\`\`\`
public class Main {
    int x = 1;
}
braces balanced: true
\`\`\``,
      starter: String.raw`import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader in = new BufferedReader(new InputStreamReader(System.in));
        String line;
        int depth = 0;
        while ((line = in.readLine()) != null) {
            // TODO
        }
        System.out.println("braces balanced: " + (depth == 0));
    }
}
`,
      solution: String.raw`import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader in = new BufferedReader(new InputStreamReader(System.in));
        String line;
        int depth = 0;
        while ((line = in.readLine()) != null) {
            int at = line.indexOf("//");
            String code = (at >= 0 ? line.substring(0, at) : line).stripTrailing();
            if (code.isBlank()) continue;
            for (char c : code.toCharArray()) {
                if (c == '{') depth++;
                else if (c == '}') depth--;
            }
            System.out.println(code);
        }
        System.out.println("braces balanced: " + (depth == 0));
    }
}
`,
      hints: ["indexOf(\"//\") finds the comment; substring(0, at) keeps the code before it.", "stripTrailing removes the spaces that were in front of the comment."],
      cases: [
        { stdin: "public class Main { // the class\n    // a comment line\n    int x = 1;   // trailing\n}\n", expected: "public class Main {\n    int x = 1;\n}\nbraces balanced: true\n" },
        { stdin: "void f() {\n  if (x) {\n// nothing\n", expected: "void f() {\n  if (x) {\nbraces balanced: false\n" },
        { stdin: "// only comments\n\n   // more\n", expected: "braces balanced: true\n", hidden: true },
      ],
    },
  ],
  "packages-and-imports": [
    {
      title: "Import organiser",
      prompt: `Read an integer \`n\` and \`n\` fully qualified class names. Print the \`import\` statements a formatter would produce: duplicates removed, sorted alphabetically, \`java.*\` first, then \`javax.*\`, then everything else, with a blank line between non-empty groups, then \`imports: <count>\`. Classes from \`java.lang\` need no import and are skipped.

Example: \`5\` then \`java.util.List\`, \`com.acme.Order\`, \`java.io.File\`, \`java.util.List\`, \`java.lang.String\` →
\`\`\`
import java.io.File;
import java.util.List;

import com.acme.Order;
imports: 3
\`\`\``,
      starter: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        TreeSet<String> java = new TreeSet<>(), javax = new TreeSet<>(), other = new TreeSet<>();
        for (int i = 0; i < n; i++) {
            String fqcn = in.next();
            // TODO: skip java.lang, sort into a group
        }
        // TODO: print groups with a blank line between non-empty ones
    }
}
`,
      solution: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        TreeSet<String> java = new TreeSet<>(), javax = new TreeSet<>(), other = new TreeSet<>();
        for (int i = 0; i < n; i++) {
            String fqcn = in.next();
            if (fqcn.startsWith("java.lang.") && fqcn.indexOf('.', "java.lang.".length()) < 0) continue;
            if (fqcn.startsWith("java.")) java.add(fqcn);
            else if (fqcn.startsWith("javax.")) javax.add(fqcn);
            else other.add(fqcn);
        }
        boolean printed = false;
        for (TreeSet<String> group : List.of(java, javax, other)) {
            if (group.isEmpty()) continue;
            if (printed) System.out.println();
            for (String c : group) System.out.println("import " + c + ";");
            printed = true;
        }
        System.out.println("imports: " + (java.size() + javax.size() + other.size()));
    }
}
`,
      hints: ["A TreeSet sorts and deduplicates in one go.", "java.lang.String needs no import, but java.lang.reflect.Method does — check for a further dot."],
      cases: [
        { stdin: "5\njava.util.List\ncom.acme.Order\njava.io.File\njava.util.List\njava.lang.String\n", expected: "import java.io.File;\nimport java.util.List;\n\nimport com.acme.Order;\nimports: 3\n" },
        { stdin: "2\njava.lang.Math\njava.lang.Object\n", expected: "imports: 0\n" },
        { stdin: "3\njavax.swing.JFrame\norg.junit.Test\njava.lang.reflect.Method\n", expected: "import java.lang.reflect.Method;\n\nimport javax.swing.JFrame;\n\nimport org.junit.Test;\nimports: 3\n", hidden: true },
      ],
    },
  ],
  "input-and-output": [
    {
      title: "Lines, reversed and numbered",
      prompt: `Read every line of standard input until the end (there may be blank lines — keep them). Print the lines in reverse order, each prefixed with its **original** line number right-aligned in 3 characters and a colon, then \`total lines: <n>\`. Use a \`BufferedReader\` and \`printf\`.

Example input
\`\`\`
alpha
beta

gamma
\`\`\`
→
\`\`\`
  4: gamma
  3:
  2: beta
  1: alpha
total lines: 4
\`\`\``,
      starter: String.raw`import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader in = new BufferedReader(new InputStreamReader(System.in));
        List<String> lines = new ArrayList<>();
        // TODO: read all, then print in reverse
    }
}
`,
      solution: String.raw`import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader in = new BufferedReader(new InputStreamReader(System.in));
        List<String> lines = new ArrayList<>();
        String line;
        while ((line = in.readLine()) != null) lines.add(line);
        for (int i = lines.size() - 1; i >= 0; i--) {
            System.out.printf("%3d: %s%n", i + 1, lines.get(i));
        }
        System.out.println("total lines: " + lines.size());
    }
}
`,
      hints: ["readLine returns null at the end — that is the loop condition.", "%3d right-aligns the number in three columns."],
      cases: [
        { stdin: "alpha\nbeta\n\ngamma\n", expected: "  4: gamma\n  3: \n  2: beta\n  1: alpha\ntotal lines: 4\n" },
        { stdin: "one\n", expected: "  1: one\ntotal lines: 1\n" },
        { stdin: "a\nb\nc\nd\ne\nf\ng\nh\ni\nj\n", expected: " 10: j\n  9: i\n  8: h\n  7: g\n  6: f\n  5: e\n  4: d\n  3: c\n  2: b\n  1: a\ntotal lines: 10\n", hidden: true },
      ],
    },
  ],
  "jvm-checkpoint": [
    {
      title: "FizzBuzz, your way",
      prompt: `Read an integer \`n\`, two divisors \`a\` and \`b\`, and two words \`wa\` and \`wb\`. For each number from 1 to \`n\` print the number — or \`wa\` if it is divisible by \`a\`, \`wb\` if divisible by \`b\`, and \`wa\` followed by \`wb\` (no space) if divisible by both. Then print \`replaced: <how many numbers were replaced by words>\`.

Example: \`6 2 3 Fizz Buzz\` →
\`\`\`
1
Fizz
Buzz
Fizz
5
FizzBuzz
replaced: 4
\`\`\``,
      starter: String.raw`import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt(), a = in.nextInt(), b = in.nextInt();
        String wa = in.next(), wb = in.next();
        // TODO
    }
}
`,
      solution: String.raw`import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt(), a = in.nextInt(), b = in.nextInt();
        String wa = in.next(), wb = in.next();
        int replaced = 0;
        for (int i = 1; i <= n; i++) {
            String out = "";
            if (i % a == 0) out += wa;
            if (i % b == 0) out += wb;
            if (out.isEmpty()) System.out.println(i);
            else { System.out.println(out); replaced++; }
        }
        System.out.println("replaced: " + replaced);
    }
}
`,
      hints: ["Build the word by appending: divisible by a adds wa, by b adds wb — both conditions are independent.", "An empty result means neither divided; print the number."],
      cases: [
        { stdin: "6 2 3 Fizz Buzz\n", expected: "1\nFizz\nBuzz\nFizz\n5\nFizzBuzz\nreplaced: 4\n" },
        { stdin: "5 5 7 Five Seven\n", expected: "1\n2\n3\n4\nFive\nreplaced: 1\n" },
        { stdin: "10 3 5 Fizz Buzz\n", expected: "1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\nreplaced: 5\n", hidden: true },
      ],
    },
  ],
};

export default more;
