import { defineModule } from "../../dsl.js";

/*
 * Parking lot. The programs share one core — sizes, vehicle types, a
 * factory, spots and levels — written once below and spliced into each
 * program, so the three exercises differ only in what they teach: best-fit
 * allocation (1), tickets and a swappable PricingStrategy (2), both together
 * across levels (checkpoint). Hidden cases run a full lot, a truck with no
 * large spot, a bike pushed into a large spot, and pricing switched mid-run.
 */

const CORE = String.raw`    static class ParkingException extends RuntimeException {
        ParkingException(String message) { super(message); }
    }

    /** Spot sizes, smallest first: a spot fits a vehicle when its size is at least what the vehicle needs. */
    enum Size { S, M, L }

    enum VehicleType {
        BIKE(Size.S), CAR(Size.M), TRUCK(Size.L);

        final Size needs;

        VehicleType(Size needs) { this.needs = needs; }
    }

    static class Vehicle {
        final String plate;
        final VehicleType type;

        Vehicle(String plate, VehicleType type) { this.plate = plate; this.type = type; }
    }

    /** The one place that turns a type name into a Vehicle — and refuses an unknown one. */
    static class VehicleFactory {
        static Vehicle create(String plate, String type) {
            for (VehicleType t : VehicleType.values()) {
                if (t.name().equals(type)) return new Vehicle(plate, t);
            }
            throw new ParkingException("unknown vehicle type " + type);
        }
    }

    static class Spot {
        final int level;
        final String id;
        final Size size;
        Vehicle vehicle; // null while free

        Spot(int level, String id) {
            this.level = level;
            this.id = id;
            this.size = Size.valueOf(id.substring(0, 1)); // S1, M2, L1: the first letter is the size
        }

        boolean fits(Vehicle v) { return vehicle == null && size.compareTo(v.type.needs) >= 0; }

        String name() { return "level " + level + " spot " + id; }
    }

    static class Level {
        final int number;
        final List<Spot> spots = new ArrayList<>(); // in the order given: ties go to the first listed

        Level(int number, String[] ids) {
            this.number = number;
            for (String id : ids) spots.add(new Spot(number, id));
        }

        int free() {
            int n = 0;
            for (Spot s : spots) if (s.vehicle == null) n++;
            return n;
        }
    }

    interface SpotStrategy {
        /** A free spot that fits, or null. */
        Spot find(List<Level> levels, Vehicle v);
    }`;

const BEST_FIT = String.raw`    /** Lowest level first; on it, the smallest free spot that fits; ties go to the spot listed first. */
    static class BestFit implements SpotStrategy {
        public Spot find(List<Level> levels, Vehicle v) {
            for (Level level : levels) {
                Spot best = null;
                for (Spot s : level.spots) {
                    if (s.fits(v) && (best == null || s.size.compareTo(best.size) < 0)) best = s;
                }
                if (best != null) return best;
            }
            return null;
        }
    }`;

const STATUS = String.raw`        String status() {
            StringBuilder sb = new StringBuilder();
            for (Level level : levels) {
                if (sb.length() > 0) sb.append(", ");
                int free = level.free();
                sb.append("level ").append(level.number).append(": ").append(free == 0 ? "full" : free + " free");
            }
            return sb.toString();
        }`;

const READ_LEVELS = String.raw`        int n = Integer.parseInt(br.readLine().trim());
        List<Level> levels = new ArrayList<>();
        for (int i = 1; i <= n; i++) levels.add(new Level(i, br.readLine().trim().split("\\s+")));`;

const BASIC_LOT = String.raw`    static class ParkingLot {
        private final List<Level> levels;
        private final SpotStrategy strategy;
        private final Map<String, Spot> parked = new HashMap<>();

        ParkingLot(List<Level> levels, SpotStrategy strategy) { this.levels = levels; this.strategy = strategy; }

        /** The spot taken, or null when no free spot fits. */
        Spot park(Vehicle v) {
            if (parked.containsKey(v.plate)) throw new ParkingException(v.plate + " is already parked");
            Spot spot = strategy.find(levels, v);
            if (spot == null) return null;
            spot.vehicle = v;
            parked.put(v.plate, spot);
            return spot;
        }

        Spot leave(String plate) {
            Spot spot = parked.remove(plate);
            if (spot == null) throw new ParkingException(plate + " is not parked");
            spot.vehicle = null;
            return spot;
        }

${STATUS}
    }`;

const BASIC_MAIN = String.raw`    static String handle(ParkingLot lot, String[] p) {
        switch (p[0]) {
            case "PARK": {
                Vehicle v = VehicleFactory.create(p[1], p[2]);
                Spot spot = lot.park(v);
                return spot == null ? "no spot for " + p[1] : p[1] + " parked at " + spot.name();
            }
            case "LEAVE":
                return p[1] + " left " + lot.leave(p[1]).name();
            case "STATUS":
                return lot.status();
            default:
                return "error: unknown command " + p[0];
        }
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
${READ_LEVELS}
        ParkingLot lot = new ParkingLot(levels, new BestFit());
        StringBuilder out = new StringBuilder();
        String line;
        while ((line = br.readLine()) != null) {
            line = line.trim();
            if (line.isEmpty()) continue;
            String reply;
            try {
                reply = handle(lot, line.split("\\s+"));
            } catch (ParkingException e) {
                reply = "error: " + e.getMessage();
            }
            out.append(reply).append('\n');
        }
        System.out.print(out);
    }`;

const PARK_SOLUTION = String.raw`import java.io.*;
import java.util.*;

public class Main {
${CORE}

${BEST_FIT}

${BASIC_LOT}

${BASIC_MAIN}
}
`;

const PARK_STARTER = String.raw`import java.io.*;
import java.util.*;

public class Main {
${CORE}

    /** Lowest level first; on it, the smallest free spot that fits; ties go to the spot listed first. */
    static class BestFit implements SpotStrategy {
        public Spot find(List<Level> levels, Vehicle v) {
            // TODO
            return null;
        }
    }

    static class ParkingLot {
        private final List<Level> levels;
        private final SpotStrategy strategy;
        private final Map<String, Spot> parked = new HashMap<>();

        ParkingLot(List<Level> levels, SpotStrategy strategy) { this.levels = levels; this.strategy = strategy; }

        /** The spot taken, or null when no free spot fits. */
        Spot park(Vehicle v) {
            // TODO: refuse a plate already parked, ask the strategy, take the spot
            return null;
        }

        Spot leave(String plate) {
            // TODO
            throw new ParkingException(plate + " is not parked");
        }

        String status() {
            // TODO: "level 1: 2 free, level 2: full"
            return "";
        }
    }

${BASIC_MAIN}
}
`;

/** Tickets and the swappable tariff, shared by the fee programs. */
const PRICING = String.raw`    static class Ticket {
        final Vehicle vehicle;
        final Spot spot;
        final int entryHour;

        Ticket(Vehicle vehicle, Spot spot, int entryHour) { this.vehicle = vehicle; this.spot = spot; this.entryHour = entryHour; }
    }

    interface PricingStrategy {
        int fee(Ticket ticket, int exitHour);
        String describe();
    }

    /** A rate per vehicle type for each hour parked, at least one hour. */
    static class Hourly implements PricingStrategy {
        private final Map<VehicleType, Integer> rates = new EnumMap<>(VehicleType.class);

        Hourly() {
            rates.put(VehicleType.BIKE, 10);
            rates.put(VehicleType.CAR, 20);
            rates.put(VehicleType.TRUCK, 40);
        }

        public int fee(Ticket ticket, int exitHour) {
            int hours = Math.max(1, exitHour - ticket.entryHour);
            return hours * rates.get(ticket.vehicle.type);
        }

        public String describe() { return "hourly"; }
    }

    static class Flat implements PricingStrategy {
        private final int amount;

        Flat(int amount) { this.amount = amount; }

        public int fee(Ticket ticket, int exitHour) { return amount; }

        public String describe() { return "flat " + amount; }
    }

    static PricingStrategy pricingFrom(String[] p) {
        if (p[1].equals("HOURLY")) return new Hourly();
        if (p[1].equals("FLAT")) return new Flat(Integer.parseInt(p[2]));
        throw new ParkingException("unknown pricing " + p[1]);
    }

    /** What a departure answers: the spot freed and the fee charged. */
    static class Receipt {
        final Spot spot;
        final int fee;

        Receipt(Spot spot, int fee) { this.spot = spot; this.fee = fee; }
    }`;

const FEE_LOT = String.raw`    static class ParkingLot {
        private final List<Level> levels;
        private final SpotStrategy strategy;
        private PricingStrategy pricing = new Hourly();
        private final Map<String, Ticket> tickets = new HashMap<>();
        private int earnings = 0;

        ParkingLot(List<Level> levels, SpotStrategy strategy) { this.levels = levels; this.strategy = strategy; }

        void setPricing(PricingStrategy pricing) { this.pricing = pricing; }

        /** The ticket issued, or null when no free spot fits. */
        Ticket park(Vehicle v, int hour) {
            if (tickets.containsKey(v.plate)) throw new ParkingException(v.plate + " is already parked");
            Spot spot = strategy.find(levels, v);
            if (spot == null) return null;
            spot.vehicle = v;
            Ticket ticket = new Ticket(v, spot, hour);
            tickets.put(v.plate, ticket);
            return ticket;
        }

        /** Frees the spot and charges with the tariff in force now. */
        Receipt leave(String plate, int hour) {
            Ticket ticket = tickets.remove(plate);
            if (ticket == null) throw new ParkingException(plate + " is not parked");
            ticket.spot.vehicle = null;
            int fee = pricing.fee(ticket, hour);
            earnings += fee;
            return new Receipt(ticket.spot, fee);
        }

        int earnings() { return earnings; }

${STATUS}
    }`;

/** The fee programs' command loop; `where` is how a spot is named in the output. */
const feeMain = (readLevels: string, where: string) => String.raw`    static String handle(ParkingLot lot, String[] p) {
        switch (p[0]) {
            case "PARK": {
                Vehicle v = VehicleFactory.create(p[1], p[2]);
                Ticket ticket = lot.park(v, Integer.parseInt(p[3]));
                return ticket == null ? "no spot for " + p[1] : p[1] + " parked at " + ${where.replace("SPOT", "ticket.spot")};
            }
            case "LEAVE": {
                Receipt r = lot.leave(p[1], Integer.parseInt(p[2]));
                return p[1] + " left " + ${where.replace("SPOT", "r.spot")} + ", paid " + r.fee;
            }
            case "PRICING": {
                PricingStrategy pricing = pricingFrom(p);
                lot.setPricing(pricing);
                return "pricing: " + pricing.describe();
            }
            case "EARNINGS":
                return "earnings: " + lot.earnings();
            case "STATUS":
                return lot.status();
            default:
                return "error: unknown command " + p[0];
        }
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
${readLevels}
        ParkingLot lot = new ParkingLot(levels, new BestFit());
        StringBuilder out = new StringBuilder();
        String line;
        while ((line = br.readLine()) != null) {
            line = line.trim();
            if (line.isEmpty()) continue;
            String reply;
            try {
                reply = handle(lot, line.split("\\s+"));
            } catch (ParkingException e) {
                reply = "error: " + e.getMessage();
            }
            out.append(reply).append('\n');
        }
        System.out.print(out);
    }`;

const ONE_LEVEL = String.raw`        List<Level> levels = new ArrayList<>();
        levels.add(new Level(1, br.readLine().trim().split("\\s+")));`;

const FEES_SOLUTION = String.raw`import java.io.*;
import java.util.*;

public class Main {
${CORE}

${BEST_FIT}

${PRICING}

${FEE_LOT}

${feeMain(ONE_LEVEL, "SPOT.id")}
}
`;

const FEES_STARTER = String.raw`import java.io.*;
import java.util.*;

public class Main {
${CORE}

${BEST_FIT}

    static class Ticket {
        final Vehicle vehicle;
        final Spot spot;
        final int entryHour;

        Ticket(Vehicle vehicle, Spot spot, int entryHour) { this.vehicle = vehicle; this.spot = spot; this.entryHour = entryHour; }
    }

    interface PricingStrategy {
        int fee(Ticket ticket, int exitHour);
        String describe();
    }

    // TODO: Hourly (BIKE 10, CAR 20, TRUCK 40 an hour, at least one hour) and Flat(amount).

    static PricingStrategy pricingFrom(String[] p) {
        // TODO: HOURLY, FLAT <amount>, else ParkingException("unknown pricing " + p[1])
        throw new ParkingException("unknown pricing " + p[1]);
    }

    static class Receipt {
        final Spot spot;
        final int fee;

        Receipt(Spot spot, int fee) { this.spot = spot; this.fee = fee; }
    }

    static class ParkingLot {
        private final List<Level> levels;
        private final SpotStrategy strategy;
        private PricingStrategy pricing; // TODO: start hourly
        private final Map<String, Ticket> tickets = new HashMap<>();
        private int earnings = 0;

        ParkingLot(List<Level> levels, SpotStrategy strategy) { this.levels = levels; this.strategy = strategy; }

        void setPricing(PricingStrategy pricing) { this.pricing = pricing; }

        /** The ticket issued, or null when no free spot fits. */
        Ticket park(Vehicle v, int hour) {
            // TODO
            return null;
        }

        /** Frees the spot and charges with the tariff in force now. */
        Receipt leave(String plate, int hour) {
            // TODO
            throw new ParkingException(plate + " is not parked");
        }

        int earnings() { return earnings; }

${STATUS}
    }

${feeMain(ONE_LEVEL, "SPOT.id")}
}
`;

const LOT_SOLUTION = String.raw`import java.io.*;
import java.util.*;

public class Main {
${CORE}

${BEST_FIT}

${PRICING}

${FEE_LOT}

${feeMain(READ_LEVELS, "SPOT.name()")}
}
`;

const LOT_STARTER = String.raw`import java.io.*;
import java.util.*;

public class Main {
${CORE}

    // TODO: BestFit, Ticket, PricingStrategy (Hourly, Flat), a ParkingLot with tickets and earnings.

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
${READ_LEVELS}
        StringBuilder out = new StringBuilder();
        String line;
        while ((line = br.readLine()) != null) {
            line = line.trim();
            if (line.isEmpty()) continue;
            String[] p = line.split("\\s+");
            String reply;
            try {
                // TODO: PARK, LEAVE, PRICING, EARNINGS, STATUS
                reply = "error: unknown command " + p[0];
            } catch (ParkingException e) {
                reply = "error: " + e.getMessage();
            }
            out.append(reply).append('\n');
        }
        System.out.print(out);
    }
}
`;

const SIZES = `Spot ids start with their size — \`S1\` small, \`M2\` medium, \`L1\` large. A bike fits any spot, a car a medium or large one, a truck only a large one.`;

export default defineModule(import.meta.url, {
  slug: "parking-lot",
  title: "Parking lot",
  blurb: "Levels of sized spots, a best-fit SpotStrategy, a vehicle factory, tickets and a PricingStrategy swapped while the lot runs.",
  icon: "grid",
  overview: `The parking lot is the classic warm-up of the machine-coding round: small enough for an hour, rich enough to show composition, an enum that carries a rule, a factory, and the Strategy pattern twice — once for *which spot*, once for *how much*.

You will code best-fit allocation across levels (lowest level first, smallest spot that fits), then tickets and fees with an hourly or flat tariff that can be switched while the lot is running. The checkpoint puts both together. Hidden cases run a full lot, a truck that finds no large spot, a bike pushed into a large spot because nothing smaller is free, and a tariff changed between two departures.

It is the practice half of the note [Design a Parking Lot](/notes/low-level-design/design-a-parking-lot).`,
  lessons: [
    {
      slug: "parking-lot-design",
      file: "01-parking-lot-design.md",
      exercises: [
        {
          title: "Park and leave, best fit",
          prompt: `The first line of input is the number of levels \`n\`; the next \`n\` lines list each level's spot ids, in order. ${SIZES} Then commands, one per line:

| Command | Prints |
| --- | --- |
| \`PARK <plate> <BIKE\\|CAR\\|TRUCK>\` | \`<plate> parked at level <L> spot <id>\`, or \`no spot for <plate>\` |
| \`LEAVE <plate>\` | \`<plate> left level <L> spot <id>\` |
| \`STATUS\` | each level as \`level <L>: <k> free\` or \`level <L>: full\`, joined by \`, \` |

**Best fit:** try the lowest level first; on a level, take the smallest free spot that fits; among spots of that size, the one listed first. Move to the next level only when nothing on this one fits.

Refusals print \`error: <reason>\`: \`unknown vehicle type <T>\` (checked first), \`<plate> is already parked\`, \`<plate> is not parked\`, \`unknown command <WORD>\`.`,
          starter: PARK_STARTER,
          solution: PARK_SOLUTION,
          hints: [
            "Size is an enum ordered S, M, L, so 'fits' is vehicle == null && size.compareTo(needs) >= 0.",
            "BestFit scans one level at a time and returns as soon as a level has any spot that fits.",
            "Keep a Map from plate to spot so LEAVE finds the spot in O(1).",
          ],
          cases: [
            {
              stdin: "2\nS1 M1 L1\nM1 M2\nPARK KA01 CAR\nPARK KA02 BIKE\nPARK KA03 TRUCK\nPARK KA04 CAR\nSTATUS\nLEAVE KA01\nPARK KA05 CAR\nSTATUS\n",
              expected: "KA01 parked at level 1 spot M1\nKA02 parked at level 1 spot S1\nKA03 parked at level 1 spot L1\nKA04 parked at level 2 spot M1\nlevel 1: full, level 2: 1 free\nKA01 left level 1 spot M1\nKA05 parked at level 1 spot M1\nlevel 1: full, level 2: 1 free\n",
            },
            {
              stdin: "1\nS1 L1\nPARK B1 BIKE\nPARK B2 BIKE\nPARK T1 TRUCK\nPARK C1 CAR\nPARK B1 BIKE\nPARK X1 BUS\nLEAVE T1\nLEAVE B2\nPARK T1 TRUCK\nSTATUS\n",
              expected: "B1 parked at level 1 spot S1\nB2 parked at level 1 spot L1\nno spot for T1\nno spot for C1\nerror: B1 is already parked\nerror: unknown vehicle type BUS\nerror: T1 is not parked\nB2 left level 1 spot L1\nT1 parked at level 1 spot L1\nlevel 1: full\n",
              hidden: true,
            },
            {
              stdin: "3\nL1 M2 M1\nS1\nL2\nPARK c CAR\nPARK b BIKE\nPARK b2 BIKE\nPARK t TRUCK\nPARK t2 TRUCK\nSTATUS\nLEAVE b\nSTATUS\nFLY c\n",
              expected: "c parked at level 1 spot M2\nb parked at level 1 spot M1\nb2 parked at level 1 spot L1\nt parked at level 3 spot L2\nno spot for t2\nlevel 1: full, level 2: 1 free, level 3: full\nb left level 1 spot M1\nlevel 1: 1 free, level 2: 1 free, level 3: full\nerror: unknown command FLY\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Tickets and a pricing strategy",
          prompt: `One level this time: the first line lists its spot ids. ${SIZES} Allocation is best fit, as before. Parking issues a ticket with the entry hour; leaving charges a fee with the **pricing strategy in force at that moment**, which starts as hourly.

- **Hourly**: BIKE 10, CAR 20, TRUCK 40 for each hour parked (\`exit − entry\`), at least one hour.
- **Flat**: the same amount whatever the vehicle and the time.

| Command | Prints |
| --- | --- |
| \`PARK <plate> <TYPE> <hour>\` | \`<plate> parked at <id>\`, or \`no spot for <plate>\` |
| \`LEAVE <plate> <hour>\` | \`<plate> left <id>, paid <fee>\` |
| \`PRICING HOURLY\` / \`PRICING FLAT <amount>\` | \`pricing: hourly\` / \`pricing: flat <amount>\` |
| \`EARNINGS\` | \`earnings: <total of every fee charged>\` |

Refusals print \`error: <reason>\`: \`unknown vehicle type <T>\`, \`<plate> is already parked\`, \`<plate> is not parked\`, \`unknown pricing <WORD>\`, \`unknown command <WORD>\`.`,
          starter: FEES_STARTER,
          solution: FEES_SOLUTION,
          hints: [
            "PricingStrategy has one method that matters, fee(ticket, exitHour); Hourly and Flat each implement it.",
            "The lot holds a PricingStrategy field and a setter: PRICING replaces the object, and the next LEAVE uses it.",
            "Math.max(1, exit - entry) gives the one-hour minimum.",
          ],
          cases: [
            { stdin: "S1 M1 L1\nPARK KA01 CAR 9\nPARK KA02 BIKE 10\nLEAVE KA01 12\nLEAVE KA02 10\nEARNINGS\n", expected: "KA01 parked at M1\nKA02 parked at S1\nKA01 left M1, paid 60\nKA02 left S1, paid 10\nearnings: 70\n" },
            {
              stdin: "M1 L1\nPARK T1 TRUCK 0\nPARK C1 CAR 1\nPRICING FLAT 50\nLEAVE T1 5\nPRICING HOURLY\nLEAVE C1 6\nPRICING WEEKEND\nPRICING FLAT 0\nEARNINGS\n",
              expected: "T1 parked at L1\nC1 parked at M1\npricing: flat 50\nT1 left L1, paid 50\npricing: hourly\nC1 left M1, paid 100\nerror: unknown pricing WEEKEND\npricing: flat 0\nearnings: 150\n",
              hidden: true,
            },
            {
              stdin: "S1\nPARK B1 BIKE 8\nPARK B2 BIKE 8\nPARK C1 CAR 8\nLEAVE B2 9\nLEAVE B1 11\nPARK B2 BIKE 11\nPARK B2 BIKE 12\nLEAVE B2 20\nEARNINGS\nPARK Z9 VAN 1\n",
              expected: "B1 parked at S1\nno spot for B2\nno spot for C1\nerror: B2 is not parked\nB1 left S1, paid 30\nB2 parked at S1\nerror: B2 is already parked\nB2 left S1, paid 90\nearnings: 120\nerror: unknown vehicle type VAN\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Level 1 has a free **L1** only; level 2 has a free **M1**. A car arrives. Where does best fit (as specified here) park it?",
          options: ["Level 2 M1, the better fit", "Level 1 L1 — the lowest level with any spot that fits comes first", "Nowhere", "Whichever was freed most recently"],
          answer: 1,
          explanation: "Best fit here is *lowest level first*, then the smallest fitting spot on that level. Level 1 has a spot that fits, so level 2 is never searched. A different rule (smallest spot anywhere) would be another SpotStrategy — that is the point of the interface.",
        },
        {
          prompt: "Marketing wants a weekend flat fee. With the Strategy design, what changes?",
          options: ["ParkingLot.leave gets an if for weekends", "A new PricingStrategy class; ParkingLot is untouched", "Ticket gets a weekend flag", "VehicleType gets a weekend rate"],
          answer: 1,
          explanation: "The lot depends only on the PricingStrategy interface, so a new tariff is a new class — open for extension, closed for modification.",
        },
        {
          prompt: "Why give `VehicleType` the size it needs (`CAR(Size.M)`) instead of a `switch` in `park`?",
          options: ["Enums are faster", "A new vehicle type then carries its own rule; nothing else changes", "Java forbids switch on enums", "It saves memory"],
          answer: 1,
          explanation: "A switch on type inside the lot must be edited for every new type, and it tends to be copied. Putting the need on the enum keeps the rule with the data, and `fits` becomes one comparison.",
        },
        {
          prompt: "A truck arrives and no large spot is free. What should `park` do?",
          options: ["Throw an exception", "Return null (or an empty result) that main prints as \"no spot\"", "Park it in two medium spots", "Wait until a spot frees"],
          answer: 1,
          explanation: "A full lot is an expected outcome, not a programming error or a bad request, so it is a normal return value. Exceptions are for refusals such as an unknown type or a plate already inside.",
        },
      ],
    },
    {
      slug: "parking-lot-checkpoint",
      file: "02-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "A multi-level lot with fees",
          prompt: `Put both programs together. The first line is the number of levels \`n\`, then \`n\` lines of spot ids. ${SIZES} Allocation is best fit (lowest level, then smallest fitting spot, then the first listed); pricing starts hourly (BIKE 10, CAR 20, TRUCK 40 an hour, at least one hour) and can be switched.

| Command | Prints |
| --- | --- |
| \`PARK <plate> <TYPE> <hour>\` | \`<plate> parked at level <L> spot <id>\` or \`no spot for <plate>\` |
| \`LEAVE <plate> <hour>\` | \`<plate> left level <L> spot <id>, paid <fee>\` |
| \`PRICING HOURLY\` / \`PRICING FLAT <amount>\` | \`pricing: hourly\` / \`pricing: flat <amount>\` |
| \`STATUS\` | \`level <L>: <k> free\` or \`level <L>: full\` for each level, joined by \`, \` |
| \`EARNINGS\` | \`earnings: <total>\` |

Refusals print \`error: <reason>\`: \`unknown vehicle type <T>\`, \`<plate> is already parked\`, \`<plate> is not parked\`, \`unknown pricing <WORD>\`, \`unknown command <WORD>\`.`,
          starter: LOT_STARTER,
          solution: LOT_SOLUTION,
          hints: ["Reuse the two strategies unchanged: only the way a spot is named differs from the one-level program.", "The fee uses the tariff in force when the vehicle leaves, not when it arrived."],
          cases: [
            {
              stdin: "2\nS1 M1\nL1\nPARK A CAR 1\nPARK B TRUCK 1\nPARK C CAR 2\nSTATUS\nLEAVE A 4\nPARK C CAR 4\nSTATUS\nEARNINGS\n",
              expected: "A parked at level 1 spot M1\nB parked at level 2 spot L1\nno spot for C\nlevel 1: 1 free, level 2: full\nA left level 1 spot M1, paid 60\nC parked at level 1 spot M1\nlevel 1: 1 free, level 2: full\nearnings: 60\n",
            },
            {
              stdin: "1\nM1 S1 L1\nPARK b BIKE 0\nPARK t TRUCK 0\nPARK c CAR 0\nPARK x CAR 0\nPRICING FLAT 25\nLEAVE t 10\nLEAVE b 1\nPRICING HOURLY\nLEAVE c 2\nLEAVE c 3\nEARNINGS\n",
              expected: "b parked at level 1 spot S1\nt parked at level 1 spot L1\nc parked at level 1 spot M1\nno spot for x\npricing: flat 25\nt left level 1 spot L1, paid 25\nb left level 1 spot S1, paid 25\npricing: hourly\nc left level 1 spot M1, paid 40\nerror: c is not parked\nearnings: 90\n",
              hidden: true,
            },
            {
              stdin: "2\nS1\nS1\nPARK m BIKE 5\nPARK n BIKE 5\nPARK o BIKE 5\nPARK m BIKE 6\nPARK p PLANE 6\nLEAVE n 5\nSTATUS\nTOW m\n",
              expected: "m parked at level 1 spot S1\nn parked at level 2 spot S1\nno spot for o\nerror: m is already parked\nerror: unknown vehicle type PLANE\nn left level 2 spot S1, paid 10\nlevel 1: full, level 2: 1 free\nerror: unknown command TOW\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which relation is right between `ParkingLot` and `Level`?",
          options: ["Inheritance: a Level is a ParkingLot", "Composition: the lot owns its levels", "Dependency only", "Aggregation of independent lots"],
          answer: 1,
          explanation: "Levels exist only as part of their lot and are created with it — composition. A level is not a kind of lot, so inheritance is wrong.",
        },
        {
          prompt: "Which pattern lets the lot change *which spot* a vehicle gets without editing `ParkingLot`?",
          options: ["Singleton", "Observer", "Strategy", "Decorator"],
          answer: 2,
          explanation: "A SpotStrategy interface (best fit, nearest to the gate, EV spots first) is a family of interchangeable algorithms behind one method — Strategy.",
        },
        {
          prompt: "What does a `VehicleFactory` add over calling `new Vehicle(...)` everywhere?",
          options: ["Speed", "One place that maps a type name to a vehicle and refuses unknown ones", "Thread safety", "It replaces the enum"],
          answer: 1,
          explanation: "Creation logic — parsing the type, validating it, choosing a subclass if there are several — lives in one place, so adding a vehicle type changes the factory and the enum, not every caller.",
        },
        {
          prompt: "A car parks at hour 9 and leaves at hour 9. Hourly CAR rate 20, minimum one hour. What is the fee?",
          options: ["0", "20", "40", "It is refused"],
          answer: 1,
          explanation: "`max(1, 9 − 9) = 1` hour × 20 = 20. The minimum keeps a short stay from being free.",
        },
        {
          prompt: "Pricing is switched from hourly to flat 50 while a truck is parked. It leaves later. Which tariff applies in this design?",
          options: ["Hourly, the one at entry", "Flat 50, the one in force at exit", "The cheaper of the two", "Both, added"],
          answer: 1,
          explanation: "The lot asks its current PricingStrategy at `leave`. If a business wants the entry tariff, the ticket would carry its strategy — another design decision to state aloud.",
        },
        {
          prompt: "Two gates call `park` at the same moment for the last free spot. What prevents a double booking in a single process?",
          options: ["Nothing is needed", "Making find-and-take one atomic step, for example a lock around it", "A volatile field on Spot", "Sorting the spots"],
          answer: 1,
          explanation: "Finding a free spot and taking it must happen together; otherwise both gates see it free. A lock (or a conditional update in a database) makes the second caller retry and get another spot or none.",
        },
        {
          prompt: "Why is \"no spot\" returned as a value while \"already parked\" is an exception in this design?",
          options: ["Exceptions are slow", "A full lot is a normal outcome; a plate already inside is a request the lot refuses", "Java requires it", "There is no reason"],
          answer: 1,
          explanation: "Callers must always handle a full lot, so it belongs in the return type. Invalid requests are exceptional and get a reason the caller can print.",
        },
        {
          prompt: "Spots are kept in a `List` per level, not a `HashMap`. Why does that matter for the output?",
          options: ["Lists are faster to search", "Best fit breaks ties by the order spots were listed; a HashMap's iteration order is unspecified", "HashMap cannot hold Spot objects", "It does not matter"],
          answer: 1,
          explanation: "A deterministic tie-break needs a defined order. A `List` keeps the input order; a HashMap could return a different spot on another JDK.",
        },
        {
          prompt: "A new requirement: electric cars must park in charging spots. What is the cleanest change?",
          options: ["An if in ParkingLot.park", "A new VehicleType and spot capability, with a SpotStrategy that honours it", "Remove the factory", "A separate lot for electric cars"],
          answer: 1,
          explanation: "The new vehicle kind and its need go into the type and the spot, and the allocation rule into a strategy. The lot's own code stays the same.",
        },
        {
          prompt: "Is a `Singleton` ParkingLot a good idea in this exercise?",
          options: ["Yes, always", "Usually not: passing one instance in is simpler to test and allows several lots", "Yes, because there is one main", "Only for the pricing"],
          answer: 1,
          explanation: "A singleton is global state: tests cannot build a fresh lot, and a second lot (another site) becomes impossible. Create one and pass it to whoever needs it.",
        },
      ],
    },
  ],
});
