---
title: Checkpoint — From requirements to classes
minutes: 30
seo-title: LLD Modelling Quiz: Classes, Relations and Association Classes
description: Practise turning requirements into classes: ten questions on entities, association classes, where rules live and god classes, plus a course registry to code.
q: How do you decide which nouns become classes?
a: A noun becomes a class when the system must remember something about it and it has behaviour of its own, such as a Book or a Course. Nouns that are only a number become fields or constants, and actors who merely call the system stay outside it.
q: When does a link between two objects need its own class?
a: When the link carries facts that belong to neither side alone. A course enrolment with its arrival order, a loan with its due day and a booking with its dates are association classes that both sides point at.
---
This checkpoint covers the whole module: reading a brief for nouns and verbs, association classes, composition versus association, where a rule should live, and keeping the model free of I/O.

**How it works.** Ten questions and one program. You need 70% on the questions and the program accepted to clear the module; retake it as often as you like.

**The program** is a course registry with seats and a waitlist. Before you code, sketch it:

- Which classes hold state? Which one only finds objects and calls them?
- Which class decides between a seat and the waitlist, and who moves in when a seat frees up?
- Which collection keeps a student's courses in code order?

Hidden cases drop students from the waitlist as well as from seats, enrol someone twice and name students and courses that do not exist — the refusals are part of the design, so give each one a single home.
