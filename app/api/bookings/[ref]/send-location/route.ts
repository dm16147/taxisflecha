import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bookingsStatus, locationLogs, locations } from "@/shared/schema";
import { eq } from "drizzle-orm";
import { sendBookingLocation } from "@/lib/external-api";


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
        { message: "Reserva não encontrada na base de dados", requestId },
        { status: 404, headers: { "x-request-id": requestId } }
      );
    }

    if (booking.locationSent) {
      return NextResponse.json(
        { message: "Já foi enviada a localização para esta reserva", requestId },
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
        { message: "Deve ser selecionada uma localização para a reserva", requestId },
        { status: 400, headers: { "x-request-id": requestId } }
      );
    }

    if (!booking.vehicleIdentifier) {
      return NextResponse.json(
        { message: "Estado de aplicação inválido: Reserva não sem identificador de veículo", requestId },
        { status: 400, headers: { "x-request-id": requestId } }
      );
    }

    // Call external API
    const { success, errorMessage } = await sendBookingLocation(
      ref,
      booking.vehicleIdentifier,
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
        { message: errorMessage || "Falha ao enviar localização para a API externa", requestId },
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
      message: "Localização enviada com sucesso",
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
