import type { ExerciseSource } from "../../dsl.js";

/** The lesson's second program: payments between members and the greedy settle-up. */

const MONEY = String.raw`    static long toPaise(String s) {
        int dot = s.indexOf('.');
        if (dot < 0) return Long.parseLong(s) * 100;
        String frac = (s.substring(dot + 1) + "00").substring(0, 2);
        return Long.parseLong(s.substring(0, dot)) * 100 + Long.parseLong(frac);
    }

    static String money(long p) {
        String sign = p < 0 ? "-" : "";
        p = Math.abs(p);
        return sign + (p / 100) + "." + String.format("%02d", p % 100);
    }

    static String signed(long p) { return p > 0 ? "+" + money(p) : money(p); }
`;

const SETTLE_STARTER = String.raw`import java.io.*;
import java.util.*;

public class Main {
${MONEY}
    static class BalanceSheet {
        final TreeMap<String, Long> balance = new TreeMap<>(); // name order

        String expense(String payer, long amount, List<String> members) {
            // TODO: equal split, leftover paise to the first members
            return "";
        }

        String pay(String from, String to, long amount) {
            // TODO: from gave money to to
            return "";
        }

        String settle() {
            // TODO: largest debtor pays largest creditor, ties by name, then "transfers: N"
            return "";
        }

        String balances() {
            // TODO
            return "";
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
                case "EXPENSE" -> sheet.expense(p[1], toPaise(p[2]), Arrays.asList(p).subList(4, p.length)); // p[3] is EQUAL
                case "PAY" -> sheet.pay(p[1], p[2], toPaise(p[3]));
                case "SETTLE" -> sheet.settle();
                case "BALANCES" -> sheet.balances();
                default -> "unknown command " + p[0];
            };
            out.append(said).append('\n');
        }
        System.out.print(out);
    }
}
`;

const SETTLE_SOLUTION = String.raw`import java.io.*;
import java.util.*;

public class Main {
${MONEY}
    static class BalanceSheet {
        final TreeMap<String, Long> balance = new TreeMap<>(); // name order

        String expense(String payer, long amount, List<String> members) {
            if (!balance.containsKey(payer)) return "unknown user " + payer;
            for (String m : members) if (!balance.containsKey(m)) return "unknown user " + m;
            int n = members.size();
            balance.merge(payer, amount, Long::sum);
            StringJoiner line = new StringJoiner(", ", payer + " paid " + money(amount) + ": ", "");
            for (int i = 0; i < n; i++) {
                long share = amount / n + (i < amount % n ? 1 : 0);
                balance.merge(members.get(i), -share, Long::sum);
                line.add(members.get(i) + " " + money(share));
            }
            return line.toString();
        }

        String pay(String from, String to, long amount) {
            if (!balance.containsKey(from)) return "unknown user " + from;
            if (!balance.containsKey(to)) return "unknown user " + to;
            balance.merge(from, amount, Long::sum); // from has paid, so is owed more (or owes less)
            balance.merge(to, -amount, Long::sum);
            return from + " paid " + to + " " + money(amount);
        }

        // Greedy: the largest debtor pays the largest creditor the smaller of the two; one of them reaches zero each time.
        String settle() {
            StringJoiner j = new StringJoiner("\n");
            int transfers = 0;
            while (true) {
                String cred = null, debt = null;
                for (Map.Entry<String, Long> e : balance.entrySet()) { // name order + strict comparisons = ties by name
                    long b = e.getValue();
                    if (b > 0 && (cred == null || b > balance.get(cred))) cred = e.getKey();
                    if (b < 0 && (debt == null || b < balance.get(debt))) debt = e.getKey();
                }
                if (cred == null) break; // balances sum to zero, so no creditor means no debtor either
                long pay = Math.min(balance.get(cred), -balance.get(debt));
                balance.merge(cred, -pay, Long::sum);
                balance.merge(debt, pay, Long::sum);
                j.add(debt + " pays " + cred + " " + money(pay));
                transfers++;
            }
            j.add("transfers: " + transfers);
            return j.toString();
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
            String said = switch (p[0]) {
                case "EXPENSE" -> sheet.expense(p[1], toPaise(p[2]), Arrays.asList(p).subList(4, p.length)); // p[3] is EQUAL
                case "PAY" -> sheet.pay(p[1], p[2], toPaise(p[3]));
                case "SETTLE" -> sheet.settle();
                case "BALANCES" -> sheet.balances();
                default -> "unknown command " + p[0];
            };
            out.append(said).append('\n');
        }
        System.out.print(out);
    }
}
`;

const more: Record<string, ExerciseSource[]> = {
  "expense-sharing-design": [
    {
      title: "Settle up",
      prompt: `Settle a group's balances with the greedy rule.

**Input.** The first line lists the members. Money is paise, as in the first program. Then one command per line:

- \`EXPENSE payer amount EQUAL u1 u2 …\`: an equal split, exactly as before (only \`EQUAL\` appears here), printing \`payer paid 1200.00: asha 300.00, …\`. An unknown payer or member prints \`unknown user NAME\` and changes nothing.
- \`PAY from to amount\`: \`from\` hands \`to\` money directly: \`from\`'s balance goes up by the amount and \`to\`'s goes down. Prints \`from paid to 10.00\`, or \`unknown user NAME\` (checking \`from\` first).
- \`SETTLE\`: while anyone is owed money, the member who owes the most pays the member owed the most the smaller of the two amounts; ties go to the earlier name. Print \`debtor pays creditor 400.00\` for each payment, then \`transfers: N\`. The payments are applied, so every balance is zero afterwards.
- \`BALANCES\`: every member in name order: \`asha +150.00\`, \`ben -250.00\`, \`chen 0.00\`.

**Example**

\`\`\`
asha ben chen dev
EXPENSE asha 1200 EQUAL asha ben chen dev
EXPENSE ben 200 EQUAL chen dev
SETTLE
\`\`\`
prints
\`\`\`
asha paid 1200.00: asha 300.00, ben 300.00, chen 300.00, dev 300.00
ben paid 200.00: chen 100.00, dev 100.00
chen pays asha 400.00
dev pays asha 400.00
ben pays asha 100.00
transfers: 3
\`\`\``,
      starter: SETTLE_STARTER,
      solution: SETTLE_SOLUTION,
      hints: [
        "A positive balance is owed money (a creditor); a negative one owes (a debtor).",
        "Each round of SETTLE scans the TreeMap once for the largest creditor and the largest debtor. Keep a member only when strictly larger, so the earlier name wins a tie.",
        "The payment is min(creditor's balance, -debtor's balance); add it to the debtor and subtract it from the creditor. Stop when no one is owed anything.",
      ],
      cases: [
        {
          stdin: "asha ben chen dev\nEXPENSE asha 1200 EQUAL asha ben chen dev\nEXPENSE ben 200 EQUAL chen dev\nSETTLE\nBALANCES\n",
          expected:
            "asha paid 1200.00: asha 300.00, ben 300.00, chen 300.00, dev 300.00\nben paid 200.00: chen 100.00, dev 100.00\nchen pays asha 400.00\ndev pays asha 400.00\nben pays asha 100.00\ntransfers: 3\nasha 0.00\nben 0.00\nchen 0.00\ndev 0.00\n",
        },
        {
          stdin: "pia omar nia\nEXPENSE pia 90 EQUAL pia omar nia\nEXPENSE omar 90 EQUAL pia omar nia\nBALANCES\nPAY nia pia 10\nBALANCES\nSETTLE\n",
          expected:
            "pia paid 90.00: pia 30.00, omar 30.00, nia 30.00\nomar paid 90.00: pia 30.00, omar 30.00, nia 30.00\nnia -60.00\nomar +30.00\npia +30.00\nnia paid pia 10.00\nnia -50.00\nomar +30.00\npia +20.00\nnia pays omar 30.00\nnia pays pia 20.00\ntransfers: 2\n",
          hidden: true,
        },
        {
          stdin: "dan cal eve\nSETTLE\nEXPENSE cal 10 EQUAL dan cal eve\nPAY dan fay 1\nSETTLE\nBALANCES\n",
          expected: "transfers: 0\ncal paid 10.00: dan 3.34, cal 3.33, eve 3.33\nunknown user fay\ndan pays cal 3.34\neve pays cal 3.33\ntransfers: 2\ncal 0.00\ndan 0.00\neve 0.00\n",
          hidden: true,
        },
        {
          stdin: "bo al cy di\nEXPENSE bo 100 EQUAL cy di\nEXPENSE al 100 EQUAL cy di\nSETTLE\n",
          expected: "bo paid 100.00: cy 50.00, di 50.00\nal paid 100.00: cy 50.00, di 50.00\ncy pays al 100.00\ndi pays bo 100.00\ntransfers: 2\n",
          hidden: true,
        },
      ],
    },
  ],
};

export default more;
