import { z } from "zod";

export const createCourseSchema = z.object({
    code: z
        .string()
        .trim()
        .min(2, "Kode mata kuliah minimal 2 karakter")
        .max(20, "Kode mata kuliah maksimal 20 karakter")
        .toUpperCase(),

    name: z
        .string()
        .trim()
        .min(2, "Nama mata kuliah minimal 2 karakter")
        .max(150, "Nama mata kuliah maksimal 150 karakter"),

    description: z
        .string()
        .trim()
        .max(1000, "Deskripsi maksimal 1000 karakter")
        .optional(),
});

export const updateCourseSchema = createCourseSchema.partial();

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;