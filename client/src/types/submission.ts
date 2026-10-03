export interface SubmissionAssignment {
    id: string;
    title: string;
    deadline: string;
    maxScore: number;

    courseOffering: {
        id: string;
        term: string;
        section: string;

        course: {
            id: string;
            code: string;
            name: string;
        };
    };
}

export interface Submission {
    id: string;
    assignmentId: string;
    studentId: string;
    fileUrl: string | null;
    submittedAt: string;
    score: number | null;
    feedback: string | null;
    status: string;
    gradedById: string | null;
    gradedAt: string | null;

    assignment: SubmissionAssignment;

    student: {
        id: string;
        name: string;
        email: string;
    };
}

export interface SubmissionsResponse {
    success: boolean;
    message: string;
    data: Submission[];
}