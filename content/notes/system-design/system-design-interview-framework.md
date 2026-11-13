---
title: How to Answer a System Design Interview
order: 15
minutes: 6
level: beginner
updated: 2026-11-14
seo-title: How to Answer a System Design Interview, Step by Step
description: A time-boxed framework for system design interviews: requirements, estimates, API, data model, high-level design, deep dives and wrap-up, animated.
question: How do you answer a system design interview question?
answer: Work in time-boxed stages. Clarify functional and non-functional requirements and scope, estimate the load, define the API and data model, draw a simple high-level design, then deep-dive into the parts the interviewer cares about, and finish with bottlenecks and trade-offs. Explain every choice by a requirement or a number.
q: How long should each part of a system design interview take?
a: In a 45-minute round a common split is about five minutes on requirements, a few each on estimates, API and data model, ten on the high-level design, ten to fifteen on deep dives and five to wrap up. Adjust it to what the interviewer steers towards.
q: What do system design interviewers look for?
a: Clear requirements before drawing, numbers that drive decisions, a simple working design first, trade-offs said out loud, and depth in at least one component. They also watch how you take hints and change course.
q: Should I start drawing the architecture immediately?
a: No. Spend the first minutes on requirements and scale. A design drawn before knowing the read-to-write ratio, the latency target or what is out of scope often has to be thrown away.
q: What are common mistakes in system design interviews?
a: Jumping to a design, adding components without a reason, naming technologies instead of explaining them, ignoring failures and trade-offs, and spending all the time on one corner while the end-to-end design stays unfinished.
q: How do I handle a part of the design I do not know?
a: Say what you know, reason from first principles and state the trade-off you would test. Interviewers value a clear line of reasoning more than a memorised product name.
---

A system design round is open-ended on purpose. A fixed order of stages keeps the answer complete and leaves time for depth.

## The stages

1. **Requirements and scope**: functional, non-functional, and what is out.
2. **Estimates**: QPS, peak, storage, bandwidth — see [Back-of-the-Envelope Estimation](/notes/system-design/back-of-the-envelope-estimation).
3. **API**: the few endpoints the features need.
4. **Data model**: entities, keys, and the store each lives in.
5. **High-level design**: boxes and arrows, end to end.
6. **Deep dives**: one or two components in detail.
7. **Wrap-up**: bottlenecks, failures, trade-offs.

@figure timeline

```game
type: order
title: Put the interview in order
prompt: Drag the stages into the order you would run them.
- Clarify requirements and scope
- Estimate QPS, storage and bandwidth
- Define the API
- Sketch the data model
- Draw the high-level design
- Deep-dive into one or two components
- Wrap up with bottlenecks and trade-offs
why: Requirements and numbers decide the design, the API and data shape it, the simple design comes before depth, and trade-offs close it.
```

## Requirements first

- **Functional**: what users can do.
- **Non-functional**: latency, availability, durability, consistency, scale.
- **Out of scope**: say it and write it down.
- Ask about users, scale, read/write mix and the one feature that matters most.

@figure requirements

## API and data model

- One endpoint per functional requirement; method, path, inputs, outputs.
- Page large lists with a cursor.
- Pick each store by how its data is read, not by habit.

@figure api-data

## Build the design up

- Start with client → server → database; check every requirement has a path.
- Add each component only for a reason: a number, a requirement, a failure.
- Name the trade-off as you add it ("a cache makes the feed slightly stale").

@figure grows

## What interviewers listen for

- **Structure**: you lead the conversation through the stages.
- **Reasons**: each box ties to a requirement or a number.
- **Trade-offs**: consistency vs availability, cost vs latency, simplicity vs scale.
- **Depth**: at least one component explained down to data and failure handling.
- **Collaboration**: you check in and take hints.

## Common mistakes

- Drawing before asking: the design answers a question nobody asked.
- Components with no reason: a queue, Kafka or sharding "because scale".
- Product names instead of mechanisms: say what Redis does here, not just "Redis".
- No failures: every box can die; say what happens when it does.
- One corner in depth, the rest unfinished.

```game
type: pick
title: Spot the better move
prompt: Each round is a moment in an interview. Pick what a strong candidate does.
? The question is "Design a chat app". Your first move?
- Draw WebSocket servers and Kafka
* Ask about scale, group chats and message history
> Requirements decide the design; drawing first fixes an answer to an unknown question.
? You want to add Redis. How do you say it?
- "Add Redis, it is fast"
* "Reads repeat 100:1, so cache them; the feed may be seconds stale"
> A component needs a reason and a cost said out loud.
? Twenty minutes in, you are still tuning the database schema.
* Finish the end-to-end design, then return to the schema
- Keep perfecting the schema
> A complete simple design beats one perfect corner.
? The interviewer asks how you would handle a datacenter outage.
- Say the cloud provider handles it
* Explain replication across zones and the failover path
> Failure handling is a deep dive; name the mechanism and its trade-off.
```

## Interview questions

- **What do you do in the first five minutes?** Clarify features, scale, latency and availability targets, and agree what is out of scope.
- **When do you estimate?** Right after requirements, and only the numbers that change a decision.
- **How do you choose what to deep-dive into?** The hardest or hottest part — the read path, the data model at scale — or what the interviewer asks.
- **How do you end?** List bottlenecks and failure modes and what you would improve next.

Next: [Design a Chat App](/notes/system-design/design-a-chat-app) · Before this: [Back-of-the-Envelope Estimation](/notes/system-design/back-of-the-envelope-estimation)
