import { Prisma } from "../../../generated/prisma/client.js";

import { prisma } from "../../../config/database.js";

import {
    ConflictError,
    NotFoundError,
} from "../../../errors/app-error.js";

import type {
    CreateCourseOfferingInput,
    UpdateCourseOfferingInput,
} from "../validators/course-offering.validator.js";

const COURSE_OFFERING_SELECT = {
    id: true,
    courseId: true,
    lecturerId: true,
    term: true,
    section: true,
    status: true,
    createdAt: true,
    updatedAt: true,

    course: {
        select: {
            id: true,
            code: true,
            name: true,
        },
    },

    lecturer: {
        select: {
            id: true,
            name: true,
            email: true,
        },
    },
} satisfies Prisma.CourseOfferingSelect;

export const createCourseOffering = async (
    input: CreateCourseOfferingInput
) => {
    // Pastikan Course tersedia
    const course = await prisma.course.findUnique({
        where: {
            id: input.courseId,
        },
    });

    if (!course) {
        throw new NotFoundError(
            "Mata kuliah tidak ditemukan"
        );
    }

    // Pastikan user benar-benar LECTURER
    const lecturer = await prisma.user.findFirst({
        where: {
            id: input.lecturerId,
            role: "LECTURER",
            status: "ACTIVE",
            deletedAt: null,
        },
    });

    if (!lecturer) {
        throw new NotFoundError(
            "Dosen tidak ditemukan atau tidak aktif"
        );
    }

    try {
        return await prisma.courseOffering.create({
            data: {
                courseId: input.courseId,
                lecturerId: input.lecturerId,
                term: input.term,
                section: input.section,
            },
            select: COURSE_OFFERING_SELECT,
        });
    } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
        ) {
            throw new ConflictError(
                "Course offering untuk mata kuliah, term, dan section tersebut sudah ada"
            );
        }

        throw error;
    }
};

export const getLecturerCourseOfferings = async (
    lecturerId: string
) => {
    return prisma.courseOffering.findMany({
        where: { lecturerId },
        select: COURSE_OFFERING_SELECT,
        orderBy: [
            { term: "desc" },
            { section: "asc" },
        ],
    });
};

export const getCourseOfferings = async () => {
    return prisma.courseOffering.findMany({
        select: COURSE_OFFERING_SELECT,
        orderBy: [
            {
                term: "desc",
            },
            {
                section: "asc",
            },
        ],
    });
};

export const getCourseOfferingById = async (
    id: string
) => {
    const offering = await prisma.courseOffering.findUnique({
        where: {
            id,
        },
        select: COURSE_OFFERING_SELECT,
    });

    if (!offering) {
        throw new NotFoundError(
            "Course offering tidak ditemukan"
        );
    }

    return offering;
};

export const updateCourseOffering = async (
    id: string,
    input: UpdateCourseOfferingInput
) => {
    if (input.courseId !== undefined) {
        const course = await prisma.course.findUnique({
            where: {
                id: input.courseId,
            },
        });

        if (!course) {
            throw new NotFoundError(
                "Mata kuliah tidak ditemukan"
            );
        }
    }

    if (input.lecturerId !== undefined) {
        const lecturer = await prisma.user.findFirst({
            where: {
                id: input.lecturerId,
                role: "LECTURER",
                status: "ACTIVE",
                deletedAt: null,
            },
        });

        if (!lecturer) {
            throw new NotFoundError(
                "Dosen tidak ditemukan atau tidak aktif"
            );
        }
    }

    const data: Prisma.CourseOfferingUpdateInput = {};

    if (input.courseId !== undefined) {
        data.course = {
            connect: {
                id: input.courseId,
            },
        };
    }

    if (input.lecturerId !== undefined) {
        data.lecturer = {
            connect: {
                id: input.lecturerId,
            },
        };
    }

    if (input.term !== undefined) {
        data.term = input.term;
    }

    if (input.section !== undefined) {
        data.section = input.section;
    }

    try {
        return await prisma.courseOffering.update({
            where: {
                id,
            },
            data,
            select: COURSE_OFFERING_SELECT,
        });
    } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError
        ) {
            if (error.code === "P2025") {
                throw new NotFoundError(
                    "Course offering tidak ditemukan"
                );
            }

            if (error.code === "P2002") {
                throw new ConflictError(
                    "Course offering tersebut sudah ada"
                );
            }
        }

        throw error;
    }
};

export const getMyCourseOfferingById = async (
    courseOfferingId: string,
    studentId: string
) => {
    const member = await prisma.courseMember.findUnique({
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

    const offering =
        await prisma.courseOffering.findUnique({
            where: {
                id: courseOfferingId,
            },
            select: COURSE_OFFERING_SELECT,
        });

    if (!offering) {
        throw new NotFoundError(
            "Course offering tidak ditemukan"
        );
    }

    return offering;
};