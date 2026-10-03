import api from "./api";

export interface ExamResult {
    attempt: {
        id: string;
        examId: string;
        attemptNumber: number;
        startedAt: string;
        submittedAt: string | null;
        status: "SUBMITTED" | "EXPIRED";
    };

    exam: {
        id: string;
        title: string;
    };

    summary: {
        totalQuestions: number;
        answeredQuestions: number;
        unansweredQuestions: number;
        autoGradedQuestions: number;
        pendingManualGrading: number;
        earnedPoints: number;
        maximumPoints: number;
        percentage: number;
    };
}

interface ExamResultResponse {
    success: boolean;
    message: string;
    data: ExamResult;
}

export const getExamResult = async (
    attemptId: string
): Promise<ExamResult> => {
    const response =
        await api.get<ExamResultResponse>(
            `/exam-results/attempt/${attemptId}`
        );

    return response.data.data;
};

export interface StaffExamResult {
    attempt: {
        id: string;
        examId: string;
        attemptNumber: number;
        startedAt: string;
        submittedAt: string | null;
        status: "IN_PROGRESS" | "SUBMITTED" | "EXPIRED" | "BLOCKED";
    };
    exam: {
        id: string;
        title: string;
        courseOffering: {
            id: string;
            lecturerId: string;
            course: {
                id: string;
                code: string;
                name: string;
            };
        };
    };
    student: {
        id: string;
        name: string;
        email: string;
    };
    summary: ExamResult["summary"];
    questions: Array<{
        id: string;
        questionId: string;
        orderNumber: number;
        questionTextSnapshot: string;
        pointsSnapshot: number;
        question: {
            questionType: string;
        };
        answer: {
            id: string;
            answer: string | null;
            isCorrect: boolean | null;
            points: number | null;
        } | null;
    }>;
}

interface StaffExamResultResponse {
    success: boolean;
    message: string;
    data: StaffExamResult;
}

export const getExamResultForStaff = async (
    attemptId: string
): Promise<StaffExamResult> => {
    const response = await api.get<StaffExamResultResponse>(
        `/exam-results/staff/attempt/${attemptId}`
    );

    return response.data.data;
};

export interface ExamReportAttempt {
    id: string;

    student: {
        id: string;
        name: string;
        email: string;
    };

    attemptNumber: number;
    startedAt: string;
    submittedAt: string | null;

    status:
        | "IN_PROGRESS"
        | "SUBMITTED"
        | "EXPIRED"
        | "BLOCKED";

    score: number | null;

    riskScore: {
        score: number;
        riskLevel: "LOW" | "MEDIUM" | "HIGH";
    } | null;
}

export interface ExamReport {
    exam: {
        id: string;
        title: string;
        passingScore: number;
        maxAttempts: number;

        courseOffering: {
            id: string;
            lecturerId: string;
            term: string;
            section: string;

            course: {
                id: string;
                code: string;
                name: string;
            };
        };
    };

    summary: {
        totalAttempts: number;
        submitted: number;
        expired: number;
        blocked: number;
        averageScore: number;
        passed: number;
        failed: number;
    };

    risk: {
        low: number;
        medium: number;
        high: number;
    };

    attempts: ExamReportAttempt[];
}

interface ExamReportResponse {
    success: boolean;
    message: string;
    data: ExamReport;
}

export const getExamReportByExamId = async (
    examId: string
): Promise<ExamReport> => {
    const response =
        await api.get<ExamReportResponse>(
            `/exam-results/report/${examId}`
        );

    return response.data.data;
};