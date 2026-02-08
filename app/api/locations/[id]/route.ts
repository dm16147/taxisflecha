import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { locations } from "@/shared/schema";
import { updateLocationSchema } from "@/shared/schema";
import { eq } from "drizzle-orm";
import { requireRole } from "@/lib/auth-helpers";

// GET - Get specific location (MANAGER only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require MANAGER role
    await requireRole("MANAGER");

    const { id } = await params;
    const locationId = parseInt(id);
    const [location] = await db
      .select()
      .from(locations)
      .where(eq(locations.id, locationId));

    if (!location) {
      return NextResponse.json(
        { error: "Local não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(location);
  } catch (error) {
    // If error is a NextResponse (from requireRole), return it
    if (error instanceof NextResponse) {
      return error;
    }

    console.error("Erro ao buscar local:", error);
    return NextResponse.json(
      { error: "Erro ao buscar local" },
      { status: 500 }
    );
  }
}

// PATCH - Update location (MANAGER only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require MANAGER role
    await requireRole("MANAGER");

    const { id } = await params;
    const locationId = parseInt(id);
    const body = await request.json();
    const validatedData = updateLocationSchema.parse(body);

    const [updatedLocation] = await db
      .update(locations)
      .set({ ...validatedData, updatedAt: new Date() })
      .where(eq(locations.id, locationId))
      .returning();

    if (!updatedLocation) {
      return NextResponse.json(
        { error: "Local não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedLocation);
  } catch (error) {
    // If error is a NextResponse (from requireRole), return it
    if (error instanceof NextResponse) {
      return error;
    }

    console.error("Erro ao atualizar local:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar local", details: error },
      { status: 400 }
    );
  }
}

// DELETE - Remove location (MANAGER only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require MANAGER role
    await requireRole("MANAGER");

    const { id } = await params;
    const locationId = parseInt(id);

    const [deletedLocation] = await db
      .delete(locations)
      .where(eq(locations.id, locationId))
      .returning();

    if (!deletedLocation) {
      return NextResponse.json(
        { error: "Local não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Local removida com sucesso" });
  } catch (error) {
    // If error is a NextResponse (from requireRole), return it
    if (error instanceof NextResponse) {
      return error;
    }

    console.error("Erro ao remover local:", error);
    return NextResponse.json(
      { error: "Erro ao remover local" },
      { status: 500 }
    );
  }
}
