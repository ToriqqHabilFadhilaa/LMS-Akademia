import { z } from "zod";

export const createSubmissionSchema = z.object({
    assignmentId: z
        .string()
        .uuid("Assignment ID tidak valid"),

    fileUrl: z
        .string()
        .trim()
        .url("URL file tidak valid")
        .max(1000, "URL file maksimal 1000 karakter"),
});

export const updateSubmissionSchema = z.object({
    fileUrl: z
        .string()
        .trim()
        .url("URL file tidak valid")
        .max(1000, "URL file maksimal 1000 karakter"),
});

export type CreateSubmissionInput = z.infer<
    typeof createSubmissionSchema
>;

export type UpdateSubmissionInput = z.infer<
    typeof updateSubmissionSchema
>;