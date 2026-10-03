import api from "./api";

import type {
    Course,
    CoursesResponse,
    CourseResponse,
} from "../types/course";

export interface CreateCourseInput {
    code: string;
    name: string;
    description?: string;
}

export interface UpdateCourseInput {
    code?: string;
    name?: string;
    description?: string;
}

export const getCourses = async (): Promise<
    Course[]
> => {
    const response =
        await api.get<CoursesResponse>(
            "/courses"
        );

    return response.data.data;
};

export const getCourseById = async (
    id: string
): Promise<Course> => {
    const response =
        await api.get<CourseResponse>(
            `/courses/${id}`
        );

    return response.data.data;
};

export const createCourse = async (
    input: CreateCourseInput
): Promise<Course> => {
    const response =
        await api.post<CourseResponse>(
            "/courses",
            input
        );

    return response.data.data;
};

export const updateCourse = async (
    id: string,
    input: UpdateCourseInput
): Promise<Course> => {
    const response =
        await api.patch<CourseResponse>(
            `/courses/${id}`,
            input
        );

    return response.data.data;
};