---
title: Design a Chat App (WhatsApp)
order: 16
minutes: 8
level: intermediate
updated: 2026-11-14
seo-title: Design a Chat App Like WhatsApp: System Design
description: Design a chat app like WhatsApp: WebSockets, presence, message ordering with sequence numbers, sent/delivered/read receipts and offline delivery, animated.
question: How do you design a chat app like WhatsApp?
answer: Keep a persistent WebSocket from every phone to a gateway, route each message through a chat service that numbers it per conversation, stores it and finds the recipient's gateway in a session registry. Deliver over the open socket, or keep it in an inbox and send a push notification when the recipient is offline. Receipts and presence travel as small messages on the same sockets.
q: Why do chat apps use WebSockets instead of HTTP polling?
a: A WebSocket stays open in both directions, so the server can push a message the instant it arrives. Polling either delays messages until the next poll or floods the servers with empty requests from millions of idle phones.
q: How does WhatsApp keep messages in order?
a: The server gives every message the next sequence number of its conversation. Phones sort and display by that number, not by arrival time or the sender's clock, and hold a message whose predecessor has not arrived yet.
q: How do delivery and read receipts work?
a: They are small messages that travel back over the same sockets. The server acks a stored message (sent), the recipient's phone acks receipt (delivered) and acks again when the chat is opened (read); the status only ever moves forward.
q: What happens when the recipient is offline?
a: The message is stored in the recipient's inbox of undelivered messages and a push notification is sent through APNs or FCM. When the phone reconnects it asks for everything after the last sequence number it holds and acks what it receives.
q: How is online or last seen status implemented?
a: The app sends a heartbeat every few seconds, which refreshes a presence key with a time-to-live in a fast store such as Redis. When heartbeats stop, the key expires and contacts see last seen; a friend usually reads it when opening the chat rather than having every change broadcast.
q: How do group chats work in this design?
a: The chat service fans a group message out to every member: online members get it over their sockets and offline members get it in their inboxes. Small groups fan out this way; a cap on group size keeps the cost of one message bounded.
---

A chat app is a real-time messaging system: millions of phones hold open connections, and every message must arrive once, in order, even when the receiver is offline.

## Requirements

- **Functional**: one-to-one and group messages; sent, delivered and read receipts; online / last seen; offline delivery; history on a new device.
- **Non-functional**: low latency (well under a second); no message lost; per-conversation order; highly available.
- **Out of scope** unless asked: voice calls, media processing, end-to-end encryption details.

## Capacity estimate

Assumptions, stated out loud: 100 million daily users, 40 messages each a day, 200 bytes a message.

| Quantity | Working | Result |
| --- | --- | --- |
| Messages a day | 100 M × 40 | 4 billion |
| Average write rate | 4 B ÷ 86,400 s | ≈ 46,000 / s |
| Peak (assume 3×) | 46,000 × 3 | ≈ 140,000 / s |
| Storage a day | 4 B × 200 B | 800 GB |
| Open connections | assume 50 M online at once | 50 M sockets |

- Connections, not bandwidth, are the scaling problem: each gateway holds tens of thousands of sockets.

## API

```text
WebSocket  wss://chat.example/ws          (one per device, kept open)
→ send     {convId, clientMsgId, text}
← ack      {clientMsgId, seq, status: "sent"}
← message  {convId, seq, from, text}
→ receipt  {convId, seq, status: "delivered" | "read"}
GET /conversations/{id}/messages?afterSeq=40   (sync after reconnect)
```

## Data model

| Table | Key | Fields |
| --- | --- | --- |
| messages | (convId, seq) | senderId, body, createdAt |
| conversations | convId | members, lastSeq |
| inbox | (userId, convId, seq) | undelivered pointers |
| sessions | userId | gatewayId (in memory, with TTL) |

- Partition `messages` by `convId`: one conversation's history is one range read. A wide-column store (Cassandra, HBase) suits this write-heavy, append-only shape.

## High-level design

- **Gateways** hold WebSockets and nothing else, so they scale out freely.
- **Chat service** numbers, stores and routes each message.
- **Session registry** maps user → gateway, so any gateway can reach any user.

@figure websocket-route

## Deep dive: receipts and ordering

- The client sends a `clientMsgId`; a resend with the same id is ignored, so retries never duplicate a message.
- **Order comes from the server's `seq`**, never from phone clocks.

@figure receipts

@figure ordering

## Deep dive: offline delivery and presence

- No live socket → store in the inbox, send a push via APNs / FCM. The push is a wake-up, not the delivery.
- On reconnect: "everything after seq N", then ack.

@figure offline

- Presence is a heartbeat plus a key with a time-to-live — no database writes per beat.

@figure presence

```game
type: order
title: Follow one message to an offline friend
prompt: Put the steps in the order the system runs them.
- The phone sends the message over its WebSocket
- The chat service assigns the next sequence number
- The message is written to the messages store and the sender gets "sent"
- The session registry shows no live socket for the recipient
- The message goes to the recipient's inbox and a push is sent
- The recipient reconnects and syncs everything after their last seq
why: Number and store first so nothing can be lost or reordered; only then look for the recipient, falling back to the inbox and a push.
```

## Bottlenecks and trade-offs

- **Gateway failure** drops its sockets; phones reconnect elsewhere and sync by seq, so nothing is lost.
- **Hot groups**: fan-out per member grows with group size — cap it, or use pull for very large channels.
- **Ordering across conversations** is not needed; one counter per conversation avoids a global bottleneck.
- Pass routing traffic through a [message queue](/notes/system-design/message-queues) when the chat service and gateways must scale separately.

## Interview questions

- **WebSockets or long polling?** WebSockets: one open, two-way connection per device; long polling is the fallback for networks that block them.
- **How do you guarantee order?** A per-conversation sequence number assigned by the server; clients display by it and hold gaps.
- **How do you avoid duplicates on retry?** A client-generated message id, deduplicated by the server.
- **Where is a message while the friend is offline?** In their inbox in durable storage; the push only wakes the phone.

Next: [Design a News Feed](/notes/system-design/design-a-news-feed) · Before this: [System Design Interview Framework](/notes/system-design/system-design-interview-framework)
