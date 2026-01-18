import { z } from "zod";

const envSchema = z.object({
    DATABASE_URL: z.string().optional(),
    NEXTAUTH_SECRET: z.string().default("development-secret"),
    NEXTAUTH_URL: z.string().default("http://localhost:3000"),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    // Comma-separated list of allowed email addresses for Google OAuth
    ALLOWED_EMAILS: z.string().optional(),
});

export const env = envSchema.parse(process.env);