import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Car, User } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function CompleteProfile() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedRole, setSelectedRole] = useState<"passenger" | "driver" | null>(null);

  const completeProfile = trpc.profile.completeProfile.useMutation({
    onSuccess: () => {
      toast.success("Perfil completado com sucesso!");
      // Reload to update user context
      window.location.href = "/";
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao completar perfil");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) {
      toast.error("Selecione um tipo de perfil");
      return;
    }
    if (!name.trim() || !phone.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }
    completeProfile.mutate({ name, phone, role: selectedRole });
  };

  // Redirect logic using useEffect to avoid setState during render
  useEffect(() => {
    if (!loading && !user) {
      setLocation("/");
    }
    if (!loading && user && user.profileCompleted === 1) {
      setLocation("/");
    }
  }, [loading, user, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || user.profileCompleted === 1) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
              <Car className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">CenterTáxi</h1>
          </div>
          <h2 className="text-2xl font-semibold text-foreground">Complete seu perfil</h2>
          <p className="text-muted-foreground">
            Para começar, precisamos de algumas informações básicas
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6 space-y-6 bg-card border-border">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-card-foreground">Nome completo</Label>
              <Input
                id="name"
                type="text"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-background text-foreground border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-card-foreground">Telefone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(00) 00000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="bg-background text-foreground border-border"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-card-foreground">Você é:</Label>
              <div className="grid md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setSelectedRole("passenger")}
                  className={`p-6 rounded-lg border-2 transition-all ${
                    selectedRole === "passenger"
                      ? "border-primary bg-primary/10"
                      : "border-border bg-background hover:border-primary/50"
                  }`}
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                      selectedRole === "passenger" ? "bg-primary" : "bg-muted"
                    }`}>
                      <User className={`h-6 w-6 ${
                        selectedRole === "passenger" ? "text-primary-foreground" : "text-muted-foreground"
                      }`} />
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-foreground">Passageiro</div>
                      <div className="text-sm text-muted-foreground">Solicitar corridas</div>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole("driver")}
                  className={`p-6 rounded-lg border-2 transition-all ${
                    selectedRole === "driver"
                      ? "border-primary bg-primary/10"
                      : "border-border bg-background hover:border-primary/50"
                  }`}
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                      selectedRole === "driver" ? "bg-primary" : "bg-muted"
                    }`}>
                      <Car className={`h-6 w-6 ${
                        selectedRole === "driver" ? "text-primary-foreground" : "text-muted-foreground"
                      }`} />
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-foreground">Motorista</div>
                      <div className="text-sm text-muted-foreground">Aceitar corridas</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </Card>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={completeProfile.isPending || !selectedRole}
          >
            {completeProfile.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Salvando...
              </>
            ) : (
              "Continuar"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
