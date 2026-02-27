"use client";

import { BookingCard } from "@/components/BookingCard";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { BookingListItem, BookingType } from "@/shared/schema";

type Props = {
  bookingList: BookingListItem[];
  type: BookingType;
  onBookingClick: (ref: string) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  hasMore: boolean;
  isLoading: boolean;
};

export default function BookingList({ 
  bookingList, 
  type, 
  onBookingClick,
  currentPage,
  setCurrentPage,
  hasMore,
  isLoading,
}: Props) {
  if (bookingList.length === 0 && currentPage === 1) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 p-12 text-center">
        <p className="text-zinc-500">Não há reservas agendadas para este intervalo de datas.</p>
      </div>
    );
  }

  const showPagination = currentPage > 1 || hasMore;
  const noMoreResults = bookingList.length === 0 && currentPage > 1;

  return (
    <div className="space-y-6">
      {noMoreResults ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 p-12 text-center">
          <p className="text-zinc-500">Não há mais reservas para exibir.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {bookingList.map((booking, index) => (
            <BookingCard
              key={booking.ref}
              booking={booking}
              index={index}
              type={type}
              onClick={() => onBookingClick(booking.ref)}
            />
          ))}
        </div>
      )}

      {showPagination && (
        <div className="flex items-center justify-center gap-4 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1 || isLoading}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          <span className="text-sm text-zinc-400">
            Página {currentPage}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={!hasMore || isLoading}
            className="gap-1"
          >
            Próxima
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
