import { z } from "zod";

export const userRoleSchema = z.enum([
    "ADMIN",
    "LECTURER",
    "STUDENT",
]);

export const userStatusSchema = z.enum([
    "ACTIVE",
    "SUSPENDED",
    "INACTIVE",
]);

export const createUserSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Nama minimal 2 karakter")
        .max(100, "Nama maksimal 100 karakter"),

    email: z
        .string()
        .trim()
        .email("Format email tidak valid")
        .max(150, "Email maksimal 150 karakter")
        .toLowerCase(),

    password: z
        .string()
        .min(8, "Password minimal 8 karakter")
        .max(100, "Password maksimal 100 karakter"),

    role: userRoleSchema,
});

export const updateUserSchema = z
    .object({
        name: z
            .string()
            .trim()
            .min(2, "Nama minimal 2 karakter")
            .max(100, "Nama maksimal 100 karakter")
            .optional(),

        email: z
            .string()
            .trim()
            .email("Format email tidak valid")
            .max(150, "Email maksimal 150 karakter")
            .toLowerCase()
            .optional(),

        password: z
            .string()
            .min(8, "Password minimal 8 karakter")
            .max(100, "Password maksimal 100 karakter")
            .optional(),

        role: userRoleSchema.optional(),

        status: userStatusSchema.optional(),
    })
    .refine(
        (data) =>
            Object.keys(data).length > 0,
        {
            message:
                "Minimal satu field harus diisi",
        }
    );