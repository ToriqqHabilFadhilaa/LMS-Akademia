import { z } from "zod";

export const gradeSubmissionSchema = z.object({
    score: z
        .number()
        .min(0, "Nilai minimal 0")
        .max(100, "Nilai maksimal 100"),

    feedback: z
        .string()
        .trim()
        .max(5000, "Feedback maksimal 5000 karakter")
        .optional(),
});

export type GradeSubmissionInput = z.infer<
    typeof gradeSubmissionSchema
>;