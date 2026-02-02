import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bookingsStatus } from "@/shared/schema";
import { eq } from "drizzle-orm";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ ref: string }> }
) {
  try {
    const { ref } = await params;
    const { locationId } = await request.json();

    if (typeof locationId !== "number") {
      return NextResponse.json(
        { message: "Localização inválida" },
        { status: 400 }
      );
    }

    // Check if booking exists
    const booking = await db.query.bookingsStatus.findFirst({
      where: eq(bookingsStatus.bookingRef, ref),
    });

    if (!booking) {
      return NextResponse.json(
        { message: "Não foi encontrado nenhum registo para a reserva selecionada." },
        { status: 404 }
      );
    }

    // Update selected location
    await db
      .update(bookingsStatus)
      .set({
        selectedLocationId: locationId,
        updatedAt: new Date(),
      })
      .where(eq(bookingsStatus.bookingRef, ref));

    return NextResponse.json({
      success: true,
      message: "Localização selecionada com sucesso!",
    });
  } catch (error) {
    console.error("Error selecting location:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
