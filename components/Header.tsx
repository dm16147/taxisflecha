
"use client";

import { Car, Settings, LogIn, LogOut, User } from "lucide-react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { signIn, signOut } from "next-auth/react";
import { useAuth, useIsManager } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const isManager = user?.roles?.includes("MANAGER") ?? false;
  const [configOpen, setConfigOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setConfigOpen(false);
      }
    }
    if (configOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [configOpen]);

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

        <div className="flex items-center gap-2">
          {/* Configuration Dropdown - Only visible to MANAGER */}
          {isManager && (
            <div className="relative" ref={dropdownRef}>
              <button
                className="flex items-center gap-2 px-3 py-2 rounded-md text-white hover:bg-white/10 transition"
                onClick={() => setConfigOpen((v) => !v)}
                aria-haspopup="true"
                aria-expanded={configOpen}
              >
                <Settings className="w-5 h-5" />
                <span className="hidden sm:inline">Configurações</span>
              </button>
              {configOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-background border border-white/10 rounded-md shadow-lg z-50">
                  <Link
                    href="/config/locations"
                    className="block px-4 py-2 text-sm text-white hover:bg-primary/20 rounded-t-md"
                    onClick={() => setConfigOpen(false)}
                  >
                    Locais
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* User Menu */}
          {isLoading ? (
            <div className="h-8 w-8 rounded-full bg-white/10 animate-pulse" />
          ) : isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-primary/20 border border-primary/40">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              onClick={() => signIn("google")}
              variant="default"
              className="gap-2"
            >
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">Entrar</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
