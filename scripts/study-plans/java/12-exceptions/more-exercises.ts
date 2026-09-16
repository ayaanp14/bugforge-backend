import type { ExerciseSource } from "../../dsl.js";

/** A second program per lesson (a third for the checkpoint) — see defineModule's `extras`. */
const more: Record<string, ExerciseSource[]> = {
  "exception-hierarchy": [
    {
      title: "Catch the specific one first",
      prompt: `Read \`n\` commands. \`parse <text>\` calls \`Integer.parseInt\`; \`divide <a> <b>\` computes \`a / b\`; \`index <i>\` reads element \`i\` of a three-element array \`{10, 20, 30}\`. Run each inside one \`try\` with catch blocks ordered **most specific first**: \`NumberFormatException\` → \`bad number: <text>\`, \`ArithmeticException\` → \`arithmetic: <message>\`, \`ArrayIndexOutOfBoundsException\` → \`index: <message>\`, and a final \`RuntimeException\` → \`other: <simple class name>\`. On success print the result.

Example: \`4\` then \`parse 42\`, \`parse x\`, \`divide 1 0\`, \`index 5\` →
\`\`\`
42
bad number: x
arithmetic: / by zero
index: Index 5 out of bounds for length 3
\`\`\``,
      starter: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        int[] data = {10, 20, 30};
        for (int i = 0; i < n; i++) {
            String cmd = in.next();
            try {
                // TODO
            } catch (NumberFormatException e) {
                // TODO
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
        int[] data = {10, 20, 30};
        for (int i = 0; i < n; i++) {
            String cmd = in.next();
            String text = null;
            try {
                switch (cmd) {
                    case "parse" -> { text = in.next(); System.out.println(Integer.parseInt(text)); }
                    case "divide" -> { int a = in.nextInt(), b = in.nextInt(); System.out.println(a / b); }
                    default -> System.out.println(data[in.nextInt()]);
                }
            } catch (NumberFormatException e) {
                System.out.println("bad number: " + text);
            } catch (ArithmeticException e) {
                System.out.println("arithmetic: " + e.getMessage());
            } catch (ArrayIndexOutOfBoundsException e) {
                System.out.println("index: " + e.getMessage());
            } catch (RuntimeException e) {
                System.out.println("other: " + e.getClass().getSimpleName());
            }
        }
    }
}
`,
      hints: ["A catch for a superclass placed first would make the later, more specific ones unreachable — the compiler rejects it.", "getMessage() carries the JVM's own wording: '/ by zero', 'Index 5 out of bounds for length 3'."],
      cases: [
        { stdin: "4\nparse 42\nparse x\ndivide 1 0\nindex 5\n", expected: "42\nbad number: x\narithmetic: / by zero\nindex: Index 5 out of bounds for length 3\n" },
        { stdin: "2\nindex 2\ndivide 9 3\n", expected: "30\n3\n" },
        { stdin: "3\nindex -1\nparse 2147483648\nparse -7\n", expected: "index: Index -1 out of bounds for length 3\nbad number: 2147483648\n-7\n", hidden: true },
      ],
    },
  ],
  "checked-vs-unchecked": [
    {
      title: "Wrap the checked one",
      prompt: `Write \`static String readConfig(String name) throws java.io.IOException\` that throws \`new IOException("missing: " + name)\` when the name starts with \`missing-\` and otherwise returns \`name + "=ok"\`. Then write \`static String load(String name)\` with **no** \`throws\` clause that calls \`readConfig\` and wraps any \`IOException\` in an \`UncheckedIOException\`. Read \`n\` names; for each call \`load\` and print the value, or catch the \`UncheckedIOException\` and print \`unchecked: <cause message>\`.

Example: \`2\` then \`app missing-db\` →
\`\`\`
app=ok
unchecked: missing: missing-db
\`\`\``,
      starter: String.raw`import java.io.*;
import java.util.*;

public class Main {
    static String readConfig(String name) throws IOException {
        // TODO
        return name;
    }
    static String load(String name) {
        // TODO: call readConfig, wrap IOException in UncheckedIOException
        return name;
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            String name = in.next();
            // TODO
        }
    }
}
`,
      solution: String.raw`import java.io.*;
import java.util.*;

public class Main {
    static String readConfig(String name) throws IOException {
        if (name.startsWith("missing-")) throw new IOException("missing: " + name);
        return name + "=ok";
    }
    static String load(String name) {
        try {
            return readConfig(name);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            String name = in.next();
            try {
                System.out.println(load(name));
            } catch (UncheckedIOException e) {
                System.out.println("unchecked: " + e.getCause().getMessage());
            }
        }
    }
}
`,
      hints: ["A method without a throws clause cannot let a checked exception escape — it must catch or wrap.", "UncheckedIOException keeps the original as its cause; getCause() gets it back."],
      cases: [
        { stdin: "2\napp missing-db\n", expected: "app=ok\nunchecked: missing: missing-db\n" },
        { stdin: "1\nmissing-\n", expected: "unchecked: missing: missing-\n" },
        { stdin: "3\na b missing-c\n", expected: "a=ok\nb=ok\nunchecked: missing: missing-c\n", hidden: true },
      ],
    },
  ],
  "try-catch-finally": [
    {
      title: "finally, counted",
      prompt: `Write \`static int classify(int x)\`: inside a \`try\`, \`return 1\` when \`x > 0\`, throw \`IllegalArgumentException\` when \`x < 0\`, and \`return 0\` otherwise; the \`finally\` block increments a static counter \`finallyRuns\` **every** time. Read \`n\` integers; for each print \`<x> -> <result>\` or \`<x> -> error\`, and at the end \`finallyRuns=<count>\` — it equals \`n\`, because \`finally\` runs on return and on throw alike.

Example: \`3\` then \`5 -2 0\` →
\`\`\`
5 -> 1
-2 -> error
0 -> 0
finallyRuns=3
\`\`\``,
      starter: String.raw`import java.util.*;

public class Main {
    static int finallyRuns = 0;

    static int classify(int x) {
        try {
            // TODO
            return 0;
        } finally {
            // TODO
        }
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            int x = in.nextInt();
            // TODO
        }
        System.out.println("finallyRuns=" + finallyRuns);
    }
}
`,
      solution: String.raw`import java.util.*;

public class Main {
    static int finallyRuns = 0;

    static int classify(int x) {
        try {
            if (x > 0) return 1;
            if (x < 0) throw new IllegalArgumentException("negative");
            return 0;
        } finally {
            finallyRuns++;
        }
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            int x = in.nextInt();
            try {
                System.out.println(x + " -> " + classify(x));
            } catch (IllegalArgumentException e) {
                System.out.println(x + " -> error");
            }
        }
        System.out.println("finallyRuns=" + finallyRuns);
    }
}
`,
      hints: ["finally runs after the return value is computed and before the caller receives it.", "It also runs while an exception is on its way out — the counter proves both."],
      cases: [
        { stdin: "3\n5 -2 0\n", expected: "5 -> 1\n-2 -> error\n0 -> 0\nfinallyRuns=3\n" },
        { stdin: "1\n-1\n", expected: "-1 -> error\nfinallyRuns=1\n" },
        { stdin: "4\n1 2 3 4\n", expected: "1 -> 1\n2 -> 1\n3 -> 1\n4 -> 1\nfinallyRuns=4\n", hidden: true },
      ],
    },
  ],
  "try-with-resources": [
    {
      title: "A resource pool that closes in order",
      prompt: `Write \`class Conn implements AutoCloseable\` whose constructor prints \`open <name>\` and whose \`close()\` prints \`close <name>\`. Read \`n\` names. Open all of them in **one** try-with-resources statement is impossible for a variable count — so open them in a loop nested with recursion: \`static void useAll(List<String> names, int i)\` opens \`names.get(i)\` in a try-with-resources and recurses for \`i + 1\`; when \`i == names.size()\` print \`working with <n> connections\`. The output shows the opens, the work, then the closes in **reverse** order.

Example: \`2\` then \`db cache\` →
\`\`\`
open db
open cache
working with 2 connections
close cache
close db
\`\`\``,
      starter: String.raw`import java.util.*;

class Conn implements AutoCloseable {
    final String name;
    Conn(String name) { this.name = name; System.out.println("open " + name); }
    @Override public void close() { System.out.println("close " + name); }
}

public class Main {
    static void useAll(List<String> names, int i) {
        // TODO
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<String> names = new ArrayList<>();
        for (int i = 0; i < n; i++) names.add(in.next());
        useAll(names, 0);
    }
}
`,
      solution: String.raw`import java.util.*;

class Conn implements AutoCloseable {
    final String name;
    Conn(String name) { this.name = name; System.out.println("open " + name); }
    @Override public void close() { System.out.println("close " + name); }
}

public class Main {
    static void useAll(List<String> names, int i) {
        if (i == names.size()) {
            System.out.println("working with " + names.size() + " connections");
            return;
        }
        try (Conn c = new Conn(names.get(i))) {
            useAll(names, i + 1);
        }
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<String> names = new ArrayList<>();
        for (int i = 0; i < n; i++) names.add(in.next());
        useAll(names, 0);
    }
}
`,
      hints: ["Each recursive frame owns one resource; unwinding the recursion closes them innermost first.", "The variable c is unused inside the block — that is fine; it exists to be closed."],
      cases: [
        { stdin: "2\ndb cache\n", expected: "open db\nopen cache\nworking with 2 connections\nclose cache\nclose db\n" },
        { stdin: "0\n", expected: "working with 0 connections\n" },
        { stdin: "3\na b c\n", expected: "open a\nopen b\nopen c\nworking with 3 connections\nclose c\nclose b\nclose a\n", hidden: true },
      ],
    },
  ],
  "custom-exceptions": [
    {
      title: "Insufficient funds, with data",
      prompt: `Write \`class InsufficientFundsException extends Exception\` carrying \`long shortfall\` (a field with a getter) and the message \`short by <shortfall>\`. \`class Account\` has a balance and \`void withdraw(long amount) throws InsufficientFundsException\`. Read an opening balance and \`n\` withdrawals; for each print \`withdrew <amount>, balance <b>\` or \`refused: <message> (shortfall=<n>)\` using the getter, and finally \`refused=<count>\`.

Example: \`100\` then \`3\` then \`30 90 20\` →
\`\`\`
withdrew 30, balance 70
refused: short by 20 (shortfall=20)
withdrew 20, balance 50
refused=1
\`\`\``,
      starter: String.raw`import java.util.*;

class InsufficientFundsException extends Exception {
    // TODO: field, constructor, getter
}

class Account {
    private long balance;
    Account(long balance) { this.balance = balance; }
    long balance() { return balance; }
    void withdraw(long amount) throws InsufficientFundsException {
        // TODO
    }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        Account acct = new Account(in.nextLong());
        int n = in.nextInt();
        int refused = 0;
        for (int i = 0; i < n; i++) {
            long amount = in.nextLong();
            // TODO
        }
        System.out.println("refused=" + refused);
    }
}
`,
      solution: String.raw`import java.util.*;

class InsufficientFundsException extends Exception {
    private final long shortfall;
    InsufficientFundsException(long shortfall) {
        super("short by " + shortfall);
        this.shortfall = shortfall;
    }
    long getShortfall() { return shortfall; }
}

class Account {
    private long balance;
    Account(long balance) { this.balance = balance; }
    long balance() { return balance; }
    void withdraw(long amount) throws InsufficientFundsException {
        if (amount > balance) throw new InsufficientFundsException(amount - balance);
        balance -= amount;
    }
}

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        Account acct = new Account(in.nextLong());
        int n = in.nextInt();
        int refused = 0;
        for (int i = 0; i < n; i++) {
            long amount = in.nextLong();
            try {
                acct.withdraw(amount);
                System.out.println("withdrew " + amount + ", balance " + acct.balance());
            } catch (InsufficientFundsException e) {
                refused++;
                System.out.println("refused: " + e.getMessage() + " (shortfall=" + e.getShortfall() + ")");
            }
        }
        System.out.println("refused=" + refused);
    }
}
`,
      hints: ["A custom exception is a class: fields and getters let the catcher act on data, not parse a message.", "Check before mutating so a refused withdrawal leaves the balance untouched."],
      cases: [
        { stdin: "100\n3\n30 90 20\n", expected: "withdrew 30, balance 70\nrefused: short by 20 (shortfall=20)\nwithdrew 20, balance 50\nrefused=1\n" },
        { stdin: "0\n1\n1\n", expected: "refused: short by 1 (shortfall=1)\nrefused=1\n" },
        { stdin: "50\n3\n50 0 1\n", expected: "withdrew 50, balance 0\nwithdrew 0, balance 0\nrefused: short by 1 (shortfall=1)\nrefused=1\n", hidden: true },
      ],
    },
  ],
  "best-practices": [
    {
      title: "Retry with a budget",
      prompt: `Simulate a flaky call. Read \`maxAttempts\` and \`n\` scenarios, each a string of \`F\` (fail) and \`S\` (succeed) describing what successive attempts would do. Write \`static String callWithRetry(String outcomes, int maxAttempts)\` that tries up to \`maxAttempts\` times, throwing \`IllegalStateException("attempt <k> failed")\` internally on \`F\` and catching it to retry; on \`S\` return \`ok after <k> attempts\`. If the budget is exhausted, rethrow the **last** failure with the attempts so far as suppressed exceptions and let the caller print \`gave up: <message> (suppressed=<count>)\`. Never swallow silently.

Example: \`3\` then \`2\` then \`FS FFF\` →
\`\`\`
ok after 2 attempts
gave up: attempt 3 failed (suppressed=2)
\`\`\``,
      starter: String.raw`import java.util.*;

public class Main {
    static String attempt(char outcome, int k) {
        if (outcome == 'F') throw new IllegalStateException("attempt " + k + " failed");
        return "ok after " + k + " attempts";
    }

    static String callWithRetry(String outcomes, int maxAttempts) {
        // TODO
        return "";
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int maxAttempts = in.nextInt();
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            String outcomes = in.next();
            try {
                System.out.println(callWithRetry(outcomes, maxAttempts));
            } catch (IllegalStateException e) {
                System.out.println("gave up: " + e.getMessage() + " (suppressed=" + e.getSuppressed().length + ")");
            }
        }
    }
}
`,
      solution: String.raw`import java.util.*;

public class Main {
    static String attempt(char outcome, int k) {
        if (outcome == 'F') throw new IllegalStateException("attempt " + k + " failed");
        return "ok after " + k + " attempts";
    }

    static String callWithRetry(String outcomes, int maxAttempts) {
        List<IllegalStateException> failures = new ArrayList<>();
        for (int k = 1; k <= maxAttempts; k++) {
            char outcome = k - 1 < outcomes.length() ? outcomes.charAt(k - 1) : 'F';
            try {
                return attempt(outcome, k);
            } catch (IllegalStateException e) {
                failures.add(e);
            }
        }
        IllegalStateException last = failures.get(failures.size() - 1);
        for (int i = 0; i < failures.size() - 1; i++) last.addSuppressed(failures.get(i));
        throw last;
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int maxAttempts = in.nextInt();
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            String outcomes = in.next();
            try {
                System.out.println(callWithRetry(outcomes, maxAttempts));
            } catch (IllegalStateException e) {
                System.out.println("gave up: " + e.getMessage() + " (suppressed=" + e.getSuppressed().length + ")");
            }
        }
    }
}
`,
      hints: ["Keep every failure; when you give up, attach the earlier ones to the last with addSuppressed so nothing is lost.", "Retry only the operation, never the whole program — the loop is the retry boundary."],
      cases: [
        { stdin: "3\n2\nFS FFF\n", expected: "ok after 2 attempts\ngave up: attempt 3 failed (suppressed=2)\n" },
        { stdin: "1\n2\nS F\n", expected: "ok after 1 attempts\ngave up: attempt 1 failed (suppressed=0)\n" },
        { stdin: "4\n2\nFFFS FFFFS\n", expected: "ok after 4 attempts\ngave up: attempt 4 failed (suppressed=3)\n", hidden: true },
      ],
    },
  ],
  "exceptions-checkpoint": [
    {
      title: "A calculator that never crashes",
      prompt: `Read expression lines \`<a> <op> <b>\` until end of input and evaluate each, turning every failure into a message: a non-integer operand → \`error: bad operand '<token>'\` (\`NumberFormatException\`); division or modulo by zero → \`error: division by zero\` (\`ArithmeticException\`); an unknown operator → \`error: unknown operator '<op>'\` (throw and catch your own \`UnknownOperatorException extends Exception\`); a line with fewer than three tokens → \`error: malformed line\`. Print results as \`<a> <op> <b> = <value>\`. Finish with \`ok=<count> errors=<count>\`.

Example input
\`\`\`
6 * 7
1 / 0
2 ^ 3
x + 1
\`\`\`
→
\`\`\`
6 * 7 = 42
error: division by zero
error: unknown operator '^'
error: bad operand 'x'
ok=1 errors=3
\`\`\``,
      starter: String.raw`import java.io.*;
import java.util.*;

class UnknownOperatorException extends Exception {
    UnknownOperatorException(String op) { super(op); }
}

public class Main {
    static long apply(long a, String op, long b) throws UnknownOperatorException {
        // TODO
        return 0;
    }

    public static void main(String[] args) throws IOException {
        BufferedReader in = new BufferedReader(new InputStreamReader(System.in));
        String line;
        int ok = 0, errors = 0;
        while ((line = in.readLine()) != null) {
            if (line.isBlank()) continue;
            String[] t = line.trim().split("\\s+");
            // TODO
        }
        System.out.println("ok=" + ok + " errors=" + errors);
    }
}
`,
      solution: String.raw`import java.io.*;
import java.util.*;

class UnknownOperatorException extends Exception {
    UnknownOperatorException(String op) { super(op); }
}

public class Main {
    static long apply(long a, String op, long b) throws UnknownOperatorException {
        switch (op) {
            case "+": return a + b;
            case "-": return a - b;
            case "*": return a * b;
            case "/": return a / b;
            case "%": return a % b;
            default: throw new UnknownOperatorException(op);
        }
    }

    public static void main(String[] args) throws IOException {
        BufferedReader in = new BufferedReader(new InputStreamReader(System.in));
        String line;
        int ok = 0, errors = 0;
        while ((line = in.readLine()) != null) {
            if (line.isBlank()) continue;
            String[] t = line.trim().split("\\s+");
            String bad = null;
            try {
                if (t.length < 3) { System.out.println("error: malformed line"); errors++; continue; }
                bad = t[0];
                long a = Long.parseLong(t[0]);
                bad = t[2];
                long b = Long.parseLong(t[2]);
                System.out.println(a + " " + t[1] + " " + b + " = " + apply(a, t[1], b));
                ok++;
            } catch (NumberFormatException e) {
                System.out.println("error: bad operand '" + bad + "'");
                errors++;
            } catch (ArithmeticException e) {
                System.out.println("error: division by zero");
                errors++;
            } catch (UnknownOperatorException e) {
                System.out.println("error: unknown operator '" + e.getMessage() + "'");
                errors++;
            }
        }
        System.out.println("ok=" + ok + " errors=" + errors);
    }
}
`,
      hints: [
        "Track which token you are parsing so the message can name it.",
        "One try per line: the loop keeps going whatever a line throws.",
        "Your own checked exception forces the caller to handle the unknown operator explicitly.",
      ],
      cases: [
        { stdin: "6 * 7\n1 / 0\n2 ^ 3\nx + 1\n", expected: "6 * 7 = 42\nerror: division by zero\nerror: unknown operator '^'\nerror: bad operand 'x'\nok=1 errors=3\n" },
        { stdin: "5 %\n10 % 3\n", expected: "error: malformed line\n10 % 3 = 1\nok=1 errors=1\n" },
        { stdin: "7 - 10\n3 * y\n\n8 % 0\n", expected: "7 - 10 = -3\nerror: bad operand 'y'\nerror: division by zero\nok=1 errors=2\n", hidden: true },
      ],
    },
  ],
};

export default more;
