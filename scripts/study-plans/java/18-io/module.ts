import { defineModule } from "../../dsl.js";

export default defineModule(import.meta.url, {
  slug: "io",
  title: "I/O, files and time",
  blurb: "Byte and character streams with charsets, buffering and the fast-I/O template, Path and Files, serialization and CSV done right, and java.time — dates, zones, durations and formatting.",
  icon: "disk",
  overview: `Every program eventually talks to the outside world: it reads input faster than a Scanner can, writes a report, walks a directory, parses a CSV somebody exported from a spreadsheet, and gets a date wrong across a time zone. This module is the practical layer of Java that interviews probe with "how would you read a 10 GB file" and that judges probe with a two-second time limit.

It starts with the model behind java.io — byte streams, character streams, the charset between them, and the decorator stack — then gives you the fast-I/O template and the reasons it is fast. The java.nio.file lesson covers Path arithmetic (resolve, normalize, relativize) and the Files one-liners that replaced fifteen lines of java.io.File. Serialization is explained honestly: the mechanism, its knobs, and why the platform's own architects say to use JSON instead — followed by the CSV parser that split(",") is not. The module closes with java.time: the right type for each question, month arithmetic that clamps, zone conversion, Period versus Duration, and formatting with an explicit Locale.

The exercises are the tools themselves: a hex dump, a fast reader, a quote-aware CSV parser, a log analyser measuring spans in java.time.`,
  lessons: [
    {
      slug: "bytes-and-characters",
      file: "01-bytes-and-characters.md",
      exercises: [
        {
          title: "Count the bytes",
          prompt: `Read **all** of standard input as bytes, decode it as UTF-8 and strip the trailing line break. Print \`chars=<length()> codePoints=<codePointCount> utf8=<number of UTF-8 bytes>\` and then \`hex=<the UTF-8 bytes as two-digit lower-case hex, space-separated>\`. The three counts agree for ASCII and drift apart as soon as a character needs more than one byte.

Example: \`héllo\` →
\`\`\`
chars=5 codePoints=5 utf8=6
hex=68 c3 a9 6c 6c 6f
\`\`\``,
          starter: String.raw`import java.io.*;
import java.nio.charset.StandardCharsets;

public class Main {
    public static void main(String[] args) throws IOException {
        byte[] raw = System.in.readAllBytes();
        String s = new String(raw, StandardCharsets.UTF_8).stripTrailing();
        // TODO
    }
}
`,
          solution: String.raw`import java.io.*;
import java.nio.charset.StandardCharsets;

public class Main {
    public static void main(String[] args) throws IOException {
        byte[] raw = System.in.readAllBytes();
        String s = new String(raw, StandardCharsets.UTF_8).stripTrailing();
        byte[] utf8 = s.getBytes(StandardCharsets.UTF_8);
        System.out.println("chars=" + s.length() + " codePoints=" + s.codePointCount(0, s.length()) + " utf8=" + utf8.length);
        StringBuilder hex = new StringBuilder();
        for (byte b : utf8) {
            if (hex.length() > 0) hex.append(' ');
            hex.append(String.format("%02x", b & 0xff));
        }
        System.out.println("hex=" + hex);
    }
}
`,
          hints: ["Name the charset on both getBytes and new String — never rely on the default.", "b & 0xff turns a signed byte into 0..255 before formatting."],
          cases: [
            { stdin: "héllo\n", expected: "chars=5 codePoints=5 utf8=6\nhex=68 c3 a9 6c 6c 6f\n" },
            { stdin: "Hi!\n", expected: "chars=3 codePoints=3 utf8=3\nhex=48 69 21\n" },
            { stdin: "日本\n", expected: "chars=2 codePoints=2 utf8=6\nhex=e6 97 a5 e6 9c ac\n", hidden: true },
          ],
        },
        {
          title: "Big-endian round trip",
          prompt: `Read an integer \`n\` and \`n\` integers. Write them with a \`DataOutputStream\` over a \`ByteArrayOutputStream\`, then print \`bytes=<size of the buffer>\` and \`hex=<the buffer in two-digit hex, space-separated>\`. Finally read the buffer back through a \`DataInputStream\` over a \`ByteArrayInputStream\` and print \`readBack=<Arrays.toString of the ints>\`. Every \`int\` is four bytes, most significant first.

Example: \`2\` then \`258 -1\` →
\`\`\`
bytes=8
hex=00 00 01 02 ff ff ff ff
readBack=[258, -1]
\`\`\``,
          starter: String.raw`import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        int[] values = new int[n];
        for (int i = 0; i < n; i++) values[i] = in.nextInt();
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        // TODO
    }
}
`,
          solution: String.raw`import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        int[] values = new int[n];
        for (int i = 0; i < n; i++) values[i] = in.nextInt();
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        try (DataOutputStream out = new DataOutputStream(buffer)) {
            for (int v : values) out.writeInt(v);
        }
        byte[] bytes = buffer.toByteArray();
        System.out.println("bytes=" + bytes.length);
        StringBuilder hex = new StringBuilder();
        for (byte b : bytes) hex.append(hex.length() > 0 ? " " : "").append(String.format("%02x", b & 0xff));
        System.out.println("hex=" + hex);
        int[] back = new int[n];
        try (DataInputStream din = new DataInputStream(new ByteArrayInputStream(bytes))) {
            for (int i = 0; i < n; i++) back[i] = din.readInt();
        }
        System.out.println("readBack=" + Arrays.toString(back));
    }
}
`,
          hints: ["writeInt emits four bytes, high byte first.", "Read back exactly as many ints as you wrote — the stream has no idea where one value ends."],
          cases: [
            { stdin: "2\n258 -1\n", expected: "bytes=8\nhex=00 00 01 02 ff ff ff ff\nreadBack=[258, -1]\n" },
            { stdin: "1\n0\n", expected: "bytes=4\nhex=00 00 00 00\nreadBack=[0]\n" },
            { stdin: "3\n1 256 65536\n", expected: "bytes=12\nhex=00 00 00 01 00 00 01 00 00 01 00 00\nreadBack=[1, 256, 65536]\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`InputStream.read()` returns an `int` rather than a `byte` because…",
          options: ["Bytes are slow", "It must return −1 at end of stream, distinct from the byte value 0xFF", "`byte` cannot be returned", "Historical accident"],
          answer: 1,
          explanation: "0–255 for data, −1 for end; the same convention holds for `Reader.read()`.",
        },
        {
          prompt: "`new String(bytes)` without a charset on Java 17…",
          options: ["Always decodes UTF-8", "Uses the platform default — different machines may decode differently", "Throws", "Decodes Latin-1"],
          answer: 1,
          explanation: "Java 18 made UTF-8 the default (JEP 400); explicit `StandardCharsets.UTF_8` is still the habit.",
        },
        {
          prompt: "The correct order for reading a UTF-8 text file line by line is…",
          options: ["`BufferedReader` → `FileInputStream` → `InputStreamReader`", "`FileInputStream` wrapped in `InputStreamReader(UTF_8)` wrapped in `BufferedReader`", "`FileReader` only", "`Scanner` over `DataInputStream`"],
          answer: 1,
          explanation: "Bytes → decoded characters → buffering with `readLine()`; `Files.newBufferedReader` builds the same stack.",
        },
        {
          prompt: "Predict: `\"€\".length()` and `\"€\".getBytes(UTF_8).length`",
          options: ["`1` and `1`", "`1` and `3`", "`3` and `3`", "`2` and `1`"],
          answer: 1,
          explanation: "One UTF-16 unit; three UTF-8 bytes. An emoji would be 2 and 4.",
        },
        {
          prompt: "A program writes to a `BufferedWriter` and exits without closing it. The file…",
          options: ["Is complete", "May be empty or truncated — buffered data is written on `flush`/`close`", "Is corrupted", "Is locked"],
          answer: 1,
          explanation: "Try-with-resources closes (and therefore flushes) even when an exception escapes.",
        },
      ],
    },
    {
      slug: "buffering-and-fast-io",
      file: "02-buffering-and-fast-io.md",
      exercises: [
        {
          title: "The fast reader",
          prompt: `Read an integer \`n\` followed by \`n\` **long** integers that may be spread over any number of lines, using a \`BufferedReader\` and a \`StringTokenizer\` with a refill loop — **no \`Scanner\`**. Write the answer through a \`PrintWriter\` and flush it: \`sum=<sum> min=<smallest> max=<largest>\`.

Example (three lines): \`5\`, \`3 9\`, \`-2 7 1\` →
\`\`\`
sum=18 min=-2 max=9
\`\`\``,
          starter: String.raw`import java.io.*;
import java.util.*;

public class Main {
    static BufferedReader in = new BufferedReader(new InputStreamReader(System.in));
    static StringTokenizer st;

    static String next() throws IOException {
        // TODO: refill st from in.readLine() until it has a token
        return null;
    }

    public static void main(String[] args) throws IOException {
        PrintWriter out = new PrintWriter(new BufferedWriter(new OutputStreamWriter(System.out)));
        // TODO
        out.flush();
    }
}
`,
          solution: String.raw`import java.io.*;
import java.util.*;

public class Main {
    static BufferedReader in = new BufferedReader(new InputStreamReader(System.in));
    static StringTokenizer st;

    static String next() throws IOException {
        while (st == null || !st.hasMoreTokens()) st = new StringTokenizer(in.readLine());
        return st.nextToken();
    }

    public static void main(String[] args) throws IOException {
        PrintWriter out = new PrintWriter(new BufferedWriter(new OutputStreamWriter(System.out)));
        int n = Integer.parseInt(next());
        long sum = 0, min = Long.MAX_VALUE, max = Long.MIN_VALUE;
        for (int i = 0; i < n; i++) {
            long x = Long.parseLong(next());
            sum += x;
            min = Math.min(min, x);
            max = Math.max(max, x);
        }
        out.println("sum=" + sum + " min=" + min + " max=" + max);
        out.flush();
    }
}
`,
          hints: ["The refill loop is what makes the reader indifferent to line structure.", "Without out.flush() the judge sees no output at all."],
          cases: [
            { stdin: "5\n3 9\n-2 7 1\n", expected: "sum=18 min=-2 max=9\n" },
            { stdin: "3 10000000000 20000000000 30000000000\n", expected: "sum=60000000000 min=10000000000 max=30000000000\n" },
            { stdin: "4\n\n1\n\n2\n3\n4\n", expected: "sum=10 min=1 max=4\n", hidden: true },
          ],
        },
        {
          title: "A buffered report",
          prompt: `Read an integer \`n\` and \`n\` records \`name score\`. Through a \`PrintWriter\` wrapped around a buffered writer on \`System.out\`, print one CSV line per record, \`name,score,grade\`, where the grade is \`A\` for 90 and above, \`B\` for 75–89, \`C\` for 50–74, else \`F\`; then \`average=<mean score, two decimals>\` (use \`Locale.ROOT\`). Flush at the end.

Example: \`3\` then \`ann 91\`, \`bob 75\`, \`cy 40\` →
\`\`\`
ann,91,A
bob,75,B
cy,40,F
average=68.67
\`\`\``,
          starter: String.raw`import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader in = new BufferedReader(new InputStreamReader(System.in));
        PrintWriter out = new PrintWriter(new BufferedWriter(new OutputStreamWriter(System.out)));
        int n = Integer.parseInt(in.readLine().trim());
        // TODO
        out.flush();
    }
}
`,
          solution: String.raw`import java.io.*;
import java.util.*;

public class Main {
    static char grade(int s) { return s >= 90 ? 'A' : s >= 75 ? 'B' : s >= 50 ? 'C' : 'F'; }

    public static void main(String[] args) throws IOException {
        BufferedReader in = new BufferedReader(new InputStreamReader(System.in));
        PrintWriter out = new PrintWriter(new BufferedWriter(new OutputStreamWriter(System.out)));
        int n = Integer.parseInt(in.readLine().trim());
        long total = 0;
        for (int i = 0; i < n; i++) {
            StringTokenizer st = new StringTokenizer(in.readLine());
            String name = st.nextToken();
            int score = Integer.parseInt(st.nextToken());
            total += score;
            out.println(name + "," + score + "," + grade(score));
        }
        out.println(String.format(Locale.ROOT, "average=%.2f", n == 0 ? 0.0 : (double) total / n));
        out.flush();
    }
}
`,
          hints: ["One readLine per record; tokenize it.", "String.format with Locale.ROOT guarantees a dot as the decimal separator."],
          cases: [
            { stdin: "3\nann 91\nbob 75\ncy 40\n", expected: "ann,91,A\nbob,75,B\ncy,40,F\naverage=68.67\n" },
            { stdin: "1\nzed 50\n", expected: "zed,50,C\naverage=50.00\n" },
            { stdin: "2\na 89\nb 100\n", expected: "a,89,B\nb,100,A\naverage=94.50\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Buffering speeds I/O up mainly by…",
          options: ["Compressing data", "Reducing system calls: one 8 KB read serves thousands of small reads", "Using more threads", "Skipping the charset"],
          answer: 1,
          explanation: "A kernel round trip costs about a microsecond; unbuffered byte reads pay it every time.",
        },
        {
          prompt: "`Scanner` is slower than `BufferedReader` + `StringTokenizer` because…",
          options: ["It is unbuffered", "It tokenises with regular expressions and parses through strings per token", "It reads bytes", "It is synchronized"],
          answer: 1,
          explanation: "Roughly an order of magnitude on a million integers.",
        },
        {
          prompt: "A solution using `PrintWriter` prints nothing on the judge. The most likely cause is…",
          options: ["Wrong charset", "A missing `flush()`/`close()` — the output sits in the buffer", "The `PrintWriter` is deprecated", "Too much output"],
          answer: 1,
          explanation: "`new PrintWriter(System.out)` has no autoflush by default.",
        },
        {
          prompt: "`BufferedReader.readLine()` at end of input returns…",
          options: ["`\"\"`", "`null`", "Throws `EOFException`", "`-1`"],
          answer: 1,
          explanation: "`read()` returns −1; `readLine()` returns `null`; `Scanner.hasNext()` returns `false`.",
        },
        {
          prompt: "Formatting a decimal with `String.format(\"%.2f\", x)` and no locale on a German-locale judge prints…",
          options: ["`3.14`", "`3,14` — pass `Locale.ROOT` or `Locale.US`", "`3.140`", "An exception"],
          answer: 1,
          explanation: "Number formatting follows the default locale unless you say otherwise.",
        },
      ],
    },
    {
      slug: "files-and-paths",
      file: "03-files-and-paths.md",
      exercises: [
        {
          title: "Path arithmetic",
          prompt: `Read an absolute base path and an integer \`n\`, then \`n\` paths (relative or absolute). For each print one line: \`resolved=<base.resolve(p).normalize()> name=<file name> ext=<text after the last dot of the name, or ->  rel=<base.relativize(resolved)>\`. Nothing here touches the disk — the paths need not exist.

Example: base \`/srv/app\`, \`n = 2\`, paths \`../logs/./x.log\` and \`conf/app.yml\` →
\`\`\`
resolved=/srv/logs/x.log name=x.log ext=log rel=../logs/x.log
resolved=/srv/app/conf/app.yml name=app.yml ext=yml rel=conf/app.yml
\`\`\``,
          starter: String.raw`import java.nio.file.*;
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        Path base = Path.of(in.next());
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            Path p = Path.of(in.next());
            // TODO
        }
    }
}
`,
          solution: String.raw`import java.nio.file.*;
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        Path base = Path.of(in.next());
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            Path p = Path.of(in.next());
            Path resolved = base.resolve(p).normalize();
            String name = resolved.getFileName().toString();
            int dot = name.lastIndexOf('.');
            String ext = dot > 0 && dot < name.length() - 1 ? name.substring(dot + 1) : "-";
            System.out.println("resolved=" + resolved + " name=" + name + " ext=" + ext + " rel=" + base.relativize(resolved));
        }
    }
}
`,
          hints: ["resolve then normalize; relativize from the base to the resolved path.", "An absolute argument to resolve replaces the base — the relativize then climbs with .. segments."],
          cases: [
            { stdin: "/srv/app 2\n../logs/./x.log\nconf/app.yml\n", expected: "resolved=/srv/logs/x.log name=x.log ext=log rel=../logs/x.log\nresolved=/srv/app/conf/app.yml name=app.yml ext=yml rel=conf/app.yml\n" },
            { stdin: "/home/dev 2\nREADME\n/etc/hosts\n", expected: "resolved=/home/dev/README name=README ext=- rel=README\nresolved=/etc/hosts name=hosts ext=- rel=../../etc/hosts\n" },
            { stdin: "/a/b/c 2\n../../x.tar.gz\n./d/../e.txt\n", expected: "resolved=/a/x.tar.gz name=x.tar.gz ext=gz rel=../../x.tar.gz\nresolved=/a/b/c/e.txt name=e.txt ext=txt rel=e.txt\n", hidden: true },
          ],
        },
        {
          title: "Temp file round trip",
          prompt: `Read an integer \`n\` and \`n\` words. Create a temporary file with \`Files.createTempFile\`, write the words one per line with \`Files.write\`, and then — reading the file back, not your list — print \`lines=<Files.readAllLines(...).size()>\`, \`size=<Files.size in bytes>\` (every word plus one newline each), \`longest=<the first longest line, via Files.lines>\`. Finally delete the file and print \`deleted=<Files.deleteIfExists result> exists=<Files.exists>\`.

Example: \`3\` then \`kiwi fig banana\` →
\`\`\`
lines=3
size=16
longest=banana
deleted=true exists=false
\`\`\``,
          starter: String.raw`import java.io.IOException;
import java.nio.file.*;
import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) throws IOException {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<String> words = new ArrayList<>();
        for (int i = 0; i < n; i++) words.add(in.next());
        Path tmp = Files.createTempFile("study-", ".txt");
        // TODO
    }
}
`,
          solution: String.raw`import java.io.IOException;
import java.nio.file.*;
import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) throws IOException {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        List<String> words = new ArrayList<>();
        for (int i = 0; i < n; i++) words.add(in.next());
        Path tmp = Files.createTempFile("study-", ".txt");
        Files.write(tmp, words);
        System.out.println("lines=" + Files.readAllLines(tmp).size());
        System.out.println("size=" + Files.size(tmp));
        try (Stream<String> lines = Files.lines(tmp)) {
            System.out.println("longest=" + lines.max(Comparator.comparingInt(String::length)).orElse("-"));
        }
        boolean deleted = Files.deleteIfExists(tmp);
        System.out.println("deleted=" + deleted + " exists=" + Files.exists(tmp));
    }
}
`,
          hints: ["Files.write(path, lines) terminates every line with a newline.", "Files.lines holds the file open — close it in try-with-resources before deleting."],
          cases: [
            { stdin: "3\nkiwi fig banana\n", expected: "lines=3\nsize=16\nlongest=banana\ndeleted=true exists=false\n" },
            { stdin: "1\nx\n", expected: "lines=1\nsize=2\nlongest=x\ndeleted=true exists=false\n" },
            { stdin: "4\naa bbb cc ddd\n", expected: "lines=4\nsize=14\nlongest=bbb\ndeleted=true exists=false\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`Path.of(\"/srv/app\").resolve(\"/etc/passwd\")` returns…",
          options: ["`/srv/app/etc/passwd`", "`/etc/passwd` — an absolute argument replaces the base", "An exception", "`/srv/etc/passwd`"],
          answer: 1,
          explanation: "Always `normalize()` and check `startsWith(base)` when the argument comes from a user.",
        },
        {
          prompt: "`normalize()` differs from `toRealPath()` in that it…",
          options: ["Touches the disk", "Is purely syntactic — removes `.` and `..` without checking existence or links", "Follows symlinks", "Makes the path absolute"],
          answer: 1,
          explanation: "`toRealPath` resolves against the real file system and throws if the file is missing.",
        },
        {
          prompt: "Which `Files` methods return streams that must be closed?",
          options: ["`readAllLines`, `readString`", "`lines`, `list`, `walk`, `find`", "`exists`, `size`", "`writeString`"],
          answer: 1,
          explanation: "They hold a file or directory handle open while the stream lives — try-with-resources.",
        },
        {
          prompt: "`Files.createDirectories(p)` when `p` already exists…",
          options: ["Throws `FileAlreadyExistsException`", "Succeeds silently, like `mkdir -p`", "Deletes and recreates", "Returns `false`"],
          answer: 1,
          explanation: "`createDirectory` (singular) throws; `createFile` throws when the file exists.",
        },
        {
          prompt: "`java.io.File.delete()` on a missing file…",
          options: ["Throws `NoSuchFileException`", "Returns `false` with no explanation — one reason to prefer `Files.delete`", "Creates the file", "Blocks"],
          answer: 1,
          explanation: "`Files.delete` throws a named exception; `Files.deleteIfExists` returns a boolean deliberately.",
        },
      ],
    },
    {
      slug: "serialization-and-formats",
      file: "04-serialization-and-formats.md",
      exercises: [
        {
          title: "Serialize in memory",
          prompt: `Read \`user token x y\`. Define \`class Session implements Serializable\` with a \`String user\` and a \`transient String token\`, and \`record Point(int x, int y) implements Serializable\`. Write both objects to an \`ObjectOutputStream\` over a \`ByteArrayOutputStream\`, read them back through an \`ObjectInputStream\`, and print \`session=<user>/<token>\` (the token comes back as \`null\`), \`point=<the record's toString>\`, \`equalPoint=<restored.equals(original)>\` and \`samePoint=<restored == original>\`.

Example: \`ann secret 3 4\` →
\`\`\`
session=ann/null
point=Point[x=3, y=4]
equalPoint=true
samePoint=false
\`\`\``,
          starter: String.raw`import java.io.*;
import java.util.*;

class Session implements Serializable {
    private static final long serialVersionUID = 1L;
    // TODO: fields, constructor, getters
}

record Point(int x, int y) implements Serializable { }

public class Main {
    public static void main(String[] args) throws IOException, ClassNotFoundException {
        Scanner in = new Scanner(System.in);
        String user = in.next(), token = in.next();
        int x = in.nextInt(), y = in.nextInt();
        // TODO
    }
}
`,
          solution: String.raw`import java.io.*;
import java.util.*;

class Session implements Serializable {
    private static final long serialVersionUID = 1L;
    private final String user;
    private transient String token;
    Session(String user, String token) { this.user = user; this.token = token; }
    String user() { return user; }
    String token() { return token; }
}

record Point(int x, int y) implements Serializable { }

public class Main {
    public static void main(String[] args) throws IOException, ClassNotFoundException {
        Scanner in = new Scanner(System.in);
        String user = in.next(), token = in.next();
        int x = in.nextInt(), y = in.nextInt();
        Session session = new Session(user, token);
        Point point = new Point(x, y);

        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        try (ObjectOutputStream out = new ObjectOutputStream(buffer)) {
            out.writeObject(session);
            out.writeObject(point);
        }
        try (ObjectInputStream oin = new ObjectInputStream(new ByteArrayInputStream(buffer.toByteArray()))) {
            Session s2 = (Session) oin.readObject();
            Point p2 = (Point) oin.readObject();
            System.out.println("session=" + s2.user() + "/" + s2.token());
            System.out.println("point=" + p2);
            System.out.println("equalPoint=" + p2.equals(point));
            System.out.println("samePoint=" + (p2 == point));
        }
    }
}
`,
          hints: ["A transient field is not written; after readObject it holds its default — null.", "Records serialise through their canonical constructor; equals is by components, identity is not preserved."],
          cases: [
            { stdin: "ann secret 3 4\n", expected: "session=ann/null\npoint=Point[x=3, y=4]\nequalPoint=true\nsamePoint=false\n" },
            { stdin: "bob t -1 0\n", expected: "session=bob/null\npoint=Point[x=-1, y=0]\nequalPoint=true\nsamePoint=false\n" },
            { stdin: "zoe k 100 200\n", expected: "session=zoe/null\npoint=Point[x=100, y=200]\nequalPoint=true\nsamePoint=false\n", hidden: true },
          ],
        },
        {
          title: "CSV fields, with quotes",
          prompt: `Read CSV lines until end of input and split each into fields by the RFC 4180 rules: fields are separated by commas; a field wrapped in double quotes may contain commas; a doubled quote inside a quoted field is one literal quote. Print each line as \`<field count>: [<fields joined by |>]\`. Do **not** use \`split\`.

Example input
\`\`\`
a,b,c
"x, y",z
"He said ""hi""",1
a,,b
\`\`\`
→
\`\`\`
3: [a|b|c]
2: [x, y|z]
2: [He said "hi"|1]
3: [a||b]
\`\`\``,
          starter: String.raw`import java.io.*;
import java.util.*;

public class Main {
    static List<String> parse(String line) {
        List<String> fields = new ArrayList<>();
        StringBuilder cur = new StringBuilder();
        boolean quoted = false;
        // TODO: state machine
        fields.add(cur.toString());
        return fields;
    }

    public static void main(String[] args) throws IOException {
        BufferedReader in = new BufferedReader(new InputStreamReader(System.in));
        String line;
        while ((line = in.readLine()) != null) {
            if (line.isEmpty()) continue;
            List<String> f = parse(line);
            System.out.println(f.size() + ": [" + String.join("|", f) + "]");
        }
    }
}
`,
          solution: String.raw`import java.io.*;
import java.util.*;

public class Main {
    static List<String> parse(String line) {
        List<String> fields = new ArrayList<>();
        StringBuilder cur = new StringBuilder();
        boolean quoted = false;
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (quoted) {
                if (c == '"') {
                    if (i + 1 < line.length() && line.charAt(i + 1) == '"') { cur.append('"'); i++; }
                    else quoted = false;
                } else cur.append(c);
            } else if (c == '"') quoted = true;
            else if (c == ',') { fields.add(cur.toString()); cur.setLength(0); }
            else cur.append(c);
        }
        fields.add(cur.toString());
        return fields;
    }

    public static void main(String[] args) throws IOException {
        BufferedReader in = new BufferedReader(new InputStreamReader(System.in));
        String line;
        while ((line = in.readLine()) != null) {
            if (line.isEmpty()) continue;
            List<String> f = parse(line);
            System.out.println(f.size() + ": [" + String.join("|", f) + "]");
        }
    }
}
`,
          hints: ["Track one boolean: inside quotes or not. A comma only separates when outside.", "Inside quotes, a quote followed by another quote is a literal quote; a lone quote closes the field."],
          cases: [
            { stdin: "a,b,c\n\"x, y\",z\n\"He said \"\"hi\"\"\",1\na,,b\n", expected: "3: [a|b|c]\n2: [x, y|z]\n2: [He said \"hi\"|1]\n3: [a||b]\n" },
            { stdin: "solo\n\"\"\n", expected: "1: [solo]\n1: []\n" },
            { stdin: "\"a,b\",\"c\"\"d\",e\n1,2\n", expected: "3: [a,b|c\"d|e]\n2: [1|2]\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`Serializable` is…",
          options: ["An abstract class", "A marker interface with no methods", "An annotation", "A `final` class"],
          answer: 1,
          explanation: "It grants permission; `ObjectOutputStream` does the work reflectively.",
        },
        {
          prompt: "A `transient` field after deserialisation holds…",
          options: ["Its serialised value", "Its default value (`null`, `0`, `false`)", "A copy of the original", "An exception"],
          answer: 1,
          explanation: "Restore it in a custom `readObject` if it is needed.",
        },
        {
          prompt: "Omitting `serialVersionUID`…",
          options: ["Is recommended", "Lets the compiler derive one from the class shape, so unrelated edits break old data with `InvalidClassException`", "Disables serialization", "Makes the class immutable"],
          answer: 1,
          explanation: "Declare it explicitly and bump it on real format changes.",
        },
        {
          prompt: "Deserialising bytes from an untrusted client is dangerous because…",
          options: ["It is slow", "The sender chooses the classes and field values; gadget chains can execute code — filter or use JSON", "It uses reflection", "It needs a constructor"],
          answer: 1,
          explanation: "`ObjectInputFilter` whitelists classes; the better answer is a data format you control.",
        },
        {
          prompt: "`\"a,\\\"b,c\\\",d\".split(\",\")` produces…",
          options: ["3 fields", "4 pieces — `split` knows nothing about quotes", "2 fields", "An exception"],
          answer: 1,
          explanation: "A quote-aware state machine (or a CSV library) is the only correct parser.",
        },
        {
          prompt: "Records are safer to deserialise than classes because…",
          options: ["They cannot be serialised", "They are reconstructed through the canonical constructor, so invariants are re-checked", "They have no fields", "They are `transient`"],
          answer: 1,
          explanation: "Ordinary serialisable classes are rebuilt without any constructor running.",
        },
      ],
    },
    {
      slug: "java-time",
      file: "05-java-time.md",
      exercises: [
        {
          title: "Date arithmetic",
          prompt: `Read two ISO dates \`a\` and \`b\` (\`yyyy-MM-dd\`). Print:

- \`days=<ChronoUnit.DAYS.between(a, b)>\`
- \`period=<Period.between(a, b) as "Yy Mm Dd">\`
- \`dow=<a's day of week>\`
- \`leap=<a.isLeapYear()>\`
- \`nextMonth=<a.plusMonths(1)>\` — note the clamping
- \`lastDay=<a with the last day of its month>\`

Example: \`2024-01-31 2024-03-01\` →
\`\`\`
days=30
period=0y 1m 1d
dow=WEDNESDAY
leap=true
nextMonth=2024-02-29
lastDay=2024-01-31
\`\`\``,
          starter: String.raw`import java.time.*;
import java.time.temporal.*;
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        LocalDate a = LocalDate.parse(in.next());
        LocalDate b = LocalDate.parse(in.next());
        // TODO
    }
}
`,
          solution: String.raw`import java.time.*;
import java.time.temporal.*;
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        LocalDate a = LocalDate.parse(in.next());
        LocalDate b = LocalDate.parse(in.next());
        Period p = Period.between(a, b);
        System.out.println("days=" + ChronoUnit.DAYS.between(a, b));
        System.out.println("period=" + p.getYears() + "y " + p.getMonths() + "m " + p.getDays() + "d");
        System.out.println("dow=" + a.getDayOfWeek());
        System.out.println("leap=" + a.isLeapYear());
        System.out.println("nextMonth=" + a.plusMonths(1));
        System.out.println("lastDay=" + a.with(TemporalAdjusters.lastDayOfMonth()));
    }
}
`,
          hints: ["ChronoUnit.DAYS.between is signed: negative when b is before a.", "Period.between gives years, months and days separately; format them yourself."],
          cases: [
            { stdin: "2024-01-31 2024-03-01\n", expected: "days=30\nperiod=0y 1m 1d\ndow=WEDNESDAY\nleap=true\nnextMonth=2024-02-29\nlastDay=2024-01-31\n" },
            { stdin: "2023-12-25 2023-12-20\n", expected: "days=-5\nperiod=0y 0m -5d\ndow=MONDAY\nleap=false\nnextMonth=2024-01-25\nlastDay=2023-12-31\n" },
            { stdin: "2000-02-29 2001-03-01\n", expected: "days=366\nperiod=1y 0m 1d\ndow=TUESDAY\nleap=true\nnextMonth=2000-03-29\nlastDay=2000-02-29\n", hidden: true },
          ],
        },
        {
          title: "Zones and durations",
          prompt: `Read a local date-time (\`yyyy-MM-ddTHH:mm\`), a source zone id and a target zone id, then two times \`HH:mm\`. Print:

- \`source=<ZonedDateTime of the date-time in the source zone>\`
- \`target=<the same instant in the target zone>\` (\`withZoneSameInstant\`)
- \`instant=<the Instant>\`
- \`formatted=<the target date-time as "EEE, dd MMM yyyy HH:mm" in Locale.ENGLISH>\`
- \`duration=<Duration.between(t1, t2)>\` — it may be negative

Example: \`2024-03-01T09:30 Asia/Kolkata America/New_York\` then \`08:15 10:45\` →
\`\`\`
source=2024-03-01T09:30+05:30[Asia/Kolkata]
target=2024-02-29T23:00-05:00[America/New_York]
instant=2024-03-01T04:00:00Z
formatted=Thu, 29 Feb 2024 23:00
duration=PT2H30M
\`\`\``,
          starter: String.raw`import java.time.*;
import java.time.format.*;
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        LocalDateTime ldt = LocalDateTime.parse(in.next());
        ZoneId from = ZoneId.of(in.next()), to = ZoneId.of(in.next());
        LocalTime t1 = LocalTime.parse(in.next()), t2 = LocalTime.parse(in.next());
        // TODO
    }
}
`,
          solution: String.raw`import java.time.*;
import java.time.format.*;
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        LocalDateTime ldt = LocalDateTime.parse(in.next());
        ZoneId from = ZoneId.of(in.next()), to = ZoneId.of(in.next());
        LocalTime t1 = LocalTime.parse(in.next()), t2 = LocalTime.parse(in.next());
        ZonedDateTime source = ldt.atZone(from);
        ZonedDateTime target = source.withZoneSameInstant(to);
        System.out.println("source=" + source);
        System.out.println("target=" + target);
        System.out.println("instant=" + source.toInstant());
        System.out.println("formatted=" + DateTimeFormatter.ofPattern("EEE, dd MMM yyyy HH:mm", Locale.ENGLISH).format(target));
        System.out.println("duration=" + Duration.between(t1, t2));
    }
}
`,
          hints: ["withZoneSameInstant keeps the moment and changes the wall clock; withZoneSameLocal would do the opposite.", "Pass Locale.ENGLISH to the formatter so day and month names are stable."],
          cases: [
            { stdin: "2024-03-01T09:30 Asia/Kolkata America/New_York\n08:15 10:45\n", expected: "source=2024-03-01T09:30+05:30[Asia/Kolkata]\ntarget=2024-02-29T23:00-05:00[America/New_York]\ninstant=2024-03-01T04:00:00Z\nformatted=Thu, 29 Feb 2024 23:00\nduration=PT2H30M\n" },
            { stdin: "2024-07-04T12:00 Europe/London UTC\n23:00 01:00\n", expected: "source=2024-07-04T12:00+01:00[Europe/London]\ntarget=2024-07-04T11:00Z[UTC]\ninstant=2024-07-04T11:00:00Z\nformatted=Thu, 04 Jul 2024 11:00\nduration=PT-22H\n" },
            { stdin: "2024-12-31T23:30 UTC Asia/Tokyo\n09:00 09:00\n", expected: "source=2024-12-31T23:30Z[UTC]\ntarget=2025-01-01T08:30+09:00[Asia/Tokyo]\ninstant=2024-12-31T23:30:00Z\nformatted=Wed, 01 Jan 2025 08:30\nduration=PT0S\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "A person's birthday should be stored as…",
          options: ["`Instant`", "`LocalDate` — a calendar date with no time or zone", "`ZonedDateTime`", "`Duration`"],
          answer: 1,
          explanation: "The narrowest type that answers the question; a midnight `Date` shifts by a day across zones.",
        },
        {
          prompt: "`LocalDate.of(2024, 1, 31).plusMonths(1)` is…",
          options: ["`2024-03-02`", "`2024-02-29` — clamped to the last valid day", "An exception", "`2024-02-31`"],
          answer: 1,
          explanation: "Month arithmetic clamps rather than overflows.",
        },
        {
          prompt: "`Period` versus `Duration`:",
          options: ["Synonyms", "Calendar amounts (years/months/days) versus exact seconds — they differ across DST", "`Duration` is for dates", "`Period` is in milliseconds"],
          answer: 1,
          explanation: "`Period.ofDays(1)` across a DST change is 23 or 25 hours; `Duration.ofHours(24)` is exactly 24.",
        },
        {
          prompt: "To convert a `ZonedDateTime` to the same moment in another zone use…",
          options: ["`withZoneSameLocal`", "`withZoneSameInstant`", "`atZone`", "`toLocalDateTime`"],
          answer: 1,
          explanation: "`withZoneSameLocal` keeps the wall-clock time and changes the moment.",
        },
        {
          prompt: "`SimpleDateFormat` as a shared `static` field was a classic bug because…",
          options: ["It was slow", "It is mutable and not thread-safe; `DateTimeFormatter` is immutable and shareable", "It ignored locales", "It is deprecated"],
          answer: 1,
          explanation: "Concurrent `format` calls corrupted each other's output.",
        },
        {
          prompt: "Predict: `Duration.between(LocalTime.of(23, 0), LocalTime.of(1, 0))`",
          options: ["`PT2H`", "`PT-22H` — same-day arithmetic, so it goes backwards", "`PT22H`", "An exception"],
          answer: 1,
          explanation: "`LocalTime` has no date; crossing midnight needs `LocalDateTime` or a manual `plusDays`.",
        },
      ],
    },
    {
      slug: "io-checkpoint",
      file: "06-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "Log analyser",
          prompt: `Read log lines until end of input with a \`BufferedReader\`. Each line is \`<ISO date-time> <LEVEL> <message…>\`, for example \`2024-03-01T10:15:00 ERROR disk full\`. Skip blank lines. Print:

\`\`\`
lines=<count>
INFO=<n> WARN=<n> ERROR=<n> OTHER=<n>
first=<first timestamp> last=<last timestamp>
span=<minutes between first and last>m
firstError=<message of the first ERROR line, or ->
\`\`\`

Use \`LocalDateTime.parse\` and \`Duration.between\` for the span. Assume at least one line.`,
          starter: String.raw`import java.io.*;
import java.time.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader in = new BufferedReader(new InputStreamReader(System.in));
        String line;
        while ((line = in.readLine()) != null) {
            if (line.isBlank()) continue;
            // TODO
        }
        // TODO
    }
}
`,
          solution: String.raw`import java.io.*;
import java.time.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader in = new BufferedReader(new InputStreamReader(System.in));
        String line;
        int lines = 0, info = 0, warn = 0, error = 0, other = 0;
        LocalDateTime first = null, last = null;
        String firstError = null;
        while ((line = in.readLine()) != null) {
            if (line.isBlank()) continue;
            String[] parts = line.trim().split("\\s+", 3);
            LocalDateTime ts = LocalDateTime.parse(parts[0]);
            String level = parts.length > 1 ? parts[1] : "";
            String message = parts.length > 2 ? parts[2] : "";
            lines++;
            if (first == null) first = ts;
            last = ts;
            switch (level) {
                case "INFO" -> info++;
                case "WARN" -> warn++;
                case "ERROR" -> { error++; if (firstError == null) firstError = message; }
                default -> other++;
            }
        }
        System.out.println("lines=" + lines);
        System.out.println("INFO=" + info + " WARN=" + warn + " ERROR=" + error + " OTHER=" + other);
        System.out.println("first=" + first + " last=" + last);
        System.out.println("span=" + Duration.between(first, last).toMinutes() + "m");
        System.out.println("firstError=" + (firstError == null ? "-" : firstError));
    }
}
`,
          hints: [
            "split with a limit of 3 keeps the message intact.",
            "LocalDateTime.toString prints ISO format — exactly what the input used.",
            "Duration.between(first, last).toMinutes() truncates toward zero.",
          ],
          cases: [
            { stdin: "2024-03-01T10:15:00 INFO started\n2024-03-01T10:20:30 WARN slow query\n2024-03-01T11:05:00 ERROR disk full\n2024-03-01T11:06:00 DEBUG retry\n", expected: "lines=4\nINFO=1 WARN=1 ERROR=1 OTHER=1\nfirst=2024-03-01T10:15 last=2024-03-01T11:06\nspan=51m\nfirstError=disk full\n" },
            { stdin: "2024-01-01T00:00:00 INFO boot\n", expected: "lines=1\nINFO=1 WARN=0 ERROR=0 OTHER=0\nfirst=2024-01-01T00:00 last=2024-01-01T00:00\nspan=0m\nfirstError=-\n" },
            { stdin: "2024-05-05T23:59:00 ERROR a b c\n\n2024-05-06T00:01:30 ERROR later\n", expected: "lines=2\nINFO=0 WARN=0 ERROR=2 OTHER=0\nfirst=2024-05-05T23:59 last=2024-05-06T00:01:30\nspan=2m\nfirstError=a b c\n", hidden: true },
          ],
        },
        {
          title: "Hex dump",
          prompt: `Read all of standard input as raw bytes and print a hex dump, eight bytes per row: an 8-digit lower-case hex offset, two spaces, the bytes as two-digit hex separated by single spaces **padded to 23 characters**, two spaces, then the printable ASCII (\`0x20\`–\`0x7e\`) of the row between \`|\` bars with every other byte shown as \`.\`. Finally print \`total=<byte count>\`.

Example (input \`Hello, World!\` followed by a newline — 14 bytes) →
\`\`\`
00000000  48 65 6c 6c 6f 2c 20 57  |Hello, W|
00000008  6f 72 6c 64 21 0a        |orld!.|
total=14
\`\`\``,
          starter: String.raw`import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        byte[] data = System.in.readAllBytes();
        // TODO
        System.out.println("total=" + data.length);
    }
}
`,
          solution: String.raw`import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        byte[] data = System.in.readAllBytes();
        for (int off = 0; off < data.length; off += 8) {
            StringBuilder hex = new StringBuilder();
            StringBuilder ascii = new StringBuilder();
            for (int i = off; i < Math.min(off + 8, data.length); i++) {
                int b = data[i] & 0xff;
                if (hex.length() > 0) hex.append(' ');
                hex.append(String.format("%02x", b));
                ascii.append(b >= 0x20 && b <= 0x7e ? (char) b : '.');
            }
            while (hex.length() < 23) hex.append(' ');
            System.out.println(String.format("%08x", off) + "  " + hex + "  |" + ascii + "|");
        }
        System.out.println("total=" + data.length);
    }
}
`,
          hints: [
            "readAllBytes gives the raw input, newline included.",
            "b & 0xff before comparing or formatting; a signed byte is negative for values over 127.",
            "Pad the hex column to 23 characters so the ASCII bars line up on the last row.",
          ],
          cases: [
            { stdin: "Hello, World!\n", expected: "00000000  48 65 6c 6c 6f 2c 20 57  |Hello, W|\n00000008  6f 72 6c 64 21 0a        |orld!.|\ntotal=14\n" },
            { stdin: "ABCDEFGH", expected: "00000000  41 42 43 44 45 46 47 48  |ABCDEFGH|\ntotal=8\n" },
            { stdin: "a\tb\n", expected: "00000000  61 09 62 0a              |a.b.|\ntotal=4\n", hidden: true },
          ],
        },
        {
          title: "CSV to a fixed-width report",
          prompt: `Read CSV lines \`name,qty,price\` until end of input; the name may be quoted and contain commas (RFC 4180 rules, doubled quotes for a literal quote). Print one line per record formatted \`%-14s%5d%10.2f\` (name left-aligned in 14, quantity right-aligned in 5, line total \`qty × price\` in 10 with two decimals), then a final line in the same format with the name \`TOTAL\`, the total quantity and the grand total. Use \`Locale.ROOT\`.

Example input
\`\`\`
Widget,2,3.5
"Gear, large",1,10
\`\`\`
→
\`\`\`
Widget            2      7.00
Gear, large       1     10.00
TOTAL             3     17.00
\`\`\``,
          starter: String.raw`import java.io.*;
import java.util.*;

public class Main {
    static List<String> parse(String line) {
        // TODO: quote-aware CSV split
        return new ArrayList<>();
    }

    public static void main(String[] args) throws IOException {
        BufferedReader in = new BufferedReader(new InputStreamReader(System.in));
        String line;
        while ((line = in.readLine()) != null) {
            if (line.isBlank()) continue;
            // TODO
        }
        // TODO: TOTAL line
    }
}
`,
          solution: String.raw`import java.io.*;
import java.util.*;

public class Main {
    static List<String> parse(String line) {
        List<String> fields = new ArrayList<>();
        StringBuilder cur = new StringBuilder();
        boolean quoted = false;
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (quoted) {
                if (c == '"') {
                    if (i + 1 < line.length() && line.charAt(i + 1) == '"') { cur.append('"'); i++; }
                    else quoted = false;
                } else cur.append(c);
            } else if (c == '"') quoted = true;
            else if (c == ',') { fields.add(cur.toString()); cur.setLength(0); }
            else cur.append(c);
        }
        fields.add(cur.toString());
        return fields;
    }

    public static void main(String[] args) throws IOException {
        BufferedReader in = new BufferedReader(new InputStreamReader(System.in));
        String line;
        long totalQty = 0;
        double grand = 0;
        while ((line = in.readLine()) != null) {
            if (line.isBlank()) continue;
            List<String> f = parse(line);
            int qty = Integer.parseInt(f.get(1).trim());
            double price = Double.parseDouble(f.get(2).trim());
            double total = qty * price;
            totalQty += qty;
            grand += total;
            System.out.println(String.format(Locale.ROOT, "%-14s%5d%10.2f", f.get(0), qty, total));
        }
        System.out.println(String.format(Locale.ROOT, "%-14s%5d%10.2f", "TOTAL", totalQty, grand));
    }
}
`,
          hints: [
            "Reuse the state-machine parser from the serialization lesson.",
            "%-14s pads on the right; %5d and %10.2f pad on the left.",
            "Locale.ROOT keeps the decimal point a dot whatever the judge's locale.",
          ],
          cases: [
            { stdin: "Widget,2,3.5\n\"Gear, large\",1,10\n", expected: "Widget            2      7.00\nGear, large       1     10.00\nTOTAL             3     17.00\n" },
            { stdin: "\"Bolt \"\"M8\"\"\",10,0.25\n", expected: "Bolt \"M8\"        10      2.50\nTOTAL            10      2.50\n" },
            { stdin: "a,1,1\nb,2,2.5\nc,0,99\n", expected: "a                 1      1.00\nb                 2      5.00\nc                 0      0.00\nTOTAL             3      6.00\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`Reader`/`Writer` differ from `InputStream`/`OutputStream` in that they…",
          options: ["Are faster", "Move characters, decoded through a charset, rather than raw bytes", "Are unbuffered", "Cannot be closed"],
          answer: 1,
          explanation: "`InputStreamReader`/`OutputStreamWriter` are the bridges.",
        },
        {
          prompt: "Predict: `\"日本\".length()` and its UTF-8 byte count",
          options: ["`2` and `2`", "`2` and `6`", "`6` and `6`", "`4` and `6`"],
          answer: 1,
          explanation: "Two UTF-16 units, three bytes each in UTF-8.",
        },
        {
          prompt: "The single biggest cost of unbuffered I/O is…",
          options: ["Charset decoding", "A system call per small read or write", "Object allocation", "Thread switching"],
          answer: 1,
          explanation: "An 8 KB buffer amortises it across thousands of operations.",
        },
        {
          prompt: "Reading ten million integers fastest in Java uses…",
          options: ["`Scanner.nextInt`", "A byte-level reader over `BufferedInputStream`, parsing digits by hand", "`Files.readAllLines`", "`String.split` per line"],
          answer: 1,
          explanation: "Zero allocation per number; `BufferedReader` + `StringTokenizer` is the everyday compromise.",
        },
        {
          prompt: "`base.resolve(userInput).normalize().startsWith(base)` is checked to prevent…",
          options: ["Slow paths", "Path traversal — `..` or an absolute path escaping the trusted directory", "Symlinks", "Long file names"],
          answer: 1,
          explanation: "An absolute argument replaces the base entirely; `..` climbs out of it.",
        },
        {
          prompt: "`Files.lines(path)` should be used…",
          options: ["Without closing", "Inside try-with-resources — it holds the file open while the stream lives", "Only for small files", "Never"],
          answer: 1,
          explanation: "Same for `list`, `walk` and `find`.",
        },
        {
          prompt: "`Files.move(src, dst, ATOMIC_MOVE)` is atomic…",
          options: ["Always", "On the same file system (a rename); across file systems it may fail", "Never", "Only for directories"],
          answer: 1,
          explanation: "Cross-device moves copy then delete.",
        },
        {
          prompt: "During Java deserialisation of an ordinary `Serializable` class…",
          options: ["The no-arg constructor runs", "No constructor of the serialisable class runs — fields are set directly", "All constructors run", "`readObject` is forbidden"],
          answer: 1,
          explanation: "Invariants are not re-checked — one reason records (canonical constructor) are safer.",
        },
        {
          prompt: "A quote inside a quoted CSV field is written as…",
          options: ["`\\\"`", "`\"\"` — a doubled quote", "`'`", "It is not allowed"],
          answer: 1,
          explanation: "RFC 4180; a parser must treat `\"\"` inside quotes as one literal quote.",
        },
        {
          prompt: "`Instant` represents…",
          options: ["A calendar date", "A point on the UTC timeline", "A wall-clock time in a zone", "An amount of time"],
          answer: 1,
          explanation: "Timestamps and logs; convert to a zone only for display.",
        },
        {
          prompt: "`LocalDateTime` is ambiguous as a moment because…",
          options: ["It has no seconds", "It carries no zone or offset — 09:30 where?", "It is mutable", "It uses zero-based months"],
          answer: 1,
          explanation: "Attach a zone (`atZone`) to get a `ZonedDateTime` before comparing with an `Instant`.",
        },
        {
          prompt: "`ChronoUnit.DAYS.between(later, earlier)` returns…",
          options: ["A positive count", "A negative count — it is signed, `earlier − later`", "Zero", "An exception"],
          answer: 1,
          explanation: "Order the arguments, or take `Math.abs`.",
        },
        {
          prompt: "Formatting `EEE, dd MMM yyyy` without a `Locale`…",
          options: ["Always prints English", "Prints names in the default locale — pass `Locale.ENGLISH` for stable output", "Throws", "Prints numbers only"],
          answer: 1,
          explanation: "The judge's locale is not yours.",
        },
        {
          prompt: "`\"IST\"` as a zone id is a bad idea because…",
          options: ["It is too short", "It is ambiguous (India, Ireland, Israel); use IANA region ids like `Asia/Kolkata`", "It is deprecated", "It has no DST"],
          answer: 1,
          explanation: "Region ids carry the full rule history.",
        },
        {
          prompt: "Making code that calls `LocalDate.now()` testable is done by…",
          options: ["Mocking the JVM clock", "Injecting a `Clock` and calling `now(clock)`; tests use `Clock.fixed`", "Sleeping", "Using `Date`"],
          answer: 1,
          explanation: "Every `now()` overload accepts a `Clock` for this reason.",
        },
      ],
    },
  ],
});
