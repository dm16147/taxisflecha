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
        const { driverName } = await request.json();

        if (!driverName) {
            return NextResponse.json(
                { message: "Driver name is required" },
                { status: 400 }
            );
        }

        await storage.assignDriver({ bookingRef: ref, driverName });

        // Update the database with the driver assignment
        const existingStatus = await db.query.bookingsStatus.findFirst({
            where: eq(bookingsStatus.bookingRef, ref),
        });

        if (existingStatus) {
            // Update existing record
            await db.update(bookingsStatus)
                .set({ 
                    driver: driverName,
                    updatedAt: new Date(),
                })
                .where(eq(bookingsStatus.bookingRef, ref));
        } else {
            // Create new record if it doesn't exist
            await db.insert(bookingsStatus).values({
                bookingRef: ref,
                type: "unknown",
                status: "pending",
                driver: driverName,
                autoSendLocation: false,
                locationSent: false,
            });
        }

        return NextResponse.json({
            success: true,
            message: "Driver assigned successfully",
            driver: driverName,
        });
    } catch (error) {
        console.error("Error assigning driver:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}