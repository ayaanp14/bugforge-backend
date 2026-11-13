import { defineModule } from "../../dsl.js";
import more from "./more-exercises.js";

/**
 * Expense sharing, Splitwise (content/notes/low-level-design/
 * design-an-expense-sharing-app): split rules as strategies over money in
 * paise, then the greedy settle-up, then — in the checkpoint — a fourth
 * split added without touching the others. Balances live in a TreeMap so
 * every listing is in name order and every tie breaks by name.
 */

const MONEY = String.raw`    /** "12", "12.5" or "12.50" rupees as paise; never through a double. */
    static long toPaise(String s) {
        int dot = s.indexOf('.');
        if (dot < 0) return Long.parseLong(s) * 100;
        String frac = (s.substring(dot + 1) + "00").substring(0, 2);
        return Long.parseLong(s.substring(0, dot)) * 100 + Long.parseLong(frac);
    }

    /** Paise as rupees with two decimals: 1250 -> "12.50", -5 -> "-0.05". */
    static String money(long p) {
        String sign = p < 0 ? "-" : "";
        p = Math.abs(p);
        return sign + (p / 100) + "." + String.format("%02d", p % 100);
    }

    static String signed(long p) { return p > 0 ? "+" + money(p) : money(p); }
`;

const SPLITS_STARTER = String.raw`import java.io.*;
import java.util.*;

public class Main {
${MONEY}
    /** A split rule: the shares in paise, in the participants' order. Throws IllegalArgumentException with the line to print. */
    interface Split {
        /** True when each participant is followed by a number (EXACT, PERCENT). */
        boolean takesValues();
        long[] shares(long amount, List<String> values);
    }

    // TODO: EqualSplit (leftover paise one each to the first members)
    // TODO: ExactSplit (amounts must add up to the total)
    // TODO: PercentSplit (must add up to 100; floor each share, the leftover to the first member)

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        TreeMap<String, Long> balance = new TreeMap<>(); // name order
        for (String name : br.readLine().trim().split("\\s+")) balance.put(name, 0L);
        StringBuilder out = new StringBuilder();
        String line;
        while ((line = br.readLine()) != null) {
            line = line.trim();
            if (line.isEmpty()) continue;
            String[] p = line.split("\\s+");
            // TODO: EXPENSE payer amount TYPE ..., and BALANCES
        }
        System.out.print(out);
    }
}
`;

const SPLITS_SOLUTION = String.raw`import java.io.*;
import java.util.*;

public class Main {
${MONEY}
    /** A split rule: the shares in paise, in the participants' order. Throws IllegalArgumentException with the line to print. */
    interface Split {
        /** True when each participant is followed by a number (EXACT, PERCENT). */
        boolean takesValues();
        long[] shares(long amount, List<String> values);
    }

    static class EqualSplit implements Split {
        public boolean takesValues() { return false; }
        public long[] shares(long amount, List<String> values) {
            int n = values.size();
            long[] s = new long[n];
            for (int i = 0; i < n; i++) s[i] = amount / n + (i < amount % n ? 1 : 0); // leftover paise to the first members
            return s;
        }
    }

    static class ExactSplit implements Split {
        public boolean takesValues() { return true; }
        public long[] shares(long amount, List<String> values) {
            long[] s = new long[values.size()];
            long sum = 0;
            for (int i = 0; i < s.length; i++) { s[i] = toPaise(values.get(i)); sum += s[i]; }
            if (sum != amount) throw new IllegalArgumentException("exact shares add up to " + money(sum) + ", not " + money(amount));
            return s;
        }
    }

    static class PercentSplit implements Split {
        public boolean takesValues() { return true; }
        public long[] shares(long amount, List<String> values) {
            long[] s = new long[values.size()];
            int total = 0;
            for (String v : values) total += Integer.parseInt(v);
            if (total != 100) throw new IllegalArgumentException("percents add up to " + total + ", not 100");
            long sum = 0;
            for (int i = 0; i < s.length; i++) { s[i] = amount * Integer.parseInt(values.get(i)) / 100; sum += s[i]; }
            s[0] += amount - sum; // rounding leftovers
            return s;
        }
    }

    static final Map<String, Split> SPLITS = Map.of("EQUAL", new EqualSplit(), "EXACT", new ExactSplit(), "PERCENT", new PercentSplit());

    static class BalanceSheet {
        final TreeMap<String, Long> balance = new TreeMap<>(); // name order

        String expense(String[] p) {
            String payer = p[1];
            long amount = toPaise(p[2]);
            if (!balance.containsKey(payer)) return "unknown user " + payer;
            Split split = SPLITS.get(p[3]);
            if (split == null) return "unknown split " + p[3];
            List<String> names = new ArrayList<>(), values = new ArrayList<>();
            int step = split.takesValues() ? 2 : 1;
            for (int i = 4; i < p.length; i += step) {
                names.add(p[i]);
                values.add(step == 2 ? p[i + 1] : null);
            }
            for (String n : names) if (!balance.containsKey(n)) return "unknown user " + n;
            long[] s;
            try {
                s = split.shares(amount, values); // validated before any balance moves
            } catch (IllegalArgumentException e) {
                return e.getMessage();
            }
            balance.merge(payer, amount, Long::sum);
            StringJoiner line = new StringJoiner(", ", payer + " paid " + money(amount) + ": ", "");
            for (int i = 0; i < s.length; i++) {
                balance.merge(names.get(i), -s[i], Long::sum);
                line.add(names.get(i) + " " + money(s[i]));
            }
            return line.toString();
        }

        String balances() {
            StringJoiner j = new StringJoiner("\n");
            balance.forEach((name, b) -> j.add(name + " " + signed(b)));
            return j.toString();
        }
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        BalanceSheet sheet = new BalanceSheet();
        for (String name : br.readLine().trim().split("\\s+")) sheet.balance.put(name, 0L);
        StringBuilder out = new StringBuilder();
        String line;
        while ((line = br.readLine()) != null) {
            line = line.trim();
            if (line.isEmpty()) continue;
            String[] p = line.split("\\s+");
            if (p[0].equals("EXPENSE")) out.append(sheet.expense(p)).append('\n');
            else if (p[0].equals("BALANCES")) out.append(sheet.balances()).append('\n');
        }
        System.out.print(out);
    }
}
`;

const SHARES_STARTER = String.raw`import java.io.*;
import java.util.*;

public class Main {
${MONEY}
    interface Split {
        boolean takesValues();
        long[] shares(long amount, List<String> values);
    }

    // TODO: EqualSplit, ExactSplit, PercentSplit (as in the lesson)
    // TODO: SharesSplit: weights such as 2 1 1, each at least 1

    static class BalanceSheet {
        final TreeMap<String, Long> balance = new TreeMap<>();
        // TODO: expense, balances, settle
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        BalanceSheet sheet = new BalanceSheet();
        for (String name : br.readLine().trim().split("\\s+")) sheet.balance.put(name, 0L);
        StringBuilder out = new StringBuilder();
        String line;
        while ((line = br.readLine()) != null) {
            line = line.trim();
            if (line.isEmpty()) continue;
            String[] p = line.split("\\s+");
            // TODO: EXPENSE, BALANCES, SETTLE
        }
        System.out.print(out);
    }
}
`;

const SHARES_SOLUTION = String.raw`import java.io.*;
import java.util.*;

public class Main {
${MONEY}
    interface Split {
        boolean takesValues();
        long[] shares(long amount, List<String> values);
    }

    static class EqualSplit implements Split {
        public boolean takesValues() { return false; }
        public long[] shares(long amount, List<String> values) {
            int n = values.size();
            long[] s = new long[n];
            for (int i = 0; i < n; i++) s[i] = amount / n + (i < amount % n ? 1 : 0);
            return s;
        }
    }

    static class ExactSplit implements Split {
        public boolean takesValues() { return true; }
        public long[] shares(long amount, List<String> values) {
            long[] s = new long[values.size()];
            long sum = 0;
            for (int i = 0; i < s.length; i++) { s[i] = toPaise(values.get(i)); sum += s[i]; }
            if (sum != amount) throw new IllegalArgumentException("exact shares add up to " + money(sum) + ", not " + money(amount));
            return s;
        }
    }

    /** Shares by integer weights. PercentSplit is the special case where the weights must total 100. */
    static class WeightedSplit implements Split {
        public boolean takesValues() { return true; }
        void check(int[] w) {
            for (int x : w) if (x < 1) throw new IllegalArgumentException("shares must be positive");
        }
        public long[] shares(long amount, List<String> values) {
            int[] w = new int[values.size()];
            int total = 0;
            for (int i = 0; i < w.length; i++) { w[i] = Integer.parseInt(values.get(i)); total += w[i]; }
            check(w);
            long[] s = new long[w.length];
            long sum = 0;
            for (int i = 0; i < w.length; i++) { s[i] = amount * w[i] / total; sum += s[i]; }
            s[0] += amount - sum; // rounding leftovers
            return s;
        }
    }

    static class SharesSplit extends WeightedSplit { }

    static class PercentSplit extends WeightedSplit {
        @Override void check(int[] w) {
            int total = 0;
            for (int x : w) total += x;
            if (total != 100) throw new IllegalArgumentException("percents add up to " + total + ", not 100");
        }
    }

    static final Map<String, Split> SPLITS = Map.of(
        "EQUAL", new EqualSplit(), "EXACT", new ExactSplit(), "PERCENT", new PercentSplit(), "SHARES", new SharesSplit());

    static class BalanceSheet {
        final TreeMap<String, Long> balance = new TreeMap<>(); // name order

        String expense(String[] p) {
            String payer = p[1];
            long amount = toPaise(p[2]);
            if (!balance.containsKey(payer)) return "unknown user " + payer;
            Split split = SPLITS.get(p[3]);
            if (split == null) return "unknown split " + p[3];
            List<String> names = new ArrayList<>(), values = new ArrayList<>();
            int step = split.takesValues() ? 2 : 1;
            for (int i = 4; i < p.length; i += step) {
                names.add(p[i]);
                values.add(step == 2 ? p[i + 1] : null);
            }
            for (String n : names) if (!balance.containsKey(n)) return "unknown user " + n;
            long[] s;
            try {
                s = split.shares(amount, values);
            } catch (IllegalArgumentException e) {
                return e.getMessage();
            }
            balance.merge(payer, amount, Long::sum);
            StringJoiner line = new StringJoiner(", ", payer + " paid " + money(amount) + ": ", "");
            for (int i = 0; i < s.length; i++) {
                balance.merge(names.get(i), -s[i], Long::sum);
                line.add(names.get(i) + " " + money(s[i]));
            }
            return line.toString();
        }

        String balances() {
            StringJoiner j = new StringJoiner("\n");
            balance.forEach((name, b) -> j.add(name + " " + signed(b)));
            return j.toString();
        }

        // Greedy: the largest debtor pays the largest creditor; strict comparisons in name order break ties by name.
        String settle() {
            StringJoiner j = new StringJoiner("\n");
            int transfers = 0;
            while (true) {
                String cred = null, debt = null;
                for (Map.Entry<String, Long> e : balance.entrySet()) {
                    long b = e.getValue();
                    if (b > 0 && (cred == null || b > balance.get(cred))) cred = e.getKey();
                    if (b < 0 && (debt == null || b < balance.get(debt))) debt = e.getKey();
                }
                if (cred == null) break;
                long pay = Math.min(balance.get(cred), -balance.get(debt));
                balance.merge(cred, -pay, Long::sum);
                balance.merge(debt, pay, Long::sum);
                j.add(debt + " pays " + cred + " " + money(pay));
                transfers++;
            }
            j.add("transfers: " + transfers);
            return j.toString();
        }
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        BalanceSheet sheet = new BalanceSheet();
        for (String name : br.readLine().trim().split("\\s+")) sheet.balance.put(name, 0L);
        StringBuilder out = new StringBuilder();
        String line;
        while ((line = br.readLine()) != null) {
            line = line.trim();
            if (line.isEmpty()) continue;
            String[] p = line.split("\\s+");
            String said = switch (p[0]) {
                case "EXPENSE" -> sheet.expense(p);
                case "BALANCES" -> sheet.balances();
                case "SETTLE" -> sheet.settle();
                default -> "unknown command " + p[0];
            };
            out.append(said).append('\n');
        }
        System.out.print(out);
    }
}
`;

export default defineModule(
  import.meta.url,
  {
    slug: "expense-sharing",
    title: "Expense sharing",
    blurb: "Splitwise in Java: money in paise, equal, exact and percent splits as strategies, net balances that add up to zero, and the greedy settle-up.",
    icon: "list",
    overview: `An expense sharing app (Splitwise, in most rounds) is a ledger with one invariant: money is moved, never created, so a group's balances always add up to zero. The machine-coding problem tests whether the code keeps that invariant through every split rule, every rounding and every settle-up.

You will write it in three steps. First the split rules, equal, exact and percent, each a strategy that validates its own input and turns an amount into shares, over money kept in integer paise so nothing drifts. Then the settle-up: the greedy rule that has the largest debtor pay the largest creditor until everyone is square, in at most n - 1 payments. The checkpoint adds a fourth rule, shares by weight, to show what the Strategy buys you.

Balances are kept in name order, so every listing and every tie is deterministic. The full design is in the [expense sharing note](/notes/low-level-design/design-an-expense-sharing-app).`,
    lessons: [
      {
        slug: "expense-sharing-design",
        file: "01-expense-sharing-design.md",
        exercises: [
          {
            title: "Split strategies over paise",
            prompt: `Record a group's expenses with three split rules and report the net balances.

**Input.** The first line lists the members' names. Amounts are rupees with at most two decimals (\`900\`, \`10.5\`, \`40.25\`); keep them as paise in a \`long\`. Then one command per line:

- \`EXPENSE payer amount EQUAL u1 u2 …\`: equal shares; leftover paise go one each to the first members listed.
- \`EXPENSE payer amount EXACT u1 a1 u2 a2 …\`: the given amounts, which must add up to the expense, else \`exact shares add up to X, not Y\`.
- \`EXPENSE payer amount PERCENT u1 p1 u2 p2 …\`: whole percentages that must total 100, else \`percents add up to N, not 100\`. Each share is floored to the paisa; the leftover goes to the first member listed.

  Check in this order: the payer is a member, else \`unknown user NAME\`; the split type is known, else \`unknown split TYPE\`; each participant is a member, else \`unknown user NAME\`; then the split's own rule. A refused expense changes nothing. Otherwise the payer gets \`+amount\` and each participant \`-share\` (the payer may or may not be one of them), and the program prints \`payer paid 900.00: asha 300.00, ben 300.00, chen 300.00\` with the participants in the order given.
- \`BALANCES\`: every member in name order with their net balance, such as \`asha -150.00\`, \`ben +250.00\`, \`chen 0.00\`.

**Example**

\`\`\`
kim lee max
EXPENSE kim 100 EQUAL kim lee max
BALANCES
\`\`\`
prints
\`\`\`
kim paid 100.00: kim 33.34, lee 33.33, max 33.33
kim +66.66
lee -33.33
max -33.33
\`\`\``,
            starter: SPLITS_STARTER,
            solution: SPLITS_SOLUTION,
            hints: [
              "One Split interface and one class per rule; keep them in a Map from the type's name, so an unknown type is a null.",
              "Let each split throw IllegalArgumentException with the exact line to print, and catch it before any balance is touched.",
              "Equal: amount / n each, plus one paisa to the first amount % n members. Percent: amount * p / 100 each, then the leftover to the first.",
              "A TreeMap<String, Long> lists the balances in name order for free.",
            ],
            cases: [
              {
                stdin: "asha ben chen\nEXPENSE asha 900 EQUAL asha ben chen\nEXPENSE ben 1000 PERCENT asha 50 ben 20 chen 30\nEXPENSE chen 600 EXACT asha 250 ben 250 chen 100\nBALANCES\n",
                expected:
                  "asha paid 900.00: asha 300.00, ben 300.00, chen 300.00\nben paid 1000.00: asha 500.00, ben 200.00, chen 300.00\nchen paid 600.00: asha 250.00, ben 250.00, chen 100.00\nasha -150.00\nben +250.00\nchen -100.00\n",
              },
              {
                stdin: "kim lee max\nEXPENSE kim 100 EQUAL kim lee max\nEXPENSE lee 10.5 PERCENT kim 33 lee 33 max 34\nBALANCES\n",
                expected: "kim paid 100.00: kim 33.34, lee 33.33, max 33.33\nlee paid 10.50: kim 3.47, lee 3.46, max 3.57\nkim +63.19\nlee -26.29\nmax -36.90\n",
                hidden: true,
              },
              {
                stdin:
                  "zoe amir bea\nEXPENSE amir 300 EQUAL zoe bea\nEXPENSE amir 50 EXACT zoe 20 bea 20\nEXPENSE amir 50 PERCENT zoe 50 bea 40\nEXPENSE amir 50 SHARES zoe 1 bea 1\nEXPENSE ravi 50 EQUAL zoe\nEXPENSE bea 50 EQUAL zoe ravi\nEXPENSE zoe 40.25 EXACT amir 20.25 bea 20\nBALANCES\n",
                expected:
                  "amir paid 300.00: zoe 150.00, bea 150.00\nexact shares add up to 40.00, not 50.00\npercents add up to 90, not 100\nunknown split SHARES\nunknown user ravi\nunknown user ravi\nzoe paid 40.25: amir 20.25, bea 20.00\namir +279.75\nbea -170.00\nzoe -109.75\n",
                hidden: true,
              },
              {
                stdin: "a b\nBALANCES\nEXPENSE a 10 EQUAL a b\nEXPENSE b 10 EQUAL a b\nBALANCES\n",
                expected: "a 0.00\nb 0.00\na paid 10.00: a 5.00, b 5.00\nb paid 10.00: a 5.00, b 5.00\na 0.00\nb 0.00\n",
                hidden: true,
              },
            ],
          },
        ],
        quiz: [
          {
            prompt: "Why should an expense app store money as a `long` of paise rather than a `double` of rupees?",
            options: [
              "A long uses less memory",
              "A double cannot represent amounts like 0.10 exactly, so sums drift and balances stop netting to zero",
              "Java has no double arithmetic for money",
              "Paise are what banks print on statements",
            ],
            answer: 1,
            explanation:
              "Binary floating point has no exact form for most decimal fractions, so 0.1 + 0.2 is not 0.3 and long ledgers accumulate error. Whole paise are exact; you format to rupees only when printing. (`BigDecimal` is the other correct answer in Java, at more cost.)",
          },
          {
            prompt: "An EQUAL split of 100.00 among three members gives which shares?",
            options: ["33.33, 33.33, 33.33", "33.34, 33.33, 33.33", "33.33, 33.33, 33.34", "33.00, 33.00, 34.00"],
            answer: 1,
            explanation:
              "10000 paise / 3 is 3333 with 1 left over, and the rule hands leftover paise out one each from the first member. 33.33 three times loses a paisa, so the balances would not add up to zero.",
          },
          {
            prompt: "Where should \"an exact split must add up to the amount\" be checked?",
            options: [
              "In the ExactSplit strategy, before any balance changes",
              "In BalanceSheet, after the balances are updated",
              "In the main loop, by string matching",
              "Nowhere; the user is trusted",
            ],
            answer: 0,
            explanation:
              "Each rule knows its own input, so ExactSplit validates its amounts, PercentSplit its percentages. Checking after the update leaves the ledger half-applied when the check fails; checking in the input loop scatters split rules outside the classes that own them.",
          },
          {
            prompt: "Net balances are asha +500, ben -200, chen -300. What does the greedy settle-up print?",
            options: [
              "ben pays asha 200, then chen pays asha 300",
              "chen pays asha 300, then ben pays asha 200",
              "chen pays asha 500",
              "asha pays chen 300, then asha pays ben 200",
            ],
            answer: 1,
            explanation:
              "Each step takes the largest creditor (asha, 500) and the largest debtor (chen, -300); the smaller amount moves, so chen pays 300. Then ben, -200, pays the remaining 200. Two transfers for three people, within the n - 1 bound.",
          },
        ],
      },
      {
        slug: "expense-sharing-checkpoint",
        file: "02-checkpoint.md",
        kind: "test",
        passMark: 70,
        exercises: [
          {
            title: "A fourth split, and settle up",
            prompt: `Extend the ledger with a fourth split rule and the settle-up.

**Input.** As in the lesson's first program: the members on the first line, then commands, money as paise.

- \`EXPENSE payer amount TYPE …\` with \`TYPE\` one of \`EQUAL\`, \`EXACT\`, \`PERCENT\` (exactly as before) or the new **\`SHARES u1 w1 u2 w2 …\`**: whole-number weights, each at least 1, else \`shares must be positive\`. Each share is \`amount × w / total weight\`, floored to the paisa, with the leftover to the first member listed. The checks and the printed line are as before.
- \`BALANCES\`: as before.
- \`SETTLE\`: while anyone is owed money, the member who owes the most pays the member owed the most the smaller of the two amounts. Ties go to the earlier name. Print \`debtor pays creditor 400.00\` for each payment and then \`transfers: N\`. The payments are applied, so every balance is zero afterwards.

**Example**

\`\`\`
ira jo ken
EXPENSE ira 1200 SHARES ira 2 jo 1 ken 1
SETTLE
\`\`\`
prints
\`\`\`
ira paid 1200.00: ira 600.00, jo 300.00, ken 300.00
jo pays ira 300.00
ken pays ira 300.00
transfers: 2
\`\`\``,
            starter: SHARES_STARTER,
            solution: SHARES_SOLUTION,
            hints: [
              "SHARES and PERCENT are the same arithmetic with different validation: a shared parent class with an overridable check is one clean way.",
              "The new rule is one class and one map entry; BalanceSheet should not change for it.",
              "In settle, walk the TreeMap in name order and keep a member only when strictly larger (or smaller), so ties stay with the earlier name.",
            ],
            cases: [
              {
                stdin: "ira jo ken\nEXPENSE ira 1200 SHARES ira 2 jo 1 ken 1\nEXPENSE jo 300 EXACT ira 100 jo 50 ken 150\nEXPENSE ken 100 PERCENT ira 25 jo 25 ken 50\nBALANCES\nSETTLE\n",
                expected:
                  "ira paid 1200.00: ira 600.00, jo 300.00, ken 300.00\njo paid 300.00: ira 100.00, jo 50.00, ken 150.00\nken paid 100.00: ira 25.00, jo 25.00, ken 50.00\nira +475.00\njo -75.00\nken -400.00\nken pays ira 400.00\njo pays ira 75.00\ntransfers: 2\n",
              },
              {
                stdin: "ann bob\nEXPENSE ann 10 SHARES ann 1 bob 2\nEXPENSE bob 5 SHARES ann 0 bob 1\nEXPENSE bob 5 PERCENT ann 60 bob 50\nBALANCES\nSETTLE\nBALANCES\n",
                expected: "ann paid 10.00: ann 3.34, bob 6.66\nshares must be positive\npercents add up to 110, not 100\nann +6.66\nbob -6.66\nbob pays ann 6.66\ntransfers: 1\nann 0.00\nbob 0.00\n",
                hidden: true,
              },
              {
                stdin: "mo li\nEXPENSE mo 12.34 EXACT mo 6.17 li 6.16\nEXPENSE li 12.34 EXACT mo 6.17 li 6.17\nEXPENSE li 3 HALF mo li\nEXPENSE xx 3 EQUAL mo\nEXPENSE li 3 EQUAL mo\nSETTLE\n",
                expected: "exact shares add up to 12.33, not 12.34\nli paid 12.34: mo 6.17, li 6.17\nunknown split HALF\nunknown user xx\nli paid 3.00: mo 3.00\nmo pays li 9.17\ntransfers: 1\n",
                hidden: true,
              },
            ],
          },
        ],
        quiz: [
          {
            prompt: "The product wants a split \"by shares\", such as 2 : 1 : 1. With a Split interface, what changes?",
            options: [
              "One new class implementing Split; Expense and BalanceSheet stay as they are",
              "A new if-branch in BalanceSheet for every split type",
              "A new field on Expense for the weights",
              "Every existing split gets a weights parameter",
            ],
            answer: 0,
            explanation:
              "That is the Strategy and the open/closed principle: the code that applies an expense depends only on the interface, so a new rule is a new class registered by name. Branching in BalanceSheet means every new rule edits tested code.",
          },
          {
            prompt: "After any sequence of valid expenses, what is always true of a group's net balances?",
            options: ["Every balance is positive", "They add up to zero", "The payer's balance is the largest", "They are all multiples of 100 paise"],
            answer: 1,
            explanation:
              "An expense adds its amount to the payer and subtracts the same amount, as shares, from the participants: money is moved, never created. A total other than zero means a rounding or split bug, which makes it a cheap assertion.",
          },
          {
            prompt: "A PERCENT split of 10.50 with 33%, 33% and 34%. What are the shares?",
            options: ["3.47, 3.46, 3.57", "3.46, 3.46, 3.57", "3.47, 3.47, 3.56", "3.50, 3.50, 3.50"],
            answer: 0,
            explanation:
              "1050 paise × 33 / 100 floors to 346, twice, and × 34 / 100 to 357: 1049 in all. The leftover paisa goes to the first member, giving 347, 346, 357. Without the leftover rule the shares would miss a paisa.",
          },
          {
            prompt: "How many payments does the greedy settle-up need at most for n members?",
            options: ["n - 1", "n", "n × (n - 1) / 2", "log n"],
            answer: 0,
            explanation:
              "Every payment brings at least one member to zero, and the last two members reach zero together, so at most n - 1 payments are made. Settling every pairwise debt separately can take up to n × (n - 1) / 2.",
          },
          {
            prompt: "Is the greedy settle-up guaranteed to use the fewest possible transfers?",
            options: [
              "Yes, always",
              "No; the true minimum can be lower, and finding it is NP-hard, so greedy is the practical choice",
              "No; it often uses more than n - 1",
              "Only when amounts are whole rupees",
            ],
            answer: 1,
            explanation:
              "When debts inside a subset of members cancel exactly, that subset can settle on its own with fewer transfers than greedy finds. Finding the minimum means searching subsets, which is NP-hard; greedy is short, fast and stays within n - 1.",
          },
          {
            prompt: "Why does the program break ties between equal creditors by name?",
            options: [
              "Splitwise does it that way",
              "So the same input always prints the same payments, which a test or judge can compare",
              "Names are cheaper to compare than amounts",
              "To favour members who joined first",
            ],
            answer: 1,
            explanation:
              "Without a fixed rule the choice falls to map iteration order, which for a HashMap is unspecified. A TreeMap walked with strict comparisons picks the earlier name every time, so the output is reproducible.",
          },
          {
            prompt: "Which balance update is right for \"asha pays 900 for herself, ben and chen, split equally\"?",
            options: [
              "asha +900; asha, ben and chen -300 each",
              "asha +600; ben and chen -300 each",
              "Both of the above give the same net balances",
              "asha -900; ben and chen +300 each",
            ],
            answer: 2,
            explanation:
              "Crediting 900 and debiting asha's own 300 nets to +600, the same as crediting only what the others owe. The exercise does the first because it is one rule for every case: payer +amount, every share -share, whether or not the payer took part.",
          },
          {
            prompt: "The app shows \"ben owes asha\" lines for every pair. Does the settle-up need those pairwise debts?",
            options: [
              "Yes; it settles each pair separately",
              "No; it needs only each member's net balance",
              "Yes; otherwise the totals are wrong",
              "Only for groups larger than three",
            ],
            answer: 1,
            explanation:
              "Who owes whom pairwise is useful to display, but settling only has to bring every net balance to zero, and nets are enough for that. That is also why it can use fewer transfers than paying each pairwise debt.",
          },
          {
            prompt: "Two people add expenses to the same group at the same moment. What keeps the balances correct?",
            options: [
              "Nothing is needed; each expense is separate",
              "Write the expense and its balance updates in one transaction, or recompute balances from the expenses",
              "Round the amounts first",
              "Let the second request overwrite the first",
            ],
            answer: 1,
            explanation:
              "Two read-modify-write updates of one balance can lose one of them. One transaction per expense, covering the expense row and the balances it moves, keeps them in step; recomputing from the expense rows avoids stored balances drifting at all.",
          },
          {
            prompt: "An expense names a participant who is not in the group. What should happen?",
            options: [
              "Refuse the whole expense before any balance changes",
              "Apply it to the members who exist",
              "Add the unknown name to the group",
              "Charge the unknown share to the payer",
            ],
            answer: 0,
            explanation:
              "A half-applied expense breaks the zero-sum invariant and is hard to undo. Validate every name and the split's own rule first, then change all the balances, the same all-or-none rule as a multi-seat booking.",
          },
        ],
      },
    ],
  },
  more,
);
