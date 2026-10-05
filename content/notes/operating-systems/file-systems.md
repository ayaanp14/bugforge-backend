---
title: File Systems
order: 10
minutes: 13
level: intermediate
updated: 2026-10-05
seo-title: File System in OS: Allocation Methods and Inodes
description: File systems in OS: attributes, access methods, directory structures, contiguous, linked and indexed allocation, inodes worked out, free space and FAT.
question: What is a file system in an operating system?
answer: A file system is the part of the operating system that organizes data on a storage device into named files and directories. It records each file's attributes, decides which disk blocks hold its data through an allocation method such as contiguous, linked or indexed allocation, tracks free space, and enforces permissions. Examples are ext4 on Linux, NTFS on Windows, APFS on macOS and FAT32 on USB drives.
q: What are the file allocation methods in an operating system?
a: Contiguous allocation stores a file in consecutive blocks, which is fast for any access but causes external fragmentation and makes files hard to grow. Linked allocation chains blocks with pointers, which removes fragmentation but makes random access slow. Indexed allocation keeps all of a file's block addresses in an index block, giving fast random access at the cost of the index's space.
q: What is an inode?
a: An inode is the Unix data structure that describes one file: its type, permissions, owner, size, timestamps, link count and the addresses of its data blocks, through direct and indirect pointers. It does not contain the file's name; a directory maps names to inode numbers, which is why one file can have several names through hard links.
q: What is the difference between a hard link and a soft link?
a: A hard link is another directory entry pointing to the same inode, so both names are equally the file, and the data is freed only when the last link is removed. A soft or symbolic link is a small file containing a path to the target; it can cross file systems and point to directories, but it breaks if the target is deleted.
q: What is a FAT file system?
a: FAT, the File Allocation Table, is a linked-allocation file system that keeps all the next-block pointers in one table at the start of the volume, with one entry per cluster. A directory entry gives a file's first cluster, and each table entry gives the next cluster or an end-of-file mark. FAT32 is still common on USB drives and memory cards.
q: How does an operating system keep track of free disk space?
a: With a free-space list in one of several forms: a bitmap with one bit per block, a linked list of free blocks, grouping where one free block stores the addresses of many others, or counting, which records runs as a start block and a length. Bitmaps are the most common because finding a run of free blocks is fast.
---

A disk is just a long array of numbered blocks. A **file system** is what turns those blocks into named files in directories, with sizes, owners and permissions, and keeps that structure consistent as files grow, shrink and disappear. It has to answer three questions for every file: what is it called and who may use it, which blocks hold its data, and which blocks are still free.

## Files and their attributes

A **file** is a named collection of related information stored on secondary storage; it is the smallest unit a user can write to storage. The OS keeps these **attributes** for every file:

| Attribute | Meaning |
| --- | --- |
| Name | The human-readable name, the only attribute kept in the directory entry on Unix |
| Identifier | A unique number inside the file system, such as the inode number |
| Type | Regular file, directory, symbolic link, device and so on |
| Location | Where the file's blocks are on the device |
| Size | Current size in bytes, and sometimes the space allocated |
| Protection | Who may read, write or execute it |
| Timestamps | Creation, last modification, last access |
| Owner | The user and group that own it |

The basic **file operations** are create, open, read, write, reposition (seek), close, delete and truncate. Because searching the directory on every access would be slow, `open()` looks the file up once and returns a **file descriptor**, an index into a per-process **open-file table**. That entry holds the current file position and points into a system-wide table that holds the file's attributes and a count of how many processes have it open.

## Access methods

| Method | How data is read | Typical use |
| --- | --- | --- |
| Sequential | In order, one record after another; each read advances the file pointer | Text files, logs, compilers reading source |
| Direct (random) | Any block by its number, in any order: "read block n" | Databases, disk images |
| Indexed | Look the key up in an index, then go directly to the block | Large record files searched by key |

Sequential access is easy to simulate on a direct-access file, by keeping a current position; the reverse is slow.

## Directory structures

A **directory** maps file names to the files themselves, either holding their attributes or pointing to them.

| Structure | Idea | Drawback |
| --- | --- | --- |
| Single-level | One directory for everyone | Names must be unique across all users |
| Two-level | One directory per user under a master directory | Users cannot group their own files or easily share |
| Tree-structured | Directories inside directories, any depth | A file has exactly one parent, so sharing needs copies |
| Acyclic graph | A tree where a file or directory can appear in several places, via links | Deletion and traversal must handle several names |
| General graph | Links may create cycles | Traversals can loop forever; garbage collection needed |

Tree-structured directories give **path names**: **absolute** paths start at the root (`/home/asha/notes.txt`), **relative** paths start at the current working directory (`notes.txt`). Unix file systems are acyclic graphs in practice, thanks to two kinds of link:

- A **hard link** is a second directory entry naming the same inode. The inode keeps a **link count**, and the data is freed only when it falls to zero. Hard links cannot cross file systems, and directories cannot be hard-linked apart from the `.` and `..` entries the system creates, which keeps the graph free of cycles.
- A **symbolic (soft) link** is a tiny file that contains a path. It can point anywhere, even across file systems or to a directory, but it **dangles** if the target is deleted or moved.

@figure links

## Allocation methods

How a file's data is placed on disk decides how fast it can be read and how well space is used. Assume the disk has numbered blocks and nothing is cached except the directory entry. Here is one five-block file placed each way, and what it takes to reach its logical block 3:

@figure allocation

### Contiguous allocation

Each file occupies a run of consecutive blocks; the directory stores the **start block and length**, so logical block i is simply at start + i.

- Sequential and random access are both fast: one computation, one read, minimal head movement.
- **External fragmentation** builds up as files are created and deleted, exactly as with contiguous memory allocation.
- Files are hard to grow: the next blocks may be taken, so the file must be moved or its size declared in advance.

**Extents**, used by ext4 and NTFS, keep the benefit while allowing growth: a file is a short list of contiguous runs, each recorded as (start, length).

### Linked allocation

Each file is a linked list of blocks scattered anywhere; the directory holds the first and last block, and each block holds a pointer to the next.

- No external fragmentation, and files grow freely.
- **Random access is slow**: reaching logical block i means reading the i blocks before it to follow the pointers.
- Each block loses a few bytes to the pointer.

### Indexed allocation

All of a file's block addresses are gathered into one **index block**, the directory points to it, and entry i holds the address of logical block i.

- Fast random access and no external fragmentation.
- The index block costs space even for a tiny file, and a large file needs more than one index block: a linked list of index blocks, a **multilevel index**, or the combined scheme of the Unix inode below.

**Reads needed to fetch logical block 50 of a file:**

| Method | Disk reads | Why |
| --- | --- | --- |
| Contiguous | 1 | Compute start + 50 and read it |
| Linked | 51 | Read blocks 0 to 49 for their pointers, then block 50 |
| Indexed | 2 | Read the index block, then block 50 |

### Comparison

| Aspect | Contiguous | Linked | Indexed |
| --- | --- | --- | --- |
| Sequential access | Excellent | Good | Good |
| Random access | Excellent | Poor | Good |
| External fragmentation | Yes | No | No |
| File growth | Hard | Easy | Easy, up to the index size |
| Space overhead | None | A pointer in every block | The index blocks |
| Damage tolerance | Good | One bad pointer loses the rest of the file | A bad index block loses the file |

## Inodes in Unix file systems

Unix file systems such as ext2 and ext3 use a combined indexed scheme. Each file has an **inode** holding its type, permissions, owner, size, timestamps, link count and **15 block pointers**: 12 **direct** pointers to data blocks, then a **single indirect** pointer to a block full of data-block pointers, a **double indirect** one level deeper and a **triple indirect** one level deeper again. Small files are reached with no extra reads, while the indirect levels let files grow very large.

@figure inode

**Worked example: maximum file size.** Blocks are 4 KB and a block pointer is 4 bytes, so one block holds 4096 ÷ 4 = **1,024 pointers**.

| Pointers | Data blocks reachable | Size |
| --- | --- | --- |
| 12 direct | 12 | 48 KB |
| Single indirect | 1,024 | 4 MB |
| Double indirect | 1,024² = 1,048,576 | 4 GB |
| Triple indirect | 1,024³ = 1,073,741,824 | 4 TB |
| Total | 1,074,791,436 | just over 4 TB |

That is the textbook limit of the pointer structure. Real file systems add other limits, such as the width of the size field, and ext4 replaces the indirect blocks with extents by default.

**Worked example: reads to reach a byte**, with the inode already in memory. Logical blocks 0 to 11 are direct, 12 to 1,035 go through the single indirect block, and 1,036 to 1,049,611 through the double indirect block. Byte 60,000 is in block 60000 ÷ 4096 = 14, single indirect: **2 reads**. Byte 10,485,760 (10 MB) is in block 2,560, double indirect: **3 reads**.

Note what the inode does not hold: the **file name**. Names live in directories, which map names to inode numbers. That is why renaming a file within one file system only edits directory entries, and why hard links are possible.

## Free-space management

The file system must know which blocks are free.

| Method | Idea | Strength | Weakness |
| --- | --- | --- | --- |
| Bitmap (bit vector) | One bit per block | Fast to find free runs | Needs memory proportional to disk size |
| Linked list | Each free block points to the next free block | No extra space | Finding many free blocks needs many reads |
| Grouping | The first free block stores the addresses of n free blocks, the last of which stores the next group | Many free blocks found quickly | More complex |
| Counting | Store runs as (first block, count) | Compact when free space is contiguous | Poor when free space is scattered |

**Bitmap example.** If 1 means free, the bitmap 0 0 1 1 1 0 0 1 for blocks 0 to 7 says blocks 2, 3, 4 and 7 are free; the free run 2 to 4 is visible at a glance. For a 1 TB disk with 4 KB blocks there are 2⁴⁰ ÷ 2¹² = 2²⁸ blocks, so the bitmap is 2²⁸ bits = **32 MB**, which is why large file systems split it into groups and load only parts.

## FAT (File Allocation Table)

FAT is linked allocation with the pointers moved out of the data blocks into one **table** at the start of the volume. The table has one entry per **cluster** (a group of sectors): an entry holds the number of the file's next cluster, an end-of-file mark, or 0 for a free cluster. The directory entry stores a file's first cluster.

@figure fat

Caching the whole table turns linked allocation's worst problem, slow random access, into a walk through RAM, and the FAT doubles as the free-space list. FAT32 uses 28-bit cluster numbers and limits a single file to 4 GB minus 1 byte, which is why larger drives use exFAT or NTFS, but its simplicity keeps it on memory cards and USB drives.

## Consistency and journaling

A crash in the middle of an update, say after a block is allocated but before the inode points to it, leaves the structures inconsistent. Older systems ran a checker such as `fsck` over the whole disk at boot. **Journaling** file systems, including ext4, NTFS and XFS, first write each update as a transaction to a log, the journal, and only then to its real place. After a crash only the journal needs replaying, which takes seconds instead of a full scan. Most journal only metadata by default; ext4's default ordered mode also writes data blocks before the metadata that points to them is committed.

## Common mistakes

- Saying the inode stores the file name. The name is in the directory entry.
- Treating linked allocation and FAT as unrelated. FAT is linked allocation with the links kept in a table.
- Forgetting that contiguous allocation suffers external fragmentation, not internal.
- Saying a hard link and a symbolic link behave the same when the original is deleted. The hard link still works; the symbolic link dangles.
- Computing pointers per block as block size in bits divided by pointer size in bytes. Use bytes for both: 4096 ÷ 4 = 1,024.
- Thinking a journal makes every write safe. Journaling protects the file system's structure; whether file data is protected depends on the mode.

## Interview questions

**Which allocation method is best for random access, and why?**
Contiguous allocation: the address of any logical block is start + i, so one read reaches it. Indexed allocation is close behind, needing one extra read for the index block, while linked allocation must follow every pointer before the wanted block.

**How large can a file be with 12 direct, one single, one double and one triple indirect pointer, 4 KB blocks and 4-byte pointers?**
Each block holds 1,024 pointers, so the file can have 12 + 1,024 + 1,024² + 1,024³ blocks of 4 KB: 48 KB + 4 MB + 4 GB + 4 TB, just over 4 TB.

**What happens to a file's data when you delete one of its hard links?**
Only that directory entry is removed and the inode's link count drops by one. The data is freed when the count reaches zero and no process still has the file open.

**Why does FAT allow faster random access than plain linked allocation?**
In plain linked allocation each next-pointer is inside a data block, so following the chain means reading those blocks from disk. FAT keeps all the pointers in one table that can be cached, so the chain is followed in memory and only the wanted block is read.

**What is the difference between a file descriptor and an inode?**
An inode describes a file on disk and exists whether or not anyone is using it. A file descriptor is a small integer a process gets from `open()`, indexing its open-file table, which records the current position and refers to the in-memory copy of the inode.

**Why do file systems use bitmaps for free space?**
A bitmap is compact enough to keep in memory and makes it fast to find a free block, or a run of free blocks near a file, by scanning words for set bits. Allocating contiguous runs keeps files less fragmented and reads faster.

Next, read [Disk Scheduling Algorithms](/notes/operating-systems/disk-scheduling), or test yourself with the [Operating Systems (Intermediate) skill test](/skill-tests/os-intermediate).
