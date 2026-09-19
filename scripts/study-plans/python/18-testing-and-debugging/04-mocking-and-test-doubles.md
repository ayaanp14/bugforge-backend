---
title: Mocking and test doubles — Mock, patch, side_effect and where to patch
minutes: 15
---
A unit test wants to run one piece of code without the network, the database, the clock or the file system it depends on. A *test double* stands in for the dependency: it answers with canned values, records what was asked of it, or both. `unittest.mock` provides `Mock` and `MagicMock` objects that accept any call and remember it, `patch` to swap a name for a mock during a test, `side_effect` to script answers and exceptions, and `spec`/`autospec` to keep a mock honest about the real interface. This lesson covers the vocabulary of doubles, the `Mock` API, `patch` in its three forms and the rule about *where* to patch, scripted behaviour, and the judgement of when a fake beats a mock.

## The vocabulary

| Double | What it does | Example |
| --- | --- | --- |
| Stub | returns canned answers | a `get_rate()` that returns `0.1` |
| Fake | a working lightweight implementation | an in-memory dict standing in for a key-value store |
| Spy | records calls, then delegates or returns | a sender that appends to a list |
| Mock | records calls and can assert on them | `Mock()` with `assert_called_once_with` |

Injected dependencies (lesson 1) make any of them pluggable: a class that takes `sender` in `__init__` can be given a `Mock()` in a test and the real `SmtpSender` in production.

## Mock

```python
from unittest.mock import Mock

sender = Mock()
sender.send("ada@example.com", "hi")     # any attribute, any call: accepted and recorded
sender.send.assert_called_once_with("ada@example.com", "hi")
sender.send.call_count                   # 1
sender.send.call_args                    # call('ada@example.com', 'hi')
sender.send.call_args_list               # [call('ada@example.com', 'hi')]
sender.send.call_args.args               # ('ada@example.com', 'hi')

rate = Mock(return_value=0.1)
rate()                                   # 0.1
rate.assert_called()
```

A `Mock` creates attributes on first access, each itself a `Mock`; every call returns `return_value` (another `Mock` by default) and is recorded. The assertion methods — `assert_called`, `assert_called_once`, `assert_called_with`, `assert_called_once_with`, `assert_any_call`, `assert_not_called` — raise `AssertionError` with a message showing the actual calls. `MagicMock` additionally implements the dunder methods (`__len__`, `__iter__`, `__enter__`), so it can stand in for a context manager or a container. `reset_mock()` clears the record.

## side_effect: scripted behaviour

```python
fetch = Mock(side_effect=[TimeoutError(), TimeoutError(), {"price": 42}])
fetch()          # raises TimeoutError
fetch()          # raises TimeoutError
fetch()          # {'price': 42}

parse = Mock(side_effect=lambda s: int(s) * 2)      # a function computes the answer
parse("21")      # 42

boom = Mock(side_effect=ValueError("bad"))          # always raises
```

`side_effect` as an exception raises it; as a list, each call returns the next item (an exception instance in the list is raised); as a callable, it is called with the arguments. That is how a retry loop is tested: two failures then a success, and `call_count == 3` afterwards.

## patch

```python
from unittest.mock import patch

# 1. decorator: the mock is passed as the last positional argument
@patch("billing.fetch_rate", return_value=0.2)
def test_total(mock_rate):
    assert total(100) == 120
    mock_rate.assert_called_once()

# 2. context manager
def test_total():
    with patch("billing.fetch_rate", return_value=0.2) as mock_rate:
        assert total(100) == 120

# 3. patch.object: an attribute on an object you hold
with patch.object(Clock, "now", return_value=datetime(2024, 1, 1)):
    ...
```

`patch(target)` replaces the object at the dotted path with a `MagicMock` (or `new=` something) for the duration and restores it afterwards, exception or not. `patch.dict(os.environ, {"MODE": "test"})` patches a mapping. Several decorators stack; their mocks arrive bottom-up.

## Where to patch

The target is *where the name is looked up*, not where it is defined. If `billing.py` does `from rates import fetch_rate`, then `billing.fetch_rate` is the name its code reads, and patching `rates.fetch_rate` changes nothing for it. If it does `import rates` and calls `rates.fetch_rate()`, patch `rates.fetch_rate`. The rule: patch the name in the module under test. Most "my patch has no effect" bugs are this.

## spec and autospec

```python
sender = Mock(spec=SmtpSender)         # only SmtpSender's attributes exist
sender.snd("x")                        # AttributeError — a typo is caught

with patch("billing.fetch_rate", autospec=True) as mock_rate:
    mock_rate("usd", "eur", "extra")   # TypeError — signature enforced
```

A bare `Mock` accepts anything, so a test can pass against a method that was renamed or a call with the wrong arguments. `spec=Class` restricts attributes; `autospec=True` on `patch` also checks call signatures. Use them by default for anything with a real interface.

## Fakes over mocks

A mock checks *interaction*: "send was called once with these arguments". A fake checks *outcome*: an in-memory store that the code writes to, and the test reads back. When the collaborator has state and behaviour (a repository, a queue, a cache), a small fake — a class with the same methods over a dict — produces tests that survive refactors and read like the real thing; a mock of every method produces tests that assert the implementation. Mocks are right for edges of the system — the network, the clock, email — where the interaction is the behaviour.

## Pitfalls

- Patching where the function is defined instead of where it is used.
- A test that passes because the mock returns a `Mock` that is truthy and comparable to nothing — assert on the value used.
- No `spec`, so a renamed method is never noticed.
- Mocking the class under test.
- Forgetting that `patch` as a decorator passes the mock as an argument.
- Asserting `called_with` when the code should have been tested by its result.

## Key takeaways

- Stubs answer, fakes work, spies record, mocks record and assert; injection makes them pluggable.
- `Mock` accepts any call, records `call_args`/`call_count`, and asserts with `assert_called_once_with` and friends; `MagicMock` adds dunders.
- `side_effect` scripts a sequence, a function or an exception; `return_value` is the constant answer.
- `patch`/`patch.object`/`patch.dict` swap a name for the test's duration — at the place the code under test looks it up.
- `spec`/`autospec` keep mocks honest; prefer a fake when the collaborator has state and the outcome is what matters.
