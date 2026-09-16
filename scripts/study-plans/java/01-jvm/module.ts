import { defineModule } from "../../dsl.js";
import more from "./more-exercises.js";

const IO_STARTER = String.raw`import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringBuilder out = new StringBuilder();
        // TODO: read the input, compute, append to out
        System.out.print(out);
    }
}
`;

export default defineModule(import.meta.url, {
  slug: "jvm",
  title: "Java & the JVM",
  blurb: "What Java is, the JDK/JRE/JVM layers, compiling and running, program anatomy, packages, and console I/O.",
  icon: "cpu",
  overview: `Before writing Java well you need to know what happens between pressing Run and seeing output: how source becomes bytecode, what the virtual machine does with it, and how a program is put together from classes, members and statements.

This module builds that foundation. You will compile and run by hand, read a disassembled class file, learn the three-layer JDK/JRE/JVM picture that every interviewer asks about, and master the console input and output that every exercise in this track uses.

By the end you can explain the compile-and-run pipeline, name where locals and objects live, read a compile error, and write a program that reads any input format quickly and correctly.`,
  lessons: [
    {
      slug: "what-is-java",
      file: "01-what-is-java.md",
      exercises: [
        {
          title: "Hello, you",
          prompt: `Read one line — a name — from standard input and print \`Hello, <name>!\`.

**Input:** a single line containing a name (it may contain spaces).
**Output:** \`Hello, \` followed by the name and \`!\`.

The class must be called \`Main\`. Use \`BufferedReader.readLine()\` to read the line.`,
          starter: String.raw`import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String name = br.readLine();
        // TODO: print the greeting
    }
}
`,
          solution: String.raw`import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String name = br.readLine();
        System.out.println("Hello, " + name + "!");
    }
}
`,
          hints: ["String concatenation with + joins the pieces.", "println adds the newline for you."],
          cases: [
            { stdin: "Ada\n", expected: "Hello, Ada!\n" },
            { stdin: "James Gosling\n", expected: "Hello, James Gosling!\n" },
            { stdin: "JVM\n", expected: "Hello, JVM!\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does `javac` produce from a `.java` file?",
          options: ["Native machine code for the current CPU", "Bytecode in a `.class` file", "An executable `.exe`/`.bin` file", "A JAR file"],
          answer: 1,
          explanation: "`javac` compiles source to **bytecode** — instructions for the JVM, not for any real CPU. Native code is produced later, at run time, by the JIT compiler. JARs are made with the `jar` tool.",
        },
        {
          prompt: "Which statement about Java's type system is correct?",
          options: ["Every value in Java is an object", "Variables are dynamically typed; types are checked at run time", "Java is statically typed, with eight primitive types that are not objects", "Java has no primitives since Java 5 autoboxing"],
          answer: 2,
          explanation: "Java checks types at compile time (static typing). Eight primitive types (`byte`, `short`, `int`, `long`, `float`, `double`, `char`, `boolean`) hold values directly and are not objects; autoboxing converts between them and wrapper objects but does not remove them.",
        },
        {
          prompt: "Why is a long-running Java server typically faster after a few minutes than in its first seconds?",
          options: ["The garbage collector has freed memory", "The JIT compiler has compiled hot methods to optimised native code", "The class library is cached on disk", "The operating system prioritises older processes"],
          answer: 1,
          explanation: "Bytecode is interpreted at first; the JIT compiles frequently executed methods to native code, optimised using behaviour observed at run time. That warm-up is why start-up feels slow and steady state is fast.",
        },
        {
          prompt: "Which of these are the LTS (long-term support) Java versions?",
          options: ["9, 10, 12, 14", "8, 11, 17, 21", "7, 9, 13, 19", "Every even-numbered version"],
          answer: 1,
          explanation: "Since 2018 a version ships every six months and an LTS every two years: 8, 11, 17 and 21 are the LTS releases production systems run.",
        },
        {
          prompt: "A file contains `public class Greeter { … }`. What must the file be named?",
          options: ["Anything ending in `.java`", "`greeter.java`", "`Greeter.java`", "`Greeter.class`"],
          answer: 2,
          explanation: "A public top-level class must live in a file with exactly its name plus `.java`; the compiler rejects any other name. `Greeter.class` is what `javac` produces, not what you write.",
        },
      ],
    },
    {
      slug: "jdk-jre-jvm",
      file: "02-jdk-jre-jvm.md",
      exercises: [
        {
          title: "Is it LTS?",
          prompt: `Read three integers — a Java version's major, minor and patch numbers — and print the version as \`major.minor.patch\`, then on the next line \`LTS\` if the major version is 8, 11, 17 or 21, otherwise \`feature release\`.

**Input:** one line with three integers separated by spaces.
**Output:** two lines.

Example: input \`17 0 2\` → output
\`\`\`
17.0.2
LTS
\`\`\``,
          starter: IO_STARTER,
          solution: String.raw`import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String[] parts = br.readLine().trim().split("\\s+");
        int major = Integer.parseInt(parts[0]);
        int minor = Integer.parseInt(parts[1]);
        int patch = Integer.parseInt(parts[2]);
        System.out.println(major + "." + minor + "." + patch);
        if (major == 8 || major == 11 || major == 17 || major == 21) {
            System.out.println("LTS");
        } else {
            System.out.println("feature release");
        }
    }
}
`,
          hints: ["Split the line on whitespace and parse each piece with Integer.parseInt.", "Combine the four LTS checks with ||."],
          cases: [
            { stdin: "17 0 2\n", expected: "17.0.2\nLTS\n" },
            { stdin: "18 0 2\n", expected: "18.0.2\nfeature release\n" },
            { stdin: "8 0 392\n", expected: "8.0.392\nLTS\n", hidden: true },
            { stdin: "21 0 1\n", expected: "21.0.1\nLTS\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which layer contains the class library (`java.util`, `java.io`, …)?",
          options: ["Only the JDK", "The JRE (and therefore the JDK)", "Only the JVM", "None — the library is downloaded on demand"],
          answer: 1,
          explanation: "The JRE is the JVM **plus** the class library. The JDK contains the JRE plus development tools, so it has the library too. The JVM alone executes bytecode and has no library.",
        },
        {
          prompt: "\"Java is platform independent.\" Which precise version of this statement is true?",
          options: ["The JVM is platform independent", "Bytecode is platform independent; the JVM is platform specific", "Both bytecode and the JVM are platform independent", "Neither — Java must be recompiled per platform"],
          answer: 1,
          explanation: "There is a different JVM build for each OS and CPU. That is exactly what lets the same `.class` file run everywhere: the platform-specific JVM makes the bytecode portable.",
        },
        {
          prompt: "Where does an object created with `new` live?",
          options: ["On the stack of the thread that created it", "In the method area", "On the heap, shared by all threads", "In the PC register"],
          answer: 2,
          explanation: "All objects and arrays live on the heap. A thread's stack holds its method frames — local variables, including *references* to heap objects, but never the objects themselves.",
        },
        {
          prompt: "Which tool would you use to see the bytecode inside a compiled class?",
          options: ["`javac -v`", "`javap -c`", "`jar -t`", "`jshell`"],
          answer: 1,
          explanation: "`javap` is the class-file disassembler; `-c` prints the bytecode of each method. `jar -t` lists a JAR's entries, `jshell` is the REPL.",
        },
        {
          prompt: "What does the JIT compiler do?",
          options: ["Compiles `.java` source to bytecode before the program runs", "Compiles hot bytecode to native machine code while the program runs", "Checks that bytecode is well-formed before execution", "Reclaims memory from unreachable objects"],
          answer: 1,
          explanation: "The **J**ust-**I**n-**T**ime compiler translates frequently executed bytecode into native code at run time. `javac` compiles source; the verifier checks bytecode; the garbage collector reclaims memory.",
        },
      ],
    },
    {
      slug: "compile-and-run",
      file: "03-compile-and-run.md",
      exercises: [
        {
          title: "Echo the arguments",
          prompt: `When you run \`java Main a b c\`, the launcher hands \`main\` the array \`{"a", "b", "c"}\`. Simulate that from standard input: read an integer \`n\`, then \`n\` tokens (whitespace-separated, possibly across several lines), and print each one as \`args[i] = token\`, then a final line \`args.length = n\`.

**Input:** \`n\`, then \`n\` tokens.
**Output:** \`n + 1\` lines.

Example: input \`3 one two three\` →
\`\`\`
args[0] = one
args[1] = two
args[2] = three
args.length = 3
\`\`\``,
          starter: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        // TODO: read n tokens with in.next() and print them
    }
}
`,
          solution: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            String token = in.next();
            System.out.println("args[" + i + "] = " + token);
        }
        System.out.println("args.length = " + n);
    }
}
`,
          hints: ["Scanner.next() returns the next whitespace-separated token regardless of line breaks.", "A for loop from 0 to n-1 gives you the index for the label."],
          cases: [
            { stdin: "3 one two three\n", expected: "args[0] = one\nargs[1] = two\nargs[2] = three\nargs.length = 3\n" },
            { stdin: "2\n-Xmx512m\nHello\n", expected: "args[0] = -Xmx512m\nargs[1] = Hello\nargs.length = 2\n" },
            { stdin: "0\n", expected: "args.length = 0\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "You compiled `Hello.java` and want to run it. Which command is correct?",
          options: ["`java Hello.class`", "`java Hello.java`", "`java Hello`", "`javac Hello`"],
          answer: 2,
          explanation: "`java` takes a **class name** and searches the classpath for `Hello.class`. `java Hello.java` also works since Java 11 (compile-and-run in one step) but does not use the compiled file; `java Hello.class` looks for a class literally named `Hello.class`.",
        },
        {
          prompt: "Your program throws `NoClassDefFoundError` for a class that compiled fine yesterday. What is the most likely cause?",
          options: ["A syntax error in that class", "The class is missing from the run-time classpath, or its static initialiser failed", "The class has no `main` method", "The class is not `public`"],
          answer: 1,
          explanation: "`NoClassDefFoundError` is thrown when a class present at compile time cannot be found (or failed to initialise) at run time — a classpath problem. Syntax errors never reach run time; a missing `main` gives a different launcher error.",
        },
        {
          prompt: "What separates classpath entries on Linux/macOS?",
          options: ["`;`", "`,`", "`:`", "A space"],
          answer: 2,
          explanation: "Colon on Unix-like systems, semicolon on Windows. Getting this wrong makes the whole classpath one nonexistent path.",
        },
        {
          prompt: "What does `-Xmx512m` do?",
          options: ["Sets the thread stack size to 512 MB", "Sets the maximum heap size to 512 MB", "Enables 512 MB of class data sharing", "Limits the program to 512 MB of disk"],
          answer: 1,
          explanation: "`-Xmx` caps the heap. `-Xss` is the per-thread stack size. Exceeding the heap cap gives `OutOfMemoryError: Java heap space`.",
        },
        {
          prompt: "A `.java` file contains a public class `A` and a non-public class `B`. After compiling, what is on disk?",
          options: ["`A.class` only, containing both", "`A.class` and `B.class`", "`A.class` and `A$B.class`", "A compile error — one class per file"],
          answer: 1,
          explanation: "Every top-level class becomes its own `.class` file. `A$B.class` would be the name for a *nested* class `B` inside `A`. Only *public* top-level classes are limited to one per file.",
        },
      ],
    },
    {
      slug: "anatomy-of-a-program",
      file: "04-anatomy-of-a-program.md",
      exercises: [
        {
          title: "A bank account",
          prompt: `Complete the \`BankAccount\` class and the program around it. Read a starting balance, then an integer \`n\`, then \`n\` deposits (each a positive integer, one per line). Apply every deposit through the \`deposit\` method and print \`Balance: <amount>\`.

**Input:** starting balance, \`n\`, then \`n\` deposits.
**Output:** one line.

Example: input \`100 2 50 25\` → \`Balance: 175\``,
          starter: String.raw`import java.util.*;

class BankAccount {
    private long balance;

    BankAccount(long opening) {
        // TODO: store the opening balance
    }

    void deposit(long amount) {
        // TODO: add the amount
    }

    long balance() {
        return balance;
    }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        long opening = in.nextLong();
        int n = in.nextInt();
        BankAccount account = new BankAccount(opening);
        // TODO: read n deposits and apply them
        System.out.println("Balance: " + account.balance());
    }
}
`,
          solution: String.raw`import java.util.*;

class BankAccount {
    private long balance;

    BankAccount(long opening) {
        this.balance = opening;
    }

    void deposit(long amount) {
        balance += amount;
    }

    long balance() {
        return balance;
    }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        long opening = in.nextLong();
        int n = in.nextInt();
        BankAccount account = new BankAccount(opening);
        for (int i = 0; i < n; i++) {
            account.deposit(in.nextLong());
        }
        System.out.println("Balance: " + account.balance());
    }
}
`,
          hints: ["Inside the constructor, `this.balance = opening;` stores the field.", "`balance += amount;` is shorthand for `balance = balance + amount;`."],
          cases: [
            { stdin: "100 2\n50\n25\n", expected: "Balance: 175\n" },
            { stdin: "0 3\n1\n2\n3\n", expected: "Balance: 6\n" },
            { stdin: "5000000000 1\n5000000000\n", expected: "Balance: 10000000000\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which of these is a valid statement on its own?",
          options: ["`x + 1;`", "`x == 1;`", "`x++;`", "`\"hello\";`"],
          answer: 2,
          explanation: "Only assignments, increments/decrements, method calls and object creation may stand alone as statements. `x + 1;` and `x == 1;` are expressions with no effect and the compiler reports \"not a statement\".",
        },
        {
          prompt: "Which `main` signature will the launcher accept as an entry point?",
          options: ["`public void main(String[] args)`", "`static void main(String[] args)`", "`public static void main(String... args)`", "`public static int main(String[] args)`"],
          answer: 2,
          explanation: "The entry point must be `public`, `static`, return `void`, and take a `String[]` — and varargs `String...` is compiled to exactly that array type. Missing `public` or `static`, or a non-void return, means \"Main method not found\".",
        },
        {
          prompt: "`BankAccount a = new BankAccount(); BankAccount b = a; b.deposit(100);` What does `a.balance()` return afterwards (starting from 0)?",
          options: ["0 — `b` is a copy", "100 — `a` and `b` refer to the same object", "A compile error: `a` is final", "Undefined"],
          answer: 1,
          explanation: "Assigning a reference copies the **address**, not the object. `a` and `b` point at the same `BankAccount`, so a deposit through either is visible through both.",
        },
        {
          prompt: "What is the naming convention for a constant such as the maximum number of retries?",
          options: ["`maxRetries`", "`MaxRetries`", "`MAX_RETRIES`", "`max_retries`"],
          answer: 2,
          explanation: "`static final` constants are UPPER_SNAKE_CASE. lowerCamelCase is for variables and methods, UpperCamelCase for types.",
        },
        {
          prompt: "What is the difference between `'A'` and `\"A\"`?",
          options: ["None — both are strings", "`'A'` is a `char` (a 16-bit number); `\"A\"` is a `String` object", "`'A'` is a `String`; `\"A\"` is a `char`", "`'A'` is only valid inside `switch`"],
          answer: 1,
          explanation: "Single quotes make a `char` literal — a primitive holding the UTF-16 code unit 65. Double quotes make a `String`, an object with methods. `'A' + 1` is `66`; `\"A\" + 1` is `\"A1\"`.",
        },
      ],
    },
    {
      slug: "packages-and-imports",
      file: "05-packages-and-imports.md",
      exercises: [
        {
          title: "Split the fully qualified name",
          prompt: `Read an integer \`n\`, then \`n\` fully qualified class names (one per line, such as \`java.util.ArrayList\`). For each, print the package and the simple class name as \`package=<pkg> class=<Name>\`. A name with no dot is in the unnamed package: print \`package=(default) class=<Name>\`.

Use \`lastIndexOf('.')\` and \`substring\`.

**Input:** \`n\`, then \`n\` lines.
**Output:** \`n\` lines.`,
          starter: String.raw`import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine().trim());
        for (int i = 0; i < n; i++) {
            String fqn = br.readLine().trim();
            int dot = fqn.lastIndexOf('.');
            // TODO: print "package=<pkg> class=<Name>"
        }
    }
}
`,
          solution: String.raw`import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine().trim());
        for (int i = 0; i < n; i++) {
            String fqn = br.readLine().trim();
            int dot = fqn.lastIndexOf('.');
            if (dot == -1) {
                System.out.println("package=(default) class=" + fqn);
            } else {
                String pkg = fqn.substring(0, dot);
                String name = fqn.substring(dot + 1);
                System.out.println("package=" + pkg + " class=" + name);
            }
        }
    }
}
`,
          hints: ["lastIndexOf returns -1 when the character is absent.", "substring(0, dot) is everything before the last dot; substring(dot + 1) everything after."],
          cases: [
            { stdin: "3\njava.util.ArrayList\ncom.example.billing.Invoice\nMain\n", expected: "package=java.util class=ArrayList\npackage=com.example.billing class=Invoice\npackage=(default) class=Main\n" },
            { stdin: "1\njava.util.concurrent.ConcurrentHashMap\n", expected: "package=java.util.concurrent class=ConcurrentHashMap\n" },
            { stdin: "2\na.B\nC\n", expected: "package=a class=B\npackage=(default) class=C\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does `import java.util.*;` cost at run time?",
          options: ["Loads every class in `java.util` at start-up", "Increases the JAR size", "Nothing — imports are resolved by the compiler", "A small delay on first use of each class"],
          answer: 2,
          explanation: "An import is a compile-time name alias; bytecode always uses fully qualified names. Classes are loaded lazily when first used regardless of how they were imported.",
        },
        {
          prompt: "You wrote `import java.util.*;` Which class can you now use **without** a further import?",
          options: ["`java.util.concurrent.ConcurrentHashMap`", "`java.util.function.Function`", "`java.util.HashMap`", "`java.io.File`"],
          answer: 2,
          explanation: "A wildcard covers the package's own classes only, not sub-packages. `java.util.concurrent` and `java.util.function` are different packages and need their own imports.",
        },
        {
          prompt: "Which package is imported automatically into every Java source file?",
          options: ["`java.util`", "`java.lang`", "`java.io`", "The current package only"],
          answer: 1,
          explanation: "`java.lang` (`String`, `Object`, `Math`, `System`, wrappers, `Thread`, `Exception`) is implicit. Classes in the *current* package also need no import, but that is a second rule, and `java.util` always needs an import.",
        },
        {
          prompt: "A class `com.example.Order` must be found at run time. Where does the JVM look, relative to a classpath root?",
          options: ["`com.example.Order.class`", "`com/example/Order.class`", "`Order.class` in any directory", "`example/com/Order.class`"],
          answer: 1,
          explanation: "Package dots map to directory separators. The classpath root must be the directory *above* `com/`.",
        },
        {
          prompt: "Both `java.util.*` and `java.awt.*` are imported and you write `List x;`. What happens?",
          options: ["`java.util.List` is chosen because it was imported first", "`java.awt.List` is chosen because it is a class, not an interface", "Compile error: reference to `List` is ambiguous", "Run-time error"],
          answer: 2,
          explanation: "Two wildcard imports providing the same simple name are an ambiguity the compiler refuses to resolve. Add a single-type import (`import java.util.List;`), which takes precedence over wildcards.",
        },
      ],
    },
    {
      slug: "input-and-output",
      file: "06-input-and-output.md",
      exercises: [
        {
          title: "Sum and average",
          prompt: `Read an integer \`n\` followed by \`n\` integers (whitespace-separated, across any number of lines). Print the sum on the first line and the average, rounded to two decimal places, on the second.

**Input:** \`n\`, then \`n\` integers. \`n\` is at least 1.
**Output:** two lines: \`sum=<sum>\` and \`avg=<average with 2 decimals>\`.

Example: input \`4 10 20 30 41\` →
\`\`\`
sum=101
avg=25.25
\`\`\``,
          starter: IO_STARTER,
          solution: String.raw`import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        String all = new String(System.in.readAllBytes()).trim();
        String[] tokens = all.split("\\s+");
        int n = Integer.parseInt(tokens[0]);
        long sum = 0;
        for (int i = 1; i <= n; i++) {
            sum += Long.parseLong(tokens[i]);
        }
        System.out.println("sum=" + sum);
        System.out.printf("avg=%.2f%n", (double) sum / n);
    }
}
`,
          hints: ["Reading all input with System.in.readAllBytes() and splitting on \\s+ handles any line layout.", "Cast to double before dividing, or the average is truncated to an integer.", "printf with %.2f rounds to two decimals."],
          cases: [
            { stdin: "4 10 20 30 41\n", expected: "sum=101\navg=25.25\n" },
            { stdin: "3\n1\n2\n2\n", expected: "sum=5\navg=1.67\n" },
            { stdin: "1 -7\n", expected: "sum=-7\navg=-7.00\n", hidden: true },
            { stdin: "2 2000000000 2000000000\n", expected: "sum=4000000000\navg=2000000000.00\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Input is `30⏎Ada⏎`. The code runs `int age = in.nextInt(); String name = in.nextLine();`. What is `name`?",
          options: ["`\"Ada\"`", "`\"30\"`", "`\"\"` (empty)", "`null`"],
          answer: 2,
          explanation: "`nextInt()` consumes `30` but leaves the newline. `nextLine()` then returns the rest of that first line — nothing. Call `nextLine()` once to discard the leftover, or read whole lines and parse.",
        },
        {
          prompt: "What does `BufferedReader.readLine()` return at the end of input?",
          options: ["An empty string", "`null`", "It throws `EOFException`", "The last line again"],
          answer: 1,
          explanation: "`null` signals end of stream — hence the idiom `while ((line = br.readLine()) != null)`. An empty string means an empty line, which is different.",
        },
        {
          prompt: "Which is the fastest way to print 500 000 lines?",
          options: ["`System.out.println` in a loop", "`System.out.printf` in a loop", "Append to a `StringBuilder`, print once", "`System.err.println` in a loop"],
          answer: 2,
          explanation: "`System.out` is synchronised and may flush per call; building the text once and printing it in one call avoids hundreds of thousands of small writes. A buffered `PrintWriter` is the other fast option — remember to flush it.",
        },
        {
          prompt: "What does `System.out.printf(\"%5d|%-5d|%05d\", 42, 42, 42)` print?",
          options: ["`42|42|42`", "`   42|42   |00042`", "`42   |   42|00042`", "`00042|00042|00042`"],
          answer: 1,
          explanation: "`%5d` right-aligns in width 5, `%-5d` left-aligns, `%05d` zero-pads. Format flags are worth memorising for output-exact judges.",
        },
        {
          prompt: "Text printed with `System.err.println` in an exercise…",
          options: ["Is compared with the expected output and marks the answer wrong", "Is ignored by the judge and shown to you as diagnostics", "Causes a runtime error", "Is printed before all standard output"],
          answer: 1,
          explanation: "Only standard output is judged. Standard error is a separate stream — use it for debugging prints you do not want to remove before submitting.",
        },
      ],
    },
    {
      slug: "jvm-checkpoint",
      file: "07-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "Multiplication table",
          prompt: `Read an integer \`n\` (1 ≤ n ≤ 12) and print the multiplication table for 1 through \`n\`: row \`i\` contains \`i×1, i×2, …, i×n\`, each number right-aligned in a field of width 4 (\`%4d\`), with no trailing text.

Example: \`n = 3\` →
\`\`\`
   1   2   3
   2   4   6
   3   6   9
\`\`\``,
          starter: IO_STARTER,
          solution: String.raw`import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine().trim());
        StringBuilder out = new StringBuilder();
        for (int i = 1; i <= n; i++) {
            for (int j = 1; j <= n; j++) {
                out.append(String.format("%4d", i * j));
            }
            out.append('\n');
        }
        System.out.print(out);
    }
}
`,
          hints: ["Two nested loops: rows i, columns j.", "String.format(\"%4d\", value) right-aligns in a width of 4."],
          cases: [
            { stdin: "3\n", expected: "   1   2   3\n   2   4   6\n   3   6   9\n" },
            { stdin: "1\n", expected: "   1\n" },
            { stdin: "5\n", expected: "   1   2   3   4   5\n   2   4   6   8  10\n   3   6   9  12  15\n   4   8  12  16  20\n   5  10  15  20  25\n", hidden: true },
          ],
        },
        {
          title: "Word count",
          prompt: `Implement a tiny \`wc\`: read all of standard input until end of stream and print three lines — the number of lines, the number of words (whitespace-separated tokens) and the number of characters (every character including spaces and newlines).

Use \`readLine()\` in a loop until it returns \`null\`. Every line read counts as one line and contributes its length plus one for the newline.

Example input:
\`\`\`
the quick brown
fox
\`\`\`
Output:
\`\`\`
lines=2
words=4
chars=20
\`\`\``,
          starter: IO_STARTER,
          solution: String.raw`import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int lines = 0;
        int words = 0;
        long chars = 0;
        String line;
        while ((line = br.readLine()) != null) {
            lines++;
            chars += line.length() + 1;
            String trimmed = line.trim();
            if (!trimmed.isEmpty()) {
                words += trimmed.split("\\s+").length;
            }
        }
        System.out.println("lines=" + lines);
        System.out.println("words=" + words);
        System.out.println("chars=" + chars);
    }
}
`,
          hints: ["`while ((line = br.readLine()) != null)` is the read-everything idiom.", "An empty line has zero words — check before splitting, or split(\"\\\\s+\") on \"\" returns one empty token."],
          cases: [
            { stdin: "the quick brown\nfox\n", expected: "lines=2\nwords=4\nchars=20\n" },
            { stdin: "one\n\ntwo  three\n", expected: "lines=3\nwords=3\nchars=16\n" },
            { stdin: "a\n", expected: "lines=1\nwords=1\nchars=2\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which component makes a compiled Java program run on both Windows and Linux without recompiling?",
          options: ["The `javac` compiler", "The platform-specific JVM executing platform-independent bytecode", "The JAR file format", "The `import` mechanism"],
          answer: 1,
          explanation: "Bytecode is the same everywhere; each platform's JVM knows how to execute it there.",
        },
        {
          prompt: "JDK, JRE, JVM — from largest to smallest, which contains which?",
          options: ["JVM ⊃ JRE ⊃ JDK", "JRE ⊃ JDK ⊃ JVM", "JDK ⊃ JRE ⊃ JVM", "They are independent downloads"],
          answer: 2,
          explanation: "The JDK holds tools plus the JRE; the JRE holds the library plus the JVM.",
        },
        {
          prompt: "What happens at the *first active use* of a class?",
          options: ["Its constructor runs", "Its static initialisers run, once, in textual order", "All its methods are JIT-compiled", "Its instances are allocated"],
          answer: 1,
          explanation: "Class initialisation (static fields and static blocks) happens once, on first active use. Constructors run per `new`; JIT compilation happens per hot method, later.",
        },
        {
          prompt: "`javap -c` on a class you wrote with no constructor shows a constructor anyway. Why?",
          options: ["`javap` invents one for display", "The compiler generates a default no-argument constructor when you declare none", "`Object` lends its constructor to every class", "It is a bug in the JDK"],
          answer: 1,
          explanation: "A class with no declared constructor gets a public no-arg default constructor that calls `super()`. Declare any constructor and the default one is no longer generated.",
        },
        {
          prompt: "Which exception/error means a class was looked up **by name at run time** and not found?",
          options: ["`NoClassDefFoundError`", "`ClassNotFoundException`", "`ClassCastException`", "`NoSuchMethodError`"],
          answer: 1,
          explanation: "`ClassNotFoundException` comes from explicit lookups (`Class.forName`, class loaders). `NoClassDefFoundError` is thrown when a class referenced in compiled code is missing at run time.",
        },
        {
          prompt: "Which line is a compile error?",
          options: ["`int count = 0;`", "`count += 2;`", "`count + 2;`", "`System.out.println(count);`"],
          answer: 2,
          explanation: "`count + 2;` is an expression, not a statement. Java only allows assignments, increments, calls and `new` as expression statements.",
        },
        {
          prompt: "Given `int a = 5; int b = a; b = 7;`, what is `a`?",
          options: ["7", "5", "Undefined", "Compile error"],
          answer: 1,
          explanation: "Primitives are copied by value. `b` is an independent 5 that later becomes 7; `a` stays 5. Contrast with references, where a copy shares the object.",
        },
        {
          prompt: "Which name follows Java conventions for a method that checks whether a list is empty?",
          options: ["`IsEmpty()`", "`is_empty()`", "`isEmpty()`", "`EMPTY()`"],
          answer: 2,
          explanation: "Methods are lowerCamelCase verbs; boolean methods use `is`/`has`/`can` prefixes.",
        },
        {
          prompt: "What is the effect of `import static java.lang.Math.max;`?",
          options: ["Loads the `Math` class eagerly", "Lets you call `max(a, b)` without the `Math.` prefix", "Makes `max` available to every class in the package", "Imports every method of `Math`"],
          answer: 1,
          explanation: "A static import brings one static member (or all with `*`) into scope by simple name, for that source file only. Nothing is loaded at run time.",
        },
        {
          prompt: "A class declares no `package`. Which is true?",
          options: ["It is in package `java.lang`", "It is in the unnamed package and cannot be imported by classes in named packages", "It cannot be compiled", "It is automatically in the package named after its directory"],
          answer: 1,
          explanation: "Classes without a package declaration live in the unnamed (default) package. Named packages cannot import from it — fine for experiments, never for real code.",
        },
        {
          prompt: "Input is `5 10⏎`. Which reads both numbers correctly with a `Scanner in`?",
          options: ["`in.nextLine(); in.nextLine();`", "`in.nextInt(); in.nextInt();`", "`in.next(); in.nextLine();`", "`in.nextInt(); in.nextLine();`"],
          answer: 1,
          explanation: "`nextInt()` twice consumes the two tokens regardless of the newline. `nextLine()` after a token method returns the rest of the current line, which is empty here.",
        },
        {
          prompt: "`System.out.printf(\"%.2f\", 2.0 / 3)` prints…",
          options: ["`0.66`", "`0.67`", "`0.666667`", "`1`"],
          answer: 1,
          explanation: "`%.2f` rounds (half-up) to two decimals: 0.6667 → `0.67`. `%f` alone would give six decimals.",
        },
        {
          prompt: "Which reader is faster for a million integers, and why?",
          options: ["`Scanner`, because it parses numbers natively", "`BufferedReader` with manual parsing, because `Scanner` uses regular expressions per token", "They are equal — both are buffered", "`System.in.read()` byte by byte"],
          answer: 1,
          explanation: "`Scanner`'s convenience comes from regex-based tokenising, roughly ten times slower. `BufferedReader.readLine()` plus `Integer.parseInt` (or `StringTokenizer`) is the standard fast path.",
        },
        {
          prompt: "You wrapped `System.out` in a `PrintWriter`, printed 100 000 lines, and the judge saw **nothing**. What did you forget?",
          options: ["`System.gc()`", "To `flush()` (or `close()`) the writer", "To declare `throws IOException`", "To use `println` instead of `print`"],
          answer: 1,
          explanation: "A buffered writer holds text in memory until flushed. The program ended with the buffer full and unwritten. Always `flush()` before returning from `main`.",
        },
        {
          prompt: "Which statement about `-ea` is correct?",
          options: ["It enables autoboxing", "It enables `assert` statements, which are off by default", "It enables the JIT compiler", "It prints every exception's stack trace"],
          answer: 1,
          explanation: "Assertions are disabled unless the JVM is started with `-ea`. Code that relies on an `assert` for correctness silently skips the check in production.",
        },
      ],
    },
  ],
}, more);
