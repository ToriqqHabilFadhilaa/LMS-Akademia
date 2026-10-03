export interface Course {
    id: string;
    code: string;
    name: string;
    description: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CoursesResponse {
    success: boolean;
    message: string;
    data: Course[];
}

export interface CourseResponse {
    success: boolean;
    message: string;
    data: Course;
}

export interface CourseMember {
    id: string;
    courseOfferingId: string;
    userId: string;
    role: "STUDENT";

    courseOffering: {
        id: string;
        term: string;
        section: string;
        status: string;

        course: {
            id: string;
            code: string;
            name: string;
        };
    };
}

export interface MyCourseMembersResponse {
    success: boolean;
    message: string;
    data: CourseMember[];
}

export interface CourseOffering {
    id: string;
    courseId: string;
    lecturerId: string;
    term: string;
    section: string;
    status: string;
    createdAt: string;
    updatedAt: string;

    course: {
        id: string;
        code: string;
        name: string;
    };

    lecturer: {
        id: string;
        name: string;
        email: string;
    };
}

export interface CourseOfferingResponse {
    success: boolean;
    message: string;
    data: CourseOffering;
}

export interface Material {
    id: string;
    courseOfferingId: string;
    title: string;
    description: string | null;
    fileUrl: string | null;
    createdAt: string;
    updatedAt: string;

    courseOffering: {
        id: string;
        term: string;
        section: string;
        status: string;

        course: {
            id: string;
            code: string;
            name: string;
        };
    };
}

export interface MaterialsResponse {
    success: boolean;
    message: string;
    data: Material[];
}

export interface Assignment {
    id: string;
    courseOfferingId: string;
    title: string;
    description: string | null;
    deadline: string;
    maxScore: number;
    createdAt: string;
    updatedAt: string;

    courseOffering: {
        id: string;
        term: string;
        section: string;
        status: string;

        course: {
            id: string;
            code: string;
            name: string;
        };
    };
}

export interface AssignmentsResponse {
    success: boolean;
    message: string;
    data: Assignment[];
}

export interface Exam {
    id: string;
    courseOfferingId: string;
    title: string;
    description: string | null;
    durationMinutes: number;
    startAt: string;
    endAt: string;
    maxAttempts: number;
    passingScore: number;
    shuffleQuestions: boolean;
    shuffleAnswers: boolean;
    createdAt: string;
    updatedAt: string;

    courseOffering: {
        id: string;
        term: string;
        section: string;
        status: string;

        course: {
            id: string;
            code: string;
            name: string;
        };
    };
}

export interface ExamsResponse {
    success: boolean;
    message: string;
    data: Exam[];
}