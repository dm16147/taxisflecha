import { requireRole } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { bookingsStatus } from "@/shared/schema";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST() {
    try {
        await requireRole("MANAGER");
    } catch (response) {
        return response as NextResponse;
    }

    try {
        await db
            .update(bookingsStatus)
            .set({
                lastActionDate: null,
                pickupDate: null,
                updatedAt: new Date(),
            });

        return NextResponse.json({ message: "Cache limpo com sucesso. Os dados serão recarregados na próxima consulta." });
    } catch (error) {
        console.error("Error clearing bookings cache:", error);
        return NextResponse.json({ message: "Erro ao limpar cache" }, { status: 500 });
    }
}
