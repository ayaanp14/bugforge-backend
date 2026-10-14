// Before any import: grantAccess tracks an event, and a real write would open
// a database pool that keeps this process alive after the last test.
process.env["TELEMETRY_DISABLED"] = "true";

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { applyWebhookEvent, grantAccess, type BillingDb } from "./billing.js";
import { parseWebhook, verifyWebhook } from "./cashfree.js";
import crypto from "node:crypto";

/**
 * The money path, end to end, on an in-memory copy of the two tables it
 * touches. The fake implements exactly the Prisma calls services/billing.ts
 * makes — no more — so a new call there fails here first.
 */

interface OrderRow {
  id: string;
  userId: string;
  planId: string;
  period: string;
  amount: number;
  status: string;
  providerPaymentId: string | null;
  raw: unknown;
}

interface SubRow {
  id: string;
  userId: string;
  planId: string;
  period: string;
  status: string;
  startedAt: Date;
  currentPeriodEnd: Date;
  orderId: string | null;
}

interface GrantRow {
  id: string;
  userId: string;
  credits: number;
  source: string;
  orderId: string | null;
}

function fakeDb(orders: OrderRow[], subs: SubRow[] = [], grants: GrantRow[] = []): BillingDb & { orders: OrderRow[]; subs: SubRow[]; grants: GrantRow[] } {
  let seq = 1;
  const matches = (row: Record<string, unknown>, where: Record<string, unknown>): boolean =>
    Object.entries(where).every(([k, v]) => {
      const actual = row[k];
      if (v && typeof v === "object" && !(v instanceof Date)) {
        const cond = v as { in?: unknown[]; gt?: Date };
        if (cond.in) return cond.in.includes(actual);
        if (cond.gt) return (actual as Date) > cond.gt;
      }
      return actual === v;
    });

  const db = {
    orders,
    subs,
    grants,
    creditGrant: {
      async create({ data }: any) {
        // The unique orderId, as the schema enforces it.
        if (data.orderId && grants.some((g) => g.orderId === data.orderId)) throw Object.assign(new Error("dup"), { code: "P2002" });
        const g = { id: `g_${seq++}`, ...data };
        grants.push(g);
        return g;
      },
      async deleteMany({ where }: any) {
        const before = grants.length;
        for (let i = grants.length - 1; i >= 0; i--) if (grants[i]!.orderId === where.orderId) grants.splice(i, 1);
        return { count: before - grants.length };
      },
    },
    paymentOrder: {
      async updateMany({ where, data }: any) {
        const hit = orders.filter((o) => matches(o as any, where));
        for (const o of hit) Object.assign(o, data);
        return { count: hit.length };
      },
      async findUnique({ where }: any) {
        return orders.find((o) => o.id === where.id) ?? null;
      },
    },
    subscription: {
      async findMany({ where, orderBy }: any) {
        const hit = subs.filter((s) => matches(s as any, where));
        if (orderBy?.currentPeriodEnd === "desc") hit.sort((a, b) => b.currentPeriodEnd.getTime() - a.currentPeriodEnd.getTime());
        return hit;
      },
      async findFirst({ where, orderBy }: any) {
        const hit = subs.filter((s) => matches(s as any, where));
        if (orderBy?.currentPeriodEnd === "desc") hit.sort((a, b) => b.currentPeriodEnd.getTime() - a.currentPeriodEnd.getTime());
        return hit[0] ?? null;
      },
      async update({ where, data }: any) {
        const s = subs.find((x) => x.id === where.id)!;
        Object.assign(s, data);
        return s;
      },
      async create({ data }: any) {
        const s = { id: `sub_${seq++}`, ...data };
        subs.push(s);
        return s;
      },
      async updateMany({ where, data }: any) {
        const hit = subs.filter((s) => matches(s as any, where));
        for (const s of hit) Object.assign(s, data);
        return { count: hit.length };
      },
    },
  };
  return db as unknown as BillingDb & { orders: OrderRow[]; subs: SubRow[]; grants: GrantRow[] };
}

const order = (over: Partial<OrderRow> = {}): OrderRow => ({
  id: "ck_1",
  userId: "u1",
  planId: "pro",
  period: "monthly",
  amount: 499,
  status: "created",
  providerPaymentId: null,
  raw: null,
  ...over,
});

const DAY = 86_400_000;

describe("grantAccess", () => {
  it("marks the order paid and starts a subscription", async () => {
    const db = fakeDb([order()]);
    assert.equal(await grantAccess(db, "ck_1", "pay_9", { any: true }), true);
    assert.equal(db.orders[0].status, "paid");
    assert.equal(db.orders[0].providerPaymentId, "pay_9");
    assert.equal(db.subs.length, 1);
    assert.equal(db.subs[0].planId, "pro");
    assert.equal(db.subs[0].status, "active");
    assert.equal(db.subs[0].orderId, "ck_1");
    const days = (db.subs[0].currentPeriodEnd.getTime() - db.subs[0].startedAt.getTime()) / DAY;
    assert.ok(days >= 28 && days <= 31, `a month, got ${days} days`);
  });

  it("is idempotent: a second delivery of the same webhook grants nothing", async () => {
    const db = fakeDb([order()]);
    assert.equal(await grantAccess(db, "ck_1", "pay_9", {}), true);
    assert.equal(await grantAccess(db, "ck_1", "pay_9", {}), false);
    assert.equal(db.subs.length, 1);
  });

  it("refuses an order it never created", async () => {
    const db = fakeDb([]);
    assert.equal(await grantAccess(db, "ck_unknown", null, {}), false);
    assert.equal(db.subs.length, 0);
  });

  it("claims a failed order that was later paid on retry", async () => {
    const db = fakeDb([order({ status: "failed" })]);
    assert.equal(await grantAccess(db, "ck_1", "pay_2", {}), true);
    assert.equal(db.subs.length, 1);
  });

  it("extends a running subscription of the same plan instead of replacing it", async () => {
    const started = new Date(Date.now() - 10 * DAY);
    const end = new Date(Date.now() + 20 * DAY);
    const db = fakeDb([order()], [{ id: "sub_old", userId: "u1", planId: "pro", period: "monthly", status: "active", startedAt: started, currentPeriodEnd: end, orderId: "ck_0" }]);
    assert.equal(await grantAccess(db, "ck_1", null, {}), true);
    assert.equal(db.subs.length, 1);
    assert.equal(db.subs[0].orderId, "ck_1");
    assert.ok(db.subs[0].currentPeriodEnd > end, "period end moved later");
  });

  it("pauses a running Pro under a Pro Max bought on top, so its days are not lost", async () => {
    const proEnd = new Date(Date.now() + 5 * DAY);
    const db = fakeDb([order({ planId: "max", period: "max-monthly", amount: 399 })], [{ id: "sub_old", userId: "u1", planId: "pro", period: "pro-monthly", status: "active", startedAt: new Date(), currentPeriodEnd: proEnd, orderId: "ck_0" }]);
    assert.equal(await grantAccess(db, "ck_1", null, {}), true);
    const pro = db.subs.find((s) => s.id === "sub_old")!;
    const max = db.subs.find((s) => s.planId === "max")!;
    assert.equal(pro.status, "active", "Pro is paused, not cancelled");
    assert.equal(max.status, "active");
    assert.ok(pro.currentPeriodEnd.getTime() - proEnd.getTime() > 27 * DAY, "Pro's end moved out by the month bought");
    assert.ok(pro.currentPeriodEnd > max.currentPeriodEnd, "Pro resumes after Max ends");
  });

  it("pays Pro Max's bonus credits into the wallet once", async () => {
    const db = fakeDb([order({ planId: "max", period: "max-quarterly", amount: 999 })]);
    assert.equal(await grantAccess(db, "ck_1", null, {}), true);
    assert.equal(await grantAccess(db, "ck_1", null, {}), false);
    assert.equal(db.grants.length, 1);
    assert.equal(db.grants[0].credits, 150);
    assert.equal(db.subs.length, 1);
  });

  it("runs a pass for its own length and adds it to a running Pro", async () => {
    const db = fakeDb([order({ period: "sprint", amount: 99 })]);
    assert.equal(await grantAccess(db, "ck_1", null, {}), true);
    const days = (db.subs[0].currentPeriodEnd.getTime() - db.subs[0].startedAt.getTime()) / DAY;
    assert.ok(Math.abs(days - 7) < 0.01, `seven days, got ${days}`);

    const end = new Date(Date.now() + 20 * DAY);
    const running = fakeDb([order({ period: "season", amount: 699 })], [{ id: "sub_old", userId: "u1", planId: "pro", period: "pro-monthly", status: "active", startedAt: new Date(), currentPeriodEnd: end, orderId: "ck_0" }]);
    assert.equal(await grantAccess(running, "ck_1", null, {}), true);
    assert.equal(running.subs.length, 1, "the pass extends the running plan");
    assert.ok(running.subs[0].currentPeriodEnd.getTime() - end.getTime() > 170 * DAY, "six months added to the end");
  });

  it("continues the old Starter as Pro instead of discarding its days", async () => {
    const end = new Date(Date.now() + 10 * DAY);
    const db = fakeDb([order({ period: "pro-monthly", amount: 149 })], [{ id: "sub_old", userId: "u1", planId: "starter", period: "monthly", status: "active", startedAt: new Date(), currentPeriodEnd: end, orderId: "ck_0" }]);
    assert.equal(await grantAccess(db, "ck_1", null, {}), true);
    assert.equal(db.subs.length, 1);
    assert.equal(db.subs[0].planId, "pro");
    assert.ok(db.subs[0].currentPeriodEnd > end);
  });

  it("adds a credit pack to the wallet once, without touching any plan", async () => {
    const db = fakeDb([order({ planId: "credits", period: "credits-300", amount: 249 })]);
    assert.equal(await grantAccess(db, "ck_1", null, {}), true);
    assert.equal(await grantAccess(db, "ck_1", null, {}), false);
    assert.equal(db.subs.length, 0);
    assert.equal(db.grants.length, 1);
    assert.equal(db.grants[0].credits, 300);
    assert.equal(db.grants[0].orderId, "ck_1");
  });

  it("grants nothing for a credit order naming no pack", async () => {
    const db = fakeDb([order({ planId: "credits", period: "credits-5" })]);
    assert.equal(await grantAccess(db, "ck_1", null, {}), false);
    assert.equal(db.grants.length, 0);
  });

  it("ignores an expired subscription when deciding whether to extend", async () => {
    const db = fakeDb([order()], [{ id: "sub_old", userId: "u1", planId: "pro", period: "monthly", status: "active", startedAt: new Date(Date.now() - 60 * DAY), currentPeriodEnd: new Date(Date.now() - 30 * DAY), orderId: "ck_0" }]);
    assert.equal(await grantAccess(db, "ck_1", null, {}), true);
    assert.equal(db.subs.length, 2, "a fresh subscription, not an extension of the dead one");
  });
});

describe("applyWebhookEvent", () => {
  it("routes SUCCESS, duplicate SUCCESS, FAILED and refund events", async () => {
    const db = fakeDb([order()]);
    const success = parseWebhook({ type: "PAYMENT_SUCCESS_WEBHOOK", data: { order: { order_id: "ck_1" }, payment: { payment_status: "SUCCESS", cf_payment_id: 123 } } });
    assert.equal(await applyWebhookEvent(db, success), "granted");
    assert.equal(await applyWebhookEvent(db, success), "duplicate");
    assert.equal(db.orders[0].providerPaymentId, "123");

    const refund = parseWebhook({ type: "REFUND_STATUS_WEBHOOK", data: { refund: { order_id: "ck_1", refund_status: "SUCCESS", cf_payment_id: 123 } } });
    assert.equal(await applyWebhookEvent(db, refund), "refunded");
    assert.equal(db.orders[0].status, "refunded");
    assert.equal(db.subs[0].status, "cancelled");
  });

  it("takes a refunded credit pack's credits back", async () => {
    const db = fakeDb([order({ planId: "credits", period: "credits-100", amount: 99 })]);
    const success = parseWebhook({ type: "PAYMENT_SUCCESS_WEBHOOK", data: { order: { order_id: "ck_1" }, payment: { payment_status: "SUCCESS", cf_payment_id: 7 } } });
    assert.equal(await applyWebhookEvent(db, success), "granted");
    assert.equal(db.grants.length, 1);
    const refund = parseWebhook({ type: "REFUND_STATUS_WEBHOOK", data: { refund: { order_id: "ck_1", refund_status: "SUCCESS", cf_payment_id: 7 } } });
    assert.equal(await applyWebhookEvent(db, refund), "refunded");
    assert.equal(db.grants.length, 0);
  });

  it("marks a created order failed and leaves a paid one alone", async () => {
    const db = fakeDb([order({ id: "ck_a" }), order({ id: "ck_b", status: "paid" })]);
    const failed = (id: string) => parseWebhook({ type: "PAYMENT_FAILED_WEBHOOK", data: { order: { order_id: id }, payment: { payment_status: "FAILED" } } });
    assert.equal(await applyWebhookEvent(db, failed("ck_a")), "failed");
    assert.equal(await applyWebhookEvent(db, failed("ck_b")), "failed");
    assert.equal(db.orders[0].status, "failed");
    assert.equal(db.orders[1].status, "paid");
  });

  it("ignores events without an order or with a status it does not act on", async () => {
    const db = fakeDb([order()]);
    assert.equal(await applyWebhookEvent(db, parseWebhook({ type: "X" })), "ignored");
    assert.equal(await applyWebhookEvent(db, parseWebhook({ type: "X", data: { order: { order_id: "ck_1" }, payment: { payment_status: "USER_DROPPED" } } })), "ignored");
    assert.equal(db.orders[0].status, "created");
  });
});

describe("verifyWebhook", () => {
  const secret = "test-secret";
  beforeEach(() => {
    process.env["CASHFREE_SECRET_KEY"] = secret;
  });
  const sign = (timestamp: string, body: string) => crypto.createHmac("sha256", secret).update(`${timestamp}${body}`).digest("base64");

  it("accepts the exact bytes Cashfree signed and nothing else", () => {
    const body = '{"type":"PAYMENT_SUCCESS_WEBHOOK","data":{"order":{"order_id":"ck_1"}}}';
    const ts = "1757500000";
    assert.equal(verifyWebhook(Buffer.from(body), sign(ts, body), ts), true);
    // Re-serialised JSON (different whitespace) must fail.
    assert.equal(verifyWebhook(Buffer.from(body.replace('":{', '": {')), sign(ts, body), ts), false);
    // A replayed body with a fresh timestamp must fail.
    assert.equal(verifyWebhook(Buffer.from(body), sign(ts, body), "1757500001"), false);
    // Missing pieces never verify.
    assert.equal(verifyWebhook(Buffer.from(body), "", ts), false);
    assert.equal(verifyWebhook(Buffer.from(body), sign(ts, body), ""), false);
  });

  it("rejects everything when no secret is configured", () => {
    delete process.env["CASHFREE_SECRET_KEY"];
    delete process.env["CASHFREE_APP_SECRET"];
    assert.equal(verifyWebhook("{}", "abc", "1"), false);
  });
});
