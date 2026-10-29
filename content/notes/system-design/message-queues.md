---
title: Message Queues
order: 10
minutes: 7
level: intermediate
updated: 2026-10-29
seo-title: Message Queues in System Design, Animated
description: Message queues for system design interviews: buffering bursts, competing consumers vs pub/sub, acks, redelivery, idempotency and dead-letter queues, animated.
question: What is a message queue in system design?
answer: A message queue is a buffer between services: producers send messages to it and consumers read them at their own pace. It decouples the two sides, absorbs traffic bursts, lets work be spread over many consumers and, with acknowledgements and retries, keeps a message from being lost when a consumer crashes.
q: Why use a message queue instead of a direct API call?
a: A direct call needs the receiver up and fast enough at that moment. With a queue the producer only needs the queue: the consumer can be slow, restarting or briefly down, and work waits instead of failing. It also lets you add consumers to drain work faster.
q: What is the difference between a queue and pub/sub?
a: In a point-to-point queue each message is processed by one of the competing consumers, which spreads the work. In publish/subscribe each subscriber gets its own copy of every message, so one event can update search, send an email and feed analytics.
q: What does at-least-once delivery mean?
a: The queue guarantees a message is not lost, but it may be delivered more than once: if a consumer crashes after doing the work but before acknowledging, the message is redelivered. Consumers must therefore be idempotent, so a second delivery has no extra effect.
q: How do you make a consumer idempotent?
a: Give each message a unique id and record processed ids in the same transaction as the work, skipping any id already recorded. Or make the operation naturally idempotent, such as setting a status instead of incrementing a counter, or using an idempotency key with the payment provider.
q: What is a dead-letter queue?
a: A separate queue where messages go after failing a set number of deliveries. It stops one bad message (a poison message) from being retried forever and blocking others, and keeps it with its error so someone can inspect it, fix the cause and replay it.
q: Is Kafka a message queue?
a: Kafka is a distributed log rather than a classic queue. Messages are kept for a retention period instead of being deleted when consumed, and each consumer group tracks its own offset, which gives pub/sub across groups and competing consumers within a group, one consumer per partition. RabbitMQ and SQS delete a message once it is acknowledged.
---

A queue sits between the service that has work and the service that does it, so neither has to wait for the other.

## Why a queue

- **Decoupling**: the producer knows the queue, not the consumer.
- **Buffering**: bursts wait in the queue; consumers work at a steady rate.
- **Scaling out**: add consumers to drain faster.
- **Reliability**: a message survives a consumer crash until it is acknowledged.
- Cost: a new component to run, and work happens **later** (asynchronously).

@figure burst-buffer

## Point-to-point: competing consumers

- Many consumers read one queue.
- Each message goes to **exactly one** consumer, then is hidden from the others.
- Fast consumers take more work; one slow message does not stall the rest.
- Use it for jobs: sending emails, resizing images, processing orders.

@figure competing-consumers

## Publish/subscribe

- Producers publish to a **topic**; every subscriber gets **its own copy**.
- The publisher does not know who listens; add a subscriber without changing it.
- Use it for events: "order placed" feeds email, analytics and search.

@figure pub-sub

## Acknowledgements and redelivery

- A delivered message is hidden, not deleted, for a **visibility timeout**.
- The consumer **acks** after the work; the ack deletes it.
- No ack in time (crash, timeout) → the message is delivered again.
- That is **at-least-once** delivery, so consumers must be **idempotent**.

@figure ack-redelivery

### Delivery guarantees

| | At-most-once | At-least-once | Exactly-once effect |
| --- | --- | --- | --- |
| How | Ack before the work | Ack after the work | At-least-once + idempotent consumer |
| Risk | Lost messages | Duplicates | More work to build |
| Typical use | Metrics you can drop | Most jobs | Payments, orders |

## Dead-letter queues

- Retries fix passing faults (a timeout, a busy database), ideally with backoff.
- A **poison message** fails every time; retrying forever blocks the queue.
- After N failed deliveries it moves to a **dead-letter queue** for inspection and replay.
- Alert on DLQ depth: it means something is broken.

@figure dead-letter

## Ordering and tools

- A single queue can be FIFO, but **competing consumers break strict order**; order is usually kept per key (a partition or message group).
- **RabbitMQ, Amazon SQS**: a message is deleted once acked.
- **Kafka**: a retained, partitioned log; each consumer group tracks its own offset and can replay.

## Interview questions

- **Why put a queue between two services?** To decouple them, absorb bursts and let the consumer fail or scale without losing work.
- **Queue or pub/sub for "order placed"?** Pub/sub: several services each need the event.
- **A consumer crashes mid-message. What happens?** No ack arrives, so after the visibility timeout the message is redelivered.
- **Why must consumers be idempotent?** At-least-once delivery can repeat a message; processing it twice must not repeat the effect.
- **What is a dead-letter queue for?** Holding messages that keep failing, so they stop blocking the queue and can be fixed and replayed.

Next: [Rate Limiting](/notes/system-design/rate-limiting) · Before this: [Consistent Hashing](/notes/system-design/consistent-hashing)
