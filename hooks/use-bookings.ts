"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { BookingsListResponse, BookingType } from "@/shared/schema";
import { useToast } from "@/hooks/use-toast";

async function buildRequestError(
  response: Response,
  fallbackMessage: string,
  context: string
) {
  let message = fallbackMessage;
  try {
    const data = await response.json();
    message = data?.message || data?.error || fallbackMessage;
  } catch {
    // ignore parse errors
  }
  const requestId = response.headers.get("x-request-id");
  const finalMessage = requestId ? `${message} (req: ${requestId})` : message;
  console.error(context, {
    status: response.status,
    requestId: requestId || undefined,
    message: finalMessage,
  });
  return new Error(finalMessage);
}

export const PAGE_SIZE = 20;

export function useBookings(type: BookingType, dateFrom?: string, dateTo?: string, page: number = 1) {
  const { toast } = useToast();
  
  return useQuery<BookingsListResponse & { hasMore: boolean }>({
    queryKey: ["bookings", type, dateFrom, dateTo, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      if (page > 1) params.set("page", page.toString());

      const query = params.toString();
      const response = await fetch(`/api/bookings/${type}${query ? `?${query}` : ""}`);

      if (response.status === 401) {
        toast({
          title: "Não autenticado",
          description: "Por favor, faça login para visualizar as reservas.",
          variant: "destructive",
        });
        throw await buildRequestError(response, "Não autenticado", "useBookings");
      }

      if (response.status === 403) {
        toast({
          title: "Acesso negado",
          description: "Você não tem permissão para acessar este recurso.",
          variant: "destructive",
        });
        throw await buildRequestError(response, "Acesso negado", "useBookings");
      }

      if (!response.ok) {
        throw await buildRequestError(response, "Falha ao obter reservas", "useBookings");
      }

      const data: BookingsListResponse = await response.json();
      const bookingsCount = Object.keys(data.bookings || {}).length;
      
      return {
        ...data,
        hasMore: bookingsCount >= PAGE_SIZE,
      };
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
        throw await buildRequestError(response, "Não autenticado", "useBookingDetail");
      }

      if (response.status === 403) {
        toast({
          title: "Acesso negado",
          description: "Você não tem permissão para acessar este recurso.",
          variant: "destructive",
        });
        throw await buildRequestError(response, "Acesso negado", "useBookingDetail");
      }

      if (!response.ok) {
        throw await buildRequestError(response, "Falha ao obter detalhes da reserva", "useBookingDetail");
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
        throw await buildRequestError(response, "Não autenticado", "useAssignDriver");
      }

      if (response.status === 403) {
        toast({
          title: "Acesso negado",
          description: "Você não tem permissão para atribuir motoristas.",
          variant: "destructive",
        });
        throw await buildRequestError(response, "Acesso negado", "useAssignDriver");
      }

      if (!response.ok) {
        throw await buildRequestError(response, "Falha ao atribuir o motorista", "useAssignDriver");
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
        throw await buildRequestError(response, "Falha ao enviar local", "useSendLocation");
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
        throw await buildRequestError(response, "Falha ao selecionar local", "useSelectLocation");
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
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ bookingRef }: { bookingRef: string }) => {
      const response = await fetch(`/api/bookings/${bookingRef}/force-location`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw await buildRequestError(response, "Falha ao alternar o envio automático da local", "useForceLocation");
      }

      const data = await response.json();
      
      // Verify we got a valid response
      if (typeof data.autoSendLocation !== 'boolean') {
        console.error("Invalid response from force-location endpoint", data);
        throw new Error("Resposta inválida do servidor");
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["booking", variables.bookingRef] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (error: Error) => {
      console.error("useForceLocation mutation failed:", error);
      toast({
        title: "Erro ao alternar modo automático",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}