import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hotels } from "@/shared/schema";
import { insertHotelSchema } from "@/shared/schema";
import { eq } from "drizzle-orm";

// GET - Listar todos os hotéis
export async function GET() {
  try {
    const allHotels = await db.select().from(hotels);
    return NextResponse.json(allHotels);
  } catch (error) {
    console.error("Erro ao buscar hotéis:", error);
    return NextResponse.json(
      { error: "Erro ao buscar hotéis" },
      { status: 500 }
    );
  }
}

// POST - Criar novo hotel
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = insertHotelSchema.parse(body);

    const [newHotel] = await db
      .insert(hotels)
      .values(validatedData)
      .returning();

    return NextResponse.json(newHotel, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar hotel:", error);
    return NextResponse.json(
      { error: "Erro ao criar hotel", details: error },
      { status: 400 }
    );
  }
}
