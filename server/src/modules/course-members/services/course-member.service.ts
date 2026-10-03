import { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../../config/database.js";

import {
    ConflictError,
    ForbiddenError,
    NotFoundError,
} from "../../../errors/app-error.js";

import type {
    CreateCourseMemberInput,
    UpdateCourseMemberInput,
} from "../validators/course-member.validator.js";

const COURSE_MEMBER_SELECT = {
    id: true,
    courseOfferingId: true,
    userId: true,
    role: true,

    user: {
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
        },
    },

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
} satisfies Prisma.CourseMemberSelect;

export const createCourseMember = async (
    input: CreateCourseMemberInput
) => {
    // Pastikan course offering tersedia
    const courseOffering = await prisma.courseOffering.findUnique({
        where: {
            id: input.courseOfferingId,
        },
    });

    if (!courseOffering) {
        throw new NotFoundError(
            "Course offering tidak ditemukan"
        );
    }

    // Pastikan user tersedia dan aktif
    const user = await prisma.user.findFirst({
        where: {
            id: input.userId,
            status: "ACTIVE",
            deletedAt: null,
        },
    });

    if (!user) {
        throw new NotFoundError(
            "User tidak ditemukan atau tidak aktif"
        );
    }

    // STUDENT hanya boleh menggunakan user dengan role STUDENT
    if (
        input.role === "STUDENT" &&
        user.role !== "STUDENT"
    ) {
        throw new ConflictError(
            "User bukan mahasiswa"
        );
    }

    try {
        return await prisma.courseMember.create({
            data: {
                courseOfferingId: input.courseOfferingId,
                userId: input.userId,
                role: input.role,
            },
            select: COURSE_MEMBER_SELECT,
        });
    } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
        ) {
            throw new ConflictError(
                "User sudah terdaftar pada course offering ini"
            );
        }

        throw error;
    }
};

export const getCourseMembers = async (
    courseOfferingId: string,
    requesterId: string,
    requesterRole: "ADMIN" | "LECTURER" | "STUDENT"
) => {
    const courseOffering =
        await prisma.courseOffering.findUnique({
            where: { id: courseOfferingId },
        });

    if (!courseOffering) {
        throw new NotFoundError(
            "Course offering tidak ditemukan"
        );
    }

    if (
        requesterRole === "LECTURER" &&
        courseOffering.lecturerId !== requesterId
    ) {
        throw new ForbiddenError(
            "Anda tidak memiliki akses ke member course offering ini"
        );
    }

    return prisma.courseMember.findMany({
        where: { courseOfferingId },
        select: COURSE_MEMBER_SELECT,
    });
};

export const getCourseMemberById = async (
    id: string
) => {
    const member = await prisma.courseMember.findUnique({
        where: {
            id,
        },
        select: COURSE_MEMBER_SELECT,
    });

    if (!member) {
        throw new NotFoundError(
            "Course member tidak ditemukan"
        );
    }

    return member;
};

export const updateCourseMember = async (
    id: string,
    input: UpdateCourseMemberInput
) => {
    const member = await prisma.courseMember.findUnique({
        where: {
            id,
        },
        include: {
            user: true,
        },
    });

    if (!member) {
        throw new NotFoundError(
            "Course member tidak ditemukan"
        );
    }

    if (
        input.role === "STUDENT" &&
        member.user.role !== "STUDENT"
    ) {
        throw new ConflictError(
            "User bukan mahasiswa"
        );
    }

    return prisma.courseMember.update({
        where: {
            id,
        },
        data: {
            role: input.role,
        },
        select: COURSE_MEMBER_SELECT,
    });
};

export const deleteCourseMember = async (
    id: string
) => {
    try {
        await prisma.courseMember.delete({
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
                "Course member tidak ditemukan"
            );
        }

        throw error;
    }
};

export const getMyCourseMembers = async (
    userId: string
) => {
    return prisma.courseMember.findMany({
        where: {
            userId,
            role: "STUDENT",
        },
        select: {
            id: true,
            courseOfferingId: true,
            userId: true,
            role: true,

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
        },
    });
};