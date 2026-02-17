import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Car, MapPin, Navigation, DollarSign, ArrowLeft, Clock } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function History() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  const { data: rides, isLoading } = trpc.rides.getHistory.useQuery();

  useEffect(() => {
    if (!loading && (!user || user.role !== "passenger")) {
      setLocation("/");
    }
  }, [user, loading, setLocation]);

  if (loading || isLoading) {
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/passenger")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
            <Car className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold text-card-foreground">Histórico de Corridas</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container max-w-2xl mx-auto px-4 py-6">
          {!rides || rides.length === 0 ? (
            <Card className="p-8 text-center bg-card border-border">
              <Clock className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhuma corrida realizada ainda</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {rides.map((ride) => (
                <Card key={ride.id} className="p-4 bg-card border-border">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(ride.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                      <span className={`text-sm font-medium ${getStatusColor(ride.status)}`}>
                        {getStatusText(ride.status)}
                      </span>
                    </div>

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
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
