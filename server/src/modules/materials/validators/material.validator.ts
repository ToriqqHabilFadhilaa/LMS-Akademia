import { z } from "zod";

export const createMaterialSchema = z.object({
    courseOfferingId: z
        .string()
        .uuid("Course offering ID tidak valid"),

    title: z
        .string()
        .trim()
        .min(2, "Judul materi minimal 2 karakter")
        .max(200, "Judul materi maksimal 200 karakter"),

    description: z
        .string()
        .trim()
        .max(2000, "Deskripsi maksimal 2000 karakter")
        .optional(),

    fileUrl: z
        .string()
        .trim()
        .url("URL file tidak valid")
        .max(1000, "URL file maksimal 1000 karakter")
        .optional(),
});

export const updateMaterialSchema =
    createMaterialSchema
        .omit({
            courseOfferingId: true,
        })
        .partial();

export type CreateMaterialInput = z.infer<
    typeof createMaterialSchema
>;

export type UpdateMaterialInput = z.infer<
    typeof updateMaterialSchema
>;