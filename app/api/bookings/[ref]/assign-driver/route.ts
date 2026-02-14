import { db } from "@/lib/db";
import { headers as externalApiHeaders } from "@/lib/utils";
import { bookingsStatus, contactTypes, drivers } from "@/shared/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

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

        // Fetch driver details
        const driver = await db.query.drivers.findFirst({
            where: eq(drivers.id, driverId),
        });

        if (!driver) {
            return NextResponse.json(
                { message: "Driver not found" },
                { status: 404 }
            );
        }

        // Fetch contact type descriptions
        const contactTypeRows = await db
            .select({
                id: contactTypes.id,
                description: contactTypes.description,
            })
            .from(contactTypes)
            .where(eq(contactTypes.id, driver.preferredContactTypeId))
            .limit(1);

        const preferredContactMethod = contactTypeRows[0]?.description ?? "WHATSAPP";
        const contactMethods = Array.from(new Set([preferredContactMethod, contactTypeRows[0]?.description].filter(Boolean))) as string[];

        // Update the database with the driver assignment
        const existingStatus = await db.query.bookingsStatus.findFirst({
            where: eq(bookingsStatus.bookingRef, ref),
        });

        if (!existingStatus) {
            console.error("Internal server error: booking not found while assigning driver");
            return NextResponse.json({ message: "Estado de aplicação inválido: Não foi encontrada a reserva" }, { status: 500 });
        }

        // Call external API to assign driver
        const url = `${process.env.VITE_BASE_API_URL}/bookings/${ref}/vehicles/${existingStatus.vehicleIdentifier}`;
        const response = await fetch(url, {
            method: "PUT",
            headers: {
                ...externalApiHeaders(),
            },
            body: JSON.stringify({
                driver: {
                    name: driver.name,
                    phoneNumber: driver.mobilePhone,
                    preferredContactMethod,
                    contactMethods,
                },
            }),
        }); 

        if (!response.ok) {
            const errorText = await response.text();
            console.error("External API driver assign failed:", errorText);
            return NextResponse.json(
                { message: "Failed to assign driver in external API" },
                { status: 502 }
            );
        }

        await db.update(bookingsStatus)
            .set({
                driverId: driverId,
                updatedAt: new Date(),
            })
            .where(eq(bookingsStatus.bookingRef, ref));

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