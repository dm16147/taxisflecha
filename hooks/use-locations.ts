import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Location, InsertLocation, UpdateLocation } from "@/shared/schema";

const API_URL = "/api/locations";

type PaginatedResponse = {
  data: Location[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

// Fetch all locations without pagination (for dropdowns)
async function fetchAllLocations(): Promise<Location[]> {
  const response = await fetch(`${API_URL}?page=1&limit=1000`);
  if (!response.ok) {
    throw new Error("Erro ao buscar locais");
  }
  const data = await response.json();
  return data.data;
}

// Fetch locais com paginação
async function fetchLocations(page: number = 1, limit: number = 10): Promise<PaginatedResponse> {
  const response = await fetch(`${API_URL}?page=${page}&limit=${limit}`);
  if (!response.ok) {
    throw new Error("Erro ao buscar locai");
  }
  return response.json();
}

// Criar novo local
async function createLocation(data: InsertLocation): Promise<Location> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Erro ao criar local");
  }
  return response.json();
}

// Atualizar local
async function updateLocation({
  id,
  data,
}: {
  id: number;
  data: UpdateLocation;
}): Promise<Location> {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Erro ao atualizar local");
  }
  return response.json();
}

// Remover local
async function deleteLocation(id: number): Promise<void> {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Erro ao remover local");
  }
}

// Hook para buscar locais com paginação
export function useLocations(page: number = 1, limit: number = 10) {
  return useQuery({
    queryKey: ["locations", page, limit],
    queryFn: () => fetchLocations(page, limit),
  });
}

// Hook para buscar todos os locais (sem paginação)
export function useAllLocations() {
  return useQuery({
    queryKey: ["locations", "all"],
    queryFn: fetchAllLocations,
  });
}

// Hook para criar local
export function useCreateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
    },
  });
}

// Hook para atualizar local
export function useUpdateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
    },
  });
}

// Hook para remover location
export function useDeleteLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
    },
  });
}
