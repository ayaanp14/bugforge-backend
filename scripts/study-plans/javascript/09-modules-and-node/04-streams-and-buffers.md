---
title: Buffers and streams — bytes, and data that does not fit in memory
minutes: 14
seo-title: Node.js Streams and Buffers: Pipeline and Backpressure
description: A Buffer holds bytes and a string holds characters. Node.js streams move data chunk by chunk with backpressure; why pipeline beats pipe, and Transforms.
question: What are streams in Node.js?
answer: A Node.js stream delivers data chunk by chunk instead of all at once, so a program can process a file far larger than memory and start work before the data ends. There are four kinds, Readable, Writable, Duplex and Transform, and HTTP bodies, sockets, stdin, stdout and compression all use them. Connect them with `pipeline`, which handles backpressure and errors for every stage.
q: What is the difference between pipe and pipeline in Node.js?
a: `a.pipe(b)` connects two streams but does not forward errors, so a failure in `a` leaves `b` open and unfinished, a classic leak. `pipeline` from `stream/promises` wires every stage, propagates the first error from any of them, destroys the rest and returns a promise. Use `pipeline` for any multi-stage flow.
q: What is backpressure in Node.js streams?
a: Backpressure is the consumer's signal that a producer must slow down. A writable stream's `write()` returns `false` when its internal buffer passes the `highWaterMark` limit, and emits `"drain"` when it can take more. `pipeline` and `for await` honour it automatically; a hand-written write loop must wait for `"drain"`.
q: What is the difference between a Buffer and a string in Node.js?
a: A `Buffer` is a fixed-size array of bytes that knows encodings such as `utf8`, `hex` and `base64`; a string is a sequence of UTF-16 characters. Their lengths differ: `Buffer.from("héllo").length` is 6 bytes for 5 characters, and `Buffer.byteLength` gives the byte size without allocating.
q: How do you read a file line by line in Node.js?
a: Create a `readline` interface over a read stream and iterate it with `for await`, passing `{ input: fs.createReadStream(path), crlfDelay: Infinity }` to `readline.createInterface`. It reads in chunks, so memory stays constant however large the file is, and the same pattern reads stdin line by line.
---
Two things separate a Node program that handles a 10 GB file from one that crashes on it: knowing that a `Buffer` is bytes and a string is characters, and processing data as a **stream** — chunk by chunk, with backpressure — instead of loading it whole. Streams are also how HTTP bodies, sockets, stdin, compression and file I/O are exposed, so even code that never touches a large file reads them constantly. This lesson covers `Buffer` and encodings, the four stream types, `pipeline` and why `pipe` alone is not enough, backpressure, object mode, async iteration over streams, `readline`, and writing a `Transform`.

## `Buffer`

```js
const b = Buffer.from("héllo", "utf8");     // <Buffer 68 c3 a9 6c 6c 6f>
b.length;                                    // 6 bytes — the string has 5 characters
Buffer.byteLength("héllo");                  // 6, without allocating
b.toString("utf8"); b.toString("hex"); b.toString("base64");
Buffer.from("aGk=", "base64").toString();    // "hi"
Buffer.alloc(4);                             // zero-filled; allocUnsafe is faster and dirty
Buffer.concat([b1, b2]); b.slice(0, 2) /* shares memory */; b.subarray(0, 2);
b.readUInt32BE(0); b.writeInt16LE(v, off);   // binary protocols
Buffer.compare(a, b); a.equals(b);
```

A `Buffer` is a fixed-size byte array (a `Uint8Array` subclass) that knows encodings: `utf8` (default), `utf16le`, `latin1`, `ascii`, `hex`, `base64`, `base64url`. The one rule that bites: a **UTF-8 chunk boundary can split a multi-byte character** — concatenating `chunk.toString()` per chunk produces garbage at the seams. Set an encoding on the stream (`setEncoding("utf8")`) or use a `StringDecoder`, which buffers partial characters, or collect the buffers and decode once.

## The four kinds of stream

| Type | Direction | Examples |
| --- | --- | --- |
| `Readable` | you read from it | `fs.createReadStream`, `process.stdin`, an HTTP request body, `Readable.from(iterable)` |
| `Writable` | you write into it | `fs.createWriteStream`, `process.stdout`, an HTTP response |
| `Duplex` | both, independent | a TCP socket |
| `Transform` | writable in, readable out — a function over chunks | `zlib.createGzip()`, `crypto.createCipheriv()`, your own parsers |

Streams are `EventEmitter`s: `"data"`, `"end"`, `"error"`, `"finish"`, `"close"`. Modern code rarely subscribes to those directly; it uses `pipeline` and `for await`.

## `pipeline`, not `pipe`

```js
const { pipeline } = require("node:stream/promises");
const zlib = require("node:zlib");
await pipeline(
  fs.createReadStream("access.log"),
  zlib.createGzip(),
  fs.createWriteStream("access.log.gz"),
);                                          // resolves on completion, rejects on the first error from ANY stage, destroys the rest
```

`a.pipe(b)` connects two streams but does **not** forward errors: an error in `a` leaves `b` open and unfinished, a classic leak. `pipeline` wires every stage, propagates errors, cleans up on failure, and returns a promise. Use it for anything with more than one stage or where a failure matters — always, in practice.

## Backpressure

A fast producer and a slow consumer would fill memory without a brake. Writable streams signal it: `write()` returns `false` when the internal buffer is above `highWaterMark` (16 KB by default for bytes, 16 objects in object mode), and emits `"drain"` when it is safe to continue. `pipe`/`pipeline` handle this for you — pausing the readable until the writable drains. Writing in a loop by hand (`for (…) ws.write(chunk)`) ignores the signal and buffers everything; if you must write manually, await `drain` when `write` returns `false`, or use `for await` on a source and `await` the write's promise wrapper.

## Reading a stream

```js
// async iteration — the modern way; handles backpressure and errors
let bytes = 0;
for await (const chunk of fs.createReadStream(path)) bytes += chunk.length;

// line by line
const readline = require("node:readline");
const rl = readline.createInterface({ input: fs.createReadStream(path), crlfDelay: Infinity });
for await (const line of rl) { … }          // also how a CLI reads stdin line by line

// collect a whole body (when it is known to be small)
const chunks = [];
for await (const c of req) chunks.push(c);
const body = Buffer.concat(chunks).toString();

Readable.from(["a", "b", "c"]);              // any iterable or async iterable → a Readable (object mode by default)
```

`for await` pulls one chunk at a time, so the producer cannot outrun you. Do not mix it with `"data"` listeners on the same stream (both consume).

## Writing a `Transform`

```js
const { Transform } = require("node:stream");
const upper = new Transform({
  transform(chunk, encoding, callback) {           // called per input chunk
    this.push(chunk.toString().toUpperCase());     // push zero or more output chunks
    callback();                                    // or callback(err); or callback(null, output) as a shortcut
  },
  flush(callback) { this.push("\n-- end --\n"); callback(); },   // once, before end
});
```

A byte-oriented transform must remember that chunks are arbitrary slices: a line splitter keeps the trailing partial line in a field and emits it in `flush`. **Object mode** (`objectMode: true`, or `readableObjectMode`/`writableObjectMode` separately) makes chunks arbitrary JavaScript values — parsed records, events — with `highWaterMark` counted in objects. A CSV parser is a byte→object transform; a JSON-lines writer is object→byte.

## Where streams show up

HTTP: `req` is a Readable, `res` a Writable — `pipeline(fs.createReadStream(file), res)` serves a file in constant memory. `process.stdin`/`stdout`/`stderr`. `child_process` stdio. WebSockets and sockets. Compression, hashing (`createHash` is a Transform), encryption. The Web Streams API (`ReadableStream`, `fetch` bodies) is the browser's equivalent; Node has it too and can convert (`Readable.toWeb`/`fromWeb`, Node 17+).

## When not to stream

A 2 KB config file: `readFile`. A response you need entirely before acting on (JSON): collect it. Streams are for data that is large, unbounded, or produced over time — logs, uploads, exports, live feeds. Streaming a small file adds code and event-ordering hazards for nothing.

## Common mistakes

- `chunk.toString()` per chunk on multi-byte text (split characters); treating `buffer.length` as a character count.
- `pipe` chains with no error handling; forgetting an `"error"` listener on a hand-driven stream.
- Writing in a loop without honouring `write()`'s return value.
- Mixing `for await` with `"data"` handlers; consuming a stream twice.
- A Transform that assumes one input chunk equals one line/record.
- Reading a 4 GB file with `readFile`.

## Interview angle

- *"Buffer versus string?"* Bytes with an encoding versus UTF-16 characters; lengths differ; decode across chunk boundaries carefully.
- *"Why streams?"* Constant memory for large or unbounded data; processing starts before the data ends; composition via `pipeline`.
- *"`pipe` versus `pipeline`?"* `pipeline` propagates errors across every stage, destroys on failure, and returns a promise; `pipe` does none of that.
- *"What is backpressure?"* The consumer's signal to slow a producer — `write()` returning `false`, `"drain"` to resume; `pipeline` handles it.
- *"Write a Transform that upper-cases."* `new Transform({ transform(chunk, enc, cb) { cb(null, chunk.toString().toUpperCase()); } })`.

## Key takeaways

- `Buffer` = bytes + encoding; `byteLength ≠ length`; never decode chunk-by-chunk without a `StringDecoder` or `setEncoding`.
- Readable / Writable / Duplex / Transform; `Readable.from` for iterables; object mode for records.
- `stream/promises` `pipeline` for every multi-stage flow; `pipe` alone leaks on error.
- `for await` and `readline` to consume; backpressure is automatic with `pipeline`/`for await`, manual with raw `write`.
- Transforms see arbitrary chunk boundaries — buffer partial records, emit the rest in `flush`.
