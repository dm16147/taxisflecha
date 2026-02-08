"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Car, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect, Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function LoginContent() {
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    useEffect(() => {
        const error = searchParams.get("error");
        
        if (error === "AccessDenied") {
            console.log("Access Denied - showing toast");
            
            // Show toast immediately
            toast({
                variant: "destructive",
                title: "Acesso Negado",
                description: "O seu email não tem permissão para aceder a esta aplicação. Por favor, contacte o administrador.",
            });
            
            // Delay URL cleanup to allow toast to render
            setTimeout(() => {
                router.replace("/login");
            }, 100);
        } else if (error === "CredentialsSignin") {
            toast({
                variant: "destructive",
                title: "Erro de Login",
                description: "Email ou senha incorretos. Por favor, tente novamente.",
            });
            
            setTimeout(() => {
                router.replace("/login");
            }, 100);
        }
    }, [searchParams, toast, router]);

    const handleCredentialsLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validate email format
        const emailRegex = /^[a-zA-Z0-9_+&*-]+(?:\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
        if (!formData.email || !emailRegex.test(formData.email)) {
            toast({
                variant: "destructive",
                title: "Erro de Validação",
                description: "Por favor, insira um email válido",
            });
            return;
        }

        // Validate password is not empty
        if (!formData.password) {
            toast({
                variant: "destructive",
                title: "Erro de Validação",
                description: "Por favor, insira a sua senha",
            });
            return;
        }

        setLoading(true);

        try {
            const result = await signIn("credentials", {
                email: formData.email,
                password: formData.password,
                redirect: false,
            });

            if (result?.error) {
                toast({
                    variant: "destructive",
                    title: "Erro de Login",
                    description: "Email ou senha incorretos",
                });
            } else if (result?.ok) {
                router.push("/");
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Erro",
                description: "Erro ao fazer login. Por favor, tente novamente.",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black p-4">
            <div className="w-full max-w-md space-y-8">
                {/* Logo and Brand */}
                <div className="flex items-center justify-center gap-3">
                    <div className="h-16 w-16 rounded-2xl bg-yellow-600 flex items-center justify-center">
                        <Car className="h-8 w-8 text-black" />
                    </div>
                    <h1 className="text-3xl font-bold text-white">TaxisFlecha</h1>
                </div>

                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-2xl text-white">Bem-vindo</CardTitle>
                        <CardDescription className="text-gray-400">
                            Faça login para continuar
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="credentials" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-4">
                                <TabsTrigger value="credentials">Email</TabsTrigger>
                                <TabsTrigger value="oauth">Google</TabsTrigger>
                            </TabsList>

                            <TabsContent value="credentials">
                                <form onSubmit={handleCredentialsLogin} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-gray-200">Email</Label>
                                        <Input
                                            id="email"
                                            type="text"
                                            placeholder="seu@email.com"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            disabled={loading}
                                            className="bg-zinc-800 border-zinc-700 text-white"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="password" className="text-gray-200">Senha</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="Sua senha"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            disabled={loading}
                                            className="bg-zinc-800 border-zinc-700 text-white"
                                        />
                                    </div>

                                    <Button 
                                        type="submit" 
                                        className="w-full"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Entrando...
                                            </>
                                        ) : (
                                            "Entrar"
                                        )}
                                    </Button>

                                    <div className="text-center text-sm text-gray-400 mt-4">
                                        Não tem uma conta?{" "}
                                        <Link href="/register" className="text-yellow-600 hover:text-yellow-500">
                                            Criar conta
                                        </Link>
                                    </div>
                                </form>
                            </TabsContent>

                            <TabsContent value="oauth">
                                <div className="space-y-4">
                                    <p className="text-sm text-gray-400 text-center mb-4">
                                        Faça login com a sua conta Google
                                    </p>
                                    <Button
                                        onClick={() => signIn("google", { callbackUrl: "/" })}
                                        className="w-full"
                                        variant="outline"
                                    >
                                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                                            <path
                                                fill="currentColor"
                                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                            />
                                            <path
                                                fill="#34A853"
                                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                            />
                                            <path
                                                fill="#FBBC05"
                                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                            />
                                            <path
                                                fill="#EA4335"
                                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                            />
                                        </svg>
                                        Continuar com Google
                                    </Button>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="text-white">A carregar...</div>
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
