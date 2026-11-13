---
title: Design an Expense Sharing App (Splitwise)
order: 9
minutes: 8
level: intermediate
updated: 2026-11-14
seo-title: Expense Sharing App LLD (Splitwise), Animated
description: Low-level design of an expense sharing app like Splitwise: classes, equal, exact and percent splits as a Strategy, net balances and simplifying debts.
question: How do you design an expense sharing app like Splitwise in an LLD interview?
answer: Model User, Group, Expense, a Split strategy (equal, exact, percent) and a BalanceSheet. Each expense credits the payer and debits every member's share, so net balances always sum to zero. To settle up, simplify debts greedily: the largest debtor pays the largest creditor the smaller of the two amounts until everyone is at zero.
q: Why is Split a Strategy in an expense sharing app?
a: Expense only needs shares(amount, people); how they are computed varies. Equal, exact, percent and share-based rules each become a class behind one interface, so adding a rule never touches Expense or the balance sheet. That is the open/closed principle in practice.
q: How do you handle an amount that does not divide equally?
a: Work in the smallest unit (paise or cents, or whole rupees as here) and give the leftover units to some members, for example the first ones. 1000 among three becomes 334, 333 and 333, so the shares still add up exactly. Never store floating-point money.
q: What is a net balance?
a: What the group owes you minus what you owe the group. The payer of an expense is credited the full amount and every member, the payer included, is debited their share. Because every credit has matching debits, the balances of a group always sum to zero.
q: How does Splitwise-style debt simplification work?
a: Forget who owes whom and keep only each person's net balance. Then repeatedly match the largest creditor with the largest debtor and transfer the smaller of the two amounts, which settles at least one of them each time. With n people that is at most n − 1 payments.
q: Does the greedy settle give the minimum number of payments?
a: Not always. Finding the true minimum means finding groups of people whose balances cancel, which is NP-hard in general. The greedy method is fast, uses at most n − 1 payments and is what interviews expect, with that caveat mentioned.
---

An expense app is a ledger with one invariant: money is never created or lost, so a group's balances always add up to zero. The interview tests the split rules and the settle-up step.

## Entities and the class diagram

- **User**: who pays and who owes.
- **Group**: members and expenses (a trip, a flat).
- **Expense**: amount, payer, and a **Split** rule.
- **Split** (interface): `EqualSplit`, `ExactSplit`, `PercentSplit`. This is the [Strategy pattern](/notes/oop/design-patterns).
- **BalanceSheet**: each member's net balance, and `simplify()`.

@figure class-diagram

## Split strategies

- **Equal**: amount ÷ n; leftover units go to the first members.
- **Exact**: one amount each; refuse unless they add up to the expense.
- **Percent**: percentages that total 100; give rounding leftovers to someone.
- Validate inside the strategy, before any balance changes.
- Store money as integers (paise), never as floating point.

@figure split-strategies

```game
type: match
title: Split type to its input
prompt: Match each split rule to the input it needs.
- EqualSplit => nothing beyond the members
- ExactSplit => one amount per person, adding up to the total
- PercentSplit => one percentage per person, adding up to 100
- ShareSplit => one weight per person, such as 2 : 1 : 1
why: The rule decides what input it validates, which is why each one is its own Strategy class behind one shares() method.
```

## Balance updates

- Payer: `+amount`. Every member in the split, payer included: `−share`.
- The sum of all balances stays zero after every expense: a cheap invariant to assert.
- Keep pairwise "A owes B" only if the product needs to show it; settling needs net balances alone.
- See [design patterns in LLD](/notes/low-level-design/design-patterns-in-lld) for wiring the Strategy in.

@figure balance-updates

## Simplify debts

1. Compute each member's net balance.
2. Pick the largest creditor and the largest debtor.
3. The debtor pays the smaller of the two amounts; one of them reaches zero.
4. Repeat until everyone is at zero: at most n − 1 payments.

- Greedy is not always the true minimum (that is NP-hard), but it is short and fast.

@figure simplify-debts

```game
type: pick
title: Who pays whom?
prompt: Each round gives net balances. What is the first greedy payment?
? A +300, B −300
* B pays A 300
- A pays B 300
- B pays A 150
> One creditor, one debtor: the debtor pays the full balance.
? A +500, B −200, C −300
* C pays A 300
- B pays A 200
- C pays A 500
> The largest debtor is C at −300; C pays the smaller of 500 and 300.
? A +100, B +400, C −250, D −250
* C pays B 250
- C pays A 100
- D pays A 250
> Largest creditor B (+400), largest debtor C (tied with D, first by name), smaller amount 250.
? A −150, B +250, C −100
* A pays B 150
- C pays B 100
- A pays B 250
> B is the only creditor and A owes the most, so A pays B its full 150.
```

## The code

Three friends, three split rules, the balances, then the settle-up.

```cpp
#include <iostream>
#include <map>
#include <stdexcept>
#include <string>
#include <vector>
using namespace std;
struct Split {  // Strategy: each split type turns its own input into shares
    virtual string name() const = 0;
    virtual vector<int> shares(int amount, int n) const = 0;
    virtual ~Split() {}
};
struct EqualSplit : Split {
    string name() const override { return "EQUAL"; }
    vector<int> shares(int amount, int n) const override {
        vector<int> s(n); for (int i = 0; i < n; i++) s[i] = amount / n + (i < amount % n ? 1 : 0);  // leftover rupees go to the first people
        return s;
    }
};
struct ExactSplit : Split {
    vector<int> amounts;
    ExactSplit(vector<int> a) : amounts(a) {}
    string name() const override { return "EXACT"; }
    vector<int> shares(int amount, int) const override {
        int total = 0; for (int a : amounts) total += a;
        if (total != amount) throw invalid_argument("exact shares must add up to the amount");
        return amounts;
    }
};
struct PercentSplit : Split {
    vector<int> percents;
    PercentSplit(vector<int> p) : percents(p) {}
    string name() const override { return "PERCENT"; }
    vector<int> shares(int amount, int n) const override {
        vector<int> s(n); int given = 0, total = 0;
        for (int i = 0; i < n; i++) { s[i] = amount * percents[i] / 100; given += s[i]; total += percents[i]; }
        if (total != 100) throw invalid_argument("percents must add up to 100");
        s[0] += amount - given;  // rounding leftovers
        return s;
    }
};
struct BalanceSheet {
    vector<string> members;  // sorted, so ties break by name
    map<pair<string, string>, int> owes;  // (debtor, creditor) -> amount, before netting
    int owed(const string& d, const string& c) { return owes.count({d, c}) ? owes[{d, c}] : 0; }
    void add(const string& desc, int amount, const string& payer, const Split& split) {
        vector<int> s = split.shares(amount, members.size());
        cout << desc << " " << amount << " paid by " << payer << ", " << split.name() << ":";
        for (size_t i = 0; i < s.size(); i++) {
            cout << (i ? ", " : " ") << members[i] << " " << s[i];
            if (members[i] != payer) owes[{members[i], payer}] += s[i];
        }
        cout << "\n";
    }
};
int main() {
    BalanceSheet sheet{{"asha", "ben", "chen"}, {}};
    sheet.add("dinner", 900, "asha", EqualSplit());
    sheet.add("cab", 1000, "ben", PercentSplit({50, 20, 30}));
    sheet.add("tickets", 600, "chen", ExactSplit({250, 250, 100}));
    vector<string>& m = sheet.members;
    int pairs = 0, moves = 0;
    map<string, int> net;  // what the group owes each member
    for (size_t i = 0; i < m.size(); i++)
        for (size_t j = 0; j < m.size(); j++) {
            int d = sheet.owed(m[i], m[j]) - sheet.owed(m[j], m[i]);  // what i owes j once the pair is netted
            net[m[i]] -= d;
            if (i < j && d) { pairs++; cout << "owes: " << (d > 0 ? m[i] : m[j]) << " -> " << (d > 0 ? m[j] : m[i]) << " " << (d > 0 ? d : -d) << "\n"; }
        }
    cout << "net:"; for (size_t i = 0; i < m.size(); i++) cout << (i ? ", " : " ") << m[i] << " " << (net[m[i]] > 0 ? "+" : "") << net[m[i]]; cout << "\n";
    while (true) {  // greedy: the largest debtor pays the largest creditor
        string cred = m[0], debt = m[0];
        for (auto& p : m) { if (net[p] > net[cred]) cred = p; if (net[p] < net[debt]) debt = p; }
        if (net[cred] == 0) break;
        int pay = min(net[cred], -net[debt]);
        net[cred] -= pay; net[debt] += pay; moves++;
        cout << "settle: " << debt << " pays " << cred << " " << pay << "\n";
    }
    cout << "transfers: " << pairs << " -> " << moves << "\n";
}
```

```java
import java.util.*;

public class Main {
    interface Split { // Strategy: each split type turns its own input into shares
        String name();
        int[] shares(int amount, int n);
    }

    static class EqualSplit implements Split {
        public String name() { return "EQUAL"; }
        public int[] shares(int amount, int n) {
            int[] s = new int[n];
            for (int i = 0; i < n; i++) s[i] = amount / n + (i < amount % n ? 1 : 0); // leftover rupees go to the first people
            return s;
        }
    }
    record ExactSplit(int[] amounts) implements Split {
        public String name() { return "EXACT"; }
        public int[] shares(int amount, int n) {
            if (Arrays.stream(amounts).sum() != amount) throw new IllegalArgumentException("exact shares must add up to the amount");
            return amounts.clone();
        }
    }
    record PercentSplit(int[] percents) implements Split {
        public String name() { return "PERCENT"; }
        public int[] shares(int amount, int n) {
            if (Arrays.stream(percents).sum() != 100) throw new IllegalArgumentException("percents must add up to 100");
            int[] s = new int[n];
            for (int i = 0; i < n; i++) s[i] = amount * percents[i] / 100;
            s[0] += amount - Arrays.stream(s).sum(); // rounding leftovers
            return s;
        }
    }

    static class BalanceSheet {
        final List<String> members; // sorted, so ties break by name
        final Map<String, Integer> owes = new HashMap<>(); // "debtor>creditor" -> amount, before netting
        BalanceSheet(List<String> members) { this.members = members; }
        int owed(String d, String c) { return owes.getOrDefault(d + ">" + c, 0); }
        void add(String desc, int amount, String payer, Split split) {
            int[] s = split.shares(amount, members.size());
            StringJoiner line = new StringJoiner(", ", desc + " " + amount + " paid by " + payer + ", " + split.name() + ": ", "");
            for (int i = 0; i < s.length; i++) {
                line.add(members.get(i) + " " + s[i]);
                if (!members.get(i).equals(payer)) owes.merge(members.get(i) + ">" + payer, s[i], Integer::sum);
            }
            System.out.println(line);
        }
    }

    public static void main(String[] args) {
        BalanceSheet sheet = new BalanceSheet(List.of("asha", "ben", "chen"));
        sheet.add("dinner", 900, "asha", new EqualSplit());
        sheet.add("cab", 1000, "ben", new PercentSplit(new int[] {50, 20, 30}));
        sheet.add("tickets", 600, "chen", new ExactSplit(new int[] {250, 250, 100}));
        List<String> m = sheet.members;
        Map<String, Integer> net = new HashMap<>(); // what the group owes each member
        int pairs = 0, moves = 0;
        for (int i = 0; i < m.size(); i++)
            for (int j = 0; j < m.size(); j++) {
                int d = sheet.owed(m.get(i), m.get(j)) - sheet.owed(m.get(j), m.get(i)); // what i owes j once the pair is netted
                net.merge(m.get(i), -d, Integer::sum);
                if (i < j && d != 0) { pairs++; System.out.println("owes: " + m.get(d > 0 ? i : j) + " -> " + m.get(d > 0 ? j : i) + " " + Math.abs(d)); }
            }
        StringJoiner nets = new StringJoiner(", ", "net: ", "");
        for (String p : m) nets.add(p + " " + (net.get(p) > 0 ? "+" : "") + net.get(p));
        System.out.println(nets);
        while (true) { // greedy: the largest debtor pays the largest creditor
            String cred = m.get(0), debt = m.get(0);
            for (String p : m) { if (net.get(p) > net.get(cred)) cred = p; if (net.get(p) < net.get(debt)) debt = p; }
            if (net.get(cred) == 0) break;
            int pay = Math.min(net.get(cred), -net.get(debt));
            net.merge(cred, -pay, Integer::sum);
            net.merge(debt, pay, Integer::sum);
            moves++;
            System.out.println("settle: " + debt + " pays " + cred + " " + pay);
        }
        System.out.println("transfers: " + pairs + " -> " + moves);
    }
}
```

```python
class EqualSplit:  # Strategy: each split type turns its own input into shares
    name = "EQUAL"

    def shares(self, amount, n):
        base, extra = divmod(amount, n)  # leftover rupees go to the first people
        return [base + (1 if i < extra else 0) for i in range(n)]


class ExactSplit:
    name = "EXACT"

    def __init__(self, amounts):
        self.amounts = amounts

    def shares(self, amount, n):
        if sum(self.amounts) != amount:
            raise ValueError("exact shares must add up to the amount")
        return list(self.amounts)


class PercentSplit:
    name = "PERCENT"

    def __init__(self, percents):
        self.percents = percents

    def shares(self, amount, n):
        if sum(self.percents) != 100:
            raise ValueError("percents must add up to 100")
        s = [amount * p // 100 for p in self.percents]
        s[0] += amount - sum(s)  # rounding leftovers
        return s


class BalanceSheet:
    def __init__(self, members):
        self.members = members  # sorted, so ties break by name
        self.owes = {}  # (debtor, creditor) -> amount, before netting

    def owed(self, d, c):
        return self.owes.get((d, c), 0)

    def add(self, desc, amount, payer, split):
        s = split.shares(amount, len(self.members))
        print(f"{desc} {amount} paid by {payer}, {split.name}: " + ", ".join(f"{p} {x}" for p, x in zip(self.members, s)))
        for p, x in zip(self.members, s):
            if p != payer:
                self.owes[(p, payer)] = self.owed(p, payer) + x

    def net(self):
        return {p: sum(self.owed(q, p) - self.owed(p, q) for q in self.members) for p in self.members}


sheet = BalanceSheet(["asha", "ben", "chen"])
sheet.add("dinner", 900, "asha", EqualSplit())
sheet.add("cab", 1000, "ben", PercentSplit([50, 20, 30]))
sheet.add("tickets", 600, "chen", ExactSplit([250, 250, 100]))
m, pairs = sheet.members, 0
for i, a in enumerate(m):
    for b in m[i + 1:]:  # net each pair: one payment per pair at most
        d = sheet.owed(a, b) - sheet.owed(b, a)
        if d:
            print(f"owes: {a} -> {b} {d}" if d > 0 else f"owes: {b} -> {a} {-d}")
            pairs += 1
net = sheet.net()
print("net: " + ", ".join(f"{p} {'+' if net[p] > 0 else ''}{net[p]}" for p in m))
moves = 0
while True:  # greedy: the largest debtor pays the largest creditor
    cred, debt = max(m, key=lambda p: net[p]), min(m, key=lambda p: net[p])
    if net[cred] == 0:
        break
    pay = min(net[cred], -net[debt])
    net[cred] -= pay
    net[debt] += pay
    moves += 1
    print(f"settle: {debt} pays {cred} {pay}")
print(f"transfers: {pairs} -> {moves}")
```

```javascript
class EqualSplit { // Strategy: each split type turns its own input into shares
  get name() { return "EQUAL"; }
  shares(amount, n) { // leftover rupees go to the first people
    return Array.from({ length: n }, (_, i) => Math.floor(amount / n) + (i < amount % n ? 1 : 0));
  }
}

class ExactSplit {
  constructor(amounts) { this.amounts = amounts; }
  get name() { return "EXACT"; }
  shares(amount) {
    if (this.amounts.reduce((a, b) => a + b, 0) !== amount) throw new Error("exact shares must add up to the amount");
    return [...this.amounts];
  }
}

class PercentSplit {
  constructor(percents) { this.percents = percents; }
  get name() { return "PERCENT"; }
  shares(amount) {
    if (this.percents.reduce((a, b) => a + b, 0) !== 100) throw new Error("percents must add up to 100");
    const s = this.percents.map((p) => Math.floor((amount * p) / 100));
    s[0] += amount - s.reduce((a, b) => a + b, 0); // rounding leftovers
    return s;
  }
}

class BalanceSheet {
  constructor(members) {
    this.members = members; // sorted, so ties break by name
    this.owes = new Map(); // "debtor>creditor" -> amount, before netting
  }
  owed(d, c) { return this.owes.get(`${d}>${c}`) || 0; }
  add(desc, amount, payer, split) {
    const s = split.shares(amount, this.members.length);
    console.log(`${desc} ${amount} paid by ${payer}, ${split.name}: ` + this.members.map((p, i) => `${p} ${s[i]}`).join(", "));
    this.members.forEach((p, i) => {
      if (p !== payer) this.owes.set(`${p}>${payer}`, this.owed(p, payer) + s[i]);
    });
  }
  net() {
    const n = new Map();
    for (const p of this.members) n.set(p, this.members.reduce((sum, q) => sum + this.owed(q, p) - this.owed(p, q), 0));
    return n;
  }
}

const sheet = new BalanceSheet(["asha", "ben", "chen"]);
sheet.add("dinner", 900, "asha", new EqualSplit());
sheet.add("cab", 1000, "ben", new PercentSplit([50, 20, 30]));
sheet.add("tickets", 600, "chen", new ExactSplit([250, 250, 100]));
const m = sheet.members;
let pairs = 0;
m.forEach((a, i) => m.slice(i + 1).forEach((b) => { // net each pair: one payment per pair at most
  const d = sheet.owed(a, b) - sheet.owed(b, a);
  if (d > 0) { console.log(`owes: ${a} -> ${b} ${d}`); pairs++; }
  if (d < 0) { console.log(`owes: ${b} -> ${a} ${-d}`); pairs++; }
}));
const net = sheet.net();
console.log("net: " + m.map((p) => `${p} ${net.get(p) > 0 ? "+" : ""}${net.get(p)}`).join(", "));
let moves = 0;
for (;;) { // greedy: the largest debtor pays the largest creditor
  let cred = m[0];
  let debt = m[0];
  for (const p of m) {
    if (net.get(p) > net.get(cred)) cred = p;
    if (net.get(p) < net.get(debt)) debt = p;
  }
  if (net.get(cred) === 0) break;
  const pay = Math.min(net.get(cred), -net.get(debt));
  net.set(cred, net.get(cred) - pay);
  net.set(debt, net.get(debt) + pay);
  moves++;
  console.log(`settle: ${debt} pays ${cred} ${pay}`);
}
console.log(`transfers: ${pairs} -> ${moves}`);
```

```output
dinner 900 paid by asha, EQUAL: asha 300, ben 300, chen 300
cab 1000 paid by ben, PERCENT: asha 500, ben 200, chen 300
tickets 600 paid by chen, EXACT: asha 250, ben 250, chen 100
owes: asha -> ben 200
owes: chen -> asha 50
owes: chen -> ben 50
net: asha -150, ben +250, chen -100
settle: asha pays ben 150
settle: chen pays ben 100
transfers: 3 -> 2
```

## Interview questions

- **Why integers for money?** Floating point cannot represent 0.1 exactly; sums drift and balances stop netting to zero.
- **How do you add a "by shares" split?** A new `Split` class; Expense and BalanceSheet stay unchanged (open/closed).
- **How do you check the ledger is consistent?** Assert that a group's balances sum to zero after every expense.
- **Is the greedy settle optimal?** It uses at most n − 1 payments but not always the minimum, which is NP-hard.
- **How would you handle concurrent edits to one group?** Write each expense in a transaction and update balances in the same transaction, or recompute them from expenses.

Next: [All Low-Level Design notes](/notes/low-level-design) · Before this: [Design a Movie Ticket Booking System (BookMyShow)](/notes/low-level-design/design-a-movie-ticket-booking-system)
