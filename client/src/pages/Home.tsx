import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Car, User, Shield } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

export default function Home() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && user) {
      // Redirect based on user role
      if (user.profileCompleted === 0) {
        setLocation("/complete-profile");
      } else if (user.role === "passenger") {
        setLocation("/passenger");
      } else if (user.role === "driver") {
        setLocation("/driver");
      } else if (user.role === "admin") {
        setLocation("/admin");
      }
    }
  }, [user, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                <Car className="h-6 w-6 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">CenterTáxi</h1>
            </div>
            <Button asChild>
              <a href={getLoginUrl()}>Entrar</a>
            </Button>
          </div>
        </header>

        {/* Hero Section */}
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="max-w-4xl w-full space-y-8 text-center">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-6xl font-bold text-foreground">
                Mobilidade urbana
                <span className="block text-primary">inteligente e segura</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Conectando passageiros e motoristas com tecnologia de ponta para uma experiência de transporte excepcional
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto pt-8">
              <Card className="p-8 space-y-4 bg-card border-border hover:border-primary/50 transition-colors">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold text-card-foreground">Passageiro</h3>
                <p className="text-muted-foreground">
                  Solicite corridas com facilidade, acompanhe em tempo real e viaje com segurança
                </p>
                <Button asChild className="w-full" size="lg">
                  <a href={getLoginUrl()}>Começar agora</a>
                </Button>
              </Card>

              <Card className="p-8 space-y-4 bg-card border-border hover:border-primary/50 transition-colors">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Car className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold text-card-foreground">Motorista</h3>
                <p className="text-muted-foreground">
                  Aceite corridas, gerencie sua agenda e maximize seus ganhos com nossa plataforma
                </p>
                <Button asChild className="w-full" size="lg">
                  <a href={getLoginUrl()}>Dirigir com a gente</a>
                </Button>
              </Card>
            </div>

            <div className="pt-12 space-y-4">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Shield className="h-5 w-5" />
                <span>Plataforma segura e confiável</span>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border bg-card py-6">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            © 2026 CenterTáxi. Todos os direitos reservados.
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
