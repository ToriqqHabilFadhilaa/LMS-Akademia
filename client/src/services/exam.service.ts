import api from "./api";

import type {
    Exam,
    ExamsResponse,
} from "../types/course";

interface ExamResponse {
    success: boolean;
    message: string;
    data: Exam;
}

export const getMyExams = async (
    courseOfferingId: string
): Promise<Exam[]> => {
    const response =
        await api.get<ExamsResponse>(
            `/exams/my/${courseOfferingId}`
        );

    return response.data.data;
};

export const getMyExamById = async (
    examId: string
): Promise<Exam> => {
    const response = await api.get<ExamResponse>(
        `/exams/my/detail/${examId}`
    );

    return response.data.data;
};

export const getExamsByCourseOfferingId = async (
    courseOfferingId: string
): Promise<Exam[]> => {
    const response = await api.get<ExamsResponse>(
        `/exams/course-offerings/${courseOfferingId}`
    );

    return response.data.data;
};

export interface CreateExamInput {
    courseOfferingId: string;
    title: string;
    description?: string;
    durationMinutes: number;
    startAt: string;
    endAt: string;
    maxAttempts?: number;
    shuffleQuestions?: boolean;
    shuffleAnswers?: boolean;
}

export interface UpdateExamInput {
    title?: string;
    description?: string;
    durationMinutes?: number;
    startAt?: string;
    endAt?: string;
    maxAttempts?: number;
    shuffleQuestions?: boolean;
    shuffleAnswers?: boolean;
}

export const createExam = async (
    input: CreateExamInput
): Promise<Exam> => {
    const response =
        await api.post<ExamResponse>(
            "/exams",
            input
        );

    return response.data.data;
};

export const updateExam = async (
    id: string,
    input: UpdateExamInput
): Promise<Exam> => {
    const response =
        await api.patch<ExamResponse>(
            `/exams/${id}`,
            input
        );

    return response.data.data;
};

export const deleteExam = async (
    id: string
): Promise<void> => {
    await api.delete(`/exams/${id}`);
};