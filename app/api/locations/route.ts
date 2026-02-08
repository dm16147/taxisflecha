import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { locations } from "@/shared/schema";
import { InsertLocationSchema } from "@/shared/schema";
import { count, desc, ilike, and, asc } from "drizzle-orm";
import { requireAuth, requireRole } from "@/lib/auth-helpers";

// GET - List locations with pagination (Authenticated users)
export async function GET(request: NextRequest) {
  try {
    const requestId = request.headers.get("x-vercel-id") || crypto.randomUUID();
    // Require authentication only
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 50);
    const query = (searchParams.get("q") || "").trim();
    const offset = (page - 1) * limit;

    const whereClause = query
      ? ilike(locations.name, `%${query}%`)
      : undefined;

    // Get total count
    const [{ value: total }] = await db
      .select({ value: count() })
      .from(locations)
      .where(whereClause);

    // Get paginated data
    const allLocations = await db
      .select()
      .from(locations)
      .where(whereClause)
      .orderBy(query ? asc(locations.name) : desc(locations.id))
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
      requestId,
    }, { headers: { "x-request-id": requestId } });
  } catch (error) {
    // If error is a NextResponse (from requireRole), return it
    if (error instanceof NextResponse) {
      return error;
    }

    const requestId = crypto.randomUUID();
    console.error("Erro ao buscar locais:", { requestId, error });
    return NextResponse.json(
      { error: "Erro ao buscar locais", requestId },
      { status: 500, headers: { "x-request-id": requestId } }
    );
  }
}

// POST - Create new location (MANAGER only)
export async function POST(request: NextRequest) {
  try {
    const requestId = request.headers.get("x-vercel-id") || crypto.randomUUID();
    // Require MANAGER role
    await requireRole("MANAGER");

    const body = await request.json();
    const validatedData = InsertLocationSchema.parse(body);

    const [newLocation] = await db
      .insert(locations)
      .values(validatedData)
      .returning();

    return NextResponse.json({ ...newLocation, requestId }, { status: 201, headers: { "x-request-id": requestId } });
  } catch (error) {
    const requestId = crypto.randomUUID();
    console.error("Erro ao criar local:", { requestId, error });
    return NextResponse.json(
      { error: "Erro ao criar local", details: error, requestId },
      { status: 400, headers: { "x-request-id": requestId } }
    );
  }
}
