import { z } from "zod";

const questionTypeSchema = z.enum([
    "MULTIPLE_CHOICE",
    "TRUE_FALSE",
    "ESSAY",
    "SHORT_ANSWER",
]);

const questionBaseSchema = z.object({
    questionType: questionTypeSchema,

    questionText: z
        .string()
        .trim()
        .min(2, "Pertanyaan minimal 2 karakter")
        .max(5000, "Pertanyaan maksimal 5000 karakter"),

    options: z
        .unknown()
        .optional(),

    correctAnswer: z
        .string()
        .trim()
        .max(2000, "Jawaban maksimal 2000 karakter")
        .optional(),

    points: z
        .number()
        .int("Poin harus berupa bilangan bulat")
        .positive("Poin harus lebih dari 0")
        .max(1000, "Poin maksimal 1000")
        .optional(),

    isActive: z
        .boolean()
        .optional(),
});

export const createQuestionSchema = questionBaseSchema.superRefine(
    (data, ctx) => {
        if (
            data.questionType === "MULTIPLE_CHOICE" &&
            data.options === undefined
        ) {
            ctx.addIssue({
                code: "custom",
                path: ["options"],
                message:
                    "Options wajib diisi untuk soal pilihan ganda",
            });
        }

        if (
            data.questionType === "MULTIPLE_CHOICE" &&
            !data.correctAnswer
        ) {
            ctx.addIssue({
                code: "custom",
                path: ["correctAnswer"],
                message:
                    "Correct answer wajib diisi untuk soal pilihan ganda",
            });
        }

        if (
            data.questionType === "TRUE_FALSE" &&
            !data.correctAnswer
        ) {
            ctx.addIssue({
                code: "custom",
                path: ["correctAnswer"],
                message:
                    "Correct answer wajib diisi untuk soal true/false",
            });
        }

        if (
            data.questionType === "SHORT_ANSWER" &&
            !data.correctAnswer
        ) {
            ctx.addIssue({
                code: "custom",
                path: ["correctAnswer"],
                message:
                    "Correct answer wajib diisi untuk short answer",
            });
        }
    },
);

export const updateQuestionSchema =
    questionBaseSchema.partial();

export type CreateQuestionInput = z.infer<
    typeof createQuestionSchema
>;

export type UpdateQuestionInput = z.infer<
    typeof updateQuestionSchema
>;