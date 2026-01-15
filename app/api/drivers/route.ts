import { db } from "@/lib/db";
import { drivers } from "@/shared/schema";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const driversList = await db.select({
      id: drivers.id,
      name: drivers.name,
      mobilePhone: drivers.mobilePhone,
      preferredContactTypeId: drivers.preferredContactTypeId,
      acceptedContactTypeId: drivers.acceptedContactTypeId,
    }).from(drivers);

    return NextResponse.json({ drivers: driversList });
  } catch (error) {
    console.error("Error fetching drivers:", error);
    return NextResponse.json(
      { error: "Failed to fetch drivers" },
      { status: 500 }
    );
  }
}
