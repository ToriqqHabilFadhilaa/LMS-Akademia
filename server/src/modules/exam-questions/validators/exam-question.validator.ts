import { z } from "zod";

export const createExamQuestionSchema = z.object({
    examId: z
        .string()
        .uuid("Exam ID tidak valid"),

    questionId: z
        .string()
        .uuid("Question ID tidak valid"),

    orderNumber: z
        .number()
        .int("Nomor urut harus berupa bilangan bulat")
        .positive("Nomor urut harus lebih dari 0"),
});

export const updateExamQuestionSchema = z.object({
    orderNumber: z
        .number()
        .int("Nomor urut harus berupa bilangan bulat")
        .positive("Nomor urut harus lebih dari 0"),
});

export type CreateExamQuestionInput = z.infer<
    typeof createExamQuestionSchema
>;

export type UpdateExamQuestionInput = z.infer<
    typeof updateExamQuestionSchema
>;