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
| **3. Submission intelligence** | "Why did I fail" on the workbench verdict: deterministic classes (Phase 1) + failing-case shape + a model explanation behind the provider seam, cached per submission, async | Judge results, Phase 1 classes | `SubmissionAnalysis` |
| **4. Socratic tutor** | Tutor in the workbench with the hint ladder (ask → brute force → complexity → hint → pseudocode → structure → solution), context = statement, constraints, visible cases, code, verdict, prior hints; fact / inference / suggestion labelled; never hidden cases | Assistant streaming, `ProblemEngagement` (tutor reveals count as help) | `TutorTurn` |
| **5. Placement OS** | Target role, date and daily minutes; company/role requirement profiles (admin-seeded); readiness estimate per area; plan regeneration on target change | Phase 1–2, onboarding, tests, interviews, resume | Company profile tables, `User` target columns |
| **6. Debugging** | Timed production-bug format (logs, stack, diff), diagnosis time, explanation scored; debugging skills already measured in Phase 1 | Bug hunts | Columns on `BugSubmission` |
| **7. Interviews** | Interview skills (communication, clarifying questions, complexity) from existing per-question scores into the graph; multi-round company simulations from admin templates | Mock interviews | Simulation template + run tables |
| **8. Career** | Career profile: self-reported / assessed / verified, credentials, readiness, resume; application tracking | Public profile, credentials | `Application` |
| **9. Community** | Cohorts with a shared weekly skill goal and study sessions, learning-only | Community, duels, pair rooms | `Cohort`, `CohortMember` |

## 5. AI: provider seam and cost

- Lift `providerConfig()`/`completeJson()` out of `services/interview-ai.ts` into `lib/ai/provider.ts`, an interface with task-level methods (`explainFailure`, `tutorTurn`, `evaluateInterview`, `planWeek`). NVIDIA stays the one implementation. Plain `fetch` only (CLAUDE.md forbids OpenAI-style SDKs).
- Keep prompts in `src/prompts/<task>/v<N>.md`, loaded once per process like the roadmap lessons. Each stored output records the prompt version.
- Cost: nothing on page load. Scores, plans and readiness are code. Model calls run on explicit actions (open "Why did I fail", ask the tutor), are cached per (submission, prompt version), are rate-limited like `resumeAiLimiter`, and route to a smaller model where structure suffices.
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
- **Still to do in Phase 2:**
  - Spaced-review reminders through the scheduler. A batch job would compute skill profiles for every active account, so it needs a cheaper incremental "due" index first.
  - Ordering roadmap stages by the profile.
  - A swap action for one item (today the only options are skip or undo).
  - Using the target date, once Phase 5 collects it, to shape the day.
