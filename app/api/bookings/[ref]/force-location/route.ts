import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bookingsStatus } from "@/shared/schema";
import { eq, not } from "drizzle-orm";

export async function POST(
  request: Request,
  { params }: { params: { ref: string } }
) {
  try {
    const parm = await params;
    const ref = parm.ref;

    const result = await db
      .update(bookingsStatus)
      .set({ 
        autoSendLocation: not(bookingsStatus.autoSendLocation),
        updatedAt: new Date() 
      })
      .where(eq(bookingsStatus.bookingRef, ref))
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { message: "Booking not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      autoSendLocation: result[0].autoSendLocation,
      message: `Auto-send location ${result[0].autoSendLocation ? 'enabled' : 'disabled'}`,
    });
  } catch (error) {
    console.error("Error toggling auto-send location:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
