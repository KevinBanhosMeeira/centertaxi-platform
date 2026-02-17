import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Car, Users, MapPin, TrendingUp } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Admin() {
  const { user, loading, logout } = useAuth();
  const [, setLocation] = useLocation();

  const { data: stats, isLoading: statsLoading } = trpc.admin.getStats.useQuery(undefined, {
    refetchInterval: 5000,
  });
  const { data: users, isLoading: usersLoading } = trpc.admin.getUsers.useQuery();
  const { data: rides, isLoading: ridesLoading } = trpc.admin.getRides.useQuery();

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      setLocation("/");
    }
  }, [user, loading, setLocation]);

  if (loading || statsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      requested: "Solicitada",
      accepted: "Aceita",
      in_progress: "Em andamento",
      completed: "Concluída",
      cancelled: "Cancelada",
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      requested: "text-yellow-500",
      accepted: "text-blue-500",
      in_progress: "text-green-500",
      completed: "text-gray-500",
      cancelled: "text-red-500",
    };
    return colorMap[status] || "text-gray-500";
  };

  const getRoleText = (role: string) => {
    const roleMap: Record<string, string> = {
      passenger: "Passageiro",
      driver: "Motorista",
      admin: "Administrador",
    };
    return roleMap[role] || role;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="CenterTáxi" className="h-10 w-auto" />
          <h1 className="text-xl font-bold text-card-foreground">Painel Administrativo</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={() => logout()}>
          Sair
        </Button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container max-w-6xl mx-auto px-4 py-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6 bg-card border-border">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Total Usuários</div>
                  <div className="text-2xl font-bold text-foreground">{stats?.totalUsers || 0}</div>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-card border-border">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Passageiros</div>
                  <div className="text-2xl font-bold text-foreground">{stats?.totalPassengers || 0}</div>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-card border-border">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Car className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Motoristas</div>
                  <div className="text-2xl font-bold text-foreground">{stats?.totalDrivers || 0}</div>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-card border-border">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Corridas Ativas</div>
                  <div className="text-2xl font-bold text-foreground">{stats?.activeRides || 0}</div>
                </div>
              </div>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="rides" className="space-y-4">
            <TabsList className="bg-card border border-border">
              <TabsTrigger value="rides">Corridas</TabsTrigger>
              <TabsTrigger value="users">Usuários</TabsTrigger>
            </TabsList>

            <TabsContent value="rides" className="space-y-3">
              {ridesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : !rides || rides.length === 0 ? (
                <Card className="p-8 text-center bg-card border-border">
                  <MapPin className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">Nenhuma corrida registrada</p>
                </Card>
              ) : (
                rides.map((ride) => (
                  <Card key={ride.id} className="p-4 bg-card border-border">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          ID: {ride.id} • {format(new Date(ride.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </span>
                        <span className={`text-sm font-medium ${getStatusColor(ride.status)}`}>
                          {getStatusText(ride.status)}
                        </span>
                      </div>

                      <div className="grid md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="text-muted-foreground">Passageiro ID</div>
                          <div className="text-foreground">{ride.passengerId}</div>
                        </div>
                        {ride.driverId && (
                          <div>
                            <div className="text-muted-foreground">Motorista ID</div>
                            <div className="text-foreground">{ride.driverId}</div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="text-muted-foreground">Origem</div>
                            <div className="text-foreground">{ride.originAddress}</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="text-muted-foreground">Destino</div>
                            <div className="text-foreground">{ride.destinationAddress}</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-border text-sm">
                        <span className="text-muted-foreground">{ride.distanceKm} km</span>
                        <span className="font-semibold text-primary">R$ {ride.priceEstimate}</span>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="users" className="space-y-3">
              {usersLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : !users || users.length === 0 ? (
                <Card className="p-8 text-center bg-card border-border">
                  <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">Nenhum usuário registrado</p>
                </Card>
              ) : (
                users.map((u) => (
                  <Card key={u.id} className="p-4 bg-card border-border">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="font-semibold text-foreground">{u.name || "Sem nome"}</div>
                        <div className="text-sm text-muted-foreground">{u.email}</div>
                        <div className="text-xs text-muted-foreground">
                          ID: {u.id} • {getRoleText(u.role)}
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <div className="text-muted-foreground">Cadastro</div>
                        <div className="text-foreground">
                          {format(new Date(u.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
