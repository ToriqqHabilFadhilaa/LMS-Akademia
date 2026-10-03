import { z } from "zod";

export const createCourseOfferingSchema = z.object({
    courseId: z
        .string()
        .uuid("Course ID tidak valid"),

    lecturerId: z
        .string()
        .uuid("Lecturer ID tidak valid"),

    term: z
        .string()
        .trim()
        .min(3, "Term minimal 3 karakter")
        .max(50, "Term maksimal 50 karakter"),

    section: z
        .string()
        .trim()
        .min(1, "Section wajib diisi")
        .max(10, "Section maksimal 10 karakter")
        .toUpperCase(),
});

export const updateCourseOfferingSchema =
    createCourseOfferingSchema.partial();

export type CreateCourseOfferingInput =
    z.infer<typeof createCourseOfferingSchema>;

export type UpdateCourseOfferingInput =
    z.infer<typeof updateCourseOfferingSchema>;