import type { AptitudeSeed } from "./types.js";

/**
 * Verbal ability: vocabulary, sentence correction, completion and para
 * jumbles, and reading comprehension. Passages are short on purpose — the
 * skill being drilled is precision, not stamina.
 */
export const VERBAL: AptitudeSeed[] = [
  /* ── Synonyms & Antonyms ───────────────────────────────────────── */
  {
    slug: "vo-synonym-abate",
    topic: "vocabulary",
    title: "Synonym of ABATE",
    prompt: "Choose the word closest in meaning to **ABATE**:\n\n> The storm began to *abate* by midnight.",
    options: ["Subside", "Persist", "Scatter", "Intensify"],
    answer: 0,
    difficulty: "easy",
    hints: ["Read the sentence: is the storm getting stronger or weaker?", "Abate means to lessen or die down."],
    solution:
      "1. *Abate* means to become less intense or widespread.\n2. **Subside** carries the same sense of dying down.\n3. *Intensify* and *persist* are opposites; *scatter* describes direction, not strength.\n\nAnswer: **Subside**.",
    approach:
      "Read the word inside its sentence before looking at the options — context rules out half of them. Then eliminate opposites and words that describe a different quality altogether.",
    tags: ["synonym"],
    timeTargetSec: 40,
  },
  {
    slug: "vo-antonym-frugal",
    topic: "vocabulary",
    title: "Antonym of FRUGAL",
    prompt: "Choose the word most **opposite** in meaning to **FRUGAL**:",
    options: ["Thrifty", "Extravagant", "Cautious", "Modest"],
    answer: 1,
    difficulty: "easy",
    hints: ["Frugal describes someone careful with money.", "Which option describes spending freely?"],
    solution:
      "1. *Frugal* means sparing or economical.\n2. **Extravagant** — spending far more than necessary — is its opposite.\n3. *Thrifty* is a synonym; *cautious* and *modest* are near neighbours, not opposites.\n\nAnswer: **Extravagant**.",
    approach:
      "In antonym questions the trap is usually a synonym sitting first in the list. Define the word in your own words, then look specifically for its reverse rather than for something merely different.",
    tags: ["antonym"],
    timeTargetSec: 40,
  },
  {
    slug: "vo-synonym-meticulous",
    topic: "vocabulary",
    title: "Synonym of METICULOUS",
    prompt: "Choose the word closest in meaning to **METICULOUS**:\n\n> She kept *meticulous* records of every experiment.",
    options: ["Hurried", "Occasional", "Careless", "Thorough"],
    answer: 3,
    difficulty: "easy",
    hints: ["Meticulous describes attention to detail.", "Which option means complete and careful?"],
    solution: "1. *Meticulous* means showing great attention to detail.\n2. **Thorough** is the closest match.\n\nAnswer: **Thorough**.",
    approach: "Words ending in -ous often describe a quality of character. Substitute each option back into the sentence; only the right one leaves the meaning intact.",
    tags: ["synonym"],
    timeTargetSec: 35,
  },
  {
    slug: "vo-antonym-transient",
    topic: "vocabulary",
    title: "Antonym of TRANSIENT",
    prompt: "Choose the word most **opposite** in meaning to **TRANSIENT**:",
    options: ["Permanent", "Fragile", "Sudden", "Brief"],
    answer: 0,
    difficulty: "medium",
    hints: ["Transient describes something lasting only a short time.", "The opposite is something that lasts."],
    solution:
      "1. *Transient* means short-lived or passing.\n2. **Permanent** — lasting indefinitely — is its opposite.\n3. *Brief* is a synonym; *fragile* and *sudden* describe different qualities.\n\nAnswer: **Permanent**.",
    approach: "The root *trans-* (across, passing through) hints at movement and impermanence. Root recognition settles many vocabulary questions without the definition.",
    tags: ["antonym", "roots"],
    timeTargetSec: 40,
  },
  {
    slug: "vo-word-in-context-candid",
    topic: "vocabulary",
    title: "The right sense of CANDID",
    prompt: "In which sentence is **candid** used correctly?",
    options: ["He candid the door before leaving.", "The room was very candid and bright.", "The photograph was candid about the weather.", "She gave a candid account of her mistakes."],
    answer: 3,
    difficulty: "medium",
    hints: ["Candid is an adjective meaning frank or honest.", "It describes speech or a person, not an object or an action."],
    solution:
      "1. *Candid* means truthful and straightforward, especially about something awkward.\n2. Only **'a candid account of her mistakes'** uses it that way.\n3. The others misuse it as a verb, or apply it to a room and the weather, where it makes no sense.\n\nAnswer: **She gave a candid account of her mistakes.**",
    approach: "Usage questions test part of speech as much as meaning. Check first whether the word is being used as the right kind of word, then whether the sense fits.",
    tags: ["usage"],
    timeTargetSec: 50,
  },

  /* ── Sentence Correction ───────────────────────────────────────── */
  {
    slug: "sc-subject-verb-agreement",
    topic: "sentence-correction",
    title: "Subject–verb agreement",
    prompt: "Choose the correct sentence:",
    options: ["The list of items were on the desk.", "The list of items have been on the desk.", "The list of items are on the desk.", "The list of items is on the desk."],
    answer: 3,
    difficulty: "easy",
    hints: ["Find the true subject: is it 'list' or 'items'?", "The subject is 'list', which is singular."],
    solution:
      "1. The subject is **list** (singular); *of items* is a prepositional phrase that does not change it.\n2. A singular subject takes *is*.\n\nAnswer: **The list of items is on the desk.**",
    approach:
      "Cross out every prepositional phrase between the subject and the verb, then check agreement on what remains. Nouns nearest the verb are deliberately placed to mislead.",
    tags: ["agreement"],
    timeTargetSec: 40,
  },
  {
    slug: "sc-dangling-modifier",
    topic: "sentence-correction",
    title: "A misplaced modifier",
    prompt: "Choose the correct sentence:",
    options: ["Running down the street, Ram missed the bus.", "Ram missed the bus, running down the street by him.", "The bus, running down the street, was missed by Ram.", "Running down the street, the bus was missed by Ram."],
    answer: 0,
    difficulty: "medium",
    hints: ["Who was running? The opening phrase must describe the subject that follows it.", "A bus cannot run down the street on foot."],
    solution:
      "1. The opening phrase *Running down the street* must describe whoever comes next.\n2. Only in **'Running down the street, Ram missed the bus'** does it describe Ram, who was doing the running.\n\nAnswer: **Running down the street, Ram missed the bus.**",
    approach: "An introductory participial phrase attaches to the first noun after the comma. If that noun could not perform the action, the modifier dangles.",
    tags: ["modifiers"],
    timeTargetSec: 50,
  },
  {
    slug: "sc-tense-consistency",
    topic: "sentence-correction",
    title: "Consistent tense",
    prompt: "Choose the correct sentence:",
    options: ["He said that he comes the next day.", "He said that he will come tomorrow.", "He said that he would come the next day.", "He says that he would come tomorrow."],
    answer: 2,
    difficulty: "medium",
    hints: ["The reporting verb 'said' is in the past.", "In reported speech, 'will' becomes 'would' and 'tomorrow' becomes 'the next day'."],
    solution:
      "1. With a past reporting verb (*said*), the reported clause shifts back: *will* → *would*.\n2. Time words shift too: *tomorrow* → *the next day*.\n\nAnswer: **He said that he would come the next day.**",
    approach: "In reported speech, move both the tense and the time reference one step into the past. Mixing a past reporting verb with a present or future clause is the standard error.",
    tags: ["tense", "reported speech"],
    timeTargetSec: 50,
  },
  {
    slug: "sc-preposition-choice",
    topic: "sentence-correction",
    title: "The right preposition",
    prompt: "Choose the correct sentence:",
    options: ["She is married to a doctor.", "She is married from a doctor.", "She is married of a doctor.", "She is married with a doctor."],
    answer: 0,
    difficulty: "easy",
    hints: ["English fixes prepositions by convention, not by logic.", "The idiom is 'married to'."],
    solution: "1. The fixed expression is **married to** someone.\n2. *Married with* is a common transfer from other languages, but it is wrong in English.\n\nAnswer: **She is married to a doctor.**",
    approach:
      "Prepositions after common verbs are idioms to be memorised: married to, angry with a person but about a thing, different from, capable of, insist on, comply with.",
    tags: ["prepositions"],
    timeTargetSec: 35,
  },
  {
    slug: "sc-parallel-structure",
    topic: "sentence-correction",
    title: "Parallel structure",
    prompt: "Choose the correct sentence:",
    options: ["She likes to read, swimming and to cycle.", "She likes read, swim and cycle.", "She likes reading, to swim and cycling.", "She likes reading, swimming and cycling."],
    answer: 3,
    difficulty: "easy",
    hints: ["Items in a list should take the same grammatical form.", "Three -ing forms, or three infinitives — not a mixture."],
    solution:
      "1. Items joined by *and* must share a form.\n2. **reading, swimming and cycling** are all gerunds. *'To read, to swim and to cycle'* would be equally correct.\n\nAnswer: **She likes reading, swimming and cycling.**",
    approach: "Read the list aloud with the verb repeated before each item. Any item that does not fit the pattern breaks the parallelism.",
    tags: ["parallelism"],
    timeTargetSec: 40,
  },

  /* ── Fill in the Blanks & Para Jumbles ─────────────────────────── */
  {
    slug: "sl-blank-contrast",
    topic: "sentence-completion",
    title: "A word signalling contrast",
    prompt: "Fill in the blank:\n\n> The proposal seemed attractive at first; ______, a closer reading revealed several risks.",
    options: ["however", "moreover", "similarly", "therefore"],
    answer: 0,
    difficulty: "easy",
    hints: ["The two halves point in opposite directions.", "Which connector signals a reversal?"],
    solution:
      "1. The first clause is positive, the second negative: the sentence turns.\n2. **However** signals that reversal. *Therefore* shows cause, *moreover* adds, *similarly* compares.\n\nAnswer: **however**.",
    approach:
      "Decide the relation between the two halves before reading the options: addition, contrast, cause or example. Each relation has its own small family of connectors.",
    tags: ["connectors"],
    timeTargetSec: 40,
  },
  {
    slug: "sl-blank-two-words",
    topic: "sentence-completion",
    title: "Two blanks at once",
    prompt: "Fill in the blanks:\n\n> Although the report was ______, its conclusions were widely ______ by experts.",
    options: ["thorough … accepted", "thorough … disputed", "vague … praised", "brief … ignored"],
    answer: 1,
    difficulty: "medium",
    hints: ["'Although' means the two halves must clash.", "A thorough report whose conclusions were accepted would be no contrast at all."],
    solution:
      "1. *Although* demands a contrast between the two halves.\n2. **thorough … disputed** delivers it: a careful report whose conclusions were nevertheless challenged.\n3. *thorough … accepted* and *vague … praised* are not contrasts of the right kind, and *brief … ignored* reads as consistent rather than contrary.\n\nAnswer: **thorough … disputed**.",
    approach: "With two blanks, fix the relation the connector demands, then test pairs rather than single words. One wrong half is enough to eliminate an option.",
    tags: ["double blank"],
    timeTargetSec: 60,
  },
  {
    slug: "sl-para-jumble-four",
    topic: "sentence-completion",
    title: "Arrange the sentences",
    prompt:
      "Arrange the sentences into a coherent paragraph:\n\n**P.** It was invented in the nineteenth century.\n**Q.** The bicycle is one of the most efficient machines ever built.\n**R.** Today it remains the cheapest form of personal transport.\n**S.** Since then its design has changed remarkably little.",
    options: ["P S Q R", "Q P S R", "P Q S R", "Q S P R"],
    answer: 1,
    difficulty: "medium",
    hints: [
      "Which sentence introduces the subject without depending on another?",
      "'Since then' must follow a sentence that names a time; 'Today' belongs at the end.",
    ],
    solution:
      "1. **Q** introduces the bicycle and can stand alone — it opens.\n2. **P** gives the time of invention.\n3. **S** begins *Since then*, so it must follow P.\n4. **R** begins *Today*, closing the chronology.\n\nAnswer: **Q P S R**.",
    approach:
      "Find the opening sentence first: it introduces a subject by name rather than by a pronoun or a connector. Then chain the rest on their linking words — 'since then', 'today', 'as a result' all point backwards at something specific.",
    tags: ["para jumble"],
    timeTargetSec: 75,
  },
  {
    slug: "sl-blank-cause",
    topic: "sentence-completion",
    title: "A word signalling cause",
    prompt: "Fill in the blank:\n\n> The road was flooded; ______, the match was postponed.",
    options: ["nevertheless", "consequently", "otherwise", "meanwhile"],
    answer: 1,
    difficulty: "easy",
    hints: ["The second clause is the result of the first.", "Which connector introduces a consequence?"],
    solution: "1. The flooding caused the postponement.\n2. **Consequently** marks a result. *Nevertheless* would deny it, *otherwise* offers an alternative, *meanwhile* only marks time.\n\nAnswer: **consequently**.",
    approach: "Cause-and-effect connectors (therefore, consequently, hence, thus) are interchangeable in meaning; contrast connectors are not. Identify the relation, then any member of the right family will do.",
    tags: ["connectors"],
    timeTargetSec: 35,
  },

  /* ── Reading Comprehension ─────────────────────────────────────── */
  {
    slug: "rc-remote-work-main-idea",
    topic: "reading-comprehension",
    title: "The main idea of the passage",
    prompt:
      "> Remote work was once treated as a perk for a favoured few. The pandemic turned it into ordinary practice almost overnight, and companies discovered that output did not collapse. What did suffer was the informal exchange that happens in corridors: the overheard question, the quick correction, the unplanned introduction. Firms are now experimenting with hybrid schedules, less because productivity demands it than because the social fabric of work does.\n\nWhat is the **main idea** of the passage?",
    options: ["The pandemic proved that offices are unnecessary.", "Corridor conversations are the most productive part of any workday.", "Remote work reduces productivity and should be abandoned.", "Hybrid schedules are being adopted mainly to restore informal interaction, not to fix output."],
    answer: 3,
    difficulty: "medium",
    hints: [
      "The last sentence usually carries the author's point in a short passage.",
      "The passage explicitly says output did not collapse, so the reason for hybrid work must lie elsewhere.",
    ],
    solution:
      "1. The passage states that output did not collapse under remote work, which rules out the first option.\n2. It says what suffered was informal exchange, and that firms adopt hybrid schedules for the *social fabric* rather than productivity.\n3. That is exactly option **2**. The third option overstates the passage; the fourth exaggerates a supporting detail into a claim the author never makes.\n\nAnswer: **Hybrid schedules are being adopted mainly to restore informal interaction, not to fix output.**",
    approach:
      "The main idea is the claim every other sentence supports. Reject options that are true but minor (a supporting detail) and options that push the author's point further than the text goes.",
    tags: ["main idea"],
    timeTargetSec: 90,
  },
  {
    slug: "rc-remote-work-inference",
    topic: "reading-comprehension",
    title: "What the passage implies",
    prompt:
      "> Remote work was once treated as a perk for a favoured few. The pandemic turned it into ordinary practice almost overnight, and companies discovered that output did not collapse. What did suffer was the informal exchange that happens in corridors: the overheard question, the quick correction, the unplanned introduction.\n\nWhich statement can be **inferred** from the passage?",
    options: [
      "Before the pandemic, remote work was uncommon.",
      "Companies measured output badly.",
      "Informal exchange cannot occur online.",
      "All firms have returned to the office.",
    ],
    answer: 0,
    difficulty: "medium",
    hints: [
      "An inference must follow from the text without needing outside assumptions.",
      "'A perk for a favoured few' tells you how widespread it was.",
    ],
    solution:
      "1. *A perk for a favoured few* implies few people had it: remote work was **uncommon** before the pandemic. That follows directly.\n2. The passage never questions how output was measured, never says informal exchange is impossible online (only that it suffered), and says nothing about firms returning fully.\n\nAnswer: **Before the pandemic, remote work was uncommon.**",
    approach:
      "A valid inference is one short step from the text, not a leap. Words like *cannot*, *all* and *never* in an option usually signal an overstatement the passage does not support.",
    tags: ["inference"],
    timeTargetSec: 75,
  },
  {
    slug: "rc-tone-question",
    topic: "reading-comprehension",
    title: "The author's tone",
    prompt:
      "> The new scheme has been announced with considerable fanfare. Its targets are ambitious, its funding uncertain, and its timeline, by the admission of its own architects, optimistic. One waits with interest.\n\nThe author's tone is best described as:",
    options: ["Indifferent", "Enthusiastic", "Sceptical", "Hostile"],
    answer: 2,
    difficulty: "medium",
    hints: ["Notice the contrast between 'fanfare' and the list that follows.", "'One waits with interest' is polite, but is it convinced?"],
    solution:
      "1. The author sets loud announcement against uncertain funding and an admittedly optimistic timeline.\n2. The closing line withholds judgement rather than condemning: that is **scepticism**, not hostility.\n3. *Enthusiastic* contradicts the doubts; *indifferent* ignores the pointed detail the author selects.\n\nAnswer: **Sceptical**.",
    approach:
      "Tone lives in word choice. Distinguish degrees: doubtful is not hostile, and critical is not dismissive. Pick the mildest option that still accounts for every loaded word.",
    tags: ["tone"],
    timeTargetSec: 75,
  },
];
