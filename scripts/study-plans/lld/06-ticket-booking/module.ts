import { defineModule } from "../../dsl.js";
import more from "./more-exercises.js";

/**
 * Movie ticket booking (content/notes/low-level-design/
 * design-a-movie-ticket-booking-system): seat holds that expire and payments
 * that confirm or release, then pricing as a Strategy, then — in the
 * checkpoint — the race for one seat decided by optimistic versions. Time
 * is the script's own clock (`TICK n`), never the machine's, so a hold's
 * expiry is part of the input and the output is reproducible.
 */

const HOLDS_STARTER = String.raw`import java.io.*;
import java.util.*;

public class Main {
    enum Status { AVAILABLE, HELD, BOOKED }

    /** One seat for one show: all the state lives here, not on the physical seat. */
    static class ShowSeat {
        final String id;
        Status status = Status.AVAILABLE;
        String holder;
        int heldUntil;

        ShowSeat(String id) { this.id = id; }

        /** A HELD seat whose hold has run out reads as available. */
        boolean availableAt(int now) {
            // TODO
            return false;
        }
    }

    static class Show {
        final int holdMinutes;
        final int rows;
        final int cols;
        final Map<String, ShowSeat> seats = new LinkedHashMap<>(); // layout order: A1, A2, ..., B1, ...
        int now = 0;

        Show(int rows, int cols, int holdMinutes) {
            this.rows = rows; this.cols = cols; this.holdMinutes = holdMinutes;
            for (int r = 0; r < rows; r++)
                for (int c = 1; c <= cols; c++) {
                    String id = (char) ('A' + r) + String.valueOf(c);
                    seats.put(id, new ShowSeat(id));
                }
        }

        String hold(String user, List<String> ids) {
            // TODO: check every seat first (no such seat / held / booked), then hold them all
            return "";
        }

        String pay(String user, boolean ok) {
            // TODO: the user's still-held seats, in layout order: book them or release them
            return "";
        }

        String show() {
            // TODO: "t=N" then one line per row, "A: . H X"
            return "";
        }
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String[] first = br.readLine().trim().split("\\s+");
        Show show = new Show(Integer.parseInt(first[0]), Integer.parseInt(first[1]), Integer.parseInt(first[2]));
        StringBuilder out = new StringBuilder();
        String line;
        while ((line = br.readLine()) != null) {
            line = line.trim();
            if (line.isEmpty()) continue;
            String[] p = line.split("\\s+");
            switch (p[0]) {
                case "HOLD" -> out.append(show.hold(p[1], Arrays.asList(p).subList(2, p.length))).append('\n');
                case "PAY" -> out.append(show.pay(p[1], p[2].equals("ok"))).append('\n');
                case "TICK" -> show.now += Integer.parseInt(p[1]);
                case "SHOW" -> out.append(show.show()).append('\n');
                default -> { }
            }
        }
        System.out.print(out);
    }
}
`;

const HOLDS_SOLUTION = String.raw`import java.io.*;
import java.util.*;

public class Main {
    enum Status { AVAILABLE, HELD, BOOKED }

    /** One seat for one show: all the state lives here, not on the physical seat. */
    static class ShowSeat {
        final String id;
        Status status = Status.AVAILABLE;
        String holder;
        int heldUntil;

        ShowSeat(String id) { this.id = id; }

        // The expiry is read, never fired: a lapsed hold is simply available.
        boolean availableAt(int now) {
            return status == Status.AVAILABLE || (status == Status.HELD && now >= heldUntil);
        }

        boolean heldBy(String user, int now) {
            return status == Status.HELD && now < heldUntil && holder.equals(user);
        }

        void release() { status = Status.AVAILABLE; holder = null; }
    }

    static class Show {
        final int holdMinutes;
        final int rows;
        final int cols;
        final Map<String, ShowSeat> seats = new LinkedHashMap<>(); // layout order: A1, A2, ..., B1, ...
        int now = 0;

        Show(int rows, int cols, int holdMinutes) {
            this.rows = rows; this.cols = cols; this.holdMinutes = holdMinutes;
            for (int r = 0; r < rows; r++)
                for (int c = 1; c <= cols; c++) {
                    String id = (char) ('A' + r) + String.valueOf(c);
                    seats.put(id, new ShowSeat(id));
                }
        }

        String hold(String user, List<String> ids) {
            // All or none: every seat is checked before any is changed.
            for (String id : ids) {
                ShowSeat s = seats.get(id);
                if (s == null) return user + " cannot hold " + id + ": no such seat";
                if (!s.availableAt(now)) return user + " cannot hold " + id + ": " + (s.status == Status.BOOKED ? "booked" : "held");
            }
            for (String id : ids) {
                ShowSeat s = seats.get(id);
                s.status = Status.HELD;
                s.holder = user;
                s.heldUntil = now + holdMinutes;
            }
            return user + " holds " + String.join(" ", ids) + " until t=" + (now + holdMinutes);
        }

        String pay(String user, boolean ok) {
            List<String> mine = new ArrayList<>();
            for (ShowSeat s : seats.values()) {
                if (!s.heldBy(user, now)) continue;
                mine.add(s.id);
                if (ok) s.status = Status.BOOKED;
                else s.release();
            }
            if (mine.isEmpty()) return user + " has no active hold";
            return ok ? user + " booked " + String.join(" ", mine) : user + " payment failed, released " + String.join(" ", mine);
        }

        String show() {
            StringBuilder b = new StringBuilder("t=" + now);
            List<ShowSeat> all = new ArrayList<>(seats.values());
            for (int r = 0; r < rows; r++) {
                b.append('\n').append((char) ('A' + r)).append(':');
                for (int c = 0; c < cols; c++) {
                    ShowSeat s = all.get(r * cols + c);
                    b.append(' ').append(s.status == Status.BOOKED ? 'X' : s.availableAt(now) ? '.' : 'H');
                }
            }
            return b.toString();
        }
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String[] first = br.readLine().trim().split("\\s+");
        Show show = new Show(Integer.parseInt(first[0]), Integer.parseInt(first[1]), Integer.parseInt(first[2]));
        StringBuilder out = new StringBuilder();
        String line;
        while ((line = br.readLine()) != null) {
            line = line.trim();
            if (line.isEmpty()) continue;
            String[] p = line.split("\\s+");
            switch (p[0]) {
                case "HOLD" -> out.append(show.hold(p[1], Arrays.asList(p).subList(2, p.length))).append('\n');
                case "PAY" -> out.append(show.pay(p[1], p[2].equals("ok"))).append('\n');
                case "TICK" -> show.now += Integer.parseInt(p[1]);
                case "SHOW" -> out.append(show.show()).append('\n');
                default -> { }
            }
        }
        System.out.print(out);
    }
}
`;

const RACE_STARTER = String.raw`import java.io.*;
import java.util.*;

public class Main {
    enum Status { AVAILABLE, HELD, BOOKED }

    static class ShowSeat {
        final String id;
        Status status = Status.AVAILABLE;
        String holder;
        int version = 0; // raised by every change of status

        ShowSeat(String id) { this.id = id; }
    }

    static class Show {
        final Map<String, ShowSeat> seats = new LinkedHashMap<>();
        /** What each buyer last read: "user seat" -> version. */
        final Map<String, Integer> reads = new HashMap<>();

        // TODO: read, hold (only if the version is still the one read), book, release, show
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        Show show = new Show();
        for (String id : br.readLine().trim().split("\\s+")) show.seats.put(id, new ShowSeat(id));
        StringBuilder out = new StringBuilder();
        String line;
        while ((line = br.readLine()) != null) {
            line = line.trim();
            if (line.isEmpty()) continue;
            String[] p = line.split("\\s+");
            // TODO: READ / HOLD / BOOK / RELEASE user seat, and SHOW
        }
        System.out.print(out);
    }
}
`;

const RACE_SOLUTION = String.raw`import java.io.*;
import java.util.*;

public class Main {
    enum Status { AVAILABLE, HELD, BOOKED }

    static class ShowSeat {
        final String id;
        Status status = Status.AVAILABLE;
        String holder;
        int version = 0; // raised by every change of status

        ShowSeat(String id) { this.id = id; }

        void change(Status to, String who) { status = to; holder = who; version++; }
    }

    static class Show {
        final Map<String, ShowSeat> seats = new LinkedHashMap<>();
        /** What each buyer last read: "user seat" -> version. */
        final Map<String, Integer> reads = new HashMap<>();

        String read(String user, ShowSeat s) {
            reads.put(user + " " + s.id, s.version);
            return user + " reads " + s.id + ": " + s.status + " v" + s.version;
        }

        // The conditional write: UPDATE ... SET status = HELD, version = version + 1 WHERE id = ? AND version = ?
        String hold(String user, ShowSeat s) {
            Integer seen = reads.get(user + " " + s.id);
            if (seen == null) return user + " must read " + s.id + " first";
            if (seen != s.version) return user + " lost " + s.id + ": version is " + s.version + ", read " + seen;
            if (s.status != Status.AVAILABLE) return user + " cannot hold " + s.id + ": " + s.status;
            s.change(Status.HELD, user);
            return user + " holds " + s.id + " v" + s.version;
        }

        String book(String user, ShowSeat s) {
            if (s.status != Status.HELD || !s.holder.equals(user)) return user + " does not hold " + s.id;
            s.change(Status.BOOKED, user);
            return user + " booked " + s.id + " v" + s.version;
        }

        String release(String user, ShowSeat s) {
            if (s.status != Status.HELD || !s.holder.equals(user)) return user + " does not hold " + s.id;
            s.change(Status.AVAILABLE, null);
            return user + " released " + s.id + " v" + s.version;
        }

        String show() {
            StringJoiner j = new StringJoiner(", ");
            for (ShowSeat s : seats.values()) j.add(s.id + " " + s.status + " v" + s.version);
            return j.toString();
        }
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        Show show = new Show();
        for (String id : br.readLine().trim().split("\\s+")) show.seats.put(id, new ShowSeat(id));
        StringBuilder out = new StringBuilder();
        String line;
        while ((line = br.readLine()) != null) {
            line = line.trim();
            if (line.isEmpty()) continue;
            String[] p = line.split("\\s+");
            if (p[0].equals("SHOW")) { out.append(show.show()).append('\n'); continue; }
            ShowSeat s = show.seats.get(p[2]);
            if (s == null) { out.append("no such seat ").append(p[2]).append('\n'); continue; }
            String said = switch (p[0]) {
                case "READ" -> show.read(p[1], s);
                case "HOLD" -> show.hold(p[1], s);
                case "BOOK" -> show.book(p[1], s);
                case "RELEASE" -> show.release(p[1], s);
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
    slug: "ticket-booking",
    title: "Movie ticket booking",
    blurb: "Seat holds that expire, payments that confirm or release, pricing as a Strategy, and the race for one seat settled by versions, in Java.",
    icon: "grid",
    overview: `A booking system sells something that runs out: one seat, one show, one buyer. The machine-coding problem (BookMyShow, in most rounds) is less about the many entities than about one of them, the ShowSeat, and the rules for moving it between available, held and booked.

You will build those rules as commands. Holds take all the chosen seats or none and expire after a fixed time; a payment books what is still held or releases it at once; a lapsed hold reads as available without any timer. Then the second program adds seat categories and a pricing rule chosen per show, a Strategy the booking code never looks inside. The checkpoint stages the race itself: two buyers read the same seat, and a version number decides which write wins.

Time is the script's own clock, so every case is reproducible. The full design, including the database locks, is in the [movie ticket booking note](/notes/low-level-design/design-a-movie-ticket-booking-system).`,
    lessons: [
      {
        slug: "ticket-booking-design",
        file: "01-ticket-booking-design.md",
        exercises: [
          {
            title: "Holds that expire",
            prompt: `Model one show's seats with holds and payments.

**Input.** The first line is \`rows cols hold\`: rows are lettered \`A\`, \`B\`, … and seats numbered \`1\` to \`cols\` (\`A1\`, \`A2\`, …), and a hold lasts \`hold\` minutes. The clock starts at \`t=0\`. Then one command per line:

- \`HOLD user s1 s2 …\`: all or none. Check the seats in the order given and stop at the first problem: \`user cannot hold S: no such seat\`, \`: booked\` or \`: held\` (held by anyone, the same user included, and not lapsed). If every seat is free, hold them all until \`now + hold\` and print \`user holds s1 s2 … until t=T\` (seats in the order given).
- \`PAY user ok\` or \`PAY user fail\`: applies to every seat the user still holds (a hold is valid while \`now < heldUntil\`), taken in layout order. \`ok\` books them: \`user booked A1 B2\`. \`fail\` releases them at once: \`user payment failed, released A1 B2\`. With no such seats: \`user has no active hold\`.
- \`TICK n\`: the clock moves on \`n\` minutes. Prints nothing.
- \`SHOW\`: \`t=N\`, then one line per row such as \`A: . H X .\`, where \`.\` is available (a lapsed hold included), \`H\` held and \`X\` booked.

Seats in one command are distinct.

**Example**

\`\`\`
1 3 5
HOLD alice A1 A2
HOLD bob A2 A3
PAY alice ok
SHOW
\`\`\`
prints
\`\`\`
alice holds A1 A2 until t=5
bob cannot hold A2: held
alice booked A1 A2
t=0
A: X X .
\`\`\``,
            starter: HOLDS_STARTER,
            solution: HOLDS_SOLUTION,
            hints: [
              "Write availableAt(now): AVAILABLE, or HELD with now >= heldUntil. Every check goes through it, so no timer is needed.",
              "In hold, loop over the seats twice: once to find a problem, once to change them. Never change a seat in the first loop.",
              "In pay, walk the seats in layout order and pick those held by this user with now < heldUntil.",
            ],
            cases: [
              {
                stdin: "1 4 5\nHOLD alice A1 A2\nHOLD bob A2 A3\nTICK 2\nPAY alice fail\nHOLD bob A2 A3\nTICK 1\nPAY bob ok\nHOLD carol A1\nTICK 5\nSHOW\nHOLD dave A1\nSHOW\n",
                expected:
                  "alice holds A1 A2 until t=5\nbob cannot hold A2: held\nalice payment failed, released A1 A2\nbob holds A2 A3 until t=7\nbob booked A2 A3\ncarol holds A1 until t=8\nt=8\nA: . X X .\ndave holds A1 until t=13\nt=8\nA: H X X .\n",
              },
              {
                stdin: "2 3 4\nHOLD ann B2 A1\nHOLD raj A1\nHOLD raj C1\nPAY ann ok\nHOLD raj B2\nTICK 3\nHOLD raj A2 A3\nTICK 4\nPAY raj ok\nSHOW\nPAY zoe ok\n",
                expected:
                  "ann holds B2 A1 until t=4\nraj cannot hold A1: held\nraj cannot hold C1: no such seat\nann booked A1 B2\nraj cannot hold B2: booked\nraj holds A2 A3 until t=7\nraj has no active hold\nt=7\nA: X . .\nB: . X .\nzoe has no active hold\n",
                hidden: true,
              },
              {
                stdin: "1 3 2\nHOLD mia A1 A2\nTICK 1\nHOLD leo A2\nTICK 1\nHOLD leo A2\nHOLD mia A1\nPAY mia ok\nPAY leo fail\nSHOW\n",
                expected: "mia holds A1 A2 until t=2\nleo cannot hold A2: held\nleo holds A2 until t=4\nmia holds A1 until t=4\nmia booked A1\nleo payment failed, released A2\nt=2\nA: X . .\n",
                hidden: true,
              },
            ],
          },
        ],
        quiz: [
          {
            prompt: "Where should a seat's status (available, held, booked) live?",
            options: ["On Seat, the physical seat", "On ShowSeat, one per seat per show", "On Booking only", "On Cinema, as a map of every seat"],
            answer: 1,
            explanation:
              "A seat is booked for one show, not for ever: A1 at 6 pm and A1 at 9 pm are different things to sell. ShowSeat is that pair, so status, holder and expiry live there. Seat stays physical and never changes.",
          },
          {
            prompt: "bob asks to hold A2 and A3. A3 is free but A2 is held by alice. What should happen?",
            options: ["bob holds A3 only", "Nothing changes: the hold is all or none", "bob holds both and alice loses A2", "bob waits until alice pays"],
            answer: 1,
            explanation:
              "A buyer who asked for two seats together does not want one of them, so a hold checks every seat first and changes none if any is taken. Taking A3 alone would leave a half-done booking to clean up.",
          },
          {
            prompt: "How does a hold expire in the exercise's design?",
            options: [
              "A thread sleeps for the hold time, then releases the seat",
              "heldUntil is stored on the seat, and a HELD seat past it reads as available",
              "A cleanup job runs every minute and is required for correctness",
              "The buyer's browser releases it",
            ],
            answer: 1,
            explanation:
              "Storing the expiry and comparing it whenever the seat is read needs no timer and makes the behaviour depend only on the clock's value. A cleanup job can still tidy rows, but correctness never waits for it.",
          },
          {
            prompt: "alice's card is declined while her seats are held until t=5. When can others take them?",
            options: ["At t=5, when the hold runs out", "At once: a failed payment releases the hold", "Never: declined seats are blocked for the show", "Only after an admin frees them"],
            answer: 1,
            explanation:
              "The hold exists to cover the payment. Once the payment has failed there is nothing to wait for, so the seats go back immediately; keeping them held to t=5 just turns away other buyers.",
          },
        ],
      },
      {
        slug: "ticket-booking-checkpoint",
        file: "02-checkpoint.md",
        kind: "test",
        passMark: 70,
        exercises: [
          {
            title: "Two buyers, one seat",
            prompt: `Decide races for seats with **optimistic locking**: every seat has a version, every change of status raises it by one, and a hold is a conditional write that succeeds only if the version is still the one the buyer read.

**Input.** The first line lists the seat ids. Then one command per line:

- \`READ user S\`: the buyer reads the seat; remember the version they saw (a later read replaces it). Print \`user reads S: STATUS vN\`.
- \`HOLD user S\`: if the user never read \`S\`, print \`user must read S first\`. If the seat's version differs from the one they read, print \`user lost S: version is N, read M\`. If the versions match but the seat is not \`AVAILABLE\`, print \`user cannot hold S: STATUS\`. Otherwise it becomes \`HELD\` by the user: \`user holds S vN\` with the new version.
- \`BOOK user S\`: if the user holds it, it becomes \`BOOKED\`: \`user booked S vN\`.
- \`RELEASE user S\`: if the user holds it, it becomes \`AVAILABLE\`: \`user released S vN\`.
  For both, a seat the user does not hold prints \`user does not hold S\`.
- \`SHOW\`: every seat in the order listed: \`A1 AVAILABLE v0, A2 BOOKED v4\`.

A seat id that is not listed prints \`no such seat S\` for any command.

**Example**

\`\`\`
A1 A2
READ alice A2
READ bob A2
HOLD alice A2
HOLD bob A2
\`\`\`
prints
\`\`\`
alice reads A2: AVAILABLE v0
bob reads A2: AVAILABLE v0
alice holds A2 v1
bob lost A2: version is 1, read 0
\`\`\``,
            starter: RACE_STARTER,
            solution: RACE_SOLUTION,
            hints: [
              "Give ShowSeat one method that changes status and raises the version, and use it for every change.",
              "Store reads in a map keyed by user and seat; HOLD compares that number with the seat's version before anything else about status.",
              "A buyer's own successful hold raises the version, so their old read is stale too: a second HOLD loses.",
            ],
            cases: [
              {
                stdin: "A1 A2 A3\nREAD alice A2\nREAD bob A2\nHOLD alice A2\nHOLD bob A2\nREAD bob A2\nHOLD bob A2\nRELEASE alice A2\nREAD bob A2\nHOLD bob A2\nBOOK bob A2\nSHOW\n",
                expected:
                  "alice reads A2: AVAILABLE v0\nbob reads A2: AVAILABLE v0\nalice holds A2 v1\nbob lost A2: version is 1, read 0\nbob reads A2: HELD v1\nbob cannot hold A2: HELD\nalice released A2 v2\nbob reads A2: AVAILABLE v2\nbob holds A2 v3\nbob booked A2 v4\nA1 AVAILABLE v0, A2 BOOKED v4, A3 AVAILABLE v0\n",
              },
              {
                stdin: "B1 B2\nHOLD carl B1\nREAD carl B9\nBOOK carl B7\nREAD carl B1\nBOOK carl B1\nHOLD carl B1\nHOLD carl B1\nBOOK dina B1\nRELEASE dina B1\nBOOK carl B1\nREAD dina B1\nHOLD dina B1\nSHOW\n",
                expected:
                  "carl must read B1 first\nno such seat B9\nno such seat B7\ncarl reads B1: AVAILABLE v0\ncarl does not hold B1\ncarl holds B1 v1\ncarl lost B1: version is 1, read 0\ndina does not hold B1\ndina does not hold B1\ncarl booked B1 v2\ndina reads B1: BOOKED v2\ndina cannot hold B1: BOOKED\nB1 BOOKED v2, B2 AVAILABLE v0\n",
                hidden: true,
              },
            ],
          },
        ],
        quiz: [
          {
            prompt: "alice and bob both read seat A2 at version 0. alice's conditional hold lands first. What does bob's `UPDATE … WHERE id = 'A2' AND version = 0` do?",
            options: ["Holds A2 for bob as well", "Changes 0 rows, so bob knows he lost", "Throws a deadlock error", "Waits until alice pays"],
            answer: 1,
            explanation:
              "alice's write moved the version to 1, so bob's WHERE matches nothing and the update reports 0 rows changed. That count is the signal: exactly one of two racing writes can succeed, with no lock held while either user thinks.",
          },
          {
            prompt: "Why is a `synchronized` method in the booking service not enough to prevent double booking in production?",
            options: [
              "synchronized is too slow",
              "The service runs on several servers, and a Java lock only guards one process",
              "synchronized does not work on Map objects",
              "It is enough; nothing else is needed",
            ],
            answer: 1,
            explanation:
              "Two requests for the same seat can reach two different servers, each with its own lock. The decision must be made where every server sees it: in the database, with a conditional update, `SELECT … FOR UPDATE`, or a unique constraint.",
          },
          {
            prompt: "Which is a correct pessimistic way to hold a seat?",
            options: [
              "Read the seat, check it is free in code, then write HELD",
              "`SELECT … FOR UPDATE` on the seat row, check, write HELD, commit, all in one short transaction",
              "Write HELD first and check afterwards",
              "Lock the whole cinema table for the duration of the payment",
            ],
            answer: 1,
            explanation:
              "Locking the row before the check means no one else can read-and-write it in between; committing quickly keeps others waiting only briefly. Checking without a lock is the race itself, and holding a lock across a payment call keeps it for seconds.",
          },
          {
            prompt: "Where should the call to the payment gateway happen?",
            options: ["Inside the transaction that holds the seats", "Outside any lock or transaction, after the hold is committed", "Before the seats are held", "Inside a synchronized block"],
            answer: 1,
            explanation:
              "A gateway can take seconds; inside a transaction it holds locks the whole time. Hold first (short transaction), pay outside, then confirm or release in another short write. Paying before holding risks charging for a seat that is gone.",
          },
          {
            prompt: "A payment succeeds at t=9 but the hold lapsed at t=8. What is correct?",
            options: [
              "Book the seats anyway; the money arrived",
              "Confirm only seats still held by this buyer; otherwise refund",
              "Book the seats and cancel whoever holds them now",
              "Extend the hold by the time the payment took",
            ],
            answer: 1,
            explanation:
              "After t=8 the seats may already be held or booked by someone else. Confirming only what this buyer still holds keeps one buyer per seat; a late payment for a lost seat is refunded.",
          },
          {
            prompt: "Which pattern fits \"weekday, weekend and matinee prices, chosen per show\"?",
            options: ["Singleton", "Strategy", "Observer", "Builder"],
            answer: 1,
            explanation:
              "Each pricing rule is one class behind a `price(seat)` interface, and the show is given one. The booking code calls `price` and never names a day, so a new rule is a new class and nothing else changes.",
          },
          {
            prompt: "Mail, SMS and analytics all need to react when a booking is confirmed. Which design fits?",
            options: [
              "The booking service calls each one directly by name",
              "They subscribe to a booking-confirmed event (Observer)",
              "Each one polls the bookings table",
              "The payment gateway notifies them",
            ],
            answer: 1,
            explanation:
              "With Observer the booking announces one event and does not know who listens; adding push notifications is a new subscriber. Calling each by name couples the core to every channel, and polling lags and wastes queries.",
          },
          {
            prompt: "What does storing `heldUntil` on ShowSeat buy you, compared with a timer per hold?",
            options: [
              "Nothing; it is the same",
              "Expiry needs no thread: a lapsed hold reads as available, and behaviour depends only on the clock's value",
              "It makes holds last for ever",
              "It lets the buyer extend the hold",
            ],
            answer: 1,
            explanation:
              "A timer per hold means threads, cancellation and timing-dependent results. A stored expiry is checked whenever the seat is read, so a lapsed hold is simply available, with no moving parts and a reproducible outcome.",
          },
          {
            prompt: "Which database constraint is a backstop against two confirmed bookings of one seat for one show?",
            options: ["An index on the movie title", "A unique constraint on (show, seat) in the booked-seats table", "A foreign key from seat to cinema", "A NOT NULL on the price"],
            answer: 1,
            explanation:
              "Even if application logic slipped, the database refuses a second row for the same show and seat. It is a backstop, not the main guard: the conditional hold should have stopped the second buyer long before.",
          },
          {
            prompt: "In optimistic locking, why does every change of status raise the version, not only a hold?",
            options: [
              "To count how many times the seat was sold",
              "So any read taken before any change is detected as stale, whatever the change was",
              "Because MySQL requires it",
              "It does not need to; only holds matter",
            ],
            answer: 1,
            explanation:
              "A buyer who read AVAILABLE v2 must not succeed after the seat was held and released (v4) and held again; only a version that moves on every change makes every old read stale. In the checkpoint's program, a buyer's own hold makes their own read stale too.",
          },
        ],
      },
    ],
  },
  more,
);
