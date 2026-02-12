import { db } from "@/lib/db";
import { BookingType, bookingsStatus, drivers } from "@/shared/schema";
import { NextResponse } from "next/server";
import { inArray, eq } from "drizzle-orm";
import { headers } from "@/lib/utils";
import { randomBytes } from "crypto";

function formatDateForApi(date: string): string {
    if (date.includes('T')) {
        date = date.split('T')[0];
    }
    return `${date}T00:00:00`;
}

function generateVehicleIdentifier(length: number = 32): string {
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-";
    const bytes = randomBytes(length);
    let result = "";
    for (let i = 0; i < length; i++) {
        result += charset[bytes[i] % charset.length];
    }
    return result;
}

async function updatePickupDatesAsync(
    type: BookingType,
    bookings: Record<string, any>
) {
    try {
        const isArrival = type === "arrivals";
        const getPrimaryDate = (booking: any) =>
            isArrival ? booking.arrivaldate : booking.departuredate;

        const bookingRefs = Object.values(bookings)
            .map((booking: any) => booking?.ref)
            .filter(Boolean);
        if (bookingRefs.length === 0) return;

        // Fetch existing records from DB
        const existingRecords = await db
            .select({
                bookingRef: bookingsStatus.bookingRef,
                pickupDate: bookingsStatus.pickupDate,
                lastActionDate: bookingsStatus.lastActionDate,
                status: bookingsStatus.status,
            })
            .from(bookingsStatus)
            .where(inArray(bookingsStatus.bookingRef, bookingRefs));


        const existingMap = new Map(
            existingRecords.map(r => [r.bookingRef, {
                pickupDate: r.pickupDate,
                lastActionDate: r.lastActionDate,
                status: r.status,
            }])
        );

        const directUpdates: Array<{ ref: string; newDate: Date; lastActionDate: Date | null; status: string }> = [];
        const statusUpdates: Array<{ ref: string; status: string; lastActionDate: Date | null }> = [];
        const detailFetchesNeeded: Array<{ ref: string; lastActionDate: Date | null; status: string }> = [];

        for (const booking of Object.values(bookings)) {
            const ref = booking?.ref;
            if (!ref) continue;
            const existing = existingMap.get(ref);
            const newLastActionDate = booking.lastactiondate ? new Date(booking.lastactiondate) : null;
            const newStatus = booking.status;

            const hasChange = !existing?.lastActionDate || !newLastActionDate
                ? true
                : existing.lastActionDate.getTime() !== newLastActionDate.getTime() || existing.status !== newStatus;

            // Skip if no change detected via lastActionDate
            if (!hasChange) {
                continue;
            }

            // If cancelled, update status only and skip pickup date
            if (newStatus === "PCAN" || newStatus === "ACAN") {
                statusUpdates.push({ ref, status: newStatus, lastActionDate: newLastActionDate });
                continue;
            }

            const primaryDateStr = getPrimaryDate(booking);
            if (!primaryDateStr) continue;

            const primaryDate = new Date(primaryDateStr);

            if (isArrival) {
                // Update if dates differ or booking changed
                if (!existing?.pickupDate ||
                    existing.pickupDate.getTime() !== primaryDate.getTime()) {
                    directUpdates.push({ ref, newDate: primaryDate, lastActionDate: newLastActionDate, status: newStatus });
                } else {
                    statusUpdates.push({ ref, status: newStatus, lastActionDate: newLastActionDate });
                }
            } else {
                // Fetch detail if dates differ or booking changed
                if (!existing?.pickupDate ||
                    existing.pickupDate.getTime() !== primaryDate.getTime()) {
                    detailFetchesNeeded.push({ ref, lastActionDate: newLastActionDate, status: newStatus });
                } else {
                    statusUpdates.push({ ref, status: newStatus, lastActionDate: newLastActionDate });
                }
            }
        }

        // Batch update statuses for cancelled bookings
        if (statusUpdates.length > 0) {
            const updatePromises = statusUpdates.map(({ ref, status, lastActionDate }) =>
                db
                    .update(bookingsStatus)
                    .set({ status, lastActionDate, updatedAt: new Date() })
                    .where(eq(bookingsStatus.bookingRef, ref))
            );
            await Promise.all(updatePromises);
        }

        // Batch update arrivals (no API call needed)
        if (directUpdates.length > 0) {
            const updatePromises = directUpdates.map(({ ref, newDate, lastActionDate, status }) =>
                db
                    .update(bookingsStatus)
                    .set({ pickupDate: newDate, lastActionDate, status, updatedAt: new Date() })
                    .where(eq(bookingsStatus.bookingRef, ref))
            );
            await Promise.all(updatePromises);
        }

        // Fetch details for departures and update (parallel)
        if (detailFetchesNeeded.length > 0) {
            const detailPromises = detailFetchesNeeded.map(async ({ ref, lastActionDate, status }) => {
                try {
                    const url = `${process.env.VITE_BASE_API_URL}/bookings/${ref}`;
                    const response = await fetch(url, {
                        headers: headers(),
                        cache: "no-store"
                    });

                    if (!response.ok) {
                        console.error(`Failed to fetch detail for ${ref}, response: ${JSON.stringify(response)}`);
                        return null;
                    }

                    const data = await response.json();
                    const pickupDateStr = data.booking?.departure?.pickupdate ||
                        data.booking?.departure?.departuredate;

                    if (!pickupDateStr) return null;

                    const pickupDate = new Date(pickupDateStr);
                    await db
                        .update(bookingsStatus)
                        .set({
                            pickupDate,
                            lastActionDate,
                            status,
                            updatedAt: new Date(),
                        })
                        .where(eq(bookingsStatus.bookingRef, ref));

                    return { ref, success: true };
                } catch (error) {
                    console.error(`Error updating pickupDate for ${ref}:`, error);
                    return null;
                }
            });

            await Promise.allSettled(detailPromises);
        }
    } catch (error) {
        console.error("Error in async pickup date update:", error);
    }
}

export async function retrieveBookings(type: BookingType, dateFrom: string | null, dateTo: string | null, pageNumber: string | null) {
    try {
        const formattedDateFrom = formatDateForApi(dateFrom!)
        const formattedDateTo = formatDateForApi(dateTo!)
        const pageNum = pageNumber ?? 1;

        const url = `${process.env.VITE_BASE_API_URL}/bookings/search/${type}/since/${formattedDateFrom}/until/${formattedDateTo}/page/${pageNum}`;
        const externalApiUrl = new URL(url);

        const response = await fetch(externalApiUrl, {
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "API_KEY": process.env.VITE_BASE_API_KEY!
            },
            cache: "no-store"
        })

        if (response.status === 204) {
            return NextResponse.json({ bookings: {}, warnings: [] });
        }

        if (!response.ok) {
            console.error("External API error:", response.statusText)
            return NextResponse.json({ message: "Falha ao obter dados da API externa" }, { status: response.status });
        }

        const bodyText = await response.text();
        if (!bodyText) {
            console.error("No body:", response.statusText)
            return NextResponse.json({ bookings: {}, warnings: [] });
        }

        const data = JSON.parse(bodyText);

        // Upsert with lastActionDate for change detection
        const values = Object.values(data.bookings ?? {}).map((b: any) => ({
            bookingRef: b.ref,
            type,
            status: b.status,
            lastActionDate: b.lastactiondate ? new Date(b.lastactiondate) : null,
            vehicleIdentifier: generateVehicleIdentifier(),
            autoSendLocation: false,
            driverId: null,
            locationSent: false,
            updatedAt: new Date(),
        }));

        if (values.length > 0) {
            await db
                .insert(bookingsStatus)
                .values(values)
                .onConflictDoNothing({ target: bookingsStatus.bookingRef });
        }

        // Synchronously update pickup dates before returning
        const bookingRefs = values.map((v) => v.bookingRef);
        await updatePickupDatesAsync(type, data.bookings ?? {});

        // Batch fetch driver assignments and pickup dates for all booking refs
        let driverAssignments: Record<string, { id: number; name: string; pickupDate: Date | null }> = {};

        if (bookingRefs.length > 0) {
            const assignments = await db
                .select({
                    bookingRef: bookingsStatus.bookingRef,
                    driverId: bookingsStatus.driverId,
                    driverName: drivers.name,
                    pickupDate: bookingsStatus.pickupDate,
                })
                .from(bookingsStatus)
                .leftJoin(drivers, eq(bookingsStatus.driverId, drivers.id))
                .where(inArray(bookingsStatus.bookingRef, bookingRefs));

            // Create a lookup map for quick access
            driverAssignments = assignments.reduce((acc, item) => {
                acc[item.bookingRef] = {
                    id: item.driverId ?? 0,
                    name: item.driverName ?? "",
                    pickupDate: item.pickupDate ?? null,
                };
                return acc;
            }, {} as Record<string, { id: number; name: string; pickupDate: Date | null }>);
        }

        // Merge driver info and pickup date into booking data
        const enrichedBookings = Object.entries(data.bookings ?? {}).reduce((acc, [key, booking]: [string, any]) => {
            const assignment = driverAssignments[booking.ref];
            acc[key] = {
                ...booking,
                driver: assignment?.id ? { id: assignment.id, name: assignment.name } : undefined,
                pickupDate: assignment?.pickupDate ?? null,
            };
            return acc;
        }, {} as Record<string, any>);

        return NextResponse.json({ ...data, bookings: enrichedBookings });
    } catch (error) {
        console.error(`Error fetching ${type} bookings: ${error}`);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}