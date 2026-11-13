import { defineModule } from "../../dsl.js";

/*
 * Vending machine. The programs read the slots (code, name, price, stock)
 * and then a script of events; the State pattern carries the design: Idle,
 * HasMoney and OutOfStock each answer every event. Hidden cases run a
 * machine that starts empty, rejected coins, a sold-out slot beside a full
 * one, a refill out of OutOfStock, and — in the checkpoint — change that
 * greedy cannot make from the coins actually in the box.
 */

const ITEM = String.raw`    static class Item {
        final String code;
        final String name;
        final int price;
        int stock;
        int sold;

        Item(String code, String name, int price, int stock) { this.code = code; this.name = name; this.price = price; this.stock = stock; }
    }`;

const READ_ITEMS = String.raw`        int n = Integer.parseInt(br.readLine().trim());
        VendingMachine machine = new VendingMachine();
        for (int i = 0; i < n; i++) {
            String[] f = br.readLine().trim().split("\\s+");
            machine.addItem(new Item(f[0], f[1], Integer.parseInt(f[2]), Integer.parseInt(f[3])));
        }
        machine.start();`;

const LOOP = (cases: string) => String.raw`        StringBuilder out = new StringBuilder();
        String line;
        while ((line = br.readLine()) != null) {
            line = line.trim();
            if (line.isEmpty()) continue;
            String[] p = line.split("\\s+");
            String reply;
            switch (p[0]) {
${cases}
                default:
                    reply = "error: unknown command " + p[0];
            }
            out.append(reply).append('\n');
        }
        System.out.print(out);`;

const BASE_CASES = String.raw`                case "INSERT":
                    reply = machine.insert(p[1]);
                    break;
                case "SELECT":
                    reply = machine.select(p[1]);
                    break;
                case "CANCEL":
                    reply = machine.cancel();
                    break;
                case "STATE":
                    reply = machine.state.name();
                    break;`;

const STOCK_CASES = String.raw`                case "REFILL":
                    reply = machine.refill(p[1], Integer.parseInt(p[2]));
                    break;
                case "REPORT":
                    reply = machine.report();
                    break;
                case "TOTAL":
                    reply = "revenue " + machine.revenue;
                    break;`;

/** The states and the machine; `withStock` adds sales counts, refills and the report. */
const machineCode = (withStock: boolean) => String.raw`    interface State {
        String name();
        String insert(VendingMachine m, int coin);
        String select(VendingMachine m, String code);
        String cancel(VendingMachine m);
    }

    // States hold no data of their own, so one shared instance of each is enough.
    static final State IDLE = new Idle();
    static final State HAS_MONEY = new HasMoney();
    static final State OUT_OF_STOCK = new OutOfStock();

    static class Idle implements State {
        public String name() { return "Idle"; }

        public String insert(VendingMachine m, int coin) {
            m.balance += coin;
            m.move(HAS_MONEY);
            return "balance " + m.balance;
        }

        public String select(VendingMachine m, String code) { return "insert coins first"; }

        public String cancel(VendingMachine m) { return "nothing to return"; }
    }

    static class HasMoney implements State {
        public String name() { return "HasMoney"; }

        public String insert(VendingMachine m, int coin) {
            m.balance += coin;
            return "balance " + m.balance;
        }

        public String select(VendingMachine m, String code) {
            Item item = m.items.get(code);
            if (item == null) return "error: no slot " + code;
            if (item.stock == 0) return code + " is sold out";
            if (m.balance < item.price) return "need " + (item.price - m.balance) + " more";
            int change = m.balance - item.price;
            item.stock--;
            item.sold++;
            m.revenue += item.price;
            m.balance = 0;
            m.move(m.anyStock() ? IDLE : OUT_OF_STOCK);
            return "dispensed " + item.name + ", " + (change == 0 ? "no change" : "change " + coinsFor(change));
        }

        public String cancel(VendingMachine m) {
            String coins = coinsFor(m.balance);
            m.balance = 0;
            m.move(IDLE);
            return "returned " + coins;
        }
    }

    static class OutOfStock implements State {
        public String name() { return "OutOfStock"; }

        public String insert(VendingMachine m, int coin) { return "sold out, returned " + coin; }

        public String select(VendingMachine m, String code) { return "sold out"; }

        public String cancel(VendingMachine m) { return "nothing to return"; }
    }

    /** Greedy change: the largest coin that fits, again and again — the fewest coins for 10, 5, 2, 1. */
    static String coinsFor(int amount) {
        List<String> coins = new ArrayList<>();
        for (int c : new int[] {10, 5, 2, 1}) {
            while (amount >= c) {
                coins.add(String.valueOf(c));
                amount -= c;
            }
        }
        return String.join("+", coins);
    }

    static class VendingMachine {
        static final List<String> ACCEPTED = Arrays.asList("1", "2", "5", "10");

        final Map<String, Item> items = new TreeMap<>(); // sorted by code
        State state = IDLE;
        int balance = 0;
        int revenue = 0;

        void addItem(Item item) { items.put(item.code, item); }

        void start() { state = anyStock() ? IDLE : OUT_OF_STOCK; }

        void move(State next) { state = next; }

        boolean anyStock() {
            for (Item item : items.values()) if (item.stock > 0) return true;
            return false;
        }

        // Every event goes to the current state; the machine never asks which state it is in.
        String insert(String coin) {
            if (!ACCEPTED.contains(coin)) return "rejected " + coin;
            return state.insert(this, Integer.parseInt(coin));
        }

        String select(String code) { return state.select(this, code); }

        String cancel() { return state.cancel(this); }
${withStock ? String.raw`
        /** Restocking is maintenance, not a customer event: any state, and it can end OutOfStock. */
        String refill(String code, int count) {
            Item item = items.get(code);
            if (item == null) return "error: no slot " + code;
            item.stock += count;
            if (state == OUT_OF_STOCK && anyStock()) move(IDLE);
            return code + " stock " + item.stock;
        }

        String report() {
            StringBuilder sb = new StringBuilder();
            for (Item item : items.values()) {
                if (sb.length() > 0) sb.append('\n');
                sb.append(item.code).append(' ').append(item.name).append(": stock ").append(item.stock).append(", sold ").append(item.sold);
            }
            return sb.toString();
        }
` : ""}    }`;

const program = (withStock: boolean) => String.raw`import java.io.*;
import java.util.*;

public class Main {
${ITEM}

${machineCode(withStock)}

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
${READ_ITEMS}
${LOOP(withStock ? BASE_CASES + "\n" + STOCK_CASES : BASE_CASES)}
    }
}
`;

const STATE_SOLUTION = program(false);
const STOCK_SOLUTION = program(true);

const STATE_STARTER = String.raw`import java.io.*;
import java.util.*;

public class Main {
${ITEM}

    interface State {
        String name();
        String insert(VendingMachine m, int coin);
        String select(VendingMachine m, String code);
        String cancel(VendingMachine m);
    }

    static final State IDLE = new Idle();
    static final State HAS_MONEY = new HasMoney();
    static final State OUT_OF_STOCK = new OutOfStock();

    static class Idle implements State {
        public String name() { return "Idle"; }
        public String insert(VendingMachine m, int coin) { return "TODO"; }
        public String select(VendingMachine m, String code) { return "TODO"; }
        public String cancel(VendingMachine m) { return "TODO"; }
    }

    static class HasMoney implements State {
        public String name() { return "HasMoney"; }
        public String insert(VendingMachine m, int coin) { return "TODO"; }
        public String select(VendingMachine m, String code) {
            // TODO: no slot, sold-out slot, underpaid, then sell and move to Idle or OutOfStock
            return "TODO";
        }
        public String cancel(VendingMachine m) { return "TODO"; }
    }

    static class OutOfStock implements State {
        public String name() { return "OutOfStock"; }
        public String insert(VendingMachine m, int coin) { return "TODO"; }
        public String select(VendingMachine m, String code) { return "TODO"; }
        public String cancel(VendingMachine m) { return "TODO"; }
    }

    /** Greedy change from 10, 5, 2, 1, joined with "+" ("10+5+2+2"). */
    static String coinsFor(int amount) {
        // TODO
        return "";
    }

    static class VendingMachine {
        static final List<String> ACCEPTED = Arrays.asList("1", "2", "5", "10");

        final Map<String, Item> items = new TreeMap<>();
        State state = IDLE;
        int balance = 0;
        int revenue = 0;

        void addItem(Item item) { items.put(item.code, item); }

        void start() { state = anyStock() ? IDLE : OUT_OF_STOCK; }

        void move(State next) { state = next; }

        boolean anyStock() {
            for (Item item : items.values()) if (item.stock > 0) return true;
            return false;
        }

        String insert(String coin) {
            if (!ACCEPTED.contains(coin)) return "rejected " + coin;
            return state.insert(this, Integer.parseInt(coin));
        }

        String select(String code) { return state.select(this, code); }

        String cancel() { return state.cancel(this); }
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
${READ_ITEMS}
${LOOP(BASE_CASES)}
    }
}
`;

const STOCK_STARTER = String.raw`import java.io.*;
import java.util.*;

public class Main {
${ITEM}

${machineCode(false).replace(
  "        String cancel() { return state.cancel(this); }\n",
  `        String cancel() { return state.cancel(this); }

        String refill(String code, int count) {
            // TODO: unknown slot, add the stock, leave OutOfStock when something is for sale again
            return "TODO";
        }

        String report() {
            // TODO: one line per slot in code order: "A1 chips: stock 1, sold 2"
            return "TODO";
        }
`,
)}

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
${READ_ITEMS}
${LOOP(BASE_CASES + "\n" + STOCK_CASES)}
    }
}
`;

const BOX_SOLUTION = String.raw`import java.io.*;
import java.util.*;

public class Main {
    static final int[] DENOMS = {10, 5, 2, 1};

    static class Item {
        final String code;
        final String name;
        final int price;
        int stock;

        Item(String code, String name, int price, int stock) { this.code = code; this.name = name; this.price = price; this.stock = stock; }
    }

    interface State {
        String name();
        String insert(VendingMachine m, int coin);
        String select(VendingMachine m, String code);
        String cancel(VendingMachine m);
    }

    static final State IDLE = new Idle();
    static final State HAS_MONEY = new HasMoney();
    static final State OUT_OF_STOCK = new OutOfStock();

    static class Idle implements State {
        public String name() { return "Idle"; }

        public String insert(VendingMachine m, int coin) {
            m.escrow.add(coin);
            m.move(HAS_MONEY);
            return "balance " + m.balance();
        }

        public String select(VendingMachine m, String code) { return "insert coins first"; }

        public String cancel(VendingMachine m) { return "nothing to return"; }
    }

    static class HasMoney implements State {
        public String name() { return "HasMoney"; }

        public String insert(VendingMachine m, int coin) {
            m.escrow.add(coin);
            return "balance " + m.balance();
        }

        public String select(VendingMachine m, String code) {
            Item item = m.items.get(code);
            if (item == null) return "error: no slot " + code;
            if (item.stock == 0) return code + " is sold out";
            int balance = m.balance();
            if (balance < item.price) return "need " + (item.price - balance) + " more";
            int change = balance - item.price;
            m.box.add(m.escrow); // the customer's coins can be part of the change
            int[] pay = m.box.makeChange(change);
            if (pay == null) {
                m.box.remove(m.escrow);
                String back = joined(m.escrow);
                m.escrow.clear();
                m.move(IDLE);
                return "no change for " + change + ", returned " + back;
            }
            m.box.take(pay);
            m.escrow.clear();
            item.stock--;
            m.move(m.anyStock() ? IDLE : OUT_OF_STOCK);
            return "dispensed " + item.name + ", " + (change == 0 ? "no change" : "change " + CoinBox.describe(pay));
        }

        public String cancel(VendingMachine m) {
            String back = joined(m.escrow); // the very coins inserted, held apart until a sale
            m.escrow.clear();
            m.move(IDLE);
            return "returned " + back;
        }
    }

    static class OutOfStock implements State {
        public String name() { return "OutOfStock"; }

        public String insert(VendingMachine m, int coin) { return "sold out, returned " + coin; }

        public String select(VendingMachine m, String code) { return "sold out"; }

        public String cancel(VendingMachine m) { return "nothing to return"; }
    }

    static String joined(List<Integer> coins) {
        StringBuilder sb = new StringBuilder();
        for (int c : coins) sb.append(sb.length() == 0 ? "" : "+").append(c);
        return sb.toString();
    }

    /** The coins the machine holds, counted per denomination (10, 5, 2, 1). */
    static class CoinBox {
        final int[] count = new int[DENOMS.length];

        void add(List<Integer> coins) { for (int c : coins) count[index(c)]++; }

        void remove(List<Integer> coins) { for (int c : coins) count[index(c)]--; }

        void take(int[] pay) { for (int i = 0; i < DENOMS.length; i++) count[i] -= pay[i]; }

        /**
         * The fewest coins the box can pay the amount with, or null. Greedy is not enough once
         * coins run out (6 from one 5 and three 2s is 2+2+2), so try every count of 10s, 5s and 2s,
         * most first: among equally short answers, the one with the most large coins wins.
         */
        int[] makeChange(int amount) {
            int[] best = null;
            int bestCoins = Integer.MAX_VALUE;
            for (int a = Math.min(count[0], amount / 10); a >= 0; a--) {
                int r1 = amount - 10 * a;
                for (int b = Math.min(count[1], r1 / 5); b >= 0; b--) {
                    int r2 = r1 - 5 * b;
                    for (int c = Math.min(count[2], r2 / 2); c >= 0; c--) {
                        int d = r2 - 2 * c;
                        if (d > count[3]) continue;
                        int coins = a + b + c + d;
                        if (coins < bestCoins) {
                            bestCoins = coins;
                            best = new int[] {a, b, c, d};
                        }
                    }
                }
            }
            return best;
        }

        static String describe(int[] pay) {
            List<String> coins = new ArrayList<>();
            for (int i = 0; i < DENOMS.length; i++) for (int k = 0; k < pay[i]; k++) coins.add(String.valueOf(DENOMS[i]));
            return String.join("+", coins);
        }

        public String toString() {
            StringBuilder sb = new StringBuilder("box:");
            for (int i = 0; i < DENOMS.length; i++) sb.append(' ').append(DENOMS[i]).append('x').append(count[i]);
            return sb.toString();
        }

        private static int index(int coin) {
            for (int i = 0; i < DENOMS.length; i++) if (DENOMS[i] == coin) return i;
            throw new IllegalArgumentException("coin " + coin);
        }
    }

    static class VendingMachine {
        static final List<String> ACCEPTED = Arrays.asList("1", "2", "5", "10");

        final Map<String, Item> items = new TreeMap<>();
        final CoinBox box = new CoinBox();
        final List<Integer> escrow = new ArrayList<>(); // inserted, not yet the machine's
        State state = IDLE;

        int balance() {
            int sum = 0;
            for (int c : escrow) sum += c;
            return sum;
        }

        void start() {
            state = anyStock() ? IDLE : OUT_OF_STOCK;
        }

        void move(State next) { state = next; }

        boolean anyStock() {
            for (Item item : items.values()) if (item.stock > 0) return true;
            return false;
        }

        String insert(String coin) {
            if (!ACCEPTED.contains(coin)) return "rejected " + coin;
            return state.insert(this, Integer.parseInt(coin));
        }

        String select(String code) { return state.select(this, code); }

        String cancel() { return state.cancel(this); }
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine().trim());
        VendingMachine machine = new VendingMachine();
        for (int i = 0; i < n; i++) {
            String[] f = br.readLine().trim().split("\\s+");
            Item item = new Item(f[0], f[1], Integer.parseInt(f[2]), Integer.parseInt(f[3]));
            machine.items.put(item.code, item);
        }
        String[] counts = br.readLine().trim().split("\\s+");
        for (int i = 0; i < DENOMS.length; i++) machine.box.count[i] = Integer.parseInt(counts[i]);
        machine.start();
        StringBuilder out = new StringBuilder();
        String line;
        while ((line = br.readLine()) != null) {
            line = line.trim();
            if (line.isEmpty()) continue;
            String[] p = line.split("\\s+");
            String reply;
            switch (p[0]) {
                case "INSERT":
                    reply = machine.insert(p[1]);
                    break;
                case "SELECT":
                    reply = machine.select(p[1]);
                    break;
                case "CANCEL":
                    reply = machine.cancel();
                    break;
                case "STATE":
                    reply = machine.state.name();
                    break;
                case "COINS":
                    reply = machine.box.toString();
                    break;
                default:
                    reply = "error: unknown command " + p[0];
            }
            out.append(reply).append('\n');
        }
        System.out.print(out);
    }
}
`;

const BOX_STARTER = String.raw`import java.io.*;
import java.util.*;

public class Main {
    static final int[] DENOMS = {10, 5, 2, 1};

    // TODO: Item, the State interface with Idle / HasMoney / OutOfStock,
    // a CoinBox (counts per denomination, makeChange with the fewest coins it can pay)
    // and a VendingMachine holding the items, the box, the inserted coins and the state.

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(br.readLine().trim());
        for (int i = 0; i < n; i++) {
            String[] f = br.readLine().trim().split("\\s+"); // code name price stock
            // TODO: add the item
        }
        String[] counts = br.readLine().trim().split("\\s+"); // coins of 10, 5, 2, 1 in the box
        StringBuilder out = new StringBuilder();
        String line;
        while ((line = br.readLine()) != null) {
            line = line.trim();
            if (line.isEmpty()) continue;
            String[] p = line.split("\\s+");
            // TODO: INSERT, SELECT, CANCEL, STATE, COINS
            out.append("error: unknown command ").append(p[0]).append('\n');
        }
        System.out.print(out);
    }
}
`;

const SLOTS = `The first line is the number of slots \`n\`; each of the next \`n\` lines is \`<code> <name> <price> <stock>\` (single words, whole numbers). The machine accepts coins of 1, 2, 5 and 10.`;

const BASE_TABLE = `| Command | Prints |
| --- | --- |
| \`INSERT <coin>\` | not 1, 2, 5 or 10: \`rejected <coin>\` (in any state). Idle → \`balance <b>\` and HasMoney; HasMoney → \`balance <b>\`; OutOfStock → \`sold out, returned <coin>\` |
| \`SELECT <code>\` | Idle → \`insert coins first\`; OutOfStock → \`sold out\`; HasMoney → \`error: no slot <code>\`, \`<code> is sold out\`, \`need <k> more\`, or \`dispensed <name>, change <coins>\` / \`dispensed <name>, no change\` |
| \`CANCEL\` | HasMoney → \`returned <coins>\` and Idle; otherwise \`nothing to return\` |
| \`STATE\` | \`Idle\`, \`HasMoney\` or \`OutOfStock\` |`;

const STATES = `The machine starts in **Idle**, or in **OutOfStock** if every slot is empty. After a sale it moves to Idle — or to OutOfStock when that sale emptied the last slot. A refused selection keeps the balance.`;

export default defineModule(import.meta.url, {
  slug: "vending-machine",
  title: "Vending machine",
  blurb: "The State pattern with Idle, HasMoney and OutOfStock, greedy change, sold-out slots and restocking — then change from the coins actually in the box.",
  icon: "branch",
  overview: `A vending machine is the textbook case for the State pattern: the same coin or button means something different depending on what the machine is doing. Instead of an if-chain on a status field in every method, each state is a class that answers every event and decides the next state.

You will code the state machine with greedy change, then add inventory: sales per slot, restocking that brings the machine back from OutOfStock, and a report. The checkpoint makes change from a coin box with a limited number of each coin — where greedy fails and a search is needed — and refunds the very coins inserted. Hidden cases run a machine that starts empty, rejected coins, a sold-out slot beside a full one, and change that cannot be made.

It is the practice half of the note [Design a Vending Machine](/notes/low-level-design/design-a-vending-machine).`,
  lessons: [
    {
      slug: "vending-machine-design",
      file: "01-vending-machine-design.md",
      exercises: [
        {
          title: "The state machine",
          prompt: `Model a vending machine with the **State pattern**: a \`State\` interface implemented by \`Idle\`, \`HasMoney\` and \`OutOfStock\`, and a machine that hands every event to its current state. ${SLOTS} Then events, one per line:

${BASE_TABLE}
| anything else | \`error: unknown command <WORD>\` |

${STATES} Change and refunds are paid greedily — the largest coin that fits, again and again — and printed largest first joined with \`+\` (\`10+5+2+2\`).`,
          starter: STATE_STARTER,
          solution: STATE_SOLUTION,
          hints: [
            "Each state class answers every event; transitions are machine.move(next) calls made inside the states.",
            "Check the coin before handing it to the state: a rejected coin never reaches Idle or HasMoney.",
            "After a sale ask machine.anyStock() to choose between Idle and OutOfStock.",
          ],
          cases: [
            { stdin: "2\nA1 chips 15 1\nA2 soda 12 2\nSELECT A1\nINSERT 10\nSELECT A1\nINSERT 10\nSELECT A1\nSTATE\n", expected: "insert coins first\nbalance 10\nneed 5 more\nbalance 20\ndispensed chips, change 5\nIdle\n" },
            {
              stdin: "2\nA1 gum 3 1\nB1 mint 8 0\nINSERT 5\nSELECT B1\nSELECT C9\nSELECT A1\nSTATE\nINSERT 2\nSELECT A1\nCANCEL\n",
              expected: "balance 5\nB1 is sold out\nerror: no slot C9\ndispensed gum, change 2\nOutOfStock\nsold out, returned 2\nsold out\nnothing to return\n",
              hidden: true,
            },
            {
              stdin: "1\nA1 tea 18 3\nINSERT 3\nINSERT 20\nSTATE\nINSERT 10\nINSERT 5\nINSERT 2\nINSERT 1\nCANCEL\nSTATE\nINSERT 10\nINSERT 5\nINSERT 2\nINSERT 1\nSELECT A1\nHACK\n",
              expected: "rejected 3\nrejected 20\nIdle\nbalance 10\nbalance 15\nbalance 17\nbalance 18\nreturned 10+5+2+1\nIdle\nbalance 10\nbalance 15\nbalance 17\nbalance 18\ndispensed tea, no change\nerror: unknown command HACK\n",
              hidden: true,
            },
            { stdin: "1\nZ1 cake 7 0\nSTATE\nINSERT 10\nSELECT Z1\n", expected: "OutOfStock\nsold out, returned 10\nsold out\n", hidden: true },
            {
              stdin: "1\nA1 pen 1 2\nINSERT 10\nINSERT 10\nSELECT A1\nSTATE\nINSERT 10\nINSERT 10\nSELECT A1\nSTATE\n",
              expected: "balance 10\nbalance 20\ndispensed pen, change 10+5+2+2\nIdle\nbalance 10\nbalance 20\ndispensed pen, change 10+5+2+2\nOutOfStock\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Inventory and restocking",
          prompt: `Extend the state machine with inventory. ${SLOTS} Every event of the first program works as before:

${BASE_TABLE}

and three maintenance commands are added — they work in **any** state:

| Command | Prints |
| --- | --- |
| \`REFILL <code> <count>\` | \`<code> stock <new stock>\`, or \`error: no slot <code>\`. In OutOfStock, the machine moves to Idle once any slot has stock again (a refill of 0 keeps it OutOfStock); in other states the state is kept. |
| \`REPORT\` | one line per slot, in code order: \`<code> <name>: stock <s>, sold <k>\` |
| \`TOTAL\` | \`revenue <sum of the prices of every item sold>\` |
| anything else | \`error: unknown command <WORD>\` |

${STATES} Change and refunds are greedy, printed largest first joined with \`+\`.`,
          starter: STOCK_STARTER,
          solution: STOCK_SOLUTION,
          hints: [
            "Count sales on the Item, where the stock already lives; revenue is a running total on the machine.",
            "Keep the items in a TreeMap and REPORT is one walk over its values.",
            "Refilling is maintenance, not a customer event, so the machine handles it — but it may still end OutOfStock.",
          ],
          cases: [
            {
              stdin: "2\nB2 water 10 1\nA1 chips 15 0\nINSERT 10\nSELECT B2\nSTATE\nREFILL A1 2\nSTATE\nINSERT 10\nINSERT 5\nSELECT A1\nREPORT\nTOTAL\n",
              expected: "balance 10\ndispensed water, no change\nOutOfStock\nA1 stock 2\nIdle\nbalance 10\nbalance 15\ndispensed chips, no change\nA1 chips: stock 1, sold 1\nB2 water: stock 0, sold 1\nrevenue 25\n",
            },
            {
              stdin: "2\nA1 nuts 6 0\nA2 cola 9 1\nINSERT 5\nREFILL A1 1\nSTATE\nREFILL Q1 3\nINSERT 2\nSELECT A1\nSELECT A2\nINSERT 10\nSELECT A2\nTOTAL\n",
              expected: "balance 5\nA1 stock 1\nHasMoney\nerror: no slot Q1\nbalance 7\ndispensed nuts, change 1\ninsert coins first\nbalance 10\ndispensed cola, change 1\nrevenue 15\n",
              hidden: true,
            },
            {
              stdin: "3\nC3 gum 2 0\nA1 tea 4 0\nB2 bun 5 0\nSTATE\nREFILL A1 0\nSTATE\nREFILL B2 3\nSTATE\nINSERT 5\nCANCEL\nINSERT 5\nSELECT B2\nSELECT B2\nREPORT\nTOTAL\n",
              expected: "OutOfStock\nA1 stock 0\nOutOfStock\nB2 stock 3\nIdle\nbalance 5\nreturned 5\nbalance 5\ndispensed bun, no change\ninsert coins first\nA1 tea: stock 0, sold 0\nB2 bun: stock 2, sold 1\nC3 gum: stock 0, sold 0\nrevenue 5\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Why model a vending machine with the State pattern instead of a `status` field and if-else?",
          options: ["It runs faster", "Each state answers every event in one class, so a new state is a new class instead of a new branch in every method", "Java has no switch on strings", "It removes the need for a balance"],
          answer: 1,
          explanation: "With a status field, every event method grows a branch per status, and adding Maintenance edits all of them. With State, the behaviour for one state is together and transitions are explicit.",
        },
        {
          prompt: "The machine is OutOfStock and a customer inserts a 10. What should happen?",
          options: ["Balance 10, move to HasMoney", "The coin is returned at once", "The coin is kept", "The machine crashes"],
          answer: 1,
          explanation: "OutOfStock cannot finish a sale, so it must not start one: it returns the coin. That is exactly the kind of rule that lives in the state's own `insert`.",
        },
        {
          prompt: "Greedy change for 19 with coins 10, 5, 2, 1 gives:",
          options: ["10+5+2+2", "10+5+4", "10+9", "5+5+5+2+2"],
          answer: 0,
          explanation: "Take 10 (9 left), 5 (4 left), 2 (2 left), 2 (0 left): four coins, the fewest possible for this canonical set.",
        },
        {
          prompt: "A customer has 10 in and selects an item costing 15. What does HasMoney do?",
          options: ["Dispense and owe 5", "Refuse with \"need 5 more\" and keep the balance and the state", "Refund 10 and go Idle", "Move to OutOfStock"],
          answer: 1,
          explanation: "An underpaid selection is refused without losing the money: the balance stays and the machine stays in HasMoney, waiting for more coins or a cancel.",
        },
      ],
    },
    {
      slug: "vending-machine-checkpoint",
      file: "02-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "Change from a real coin box",
          prompt: `A real machine pays change from the coins it holds. ${SLOTS} The next line is the coin box: how many coins of 10, 5, 2 and 1 it holds, in that order. Then events.

Inserted coins are held **apart** (in escrow) until a sale: \`CANCEL\` returns those very coins in the order inserted, joined with \`+\`. On a paid selection the inserted coins go into the box, and the change is paid with **the fewest coins the box can make it with** — among equally few, the one with the most 10s, then 5s, then 2s. If no combination of the box's coins makes the change, the sale is refused: the inserted coins come back out of the box and are returned, the item stays, and the machine is Idle.

| Command | Prints |
| --- | --- |
| \`INSERT <coin>\` | \`rejected <coin>\` if not 1, 2, 5 or 10; Idle/HasMoney → \`balance <b>\`; OutOfStock → \`sold out, returned <coin>\` |
| \`SELECT <code>\` | Idle → \`insert coins first\`; OutOfStock → \`sold out\`; HasMoney → \`error: no slot <code>\`, \`<code> is sold out\`, \`need <k> more\`, \`no change for <amount>, returned <coins inserted>\`, or \`dispensed <name>, change <coins, largest first>\` / \`dispensed <name>, no change\` |
| \`CANCEL\` | HasMoney → \`returned <coins inserted>\`; otherwise \`nothing to return\` |
| \`STATE\` | \`Idle\`, \`HasMoney\` or \`OutOfStock\` |
| \`COINS\` | \`box: 10x<a> 5x<b> 2x<c> 1x<d>\` |
| anything else | \`error: unknown command <WORD>\` |

The machine starts Idle, or OutOfStock if every slot is empty; a sale that empties the last slot moves it to OutOfStock.`,
          starter: BOX_STARTER,
          solution: BOX_SOLUTION,
          hints: [
            "Greedy fails with limited coins: 6 from one 5 and three 2s needs 2+2+2. With four denominations and small amounts, trying every count of 10s, 5s and 2s is fast enough.",
            "Put the escrow into the box before making change — the customer's own coins can be part of it — and take them back out if the change cannot be made.",
          ],
          cases: [
            { stdin: "1\nA1 chips 4 5\n0 1 3 0\nINSERT 10\nSELECT A1\nCOINS\n", expected: "balance 10\ndispensed chips, change 2+2+2\nbox: 10x1 5x1 2x0 1x0\n" },
            {
              stdin: "1\nA1 cola 7 2\n0 0 0 0\nINSERT 5\nINSERT 5\nSELECT A1\nSTATE\nCOINS\nINSERT 5\nINSERT 2\nSELECT A1\nCOINS\n",
              expected: "balance 5\nbalance 10\nno change for 3, returned 5+5\nIdle\nbox: 10x0 5x0 2x0 1x0\nbalance 5\nbalance 7\ndispensed cola, no change\nbox: 10x0 5x1 2x1 1x0\n",
              hidden: true,
            },
            {
              stdin: "1\nA1 pie 3 1\n0 0 0 2\nINSERT 2\nINSERT 2\nINSERT 2\nCANCEL\nINSERT 2\nINSERT 2\nINSERT 2\nSELECT A1\nCOINS\nSTATE\nINSERT 1\n",
              expected: "balance 2\nbalance 4\nbalance 6\nreturned 2+2+2\nbalance 2\nbalance 4\nbalance 6\ndispensed pie, change 2+1\nbox: 10x0 5x0 2x2 1x1\nOutOfStock\nsold out, returned 1\n",
              hidden: true,
            },
            {
              stdin: "2\nA1 jam 12 1\nA2 oat 6 0\n10 1 0 0\nINSERT 10\nSELECT A2\nSELECT A1\nINSERT 5\nSELECT A1\nCOINS\n",
              expected: "balance 10\nA2 is sold out\nneed 2 more\nbalance 15\nno change for 3, returned 10+5\nbox: 10x10 5x1 2x0 1x0\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "In the State pattern, who decides the next state after an event?",
          options: ["The caller (main)", "The current state object, by calling machine.move(next)", "A global switch statement", "The Item"],
          answer: 1,
          explanation: "Each state knows where its events lead, so transitions live with the behaviour. A machine that sets its own state from outside the states is the if-chain again.",
        },
        {
          prompt: "Why can the states be shared singletons (`IDLE`, `HAS_MONEY`)?",
          options: ["Java requires it", "They hold no data of their own — the balance and items live on the machine they are passed", "To make the machine thread-safe", "Because there is only one machine"],
          answer: 1,
          explanation: "A stateless state object can serve every machine. If a state needed its own data (a timer, say), each machine would create its own instance instead.",
        },
        {
          prompt: "The box holds one 5 and three 2s, and the change due is 6. What does greedy-from-the-box do, and what is right?",
          options: ["Both pay 5+1", "Greedy takes the 5 and is stuck needing 1; the right answer is 2+2+2", "Both pay 2+2+2", "Neither can pay"],
          answer: 1,
          explanation: "Greedy is optimal for unlimited canonical coins, not for a limited box. Searching the combinations finds 2+2+2.",
        },
        {
          prompt: "Why hold inserted coins in escrow instead of dropping them straight into the box?",
          options: ["To count them faster", "So a cancel or a refused sale returns the very coins the customer put in", "Escrow is required by law", "To avoid the State pattern"],
          answer: 1,
          explanation: "Until a sale completes, the coins are still the customer's. Keeping them apart makes a refund exact and keeps the box's count true.",
        },
        {
          prompt: "A sale empties the last item in the machine. Which state comes next?",
          options: ["Idle", "HasMoney", "OutOfStock", "Dispensing forever"],
          answer: 2,
          explanation: "With nothing left to sell, the machine moves to OutOfStock, where coins are returned at once. A refill moves it back to Idle.",
        },
        {
          prompt: "A slot is sold out but others have stock. A customer with money selects the sold-out slot. What happens?",
          options: ["The machine moves to OutOfStock", "The selection is refused and the balance stays in HasMoney", "The money is refunded", "Another item is dispensed"],
          answer: 1,
          explanation: "A sold-out slot is not a sold-out machine. HasMoney refuses that one selection and waits for another choice or a cancel.",
        },
        {
          prompt: "You need a Maintenance state in which every customer event is refused. What changes?",
          options: ["Every existing state class", "One new class implementing State, plus the transitions into and out of it", "The Item class", "Nothing can be added"],
          answer: 1,
          explanation: "That is the open-closed payoff of the State pattern: the new behaviour is a new class, and the existing states change only where they transition into it.",
        },
        {
          prompt: "Where should the check \"is this a coin the machine accepts?\" live?",
          options: ["In every state's insert", "Once, in the machine, before the event reaches any state", "In main only", "In the CoinBox's toString"],
          answer: 1,
          explanation: "A foreign coin is rejected whatever the state, so the check belongs before the delegation — one place instead of three copies.",
        },
        {
          prompt: "Greedy change is guaranteed optimal for which coin set?",
          options: ["4, 3, 1", "10, 5, 2, 1", "Any set containing 1", "Any set at all"],
          answer: 1,
          explanation: "10, 5, 2, 1 is a canonical system, where greedy always gives the fewest coins. For 4, 3, 1, greedy pays 6 as 4+1+1 although 3+3 is shorter.",
        },
        {
          prompt: "Is Dispensing needed as its own state in a single-threaded program like this one?",
          options: ["Yes, always", "Not here — the sale completes within one call; in a real machine, events can arrive while the motor turns, so it is needed there", "No state is needed", "Only for refunds"],
          answer: 1,
          explanation: "A state exists to answer events differently. If no event can arrive during dispensing, the state would never answer one; on real hardware, it must refuse coins mid-sale.",
        },
      ],
    },
  ],
});
