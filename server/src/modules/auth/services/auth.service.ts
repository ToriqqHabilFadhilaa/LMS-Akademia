import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { prisma } from "../../../config/database.js";
import { Prisma } from "../../../generated/prisma/client.js";

import {
    ConflictError,
    ForbiddenError,
    UnauthorizedError,
} from "../../../errors/app-error.js";

import type {
    RegisterInput,
    LoginInput,
} from "../validators/auth.validator.js";

const BCRYPT_COST = 12;

const DUMMY_HASH =
    "$2a$12$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUV";

const PUBLIC_USER_SELECT = {
    id: true,
    name: true,
    email: true,
    role: true,
    status: true,
    createdAt: true,
} satisfies Prisma.UserSelect;

const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error("JWT_SECRET is not defined");
    }

    return secret;
};

export const registerUser = async (input: RegisterInput) => {
    try {
        const hashedPassword = await bcrypt.hash(
            input.password,
            BCRYPT_COST
        );

        const user = await prisma.user.create({
            data: {
                name: input.name,
                email: input.email,
                password: hashedPassword,
                role: "STUDENT",
            },
            select: PUBLIC_USER_SELECT,
        });

        return user;
    } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
        ) {
            throw new ConflictError("Email sudah terdaftar");
        }

        throw error;
    }
};

export const loginUser = async (
    input: LoginInput
) => {
    const user = await prisma.user.findUnique({
        where: {
            email: input.email,
        },
        select: {
            id: true,
            name: true,
            email: true,
            password: true,
            role: true,
            status: true,
            createdAt: true,
            deletedAt: true,
        },
    });

    const passwordValid = await bcrypt.compare(
        input.password,
        user?.password ?? DUMMY_HASH
    );

    if (!user || !passwordValid) {
        throw new UnauthorizedError(
            "Email atau password salah"
        );
    }

    if (
        user.status !== "ACTIVE" ||
        user.deletedAt
    ) {
        throw new ForbiddenError(
            "Akun tidak aktif"
        );
    }

    const token = jwt.sign(
        {
            sub: user.id,
            role: user.role,
        },
        getJwtSecret(),
        {
            expiresIn: "1d",
        }
    );

    const publicUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
    };

    return {
        user: publicUser,
        token,
    };
};

export const getCurrentUser = async (
    userId: string
) => {
    const user = await prisma.user.findFirst({
        where: {
            id: userId,
            status: "ACTIVE",
            deletedAt: null,
        },
        select: PUBLIC_USER_SELECT,
    });

    if (!user) {
        throw new UnauthorizedError(
            "User tidak ditemukan atau tidak aktif"
        );
    }

    return user;
};