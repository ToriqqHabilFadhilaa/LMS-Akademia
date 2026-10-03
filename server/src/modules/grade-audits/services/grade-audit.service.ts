import { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../../config/database.js";

import {
    ForbiddenError,
    NotFoundError,
} from "../../../errors/app-error.js";

const GRADE_AUDIT_SELECT = {
    id: true,
    submissionId: true,
    gradedById: true,
    previousScore: true,
    newScore: true,
    feedback: true,
    createdAt: true,

    gradedBy: {
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
        },
    },
} satisfies Prisma.GradeAuditSelect;

export const getGradeAuditsBySubmissionId = async (
    submissionId: string,
    requesterId: string,
    requesterRole: "ADMIN" | "LECTURER"
) => {
    const submission = await prisma.submission.findUnique({
        where: {
            id: submissionId,
        },
        select: {
            id: true,

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

    if (!submission) {
        throw new NotFoundError(
            "Submission tidak ditemukan"
        );
    }

    if (
        requesterRole === "LECTURER" &&
        submission.assignment.courseOffering.lecturerId !==
            requesterId
    ) {
        throw new ForbiddenError(
            "Anda tidak memiliki akses ke grade audit submission ini"
        );
    }

    return prisma.gradeAudit.findMany({
        where: {
            submissionId,
        },
        select: GRADE_AUDIT_SELECT,
        orderBy: {
            createdAt: "desc",
        },
    });
};