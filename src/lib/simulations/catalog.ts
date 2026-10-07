import type { Simulation } from "./types.js";

/**
 * The company simulations, one per company with a seeded test pattern
 * (scripts/mock-test-data). Each round structure is sourced — see
 * types.ts — and simulations.test.ts holds every entry to its pattern and
 * its sources.
 *
 * Researched 2026-10-07 from each company's own careers pages where it
 * publishes its process, otherwise from prep portals (PrepInsta, FACE Prep,
 * placementpreparation.io, InterviewBit, GeeksforGeeks) that agree with each
 * other. Candidate posts (Glassdoor, LeetCode) are never a source. Rules
 * kept while writing them:
 *
 *  - A combined interview a source holds in one sitting is listed as its
 *    parts (technical, then HR), so each kind of answer is practised and
 *    the note says it may be one sitting.
 *  - A round only GeeksforGeeks' templated "recruitment process" page lists
 *    (Technical 1 / Technical 2 / Hiring Manager / HR, the same for every
 *    company), contradicted by the other sources, is left out and named in
 *    the note.
 *  - What the seeded pattern does not reproduce (live coding tests, voice
 *    and communication assessments, game-based modules) is named in the
 *    note, never silently dropped.
 *  - Rounds that are not interviews to practise (team matching after a
 *    hiring committee) are named in the note, not made into rounds.
 */

const SERVICE_TECHNICAL = ["dsa", "oop", "database", "os-networks"] as const;

export const SIMULATIONS: readonly Simulation[] = [
  // ── Service companies ────────────────────────────────────────────
  {
    slug: "tcs",
    company: "TCS",
    family: "service",
    role: "campus fresher",
    difficulty: "beginner",
    rounds: [
      { key: "oa", kind: "assessment", name: "TCS NQT — Foundation", covers: "Numerical, verbal and reasoning ability: the section every NQT candidate sits.", test: "tcs-nqt-foundation" },
      { key: "technical", kind: "technical", name: "Technical Interview", covers: "Your programming language, data structures, DBMS and SQL, OS, networking, OOP and your projects, with small coding questions.", focus: SERVICE_TECHNICAL },
      { key: "managerial", kind: "managerial", name: "Managerial Interview", covers: "Situational and behavioural questions: decisions, leadership, teamwork and how well you understand your own project." },
      { key: "hr", kind: "hr", name: "HR Interview", covers: "Your background and motivation, strengths and weaknesses, relocation and documents." },
    ],
    firmness: "consistent",
    sourceNote:
      "Every source agrees on technical, managerial and HR. PrepInsta and placementpreparation.io describe one 25–40 minute interview with all three panels together; InterviewBit and GeeksforGeeks describe separate rounds and say the managerial round may not take place. The NQT's Advanced section and its coding questions are their own patterns here.",
    sources: [
      { label: "PrepInsta — TCS NQT recruitment process", url: "https://prepinsta.com/tcs-nqt/recruitment-process/" },
      { label: "placementpreparation.io — TCS NQT recruitment process", url: "https://placementpreparation.io/tcs-nqt/recruitment-process" },
      { label: "InterviewBit — TCS NQT interview", url: "https://www.interviewbit.com/tcs-nqt-interview-questions/" },
    ],
  },
  {
    slug: "infosys",
    company: "Infosys",
    family: "service",
    role: "campus fresher",
    difficulty: "beginner",
    rounds: [
      { key: "oa", kind: "assessment", name: "Infosys SE / DSE — Aptitude", covers: "The online test: reasoning, mathematical ability and verbal ability.", test: "infosys-systems-engineer" },
      { key: "technical", kind: "technical", name: "Technical Interview", covers: "Questions from your resume and area of interest: C, C++ or Java, OS, data structures and algorithms, puzzles, projects and internships.", focus: ["dsa", "oop", "os-networks"] },
      { key: "hr", kind: "hr", name: "HR Interview", covers: "Your background, interests and motivation, and whether you fit Infosys; communication is judged here." },
    ],
    firmness: "consistent",
    sourceNote:
      "InterviewBit and PrepInsta agree on a technical interview, then HR; PrepInsta notes the HR round can ask technical questions too. Some drives add a managerial interview. No source describes the Specialist Programmer interview separately, so this is the Systems Engineer process.",
    sources: [
      { label: "InterviewBit — Infosys interview", url: "https://www.interviewbit.com/infosys-interview-questions/" },
      { label: "PrepInsta — Infosys recruitment process", url: "https://prepinsta.com/infosys/recruitment-process/" },
    ],
  },
  {
    slug: "wipro",
    company: "Wipro",
    family: "service",
    role: "campus fresher",
    difficulty: "beginner",
    rounds: [
      { key: "oa", kind: "assessment", name: "Wipro NLTH — Aptitude", covers: "Fifty-two aptitude questions in forty-eight minutes.", test: "wipro-nlth-aptitude" },
      { key: "technical", kind: "technical", name: "Technical Interview", covers: "Your final-year project and the technologies in it, programming, data structures and CS subjects; you may write code.", focus: SERVICE_TECHNICAL },
      { key: "hr", kind: "hr", name: "HR Interview", covers: "Communication, personality, strengths and weaknesses, and your willingness to relocate and work shifts." },
    ],
    firmness: "varies",
    sourceNote:
      "Sources differ. PrepInsta's Wipro page and Hitbullseye list a technical interview, then HR; a GeeksforGeeks Elite NTH account describes one 30–60 minute 'Business Discussion' combining both; PrepInsta's NTH page lists a voice assessment and an HR discussion with no technical interview. The voice assessment and the essay are not reproduced here.",
    sources: [
      { label: "PrepInsta — Wipro recruitment process", url: "https://prepinsta.com/wipro/recruitment-process/" },
      { label: "Hitbullseye — Wipro Elite NLTH pattern", url: "https://cpt.hitbullseye.com/wipro-elite-nlth-exam-pattern-and-syllabus.php" },
      { label: "PrepInsta — Wipro NLTH recruitment process", url: "https://prepinsta.com/wipro-nlth/recruitment-process/" },
    ],
  },
  {
    slug: "accenture",
    company: "Accenture",
    family: "service",
    role: "campus fresher",
    difficulty: "beginner",
    rounds: [
      { key: "oa", kind: "assessment", name: "Accenture — Cognitive & Technical", covers: "The cognitive and technical assessment.", test: "accenture-cognitive-technical" },
      { key: "technical", kind: "technical", name: "Interview — technical part", covers: "Data structures (arrays, linked lists), sorting and searching, SQL, OOP and your projects, with two panelists.", focus: SERVICE_TECHNICAL },
      { key: "hr", kind: "hr", name: "Interview — HR part", covers: "'Tell me about yourself', why Accenture, behaviour and teamwork." },
    ],
    firmness: "consistent",
    sourceNote:
      "PrepInsta and GeeksforGeeks describe one interview with two panelists mixing technical and HR questions; it is practised here as its two parts. The coding test and the 30-minute communication assessment (GeeksforGeeks: not an elimination round) are not reproduced.",
    sources: [
      { label: "PrepInsta — Accenture recruitment process", url: "https://prepinsta.com/accenture/recruitment-process/" },
      { label: "GeeksforGeeks — Accenture recruitment process", url: "https://www.geeksforgeeks.org/accenture-recruitment-process/" },
    ],
  },
  {
    slug: "cognizant",
    company: "Cognizant",
    family: "service",
    role: "GenC fresher",
    difficulty: "beginner",
    rounds: [
      { key: "oa", kind: "assessment", name: "Cognizant GenC — Aptitude", covers: "The GenC aptitude assessment.", test: "cognizant-genc-aptitude" },
      { key: "technical", kind: "technical", name: "Technical Interview", covers: "Programming, OOP, DBMS and SQL, OS, networks, coding problems and your projects.", focus: SERVICE_TECHNICAL },
      { key: "hr", kind: "hr", name: "HR Interview", covers: "Communication, behaviour, teamwork, relocation and your career goals." },
    ],
    firmness: "consistent",
    sourceNote:
      "Sources agree on technical and HR. PrepInsta describes one 30–45 minute technical-and-HR interview; placementpreparation.io a technical panel and an HR panel, 25–40 minutes in all; GeeksforGeeks separate rounds, a managerial round for some roles and a Versant communication test, which is not reproduced. GenC Next and GenC Pro processes differ.",
    sources: [
      { label: "PrepInsta — Cognizant recruitment process", url: "https://prepinsta.com/cognizant/recruitment-process/" },
      { label: "placementpreparation.io — Cognizant GenC recruitment process", url: "https://placementpreparation.io/cognizant-genc/recruitment-process" },
    ],
  },
  {
    slug: "capgemini",
    company: "Capgemini",
    family: "service",
    role: "Analyst fresher",
    difficulty: "beginner",
    rounds: [
      { key: "oa", kind: "assessment", name: "Capgemini — Technical & English", covers: "Pseudocode, technical MCQs and English.", test: "capgemini-technical-english" },
      { key: "technical", kind: "technical", name: "Technical Interview", covers: "The projects on your resume in depth, data structures, OOP, DBMS, OS, programming basics and networking.", focus: SERVICE_TECHNICAL },
      { key: "hr", kind: "hr", name: "HR Interview", covers: "Communication, what you know of Capgemini, your three-to-five-year goals, salary, relocation and shifts." },
    ],
    firmness: "consistent",
    sourceNote:
      "FACE Prep, PrepInsta and GeeksforGeeks agree on a technical interview, then HR. PrepInsta lists a coding round (two questions in 45 minutes, which decides the Analyst or Senior Analyst package) before it, and the game-based module sits in the assessment; neither is reproduced here.",
    sources: [
      { label: "FACE Prep — Capgemini recruitment process", url: "https://faceprep.in/article/capgemini-recruitment-process-for-freshers-capgemini-selection-procedure/" },
      { label: "PrepInsta — Capgemini", url: "https://prepinsta.com/capgemini/" },
    ],
  },
  {
    slug: "hcltech",
    company: "HCLTech",
    family: "service",
    role: "campus fresher",
    difficulty: "beginner",
    rounds: [
      { key: "oa", kind: "assessment", name: "HCLTech — Written Test", covers: "The aptitude and technical written test.", test: "hcltech-aptitude-technical" },
      { key: "technical", kind: "technical", name: "Technical Interview", covers: "Data structures, DBMS, OS, networks, OOP and the SDLC; you write or explain simple programs and talk through projects.", focus: SERVICE_TECHNICAL },
      { key: "hr", kind: "hr", name: "HR Interview", covers: "Personality, behaviour, fit and relocation; documents may be checked here." },
    ],
    firmness: "consistent",
    sourceNote:
      "PrepInsta and placementpreparation.io give one technical interview (10–30 minutes, depending on the interviewer) and then HR. GeeksforGeeks lists two technical interviews and sometimes a third.",
    sources: [
      { label: "PrepInsta — HCL recruitment process", url: "https://prepinsta.com/hcl/recruitment-process/" },
      { label: "placementpreparation.io — HCL recruitment process", url: "https://placementpreparation.io/hcl/recruitment-process" },
    ],
  },
  {
    slug: "tech-mahindra",
    company: "Tech Mahindra",
    family: "service",
    role: "campus fresher",
    difficulty: "beginner",
    rounds: [
      { key: "oa", kind: "assessment", name: "Tech Mahindra — Aptitude & Technical", covers: "The aptitude and technical online assessment.", test: "tech-mahindra-written" },
      { key: "technical", kind: "technical", name: "Technical Interview", covers: "OOP, DBMS with live SQL, data structures, your chosen language, OS and networks, resume projects and puzzles.", focus: ["dsa", "oop", "database", "sql"] },
      { key: "hr", kind: "hr", name: "HR Interview", covers: "Communication, confidence, fit, career goals and your interest in the company." },
    ],
    firmness: "consistent",
    sourceNote:
      "PrepInsta and placementpreparation.io agree: a technical interview (15–45 minutes), then a separate HR interview (15–30 minutes). GeeksforGeeks alone adds a technical written test before the interview.",
    sources: [
      { label: "PrepInsta — Tech Mahindra recruitment process", url: "https://prepinsta.com/tech-mahindra/recruitment-process/" },
      { label: "placementpreparation.io — Tech Mahindra recruitment process", url: "https://placementpreparation.io/tech-mahindra/recruitment-process" },
    ],
  },

  // ── Product companies ────────────────────────────────────────────
  {
    slug: "zoho",
    company: "Zoho",
    family: "product",
    role: "fresher software developer",
    difficulty: "beginner",
    rounds: [
      { key: "oa", kind: "assessment", name: "Zoho — Round 1", covers: "The written test of aptitude and programming output questions.", test: "zoho-round-one" },
      { key: "basic", kind: "coding", name: "Basic Programming", covers: "Around five programs on loops, strings and basic data structures.", focus: ["dsa"] },
      { key: "advanced", kind: "coding", builderRound: "machine-coding", name: "Advanced Programming", covers: "Design and build a larger program, judged on modularity, edge cases and efficiency.", focus: ["dsa", "low-level-design"] },
      { key: "technical", kind: "technical", name: "Technical HR", covers: "Programming fundamentals, your projects, DBMS and scenario questions.", focus: ["oop", "database"] },
      { key: "hr", kind: "hr", name: "General HR", covers: "Your background, strengths and weaknesses, why Zoho, and location." },
    ],
    firmness: "consistent",
    sourceNote:
      "PrepInsta, FACE Prep and placementpreparation.io agree on the order: basic programming, advanced programming, a technical interview and HR. The programming rounds are timed written tests (the basic one runs about three hours); here an AI coding interview stands in for each. FACE Prep notes not every candidate goes through all of them.",
    sources: [
      { label: "PrepInsta — Zoho recruitment process", url: "https://prepinsta.com/zoho/recruitment-process/" },
      { label: "FACE Prep — Zoho interview process", url: "https://faceprep.in/article/zoho-interview-questions-for-zoho-interview-process-face-prep/" },
      { label: "placementpreparation.io — Zoho recruitment process", url: "https://placementpreparation.io/zoho/recruitment-process" },
    ],
  },
  {
    slug: "deloitte",
    company: "Deloitte",
    family: "product",
    role: "campus analyst",
    difficulty: "beginner",
    rounds: [
      { key: "oa", kind: "assessment", name: "Deloitte — Online Assessment", covers: "The online assessment.", test: "deloitte-assessment" },
      { key: "technical", kind: "technical", name: "Interview — technical part", covers: "Your final-year project, the languages on your resume and your core engineering subjects.", focus: ["oop", "database"] },
      { key: "hr", kind: "hr", name: "Interview — HR part", covers: "Your daily routine, hobbies, interests and motivation." },
    ],
    firmness: "varies",
    sourceNote:
      "PrepInsta and FACE Prep (2026) describe a single 15–25 minute interview covering technical and HR together, with the group discussion and JAM rounds dropped; GeeksforGeeks still lists a GD or JAM, a technical interview, a managerial discussion for some positions, then HR.",
    sources: [
      { label: "PrepInsta — Deloitte recruitment process", url: "https://prepinsta.com/deloitte/recruitment-process/" },
      { label: "FACE Prep — Deloitte recruitment process", url: "https://faceprep.in/article/deloitte-recruitment-process-for-freshers-in-detail-face-prep/" },
    ],
  },
  {
    slug: "zs-associates",
    company: "ZS Associates",
    family: "product",
    role: "campus Business Technology",
    difficulty: "beginner",
    rounds: [
      { key: "oa", kind: "assessment", name: "ZS Associates — Aptitude", covers: "The aptitude test.", test: "zs-associates-aptitude" },
      { key: "case", kind: "case", name: "Case Interview", covers: "A real business problem: structure it, work towards a solution and take feedback.", focus: ["communication"] },
      { key: "behavioral", kind: "behavioral", name: "Behavioral Interview", covers: "Getting to know you and your fit: your resume, teamwork and conflict." },
      { key: "technical", kind: "technical", name: "Subject Matter Expertise Interview", covers: "Your subject knowledge, the quality of your work and your problem solving.", focus: ["database", "oop"] },
      { key: "fit", kind: "managerial", name: "Fit Interview", covers: "With senior managers: why ZS, and where your career is heading." },
    ],
    firmness: "official",
    sourceNote:
      "ZS's own hiring page names behavioral, case and subject-matter-expertise interviews and says candidates can expect two to four rounds, differing by role, level and region. FACE Prep describes the campus drive: a case and behavioral interview, then a fit interview with senior managers, usually the same day.",
    sources: [
      { label: "ZS — Hiring process", url: "https://www.zs.com/careers/hiring-process" },
      { label: "FACE Prep — ZS Associates recruitment process", url: "https://faceprep.in/article/zs-associates-recruitment-process-aptitude-test-and-interview-face-prep/" },
    ],
  },
  {
    slug: "goldman-sachs",
    company: "Goldman Sachs",
    family: "product",
    role: "campus engineering analyst",
    difficulty: "intermediate",
    rounds: [
      { key: "oa", kind: "assessment", name: "Goldman Sachs — Aptitude Test", covers: "The aptitude portion of the online assessment.", test: "goldman-sachs-aptitude" },
      { key: "coding", kind: "coding", name: "Technical Interview 1", covers: "One or two medium-to-hard coding problems: your approach, the edge cases and the complexity.", focus: ["dsa"] },
      { key: "design", kind: "system-design", builderRound: "low-level-design", name: "Technical Interview 2", covers: "Low-level design — classes, UML and design patterns — or deeper data structures and CS subjects.", focus: ["low-level-design", "oop"] },
      { key: "hr", kind: "hr", name: "HR Interview", covers: "Behavioural questions (STAR), culture fit and why Goldman Sachs." },
    ],
    firmness: "consistent",
    sourceNote:
      "Goldman Sachs's own page describes a video interview, a HackerRank assessment for engineers and a final Superday of two to five interviews depending on the division. placementpreparation.io gives two technical interviews (coding, then low-level design) and HR. A hiring-manager round appears only in GeeksforGeeks' template and is left out. The HackerRank coding test is not reproduced.",
    sources: [
      { label: "Goldman Sachs — Students: prepare", url: "https://www.goldmansachs.com/careers/students/prepare" },
      { label: "placementpreparation.io — Goldman Sachs recruitment process", url: "https://www.placementpreparation.io/goldman-sachs/recruitment-process/" },
    ],
  },
  {
    slug: "morgan-stanley",
    company: "Morgan Stanley",
    family: "product",
    role: "campus technology analyst",
    difficulty: "intermediate",
    rounds: [
      { key: "oa", kind: "assessment", name: "Morgan Stanley — Aptitude & Technical", covers: "The aptitude and technical assessment.", test: "morgan-stanley-assessment" },
      { key: "coding", kind: "coding", name: "Technical Round 1", covers: "Data structures and algorithms, coding, complexity and your resume.", focus: ["dsa"] },
      { key: "technical", kind: "technical", name: "Technical Round 2", covers: "OOP, DBMS and SQL, OS, networks, your projects and puzzles.", focus: ["oop", "database", "os-networks"] },
      { key: "hr", kind: "hr", name: "HR Interview", covers: "Your motivation, teamwork, location and background." },
    ],
    firmness: "varies",
    sourceNote:
      "Thin. India-focused sources give two or three technical rounds, then HR; one (placementpapers.app) adds a managerial round, left out here. A US-facing source describes a live-coding phone screen and a Superday of four or five interviews mixing technical and behavioural. No official page describes the rounds.",
    sources: [
      { label: "GeeksforGeeks — Morgan Stanley recruitment process", url: "https://www.geeksforgeeks.org/morgan-stanley-recruitment-process/" },
      { label: "placementpapers.app — Morgan Stanley interview experience", url: "https://placementpapers.app/morgan-stanley/interview-experience/" },
      { label: "techinterview.org — Morgan Stanley", url: "https://www.techinterview.org/companies/morgan-stanley/" },
    ],
  },
  {
    slug: "oracle",
    company: "Oracle",
    family: "product",
    role: "campus software engineer",
    difficulty: "intermediate",
    rounds: [
      { key: "oa", kind: "assessment", name: "Oracle — Aptitude & Verbal", covers: "Twenty questions on one clock.", test: "oracle-aptitude-verbal" },
      { key: "coding", kind: "coding", name: "Technical Interview 1", covers: "Two data-structures-and-algorithms coding questions, their complexity and debugging.", focus: ["dsa"] },
      { key: "technical", kind: "technical", name: "Technical Interview 2", covers: "Harder data-structure problems, OOP, OS, DBMS, networks, SQL, your resume and puzzles.", focus: ["dsa", "oop", "database", "sql"] },
      { key: "hr", kind: "hr", name: "HR Round", covers: "Strengths, ethics, long-term plans and availability." },
    ],
    firmness: "consistent",
    sourceNote:
      "InterviewBit and GeeksforGeeks agree on two technical interviews (the first two DSA coding questions), then HR. GeeksforGeeks and placementpreparation.io add a hiring-manager or scenario round for some roles; InterviewBit has none, so it is left out.",
    sources: [
      { label: "InterviewBit — Oracle interview", url: "https://www.interviewbit.com/oracle-interview-questions/" },
      { label: "GeeksforGeeks — Oracle recruitment process", url: "https://www.geeksforgeeks.org/oracle-recruitment-process/" },
    ],
  },
  {
    slug: "adobe",
    company: "Adobe",
    family: "product",
    role: "campus member of technical staff",
    difficulty: "intermediate",
    rounds: [
      { key: "oa", kind: "assessment", name: "Adobe — Campus Aptitude", covers: "Three sections of twenty questions, twenty minutes each.", test: "adobe-campus-aptitude" },
      { key: "coding", kind: "coding", name: "Technical Interview", covers: "Data-structures coding from arrays to DP and graphs, plus OS, DBMS, OOP and your projects.", focus: ["dsa"] },
      { key: "design", kind: "system-design", builderRound: "low-level-design", name: "Design Round", covers: "Object-oriented and low-level design, and design patterns.", focus: ["low-level-design", "oop"] },
      { key: "manager", kind: "managerial", name: "Hiring Manager Round", covers: "Your projects, the design decisions in them, ownership and how you approach problems." },
      { key: "hr", kind: "hr", name: "HR Round", covers: "Behavioural questions, motivation and fit." },
    ],
    firmness: "varies",
    sourceNote:
      "Adobe's own page describes its process for every role: a talent conversation, a hiring-manager interview, then skills assessments and team interviews (coding challenges and system design for engineers). Portals differ on the campus count: GeeksforGeeks three technical rounds, InterviewBit two coding, one system design and one object-oriented design; both end with HR. Campus drives usually hold two or three technical rounds; one is practised here.",
    sources: [
      { label: "Adobe — Interviewing at Adobe", url: "https://www.adobe.com/careers/interviewing-at-adobe.html" },
      { label: "InterviewBit — Adobe interview", url: "https://www.interviewbit.com/adobe-interview-questions/" },
      { label: "GeeksforGeeks — Adobe recruitment process", url: "https://www.geeksforgeeks.org/adobe-recruitment-process/" },
    ],
  },
  {
    slug: "salesforce",
    company: "Salesforce",
    family: "product",
    role: "campus AMTS",
    difficulty: "intermediate",
    rounds: [
      { key: "oa", kind: "assessment", name: "Salesforce — SWE Assessment", covers: "The software engineering online assessment.", test: "salesforce-swe-assessment" },
      { key: "coding", kind: "coding", name: "Technical Round 1", covers: "Medium-to-hard data structures and algorithms problems.", focus: ["dsa"] },
      { key: "technical", kind: "technical", name: "Technical Round 2", covers: "Your projects and the technologies in them, in detail, and CS concepts.", focus: ["oop", "database", "backend"] },
      { key: "hr", kind: "hr", name: "HR Round", covers: "Fit, conflict resolution, adaptability and work ethic." },
    ],
    firmness: "varies",
    sourceNote:
      "Thin. Salesforce's own page names no rounds, only that questions may be behavioural, competency-based or situational, and that an on-site interview comes before any offer. GeeksforGeeks is the only portal with an AMTS structure; its design round is left out because other accounts do not report one.",
    sources: [
      { label: "Salesforce — How we hire", url: "https://www.salesforce.com/company/careers/culture/how-we-hire/" },
      { label: "GeeksforGeeks — Salesforce recruitment process", url: "https://www.geeksforgeeks.org/salesforce-recruitment-process/" },
    ],
  },
  {
    slug: "flipkart",
    company: "Flipkart",
    family: "product",
    role: "campus SDE",
    difficulty: "intermediate",
    rounds: [
      { key: "oa", kind: "assessment", name: "Flipkart — Online Coding", covers: "The online coding round.", test: "flipkart-online-coding" },
      { key: "machine", kind: "coding", builderRound: "machine-coding", name: "Machine Coding", covers: "Build a working, modular, testable application in about ninety minutes, then demo it.", focus: ["low-level-design", "dsa"] },
      { key: "psds", kind: "coding", name: "Problem Solving & Data Structures", covers: "Data-structure problems: arrays, trees, graphs, DP and backtracking.", focus: ["dsa"] },
      { key: "manager", kind: "managerial", name: "Hiring Manager Round", covers: "Team fit, your projects and behavioural questions, sometimes a hard data-structure problem." },
    ],
    firmness: "varies",
    sourceNote:
      "InterviewBit lists machine coding, problem solving and data structures, and a hiring-manager round, and says machine coding can be skipped for campus freshers; a GeeksforGeeks SDE-1 account had all three in that order. An HR round appears only in GeeksforGeeks' template and is left out.",
    sources: [
      { label: "InterviewBit — Flipkart interview", url: "https://www.interviewbit.com/flipkart-interview-questions/" },
      { label: "GeeksforGeeks — Flipkart recruitment process", url: "https://www.geeksforgeeks.org/flipkart-recruitment-process/" },
    ],
  },
  {
    slug: "amazon",
    company: "Amazon",
    family: "product",
    role: "SDE new grad",
    difficulty: "intermediate",
    rounds: [
      { key: "oa", kind: "assessment", name: "Amazon — SDE Online Assessment", covers: "Debugging, reasoning and the parts of the assessment that can be reproduced.", test: "amazon-reasoning-debugging" },
      { key: "coding-1", kind: "coding", name: "Technical Interview 1", covers: "Data-structures coding in working code, not pseudocode, with Leadership Principle questions.", focus: ["dsa", "behavioral"] },
      { key: "coding-2", kind: "coding", name: "Technical Interview 2", covers: "Harder data-structures problems and a discussion of your projects, with Leadership Principle questions.", focus: ["dsa", "behavioral"] },
      { key: "bar-raiser", kind: "behavioral", name: "Bar Raiser", covers: "An interviewer from outside the team, focused on the Leadership Principles; may include a coding or basic design question." },
    ],
    firmness: "official",
    sourceNote:
      "Amazon's own pages describe an interview loop in which each interviewer assesses different things and asks Leadership Principle questions; its detailed prep page is for SDE II (four 55-minute interviews, one with systems design). New-grad accounts differ in count — PrepInsta three rounds ending in the Bar Raiser, InterviewBit three DSA rounds and HR — and system design for new grads depends on the team.",
    sources: [
      { label: "Amazon — The interview loop", url: "https://www.amazon.jobs/content/en/how-we-hire/interview-loop" },
      { label: "Amazon — SDE II interview prep", url: "https://www.amazon.jobs/content/en/how-we-hire/sde-ii-interview-prep" },
      { label: "PrepInsta — Amazon recruitment process", url: "https://prepinsta.com/amazon/recruitment-process/" },
    ],
  },
  {
    slug: "google",
    company: "Google",
    family: "product",
    role: "new-grad software engineer",
    difficulty: "intermediate",
    rounds: [
      { key: "oa", kind: "assessment", name: "Google — Online Assessment", covers: "Two problems, ninety minutes.", test: "google-online-assessment" },
      { key: "screen", kind: "coding", name: "Technical Phone Screen", covers: "Forty-five to sixty minutes of algorithmic coding.", focus: ["dsa"] },
      { key: "onsite", kind: "coding", name: "Onsite Coding Interview", covers: "Data structures and algorithms, forty-five minutes; the onsite holds three or four of these.", focus: ["dsa"] },
      { key: "googleyness", kind: "behavioral", name: "Googleyness & Leadership", covers: "Behavioural questions on collaboration, ambiguity and culture fit." },
    ],
    firmness: "consistent",
    sourceNote:
      "levels.fyi and Hello Interview agree: a phone screen, then three or four coding interviews and one Googleyness and Leadership interview, with no system design at new-grad level; team-matching calls with hiring managers follow the hiring committee and are not practised here. Both are US-facing sources; Indian campus loops may differ. Google's own How We Hire page could not be read for this.",
    sources: [
      { label: "levels.fyi — Google SWE interview process", url: "https://www.levels.fyi/blog/google-software-engineer-interview-process.html" },
      { label: "Hello Interview — Google interview process", url: "https://www.hellointerview.com/blog/google-interview-process" },
    ],
  },
  {
    slug: "microsoft",
    company: "Microsoft",
    family: "product",
    role: "new-grad software engineer",
    difficulty: "intermediate",
    rounds: [
      { key: "oa", kind: "assessment", name: "Microsoft — Online Assessment", covers: "The online coding assessment.", test: "microsoft-online-assessment" },
      { key: "initial", kind: "coding", name: "Initial Interview", covers: "Behavioural and technical questions; you may write code.", focus: ["dsa", "behavioral"] },
      { key: "final", kind: "coding", name: "Final Interview Loop", covers: "One-to-one interviews of data-structures coding, with behavioural questions throughout.", focus: ["dsa"] },
      { key: "aa", kind: "managerial", name: "As Appropriate Interview", covers: "A senior interviewer, held only when the earlier rounds go well." },
    ],
    firmness: "official",
    sourceNote:
      "Microsoft's student page describes an initial interview and, if selected, a final interview of one-to-ones asking both behavioural and technical questions. InterviewBit says three or four of the final interviews involve coding and that the As Appropriate interview happens only when the first rounds go well; round counts differ between sources.",
    sources: [
      { label: "Microsoft — Student interviewing", url: "https://careers.microsoft.com/v2/global/en/hiring-tips/student-interviewing" },
      { label: "InterviewBit — Microsoft interview", url: "https://www.interviewbit.com/microsoft-interview-questions/" },
    ],
  },
  {
    slug: "meta",
    company: "Meta",
    family: "product",
    role: "new-grad software engineer",
    difficulty: "intermediate",
    rounds: [
      { key: "oa", kind: "assessment", name: "Meta — Coding Screen", covers: "The technical screen's coding: one or two problems.", test: "meta-coding-screen" },
      { key: "coding-1", kind: "coding", name: "Full-Loop Coding Interview 1", covers: "Forty-five minutes, usually two medium problems.", focus: ["dsa"] },
      { key: "coding-2", kind: "coding", name: "Full-Loop Coding Interview 2", covers: "Forty-five minutes, usually two medium problems.", focus: ["dsa"] },
      { key: "behavioral", kind: "behavioral", name: "Behavioral Interview", covers: "Conflict, growth, ambiguity, driving results and communication." },
    ],
    firmness: "consistent",
    sourceNote:
      "Meta's own pages confirm a 45-minute technical screen with an engineer and a full loop of several conversations. Simplify and Hello Interview agree the new-grad loop is coding rounds plus one behavioural interview, with no design round; they differ on two or three coding rounds. US-facing sources.",
    sources: [
      { label: "Meta — Technical screen prep", url: "https://www.metacareers.com/swe-prep-techscreen/" },
      { label: "Simplify — Meta new-grad SWE interview", url: "https://simplify.jobs/blog/meta-new-grad-swe-interview" },
      { label: "Hello Interview — The Meta SWE interview", url: "https://www.hellointerview.com/blog/the-meta-swe-interview" },
    ],
  },
  {
    slug: "apple",
    company: "Apple",
    family: "product",
    role: "new-grad software engineer",
    difficulty: "intermediate",
    rounds: [
      { key: "oa", kind: "assessment", name: "Apple — Coding Assessment", covers: "The coding assessment.", test: "apple-coding-assessment" },
      { key: "screen", kind: "coding", name: "Technical Screen", covers: "Coding, data structures and algorithms, and depth in your language.", focus: ["dsa"] },
      { key: "technical", kind: "technical", name: "Technical Interview", covers: "Data structures, OOP, OS, networks, DBMS and your projects; teams may set practical tasks.", focus: ["oop", "os-networks", "database"] },
      { key: "behavioral", kind: "behavioral", name: "Behavioral / Hiring Manager Interview", covers: "Teamwork, conflict and your motivation for Apple, in STAR form." },
    ],
    firmness: "varies",
    sourceNote:
      "Thin. Apple publishes no structure and each team runs its own loop (Aced: four to seven rounds, all inside the team you applied to). GeeksforGeeks and Aced agree on technical screens, technical interviews and a final behavioural or hiring-manager interview, with system design mainly for experienced candidates. US-facing sources.",
    sources: [
      { label: "Aced — Apple software engineer interview", url: "https://www.aced.io/guides/apple-software-engineer-interview" },
      { label: "GeeksforGeeks — Apple recruitment process", url: "https://www.geeksforgeeks.org/apple-recruitment-process/" },
    ],
  },
];
