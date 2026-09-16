import { defineModule } from "../../dsl.js";
import more from "./more-exercises.js";

export default defineModule(import.meta.url, {
  slug: "exceptions",
  title: "Exceptions",
  blurb: "The hierarchy, checked versus unchecked, try/catch/finally semantics, try-with-resources, custom exceptions with chaining, and handling practices.",
  icon: "alert",
  overview: `Exceptions are how Java separates the normal path from failure. The mechanism is precise — a class hierarchy, compile-time checking for some of it, exact rules for finally and for resource cleanup — and the practices around it are what separate code that fails loudly and diagnosably from code that fails silently in production.

This module covers the Throwable hierarchy and how to read a stack trace; the checked/unchecked rules, throws propagation and wrapping; the semantics of try, catch and finally including the return and double-throw traps; try-with-resources with AutoCloseable and suppressed exceptions; designing custom exceptions with data and causes; and the handling rules — never swallow, catch narrowly, log once, fail fast — that teams enforce in review.

By the end you know exactly what happens when an exception is thrown, write handlers that preserve the evidence, and design exceptions for a layered application.`,
  lessons: [
    {
      slug: "exception-hierarchy",
      file: "01-exception-hierarchy.md",
      exercises: [
        {
          title: "Name that exception",
          prompt: `Read an integer \`n\` and \`n\` commands, each of which triggers a runtime exception: \`parse <text>\` (\`Integer.parseInt\`), \`index <i>\` (index into a 3-element array), \`div <a> <b>\` (integer division), \`cast\` (cast a \`String\` held in an \`Object\` to \`Integer\`), \`nullcall\` (call \`length()\` on a null \`String\`). Catch each exception as \`RuntimeException\` and print \`<simple class name>: <message>\`; if no exception occurs print \`ok <result>\`.

Example: \`3\` then \`parse 42\`, \`parse x\`, \`div 1 0\` →
\`\`\`
ok 42
NumberFormatException: For input string: "x"
ArithmeticException: / by zero
\`\`\``,
          starter: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        int[] arr = {10, 20, 30};
        for (int i = 0; i < n; i++) {
            String cmd = in.next();
            try {
                // TODO: perform the command and print "ok <result>"
            } catch (RuntimeException e) {
                System.out.println(e.getClass().getSimpleName() + ": " + e.getMessage());
            }
        }
    }
}
`,
          solution: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        int[] arr = {10, 20, 30};
        for (int i = 0; i < n; i++) {
            String cmd = in.next();
            try {
                Object result;
                switch (cmd) {
                    case "parse" -> result = Integer.parseInt(in.next());
                    case "index" -> result = arr[in.nextInt()];
                    case "div" -> { int a = in.nextInt(); int b = in.nextInt(); result = a / b; }
                    case "cast" -> { Object o = "text"; result = (Integer) o; }
                    default -> { String s = null; result = s.length(); }
                }
                System.out.println("ok " + result);
            } catch (RuntimeException e) {
                System.out.println(e.getClass().getSimpleName() + ": " + e.getMessage());
            }
        }
    }
}
`,
          hints: ["Every one of these extends RuntimeException, so one handler covers them.", "getSimpleName drops the package; getMessage is what the JDK put in."],
          cases: [
            { stdin: "3\nparse 42\nparse x\ndiv 1 0\n", expected: "ok 42\nNumberFormatException: For input string: \"x\"\nArithmeticException: / by zero\n" },
            { stdin: "2\nindex 3\nindex 1\n", expected: "ArrayIndexOutOfBoundsException: Index 3 out of bounds for length 3\nok 20\n" },
            { stdin: "1\ncast\n", expected: "ClassCastException: class java.lang.String cannot be cast to class java.lang.Integer (java.lang.String and java.lang.Integer are in module java.base of loader 'bootstrap')\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which of these is a checked exception?",
          options: ["`NullPointerException`", "`IOException`", "`IllegalArgumentException`", "`OutOfMemoryError`"],
          answer: 1,
          explanation: "`IOException` extends `Exception` directly. The first and third extend `RuntimeException`; the last is an `Error`.",
        },
        {
          prompt: "When is an exception's stack trace captured?",
          options: ["When it is thrown", "When it is caught", "When the exception object is constructed", "When `printStackTrace` is called"],
          answer: 2,
          explanation: "`Throwable`'s constructor walks the stack — which is why creating exceptions is expensive and rethrowing the same object keeps the original trace.",
        },
        {
          prompt: "Reading a stack trace, the most useful frame is usually…",
          options: ["The top one", "The first frame in your own code, reading down from the top", "The bottom one", "The `Caused by` line only"],
          answer: 1,
          explanation: "Top frames are often library code that detected the problem; the first frame in your package is where to look.",
        },
        {
          prompt: "`catch (Exception e)` does **not** catch…",
          options: ["`RuntimeException`", "`IOException`", "`StackOverflowError`", "`NumberFormatException`"],
          answer: 2,
          explanation: "`Error`s are not `Exception`s. Only `catch (Throwable t)` would, and it should not.",
        },
        {
          prompt: "A `NullPointerException` in production most often means…",
          options: ["The network failed", "A bug: a reference that should have been set was not — fix the code rather than catch it", "The JVM is out of memory", "A checked exception was ignored"],
          answer: 1,
          explanation: "Unchecked exceptions signal programming errors; the message since Java 14 names the null variable.",
        },
      ],
    },
    {
      slug: "checked-vs-unchecked",
      file: "02-checked-vs-unchecked.md",
      exercises: [
        {
          title: "Declare, catch or wrap",
          prompt: `Write a **checked** exception \`class QuotaExceededException extends Exception\` with a message. Write \`static void consume(int used, int limit) throws QuotaExceededException\` that throws when \`used > limit\`. Then write \`static void consumeUnchecked(int used, int limit)\` that calls \`consume\` and wraps the checked exception in an \`IllegalStateException\` **with the cause**.

Read an integer \`limit\`, an integer \`n\`, and \`n\` usage values. For each value call \`consumeUnchecked\`; catch \`IllegalStateException\` and print \`wrapped: <cause class simple name>: <cause message>\`, otherwise print \`ok <used>\`.

Example: \`10\`, \`2\`, \`5 12\` →
\`\`\`
ok 5
wrapped: QuotaExceededException: used 12 of 10
\`\`\``,
          starter: String.raw`import java.util.*;

class QuotaExceededException extends Exception {
    // TODO: constructor taking a message
}

public class Main {
    static void consume(int used, int limit) throws QuotaExceededException {
        // TODO
    }

    static void consumeUnchecked(int used, int limit) {
        // TODO: call consume, wrap in IllegalStateException with the cause
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int limit = in.nextInt();
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            int used = in.nextInt();
            // TODO
        }
    }
}
`,
          solution: String.raw`import java.util.*;

class QuotaExceededException extends Exception {
    QuotaExceededException(String message) { super(message); }
}

public class Main {
    static void consume(int used, int limit) throws QuotaExceededException {
        if (used > limit) throw new QuotaExceededException("used " + used + " of " + limit);
    }

    static void consumeUnchecked(int used, int limit) {
        try {
            consume(used, limit);
        } catch (QuotaExceededException e) {
            throw new IllegalStateException("quota", e);
        }
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int limit = in.nextInt();
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            int used = in.nextInt();
            try {
                consumeUnchecked(used, limit);
                System.out.println("ok " + used);
            } catch (IllegalStateException e) {
                Throwable cause = e.getCause();
                System.out.println("wrapped: " + cause.getClass().getSimpleName() + ": " + cause.getMessage());
            }
        }
    }
}
`,
          hints: ["A method calling consume must catch or declare QuotaExceededException — the compiler insists.", "new IllegalStateException(message, cause) keeps the original reachable via getCause()."],
          cases: [
            { stdin: "10\n2\n5 12\n", expected: "ok 5\nwrapped: QuotaExceededException: used 12 of 10\n" },
            { stdin: "0\n3\n0 1 0\n", expected: "ok 0\nwrapped: QuotaExceededException: used 1 of 0\nok 0\n" },
            { stdin: "100\n1\n100\n", expected: "ok 100\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "A method calls `Files.readString(path)` and neither catches `IOException` nor declares it. Result?",
          options: ["Runs, throwing at run time if the file is missing", "Compile error: unreported exception", "A warning", "The exception is converted to unchecked"],
          answer: 1,
          explanation: "Checked exceptions must be caught or declared — the compiler enforces it at every call site.",
        },
        {
          prompt: "Wrapping a checked exception in an unchecked one should…",
          options: ["Drop the original to save memory", "Pass the original as the cause so its trace survives", "Change the message to \"error\"", "Only be done in `main`"],
          answer: 1,
          explanation: "`new UncheckedIOException(msg, e)` — the `Caused by` section is the real diagnosis.",
        },
        {
          prompt: "Which is a recommended use of a **checked** exception?",
          options: ["A null argument", "An index out of range", "A recoverable, expected condition at an API boundary, such as a missing file", "A violated invariant"],
          answer: 2,
          explanation: "Programming errors are unchecked; expected, recoverable conditions may be checked so callers must acknowledge them.",
        },
        {
          prompt: "Why do checked exceptions not mix well with lambdas?",
          options: ["Lambdas cannot contain `try`", "Functional interfaces like `Function` declare no checked exceptions, so the body cannot let one escape", "Lambdas are compiled differently", "They do mix well"],
          answer: 1,
          explanation: "The lambda may throw only what the SAM declares; wrap inside the body or use a helper.",
        },
        {
          prompt: "`public void load() throws Exception` in a library API is…",
          options: ["Fine", "Poor: callers learn nothing and must catch everything", "Required for I/O", "Faster"],
          answer: 1,
          explanation: "Declare the specific checked types; if there are many unrelated ones, reconsider the method's design.",
        },
      ],
    },
    {
      slug: "try-catch-finally",
      file: "03-try-catch-finally.md",
      exercises: [
        {
          title: "Trace the flow",
          prompt: `Implement \`static String run(String mode)\` with a \`try\`/\`catch\`/\`finally\` that appends to a shared \`StringBuilder log\`: the try block appends \`try\` then, by mode, \`return\`s \`"r"\` (mode \`ret\`), throws \`IllegalStateException\` (mode \`throw\`), or completes normally returning \`"n"\` (mode \`ok\`); the catch appends \`catch\` and returns \`"c"\`; the finally appends \`finally\`. Read an integer \`n\` and \`n\` modes; for each, clear the log, call \`run\`, and print \`<log joined by ->> => <returned value>\`.

Expected:
\`\`\`
ret: try->finally => r
throw: try->catch->finally => c
ok: try->finally => n
\`\`\`
(the mode name is printed first, as shown)`,
          starter: String.raw`import java.util.*;

public class Main {
    static List<String> log = new ArrayList<>();

    static String run(String mode) {
        // TODO
        return "";
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            String mode = in.next();
            log.clear();
            String result = run(mode);
            System.out.println(mode + ": " + String.join("->", log) + " => " + result);
        }
    }
}
`,
          solution: String.raw`import java.util.*;

public class Main {
    static List<String> log = new ArrayList<>();

    static String run(String mode) {
        try {
            log.add("try");
            if (mode.equals("ret")) return "r";
            if (mode.equals("throw")) throw new IllegalStateException("boom");
            return "n";
        } catch (IllegalStateException e) {
            log.add("catch");
            return "c";
        } finally {
            log.add("finally");
        }
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            String mode = in.next();
            log.clear();
            String result = run(mode);
            System.out.println(mode + ": " + String.join("->", log) + " => " + result);
        }
    }
}
`,
          hints: ["finally runs after a return in try, and after a return in catch.", "A throw in try skips the rest of try and enters the matching catch."],
          cases: [
            { stdin: "3\nret throw ok\n", expected: "ret: try->finally => r\nthrow: try->catch->finally => c\nok: try->finally => n\n" },
            { stdin: "2\nthrow throw\n", expected: "throw: try->catch->finally => c\nthrow: try->catch->finally => c\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`try { return 1; } finally { System.out.println(\"f\"); }` prints…",
          options: ["Nothing; returns 1", "`f`, then returns 1", "`f`, then returns nothing", "Compile error"],
          answer: 1,
          explanation: "`finally` runs after the return value is computed and before the method actually returns.",
        },
        {
          prompt: "`try { throw new A(); } finally { return 5; }` results in…",
          options: ["`A` propagates", "The method returns 5 and the exception is silently discarded", "Compile error", "Both"],
          answer: 1,
          explanation: "A `return` in `finally` overrides everything, including a pending exception — never write it.",
        },
        {
          prompt: "`catch (IOException e) { } catch (FileNotFoundException e) { }` is…",
          options: ["Fine", "A compile error: the second handler is unreachable", "A warning", "Valid only in multi-catch"],
          answer: 1,
          explanation: "Handlers are tried in order and `IOException` already catches its subclass. Put narrow before broad.",
        },
        {
          prompt: "In `catch (A | B e)`, the types must…",
          options: ["Be subclasses of one another", "Not be related by inheritance; `e` is implicitly final", "Both be checked", "Both be unchecked"],
          answer: 1,
          explanation: "Alternatives in a multi-catch cannot be in a subclass relationship.",
        },
        {
          prompt: "An exception thrown inside a `catch` block…",
          options: ["Is caught by the next `catch` of the same `try`", "Propagates outward (after `finally`), replacing the original", "Is ignored", "Restarts the `try`"],
          answer: 1,
          explanation: "Sibling handlers do not catch each other's exceptions; only an enclosing `try` can.",
        },
      ],
    },
    {
      slug: "try-with-resources",
      file: "04-try-with-resources.md",
      exercises: [
        {
          title: "Close order and suppressed exceptions",
          prompt: `Write \`class Res implements AutoCloseable\` with a name and a flag \`failOnClose\`; its \`close()\` appends \`close <name>\` to a shared log and throws \`IllegalStateException("close " + name)\` if the flag is set. Read a line of resource specs \`a b! c\` (a trailing \`!\` means fail on close) and a word \`throw\` or \`ok\`. Open all resources in one try-with-resources (in the given order); in the body, append \`body\` and throw \`RuntimeException("body")\` if the word is \`throw\`. Catch the exception outside, then print the log joined by \`->\` and, if an exception was caught, \`caught=<message> suppressed=<messages of getSuppressed(), comma-joined>\`.

Example: \`a b! c\` with \`throw\` →
\`\`\`
body->close c->close b->close a
caught=body suppressed=close b
\`\`\``,
          starter: String.raw`import java.util.*;

class Res implements AutoCloseable {
    static List<String> log = new ArrayList<>();
    private final String name;
    private final boolean failOnClose;
    Res(String name, boolean failOnClose) { this.name = name; this.failOnClose = failOnClose; }
    @Override public void close() {
        // TODO
    }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        String[] specs = in.nextLine().trim().split("\\s+");
        String mode = in.next();
        // TODO: build Res objects; the exercise expects exactly three resources
    }
}
`,
          solution: String.raw`import java.util.*;

class Res implements AutoCloseable {
    static List<String> log = new ArrayList<>();
    private final String name;
    private final boolean failOnClose;
    Res(String name, boolean failOnClose) { this.name = name; this.failOnClose = failOnClose; }
    @Override public void close() {
        log.add("close " + name);
        if (failOnClose) throw new IllegalStateException("close " + name);
    }
}

public class Main {
    static Res make(String spec) {
        boolean fail = spec.endsWith("!");
        return new Res(fail ? spec.substring(0, spec.length() - 1) : spec, fail);
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        String[] specs = in.nextLine().trim().split("\\s+");
        String mode = in.next();
        Exception caught = null;
        try (Res a = make(specs[0]); Res b = make(specs[1]); Res c = make(specs[2])) {
            Res.log.add("body");
            if (mode.equals("throw")) throw new RuntimeException("body");
        } catch (Exception e) {
            caught = e;
        }
        System.out.println(String.join("->", Res.log));
        if (caught != null) {
            List<String> sup = new ArrayList<>();
            for (Throwable t : caught.getSuppressed()) sup.add(t.getMessage());
            System.out.println("caught=" + caught.getMessage() + " suppressed=" + String.join(",", sup));
        }
    }
}
`,
          hints: ["Resources close in reverse order: c, b, a.", "When the body throws, a failing close() is attached as suppressed; when the body succeeds, the first failing close() is the exception itself."],
          cases: [
            { stdin: "a b! c\nthrow\n", expected: "body->close c->close b->close a\ncaught=body suppressed=close b\n" },
            { stdin: "a b c\nok\n", expected: "body->close c->close b->close a\n" },
            { stdin: "a! b! c\nok\n", expected: "body->close c->close b->close a\ncaught=close b suppressed=close a\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "A resource in a try-with-resources header must implement…",
          options: ["`Closeable` only", "`AutoCloseable` (or its subinterface `Closeable`)", "`Serializable`", "`Runnable`"],
          answer: 1,
          explanation: "`AutoCloseable.close()` is what the generated code calls.",
        },
        {
          prompt: "With `try (A a = …; B b = …)`, the close order is…",
          options: ["a then b", "b then a — reverse declaration order", "Unspecified", "Simultaneous"],
          answer: 1,
          explanation: "Later resources may depend on earlier ones, so they are released first.",
        },
        {
          prompt: "If the body throws X and `close()` throws Y…",
          options: ["Y propagates, X is lost", "X propagates with Y attached as a suppressed exception", "Both propagate", "Neither propagates"],
          answer: 1,
          explanation: "The primary exception wins; `getSuppressed()` returns Y. A hand-written `finally` would have lost X.",
        },
        {
          prompt: "A `catch` block attached to a try-with-resources runs…",
          options: ["Before the resource is closed", "After the resource is closed", "Only if `close()` throws", "Instead of closing"],
          answer: 1,
          explanation: "The generated close is part of the try; catch and finally come after it.",
        },
        {
          prompt: "A well-behaved `close()` should be…",
          options: ["Slow", "Idempotent — a second call does nothing", "Static", "Private"],
          answer: 1,
          explanation: "Double closes happen; the JDK's streams and the try-with-resources expansion assume it is harmless.",
        },
      ],
    },
    {
      slug: "custom-exceptions",
      file: "05-custom-exceptions.md",
      exercises: [
        {
          title: "Validation with data",
          prompt: `Write \`class ValidationException extends RuntimeException\` carrying the field name and the rejected value, with the message \`<field>: <reason> (was '<value>')\`. Write \`static int parseAge(String s)\` that throws it for a non-integer (\`"not a number"\`, wrapping the \`NumberFormatException\` as the cause) or an age outside 0–150 (\`"out of range"\`).

Read an integer \`n\` and \`n\` tokens. For each, print \`ok <age>\` or the exception's message followed by \` cause=<cause simple class name or none>\`.

Example: \`3\` then \`30 abc 200\` →
\`\`\`
ok 30
age: not a number (was 'abc') cause=NumberFormatException
age: out of range (was '200') cause=none
\`\`\``,
          starter: String.raw`import java.util.*;

class ValidationException extends RuntimeException {
    private final String field;
    private final String value;

    // TODO: two constructors (with and without a cause), accessors
}

public class Main {
    static int parseAge(String s) {
        // TODO
        return 0;
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            String token = in.next();
            // TODO
        }
    }
}
`,
          solution: String.raw`import java.util.*;

class ValidationException extends RuntimeException {
    private final String field;
    private final String value;

    ValidationException(String field, String value, String reason) {
        this(field, value, reason, null);
    }

    ValidationException(String field, String value, String reason, Throwable cause) {
        super(field + ": " + reason + " (was '" + value + "')", cause);
        this.field = field;
        this.value = value;
    }

    String field() { return field; }
    String value() { return value; }
}

public class Main {
    static int parseAge(String s) {
        int age;
        try {
            age = Integer.parseInt(s);
        } catch (NumberFormatException e) {
            throw new ValidationException("age", s, "not a number", e);
        }
        if (age < 0 || age > 150) throw new ValidationException("age", s, "out of range");
        return age;
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            String token = in.next();
            try {
                System.out.println("ok " + parseAge(token));
            } catch (ValidationException e) {
                Throwable c = e.getCause();
                System.out.println(e.getMessage() + " cause=" + (c == null ? "none" : c.getClass().getSimpleName()));
            }
        }
    }
}
`,
          hints: ["Build the message in the constructor from the facts so every thrower agrees.", "super(message, cause) chains; getCause() is null when none was given."],
          cases: [
            { stdin: "3\n30 abc 200\n", expected: "ok 30\nage: not a number (was 'abc') cause=NumberFormatException\nage: out of range (was '200') cause=none\n" },
            { stdin: "2\n-1 0\n", expected: "age: out of range (was '-1') cause=none\nok 0\n" },
            { stdin: "1\n15.5\n", expected: "age: not a number (was '15.5') cause=NumberFormatException\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "A custom exception class should usually extend…",
          options: ["`Throwable`", "`Error`", "`RuntimeException` (or `Exception` when checked is intended)", "`Object`"],
          answer: 2,
          explanation: "Never `Throwable` or `Error`; choose checked or unchecked deliberately.",
        },
        {
          prompt: "Exception chaining means…",
          options: ["Throwing two exceptions", "Passing the caught exception as the `cause` of the new one", "Catching in a loop", "Using `finally`"],
          answer: 1,
          explanation: "The `Caused by` section of the trace is the original failure; losing it loses the diagnosis.",
        },
        {
          prompt: "Fields on a custom exception are useful for…",
          options: ["Nothing — messages suffice", "Giving handlers structured data (ids, amounts, the offending value)", "Serialization only", "Performance"],
          answer: 1,
          explanation: "Exceptions are objects; a handler can read `e.requestedCents()` instead of parsing the message.",
        },
        {
          prompt: "Creating `InvalidArgumentException extends IllegalArgumentException` with no extra behaviour is…",
          options: ["Best practice", "Usually pointless — prefer the JDK exception unless callers catch yours specifically or it carries data", "Required by frameworks", "Faster"],
          answer: 1,
          explanation: "A new name with no new information adds a type without adding value.",
        },
        {
          prompt: "Each application layer should…",
          options: ["Throw `Exception`", "Throw exceptions in its own vocabulary, wrapping lower-level ones with causes at the boundary", "Let `SQLException` reach the UI", "Catch everything"],
          answer: 1,
          explanation: "Translation at boundaries keeps implementation details from leaking upward while preserving the evidence.",
        },
      ],
    },
    {
      slug: "best-practices",
      file: "06-best-practices.md",
      exercises: [
        {
          title: "Fix the handling",
          prompt: `The program below swallows failures and uses exceptions for control flow. Rewrite \`sumValid\` so that: it validates each token with a **check** (\`matches("-?\\\\d+")\`) rather than catching \`NumberFormatException\`; it counts invalid tokens instead of ignoring them; and any token whose value is negative causes an \`IllegalArgumentException\` with the message \`negative: <token>\` that propagates to \`main\`, where it is caught once and printed as \`error: <message>\`.

Read an integer \`n\` and \`n\` tokens; print \`sum=<sum> invalid=<count>\` or the error line.

Example: \`4\` then \`3 x 4 y\` → \`sum=7 invalid=2\`; \`2\` then \`3 -1\` → \`error: negative: -1\``,
          starter: String.raw`import java.util.*;

public class Main {
    // BUGGY: swallows everything, uses exceptions for control flow
    static long sumValid(String[] tokens) {
        long sum = 0;
        for (String t : tokens) {
            try {
                sum += Integer.parseInt(t);
            } catch (Exception e) {
            }
        }
        return sum;
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        String[] tokens = new String[n];
        for (int i = 0; i < n; i++) tokens[i] = in.next();
        System.out.println("sum=" + sumValid(tokens));
    }
}
`,
          solution: String.raw`import java.util.*;

public class Main {
    static int invalid = 0;

    static long sumValid(String[] tokens) {
        long sum = 0;
        for (String t : tokens) {
            if (!t.matches("-?\\d+")) {
                invalid++;
                continue;
            }
            long v = Long.parseLong(t);
            if (v < 0) throw new IllegalArgumentException("negative: " + t);
            sum += v;
        }
        return sum;
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        String[] tokens = new String[n];
        for (int i = 0; i < n; i++) tokens[i] = in.next();
        try {
            long sum = sumValid(tokens);
            System.out.println("sum=" + sum + " invalid=" + invalid);
        } catch (IllegalArgumentException e) {
            System.out.println("error: " + e.getMessage());
        }
    }
}
`,
          hints: ["Test what you can test: a regex check replaces the catch.", "Let the precondition violation propagate; handle it once at the top."],
          cases: [
            { stdin: "4\n3 x 4 y\n", expected: "sum=7 invalid=2\n" },
            { stdin: "2\n3 -1\n", expected: "error: negative: -1\n" },
            { stdin: "3\n1 2 3\n", expected: "sum=6 invalid=0\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "An empty `catch (Exception e) { }` block…",
          options: ["Is harmless", "Silently hides failures, including bugs, so the program continues in a broken state", "Improves performance", "Is required by the compiler"],
          answer: 1,
          explanation: "If ignoring is intended, catch the narrowest type and say why in a comment; otherwise handle or propagate.",
        },
        {
          prompt: "Logging an exception and then rethrowing it wrapped, at every layer, causes…",
          options: ["Nothing", "Duplicate traces of one failure filling the logs", "Lost causes", "Compile errors"],
          answer: 1,
          explanation: "Log once where the exception is handled; elsewhere wrap with cause or let it propagate.",
        },
        {
          prompt: "Using `catch (ArrayIndexOutOfBoundsException e)` instead of checking the index is…",
          options: ["Idiomatic", "Exceptions as control flow: slow and it hides real errors — check the condition", "Required for arrays", "Faster"],
          answer: 1,
          explanation: "Test conditions you can test; reserve catching for APIs that offer no check (`parseInt`).",
        },
        {
          prompt: "Assertions (`assert`) are…",
          options: ["Always on", "Off unless the JVM runs with `-ea`, so never use them for argument validation", "A replacement for exceptions", "Checked at compile time"],
          answer: 1,
          explanation: "They document internal invariants and run in tests/development; production usually runs without them.",
        },
        {
          prompt: "Catching `InterruptedException` and ignoring it…",
          options: ["Is fine", "Breaks cancellation — propagate it or call `Thread.currentThread().interrupt()` before wrapping", "Speeds up the thread", "Is required"],
          answer: 1,
          explanation: "The interrupt flag is cleared when the exception is thrown; restoring it lets callers up the stack notice.",
        },
      ],
    },
    {
      slug: "exceptions-checkpoint",
      file: "07-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "Config loader with layered exceptions",
          prompt: `Write \`class ConfigException extends RuntimeException\` (message + cause). Write \`static int parsePort(String line)\` that expects \`port=<number>\`: for a line without \`=\` throw \`IllegalArgumentException("malformed: " + line)\`; for a non-numeric value wrap the \`NumberFormatException\` in a \`ConfigException("bad port: " + value, e)\`; for a port outside 1–65535 throw \`ConfigException("port out of range: " + n)\` with no cause.

Read an integer \`k\` and \`k\` lines. For each, print \`port=<n>\`, or \`config: <message> cause=<simple class of cause or none>\` for a \`ConfigException\`, or \`arg: <message>\` for an \`IllegalArgumentException\`. Catch the two types separately, most specific first.

Example: \`4\` then \`port=8080\`, \`port=abc\`, \`port=70000\`, \`nonsense\` →
\`\`\`
port=8080
config: bad port: abc cause=NumberFormatException
config: port out of range: 70000 cause=none
arg: malformed: nonsense
\`\`\``,
          starter: String.raw`import java.util.*;

class ConfigException extends RuntimeException {
    ConfigException(String message) { super(message); }
    ConfigException(String message, Throwable cause) { super(message, cause); }
}

public class Main {
    static int parsePort(String line) {
        // TODO
        return 0;
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int k = Integer.parseInt(in.nextLine().trim());
        for (int i = 0; i < k; i++) {
            String line = in.nextLine().trim();
            // TODO
        }
    }
}
`,
          solution: String.raw`import java.util.*;

class ConfigException extends RuntimeException {
    ConfigException(String message) { super(message); }
    ConfigException(String message, Throwable cause) { super(message, cause); }
}

public class Main {
    static int parsePort(String line) {
        int eq = line.indexOf('=');
        if (eq == -1) throw new IllegalArgumentException("malformed: " + line);
        String value = line.substring(eq + 1);
        int n;
        try {
            n = Integer.parseInt(value);
        } catch (NumberFormatException e) {
            throw new ConfigException("bad port: " + value, e);
        }
        if (n < 1 || n > 65535) throw new ConfigException("port out of range: " + n);
        return n;
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int k = Integer.parseInt(in.nextLine().trim());
        for (int i = 0; i < k; i++) {
            String line = in.nextLine().trim();
            try {
                System.out.println("port=" + parsePort(line));
            } catch (ConfigException e) {
                Throwable c = e.getCause();
                System.out.println("config: " + e.getMessage() + " cause=" + (c == null ? "none" : c.getClass().getSimpleName()));
            } catch (IllegalArgumentException e) {
                System.out.println("arg: " + e.getMessage());
            }
        }
    }
}
`,
          hints: ["ConfigException and IllegalArgumentException are unrelated, so either order compiles — but keep the specific-first habit.", "Wrap only the parse failure; the range failure has no lower-level cause."],
          cases: [
            { stdin: "4\nport=8080\nport=abc\nport=70000\nnonsense\n", expected: "port=8080\nconfig: bad port: abc cause=NumberFormatException\nconfig: port out of range: 70000 cause=none\narg: malformed: nonsense\n" },
            { stdin: "2\nport=1\nport=0\n", expected: "port=1\nconfig: port out of range: 0 cause=none\n" },
            { stdin: "1\nport=\n", expected: "config: bad port:  cause=NumberFormatException\n", hidden: true },
          ],
        },
        {
          title: "Transaction with guaranteed rollback",
          prompt: `Write \`class Tx implements AutoCloseable\` with a boolean \`committed\`; \`commit()\` sets it, and \`close()\` appends \`commit\` or \`rollback\` to a shared log depending on the flag. Read an integer \`n\` and \`n\` lines of commands: \`ok\` (body commits), \`fail\` (body throws \`IllegalStateException("failed")\` before committing), \`skip\` (body neither throws nor commits). Run each in \`try (Tx tx = new Tx()) { … }\`, catch the exception outside, and print \`<command>: <log entry> <caught message or ->\` per line.

Expected for \`ok fail skip\`:
\`\`\`
ok: commit -
fail: rollback failed
skip: rollback -
\`\`\``,
          starter: String.raw`import java.util.*;

class Tx implements AutoCloseable {
    static List<String> log = new ArrayList<>();
    private boolean committed = false;
    void commit() { committed = true; }
    @Override public void close() {
        // TODO
    }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            String cmd = in.next();
            Tx.log.clear();
            String caught = "-";
            // TODO: try-with-resources, catch IllegalStateException
            System.out.println(cmd + ": " + Tx.log.get(0) + " " + caught);
        }
    }
}
`,
          solution: String.raw`import java.util.*;

class Tx implements AutoCloseable {
    static List<String> log = new ArrayList<>();
    private boolean committed = false;
    void commit() { committed = true; }
    @Override public void close() {
        log.add(committed ? "commit" : "rollback");
    }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            String cmd = in.next();
            Tx.log.clear();
            String caught = "-";
            try (Tx tx = new Tx()) {
                if (cmd.equals("fail")) throw new IllegalStateException("failed");
                if (cmd.equals("ok")) tx.commit();
            } catch (IllegalStateException e) {
                caught = e.getMessage();
            }
            System.out.println(cmd + ": " + Tx.log.get(0) + " " + caught);
        }
    }
}
`,
          hints: ["close() runs on every exit; commit() before the block ends turns rollback into commit.", "The catch runs after close, so the log already has its entry."],
          cases: [
            { stdin: "3\nok fail skip\n", expected: "ok: commit -\nfail: rollback failed\nskip: rollback -\n" },
            { stdin: "2\nfail ok\n", expected: "fail: rollback failed\nok: commit -\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "The root of the exception hierarchy is…",
          options: ["`Exception`", "`Throwable`", "`Error`", "`RuntimeException`"],
          answer: 1,
          explanation: "`Throwable` has two direct subclasses: `Error` and `Exception`.",
        },
        {
          prompt: "Which pair is (checked, unchecked)?",
          options: ["(`NullPointerException`, `IOException`)", "(`IOException`, `IllegalStateException`)", "(`OutOfMemoryError`, `SQLException`)", "(`ArithmeticException`, `ClassCastException`)"],
          answer: 1,
          explanation: "`IOException` extends `Exception`; `IllegalStateException` extends `RuntimeException`.",
        },
        {
          prompt: "`throws` on a method lists…",
          options: ["Every exception it might throw", "The checked exceptions it may let escape (unchecked ones optionally, for documentation)", "Only unchecked exceptions", "Errors"],
          answer: 1,
          explanation: "The compiler tracks only checked exceptions through `throws` clauses.",
        },
        {
          prompt: "`int x = 1; try { return x; } finally { x = 2; }` returns…",
          options: ["2", "1 — the return value was evaluated before `finally` ran", "Compile error", "0"],
          answer: 1,
          explanation: "The value is captured at the `return` statement; `finally` cannot change it (unless it returns itself).",
        },
        {
          prompt: "Rethrowing with `throw e;` versus `throw new X(e);` differs in that…",
          options: ["Nothing", "`throw e` keeps the same object and trace; wrapping adds context and a new type while preserving the original as cause", "Wrapping loses the trace", "`throw e` is not allowed"],
          answer: 1,
          explanation: "Both preserve the evidence when the cause is passed; wrapping is for translating between layers.",
        },
        {
          prompt: "try-with-resources on `Closeable` versus `AutoCloseable`…",
          options: ["Only `Closeable` works", "Both work; `Closeable` is the I/O-specific subinterface whose `close()` throws `IOException`", "Only `AutoCloseable` works", "Neither — it needs `Resource`"],
          answer: 1,
          explanation: "`Closeable extends AutoCloseable`; either qualifies.",
        },
        {
          prompt: "`getSuppressed()` returns…",
          options: ["The cause", "Exceptions thrown while closing resources after a primary exception", "Ignored exceptions", "Nothing useful"],
          answer: 1,
          explanation: "try-with-resources attaches close failures to the primary exception rather than losing either.",
        },
        {
          prompt: "A custom exception's message should…",
          options: ["Say \"error\"", "State what was attempted and the values involved, without secrets", "Be empty", "Contain the stack trace"],
          answer: 1,
          explanation: "The message is for the person reading the log; the type and fields are for the program.",
        },
        {
          prompt: "Which is the correct handling when you cannot fix or add context?",
          options: ["Catch and log", "Catch and ignore", "Do not catch — let it propagate to a layer that can handle it", "Catch and return null"],
          answer: 2,
          explanation: "Catching without handling only hides or duplicates; propagation preserves the evidence for the real handler.",
        },
        {
          prompt: "Why are `try` blocks free when no exception is thrown?",
          options: ["They are not free", "Handlers are stored in a table; entering a `try` does no work — only throwing costs", "The JIT removes them", "Exceptions are pre-allocated"],
          answer: 1,
          explanation: "Cost lives in constructing (stack walk) and unwinding, not in guarding.",
        },
        {
          prompt: "`catch (Throwable t)` at the top of a server's request loop is…",
          options: ["Always wrong", "Acceptable there — to log and keep the process alive — while still rethrowing `Error`s", "Required everywhere", "A compile error"],
          answer: 1,
          explanation: "Top-level handlers are the one place for the broadest catch; business code should never have it.",
        },
        {
          prompt: "Absent-but-normal results (a lookup miss) are best signalled with…",
          options: ["An exception", "`Optional` (or a documented empty result), not an exception", "`null` always", "`System.exit`"],
          answer: 1,
          explanation: "Exceptions are for failures of operations that should have worked; expected outcomes get ordinary return values.",
        },
        {
          prompt: "`assert x > 0;` in production code with default JVM flags…",
          options: ["Throws `AssertionError` when false", "Does nothing — assertions are disabled without `-ea`", "Logs a warning", "Is a compile error"],
          answer: 1,
          explanation: "Never rely on assertions for validation that must run.",
        },
        {
          prompt: "After catching `InterruptedException` inside a helper, the right move is…",
          options: ["Ignore it", "Restore the flag with `Thread.currentThread().interrupt()` (or propagate the exception)", "Call `Thread.stop`", "Retry the sleep"],
          answer: 1,
          explanation: "The flag is cleared on throw; restoring it keeps the cancellation signal alive for callers.",
        },
      ],
    },
  ],
}, more);
