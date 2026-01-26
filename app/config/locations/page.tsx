"use client";

import { useState } from "react";
import { useLocations, useCreateLocation, useUpdateLocation, useDeleteLocation } from "@/hooks/use-locations";
import { Location, InsertLocation } from "@/shared/schema";
import { LocationForm } from "@/components/LocationForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { ArrowLeft, Plus, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";

export default function LocationsPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const { data, isLoading } = useLocations(page, limit);
  const createLocation = useCreateLocation();
  const updateLocation = useUpdateLocation();
  const deleteLocation = useDeleteLocation();
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<Location | null>(null);

  const handleAddLocation = () => {
    setSelectedLocation(null);
    setIsFormOpen(true);
  };

  const handleEditLocation = (location: Location) => {
    setSelectedLocation(location);
    setIsFormOpen(true);
  };

  const handleSaveLocation = async (data: InsertLocation) => {
    try {
      if (selectedLocation) {
        await updateLocation.mutateAsync({ id: selectedLocation.id, data });
        toast({
          title: "Local atualizada",
          description: "Local atualizada com sucesso.",
        });
      } else {
        await createLocation.mutateAsync(data);
        toast({
          title: "Local criada",
          description: "Local criada com sucesso.",
        });
      }
      setIsFormOpen(false);
      setSelectedLocation(null);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao guardar o local.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = (location: Location) => {
    setLocationToDelete(location);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!locationToDelete) return;

    try {
      await deleteLocation.mutateAsync(locationToDelete.id);
      toast({
        title: "Local removido",
        description: "Local removido com sucesso.",
      });
      setIsDeleteDialogOpen(false);
      setLocationToDelete(null);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao remover o local.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <h1 className="text-3xl font-bold text-white">Locais</h1>
            </div>
            <p className="text-muted-foreground">Gerir locais</p>
          </div>
        </div>

        <Button
          onClick={handleAddLocation}
          className="mb-6"
          size="lg"
        >
          <Plus className="mr-2 h-5 w-5" />
          Adicionar
        </Button>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            A carregar...
          </div>
        ) : (
          <>
            <div className="border border-white/10 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">
                      Nome do local
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">
                      Longitude
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">
                      Latitude
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data?.data && data.data.length > 0 ? (
                    data.data.map((location) => (
                    <tr key={location.id} className="hover:bg-white/5">
                      <td className="px-6 py-4 text-sm text-white">
                        {location.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {location.longitude}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {location.latitude}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(location)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Apagar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditLocation(location)}
                            className="text-primary hover:text-primary/80 hover:bg-primary/10"
                          >
                            <Pencil className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-8 text-center text-muted-foreground"
                    >
                      Nenhum local encontrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {data?.pagination && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Página {data.pagination.page} de {data.pagination.totalPages} ({data.pagination.total} {data.pagination.total === 1 ? "local" : "locais"})
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))}
                  disabled={page === data.pagination.totalPages}
                >
                  Próxima
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
          </>
        )}

        {/* Dialog para adicionar/editar local */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {selectedLocation ? "Editar local" : "Adicionar local"}
              </DialogTitle>
            </DialogHeader>
            <LocationForm
              location={selectedLocation}
              onSave={handleSaveLocation}
              onCancel={() => {
                setIsFormOpen(false);
                setSelectedLocation(null);
              }}
              isLoading={createLocation.isPending || updateLocation.isPending}
            />
          </DialogContent>
        </Dialog>

        {/* Dialog de confirmação de remoção */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Tem a certeza?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. O local "{locationToDelete?.name}" será
                removido permanentemente da base de dados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Remover
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
