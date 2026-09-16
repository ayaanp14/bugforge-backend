import type { ExerciseSource } from "../../dsl.js";

/** A second program per lesson (a third for the checkpoint) — see defineModule's `extras`. */
const more: Record<string, ExerciseSource[]> = {
  primitives: [
    {
      title: "Bits of an int",
      prompt: `Read an integer \`n\` and \`n\` \`int\` values. For each print \`<x>: bin=<Integer.toBinaryString> hex=<Integer.toHexString> ones=<Integer.bitCount> sign=<negative|non-negative>\`. Negative numbers show their two's-complement pattern — thirty-two bits, most of them ones.

Example: \`3\` then \`5 -1 255\` →
\`\`\`
5: bin=101 hex=5 ones=2 sign=non-negative
-1: bin=11111111111111111111111111111111 hex=ffffffff ones=32 sign=negative
255: bin=11111111 hex=ff ones=8 sign=non-negative
\`\`\``,
      starter: String.raw`import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            int x = in.nextInt();
            // TODO
        }
    }
}
`,
      solution: String.raw`import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            int x = in.nextInt();
            System.out.println(x + ": bin=" + Integer.toBinaryString(x) + " hex=" + Integer.toHexString(x)
                + " ones=" + Integer.bitCount(x) + " sign=" + (x < 0 ? "negative" : "non-negative"));
        }
    }
}
`,
      hints: ["Integer.toBinaryString treats the int as unsigned bits — that is the two's-complement view.", "bitCount counts the ones."],
      cases: [
        { stdin: "3\n5 -1 255\n", expected: "5: bin=101 hex=5 ones=2 sign=non-negative\n-1: bin=11111111111111111111111111111111 hex=ffffffff ones=32 sign=negative\n255: bin=11111111 hex=ff ones=8 sign=non-negative\n" },
        { stdin: "1\n0\n", expected: "0: bin=0 hex=0 ones=0 sign=non-negative\n" },
        { stdin: "2\n-2147483648 2147483647\n", expected: "-2147483648: bin=10000000000000000000000000000000 hex=80000000 ones=1 sign=negative\n2147483647: bin=1111111111111111111111111111111 hex=7fffffff ones=31 sign=non-negative\n", hidden: true },
      ],
    },
  ],
  "variables-and-constants": [
    {
      title: "Unit converter with constants",
      prompt: `Declare \`static final double KM_PER_MILE = 1.609344\` and \`KG_PER_POUND = 0.45359237\`. Read an integer \`n\` and \`n\` lines \`<value> <unit>\` where the unit is \`km\`, \`mi\`, \`kg\` or \`lb\`, and print the value converted to the other unit of its pair with two decimals: \`<value> <unit> = <converted> <other>\`. Use \`Locale.ROOT\` for the formatting.

Example: \`2\` then \`10 km\`, \`150 lb\` →
\`\`\`
10.00 km = 6.21 mi
150.00 lb = 68.04 kg
\`\`\``,
      starter: String.raw`import java.util.*;

public class Main {
    static final double KM_PER_MILE = 1.609344;
    static final double KG_PER_POUND = 0.45359237;

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            double value = in.nextDouble();
            String unit = in.next();
            // TODO
        }
    }
}
`,
      solution: String.raw`import java.util.*;

public class Main {
    static final double KM_PER_MILE = 1.609344;
    static final double KG_PER_POUND = 0.45359237;

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            double value = in.nextDouble();
            String unit = in.next();
            double converted;
            String other;
            switch (unit) {
                case "km" -> { converted = value / KM_PER_MILE; other = "mi"; }
                case "mi" -> { converted = value * KM_PER_MILE; other = "km"; }
                case "kg" -> { converted = value / KG_PER_POUND; other = "lb"; }
                default -> { converted = value * KG_PER_POUND; other = "kg"; }
            }
            System.out.println(String.format(Locale.ROOT, "%.2f %s = %.2f %s", value, unit, converted, other));
        }
    }
}
`,
      hints: ["A named constant reads better than 1.609344 in three places and cannot be changed by accident.", "Dividing by the factor goes one way; multiplying goes the other."],
      cases: [
        { stdin: "2\n10 km\n150 lb\n", expected: "10.00 km = 6.21 mi\n150.00 lb = 68.04 kg\n" },
        { stdin: "2\n26.2 mi\n1 kg\n", expected: "26.20 mi = 42.16 km\n1.00 kg = 2.20 lb\n" },
        { stdin: "1\n0 km\n", expected: "0.00 km = 0.00 mi\n", hidden: true },
      ],
    },
  ],
  "conversions-and-casting": [
    {
      title: "Lossy or not",
      prompt: `Read an integer \`n\` and \`n\` \`long\` values. For each print \`<x>: int=<(int) x> short=<(short) x> byte=<(byte) x> lossy=<true if the int cast changed the value>\`. A narrowing cast keeps the low bits and drops the rest — watch what happens past each type's range.

Example: \`3\` then \`100 300 3000000000\` →
\`\`\`
100: int=100 short=100 byte=100 lossy=false
300: int=300 short=300 byte=44 lossy=false
3000000000: int=-1294967296 short=24064 byte=0 lossy=true
\`\`\``,
      starter: String.raw`import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            long x = in.nextLong();
            // TODO
        }
    }
}
`,
      solution: String.raw`import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            long x = in.nextLong();
            int asInt = (int) x;
            System.out.println(x + ": int=" + asInt + " short=" + (short) x + " byte=" + (byte) x + " lossy=" + (asInt != x));
        }
    }
}
`,
      hints: ["(byte) 300 keeps the low 8 bits: 300 = 0x12C, so 0x2C = 44.", "Compare the cast value with the original to detect loss — Java does not warn you."],
      cases: [
        { stdin: "3\n100 300 3000000000\n", expected: "100: int=100 short=100 byte=100 lossy=false\n300: int=300 short=300 byte=44 lossy=false\n3000000000: int=-1294967296 short=24064 byte=0 lossy=true\n" },
        { stdin: "2\n-129 32768\n", expected: "-129: int=-129 short=-129 byte=127 lossy=false\n32768: int=32768 short=-32768 byte=0 lossy=false\n" },
        { stdin: "1\n4294967297\n", expected: "4294967297: int=1 short=1 byte=1 lossy=true\n", hidden: true },
      ],
    },
  ],
  "integer-arithmetic": [
    {
      title: "Digit tricks",
      prompt: `Read an integer \`n\` and \`n\` non-negative \`long\` values. For each print \`<x>: digits=<count> sum=<digit sum> reversed=<digits reversed as a number> palindrome=<true|false> gcd=<gcd(x, digit sum)>\`. Use \`/ 10\` and \`% 10\` — no strings — and Euclid's algorithm for the gcd (\`gcd(x, 0) = x\`).

Example: \`2\` then \`1221 907\` →
\`\`\`
1221: digits=4 sum=6 reversed=1221 palindrome=true gcd=3
907: digits=3 sum=16 reversed=709 palindrome=false gcd=1
\`\`\``,
      starter: String.raw`import java.util.Scanner;

public class Main {
    static long gcd(long a, long b) { return b == 0 ? a : gcd(b, a % b); }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            long x = in.nextLong();
            // TODO
        }
    }
}
`,
      solution: String.raw`import java.util.Scanner;

public class Main {
    static long gcd(long a, long b) { return b == 0 ? a : gcd(b, a % b); }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            long x = in.nextLong();
            long digits = 0, sum = 0, reversed = 0;
            long t = x;
            do {
                digits++;
                sum += t % 10;
                reversed = reversed * 10 + t % 10;
                t /= 10;
            } while (t > 0);
            System.out.println(x + ": digits=" + digits + " sum=" + sum + " reversed=" + reversed + " palindrome=" + (reversed == x) + " gcd=" + gcd(x, sum));
        }
    }
}
`,
      hints: ["A do-while handles 0 (one digit) without a special case.", "reversed = reversed * 10 + lastDigit builds the reversal from the right."],
      cases: [
        { stdin: "2\n1221 907\n", expected: "1221: digits=4 sum=6 reversed=1221 palindrome=true gcd=3\n907: digits=3 sum=16 reversed=709 palindrome=false gcd=1\n" },
        { stdin: "2\n0 10\n", expected: "0: digits=1 sum=0 reversed=0 palindrome=true gcd=0\n10: digits=2 sum=1 reversed=1 palindrome=false gcd=1\n" },
        { stdin: "1\n9000000000\n", expected: "9000000000: digits=10 sum=9 reversed=9 palindrome=false gcd=9\n", hidden: true },
      ],
    },
  ],
  "floating-point": [
    {
      title: "Equal, close or exact",
      prompt: `Read an integer \`n\` and \`n\` pairs of decimal numbers as **strings**. For each pair print \`<a> <b>: == <r1> close <r2> exact <r3>\` where \`r1\` compares them as \`double\`s with \`==\`, \`r2\` is whether they differ by less than \`1e-9\`, and \`r3\` compares them as \`new BigDecimal(text)\` with \`compareTo\`. The three answers disagree exactly when floating point is being floating point.

Example: \`2\` then \`0.3 0.30000000000000004\`, \`1.0 1.00\` →
\`\`\`
0.3 0.30000000000000004: == false close true exact false
1.0 1.00: == true close true exact true
\`\`\``,
      starter: String.raw`import java.math.BigDecimal;
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            String a = in.next(), b = in.next();
            // TODO
        }
    }
}
`,
      solution: String.raw`import java.math.BigDecimal;
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int n = in.nextInt();
        for (int i = 0; i < n; i++) {
            String a = in.next(), b = in.next();
            double da = Double.parseDouble(a), db = Double.parseDouble(b);
            boolean eq = da == db;
            boolean close = Math.abs(da - db) < 1e-9;
            boolean exact = new BigDecimal(a).compareTo(new BigDecimal(b)) == 0;
            System.out.println(a + " " + b + ": == " + eq + " close " + close + " exact " + exact);
        }
    }
}
`,
      hints: ["Build the BigDecimals from the strings, not from the doubles — new BigDecimal(0.1) carries the binary error in.", "compareTo, not equals: BigDecimal.equals cares about scale (1.0 vs 1.00)."],
      cases: [
        { stdin: "2\n0.3 0.30000000000000004\n1.0 1.00\n", expected: "0.3 0.30000000000000004: == false close true exact false\n1.0 1.00: == true close true exact true\n" },
        { stdin: "1\n0.1 0.10000001\n", expected: "0.1 0.10000001: == false close false exact false\n" },
        { stdin: "2\n2.5 2.500\n100 99.9999999999\n", expected: "2.5 2.500: == true close true exact true\n100 99.9999999999: == false close true exact false\n", hidden: true },
      ],
    },
  ],
  operators: [
    {
      title: "Predict the operators",
      prompt: `Read an integer \`k\` and \`k\` expression ids in \`1..12\`. For each print \`<id>: <value>\`, writing the expression literally in Java (no hard-coded answers). Predict each before running.

| id | expression | | id | expression |
| --- | --- | --- | --- | --- |
| 1 | \`5 / 2 * 2.0\` | | 7 | \`int i = 5; i++ + ++i\` |
| 2 | \`7 % -3\` | | 8 | \`true || false && false\` |
| 3 | \`1 << 3 | 1\` | | 9 | \`(int) 'A' + 1\` |
| 4 | \`6 & 3 ^ 1\` | | 10 | \`10 - 2 - 3\` |
| 5 | \`-7 >> 1\` | | 11 | \`2 + 3 * 4 % 5\` |
| 6 | \`-7 >>> 28\` | | 12 | \`int x = 5; x += x++ * 2; x\` |

Example: \`3\` then \`1 3 7\` →
\`\`\`
1: 4.0
3: 9
7: 12
\`\`\``,
      starter: String.raw`import java.util.Scanner;

public class Main {
    static String eval(int id) {
        switch (id) {
            case 1: return String.valueOf(5 / 2 * 2.0);
            // TODO: 2..12
            default: return "?";
        }
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int k = in.nextInt();
        for (int i = 0; i < k; i++) {
            int id = in.nextInt();
            System.out.println(id + ": " + eval(id));
        }
    }
}
`,
      solution: String.raw`import java.util.Scanner;

public class Main {
    static String eval(int id) {
        switch (id) {
            case 1: return String.valueOf(5 / 2 * 2.0);
            case 2: return String.valueOf(7 % -3);
            case 3: return String.valueOf(1 << 3 | 1);
            case 4: return String.valueOf(6 & 3 ^ 1);
            case 5: return String.valueOf(-7 >> 1);
            case 6: return String.valueOf(-7 >>> 28);
            case 7: { int i = 5; return String.valueOf(i++ + ++i); }
            case 8: return String.valueOf(true || false && false);
            case 9: return String.valueOf((int) 'A' + 1);
            case 10: return String.valueOf(10 - 2 - 3);
            case 11: return String.valueOf(2 + 3 * 4 % 5);
            case 12: { int x = 5; x += x++ * 2; return String.valueOf(x); }
            default: return "?";
        }
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        int k = in.nextInt();
        for (int i = 0; i < k; i++) {
            int id = in.nextInt();
            System.out.println(id + ": " + eval(id));
        }
    }
}
`,
      hints: ["Shifts bind tighter than & ^ |; * / % bind tighter than + -; && before ||.", "x += e evaluates the old x first, then e — so x++ inside e cannot change the saved value."],
      cases: [
        { stdin: "3\n1 3 7\n", expected: "1: 4.0\n3: 9\n7: 12\n" },
        { stdin: "5\n2 4 5 6 8\n", expected: "2: 1\n4: 3\n5: -4\n6: 15\n8: true\n" },
        { stdin: "4\n9 10 11 12\n", expected: "9: 66\n10: 5\n11: 4\n12: 15\n", hidden: true },
      ],
    },
  ],
  "wrappers-and-autoboxing": [
    {
      title: "Parse the votes",
      prompt: `Read tokens until end of input. Each token should be an integer vote; parse it with \`Integer.parseInt\`, counting tokens that throw \`NumberFormatException\` as invalid. Collect the valid values in a \`List<Integer>\`, then print \`valid=<n> invalid=<m>\` and — when there is at least one valid vote — \`sum=<sum> min=<min> max=<max>\` computed by unboxing (a plain \`int\` accumulator; compare with \`Integer.compare\` or \`Math.min/max\`, never \`==\`).

Example: \`4 -2 x 10 7.5\` →
\`\`\`
valid=3 invalid=2
sum=12 min=-2 max=10
\`\`\``,
      starter: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        List<Integer> votes = new ArrayList<>();
        int invalid = 0;
        while (in.hasNext()) {
            String token = in.next();
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
        List<Integer> votes = new ArrayList<>();
        int invalid = 0;
        while (in.hasNext()) {
            String token = in.next();
            try {
                votes.add(Integer.parseInt(token));
            } catch (NumberFormatException e) {
                invalid++;
            }
        }
        System.out.println("valid=" + votes.size() + " invalid=" + invalid);
        if (!votes.isEmpty()) {
            int sum = 0, min = Integer.MAX_VALUE, max = Integer.MIN_VALUE;
            for (int v : votes) {        // unboxed once, here
                sum += v;
                min = Math.min(min, v);
                max = Math.max(max, v);
            }
            System.out.println("sum=" + sum + " min=" + min + " max=" + max);
        }
    }
}
`,
      hints: ["parseInt throws for anything that is not an int literal — 7.5 included.", "for (int v : votes) unboxes each Integer to a primitive; arithmetic on primitives is safe."],
      cases: [
        { stdin: "4 -2 x 10 7.5\n", expected: "valid=3 invalid=2\nsum=12 min=-2 max=10\n" },
        { stdin: "a b c\n", expected: "valid=0 invalid=3\n" },
        { stdin: "1000 1000 2147483647 -2147483648\n", expected: "valid=4 invalid=0\nsum=1999 min=-2147483648 max=2147483647\n", hidden: true },
      ],
    },
  ],
  "types-checkpoint": [
    {
      title: "Binary clock",
      prompt: `Read a number of seconds since midnight (\`0 ≤ s < 86400\`). Print the time as \`HH:MM:SS\` with \`%02d\`, then each component as a six-bit binary string (pad with zeros: \`String.format("%6s", Integer.toBinaryString(v)).replace(' ', '0')\`), then \`bits set: <total ones across the three>\`.

Example: \`3661\` →
\`\`\`
01:01:01
000001 000001 000001
bits set: 3
\`\`\``,
      starter: String.raw`import java.util.Scanner;

public class Main {
    static String six(int v) {
        return String.format("%6s", Integer.toBinaryString(v)).replace(' ', '0');
    }

    public static void main(String[] args) {
        int s = new Scanner(System.in).nextInt();
        // TODO
    }
}
`,
      solution: String.raw`import java.util.Scanner;

public class Main {
    static String six(int v) {
        return String.format("%6s", Integer.toBinaryString(v)).replace(' ', '0');
    }

    public static void main(String[] args) {
        int s = new Scanner(System.in).nextInt();
        int h = s / 3600, m = s / 60 % 60, sec = s % 60;
        System.out.printf("%02d:%02d:%02d%n", h, m, sec);
        System.out.println(six(h) + " " + six(m) + " " + six(sec));
        System.out.println("bits set: " + (Integer.bitCount(h) + Integer.bitCount(m) + Integer.bitCount(sec)));
    }
}
`,
      hints: ["Integer division and remainder split seconds into hours, minutes, seconds.", "%02d pads to two digits with zeros."],
      cases: [
        { stdin: "3661\n", expected: "01:01:01\n000001 000001 000001\nbits set: 3\n" },
        { stdin: "0\n", expected: "00:00:00\n000000 000000 000000\nbits set: 0\n" },
        { stdin: "86399\n", expected: "23:59:59\n010111 111011 111011\nbits set: 14\n", hidden: true },
      ],
    },
  ],
};

export default more;
