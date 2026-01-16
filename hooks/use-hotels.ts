import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Hotel, InsertHotel, UpdateHotel } from "@/shared/schema";

const API_URL = "/api/hotels";

// Fetch todos os hotéis
async function fetchHotels(): Promise<Hotel[]> {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error("Erro ao buscar hotéis");
  }
  return response.json();
}

// Criar novo hotel
async function createHotel(data: InsertHotel): Promise<Hotel> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Erro ao criar hotel");
  }
  return response.json();
}

// Atualizar hotel
async function updateHotel({
  id,
  data,
}: {
  id: number;
  data: UpdateHotel;
}): Promise<Hotel> {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Erro ao atualizar hotel");
  }
  return response.json();
}

// Remover hotel
async function deleteHotel(id: number): Promise<void> {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Erro ao remover hotel");
  }
}

// Hook para buscar hotéis
export function useHotels() {
  return useQuery({
    queryKey: ["hotels"],
    queryFn: fetchHotels,
  });
}

// Hook para criar hotel
export function useCreateHotel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createHotel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hotels"] });
    },
  });
}

// Hook para atualizar hotel
export function useUpdateHotel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateHotel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hotels"] });
    },
  });
}

// Hook para remover hotel
export function useDeleteHotel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteHotel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hotels"] });
    },
  });
}
