---
title: Bytes and binary data — struct, int.to_bytes, base64 and hashlib
minutes: 13
seo-title: Python Bytes and Binary Data: struct, base64 and hashlib
description: Python bytes and bytearray, struct records with an explicit byte order, big-endian versus little-endian, base64 for text channels and SHA-256 with hashlib.
question: What is the difference between bytes and str in Python?
answer: A `str` is a sequence of Unicode characters; `bytes` is an immutable sequence of raw values from 0 to 255. Text becomes bytes with `"héllo".encode("utf-8")`, and bytes become text with `.decode("utf-8")`. Indexing bytes gives an int and slicing gives bytes, and `bytearray` is the mutable version used to assemble messages.
q: What is the difference between big-endian and little-endian?
a: They are the two byte orders for storing a multi-byte number. Big-endian, the network order, puts the most significant byte first, so 1 in four bytes is 00 00 00 01; little-endian, used by x86 and ARM, puts the least significant byte first, 01 00 00 00. Reading with the wrong order turns 1 into 16 777 216.
q: How do I convert an int to bytes in Python?
a: Call `n.to_bytes(length, byteorder)`; `(1).to_bytes(4, "big")` gives four bytes ending in 1, and `int.from_bytes(data, "big")` converts back. Pass `signed=True` for negative numbers in two's complement; `to_bytes` raises `OverflowError` if the value does not fit in the given length.
q: What does struct.pack do in Python?
a: `struct.pack(format, v1, v2, ...)` packs values into bytes in a fixed binary layout, and `struct.unpack` reads them back as a tuple. The format string gives the byte order and each field's type: `"<I4sH"` is little-endian, a 4-byte unsigned int, 4 raw bytes and a 2-byte unsigned int. Always give an explicit `<`, `>` or `!` prefix.
q: Is base64 encryption?
a: No. Base64 is an encoding that turns arbitrary bytes into ASCII text so they survive text-only channels such as JSON, email and URLs, at about a 33 % size cost. Anyone can decode it with `base64.b64decode`, so it provides no secrecy and no compression.
q: How do I get the SHA-256 hash of a file in Python?
a: Create `h = hashlib.sha256()`, open the file in binary mode, feed it in chunks with `h.update(chunk)`, for example over `iter(lambda: f.read(65536), b"")`, then call `h.hexdigest()`. Chunking hashes large files without loading them into memory. Never hash passwords with plain SHA-256; use `hashlib.scrypt`, `pbkdf2_hmac` or a dedicated library.
---
Text is bytes plus an encoding; everything else a program reads from a socket, a device or a binary file is bytes plus a *layout*. Python's `bytes` and `bytearray` hold the raw data, `struct` packs and unpacks fixed layouts, `int.to_bytes`/`from_bytes` convert integers with an explicit byte order, `base64` turns bytes into text that survives a text channel, and `hashlib` produces the digests that identify and verify data. This lesson covers each, the byte-order question that decides whether a number reads as 1 or 16 777 216, and the binary-file idioms.

## bytes and bytearray

```python
b = b"hello"                # a bytes literal: ASCII only; other values as \x escapes
b[0]                        # 104 — indexing gives an int
b[1:3]                      # b'el' — slicing gives bytes
bytes([104, 105])           # b'hi' — from ints 0–255
b.hex()                     # '68656c6c6f'
bytes.fromhex("68 69")      # b'hi'
b.decode("utf-8")           # 'hello' — to text
"héllo".encode("utf-8")     # b'h\xc3\xa9llo' — from text

ba = bytearray(b"abc")      # mutable
ba[0] = 65                  # bytearray(b'Abc')
ba.append(33); ba.extend(b"!!")
bytes(ba)                   # freeze
```

`bytes` supports most `str` methods on ASCII content (`split`, `strip`, `startswith`, `upper`, `find`) and `len` counts bytes. `bytearray` is the growable buffer for assembling messages; `memoryview(b)` gives a zero-copy window for slicing large buffers without duplicating them.

## Byte order

The integer 1 stored in four bytes is `00 00 00 01` in **big-endian** (network order, most significant byte first) and `01 00 00 00` in **little-endian** (x86 and ARM). Reading with the wrong order gives 16 777 216. Every format specifies its order; every conversion function takes it as an argument:

```python
(1).to_bytes(4, "big")                # b'\x00\x00\x00\x01'
(1).to_bytes(4, "little")             # b'\x01\x00\x00\x00'
int.from_bytes(b"\x00\x00\x01\x00", "big")     # 256
(-1).to_bytes(2, "big", signed=True)  # b'\xff\xff'
int.from_bytes(b"\xff\xff", "big", signed=True) # -1
(255).bit_length()                    # 8 — how many bits a value needs
```

`to_bytes` raises `OverflowError` if the value does not fit; `signed=True` uses two's complement.

## struct

`struct` packs several values into a fixed layout and back, with the order and sizes given by a format string:

```python
import struct

record = struct.pack("<I4sH", 42, b"ab\x00\x00", 7)     # little-endian: uint32, 4 bytes, uint16 → 10 bytes
struct.unpack("<I4sH", record)                          # (42, b'ab\x00\x00', 7)
struct.calcsize("<I4sH")                                # 10
struct.unpack_from(">H", buffer, offset=8)              # read at an offset without slicing
```

| Prefix | Order | Code | Type | Size |
| --- | --- | --- | --- | --- |
| `<` | little-endian, no padding | `b`/`B` | int8 / uint8 | 1 |
| `>` | big-endian, no padding | `h`/`H` | int16 / uint16 | 2 |
| `!` | network (big-endian) | `i`/`I` | int32 / uint32 | 4 |
| `@` | native order and alignment (the default — avoid for files) | `q`/`Q` | int64 / uint64 | 8 |
| | | `f`/`d` | float32 / float64 | 4 / 8 |
| | | `Ns` | N bytes | N |
| | | `?` | bool | 1 |

Always give an explicit prefix: the native default inserts alignment padding that differs between machines. A record file is `pack` in a loop on write and `unpack` per `calcsize` chunk on read; `struct.Struct(fmt)` precompiles a format for repeated use and has `.size`.

## Binary files

```python
with open("data.bin", "wb") as f:
    for value in values:
        f.write(struct.pack("<i", value))

with open("data.bin", "rb") as f:
    while chunk := f.read(4):
        (value,) = struct.unpack("<i", chunk)
```

Binary mode reads and writes `bytes`, no encoding, no newline translation. `f.read(n)` returns fewer than `n` bytes only at the end; the walrus loop reads until empty. `f.seek(offset)` and `f.tell()` position the stream — random access into a record file is `seek(i * size)`.

## base64

```python
import base64
base64.b64encode(b"\x00\xff")           # b'AP8=' — bytes → ASCII bytes
base64.b64encode(b"\x00\xff").decode()  # 'AP8=' — as a str for JSON or a header
base64.b64decode("AP8=")                # b'\x00\xff'
base64.urlsafe_b64encode(...)           # - and _ instead of + and /
```

Base64 is not encryption or compression; it is a way to put arbitrary bytes into a text-only channel (JSON, email, a URL) at a 33 % size cost. Binary data in a JSON document goes in as a base64 string.

## hashlib

```python
import hashlib
hashlib.sha256(b"hello").hexdigest()    # '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824'
h = hashlib.sha256()
with open(path, "rb") as f:
    for chunk in iter(lambda: f.read(65536), b""):
        h.update(chunk)                 # hash a large file without loading it
h.hexdigest()
hashlib.md5(b"x").hexdigest()           # fast, non-cryptographic checksum use only
```

A digest is a fixed-size fingerprint: the same input always gives the same digest, a different input almost certainly a different one, and the input cannot be recovered from it. Use SHA-256 for integrity checks and content addressing; MD5 and SHA-1 only for legacy checksums. Passwords are *not* hashed with `hashlib` directly — `hashlib.scrypt`/`pbkdf2_hmac` or a dedicated library with a salt and a work factor. `hmac.compare_digest` compares digests in constant time.

## Pitfalls

- Indexing `bytes` and getting an int when a one-byte `bytes` was expected (`b[i:i+1]`).
- Forgetting the byte-order prefix in `struct` and getting platform padding.
- Reading a binary file in text mode (decoding errors, newline translation).
- Treating base64 as secrecy.
- MD5 for anything security-related; a plain SHA-256 for passwords.
- `str(b)` giving `"b'…'"` instead of decoding.

## Key takeaways

- `bytes` is immutable, `bytearray` mutable; indexing gives ints, slicing gives bytes; `encode`/`decode` cross to text.
- `int.to_bytes(n, order, signed=)`/`from_bytes` convert integers; big-endian is network order, little-endian is the machine's.
- `struct.pack`/`unpack` with an explicit `<`/`>`/`!` prefix lay out fixed records; `calcsize` sizes them.
- Binary files: `"rb"`/`"wb"`, `read(n)` loops, `seek` for random access.
- `base64` for bytes in text channels; `hashlib.sha256` for integrity, chunked `update` for large files.
