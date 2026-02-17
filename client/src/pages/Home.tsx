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
      // Redirect based on user role (admin NOT redirected automatically)
      if (user.profileCompleted === 0) {
        setLocation("/complete-profile");
      } else if (user.role === "passenger") {
        setLocation("/passenger");
      } else if (user.role === "driver") {
        setLocation("/driver");
      }
      // Admin stays on home page - must access /admin manually
    }
  }, [user, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // For logged users who completed profile, show app interface
  if (user && user.profileCompleted === 1) {
    // Admin users see test panel, regular users redirected above
    if (user.role === "admin") {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12">
          <div className="max-w-2xl w-full space-y-8">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2 mb-4">
                <img src="/logo.png" alt="CenterTáxi" className="h-16 w-auto" />
                <h1 className="text-3xl font-bold text-foreground">CenterTáxi</h1>
              </div>
              <h2 className="text-2xl font-semibold text-foreground">Painel de Testes</h2>
              <p className="text-muted-foreground">
                Olá, {user.name}! Escolha qual interface deseja testar:
              </p>
            </div>

            <div className="grid gap-4">
              <Card className="p-6 space-y-4 bg-card border-border">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-card-foreground">Interface do Passageiro</h3>
                    <p className="text-sm text-muted-foreground">Solicitar corridas, ver histórico</p>
                  </div>
                </div>
                <Button onClick={() => setLocation("/passenger")} className="w-full" size="lg">
                  Acessar como Passageiro
                </Button>
              </Card>

              <Card className="p-6 space-y-4 bg-card border-border">
                <div className="flex items-center gap-4">
                  <img src="/logo.png" alt="CenterTáxi" className="h-12 w-auto" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-card-foreground">Interface do Motorista</h3>
                    <p className="text-sm text-muted-foreground">Aceitar corridas, ver ganhos</p>
                  </div>
                </div>
                <Button onClick={() => setLocation("/driver")} className="w-full" size="lg">
                  Acessar como Motorista
                </Button>
              </Card>

              <Card className="p-6 space-y-4 bg-card border-border">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-card-foreground">Painel Administrativo</h3>
                    <p className="text-sm text-muted-foreground">Gerência de usuários e corridas</p>
                  </div>
                </div>
                <Button onClick={() => setLocation("/admin")} className="w-full" size="lg" variant="outline">
                  Acessar Painel Admin
                </Button>
              </Card>
            </div>
          </div>
        </div>
      );
    }
    
    // Regular users already redirected by useEffect
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
              <img src="/logo.png" alt="CenterTáxi" className="h-12 w-auto" />
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
                <img src="/logo.png" alt="CenterTáxi" className="h-16 w-auto mx-auto" />
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
