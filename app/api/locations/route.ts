import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { locations } from "@/shared/schema";
import { InsertLocationSchema } from "@/shared/schema";
import { count, desc } from "drizzle-orm";
import { requireRole } from "@/lib/auth-helpers";

// GET - List locations with pagination (MANAGER only)
export async function GET(request: NextRequest) {
  try {
    // Require MANAGER role
    await requireRole("MANAGER");

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const offset = (page - 1) * limit;

    // Get total count
    const [{ value: total }] = await db
      .select({ value: count() })
      .from(locations);

    // Get paginated data
    const allLocations = await db
      .select()
      .from(locations)
      .orderBy(desc(locations.id))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      data: allLocations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    // If error is a NextResponse (from requireRole), return it
    if (error instanceof NextResponse) {
      return error;
    }

    console.error("Erro ao buscar locais:", error);
    return NextResponse.json(
      { error: "Erro ao buscar locais" },
      { status: 500 }
    );
  }
}

// POST - Create new location (MANAGER only)
export async function POST(request: NextRequest) {
  try {
    // Require MANAGER role
    await requireRole("MANAGER");

    const body = await request.json();
    const validatedData = InsertLocationSchema.parse(body);

    const [newLocation] = await db
      .insert(locations)
      .values(validatedData)
      .returning();

    return NextResponse.json(newLocation, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar local:", error);
    return NextResponse.json(
      { error: "Erro ao criar local", details: error },
      { status: 400 }
    );
  }
}
