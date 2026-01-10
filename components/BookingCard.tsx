import { format } from "date-fns";
import { Clock, User, Hash } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { BookingListItem, BookingType } from "@/shared/schema";

interface BookingCardProps {
  booking: BookingListItem;
  onClick: () => void;
  index: number;
  type: BookingType;
}

export function BookingCard({ booking, onClick, index, type }: BookingCardProps) {
  const isArrival = type === "arrivals";
  const rawDate = isArrival ? (booking.arrivaldate || booking.departuredate) : (booking.departuredate || booking.arrivaldate);

  const parsedDate = rawDate ? new Date(rawDate) : null;
  const isValidDate = parsedDate && !isNaN(parsedDate.getTime());
  const timeDisplay = isValidDate ? format(parsedDate as Date, "HH:mm") : "--:--";
  const dateDisplay = isValidDate ? format(parsedDate as Date, "dd MMM yyyy") : "TBC";
  const tripLabel = isArrival ? "Chegada" : "Partida";

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "pending": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "cancelled": return "bg-red-500/10 text-red-500 border-red-500/20";
      default: return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ y: -2, scale: 1.01 }}
      onClick={onClick}
      className="group cursor-pointer relative overflow-hidden rounded-2xl border border-white/5 bg-card p-5 shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/40 hover:border-primary/30 transition-all duration-300"
    >
      {/* Decorative gradient blob */}
      <div className="absolute -right-12 -top-12 h-24 w-24 rounded-full bg-primary/5 blur-2xl group-hover:bg-primary/10 transition-colors duration-500" />

      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-zinc-800/50 flex items-center justify-center border border-white/5 group-hover:border-primary/20 transition-colors">
            <Clock className="h-5 w-5 text-zinc-400 group-hover:text-primary transition-colors" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{tripLabel}</p>
            <p className="font-display font-bold text-lg text-white">
              {timeDisplay}
            </p>
          </div>
        </div>
        <div className={cn("px-2.5 py-1 rounded-lg text-xs font-semibold border uppercase tracking-wide", getStatusColor(booking.status))}>
          {booking.status}
        </div>
      </div>

      <div className="space-y-3 relative z-10">
        <div className="flex items-center gap-3">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-zinc-200 line-clamp-1">{booking.passengername}</span>
        </div>
        <div className="flex items-center gap-3">
          <Hash className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono text-sm text-zinc-400">{booking.ref}</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between relative z-10">
      <span className="text-xs text-zinc-500 font-mono">{dateDisplay}</span>
         <span className="text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300">
            Ver detalhes →
         </span>
      </div>
    </motion.div>
  );
}
