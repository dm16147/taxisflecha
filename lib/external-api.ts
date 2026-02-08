import { headers as externalApiHeaders } from "@/lib/utils";

interface ExternalLocationPayload {
  timestamp: string;
  location: {
    lat: number;
    lng: number;
  };
  status: "BEFORE_PICKUP";
}

function formatTimestamp(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, "+00:00");
}

export async function sendBookingLocation(
  bookingRef: string,
  vehicleIdentifier: string,
  latitude: number,
  longitude: number
): Promise<{ success: boolean; errorMessage?: string }> {
  try {
    const payload: ExternalLocationPayload = {
      timestamp: formatTimestamp(new Date()),
      location: {
        lat: latitude,
        lng: longitude,
      },
      status: "BEFORE_PICKUP",
    };

    const url = `${process.env.VITE_BASE_API_URL}/bookings/${bookingRef}/vehicles/${vehicleIdentifier}/location`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...externalApiHeaders(),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`External API error for ${bookingRef}:`, response.status, errorText);
      return {
        success: false,
        errorMessage: `External API returned ${response.status}: ${errorText}`,
      };
    }

    return { success: true };
  } catch (error) {
    console.error(`Exception calling external API for ${bookingRef}:`, error);
    return {
      success: false,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
