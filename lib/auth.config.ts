import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

const credentialsSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

export const authConfig = {
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const validatedFields = credentialsSchema.safeParse(credentials);
                
                if (!validatedFields.success) {
                    return null;
                }

                return {
                    id: "temp",
                    email: validatedFields.data.email,
                    password: validatedFields.data.password,
                } as any;
            },
        }),
    ],
    pages: {
        signIn: "/login",
        error: "/login",
    },
} satisfies NextAuthConfig;
