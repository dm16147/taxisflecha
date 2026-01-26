"use client";

import Dashboard from "@/components/pages/Dashboard";
import { useSearchParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useEffect, Suspense } from "react";

function HomeContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        const error = searchParams.get("error");
        
        if (error === "InsufficientPermissions") {
            toast({
                variant: "destructive",
                title: "Permissões Insuficientes",
                description: "Não tem permissão para aceder a esta página. Contacte o administrador se necessitar de acesso.",
            });
            
            // Clean up URL
            setTimeout(() => {
                router.replace("/");
            }, 100);
        }
    }, [searchParams, toast, router]);

    return <Dashboard />;
}

export default function Home() {
    return (
        <Suspense fallback={<div>A carregar...</div>}>
            <HomeContent />
        </Suspense>
    );
}