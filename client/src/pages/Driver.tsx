import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Car, MapPin, Navigation, DollarSign, Check, Play, CheckCircle } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Driver() {
  const { user, loading, logout } = useAuth();
  const [, setLocation] = useLocation();

  const { data: availableRides, refetch: refetchAvailable } = trpc.rides.getAvailable.useQuery(undefined, {
    refetchInterval: 3000, // Poll every 3 seconds
  });

  const { data: activeRide, refetch: refetchActive } = trpc.rides.getActiveDriver.useQuery(undefined, {
    refetchInterval: 3000,
  });

  const acceptRide = trpc.rides.accept.useMutation({
    onSuccess: () => {
      toast.success("Corrida aceita!");
      refetchActive();
      refetchAvailable();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao aceitar corrida");
    },
  });

  const startRide = trpc.rides.start.useMutation({
    onSuccess: () => {
      toast.success("Corrida iniciada!");
      refetchActive();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao iniciar corrida");
    },
  });

  const completeRide = trpc.rides.complete.useMutation({
    onSuccess: () => {
      toast.success("Corrida concluída!");
      refetchActive();
      refetchAvailable();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao concluir corrida");
    },
  });

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/");
    }
  }, [user, loading, setLocation]);

  // Update driver location periodically
  const updateLocation = trpc.location.update.useMutation();

  useEffect(() => {
    if (!user) return;

    const updateDriverLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            updateLocation.mutate({
              lat: position.coords.latitude.toString(),
              lng: position.coords.longitude.toString(),
            });
          },
          (error) => {
            console.error("Error getting location:", error);
          }
        );
      }
    };

    // Update location immediately
    updateDriverLocation();

    // Update location every 10 seconds
    const interval = setInterval(updateDriverLocation, 10000);

    return () => clearInterval(interval);
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      accepted: "Aceita - Indo buscar",
      in_progress: "Em andamento",
    };
    return statusMap[status] || status;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="CenterTáxi" className="h-10 w-auto" />
          <h1 className="text-xl font-bold text-card-foreground">CenterTáxi Motorista</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/history-driver")}>
            Histórico
          </Button>
          <Button variant="ghost" size="sm" onClick={() => logout()}>
            Sair
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
          {/* Active Ride */}
          {activeRide && (
            <Card className="p-6 bg-card border-border">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-card-foreground">Corrida Ativa</h2>
                  <span className="text-sm font-medium text-primary">
                    {getStatusText(activeRide.status)}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm text-muted-foreground">Origem</div>
                      <div className="text-card-foreground">{activeRide.originAddress}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm text-muted-foreground">Destino</div>
                      <div className="text-card-foreground">{activeRide.destinationAddress}</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Navigation className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{activeRide.distanceKm} km</span>
                  </div>
                  <div className="flex items-center gap-1 text-xl font-bold text-primary">
                    <DollarSign className="h-5 w-5" />
                    <span>R$ {activeRide.priceEstimate}</span>
                  </div>
                </div>

                <div className="pt-3 space-y-2">
                  {activeRide.status === "accepted" && (
                    <Button
                      size="lg"
                      className="w-full"
                      onClick={() => startRide.mutate({ rideId: activeRide.id })}
                      disabled={startRide.isPending}
                    >
                      {startRide.isPending ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                          Iniciando...
                        </>
                      ) : (
                        <>
                          <Play className="h-5 w-5 mr-2" />
                          Iniciar corrida
                        </>
                      )}
                    </Button>
                  )}

                  {activeRide.status === "in_progress" && (
                    <Button
                      size="lg"
                      className="w-full"
                      onClick={() => completeRide.mutate({ rideId: activeRide.id })}
                      disabled={completeRide.isPending}
                    >
                      {completeRide.isPending ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                          Finalizando...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-5 w-5 mr-2" />
                          Finalizar corrida
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Available Rides */}
          {!activeRide && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Corridas Disponíveis</h2>
              
              {!availableRides || availableRides.length === 0 ? (
                <Card className="p-8 text-center bg-card border-border">
                  <Car className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Nenhuma corrida disponível no momento
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Aguardando novas solicitações...
                  </p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {availableRides.map((ride) => (
                    <Card key={ride.id} className="p-4 bg-card border-border hover:border-primary/50 transition-colors">
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="text-xs text-muted-foreground">Origem</div>
                              <div className="text-sm text-card-foreground">{ride.originAddress}</div>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="text-xs text-muted-foreground">Destino</div>
                              <div className="text-sm text-card-foreground">{ride.destinationAddress}</div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-border">
                          <div className="flex items-center gap-2">
                            <Navigation className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{ride.distanceKm} km</span>
                          </div>
                          <div className="flex items-center gap-1 text-lg font-semibold text-primary">
                            <DollarSign className="h-5 w-5" />
                            <span>R$ {ride.priceEstimate}</span>
                          </div>
                        </div>

                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => acceptRide.mutate({ rideId: ride.id })}
                          disabled={acceptRide.isPending}
                        >
                          {acceptRide.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Aceitando...
                            </>
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Aceitar corrida
                            </>
                          )}
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
