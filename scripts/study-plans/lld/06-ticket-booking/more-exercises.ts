import type { ExerciseSource } from "../../dsl.js";

/** The lesson's second program: seat categories and a pricing rule chosen per show, as a Strategy. */

const PRICING_STARTER = String.raw`import java.io.*;
import java.util.*;

public class Main {
    enum Category {
        REGULAR(200), PREMIUM(360), RECLINER(520);
        final int base;
        Category(int base) { this.base = base; }
    }

    interface PricingStrategy {
        String name();
        int price(Category c);
    }

    // TODO: WeekdayPricing (base), WeekendPricing (base * 5 / 4), MatineePricing (base * 3 / 4)

    static class Show {
        final Map<String, Category> seats = new LinkedHashMap<>();
        final Set<String> booked = new HashSet<>();
        PricingStrategy pricing; // TODO: start on the weekday rule
        int revenue = 0;

        // TODO: quote, book
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String[] size = br.readLine().trim().split("\\s+");
        String[] cats = br.readLine().trim().split("\\s+");
        int rows = Integer.parseInt(size[0]), cols = Integer.parseInt(size[1]);
        Show show = new Show();
        for (int r = 0; r < rows; r++)
            for (int c = 1; c <= cols; c++) show.seats.put((char) ('A' + r) + String.valueOf(c), Category.valueOf(cats[r]));
        StringBuilder out = new StringBuilder();
        String line;
        while ((line = br.readLine()) != null) {
            line = line.trim();
            if (line.isEmpty()) continue;
            String[] p = line.split("\\s+");
            // TODO: PRICING name, QUOTE seats..., BOOK user seats..., REVENUE
        }
        System.out.print(out);
    }
}
`;

const PRICING_SOLUTION = String.raw`import java.io.*;
import java.util.*;

public class Main {
    enum Category {
        REGULAR(200), PREMIUM(360), RECLINER(520);
        final int base;
        Category(int base) { this.base = base; }
    }

    // The Strategy: the booking code asks for a price and never names a day.
    interface PricingStrategy {
        String name();
        int price(Category c);
    }

    static class WeekdayPricing implements PricingStrategy {
        public String name() { return "WEEKDAY"; }
        public int price(Category c) { return c.base; }
    }

    static class WeekendPricing implements PricingStrategy {
        public String name() { return "WEEKEND"; }
        public int price(Category c) { return c.base * 5 / 4; }
    }

    static class MatineePricing implements PricingStrategy {
        public String name() { return "MATINEE"; }
        public int price(Category c) { return c.base * 3 / 4; }
    }

    static final Map<String, PricingStrategy> RULES = new HashMap<>();
    static {
        for (PricingStrategy p : List.of(new WeekdayPricing(), new WeekendPricing(), new MatineePricing())) RULES.put(p.name(), p);
    }

    static class Show {
        final Map<String, Category> seats = new LinkedHashMap<>();
        final Set<String> booked = new HashSet<>();
        PricingStrategy pricing = RULES.get("WEEKDAY");
        int revenue = 0;

        String setPricing(String name) {
            PricingStrategy p = RULES.get(name);
            if (p == null) return "unknown pricing " + name;
            pricing = p;
            return "pricing " + name;
        }

        String quote(List<String> ids) {
            StringJoiner parts = new StringJoiner(" + ");
            int total = 0;
            for (String id : ids) {
                Category c = seats.get(id);
                if (c == null) return "no such seat " + id;
                int price = pricing.price(c);
                parts.add(id + " " + price);
                total += price;
            }
            return parts + " = " + total;
        }

        String book(String user, List<String> ids) {
            int total = 0;
            for (String id : ids) { // all or none
                if (!seats.containsKey(id)) return user + " cannot book " + id + ": no such seat";
                if (booked.contains(id)) return user + " cannot book " + id + ": booked";
                total += pricing.price(seats.get(id));
            }
            booked.addAll(ids);
            revenue += total; // the price is fixed when the seat is sold
            return user + " booked " + String.join(" ", ids) + " for " + total;
        }
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String[] size = br.readLine().trim().split("\\s+");
        String[] cats = br.readLine().trim().split("\\s+");
        int rows = Integer.parseInt(size[0]), cols = Integer.parseInt(size[1]);
        Show show = new Show();
        for (int r = 0; r < rows; r++)
            for (int c = 1; c <= cols; c++) show.seats.put((char) ('A' + r) + String.valueOf(c), Category.valueOf(cats[r]));
        StringBuilder out = new StringBuilder();
        String line;
        while ((line = br.readLine()) != null) {
            line = line.trim();
            if (line.isEmpty()) continue;
            String[] p = line.split("\\s+");
            String said = switch (p[0]) {
                case "PRICING" -> show.setPricing(p[1]);
                case "QUOTE" -> show.quote(Arrays.asList(p).subList(1, p.length));
                case "BOOK" -> show.book(p[1], Arrays.asList(p).subList(2, p.length));
                case "REVENUE" -> "revenue " + show.revenue;
                default -> "unknown command " + p[0];
            };
            out.append(said).append('\n');
        }
        System.out.print(out);
    }
}
`;

const more: Record<string, ExerciseSource[]> = {
  "ticket-booking-design": [
    {
      title: "Pricing as a Strategy",
      prompt: `Price seats by category with a pricing rule chosen per show.

**Input.** The first line is \`rows cols\` (seats \`A1\` … as before). The second line gives each row's category in order: \`REGULAR\`, \`PREMIUM\` or \`RECLINER\`, whose base prices are 200, 360 and 520 rupees. The show starts on the \`WEEKDAY\` rule. Then one command per line:

- \`PRICING NAME\`: switch the rule and print \`pricing NAME\`, or \`unknown pricing NAME\` (the rule stays). The rules: \`WEEKDAY\` is the base price, \`WEEKEND\` is base × 5 / 4, \`MATINEE\` is base × 3 / 4, in whole rupees.
- \`QUOTE s1 s2 …\`: \`A1 250 + C2 450 = 700\` at the current rule (a single seat: \`A1 250 = 250\`), or \`no such seat S\` for the first unknown seat.
- \`BOOK user s1 s2 …\`: all or none, checked in order: \`user cannot book S: no such seat\` or \`: booked\`. Otherwise \`user booked s1 s2 … for TOTAL\` at the current rule.
- \`REVENUE\`: \`revenue N\`, the sum of every booking at the price it was sold for.

**Example**

\`\`\`
3 4
REGULAR REGULAR PREMIUM
QUOTE A1 C2
PRICING WEEKEND
QUOTE A1 C2
\`\`\`
prints
\`\`\`
A1 200 + C2 360 = 560
pricing WEEKEND
A1 250 + C2 450 = 700
\`\`\``,
      starter: PRICING_STARTER,
      solution: PRICING_SOLUTION,
      hints: [
        "One interface, PricingStrategy, with price(Category); one small class per rule.",
        "Keep the rules in a map from name to strategy, so PRICING is one lookup and an unknown name is a null.",
        "BOOK adds the total to revenue when the seats are sold, so a later PRICING change does not move past sales.",
      ],
      cases: [
        {
          stdin: "3 4\nREGULAR REGULAR PREMIUM\nQUOTE A1 C2\nBOOK ann A1 C2\nPRICING WEEKEND\nQUOTE A1 C2\nBOOK raj A2 C2\nBOOK raj A2 C3\nREVENUE\n",
          expected: "A1 200 + C2 360 = 560\nann booked A1 C2 for 560\npricing WEEKEND\nA1 250 + C2 450 = 700\nraj cannot book C2: booked\nraj booked A2 C3 for 700\nrevenue 1260\n",
        },
        {
          stdin: "2 2\nRECLINER REGULAR\nPRICING MATINEE\nQUOTE A1\nQUOTE B2 A2\nPRICING HOLIDAY\nBOOK kim B1 B9\nBOOK kim B1 A1\nPRICING WEEKDAY\nBOOK lee A2\nREVENUE\n",
          expected:
            "pricing MATINEE\nA1 390 = 390\nB2 150 + A2 390 = 540\nunknown pricing HOLIDAY\nkim cannot book B9: no such seat\nkim booked B1 A1 for 540\npricing WEEKDAY\nlee booked A2 for 520\nrevenue 1060\n",
          hidden: true,
        },
        {
          stdin: "1 3\nPREMIUM\nREVENUE\nQUOTE A4\nPRICING WEEKEND\nBOOK sam A1 A2 A3\nQUOTE A1\nBOOK tom A3\nREVENUE\n",
          expected: "revenue 0\nno such seat A4\npricing WEEKEND\nsam booked A1 A2 A3 for 1350\nA1 450 = 450\ntom cannot book A3: booked\nrevenue 1350\n",
          hidden: true,
        },
      ],
    },
  ],
};

export default more;
