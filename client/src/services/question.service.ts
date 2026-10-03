import api from "./api";

export interface Question {
    id: string;
    createdById: string;
    questionType: string;
    questionText: string;
    options: unknown | null;
    correctAnswer: string | null;
    points: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;

    createdBy: {
        id: string;
        name: string;
        email: string;
        role: string;
    };
}

export interface QuestionsResponse {
    success: boolean;
    message: string;
    data: Question[];
}

export interface QuestionResponse {
    success: boolean;
    message: string;
    data: Question;
}

export interface CreateQuestionInput {
    questionType: string;
    questionText: string;
    options?: unknown | null;
    correctAnswer?: string;
    points?: number;
    isActive?: boolean;
}

export interface UpdateQuestionInput {
    questionType?: string;
    questionText?: string;
    options?: unknown | null;
    correctAnswer?: string;
    points?: number;
    isActive?: boolean;
}

export const getQuestions = async (): Promise<Question[]> => {
    const response =
        await api.get<QuestionsResponse>(
            "/questions"
        );

    return response.data.data;
};

export const getQuestionById = async (
    id: string
): Promise<Question> => {
    const response =
        await api.get<QuestionResponse>(
            `/questions/${id}`
        );

    return response.data.data;
};

export const createQuestion = async (
    input: CreateQuestionInput
): Promise<Question> => {
    const response =
        await api.post<QuestionResponse>(
            "/questions",
            input
        );

    return response.data.data;
};

export const updateQuestion = async (
    id: string,
    input: UpdateQuestionInput
): Promise<Question> => {
    const response =
        await api.patch<QuestionResponse>(
            `/questions/${id}`,
            input
        );

    return response.data.data;
};

export const deleteQuestion = async (
    id: string
): Promise<void> => {
    await api.delete(`/questions/${id}`);
};