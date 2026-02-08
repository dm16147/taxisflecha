"use client";

import { useQuery } from "@tanstack/react-query";
import type { Driver } from "@/shared/schema";
import { useToast } from "@/hooks/use-toast";

async function fetchDrivers(toast: ReturnType<typeof useToast>["toast"]): Promise<Driver[]> {
  const response = await fetch("/api/drivers");
  
  if (response.status === 401) {
    toast({
      title: "Não autenticado",
      description: "Por favor, faça login para visualizar os motoristas.",
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
    throw new Error("Failed to fetch drivers");
  }
  const data = await response.json();
  return data.drivers;
}

export function useDrivers() {
  const { toast } = useToast();
  
  return useQuery({
    queryKey: ["drivers"],
    queryFn: () => fetchDrivers(toast),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
