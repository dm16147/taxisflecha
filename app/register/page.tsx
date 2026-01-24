"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export default function RegisterPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (formData.password !== formData.confirmPassword) {
            toast({
                variant: "destructive",
                title: "Erro",
                description: "As senhas não correspondem",
            });
            return;
        }

        setLoading(true);

        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                toast({
                    variant: "destructive",
                    title: "Erro no Registo",
                    description: data.error || "Erro ao criar conta",
                });
                return;
            }

            toast({
                title: "Conta Criada!",
                description: "Pode agora fazer login com as suas credenciais",
            });

            router.push("/login");
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Erro",
                description: "Erro ao criar conta. Por favor, tente novamente.",
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
                        <CardTitle className="text-2xl text-white">Criar Conta</CardTitle>
                        <CardDescription className="text-gray-400">
                            Preencha os dados para criar a sua conta
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-gray-200">Nome</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="Seu nome completo"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    disabled={loading}
                                    className="bg-zinc-800 border-zinc-700 text-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-gray-200">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="seu@email.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                    disabled={loading}
                                    className="bg-zinc-800 border-zinc-700 text-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-gray-200">Senha</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Mínimo 8 caracteres"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                    minLength={8}
                                    disabled={loading}
                                    className="bg-zinc-800 border-zinc-700 text-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="text-gray-200">Confirmar Senha</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="Repita a senha"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    required
                                    minLength={8}
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
                                        Criando conta...
                                    </>
                                ) : (
                                    "Criar Conta"
                                )}
                            </Button>
                        </form>

                        <div className="mt-4 text-center text-sm text-gray-400">
                            Já tem uma conta?{" "}
                            <Link href="/login" className="text-yellow-600 hover:text-yellow-500">
                                Fazer login
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
