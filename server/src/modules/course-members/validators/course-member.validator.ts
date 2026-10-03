import { z } from "zod";

export const createCourseMemberSchema = z.object({
    courseOfferingId: z
        .string()
        .uuid("Course offering ID tidak valid"),

    userId: z
        .string()
        .uuid("User ID tidak valid"),

    role: z
        .enum(["STUDENT", "TEACHING_ASSISTANT"])
        .default("STUDENT"),
});

export const updateCourseMemberSchema = z.object({
    role: z.enum(["STUDENT", "TEACHING_ASSISTANT"]),
});

export type CreateCourseMemberInput = z.infer<
    typeof createCourseMemberSchema
>;

export type UpdateCourseMemberInput = z.infer<
    typeof updateCourseMemberSchema
>;