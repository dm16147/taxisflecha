
import { headers } from "@/lib/utils";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bookingsStatus, drivers, locations } from "@/shared/schema";
import { eq } from "drizzle-orm";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ ref: string }> }
) {
    try {
        const { ref } = await params;

        const url = `${process.env.VITE_BASE_API_URL}/bookings/${ref}`

        const response = await fetch(url, {
            headers: headers(),
            cache: "no-store"
        })

        if (!response.ok) {
            console.error("Error fetching booking detail from external API", response.statusText)
            return NextResponse.json(
                { message: "Error fetching booking detail from external API" },
                { status: 404 }
            );
        }

        const data = await response.json();

        // Extract pickup date from booking data
        let pickupDate: Date | null = null;
        if (data.booking?.arrival) {
            const dateStr = data.booking.arrival.pickupdate || data.booking.arrival.arrivaldate;
            pickupDate = dateStr ? new Date(dateStr) : null;
        } else if (data.booking?.departure) {
            const dateStr = data.booking.departure.pickupdate || data.booking.departure.departuredate;
            pickupDate = dateStr ? new Date(dateStr) : null;
        }

        // Fetch booking status from database with driver information
        const bookingStatusRecord = await db
            .select({
                driverId: bookingsStatus.driverId,
                driverName: drivers.name,
                vehicleIdentifier: bookingsStatus.vehicleIdentifier,
                selectedLocationId: bookingsStatus.selectedLocationId,
                locationName: locations.name,
                locationLatitude: locations.latitude,
                locationLongitude: locations.longitude,
                autoSendLocation: bookingsStatus.autoSendLocation,
                locationSent: bookingsStatus.locationSent,
                pickupDate: bookingsStatus.pickupDate,
            })
            .from(bookingsStatus)
            .leftJoin(drivers, eq(bookingsStatus.driverId, drivers.id))
            .leftJoin(locations, eq(bookingsStatus.selectedLocationId, locations.id))
            .where(eq(bookingsStatus.bookingRef, ref))
            .limit(1);

        // Update pickupDate if missing and we have the data
        if (bookingStatusRecord.length > 0 && !bookingStatusRecord[0].pickupDate && pickupDate) {
            await db
                .update(bookingsStatus)
                .set({ pickupDate, updatedAt: new Date() })
                .where(eq(bookingsStatus.bookingRef, ref));
        }

        // Add booking status to response
        const responseWithStatus = {
            ...data,
            bookingStatus: bookingStatusRecord.length > 0 ? {
                driver: bookingStatusRecord[0].driverId ? {
                    id: bookingStatusRecord[0].driverId,
                    name: bookingStatusRecord[0].driverName,
                } : undefined,
                vehicleIdentifier: bookingStatusRecord[0].vehicleIdentifier ?? undefined,
                selectedLocation: bookingStatusRecord[0].selectedLocationId ? {
                    id: bookingStatusRecord[0].selectedLocationId,
                    name: bookingStatusRecord[0].locationName!,
                    latitude: bookingStatusRecord[0].locationLatitude!,
                    longitude: bookingStatusRecord[0].locationLongitude!,
                } : undefined,
                autoSendLocation: bookingStatusRecord[0].autoSendLocation,
                locationSent: bookingStatusRecord[0].locationSent,
            } : null,
        };

        return NextResponse.json(responseWithStatus);
    } catch (error) {
        console.error("Error fetching booking:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}