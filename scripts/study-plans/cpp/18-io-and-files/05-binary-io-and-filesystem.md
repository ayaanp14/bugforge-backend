---
title: Binary I/O and the filesystem
minutes: 15
---
Text I/O turns every number into digits and back, which is slow, loses precision for floating point, and makes a record's size depend on its values. Binary I/O writes the bytes an object already occupies in memory — a `double` is eight bytes on disk exactly as it is in RAM — and reads them straight back, so a file of fixed-width records can be indexed by arithmetic: record `i` starts at byte `i * sizeof(Record)`. The price is that the bytes mean nothing without the struct that wrote them, and nothing about their order is portable across machines. This lesson covers `write`/`read`, what may safely be written that way, endianness, and `std::filesystem` — the C++17 library for paths, sizes, directories and listings that a file-handling program needs around its streams.

## `write` and `read`

```cpp
#include <cstdint>
#include <fstream>

struct Record {
    std::int32_t id;
    double score;
    char name[16];
};

int main() {
    Record r{7, 91.5, "ada"};
    {
        std::ofstream out("records.bin", std::ios::binary);
        out.write(reinterpret_cast<const char*>(&r), sizeof r);
    }
    std::ifstream in("records.bin", std::ios::binary);
    Record back{};
    in.read(reinterpret_cast<char*>(&back), sizeof back);
    // back.id == 7, back.score == 91.5, back.name is "ada"
    return 0;
}
```

`write(const char*, count)` copies `count` bytes from the address; `read(char*, count)` fills them. Both want a `char*`, and an object's address is a `Record*`, so the cast is `reinterpret_cast` — Module 2 lesson 4's "reinterpret these bytes as that type", which is exactly the meaning here and one of its few legitimate uses. After a `read`, `in.gcount()` says how many bytes actually arrived; a short read at the end of the file sets `failbit`, so `while (in.read(...))` is the loop for a whole file of records.

What may be written this way: only *trivially copyable* types — built-in numbers, `char` arrays, and structs made of them. A `std::string` or `std::vector` is a small handle (a pointer, a size, a capacity); writing `sizeof(std::string)` bytes of it saves the pointer, not the characters, and reading it back produces an object pointing at memory that no longer exists. `static_assert(std::is_trivially_copyable_v<Record>)` next to the struct documents the requirement and stops a later `std::string` member compiling.

## Fixed-width records and padding

`sizeof(Record)` above is 32 on this platform, not 28: the `double` must sit at an address that is a multiple of 8, so the compiler inserts four bytes of padding after the `int32_t`. The layout is `id` (4), padding (4), `score` (8), `name` (16). Padding is part of the object and is written and read with it, which is harmless — as long as the reader uses the same struct with the same compiler settings. Reordering the members (`double` first) removes the padding here; `#pragma pack` forces it away everywhere at the cost of misaligned access and is not portable.

Because every record has the same size, the file is an array. `in.seekg(static_cast<std::streamoff>(i) * sizeof(Record))` positions the stream at record `i`; `in.tellg()` reports the position; `std::filesystem::file_size` divided by `sizeof(Record)` is the record count. That random access is the whole reason for the format — a text file has to be read from the start to find its hundredth line.

`std::ios::binary` disables newline translation. On Linux, where the judge runs, it changes nothing; on Windows a text-mode stream rewrites `\n` as `\r\n` on the way out and silently corrupts any byte `0x0A` inside a `double`. Always specify it for `write`/`read` so the program means the same thing everywhere.

## Endianness

A four-byte `int` holding `1` is stored as `01 00 00 00` on x86-64 — *little-endian*, least significant byte first — and as `00 00 00 01` on a big-endian machine. `write` emits whichever order the CPU uses, so a binary file is only readable on machines that agree. `<bit>` reports the order (`std::endian::native == std::endian::little`), and a format meant to travel serialises each integer byte by byte with shifts (`(v >> 8) & 0xFF`, …) in a declared order, or uses `std::byteswap` — C++23, reading only here. Network protocols are big-endian by convention; most file formats written today are little-endian. For a file a program writes and reads on the same machine — a cache, a save file, this lesson's exercise — the native order is fine, and a small header with a magic number and version lets a reader refuse a file it does not understand.

## `std::filesystem`

`<filesystem>` (C++17) is the portable answer to "does this file exist, how big is it, what is in this directory". The namespace is long, so the idiom is an alias: `namespace fs = std::filesystem;`.

| Call | Result |
| --- | --- |
| `fs::path p = fs::path("data") / "q1.csv";` | joins with the platform separator |
| `p.filename()`, `p.stem()`, `p.extension()`, `p.parent_path()` | `q1.csv`, `q1`, `.csv`, `data` |
| `fs::exists(p)`, `fs::is_regular_file(p)`, `fs::is_directory(p)` | queries |
| `fs::file_size(p)` | bytes, as `std::uintmax_t`; throws for a directory |
| `fs::create_directory(p)` / `fs::create_directories(p)` | one level / the whole chain; `true` if created |
| `fs::remove(p)` / `fs::remove_all(p)` | one entry / a tree; returns whether removed / how many entries |
| `fs::rename(from, to)`, `fs::copy_file(from, to)` | as named |
| `for (const auto& entry : fs::directory_iterator(p))` | every entry; `entry.path()`, `entry.is_regular_file()`, `entry.file_size()` |

`fs::path` is a string with path semantics: `/` joins components, `string()` converts back, and `generic_string()` always uses `/` even on Windows, which is what a path written into a file or a log should use. A file stream's constructor accepts a `path` directly.

Two properties matter for a judged program. The **order** in which `directory_iterator` yields entries is unspecified — it is whatever the operating system returns — so a listing that must be deterministic collects the names into a `std::vector` and sorts them. And `fs::current_path()` is an absolute path that differs on every machine; never print it. Timestamps (`fs::last_write_time`) are the same kind of value.

```cpp
namespace fs = std::filesystem;
fs::create_directory("inbox");
{ std::ofstream a("inbox/a.txt"); a << "hello\n"; }
std::vector<std::string> names;
for (const auto& entry : fs::directory_iterator("inbox")) {
    names.push_back(entry.path().filename().string());
}
std::sort(names.begin(), names.end());
for (const auto& n : names) std::cout << n << ' ' << fs::file_size(fs::path("inbox") / n) << '\n';
fs::remove_all("inbox");                                     // 2: the file and the directory
```

## Errors: two flavours

Every filesystem function comes in two overloads. The plain one throws `fs::filesystem_error` (a `std::system_error` whose `what()` names the operation and the path) on failure — `file_size` of a missing file, `create_directory` where a file of that name exists. The overload with a trailing `std::error_code&` parameter reports through it instead and never throws: `auto size = fs::file_size(p, ec); if (ec) { /* ec.message() */ }`. The second form suits a tool that inspects many files and wants to keep going; the first suits code where a missing file is a bug. Module 15 lesson 5 has `std::error_code` in general.

## Pitfalls

| Mistake | What happens |
| --- | --- |
| `out.write(reinterpret_cast<const char*>(&str), sizeof str)` | Writes the string's handle; the characters are not in the file. |
| Reading a record with a different struct layout | Fields shift; values are garbage with no error. |
| Forgetting `std::ios::binary` | Fine on Linux; corrupt on Windows. |
| Assuming the file's byte order matches another machine | Little- and big-endian disagree; serialise explicitly. |
| Printing `directory_iterator` order as it comes | Unspecified order; sort first. |
| `fs::file_size` on a directory or missing path | Throws `filesystem_error`; use the `error_code` overload if that is expected. |

## Key takeaways

- `write`/`read` move raw bytes; cast with `reinterpret_cast<const char*>` and only for trivially copyable types — never a `std::string` or `std::vector`.
- Fixed-width records make a file an array: `seekg(i * sizeof(Record))`; `sizeof` includes padding (32 for the record above, on this platform).
- Always open binary files with `std::ios::binary`; byte order is the CPU's, so serialise explicitly for portable formats.
- `std::filesystem` gives `path` arithmetic, `exists`, `file_size`, `create_directory`, `remove_all` and `directory_iterator` — whose order you sort.
- Every function has a throwing overload and an `error_code` one; never print `current_path()` or timestamps in a judged program.
