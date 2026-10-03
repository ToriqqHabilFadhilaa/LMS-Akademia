import { z } from "zod";

export const createExamAttemptSchema = z.object({
    examId: z
        .string()
        .uuid("Exam ID tidak valid"),
});

export type CreateExamAttemptInput = z.infer<
    typeof createExamAttemptSchema
>;