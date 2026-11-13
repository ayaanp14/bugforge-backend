import { defineModule } from "../../dsl.js";

/*
 * From requirements to classes. Every program reads a script of commands,
 * one per line, and prints one line per command — the design is judged by
 * what it does, hidden cases running the refusals (a book already on loan,
 * a member at the limit, an inheritance cycle, a full course).
 */

const LIBRARY_SOLUTION = String.raw`import java.io.*;
import java.util.*;

public class Main {
    static final int LOAN_DAYS = 14;
    static final int MAX_LOANS = 2;

    /** A rule the library refuses to break; the message is what the desk prints after "error: ". */
    static class LibraryException extends RuntimeException {
        LibraryException(String message) { super(message); }
    }

    static class Book {
        final String id;
        final String title;
        Loan loan; // null while the book is on the shelf

        Book(String id, String title) { this.id = id; this.title = title; }
        boolean onLoan() { return loan != null; }
    }

    static class Member {
        final String name;
        final List<Loan> loans = new ArrayList<>();

        Member(String name) { this.name = name; }
    }

    /** The link between a book and a member, holding the fact that belongs to neither: the due day. */
    static class Loan {
        final Book book;
        final Member member;
        final int dueDay;

        Loan(Book book, Member member, int dueDay) { this.book = book; this.member = member; this.dueDay = dueDay; }
        boolean overdueOn(int day) { return day > dueDay; }
        int daysLate(int day) { return Math.max(0, day - dueDay); }
    }

    static class Library {
        private final Map<String, Book> books = new TreeMap<>(); // sorted by id, so OVERDUE prints in a fixed order
        private final Map<String, Member> members = new HashMap<>();

        void addBook(String id, String title) {
            if (books.containsKey(id)) throw new LibraryException("book " + id + " already exists");
            books.put(id, new Book(id, title));
        }

        void join(String name) {
            if (members.containsKey(name)) throw new LibraryException("member " + name + " already exists");
            members.put(name, new Member(name));
        }

        Loan borrow(String name, String id, int day) {
            Member member = members.get(name);
            if (member == null) throw new LibraryException("no member " + name);
            Book book = book(id);
            if (book.onLoan()) throw new LibraryException(id + " is on loan");
            if (member.loans.size() >= MAX_LOANS) throw new LibraryException(name + " already has " + MAX_LOANS + " books");
            Loan loan = new Loan(book, member, day + LOAN_DAYS);
            book.loan = loan;
            member.loans.add(loan);
            return loan;
        }

        /** Ends the loan and answers how many days late the book came back. */
        int giveBack(String id, int day) {
            Book book = book(id);
            if (!book.onLoan()) throw new LibraryException(id + " is not on loan");
            Loan loan = book.loan;
            book.loan = null;
            loan.member.loans.remove(loan);
            return loan.daysLate(day);
        }

        List<String> overdue(int day) {
            List<String> ids = new ArrayList<>();
            for (Book book : books.values()) {
                if (book.onLoan() && book.loan.overdueOn(day)) ids.add(book.id);
            }
            return ids;
        }

        private Book book(String id) {
            Book book = books.get(id);
            if (book == null) throw new LibraryException("no book " + id);
            return book;
        }
    }

    static String handle(Library library, String line) {
        String[] p = line.split("\\s+");
        switch (p[0]) {
            case "ADD": {
                String[] parts = line.split("\\s+", 3);
                library.addBook(parts[1], parts[2]);
                return "added " + parts[1];
            }
            case "JOIN":
                library.join(p[1]);
                return "welcome " + p[1];
            case "BORROW": {
                Loan loan = library.borrow(p[1], p[2], Integer.parseInt(p[3]));
                return p[1] + " borrowed " + loan.book.id + " \"" + loan.book.title + "\", due day " + loan.dueDay;
            }
            case "RETURN": {
                int late = library.giveBack(p[1], Integer.parseInt(p[2]));
                if (late == 0) return p[1] + " returned on time";
                return p[1] + " returned " + late + (late == 1 ? " day" : " days") + " late";
            }
            case "OVERDUE": {
                List<String> ids = library.overdue(Integer.parseInt(p[1]));
                return "overdue: " + (ids.isEmpty() ? "none" : String.join(" ", ids));
            }
            default:
                return "error: unknown command " + p[0];
        }
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        Library library = new Library();
        StringBuilder out = new StringBuilder();
        String line;
        while ((line = br.readLine()) != null) {
            line = line.trim();
            if (line.isEmpty()) continue;
            String reply;
            try {
                reply = handle(library, line);
            } catch (LibraryException e) {
                reply = "error: " + e.getMessage();
            }
            out.append(reply).append('\n');
        }
        System.out.print(out);
    }
}
`;

const LIBRARY_STARTER = String.raw`import java.io.*;
import java.util.*;

public class Main {
    static final int LOAN_DAYS = 14;
    static final int MAX_LOANS = 2;

    /** Throw this with the message the desk prints after "error: ". */
    static class LibraryException extends RuntimeException {
        LibraryException(String message) { super(message); }
    }

    static class Book {
        final String id;
        final String title;
        Loan loan; // null while the book is on the shelf

        Book(String id, String title) { this.id = id; this.title = title; }
        boolean onLoan() { return loan != null; }
    }

    static class Member {
        final String name;
        final List<Loan> loans = new ArrayList<>();

        Member(String name) { this.name = name; }
    }

    /** The link between a book and a member: it holds the due day. */
    static class Loan {
        final Book book;
        final Member member;
        final int dueDay;

        Loan(Book book, Member member, int dueDay) { this.book = book; this.member = member; this.dueDay = dueDay; }
        boolean overdueOn(int day) {
            // TODO: overdue once the day is past the due day
            return false;
        }
        int daysLate(int day) {
            // TODO
            return 0;
        }
    }

    static class Library {
        private final Map<String, Book> books = new TreeMap<>(); // sorted by id
        private final Map<String, Member> members = new HashMap<>();

        void addBook(String id, String title) {
            // TODO: refuse a duplicate id
        }

        void join(String name) {
            // TODO: refuse a duplicate name
        }

        Loan borrow(String name, String id, int day) {
            // TODO: check the member, the book, the loan, the limit — in that order
            throw new UnsupportedOperationException("TODO");
        }

        /** Ends the loan and answers how many days late the book came back. */
        int giveBack(String id, int day) {
            // TODO
            throw new UnsupportedOperationException("TODO");
        }

        List<String> overdue(int day) {
            // TODO: ids of overdue books, in id order
            return new ArrayList<>();
        }
    }

    static String handle(Library library, String line) {
        String[] p = line.split("\\s+");
        switch (p[0]) {
            case "ADD": {
                String[] parts = line.split("\\s+", 3);
                library.addBook(parts[1], parts[2]);
                return "added " + parts[1];
            }
            case "JOIN":
                library.join(p[1]);
                return "welcome " + p[1];
            case "BORROW": {
                Loan loan = library.borrow(p[1], p[2], Integer.parseInt(p[3]));
                return p[1] + " borrowed " + loan.book.id + " \"" + loan.book.title + "\", due day " + loan.dueDay;
            }
            case "RETURN": {
                int late = library.giveBack(p[1], Integer.parseInt(p[2]));
                if (late == 0) return p[1] + " returned on time";
                return p[1] + " returned " + late + (late == 1 ? " day" : " days") + " late";
            }
            case "OVERDUE": {
                List<String> ids = library.overdue(Integer.parseInt(p[1]));
                return "overdue: " + (ids.isEmpty() ? "none" : String.join(" ", ids));
            }
            default:
                return "error: unknown command " + p[0];
        }
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        Library library = new Library();
        StringBuilder out = new StringBuilder();
        String line;
        while ((line = br.readLine()) != null) {
            line = line.trim();
            if (line.isEmpty()) continue;
            String reply;
            try {
                reply = handle(library, line);
            } catch (LibraryException e) {
                reply = "error: " + e.getMessage();
            }
            out.append(reply).append('\n');
        }
        System.out.print(out);
    }
}
`;

const ROLES_SOLUTION = String.raw`import java.io.*;
import java.util.*;

public class Main {
    static class AccessException extends RuntimeException {
        AccessException(String message) { super(message); }
    }

    static class Role {
        final String name;
        final Set<String> permissions = new TreeSet<>();
        final List<Role> parents = new ArrayList<>();

        Role(String name) { this.name = name; }

        /** True when this role reaches the other one through its parents. */
        boolean inheritsFrom(Role other) {
            for (Role parent : parents) {
                if (parent == other || parent.inheritsFrom(other)) return true;
            }
            return false;
        }

        /** Its own permissions and every ancestor's. A cycle is refused when it is added, so the walk ends. */
        void collect(Set<String> into) {
            into.addAll(permissions);
            for (Role parent : parents) parent.collect(into);
        }
    }

    static class User {
        final String name;
        final Set<Role> roles = new LinkedHashSet<>();

        User(String name) { this.name = name; }

        Set<String> permissions() {
            Set<String> all = new TreeSet<>();
            for (Role role : roles) role.collect(all);
            return all;
        }

        boolean can(String permission) { return permissions().contains(permission); }
    }

    static class AccessControl {
        private final Map<String, Role> roles = new HashMap<>();
        private final Map<String, User> users = new HashMap<>();

        Role defineRole(String name, List<String> permissions) {
            if (roles.containsKey(name)) throw new AccessException("role " + name + " already exists");
            Role role = new Role(name);
            role.permissions.addAll(permissions);
            roles.put(name, role);
            return role;
        }

        void inherit(String childName, String parentName) {
            Role child = role(childName);
            Role parent = role(parentName);
            if (child.parents.contains(parent)) throw new AccessException(childName + " already inherits " + parentName);
            if (parent == child || parent.inheritsFrom(child)) throw new AccessException("cycle");
            child.parents.add(parent);
        }

        void addUser(String name) {
            if (users.containsKey(name)) throw new AccessException("user " + name + " already exists");
            users.put(name, new User(name));
        }

        void assign(String userName, String roleName) {
            User user = user(userName);
            Role role = role(roleName);
            if (!user.roles.add(role)) throw new AccessException(userName + " is already " + roleName);
        }

        void revoke(String userName, String roleName) {
            User user = user(userName);
            Role role = roles.get(roleName);
            if (role == null || !user.roles.remove(role)) throw new AccessException(userName + " is not " + roleName);
        }

        User user(String name) {
            User user = users.get(name);
            if (user == null) throw new AccessException("no user " + name);
            return user;
        }

        private Role role(String name) {
            Role role = roles.get(name);
            if (role == null) throw new AccessException("no role " + name);
            return role;
        }
    }

    static String list(Set<String> items) {
        return items.isEmpty() ? "none" : String.join(" ", items);
    }

    static String handle(AccessControl acl, String[] p) {
        switch (p[0]) {
            case "ROLE": {
                Role role = acl.defineRole(p[1], Arrays.asList(p).subList(2, p.length));
                return "role " + role.name + ": " + list(role.permissions);
            }
            case "INHERIT":
                acl.inherit(p[1], p[2]);
                return p[1] + " inherits " + p[2];
            case "USER":
                acl.addUser(p[1]);
                return "user " + p[1];
            case "ASSIGN":
                acl.assign(p[1], p[2]);
                return p[1] + " is now " + p[2];
            case "REVOKE":
                acl.revoke(p[1], p[2]);
                return p[1] + " is no longer " + p[2];
            case "CAN":
                return acl.user(p[1]).can(p[2]) ? "yes" : "no";
            case "PERMS":
                return p[1] + ": " + list(acl.user(p[1]).permissions());
            default:
                return "error: unknown command " + p[0];
        }
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        AccessControl acl = new AccessControl();
        StringBuilder out = new StringBuilder();
        String line;
        while ((line = br.readLine()) != null) {
            line = line.trim();
            if (line.isEmpty()) continue;
            String reply;
            try {
                reply = handle(acl, line.split("\\s+"));
            } catch (AccessException e) {
                reply = "error: " + e.getMessage();
            }
            out.append(reply).append('\n');
        }
        System.out.print(out);
    }
}
`;

const ROLES_STARTER = String.raw`import java.io.*;
import java.util.*;

public class Main {
    static class AccessException extends RuntimeException {
        AccessException(String message) { super(message); }
    }

    static class Role {
        final String name;
        final Set<String> permissions = new TreeSet<>();
        final List<Role> parents = new ArrayList<>();

        Role(String name) { this.name = name; }

        /** True when this role reaches the other one through its parents. */
        boolean inheritsFrom(Role other) {
            // TODO
            return false;
        }

        /** Its own permissions and every ancestor's. */
        void collect(Set<String> into) {
            // TODO
        }
    }

    static class User {
        final String name;
        final Set<Role> roles = new LinkedHashSet<>();

        User(String name) { this.name = name; }

        Set<String> permissions() {
            // TODO: every role's permissions, sorted
            return new TreeSet<>();
        }

        boolean can(String permission) { return permissions().contains(permission); }
    }

    static class AccessControl {
        private final Map<String, Role> roles = new HashMap<>();
        private final Map<String, User> users = new HashMap<>();

        Role defineRole(String name, List<String> permissions) {
            // TODO
            throw new UnsupportedOperationException("TODO");
        }

        void inherit(String childName, String parentName) {
            // TODO: unknown roles, an existing link, then a cycle
        }

        void addUser(String name) {
            // TODO
        }

        void assign(String userName, String roleName) {
            // TODO
        }

        void revoke(String userName, String roleName) {
            // TODO
        }

        User user(String name) {
            // TODO
            throw new UnsupportedOperationException("TODO");
        }
    }

    static String list(Set<String> items) {
        return items.isEmpty() ? "none" : String.join(" ", items);
    }

    static String handle(AccessControl acl, String[] p) {
        switch (p[0]) {
            case "ROLE": {
                Role role = acl.defineRole(p[1], Arrays.asList(p).subList(2, p.length));
                return "role " + role.name + ": " + list(role.permissions);
            }
            case "INHERIT":
                acl.inherit(p[1], p[2]);
                return p[1] + " inherits " + p[2];
            case "USER":
                acl.addUser(p[1]);
                return "user " + p[1];
            case "ASSIGN":
                acl.assign(p[1], p[2]);
                return p[1] + " is now " + p[2];
            case "REVOKE":
                acl.revoke(p[1], p[2]);
                return p[1] + " is no longer " + p[2];
            case "CAN":
                return acl.user(p[1]).can(p[2]) ? "yes" : "no";
            case "PERMS":
                return p[1] + ": " + list(acl.user(p[1]).permissions());
            default:
                return "error: unknown command " + p[0];
        }
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        AccessControl acl = new AccessControl();
        StringBuilder out = new StringBuilder();
        String line;
        while ((line = br.readLine()) != null) {
            line = line.trim();
            if (line.isEmpty()) continue;
            String reply;
            try {
                reply = handle(acl, line.split("\\s+"));
            } catch (AccessException e) {
                reply = "error: " + e.getMessage();
            }
            out.append(reply).append('\n');
        }
        System.out.print(out);
    }
}
`;

const COURSES_SOLUTION = String.raw`import java.io.*;
import java.util.*;

public class Main {
    static class RegistryException extends RuntimeException {
        RegistryException(String message) { super(message); }
    }

    static class Student {
        final String name;
        Student(String name) { this.name = name; }
    }

    static class Course {
        final String code;
        final int capacity;
        final List<Student> enrolled = new ArrayList<>();
        final List<Student> waitlist = new ArrayList<>();

        Course(String code, int capacity) { this.code = code; this.capacity = capacity; }

        boolean has(Student s) { return enrolled.contains(s) || waitlist.contains(s); }

        /** 0 when the student took a seat, otherwise their place in the waitlist. */
        int enrol(Student s) {
            if (enrolled.size() < capacity) {
                enrolled.add(s);
                return 0;
            }
            waitlist.add(s);
            return waitlist.size();
        }

        /** Frees the student's seat; answers who moved in from the waitlist, or null. */
        Student drop(Student s) {
            enrolled.remove(s);
            if (waitlist.isEmpty()) return null;
            Student next = waitlist.remove(0);
            enrolled.add(next);
            return next;
        }
    }

    static class Registry {
        private final Map<String, Course> courses = new TreeMap<>(); // sorted by code, for COURSES
        private final Map<String, Student> students = new HashMap<>();

        Course addCourse(String code, int capacity) {
            if (courses.containsKey(code)) throw new RegistryException("course " + code + " already exists");
            Course c = new Course(code, capacity);
            courses.put(code, c);
            return c;
        }

        void addStudent(String name) {
            if (students.containsKey(name)) throw new RegistryException("student " + name + " already exists");
            students.put(name, new Student(name));
        }

        String enrol(String name, String code) {
            Student s = student(name);
            Course c = course(code);
            if (c.has(s)) throw new RegistryException(name + " is already in " + code);
            int place = c.enrol(s);
            return place == 0 ? name + " enrolled in " + code : name + " waitlisted for " + code + " at position " + place;
        }

        String drop(String name, String code) {
            Student s = student(name);
            Course c = course(code);
            if (c.waitlist.remove(s)) return name + " left the waitlist for " + code;
            if (!c.enrolled.contains(s)) throw new RegistryException(name + " is not in " + code);
            Student next = c.drop(s);
            return name + " dropped " + code + (next == null ? "" : ", " + next.name + " moves in");
        }

        String roster(String code) {
            Course c = course(code);
            return code + ": " + names(c.enrolled) + " | waitlist: " + names(c.waitlist);
        }

        String coursesOf(String name) {
            Student s = student(name);
            List<String> codes = new ArrayList<>();
            for (Course c : courses.values()) if (c.enrolled.contains(s)) codes.add(c.code);
            return name + ": " + (codes.isEmpty() ? "none" : String.join(" ", codes));
        }

        private static String names(List<Student> list) {
            if (list.isEmpty()) return "none";
            StringBuilder sb = new StringBuilder();
            for (Student s : list) sb.append(sb.length() == 0 ? "" : " ").append(s.name);
            return sb.toString();
        }

        private Student student(String name) {
            Student s = students.get(name);
            if (s == null) throw new RegistryException("no student " + name);
            return s;
        }

        private Course course(String code) {
            Course c = courses.get(code);
            if (c == null) throw new RegistryException("no course " + code);
            return c;
        }
    }

    static String handle(Registry registry, String[] p) {
        switch (p[0]) {
            case "COURSE": {
                Course c = registry.addCourse(p[1], Integer.parseInt(p[2]));
                return "course " + c.code + ", capacity " + c.capacity;
            }
            case "STUDENT":
                registry.addStudent(p[1]);
                return "student " + p[1];
            case "ENROL":
                return registry.enrol(p[1], p[2]);
            case "DROP":
                return registry.drop(p[1], p[2]);
            case "ROSTER":
                return registry.roster(p[1]);
            case "COURSES":
                return registry.coursesOf(p[1]);
            default:
                return "error: unknown command " + p[0];
        }
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        Registry registry = new Registry();
        StringBuilder out = new StringBuilder();
        String line;
        while ((line = br.readLine()) != null) {
            line = line.trim();
            if (line.isEmpty()) continue;
            String reply;
            try {
                reply = handle(registry, line.split("\\s+"));
            } catch (RegistryException e) {
                reply = "error: " + e.getMessage();
            }
            out.append(reply).append('\n');
        }
        System.out.print(out);
    }
}
`;

const COURSES_STARTER = String.raw`import java.io.*;
import java.util.*;

public class Main {
    static class RegistryException extends RuntimeException {
        RegistryException(String message) { super(message); }
    }

    // TODO: Student, Course (seats + waitlist) and a Registry that finds them.
    // Keep the seat rules on Course; the Registry only looks things up and calls it.

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringBuilder out = new StringBuilder();
        String line;
        while ((line = br.readLine()) != null) {
            line = line.trim();
            if (line.isEmpty()) continue;
            String[] p = line.split("\\s+");
            String reply;
            try {
                // TODO: COURSE, STUDENT, ENROL, DROP, ROSTER, COURSES
                reply = "error: unknown command " + p[0];
            } catch (RegistryException e) {
                reply = "error: " + e.getMessage();
            }
            out.append(reply).append('\n');
        }
        System.out.print(out);
    }
}
`;

export default defineModule(import.meta.url, {
  slug: "modelling",
  title: "From requirements to classes",
  blurb: "Read a problem for nouns and verbs, give a shared fact its own class, keep each rule with its data — then code a library desk and a role system judged on behaviour.",
  icon: "layers",
  overview: `Every machine-coding round starts the same way: a paragraph of requirements and an empty editor. This module is the method for the first ten minutes — which nouns become classes, which verbs become methods, when a link between two objects deserves a class of its own, and where each rule should live.

You will model a library desk (books, members and the loans between them) and a role-based permission system (roles that inherit from roles, with cycles refused), and the checkpoint adds a course registry with seats and a waitlist. Each program reads a script of commands and prints what the system answers; hidden cases run the refusals, which is where a weak model breaks first.

It pairs with the notes [Introduction to Low-Level Design](/notes/low-level-design/introduction-to-low-level-design) and [UML class diagrams](/notes/low-level-design/uml-class-diagrams).`,
  lessons: [
    {
      slug: "modelling-requirements",
      file: "01-modelling-requirements.md",
      exercises: [
        {
          title: "Library desk",
          prompt: `Model a small library with \`Book\`, \`Member\`, \`Loan\` and a \`Library\` that finds them. The program reads commands until end of input, one per line, and prints one line for each.

| Command | Prints |
| --- | --- |
| \`ADD <id> <title…>\` | \`added <id>\` (the title is the rest of the line) |
| \`JOIN <name>\` | \`welcome <name>\` |
| \`BORROW <name> <id> <day>\` | \`<name> borrowed <id> "<title>", due day <day + 14>\` |
| \`RETURN <id> <day>\` | \`<id> returned on time\`, or \`<id> returned <n> days late\` (\`1 day late\`) |
| \`OVERDUE <day>\` | \`overdue: <ids>\` — books on loan whose due day is before \`<day>\`, in id order as text (\`B1 B10 B2\`) — or \`overdue: none\` |

A member may hold **at most two** books. Refusals print \`error: <reason>\`, checked in this order:

- \`ADD\` of an existing id: \`book <id> already exists\`; \`JOIN\` of an existing name: \`member <name> already exists\`
- \`BORROW\`: \`no member <name>\`, then \`no book <id>\`, then \`<id> is on loan\`, then \`<name> already has 2 books\`
- \`RETURN\`: \`no book <id>\`, then \`<id> is not on loan\`
- any other command: \`unknown command <WORD>\`

A book returned on its due day is on time; it is overdue from the day after.`,
          starter: LIBRARY_STARTER,
          solution: LIBRARY_SOLUTION,
          hints: [
            "The due day belongs to neither the book nor the member, so it lives on Loan; Book and Member each hold a reference to their loans.",
            "Throw a LibraryException with the reason and let main print it after \"error: \" — the methods stay free of output.",
            "Keep the books in a TreeMap and OVERDUE comes out in id order by walking its values.",
          ],
          cases: [
            {
              stdin: "ADD B1 Dune\nADD B2 Emma\nJOIN ada\nJOIN bo\nBORROW ada B1 1\nBORROW bo B1 2\nBORROW bo B2 3\nOVERDUE 16\nRETURN B1 20\nRETURN B1 21\nOVERDUE 18\n",
              expected: 'added B1\nadded B2\nwelcome ada\nwelcome bo\nada borrowed B1 "Dune", due day 15\nerror: B1 is on loan\nbo borrowed B2 "Emma", due day 17\noverdue: B1\nB1 returned 5 days late\nerror: B1 is not on loan\noverdue: B2\n',
            },
            {
              stdin: "ADD B1 War and Peace\nADD B2 Ulysses\nADD B3 Beloved\nADD B1 Duplicate\nJOIN cy\nJOIN cy\nBORROW dee B1 1\nBORROW cy B9 1\nBORROW cy B1 1\nBORROW cy B2 1\nBORROW cy B3 1\nRETURN B2 15\nRETURN B1 16\nBORROW cy B3 16\nOVERDUE 40\nLEND cy B1\n",
              expected: 'added B1\nadded B2\nadded B3\nerror: book B1 already exists\nwelcome cy\nerror: member cy already exists\nerror: no member dee\nerror: no book B9\ncy borrowed B1 "War and Peace", due day 15\ncy borrowed B2 "Ulysses", due day 15\nerror: cy already has 2 books\nB2 returned on time\nB1 returned 1 day late\ncy borrowed B3 "Beloved", due day 30\noverdue: B3\nerror: unknown command LEND\n',
              hidden: true,
            },
            {
              stdin: "ADD B10 Kim\nADD B2 Odyssey\nADD B1 Iliad\nJOIN eve\nJOIN fay\nBORROW eve B10 5\nBORROW fay B2 1\nBORROW fay B1 2\nOVERDUE 10\nOVERDUE 30\nRETURN B9 30\n",
              expected: 'added B10\nadded B2\nadded B1\nwelcome eve\nwelcome fay\neve borrowed B10 "Kim", due day 19\nfay borrowed B2 "Odyssey", due day 15\nfay borrowed B1 "Iliad", due day 16\noverdue: none\noverdue: B1 B10 B2\nerror: no book B9\n',
              hidden: true,
            },
            {
              stdin: "ADD B1 Dune\nJOIN ada\nJOIN bo\nBORROW ada B1 1\nOVERDUE 15\nOVERDUE 16\nRETURN B1 15\nBORROW bo B1 15\nRETURN B1 31\n",
              expected: 'added B1\nwelcome ada\nwelcome bo\nada borrowed B1 "Dune", due day 15\noverdue: none\noverdue: B1\nB1 returned on time\nbo borrowed B1 "Dune", due day 29\nB1 returned 2 days late\n',
              hidden: true,
            },
          ],
        },
        {
          title: "Roles and permissions",
          prompt: `Model role-based access control: a \`Role\` holds permissions and may **inherit** other roles; a \`User\` holds roles; a user can do whatever any of their roles — or any role those inherit, at any depth — allows. Inheritance is live: a link added after an assignment counts at once.

| Command | Prints |
| --- | --- |
| \`ROLE <role> [perm…]\` | \`role <role>: <perms sorted>\` or \`role <role>: none\` |
| \`INHERIT <child> <parent>\` | \`<child> inherits <parent>\` |
| \`USER <name>\` | \`user <name>\` |
| \`ASSIGN <user> <role>\` | \`<user> is now <role>\` |
| \`REVOKE <user> <role>\` | \`<user> is no longer <role>\` |
| \`CAN <user> <perm>\` | \`yes\` or \`no\` |
| \`PERMS <user>\` | \`<user>: <every permission, sorted>\` or \`<user>: none\` |

Refusals print \`error: <reason>\`:

- \`role <r> already exists\`, \`user <u> already exists\`
- \`no role <r>\` (checking the child before the parent, the user before the role), \`no user <u>\`
- \`INHERIT\`: \`<child> already inherits <parent>\` for an existing direct link, then \`cycle\` when the parent is the child or already inherits from it
- \`ASSIGN\`: \`<user> is already <role>\`; \`REVOKE\`: \`<user> is not <role>\` (also for a role that does not exist)
- any other command: \`unknown command <WORD>\``,
          starter: ROLES_STARTER,
          solution: ROLES_SOLUTION,
          hints: [
            "A role's parents are other Role objects, not names — the association is what makes inheritance live.",
            "A cycle appears exactly when the new parent already reaches the child; ask parent.inheritsFrom(child) before adding the link.",
            "Collect permissions into a TreeSet and the sorted output comes for free.",
          ],
          cases: [
            {
              stdin: "ROLE viewer read\nROLE editor edit\nINHERIT editor viewer\nUSER ana\nASSIGN ana editor\nCAN ana read\nCAN ana delete\nPERMS ana\n",
              expected: "role viewer: read\nrole editor: edit\neditor inherits viewer\nuser ana\nana is now editor\nyes\nno\nana: edit read\n",
            },
            {
              stdin: "ROLE a x\nROLE b y\nROLE c z\nINHERIT b a\nINHERIT c b\nINHERIT a c\nINHERIT a a\nINHERIT b a\nINHERIT d a\nROLE a w\nUSER u\nASSIGN u c\nPERMS u\nASSIGN u c\nASSIGN v c\nASSIGN u q\n",
              expected: "role a: x\nrole b: y\nrole c: z\nb inherits a\nc inherits b\nerror: cycle\nerror: cycle\nerror: b already inherits a\nerror: no role d\nerror: role a already exists\nuser u\nu is now c\nu: x y z\nerror: u is already c\nerror: no user v\nerror: no role q\n",
              hidden: true,
            },
            {
              stdin: "ROLE guest\nROLE reader read\nROLE writer write read\nROLE admin delete\nINHERIT admin reader\nINHERIT admin writer\nUSER zed\nPERMS zed\nASSIGN zed guest\nPERMS zed\nCAN zed read\nASSIGN zed admin\nPERMS zed\nREVOKE zed admin\nREVOKE zed admin\nCAN zed write\nCAN nobody read\nSUDO zed\n",
              expected: "role guest: none\nrole reader: read\nrole writer: read write\nrole admin: delete\nadmin inherits reader\nadmin inherits writer\nuser zed\nzed: none\nzed is now guest\nzed: none\nno\nzed is now admin\nzed: delete read write\nzed is no longer admin\nerror: zed is not admin\nno\nerror: no user nobody\nerror: unknown command SUDO\n",
              hidden: true,
            },
            {
              stdin: "ROLE ops deploy\nUSER kai\nUSER kai\nASSIGN kai ops\nCAN kai deploy\nROLE lead approve\nINHERIT lead ops\nCAN kai approve\nASSIGN kai lead\nCAN kai approve\nREVOKE kai ops\nCAN kai deploy\nREVOKE mo ops\n",
              expected: "role ops: deploy\nuser kai\nerror: user kai already exists\nkai is now ops\nyes\nrole lead: approve\nlead inherits ops\nno\nkai is now lead\nyes\nkai is no longer ops\nyes\nerror: no user mo\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "A requirement says: *\"a member borrows a book for 14 days.\"* Where should the due date live?",
          options: ["A field on Book", "A field on Member", "A Loan class that links one Book and one Member", "A Map<String, Integer> inside Library from book id to due day"],
          answer: 2,
          explanation: "The due date is a fact of *this book lent to this member*, so it belongs to the link itself: an association class, **Loan**. On Book it cannot say who has it; on Member it needs one per book; a map of ids to numbers works until the next requirement (fines, renewals) needs more than one fact about the loan.",
        },
        {
          prompt: "Which phrase from a parking-lot brief should **not** become a class?",
          options: ["\"each level has spots\"", "\"the attendant hands the driver a ticket\"", "\"a ticket records the entry time\"", "\"spots come in three sizes\""],
          answer: 1,
          explanation: "The attendant and the driver are actors: they call the system's methods and nothing about them is stored. Level, Spot and Ticket hold state, and the sizes become an enum the spot holds.",
        },
        {
          prompt: "`Library.isOverdue(Loan loan, int day)` reads only `loan.dueDay`. What is wrong with it?",
          options: ["Nothing — the Library coordinates everything", "It should be static", "It sits on the wrong class: the rule reads only Loan's data, so it belongs on Loan", "It should store the answer in a field so it is not recomputed"],
          answer: 2,
          explanation: "Put a method on the class that owns the data it needs. A method that reaches into another object's fields to decide something is the first step to a god class; `loan.overdueOn(day)` keeps the rule next to the data. Storing the answer is worse still — it goes stale the next day.",
        },
        {
          prompt: "A library **owns** its books: when a library object is discarded, its books go with it. Which UML relation is that?",
          options: ["Inheritance", "Composition (filled diamond)", "Aggregation (hollow diamond)", "Dependency (dashed arrow)"],
          answer: 1,
          explanation: "Composition: the part's life is bound to the whole. Aggregation is a looser \"has\" where the part lives on its own (a team and its players); inheritance is \"is a\"; a dependency is a use, such as a method parameter.",
        },
      ],
    },
    {
      slug: "modelling-checkpoint",
      file: "02-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "Course registry with a waitlist",
          prompt: `Model a course registry: \`Course\` (a code and a number of seats, the students enrolled and a waitlist, both in arrival order), \`Student\`, and a \`Registry\` that finds them. Commands, one per line until end of input:

| Command | Prints |
| --- | --- |
| \`COURSE <code> <seats>\` | \`course <code>, capacity <seats>\` |
| \`STUDENT <name>\` | \`student <name>\` |
| \`ENROL <name> <code>\` | \`<name> enrolled in <code>\` when a seat is free, else \`<name> waitlisted for <code> at position <k>\` |
| \`DROP <name> <code>\` | from the waitlist: \`<name> left the waitlist for <code>\`; from a seat: \`<name> dropped <code>\`, and when someone was waiting, \`<name> dropped <code>, <first waiting> moves in\` |
| \`ROSTER <code>\` | \`<code>: <enrolled> \\| waitlist: <waiting>\`, each list space-separated in arrival order or \`none\` |
| \`COURSES <name>\` | \`<name>: <codes enrolled, sorted>\` or \`<name>: none\` (waitlists do not count) |

Refusals print \`error: <reason>\`: \`course <code> already exists\`, \`student <name> already exists\`, \`no student <name>\` (checked first), \`no course <code>\`, \`<name> is already in <code>\` (enrolled or waiting), \`<name> is not in <code>\`, and \`unknown command <WORD>\`.`,
          starter: COURSES_STARTER,
          solution: COURSES_SOLUTION,
          hints: [
            "The seat rule (take a seat or join the waitlist, promote the first waiting student on a drop) is the course's own business — put it on Course.",
            "Keep courses in a TreeMap so COURSES prints in code order.",
          ],
          cases: [
            {
              stdin: "COURSE CS101 2\nSTUDENT ann\nSTUDENT ben\nSTUDENT cal\nENROL ann CS101\nENROL ben CS101\nENROL cal CS101\nROSTER CS101\nDROP ann CS101\nROSTER CS101\nCOURSES cal\n",
              expected: "course CS101, capacity 2\nstudent ann\nstudent ben\nstudent cal\nann enrolled in CS101\nben enrolled in CS101\ncal waitlisted for CS101 at position 1\nCS101: ann ben | waitlist: cal\nann dropped CS101, cal moves in\nCS101: ben cal | waitlist: none\ncal: CS101\n",
            },
            {
              stdin: "COURSE MA201 1\nCOURSE CS101 1\nCOURSE MA201 3\nSTUDENT dia\nSTUDENT eli\nSTUDENT fox\nENROL dia MA201\nENROL dia CS101\nENROL eli MA201\nENROL fox MA201\nENROL eli MA201\nENROL gus MA201\nENROL dia PH100\nDROP eli MA201\nROSTER MA201\nCOURSES dia\nCOURSES eli\nDROP dia MA201\nROSTER MA201\nDROP dia MA201\nCOURSES dia\n",
              expected: "course MA201, capacity 1\ncourse CS101, capacity 1\nerror: course MA201 already exists\nstudent dia\nstudent eli\nstudent fox\ndia enrolled in MA201\ndia enrolled in CS101\neli waitlisted for MA201 at position 1\nfox waitlisted for MA201 at position 2\nerror: eli is already in MA201\nerror: no student gus\nerror: no course PH100\neli left the waitlist for MA201\nMA201: dia | waitlist: fox\ndia: CS101 MA201\neli: none\ndia dropped MA201, fox moves in\nMA201: fox | waitlist: none\nerror: dia is not in MA201\ndia: CS101\n",
              hidden: true,
            },
            {
              stdin: "COURSE AI300 2\nSTUDENT hal\nSTUDENT hal\nROSTER AI300\nENROL hal AI300\nDROP hal AI300\nROSTER AI300\nDROP hal AI300\nDROP ivy AI300\nCOURSES hal\nGRADE hal AI300\n",
              expected: "course AI300, capacity 2\nstudent hal\nerror: student hal already exists\nAI300: none | waitlist: none\nhal enrolled in AI300\nhal dropped AI300\nAI300: none | waitlist: none\nerror: hal is not in AI300\nerror: no student ivy\nhal: none\nerror: unknown command GRADE\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "In a hotel booking brief, which pair is best modelled with an association class?",
          options: ["Hotel and Room", "Guest and Room, for a stay with check-in and check-out dates", "Room and RoomType", "Hotel and Address"],
          answer: 1,
          explanation: "A stay joins one guest to one room and carries facts of its own — the dates, the price agreed. That is a **Booking**, an association class. A hotel composes its rooms, a room type is an enum or a class the room refers to, and an address is a value the hotel holds.",
        },
        {
          prompt: "Your design stores `Map<String, String> loans` from book id to member name. A new requirement adds fines by days late. What breaks?",
          options: ["Nothing, a fine is computed from the map", "The map has nowhere to keep the due day, so a Loan object with its own fields is needed", "Only the output format", "The HashMap must become a TreeMap"],
          answer: 1,
          explanation: "Strings standing in for objects hold exactly one fact. The moment a link needs a second fact (a due day, a fine, a renewal count), the design needs a real Loan. Modelling the link as a class from the start costs nothing.",
        },
        {
          prompt: "Why should `Course.enrol` decide between a seat and the waitlist, rather than `Registry.enrol`?",
          options: ["Because Registry must stay static", "Because the rule reads only the course's capacity and lists — it is the course's own data", "Because Java forbids it", "Because the waitlist must be public"],
          answer: 1,
          explanation: "Each rule lives with its data. The registry finds the student and the course and asks the course; then a second entry point (an admin screen, a bulk import) gets the same rule for free instead of copying it.",
        },
        {
          prompt: "Which of these is a sign of a **god class**?",
          options: ["A class with an enum field", "A class whose methods are all one line", "One class holding every map and every rule while the others are only data holders", "A class that throws exceptions"],
          answer: 2,
          explanation: "A god class owns everything, so every change touches it and nothing can be tested alone. The cure is to move each rule onto the entity whose data it reads, leaving the coordinator to find objects and call them.",
        },
        {
          prompt: "A role-based access system lets a role inherit another. Which check stops `INHERIT a c` when `c` already inherits from `a`?",
          options: ["`a.parents.contains(c)`", "`c == a || c.inheritsFrom(a)` — the new parent must not already reach the child", "`a.inheritsFrom(c)`", "Sorting the roles by name"],
          answer: 1,
          explanation: "Adding `c` as a parent of `a` closes a loop exactly when `c` already reaches `a` (or is `a`). Checking before the link is added keeps every later walk of the parents finite.",
        },
        {
          prompt: "What is the main reason a refusal is thrown as an exception and printed once in `main`, rather than each method printing its own message?",
          options: ["Exceptions are faster than strings", "The model stays free of I/O, so the same classes serve a console, an API or a test", "Java requires it", "It makes output order random"],
          answer: 1,
          explanation: "Business classes that print are tied to one front end. Throwing a typed exception with a reason keeps the rules testable and lets each caller decide how to report them.",
        },
        {
          prompt: "Why does the library keep its books in a `TreeMap` instead of a `HashMap`?",
          options: ["TreeMap lookups are O(1)", "HashMap cannot hold strings", "OVERDUE must print in a fixed order, and a HashMap's iteration order is unspecified", "TreeMap uses less memory"],
          answer: 2,
          explanation: "A `HashMap` iterates in an order that depends on hashes and capacity, so output built from it can differ between runs or JDKs. A `TreeMap` iterates in key order (O(log n) lookups), which is what a judged listing needs.",
        },
        {
          prompt: "An interviewer asks: *\"what if a member can reserve a book that is on loan?\"* What change does a good model absorb most cleanly?",
          options: ["A boolean `reserved` on Member", "A new Reservation class linking Member and Book, with the book keeping a queue of them", "Renaming Loan to Reservation", "A static list of names in Library"],
          answer: 1,
          explanation: "A reservation is another link between a member and a book with facts of its own (when, the order of the queue), so it is a new association class. The existing Loan stays as it is — the change is additive.",
        },
        {
          prompt: "A requirement says *\"a member can borrow at most two books\"*. How should the 2 appear in code?",
          options: ["As the literal 2 wherever it is checked", "As a named constant (or a configurable policy) read in one place", "As a class Two", "As a field on every Book"],
          answer: 1,
          explanation: "A rule's number is a constant with a name, checked in one method. When the limit changes, or becomes per-membership, there is one place to change — the first step towards a policy object if it grows.",
        },
        {
          prompt: "In the course registry, a waitlisted student drops the course. Who moves in?",
          options: ["The first student on the waitlist", "Nobody — no seat was freed", "The last student on the waitlist", "The dropped student keeps the position"],
          answer: 1,
          explanation: "Leaving the waitlist frees no seat, so the roster is unchanged; only a student giving up a seat promotes the first one waiting. Writing the two cases separately is what the hidden case checks.",
        },
      ],
    },
  ],
});
