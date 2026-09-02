import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import axios from "axios";

const router = Router();

/**
 * @route   POST /api/interviews/save
 * @desc    Save a custom interview configuration for the current user
 * @access  Private
 */
router.post("/save", requireAuth, async (req: any, res) => {
  const {
    roleId,
    roundId,
    difficulty,
    experienceBand,
    interviewStyle,
    stackFocusIds,
    focusAreaIds,
  } = req.body;

  if (!roleId || !roundId) {
    return res.status(400).json({ error: "Missing required fields: roleId and roundId are mandatory." });
  }

  try {
    const savedInterview = await prisma.savedInterview.create({
      data: {
        userId: req.user.userId,
        roleId,
        roundId,
        difficulty,
        experienceBand,
        interviewStyle,
        stackFocusIds: stackFocusIds || [],
        focusAreaIds: focusAreaIds || [],
      },
    });

    res.json({
      success: true,
      message: "Interview configuration saved successfully",
      interview: savedInterview,
    });
  } catch (error) {
    console.error("Error saving interview:", error);
    res.status(500).json({ error: "Failed to save interview configuration" });
  }
});

/**
 * @route   GET /api/interviews/my
 * @desc    Get all saved interview configurations for the current user
 * @access  Private
 */
router.get("/my", requireAuth, async (req: any, res) => {
  try {
    const interviews = await prisma.savedInterview.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: "desc" },
    });

    res.json(interviews);
  } catch (error) {
    console.error("Error fetching saved interviews:", error);
    res.status(500).json({ error: "Failed to fetch saved interviews" });
  }
});

/**
 * @route   PATCH /api/interviews/:id
 * @desc    Update an existing interview configuration
 * @access  Private
 */
router.patch("/:id", requireAuth, async (req: any, res) => {
  const { id } = req.params;
  const {
    roleId,
    roundId,
    difficulty,
    experienceBand,
    interviewStyle,
    stackFocusIds,
    focusAreaIds,
  } = req.body;

  try {
    const interview = await prisma.savedInterview.findUnique({
      where: { id },
    });

    if (!interview) {
      return res.status(404).json({ error: "Interview configuration not found" });
    }

    if (interview.userId !== req.user.userId) {
      return res.status(403).json({ error: "You do not have permission to update this configuration" });
    }

    const updatedInterview = await prisma.savedInterview.update({
      where: { id },
      data: {
        roleId,
        roundId,
        difficulty,
        experienceBand,
        interviewStyle,
        stackFocusIds: stackFocusIds || [],
        focusAreaIds: focusAreaIds || [],
      },
    });

    res.json({
      success: true,
      message: "Interview configuration updated successfully",
      interview: updatedInterview,
    });
  } catch (error) {
    console.error("Error updating interview:", error);
    res.status(500).json({ error: "Failed to update interview configuration" });
  }
});

/**
 * @route   DELETE /api/interviews/:id
 * @desc    Delete a saved interview configuration
 * @access  Private
 */
router.delete("/:id", requireAuth, async (req: any, res) => {
  const { id } = req.params;

  try {
    const interview = await prisma.savedInterview.findUnique({
      where: { id },
    });

    if (!interview) {
      return res.status(404).json({ error: "Interview configuration not found" });
    }

    if (interview.userId !== req.user.userId) {
      return res.status(403).json({ error: "You do not have permission to delete this configuration" });
    }

    await prisma.savedInterview.delete({
      where: { id },
    });

    res.json({ success: true, message: "Interview configuration deleted" });
  } catch (error) {
    console.error("Error deleting interview:", error);
    res.status(500).json({ error: "Failed to delete interview configuration" });
  }
});

/**
 * Helper to initialize GTWY AI Interview
 */
async function initializeGtwyInterview(config: {
  userId: string;
  roleId: string;
  roundId: string;
  difficulty: string;
  experienceBand: string;
  interviewStyle: string;
  stackFocusIds: string[];
  focusAreaIds: string[];
  previousQuestions?: string;
  threadId?: string;
}) {
  const {
    userId,
    roleId,
    roundId,
    difficulty,
    experienceBand,
    interviewStyle,
    stackFocusIds,
    focusAreaIds,
    previousQuestions = "",
    threadId = `user_${userId}_${Date.now()}`,
  } = config;

  const payload = {
    query: previousQuestions ? "Next question please" : "Start the interview",
    agent_id: "69ebe0945b4763a61d8518fe",
    thread_id: threadId,
    response_type: "text",
    variables: {
      targetRole: roleId,
      interviewRound: roundId,
      experienceBand: experienceBand,
      difficulty: difficulty,
      interviewStyle: interviewStyle,
      stackFocus: (stackFocusIds || []).join(", "),
      focusAreas: (focusAreaIds || []).join(", "),
      previousQuestions: previousQuestions,
    },
  };

  return await axios.post(
    "https://api.gtwy.ai/api/v2/model/chat/completion",
    payload,
    {
      headers: {
        pauthkey: process.env.GTWY_PAUTHKEY,
        "Content-Type": "application/json",
      },
    }
  );
}

/**
 * Helper to evaluate GTWY AI Answer
 */
async function evaluateGtwyAnswer(config: {
  answer: string;
  roleId: string;
  roundId: string;
  difficulty: string;
  experienceBand: string;
  interviewStyle: string;
  stackFocusIds: string[];
  focusAreaIds: string[];
  previousQuestions: string;
  threadId: string;
}) {
  const {
    answer,
    roleId,
    roundId,
    difficulty,
    experienceBand,
    interviewStyle,
    stackFocusIds,
    focusAreaIds,
    previousQuestions,
    threadId,
  } = config;

  const payload = {
    query: answer,
    agent_id: "69ec016eb3f4d60fb9f0edcc",
    thread_id: threadId,
    response_type: "text",
    variables: {
      targetRole: roleId,
      interviewRound: roundId,
      difficulty: difficulty,
      experienceBand: experienceBand,
      interviewStyle: interviewStyle,
      stackFocus: (stackFocusIds || []).join(", "),
      focusAreas: (focusAreaIds || []).join(", "),
      previousQuestions: previousQuestions,
    },
  };
  console.log("PAYLOAD", payload);
  return await axios.post(
    "https://api.gtwy.ai/api/v2/model/chat/completion",
    payload,
    {
      headers: {
        pauthkey: process.env.GTWY_PAUTHKEY,
        "Content-Type": "application/json",
      },
    }
  );
}

/**
 * @route   POST /api/interviews/start
 * @desc    Start a new mock interview session
 * @access  Private
 */
router.post("/start", requireAuth, async (req: any, res) => {
  const { savedInterviewId } = req.body;

  if (!savedInterviewId) {
    return res.status(400).json({ error: "savedInterviewId is required to start an interview" });
  }

  try {
    console.log("Starting mock interview for user:", req.user.userId, "Template:", savedInterviewId);

    // 1. Fetch the interview configuration from the SavedInterview table
    const template = await prisma.savedInterview.findUnique({
      where: { id: savedInterviewId }
    });

    if (!template) {
      return res.status(404).json({ error: "Saved interview configuration not found" });
    }

    // 2. Create a session record in the DB linked to the template
    const session = await prisma.mockInterviewSession.create({
      data: {
        userId: req.user.userId,
        savedInterviewId: template.id,
        status: "started",
      },
    });

    // 3. Call GTWY AI to initialize the interview and get the first question
    const threadId = `session_${session.id}`;
    const gtwyResponse = await initializeGtwyInterview({
      userId: req.user.userId,
      roleId: template.roleId,
      roundId: template.roundId,
      difficulty: template.difficulty,
      experienceBand: template.experienceBand,
      interviewStyle: template.interviewStyle,
      stackFocusIds: (template.stackFocusIds as string[] | null) ?? [],
      focusAreaIds: (template.focusAreaIds as string[] | null) ?? [],
      threadId,
    });

    // Update session with the thread ID
    await prisma.mockInterviewSession.update({
      where: { id: session.id },
      data: { gtwyThreadId: threadId },
    });

    // 3. Parse the AI's content response
    const gtwyData = gtwyResponse.data;
    const contentStr = gtwyData?.response?.data?.content;

    if (!contentStr) {
      throw new Error("AI failed to generate initial interview content");
    }

    // Attempt to parse the JSON content from the AI
    let content;
    try {
      content = JSON.parse(contentStr);
    } catch (parseError) {
      console.error("Failed to parse AI content as JSON:", contentStr);
      // Fallback: If it's not JSON, treat the whole string as the question
      content = { question: contentStr };
    }

    // 4. Create the first question in the DB
    const firstQuestion = await prisma.mockInterviewQuestion.create({
      data: {
        sessionId: session.id,
        questionText: content.question || "Welcome! Let's start the interview.",
        topic: content.topic,
        difficulty: content.difficulty,
        focusArea: content.focusArea,
        starterCode: content.starterCode || null,
        expectedSkills: content.expectedSkills || [],
        status: "pending",
        orderIndex: 0,
      },
    });

    res.json({
      success: true,
      message: "Interview session started successfully",
      session: session,
      question: firstQuestion,
    });
  } catch (error: any) {
    console.error(
      "Error starting interview session:",
      error.response?.data || error.message
    );
    res.status(500).json({
      error: "Failed to start interview session",
      details: error.response?.data || error.message,
    });
  }
});

/**
 * @route   POST /api/interviews/session/:sessionId/answer
 * @desc    Submit an answer for a specific question
 * @access  Private
 */
router.post("/session/:sessionId/answer", requireAuth, async (req: any, res) => {
  const { sessionId } = req.params;
  const { questionId, answer } = req.body;

  if (!questionId || !answer) {
    return res.status(400).json({ error: "questionId and answer are required" });
  }

  try {
    console.log(`Submitting and evaluating answer for session ${sessionId}, question ${questionId}`);

    // 1. Fetch session and template context
    const session = await prisma.mockInterviewSession.findUnique({
      where: { id: sessionId },
      include: {
        savedInterview: true,
        questions: {
          orderBy: { orderIndex: "asc" }
        }
      }
    });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const template = session.savedInterview;
    const previousQuestionsText = session.questions
      .map(q => `Q: ${q.questionText}\nA: ${q.userAnswer || "No answer"}`)
      .join("\n---\n");

    // 2. Call GTWY AI for evaluation and next question
    const gtwyResponse = await evaluateGtwyAnswer({
      answer,
      roleId: template.roleId,
      roundId: template.roundId,
      difficulty: template.difficulty,
      experienceBand: template.experienceBand,
      interviewStyle: template.interviewStyle,
      stackFocusIds: (template.stackFocusIds as string[] | null) ?? [],
      focusAreaIds: (template.focusAreaIds as string[] | null) ?? [],
      previousQuestions: previousQuestionsText,
      threadId: session.gtwyThreadId || "",
    });

    const gtwyData = gtwyResponse.data;
    const contentStr = gtwyData?.response?.data?.content;

    if (!contentStr) {
      throw new Error("AI failed to evaluate the answer and generate next content");
    }

    // 3. Parse the evaluation and next question
    let content;
    try {
      content = JSON.parse(contentStr);
    } catch (parseError) {
      console.error("Failed to parse AI evaluation as JSON:", contentStr);
      // Fallback: If not JSON, we can't easily extract score/feedback
      content = { 
        evaluation: { score: 0, feedback: "AI response was not in expected JSON format." },
        nextQuestion: { question: contentStr } 
      };
    }

    // 4. Update the current question with the score and feedback
    await prisma.mockInterviewQuestion.update({
      where: { id: questionId },
      data: {
        userAnswer: answer,
        evaluationScore: content.evaluation?.score || 0,
        feedback: content.evaluation?.feedback || "",
        status: "evaluated",
      },
    });

    // 5. Create the next question in the sequence
    const nextQuestion = await prisma.mockInterviewQuestion.create({
      data: {
        sessionId: session.id,
        questionText: content.nextQuestion?.question || "Interview complete! Thank you for your time.",
        topic: content.nextQuestion?.topic,
        difficulty: content.nextQuestion?.difficulty,
        focusArea: content.nextQuestion?.focusArea,
        starterCode: content.nextQuestion?.starterCode || null,
        expectedSkills: content.nextQuestion?.expectedSkills || [],
        status: "pending",
        orderIndex: session.questions.length, // Increment index
      },
    });

    res.json({
      success: true,
      message: "Answer evaluated successfully",
      evaluation: content.evaluation,
      nextQuestion: nextQuestion,
    });
  } catch (error: any) {
    console.error("Error evaluating answer:", error.response?.data || error.message);
    res.status(500).json({
      error: "Failed to evaluate answer",
      details: error.response?.data || error.message,
    });
  }
});

export default router;
