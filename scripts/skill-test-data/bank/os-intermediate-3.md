---
skill: os
level: intermediate
---

## os-intermediate-055
topic: file-systems
answer: C

A Unix-style inode has 12 direct block pointers, one single-indirect pointer and one double-indirect pointer. Blocks are 1 KiB and a block pointer is 4 bytes. What is the largest file it can describe?

- A: 780 KiB
- B: 65,792 KiB
- C: 65,804 KiB
- D: 1,049,612 KiB

> A 1 KiB block holds 1024 / 4 = 256 pointers. The file can have 12 direct blocks, 256 through the single-indirect block and 256 × 256 = 65,536 through the double-indirect block: 65,804 blocks of 1 KiB. B leaves out the direct blocks; A counts the double-indirect block as 2 × 256; D assumes 1024 pointers per block, forgetting that each pointer takes 4 bytes.

## os-intermediate-056
topic: file-systems
answer: C

A Unix-style inode has 12 direct block pointers, one single-indirect pointer and one double-indirect pointer; blocks are 1 KiB and pointers 4 bytes. The inode is already in memory and nothing else is cached. How many disk reads does it take to read the byte at offset 300,000 of a large file?

- A: 1
- B: 2
- C: 3
- D: 4

> The byte is in block ⌊300,000 / 1024⌋ = 292. Blocks 0–11 are direct and the single-indirect block covers the next 256, blocks 12–267, so block 292 is reached through the double-indirect pointer: read the double-indirect block, then the single-indirect block it points to, then the data block. Three reads.

## os-intermediate-057
topic: file-systems
answer: A

A file is 50 blocks long. Its directory entry is already in memory and nothing else is cached. How many disk reads does it take to read the file's 20th block (counting from 1) under contiguous, linked (a pointer in each block, no FAT) and indexed (one index block) allocation, in that order?

- A: 1, 20 and 2
- B: 1, 19 and 2
- C: 1, 20 and 1
- D: 20, 20 and 2

> Contiguous: the block's address is the start address + 19, so one read. Linked: only the first block's address is known, and each block read reveals the next, so blocks 1 to 20 are all read: 20 reads, the last of them the data itself. Indexed: read the index block, then the data block: 2. B forgets that the 20th block must be read as well; C forgets the index block; D treats contiguous allocation as if it had to be walked.

## os-intermediate-058
topic: file-systems
answer: B

A 1 TiB disk with 4 KiB blocks keeps track of free space with a bitmap. How large is the bitmap?

- A: 4 MiB
- B: 32 MiB
- C: 256 MiB
- D: 1 GiB

> 2⁴⁰ / 2¹² = 2²⁸ blocks, one bit each: 2²⁸ bits = 2²⁵ bytes = 32 MiB. 256 MiB spends a byte per block, 1 GiB a 4-byte block number per block (a list of every block), and 4 MiB divides by 8 once too often.

## os-intermediate-059
topic: file-systems
answer: C

A process has `app.log` open and keeps appending to it. In another shell on the same Linux system, you run `rm app.log`. What happens?

- A: The process's next `write` fails with `EBADF`, because its file has been deleted
- B: The blocks are freed at once, and the process's later writes are silently discarded
- C: The name goes, but the process writes on; the space is freed when it closes the file
- D: `rm` fails with "Device or resource busy" while any process has the file open

> `rm` calls `unlink()`, which removes the directory entry and drops the link count to 0, but the kernel keeps the inode and its blocks while any process still has the file open. The process's descriptor stays valid and its writes land in the now nameless file; the space is released when the last descriptor is closed. That is why deleting a huge log can leave the disk just as full until the process writing it restarts. Refusing to delete an open file is Windows' default, not Unix's.

## os-intermediate-060
topic: file-systems
answer: D

On a traditional Unix file system such as ext4, `mkdir d` creates a directory, then `mkdir d/x d/y d/z` creates three subdirectories inside it. What is the link count of `d`?

- A: 2
- B: 3
- C: 4
- D: 5

> A new directory has two links: its entry in the parent and its own `.` entry. Each subdirectory's `..` entry is another link to it, so three subdirectories bring it to 5. (Files inside a directory do not add to its count; only subdirectories do.)

## os-intermediate-061
topic: file-systems
answer: D

ext4 is mounted in its default `data=ordered` mode. The machine crashes while a program is appending to a file. What does this mode guarantee once the journal has been replayed?

- A: Every byte the program wrote before the crash is safely on disk
- B: Data and metadata were both journaled, so the append happened in full or not at all
- C: Nothing is guaranteed until `fsck` has scanned the whole disk
- D: Metadata is consistent, and no file points to blocks still holding another file's old data

> In ordered mode only metadata goes through the journal, but a file's data blocks are written out before the metadata that points to them commits. A replay therefore restores consistent metadata that never exposes stale blocks, though the most recent writes may be lost. Journaling data as well is `data=journal`; scanning the whole disk is what a file system without a journal (ext2) needs.

## os-intermediate-062
topic: file-systems
answer: B, D, E

Which of these are true of linked allocation (each block holds a pointer to the next, no FAT), with nothing cached except the directory entry? Select all that apply.

- A: A file's size must be declared when it is created
- B: There is no external fragmentation, since any free block can be used
- C: It supports fast random access, as indexed allocation does
- D: Reading the i-th block (counting from 1) takes i disk reads
- E: A corrupted pointer loses the rest of the file

> Any free block can extend a file, so there is no external fragmentation and no need to know the size in advance; declaring it up front is contiguous allocation's problem. The price is access: reaching block i means following i − 1 pointers, so i reads in all, and one bad pointer cuts the chain. A FAT moves the pointers into a table that can be cached, which is what makes random access tolerable.

## os-intermediate-063
topic: file-systems
answer: B

On a single ext4 file system, `mv /data/big.iso /data/archive/big.iso` moves a 4 GiB file to another directory and returns almost at once. Why?

- A: The kernel copies the data in the background after `mv` returns
- B: Only directory entries change; the file's inode and data blocks stay put
- C: ext4 stores files in fixed regions, so a move only edits the region map
- D: `mv` compresses the file first, so little data is actually copied

> Within one file system, `mv` calls `rename()`, which adds a directory entry for the same inode in the target directory and removes the old one; no data block is touched, whatever the file's size. Moving to a different file system cannot do that, so `mv` copies the data and then deletes the original.

## os-intermediate-064
topic: storage-io
answer: C

A disk has cylinders 0–199. The head is at cylinder 60, moving toward higher cylinders. The queue holds requests for 25, 90, 150, 12, 110, 180, 40 and 75. Under SCAN, the head travels all the way to the last cylinder before reversing. What is the total head movement, in cylinders?

- A: 240
- B: 288
- C: 326
- D: 378

> Up: 60 → 75 → 90 → 110 → 150 → 180 → 199, 139 cylinders. Back down: 199 → 40 → 25 → 12, 187 cylinders. Total 326. LOOK, which turns at 180, gives 288; sweeping down first gives 240; 378 is C-SCAN counting its return jump.

## os-intermediate-065
topic: storage-io
answer: B

A disk has cylinders 0–199. The head is at cylinder 60, moving toward higher cylinders. The queue holds requests for 25, 90, 150, 12, 110, 180, 40 and 75. Under C-LOOK, counting the return jump as head movement, what is the total head movement, in cylinders?

- A: 148
- B: 316
- C: 340
- D: 378

> C-LOOK serves upward only as far as the highest request: 60 → 75 → 90 → 110 → 150 → 180 is 120. It then jumps straight to the lowest pending request, 180 → 12, which is 168, and serves upward again, 12 → 25 → 40, which is 28. Total 316. 148 leaves out the jump, 340 jumps to cylinder 0 instead of 12, and 378 is C-SCAN, which also runs to cylinder 199 first.

## os-intermediate-066
topic: storage-io
answer: B

A disk has cylinders 0–299. The head is at cylinder 120, moving toward cylinder 0. The queue holds requests for 45, 210, 130, 15, 280, 95 and 160. In what order does C-SCAN serve them?

- A: 95, 45, 15, 130, 160, 210, 280
- B: 95, 45, 15, 280, 210, 160, 130
- C: 130, 160, 210, 280, 95, 45, 15
- D: 15, 45, 95, 130, 160, 210, 280

> C-SCAN serves only while moving in its direction, here toward 0: 95, 45, 15. At cylinder 0 it returns to cylinder 299 without serving anything and carries on downward: 280, 210, 160, 130. A is SCAN (it serves on the way back up); C moves the wrong way first, which is also what SSTF happens to do here; D sorts the requests as if the head started at 0.

## os-intermediate-067
topic: storage-io
answer: A

Why does C-SCAN give more uniform waiting times than SCAN?

- A: After SCAN reverses, it re-serves the cylinders it just passed; C-SCAN sweeps one way only
- B: C-SCAN serves the closest request first, so no request waits behind a long seek
- C: C-SCAN's return jump is faster than a seek, so its total head movement is always lower
- D: SCAN serves requests in only one direction, wasting half of every sweep

> Just after SCAN turns around, the cylinders near the turn were served moments ago, while requests at the far end, which have waited longest, wait for the whole return sweep. C-SCAN treats the cylinders as a circle and always serves in the same direction, so every cylinder waits about one full cycle. B describes SSTF; C is false, since C-SCAN's total movement is often higher; D describes C-SCAN, not SCAN.

## os-intermediate-068
topic: storage-io
answer: A

A disk has cylinders 0–199. The head is at cylinder 100, moving toward cylinder 0. The queue holds requests for 23, 89, 132, 42, 187, 150 and 5. Under LOOK, what is the total head movement, in cylinders?

- A: 277
- B: 287
- C: 332
- D: 366

> LOOK goes down only as far as the lowest request: 100 → 89 → 42 → 23 → 5 is 95. It then reverses and serves 132, 150 and 187 on the way up: 5 → 187 is 182. Total 277. SCAN, which runs on to cylinder 0 before reversing, gives 287; C-LOOK, jumping from 5 to 187 and serving downward, gives 332; C-SCAN gives 366. Both of those count the return jump.

## os-intermediate-069
topic: storage-io
answer: B

Six 4 TB disks form a RAID 6 array. What is its usable capacity, and how many disk failures can it survive?

- A: 20 TB; any one disk
- B: 16 TB; any two disks
- C: 12 TB; any three disks
- D: 24 TB; any two disks

> RAID 6 keeps two independent parity blocks (P and Q) per stripe, spread across the disks, so two disks' worth of space holds parity: (6 − 2) × 4 = 16 TB, and any two disks can fail. 20 TB with one failure is RAID 5; 24 TB is the raw space, as if parity cost nothing; 12 TB is half the space, as mirroring would cost.

## os-intermediate-070
topic: storage-io
answer: B, D

Each array is built from identical disks. Which of them survive the failure of any two disks? Select all that apply.

- A: RAID 5 of five disks
- B: RAID 6 of five disks
- C: RAID 10 of four disks (two mirrored pairs, striped)
- D: RAID 1 of three disks, each a full mirror of the others
- E: RAID 0 of two disks

> RAID 6 tolerates any two failures through its two parity blocks, and a three-way mirror keeps a full copy after losing any two disks. RAID 5 tolerates only one. RAID 10 survives two failures in different pairs but loses data if both disks of one pair fail, so not any two. RAID 0 has no redundancy at all.

## os-intermediate-071
topic: storage-io
answer: C

A five-disk RAID 5 array updates one data block using read-modify-write: new parity = old parity XOR old data XOR new data. How many disk operations does the update take?

- A: 2
- B: 3
- C: 4
- D: 5

> Read the old data block, read the old parity block, write the new data and write the new parity: four operations, the RAID 5 small-write penalty. 2 counts only the writes. 5 is the count for the other method, reconstruct-write (read the three other data blocks, write data and parity), which this question excludes.

## os-intermediate-072
topic: storage-io
answer: C

A five-disk RAID 5 array has lost one disk and is running degraded. How many disk reads does it take to read one data block that was stored on the failed disk?

- A: 1
- B: 2
- C: 4
- D: 5

> The block is rebuilt from the rest of its stripe: the stripe's three other data blocks and its parity block, one on each surviving disk, XORed together. That is four reads for one block, which is why a degraded RAID 5 array is slow and why a rebuild, which reads every surviving disk in full, is risky. One read would be a mirror's copy (RAID 1); two reads (parity and one data block) is enough only for a three-disk array; 5 counts the failed disk.

## os-intermediate-073
topic: kernel
answer: D

In a microkernel system such as MINIX 3, the disk driver dereferences a bad pointer and crashes. What happens?

- A: The kernel panics, because drivers run in kernel mode
- B: Every process with a file open is killed along with the driver
- C: Nothing can go wrong, because microkernels forbid pointers in drivers
- D: The driver process dies, the kernel survives, and the driver can be restarted

> A microkernel runs drivers as ordinary user-mode processes with their own address spaces, talking to the kernel and to each other by messages. A crash kills only that process; MINIX 3's reincarnation server restarts it. In a monolithic kernel the same bug runs in kernel mode and can bring the whole system down.

## os-intermediate-074
topic: kernel
answer: D

An application reads a file. In a monolithic kernel, `read()` is served by function calls inside the kernel. In a microkernel, the file system is a user-space server. What is the main extra cost in the microkernel?

- A: The file-system server has to be loaded from disk again for every single request
- B: The application has to be linked in advance against the file-system server's code
- C: File data cannot be cached, since only the kernel may hold a cache
- D: Each request becomes messages through the kernel, with extra switches and copies

> The application sends a message to the server through the kernel, the server runs in its own address space, and the reply comes back the same way: extra mode and address-space switches, and data copied between processes, where a monolithic kernel makes a function call. That overhead is the price of isolating the server; much microkernel research (L4, for example) went into making IPC fast enough to pay it.

## os-intermediate-075
topic: kernel
answer: A

On Linux, `clock_gettime(CLOCK_MONOTONIC, &ts)` usually completes without entering the kernel at all. How?

- A: The kernel maps a small library and a time page into each process for user mode
- B: The C library caches the time on its first call and returns the cached value
- C: The CPU runs system calls that only read data in user mode, without any trap
- D: The kernel copies the current time into a register at every context switch

> The kernel maps a small shared object, the vDSO, into every process together with a data page it keeps up to date. The C library calls the vDSO's `clock_gettime`, which reads that page (and the CPU's counter) in user mode: no trap and no mode switch. A cached value would stop the clock, no system call skips the trap, and a value set at a context switch would be stale.

## os-intermediate-076
topic: kernel
answer: D

A system call such as `write(fd, buf, n)` hands the kernel a pointer into the caller's memory. Why does the Linux kernel read the buffer through a checked routine (`copy_from_user`) rather than dereferencing `buf` directly?

- A: Kernel mode cannot address user memory at all, so the data must be copied by DMA
- B: Copying the data is always faster than reading the caller's memory in place
- C: The buffer must move into kernel memory so the process can be swapped out
- D: `buf` may be invalid or aim at kernel memory; the routine checks it and fails safely

> The pointer comes from an untrusted program. The routine checks that the whole range lies in user space, so a program cannot make the kernel read kernel memory on its behalf, and if a page is not mapped it returns an error (`EFAULT`) instead of crashing the kernel. Copying once into kernel memory also stops the program from changing the data after the kernel has checked it. The kernel can address user memory, though modern CPUs make it opt in to each such access.

## os-intermediate-077
topic: kernel
answer: B

A process calls `getppid()`. Nothing else is runnable on that CPU, and no interrupt arrives meanwhile. What happens?

- A: Two context switches: into a kernel process and back again
- B: A mode switch into the kernel and back, but no context switch
- C: A context switch to `init` (PID 1), which looks up the parent's PID
- D: No switch of any kind, because the call never blocks

> A system call runs in kernel mode on behalf of the calling process, on its kernel stack; there is no separate "kernel process" to switch to. That is a mode switch, not a context switch. A context switch happens only when the scheduler gives the CPU to another process, for example because this one blocked or used up its time slice, and nothing here does either.

## os-intermediate-078
topic: kernel
answer: A

Why does a Linux device driver do the minimum in its interrupt handler (acknowledge the device, take the data) and defer the rest of the work to a softirq, tasklet or workqueue?

- A: The handler cannot sleep and holds off other interrupts, so long work there adds latency
- B: Interrupt handlers run in user mode, where most kernel functions cannot be called
- C: Deferred work runs at a higher priority than the interrupt handler itself
- D: The hardware aborts any interrupt handler that runs past a fixed number of instructions

> A hard interrupt handler runs in interrupt context: it cannot block or sleep, and while it runs its own interrupt line, and often every interrupt on that CPU, is held off, delaying other devices and whatever was running. So the top half does only the urgent part and schedules a bottom half, which runs later with interrupts enabled; a workqueue even runs in a kernel thread that may sleep. Handlers run in kernel mode, deferred work is less urgent rather than more, and no hardware limit cuts a handler short.

## os-intermediate-079
topic: kernel
answer: A

Linux is a monolithic kernel with loadable modules. A newly loaded device-driver module writes through a bad pointer. Why can that bring down the whole system?

- A: It runs in kernel mode, in the kernel's address space, with nothing isolating it
- B: Modules run in user space but share the kernel's page tables
- C: Loading a module turns off the kernel's memory-protection checks
- D: It cannot, because modules run as separate processes, like microkernel servers

> A loaded module is linked into the running kernel: its code runs in kernel mode and can read or overwrite any kernel data structure, so a stray write can corrupt the kernel, and a bad dereference ends in an oops or a panic. Modules make the kernel extensible without a reboot, not isolated; that isolation is what a microkernel buys with IPC.

## os-intermediate-080
topic: kernel
answer: B

A process is blocked in `read()` on an empty pipe when a signal arrives. Its handler was installed with `sigaction()` without the `SA_RESTART` flag. After the handler returns, what does `read()` do?

- A: It resumes waiting for data, as if the signal had never arrived
- B: It returns -1 with `errno` set to `EINTR`, so the caller must retry
- C: It returns 0, which the caller reads as end of file
- D: Nothing, because the process is killed for taking a signal inside a system call

> The kernel wakes the blocked call to run the handler, and without `SA_RESTART` a slow call such as `read()` on a pipe that has transferred nothing fails with `EINTR` once the handler returns (signal(7)). With `SA_RESTART` it would be restarted automatically, as in A. Returning 0 would wrongly tell the caller that every writer has gone, and taking a signal during a system call is normal, not fatal.
