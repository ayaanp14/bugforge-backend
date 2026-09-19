---
title: Bytecode and the interpreter — code objects, dis, name lookup and the 3.11 specialiser
minutes: 15
---
CPython does not run your source; it compiles each function to *bytecode* — a sequence of small instructions for a stack machine — and an interpreter loop executes those. Seeing the bytecode explains the costs of the previous lesson: why a local variable is faster than a global, why `self.x` in a loop is two instructions where `x` is one, what a function call actually does, and what 3.11's specialising interpreter changed. This lesson covers the compilation pipeline and code objects, reading `dis` output, the four kinds of name load, the frame and the value stack, `.pyc` caching and constant folding, and the adaptive interpreter that makes 3.11 the fastest CPython so far.

## From source to code object

```python
src = "def f(a, b):\n    total = a + b * 2\n    return total\n"
code = compile(src, "<src>", "exec")     # a module code object
ns = {}
exec(code, ns)                           # runs it: defines f in ns
f = ns["f"]
f.__code__.co_varnames                   # ('a', 'b', 'total') — the locals
f.__code__.co_argcount                   # 2
f.__code__.co_consts                     # (None, 2)
f.__code__.co_names                      # () — no globals or attributes referenced
```

Parsing produces an AST (`ast.parse`), the compiler turns it into a *code object* per module, function, class and comprehension, and `exec` or a call runs one. A code object is immutable data: `co_code` (the bytes), `co_consts` (constants, including nested code objects), `co_names` (global and attribute names), `co_varnames` (locals, parameters first), `co_argcount`, `co_nlocals`, `co_firstlineno` and a line table. A function object is a code object plus its globals, defaults and closure. The importer caches module code objects as `__pycache__/*.pyc` keyed by the source's modification time, so the compile happens once.

## Reading dis

```python
import dis
dis.dis(f)
```

```text
  2           0 RESUME                   0
  3           2 LOAD_FAST                0 (a)
              4 LOAD_FAST                1 (b)
              6 LOAD_CONST               1 (2)
              8 BINARY_OP                5 (*)
             10 BINARY_OP                0 (+)
             12 STORE_FAST               2 (total)
  4          14 LOAD_FAST                2 (total)
             16 RETURN_VALUE
```

Columns: source line, byte offset, opcode name, argument, and the resolved argument in parentheses. The machine is a stack: `LOAD_*` pushes, `BINARY_OP` pops two and pushes the result, `STORE_FAST` pops into a local slot, `RETURN_VALUE` pops and returns. `dis.get_instructions(f)` yields the same as `Instruction` objects (`opname`, `arg`, `argval`) for programs that want to count or inspect. The exact instruction set changes between minor versions — 3.11 introduced `RESUME`, `BINARY_OP` and the cache entries below — so bytecode inspection is a per-version diagnostic, never something to print in a portable program's output.

## The four loads

| Instruction | Used for | Cost |
| --- | --- | --- |
| `LOAD_CONST` | literals, folded constants | array index into `co_consts` |
| `LOAD_FAST` | local variables and parameters | array index into the frame's slots |
| `LOAD_GLOBAL` | module globals and built-ins | a dict lookup in globals, then in builtins |
| `LOAD_ATTR` / `LOAD_METHOD` | `obj.name` | type lookup, descriptor check, instance dict |
| `LOAD_DEREF` | closure variables | cell dereference |

That table is the reason for two classic micro-optimisations: binding a global or built-in to a local before a hot loop (`_len = len`) turns dict lookups into slot reads, and binding a method (`append = out.append`) removes an attribute lookup per iteration. In 3.11 the specialiser (below) narrows the gap, so these matter less than they did — measure before rewriting for them.

## Frames and calls

A call creates a *frame*: the code object, a slot array for locals, a value stack, the instruction pointer, and a link to the caller. 3.11 allocates frames in a contiguous per-thread stack and skips creating a Python frame object unless something asks for it (a traceback, `sys._getframe`), which made calls about 1.3× cheaper than 3.10. `sys.setrecursionlimit` bounds the depth; the default 1000 protects the C stack. Generators keep a suspended frame; a closure references cells rather than the enclosing frame.

## The compiler's own optimisations

`x = 2 * 60 * 60` stores `7200` — constant folding; `if 0:` blocks are dropped; `"a" "b"` is joined; a `for` over a literal list `[1, 2, 3]` iterates a constant tuple; `x in [a, b]` with constants becomes a frozenset test. Nothing else: no inlining, no loop hoisting, no type inference. What you write is what runs, one instruction per operation.

## The 3.11 specialising adaptive interpreter

PEP 659: generic instructions rewrite themselves at run time into specialised versions once they observe stable types. `BINARY_OP` on two ints becomes `BINARY_OP_ADD_INT`; `LOAD_ATTR` on an instance whose class has not changed becomes `LOAD_ATTR_INSTANCE_VALUE` with an inline cache holding the slot index; `LOAD_GLOBAL` caches the dict version and the index; `CALL` to a Python function skips the generic machinery. Each adaptive instruction has cache entries after it in the bytecode (the invisible gaps in `dis` offsets). Together with the cheaper frames and *zero-cost exceptions* — a `try` block costs nothing unless it raises, because the handler is found from a table rather than pushed at run time — 3.11 is 10–60 % faster than 3.10 on typical code, with no change to the source. The consequences for you: stable types in hot loops specialise well (mixing ints and floats in one loop de-specialises), attribute access on plain classes is fast, and `try/except` around a usually-successful operation is the right idiom.

## What the bytecode says about style

Comprehensions compile to their own code object with a tight loop; `map` and `filter` with C functions stay in C for the whole iteration; a `while` loop with manual index arithmetic executes several instructions per step that `for … in range` performs in C. Reading `dis` of two candidate versions of a hot function is the quickest way to see which does less work — provided you then measure, because instruction count is not time.

## Pitfalls

- Printing `dis` output or instruction counts from a program that should run on more than one version.
- Assuming a global lookup is free in a hot loop (it is a dict lookup, cached or not).
- Deep recursion without raising the limit — the default 1000 is a `RecursionError`, not a segfault.
- Expecting the compiler to hoist or inline anything.
- Mixed types in a hot loop that keep de-specialising.
- Relying on `.pyc` files as a distribution format (they are version-specific).

## Key takeaways

- Source compiles to code objects (`co_code`, `co_consts`, `co_names`, `co_varnames`); functions are code plus globals, defaults and closure; `.pyc` caches the compile.
- `dis` shows the stack machine: loads push, operations pop and push, stores pop; instruction sets differ per version.
- `LOAD_FAST` is a slot read, `LOAD_GLOBAL` a dict lookup, `LOAD_ATTR` a type-and-instance lookup — the source of the local-binding optimisations.
- Frames are cheap in 3.11; the compiler folds constants and nothing more.
- The specialising interpreter rewrites instructions for observed types, exceptions are zero-cost, and stable types in hot loops are what it rewards.
