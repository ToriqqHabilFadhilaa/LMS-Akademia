import api from "./api";

import type {
    CourseOffering,
    CourseOfferingResponse,
} from "../types/course";

interface CourseOfferingsResponse {
    success: boolean;
    message: string;
    data: CourseOffering[];
}

export interface CreateCourseOfferingInput {
    courseId: string;
    lecturerId: string;
    term: string;
    section: string;
}

export interface UpdateCourseOfferingInput {
    courseId?: string;
    lecturerId?: string;
    term?: string;
    section?: string;
}

interface CreateCourseOfferingResponse {
    success: boolean;
    message: string;
    data: CourseOffering;
}

export const getLecturerCourseOfferings = async (): Promise<
    CourseOffering[]
> => {
    const response =
        await api.get<CourseOfferingsResponse>(
            "/course-offerings/lecturer/my"
        );

    return response.data.data;
};

export const getCourseOfferings = async (): Promise<
    CourseOffering[]
> => {
    const response =
        await api.get<CourseOfferingsResponse>(
            "/course-offerings"
        );

    return response.data.data;
};

export const getCourseOfferingById = async (
    id: string
): Promise<CourseOffering> => {
    const response =
        await api.get<CourseOfferingResponse>(
            `/course-offerings/${id}`
        );

    return response.data.data;
};

export const createCourseOffering = async (
    input: CreateCourseOfferingInput
): Promise<CourseOffering> => {
    const response =
        await api.post<CreateCourseOfferingResponse>(
            "/course-offerings",
            input
        );

    return response.data.data;
};

export const updateCourseOffering = async (
    id: string,
    input: UpdateCourseOfferingInput
): Promise<CourseOffering> => {
    const response =
        await api.patch<CourseOfferingResponse>(
            `/course-offerings/${id}`,
            input
        );

    return response.data.data;
};

export const getMyCourseOfferingById = async (
    id: string
): Promise<CourseOffering> => {
    const response =
        await api.get<CourseOfferingResponse>(
            `/course-offerings/my/${id}`
        );

    return response.data.data;
};