import { defineModule } from "../../dsl.js";

const BANK_A = String.raw`CREATE TABLE accounts (
  id INT PRIMARY KEY,
  owner VARCHAR(40) NOT NULL,
  balance INT NOT NULL
);
INSERT INTO accounts VALUES (1, 'Asha', 1200), (2, 'Ravi', 300), (3, 'Lee', 50);
CREATE TABLE transfers (
  from_id INT NOT NULL,
  to_id INT NOT NULL,
  amount INT NOT NULL,
  made_on DATE NOT NULL
);
INSERT INTO transfers VALUES (3, 1, 100, '2024-06-01');
`;

const BANK_B = String.raw`CREATE TABLE accounts (
  id INT PRIMARY KEY,
  owner VARCHAR(40) NOT NULL,
  balance INT NOT NULL
);
INSERT INTO accounts VALUES (2, 'Ravi', 0), (1, 'Asha', 500);
CREATE TABLE transfers (
  from_id INT NOT NULL,
  to_id INT NOT NULL,
  amount INT NOT NULL,
  made_on DATE NOT NULL
);
`;

const BANK_C = String.raw`CREATE TABLE accounts (
  id INT PRIMARY KEY,
  owner VARCHAR(40) NOT NULL,
  balance INT NOT NULL
);
INSERT INTO accounts VALUES (1, 'Meera', 9000), (2, 'Kiran', 750), (4, 'Zoya', 10);
CREATE TABLE transfers (
  from_id INT NOT NULL,
  to_id INT NOT NULL,
  amount INT NOT NULL,
  made_on DATE NOT NULL
);
INSERT INTO transfers VALUES (2, 4, 40, '2024-06-03'), (1, 2, 250, '2024-05-30');
`;

const SHOP_A = String.raw`CREATE TABLE products (id INT PRIMARY KEY, name VARCHAR(40) NOT NULL, stock INT NOT NULL);
INSERT INTO products VALUES (1, 'Notebook', 40), (2, 'Pen', 120), (3, 'Backpack', 6);
CREATE TABLE orders (id INT PRIMARY KEY, customer VARCHAR(40) NOT NULL, placed_on DATE NOT NULL);
INSERT INTO orders VALUES (100, 'ravi', '2024-05-01');
CREATE TABLE order_items (order_id INT NOT NULL, product_id INT NOT NULL, qty INT NOT NULL);
INSERT INTO order_items VALUES (100, 2, 10);
`;

const SHOP_B = String.raw`CREATE TABLE products (id INT PRIMARY KEY, name VARCHAR(40) NOT NULL, stock INT NOT NULL);
INSERT INTO products VALUES (1, 'Notebook', 2), (3, 'Backpack', 1);
CREATE TABLE orders (id INT PRIMARY KEY, customer VARCHAR(40) NOT NULL, placed_on DATE NOT NULL);
CREATE TABLE order_items (order_id INT NOT NULL, product_id INT NOT NULL, qty INT NOT NULL);
`;

const SHOP_C = String.raw`CREATE TABLE products (id INT PRIMARY KEY, name VARCHAR(40) NOT NULL, stock INT NOT NULL);
INSERT INTO products VALUES (3, 'Backpack', 50), (1, 'Notebook', 500), (2, 'Pen', 7), (4, 'Ruler', 30);
CREATE TABLE orders (id INT PRIMARY KEY, customer VARCHAR(40) NOT NULL, placed_on DATE NOT NULL);
INSERT INTO orders VALUES (99, 'lee', '2024-04-30'), (102, 'zoya', '2024-05-03');
CREATE TABLE order_items (order_id INT NOT NULL, product_id INT NOT NULL, qty INT NOT NULL);
INSERT INTO order_items VALUES (99, 1, 3), (99, 3, 1), (102, 4, 2);
`;

const SCHED = (rows: string) => String.raw`CREATE TABLE schedule (
  step INT PRIMARY KEY,
  txn VARCHAR(5) NOT NULL,
  action VARCHAR(10) NOT NULL,
  item VARCHAR(5),
  seen_value INT
);
INSERT INTO schedule VALUES
${rows};
`;

const SCHED_A = SCHED(String.raw`  (1, 'T1', 'begin', NULL, NULL),
  (2, 'T2', 'begin', NULL, NULL),
  (3, 'T2', 'write', 'A', 0),
  (4, 'T1', 'read', 'A', 0),
  (5, 'T2', 'rollback', NULL, NULL),
  (6, 'T1', 'read', 'A', 1000),
  (7, 'T3', 'begin', NULL, NULL),
  (8, 'T3', 'write', 'B', 50),
  (9, 'T3', 'commit', NULL, NULL),
  (10, 'T1', 'read', 'B', 50),
  (11, 'T1', 'commit', NULL, NULL)`);

const SCHED_B = SCHED(String.raw`  (1, 'T1', 'begin', NULL, NULL),
  (2, 'T1', 'write', 'X', 5),
  (3, 'T1', 'read', 'X', 5),
  (4, 'T2', 'begin', NULL, NULL),
  (5, 'T2', 'read', 'X', 5),
  (6, 'T3', 'begin', NULL, NULL),
  (7, 'T3', 'read', 'X', 5),
  (8, 'T1', 'commit', NULL, NULL),
  (9, 'T2', 'read', 'X', 5),
  (10, 'T4', 'begin', NULL, NULL),
  (11, 'T4', 'write', 'Y', 1),
  (12, 'T2', 'read', 'Y', 1),
  (13, 'T4', 'commit', NULL, NULL)`);

const SCHED_C = SCHED(String.raw`  (1, 'T1', 'begin', NULL, NULL),
  (2, 'T1', 'read', 'A', 10),
  (3, 'T2', 'begin', NULL, NULL),
  (4, 'T2', 'write', 'A', 20),
  (5, 'T2', 'commit', NULL, NULL),
  (6, 'T1', 'read', 'A', 20),
  (7, 'T1', 'commit', NULL, NULL)`);

const NR_A = SCHED(String.raw`  (1, 'T1', 'begin', NULL, NULL),
  (2, 'T1', 'read', 'A', 1000),
  (3, 'T2', 'begin', NULL, NULL),
  (4, 'T2', 'write', 'A', 700),
  (5, 'T2', 'commit', NULL, NULL),
  (6, 'T1', 'read', 'A', 700),
  (7, 'T1', 'read', 'B', 40),
  (8, 'T3', 'begin', NULL, NULL),
  (9, 'T3', 'read', 'B', 40),
  (10, 'T3', 'write', 'B', 45),
  (11, 'T3', 'read', 'B', 45),
  (12, 'T3', 'commit', NULL, NULL),
  (13, 'T1', 'read', 'B', 45),
  (14, 'T1', 'read', 'A', 700),
  (15, 'T1', 'commit', NULL, NULL)`);

const NR_B = SCHED(String.raw`  (1, 'T1', 'begin', NULL, NULL),
  (2, 'T1', 'read', 'A', 1),
  (3, 'T1', 'read', 'A', 1),
  (4, 'T2', 'begin', NULL, NULL),
  (5, 'T2', 'write', 'A', 2),
  (6, 'T2', 'read', 'A', 2),
  (7, 'T2', 'commit', NULL, NULL),
  (8, 'T1', 'commit', NULL, NULL)`);

const NR_C = SCHED(String.raw`  (1, 'T9', 'begin', NULL, NULL),
  (2, 'T9', 'read', 'Q', 3),
  (3, 'T9', 'read', 'P', 8),
  (4, 'T5', 'begin', NULL, NULL),
  (5, 'T5', 'read', 'Q', 3),
  (6, 'T6', 'begin', NULL, NULL),
  (7, 'T6', 'write', 'Q', 4),
  (8, 'T6', 'write', 'P', 9),
  (9, 'T6', 'commit', NULL, NULL),
  (10, 'T9', 'read', 'P', 9),
  (11, 'T5', 'read', 'Q', 4),
  (12, 'T9', 'read', 'Q', 4),
  (13, 'T5', 'read', 'Q', 4)`);

const WAITS = (waits: string, trx: string) => String.raw`CREATE TABLE lock_waits (
  waiting_txn INT NOT NULL,
  blocking_txn INT NOT NULL,
  resource VARCHAR(40) NOT NULL
);
INSERT INTO lock_waits VALUES
${waits};
CREATE TABLE trx (txn_id INT PRIMARY KEY, rows_modified INT NOT NULL);
INSERT INTO trx VALUES
${trx};
`;

const WAITS_A = WAITS(
  String.raw`  (101, 102, 'accounts:id=2'),
  (102, 101, 'accounts:id=1'),
  (103, 101, 'accounts:id=1'),
  (104, 105, 'orders:id=77'),
  (105, 106, 'orders:id=78'),
  (106, 104, 'orders:id=76')`,
  String.raw`  (101, 4), (102, 1), (103, 2), (104, 9), (105, 3), (106, 6)`,
);

const WAITS_B = WAITS(
  String.raw`  (7, 8, 'stock:sku=A'),
  (8, 9, 'stock:sku=B')`,
  String.raw`  (7, 1), (8, 1), (9, 1)`,
);

const WAITS_C = WAITS(
  String.raw`  (21, 20, 'seats:id=4'),
  (20, 21, 'seats:id=5'),
  (20, 21, 'seats:id=6'),
  (30, 31, 'jobs:id=1'),
  (31, 30, 'jobs:id=2'),
  (32, 30, 'jobs:id=2')`,
  String.raw`  (20, 5), (21, 5), (30, 12), (31, 2), (32, 0)`,
);

const MVCC = (versions: string, commits: string, views: string, viewTable: "snapshots" | "active_views") => String.raw`CREATE TABLE row_versions (
  row_id INT NOT NULL,
  version INT NOT NULL,
  trx_id INT NOT NULL,
  val VARCHAR(20),
  deleted INT NOT NULL
);
INSERT INTO row_versions VALUES
${versions};
CREATE TABLE commits (trx_id INT PRIMARY KEY, commit_seq INT NOT NULL);
INSERT INTO commits VALUES ${commits};
CREATE TABLE ${viewTable} (reader VARCHAR(5) NOT NULL, as_of_seq INT NOT NULL);
${views}
`;

const SNAP_VERSIONS = String.raw`  (1, 1, 100, 'Pune', 0),
  (1, 2, 103, 'Mumbai', 0),
  (2, 1, 100, 'red', 0),
  (2, 2, 105, 'blue', 0),
  (3, 1, 102, 'draft', 0),
  (3, 2, 104, 'draft', 1),
  (4, 1, 106, 'new', 0)`;
const SNAP_COMMITS = "(100, 1), (102, 2), (103, 3), (104, 4), (106, 5)";

const SNAP_A = MVCC(SNAP_VERSIONS, SNAP_COMMITS, "INSERT INTO snapshots VALUES ('r1', 2), ('r2', 4), ('r3', 5);", "snapshots");
const SNAP_B = MVCC(SNAP_VERSIONS, SNAP_COMMITS, "INSERT INTO snapshots VALUES ('r9', 0);", "snapshots");
const SNAP_C = MVCC(
  String.raw`  (7, 1, 10, 'a', 0),
  (7, 2, 11, 'b', 0),
  (7, 3, 12, 'c', 0),
  (8, 1, 12, 'x', 0),
  (8, 2, 13, 'x', 1),
  (8, 3, 14, 'y', 0)`,
  "(10, 1), (11, 2), (12, 3), (13, 4), (14, 6)",
  "INSERT INTO snapshots VALUES ('rb', 2), ('ra', 4), ('rc', 6);",
  "snapshots",
);

const PURGE_VERSIONS = String.raw`  (1, 1, 100, 'Pune', 0),
  (1, 2, 103, 'Mumbai', 0),
  (1, 3, 107, 'Delhi', 0),
  (2, 1, 100, 'red', 0),
  (2, 2, 105, 'blue', 0),
  (3, 1, 102, 'draft', 0),
  (3, 2, 104, 'draft', 1)`;
const PURGE_COMMITS = "(100, 1), (102, 2), (103, 3), (104, 4), (107, 6)";

const PURGE_A = MVCC(PURGE_VERSIONS, PURGE_COMMITS, "INSERT INTO active_views VALUES ('r7', 5), ('r2', 3), ('r8', 6);", "active_views");
const PURGE_B = MVCC(PURGE_VERSIONS, PURGE_COMMITS, "INSERT INTO active_views VALUES ('r0', 1);", "active_views");
const PURGE_C = MVCC(PURGE_VERSIONS, PURGE_COMMITS, "", "active_views");

const LINES = (rows: string) => String.raw`CREATE TABLE order_lines (
  order_id INT NOT NULL,
  sku VARCHAR(12) NOT NULL,
  qty INT NOT NULL
);
${rows}
`;

const STOCK = (rows: string) => String.raw`CREATE TABLE stock (sku VARCHAR(8) PRIMARY KEY, qty INT NOT NULL);
INSERT INTO stock VALUES ${rows};
CREATE TABLE adjustments (sku VARCHAR(8) NOT NULL, delta INT NOT NULL);
`;

const FEE = (accounts: string, ledger: string) => String.raw`CREATE TABLE accounts (
  id INT PRIMARY KEY,
  owner VARCHAR(40) NOT NULL,
  balance INT NOT NULL
);
INSERT INTO accounts VALUES ${accounts};
CREATE TABLE ledger (
  account_id INT NOT NULL,
  delta INT NOT NULL,
  reason VARCHAR(20) NOT NULL
);
${ledger}
`;

const PRODUCTS = (rows: string) => String.raw`CREATE TABLE products (
  id INT PRIMARY KEY,
  name VARCHAR(40) NOT NULL,
  price INT NOT NULL,
  version INT NOT NULL
);
INSERT INTO products VALUES ${rows};
`;

const BLOCKERS = (rows: string) => String.raw`CREATE TABLE lock_waits (
  waiting_txn INT NOT NULL,
  blocking_txn INT NOT NULL,
  wait_secs INT NOT NULL
);
${rows}
`;

export default defineModule(import.meta.url, {
  slug: "transactions-and-concurrency",
  title: "Transactions and concurrency",
  blurb: "ACID and the InnoDB machinery behind it, the isolation levels and the dirty, non-repeatable and phantom reads they allow, row, gap and next-key locks, SELECT … FOR UPDATE, deadlocks and optimistic locking, MVCC with undo logs and read views, and savepoints.",
  icon: "threads",
  overview: `A database serves many sessions at once, and every one of them must see data that makes sense: a transfer never half-applied, a report that does not contradict itself, a seat never sold twice. This module explains how MySQL 8's InnoDB engine delivers that — the ACID promises and the logs that keep them, the isolation levels and the anomalies each allows, the locks writers take and the deadlocks they can form, and the multi-version snapshots that let readers and writers work without waiting for each other — with PostgreSQL's different choices alongside, because interviews compare the two.

ACID covers transactions, autocommit, atomicity through the undo log, consistency and constraints, durability through the redo log and \`innodb_flush_log_at_trx_commit\`, and MySQL's implicit commit on DDL. Isolation levels covers dirty reads, non-repeatable reads and phantoms as schedules, the standard table, InnoDB's \`REPEATABLE READ\`, lost updates and write skew. Locks and deadlocks covers shared and exclusive locks, \`FOR UPDATE\`, \`FOR SHARE\` and \`SKIP LOCKED\`, gap and next-key locks, lock waits, deadlock detection and the victim, and optimistic locking. MVCC covers row versions, undo chains, read views and purge. Savepoints covers \`SAVEPOINT\`, \`ROLLBACK TO\` and \`RELEASE\`, and how frameworks build nested transactions from them.

The exercise engine runs a single connection, so concurrency is studied the way a DBA studies it after the fact: from schedules, lock-wait snapshots and version tables stored as data. The exercises run real transactions — a transfer, an order placed as one unit, partial undos with savepoints — and analyse concurrency in SQL: dirty and non-repeatable reads in a schedule, deadlock cycles with a recursive CTE, what each MVCC snapshot sees and which versions purge may remove. The checkpoint undoes a fee with a savepoint, runs an optimistic-locking update against a stale writer, and ranks the transactions blocking everyone else.`,
  lessons: [
    {
      slug: "acid",
      file: "01-acid.md",
      exercises: [
        {
          title: "A transfer as one unit",
          prompt: `Move **500** from account **1** to account **2** and record it in \`transfers\` with the date \`'2024-06-02'\` — all inside one transaction (\`START TRANSACTION\` … \`COMMIT\`). Then show the balances and the transfer log.

\`accounts\`:

| id | owner | balance |
| --- | --- | --- |
| 1 | Asha | 1200 |
| 2 | Ravi | 300 |
| 3 | Lee | 50 |

\`transfers\` (\`from_id\`, \`to_id\`, \`amount\`, \`made_on\`): one earlier row, \`(3, 1, 100, '2024-06-01')\`.

**Output:** two result sets — \`id\`, \`owner\`, \`balance\` ordered by \`id\`; then \`from_id\`, \`to_id\`, \`amount\`, \`made_on\` ordered by \`made_on\`, then \`from_id\` (both SELECTs are in the starter).

\`\`\`text
id | owner | balance
1 | Asha | 700
2 | Ravi | 800
3 | Lee | 50

from_id | to_id | amount | made_on
3 | 1 | 100 | 2024-06-01
1 | 2 | 500 | 2024-06-02
\`\`\``,
          starter: String.raw`-- In one transaction: debit account 1 by 500, credit account 2 by 500,
-- and INSERT the transfer (1, 2, 500, '2024-06-02'). Then COMMIT.

SELECT id, owner, balance FROM accounts ORDER BY id;
SELECT from_id, to_id, amount, made_on FROM transfers ORDER BY made_on, from_id;
`,
          solution: String.raw`START TRANSACTION;

UPDATE accounts SET balance = balance - 500 WHERE id = 1;
UPDATE accounts SET balance = balance + 500 WHERE id = 2;
INSERT INTO transfers (from_id, to_id, amount, made_on) VALUES (1, 2, 500, '2024-06-02');

COMMIT;

SELECT id, owner, balance FROM accounts ORDER BY id;
SELECT from_id, to_id, amount, made_on FROM transfers ORDER BY made_on, from_id;
`,
          hints: [
            "Write `balance = balance - 500` rather than a computed number: the statement must work on any balances, and the hidden datasets have different ones.",
            "Name the columns in the `INSERT` — `INSERT INTO transfers (from_id, to_id, amount, made_on) VALUES (…)` — and end the unit with `COMMIT;` before the SELECTs.",
          ],
          cases: [
            {
              stdin: BANK_A,
              expected: "id | owner | balance\n1 | Asha | 700\n2 | Ravi | 800\n3 | Lee | 50\n\nfrom_id | to_id | amount | made_on\n3 | 1 | 100 | 2024-06-01\n1 | 2 | 500 | 2024-06-02\n",
            },
            {
              stdin: BANK_B,
              expected: "id | owner | balance\n1 | Asha | 0\n2 | Ravi | 500\n\nfrom_id | to_id | amount | made_on\n1 | 2 | 500 | 2024-06-02\n",
              hidden: true,
            },
            {
              stdin: BANK_C,
              expected: "id | owner | balance\n1 | Meera | 8500\n2 | Kiran | 1250\n4 | Zoya | 10\n\nfrom_id | to_id | amount | made_on\n1 | 2 | 250 | 2024-05-30\n1 | 2 | 500 | 2024-06-02\n2 | 4 | 40 | 2024-06-03\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Place an order atomically",
          prompt: `Placing an order touches three tables, and they must change together. In one transaction:

1. insert order **101** for customer \`'meera'\` placed on \`'2024-05-02'\`;
2. insert its items: 2 × product 1 and 1 × product 3;
3. reduce each product's \`stock\` by the quantity ordered in order 101;
4. commit.

Then show the stock and every order's total units (both SELECTs are in the starter).

\`products\`: \`(1, 'Notebook', 40)\`, \`(2, 'Pen', 120)\`, \`(3, 'Backpack', 6)\`. \`orders\`: \`(100, 'ravi', '2024-05-01')\`. \`order_items\` (\`order_id\`, \`product_id\`, \`qty\`): \`(100, 2, 10)\`.

**Output:** \`id\`, \`name\`, \`stock\` ordered by \`id\`; then \`order_id\`, \`customer\`, \`units\` ordered by \`order_id\`.

\`\`\`text
id | name | stock
1 | Notebook | 38
2 | Pen | 120
3 | Backpack | 5

order_id | customer | units
100 | ravi | 10
101 | meera | 3
\`\`\``,
          starter: String.raw`-- START TRANSACTION; the order row; its two item rows;
-- the stock reductions for order 101's items; COMMIT;

SELECT id, name, stock FROM products ORDER BY id;
SELECT o.id AS order_id, o.customer, SUM(i.qty) AS units
FROM orders o
JOIN order_items i ON i.order_id = o.id
GROUP BY o.id, o.customer
ORDER BY o.id;
`,
          solution: String.raw`START TRANSACTION;

INSERT INTO orders (id, customer, placed_on) VALUES (101, 'meera', '2024-05-02');
INSERT INTO order_items (order_id, product_id, qty) VALUES (101, 1, 2), (101, 3, 1);

UPDATE products
SET stock = stock - (SELECT i.qty
                     FROM order_items i
                     WHERE i.order_id = 101 AND i.product_id = products.id)
WHERE id IN (SELECT product_id FROM order_items WHERE order_id = 101);

COMMIT;

SELECT id, name, stock FROM products ORDER BY id;
SELECT o.id AS order_id, o.customer, SUM(i.qty) AS units
FROM orders o
JOIN order_items i ON i.order_id = o.id
GROUP BY o.id, o.customer
ORDER BY o.id;
`,
          hints: [
            "One `INSERT … VALUES (…), (…)` adds both item rows.",
            "Either two plain updates (`stock = stock - 2 WHERE id = 1`, `stock = stock - 1 WHERE id = 3`) or one `UPDATE` with a correlated subquery reading order 101's items — the subquery must name `order_id = 101`, or older orders would be deducted again.",
          ],
          cases: [
            {
              stdin: SHOP_A,
              expected: "id | name | stock\n1 | Notebook | 38\n2 | Pen | 120\n3 | Backpack | 5\n\norder_id | customer | units\n100 | ravi | 10\n101 | meera | 3\n",
            },
            {
              stdin: SHOP_B,
              expected: "id | name | stock\n1 | Notebook | 0\n3 | Backpack | 0\n\norder_id | customer | units\n101 | meera | 3\n",
              hidden: true,
            },
            {
              stdin: SHOP_C,
              expected: "id | name | stock\n1 | Notebook | 498\n2 | Pen | 7\n3 | Backpack | 49\n4 | Ruler | 30\n\norder_id | customer | units\n99 | lee | 4\n101 | meera | 3\n102 | zoya | 2\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "A transfer debits one account, then the server loses power before the credit runs. Which ACID property guarantees the debit is undone on restart?",
          options: ["Consistency", "Isolation", "Atomicity", "Durability"],
          answer: 2,
          explanation: "Atomicity is all or nothing, even across a crash: InnoDB's recovery rolls back every transaction that never committed, using the undo log. Durability is the promise about **committed** work.",
        },
        {
          prompt: "Which InnoDB structure makes a committed change survive a crash?",
          options: ["The undo log", "The redo log, flushed at commit", "The buffer pool", "The binary log only"],
          answer: 1,
          explanation: "InnoDB writes changes to the redo log before the data pages (write-ahead logging) and, with `innodb_flush_log_at_trx_commit = 1`, flushes it at every commit; recovery replays it. The undo log serves rollback and MVCC.",
        },
        {
          prompt: "In MySQL: `START TRANSACTION; UPDATE …; CREATE TABLE t2 (id INT); ROLLBACK;` — what happens to the UPDATE?",
          options: ["It is rolled back", "It is committed: the CREATE TABLE caused an implicit commit", "The ROLLBACK fails", "The CREATE TABLE is rolled back too"],
          answer: 1,
          explanation: "DDL in MySQL commits the open transaction before it runs and cannot itself be rolled back. PostgreSQL has transactional DDL, where the same script would undo both.",
        },
        {
          prompt: "With MySQL's default `autocommit = 1`, what is a single `UPDATE` run outside `START TRANSACTION`?",
          options: ["Pending until the session closes", "Its own transaction, committed as soon as it succeeds", "Part of the previous transaction", "Rolled back automatically"],
          answer: 1,
          explanation: "Autocommit wraps each statement in its own transaction. Use `START TRANSACTION` (or `SET autocommit = 0`) to group several statements into one unit.",
        },
        {
          prompt: "Inside a MySQL transaction, an `INSERT` fails on a duplicate key. What is the state afterwards?",
          options: ["The whole transaction is rolled back", "Only the failed statement is undone; the transaction is still open with its earlier changes", "The transaction is aborted and refuses further statements", "The duplicate row is inserted anyway"],
          answer: 1,
          explanation: "InnoDB rolls back just the failing statement and leaves the decision to the application. PostgreSQL behaves like the third option: the transaction is aborted until `ROLLBACK`. A deadlock, by contrast, rolls back the whole InnoDB transaction.",
        },
      ],
    },
    {
      slug: "isolation-levels",
      file: "02-isolation-levels.md",
      exercises: [
        {
          title: "Spot the dirty reads",
          prompt: `\`schedule\` records an interleaving of transactions, one row per step: \`action\` is \`begin\`, \`read\`, \`write\`, \`commit\` or \`rollback\`; \`item\` and \`seen_value\` are set on reads and writes. A read is **dirty** when another transaction wrote the same item earlier and had neither committed nor rolled back by the time of the read. List every dirty read with the transaction it read from.

\`schedule\`:

| step | txn | action | item | seen_value |
| --- | --- | --- | --- | --- |
| 1 | T1 | begin | NULL | NULL |
| 2 | T2 | begin | NULL | NULL |
| 3 | T2 | write | A | 0 |
| 4 | T1 | read | A | 0 |
| 5 | T2 | rollback | NULL | NULL |
| 6 | T1 | read | A | 1000 |
| 7 | T3 | begin | NULL | NULL |
| 8 | T3 | write | B | 50 |
| 9 | T3 | commit | NULL | NULL |
| 10 | T1 | read | B | 50 |
| 11 | T1 | commit | NULL | NULL |

**Output columns:** \`step\` (of the read), \`reader\`, \`item\`, \`writer\` — one row per distinct read and writer — ordered by \`step\`, then \`writer\`.

\`\`\`text
step | reader | item | writer
4 | T1 | A | T2
\`\`\``,
          starter: String.raw`-- Join each read to earlier writes of the same item by OTHER transactions,
-- and keep the pair only if the writer had no commit/rollback before the read.
`,
          solution: String.raw`SELECT DISTINCT r.step, r.txn AS reader, r.item, w.txn AS writer
FROM schedule r
JOIN schedule w
  ON w.action = 'write'
 AND w.item = r.item
 AND w.txn <> r.txn
 AND w.step < r.step
WHERE r.action = 'read'
  AND NOT EXISTS (
    SELECT 1
    FROM schedule e
    WHERE e.txn = w.txn
      AND e.action IN ('commit', 'rollback')
      AND e.step < r.step
  )
ORDER BY r.step, writer;
`,
          hints: [
            "Self-join `schedule`: `r` for the reads, `w` for earlier writes of the same item by a different `txn`.",
            "The writer was still open if `NOT EXISTS` a `commit` or `rollback` row of `w.txn` with a step before the read.",
            "Reading your own uncommitted write is not dirty — the `w.txn <> r.txn` condition handles it.",
          ],
          cases: [
            { stdin: SCHED_A, expected: "step | reader | item | writer\n4 | T1 | A | T2\n" },
            { stdin: SCHED_B, expected: "step | reader | item | writer\n5 | T2 | X | T1\n7 | T3 | X | T1\n12 | T2 | Y | T4\n", hidden: true },
            { stdin: SCHED_C, expected: "step | reader | item | writer\n(no rows)\n", hidden: true },
          ],
        },
        {
          title: "Find the non-repeatable reads",
          prompt: `Using the same kind of \`schedule\` table, find **non-repeatable reads**: a transaction read the same item more than once and saw more than one value, **without having written that item itself** (seeing your own write is not an anomaly).

\`schedule\`:

| step | txn | action | item | seen_value |
| --- | --- | --- | --- | --- |
| 1 | T1 | begin | NULL | NULL |
| 2 | T1 | read | A | 1000 |
| 3 | T2 | begin | NULL | NULL |
| 4 | T2 | write | A | 700 |
| 5 | T2 | commit | NULL | NULL |
| 6 | T1 | read | A | 700 |
| 7 | T1 | read | B | 40 |
| 8 | T3 | begin | NULL | NULL |
| 9 | T3 | read | B | 40 |
| 10 | T3 | write | B | 45 |
| 11 | T3 | read | B | 45 |
| 12 | T3 | commit | NULL | NULL |
| 13 | T1 | read | B | 45 |
| 14 | T1 | read | A | 700 |
| 15 | T1 | commit | NULL | NULL |

**Output columns:** \`txn\`, \`item\`, \`times_read\` (how many times it read the item), \`distinct_values\`, ordered by \`txn\`, then \`item\`.

\`\`\`text
txn | item | times_read | distinct_values
T1 | A | 3 | 2
T1 | B | 2 | 2
\`\`\``,
          starter: String.raw`-- Group the reads by txn and item; keep groups with more than one distinct value,
-- except where the same txn wrote that item.
`,
          solution: String.raw`SELECT r.txn,
       r.item,
       COUNT(*) AS times_read,
       COUNT(DISTINCT r.seen_value) AS distinct_values
FROM schedule r
WHERE r.action = 'read'
  AND NOT EXISTS (
    SELECT 1
    FROM schedule w
    WHERE w.action = 'write'
      AND w.txn = r.txn
      AND w.item = r.item
  )
GROUP BY r.txn, r.item
HAVING COUNT(DISTINCT r.seen_value) > 1
ORDER BY r.txn, r.item;
`,
          hints: [
            "`GROUP BY txn, item` over the `read` rows, with `HAVING COUNT(DISTINCT seen_value) > 1`.",
            "Drop the reads of an item the same transaction wrote, with `NOT EXISTS` on a `write` row of that `txn` and `item` — that is why T3 is not in the answer.",
          ],
          cases: [
            { stdin: NR_A, expected: "txn | item | times_read | distinct_values\nT1 | A | 3 | 2\nT1 | B | 2 | 2\n" },
            { stdin: NR_B, expected: "txn | item | times_read | distinct_values\n(no rows)\n", hidden: true },
            { stdin: NR_C, expected: "txn | item | times_read | distinct_values\nT5 | Q | 3 | 2\nT9 | P | 2 | 2\nT9 | Q | 2 | 2\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which isolation level is the **lowest** that prevents dirty reads?",
          options: ["READ UNCOMMITTED", "READ COMMITTED", "REPEATABLE READ", "SERIALIZABLE"],
          answer: 1,
          explanation: "READ COMMITTED shows only committed data. It still allows non-repeatable reads and phantoms; REPEATABLE READ and SERIALIZABLE forbid more.",
        },
        {
          prompt: "T1 runs `SELECT COUNT(*) FROM orders WHERE status = 'new'` twice and gets 5, then 6, because T2 inserted a new order and committed between. Which anomaly is this?",
          options: ["Dirty read", "Non-repeatable read", "Phantom read", "Lost update"],
          answer: 2,
          explanation: "A new row matching the predicate appeared — a phantom. A non-repeatable read is an existing row whose values changed; a dirty read involves uncommitted data.",
        },
        {
          prompt: "What is the default isolation level of MySQL's InnoDB, and of PostgreSQL?",
          options: ["Both READ COMMITTED", "InnoDB REPEATABLE READ; PostgreSQL READ COMMITTED", "InnoDB SERIALIZABLE; PostgreSQL REPEATABLE READ", "Both REPEATABLE READ"],
          answer: 1,
          explanation: "InnoDB defaults to REPEATABLE READ; PostgreSQL, Oracle and SQL Server default to READ COMMITTED — a classic comparison question.",
        },
        {
          prompt: "Under InnoDB's REPEATABLE READ, when is the snapshot for plain SELECTs taken?",
          options: ["At `START TRANSACTION`, always", "At the transaction's first consistent read, then reused until commit", "At every statement", "At commit"],
          answer: 1,
          explanation: "The read view is created at the first consistent read (or immediately with `START TRANSACTION WITH CONSISTENT SNAPSHOT`) and reused. Under READ COMMITTED a fresh one is taken for each statement.",
        },
        {
          prompt: "Two transactions each read that two doctors are on call and each takes a **different** doctor off call; now nobody is. Which anomaly is this, and what prevents it?",
          options: ["Dirty read; READ COMMITTED", "Write skew; SERIALIZABLE or locking the rows read with FOR UPDATE", "Phantom read; REPEATABLE READ", "Lost update; autocommit"],
          answer: 1,
          explanation: "Write skew: both decisions were based on a valid snapshot, but they wrote different rows, so no write–write conflict occurred. Snapshot isolation allows it; serializable execution or explicit locks of the rows the decision depends on prevent it.",
        },
      ],
    },
    {
      slug: "locks-and-deadlocks",
      file: "03-locks-and-deadlocks.md",
      exercises: [
        {
          title: "Two-way deadlocks and their victim",
          prompt: `\`lock_waits\` is a snapshot of which transaction waits for which (one row per waited-for lock), and \`trx\` holds how many rows each transaction has modified. Find every pair of transactions that **wait for each other** — a two-way deadlock — and the victim InnoDB would roll back: the one with **fewer** \`rows_modified\`, or, on a tie, the one with the larger id.

\`lock_waits\`:

| waiting_txn | blocking_txn | resource |
| --- | --- | --- |
| 101 | 102 | accounts:id=2 |
| 102 | 101 | accounts:id=1 |
| 103 | 101 | accounts:id=1 |
| 104 | 105 | orders:id=77 |
| 105 | 106 | orders:id=78 |
| 106 | 104 | orders:id=76 |

\`trx\`: \`(101, 4)\`, \`(102, 1)\`, \`(103, 2)\`, \`(104, 9)\`, \`(105, 3)\`, \`(106, 6)\`.

**Output columns:** \`txn_a\` (the smaller id), \`txn_b\`, \`victim\` — one row per pair — ordered by \`txn_a\`, then \`txn_b\`. (The three-way cycle 104 → 105 → 106 → 104 is not a pair; the next exercise finds it.)

\`\`\`text
txn_a | txn_b | victim
101 | 102 | 102
\`\`\``,
          starter: String.raw`-- Self-join lock_waits: w1 waits for w2's waiter and w2 waits for w1's waiter.
-- Keep waiting_txn < blocking_txn so each pair appears once; DISTINCT for repeats.
-- Pick the victim from trx.rows_modified.
`,
          solution: String.raw`SELECT DISTINCT
       w1.waiting_txn AS txn_a,
       w1.blocking_txn AS txn_b,
       CASE
         WHEN ta.rows_modified < tb.rows_modified THEN ta.txn_id
         ELSE tb.txn_id
       END AS victim
FROM lock_waits w1
JOIN lock_waits w2
  ON w2.waiting_txn = w1.blocking_txn
 AND w2.blocking_txn = w1.waiting_txn
JOIN trx ta ON ta.txn_id = w1.waiting_txn
JOIN trx tb ON tb.txn_id = w1.blocking_txn
WHERE w1.waiting_txn < w1.blocking_txn
ORDER BY txn_a, txn_b;
`,
          hints: [
            "A two-way deadlock is a row `(a waits b)` and a row `(b waits a)`: join `lock_waits` to itself with the columns swapped.",
            "`WHERE w1.waiting_txn < w1.blocking_txn` keeps one orientation of each pair; `DISTINCT` removes repeats when the two wait on several resources.",
            "Since `txn_b` is the larger id, the tie rule means: `txn_a` only if it modified strictly fewer rows, otherwise `txn_b`.",
          ],
          cases: [
            { stdin: WAITS_A, expected: "txn_a | txn_b | victim\n101 | 102 | 102\n" },
            { stdin: WAITS_B, expected: "txn_a | txn_b | victim\n(no rows)\n", hidden: true },
            { stdin: WAITS_C, expected: "txn_a | txn_b | victim\n20 | 21 | 21\n30 | 31 | 31\n", hidden: true },
          ],
        },
        {
          title: "Every transaction in a cycle",
          prompt: `Deadlocks can involve more than two transactions. Using the same \`lock_waits\` table, follow the wait-for edges with a **recursive CTE** and list every transaction that can reach itself — it is part of a deadlock cycle — with the length of the shortest cycle it is in (the number of wait edges).

**Output columns:** \`txn\`, \`cycle_length\`, ordered by \`txn\`. With the data of the previous exercise:

\`\`\`text
txn | cycle_length
101 | 2
102 | 2
104 | 3
105 | 3
106 | 3
\`\`\`

Transaction 103 waits for a deadlocked transaction but is not in a cycle itself. Stop the recursion at a depth of 10.`,
          starter: String.raw`-- WITH RECURSIVE chain (start_txn, current_txn, depth) AS (
--   anchor: every edge, depth 1
--   UNION ALL
--   step: extend the chain by one edge while depth < 10
-- )
-- then keep the chains that come back to start_txn.
`,
          solution: String.raw`WITH RECURSIVE chain (start_txn, current_txn, depth) AS (
  SELECT waiting_txn, blocking_txn, 1
  FROM lock_waits
  UNION ALL
  SELECT c.start_txn, w.blocking_txn, c.depth + 1
  FROM chain c
  JOIN lock_waits w ON w.waiting_txn = c.current_txn
  WHERE c.depth < 10
)
SELECT start_txn AS txn, MIN(depth) AS cycle_length
FROM chain
WHERE current_txn = start_txn
GROUP BY start_txn
ORDER BY txn;
`,
          hints: [
            "The anchor is every edge (`waiting_txn → blocking_txn`) at depth 1; the recursive step joins the chain's `current_txn` to an edge that starts there.",
            "A chain whose `current_txn` equals its `start_txn` has come back: the transaction is in a cycle, and `MIN(depth)` is the shortest one.",
            "The depth limit is what stops the recursion — cycles would otherwise loop forever.",
          ],
          cases: [
            { stdin: WAITS_A, expected: "txn | cycle_length\n101 | 2\n102 | 2\n104 | 3\n105 | 3\n106 | 3\n" },
            { stdin: WAITS_B, expected: "txn | cycle_length\n(no rows)\n", hidden: true },
            { stdin: WAITS_C, expected: "txn | cycle_length\n20 | 2\n21 | 2\n30 | 2\n31 | 2\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does `SELECT balance FROM accounts WHERE id = 1 FOR UPDATE` do inside a transaction?",
          options: ["Reads the snapshot without locking", "Reads the latest committed row and holds an exclusive lock on it until the transaction ends", "Updates the row", "Locks the whole table"],
          answer: 1,
          explanation: "A locking read takes an X lock on the matched index records; other transactions that try to change or lock row 1 wait. With a primary-key lookup only that one record is locked.",
        },
        {
          prompt: "Under REPEATABLE READ, `SELECT … WHERE age BETWEEN 25 AND 35 FOR UPDATE` uses an index on `age`. Why does another session's `INSERT` of age 30 wait?",
          options: ["The table is locked", "Next-key locks cover the gaps in the scanned range, blocking inserts into it", "INSERT always waits for SELECT", "Because of MVCC"],
          answer: 1,
          explanation: "InnoDB locks the scanned records and the gaps between them so no phantom can appear in the range. Under READ COMMITTED these gap locks are not taken, and the insert would proceed.",
        },
        {
          prompt: "How does InnoDB resolve a deadlock?",
          options: ["Waits for `innodb_lock_wait_timeout` and then fails both", "Detects the cycle at once and rolls back one transaction — usually the one that modified fewer rows — with error 1213", "Kills the connection that started first", "Converts the locks to shared locks"],
          answer: 1,
          explanation: "With `innodb_deadlock_detect` on (the default), InnoDB checks the wait-for graph on every new wait and rolls back the smaller transaction entirely. The timeout (error 1205) is for plain waits, not cycles.",
        },
        {
          prompt: "Which practice prevents the classic two-account transfer deadlock?",
          options: ["Use READ UNCOMMITTED", "Always lock (update) the accounts in the same order, such as lower id first", "Add more indexes", "Use autocommit"],
          answer: 1,
          explanation: "A cycle needs two transactions acquiring the same locks in opposite orders. A global order makes the second transaction wait for the first instead of forming a cycle.",
        },
        {
          prompt: "Several workers poll a `jobs` table for pending work. Which clause lets each grab a different job without waiting on the others?",
          options: ["`FOR SHARE`", "`FOR UPDATE NOWAIT`", "`FOR UPDATE SKIP LOCKED`", "`LOCK IN SHARE MODE`"],
          answer: 2,
          explanation: "`SKIP LOCKED` (MySQL 8) skips rows another transaction has locked, so each worker takes the next free job. `NOWAIT` would fail instead of moving on.",
        },
      ],
    },
    {
      slug: "mvcc",
      file: "04-mvcc.md",
      exercises: [
        {
          title: "What each snapshot sees",
          prompt: `Model InnoDB's version chains. \`row_versions\` holds every version of every row (\`version\` increases per row, \`trx_id\` created it, \`deleted\` = 1 marks a delete). \`commits\` lists committed transactions in commit order (\`commit_seq\`); a transaction absent from it has not committed. A snapshot taken at \`as_of_seq\` sees a version only if its transaction committed with \`commit_seq <= as_of_seq\`, and for each row it reads the **newest** such version — and the row is absent if that version is a delete.

\`row_versions\`:

| row_id | version | trx_id | val | deleted |
| --- | --- | --- | --- | --- |
| 1 | 1 | 100 | Pune | 0 |
| 1 | 2 | 103 | Mumbai | 0 |
| 2 | 1 | 100 | red | 0 |
| 2 | 2 | 105 | blue | 0 |
| 3 | 1 | 102 | draft | 0 |
| 3 | 2 | 104 | draft | 1 |
| 4 | 1 | 106 | new | 0 |

\`commits\`: \`(100, 1)\`, \`(102, 2)\`, \`(103, 3)\`, \`(104, 4)\`, \`(106, 5)\` — 105 is still running. \`snapshots\` (\`reader\`, \`as_of_seq\`): \`('r1', 2)\`, \`('r2', 4)\`, \`('r3', 5)\`.

**Output columns:** \`reader\`, \`row_id\`, \`val\`, ordered by \`reader\`, then \`row_id\`.

\`\`\`text
reader | row_id | val
r1 | 1 | Pune
r1 | 2 | red
r1 | 3 | draft
r2 | 1 | Mumbai
r2 | 2 | red
r3 | 1 | Mumbai
r3 | 2 | red
r3 | 4 | new
\`\`\``,
          starter: String.raw`-- Pair each snapshot with the versions it may see (committed, commit_seq <= as_of_seq),
-- number them newest first per (reader, row_id) with ROW_NUMBER(),
-- keep number 1, and drop it if it is a delete.
`,
          solution: String.raw`WITH visible AS (
  SELECT s.reader,
         v.row_id,
         v.val,
         v.deleted,
         ROW_NUMBER() OVER (PARTITION BY s.reader, v.row_id ORDER BY v.version DESC) AS rn
  FROM snapshots s
  CROSS JOIN row_versions v
  JOIN commits c ON c.trx_id = v.trx_id
  WHERE c.commit_seq <= s.as_of_seq
)
SELECT reader, row_id, val
FROM visible
WHERE rn = 1
  AND deleted = 0
ORDER BY reader, row_id;
`,
          hints: [
            "An inner `JOIN commits` drops versions of uncommitted transactions; `commit_seq <= as_of_seq` drops those committed after the snapshot.",
            "`ROW_NUMBER() OVER (PARTITION BY reader, row_id ORDER BY version DESC)` marks the newest visible version as 1.",
            "Filter `deleted = 0` only **after** picking the newest version — filtering first would resurrect the deleted row 3 as its older `draft`.",
          ],
          cases: [
            { stdin: SNAP_A, expected: "reader | row_id | val\nr1 | 1 | Pune\nr1 | 2 | red\nr1 | 3 | draft\nr2 | 1 | Mumbai\nr2 | 2 | red\nr3 | 1 | Mumbai\nr3 | 2 | red\nr3 | 4 | new\n" },
            { stdin: SNAP_B, expected: "reader | row_id | val\n(no rows)\n", hidden: true },
            { stdin: SNAP_C, expected: "reader | row_id | val\nra | 7 | c\nrb | 7 | b\nrc | 7 | c\nrc | 8 | y\n", hidden: true },
          ],
        },
        {
          title: "What purge may remove",
          prompt: `InnoDB's purge may discard an old version once **no active read view can need it**: when a **newer** version of the same row was committed at or before the **oldest** active view's \`as_of_seq\`. If no view is active, the oldest view counts as the newest commit (\`MAX(commit_seq)\`). List the purgeable versions.

\`row_versions\` (\`row_id\`, \`version\`, \`trx_id\`, \`val\`, \`deleted\`):

| row_id | version | trx_id | val | deleted |
| --- | --- | --- | --- | --- |
| 1 | 1 | 100 | Pune | 0 |
| 1 | 2 | 103 | Mumbai | 0 |
| 1 | 3 | 107 | Delhi | 0 |
| 2 | 1 | 100 | red | 0 |
| 2 | 2 | 105 | blue | 0 |
| 3 | 1 | 102 | draft | 0 |
| 3 | 2 | 104 | draft | 1 |

\`commits\`: \`(100, 1)\`, \`(102, 2)\`, \`(103, 3)\`, \`(104, 4)\`, \`(107, 6)\` — 105 is still running. \`active_views\` (\`reader\`, \`as_of_seq\`): \`('r7', 5)\`, \`('r2', 3)\`, \`('r8', 6)\` — so the oldest view is at 3.

**Output columns:** \`row_id\`, \`version\`, ordered by \`row_id\`, then \`version\`.

\`\`\`text
row_id | version
1 | 1
\`\`\`

Row 1's version 1 was superseded by version 2, committed at 3 — every view sees version 2 or later. Row 3's version 1 must stay: its delete committed at 4, after the view \`r2\` was taken.`,
          starter: String.raw`-- horizon = the oldest active view's as_of_seq (or MAX(commit_seq) if none).
-- A version is purgeable if EXISTS a newer version of the same row
-- whose transaction committed with commit_seq <= horizon.
`,
          solution: String.raw`SELECT v.row_id, v.version
FROM row_versions v
WHERE EXISTS (
  SELECT 1
  FROM row_versions n
  JOIN commits c ON c.trx_id = n.trx_id
  WHERE n.row_id = v.row_id
    AND n.version > v.version
    AND c.commit_seq <= COALESCE((SELECT MIN(as_of_seq) FROM active_views),
                                 (SELECT MAX(commit_seq) FROM commits))
)
ORDER BY v.row_id, v.version;
`,
          hints: [
            "The oldest view is `(SELECT MIN(as_of_seq) FROM active_views)`; `COALESCE` it with `(SELECT MAX(commit_seq) FROM commits)` for the case with no views.",
            "Use `EXISTS` over a newer version of the same row joined to `commits` — an uncommitted newer version (row 2's) never makes the old one removable.",
          ],
          cases: [
            { stdin: PURGE_A, expected: "row_id | version\n1 | 1\n" },
            { stdin: PURGE_B, expected: "row_id | version\n(no rows)\n", hidden: true },
            { stdin: PURGE_C, expected: "row_id | version\n1 | 1\n1 | 2\n3 | 1\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What is the main benefit of MVCC?",
          options: ["Writes never conflict", "Readers see a consistent snapshot without blocking writers, and writers do not block readers", "No locks are ever taken", "Rows are stored once only"],
          answer: 1,
          explanation: "Plain reads use old versions instead of locks. Two writers to the same row still conflict and are ordered by locks.",
        },
        {
          prompt: "Where does InnoDB keep the previous versions of an updated row?",
          options: ["As new rows in the same table", "In the undo log, linked from the row by its roll pointer", "In the redo log", "In the binary log"],
          answer: 1,
          explanation: "InnoDB updates the row in place and stores the old values in undo records reached through `DB_ROLL_PTR`. PostgreSQL is the one that writes a new tuple into the table.",
        },
        {
          prompt: "A session opened a transaction at 09:00, ran one SELECT and has been idle since. What grows while it stays open?",
          options: ["Nothing — idle sessions cost nothing", "The undo history: purge cannot remove versions its read view may still need", "The redo log only", "The binary log"],
          answer: 1,
          explanation: "Purge removes only versions older than every active read view. One forgotten transaction keeps every later version's undo alive, raising the history list length and slowing reads.",
        },
        {
          prompt: "Under REPEATABLE READ, T1 reads a row with a plain SELECT, T2 updates it and commits, then T1 runs `UPDATE … WHERE id = that row`. Which version does T1's UPDATE act on?",
          options: ["T1's snapshot version", "The latest committed version, written by T2", "Neither: it fails with a serialization error", "A random one"],
          answer: 1,
          explanation: "Writes and locking reads in InnoDB use the latest committed version; only plain SELECTs read the snapshot. PostgreSQL's REPEATABLE READ would instead raise a serialization error here.",
        },
      ],
    },
    {
      slug: "savepoints",
      file: "05-savepoints.md",
      exercises: [
        {
          title: "Fix one line, keep the rest",
          prompt: `Enter order **501**'s lines in one transaction, using a savepoint to recover from a mistake:

1. \`START TRANSACTION\`; insert \`(501, 'PEN-BLK', 10)\` and \`(501, 'NB-A5', 4)\`;
2. \`SAVEPOINT after_basics\`;
3. insert \`(501, 'INK-BLU', 500)\` — a typo;
4. \`ROLLBACK TO SAVEPOINT after_basics\`;
5. insert \`(501, 'INK-BLU', 5)\` and \`COMMIT\`.

Then show every line (the SELECT is in the starter).

\`order_lines\` (\`order_id\`, \`sku\`, \`qty\`) already holds \`(500, 'PEN-RED', 2)\`.

**Output columns:** \`order_id\`, \`sku\`, \`qty\`, ordered by \`order_id\`, then \`sku\`.

\`\`\`text
order_id | sku | qty
500 | PEN-RED | 2
501 | INK-BLU | 5
501 | NB-A5 | 4
501 | PEN-BLK | 10
\`\`\``,
          starter: String.raw`-- The five steps: START TRANSACTION, two inserts, SAVEPOINT after_basics,
-- the wrong insert, ROLLBACK TO SAVEPOINT after_basics, the right insert, COMMIT.

SELECT order_id, sku, qty FROM order_lines ORDER BY order_id, sku;
`,
          solution: String.raw`START TRANSACTION;

INSERT INTO order_lines (order_id, sku, qty) VALUES (501, 'PEN-BLK', 10);
INSERT INTO order_lines (order_id, sku, qty) VALUES (501, 'NB-A5', 4);
SAVEPOINT after_basics;

INSERT INTO order_lines (order_id, sku, qty) VALUES (501, 'INK-BLU', 500);
ROLLBACK TO SAVEPOINT after_basics;

INSERT INTO order_lines (order_id, sku, qty) VALUES (501, 'INK-BLU', 5);
COMMIT;

SELECT order_id, sku, qty FROM order_lines ORDER BY order_id, sku;
`,
          hints: [
            "`SAVEPOINT after_basics;` marks the point; `ROLLBACK TO SAVEPOINT after_basics;` undoes only what came after it.",
            "A plain `ROLLBACK` there would lose the pen and notebook lines too — and end the transaction.",
          ],
          cases: [
            {
              stdin: LINES("INSERT INTO order_lines VALUES (500, 'PEN-RED', 2);"),
              expected: "order_id | sku | qty\n500 | PEN-RED | 2\n501 | INK-BLU | 5\n501 | NB-A5 | 4\n501 | PEN-BLK | 10\n",
            },
            {
              stdin: LINES(""),
              expected: "order_id | sku | qty\n501 | INK-BLU | 5\n501 | NB-A5 | 4\n501 | PEN-BLK | 10\n",
              hidden: true,
            },
            {
              stdin: LINES("INSERT INTO order_lines VALUES (502, 'BAG-L', 1), (499, 'INK-BLU', 500), (501, 'GIFT', 1);"),
              expected: "order_id | sku | qty\n499 | INK-BLU | 500\n501 | GIFT | 1\n501 | INK-BLU | 5\n501 | NB-A5 | 4\n501 | PEN-BLK | 10\n502 | BAG-L | 1\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Rolling back past a later savepoint",
          prompt: `Apply stock adjustments, each logged in \`adjustments\`, with two savepoints — then roll back to the **first**, which also discards the second:

1. \`START TRANSACTION\`; subtract 2 from \`'A'\` and log \`('A', -2)\`;
2. \`SAVEPOINT s1\`; subtract 5 from \`'B'\` and log \`('B', -5)\`;
3. \`SAVEPOINT s2\`; add 10 to \`'C'\` and log \`('C', 10)\`;
4. \`ROLLBACK TO SAVEPOINT s1\` — the B and C adjustments were a mistake;
5. subtract 1 from \`'D'\`, log \`('D', -1)\`, and \`COMMIT\`.

Then show the stock and the log (both SELECTs are in the starter).

\`stock\` (\`sku\`, \`qty\`): \`('A', 10)\`, \`('B', 20)\`, \`('C', 30)\`, \`('D', 40)\`. \`adjustments\` (\`sku\`, \`delta\`) starts empty.

**Output:** \`sku\`, \`qty\` ordered by \`sku\`; then \`sku\`, \`delta\` ordered by \`sku\`.

\`\`\`text
sku | qty
A | 8
B | 20
C | 30
D | 39

sku | delta
A | -2
D | -1
\`\`\``,
          starter: String.raw`-- START TRANSACTION; the A change and log; SAVEPOINT s1; the B change and log;
-- SAVEPOINT s2; the C change and log; ROLLBACK TO SAVEPOINT s1;
-- the D change and log; COMMIT.

SELECT sku, qty FROM stock ORDER BY sku;
SELECT sku, delta FROM adjustments ORDER BY sku;
`,
          solution: String.raw`START TRANSACTION;

UPDATE stock SET qty = qty - 2 WHERE sku = 'A';
INSERT INTO adjustments (sku, delta) VALUES ('A', -2);
SAVEPOINT s1;

UPDATE stock SET qty = qty - 5 WHERE sku = 'B';
INSERT INTO adjustments (sku, delta) VALUES ('B', -5);
SAVEPOINT s2;

UPDATE stock SET qty = qty + 10 WHERE sku = 'C';
INSERT INTO adjustments (sku, delta) VALUES ('C', 10);

ROLLBACK TO SAVEPOINT s1;

UPDATE stock SET qty = qty - 1 WHERE sku = 'D';
INSERT INTO adjustments (sku, delta) VALUES ('D', -1);
COMMIT;

SELECT sku, qty FROM stock ORDER BY sku;
SELECT sku, delta FROM adjustments ORDER BY sku;
`,
          hints: [
            "Write each change relative to the current value (`qty = qty - 2`): the hidden datasets start from different quantities.",
            "Rolling back to `s1` undoes everything after it — the B and C changes, their log rows and the savepoint `s2` itself — and keeps the A change.",
          ],
          cases: [
            {
              stdin: STOCK("('A', 10), ('B', 20), ('C', 30), ('D', 40)"),
              expected: "sku | qty\nA | 8\nB | 20\nC | 30\nD | 39\n\nsku | delta\nA | -2\nD | -1\n",
            },
            {
              stdin: STOCK("('D', 1), ('C', 0), ('B', 5), ('A', 2), ('E', 7)"),
              expected: "sku | qty\nA | 0\nB | 5\nC | 0\nD | 0\nE | 7\n\nsku | delta\nA | -2\nD | -1\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does `ROLLBACK TO SAVEPOINT s1` do?",
          options: ["Ends the transaction and undoes everything", "Undoes the changes made after `s1` and leaves the transaction open", "Commits everything before `s1`", "Deletes savepoint `s1` and keeps all changes"],
          answer: 1,
          explanation: "It is a partial undo: the work before `s1` remains pending, the transaction continues, and `s1` still exists. The last option describes `RELEASE SAVEPOINT`.",
        },
        {
          prompt: "Savepoints `s1` then `s2` are set. After `ROLLBACK TO SAVEPOINT s1`, what happens to `ROLLBACK TO SAVEPOINT s2`?",
          options: ["It works as before", "It fails: `s2` was discarded with the rollback to the earlier `s1`", "It rolls back to `s1` again", "It commits"],
          answer: 1,
          explanation: "Savepoints stack. Rolling back to an earlier one removes every savepoint created after it, together with the changes made after it.",
        },
        {
          prompt: "Does `RELEASE SAVEPOINT s1` make the changes before it durable?",
          options: ["Yes, it is a partial commit", "No — it only removes the marker; nothing is durable until the transaction commits", "Yes, but only for inserts", "It rolls them back"],
          answer: 1,
          explanation: "Releasing is bookkeeping. If the transaction is later rolled back, everything — including the work before the released savepoint — is undone.",
        },
        {
          prompt: "Why do PostgreSQL bulk loaders often set a savepoint before each record?",
          options: ["Savepoints make inserts faster", "In PostgreSQL any error aborts the transaction; rolling back to a savepoint is the only way to continue it", "To release locks after each record", "PostgreSQL requires a savepoint per statement"],
          answer: 1,
          explanation: "After an error PostgreSQL refuses further statements until `ROLLBACK` or `ROLLBACK TO SAVEPOINT`. MySQL rolls back only the failing statement and keeps the transaction usable.",
        },
      ],
    },
    {
      slug: "concurrency-checkpoint",
      file: "06-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "A transfer with a waived fee",
          prompt: `In one transaction, move **300** from account **1** to account **2**, logging both movements in \`ledger\` with reason \`'transfer'\`. Then \`SAVEPOINT before_fee\`, charge account 1 a fee of **10** (balance and a \`'fee'\` ledger row) — and, because the fee is waived for this customer, \`ROLLBACK TO SAVEPOINT before_fee\` and \`COMMIT\`. Show the balances and the ledger (both SELECTs are in the starter).

\`accounts\`: \`(1, 'Asha', 1000)\`, \`(2, 'Ravi', 200)\`. \`ledger\` (\`account_id\`, \`delta\`, \`reason\`) starts empty.

**Output:** \`id\`, \`owner\`, \`balance\` ordered by \`id\`; then \`account_id\`, \`delta\`, \`reason\` ordered by \`account_id\`, then \`delta\`.

\`\`\`text
id | owner | balance
1 | Asha | 700
2 | Ravi | 500

account_id | delta | reason
1 | -300 | transfer
2 | 300 | transfer
\`\`\``,
          starter: String.raw`-- START TRANSACTION; the transfer and its two ledger rows;
-- SAVEPOINT before_fee; the fee and its ledger row;
-- ROLLBACK TO SAVEPOINT before_fee; COMMIT;

SELECT id, owner, balance FROM accounts ORDER BY id;
SELECT account_id, delta, reason FROM ledger ORDER BY account_id, delta;
`,
          solution: String.raw`START TRANSACTION;

UPDATE accounts SET balance = balance - 300 WHERE id = 1;
UPDATE accounts SET balance = balance + 300 WHERE id = 2;
INSERT INTO ledger (account_id, delta, reason) VALUES (1, -300, 'transfer'), (2, 300, 'transfer');

SAVEPOINT before_fee;
UPDATE accounts SET balance = balance - 10 WHERE id = 1;
INSERT INTO ledger (account_id, delta, reason) VALUES (1, -10, 'fee');
ROLLBACK TO SAVEPOINT before_fee;

COMMIT;

SELECT id, owner, balance FROM accounts ORDER BY id;
SELECT account_id, delta, reason FROM ledger ORDER BY account_id, delta;
`,
          hints: [
            "Write the balances relatively (`balance - 300`); the hidden datasets start elsewhere and may already hold ledger rows.",
            "The fee's two statements sit between `SAVEPOINT before_fee` and `ROLLBACK TO SAVEPOINT before_fee`, so both disappear and the transfer stays.",
          ],
          cases: [
            {
              stdin: FEE("(1, 'Asha', 1000), (2, 'Ravi', 200)", ""),
              expected: "id | owner | balance\n1 | Asha | 700\n2 | Ravi | 500\n\naccount_id | delta | reason\n1 | -300 | transfer\n2 | 300 | transfer\n",
            },
            {
              stdin: FEE("(2, 'Lee', 0), (1, 'Meera', 300), (3, 'Zoya', 45)", "INSERT INTO ledger VALUES (3, 45, 'deposit'), (1, 300, 'deposit');"),
              expected: "id | owner | balance\n1 | Meera | 0\n2 | Lee | 300\n3 | Zoya | 45\n\naccount_id | delta | reason\n1 | -300 | transfer\n1 | 300 | deposit\n2 | 300 | transfer\n3 | 45 | deposit\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Optimistic locking with a version column",
          prompt: `Two editors opened product **7** when its \`version\` was **3**. Editor A saves first: set \`price\` to **549** and increment \`version\`, **only if** the version is still 3. Editor B saves second with the same stale version: set \`price\` to **499** and increment \`version\`, only if the version is still 3. Write both conditional updates in that order, then show the products (the SELECT is in the starter).

\`products\` (\`id\`, \`name\`, \`price\`, \`version\`): \`(7, 'Desk lamp', 599, 3)\`, \`(8, 'Chair', 2499, 1)\`.

**Output columns:** \`id\`, \`price\`, \`version\`, ordered by \`id\`.

\`\`\`text
id | price | version
7 | 549 | 4
8 | 2499 | 1
\`\`\`

Editor B's update changes no row — in an application, "0 rows affected" is the signal to reload and retry.`,
          starter: String.raw`-- Editor A, then editor B: each UPDATE sets the new price and version = version + 1
-- WHERE id = 7 AND version = 3.

SELECT id, price, version FROM products ORDER BY id;
`,
          solution: String.raw`UPDATE products
SET price = 549, version = version + 1
WHERE id = 7 AND version = 3;

UPDATE products
SET price = 499, version = version + 1
WHERE id = 7 AND version = 3;

SELECT id, price, version FROM products ORDER BY id;
`,
          hints: [
            "The version check belongs in the `WHERE` clause: `WHERE id = 7 AND version = 3`.",
            "After editor A's update the version is 4, so editor B's identical condition matches nothing — that is the whole mechanism.",
          ],
          cases: [
            {
              stdin: PRODUCTS("(7, 'Desk lamp', 599, 3), (8, 'Chair', 2499, 1)"),
              expected: "id | price | version\n7 | 549 | 4\n8 | 2499 | 1\n",
            },
            {
              stdin: PRODUCTS("(7, 'Desk lamp', 579, 4), (9, 'Rug', 1200, 3)"),
              expected: "id | price | version\n7 | 579 | 4\n9 | 1200 | 3\n",
              hidden: true,
            },
            {
              stdin: PRODUCTS("(6, 'Shelf', 900, 3), (7, 'Desk lamp', 10, 3)"),
              expected: "id | price | version\n6 | 900 | 3\n7 | 549 | 4\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Who is blocking everyone?",
          prompt: `\`lock_waits\` is a snapshot of current waits (\`waiting_txn\` waits for \`blocking_txn\`, for \`wait_secs\` so far). For each blocking transaction, report how many transactions wait on it, the longest wait, and whether it is a **root** blocker — not itself waiting for anyone (\`'yes'\`/\`'no'\`). Root blockers are the ones a DBA looks at first.

\`lock_waits\`:

| waiting_txn | blocking_txn | wait_secs |
| --- | --- | --- |
| 12 | 10 | 41 |
| 13 | 10 | 8 |
| 14 | 12 | 30 |
| 15 | 11 | 5 |
| 16 | 12 | 2 |

**Output columns:** \`blocking_txn\`, \`waiters\`, \`longest_wait\`, \`is_root\`, ordered by \`waiters\` descending, then \`longest_wait\` descending, then \`blocking_txn\`.

\`\`\`text
blocking_txn | waiters | longest_wait | is_root
10 | 2 | 41 | yes
12 | 2 | 30 | no
11 | 1 | 5 | yes
\`\`\``,
          starter: String.raw`-- GROUP BY blocking_txn: COUNT(*), MAX(wait_secs);
-- is_root = 'yes' when the blocker never appears as a waiting_txn.
`,
          solution: String.raw`SELECT b.blocking_txn,
       COUNT(*) AS waiters,
       MAX(b.wait_secs) AS longest_wait,
       CASE WHEN EXISTS (SELECT 1 FROM lock_waits w WHERE w.waiting_txn = b.blocking_txn)
            THEN 'no' ELSE 'yes' END AS is_root
FROM lock_waits b
GROUP BY b.blocking_txn
ORDER BY waiters DESC, longest_wait DESC, b.blocking_txn;
`,
          hints: [
            "`GROUP BY blocking_txn` with `COUNT(*)` and `MAX(wait_secs)`.",
            "A correlated `EXISTS (SELECT 1 FROM lock_waits w WHERE w.waiting_txn = b.blocking_txn)` says the blocker is itself waiting.",
          ],
          cases: [
            {
              stdin: BLOCKERS("INSERT INTO lock_waits VALUES (12, 10, 41), (13, 10, 8), (14, 12, 30), (15, 11, 5), (16, 12, 2);"),
              expected: "blocking_txn | waiters | longest_wait | is_root\n10 | 2 | 41 | yes\n12 | 2 | 30 | no\n11 | 1 | 5 | yes\n",
            },
            {
              stdin: BLOCKERS(""),
              expected: "blocking_txn | waiters | longest_wait | is_root\n(no rows)\n",
              hidden: true,
            },
            {
              stdin: BLOCKERS("INSERT INTO lock_waits VALUES (2, 1, 9), (3, 1, 9), (1, 3, 9), (4, 5, 9), (6, 5, 9);"),
              expected: "blocking_txn | waiters | longest_wait | is_root\n1 | 2 | 9 | no\n5 | 2 | 9 | yes\n3 | 1 | 9 | no\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which pairing of ACID property and InnoDB mechanism is correct?",
          options: ["Atomicity — redo log", "Durability — redo log flushed at commit; atomicity — undo log", "Isolation — binary log", "Consistency — doublewrite buffer"],
          answer: 1,
          explanation: "The redo log makes committed work survive crashes; the undo log lets uncommitted work be rolled back and also feeds MVCC snapshots. Consistency comes from constraints and correct transactions.",
        },
        {
          prompt: "Which anomalies does READ COMMITTED still allow?",
          options: ["Dirty reads only", "Non-repeatable reads and phantoms", "Phantoms only", "None"],
          answer: 1,
          explanation: "Each statement sees the latest committed data, so a repeated read can see a changed row or new rows. Only uncommitted data is hidden.",
        },
        {
          prompt: "In InnoDB, what does a plain `SELECT` (no `FOR UPDATE`) lock under REPEATABLE READ?",
          options: ["Every row it reads, shared", "Nothing — it reads a consistent snapshot", "The whole table", "The gaps only"],
          answer: 1,
          explanation: "Consistent reads use MVCC and take no row locks. Only under SERIALIZABLE with autocommit off do plain SELECTs become `FOR SHARE`.",
        },
        {
          prompt: "Why can an `UPDATE … WHERE customer_email = ?` lock far more rows than it changes?",
          options: ["UPDATE always locks the table", "Without an index on `customer_email` it scans, and InnoDB locks every index record it scans", "Because of autocommit", "MVCC copies every row"],
          answer: 1,
          explanation: "Locks are placed on the records a statement examines. An index on the filtered column limits the scan — and the locks — to the matching rows.",
        },
        {
          prompt: "Error 1205 `Lock wait timeout exceeded` means…",
          options: ["A deadlock was detected", "A statement waited longer than `innodb_lock_wait_timeout` for a lock", "The connection timed out", "The redo log is full"],
          answer: 1,
          explanation: "1205 is a plain wait that ran out of time (50 s by default), usually behind a transaction someone left open. A deadlock is error 1213 and is detected immediately.",
        },
        {
          prompt: "When does optimistic locking fit better than `SELECT … FOR UPDATE`?",
          options: ["When the same hot row is updated constantly", "When conflicts are rare and the user may take minutes between reading and saving", "When the table has no primary key", "Never — it is unsafe"],
          answer: 1,
          explanation: "Holding a lock while a person edits a form blocks everyone else; a version check costs nothing until a conflict actually happens. For hot rows with frequent conflicts, retries pile up and pessimistic locking wins.",
        },
        {
          prompt: "A deadlock victim was rolled back with error 1213. What should the application do?",
          options: ["Report data corruption", "Retry the whole transaction", "Retry only the last statement", "Raise the isolation level"],
          answer: 1,
          explanation: "The entire transaction was rolled back cleanly, so re-running it from the start is safe; retrying only the failed statement would miss the earlier, undone work.",
        },
        {
          prompt: "Under READ COMMITTED, when does InnoDB create a read view?",
          options: ["Once per transaction", "At the start of each consistent-read statement", "Only on COMMIT", "Never"],
          answer: 1,
          explanation: "A fresh view per statement is why READ COMMITTED sees other transactions' commits mid-transaction. REPEATABLE READ creates one per transaction.",
        },
        {
          prompt: "In PostgreSQL, two REPEATABLE READ transactions update the same row; the first commits. What happens to the second?",
          options: ["It overwrites the first's change", "It fails with a serialization error and must be retried", "It waits forever", "It silently does nothing"],
          answer: 1,
          explanation: "PostgreSQL's REPEATABLE READ is snapshot isolation and refuses to update a row changed since the snapshot. InnoDB instead applies the update to the latest committed version.",
        },
        {
          prompt: "What does `RELEASE SAVEPOINT s1` do?",
          options: ["Rolls back to `s1`", "Removes `s1` (and later savepoints) while keeping all the changes", "Commits the transaction", "Releases the row locks taken after `s1`"],
          answer: 1,
          explanation: "Release is bookkeeping only; the changes stay pending until the transaction commits or rolls back, and locks are held until then.",
        },
        {
          prompt: "Which statement about savepoints and locks in InnoDB is true?",
          options: ["ROLLBACK TO SAVEPOINT releases every lock taken after the savepoint", "Row locks taken after the savepoint are generally kept until the transaction ends", "Savepoints prevent deadlocks", "A savepoint locks the whole table"],
          answer: 1,
          explanation: "InnoDB undoes the changes but keeps the locks it stored in memory after the savepoint; only locks on rows inserted after it go away with the undo.",
        },
        {
          prompt: "Which tool shows which transaction is blocking which in MySQL 8?",
          options: ["`SHOW TABLES`", "`sys.innodb_lock_waits` (over `performance_schema.data_lock_waits`)", "`EXPLAIN ANALYZE`", "`information_schema.COLUMNS`"],
          answer: 1,
          explanation: "`performance_schema.data_locks` and `data_lock_waits` expose the locks; the `sys.innodb_lock_waits` view pairs each waiting transaction with its blocker and their queries. `SHOW ENGINE INNODB STATUS` shows the latest deadlock.",
        },
      ],
    },
  ],
});
