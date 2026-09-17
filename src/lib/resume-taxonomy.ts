/**
 * The vocabulary the resume analyzer matches against.
 *
 * Everything here is a plain table: technical skills with their aliases and
 * a category, soft skills, domain phrases, the verbs that open a strong or a
 * weak bullet, the section titles a resume might use, and per-role profiles
 * for when there is no job description to read requirements from. The
 * scoring engine (lib/resume-scoring.ts) and the JD parser
 * (lib/resume-requirements.ts) both read from here, so a skill added once is
 * found in a JD and in a resume alike.
 *
 * Matching is by regular expression, built by `termPattern` below: a term is
 * bounded by characters that are not part of an identifier, so "Java" does
 * not match inside "JavaScript" and "C" does not match inside "C++". Short
 * ambiguous names ("Go", "C") match case-sensitively; everything else is
 * case-insensitive.
 */

export type SkillCategory =
  | "language"
  | "framework"
  | "database"
  | "cloud"
  | "devops"
  | "data"
  | "ml"
  | "mobile"
  | "testing"
  | "tooling"
  | "concept"
  | "design"
  | "security"
  | "product";

export interface SkillEntry {
  /** Canonical display name. */
  name: string;
  /** Other spellings that count as the same skill, matched the same way. */
  aliases?: string[];
  category: SkillCategory;
  /** Match exactly as written — for names that are also common words. */
  caseSensitive?: boolean;
}

/* ── technical skills ──────────────────────────────────────────────────── */

export const SKILLS: SkillEntry[] = [
  // languages
  { name: "Java", category: "language" },
  { name: "Python", category: "language" },
  { name: "JavaScript", aliases: ["JS", "ES6", "ECMAScript"], category: "language" },
  { name: "TypeScript", aliases: ["TS"], category: "language" },
  { name: "C++", aliases: ["cpp", "C plus plus"], category: "language" },
  { name: "C#", aliases: ["C sharp", "csharp"], category: "language" },
  { name: "C", aliases: ["C programming", "C language"], category: "language", caseSensitive: true },
  { name: "Go", aliases: ["Golang"], category: "language", caseSensitive: true },
  { name: "Rust", category: "language" },
  { name: "Kotlin", category: "language" },
  { name: "Swift", category: "language" },
  { name: "Ruby", category: "language" },
  { name: "PHP", category: "language" },
  { name: "Scala", category: "language" },
  { name: "Dart", category: "language" },
  { name: "R", aliases: ["R programming", "R language"], category: "language", caseSensitive: true },
  { name: "MATLAB", category: "language" },
  { name: "Bash", aliases: ["Shell scripting", "Shell", "Unix shell"], category: "language" },
  { name: "SQL", category: "language" },
  { name: "HTML", aliases: ["HTML5"], category: "language" },
  { name: "CSS", aliases: ["CSS3"], category: "language" },
  { name: "Objective-C", category: "language" },
  { name: "Perl", category: "language" },
  { name: "Elixir", category: "language" },
  { name: "Haskell", category: "language" },
  { name: "Solidity", category: "language" },

  // frameworks and runtimes
  { name: "Spring Boot", aliases: ["SpringBoot", "Spring-Boot"], category: "framework" },
  { name: "Spring", aliases: ["Spring Framework", "Spring MVC"], category: "framework" },
  { name: "Hibernate", aliases: ["JPA"], category: "framework" },
  { name: "Node.js", aliases: ["NodeJS", "Node js"], category: "framework" },
  { name: "Express", aliases: ["Express.js", "ExpressJS"], category: "framework" },
  { name: "NestJS", aliases: ["Nest.js"], category: "framework" },
  { name: "React", aliases: ["React.js", "ReactJS"], category: "framework" },
  { name: "Next.js", aliases: ["NextJS"], category: "framework" },
  { name: "Angular", aliases: ["AngularJS"], category: "framework" },
  { name: "Vue", aliases: ["Vue.js", "VueJS"], category: "framework" },
  { name: "Svelte", category: "framework" },
  { name: "Redux", category: "framework" },
  { name: "Django", category: "framework" },
  { name: "Flask", category: "framework" },
  { name: "FastAPI", category: "framework" },
  { name: "Ruby on Rails", aliases: ["Rails"], category: "framework" },
  { name: "Laravel", category: "framework" },
  { name: ".NET", aliases: ["dotnet", ".NET Core", "ASP.NET", "ASP.NET Core"], category: "framework" },
  { name: "GraphQL", category: "framework" },
  { name: "gRPC", category: "framework" },
  { name: "REST APIs", aliases: ["REST", "RESTful", "REST API", "RESTful APIs", "REST services"], category: "concept" },
  { name: "WebSockets", aliases: ["WebSocket", "Socket.io"], category: "framework" },
  { name: "Tailwind CSS", aliases: ["Tailwind"], category: "framework" },
  { name: "Bootstrap", category: "framework" },
  { name: "Material UI", aliases: ["MUI"], category: "framework" },
  { name: "jQuery", category: "framework" },
  { name: "Webpack", category: "tooling" },
  { name: "Vite", category: "tooling" },
  { name: "Electron", category: "framework" },
  { name: "Three.js", category: "framework" },

  // mobile
  { name: "React Native", category: "mobile" },
  { name: "Flutter", category: "mobile" },
  { name: "Android", aliases: ["Android SDK", "Android development"], category: "mobile" },
  { name: "iOS", aliases: ["iOS development"], category: "mobile" },
  { name: "SwiftUI", category: "mobile" },
  { name: "Jetpack Compose", category: "mobile" },

  // databases
  { name: "MySQL", category: "database" },
  { name: "PostgreSQL", aliases: ["Postgres"], category: "database" },
  { name: "MongoDB", aliases: ["Mongo"], category: "database" },
  { name: "Redis", category: "database" },
  { name: "SQLite", category: "database" },
  { name: "Oracle", aliases: ["Oracle DB", "Oracle Database"], category: "database" },
  { name: "SQL Server", aliases: ["MSSQL", "Microsoft SQL Server"], category: "database" },
  { name: "Cassandra", category: "database" },
  { name: "DynamoDB", category: "database" },
  { name: "Elasticsearch", aliases: ["Elastic Search"], category: "database" },
  { name: "Firebase", aliases: ["Firestore"], category: "database" },
  { name: "Neo4j", category: "database" },
  { name: "MariaDB", category: "database" },
  { name: "Snowflake", category: "data" },
  { name: "BigQuery", category: "data" },
  { name: "Redshift", category: "data" },
  { name: "Prisma", aliases: ["Prisma ORM"], category: "framework" },
  { name: "Mongoose", category: "framework" },
  { name: "Sequelize", category: "framework" },

  // cloud
  { name: "AWS", aliases: ["Amazon Web Services"], category: "cloud" },
  { name: "Azure", aliases: ["Microsoft Azure"], category: "cloud" },
  { name: "Google Cloud", aliases: ["GCP", "Google Cloud Platform"], category: "cloud" },
  { name: "EC2", category: "cloud" },
  { name: "S3", aliases: ["Amazon S3"], category: "cloud" },
  { name: "Lambda", aliases: ["AWS Lambda"], category: "cloud" },
  { name: "Serverless", category: "concept" },
  { name: "Cloud infrastructure", aliases: ["cloud computing", "cloud services", "cloud-native"], category: "concept" },
  { name: "Vercel", category: "cloud" },
  { name: "Heroku", category: "cloud" },
  { name: "Railway", category: "cloud" },
  { name: "DigitalOcean", category: "cloud" },
  { name: "Cloudflare", category: "cloud" },

  // devops
  { name: "Docker", category: "devops" },
  { name: "Kubernetes", aliases: ["K8s"], category: "devops" },
  { name: "Terraform", category: "devops" },
  { name: "Ansible", category: "devops" },
  { name: "Jenkins", category: "devops" },
  { name: "GitHub Actions", category: "devops" },
  { name: "GitLab CI", aliases: ["GitLab"], category: "devops" },
  { name: "CI/CD", aliases: ["CI CD", "continuous integration", "continuous delivery", "continuous deployment"], category: "devops" },
  { name: "Linux", aliases: ["Unix"], category: "devops" },
  { name: "Nginx", category: "devops" },
  { name: "Apache", category: "devops" },
  { name: "Prometheus", category: "devops" },
  { name: "Grafana", category: "devops" },
  { name: "Datadog", category: "devops" },
  { name: "Helm", category: "devops" },
  { name: "Git", category: "tooling" },
  { name: "GitHub", category: "tooling" },
  { name: "Jira", category: "tooling" },
  { name: "Postman", category: "tooling" },
  { name: "Swagger", aliases: ["OpenAPI"], category: "tooling" },
  { name: "Figma", category: "design" },
  { name: "VS Code", aliases: ["Visual Studio Code"], category: "tooling" },
  { name: "IntelliJ", aliases: ["IntelliJ IDEA"], category: "tooling" },

  // messaging and data platforms
  { name: "Kafka", aliases: ["Apache Kafka"], category: "data" },
  { name: "RabbitMQ", category: "data" },
  { name: "Spark", aliases: ["Apache Spark", "PySpark"], category: "data" },
  { name: "Hadoop", category: "data" },
  { name: "Airflow", aliases: ["Apache Airflow"], category: "data" },
  { name: "Pandas", category: "data" },
  { name: "NumPy", category: "data" },
  { name: "Matplotlib", category: "data" },
  { name: "Tableau", category: "data" },
  { name: "Power BI", aliases: ["PowerBI"], category: "data" },
  { name: "Excel", aliases: ["Microsoft Excel", "MS Excel"], category: "data" },
  { name: "ETL", aliases: ["ETL pipelines", "data pipelines"], category: "data" },
  { name: "Data warehousing", aliases: ["data warehouse"], category: "data" },
  { name: "dbt", category: "data" },
  { name: "Databricks", category: "data" },

  // ml
  { name: "Machine Learning", aliases: ["ML"], category: "ml" },
  { name: "Deep Learning", category: "ml" },
  { name: "TensorFlow", category: "ml" },
  { name: "PyTorch", category: "ml" },
  { name: "Keras", category: "ml" },
  { name: "scikit-learn", aliases: ["sklearn", "scikit learn"], category: "ml" },
  { name: "NLP", aliases: ["Natural Language Processing"], category: "ml" },
  { name: "Computer Vision", aliases: ["OpenCV"], category: "ml" },
  { name: "LLMs", aliases: ["LLM", "Large Language Models", "Generative AI", "GenAI"], category: "ml" },
  { name: "LangChain", category: "ml" },
  { name: "Hugging Face", aliases: ["HuggingFace", "Transformers"], category: "ml" },
  { name: "Data Science", category: "ml" },
  { name: "Statistics", aliases: ["statistical analysis", "statistical modeling"], category: "ml" },
  { name: "A/B testing", aliases: ["AB testing", "experimentation"], category: "product" },

  // testing
  { name: "Jest", category: "testing" },
  { name: "Mocha", category: "testing" },
  { name: "Cypress", category: "testing" },
  { name: "Playwright", category: "testing" },
  { name: "Selenium", category: "testing" },
  { name: "JUnit", category: "testing" },
  { name: "pytest", category: "testing" },
  { name: "Unit testing", aliases: ["unit tests"], category: "testing" },
  { name: "Test automation", aliases: ["automation testing", "automated testing"], category: "testing" },
  { name: "TDD", aliases: ["test-driven development", "test driven development"], category: "testing" },
  { name: "Manual testing", category: "testing" },

  // concepts
  { name: "Data Structures", aliases: ["DSA", "data structures and algorithms"], category: "concept" },
  { name: "Algorithms", category: "concept" },
  { name: "OOP", aliases: ["object-oriented programming", "object oriented programming", "object-oriented design"], category: "concept" },
  { name: "System Design", aliases: ["systems design"], category: "concept" },
  { name: "Distributed Systems", aliases: ["distributed computing"], category: "concept" },
  { name: "Microservices", aliases: ["microservice architecture", "micro-services"], category: "concept" },
  { name: "Multithreading", aliases: ["concurrency", "multi-threading", "concurrent programming"], category: "concept" },
  { name: "Design Patterns", category: "concept" },
  { name: "Agile", aliases: ["Scrum", "Agile methodologies", "Kanban"], category: "concept" },
  { name: "Operating Systems", category: "concept" },
  { name: "Computer Networks", aliases: ["networking", "TCP/IP"], category: "concept" },
  { name: "DBMS", aliases: ["database management"], category: "concept" },
  { name: "Caching", category: "concept" },
  { name: "Message queues", aliases: ["message queue", "event-driven", "event driven architecture", "pub/sub"], category: "concept" },
  { name: "Performance optimization", aliases: ["performance tuning", "optimization"], category: "concept" },
  { name: "Scalability", aliases: ["scalable systems", "high availability"], category: "concept" },
  { name: "Debugging", category: "concept" },
  { name: "Code review", aliases: ["code reviews"], category: "concept" },
  { name: "API design", aliases: ["API development", "API integration"], category: "concept" },
  { name: "Authentication", aliases: ["OAuth", "JWT", "OAuth2", "SSO"], category: "security" },
  { name: "Security", aliases: ["application security", "cybersecurity", "information security"], category: "security" },
  { name: "Penetration testing", aliases: ["pentesting"], category: "security" },
  { name: "Cryptography", aliases: ["encryption"], category: "security" },
  { name: "Blockchain", aliases: ["Web3", "smart contracts"], category: "concept" },
  { name: "Responsive design", aliases: ["responsive web design"], category: "design" },
  { name: "UI/UX", aliases: ["UX", "user experience", "UI design", "UX design"], category: "design" },
  { name: "Accessibility", aliases: ["a11y", "WCAG"], category: "design" },
  { name: "Product management", aliases: ["product roadmap", "product strategy"], category: "product" },
  { name: "Data analysis", aliases: ["data analytics", "analytics"], category: "data" },
  { name: "Data visualization", aliases: ["data visualisation"], category: "data" },
  { name: "Cloud security", category: "security" },
  { name: "Monitoring", aliases: ["observability", "logging"], category: "devops" },
  { name: "Infrastructure as Code", aliases: ["IaC"], category: "devops" },
  { name: "Site Reliability", aliases: ["SRE", "site reliability engineering"], category: "devops" },
  { name: "Embedded systems", aliases: ["embedded C", "firmware", "RTOS"], category: "concept" },
  { name: "Game development", aliases: ["Unity", "Unreal Engine"], category: "framework" },
  { name: "Salesforce", category: "framework" },
  { name: "SAP", category: "framework" },
  { name: "ServiceNow", category: "framework" },
  { name: "Power Automate", category: "tooling" },
  { name: "SEO", category: "product" },
  { name: "Digital marketing", category: "product" },
  { name: "Content writing", category: "product" },
  { name: "Technical writing", aliases: ["documentation"], category: "product" },
];

/* ── soft skills ────────────────────────────────────────────────────────── */

export const SOFT_SKILLS: string[] = [
  "leadership",
  "communication",
  "problem solving",
  "problem-solving",
  "collaboration",
  "teamwork",
  "team player",
  "mentoring",
  "mentorship",
  "ownership",
  "time management",
  "adaptability",
  "critical thinking",
  "analytical",
  "attention to detail",
  "stakeholder management",
  "cross-functional",
  "self-motivated",
  "fast learner",
  "presentation",
  "negotiation",
  "decision making",
  "conflict resolution",
  "customer focus",
  "initiative",
  "creativity",
  "organized",
  "planning",
  "prioritization",
];

/* ── domain terms ───────────────────────────────────────────────────────── */

export const DOMAIN_TERMS: string[] = [
  "fintech",
  "payments",
  "payment systems",
  "banking",
  "e-commerce",
  "ecommerce",
  "healthcare",
  "healthtech",
  "edtech",
  "education",
  "logistics",
  "supply chain",
  "insurance",
  "insurtech",
  "telecom",
  "gaming",
  "adtech",
  "advertising",
  "retail",
  "SaaS",
  "B2B",
  "B2C",
  "marketplace",
  "real-time systems",
  "low latency",
  "high-throughput",
  "trading",
  "capital markets",
  "media",
  "streaming",
  "IoT",
  "automotive",
  "aerospace",
  "cloud infrastructure",
  "developer tools",
  "enterprise software",
  "consumer apps",
  "social media",
  "travel",
  "hospitality",
  "government",
  "non-profit",
  "startup",
  "recommendation systems",
  "search",
  "fraud detection",
  "compliance",
  "KYC",
  "UPI",
  "ERP",
  "CRM",
];

/* ── verbs ──────────────────────────────────────────────────────────────── */

/** Openings that say what the person did without saying what happened. */
export const WEAK_OPENINGS: string[] = [
  "worked on",
  "worked with",
  "worked in",
  "worked as",
  "helped",
  "helped with",
  "responsible for",
  "was responsible for",
  "did",
  "made",
  "handled",
  "involved in",
  "participated in",
  "assisted",
  "assisted in",
  "assisted with",
  "tasked with",
  "duties included",
  "in charge of",
  "took part in",
  "was part of",
  "part of",
  "learned",
  "familiar with",
  "exposure to",
  "used",
  "utilized",
  "tried",
  "attempted",
  "supported",
];

/** Verbs that open a bullet with an action. Past tense first, present for a current role. */
export const STRONG_VERBS: string[] = [
  "built", "designed", "developed", "engineered", "architected", "implemented", "launched", "shipped", "delivered",
  "led", "drove", "owned", "spearheaded", "founded", "established", "initiated", "pioneered",
  "improved", "optimized", "optimised", "reduced", "increased", "accelerated", "cut", "boosted", "grew", "scaled",
  "automated", "migrated", "refactored", "redesigned", "rebuilt", "modernized", "streamlined", "simplified",
  "integrated", "deployed", "released", "maintained", "monitored", "secured", "hardened",
  "analyzed", "analysed", "researched", "investigated", "evaluated", "measured", "modeled", "modelled", "forecasted",
  "mentored", "coached", "trained", "onboarded", "managed", "coordinated", "collaborated", "partnered",
  "wrote", "authored", "documented", "presented", "published", "taught",
  "tested", "debugged", "resolved", "fixed", "diagnosed", "troubleshot",
  "created", "produced", "generated", "achieved", "won", "ranked", "selected", "awarded", "earned",
  "negotiated", "planned", "organized", "organised", "prioritized", "defined", "specified", "standardized",
  // present tense, for a current role
  "build", "design", "develop", "lead", "own", "drive", "maintain", "manage", "mentor", "optimize", "ship", "deliver",
];

/* ── section headings ───────────────────────────────────────────────────── */

export type SectionKey =
  | "contact"
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "projects"
  | "certifications"
  | "achievements"
  | "publications"
  | "languages"
  | "interests"
  | "volunteer"
  | "references"
  | "other";

/** Heading text (lower-cased, punctuation stripped) → canonical section. */
export const SECTION_HEADINGS: Array<{ key: SectionKey; titles: string[] }> = [
  { key: "summary", titles: ["summary", "professional summary", "profile", "professional profile", "about", "about me", "objective", "career objective", "career summary", "executive summary", "overview", "introduction"] },
  {
    key: "experience",
    titles: ["experience", "work experience", "professional experience", "employment", "employment history", "work history", "career history", "internships", "internship experience", "internship", "relevant experience", "industry experience", "professional background", "work"],
  },
  { key: "education", titles: ["education", "academic background", "academics", "academic qualifications", "educational qualifications", "educational background", "qualifications", "academic history", "education and training"] },
  {
    key: "skills",
    titles: ["skills", "technical skills", "core skills", "key skills", "core competencies", "competencies", "technologies", "tech stack", "technical proficiencies", "areas of expertise", "expertise", "tools and technologies", "tools", "technical summary", "skills and tools", "skills & tools", "technical expertise", "programming skills", "skill set", "skillset"],
  },
  { key: "projects", titles: ["projects", "personal projects", "academic projects", "key projects", "selected projects", "project experience", "notable projects", "side projects", "open source", "open source contributions", "portfolio"] },
  { key: "certifications", titles: ["certifications", "certificates", "certification", "licenses", "licenses and certifications", "licences", "courses", "training", "professional development", "certifications and training", "courses and certifications"] },
  { key: "achievements", titles: ["achievements", "accomplishments", "awards", "honors", "honours", "awards and honors", "awards and achievements", "honors and awards", "recognition", "extracurricular", "extracurricular activities", "activities", "leadership", "positions of responsibility", "co-curricular activities", "competitions", "hackathons"] },
  { key: "publications", titles: ["publications", "research", "research experience", "papers", "patents"] },
  { key: "languages", titles: ["languages", "languages known", "language proficiency", "spoken languages"] },
  { key: "interests", titles: ["interests", "hobbies", "hobbies and interests", "personal interests"] },
  { key: "volunteer", titles: ["volunteer", "volunteering", "volunteer experience", "community service", "social work"] },
  { key: "references", titles: ["references", "referees", "declaration"] },
];

/* ── role profiles (no JD given) ────────────────────────────────────────── */

export interface RoleProfile {
  key: string;
  /** Lower-case fragments of a role title that pick this profile. */
  match: string[];
  required: string[];
  preferred: string[];
  /** Phrases a recruiter for this role expects to see somewhere. */
  keywords: string[];
  /** What the experience section should show, in one line, for the model. */
  expects: string;
}

export const ROLE_PROFILES: RoleProfile[] = [
  {
    key: "backend",
    match: ["backend", "back-end", "back end", "server-side", "api engineer", "platform engineer"],
    required: ["REST APIs", "SQL", "Data Structures", "Git"],
    preferred: ["Java", "Python", "Node.js", "Spring Boot", "Docker", "Redis", "PostgreSQL", "MySQL", "Microservices", "AWS", "Kafka", "Unit testing", "System Design", "Caching"],
    keywords: ["API", "database", "scalable", "services", "backend", "performance"],
    expects: "APIs or services built and shipped, data modelling, performance or reliability work, tests, deployment.",
  },
  {
    key: "frontend",
    match: ["frontend", "front-end", "front end", "ui engineer", "web developer", "react developer", "angular developer", "vue developer", "ui developer"],
    required: ["JavaScript", "HTML", "CSS", "React", "Git"],
    preferred: ["TypeScript", "Redux", "Next.js", "Responsive design", "Accessibility", "REST APIs", "Jest", "Webpack", "Tailwind CSS", "Performance optimization", "UI/UX"],
    keywords: ["user interface", "components", "responsive", "web application", "frontend", "performance"],
    expects: "User-facing features built, component work, responsiveness, performance and accessibility, testing.",
  },
  {
    key: "fullstack",
    match: ["full stack", "full-stack", "fullstack", "mern", "mean stack", "software developer", "web engineer"],
    required: ["JavaScript", "React", "Node.js", "SQL", "REST APIs", "Git"],
    preferred: ["TypeScript", "Express", "MongoDB", "PostgreSQL", "Docker", "AWS", "Redux", "Next.js", "Unit testing", "CI/CD"],
    keywords: ["full stack", "end-to-end", "web application", "API", "database", "deployed"],
    expects: "End-to-end features across the UI and the API, a database, deployment.",
  },
  {
    key: "mobile",
    match: ["android", "ios", "mobile", "flutter", "react native"],
    required: ["Android", "Kotlin", "Git", "REST APIs"],
    preferred: ["Java", "Swift", "iOS", "Flutter", "React Native", "Firebase", "Jetpack Compose", "SwiftUI", "Unit testing", "SQLite"],
    keywords: ["app", "mobile", "Play Store", "App Store", "users", "release"],
    expects: "Apps shipped to a store, platform APIs used, performance or crash work, releases.",
  },
  {
    key: "data-engineer",
    match: ["data engineer", "etl", "big data", "data platform", "analytics engineer"],
    required: ["SQL", "Python", "ETL", "Data warehousing"],
    preferred: ["Spark", "Airflow", "Kafka", "AWS", "Snowflake", "BigQuery", "Hadoop", "dbt", "Databricks", "Pandas", "Docker"],
    keywords: ["pipeline", "data warehouse", "batch", "streaming", "data quality"],
    expects: "Pipelines built, data volumes handled, warehouses and orchestration, reliability and cost work.",
  },
  {
    key: "data-scientist",
    match: ["data scientist", "machine learning", "ml engineer", "ai engineer", "applied scientist", "deep learning", "nlp", "computer vision"],
    required: ["Python", "Machine Learning", "Statistics", "SQL", "Pandas"],
    preferred: ["PyTorch", "TensorFlow", "scikit-learn", "NumPy", "Deep Learning", "NLP", "Computer Vision", "LLMs", "Spark", "AWS", "Docker", "Data visualization"],
    keywords: ["model", "accuracy", "dataset", "features", "deployed", "experiment"],
    expects: "Models built and evaluated with metrics, data handled, deployment or business impact.",
  },
  {
    key: "data-analyst",
    match: ["data analyst", "business analyst", "analyst", "business intelligence", "bi developer", "reporting"],
    required: ["SQL", "Excel", "Data analysis", "Data visualization"],
    preferred: ["Python", "Tableau", "Power BI", "Statistics", "Pandas", "A/B testing", "BigQuery", "ETL"],
    keywords: ["dashboard", "report", "insights", "stakeholders", "KPIs", "metrics"],
    expects: "Analyses and dashboards delivered, decisions they informed, tools used, stakeholders served.",
  },
  {
    key: "devops",
    match: ["devops", "sre", "site reliability", "cloud engineer", "infrastructure", "platform", "systems engineer", "cloud architect"],
    required: ["Linux", "Docker", "CI/CD", "AWS", "Bash"],
    preferred: ["Kubernetes", "Terraform", "Ansible", "Jenkins", "GitHub Actions", "Prometheus", "Grafana", "Python", "Monitoring", "Infrastructure as Code", "Nginx", "Azure", "Google Cloud"],
    keywords: ["deployment", "uptime", "infrastructure", "automation", "incident", "cost"],
    expects: "Infrastructure automated, deployments and uptime, incidents handled, cost or reliability numbers.",
  },
  {
    key: "qa",
    match: ["qa", "quality", "test engineer", "sdet", "automation engineer", "tester"],
    required: ["Test automation", "Manual testing", "Selenium", "Git"],
    preferred: ["Java", "Python", "JavaScript", "Cypress", "Playwright", "JUnit", "pytest", "Postman", "CI/CD", "Jira", "REST APIs", "SQL"],
    keywords: ["test cases", "automation", "regression", "defects", "coverage", "release"],
    expects: "Test suites built, coverage and defect numbers, automation frameworks, release quality.",
  },
  {
    key: "security",
    match: ["security", "cybersecurity", "penetration", "soc analyst", "infosec"],
    required: ["Security", "Computer Networks", "Linux"],
    preferred: ["Penetration testing", "Python", "Cryptography", "Cloud security", "AWS", "Bash", "Monitoring", "Authentication"],
    keywords: ["vulnerabilities", "threat", "incident", "audit", "compliance", "OWASP"],
    expects: "Vulnerabilities found or fixed, audits, tooling, incident response, certifications.",
  },
  {
    key: "product",
    match: ["product manager", "product owner", "program manager", "project manager", "product analyst", "apm"],
    required: ["Product management", "Agile", "Data analysis", "Communication"],
    preferred: ["A/B testing", "SQL", "Jira", "Figma", "UI/UX", "Stakeholder management", "Excel"],
    keywords: ["roadmap", "users", "launch", "metrics", "stakeholders", "requirements", "prioritization"],
    expects: "Products or features launched, metrics moved, stakeholders aligned, decisions owned.",
  },
  {
    key: "design",
    match: ["designer", "ux", "ui/ux", "product design", "visual design", "graphic"],
    required: ["Figma", "UI/UX", "Responsive design"],
    preferred: ["Accessibility", "HTML", "CSS", "Prototyping", "User research", "Design systems"],
    keywords: ["wireframes", "prototypes", "user research", "design system", "usability"],
    expects: "Designs shipped, research done, usability outcomes, systems built.",
  },
  {
    key: "embedded",
    match: ["embedded", "firmware", "hardware", "iot engineer", "vlsi", "electronics"],
    required: ["C", "Embedded systems", "Linux"],
    preferred: ["C++", "Python", "Computer Networks", "Git", "MATLAB"],
    keywords: ["microcontroller", "firmware", "sensors", "protocols", "real-time"],
    expects: "Firmware or hardware shipped, protocols and platforms, testing and debugging on device.",
  },
  // Last: the generic profile, matched only when nothing more specific did.
  {
    key: "software",
    match: ["software engineer", "software development engineer", "sde", "member of technical staff", "programmer", "engineer", "developer"],
    required: ["Data Structures", "Algorithms", "OOP", "Git", "SQL"],
    preferred: ["Java", "Python", "C++", "JavaScript", "REST APIs", "System Design", "Unit testing", "Linux", "Docker", "AWS"],
    keywords: ["software", "design", "implement", "scalable", "code review", "testing"],
    expects: "Software built and shipped, with the languages and systems involved, testing and measurable outcomes.",
  },
];

/**
 * The profile a role title maps to; null only for an empty title. Profiles
 * are listed specific to generic and the first match wins, so "Senior
 * Backend Software Engineer" is backend and "Full Stack Developer" is full
 * stack; the generic software profile catches whatever is left, including
 * titles the list has never seen.
 */
export function roleProfileFor(role: string | null | undefined): RoleProfile | null {
  const text = (role ?? "").toLowerCase().trim();
  if (!text) return null;
  for (const profile of ROLE_PROFILES) {
    if (profile.match.some((fragment) => text.includes(fragment))) return profile;
  }
  return ROLE_PROFILES[ROLE_PROFILES.length - 1] ?? null;
}

/* ── matching helpers ───────────────────────────────────────────────────── */

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * A pattern for one term, bounded so it matches a whole token. The boundary
 * is "not a letter, digit, + or #" on either side rather than `\b`, because
 * `\b` treats "+" and "#" as non-word: "C" would match inside "C++" and "C#".
 * A term that ends in a symbol (".NET", "C++") keeps its literal ending.
 * Spaces inside a term match any run of whitespace or a hyphen, so "Spring
 * Boot", "Spring-Boot" and "spring  boot" are one skill.
 */
export function termPattern(term: string, caseSensitive = false): RegExp {
  const body = escapeRegex(term.trim()).replace(/\s+/g, "[\\s-]*");
  return new RegExp(`(?<![A-Za-z0-9+#])${body}(?![A-Za-z0-9+#])`, caseSensitive ? "g" : "gi");
}

export interface CompiledSkill extends SkillEntry {
  patterns: RegExp[];
}

let compiled: CompiledSkill[] | null = null;

/** Every skill with its patterns compiled once. */
export function compiledSkills(): CompiledSkill[] {
  if (!compiled) {
    compiled = SKILLS.map((s) => ({
      ...s,
      patterns: [s.name, ...(s.aliases ?? [])].map((t) => termPattern(t, s.caseSensitive)),
    }));
  }
  return compiled;
}

/** Skill display name → entry, case-insensitive on name and aliases. */
export function skillByName(name: string): SkillEntry | null {
  const wanted = name.trim().toLowerCase();
  for (const s of SKILLS) {
    if (s.name.toLowerCase() === wanted) return s;
    if (s.aliases?.some((a) => a.toLowerCase() === wanted)) return s;
  }
  return null;
}

/** Does the text contain the skill (by any alias)? */
export function skillMentioned(skill: CompiledSkill, text: string): boolean {
  return skill.patterns.some((p) => {
    p.lastIndex = 0;
    return p.test(text);
  });
}

/** Every skill from the taxonomy that the text mentions, in taxonomy order. */
export function skillsIn(text: string): CompiledSkill[] {
  return compiledSkills().filter((s) => skillMentioned(s, text));
}
