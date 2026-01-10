"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Search, Calendar as CalendarIcon, Filter } from "lucide-react";
import { Header } from "@/components/Header";
import { BookingCard } from "@/components/BookingCard";
import { BookingDetailDrawer } from "@/components/BookingDetailDrawer";
import { useBookings } from "@/hooks/use-bookings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import type { BookingListItem, BookingType } from "@/shared/schema";

export default function Dashboard() {
  const [selectedBookingRef, setSelectedBookingRef] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<BookingType>("departures");

  // Mock dates for search - using today
  const today = format(new Date(), "yyyy-MM-dd");
  const { data, isLoading, error } = useBookings(activeTab, today, today);

  const handleBookingClick = (ref: string) => {
    setSelectedBookingRef(ref);
    setIsDrawerOpen(true);
  };

  // Convert Record<string, Booking> to Array
  const bookingList: BookingListItem[] = data
    ? Object.values(data.bookings)
    : [];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container px-4 sm:px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-white mb-2">Reservas</h1>
            <p className="text-zinc-400">Gerir transfers diários.</p>
          </div>

          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                placeholder="Search ref or name..."
                className="pl-9 w-full md:w-64 bg-zinc-900/50 border-zinc-800 focus:border-primary/50 focus:ring-primary/20"
              />
            </div>
            <Button variant="outline" className="border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:text-white hover:bg-zinc-800">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>

        <Tabs defaultValue="departures" value={activeTab} onValueChange={(value) => setActiveTab(value as BookingType)} className="space-y-6">
          <TabsList className="bg-zinc-900/50 border border-white/5 p-1 h-auto rounded-xl">
            <TabsTrigger
              value="departures"
              className="px-6 py-2.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium transition-all"
            >
              Partidas
            </TabsTrigger>
            <TabsTrigger
              value="arrivals"
              className="px-6 py-2.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium transition-all"
            >
              Chegadas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="departures" className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-40 rounded-2xl border border-white/5 bg-zinc-900/50 p-5 space-y-4">
                    <div className="flex justify-between">
                      <Skeleton className="h-10 w-10 rounded-xl bg-zinc-800" />
                      <Skeleton className="h-6 w-20 rounded-lg bg-zinc-800" />
                    </div>
                    <Skeleton className="h-4 w-3/4 bg-zinc-800" />
                    <Skeleton className="h-4 w-1/2 bg-zinc-800" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-red-900/50 bg-red-950/20 p-8 text-center text-red-200">
                Falha ao carregar as reservas. Por favor, tente novamente mais tarde.
              </div>
            ) : bookingList.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 p-12 text-center">
                <CalendarIcon className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-zinc-300">Não foram encontradas partidas</h3>
                <p className="text-zinc-500">Não há reservas agendadas para este intervalo de datas.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {bookingList.map((booking, index) => (
                  <BookingCard
                    key={booking.ref}
                    booking={booking}
                    index={index}
                    type={activeTab}
                    onClick={() => handleBookingClick(booking.ref)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="arrivals" className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-40 rounded-2xl border border-white/5 bg-zinc-900/50 p-5 space-y-4">
                    <div className="flex justify-between">
                      <Skeleton className="h-10 w-10 rounded-xl bg-zinc-800" />
                      <Skeleton className="h-6 w-20 rounded-lg bg-zinc-800" />
                    </div>
                    <Skeleton className="h-4 w-3/4 bg-zinc-800" />
                    <Skeleton className="h-4 w-1/2 bg-zinc-800" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-red-900/50 bg-red-950/20 p-8 text-center text-red-200">
                Falha ao carregar as reservas. Por favor, tente novamente mais tarde.
              </div>
            ) : bookingList.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 p-12 text-center">
                <CalendarIcon className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-zinc-300">Nenhuma chegada encontrada</h3>
                <p className="text-zinc-500">Não há reservas agendadas para este intervalo de datas.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {bookingList.map((booking, index) => (
                  <BookingCard
                    key={booking.ref}
                    booking={booking}
                    index={index}
                    type={activeTab}
                    onClick={() => handleBookingClick(booking.ref)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <BookingDetailDrawer
        refId={selectedBookingRef}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
      />
    </div>
  );
}
