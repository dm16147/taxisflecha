import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bookingsStatus, cronLogs, locationLogs, locations } from "@/shared/schema";
import { eq, and, lte, gte, inArray } from "drizzle-orm";

interface ExternalLocationPayload {
  timestamp: string;
  location: {
    lat: number;
    lng: number;
  };
  status: "BEFORE_PICKUP";
}

async function sendLocationToExternalAPI(
  bookingRef: string,
  latitude: number,
  longitude: number
): Promise<{ success: boolean; errorMessage?: string }> {
  try {
    const payload: ExternalLocationPayload = {
      timestamp: new Date().toISOString(),
      location: {
        lat: latitude,
        lng: longitude,
      },
      status: "BEFORE_PICKUP",
    };

    const url = `${process.env.VITE_BASE_API_URL}/bookings/${bookingRef}/vehicles/1/location`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.VITE_BASE_API_KEY || "",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`External API error for ${bookingRef}:`, response.status, errorText);
      return {
        success: false,
        errorMessage: `External API returned ${response.status}: ${errorText}`,
      };
    }

    return { success: true };
  } catch (error) {
    console.error(`Exception calling external API for ${bookingRef}:`, error);
    return {
      success: false,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

type BookingToSend = {
  bookingRef: string;
  pickupDate: Date | null;
  selectedLocationId: number | null;
  locationId: number | null;
  locationName: string | null;
  locationLatitude: number | null;
  locationLongitude: number | null;
};

type SendResult = {
  bookingRef: string;
  status: "sent" | "failed" | "skipped";
  success: boolean;
  location?: string;
  coordinates?: { lat: number; lng: number };
  error?: string;
  reason?: string;
};

export async function POST(request: Request) {
  let cronLogId: number | undefined;
  try {
    // Verify cron secret for Vercel Cron jobs
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get('authorization');
    const headerSecret = request.headers.get('x-cron-secret');
    const url = new URL(request.url);
    const querySecret = url.searchParams.get('secret');

    if (cronSecret) {
      const bearerMatch = authHeader === `Bearer ${cronSecret}`;
      const headerMatch = headerSecret === cronSecret;
      const queryMatch = querySecret === cronSecret;

      if (!bearerMatch && !headerMatch && !queryMatch) {
        console.warn("Unauthorized cron attempt");
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      }
    }

    const now = new Date();
    const requestId = request.headers.get("x-vercel-id") || crypto.randomUUID();
    console.info("auto-send-location started", { requestId, now: now.toISOString() });
    const cronLog = await db.insert(cronLogs).values({
      jobName: "auto-send-location",
      status: "started",
      requestId,
      startedAt: now,
    }).returning({ id: cronLogs.id });
    cronLogId = cronLog[0]?.id;
    const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);

    // Fetch all bookings with autoSendLocation = true, locationSent = false,
    // and pickupDate within the next 30 minutes
    const bookingsToSend = await db
      .select({
        bookingRef: bookingsStatus.bookingRef,
        pickupDate: bookingsStatus.pickupDate,
        selectedLocationId: bookingsStatus.selectedLocationId,
        locationId: locations.id,
        locationName: locations.name,
        locationLatitude: locations.latitude,
        locationLongitude: locations.longitude,
      })
      .from(bookingsStatus)
      .leftJoin(locations, eq(bookingsStatus.selectedLocationId, locations.id))
      .where(
        and(
          eq(bookingsStatus.autoSendLocation, true),
          eq(bookingsStatus.locationSent, false),
          lte(bookingsStatus.pickupDate, thirtyMinutesFromNow),
          gte(bookingsStatus.pickupDate, now)
        )
      );

    // Filter and validate bookings
    const validBookings: BookingToSend[] = [];
    const skippedBookings: SendResult[] = [];

    for (const booking of bookingsToSend) {
      if (!booking.locationId || !booking.locationLatitude || !booking.locationLongitude) {
        console.warn(`Booking ${booking.bookingRef} has no location selected, skipping`);
        skippedBookings.push({
          bookingRef: booking.bookingRef,
          status: "skipped",
          success: false,
          reason: "No location selected",
        });
        continue;
      }

      if (!booking.pickupDate) {
        console.warn(`Booking ${booking.bookingRef} has no pickup date, skipping`);
        skippedBookings.push({
          bookingRef: booking.bookingRef,
          status: "skipped",
          success: false,
          reason: "No pickup date",
        });
        continue;
      }

      validBookings.push(booking as BookingToSend);
    }

    // Create promises for all API calls
    const sendPromises = validBookings.map(async (booking): Promise<SendResult> => {
      try {
        const { success, errorMessage } = await sendLocationToExternalAPI(
          booking.bookingRef,
          booking.locationLatitude!,
          booking.locationLongitude!
        );

        if (success) {
          return {
            bookingRef: booking.bookingRef,
            status: "sent",
            success: true,
            location: booking.locationName!,
            coordinates: {
              lat: booking.locationLatitude!,
              lng: booking.locationLongitude!,
            },
          };
        } else {
          return {
            bookingRef: booking.bookingRef,
            status: "failed",
            success: false,
            error: errorMessage || "External API call failed",
          };
        }
      } catch (error) {
        console.error(`Error sending location for ${booking.bookingRef}:`, error);
        return {
          bookingRef: booking.bookingRef,
          status: "failed",
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    });

    // Execute all promises in parallel
    const sendResults = await Promise.allSettled(sendPromises);

    // Process results and update database
    const results = {
      success: 0,
      failed: 0,
      skipped: skippedBookings.length,
      details: [...skippedBookings] as SendResult[],
    };

    // Prepare batch database operations
    const logEntries: Array<typeof locationLogs.$inferInsert> = [];
    const successfulBookingRefs: string[] = [];

    for (const result of sendResults) {
      if (result.status === "fulfilled") {
        const sendResult = result.value;
        const booking = validBookings.find((b) => b.bookingRef === sendResult.bookingRef)!;

        // Prepare log entry
        logEntries.push({
          bookingRef: sendResult.bookingRef,
          location: `${booking.locationLatitude};${booking.locationLongitude}`,
          sendType: "automatic",
          success: sendResult.success,
          errorMessage: sendResult.error || null,
        });

        // Track successful bookings for batch update
        if (sendResult.success) {
          successfulBookingRefs.push(sendResult.bookingRef);
          results.success++;
        } else {
          results.failed++;
        }

        results.details.push(sendResult);
      } else {
        // Promise rejected (shouldn't happen with our error handling, but handle it)
        console.error("Promise rejected:", result.reason);
        results.failed++;
        results.details.push({
          bookingRef: "unknown",
          status: "failed",
          success: false,
          error: result.reason?.message || "Promise rejected",
        });
      }
    }

    // Batch insert all log entries in a single query
    if (logEntries.length > 0) {
      await db.insert(locationLogs).values(logEntries);
    }

    // Batch update all successful bookings in a single query
    if (successfulBookingRefs.length > 0) {
      await db
        .update(bookingsStatus)
        .set({
          locationSent: true,
          updatedAt: new Date(),
        })
        .where(inArray(bookingsStatus.bookingRef, successfulBookingRefs));
    }

    if (cronLogId) {
      await db
        .update(cronLogs)
        .set({
          status: results.failed > 0 ? "completed_with_errors" : "completed",
          successCount: results.success,
          failedCount: results.failed,
          skippedCount: results.skipped,
          finishedAt: new Date(),
        })
        .where(eq(cronLogs.id, cronLogId));
    }

    console.info("auto-send-location completed", {
      success: results.success,
      failed: results.failed,
      skipped: results.skipped,
    });

    return NextResponse.json({
      success: true,
      message: `Auto-send completed: ${results.success} successful, ${results.failed} failed, ${results.skipped} skipped`,
      results,
    });
  } catch (error) {
    console.error("Error in auto-send location:", error);
    try {
      if (cronLogId) {
        await db
          .update(cronLogs)
          .set({
            status: "failed",
            errorMessage: error instanceof Error ? error.message : "Unknown error",
            finishedAt: new Date(),
          })
          .where(eq(cronLogs.id, cronLogId));
      } else {
        await db.insert(cronLogs).values({
          jobName: "auto-send-location",
          status: "failed",
          errorMessage: error instanceof Error ? error.message : "Unknown error",
          startedAt: new Date(),
          finishedAt: new Date(),
        });
      }
    } catch {
      // ignore logging failures
    }
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
