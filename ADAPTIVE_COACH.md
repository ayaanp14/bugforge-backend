# Adaptive coach and placement OS: architecture

The plan for turning CodeKairo from a practice platform into a system that knows where a student is, decides what they should do next, and measures whether they are getting interview-ready. It starts from an audit of what exists (2026-10-07), proposes how the new layers sit on it, and records what Phase 1 (skill intelligence) shipped.

The guiding constraint is the codebase's own: **progress is derived from the rows that already exist, never kept as counters.** The roadmap, interview credits, the onboarding plan and the entitlements all work this way. The adaptive layer follows suit: the only new table Phase 1 needs is one that records something no existing row knows.

---

## 1. What exists today

| Concern | Where it lives | Notes for the adaptive layer |
| --- | --- | --- |
| Stack | Express 5 + Prisma 7 on MySQL (one EC2 box); Vite + React 19 SPA on Cloudflare | Loopback DB (~3 ms a query): per-user computation in process is cheap |
| Auth | `lib/auth-session.ts`, `middleware/auth.ts` (`requireAuth`) | Every new read is `requireAuth` and scoped by `req.user.userId` |
| Student profile | `User.goal / level / goalDetails / onboardedAt` (`lib/onboarding.ts`) | Target companies, language and level already asked on `/welcome` |
| Problems and skills tagging | `Problem.tags` (topics + companies in one JSON list), `lib/problem-topics.ts` (55 topic hubs, `TOPIC_ORDER`), `lib/companies.ts` | The topic tags *are* the DSA skill vocabulary |
| Attempts | `Submission` (verdict, passed/total cases, runtime, `roomId`), `ProblemSolve`, `ProblemTimer` (manual stopwatch, opt-in) | Rich enough for accuracy, persistence, failure class; no record of help used |
| Hints / editorial | `GET /api/problems/:slug/hints`, `/editorial` (shared-cached, no per-user record) | **Gap:** independence cannot be measured without a new record |
| Debugging | Bug hunts: `BugChallenge` (category, tags), `BugSubmission` (verdict, tests, `timeTakenSecs`) | 312 hunts with tags like Security, Validation, State, Overflow |
| SQL | `lib/sql-problems/` (specs in code, topics), `SqlSubmission`, `SqlSolve` | |
| Aptitude | `AptitudeQuestion` (category, topic, difficulty, `timeTargetSec`), `AptitudeAttempt` (correct, `timeSec`, `usedHints`) | Time and hints are client-reported |
| Assessments | Placement tests (`MockTest`/`MockAttempt`, proctored), skill tests (`SkillTest`/`SkillAttempt` with `topicScores`, proctored, credentials) | Skill tests are the one supervised measure of CS fundamentals |
| Interviews | `MockInterviewSession` + `MockInterviewQuestion` (score, verdict, missed points, topic), voice round with camera | Interview performance already scored per question |
| Roadmap | Seeded stages; standing derived from `Submission` (`services/roadmap.ts`); ~36 lessons with computed figures | The fixed syllabus the adaptive layer will reorder, not replace |
| Plans | Language study plans (`StudyEnrollment`, pace); onboarding "Your plan" (3–5 derived steps per goal) | "Your plan" is the seed of the daily mission |
| Resume | ATS analyzer: parse, deterministic scoring, model review, versions | Career profile input |
| Company data | Company tags on 320+ problems, 30 placement-test patterns, interview experiences, company hubs | Data-driven already; no per-role requirements |
| AI | NVIDIA Nemotron over plain `fetch` (`services/interview-ai.ts` `providerConfig()` / `completeJson()`), reused by the assistant and the resume analyzer; Gemini Live for voice | One provider in practice, but already behind a small seam |
| Scheduling, notifications, push | `lib/scheduler.ts` (JobRun locks), `services/reminders.ts`, Web Push | Review reminders can ride this |
| Analytics | `AppEvent`, `ErrorReport`, admin Analytics tab, traffic sources | Outcome metrics have a home |

**Reusable as is:** the judge pipeline, every attempt table, the topic vocabulary and its learning order, the onboarding goal, the roadmap and its lessons, the assessment engines, interview scoring, the scheduler, the cache layer (`cached`/`cachedShared` + `invalidateDashboard`), the composed-payload dashboard rule, the design system.

**Technical debt that touches this work:**
- Topics and companies share one `tags` column. It works because `COMPANY_TAGS` separates them; the skill graph reads topics through `TOPIC_HUBS` and ignores the rest.
- Aptitude time and hint counts come from the client and can be forged. The bug-hunt `PASS` output can also be forged (a known open issue, see CLAUDE.md). Both feed scores, so both are noted as limits rather than trusted blindly.
- The problem timer is a manual stopwatch, so it cannot measure solve time. Phase 1 measures from the first opening instead.
- AI calls are spread across three services with inline prompts. The provider seam exists (`providerConfig`), but prompts are not versioned.

## 2. What is missing

1. A **skill model**: no per-skill estimate exists, only "solved / available per tag" on the dashboard (activity, not skill).
2. Evidence of **independence**: whether hints or the editorial were seen before a solve.
3. **Retention**: nothing schedules a review or notices forgetting.
4. **Why it failed**: verdicts are shown raw; nothing classifies or tracks mistakes.
5. A **daily mission** that adapts to time available, weakness and schedule.
6. **Company and role requirements** as data (which skills a role needs, at what level).
7. A **readiness** estimate that combines DSA, fundamentals, interviews and the resume.
8. A **verified career profile** that tells self-reported claims from assessed and verified ones.
9. **Cohorts.**

## 3. Proposed architecture

```
Evidence (existing tables + ProblemEngagement)
   │  services/skill-profile.ts — gathers, no writes
   ▼
Skill intelligence (pure)            lib/skill-graph.ts   what is measured, prerequisites
   lib/skill-score.ts                one skill: mastery, confidence, reviews, weak spots
   lib/skill-profile.ts              the graph: areas, focus, changes, mistakes, recs
   ▼
Planning (Phase 2, pure + one table)  lib/mission.ts      today's items from the profile + goal + time budget
   ▼
Feedback (Phase 3–4, AI behind a seam)  lib/ai/provider.ts, prompts/<task>/vN.md
   ▼
Readiness (Phase 5, pure)             lib/readiness.ts    skills × company/role requirements → estimate
   ▼
Surfaces: /skills, the home dashboard, the workbench verdict, reminders, the career profile
```

**Rules every layer follows:**
- **Pure core, thin service.** Scoring, planning and readiness are pure functions of plain records plus `asOf`, pinned by tests. Services only read rows and cache the result. This is the pattern of `lib/onboarding-plan.ts`, `lib/roadmap.walk()` and `lib/resume-scoring.ts`.
- **Time travel instead of snapshots.** Any past state is the same function with an earlier `asOf`, so "what changed and why" needs no history table.
- **Deterministic first.** Counting, rates, schedules and recommendations are code. An LLM writes natural-language feedback on top of facts the code computed, never the facts themselves (a score, a count, a "line 17 is wrong" the code does not support).
- **Content as code, seeded when it needs editing.** The skill graph is code like the topic hubs. When administrators need to edit it, company requirements, or scoring weights without a deploy, the roadmap's path applies: authored file → seed script → tables → admin tab.

### Mapping the proposed entities onto what exists

| Proposed | Here |
| --- | --- |
| StudentProfile | `User.goal/level/goalDetails` (Phase 5 adds target date, graduation year, daily minutes) |
| Skill, SkillCategory, SkillDependency | `lib/skill-graph.ts` (code; seedable later) |
| StudentSkill, SkillEvidence | Derived by `lib/skill-score.ts` from attempt rows; nothing stored |
| ProblemSkill | `Problem.tags` through `skillsForProblemTags` |
| ProblemAttempt, Submission | `Submission`, `BugSubmission`, `SqlSubmission`, `AptitudeAttempt` |
| SubmissionAnalysis, Mistake | Phase 1: verdict-based classes (derived). Phase 3: `SubmissionAnalysis` table for model-written explanations (worth storing: costly to produce) |
| LearningResource | Roadmap lessons, CS notes, study-plan lessons, topic hubs (already linked from skills via `href`) |
| DailyMission, MissionItem | Phase 2: one `MissionDay` row (date, minutes chosen, item list, item completion). The chosen time is a fact no other row holds |
| Recommendation | Derived (`recommendFor`); impressions logged as `AppEvent` for outcome analysis |
| StudyPlan | Language study plans + onboarding "Your plan" (merge into the mission rather than adding a third plan) |
| Company, CompanyRole, CompanySkillRequirement, CompanyAssessment, CompanyInterviewTemplate | Phase 5: seeded tables from `scripts/company-profiles/`, joined to the existing `COMPANY_TAGS`, placement-test patterns and interview configs. No claims about real hiring processes beyond sourced facts |
| Assessment, AssessmentAttempt | `MockTest`/`SkillTest` and their attempts |
| Interview, InterviewEvaluation | `MockInterviewSession`/`MockInterviewQuestion` |
| DebuggingChallenge, DebuggingAttempt | `BugChallenge`/`BugSubmission` (Phase 6 adds diagnosis time, first-meaningful-change and explanation) |
| CareerProfile | Public profile + credentials + the skill profile's verified parts (Phase 8) |
| Resume | `Resume` and its analyses |
| Application | Phase 8 |
| Cohort, CohortMember | Phase 9 |

## 4. Phases

| Phase | Scope | Builds on | New storage |
| --- | --- | --- | --- |
| **1. Skill intelligence** (shipped 2026-10-07) | Skill graph, scoring engine, evidence including hints and editorial, reviews, weak spots, mistake mix, focus lists, `/skills` | Attempt tables, topic hubs | `ProblemEngagement` |
| **2. Adaptive learning** (mission shipped 2026-10-07) | Daily mission (time budget 30/60/90/120/custom) from focus + reviews + goal; spaced-review reminders via the scheduler; the home dashboard leads with the mission; roadmap stages ordered by the profile | Phase 1, "Your plan", reminders | `MissionDay` |
| **3. Submission intelligence** (built 2026-10-07) | "Why did I fail" on the workbench verdict: the judge's facts read deterministically + a model review behind the provider seam, written on every failure in the background, stored per submission | Judge results, Phase 1 classes | `SubmissionAnalysis` |
| **4. Socratic tutor** (built 2026-10-07) | Tutor in the workbench with the hint ladder (ask → brute force → complexity → hint → pseudocode → structure → solution), context = statement, constraints, visible cases, code, verdict, prior hints; fact / inference / suggestion labelled; never hidden cases | Assistant streaming, `ProblemEngagement` (tutor reveals count as help) | `TutorTurn` |
| **5. Placement OS** (readiness built 2026-10-07) | Target role, date and daily minutes; company/role requirement profiles (admin-seeded); readiness estimate per area; plan regeneration on target change | Phase 1–2, onboarding, tests, interviews, resume | Company profile tables, `User` target columns |
| **6. Debugging** | Timed production-bug format (logs, stack, diff), diagnosis time, explanation scored; debugging skills already measured in Phase 1 | Bug hunts | Columns on `BugSubmission` |
| **7. Interviews** | Interview skills (communication, clarifying questions, complexity) from existing per-question scores into the graph; multi-round company simulations from admin templates | Mock interviews | Simulation template + run tables |
| **8. Career** | Career profile: self-reported / assessed / verified, credentials, readiness, resume; application tracking | Public profile, credentials | `Application` |
| **9. Community** | Cohorts with a shared weekly skill goal and study sessions, learning-only | Community, duels, pair rooms | `Cohort`, `CohortMember` |

## 5. AI: provider seam and cost

- Lift `providerConfig()`/`completeJson()` out of `services/interview-ai.ts` into `lib/ai/provider.ts`, an interface with task-level methods (`explainFailure`, `tutorTurn`, `evaluateInterview`, `planWeek`). NVIDIA stays the one implementation. Plain `fetch` only (CLAUDE.md forbids OpenAI-style SDKs).
- Keep prompts in `content/prompts/<task>/v<N>.md` (shipped in the image beside the handbook), loaded once per process by `lib/ai/prompts.ts`. Each stored output records the prompt version. *(As built in Phase 3: `lib/ai/provider.ts` is a generic `json(messages, schema, …)` over `completeJson`, not task methods — a task's shape lives in its own lib module.)*
- Cost: nothing on page load. Scores, plans and readiness are code. Model calls are cached per (submission, prompt version) and route to a smaller model where structure suffices. *Changed by decision on 2026-10-07: the failure review runs on **every** failed submission, unlimited on every plan, rather than on an explicit "explain" click; the brakes are the execution limiter that already caps submits (30/min), a bounded queue and reuse of an earlier review of identical code.*
- Untrusted input (student code, resumes) goes in fenced, with the injection notice the resume analyzer already uses. Outputs are checked against computed facts before display (the resume `guardSuggestion` pattern).

## 6. Risks

- **The weights are judgement, not fit.** Version 1 is a transparent formula with no ground truth behind it. Calibrate against outcomes the platform already observes: mock-interview scores and placement-test results against skill estimates taken a week before. Change weights only with that evidence, and bump `SCORING_VERSION`.
- **Gaming.** Every item counts once, the Easy cap holds, and editorial-first solves cap at 30. Still trusted from the client: aptitude timing, and whether hints were opened (a member can choose not to report it by blocking the request). Bug-hunt output can be forged. Solving signed out and pasting signed in is not detectable.
- **Evidence starts today.** Help and timing are recorded from 2026-10-07, so earlier solves read as unassisted and untimed, which flatters long-time members slightly. The page says so.
- **Sparse domains.** CS fundamentals come only from proctored skill tests, so most accounts show nothing there. That is honest, but it needs more evidence sources before readiness can lean on it (Phase 5: aptitude core-CS questions tagged by subject).
- **Overlapping plans.** The onboarding "Your plan", the roadmap and the study plans already tell people what to do. Phase 2 must merge them into the daily mission, not add a fourth list.
- **Dashboard design.** The home was redesigned on 2026-10-05 after two rejected attempts. Put the mission into the existing timeline after review, not as a new layout.
- **Load.** The profile is computed per account in process (about 10 ms for an account with thousands of rows, 1-minute L1 cache). It is fine on one instance. Past that, move it to `cachedShared` or compute incrementally per verdict.

## 7. Phase 1 as shipped

- **Graph** — `lib/skill-graph.ts`: 81 skills in 5 domains and 17 areas.
  - 55 DSA skills, one per topic hub, with prerequisites that respect `TOPIC_ORDER`.
  - 9 debugging skills: bug families from hunt tags, plus the three layers.
  - 8 SQL topics.
  - 4 CS fundamentals (skill tests only).
  - 5 aptitude sections.
  - `skill-graph.test.ts` holds it to the topic hubs and the authored catalogue, and checks it is acyclic.
- **Engine** — `lib/skill-score.ts`, model and constants in its header:
  - **Quality:** each solve is credited for independence × persistence.
  - **Depth:** saturates against a catalogue-sized target, with Easy points capped.
  - **Ceiling:** set by the hardest solve made without the editorial (55, 85, 100; 30 if every solve came after it).
  - **Performance:** accuracy, independence, first try and pace.
  - **Retention:** a review ladder of 2, 7, 21, 45 and 90 days; retention can take at most a quarter off a skill.
  - **Assessments:** skill-test sittings blend in by confidence; a sitting closed by the proctor is excluded.
  - **Mistakes:** failures classed from verdicts, with near-miss wrong answers (75%+ of cases passed) filed as edge cases.
- **Profile** — `lib/skill-profile.ts`:
  - Areas and domains, weighted by catalogue size.
  - Prerequisite gaps.
  - Focus lists: weakest, building, ready, due and strongest.
  - Changes over 7 days with reasons, from `asOf` time travel.
  - Activity kept apart from skill.
  - Mistake mix and recommendations.
- **Service and API** — `services/skill-profile.ts`:
  - Seven reads, 1-minute cache, dropped by `invalidateDashboard`.
  - `GET /api/me/skills` and `GET /api/me/skills/:key` (`routes/skills.ts`).
  - `POST /api/problems/:slug/engagement` writes `ProblemEngagement`, first times only.
- **SPA:**
  - `/skills` (`pages/SkillsPage.tsx`, `components/skills/`).
  - The workbench notes open, hints and editorial (`lib/problem-engagement.ts`) from the queries its panels already make.
  - Linked from the home's Skills section and Ctrl+K.
- **Also updated:** the handbook ("Skill profile", 4 assistant questions pinned), the privacy policy (effective 7 October 2026), and the account export (now includes engagement).
- **Tests:** `skill-graph.test.ts`, `skill-score.test.ts`, `skill-profile.test.ts`, 33 in all.

## 8. Phase 2 as shipped (today's mission)

- **What it is:** the home's first stop. The item to do now is set large, the whole day is listed under it, and "Your plan" is folded into one line underneath. It replaces both the old "continue solving" stop and the separate "Your plan" stop, so there is still one list of things to do rather than two. The old continue-solving view remains as the fallback when a mission cannot be built.
- **Rules:** `lib/mission.ts`, a pure module tested by `mission.test.ts`.
  - The number of items a day holds depends only on the time chosen (`slotsFor`), so the page can draw the rows before the data arrives.
  - The time then steers which items are picked.
  - Each day's list is frozen in `MissionDay` the first time it is built.
  - Whether an item is done is read from the evidence; the only manual marks are "read this tutorial" and skips.
- **Service:** `services/mission.ts` runs inside the dashboard build (`mission` on `dash:v5`). The two writes are `PUT /api/me/mission` (the time) and `POST /api/me/mission/items/:id` (tick, skip, undo).
- **New storage:**
  - `MissionDay`, one row per account per day.
  - `User.dailyMinutes`, the default time for each new day, also sent on `/api/me`.
- **Up next:** no longer repeats a problem the mission already lists.
- **Verified:** `e2e/dashboard-loading.spec.ts` passes 36 of 36 (every home band holds its height through all three loading moments at 390, 1024 and 1440 px), with the plan band folded into Today and the account's time pinned to 60 minutes.
- **Review reminders (added the same day):** the `review_due` job (16:00–18:00 IST, in-app and push, at most every three days) reads `ReviewDue`, an index the skill profile writes whenever it is computed. A review date moves only when an attempt lands, so the job recomputes only accounts with an attempt newer than their row. That makes "who has a skill due" one indexed query plus four grouped MAX queries per batch, not a profile per account.
- **The roadmap, read against the profile (added the same day):** `lib/roadmap-route.ts`.
  - **Open ahead:** a stage whose every skill is strong lets the road open past it while uncleared. Clearing and the chests are unchanged.
  - **Front of the road:** the map starts at the first open stage the reader is not strong in.
  - **Route:** the order to work in, under *Where you are* (reviews, the front, slipped stages, a skipped stage still to clear).
  - **Recommended next:** each stage marks the problem to do next.
- **Still to do in Phase 2:**
  - A swap action for one item (today the only options are skip or undo).
  - Using the target date, once Phase 5 collects it, to shape the day.
  - Covering reviews of aptitude, SQL and debugging skills in the mission. Today it lines up coding reviews only, and the reminder links other kinds to the skill profile.

## 9. Phase 3 as shipped ("Why it failed")

- **Decisions (the owner's, 2026-10-07):** a review on every failed coding submission, unlimited for everyone. Guardrail added: no model review in ranked play — today's daily contest problem, a live duel, a Battles contest or knockout get the deterministic layer only (`reason: "contest" | "duel"`), because it is help the other competitors do not get.
- **Two layers, both stored on one `SubmissionAnalysis` row** (PK = `submissionId`, cascades with it):
  - **Deterministic** — `lib/failure-analysis.ts` `analyzeFailure`, pure and pinned by `failure-analysis.test.ts`. Reads only what the judge already reported: verdict, passed/total, runtime against the limit, the error output (`readError` — the recognised failure, its line, a hint; `firstCompileError`), and the statement's `### Constraints` (`constraintsOf` → `targetComplexity`, the slowest complexity those sizes allow; inputs ≤ 25 never blame complexity for a timeout — that is a loop that never ends). Every finding is labelled `fact` (the judge said so), `inference` or `suggestion`. Written synchronously when the row is created, so the panel has it a moment after the verdict.
  - **Model review** — `lib/submission-review.ts` builds the messages (statement, ≤ 3 *visible* examples, numbered code, verdict and counts, ≤ 2 KB of error, the deterministic facts), each untrusted part fenced between BEGIN/END markers its own text cannot forge. Prompt `content/prompts/submission-review/v1.md`: teach, don't solve; never claim knowledge of hidden cases; a line only when that line is the problem; nine categories (the five verdict classes + MISREAD_PROBLEM, DATA_STRUCTURE_SELECTION, ALGORITHM_SELECTION, PREMATURE_OPTIMIZATION); confidence. `guardReview` holds the answer to the rules: lines that exist, no `fact` from the model, at most four findings, code blocks stripped to a one-line snippet, complexity only as one Big-O expression (`bigO`, else the constraints' own target), a leading "Line N" dropped where the line field carries it.
- **Runner** — `services/submission-analysis.ts`, the resume analyzer's pattern: `noteFailedSubmission` (called fire-and-forget from `/submit` after the duel settles) inserts the row `queued` or `skipped`; an in-process queue (`SUBMISSION_REVIEW_CONCURRENCY`, default 3; cap 500, past it `reason: "busy"`) claims rows; `recoverSubmissionAnalyses` at boot re-queues rows younger than an hour. Identical code (`codeHash`) on the same problem under the same prompt version reuses the earlier review (`reason: "reused"`) instead of calling the model.
- **Recommendation** on the same row: the problem's weakest skill on the profile, `recommendFor` excluding this problem, and the roadmap lesson for its hub.
- **Read** — `GET /api/me/submissions/:id/analysis` (`routes/analysis.ts`), owner only (anyone else gets the same 404 as a missing id); a failure from before the feature, with no row, reads `pending` for two minutes after judging and 404 after (the panel then draws nothing), so it never polls for ever.
- **Back into the profile** — `loadEvidence` reads the last 31 days of reviews: `mistakes.causes` ("What the reviews found" on `/skills`) and a `repeat_mistake` indicator when the reviews name the same cause in ≥ 2 problems of one skill.
- **SPA:**
  - A **Code Review** tab beside Testcase and Test Result (the owner's ask), present from a failed submit until an accepted one or another problem. A verdict still opens Test Result, which carries a one-line summary and an "Open the code review" button. The same `components/problems/FailureAnalysis.tsx` draws in the Submissions tab's detail dialog. It polls every 1.5 s while the review is being written, and stops after 2 minutes.
  - The Fact / Likely / Try labels come from `lib/failure-analysis.ts`.
  - The complexity line shows only when speed was the failure, phrased as "aim for X or better".
- **Also updated:**
  - The handbook: "Why it failed", plus 4 pinned assistant questions.
  - The privacy policy: AI models, what is kept, private-to-you, and that AI output is practice.
  - The account export (`coding.failureAnalyses`).
- **Verified:**
  - `failure-analysis.test.ts` and `submission-review.test.ts` (15 tests).
  - A live model smoke run (`scratch/analysis-smoke.mts`): reviews in 1.5–6 s.
  - `e2e/failure-analysis.spec.ts`: a wrong Two Sum shows the facts, then the review; another account gets 404.
- **Not yet:**
  - Bug hunts and SQL problems (their judges report differently).
  - A "was this useful?" signal.
  - Calibrating the categories against what the student changed next.
  - Admin visibility of review volume and cost.

## 10. Phase 4 as shipped (the tutor)

- **Where:** a Tutor tab in the workbench's reading panels, and a floating graduation-cap button that opens the same conversation in a window (the owner's ask: "like the AI assistant", its icon animated like the daily contest's flame). Signed-in members, every plan, unlimited (20 a minute burst).
- **The ladder** (`lib/tutor.ts`, pure, `tutor.test.ts`): Questions, Approach, Complexity, Hint, Pseudocode, Structure, Solution.
  - The tutor answers at the rung reached and never above it.
  - Only "More help" climbs, one rung at a time; a rung never goes down (`ProblemEngagement.tutorRung`).
  - What the model is *given* grows with the rung: the problem's hints from Hint, the editorial from Pseudocode, a reference solution from Structure. A model that holds the trick leaks it; one that was never given it cannot.
  - `codeGate` holds fenced code back while the answer streams below Pseudocode, and lets only plain-text fences through at Pseudocode. The prompt asks for the same, but the gate is what enforces it.
  - First live run: rung 0 still slipped a "(Hint: …)" aside, so asides and the word "Hint" are now named in the rung's rules and in the prompt.
- **Help accounting:** rung 0 costs nothing; 1–3 count as hints, 4–6 as the editorial (`tutorHintAt`, `tutorSolutionAt`). The skill profile folds them into the times it already scores, so help reached after the solve is free, as with hints.
- **Context:** the statement, up to 3 visible examples, the student's current editor code (they can untick sharing), and the last submission with its review. Never the hidden test cases.
- **Off in ranked play:** today's contest problem, a live duel, a live Battles round or knockout match on this problem.
- **Storage:** `TutorTurn` (role, rung, content, model, prompt version). Clear deletes the rows; the rung stays.
- **Streaming:** `ai.stream` in the provider seam, with retries until the first token. The SPA reads it with `lib/sse.ts`.
- **Verified:**
  - `tutor.test.ts` (9 tests).
  - A live smoke run (`scratch/tutor-smoke.mts`, `tutor-rung0.mts`): first token in 0.3–0.6 s, a skip refused, the climb recorded.
  - `e2e/tutor.spec.ts`.
  - 4 assistant questions pinned.
- **Deviation from the plan:** findings are not labelled fact / inference / suggestion. A chat turn is prose; the prompt asks for "probably" where the tutor infers, and forbids claims about hidden tests.
- **Not yet:**
  - Hint usage of the tutor in the mission's choice of items.
  - Bug hunts and SQL problems.
  - A per-turn "was this useful?" signal.

## 11. Phase 5 as shipped (placement readiness)

- **What it is:** `/readiness` shows how much of what a target company asks the account has shown here, area by area, with what to do next. It is an estimate of evidence, not a prediction.
- **Company facts are only sourced ones.** The 27 test patterns already seeded for placement tests carry `sourceNote`s and section blueprints, and the catalogue carries company tags. No new company tables were needed: the patterns *are* the requirement profiles for the online assessment, and the tags give the coding topics. Nothing claims how a company runs its later rounds.
- **The model** (`lib/readiness.ts`, `readiness.test.ts`, 9 tests). Five areas, each with a score, a confidence, a status, its parts and next actions:
  - **Online assessment:** the pattern's sections read against exactly the skills they draw from, with a graded sitting from the last 90 days blended in at half.
  - **Coding rounds:** the company's tagged topics, weighted by how many of its problems use each.
  - **CS fundamentals:** from skill tests only.
  - **Interview practice:** the last 3 sat interviews.
  - **Resume:** the latest analysis, with more confidence when it was aimed at this company.
  - **Weights:** set by company family, as judgement. With no evidence an area scores 0 and reads "unknown".
- **Target:** `User.targetCompany / targetTest / targetDate`, saved from the page. Looking at another company never changes the saved target. The days left and the hours (at the daily minutes) come from the date.
- **Verified:**
  - A smoke run on local data (`scratch/readiness-smoke.mts`, `readiness-richest.mts`): 15–20 ms warm.
  - `e2e/readiness.spec.ts`, axe included.
  - 3 assistant questions pinned, plus an alias for "ready" (TCS appears on every placement chunk).
- **The mission reads the target (added the same day; the rest of Phase 5).**
  - **Which area:** readiness's areas below ready, ordered by weight × room left (`areasByGain`, the order the page's "Do these next" uses). Each area now carries `gaps`, its skills below ready with the most to gain first, so the mission reads skills rather than links.
  - **Where in the day:** within 30 days of the drive date, the area's item comes straight after an unfinished draft, ahead of reviews, and a second one follows the weakest skill. Further out, or with no date, it is one item after the plan step.
  - **Items, best first, per area:**
    - Assessment: the full mock, then the paper's weakest aptitude section (ten questions), then the company's weakest topic.
    - Coding: the company's two weakest topics, with its own problems first in each.
    - Fundamentals: the next skill test (the level above any credential, out of its cooldown), then that subject's notes.
    - Interview practice: a mock interview.
    - Resume: a resume check.
  - **The fixed row count decides what fits.** A big step goes on the day only if it, plus an Easy problem for every other slot, fits the time left (`holds`). So the hour-long mock needs a two-hour day, and the 45-minute skill test a 90-minute one. On a shorter day the area's smaller item stands in. `slotsFor` and `MAX_PER_SKILL` are unchanged, and `e2e/dashboard-loading.spec.ts` still holds.
  - **Ticks stay derived.** A new evidence kind, `{ activity, ref }`, is done when the matching row exists for the day (IST):
    - a graded sitting of the pattern;
    - 10 different questions answered in the aptitude category;
    - a closed skill-test sitting;
    - a sat interview;
    - a resume analysis that hasn't failed.
  - **No duplicates or pre-ticked items:** something already done today is never set as an item, and an activity item and the plan step it covers never share a day. The mock is not offered again within 14 days of a graded sitting.
  - **Changing the target** re-picks today's undone items (`repickMissionToday`, the same keep-what-is-done rule as changing the minutes).
  - **On the home:** one line in Today, for example "TCS readiness 46% · 18 days left · getting close", opening `/readiness`. It is `readiness` on `dash:v6`. `targetCompany` on `/api/me` (`me:v4`) tells the loading shell to keep room for the line. Readiness is read once per dashboard build, and only for accounts with a target.
  - **Verified:**
    - `mission.test.ts`, with 10 new target tests.
    - `readiness.test.ts`, with `gaps` and `areasByGain` pinned.
    - Smoke runs on local data: `scratch/target-mission-smoke.mts` (the day at 30, 60, 120 and 240 minutes, with and without a date) and `scratch/target-mission-tick.mts` (nine answers leave the item to do, the tenth ticks it).
    - 2 assistant questions pinned.
- **Not yet:**
  - Graduation year.
  - An admin view of targets.
  - Aptitude, SQL and debugging reviews as mission items. Only the target's aptitude section reaches the day today.

## 12. Phase 7 as shipped (interview skills and company simulations)

- **Decisions (the owner's, 2026-10-07):**
  - A simulation for every company with a seeded test pattern (22).
  - The HR round is written or voice, as the candidate chooses when starting a run.
  - Each interview round counts toward the weekly allowance like any other mock interview.
- **Interview skills (`lib/interview-skills.ts`, `interview-skills.test.ts`).** A survey of the real rows found that a question's `topic`, `focusArea` and `expectedSkills` are free text the model writes, with almost no value repeating. Only the round (`roundId`) and the focus ids are a fixed vocabulary.
  - **Classification:** the round decides which of four skills a question counts toward: coding, technical, system design, behavioural/HR. The question's words override the round only when they plainly say behavioural, design or coding.
  - **Scoring:** each sat round enters the scorer as an assessment record per skill, the way CS fundamentals come from skill tests. A question scores 0–10, read here as ×10; the interview's difficulty sets the scorer's level.
  - **The graph:** a new `interview` domain (85 skills in all).
  - **Communication is not a skill:** the interviewer gives each question a single score, so there is nothing to separate it by.
- **Readiness reads them.** The interview area (`READINESS_VERSION` 2) now weights the interview skills by the company's simulation rounds, instead of averaging the last three sessions' overall scores. Family defaults apply where a company has no simulation, and the area's first next action is "Run the … simulation".
- **Company simulations.**
  - **Content:** `lib/simulations/catalog.ts`, content as code with no seed.
    - Each template's first round is the company's seeded test pattern, followed by the interview rounds in its published order.
    - Each carries `firmness` (official, consistent or varies), a `sourceNote` and `sources`.
    - Researched from company careers pages where they exist (Amazon, Microsoft, ZS; Goldman, Adobe and Salesforce describe their process in general terms); otherwise from prep portals that agree.
  - **Standing rules,** stated in the catalog's header:
    - A combined interview is listed as its parts.
    - A round only GeeksforGeeks' templated page lists is left out and named.
    - What the pattern does not reproduce is named.
    - Team matching is not a round.
  - **Thin sources:** Apple, Salesforce and Morgan Stanley, plus Wipro and Deloitte where the sources disagree. Each says so on its page.
- **Runs (`lib/simulation-run.ts`, `simulation-run.test.ts`).** `SimulationRun` stores only which rounds were opened, when, and each interview round's saved setup. Everything else is derived:
  - **Assessment round:** the first sitting of its pattern that started after the round opened.
  - **Interview round:** the newest session of its own setup.
  - **Order:** rounds open in order, with no cut-off, because no company publishes one.
  - **Interview rounds** are ordinary mock interviews. Their setup names the company in its role, which both interviewers read as written, so no prompt changed. These setups are hidden from the saved-setups list, its cap and the dashboard count.
  - **Ways back:** the test result and the interview report link back to the run.
- **Verified:**
  - `simulation-run.test.ts` (8 tests), `simulations.test.ts` (5) and `interview-skills.test.ts` (8); readiness tests updated.
  - `scratch/simulation-smoke.mts` against the dev API: the order is refused out of turn, a second start returns the live run, and a real interview started with the model asking its first question.
  - `e2e/simulations.spec.ts`.
  - Screenshots in light and dark at desktop and phone width.
  - 3 assistant questions pinned.
- **Not yet:**
  - The mission does not offer a simulation's next round. Its interview item is still "Mock interview".
  - The written and voice prompts are unchanged, and only the role carries the company. A company-specific brief, such as "ask what a TCS HR round asks", would be a prompt v-next for both interviewers.
  - Companies without a seeded pattern have no simulation, because there is no sourced first round.
  - An admin view of runs.
