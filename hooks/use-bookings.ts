"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { BookingsListResponse, BookingType } from "@/shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useBookings(type: BookingType, dateFrom?: string, dateTo?: string) {
  const { toast } = useToast();
  
  return useQuery<BookingsListResponse>({
    queryKey: ["bookings", type, dateFrom, dateTo],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      const query = params.toString();
      const response = await fetch(`/api/bookings/${type}${query ? `?${query}` : ""}`);

      if (response.status === 401) {
        toast({
          title: "Não autenticado",
          description: "Por favor, faça login para visualizar as reservas.",
          variant: "destructive",
        });
        throw new Error("Não autenticado");
      }

      if (response.status === 403) {
        toast({
          title: "Acesso negado",
          description: "Você não tem permissão para acessar este recurso.",
          variant: "destructive",
        });
        throw new Error("Acesso negado");
      }

      if (!response.ok) {
        throw new Error("Falha ao obter reservas");
      }

      return response.json();
    },
  });
}

export function useBookingDetail(ref: string | null) {
  const { toast } = useToast();
  
  return useQuery({
    queryKey: ["booking", ref],
    queryFn: async () => {
      if (!ref) return null;

      const response = await fetch(`/api/bookings/${ref}`);

      if (response.status === 401) {
        toast({
          title: "Não autenticado",
          description: "Por favor, faça login para visualizar os detalhes.",
          variant: "destructive",
        });
        throw new Error("Não autenticado");
      }

      if (response.status === 403) {
        toast({
          title: "Acesso negado",
          description: "Você não tem permissão para acessar este recurso.",
          variant: "destructive",
        });
        throw new Error("Acesso negado");
      }

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
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ bookingRef, driverId }: { bookingRef: string; driverId: number }) => {
      const response = await fetch(`/api/bookings/${bookingRef}/assign-driver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId }),
      });

      if (response.status === 401) {
        toast({
          title: "Não autenticado",
          description: "Por favor, faça login para atribuir motoristas.",
          variant: "destructive",
        });
        throw new Error("Não autenticado");
      }

      if (response.status === 403) {
        toast({
          title: "Acesso negado",
          description: "Você não tem permissão para atribuir motoristas.",
          variant: "destructive",
        });
        throw new Error("Acesso negado");
      }

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
    mutationFn: async ({ bookingRef, locationId }: { bookingRef: string; locationId?: number }) => {
      const response = await fetch(`/api/bookings/${bookingRef}/send-location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao enviar local');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booking"] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

export function useSelectLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookingRef, locationId }: { bookingRef: string; locationId: number }) => {
      const response = await fetch(`/api/bookings/${bookingRef}/select-location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao selecionar local');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["booking", variables.bookingRef] });
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
        throw new Error('Falha ao alternar o envio automático da local');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["booking", variables.bookingRef] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}