import api from "./api";

import type {
    Assignment,
    AssignmentsResponse,
} from "../types/course";

interface AssignmentResponse {
    success: boolean;
    message: string;
    data: Assignment;
}

export const getMyAssignments = async (
    courseOfferingId: string
): Promise<Assignment[]> => {
    const response =
        await api.get<AssignmentsResponse>(
            `/assignments/my/${courseOfferingId}`
        );

    return response.data.data;
};

export const getAssignmentById = async (
    id: string
): Promise<Assignment> => {
    const response =
        await api.get<AssignmentResponse>(
            `/assignments/${id}`
        );

    return response.data.data;
};