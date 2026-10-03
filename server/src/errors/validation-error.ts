import { ZodError } from "zod";
import { BadRequestError } from "./app-error.js";

export class ValidationError extends BadRequestError {
    public readonly fields: Record<string, string>;

    constructor(zodError: ZodError) {
        const fields: Record<string, string> = {};

        for (const issue of zodError.issues) {
            const key = issue.path.join(".") || "_root";

            if (!fields[key]) {
                fields[key] = issue.message;
            }
        }

        super("Validasi gagal");

        this.fields = fields;
    }
}