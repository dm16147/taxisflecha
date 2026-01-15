"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { addWeeks, endOfWeek, format, startOfWeek } from "date-fns";
import { Calendar as CalendarIcon, Search } from "lucide-react";
import { useState } from "react";

type Props = {
    dateFrom: string;
    dateTo: string;
    setDateFrom: (v: string) => void;
    setDateTo: (v: string) => void;
    dateFromOpen: boolean;
    setDateFromOpen: (b: boolean) => void;
    dateToOpen: boolean;
    setDateToOpen: (b: boolean) => void;
};

export default function DashboardControls({
    dateFrom,
    dateTo,
    setDateFrom,
    setDateTo,
    dateFromOpen,
    setDateFromOpen,
    dateToOpen,
    setDateToOpen,
}: Props) {
    const [search, setSearch] = useState("");

    return (
        <div className="flex gap-2">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <Input
                    placeholder="Pesquise por nome ou referência..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 w-full md:w-64 bg-zinc-900/50 border-zinc-800 focus:border-primary/50 focus:ring-primary/20"
                />
            </div>

            <div className="flex items-center gap-2">
                <div className="relative flex gap-2">
                    <Input
                        value={dateFrom ? format(new Date(dateFrom), "MMM dd, yyyy") : ""}
                        placeholder="Selecione data de início"
                        className="bg-zinc-900/50 border-zinc-800 text-zinc-200 pr-10 w-[180px]"
                        readOnly
                        onKeyDown={(e) => {
                            if (e.key === "ArrowDown") {
                                e.preventDefault();
                                setDateFromOpen(true);
                            }
                        }}
                    />
                    <Popover open={dateFromOpen} onOpenChange={setDateFromOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="ghost"
                                className="absolute top-1/2 right-2 h-6 w-6 -translate-y-1/2 p-0 hover:bg-zinc-800"
                            >
                                <CalendarIcon className="h-3.5 w-3.5 text-zinc-400" />
                                <span className="sr-only">Selecione data de início</span>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-zinc-900 border-zinc-800 text-zinc-200">
                            <Calendar
                                mode="single"
                                selected={dateFrom ? new Date(dateFrom) : undefined}
                                onSelect={(date) => {
                                    if (date) {
                                        setDateFrom(format(date, "yyyy-MM-dd"));
                                        setDateFromOpen(false);
                                    }
                                }}
                                disabled={(date) => dateTo ? date > new Date(dateTo) : false}
                                className="bg-zinc-900 text-zinc-200"
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                <span className="text-zinc-400">to</span>

                <div className="relative flex gap-2">
                    <Input
                        value={dateTo ? format(new Date(dateTo), "MMM dd, yyyy") : ""}
                        placeholder="Selecione date de fim"
                        className="bg-zinc-900/50 border-zinc-800 text-zinc-200 pr-10 w-[180px]"
                        readOnly
                        onKeyDown={(e) => {
                            if (e.key === "ArrowDown") {
                                e.preventDefault();
                                setDateToOpen(true);
                            }
                        }}
                    />
                    <Popover open={dateToOpen} onOpenChange={setDateToOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="ghost"
                                className="absolute top-1/2 right-2 h-6 w-6 -translate-y-1/2 p-0 hover:bg-zinc-800"
                            >
                                <CalendarIcon className="h-3.5 w-3.5 text-zinc-400" />
                                <span className="sr-only">Selecione date de fim</span>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-zinc-900 border-zinc-800 text-zinc-200" align="end">
                            <Calendar
                                mode="single"
                                selected={dateTo ? new Date(dateTo) : undefined}
                                onSelect={(date) => {
                                    if (date) {
                                        setDateTo(format(date, "yyyy-MM-dd"));
                                        setDateToOpen(false);
                                    }
                                }}
                                disabled={(date) => dateFrom ? date < new Date(dateFrom) : false}
                                className="bg-zinc-900 text-zinc-200"
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                <Button
                    variant="outline"
                    className="border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:text-white hover:bg-zinc-800"
                    onClick={() => {
                        const start = startOfWeek(new Date(), { weekStartsOn: 1 });
                        const end = endOfWeek(new Date(), { weekStartsOn: 1 });
                        setDateFrom(format(start, "yyyy-MM-dd"));
                        setDateTo(format(end, "yyyy-MM-dd"));
                    }}
                >
                    This week
                </Button>

                <Button
                    variant="outline"
                    className="border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:text-white hover:bg-zinc-800"
                    onClick={() => {
                        const currentDate = dateFrom ? new Date(dateFrom) : new Date();
                        const prevStart = startOfWeek(addWeeks(currentDate, -1), { weekStartsOn: 1 });
                        const prevEnd = endOfWeek(addWeeks(currentDate, -1), { weekStartsOn: 1 });
                        setDateFrom(format(prevStart, "yyyy-MM-dd"));
                        setDateTo(format(prevEnd, "yyyy-MM-dd"));
                    }}
                >
                    Prev week
                </Button>

                <Button
                    variant="outline"
                    className="border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:text-white hover:bg-zinc-800"
                    onClick={() => {
                        const currentDate = dateFrom ? new Date(dateFrom) : new Date();
                        const nextStart = startOfWeek(addWeeks(currentDate, 1), { weekStartsOn: 1 });
                        const nextEnd = endOfWeek(addWeeks(currentDate, 1), { weekStartsOn: 1 });
                        setDateFrom(format(nextStart, "yyyy-MM-dd"));
                        setDateTo(format(nextEnd, "yyyy-MM-dd"));
                    }}
                >
                    Next week
                </Button>
            </div>
        </div>
    );
}
