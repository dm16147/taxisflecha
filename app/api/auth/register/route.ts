import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
    email: z.string().email("Email inválido"),
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        
        // Validate input
        const validationResult = registerSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: validationResult.error.errors[0].message },
                { status: 400 }
            );
        }

        const { email, name, password } = validationResult.data;

        // Check if user already exists
        const existingUser = await db.query.users.findFirst({
            where: eq(users.email, email.toLowerCase()),
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "Este email já está registado" },
                { status: 400 }
            );
        }

        // Hash password with bcrypt (10 rounds is a good balance of security and performance)
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const [newUser] = await db
            .insert(users)
            .values({
                email: email.toLowerCase(),
                name,
                password: hashedPassword,
                roles: "USER",
            })
            .returning({
                id: users.id,
                email: users.email,
                name: users.name,
            });

        return NextResponse.json(
            { 
                message: "Utilizador criado com sucesso",
                user: newUser,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { error: "Erro ao criar utilizador. Por favor, tente novamente." },
            { status: 500 }
        );
    }
}
