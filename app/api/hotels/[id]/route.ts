import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hotels } from "@/shared/schema";
import { updateHotelSchema } from "@/shared/schema";
import { eq } from "drizzle-orm";

// GET - Buscar um hotel específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const hotelId = parseInt(params.id);
    const [hotel] = await db
      .select()
      .from(hotels)
      .where(eq(hotels.id, hotelId));

    if (!hotel) {
      return NextResponse.json(
        { error: "Hotel não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(hotel);
  } catch (error) {
    console.error("Erro ao buscar hotel:", error);
    return NextResponse.json(
      { error: "Erro ao buscar hotel" },
      { status: 500 }
    );
  }
}

// PATCH - Atualizar hotel
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const hotelId = parseInt(params.id);
    const body = await request.json();
    const validatedData = updateHotelSchema.parse(body);

    const [updatedHotel] = await db
      .update(hotels)
      .set({ ...validatedData, updatedAt: new Date() })
      .where(eq(hotels.id, hotelId))
      .returning();

    if (!updatedHotel) {
      return NextResponse.json(
        { error: "Hotel não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedHotel);
  } catch (error) {
    console.error("Erro ao atualizar hotel:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar hotel", details: error },
      { status: 400 }
    );
  }
}

// DELETE - Remover hotel
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const hotelId = parseInt(params.id);

    const [deletedHotel] = await db
      .delete(hotels)
      .where(eq(hotels.id, hotelId))
      .returning();

    if (!deletedHotel) {
      return NextResponse.json(
        { error: "Hotel não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Hotel removido com sucesso" });
  } catch (error) {
    console.error("Erro ao remover hotel:", error);
    return NextResponse.json(
      { error: "Erro ao remover hotel" },
      { status: 500 }
    );
  }
}
