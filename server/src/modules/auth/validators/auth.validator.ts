import { z } from "zod";

const passwordSchema = z
    .string()
    .min(8, "Password minimal 8 karakter")
    .max(100, "Password maksimal 100 karakter")
    .regex(/[a-z]/, "Password harus mengandung huruf kecil")
    .regex(/[A-Z]/, "Password harus mengandung huruf besar")
    .regex(/[0-9]/, "Password harus mengandung angka");

export const registerSchema = z
    .object({
        name: z
            .string()
            .trim()
            .min(2, "Nama minimal 2 karakter")
            .max(100, "Nama maksimal 100 karakter"),

        email: z
            .string()
            .trim()
            .toLowerCase()
            .email("Format email tidak valid")
            .max(255, "Email maksimal 255 karakter"),

        password: passwordSchema,
    })
    .refine(
        (data) => {
            const emailLocalPart = data.email.split("@")[0] ?? "";

            return !data.password
                .toLowerCase()
                .includes(emailLocalPart.toLowerCase());
        },
        {
            message: "Password tidak boleh mengandung bagian dari email",
            path: ["password"],
        }
    );

export const loginSchema = z.object({
    email: z
        .string()
        .trim()
        .toLowerCase()
        .email("Format email tidak valid")
        .max(255, "Email maksimal 255 karakter"),

    password: z.string().min(1, "Password wajib diisi"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;