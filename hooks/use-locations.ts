import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
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

type SearchParams = {
  query: string;
  pageParam?: number;
  limit?: number;
};

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

// Fetch all locations without pagination (for dropdowns)
async function fetchAllLocations(): Promise<Location[]> {
  const response = await fetch(`${API_URL}?page=1&limit=1000`);
  if (!response.ok) {
    throw await buildRequestError(response, "Erro ao buscar locais", "fetchAllLocations");
  }
  const data = await response.json();
  return data.data;
}

// Fetch locais com paginação
async function fetchLocations(page: number = 1, limit: number = 10): Promise<PaginatedResponse> {
  const response = await fetch(`${API_URL}?page=${page}&limit=${limit}`);
  if (!response.ok) {
    throw await buildRequestError(response, "Erro ao buscar locais", "fetchLocations");
  }
  return response.json();
}

// Fetch locations with search and pagination
async function searchLocations({ query, pageParam = 1, limit = 10 }: SearchParams): Promise<PaginatedResponse> {
  const params = new URLSearchParams({
    page: String(pageParam),
    limit: String(limit),
  });
  if (query) params.set("q", query);

  const response = await fetch(`${API_URL}?${params.toString()}`);
  if (!response.ok) {
    throw await buildRequestError(response, "Erro ao buscar locais", "searchLocations");
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
    throw await buildRequestError(response, "Erro ao criar local", "createLocation");
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
    throw await buildRequestError(response, "Erro ao atualizar local", "updateLocation");
  }
  return response.json();
}

// Remover local
async function deleteLocation(id: number): Promise<void> {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw await buildRequestError(response, "Erro ao remover local", "deleteLocation");
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

// Hook para buscar locais com pesquisa e paginação incremental
export function useLocationSearch(query: string, limit: number = 10) {
  return useInfiniteQuery({
    queryKey: ["locations", "search", query, limit],
    queryFn: ({ pageParam }) => searchLocations({ query, pageParam, limit }),
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !!query,
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
