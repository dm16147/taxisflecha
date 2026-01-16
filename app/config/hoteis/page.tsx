"use client";

import { useState } from "react";
import { useHotels, useCreateHotel, useUpdateHotel, useDeleteHotel } from "@/hooks/use-hotels";
import { Hotel, InsertHotel } from "@/shared/schema";
import { HotelForm } from "@/components/HotelForm";
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
import { ArrowLeft, Plus, Pencil, Trash2 } from "lucide-react";

export default function HoteisPage() {
  const { data: hotels, isLoading } = useHotels();
  const createHotel = useCreateHotel();
  const updateHotel = useUpdateHotel();
  const deleteHotel = useDeleteHotel();
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [hotelToDelete, setHotelToDelete] = useState<Hotel | null>(null);

  const handleAddHotel = () => {
    setSelectedHotel(null);
    setIsFormOpen(true);
  };

  const handleEditHotel = (hotel: Hotel) => {
    setSelectedHotel(hotel);
    setIsFormOpen(true);
  };

  const handleSaveHotel = async (data: InsertHotel) => {
    try {
      if (selectedHotel) {
        await updateHotel.mutateAsync({ id: selectedHotel.id, data });
        toast({
          title: "Hotel atualizado",
          description: "Hotel atualizado com sucesso.",
        });
      } else {
        await createHotel.mutateAsync(data);
        toast({
          title: "Hotel criado",
          description: "Hotel criado com sucesso.",
        });
      }
      setIsFormOpen(false);
      setSelectedHotel(null);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao guardar o hotel.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = (hotel: Hotel) => {
    setHotelToDelete(hotel);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!hotelToDelete) return;

    try {
      await deleteHotel.mutateAsync(hotelToDelete.id);
      toast({
        title: "Hotel removido",
        description: "Hotel removido com sucesso.",
      });
      setIsDeleteDialogOpen(false);
      setHotelToDelete(null);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao remover o hotel.",
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
              <h1 className="text-3xl font-bold text-white">Hotéis</h1>
            </div>
            <p className="text-muted-foreground">Gerir hotéis existentes</p>
          </div>
        </div>

        <Button
          onClick={handleAddHotel}
          className="mb-6"
          size="lg"
        >
          <Plus className="mr-2 h-5 w-5" />
          Adicionar +
        </Button>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Carregando...
          </div>
        ) : (
          <div className="border border-white/10 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-white">
                    Nome do hotel
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
                {hotels && hotels.length > 0 ? (
                  hotels.map((hotel) => (
                    <tr key={hotel.id} className="hover:bg-white/5">
                      <td className="px-6 py-4 text-sm text-white">
                        {hotel.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {hotel.longitude}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {hotel.latitude}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(hotel)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Apagar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditHotel(hotel)}
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
                      Nenhum hotel encontrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Dialog para adicionar/editar hotel */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {selectedHotel ? "Editar hotel" : "Adicionar hotel"}
              </DialogTitle>
            </DialogHeader>
            <HotelForm
              hotel={selectedHotel}
              onSave={handleSaveHotel}
              onCancel={() => {
                setIsFormOpen(false);
                setSelectedHotel(null);
              }}
              isLoading={createHotel.isPending || updateHotel.isPending}
            />
          </DialogContent>
        </Dialog>

        {/* Dialog de confirmação de remoção */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Tem a certeza?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. O hotel "{hotelToDelete?.name}" será
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
