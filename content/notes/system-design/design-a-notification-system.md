---
title: Design a Notification System
order: 18
minutes: 7
level: intermediate
updated: 2026-11-14
seo-title: Design a Notification System: Push, SMS, Email
description: Design a notification system for push, SMS and email: queues per channel, retries with backoff, idempotency keys, user preferences, rate limits and templates.
question: How do you design a notification system?
answer: Services send events to a notification service, which checks the user's preferences, quiet hours and rate limits, renders a template and puts a job on a queue per channel. Workers for push, SMS and email call the providers (APNs/FCM, an SMS gateway, an email service), retry temporary failures with backoff, and use idempotency keys so a duplicate event never notifies twice.
q: Why use a separate queue for each notification channel?
a: Channels fail and slow down independently: an SMS gateway outage should not delay push notifications. A queue per channel lets each set of workers scale, retry and be rate-limited on its own, and absorbs bursts such as a sale announcement sent to millions.
q: How do you avoid sending the same notification twice?
a: Give every event an idempotency key, such as the order id plus the event type. The worker claims the key with an atomic set-if-absent in a store like Redis before sending; a duplicate event finds the key taken and is skipped.
q: How should a notification system handle provider failures?
a: Retry temporary failures, such as timeouts, 5xx answers and 429s, with exponential backoff and random jitter, up to a maximum number of attempts. Permanent failures such as an invalid device token are not retried; they go to a dead-letter queue, and the bad token is removed.
q: What are quiet hours and rate limits in notifications?
a: Quiet hours hold non-urgent notifications during the user's night, in their own time zone, and deliver them in the morning. Rate limits cap how many notifications, usually marketing ones, a user receives per hour or day, so they are not overwhelmed.
q: What is a notification template?
a: A stored message with placeholders, such as Your order {orderId} has shipped, kept per channel and per language. The service fills in the values at send time, so product teams change wording without code changes and every channel stays consistent.
---

A notification system turns events ("order shipped", "new follower", "login code") into push notifications, SMS and emails — once each, on the right channel, at a sensible time.

## Requirements

- **Functional**: send push (iOS/Android), SMS and email; per-user preferences and opt-outs; templates; scheduled and bulk sends.
- **Non-functional**: no lost notifications; no duplicates; urgent ones (login codes) within seconds; bulk campaigns may take minutes.
- **Soft real-time**: delivery is asynchronous; the caller never waits for the provider.

## Capacity estimate

Assumptions: 50 million users; per day 10 million push, 1 million SMS, 5 million email; peak 5× the average.

| Quantity | Working | Result |
| --- | --- | --- |
| Total a day | 10 M + 1 M + 5 M | 16 million |
| Average rate | 16 M ÷ 86,400 s | ≈ 185 / s |
| Peak rate | 185 × 5 | ≈ 925 / s |
| Log storage | 16 M × 500 B | 8 GB a day |

- Bursts (a campaign to every user) matter more than the average: queues absorb them.

## API

```http
POST /v1/notifications
{"userId": "u42", "type": "order_shipped",
 "data": {"orderId": "77"}, "idempotencyKey": "order-77:shipped"}
→ 202 Accepted {"id": "n1"}
```

## Data model

| Table | Key | Fields |
| --- | --- | --- |
| devices | (userId, token) | platform, lastSeen |
| preferences | (userId, type, channel) | enabled, quiet hours, timezone |
| templates | (type, channel, locale) | subject, body with placeholders |
| notification_log | id | userId, key, channel, status, attempts |

## High-level design

- Callers send events; the **notification service** validates, applies preferences, renders the template.
- One [queue](/notes/system-design/message-queues) and worker pool **per channel**, each calling its provider.

@figure channels

```game
type: match
title: Channel to provider
prompt: Match each channel to the service that delivers it.
- iOS push => Apple Push Notification service (APNs)
- Android push => Firebase Cloud Messaging (FCM)
- SMS => An SMS gateway such as Twilio
- Email => An email service such as Amazon SES
why: The system never talks to phones directly; every channel goes through its platform's or vendor's delivery service.
```

## Deep dive: retries and idempotency

- **Temporary errors** (timeout, 5xx, 429): retry with exponential backoff + jitter, capped attempts.
- **Permanent errors** (invalid token, bad address): no retry; dead-letter and clean up.

@figure retries

- Producers and queues deliver **at least once**, so duplicates will happen.
- An **idempotency key** claimed with set-if-absent turns that into exactly one notification.

@figure idempotency

## Deep dive: preferences, quiet hours, rate limits

- Gates run in order; the first refusal wins.
- **Opt-outs** are per type and channel; transactional and security messages are treated differently from marketing.
- **Quiet hours** use the user's time zone; hold, don't drop.
- **Rate limit** marketing per user (see [rate limiting](/notes/system-design/rate-limiting)).

@figure gates

## Templates

- Stored per type, channel and locale: `Your order {orderId} has shipped`.
- Rendered at send time; wording changes need no deploy.
- SMS templates stay short; email has subject + HTML + plain text.

## Bottlenecks and trade-offs

- **Provider limits**: APNs, FCM and SMS gateways throttle; workers must respect their rate limits.
- **Bulk sends** compete with urgent ones: a priority queue keeps login codes ahead of campaigns.
- **SMS costs money** per message; prefer push, fall back to SMS only when needed.
- **Analytics**: log sent, delivered, opened per notification, off the hot path.

## Interview questions

- **Why queues?** To decouple callers from slow providers, absorb bursts and retry without blocking.
- **How do you prevent duplicates?** Idempotency keys claimed atomically before sending.
- **What do you retry?** Temporary errors with backoff and jitter; never permanent ones.
- **How do you respect users?** Preferences, quiet hours in their time zone, and per-user rate limits.

Next: [Design File Storage](/notes/system-design/design-file-storage) · Before this: [Design a News Feed](/notes/system-design/design-a-news-feed)
