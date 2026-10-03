import { Prisma } from "../../../generated/prisma/client.js";

import { prisma } from "../../../config/database.js";

import {
    ConflictError,
    NotFoundError,
} from "../../../errors/app-error.js";

import type {
    CreateCourseInput,
    UpdateCourseInput,
} from "../validators/course.validator.js";

const COURSE_SELECT = {
    id: true,
    code: true,
    name: true,
    description: true,
    createdAt: true,
    updatedAt: true,
} satisfies Prisma.CourseSelect;

export const createCourse = async (
    input: CreateCourseInput
) => {
    try {
        return await prisma.course.create({
            data: {
                code: input.code,
                name: input.name,

                ...(input.description !== undefined
                    ? {
                        description: input.description,
                    }
                    : {}),
            },
            select: COURSE_SELECT,
        });
    } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
        ) {
            throw new ConflictError(
                "Kode mata kuliah sudah digunakan"
            );
        }

        throw error;
    }
};

export const getCourses = async () => {
    return prisma.course.findMany({
        select: COURSE_SELECT,
        orderBy: {
            code: "asc",
        },
    });
};

export const getCourseById = async (id: string) => {
    const course = await prisma.course.findUnique({
        where: { id },
        select: COURSE_SELECT,
    });

    if (!course) {
        throw new NotFoundError(
            "Mata kuliah tidak ditemukan"
        );
    }

    return course;
};

export const updateCourse = async (
    id: string,
    input: UpdateCourseInput
) => {
    try {
        const data: Prisma.CourseUpdateInput = {};

        if (input.code !== undefined) {
            data.code = input.code;
        }

        if (input.name !== undefined) {
            data.name = input.name;
        }

        if (input.description !== undefined) {
            data.description = input.description;
        }

        return await prisma.course.update({
            where: { id },
            data,
            select: COURSE_SELECT,
        });
    } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError
        ) {
            if (error.code === "P2025") {
                throw new NotFoundError(
                    "Mata kuliah tidak ditemukan"
                );
            }

            if (error.code === "P2002") {
                throw new ConflictError(
                    "Kode mata kuliah sudah digunakan"
                );
            }
        }

        throw error;
    }
};