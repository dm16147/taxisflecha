"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { addWeeks, endOfWeek, format, isThisWeek, startOfWeek } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { pt } from "date-fns/locale/pt";

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

export default function DashboardControlsMobile({
    dateFrom,
    dateTo,
    setDateFrom,
    setDateTo,
    dateFromOpen,
    setDateFromOpen,
    dateToOpen,
    setDateToOpen,
}: Props) {
    const isCurrentWeek = dateFrom ? isThisWeek(new Date(dateFrom), { weekStartsOn: 1 }) : false;

    return (
        <div className="flex flex-col gap-2 w-full">
            {/* Linha das datas */}
            <div className="flex flex-row items-center gap-2 w-full">
                <div className="relative flex gap-2 flex-1">
                    <Input
                        value={dateFrom ? format(new Date(dateFrom), "dd MMM yyyy", { locale: pt }) : ""}
                        placeholder="Início"
                        className="bg-zinc-900/50 border-zinc-800 text-zinc-200 pr-10 w-full text-xs"
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
                                        setDateFrom(format(date, "yyyy-MM-dd", { locale: pt }));
                                        setDateFromOpen(false);
                                    }
                                }}
                                disabled={(date) => dateTo ? date > new Date(dateTo) : false}
                                className="bg-zinc-900 text-zinc-200"
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                <span className="text-zinc-400 text-xs">a</span>

                <div className="relative flex gap-2 flex-1">
                    <Input
                        value={dateTo ? format(new Date(dateTo), "dd MMM yyyy", { locale: pt }) : ""}
                        placeholder="Fim"
                        className="bg-zinc-900/50 border-zinc-800 text-zinc-200 pr-10 w-full text-xs"
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
                                        setDateTo(format(date, "yyyy-MM-dd", { locale: pt }));
                                        setDateToOpen(false);
                                    }
                                }}
                                disabled={(date) => dateFrom ? date < new Date(dateFrom) : false}
                                className="bg-zinc-900 text-zinc-200"
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            {/* Linha dos botões */}
            <div className="flex flex-row gap-2 w-full">
                {
                    <Button
                        disabled={isCurrentWeek}
                        variant="outline"
                        className="border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:text-white hover:bg-zinc-800 px-2 py-1.5 text-xs flex-1"
                        onClick={() => {
                            const currentDate = dateFrom ? new Date(dateFrom) : new Date();
                            const prevStart = startOfWeek(addWeeks(currentDate, -1), { weekStartsOn: 1 });
                            const prevEnd = endOfWeek(addWeeks(currentDate, -1), { weekStartsOn: 1 });
                            setDateFrom(format(prevStart, "yyyy-MM-dd", { locale: pt }));
                            setDateTo(format(prevEnd, "yyyy-MM-dd", { locale: pt }));
                        }}
                    >
                        Anterior
                    </Button>
                }
                <Button
                    variant="outline"
                    className="border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:text-white hover:bg-zinc-800 px-2 py-1.5 text-xs flex-1"
                    onClick={() => {
                        const start = startOfWeek(new Date(), { weekStartsOn: 1 });
                        const end = endOfWeek(new Date(), { weekStartsOn: 1 });
                        setDateFrom(format(start, "yyyy-MM-dd", { locale: pt }));
                        setDateTo(format(end, "yyyy-MM-dd", { locale: pt }));
                    }}
                >
                    Atual
                </Button>
                <Button
                    variant="outline"
                    className="border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:text-white hover:bg-zinc-800 px-2 py-1.5 text-xs flex-1"
                    onClick={() => {
                        const currentDate = dateFrom ? new Date(dateFrom) : new Date();
                        const nextStart = startOfWeek(addWeeks(currentDate, 1), { weekStartsOn: 1 });
                        const nextEnd = endOfWeek(addWeeks(currentDate, 1), { weekStartsOn: 1 });
                        setDateFrom(format(nextStart, "yyyy-MM-dd", { locale: pt }));
                        setDateTo(format(nextEnd, "yyyy-MM-dd", { locale: pt }));
                    }}
                >
                    Próxima
                </Button>
            </div>
        </div>
    );
}
