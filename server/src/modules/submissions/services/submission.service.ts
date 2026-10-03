import { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../../config/database.js";

import {
    ConflictError,
    ForbiddenError,
    NotFoundError,
} from "../../../errors/app-error.js";

import type {
    CreateSubmissionInput,
    UpdateSubmissionInput,
} from "../validators/submission.validator.js";

import type { UserRole } from "../../../generated/prisma/client.js";

const SUBMISSION_SELECT = {
    id: true,
    assignmentId: true,
    studentId: true,
    fileUrl: true,
    submittedAt: true,
    score: true,
    feedback: true,
    status: true,
    gradedById: true,
    gradedAt: true,

    assignment: {
        select: {
            id: true,
            title: true,
            deadline: true,
            maxScore: true,

            courseOffering: {
                select: {
                    id: true,
                    term: true,
                    section: true,

                    course: {
                        select: {
                            id: true,
                            code: true,
                            name: true,
                        },
                    },
                },
            },
        },
    },

    student: {
        select: {
            id: true,
            name: true,
            email: true,
        },
    },
} satisfies Prisma.SubmissionSelect;

export const createSubmission = async (
    studentId: string,
    input: CreateSubmissionInput
) => {
    const assignment =
        await prisma.assignment.findUnique({
            where: {
                id: input.assignmentId,
            },
        });

    if (!assignment) {
        throw new NotFoundError(
            "Assignment tidak ditemukan"
        );
    }

    const member =
        await prisma.courseMember.findUnique({
            where: {
                courseOfferingId_userId: {
                    courseOfferingId:
                        assignment.courseOfferingId,
                    userId: studentId,
                },
            },
        });

    if (!member || member.role !== "STUDENT") {
        throw new ForbiddenError(
            "Student tidak terdaftar pada course offering assignment ini"
        );
    }

    if (new Date() > assignment.deadline) {
        throw new ConflictError(
            "Deadline assignment sudah lewat"
        );
    }

    const existingSubmission =
        await prisma.submission.findUnique({
            where: {
                assignmentId_studentId: {
                    assignmentId: input.assignmentId,
                    studentId,
                },
            },
        });

    if (existingSubmission) {
        throw new ConflictError(
            "Anda sudah mengumpulkan assignment ini"
        );
    }

    try {
        return await prisma.submission.create({
            data: {
                assignmentId: input.assignmentId,
                studentId,
                fileUrl: input.fileUrl,
            },
            select: SUBMISSION_SELECT,
        });
    } catch (error) {
        if (
            error instanceof
            Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
        ) {
            throw new ConflictError(
                "Anda sudah mengumpulkan assignment ini"
            );
        }

        throw error;
    }
};

export const getSubmissionById = async (
    id: string,
    requesterId: string,
    requesterRole: UserRole
) => {
    // Query khusus untuk authorization.
    // lecturerId hanya dipakai untuk pengecekan akses
    // dan tidak dikirim ke response.
    const accessData =
        await prisma.submission.findUnique({
            where: {
                id,
            },
            select: {
                id: true,
                studentId: true,

                assignment: {
                    select: {
                        courseOffering: {
                            select: {
                                lecturerId: true,
                            },
                        },
                    },
                },
            },
        });

    if (!accessData) {
        throw new NotFoundError(
            "Submission tidak ditemukan"
        );
    }

    if (
        requesterRole === "STUDENT" &&
        accessData.studentId !== requesterId
    ) {
        throw new ForbiddenError(
            "Anda tidak dapat melihat submission student lain"
        );
    }

    if (
        requesterRole === "LECTURER" &&
        accessData.assignment.courseOffering
            .lecturerId !== requesterId
    ) {
        throw new ForbiddenError(
            "Anda tidak memiliki akses ke submission ini"
        );
    }

    // Setelah lolos authorization, ambil data sebenarnya.
    const submission =
        await prisma.submission.findUnique({
            where: {
                id,
            },
            select: SUBMISSION_SELECT,
        });

    if (!submission) {
        throw new NotFoundError(
            "Submission tidak ditemukan"
        );
    }

    return submission;
};

export const getMySubmissions = async (
    studentId: string
) => {
    return prisma.submission.findMany({
        where: {
            studentId,
        },
        select: SUBMISSION_SELECT,
        orderBy: {
            submittedAt: "desc",
        },
    });
};

export const updateSubmission = async (
    id: string,
    studentId: string,
    input: UpdateSubmissionInput
) => {
    const submission =
        await prisma.submission.findUnique({
            where: {
                id,
            },
            include: {
                assignment: true,
            },
        });

    if (!submission) {
        throw new NotFoundError(
            "Submission tidak ditemukan"
        );
    }

    if (submission.studentId !== studentId) {
        throw new ForbiddenError(
            "Anda tidak dapat mengubah submission milik user lain"
        );
    }

    if (new Date() > submission.assignment.deadline) {
        throw new ConflictError(
            "Deadline assignment sudah lewat"
        );
    }

    if (submission.status !== "SUBMITTED") {
        throw new ConflictError(
            "Submission tidak dapat diperbarui"
        );
    }

    return prisma.submission.update({
        where: {
            id,
        },
        data: {
            fileUrl: input.fileUrl,
            submittedAt: new Date(),
        },
        select: SUBMISSION_SELECT,
    });
};