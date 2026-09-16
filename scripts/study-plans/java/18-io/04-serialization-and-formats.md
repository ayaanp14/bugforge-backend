---
title: Serialization, CSV and the formats you actually use
minutes: 14
---
Sooner or later an object has to leave the JVM — into a file, across a socket, into a cache — and come back. Java shipped its own answer in 1997: mark a class `Serializable` and `ObjectOutputStream` writes the whole object graph. It still works, it is still on interview lists, and the platform's own architects now advise against it. This lesson explains how it works and what its knobs (`serialVersionUID`, `transient`, `readObject`) do, why it is a security problem, and then the formats real systems use — JSON, CSV, `Properties` — including the CSV parser that everyone gets wrong on the first try.

## Java serialization: the mechanism

```java
class Session implements Serializable {
    private static final long serialVersionUID = 1L;
    private final String user;
    private transient String token;          // not written; null after deserialisation
    …
}

try (ObjectOutputStream out = new ObjectOutputStream(new FileOutputStream("s.bin"))) { out.writeObject(session); }
try (ObjectInputStream in = new ObjectInputStream(new FileInputStream("s.bin"))) { Session s = (Session) in.readObject(); }
```

`Serializable` is a **marker interface** — no methods; it grants permission. `writeObject` walks the object graph reflectively, writing the class name, the `serialVersionUID`, and every non-`transient`, non-`static` field, recursively; shared references are written once and restored as shared. Every class in the graph must be `Serializable`, or `NotSerializableException` names the one that is not. `readObject` recreates the objects **without calling any constructor** of the serialisable classes (the first non-serialisable superclass's no-arg constructor does run) — invariants a constructor enforced are simply not re-checked.

- **`serialVersionUID`** is the version stamp. If you omit it the compiler computes one from the class's shape, so adding a method changes it and old data fails with `InvalidClassException`. Declare it explicitly; bump it when the format really changes.
- **`transient`** excludes a field: caches, derived values, secrets, anything not serialisable (`Thread`, a socket). It comes back as its default (`null`, `0`, `false`), so restore it in `readObject`.
- **`private void writeObject(ObjectOutputStream)` / `readObject(ObjectInputStream)`** hooks customise the format and are where you validate and rebuild transient state — call `defaultWriteObject()`/`defaultReadObject()` first.
- **`readResolve()`** replaces the deserialised object with another — the way a serialisable singleton stays single.
- **Records** serialise by their components and are reconstructed through the canonical constructor, so their invariants *are* re-checked — one of several reasons records are safer here.
- `Externalizable` is the fully manual variant: you write and read every byte yourself and a public no-arg constructor is called.

## Why "do not use it" is the current advice

Deserialising **untrusted bytes** lets the sender choose which classes are instantiated and how their fields are set. Chains of ordinary library classes ("gadget chains") have been found that execute arbitrary code during `readObject`; several major breaches rode on this. Mitigations exist — `ObjectInputFilter` (Java 9) whitelists classes; never deserialise from the network without one — but the structural problem remains: the format couples wire data to class internals, breaks on refactors, is Java-only, and is slow and verbose. Brian Goetz's summary is the one to quote: *serialization was a mistake; use a data format you control.* For interviews: know the mechanism, know the knobs, and know that the recommendation is JSON/Protobuf with explicit mapping.

## JSON, the default today

Use a library — Jackson (the de facto standard), Gson, or JSON-B — never a hand-written parser. The mapping is by property name, so fields can be renamed with annotations, unknown fields ignored, and versions evolve gracefully. Records map cleanly since Jackson 2.12. Two habits: make DTOs (the classes you serialise) separate from domain classes, and configure the mapper once (`FAIL_ON_UNKNOWN_PROPERTIES` off, dates as ISO-8601 strings). Binary alternatives when size and speed matter: Protocol Buffers, Avro, CBOR — all schema-driven and cross-language.

## CSV: deceptively simple

`line.split(",")` is a CSV parser for exactly as long as no field contains a comma. The real rules (RFC 4180): fields containing commas, quotes or line breaks are wrapped in double quotes; a quote inside a quoted field is doubled (`"He said ""hi"""`). A correct field splitter is a small state machine:

```java
static List<String> parseCsvLine(String line) {
    List<String> fields = new ArrayList<>();
    StringBuilder cur = new StringBuilder();
    boolean quoted = false;
    for (int i = 0; i < line.length(); i++) {
        char c = line.charAt(i);
        if (quoted) {
            if (c == '"') {
                if (i + 1 < line.length() && line.charAt(i + 1) == '"') { cur.append('"'); i++; }   // escaped quote
                else quoted = false;                                                            // closing quote
            } else cur.append(c);
        } else if (c == '"') quoted = true;
        else if (c == ',') { fields.add(cur.toString()); cur.setLength(0); }
        else cur.append(c);
    }
    fields.add(cur.toString());
    return fields;
}
```

Fields spanning lines need the reader to keep consuming until the quotes balance. Writing is the mirror: quote a field if it contains a comma, quote, or newline, doubling internal quotes. For anything serious use Apache Commons CSV or OpenCSV — but be able to write the loop above, because "parse this CSV" is a common interview exercise and `split(",")` is the wrong answer they are waiting for.

## `Properties` and other text formats

`java.util.Properties` reads `key=value` files (`props.load(reader)`, `props.getProperty("port", "8080")`) — configuration, resource bundles, `System.getProperties()`. It is a `Hashtable<Object,Object>`, ancient and thread-safe by accident; fine for what it does. YAML and TOML need libraries (SnakeYAML, tomlj). XML has JAXB (removed from the JDK in 11; add the dependency) and the built-in DOM/SAX/StAX parsers — StAX for large documents.

## Choosing a format

| Need | Use |
| --- | --- |
| Interop, APIs, config | JSON (Jackson) |
| Compact, fast, schema-evolved | Protobuf / Avro |
| Spreadsheets, bulk exports | CSV (library) |
| Java-only, same version both ends, trusted source, short-lived | Java serialization, with an `ObjectInputFilter` — and still think twice |
| Key/value config | `Properties` |

## Interview angle

- *"How does Java serialization work?"* `Serializable` marker + `ObjectOutputStream` writes the graph reflectively; `readObject` rebuilds it without constructors.
- *"What is `serialVersionUID`?"* The class's format version; mismatch → `InvalidClassException`; declare it explicitly.
- *"What does `transient` do?"* Skips the field; it is null/zero after deserialisation.
- *"Why is deserialising untrusted data dangerous?"* The sender chooses classes and field values; gadget chains give remote code execution. Filter, or use JSON.
- *"How do you parse CSV with quoted commas?"* A state machine tracking whether you are inside quotes; doubled quotes are escapes; not `split`.

## Key takeaways

- Marker interface, reflective graph write, no constructors on read; `serialVersionUID`, `transient`, `readObject`/`writeObject`, `readResolve` are the knobs.
- Untrusted deserialisation is a remote-code-execution risk; filter with `ObjectInputFilter` or, better, do not.
- JSON with Jackson for almost everything; Protobuf/Avro for compact schema-driven data.
- CSV needs a quote-aware state machine; `split(",")` is wrong.
- Records serialise through their constructor and keep their invariants.
