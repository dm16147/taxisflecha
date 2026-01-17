import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import { db } from "@/lib/db";
import { bookingsStatus } from "@/shared/schema";
import { eq } from "drizzle-orm";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ ref: string }> }
) {
    try {
        const { ref } = await params;
        const { driverId } = await request.json();

        if (!driverId) {
            return NextResponse.json(
                { message: "Driver ID is required" },
                { status: 400 }
            );
        }

        // Update the database with the driver assignment
        const existingStatus = await db.query.bookingsStatus.findFirst({
            where: eq(bookingsStatus.bookingRef, ref),
        });

        if (existingStatus) {
            // Update existing record
            await db.update(bookingsStatus)
                .set({ 
                    driverId: driverId,
                    updatedAt: new Date(),
                })
                .where(eq(bookingsStatus.bookingRef, ref));
        } else {
            // Create new record if it doesn't exist
            await db.insert(bookingsStatus).values({
                bookingRef: ref,
                type: "unknown",
                status: "pending",
                driverId: driverId,
                autoSendLocation: false,
                locationSent: false,
            });
        }

        return NextResponse.json({
            success: true,
            message: "Driver assigned successfully",
            driverId: driverId,
        });
    } catch (error) {
        console.error("Error assigning driver:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}