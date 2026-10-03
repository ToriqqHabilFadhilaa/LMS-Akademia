import "dotenv/config";

import express from "express";
import cors from "cors";
import courseRoutes from "./modules/courses/routes/course.routes.js";
import { prisma } from "./config/database.js";
import authRoutes from "./modules/auth/routes/auth.routes.js";
import { errorHandler } from "./middleware/error-handler.middleware.js";
import courseOfferingRoutes from "./modules/course-offerings/routes/course-offering.routes.js";
import courseMemberRoutes from "./modules/course-members/routes/course-member.routes.js";
import materialRoutes from "./modules/materials/routes/material.routes.js";
import assignmentRoutes from "./modules/assignments/routes/assignment.routes.js";
import submissionRoutes from "./modules/submissions/routes/submission.routes.js";
import gradingRoutes from "./modules/grading/routes/grading.routes.js";
import examRoutes from "./modules/exams/routes/exam.routes.js";
import questionRoutes from "./modules/questions/routes/question.routes.js";
import examQuestionRoutes from "./modules/exam-questions/routes/exam-question.routes.js";
import examAttemptRoutes from "./modules/exam-attempts/routes/exam-attempt.routes.js";
import answerRoutes from "./modules/answers/routes/answer.routes.js";
import activityLogRoutes from "./modules/activity-logs/routes/activity-log.routes.js";
import riskScoreRoutes from "./modules/risk-scores/routes/risk-score.routes.js";
import submitExamAttemptRoutes from "./modules/exam-attempts/routes/submit-exam-attempt.routes.js";
import examResultRoutes from "./modules/exam-results/routes/exam-result.routes.js";
import gradeAuditRoutes from "./modules/grade-audits/routes/grade-audit.routes.js";
import userRoutes from "./modules/users/routes/user.routes.js";

const app = express();

const PORT = Number(process.env.PORT) || 5000;

const CLIENT_URL =
    process.env.CLIENT_URL || "http://localhost:5173";

app.use(
    cors({
        origin: CLIENT_URL,
        credentials: true,
    })
);

app.use(express.json());

app.get("/api/health", async (_req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;

        return res.status(200).json({
            success: true,
            message: "API is running",
            database: "connected",
        });
    } catch (error) {
        console.error("Database connection error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
            database: "disconnected",
        });
    }
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/course-offerings", courseOfferingRoutes);
app.use("/api/course-members", courseMemberRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/grading", gradingRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/exam-questions", examQuestionRoutes);
app.use("/api/exam-attempts", examAttemptRoutes);
app.use("/api/answers", answerRoutes);
app.use("/api/activity-logs", activityLogRoutes);
app.use("/api/risk-scores", riskScoreRoutes);
app.use("/api/exam-attempts", examAttemptRoutes);
app.use("/api/exam-attempts", submitExamAttemptRoutes);
app.use("/api/exam-results", examResultRoutes);
app.use("/api/grade-audits", gradeAuditRoutes);
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});