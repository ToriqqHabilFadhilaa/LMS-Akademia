import { prisma } from "../../../config/database.js";

import {
    ConflictError,
    ForbiddenError,
    NotFoundError,
} from "../../../errors/app-error.js";

export const getExamResult = async (
    attemptId: string,
    studentId: string
) => {
    const attempt = await prisma.examAttempt.findUnique({
        where: {
            id: attemptId,
        },
        select: {
            id: true,
            examId: true,
            studentId: true,
            attemptNumber: true,
            startedAt: true,
            submittedAt: true,
            status: true,

            exam: {
                select: {
                    id: true,
                    title: true,
                },
            },

            questions: {
                select: {
                    id: true,
                    pointsSnapshot: true,

                    answer: {
                        select: {
                            answer: true,
                            isCorrect: true,
                            points: true,
                        },
                    },
                    question: {
                        select: {
                            questionType: true,
                        },
                    },
                },
            },
        },
    });

    if (!attempt) {
        throw new NotFoundError(
            "Exam attempt tidak ditemukan"
        );
    }

    if (attempt.studentId !== studentId) {
        throw new ForbiddenError(
            "Anda tidak dapat melihat hasil attempt milik student lain"
        );
    }

    if (
        attempt.status !== "SUBMITTED" &&
        attempt.status !== "EXPIRED"
    ) {
        throw new ConflictError(
            "Hasil exam belum tersedia"
        );
    }

    const totalQuestions =
        attempt.questions.length;

    const answeredQuestions =
        attempt.questions.filter(
            (question) => question.answer !== null
        ).length;

    const autoGradedQuestions =
        attempt.questions.filter(
            (question) =>
                question.answer?.points !== null &&
                question.answer?.points !== undefined
        ).length;

    const pendingManualGrading =
        attempt.questions.filter(
            (question) =>
                question.answer !== null &&
                question.answer.points === null &&
                (question.question.questionType === "ESSAY" ||
                    question.question.questionType === "SHORT_ANSWER")
        ).length;

    const earnedPoints =
        attempt.questions.reduce(
            (total, question) =>
                total +
                (question.answer?.points ?? 0),
            0
        );

    const maximumPoints =
        attempt.questions.reduce(
            (total, question) =>
                total + question.pointsSnapshot,
            0
        );

    const percentage =
        maximumPoints > 0
            ? (earnedPoints / maximumPoints) * 100
            : 0;

    return {
        attempt: {
            id: attempt.id,
            examId: attempt.examId,
            attemptNumber: attempt.attemptNumber,
            startedAt: attempt.startedAt,
            submittedAt: attempt.submittedAt,
            status: attempt.status,
        },

        exam: attempt.exam,

        summary: {
            totalQuestions,
            answeredQuestions,
            unansweredQuestions:
                totalQuestions - answeredQuestions,
            autoGradedQuestions,
            pendingManualGrading,
            earnedPoints,
            maximumPoints,
            percentage,
        },
    };
};

export const getExamResultForStaff = async (
    attemptId: string,
    requesterId: string,
    requesterRole: "ADMIN" | "LECTURER"
) => {
    const attempt = await prisma.examAttempt.findUnique({
        where: {
            id: attemptId,
        },
        select: {
            id: true,
            examId: true,
            studentId: true,
            attemptNumber: true,
            startedAt: true,
            submittedAt: true,
            status: true,

            exam: {
                select: {
                    id: true,
                    title: true,

                    courseOffering: {
                        select: {
                            id: true,
                            lecturerId: true,

                            course: {
                                select: {
                                    id: true,
                                    code: true,
                                    name: true,
                                },
                            },
                        },
                    },
                },
            },

            student: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },

            questions: {
                select: {
                    id: true,
                    questionId: true,
                    orderNumber: true,
                    questionTextSnapshot: true,
                    optionsSnapshot: true,
                    shuffledOptions: true,
                    pointsSnapshot: true,

                    answer: {
                        select: {
                            id: true,
                            answer: true,
                            isCorrect: true,
                            points: true,
                        },
                    },
                    question: {
                        select: {
                            questionType: true,
                        },
                    },
                },

                orderBy: {
                    orderNumber: "asc",
                },
            },

            riskScore: {
                select: {
                    score: true,
                    riskLevel: true,
                    calculatedAt: true,
                    updatedAt: true,
                },
            },
        },
    });

    if (!attempt) {
        throw new NotFoundError(
            "Exam attempt tidak ditemukan"
        );
    }

    if (
        requesterRole === "LECTURER" &&
        attempt.exam.courseOffering.lecturerId !==
        requesterId
    ) {
        throw new ForbiddenError(
            "Anda tidak memiliki akses ke hasil exam ini"
        );
    }

    const totalQuestions =
        attempt.questions.length;

    const answeredQuestions =
        attempt.questions.filter(
            (question) => question.answer !== null
        ).length;

    const autoGradedQuestions =
        attempt.questions.filter(
            (question) =>
                question.answer?.points !== null &&
                question.answer?.points !== undefined
        ).length;

    const pendingManualGrading =
        attempt.questions.filter(
            (question) =>
                question.answer !== null &&
                question.answer.points === null &&
                (question.question.questionType === "ESSAY" ||
                    question.question.questionType === "SHORT_ANSWER")
        ).length;

    const earnedPoints =
        attempt.questions.reduce(
            (total, question) =>
                total +
                (question.answer?.points ?? 0),
            0
        );

    const maximumPoints =
        attempt.questions.reduce(
            (total, question) =>
                total + question.pointsSnapshot,
            0
        );

    const percentage =
        maximumPoints > 0
            ? (earnedPoints / maximumPoints) * 100
            : 0;

    return {
        attempt: {
            id: attempt.id,
            examId: attempt.examId,
            attemptNumber: attempt.attemptNumber,
            startedAt: attempt.startedAt,
            submittedAt: attempt.submittedAt,
            status: attempt.status,
        },

        exam: {
            id: attempt.exam.id,
            title: attempt.exam.title,
            courseOffering:
                attempt.exam.courseOffering,
        },

        student: attempt.student,

        summary: {
            totalQuestions,
            answeredQuestions,
            unansweredQuestions:
                totalQuestions - answeredQuestions,
            autoGradedQuestions,
            pendingManualGrading,
            earnedPoints,
            maximumPoints,
            percentage,
        },

        riskScore: attempt.riskScore,

        questions: attempt.questions,
    };
};

export const getExamReportByExamId = async (
    examId: string,
    requesterId: string,
    requesterRole: "ADMIN" | "LECTURER"
) => {
    const exam = await prisma.exam.findUnique({
        where: {
            id: examId,
        },
        select: {
            id: true,
            title: true,
            passingScore: true,
            maxAttempts: true,
            courseOffering: {
                select: {
                    id: true,
                    lecturerId: true,
                    term: true,
                    section: true,
                    course: {
                        select: {
                            id: true,
                            code: true,
                            name: true,
                        },
                    },
                },
            },
        },
    });

    if (!exam) {
        throw new NotFoundError("Exam tidak ditemukan");
    }

    if (
        requesterRole === "LECTURER" &&
        exam.courseOffering.lecturerId !== requesterId
    ) {
        throw new ForbiddenError(
            "Anda tidak memiliki akses ke report exam ini"
        );
    }

    const attempts = await prisma.examAttempt.findMany({
        where: {
            examId,
        },
        select: {
            id: true,
            studentId: true,
            attemptNumber: true,
            startedAt: true,
            submittedAt: true,
            status: true,
            student: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            questions: {
                select: {
                    pointsSnapshot: true,
                    answer: {
                        select: {
                            points: true,
                        },
                    },
                },
            },
            riskScore: {
                select: {
                    score: true,
                    riskLevel: true,
                },
            },
        },
        orderBy: [
            {
                student: {
                    name: "asc",
                },
            },
            {
                attemptNumber: "asc",
            },
        ],
    });

    const attemptRows = attempts.map((attempt) => {
        const maximumPoints = attempt.questions.reduce(
            (total, question) =>
                total + question.pointsSnapshot,
            0
        );

        const earnedPoints = attempt.questions.reduce(
            (total, question) =>
                total + (question.answer?.points ?? 0),
            0
        );

        const score =
            maximumPoints > 0
                ? (earnedPoints / maximumPoints) * 100
                : 0;

        const isScored =
            attempt.status === "SUBMITTED" ||
            attempt.status === "EXPIRED";

        return {
            id: attempt.id,
            student: attempt.student,
            attemptNumber: attempt.attemptNumber,
            startedAt: attempt.startedAt,
            submittedAt: attempt.submittedAt,
            status: attempt.status,
            score: isScored ? score : null,
            riskScore: attempt.riskScore,
        };
    });

    const submittedAttempts = attemptRows.filter(
        (attempt) => attempt.status === "SUBMITTED"
    );

    const expiredAttempts = attemptRows.filter(
        (attempt) => attempt.status === "EXPIRED"
    );

    const blockedAttempts = attemptRows.filter(
        (attempt) => attempt.status === "BLOCKED"
    );

    const scoredAttempts = attemptRows.filter(
        (attempt) => attempt.score !== null
    );

    const averageScore =
        scoredAttempts.length > 0
            ? scoredAttempts.reduce(
                  (total, attempt) =>
                      total + (attempt.score ?? 0),
                  0
              ) / scoredAttempts.length
            : 0;

    const passedAttempts = scoredAttempts.filter(
        (attempt) =>
            (attempt.score ?? 0) >= exam.passingScore
    ).length;

    const failedAttempts =
        scoredAttempts.length - passedAttempts;

    const lowRisk = attemptRows.filter(
        (attempt) =>
            attempt.riskScore?.riskLevel === "LOW"
    ).length;

    const mediumRisk = attemptRows.filter(
        (attempt) =>
            attempt.riskScore?.riskLevel === "MEDIUM"
    ).length;

    const highRisk = attemptRows.filter(
        (attempt) =>
            attempt.riskScore?.riskLevel === "HIGH"
    ).length;

    return {
        exam: {
            id: exam.id,
            title: exam.title,
            passingScore: exam.passingScore,
            maxAttempts: exam.maxAttempts,
            courseOffering: exam.courseOffering,
        },
        summary: {
            totalAttempts: attemptRows.length,
            submitted: submittedAttempts.length,
            expired: expiredAttempts.length,
            blocked: blockedAttempts.length,
            averageScore,
            passed: passedAttempts,
            failed: failedAttempts,
        },
        risk: {
            low: lowRisk,
            medium: mediumRisk,
            high: highRisk,
        },
        attempts: attemptRows,
    };
};