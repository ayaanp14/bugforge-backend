---
skill: os
level: basic
---

## os-basic-055
topic: virtual-memory
answer: B

A process has 3 page frames, initially empty, and uses FIFO page replacement. How many page faults does this reference string cause?

`2, 5, 1, 5, 3, 4, 3, 1, 3, 5, 4, 1`

- A: 6
- B: 7
- C: 9
- D: 5

> 2, 5 and 1 fault and fill the frames (3 faults); 5 hits. 3 faults and evicts 2, the oldest (frames 5, 1, 3); 4 faults and evicts 5 (1, 3, 4). 3, 1 and 3 hit. 5 faults and evicts 1 (3, 4, 5); 4 hits; 1 faults and evicts 3. The faults are 2, 5, 1, 3, 4, 5 and 1: 7. LRU would give 9 and Optimal 6 on this string, and 5 is the number of hits.

## os-basic-056
topic: virtual-memory
answer: D

A process has 3 page frames, initially empty, and uses LRU (least recently used) page replacement. How many page faults does this reference string cause?

`1, 5, 2, 3, 2, 5, 1, 5, 3, 4, 3, 1`

- A: 9
- B: 6
- C: 4
- D: 8

> 1, 5 and 2 fault (3 faults). 3 faults and evicts 1, the least recently used (frames 5, 2, 3). 2 and 5 hit. 1 faults and evicts 3, used longer ago than 2 and 5 (2, 5, 1). 5 hits. 3 faults and evicts 2 (5, 1, 3). 4 faults and evicts 1 (5, 3, 4). 3 hits. 1 faults and evicts 5. The faults are 1, 5, 2, 3, 1, 3, 4 and 1: 8. FIFO would give 9 and Optimal 6, and 4 is the number of hits.

## os-basic-057
topic: virtual-memory
answer: A

A process has 3 page frames, initially empty, and uses the Optimal page-replacement algorithm. How many page faults does this reference string cause?

`3, 1, 4, 2, 1, 5, 1, 3, 2, 4, 3, 1`

- A: 7
- B: 9
- C: 10
- D: 5

> 3, 1 and 4 fault (3 faults). 2 faults: of the resident pages, 4 is needed furthest in the future, so it goes (3, 1, 2). 1 hits. 5 faults: 3 is next used at position 8, 1 at 7 and 2 at 9, so 2 goes (3, 1, 5). 1 and 3 hit. 2 faults: 5 is never used again, so it goes (3, 1, 2). 4 faults: 2 is never used again, so it goes (3, 1, 4). 3 and 1 hit. That is 7 faults. LRU would give 9 and FIFO 10, and 5 is the number of hits.

## os-basic-058
topic: virtual-memory
answer: C

Under pure demand paging, when is a page of a process brought into memory?

- A: When the process starts, since every page is loaded before its first instruction runs
- B: When the scheduler predicts the process will touch the page in its next time slice
- C: When the process first references it, through the page fault that reference causes
- D: When a neighbouring page in the address space is loaded, so pages arrive in pairs

> Pure demand paging starts a process with none of its pages in memory and loads each page only when it is needed: the first reference finds the page-table entry marked invalid, the MMU raises a page fault, and the OS reads the page in. A page that is never touched is never read. Loading pages ahead of use is an optimisation some systems add (prepaging), not demand paging itself.

## os-basic-059
topic: virtual-memory
answer: D

A process references a legal address whose page is not in memory, and the MMU raises a page fault. What does the operating system do?

- A: It terminates the process, since the address was not mapped in its page table.
- B: It lets the MMU fetch the page from disk, and returns once the MMU has finished.
- C: It loads the page, then restarts the whole process from its first instruction.
- D: It loads the page into a frame, fixes the page table, and reruns that instruction.

> For a legal address, the OS finds a free frame (evicting a page if none is free), reads the page in from disk while the process is blocked, fills in the page-table entry with the frame number and marks it valid, and resumes the process at the instruction that faulted, which now succeeds. Termination is for an illegal address, one outside the process's address space. The MMU only detects the fault; the OS does the I/O. Restarting the whole process would throw away all its work.

## os-basic-060
topic: virtual-memory
answer: A

What does a page's dirty (modified) bit let the operating system skip?

- A: Writing the page back to disk when it is evicted, if the bit is clear
- B: Reading the page in from disk on a page fault, if the bit is set
- C: Checking access permissions on each use of the page, if the bit is clear
- D: Finding a free frame for the page on a page fault, if the bit is set

> The hardware sets the dirty bit whenever the page is written. When the page is chosen for eviction, a clear bit means the copy on disk is still current, so the frame can be reused without writing anything; a dirty page must be written out first, which doubles the I/O for that fault. The bit says nothing about whether a page must be read in, or about its permissions.

## os-basic-061
topic: virtual-memory
answer: A, B, E

Which of these are benefits of virtual memory with demand paging? Select all that apply.

- A: A program can be larger than the physical memory.
- B: More processes can be resident at once, since each keeps only part of itself in memory.
- C: Every memory access becomes faster than it would be without virtual memory.
- D: A process never page-faults again once it has started running.
- E: Less I/O is needed to start a program, since pages it never uses are never read.

> Only the pages a process actually uses need frames, so a program can be larger than physical memory, more programs fit in memory at once, and code that never runs is never read in. The costs run the other way: translation adds work to every memory access (the TLB hides most of it), and a process faults whenever it touches a page that is not resident, however long it has been running.

## os-basic-062
topic: virtual-memory
answer: B

Why do real operating systems not use the Optimal page-replacement algorithm?

- A: It causes more page faults than FIFO on most reference strings.
- B: It needs to know which pages will be referenced in the future.
- C: It needs a hardware timestamp on every page, which costs too much.
- D: It works only when the number of frames is a power of two.

> Optimal evicts the page that will not be used for the longest time, which requires the future reference string, and the OS cannot know it while the program runs. It is used offline as a yardstick: no algorithm causes fewer faults on a given string, so it is never worse than FIFO. Timestamping every access is the cost of exact LRU, not of Optimal.

## os-basic-063
topic: virtual-memory
answer: C

Servicing a page fault takes millions of CPU cycles, yet demand paging usually performs well. Why?

- A: The MMU services page faults itself, without involving the OS or the disk.
- B: Pages are small, so reading one from disk takes about as long as a memory access.
- C: Programs show locality: over a short period they use only a small set of pages.
- D: The OS loads every page when the program starts, so faults happen only at startup.

> Locality of reference (loops reuse the same code, and data near recently used data is used next) means that once a process's current set of pages is in memory, nearly every access hits it and faults are rare. A disk read takes milliseconds against nanoseconds for a memory access, and every fault needs the OS, so paging performs well only because faults are rare.

## os-basic-064
topic: file-systems
answer: A, C, D, E

Which of these does a Unix inode store? Select all that apply.

- A: The file's size
- B: The file's name
- C: The owner and the permission bits
- D: Pointers to the file's data blocks
- E: The time the file was last modified
- F: The path of the directory that contains it

> An inode holds a file's metadata (type, size, owner, permissions, timestamps, link count) and the block pointers that locate its data. The name is not in it: names live in directory entries, each mapping a name to an inode number. That is how one inode can have several names in different directories (hard links), and so it cannot record a single directory of its own either.

## os-basic-065
topic: file-systems
answer: B

`notes.txt` has one name. You run `ln notes.txt copy.txt` (creating a hard link) and then `rm notes.txt`. What happens to the file's data?

- A: `copy.txt` becomes a dangling link, because the name it refers to is gone.
- B: It stays readable through `copy.txt`; the inode's link count drops from 2 to 1.
- C: `rm` refuses to remove `notes.txt` while another hard link to it exists.
- D: It is deleted, because `rm` frees the data blocks of the inode it unlinks.

> A hard link is a second directory entry for the same inode, and the inode counts its names. rm removes one entry and decrements the count; the inode and its data are freed only when the count reaches 0 and no process still has the file open. A dangling link is what a symbolic link becomes when the name it points to is removed.

## os-basic-066
topic: file-systems
answer: D

On a typical Unix system, which of these can a symbolic link do that a hard link cannot?

- A: Keep the file's data alive after the original name is removed
- B: Share the same inode number as the file it points to
- C: Let the file be opened without any path lookup at all
- D: Point to a file on a different file system (another partition)

> A symbolic link is a small file holding a path, which is resolved when the link is opened, so it can lead anywhere: another file system, a directory, even a name that does not exist yet. A hard link is a directory entry holding an inode number, and inode numbers mean something only within one file system. Keeping the data alive and sharing the inode are what hard links do, and following a symbolic link adds a path lookup rather than saving one.

## os-basic-067
topic: file-systems
answer: A

In a Unix file system, what does a directory contain?

- A: Entries that map file names to inode numbers
- B: The data blocks of the files stored in it
- C: The size, owner and permissions of each file
- D: A full copy of the inode of each file in it

> A directory is a special file whose contents are a list of entries, each a name and an inode number. A file's attributes (size, owner, permissions) and the location of its data are in its inode, which the entry points to. Keeping them out of the directory is what allows one file to have several names.

## os-basic-068
topic: file-systems
answer: C

A process opens `/home/asha/notes.txt`. With nothing cached, in which directories must the kernel look up a name to find the file's inode?

- A: `home` and `asha`
- B: Only `asha`, the file's parent
- C: `/`, `home` and `asha`
- D: `/`, `home`, `asha` and `notes.txt`

> Resolution of an absolute path starts at the root directory, whose inode the kernel always knows: it looks up "home" in /, then "asha" in home, then "notes.txt" in asha, which gives the file's inode. notes.txt is a regular file, not a directory, so nothing is looked up inside it. A relative path would start at the process's current directory instead of /.

## os-basic-069
topic: file-systems
answer: B

A process starts with only file descriptors 0, 1 and 2 open (standard input, output and error). It calls `close(0)`, then calls `open()` successfully on two different files. What do the two `open()` calls return, in order?

- A: `3`, then `4`
- B: `0`, then `3`
- C: `0`, then `1`
- D: `3`, then `0`

> POSIX requires open() to return the lowest-numbered file descriptor that is not currently open. After close(0) that is 0, so the first open() returns 0; 1 and 2 are still open, so the second returns 3. Shells use this rule to redirect standard input: close descriptor 0, then open the file.

## os-basic-070
topic: file-systems
answer: A

What permissions does `chmod 640 report.txt` give the file?

- A: `rw-r-----`
- B: `rw-r--r--`
- C: `-wx--x---`
- D: `rwxr-----`

> Each octal digit sets one class, in the order owner, group, others, and is the sum of read 4, write 2 and execute 1. 6 = 4 + 2 is rw-, 4 is r--, and 0 is ---, giving rw-r-----. B is 644, C reads the bits with their weights reversed, and D is 740.

## os-basic-071
topic: file-systems
answer: D

A file system uses 4,096-byte blocks; every file's data occupies whole blocks, and no block is shared between files. A directory holds three files of 1 byte, 4,096 bytes and 4,097 bytes. How many data blocks do the three files use?

- A: 3
- B: 5
- C: 2
- D: 4

> Each file is rounded up to whole blocks on its own: 1 byte needs 1 block, 4,096 bytes exactly 1, and 4,097 bytes 2 (one full block plus 1 byte), so 1 + 1 + 2 = 4. 3 adds the sizes first (8,194 bytes, 3 blocks), which would need the files to share blocks; 5 treats a 4,096-byte file as spilling into a second block. The unused space in each file's last block is internal fragmentation.

## os-basic-072
topic: storage-io
answer: C

The disk head is at cylinder 60. Requests arrive for cylinders 95, 20, 130, 45, 110 and 10, in that order. With FCFS disk scheduling, what is the total head movement, in cylinders?

- A: 435
- B: 260
- C: 470
- D: 170

> FCFS serves the requests in arrival order: 60 to 95 (35), 95 to 20 (75), 20 to 130 (110), 130 to 45 (85), 45 to 110 (65) and 110 to 10 (100), a total of 35 + 75 + 110 + 85 + 65 + 100 = 470. 435 leaves out the first move from 60, 260 adds each request's distance from the starting cylinder, and 170 is what SSTF would give.

## os-basic-073
topic: storage-io
answer: A

The disk head is at cylinder 50. Pending requests are for cylinders 72, 18, 140, 35, 96, 160 and 8. With SSTF (shortest seek time first) scheduling, what is the total head movement, in cylinders?

- A: 194
- B: 262
- C: 580
- D: 357

> SSTF always moves to the nearest pending request: 50 to 35 (15), 35 to 18 (17), 18 to 8 (10), 8 to 72 (64), 72 to 96 (24), 96 to 140 (44), 140 to 160 (20), a total of 194. 262 sweeps up to 160 first and then back down to 8, 580 serves them in the listed order (FCFS), and 357 adds each request's distance from cylinder 50.

## os-basic-074
topic: storage-io
answer: D

The disk head is at cylinder 100. Requests are queued for cylinders 120, 70, 105, 135 and 92, in that order. In what order does SSTF serve them?

- A: 105, 92, 120, 70, 135
- B: 120, 70, 105, 135, 92
- C: 105, 120, 135, 92, 70
- D: 105, 92, 70, 120, 135

> From 100 the nearest request is 105 (5 away). From 105, 92 is 13 away and 120 is 15, so 92. From 92, 70 is 22 away and 120 is 28, so 70. From 70 only 120 and 135 remain: 120, then 135. A sorts by distance from the starting cylinder, ignoring that the head moves; B is FCFS; C sweeps upward first.

## os-basic-075
topic: storage-io
answer: B

A disk spins at 6,000 RPM, its average seek time is 4 ms, and transferring one sector takes 0.1 ms. Ignoring controller overhead, what is the average time to read one randomly placed sector?

- A: 14.1 ms
- B: 9.1 ms
- C: 4.1 ms
- D: 5.1 ms

> 6,000 rotations a minute is 100 a second, so one rotation takes 10 ms, and on average the sector is half a rotation away: 5 ms of rotational latency. Access time = seek + rotational latency + transfer = 4 + 5 + 0.1 = 9.1 ms. 14.1 waits a full rotation, 4.1 leaves out the rotation, and 5.1 leaves out the seek.

## os-basic-076
topic: storage-io
answer: C

Under SSTF disk scheduling, the head is near cylinder 100 and new requests keep arriving for cylinders close to it. A request for cylinder 5 is pending. What can happen to it?

- A: It is served next, because SSTF serves the request that has waited longest.
- B: It is served on the head's next pass, because SSTF sweeps the whole disk.
- C: It can wait indefinitely, because a nearer request is always chosen first.
- D: It is dropped, and the process must issue the request again later.

> SSTF chooses only by distance from the current head position, so while nearer requests keep arriving the far one is never chosen: it starves. FCFS would serve it in arrival order, and schedulers that sweep the disk from end to end put a bound on the wait. No disk scheduler drops requests.

## os-basic-077
topic: storage-io
answer: A

During a disk read using DMA (direct memory access), what does the DMA controller do?

- A: It moves the whole block between the device and memory, then interrupts the CPU once.
- B: It interrupts the CPU after every byte, so that the CPU can copy that byte to memory.
- C: It lets the CPU read the disk surface directly, as though it were part of main memory.
- D: It decides the order in which pending disk requests are served, to reduce seeking.

> The CPU gives the DMA controller the memory address, the byte count and the direction, then goes on with other work while the controller transfers the block over the bus; a single interrupt at the end reports that the transfer is complete. B describes interrupt-driven I/O byte by byte, which DMA exists to avoid for block devices. Ordering requests is the job of the OS's disk scheduler.

## os-basic-078
topic: storage-io
answer: B

Why is interrupt-driven I/O usually preferred to polling for a device such as a keyboard?

- A: Polling cannot detect a key press at all, so only interrupts can read a keyboard.
- B: The CPU can do other work until the device signals, instead of checking it repeatedly.
- C: Interrupts copy each character to memory without the CPU running any code at all.
- D: Polling needs a DMA controller, and keyboards do not have one to work with.

> Polling means the CPU repeatedly reads the device's status register, wasting cycles on a device that delivers a few keys a second. With interrupts, the device signals when a key arrives and the CPU runs a short handler only then. Polling does work, and is even preferred for very fast devices where the overhead of an interrupt costs more than a check; and an interrupt still runs handler code on the CPU.

## os-basic-079
topic: storage-io
answer: D

Several processes print at the same time. The operating system writes each process's output to a file on disk and sends the files to the printer one at a time. What is this technique called?

- A: Caching
- B: Polling
- C: Paging
- D: Spooling

> Spooling puts a queue on disk in front of a device that can serve only one job at a time: each process finishes "printing" at disk speed, and a spooler feeds the printer one complete job after another, so output from different processes is never mixed on the page. Caching keeps copies of data for faster reuse, polling repeatedly checks a device's status, and paging moves memory pages between memory and disk.

## os-basic-080
topic: storage-io
answer: C

Disk scheduling algorithms choose the order in which pending requests are served. Which part of the disk access time are they trying to reduce?

- A: Rotational latency, the wait for the sector to turn under the head
- B: Transfer time, the time to read the sector's bits as they pass by
- C: Seek time, the time to move the head arm between cylinders
- D: Controller time, the time the controller spends on each command

> Disk schedulers order requests by cylinder number, so what they shorten is the distance the arm travels: seek time, the largest part of an access on a hard disk. Rotational latency depends on where the sector lies around its track, which ordering by cylinder does not control, and transfer time is fixed by the amount of data read.
