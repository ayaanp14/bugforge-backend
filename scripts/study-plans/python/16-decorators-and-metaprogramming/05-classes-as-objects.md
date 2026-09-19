---
title: Classes as objects — type, __new__, __init_subclass__ and metaclasses in outline
minutes: 14
---
A class is an object: `type(Dog)` is `type`, `Dog` has attributes, can be passed to functions, created at run time and modified after creation. That fact is the basis of every framework that registers, validates or generates classes — ORMs, serialisers, plugin systems, `dataclass` itself. This lesson covers `type` as the class factory (`type(name, bases, namespace)`), `__new__` versus `__init__` and the singleton it enables, `__init_subclass__` as the modern hook for "do something when a subclass is defined", `__class_getitem__` behind `list[int]`, and metaclasses — what they are, what they are for, and why `__init_subclass__` or a class decorator is almost always the better tool.

## type is the class of classes

```python
class Dog:
    sound = "woof"

type(Dog)                          # <class 'type'>
type(type)                         # <class 'type'> — it is its own class
Dog.__name__, Dog.__bases__        # 'Dog', (<class 'object'>,)
Dog.__dict__["sound"]              # 'woof' — the namespace
Dog.legs = 4                       # classes are mutable
isinstance(Dog, type)              # True
```

`type` is the *metaclass* of every ordinary class: the thing that, called with a name, a tuple of bases and a namespace dict, produces a class. The `class` statement is a call to it:

```python
Cat = type("Cat", (object,), {"sound": "meow", "speak": lambda self: self.sound})
Cat().speak()                      # 'meow'
```

Building classes from data — a table's columns, a schema, a config — is this call. `types.new_class` is the fuller API; `type(...)` is enough for most cases.

## __new__ and __init__

Instantiation is two steps: `Dog.__new__(Dog, *args)` *creates* the instance, then `instance.__init__(*args)` *initialises* it. `__init__` is what you normally write; `__new__` is for the rare cases where creation itself must be controlled — subclassing an immutable type (`int`, `str`, `tuple`) whose value is fixed at creation, or returning an existing object instead of a new one:

```python
class Celsius(float):
    def __new__(cls, value):
        return super().__new__(cls, value)           # a float's value is set in __new__, not __init__

class Registry:
    _instance = None
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance                          # a singleton: every call returns the same object
```

`__new__` is a static method receiving the class; if it returns an instance of `cls`, `__init__` runs on it; if it returns something else, `__init__` is skipped. The singleton above works, and a module-level instance is usually simpler — a module is already a singleton.

## __init_subclass__

The hook for "run code when a class is subclassed" — registration, validation, filling in defaults — without a metaclass:

```python
class Plugin:
    registry: dict[str, type] = {}

    def __init_subclass__(cls, *, key=None, **kwargs):
        super().__init_subclass__(**kwargs)
        key = key or cls.__name__.lower()
        if key in Plugin.registry:
            raise TypeError(f"duplicate plugin key {key!r}")
        Plugin.registry[key] = cls

class CsvExport(Plugin, key="csv"): ...
class JsonExport(Plugin): ...

Plugin.registry                    # {'csv': CsvExport, 'jsonexport': JsonExport}
```

It runs on the *base* class each time a subclass is created, receives the new class as `cls`, and can take keyword arguments from the `class` statement. Validation belongs here too: check that a subclass defines the attributes the base requires (`if not hasattr(cls, "name"): raise TypeError`) and the error appears at definition time, where a missing `@abstractmethod` would appear at instantiation.

## __class_getitem__

`list[int]` works because `list` defines `__class_getitem__`, which receives the subscript and returns something (a `types.GenericAlias`) usable as a hint. `Generic[T]` supplies it for your classes (Module 15); defining it directly is for a class that wants `MyType[...]` to mean something of its own.

## Metaclasses, in outline

A metaclass is a subclass of `type` used as the class of a class: `class Model(metaclass=ModelMeta)`. Its `__new__` runs when the `class` statement executes, receives the name, bases and namespace, and may rewrite them before the class exists — collect the fields declared in the body, generate methods, enforce naming rules, record definition order:

```python
class ModelMeta(type):
    def __new__(mcls, name, bases, namespace, **kwargs):
        fields = [k for k, v in namespace.items() if isinstance(v, Field)]
        namespace["_fields"] = fields
        return super().__new__(mcls, name, bases, namespace)

class Model(metaclass=ModelMeta): ...
class User(Model):
    name = Field(str)
    age = Field(int)

User._fields                       # ['name', 'age']
```

Django's models, SQLAlchemy's declarative base, `enum.Enum` and `abc.ABC` use metaclasses. Almost nobody else should: `__init_subclass__` handles registration and validation, class decorators handle transformation, descriptors handle attribute behaviour — and a metaclass complicates every subclass and every combination with other metaclasses (two bases with different metaclasses is a `TypeError`). The honest rule: if you can explain why `__init_subclass__` is not enough, you may write a metaclass.

## __prepare__ and namespace order

A metaclass may define `__prepare__` to return the mapping the class body is executed in — historically an `OrderedDict` to record field order. Since 3.7 a plain dict is ordered, so `namespace.items()` already reflects definition order, and `__prepare__` is a curiosity.

## Creating and inspecting at run time

```python
cls = type(obj)                    # the class of anything
issubclass(cls, Base)
cls.__mro__                        # the lookup order
inspect.isclass(x), inspect.getmembers(cls)
setattr(cls, "method", fn)         # monkey-patching: legal, useful in tests, dangerous elsewhere
```

Every tool here is ordinary attribute access on an ordinary object; that is the point of "classes are objects".

## Pitfalls

- A metaclass where `__init_subclass__` or a decorator would do.
- Returning a non-instance from `__new__` and expecting `__init__` to run.
- `__init__` on an immutable subclass trying to set the value (too late; use `__new__`).
- Forgetting `super().__init_subclass__(**kwargs)` in a hook that takes keywords.
- Two bases with different metaclasses.
- Monkey-patching a class outside a test and surprising every other user of it.

## Key takeaways

- Classes are instances of `type`; `type(name, bases, namespace)` creates one from data; classes are mutable.
- `__new__` creates, `__init__` initialises; override `__new__` for immutable subclasses and singletons only.
- `__init_subclass__` runs on the base when a subclass is defined — the tool for registries and definition-time validation.
- `__class_getitem__` is what makes `Cls[...]` legal; `Generic` provides it.
- Metaclasses rewrite classes as they are created; frameworks use them, applications almost never should.
