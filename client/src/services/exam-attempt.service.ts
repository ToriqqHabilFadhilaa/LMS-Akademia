import api from "./api";

export interface ExamAttempt {
    id: string;
    examId: string;
    studentId: string;
    attemptNumber: number;
    startedAt: string;
    submittedAt: string | null;
    status:
    | "IN_PROGRESS"
    | "SUBMITTED"
    | "EXPIRED"
    | "CANCELLED";
    createdAt: string;
    updatedAt: string;

    exam: {
        id: string;
        title: string;
        durationMinutes: number;
        startAt: string;
        endAt: string;
        maxAttempts: number;
    };

    questions: AttemptQuestion[];
}

export interface ExamOption {
    label: string;
    text: string;
}

export interface AttemptQuestion {
    id: string;
    questionId: string;
    orderNumber: number;
    questionTextSnapshot: string;
    optionsSnapshot: ExamOption[];
    shuffledOptions: ExamOption[];
    pointsSnapshot: number;
}

interface StartAttemptResponse {
    success: boolean;
    message: string;
    data: ExamAttempt;
}

export const startExamAttempt = async (
    examId: string
): Promise<ExamAttempt> => {
    const response =
        await api.post<StartAttemptResponse>(
            `/exam-attempts`,
            {
                examId,
            }
        );

    return response.data.data;
};

interface ExamAttemptResponse {
    success: boolean;
    message: string;
    data: ExamAttempt;
}

export const getExamAttemptById = async (
    attemptId: string
): Promise<ExamAttempt> => {
    const response =
        await api.get<ExamAttemptResponse>(
            `/exam-attempts/${attemptId}`
        );

    return response.data.data;
};

export const submitExamAttempt = async (
    attemptId: string
): Promise<ExamAttempt> => {
    const response =
        await api.patch<ExamAttemptResponse>(
            `/exam-attempts/${attemptId}/submit`
        );

    return response.data.data;
};

export interface MyExamAttempt {
    id: string;
    attemptNumber: number;
    startedAt: string;
    submittedAt: string | null;

    status:
        | "IN_PROGRESS"
        | "SUBMITTED"
        | "EXPIRED"
        | "BLOCKED";

    retakeGrantedAt: string | null;
    retakeConsumedAt: string | null;

    percentage: number | null;
}

interface MyExamAttemptsResponse {
    success: boolean;
    message: string;
    data: {
        attempts: MyExamAttempt[];
        bestScore: number | null;
    };
}

export const getMyExamAttemptsByExamId = async (
    examId: string
) => {
    const response =
        await api.get<MyExamAttemptsResponse>(
            `/exam-attempts/my/exam/${examId}`
        );

    return response.data.data;
};

export interface AdminExamAttempt {
    id: string;
    studentId: string;
    attemptNumber: number;
    startedAt: string;
    submittedAt: string | null;
    status:
        | "IN_PROGRESS"
        | "SUBMITTED"
        | "EXPIRED"
        | "BLOCKED";

    retakeGrantedAt: string | null;
    retakeConsumedAt: string | null;

    student: {
        id: string;
        name: string;
        email: string;
    };

    riskScore: {
        score: number;
        riskLevel: "LOW" | "MEDIUM" | "HIGH";
        calculatedAt: string;
        updatedAt: string;
    } | null;
}

interface AdminExamAttemptsResponse {
    success: boolean;
    message: string;
    data: {
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
        attempts: AdminExamAttempt[];
    };
}

export const getExamAttemptsByExamId = async (
    examId: string
) => {
    const response =
        await api.get<AdminExamAttemptsResponse>(
            `/exam-attempts/exam/${examId}`
        );

    return response.data.data;
};

interface GrantExamRetakeResponse {
    success: boolean;
    message: string;
    data: {
        id: string;
        examId: string;
        studentId: string;
        attemptNumber: number;
        status: "BLOCKED";
        retakeGrantedAt: string;
    };
}

export const grantExamRetake = async (
    attemptId: string
) => {
    const response =
        await api.patch<GrantExamRetakeResponse>(
            `/exam-attempts/${attemptId}/grant-retake`
        );

    return response.data.data;
};