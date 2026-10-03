import { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../../config/database.js";

import {
    ConflictError,
    ForbiddenError,
    NotFoundError,
} from "../../../errors/app-error.js";

import type {
    GradeSubmissionInput,
} from "../validators/grading.validator.js";

const GRADED_SUBMISSION_SELECT = {
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
            maxScore: true,
        },
    },

    student: {
        select: {
            id: true,
            name: true,
            email: true,
        },
    },

    gradedBy: {
        select: {
            id: true,
            name: true,
            email: true,
        },
    },
} satisfies Prisma.SubmissionSelect;

export const gradeSubmission = async (
    submissionId: string,
    graderId: string,
    input: GradeSubmissionInput
) => {
    const submission = await prisma.submission.findUnique({
        where: {
            id: submissionId,
        },
        include: {
            assignment: {
                include: {
                    courseOffering: {
                        select: {
                            lecturerId: true,
                        },
                    },
                },
            },
        },
    });

    if (!submission) {
        throw new NotFoundError(
            "Submission tidak ditemukan"
        );
    }

    const courseOffering =
        submission.assignment.courseOffering;

    const grader = await prisma.user.findUnique({
        where: {
            id: graderId,
        },
        select: {
            id: true,
            role: true,
            status: true,
            deletedAt: true,
        },
    });

    if (!grader) {
        throw new NotFoundError(
            "User grader tidak ditemukan"
        );
    }

    if (
        grader.status !== "ACTIVE" ||
        grader.deletedAt !== null
    ) {
        throw new ForbiddenError(
            "Akun grader tidak aktif"
        );
    }

    if (
        grader.role === "LECTURER" &&
        courseOffering.lecturerId !== graderId
    ) {
        throw new ForbiddenError(
            "Anda tidak memiliki akses untuk menilai submission ini"
        );
    }

    if (
        grader.role !== "ADMIN" &&
        grader.role !== "LECTURER"
    ) {
        throw new ForbiddenError(
            "Anda tidak memiliki akses untuk melakukan grading"
        );
    }

    if (
        input.score >
        submission.assignment.maxScore
    ) {
        throw new ConflictError(
            `Nilai tidak boleh melebihi nilai maksimal ${submission.assignment.maxScore}`
        );
    }

    const previousScore = submission.score;

    const result = await prisma.$transaction(
        async (tx) => {
            const updatedSubmission =
                await tx.submission.update({
                    where: {
                        id: submissionId,
                    },

                    data: {
                        score: input.score,
                        status: "GRADED",
                        gradedById: graderId,
                        gradedAt: new Date(),

                        ...(input.feedback !== undefined && {
                            feedback: input.feedback,
                        }),
                    },

                    select: GRADED_SUBMISSION_SELECT,
                });

            await tx.gradeAudit.create({
                data: {
                    submissionId,
                    gradedById: graderId,
                    previousScore,
                    newScore: input.score,

                    ...(input.feedback !== undefined && {
                        feedback: input.feedback,
                    }),
                },
            });

            return updatedSubmission;
        }
    );

    return result;
};