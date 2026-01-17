"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { BookingsListResponse, BookingType } from "@/shared/schema";

export function useBookings(type: BookingType, dateFrom?: string, dateTo?: string) {
  return useQuery<BookingsListResponse>({
    queryKey: ["bookings", type, dateFrom, dateTo],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      const query = params.toString();
      const response = await fetch(`/api/bookings/${type}${query ? `?${query}` : ""}`);

      if (!response.ok) {
        throw new Error("Falha ao obter reservas");
      }

      return response.json();
    },
  });
}

export function useBookingDetail(ref: string | null) {
  return useQuery({
    queryKey: ["booking", ref],
    queryFn: async () => {
      if (!ref) return null;

      const response = await fetch(`/api/bookings/${ref}`);

      if (!response.ok) {
        throw new Error("Falha ao obter detalhes da reserva");
      }

      return response.json();
    },
    enabled: !!ref,
  });
}

export function useAssignDriver() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookingRef, driverId }: { bookingRef: string; driverId: number }) => {
      const response = await fetch(`/api/bookings/${bookingRef}/assign-driver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId }),
      });

      if (!response.ok) {
        throw new Error('Falha ao atribuir o motorista');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["booking", variables.bookingRef] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

export function useSendLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookingRef }: { bookingRef: string }) => {
      const response = await fetch(`/api/bookings/${bookingRef}/send-location`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao enviar localização');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booking"] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

export function useForceLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookingRef }: { bookingRef: string }) => {
      const response = await fetch(`/api/bookings/${bookingRef}/force-location`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Falha ao alternar o envio automático da localização');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["booking", variables.bookingRef] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}