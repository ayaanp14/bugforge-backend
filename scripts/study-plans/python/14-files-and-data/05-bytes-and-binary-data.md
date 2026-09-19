---
title: Bytes and binary data — struct, int.to_bytes, base64 and hashlib
minutes: 13
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
