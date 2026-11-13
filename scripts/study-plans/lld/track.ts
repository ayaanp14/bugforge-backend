import type { TrackSeed } from "../dsl.js";
import modelling from "./01-modelling/module.js";
import lruCache from "./02-lru-cache/module.js";
import parkingLot from "./03-parking-lot/module.js";
import vendingMachine from "./04-vending-machine/module.js";
import elevator from "./05-elevator/module.js";
import ticketBooking from "./06-ticket-booking/module.js";
import expenseSharing from "./07-expense-sharing/module.js";

/**
 * Low-Level Design practice (2026-11-14, the owner's System Design track:
 * learn → practise → interview). The "practise" half of the Low-Level Design
 * notes (content/notes/low-level-design): each module takes one machine-coding
 * problem, teaches it in one short animated lesson with a game, and has the
 * learner write the classes. The exercises are whole Java programs judged by
 * behaviour — stdin is a script of commands ("PARK car KA-01", "INSERT 10",
 * "GET 3"), stdout is what the system answers to each, and hidden cases run
 * the edge cases (a full lot, exact change, an evicted key) — so the design
 * is graded on what it does, the way a machine-coding round is.
 *
 * Java, because the machine-coding round is most often taken in it; OpenJDK
 * 18 on the study judge (records, switch expressions and sealed types are
 * fine). Authoring rules that keep the cases deterministic: no HashMap
 * iteration order in any expected output (sort, or use LinkedHashMap /
 * TreeMap on purpose), no time, no randomness.
 *
 * Modules are added below as they are written (scripts/study-plans/lld/NN-<slug>/).
 */
export const lldTrack: TrackSeed = {
  key: "lld",
  title: "Low-Level Design",
  blurb: "Machine-coding practice: design and code a parking lot, an LRU cache, a vending machine, an elevator, a ticket booking system and Splitwise in Java — judged on how your classes behave, edge cases included.",
  language: "java",
  runtime: "OpenJDK 18",
  modules: [modelling, lruCache, parkingLot, vendingMachine, elevator, ticketBooking, expenseSharing],
};
