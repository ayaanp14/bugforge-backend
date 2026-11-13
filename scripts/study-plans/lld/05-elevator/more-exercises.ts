import type { ExerciseSource } from "../../dsl.js";

/** The lesson's second program: the one-car LOOK model of module.ts, twice, behind a dispatcher. */

const DISPATCH_STARTER = String.raw`import java.io.*;
import java.util.*;

public class Main {
    enum Direction { UP, DOWN, IDLE }

    static class Elevator {
        final String id;
        int floor;
        Direction dir = Direction.IDLE;
        final TreeSet<Integer> stops = new TreeSet<>();

        Elevator(String id, int floor) { this.id = id; this.floor = floor; }

        /** Idle, or already moving towards floor f. */
        boolean headingTo(int f) {
            // TODO
            return false;
        }

        void addStop(int f) {
            // TODO: add the stop; an idle car takes the direction of its first call
        }

        String step() {
            // TODO: the one-car LOOK tick, each line starting with the id
            return "";
        }

        String status() {
            // TODO
            return "";
        }
    }

    static class Dispatcher {
        final int top;
        final List<Elevator> cars = new ArrayList<>();

        Dispatcher(int top) { this.top = top; }

        /** A hall call: nearest car idle or heading towards f, else the nearest car; ties to the lower number. */
        String call(int f) {
            // TODO
            return "";
        }

        /** A car call: straight to that car. Returns a line to print, or null. */
        String press(String id, int f) {
            // TODO
            return null;
        }
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String[] first = br.readLine().trim().split("\\s+");
        Dispatcher d = new Dispatcher(Integer.parseInt(first[0]));
        d.cars.add(new Elevator("E1", Integer.parseInt(first[1])));
        d.cars.add(new Elevator("E2", Integer.parseInt(first[2])));
        StringBuilder out = new StringBuilder();
        String line;
        while ((line = br.readLine()) != null) {
            line = line.trim();
            if (line.isEmpty()) continue;
            String[] p = line.split("\\s+");
            switch (p[0]) {
                case "CALL" -> out.append(d.call(Integer.parseInt(p[1]))).append('\n');
                case "PRESS" -> {
                    String said = d.press(p[1], Integer.parseInt(p[2]));
                    if (said != null) out.append(said).append('\n');
                }
                case "STEP" -> { for (Elevator e : d.cars) out.append(e.step()).append('\n'); }
                case "STATUS" -> { for (Elevator e : d.cars) out.append(e.status()).append('\n'); }
                default -> { }
            }
        }
        System.out.print(out);
    }
}
`;

const DISPATCH_SOLUTION = String.raw`import java.io.*;
import java.util.*;

public class Main {
    enum Direction { UP, DOWN, IDLE }

    static class Elevator {
        final String id;
        int floor;
        Direction dir = Direction.IDLE;
        final TreeSet<Integer> stops = new TreeSet<>();

        Elevator(String id, int floor) { this.id = id; this.floor = floor; }

        boolean headingTo(int f) {
            return dir == Direction.IDLE || (dir == Direction.UP && f >= floor) || (dir == Direction.DOWN && f <= floor);
        }

        boolean stopAhead(Direction d) {
            if (d == Direction.UP) return stops.higher(floor) != null;
            if (d == Direction.DOWN) return stops.lower(floor) != null;
            return false;
        }

        void addStop(int f) {
            stops.add(f);
            if (dir == Direction.IDLE && f != floor) dir = f > floor ? Direction.UP : Direction.DOWN;
        }

        String step() {
            if (stops.isEmpty()) return id + " idle at " + floor;
            String line;
            if (stops.remove(floor)) {
                line = id + " stop at " + floor;
            } else {
                floor += dir == Direction.UP ? 1 : -1;
                line = id + " " + dir + " to " + floor;
                if (stops.remove(floor)) line += ": stop";
            }
            // LOOK: keep the direction while a stop lies ahead, turn when none does, idle when none is left.
            if (stops.isEmpty()) dir = Direction.IDLE;
            else if (dir == Direction.IDLE || !stopAhead(dir)) dir = stopAhead(Direction.UP) ? Direction.UP : Direction.DOWN;
            return line;
        }

        String status() {
            StringJoiner s = new StringJoiner(" ");
            for (int f : stops) s.add(String.valueOf(f));
            return id + " at " + floor + " " + dir + " stops " + (stops.isEmpty() ? "none" : s.toString());
        }
    }

    static class Dispatcher {
        final int top;
        final List<Elevator> cars = new ArrayList<>();

        Dispatcher(int top) { this.top = top; }

        boolean valid(int f) { return f >= 0 && f <= top; }

        String call(int f) {
            if (!valid(f)) return "invalid floor " + f;
            Elevator best = null;
            // First pass: only cars idle or heading towards the call. Second: any car. Strict < keeps the lower number on a tie.
            for (boolean strict : new boolean[] {true, false}) {
                for (Elevator e : cars)
                    if ((!strict || e.headingTo(f)) && (best == null || Math.abs(e.floor - f) < Math.abs(best.floor - f))) best = e;
                if (best != null) break;
            }
            best.addStop(f);
            return "call " + f + " -> " + best.id;
        }

        String press(String id, int f) {
            Elevator car = null;
            for (Elevator e : cars) if (e.id.equals(id)) car = e;
            if (car == null) return "unknown elevator " + id;
            if (!valid(f)) return "invalid floor " + f;
            car.addStop(f);
            return null;
        }
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String[] first = br.readLine().trim().split("\\s+");
        Dispatcher d = new Dispatcher(Integer.parseInt(first[0]));
        d.cars.add(new Elevator("E1", Integer.parseInt(first[1])));
        d.cars.add(new Elevator("E2", Integer.parseInt(first[2])));
        StringBuilder out = new StringBuilder();
        String line;
        while ((line = br.readLine()) != null) {
            line = line.trim();
            if (line.isEmpty()) continue;
            String[] p = line.split("\\s+");
            switch (p[0]) {
                case "CALL" -> out.append(d.call(Integer.parseInt(p[1]))).append('\n');
                case "PRESS" -> {
                    String said = d.press(p[1], Integer.parseInt(p[2]));
                    if (said != null) out.append(said).append('\n');
                }
                case "STEP" -> { for (Elevator e : d.cars) out.append(e.step()).append('\n'); }
                case "STATUS" -> { for (Elevator e : d.cars) out.append(e.status()).append('\n'); }
                default -> { }
            }
        }
        System.out.print(out);
    }
}
`;

const more: Record<string, ExerciseSource[]> = {
  "elevator-design": [
    {
      title: "Two cars and a dispatcher",
      prompt: `Two elevators, \`E1\` and \`E2\`, each moving exactly as in the first exercise, and a dispatcher that answers hall calls.

**Input.** The first line is \`top a b\`: floors \`0\` to \`top\`, \`E1\` idle at \`a\`, \`E2\` idle at \`b\`. Then one command per line:

- \`CALL f\`: a hall call. A car **heads towards** \`f\` when it is idle, going \`UP\` with \`f\` at or above its floor, or going \`DOWN\` with \`f\` at or below it. Choose the nearest car that heads towards \`f\`; if none does, the nearest car. A tie goes to \`E1\`. Add the stop to that car (an idle car takes the call's direction, as before) and print \`call f -> E1\`. A floor outside \`0..top\` prints \`invalid floor f\`.
- \`PRESS E f\`: a car call, added straight to that car's stops. Prints nothing, or \`unknown elevator E\`, or \`invalid floor f\` (the car is checked first).
- \`STEP\`: one tick for \`E1\`, then \`E2\`; each prints its line from the first exercise prefixed with its id, such as \`E1 UP to 3\` or \`E2 idle at 9\`.
- \`STATUS\`: both cars' status lines, prefixed the same way: \`E1 at 3 UP stops 6\`.

**Example**

\`\`\`
10 0 8
CALL 3
CALL 9
STEP
\`\`\`
prints
\`\`\`
call 3 -> E1
call 9 -> E2
E1 UP to 1
E2 UP to 9: stop
\`\`\`

E1 got 3 (both idle, E1 nearer). For 9, E1 heads towards it but E2 is idle and nearer.`,
      starter: DISPATCH_STARTER,
      solution: DISPATCH_SOLUTION,
      hints: [
        "The Elevator is the first exercise's, with an id on every line it prints.",
        "Dispatch in two passes: only cars that head towards the floor, then any car. Keep a car only when strictly nearer, and E1 wins ties.",
        "A car call never goes through the dispatcher's choice: find the car by id and add the stop.",
      ],
      cases: [
        {
          stdin: "10 0 8\nCALL 3\nCALL 9\nPRESS E1 6\nSTEP\nSTATUS\nCALL 2\nSTEP\nSTEP\nSTATUS\n",
          expected:
            "call 3 -> E1\ncall 9 -> E2\nE1 UP to 1\nE2 UP to 9: stop\nE1 at 1 UP stops 3 6\nE2 at 9 IDLE stops none\ncall 2 -> E1\nE1 UP to 2: stop\nE2 idle at 9\nE1 UP to 3: stop\nE2 idle at 9\nE1 at 3 UP stops 6\nE2 at 9 IDLE stops none\n",
        },
        {
          stdin: "10 5 5\nCALL 5\nCALL 8\nCALL 1\nSTEP\nSTATUS\nSTEP\nCALL 4\nCALL 5\nCALL 11\nPRESS E3 2\nPRESS E2 12\nSTATUS\n",
          expected:
            "call 5 -> E1\ncall 8 -> E1\ncall 1 -> E2\nE1 stop at 5\nE2 DOWN to 4\nE1 at 5 UP stops 8\nE2 at 4 DOWN stops 1\nE1 UP to 6\nE2 DOWN to 3\ncall 4 -> E2\ncall 5 -> E1\ninvalid floor 11\nunknown elevator E3\ninvalid floor 12\nE1 at 6 UP stops 5 8\nE2 at 3 DOWN stops 1 4\n",
          hidden: true,
        },
        {
          stdin: "6 0 6\nCALL 2\nCALL 4\nPRESS E1 1\nSTEP\nSTEP\nSTEP\nCALL 3\nSTEP\n",
          expected: "call 2 -> E1\ncall 4 -> E2\nE1 UP to 1: stop\nE2 DOWN to 5\nE1 UP to 2: stop\nE2 DOWN to 4: stop\nE1 idle at 2\nE2 idle at 4\ncall 3 -> E1\nE1 UP to 3: stop\nE2 idle at 4\n",
          hidden: true,
        },
      ],
    },
  ],
};

export default more;
