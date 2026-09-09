import type { AptitudeSeed } from "./types.js";

/**
 * Reading comprehension. Five short passages, each with several questions, in
 * the style used by placement papers: the passage is brief and the questions
 * turn on precision rather than stamina.
 */

const PASSAGE_MONSOON = `> India's monsoon is often described as a single event, but it is really two. The south-west monsoon arrives in Kerala in early June and works north over six weeks, bringing roughly three-quarters of the country's annual rainfall. The north-east monsoon, far smaller, returns in October and waters the south-eastern coast. Forecasting either has improved markedly since the 1990s, though the models remain better at predicting the total than its distribution — which is unfortunate, because it is the distribution that determines whether a crop survives.`;

const PASSAGE_SLEEP = `> For most of the twentieth century, sleep was treated as an absence: the hours in which nothing happened. That view has been overturned. The sleeping brain consolidates the day's learning, clears metabolic waste and rehearses motor sequences. What looks like inactivity is in fact a second shift. The practical consequence is uncomfortable for a culture that prizes long hours — cutting sleep to gain working time is a trade that reliably loses more than it gains.`;

const PASSAGE_CITIES = `> Planners once assumed that widening a road would ease congestion. Decades of evidence suggest otherwise. Additional capacity lowers the effective cost of driving, which draws in journeys that were previously not made at all, until the road is as crowded as before. Economists call this induced demand. The finding does not mean roads should never be built, but it does mean that congestion cannot be engineered away by supply alone.`;

const PASSAGE_LIBRARY = `> The public library is a strange institution by the standards of modern economics. It gives away, free of charge, a service that people would pay for. It admits everyone regardless of what they can spend. And it survives, in most countries, on a budget that would embarrass a mid-sized company. Its defenders no longer argue chiefly about books; they argue about the library as one of the few remaining places a person may sit for an afternoon without being asked to buy anything.`;

const PASSAGE_ANTIBIOTIC = `> Antibiotic resistance is not a future risk but a present one. Every course of antibiotics kills the susceptible bacteria and leaves the resistant to multiply, so resistance is the predictable result of use rather than of misuse alone. Misuse merely accelerates it. This is why the response has two halves that are often confused: using existing drugs more sparingly buys time, but only new classes of drug can replace what is being lost.`;

export const BANK_READING: AptitudeSeed[] = [
  /* ── Passage: the monsoon ──────────────────────────────────────── */
  {
    slug: "rc2-monsoon-main-idea",
    topic: "reading-comprehension",
    title: "The point of the monsoon passage",
    prompt: `${PASSAGE_MONSOON}\n\nWhat is the **main point** of the passage?`,
    options: [
      "Monsoon forecasting has not improved since the 1990s.",
      "The monsoon is two distinct events, and forecasts predict its total better than its distribution.",
      "The north-east monsoon matters more to agriculture than the south-west.",
      "Kerala receives most of India's annual rainfall.",
    ],
    answer: 1,
    difficulty: "medium",
    hints: [
      "The passage makes two claims: one about structure and one about forecasting.",
      "The last sentence explains why the forecasting gap matters.",
    ],
    solution:
      "1. The passage opens by splitting the monsoon into two events.\n2. It then says forecasts predict the total better than the distribution, and that the distribution is what matters for crops.\n3. That is exactly the second option. The first contradicts the text, the third reverses the sizes, and the fourth misreads Kerala as the destination rather than the arrival point.\n\nAnswer: **The monsoon is two distinct events, and forecasts predict its total better than its distribution.**",
    approach:
      "The main idea is the claim every other sentence supports. Reject options that are true but minor, and options that overstate what the passage says.",
    tags: ["main idea"],
    timeTargetSec: 90,
  },
  {
    slug: "rc2-monsoon-detail",
    topic: "reading-comprehension",
    title: "A detail from the passage",
    prompt: `${PASSAGE_MONSOON}\n\nAccording to the passage, **when** does the north-east monsoon return?`,
    options: ["Early June", "Six weeks after June", "October", "The passage does not say"],
    answer: 2,
    difficulty: "easy",
    hints: ["Locate the sentence about the north-east monsoon.", "It names a month directly."],
    solution:
      "1. The passage says the north-east monsoon 'returns in October'.\n2. Early June and the six-week spread belong to the south-west monsoon.\n\nAnswer: **October**.",
    approach: "Detail questions are answered by finding the sentence, not by recalling it. Scan for the key term and read that sentence closely.",
    tags: ["detail"],
    timeTargetSec: 60,
  },
  {
    slug: "rc2-monsoon-inference",
    topic: "reading-comprehension",
    title: "What the passage implies",
    prompt: `${PASSAGE_MONSOON}\n\nWhich statement can be **inferred** from the passage?`,
    options: [
      "A season with normal total rainfall can still damage crops.",
      "Forecasting models are no longer useful.",
      "The south-west monsoon reaches the whole country on the same day.",
      "Crops depend only on the north-east monsoon.",
    ],
    answer: 0,
    difficulty: "medium",
    hints: [
      "The passage says distribution determines crop survival, and that models predict totals better.",
      "What follows if the total is right but the distribution is not?",
    ],
    solution:
      "1. The passage states that distribution, not total, determines whether a crop survives.\n2. So a normal total spread badly could still ruin crops — a direct inference.\n3. The other options contradict the passage or overstate it.\n\nAnswer: **A season with normal total rainfall can still damage crops.**",
    approach: "A valid inference is one short step from the text. Options containing 'no longer', 'only' or 'the whole' usually overreach.",
    tags: ["inference"],
    timeTargetSec: 90,
  },

  /* ── Passage: sleep ────────────────────────────────────────────── */
  {
    slug: "rc2-sleep-main-idea",
    topic: "reading-comprehension",
    title: "The central claim about sleep",
    prompt: `${PASSAGE_SLEEP}\n\nWhat is the **central claim** of the passage?`,
    options: [
      "Sleep is an active process, so cutting it to gain working hours is a poor trade.",
      "People in the twentieth century slept more than people do today.",
      "The brain does nothing useful during sleep.",
      "Long working hours are the main cause of poor sleep.",
    ],
    answer: 0,
    difficulty: "medium",
    hints: [
      "The passage overturns an old view and then draws a practical conclusion.",
      "The final sentence states that conclusion plainly.",
    ],
    solution:
      "1. The passage argues that sleep is a 'second shift' of real activity.\n2. It concludes that trading sleep for working time 'reliably loses more than it gains'.\n3. The first option captures both halves. The third states the view the passage rejects.\n\nAnswer: **Sleep is an active process, so cutting it to gain working hours is a poor trade.**",
    approach: "When a passage overturns a belief, the main idea is usually the new view plus its consequence, not the old view being dismissed.",
    tags: ["main idea"],
    timeTargetSec: 90,
  },
  {
    slug: "rc2-sleep-detail",
    topic: "reading-comprehension",
    title: "What the sleeping brain does",
    prompt: `${PASSAGE_SLEEP}\n\nWhich of the following is **not** listed in the passage as something the sleeping brain does?`,
    options: [
      "Consolidates learning",
      "Clears metabolic waste",
      "Rehearses motor sequences",
      "Repairs damaged muscle tissue",
    ],
    answer: 3,
    difficulty: "easy",
    hints: ["Three items are named in one sentence.", "Check each option against that list."],
    solution:
      "1. The passage lists consolidating learning, clearing metabolic waste and rehearsing motor sequences.\n2. **Repairing damaged muscle tissue** is not mentioned, however plausible it sounds.\n\nAnswer: **Repairs damaged muscle tissue**.",
    approach:
      "For 'which is not mentioned' questions, tick off each option against the text. Plausibility is irrelevant — only what appears on the page counts.",
    tags: ["detail"],
    timeTargetSec: 75,
  },
  {
    slug: "rc2-sleep-tone",
    topic: "reading-comprehension",
    title: "The author's attitude",
    prompt: `${PASSAGE_SLEEP}\n\nThe author's attitude towards a culture that prizes long hours is best described as:`,
    options: ["Approving", "Critical", "Indifferent", "Bewildered"],
    answer: 1,
    difficulty: "medium",
    hints: [
      "The passage calls the consequence 'uncomfortable' for such a culture.",
      "It says the trade 'reliably loses more than it gains'.",
    ],
    solution:
      "1. Calling the finding 'uncomfortable' for that culture, and the trade a reliable loss, signals disapproval.\n2. The tone is measured rather than hostile, so **critical** fits best.\n\nAnswer: **Critical**.",
    approach: "Tone lives in word choice. Pick the mildest label that still accounts for every loaded word in the passage.",
    tags: ["tone"],
    timeTargetSec: 75,
  },

  /* ── Passage: cities and roads ─────────────────────────────────── */
  {
    slug: "rc2-cities-main-idea",
    topic: "reading-comprehension",
    title: "The argument about roads",
    prompt: `${PASSAGE_CITIES}\n\nWhat does the passage mainly argue?`,
    options: [
      "Roads should never be built.",
      "Widening roads tends not to reduce congestion, because extra capacity attracts new journeys.",
      "Congestion is caused entirely by poor planning.",
      "Economists disagree about the causes of congestion.",
    ],
    answer: 1,
    difficulty: "medium",
    hints: [
      "The passage names a mechanism and gives it a term.",
      "It also explicitly denies one of the options.",
    ],
    solution:
      "1. The passage explains that added capacity lowers the cost of driving and draws in new journeys — induced demand.\n2. It states directly that this 'does not mean roads should never be built', ruling out the first option.\n\nAnswer: **Widening roads tends not to reduce congestion, because extra capacity attracts new journeys.**",
    approach: "When a passage anticipates and rejects an extreme reading, that reading is usually offered as a distractor. Watch for the sentence that disowns it.",
    tags: ["main idea"],
    timeTargetSec: 90,
  },
  {
    slug: "rc2-cities-term",
    topic: "reading-comprehension",
    title: "The meaning of a term",
    prompt: `${PASSAGE_CITIES}\n\nAs used in the passage, **'induced demand'** refers to:`,
    options: [
      "Journeys that were not made before but are made once capacity increases",
      "Demand created by advertising",
      "The cost of building new roads",
      "Congestion caused by accidents",
    ],
    answer: 0,
    difficulty: "medium",
    hints: ["The term is defined by the sentence immediately before it.", "It concerns journeys 'previously not made at all'."],
    solution:
      "1. The passage says extra capacity 'draws in journeys that were previously not made at all', and calls this induced demand.\n2. That matches the first option exactly.\n\nAnswer: **Journeys that were not made before but are made once capacity increases**.",
    approach: "Vocabulary-in-context questions are answered by the surrounding sentences, not by outside knowledge of the term.",
    tags: ["vocabulary in context"],
    timeTargetSec: 75,
  },
  {
    slug: "rc2-cities-inference",
    topic: "reading-comprehension",
    title: "What follows from the argument",
    prompt: `${PASSAGE_CITIES}\n\nWhich statement is most consistent with the passage?`,
    options: [
      "Measures that change the cost of driving may affect congestion more than new capacity does.",
      "Congestion has no solution.",
      "Planners in the past had no evidence to work with.",
      "Induced demand applies only to cities.",
    ],
    answer: 0,
    difficulty: "hard",
    hints: [
      "The passage explains congestion through the effective cost of driving.",
      "If cost drives demand, what would change demand?",
    ],
    solution:
      "1. The mechanism the passage describes runs through the effective cost of driving.\n2. It follows that changing that cost would affect congestion — consistent with the argument.\n3. The passage denies that congestion is hopeless, and never claims planners had no evidence.\n\nAnswer: **Measures that change the cost of driving may affect congestion more than new capacity does.**",
    approach:
      "Extend the mechanism the passage supplies rather than adding your own. The right option usually applies the stated logic to a new case.",
    tags: ["inference"],
    timeTargetSec: 105,
  },

  /* ── Passage: the library ──────────────────────────────────────── */
  {
    slug: "rc2-library-main-idea",
    topic: "reading-comprehension",
    title: "The case for the library",
    prompt: `${PASSAGE_LIBRARY}\n\nAccording to the passage, how has the **defence of libraries** changed?`,
    options: [
      "It now rests on the library as a public space rather than chiefly on books.",
      "It now rests on the cost of running libraries.",
      "It has become an argument about literacy rates.",
      "It has not changed at all.",
    ],
    answer: 0,
    difficulty: "medium",
    hints: [
      "The final sentence contrasts what defenders once argued with what they argue now.",
      "It ends on somewhere to sit without being asked to buy anything.",
    ],
    solution:
      "1. The passage says defenders 'no longer argue chiefly about books'.\n2. They argue instead for the library as a place one may sit without spending.\n3. That is the shift the first option describes.\n\nAnswer: **It now rests on the library as a public space rather than chiefly on books.**",
    approach: "When a passage contrasts 'once' with 'now', the question is usually about that shift. Locate both halves before choosing.",
    tags: ["main idea"],
    timeTargetSec: 90,
  },
  {
    slug: "rc2-library-tone",
    topic: "reading-comprehension",
    title: "The tone of the library passage",
    prompt: `${PASSAGE_LIBRARY}\n\nThe tone of the passage is best described as:`,
    options: ["Dismissive", "Sympathetic", "Hostile", "Neutral and statistical"],
    answer: 1,
    difficulty: "medium",
    hints: [
      "Notice the phrase about a budget that 'would embarrass a mid-sized company'.",
      "The closing sentence presents the library's role approvingly.",
    ],
    solution:
      "1. The passage highlights the library's generosity, its openness and its small budget.\n2. The closing sentence treats its role as valuable, so the tone is **sympathetic**.\n3. It is not neutral — the language is warm and selective.\n\nAnswer: **Sympathetic**.",
    approach: "Ask whether the author's word choices lean for or against the subject. 'Strange by the standards of economics' is admiring here, not critical.",
    tags: ["tone"],
    timeTargetSec: 75,
  },
  {
    slug: "rc2-library-detail",
    topic: "reading-comprehension",
    title: "A stated feature",
    prompt: `${PASSAGE_LIBRARY}\n\nWhich feature of libraries does the passage **explicitly** mention?`,
    options: [
      "They admit everyone regardless of ability to pay.",
      "They are funded entirely by donations.",
      "They employ more staff than most companies.",
      "They are open twenty-four hours a day.",
    ],
    answer: 0,
    difficulty: "easy",
    hints: ["Check each option against the sentences in the passage.", "One matches the second sentence closely."],
    solution:
      "1. The passage says the library 'admits everyone regardless of what they can spend'.\n2. None of the other three appears in the text.\n\nAnswer: **They admit everyone regardless of ability to pay.**",
    approach: "Match the option to a specific sentence. If you cannot point at the line, the option is not explicitly mentioned.",
    tags: ["detail"],
    timeTargetSec: 60,
  },

  /* ── Passage: antibiotic resistance ────────────────────────────── */
  {
    slug: "rc2-antibiotic-main-idea",
    topic: "reading-comprehension",
    title: "The claim about resistance",
    prompt: `${PASSAGE_ANTIBIOTIC}\n\nWhat is the passage's **main claim**?`,
    options: [
      "Antibiotic resistance is caused only by misuse of drugs.",
      "Resistance follows from use itself, so sparing use buys time but new drugs are needed to replace what is lost.",
      "Antibiotics should no longer be prescribed.",
      "Resistance is a problem that will arise in the future.",
    ],
    answer: 1,
    difficulty: "medium",
    hints: [
      "The passage distinguishes use from misuse.",
      "It then describes a response with two halves.",
    ],
    solution:
      "1. The passage says resistance is 'the predictable result of use rather than of misuse alone', with misuse merely accelerating it.\n2. It then separates two responses: sparing use buys time, new drugs replace what is lost.\n3. The second option states both halves. The first and fourth contradict the text.\n\nAnswer: **Resistance follows from use itself, so sparing use buys time but new drugs are needed to replace what is lost.**",
    approach:
      "When a passage says two things are 'often confused', the main idea usually depends on keeping them apart. The right option preserves that distinction.",
    tags: ["main idea"],
    timeTargetSec: 105,
  },
  {
    slug: "rc2-antibiotic-inference",
    topic: "reading-comprehension",
    title: "An inference about policy",
    prompt: `${PASSAGE_ANTIBIOTIC}\n\nWhich statement follows from the passage?`,
    options: [
      "Reducing prescriptions alone will not permanently solve resistance.",
      "Misuse plays no part in resistance.",
      "New antibiotics would make careful prescribing unnecessary.",
      "Resistance can be eliminated within a decade.",
    ],
    answer: 0,
    difficulty: "hard",
    hints: [
      "The passage says sparing use 'buys time' and only new drugs can replace what is lost.",
      "Buying time is not the same as solving.",
    ],
    solution:
      "1. The passage says sparing use only buys time, while replacement requires new classes of drug.\n2. So reducing prescriptions alone cannot be a permanent solution — the first option.\n3. The passage says misuse accelerates resistance, so the second is wrong, and the other two overreach.\n\nAnswer: **Reducing prescriptions alone will not permanently solve resistance.**",
    approach:
      "Pay attention to hedged phrases such as 'buys time'. They mark the limits of a claim, and questions are often built on exactly those limits.",
    tags: ["inference"],
    timeTargetSec: 105,
  },
  {
    slug: "rc2-antibiotic-detail",
    topic: "reading-comprehension",
    title: "The role of misuse",
    prompt: `${PASSAGE_ANTIBIOTIC}\n\nAccording to the passage, **misuse** of antibiotics:`,
    options: [
      "Is the sole cause of resistance",
      "Speeds up a process that use alone would cause anyway",
      "Has no measurable effect",
      "Only matters in hospitals",
    ],
    answer: 1,
    difficulty: "medium",
    hints: ["Find the sentence containing the word 'accelerates'.", "It positions misuse relative to ordinary use."],
    solution:
      "1. The passage says resistance results from use rather than misuse alone, and that 'misuse merely accelerates it'.\n2. So misuse speeds up a process ordinary use would produce regardless.\n\nAnswer: **Speeds up a process that use alone would cause anyway**.",
    approach: "The word 'merely' is doing the work in that sentence. Small qualifying words often decide between two otherwise similar options.",
    tags: ["detail"],
    timeTargetSec: 90,
  },
  {
    slug: "rc2-antibiotic-title",
    topic: "reading-comprehension",
    title: "A suitable title",
    prompt: `${PASSAGE_ANTIBIOTIC}\n\nWhich is the most suitable **title** for the passage?`,
    options: [
      "The Dangers of Hospital Infections",
      "Why Resistance Is Built Into Antibiotic Use",
      "A History of Antibiotics",
      "How to Prescribe Medicines",
    ],
    answer: 1,
    difficulty: "medium",
    hints: [
      "A title should cover the whole passage, not one sentence of it.",
      "The central point is that use itself produces resistance.",
    ],
    solution:
      "1. The passage's organising idea is that resistance follows from use, not merely misuse.\n2. **'Why Resistance Is Built Into Antibiotic Use'** covers that whole argument.\n3. The others name topics the passage does not treat.\n\nAnswer: **Why Resistance Is Built Into Antibiotic Use**.",
    approach: "A title must be as broad as the passage and no broader. Reject titles that fit only one sentence or promise material that never appears.",
    tags: ["title"],
    timeTargetSec: 90,
  },
  {
    slug: "rc2-sleep-purpose",
    topic: "reading-comprehension",
    title: "The purpose of the passage",
    prompt: `${PASSAGE_SLEEP}\n\nThe author's **primary purpose** is to:`,
    options: [
      "Correct a common belief and draw a practical conclusion from the correction",
      "Describe an experiment in detail",
      "Compare sleep patterns across countries",
      "Recommend a specific number of hours of sleep",
    ],
    answer: 0,
    difficulty: "medium",
    hints: [
      "The passage begins with a view that has been 'overturned'.",
      "It ends with a consequence for how people work.",
    ],
    solution:
      "1. The passage first corrects the view of sleep as an absence.\n2. It then draws out the practical consequence for working hours.\n3. No experiment, comparison or specific recommendation appears.\n\nAnswer: **Correct a common belief and draw a practical conclusion from the correction**.",
    approach:
      "Purpose questions ask what the author is doing, not what they are saying. Describe the structure of the passage in a verb: correct, compare, propose, warn.",
    tags: ["purpose"],
    timeTargetSec: 90,
  },
  {
    slug: "rc2-monsoon-vocabulary",
    topic: "reading-comprehension",
    title: "A word in context",
    prompt: `${PASSAGE_MONSOON}\n\nAs used in the passage, **'distribution'** most nearly means:`,
    options: [
      "How the rainfall is spread over time and place",
      "The delivery of relief supplies",
      "The sale of agricultural produce",
      "The total quantity of rainfall",
    ],
    answer: 0,
    difficulty: "medium",
    hints: [
      "The word is contrasted with 'the total'.",
      "It is what determines whether a crop survives.",
    ],
    solution:
      "1. The passage contrasts predicting 'the total' with predicting 'its distribution'.\n2. So distribution means how that total is spread out, not the total itself.\n\nAnswer: **How the rainfall is spread over time and place**.",
    approach: "When a word is contrasted with another in the same sentence, that contrast defines it. Read the pair together rather than the word alone.",
    tags: ["vocabulary in context"],
    timeTargetSec: 75,
  },
  {
    slug: "rc2-cities-detail",
    topic: "reading-comprehension",
    title: "What planners once assumed",
    prompt: `${PASSAGE_CITIES}\n\nAccording to the passage, what did **planners once assume**?`,
    options: [
      "That congestion could not be reduced",
      "That widening a road would ease congestion",
      "That drivers respond to the cost of driving",
      "That new roads are too expensive",
    ],
    answer: 1,
    difficulty: "easy",
    hints: ["The assumption appears in the very first sentence.", "It is the belief the passage goes on to challenge."],
    solution:
      "1. The opening sentence states that planners 'once assumed that widening a road would ease congestion'.\n2. The rest of the passage argues against it.\n\nAnswer: **That widening a road would ease congestion**.",
    approach: "The belief a passage sets out to challenge is usually stated first. Locating it makes the rest of the argument easier to follow.",
    tags: ["detail"],
    timeTargetSec: 60,
  },
  {
    slug: "rc2-library-inference",
    topic: "reading-comprehension",
    title: "An inference about public space",
    prompt: `${PASSAGE_LIBRARY}\n\nWhich statement can be **inferred** from the passage?`,
    options: [
      "Places where one may spend time without spending money have become uncommon.",
      "Libraries no longer stock books.",
      "Libraries are funded better than most companies.",
      "People no longer read.",
    ],
    answer: 0,
    difficulty: "medium",
    hints: [
      "The passage calls the library 'one of the few remaining places' of its kind.",
      "What does 'few remaining' imply about such places generally?",
    ],
    solution:
      "1. Describing the library as one of the few remaining such places implies that these places have become uncommon.\n2. The other options contradict the passage or go far beyond it.\n\nAnswer: **Places where one may spend time without spending money have become uncommon.**",
    approach: "Phrases like 'one of the few remaining' carry an implication about the wider category. That implication is what an inference question tests.",
    tags: ["inference"],
    timeTargetSec: 90,
  },
];
