import { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../../config/database.js";

import { NotFoundError } from "../../../errors/app-error.js";

import type {
    CreateMaterialInput,
    UpdateMaterialInput,
} from "../validators/material.validator.js";

const MATERIAL_SELECT = {
    id: true,
    courseOfferingId: true,
    title: true,
    description: true,
    fileUrl: true,
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
} satisfies Prisma.MaterialSelect;

export const createMaterial = async (
    input: CreateMaterialInput
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

    return prisma.material.create({
        data: {
            courseOfferingId: input.courseOfferingId,
            title: input.title,
            description: input.description ?? null,
            fileUrl: input.fileUrl ?? null,
        },
        select: MATERIAL_SELECT,
    });
};

export const getMaterials = async (
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

    return prisma.material.findMany({
        where: {
            courseOfferingId,
        },
        select: MATERIAL_SELECT,
        orderBy: {
            createdAt: "desc",
        },
    });
};

export const getMaterialById = async (
    id: string
) => {
    const material = await prisma.material.findUnique({
        where: {
            id,
        },
        select: MATERIAL_SELECT,
    });

    if (!material) {
        throw new NotFoundError(
            "Materi tidak ditemukan"
        );
    }

    return material;
};

export const updateMaterial = async (
    id: string,
    input: UpdateMaterialInput
) => {
    try {
        return await prisma.material.update({
            where: {
                id,
            },
            data: {
                ...(input.title !== undefined
                    ? { title: input.title }
                    : {}),

                ...(input.description !== undefined
                    ? { description: input.description }
                    : {}),

                ...(input.fileUrl !== undefined
                    ? { fileUrl: input.fileUrl }
                    : {}),
            },
            select: MATERIAL_SELECT,
        });
    } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2025"
        ) {
            throw new NotFoundError(
                "Materi tidak ditemukan"
            );
        }

        throw error;
    }
};

export const deleteMaterial = async (
    id: string
) => {
    try {
        await prisma.material.delete({
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
                "Materi tidak ditemukan"
            );
        }

        throw error;
    }
};

export const getMyMaterials = async (
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

    return prisma.material.findMany({
        where: {
            courseOfferingId,
        },
        select: MATERIAL_SELECT,
        orderBy: {
            createdAt: "desc",
        },
    });
};