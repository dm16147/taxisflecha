import { z } from 'zod';
import { bookingsListResponseSchema, bookingDetailSchema, assignDriverSchema } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  bookings: {
    search: {
      method: 'GET' as const,
      path: '/bookings/search/departures/since/:dateFrom/until/:dateTo/page/:pageNumber',
      responses: {
        200: bookingsListResponseSchema,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/bookings/:ref',
      responses: {
        200: bookingDetailSchema,
        404: errorSchemas.notFound,
      },
    },
    assignDriver: {
      method: 'POST' as const,
      path: '/bookings/:ref/assign-driver',
      input: assignDriverSchema,
      responses: {
        200: z.object({ success: z.boolean(), message: z.string() }),
      },
    },
    forceLocation: {
      method: 'POST' as const,
      path: '/bookings/:ref/force-location',
      responses: {
        200: z.object({ success: z.boolean(), message: z.string() }),
      },
    }
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
