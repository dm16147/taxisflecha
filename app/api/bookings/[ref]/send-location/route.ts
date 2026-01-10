import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bookingsStatus, locationLogs } from "@/shared/schema";
import { eq } from "drizzle-orm";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ ref: string }> }
) {
  try {
    const { ref } = await params;

    // Check if booking exists and hasn't sent location yet
    const booking = await db.query.bookingsStatus.findFirst({
      where: eq(bookingsStatus.bookingRef, ref),
    });

    if (!booking) {
      return NextResponse.json(
        { message: "Booking not found in database" },
        { status: 404 }
      );
    }

    if (booking.locationSent) {
      return NextResponse.json(
        { message: "Location already sent for this booking" },
        { status: 400 }
      );
    }

    // Mock external API call (will be implemented later)
    const location = "-4;4";
    const success = true;
    const errorMessage = null;

    // Log the location send attempt
    await db.insert(locationLogs).values({
      bookingRef: ref,
      location,
      sendType: "manual",
      success,
      errorMessage,
    });

    // Update booking status
    await db
      .update(bookingsStatus)
      .set({
        locationSent: true,
        updatedAt: new Date(),
      })
      .where(eq(bookingsStatus.bookingRef, ref));

    return NextResponse.json({
      success: true,
      message: "Location sent successfully",
      location,
    });
  } catch (error) {
    console.error("Error sending location:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
