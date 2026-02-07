import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bookingsStatus, locationLogs, locations } from "@/shared/schema";
import { eq } from "drizzle-orm";

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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ ref: string }> }
) {
  try {
    const requestId = request.headers.get("x-vercel-id") || crypto.randomUUID();
    const { ref } = await params;
    const body = await request.json();
    const { locationId } = body;

    // Check if booking exists
    const booking = await db.query.bookingsStatus.findFirst({
      where: eq(bookingsStatus.bookingRef, ref),
    });

    if (!booking) {
      return NextResponse.json(
        { message: "Booking not found in database", requestId },
        { status: 404, headers: { "x-request-id": requestId } }
      );
    }

    if (booking.locationSent) {
      return NextResponse.json(
        { message: "Location already sent for this booking", requestId },
        { status: 400, headers: { "x-request-id": requestId } }
      );
    }

    // Determine which location to use
    let selectedLocation;
    if (locationId) {
      // Use provided location ID
      selectedLocation = await db.query.locations.findFirst({
        where: eq(locations.id, locationId),
      });
    } else if (booking.selectedLocationId) {
      // Use booking's selected location
      selectedLocation = await db.query.locations.findFirst({
        where: eq(locations.id, booking.selectedLocationId),
      });
    }

    if (!selectedLocation) {
      return NextResponse.json(
        { message: "No location selected for this booking", requestId },
        { status: 400, headers: { "x-request-id": requestId } }
      );
    }

    // Call external API
    const { success, errorMessage } = await sendLocationToExternalAPI(
      ref,
      selectedLocation.latitude,
      selectedLocation.longitude
    );

    // Log the attempt
    await db.insert(locationLogs).values({
      bookingRef: ref,
      location: `${selectedLocation.latitude};${selectedLocation.longitude}`,
      sendType: "manual",
      success,
      errorMessage: errorMessage || null,
    });

    if (!success) {
      return NextResponse.json(
        { message: errorMessage || "Failed to send location to external API", requestId },
        { status: 500, headers: { "x-request-id": requestId } }
      );
    }

    // Update booking status on success
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
      location: selectedLocation.name,
      coordinates: {
        lat: selectedLocation.latitude,
        lng: selectedLocation.longitude,
      },
      requestId,
    }, { headers: { "x-request-id": requestId } });
  } catch (error) {
    const requestId = crypto.randomUUID();
    console.error("Error sending location:", { requestId, error });
    return NextResponse.json(
      { message: "Internal server error", requestId },
      { status: 500, headers: { "x-request-id": requestId } }
    );
  }
}
