import { defineModule } from "../../dsl.js";

/*
 * Every case's stdin is the setup script the exercise's tables come from
 * (sql/track.ts has the rules). The data-changing exercises end with the
 * SELECT that shows the effect, and that SELECT is already in the starter.
 *
 * Two engine facts these datasets avoid on purpose: SQLite reuses a deleted
 * row's id where InnoDB never does, so no exercise prints an id generated
 * after a DELETE; and an `INT PRIMARY KEY` in a setup is not auto-numbered,
 * so every setup row carries its id.
 */

const productsSetup = (rows: string, inStockDefault = 0) => String.raw`CREATE TABLE products (
  id INT PRIMARY KEY,
  name VARCHAR(40) NOT NULL,
  category VARCHAR(20) NOT NULL,
  price DECIMAL(8,2) NOT NULL,
  in_stock INT NOT NULL DEFAULT ${inStockDefault}
);
${rows}`;

const ordersArchiveSetup = (orders: string, archive = "") => String.raw`CREATE TABLE orders (
  id INT PRIMARY KEY,
  customer VARCHAR(30) NOT NULL,
  total DECIMAL(8,2) NOT NULL,
  placed_on DATE NOT NULL
);
CREATE TABLE orders_archive (
  id INT PRIMARY KEY,
  customer VARCHAR(30) NOT NULL,
  total DECIMAL(8,2) NOT NULL,
  placed_on DATE NOT NULL,
  archived_on DATE NOT NULL
);
${orders}
${archive}`;

const repriceSetup = (rows: string) => String.raw`CREATE TABLE products (
  id INT PRIMARY KEY,
  name VARCHAR(40) NOT NULL,
  category VARCHAR(20),
  price DECIMAL(8,2) NOT NULL
);
${rows}`;

const priceListSetup = (products: string, changes: string) => String.raw`CREATE TABLE products (
  id INT PRIMARY KEY,
  sku VARCHAR(10) NOT NULL UNIQUE,
  name VARCHAR(40) NOT NULL,
  price DECIMAL(8,2) NOT NULL,
  repriced INT NOT NULL DEFAULT 0
);
CREATE TABLE price_changes (
  sku VARCHAR(10) PRIMARY KEY,
  new_price DECIMAL(8,2) NOT NULL
);
${products}
${changes}`;

const sessionsSetup = (rows: string) => String.raw`CREATE TABLE sessions (
  id INT PRIMARY KEY,
  user_id INT NOT NULL,
  expires_on DATE
);
${rows}`;

const orphansSetup = (customers: string, orders: string) => String.raw`CREATE TABLE customers (
  id INT PRIMARY KEY,
  name VARCHAR(30) NOT NULL
);
CREATE TABLE orders (
  id INT PRIMARY KEY,
  customer_id INT,
  total DECIMAL(8,2) NOT NULL
);
${customers}
${orders}`;

const feedSetup = (catalog: string, feed: string) => String.raw`CREATE TABLE catalog (
  sku VARCHAR(10) PRIMARY KEY,
  name VARCHAR(40) NOT NULL,
  price DECIMAL(8,2) NOT NULL,
  on_sale INT NOT NULL DEFAULT 0
);
CREATE TABLE feed (
  sku VARCHAR(10) PRIMARY KEY,
  name VARCHAR(40) NOT NULL,
  price DECIMAL(8,2) NOT NULL
);
${catalog}
${feed}`;

const viewsSetup = (pageViews: string, today: string) => String.raw`CREATE TABLE page_views (
  path VARCHAR(50) PRIMARY KEY,
  views INT NOT NULL
);
CREATE TABLE today (
  path VARCHAR(50) PRIMARY KEY,
  hits INT NOT NULL
);
${pageViews}
${today}`;

const accountsSetup = (accounts: string, transfers = "") => String.raw`CREATE TABLE accounts (
  id INT PRIMARY KEY,
  owner VARCHAR(30) NOT NULL,
  balance DECIMAL(10,2) NOT NULL
);
CREATE TABLE transfers (
  from_id INT NOT NULL,
  to_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL
);
${accounts}
${transfers}`;

const shippingSetup = (rows: string) => String.raw`CREATE TABLE orders (
  id INT PRIMARY KEY,
  status VARCHAR(10) NOT NULL,
  total DECIMAL(8,2) NOT NULL
);
${rows}`;

const signupSetup = (subscribers: string, signups: string) => String.raw`CREATE TABLE subscribers (
  email VARCHAR(100) PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  source VARCHAR(20) NOT NULL
);
CREATE TABLE signups (
  id INT PRIMARY KEY,
  email VARCHAR(100) NOT NULL,
  name VARCHAR(50) NOT NULL
);
${subscribers}
${signups}`;

const invoicesSetup = (invoices: string, archive = "") => String.raw`CREATE TABLE invoices (
  id INT PRIMARY KEY,
  customer VARCHAR(30) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(10) NOT NULL,
  issued_on DATE NOT NULL
);
CREATE TABLE invoices_archive (
  id INT PRIMARY KEY,
  customer VARCHAR(30) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  closed_on DATE NOT NULL
);
${invoices}
${archive}`;

const deliverySetup = (products: string, delivery: string) => String.raw`CREATE TABLE products (
  sku VARCHAR(10) PRIMARY KEY,
  name VARCHAR(40) NOT NULL,
  qty INT NOT NULL,
  price DECIMAL(8,2) NOT NULL
);
CREATE TABLE delivery (
  sku VARCHAR(10) PRIMARY KEY,
  name VARCHAR(40) NOT NULL,
  qty INT NOT NULL,
  price DECIMAL(8,2) NOT NULL
);
${products}
${delivery}`;

export default defineModule(import.meta.url, {
  slug: "modifying-data",
  title: "Modifying data",
  blurb: "INSERT with column lists, many rows and INSERT ... SELECT; UPDATE with expressions, CASE and values from another table; DELETE, TRUNCATE and DROP; MySQL upserts with ON DUPLICATE KEY UPDATE, REPLACE and INSERT IGNORE; and transactions with COMMIT, ROLLBACK and savepoints.",
  icon: "layers",
  overview: `Everything before this module read data; this one changes it. Four statements do all of it — \`INSERT\` adds rows, \`UPDATE\` changes them, \`DELETE\` removes them, and the upsert forms decide between inserting and updating — and one mechanism, the transaction, makes several of them succeed or fail together. They are short statements with a large blast radius: an UPDATE without its WHERE rewrites every row, a TRUNCATE in MySQL cannot be rolled back, and a REPLACE quietly resets every column it was not given. The module teaches each with the habits that prevent those accidents, in MySQL 8 with InnoDB, and names the PostgreSQL spellings that interviews ask about.

INSERT covers the column list and why to always write it, multi-row values, defaults, AUTO_INCREMENT and \`LAST_INSERT_ID()\`, and \`INSERT ... SELECT\`. UPDATE covers SET and WHERE, computing from the old value, \`CASE\` for several rules in one pass, values from another table (correlated subqueries, MySQL's \`UPDATE ... JOIN\`, PostgreSQL's \`UPDATE ... FROM\`) and MySQL's left-to-right SET quirk. DELETE covers subqueries and \`NOT EXISTS\`, multi-table DELETE, \`ON DELETE\` actions, the DELETE vs TRUNCATE vs DROP comparison, and soft deletes. Upserts cover \`ON DUPLICATE KEY UPDATE\`, \`REPLACE INTO\`, \`INSERT IGNORE\`, PostgreSQL's \`ON CONFLICT\`, \`MERGE\`, and the portable update-then-insert. Transactions cover \`START TRANSACTION\`, \`COMMIT\`, \`ROLLBACK\`, autocommit, savepoints, errors and MySQL's implicit commits.

Every exercise is a script that changes a small, realistic dataset and ends with the SELECT that shows the result: stocking new products, archiving last year's orders, a seasonal repricing, applying a supplier's price list, purging expired sessions, removing orphaned orders, loading a product feed, counting page views, a bank transfer and a savepoint that cancels part of a transaction. The checkpoint adds a deduplicating import, a month-end close in one transaction and a stock sync from a delivery.`,
  lessons: [
    {
      slug: "insert",
      file: "01-insert.md",
      exercises: [
        {
          title: "Stock a new product line",
          prompt: `The shop is adding three products. Insert them into \`products\`, always with an explicit column list — the first two in one multi-row INSERT:

| id | name | category | price | in_stock |
| --- | --- | --- | --- | --- |
| 201 | USB-C cable | cables | 9.99 | 40 |
| 202 | HDMI cable | cables | 12.50 | 25 |
| 203 | Cable ties | accessories | 3.00 | *(not given — use the column's default)* |

Leave \`in_stock\` out of the third product's column list so the table's \`DEFAULT\` applies — don't write the default's value yourself (it is not always 0). Then show every product: columns \`id, name, price, in_stock\`, ordered by \`id\`.

The table already holds:

| id | name | category | price | in_stock |
| --- | --- | --- | --- | --- |
| 101 | Desk lamp | lighting | 24.99 | 12 |
| 102 | Floor lamp | lighting | 79.00 | 4 |

The judge prints numbers without trailing zeros (79.00 as \`79\`, 12.50 as \`12.5\`).

\`\`\`text
id | name | price | in_stock
101 | Desk lamp | 24.99 | 12
102 | Floor lamp | 79 | 4
201 | USB-C cable | 9.99 | 40
202 | HDMI cable | 12.5 | 25
203 | Cable ties | 3 | 0
\`\`\``,
          starter: String.raw`-- Insert the three products here (one INSERT, explicit column list).


SELECT id, name, price, in_stock
FROM products
ORDER BY id;
`,
          solution: String.raw`INSERT INTO products (id, name, category, price, in_stock)
VALUES
  (201, 'USB-C cable', 'cables', 9.99, 40),
  (202, 'HDMI cable', 'cables', 12.50, 25);
INSERT INTO products (id, name, category, price)
VALUES (203, 'Cable ties', 'accessories', 3.00);

SELECT id, name, price, in_stock
FROM products
ORDER BY id;
`,
          hints: [
            "A multi-row INSERT is `INSERT INTO t (cols) VALUES (...), (...), (...);` — but every value list must have one value per listed column.",
            "To let the default apply to just one row, that row needs a column list without `in_stock`: either a second INSERT for it, or MySQL's `DEFAULT` keyword (which this engine does not run). Two INSERTs are fine.",
          ],
          cases: [
            {
              stdin: productsSetup("INSERT INTO products (id, name, category, price, in_stock) VALUES (101, 'Desk lamp', 'lighting', 24.99, 12), (102, 'Floor lamp', 'lighting', 79.00, 4);"),
              expected: "id | name | price | in_stock\n101 | Desk lamp | 24.99 | 12\n102 | Floor lamp | 79 | 4\n201 | USB-C cable | 9.99 | 40\n202 | HDMI cable | 12.5 | 25\n203 | Cable ties | 3 | 0\n",
            },
            {
              stdin: productsSetup(""),
              expected: "id | name | price | in_stock\n201 | USB-C cable | 9.99 | 40\n202 | HDMI cable | 12.5 | 25\n203 | Cable ties | 3 | 0\n",
              hidden: true,
            },
            {
              stdin: productsSetup("INSERT INTO products (id, name, category, price, in_stock) VALUES (300, 'Power strip', 'power', 18.00, 7);", 5),
              expected: "id | name | price | in_stock\n201 | USB-C cable | 9.99 | 40\n202 | HDMI cable | 12.5 | 25\n203 | Cable ties | 3 | 5\n300 | Power strip | 18 | 7\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Archive last year's orders",
          prompt: `Copy every order placed **before 2024-01-01** from \`orders\` into \`orders_archive\` with one \`INSERT ... SELECT\`, setting \`archived_on\` to \`'2024-06-30'\` for each copied row. Do not change \`orders\`. Then show the archive: columns \`id, customer, total, archived_on\`, ordered by \`id\`.

\`orders\`:

| id | customer | total | placed_on |
| --- | --- | --- | --- |
| 1 | Asha | 120.00 | 2023-11-02 |
| 2 | Ben | 45.50 | 2023-12-31 |
| 3 | Chen | 80.00 | 2024-01-01 |
| 4 | Asha | 15.25 | 2024-02-14 |
| 5 | Dev | 60.00 | 2023-07-19 |

\`orders_archive\` has the same columns plus \`archived_on DATE\`, and starts empty here (it may already hold rows — keep them).

\`\`\`text
id | customer | total | archived_on
1 | Asha | 120 | 2024-06-30
2 | Ben | 45.5 | 2024-06-30
5 | Dev | 60 | 2024-06-30
\`\`\``,
          starter: String.raw`-- Copy the orders placed before 2024-01-01 into orders_archive.


SELECT id, customer, total, archived_on
FROM orders_archive
ORDER BY id;
`,
          solution: String.raw`INSERT INTO orders_archive (id, customer, total, placed_on, archived_on)
SELECT id, customer, total, placed_on, '2024-06-30'
FROM orders
WHERE placed_on < '2024-01-01';

SELECT id, customer, total, archived_on
FROM orders_archive
ORDER BY id;
`,
          hints: [
            "`INSERT INTO orders_archive (...) SELECT ... FROM orders WHERE ...;` — no VALUES keyword.",
            "A literal in the SELECT list (`'2024-06-30'`) supplies the same value for every row; columns match by position, so list them in the same order on both sides.",
            "Before 2024-01-01 means `placed_on < '2024-01-01'` — the order placed on New Year's Day stays out.",
          ],
          cases: [
            {
              stdin: ordersArchiveSetup("INSERT INTO orders VALUES (1, 'Asha', 120.00, '2023-11-02'), (2, 'Ben', 45.50, '2023-12-31'), (3, 'Chen', 80.00, '2024-01-01'), (4, 'Asha', 15.25, '2024-02-14'), (5, 'Dev', 60.00, '2023-07-19');"),
              expected: "id | customer | total | archived_on\n1 | Asha | 120 | 2024-06-30\n2 | Ben | 45.5 | 2024-06-30\n5 | Dev | 60 | 2024-06-30\n",
            },
            {
              stdin: ordersArchiveSetup("INSERT INTO orders VALUES (7, 'Eve', 20.00, '2024-01-01'), (8, 'Fay', 35.00, '2024-03-09');"),
              expected: "id | customer | total | archived_on\n(no rows)\n",
              hidden: true,
            },
            {
              stdin: ordersArchiveSetup(
                "INSERT INTO orders VALUES (11, 'Gus', 99.99, '2023-12-01'), (12, 'Hal', 10.00, '2024-05-05');",
                "INSERT INTO orders_archive VALUES (2, 'Old', 10.00, '2022-01-05', '2023-01-01');",
              ),
              expected: "id | customer | total | archived_on\n2 | Old | 10 | 2023-01-01\n11 | Gus | 99.99 | 2024-06-30\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Why write the column list in `INSERT INTO products (id, name, price) VALUES (...)` instead of `INSERT INTO products VALUES (...)`?",
          options: [
            "The column list is required by MySQL",
            "It keeps working, and keeps values in the right columns, when the table gains or reorders columns",
            "It makes the insert faster",
            "Without it, defaults are applied to every column",
          ],
          answer: 1,
          explanation: "Without a list, the values must match every column in declared order, so a schema change breaks the statement or shifts values into the wrong columns. The list is optional syntax and has no effect on speed.",
        },
        {
          prompt: "A table declares `status VARCHAR(10) NOT NULL DEFAULT 'open'`. What does `INSERT INTO tickets (subject, status) VALUES ('VPN', NULL)` do?",
          options: [
            "Inserts the row with status `'open'`",
            "Inserts the row with status NULL",
            "Fails, because NULL was asked for explicitly and the column is NOT NULL",
            "Inserts the row with an empty string",
          ],
          answer: 2,
          explanation: "The default is used only when the column is omitted (or `DEFAULT` is written). An explicit NULL is a value, and NOT NULL refuses it in strict mode.",
        },
        {
          prompt: "Two sessions insert orders at the same time and each needs the id it was given. What should each use?",
          options: [
            "`SELECT MAX(id) FROM orders` after the insert",
            "`SELECT MAX(id) + 1` before the insert, then insert with that id",
            "`LAST_INSERT_ID()` on its own connection",
            "`SELECT COUNT(*) FROM orders`",
          ],
          answer: 2,
          explanation: "`LAST_INSERT_ID()` is per connection, so each session sees its own id. MAX-based approaches race: both sessions can read the same maximum.",
        },
        {
          prompt: "How does `INSERT INTO archive (id, total, customer) SELECT id, customer, total FROM orders` match columns?",
          options: [
            "By name, so it works correctly",
            "By position: `customer` goes into `total` and `total` into `customer`",
            "It fails because the names differ",
            "By data type",
          ],
          answer: 1,
          explanation: "INSERT ... SELECT matches the SELECT's columns to the INSERT's list by position. Mismatched orders often go unnoticed when the types are compatible — keep both lists in the same order.",
        },
        {
          prompt: "A three-row `INSERT ... VALUES (...), (...), (...)` has a duplicate primary key in the third row. On InnoDB, what is inserted?",
          options: ["The first two rows", "Nothing", "All three, with the duplicate renumbered", "Only the third row"],
          answer: 1,
          explanation: "A single statement is atomic: if any row fails, the whole statement is rolled back. Skipping only the bad rows is what INSERT IGNORE is for.",
        },
      ],
    },
    {
      slug: "update",
      file: "02-update.md",
      exercises: [
        {
          title: "Seasonal repricing",
          prompt: `Apply the season's price rules in **one** UPDATE using \`CASE\`:

- \`books\`: up 10%, rounded to 2 decimal places;
- \`toys\`: 20% off, rounded to 2 decimal places;
- every other product (including one with no category) keeps its price.

Then show the products: columns \`id, name, category, price\`, ordered by \`id\`.

| id | name | category | price |
| --- | --- | --- | --- |
| 1 | SQL Basics | books | 30.00 |
| 2 | Robot kit | toys | 49.99 |
| 3 | Puzzle | toys | 12.50 |
| 4 | Desk | furniture | 150.00 |
| 5 | Atlas | books | 19.99 |

\`\`\`text
id | name | category | price
1 | SQL Basics | books | 33
2 | Robot kit | toys | 39.99
3 | Puzzle | toys | 10
4 | Desk | furniture | 150
5 | Atlas | books | 21.99
\`\`\``,
          starter: String.raw`-- One UPDATE with a CASE expression.


SELECT id, name, category, price
FROM products
ORDER BY id;
`,
          solution: String.raw`UPDATE products
SET price = CASE
              WHEN category = 'books' THEN ROUND(price * 1.10, 2)
              WHEN category = 'toys'  THEN ROUND(price * 0.80, 2)
              ELSE price
            END
WHERE category IN ('books', 'toys');

SELECT id, name, category, price
FROM products
ORDER BY id;
`,
          hints: [
            "`SET price = CASE WHEN category = 'books' THEN ... WHEN category = 'toys' THEN ... ELSE price END`.",
            "Without `ELSE price`, rows that match no branch get NULL. A `WHERE category IN ('books', 'toys')` also keeps the others out of the statement.",
          ],
          cases: [
            {
              stdin: repriceSetup("INSERT INTO products VALUES (1, 'SQL Basics', 'books', 30.00), (2, 'Robot kit', 'toys', 49.99), (3, 'Puzzle', 'toys', 12.50), (4, 'Desk', 'furniture', 150.00), (5, 'Atlas', 'books', 19.99);"),
              expected: "id | name | category | price\n1 | SQL Basics | books | 33\n2 | Robot kit | toys | 39.99\n3 | Puzzle | toys | 10\n4 | Desk | furniture | 150\n5 | Atlas | books | 21.99\n",
            },
            {
              stdin: repriceSetup("INSERT INTO products VALUES (1, 'Mystery box', NULL, 25.00), (2, 'Lamp', 'lighting', 18.40), (3, 'Novel', 'books', 12.00);"),
              expected: "id | name | category | price\n1 | Mystery box | NULL | 25\n2 | Lamp | lighting | 18.4\n3 | Novel | books | 13.2\n",
              hidden: true,
            },
            {
              stdin: repriceSetup("INSERT INTO products VALUES (7, 'Yo-yo', 'toys', 4.00), (8, 'Kite', 'toys', 22.40);"),
              expected: "id | name | category | price\n7 | Yo-yo | toys | 3.2\n8 | Kite | toys | 17.92\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Apply a supplier's price list",
          prompt: `A supplier sent new prices, loaded into \`price_changes(sku, new_price)\`. For every product whose \`sku\` appears there, set \`price\` to the new price **and** set \`repriced\` to 1. Products not in the list must be left exactly as they are, and a price-list row for a sku the shop does not stock is ignored. Write it as portable SQL (a subquery in SET plus a WHERE), not MySQL's \`UPDATE ... JOIN\`.

Then show the products: columns \`id, sku, price, repriced\`, ordered by \`id\`.

\`products\`:

| id | sku | name | price | repriced |
| --- | --- | --- | --- | --- |
| 1 | A100 | Kettle | 25.00 | 0 |
| 2 | B200 | Toaster | 30.00 | 0 |
| 3 | C300 | Blender | 55.00 | 0 |
| 4 | D400 | Mixer | 80.00 | 0 |

\`price_changes\`: (B200, 27.50), (D400, 85.00), (Z999, 10.00).

\`\`\`text
id | sku | price | repriced
1 | A100 | 25 | 0
2 | B200 | 27.5 | 1
3 | C300 | 55 | 0
4 | D400 | 85 | 1
\`\`\``,
          starter: String.raw`-- Update products from price_changes.


SELECT id, sku, price, repriced
FROM products
ORDER BY id;
`,
          solution: String.raw`UPDATE products
SET price = (SELECT c.new_price FROM price_changes c WHERE c.sku = products.sku),
    repriced = 1
WHERE sku IN (SELECT sku FROM price_changes);

SELECT id, sku, price, repriced
FROM products
ORDER BY id;
`,
          hints: [
            "A correlated subquery reads the matching row: `(SELECT c.new_price FROM price_changes c WHERE c.sku = products.sku)`.",
            "Without a WHERE, products with no price change get NULL from the subquery. Restrict the update with `WHERE sku IN (SELECT sku FROM price_changes)`.",
          ],
          cases: [
            {
              stdin: priceListSetup(
                "INSERT INTO products VALUES (1, 'A100', 'Kettle', 25.00, 0), (2, 'B200', 'Toaster', 30.00, 0), (3, 'C300', 'Blender', 55.00, 0), (4, 'D400', 'Mixer', 80.00, 0);",
                "INSERT INTO price_changes VALUES ('B200', 27.50), ('D400', 85.00), ('Z999', 10.00);",
              ),
              expected: "id | sku | price | repriced\n1 | A100 | 25 | 0\n2 | B200 | 27.5 | 1\n3 | C300 | 55 | 0\n4 | D400 | 85 | 1\n",
            },
            {
              stdin: priceListSetup("INSERT INTO products VALUES (1, 'A100', 'Kettle', 25.00, 0), (2, 'B200', 'Toaster', 30.00, 1);", ""),
              expected: "id | sku | price | repriced\n1 | A100 | 25 | 0\n2 | B200 | 30 | 1\n",
              hidden: true,
            },
            {
              stdin: priceListSetup(
                "INSERT INTO products VALUES (5, 'E500', 'Grill', 120.00, 0), (6, 'F600', 'Fan', 40.00, 0);",
                "INSERT INTO price_changes VALUES ('F600', 35.99), ('E500', 110.00);",
              ),
              expected: "id | sku | price | repriced\n5 | E500 | 110 | 1\n6 | F600 | 35.99 | 1\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does `UPDATE customers SET country = 'IN';` do?",
          options: [
            "Nothing — an UPDATE needs a WHERE",
            "Sets `country` to 'IN' on every row of the table",
            "Sets it on the first row only",
            "Asks for confirmation first",
          ],
          answer: 1,
          explanation: "A missing WHERE matches every row. MySQL only refuses it when `sql_safe_updates` is on; there is no confirmation.",
        },
        {
          prompt: "`UPDATE products SET price = CASE WHEN category = 'books' THEN price * 1.1 END;` runs on a table with books and toys. What happens to the toys?",
          options: ["Their price is unchanged", "Their price becomes NULL (or the statement fails on a NOT NULL column)", "Their price is multiplied by 1.1", "The statement is rejected for a missing ELSE"],
          answer: 1,
          explanation: "A CASE with no matching branch and no ELSE yields NULL, and there is no WHERE, so every toy is assigned NULL. Add `ELSE price` and a WHERE.",
        },
        {
          prompt: "Why is `UPDATE accounts SET balance = balance - 250 WHERE id = 1` safer than reading the balance in the application, subtracting, and writing the result back?",
          options: [
            "It is shorter",
            "The database reads and writes the row atomically, so two concurrent withdrawals cannot overwrite each other",
            "It skips the WHERE clause check",
            "It avoids the need for an index",
          ],
          answer: 1,
          explanation: "Read-then-write in the application is the lost-update race: two requests read 1000, both write 750. The in-database expression locks the row while it computes.",
        },
        {
          prompt: "In MySQL, with `a = 1, b = 0`, what does `UPDATE t SET a = a + 1, b = a;` leave in `b`?",
          options: ["0", "1", "2", "NULL"],
          answer: 2,
          explanation: "MySQL evaluates single-table SET assignments left to right, so `b = a` sees the new a (2). Standard SQL, PostgreSQL and SQLite would give 1. Don't rely on either.",
        },
        {
          prompt: "Which statement updates `products` from `price_changes` in PostgreSQL?",
          options: [
            "`UPDATE products p JOIN price_changes c ON c.sku = p.sku SET p.price = c.new_price;`",
            "`UPDATE products SET price = c.new_price FROM price_changes c WHERE c.sku = products.sku;`",
            "`UPDATE products, price_changes SET price = new_price;`",
            "`MERGE products SET price = new_price;`",
          ],
          answer: 1,
          explanation: "PostgreSQL uses `UPDATE ... FROM ... WHERE`. The JOIN form is MySQL's multi-table UPDATE; the comma form without a condition would pair every row with every row.",
        },
      ],
    },
    {
      slug: "delete",
      file: "03-delete.md",
      exercises: [
        {
          title: "Purge expired sessions",
          prompt: `Delete every session that expired **before 2024-06-01** (a session expiring on 2024-06-01 itself stays). A session with no expiry date (\`expires_on\` is NULL) never expires and must stay.

Then print two result sets: the number of sessions left as \`remaining\`, and the sessions left with columns \`id, user_id, expires_on\`, ordered by \`id\`.

| id | user_id | expires_on |
| --- | --- | --- |
| 1 | 10 | 2024-05-30 |
| 2 | 11 | 2024-06-01 |
| 3 | 10 | 2024-07-15 |
| 4 | 12 | 2024-01-01 |
| 5 | 13 | 2024-06-02 |

\`\`\`text
remaining
3

id | user_id | expires_on
2 | 11 | 2024-06-01
3 | 10 | 2024-07-15
5 | 13 | 2024-06-02
\`\`\``,
          starter: String.raw`-- Delete the expired sessions.


SELECT COUNT(*) AS remaining FROM sessions;

SELECT id, user_id, expires_on
FROM sessions
ORDER BY id;
`,
          solution: String.raw`DELETE FROM sessions
WHERE expires_on < '2024-06-01';

SELECT COUNT(*) AS remaining FROM sessions;

SELECT id, user_id, expires_on
FROM sessions
ORDER BY id;
`,
          hints: [
            "`DELETE FROM sessions WHERE ...;` — test the condition as a SELECT first.",
            "A NULL `expires_on` makes `expires_on < '2024-06-01'` unknown, so the row is not deleted — exactly what the rule wants.",
          ],
          cases: [
            {
              stdin: sessionsSetup("INSERT INTO sessions VALUES (1, 10, '2024-05-30'), (2, 11, '2024-06-01'), (3, 10, '2024-07-15'), (4, 12, '2024-01-01'), (5, 13, '2024-06-02');"),
              expected: "remaining\n3\n\nid | user_id | expires_on\n2 | 11 | 2024-06-01\n3 | 10 | 2024-07-15\n5 | 13 | 2024-06-02\n",
            },
            {
              stdin: sessionsSetup("INSERT INTO sessions VALUES (1, 10, '2023-12-31'), (2, 11, '2024-05-31');"),
              expected: "remaining\n0\n\nid | user_id | expires_on\n(no rows)\n",
              hidden: true,
            },
            {
              stdin: sessionsSetup("INSERT INTO sessions VALUES (6, 14, NULL), (7, 15, '2024-02-02'), (8, 14, '2025-01-01');"),
              expected: "remaining\n2\n\nid | user_id | expires_on\n6 | 14 | NULL\n8 | 14 | 2025-01-01\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Remove orphaned orders",
          prompt: `The \`orders\` table has rows whose customer was removed long ago. Clean up in two DELETEs:

1. delete every order whose \`customer_id\` matches no row in \`customers\` — **including** orders whose \`customer_id\` is NULL;
2. then delete every customer who has no orders left.

Then print the orders left (\`id, customer_id\`, ordered by \`id\`) and the customers left (\`id, name\`, ordered by \`id\`).

\`customers\`: (1, Asha), (2, Ben), (3, Chen).

\`orders\`:

| id | customer_id | total |
| --- | --- | --- |
| 10 | 1 | 50.00 |
| 11 | 4 | 20.00 |
| 12 | 2 | 35.00 |
| 13 | NULL | 15.00 |
| 14 | 1 | 10.00 |
| 15 | 5 | 99.00 |

\`\`\`text
id | customer_id
10 | 1
12 | 2
14 | 1

id | name
1 | Asha
2 | Ben
\`\`\``,
          starter: String.raw`-- 1. Delete orphaned orders.
-- 2. Delete customers with no orders left.


SELECT id, customer_id FROM orders ORDER BY id;

SELECT id, name FROM customers ORDER BY id;
`,
          solution: String.raw`DELETE FROM orders
WHERE NOT EXISTS (
  SELECT 1 FROM customers c WHERE c.id = orders.customer_id
);

DELETE FROM customers
WHERE NOT EXISTS (
  SELECT 1 FROM orders o WHERE o.customer_id = customers.id
);

SELECT id, customer_id FROM orders ORDER BY id;

SELECT id, name FROM customers ORDER BY id;
`,
          hints: [
            "`NOT EXISTS (SELECT 1 FROM customers c WHERE c.id = orders.customer_id)` is true when no customer matches — and a NULL customer_id matches nobody.",
            "`customer_id NOT IN (SELECT id FROM customers)` misses the NULL row: `NULL NOT IN (...)` is unknown, so it is never deleted.",
            "The second DELETE is the same pattern the other way round, and it must run after the first.",
          ],
          cases: [
            {
              stdin: orphansSetup(
                "INSERT INTO customers VALUES (1, 'Asha'), (2, 'Ben'), (3, 'Chen');",
                "INSERT INTO orders VALUES (10, 1, 50.00), (11, 4, 20.00), (12, 2, 35.00), (13, NULL, 15.00), (14, 1, 10.00), (15, 5, 99.00);",
              ),
              expected: "id | customer_id\n10 | 1\n12 | 2\n14 | 1\n\nid | name\n1 | Asha\n2 | Ben\n",
            },
            {
              stdin: orphansSetup(
                "INSERT INTO customers VALUES (1, 'Asha'), (2, 'Ben');",
                "INSERT INTO orders VALUES (20, 2, 12.00), (21, 1, 8.00);",
              ),
              expected: "id | customer_id\n20 | 2\n21 | 1\n\nid | name\n1 | Asha\n2 | Ben\n",
              hidden: true,
            },
            {
              stdin: orphansSetup(
                "INSERT INTO customers VALUES (7, 'Gus');",
                "INSERT INTO orders VALUES (30, NULL, 5.00), (31, 9, 6.00);",
              ),
              expected: "id | customer_id\n(no rows)\n\nid | name\n(no rows)\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which of these can be rolled back in MySQL when run inside `START TRANSACTION ... ROLLBACK`?",
          options: ["`DELETE FROM logs;`", "`TRUNCATE TABLE logs;`", "`DROP TABLE logs;`", "All three"],
          answer: 0,
          explanation: "DELETE is DML and fully transactional in InnoDB. TRUNCATE and DROP are DDL in MySQL and cause an implicit commit. (In PostgreSQL all three can be rolled back.)",
        },
        {
          prompt: "After `DELETE FROM tickets;` on an InnoDB table whose AUTO_INCREMENT had reached 500, what id does the next inserted row get?",
          options: ["1", "500", "501", "It depends on the number of rows deleted"],
          answer: 2,
          explanation: "DELETE leaves the counter where it was, so numbering continues. TRUNCATE TABLE would reset it to 1.",
        },
        {
          prompt: "`DELETE FROM orders WHERE customer_id NOT IN (SELECT id FROM legacy_customers);` deletes nothing, though many orders have no legacy customer. The likely cause?",
          options: [
            "NOT IN does not work in DELETE",
            "`legacy_customers.id` contains a NULL, making the condition unknown for every row",
            "The subquery needs DISTINCT",
            "DELETE needs a LIMIT",
          ],
          answer: 1,
          explanation: "`x NOT IN (1, 2, NULL)` is never true — it is false or unknown. NOT EXISTS has no such trap.",
        },
        {
          prompt: "A foreign key `order_items.order_id → orders.id` is declared `ON DELETE CASCADE`. What does deleting an order do?",
          options: [
            "Fails while the order has items",
            "Deletes the order and its items",
            "Deletes the order and sets the items' order_id to NULL",
            "Deletes only the items",
          ],
          answer: 1,
          explanation: "CASCADE removes the children with the parent. RESTRICT/NO ACTION would refuse; SET NULL would keep the items with a NULL key.",
        },
        {
          prompt: "What is a soft delete?",
          options: [
            "A DELETE inside a transaction",
            "A DELETE with a LIMIT",
            "Marking a row as deleted (e.g. setting `deleted_at`) and filtering it out of queries instead of removing it",
            "TRUNCATE without resetting AUTO_INCREMENT",
          ],
          answer: 2,
          explanation: "The row stays, so history and references survive and undo is an UPDATE; every query must filter `deleted_at IS NULL`.",
        },
      ],
    },
    {
      slug: "upserts",
      file: "04-upserts.md",
      exercises: [
        {
          title: "Load a product feed with REPLACE",
          prompt: `The nightly \`feed\` table is the complete truth for every product it mentions: its name and price replace whatever the catalogue had, and the product's \`on_sale\` flag goes back to its default (0), because the feed does not carry it. Products the feed does not mention stay as they are; new skus are added.

Do it with **one** \`REPLACE INTO ... SELECT\`, then show the catalogue: columns \`sku, name, price, on_sale\`, ordered by \`sku\`.

\`catalog\` (sku is the primary key; \`on_sale\` defaults to 0):

| sku | name | price | on_sale |
| --- | --- | --- | --- |
| A1 | Pen | 1.50 | 1 |
| B2 | Pad | 3.00 | 1 |
| C3 | Ink | 7.25 | 0 |

\`feed(sku, name, price)\`: (B2, Notepad, 3.25), (D4, Ruler, 2.00).

\`\`\`text
sku | name | price | on_sale
A1 | Pen | 1.5 | 1
B2 | Notepad | 3.25 | 0
C3 | Ink | 7.25 | 0
D4 | Ruler | 2 | 0
\`\`\``,
          starter: String.raw`-- One REPLACE INTO ... SELECT from feed.


SELECT sku, name, price, on_sale
FROM catalog
ORDER BY sku;
`,
          solution: String.raw`REPLACE INTO catalog (sku, name, price)
SELECT sku, name, price
FROM feed;

SELECT sku, name, price, on_sale
FROM catalog
ORDER BY sku;
`,
          hints: [
            "`REPLACE` takes the same forms as `INSERT`, including `REPLACE INTO t (cols) SELECT ...`.",
            "List only `sku, name, price`: REPLACE deletes the old row and inserts a new one, so `on_sale` falls back to its default — which is what the rule asks.",
          ],
          cases: [
            {
              stdin: feedSetup(
                "INSERT INTO catalog VALUES ('A1', 'Pen', 1.50, 1), ('B2', 'Pad', 3.00, 1), ('C3', 'Ink', 7.25, 0);",
                "INSERT INTO feed VALUES ('B2', 'Notepad', 3.25), ('D4', 'Ruler', 2.00);",
              ),
              expected: "sku | name | price | on_sale\nA1 | Pen | 1.5 | 1\nB2 | Notepad | 3.25 | 0\nC3 | Ink | 7.25 | 0\nD4 | Ruler | 2 | 0\n",
            },
            {
              stdin: feedSetup("INSERT INTO catalog VALUES ('A1', 'Pen', 1.50, 1);", ""),
              expected: "sku | name | price | on_sale\nA1 | Pen | 1.5 | 1\n",
              hidden: true,
            },
            {
              stdin: feedSetup(
                "INSERT INTO catalog VALUES ('K1', 'Stapler', 9.00, 1), ('K2', 'Clips', 1.20, 1);",
                "INSERT INTO feed VALUES ('K2', 'Paper clips', 1.10), ('K1', 'Stapler', 8.50), ('K0', 'Tape', 2.40);",
              ),
              expected: "sku | name | price | on_sale\nK0 | Tape | 2.4 | 0\nK1 | Stapler | 8.5 | 0\nK2 | Paper clips | 1.1 | 0\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Count page views: update, then insert",
          prompt: `\`page_views(path, views)\` keeps a running total per page; \`today(path, hits)\` is today's batch, one row per path. Add today's hits to the pages already counted, and insert the pages seen for the first time with their hits. REPLACE would lose the running total, so use the portable two-step: an UPDATE for the existing paths, then an \`INSERT ... SELECT\` with \`NOT EXISTS\` for the new ones.

Then show the totals: columns \`path, views\`, ordered by \`views\` descending, then \`path\`.

\`page_views\`: (/, 120), (/pricing, 40), (/blog, 15).
\`today\`: (/, 30), (/docs, 12), (/blog, 15).

\`\`\`text
path | views
/ | 150
/pricing | 40
/blog | 30
/docs | 12
\`\`\``,
          starter: String.raw`-- 1. UPDATE the paths that already have a row.
-- 2. INSERT the paths seen for the first time.


SELECT path, views
FROM page_views
ORDER BY views DESC, path;
`,
          solution: String.raw`UPDATE page_views
SET views = views + (SELECT t.hits FROM today t WHERE t.path = page_views.path)
WHERE path IN (SELECT path FROM today);

INSERT INTO page_views (path, views)
SELECT t.path, t.hits
FROM today t
WHERE NOT EXISTS (SELECT 1 FROM page_views p WHERE p.path = t.path);

SELECT path, views
FROM page_views
ORDER BY views DESC, path;
`,
          hints: [
            "Step 1: `SET views = views + (SELECT t.hits FROM today t WHERE t.path = page_views.path)` with `WHERE path IN (SELECT path FROM today)`.",
            "Step 2: `INSERT INTO page_views (path, views) SELECT ... FROM today t WHERE NOT EXISTS (...)`.",
            "Update first: if you insert first, the new rows would then be updated again and counted twice.",
          ],
          cases: [
            {
              stdin: viewsSetup(
                "INSERT INTO page_views VALUES ('/', 120), ('/pricing', 40), ('/blog', 15);",
                "INSERT INTO today VALUES ('/', 30), ('/docs', 12), ('/blog', 15);",
              ),
              expected: "path | views\n/ | 150\n/pricing | 40\n/blog | 30\n/docs | 12\n",
            },
            {
              stdin: viewsSetup("", "INSERT INTO today VALUES ('/b', 5), ('/a', 5), ('/c', 9);"),
              expected: "path | views\n/c | 9\n/a | 5\n/b | 5\n",
              hidden: true,
            },
            {
              stdin: viewsSetup("INSERT INTO page_views VALUES ('/', 7), ('/x', 3);", ""),
              expected: "path | views\n/ | 7\n/x | 3\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`stock(sku PRIMARY KEY, qty)` holds `('A1', 10)`. What does `INSERT INTO stock (sku, qty) VALUES ('A1', 5) ON DUPLICATE KEY UPDATE qty = qty + 5;` leave?",
          options: ["`('A1', 5)`", "`('A1', 10)`", "`('A1', 15)`", "Two rows for A1"],
          answer: 2,
          explanation: "The insert collides on the primary key, so the UPDATE part runs on the existing row, where a bare `qty` is the existing value: 10 + 5.",
        },
        {
          prompt: "`users(id AUTO_INCREMENT PRIMARY KEY, email UNIQUE, name, plan DEFAULT 'free')` has `(7, 'a@x.io', 'Ann', 'pro')`. What does `REPLACE INTO users (email, name) VALUES ('a@x.io', 'Ann B')` produce?",
          options: [
            "`(7, 'a@x.io', 'Ann B', 'pro')`",
            "A new row with a new id, name 'Ann B' and plan 'free'; the old row is deleted",
            "An error: duplicate entry",
            "Two rows for a@x.io",
          ],
          answer: 1,
          explanation: "REPLACE deletes the conflicting row and inserts a fresh one: the id is generated again and unlisted columns take their defaults. ON DUPLICATE KEY UPDATE would have kept id 7 and the plan.",
        },
        {
          prompt: "Which statement inserts a subscriber only if the email is not already present, leaving an existing row untouched?",
          options: [
            "`REPLACE INTO subscribers ...`",
            "`INSERT IGNORE INTO subscribers ...`",
            "`INSERT INTO subscribers ... ON DUPLICATE KEY UPDATE name = new.name`",
            "`UPDATE subscribers ...`",
          ],
          answer: 1,
          explanation: "INSERT IGNORE skips rows that would duplicate a key. REPLACE overwrites, and ON DUPLICATE KEY UPDATE changes the existing row.",
        },
        {
          prompt: "What is PostgreSQL's equivalent of MySQL's `ON DUPLICATE KEY UPDATE`?",
          options: [
            "`ON CONFLICT (key) DO UPDATE SET col = EXCLUDED.col`",
            "`REPLACE INTO`",
            "`INSERT OR UPDATE`",
            "`UPSERT INTO`",
          ],
          answer: 0,
          explanation: "PostgreSQL names the conflict target and calls the rejected row `EXCLUDED`; `DO NOTHING` is its INSERT IGNORE. It has no REPLACE.",
        },
        {
          prompt: "Why is \"SELECT the key; if no row, INSERT, else UPDATE\" unsafe under concurrency?",
          options: [
            "SELECT locks the whole table",
            "Two sessions can both see no row and both insert, producing a duplicate or a key error",
            "UPDATE cannot follow a SELECT",
            "It is safe; it is only slower",
          ],
          answer: 1,
          explanation: "The check and the write are separate steps, so another session can act in between. An upsert statement (or a unique key plus error handling) makes the decision atomic.",
        },
      ],
    },
    {
      slug: "transactions-in-practice",
      file: "05-transactions-in-practice.md",
      exercises: [
        {
          title: "Transfer between accounts",
          prompt: `Move **250** from account 1 to account 2 as one transaction: start a transaction, take 250 from account 1's balance, add 250 to account 2's, record the transfer in \`transfers(from_id, to_id, amount)\`, and commit.

Then print the accounts (\`id, owner, balance\`, ordered by \`id\`) and the transfer log (\`from_id, to_id, amount\`, ordered by \`from_id\`, \`to_id\`, \`amount\`).

\`accounts\`: (1, Asha, 1000.00), (2, Ben, 300.00), (3, Chen, 50.00). \`transfers\` starts empty here (it may already hold rows — keep them).

\`\`\`text
id | owner | balance
1 | Asha | 750
2 | Ben | 550
3 | Chen | 50

from_id | to_id | amount
1 | 2 | 250
\`\`\``,
          starter: String.raw`START TRANSACTION;
-- debit account 1, credit account 2, log the transfer

COMMIT;

SELECT id, owner, balance FROM accounts ORDER BY id;

SELECT from_id, to_id, amount FROM transfers ORDER BY from_id, to_id, amount;
`,
          solution: String.raw`START TRANSACTION;
UPDATE accounts SET balance = balance - 250 WHERE id = 1;
UPDATE accounts SET balance = balance + 250 WHERE id = 2;
INSERT INTO transfers (from_id, to_id, amount) VALUES (1, 2, 250);
COMMIT;

SELECT id, owner, balance FROM accounts ORDER BY id;

SELECT from_id, to_id, amount FROM transfers ORDER BY from_id, to_id, amount;
`,
          hints: [
            "Compute from the current value: `SET balance = balance - 250 WHERE id = 1`.",
            "Three statements between `START TRANSACTION` and `COMMIT`: two UPDATEs and one INSERT.",
          ],
          cases: [
            {
              stdin: accountsSetup("INSERT INTO accounts VALUES (1, 'Asha', 1000.00), (2, 'Ben', 300.00), (3, 'Chen', 50.00);"),
              expected: "id | owner | balance\n1 | Asha | 750\n2 | Ben | 550\n3 | Chen | 50\n\nfrom_id | to_id | amount\n1 | 2 | 250\n",
            },
            {
              stdin: accountsSetup(
                "INSERT INTO accounts VALUES (1, 'Dev', 400.50), (2, 'Eve', 0.00);",
                "INSERT INTO transfers VALUES (2, 1, 20.00), (1, 2, 99.00);",
              ),
              expected: "id | owner | balance\n1 | Dev | 150.5\n2 | Eve | 250\n\nfrom_id | to_id | amount\n1 | 2 | 99\n1 | 2 | 250\n2 | 1 | 20\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Undo part of a transaction with a savepoint",
          prompt: `Follow these steps exactly, in one script:

1. start a transaction;
2. mark every \`pending\` order as \`shipped\`;
3. create a savepoint named \`before_purge\`;
4. delete every order whose \`total\` is 0;
5. print \`SELECT COUNT(*) AS orders_left FROM orders\` — inside the transaction you see your own delete;
6. the purge was a mistake: roll back to \`before_purge\` (the shipping from step 2 must survive);
7. commit;
8. print the orders: \`id, status, total\`, ordered by \`id\`.

| id | status | total |
| --- | --- | --- |
| 1 | pending | 40.00 |
| 2 | shipped | 0.00 |
| 3 | pending | 0.00 |
| 4 | cancelled | 15.00 |

\`\`\`text
orders_left
2

id | status | total
1 | shipped | 40
2 | shipped | 0
3 | shipped | 0
4 | cancelled | 15
\`\`\``,
          starter: String.raw`-- Steps 1 to 7 go here; step 5 is a SELECT you write yourself.


SELECT id, status, total FROM orders ORDER BY id;
`,
          solution: String.raw`START TRANSACTION;
UPDATE orders SET status = 'shipped' WHERE status = 'pending';
SAVEPOINT before_purge;
DELETE FROM orders WHERE total = 0;
SELECT COUNT(*) AS orders_left FROM orders;
ROLLBACK TO SAVEPOINT before_purge;
COMMIT;

SELECT id, status, total FROM orders ORDER BY id;
`,
          hints: [
            "`SAVEPOINT before_purge;` marks the point; `ROLLBACK TO SAVEPOINT before_purge;` returns to it and keeps the transaction open.",
            "A plain `ROLLBACK` would also undo step 2 — the shipped orders would be pending again.",
          ],
          cases: [
            {
              stdin: shippingSetup("INSERT INTO orders VALUES (1, 'pending', 40.00), (2, 'shipped', 0.00), (3, 'pending', 0.00), (4, 'cancelled', 15.00);"),
              expected: "orders_left\n2\n\nid | status | total\n1 | shipped | 40\n2 | shipped | 0\n3 | shipped | 0\n4 | cancelled | 15\n",
            },
            {
              stdin: shippingSetup("INSERT INTO orders VALUES (5, 'pending', 12.00), (6, 'pending', 8.50);"),
              expected: "orders_left\n2\n\nid | status | total\n5 | shipped | 12\n6 | shipped | 8.5\n",
              hidden: true,
            },
            {
              stdin: shippingSetup("INSERT INTO orders VALUES (7, 'cancelled', 0.00), (8, 'shipped', 0.00), (9, 'returned', 20.00);"),
              expected: "orders_left\n1\n\nid | status | total\n7 | cancelled | 0\n8 | shipped | 0\n9 | returned | 20\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "With MySQL's default settings, you run `DELETE FROM orders WHERE id = 5;` and then `ROLLBACK;`. Is the row back?",
          options: [
            "Yes, ROLLBACK always undoes the last statement",
            "No — with autocommit on, the DELETE was committed as soon as it succeeded",
            "Only if the table has a primary key",
            "Yes, but only for 60 seconds",
          ],
          answer: 1,
          explanation: "Outside an explicit transaction each statement is its own committed transaction. ROLLBACK only undoes work since START TRANSACTION (or with autocommit off).",
        },
        {
          prompt: "Inside an open transaction you run `UPDATE products SET price = 0;` and then `SELECT SUM(price) FROM products;`. What does the SELECT return?",
          options: [
            "The old total, until you COMMIT",
            "0 — a transaction reads its own uncommitted writes",
            "An error: the table is locked",
            "NULL",
          ],
          answer: 1,
          explanation: "Your own session always sees its own changes. Other sessions keep seeing the committed values until you commit.",
        },
        {
          prompt: "`START TRANSACTION; UPDATE accounts SET balance = 0; TRUNCATE TABLE audit_log; ROLLBACK;` — in MySQL, what is the state afterwards?",
          options: [
            "Both changes are undone",
            "Both changes are permanent: TRUNCATE committed the UPDATE implicitly, and TRUNCATE itself cannot be rolled back",
            "The UPDATE is undone, the TRUNCATE is permanent",
            "The TRUNCATE is undone, the UPDATE is permanent",
          ],
          answer: 1,
          explanation: "DDL in MySQL causes an implicit commit before it runs. By the time ROLLBACK executes there is nothing left to roll back.",
        },
        {
          prompt: "What does `ROLLBACK TO SAVEPOINT s1` do?",
          options: [
            "Undoes the whole transaction and ends it",
            "Undoes the changes made after `s1` and keeps the transaction open",
            "Commits everything before `s1`",
            "Deletes the savepoint and nothing else",
          ],
          answer: 1,
          explanation: "Work before the savepoint stays pending and can still be committed or rolled back. `RELEASE SAVEPOINT` removes a marker without undoing anything.",
        },
        {
          prompt: "Inside a MySQL transaction, the third of five statements fails with a duplicate-key error. What has MySQL done?",
          options: [
            "Rolled back the entire transaction",
            "Rolled back only the failed statement; the transaction is still open with statements 1–2 applied",
            "Committed statements 1–2",
            "Refused every further statement until ROLLBACK",
          ],
          answer: 1,
          explanation: "MySQL undoes just the failing statement; the application decides whether to roll back the rest. Refusing further statements is PostgreSQL's behaviour.",
        },
      ],
    },
    {
      slug: "modifying-checkpoint",
      file: "06-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "Deduplicate a signup import",
          prompt: `Import \`signups\` into \`subscribers\` (email is the primary key) with one \`INSERT IGNORE ... SELECT\`, giving every imported row \`source = 'import'\`:

- a subscriber who already exists keeps their row exactly as it is;
- when the same email appears several times in \`signups\`, the signup with the **lowest id** wins.

Then show \`email, name, source\`, ordered by \`email\`.

\`subscribers\`: (ada@x.io, Ada, web).

\`signups\`:

| id | email | name |
| --- | --- | --- |
| 1 | alan@x.io | Alan |
| 2 | ada@x.io | Ada L |
| 3 | grace@x.io | Grace |
| 4 | alan@x.io | Alan T |

\`\`\`text
email | name | source
ada@x.io | Ada | web
alan@x.io | Alan | import
grace@x.io | Grace | import
\`\`\``,
          starter: String.raw`-- One INSERT IGNORE ... SELECT.


SELECT email, name, source
FROM subscribers
ORDER BY email;
`,
          solution: String.raw`INSERT IGNORE INTO subscribers (email, name, source)
SELECT email, name, 'import'
FROM signups
ORDER BY id;

SELECT email, name, source
FROM subscribers
ORDER BY email;
`,
          hints: [
            "INSERT IGNORE skips a row that would duplicate the key, so the first row inserted for an email wins.",
            "Make \"first\" mean lowest id with `ORDER BY id` on the SELECT that feeds the insert.",
          ],
          cases: [
            {
              stdin: signupSetup(
                "INSERT INTO subscribers VALUES ('ada@x.io', 'Ada', 'web');",
                "INSERT INTO signups VALUES (1, 'alan@x.io', 'Alan'), (2, 'ada@x.io', 'Ada L'), (3, 'grace@x.io', 'Grace'), (4, 'alan@x.io', 'Alan T');",
              ),
              expected: "email | name | source\nada@x.io | Ada | web\nalan@x.io | Alan | import\ngrace@x.io | Grace | import\n",
            },
            {
              stdin: signupSetup("", "INSERT INTO signups VALUES (9, 'kim@x.io', 'Kim B'), (5, 'lee@x.io', 'Lee'), (2, 'kim@x.io', 'Kim'), (7, 'lee@x.io', 'Lee M');"),
              expected: "email | name | source\nkim@x.io | Kim | import\nlee@x.io | Lee | import\n",
              hidden: true,
            },
            {
              stdin: signupSetup("INSERT INTO subscribers VALUES ('zed@x.io', 'Zed', 'app');", ""),
              expected: "email | name | source\nzed@x.io | Zed | app\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Close the month",
          prompt: `Close May in **one transaction** (start it, do the three steps in this order, commit):

1. every \`open\` invoice issued **before 2024-06-01** becomes \`overdue\`;
2. every \`paid\` invoice is copied into \`invoices_archive(id, customer, amount, closed_on)\` with \`closed_on = '2024-06-30'\`;
3. the paid invoices are deleted from \`invoices\`.

Then print the invoices left (\`id, customer, status\`, ordered by \`id\`) and the archive (\`id, customer, amount, closed_on\`, ordered by \`id\`; keep any rows it already had).

| id | customer | amount | status | issued_on |
| --- | --- | --- | --- | --- |
| 1 | Asha | 100.00 | paid | 2024-05-03 |
| 2 | Ben | 250.00 | open | 2024-05-20 |
| 3 | Chen | 75.50 | open | 2024-06-04 |
| 4 | Dev | 40.00 | paid | 2024-06-10 |
| 5 | Asha | 60.00 | overdue | 2024-04-01 |

\`\`\`text
id | customer | status
2 | Ben | overdue
3 | Chen | open
5 | Asha | overdue

id | customer | amount | closed_on
1 | Asha | 100 | 2024-06-30
4 | Dev | 40 | 2024-06-30
\`\`\``,
          starter: String.raw`START TRANSACTION;
-- 1. open invoices issued before 2024-06-01 become overdue
-- 2. copy paid invoices into invoices_archive
-- 3. delete paid invoices
COMMIT;

SELECT id, customer, status FROM invoices ORDER BY id;

SELECT id, customer, amount, closed_on FROM invoices_archive ORDER BY id;
`,
          solution: String.raw`START TRANSACTION;
UPDATE invoices
SET status = 'overdue'
WHERE status = 'open' AND issued_on < '2024-06-01';

INSERT INTO invoices_archive (id, customer, amount, closed_on)
SELECT id, customer, amount, '2024-06-30'
FROM invoices
WHERE status = 'paid';

DELETE FROM invoices WHERE status = 'paid';
COMMIT;

SELECT id, customer, status FROM invoices ORDER BY id;

SELECT id, customer, amount, closed_on FROM invoices_archive ORDER BY id;
`,
          hints: [
            "Step 1 is an UPDATE with two conditions joined by AND.",
            "Step 2 is `INSERT INTO invoices_archive (...) SELECT ..., '2024-06-30' FROM invoices WHERE status = 'paid'`.",
            "Copy before you delete — the DELETE uses the same WHERE as the copy.",
          ],
          cases: [
            {
              stdin: invoicesSetup("INSERT INTO invoices VALUES (1, 'Asha', 100.00, 'paid', '2024-05-03'), (2, 'Ben', 250.00, 'open', '2024-05-20'), (3, 'Chen', 75.50, 'open', '2024-06-04'), (4, 'Dev', 40.00, 'paid', '2024-06-10'), (5, 'Asha', 60.00, 'overdue', '2024-04-01');"),
              expected: "id | customer | status\n2 | Ben | overdue\n3 | Chen | open\n5 | Asha | overdue\n\nid | customer | amount | closed_on\n1 | Asha | 100 | 2024-06-30\n4 | Dev | 40 | 2024-06-30\n",
            },
            {
              stdin: invoicesSetup(
                "INSERT INTO invoices VALUES (6, 'Eve', 20.00, 'open', '2024-06-01'), (7, 'Fay', 35.25, 'open', '2024-05-31');",
                "INSERT INTO invoices_archive VALUES (1, 'Old', 9.00, '2024-05-31');",
              ),
              expected: "id | customer | status\n6 | Eve | open\n7 | Fay | overdue\n\nid | customer | amount | closed_on\n1 | Old | 9 | 2024-05-31\n",
              hidden: true,
            },
            {
              stdin: invoicesSetup("INSERT INTO invoices VALUES (8, 'Gus', 12.00, 'paid', '2024-01-15'), (9, 'Hal', 18.75, 'paid', '2024-02-20');"),
              expected: "id | customer | status\n(no rows)\n\nid | customer | amount | closed_on\n8 | Gus | 12 | 2024-06-30\n9 | Hal | 18.75 | 2024-06-30\n",
              hidden: true,
            },
          ],
        },
        {
          title: "Sync stock from a delivery",
          prompt: `A delivery arrived, loaded into \`delivery(sku, name, qty, price)\` with one row per sku. Bring \`products\` up to date:

- a product the shop already has: add the delivered \`qty\` to its stock and take the delivery's \`price\`; keep the product's own \`name\`;
- a sku the shop has never had: insert it with the delivery's name, qty and price.

Use the portable update-then-insert form. Then show \`sku, name, qty, price\`, ordered by \`sku\`.

\`products\`: (A1, Pen, 10, 1.50), (B2, Pad, 0, 3.00), (C3, Ink, 5, 7.25).
\`delivery\`: (B2, Notepad, 20, 3.40), (D4, Ruler, 15, 2.00), (A1, Pen, 5, 1.50).

\`\`\`text
sku | name | qty | price
A1 | Pen | 15 | 1.5
B2 | Pad | 20 | 3.4
C3 | Ink | 5 | 7.25
D4 | Ruler | 15 | 2
\`\`\``,
          starter: String.raw`-- 1. Update the products the delivery already knows.
-- 2. Insert the new skus.


SELECT sku, name, qty, price
FROM products
ORDER BY sku;
`,
          solution: String.raw`UPDATE products
SET qty = qty + (SELECT d.qty FROM delivery d WHERE d.sku = products.sku),
    price = (SELECT d.price FROM delivery d WHERE d.sku = products.sku)
WHERE sku IN (SELECT sku FROM delivery);

INSERT INTO products (sku, name, qty, price)
SELECT d.sku, d.name, d.qty, d.price
FROM delivery d
WHERE NOT EXISTS (SELECT 1 FROM products p WHERE p.sku = d.sku);

SELECT sku, name, qty, price
FROM products
ORDER BY sku;
`,
          hints: [
            "Each SET assignment can have its own correlated subquery on `delivery`.",
            "Restrict the UPDATE to `sku IN (SELECT sku FROM delivery)` or the other products get NULLs.",
            "Then insert the delivery rows for which `NOT EXISTS` a product with that sku.",
          ],
          cases: [
            {
              stdin: deliverySetup(
                "INSERT INTO products VALUES ('A1', 'Pen', 10, 1.50), ('B2', 'Pad', 0, 3.00), ('C3', 'Ink', 5, 7.25);",
                "INSERT INTO delivery VALUES ('B2', 'Notepad', 20, 3.40), ('D4', 'Ruler', 15, 2.00), ('A1', 'Pen', 5, 1.50);",
              ),
              expected: "sku | name | qty | price\nA1 | Pen | 15 | 1.5\nB2 | Pad | 20 | 3.4\nC3 | Ink | 5 | 7.25\nD4 | Ruler | 15 | 2\n",
            },
            {
              stdin: deliverySetup("", "INSERT INTO delivery VALUES ('Z9', 'Glue', 4, 0.99), ('M1', 'Tape', 6, 1.25);"),
              expected: "sku | name | qty | price\nM1 | Tape | 6 | 1.25\nZ9 | Glue | 4 | 0.99\n",
              hidden: true,
            },
            {
              stdin: deliverySetup("INSERT INTO products VALUES ('A1', 'Pen', 3, 1.50);", ""),
              expected: "sku | name | qty | price\nA1 | Pen | 3 | 1.5\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which statement removes all rows from `logs`, resets its AUTO_INCREMENT and cannot be rolled back in MySQL?",
          options: ["`DELETE FROM logs;`", "`TRUNCATE TABLE logs;`", "`DROP TABLE logs;`", "`DELETE FROM logs WHERE 1 = 1;`"],
          answer: 1,
          explanation: "TRUNCATE empties the table by recreating it, resetting the counter, and commits implicitly. DELETE keeps the counter and is transactional; DROP removes the table itself.",
        },
        {
          prompt: "A column is declared `qty INT NOT NULL DEFAULT 0`. Which INSERT gives it 0?",
          options: [
            "`INSERT INTO t (sku, qty) VALUES ('A', NULL);`",
            "`INSERT INTO t (sku) VALUES ('A');`",
            "`INSERT INTO t (sku, qty) VALUES ('A', '');`",
            "None — DEFAULT applies only to UPDATE",
          ],
          answer: 1,
          explanation: "Omitting the column applies the default. An explicit NULL is rejected by NOT NULL; an empty string is an error or a converted value, not the default.",
        },
        {
          prompt: "`INSERT INTO a (x, y) SELECT y, x FROM b;` — what lands in `a.x`?",
          options: ["`b.x`", "`b.y`", "NULL", "The statement fails"],
          answer: 1,
          explanation: "INSERT ... SELECT matches by position: the SELECT's first column goes into the first listed column, whatever the names.",
        },
        {
          prompt: "What does this do to products whose sku is NOT in `changes`?\n\n```sql\nUPDATE products\nSET price = (SELECT c.price FROM changes c WHERE c.sku = products.sku);\n```",
          options: ["Nothing", "Sets their price to NULL (or fails on NOT NULL)", "Sets their price to 0", "Deletes them"],
          answer: 1,
          explanation: "With no WHERE every product is updated, and the subquery returns no row — NULL — for the unmatched ones. Add `WHERE sku IN (SELECT sku FROM changes)`.",
        },
        {
          prompt: "Which MySQL statement updates `products` from `changes` using a join?",
          options: [
            "`UPDATE products p JOIN changes c ON c.sku = p.sku SET p.price = c.price;`",
            "`UPDATE products SET price = c.price FROM changes c WHERE c.sku = products.sku;`",
            "`UPDATE JOIN products, changes SET price = c.price;`",
            "`MERGE INTO products USING changes ...`",
          ],
          answer: 0,
          explanation: "MySQL's multi-table UPDATE joins in the UPDATE clause. `UPDATE ... FROM` is PostgreSQL; MySQL has no MERGE.",
        },
        {
          prompt: "Which condition deletes the orders whose customer does not exist, including orders with a NULL customer_id?",
          options: [
            "`WHERE customer_id NOT IN (SELECT id FROM customers)`",
            "`WHERE NOT EXISTS (SELECT 1 FROM customers c WHERE c.id = orders.customer_id)`",
            "`WHERE customer_id <> ALL (SELECT id FROM customers)`",
            "`WHERE customer_id IS NULL`",
          ],
          answer: 1,
          explanation: "NOT EXISTS is true when nothing matches, and a NULL key matches nothing. `NULL NOT IN (...)` and `NULL <> ALL (...)` are unknown, so those rows survive.",
        },
        {
          prompt: "On a duplicate key, which form keeps the existing row's other columns and can add to its counter?",
          options: ["`REPLACE INTO`", "`INSERT IGNORE`", "`INSERT ... ON DUPLICATE KEY UPDATE`", "`INSERT ... SELECT`"],
          answer: 2,
          explanation: "ON DUPLICATE KEY UPDATE modifies the existing row in place. REPLACE deletes and re-inserts; INSERT IGNORE leaves the row unchanged.",
        },
        {
          prompt: "Why does `REPLACE` sometimes delete child rows in other tables?",
          options: [
            "It runs TRUNCATE internally",
            "It deletes the conflicting row before inserting, so ON DELETE CASCADE foreign keys fire",
            "It drops and recreates the table",
            "It never does",
          ],
          answer: 1,
          explanation: "REPLACE is a DELETE followed by an INSERT. With InnoDB foreign keys declared ON DELETE CASCADE, the delete removes the children.",
        },
        {
          prompt: "In MySQL, a transaction runs `UPDATE ...; CREATE TABLE tmp (x INT); ROLLBACK;`. What happens to the UPDATE?",
          options: [
            "It is rolled back",
            "It is committed — CREATE TABLE caused an implicit commit",
            "It is lost without commit or rollback",
            "The CREATE TABLE fails inside a transaction",
          ],
          answer: 1,
          explanation: "DDL in MySQL commits the current transaction before it runs, so the later ROLLBACK has nothing to undo.",
        },
        {
          prompt: "`START TRANSACTION; INSERT A; SAVEPOINT s; INSERT B; ROLLBACK TO SAVEPOINT s; INSERT C; COMMIT;` — which rows are saved?",
          options: ["A, B and C", "A and C", "Only C", "None"],
          answer: 1,
          explanation: "Rolling back to the savepoint undoes B only and keeps the transaction open; C is added and COMMIT saves A and C.",
        },
        {
          prompt: "What does MySQL's autocommit mode mean?",
          options: [
            "The server commits every few seconds",
            "Each statement outside an explicit transaction is committed as soon as it succeeds",
            "Transactions are committed when the connection closes",
            "ROLLBACK is disabled",
          ],
          answer: 1,
          explanation: "Autocommit is on by default; `START TRANSACTION` suspends it until COMMIT or ROLLBACK.",
        },
        {
          prompt: "Which upsert spelling belongs to PostgreSQL?",
          options: [
            "`INSERT ... ON DUPLICATE KEY UPDATE`",
            "`INSERT ... ON CONFLICT (id) DO NOTHING`",
            "`INSERT IGNORE`",
            "`REPLACE INTO`",
          ],
          answer: 1,
          explanation: "`ON CONFLICT ... DO NOTHING / DO UPDATE` is PostgreSQL's; the other three are MySQL's.",
        },
      ],
    },
  ],
});
