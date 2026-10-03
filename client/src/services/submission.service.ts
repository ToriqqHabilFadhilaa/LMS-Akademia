import api from "./api";

import type {
    Submission,
    SubmissionsResponse,
} from "../types/submission";

export interface CreateSubmissionInput {
    assignmentId: string;
    fileUrl: string;
}

export interface UpdateSubmissionInput {
    fileUrl: string;
}

interface SubmissionResponse {
    success: boolean;
    message: string;
    data: Submission;
}

export const getMySubmissions = async (): Promise<
    Submission[]
> => {
    const response =
        await api.get<SubmissionsResponse>(
            "/submissions/mine"
        );

    return response.data.data;
};

export const createSubmission = async (
    input: CreateSubmissionInput
): Promise<Submission> => {
    const response =
        await api.post<SubmissionResponse>(
            "/submissions",
            input
        );

    return response.data.data;
};

export const getSubmissionById = async (
    id: string
): Promise<Submission> => {
    const response =
        await api.get<SubmissionResponse>(
            `/submissions/${id}`
        );

    return response.data.data;
};

export const updateSubmission = async (
    id: string,
    input: UpdateSubmissionInput
): Promise<Submission> => {
    const response =
        await api.patch<SubmissionResponse>(
            `/submissions/${id}`,
            input
        );

    return response.data.data;
};