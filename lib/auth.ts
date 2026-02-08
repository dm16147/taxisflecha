import NextAuth, { type DefaultSession } from "next-auth";
import { db } from "@/lib/db";
import { users, type UserRole } from "@/shared/schema";
import { eq } from "drizzle-orm";
import { authConfig } from "./auth.config";
import { env } from "@/lib/env";
import bcrypt from "bcryptjs";

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
        password?: string;
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

            // Handle Credentials provider (email/password login)
            if (account?.provider === "credentials") {
                try {
                    // Find user in database
                    const dbUser = await db.query.users.findFirst({
                        where: eq(users.email, user.email.toLowerCase()),
                    });

                    if (!dbUser || !dbUser.password) {
                        console.log(`Login failed: User not found or no password set for ${user.email}`);
                        return false;
                    }

                    // Verify password
                    const isValidPassword = await bcrypt.compare(
                        (user as any).password,
                        dbUser.password
                    );

                    if (!isValidPassword) {
                        console.log(`Login failed: Invalid password for ${user.email}`);
                        return false;
                    }

                    // Update user object with database data
                    user.id = dbUser.id;
                    user.name = dbUser.name;
                    user.roles = dbUser.roles.split(",") as UserRole[];

                    // Update last login time
                    await db
                        .update(users)
                        .set({ lastLoginAt: new Date() })
                        .where(eq(users.id, dbUser.id));

                    return true;
                } catch (error) {
                    console.error("Error during credentials sign in:", error);
                    return false;
                }
            }

            // Handle OAuth providers (Google, etc.)
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
                // Fetch the numeric ID from database
                const dbUser = await db.query.users.findFirst({
                    where: eq(users.email, user.email!),
                });
                if (dbUser) {
                    token.id = dbUser.id;
                    token.roles = dbUser.roles.split(",") as UserRole[];
                }
            }
            return token;
        },
    },
});
