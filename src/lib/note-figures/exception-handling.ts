import { finish, type Frame, type Item, type LineTone, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { arrow, box, label, region } from "../lesson-figures/kit.js";
import { classBox, umlLink } from "./kit.js";

/**
 * Exception Handling in OOP: the note's figures
 * (content/notes/oop/exception-handling.md places each with "@figure <name>").
 * The exception types are one table of parents, so every "is a", every
 * "checked" and every handler match is computed from it; the programs are
 * modelled and run, their printed lines checked against the note's output
 * fences:
 *
 *  - bank-errors: the note's exception family as a class diagram, with the
 *    classes each of its two handlers catches boxed by type;
 *  - unwinding: the bank program's three withdrawals on a model call stack —
 *    the throw, the frame popped, handlers tried in order, finally;
 *  - try-paths: the Python try statement's four ways through (nothing
 *    raised, caught by the first handler, caught by the second, not caught);
 *  - java-hierarchy: Throwable's family tree with checked and unchecked
 *    worked out by Java's rule;
 *  - resources-close: try-with-resources opening two resources, the throw,
 *    both closed in reverse order, then the handler.
 */

/* ── The types ────────────────────────────────────────────────────── */

/** Java's hierarchy (OutOfMemoryError and StackOverflowError really sit under VirtualMachineError), with the note's BankError family. */
const JAVA_PARENT: Record<string, string | null> = {
  Throwable: null,
  Error: "Throwable",
  VirtualMachineError: "Error",
  OutOfMemoryError: "VirtualMachineError",
  StackOverflowError: "VirtualMachineError",
  Exception: "Throwable",
  IOException: "Exception",
  SQLException: "Exception",
  RuntimeException: "Exception",
  NullPointerException: "RuntimeException",
  IllegalArgumentException: "RuntimeException",
  IllegalStateException: "RuntimeException",
  BankError: "RuntimeException",
  InsufficientFundsError: "BankError",
  AccountFrozenError: "BankError",
};
/** The Python version's classes: BankError derives from Exception; TypeError stands for any bug-shaped exception. */
const PY_PARENT: Record<string, string | null> = { BaseException: null, Exception: "BaseException", TypeError: "Exception", BankError: "Exception", InsufficientFundsError: "BankError", AccountFrozenError: "BankError" };

const isA = (parents: Record<string, string | null>, t: string, ancestor: string): boolean => {
  for (let c: string | null = t; c; c = parents[c] ?? null) if (c === ancestor) return true;
  return false;
};
/** Java's rule: Throwable and its subclasses are checked, except RuntimeException, Error and theirs. */
const checked = (t: string) => !isA(JAVA_PARENT, t, "RuntimeException") && !isA(JAVA_PARENT, t, "Error");

/* ── bank-errors: the family and what each handler catches ────────── */

function bankErrors(): Walkthrough {
  const handlers = ["InsufficientFundsError", "BankError"];
  const family = ["BankError", "InsufficientFundsError", "AccountFrozenError"];
  const caughtBy = (h: string) => family.filter((t) => isA(JAVA_PARENT, t, h));
  if (caughtBy("InsufficientFundsError").join() !== "InsufficientFundsError" || caughtBy("BankError").length !== 3) throw new Error("bank-errors: handler coverage disagrees with the hierarchy");
  if (checked("BankError")) throw new Error("bank-errors: the Java BankError extends RuntimeException, so it is unchecked");

  // The Java version's members (constructors left out).
  const W1 = 196;
  const parent = box("rt", 105, 0, "RuntimeException", { w: 150, h: 30, size: 12 });
  const base = classBox("be", { name: "BankError" }, { x: 105, y: 78, w: 150 });
  const ife = classBox("ife", { name: "InsufficientFundsError", fields: ["~ needed: int", "~ available: int"] }, { x: 0, y: base.y + base.h + 64, w: W1 });
  const afe = classBox("afe", { name: "AccountFrozenError" }, { x: W1 + 28, y: ife.y, w: 160 });
  const items: Item[] = [];
  // Each handler as a dashed box around exactly the classes it catches.
  const span = (ids: string[]) => {
    const boxes = ids.map((t) => (t === "BankError" ? base : t === "InsufficientFundsError" ? ife : afe));
    return { x1: Math.min(...boxes.map((b) => b.x)), y1: Math.min(...boxes.map((b) => b.y)), x2: Math.max(...boxes.map((b) => b.x + b.w)), y2: Math.max(...boxes.map((b) => b.y + b.h)) };
  };
  const big = span(caughtBy(handlers[1]));
  const small = span(caughtBy(handlers[0]));
  // The family's box runs low enough to hold the inner handler's name; its own name goes under it, right-aligned.
  items.push(...region("h1", big.x1 - 14, big.y1 - 30, big.x2 - big.x1 + 28, big.y2 - big.y1 + 60));
  items.push(label("h1-t", "catch (BankError e): the whole family", big.x2 + 14, big.y2 + 44, { anchor: "end", size: 11, tone: "soft", weight: 600, mono: true }));
  items.push(...region("h0", small.x1 - 6, small.y1 - 6, small.x2 - small.x1 + 12, small.y2 - small.y1 + 12, undefined, { tone: "accent" }));
  items.push(label("h0-t", "catch (InsufficientFundsError e)", small.x1, small.y2 + 17, { anchor: "start", size: 11, tone: "accent", weight: 600, mono: true }));
  items.push(parent, ...base.items, ...ife.items, ...afe.items);
  items.push(...umlLink("x0", base.top, { x: 180, y: 30 }, "inherits"));
  items.push(...umlLink("x1", ife.top, { x: base.bottom.x - 24, y: base.bottom.y }, "inherits"));
  items.push(...umlLink("x2", afe.top, { x: base.bottom.x + 24, y: base.bottom.y }, "inherits"));
  return finish({
    title: "The note's exception family, and what each handler catches",
    input: "",
    frames: [
      {
        caption: "Every banking failure derives from BankError, unchecked in the Java version because BankError extends RuntimeException. InsufficientFundsError carries the numbers a handler needs. A handler for the parent catches the whole family; one for a child catches only that case.",
        items,
      },
    ],
  });
}

/* ── unwinding: the bank program on a model call stack ────────────── */

const BANK_OUTPUT = ["withdraw 300: ok, balance 700", "audit: attempt 1 logged", "withdraw 5000: need 5000, have 700", "audit: attempt 2 logged", "withdraw 100: bank error: account ACC-7 is frozen", "audit: attempt 3 logged"];

interface Thrown {
  type: string;
  rows: string[];
  message: string;
  needed?: number;
  available?: number;
}

function runBank() {
  const acct = { id: "ACC-7", balance: 1000, frozen: false };
  const amounts = [300, 5000, 100];
  const handlers = ["InsufficientFundsError", "BankError"];
  const out: string[] = [];
  type Snap = { i: number; amount: number; stack: string[]; acct: typeof acct; row: number; rejected: number[]; ex: Thrown | null; out: string[]; fresh: number; phase: string };
  const snaps: Snap[] = [];
  let fresh = 0;
  const snap = (s: Omit<Snap, "acct" | "out" | "fresh">) => {
    snaps.push({ ...s, acct: { ...acct }, out: [...out], fresh });
    fresh = out.length;
  };
  const withdraw = (amount: number): number => {
    if (acct.frozen) throw { type: "AccountFrozenError", rows: [`message = "account ${acct.id} is frozen"`], message: `account ${acct.id} is frozen` } as Thrown;
    if (amount > acct.balance) throw { type: "InsufficientFundsError", rows: [`needed = ${amount}`, `available = ${acct.balance}`], message: "insufficient funds", needed: amount, available: acct.balance } as Thrown;
    return (acct.balance -= amount);
  };
  for (let i = 0; i < amounts.length; i++) {
    const amount = amounts[i];
    if (i === 2) acct.frozen = true;
    snap({ i, amount, stack: ["main", "withdraw"], row: 0, rejected: [], ex: null, phase: "call" });
    try {
      const left = withdraw(amount);
      out.push(`withdraw ${amount}: ok, balance ${left}`);
      snap({ i, amount, stack: ["main"], row: 0, rejected: [], ex: null, phase: "returned" });
    } catch (e) {
      const ex = e as Thrown;
      snap({ i, amount, stack: ["main", "withdraw"], row: 0, rejected: [], ex, phase: "thrown" });
      // Unwind: leave withdraw, then try main's handlers in order; the first whose type the exception is wins.
      const rejected: number[] = [];
      let caught = -1;
      for (let h = 0; h < handlers.length; h++) {
        if (isA(JAVA_PARENT, ex.type, handlers[h])) {
          caught = h;
          break;
        }
        rejected.push(h + 1);
      }
      if (caught < 0) throw new Error("unwinding: every exception in the program is caught");
      out.push(caught === 0 ? `withdraw ${amount}: need ${ex.needed}, have ${ex.available}` : `withdraw ${amount}: bank error: ${ex.message}`);
      snap({ i, amount, stack: ["main"], row: caught + 1, rejected, ex, phase: "caught" });
    } finally {
      out.push(`audit: attempt ${i + 1} logged`);
      snap({ i, amount, stack: ["main"], row: 3, rejected: [], ex: null, phase: "finally" });
    }
  }
  if (out.join("\n") !== BANK_OUTPUT.join("\n")) throw new Error(`unwinding: the model printed ${JSON.stringify(out)}`);
  return snaps;
}

function unwinding(): Walkthrough {
  const snaps = runBank();
  const ROWS = ["try { left = acct.withdraw(amount) … }", "catch (InsufficientFundsError e) { … }", "catch (BankError e) { … }", "finally { print the audit line }"];
  const SW = 150;
  const HX = SW + 26;
  const HW = 274;
  const RH = 24;
  const rowY = (r: number) => 12 + r * (RH + 6);
  const EY = 160;
  const draw = (s: (typeof snaps)[number]): Item[] => {
    const items: Item[] = [...region("stk", -8, -14, SW + 16, 150, "call stack"), ...region("try", HX - 8, -14, HW + 16, 150, "main's try statement")];
    // The stack grows upwards: main at the bottom, withdraw on top of it while it runs.
    const top = s.stack.length > 1;
    items.push(box("f-main", 0, 70, "", { w: SW, h: 44 }), label("f-main-t", "main()", 8, 82, { anchor: "start", tone: "ink", size: 12, weight: 700 }), label("f-main-v", `i = ${s.i}, amount = ${s.amount}`, 8, 101, { anchor: "start", size: 11, mono: true, tone: "ink" }));
    if (top) {
      const thrown = s.phase === "thrown";
      items.push(box(`f-w${s.i}`, 0, 12, "", { w: SW, h: 44, tone: thrown ? "error" : "accent" }), label(`f-w${s.i}-t`, "Account.withdraw()", 8, 24, { anchor: "start", tone: "ink", size: 12, weight: 700 }), label(`f-w${s.i}-v`, `amount = ${s.amount}`, 8, 43, { anchor: "start", size: 11, mono: true, tone: "ink" }));
    }
    ROWS.forEach((r, k) => {
      const tone: Tone = s.rejected.includes(k) ? "error" : k === s.row ? "accent" : "plain";
      items.push(box(`r${k}`, HX, rowY(k), "", { w: HW, h: RH, tone }));
      items.push({ k: "text", id: `r${k}-t`, x: HX + 8, y: rowY(k) + RH / 2, text: r, tone: tone === "error" ? "error" : "ink", anchor: "start", size: 11, mono: true });
    });
    // The account, on the heap.
    items.push(...objectRows("acct", 0, EY, "acct: Account", [`balance = ${s.acct.balance}`, `frozen = ${s.acct.frozen}`], SW, "plain"));
    if (s.ex) {
      const caught = s.phase === "caught";
      items.push(...objectRows(`ex-${s.i}`, HX, EY, s.ex.type, s.ex.rows, HW, caught ? "accent" : "error"));
      // Arrows run in the gutters: the throw down between the two regions, the landing up the right-hand side.
      const gx = SW + 13;
      if (s.phase === "thrown") items.push({ k: "path", id: `throw-${s.i}`, pts: [[SW + 1, 34], [gx, 34], [gx, EY + 22]], tone: "error", width: 2 }, arrow(`throw-${s.i}h`, { x: gx, y: EY + 22 }, { x: HX - 1, y: EY + 22 }, { tone: "error" }));
      const rx = HX + HW + 16;
      if (caught) items.push({ k: "path", id: `land-${s.i}`, pts: [[HX + HW + 1, EY + 12], [rx, EY + 12], [rx, rowY(s.row) + RH / 2]], tone: "accent", width: 2 }, arrow(`land-${s.i}h`, { x: rx, y: rowY(s.row) + RH / 2 }, { x: HX + HW + 1, y: rowY(s.row) + RH / 2 }, { tone: "accent" }));
    }
    items.push(label("out-h", "output", 0, 248, { anchor: "start", size: 11, weight: 600 }));
    s.out.forEach((t, k) => items.push({ k: "text", id: `o${k}`, x: 0, y: 266 + k * 16, text: t, tone: k >= s.fresh ? "accent" : "ink", anchor: "start", size: 11, mono: true }));
    return items;
  };
  const caption = (s: (typeof snaps)[number]): string => {
    const n = s.i + 1;
    switch (s.phase) {
      case "call":
        return s.i === 2
          ? `Attempt ${n}: the account has been frozen, and withdraw(${s.amount}) is called. A new frame for withdraw goes on top of main's.`
          : `Attempt ${n}: main calls acct.withdraw(${s.amount}) inside the try block, and a frame for withdraw goes on top of main's.`;
      case "returned":
        return `withdraw returns normally with the balance, ${s.acct.balance}; its frame is popped, the try block prints, and both catch blocks are skipped.`;
      case "thrown":
        return s.ex!.type === "InsufficientFundsError"
          ? `${s.amount} is more than the balance of ${s.acct.balance}, so withdraw throws an InsufficientFundsError carrying both numbers. Normal execution stops at once.`
          : `withdraw sees the frozen account and throws an AccountFrozenError. Its message names the account; it has no numbers to carry.`;
      case "caught":
        return s.rejected.length
          ? `withdraw's frame is unwound. The first handler wants an InsufficientFundsError, which this is not; the second, for BankError, matches because AccountFrozenError is a BankError.`
          : `The runtime unwinds withdraw's frame and tries main's handlers in order. The first, for InsufficientFundsError, matches, and reads needed and available off the object.`;
      default:
        return s.i === 0
          ? `The finally block runs after the try block too, logging attempt ${n}. It runs on every path out of the try statement.`
          : s.i === 1
            ? `With the exception handled, finally runs and logs attempt ${n}; then the loop carries on as if nothing had happened.`
            : `finally logs attempt ${n}. Three attempts, three different paths, and the audit line printed after every one.`;
    }
  };
  const frames: Frame[] = snaps.map((s) => ({ caption: caption(s), items: draw(s) }));
  return finish({ title: "An exception unwinding the call stack to the first matching handler", input: "the note's bank program (Java): withdraw 300, 5000, then 100 from a frozen account", frames });
}

/** An object on the heap: a header and rows, as a cell with text items (so rows can be long and left-aligned). */
function objectRows(id: string, x: number, y: number, title: string, rows: readonly string[], w: number, tone: Tone): Item[] {
  const h = 22 + rows.length * 20 + 4;
  const items: Item[] = [{ k: "cell", id, x, y, w, h, text: "", tone }];
  items.push({ k: "text", id: `${id}-n`, x: x + w / 2, y: y + 12, text: title, tone: "ink", anchor: "middle", size: 12, mono: false, weight: 700 });
  items.push({ k: "path", id: `${id}-d`, pts: [[x, y + 22], [x + w, y + 22]], tone: "line", width: 1 });
  rows.forEach((r, k) => items.push({ k: "text", id: `${id}-r${k}`, x: x + 8, y: y + 22 + 2 + 10 + k * 20, text: r, tone: "ink", anchor: "start", size: 11.5, mono: true }));
  return items;
}

/* ── try-paths: the four ways through a try statement ─────────────── */

function tryPaths(): Walkthrough {
  // The Python version's statement: try / except InsufficientFundsError / except BankError / else / finally.
  const NODES = [
    { id: "try", text: "try: left = acct.withdraw(amount)" },
    { id: "h0", text: "except InsufficientFundsError as e:", type: "InsufficientFundsError" },
    { id: "h1", text: "except BankError as e:", type: "BankError" },
    { id: "else", text: "else: print ok" },
    { id: "finally", text: "finally: print audit line" },
    { id: "next", text: "next statement" },
  ] as const;
  type Path = { visited: string[]; rejected: string[]; escapes: boolean };
  /** The interpreter's rule, run: a raised exception tries each except in order; none raised runs else; finally always; an unmatched one leaves the statement. */
  const run = (raised: string | null): Path => {
    const visited = ["try"];
    const rejected: string[] = [];
    let escapes = false;
    if (raised === null) visited.push("else");
    else {
      const h = NODES.filter((n) => "type" in n).find((n) => {
        const ok = isA(PY_PARENT, raised, (n as { type: string }).type);
        if (!ok) rejected.push(n.id);
        return ok;
      });
      if (h) visited.push(h.id);
      else escapes = true;
    }
    visited.push("finally");
    visited.push(escapes ? "out" : "next");
    return { visited, rejected, escapes };
  };
  const cases = [
    { raised: null, what: "withdraw(300) returns normally", prints: ["withdraw 300: ok, balance 700", "audit: attempt 1 logged"] },
    { raised: "InsufficientFundsError", what: "withdraw(5000) raises InsufficientFundsError", prints: ["withdraw 5000: need 5000, have 700", "audit: attempt 2 logged"] },
    { raised: "AccountFrozenError", what: "withdraw(100) raises AccountFrozenError", prints: ["withdraw 100: bank error: account ACC-7 is frozen", "audit: attempt 3 logged"] },
    { raised: "TypeError", what: "a bug raises TypeError", prints: ["the audit line prints, then the TypeError carries on upwards"] },
  ] as const;
  const paths = cases.map((c) => run(c.raised));
  if (paths[0].visited.join() !== "try,else,finally,next" || paths[2].rejected.join() !== "h0" || !paths[3].escapes || paths[3].rejected.length !== 2) throw new Error("try-paths: the paths disagree with Python's rules");
  for (let k = 0; k < 3; k++) if (cases[k].prints[0] !== BANK_OUTPUT[k * 2]) throw new Error("try-paths: a printed line disagrees with the note's output");

  const W = 252;
  const H = 26;
  const STEP = 42;
  const yOf = (id: string) => (id === "out" ? 5 : NODES.findIndex((n) => n.id === id)) * STEP;
  const OUTX = W + 40;
  const draw = (k: number): Item[] => {
    const p = paths[k];
    const items: Item[] = [label("case", cases[k].what, 0, -24, { anchor: "start", size: 12, tone: "ink", weight: 600 })];
    for (const n of NODES) {
      const on = p.visited.includes(n.id);
      const tone: Tone = p.rejected.includes(n.id) ? "error" : on ? "accent" : "muted";
      items.push(box(n.id, 0, yOf(n.id), n.text, { w: W, h: H, size: 11, tone }));
    }
    items.push(box("out", OUTX, yOf("out"), "propagates to the caller", { w: 180, h: H, size: 11, tone: p.escapes ? "error" : "muted" }));
    // The path, as arrows between consecutive steps; a jump over boxes bows out on the left, leaving the right for "no match".
    const steps = [...p.visited];
    for (let s = 0; s + 1 < steps.length; s++) {
      const a = steps[s];
      const b = steps[s + 1];
      const ya = yOf(a);
      const yb = yOf(b);
      const tone: LineTone = p.escapes && b === "out" ? "error" : "accent";
      if (b === "out") items.push(arrow(`p${s}`, { x: W + 2, y: ya + H / 2 }, { x: OUTX + 40, y: yb - 1 }, { tone }));
      else if (yb - ya === STEP) items.push(arrow(`p${s}`, { x: W / 2, y: ya + H + 1 }, { x: W / 2, y: yb - 1 }, { tone }));
      else items.push(arrow(`p${s}`, { x: -2, y: ya + H / 2 }, { x: -2, y: yb + H / 2 }, { tone, bow: Math.min(60, 14 + (yb - ya) / 6) }));
    }
    for (const r of p.rejected) items.push(label(`x-${r}`, "no match", W + 10, yOf(r) + H / 2, { anchor: "start", size: 11, tone: "error", weight: 600 }));
    cases[k].prints.forEach((t, i) => items.push({ k: "text", id: `pr${i}`, x: 0, y: yOf("next") + H + 24 + i * 16, text: t, tone: "ink", anchor: "start", size: 11, mono: true }));
    return items;
  };
  const frames: Frame[] = [
    { caption: "Nothing is raised: the try block finishes, both except clauses are skipped, else prints the success line, finally logs the attempt, and execution carries on.", items: draw(0) },
    { caption: "InsufficientFundsError is raised: the first except clause matches, else is skipped because something was raised, and finally still runs.", items: draw(1) },
    { caption: "AccountFrozenError is raised: it fails the first except, which wants a different subclass, and matches the second because it is a BankError. finally runs again.", items: draw(2) },
    { caption: "An exception nobody here handles, such as a TypeError from a bug: no except matches, finally runs anyway, and the exception leaves the statement for the caller to handle.", items: draw(3) },
  ];
  return finish({ title: "The four ways through try, except, else and finally", input: "the Python version of the bank program's try statement", frames });
}

/* ── java-hierarchy: checked and unchecked ────────────────────────── */

function javaHierarchy(): Walkthrough {
  const kids = (t: string) => Object.keys(JAVA_PARENT).filter((c) => JAVA_PARENT[c] === t && c !== "IllegalStateException");
  // Pre-order rows, as the indented outline the note used to print.
  const rows: Array<{ t: string; depth: number }> = [];
  const walk = (t: string, depth: number) => {
    rows.push({ t, depth });
    kids(t).forEach((c) => walk(c, depth + 1));
  };
  walk("Throwable", 0);
  const IND = 22;
  const RH = 24;
  const STEP = 28;
  const BW = 196;
  const items: Item[] = [];
  const yOf = (i: number) => i * STEP;
  rows.forEach((r, i) => {
    // The connector: down from the parent's column, then across to this row.
    if (r.depth > 0) {
      const p = rows.findIndex((q) => q.t === JAVA_PARENT[r.t]);
      const x = (r.depth - 1) * IND + 9;
      items.push({ k: "path", id: `c${i}`, pts: [[x, yOf(p) + RH], [x, yOf(i) + RH / 2], [r.depth * IND, yOf(i) + RH / 2]], tone: "line", width: 1.2 });
    }
  });
  rows.forEach((r, i) => {
    const ck = checked(r.t);
    const ours = isA(JAVA_PARENT, r.t, "BankError");
    items.push(box(`n${i}`, r.depth * IND, yOf(i), r.t, { w: BW, h: RH, size: 11, tone: ck ? "accent" : "plain" }));
    items.push(label(`k${i}`, `${ck ? "checked" : "unchecked"}${ours ? " · the note's" : ""}`, 4 * IND + BW + 14, yOf(i) + RH / 2, { anchor: "start", size: 11, tone: ck ? "accent" : "soft", weight: ck ? 600 : undefined }));
  });
  const nChecked = rows.filter((r) => checked(r.t)).length;
  if (!checked("IOException") || checked("NullPointerException") || checked("OutOfMemoryError") || !checked("Exception")) throw new Error("java-hierarchy: Java's checked rule went wrong");
  return finish({
    title: "Java's exception hierarchy: checked and unchecked",
    input: "",
    frames: [
      {
        caption: `Everything thrown is a Throwable. RuntimeException, Error and everything under them are unchecked; the rest — ${nChecked} of these ${rows.length}, Exception and IOException among them — are checked, so a method must catch them or declare them with throws.`,
        items,
      },
    ],
  });
}

/* ── resources-close: try-with-resources ──────────────────────────── */

const RESOURCE_OUTPUT = ["open db", "open file", "working", "close file", "close db", "caught: disk full"];

function resourcesClose(): Walkthrough {
  // try (Resource db = …; Resource file = …) { working; throw } catch (IllegalStateException e) { … }
  const open: string[] = [];
  const out: string[] = [];
  type Snap = { open: string[]; closing?: string; ex: boolean; caught: boolean; out: string[] };
  const snaps: Snap[] = [];
  const snap = (s: Partial<Snap> = {}) => snaps.push({ open: [...open], ex: false, caught: false, out: [...out], ...s });
  for (const name of ["db", "file"]) {
    open.push(name);
    out.push(`open ${name}`);
    snap();
  }
  out.push("working");
  const thrown = { type: "IllegalStateException", message: "disk full" };
  snap({ ex: true });
  // The block is left by the throw: resources close in reverse order of opening, before any catch.
  while (open.length) {
    const r = open.pop()!;
    out.push(`close ${r}`);
    snap({ ex: true, closing: r });
  }
  if (!isA(JAVA_PARENT, thrown.type, "IllegalStateException")) throw new Error("resources-close: the handler should match");
  out.push(`caught: ${thrown.message}`);
  snap({ ex: true, caught: true });
  if (out.join("\n") !== RESOURCE_OUTPUT.join("\n")) throw new Error(`resources-close: the model printed ${JSON.stringify(out)}`);

  const RX = 0;
  const RW = 120;
  const EX = RW + 50;
  const slotY = (k: number) => 70 - k * 36;
  const draw = (s: Snap): Item[] => {
    const items: Item[] = [...region("res", RX - 8, -14, RW + 16, 130, "open resources")];
    const shown = s.closing ? [...s.open, s.closing] : s.open;
    shown.forEach((r, k) => items.push(box(`r-${r}`, RX, slotY(k), r === s.closing ? `${r}: closing` : r, { w: RW, h: 28, size: 12, tone: r === s.closing ? "muted" : "accent" })));
    if (s.ex) {
      items.push(...objectRows("ex", EX, 20, thrown.type, [`message = "${thrown.message}"`], 200, s.caught ? "accent" : "error"));
      items.push(label("ex-s", s.caught ? "now the catch block runs" : "waits while the resources close", EX + 100, 90, { size: 11, tone: s.caught ? "accent" : "error", weight: 600 }));
    }
    items.push(label("out-h", "output", 0, 136, { anchor: "start", size: 11, weight: 600 }));
    s.out.forEach((t, k) => items.push({ k: "text", id: `o${k}`, x: 0, y: 154 + k * 16, text: t, tone: k === s.out.length - 1 ? "accent" : "ink", anchor: "start", size: 11, mono: true }));
    return items;
  };
  const frames: Frame[] = [
    { caption: "try-with-resources opens db first. A resource is any object implementing AutoCloseable.", items: draw(snaps[0]) },
    { caption: "Then file, on top of db. The block works with both, and they will be closed in the reverse of this order.", items: draw(snaps[1]) },
    { caption: "The block throws an IllegalStateException. Before any handler is looked at, the block must be left, which means closing what it opened.", items: draw(snaps[2]) },
    { caption: "file, opened last, is closed first — exactly as C++ destroys local objects in reverse order of construction.", items: draw(snaps[3]) },
    { caption: "Then db. Had close() itself thrown here, Java would keep the original exception and attach the new one as suppressed.", items: draw(snaps[4]) },
    { caption: "Only now does the catch block run, with both resources already closed. Python's with statement and C++'s RAII destructors give the same order.", items: draw(snaps[5]) },
  ];
  return finish({ title: "try-with-resources closes in reverse order, before the handler runs", input: 'try (Resource db = new Resource("db"); Resource file = new Resource("file"))', frames });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "bank-errors": bankErrors,
  unwinding,
  "try-paths": tryPaths,
  "java-hierarchy": javaHierarchy,
  "resources-close": resourcesClose,
};

