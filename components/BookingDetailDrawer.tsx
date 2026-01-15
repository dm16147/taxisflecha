"use client";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent
} from "@/components/ui/sheet";
import { useAssignDriver, useBookingDetail, useForceLocation, useSendLocation } from "@/hooks/use-bookings";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { drivers } from "@/shared/schema";
import { format } from "date-fns";
import { pt } from "date-fns/locale/pt";
import {
  Calendar,
  Hotel,
  MapPin,
  Plane,
  RotateCw,
  Send,
  Users
} from "lucide-react";
import { useEffect, useState } from "react";

interface BookingDetailDrawerProps {
  refId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BookingDetailDrawer({ refId, open, onOpenChange }: BookingDetailDrawerProps) {
  const { data, isLoading } = useBookingDetail(refId);
  const assignDriver = useAssignDriver();
  const forceLocation = useForceLocation();
  const sendLocation = useSendLocation();
  const { toast } = useToast();

  const [selectedDriver, setSelectedDriver] = useState<string>("");
  const [isReassigning, setIsReassigning] = useState<boolean>(false);

  const booking = data?.booking;
  const bookingStatus = data?.bookingStatus;
  const itinerary = booking?.arrival
    ? {
      type: "arrival" as const,
      fromLabel: "Recolha",
      from: booking.arrival.fromairport,
      toLabel: "Entrega",
      to: booking.arrival.accommodationname,
      date: booking.arrival.pickupdate || booking.arrival.arrivaldate || "",
      dateTitle: "Data e hora da recolha",
    }
    : booking?.departure
      ? {
        type: "departure" as const,
        fromLabel: "Recolha",
        from: booking.departure.accommodationname,
        toLabel: "Aeroporto",
        to: booking.departure.toairport,
        date: booking.departure.pickupdate || booking.departure.departuredate || "",
        dateTitle: "Data e hora da recolha",
      }
      : null;

  const itineraryDate = itinerary?.date ? new Date(itinerary.date) : null;

  const formattedItineraryDate = (() => {
    if (!itineraryDate || isNaN(itineraryDate.getTime())) return "TBC";

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateOnly = new Date(itineraryDate.getFullYear(), itineraryDate.getMonth(), itineraryDate.getDate());

    const timeStr = format(itineraryDate, "HH:mm", { locale: pt });

    if (dateOnly.getTime() === today.getTime()) {
      return `Hoje ${timeStr}`;
    } else if (dateOnly.getTime() === tomorrow.getTime()) {
      return `Amanhã ${timeStr}`;
    } else {
      return format(itineraryDate, "dd MMM yyyy HH:mm", { locale: pt });
    }
  })();

  // Check if we're within 30 minutes before the booking time
  const now = new Date();
  const canSendLocation = itineraryDate && !isNaN(itineraryDate.getTime())
    ? (itineraryDate.getTime() - now.getTime()) <= 30 * 60 * 1000 && now < itineraryDate
    : false;
  const locationAlreadySent = bookingStatus?.locationSent ?? false;

  // Update selected driver when data loads if already assigned
  useEffect(() => {
    if (open && bookingStatus?.driver) {
      setSelectedDriver(bookingStatus.driver);
    } else if (open) {
      setSelectedDriver("");
    }
    if (open) setIsReassigning(false);
  }, [open, bookingStatus?.driver]);

  const handleAssignDriver = () => {
    if (!refId || !selectedDriver) return;

    assignDriver.mutate({ bookingRef: refId, driverName: selectedDriver }, {
      onSuccess: () => {
        toast({
          title: "Motorista atribuído",
          description: `${selectedDriver} foi atribuído à reserva ${refId}`,
        });
        setIsReassigning(false);
      },
      onError: (err) => {
        toast({
          variant: "destructive",
          title: "Falha na atribuição",
          description: err.message
        });
      }
    });
  };

  const handleForceLocation = () => {
    if (!refId) return;
    forceLocation.mutate({ bookingRef: refId }, {
      onSuccess: (data) => {
        toast({
          title: data.autoSendLocation ? "Envio automático ativado" : "Envio automático desativado",
          description: data.message
        });
      },
      onError: (err) => {
        toast({
          variant: "destructive",
          title: "Falha ao alternar o envio automático",
          description: err.message
        });
      }
    });
  };

  const handleReassignDrive = () => {
    // Enter reassign mode and clear the local selection only; do NOT mutate cached bookingStatus
    setSelectedDriver("");
    setIsReassigning(true);
  }

  const handleCancelReassign = () => {
    // restore the selectedDriver from the cached bookingStatus (if any) and exit reassign mode
    setSelectedDriver(bookingStatus?.driver ?? "");
    setIsReassigning(false);
  }

  const handleSendLocation = () => {
    if (!refId) return;
    sendLocation.mutate({ bookingRef: refId }, {
      onSuccess: (data) => {
        toast({
          title: "Localização enviada",
          description: `Localização ${data.location} enviada com sucesso`,
        });
      },
      onError: (err) => {
        toast({
          variant: "destructive",
          title: "Falha ao enviar localização",
          description: err.message
        });
      }
    });
  };

  if (!open) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl p-0 border-l border-white/10 bg-zinc-950 overflow-y-auto">
        {isLoading || !data ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="relative h-40 bg-zinc-900 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent mix-blend-overlay" />
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80')] bg-cover bg-center opacity-10" />

              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-zinc-950 to-transparent">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                    booking?.general.status === "CONFIRMED" ? "bg-emerald-500 text-emerald-950" : "bg-zinc-700 text-zinc-300"
                  )}>
                    {booking?.general.status}
                  </span>
                  <span className="text-zinc-400 text-xs font-mono">{booking?.general.ref}</span>
                </div>
                <h2 className="text-2xl font-display font-bold text-white shadow-sm">
                  {booking?.general.passengername}
                </h2>
              </div>
            </div>

            <div className="flex-1 p-6 space-y-8">
              {/* Route Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Itinerário</h3>
                {itinerary ? (
                  <div className="bg-zinc-900/50 rounded-xl p-4 border border-white/5 space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 left-6 bottom-0 w-0.5 bg-zinc-800/50 border-r border-dashed border-zinc-700" />

                    <div className="relative z-10 flex gap-4">
                      <div className="mt-1 h-3 w-3 rounded-full bg-primary ring-4 ring-zinc-900" />
                      <div>
                        <p className="text-xs text-zinc-500 mb-0.5">{itinerary.fromLabel}</p>
                        <p className="font-medium text-zinc-200">{itinerary.from}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-primary">
                          <Plane className="h-3 w-3" />
                          <span>{itinerary.type === "arrival" ? "Chegada do voo" : "Partida do voo"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="relative z-10 flex gap-4">
                      <div className="mt-1 h-3 w-3 rounded-full bg-zinc-600 ring-4 ring-zinc-900" />
                      <div>
                        <p className="text-xs text-zinc-500 mb-0.5">{itinerary.toLabel}</p>
                        <p className="font-medium text-zinc-200">{itinerary.to}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
                          <Hotel className="h-3 w-3" />
                          <span>{itinerary.type === "arrival" ? "Alojamento" : "Aeroporto"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-zinc-900/40 rounded-xl p-4 border border-white/5 text-zinc-500">
                    Não há dados de itinerário disponíveis para esta reserva.
                  </div>
                )}
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-900/30 p-4 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2 text-zinc-500 mb-2">
                    <Calendar className="h-4 w-4" />
                    <span className="text-xs font-medium">{itinerary?.dateTitle ?? "Date"}</span>
                  </div>
                  <p className="font-semibold text-zinc-200">
                    {formattedItineraryDate}
                  </p>
                </div>
                <div className="bg-zinc-900/30 p-4 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2 text-zinc-500 mb-2">
                    <Users className="h-4 w-4" />
                    <span className="text-xs font-medium">Passageiros</span>
                  </div>
                  <p className="font-semibold text-zinc-200">
                    {booking?.general.adults} Adultos, {booking?.general.children} Crianças
                  </p>
                </div>
              </div>

              {/* Assignment Section */}
              <div className="space-y-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Atribuição de motorista</h3>
                  {bookingStatus?.driver ? (
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="text-xs font-medium text-emerald-500">Atribuído</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                      <span className="text-xs font-medium text-amber-500">Ação necessária</span>
                    </div>
                  )}
                </div>

                {(isReassigning || !bookingStatus?.driver) ? (
                  <div className="bg-card rounded-xl p-5 border border-white/5 shadow-inner">
                    <label className="text-sm text-zinc-400 mb-2 block">Selecionar motorista</label>
                    <div className="flex gap-2">
                      <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                        <SelectTrigger className="w-full bg-zinc-900 border-zinc-700">
                          <SelectValue placeholder="Escolha um motorista..." />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800">
                          {drivers.map(driver => (
                            <SelectItem key={driver} value={driver} className="focus:bg-zinc-800 focus:text-primary">
                              {driver}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={handleAssignDriver}
                          disabled={assignDriver.isPending || !selectedDriver}
                          className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-lg shadow-primary/20"
                        >
                          {assignDriver.isPending ? "A atribuir..." : "Atribuir"}
                        </Button>
                        {isReassigning && (
                          <Button
                            variant="ghost"
                            onClick={handleCancelReassign}
                            className="text-zinc-400"
                          >
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-emerald-500/10 rounded-xl p-5 border border-emerald-500/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-xs text-emerald-500/70 mb-1 block">Motorista atribuído</label>
                        <p className="text-lg font-semibold text-emerald-500">{bookingStatus.driver}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleReassignDrive}
                        className="border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10"
                      >
                        Reatribuir
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Tracking & Actions */}
              <div className="space-y-4 pt-4 border-t border-white/10">
                <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Acompanhamento e estado</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-zinc-900/30 p-4 rounded-xl border border-white/5 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs text-zinc-500">Estado da localização</span>
                      <span className={cn("text-sm font-bold flex items-center gap-2",
                        locationAlreadySent ? "text-emerald-500" : "text-zinc-400"
                      )}>
                        <span className={cn("h-1.5 w-1.5 rounded-full",
                          locationAlreadySent ? "bg-emerald-500" : "bg-zinc-600"
                        )} />
                        {locationAlreadySent ? "Enviado" : "Pendente"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-400">Auto</span>
                      <Switch
                        checked={bookingStatus?.autoSendLocation ?? false}
                        onCheckedChange={handleForceLocation}
                        disabled={forceLocation.isPending}
                      />
                    </div>
                  </div>

                  <div className="bg-zinc-900/30 p-4 rounded-xl border border-white/5 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs text-zinc-500">Envio automático</span>
                      <span className={cn("text-sm font-bold",
                        bookingStatus?.autoSendLocation ? "text-emerald-500" : "text-zinc-400"
                      )}>
                        {bookingStatus?.autoSendLocation ? "Ativado" : "Desativado"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Send Location Button */}
                {canSendLocation && !locationAlreadySent && (
                  <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-5 border border-primary/20">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin className="h-4 w-4 text-primary" />
                          <h4 className="text-sm font-semibold text-white">Pronto para enviar localização</h4>
                        </div>
                        <p className="text-xs text-zinc-400">
                          O tempo de transferência é de 30 minutos. Envie a localização para notificar o passageiro.
                        </p>
                      </div>
                      <Button
                        onClick={handleSendLocation}
                        disabled={sendLocation.isPending}
                        className="bg-primary hover:bg-primary/90 font-semibold whitespace-nowrap"
                        size="sm"
                      >
                        {sendLocation.isPending ? (
                          <>
                            <RotateCw className="h-3 w-3 mr-1.5 animate-spin" />
                            A enviar...
                          </>
                        ) : (
                          <>
                            <Send className="h-3 w-3 mr-1.5" />
                            Enviar localização
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
