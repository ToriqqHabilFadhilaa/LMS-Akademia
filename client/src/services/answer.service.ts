import api from "./api";

export interface ExamAnswer {
    id: string;
    attemptId: string;
    attemptQuestionId: string;
    answer: string | null;
}

export interface GradeableAnswer {
    id: string;
    attemptId: string;
    attemptQuestionId: string;
    answer: string | null;
    isCorrect: boolean | null;
    points: number | null;
    attemptQuestion: {
        id: string;
        orderNumber: number;
        questionTextSnapshot: string;
        pointsSnapshot: number;
        question: {
            id: string;
            questionType: string;
        };
    };
}

interface GradingAnswersResponse {
    success: boolean;
    message: string;
    data: {
        attempt: {
            id: string;
            examId: string;
            attemptNumber: number;
            student: {
                id: string;
                name: string;
                email: string;
            };
        };
        answers: GradeableAnswer[];
    };
}

interface AnswerResponse {
    success: boolean;
    message: string;
    data: ExamAnswer;
}

interface AnswersResponse {
    success: boolean;
    message: string;
    data: ExamAnswer[];
}

export const createAnswer = async (
    attemptQuestionId: string,
    answer: string
): Promise<ExamAnswer> => {
    const response =
        await api.post<AnswerResponse>(
            "/answers",
            {
                attemptQuestionId,
                answer,
            }
        );

    return response.data.data;
};

export const getAnswersByAttemptId = async (
    attemptId: string
): Promise<ExamAnswer[]> => {
    const response =
        await api.get<AnswersResponse>(
            `/answers/attempt/${attemptId}`
        );

    return response.data.data;
};

export const updateAnswer = async (
    answerId: string,
    answer: string
): Promise<ExamAnswer> => {
    const response =
        await api.patch<AnswerResponse>(
            `/answers/${answerId}`,
            {
                answer,
            }
        );

    return response.data.data;
};

export const getAttemptAnswersForGrading = async (
    attemptId: string
): Promise<GradingAnswersResponse["data"]> => {
    const response = await api.get<GradingAnswersResponse>(
        `/answers/grading/attempt/${attemptId}`
    );

    return response.data.data;
};

interface GradeAnswerResponse {
    success: boolean;
    message: string;
    data: GradeableAnswer;
}

export const gradeAnswer = async (
    answerId: string,
    points: number
): Promise<GradeableAnswer> => {
    const response = await api.patch<GradeAnswerResponse>(
        `/answers/${answerId}/grade`,
        { points }
    );

    return response.data.data;
};