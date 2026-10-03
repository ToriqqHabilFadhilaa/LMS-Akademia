import { z } from "zod";

export const createAssignmentSchema = z.object({
    courseOfferingId: z
        .string()
        .uuid("Course offering ID tidak valid"),

    title: z
        .string()
        .trim()
        .min(2, "Judul tugas minimal 2 karakter")
        .max(200, "Judul tugas maksimal 200 karakter"),

    description: z
        .string()
        .trim()
        .max(5000, "Deskripsi maksimal 5000 karakter")
        .optional(),

    deadline: z
        .string()
        .datetime("Format deadline tidak valid"),

    maxScore: z
        .number()
        .positive("Nilai maksimal harus lebih dari 0")
        .max(1000, "Nilai maksimal terlalu besar")
        .optional(),
});

export const updateAssignmentSchema =
    createAssignmentSchema
        .omit({
            courseOfferingId: true,
        })
        .partial();

export type CreateAssignmentInput = z.infer<
    typeof createAssignmentSchema
>;

export type UpdateAssignmentInput = z.infer<
    typeof updateAssignmentSchema
>;