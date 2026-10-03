import api from "./api";

import type {
    CourseMember,
    MyCourseMembersResponse,
} from "../types/course";

export interface CourseMemberDetail {
    id: string;
    courseOfferingId: string;
    userId: string;
    role: "STUDENT" | "TEACHING_ASSISTANT";
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
        status: string;
    };
    courseOffering: {
        id: string;
        term: string;
        section: string;
        status: string;
        course: { id: string; code: string; name: string };
    };
}

interface CourseMembersDetailResponse {
    success: boolean;
    message: string;
    data: CourseMemberDetail[];
}

export const getMyCourses = async (): Promise<CourseMember[]> => {
    const response =
        await api.get<MyCourseMembersResponse>(
            "/course-members/my"
        );

    return response.data.data;
};

export const getCourseMembers = async (
    courseOfferingId: string
): Promise<CourseMemberDetail[]> => {
    const response =
        await api.get<CourseMembersDetailResponse>(
            `/course-members/offering/${courseOfferingId}`
        );

    return response.data.data;
};