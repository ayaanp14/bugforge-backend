# Adaptive coach — handoff for the next session

Written 2026-10-07 at the end of the session that built Phases 1–5. Read this, then `ADAPTIVE_COACH.md` (§§7–11 are what shipped, with the reasoning), then the matching paragraphs of the root `CLAUDE.md`: **Skill profile**, **Today's mission**, **Why it failed**, **The tutor**, **Placement readiness**.

## 1. Where things stand

Everything below is committed and pushed to `main` (production), in both repos.

| Phase | What exists | Backend | Frontend |
| --- | --- | --- | --- |
| 1 Skill intelligence | `/skills`; 81-skill graph; scorer; `ProblemEngagement` | earlier | earlier |
| 2 Adaptive learning | Today's mission on the home; `review_due` reminders (`ReviewDue` index); roadmap read against the profile | earlier | earlier |
| 3 Why it failed | `SubmissionAnalysis` (deterministic + model review on every failed coding submit); **Code Review** dock tab; causes on `/skills` | a9dba8e | 523ebd8 |
| 4 Socratic tutor | 7-rung ladder; Tutor dock tab + floating button (`TutorLauncher`, animated `LiveTutorMark`); streaming code gate; prompt v2 with the "Your turn:" hand-back | 41e3c1e, 88fbb07 | ccb4c61, cfba650 |
| 5 Placement OS | `/readiness` for a target company (five areas, from the seeded test patterns + company tags); `User.targetCompany/targetTest/targetDate` | 89923ce | b15142f |
| 5 remainder | The mission leans on the target's weakest area as the date nears; activity ticks; the readiness line in Today; a target change re-picks the day (`ADAPTIVE_COACH.md` §11) | fae2d93 | 33a6a43 |
| 7 Interview skills + simulations | Interview domain on the skill profile; readiness reads it; 22 sourced company simulations (`ADAPTIVE_COACH.md` §12) | 82296fa | e5a4af0 |
| Discovery | Target from onboarding, the mission's Try item, contextual links + tour chapters, menus and a what's-new line (`ADAPTIVE_COACH.md` §13) | see `git log` | see `git log` |
| 6 Debugging | Hunts as production incidents, the diagnosis clock, "Why it failed", the tutor and a scored postmortem on hunts (`ADAPTIVE_COACH.md` §14) | see `git log` | see `git log` |
| 8 Career | The public profile's career section (verified / assessed / self-reported; estimates by opt-in switch) and a private application tracker (`ADAPTIVE_COACH.md` §15) | see `git log` | see `git log` |

Not built: Phase 9 and the small follow-ups in §5. Phases 5–8 are complete (A–D below are done). Next: E (Phase 9, cohorts) — ask the owner its three questions first.

## 2. How the owner works (learned this session — follow it)

- **They decide, then expect momentum.** Large asks come as one sentence ("start on the next phase"). Propose defaults in a short message, then build; don't stall on questions a sensible default answers. Ask only when a choice is truly theirs (see §5).
- **Pushing:** `main` is production. The owner asks for a push at a phase's end ("kindly push the code and start another phase"). Push the **backend first**, then the frontend, since a frontend that calls new endpoints needs them live. End every commit with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Never `--no-verify`.
- **They change course mid-turn.** A message can arrive while you work. It once asked for the workbench to switch to Code Review automatically on failure, and a minute later said not to. **Don't auto-switch tabs.**
- **Visual asks are literal and about feel.** "Like the AI assistant" meant the same floating button and window shape. "A small animation like the daily contest icon" meant `components/common/LiveFlame.tsx`'s technique: SVG parts on irregular keyframes, brand blues, a drawn rest state under reduced motion. "Make it a bit beautiful" got an avatar, a rung chip, a bubble and a "Your turn" box. Screenshot every UI change in light, dark and at phone width, and read the screenshots, before calling it done.
- **Unlimited by decision.** The assistant, the failure reviews and the tutor have no plan caps, only burst limiters. Don't add quotas.

## 3. Rules the code relies on

- **Derive, don't store.** A score, plan or estimate is a pure function in `src/lib/` (pinned by a colocated `*.test.ts`) over rows that already exist, with a thin service that reads and caches (`cached` 60 s). Store a table only for what no row can answer: a choice the student made, or a model's answer, which costs money and isn't reproducible.
- **AI goes through `src/lib/ai/provider.ts`** (`ai.json` for structured answers, `ai.stream` for chat; NVIDIA via plain fetch, never an SDK). Prompts are files: `content/prompts/<task>/vN.md` with `PROMPT_VERSIONS` in `src/lib/ai/prompts.ts`. **A changed prompt is a new file and a version bump** once the old one has shipped. Rows record `promptVersion`. Prompts are read once per process, so restart the dev API to see an edit (`touch` any file under `src/`).
- **The model never sees hidden test cases.** Untrusted text (code, resumes) goes inside `=== BEGIN … === / === END … ===` fences. Guard the output in code, not only in the prompt (`guardReview`, `codeGate`).
- **No model help in ranked play:** today's daily-contest problem, a live duel (`findLiveDuelFor`), a live Battles round or knockout match. Copy `blockFor` in `services/tutor.ts`.
- **Company facts are sourced facts only:** the 27 test patterns in `scripts/mock-test-data/index.ts` (each with a `sourceNote`) and the catalogue's company tags. Never write how a company hires beyond those.
- **Every feature that collects or processes data changes these together:** the privacy policy (`frontend/src/content/legal.ts`), the handbook (`content/handbook.md`) and its pinned assistant questions (`src/services/assistant.test.ts`), the account export (`src/services/account.ts`), `CLAUDE.md`, and `ADAPTIVE_COACH.md`.
- **The assistant retrieval cap is fixed.** When a handbook edit pushes an old pinned question's answer out, reword the bullet (fewer repeated words like "review", "again", "fail") or add an alias in `src/lib/assistant-index.ts`. Never raise `PICK_MAX`/`PICK_CHARS`.
- **UI:** monochrome plus one blue scale (`BLUE` 50–950, `--color-blue-*`); hairlines, not cards, except chat bubbles. A loading state must hold its final height (use `TextSkeleton` inside the same Typography); `e2e/dashboard-loading.spec.ts` measures every home band. Dock panels are never unmounted, so gate fetches on `visibleTabs`. Workbench entries open in a new tab (`NEW_TAB`). The dashboard is one composed request: bump its cache key (`dash:v5` → `v6`) when its payload changes.

## 4. Gotchas that cost time

- **Writing TypeScript through `node -e` or a heredoc'd JS template literal eats backslashes**: `\n` becomes a real newline, `\b` a backspace character, and `\d` and `\s` lose their backslash. Use the Write and Edit tools for any TS containing a regex or escape. Plain `cat >> file <<'EOF'` is safe.
- **There is no `gh` CLI here**, so CI and the deploy can't be watched. After pushing, tell the owner to check GitHub Actions.
- `src/lib/og-card.test.ts` "does not stall the event loop" fails under a full parallel run and passes alone. It isn't a regression.
- **Local setup:**
  - Dev servers: `:3000` (SPA) and `:3001` (API), usually already running. Port 3002 is the Battles dev server, so don't kill it.
  - Database: MySQL in Docker `codexa-mysql` on `:3309`.
  - e2e account tokens: `frontend/e2e/.auth/users.json` (keys `"0"`, `"1"`).
  - Scratch Playwright capture scripts sit in the session scratchpad. Copy the pattern from `frontend/e2e/*.spec.ts`: set the token and theme in localStorage, and set `codekairo-workbench-tour-v1` so the tour stays shut.
- **After a schema change, run `npx prisma db push` and then `npx prisma generate`.** Production applies additive changes itself (`deploy.sh` runs `db push`). A new unique index on an existing table is refused there; use a new table instead, the way `ProblemNumber` did.
- **CSS specificity:** `& p { margin: 0 }` beats `& > * + * { margin-top }`. Reset with `& > *`.
- **Gates before every push:**
  - Backend: `npx tsc --noEmit -p .` and `DATABASE_URL="mysql://u:p@localhost:3306/x" TELEMETRY_DISABLED=true npm test`.
  - Frontend: `npx tsc --noEmit`, `npx eslint .` (0 errors; 73 warnings is the baseline), `npm run build`, and `grep -l define.amd dist/assets/*.js` must print nothing.
  - The e2e specs you touched, plus `a11y.spec.ts` when you add a page.

## 5. What to build next, in order

### A. Finish Phase 5: the mission reads the target — DONE 2026-10-07 (kept for the record; see `ADAPTIVE_COACH.md` §11)

**Goal:** the daily mission and the home page react to the saved target. As the drive date nears, today's items lean toward the weakest readiness area, and changing the target refreshes today's undone items.

- **Inputs:**
  - `services/readiness.ts` `readinessFor(userId, {})` already returns `areas`, `focus` and `target.daysLeft`, cached for 60 s.
  - The mission is built in `services/mission.ts` `missionFor` (inside `buildDashboard`) from the candidates in `MissionCandidates` (`src/lib/mission.ts`).
  - Load readiness only when `User.targetCompany` is set, so other accounts pay nothing.
- **Rules (put them in the pure `src/lib/mission.ts` and pin them in `mission.test.ts`):**
  - Within ~30 days of `targetDate`, the weakest readiness area moves up the priority order. For "assessment", the target's test pattern becomes a `milestone` item (`MILESTONE_MINUTES.mock` = 60, so only on a 60+ minute day) unless it was sat in the last 14 days. For "coding", the weakest company topic skill comes before the generic weakest skill. For "fundamentals", the weakest `cs:*` skill-test or notes page.
  - Aptitude items have no evidence kind today (`MissionEvidence` covers problem, bug, lesson and plan step). Adding `{ aptitudeCategory }`, done by an `AptitudeAttempt` today, may be needed. Decide in the code, and keep "ticks are derived".
  - `MAX_PER_SKILL` and the fixed `slotsFor(minutes)` row count must not change. The loading shell depends on them.
- **When the target changes:** `PUT /api/me/readiness/target` (`services/readiness.ts` `setTarget`) should re-pick today's undone items the way `setMissionMinutes` does (`keptOnResize` + `missionFacts`), then call `invalidateDashboard(userId)`.
- **Home:**
  - One line in Today's area: "TCS readiness 46% · 18 days left", linking to `/readiness`. Put it on the dashboard payload as `readiness: { company, score, status, daysLeft } | null` and bump `dash:v6`.
  - The loading shell must reserve that line only when a target exists. Carry `targetCompany` on `/api/me` (bump `me:v3` → `me:v4`; `meUserOf` shapes it) so the shell knows.
  - Run `e2e/dashboard-loading.spec.ts`; it must still pass.
- **Docs:** the handbook's "Today's mission" and "Placement readiness" bullets (re-run the assistant tests), and the privacy policy's "Personalising it" item.
- **Done when:** with a target set 10 days out, the mission shows the weakest area's items and the mock; changing the target refreshes today's list; the home shows the line; every gate is green.

### B. Phase 7: interview skills and company simulations — DONE 2026-10-07 (see `ADAPTIVE_COACH.md` §12; the owner chose all companies, a written-or-voice HR round, and rounds counting as usual)

- **Evidence that exists:**
  - `MockInterviewQuestion`: `topic`, `focusArea`, `difficulty`, `evaluationScore` (0–100), `verdict`, `missed` (Json), `expectedSkills` (Json).
  - `MockInterviewSession`: `overallScore`, `topicBreakdown` (Json), `strengths`/`weaknesses` (Json), `mode` (written/voice).
  - The sat-round predicate is `SAT_ROUND` in `services/entitlements.ts`.
  - Read real rows locally to see what `focusArea`, `expectedSkills` and `topicBreakdown` actually hold before designing.
- **Build:**
  - An `interview` domain in `src/lib/skill-graph.ts` (for example communication, problem-solving approach, complexity analysis, CS theory, behavioural — derive the list from the real field values).
  - A new evidence source in `src/lib/skill-score.ts` `SOURCE_RULES`, fed from `loadEvidence` in `services/skill-profile.ts`.
  - The readiness interview area then reads those skills instead of averaging `overallScore`.
- **Company simulations:** a multi-round sitting — aptitude, then a technical interview, then an HR interview — as one run.
  - Content as code: `scripts/interview-sims/*.ts`, a seed script, and tables such as `InterviewSimulation`, `InterviewSimulationRound` and `SimulationRun`. A run links the existing `MockAttempt`/`MockInterviewSession` rows; reuse, don't duplicate.
  - Templates must carry a `sourceNote` like the test patterns. Only sourced round structures.
- **Ask the owner first:** which companies get a simulation first; whether the HR round is voice; whether a simulation counts against the weekly interview allowance.

### C. Phase 6: debugging — DONE 2026-10-09 (see `ADAPTIVE_COACH.md` §14; after the deploy, run `scripts/bug-symptoms.ts --apply` on the box once, or let the API fill each hunt on its first read)

- **The bug-hunt pipeline:** `src/lib/bug-judge.ts`, content in `scripts/bugs-data.ts` and `bugs-wave*.ts`, `BugSubmission`.
- **Build:**
  - A timed "production incident" format: logs, a stack trace and a diff shown with the hunt.
  - Diagnosis time from opening the hunt to the first correct fix.
  - A short written root-cause explanation, scored by the model against a rubric (`ai.json`, a new versioned prompt), stored as columns on `BugSubmission`.
- **Also:** extend "Why it failed" and the tutor to bug hunts. Their verdicts are `FAILED`/`ERROR`, and their test output can be forged (CLAUDE.md, Scoring integrity), so never pay XP on a model's score.

### D. Phase 8: career profile — DONE 2026-10-09 (see `ADAPTIVE_COACH.md` §15; the owner chose opt-in per section, the tracker linked to readiness, and the existing `/u/:username`)

- **Build on the public profile** at `/u/:username` (`services/public-profile.ts`, an allow-list — keep it one). Mark each item as verified (credentials, proctored tests), assessed (skill profile, readiness) or self-reported.
- **Applications:** a private `Application` table (company, role, stage, dates, notes) with its own page.
- **Privacy policy:** update it for anything newly shown publicly.
- **Ask the owner first:** whether readiness or skill scores may ever appear publicly.

### E. Phase 9: cohorts (last)

- **Build:** `Cohort`/`CohortMember`, a shared weekly goal taken from the skill graph, and sessions on top of pair rooms. Learning only, with no new leaderboard.
- **Ask the owner first:** group size, invite-only or open, and moderation.

### Small follow-ups (slot in anywhere)

- "Why it failed" and the tutor for SQL problems; SQL's verdict is `INVALID_QUERY`, and its judge is `src/lib/sql/judge.ts`.
- A "swap" action for one mission item. Today the options are only skip and undo.
- Mission reviews for aptitude, SQL and debugging skills; today only coding reviews become items.
- A "was this useful?" signal on reviews and tutor turns.
- An admin view of review and tutor volume, and of saved targets.
- A tutor rung-1 answer once slipped in "(Hint: you could use a Set…)". If asides keep slipping, tighten the rung's `mayNot` in `src/lib/tutor.ts`. That needs a prompt v3, because v2 has shipped.

## 6. File map

| Area | Backend | Frontend |
| --- | --- | --- |
| Skill graph and score | `src/lib/skill-graph.ts`, `skill-score.ts`, `skill-profile.ts`, `services/skill-profile.ts`, `routes/skills.ts` | `pages/SkillsPage.tsx`, `components/skills/`, `store/api/skillsApi.ts` |
| Mission | `src/lib/mission.ts`, `services/mission.ts`, `routes/mission.ts` | `components/dashboard/home/TodayPanel.tsx`, `YourPlan.tsx`, `lib/mission.ts` |
| Review reminders | `services/review-reminders.ts` (`ReviewDue`) | — |
| Roadmap route | `src/lib/roadmap-route.ts`, `services/roadmap.ts` | `components/roadmap/RouteLine.tsx`, `StagePanel` |
| Why it failed | `src/lib/failure-analysis.ts`, `submission-review.ts`, `services/submission-analysis.ts`, `routes/analysis.ts`, `content/prompts/submission-review/v1.md` | `components/problems/FailureAnalysis.tsx`, `lib/failure-analysis.ts`; the tab is wired in `pages/ProblemPage.tsx` |
| Tutor | `src/lib/tutor.ts`, `services/tutor.ts`, `routes/tutor.ts`, `content/prompts/tutor/v2.md` | `components/problems/TutorPanel.tsx`, `TutorLauncher.tsx`, `LiveTutorMark.tsx`, `lib/tutor.ts`, `lib/sse.ts` |
| Readiness | `src/lib/readiness.ts`, `services/readiness.ts`, `routes/readiness.ts` | `pages/ReadinessPage.tsx`, `store/api/readinessApi.ts` |
| Debugging coach | `src/lib/bug-incident.ts`, `bug-failure.ts`, `bug-review.ts`, `root-cause.ts`, `bug-tutor.ts`, `services/bug-coach.ts`, the routes in `routes/bug-challenges.ts`, prompts `bug-review/`, `root-cause/`, `bug-tutor/` | `components/bugs/IncidentBrief.tsx`, `BugReview.tsx`, `Postmortem.tsx`, `lib/bug-coach.ts`, `BugWorkspace.tsx`; `e2e/bug-incident.spec.ts` |
| AI seam | `src/lib/ai/provider.ts`, `src/lib/ai/prompts.ts` | — |
| e2e | — | `e2e/failure-analysis.spec.ts`, `tutor.spec.ts`, `readiness.spec.ts`, `dashboard-loading.spec.ts`, `a11y.spec.ts` |
