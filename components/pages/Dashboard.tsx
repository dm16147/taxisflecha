"use client";

import { BookingDetailDrawer } from "@/components/BookingDetailDrawer";
import { Header } from "@/components/Header";
import BookingList from "@/components/pages/BookingList";
import DashboardControls from "@/components/pages/DashboardControls";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBookings } from "@/hooks/use-bookings";
import { useAuth } from "@/hooks/use-auth";
import type { BookingListItem, BookingType } from "@/shared/schema";
import { endOfWeek, format, startOfWeek } from "date-fns";
import { Calendar as CalendarIcon, LogIn } from "lucide-react";
import { useState } from "react";
import { BookingCard } from "../BookingCard";
import { pt } from "date-fns/locale/pt";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const [selectedBookingRef, setSelectedBookingRef] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<BookingType>("departures");

  // Date range state
  const initialStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const initialEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

  const [dateFrom, setDateFrom] = useState(format(initialStart, "yyyy-MM-dd", { locale: pt }  ));
  const [dateTo, setDateTo] = useState(format(initialEnd, "yyyy-MM-dd", { locale: pt }));
  const [dateFromOpen, setDateFromOpen] = useState(false);
  const [dateToOpen, setDateToOpen] = useState(false);

  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data, isLoading, error } = useBookings(activeTab, dateFrom, dateTo);

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
            <DashboardControls
              dateFrom={dateFrom}
              dateTo={dateTo}
              setDateFrom={setDateFrom}
              setDateTo={setDateTo}
              dateFromOpen={dateFromOpen}
              setDateFromOpen={setDateFromOpen}
              dateToOpen={dateToOpen}
              setDateToOpen={setDateToOpen}
            />
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
              !isAuthenticated ? (
                <div className="rounded-2xl border border-amber-900/50 bg-amber-950/20 p-8 text-center">
                  <LogIn className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-amber-200 mb-2">Autenticação necessária</h3>
                  <p className="text-amber-300/80 mb-4">Por favor, faça login para visualizar as reservas.</p>
                  <Button onClick={() => signIn('google')} className="mx-auto">
                    <LogIn className="mr-2 h-4 w-4" />
                    Fazer Login com Google
                  </Button>
                </div>
              ) : (
                <div className="rounded-2xl border border-red-900/50 bg-red-950/20 p-8 text-center text-red-200">
                  Falha ao carregar as reservas. Por favor, tente novamente mais tarde.
                </div>
              )
            ) : bookingList.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 p-12 text-center">
                <CalendarIcon className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-zinc-300">Não foram encontradas partidas</h3>
                <p className="text-zinc-500">Não há reservas agendadas para este intervalo de datas.</p>
              </div>
            ) : (
              <BookingList bookingList={bookingList} type={activeTab} onBookingClick={handleBookingClick} />
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
              !isAuthenticated ? (
                <div className="rounded-2xl border border-amber-900/50 bg-amber-950/20 p-8 text-center">
                  <LogIn className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-amber-200 mb-2">Autenticação necessária</h3>
                  <p className="text-amber-300/80 mb-4">Por favor, faça login para visualizar as reservas.</p>
                  <Button onClick={() => signIn('google')} className="mx-auto">
                    <LogIn className="mr-2 h-4 w-4" />
                    Fazer Login com Google
                  </Button>
                </div>
              ) : (
                <div className="rounded-2xl border border-red-900/50 bg-red-950/20 p-8 text-center text-red-200">
                  Falha ao carregar as reservas. Por favor, tente novamente mais tarde.
                </div>
              )
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