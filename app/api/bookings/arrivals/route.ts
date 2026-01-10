import { NextRequest, NextResponse } from "next/server";
import { retrieveBookings } from "../bookings";


export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const dateFrom = searchParams.get('dateFrom');
        const dateTo = searchParams.get('dateTo');
        const pageNumber = searchParams.get('page');

        return retrieveBookings("arrivals", dateFrom, dateTo, pageNumber);
    } catch (error) {
        console.error("Error fetching arrivals:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}