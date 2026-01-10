import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bookingsStatus, locationLogs } from "@/shared/schema";
import { eq, and } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    // Fetch all bookings with autoSendLocation = true and locationSent = false
    const bookingsToSend = await db.query.bookingsStatus.findMany({
      where: and(
        eq(bookingsStatus.autoSendLocation, true),
        eq(bookingsStatus.locationSent, false)
      ),
    });

    const results = {
      success: 0,
      failed: 0,
      details: [] as any[],
    };

    for (const booking of bookingsToSend) {
      try {
        // Mock external API call (will be implemented later)
        const location = "1;1";
        const success = true;

        // Log the location send attempt
        await db.insert(locationLogs).values({
          bookingRef: booking.bookingRef,
          location,
          sendType: "automatic",
          success,
          errorMessage: null,
        });

        // Update booking status
        await db
          .update(bookingsStatus)
          .set({
            locationSent: true,
            updatedAt: new Date(),
          })
          .where(eq(bookingsStatus.bookingRef, booking.bookingRef));

        results.success++;
        results.details.push({
          ref: booking.bookingRef,
          status: "sent",
          location,
        });
      } catch (error) {
        console.error(`Error sending location for ${booking.bookingRef}:`, error);
        
        // Log the failed attempt
        await db.insert(locationLogs).values({
          bookingRef: booking.bookingRef,
          location: "1;1",
          sendType: "automatic",
          success: false,
          errorMessage: error instanceof Error ? error.message : "Unknown error",
        });

        results.failed++;
        results.details.push({
          ref: booking.bookingRef,
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Auto-send completed: ${results.success} successful, ${results.failed} failed`,
      results,
    });
  } catch (error) {
    console.error("Error in auto-send location:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
