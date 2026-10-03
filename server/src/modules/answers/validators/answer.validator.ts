import { z } from "zod";

export const createAnswerSchema = z.object({
    attemptQuestionId: z
        .string()
        .uuid("Attempt question ID tidak valid"),

    answer: z
        .string()
        .trim()
        .max(10000, "Jawaban maksimal 10000 karakter")
        .optional(),
});

export const updateAnswerSchema = z.object({
    answer: z
        .string()
        .trim()
        .max(10000, "Jawaban maksimal 10000 karakter")
        .optional(),
});

export const gradeAnswerSchema = z.object({
    points: z
        .number()
        .min(0, "Poin minimal 0"),

    feedback: z
        .string()
        .trim()
        .max(5000, "Feedback maksimal 5000 karakter")
        .optional(),
});

export type CreateAnswerInput = z.infer<typeof createAnswerSchema>;
export type UpdateAnswerInput = z.infer<typeof updateAnswerSchema>;
export type GradeAnswerInput = z.infer<typeof gradeAnswerSchema>;