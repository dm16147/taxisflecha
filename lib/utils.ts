import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function headers(): Record<string, string> {
  return {
    "Accept": "application/json",
    "Content-Type": "application/json",
    "API_KEY": process.env.BASE_API_KEY!,
    "VERSION": "2025-01"
  }
}

/**
 * Parse a date string from the external API as Europe/Lisbon local time.
 *
 * The external API returns naive datetime strings (no timezone offset)
 * that represent Portugal local time. `new Date()` would interpret these
 * relative to the server's timezone, which differs between local dev
 * (Portugal) and production (UTC). This helper removes that ambiguity.
 */
export function parseAsLisbon(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;

  // If the string already carries timezone info, parse directly
  if (dateStr.endsWith('Z') || /[+-]\d{2}(:\d{2})?$/.test(dateStr)) {
    return new Date(dateStr);
  }

  // Extract date/time components to avoid locale-dependent parsing
  const match = dateStr.match(
    /(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/
  );
  if (!match) return new Date(dateStr); // fallback

  const [, year, month, day, hour = '0', minute = '0', second = '0'] = match;

  // Treat the components as UTC so we have a stable reference point
  const asUtcMs = Date.UTC(+year, +month - 1, +day, +hour, +minute, +second);
  const asUtcDate = new Date(asUtcMs);

  // Determine the Lisbon UTC offset at this approximate instant.
  // sv-SE locale produces a stable "YYYY-MM-DD HH:MM:SS" format.
  const lisbonWallStr = asUtcDate.toLocaleString('sv-SE', { timeZone: 'Europe/Lisbon' });
  const lisbonWallDate = new Date(lisbonWallStr.replace(' ', 'T') + 'Z');
  const offsetMs = lisbonWallDate.getTime() - asUtcDate.getTime();

  // The input represents wall-clock time in Lisbon:
  //   wallClock = UTC + offset  →  UTC = wallClock − offset
  return new Date(asUtcMs - offsetMs);
}