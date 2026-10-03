import { z } from "zod";

const eventTypeSchema = z.enum([
    "TAB_SWITCH",
    "WINDOW_BLUR",
    "FULLSCREEN_EXIT",
    "COPY",
    "PASTE",
    "REFRESH",
    "MULTIPLE_SESSION",
    "CONNECTION_LOST",
]);

export const createActivityLogSchema = z.object({
    attemptId: z
        .string()
        .uuid("Attempt ID tidak valid"),

    eventType: eventTypeSchema,

    eventData: z
        .unknown()
        .optional(),
});

export type CreateActivityLogInput = z.infer<
    typeof createActivityLogSchema
>;