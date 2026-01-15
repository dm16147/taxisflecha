import { useQuery } from "@tanstack/react-query";
import type { Driver } from "@/shared/schema";

async function fetchDrivers(): Promise<Driver[]> {
  const response = await fetch("/api/drivers");
  if (!response.ok) {
    throw new Error("Failed to fetch drivers");
  }
  const data = await response.json();
  return data.drivers;
}

export function useDrivers() {
  return useQuery({
    queryKey: ["drivers"],
    queryFn: fetchDrivers,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
