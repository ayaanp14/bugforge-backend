/**
 * The static-first views' data (`view` on a PageHead, services/seo.ts).
 *
 * A content page the Worker fills from `GET /api/seo/head` used to show a
 * visitor nothing until the app had loaded: its prerendered body is the
 * crawler's article, hidden once scripting is on. A head that also carries
 * `view` — the page's first screen as data: the words, the numbers, the
 * links, the starter code, in the order the React page shows them — lets
 * the Worker draw that screen as HTML at the React components' metrics
 * (frontend lib/seo/views/api), so it paints with the HTML and the app's
 * mount replaces it with the same pixels. The problem page was the pilot
 * (2026-10-13: PageSpeed mobile 32 → 89, desktop 47 → 100).
 *
 * One module per kind, each a plain interface (and, where the shaping is
 * more than a few fields, a builder) over data the head function has
 * already loaded — a view adds no query of its own. The `kind` is what the
 * frontend registry dispatches on; it must match the module's KINDS there.
 */
import type { ProblemView } from "./problem.js";
import type { HubView } from "./hub.js";
import type { BugHuntView } from "./bug-hunt.js";
import type { BugHubView } from "./bug-hub.js";
import type { StudyTrackView } from "./study-track.js";
import type { StudyLessonView } from "./study-lesson.js";
import type { AptitudeSectionView } from "./aptitude-section.js";
import type { AptitudeQuestionView } from "./aptitude-question.js";
import type { TestView } from "./test.js";
import type { SkillTestView } from "./skill-test.js";
import type { RoadmapLessonView } from "./roadmap-lesson.js";
import type { SqlProblemView } from "./sql-problem.js";
import type { NoteSubjectView } from "./note-subject.js";
import type { NoteView } from "./note.js";
import type { InterviewExperienceView } from "./interview-experience.js";

export type SeoView =
  | ProblemView
  | HubView
  | BugHuntView
  | BugHubView
  | StudyTrackView
  | StudyLessonView
  | AptitudeSectionView
  | AptitudeQuestionView
  | TestView
  | SkillTestView
  | RoadmapLessonView
  | SqlProblemView
  | NoteSubjectView
  | NoteView
  | InterviewExperienceView;

export type { ProblemView } from "./problem.js";
export type { HubView } from "./hub.js";
export type { BugHuntView } from "./bug-hunt.js";
export type { BugHubView } from "./bug-hub.js";
export type { StudyTrackView } from "./study-track.js";
export type { StudyLessonView } from "./study-lesson.js";
export type { AptitudeSectionView } from "./aptitude-section.js";
export type { AptitudeQuestionView } from "./aptitude-question.js";
export type { TestView } from "./test.js";
export type { SkillTestView } from "./skill-test.js";
export type { RoadmapLessonView } from "./roadmap-lesson.js";
export type { SqlProblemView } from "./sql-problem.js";
export type { NoteSubjectView } from "./note-subject.js";
export type { NoteView } from "./note.js";
export type { InterviewExperienceView } from "./interview-experience.js";
