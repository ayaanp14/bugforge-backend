---
title: Normalization — 1NF, 2NF, 3NF and BCNF
minutes: 16
seo-title: Database Normalization Explained: 1NF, 2NF, 3NF and BCNF
description: Normalization stores each fact once. Update, insert and delete anomalies, functional dependencies, 1NF to BCNF on a worked example, and when to denormalize.
question: What is normalization in a database?
answer: Normalization is organizing tables so that each fact is stored in exactly one place, which removes the update, insert and delete anomalies redundant data causes. It proceeds through normal forms: 1NF needs atomic values and no repeating groups, 2NF removes dependencies on part of a composite key, 3NF removes dependencies between non-key columns, and BCNF requires every determinant to be a candidate key.
q: What is the difference between 2NF and 3NF?
a: 2NF removes partial dependencies: no non-key column may depend on only part of a composite key, such as a product name depending only on product_id in an order-lines table keyed by order and product. 3NF removes transitive dependencies: no non-key column may depend on another non-key column, such as a customer's city depending on the customer stored in an orders table.
q: What is BCNF and how is it different from 3NF?
a: Boyce-Codd normal form requires that for every functional dependency X determines Y, X is a candidate key. 3NF allows an exception when Y is part of some candidate key. The two differ only for tables with overlapping composite candidate keys, which are rare, so most 3NF tables are already in BCNF.
q: What is a functional dependency?
a: A functional dependency X determines Y means that rows with the same value of X always have the same value of Y; for example, product_id determines product_name. Normal forms are defined in terms of these dependencies, and finding them in the business rules is the first step of normalizing a design.
q: When should you denormalize a database?
a: When a measured read pattern is too slow or too complex with joins and the cost of keeping duplicated data consistent is acceptable, as in reporting tables, data warehouses, cached counters or a stored order total. Denormalize deliberately, after normalizing, and keep the normalized data as the source of truth.
---
A spreadsheet stores everything in one sheet: every order row repeats the customer's name and city and the product's name and price. A relational schema splits that into tables so each fact lives in one row of one table. **Normalization** is the method for that split, and the normal forms — 1NF, 2NF, 3NF, BCNF — are the checkpoints along the way. Interviewers ask about them constantly, usually with a table to normalize on the spot. This lesson covers the anomalies redundancy causes, functional dependencies, each normal form with a worked example, and when undoing some of it (denormalization) is the right call.

## The problem: anomalies

Here is one wide table of orders, the kind an export or a first draft produces:

| order_id | order_date | customer_email | customer_name | customer_city | sku | product_name | unit_price | qty |
| ---: | --- | --- | --- | --- | --- | --- | ---: | ---: |
| 1 | 2024-05-01 | asha@x.io | Asha | Pune | P1 | Pen | 1.50 | 10 |
| 1 | 2024-05-01 | asha@x.io | Asha | Pune | P2 | Pad | 3.00 | 2 |
| 2 | 2024-05-03 | ben@x.io | Ben | Delhi | P1 | Pen | 1.50 | 4 |

It works until data changes:

- **Update anomaly** — Asha moves to Mumbai: her city must be changed on every row of every order she ever placed; miss one and the database disagrees with itself.
- **Insert anomaly** — a new product cannot be recorded until someone orders it, because every row is an order line.
- **Delete anomaly** — delete Ben's only order and the fact that Ben exists, and lives in Delhi, disappears with it.

All three come from the same cause: facts about customers and products are stored in rows about something else.

@figure decompose

## Functional dependencies

A **functional dependency** `X → Y` says: rows that agree on X always agree on Y. In the table above:

- `customer_email → customer_name, customer_city`
- `sku → product_name, unit_price`
- `order_id → order_date, customer_email`
- `(order_id, sku) → qty`

The key of this table is `(order_id, sku)` — it determines everything. Each normal form is a rule about which dependencies may exist in a table, and normalizing means splitting a table along the dependencies that break the rule. Dependencies come from the business rules, not from the sample data: three rows cannot prove that `sku → unit_price`, only the business can (and if prices change over time, it does not — more on that below).

## First normal form (1NF)

A table is in 1NF when every column holds a single, atomic value and there are no repeating groups. These violate it:

```text
order_id | items
1        | Pen x10, Pad x2              -- a list in one cell

order_id | item1 | qty1 | item2 | qty2  -- repeating columns
```

A list in a cell cannot be indexed, joined or constrained, and searching it means string matching. Repeating columns cap the number of items and make "total quantity" a sum over columns. The fix is one row per item — which is what the wide table above already does, so it is in 1NF.

## Second normal form (2NF)

2NF: in 1NF, and **no non-key column depends on only part of a composite key** (no *partial dependency*). In our table the key is `(order_id, sku)`, but `product_name` and `unit_price` depend on `sku` alone, and `order_date` and the customer columns depend on `order_id` alone. Split them out:

```text
orders(order_id PK, order_date, customer_email, customer_name, customer_city)
products(sku PK, product_name, unit_price)
order_lines(order_id, sku, qty, PRIMARY KEY (order_id, sku))
```

Now each product's name and price is stored once. A table whose primary key is a single column is automatically in 2NF; the form only bites on composite keys.

## Third normal form (3NF)

3NF: in 2NF, and **no non-key column depends on another non-key column** (no *transitive dependency*). In `orders`, `customer_name` and `customer_city` depend on `customer_email`, which is not the key — the chain is `order_id → customer_email → customer_city`. Split again:

```text
customers(customer_id PK, email UNIQUE, name, city)
orders(order_id PK, order_date, customer_id)
products(product_id PK, sku UNIQUE, name, unit_price)
order_lines(order_id, product_id, qty, PRIMARY KEY (order_id, product_id))
```

The three anomalies are gone: Asha's city is one row, a product can exist with no orders, deleting an order leaves the customer. A good one-line summary of 1NF to 3NF, often quoted: every non-key column depends on **the key, the whole key, and nothing but the key**.

## Boyce–Codd normal form (BCNF)

BCNF tightens 3NF: for **every** functional dependency `X → Y`, X must be a candidate key (a minimal set of columns that uniquely identifies rows). 3NF allows one exception — when Y is itself part of a candidate key — and BCNF does not. The difference only appears with overlapping composite candidate keys. The textbook case: each tutor teaches exactly one subject, and a student has one tutor per subject.

```text
tutoring(student, subject, tutor)
-- (student, subject) → tutor        candidate key: (student, subject)
-- tutor → subject                    tutor is not a candidate key
```

The table is in 3NF (subject is part of a candidate key), but not BCNF, and the anomaly is real: the fact "Ravi teaches maths" is repeated for each of Ravi's students. The BCNF decomposition is `tutors(tutor PK, subject)` and `tutoring(student, tutor)`. In practice most tables in 3NF are already in BCNF. Higher forms (4NF for independent multi-valued facts, 5NF for join dependencies) exist and are rarely asked beyond their names.

## A judgement, not a reflex: what the data means

Normalization follows the business rules, and those include **time**. In the decomposition above, `order_lines` gets the price from `products`. But prices change; last month's order must keep the price paid. So the line stores its own `unit_price` — not redundancy, but a different fact: "the price on this order", which `order_id, product_id → unit_price` captures correctly. The same goes for a shipping address copied onto an order. Ask what each value *means* before deciding it is a duplicate.

## Denormalization

Normalized schemas write cleanly and read with joins. Sometimes the reads win and you store something twice on purpose:

- a reporting table or data warehouse star schema, rebuilt from the normalized tables;
- a cached aggregate such as `orders.total` or `posts.comment_count`, maintained on write;
- a copied column that saves a join on a very hot query.

Each copy must be kept consistent — by the application, a trigger, or a scheduled rebuild — and that cost is why the rule is: normalize first, measure, then denormalize specific paths deliberately.

## Key takeaways

- Redundancy causes update, insert and delete anomalies; normalization stores each fact once.
- Functional dependencies (`X → Y`) from the business rules drive every split.
- 1NF: atomic values, no repeating groups.
- 2NF: no non-key column depends on part of a composite key.
- 3NF: no non-key column depends on another non-key column.
- BCNF: every determinant is a candidate key.
- A copied value with its own meaning (price at the time of order) is not redundancy; deliberate denormalization serves measured reads.
