import { z } from "zod";

const examBaseSchema = z.object({
    courseOfferingId: z
        .string()
        .uuid("Course offering ID tidak valid"),

    title: z
        .string()
        .trim()
        .min(2, "Judul ujian minimal 2 karakter")
        .max(200, "Judul ujian maksimal 200 karakter"),

    description: z
        .string()
        .trim()
        .max(5000, "Deskripsi maksimal 5000 karakter")
        .optional(),

    durationMinutes: z
        .number()
        .int("Durasi harus berupa bilangan bulat")
        .positive("Durasi harus lebih dari 0")
        .max(1440, "Durasi maksimal 1440 menit"),

    startAt: z
        .string()
        .datetime("Format waktu mulai tidak valid"),

    endAt: z
        .string()
        .datetime("Format waktu selesai tidak valid"),

    maxAttempts: z
        .number()
        .int("Jumlah percobaan harus berupa bilangan bulat")
        .positive("Jumlah percobaan harus lebih dari 0")
        .max(10, "Jumlah percobaan maksimal 10")
        .optional(),

    shuffleQuestions: z
        .boolean()
        .optional(),

    shuffleAnswers: z
        .boolean()
        .optional(),
});

export const createExamSchema = examBaseSchema.refine(
    (data) =>
        new Date(data.endAt) > new Date(data.startAt),
    {
        message:
            "Waktu selesai harus lebih besar dari waktu mulai",
        path: ["endAt"],
    }
);

export const updateExamSchema = examBaseSchema
    .omit({
        courseOfferingId: true,
    })
    .partial()
    .refine(
        (data) => {
            if (!data.startAt || !data.endAt) {
                return true;
            }

            return (
                new Date(data.endAt) > new Date(data.startAt)
            );
        },
        {
            message:
                "Waktu selesai harus lebih besar dari waktu mulai",
            path: ["endAt"],
        }
    );

export type CreateExamInput = z.infer<
    typeof createExamSchema
>;

export type UpdateExamInput = z.infer<
    typeof updateExamSchema
>;