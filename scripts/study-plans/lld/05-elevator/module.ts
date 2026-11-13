import { defineModule } from "../../dsl.js";
import more from "./more-exercises.js";

/**
 * The elevator (content/notes/low-level-design/design-an-elevator-system):
 * one car under LOOK, then two cars and a dispatcher, then — in the
 * checkpoint — the scheduling policy as a Strategy. The programs are
 * simulations in explicit ticks (`STEP`), so the output is a pure function
 * of the script: no clock, no threads, ties broken by car number.
 */

const ONE_CAR_STARTER = String.raw`import java.io.*;
import java.util.*;

public class Main {
    enum Direction { UP, DOWN, IDLE }

    static class Elevator {
        final int top;
        int floor;
        Direction dir = Direction.IDLE;
        final TreeSet<Integer> stops = new TreeSet<>();

        Elevator(int top, int floor) { this.top = top; this.floor = floor; }

        /** Adds a stop. Returns a line to print, or null when there is nothing to say. */
        String call(int f) {
            // TODO: refuse a floor outside 0..top, add the stop,
            //       and give an idle car the direction of its first call
            return null;
        }

        /** One tick: idle, a stop at this floor, or one floor of movement. */
        String step() {
            // TODO
            return "";
        }

        String status() {
            // TODO: "at F DIR stops a b c" or "... stops none"
            return "";
        }
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String[] first = br.readLine().trim().split("\\s+");
        Elevator car = new Elevator(Integer.parseInt(first[0]), Integer.parseInt(first[1]));
        StringBuilder out = new StringBuilder();
        String line;
        while ((line = br.readLine()) != null) {
            line = line.trim();
            if (line.isEmpty()) continue;
            String[] p = line.split("\\s+");
            String said = switch (p[0]) {
                case "CALL" -> car.call(Integer.parseInt(p[1]));
                case "STEP" -> car.step();
                case "STATUS" -> car.status();
                default -> null;
            };
            if (said != null) out.append(said).append('\n');
        }
        System.out.print(out);
    }
}
`;

const ONE_CAR_SOLUTION = String.raw`import java.io.*;
import java.util.*;

public class Main {
    enum Direction { UP, DOWN, IDLE }

    static class Elevator {
        final int top;
        int floor;
        Direction dir = Direction.IDLE;
        final TreeSet<Integer> stops = new TreeSet<>();

        Elevator(int top, int floor) { this.top = top; this.floor = floor; }

        boolean stopAhead(Direction d) {
            if (d == Direction.UP) return stops.higher(floor) != null;
            if (d == Direction.DOWN) return stops.lower(floor) != null;
            return false;
        }

        String call(int f) {
            if (f < 0 || f > top) return "invalid floor " + f;
            stops.add(f);
            // An idle car takes the direction of its first call at once.
            if (dir == Direction.IDLE && f != floor) dir = f > floor ? Direction.UP : Direction.DOWN;
            return null;
        }

        String step() {
            if (stops.isEmpty()) return "idle at " + floor;
            String line;
            if (stops.remove(floor)) {
                line = "stop at " + floor;
            } else {
                floor += dir == Direction.UP ? 1 : -1;
                line = dir + " to " + floor;
                if (stops.remove(floor)) line += ": stop";
            }
            settle();
            return line;
        }

        // LOOK: keep the direction while a stop lies ahead, turn when none does, idle when none is left.
        void settle() {
            if (stops.isEmpty()) dir = Direction.IDLE;
            else if (dir == Direction.IDLE || !stopAhead(dir)) dir = stopAhead(Direction.UP) ? Direction.UP : Direction.DOWN;
        }

        String status() {
            StringJoiner s = new StringJoiner(" ");
            for (int f : stops) s.add(String.valueOf(f));
            return "at " + floor + " " + dir + " stops " + (stops.isEmpty() ? "none" : s.toString());
        }
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String[] first = br.readLine().trim().split("\\s+");
        Elevator car = new Elevator(Integer.parseInt(first[0]), Integer.parseInt(first[1]));
        StringBuilder out = new StringBuilder();
        String line;
        while ((line = br.readLine()) != null) {
            line = line.trim();
            if (line.isEmpty()) continue;
            String[] p = line.split("\\s+");
            String said = switch (p[0]) {
                case "CALL" -> car.call(Integer.parseInt(p[1]));
                case "STEP" -> car.step();
                case "STATUS" -> car.status();
                default -> null;
            };
            if (said != null) out.append(said).append('\n');
        }
        System.out.print(out);
    }
}
`;

const POLICIES_STARTER = String.raw`import java.io.*;
import java.util.*;

public class Main {
    enum Direction { UP, DOWN }

    /** One floor the car visits; turn is true for SCAN's ride to the end of the shaft. */
    record Visit(int floor, boolean turn) {}

    interface Scheduler {
        List<Visit> order(int top, int start, Direction dir, List<Integer> stops);
    }

    // TODO: class LookScheduler implements Scheduler
    // TODO: class ScanScheduler implements Scheduler
    // TODO: class FcfsScheduler implements Scheduler

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int top = Integer.parseInt(br.readLine().trim());
        Map<String, Scheduler> policies = new HashMap<>();
        // TODO: register LOOK, SCAN and FCFS
        StringBuilder out = new StringBuilder();
        String line;
        while ((line = br.readLine()) != null) {
            line = line.trim();
            if (line.isEmpty()) continue;
            String[] p = line.split("\\s+");
            // TODO: p[0] policy, p[1] start, p[2] direction, then the stops;
            //       print "POLICY: visits (N floors)" with SCAN's end of shaft in [brackets]
        }
        System.out.print(out);
    }
}
`;

const POLICIES_SOLUTION = String.raw`import java.io.*;
import java.util.*;

public class Main {
    enum Direction { UP, DOWN }

    /** One floor the car visits; turn is true for SCAN's ride to the end of the shaft. */
    record Visit(int floor, boolean turn) {}

    interface Scheduler {
        List<Visit> order(int top, int start, Direction dir, List<Integer> stops);
    }

    /** The stops on one side of the floor, nearest first. */
    static List<Integer> ahead(TreeSet<Integer> left, int floor, Direction dir) {
        return dir == Direction.UP ? new ArrayList<>(left.tailSet(floor, false)) : new ArrayList<>(left.headSet(floor, false).descendingSet());
    }

    static Direction other(Direction d) { return d == Direction.UP ? Direction.DOWN : Direction.UP; }

    // LOOK: serve everything ahead, then turn at the last stop.
    static class LookScheduler implements Scheduler {
        public List<Visit> order(int top, int start, Direction dir, List<Integer> stops) {
            TreeSet<Integer> left = new TreeSet<>(stops);
            List<Visit> visits = new ArrayList<>();
            int floor = start;
            Direction d = dir;
            while (!left.isEmpty()) {
                for (int f : ahead(left, floor, d)) { visits.add(new Visit(f, false)); left.remove(f); floor = f; }
                d = other(d);
            }
            return visits;
        }
    }

    // SCAN: serve everything ahead, and if stops remain ride to the end of the shaft before turning.
    static class ScanScheduler implements Scheduler {
        public List<Visit> order(int top, int start, Direction dir, List<Integer> stops) {
            TreeSet<Integer> left = new TreeSet<>(stops);
            List<Visit> visits = new ArrayList<>();
            int floor = start;
            Direction d = dir;
            while (!left.isEmpty()) {
                for (int f : ahead(left, floor, d)) { visits.add(new Visit(f, false)); left.remove(f); floor = f; }
                if (left.isEmpty()) break;
                int end = d == Direction.UP ? top : 0;
                if (floor != end) { visits.add(new Visit(end, true)); floor = end; }
                d = other(d);
            }
            return visits;
        }
    }

    // First come, first served: the arrival order, whatever the direction.
    static class FcfsScheduler implements Scheduler {
        public List<Visit> order(int top, int start, Direction dir, List<Integer> stops) {
            List<Visit> visits = new ArrayList<>();
            for (int f : stops) visits.add(new Visit(f, false));
            return visits;
        }
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int top = Integer.parseInt(br.readLine().trim());
        Map<String, Scheduler> policies = new HashMap<>();
        policies.put("LOOK", new LookScheduler());
        policies.put("SCAN", new ScanScheduler());
        policies.put("FCFS", new FcfsScheduler());
        StringBuilder out = new StringBuilder();
        String line;
        while ((line = br.readLine()) != null) {
            line = line.trim();
            if (line.isEmpty()) continue;
            String[] p = line.split("\\s+");
            Scheduler s = policies.get(p[0]);
            if (s == null) { out.append("unknown policy ").append(p[0]).append('\n'); continue; }
            int start = Integer.parseInt(p[1]);
            Direction dir = Direction.valueOf(p[2]);
            List<Integer> stops = new ArrayList<>();
            for (int i = 3; i < p.length; i++) stops.add(Integer.parseInt(p[i]));
            StringJoiner order = new StringJoiner(" ");
            int floor = start, moved = 0;
            for (Visit v : s.order(top, start, dir, stops)) {
                order.add(v.turn() ? "[" + v.floor() + "]" : String.valueOf(v.floor()));
                moved += Math.abs(v.floor() - floor);
                floor = v.floor();
            }
            out.append(p[0]).append(": ").append(order).append(" (").append(moved).append(" floors)\n");
        }
        System.out.print(out);
    }
}
`;

export default defineModule(
  import.meta.url,
  {
    slug: "elevator",
    title: "Elevator system",
    blurb: "One car under LOOK, then two cars and a dispatcher, then scheduling policies as a Strategy, simulated tick by tick in Java.",
    icon: "layers",
    overview: `The elevator is the machine-coding problem where an object model has to carry an algorithm. The classes are few (an Elevator with a floor, a direction and a sorted set of stops; a Dispatcher that owns the cars), but the behaviour has to be exactly right: which stop comes next, when the car turns, and which car answers a call.

You will build it the way a round grows it. First one car that moves one floor per tick under LOOK, the policy that keeps its direction while a stop lies ahead and turns when none does. Then a dispatcher that sends each hall call to the nearest car idle or heading its way. In the checkpoint, LOOK, SCAN and first come first served sit behind one Scheduler interface and serve the same stops three ways.

Every program is a simulation driven by a script of commands, so the same input always prints the same lines. The design behind it is in the [elevator system note](/notes/low-level-design/design-an-elevator-system).`,
    lessons: [
      {
        slug: "elevator-design",
        file: "01-elevator-design.md",
        exercises: [
          {
            title: "One car under LOOK",
            prompt: `Simulate one elevator, one floor per tick, under LOOK.

**Input.** The first line is \`top start\`: the floors are \`0\` to \`top\` and the car starts idle at \`start\`. Then one command per line:

- \`CALL f\`: add a stop at floor \`f\`. Outside \`0..top\` print \`invalid floor f\`. A stop that is already there changes nothing. An idle car takes the direction of its first call at once (up if \`f\` is above it, down if below). Prints nothing otherwise.
- \`STEP\`: one tick. With no stops print \`idle at F\`. If the floor the car is on is a stop, serve it without moving: \`stop at F\`. Otherwise move one floor in the car's direction and print \`UP to F\` or \`DOWN to F\`, adding \`: stop\` when that floor is a stop (it is served and removed).
  After the tick, LOOK settles the direction: no stops left means \`IDLE\`; no stop ahead in the current direction means the car turns.
- \`STATUS\`: \`at F DIR stops a b c\` with the stops in ascending order, or \`stops none\`.

**Example**

\`\`\`
6 2
CALL 5
CALL 0
STEP
STEP
STATUS
\`\`\`
prints
\`\`\`
UP to 3
UP to 4
at 4 UP stops 0 5
\`\`\``,
            starter: ONE_CAR_STARTER,
            solution: ONE_CAR_SOLUTION,
            hints: [
              "Keep the stops in a TreeSet<Integer>: higher(floor) and lower(floor) answer whether a stop lies ahead.",
              "In step(), handle the three cases in order: no stops, a stop at this floor, then move one floor.",
              "After every tick, settle the direction: empty means IDLE; no stop ahead means flip UP and DOWN.",
            ],
            cases: [
              {
                stdin: "6 2\nCALL 5\nCALL 0\nSTATUS\nSTEP\nCALL 4\nSTEP\nCALL 3\nSTEP\nSTATUS\nSTEP\nSTEP\nSTEP\nSTEP\nSTEP\nSTEP\nSTATUS\n",
                expected:
                  "at 2 UP stops 0 5\nUP to 3\nUP to 4: stop\nUP to 5: stop\nat 5 DOWN stops 0 3\nDOWN to 4\nDOWN to 3: stop\nDOWN to 2\nDOWN to 1\nDOWN to 0: stop\nidle at 0\nat 0 IDLE stops none\n",
              },
              {
                stdin: "5 0\nSTEP\nCALL 7\nCALL -1\nCALL 2\nCALL 2\nSTEP\nSTEP\nSTATUS\nSTEP\n",
                expected: "idle at 0\ninvalid floor 7\ninvalid floor -1\nUP to 1\nUP to 2: stop\nat 2 IDLE stops none\nidle at 2\n",
                hidden: true,
              },
              {
                stdin: "8 4\nCALL 4\nSTATUS\nSTEP\nCALL 6\nSTEP\nCALL 5\nSTEP\nSTEP\nSTEP\n",
                expected: "at 4 IDLE stops 4\nstop at 4\nUP to 5\nstop at 5\nUP to 6: stop\nidle at 6\n",
                hidden: true,
              },
              {
                stdin: "9 7\nCALL 3\nCALL 9\nSTEP\nSTEP\nCALL 8\nSTEP\nSTEP\nSTATUS\nSTEP\nSTEP\nSTEP\nSTEP\nSTEP\nSTEP\nSTEP\n",
                expected:
                  "DOWN to 6\nDOWN to 5\nDOWN to 4\nDOWN to 3: stop\nat 3 UP stops 8 9\nUP to 4\nUP to 5\nUP to 6\nUP to 7\nUP to 8: stop\nUP to 9: stop\nidle at 9\n",
                hidden: true,
              },
            ],
          },
        ],
        quiz: [
          {
            prompt: "Why is a `TreeSet<Integer>` a good fit for an elevator's stops?",
            options: [
              "It is thread-safe, so buttons can add stops from many threads",
              "It is sorted and drops duplicates, so the next stop above or below is one `higher`/`lower` call",
              "It keeps the stops in the order they were pressed",
              "It is faster than an array for every operation",
            ],
            answer: 1,
            explanation:
              "Sorted order turns \"is there a stop ahead?\" into `higher(floor)` or `lower(floor)`, O(log n), and a repeated call simply does not add a second entry. `TreeSet` is **not** thread-safe, and arrival order is what a queue keeps, which is first come first served, not LOOK.",
          },
          {
            prompt: "A LOOK car is at floor 5 going up with stops at 8 and 2. A call for 3 arrives. When is 3 served?",
            options: ["Next, because it is the nearest stop", "After 8, on the way down, before 2", "After 2, on the way back up", "Never, until the car goes idle"],
            answer: 1,
            explanation:
              "LOOK keeps its direction while a stop lies ahead, so it goes up to 8 first. With nothing above 8 it turns, and on the way down it reaches 3 before 2. Serving the nearest stop first is a different policy, and the one that starves far floors.",
          },
          {
            prompt: "Where should the rule \"which car answers this hall call\" live?",
            options: ["In Elevator, as a method each car runs on itself", "In the Dispatcher, which owns the cars", "In the Main loop that reads the commands", "In the Direction enum"],
            answer: 1,
            explanation:
              "Choosing among cars needs to see every car, so it belongs to the Dispatcher that owns them. Each Elevator only moves itself and keeps its own stops. Putting the choice in the input loop mixes parsing with policy, and the next requirement (capacity, a rush-hour rule) has nowhere clean to go.",
          },
          {
            prompt: "Why does the dispatcher set an idle car's direction as soon as it assigns the car a call?",
            options: [
              "Java enums cannot stay IDLE once a set is non-empty",
              "So the next call sees the car as moving that way, not as free and nearest for anything",
              "To make the car move before the next tick",
              "It does not matter; direction is only read when the car moves",
            ],
            answer: 1,
            explanation:
              "The dispatcher's rule reads direction: idle cars qualify for any floor. A car that has taken a call but still reads IDLE would keep attracting calls in both directions until it moved. Setting the direction does not move it; movement still happens only on a tick.",
          },
        ],
      },
      {
        slug: "elevator-checkpoint",
        file: "02-checkpoint.md",
        kind: "test",
        passMark: 70,
        exercises: [
          {
            title: "Three scheduling policies",
            prompt: `Put LOOK, SCAN and first come first served behind one \`Scheduler\` interface and serve the same stops with each.

**Input.** The first line is \`top\` (floors \`0\` to \`top\`). Each following line is \`POLICY start DIR s1 s2 …\`: a policy name, the car's floor, its direction (\`UP\` or \`DOWN\`) and the stops in the order they were pressed. Stops are distinct and differ from \`start\`.

**Policies**

- \`LOOK\`: serve every stop ahead in the current direction, nearest first; then turn and do the same.
- \`SCAN\`: the same, but when stops remain after a sweep, ride on to the end of the shaft (\`top\` going up, \`0\` going down) before turning. A car already at that end does not ride.
- \`FCFS\`: the stops in the order given.

**Output.** One line per input line: \`POLICY: v1 v2 … (N floors)\`, the floors in the order visited, SCAN's ride to an end written in brackets like \`[10]\`, and \`N\` the floors travelled from \`start\`. An unknown policy prints \`unknown policy NAME\`.

**Example**

\`\`\`
10
LOOK 4 UP 7 3 9 6
SCAN 4 UP 7 3 9 6
\`\`\`
prints
\`\`\`
LOOK: 6 7 9 3 (11 floors)
SCAN: 6 7 9 [10] 3 (13 floors)
\`\`\``,
            starter: POLICIES_STARTER,
            solution: POLICIES_SOLUTION,
            hints: [
              "Each policy is one class with one method: order(top, start, dir, stops) returns the visits.",
              "LOOK and SCAN share a helper: the stops left on one side of the floor, nearest first (TreeSet tailSet / headSet descending).",
              "SCAN only adds the end of the shaft when stops remain after the sweep and the car is not already there.",
              "Count floors in main from the visits, so every policy is measured the same way.",
            ],
            cases: [
              {
                stdin: "10\nLOOK 4 UP 7 3 9 6\nSCAN 4 UP 7 3 9 6\nFCFS 4 UP 7 3 9 6\n",
                expected: "LOOK: 6 7 9 3 (11 floors)\nSCAN: 6 7 9 [10] 3 (13 floors)\nFCFS: 7 3 9 6 (16 floors)\n",
              },
              {
                stdin: "8\nLOOK 5 DOWN 2 7 1\nSCAN 5 DOWN 2 7 1\nFCFS 5 DOWN 2 7 1\n",
                expected: "LOOK: 2 1 7 (10 floors)\nSCAN: 2 1 [0] 7 (12 floors)\nFCFS: 2 7 1 (14 floors)\n",
                hidden: true,
              },
              {
                stdin: "9\nLOOK 2 UP 5 8\nSCAN 2 UP 5 8\nLOOK 6 UP 1 4\nSCAN 6 UP 1 4\nSCAN 9 UP 4\nMAGIC 3 UP 1\n",
                expected: "LOOK: 5 8 (6 floors)\nSCAN: 5 8 (6 floors)\nLOOK: 4 1 (5 floors)\nSCAN: [9] 4 1 (11 floors)\nSCAN: 4 (5 floors)\nunknown policy MAGIC\n",
                hidden: true,
              },
            ],
          },
        ],
        quiz: [
          {
            prompt: "What is the difference between SCAN and LOOK?",
            options: [
              "SCAN serves stops in arrival order; LOOK sorts them",
              "SCAN rides to the end of the shaft before turning; LOOK turns at the last requested stop",
              "LOOK can starve floors; SCAN cannot",
              "There is none; they are two names for one policy",
            ],
            answer: 1,
            explanation:
              "Both sweep: they serve every stop ahead before turning. SCAN carries on to the top or bottom floor first, LOOK turns as soon as nothing is ahead. Neither starves a floor, and arrival order is first come first served.",
          },
          {
            prompt: "Car at floor 4 going UP, stops 7, 3, 9, 6 on floors 0–10. How many floors does LOOK travel?",
            options: ["9", "11", "13", "16"],
            answer: 1,
            explanation: "LOOK visits 6, 7, 9 going up (5 floors), then turns and goes to 3 (6 floors): 11. SCAN would ride on to 10 first, making 13; first come first served (7, 3, 9, 6) makes 16.",
          },
          {
            prompt: "Why is \"always go to the nearest stop\" a poor elevator policy?",
            options: ["It travels further than SCAN on every input", "It can starve a far floor while nearer calls keep arriving", "It needs a priority queue, which Java lacks", "It cannot handle car calls"],
            answer: 1,
            explanation:
              "Nearest-first minimises the next move, so a stream of calls near the car keeps winning and a far floor may wait indefinitely. Sweeping policies bound the wait: every floor is reached within two sweeps. On many inputs nearest-first actually travels less, which is why it tempts.",
          },
          {
            prompt: "The building wants a rush-hour policy that parks idle cars at the lobby. With a Scheduler interface, what changes?",
            options: [
              "Elevator gets an if for rush hour in its step method",
              "A new class implementing Scheduler; the dispatcher is given it, and Elevator is untouched",
              "Direction gains a LOBBY value",
              "Every existing scheduler gets a rushHour flag",
            ],
            answer: 1,
            explanation:
              "That is the point of the Strategy: a new policy is a new class, and the code that uses it (the dispatcher or the car's loop) depends only on the interface. Editing Elevator or every existing policy for each new rule is exactly what the open/closed principle warns against.",
          },
          {
            prompt: "Which pattern best describes the car's UP / DOWN / IDLE direction deciding which stops count as ahead?",
            options: ["Observer", "State", "Factory", "Adapter"],
            answer: 1,
            explanation:
              "Behaviour that depends on a mode the object is in is the State pattern; an enum is its simplest form, and a fuller design adds DoorsOpen and Maintenance as State classes. Observer would fit floor displays that follow the car.",
          },
          {
            prompt: "Floor displays and hall lanterns must update whenever a car moves. Which design fits?",
            options: [
              "Each display polls every car every millisecond",
              "Displays subscribe to the car and are notified when its floor or direction changes (Observer)",
              "The car holds a reference to every display class by name",
              "The dispatcher prints to the displays from its call method",
            ],
            answer: 1,
            explanation:
              "Observer lets the car announce a change without knowing who listens; adding a new kind of display is a new subscriber. Polling wastes work and lags; naming every display inside Elevator couples the car to the building's hardware.",
          },
          {
            prompt: "Two cars are both idle and both 3 floors from a hall call. The program must be deterministic. What do you do?",
            options: ["Pick one at random", "Break the tie by a fixed rule, such as the lower car number", "Send both cars", "Wait for the next tick and decide then"],
            answer: 1,
            explanation:
              "A fixed tie rule makes the same script print the same output every time, which is what a test, and a judge, can check. Randomness breaks reproducibility, sending both wastes a car, and waiting leaves a passenger standing.",
          },
          {
            prompt: "Buttons on every floor can be pressed at the same moment from different threads. What keeps the stop sets consistent?",
            options: [
              "Nothing is needed; TreeSet is thread-safe",
              "Assign under a lock, or have one dispatcher thread consume a queue of requests",
              "Make the floor field volatile",
              "Give every button its own copy of the stop set",
            ],
            answer: 1,
            explanation:
              "TreeSet is not thread-safe, and choosing a car then adding the stop must happen together. A lock around assignment, or a single thread draining a request queue, makes each assignment atomic. volatile only makes a single field's writes visible; it does not make a read-decide-write sequence atomic.",
          },
          {
            prompt: "A passenger inside car E1, going up at floor 6, presses 2. What happens?",
            options: [
              "The dispatcher may give floor 2 to another car",
              "Floor 2 becomes E1's stop; E1 serves it after it turns",
              "E1 turns at once and goes to 2",
              "The press is ignored because 2 is behind the car",
            ],
            answer: 1,
            explanation:
              "A car call belongs to the car it was pressed in: the passenger is inside E1, so no other car can serve it. It becomes one of E1's stops and LOOK reaches it on the way down, after the stops still ahead.",
          },
          {
            prompt: "Why drive an elevator simulation with explicit ticks (STEP) instead of real time?",
            options: [
              "Java cannot sleep for less than a second",
              "The output becomes a pure function of the input script, so it can be tested line by line",
              "Ticks make the elevator faster",
              "Real elevators move in ticks",
            ],
            answer: 1,
            explanation:
              "With ticks there is no clock and no thread timing in the result: the same commands always print the same lines. That is what makes the design testable in an interview and judgeable here. Real time would make the order of events depend on scheduling.",
          },
        ],
      },
    ],
  },
  more,
);
