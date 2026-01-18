import NextAuth, { type DefaultSession } from "next-auth";
import { db } from "@/lib/db";
import { users, type UserRole } from "@/shared/schema";
import { eq } from "drizzle-orm";
import { authConfig } from "./auth.config";
import { env } from "@/lib/env";

// Extend the built-in session type
declare module "next-auth" {
    interface Session {
        user: {
            id: number;
            roles: UserRole[];
        } & DefaultSession["user"];
    }

    interface User {
        id: string | number;
        roles?: UserRole[];
    }

    interface JWT {
        id?: number;
        roles?: UserRole[];
    }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    callbacks: {
        async signIn({ user, account, profile }) {
            if (!user.email) return false;

            // Check if email is in the allowed list (if ALLOWED_EMAILS is configured)
            if (env.ALLOWED_EMAILS) {
                const allowedEmails = env.ALLOWED_EMAILS.split(",").map(e => e.trim().toLowerCase());
                if (!allowedEmails.includes(user.email.toLowerCase())) {
                    console.log(`Access denied for email: ${user.email}`);
                    return false;
                }
            }

            try {
                // Check if user exists
                const existingUser = await db.query.users.findFirst({
                    where: eq(users.email, user.email),
                });

                if (existingUser) {
                    // Update last login time
                    await db
                        .update(users)
                        .set({ lastLoginAt: new Date() })
                        .where(eq(users.id, existingUser.id));

                    // Parse roles from comma-separated string
                    user.roles = existingUser.roles.split(",") as UserRole[];
                } else {
                    // Create new user with default USER role
                    const [newUser] = await db
                        .insert(users)
                        .values({
                            email: user.email,
                            name: user.name || "User",
                            roles: "USER",
                            lastLoginAt: new Date(),
                        })
                        .returning();

                    user.roles = ["USER"];
                }

                return true;
            } catch (error) {
                console.error("Error during sign in:", error);
                return false;
            }
        },
        async session({ session, token }) {
            // Use token data if available, otherwise fetch from database
            if (token.id && token.roles) {
                (session.user as any).id = token.id;
                (session.user as any).roles = token.roles;
            } else if (session.user?.email) {
                // Fetch fresh user data from database
                const dbUser = await db.query.users.findFirst({
                    where: eq(users.email, session.user.email),
                });

                if (dbUser) {
                    (session.user as any).id = dbUser.id;
                    (session.user as any).roles = dbUser.roles.split(",") as UserRole[];
                }
            }
            return session;
        },
        async jwt({ token, user, trigger }) {
            if (user) {
                token.roles = user.roles;
                // Fetch the numeric ID from database
                const dbUser = await db.query.users.findFirst({
                    where: eq(users.email, user.email!),
                });
                if (dbUser) {
                    token.id = dbUser.id;
                }
            }
            return token;
        },
    },
});
