
"use client";

import { Car, Settings } from "lucide-react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";

export function Header() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-yellow-600 shadow-lg shadow-primary/20">
            <Car className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold font-display tracking-tight text-white hidden sm:block">
            Taxis<span className="text-primary">Flecha</span>
          </span>
        </div>
        {/* Configurações Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            className="flex items-center gap-2 px-3 py-2 rounded-md text-white hover:bg-white/10 transition"
            onClick={() => setOpen((v) => !v)}
            aria-haspopup="true"
            aria-expanded={open}
          >
            <Settings className="w-5 h-5" />
            <span className="hidden sm:inline">Configurações</span>
          </button>
          {open && (
            <div className="absolute right-0 mt-2 w-44 bg-background border border-white/10 rounded-md shadow-lg z-50">
              <Link
                href="/config/locations"
                className="block px-4 py-2 text-sm text-white hover:bg-primary/20 rounded-t-md"
                onClick={() => setOpen(false)}
              >
                Locais
              </Link>
              {/* Futuras opções aqui */}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
