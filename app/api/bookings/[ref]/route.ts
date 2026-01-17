
import { headers } from "@/lib/utils";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bookingsStatus, drivers } from "@/shared/schema";
import { eq } from "drizzle-orm";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ ref: string }> }
) {
    try {
        const { ref } = await params;

        const url = `${process.env.VITE_BASE_API_URL}/bookings/${ref}`

        const response = await fetch(url, {
            headers: headers()
        })

        if (!response.ok) {
            console.error("Error fetching booking detail from external API", response.statusText)
            return NextResponse.json(
                { message: "Error fetching booking detail from external API" },
                { status: 404 }
            );
        }

        const data = await response.json();

        // Fetch booking status from database with driver information
        const bookingStatusRecord = await db
            .select({
                driverId: bookingsStatus.driverId,
                driverName: drivers.name,
                autoSendLocation: bookingsStatus.autoSendLocation,
                locationSent: bookingsStatus.locationSent,
            })
            .from(bookingsStatus)
            .leftJoin(drivers, eq(bookingsStatus.driverId, drivers.id))
            .where(eq(bookingsStatus.bookingRef, ref))
            .limit(1);

        // Add booking status to response
        const responseWithStatus = {
            ...data,
            bookingStatus: bookingStatusRecord.length > 0 ? {
                driver: bookingStatusRecord[0].driverId ? {
                    id: bookingStatusRecord[0].driverId,
                    name: bookingStatusRecord[0].driverName,
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