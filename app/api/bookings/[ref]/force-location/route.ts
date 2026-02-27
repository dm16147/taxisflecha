import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { auth } from "@/lib/auth";

// Mask email for privacy: "john.doe@example.com" -> "jo***@example.com"
function maskEmail(email: string | null | undefined): string {
  if (!email) return "unknown";
  const [local, domain] = email.split("@");
  if (!domain) return "invalid-email";
  const maskedLocal = local.length > 2 ? local.slice(0, 2) + "***" : local + "***";
  return `${maskedLocal}@${domain}`;
}

// Helper to log to debug_logs table
async function logDebug(
  client: any,
  action: string,
  bookingRef: string | null,
  requestId: string,
  userIdentifier: string | null,
  previousValue: string | null,
  newValue: string | null,
  success: boolean,
  errorMessage: string | null = null,
  metadata: Record<string, any> | null = null
) {
  try {
    await client.query(
      `INSERT INTO debug_logs (action, booking_ref, request_id, user_identifier, previous_value, new_value, success, error_message, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [action, bookingRef, requestId, userIdentifier, previousValue, newValue, success, errorMessage, metadata ? JSON.stringify(metadata) : null]
    );
  } catch (err) {
    // Don't let logging errors break the main flow
    console.error("Failed to write debug log:", err);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ ref: string }> }
) {
  const requestId = crypto.randomUUID();
  let client;
  let bookingRef: string | null = null;
  let userIdentifier: string = "unknown";
  
  try {
    // Get user from session
    const session = await auth();
    userIdentifier = maskEmail(session?.user?.email);
    
    const { ref } = await params;
    bookingRef = ref;

    // Get a dedicated client for transaction
    client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // First, get the current value
      const currentResult = await client.query(
        'SELECT auto_send_location FROM bookings_status WHERE booking_ref = $1 FOR UPDATE',
        [ref]
      );
      
      if (currentResult.rows.length === 0) {
        await logDebug(
          client,
          "toggle_auto_send_location",
          ref,
          requestId,
          userIdentifier,
          null,
          null,
          false,
          "Booking not found in bookings_status table",
          null
        );
        await client.query('ROLLBACK');
        return NextResponse.json(
          { message: "Booking not found", requestId },
          { status: 404, headers: { "x-request-id": requestId } }
        );
      }
      
      const currentValue = currentResult.rows[0].auto_send_location;
      const newValue = !currentValue;
      
      // Update with explicit new value
      await client.query(
        'UPDATE bookings_status SET auto_send_location = $1, updated_at = NOW() WHERE booking_ref = $2',
        [newValue, ref]
      );
      
      // Verify the update
      const verifyResult = await client.query(
        'SELECT auto_send_location FROM bookings_status WHERE booking_ref = $1',
        [ref]
      );
      
      if (verifyResult.rows[0].auto_send_location !== newValue) {
        await logDebug(
          client,
          "toggle_auto_send_location",
          ref,
          requestId,
          userIdentifier,
          String(currentValue),
          String(newValue),
          false,
          "Verification failed - value mismatch after update",
          { expected: newValue, actual: verifyResult.rows[0].auto_send_location }
        );
        await client.query('ROLLBACK');
        return NextResponse.json(
          { message: "Failed to update auto-send location", requestId },
          { status: 500, headers: { "x-request-id": requestId } }
        );
      }
      
      // Log success before commit
      await logDebug(
        client,
        "toggle_auto_send_location",
        ref,
        requestId,
        userIdentifier,
        String(currentValue),
        String(newValue),
        true,
        null,
        null
      );
      
      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        autoSendLocation: newValue,
        message: `Auto-send location ${newValue ? 'enabled' : 'disabled'}`,
        requestId,
      }, { headers: { "x-request-id": requestId } });
      
    } catch (txError) {
      await client.query('ROLLBACK');
      throw txError;
    } finally {
      client.release();
    }
    
  } catch (error) {
    // Log error to database (get fresh connection since client may be unavailable)
    try {
      const logClient = await pool.connect();
      try {
        await logDebug(
          logClient,
          "toggle_auto_send_location",
          bookingRef,
          requestId,
          userIdentifier,
          null,
          null,
          false,
          error instanceof Error ? error.message : "Unknown error",
          { errorType: error instanceof Error ? error.name : typeof error }
        );
      } finally {
        logClient.release();
      }
    } catch {
      // Ignore logging errors
    }
    
    return NextResponse.json(
      { message: "Internal server error", requestId },
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }
}
