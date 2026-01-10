import { db } from "@/lib/db";
import { BookingType, bookingsStatus } from "@/shared/schema";
import { NextResponse } from "next/server";

function formatDateForApi(date: string): string {
    if (date.includes('T')) {
        date = date.split('T')[0];
    }
    return `${date}T00:00:00`;
}

export async function retrieveBookings(type: BookingType, dateFrom: string | null, dateTo: string | null, pageNumber: string | null) {
    try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        const formattedDateFrom = formatDateForApi(dateFrom ?? yesterday.toISOString())
        const formattedDateTo = formatDateForApi(dateTo ?? tomorrow.toISOString())
        const pageNum = pageNumber ?? 1;

        // const url = `${process.env.VITE_BASE_API_URL}/bookings/search/${type}/since/${formattedDateFrom}/until/${formattedDateTo}/page/${pageNum}`;
        const url = `${process.env.VITE_BASE_API_URL}/bookings/search/${type}/since/2026-01-04T09:30:00/until/2026-01-08T09:30:00/page/${pageNum}`;
        const externalApiUrl = new URL(url);

        const init = {
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "API_KEY": process.env.VITE_BASE_API_KEY!
            }
        };

        const response = await fetch(externalApiUrl, init)

        if (response.status === 204) {
            return NextResponse.json({ bookings: {}, warnings: [] });
        }

        if (!response.ok) {
            console.error("External API error:", response.statusText)
            return NextResponse.json({ message: "Falha ao obter dados da API externa" }, { status: response.status });
        }

        const bodyText = await response.text();
        if (!bodyText) {
            return NextResponse.json({ bookings: {}, warnings: [] });
        }

        const data = JSON.parse(bodyText);

        const values = Object.values(data.bookings ?? {}).map((b: any) => ({
            bookingRef: b.ref,
            type,
            status: b.status,
            autoSendLocation: false,
            locationSent: false,
            updatedAt: new Date(),
        }));

        if (values.length > 0) {
            await db
                .insert(bookingsStatus)
                .values(values)
                .onConflictDoNothing({
                    target: bookingsStatus.bookingRef,
                });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error(`Error fetching ${type} bookings: ${error}`);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}