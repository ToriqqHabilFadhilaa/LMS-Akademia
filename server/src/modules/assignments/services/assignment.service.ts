import { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../../config/database.js";

import { NotFoundError } from "../../../errors/app-error.js";

import type {
    CreateAssignmentInput,
    UpdateAssignmentInput,
} from "../validators/assignment.validator.js";

const ASSIGNMENT_SELECT = {
    id: true,
    courseOfferingId: true,
    title: true,
    description: true,
    deadline: true,
    maxScore: true,
    createdAt: true,
    updatedAt: true,

    courseOffering: {
        select: {
            id: true,
            term: true,
            section: true,
            status: true,

            course: {
                select: {
                    id: true,
                    code: true,
                    name: true,
                },
            },
        },
    },
} satisfies Prisma.AssignmentSelect;

export const createAssignment = async (
    input: CreateAssignmentInput
) => {
    const courseOffering =
        await prisma.courseOffering.findUnique({
            where: {
                id: input.courseOfferingId,
            },
        });

    if (!courseOffering) {
        throw new NotFoundError(
            "Course offering tidak ditemukan"
        );
    }

    return prisma.assignment.create({
        data: {
            courseOfferingId: input.courseOfferingId,
            title: input.title,
            deadline: new Date(input.deadline),

            ...(input.description !== undefined && {
                description: input.description,
            }),

            ...(input.maxScore !== undefined && {
                maxScore: input.maxScore,
            }),
        },
        select: ASSIGNMENT_SELECT,
    });
};

export const getAssignments = async (
    courseOfferingId: string
) => {
    const courseOffering =
        await prisma.courseOffering.findUnique({
            where: {
                id: courseOfferingId,
            },
        });

    if (!courseOffering) {
        throw new NotFoundError(
            "Course offering tidak ditemukan"
        );
    }

    return prisma.assignment.findMany({
        where: {
            courseOfferingId,
        },
        select: ASSIGNMENT_SELECT,
        orderBy: {
            deadline: "asc",
        },
    });
};

export const getAssignmentById = async (
    id: string
) => {
    const assignment = await prisma.assignment.findUnique({
        where: {
            id,
        },
        select: ASSIGNMENT_SELECT,
    });

    if (!assignment) {
        throw new NotFoundError(
            "Assignment tidak ditemukan"
        );
    }

    return assignment;
};

export const updateAssignment = async (
    id: string,
    input: UpdateAssignmentInput
) => {
    try {
        return await prisma.assignment.update({
            where: {
                id,
            },
            data: {
                ...(input.title !== undefined && {
                    title: input.title,
                }),

                ...(input.description !== undefined && {
                    description: input.description,
                }),

                ...(input.deadline !== undefined && {
                    deadline: new Date(input.deadline),
                }),

                ...(input.maxScore !== undefined && {
                    maxScore: input.maxScore,
                }),
            },
            select: ASSIGNMENT_SELECT,
        });
    } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2025"
        ) {
            throw new NotFoundError(
                "Assignment tidak ditemukan"
            );
        }

        throw error;
    }
};

export const deleteAssignment = async (
    id: string
) => {
    try {
        await prisma.assignment.delete({
            where: {
                id,
            },
        });
    } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2025"
        ) {
            throw new NotFoundError(
                "Assignment tidak ditemukan"
            );
        }

        throw error;
    }
};

export const getMyAssignments = async (
    courseOfferingId: string,
    studentId: string
) => {
    const member =
        await prisma.courseMember.findUnique({
            where: {
                courseOfferingId_userId: {
                    courseOfferingId,
                    userId: studentId,
                },
            },
            select: {
                role: true,
            },
        });

    if (!member || member.role !== "STUDENT") {
        throw new NotFoundError(
            "Course offering tidak ditemukan"
        );
    }

    return prisma.assignment.findMany({
        where: {
            courseOfferingId,
        },
        select: ASSIGNMENT_SELECT,
        orderBy: {
            deadline: "asc",
        },
    });
};