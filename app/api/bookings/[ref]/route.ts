
import { headers } from "@/lib/utils";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bookingsStatus } from "@/shared/schema";
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

        console.log("Retrieved data: ", data)

        // Fetch booking status from database
        const bookingStatusRecord = await db.query.bookingsStatus.findFirst({
            where: eq(bookingsStatus.bookingRef, ref),
        });

        // Add booking status to response
        const responseWithStatus = {
            ...data,
            bookingStatus: bookingStatusRecord ? {
                driver: bookingStatusRecord.driver,
                autoSendLocation: bookingStatusRecord.autoSendLocation,
                locationSent: bookingStatusRecord.locationSent,
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