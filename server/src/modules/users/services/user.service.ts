import bcrypt from "bcryptjs";

import { Prisma } from "../../../generated/prisma/client.js";

import { prisma } from "../../../config/database.js";

import {
    ConflictError,
    ForbiddenError,
    NotFoundError,
} from "../../../errors/app-error.js";

const PUBLIC_USER_SELECT = {
    id: true,
    name: true,
    email: true,
    role: true,
    status: true,
    createdAt: true,
    updatedAt: true,
} satisfies Prisma.UserSelect;

export interface CreateUserInput {
    name: string;
    email: string;
    password: string;
    role: "ADMIN" | "LECTURER" | "STUDENT";
}

export interface UpdateUserInput {
    name?: string;
    email?: string;
    password?: string;
    role?: "ADMIN" | "LECTURER" | "STUDENT";
    status?: "ACTIVE" | "SUSPENDED" | "INACTIVE";
}

export const getActiveLecturers = async () => {
    return prisma.user.findMany({
        where: {
            role: "LECTURER",
            status: "ACTIVE",
            deletedAt: null,
        },
        select: PUBLIC_USER_SELECT,
        orderBy: {
            name: "asc",
        },
    });
};

export const getUsers = async () => {
    return prisma.user.findMany({
        where: {
            deletedAt: null,
        },
        select: PUBLIC_USER_SELECT,
        orderBy: {
            createdAt: "desc",
        },
    });
};

export const getUserById = async (
    userId: string
) => {
    const user = await prisma.user.findFirst({
        where: {
            id: userId,
            deletedAt: null,
        },
        select: PUBLIC_USER_SELECT,
    });

    if (!user) {
        throw new NotFoundError(
            "User tidak ditemukan"
        );
    }

    return user;
};

export const createUser = async (
    input: CreateUserInput
) => {
    const existingUser =
        await prisma.user.findUnique({
            where: {
                email: input.email,
            },
            select: {
                id: true,
            },
        });

    if (existingUser) {
        throw new ConflictError(
            "Email user sudah terdaftar"
        );
    }

    const passwordHash =
        await bcrypt.hash(input.password, 12);

    try {
        return await prisma.user.create({
            data: {
                name: input.name,
                email: input.email,
                password: passwordHash,
                role: input.role,
                status: "ACTIVE",
            },
            select: PUBLIC_USER_SELECT,
        });
    } catch (error) {
        if (
            error instanceof
            Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
        ) {
            throw new ConflictError(
                "Email user sudah terdaftar"
            );
        }

        throw error;
    }
};

export const updateUser = async (
    userId: string,
    input: UpdateUserInput
) => {
    const existingUser =
        await prisma.user.findFirst({
            where: {
                id: userId,
                deletedAt: null,
            },
            select: {
                id: true,
            },
        });

    if (!existingUser) {
        throw new NotFoundError(
            "User tidak ditemukan"
        );
    }

    const data: Prisma.UserUpdateInput = {};

    if (input.name !== undefined) {
        data.name = input.name;
    }

    if (input.email !== undefined) {
        data.email = input.email;
    }

    if (input.role !== undefined) {
        data.role = input.role;
    }

    if (input.status !== undefined) {
        data.status = input.status;
    }

    if (input.password !== undefined) {
        data.password =
            await bcrypt.hash(
                input.password,
                12
            );
    }

    try {
        return await prisma.user.update({
            where: {
                id: userId,
            },
            data,
            select: PUBLIC_USER_SELECT,
        });
    } catch (error) {
        if (
            error instanceof
            Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
        ) {
            throw new ConflictError(
                "Email user sudah terdaftar"
            );
        }

        if (
            error instanceof
            Prisma.PrismaClientKnownRequestError &&
            error.code === "P2025"
        ) {
            throw new NotFoundError(
                "User tidak ditemukan"
            );
        }

        throw error;
    }
};

export const deleteUser = async (
    userId: string,
    requesterId: string
) => {
    if (userId === requesterId) {
        throw new ForbiddenError(
            "Admin tidak dapat menghapus akun sendiri"
        );
    }

    const user =
        await prisma.user.findFirst({
            where: {
                id: userId,
                deletedAt: null,
            },
            select: {
                id: true,
            },
        });

    if (!user) {
        throw new NotFoundError(
            "User tidak ditemukan"
        );
    }

    return prisma.user.update({
        where: {
            id: userId,
        },
        data: {
            status: "INACTIVE",
            deletedAt: new Date(),
        },
        select: PUBLIC_USER_SELECT,
    });
};