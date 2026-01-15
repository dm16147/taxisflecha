"use client";

import { BookingCard } from "@/components/BookingCard";
import type { BookingListItem, BookingType } from "@/shared/schema";

type Props = {
  bookingList: BookingListItem[];
  type: BookingType;
  onBookingClick: (ref: string) => void;
};

export default function BookingList({ bookingList, type, onBookingClick }: Props) {
  if (bookingList.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 p-12 text-center">
        <p className="text-zinc-500">Não há reservas agendadas para este intervalo de datas.</p>
      </div>
    );
  }

  return (
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
  );
}
